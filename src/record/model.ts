import {
  deepEqual,
  formatSlice,
  isCommitBundle,
  sliceForKey,
  stateAt,
  timeTravel,
} from "foottrace";
import type {
  CommitBundle,
  KeysReadSource,
  StateKey,
  TimeTravelSource,
  TimeTravel,
} from "foottrace";
import type {
  RecordChange,
  RecordLensInput,
  RecordLensModel,
  RecordProvenance,
  RecordLensReader,
  RecordReaderInput,
  RecordRefusal,
} from "./types";

/** Missing reads are deliberately not inferred by walking a producer's tree. */
const unknownReads: KeysReadSource = {
  kind: "not-recorded",
  lookup: () => [],
};

function changesBetween(
  before: Readonly<Record<string, unknown>>,
  after: Readonly<Record<string, unknown>>
): RecordChange[] {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const changes: RecordChange[] = [];
  for (const key of keys) {
    const wasPresent = Object.prototype.hasOwnProperty.call(before, key);
    const isPresent = Object.prototype.hasOwnProperty.call(after, key);
    if (!wasPresent) changes.push({ key, kind: "added", after: after[key] });
    else if (!isPresent)
      changes.push({ key, kind: "removed", before: before[key] });
    else if (!deepEqual(before[key], after[key])) {
      changes.push({
        key,
        kind: "changed",
        before: before[key],
        after: after[key],
      });
    }
  }
  return changes;
}

function provenanceAt(
  source: TimeTravelSource,
  throughCommitIdx: number,
  key: StateKey,
  reads: KeysReadSource | undefined
): RecordProvenance {
  // Match the public source contract: commitLog takes precedence over history.
  // Slice, never filter: all commit indices retain their original addresses.
  const log = Array.isArray(source.commitLog)
    ? source.commitLog
    : Array.isArray(source.history)
    ? source.history
    : [];
  const prefix: CommitBundle[] = [];
  for (let index = 0; index <= throughCommitIdx; index++) {
    const row: unknown = log[index];
    if (!isCommitBundle(row)) {
      return {
        status: "unavailable",
        reason: "log-gap",
        message:
          "Causal explanation is unavailable because this recorded prefix contains unreadable rows.",
      };
    }
    // No rejected entry is ever skipped: this copy is still index-aligned.
    prefix.push(row);
  }
  try {
    const slice = sliceForKey(prefix, key, reads ?? unknownReads, {
      before: prefix.length,
    });
    return {
      status: "ready",
      slice,
      prose: formatSlice(slice),
      reads:
        !reads || reads.coverage?.stepsWithReads === 0 ? "unknown" : "provided",
    };
  } catch {
    return {
      status: "unavailable",
      reason: "query-refused",
      message:
        "Foottrace could not read a causal explanation from the supplied record and read evidence.",
    };
  }
}

function refused<TMeta>(
  sourceId: string,
  step: number,
  stops: RecordLensReader<TMeta>["stops"],
  code: RecordRefusal["code"],
  message: string
): RecordLensModel<TMeta> {
  return { sourceId, step, stops, selected: null, status: "refused", refusal: { code, message } };
}

function unavailableReader<TMeta>(sourceId: string, code: RecordRefusal["code"], message: string): RecordLensReader<TMeta> {
  const stops = Object.freeze([]);
  return { sourceId, stops, at: (step) => refused(sourceId, step, stops, code, message) };
}

function modelAt<TMeta>(
  input: RecordReaderInput<TMeta>,
  cursor: TimeTravel<TMeta>,
  step: number,
  selectedKey?: StateKey
): RecordLensModel<TMeta> {
  const { sourceId, source, reads } = input;
  const { stops } = cursor;
  if (!Number.isInteger(step) || step < 0 || (stops.length === 0 ? step !== 0 : step >= stops.length)) {
    return refused(sourceId, step, stops, "invalid-step", "The requested step is not a position in this source.");
  }

  try {
    const selected = stops[step] ?? null;
    const previousStop = stops[step - 1];
    const previous = previousStop ? cursor.stateAt(previousStop) : stateAt(source, -1);
    const folded = selected ? cursor.stateAt(selected) : previous;
    return {
      sourceId, step, stops, selected, previous, folded,
      status: selected ? "ready" : "empty",
      changes: changesBetween(previous.state, folded.state),
      ...(selectedKey !== undefined && {
        provenance: provenanceAt(source, folded.throughCommitIdx, selectedKey, reads),
      }),
    };
  } catch {
    return refused(sourceId, step, stops, "read-refused", "Foottrace could not read the supplied source.");
  }
}

/** Prepare one canonical axis per published revision. Reuse it while moving between stops. */
export function createRecordLensReader<TMeta = unknown>({ sourceId, source, reads, strategy }: RecordReaderInput<TMeta>): RecordLensReader<TMeta> {
  if (typeof sourceId !== "string" || !sourceId.trim()) {
    return unavailableReader(typeof sourceId === "string" ? sourceId : "", "invalid-source-id", "A source label is required.");
  }
  if (!source || typeof source !== "object" || Array.isArray(source)) {
    return unavailableReader(sourceId, "read-refused", "Supply one recorded source object.");
  }
  try {
    const cursor = timeTravel(source, { strategy });
    const revision = { sourceId, source, reads };
    return {
      sourceId,
      stops: cursor.stops,
      at: (step, selectedKey) => modelAt(revision, cursor, step, selectedKey),
    };
  } catch {
    return unavailableReader(sourceId, "read-refused", "Foottrace could not read the supplied source.");
  }
}

/** One-shot read, including hosts that publish updates by mutating a source in place. */
export function buildRecordLensModel<TMeta = unknown>(input: RecordLensInput<TMeta>): RecordLensModel<TMeta> {
  return createRecordLensReader(input).at(input.step, input.selectedKey);
}
