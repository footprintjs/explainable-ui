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
  /** Recorder snapshots from FlowRecorder.toSnapshot() — auto-generates detail tabs. */
  recorders?: Array<{ id: string; name: string; data: unknown }>;
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

function extractSubflowNarrative(entries: NarrativeEntry[], subflowId: string, subflowName?: string): NarrativeEntry[] {
  // Primary: filter by stageName prefix (e.g., "auth/Validate Token" starts with "auth/")
  // This works reliably even for parallel subflows (no shared stack corruption)
  const prefix = subflowId + "/";
  const byPrefix = entries.filter((e) => e.stageName?.startsWith(prefix));
  if (byPrefix.length > 0) return byPrefix;

  // Fallback: structured subflowId field (from CombinedNarrativeRecorder stack tagging)
  const byId = entries.filter((e) => (e as any).subflowId === subflowId);
  if (byId.length > 0) return byId;

  // Last resort: scan for Entering/Exiting text markers
  const result: NarrativeEntry[] = [];
  const searchName = subflowName ?? subflowId;
  let inside = false;
  for (const entry of entries) {
    if (entry.type === "subflow" && entry.text.includes(searchName) && entry.text.startsWith("Entering")) { inside = true; continue; }
    if (inside && entry.type === "subflow" && entry.text.includes(searchName) && entry.text.startsWith("Exiting")) break;
    if (inside) result.push(entry);
  }
  return result;
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
    const recorders = (runtimeSnapshot as any)?.recorders as Array<{ id: string; name: string; data: unknown }> | undefined;
    if (!recorders?.length) return [];
    // Don't auto-generate for IDs that have explicit recorderViews
    const explicitIds = new Set((recorderViews ?? []).map((v) => v.id));
    return recorders
      .filter((r) => !explicitIds.has(r.id))
      .map((r) => ({ id: r.id, name: r.name, data: r.data }));
  }, [runtimeSnapshot, recorderViews]);

  // Build tab list: Result + Memory (always), Narrative (when data exists),
  // explicit recorder views, auto-detected recorder views
  const hasNarrative = !!(narrative?.length || narrativeEntries?.length);
  const allTabs = useMemo(() => {
    const tabs: Array<{ id: string; name: string }> = [
      { id: "result", name: "Result" },
      { id: "memory", name: "Memory" },
    ];
    if (hasNarrative) {
      tabs.push({ id: "narrative", name: "Narrative" });
    }
    for (const v of recorderViews ?? []) {
      tabs.push({ id: v.id, name: v.name });
    }
    for (const v of autoRecorderViews) {
      tabs.push({ id: v.id, name: v.name });
    }
    return tabs;
  }, [hasNarrative, recorderViews, autoRecorderViews]);

  const validTabIds = new Set(allTabs.map((t) => t.id));
  const resolvedDefault = defaultTab && validTabIds.has(defaultTab) ? defaultTab : allTabs[0]?.id ?? "result";
  const [activeTab, setActiveTab] = useState<string>(resolvedDefault);
  const [snapshotIdx, setSnapshotIdx] = useState(999);
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
  const showTopology = !!effectiveRenderFlowchart && !!activeSpec && showTreeSidebar;

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
    // Auto-detected recorder view — render as formatted JSON
    const autoView = autoRecorderViews.find((v) => v.id === activeTab);
    if (autoView) {
      return (
        <div style={{ padding: 12, fontFamily: theme.fontMono, fontSize: 11, whiteSpace: "pre-wrap", overflow: "auto", height: "100%" }}>
          {typeof autoView.data === "string" ? autoView.data : JSON.stringify(autoView.data, null, 2)}
        </div>
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

              {/* Left: SubflowTree with VLinePill handle */}
              {leftExpanded ? (
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
