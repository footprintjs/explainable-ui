// Flowchart components (require @xyflow/react peer dependency)
// Import from "footprint-explainable-ui/flowchart"

export { FlowchartView } from "./components/FlowchartView";
export type { FlowchartViewProps } from "./components/FlowchartView";

export { StageNode } from "./components/StageNode";
export type { StageNodeData } from "./components/StageNode";

export { TimeTravelDebugger } from "./components/TimeTravelDebugger";
export type { TimeTravelDebuggerProps } from "./components/TimeTravelDebugger";

export { specToReactFlow, specToLayout, applyOverlay } from "./components/FlowchartView/specToReactFlow";
export type {
  SpecNode,
  ExecutionOverlay,
  FlowchartColors,
  SpecLayout,
  LayoutNode,
  LayoutEdge,
} from "./components/FlowchartView/specToReactFlow";

// Self-contained traced flowchart (spec + snapshots → full visualization)
export { TracedFlowchartView } from "./components/FlowchartView";
export type { TracedFlowchartViewProps } from "./components/FlowchartView";

// Subflow drill-down navigation
export { SubflowBreadcrumb } from "./components/FlowchartView";
export type { SubflowBreadcrumbProps } from "./components/FlowchartView";
export { useSubflowNavigation } from "./components/FlowchartView";
export type { SubflowNavigation, BreadcrumbEntry } from "./components/FlowchartView";

// Subflow manifest tree (no ReactFlow dependency — pure React)
export { SubflowTree } from "./components/FlowchartView";
export type { SubflowTreeProps, SubflowTreeEntry } from "./components/FlowchartView";
