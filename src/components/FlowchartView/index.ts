export { SubflowBreadcrumb } from "./SubflowBreadcrumb";
export type { SubflowBreadcrumbProps } from "./SubflowBreadcrumb";

export { useSubflowNavigation } from "./useSubflowNavigation";
export type { SubflowNavigation, BreadcrumbEntry } from "./useSubflowNavigation";

// Drill-scope graph filter — show one level (top-level when null, else a
// subflow's internals). Use to render a top-level view where subflows are
// single drill cards (their internals hidden until drilled). Pure.
export { filterGraphForDrill, buildSubflowBreadcrumb } from "./_internal/subflowDrill";

export { SubflowTree } from "./SubflowTree";
export type { SubflowTreeProps, SubflowTreeEntry } from "./SubflowTree";

export { createTraceStructureRecorder } from "./traceStructureRecorder";
export type {
  MinimalStructureRecorder,
  TraceNode,
  TraceEdge,
  TraceNodeData,
  TraceEdgeData,
  TraceGraph,
  TraceStructureRecorderHandle,
  CreateTraceStructureRecorderOptions,
} from "./traceStructureRecorder";

export { TraceFlow, defaultTraceFlowLayout } from "./TraceFlow";
export type {
  TraceFlowProps,
  TraceFlowLayout,
  TraceFlowEdgeColors,
} from "./TraceFlow";

export { createTraceRuntimeOverlay, sliceOverlay } from "./createTraceRuntimeOverlay";
export type {
  MinimalFlowRecorder,
  RuntimeExecutionStep,
  RuntimeOverlay,
  RuntimeOverlaySlice,
  TraceRuntimeOverlayHandle,
  CreateTraceRuntimeOverlayOptions,
} from "./createTraceRuntimeOverlay";

export { TracedFlow } from "./TracedFlow";
export type { TracedFlowProps, TracedFlowColors } from "./TracedFlow";

// Group containers — render chosen subflows as xyflow native parentId boxes
// (members nested inside) instead of drill cards. See groupLayout.ts.
export { GroupContainerNode } from "../GroupContainerNode";
export type { GroupContainerNodeData } from "../GroupContainerNode";
export { SlotPillNode } from "../SlotPillNode";
export type { SlotPillNodeData } from "../SlotPillNode";

// Loop-back edge — curves `loopTo` edges along the right margin (clear of the
// spine). Registered as a built-in `loopBack` edge type in TraceFlow/TracedFlow;
// exported so consumers who fully replace `edgeTypes` can re-register it.
export { LoopBackEdge } from "../LoopBackEdge";
// Smart step edge — routes a rank-skipping (staggered) edge around the node it
// skips. Registered as the built-in `smartStep` step edge; exported so consumers
// who fully replace `edgeTypes` can re-register it.
export { SmartStepEdge } from "../SmartStepEdge";
export {
  applyGroupLayout,
  createGroupedLayout,
  wrapInMainChartBox,
  createMainChartBoxLayout,
  GROUP_CONTAINER_NODE_TYPE,
  MAIN_CHART_BOX_ID,
} from "./_internal/groupLayout";
export type { GroupLayoutOptions, MainChartBoxOptions } from "./_internal/groupLayout";

// Dagre-backed layout — structure-derived spacing (fork fan-out by subtree
// width, rank-depth ranking, centered merges). The professor-grade default.
export { dagreTraceLayout, createDagreTraceLayout } from "./_internal/dagreTraceLayout";
export type {
  DagreTraceLayoutOptions,
  NodeFootprint,
  NodeSizeResolver,
  EdgeWeightResolver,
  EdgeMinLenResolver,
  SiblingOrderResolver,
} from "./_internal/dagreTraceLayout";

// Post-dagre spine alignment — snaps pure linear successors onto their single
// predecessor's center-x (fixes balanced-mode drift on asymmetric graphs).
// Opt-in: compose AFTER dagre via `createSnappedDagreLayout`.
export {
  snapLinearSuccessors,
  createSnappedDagreLayout,
} from "./_internal/snapLinearSuccessors";
export type { SnapLinearSuccessorsOptions } from "./_internal/snapLinearSuccessors";

// Group-based layout — longest-path rank bands + merge-centering-by-construction
// (each merge centered under the SPAN of its inputs). Built for structured
// flowcharts with STAGGERED merges (e.g. the agent merge-tree) where generic
// dagre needs hand-tuning. Reuses `sizeOf`; composes with the snap pass above
// (`createSnappedDagreLayout(createTraceGroupLayout({nodeSize}), {nodeSize})`).
export { traceGroupLayout, createTraceGroupLayout } from "./_internal/traceGroupLayout";
export type { TraceGroupLayoutOptions } from "./_internal/traceGroupLayout";

// L8.0 landing strip — shared infra + bundle + React hook
export { createTraceBundle } from "./createTraceBundle";
export type {
  TraceBundle,
  CreateTraceBundleOptions,
} from "./createTraceBundle";

export { useTranslator } from "./_internal/useTranslator";
export type { TranslatorHandleLike } from "./_internal/useTranslator";

export { asStageId, asRuntimeStageId } from "./_internal/keys";
export type { StageId, RuntimeStageId } from "./_internal/keys";

// L8.1 — NodeView translator + traversal helpers + inspector renderer
export { createNodeViewRecorder } from "./createNodeViewRecorder";
export type {
  MinimalNodeViewRecorder,
  NodeView,
  NodeViewIndex,
  ExecutionRecord,
  NodeViewRecorderHandle,
  CreateNodeViewRecorderOptions,
} from "./createNodeViewRecorder";

export {
  walkForward,
  walkBackward,
  backtraceStructural,
  forwardtraceStructural,
} from "./walkHelpers";
export type { WalkOptions } from "./walkHelpers";

export { NodeInspector } from "./NodeInspector";
export type { NodeInspectorProps } from "./NodeInspector";

// L8.2 — CommitFlow translator + data-lineage backtrace + inspector
export {
  createCommitFlowRecorder,
  backtraceDataFlow,
} from "./createCommitFlowRecorder";
export type {
  MinimalCommitFlowRecorder,
  CommitView,
  CommitFlowIndex,
  DataDependency,
  CommitFlowRecorderHandle,
  CreateCommitFlowRecorderOptions,
} from "./createCommitFlowRecorder";

export { CommitInspector } from "./CommitInspector";
export type { CommitInspectorProps } from "./CommitInspector";

// L8.3 — series-parallel chain tree builders + git-log swim-lane renderer
export {
  structureAsChainTree,
  buildCommitChainTree,
} from "./buildCommitChainTree";
export type {
  StructureChain,
  StructureChainLeaf,
  CommitChain,
  CommitChainLeaf,
  ChainTreeOptions,
} from "./buildCommitChainTree";

export { CommitChainView } from "./CommitChainView";
export type { CommitChainViewProps } from "./CommitChainView";

// L8.4 — composed shell wiring the full L8 stack into a master/detail UI
export { TraceExplorerShell } from "./TraceExplorerShell";
export type {
  TraceExplorerShellProps,
  TraceExplorerSlots,
  ChainSlotProps,
  CommitInspectorSlotProps,
  NodeInspectorSlotProps,
  SliderSlotProps,
} from "./TraceExplorerShell";

// L8.5 — time-travel cursor slider (ONE-CURSOR model)
export { RunSlider } from "./RunSlider";
export type { RunSliderProps } from "./RunSlider";
