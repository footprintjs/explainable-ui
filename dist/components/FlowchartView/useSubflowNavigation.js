import { useState, useCallback, useMemo } from "react";
import { specToReactFlow } from "./specToReactFlow";
/**
 * Hook that manages subflow drill-down navigation for a flowchart spec.
 *
 * Maintains a breadcrumb stack. When a subflow node is clicked, pushes its
 * nested spec onto the stack and re-derives nodes/edges. Breadcrumb clicks
 * pop back to that level.
 */
export function useSubflowNavigation(rootSpec, overlay, colors) {
    const [stack, setStack] = useState([]);
    // Current spec = top of stack, or root
    const currentSpec = stack.length > 0 ? stack[stack.length - 1].spec : rootSpec;
    // Derive nodes/edges from current spec
    // Overlay is always passed through — consumer provides the appropriate overlay
    // (root overlay at root level, subflow overlay when drilled in)
    const { nodes, edges } = useMemo(() => {
        if (!currentSpec)
            return { nodes: [], edges: [] };
        return specToReactFlow(currentSpec, overlay, colors);
    }, [currentSpec, overlay, colors]);
    // Build a lookup of subflow nodes at the current level
    const subflowMap = useMemo(() => {
        const map = new Map();
        if (!currentSpec)
            return map;
        function collectSubflows(node) {
            if (node.isSubflowRoot && node.subflowStructure) {
                const id = node.name || node.id || "";
                map.set(id, node);
            }
            if (node.children)
                node.children.forEach(collectSubflows);
            if (node.next)
                collectSubflows(node.next);
        }
        collectSubflows(currentSpec);
        return map;
    }, [currentSpec]);
    const breadcrumbs = useMemo(() => {
        const root = {
            label: rootSpec?.name || "Pipeline",
            spec: rootSpec,
            description: rootSpec?.description,
        };
        return [root, ...stack];
    }, [rootSpec, stack]);
    const handleNodeClick = useCallback((nodeId) => {
        const subflowNode = subflowMap.get(nodeId);
        if (!subflowNode?.subflowStructure)
            return false;
        setStack((prev) => [
            ...prev,
            {
                label: subflowNode.subflowName || subflowNode.name,
                spec: subflowNode.subflowStructure,
                description: subflowNode.description,
            },
        ]);
        return true;
    }, [subflowMap]);
    const navigateTo = useCallback((level) => {
        if (level === 0) {
            setStack([]);
        }
        else {
            setStack((prev) => prev.slice(0, level));
        }
    }, []);
    return {
        breadcrumbs,
        nodes,
        edges,
        handleNodeClick,
        navigateTo,
        isInSubflow: stack.length > 0,
        currentSubflowNodeName: stack.length > 0 ? stack[stack.length - 1].label : null,
    };
}
//# sourceMappingURL=useSubflowNavigation.js.map