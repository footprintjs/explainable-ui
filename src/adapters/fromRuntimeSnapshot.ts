import type { StageSnapshot, NarrativeEntry } from "../types";

/**
 * Shape of FootPrint's RuntimeSnapshot (from FlowChartExecutor.getSnapshot()).
 * We define it here instead of importing to avoid a hard dependency on footprintjs.
 */
interface RuntimeStageSnapshot {
  id: string;
  /** `stageId#executionIndex` — the universal per-execution key. Joins this
   *  tree node to its commit-log bundles for cumulative-memory replay. */
  runtimeStageId?: string;
  name?: string;
  isDecider?: boolean;
  isFork?: boolean;
  /** User-level writes made by this stage (pre-namespace keys → values). */
  stageWrites?: Record<string, unknown>;
  logs: Record<string, unknown>;
  errors: Record<string, unknown>;
  metrics: Record<string, unknown>;
  evals: Record<string, unknown>;
  flowMessages?: unknown[];
  description?: string;
  subflowId?: string;
  next?: RuntimeStageSnapshot;
  children?: RuntimeStageSnapshot[];
}

interface RecorderSnapshot {
  id: string;
  name: string;
  data: unknown;
}

interface RuntimeSnapshot {
  sharedState: Record<string, unknown>;
  executionTree: RuntimeStageSnapshot;
  commitLog: unknown[];
  /** Per-subflow execution results (keyed by subflowId). */
  subflowResults?: Record<string, unknown>;
  /** Snapshots from recorders that implement toSnapshot() (e.g. MetricRecorder). */
  recorders?: RecorderSnapshot[];
}

// NarrativeEntry: canonical definition lives in types.ts.
// Re-export here for backward compatibility (index.ts re-exports as AdapterNarrativeEntry).
export type { NarrativeEntry } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Narrative carried INSIDE the snapshot
// ─────────────────────────────────────────────────────────────────────────────
//
// footprintjs's narrative recorder implements `toSnapshot()`, so a recorded
// run can carry its own story in `snapshot.recorders` — no second
// `getNarrativeEntries()` call, and a FROZEN recording (a saved snapshot, a
// shipped demo) keeps its narrative instead of degrading to the synthetic
// "X executed. Wrote: ..." lines.
//
// DETECTION IS BY SHAPE, NOT BY NAME — deliberately. The recorder's
// snapshot `name` is upstream's choice ('Narrative' today) and the entries
// may sit at `data` or `data.entries`. `readEntries()` below is the ONLY
// place that knows the wire shape: if upstream lands a different envelope
// (say `data.log`), add the accessor there and nothing else changes. The
// name is used solely to BREAK TIES when several recorders look narrative-
// shaped.

/** A narrative entry is recognised by the three fields every renderer needs. */
function looksLikeNarrativeEntry(value: unknown): boolean {
  if (value === null || typeof value !== 'object') return false;
  const e = value as Record<string, unknown>;
  return typeof e.type === 'string' && typeof e.text === 'string' && typeof e.depth === 'number';
}

/** Pulls the entry array out of a recorder snapshot's `data`, whichever
 *  envelope upstream used. Returns undefined when this isn't narrative. */
function readEntries(data: unknown): NarrativeEntry[] | undefined {
  const candidate = Array.isArray(data)
    ? data
    : isPlainRecord(data) && Array.isArray(data.entries)
      ? (data.entries as unknown[])
      : undefined;
  if (!candidate || candidate.length === 0) return undefined;
  return looksLikeNarrativeEntry(candidate[0]) ? (candidate as NarrativeEntry[]) : undefined;
}

/**
 * Finds the narrative recorder inside a runtime snapshot. Returns its id
 * alongside the entries so a UI can avoid ALSO rendering the same recorder
 * as a raw data tab.
 *
 * Not exported from the package barrel — consumers want
 * `narrativeFromSnapshot`; the shell wants the id too.
 */
export function narrativeRecorderFromSnapshot(
  runtime: unknown,
): { id: string; entries: NarrativeEntry[] } | undefined {
  const recorders = isPlainRecord(runtime) ? runtime.recorders : undefined;
  if (!Array.isArray(recorders)) return undefined;
  let firstMatch: { id: string; entries: NarrativeEntry[] } | undefined;
  for (const rec of recorders) {
    if (!isPlainRecord(rec)) continue;
    const entries = readEntries(rec.data);
    if (!entries) continue;
    const match = { id: typeof rec.id === 'string' ? rec.id : '', entries };
    const name = typeof rec.name === 'string' ? rec.name : '';
    if (/narrative|story/i.test(name)) return match; // named match wins outright
    firstMatch ??= match;
  }
  return firstMatch;
}

/**
 * Reads the execution narrative a recorded run carries with it.
 *
 * Use when you have a snapshot but no live executor to call
 * `getNarrativeEntries()` on:
 * ```ts
 * <ExplainableShell runtimeSnapshot={snapshot}
 *                   narrativeEntries={narrativeFromSnapshot(snapshot)} />
 * ```
 * (`<ExplainableShell>` already does this for you — pass the prop only to
 * override.) Returns `undefined` when the run was recorded without a
 * narrative recorder: absent narrative stays absent, never invented.
 */
export function narrativeFromSnapshot(runtime: unknown): NarrativeEntry[] | undefined {
  return narrativeRecorderFromSnapshot(runtime)?.entries;
}

// ─────────────────────────────────────────────────────────────────────────────
// Cumulative-memory accumulation — commit-bundle replay + deep patch merge
// ─────────────────────────────────────────────────────────────────────────────
//
// Why whole-key overwrite of `stageWrites` is NOT enough: footprintjs's
// change-only commit semantics record a deep write (`scope.applicant.address
// .zip = ...`) as a net-change PATCH (`{applicant: {address: {zip}}}`), and
// `StageSnapshot.stageWrites` keeps only the LAST write per key — so a
// set-then-deep-write stage surfaces only the patch and the per-stage memory
// view dropped sibling fields (`applicant.name`) that the engine's
// `sharedState` correctly holds.
//
// The faithful source is `RuntimeSnapshot.commitLog`: each `CommitBundle`
// carries the stage's `overwrite` (full values for `set` paths), `updates`
// (accumulated deltas for `merge` paths), and the ordered `trace`
// (`[{path, verb}]`) — the same triple footprintjs's own `applySmartMerge`
// replays onto live state. We mirror that replay onto the cumulative memory
// view, keyed by `runtimeStageId` (tree node ↔ commit bundle join). When no
// bundle is available (older snapshots, subflow drill-down histories with
// empty runtimeStageIds), we fall back to `stageWrites` accumulation,
// upgraded from whole-key overwrite to `mergeWritePatch` so patches no
// longer erase siblings.

/** Path delimiter used by footprintjs's commit `trace` entries
 *  (`normalisePath` joins segments with U+001F UNIT SEPARATOR). */
const COMMIT_PATH_DELIM = "\u001F";

/** Keys that must never be assigned via bracket-write on a plain object —
 *  `obj['__proto__'] = x` mutates the prototype, not an own property. */
const UNSAFE_KEYS = new Set(["__proto__", "constructor", "prototype"]);

/** Duck-typed slice of footprintjs's `CommitBundle` the replay consumes. */
interface CommitBundleLike {
  runtimeStageId?: string;
  overwrite?: Record<string, unknown>;
  updates?: Record<string, unknown>;
  trace?: { path: string; verb: string }[];
}

/** `__writeSummary` / `__readSummary` marker objects (footprintjs's
 *  `writeTracking: 'summary'` dial) are ATOMIC placeholders, not data —
 *  the merge passes them through and never recurses into them. */
function isSummaryMarker(value: unknown): boolean {
  return (
    value !== null &&
    typeof value === "object" &&
    ((value as Record<string, unknown>).__writeSummary === true ||
      (value as Record<string, unknown>).__readSummary === true)
  );
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Deep-merges a net-change write PATCH into a base value for the
 * cumulative-memory VIEW — the visualization-side mirror of footprintjs's
 * `deepSmartMerge` (the `merge`-verb arm of `applySmartMerge`).
 *
 * Semantics:
 *   - plain objects: object-spread per level — patch keys win, base
 *     siblings survive (the gap this helper closes)
 *   - **arrays: REPLACE, not union-merge.** Deliberate divergence from
 *     footprintjs's `deepSmartMerge` (which unions non-empty arrays with
 *     reference-equality dedup). A memory VIEW should show the array a
 *     consumer would read at that moment: the dominant array-write path
 *     (TypedScope copy-on-write push / `$batchArray`) commits as a `set`
 *     of the full final array anyway, and union-replay of the rare
 *     `merge`-verb array delta can fabricate element mixes (reference
 *     dedup never dedupes deep-equal objects) that the display has no
 *     way to reconcile. Replace is predictable and loses nothing the
 *     patch didn't carry.
 *   - summary markers (`__writeSummary`/`__readSummary`): atomic — a marker
 *     patch replaces the key wholesale, and nothing merges INTO a marker
 *   - primitives / null / type mismatches: patch wins
 *
 * Pure: never mutates `base` or `patch`; merged branches are fresh objects.
 */
export function mergeWritePatch(base: unknown, patch: unknown): unknown {
  if (isSummaryMarker(patch)) return patch;
  if (patch === null || typeof patch !== "object") return patch;
  if (Array.isArray(patch)) return patch; // arrays REPLACE (see JSDoc)
  if (isSummaryMarker(base) || !isPlainRecord(base)) {
    // Nothing mergeable underneath — take the patch (fresh copy so later
    // in-place view writes never reach the caller's object).
    base = {};
  }
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [key, value] of Object.entries(patch)) {
    if (UNSAFE_KEYS.has(key)) continue;
    out[key] = mergeWritePatch(out[key], value);
  }
  return out;
}

/** Reads a delimited commit path out of a patch object. Undefined-safe. */
function getPath(root: unknown, segs: string[]): unknown {
  let cur: unknown = root;
  for (const seg of segs) {
    if (!isPlainRecord(cur) && !Array.isArray(cur)) return undefined;
    cur = (cur as Record<string, unknown>)[seg];
  }
  return cur;
}

/**
 * Writes `value` at a delimited commit path, copy-on-write along the way:
 * every container on the path is cloned before mutation so sibling stage
 * snapshots (which share nested refs via the per-stage shallow copy) are
 * never retroactively edited.
 */
function setPath(memory: Record<string, unknown>, segs: string[], value: unknown): void {
  if (segs.some((s) => UNSAFE_KEYS.has(s))) return;
  let obj: Record<string, unknown> = memory;
  for (let i = 0; i < segs.length - 1; i++) {
    const cur = obj[segs[i]!];
    const next: Record<string, unknown> = Array.isArray(cur)
      ? (cur.slice() as unknown as Record<string, unknown>)
      : isPlainRecord(cur) && !isSummaryMarker(cur)
        ? { ...cur }
        : {};
    obj[segs[i]!] = next;
    obj = next;
  }
  const last = segs[segs.length - 1]!;
  if (value === undefined) {
    delete obj[last];
  } else {
    obj[last] = value;
  }
}

/**
 * Replays one commit bundle onto the cumulative memory view — mirrors
 * footprintjs's `applySmartMerge` verb arms:
 *   - `set`    → overwrite with the full final value from `overwrite[path]`
 *                (`undefined` = the historical delete-flattened-to-set —
 *                removes the key)
 *   - `merge`  → `mergeWritePatch` the accumulated `updates[path]` delta in
 *   - `append` → concat the recorded tail onto the current array; degrade
 *                to a direct set when either side isn't an array (matches
 *                upstream's redaction/corrupt-base behavior)
 *   - `delete` → remove the key
 * Bundles without a `trace` (older engines) degrade to: apply every
 * `overwrite` key as a set, then deep-merge every `updates` key.
 */
function applyCommitBundle(memory: Record<string, unknown>, bundle: CommitBundleLike): void {
  const trace = Array.isArray(bundle.trace) ? bundle.trace : undefined;
  if (trace) {
    for (const op of trace) {
      if (!op || typeof op.path !== "string") continue;
      const segs = op.path.split(COMMIT_PATH_DELIM);
      if (op.verb === "merge") {
        setPath(memory, segs, mergeWritePatch(getPath(memory, segs), getPath(bundle.updates, segs)));
      } else if (op.verb === "append") {
        const tail = getPath(bundle.overwrite, segs);
        const current = getPath(memory, segs);
        setPath(memory, segs, Array.isArray(current) && Array.isArray(tail) ? [...current, ...tail] : tail);
      } else if (op.verb === "delete") {
        setPath(memory, segs, undefined);
      } else {
        // 'set' (and unknown verbs — treat as the terminal overwrite)
        setPath(memory, segs, getPath(bundle.overwrite, segs));
      }
    }
    return;
  }
  if (isPlainRecord(bundle.overwrite)) {
    for (const [key, value] of Object.entries(bundle.overwrite)) setPath(memory, [key], value);
  }
  if (isPlainRecord(bundle.updates)) {
    for (const [key, value] of Object.entries(bundle.updates)) {
      setPath(memory, [key], mergeWritePatch(memory[key], value));
    }
  }
}

/**
 * Indexes commit bundles by `runtimeStageId`. A stage execution can emit
 * MORE than one bundle (e.g. a subflow mount commits the outputMapper
 * result, then an empty boundary bundle) — all are kept, in log order.
 * Entries without a non-empty `runtimeStageId` (subflow drill-down
 * histories) are skipped; those trees fall back to `stageWrites`.
 */
function indexCommitLog(commitLog: unknown[] | undefined): Map<string, CommitBundleLike[]> {
  const index = new Map<string, CommitBundleLike[]>();
  if (!Array.isArray(commitLog)) return index;
  for (const entry of commitLog) {
    if (!isPlainRecord(entry)) continue;
    const bundle = entry as CommitBundleLike;
    if (typeof bundle.runtimeStageId !== "string" || bundle.runtimeStageId.length === 0) continue;
    if (!isPlainRecord(bundle.overwrite) && !isPlainRecord(bundle.updates) && !Array.isArray(bundle.trace)) {
      continue;
    }
    const list = index.get(bundle.runtimeStageId);
    if (list) list.push(bundle);
    else index.set(bundle.runtimeStageId, [bundle]);
  }
  return index;
}

/**
 * Converts a FootPrint RuntimeSnapshot into a flat array of StageSnapshots
 * suitable for visualization components.
 *
 * The `narrativeEntries` parameter (from `executor.getNarrativeEntries()`)
 * distributes the library's rich combined narrative per-stage. Omit it and
 * the narrative the snapshot carries itself (`snapshot.recorders`) is used
 * instead — so a replayed recording reads like the live run did.
 * When narrative is not enabled at all, stages get a basic line built from
 * the stage's own name/description/writes — this adapter reflects what the
 * library produces, nothing more.
 *
 * Usage:
 * ```ts
 * const executor = new FlowChartExecutor(chart);
 * await executor.run();
 * const snapshots = toVisualizationSnapshots(
 *   executor.getSnapshot(),
 *   executor.getNarrativeEntries(),
 * );
 * ```
 */
export function toVisualizationSnapshots(
  runtime: RuntimeSnapshot,
  narrativeEntries?: NarrativeEntry[],
): StageSnapshot[] {
  // Caller's entries win; a snapshot that recorded its own narrative is the
  // fallback (frozen recordings have no executor left to ask).
  const entries = narrativeEntries?.length ? narrativeEntries : narrativeFromSnapshot(runtime);
  const stageNarrativeMap = entries?.length
    ? buildStageNarrativeMap(entries)
    : new Map<string, string[]>();

  // No execution tree, no stages. A snapshot taken before `run()` finished
  // (or one whose tree was dropped in transit) is an EMPTY run, not a crash —
  // viewers show their empty state and name the missing piece.
  if (runtime?.executionTree === null || typeof runtime?.executionTree !== 'object') return [];

  // Extract per-stage timings from MetricRecorder if present in snapshot.recorders.
  const stageTimings = extractStageTimings(runtime.recorders);

  // Commit-bundle index for faithful cumulative-memory replay (see the
  // accumulation rationale above). Empty map when the snapshot carries no
  // usable commitLog — stages then fall back to stageWrites accumulation.
  const commitIndex = indexCommitLog(runtime.commitLog);

  const snapshots: StageSnapshot[] = [];
  flattenTree(runtime.executionTree, snapshots, runtime.sharedState, 0, runtime.subflowResults, {}, stageNarrativeMap, stageTimings, commitIndex);
  return snapshots;
}

/**
 * Per-execution durations read out of a run's recorder snapshots.
 *
 * Keyed by `runtimeStageId` — the id that is UNIQUE per execution
 * (`[subflowPath/]stageId#executionIndex`). Keying by stage name instead
 * made a 3-iteration loop report the same number on all three rows: the
 * three 10ms passes were summed to 30ms and every row read "30ms", which
 * looks like three slow iterations rather than three fast ones.
 *
 * `byStageName` exists only for the LEGACY `data.stages` shape, which
 * aggregates per name and genuinely has no per-execution key.
 */
interface StageTimings {
  /** duration in ms, per execution. */
  byRuntimeStageId: Map<string, number>;
  /** duration in ms, per stage name — legacy snapshots only. */
  byStageName: Map<string, number>;
}

/**
 * The current shape: `data.steps[runtimeStageId] = { stageName, duration, … }`.
 * Recognised by SHAPE, not by recorder name (see `looksLikeNarrativeEntry`
 * for the same rule on the narrative channel): a renamed metrics recorder,
 * a custom timing recorder, or an agent framework's own wrapper all feed the
 * Gantt as long as they publish per-step durations. Matching `name ===
 * 'Metrics'` meant one rename silently dropped every duration and the chart
 * degraded to "no timing recorded" while the data sat right there.
 */
function readStepDurations(data: unknown): Record<string, { stageName?: string; duration?: number }> | undefined {
  if (!isPlainRecord(data)) return undefined;
  const steps = data.steps;
  if (!isPlainRecord(steps)) return undefined;
  const first = Object.values(steps)[0];
  if (!isPlainRecord(first) || typeof first.duration !== 'number') return undefined;
  return steps as Record<string, { stageName?: string; duration?: number }>;
}

/** The legacy shape: `data.stages[stageName].totalDuration`. */
function readAggregateDurations(data: unknown): Record<string, { totalDuration?: number }> | undefined {
  if (!isPlainRecord(data)) return undefined;
  const stages = data.stages;
  if (!isPlainRecord(stages)) return undefined;
  const first = Object.values(stages)[0];
  if (!isPlainRecord(first) || typeof first.totalDuration !== 'number') return undefined;
  return stages as Record<string, { totalDuration?: number }>;
}

function extractStageTimings(recorders?: RecorderSnapshot[]): StageTimings {
  const byRuntimeStageId = new Map<string, number>();
  const byStageName = new Map<string, number>();
  if (!recorders) return { byRuntimeStageId, byStageName };
  for (const rec of recorders) {
    const steps = readStepDurations(rec?.data);
    if (steps) {
      for (const [runtimeStageId, step] of Object.entries(steps)) {
        const d = step?.duration;
        // One entry per execution — never summed. Two recorders reporting the
        // same execution would be the same number twice, so first wins.
        if (typeof d !== 'number' || d <= 0 || byRuntimeStageId.has(runtimeStageId)) continue;
        byRuntimeStageId.set(runtimeStageId, Math.round(d));
      }
    }
    const stages = readAggregateDurations(rec?.data);
    if (stages) {
      for (const [stageName, metrics] of Object.entries(stages)) {
        if (typeof metrics.totalDuration === 'number' && metrics.totalDuration > 0) {
          byStageName.set(stageName, Math.round(metrics.totalDuration));
        }
      }
    }
  }
  return { byRuntimeStageId, byStageName };
}

/**
 * Groups narrative entries by stage name, preserving non-stage entries
 * (conditions, forks) attached to the preceding stage.
 */
function buildStageNarrativeMap(entries: NarrativeEntry[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  let currentStageName: string | undefined;

  for (const entry of entries) {
    if (entry.stageName) {
      currentStageName = entry.stageName;
    }

    if (currentStageName) {
      if (!map.has(currentStageName)) {
        map.set(currentStageName, []);
      }
      const indent = '  '.repeat(entry.depth);
      map.get(currentStageName)!.push(`${indent}${entry.text}`);
    }
  }


  return map;
}

function flattenTree(
  node: RuntimeStageSnapshot,
  out: StageSnapshot[],
  sharedState: Record<string, unknown>,
  accumulatedMs: number = 0,
  subflowResults?: Record<string, unknown>,
  cumulativeMemory: Record<string, unknown> = {},
  stageNarrativeMap: Map<string, string[]> = new Map(),
  stageTimings: StageTimings = { byRuntimeStageId: new Map(), byStageName: new Map() },
  commitIndex: Map<string, CommitBundleLike[]> = new Map(),
): number {
  // Prefer the timing recorded for THIS execution (a loop's 2nd pass is its
  // own row), then the legacy per-name aggregate, then scope.$metric, then 0.
  const stageName = node.name ?? node.id;
  const durationMs =
    (node.runtimeStageId ? stageTimings.byRuntimeStageId.get(node.runtimeStageId) : undefined) ??
    (stageName ? stageTimings.byStageName.get(stageName) : undefined) ??
    (typeof node.metrics?.durationMs === "number" ? node.metrics.durationMs : 0);

  const startMs = accumulatedMs;
  // Use id for matching (stable, matches spec node ids).
  // name may carry display prefixes like "[service-name] STAGE".
  const stageId = node.id || node.name || 'unknown';
  const displayName = node.name || node.id || 'unknown';

  // Narrative comes from the library. When not available (e.g. subflow internals
  // where the root recorder only captures enter/exit markers), build a basic
  // narrative from the stage name, description, and data operations.
  // Try id first, then name — narrative entries use node.name (may be prefixed)
  // while snapshot uses node.id (stable). Both need to match for subflows.
  const stageLines = stageNarrativeMap.get(stageId) ?? stageNarrativeMap.get(displayName);
  let narrative: string;
  if (stageLines) {
    narrative = stageLines.join('\n');
  } else {
    const parts: string[] = [`${displayName} executed.`];
    if (node.description) parts.push(node.description);
    if (node.stageWrites) {
      const keys = Object.keys(node.stageWrites);
      if (keys.length > 0) parts.push(`Wrote: ${keys.join(', ')}`);
    }
    narrative = parts.join('\n');
  }

  // Build cumulative memory. Preferred source: this execution's commit
  // bundles (replayed with engine verb semantics — set/merge/append/delete —
  // so deep-write patches keep sibling fields, exactly like the engine's
  // sharedState). Fallback: stageWrites, deep-merged via mergeWritePatch
  // (whole-key overwrite would erase siblings on net-change patches).
  const memory = { ...cumulativeMemory };
  const bundles = node.runtimeStageId ? commitIndex.get(node.runtimeStageId) : undefined;
  if (bundles && bundles.length > 0) {
    for (const bundle of bundles) applyCommitBundle(memory, bundle);
  } else if (node.stageWrites) {
    for (const [key, value] of Object.entries(node.stageWrites)) {
      if (UNSAFE_KEYS.has(key)) continue;
      if (value === undefined) {
        delete memory[key];
      } else {
        memory[key] = mergeWritePatch(memory[key], value);
      }
    }
  }

  // Prefer the per-iteration result keyed by this node's UNIQUE runtimeStageId, falling back to
  // the subflow PATH key. A LOOPING subflow re-enters with the same `subflowId`, so the path key
  // holds only the LAST iteration — keying by `runtimeStageId` gives THIS iteration's drill-down
  // (footprintjs dual-keys subflowResults; see docs/design/subflow-commit-visibility.md). The
  // fallback keeps non-looping subflows and older snapshots working unchanged.
  const sfResult =
    (node.runtimeStageId ? subflowResults?.[node.runtimeStageId] : undefined) ??
    subflowResults?.[node.subflowId ?? stageId];

  out.push({
    stageName: displayName,
    stageLabel: stageId,
    runtimeStageId: node.runtimeStageId ?? undefined,
    memory,
    narrative,
    startMs,
    durationMs,
    status: "done",
    ...(node.description ? { description: node.description } : undefined),
    ...(node.subflowId ? { subflowId: node.subflowId } : undefined),
    ...(sfResult ? { subflowResult: sfResult } : undefined),
  });

  let nextMs = startMs + durationMs;

  // Handle parallel children (fork)
  if (node.children && node.children.length > 0) {
    let maxChildEnd = nextMs;
    for (const child of node.children) {
      const childEnd = flattenTree(child, out, sharedState, nextMs, subflowResults, memory, stageNarrativeMap, stageTimings, commitIndex);
      maxChildEnd = Math.max(maxChildEnd, childEnd);
    }
    nextMs = maxChildEnd;
  }

  // Handle linear continuation
  if (node.next) {
    nextMs = flattenTree(node.next, out, sharedState, nextMs, subflowResults, memory, stageNarrativeMap, stageTimings, commitIndex);
  }

  return nextMs;
}

/**
 * Converts a footprintjs SubflowResult (stored on StageSnapshot.subflowResult)
 * into visualization snapshots for drill-down views.
 *
 * SubflowResult shape (from footprintjs):
 *   { subflowId, subflowName, treeContext: { globalContext, stageContexts, history }, parentStageId }
 *
 * Returns empty array if the input is not a valid SubflowResult.
 */
export function subflowResultToSnapshots(
  subflowResult: unknown,
  narrativeEntries?: NarrativeEntry[],
): StageSnapshot[] {
  if (!subflowResult || typeof subflowResult !== 'object') return [];
  const sf = subflowResult as {
    subflowId?: string;
    treeContext?: {
      globalContext?: Record<string, unknown>;
      stageContexts?: unknown;
      history?: unknown[];
    };
  };
  if (!sf.treeContext?.stageContexts) return [];

  const runtime: RuntimeSnapshot = {
    sharedState: sf.treeContext.globalContext ?? {},
    executionTree: sf.treeContext.stageContexts as RuntimeStageSnapshot,
    commitLog: sf.treeContext.history ?? [],
  };

  const snapshots = toVisualizationSnapshots(runtime, narrativeEntries);

  // Strip subflow prefix from stage names so they match the spec node names.
  // Runtime names are prefixed (e.g., "analyze/SeedScope") but spec nodes
  // use unprefixed names (e.g., "SeedScope").
  const prefix = sf.subflowId ? `${sf.subflowId}/` : '';
  if (prefix) {
    for (const snap of snapshots) {
      if (snap.stageName.startsWith(prefix)) {
        snap.stageName = snap.stageName.slice(prefix.length);
      }
      if (snap.stageLabel.startsWith(prefix)) {
        snap.stageLabel = snap.stageLabel.slice(prefix.length);
      }
    }
  }

  return snapshots;
}

/**
 * Creates StageSnapshots from simple arrays (when you don't have a RuntimeSnapshot).
 * Useful for testing or custom data sources.
 */
export function createSnapshots(
  stages: Array<{
    name: string;
    label?: string;
    memory?: Record<string, unknown>;
    narrative?: string;
    durationMs?: number;
    description?: string;
    subflowId?: string;
  }>
): StageSnapshot[] {
  let accMs = 0;
  return stages.map((s) => {
    const duration = s.durationMs ?? 1;
    const snap: StageSnapshot = {
      stageName: s.name,
      stageLabel: s.label ?? s.name,
      memory: s.memory ?? {},
      narrative: s.narrative ?? `${s.label ?? s.name} completed.`,
      startMs: accMs,
      durationMs: duration,
      status: "done",
      ...(s.description ? { description: s.description } : undefined),
      ...(s.subflowId ? { subflowId: s.subflowId } : undefined),
    };
    accMs += duration;
    return snap;
  });
}
