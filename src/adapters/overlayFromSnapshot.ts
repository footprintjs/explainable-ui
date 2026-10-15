/**
 * overlayFromSnapshot — the runtime overlay, rebuilt from a FROZEN snapshot.
 *
 * `<TracedFlow>` colours its chart from ONE input: the `RuntimeOverlay`
 * (TracedFlow.tsx → `sliceOverlay`). Until now the only way to get one was
 * to attach `createTraceRuntimeOverlay()` to a LIVE executor — so a
 * consumer replaying a recording (a saved `executor.getSnapshot()`, a
 * shipped demo, a bug report pasted into a viewer) had a rail, a memory
 * panel and a narrative but a dead, uncoloured chart.
 *
 * Nothing about the overlay needs to be live: `snapshot.commitLog` already
 * holds the execution order. Bundles are appended in execution order
 * (`bundle.idx` == array position) and one stage execution can emit MORE
 * than one bundle (a subflow mount commits its outputMapper result, then a
 * boundary bundle), so we dedupe by `runtimeStageId` keeping the FIRST —
 * the same dedupe the live recorder does on `onStageExecuted`.
 *
 * ```ts
 * const snapshot = JSON.parse(await fs.readFile('run.json', 'utf8'));
 * <ExplainableShell
 *   runtimeSnapshot={snapshot}
 *   traceGraph={graph}
 *   runtimeOverlay={overlayFromSnapshot(snapshot)}   // ← chart lights up
 * />
 * ```
 *
 * What it CANNOT know (honest absence — never fabricated)
 * ──────────────────────────────────────────────────────
 *   - **`timestampMs` is 0 on every step.** Commit bundles carry no
 *     wall clock. The field is display-only — `sliceOverlay` and
 *     `<TracedFlow>` never read it — so 0 is the honest value, not a
 *     guess. For real timings attach footprintjs's metrics recorder;
 *     `toVisualizationSnapshots` reads those into `StageSnapshot.durationMs`.
 *   - **`errors` is empty.** The commit log has no error channel; a
 *     failing stage's writes land (footprintjs commits before rethrow)
 *     but the message does not. Error painting needs the live recorder.
 *   - **`running` is false.** A recording is a finished run by definition.
 *   - **Retry attempts come from the execution tree, not the commit log.** A
 *     retried attempt commits nothing (footprintjs discards a failed
 *     attempt's staged writes), so the log cannot know a stage was attempted
 *     more than once. footprintjs >= 10.1 stamps each retried stage's node
 *     with `attemptSummary` (its `count` is the attempts made), so a whole
 *     `executor.getSnapshot()` carries the counts — subflow stages included,
 *     through `subflowResults`. A recording from footprintjs 9.15–10.0 has no
 *     summary: pass its `narrativeEntries`, whose `type: 'retry'` entries
 *     (one per failed attempt) give the same counts. Neither source, and
 *     attempts are absent, not guessed.
 *   - **Subflow-internal steps are absent when the engine isolated them.**
 *     footprintjs keeps deep-subflow commits out of the run-level
 *     commitLog by design, so a recording of a chart with subflows yields
 *     overlay steps for the MOUNT stages, not their internals — the same
 *     stages the snapshot's own rail (`toVisualizationSnapshots`) shows.
 *     A live `createTraceRuntimeOverlay` sees both.
 */

// Type-only import: the overlay SHAPE is owned by the live recorder
// (`createTraceRuntimeOverlay`) and this module must produce exactly it.
// Importing the type — never a value — keeps the root barrel free of any
// component/xyflow reach.
import type {
  RuntimeOverlay,
  RuntimeExecutionStep,
} from "../components/FlowchartView/createTraceRuntimeOverlay";

/** The slice of footprintjs's `CommitBundle` this reader consumes. */
interface CommitBundleLike {
  /** `[subflowPath/]stageId#executionIndex` — the universal key. */
  runtimeStageId?: string;
  /** Display name of the stage that committed (`bundle.stage`). */
  stage?: string;
}

/** Duck-typed input: any object carrying a footprintjs commit log —
 *  a whole `executor.getSnapshot()` or just `{ commitLog }`. */
export interface SnapshotWithCommitLog {
  commitLog?: unknown;
  /** The run's execution tree (`getSnapshot().executionTree`). Read for each
   *  retried stage's `attemptSummary` (footprintjs >= 10.1). */
  executionTree?: unknown;
  /** The subflows' results (`getSnapshot().subflowResults`). Each one's own
   *  tree (`treeContext.stageContexts`) holds its stages' `attemptSummary`. */
  subflowResults?: unknown;
}

/** The slice of footprintjs's `StageSnapshot` (one execution-tree node) the
 *  attempt reader consumes. */
interface StageSnapshotLike {
  runtimeStageId?: unknown;
  attemptSummary?: unknown;
  next?: unknown;
  children?: unknown;
}

/** The slice of a narrative entry this reader consumes — duck-typed so both
 *  footprintjs's `CombinedNarrativeEntry` and this library's `NarrativeEntry`
 *  fit without either side importing the other. */
interface NarrativeEntryLike {
  type?: unknown;
  runtimeStageId?: unknown;
}

export interface OverlayFromSnapshotOptions {
  /**
   * The run's narrative entries — `executor.getNarrativeEntries()`, or a
   * recording's `narrativeEntries`. The retry source for a recording from
   * footprintjs 9.15–10.0, whose tree carries no `attemptSummary`: its
   * narrative keeps one `type: 'retry'` entry per failed attempt. A stage the
   * tree summarises takes the tree's count. Optional: with neither source the
   * overlay carries no attempt facts (honest absence — never a guess).
   */
  readonly narrativeEntries?: readonly NarrativeEntryLike[] | null;
}

/** Strip the `#executionIndex` suffix — the same parse the live recorder
 *  applies to `traversalContext.runtimeStageId`, so both paths key the
 *  chart's nodes identically (path-qualified, leaf never stripped). */
function baseStageIdOf(runtimeStageId: string): string {
  const hashIdx = runtimeStageId.indexOf("#");
  return hashIdx >= 0 ? runtimeStageId.slice(0, hashIdx) : runtimeStageId;
}

/**
 * Builds a `RuntimeOverlay` from a recorded run — the post-hoc twin of
 * `createTraceRuntimeOverlay()`. Pass the result straight to
 * `<TracedFlow overlay={...}>` or `<ExplainableShell runtimeOverlay={...}>`.
 *
 * Returns an empty overlay (no steps) for a missing or empty commit log —
 * an unrecorded run colours nothing, which is the truthful rendering.
 */
export function overlayFromSnapshot(
  snapshot: SnapshotWithCommitLog | null | undefined,
  options: OverlayFromSnapshotOptions = {},
): RuntimeOverlay {
  const commitLog = snapshot?.commitLog;
  const executionOrder: RuntimeExecutionStep[] = [];
  if (Array.isArray(commitLog)) {
    const seen = new Set<string>();
    for (const entry of commitLog) {
      if (entry === null || typeof entry !== "object") continue;
      const bundle = entry as CommitBundleLike;
      const runtimeStageId = bundle.runtimeStageId;
      if (typeof runtimeStageId !== "string" || runtimeStageId.length === 0) continue;
      if (seen.has(runtimeStageId)) continue;
      seen.add(runtimeStageId);
      const stageId = baseStageIdOf(runtimeStageId);
      executionOrder.push({
        runtimeStageId,
        stageId,
        // `bundle.stage` is the stage's display name; fall back to the id
        // rather than inventing a label when an older engine omitted it.
        stageName: typeof bundle.stage === "string" && bundle.stage.length > 0 ? bundle.stage : stageId,
        timestampMs: 0, // see "honest absence" in the module JSDoc
      });
    }
  }
  return {
    executionOrder,
    errors: new Map(),
    running: false,
    retryAttempts: retryAttemptsFrom(snapshot, options.narrativeEntries),
  };
}

/**
 * Attempt counts per runtimeStageId, for the executions that took more than
 * one attempt. The tree's stamped `attemptSummary.count` (footprintjs >= 10.1)
 * wins; the narrative's `retry` entries (9.15–10.0) fill in a stage the tree
 * does not summarise.
 */
function retryAttemptsFrom(
  snapshot: SnapshotWithCommitLog | null | undefined,
  entries: readonly NarrativeEntryLike[] | null | undefined,
): ReadonlyMap<string, number> {
  const attempts = retryAttemptsFromNarrative(entries);
  for (const [runtimeStageId, count] of attemptsFromTrees(snapshot)) attempts.set(runtimeStageId, count);
  return attempts;
}

/**
 * `attemptSummary.count` of every retried node in the run's tree and in each
 * subflow's own tree. A count of 1 is an execution that was never retried, so
 * it is not an entry — the same silence as a run with no policy.
 */
function attemptsFromTrees(snapshot: SnapshotWithCommitLog | null | undefined): Map<string, number> {
  const counts = new Map<string, number>();
  const roots: unknown[] = [snapshot?.executionTree];
  const subflowResults = snapshot?.subflowResults;
  if (subflowResults !== null && typeof subflowResults === "object") {
    for (const result of Object.values(subflowResults as Record<string, unknown>)) {
      const treeContext = isObject(result) ? result.treeContext : undefined;
      roots.push(isObject(treeContext) ? treeContext.stageContexts : undefined);
    }
  }
  // Iterative, with a visited set: a tree is as deep as its run is long, and
  // a hand-built input must not be able to loop the walk.
  const seen = new Set<object>();
  const stack = roots.filter(isObject);
  while (stack.length > 0) {
    const node = stack.pop() as StageSnapshotLike & object;
    if (seen.has(node)) continue;
    seen.add(node);
    const count = isObject(node.attemptSummary) ? node.attemptSummary.count : undefined;
    const runtimeStageId = node.runtimeStageId;
    if (
      typeof count === "number" &&
      Number.isInteger(count) &&
      count > 1 &&
      typeof runtimeStageId === "string" &&
      runtimeStageId.length > 0
    ) {
      counts.set(runtimeStageId, count);
    }
    if (isObject(node.next)) stack.push(node.next);
    if (Array.isArray(node.children)) {
      for (const child of node.children) if (isObject(child)) stack.push(child);
    }
  }
  return counts;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

/**
 * Attempt counts per runtimeStageId, rebuilt from a 9.15–10.0 narrative.
 *
 * The engine writes one `retry` entry per attempt that FAILED and was
 * followed by another — so N retry entries means N+1 attempts were made.
 * That is the same arithmetic the live recorder does on `onStageRetry`
 * (`attempt + 1`), which is why the two paths agree.
 */
function retryAttemptsFromNarrative(
  entries: readonly NarrativeEntryLike[] | null | undefined,
): Map<string, number> {
  const attempts = new Map<string, number>();
  if (!Array.isArray(entries)) return attempts;
  for (const entry of entries) {
    if (entry === null || typeof entry !== "object") continue;
    if (entry.type !== "retry") continue;
    const runtimeStageId = entry.runtimeStageId;
    if (typeof runtimeStageId !== "string" || runtimeStageId.length === 0) continue;
    attempts.set(runtimeStageId, (attempts.get(runtimeStageId) ?? 1) + 1);
  }
  return attempts;
}
