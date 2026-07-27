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
  return { executionOrder, errors: new Map(), running: false };
}
