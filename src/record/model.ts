import {
  commitStopsStrategy,
  commitValueAtWithBasis,
  findLastWriter,
  deepEqual,
  formatSlice,
  sliceForKey,
  timeTravel,
} from "foottrace";
import type {
  CommitBundle,
  KeysReadSource,
  StateKey,
  FoldedState,
  TimeTravelStrategy,
  Stop,
} from "foottrace";
import { normaliseStateKey, pathSegments } from "foottrace/paths";
import { fitsReaderCache } from "./cacheBudget";
import { createFoldWindow } from "./foldWindow";
import { createScopedRecordGraph, type ScopedWriter } from "./scopedRecordGraph";
import { ownDataField } from "../trace/safeRecordRead";
import { directWriterStops } from "./writerStops";
import type {
  RecordChange,
  RecordLensInput,
  RecordLensModel,
  RecordProvenance,
  RecordLensReader,
  RecordReaderInput,
  RecordRefusal,
  RecordWriterStop,
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

type Query = { provenance: RecordProvenance; writerStops?: readonly RecordWriterStop[] };

function provenanceAt(
  prefix: CommitBundle[],
  key: StateKey,
  reads: KeysReadSource | undefined,
  stops: readonly Stop[]
): Query {
  try {
    const slice = sliceForKey(prefix, key, reads ?? unknownReads, {
      before: prefix.length,
    });
    const provenance: RecordProvenance = {
      status: "ready",
      slice,
      prose: formatSlice(slice),
      reads: !reads || reads.coverage?.stepsWithReads === 0 ? "unknown" : "provided",
    };
    // Link admission is narrower than causal reading. A failed address lookup
    // must not suppress a canonical explanation that was successfully obtained.
    try {
      return { provenance, writerStops: directWriterStops(prefix, stops, slice) };
    } catch {
      return { provenance };
    }
  } catch {
    return queryRefusal();
  }
}

/** Cache only within this source revision and its exact historical boundary. */
function createQueryReader(log: readonly CommitBundle[], reads: KeysReadSource | undefined, stops: readonly Stop[]) {
  const recent = new Map<string, { answer: Query; writer?: CommitBundle }>();
  return (step: number, folded: FoldedState, key: StateKey): Query => {
    const through = folded.throughCommitIdx;
    if (folded.skipped?.length) return gapRefusal();
    // A dotted literal and a nested path stay distinct under the recorder's codec.
    let path: string;
    try { path = normaliseStateKey(key); } catch { return queryRefusal(); }
    const address = step + ":" + path;
    const cached = recent.get(address);
    if (cached) {
      const copy = structuredClone(cached.answer);
      // The writer is the actual source bundle. Consumers may address it
      // using log.indexOf(slice.writer), just as Foottrace does.
      if (cached.writer && copy.provenance.status === "ready") copy.provenance.slice.writer = cached.writer;
      return copy;
    }
    // A physical prefix is necessary: later phase rows and read windows must
    // never enter the historical graph. Foottrace already validated these rows.
    const answer = provenanceAt(log.slice(0, through + 1), path, reads, stops);
    if (answer.provenance.status === "ready") {
      try {
        // VariableSlice is a public mutable DAG. Never cache an object handed
        // to a caller. A producer with non-cloneable metadata can still query.
        const { writer, ...slice } = answer.provenance.slice;
        const cacheable = { ...answer, provenance: { ...answer.provenance, slice } };
        if (!fitsReaderCache(cacheable)) return answer;
        recent.set(address, { answer: structuredClone(cacheable), writer });
        if (recent.size > 8) recent.delete(recent.keys().next().value!);
      } catch { /* The uncached canonical result is still valid. */ }
    }
    return answer;
  };
}

function queryRefusal(): Query {
  return { provenance: {
    status: "unavailable", reason: "query-refused",
    message: "Foottrace could not read a causal explanation from the supplied record and read evidence.",
  } };
}

function gapRefusal(): Query {
  return { provenance: {
    status: "unavailable", reason: "log-gap",
    message: "Causal explanation is unavailable because this recorded prefix contains unreadable rows.",
  } };
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
  sourceId: string,
  stops: readonly Stop<TMeta>[],
  foldsAt: ReturnType<typeof createFoldWindow<TMeta>>,
  query: ReturnType<typeof createQueryReader>,
  step: number,
  selectedKey?: StateKey
): RecordLensModel<TMeta> {
  if (!Number.isInteger(step) || step < 0 || (stops.length === 0 ? step !== 0 : step >= stops.length)) {
    return refused(sourceId, step, stops, "invalid-step", "The requested step is not a position in this source.");
  }

  try {
    const selected = stops[step] ?? null;
    const { previous, folded } = foldsAt(step);
    return {
      sourceId, step, stops, selected, previous, folded,
      status: selected ? "ready" : "empty",
      changes: changesBetween(previous.state, folded.state),
      ...(selectedKey !== undefined && query(step, folded, selectedKey)),
    };
  } catch {
    return refused(sourceId, step, stops, "read-refused", "Foottrace could not read the supplied source.");
  }
}

/** Prepare one canonical axis per published revision. Reuse it while moving between stops. */
export function createRecordLensReader<TMeta = unknown>(input: RecordReaderInput<TMeta>): RecordLensReader<TMeta> {
  const rootReader = localReader(input);
  if (!rootReader.stops.length) return rootReader;
  const graph = createScopedRecordGraph(input.source);
  if (!graph) return rootReader;
  const hasObservations = ownDataField(input.source, "capture") !== undefined || ownDataField(input.source, "readSources") !== undefined;
  if (!graph.hasSubflows && !hasObservations) return rootReader;
  const readers = new Map<string, RecordLensReader<TMeta>>();
  function forScope(path: readonly string[]): RecordLensReader<TMeta> | undefined {
    const key = JSON.stringify(path), existing = readers.get(key);
    if (existing) return existing;
    const source = path.length ? graph?.source(path) : undefined;
    if (path.length && !source) return undefined;
    const reader = path.length && source ? localReader({ sourceId: input.sourceId, source, strategy: input.strategy }) : rootReader;
    const scoped: RecordLensReader<TMeta> = {
      ...reader, forScope, positionOf,
      at(step, key) {
        const model = reader.at(step, key);
        if (!graph!.hasSubflows || model.status === "refused" || !model.writerStops) return model;
        // A same-log slice can mix a mount's input reads with its output write.
        // Leave writer navigation to backtrack(), which knows the mapper address.
        const { writerStops: _localOnly, ...state } = model;
        return state;
      },
      async backtrack(step, key, signal) {
        const stop = reader.stops[step];
        if (!stop) return { writers: [], gaps: [{ invocationPath: path, code: "invalid-step", message: "The requested step is unavailable." }] };
        return graph!.read({ invocationPath: path, key: normaliseStateKey(key), beforeCommitIdx: stop.lastCommitIdx + 1, signal });
      },
    };
    readers.set(key, scoped);
    return scoped;
  }
  function positionOf(writer: ScopedWriter) {
    const path = writer.invocationPath;
    const recordedAddress = (input.source as { logAddress?: {logRunId?: string} }).logAddress;
    if (writer.address.logRunId !== recordedAddress?.logRunId || JSON.stringify(path) !== JSON.stringify(writer.address.drillPath)) return undefined;
    const source = graph!.source(path), reader = forScope(path);
    if (!source?.commitLog || !reader) return undefined;
    const log = source.commitLog as CommitBundle[], row = log[writer.commitIdx];
    if (!row || row.runtimeStageId !== writer.runtimeStageId || !row.trace.some(write => write.path === writer.key)) return undefined;
    const stops = reader.stops.filter(stop => (
      (stop.runtimeStageId === writer.runtimeStageId && (stop.kind === "commit" || stop.kind === "mount")) ||
      (stop.kind === "start" && !stop.prologue && writer.commitIdx === 0 && writer.runtimeStageId === path.at(-1))
    ) && stop.commitIdx <= writer.commitIdx && writer.commitIdx <= stop.lastCommitIdx);
    if (stops.length !== 1 || findLastWriter(log, writer.key, stops[0].lastCommitIdx + 1) !== row) return undefined;
    const recorded = commitValueAtWithBasis(log, writer.commitIdx, writer.key, { initialState: source.initialState });
    if (recorded.basis.length) return undefined;
    return { invocationPath: path, key: pathSegments(writer.key), step: stops[0].step, value: recorded.value };
  }
  return forScope([])!;
}

function localReader<TMeta>({ sourceId, source, reads, strategy }: RecordReaderInput<TMeta>): RecordLensReader<TMeta> {
  if (typeof sourceId !== "string" || !sourceId.trim()) {
    return unavailableReader(typeof sourceId === "string" ? sourceId : "", "invalid-source-id", "A source label is required.");
  }
  if (!source || typeof source !== "object" || Array.isArray(source)) {
    return unavailableReader(sourceId, "read-refused", "Supply one recorded source object.");
  }
  try {
    // Foottrace hands the strategy its validated, index-aligned log. Keep
    // that same revision for causal reads; the fold reports any skipped rows.
    let log: readonly CommitBundle[] = [];
    const grouping = strategy ?? (commitStopsStrategy as TimeTravelStrategy<TMeta>);
    const cursor = timeTravel<TMeta>(source, { strategy: {
      stopsFor(rows, tree, children) {
        log = rows;
        return grouping.stopsFor(rows, tree, children);
      },
    } });
    const foldsAt = createFoldWindow(source, cursor);
    const query = createQueryReader(log, reads, cursor.stops);
    return {
      sourceId,
      stops: cursor.stops,
      at: (step, selectedKey) => modelAt(sourceId, cursor.stops, foldsAt, query, step, selectedKey),
    };
  } catch {
    return unavailableReader(sourceId, "read-refused", "Foottrace could not read the supplied source.");
  }
}

/** One-shot read, including hosts that publish updates by mutating a source in place. */
export function buildRecordLensModel<TMeta = unknown>(input: RecordLensInput<TMeta>): RecordLensModel<TMeta> {
  return createRecordLensReader(input).at(input.step, input.selectedKey);
}
