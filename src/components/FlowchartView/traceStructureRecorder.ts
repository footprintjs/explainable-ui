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

import type { Node, Edge } from "@xyflow/react";
import { createNotifier } from "./_internal/notifyChange";
import { devWarn } from "./_internal/devWarn";
import type { StageId } from "./_internal/keys";
import { asStageId } from "./_internal/keys";
import { walkSubflowSpecInto } from "./_internal/walkSubflowSpecInto";

export type { StageId, RuntimeStageId } from "./_internal/keys";

// ─────────────────────────────────────────────────────────────────────────────
// Local type aliases mirroring footprintjs/StructureRecorder
// ─────────────────────────────────────────────────────────────────────────────
//
// Rationale for redefining these here instead of `import type` from
// 'footprintjs': footprint-explainable-ui has no `footprintjs` dependency
// declared in package.json (intentional — consumers wire it). So we mirror
// the public interface shape. If footprintjs changes the StructureRecorder
// interface, this module's types must update in lockstep — tracked by the
// type-conformance test in `test/unit/traceStructureRecorder.test.ts`.

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
export interface MinimalStructureRecorder {
  readonly id: string;
  onStageAdded?(event: StageAddedEvent): void;
  onEdgeAdded?(event: EdgeAddedEvent): void;
  onLoopEdgeAdded?(event: LoopEdgeAddedEvent): void;
  onDeciderComplete?(event: DeciderCompleteEvent): void;
  onSubflowMounted?(event: SubflowMountedEvent): void;
}

// ─────────────────────────────────────────────────────────────────────────────
// xyflow node + edge data shapes
// ─────────────────────────────────────────────────────────────────────────────

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
export interface TraceNodeData extends Record<string, unknown> {
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
export interface TraceEdgeData extends Record<string, unknown> {
  kind: EdgeKind | "loop";
  label?: string;
}

export type TraceNode = Node<TraceNodeData>;
export type TraceEdge = Edge<TraceEdgeData>;

export interface TraceGraph {
  nodes: TraceNode[];
  edges: TraceEdge[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Factory
// ─────────────────────────────────────────────────────────────────────────────

export interface TraceStructureRecorderHandle {
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

export interface CreateTraceStructureRecorderOptions {
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

export function createTraceStructureRecorder(
  options: CreateTraceStructureRecorderOptions = {},
): TraceStructureRecorderHandle {
  const id = options.id ?? "trace-structure";
  const onChange = options.onChange;

  let nodes: TraceNode[] = [];
  let edges: TraceEdge[] = [];
  // Indexes — O(1) lookup for decider-completion + subflow-mounted updates.
  const nodeIndex = new Map<string, number>();
  const seenEdgeIds = new Set<string>();
  // L8.0 — per-node prev/next indexes maintained as edges arrive. The
  // arrays land on `TraceNode.data.prevIds` / `data.nextIds` so basic
  // TraceGraph consumers get convergence-correct neighbor info "for
  // free" (no separate NodeView translator needed for chart rendering).
  const prevIdsOf = new Map<string, StageId[]>();
  const nextIdsOf = new Map<string, StageId[]>();
  // Pub-sub + version via shared infra (microtask-batched listener fan-out).
  const notifier = createNotifier("traceStructureRecorder");

  function notifyChange(): void {
    if (onChange) {
      try {
        onChange({ nodes, edges });
      } catch (err) {
        devWarn(
          () => "[traceStructureRecorder] onChange callback threw — isolated.",
          err,
        );
      }
    }
    notifier.notify();
  }

  function upsertNode(node: TraceNode): void {
    const existing = nodeIndex.get(node.id);
    if (existing !== undefined) {
      // Merge: later events may carry richer data (e.g., onDeciderComplete
      // → branchIds). Preserve any fields the new event didn't set.
      nodes[existing] = {
        ...nodes[existing],
        ...node,
        data: { ...nodes[existing]!.data, ...node.data },
      };
    } else {
      nodeIndex.set(node.id, nodes.length);
      nodes.push(node);
    }
  }

  function pushEdge(edge: TraceEdge): void {
    // Dedupe by id — the seed replay path could otherwise double-add
    // if a consumer attaches the same recorder twice (allowed by design,
    // but the graph should still be sane).
    if (seenEdgeIds.has(edge.id)) return;
    seenEdgeIds.add(edge.id);
    edges.push(edge);

    // L8.0 — maintain prev/next indexes. Loop back-edges do NOT
    // contribute (invariant I1: loops are visual annotations only).
    const kind = edge.data?.kind;
    if (kind === "loop") return;
    const source = asStageId(edge.source);
    const target = asStageId(edge.target);
    const nextArr = nextIdsOf.get(source) ?? [];
    nextArr.push(target);
    nextIdsOf.set(source, nextArr);
    const prevArr = prevIdsOf.get(target) ?? [];
    prevArr.push(source);
    prevIdsOf.set(target, prevArr);

    // Sync the index changes onto the LIVE node-data arrays so
    // consumers reading `node.data.prevIds`/`nextIds` see fresh values
    // after each edge event. We mutate in place rather than re-cloning
    // the node — `getGraph()` returns defensive copies anyway.
    syncNeighborsOnto(source);
    syncNeighborsOnto(target);
  }

  function syncNeighborsOnto(stageId: StageId): void {
    const idx = nodeIndex.get(stageId);
    if (idx === undefined) return; // node not yet announced — will sync at onStageAdded
    const node = nodes[idx]!;
    // L8.0 panel must-fix: ATOMIC REPLACE — copy the arrays from the
    // index, don't share the map's array refs. A consumer using
    // `getGraphRef()` who caches `node.data.prevIds` would otherwise
    // see their cached array silently grow when a new edge fires.
    // The slice() cost is one allocation per edge per touched node —
    // negligible vs. the consumer-safety win.
    const prevs = prevIdsOf.get(stageId);
    const nexts = nextIdsOf.get(stageId);
    node.data.prevIds = prevs ? prevs.slice() : [];
    node.data.nextIds = nexts ? nexts.slice() : [];
  }

  const recorder: MinimalStructureRecorder = {
    id,
    onStageAdded(event) {
      const spec = event.spec;
      const type = event.type;
      const isDecider = type === "decider" || type === "selector";
      const isFork = type === "fork";
      const isStreaming = type === "streaming";
      const isSubflow = !!spec.isSubflowRoot;

      const stageId = asStageId(event.stageId);
      const data: TraceNodeData = {
        label: event.name,
        isDecider,
        isFork,
        isStreaming,
        isSubflow,
        // L8.0 — seed prev/next from any edges that already fired
        // pointing AT this node. Convergence case: a fork-branch edge
        // from LoadOrder fires BEFORE the child's onStageAdded; this
        // line ensures the child's prevIds picks up the back-pointer.
        // Atomic copy (not shared ref) — see `syncNeighborsOnto` for
        // the panel-flagged consumer-safety rationale.
        prevIds: (prevIdsOf.get(stageId) ?? []).slice(),
        nextIds: (nextIdsOf.get(stageId) ?? []).slice(),
      };
      if (spec.description !== undefined) data.description = spec.description;
      if (spec.icon !== undefined) data.icon = spec.icon;
      if (spec.subflowId !== undefined) data.subflowId = spec.subflowId;
      if (spec.isLazy === true) data.isLazy = true;
      if (event.isPausable === true) data.isPausable = true;
      // subflowOf gets set RETROACTIVELY in onSubflowMounted (the
      // builder fires inner-stage events BEFORE the mount event, so
      // we can't tag at stage-add time — we tag at mount time by
      // identifying untagged disconnected subgraphs).

      upsertNode({
        id: event.stageId,
        type: "stage",
        // No layout here — downstream consumer applies positions.
        position: { x: 0, y: 0 },
        data,
      });
      notifyChange();
    },

    onEdgeAdded(event) {
      const edgeId = `${event.from}->${event.to}:${event.kind}${event.label ? `:${event.label}` : ""}`;
      const data: TraceEdgeData = { kind: event.kind };
      if (event.label !== undefined) data.label = event.label;
      const edge: TraceEdge = {
        id: edgeId,
        source: event.from,
        target: event.to,
        data,
      };
      if (event.label !== undefined) edge.label = event.label;
      pushEdge(edge);
      notifyChange();
    },

    onLoopEdgeAdded(event) {
      const edgeId = `${event.from}->${event.to}:loop`;
      pushEdge({
        id: edgeId,
        source: event.from,
        target: event.to,
        data: { kind: "loop" },
      });
      notifyChange();
    },

    onDeciderComplete(event) {
      // Patch the already-added decider node with its sealed branch info.
      const existing = nodeIndex.get(event.decider);
      if (existing === undefined) {
        // The decider node SHOULD have been added via onStageAdded
        // before its branches were declared. If this fires for an
        // unknown id, the upstream builder reordered events —
        // visualisation will silently degrade. Warn in dev so the bug
        // is visible at its source.
        devWarn(
          () =>
            `[traceStructureRecorder] onDeciderComplete fired for unknown stageId "${event.decider}" — branch metadata dropped. Did the upstream fire onStageAdded for this id first?`,
        );
        return;
      }
      const node = nodes[existing]!;
      const data: TraceNodeData = {
        ...node.data,
        branchIds: event.branchIds,
      };
      if (event.defaultBranch !== undefined) data.defaultBranch = event.defaultBranch;
      nodes[existing] = { ...node, data };
      notifyChange();
    },

    onSubflowMounted(event) {
      // The mount node was already announced via `onStageAdded`; here
      // we patch in the subflow-specific data fields, then materialize
      // the subflow's inner structure.
      const existing = nodeIndex.get(event.rootStageId);
      if (existing === undefined) {
        devWarn(
          () =>
            `[traceStructureRecorder] onSubflowMounted fired for unknown rootStageId "${event.rootStageId}" (subflowId="${event.subflowId}") — subflow metadata dropped. Did the upstream fire onStageAdded for the mount node first?`,
        );
        return;
      }
      const node = nodes[existing]!;
      const data: TraceNodeData = {
        ...node.data,
        isSubflow: true,
        subflowId: event.subflowId,
      };
      if (event.isLazy === true) data.isLazy = true;
      nodes[existing] = { ...node, data };

      // Eager mounts (footprintjs v6.0+): walk the full subflow spec
      // delivered on the event to emit inner nodes + edges with
      // `subflowOf` set directly. Lazy mounts arrive with no spec —
      // their internal structure isn't known until the resolver runs
      // at runtime; the mount node alone is rendered (consumer apps
      // can subscribe to runtime events to fill in detail if desired).
      const subflowPath = event.subflowPath ?? event.subflowId;
      if (event.subflowSpec) {
        // Cast: type is `unknown` at the event boundary (see
        // SubflowMountedEvent JSDoc); walkSubflowSpecInto accepts
        // the duck-typed structural shape it actually traverses.
        walkSubflowSpecInto(event.subflowSpec as Parameters<typeof walkSubflowSpecInto>[0], subflowPath, {
          upsertNode,
          pushEdge,
        });
      }
      notifyChange();
    },
  };

  return {
    recorder,
    getGraph(): TraceGraph {
      return {
        nodes: nodes.map((n) => ({ ...n, data: { ...n.data } })),
        edges: edges.map((e) => ({ ...e, data: e.data ? { ...e.data } : undefined })),
      };
    },
    getGraphRef(): Readonly<TraceGraph> {
      return { nodes, edges };
    },
    subscribe: notifier.subscribe,
    version: notifier.version,
    reset(): void {
      nodes = [];
      edges = [];
      nodeIndex.clear();
      seenEdgeIds.clear();
      prevIdsOf.clear();
      nextIdsOf.clear();
      // Why `reset()` does NOT bump version or notify listeners:
      // a notify here would cause `<TraceFlow recorder={handle} />`
      // to re-render with an empty graph for one frame, then re-render
      // again when the next builder event fires — visible flicker for
      // users who reset between builds. The recommended pattern is to
      // recycle the recorder OUTSIDE the React tree (e.g., via a
      // factory hook keyed on a "build epoch" so React unmounts and
      // re-mounts <TraceFlow> across builds). See `subscribe()` JSDoc
      // for the consumer-facing recipe.
    },
  };
}
