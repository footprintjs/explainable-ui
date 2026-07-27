/**
 * dataTrace — the REAL backward data slice behind the shell's "Data Trace"
 * tab, mirroring footprintjs' `causalChain` (thin backward slicing: BFS over
 * read→write dependencies) WITHOUT importing footprintjs — eui deliberately
 * consumes snapshot SHAPES, never the engine (its only dependency is dagre).
 *
 * WHY a mirror and not the import: eui renders snapshots from ANY footprintjs
 * version (and stored/offline traces); a runtime dependency would couple the
 * two release lines. The algorithm is small and the shapes are stable — the
 * commit log's `trace[].path` (writes) and the execution tree's `stageReads`
 * keys (reads) are all it needs. Parity note: this mirror expands each stage
 * through ALL its reads (fp's 'stage' attribution — the safe ceiling); fp's
 * per-write refinement ('per-write') stays engine-side.
 *
 * HISTORY (why this file exists): the previous inline implementation walked
 * the commit log LINEARLY backwards (`idx--`) and labeled each hop with the
 * commit's own first written path — chronology dressed as causality. On any
 * fan-in/diamond it named the wrong parent. This is the true walk.
 *
 * HONESTY: when the snapshot carries no read tracking (`readTracking: 'off'`),
 * read→write edges are UNKNOWABLE — the trace returns just the target frame
 * plus `readsAvailable: false` so the panel can say "reads not recorded"
 * instead of implying independence.
 */

/** The frame shape DataTracePanel renders (unchanged public contract). */
export interface DataTraceFrame {
  runtimeStageId: string;
  stageId: string;
  stageName: string;
  keysWritten: string[];
  /** The read key whose write linked this frame to its child ('' = target). */
  linkedBy: string;
  depth: number;
}

export interface DataTraceResult {
  frames: DataTraceFrame[];
  /** False when NO step in the tree recorded reads — edges unknowable. */
  readsAvailable: boolean;
}

/** Duck-typed commit bundle (the stable snapshot shape). */
interface CommitEntry {
  stage: string;
  stageId: string;
  runtimeStageId: string;
  /** Optional: present on every bundle the current engine writes, absent on
   *  older or hand-assembled recordings. See `tracedPaths`. */
  trace?: Array<{ path: string }>;
}

/** Duck-typed execution-tree node (stageReads keys are the read record). */
interface TreeNode {
  runtimeStageId?: string;
  stageReads?: Record<string, unknown>;
  next?: TreeNode;
  children?: TreeNode[];
}

/** Collect per-step read keys from the execution tree (visited-set safe). */
function readsByStep(tree: TreeNode | undefined): Map<string, string[]> {
  const byStep = new Map<string, string[]>();
  if (!tree) return byStep;
  const visited = new Set<TreeNode>();
  const stack: TreeNode[] = [tree];
  while (stack.length > 0) {
    const node = stack.pop()!;
    if (visited.has(node)) continue;
    visited.add(node);
    if (node.runtimeStageId && node.stageReads) {
      const keys = Object.keys(node.stageReads);
      if (keys.length > 0) byStep.set(node.runtimeStageId, keys);
    }
    if (node.next) stack.push(node.next);
    if (node.children) for (const c of node.children) stack.push(c);
  }
  return byStep;
}

/**
 * Backward slice from `targetRuntimeStageId`: BFS where each step links to
 * the LAST prior writer of each key it read (the causalChain walk). Frames
 * come back in BFS order, deduped, budget-bounded.
 */
export function buildDataTrace(
  commitLog: unknown[],
  executionTree: unknown,
  targetRuntimeStageId: string,
  maxDepth = 10,
  maxFrames = 50,
): DataTraceResult {
  const log = (commitLog ?? []) as CommitEntry[];
  const reads = readsByStep(executionTree as TreeNode | undefined);
  const readsAvailable = reads.size > 0;
  if (!log.length) return { frames: [], readsAvailable };

  const idxOf = new Map<string, number>();
  for (let i = 0; i < log.length; i++) idxOf.set(log[i].runtimeStageId, i);
  const startIdx = idxOf.get(targetRuntimeStageId);
  if (startIdx === undefined) return { frames: [], readsAvailable };

  // `trace` is what the engine records per commit; a bundle that arrives
  // without it (an older engine, a hand-assembled recording) means "wrote
  // nothing traceable", not "crash the whole shell".
  const tracedPaths = (entry: CommitEntry): { path: string }[] => entry.trace ?? [];

  const findLastWriter = (key: string, beforeIdx: number): number => {
    for (let i = beforeIdx - 1; i >= 0; i--) {
      if (tracedPaths(log[i]).some((t) => t.path === key)) return i;
    }
    return -1;
  };

  const frames: DataTraceFrame[] = [];
  const visited = new Set<string>();
  // BFS queue: [commit array idx, depth, the read key that linked it]
  const queue: Array<[number, number, string]> = [[startIdx, 0, ""]];

  while (queue.length > 0 && frames.length < maxFrames) {
    const [idx, depth, linkedBy] = queue.shift()!;
    const commit = log[idx];
    if (visited.has(commit.runtimeStageId)) continue;
    visited.add(commit.runtimeStageId);

    frames.push({
      runtimeStageId: commit.runtimeStageId,
      stageId: commit.stageId,
      stageName: commit.stage,
      keysWritten: tracedPaths(commit).map((t) => t.path),
      linkedBy,
      depth,
    });

    if (depth >= maxDepth) continue;
    for (const key of reads.get(commit.runtimeStageId) ?? []) {
      const writerIdx = findLastWriter(key, idx);
      if (writerIdx >= 0 && !visited.has(log[writerIdx].runtimeStageId)) {
        queue.push([writerIdx, depth + 1, key]);
      }
    }
  }

  return { frames, readsAvailable };
}
