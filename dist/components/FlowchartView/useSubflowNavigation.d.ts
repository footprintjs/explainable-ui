/**
 * useSubflowNavigation — drill-down breadcrumb tracker for recorder-driven charts.
 *
 * Recorder-driven (v6+): replaces the legacy SpecNode-walk path. Accepts
 * a `TraceGraph` (from `createTraceStructureRecorder`) and tracks WHICH
 * subflow the user has drilled into.
 *
 * Limitation (intentional — recorder graph is flat / mount-only):
 *   The StructureRecorder records the MOUNT of each subflow in the
 *   parent chart, not the inner structure of each child chart. So
 *   "drill into a subflow" today returns the SAME graph with the
 *   `currentSubflowId` marker advanced — there is no separate
 *   child-graph to swap in. Filtering nodes by
 *   `data.subflowId === <selected>` would only surface mount nodes,
 *   not the child chart's stages.
 *
 * TODO(recorder-driven-nesting): when child charts attach their own
 * `traceStructureRecorder` and surface those graphs via a registry,
 * accept `Map<subflowId, TraceGraph>` and swap `currentGraph` to the
 * child's graph on drill-down. Consumers can then render
 * `<TraceFlow graph={currentGraph} />` per level.
 */
import type { TraceGraph } from "./traceStructureRecorder";
export interface BreadcrumbEntry {
    /** Display name for this level */
    label: string;
    /** The subflow id that was drilled into to reach this level
     *  (undefined for root). */
    subflowId?: string;
    /** Human-readable description of this subflow */
    description?: string;
}
export interface SubflowNavigation {
    /** Current breadcrumb path (root → ... → current) */
    breadcrumbs: BreadcrumbEntry[];
    /** Current graph — today identical to the root graph (see file-level
     *  TODO). Consumers should still treat this as the source of truth so
     *  they remain forward-compatible once per-subflow graphs are wired in. */
    currentGraph: TraceGraph;
    /** Subflow id of the level the user is currently inside (null at root). */
    currentSubflowId: string | null;
    /** Display name of the subflow node we drilled into (null at root). */
    currentSubflowNodeName: string | null;
    /** Call when a node is clicked — drills in if it's a subflow.
     *  Returns true when the click pushed a new level. */
    handleNodeClick: (nodeId: string) => boolean;
    /** Navigate to a specific breadcrumb level (0 = root) */
    navigateTo: (level: number) => void;
    /** Whether we're currently inside a subflow (not at root) */
    isInSubflow: boolean;
}
/**
 * Hook that tracks subflow drill-down state for a recorder-driven chart.
 *
 * Maintains a breadcrumb stack. When a subflow node is clicked the
 * stack pushes a new entry; breadcrumb clicks pop back to that level.
 * See file-level docs for the deferred per-subflow graph swap.
 */
export declare function useSubflowNavigation(rootGraph: TraceGraph | null): SubflowNavigation;
//# sourceMappingURL=useSubflowNavigation.d.ts.map