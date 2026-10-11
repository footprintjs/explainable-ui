import { isCommitBundle, keysReadFromExecutionTree, stateAt, timeTravel } from "foottrace";
import type { CommitBundle, FoldedState, KeysReadSource, TimeTravelSource } from "foottrace";
import { adaptFlowRecord } from "./index";
import type { FlowRecordSelection } from "./index";

export type TraceSource =
  | { status: "available"; sourceId: string; beforeCommitIdx: number; log: CommitBundle[]; reads: KeysReadSource; fold: FoldedState; initialState?: TimeTravelSource["initialState"] }
  | { status: "unavailable"; sourceId: string; reason: "source" | "boundary" | "log-gap" | "reads" | "reader"; message: string };

/** Narrow with the record owner's guard, retaining every original position. */
function isReadablePrefix(rows: unknown[]): rows is CommitBundle[] {
  for (let index = 0; index < rows.length; index++) {
    if (!isCommitBundle(rows[index])) return false;
  }
  return true;
}

type SelectedInput = Exclude<ReturnType<typeof adaptFlowRecord>, { status: "refused" }>;

/** A variable question selects a prefix directly; omission explicitly means end. */
export function prepareTracePrefix(selection: FlowRecordSelection, beforeCommitIdx?: number): TraceSource {
  const input = adaptFlowRecord(selection);
  if (input.status === "refused") return { status: "unavailable", sourceId: selection.sourceId, reason: "source", message: input.message };
  const raw = input.source.commitLog ?? input.source.history;
  return preparePrefix(input, beforeCommitIdx ?? raw?.length ?? 0);
}

/** Stage-address composition; a missing stage never selects the whole source. */
export function prepareTraceSource(selection: FlowRecordSelection, targetRuntimeStageId: string, beforeCommitIdx?: number): TraceSource {
  const refused = (reason: Extract<TraceSource, { status: "unavailable" }>["reason"], message: string): TraceSource =>
    ({ status: "unavailable", sourceId: selection.sourceId, reason, message });
  const input = adaptFlowRecord(selection);
  if (input.status === "refused") return refused("source", input.message);
  const raw = input.source.commitLog ?? input.source.history;
  if (!raw) return refused("source", "The selected source has no recorded log.");
  let before = beforeCommitIdx;
  if (before === undefined) {
    try {
      const stop = timeTravel(input.source).stops.find(row => row.kind !== "start" && row.kind !== "end" && row.runtimeStageId === targetRuntimeStageId);
      if (!stop) return refused("boundary", "No exact recorded position is available for the selected stage.");
      before = stop.lastCommitIdx + 1;
    } catch {
      return refused("boundary", "The selected stage has no readable canonical boundary.");
    }
  }
  return preparePrefix(input, before);
}

/** Shared boundary/reader seam. No path, writer, tree or replay algorithm. */
function preparePrefix(input: SelectedInput, before: number): TraceSource {
  const refused = (reason: Extract<TraceSource, { status: "unavailable" }>["reason"], message: string): TraceSource =>
    ({ status: "unavailable", sourceId: input.sourceId, reason, message });
  const raw = input.source.commitLog ?? input.source.history;
  if (!raw) return refused("source", "The selected source has no recorded log.");
  if (!Number.isSafeInteger(before) || before < 0 || before > raw.length) {
    return refused("boundary", "The selected boundary is not an exact position in this source.");
  }
  const log = raw.slice(0, before);
  if (!isReadablePrefix(log)) {
    return refused("log-gap", "Causal tracing is unavailable: the selected prefix contains an unreadable record row. Row positions have not been changed.");
  }
  let reads: KeysReadSource;
  try {
    reads = input.evidence.reads.status === "supplied" ? input.evidence.reads.source
      : input.source.executionTree === undefined ? { kind: "unknown", lookup: () => [] }
      : keysReadFromExecutionTree(input.source.executionTree);
  } catch (error) {
    return refused("reads", error instanceof Error ? error.message : "The selected source's read evidence is unreadable.");
  }
  try {
    const fold = stateAt({ commitLog: log, ...(input.source.initialState !== undefined && { initialState: input.source.initialState }) }, before - 1);
    return { status: "available", sourceId: input.sourceId, beforeCommitIdx: before, log, reads, fold,
      ...(input.source.initialState !== undefined && { initialState: input.source.initialState }) };
  } catch {
    return refused("reader", "Foottrace could not read this source at the selected boundary.");
  }
}
