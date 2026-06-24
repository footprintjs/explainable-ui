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
 * pass). A node with forward (non-loop) out-degree >= 2 that is NOT a merge
 * (in-degree <= 1) has its CENTER-x set to the midpoint of the min/max
 * center-x of its direct children in the SAME compound. `position.x` is
 * recomputed from the node's OWN width; `y` is never touched.
 *
 * WHAT IT NEVER MOVES
 * -------------------
 *   - linear nodes (out-degree < 2)        — not a fork
 *   - MERGE nodes (in-degree > 1)          — moving a join distorts its inbound
 *   - children in a different compound      — cross-box hop, skipped
 * Processed RANK-DESCENDING (y desc) so a nested fork centers over its own
 * (already-centered) children before its parent centers over it.
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
  const outDegree = new Map<string, number>();
  const inDegree = new Map<string, number>();
  const seen = new Set<string>();
  for (const e of graph.edges as Edge<TraceEdgeData>[]) {
    if (e.data?.kind === "loop") continue;
    if (!byId.has(e.source) || !byId.has(e.target)) continue;
    const key = `${e.source} ${e.target}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const list = childrenOf.get(e.source);
    if (list) list.push(e.target);
    else childrenOf.set(e.source, [e.target]);
    outDegree.set(e.source, (outDegree.get(e.source) ?? 0) + 1);
    inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1);
  }

  // Working x (clone — never mutate input). Reads propagate within one pass.
  const workingX = new Map<string, number>();
  for (const n of graph.nodes) workingX.set(n.id, n.position.x);
  const centerX = (id: string) => workingX.get(id)! + width.get(id)! / 2;

  const nodeSep = options.nodeSep ?? 60;
  // Rank-DESCENDING (y desc) so nested forks center before their ancestors.
  const order = [...graph.nodes].sort((a, b) =>
    b.position.y - a.position.y || a.position.x - b.position.x || a.id.localeCompare(b.id),
  );
  for (const n of order) {
    if ((outDegree.get(n.id) ?? 0) < 2) continue; // not a fork/decision
    if ((inDegree.get(n.id) ?? 0) > 1) continue; // a merge — leave it
    const kids = (childrenOf.get(n.id) ?? []).filter(
      (k) => byId.get(k)?.parentId === n.parentId, // same compound only
    );
    if (kids.length < 2) continue;
    const centers = kids.map(centerX);
    const wN = width.get(n.id)!;
    let desiredX = (Math.min(...centers) + Math.max(...centers)) / 2 - wN / 2; // span center

    // Clamp against same-rank, same-compound neighbors so re-centering can NEVER
    // reduce sibling clearance below the reserved nodeSep gap. (A no-op on real
    // dagre output — it already packs the parent inside its column — but keeps
    // the pass overlap-SAFE when composed over any non-dagre base.)
    const x0 = workingX.get(n.id)!;
    let minX = -Infinity;
    let maxX = Infinity;
    for (const m of graph.nodes) {
      if (m.id === n.id || m.parentId !== n.parentId) continue;
      if (Math.abs(m.position.y - n.position.y) > 1) continue; // same rank only
      const mLeft = workingX.get(m.id)!;
      const mRight = mLeft + width.get(m.id)!;
      if (mRight <= x0) minX = Math.max(minX, mRight + nodeSep); // neighbor to the left
      else if (mLeft >= x0 + wN) maxX = Math.min(maxX, mLeft - nodeSep - wN); // to the right
    }
    desiredX = minX <= maxX ? Math.max(minX, Math.min(maxX, desiredX)) : x0;

    workingX.set(n.id, desiredX);
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
