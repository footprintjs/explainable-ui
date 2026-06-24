/**
 * measuredFootprints — pure core of the "measure, then lay out" probe.
 *
 * Given the entries of xyflow's `nodeLookup` store (`[id, internalNode]`),
 * collect each node's REAL measured footprint into an `id -> {width,height}`
 * map for the dagre `nodeSize` resolver.
 *
 * WHY THIS IS THE SOURCE (xyflow v12): the measured footprint lives on the
 * INTERNAL node in `nodeLookup` — NOT on the user nodes from `getNodes()`,
 * which report `measured: {0,0}` until you read the internal copy. The probe
 * used to read `getNodes()`, so every footprint came back 0×0, the sizes map
 * was always empty, and the layout silently stayed on estimated sizes forever
 * (cards laid out on a fallback column width → off-center forks/deciders). This
 * pure helper takes the lookup-shaped entries so the unit test pins the
 * contract: read the `.measured` field, and DROP unmeasured (0×0) nodes so a
 * half-measured first paint never feeds a degenerate size into the layout.
 *
 * Footprints are ROUNDED to whole pixels. The measured size is re-stamped onto
 * each node's `style.width` by the dagre pass, so the measure→stamp→re-measure
 * cycle must reach a fixed point; rounding kills sub-pixel jitter (border-box /
 * transform rounding) that would otherwise let the layout oscillate. Integer px
 * is plenty for spacing.
 *
 * Pure (no React/DOM) so it is unit-testable; `MeasuredNodeSizes` is the thin
 * hook adapter that subscribes to the store and calls this. Mirrors the
 * pure-core/thin-adapter split used by `stepRouting` / `loopRouting`.
 */
import type { NodeFootprint } from "./dagreTraceLayout";

/** The shape this helper needs from an xyflow internal node. */
export interface MeasuredLike {
  readonly measured?: { readonly width?: number; readonly height?: number };
}

/**
 * Collect `id -> {width,height}` from `nodeLookup`-shaped entries, keeping only
 * nodes with a real positive measured footprint (0×0 / missing → skipped).
 * Footprints are rounded to whole pixels (fixed-point stability — see header).
 */
export function extractMeasuredFootprints(
  entries: Iterable<readonly [string, MeasuredLike]>,
): Map<string, NodeFootprint> {
  const sizes = new Map<string, NodeFootprint>();
  for (const [id, node] of entries) {
    const width = node.measured?.width;
    const height = node.measured?.height;
    if (typeof width === "number" && typeof height === "number" && width > 0 && height > 0) {
      sizes.set(id, { width: Math.round(width), height: Math.round(height) });
    }
  }
  return sizes;
}

/**
 * Footprint-map equality — true iff both maps hold the same ids with the same
 * (rounded) footprints. Used as the xyflow `useStore` equality fn so the probe
 * subscribes to a value that is STABLE across store ticks that don't change any
 * footprint, yet changes when a node actually re-measures. (Selecting the
 * `nodeLookup` Map itself never works: xyflow mutates it IN PLACE — same
 * reference forever — so an Object.is subscription would only ever fire on the
 * one-time `nodesInitialized` flip, never on a later resize.)
 */
export function sameFootprints(
  a: Map<string, NodeFootprint>,
  b: Map<string, NodeFootprint>,
): boolean {
  if (a === b) return true;
  if (a.size !== b.size) return false;
  for (const [id, s] of a) {
    const t = b.get(id);
    if (!t || t.width !== s.width || t.height !== s.height) return false;
  }
  return true;
}
