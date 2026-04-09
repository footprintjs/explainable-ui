import * as react_jsx_runtime from 'react/jsx-runtime';
import * as react from 'react';

/** Snapshot of a single pipeline stage — the core data shape for all components. */
interface StageSnapshot {
    /** Internal stage identifier */
    stageName: string;
    /** Human-readable label */
    stageLabel: string;
    /** Unique per-execution-step identifier. Format: [subflowPath/]stageId#executionIndex. Key for recorder Map lookup. */
    runtimeStageId?: string;
    /** Accumulated memory state after this stage ran */
    memory: Record<string, unknown>;
    /** Narrative text describing what happened */
    narrative: string;
    /** When this stage started (ms from pipeline start) */
    startMs: number;
    /** How long this stage took (ms) */
    durationMs: number;
    /** Execution status */
    status?: "pending" | "active" | "done" | "error";
    /** Human-readable description of what this stage does */
    description?: string;
    /** Subflow identifier (when this stage is inside a subflow) */
    subflowId?: string;
    /** Subflow execution result — present on stages that ran a subflow. */
    subflowResult?: unknown;
}
/** Structured narrative entry — preserves type info for semantic rendering. */
interface NarrativeEntry {
    type: 'stage' | 'step' | 'condition' | 'fork' | 'selector' | 'subflow' | 'loop' | 'break' | 'error' | 'pause' | 'resume';
    text: string;
    depth: number;
    stageName?: string;
    /** Stable stage identifier (matches spec node id). Primary key for UI sync. */
    stageId?: string;
    /** Unique per-execution-step identifier. Format: [subflowPath/]stageId#executionIndex.
     *  Used for exact time-travel sync (preferred over stageId for progressive reveal). */
    runtimeStageId?: string;
    /** Subflow ID when this entry was generated inside a subflow. */
    subflowId?: string;
    /** Direction for subflow entries: 'entry' when entering, 'exit' when leaving. */
    direction?: 'entry' | 'exit';
    stepNumber?: number;
    /** Scope key that was read or written. Only present on 'step' entries. */
    key?: string;
    /** Raw value from the scope event. Only present on 'step' entries. */
    rawValue?: unknown;
}
/** Component size variants */
type Size = "compact" | "default" | "detailed";
/** Common props shared by all visualization components */
interface BaseComponentProps {
    /** Size variant */
    size?: Size;
    /** Strip all built-in styles — bring your own */
    unstyled?: boolean;
    /** Additional CSS class name */
    className?: string;
    /** Inline style overrides */
    style?: React.CSSProperties;
}

/** Default theme tokens — consumers override via CSS variables or ThemeProvider. */
interface ThemeTokens {
    colors?: {
        primary?: string;
        success?: string;
        error?: string;
        warning?: string;
        bgPrimary?: string;
        bgSecondary?: string;
        bgTertiary?: string;
        textPrimary?: string;
        textSecondary?: string;
        textMuted?: string;
        border?: string;
    };
    radius?: string;
    fontFamily?: {
        sans?: string;
        mono?: string;
    };
}
/** Maps ThemeTokens to CSS custom property assignments. */
declare function tokensToCSSVars(tokens: ThemeTokens): Record<string, string>;
/** Raw fallback values — used by tokensToCSSVars() and anywhere a real color is needed. */
declare const rawDefaults: {
    readonly colors: {
        readonly primary: "#6366f1";
        readonly success: "#22c55e";
        readonly error: "#ef4444";
        readonly warning: "#f59e0b";
        readonly bgPrimary: "#0f172a";
        readonly bgSecondary: "#1e293b";
        readonly bgTertiary: "#334155";
        readonly textPrimary: "#f8fafc";
        readonly textSecondary: "#94a3b8";
        readonly textMuted: "#64748b";
        readonly border: "#334155";
    };
    readonly radius: "8px";
    readonly fontFamily: {
        readonly sans: "Inter, system-ui, -apple-system, sans-serif";
        readonly mono: "'JetBrains Mono', 'Fira Code', monospace";
    };
};
/** Default dark theme values with CSS variable references (consumers can override via CSS). */
declare const defaultTokens: Required<{
    [K in keyof ThemeTokens]-?: Required<ThemeTokens[K]>;
}>;

declare function useFootprintTheme(): ThemeTokens;
interface FootprintThemeProps {
    tokens?: ThemeTokens;
    children: React.ReactNode;
}
/**
 * Optional theme provider — wraps children with CSS custom properties.
 * Consumers can also just set --fp-* CSS variables directly.
 */
declare function FootprintTheme({ tokens, children }: FootprintThemeProps): react_jsx_runtime.JSX.Element;

/** Cool dark theme (the library default) */
declare const coolDark: ThemeTokens;
/** Warm dark theme — charcoal-purple palette */
declare const warmDark: ThemeTokens;
/** Warm light theme — cream/peach palette */
declare const warmLight: ThemeTokens;
/** Cool light theme — neutral grays, matches Tailwind zinc palette */
declare const coolLight: ThemeTokens;
/** All built-in theme presets */
declare const themePresets: {
    readonly coolDark: ThemeTokens;
    readonly coolLight: ThemeTokens;
    readonly warmDark: ThemeTokens;
    readonly warmLight: ThemeTokens;
};
type ThemePresetName = keyof typeof themePresets;

/**
 * useDarkModeTokens — Auto-bridge between CSS class-based dark mode and FootprintTheme.
 *
 * Watches for a `.dark` class on <html> (Tailwind convention) and returns
 * the appropriate ThemeTokens preset. Pairs with FootprintTheme:
 *
 *   import { FootprintTheme, useDarkModeTokens } from 'footprint-explainable-ui';
 *
 *   function MyApp() {
 *     const tokens = useDarkModeTokens();
 *     return (
 *       <FootprintTheme tokens={tokens}>
 *         <NarrativeTrace ... />
 *       </FootprintTheme>
 *     );
 *   }
 *
 * Consumers can override the light/dark presets:
 *
 *   const tokens = useDarkModeTokens({ light: warmLight, dark: warmDark });
 */

interface DarkModeTokensOptions {
    /** Tokens to use in light mode. Defaults to coolLight. */
    light?: ThemeTokens;
    /** Tokens to use in dark mode. Defaults to coolDark. */
    dark?: ThemeTokens;
    /** CSS selector to watch for dark mode. Defaults to checking .dark on documentElement. */
    selector?: string;
}
declare function useDarkModeTokens(options?: DarkModeTokensOptions): ThemeTokens;

interface MemoryInspectorProps extends BaseComponentProps {
    /** Single memory object or snapshots (will accumulate up to selectedIndex) */
    data?: Record<string, unknown>;
    /** When using snapshots mode, pass these instead of data */
    snapshots?: StageSnapshot[];
    /** Index to accumulate up to (for time-travel) */
    selectedIndex?: number;
    /** Show data types alongside values */
    showTypes?: boolean;
    /** Highlight keys that are new at this step */
    highlightNew?: boolean;
}
/**
 * Displays pipeline memory state as formatted JSON.
 * Supports both static (data prop) and time-travel (snapshots + selectedIndex) modes.
 */
declare function MemoryInspector({ data, snapshots, selectedIndex, showTypes, highlightNew, size, unstyled, className, style, }: MemoryInspectorProps): react_jsx_runtime.JSX.Element;

interface NarrativeLogProps extends BaseComponentProps {
    /** Snapshots to display narratives from */
    snapshots: StageSnapshot[];
    /** Show narratives up to this index (for time-travel sync) */
    selectedIndex?: number;
    /** Show a single narrative string (simple mode) */
    narrative?: string;
}
/**
 * Timeline-style execution log showing what happened at each stage.
 * Supports both full snapshots mode and single-narrative mode.
 */
declare function NarrativeLog({ snapshots, selectedIndex, narrative, size, unstyled, className, style, }: NarrativeLogProps): react_jsx_runtime.JSX.Element;

interface NarrativeTraceProps extends BaseComponentProps {
    /** All narrative lines (full trace) */
    narrative: string[];
    /** Number of lines currently revealed (for progressive reveal). Defaults to all. */
    revealedCount?: number;
    /** Start with all groups collapsed */
    defaultCollapsed?: boolean;
    /** Called when user clicks a stage header */
    onStageClick?: (headerIndex: number) => void;
}
declare function NarrativeTrace({ narrative, revealedCount, defaultCollapsed, onStageClick, size, unstyled, className, style, }: NarrativeTraceProps): react_jsx_runtime.JSX.Element;

interface GanttTimelineProps extends BaseComponentProps {
    /** Stage snapshots with timing info */
    snapshots: StageSnapshot[];
    /** Currently selected stage index */
    selectedIndex?: number;
    /** Callback when a stage bar is clicked */
    onSelect?: (index: number) => void;
    /** Max visible rows before collapsing (0 = no collapse). Default: 5 */
    maxVisibleRows?: number;
}
/**
 * Horizontal Gantt-style timeline showing stage durations and overlap.
 * Collapses to `maxVisibleRows` with expand/collapse toggle.
 * Auto-scrolls to keep the active stage visible when collapsed.
 */
declare function GanttTimeline({ snapshots, selectedIndex, onSelect, size, unstyled, className, style, maxVisibleRows, }: GanttTimelineProps): react_jsx_runtime.JSX.Element;

interface SnapshotPanelProps extends BaseComponentProps {
    /** Stage snapshots from pipeline execution */
    snapshots: StageSnapshot[];
    /** Show the Gantt timeline */
    showGantt?: boolean;
    /** Show the time-travel scrubber */
    showScrubber?: boolean;
    /** Title override */
    title?: string;
}
/**
 * All-in-one panel: time-travel scrubber + memory inspector + narrative log + gantt.
 * Drop this into any page to make a pipeline run inspectable.
 */
declare function SnapshotPanel({ snapshots, showGantt, showScrubber, title, size, unstyled, className, style, }: SnapshotPanelProps): react_jsx_runtime.JSX.Element;

interface DiffEntry {
    key: string;
    type: "added" | "removed" | "changed" | "unchanged";
    oldValue?: unknown;
    newValue?: unknown;
}
interface ScopeDiffProps extends BaseComponentProps {
    /** Memory state before the current stage */
    previous: Record<string, unknown> | null;
    /** Memory state after the current stage */
    current: Record<string, unknown>;
    /** Hide unchanged keys (default: false) */
    hideUnchanged?: boolean;
}
declare function ScopeDiff({ previous, current, hideUnchanged, size, unstyled, className, style, }: ScopeDiffProps): react_jsx_runtime.JSX.Element;

interface ResultPanelProps extends BaseComponentProps {
    /** Final pipeline output / shared state */
    data: Record<string, unknown> | null;
    /** Optional console log lines */
    logs?: string[];
    /** Hide console section (default: false) */
    hideConsole?: boolean;
}
declare function ResultPanel({ data, logs, hideConsole, size, unstyled, className, style, }: ResultPanelProps): react_jsx_runtime.JSX.Element;

type StageDetailMode = "simple" | "dev";
interface MemoryChange {
    key: string;
    type: "added" | "updated" | "removed";
    oldValue?: unknown;
    newValue?: unknown;
}
interface StageDetailPanelProps extends BaseComponentProps {
    /** Stage snapshots for time-travel */
    snapshots: StageSnapshot[];
    /** Current snapshot index */
    selectedIndex: number;
    /** Display mode: "simple" (description + narrative) or "dev" (memory story) */
    mode?: StageDetailMode;
    /** Show a toggle to switch between simple/dev modes (default: false) */
    showToggle?: boolean;
    /** Called when user toggles mode via built-in toggle */
    onModeChange?: (mode: StageDetailMode) => void;
    /** Keys to exclude from memory display (default: engine internals). Pass empty set to show all. */
    excludeKeys?: Set<string>;
}
declare function StageDetailPanel({ snapshots, selectedIndex, mode: controlledMode, showToggle, onModeChange, size, unstyled, className, style, }: StageDetailPanelProps): react_jsx_runtime.JSX.Element;

interface TimeTravelControlsProps extends BaseComponentProps {
    /** Stage snapshots */
    snapshots: StageSnapshot[];
    /** Currently selected stage index */
    selectedIndex: number;
    /** Callback when selected index changes */
    onIndexChange: (index: number) => void;
    /** Enable auto-play with Gantt-proportional timing */
    autoPlayable?: boolean;
}
declare function TimeTravelControls({ snapshots, selectedIndex, onIndexChange, autoPlayable, size, unstyled, className, style, }: TimeTravelControlsProps): react_jsx_runtime.JSX.Element;

/**
 * Converts a SerializedPipelineStructure (from builder.toSpec()) into
 * ReactFlow nodes and edges with auto-layout.
 *
 * Two-phase approach for performance:
 * 1. `specToLayout(spec)` — tree walk + positioning (expensive, cached on spec)
 * 2. `applyOverlay(layout, overlay)` — color nodes/edges (cheap, runs per slider tick)
 *
 * `specToReactFlow(spec, overlay)` combines both for convenience.
 */

interface SpecNode {
    name: string;
    id?: string;
    type?: "stage" | "decider" | "selector" | "fork" | "streaming";
    /** Semantic icon hint — rendered by StageNode. Common values:
     *  "llm", "tool", "rag", "search", "parse", "start", "end", "loop",
     *  "agent", "swarm", "guard", "stream", "memory" */
    icon?: string;
    description?: string;
    children?: SpecNode[];
    next?: SpecNode;
    branchIds?: string[];
    hasDecider?: boolean;
    hasSelector?: boolean;
    loopTarget?: string;
    isSubflowRoot?: boolean;
    subflowId?: string;
    subflowName?: string;
    subflowStructure?: SpecNode;
    /** True when this subflow uses lazy resolution (deferred until execution). */
    isLazy?: boolean;
}

/** Tab ID — "result", "memory", "narrative", or any custom recorder view ID. */
type ShellTab = string;
interface PanelLabels {
    /** Left panel pill label (subflow tree). Default: "Topology" */
    topology?: string;
    /** Right panel pill label (memory/narrative). Default: "Details" */
    details?: string;
    /** Bottom panel pill label (timeline). Default: "Timeline" */
    timeline?: string;
}
/** Which panels start expanded. Default: `{ details: true }` (flowchart + memory). */
interface DefaultExpanded {
    topology?: boolean;
    details?: boolean;
    timeline?: boolean;
}
/**
 * Raw runtime snapshot from FlowChartExecutor.getSnapshot().
 * When provided, ExplainableShell converts it internally — zero boilerplate.
 */
interface RuntimeSnapshotInput {
    sharedState: Record<string, unknown>;
    executionTree: unknown;
    commitLog: unknown[];
    subflowResults?: Record<string, unknown>;
    /** Recorder snapshots from FlowRecorder.toSnapshot() — auto-generates detail tabs. */
    recorders?: Array<{
        id: string;
        name: string;
        data: unknown;
    }>;
}
/**
 * A recorder view that appears as a tab in the details panel.
 * Each recorder provides its own per-stage rendering.
 * Memory and Narrative are built-in defaults — add more via this prop.
 */
interface RecorderView {
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
interface ExplainableShellProps extends BaseComponentProps {
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
declare function ExplainableShell({ snapshots: snapshotsProp, runtimeSnapshot, spec, title, resultData: resultDataProp, logs, narrative: narrativeProp, narrativeEntries, tabs, defaultTab, hideConsole, hideTabs: hideTabsProp, panelLabels, defaultExpanded, recorderViews, renderFlowchart, size, unstyled, className, style, }: ExplainableShellProps): react_jsx_runtime.JSX.Element;

interface MemoryPanelProps extends BaseComponentProps {
    snapshots: StageSnapshot[];
    selectedIndex: number;
}
declare function MemoryPanel({ snapshots, selectedIndex, size, unstyled, className, style, }: MemoryPanelProps): react_jsx_runtime.JSX.Element;

interface NarrativePanelProps extends BaseComponentProps {
    snapshots: StageSnapshot[];
    selectedIndex: number;
    /** Structured narrative entries (preferred — richer rendering) */
    narrativeEntries?: NarrativeEntry[];
    /** Plain narrative lines (fallback) */
    narrative?: string[];
}
declare function NarrativePanel({ snapshots, selectedIndex, narrativeEntries, narrative: narrativeProp, size, unstyled, className, style, }: NarrativePanelProps): react_jsx_runtime.JSX.Element;

interface StoryNarrativeProps extends BaseComponentProps {
    /** Structured narrative entries from CombinedNarrativeRecorder */
    entries: NarrativeEntry[];
    /** Number of entries to reveal (position-based sync from NarrativePanel) */
    revealedEntryCount: number;
}
declare function StoryNarrative({ entries, revealedEntryCount, size, unstyled, className, style: outerStyle, }: StoryNarrativeProps): react_jsx_runtime.JSX.Element;

interface SubflowTreeEntry {
    /** Node name / identifier */
    name: string;
    /** Human-readable description */
    description?: string;
    /** Subflow ID (when this node represents a subflow) */
    subflowId?: string;
    /** Whether this node is a subflow root (has nested structure) */
    isSubflow?: boolean;
    /** Nested children (subflow stages) */
    children?: SubflowTreeEntry[];
}
interface SubflowTreeProps extends BaseComponentProps {
    /** Pipeline spec to derive the tree from */
    spec: SpecNode;
    /** Currently active stage name (highlights in tree) */
    activeStage?: string | null;
    /** Set of completed stage names */
    doneStages?: Set<string>;
    /** Called when a tree node is clicked */
    onNodeSelect?: (name: string, isSubflow: boolean) => void;
}
declare const SubflowTree: react.NamedExoticComponent<SubflowTreeProps>;

/**
 * Shape of FootPrint's RuntimeSnapshot (from FlowChartExecutor.getSnapshot()).
 * We define it here instead of importing to avoid a hard dependency on footprintjs.
 */
interface RuntimeStageSnapshot {
    id: string;
    name?: string;
    isDecider?: boolean;
    isFork?: boolean;
    /** User-level writes made by this stage (pre-namespace keys → values). */
    stageWrites?: Record<string, unknown>;
    logs: Record<string, unknown>;
    errors: Record<string, unknown>;
    metrics: Record<string, unknown>;
    evals: Record<string, unknown>;
    flowMessages?: unknown[];
    description?: string;
    subflowId?: string;
    next?: RuntimeStageSnapshot;
    children?: RuntimeStageSnapshot[];
}
interface RecorderSnapshot {
    id: string;
    name: string;
    data: unknown;
}
interface RuntimeSnapshot {
    sharedState: Record<string, unknown>;
    executionTree: RuntimeStageSnapshot;
    commitLog: unknown[];
    /** Per-subflow execution results (keyed by subflowId). */
    subflowResults?: Record<string, unknown>;
    /** Snapshots from recorders that implement toSnapshot() (e.g. MetricRecorder). */
    recorders?: RecorderSnapshot[];
}

/**
 * Converts a FootPrint RuntimeSnapshot into a flat array of StageSnapshots
 * suitable for visualization components.
 *
 * The `narrativeEntries` parameter (from `executor.getNarrativeEntries()`)
 * distributes the library's rich combined narrative per-stage.
 * When narrative is not enabled, stages get "Narrative not available" —
 * this adapter reflects what the library produces, nothing more.
 *
 * Usage:
 * ```ts
 * const executor = new FlowChartExecutor(chart);
 * await executor.run();
 * const snapshots = toVisualizationSnapshots(
 *   executor.getSnapshot(),
 *   executor.getNarrativeEntries(),
 * );
 * ```
 */
declare function toVisualizationSnapshots(runtime: RuntimeSnapshot, narrativeEntries?: NarrativeEntry[]): StageSnapshot[];
/**
 * Converts a footprintjs SubflowResult (stored on StageSnapshot.subflowResult)
 * into visualization snapshots for drill-down views.
 *
 * SubflowResult shape (from footprintjs):
 *   { subflowId, subflowName, treeContext: { globalContext, stageContexts, history }, parentStageId }
 *
 * Returns empty array if the input is not a valid SubflowResult.
 */
declare function subflowResultToSnapshots(subflowResult: unknown, narrativeEntries?: NarrativeEntry[]): StageSnapshot[];
/**
 * Creates StageSnapshots from simple arrays (when you don't have a RuntimeSnapshot).
 * Useful for testing or custom data sources.
 */
declare function createSnapshots(stages: Array<{
    name: string;
    label?: string;
    memory?: Record<string, unknown>;
    narrative?: string;
    durationMs?: number;
    description?: string;
    subflowId?: string;
}>): StageSnapshot[];

/**
 * Narrative sync utilities — shared logic for mapping timeline position
 * to narrative entries. Used by NarrativePanel and available to consumers
 * building custom visualization shells.
 */

/**
 * Range index: runtimeStageId → half-open range [firstIdx, endIdx) in entries array.
 *
 * This is the same shape as `SequenceRecorder.getEntryRanges()` in footprintjs.
 * When you have recorder access, pass `recorder.getEntryRanges()` directly.
 * When you only have the flat array, use `buildEntryRangeIndex()` to build it.
 */
type EntryRangeIndex = ReadonlyMap<string, {
    readonly firstIdx: number;
    readonly endIdx: number;
}>;
/**
 * Build a range index from a flat entries array for O(1) per-step lookups.
 * Equivalent to `SequenceRecorder.getEntryRanges()` but works on detached arrays.
 *
 * Call once when narrativeEntries changes, then pass to `computeRevealedEntryCount`.
 *
 * @param entries — structured entries (from CombinedNarrativeRecorder.getEntries() or getNarrativeEntries())
 * @returns range index for fast slider sync
 */
declare function buildEntryRangeIndex(entries: Pick<NarrativeEntry, "runtimeStageId">[]): EntryRangeIndex;
/**
 * Compute how many narrative entries to reveal at a given slider position.
 *
 * **With range index (preferred):** O(selectedIndex) — one Map lookup per snapshot.
 * **Without index (convenience):** O(entries) forward scan.
 *
 * The range index can come from:
 * - `SequenceRecorder.getEntryRanges()` (when you have recorder access)
 * - `buildEntryRangeIndex(entries)` (when you only have the flat array)
 *
 * @param narrativeEntries — structured entries from CombinedNarrativeRecorder
 * @param snapshots — execution timeline (from adapter)
 * @param selectedIndex — current slider position (0-based)
 * @param rangeIndex — optional precomputed range index for O(1) lookups
 * @returns number of entries to reveal (0 to narrativeEntries.length)
 */
declare function computeRevealedEntryCount(narrativeEntries: NarrativeEntry[], snapshots: Pick<StageSnapshot, "runtimeStageId">[], selectedIndex: number, rangeIndex?: EntryRangeIndex): number;
/**
 * Extract narrative entries belonging to a specific subflow.
 *
 * Three-tier matching (most reliable first):
 * 1. `stageName` prefix match (e.g., entries with `stageName` starting with `"sf-pay/"`)
 * 2. `subflowId` field match
 * 3. `direction` field on subflow entry/exit markers (renderer-agnostic)
 *
 * @param entries — all narrative entries from the execution
 * @param subflowId — subflow identifier to extract
 * @param subflowName — optional display name for fallback matching
 * @returns entries belonging to the subflow
 */
declare function extractSubflowNarrative(entries: NarrativeEntry[], subflowId: string, subflowName?: string): NarrativeEntry[];

export { type NarrativeEntry as AdapterNarrativeEntry, type BaseComponentProps, type DarkModeTokensOptions, type DefaultExpanded, type DiffEntry, type EntryRangeIndex, ExplainableShell, type ExplainableShellProps, FootprintTheme, GanttTimeline, type GanttTimelineProps, type MemoryChange, MemoryInspector, type MemoryInspectorProps, MemoryPanel, type MemoryPanelProps, type NarrativeEntry, NarrativeLog, type NarrativeLogProps, NarrativePanel, type NarrativePanelProps, NarrativeTrace, type NarrativeTraceProps, type PanelLabels, type RecorderView, ResultPanel, type ResultPanelProps, type RuntimeSnapshotInput, ScopeDiff, type ScopeDiffProps, type ShellTab, type Size, SnapshotPanel, type SnapshotPanelProps, type StageDetailMode, StageDetailPanel, type StageDetailPanelProps, type StageSnapshot, StoryNarrative, type StoryNarrativeProps, SubflowTree, type SubflowTreeEntry, type SubflowTreeProps, type ThemePresetName, type ThemeTokens, TimeTravelControls, type TimeTravelControlsProps, buildEntryRangeIndex, computeRevealedEntryCount, coolDark, coolLight, createSnapshots, defaultTokens, extractSubflowNarrative, rawDefaults, subflowResultToSnapshots, themePresets, toVisualizationSnapshots, tokensToCSSVars, useDarkModeTokens, useFootprintTheme, warmDark, warmLight };
