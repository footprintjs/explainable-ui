import type { StageSnapshot, BaseComponentProps } from "../../types";
import type { TraceGraph } from "../FlowchartView/traceStructureRecorder";
import type { RuntimeOverlay } from "../FlowchartView/createTraceRuntimeOverlay";
export interface TimeTravelDebuggerProps extends BaseComponentProps {
    /** Stage snapshots */
    snapshots: StageSnapshot[];
    /** Recorder-captured build-time graph (from
     *  `createTraceStructureRecorder().getGraph()`). Required for the
     *  chart rendering — replaces the legacy `nodes` / `edges` props. */
    graph: TraceGraph;
    /** Optional runtime overlay (from
     *  `createTraceRuntimeOverlay().getOverlay()`). When provided, the
     *  chart renders via `<TracedFlow>` with per-step coloring synced to
     *  the scrubber; otherwise renders via `<TraceFlow>` (build-time only). */
    runtimeOverlay?: RuntimeOverlay;
    /** Show Gantt timeline */
    showGantt?: boolean;
    /** Layout direction */
    layout?: "horizontal" | "vertical";
    /** Title */
    title?: string;
}
/**
 * Full time-travel debugger: scrubber + recorder-driven flowchart +
 * memory + narrative + gantt. This is the "batteries included"
 * component for pipeline debugging.
 *
 * v6+: chart rendering is recorder-driven. Pass `graph` (always) and
 * optionally `runtimeOverlay` for per-step coloring tied to the
 * scrubber.
 */
export declare function TimeTravelDebugger({ snapshots, graph, runtimeOverlay, showGantt, layout, title, size, unstyled, className, style, }: TimeTravelDebuggerProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=TimeTravelDebugger.d.ts.map