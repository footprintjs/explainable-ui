import type { StageSnapshot, NarrativeEntry } from "../types";
import { createRecordStateReader } from "./recordState";

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
  initialState?: Record<string, unknown>;
  executionTree: RuntimeStageSnapshot;
  commitLog?: unknown[];
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
// Standalone compatibility helper — not used for recorded-state replay.
// ─────────────────────────────────────────────────────────────────────────────
//
// Existing callers retain this patch utility's original semantics. Recorded
// state is instead interpreted by Foottrace through createRecordStateReader.

/** Keys that must never be assigned via bracket-write on a plain object —
 *  `obj['__proto__'] = x` mutates the prototype, not an own property. */
const UNSAFE_KEYS = new Set(["__proto__", "constructor", "prototype"]);

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
 * Deep-merges a caller-owned PATCH into a base value. This retained public
 * utility is not a record reader; its array policy differs from Foottrace.
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

  // No presentation tree means no stage rows to display, not proof that the
  // execution or its record was empty.
  if (runtime?.executionTree === null || typeof runtime?.executionTree !== 'object') return [];

  // Extract per-stage timings from MetricRecorder if present in snapshot.recorders.
  const stageTimings = extractStageTimings(runtime.recorders);

  const readState = createRecordStateReader({
    sourceId: "flow:root",
    format: "snapshot",
    record: runtime,
    reads: { status: "unknown" },
  });

  const snapshots: StageSnapshot[] = [];
  flattenTree(runtime.executionTree, snapshots, 0, runtime.subflowResults, stageNarrativeMap, stageTimings, readState);
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
  accumulatedMs: number = 0,
  subflowResults?: Record<string, unknown>,
  stageNarrativeMap: Map<string, string[]> = new Map(),
  stageTimings: StageTimings = { byRuntimeStageId: new Map(), byStageName: new Map() },
  readState: ReturnType<typeof createRecordStateReader> = () => ({
    status: "unavailable", sourceId: "flow:unselected", reason: "unsupported-source", message: "No recorded source was supplied.",
  }),
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

  // Tree order controls presentation only. State comes from this execution's
  // exact source-local canonical stop, not its parent or a prior tree row.
  const recordState = readState(node.runtimeStageId);
  const memory = recordState.status === "available" ? recordState.current.state : {};

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
    recordState,
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
      const childEnd = flattenTree(child, out, nextMs, subflowResults, stageNarrativeMap, stageTimings, readState);
      maxChildEnd = Math.max(maxChildEnd, childEnd);
    }
    nextMs = maxChildEnd;
  }

  // Handle linear continuation
  if (node.next) {
    nextMs = flattenTree(node.next, out, nextMs, subflowResults, stageNarrativeMap, stageTimings, readState);
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
 * Pass the RUN's `subflowResults` map as the third argument to keep drilling
 * DEEPER: a subflow that mounts another subflow needs its child's result to
 * be attached to the stage that mounts it, and that result lives in the run-
 * level map (footprintjs dual-keys it by both `subflowPath` and
 * `runtimeStageId`, which is what the inner tree's nodes carry). Without it
 * the inner mount's snapshot has no `subflowResult` and the second drill
 * silently does nothing.
 *
 * Returns empty array if the input is not a valid SubflowResult.
 */
export function subflowResultToSnapshots(
  subflowResult: unknown,
  narrativeEntries?: NarrativeEntry[],
  subflowResults?: Record<string, unknown>,
): StageSnapshot[] {
  if (!subflowResult || typeof subflowResult !== 'object') return [];
  const sf = subflowResult as {
    subflowId?: string;
    treeContext?: {
      globalContext?: Record<string, unknown>;
      initialState?: Record<string, unknown>;
      stageContexts?: unknown;
      history?: unknown[];
    };
  };
  if (!sf.treeContext?.stageContexts) return [];

  const readState = createRecordStateReader({
    sourceId: `flow:subtree:${sf.subflowId ?? "selected"}`,
    format: "tree-context",
    record: sf.treeContext,
    reads: { status: "unknown" },
  });
  const snapshots: StageSnapshot[] = [];
  flattenTree(
    sf.treeContext.stageContexts as RuntimeStageSnapshot,
    snapshots,
    0,
    subflowResults,
    narrativeEntries?.length ? buildStageNarrativeMap(narrativeEntries) : new Map(),
    { byRuntimeStageId: new Map(), byStageName: new Map() },
    readState,
  );

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
