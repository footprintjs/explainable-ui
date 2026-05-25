import type { TraceGraph } from "./traceStructureRecorder";
import type { BaseComponentProps } from "../../types";
export interface SubflowTreeEntry {
    /** Node name / identifier */
    name: string;
    /** Human-readable description */
    description?: string;
    /** Subflow ID (when this node represents a subflow) */
    subflowId?: string;
    /** Whether this node is a subflow root (has nested structure) */
    isSubflow?: boolean;
    /** Nested children (subflow stages) — always undefined in the
     *  current recorder-driven implementation; see file-level TODO. */
    children?: SubflowTreeEntry[];
}
export interface SubflowTreeProps extends BaseComponentProps {
    /** Recorder-captured graph from `createTraceStructureRecorder().getGraph()`. */
    graph: TraceGraph;
    /** Currently active stage name (highlights in tree) */
    activeStage?: string | null;
    /** Set of completed stage names */
    doneStages?: Set<string>;
    /** Called when a tree node is clicked */
    onNodeSelect?: (name: string, isSubflow: boolean) => void;
}
/** Extracts subflow entries from a recorder graph. Insertion-order preserving. */
export declare function graphToSubflowEntries(graph: TraceGraph): SubflowTreeEntry[];
export declare const SubflowTree: import("react").NamedExoticComponent<SubflowTreeProps>;
//# sourceMappingURL=SubflowTree.d.ts.map