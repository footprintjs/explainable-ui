/**
 * Series-parallel chain tree builders — pure functions over `TraceGraph`
 * (structural) + `CommitFlowIndex` (runtime).
 *
 * When to reach for this vs. flat commitLog
 * ─────────────────────────────────────────
 *   Use `commitLog` when you want chronological replay / slider scrubbing
 *   ("what happened in order"). Use the chain tree when you want to
 *   render parallel structure visually or answer "which branch ran?"
 *   questions — flat `commitLog[idx-1]` loses the fork shape.
 *
 *   Pairs with `<CommitInspector>` for git-log-style master/detail —
 *   `<CommitChainView>` picks, `<CommitInspector>` inspects.
 *   Complements the per-stage view from `createNodeViewRecorder`.
 *
 * Why a chain tree
 * ────────────────
 *   Footprintjs charts are **series-parallel DAGs by construction** —
 *   the builder primitives compose serially (`addFunction`) or in
 *   parallel (`addListOfFunction` / `addDeciderFunction`). Series-
 *   parallel DAGs are provably representable as expression trees,
 *   so we can decompose any footprintjs chart into a nested
 *   `(serial | parallel | leaf)` shape that renders cleanly as
 *   swim lanes.
 *
 * Two builders, one tree shape
 * ────────────────────────────
 *   - `structureAsChainTree(graph, options?)` — STRUCTURAL view.
 *     No commitLog. Decomposes the chart shape into S-P primitives.
 *     Renders the full chart (all branches of a decider, etc.) even
 *     before running.
 *
 *   - `buildCommitChainTree(graph, commitFlow, options?)` — RUNTIME
 *     view. Each leaf carries the commits[] that fired for that stage
 *     in this run. Loops produce a leaf with N commits. Branches that
 *     never executed in this run appear as empty `commits[]` leaves
 *     (consumer can filter).
 *
 * Algorithm scope (correctness contract)
 * ──────────────────────────────────────
 *   These builders are tuned for **series-parallel charts** — every
 *   fork in footprintjs's builder has a matching merge point. For
 *   non-S-P or malformed graphs the tree is still finite and stable
 *   (cycle defense guarantees termination), but the shape may not
 *   reflect a clean S-P decomposition.
 *
 *   - Forks with **no common descendant** drop the outer-walk tail at
 *     the fork node. Real footprintjs charts always re-merge.
 *   - Edges with `data.kind === undefined` are treated as `'next'`.
 *     Multiple linear-next edges from a single source follow only the
 *     first (deterministic by insertion order); a dev-mode warning
 *     fires when this is observed (`isDevMode()` from footprintjs).
 *
 * Cycle defense (L8 panel must-fix carried forward)
 * ─────────────────────────────────────────────────
 *   Every recursive walk carries a `visited: Set<StageId>` to defend
 *   against malformed graphs (manual edge injection, future builder
 *   bugs). Loop edges (`kind === 'loop'`) are excluded at the
 *   structure-recorder layer per invariant I1, so they never enter
 *   prev/next — no extra filtering needed here. Convergence detection
 *   uses BFS bounded by `graph.nodes.length`.
 *
 * @example
 * ```ts
 * const trace = createTraceStructureRecorder();
 * // ... build a fork chart ...
 *
 * const sChain = structureAsChainTree(trace.getGraph());
 * // → { kind: 'serial', items: [
 * //     { kind: 'leaf', stageId: 'LoadOrder' },
 * //     { kind: 'parallel', branches: [
 * //       { kind: 'leaf', stageId: 'CheckInventory' },
 * //       { kind: 'leaf', stageId: 'RunFraudCheck' },
 * //     ]},
 * //     { kind: 'leaf', stageId: 'FinalizeOrder' },
 * //   ]}
 *
 * const commitFlow = createCommitFlowRecorder({ structure: trace });
 * // ... run chart ...
 * const cChain = buildCommitChainTree(trace.getGraph(), commitFlow.getIndex());
 * // → same shape, but each leaf carries `commits: CommitView[]`
 * ```
 */

import type { TraceGraph } from "./traceStructureRecorder";
import type { CommitFlowIndex, CommitView } from "./createCommitFlowRecorder";
import type { StageId } from "./_internal/keys";
import { asStageId } from "./_internal/keys";
import { devWarn } from "./_internal/devWarn";

// ─────────────────────────────────────────────────────────────────────────────
// Output types
// ─────────────────────────────────────────────────────────────────────────────

/** Structural chain tree leaf (no commits). */
export interface StructureChainLeaf {
  readonly kind: "leaf";
  readonly stageId: StageId;
}

/** Structural chain tree node — recursive S-P composition over stage ids. */
export type StructureChain =
  | StructureChainLeaf
  | { readonly kind: "serial"; readonly items: readonly StructureChain[] }
  | { readonly kind: "parallel"; readonly branches: readonly StructureChain[] };

/** Commit chain tree leaf — carries all commits for the stage (loop-aware). */
export interface CommitChainLeaf {
  readonly kind: "leaf";
  readonly stageId: StageId;
  /** All commits that fired for this stage in this run, in commitIdx
   *  ascending order. Loop iteration N has commits[N]. Empty array
   *  when the stage never executed in this run.
   *
   *  **Ownership**: references are shared with
   *  `CommitFlowIndex.commits` (no deep copy). The same shallow-copy /
   *  nested-shared-value contract documented on `CommitView.updates`
   *  applies. Do not mutate. */
  readonly commits: readonly CommitView[];
}

/** Commit chain tree — recursive S-P composition with commit leaves. */
export type CommitChain =
  | CommitChainLeaf
  | { readonly kind: "serial"; readonly items: readonly CommitChain[] }
  | { readonly kind: "parallel"; readonly branches: readonly CommitChain[] };

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Per-stage indexes computed once per build call. */
interface GraphIndex {
  byStageId: Map<StageId, { branchChildren: StageId[]; linearNext: StageId[] }>;
  allNodeIds: StageId[];
}

function indexGraph(graph: TraceGraph): GraphIndex {
  const byStageId = new Map<
    StageId,
    { branchChildren: StageId[]; linearNext: StageId[] }
  >();
  const allNodeIds: StageId[] = [];

  for (const node of graph.nodes) {
    const stageId = asStageId(node.id);
    allNodeIds.push(stageId);
    // node.data already carries prevIds/nextIds (L8.0 enrichment), but
    // we split outgoing into branch vs linear based on edge kind below.
    byStageId.set(stageId, { branchChildren: [], linearNext: [] });
  }

  for (const edge of graph.edges) {
    const kind = edge.data?.kind;
    if (kind === "loop") continue;
    const sourceEntry = byStageId.get(asStageId(edge.source));
    if (!sourceEntry) continue;
    // Skip edges whose target is not in the node set (malformed graph
    // defense — walker would bail on entry === undefined anyway, but
    // pruning here keeps branchChildren/linearNext clean for the
    // ambiguity warning below).
    const target = asStageId(edge.target);
    if (!byStageId.has(target)) continue;
    if (kind === "fork-branch" || kind === "decision-branch") {
      sourceEntry.branchChildren.push(target);
    } else {
      // 'next' or any unspecified kind treated as linear.
      sourceEntry.linearNext.push(target);
    }
  }

  return { byStageId, allNodeIds };
}

/** Find the seed: first node with no incoming non-loop edge. Falls back
 *  to the first node in insertion order. */
function findSeed(graph: TraceGraph, fromStageId?: StageId): StageId | null {
  if (fromStageId) {
    const n = graph.nodes.find((n) => n.id === fromStageId);
    return n ? asStageId(n.id) : null;
  }
  const hasIncoming = new Set<string>();
  for (const e of graph.edges) {
    if (e.data?.kind !== "loop") hasIncoming.add(e.target);
  }
  const seed = graph.nodes.find((n) => !hasIncoming.has(n.id)) ?? graph.nodes[0];
  return seed ? asStageId(seed.id) : null;
}

/**
 * BFS forward from `startId`. Returns ordered visit list (BFS order)
 * + reachable set. Skips `loop`-kind edges per invariant I1.
 */
function bfsReachable(
  startId: StageId,
  index: GraphIndex,
): { order: StageId[]; reachable: Set<StageId> } {
  const reachable = new Set<StageId>([startId]);
  const order: StageId[] = [startId];
  const queue: StageId[] = [startId];
  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++]!;
    const entry = index.byStageId.get(cur);
    if (!entry) continue;
    for (const next of [...entry.branchChildren, ...entry.linearNext]) {
      if (reachable.has(next)) continue;
      reachable.add(next);
      order.push(next);
      queue.push(next);
    }
  }
  return { order, reachable };
}

/**
 * Find the convergence point of a fork — the FIRST node (BFS order
 * from branch[0]) reachable from EVERY branch. Returns `null` if no
 * common descendant (branches diverge without re-merging — does not
 * happen in series-parallel footprintjs charts).
 *
 * For strict S-P charts, the first node in branch[0]'s BFS order that
 * sits in every reachable set IS the true convergence (dominator).
 * For non-S-P graphs this is a best-effort approximation.
 */
function findConvergence(
  branches: readonly StageId[],
  index: GraphIndex,
): StageId | null {
  if (branches.length < 2) return null;
  // Compute reachable + order for branch[0] once; reuse the same walk
  // for both ordering AND the first reachable set (panel 5 must-fix).
  const firstWalk = bfsReachable(branches[0]!, index);
  const reachableSets: Set<StageId>[] = [firstWalk.reachable];
  for (let i = 1; i < branches.length; i++) {
    reachableSets.push(bfsReachable(branches[i]!, index).reachable);
  }
  // Exclude the branch starting points themselves — they're not the
  // convergence of their own subtree.
  const startSet = new Set(branches);
  for (const candidate of firstWalk.order) {
    if (startSet.has(candidate)) continue;
    if (reachableSets.every((s) => s.has(candidate))) {
      return candidate;
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Recursive walker — produces a StructureChain
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Walk forward from `startId`, stopping at `untilId` (exclusive). Returns
 * the chain for the [startId, untilId) segment. `untilId === null` means
 * walk to the end (terminal nodes).
 *
 * Cycle defense: passes a `visited: Set<StageId>` through recursion. A
 * node already in `visited` is skipped (returns null), so the same
 * StageId appears at most once in the resulting tree.
 */
function walkChain(
  startId: StageId,
  untilId: StageId | null,
  index: GraphIndex,
  visited: Set<StageId>,
): StructureChain | null {
  const items: StructureChain[] = [];
  let cur: StageId | null = startId;
  while (cur !== null && cur !== untilId) {
    if (visited.has(cur)) break;
    visited.add(cur);
    const entry = index.byStageId.get(cur);
    if (!entry) break;

    const branches = entry.branchChildren;
    const linearNexts = entry.linearNext;

    // Always emit the current node as a leaf — its OWN position in the
    // chain. Parallel/serial wrappers follow if applicable.
    items.push({ kind: "leaf", stageId: cur });

    if (branches.length >= 2) {
      // Fork — find convergence + recurse into each branch.
      const convergence = findConvergence(branches, index);
      const branchChains: StructureChain[] = [];
      for (const b of branches) {
        // Each branch walks with a per-branch clone of `visited` for
        // traversal isolation. After the branch returns, its markers
        // are unioned into the outer scope so the post-convergence
        // walk doesn't re-emit nodes that any branch already covered.
        // This is correct dedup for S-P graphs (branches don't share
        // pre-convergence nodes) and is what keeps the recursion
        // bounded for malformed graphs (cycle defense).
        const branchVisited = new Set(visited);
        const sub = walkChain(b, convergence, index, branchVisited);
        if (sub !== null) branchChains.push(sub);
        for (const v of branchVisited) visited.add(v);
      }
      if (branchChains.length > 0) {
        items.push({ kind: "parallel", branches: branchChains });
      }
      cur = convergence;
    } else if (branches.length === 1 && linearNexts.length === 0) {
      // Single branch — treat as linear continuation.
      cur = branches[0]!;
    } else if (linearNexts.length >= 1) {
      // Linear continuation. Multiple linearNexts is ambiguous for S-P
      // decomposition; we follow the first (deterministic per-recorder
      // insertion order) and warn in dev mode so consumers building
      // unusual graph shapes are alerted.
      if (linearNexts.length > 1) {
        devWarn(
          () =>
            `[buildCommitChainTree] stage '${cur}' has ${linearNexts.length} linear-next edges; chain decomposition follows only the first ('${linearNexts[0]}'). Use 'fork-branch' or 'decision-branch' edge kinds to express parallel/conditional splits.`,
        );
      }
      cur = linearNexts[0]!;
    } else {
      // Terminal node.
      cur = null;
    }
  }

  if (items.length === 0) return null;
  if (items.length === 1) return items[0]!;
  return { kind: "serial", items };
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API: structureAsChainTree
// ─────────────────────────────────────────────────────────────────────────────

export interface ChainTreeOptions {
  /** Stage id to start the walk from. Defaults to the chart's seed
   *  (first node with no incoming non-loop edge). */
  rootStageId?: StageId;
}

/**
 * Build a structural chain tree for a chart. Pure function over
 * `TraceGraph` — no runtime data required. Useful for rendering the
 * chart shape before any execution (static documentation, etc.).
 */
export function structureAsChainTree(
  graph: TraceGraph,
  options: ChainTreeOptions = {},
): StructureChain | null {
  if (graph.nodes.length === 0) return null;
  const index = indexGraph(graph);
  const seed = findSeed(graph, options.rootStageId);
  if (!seed) return null;
  const visited = new Set<StageId>();
  return walkChain(seed, null, index, visited);
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API: buildCommitChainTree
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a commit-decorated chain tree. Same S-P shape as
 * `structureAsChainTree`, but each leaf carries the commits[] that
 * fired for that stage in this run (in commitIdx ascending order).
 *
 * Loop semantics: a stage that ran N times has a leaf with
 * `commits.length === N`. The consumer's renderer decides whether to
 * display them as a single "ran 3×" badge or unroll into N visible
 * boxes — both views are supported by the same data.
 *
 * Branches that never executed in this run appear with empty
 * `commits[]`. Consumers wanting "runtime-only" view can filter them
 * out.
 */
export function buildCommitChainTree(
  graph: TraceGraph,
  commitFlow: CommitFlowIndex,
  options: ChainTreeOptions = {},
): CommitChain | null {
  const structural = structureAsChainTree(graph, options);
  if (!structural) return null;
  // Index commits by stageId for O(1) leaf decoration.
  const commitsByStageId = new Map<StageId, CommitView[]>();
  for (const c of commitFlow.commits) {
    const list = commitsByStageId.get(c.stageId) ?? [];
    list.push(c);
    commitsByStageId.set(c.stageId, list);
  }
  return decorate(structural, commitsByStageId);
}

function decorate(
  node: StructureChain,
  commitsByStageId: ReadonlyMap<StageId, readonly CommitView[]>,
): CommitChain {
  if (node.kind === "leaf") {
    return {
      kind: "leaf",
      stageId: node.stageId,
      commits: commitsByStageId.get(node.stageId) ?? [],
    };
  }
  if (node.kind === "serial") {
    return {
      kind: "serial",
      items: node.items.map((n) => decorate(n, commitsByStageId)),
    };
  }
  return {
    kind: "parallel",
    branches: node.branches.map((b) => decorate(b, commitsByStageId)),
  };
}
