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

import type * as React from "react";
import { useMemo, useCallback, useSyncExternalStore } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  MarkerType,
} from "@xyflow/react";
import type { Node, Edge, NodeTypes, EdgeTypes } from "@xyflow/react";
import type {
  TraceGraph,
  TraceNode,
  TraceEdge,
  TraceStructureRecorderHandle,
} from "./traceStructureRecorder";
import { StageNode } from "../StageNode";
import type { StageNodeData } from "../StageNode";
import { rawDefaults } from "../../theme/tokens";
import type { BaseComponentProps } from "../../types";

// ─────────────────────────────────────────────────────────────────────────────
// Layout
// ─────────────────────────────────────────────────────────────────────────────

const Y_STEP = 100;
const X_SPREAD = 200;

/** Layout function shape — takes a graph, returns a graph with positions set. */
export type TraceFlowLayout = (graph: TraceGraph) => TraceGraph;

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
export const defaultTraceFlowLayout: TraceFlowLayout = (graph) => {
  if (graph.nodes.length === 0) return { nodes: [], edges: graph.edges };

  // Split outgoing edges into two semantic groups per node:
  //   - branches: fork-branch + decision-branch (siblings at y+1)
  //   - linearNext: 'next' edges (after-convergence, deeper rank)
  // Loop back-edges (kind: 'loop') do NOT shape layout.
  const branchChildrenOf = new Map<string, string[]>();
  const nextChildrenOf = new Map<string, string[]>();
  const hasIncomingForward = new Set<string>();
  for (const e of graph.edges) {
    const kind = e.data?.kind;
    if (kind === "loop") continue;
    hasIncomingForward.add(e.target);
    if (kind === "fork-branch" || kind === "decision-branch") {
      const arr = branchChildrenOf.get(e.source) ?? [];
      arr.push(e.target);
      branchChildrenOf.set(e.source, arr);
    } else {
      // 'next' (default) — linear continuation. Treat undefined kind
      // as 'next' so forward edges without explicit kind still flow.
      const arr = nextChildrenOf.get(e.source) ?? [];
      arr.push(e.target);
      nextChildrenOf.set(e.source, arr);
    }
  }

  // Seed: first node (insertion order) with no incoming non-loop edge.
  const seed = graph.nodes.find((n) => !hasIncomingForward.has(n.id)) ?? graph.nodes[0]!;

  const positions = new Map<string, { x: number; y: number }>();

  /**
   * Recursive tree-walk. Returns the bottom-most y reached in this
   * subtree so the parent can position its `next` continuation BELOW
   * the deepest descendant (post-convergence semantics).
   */
  function layoutSubtree(nodeId: string, x: number, y: number): number {
    if (positions.has(nodeId)) {
      // Convergence: this node was already placed by an earlier branch.
      // Keep the original position (first-wins) and report its current
      // bottom so the caller's `next` target lands below us correctly.
      return positions.get(nodeId)!.y;
    }
    positions.set(nodeId, { x, y });

    // Place fork/decision branches first — they're siblings at y+1.
    let deepestBranchY = y;
    const branches = branchChildrenOf.get(nodeId) ?? [];
    if (branches.length > 0) {
      const childY = y + Y_STEP;
      const totalWidth = (branches.length - 1) * X_SPREAD;
      const startX = x - totalWidth / 2;
      for (let i = 0; i < branches.length; i++) {
        const childId = branches[i]!;
        const childX = startX + i * X_SPREAD;
        const subtreeBottom = layoutSubtree(childId, childX, childY);
        if (subtreeBottom > deepestBranchY) deepestBranchY = subtreeBottom;
      }
    }

    // Then place `next` continuations. If branches exist, `next` lands
    // BELOW the deepest branch (post-convergence). If no branches, it's
    // a plain linear chain — y+1.
    const nextChildren = nextChildrenOf.get(nodeId) ?? [];
    if (nextChildren.length > 0) {
      const nextY = branches.length > 0 ? deepestBranchY + Y_STEP : y + Y_STEP;
      // Multiple `next` from one node is rare (linear chains have one);
      // when it happens, distribute horizontally like branches.
      const totalWidth = (nextChildren.length - 1) * X_SPREAD;
      const startX = x - totalWidth / 2;
      let deepestNextY = nextY;
      for (let i = 0; i < nextChildren.length; i++) {
        const childId = nextChildren[i]!;
        const childX = startX + i * X_SPREAD;
        const subtreeBottom = layoutSubtree(childId, childX, nextY);
        if (subtreeBottom > deepestNextY) deepestNextY = subtreeBottom;
      }
      return deepestNextY;
    }

    return deepestBranchY;
  }

  layoutSubtree(seed.id, 0, 0);

  // Unreached nodes (multi-root or cycles outside the seed's tree)
  // stack below. Use a loop (not `Math.max(...spread)`) — spread
  // blows the call stack at ~10k+ args.
  let maxY = 0;
  for (const p of positions.values()) {
    if (p.y > maxY) maxY = p.y;
  }
  let orphanY = maxY + Y_STEP;
  for (const n of graph.nodes) {
    if (!positions.has(n.id)) {
      positions.set(n.id, { x: 0, y: orphanY });
      orphanY += Y_STEP;
    }
  }

  return {
    nodes: graph.nodes.map((n) => ({
      ...n,
      position: positions.get(n.id) ?? n.position,
    })),
    edges: graph.edges,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Edge styling
// ─────────────────────────────────────────────────────────────────────────────

export interface TraceFlowEdgeColors {
  next: string;
  forkBranch: string;
  decisionBranch: string;
  loop: string;
}

const DEFAULT_EDGE_COLORS: TraceFlowEdgeColors = {
  next: rawDefaults.colors.textMuted,
  forkBranch: rawDefaults.colors.textMuted,
  decisionBranch: rawDefaults.colors.primary,
  loop: rawDefaults.colors.warning,
};

function styleEdge(edge: TraceEdge, colors: TraceFlowEdgeColors): Edge {
  const kind = edge.data?.kind ?? "next";
  const color =
    kind === "loop"
      ? colors.loop
      : kind === "fork-branch"
        ? colors.forkBranch
        : kind === "decision-branch"
          ? colors.decisionBranch
          : colors.next;
  const styled: Edge = {
    ...edge,
    type: kind === "loop" ? "step" : "smoothstep",
    animated: false,
    style: { stroke: color, strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color, width: 16, height: 16 },
  };
  if (kind === "loop") {
    styled.style = { ...styled.style, strokeDasharray: "4 3" };
  }
  return styled;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

type TraceFlowSource =
  | { recorder: TraceStructureRecorderHandle; graph?: never }
  | { graph: TraceGraph; recorder?: never };

export type TraceFlowProps = BaseComponentProps &
  TraceFlowSource & {
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
    children?: React.ReactNode;
  };

const DEFAULT_NODE_TYPES: NodeTypes = { stageNode: StageNode };

/**
 * Convert a `TraceNode` (with `TraceNodeData`) to the `StageNode`-typed
 * node shape so the built-in `<StageNode>` renderer works.
 *
 * Pass-through contract: if the consumer pushed a node with a custom
 * `type` (anything OTHER than the recorder's default `'stage'`), this
 * function returns the node UNCHANGED so xyflow's `nodeTypes` lookup
 * sees the consumer's chosen key. This is what makes the `nodeTypes`
 * extension point useful — without it every node would be force-typed
 * to `'stageNode'` and consumer registrations would never route.
 */
function toStageNode(node: TraceNode): Node {
  // Consumer-supplied custom type — pass through unchanged.
  // Recorders produce nodes with `type: 'stage'` (the recorder's
  // default); anything else is consumer-authored and must be respected.
  if (node.type !== undefined && node.type !== "stage") {
    return node as Node;
  }

  const data = node.data;
  const stageData: StageNodeData = {
    label: data.label,
    isDecider: data.isDecider,
    isFork: data.isFork,
    isSubflow: data.isSubflow,
    active: false,
    done: false,
    error: false,
    ...(data.description !== undefined && { description: data.description }),
    ...(data.icon !== undefined && { icon: data.icon }),
    ...(data.subflowId !== undefined && { subflowId: data.subflowId }),
    ...(data.isLazy === true && { isLazy: true }),
  };
  return {
    ...node,
    type: "stageNode",
    data: stageData as unknown as Record<string, unknown>,
  };
}

// Empty-graph sentinel returned by static-mode getSnapshot when no
// graph or recorder is present. Module-scoped so React's identity check
// sees a stable reference across renders.
const EMPTY_GRAPH: TraceGraph = { nodes: [], edges: [] };

// ── Subscription helpers (defined at module scope so useSyncExternalStore
//    sees stable function references when the recorder doesn't change) ─

function subscribeToRecorder(recorder: TraceStructureRecorderHandle | undefined) {
  return (listener: () => void): (() => void) => {
    if (!recorder) return () => {};
    return recorder.subscribe(listener);
  };
}

function getRecorderVersion(recorder: TraceStructureRecorderHandle | undefined) {
  return (): number => {
    if (!recorder) return 0;
    return recorder.version();
  };
}

export function TraceFlow(props: TraceFlowProps) {
  // Dev-mode contract check — TypeScript enforces the discriminated union
  // at compile time, but JS consumers (or `as any` casts) can hit this.
  const proc = (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process;
  const isDev = proc?.env?.NODE_ENV !== "production";
  if (isDev && !props.recorder && !props.graph) {
    // eslint-disable-next-line no-console
    console.warn(
      "[TraceFlow] neither `recorder` nor `graph` prop was provided — rendering an empty chart. Pass one of: <TraceFlow recorder={handle} /> OR <TraceFlow graph={{nodes, edges}} />.",
    );
  }

  const layout = props.layout ?? defaultTraceFlowLayout;
  const edgeColors = useMemo<TraceFlowEdgeColors>(
    () => ({ ...DEFAULT_EDGE_COLORS, ...(props.edgeColors ?? {}) }),
    [props.edgeColors],
  );

  // Subscribe to the version counter (live mode) — equality-by-number
  // means React only re-renders when the recorder actually mutated.
  // Memoize the subscribe + getSnapshot closures by the recorder
  // identity so useSyncExternalStore doesn't re-subscribe each render.
  const subscribe = useMemo(
    () => subscribeToRecorder(props.recorder),
    [props.recorder],
  );
  const getVersion = useMemo(
    () => getRecorderVersion(props.recorder),
    [props.recorder],
  );
  const version = useSyncExternalStore(subscribe, getVersion, getVersion);

  // Resolve graph: live (recorder) vs static (prop). The version
  // dependency drives re-evaluation in live mode; static mode falls
  // through to the prop's identity on each render.
  const { recorder, graph: graphProp } = props;
  const graph: TraceGraph = useMemo<TraceGraph>(() => {
    if (recorder) return recorder.getGraph();
    if (graphProp) return graphProp;
    return EMPTY_GRAPH;
  }, [recorder, graphProp, version]);

  const positioned = useMemo<TraceGraph>(() => {
    if (layout === "passthrough") return graph;
    return layout(graph);
  }, [graph, layout]);

  const reactFlowNodes = useMemo<Node[]>(
    () => positioned.nodes.map(toStageNode),
    [positioned.nodes],
  );
  const reactFlowEdges = useMemo<Edge[]>(
    () => positioned.edges.map((e) => styleEdge(e, edgeColors)),
    [positioned.edges, edgeColors],
  );

  const onNodeClickRef = props.onNodeClick;
  const handleNodeClick = useCallback(
    (_: unknown, node: Node) => {
      onNodeClickRef?.(node.id);
    },
    [onNodeClickRef],
  );

  const { nodeTypes: userNodeTypes, edgeTypes: userEdgeTypes } = props;
  const mergedNodeTypes = useMemo<NodeTypes>(
    () => (userNodeTypes ? { ...DEFAULT_NODE_TYPES, ...userNodeTypes } : DEFAULT_NODE_TYPES),
    [userNodeTypes],
  );

  return (
    <div
      className={props.className}
      style={{
        width: "100%",
        height: "100%",
        minHeight: 300,
        ...props.style,
      }}
    >
      <ReactFlow
        nodes={reactFlowNodes}
        edges={reactFlowEdges}
        nodeTypes={mergedNodeTypes}
        {...(userEdgeTypes && { edgeTypes: userEdgeTypes })}
        onNodeClick={handleNodeClick}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        {props.children}
      </ReactFlow>
    </div>
  );
}
