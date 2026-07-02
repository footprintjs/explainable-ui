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
import { theme, tokensToCSSVars, coolLight, coolDark } from "../../theme";
import { buildDataTrace } from "./_internal/dataTrace";
import { buildTraceWalk, type TraceIngredient, type TraceWalk } from "./_internal/traceWalk";
import { TraceWalkCard } from "../DataTracePanel/TraceWalkCard";
import { DataTracePanel } from "../DataTracePanel/DataTracePanel";
import type { TracingRail } from "../TimeTravelControls/TimeTravelControls";
import { extractSubflowNarrative } from "../../utils/narrativeSync";
import { toVisualizationSnapshots, subflowResultToSnapshots } from "../../adapters/fromRuntimeSnapshot";
import { ResultPanel } from "../ResultPanel";
import { GanttTimeline } from "../GanttTimeline";
import { TimeTravelControls } from "../TimeTravelControls";
import { MemoryPanel } from "../MemoryPanel";
import { NarrativePanel } from "../NarrativePanel";
import { SubflowTree } from "../FlowchartView/SubflowTree";
import { SubflowBreadcrumb } from "../FlowchartView/SubflowBreadcrumb";
import { TracedFlow } from "../FlowchartView/TracedFlow";

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
   * Runtime overlay captured live via `createTraceRuntimeOverlay`.
   * Pair with `traceGraph` to drive `<TracedFlow>` for the full
   * time-travel trace UI.
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
   *  removed; call `.map(e => e.text)` if you need it. */
  narrativeEntries?: NarrativeEntry[];
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
 */
function resolveSubflowFromRuntime(
  parentSnapshots: StageSnapshot[],
  subflowId: string,
  narrativeEntries?: NarrativeEntry[],
): SubflowLevel | null {
  const localId = subflowId.split("/").pop() ?? subflowId;
  const parentSnap = parentSnapshots.find((s) => {
    if (!s.subflowResult) return false;
    const sfStageId = s.runtimeStageId?.split("#")[0]?.split("/").pop();
    return (
      s.subflowId === subflowId ||
      s.subflowId === localId ||
      s.stageName === subflowId ||
      s.stageLabel === subflowId ||
      sfStageId === subflowId ||
      sfStageId === localId
    );
  });
  if (!parentSnap?.subflowResult) return null;
  const label = parentSnap.stageLabel ?? parentSnap.stageName ?? localId;
  const sfNarrative = narrativeEntries
    ? extractSubflowNarrative(narrativeEntries, subflowId, label)
    : undefined;
  const sfSnapshots = subflowResultToSnapshots(parentSnap.subflowResult, sfNarrative);
  if (sfSnapshots.length === 0) return null;
  return { subflowId, label, spec: null, snapshots: sfSnapshots, narrative: sfNarrative };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// RightPanel — two-mode panel: Insights vs What Happened// ---------------------------------------------------------------------------
// RightPanel — two-mode panel: Insights vs What Happened
// ---------------------------------------------------------------------------

type RightPanelMode = "insights" | "what";

const RightPanel = memo(function RightPanel({
  mode,
  onModeChange,
  snapshots,
  selectedIndex,
  runtimeSnapshot,
  activeTab,
  allTabs,
  activeNarrativeEntries,
  recorderViews,
  autoRecorderViews,
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
  runtimeSnapshot?: RuntimeSnapshotInput | null;
  spec?: SpecNode | null;
  activeTab: string;
  allTabs: Array<{ id: string; name: string; description?: string }>;
  activeNarrativeEntries?: NarrativeEntry[];
  recorderViews?: RecorderView[];
  autoRecorderViews: Array<{ id: string; name: string; description?: string; preferredOperation?: string; data: unknown }>;
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
  return (
    <>
      {/* Mode toggle */}
      <div style={{
        display: "flex",
        borderBottom: `1px solid ${theme.border}`,
        flexShrink: 0,
        background: theme.bgSecondary,
      }}>
        {(["insights", "what"] as const).map((m) => (
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
            {m === "insights" ? "Insights" : "Inspector"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        {mode === "insights" ? (
          <InsightPanel
            mode="tabs"
            expandedId={activeTab}
            insights={allTabs.filter((t) => t.id !== "result" && t.id !== "memory").map((tab) => ({
              id: tab.id,
              name: insightName(tab.name),
              render: () => {
                if (tab.id === "narrative") return <NarrativePanel snapshots={snapshots} selectedIndex={selectedIndex} narrativeEntries={activeNarrativeEntries} runtimeSnapshot={runtimeSnapshot} size={size} style={{ height: "100%" }} />;
                const customView = recorderViews?.find((v) => v.id === tab.id);
                if (customView?.render) return customView.render({ snapshots, selectedIndex });
                const autoView = autoRecorderViews.find((v) => v.id === tab.id);
                if (autoView) return <KeyedRecorderView data={autoView.data} description={autoView.description} preferredOperation={autoView.preferredOperation as any} snapshots={snapshots} selectedIndex={selectedIndex} />;
                return null;
              },
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
  narrativeEntries,
  tabs = ["result", "explainable"],
  defaultTab,
  hideConsole = false,
  hideTabs: hideTabsProp,
  panelLabels,
  defaultExpanded,
  recorderViews,
  renderFlowchart,
  showStageId = false,
  traceGraph,
  runtimeOverlay,
  traceTheme,
  size = "default",
  unstyled = false,
  className,
  style,
}: ExplainableShellProps) {
  // Convert runtimeSnapshot → visualization snapshots (zero-boilerplate mode)
  const derivedFromRuntime = useMemo(() => {
    if (!runtimeSnapshot) return null;
    try {
      const snaps = toVisualizationSnapshots(runtimeSnapshot as any, narrativeEntries as any);
      return { snapshots: snaps, resultData: runtimeSnapshot.sharedState };
    } catch {
      return null;
    }
  }, [runtimeSnapshot, narrativeEntries]);

  // Use derived data when runtimeSnapshot is provided, otherwise use explicit props
  const snapshots = snapshotsProp ?? derivedFromRuntime?.snapshots ?? [];
  const resultData = resultDataProp ?? derivedFromRuntime?.resultData ?? null;

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
    return ({ selectedIndex, snapshots, onNodeClick, sliceCone }: {
      spec: SpecNode | null; snapshots: StageSnapshot[]; selectedIndex: number;
      onNodeClick?: (indexOrId: number | string) => void;
      showStageId?: boolean;
      sliceCone?: ReadonlyMap<string, number>;
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
          onSubflowChange={(mountId) => {
            // Forward chart's drill state to the shell's drill-down
            // stack so memory/narrative/timeline panels follow the
            // chart into/out of subflows. We route through the same
            // onNodeClick channel — it already triggers drill-down
            // for subflow mount nodes via the shell's handleNodeClick
            // → handleDrillDown path.
            //
            // The `mountId === null` case (popping back to top) is
            // intentionally NOT auto-triggered here: the shell's
            // breadcrumb-back button is the right user gesture for
            // navigating UP from a subflow. Auto-popping on scrub
            // would surprise users who manually drilled in.
            if (mountId !== null) onNodeClick?.(mountId);
          }}
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
    return recorders
      .filter((r) => !explicitIds.has(r.id))
      .map((r) => ({ id: r.id, name: r.name, description: r.description, preferredOperation: r.preferredOperation, data: r.data }));
  }, [runtimeSnapshot, recorderViews]);

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

  const validTabIds = new Set(allTabs.map((t) => t.id));
  const resolvedDefault = defaultTab && validTabIds.has(defaultTab) ? defaultTab : allTabs[0]?.id ?? "result";
  const [activeTab, setActiveTab] = useState<string>(resolvedDefault);
  const [snapshotIdx, setSnapshotIdx] = useState(0);
  const [drillDownStack, setDrillDownStack] = useState<DrillDownEntry[]>([]);
  const [rightExpanded, setRightExpanded] = useState(defaultExpanded?.details ?? true);
  const [rightPanelMode, setRightPanelMode] = useState<"insights" | "what">("insights");
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
      return { spec: top.spec, snapshots: top.snapshots, narrative: top.narrative };
    }
    return { spec: null, snapshots, narrative: undefined as NarrativeEntry[] | undefined };
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
    jumpToAnchor(
      buildTraceWalk(runtimeSnapshot.commitLog, runtimeSnapshot.executionTree, tracing.key, {
        beforeCommitIdx: tracing.beforeCommitIdx,
      }),
    );
  }, [tracing, runtimeSnapshot, jumpToAnchor]);

  // Exit keeps the cursor exactly where the walk left it — you land in
  // normal time-travel at the cause you found.
  const handleExitTracing = useCallback(() => setTracing(null), []);

  const handleDrillDown = useCallback(
    (nodeName: string) => {
      // Recorder path: resolve the subflow level from the mount stage's recorded
      // `subflowResult` (no spec tree needed). Pushing the shell's drillDownStack
      // rescopes the slider / story / overlay to the subflow.
      const entry = resolveSubflowFromRuntime(activeSnapshots, nodeName, narrativeEntries);
      if (entry) {
        setTracing(null); // the walk lives on the ROOT rail — drilling exits it honestly
        setDrillDownStack((prev) => [...prev, { ...entry, parentSnapshotIdx: snapshotIdx }]);
        setSnapshotIdx(0);
      }
    },
    [activeSnapshots, narrativeEntries, snapshotIdx]
  );

  const handleBreadcrumbNavigate = useCallback((level: number) => {
    setDrillDownStack((prev) => {
      const popped = level === 0 ? prev[0] : prev[level];
      if (popped) setSnapshotIdx(popped.parentSnapshotIdx);
      return level === 0 ? [] : prev.slice(0, level);
    });
  }, []);

  const handleNodeClick = useCallback(
    (indexOrId: number | string) => {
      if (typeof indexOrId === "number") { setSnapshotIdx(indexOrId); return; }
      // Drill if this names a subflow — via the recorder path (the chart
      // forwards a subflowId here through onSubflowChange).
      const drillable = resolveSubflowFromRuntime(activeSnapshots, indexOrId, narrativeEntries);
      if (drillable) { handleDrillDown(indexOrId); return; }
      const idx = activeSnapshots.findIndex((s) => s.stageLabel === indexOrId);
      if (idx >= 0) setSnapshotIdx(idx);
    },
    [activeSnapshots, narrativeEntries, handleDrillDown]
  );

  const handleTreeNodeSelect = useCallback(
    (name: string, isSubflow: boolean) => {
      if (isSubflow) {
        setDrillDownStack([]);
        const entry = resolveSubflowFromRuntime(snapshots, name, narrativeEntries);
        if (entry) { setDrillDownStack([{ ...entry, parentSnapshotIdx: snapshotIdx }]); setSnapshotIdx(0); }
      } else {
        setDrillDownStack([]);
        const idx = snapshots.findIndex((s) => s.stageLabel === name);
        if (idx >= 0) setSnapshotIdx(idx);
      }
    },
    [snapshots, narrativeEntries, snapshotIdx]
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
    return {
      tracedKey: tracing.key,
      viaKey: activeViaKey,
      stopIndices: traceStopIndices,
      stopOrdinal: walkIdx >= 0 ? walkIdx + 1 : 1,
      totalStops: traceWalk.stops.length,
      onExit: handleExitTracing,
      onShowAll: activeViaKey ? handleShowAllIngredients : undefined,
    };
  }, [tracing, traceWalk, traceStopIndices, activeSnapshots, safeIdx, activeViaKey, handleExitTracing, handleShowAllIngredients]);

  // Data Trace tab body: the stop card while tracing; otherwise the classic
  // frames list with "Trace a value" entry chips (the keys the cursor's
  // stage wrote — the natural place to ask "where did THIS come from?").
  const traceTabContent: ReactNode = useMemo(() => tracing && traceWalk ? (
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
    />
  ) : (
    <>
      {!isInSubflow && (shellDataTrace.frames[0]?.keysWritten?.length ?? 0) > 0 && (
        <div data-fp="trace-entry" style={{ padding: "10px 14px 0", fontSize: 12 }}>
          <span style={{ color: theme.textMuted, marginRight: 6 }}>Trace a value:</span>
          {shellDataTrace.frames[0].keysWritten.map((k) => (
            <button
              key={k}
              data-fp="trace-entry-chip"
              onClick={() => handleStartTracing(k)}
              title={"Where did " + k + " come from? Walk its causes on the timeline."}
              style={{
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
              }}
            >
              {k}
            </button>
          ))}
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
  ), [tracing, traceWalk, activeSnapshots, safeIdx, activeViaKey, stepNumberOf, handleFollowIngredient, navigateToStage, handleShowAllIngredients, handleExitTracing, handleStartTracing, isInSubflow, shellDataTrace]);

  // Map tab id → label for rendering
  const tabLabels = new Map(allTabs.map((t) => [t.id, t.name]));

  // ── Unstyled mode ──
  if (unstyled) {
    return (
      <div className={className} style={style} data-fp="explainable-shell">
        <div data-fp="shell-tabs">
          {allTabs.map((tab) => (
            <button key={tab.id} data-fp="shell-tab" data-active={tab.id === activeTab} onClick={() => handleTabChange(tab.id)}>{tab.name}</button>
          ))}
        </div>
        <div data-fp="shell-content" data-tab={activeTab}>
          {activeTab === "result" && <ResultPanel data={resultData ?? null} logs={logs} hideConsole={hideConsole} unstyled />}
          {(activeTab === "explainable" || activeTab === "ai-compatible") && (
            <>
              <TimeTravelControls snapshots={activeSnapshots} selectedIndex={safeIdx} onIndexChange={handleSnapshotChange} unstyled tracing={tracingRail} />
              {isInSubflow && <SubflowBreadcrumb breadcrumbs={breadcrumbs} onNavigate={handleBreadcrumbNavigate} />}
              {traceGraph && effectiveRenderFlowchart?.({ spec: null, snapshots: activeSnapshots, selectedIndex: safeIdx, onNodeClick: handleNodeClick, showStageId, ...(sliceCone && { sliceCone }) })}
              <MemoryPanel snapshots={activeSnapshots} selectedIndex={safeIdx} unstyled />
              <NarrativePanel snapshots={activeSnapshots} selectedIndex={safeIdx} narrativeEntries={activeNarrativeEntries} unstyled />
              <GanttTimeline snapshots={activeSnapshots} selectedIndex={safeIdx} onSelect={handleSnapshotChange} unstyled />
            </>
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
  const detailsContent = useMemo(() => {
    if (activeTab === "result") {
      return <ResultPanel data={resultData ?? null} logs={logs} hideConsole={hideConsole} size={size} />;
    }
    if (activeTab === "memory") {
      return <MemoryPanel snapshots={activeSnapshots} selectedIndex={safeIdx} size={size} style={{ height: "100%" }} />;
    }
    if (activeTab === "narrative") {
      return <NarrativePanel snapshots={activeSnapshots} selectedIndex={safeIdx} narrativeEntries={activeNarrativeEntries} size={size} style={{ height: "100%" }} />;
    }
    const customView = recorderViews?.find((v) => v.id === activeTab);
    if (customView?.render) {
      return customView.render({ snapshots: activeSnapshots, selectedIndex: safeIdx });
    }
    // Auto-detected recorder view — time-travel aware for keyed recorders, JSON fallback
    const autoView = autoRecorderViews.find((v) => v.id === activeTab);
    if (autoView) {
      return (
        <KeyedRecorderView
          data={autoView.data}
          description={autoView.description}
          preferredOperation={autoView.preferredOperation as "translate" | "accumulate" | "aggregate" | undefined}
          snapshots={activeSnapshots}
          selectedIndex={safeIdx}
        />
      );
    }
    return null;
  }, [activeTab, resultData, logs, hideConsole, size, activeSnapshots, safeIdx, activeNarrativeEntries, recorderViews, autoRecorderViews]);

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

  // `traceTheme.mode` applies eui's full light/dark preset as `--fp-*` vars on
  // the shell root, so the WHOLE shell (canvas, panels, nodes, text, borders)
  // follows dark/light from one prop — the consumer never hand-sets the palette.
  // `visited`/`current` layer node-fill overrides on top (they win over the
  // preset). Any `--fp-*` the consumer sets on an ancestor is still respected
  // for tokens the preset/overrides don't touch. This is the coarse switch;
  // `--fp-*` remains the fine escape hatch.
  const shellThemeVars = useMemo<React.CSSProperties>(() => {
    if (!traceTheme) return {};
    const base = traceTheme.mode
      ? (tokensToCSSVars(traceTheme.mode === "light" ? coolLight : coolDark) as React.CSSProperties)
      : {};
    return {
      ...base,
      ...(traceTheme.visited !== undefined && { ["--fp-node-visited" as string]: traceTheme.visited }),
      ...(traceTheme.current !== undefined && { ["--fp-node-cursor" as string]: traceTheme.current }),
    } as React.CSSProperties;
  }, [traceTheme]);

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
                  ...(sliceCone && { sliceCone }),
                })}
              </div>
            )}

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
                    <VLinePill label="Topology" expanded={true} side="left" onClick={() => toggleLeft(false)} />
                  </div>
                ) : (
                  <VLinePill label="Topology" expanded={false} side="left" onClick={() => toggleLeft(true)} />
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
                    ...(sliceCone && { sliceCone }),
                  })}
                </div>
              ) : (
                <div style={{ flex: 1 }} />
              )}

              {/* VLinePill divider between flowchart and right panel */}
              <VLinePill label="Details" expanded={rightExpanded} onClick={() => toggleRight(!rightExpanded)} />

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
                  runtimeSnapshot={runtimeSnapshot}
                  activeTab={activeTab}
                  allTabs={allTabs}
                  activeNarrativeEntries={activeNarrativeEntries}
                  recorderViews={recorderViews}
                  autoRecorderViews={autoRecorderViews}
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
            />
          </>
        )}
      </div>
    </div>
  );
}
