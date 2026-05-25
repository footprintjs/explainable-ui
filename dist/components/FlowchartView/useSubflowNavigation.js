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
import { useState, useCallback, useMemo } from "react";
const EMPTY_GRAPH = { nodes: [], edges: [] };
/**
 * Hook that tracks subflow drill-down state for a recorder-driven chart.
 *
 * Maintains a breadcrumb stack. When a subflow node is clicked the
 * stack pushes a new entry; breadcrumb clicks pop back to that level.
 * See file-level docs for the deferred per-subflow graph swap.
 */
export function useSubflowNavigation(rootGraph) {
    const [stack, setStack] = useState([]);
    const safeRootGraph = rootGraph ?? EMPTY_GRAPH;
    // Lookup: subflow id → mount node display name. Populated from the
    // recorder graph so click handlers can resolve the node-id the
    // consumer passes.
    const subflowMounts = useMemo(() => {
        const map = new Map();
        for (const node of safeRootGraph.nodes) {
            if (!node.data?.isSubflow)
                continue;
            const subflowId = typeof node.data.subflowId === "string" ? node.data.subflowId : node.id;
            const label = typeof node.data.label === "string" ? node.data.label : node.id;
            const entry = {
                subflowId,
                label,
            };
            if (typeof node.data.description === "string") {
                entry.description = node.data.description;
            }
            // Key by stable id AND by the node id callers usually pass.
            map.set(node.id, entry);
            map.set(subflowId, entry);
        }
        return map;
    }, [safeRootGraph]);
    const breadcrumbs = useMemo(() => {
        const rootLabel = "Flowchart";
        const root = { label: rootLabel };
        return [root, ...stack];
    }, [stack]);
    const handleNodeClick = useCallback((nodeId) => {
        const mount = subflowMounts.get(nodeId);
        if (!mount)
            return false;
        setStack((prev) => {
            const entry = {
                label: mount.label,
                subflowId: mount.subflowId,
            };
            if (mount.description !== undefined)
                entry.description = mount.description;
            return [...prev, entry];
        });
        return true;
    }, [subflowMounts]);
    const navigateTo = useCallback((level) => {
        if (level === 0) {
            setStack([]);
        }
        else {
            setStack((prev) => prev.slice(0, level));
        }
    }, []);
    const top = stack[stack.length - 1];
    return {
        breadcrumbs,
        // TODO(recorder-driven-nesting): swap to per-subflow graph when
        // child charts attach their own recorders.
        currentGraph: safeRootGraph,
        currentSubflowId: top?.subflowId ?? null,
        currentSubflowNodeName: top?.label ?? null,
        handleNodeClick,
        navigateTo,
        isInSubflow: stack.length > 0,
    };
}
//# sourceMappingURL=useSubflowNavigation.js.map