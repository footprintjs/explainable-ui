/**
 * dataTrace — the REAL backward data slice behind the shell's "Data Trace"
 * tab, mirroring footprintjs' `causalChain` (thin backward slicing: BFS over
 * read→write dependencies) WITHOUT importing footprintjs — eui deliberately
 * consumes snapshot SHAPES, never the engine (its only dependency is dagre).
 *
 * WHY a mirror and not the import: eui renders snapshots from ANY footprintjs
 * version (and stored/offline traces); a runtime dependency would couple the
 * two release lines. The algorithm is small and the shapes are stable — the
 * commit log's `trace[].path` and optional per-write `readKeys`, plus legacy
 * execution-tree `stageReads`, are sufficient. Canonical paths are compared
 * exactly; coarse parent reads never become invented descendant links.
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

import { optionalOwnDataField, readOwnArray, WorkBudget } from "./safeRecordRead";
import { indexReadAddresses, indexTraceWrites, indexWriterCommits, readPathUncertainty, readTraceWrites, readsForWrittenKey, stageReadKeys, writerBefore, type RecordedTraceWrite } from "./readProvenance";

/** The frame shape DataTracePanel renders. New evidence fields are optional. */
export interface DataTraceFrame {
  runtimeStageId: string;
  stageId: string;
  stageName: string;
  keysWritten: string[];
  /** The read key whose write linked this frame to its child ('' = target). */
  linkedBy: string;
  depth: number;
  /** Exact commit position, including when a runtime stamp has an empty bookend. */
  commitIdx?: number;
  /** Union of the selected writes' read prefixes, with legacy fallback only where absent. */
  readKeys?: string[];
}

export interface DataTraceResult {
  frames: DataTraceFrame[];
  /** False when NO step in the tree recorded reads — edges unknowable. */
  readsAvailable: boolean;
}

export interface DataTraceProvenanceOptions {
  /** Explicit producer discriminator for canonical per-write readKeys. */
  nestedReadTracking?: boolean;
}

/** Duck-typed commit bundle (the stable snapshot shape). */
interface CommitEntry {
  stage: string;
  stageId: string;
  runtimeStageId: string;
  /** Optional: present on every bundle the current engine writes, absent on
   *  older or hand-assembled recordings. See `tracedPaths`. */
  trace?: RecordedTraceWrite[];
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
  /** Omit for a stage inspection; supply for the value of one exact write. */
  targetPath?: string,
  provenance?: DataTraceProvenanceOptions,
): DataTraceResult {
  let log: CommitEntry[], reads: Map<string, string[]>;
  try {
    const budget = new WorkBudget();
    log = readOwnArray(commitLog ?? [], budget).map(entry => ({
      stage: optionalOwnDataField(entry, "stage") as string,
      stageId: optionalOwnDataField(entry, "stageId") as string,
      runtimeStageId: optionalOwnDataField(entry, "runtimeStageId") as string,
      trace: readTraceWrites(optionalOwnDataField(entry, "trace"), budget, true),
    }));
    reads = stageReadKeys(executionTree, budget);
  } catch { return { frames: [], readsAvailable: false }; }
  const readsAvailable = reads.size > 0 || log.some(commit => commit.trace?.some(write => write.readKeys !== undefined));
  if (!log.length) return { frames: [], readsAvailable };

  const idxOf = new Map<string, number>();
  for (let i = 0; i < log.length; i++) idxOf.set(log[i].runtimeStageId, i);
  let startIdx = idxOf.get(targetRuntimeStageId);
  if (targetPath !== undefined) {
    startIdx = undefined;
    for (let i = log.length - 1; i >= 0; i--) {
      if (log[i].runtimeStageId === targetRuntimeStageId && log[i].trace?.some(write => write.path === targetPath)) {
        startIdx = i; break;
      }
    }
  }
  if (startIdx === undefined) return { frames: [], readsAvailable };

  // `trace` is what the engine records per commit; a bundle that arrives
  // without it (an older engine, a hand-assembled recording) means "wrote
  // nothing traceable", not "crash the whole shell".
  const tracedPaths = (entry: CommitEntry): RecordedTraceWrite[] =>
    entry.trace ?? [];

  const writesByKey = log.map(commit => indexTraceWrites(tracedPaths(commit)));
  const writers = indexWriterCommits(log);
  const stageReadNames = new Map([...reads].map(([id, keys]) => [id, new Set(keys)]));
  const noStageReads = new Set<string>();
  const readAddresses = writesByKey.map((writes, index) => indexReadAddresses(writes, stageReadNames.get(log[index].runtimeStageId) ?? noStageReads, provenance?.nestedReadTracking === true));

  const frames: DataTraceFrame[] = [];
  const frameAt = new Map<number, DataTraceFrame>();
  const frameReads = new Map<number, Set<string>>();
  const visited = new Set<string>();
  // Questions are per written path, even when two paths share one stage visit.
  const queue: Array<[number, number, string, string | undefined]> = [[startIdx, 0, "", targetPath]];

  for (let cursor = 0; cursor < queue.length && frames.length < maxFrames; cursor++) {
    const [idx, depth, linkedBy, path] = queue[cursor];
    const commit = log[idx];
    const write = path === undefined ? undefined : writesByKey[idx].get(path);
    const question = JSON.stringify([idx, write?.readKeys === undefined ? null : path]);
    if (visited.has(question)) continue;
    visited.add(question);

    let frame = frameAt.get(idx);
    if (!frame) {
      frame = { runtimeStageId: commit.runtimeStageId, stageId: commit.stageId,
        stageName: commit.stage, keysWritten: tracedPaths(commit).map(t => t.path),
        linkedBy, depth, commitIdx: idx, readKeys: [] };
      frames.push(frame); frameAt.set(idx, frame); frameReads.set(idx, new Set());
    }
    const selectedReads = readsForWrittenKey(writesByKey[idx], reads.get(commit.runtimeStageId) ?? [], path);
    for (const key of selectedReads) frameReads.get(idx)!.add(key);

    if (depth >= maxDepth) continue;
    for (const key of selectedReads) {
      if (readPathUncertainty(key, writesByKey[idx], path, readAddresses[idx])) continue;
      const writerIdx = writerBefore(writers, key, idx);
      if (writerIdx >= 0) {
        queue.push([writerIdx, depth + 1, key, key]);
      }
    }
  }

  for (const frame of frames) frame.readKeys = [...frameReads.get(frame.commitIdx!)!];
  return { frames, readsAvailable };
}
