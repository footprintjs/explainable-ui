import { useEffect, useRef } from "react";
import { useNodesInitialized, useStore } from "@xyflow/react";
import type { NodeFootprint } from "./dagreTraceLayout";
import { extractMeasuredFootprints } from "./measuredFootprints";

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
 *   3. This probe reads each node's real measured `{width,height}` and calls
 *      `onSizes(map)`. Feed that map into the dagre `nodeSize` resolver and the
 *      layout re-runs with content-EXACT sizes — no fixed-width-column gaps,
 *      tighter and aligned, for any node content (long label, icon, badge,
 *      a brand-new node type) with zero spacing constants to tune.
 *
 * WHERE THE SIZES LIVE (xyflow v12): the measured footprint is on the INTERNAL
 * node in the store's `nodeLookup`, NOT on the user-facing nodes returned by
 * `getNodes()` (those carry `measured: {0,0}` until you read the internal copy).
 * So we read straight from `nodeLookup` — the same source `SmartStepEdge` /
 * `LoopBackEdge` use for live geometry. (Reading `getNodes()` here was a silent
 * no-op: every footprint came back 0×0, `setMeasuredSizes` was never called,
 * and the layout was stuck on estimated sizes forever.)
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
  // Subscribe to the store's nodeLookup — the canonical home of measured sizes
  // in v12. Its reference changes as measurements settle, so the effect re-runs
  // and the signature guard below dedupes (no relayout loop).
  const nodeLookup = useStore((s) => s.nodeLookup);
  // Re-report only when the measured FOOTPRINTS actually change (not on every
  // position-only re-layout) — keyed by a stable signature of id+w+h.
  const lastSignature = useRef<string>("");

  useEffect(() => {
    if (!initialized) return;
    const sizes = extractMeasuredFootprints(nodeLookup);
    if (sizes.size === 0) return;

    const signature = [...sizes.entries()]
      .map(([id, s]) => `${id}:${Math.round(s.width)}x${Math.round(s.height)}`)
      .sort()
      .join("|");
    if (signature === lastSignature.current) return; // sizes unchanged → no re-layout
    lastSignature.current = signature;
    onSizes(sizes);
  }, [initialized, nodeLookup, onSizes]);

  return null;
}
