export { SubflowBreadcrumb } from "./SubflowBreadcrumb";
export type { SubflowBreadcrumbProps } from "./SubflowBreadcrumb";

export { useSubflowNavigation } from "./useSubflowNavigation";
export type { SubflowNavigation, BreadcrumbEntry } from "./useSubflowNavigation";

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
