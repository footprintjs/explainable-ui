import { useEffect, useRef } from "react";
import { useNodesInitialized, useReactFlow } from "@xyflow/react";
import type { NodeFootprint } from "./dagreTraceLayout";

/**
 * MeasuredNodeSizes — the "measure, then lay out" probe (xyflow's recommended
 * pattern for layout libraries like dagre).
 *
 * Dagre needs each node's dimensions BEFORE it can place them, but the real
 * size of a content-sized card isn't known until React has rendered it. So:
 *
 *   1. First pass — the chart lays out with estimated sizes (the dagre
 *      default footprint) and renders. Nodes appear, slightly loose.
 *   2. `useNodesInitialized()` flips true once xyflow has MEASURED every node.
 *   3. This probe reads each node's real `measured.{width,height}` and calls
 *      `onSizes(map)`. Feed that map into the dagre `nodeSize` resolver and the
 *      layout re-runs with content-EXACT sizes — no fixed-width-column gaps,
 *      tighter and aligned, for any node content (long label, icon, badge,
 *      a brand-new node type) with zero spacing constants to tune.
 *
 * Render this as a child of `<ReactFlow>` (the hooks need its context).
 * It renders nothing. It reports once per measurement settle; because a
 * re-layout only changes POSITIONS (not sizes), it does not loop.
 */
export interface MeasuredNodeSizesProps {
  /** Called with `id -> {width,height}` once all nodes are measured. */
  readonly onSizes: (sizes: Map<string, NodeFootprint>) => void;
  /** Include hidden nodes in the readiness check (default false). */
  readonly includeHiddenNodes?: boolean;
}

export function MeasuredNodeSizes({
  onSizes,
  includeHiddenNodes = false,
}: MeasuredNodeSizesProps): null {
  const initialized = useNodesInitialized({ includeHiddenNodes });
  const { getNodes } = useReactFlow();
  // Re-report only when the measured FOOTPRINTS actually change (not on every
  // position-only re-layout) — keyed by a stable signature of id+w+h.
  const lastSignature = useRef<string>("");

  useEffect(() => {
    if (!initialized) return;
    const sizes = new Map<string, NodeFootprint>();
    for (const node of getNodes()) {
      const width = node.measured?.width;
      const height = node.measured?.height;
      if (typeof width === "number" && typeof height === "number" && width > 0 && height > 0) {
        sizes.set(node.id, { width, height });
      }
    }
    if (sizes.size === 0) return;

    const signature = [...sizes.entries()]
      .map(([id, s]) => `${id}:${Math.round(s.width)}x${Math.round(s.height)}`)
      .sort()
      .join("|");
    if (signature === lastSignature.current) return; // sizes unchanged → no re-layout
    lastSignature.current = signature;
    onSizes(sizes);
  }, [initialized, getNodes, onSizes]);

  return null;
}
