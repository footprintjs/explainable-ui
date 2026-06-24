/**
 * centerForkParents — pure post-dagre pass that centers a FORK/DECISION parent
 * over the geometric span of its direct children.
 *
 * THE PROBLEM IT FIXES
 * --------------------
 * dagre's Brandes–Köpf `balance()` places a node at a balanced BARYCENTER, not
 * the geometric MIDPOINT of its children's span. On asymmetric or even-count
 * fans (e.g. a parent feeding 4 slots of differing widths) the parent sits
 * off-center, so the fan tilts and reads as a staggered bus rather than a clean,
 * symmetric fork. (Centering the parent is the layout half of the fix; a shared
 * fan bend-row is the edge half — see stepRouting.)
 *
 * THE FIX
 * -------
 * A pure `(graph) => graph` pass applied AFTER `dagreTraceLayout` (+ the snap
 * pass). It centers BOTH ends of a diamond on the same axis:
 *   - a FORK  (out-degree >= 2, in-degree <= 1) is centered over its CHILDREN;
 *   - a MERGE (in-degree >= 2, out-degree <= 1) is centered under its PARENTS.
 * Each lands on the midpoint of the min/max center-x of its kin in the SAME
 * compound, so a fork and the merge that re-joins its branches sit on one
 * vertical axis (a symmetric diamond) even when the branches have unequal
 * widths (where dagre's placement of the merge otherwise drifts off-center).
 * `position.x` is recomputed from the node's OWN width; `y` is never touched.
 *
 * WHAT IT NEVER MOVES
 * -------------------
 *   - linear nodes (out-degree < 2 AND in-degree < 2) — neither fork nor merge
 *   - FORK-MERGE nodes (in-degree >= 2 AND out-degree >= 2) — ambiguous: moving
 *     them would distort one side, so they're left at dagre's barycenter
 *   - kin in a different compound                      — cross-box hop, skipped
 * Processed RANK-DESCENDING (y desc) so a nested fork/merge centers over its own
 * (already-centered) kin before its ancestors are processed.
 *
 * PROPERTIES — mirror snapLinearSuccessors: PURE (new nodes array, edges by
 * reference), IDEMPOTENT (re-running finds centers equal → zero-delta), and
 * GEOMETRY-EXACT (widths via the SAME `sizeOf` resolver→style→default order
 * dagre used — the identical-resolver invariant; group containers resolve to
 * their stamped style footprint, never the resolver).
 */

import type { Edge } from "@xyflow/react";
import type { TraceGraph, TraceNode, TraceEdgeData } from "../traceStructureRecorder";
import type { TraceFlowLayout } from "../TraceFlow";
import {
  DEFAULT_NODE_H,
  DEFAULT_NODE_W,
  sizeOf,
  type NodeSizeResolver,
} from "./dagreTraceLayout";

export interface CenterForkParentsOptions {
  /** Per-node size resolver — the SAME one passed to dagre. */
  readonly nodeSize?: NodeSizeResolver;
  /** Fallback width (match the dagre run's `nodeWidth`). Default 200. */
  readonly nodeWidth?: number;
  /** Fallback height (match the dagre run's `nodeHeight`). Default 80. */
  readonly nodeHeight?: number;
  /** Horizontal clearance to preserve from a same-rank neighbor when
   *  re-centering (match the dagre run's `nodeSep`). Default 60. */
  readonly nodeSep?: number;
}

export function centerForkParents(
  graph: TraceGraph,
  options: CenterForkParentsOptions = {},
): TraceGraph {
  if (graph.nodes.length === 0) return graph;

  const fallbackW = options.nodeWidth ?? DEFAULT_NODE_W;
  const fallbackH = options.nodeHeight ?? DEFAULT_NODE_H;

  const byId = new Map<string, TraceNode>();
  const width = new Map<string, number>();
  for (const n of graph.nodes) {
    byId.set(n.id, n);
    width.set(n.id, sizeOf(n, fallbackW, fallbackH, options.nodeSize).width);
  }

  // Forward adjacency, EXCLUDING loop back-edges (matching dagre + snap), deduped.
  const childrenOf = new Map<string, string[]>();
  const predsOf = new Map<string, string[]>();
  const outDegree = new Map<string, number>();
  const inDegree = new Map<string, number>();
  const seen = new Set<string>();
  for (const e of graph.edges as Edge<TraceEdgeData>[]) {
    if (e.data?.kind === "loop") continue;
    if (!byId.has(e.source) || !byId.has(e.target)) continue;
    const key = `${e.source} ${e.target}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const cl = childrenOf.get(e.source);
    if (cl) cl.push(e.target);
    else childrenOf.set(e.source, [e.target]);
    const pl = predsOf.get(e.target);
    if (pl) pl.push(e.source);
    else predsOf.set(e.target, [e.source]);
    outDegree.set(e.source, (outDegree.get(e.source) ?? 0) + 1);
    inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1);
  }

  // Working x (clone — never mutate input). Reads propagate within one pass.
  const workingX = new Map<string, number>();
  for (const n of graph.nodes) workingX.set(n.id, n.position.x);
  const centerX = (id: string) => workingX.get(id)! + width.get(id)! / 2;

  const nodeSep = options.nodeSep ?? 60;
  // Clamp a desired top-left x for `id` so it can't reduce same-rank,
  // same-compound sibling clearance below the reserved nodeSep gap.
  const clampX = (id: string, desiredX: number): number => {
    const w = width.get(id)!;
    const x0 = workingX.get(id)!;
    const self = byId.get(id)!;
    let minX = -Infinity;
    let maxX = Infinity;
    for (const m of graph.nodes) {
      if (m.id === id || m.parentId !== self.parentId) continue;
      if (Math.abs(m.position.y - self.position.y) > 1) continue; // same rank only
      const mLeft = workingX.get(m.id)!;
      const mRight = mLeft + width.get(m.id)!;
      if (mRight <= x0) minX = Math.max(minX, mRight + nodeSep);
      else if (mLeft >= x0 + w) maxX = Math.min(maxX, mLeft - nodeSep - w);
    }
    return minX <= maxX ? Math.max(minX, Math.min(maxX, desiredX)) : x0;
  };

  // EVEN-FAN: redistribute a fork's children at EQUAL center-gaps, symmetric
  // around the fork's (already-centered) axis, so the comb reads evenly even when
  // the children differ in width (where dagre's edge-based packing yields uneven
  // CENTER gaps — the wider child claims more room on its side). The uniform gap
  // is the widest adjacent half+nodeSep+half requirement, so no pair overlaps;
  // symmetric placement keeps the span-midpoint at the fork axis, so a merge that
  // re-joins the same children (a diamond) stays centered. Pure-ish: only the
  // children's `workingX` change. Idempotent (re-running finds equal gaps).
  const evenFanKids = (forkCenter: number, kids: readonly string[]): void => {
    if (kids.length < 2) return;
    const sorted = [...kids].sort((a, b) => centerX(a) - centerX(b));
    let gap = 0;
    for (let i = 0; i < sorted.length - 1; i++) {
      gap = Math.max(gap, width.get(sorted[i])! / 2 + nodeSep + width.get(sorted[i + 1])! / 2);
    }
    const mid = (sorted.length - 1) / 2;
    for (let i = 0; i < sorted.length; i++) {
      workingX.set(sorted[i], forkCenter + (i - mid) * gap - width.get(sorted[i])! / 2);
    }
  };

  // Rank-DESCENDING (y desc) so nested forks/merges center before their ancestors.
  const order = [...graph.nodes].sort((a, b) =>
    b.position.y - a.position.y || a.position.x - b.position.x || a.id.localeCompare(b.id),
  );
  for (const n of order) {
    const outD = outDegree.get(n.id) ?? 0;
    const inD = inDegree.get(n.id) ?? 0;
    // A FORK (out>=2, not itself a merge) centers over its CHILDREN; a MERGE
    // (in>=2, not itself a fork) centers under its PARENTS. Both land on the
    // span-midpoint of their kin, so a fork and the merge that re-joins its
    // branches share one vertical axis. A FORK-MERGE (in>=2 AND out>=2) is
    // ambiguous → skipped (left at dagre's barycenter).
    const isFork = outD >= 2 && inD <= 1;
    const isMerge = inD >= 2 && outD <= 1;
    if (!isFork && !isMerge) continue;

    const kin = ((isFork ? childrenOf.get(n.id) : predsOf.get(n.id)) ?? []).filter(
      (k) => byId.get(k)?.parentId === n.parentId, // same compound only
    );
    if (kin.length < 2) continue;
    const centers = kin.map(centerX);
    const wN = width.get(n.id)!;
    const span = (Math.min(...centers) + Math.max(...centers)) / 2; // kin span center
    workingX.set(n.id, clampX(n.id, span - wN / 2));

    // Even out the fan so the comb is symmetric — but ONLY for a DIAMOND fork
    // (children that reconverge at a common merge, i.e. true parallel branches we
    // can freely re-space). For a DIVERGENT/terminal fork (a decision whose
    // branches go their separate ways, possibly owning their own subtrees)
    // re-spacing a child would drag its subtree off-center, so we leave it.
    if (isFork) {
      const succSets = kin.map((k) => childrenOf.get(k) ?? []);
      const isDiamond =
        kin.length >= 2 &&
        succSets[0].some((s) => succSets.every((ss) => ss.includes(s)));
      if (isDiamond) evenFanKids(centerX(n.id), kin);
    }

    // Propagate the new center along the LINEAR trunk leading AWAY from the kin —
    // UP the predecessor chain for a fork (keep the edge INTO the fork straight),
    // DOWN the successor chain for a merge (keep the edge OUT OF the merge
    // straight). Walk while the next node is a pure pass-through (single neighbour
    // in this direction, and itself neither a fork nor a merge) in the same
    // compound; cycle-guarded; each move clamped.
    // NOTE: clamp-LIMITED (best-effort) — a trunk node boxed by same-rank
    // neighbours closer than nodeSep on both sides stays put (never overlaps).
    const stepOf = isFork ? predsOf : childrenOf;
    let curId = n.id;
    const walked = new Set<string>([curId]);
    for (;;) {
      const nexts = stepOf.get(curId);
      if (!nexts || nexts.length !== 1) break; // not a single linear neighbour
      const m = nexts[0];
      if (walked.has(m)) break; // cycle guard (defensive — forward graph is a DAG)
      if ((outDegree.get(m) ?? 0) > 1) break; // neighbour forks elsewhere → stop
      if ((inDegree.get(m) ?? 0) > 1) break; // neighbour is a merge → stop (moving
      // it would jog its OTHER inbound/outbound edges)
      if (byId.get(m)?.parentId !== byId.get(curId)?.parentId) break; // cross-compound
      workingX.set(m, clampX(m, centerX(curId) - width.get(m)! / 2));
      walked.add(m);
      curId = m;
    }
  }

  // PHASE 2 — straighten the trunk through a DIVERGENT/terminal fork. Phase 1
  // centers every fork over its branches; for a DIAMOND that's correct, but a
  // divergent fork (a decision whose branches don't reconverge — e.g. a ReAct
  // `Route` → tool-call / final) then sits at its branches' span-midpoint, which
  // the upper diamond's spine may not share → the edge INTO the fork jogs. When
  // such a fork sits on a straight trunk (its single predecessor's ONLY child),
  // align it to that trunk axis and carry its branches by the same delta, so the
  // spine stays straight and the branches stay centered under it.
  for (const n of order) {
    const outD = outDegree.get(n.id) ?? 0;
    const inD = inDegree.get(n.id) ?? 0;
    if (!(outD >= 2 && inD <= 1)) continue; // forks only
    const kids = (childrenOf.get(n.id) ?? []).filter(
      (k) => byId.get(k)?.parentId === n.parentId,
    );
    if (kids.length < 2) continue;
    const succSets = kids.map((k) => childrenOf.get(k) ?? []);
    const isDiamond = succSets[0].some((s) => succSets.every((ss) => ss.includes(s)));
    if (isDiamond) continue; // a real diamond — leave centered over its branches
    const ps = predsOf.get(n.id);
    if (!ps || ps.length !== 1) continue; // no single trunk predecessor
    const pred = ps[0];
    if ((outDegree.get(pred) ?? 0) !== 1) continue; // pred forks elsewhere → not a straight trunk
    if (byId.get(pred)?.parentId !== byId.get(n.id)?.parentId) continue; // cross-compound
    const before = centerX(n.id);
    workingX.set(n.id, clampX(n.id, centerX(pred) - width.get(n.id)! / 2));
    const delta = centerX(n.id) - before;
    if (delta === 0) continue;
    for (const k of kids) workingX.set(k, clampX(k, workingX.get(k)! + delta)); // carry branches along
  }

  const nodes = graph.nodes.map((n) =>
    workingX.get(n.id) === n.position.x
      ? n
      : { ...n, position: { x: workingX.get(n.id)!, y: n.position.y } },
  );
  return { nodes, edges: graph.edges };
}

/** Compose a base layout (dagre, or snapped-dagre) then the fork-centering pass. */
export function withForkCentering(
  base: TraceFlowLayout,
  options: CenterForkParentsOptions = {},
): TraceFlowLayout {
  return (graph: TraceGraph) => centerForkParents(base(graph), options);
}
