import { emptyVisitPhase } from "./traceScope";
import { readCommitTiming, indexReadWindows, type RecordedReadTiming } from "./readTiming";
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
import { indexReadAddresses, indexTraceWrites, indexWriterCommits, readPathUncertainty, readTraceWrites, readsForWrittenKey, stageReadKeys, indexRelatedWrites, resolveReadWriter, type RecordedTraceWrite } from "./readProvenance";

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
interface CommitEntry extends RecordedReadTiming {
  phase?: "exit" | "repeat";
  stage: string;
  stageId: string;
  runtimeStageId: string;
  trace: RecordedTraceWrite[];
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
  return createDataTraceReader(commitLog, executionTree, provenance).at(targetRuntimeStageId, maxDepth, maxFrames, targetPath);
}

/** Prepared for a single immutable scope revision, shared by successive Shell positions. */
export function createDataTraceReader(commitLog: unknown[], executionTree: unknown, provenance?: DataTraceProvenanceOptions) {
  const budget = new WorkBudget();
  let index: ReturnType<typeof indexTraceEvidence>;
  try {
    const log = readOwnArray(commitLog ?? [], budget).map(entry => {
      const trace = readTraceWrites(optionalOwnDataField(entry, "trace"), budget, true);
      const phase = emptyVisitPhase(entry, trace.length, budget);
      return { ...readCommitTiming(entry),
        stage: optionalOwnDataField(entry, "stage") as string,
        stageId: optionalOwnDataField(entry, "stageId") as string,
        runtimeStageId: optionalOwnDataField(entry, "runtimeStageId") as string,
        trace, ...(phase ? { phase } : {}),
      };
    });
    index = indexTraceEvidence(log, stageReadKeys(executionTree, budget), provenance?.nestedReadTracking === true);
  } catch {
    return { at: (): DataTraceResult => ({ frames: [], readsAvailable: false }) };
  }
  const visits = new Map<string, number>();
  index.log.forEach((commit, i) => {
    if (!commit.phase) visits.set(commit.runtimeStageId, visits.has(commit.runtimeStageId) ? -1 : i);
  });
  return {
    at(id: string, maxDepth = 10, maxFrames = 50, path?: string): DataTraceResult {
      let start = visits.get(id) ?? -1;
      if (path !== undefined) {
        const writers = index.writers.get(path) ?? [];
        start = -1;
        for (let i = writers.length - 1; i >= 0; i--) {
          const candidate = writers[i];
          if (index.log[candidate].runtimeStageId === id) { start = candidate; break; }
        }
      }
      return sliceAtCommit(index, start, maxDepth, maxFrames, path);
    },
  };
}

/** Both readers use these lookups, after applying their own input admission rules. */
export function indexTraceEvidence(log: CommitEntry[], reads: Map<string, string[]>, nestedReadTracking: boolean) {
  const windows = indexReadWindows(log);
  const related = indexRelatedWrites(log);
  const writers = indexWriterCommits(log);
  const writesByKey = log.map(commit => indexTraceWrites(commit.trace));
  const stageReadNames = new Map([...reads].map(([id, keys]) => [id, new Set(keys)]));
  const noStageReads = new Set<string>();
  const readAddresses = writesByKey.map((writes, i) =>
    indexReadAddresses(writes, stageReadNames.get(log[i].runtimeStageId) ?? noStageReads, nestedReadTracking));
  const firstRecordedRead = log.findIndex(commit => commit.trace.some(write => write.readKeys !== undefined));
  return { log, reads, windows, related, writers, writesByKey, readAddresses, firstRecordedRead };
}

export function sliceAtCommit(
  index: ReturnType<typeof indexTraceEvidence>, startIdx: number, maxDepth: number, maxFrames: number,
  targetPath?: string, lastEvidenceIdx = index.log.length - 1,
): DataTraceResult {
  const { log, reads, windows, related, writers, writesByKey, readAddresses, firstRecordedRead } = index;
  // A historical write cannot borrow read availability from a later commit.
  const readsAvailable = reads.size > 0 || (firstRecordedRead >= 0 && firstRecordedRead <= lastEvidenceIdx);
  if (startIdx < 0) return { frames: [], readsAvailable };
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
        stageName: commit.stage, keysWritten: commit.trace.map(t => t.path),
        linkedBy, depth, commitIdx: idx, readKeys: [] };
      frames.push(frame); frameAt.set(idx, frame); frameReads.set(idx, new Set());
    }
    const selectedReads = readsForWrittenKey(writesByKey[idx], reads.get(commit.runtimeStageId) ?? [], path);
    for (const key of selectedReads) frameReads.get(idx)!.add(key);

    if (depth >= maxDepth) continue;
    for (const key of selectedReads) {
      if (readPathUncertainty(key, writesByKey[idx], path, readAddresses[idx])) continue;
      const { writer: writerIdx } = resolveReadWriter(writers, related, key, windows[idx]);
      if (writerIdx >= 0) {
        queue.push([writerIdx, depth + 1, key, key]);
      }
    }
  }

  for (const frame of frames) frame.readKeys = [...frameReads.get(frame.commitIdx!)!];
  return { frames, readsAvailable };
}
