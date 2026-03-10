// Flowchart components (require @xyflow/react peer dependency)
// Import from "footprint-explainable-ui/flowchart"

export { FlowchartView } from "./components/FlowchartView";
export type { FlowchartViewProps } from "./components/FlowchartView";

export { StageNode } from "./components/StageNode";
export type { StageNodeData } from "./components/StageNode";

export { TimeTravelDebugger } from "./components/TimeTravelDebugger";
export type { TimeTravelDebuggerProps } from "./components/TimeTravelDebugger";

export { specToReactFlow } from "./components/FlowchartView/specToReactFlow";
export type {
  ExecutionOverlay,
  FlowchartColors,
} from "./components/FlowchartView/specToReactFlow";
