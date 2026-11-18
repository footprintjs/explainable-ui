import { commitValueAtWithBasis, findLastWriter } from "foottrace";
import type { CommitBundle, Stop, VariableSlice } from "foottrace";
import { pathSegments } from "foottrace/paths";
import type { RecordWriterStop } from "./types";

/** Navigation needs an exact, visible writer, even when Foottrace can explain a partial cause. */
export function directWriterStops(log: CommitBundle[], stops: readonly Stop[], slice: VariableSlice): RecordWriterStop[] {
  if (!slice.root || !slice.writer) return [];
  const anchor = log.indexOf(slice.writer);
  const outputs = slice.writer.trace.filter(row => row.path === slice.key);
  if (anchor < 1 || outputs.length !== 1 || slice.notes?.length) return [];
  const reads = new Set(outputs[0].readKeys);
  if (!reads.size) return [];

  // Extra phase rows without writes do not introduce a competing writer. An ID
  // with several writing rows cannot locate an edge by its stage name alone.
  const writingRows = new Map<string, number>();
  for (let i = 0; i <= anchor; i++) {
    const row = log[i];
    if (row.trace.length) {
      writingRows.set(row.runtimeStageId, writingRows.has(row.runtimeStageId) ? -1 : i);
    }
  }
  if (writingRows.get(slice.writer.runtimeStageId) !== anchor) return [];

  const result: RecordWriterStop[] = [];
  for (const edge of slice.root.parentEdges) {
    if (edge.kind !== "data" || edge.key === undefined || !reads.has(edge.key) ||
        edge.overlap || edge.builtOn || edge.basis) continue;
    const index = writingRows.get(edge.parent.runtimeStageId);
    if (index === undefined || index < 0 || index >= anchor) continue;
    const row = log[index];
    const writes = row.trace.filter(entry => entry.path === edge.key);
    if (writes.length !== 1 || writes[0].verb !== "set") continue;
    const candidates = stops.filter(stop => (stop.kind === "commit" || stop.kind === "mount") &&
      stop.commitIdx === index && stop.runtimeStageId === row.runtimeStageId &&
      stop.lastCommitIdx >= index && stop.lastCommitIdx < anchor);
    if (candidates.length !== 1) continue;
    const stop = candidates[0];
    // A grouped stop may fold another write after this row. Its state would
    // answer a different question. Empty phase markers are safe to cross.
    if (log.slice(index + 1, stop.lastCommitIdx + 1).some(entry => entry.trace.length)) continue;
    if (findLastWriter(log, edge.key, stop.lastCommitIdx + 1) !== row) continue;
    const recorded = commitValueAtWithBasis(log, index, edge.key);
    if (recorded.basis.length) continue;
    result.push({ step: stop.step, key: pathSegments(edge.key), stageName: row.stage, value: recorded.value });
  }
  return result;
}
