import { useState, useCallback, useMemo } from "react";
import { specToReactFlow } from "./specToReactFlow";
import type { SpecNode, ExecutionOverlay, FlowchartColors } from "./specToReactFlow";
import type { Node, Edge } from "@xyflow/react";

export interface BreadcrumbEntry {
  /** Display name for this level */
  label: string;
  /** The spec node tree at this level */
  spec: SpecNode;
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
}

/**
 * Hook that manages subflow drill-down navigation for a flowchart spec.
 *
 * Maintains a breadcrumb stack. When a subflow node is clicked, pushes its
 * nested spec onto the stack and re-derives nodes/edges. Breadcrumb clicks
 * pop back to that level.
 */
export function useSubflowNavigation(
  rootSpec: SpecNode | null,
  overlay?: ExecutionOverlay,
  colors?: Partial<FlowchartColors>
): SubflowNavigation {
  const [stack, setStack] = useState<BreadcrumbEntry[]>([]);

  // Current spec = top of stack, or root
  const currentSpec = stack.length > 0 ? stack[stack.length - 1].spec : rootSpec;

  // Derive nodes/edges from current spec
  const { nodes, edges } = useMemo(() => {
    if (!currentSpec) return { nodes: [], edges: [] };
    // Only apply overlay at root level (subflows don't have their own overlay yet)
    const effectiveOverlay = stack.length === 0 ? overlay : undefined;
    return specToReactFlow(currentSpec, effectiveOverlay, colors);
  }, [currentSpec, stack.length, overlay, colors]);

  // Build a lookup of subflow nodes at the current level
  const subflowMap = useMemo(() => {
    const map = new Map<string, SpecNode>();
    if (!currentSpec) return map;

    function collectSubflows(node: SpecNode) {
      if (node.isSubflowRoot && node.subflowStructure) {
        const id = node.name || node.id || "";
        map.set(id, node);
      }
      if (node.children) node.children.forEach(collectSubflows);
      if (node.next) collectSubflows(node.next);
    }
    collectSubflows(currentSpec);
    return map;
  }, [currentSpec]);

  const breadcrumbs: BreadcrumbEntry[] = useMemo(() => {
    const root: BreadcrumbEntry = {
      label: rootSpec?.name || "Pipeline",
      spec: rootSpec!,
    };
    return [root, ...stack];
  }, [rootSpec, stack]);

  const handleNodeClick = useCallback(
    (nodeId: string): boolean => {
      const subflowNode = subflowMap.get(nodeId);
      if (!subflowNode?.subflowStructure) return false;

      setStack((prev) => [
        ...prev,
        {
          label: subflowNode.subflowName || subflowNode.name,
          spec: subflowNode.subflowStructure!,
        },
      ]);
      return true;
    },
    [subflowMap]
  );

  const navigateTo = useCallback(
    (level: number) => {
      if (level === 0) {
        setStack([]);
      } else {
        setStack((prev) => prev.slice(0, level));
      }
    },
    []
  );

  return {
    breadcrumbs,
    nodes,
    edges,
    handleNodeClick,
    navigateTo,
    isInSubflow: stack.length > 0,
  };
}
