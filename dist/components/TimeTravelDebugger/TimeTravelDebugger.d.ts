import type { Node, Edge } from "@xyflow/react";
import type { StageSnapshot, BaseComponentProps } from "../../types";
export interface TimeTravelDebuggerProps extends BaseComponentProps {
    /** Stage snapshots */
    snapshots: StageSnapshot[];
    /** ReactFlow nodes (required for flowchart) */
    nodes: Node[];
    /** ReactFlow edges (required for flowchart) */
    edges: Edge[];
    /** Show Gantt timeline */
    showGantt?: boolean;
    /** Layout direction */
    layout?: "horizontal" | "vertical";
    /** Title */
    title?: string;
}
/**
 * Full time-travel debugger: scrubber + flowchart + memory + narrative + gantt.
 * This is the "batteries included" component for pipeline debugging.
 */
export declare function TimeTravelDebugger({ snapshots, nodes, edges, showGantt, layout, title, size, unstyled, className, style, }: TimeTravelDebuggerProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=TimeTravelDebugger.d.ts.map