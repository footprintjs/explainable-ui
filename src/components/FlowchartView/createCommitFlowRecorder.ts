/**
 * createCommitFlowRecorder — per-commit summary translator.
 *
 * Owns the canonical `CommitView[]` — captured from Scope `onCommit`
 * events as the chart runs. Each CommitView joins:
 *
 *   - **Identity**: runtimeStageId, stageId, commitIdx
 *   - **Structural**: prev/next stage ids (read from structure
 *     translator's `TraceNode.data.prevIds`/`nextIds`)
 *   - **Runtime prev/next**: derived via "most-recent-per-structural-
 *     prev" rule over the commitLog (loop-safe, convergence-aware)
 *   - **Data dependencies**: per-read-key lineage via
 *     `findLastWriter` over the commitLog
 *   - **Payload**: updates + reads
 *
 * Composition (panel guidance, L8.1 review)
 * ─────────────────────────────────────────
 *   Per Panel 1 rule "translators MUST subscribe to structure
 *   directly, never to peer translators", CommitFlow subscribes to
 *   the structure handle (NOT to NodeView). Linear dependency tree
 *   keeps notify cascades O(depth) instead of O(N²).
 *
 *   NodeView (L8.1) stores `commitRuntimeStageIds[]` — refs only —
 *   pointing into CommitFlow's `byRuntimeStageId`. The canonical
 *   payload lives HERE; NodeView is the per-stage projection.
 *
 * @example
 * ```tsx
 * const trace = useMemo(() => createTraceStructureRecorder(), []);
 * const commitFlow = useMemo(
 *   () => createCommitFlowRecorder({ structure: trace }),
 *   [trace],
 * );
 * useEffect(() => {
 *   executor.attachFlowRecorder(commitFlow.recorder);
 *   executor.attachScopeRecorder(commitFlow.recorder);
 * }, [commitFlow]);
 *
 * const index = useTranslator(commitFlow, () => commitFlow.getIndex());
 * const c = index.byRuntimeStageId.get(asRuntimeStageId('finalize-order#3'));
 * c.structuralPrevIds  // ['CheckInventory', 'RunFraudCheck']
 * c.runtimePrevIds     // ['check-inventory#1', 'run-fraud-check#2']
 * c.dataDependencies   // [{ key:'inStock', sourceRuntimeStageId:'check-inventory#1', sourceCommitIdx:1 }, ...]
 *
 * const lineage = backtraceDataFlow(index, asRuntimeStageId('finalize-order#3'));
 * // → ancestry chain of commits whose writes contributed to this commit's reads
 * ```
 */

import { createNotifier } from "./_internal/notifyChange";
import { devWarn } from "./_internal/devWarn";
import { asStageId, asRuntimeStageId } from "./_internal/keys";
import type { StageId, RuntimeStageId } from "./_internal/keys";
import type { TraceStructureRecorderHandle } from "./traceStructureRecorder";

// ─────────────────────────────────────────────────────────────────────────────
// Local mirrors of footprintjs runtime recorder interfaces
// ─────────────────────────────────────────────────────────────────────────────

interface TraversalContext {
  readonly runtimeStageId: string;
  readonly iteration?: number;
  readonly runId?: string;
}

interface FlowStageExecutedEvent {
  readonly stageName: string;
  readonly stageId?: string;
  readonly traversalContext: TraversalContext;
}

interface FlowErrorEvent {
  readonly stageName: string;
  readonly stageId?: string;
  readonly message?: string;
  readonly traversalContext?: TraversalContext;
}

/** One FAILED attempt at a stage with a declared `retry` policy
 *  (footprintjs >= 9.15.0). Fires DURING the stage; only the surviving
 *  attempt ever commits, which is why this fact has to come from the event
 *  stream rather than from the commit itself. */
interface FlowStageRetryEvent {
  readonly stageName: string;
  readonly stageId?: string;
  /** Which attempt just FAILED, 1-based. */
  readonly attempt?: number;
  readonly maxAttempts?: number;
  readonly traversalContext?: TraversalContext;
}

interface FlowRunLifecycleEvent {
  readonly traversalContext?: TraversalContext;
}

interface ScopeReadEvent {
  readonly stage?: string;
  readonly stageId?: string;
  readonly runtimeStageId?: string;
  readonly key?: string;
}

interface ScopeCommitEvent {
  readonly stage?: string;
  readonly stageId?: string;
  readonly runtimeStageId?: string;
  readonly updates?: Record<string, unknown>;
  readonly reads?: readonly string[];
}

/**
 * Minimal CombinedRecorder mirror — subset of footprintjs's Flow +
 * Scope channels CommitFlow consumes.
 */
export interface MinimalCommitFlowRecorder {
  readonly id: string;
  // Flow channel — for runtimeStageId enrichment + error attribution
  onStageExecuted?(event: FlowStageExecutedEvent): void;
  onError?(event: FlowErrorEvent): void;
  onStageRetry?(event: FlowStageRetryEvent): void;
  onRunStart?(event: FlowRunLifecycleEvent): void;
  onRunEnd?(event: FlowRunLifecycleEvent): void;
  // Scope channel — the canonical commit + read data source
  onRead?(event: ScopeReadEvent): void;
  onCommit?(event: ScopeCommitEvent): void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Output shape
// ─────────────────────────────────────────────────────────────────────────────

/**
 * One data-dependency edge — a read key in this commit AND the commit
 * whose `updates` last wrote that key before this commit's index.
 *
 * `sourceRuntimeStageId` and `sourceCommitIdx` are BOTH `null` when no
 * prior commit wrote the key (panel-flagged: NEVER `undefined` — forces
 * consumers to handle absence as load-bearing).
 */
export interface DataDependency {
  readonly key: string;
  readonly sourceRuntimeStageId: RuntimeStageId | null;
  readonly sourceCommitIdx: number | null;
}

/**
 * Per-commit summary. Joins structural data (from the structure
 * translator) with runtime data (commitLog timeline) into a single
 * consumer-friendly shape.
 *
 * Three "prev" views — pick the right one for your UI:
 * ─────────────────────────────────────────────────────
 *   | Field                | Answers                                    |
 *   |----------------------|--------------------------------------------|
 *   | `structuralPrevIds`  | "what COULD flow in" (chart shape)        |
 *   | `runtimePrevIds`     | "what DID flow in by stage" (execution    |
 *   |                      | timeline; loop-aware)                      |
 *   | `dataDependencies`   | "which commit wrote the bytes I read"     |
 *   |                      | (causal data lineage; per-key)             |
 *
 * The three answers usually align on simple charts (linear; single
 * fork-merge). They DIVERGE in interesting ways under loops (runtime
 * differs by iteration; data-deps may skip uninvolved stages) and
 * conditional branches (structural sees all options; runtime + data
 * see only the chosen path).
 */
export interface CommitView {
  // ── Identity ────────────────────────────────────────────────────
  readonly runtimeStageId: RuntimeStageId;
  readonly stageId: StageId;
  /** Position in the chronologically-ordered commitLog. */
  readonly commitIdx: number;

  // ── Structural (from structure translator) ──────────────────────
  /** Stage ids that lead into this stage in the chart (loop-excluded). */
  readonly structuralPrevIds: StageId[];
  readonly structuralNextIds: StageId[];

  // ── Runtime (derived: structural prev ∩ commitLog up-to-here) ──
  /**
   * For each structural prev stage that EXECUTED IN THIS RUN before
   * this commit, the most-recent runtimeStageId of that prev's commit.
   * Loop-safe: in iteration 2, runtime prev points at iteration 2's
   * commits (not iteration 1's).
   */
  readonly runtimePrevIds: RuntimeStageId[];
  /**
   * For each structural next stage that EXECUTED IN THIS RUN after
   * this commit, the soonest runtimeStageId. Symmetric to prev.
   */
  readonly runtimeNextIds: RuntimeStageId[];

  // ── Data flow (per-key lineage via findLastWriter) ──────────────
  /**
   * One entry per key in `reads`. `sourceRuntimeStageId` points at the
   * commit whose `updates` last set this key BEFORE this commit's
   * index; `null` when no prior writer (typically: read of a key
   * declared as default but never written by another stage).
   */
  readonly dataDependencies: DataDependency[];

  // ── Payload ─────────────────────────────────────────────────────
  /**
   * The commit's writes. **Shallow-copied** at intake — top-level
   * keys are owned, but nested object values are SHARED references
   * to whatever the upstream `onCommit` payload carried. Consumers
   * MUST NOT mutate nested values; doing so corrupts the recorder's
   * internal state and propagates through `findLastWriter` to every
   * subsequent `getIndex()` call.
   */
  readonly updates: Record<string, unknown>;
  readonly reads: string[];

  // ── Attempts (runtime, from onStageRetry) ───────────────────────
  /**
   * How many attempts the stage made before THIS commit landed — present
   * only when a declared `retry` policy fired (> 1). The discarded attempts
   * committed nothing, so this is the one place the commit chain can say
   * "these values are attempt 3's, not attempt 1's".
   */
  readonly attempts?: number;
}

/** Indexed CommitView access. */
export interface CommitFlowIndex {
  /** Ordered list — index === commitIdx. */
  readonly commits: readonly CommitView[];
  /** Lookup by runtimeStageId (the universal join key). */
  readonly byRuntimeStageId: ReadonlyMap<RuntimeStageId, CommitView>;
  /**
   * Data-dependency edges — `from` and `to` are commitIdx ints; `key`
   * is the data key that flowed from one commit to the other. Same
   * data as walking each CommitView's `dataDependencies` — exposed as
   * a flat edge list for graph algorithms and rendering.
   *
   * **When to use which**:
   *   - `view.dataDependencies` — render ONE commit's inputs in a
   *     detail panel (e.g., `<CommitInspector>`).
   *   - `index.dataEdges` — draw the FULL data-flow DAG (React Flow
   *     edges, GraphViz, dependency matrix, etc.). One pass over the
   *     flat list = the whole graph.
   *
   * Edges are `Object.freeze()`d at construction — type `readonly` is
   * compile-time; freeze is the runtime enforcement.
   */
  readonly dataEdges: readonly { readonly from: number; readonly to: number; readonly key: string }[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Handle
// ─────────────────────────────────────────────────────────────────────────────

export interface CommitFlowRecorderHandle {
  /** CombinedRecorder — attach via BOTH `executor.attachFlowRecorder()`
   *  AND `executor.attachScopeRecorder()`. */
  recorder: MinimalCommitFlowRecorder;
  /** Returns a defensive copy of the current index state. */
  getIndex(): CommitFlowIndex;
  /** Pub-sub: returns unsubscribe. */
  subscribe(listener: () => void): () => void;
  /** Monotonic version counter — bumps on Scope/Flow event OR when
   *  the structure translator's version bumps. */
  version(): number;
  /** Reset runtime state. Does NOT bump version or notify (consistent
   *  with other translators' reset contracts). */
  reset(): void;
}

export interface CreateCommitFlowRecorderOptions {
  /** Recorder id (surfaces in error attribution). */
  id?: string;
  /** REQUIRED — structure translator handle for structural prev/next
   *  projection. CommitFlow subscribes to its version. */
  structure: TraceStructureRecorderHandle;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal
// ─────────────────────────────────────────────────────────────────────────────

/** Strip `#executionIndex` from a runtimeStageId to recover the base
 *  stageId. **Invariant I3**: matches commitLog stageIds when the
 *  runtimeStageId already carries the full subflow path prefix the
 *  engine emits. Do NOT manually re-parse subflow paths. */
function baseStageIdOf(runtimeStageId: string): string {
  const hashIdx = runtimeStageId.indexOf("#");
  return hashIdx >= 0 ? runtimeStageId.slice(0, hashIdx) : runtimeStageId;
}

// ─────────────────────────────────────────────────────────────────────────────
// Factory
// ─────────────────────────────────────────────────────────────────────────────

export function createCommitFlowRecorder(
  options: CreateCommitFlowRecorderOptions,
): CommitFlowRecorderHandle {
  const id = options.id ?? "commit-flow";
  const structure = options.structure;
  if (!structure) {
    throw new Error(
      "[createCommitFlowRecorder] `structure` option is required. " +
        "Pass the handle returned by `createTraceStructureRecorder()`.",
    );
  }

  // Internal raw commit storage — `RawCommit` is the un-projected
  // version (no structural/runtime joins yet). The full `CommitView`
  // gets computed on `getIndex()` (cached by version key).
  interface RawCommit {
    runtimeStageId: RuntimeStageId;
    stageId: StageId;
    commitIdx: number;
    updates: Record<string, unknown>;
    reads: string[];
  }
  let rawCommits: RawCommit[] = [];
  // runtimeStageId → attempts made. onStageRetry fires before the commit, so
  // this is kept aside and joined in buildIndex.
  let attemptsOfRuntimeStageId: Map<string, number> = new Map();

  const notifier = createNotifier("commit-flow");
  const unsubStructure = structure.subscribe(() => notifier.notify());

  function recordCommit(event: ScopeCommitEvent): void {
    // L8.0 ordering invariant — Scope.onCommit fires BEFORE Flow's
    // onStageExecuted. We read runtimeStageId directly from the
    // onCommit payload, NEVER waiting for a Flow event to enrich.
    const rsid = event.runtimeStageId;
    if (!rsid) {
      devWarn(
        () =>
          `[createCommitFlowRecorder] onCommit without runtimeStageId — commit dropped (stage=${event.stage ?? event.stageId ?? "?"}).`,
      );
      return;
    }
    const stageId = asStageId(baseStageIdOf(rsid));
    rawCommits.push({
      runtimeStageId: asRuntimeStageId(rsid),
      stageId,
      commitIdx: rawCommits.length,
      updates: event.updates ? { ...event.updates } : {},
      reads: event.reads ? [...event.reads] : [],
    });
    notifier.notify();
  }

  // Flow channel handlers — no-ops for the canonical commit-data
  // capture (Scope.onCommit already carries runtimeStageId). Listed
  // so the recorder shape matches FlowRecorder and `attachTo()` can
  // attach via attachFlowRecorder for parity with other translators.
  // onError doesn't influence CommitView state today — errors belong
  // to NodeView's per-stage projection.
  function recordRetry(event: FlowStageRetryEvent): void {
    const rsid = event.traversalContext?.runtimeStageId;
    if (!rsid) {
      devWarn(
        () =>
          `[createCommitFlowRecorder] onStageRetry without runtimeStageId — attempt attribution dropped (stage=${event.stageName}).`,
      );
      return;
    }
    // `attempt` is the attempt that FAILED, and another always follows it —
    // so attempt N failing proves N+1 ran.
    const attempt = event.attempt;
    const prior = attemptsOfRuntimeStageId.get(rsid) ?? 1;
    const attemptsMade =
      typeof attempt === "number" && Number.isFinite(attempt) && attempt >= 1
        ? Math.floor(attempt) + 1
        : prior + 1;
    if (attemptsMade > prior) {
      attemptsOfRuntimeStageId.set(rsid, attemptsMade);
      notifier.notify();
    }
  }

  const recorder: MinimalCommitFlowRecorder = {
    id,
    onCommit: recordCommit,
    onStageRetry: recordRetry,
    onStageExecuted() {
      /* no-op — CommitFlow is commit-centric, not execution-centric */
    },
    onError() {
      /* no-op */
    },
    onRunStart() {
      /* no-op */
    },
    onRunEnd() {
      /* no-op */
    },
  };

  function buildIndex(): CommitFlowIndex {
    // Snapshot structure once — `getGraphRef()` returns live refs;
    // we only read from `node.data.prevIds`/`nextIds` (read-only).
    const graphRef = structure.getGraphRef();
    const nodeByStageId = new Map<string, (typeof graphRef.nodes)[number]>();
    for (const n of graphRef.nodes) nodeByStageId.set(n.id, n);

    // Precompute per-key writer index for findLastWriter (linear-time
    // build, O(1) lookup per read in the per-commit loop below).
    // Maps key → ordered list of {commitIdx, runtimeStageId} for
    // commits that wrote this key.
    interface KeyWriter {
      commitIdx: number;
      runtimeStageId: RuntimeStageId;
    }
    const writersOf = new Map<string, KeyWriter[]>();
    for (const rc of rawCommits) {
      for (const k of Object.keys(rc.updates)) {
        const list = writersOf.get(k) ?? [];
        list.push({ commitIdx: rc.commitIdx, runtimeStageId: rc.runtimeStageId });
        writersOf.set(k, list);
      }
    }

    // Precompute per-stage commit-index lists for runtimePrev/Next
    // derivation. Each stageId → ordered list of commitIdx where that
    // stage committed.
    const commitsOfStage = new Map<string, number[]>();
    for (const rc of rawCommits) {
      const list = commitsOfStage.get(rc.stageId) ?? [];
      list.push(rc.commitIdx);
      commitsOfStage.set(rc.stageId, list);
    }

    const commits: CommitView[] = [];
    const byRuntimeStageId = new Map<RuntimeStageId, CommitView>();
    const dataEdges: { from: number; to: number; key: string }[] = [];

    for (const rc of rawCommits) {
      const structNode = nodeByStageId.get(rc.stageId);
      const structuralPrevIds = (structNode?.data.prevIds ?? []).slice();
      const structuralNextIds = (structNode?.data.nextIds ?? []).slice();

      // runtimePrevIds — for each structural prev, the most-recent
      // commit with that stageId BEFORE rc.commitIdx.
      const runtimePrevIds: RuntimeStageId[] = [];
      for (const pStageId of structuralPrevIds) {
        const list = commitsOfStage.get(pStageId);
        if (!list) continue;
        // Walk backwards to find the highest commitIdx strictly less
        // than rc.commitIdx (invariant I2: strict `<`, not `<=`).
        let chosenIdx: number | null = null;
        for (let i = list.length - 1; i >= 0; i--) {
          if (list[i]! < rc.commitIdx) {
            chosenIdx = list[i]!;
            break;
          }
        }
        if (chosenIdx !== null) {
          runtimePrevIds.push(rawCommits[chosenIdx]!.runtimeStageId);
        }
      }

      // runtimeNextIds — for each structural next, the soonest commit
      // with that stageId AFTER rc.commitIdx.
      const runtimeNextIds: RuntimeStageId[] = [];
      for (const nStageId of structuralNextIds) {
        const list = commitsOfStage.get(nStageId);
        if (!list) continue;
        let chosenIdx: number | null = null;
        for (let i = 0; i < list.length; i++) {
          if (list[i]! > rc.commitIdx) {
            chosenIdx = list[i]!;
            break;
          }
        }
        if (chosenIdx !== null) {
          runtimeNextIds.push(rawCommits[chosenIdx]!.runtimeStageId);
        }
      }

      // Data dependencies — per-read-key findLastWriter.
      const dataDependencies: DataDependency[] = [];
      for (const key of rc.reads) {
        const writers = writersOf.get(key);
        let source: KeyWriter | null = null;
        if (writers) {
          for (let i = writers.length - 1; i >= 0; i--) {
            if (writers[i]!.commitIdx < rc.commitIdx) {
              source = writers[i]!;
              break;
            }
          }
        }
        if (source) {
          dataDependencies.push({
            key,
            sourceRuntimeStageId: source.runtimeStageId,
            sourceCommitIdx: source.commitIdx,
          });
          // L8.2 Panel 2 must-fix: freeze each edge so consumers can't
          // mutate the exposed objects. `readonly` is type-only; this
          // is the runtime enforcement.
          dataEdges.push(
            Object.freeze({ from: source.commitIdx, to: rc.commitIdx, key }),
          );
        } else {
          // Panel must-fix: use `null` (not `undefined`) for missing
          // source — forces consumers to handle absence load-bearingly.
          dataDependencies.push({
            key,
            sourceRuntimeStageId: null,
            sourceCommitIdx: null,
          });
        }
      }

      const attempts = attemptsOfRuntimeStageId.get(rc.runtimeStageId);
      const view: CommitView = {
        runtimeStageId: rc.runtimeStageId,
        stageId: rc.stageId,
        commitIdx: rc.commitIdx,
        structuralPrevIds,
        structuralNextIds,
        runtimePrevIds,
        runtimeNextIds,
        dataDependencies,
        updates: { ...rc.updates },
        reads: rc.reads.slice(),
        ...(attempts !== undefined && attempts > 1 && { attempts }),
      };
      commits.push(view);
      byRuntimeStageId.set(view.runtimeStageId, view);
    }

    return { commits, byRuntimeStageId, dataEdges };
  }

  // L8.1 Panel 5 optimization: version-keyed cache. Same pattern as
  // NodeView — rebuild on (ownVersion, structureVersion) change.
  let cachedIndex: CommitFlowIndex | null = null;
  let cachedOwnVersion = -1;
  let cachedStructureVersion = -1;

  return {
    recorder,
    getIndex(): CommitFlowIndex {
      const own = notifier.version();
      const struct = structure.version();
      if (
        cachedIndex !== null &&
        cachedOwnVersion === own &&
        cachedStructureVersion === struct
      ) {
        return cachedIndex;
      }
      cachedIndex = buildIndex();
      cachedOwnVersion = own;
      cachedStructureVersion = struct;
      return cachedIndex;
    },
    subscribe: notifier.subscribe,
    version: notifier.version,
    reset(): void {
      rawCommits = [];
      attemptsOfRuntimeStageId = new Map();
      // Cache invalidation — version doesn't bump (panel reset contract),
      // but next getIndex() must rebuild from the freshly-empty state.
      cachedIndex = null;
      cachedOwnVersion = -1;
      cachedStructureVersion = -1;
      // Subscription to structure is INTENTIONALLY kept across resets
      // (matches NodeView's reset contract). The handle is alive for
      // the recorder's full lifetime; consumer that wants full
      // disposal should drop the handle reference + let GC reclaim.
      // Referenced here purely to keep the closure alive for the
      // unsub's lexical scope.
      void unsubStructure;
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Data-flow backtrace helper
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Walk data-dependency edges BACKWARD from a starting commit. Returns
 * the lineage chain — every ancestor commit whose writes transitively
 * contributed to the starting commit's reads.
 *
 * BFS order, commitIdx-ascending (oldest first). Includes the starting
 * commit at the END of the returned array.
 *
 * Cycle defense: visited set + recursion cap at `index.commits.length`
 * (per L8 panel must-fix — defends against future malformed graphs).
 *
 * @example
 * ```ts
 * const lineage = backtraceDataFlow(commitIndex, asRuntimeStageId('finalize-order#3'));
 * // → [load-order#0, check-inventory#1, run-fraud-check#2, finalize-order#3]
 * //   (the commits whose updates fed FinalizeOrder's reads)
 * ```
 */
export function backtraceDataFlow(
  index: CommitFlowIndex,
  startRuntimeStageId: RuntimeStageId,
): CommitView[] {
  const start = index.byRuntimeStageId.get(startRuntimeStageId);
  if (!start) return [];
  // L8.2 Panel 1 must-fix: dropped the `hops < cap` counter. The
  // visited-set IS the real cycle defense — it guarantees each
  // commitIdx is dequeued AT MOST ONCE, so the loop body executes
  // ≤ `index.commits.length` times by construction. The old `hops`
  // counter could short-circuit BEFORE the visited-set saturated in
  // dense-data graphs (every commit reads from every prior), dropping
  // legitimate work. Visited-set + head-index queue is sufficient and
  // correct.
  const visitedIdx = new Set<number>([start.commitIdx]);
  const queue: number[] = [start.commitIdx];
  const collectedIdxs = new Set<number>([start.commitIdx]);
  let head = 0;
  while (head < queue.length) {
    const cur = index.commits[queue[head++]!];
    if (!cur) continue;
    for (const dep of cur.dataDependencies) {
      if (dep.sourceCommitIdx === null) continue;
      if (visitedIdx.has(dep.sourceCommitIdx)) continue;
      visitedIdx.add(dep.sourceCommitIdx);
      collectedIdxs.add(dep.sourceCommitIdx);
      queue.push(dep.sourceCommitIdx);
    }
  }
  // Return commits ordered by commitIdx ascending (chronological).
  return Array.from(collectedIdxs)
    .sort((a, b) => a - b)
    .map((idx) => index.commits[idx]!)
    .filter((c): c is CommitView => c !== undefined);
}
