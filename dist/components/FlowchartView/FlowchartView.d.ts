import type { Node, Edge } from "@xyflow/react";
import type { StageSnapshot, BaseComponentProps } from "../../types";
export interface FlowchartViewProps extends BaseComponentProps {
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
export declare function FlowchartView({ nodes: rawNodes, edges: rawEdges, snapshots, selectedIndex, onNodeClick, unstyled, className, style, }: FlowchartViewProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=FlowchartView.d.ts.map