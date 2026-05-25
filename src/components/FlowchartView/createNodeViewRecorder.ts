/**
 * createNodeViewRecorder — per-stage summary translator.
 *
 * Implements footprintjs v6.0+ `CombinedRecorder` (Flow + Scope) and
 * produces a `NodeViewIndex` — per-stage data keyed by both `StageId`
 * (chart-shape lookup) and `RuntimeStageId` (per-execution lookup).
 *
 * Composition (panel guidance, L8.0 review)
 * ─────────────────────────────────────────
 *   NodeView does NOT duplicate the structural prev/next index — it
 *   READS those fields from the structure translator's
 *   `node.data.prevIds`/`nextIds`. The structure translator already
 *   maintains convergence-correct, loop-excluded neighbors. Duplicating
 *   the index here would re-introduce edge-ordering bugs we just
 *   solved.
 *
 *   The NodeView translator owns ONLY runtime-derived per-stage state:
 *     - `executions[]` — every FlowRecorder.onStageExecuted event for
 *       this stage (loop-friendly: N executions of one stage produce
 *       N entries, each with its own runtimeStageId).
 *     - `commitRuntimeStageIds[]` — refs to commits made by this stage
 *       (the canonical CommitView lives in CommitFlowIndex from L8.2;
 *       NodeView stores only the join key).
 *
 *   Plus derived convenience fields: `visitedInRun`, `executionCount`,
 *   `firstExecutedAt`, `lastExecutedAt`, `totalDurationMs`, `errorCount`.
 *
 * Version bumping
 * ───────────────
 *   NodeView bumps its own version on EITHER:
 *     (a) a Flow/Scope event arrives (own state mutates), OR
 *     (b) the structure translator's version bumps (structural data
 *         the index projects from changed).
 *
 *   So `useTranslator(nodeView, ...)` re-renders when EITHER changes —
 *   one subscription, full reactive coverage.
 *
 * @example
 * ```tsx
 * import { createTraceStructureRecorder, createNodeViewRecorder, useTranslator } from 'footprint-explainable-ui/flowchart';
 *
 * const trace = useMemo(() => createTraceStructureRecorder(), []);
 * const nodeView = useMemo(() => createNodeViewRecorder({ structure: trace }), [trace]);
 *
 * useEffect(() => {
 *   executor.attachFlowRecorder(nodeView.recorder);
 *   executor.attachScopeRecorder(nodeView.recorder);
 * }, [nodeView]);
 *
 * const index = useTranslator(nodeView, () => nodeView.getIndex());
 * const finalize = index.byStageId.get(asStageId('FinalizeOrder'));
 * // finalize.prevIds            → ['CheckInventory', 'RunFraudCheck']  (from structure)
 * // finalize.executions         → [{ runtimeStageId, iteration, startMs, endMs, ... }]
 * // finalize.visitedInRun       → true
 * // finalize.commitRuntimeStageIds → ['finalize-order#3', ...]
 * ```
 */

import { createNotifier } from "./_internal/notifyChange";
import { devWarn } from "./_internal/devWarn";
import { asStageId, asRuntimeStageId } from "./_internal/keys";
import type { StageId, RuntimeStageId } from "./_internal/keys";
import type { TraceStructureRecorderHandle, TraceNode } from "./traceStructureRecorder";

// ─────────────────────────────────────────────────────────────────────────────
// Local mirrors of footprintjs runtime recorder interfaces
// ─────────────────────────────────────────────────────────────────────────────
//
// Same rationale as other translators: explainable-ui has no
// `footprintjs` dep — we mirror the subset we consume. Structural
// compatibility means our `recorder` passes through to
// `executor.attachFlowRecorder()` / `attachScopeRecorder()` cleanly.

interface TraversalContext {
  readonly runtimeStageId: string;
  readonly iteration?: number;
  readonly runId?: string;
}

interface FlowStageExecutedEvent {
  readonly stageName: string;
  readonly stageId?: string;
  readonly traversalContext: TraversalContext;
  readonly startTime?: number;
  readonly endTime?: number;
}

interface FlowErrorEvent {
  readonly stageName: string;
  readonly stageId?: string;
  readonly message?: string;
  readonly traversalContext?: TraversalContext;
}

interface FlowRunLifecycleEvent {
  readonly traversalContext?: TraversalContext;
}

interface ScopeCommitEvent {
  readonly stage?: string;
  readonly stageId?: string;
  readonly runtimeStageId?: string;
  readonly updates?: Record<string, unknown>;
  readonly reads?: readonly string[];
}

/**
 * Minimal CombinedRecorder interface mirror — subset of footprintjs's
 * Flow + Scope recorder interfaces NodeView consumes. Implements both
 * channels in one object; consumer attaches via
 * `executor.attachFlowRecorder()` AND `executor.attachScopeRecorder()`
 * (or `executor.attachCombinedRecorder()` if available).
 */
export interface MinimalNodeViewRecorder {
  readonly id: string;
  // Flow channel
  onStageExecuted?(event: FlowStageExecutedEvent): void;
  onError?(event: FlowErrorEvent): void;
  onRunStart?(event: FlowRunLifecycleEvent): void;
  onRunEnd?(event: FlowRunLifecycleEvent): void;
  // Scope channel
  onCommit?(event: ScopeCommitEvent): void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Output shape
// ─────────────────────────────────────────────────────────────────────────────

/** One execution of a stage. A stage that runs N times in a loop
 *  produces N `ExecutionRecord` entries on the NodeView.executions[]. */
export interface ExecutionRecord {
  /** `[subflowPath/]stageId#executionIndex` — universal join key. */
  readonly runtimeStageId: RuntimeStageId;
  /** Loop iteration (0-indexed). undefined when the engine didn't
   *  populate it (rare). */
  readonly iteration?: number;
  /** ms since executor start. */
  readonly startMs?: number;
  /** ms since executor start. */
  readonly endMs?: number;
  /** Set when `onError` fired for this execution. */
  readonly errorMessage?: string;
}

/**
 * Per-stage summary. Joins STRUCTURAL data (from the structure
 * translator's TraceNode.data) with RUNTIME data (executions + commit
 * refs accumulated by this translator).
 */
export interface NodeView {
  // ── Identity ────────────────────────────────────────────────────
  readonly stageId: StageId;
  readonly label: string;

  // ── Structural (read-through from structure translator) ─────────
  readonly type: "stage" | "decider" | "selector" | "fork" | "streaming" | "subflow" | "loop";
  readonly isDecider: boolean;
  readonly isFork: boolean;
  readonly isSubflow: boolean;
  readonly isStreaming: boolean;
  readonly isPausable: boolean;
  readonly description?: string;
  readonly icon?: string;
  readonly subflowId?: string;
  readonly branchIds?: readonly string[];
  readonly defaultBranch?: string;
  /** From the structure translator (loop-excluded, convergence-correct). */
  readonly prevIds: StageId[];
  readonly nextIds: StageId[];

  // ── Visit data (runtime) ────────────────────────────────────────
  readonly executions: ExecutionRecord[];
  /** Derived: `executions.length > 0`. */
  readonly visitedInRun: boolean;
  /** Derived: `executions.length` (loop iteration count). */
  readonly executionCount: number;
  /** Derived: first execution `startMs`, or `null` if not yet executed. */
  readonly firstExecutedAt: number | null;
  /** Derived: last execution `endMs`, or `null`. */
  readonly lastExecutedAt: number | null;
  /** Derived: sum of `endMs - startMs` across executions. */
  readonly totalDurationMs: number;
  /** Derived: count of executions with an errorMessage. */
  readonly errorCount: number;

  // ── Commit refs (join key into CommitFlowIndex from L8.2) ───────
  /** Run-time stage ids of commits made by this stage. Look up the
   *  canonical CommitView via `commitFlow.byRuntimeStageId.get(id)`. */
  readonly commitRuntimeStageIds: RuntimeStageId[];
}

/** Index of NodeView keyed by both StageId and RuntimeStageId. The
 *  branded types prevent `byStageId.get(runtimeStageId)` silent-undefined. */
export interface NodeViewIndex {
  readonly byStageId: ReadonlyMap<StageId, NodeView>;
  readonly byRuntimeStageId: ReadonlyMap<RuntimeStageId, NodeView>;
  /** All NodeViews — insertion order matches structure translator. */
  readonly all: readonly NodeView[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Handle
// ─────────────────────────────────────────────────────────────────────────────

export interface NodeViewRecorderHandle {
  /** CombinedRecorder — attach via BOTH `executor.attachFlowRecorder()`
   *  AND `executor.attachScopeRecorder()` (footprintjs routes by
   *  method-shape detection). */
  recorder: MinimalNodeViewRecorder;
  /** Returns a defensive copy of the current index state. */
  getIndex(): NodeViewIndex;
  /** Pub-sub: returns unsubscribe. Designed for `useSyncExternalStore`. */
  subscribe(listener: () => void): () => void;
  /** Monotonic version counter — bumps on Flow/Scope event OR when
   *  the structure translator's version bumps (since NodeView projects
   *  from its data). */
  version(): number;
  /** Reset runtime state. Does NOT bump version or notify (consistent
   *  with traceStructureRecorder + createTraceRuntimeOverlay). */
  reset(): void;
}

export interface CreateNodeViewRecorderOptions {
  /** Recorder id (surfaces in error attribution). */
  id?: string;
  /** REQUIRED — the structure translator handle. NodeView projects
   *  structural fields (`prevIds`, `nextIds`, `label`, etc.) from
   *  this on every `getIndex()` call. */
  structure: TraceStructureRecorderHandle;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Strip `#executionIndex` from runtimeStageId to recover the base
 *  stageId. **Use only for in-translator matching where both sides
 *  use full-path-prefixed stageIds consistently** (invariant I3 — do
 *  NOT use this to match commitLog stageIds across subflow boundaries). */
function baseStageIdOf(runtimeStageId: string): string {
  const hashIdx = runtimeStageId.indexOf("#");
  return hashIdx >= 0 ? runtimeStageId.slice(0, hashIdx) : runtimeStageId;
}

// ─────────────────────────────────────────────────────────────────────────────
// Factory
// ─────────────────────────────────────────────────────────────────────────────

export function createNodeViewRecorder(
  options: CreateNodeViewRecorderOptions,
): NodeViewRecorderHandle {
  const id = options.id ?? "node-view";
  const structure = options.structure;
  if (!structure) {
    throw new Error(
      "[createNodeViewRecorder] `structure` option is required. " +
        "Pass the handle returned by `createTraceStructureRecorder()`.",
    );
  }

  // Per-stage execution + commit-ref state. Keyed by base stageId.
  // Loops produce multiple entries with the same stageId / different
  // runtimeStageIds.
  let executionsOf: Map<StageId, ExecutionRecord[]> = new Map();
  let commitRefsOf: Map<StageId, RuntimeStageId[]> = new Map();
  // Reverse lookup: runtimeStageId → its base stageId. Lets
  // `byRuntimeStageId` map directly to a NodeView without
  // re-parsing.
  let stageIdOfRuntimeStageId: Map<RuntimeStageId, StageId> = new Map();

  const notifier = createNotifier("node-view");

  // Subscribe to structure translator — when its graph changes
  // (e.g., new stage announced during incremental build), bump our
  // version so consumers re-derive the projection.
  const unsubStructure = structure.subscribe(() => notifier.notify());

  function recordExecution(event: FlowStageExecutedEvent): void {
    // L8.1 Panel 2 must-fix: guard against malformed event payloads
    // (asymmetric with recordError's existing guard). Upstream MAY
    // fire with traversalContext absent if the engine's runtime
    // observer chain is reorganised — fail soft, not hard.
    const rsid = event.traversalContext?.runtimeStageId;
    if (!rsid) {
      devWarn(
        () =>
          `[createNodeViewRecorder] onStageExecuted event without traversalContext.runtimeStageId — execution attribution dropped (stage=${event.stageName}).`,
      );
      return;
    }
    const stageId = asStageId(baseStageIdOf(rsid));
    const runtimeStageId = asRuntimeStageId(rsid);
    const execList = executionsOf.get(stageId) ?? [];
    const record: ExecutionRecord = {
      runtimeStageId,
      ...(event.traversalContext.iteration !== undefined && {
        iteration: event.traversalContext.iteration,
      }),
      ...(event.startTime !== undefined && { startMs: event.startTime }),
      ...(event.endTime !== undefined && { endMs: event.endTime }),
    };
    execList.push(record);
    executionsOf.set(stageId, execList);
    stageIdOfRuntimeStageId.set(runtimeStageId, stageId);
    notifier.notify();
  }

  function recordError(event: FlowErrorEvent): void {
    const rsid = event.traversalContext?.runtimeStageId;
    if (!rsid) {
      devWarn(
        () =>
          `[createNodeViewRecorder] onError event without traversalContext.runtimeStageId — error attribution dropped (stage=${event.stageName}).`,
      );
      return;
    }
    const stageId = asStageId(baseStageIdOf(rsid));
    const runtimeStageId = asRuntimeStageId(rsid);
    const execList = executionsOf.get(stageId);
    // L8.1 Panel 1 must-fix: match by runtimeStageId equality (NOT
    // array position). With interleaved-stage events under footprintjs's
    // FlowRecorder dispatcher, "most-recent execution by array index"
    // can attach an error to the wrong execution. Looking up by
    // runtimeStageId is the correct join key.
    const matchIdx = execList
      ? execList.findIndex((e) => e.runtimeStageId === runtimeStageId)
      : -1;
    if (!execList || matchIdx === -1) {
      // Error before onStageExecuted? Synthesize a minimal execution
      // record so consumers see the error.
      const synth: ExecutionRecord = {
        runtimeStageId,
        errorMessage: event.message ?? "error",
      };
      if (execList) {
        execList.push(synth);
      } else {
        executionsOf.set(stageId, [synth]);
      }
    } else {
      const match = execList[matchIdx]!;
      execList[matchIdx] = { ...match, errorMessage: event.message ?? "error" };
    }
    stageIdOfRuntimeStageId.set(runtimeStageId, stageId);
    notifier.notify();
  }

  function recordCommit(event: ScopeCommitEvent): void {
    // Read runtimeStageId directly from the onCommit payload
    // (panel L8.0 ordering invariant: Scope.onCommit fires BEFORE
    // Flow.onStageExecuted; don't rely on Flow event arriving first).
    const rsid = event.runtimeStageId;
    if (!rsid) {
      devWarn(
        () =>
          `[createNodeViewRecorder] onCommit event without runtimeStageId — commit attribution dropped (stage=${event.stage ?? event.stageId ?? "?"}).`,
      );
      return;
    }
    const stageId = asStageId(baseStageIdOf(rsid));
    const refs = commitRefsOf.get(stageId) ?? [];
    refs.push(asRuntimeStageId(rsid));
    commitRefsOf.set(stageId, refs);
    stageIdOfRuntimeStageId.set(asRuntimeStageId(rsid), stageId);
    notifier.notify();
  }

  const recorder: MinimalNodeViewRecorder = {
    id,
    onStageExecuted: recordExecution,
    onError: recordError,
    onCommit: recordCommit,
    // onRunStart / onRunEnd — no-op for now (state stays alive across
    // runs; consumers call .reset() between runs if they want fresh
    // state). Listed for shape conformance with FlowRecorder.
    onRunStart() {
      /* no-op */
    },
    onRunEnd() {
      /* no-op */
    },
  };

  function buildView(structNode: TraceNode): NodeView {
    const stageId = asStageId(structNode.id);
    const execs = executionsOf.get(stageId) ?? [];
    const commitRefs = commitRefsOf.get(stageId) ?? [];

    // Derived visit-data fields
    const visitedInRun = execs.length > 0;
    const executionCount = execs.length;
    const firstExecutedAt = execs.length > 0 && execs[0]!.startMs !== undefined
      ? execs[0]!.startMs!
      : null;
    const lastExecutedAt = execs.length > 0 && execs[execs.length - 1]!.endMs !== undefined
      ? execs[execs.length - 1]!.endMs!
      : null;
    let totalDurationMs = 0;
    let errorCount = 0;
    for (const e of execs) {
      if (e.startMs !== undefined && e.endMs !== undefined) {
        totalDurationMs += e.endMs - e.startMs;
      }
      if (e.errorMessage) errorCount++;
    }

    const d = structNode.data;
    return {
      stageId,
      label: d.label,
      type: (structNode.type as NodeView["type"]) ?? "stage",
      isDecider: d.isDecider,
      isFork: d.isFork,
      isSubflow: d.isSubflow,
      isStreaming: d.isStreaming,
      isPausable: d.isPausable === true,
      ...(d.description !== undefined && { description: d.description }),
      ...(d.icon !== undefined && { icon: d.icon }),
      ...(d.subflowId !== undefined && { subflowId: d.subflowId }),
      // L8.1 Panel 2 must-fix: branchIds is a live ref from the
      // structure translator's internal graph — defensive copy via
      // slice() prevents consumer mutation from corrupting it.
      ...(d.branchIds !== undefined && { branchIds: d.branchIds.slice() }),
      ...(d.defaultBranch !== undefined && { defaultBranch: d.defaultBranch }),
      // Note: structure translator always sets prevIds/nextIds (never
      // undefined). The slice() copies defend against consumer mutation.
      prevIds: d.prevIds.slice(),
      nextIds: d.nextIds.slice(),
      executions: execs.map((e) => ({ ...e })),
      visitedInRun,
      executionCount,
      firstExecutedAt,
      lastExecutedAt,
      totalDurationMs,
      errorCount,
      commitRuntimeStageIds: commitRefs.slice(),
    };
  }

  // L8.1 Panel 5 optimization: version-keyed cache. `getIndex()` is
  // called per React render that observes a version bump; with N
  // translators subscribed + StrictMode double-invoke, a single
  // stage event can produce 6+ full rebuilds. Cache the last index
  // keyed on `(ownVersion, structureVersion)` — return the cached
  // index when neither has changed since the previous build.
  let cachedIndex: NodeViewIndex | null = null;
  let cachedOwnVersion = -1;
  let cachedStructureVersion = -1;

  return {
    recorder,
    getIndex(): NodeViewIndex {
      const own = notifier.version();
      const struct = structure.version();
      if (
        cachedIndex !== null &&
        cachedOwnVersion === own &&
        cachedStructureVersion === struct
      ) {
        return cachedIndex;
      }
      // Read structure live — we project from its current graph each
      // call. Defensive-copy via getGraph() would over-allocate; we
      // use getGraphRef() and tolerate the read-only contract (we
      // don't mutate structure data).
      const graphRef = structure.getGraphRef();
      const byStageId = new Map<StageId, NodeView>();
      const byRuntimeStageId = new Map<RuntimeStageId, NodeView>();
      const all: NodeView[] = [];
      for (const structNode of graphRef.nodes) {
        const view = buildView(structNode);
        byStageId.set(view.stageId, view);
        all.push(view);
        // Reverse map: every execution's runtimeStageId → this view.
        for (const exec of view.executions) {
          byRuntimeStageId.set(exec.runtimeStageId, view);
        }
        // Commit refs also point back to this view (a stage's
        // runtimeStageId for its execution is the same key its
        // commit carries).
        for (const rsid of view.commitRuntimeStageIds) {
          byRuntimeStageId.set(rsid, view);
        }
      }
      cachedIndex = { byStageId, byRuntimeStageId, all };
      cachedOwnVersion = own;
      cachedStructureVersion = struct;
      return cachedIndex;
    },
    subscribe: notifier.subscribe,
    version: notifier.version,
    reset(): void {
      executionsOf = new Map();
      commitRefsOf = new Map();
      stageIdOfRuntimeStageId = new Map();
      // L8.1 — invalidate the version-keyed cache. We do NOT bump
      // version (matches the other translators' reset contract — see
      // traceStructureRecorder's `reset()` JSDoc for the consumer
      // recipe), but the cache MUST be cleared so the next
      // `getIndex()` rebuilds from the freshly-empty state instead
      // of returning a stale snapshot.
      cachedIndex = null;
      cachedOwnVersion = -1;
      cachedStructureVersion = -1;
      // We intentionally do NOT unsubscribe from structure here; the
      // handle is still alive across resets.
      void unsubStructure;
    },
  };
}
