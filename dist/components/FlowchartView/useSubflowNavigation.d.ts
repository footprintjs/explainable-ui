import type { SpecNode, ExecutionOverlay, FlowchartColors } from "./specToReactFlow";
import type { Node, Edge } from "@xyflow/react";
export interface BreadcrumbEntry {
    /** Display name for this level */
    label: string;
    /** The spec node tree at this level */
    spec: SpecNode;
    /** Human-readable description of this subflow */
    description?: string;
}
export interface SubflowNavigation {
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
export declare function useSubflowNavigation(rootSpec: SpecNode | null, overlay?: ExecutionOverlay, colors?: Partial<FlowchartColors>): SubflowNavigation;
//# sourceMappingURL=useSubflowNavigation.d.ts.map