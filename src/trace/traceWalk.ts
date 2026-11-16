/**
 * traceWalk — the SAME-RAIL REWIND walk: a variable-anchored backward slice,
 * linearized in REVERSE COMMIT ORDER so it can be driven by the existing
 * time slider ("◀ earlier cause" stop by stop).
 *
 * THE LOAD-BEARING FACT (why one linear walk can cover a DAG): every
 * dependency was committed strictly EARLIER than the value derived from it,
 * so a backward slice is always a sub-sequence of the run's timeline — and
 * sorting its frames by commitIdx DESCENDING is a valid topological order.
 * One monotone "earlier" button therefore visits EVERY frame, including
 * both parents of a fork, with no branch-choosing UI and no second cursor.
 *
 * FORKS are explained, not navigated: each stop carries its `ingredients`
 * (the read keys + who wrote each), so a 2-parent value shows both chips;
 * "follow one ingredient" is a RE-ANCHORED walk (same function, key = the
 * ingredient, before = this stop) — never a special traversal mode.
 *
 * HONEST ABSENCE, two truthful sentences (they are different facts):
 *   'never-written'   — no commit in the WHOLE log wrote the key. Its
 *                       earlier origin needs separate starting-state evidence.
 *   'not-yet-written' — a later commit writes it, but none at or before
 *                       the cutoff: "not yet" is not "never".
 *
 * Shares the read→write BFS with dataTrace.ts (the causalChain mirror);
 * eui still never imports footprintjs — snapshot SHAPES only.
 */

import { rootMountLabels } from "./traceScope";
import { ownDataField, readOwnArray, WorkBudget } from "./safeRecordRead";
import { snapshotWalkScope } from "./walkScope";
import { buildDataTrace } from "./dataTrace";
import { indexTraceWrites, indexWriterCommits, readPathIsUnambiguous, readTraceWrites, readsForWrittenKey, stageReadKeys, writerBefore, type RecordedTraceWrite } from "./readProvenance";
import { handoffSentence, type SubflowHandoffSource } from "./subflowHandoff";
import { recordedPathLabel } from "./recordedValuePreview";
import {
  scopeSentence,
  START_SENTENCE,
  inputSentence,
  isInvocationStart,
  mountLabel,
} from "./tracePresentation";

/** Explicit, serializable presentation and recording scope. Child ancestry stays unknown. */
export interface TraceWalkScope {
  readonly invocationPath: readonly string[];
  readonly mountLabels?: Readonly<Record<string, string>>;
  readonly readsAvailable?: boolean;
  /** Explicit producer discriminator for canonical per-write read paths. */
  readonly nestedReadTracking?: true;
  /** Recorded non-undefined starting keys, without their values or inferred origin. */
  readonly startKeys?: readonly string[];
}
export interface TraceWalkOptions {
  beforeCommitIdx?: number;
  maxDepth?: number;
  maxFrames?: number;
  scope?: TraceWalkScope;
}
/** One read key of a stop, resolved to the commit that wrote it. */
export interface TraceIngredient {
  key: string;
  /** null = no safely bound prior local writer, including ambiguous legacy paths. */
  writerRuntimeStageId: string | null;
  writerStageName: string | null;
  writerCommitIdx: number | null;
  /** A legacy dotted read cannot be bound safely to a same-labelled write. */
  unresolvedReason?: "ambiguous-read-path";
}

/** One stop on the rewind rail — a slice frame with its rail position. */
export interface TraceStop {
  runtimeStageId: string;
  stageId: string;
  stageName: string;
  /** Position in the commit log — the stop's place on the time rail. */
  commitIdx: number;
  /** The slice keys DOWNSTREAM members read from this stop (what it
   *  contributed to the traced value). The anchor contributes the traced
   *  key itself. */
  contributedKeys: string[];
  keysWritten: string[];
  ingredients: TraceIngredient[];
  /** Exact per-output read prefixes. Older caller-supplied walks may omit it. */
  ingredientsByKey?: Readonly<Record<string, readonly TraceIngredient[]>>;
  /** BFS hop distance from the anchor (tooltip-grade info, NOT the walk
   *  order — the walk order is time). */
  depth: number;
  /** 1-based pass number when the same stage appears more than once in
   *  the walk (loop iterations); 0 = appears once. */
  loopPass: number;
  /** Admitted child targets; their histories remain on their own cursor rail. */
  handoffSources?: readonly SubflowHandoffSource[];
}

export interface TraceWalkMissing {
  reason: "never-written" | "not-yet-written" | "evidence-unavailable";
  /** For 'not-yet-written': where the FIRST write actually happens. */
  firstWriteCommitIdx?: number;
  firstWriterRuntimeStageId?: string;
  firstWriterStageName?: string;
}

export interface TraceWalk {
  /** Detached scope, including root mount labels derived from recorded metadata. */
  readonly scope?: TraceWalkScope;
  key: string;
  /** Stops in WALK ORDER: commitIdx DESCENDING. stops[0] is the anchor
   *  (the last writer of `key` within the cutoff). */
  stops: TraceStop[];
  /** Non-null ⇒ zero stops: the honest-absence card, not an empty chain. */
  missing: TraceWalkMissing | null;
  /** Read keys with no safely bound local writer, deduped in encounter order.
   * Their earlier origin requires separate starting-state evidence. */
  inputTermini: string[];
  /** False when the snapshot recorded no reads anywhere — the chain is
   *  UNKNOWABLE (not absent) beyond the anchor. */
  readsAvailable: boolean;
  /** True when the underlying slice hit its frame/depth budget — the
   *  earliest stop may not be the true origin. */
  truncated: boolean;
}

/** Duck-typed commit bundle (same stable snapshot shape dataTrace uses). */
interface CommitEntry {
  stage: string;
  stageId: string;
  runtimeStageId: string;
  trace: RecordedTraceWrite[];
}

const DEFAULT_MAX_DEPTH = 10;
const DEFAULT_MAX_FRAMES = 50;

/**
 * Build the rewind walk for `key`.
 *
 * `beforeCommitIdx` (EXCLUSIVE) scopes the question to "the value as it
 * stood before that moment" — it is also how ingredient-following works:
 * follow ingredient K at stop S = buildTraceWalk(K, { beforeCommitIdx:
 * S.commitIdx }) — one function, no traversal modes.
 */
export function buildTraceWalk(
  commitLog: unknown[],
  executionTree: unknown,
  key: string,
  opts?: TraceWalkOptions
): TraceWalk {
  const root =
    opts?.scope === undefined ? rootMountLabels(executionTree) : undefined;
  const inferred =
    root?.availability.ok && root.labels.size > 0
      ? { invocationPath: [], mountLabels: Object.fromEntries(root.labels) }
      : undefined;
  const selectedScope = opts?.scope ?? inferred;
  const scope =
    selectedScope === undefined ? undefined : snapshotWalkScope(selectedScope);
  const scoped = scope === undefined ? {} : { scope };
  let log: CommitEntry[], readsOf: Map<string, string[]>;
  try {
    if (root && !root.availability.ok) throw new Error("Unavailable tree evidence");
    const budget = new WorkBudget();
    log = readOwnArray(commitLog ?? [], budget).map((entry) => ({
      stage: ownDataField(entry, "stage") as string,
      stageId: ownDataField(entry, "stageId") as string,
      runtimeStageId: ownDataField(entry, "runtimeStageId") as string,
      trace: readTraceWrites(ownDataField(entry, "trace"), budget),
    }));
    readsOf = stageReadKeys(executionTree, budget);
  } catch {
    return {
      key,
      stops: [],
      missing: { reason: "evidence-unavailable" },
      inputTermini: [],
      readsAvailable: false,
      truncated: false,
      ...scoped,
    };
  }
  const cutoff = opts?.beforeCommitIdx ?? log.length;
  const maxDepth = opts?.maxDepth ?? DEFAULT_MAX_DEPTH;
  const maxFrames = opts?.maxFrames ?? DEFAULT_MAX_FRAMES;

  const writers = indexWriterCommits(log);
  const writesByKey = log.map(commit => indexTraceWrites(commit.trace));
  const writerOf = (k: string, beforeIdx: number): number => writerBefore(writers, k, Math.min(beforeIdx, log.length));

  // ── Anchor: the last writer of `key` within the cutoff ──
  const anchorIdx = writerOf(key, cutoff);
  if (anchorIdx < 0) {
    // Honest absence — distinguish "never" from "not yet" by checking the
    // FULL log: conflating them would assert a falsehood under a cutoff.
    const firstEver = log.findIndex((c) => c.trace.some((t) => t.path === key));
    const missing: TraceWalkMissing =
      firstEver < 0
        ? { reason: "never-written" }
        : {
            reason: "not-yet-written",
            firstWriteCommitIdx: firstEver,
            firstWriterRuntimeStageId: log[firstEver].runtimeStageId,
            firstWriterStageName: log[firstEver].stage,
          };
    return {
      key,
      stops: [],
      missing,
      inputTermini: [],
      readsAvailable: scope?.readsAvailable ?? true,
      truncated: false,
      ...scoped,
    };
  }

  // ── Slice: reuse the shared read→write BFS, anchored at the writer.
  // Truncation detection: ask for one frame beyond the budget — if it comes
  // back full we know the budget bit (buildDataTrace stops AT maxFrames).
  const slice = buildDataTrace(
    log.slice(0, anchorIdx + 1),
    executionTree,
    log[anchorIdx].runtimeStageId,
    maxDepth,
    maxFrames + 1,
    key,
    { nestedReadTracking: scope?.nestedReadTracking },
  );
  const truncated = slice.frames.length > maxFrames;
  const frames = truncated ? slice.frames.slice(0, maxFrames) : slice.frames;

  // ── Per-output ingredients, then their visit-level presentation union ──
  const stops: TraceStop[] = frames.map(frame => ({
    runtimeStageId: frame.runtimeStageId, stageId: frame.stageId, stageName: frame.stageName,
    commitIdx: frame.commitIdx!, keysWritten: frame.keysWritten,
    contributedKeys: [], ingredients: [], depth: frame.depth, loopPass: 0,
  }));
  const stopAt = new Map(stops.map(stop => [stop.commitIdx, stop]));
  const outputs = new Map<number, Map<string, TraceIngredient[]>>();
  const legacyInputs = new Map<number, TraceIngredient[]>();
  const questions: Array<[number, string]> = [[anchorIdx, key]];
  for (let cursor = 0; cursor < questions.length; cursor++) {
    const [commitIdx, writtenKey] = questions[cursor];
    const stop = stopAt.get(commitIdx);
    if (!stop) continue; // A known writer beyond the slice remains a boundary.
    let byKey = outputs.get(commitIdx);
    if (!byKey) { byKey = new Map(); outputs.set(commitIdx, byKey); }
    if (byKey.has(writtenKey)) continue;
    const writes = writesByKey[commitIdx];
    const stageReads = readsOf.get(stop.runtimeStageId) ?? [];
    const resolve = (readKey: string): TraceIngredient => {
      if (!readPathIsUnambiguous(readKey, writes, stageReads, writtenKey, scope?.nestedReadTracking === true)) {
        return { key: readKey, writerRuntimeStageId: null, writerStageName: null,
          writerCommitIdx: null, unresolvedReason: "ambiguous-read-path" };
      }
      const writer = writerOf(readKey, commitIdx);
      return { key: readKey, writerRuntimeStageId: writer >= 0 ? log[writer].runtimeStageId : null,
        writerStageName: writer >= 0 ? log[writer].stage : null, writerCommitIdx: writer >= 0 ? writer : null };
    };
    const legacy = writes.get(writtenKey)?.readKeys === undefined;
    let ingredients = legacy ? legacyInputs.get(commitIdx) : undefined;
    if (!ingredients) {
      ingredients = readsForWrittenKey(writes, stageReads, writtenKey).map(resolve);
      if (legacy) legacyInputs.set(commitIdx, ingredients);
    }
    byKey.set(writtenKey, ingredients);
    for (const ingredient of ingredients) {
      if (ingredient.writerCommitIdx !== null && stopAt.has(ingredient.writerCommitIdx))
        questions.push([ingredient.writerCommitIdx, ingredient.key]);
    }
  }
  const inputTermini: string[] = [];
  const terminiSeen = new Set<string>();
  for (const stop of stops) {
    const byKey = outputs.get(stop.commitIdx) ?? new Map<string, TraceIngredient[]>();
    stop.contributedKeys = [...byKey.keys()];
    stop.ingredientsByKey = Object.fromEntries(byKey);
    const seen = new Set<string>();
    for (const ingredients of byKey.values()) for (const ingredient of ingredients) {
      const identity = JSON.stringify([ingredient.key, ingredient.writerCommitIdx, ingredient.unresolvedReason ?? null]);
      if (seen.has(identity)) continue;
      seen.add(identity); stop.ingredients.push(ingredient);
      if (ingredient.writerCommitIdx === null && !terminiSeen.has(ingredient.key)) {
        terminiSeen.add(ingredient.key); inputTermini.push(ingredient.key);
      }
    }
  }

  // ── Walk order: reverse time (the topological linearization) ──
  stops.sort((a, b) => b.commitIdx - a.commitIdx);

  // Loop passes: when one STAGE appears at several iterations, number them
  // in time order ("pass 1", "pass 2") so the card can say which visit.
  const byStagePart = new Map<string, TraceStop[]>();
  for (const s of stops) {
    const part = s.runtimeStageId.split("#")[0];
    const arr = byStagePart.get(part) ?? [];
    arr.push(s);
    byStagePart.set(part, arr);
  }
  for (const arr of byStagePart.values()) {
    if (arr.length < 2) continue;
    // arr is in reverse time; pass numbers count forward in time.
    for (let i = 0; i < arr.length; i++) arr[i].loopPass = arr.length - i;
  }

  return {
    key,
    stops,
    missing: null,
    inputTermini,
    readsAvailable: scope?.readsAvailable ?? slice.readsAvailable,
    truncated,
    ...scoped,
  };
}

/**
 * formatTraceWalk — THE parity artifact: the [Copy story] button and any
 * LLM backtrack tool emit THIS string, so the human's board and the
 * agent's answer are the same text, not two translations.
 *
 * `stepNumberOf` maps a runtimeStageId to the 1-based step number shown on
 * the rail (null = not on the rail); walk order and wording match the
 * stop cards exactly.
 */
export function formatTraceWalk(
  walk: TraceWalk,
  stepNumberOf: (runtimeStageId: string) => number | null,
  options?: { scope?: TraceWalkScope }
): string {
  const selectedScope = options?.scope ?? walk.scope;
  const presentation =
    selectedScope === undefined ? undefined : snapshotWalkScope(selectedScope);
  const readsAvailable = presentation?.readsAvailable ?? walk.readsAvailable;
  const scope = scopeSentence(presentation);
  const lines: string[] = scope ? [scope] : [];
  if (walk.missing) {
    if (walk.missing.reason === "evidence-unavailable") {
      lines.push(`\`${recordedPathLabel(walk.key)}\`: write evidence is unavailable; value origin unknown.`);
    } else if (walk.missing.reason === "never-written") {
      lines.push(`\`${recordedPathLabel(walk.key)}\`: ${inputSentence(presentation, walk.key)}.`);
    } else {
      const at = walk.missing.firstWriterRuntimeStageId
        ? stepNumberOf(walk.missing.firstWriterRuntimeStageId)
        : null;
      lines.push(
        `\`${recordedPathLabel(walk.key)}\` has not been written yet at this moment — its first write happens later` +
          (walk.missing.firstWriterStageName
            ? `, at ${walk.missing.firstWriterStageName}${
                at ? ` (step ${at})` : ""
              }.`
            : ".")
      );
    }
    return lines.join("\n");
  }

  lines.push(
    `Tracing \`${recordedPathLabel(walk.key)}\` — ${walk.stops.length} stops, newest first.`
  );
  walk.stops.forEach((stop, i) => {
    const step = stepNumberOf(stop.runtimeStageId);
    const pass = stop.loopPass > 0 ? ` (pass ${stop.loopPass})` : "";
    const boundary = mountLabel(presentation, stop.runtimeStageId);
    const readEvidence = isInvocationStart(presentation, stop.runtimeStageId)
      ? ` · ${START_SENTENCE}`
      : boundary
      ? ` · subflow boundary: ${boundary}; drill in to inspect its local record`
      : stop.ingredients.length > 0
      ? ` · recorded state reads: ${stop.ingredients
          .map((ing) =>
            ing.writerRuntimeStageId
              ? `${recordedPathLabel(ing.key)} (← ${ing.writerStageName}${
                  stepNumberOf(ing.writerRuntimeStageId)
                    ? `, step ${stepNumberOf(ing.writerRuntimeStageId)}`
                    : ""
                })`
              : `${recordedPathLabel(ing.key)} (${inputSentence(presentation, ing.key, ing.unresolvedReason)})`
          )
          .join(", ")}`
      : readsAvailable
      ? " · No recorded state reads"
      : "";
    lines.push(
      `stop ${i + 1}/${walk.stops.length} · ${step ? `step ${step} · ` : ""}${
        stop.stageName
      }${pass} wrote \`${stop.contributedKeys.map(recordedPathLabel).join("`, `")}\`${readEvidence}`
    );
    if (stop.handoffSources?.length) lines.push(handoffSentence(stop.handoffSources));
  });
  if (walk.inputTermini.length > 0) {
    const ambiguous = new Set(walk.stops.flatMap(stop => stop.ingredients.filter(input => input.unresolvedReason).map(input => input.key)));
    lines.push(`${ambiguous.size ? "Unresolved reads" : "No local writer"}: ${walk.inputTermini.map(key => `${recordedPathLabel(key)} (${inputSentence(presentation, key, ambiguous.has(key) ? "ambiguous-read-path" : undefined)})`).join(", ")}`);
  }
  if (!readsAvailable) {
    lines.push(
      "⚠ reads were not recorded — dependencies are unknowable, not absent."
    );
  }
  if (walk.truncated) {
    lines.push(
      "⚠ trace limited by its frame or depth budget — earlier recorded state reads may be missing."
    );
  }
  return lines.join("\n");
}
