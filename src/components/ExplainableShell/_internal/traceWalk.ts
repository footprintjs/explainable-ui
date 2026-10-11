/** Variable-first canonical queries, projected onto the existing stage rail.
 * Read anchors, actual contributed writes and grouped rail stops are distinct.
 * This module owns no writer/path/tree/causal algorithm. */
import { buildCommitIndex, commitValueAtWithBasis, findLastWriter, flattenCausalDAG, keyTimeline, sliceForKey } from "foottrace";
import type { ReadsCoverage, ValueBasis } from "foottrace";
import type { FlowRecordSelection } from "../../../adapters/recordInput";
import { prepareTracePrefix } from "../../../adapters/recordInput/traceSource";
import { projectDataTrace } from "./dataTrace";
import { contributionBasisText, contributionPositionText, missingTraceText, noIngredientsText, unknownIngredientText } from "./traceWalkText";

/** One recorded dependency. null means no earlier recorded writer, not a proven input. */
export interface TraceIngredient {
  key: string;
  writerRuntimeStageId: string | null;
  writerStageName: string | null;
  /** Exact source-local writer row, independent of the stage's read anchor. */
  writerCommitIdx: number | null;
  basis?: "nested-rows";
}

export interface TraceStop {
  runtimeStageId: string;
  stageId: string;
  stageName: string;
  /** Representative stage/read position; the root uses its exact anchor writer.
   * Not a promise that every contributed key was written at this one row. */
  commitIdx: number;
  contributedKeys: string[];
  keysWritten: string[];
  ingredients: TraceIngredient[];
  depth: number;
  loopPass: number;
  /** The execution's own commit: where its captured reads belong. */
  readCommitIdx?: number;
  /** Actual writer positions for this stage's contributions to the slice. */
  contributedWrites?: Array<{ key: string; commitIdx: number; valueBasis?: ValueBasis[] }>;
}

export interface TraceWalkMissing {
  /** Compatibility vocabulary. 'never-written' means no recorded writer in
   * the queried range; it makes no claim that the value was a run input. */
  reason: "never-written" | "not-yet-written";
  /** Separately checked whole-record hint, never part of the historical answer. */
  firstWriteCommitIdx?: number;
  firstWriterRuntimeStageId?: string;
  firstWriterStageName?: string;
}

export interface TraceWalk {
  key: string;
  /** One card per canonical execution, newest representative position first. */
  stops: TraceStop[];
  missing: TraceWalkMissing | null;
  /** Compatibility name: captured reads lacking an earlier recorded writer.
   * Their origin is unknown; these are not asserted to be run inputs. */
  inputTermini: string[];
  /** Some captured reads were observed, never a complete-capture guarantee. */
  readsAvailable: boolean;
  truncated: boolean;
  /** Optional additions keep caller-created walks source-compatible. */
  status?: "available" | "not-recorded" | "unavailable";
  note?: string;
  evidence?: {
    sourceId: string;
    beforeCommitIdx: number;
    readsKind: string;
    readsCoverage?: ReadsCoverage;
    truncated?: { byDepth: boolean; byNodes: boolean };
  };
}

type WalkOptions = { beforeCommitIdx?: number; maxDepth?: number; maxFrames?: number };
const label = (value: unknown, fallback: string) => typeof value === "string" ? value : fallback;
export function unavailableTraceWalk(key: string, note: string): TraceWalk {
  return { key, stops: [], missing: null, inputTermini: [], readsAvailable: false, truncated: false, status: "unavailable", note };
}

/** Retained public positional API. No fabricated stage is needed for a key query. */
export function buildTraceWalk(commitLog: unknown[], executionTree: unknown, key: string, opts?: WalkOptions): TraceWalk {
  return buildSelectedTraceWalk({ sourceId: "flow:record", format: "snapshot", record: { commitLog, executionTree }, reads: { status: "unknown" } }, key, opts);
}

/** The Shell supplies its actual source/base and a frozen exclusive boundary. */
export function buildSelectedTraceWalk(selection: FlowRecordSelection, key: string, opts: WalkOptions = {}): TraceWalk {
  const maxDepth = opts.maxDepth ?? 10, maxFrames = opts.maxFrames ?? 50;
  if (!Number.isSafeInteger(maxDepth) || maxDepth < 0 || !Number.isSafeInteger(maxFrames) || maxFrames < 1)
    return unavailableTraceWalk(key, "Causal tracing needs a nonnegative depth and a positive frame limit.");
  const source = prepareTracePrefix(selection, opts.beforeCommitIdx);
  if (source.status === "unavailable") return unavailableTraceWalk(key, source.message);
  try {
    let observedReads = false;
    const reads = { ...source.reads, lookup: (id: string) => {
      const keys = source.reads.lookup(id);
      observedReads ||= keys.length > 0;
      return keys;
    } };
    const slice = sliceForKey(source.log, key, reads, { before: source.beforeCommitIdx, maxDepth, maxNodes: maxFrames, edgeAttribution: "stage" });
    const projected = projectDataTrace(source, slice.root, observedReads);
    const notes = [projected.note, ...(slice.notes ?? []).map(note => note.detail)];
    const evidence: NonNullable<TraceWalk["evidence"]> = {
      sourceId: source.sourceId, beforeCommitIdx: source.beforeCommitIdx, readsKind: source.reads.kind,
      ...(source.reads.coverage && { readsCoverage: source.reads.coverage }),
      ...(slice.root?.truncated && { truncated: slice.root.truncated }),
    };
    if (!slice.root || !slice.writer) {
      const missing: TraceWalkMissing = { reason: "never-written" };
      // Future hint is a separate whole-record query. Its failure cannot
      // invalidate this valid historical prefix or establish global absence.
      const whole = prepareTracePrefix(selection);
      if (whole.status === "available") {
        try {
          const first = keyTimeline(whole.log, key, whole.reads).moments?.find(moment => moment.kind === "write");
          if (first && first.commitIdx >= source.beforeCommitIdx) {
            Object.assign(missing, { reason: "not-yet-written", firstWriteCommitIdx: first.commitIdx,
              firstWriterRuntimeStageId: first.runtimeStageId, firstWriterStageName: label(first.stageName, first.runtimeStageId) });
          }
        } catch { notes.push("The separate whole-record first-write hint is unavailable."); }
      } else notes.push("Later record rows were not used to establish a whole-record first-write hint.");
      return { key, stops: [], missing, inputTermini: [], readsAvailable: projected.readsAvailable, truncated: false,
        status: "not-recorded", note: notes.join(" "), evidence };
    }
    const nodes = flattenCausalDAG(slice.root);
    const readIndex = buildCommitIndex(source.log);
    const anchorIndex = source.log.indexOf(slice.writer);
    const contributions = new Map<string, NonNullable<TraceStop["contributedWrites"]>>();
    contributions.set(slice.writer.runtimeStageId, [{ key, commitIdx: anchorIndex }]);
    const termini = new Set<string>();
    const stops = nodes.map(node => {
      const readCommitIdx = readIndex.get(node.runtimeStageId);
      if (readCommitIdx === undefined) throw new Error("Canonical node has no source-local read anchor");
      const ingredients: TraceIngredient[] = node.parentEdges.flatMap(edge => {
        if (edge.kind !== "data" || edge.key === undefined) return [];
        // A keyed edge can point to a different continuation of the SAME node.
        // Resolve this exact edge, never substitute that node's first/last row.
        const edgeKey = edge.key;
        const writer = findLastWriter(source.log, edgeKey, readCommitIdx);
        if (!writer || writer.runtimeStageId !== edge.parent.runtimeStageId) throw new Error("Canonical edge writer cannot be resolved in this source");
        const writerCommitIdx = source.log.indexOf(writer);
        const writes = contributions.get(writer.runtimeStageId) ?? [];
        if (!writes.some(write => write.key === edgeKey && write.commitIdx === writerCommitIdx)) writes.push({ key: edgeKey, commitIdx: writerCommitIdx });
        contributions.set(writer.runtimeStageId, writes);
        return [{ key: edgeKey, writerRuntimeStageId: writer.runtimeStageId, writerStageName: label(writer.stage, writer.runtimeStageId), writerCommitIdx,
          ...(edge.basis && { basis: edge.basis }) }];
      });
      for (const read of node.preRunReads?.keys ?? []) {
        termini.add(read);
        ingredients.push({ key: read, writerRuntimeStageId: null, writerStageName: null, writerCommitIdx: null });
      }
      return { runtimeStageId: node.runtimeStageId, stageId: label(node.stageId, node.runtimeStageId), stageName: label(node.stageName, node.runtimeStageId),
        commitIdx: node === slice.root ? anchorIndex : readCommitIdx, readCommitIdx,
        contributedKeys: [] as string[], contributedWrites: [] as NonNullable<TraceStop["contributedWrites"]>, keysWritten: node.keysWritten,
        ingredients, depth: node.depth, loopPass: 0 };
    });
    for (const stop of stops) {
      stop.contributedWrites = contributions.get(stop.runtimeStageId) ?? [];
      for (const write of stop.contributedWrites) {
        const value = commitValueAtWithBasis(source.log, write.commitIdx, write.key,
          source.initialState === undefined ? undefined : { initialState: source.initialState });
        if (value.basis.length) write.valueBasis = value.basis;
      }
      stop.contributedKeys = [...new Set(stop.contributedWrites.map(write => write.key))];
    }
    stops.sort((a, b) => b.commitIdx - a.commitIdx);
    const visits = new Map<string, TraceStop[]>();
    for (const stop of stops) {
      const stagePart = stop.runtimeStageId.split("#")[0];
      const group = visits.get(stagePart) ?? [];
      group.push(stop); visits.set(stagePart, group);
    }
    for (const group of visits.values()) if (group.length > 1) group.forEach((stop, index) => { stop.loopPass = group.length - index; });
    return { key, stops, missing: null, inputTermini: [...termini], readsAvailable: projected.readsAvailable,
      truncated: !!(slice.root.truncated?.byDepth || slice.root.truncated?.byNodes), status: "available", note: notes.join(" "), evidence };
  } catch {
    return unavailableTraceWalk(key, "Foottrace could not explain the selected source prefix.");
  }
}

/** Exact contribution value, not the grouped rail's possibly-later memory. */
export function traceContributionPreview(selection: FlowRecordSelection, walk: TraceWalk, stop: TraceStop, key: string): unknown {
  if (!walk.evidence || walk.status !== "available") return undefined;
  const writes = stop.contributedWrites?.filter(row => row.key === key);
  const write = writes?.length === 1 ? writes[0] : undefined;
  if (!write || write.commitIdx >= walk.evidence.beforeCommitIdx) return undefined;
  const source = prepareTracePrefix(selection, walk.evidence.beforeCommitIdx);
  if (source.status !== "available" || source.sourceId !== walk.evidence.sourceId) return undefined;
  try {
    const value = commitValueAtWithBasis(source.log, write.commitIdx, key,
      source.initialState === undefined ? undefined : { initialState: source.initialState });
    // An uncertain value is not presented as an exact numeric/string preview.
    return value.basis.length === 0 ? value.value : undefined;
  } catch { return undefined; }
}

/** Copy story and the card consume the same qualified presentation facts. */
export function formatTraceWalk(walk: TraceWalk, stepNumberOf: (runtimeStageId: string) => number | null): string {
  const lines: string[] = [];
  if (walk.status === "unavailable") return walk.note ?? "Recorded explanation unavailable.";
  if (walk.missing) lines.push(missingTraceText(walk, stepNumberOf));
  else {
    lines.push(`Tracing \`${walk.key}\` — ${walk.stops.length} stops, newest first.`);
    walk.stops.forEach((stop, i) => {
      const step = stepNumberOf(stop.runtimeStageId);
      const pass = stop.loopPass > 0 ? ` (pass ${stop.loopPass})` : "";
      const made = stop.ingredients.length ? ` · recorded ingredients: ${stop.ingredients.map(ing => ing.writerRuntimeStageId
        ? `${ing.key} (← ${ing.writerStageName}${stepNumberOf(ing.writerRuntimeStageId) ? `, step ${stepNumberOf(ing.writerRuntimeStageId)}` : ""}${ing.basis ? "; nested contribution" : ""})`
        : `${ing.key} (${unknownIngredientText})`).join(", ")}` : ` · ${noIngredientsText}`;
      lines.push(`stop ${i + 1}/${walk.stops.length} · ${step ? `step ${step} · ` : ""}${stop.stageName}${pass} recorded changes to \`${stop.contributedKeys.join("`, `")}\`${made}`);
      const positions = contributionPositionText(stop);
      if (positions) lines.push(positions);
      const basis = contributionBasisText(stop);
      if (basis) lines.push(basis);
    });
    if (walk.inputTermini.length) lines.push(`Reads without an earlier recorded writer (origin unknown): ${walk.inputTermini.join(", ")}`);
  }
  if (walk.note) lines.push(walk.note);
  else if (!walk.readsAvailable) lines.push("Read evidence is unknown; dependencies are unknowable, not absent.");
  if (walk.truncated && !walk.evidence?.truncated) lines.push("The recorded explanation is truncated; its earliest displayed stop need not be an origin.");
  return lines.join("\n");
}
