// Flowchart components (require @xyflow/react peer dependency)
// Import from "footprint-explainable-ui/flowchart"
//
// v6+: recorder-driven only. The legacy spec-walk path was deleted.
// Drive the chart via `createTraceStructureRecorder` →
// `<TraceFlow graph={...} />` (build-time) or
// `<TracedFlow graph={...} overlay={...} scrubIndex={...} />`
// (build + runtime).

export { StageNode } from "./components/StageNode";
export type { StageNodeData } from "./components/StageNode";

export { TimeTravelDebugger } from "./components/TimeTravelDebugger";
export type { TimeTravelDebuggerProps } from "./components/TimeTravelDebugger";

// Subflow drill-down navigation (recorder-driven)
export { SubflowBreadcrumb } from "./components/FlowchartView";
export type { SubflowBreadcrumbProps } from "./components/FlowchartView";
export { useSubflowNavigation } from "./components/FlowchartView";
export type { SubflowNavigation, BreadcrumbEntry } from "./components/FlowchartView";

// Drill-scope graph filter (top-level view = subflows as single cards).
export { filterGraphForDrill, buildSubflowBreadcrumb } from "./components/FlowchartView";

// Subflow manifest tree (no ReactFlow dependency — pure React)
export { SubflowTree } from "./components/FlowchartView";
export type { SubflowTreeProps, SubflowTreeEntry } from "./components/FlowchartView";

// v6.0+ — event-driven trace recorder + xyflow renderer (StructureRecorder
// consumer pattern, no spec-tree post-walk required).
export { createTraceStructureRecorder } from "./components/FlowchartView";
export type {
  MinimalStructureRecorder,
  TraceNode,
  TraceEdge,
  TraceNodeData,
  TraceEdgeData,
  TraceGraph,
  TraceStructureRecorderHandle,
  CreateTraceStructureRecorderOptions,
} from "./components/FlowchartView";

export { TraceFlow, defaultTraceFlowLayout } from "./components/FlowchartView";
export type {
  TraceFlowProps,
  TraceFlowLayout,
  TraceFlowEdgeColors,
} from "./components/FlowchartView";

// v7.0 — runtime overlay recorder + traced (build+runtime) component.
// Pair with createTraceStructureRecorder for the full time-travel
// trace UI without spec-tree post-walks.
export { createTraceRuntimeOverlay, sliceOverlay } from "./components/FlowchartView";
export type {
  MinimalFlowRecorder,
  RuntimeExecutionStep,
  RuntimeOverlay,
  RuntimeOverlaySlice,
  TraceRuntimeOverlayHandle,
  CreateTraceRuntimeOverlayOptions,
} from "./components/FlowchartView";

export { TracedFlow } from "./components/FlowchartView";
export type { TracedFlowProps, TracedFlowColors } from "./components/FlowchartView";

// Loop-back edge — curves `loopTo` edges along the right margin. Built-in in
// TraceFlow/TracedFlow; exported for consumers that fully replace `edgeTypes`.
export { LoopBackEdge } from "./components/FlowchartView";
// Smart step edge — routes rank-skipping (staggered) edges around skipped nodes.
// Built-in `smartStep`; exported for consumers that fully replace `edgeTypes`.
export { SmartStepEdge } from "./components/FlowchartView";

// Group containers (subflow-as-box, xyflow native nesting via parentId).
export {
  GroupContainerNode,
  SlotPillNode,
  applyGroupLayout,
  createGroupedLayout,
  wrapInMainChartBox,
  createMainChartBoxLayout,
  GROUP_CONTAINER_NODE_TYPE,
  MAIN_CHART_BOX_ID,
} from "./components/FlowchartView";
export type {
  GroupContainerNodeData,
  SlotPillNodeData,
  GroupLayoutOptions,
  MainChartBoxOptions,
} from "./components/FlowchartView";

// Dagre layout — structure-derived spacing; the professor-grade default.
export { dagreTraceLayout, createDagreTraceLayout } from "./components/FlowchartView";
export type {
  DagreTraceLayoutOptions,
  NodeFootprint,
  NodeSizeResolver,
  EdgeWeightResolver,
  EdgeMinLenResolver,
  SiblingOrderResolver,
} from "./components/FlowchartView";

// Post-dagre spine alignment — snaps pure linear successors onto their single
// predecessor's center-x (fixes balanced-mode drift). Opt-in via compose.
export { snapLinearSuccessors, createSnappedDagreLayout } from "./components/FlowchartView";
export type { SnapLinearSuccessorsOptions } from "./components/FlowchartView";

// Group-based layout — longest-path rank bands + span-centered merges, for
// structured flowcharts with staggered merges. Composes with the snap pass.
export { traceGroupLayout, createTraceGroupLayout } from "./components/FlowchartView";
export type { TraceGroupLayoutOptions } from "./components/FlowchartView";

// L8.0 — landing strip exports.
export { createTraceBundle } from "./components/FlowchartView";
export type {
  TraceBundle,
  CreateTraceBundleOptions,
} from "./components/FlowchartView";

export { useTranslator } from "./components/FlowchartView";
export type { TranslatorHandleLike } from "./components/FlowchartView";

export { asStageId, asRuntimeStageId } from "./components/FlowchartView";
export type { StageId, RuntimeStageId } from "./components/FlowchartView";

// L8.1 — NodeView translator + traversal helpers + inspector renderer
export { createNodeViewRecorder } from "./components/FlowchartView";
export type {
  MinimalNodeViewRecorder,
  NodeView,
  NodeViewIndex,
  ExecutionRecord,
  NodeViewRecorderHandle,
  CreateNodeViewRecorderOptions,
} from "./components/FlowchartView";

export {
  walkForward,
  walkBackward,
  backtraceStructural,
  forwardtraceStructural,
} from "./components/FlowchartView";
export type { WalkOptions } from "./components/FlowchartView";

export { NodeInspector } from "./components/FlowchartView";
export type { NodeInspectorProps } from "./components/FlowchartView";

// L8.2 — CommitFlow translator + data-lineage backtrace + inspector
export {
  createCommitFlowRecorder,
  backtraceDataFlow,
} from "./components/FlowchartView";
export type {
  MinimalCommitFlowRecorder,
  CommitView,
  CommitFlowIndex,
  DataDependency,
  CommitFlowRecorderHandle,
  CreateCommitFlowRecorderOptions,
} from "./components/FlowchartView";

export { CommitInspector } from "./components/FlowchartView";
export type { CommitInspectorProps } from "./components/FlowchartView";

// L8.3 — series-parallel chain tree builders + git-log swim-lane renderer
export {
  structureAsChainTree,
  buildCommitChainTree,
} from "./components/FlowchartView";
export type {
  StructureChain,
  StructureChainLeaf,
  CommitChain,
  CommitChainLeaf,
  ChainTreeOptions,
} from "./components/FlowchartView";

export { CommitChainView } from "./components/FlowchartView";
export type { CommitChainViewProps } from "./components/FlowchartView";

// L8.4 — composed shell wiring the full L8 stack into a master/detail UI
export { TraceExplorerShell } from "./components/FlowchartView";
export type {
  TraceExplorerShellProps,
  TraceExplorerSlots,
  ChainSlotProps,
  CommitInspectorSlotProps,
  NodeInspectorSlotProps,
  SliderSlotProps,
} from "./components/FlowchartView";

// L8.5 — time-travel cursor slider (ONE-CURSOR model)
export { RunSlider } from "./components/FlowchartView";
export type { RunSliderProps } from "./components/FlowchartView";
