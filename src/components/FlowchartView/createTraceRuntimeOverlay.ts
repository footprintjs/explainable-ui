/**
 * createTraceRuntimeOverlay — event-driven runtime overlay for `<TracedFlow>`.
 *
 * The runtime twin of `createTraceStructureRecorder` (L7.7). Where the
 * structure recorder accumulates the build-time graph SHAPE from
 * `StructureRecorder` events, this recorder accumulates the runtime
 * EXECUTION STATE (which nodes ran, current active, errors) from
 * `FlowRecorder` events. The two compose into the full time-travel
 * trace UI:
 *
 *   StructureRecorder events  →  TraceGraph (nodes + edges, id-keyed)
 *   FlowRecorder events       →  RuntimeOverlay (per-node state, id-keyed)
 *                                     │
 *                                     ▼
 *                       <TracedFlow graph={...} overlay={...} scrubIndex={i} />
 *
 * **Universal key**: `runtimeStageId = [subflowPath/]stageId#executionIndex`.
 * Loops re-execute the same stageId with bumping executionIndex — the
 * overlay records each execution as a distinct step in `executionOrder`
 * but updates the SAME node-by-id in `doneStageIds` (because the build-
 * time graph has one node per spec — loops re-visit it).
 *
 * Per L7.7 panel guidance: the consumer pattern mirrors recorder error
 * isolation, exposes a pub-sub `subscribe(listener)` + monotonic
 * `version()` for `useSyncExternalStore` integration, and accumulates
 * pure data with zero React coupling.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Local type aliases mirroring footprintjs FlowRecorder
// ─────────────────────────────────────────────────────────────────────────────
//
// Same rationale as traceStructureRecorder.ts: explainable-ui has no
// `footprintjs` dep declared (consumer wires it). We mirror the
// subset of `FlowRecorder` we consume. If footprintjs changes the
// interface, this module's types update in lockstep.

interface TraversalContext {
  readonly runtimeStageId: string;
  readonly iteration?: number;
  readonly runId?: string;
}

interface RuntimeStageExecutedEvent {
  readonly stageName: string;
  readonly stageId?: string;
  /** Discriminator for which kind of stage completed. footprintjs v6+
   *  fires this event uniformly for every stage kind (proposal #003);
   *  consumers route by `stageType` without a chart-spec lookup. */
  readonly stageType: 'linear' | 'decider' | 'fork' | 'selector' | 'subflow-mount';
  readonly traversalContext: TraversalContext;
}

interface RuntimeErrorEvent {
  readonly stageName: string;
  readonly stageId?: string;
  readonly message?: string;
  readonly traversalContext?: TraversalContext;
}

/**
 * One FAILED attempt at a stage that declares a `retry` policy
 * (footprintjs >= 9.15.0). Fires DURING the stage — before that stage's own
 * `onStageExecuted` — and ONLY when another attempt follows: the final
 * failure takes the ordinary `onError` path instead. So `attempt: 2` means
 * attempt 2 failed AND attempt 3 ran.
 */
interface RuntimeStageRetryEvent {
  readonly stageName: string;
  readonly stageId?: string;
  /** Which attempt just FAILED, 1-based. */
  readonly attempt?: number;
  /** Total attempts the policy allows, including the first. */
  readonly maxAttempts?: number;
  readonly delayMs?: number;
  readonly message?: string;
  readonly traversalContext?: TraversalContext;
}

interface RuntimeRunStartEvent {
  readonly traversalContext?: TraversalContext;
}

interface RuntimeRunEndEvent {
  readonly traversalContext?: TraversalContext;
}

/** Minimal FlowRecorder interface mirror — see top-of-file rationale.
 *
 *  As of footprintjs v6 (proposal #003), `onStageExecuted` fires
 *  uniformly for ALL stage kinds — linear / decider / fork / selector
 *  / subflow-mount. The event payload carries a `stageType` field for
 *  consumers that need to route by kind. We no longer need separate
 *  `onDecision` / `onFork` / `onSelected` handlers to track "did this
 *  stage run" — a single `onStageExecuted` handler suffices. */
export interface MinimalFlowRecorder {
  readonly id: string;
  onStageExecuted?(event: RuntimeStageExecutedEvent): void;
  onError?(event: RuntimeErrorEvent): void;
  /** footprintjs >= 9.15.0. Without this hook a retried stage leaves NO mark
   *  on the chart — the whole reason retries were narrative-only before. */
  onStageRetry?(event: RuntimeStageRetryEvent): void;
  onRunStart?(event: RuntimeRunStartEvent): void;
  onRunEnd?(event: RuntimeRunEndEvent): void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Runtime overlay shape
// ─────────────────────────────────────────────────────────────────────────────

/**
 * One entry in the execution timeline. `<TracedFlow>` keys time-travel
 * scrubbing on the index into this array — at index `i`, all entries
 * `0..i-1` are "done", entry `i` is "active".
 */
export interface RuntimeExecutionStep {
  /** `[subflowPath/]stageId#executionIndex` — universal key. */
  readonly runtimeStageId: string;
  /** Base stage id (without `#N`) — matches the `TraceGraph` node id. */
  readonly stageId: string;
  /** Human-readable label (from event.stageName). */
  readonly stageName: string;
  /** When this step recorded, in ms since recorder start. */
  readonly timestampMs: number;
}

export interface RuntimeOverlay {
  /** Ordered execution history — drives time-travel scrubbing. */
  readonly executionOrder: readonly RuntimeExecutionStep[];
  /** Per-base-stageId error message (most-recent wins). */
  readonly errors: ReadonlyMap<string, string>;
  /** True after `onRunStart` until `onRunEnd` — useful for "still running" indicators. */
  readonly running: boolean;
  /**
   * How many times each stage EXECUTION was attempted, keyed by
   * `runtimeStageId` — present only for executions that took more than one
   * attempt (a declared `retry` policy that actually fired).
   *
   * NOT a new axis. footprintjs runs every attempt of a stage under ONE
   * runtimeStageId and commits ONE bundle for it, so a retried stage is one
   * stop on the rail, not three. This map is per-NODE state hanging off that
   * single stop — read it to paint an attempt badge, never to add a step.
   *
   * Optional so an overlay hand-built by a consumer (or produced by an older
   * version of this library) stays type-valid; absent means "nothing known
   * about attempts", which is exactly how a run with no retry policy looks.
   */
  readonly retryAttempts?: ReadonlyMap<string, number>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Handle
// ─────────────────────────────────────────────────────────────────────────────

export interface TraceRuntimeOverlayHandle {
  /** The recorder to attach via `executor.attachFlowRecorder(handle.recorder)`. */
  recorder: MinimalFlowRecorder;
  /** Returns a defensive copy of the current overlay state. */
  getOverlay(): RuntimeOverlay;
  /** Pub-sub: returns unsubscribe. Designed for `useSyncExternalStore`. */
  subscribe(listener: () => void): () => void;
  /** Monotonic version counter — bumps once per overlay-mutating event. */
  version(): number;
  /** Reset for reuse across runs. Does NOT bump version or notify (matches
   *  traceStructureRecorder's reset contract). */
  reset(): void;
  /**
   * Adopt a rebuilt overlay into this handle — the REPLAY path's way to give
   * every consumer of the handle the same truth the live FlowRecorder channel
   * would have fired. Pass `overlayFromSnapshot(snapshot)` after replaying a
   * recording: a frozen run has no traversal, so nothing ever calls the
   * handle's recorder, and without this the chart of a replayed run stays
   * dark. REPLACES the current state (steps, errors, running), bumps
   * `version()` and notifies subscribers, so a UI already mounted re-reads.
   */
  seed(overlay: RuntimeOverlay): void;
}

export interface CreateTraceRuntimeOverlayOptions {
  id?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

import { createNotifier } from "./_internal/notifyChange";

/**
 * Strip `#executionIndex` suffix to get the base stage id.
 *
 * **WARNING (invariant I3)**: use ONLY for DISPLAY. NEVER for matching
 * commitLog stageIds — those use the full path-prefixed id (e.g.,
 * `'sf-a/sf-b/inner'`) as emitted by the engine. Parsing back to the
 * unqualified inner name loses uniqueness across subflow instances.
 */
function parseStageIdFromRuntimeStageId(runtimeStageId: string): string {
  const hashIdx = runtimeStageId.indexOf("#");
  return hashIdx >= 0 ? runtimeStageId.slice(0, hashIdx) : runtimeStageId;
}

// ─────────────────────────────────────────────────────────────────────────────
// Factory
// ─────────────────────────────────────────────────────────────────────────────

export function createTraceRuntimeOverlay(
  options: CreateTraceRuntimeOverlayOptions = {},
): TraceRuntimeOverlayHandle {
  const id = options.id ?? "trace-runtime-overlay";
  const startTime = performance.now();

  let executionOrder: RuntimeExecutionStep[] = [];
  // Defensive dedupe by runtimeStageId — should be moot post-#003
  // since the engine fires `onStageExecuted` exactly once per stage
  // execution, but a future change or a misbehaving recorder upstream
  // could still produce duplicates; keep the set as belt-and-suspenders.
  const recordedRuntimeStageIds = new Set<string>();
  const errors = new Map<string, string>();
  // runtimeStageId → attempts MADE for that one execution. Only ever holds
  // entries > 1: a stage that ran once is the silent default, and writing 1
  // for every stage would put a "×1" fact in front of every renderer.
  const retryAttempts = new Map<string, number>();
  let running = false;
  const notifier = createNotifier("traceRuntimeOverlay");
  const notifyChange = notifier.notify;

  function pushStep(runtimeStageId: string, stageId: string, stageName: string): void {
    if (recordedRuntimeStageIds.has(runtimeStageId)) return;
    recordedRuntimeStageIds.add(runtimeStageId);
    executionOrder.push({
      runtimeStageId,
      stageId,
      stageName,
      timestampMs: performance.now() - startTime,
    });
    notifyChange();
  }

  const recorder: MinimalFlowRecorder = {
    id,
    onRunStart() {
      running = true;
      notifyChange();
    },
    onRunEnd() {
      running = false;
      notifyChange();
    },
    onStageExecuted(event) {
      // footprintjs v6 (#003) fires this for EVERY stage kind —
      // linear / decider / fork / selector / subflow-mount — so
      // we no longer need separate handlers for the branching events.
      const runtimeStageId = event.traversalContext.runtimeStageId;
      const baseStageId = parseStageIdFromRuntimeStageId(runtimeStageId);
      pushStep(runtimeStageId, baseStageId, event.stageName);
    },
    onStageRetry(event) {
      // Fires DURING the stage, so there is no execution step yet — the fact
      // is stored against the runtimeStageId and joined when the step lands
      // (see sliceOverlay). Retries never push a step of their own.
      const runtimeStageId = event.traversalContext?.runtimeStageId;
      if (!runtimeStageId) return;
      const attempt = event.attempt;
      // `attempt` is the attempt that FAILED, and the engine only fires this
      // when another attempt follows — so attempt N failing proves N+1 ran.
      // No usable number (a hand-built or future event) falls back to
      // counting the events themselves, which yields the same total.
      const attemptsMade =
        typeof attempt === "number" && Number.isFinite(attempt) && attempt >= 1
          ? Math.floor(attempt) + 1
          : (retryAttempts.get(runtimeStageId) ?? 1) + 1;
      const known = retryAttempts.get(runtimeStageId) ?? 1;
      if (attemptsMade > known) {
        retryAttempts.set(runtimeStageId, attemptsMade);
        notifyChange();
      }
    },
    onError(event) {
      const fallbackId =
        event.stageId ??
        (event.traversalContext
          ? parseStageIdFromRuntimeStageId(event.traversalContext.runtimeStageId)
          : event.stageName);
      errors.set(fallbackId, event.message ?? "error");
      notifyChange();
    },
  };

  return {
    recorder,
    getOverlay(): RuntimeOverlay {
      return {
        executionOrder: executionOrder.map((s) => ({ ...s })),
        errors: new Map(errors),
        running,
        retryAttempts: new Map(retryAttempts),
      };
    },
    subscribe: notifier.subscribe,
    version: notifier.version,
    reset(): void {
      executionOrder = [];
      recordedRuntimeStageIds.clear();
      errors.clear();
      retryAttempts.clear();
      running = false;
      // Note: reset does NOT bump version or notify (matches
      // traceStructureRecorder contract — see its `reset()` JSDoc
      // for the consumer-facing recipe).
    },
    seed(overlay: RuntimeOverlay): void {
      // Copy in, never alias: the handle owns its state the same way the
      // live path does (getOverlay hands out defensive copies for the same
      // reason). The dedupe set is rebuilt so a live event arriving AFTER a
      // seed (unusual, but legal) still dedupes against the seeded steps.
      executionOrder = overlay.executionOrder.map((s) => ({ ...s }));
      recordedRuntimeStageIds.clear();
      for (const step of executionOrder) recordedRuntimeStageIds.add(step.runtimeStageId);
      errors.clear();
      for (const [stageId, message] of overlay.errors) errors.set(stageId, message);
      retryAttempts.clear();
      if (overlay.retryAttempts) {
        for (const [rsid, attempts] of overlay.retryAttempts) retryAttempts.set(rsid, attempts);
      }
      running = overlay.running;
      notifyChange();
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Overlay slicing for time-travel
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Snapshot of overlay state AT a specific scrub index. Drives node
 * coloring in `<TracedFlow>`.
 */
export interface RuntimeOverlaySlice {
  /** Base stage ids that completed before the active scrub position. */
  readonly doneStageIds: ReadonlySet<string>;
  /** The currently-active stage id (or `null` when scrub is at 0 with no exec yet). */
  readonly activeStageId: string | null;
  /** Union of done + active — convenient for "executed at all" checks. */
  readonly executedStageIds: ReadonlySet<string>;
  /** The full ordered list of base stage ids up through the active position —
   *  used by renderers that want to number stages by occurrence (e.g.,
   *  show "3rd loop iteration" badges). */
  readonly executedOrderIds: readonly string[];
  /** Pass-through errors map for the renderer. */
  readonly errors: ReadonlyMap<string, string>;
  /**
   * Per-BASE-stageId attempt count for the executions visible at this scrub
   * position — the map a renderer paints an attempt badge from. Only entries
   * > 1 appear: one attempt is the silent default.
   *
   * Iteration-accurate where it can be: an execution that has its own step in
   * `executionOrder` contributes only once the cursor reaches it, and a later
   * execution of the same stage overwrites an earlier one (most-recent wins,
   * matching `errors`). An execution that has NO step — the stage threw on its
   * final attempt, so `onStageExecuted` never fired — contributes regardless
   * of position, because it has no position of its own to be reached.
   */
  readonly retryAttempts: ReadonlyMap<string, number>;
}

/**
 * Slice `overlay.executionOrder` at the given index:
 *
 *   - `executionOrder[0..index-1]` → "done"
 *   - `executionOrder[index]` → "active"
 *   - `index >= executionOrder.length` → all done, no active
 *
 * Returns an empty slice when overlay has no execution history.
 */
export function sliceOverlay(
  overlay: RuntimeOverlay,
  index: number,
): RuntimeOverlaySlice {
  const order = overlay.executionOrder;
  if (order.length === 0) {
    return {
      doneStageIds: new Set(),
      activeStageId: null,
      executedStageIds: new Set(),
      executedOrderIds: [],
      errors: overlay.errors,
      retryAttempts: projectRetryAttempts(overlay, -1),
    };
  }
  // Past the end = the run FINISHED: every step is done and nothing is
  // active. Clamping to the last step instead (what this did) left a
  // finished run painting its final stage as still-running, which is the
  // one thing a finished run must not say.
  if (index >= order.length) {
    const allDone = new Set(order.map((s) => s.stageId));
    return {
      doneStageIds: allDone,
      activeStageId: null,
      executedStageIds: new Set(allDone),
      executedOrderIds: order.map((s) => s.stageId),
      errors: overlay.errors,
      retryAttempts: projectRetryAttempts(overlay, order.length - 1),
    };
  }
  const clampedIndex = Math.max(0, Math.min(index, order.length - 1));
  const doneStageIds = new Set<string>();
  for (let i = 0; i < clampedIndex; i++) {
    doneStageIds.add(order[i]!.stageId);
  }
  const activeStep = order[clampedIndex];
  const activeStageId = activeStep ? activeStep.stageId : null;
  const executedStageIds = new Set(doneStageIds);
  if (activeStageId) executedStageIds.add(activeStageId);
  const executedOrderIds = order.slice(0, clampedIndex + 1).map((s) => s.stageId);
  return {
    doneStageIds,
    activeStageId,
    executedStageIds,
    executedOrderIds,
    errors: overlay.errors,
    retryAttempts: projectRetryAttempts(overlay, clampedIndex),
  };
}

/** Stable empty map so a run with no retries allocates nothing per scrub tick. */
const NO_RETRIES: ReadonlyMap<string, number> = new Map<string, number>();

/**
 * Join `overlay.retryAttempts` (keyed by runtimeStageId) onto the base stage
 * ids visible at a scrub position — see `RuntimeOverlaySlice.retryAttempts`
 * for the two cases. `upToIndex` is INCLUSIVE; pass `-1` for "no steps yet".
 */
function projectRetryAttempts(
  overlay: RuntimeOverlay,
  upToIndex: number,
): ReadonlyMap<string, number> {
  const source = overlay.retryAttempts;
  if (!source || source.size === 0) return NO_RETRIES;
  const order = overlay.executionOrder;
  const out = new Map<string, number>();
  // Executions the cursor has reached, oldest first — so a later execution of
  // the same stage overwrites an earlier one.
  for (let i = 0; i <= upToIndex && i < order.length; i++) {
    const step = order[i]!;
    const attempts = source.get(step.runtimeStageId);
    if (attempts !== undefined && attempts > 1) out.set(step.stageId, attempts);
  }
  // Executions that never completed. A stage that exhausted its policy threw,
  // so `onStageExecuted` never fired and there is no step to reach — without
  // this the one node whose retries all FAILED would be the only retried node
  // with no badge, which is precisely backwards.
  const stepped = new Set(order.map((s) => s.runtimeStageId));
  for (const [runtimeStageId, attempts] of source) {
    if (attempts > 1 && !stepped.has(runtimeStageId)) {
      out.set(parseStageIdFromRuntimeStageId(runtimeStageId), attempts);
    }
  }
  return out;
}
