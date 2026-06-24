import { useEffect } from "react";
import { useNodesInitialized, useStore } from "@xyflow/react";
import type { ReactFlowState } from "@xyflow/react";
import { extractMeasuredFootprints, sameFootprints } from "./measuredFootprints";

/**
 * MeasuredNodeSizes — the "measure, then lay out" probe (xyflow's recommended
 * pattern for layout libraries like dagre).
 *
 * Dagre needs each node's dimensions BEFORE it can place them, but the real
 * size of a content-sized card isn't known until React has rendered it. So:
 *
 *   1. First pass — the chart lays out with estimated sizes (the dagre
 *      default footprint) and renders. Nodes appear, slightly loose.
 *   2. xyflow MEASURES every node; their footprints land on the internal nodes.
 *   3. This probe reads each node's real measured `{width,height}` and calls
 *      `onSizes(map)`. Feed that map into the dagre `nodeSize` resolver and the
 *      layout re-runs with content-EXACT sizes — no fixed-width-column gaps,
 *      tighter and aligned, for any node content (long label, icon, badge,
 *      a brand-new node type) with zero spacing constants to tune.
 *
 * WHERE THE SIZES LIVE, AND HOW WE SUBSCRIBE (xyflow v12):
 * The measured footprint is on the INTERNAL node in the store's `nodeLookup`,
 * NOT on the user nodes from `getNodes()` (those read `measured: {0,0}`). And
 * `nodeLookup` is a single Map xyflow mutates IN PLACE — its reference never
 * changes — so `useStore(s => s.nodeLookup)` would be Object.is-equal forever
 * and the effect would fire only once, on the initial `nodesInitialized` flip,
 * never on a later resize (async font/icon load, dynamic label). Instead we
 * select the DERIVED footprint map and dedupe with `sameFootprints`: the
 * selected value is stable across ticks that change no footprint, and changes
 * exactly when some node re-measures — so the relayout re-runs when, and only
 * when, the sizes actually move. (Reading `getNodes()` here was a silent no-op:
 * every footprint came back 0×0, `onSizes` was never called, and the layout was
 * stuck on estimated sizes forever.)
 *
 * Render this as a child of `<ReactFlow>` (the hooks need its context).
 * It renders nothing.
 */
export interface MeasuredNodeSizesProps {
  /** Called with `id -> {width,height}` once all nodes are measured (and again
   *  whenever a footprint changes). */
  readonly onSizes: (sizes: Map<string, import("./dagreTraceLayout").NodeFootprint>) => void;
  /** Include hidden nodes in the readiness check (default false). */
  readonly includeHiddenNodes?: boolean;
}

export function MeasuredNodeSizes({
  onSizes,
  includeHiddenNodes = false,
}: MeasuredNodeSizesProps): null {
  const initialized = useNodesInitialized({ includeHiddenNodes });
  // Subscribe to the DERIVED, deduped footprint map (see header for why not the
  // raw nodeLookup). `sameFootprints` keeps the reference stable until a real
  // re-measure, so the effect below re-runs precisely on size changes.
  const sizes = useStore(
    (s: ReactFlowState) => extractMeasuredFootprints(s.nodeLookup),
    sameFootprints,
  );

  useEffect(() => {
    // Gate on `initialized` so we never relayout from a half-measured first
    // paint (some nodes 0×0): wait until every node has a real footprint, then
    // (and on every subsequent footprint change) feed content-exact sizes in.
    if (!initialized || sizes.size === 0) return;
    onSizes(sizes);
  }, [initialized, sizes, onSizes]);

  return null;
}
