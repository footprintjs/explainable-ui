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
 *   - container resize → fitView ... useChartAutoRefit
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

import type * as React from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  MarkerType,
} from "@xyflow/react";
import type { Node, Edge, NodeTypes, EdgeTypes, ReactFlowInstance } from "@xyflow/react";
import type { TraceGraph, TraceNode, TraceEdge } from "./traceStructureRecorder";
import type { TraceFlowLayout } from "./TraceFlow";
import { defaultTraceFlowLayout } from "./TraceFlow";
import { dagreTraceLayout } from "./_internal/dagreTraceLayout";
import type { RuntimeOverlay } from "./createTraceRuntimeOverlay";
import { sliceOverlay } from "./createTraceRuntimeOverlay";
import { StageNode } from "../StageNode";
import type { StageNodeData } from "../StageNode";
import { rawDefaults } from "../../theme/tokens";
import type { BaseComponentProps } from "../../types";
import { filterGraphForDrill, buildSubflowBreadcrumb } from "./_internal/subflowDrill";
import { aggregateMountStatus } from "./_internal/overlayProjection";
import { useSubflowDrill } from "./_internal/useSubflowDrill";
import { useChartAutoRefit } from "./_internal/useChartAutoRefit";
import { SubflowBreadcrumbBar } from "./SubflowBreadcrumbBar";
import { GroupContainerNode } from "../GroupContainerNode";
import { LoopBackEdge } from "../LoopBackEdge";
import { SmartStepEdge } from "../SmartStepEdge";
import { applyGroupLayout, wrapInMainChartBox } from "./_internal/groupLayout";

// ─────────────────────────────────────────────────────────────────────────────
// Theming
// ─────────────────────────────────────────────────────────────────────────────

export interface TracedFlowColors {
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

const DEFAULT_COLORS: TracedFlowColors = {
  default: rawDefaults.colors.textMuted,
  done: rawDefaults.colors.success,
  active: rawDefaults.colors.primary,
  error: rawDefaults.colors.error,
  loop: rawDefaults.colors.warning,
};

// ─────────────────────────────────────────────────────────────────────────────
// Per-node / per-edge styling (pure)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Derive overlay state fields for a single node from the current
 * scrub slice. Shared between the default `stageNode` path and the
 * custom-node pass-through path so custom renderers receive the same
 * `active`/`done`/`error`/`dimmed`/`stepNumbers` shape the bundled
 * `<StageNode>` consumes.
 */
/** Stable empty set so the nodes useMemo doesn't re-run when no co-active set is passed. */
const EMPTY_SET: ReadonlySet<string> = new Set<string>();

function deriveOverlayFields(
  node: TraceNode,
  doneStageIds: ReadonlySet<string>,
  activeStageId: string | null,
  errorMessage: string | undefined,
  executedOrderIds: readonly string[],
  coActiveStageIds: ReadonlySet<string>,
): {
  active: boolean;
  done: boolean;
  error: boolean;
  dimmed: boolean;
  errorMessage?: string;
  stepNumbers?: number[];
} {
  const isDone = doneStageIds.has(node.id);
  // `active` is the SINGLE cursor node OR any node in the co-active set — the
  // latter lets a consumer light a whole parallel cohort (e.g. the lens lighting
  // all branches of a fork) at one cursor. Applies to BOTH stage and custom
  // nodes (custom nodes also OR consumer `data.active` below).
  const isActive = activeStageId === node.id || coActiveStageIds.has(node.id);
  const wasExecuted = isDone || isActive;
  const hasError = !!errorMessage;
  const dimmed = !wasExecuted && executedOrderIds.length > 0;

  // Per-stage step number(s) — a loop may visit the same node multiple times.
  let stepNumbers: number[] | undefined;
  if (executedOrderIds.length > 0) {
    const nums: number[] = [];
    for (let i = 0; i < executedOrderIds.length; i++) {
      if (executedOrderIds[i] === node.id) nums.push(i + 1);
    }
    if (nums.length > 0) stepNumbers = nums;
  }

  return {
    active: isActive,
    done: isDone,
    error: hasError,
    dimmed,
    ...(errorMessage && { errorMessage }),
    ...(stepNumbers && { stepNumbers }),
  };
}

function toStageNodeWithOverlay(
  node: TraceNode,
  doneStageIds: ReadonlySet<string>,
  activeStageId: string | null,
  errorMessage: string | undefined,
  executedOrderIds: readonly string[],
  coActiveStageIds: ReadonlySet<string>,
): Node {
  const overlayFields = deriveOverlayFields(
    node,
    doneStageIds,
    activeStageId,
    errorMessage,
    executedOrderIds,
    coActiveStageIds,
  );
  const { dimmed } = overlayFields;

  // Custom-node pass-through with overlay enrichment.
  //
  // Behaviour (v0.20+): when a consumer pushes a node with a non-default
  // `type`, we return it with overlay state MERGED INTO `data`
  // (`active`, `done`, `error`, `errorMessage`, `dimmed`, `stepNumbers`).
  // The consumer's custom renderer can read those fields to style itself
  // the same way the bundled `<StageNode>` does, without re-implementing
  // the scrub-slice derivation.
  //
  // Merge semantics: OR-union with consumer `data`. The consumer may
  // ALSO want to mark a node active/done (e.g., agentfootprint-lens marks
  // its User pill active at root cursors — the User pill isn't a real
  // stage so the overlay can't compute it). When EITHER source flags a
  // node active/done/error, the renderer sees it. This composes cleanly:
  //   - Pure overlay flow (no consumer override) → overlay values pass through
  //   - Consumer override (lens User pill case)  → consumer flag wins
  //   - Both set                                  → OR (lit either way)
  //
  // `dimmed` is mutually exclusive with `active`/`done` — when a node is
  // active or done at the current cursor it can't simultaneously be
  // "faded because others have executed." We zero dimmed when active or
  // done is true regardless of source.
  if (node.type !== undefined && node.type !== "stage") {
    const consumerData = (node.data ?? {}) as Record<string, unknown>;
    const consumerActive = consumerData.active === true;
    const consumerDone = consumerData.done === true;
    const consumerError = consumerData.error === true;
    const finalActive = consumerActive || overlayFields.active;
    const finalDone = consumerDone || overlayFields.done;
    const finalError = consumerError || overlayFields.error;
    const finalDimmed = !finalActive && !finalDone && dimmed;
    return {
      ...node,
      data: {
        ...node.data,
        active: finalActive,
        done: finalDone,
        error: finalError,
        ...(overlayFields.errorMessage !== undefined &&
          consumerData.errorMessage === undefined && {
            errorMessage: overlayFields.errorMessage,
          }),
        ...(finalDimmed && { dimmed: true }),
        ...(overlayFields.stepNumbers && { stepNumbers: overlayFields.stepNumbers }),
      },
      ...(finalDimmed && { style: { ...(node.style ?? {}), opacity: 0.35 } }),
    } as Node;
  }

  const stageData: StageNodeData = {
    label: node.data.label,
    isDecider: node.data.isDecider,
    isFork: node.data.isFork,
    isSubflow: node.data.isSubflow,
    ...overlayFields,
    ...(node.data.description !== undefined && { description: node.data.description }),
    ...(node.data.icon !== undefined && { icon: node.data.icon }),
    ...(node.data.subflowId !== undefined && { subflowId: node.data.subflowId }),
    ...(node.data.isLazy === true && { isLazy: true }),
    ...(node.data.emphasis !== undefined && { emphasis: node.data.emphasis }),
    ...(node.data.size !== undefined && { size: node.data.size }),
  } as StageNodeData;

  return {
    ...node,
    type: "stageNode",
    data: stageData as unknown as Record<string, unknown>,
    ...(dimmed && { style: { opacity: 0.35 } }),
  };
}

function styleEdgeWithOverlay(
  edge: TraceEdge,
  doneStageIds: ReadonlySet<string>,
  activeStageId: string | null,
  colors: TracedFlowColors,
): Edge {
  const kind = edge.data?.kind ?? "next";
  const sourceExecuted = doneStageIds.has(edge.source) || activeStageId === edge.source;
  const targetExecuted = doneStageIds.has(edge.target) || activeStageId === edge.target;
  const traversed = sourceExecuted && targetExecuted;
  const isLeadingEdge = activeStageId === edge.source && !doneStageIds.has(edge.target);

  let color: string = colors.default;
  if (kind === "loop") color = colors.loop;
  else if (isLeadingEdge) color = colors.active;
  else if (traversed) color = colors.done;

  const styled: Edge = {
    ...edge,
    // Loop back-edges use the custom `loopBack` edge — a curve routed along the
    // right margin (clear of the spine). It reads node bounds from the store
    // and anchors on right edges itself, so it needs NO dedicated loop handles
    // on the node (the old approach broke for any node missing them).
    // Every other edge uses `smartStep`: a smoothstep superset that routes a
    // RANK-SKIPPING edge around the node it skips (else identical to smoothstep).
    type: kind === "loop" ? "loopBack" : "smartStep",
    animated: isLeadingEdge,
    style: { stroke: color, strokeWidth: traversed ? 2 : 1.5 },
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

export interface TracedFlowProps extends BaseComponentProps {
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
   * user click on a mount node). Receives the mount stage id (drill
   * in) or `null` (pop back). Container shells use this to keep
   * their data panels in lock-step with the chart's drill state.
   */
  onSubflowChange?: (mountStageId: string | null) => void;
  /**
   * Consumer-supplied xyflow node types. Merged with the built-in
   * `{ stageNode: StageNode }` registry — keys you supply OVERRIDE
   * the default for that node type. Pass `{ stageNode: MyNode }` to
   * replace the default stage renderer entirely, or add new keys
   * for custom node components you push into the graph.
   *
   * v0.20+ — overlay state is injected into custom nodes' `data`
   * fields too (`active`, `done`, `error`, `errorMessage`, `dimmed`,
   * `stepNumbers`), so consumer renderers can style themselves with
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
  mainChartBox?: { label?: string; kind?: string };
  /**
   * Children rendered INSIDE the `<ReactFlow>` element, after the
   * built-in `<Background>`. Use this slot to mount xyflow
   * accessory components like `<Controls />`, `<MiniMap />`, or a
   * custom legend. If unset, only the default Background is rendered.
   */
  children?: React.ReactNode;
}

const DEFAULT_NODE_TYPES: NodeTypes = {
  stageNode: StageNode,
  groupContainer: GroupContainerNode,
};

// Built-in edge types. `loopBack` curves loop-back edges along the right margin
// (see LoopBackEdge); `smartStep` routes rank-skipping edges around the node
// they skip (see SmartStepEdge). Always registered; merged UNDER consumer
// `edgeTypes` (consumer keys win).
const DEFAULT_EDGE_TYPES: EdgeTypes = { loopBack: LoopBackEdge, smartStep: SmartStepEdge };

export function TracedFlow({
  graph,
  overlay,
  scrubIndex,
  layout: layoutProp,
  colors: colorOverrides,
  onNodeClick,
  onSubflowChange,
  groupedSubflows,
  mainChartBox,
  nodeTypes: userNodeTypes,
  edgeTypes: userEdgeTypes,
  coActiveStageIds,
  children,
  className,
  style,
}: TracedFlowProps) {
  // Dagre is the default (structure-derived spacing); override via `layout`.
  const layout = layoutProp ?? dagreTraceLayout;
  const colors = useMemo<TracedFlowColors>(
    () => ({ ...DEFAULT_COLORS, ...(colorOverrides ?? {}) }),
    [colorOverrides],
  );
  const mergedNodeTypes = useMemo<NodeTypes>(
    () => (userNodeTypes ? { ...DEFAULT_NODE_TYPES, ...userNodeTypes } : DEFAULT_NODE_TYPES),
    [userNodeTypes],
  );
  const mergedEdgeTypes = useMemo<EdgeTypes>(
    () => (userEdgeTypes ? { ...DEFAULT_EDGE_TYPES, ...userEdgeTypes } : DEFAULT_EDGE_TYPES),
    [userEdgeTypes],
  );

  // ── Drill state + visibility derivations ──────────────────────────
  const drill = useSubflowDrill(graph, onSubflowChange);
  const groupedSet = useMemo(() => new Set(groupedSubflows ?? []), [groupedSubflows]);
  // Drill-filter the graph, but KEEP members of grouped subflows visible:
  // a grouped subflow renders its members nested in a container box rather
  // than hidden behind a drill card, so it opts out of drill hiding.
  const filteredGraph = useMemo(() => {
    const base = filterGraphForDrill(graph, drill.currentSubflowId);
    if (groupedSet.size === 0) return base;
    const baseIds = new Set(base.nodes.map((n) => n.id));
    const extraNodes = graph.nodes.filter(
      (n) =>
        n.data?.subflowOf !== undefined &&
        groupedSet.has(n.data.subflowOf) &&
        !baseIds.has(n.id),
    );
    if (extraNodes.length === 0) return base;
    const allIds = new Set([...baseIds, ...extraNodes.map((n) => n.id)]);
    const baseEdgeIds = new Set(base.edges.map((e) => e.id));
    const extraEdges = graph.edges.filter(
      (e) => !baseEdgeIds.has(e.id) && allIds.has(e.source) && allIds.has(e.target),
    );
    return { nodes: [...base.nodes, ...extraNodes], edges: [...base.edges, ...extraEdges] };
  }, [graph, drill.currentSubflowId, groupedSet]);
  const breadcrumb = useMemo(
    () => buildSubflowBreadcrumb(graph, drill.currentSubflowId),
    [graph, drill.currentSubflowId],
  );
  const positioned = useMemo<TraceGraph>(() => {
    const realBase: TraceFlowLayout =
      layout === "passthrough" ? (g: TraceGraph) => g : layout;

    // Per-subflow group boxes (granular; not the main-chart model).
    if (groupedSet.size > 0) {
      const grouped = applyGroupLayout(filteredGraph, {
        groupedSubflowIds: [...groupedSet],
        baseLayout: realBase,
      });
      // Main box can still wrap the grouped result if both are requested.
      return mainChartBox
        ? wrapInMainChartBox(grouped, { baseLayout: (g) => g, ...mainChartBox })
        : grouped;
    }

    // Main-chart box: wrap the whole (drill-filtered) chart in ONE box.
    // The base layout positions the contents; the box frames them.
    if (mainChartBox) {
      return wrapInMainChartBox(filteredGraph, { baseLayout: realBase, ...mainChartBox });
    }

    return layout === "passthrough" ? filteredGraph : layout(filteredGraph);
  }, [filteredGraph, layout, groupedSet, mainChartBox]);

  // ── Runtime overlay slice → mount aggregation ────
  // Overlay stage ids are path-qualified (`subflowPath/stageId`, parsed
  // from runtimeStageId) and structure node ids are ALSO path-qualified
  // now (walkSubflowSpecInto), so they match directly — no leaf-stripping.
  // (The former `normalizeSliceLeafIds` step only existed because
  // structure ids used to be bare; it would now MISMATCH by stripping a
  // qualified id down to its leaf.)
  const slice = useMemo(() => {
    const empty = {
      doneStageIds: new Set<string>(),
      activeStageId: null as string | null,
      executedStageIds: new Set<string>(),
      executedOrderIds: [] as string[],
      errors: new Map<string, string>(),
    };
    if (!overlay) return empty;
    const idx = scrubIndex ?? Math.max(0, overlay.executionOrder.length - 1);
    return aggregateMountStatus(sliceOverlay(overlay, idx), graph, drill.currentSubflowId);
  }, [overlay, scrubIndex, graph, drill.currentSubflowId]);

  // ── xyflow nodes + edges (re-run per scrub tick) ──────────────────
  const reactFlowNodes = useMemo<Node[]>(
    () =>
      positioned.nodes.map((n) =>
        toStageNodeWithOverlay(
          n,
          slice.doneStageIds,
          slice.activeStageId,
          slice.errors.get(n.id),
          slice.executedOrderIds,
          coActiveStageIds ?? EMPTY_SET,
        ),
      ),
    [positioned.nodes, slice, coActiveStageIds],
  );
  const reactFlowEdges = useMemo<Edge[]>(
    () =>
      positioned.edges.map((e) =>
        styleEdgeWithOverlay(e, slice.doneStageIds, slice.activeStageId, colors),
      ),
    [positioned.edges, slice, colors],
  );

  // ── Click handling: drill on subflow mount click, propagate click ─
  const handleNodeClick = useCallback(
    (_: unknown, node: Node) => {
      const data = (node.data ?? {}) as StageNodeData;
      // Grouped subflows render inline (no drill) — only drill the ones
      // still in card mode.
      if (data.isSubflow && data.subflowId && !groupedSet.has(data.subflowId)) {
        drill.drillInto(data.subflowId);
      }
      onNodeClick?.(node.id);
    },
    [drill, onNodeClick, groupedSet],
  );

  // ── Container auto-refit (xyflow's fitView is mount-only) ─────────
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  // refitKey = the drill id: drilling in/out swaps the visible subgraph, so the
  // chart must recenter + rezoom to the new content (otherwise the smaller
  // drilled graph keeps the parent's pan/zoom and sits cramped in a corner).
  useChartAutoRefit(wrapperRef, rfInstance, { refitKey: drill.currentSubflowId, padding: 0.18 });

  return (
    <div
      ref={wrapperRef}
      className={className}
      style={{
        width: "100%",
        height: "100%",
        minHeight: 300,
        display: "flex",
        flexDirection: "column",
        ...style,
      }}
    >
      {breadcrumb.length > 1 && (
        <SubflowBreadcrumbBar
          entries={breadcrumb}
          onNavigate={drill.setCurrentSubflowId}
        />
      )}
      <div style={{ flex: 1, minHeight: 0 }}>
        <ReactFlow
          nodes={reactFlowNodes}
          edges={reactFlowEdges}
          nodeTypes={mergedNodeTypes}
          edgeTypes={mergedEdgeTypes}
          onNodeClick={handleNodeClick}
          onInit={setRfInstance}
          fitView
          fitViewOptions={{ padding: 0.18 }}
          minZoom={0.1}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
          {children}
        </ReactFlow>
      </div>
    </div>
  );
}
