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
      };
    },
    subscribe: notifier.subscribe,
    version: notifier.version,
    reset(): void {
      executionOrder = [];
      recordedRuntimeStageIds.clear();
      errors.clear();
      running = false;
      // Note: reset does NOT bump version or notify (matches
      // traceStructureRecorder contract — see its `reset()` JSDoc
      // for the consumer-facing recipe).
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
  };
}
