/**
 * ExplainableShell — Pure orchestrator for explainable pipeline visualization.
 *
 * Collapsible sections use the **line + centered pill** pattern:
 * - Collapsed = thin divider line with a pill button sitting on it
 * - Expanded = full content with a pill at the closing edge
 *
 * Sub-components are memo'd to minimize re-renders when scrubbing the
 * time-travel slider. Only components that depend on snapshotIdx re-render.
 *
 * Consumer controls theme via --fp-* CSS custom properties.
 */
import { memo, useState, useCallback, useMemo, useRef, useEffect } from "react";
import type { ReactNode } from "react";
import type { StageSnapshot, BaseComponentProps, NarrativeEntry } from "../../types";
import { theme, themeModeVars } from "../../theme";
import { buildDataTrace } from "./_internal/dataTrace";
import { buildTraceWalk, type TraceIngredient, type TraceWalk } from "./_internal/traceWalk";
import { TraceWalkCard } from "../DataTracePanel/TraceWalkCard";
import { DataTracePanel } from "../DataTracePanel/DataTracePanel";
import type { TracingRail } from "../TimeTravelControls/TimeTravelControls";
import { extractSubflowNarrative } from "../../utils/narrativeSync";
import {
  toVisualizationSnapshots,
  subflowResultToSnapshots,
  narrativeRecorderFromSnapshot,
} from "../../adapters/fromRuntimeSnapshot";
import { overlayFromSnapshot } from "../../adapters/overlayFromSnapshot";
import { devWarn } from "../FlowchartView/_internal/devWarn";
import { ResultPanel } from "../ResultPanel";
import { GanttTimeline } from "../GanttTimeline";
import { TimeTravelControls } from "../TimeTravelControls";
import { MemoryPanel } from "../MemoryPanel";
import { NarrativePanel } from "../NarrativePanel";
import { SubflowTree } from "../FlowchartView/SubflowTree";
import { SubflowBreadcrumb } from "../FlowchartView/SubflowBreadcrumb";
import { TracedFlow } from "../FlowchartView/TracedFlow";
import { buildSubflowBreadcrumb } from "../FlowchartView/_internal/subflowDrill";

/**
 * Minimal subflow-walking spec shape. Used INTERNALLY by drill-down
 * resolution (which navigates `subflowStructure` to find a child chart
 * inside the parent's serialized structure). No longer used for chart
 * rendering — that happens via `traceGraph` + `<TracedFlow>` exclusively.
 *
 * Kept as a local type so the file no longer depends on any legacy
 * spec-walk module.
 */
export interface SpecNode {
  name: string;
  id?: string;
  description?: string;
  children?: SpecNode[];
  next?: SpecNode;
  isSubflowRoot?: boolean;
  subflowId?: string;
  subflowName?: string;
  subflowStructure?: SpecNode;
}
import { InspectorPanel } from "../InspectorPanel/InspectorPanel";
import { InsightPanel } from "../InsightPanel/InsightPanel";
import { CompactTimeline } from "../CompactTimeline/CompactTimeline";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Tab ID — "result", "memory", "narrative", or any custom recorder view ID. */
export type ShellTab = string;

/**
 * The whole-surface view that exists ONLY in unstyled mode: chart, memory,
 * narrative and timeline in one scroll, rather than one tab at a time.
 * `"ai-compatible"` is the historical spelling and still answers to it.
 */
const EXPLAINABLE_TAB_ID = "explainable";
function isExplainableTab(tabId: string): boolean {
  return tabId === EXPLAINABLE_TAB_ID || tabId === "ai-compatible";
}


interface SubflowLevel {
  subflowId: string;
  label: string;
  /** Null on the recorder-driven (traceGraph) path — there is no spec tree;
   *  the level is resolved from the mount stage's `subflowResult` instead. */
  spec: SpecNode | null;
  snapshots: StageSnapshot[];
  /** Subflow-scoped, subflow-renumbered narrative for the Story panel while
   *  drilled in (so it reveals to the subflow-local cursor, not whole-run). */
  narrative?: NarrativeEntry[];
}

interface DrillDownEntry extends SubflowLevel {
  parentSnapshotIdx: number;
}

export interface PanelLabels {
  /** Left panel pill label (subflow tree). Default: "Topology" */
  topology?: string;
  /** Right panel pill label (memory/narrative). Default: "Details" */
  details?: string;
  /** Bottom panel pill label (timeline). Default: "Timeline" */
  timeline?: string;
}

/** Which panels start expanded. Default: `{ details: true }` (flowchart + memory). */
export interface DefaultExpanded {
  topology?: boolean;
  details?: boolean;
  timeline?: boolean;
}

/**
 * Raw runtime snapshot from FlowChartExecutor.getSnapshot().
 * When provided, ExplainableShell converts it internally — zero boilerplate.
 */
export interface RuntimeSnapshotInput {
  sharedState: Record<string, unknown>;
  executionTree: unknown;
  commitLog: unknown[];
  subflowResults?: Record<string, unknown>;
  /** Recorder snapshots from toSnapshot() — auto-generates detail tabs. */
  recorders?: Array<{
    id: string;
    name: string;
    description?: string;
    preferredOperation?: 'translate' | 'accumulate' | 'aggregate';
    data: unknown;
  }>;
}

/**
 * A recorder view that appears as a tab in the details panel.
 * Each recorder provides its own per-stage rendering.
 * Memory and Narrative are built-in defaults — add more via this prop.
 */
export interface RecorderView {
  /** Unique key for this view tab */
  id: string;
  /** Display label on the tab */
  name: string;
  /** Short description shown as tooltip and header for auto-detected views.
   *  e.g., "Per-step timing and I/O counts (KeyedRecorder)" */
  description?: string;
  /**
   * Render function — receives the current snapshot index and all snapshots.
   * Return a React node to display in the details panel.
   */
  render: (props: { snapshots: StageSnapshot[]; selectedIndex: number }) => React.ReactNode;
}

/**
 * The Trace flowchart's two-colour theme (footprintjs level).
 *
 * `mode` is the COARSE switch: it applies eui's full light or dark preset
 * (`coolLight` / `coolDark`) as `--fp-*` variables on the shell root, so the
 * ENTIRE shell — canvas, panels, nodes, text, borders — follows dark/light from
 * this one field. You do NOT need to hand-set `--fp-*` yourself. (`--fp-*`
 * remains available as a fine escape hatch for individual token overrides.)
 *
 * `visited` and `current` are the two semantic node colours, layered on top of
 * the mode base. All optional — sensible per-mode defaults are used for anything
 * omitted.
 */
export interface TraceTheme {
  mode?: "dark" | "light";
  /** Executed / done nodes. */
  visited?: string;
  /** The node at the current cursor position ("now"). */
  current?: string;
}

export interface ExplainableShellProps extends BaseComponentProps {
  /**
   * Pre-converted visualization snapshots. Use when you've already called
   * toVisualizationSnapshots() yourself.
   */
  snapshots?: StageSnapshot[];
  /**
   * Raw runtime snapshot from executor.getSnapshot(). The shell converts it
   * internally via toVisualizationSnapshots(). When provided, `snapshots`
   * and `resultData` are derived automatically. Pair with
   * `narrativeEntries` for rich per-stage narrative.
   *
   * Usage: `<ExplainableShell runtimeSnapshot={executor.getSnapshot()} narrativeEntries={executor.getNarrativeEntries()} traceGraph={graph} runtimeOverlay={overlay} />`
   */
  runtimeSnapshot?: RuntimeSnapshotInput | null;
  /**
   * Build-time graph captured live via `createTraceStructureRecorder`.
   * REQUIRED for chart rendering (v6+) — the legacy `spec` →
   * legacy spec-walk post-walk path was removed in favor of this
   * recorder-driven graph.
   *
   * Pair with `runtimeOverlay` for the full time-travel trace UI.
   * When `traceGraph` is set but `runtimeOverlay` is absent, the
   * chart renders without runtime coloring (build-time-only view).
   *
   * The `spec` prop, when also provided, is used INTERNALLY for
   * subflow drill-down resolution (navigating `subflowStructure` to
   * find a child chart inside the parent's serialized structure) —
   * NOT for rendering.
   */
  traceGraph?: import("../FlowchartView/traceStructureRecorder").TraceGraph | null;
  /**
   * Runtime overlay captured live via `createTraceRuntimeOverlay` — the
   * per-step colouring that lights the executed path.
   *
   * **Usually leave it off.** When `runtimeSnapshot` is given and this prop
   * is absent, the shell rebuilds the overlay from the snapshot's own commit
   * log (`overlayFromSnapshot`), so a replayed recording colours its chart
   * exactly like the live run did. Pass it only to override that — a live
   * `createTraceRuntimeOverlay` handle sees a little more than a recording
   * can (errors, subflow internals, wall-clock).
   *
   * For a deliberately uncoloured (build-time-only) chart pass an EMPTY
   * overlay — `{ executionOrder: [], errors: new Map(), running: false }`.
   * Omitting the prop no longer means "no colours"; it means "work it out
   * from the snapshot", because omitting it was how every replay ended up
   * grey.
   */
  runtimeOverlay?: import("../FlowchartView/createTraceRuntimeOverlay").RuntimeOverlay | null;
  /**
   * Trace flowchart theme — the footprintjs-LEVEL **two-colour** scheme:
   * `visited` (executed nodes) + `current` (the cursor node). `mode` is the
   * coarse light/dark switch — it applies eui's full preset to the whole shell,
   * so you pass one word instead of a wall of `--fp-*` vars. Colours are optional
   * — omit to use the per-mode defaults. The agent-semantic three-colour theme
   * belongs to `<Lens>`, not here.
   */
  traceTheme?: TraceTheme;
  title?: string;
  resultData?: Record<string, unknown> | null;
  logs?: string[];
  /** Structured narrative entries from `executor.getNarrativeEntries()`.
   *  This is the only narrative input — the flat-string form was
   *  removed; call `.map(e => e.text)` if you need it.
   *
   *  Optional when `runtimeSnapshot` is given: a run recorded with
   *  footprintjs's narrative recorder carries its entries inside the
   *  snapshot, and the shell reads them from there. Pass this prop to
   *  override that (it always wins). */
  narrativeEntries?: NarrativeEntry[];
  /**
   * @deprecated Never had an effect and now warns in dev. Use `hideTabs` to
   * drop tabs by id and `defaultTab` to choose which one opens first.
   *
   * It was documented as `["result", "explainable"]`, but `"explainable"` is
   * not a tab in the styled shell at all — it is the unstyled whole-surface
   * view — so honouring this list literally would have cut every styled shell
   * down to a lone Result tab. There is no reading of it that is both
   * faithful to the documented default and safe, which is why it is going
   * rather than getting wired.
   */
  tabs?: ShellTab[];
  defaultTab?: ShellTab;
  hideConsole?: boolean;
  /** Hide specific detail tabs (e.g., ['result', 'memory']). */
  hideTabs?: string[];
  /** Customize the labels on collapsible panel pills */
  panelLabels?: PanelLabels;
  /** Which panels start expanded. Default: `{ details: true }` */
  defaultExpanded?: DefaultExpanded;
  /**
   * Recorder views — each becomes a tab in the details panel.
   * Default: Memory + Narrative. Pass additional recorder views
   * to show tokens, cost, tools, permissions, or custom data.
   *
   * Usage:
   *   recorderViews={[
   *     { id: 'tokens', name: 'Tokens', render: ({ selectedIndex }) => <div>...</div> },
   *   ]}
   */
  recorderViews?: RecorderView[];
  /**
   * Custom flowchart renderer. When omitted, ExplainableShell renders
   * via `<TracedFlow graph={traceGraph} overlay={runtimeOverlay} />` —
   * the recorder-driven path. Override to plug a custom chart UI; the
   * `spec` parameter is forwarded only for backward-compatible
   * signatures (it's the same SpecNode used for drill-down) and may
   * be `null` once consumers stop threading it in.
   */
  renderFlowchart?: (props: {
    spec: SpecNode | null;
    snapshots: StageSnapshot[];
    selectedIndex: number;
    onNodeClick?: (indexOrId: number | string) => void;
    showStageId?: boolean;
    /** Dependency-cone overlay (chart node id → BFS depth) — painted while
     *  the Inspector's Data Trace tab is open. Custom renderers may ignore it. */
    sliceCone?: ReadonlyMap<string, number>;
    /** The shell's CURRENT drill scope — the mount node's id, or `null` at the
     *  top level. The shell owns the one drill state, so a chart that keeps
     *  its own must follow this or it will show a different level than the
     *  breadcrumb, story and timeline beside it. */
    currentSubflowId?: string | null;
    /** Call to MOVE the shell's drill: a mount node's id to drill in, `null`
     *  to pop back to the top. */
    onSubflowChange?: (mountStageId: string | null) => void;
  }) => React.ReactNode;
  /**
   * When true, render each node's stable `stageId` as a small monospace
   * caption beneath the label in the default flowchart renderer.
   * Teaching aid: it reveals the key recorders use
   * (`runtimeStageId = [subflowPath/]stageId#executionIndex`) so a
   * consumer can map any recorder's per-stage data back to a node.
   * Default false.
   */
  showStageId?: boolean;
}

// ---------------------------------------------------------------------------
// Line + Pill — collapsed state is just a line with a pill centered on it
// ---------------------------------------------------------------------------

/** Horizontal line with centered pill (for top/bottom edges) */
const HLinePill = memo(function HLinePill({
  label,
  detail,
  expanded,
  onClick,
}: {
  label: string;
  detail?: string;
  expanded: boolean;
  onClick: () => void;
}) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 0,
      padding: "0",
    }}>
      <div style={{ flex: 1, height: 1, background: theme.border }} />
      <button
        onClick={onClick}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          padding: "3px 12px",
          margin: "4px 0",
          fontSize: 10,
          fontWeight: 600,
          fontFamily: "inherit",
          color: theme.textMuted,
          background: theme.bgSecondary,
          border: `1px solid ${theme.border}`,
          borderRadius: 10,
          cursor: "pointer",
          whiteSpace: "nowrap",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          transition: "color 0.15s ease",
        }}
      >
        <span style={{ fontSize: 7 }}>{expanded ? "▼" : "▶"}</span>
        {label}
        {detail && <span style={{ fontWeight: 400, opacity: 0.5, fontSize: 9 }}>{detail}</span>}
      </button>
      <div style={{ flex: 1, height: 1, background: theme.border }} />
    </div>
  );
});

/** Vertical line with centered pill (for left/right edges).
 *  `side` controls arrow direction:
 *  - "right": expanded=▶ collapsed=◀ (panel is on right, collapses right)
 *  - "left":  expanded=◀ collapsed=▶ (panel is on left, collapses left)
 */
const VLinePill = memo(function VLinePill({
  label,
  expanded,
  side = "right",
  onClick,
}: {
  label: string;
  expanded: boolean;
  side?: "left" | "right";
  onClick: () => void;
}) {
  const arrow = side === "right"
    ? (expanded ? "▶" : "◀")
    : (expanded ? "◀" : "▶");
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 0,
      padding: "0",
    }}>
      <div style={{ flex: 1, width: 1, background: theme.border }} />
      <button
        onClick={onClick}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "10px 4px",
          margin: "0 3px",
          fontSize: 10,
          fontWeight: 600,
          fontFamily: "inherit",
          color: theme.textMuted,
          background: theme.bgSecondary,
          border: `1px solid ${theme.border}`,
          borderRadius: 10,
          cursor: "pointer",
          whiteSpace: "nowrap",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          writingMode: "vertical-lr",
          transition: "color 0.15s ease",
        }}
      >
        <span style={{ fontSize: 7, writingMode: "horizontal-tb" }}>{arrow}</span>
        {label}
      </button>
      <div style={{ flex: 1, width: 1, background: theme.border }} />
    </div>
  );
});

// ---------------------------------------------------------------------------
// Diagnosis panels — what to do when an ingredient is missing
// ---------------------------------------------------------------------------
//
// Both of these exist because the shell used to fail by rendering LESS: no
// chart region, or full chrome with zero rows. Silence reads as "the library
// is broken"; naming the missing ingredient reads as "add this line".

/** Shown in the chart's place when there is a run to draw but no graph. */
const MissingChartNote = memo(function MissingChartNote({ unstyled }: { unstyled?: boolean }) {
  const body = (
    <>
      <strong>No chart — `traceGraph` was not provided.</strong>
      <div>
        A snapshot holds the memory, the story and the timeline. Only the chart's own
        structure can draw the chart. Two ways to get one:
      </div>
      <pre style={unstyled ? undefined : { margin: 0, whiteSpace: "pre-wrap", fontFamily: theme.fontMono, fontSize: 11 }}>
{`// live build
const trace = createTraceStructureRecorder();
flowChart(..., { structureRecorders: [trace.recorder] });
<ExplainableShell traceGraph={trace.getGraph()} />

// saved run — save chart.buildTimeStructure with your snapshot
<ExplainableShell traceGraph={graphFromStructure(saved.structure)} />`}
      </pre>
    </>
  );
  if (unstyled) return <div data-fp="shell-missing-chart">{body}</div>;
  return (
    <div
      data-fp="shell-missing-chart"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        justifyContent: "center",
        alignItems: "flex-start",
        height: "100%",
        padding: 20,
        color: theme.textMuted,
        fontSize: 12,
        lineHeight: 1.5,
        maxWidth: 520,
        margin: "0 auto",
      }}
    >
      {body}
    </div>
  );
});

/** Shown instead of empty chrome when there are no stages to show at all. */
const EmptyShell = memo(function EmptyShell({
  reason,
  detail,
  unstyled,
  className,
  style,
}: {
  reason: string;
  detail: React.ReactNode;
  unstyled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const body = (
    <>
      <div style={unstyled ? undefined : { fontWeight: 700, color: theme.textPrimary, fontSize: 13 }}>
        {reason}
      </div>
      <div data-fp="shell-empty-detail">{detail}</div>
    </>
  );
  if (unstyled) {
    return (
      <div className={className} style={style} data-fp="shell-empty">
        {body}
      </div>
    );
  }
  return (
    <div
      className={className}
      data-fp="shell-empty"
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        padding: 24,
        background: theme.bgPrimary,
        color: theme.textMuted,
        fontFamily: theme.fontSans,
        fontSize: 12,
        lineHeight: 1.6,
        ...style,
      }}
    >
      {body}
    </div>
  );
});

// ---------------------------------------------------------------------------
// KeyedRecorderView — Time-travel aware renderer for auto-detected recorders
// ---------------------------------------------------------------------------

/**
 * Detects if data has a keyed-recorder shape: an object property whose values
 * are objects with at least one numeric field. Returns { steps, keyType }.
 * keyType: 'runtimeStageId' (keys contain '#') or 'stageName' (plain names).
 */
function detectKeyedSteps(data: unknown): { steps: Record<string, Record<string, unknown>>; keyType: "runtimeStageId" | "stageName" } | null {
  if (!data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;
  for (const val of Object.values(obj)) {
    if (val && typeof val === "object" && !Array.isArray(val)) {
      const entries = Object.entries(val as Record<string, unknown>);
      if (entries.length === 0) continue;
      // Check: values must be objects with at least one numeric field
      const allObjectsWithNumbers = entries.every(([, v]) => {
        if (!v || typeof v !== "object" || Array.isArray(v)) return false;
        return Object.values(v as Record<string, unknown>).some((f) => typeof f === "number");
      });
      if (allObjectsWithNumbers) {
        const keyType = entries.some(([k]) => k.includes("#")) ? "runtimeStageId" : "stageName";
        return { steps: val as Record<string, Record<string, unknown>>, keyType };
      }
    }
  }
  return null;
}

/** Extract render hints from recorder data: numericField name + grandTotal. */
function extractRenderHints(data: unknown): { numericField: string; grandTotal: number } | null {
  if (!data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;
  if (typeof obj.numericField === "string" && typeof obj.grandTotal === "number") {
    return { numericField: obj.numericField, grandTotal: obj.grandTotal };
  }
  return null;
}

function KeyedRecorderView({
  data,
  description,
  preferredOperation = "accumulate",
  snapshots,
  selectedIndex,
}: {
  data: unknown;
  description?: string;
  preferredOperation?: "translate" | "accumulate" | "aggregate";
  snapshots: StageSnapshot[];
  selectedIndex: number;
}) {
  const [showAggregate, setShowAggregate] = useState(false);

  const detected = useMemo(() => detectKeyedSteps(data), [data]);

  // Visible keys up to slider position — match by runtimeStageId or stageName
  const visibleKeys = useMemo(() => {
    const keys = new Set<string>();
    for (let i = 0; i <= selectedIndex && i < snapshots.length; i++) {
      const snap = snapshots[i];
      if (detected?.keyType === "runtimeStageId") {
        if (snap.runtimeStageId) keys.add(snap.runtimeStageId);
      } else {
        // Match by stageName or stageLabel
        if (snap.stageName) keys.add(snap.stageName);
        if (snap.stageLabel) keys.add(snap.stageLabel);
      }
    }
    return keys;
  }, [snapshots, selectedIndex, detected?.keyType]);

  const isAtEnd = selectedIndex >= snapshots.length - 1;

  if (!detected) {
    // Fallback: raw JSON for non-keyed data
    return (
      <div style={{ padding: 12, fontFamily: theme.fontMono, fontSize: 11, whiteSpace: "pre-wrap", overflow: "auto", height: "100%" }}>
        {typeof data === "string" ? data : JSON.stringify(data, null, 2)}
      </div>
    );
  }

  const steps = detected.steps;
  const hints = extractRenderHints(data);
  const numFieldKey = hints?.numericField ?? "";

  // Progressive entries (accumulate)
  const allKeys = Object.keys(steps);
  const visibleEntries = allKeys.filter((k) => visibleKeys.has(k));

  // Running total — computed from visible entries using the declared numeric field
  let runningTotal = 0;
  if (numFieldKey) {
    for (const k of visibleEntries) {
      runningTotal += (steps[k][numFieldKey] as number) ?? 0;
    }
  }

  // Grand total — provided by the recorder, not recomputed
  const grandTotal = hints?.grandTotal ?? 0;

  return (
    <div style={{ overflow: "auto", height: "100%", display: "flex", flexDirection: "column" }}>
      {description && (
        <div style={{ padding: "6px 12px", fontSize: 11, color: theme.textMuted, fontStyle: "italic", borderBottom: `1px solid ${theme.border}`, flexShrink: 0 }}>
          {description}
        </div>
      )}

      <div style={{ padding: 12, flex: 1, overflow: "auto" }}>
        {/* ── Primary: depends on preferredOperation ── */}

        {preferredOperation === "aggregate" ? (
          /* AGGREGATE: collect silently during scrub, button at end to reveal total */
          <>
            {isAtEnd ? (
              <div style={{ marginBottom: 16 }}>
                {!showAggregate ? (
                  <button
                    onClick={() => setShowAggregate(true)}
                    style={{
                      background: theme.primary, color: "#fff", border: "none", borderRadius: 8,
                      padding: "12px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                      fontFamily: "inherit", width: "100%",
                    }}
                  >
                    Aggregate — Show Grand Total
                  </button>
                ) : (
                  <div style={{ padding: "14px 16px", background: `color-mix(in srgb, ${theme.success} 12%, transparent)`, borderRadius: 8, border: `1px solid ${theme.success}44` }}>
                    <div style={{ fontSize: 10, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, fontWeight: 600 }}>
                      Aggregate — grand total
                    </div>
                    {numFieldKey && (
                      <div style={{ fontSize: 26, fontWeight: 700, color: theme.success }}>
                        {grandTotal < 1 ? grandTotal.toFixed(3) : grandTotal.toFixed(1)}
                        <span style={{ fontSize: 11, color: theme.textMuted, fontWeight: 400, marginLeft: 8 }}>{numFieldKey} &middot; {allKeys.length} steps</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: "10px 14px", background: `color-mix(in srgb, ${theme.textMuted} 6%, transparent)`, borderRadius: 6, marginBottom: 16, border: `1px dashed ${theme.border}` }}>
                <div style={{ fontSize: 10, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
                  Collecting data...
                </div>
                <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 4 }}>
                  {visibleEntries.length} of {allKeys.length} steps collected. Scrub to end to aggregate.
                </div>
              </div>
            )}
            <div style={{ fontSize: 10, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, fontWeight: 600 }}>
              Per-step detail
            </div>
          </>
        ) : preferredOperation === "accumulate" ? (
          /* ACCUMULATE: running total grows with slider — IS the total at end, no button */
          <>
            {numFieldKey && visibleEntries.length > 0 && (
              <div style={{ padding: "10px 14px", background: `color-mix(in srgb, ${theme.primary} 8%, transparent)`, borderRadius: 6, marginBottom: 16 }}>
                <div style={{ fontSize: 10, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4, fontWeight: 600 }}>
                  Accumulate — running total up to this step
                </div>
                <span style={{ fontWeight: 700, fontSize: 18, color: theme.primary }}>
                  {runningTotal < 1 ? runningTotal.toFixed(3) : runningTotal.toFixed(1)}
                </span>
                <span style={{ color: theme.textMuted, marginLeft: 8, fontSize: 10 }}>
                  {numFieldKey} &middot; {visibleEntries.length} of {allKeys.length} steps
                </span>
              </div>
            )}
            <div style={{ fontSize: 10, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, fontWeight: 600 }}>
              Per-step detail
            </div>
          </>
        ) : (
          /* TRANSLATE: per-step entries prominent, no totals */
          <div style={{ fontSize: 10, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, fontWeight: 600 }}>
            Translate — per-step detail
          </div>
        )}

        {/* ── Per-step entries (always shown) ── */}
        {visibleEntries.map((key) => {
          const entry = steps[key];
          const label = (entry.stageName as string) ?? key;
          const numVal = numFieldKey ? (entry[numFieldKey] as number) : undefined;
          return (
            <div key={key} style={{ display: "flex", alignItems: "center", padding: "4px 0", fontSize: 12, fontFamily: theme.fontMono, borderBottom: `1px solid ${theme.border}22` }}>
              <span style={{ color: theme.textMuted, width: 140, flexShrink: 0, fontSize: 10 }}>{key}</span>
              <span style={{ fontWeight: 600, flex: 1 }}>{label}</span>
              {numVal !== undefined && (
                <span style={{ color: theme.primary, fontWeight: 700, marginLeft: 8 }}>
                  {numVal < 1 ? numVal.toFixed(3) : numVal.toFixed(1)}
                </span>
              )}
            </div>
          );
        })}

        {visibleEntries.length === 0 && (
          <div style={{ color: theme.textMuted, fontSize: 11, fontStyle: "italic", padding: "8px 0" }}>
            Scrub the slider to reveal entries...
          </div>
        )}

      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DetailsContent — Recorder-driven tab switcher (Memory + Narrative are defaults)
// ---------------------------------------------------------------------------

const DetailsContent = memo(function DetailsContent({
  snapshots,
  selectedIndex,
  narrativeEntries,
  size,
  fillHeight,
  extraViews,
}: {
  snapshots: StageSnapshot[];
  selectedIndex: number;
  narrativeEntries?: NarrativeEntry[];
  size: "compact" | "default" | "detailed";
  fillHeight?: boolean;
  extraViews?: RecorderView[];
}) {
  // Built-in views (always available)
  const builtInViews: RecorderView[] = [
    {
      id: "memory",
      name: "Memory",
      render: ({ snapshots: snaps, selectedIndex: idx }) => (
        <MemoryPanel snapshots={snaps} selectedIndex={idx} size={size} style={fillHeight ? { height: "100%" } : undefined} />
      ),
    },
    {
      id: "narrative",
      name: "Narrative",
      render: ({ snapshots: snaps, selectedIndex: idx }) => (
        <NarrativePanel snapshots={snaps} selectedIndex={idx} narrativeEntries={narrativeEntries} size={size} style={fillHeight ? { height: "100%" } : undefined} />
      ),
    },
  ];

  const allViews = [...builtInViews, ...(extraViews ?? [])];
  const [activeViewId, setActiveViewId] = useState(allViews[0]?.id ?? "memory");

  // Reset tab when available views change (e.g., recorder toggled on/off)
  const viewIds = allViews.map((v) => v.id).join(",");
  useEffect(() => {
    if (!allViews.find((v) => v.id === activeViewId)) {
      setActiveViewId(allViews[0]?.id ?? "memory");
    }
  }, [viewIds]); // eslint-disable-line react-hooks/exhaustive-deps
  const activeView = allViews.find((v) => v.id === activeViewId) ?? allViews[0];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Tab switcher — one per recorder view */}
      <div style={{ display: "flex", borderBottom: `1px solid ${theme.border}`, flexShrink: 0, overflowX: "auto" }}>
        {allViews.map((view) => {
          const active = view.id === activeViewId;
          return (
            <button
              key={view.id}
              onClick={() => setActiveViewId(view.id)}
              style={{
                flex: allViews.length <= 3 ? 1 : undefined,
                padding: "6px 8px", fontSize: 11,
                fontWeight: active ? 600 : 400,
                color: active ? theme.primary : theme.textMuted,
                background: active ? `color-mix(in srgb, ${theme.primary} 8%, transparent)` : "transparent",
                border: "none",
                borderBottom: active ? `2px solid ${theme.primary}` : "2px solid transparent",
                cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "inherit",
                whiteSpace: "nowrap",
              }}
            >
              {view.name}
            </button>
          );
        })}
      </div>
      <div style={{ flex: 1, overflow: "auto" }}>
        {activeView?.render({ snapshots, selectedIndex })}
      </div>
    </div>
  );
});

// ---------------------------------------------------------------------------
// Subflow resolution helpers
// ---------------------------------------------------------------------------

/**
 * Recorder-driven drill resolution. There is no spec tree on the traceGraph
 * path, so the subflow level is resolved straight from the mount stage's
 * recorded `subflowResult` — so all four panels (slider / story / overlay /
 * chart) rescope to the subflow together.
 *
 * `drillKey` is the mount NODE's id, which is path-qualified
 * (`pipeline/prepare`) whenever the mount sits inside another subflow.
 * Matching is TIERED — full path first, then a path suffix, and only then the
 * bare-local-id fallbacks. The order matters: two mounts of the same child
 * chart share a local id, so a loose match lands on whichever mount comes
 * first in the array rather than the one that was clicked.
 */
function resolveSubflowFromRuntime(
  parentSnapshots: StageSnapshot[],
  drillKey: string,
  narrativeEntries?: NarrativeEntry[],
  subflowResults?: Record<string, unknown>,
): SubflowLevel | null {
  const localId = drillKey.split("/").pop() ?? drillKey;
  const pathOf = (s: StageSnapshot): string | undefined =>
    s.runtimeStageId?.split("#")[0];
  const withResult = parentSnapshots.filter((s) => !!s.subflowResult);
  const parentSnap =
    // Tier 1 — this exact mount, by full path.
    withResult.find((s) => s.subflowId === drillKey || pathOf(s) === drillKey) ??
    // Tier 2 — the same mount seen from inside its own subflow, where the
    // enclosing prefix has been stripped off the ids.
    withResult.find((s) => {
      const p = pathOf(s);
      return (
        (p !== undefined && drillKey.endsWith("/" + p)) ||
        (s.subflowId !== undefined && drillKey.endsWith("/" + s.subflowId))
      );
    }) ??
    // Tier 3 — legacy callers that drill by a bare subflow id or a label.
    withResult.find((s) => {
      const leaf = pathOf(s)?.split("/").pop();
      return (
        s.subflowId === localId ||
        s.stageName === drillKey ||
        s.stageLabel === drillKey ||
        leaf === drillKey ||
        leaf === localId
      );
    });
  if (!parentSnap?.subflowResult) return null;
  const label = parentSnap.stageLabel ?? parentSnap.stageName ?? localId;
  const sfNarrative = narrativeEntries
    ? extractSubflowNarrative(narrativeEntries, drillKey, label)
    : undefined;
  const sfSnapshots = subflowResultToSnapshots(
    parentSnap.subflowResult,
    sfNarrative,
    subflowResults,
  );
  if (sfSnapshots.length === 0) return null;
  return { subflowId: drillKey, label, spec: null, snapshots: sfSnapshots, narrative: sfNarrative };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// RightPanel — two-mode panel: Insights vs Inspector
// ---------------------------------------------------------------------------

/**
 * The right column's three modes.
 *
 * `result` is the home the Result view never had on desktop: the tabbed
 * details panel only renders below 640px, and the Insights list deliberately
 * holds Result back (an Insight is recorder-derived; the Result is the run's
 * output) — so `resultData`, `logs` and `hideConsole` did nothing at all on
 * any shell wider than that. A third segment on the toggle that already
 * exists is the smallest place to put it that does not disturb which Insight
 * opens first, nor the "no recorders were attached" guidance the Insights
 * list shows when it is empty.
 */
type RightPanelMode = "insights" | "what" | "result";

const RIGHT_PANEL_MODE_LABELS: Record<RightPanelMode, string> = {
  insights: "Insights",
  what: "Inspector",
  result: "Result",
};

const RightPanel = memo(function RightPanel({
  mode,
  onModeChange,
  snapshots,
  selectedIndex,
  activeTab,
  allTabs,
  renderTabBody,
  size,
  onNavigateToStage,
  dataTrace,
  onInspectorTabChange,
  inspectorTab,
  traceContent,
}: {
  mode: RightPanelMode;
  onModeChange: (mode: RightPanelMode) => void;
  snapshots: StageSnapshot[];
  selectedIndex: number;
  activeTab: string;
  allTabs: Array<{ id: string; name: string; description?: string }>;
  /** Renders ONE tab's body. The shell owns the single implementation and
   *  hands it down, which is what makes the Result tab reachable here: this
   *  is the only tabbed surface on a desktop-width shell, so a tab it cannot
   *  render is a tab — and the `resultData` / `logs` / `hideConsole` props
   *  behind it — that does nothing. */
  renderTabBody: (tabId: string, plain: boolean) => ReactNode;
  size: "compact" | "default" | "detailed";
  onNavigateToStage: (id: string) => void;
  /** Precomputed backward slice for the Data Trace tab (lifted to the shell
   *  root so the chart's dependency cone shares the SAME frames). */
  dataTrace: { frames: import("./_internal/dataTrace").DataTraceFrame[]; readsAvailable: boolean };
  onInspectorTabChange?: (tab: "state" | "trace") => void;
  /** Controlled Inspector tab — the shell forces Data Trace open on tracing entry. */
  inspectorTab?: "state" | "trace";
  /** The Data Trace tab body (stop card while tracing / entry chips + frames list). */
  traceContent?: ReactNode;
}) {
  // The Result segment appears only when a Result tab exists, so
  // `hideTabs={["result"]}` still removes it everywhere.
  const modes = useMemo<readonly RightPanelMode[]>(
    () =>
      allTabs.some((t) => t.id === "result")
        ? (["insights", "what", "result"] as const)
        : (["insights", "what"] as const),
    [allTabs],
  );

  return (
    <>
      {/* Mode toggle */}
      <div style={{
        display: "flex",
        borderBottom: `1px solid ${theme.border}`,
        flexShrink: 0,
        background: theme.bgSecondary,
      }}>
        {modes.map((m) => (
          <button
            key={m}
            onClick={() => onModeChange(m)}
            style={{
              flex: 1,
              padding: "7px 12px",
              fontSize: 11,
              fontWeight: mode === m ? 700 : 500,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: mode === m ? theme.primary : theme.textMuted,
              background: "transparent",
              border: "none",
              borderBottom: mode === m ? `2px solid ${theme.primary}` : "2px solid transparent",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {RIGHT_PANEL_MODE_LABELS[m]}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        {mode === "result" ? (
          <div style={{ height: "100%", overflow: "auto" }}>{renderTabBody("result", false)}</div>
        ) : mode === "insights" ? (
          <InsightPanel
            mode="tabs"
            expandedId={activeTab}
            // Two tabs are held back, each with its own home: Memory (the
            // Inspector's State tab beside it is the same data) and Result
            // (its own mode on the toggle above — an Insight is recorder-
            // derived, the Result is the run's output).
            insights={allTabs.filter((t) => t.id !== "result" && t.id !== "memory").map((tab) => ({
              id: tab.id,
              name: insightName(tab.name),
              render: () => renderTabBody(tab.id, false),
            }))}
          />
        ) : (
          <InspectorPanel
            snapshots={snapshots}
            selectedIndex={selectedIndex}
            dataTraceFrames={dataTrace.frames}
            dataTraceNote={dataTrace.readsAvailable ? undefined : '⚠ reads were not recorded (readTracking off) — dependencies are unknowable, not absent.'}
            onTabChange={onInspectorTabChange}
            tab={inspectorTab}
            traceContent={traceContent}
            selectedStageId={snapshots[selectedIndex]?.runtimeStageId}
            onNavigateToStage={onNavigateToStage}
          />
        )}
      </div>
    </>
  );
});

/** Map internal recorder names to user-facing Insight names. */
function insightName(name: string): string {
  const map: Record<string, string> = {
    "Narrative": "Story",
    "Memory": "State",
    "Metrics": "Performance",
    "Quality": "Quality",
    "Cost": "Cost",
  };
  return map[name] ?? name;
}

export function ExplainableShell({
  snapshots: snapshotsProp,
  runtimeSnapshot,
  title,
  resultData: resultDataProp,
  logs = [],
  narrativeEntries: narrativeEntriesProp,
  tabs: deprecatedTabs,
  defaultTab,
  hideConsole = false,
  hideTabs: hideTabsProp,
  panelLabels,
  defaultExpanded,
  recorderViews,
  renderFlowchart,
  showStageId = false,
  traceGraph,
  runtimeOverlay: runtimeOverlayProp,
  traceTheme,
  size = "default",
  unstyled = false,
  className,
  style,
}: ExplainableShellProps) {
  // A run recorded WITH footprintjs's narrative recorder carries its story
  // inside the snapshot, so a replayed recording tells the same story the
  // live run did — no executor left to call getNarrativeEntries() on. The
  // prop always wins: a caller who passes entries (or deliberately passes
  // none but has a snapshot they don't want narrated) stays in control.
  const snapshotNarrative = useMemo(
    () => narrativeRecorderFromSnapshot(runtimeSnapshot),
    [runtimeSnapshot],
  );
  const narrativeEntries = narrativeEntriesProp ?? snapshotNarrative?.entries;

  // Convert runtimeSnapshot → visualization snapshots (zero-boilerplate mode).
  // A snapshot we cannot read is REMEMBERED, not swallowed: the empty state
  // below reports it instead of rendering full chrome with nothing in it.
  const derivedFromRuntime = useMemo(() => {
    if (!runtimeSnapshot) return null;
    try {
      const snaps = toVisualizationSnapshots(runtimeSnapshot as any, narrativeEntries as any);
      return { snapshots: snaps, resultData: runtimeSnapshot.sharedState, error: null as string | null };
    } catch (err) {
      return {
        snapshots: [] as StageSnapshot[],
        resultData: null,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }, [runtimeSnapshot, narrativeEntries]);

  // Use derived data when runtimeSnapshot is provided, otherwise use explicit props
  const snapshots = snapshotsProp ?? derivedFromRuntime?.snapshots ?? [];
  const resultData = resultDataProp ?? derivedFromRuntime?.resultData ?? null;

  // The chart's colouring, rebuilt from the recording when the caller didn't
  // hand us a live one. `runtimeSnapshot` + `traceGraph` with no overlay used
  // to render a fully grey chart with no warning — the single most common way
  // an integration "worked" but showed nothing. The commit log already holds
  // the execution order, so there is nothing to ask the consumer for.
  const runtimeOverlay = useMemo(
    () =>
      runtimeOverlayProp ??
      // The narrative rides along because retries leave no mark on the commit
      // log: a failed attempt discards its writes. Without it a replayed
      // retried stage would be the one thing the chart could not show.
      (runtimeSnapshot
        ? overlayFromSnapshot(runtimeSnapshot, { narrativeEntries })
        : undefined),
    [runtimeOverlayProp, runtimeSnapshot, narrativeEntries],
  );

  // A recording is THREE things — events, snapshot, structure — and only the
  // structure can draw the chart. Handed run data with no `traceGraph` the
  // shell used to omit the entire chart region in silence, which reads as
  // "this library doesn't draw charts" rather than "one ingredient is
  // missing". Say it once in the console, and once on screen (below).
  const missingChart = snapshots.length > 0 && !traceGraph?.nodes.length;
  useEffect(() => {
    if (!missingChart) return;
    devWarn(
      () =>
        "[ExplainableShell] No chart: `traceGraph` is missing, so the flowchart region is not rendered. " +
        "A snapshot cannot draw the chart — only the chart's own structure can. Two ways to get one:\n" +
        "  live build — const trace = createTraceStructureRecorder();\n" +
        "               flowChart(..., { structureRecorders: [trace.recorder] });\n" +
        "               <ExplainableShell traceGraph={trace.getGraph()} />\n" +
        "  saved run  — save `chart.buildTimeStructure` next to your snapshot, then\n" +
        "               <ExplainableShell traceGraph={graphFromStructure(saved.structure)} />",
    );
  }, [missingChart]);

  // Flowchart renderer selection (v6+ — recorder-driven only):
  //   - explicit `renderFlowchart` always wins (consumer override)
  //   - `traceGraph` → render via `<TracedFlow>` (event-driven graph
  //     + optional runtime overlay, no spec-tree post-walk)
  //
  // Consumers MUST pass `traceGraph` for chart visualization. The
  // legacy `spec={...}` → post-walk fallback was removed when the
  // recorder gained convergence-edge expansion (post-fork `next`
  // fires N edges, one per branch child) — the recorder graph is now
  // the single source of truth.
  const tracedFlowRenderer = useMemo(() => {
    if (!traceGraph) return undefined;
    return ({ selectedIndex, snapshots, onNodeClick, sliceCone, currentSubflowId, onSubflowChange }: {
      spec: SpecNode | null; snapshots: StageSnapshot[]; selectedIndex: number;
      onNodeClick?: (indexOrId: number | string) => void;
      showStageId?: boolean;
      sliceCone?: ReadonlyMap<string, number>;
      currentSubflowId?: string | null;
      onSubflowChange?: (mountStageId: string | null) => void;
    }) => {
      // The shell's `selectedIndex` indexes into `snapshots[]` (which
      // may be filtered to a drill-down subset). The overlay's
      // `executionOrder` is the FULL execution timeline (all stages
      // including subflow internals). When the two arrays have
      // different lengths, passing selectedIndex straight through
      // misaligns the chart's active highlight.
      //
      // Translate: take the runtimeStageId at snapshots[selectedIndex]
      // and find the matching position in overlay.executionOrder.
      // Fall back to selectedIndex when no overlay or no match
      // (charts without subflows have aligned indexes anyway).
      const activeRsid = snapshots[selectedIndex]?.runtimeStageId;
      let overlayIdx = selectedIndex;
      if (activeRsid && runtimeOverlay) {
        let i = runtimeOverlay.executionOrder.findIndex(
          (s) => s.runtimeStageId === activeRsid,
        );
        // Drilled-in subflow snapshots carry PREFIX-STRIPPED runtimeStageIds
        // (e.g. "gather#8" vs the overlay's "sf-injection-engine/gather#8"),
        // so the exact match misses and we'd fall back to the raw subflow-local
        // index — mixing index spaces and mis-coloring the whole run as "done".
        // Re-match by suffix so the subflow-local cursor maps to the correct
        // whole-run overlay position (Bug 2).
        if (i < 0) {
          i = runtimeOverlay.executionOrder.findIndex(
            (s) => s.runtimeStageId?.endsWith("/" + activeRsid),
          );
        }
        if (i >= 0) overlayIdx = i;
      }
      // Map the shell's 2-colour Trace theme onto TracedFlow's colour model:
      // `visited → done`, `current → active`, and a neutral base per mode. The
      // flowchart background stays transparent (inherits the container), so it
      // follows the consumer's dark/light automatically.
      const traceColors = traceTheme && {
        ...(traceTheme.visited !== undefined && { done: traceTheme.visited }),
        ...(traceTheme.current !== undefined && { active: traceTheme.current }),
        ...(traceTheme.mode !== undefined && { default: traceTheme.mode === "dark" ? "#94a3b8" : "#64748b" }),
      };
      return (
        <TracedFlow
          graph={traceGraph}
          overlay={runtimeOverlay ?? undefined}
          sliceCone={sliceCone ?? undefined}
          colors={traceColors || undefined}
          scrubIndex={overlayIdx}
          onNodeClick={(stageId) => onNodeClick?.(stageId)}
          // CONTROLLED drill: the shell owns the scope, the chart renders it.
          // Every gesture — a mount card here, a row in the Topology tree, the
          // breadcrumb — moves the same one value, so the chart can never show
          // a different level than the panels around it.
          currentSubflowId={currentSubflowId ?? null}
          onSubflowChange={(mountId) => onSubflowChange?.(mountId)}
        />
      );
    };
  }, [traceGraph, runtimeOverlay, traceTheme]);
  const effectiveRenderFlowchart = renderFlowchart ?? tracedFlowRenderer;
  const leftLabel = panelLabels?.topology ?? "Topology";
  const rightLabel = panelLabels?.details ?? "Details";
  const bottomLabel = panelLabels?.timeline ?? "Timeline";

  // Responsive: detect narrow container + notify children of size changes
  const shellRef = useRef<HTMLDivElement>(null);
  const [isNarrow, setIsNarrow] = useState(false);
  const [isMedium, setIsMedium] = useState(false);
  useEffect(() => {
    const el = shellRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      setIsNarrow(w < 640);
      setIsMedium(w >= 640 && w < 960);
      // Notify ReactFlow (and other layout-sensitive children) that our container resized
      window.dispatchEvent(new Event("resize"));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Auto-detect recorder views from runtimeSnapshot.recorders
  const autoRecorderViews = useMemo(() => {
    const recorders = (runtimeSnapshot as any)?.recorders as Array<{ id: string; name: string; description?: string; preferredOperation?: string; data: unknown }> | undefined;
    if (!recorders?.length) return [];
    // Don't auto-generate for IDs that have explicit recorderViews
    const explicitIds = new Set((recorderViews ?? []).map((v) => v.id));
    // ...nor for the recorder already rendered AS the Story tab — otherwise
    // the narrative shows twice: once as the story, once as raw entry JSON.
    if (snapshotNarrative?.id) explicitIds.add(snapshotNarrative.id);
    return recorders
      .filter((r) => !explicitIds.has(r.id))
      .map((r) => ({ id: r.id, name: r.name, description: r.description, preferredOperation: r.preferredOperation, data: r.data }));
  }, [runtimeSnapshot, recorderViews, snapshotNarrative]);

  // Build tab list: Result + Memory (always), Narrative (when data exists),
  // explicit recorder views, auto-detected recorder views
  const hasNarrative = !!narrativeEntries?.length;
  const allTabs = useMemo(() => {
    const tabs: Array<{ id: string; name: string; description?: string }> = [
      { id: "result", name: "Result", description: "Final output and console logs" },
      { id: "memory", name: "Memory", description: "Accumulator — progressive shared state at each stage" },
    ];
    if (hasNarrative) {
      tabs.push({ id: "narrative", name: "Narrative", description: "Translator (SequenceRecorder) — interleaved flow + data narrative per execution step" });
    }
    for (const v of recorderViews ?? []) {
      tabs.push({ id: v.id, name: v.name, description: v.description });
    }
    for (const v of autoRecorderViews) {
      tabs.push({ id: v.id, name: v.name, description: v.description });
    }
    // Filter hidden tabs
    const hideSet = new Set(hideTabsProp ?? []);
    return hideSet.size > 0 ? tabs.filter((t) => !hideSet.has(t.id)) : tabs;
  }, [hasNarrative, recorderViews, autoRecorderViews, hideTabsProp]);

  // Unstyled mode shows the SAME tabs as styled mode, plus the whole-surface
  // view. It used to render that surface from a tab id that appeared in no
  // list at all, so Result was the only button that did anything and Memory,
  // Narrative and every recorder view were dead.
  const unstyledTabs = useMemo(
    () => [
      ...allTabs,
      {
        id: EXPLAINABLE_TAB_ID,
        name: "Explainable",
        description: "Chart, memory, narrative and timeline in one scroll",
      },
    ],
    [allTabs],
  );

  const validTabIds = new Set(allTabs.map((t) => t.id));
  const resolvedDefault = defaultTab && validTabIds.has(defaultTab) ? defaultTab : allTabs[0]?.id ?? "result";
  const [activeTab, setActiveTab] = useState<string>(resolvedDefault);
  const [snapshotIdx, setSnapshotIdx] = useState(0);
  const [drillDownStack, setDrillDownStack] = useState<DrillDownEntry[]>([]);
  const [rightExpanded, setRightExpanded] = useState(defaultExpanded?.details ?? true);
  const [rightPanelMode, setRightPanelMode] = useState<RightPanelMode>("insights");
  // Inspector's active tab, lifted so the chart can paint the dependency
  // CONE exactly while the Data Trace tab is open (Inspector mode).
  const [inspectorTab, setInspectorTab] = useState<"state" | "trace">("state");

  // ── Same-Rail Rewind (tracing) session ──
  // The traced key + a stack of followed ingredients ({key, beforeCommitIdx}
  // scopes — following = RE-ANCHORING, see traceWalk.ts). This is a LENS
  // ({what are we asking about}), NOT a cursor: the one position stays
  // `snapshotIdx`. Root-level only; drilling into a subflow exits it.
  const [tracing, setTracing] = useState<null | {
    key: string;
    beforeCommitIdx?: number;
    via: Array<{ key: string; beforeCommitIdx: number }>;
  }>(null);
  // F2: is the fork chooser open? Pure UI flag on top of the tracing lens —
  // NOT a cursor, NOT part of the walk question. Any cursor move closes it
  // (the chooser asked about the OLD stop).
  const [forkChooserOpen, setForkChooserOpen] = useState(false);
  // F1: filter text for the "Trace any variable" entry block.
  const [traceSearch, setTraceSearch] = useState("");

  // Any cursor move invalidates the chooser — it asked about the stop the
  // cursor was on, and the ONE cursor just left it.
  useEffect(() => {
    setForkChooserOpen(false);
  }, [snapshotIdx]);

  // `tabs` never did anything. Say so out loud rather than let a consumer go
  // on believing a list they pass is being honoured.
  useEffect(() => {
    if (deprecatedTabs === undefined) return;
    devWarn(
      () =>
        "[ExplainableShell] the `tabs` prop is deprecated and has no effect. " +
        "Use `hideTabs` to drop tabs by id, and `defaultTab` to choose which " +
        "tab opens first.",
    );
  }, [deprecatedTabs]);


  const [leftExpanded, setLeftExpanded] = useState(defaultExpanded?.topology ?? false);
  const [timelineExpanded, setTimelineExpanded] = useState(defaultExpanded?.timeline ?? false);

  // Auto-collapse all panels when switching to narrow (mobile)
  useEffect(() => {
    if (isNarrow) {
      setLeftExpanded(false);
      setRightExpanded(false);
      setTimelineExpanded(false);
    }
  }, [isNarrow]);

  // Notify ReactFlow (and any ResizeObserver-based children) when panels toggle
  const triggerReflow = useCallback(() => {
    // Fire twice: once immediately for fast response, once after CSS transition ends
    requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
    setTimeout(() => window.dispatchEvent(new Event("resize")), 320);
  }, []);
  const toggleLeft = useCallback((v: boolean) => { setLeftExpanded(v); triggerReflow(); }, [triggerReflow]);
  const toggleRight = useCallback((v: boolean) => { setRightExpanded(v); triggerReflow(); }, [triggerReflow]);
  const toggleTimeline = useCallback(() => { setTimelineExpanded((p) => !p); triggerReflow(); }, [triggerReflow]);

  const isInSubflow = drillDownStack.length > 0;

  const currentLevel = useMemo(() => {
    if (drillDownStack.length > 0) {
      const top = drillDownStack[drillDownStack.length - 1];
      return { spec: top.spec, snapshots: top.snapshots, narrative: top.narrative, subflowId: top.subflowId as string | undefined };
    }
    return { spec: null, snapshots, narrative: undefined as NarrativeEntry[] | undefined, subflowId: undefined as string | undefined };
  }, [drillDownStack, snapshots]);

  const activeSnapshots = currentLevel.snapshots;
  const safeIdx = activeSnapshots.length > 0
    ? Math.max(0, Math.min(snapshotIdx, activeSnapshots.length - 1))
    : 0;

  // ONE backward slice, THREE consumers: the Data Trace tab (frames), its
  // honesty note, and the chart's dependency cone. Computed once per
  // (snapshot, cursor) so the panel and the chart can never disagree.
  const shellDataTrace = useMemo(
    () =>
      runtimeSnapshot?.commitLog
        ? buildDataTrace(runtimeSnapshot.commitLog, runtimeSnapshot.executionTree, activeSnapshots[safeIdx]?.runtimeStageId ?? "")
        : { frames: [] as import("./_internal/dataTrace").DataTraceFrame[], readsAvailable: true },
    [runtimeSnapshot, activeSnapshots, safeIdx],
  );

  // F1: every key the RUN ever wrote, in first-write order — so the user can
  // ask "why is X this value?" from anywhere, not only at X's writer stage.
  // handleStartTracing already answers honestly for keys not yet written at
  // the cursor (the 'not-yet-written' card), so no special-casing here.
  const allTracedKeys = useMemo<string[]>(() => {
    const log = runtimeSnapshot?.commitLog as
      | Array<{ trace?: Array<{ path: string }> }>
      | undefined;
    if (!log?.length) return [];
    const seen = new Set<string>();
    const keys: string[] = [];
    for (const c of log) {
      for (const t of c.trace ?? []) {
        if (!seen.has(t.path)) {
          seen.add(t.path);
          keys.push(t.path);
        }
      }
    }
    return keys;
  }, [runtimeSnapshot]);

  // The active tracing walk — recomputed only when the SESSION changes
  // (entry / follow / show-all), never on scrub: the anchor is frozen in
  // the session state, so walking the rail cannot shift the question.
  const traceWalk = useMemo<TraceWalk | null>(() => {
    if (!tracing || !runtimeSnapshot?.commitLog) return null;
    const scope = tracing.via.length > 0 ? tracing.via[tracing.via.length - 1] : tracing;
    return buildTraceWalk(runtimeSnapshot.commitLog, runtimeSnapshot.executionTree, scope.key, {
      beforeCommitIdx: scope.beforeCommitIdx,
    });
  }, [tracing, runtimeSnapshot]);

  // Rail stops: walk frames mapped onto the snapshot rail (root level only —
  // every walk frame comes from the root commit log, so this is total).
  const traceStopIndices = useMemo<number[]>(() => {
    if (!traceWalk || traceWalk.missing || isInSubflow) return [];
    const idxByRsid = new Map(activeSnapshots.map((sn, i) => [sn.runtimeStageId, i]));
    return traceWalk.stops
      .map((stop) => idxByRsid.get(stop.runtimeStageId))
      .filter((i): i is number => i !== undefined)
      .sort((a, b) => a - b);
  }, [traceWalk, activeSnapshots, isInSubflow]);

  // The cone: chart node id (stage part — strip the '#N' execution index) →
  // BFS depth. Painted while TRACING (from the walk, so a via-filter narrows
  // it) or while the Inspector's Data Trace tab is open (stage-anchored).
  const sliceCone = useMemo<ReadonlyMap<string, number> | undefined>(() => {
    if (traceWalk && !traceWalk.missing && traceWalk.stops.length >= 2) {
      const cone = new Map<string, number>();
      for (const stop of traceWalk.stops) {
        const stagePart = stop.runtimeStageId.split("#")[0];
        const prev = cone.get(stagePart);
        if (prev === undefined || stop.depth < prev) cone.set(stagePart, stop.depth);
      }
      return cone;
    }
    // Gate: the Inspector panel's INTERNAL mode name is 'what' (its button
    // label is "Inspector"); 'insights' is the Story/narrative side.
    if (rightPanelMode !== "what" || inspectorTab !== "trace") return undefined;
    if (shellDataTrace.frames.length < 2) return undefined; // an anchor alone is not a cone
    const cone = new Map<string, number>();
    for (const f of shellDataTrace.frames) {
      const stagePart = f.runtimeStageId.split("#")[0];
      const prev = cone.get(stagePart);
      if (prev === undefined || f.depth < prev) cone.set(stagePart, f.depth);
    }
    return cone;
  }, [traceWalk, rightPanelMode, inspectorTab, shellDataTrace]);

  // While drilled in, feed the Story the subflow-scoped, subflow-renumbered
  // narrative (Bug 3) so it reveals to the subflow-local cursor — not the
  // whole-run-numbered per-stage fallback text (which is why it used to start
  // at "Step 24" instead of step 1).
  const activeNarrativeEntries = isInSubflow ? currentLevel.narrative : narrativeEntries;

  // Which subflow the Story is showing. Every entry in a drilled list carries
  // a `subflowId`, so without this the Story would hide the whole level as
  // "subflow internals". The drill key usually IS the runtime subflow path;
  // when a consumer's node ids don't line up with it, fall back to the
  // SHALLOWEST subflowId present — that is this level, and anything longer is
  // a subflow nested inside it.
  const narrativeScopeSubflowId = useMemo<string | undefined>(() => {
    if (!isInSubflow) return undefined;
    const key = currentLevel.subflowId;
    const entries = currentLevel.narrative ?? [];
    if (key !== undefined && entries.some((e) => e.subflowId === key)) return key;
    let shallowest: string | undefined;
    for (const e of entries) {
      const id = e.subflowId;
      if (id === undefined) continue;
      if (shallowest === undefined || id.length < shallowest.length) shallowest = id;
    }
    return shallowest ?? key;
  }, [isInSubflow, currentLevel]);

  const breadcrumbs = useMemo(() => {
    const root = { label: title || "Flowchart", spec: null, description: undefined as string | undefined };
    return [root, ...drillDownStack.map((e) => ({ label: e.label, spec: e.spec, description: undefined as string | undefined }))];
  }, [title, drillDownStack]);

  // Recorder-driven: derive subflow presence from the build-time graph.
  // Falls back to the legacy spec walk only when traceGraph is absent
  // (e.g., a consumer still threading raw spec). When both are absent,
  // the tree sidebar is hidden.
  const showTreeSidebar = useMemo(() => {
    if (traceGraph?.nodes?.length) {
      return traceGraph.nodes.some((n) => n.data?.isSubflow === true);
    }
    return false;
  }, [traceGraph]);

  const rootOverlay = useMemo(() => {
    if (isInSubflow || !snapshots.length) return { activeStage: undefined, doneStages: undefined };
    const doneStages = new Set(snapshots.slice(0, safeIdx).map((s) => s.stageLabel));
    const activeStage = snapshots[safeIdx]?.stageLabel ?? null;
    return { activeStage, doneStages };
  }, [isInSubflow, snapshots, safeIdx]);

  // ── Handlers ──
  const handleTabChange = useCallback((tab: ShellTab) => {
    setActiveTab(tab);
    setDrillDownStack([]);
  }, []);

  const handleSnapshotChange = useCallback((idx: number | string) => {
    if (typeof idx === "number") setSnapshotIdx(idx);
  }, []);

  // ── Tracing handlers ──
  // Entry FREEZES the question at the cursor's moment ("why is it this value
  // as I see it here") and does the design's ONE visible jump: cursor → the
  // anchor stop. buildTraceWalk is pure/cheap, so handlers derive the jump
  // target synchronously instead of racing an effect.
  const jumpToAnchor = useCallback(
    (walk: TraceWalk) => {
      const anchor = walk.stops[0];
      if (!anchor) return; // honest absence — the card explains, the cursor stays
      const idx = activeSnapshots.findIndex((sn) => sn.runtimeStageId === anchor.runtimeStageId);
      if (idx >= 0) setSnapshotIdx(idx);
    },
    [activeSnapshots],
  );

  const handleStartTracing = useCallback(
    (key: string) => {
      if (!runtimeSnapshot?.commitLog || isInSubflow) return;
      const log = runtimeSnapshot.commitLog as Array<{ runtimeStageId?: string }>;
      const cursorRsid = activeSnapshots[safeIdx]?.runtimeStageId;
      const cursorCommitIdx = log.findIndex((c) => c.runtimeStageId === cursorRsid);
      // -1 only when a consumer pairs a HAND-BUILT `snapshots` prop (ids the
      // log doesn't know) with `runtimeSnapshot`; we then trace the whole log
      // and the entry jump may land after the cursor — defined, not a bug.
      const beforeCommitIdx = cursorCommitIdx >= 0 ? cursorCommitIdx + 1 : undefined;
      setTracing({ key, beforeCommitIdx, via: [] });
      setForkChooserOpen(false); // a fresh question — no stale chooser
      setTraceSearch(""); // and no stale filter greeting the next visit (review fix)
      setRightPanelMode("what");
      setInspectorTab("trace");
      jumpToAnchor(
        buildTraceWalk(runtimeSnapshot.commitLog, runtimeSnapshot.executionTree, key, { beforeCommitIdx }),
      );
    },
    [runtimeSnapshot, isInSubflow, activeSnapshots, safeIdx, jumpToAnchor],
  );

  const handleFollowIngredient = useCallback(
    (ing: TraceIngredient) => {
      if (!tracing || !runtimeSnapshot?.commitLog || ing.writerCommitIdx === null) return;
      const scope = { key: ing.key, beforeCommitIdx: ing.writerCommitIdx + 1 };
      setTracing({ ...tracing, via: [...tracing.via, scope] });
      setForkChooserOpen(false); // following IS the answer to the chooser
      jumpToAnchor(
        buildTraceWalk(runtimeSnapshot.commitLog, runtimeSnapshot.executionTree, scope.key, {
          beforeCommitIdx: scope.beforeCommitIdx,
        }),
      );
    },
    [tracing, runtimeSnapshot, jumpToAnchor],
  );

  const handleShowAllIngredients = useCallback(() => {
    if (!tracing || !runtimeSnapshot?.commitLog) return;
    setTracing({ ...tracing, via: [] });
    setForkChooserOpen(false);
    jumpToAnchor(
      buildTraceWalk(runtimeSnapshot.commitLog, runtimeSnapshot.executionTree, tracing.key, {
        beforeCommitIdx: tracing.beforeCommitIdx,
      }),
    );
  }, [tracing, runtimeSnapshot, jumpToAnchor]);

  // Exit keeps the cursor exactly where the walk left it — you land in
  // normal time-travel at the cause you found.
  const handleExitTracing = useCallback(() => {
    setTracing(null);
    setForkChooserOpen(false);
  }, []);

  // ── Fork chooser (F2) ──
  // The rail's walk-back control fires this INSTEAD of moving when the
  // current stop has 2+ ingredients: the user chooses which cause to follow.
  const handleForkPrompt = useCallback(() => setForkChooserOpen(true), []);

  // The chooser's neutral option = today's behavior: the nearest earlier
  // stop in time. Same computation as the rail's "earlier cause" (largest
  // stop index < safeIdx); the shell owns it so the card stays dumb.
  const handleContinueTimeOrder = useCallback(() => {
    const earlier = traceStopIndices.filter((i) => i < safeIdx);
    if (earlier.length > 0) setSnapshotIdx(earlier[earlier.length - 1]);
    setForkChooserOpen(false);
  }, [traceStopIndices, safeIdx]);

  // ── The ONE drill ───────────────────────────────────────────────────
  // `drillDownStack` is the shell's single source of truth for "where are
  // we?", and its top entry's `subflowId` (a mount NODE id) is handed to the
  // chart as its CONTROLLED scope. The chart no longer keeps a private drill
  // state, so a drill started from the Topology tree, the breadcrumb or a
  // chart card can no longer disagree with the chart on screen.
  const chartDrillKey = drillDownStack.length > 0
    ? drillDownStack[drillDownStack.length - 1].subflowId
    : null;

  /**
   * Build the WHOLE stack for a mount, from the root down. Every entry path
   * calls this with the mount node's id, so drilling a nested subflow
   * straight from the tree lands on the same state as walking there card by
   * card — including the ancestors in the breadcrumb.
   *
   * Returns null when the run has no recorded result for some level (a lazy
   * mount that never executed, say) — the caller then leaves the view alone
   * rather than half-drilling.
   */
  const buildDrillStack = useCallback(
    (mountKey: string): DrillDownEntry[] | null => {
      // The graph knows the ancestor chain; the runtime knows each level's
      // data. Walk the chain outermost-first, resolving each level inside
      // the level above it.
      const chain = traceGraph
        ? buildSubflowBreadcrumb(traceGraph, mountKey)
            .slice(1) // drop the synthetic root entry
            .map((c) => c.subflowId)
            .filter((id): id is string => id !== null)
        : [mountKey];
      const keys = chain.length > 0 ? chain : [mountKey];
      const stack: DrillDownEntry[] = [];
      let levelSnapshots = snapshots;
      for (const key of keys) {
        const entry = resolveSubflowFromRuntime(
          levelSnapshots,
          key,
          narrativeEntries,
          runtimeSnapshot?.subflowResults,
        );
        if (!entry) return null;
        stack.push({ ...entry, parentSnapshotIdx: stack.length === 0 ? snapshotIdx : 0 });
        levelSnapshots = entry.snapshots;
      }
      return stack.length > 0 ? stack : null;
    },
    [traceGraph, snapshots, narrativeEntries, runtimeSnapshot, snapshotIdx],
  );

  const handleDrillDown = useCallback(
    (mountKey: string) => {
      // Recorder path: resolve each level from its mount stage's recorded
      // `subflowResult` (no spec tree needed). Replacing the drillDownStack
      // rescopes the slider / story / overlay / chart together.
      const stack = buildDrillStack(mountKey);
      if (stack) {
        setTracing(null); // the walk lives on the ROOT rail — drilling exits it honestly
        setForkChooserOpen(false);
        setDrillDownStack(stack);
        setSnapshotIdx(0);
      }
    },
    [buildDrillStack],
  );

  const handleBreadcrumbNavigate = useCallback((level: number) => {
    setDrillDownStack((prev) => {
      const popped = level === 0 ? prev[0] : prev[level];
      if (popped) setSnapshotIdx(popped.parentSnapshotIdx);
      return level === 0 ? [] : prev.slice(0, level);
    });
  }, []);

  /**
   * The chart's drill scope changed (a mount card, or the chart's own
   * breadcrumb). Popping BACK to a level already on the stack must not push
   * a duplicate, so an existing key navigates instead of drilling.
   */
  const handleChartSubflowChange = useCallback(
    (mountKey: string | null) => {
      if (mountKey === null) { handleBreadcrumbNavigate(0); return; }
      const at = drillDownStack.findIndex((e) => e.subflowId === mountKey);
      if (at >= 0) {
        if (at < drillDownStack.length - 1) handleBreadcrumbNavigate(at + 1);
        return;
      }
      handleDrillDown(mountKey);
    },
    [drillDownStack, handleBreadcrumbNavigate, handleDrillDown],
  );

  const handleNodeClick = useCallback(
    (indexOrId: number | string) => {
      if (typeof indexOrId === "number") { setSnapshotIdx(indexOrId); return; }
      // Drill if this names a subflow — via the recorder path (the chart
      // forwards a mount node id here through onSubflowChange).
      if (buildDrillStack(indexOrId)) { handleChartSubflowChange(indexOrId); return; }
      const idx = activeSnapshots.findIndex((s) => s.stageLabel === indexOrId);
      if (idx >= 0) setSnapshotIdx(idx);
    },
    [activeSnapshots, buildDrillStack, handleChartSubflowChange]
  );

  const handleTreeNodeSelect = useCallback(
    (name: string, isSubflow: boolean, nodeId?: string) => {
      if (isSubflow) {
        // Drill by the mount NODE id when the tree supplies one: the label is
        // ambiguous (mount the same child chart twice and both rows read
        // "Prepare"), and a nested mount needs its ancestors drilled too.
        handleDrillDown(nodeId ?? name);
      } else {
        setDrillDownStack([]);
        const idx = snapshots.findIndex((s) => s.stageLabel === name);
        if (idx >= 0) setSnapshotIdx(idx);
      }
    },
    [snapshots, handleDrillDown]
  );

  const navigateToStage = useCallback(
    (id: string) => {
      const idx = activeSnapshots.findIndex((sn) => sn.runtimeStageId === id);
      if (idx >= 0) setSnapshotIdx(idx);
    },
    [activeSnapshots],
  );

  // ── Tracing render props ──
  const activeViaKey = tracing && tracing.via.length > 0 ? tracing.via[tracing.via.length - 1].key : null;

  const stepNumberOf = useCallback(
    (rsid: string) => {
      const i = activeSnapshots.findIndex((sn) => sn.runtimeStageId === rsid);
      return i >= 0 ? i + 1 : null;
    },
    [activeSnapshots],
  );

  const tracingRail = useMemo<TracingRail | null>(() => {
    if (!tracing || !traceWalk || traceWalk.missing || traceStopIndices.length === 0) return null;
    const cursorRsid = activeSnapshots[safeIdx]?.runtimeStageId;
    const walkIdx = traceWalk.stops.findIndex((st) => st.runtimeStageId === cursorRsid);
    // The card falls back to the ANCHOR when the cursor is off-walk, so the
    // rail's forkCount uses the same fallback — the prompt and the chooser
    // must always talk about the same stop.
    const currentStop = traceWalk.stops[walkIdx >= 0 ? walkIdx : 0];
    return {
      tracedKey: tracing.key,
      viaKey: activeViaKey,
      stopIndices: traceStopIndices,
      stopOrdinal: walkIdx >= 0 ? walkIdx + 1 : 1,
      totalStops: traceWalk.stops.length,
      onExit: handleExitTracing,
      onShowAll: activeViaKey ? handleShowAllIngredients : undefined,
      // Followable ingredients only — termini can't be chosen, so a stop of
      // run-inputs must not prompt (matches the card's chooser gate).
      forkCount: currentStop?.ingredients.filter((ing) => ing.writerRuntimeStageId !== null).length ?? 0,
      onForkPrompt: handleForkPrompt,
    };
  }, [tracing, traceWalk, traceStopIndices, activeSnapshots, safeIdx, activeViaKey, handleExitTracing, handleShowAllIngredients, handleForkPrompt]);

  // Data Trace tab body: the stop card while tracing; otherwise the classic
  // frames list with TWO entry blocks — the cursor stage's writes ("This
  // step wrote:") and, below it, a search over EVERY key the run ever wrote
  // ("Trace any variable:", F1). Both roads lead to handleStartTracing.
  const traceTabContent: ReactNode = useMemo(() => {
    if (tracing && traceWalk) {
      return (
        <TraceWalkCard
          walk={traceWalk}
          cursorRuntimeStageId={activeSnapshots[safeIdx]?.runtimeStageId ?? null}
          viaKey={activeViaKey}
          stepNumberOf={stepNumberOf}
          previewValueOf={(k) => activeSnapshots[safeIdx]?.memory?.[k]}
          onFollowIngredient={handleFollowIngredient}
          onJumpToStop={navigateToStage}
          onShowAll={activeViaKey ? handleShowAllIngredients : undefined}
          onExit={handleExitTracing}
          forkChooserOpen={forkChooserOpen}
          onContinueTimeOrder={handleContinueTimeOrder}
          canContinueTimeOrder={traceStopIndices.some((i) => i < safeIdx)}
        />
      );
    }
    // Same chip look for both entry blocks — one affordance, one meaning.
    const chipStyle: React.CSSProperties = {
      border: "1px solid var(--fp-accent, #6366f1)",
      background: "transparent",
      color: "var(--fp-accent, #6366f1)",
      borderRadius: 12,
      padding: "2px 10px",
      margin: "0 6px 6px 0",
      fontSize: 11,
      fontWeight: 600,
      fontFamily: "monospace",
      cursor: "pointer",
    };
    // F1 filter: case-insensitive substring; empty filter previews the first
    // 12 keys (first-write order) with a "+N more" nudge to type.
    const query = traceSearch.trim().toLowerCase();
    const matchedKeys = query
      ? allTracedKeys.filter((k) => k.toLowerCase().includes(query))
      : allTracedKeys;
    const shownKeys = matchedKeys.slice(0, 12);
    return (
      <>
        {!isInSubflow && (shellDataTrace.frames[0]?.keysWritten?.length ?? 0) > 0 && (
          <div data-fp="trace-entry" style={{ padding: "10px 14px 0", fontSize: 12 }}>
            <span style={{ color: theme.textMuted, marginRight: 6 }}>This step wrote:</span>
            {shellDataTrace.frames[0].keysWritten.map((k) => (
              <button
                key={k}
                data-fp="trace-entry-chip"
                onClick={() => handleStartTracing(k)}
                title={"Where did " + k + " come from? Walk its causes on the timeline."}
                style={chipStyle}
              >
                {k}
              </button>
            ))}
          </div>
        )}
        {!isInSubflow && allTracedKeys.length > 0 && (
          <div data-fp="trace-any" style={{ padding: "6px 14px 0", fontSize: 12 }}>
            <div style={{ color: theme.textMuted, marginBottom: 4 }}>Trace any variable:</div>
            <input
              data-fp="trace-search"
              value={traceSearch}
              onChange={(e) => setTraceSearch(e.target.value)}
              placeholder="search any variable..."
              style={{
                display: "block",
                width: "100%",
                boxSizing: "border-box",
                background: theme.bgTertiary,
                border: `1px solid ${theme.border}`,
                borderRadius: 6,
                color: theme.textPrimary,
                fontSize: 11,
                fontFamily: "monospace",
                padding: "4px 8px",
                marginBottom: 6,
              }}
            />
            {shownKeys.map((k) => (
              <button
                key={k}
                data-fp="trace-any-chip"
                onClick={() => handleStartTracing(k)}
                title={"Where did " + k + " come from? Walk its causes on the timeline."}
                style={chipStyle}
              >
                {k}
              </button>
            ))}
            {query === "" && matchedKeys.length > shownKeys.length && (
              <span style={{ color: theme.textMuted, fontSize: 11 }}>
                +{matchedKeys.length - shownKeys.length} more — type to search
              </span>
            )}
          </div>
        )}
        <DataTracePanel
          frames={shellDataTrace.frames}
          note={shellDataTrace.readsAvailable ? undefined : "⚠ reads were not recorded (readTracking off) — dependencies are unknowable, not absent."}
          selectedStageId={activeSnapshots[safeIdx]?.runtimeStageId}
          onFrameClick={navigateToStage}
          fromStageName={activeSnapshots[safeIdx]?.stageName}
        />
      </>
    );
  }, [tracing, traceWalk, activeSnapshots, safeIdx, activeViaKey, stepNumberOf, handleFollowIngredient, navigateToStage, handleShowAllIngredients, handleExitTracing, handleStartTracing, isInSubflow, shellDataTrace, forkChooserOpen, handleContinueTimeOrder, traceStopIndices, traceSearch, allTracedKeys]);

  // Map tab id → label for rendering
  const tabLabels = new Map(allTabs.map((t) => [t.id, t.name]));

  // ── Nothing to show ──
  // Full chrome around zero rows looks like a rendering bug and tells the
  // consumer nothing. Say which ingredient is missing instead. The three
  // cases below are genuinely different problems with different fixes.
  //
  // A plain function, not an early return: the styled tree still has hooks
  // below this point, and skipping them on an empty render would change hook
  // ORDER the moment a live run filled the shell in.
  // Render ONE details tab's body. This is the shell's single implementation,
  // used by all three surfaces that show a tab: the desktop right panel, the
  // narrow layout's details panel, and unstyled mode. `plain` only changes how
  // each panel PAINTS itself — never which panel it is. That is the unstyled
  // contract (same content, no styling), which unstyled mode used to break by
  // rendering nothing at all for Memory, Narrative and every recorder view.
  const renderTabBody = useCallback(
    (tabId: string, plain: boolean): ReactNode => {
      if (tabId === "result") {
        return (
          <ResultPanel
            data={resultData ?? null}
            logs={logs}
            hideConsole={hideConsole}
            size={size}
            unstyled={plain}
          />
        );
      }
      if (tabId === "memory") {
        return (
          <MemoryPanel
            snapshots={activeSnapshots}
            selectedIndex={safeIdx}
            size={size}
            unstyled={plain}
            style={plain ? undefined : { height: "100%" }}
          />
        );
      }
      if (tabId === "narrative") {
        return (
          <NarrativePanel
            snapshots={activeSnapshots}
            selectedIndex={safeIdx}
            narrativeEntries={activeNarrativeEntries}
            scopeSubflowId={narrativeScopeSubflowId}
            runtimeSnapshot={runtimeSnapshot}
            size={size}
            unstyled={plain}
            style={plain ? undefined : { height: "100%" }}
          />
        );
      }
      const customView = recorderViews?.find((v) => v.id === tabId);
      if (customView?.render) {
        return customView.render({ snapshots: activeSnapshots, selectedIndex: safeIdx });
      }
      // Auto-detected recorder view — time-travel aware for keyed recorders,
      // JSON fallback otherwise.
      const autoView = autoRecorderViews.find((v) => v.id === tabId);
      if (autoView) {
        return (
          <KeyedRecorderView
            data={autoView.data}
            description={autoView.description}
            preferredOperation={
              autoView.preferredOperation as "translate" | "accumulate" | "aggregate" | undefined
            }
            snapshots={activeSnapshots}
            selectedIndex={safeIdx}
          />
        );
      }
      return null;
    },
    [
      resultData,
      logs,
      hideConsole,
      size,
      activeSnapshots,
      safeIdx,
      activeNarrativeEntries,
      narrativeScopeSubflowId,
      runtimeSnapshot,
      recorderViews,
      autoRecorderViews,
    ],
  );

  // `traceTheme.mode` applies eui's full light/dark preset as `--fp-*` vars on
  // the shell root, so the WHOLE shell (canvas, panels, nodes, text, borders)
  // follows dark/light from one prop — the consumer never hand-sets the palette.
  // `visited`/`current` layer node-fill overrides on top (they win over the
  // preset). Any `--fp-*` the consumer sets on an ancestor is still respected
  // for tokens the preset/overrides don't touch. This is the coarse switch;
  // `--fp-*` remains the fine escape hatch.
  //
  // This hook must stay ABOVE the unstyled early return below: a hook after
  // an early return runs only on the renders that get past it, so flipping
  // `unstyled` between renders would change the hook count and React would
  // throw. (Unstyled mode itself never uses these vars — that is the point
  // of unstyled — but the hook must still RUN.)
  const shellThemeVars = useMemo<React.CSSProperties>(() => {
    if (!traceTheme) return {};
    return {
      // ONE mapping from mode → palette, shared with the standalone
      // components' `theme="light"` prop (theme/mode.ts).
      ...themeModeVars(traceTheme.mode),
      ...(traceTheme.visited !== undefined && { ["--fp-node-visited" as string]: traceTheme.visited }),
      ...(traceTheme.current !== undefined && { ["--fp-node-cursor" as string]: traceTheme.current }),
    } as React.CSSProperties;
  }, [traceTheme]);

  const renderEmptyState = (themeVars: React.CSSProperties): React.ReactElement => {
    const shellStyle = { ...themeVars, ...style } as React.CSSProperties;
    if (derivedFromRuntime?.error) {
      return (
        <EmptyShell
          unstyled={unstyled}
          className={className}
          style={shellStyle}
          reason="That snapshot could not be read."
          detail={
            <>
              <div>
                Expected a footprintjs <code>executor.getSnapshot()</code> —{" "}
                <code>{"{ sharedState, executionTree, commitLog }"}</code>.
              </div>
              <div style={unstyled ? undefined : { fontFamily: theme.fontMono, fontSize: 11, marginTop: 6 }}>
                {derivedFromRuntime.error}
              </div>
            </>
          }
        />
      );
    }
    const gotRunData = !!runtimeSnapshot || !!snapshotsProp;
    return (
      <EmptyShell
        unstyled={unstyled}
        className={className}
        style={shellStyle}
        reason={gotRunData ? "That run has no stages to show." : "No run to show yet."}
        detail={
          gotRunData ? (
            <div>
              The snapshot was read fine but its <code>executionTree</code> is empty — a run that
              was never executed, or a snapshot taken before <code>run()</code> finished.
            </div>
          ) : (
            <>
              <div>
                Pass a recorded run: <code>runtimeSnapshot={"{executor.getSnapshot()}"}</code> (the
                shell converts it), or pre-converted{" "}
                <code>snapshots={"{toVisualizationSnapshots(...)}"}</code>.
              </div>
              <div>
                Add <code>traceGraph</code> for the chart — it comes from the chart&apos;s
                structure, not the snapshot.
              </div>
            </>
          )
        }
      />
    );
  };

  // ── Unstyled mode ──
  if (unstyled) {
    if (snapshots.length === 0) return renderEmptyState({});
    return (
      <div className={className} style={style} data-fp="explainable-shell">
        <div data-fp="shell-tabs">
          {unstyledTabs.map((tab) => (
            <button key={tab.id} data-fp="shell-tab" data-active={tab.id === activeTab} onClick={() => handleTabChange(tab.id)}>{tab.name}</button>
          ))}
        </div>
        <div data-fp="shell-content" data-tab={activeTab}>
          {isExplainableTab(activeTab) ? (
            <>
              <TimeTravelControls snapshots={activeSnapshots} selectedIndex={safeIdx} onIndexChange={handleSnapshotChange} unstyled tracing={tracingRail} />
              {isInSubflow && <SubflowBreadcrumb breadcrumbs={breadcrumbs} onNavigate={handleBreadcrumbNavigate} />}
              {traceGraph && effectiveRenderFlowchart?.({ spec: null, snapshots: activeSnapshots, selectedIndex: safeIdx, onNodeClick: handleNodeClick, showStageId, currentSubflowId: chartDrillKey, onSubflowChange: handleChartSubflowChange, ...(sliceCone && { sliceCone }) })}
              {missingChart && <MissingChartNote unstyled />}
              <MemoryPanel snapshots={activeSnapshots} selectedIndex={safeIdx} unstyled />
              <NarrativePanel snapshots={activeSnapshots} selectedIndex={safeIdx} narrativeEntries={activeNarrativeEntries} scopeSubflowId={narrativeScopeSubflowId} unstyled />
              <GanttTimeline snapshots={activeSnapshots} selectedIndex={safeIdx} onSelect={handleSnapshotChange} unstyled />
            </>
          ) : (
            renderTabBody(activeTab, true)
          )}
        </div>
      </div>
    );
  }

  // ── Styled mode ──

  // Show topology when there's a renderer AND a graph to draw. The recorder/
  // traceGraph renderer draws from `traceGraph` and self-drills, so it does NOT
  // need a spec — gating on `activeSpec` alone hid the chart whenever a subflow
  // was drilled via the runtime path (`resolveSubflowFromRuntime` returns
  // spec: null), while the slider/story/breadcrumb kept working. See
  // test/component/ExplainableShellDrill.test.tsx.
  const showTopology = !!effectiveRenderFlowchart && !!traceGraph;

  // Render the active details tab content
  const detailsContent = renderTabBody(activeTab, false);

  // Details panel with internal tabs
  const detailsPanel = (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Tab bar inside details panel */}
      <div style={{
        display: "flex",
        borderBottom: `1px solid ${theme.border}`,
        background: theme.bgSecondary,
        flexShrink: 0,
        overflowX: "auto",
      }}>
        {allTabs.map((tab) => {
          const active = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as ShellTab)}
              title={tab.description}
              style={{
                padding: "6px 14px",
                fontSize: 11,
                fontWeight: active ? 700 : 500,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: active ? theme.primary : theme.textMuted,
                background: "transparent",
                border: "none",
                borderBottom: active ? `2px solid ${theme.primary}` : "2px solid transparent",
                cursor: "pointer",
                fontFamily: "inherit",
                whiteSpace: "nowrap",
              }}
            >
              {tab.name}
            </button>
          );
        })}
      </div>
      {/* Tab content */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {detailsContent}
      </div>
    </div>
  );

  // Safe to hand back the diagnosis instead of chrome wrapped around nothing
  // (every hook ran above the unstyled return already).
  if (snapshots.length === 0) return renderEmptyState(shellThemeVars);

  return (
    <div
      ref={shellRef}
      className={className}
      style={{
        ...shellThemeVars,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: theme.bgPrimary,
        color: theme.textPrimary,
        fontFamily: theme.fontSans,
        fontSize: 12,
        ...style,
      }}
      data-fp="explainable-shell"
    >
      {/* Time-travel slider — the SAME rail hosts the tracing walk */}
      <TimeTravelControls
        snapshots={activeSnapshots}
        selectedIndex={safeIdx}
        onIndexChange={handleSnapshotChange}
        size={size}
        tracing={tracingRail}
      />

      {/* Breadcrumb */}
      {isInSubflow && (
        <SubflowBreadcrumb breadcrumbs={breadcrumbs} onNavigate={handleBreadcrumbNavigate} />
      )}

      {/* Content */}
      <div style={{ flex: 1, overflow: isNarrow ? "auto" : "hidden", display: "flex", flexDirection: "column" }}>
        {isNarrow ? (
          /* ── Mobile: stacked vertical ── */
          <>
            {/* Flowchart — only when topology is relevant */}
            {showTopology && (
              <div style={{ height: 350, flexShrink: 0, overflow: "hidden" }}>
                {effectiveRenderFlowchart!({
                  spec: null,
                  snapshots: activeSnapshots,
                  selectedIndex: safeIdx,
                  onNodeClick: handleNodeClick,
                  showStageId,
                  currentSubflowId: chartDrillKey,
                  onSubflowChange: handleChartSubflowChange,
                  ...(sliceCone && { sliceCone }),
                })}
              </div>
            )}
            {missingChart && <MissingChartNote />}

            {/* Topology (subflow tree) — collapsible */}
            {showTreeSidebar && (
              <>
                <HLinePill label={leftLabel} expanded={leftExpanded} onClick={() => toggleLeft(!leftExpanded)} />
                {leftExpanded && (
                  <div style={{ maxHeight: 180, overflow: "auto", flexShrink: 0 }}>
                    <SubflowTree
                      graph={traceGraph ?? { nodes: [], edges: [] }}
                      activeStage={rootOverlay.activeStage}
                      doneStages={rootOverlay.doneStages}
                      onNodeSelect={handleTreeNodeSelect}
                    />
                  </div>
                )}
              </>
            )}

            {/* Details panel with tabs */}
            <HLinePill label={rightLabel} expanded={rightExpanded} onClick={() => toggleRight(!rightExpanded)} />
            {rightExpanded && (
              <div style={{ maxHeight: 350, flexShrink: 0, overflow: "hidden" }}>
                {detailsPanel}
              </div>
            )}

            {/* Timeline */}
            <HLinePill label={bottomLabel} detail={`${activeSnapshots.length} stages`} expanded={timelineExpanded} onClick={toggleTimeline} />
            {timelineExpanded && (
              <div style={{ flexShrink: 0, overflow: "hidden" }}>
                <GanttTimeline snapshots={activeSnapshots} selectedIndex={safeIdx} onSelect={handleSnapshotChange} size={size} />
              </div>
            )}
          </>
        ) : (
          /* ── Desktop: two-column — Flowchart | Right Panel ── */
          <>
            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

              {/* SubflowTree sidebar (only when subflows exist) */}
              {showTreeSidebar && (
                leftExpanded ? (
                  <div style={{ width: 180, flexShrink: 0, display: "flex", flexDirection: "row", overflow: "hidden" }}>
                    <div style={{ flex: 1, overflow: "auto" }}>
                      <SubflowTree
                        graph={traceGraph ?? { nodes: [], edges: [] }}
                        activeStage={rootOverlay.activeStage}
                        doneStages={rootOverlay.doneStages}
                        onNodeSelect={handleTreeNodeSelect}
                      />
                    </div>
                    <VLinePill label={leftLabel} expanded={true} side="left" onClick={() => toggleLeft(false)} />
                  </div>
                ) : (
                  <VLinePill label={leftLabel} expanded={false} side="left" onClick={() => toggleLeft(true)} />
                )
              )}

              {/* Center: Flowchart — flex:1, shares horizontal space with
                  the Details panel sibling when expanded. The chart's
                  TracedFlow refits itself via ResizeObserver whenever
                  this container's size changes (so opening/closing
                  Details re-runs xyflow's fitView automatically). */}
              {showTopology ? (
                <div style={{ flex: 1, overflow: "hidden", minWidth: 0 }}>
                  {effectiveRenderFlowchart!({
                    spec: null,
                    snapshots: activeSnapshots,
                    selectedIndex: safeIdx,
                    onNodeClick: handleNodeClick,
                    showStageId,
                    currentSubflowId: chartDrillKey,
                    onSubflowChange: handleChartSubflowChange,
                    ...(sliceCone && { sliceCone }),
                  })}
                </div>
              ) : (
                <div style={{ flex: 1, minWidth: 0, overflow: "auto" }}>
                  {missingChart && <MissingChartNote />}
                </div>
              )}

              {/* VLinePill divider between flowchart and right panel */}
              <VLinePill label={rightLabel} expanded={rightExpanded} onClick={() => toggleRight(!rightExpanded)} />

              {/* Right: Two-mode panel — Insights vs Inspector */}
              {rightExpanded && (
              <div style={{ width: "42%", minWidth: 320, maxWidth: 550, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <RightPanel
                  mode={rightPanelMode}
                  onModeChange={setRightPanelMode}
                  dataTrace={shellDataTrace}
                  onInspectorTabChange={setInspectorTab}
                  inspectorTab={inspectorTab}
                  traceContent={traceTabContent}
                  snapshots={activeSnapshots}
                  selectedIndex={safeIdx}
                  activeTab={activeTab}
                  allTabs={allTabs}
                  renderTabBody={renderTabBody}
                  size={size}
                  onNavigateToStage={navigateToStage}
                />
              </div>
              )}
            </div>

            {/* Bottom: Compact Timeline */}
            <CompactTimeline
              snapshots={activeSnapshots}
              selectedIndex={safeIdx}
              defaultExpanded={timelineExpanded}
              label={bottomLabel}
            />
          </>
        )}
      </div>
    </div>
  );
}
