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
} from "foottrace";
import type {
  RecordChange,
  RecordLensInput,
  RecordLensModel,
  RecordProvenance,
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

/** Read one explicit source through Foottrace; never clamp or mutate the caller's cursor. */
export function buildRecordLensModel(input: RecordLensInput): RecordLensModel {
  const position = { sourceId: input.sourceId, step: input.step };
  if (!input.sourceId.trim()) {
    return {
      ...position,
      stops: [],
      selected: null,
      status: "refused",
      refusal: {
        code: "invalid-source-id",
        message: "A source label is required.",
      },
    };
  }
  let stops: RecordLensModel["stops"] = [];
  try {
    // The pilot accepts one caller-selected source, never Foottrace's multi-source overload.
    if (
      !input.source ||
      typeof input.source !== "object" ||
      Array.isArray(input.source)
    ) {
      return {
        ...position,
        stops,
        selected: null,
        status: "refused",
        refusal: {
          code: "read-refused",
          message: "Supply one recorded source object.",
        },
      };
    }
    const cursor = timeTravel(input.source);
    stops = cursor.stops;
    const validStep =
      Number.isInteger(input.step) &&
      input.step >= 0 &&
      (stops.length === 0 ? input.step === 0 : input.step < stops.length);
    if (!validStep) {
      return {
        ...position,
        stops,
        selected: null,
        status: "refused",
        refusal: {
          code: "invalid-step",
          message: "The requested step is not a position in this source.",
        },
      };
    }
    const selected = stops[input.step] ?? null;
    const folded = selected
      ? cursor.stateAt(selected)
      : stateAt(input.source, -1);
    const previousStop = stops[input.step - 1];
    const previous = previousStop
      ? cursor.stateAt(previousStop)
      : stateAt(input.source, -1);
    return {
      ...position,
      stops,
      selected,
      status: selected ? "ready" : "empty",
      folded,
      previous,
      changes: changesBetween(previous.state, folded.state),
      ...(input.selectedKey !== undefined && {
        provenance: provenanceAt(
          input.source,
          folded.throughCommitIdx,
          input.selectedKey,
          input.reads
        ),
      }),
    };
  } catch {
    return {
      ...position,
      stops,
      selected: null,
      status: "refused",
      refusal: {
        code: "read-refused",
        message: "Foottrace could not read the supplied source.",
      },
    };
  }
}
