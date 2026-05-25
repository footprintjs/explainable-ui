/**
 * Graph traversal helpers — pure functions over a `NodeViewIndex`.
 *
 * Bi-directional structural walks (`walkForward` / `walkBackward`) plus
 * convenience wrappers (`backtraceStructural` / `forwardtraceStructural`).
 *
 * Cycle defense (panel L8 must-fix)
 * ──────────────────────────────────
 *   Every traversal carries a `visited: Set<StageId>` and caps recursion
 *   at `index.all.length` (the total node count). Defends against:
 *     - Future bugs where a malformed graph includes a non-loop cycle
 *     - Manual edge injection bypassing the structure-recorder fix
 *     - Duplicate edges that survive dedupe due to source/target
 *       collisions
 *   Loop back-edges (`data.kind === 'loop'`) already excluded at the
 *   structure-recorder layer (invariant I1), so they never enter
 *   `prevIds`/`nextIds` — no extra filtering here.
 *
 * BFS order
 * ─────────
 *   Walks return nodes in BFS order — root first, then immediate
 *   neighbors, then their neighbors. Matches breadcrumb-friendly
 *   "closest-first" display order.
 *
 * Always-arrays returns
 * ─────────────────────
 *   All helpers return `NodeView[]`. Empty array (NOT null/undefined)
 *   means "no path" or "node not found". Consumers `.map()` /
 *   `.length`-check without null-handling boilerplate.
 */

import type { NodeView, NodeViewIndex } from "./createNodeViewRecorder";
import type { StageId } from "./_internal/keys";

export interface WalkOptions {
  /** Hard cap on hops. Default: `index.all.length` (one full traversal). */
  maxDepth?: number;
  /** When true, only return nodes that have `visitedInRun === true`.
   *  Useful for "in THIS run, what fed me?" queries (runtime-aware walk). */
  onlyVisited?: boolean;
  /** When true, INCLUDE the start node in the returned array. Default:
   *  false (caller already has the start node; the walk returns its
   *  ancestors/descendants). */
  includeStart?: boolean;
}

/**
 * Walk forward (`nextIds`) from `startId`. BFS order. Cycle-safe.
 * Returns `[]` if `startId` is unknown.
 *
 * Convergence semantics: a node reachable via multiple paths appears
 * ONCE in the result (visited-set dedupes).
 */
export function walkForward(
  index: NodeViewIndex,
  startId: StageId,
  options: WalkOptions = {},
): NodeView[] {
  return bfsWalk(index, startId, (n) => n.nextIds, options);
}

/**
 * Walk backward (`prevIds`) from `startId`. BFS order. Cycle-safe.
 * Returns `[]` if `startId` is unknown.
 *
 * Convergence semantics: a fork-join's `walkBackward` returns BOTH
 * branch parents (and their ancestors), each once.
 */
export function walkBackward(
  index: NodeViewIndex,
  startId: StageId,
  options: WalkOptions = {},
): NodeView[] {
  return bfsWalk(index, startId, (n) => n.prevIds, options);
}

/**
 * Backtrace from `stageId` to a structural root (no prev) OR a split
 * point (multiple prevs). Returns the chain from `stageId` BACK to
 * the root, root-first. Includes `stageId` at the END.
 *
 * Defines "split" as `prevIds.length > 1 OR prevIds.length === 0`
 * (per L8 panel recommendation) — stops at convergence points AND at
 * the seed. Useful for breadcrumb display where "innermost serial
 * run" is the meaningful path.
 */
export function backtraceStructural(
  index: NodeViewIndex,
  stageId: StageId,
  options: Pick<WalkOptions, "maxDepth" | "onlyVisited"> = {},
): NodeView[] {
  const start = index.byStageId.get(stageId);
  if (!start) return [];
  const chain: NodeView[] = [start];
  const cap = options.maxDepth ?? index.all.length;
  const visited = new Set<StageId>([stageId]);
  let cur: NodeView | undefined = start;
  let hops = 0;
  while (cur && hops < cap) {
    if (cur.prevIds.length === 0 || cur.prevIds.length > 1) {
      // Reached seed (no prevs) or split (multi-prev convergence).
      break;
    }
    const nextId = cur.prevIds[0]!;
    if (visited.has(nextId)) break; // cycle guard
    visited.add(nextId);
    const next: NodeView | undefined = index.byStageId.get(nextId);
    if (!next) break;
    if (options.onlyVisited && !next.visitedInRun) break;
    chain.unshift(next);
    cur = next;
    hops++;
  }
  return chain;
}

/**
 * Forward-trace from `stageId` to a structural leaf (no next) OR a
 * fork point (multiple nexts). Returns the chain from `stageId`
 * FORWARD to the leaf/fork, with `stageId` at the START.
 */
export function forwardtraceStructural(
  index: NodeViewIndex,
  stageId: StageId,
  options: Pick<WalkOptions, "maxDepth" | "onlyVisited"> = {},
): NodeView[] {
  const start = index.byStageId.get(stageId);
  if (!start) return [];
  const chain: NodeView[] = [start];
  const cap = options.maxDepth ?? index.all.length;
  const visited = new Set<StageId>([stageId]);
  let cur: NodeView | undefined = start;
  let hops = 0;
  while (cur && hops < cap) {
    if (cur.nextIds.length === 0 || cur.nextIds.length > 1) break;
    const nextId = cur.nextIds[0]!;
    if (visited.has(nextId)) break;
    visited.add(nextId);
    const next: NodeView | undefined = index.byStageId.get(nextId);
    if (!next) break;
    if (options.onlyVisited && !next.visitedInRun) break;
    chain.push(next);
    cur = next;
    hops++;
  }
  return chain;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal
// ─────────────────────────────────────────────────────────────────────────────

function bfsWalk(
  index: NodeViewIndex,
  startId: StageId,
  neighborsOf: (n: NodeView) => StageId[],
  options: WalkOptions,
): NodeView[] {
  const start = index.byStageId.get(startId);
  if (!start) return [];
  const cap = options.maxDepth ?? index.all.length;
  const visited = new Set<StageId>();
  visited.add(startId);
  const out: NodeView[] = [];
  if (options.includeStart) out.push(start);
  // Queue holds [node, depthFromStart]. depthFromStart = 0 for the
  // start node; neighbors are depth 1; etc. We bail when depth > cap.
  //
  // L8.1 Panel 5 optimization: use a head-index pointer instead of
  // `queue.shift()`. shift() is O(n) (re-indexes the array on every
  // pop) → BFS over 50+ nodes degrades to O(n²). The head-index
  // pattern is O(1) per pop, O(n) total — standard interview answer.
  const queue: Array<[NodeView, number]> = [[start, 0]];
  let head = 0;
  while (head < queue.length) {
    const [node, depth] = queue[head++]!;
    if (depth >= cap) continue;
    for (const neighborId of neighborsOf(node)) {
      if (visited.has(neighborId)) continue;
      visited.add(neighborId);
      const neighbor = index.byStageId.get(neighborId);
      if (!neighbor) continue;
      if (options.onlyVisited && !neighbor.visitedInRun) continue;
      out.push(neighbor);
      queue.push([neighbor, depth + 1]);
    }
  }
  return out;
}
