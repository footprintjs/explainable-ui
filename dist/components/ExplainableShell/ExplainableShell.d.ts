import type { StageSnapshot, BaseComponentProps, NarrativeEntry } from "../../types";
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
/** Tab ID — "result", "memory", "narrative", or any custom recorder view ID. */
export type ShellTab = string;
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
    render: (props: {
        snapshots: StageSnapshot[];
        selectedIndex: number;
    }) => React.ReactNode;
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
     * Usage: `<ExplainableShell runtimeSnapshot={executor.getSnapshot()} narrativeEntries={executor.getNarrativeEntries()} spec={spec} />`
     */
    runtimeSnapshot?: RuntimeSnapshotInput | null;
    spec?: SpecNode | null;
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
export declare function ExplainableShell({ snapshots: snapshotsProp, runtimeSnapshot, spec, title, resultData: resultDataProp, logs, narrativeEntries, tabs, defaultTab, hideConsole, hideTabs: hideTabsProp, panelLabels, defaultExpanded, recorderViews, renderFlowchart, showStageId, traceGraph, runtimeOverlay, size, unstyled, className, style, }: ExplainableShellProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ExplainableShell.d.ts.map