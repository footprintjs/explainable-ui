/**
 * Converts a SerializedPipelineStructure (from builder.toSpec()) into
 * ReactFlow nodes and edges with auto-layout.
 *
 * Supports two modes:
 * 1. Build-time only (no executionState) — all nodes gray
 * 2. With execution overlay — executed nodes colored, active node highlighted,
 *    unvisited nodes stay gray
 */
import type { Node, Edge } from "@xyflow/react";
export interface SpecNode {
    name: string;
    id?: string;
    type?: "stage" | "decider" | "fork" | "streaming";
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
}
export interface ExecutionOverlay {
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
export interface FlowchartColors {
    edgeDefault: string;
    edgeExecuted: string;
    edgeActive: string;
    edgeLoop: string;
    labelDefault: string;
    labelExecuted: string;
    labelLoop: string;
    pathGlow: string;
}
/**
 * Convert a pipeline spec to ReactFlow graph.
 * Pass `overlay` to color nodes/edges by execution state.
 */
export declare function specToReactFlow(spec: SpecNode, overlay?: ExecutionOverlay, colors?: Partial<FlowchartColors>): {
    nodes: Node[];
    edges: Edge[];
};
//# sourceMappingURL=specToReactFlow.d.ts.map