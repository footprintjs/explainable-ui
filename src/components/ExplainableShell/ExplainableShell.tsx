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
import type { StageSnapshot, BaseComponentProps, NarrativeEntry } from "../../types";
import { theme } from "../../theme";
import { extractSubflowNarrative } from "../../utils/narrativeSync";
import { toVisualizationSnapshots, subflowResultToSnapshots } from "../../adapters/fromRuntimeSnapshot";
import { ResultPanel } from "../ResultPanel";
import { GanttTimeline } from "../GanttTimeline";
import { TimeTravelControls } from "../TimeTravelControls";
import { MemoryPanel } from "../MemoryPanel";
import { NarrativePanel } from "../NarrativePanel";
import { SubflowTree } from "../FlowchartView/SubflowTree";
import { SubflowBreadcrumb } from "../FlowchartView/SubflowBreadcrumb";
import { TracedFlowchartView } from "../FlowchartView/TracedFlowchartView";
import type { SpecNode } from "../FlowchartView/specToReactFlow";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Tab ID — "result", "memory", "narrative", or any custom recorder view ID. */
export type ShellTab = string;


interface SubflowLevel {
  subflowId: string;
  label: string;
  spec: SpecNode;
  snapshots: StageSnapshot[];
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

export interface ExplainableShellProps extends BaseComponentProps {
  /**
   * Pre-converted visualization snapshots. Use when you've already called
   * toVisualizationSnapshots() yourself.
   */
  snapshots?: StageSnapshot[];
  /**
   * Raw runtime snapshot from executor.getSnapshot(). The shell converts it
   * internally via toVisualizationSnapshots(). When provided, `snapshots`,
   * `resultData`, and `narrative` are derived automatically.
   *
   * Usage: `<ExplainableShell runtimeSnapshot={executor.getSnapshot()} spec={spec} />`
   */
  runtimeSnapshot?: RuntimeSnapshotInput | null;
  spec?: SpecNode | null;
  title?: string;
  resultData?: Record<string, unknown> | null;
  logs?: string[];
  narrative?: string[];
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
   * Custom flowchart renderer. When omitted and `spec` is provided,
   * ExplainableShell renders TracedFlowchartView by default.
   */
  renderFlowchart?: (props: {
    spec: SpecNode;
    snapshots: StageSnapshot[];
    selectedIndex: number;
    onNodeClick?: (indexOrId: number | string) => void;
  }) => React.ReactNode;
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
  narrative,
  size,
  fillHeight,
  extraViews,
}: {
  snapshots: StageSnapshot[];
  selectedIndex: number;
  narrativeEntries?: NarrativeEntry[];
  narrative?: string[];
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
        <NarrativePanel snapshots={snaps} selectedIndex={idx} narrativeEntries={narrativeEntries} narrative={narrative} size={size} style={fillHeight ? { height: "100%" } : undefined} />
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

function resolveSubflowLevel(
  parentSpec: SpecNode,
  parentSnapshots: StageSnapshot[],
  subflowNodeName: string,
  narrativeEntries?: NarrativeEntry[],
): SubflowLevel | null {
  const specNode = findSubflowSpecNode(parentSpec, subflowNodeName);
  if (!specNode?.subflowStructure) return null;
  const parentSnap = parentSnapshots.find(
    (s) => s.stageName === subflowNodeName || s.stageLabel === subflowNodeName
  );
  if (!parentSnap?.subflowResult) return null;
  // Extract subflow narrative: prefer subflowId (structured), fall back to display name (text scan)
  const sfId = specNode.subflowId ?? subflowNodeName;
  const sfDisplayName = specNode.subflowName ?? specNode.name;
  const sfNarrative = narrativeEntries
    ? extractSubflowNarrative(narrativeEntries, sfId, sfDisplayName)
    : undefined;
  const sfSnapshots = subflowResultToSnapshots(parentSnap.subflowResult, sfNarrative);
  if (sfSnapshots.length === 0) return null;
  return {
    subflowId: specNode.subflowId ?? subflowNodeName,
    label: specNode.subflowName ?? specNode.name,
    spec: specNode.subflowStructure,
    snapshots: sfSnapshots,
  };
}

function findSubflowSpecNode(node: SpecNode, name: string): SpecNode | null {
  if ((node.name === name || node.id === name) && node.isSubflowRoot) return node;
  if (node.children) { for (const child of node.children) { const f = findSubflowSpecNode(child, name); if (f) return f; } }
  if (node.next) return findSubflowSpecNode(node.next, name);
  return null;
}

function hasSubflowNodes(node: SpecNode): boolean {
  if (!node) return false;
  if (node.isSubflowRoot) return true;
  if (node.children?.some((c) => c && hasSubflowNodes(c))) return true;
  if (node.next && hasSubflowNodes(node.next)) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

// Default flowchart renderer — used when renderFlowchart is not provided
function defaultRenderFlowchart({ spec: s, snapshots: snaps, selectedIndex, onNodeClick }: {
  spec: SpecNode; snapshots: StageSnapshot[]; selectedIndex: number;
  onNodeClick?: (indexOrId: number | string) => void;
}) {
  return (
    <TracedFlowchartView
      spec={s}
      snapshots={snaps}
      snapshotIndex={selectedIndex}
      onNodeClick={onNodeClick}
    />
  );
}

export function ExplainableShell({
  snapshots: snapshotsProp,
  runtimeSnapshot,
  spec,
  title,
  resultData: resultDataProp,
  logs = [],
  narrative: narrativeProp,
  narrativeEntries,
  tabs = ["result", "explainable"],
  defaultTab,
  hideConsole = false,
  hideTabs: hideTabsProp,
  panelLabels,
  defaultExpanded,
  recorderViews,
  renderFlowchart,
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
      const narr: string[] = [];
      for (const snap of snaps) {
        const lines = (snap.narrative ?? "").split("\n").filter(Boolean);
        narr.push(...lines);
      }
      return { snapshots: snaps, resultData: runtimeSnapshot.sharedState, narrative: narr };
    } catch {
      return null;
    }
  }, [runtimeSnapshot, narrativeEntries]);

  // Use derived data when runtimeSnapshot is provided, otherwise use explicit props
  const snapshots = snapshotsProp ?? derivedFromRuntime?.snapshots ?? [];
  const resultData = resultDataProp ?? derivedFromRuntime?.resultData ?? null;
  const narrative = narrativeProp ?? derivedFromRuntime?.narrative;

  // Default flowchart renderer when spec is provided
  const effectiveRenderFlowchart = renderFlowchart ?? (spec ? defaultRenderFlowchart : undefined);
  const leftLabel = panelLabels?.topology ?? "Topology";
  const rightLabel = panelLabels?.details ?? "Details";
  const bottomLabel = panelLabels?.timeline ?? "Timeline";

  // Responsive: detect narrow container + notify children of size changes
  const shellRef = useRef<HTMLDivElement>(null);
  const [isNarrow, setIsNarrow] = useState(false);
  useEffect(() => {
    const el = shellRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setIsNarrow(entry.contentRect.width < 640);
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
  const hasNarrative = !!(narrative?.length || narrativeEntries?.length);
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
      return { spec: top.spec, snapshots: top.snapshots };
    }
    return { spec: spec ?? null, snapshots };
  }, [drillDownStack, spec, snapshots]);

  const activeSnapshots = currentLevel.snapshots;
  const activeSpec = currentLevel.spec;
  const safeIdx = activeSnapshots.length > 0
    ? Math.max(0, Math.min(snapshotIdx, activeSnapshots.length - 1))
    : 0;

  const activeNarrative = useMemo<string[] | undefined>(() => {
    if (!isInSubflow) return narrative;
    const lines: string[] = [];
    for (const snap of activeSnapshots) {
      const stageLines = (snap.narrative ?? "").split("\n").filter(Boolean);
      lines.push(...stageLines);
    }
    return lines.length > 0 ? lines : undefined;
  }, [isInSubflow, narrative, activeSnapshots]);

  const activeNarrativeEntries = isInSubflow ? undefined : narrativeEntries;

  const breadcrumbs = useMemo(() => {
    const root = { label: title || "Flowchart", spec: spec!, description: spec?.description };
    return [root, ...drillDownStack.map((e) => ({ label: e.label, spec: e.spec, description: undefined as string | undefined }))];
  }, [spec, title, drillDownStack]);

  const showTreeSidebar = useMemo(() => !!spec && hasSubflowNodes(spec), [spec]);

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

  const handleDrillDown = useCallback(
    (nodeName: string) => {
      if (!activeSpec) return;
      const entry = resolveSubflowLevel(activeSpec, activeSnapshots, nodeName, narrativeEntries);
      if (entry) {
        setDrillDownStack((prev) => [...prev, { ...entry, parentSnapshotIdx: snapshotIdx }]);
        setSnapshotIdx(0);
      }
    },
    [activeSpec, activeSnapshots, narrativeEntries, snapshotIdx]
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
      if (activeSpec) {
        const sfNode = findSubflowSpecNode(activeSpec, indexOrId);
        if (sfNode?.subflowStructure) { handleDrillDown(indexOrId); return; }
      }
      const idx = activeSnapshots.findIndex((s) => s.stageLabel === indexOrId);
      if (idx >= 0) setSnapshotIdx(idx);
    },
    [activeSpec, activeSnapshots, handleDrillDown]
  );

  const handleTreeNodeSelect = useCallback(
    (name: string, isSubflow: boolean) => {
      if (isSubflow && spec) {
        setDrillDownStack([]);
        const entry = resolveSubflowLevel(spec, snapshots, name, narrativeEntries);
        if (entry) { setDrillDownStack([{ ...entry, parentSnapshotIdx: snapshotIdx }]); setSnapshotIdx(0); }
      } else {
        setDrillDownStack([]);
        const idx = snapshots.findIndex((s) => s.stageLabel === name);
        if (idx >= 0) setSnapshotIdx(idx);
      }
    },
    [spec, snapshots, narrativeEntries, snapshotIdx]
  );

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
              <TimeTravelControls snapshots={activeSnapshots} selectedIndex={safeIdx} onIndexChange={handleSnapshotChange} unstyled />
              {isInSubflow && <SubflowBreadcrumb breadcrumbs={breadcrumbs} onNavigate={handleBreadcrumbNavigate} />}
              {activeSpec && effectiveRenderFlowchart?.({ spec: activeSpec, snapshots: activeSnapshots, selectedIndex: safeIdx, onNodeClick: handleNodeClick })}
              <MemoryPanel snapshots={activeSnapshots} selectedIndex={safeIdx} unstyled />
              <NarrativePanel snapshots={activeSnapshots} selectedIndex={safeIdx} narrativeEntries={activeNarrativeEntries} narrative={activeNarrative} unstyled />
              <GanttTimeline snapshots={activeSnapshots} selectedIndex={safeIdx} onSelect={handleSnapshotChange} unstyled />
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Styled mode ──

  // Show topology when spec has subflows
  const showTopology = !!effectiveRenderFlowchart && !!activeSpec;

  // Render the active details tab content
  const detailsContent = useMemo(() => {
    if (activeTab === "result") {
      return <ResultPanel data={resultData ?? null} logs={logs} hideConsole={hideConsole} size={size} />;
    }
    if (activeTab === "memory") {
      return <MemoryPanel snapshots={activeSnapshots} selectedIndex={safeIdx} size={size} style={{ height: "100%" }} />;
    }
    if (activeTab === "narrative") {
      return <NarrativePanel snapshots={activeSnapshots} selectedIndex={safeIdx} narrativeEntries={activeNarrativeEntries} narrative={activeNarrative} size={size} style={{ height: "100%" }} />;
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
  }, [activeTab, resultData, logs, hideConsole, size, activeSnapshots, safeIdx, activeNarrativeEntries, activeNarrative, recorderViews, autoRecorderViews]);

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

  return (
    <div
      ref={shellRef}
      className={className}
      style={{
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
      {/* Time-travel slider */}
      <TimeTravelControls
        snapshots={activeSnapshots}
        selectedIndex={safeIdx}
        onIndexChange={handleSnapshotChange}
        size={size}
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
                  spec: activeSpec!,
                  snapshots: activeSnapshots,
                  selectedIndex: safeIdx,
                  onNodeClick: handleNodeClick,
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
                      spec={spec!}
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
        ) : showTopology ? (
          /* ── Desktop with topology: side-by-side ── */
          <>
            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

              {/* Left: SubflowTree with VLinePill handle — only when spec has subflows */}
              {showTreeSidebar && (
                leftExpanded ? (
                  <div style={{ width: 220, flexShrink: 0, display: "flex", flexDirection: "row", overflow: "hidden" }}>
                    <div style={{ flex: 1, overflow: "auto" }}>
                      <SubflowTree
                        spec={spec!}
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

              {/* Center: Flowchart */}
              <div style={{ flex: 1, overflow: "hidden", minWidth: 0 }}>
                {effectiveRenderFlowchart!({
                  spec: activeSpec!,
                  snapshots: activeSnapshots,
                  selectedIndex: safeIdx,
                  onNodeClick: handleNodeClick,
                })}
              </div>

              {/* Right: Details panel with tabs */}
              {rightExpanded ? (
                <div style={{ width: "38%", minWidth: 300, maxWidth: 500, display: "flex", flexDirection: "row", overflow: "hidden" }}>
                  <VLinePill label={rightLabel} expanded={true} onClick={() => toggleRight(false)} />
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    {detailsPanel}
                  </div>
                </div>
              ) : (
                <VLinePill label={rightLabel} expanded={false} onClick={() => toggleRight(true)} />
              )}
            </div>

            {/* Bottom: Timeline */}
            <HLinePill label={bottomLabel} detail={`${activeSnapshots.length} stages`} expanded={timelineExpanded} onClick={toggleTimeline} />
            {timelineExpanded && (
              <div style={{ flexShrink: 0, overflow: "hidden" }}>
                <GanttTimeline snapshots={activeSnapshots} selectedIndex={safeIdx} onSelect={handleSnapshotChange} size={size} />
              </div>
            )}
          </>
        ) : (
          /* ── Desktop without topology: details panel takes full width ── */
          <>
            <div style={{ flex: 1, overflow: "hidden" }}>
              {detailsPanel}
            </div>

            {/* Bottom: Timeline */}
            <HLinePill label={bottomLabel} detail={`${activeSnapshots.length} stages`} expanded={timelineExpanded} onClick={toggleTimeline} />
            {timelineExpanded && (
              <div style={{ flexShrink: 0, overflow: "hidden" }}>
                <GanttTimeline snapshots={activeSnapshots} selectedIndex={safeIdx} onSelect={handleSnapshotChange} size={size} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
