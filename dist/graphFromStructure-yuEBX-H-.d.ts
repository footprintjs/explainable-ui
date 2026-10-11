import * as react from 'react';
import { CSSProperties } from 'react';
import { Node, Edge, NodeTypes, EdgeTypes } from '@xyflow/react';
import { Stop, FoldedState } from 'foottrace';

/** Snapshot of a single pipeline stage — the core data shape for all components. */
interface StageSnapshot {
    /** Internal stage identifier */
    stageName: string;
    /** Human-readable label */
    stageLabel: string;
    /** Unique per-execution-step identifier. Format: [subflowPath/]stageId#executionIndex. Key for recorder Map lookup. */
    runtimeStageId?: string;
    /** Accumulated state. When recordState is unavailable, this is an empty
     * compatibility placeholder, not proof that the recorded state was empty. */
    memory: Record<string, unknown>;
    /** Canonical record evidence. Absent for caller-supplied createSnapshots data.
     * Keep every basis/redaction/gap qualifier when displaying or copying state. */
    recordState?: {
        readonly status: "available";
        /** Selection-local label, not a globally unique run/iteration ID. */
        readonly sourceId: string;
        readonly stop: Stop;
        readonly current: FoldedState;
        readonly previous: FoldedState;
    } | {
        readonly status: "unavailable";
        readonly sourceId: string;
        readonly reason: "unsupported-source" | "stage-not-recorded" | "reader-refused";
        readonly message: string;
    };
    /** Narrative text describing what happened */
    narrative: string;
    /** When this stage started (ms from pipeline start) */
    startMs: number;
    /** How long this stage took (ms) */
    durationMs: number;
    /** Execution status */
    status?: "pending" | "active" | "done" | "error";
    /** Human-readable description of what this stage does */
    description?: string;
    /** Subflow identifier (when this stage is inside a subflow) */
    subflowId?: string;
    /** Subflow execution result — present on stages that ran a subflow. */
    subflowResult?: unknown;
}
/** Structured narrative entry — preserves type info for semantic rendering. */
interface NarrativeEntry {
    type: 'stage' | 'step' | 'condition' | 'fork' | 'selector' | 'subflow' | 'loop' | 'break' | 'error' | 'pause' | 'resume' | 'emit'
    /** One failed attempt at a stage that declares a `retry` policy — the
     *  stage is about to run again. Attempt telemetry, not an outcome: the
     *  stage may still succeed, so this is warning-weight, not error-weight.
     *  Emitted by footprintjs >= 9.15.0, nested inside its own stage. */
     | 'retry';
    text: string;
    depth: number;
    stageName?: string;
    /** Stable stage identifier (matches spec node id). Primary key for UI sync. */
    stageId?: string;
    /** Unique per-execution-step identifier. Format: [subflowPath/]stageId#executionIndex.
     *  Used for exact time-travel sync (preferred over stageId for progressive reveal). */
    runtimeStageId?: string;
    /** Subflow ID when this entry was generated inside a subflow. */
    subflowId?: string;
    /** Direction for subflow entries: 'entry' when entering, 'exit' when leaving. */
    direction?: 'entry' | 'exit';
    stepNumber?: number;
    /** Scope key that was read or written. Only present on 'step' entries. */
    key?: string;
    /** Raw value from the scope event. Only present on 'step' entries. */
    rawValue?: unknown;
}
/** Component size variants */
type Size = "compact" | "default" | "detailed";
/** Common props shared by all visualization components */
interface BaseComponentProps {
    /** Size variant */
    size?: Size;
    /** Strip all built-in styles — bring your own */
    unstyled?: boolean;
    /** Additional CSS class name */
    className?: string;
    /** Inline style overrides */
    style?: React.CSSProperties;
}

/**
 * Branded types for translator key discipline.
 *
 * The footprintjs/trace contract uses two distinct identity strings:
 *
 *   - **StageId**: the stable identifier the user picks at build time
 *     (e.g. `'load-order'`, `'check-inventory'`). Identity per chart spec.
 *
 *   - **RuntimeStageId**: `[subflowPath/]stageId#executionIndex` — the
 *     per-execution identity. A loop visiting the same stage 3 times
 *     produces 3 distinct RuntimeStageIds with the same StageId base.
 *
 * Translator outputs index per-stage data by StageId (`Map<StageId, ...>`)
 * AND per-execution data by RuntimeStageId (`Map<RuntimeStageId, ...>`).
 * Both are `string` at runtime — TypeScript can't distinguish them
 * without help. Branded types make `byStageId.get(runtimeStageId)` a
 * **compile-time error** instead of a silent `undefined` at runtime.
 *
 * Why branded types over wrapper classes
 * ──────────────────────────────────────
 *   - Zero runtime cost (the brand exists only at the type level)
 *   - JSON-serializable as-is (no `toJSON` glue needed)
 *   - Interop with consumer code that uses raw `string` is one cast
 *     (`stageId as StageId`) when the consumer is sure of the source.
 *
 * Usage pattern
 * ─────────────
 * ```ts
 * import type { StageId, RuntimeStageId } from './_internal/keys';
 *
 * // In a translator, when accepting input from a footprintjs event:
 * const sid = event.stageId as StageId;
 * const rsid = event.traversalContext.runtimeStageId as RuntimeStageId;
 *
 * // In a consumer reading from the index:
 * const node = index.byStageId.get(stageId);          // typechecks
 * const node = index.byStageId.get(runtimeStageId);   // TS ERROR ✓
 * ```
 *
 * Helper to derive a StageId from a RuntimeStageId — strips `#N` suffix
 * and optional subflow path. **Use only for DISPLAY**, NEVER for matching
 * commitLog stageIds (see invariant I3 in `traceStructureRecorder.ts`).
 */
/** Stable per-spec identifier (e.g. `'load-order'`). */
type StageId = string & {
    readonly __brand: "StageId";
};
/** Per-execution identifier (e.g. `'load-order#0'` or `'sf-foo/inner#3'`). */
type RuntimeStageId = string & {
    readonly __brand: "RuntimeStageId";
};
/**
 * Tag a raw string as a `StageId`. Use at translator boundaries when
 * ingesting from a footprintjs event payload (the source guarantees
 * the string IS a stage id). Zero runtime cost.
 */
declare function asStageId(s: string): StageId;
/**
 * Tag a raw string as a `RuntimeStageId`. Use at translator boundaries
 * when ingesting from a `traversalContext.runtimeStageId`. Zero
 * runtime cost.
 */
declare function asRuntimeStageId(s: string): RuntimeStageId;

/**
 * traceStructureRecorder — event-driven xyflow Node[] + Edge[] collector.
 *
 * Implements footprintjs v6.0+ `StructureRecorder` interface. Accumulates
 * an unpositioned graph (xyflow node + edge shape) as the chart is being
 * built — no spec tree walk required.
 *
 * Why event-driven
 * ────────────────
 *   The recorder fires SYNCHRONOUSLY at every spec-mutation moment during
 *   construction. By the time `.build()` returns, the recorder's
 *   `getGraph()` returns the complete graph — zero extra walking
 *   (the "collect during traversal, never post-process" rule footprintjs
 *   documents in its core principle).
 *
 *   Bonus: the same recorder shape can drive incremental UI updates if
 *   the builder is constructed asynchronously (e.g., a UI builder where
 *   each "add stage" click re-renders the live graph).
 *
 * Layout is a separate concern
 * ────────────────────────────
 *   This module produces UNPOSITIONED nodes (no `position` field set;
 *   xyflow defaults to `{x: 0, y: 0}`). Apply a layout algorithm
 *   downstream — either:
 *
 *     - a graph algorithm (dagre / elk / d3-force)
 *     - manual positioning via your own walk over `recorder.getGraph()`
 *
 *   The `<TraceFlow>` component wires a default BFS layout.
 *
 * @example
 * ```ts
 * import { flowChart } from 'footprintjs';
 * import { createTraceStructureRecorder } from 'footprint-explainable-ui/flowchart';
 *
 * const trace = createTraceStructureRecorder();
 * const chart = flowChart('seed', fn, 'seed', {
 *   structureRecorders: [trace.recorder],
 * })
 *   .addFunction('a', fnA, 'a')
 *   .build();
 *
 * const { nodes, edges } = trace.getGraph();
 * // → nodes: [{ id: 'seed', data: { label: 'seed', ... } }, { id: 'a', ... }]
 * // → edges: [{ id: 'seed->a', source: 'seed', target: 'a', data: { kind: 'next' } }]
 *
 * <ReactFlow nodes={layout(nodes)} edges={edges} />
 * ```
 */

type StructureNodeType = "stage" | "decider" | "selector" | "fork" | "streaming" | "subflow" | "loop";
interface StructureSpecRef {
    readonly id: string;
    readonly name: string;
    readonly type?: StructureNodeType;
    readonly description?: string;
    readonly icon?: string;
    readonly isSubflowRoot?: boolean;
    readonly subflowId?: string;
    readonly isLazy?: boolean;
    /**
     * How the REAL engine flags decider/selector stages: footprintjs fires
     * `onStageAdded` with `type: 'stage'` and stamps `hasDecider: true` /
     * `hasSelector: true` on the spec instead of `type: 'decider'|'selector'`
     * (pinned by the U2 golden fixtures against fp 9.5.0). Both signals must
     * feed `TraceNodeData.isDecider` or real traces render decision stages
     * as plain rectangles.
     */
    readonly hasDecider?: boolean;
    readonly hasSelector?: boolean;
    readonly [key: string]: unknown;
}
interface StageAddedEvent {
    readonly stageId: string;
    readonly name: string;
    readonly type: StructureNodeType;
    readonly isPausable?: boolean;
    readonly spec: StructureSpecRef;
}
type EdgeKind = "next" | "fork-branch" | "decision-branch";
interface EdgeAddedEvent {
    readonly from: string;
    readonly to: string;
    readonly kind: EdgeKind;
    readonly label?: string;
}
interface LoopEdgeAddedEvent {
    readonly from: string;
    readonly to: string;
}
interface DeciderCompleteEvent {
    readonly decider: string;
    readonly type: "decider" | "selector";
    readonly branchIds: readonly string[];
    readonly defaultBranch?: string;
}
interface SubflowMountedEvent {
    readonly subflowId: string;
    readonly subflowName: string;
    readonly rootStageId: string;
    readonly isLazy?: boolean;
    /**
     * The mounted subflow's complete spec — added in footprintjs v6.0
     * (proposal #001). Present for eager mounts, UNDEFINED for lazy
     * mounts (the subflow isn't resolved yet at mount-event-fire-time).
     * When present, the consumer walks it to materialize inner nodes +
     * edges directly with `subflowOf` set — no retroactive tagging
     * needed.
     *
     * Typed as `unknown` because the upstream `SerializedPipelineStructure`
     * shape has no index signature and we want to stay loosely-coupled
     * (see top-of-file rationale for the no-`footprintjs`-dep boundary).
     * `walkSubflowSpecInto` accepts the duck-typed shape it actually
     * walks.
     */
    readonly subflowSpec?: unknown;
    /**
     * Local mount id within the parent (matches `subflowId` for top-level
     * mounts; composed `'parent/child'` for nested). Tagged onto every
     * inner stage's `data.subflowOf` during the walk.
     */
    readonly subflowPath?: string;
}
/**
 * Minimal StructureRecorder interface — mirrors footprintjs v6.0+.
 *
 * Named with the `Minimal` prefix to make the local-mirror nature
 * explicit at consumer call sites — a consumer importing both this
 * type and the upstream `StructureRecorder` from `footprintjs` won't
 * collide, and code reviewers see at a glance which boundary the type
 * crosses.
 *
 * The upstream `footprintjs.StructureRecorder` is structurally
 * compatible (this type's shape is a subset of upstream's), so passing
 * an instance of this to `flowChart(..., { structureRecorders: [...] })`
 * typechecks cleanly.
 */
interface MinimalStructureRecorder {
    readonly id: string;
    onStageAdded?(event: StageAddedEvent): void;
    onEdgeAdded?(event: EdgeAddedEvent): void;
    onLoopEdgeAdded?(event: LoopEdgeAddedEvent): void;
    onDeciderComplete?(event: DeciderCompleteEvent): void;
    onSubflowMounted?(event: SubflowMountedEvent): void;
}
/**
 * Per-node data attached to the xyflow `Node`. The built-in `StageNode`
 * renderer reads the named fields below.
 *
 * Consumer extension: this type EXTENDS `Record<string, unknown>` so
 * you can attach custom fields without TypeScript fighting you. Pair
 * this with `<TraceFlow nodeTypes={{ stageNode: MyNode }} />` (or push
 * nodes with `type: 'myCustomKind'`) to render those custom fields
 * however you want. The built-in `StageNode` ignores fields it doesn't
 * recognize, so adding consumer fields is non-breaking even if you
 * keep the default renderer.
 */
interface TraceNodeData extends Record<string, unknown> {
    label: string;
    isDecider: boolean;
    isFork: boolean;
    isSubflow: boolean;
    /** True when the event carried `type: 'streaming'` (the spec was added
     *  via `addStreamingFunction`). Renderers that style streaming stages
     *  distinctly key on this flag. */
    isStreaming: boolean;
    description?: string;
    icon?: string;
    subflowId?: string;
    isLazy?: boolean;
    isPausable?: boolean;
    /** Visual emphasis hint — `hero` (prominent) / `muted` (recedes). Set by
     *  the consumer's graph builder from its own semantics; the renderer styles
     *  off it without any domain knowledge. */
    emphasis?: "hero" | "muted";
    /** Size tier — scales the card; must match the layout's node-size resolver. */
    size?: "sm" | "md" | "lg";
    /** Set later by `onDeciderComplete` when the decider's branch list is
     *  sealed. Useful for renderers that want to render decider with a
     *  branch-count badge. */
    branchIds?: readonly string[];
    defaultBranch?: string;
    /**
     * The subflow this node belongs to, OR `undefined` for top-level
     * parent-chart stages. Tracked via a stack-based heuristic during
     * event ingestion:
     *
     *   - Push on `onSubflowMounted({subflowId, rootStageId})` →
     *     top-of-stack = `{subflowId, mountStageId}`
     *   - `onStageAdded` tags new nodes with the top-of-stack `subflowId`
     *     (the mount node itself stays UNtagged — it's part of the parent
     *     chain)
     *   - Pop on `onEdgeAdded` where `from === mount.id` (a mount's
     *     outgoing edge to a sibling means the parent chain has resumed);
     *     the wrongly-tagged target node is re-tagged to the parent scope
     *
     * Mount nodes (where `isSubflow=true`) have `subflowOf` reflecting
     * their OWN parent context, NOT the subflow they mount. So a parent's
     * mount node has `subflowOf=undefined` (top-level parent), and the
     * subflow's INTERNAL stages have `subflowOf=<mount.subflowId>`.
     *
     * Renderers use this to filter the chart by drill-down level: show
     * only nodes where `subflowOf === currentDrillSubflowId` (undefined
     * for top-level view, mount.subflowId after drilling in).
     */
    subflowOf?: string;
    /**
     * **L8.0 — STRUCTURAL prev/next**: stage ids that lead into / out of
     * this node, derived live from incoming/outgoing edges. Excludes
     * `loop` back-edges (visual only — per invariant I1).
     *
     * Convergence-correct: a fork-join node carries an ENTRY per branch
     * child (e.g., `FinalizeOrder.prevIds = ['CheckInventory', 'RunFraudCheck']`).
     *
     * "Structural" qualifier: this is the chart-SHAPE prev/next, not
     * runtime execution order. For runtime ancestry use `CommitView`
     * fields on `CommitFlowIndex` (L8.2).
     */
    prevIds: StageId[];
    nextIds: StageId[];
}
/**
 * Per-edge data attached to the xyflow `Edge`. The default edge
 * renderer reads `kind` (and `label`).
 *
 * Consumer extension: same pattern as `TraceNodeData` — extra fields
 * pass through unchanged. Pair with `<TraceFlow edgeTypes={...} />`
 * to render custom edges (e.g., a "retried" edge with a count badge).
 */
interface TraceEdgeData extends Record<string, unknown> {
    kind: EdgeKind | "loop";
    label?: string;
    /**
     * Node ids this edge CONTRACTED THROUGH — stamped by `collapseTraceGraph`
     * when hidden nodes are removed and their paths re-connected. Lets a
     * renderer keep a time cursor visible when it stands on a hidden node:
     * the edge that stands in for that node lights instead (see
     * `edgeCarriesCursor`). Absent on ordinary edges.
     */
    via?: readonly string[];
}
type TraceNode = Node<TraceNodeData>;
type TraceEdge = Edge<TraceEdgeData>;
interface TraceGraph {
    nodes: TraceNode[];
    edges: TraceEdge[];
}
interface TraceStructureRecorderHandle {
    /** The recorder to register via `flowChart(..., { structureRecorders: [handle.recorder] })`
     *  or `.attachStructureRecorder(handle.recorder)`. */
    recorder: MinimalStructureRecorder;
    /** Returns a defensive copy of the current graph state. Safe to call
     *  multiple times; safe to mutate the returned arrays without affecting
     *  the recorder's internal state. */
    getGraph(): TraceGraph;
    /** Direct read-only access for hot-path consumers (Lens slider scrubbing).
     *  Returns the LIVE internal arrays — do NOT mutate. Prefer `getGraph()`
     *  unless you measure a performance cost. */
    getGraphRef(): Readonly<TraceGraph>;
    /**
     * Subscribe to graph-change notifications. Pub-sub model — multiple
     * listeners can subscribe; each fires after every event that mutates
     * the graph (per-event, NOT batched). Returns an unsubscribe function.
     * Designed for React's `useSyncExternalStore` consumption.
     *
     * Listeners are NOT invoked during `reset()`. **Consumer guidance**:
     * if you need to clear a live `<TraceFlow recorder={handle} />`
     * mid-mount, either (a) unmount the component before calling
     * `reset()` and re-mount after, OR (b) drive a fresh recorder
     * instance via state. See `reset()` JSDoc for the rationale.
     */
    subscribe(listener: () => void): () => void;
    /**
     * Monotonically-increasing version counter — bumps once per
     * graph-mutating event. Pair with `getGraph()` in
     * `useSyncExternalStore` snapshot equality:
     * ```ts
     * const version = useSyncExternalStore(handle.subscribe, () => handle.version());
     * const graph = useMemo(() => handle.getGraph(), [version]);
     * ```
     * Avoids defensive-copy allocation on every render while keeping
     * React's identity-check happy.
     */
    version(): number;
    /** Reset the recorder for reuse across multiple builds. After this,
     *  the recorder behaves like a freshly-constructed instance. */
    reset(): void;
}
interface CreateTraceStructureRecorderOptions {
    /** Recorder id — surfaces in `StructureBuildError.recorderId` when
     *  the recorder throws. Defaults to `'trace-structure'`. Use distinct
     *  ids if you attach multiple instances. */
    id?: string;
    /** Optional callback fired after each event mutates the graph. Useful
     *  for incremental-render UIs (Lens) that want to re-render between
     *  builder operations. NOT invoked during the initial `attachStructureRecorder`
     *  seed replay; consumers can call `getGraph()` directly after attach. */
    onChange?: (graph: Readonly<TraceGraph>) => void;
}
declare function createTraceStructureRecorder(options?: CreateTraceStructureRecorderOptions): TraceStructureRecorderHandle;

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
interface MinimalFlowRecorder {
    readonly id: string;
    onStageExecuted?(event: RuntimeStageExecutedEvent): void;
    onError?(event: RuntimeErrorEvent): void;
    /** footprintjs >= 9.15.0. Without this hook a retried stage leaves NO mark
     *  on the chart — the whole reason retries were narrative-only before. */
    onStageRetry?(event: RuntimeStageRetryEvent): void;
    onRunStart?(event: RuntimeRunStartEvent): void;
    onRunEnd?(event: RuntimeRunEndEvent): void;
}
/**
 * One entry in the execution timeline. `<TracedFlow>` keys time-travel
 * scrubbing on the index into this array — at index `i`, all entries
 * `0..i-1` are "done", entry `i` is "active".
 */
interface RuntimeExecutionStep {
    /** `[subflowPath/]stageId#executionIndex` — universal key. */
    readonly runtimeStageId: string;
    /** Base stage id (without `#N`) — matches the `TraceGraph` node id. */
    readonly stageId: string;
    /** Human-readable label (from event.stageName). */
    readonly stageName: string;
    /** When this step recorded, in ms since recorder start. */
    readonly timestampMs: number;
}
interface RuntimeOverlay {
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
interface TraceRuntimeOverlayHandle {
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
interface CreateTraceRuntimeOverlayOptions {
    id?: string;
}
declare function createTraceRuntimeOverlay(options?: CreateTraceRuntimeOverlayOptions): TraceRuntimeOverlayHandle;
/**
 * Snapshot of overlay state AT a specific scrub index. Drives node
 * coloring in `<TracedFlow>`.
 */
interface RuntimeOverlaySlice {
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
declare function sliceOverlay(overlay: RuntimeOverlay, index: number): RuntimeOverlaySlice;

interface SubflowTreeEntry {
    /** Node name / identifier */
    name: string;
    /** Human-readable description */
    description?: string;
    /**
     * The mount node's id in the graph — the DRILL KEY. Unique even when the
     * same child chart is mounted twice, which `subflowId` and `name` are not
     * (see `_internal/subflowDrill.ts`). Hosts should drill with this.
     */
    nodeId?: string;
    /** Subflow ID (when this node represents a subflow) */
    subflowId?: string;
    /** Whether this node is a subflow root (has nested structure) */
    isSubflow?: boolean;
    /** Nested children (subflow stages) — always undefined in the
     *  current recorder-driven implementation; see file-level TODO. */
    children?: SubflowTreeEntry[];
}
interface SubflowTreeProps extends BaseComponentProps {
    /** Recorder-captured graph from `createTraceStructureRecorder().getGraph()`. */
    graph: TraceGraph;
    /** Currently active stage name (highlights in tree) */
    activeStage?: string | null;
    /** Set of completed stage names */
    doneStages?: Set<string>;
    /**
     * Called when a tree node is clicked. `nodeId` is the mount node's graph id
     * — the unambiguous drill key. Prefer it over `name`: two mounts of the
     * same child chart share a label, so drilling by name lands on whichever
     * one happens to be found first.
     */
    onNodeSelect?: (name: string, isSubflow: boolean, nodeId?: string) => void;
}
declare const SubflowTree: react.NamedExoticComponent<SubflowTreeProps>;

/**
 * TraceFlow — ReactFlow renderer driven by `createTraceStructureRecorder`.
 *
 * Two input modes (mutually exclusive):
 *
 *   1. **Live mode**: pass `recorder={traceHandle}`. The component
 *      subscribes via `useSyncExternalStore` to the recorder's
 *      pub-sub `subscribe()` API and re-renders as the builder runs.
 *      Ideal for incremental visualisation (Lens-style live chart
 *      construction).
 *
 *   2. **Static mode**: pass `graph={{ nodes, edges }}`. The component
 *      treats the graph as final and renders once. Ideal for post-build
 *      snapshots (Trace tab, docs site).
 *
 * Layout is pluggable:
 *
 *   - Pass a `layout` function `(graph) => positioned graph`. Default is
 *     a simple BFS tree walk (Y_STEP=100, X_SPREAD=200).
 *   - Pass the literal `"passthrough"` to skip layout when nodes are
 *     already pre-positioned by the caller.
 *
 * @example
 * ```tsx
 * import { createTraceStructureRecorder, TraceFlow } from 'footprint-explainable-ui/flowchart';
 * import { flowChart } from 'footprintjs';
 *
 * function MyTraceUI() {
 *   const trace = useMemo(() => createTraceStructureRecorder(), []);
 *   useEffect(() => {
 *     flowChart('seed', fn, 'seed', {
 *       structureRecorders: [trace.recorder],
 *     }).addFunction('a', fnA, 'a').build();
 *   }, [trace]);
 *   return <TraceFlow recorder={trace} />;
 * }
 * ```
 */

/** Layout function shape — takes a graph, returns a graph with positions set. */
type TraceFlowLayout = (graph: TraceGraph) => TraceGraph;
/**
 * Default tree-walk layout.
 *
 * Edge-kind semantics (critical for parity)
 * ─────────────────────────────────────────
 *   `fork-branch` + `decision-branch` edges are SIBLINGS at depth+1
 *   (centered under the parent). A `next` edge from a node that ALSO
 *   has branch edges is the "after convergence" target — its rank is
 *   `max(deepest branch subtree) + 1`, so it sits BELOW the fan-out,
 *   matching the legacy diamond layout.
 *
 *     LoadOrder (fork)
 *        ├── fork-branch → CheckInventory   (sibling, y+1)
 *        ├── fork-branch → RunFraudCheck    (sibling, y+1)
 *        └── next        → FinalizeOrder    (after convergence,
 *                                            below deepest sibling)
 *
 *   A `next` edge from a node with NO branch edges is a plain linear
 *   chain — target at depth+1.
 *
 *   `loop` back-edges DO NOT shape layout (they're scrub-time visual
 *   markers only).
 *
 * Limitations (documented; not bugs)
 * ──────────────────────────────────
 *   - Multi-root graphs render with the first-seen node as the visual
 *     root; orphans stack below.
 *   - Convergence where multiple branches join into a single node:
 *     the node is placed under its FIRST traversed branch (first-wins).
 *     For deep DAGs swap in a graph-layout library (dagre, elk).
 *   - Sibling x-positions are local to each parent's subtree; no
 *     global x-overlap detection across deep nested structures.
 */
declare const defaultTraceFlowLayout: TraceFlowLayout;
interface TraceFlowEdgeColors {
    next: string;
    forkBranch: string;
    decisionBranch: string;
    loop: string;
}
type TraceFlowSource = {
    recorder: TraceStructureRecorderHandle;
    graph?: never;
} | {
    graph: TraceGraph;
    recorder?: never;
};
type TraceFlowProps = BaseComponentProps & TraceFlowSource & {
    /** Layout function. Default: BFS tree walk. Pass the literal
     *  `"passthrough"` to skip layout when nodes already carry positions. */
    layout?: TraceFlowLayout | "passthrough";
    /** Per-kind edge color overrides. */
    edgeColors?: Partial<TraceFlowEdgeColors>;
    /** Node click handler — receives the node id. */
    onNodeClick?: (id: string) => void;
    /**
     * Consumer-supplied xyflow node types. Merged with the built-in
     * `{ stageNode: StageNode }` registry — keys you supply OVERRIDE
     * the default for that node type. Pass `{ stageNode: MyNode }` to
     * replace the default stage renderer entirely, or add new keys
     * for nodes you build yourself (any nodes you push into the
     * graph with `type: 'customKey'` will use your component).
     */
    nodeTypes?: NodeTypes;
    /**
     * Consumer-supplied xyflow edge types. Merged with no built-in
     * defaults — pass `{ myEdge: MyEdge }` to register custom edge
     * components for nodes/edges you build with `type: 'myEdge'`.
     */
    edgeTypes?: EdgeTypes;
    /**
     * Children rendered INSIDE the `<ReactFlow>` element, after the
     * built-in `<Background>`. Use this slot to mount xyflow
     * accessory components like `<Controls />`, `<MiniMap />`, or a
     * custom legend. If unset, only the default Background is rendered.
     *
     * @example
     * ```tsx
     * import { Controls, MiniMap } from '@xyflow/react';
     * <TraceFlow recorder={r}>
     *   <Controls />
     *   <MiniMap />
     * </TraceFlow>
     * ```
     */
    children?: react.ReactNode;
};
declare function TraceFlow(props: TraceFlowProps): react.JSX.Element;

/**
 * The one-word theme switch.
 *
 * Every component in this library paints from `--fp-*` variables whose
 * built-in fallbacks are DARK. Mounted inside a light app with nothing set,
 * a panel renders dark — correct by the rules, wrong on the page. Setting a
 * dozen variables by hand to fix that is not a first-try experience.
 *
 * `<Component theme="light" />` is that fix in one word: it stamps a full
 * preset as inline `--fp-*` variables on the component's own root, so
 * everything under it — including nested children — follows. It is the same
 * mechanism `<ExplainableShell traceTheme={{ mode }}>` uses; this module is
 * the single place that maps a mode to its palette.
 *
 * Precedence, from weakest to strongest:
 *   1. the components' hard-coded fallbacks (dark)
 *   2. `--fp-*` an ancestor sets (`<FootprintTheme>`, your own CSS)
 *   3. `theme="light" | "dark"` on the component  ← wins, because it is local
 *
 * So `theme` is a per-component override, not a replacement for
 * `<FootprintTheme tokens={...}>` — reach for the provider when you want one
 * palette for a whole tree, and for a custom palette rather than a preset.
 */

/** Light or dark. The whole switch. */
type ThemeMode = "dark" | "light";
/** Props mixin for components that accept the switch. */
interface ThemeModeProps {
    /**
     * Light or dark, in one word — applies the built-in preset as `--fp-*`
     * variables on this component's root. Omit to inherit whatever the page
     * (or a `<FootprintTheme>` ancestor) already set.
     */
    theme?: ThemeMode;
}
/**
 * CSS variables for a mode, ready to spread into a root element's `style`.
 * Returns `{}` for `undefined` so an unthemed component is byte-identical to
 * how it rendered before the prop existed.
 */
declare function themeModeVars(mode?: ThemeMode): CSSProperties;

/**
 * TracedFlow — runtime-overlay variant of `<TraceFlow>`.
 *
 * Pairs a build-time `TraceGraph` (from `createTraceStructureRecorder`)
 * with a runtime `RuntimeOverlay` (from `createTraceRuntimeOverlay`)
 * and a scrub index → renders an xyflow chart with per-node coloring
 * (done / active / error), per-edge highlighting (executed paths),
 * loop-edge side-routing, and subflow drill-down.
 *
 * The component is orchestration only. Each responsibility lives in
 * an extracted helper / hook (see `_internal/`):
 *
 *   - drill state .................. useSubflowDrill
 *   - measured viewport fitting .... ChartAutoRefit
 *   - graph filtering by drill ..... filterGraphForDrill
 *   - breadcrumb path .............. buildSubflowBreadcrumb
 *   - slice id normalization ....... normalizeSliceLeafIds
 *   - mount status aggregation ..... aggregateMountStatus
 *   - node / edge styling .......... toStageNodeWithOverlay + styleEdgeWithOverlay
 *   - breadcrumb UI ................ <SubflowBreadcrumbBar>
 *
 * @example
 * ```tsx
 * const trace = useMemo(() => createTraceStructureRecorder(), []);
 * const runtime = useMemo(() => createTraceRuntimeOverlay(), []);
 * // ... attach both to executor, run the chart ...
 * <TracedFlow
 *   graph={trace.getGraph()}
 *   overlay={runtime.getOverlay()}
 *   scrubIndex={sliderValue}
 *   onNodeClick={(stageId) => focusStage(stageId)}
 *   onSubflowChange={(mountId) => syncShellDrill(mountId)}
 * />
 * ```
 */

interface TracedFlowColors {
    /** Default (un-executed) node text + edge stroke. */
    default: string;
    /** Done — visually de-emphasised (lighter). */
    done: string;
    /** Active — current scrub position. */
    active: string;
    /** Error — node with recorded onError. */
    error: string;
    /** Loop back-edge color. */
    loop: string;
}
interface TracedFlowProps extends BaseComponentProps, ThemeModeProps {
    /** Build-time graph from `createTraceStructureRecorder().getGraph()`. */
    graph: TraceGraph;
    /** Runtime overlay from `createTraceRuntimeOverlay().getOverlay()`. */
    overlay?: RuntimeOverlay;
    /** Time-travel scrub index. Defaults to the last step (latest state). */
    scrubIndex?: number;
    /** Layout function. Default: BFS tree walk over the recorder graph. */
    layout?: TraceFlowLayout | "passthrough";
    /** Color overrides. */
    colors?: Partial<TracedFlowColors>;
    /** Node click handler — receives stage id. */
    onNodeClick?: (stageId: string) => void;
    /**
     * Fires when the chart drills into or out of a subflow (explicit
     * user click on a mount node, or a click on the chart's own
     * breadcrumb). Receives the mount stage id (drill in) or `null`
     * (pop back). Container shells use this to keep their data panels
     * in lock-step with the chart's drill state.
     */
    onSubflowChange?: (mountStageId: string | null) => void;
    /**
     * CONTROLLED drill scope — the mount node id to show the internals of,
     * or `null` for the top level. Pass it (together with
     * `onSubflowChange`) when the host owns the drill because it ALSO
     * drills from somewhere else — a subflow tree, a breadcrumb, a
     * deep-link. The chart then renders the host's scope instead of a
     * second, private one that can drift out of step with the panels
     * beside it. Omit for a standalone chart: the drill stays internal
     * and clicking a mount card just works.
     */
    currentSubflowId?: string | null;
    /**
     * Consumer-supplied xyflow node types. Merged with the built-in
     * `{ stageNode: StageNode }` registry — keys you supply OVERRIDE
     * the default for that node type. Pass `{ stageNode: MyNode }` to
     * replace the default stage renderer entirely, or add new keys
     * for custom node components you push into the graph.
     *
     * v0.20+ — overlay state is injected into custom nodes' `data`
     * fields too (`active`, `done`, `error`, `errorMessage`, `dimmed`,
     * `stepNumbers`, `retryAttempts`), so consumer renderers can style with
     * the same scrub-driven done/active/error semantics the bundled
     * `<StageNode>` uses — without re-implementing the overlay slice
     * derivation. Consumer `data` fields pass through untouched alongside.
     */
    nodeTypes?: NodeTypes;
    /**
     * Consumer-supplied xyflow edge types. Merged with no built-in
     * defaults — pass `{ myEdge: MyEdge }` to register custom edge
     * components for edges you push into the graph with `type: 'myEdge'`.
     */
    edgeTypes?: EdgeTypes;
    /**
     * Extra chart node ids to mark `active` SIMULTANEOUSLY at the current scrub
     * position, on top of the overlay's single active node. Lets a consumer light
     * a whole parallel cohort at one cursor (e.g. the lens lighting every branch
     * of a fork together). Works for BOTH stage and custom nodes. Defaults to
     * none — single-active behaviour is unchanged.
     */
    coActiveStageIds?: ReadonlySet<string>;
    /**
     * Dependency-CONE overlay (the variable backward slice painted on the
     * chart): a map of chart node id → BFS depth (0 = the slice anchor/writer).
     * Nodes NOT in the map dim to near-transparency; members re-light with a
     * staggered transition-delay by depth — causality walks BACKWARDS across
     * the chart when the cone changes. Edges with either endpoint outside the
     * cone dim too. `undefined`/`null` = no cone, byte-identical rendering.
     * Keys are chart node ids (the stage part of a runtimeStageId — strip
     * `#N` before passing).
     */
    sliceCone?: ReadonlyMap<string, number> | null;
    /**
     * Hide the nodes this predicate matches (a hidden subflow card takes its
     * drill-internals with it); edges re-connect THROUGH hidden nodes so every
     * surviving path still reads. The predicate is the CALLER's judgement — this
     * component special-cases no id convention. The pure transform behind it is
     * exported as `collapseTraceGraph` for callers that also need the hidden-id
     * list (to render an honest "N steps hidden" note — hiding without saying so
     * is the one way not to use this prop). Unset → nothing is hidden.
     */
    collapseNode?: (node: TraceNode) => boolean;
    /**
     * Subflow ids to render as GROUP CONTAINER boxes — the subflow's member
     * stages render NESTED inside the box (xyflow `parentId` + `extent`),
     * instead of behind a click-to-zoom DRILL card. Per-subflow choice: any
     * subflow id NOT listed keeps drilling. Default (unset): all drill —
     * existing behavior, nothing changes.
     */
    groupedSubflows?: readonly string[];
    /**
     * Wrap the ENTIRE chart in ONE main-chart container box (the Lens model:
     * the primitive you're viewing is always one box; subflows inside stay
     * drill cards). Pass a config object to enable + label it; omit for no
     * outer box. Composes AFTER drill-filtering, so when you drill into a
     * subflow the box reframes to that subflow's contents.
     */
    mainChartBox?: {
        label?: string;
        kind?: string;
    };
    /**
     * Children rendered INSIDE the `<ReactFlow>` element, after the
     * built-in `<Background>`. Use this slot to mount xyflow
     * accessory components like `<Controls />`, `<MiniMap />`, or a
     * custom legend. If unset, only the default Background is rendered.
     */
    children?: react.ReactNode;
}
declare function TracedFlow({ graph, overlay, scrubIndex, layout: layoutProp, colors: colorOverrides, onNodeClick, onSubflowChange, currentSubflowId: controlledSubflowId, collapseNode, groupedSubflows, mainChartBox, nodeTypes: userNodeTypes, edgeTypes: userEdgeTypes, coActiveStageIds, sliceCone, theme: themeMode, children, className, style, }: TracedFlowProps): react.JSX.Element;

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
 *   - **Retry attempts need the narrative.** A retried attempt commits
 *     nothing (footprintjs discards a failed attempt's staged writes), so
 *     the commit log cannot know a stage was attempted more than once. Pass
 *     the run's `narrativeEntries` — it records one `type: 'retry'` entry per
 *     failed attempt, stamped with the stage's runtimeStageId — and the
 *     rebuilt overlay carries the same `retryAttempts` a live recorder would
 *     have accumulated. Omit them and attempts are absent, not guessed.
 *   - **Subflow-internal steps are absent when the engine isolated them.**
 *     footprintjs keeps deep-subflow commits out of the run-level
 *     commitLog by design, so a recording of a chart with subflows yields
 *     overlay steps for the MOUNT stages, not their internals — the same
 *     stages the snapshot's own rail (`toVisualizationSnapshots`) shows.
 *     A live `createTraceRuntimeOverlay` sees both.
 */

/** Duck-typed input: any object carrying a footprintjs commit log —
 *  a whole `executor.getSnapshot()` or just `{ commitLog }`. */
interface SnapshotWithCommitLog {
    commitLog?: unknown;
}
/** The slice of a narrative entry this reader consumes — duck-typed so both
 *  footprintjs's `CombinedNarrativeEntry` and this library's `NarrativeEntry`
 *  fit without either side importing the other. */
interface NarrativeEntryLike {
    type?: unknown;
    runtimeStageId?: unknown;
}
interface OverlayFromSnapshotOptions {
    /**
     * The run's narrative entries — `executor.getNarrativeEntries()`, or a
     * recording's `narrativeEntries`. The ONLY post-hoc source of retry facts:
     * `onStageRetry` fires during a stage and leaves no trace in the commit
     * log, but the narrative keeps one `type: 'retry'` entry per failed
     * attempt. Optional: without it the overlay simply carries no attempt
     * facts (honest absence — never a guess).
     */
    readonly narrativeEntries?: readonly NarrativeEntryLike[] | null;
}
/**
 * Builds a `RuntimeOverlay` from a recorded run — the post-hoc twin of
 * `createTraceRuntimeOverlay()`. Pass the result straight to
 * `<TracedFlow overlay={...}>` or `<ExplainableShell runtimeOverlay={...}>`.
 *
 * Returns an empty overlay (no steps) for a missing or empty commit log —
 * an unrecorded run colours nothing, which is the truthful rendering.
 */
declare function overlayFromSnapshot(snapshot: SnapshotWithCommitLog | null | undefined, options?: OverlayFromSnapshotOptions): RuntimeOverlay;

/**
 * graphFromStructure — the chart, rebuilt from a SAVED structure.
 *
 * `createTraceStructureRecorder` collects the chart while footprintjs
 * BUILDS it. This is its post-hoc twin: hand it the `buildTimeStructure`
 * a chart carries (`chart.buildTimeStructure`, plain JSON) and it produces
 * the same `TraceGraph` — no builder, no live process, no agent framework.
 *
 * Why it exists
 * ─────────────
 * A recording is three things: `events`, `snapshot`, and `structure`.
 * The snapshot draws the memory panel, the story and the rail; only the
 * structure can draw the CHART. Until now the one spec→graph adapter in
 * the ecosystem was `structureGraphFromSpec` in `agentfootprint-lens`,
 * which reaches into `agentfootprint` for agent vocabulary — so a plain
 * footprintjs consumer had to install an agent framework to draw a saved
 * pipeline run. This is that adapter, with no agent semantics.
 *
 * ```ts
 * // Recording side (in the app that ran the pipeline):
 * const recording = {
 *   snapshot:  executor.getSnapshot(),
 *   structure: chart.buildTimeStructure,   // ← the chart. Nothing else can draw it.
 * };
 *
 * // Rendering side, anywhere later:
 * <ExplainableShell
 *   runtimeSnapshot={recording.snapshot}
 *   traceGraph={graphFromStructure(recording.structure)}
 * />
 * ```
 *
 * Same graph, same ids
 * ────────────────────
 * Node ids are the chart's own stage ids at the top level and
 * `subflowPath/stageId` inside a subflow — byte-identical to the live
 * recorder, which is what lets the runtime overlay (live OR
 * `overlayFromSnapshot`) light the right boxes. The events are replayed
 * into `createTraceStructureRecorder` itself rather than re-implemented,
 * so the two paths cannot drift: one graph builder, two front doors.
 *
 * What a saved structure cannot carry (honest absence — never invented)
 * ────────────────────────────────────────────────────────────────────
 *   - **A decider's `defaultBranch`.** footprintjs's live
 *     `onDeciderComplete` event names the fallback branch, but
 *     `SerializedPipelineStructure` has no field for it, so a rebuilt
 *     decider node carries `branchIds` without `defaultBranch`. Renderers
 *     that badge the default simply don't badge it.
 *   - **A lazy subflow's internals.** `isLazy` mounts resolve at run time;
 *     the saved structure holds the mount node alone, exactly as the live
 *     recorder saw it at build time.
 */

/**
 * The slice of footprintjs's `SerializedPipelineStructure` this walker
 * reads. Duck-typed on purpose — explainable-ui declares no `footprintjs`
 * dependency (see traceStructureRecorder.ts for the boundary rationale).
 */
interface SerializedStructureNode {
    readonly id: string;
    readonly name: string;
    readonly type?: "stage" | "decider" | "selector" | "fork" | "streaming" | "subflow" | "loop";
    readonly description?: string;
    readonly icon?: string;
    readonly hasDecider?: boolean;
    readonly hasSelector?: boolean;
    readonly branchIds?: readonly string[];
    readonly children?: readonly SerializedStructureNode[];
    readonly next?: SerializedStructureNode;
    readonly loopTarget?: string;
    readonly isLoopReference?: boolean;
    readonly isSubflowRoot?: boolean;
    readonly subflowId?: string;
    readonly subflowName?: string;
    readonly subflowStructure?: SerializedStructureNode;
    readonly isLazy?: boolean;
    readonly isPausable?: boolean;
    /** Structure-only: this branch rejoins at its OWN named stage instead of
     *  the shared convergence stage (an unequal-depth merge). */
    readonly convergeAt?: string;
    readonly [key: string]: unknown;
}
/**
 * Builds the chart's `TraceGraph` from a serialized `buildTimeStructure`.
 *
 * Pass the result to `<ExplainableShell traceGraph={...}>` or
 * `<TracedFlow graph={...}>`. Returns an EMPTY graph (`{nodes: [], edges: []}`)
 * when the input isn't a structure — a recording saved without its
 * structure draws no chart, which is the truthful rendering. Check
 * `graph.nodes.length` if you want to branch on that.
 */
declare function graphFromStructure(structure: unknown): TraceGraph;

export { createTraceRuntimeOverlay as A, type BaseComponentProps as B, type CreateTraceStructureRecorderOptions as C, createTraceStructureRecorder as D, defaultTraceFlowLayout as E, graphFromStructure as F, overlayFromSnapshot as G, sliceOverlay as H, type ThemeModeProps as I, type ThemeMode as J, type Size as K, themeModeVars as L, type MinimalFlowRecorder as M, type NarrativeEntry as N, type OverlayFromSnapshotOptions as O, type RuntimeOverlay as R, type StageSnapshot as S, type TraceGraph as T, type TraceFlowLayout as a, type TraceNode as b, type TraceEdgeData as c, type TraceStructureRecorderHandle as d, type RuntimeStageId as e, type StageId as f, type CreateTraceRuntimeOverlayOptions as g, type TraceRuntimeOverlayHandle as h, type MinimalStructureRecorder as i, type RuntimeExecutionStep as j, type RuntimeOverlaySlice as k, type SerializedStructureNode as l, type SnapshotWithCommitLog as m, SubflowTree as n, type SubflowTreeEntry as o, type SubflowTreeProps as p, type TraceEdge as q, TraceFlow as r, type TraceFlowEdgeColors as s, type TraceFlowProps as t, type TraceNodeData as u, TracedFlow as v, type TracedFlowColors as w, type TracedFlowProps as x, asRuntimeStageId as y, asStageId as z };
