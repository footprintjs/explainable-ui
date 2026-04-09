import * as react_jsx_runtime from 'react/jsx-runtime';
import * as _xyflow_react from '@xyflow/react';
import { Node, Edge, NodeTypes } from '@xyflow/react';
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

interface FlowchartViewProps extends BaseComponentProps {
    /** ReactFlow nodes */
    nodes: Node[];
    /** ReactFlow edges */
    edges: Edge[];
    /** Optional snapshots for state-aware rendering (done/active coloring) */
    snapshots?: StageSnapshot[];
    /** Currently selected snapshot index (for state coloring) */
    selectedIndex?: number;
    /** Callback when a node is clicked */
    onNodeClick?: (index: number) => void;
}
/**
 * Pipeline flowchart visualization using ReactFlow.
 * When snapshots are provided, nodes are colored by execution state.
 */
declare function FlowchartView({ nodes: rawNodes, edges: rawEdges, snapshots, selectedIndex, onNodeClick, unstyled, className, style, }: FlowchartViewProps): react_jsx_runtime.JSX.Element;

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
interface ExecutionOverlay {
    /** Names of stages that have completed (before the active one) */
    doneStages: Set<string>;
    /** Name of the currently active stage */
    activeStage: string | null;
    /** Names of all stages that were executed (done + active) */
    executedStages: Set<string>;
    /** Ordered list of executed stage names (for step numbering) */
    executionOrder?: string[];
}
/** Colors for the flowchart — consumer provides these to match their theme */
interface FlowchartColors {
    edgeDefault: string;
    edgeExecuted: string;
    edgeActive: string;
    edgeLoop: string;
    labelDefault: string;
    labelExecuted: string;
    labelLoop: string;
    pathGlow: string;
}
/** A positioned node with all static info, before overlay is applied. */
interface LayoutNode {
    id: string;
    x: number;
    y: number;
    label: string;
    isDecider: boolean;
    isFork: boolean;
    description?: string;
    icon?: string;
    subflowId?: string;
    isSubflow: boolean;
    isLazy?: boolean;
}
/** A positioned edge with source/target info. */
interface LayoutEdge {
    id: string;
    source: string;
    target: string;
    label?: string;
    isLoop: boolean;
}
/** Static layout output — positions + structure, no execution state. */
interface SpecLayout {
    nodes: LayoutNode[];
    edges: LayoutEdge[];
    /** Maps stage ID → node id for resolving loopTarget references. */
    idToName: Map<string, string>;
}
/**
 * Phase 1: Compute static layout from spec. Cached on spec reference — only
 * recomputes when the pipeline structure changes, not on every slider tick.
 */
declare function specToLayout(spec: SpecNode): SpecLayout;
/**
 * Phase 2: Apply execution overlay to static layout.
 * Produces ReactFlow nodes/edges with correct colors, step numbers, and glow.
 */
declare function applyOverlay(layout: SpecLayout, overlay?: ExecutionOverlay, colors?: Partial<FlowchartColors>): {
    nodes: Node[];
    edges: Edge[];
};
/**
 * Convert a pipeline spec to ReactFlow graph.
 * Pass `overlay` to color nodes/edges by execution state.
 */
declare function specToReactFlow(spec: SpecNode, overlay?: ExecutionOverlay, colors?: Partial<FlowchartColors>): {
    nodes: Node[];
    edges: Edge[];
};

interface TracedFlowchartViewProps extends BaseComponentProps {
    /** Pipeline spec from builder.toSpec() — for the current level */
    spec: SpecNode;
    /** Visualization snapshots (enables trace overlay when provided) */
    snapshots?: StageSnapshot[];
    /** Current time-travel position */
    snapshotIndex?: number;
    /** Callback when a node is clicked (receives snapshot index, or node id if no snapshots) */
    onNodeClick?: (indexOrId: number | string) => void;
    /** Override default node types */
    nodeTypes?: NodeTypes;
}
declare function TracedFlowchartView({ spec, snapshots, snapshotIndex, onNodeClick, nodeTypes: customNodeTypes, unstyled, className, style, }: TracedFlowchartViewProps): react_jsx_runtime.JSX.Element;

interface BreadcrumbEntry {
    /** Display name for this level */
    label: string;
    /** The spec node tree at this level */
    spec: SpecNode;
    /** Human-readable description of this subflow */
    description?: string;
}
interface SubflowNavigation {
    /** Current breadcrumb path (root → ... → current) */
    breadcrumbs: BreadcrumbEntry[];
    /** Current level's ReactFlow nodes */
    nodes: Node[];
    /** Current level's ReactFlow edges */
    edges: Edge[];
    /** Call when a node is clicked — drills in if it's a subflow */
    handleNodeClick: (nodeId: string) => boolean;
    /** Navigate to a specific breadcrumb level (0 = root) */
    navigateTo: (level: number) => void;
    /** Whether we're currently inside a subflow (not at root) */
    isInSubflow: boolean;
    /** Name of the subflow node we drilled into (for finding execution data) */
    currentSubflowNodeName: string | null;
}
/**
 * Hook that manages subflow drill-down navigation for a flowchart spec.
 *
 * Maintains a breadcrumb stack. When a subflow node is clicked, pushes its
 * nested spec onto the stack and re-derives nodes/edges. Breadcrumb clicks
 * pop back to that level.
 */
declare function useSubflowNavigation(rootSpec: SpecNode | null, overlay?: ExecutionOverlay, colors?: Partial<FlowchartColors>): SubflowNavigation;

interface SubflowBreadcrumbProps {
    breadcrumbs: BreadcrumbEntry[];
    onNavigate: (level: number) => void;
}
/**
 * Breadcrumb bar for subflow drill-down navigation.
 * Shows: Root > SubflowA > SubflowB — clicking any crumb navigates back.
 */
declare const SubflowBreadcrumb: react.NamedExoticComponent<SubflowBreadcrumbProps>;

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

interface StageNodeData {
    label: string;
    active?: boolean;
    done?: boolean;
    error?: boolean;
    linked?: boolean;
    /** Semantic icon hint (e.g., "llm", "tool", "rag", "start", "parse", "agent", "guard") */
    icon?: string;
    /** Step numbers in execution order (shown as badges — multiple when revisited via loops) */
    stepNumbers?: number[];
    /** Node was not executed (dim it) */
    dimmed?: boolean;
    /** Node is a subflow root (show nested indicator) */
    isSubflow?: boolean;
    /** Node uses lazy resolution (dashed border + cloud icon when unresolved) */
    isLazy?: boolean;
    /** Node is a decider (renders as diamond shape per flowchart convention) */
    isDecider?: boolean;
    /** Node is a fork (parallel fan-out) */
    isFork?: boolean;
    /** Human-readable description of what this stage does */
    description?: string;
    /** Subflow identifier — set when this node belongs to a subflow */
    subflowId?: string;
    [key: string]: unknown;
}
/**
 * Custom ReactFlow node for pipeline stages.
 * All colors and fonts come from `--fp-*` CSS variables (via theme).
 * Shows execution state via color, icon, step badge, and pulse animation.
 */
declare const StageNode: react.NamedExoticComponent<Pick<_xyflow_react.Node<Record<string, unknown>, string | undefined>, "id" | "data" | "width" | "height" | "sourcePosition" | "targetPosition" | "dragHandle" | "parentId"> & Required<Pick<_xyflow_react.Node<Record<string, unknown>, string | undefined>, "type" | "dragging" | "zIndex" | "selectable" | "deletable" | "selected" | "draggable">> & {
    isConnectable: boolean;
    positionAbsoluteX: number;
    positionAbsoluteY: number;
} & {
    data: StageNodeData;
}>;

interface TimeTravelDebuggerProps extends BaseComponentProps {
    /** Stage snapshots */
    snapshots: StageSnapshot[];
    /** ReactFlow nodes (required for flowchart) */
    nodes: Node[];
    /** ReactFlow edges (required for flowchart) */
    edges: Edge[];
    /** Show Gantt timeline */
    showGantt?: boolean;
    /** Layout direction */
    layout?: "horizontal" | "vertical";
    /** Title */
    title?: string;
}
/**
 * Full time-travel debugger: scrubber + flowchart + memory + narrative + gantt.
 * This is the "batteries included" component for pipeline debugging.
 */
declare function TimeTravelDebugger({ snapshots, nodes, edges, showGantt, layout, title, size, unstyled, className, style, }: TimeTravelDebuggerProps): react_jsx_runtime.JSX.Element;

export { type BreadcrumbEntry, type ExecutionOverlay, type FlowchartColors, FlowchartView, type FlowchartViewProps, type LayoutEdge, type LayoutNode, type SpecLayout, type SpecNode, StageNode, type StageNodeData, SubflowBreadcrumb, type SubflowBreadcrumbProps, type SubflowNavigation, SubflowTree, type SubflowTreeEntry, type SubflowTreeProps, TimeTravelDebugger, type TimeTravelDebuggerProps, TracedFlowchartView, type TracedFlowchartViewProps, applyOverlay, specToLayout, specToReactFlow, useSubflowNavigation };
