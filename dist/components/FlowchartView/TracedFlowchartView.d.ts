import type { StageSnapshot, BaseComponentProps } from "../../types";
import type { SpecNode } from "./specToReactFlow";
export interface TracedFlowchartViewProps extends BaseComponentProps {
    /** Pipeline spec from builder.toSpec() */
    spec: SpecNode;
    /** Visualization snapshots (enables trace overlay when provided) */
    snapshots?: StageSnapshot[];
    /** Current time-travel position */
    snapshotIndex?: number;
    /** Callback when a node is clicked (receives snapshot index, or node id if no snapshots) */
    onNodeClick?: (indexOrId: number | string) => void;
    /** Callback when subflow navigation changes (true = entered subflow) */
    onSubflowChange?: (isInSubflow: boolean, subflowNodeName: string | null) => void;
    /** Show collapsible subflow tree sidebar (default: false) */
    showTree?: boolean;
    /** Width of the tree sidebar in pixels (default: 200) */
    treeWidth?: number;
}
export declare function TracedFlowchartView({ spec, snapshots, snapshotIndex, onNodeClick, onSubflowChange, showTree, treeWidth, unstyled, className, style, }: TracedFlowchartViewProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=TracedFlowchartView.d.ts.map