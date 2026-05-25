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
import type { RuntimeOverlay } from "./createTraceRuntimeOverlay";
import { sliceOverlay } from "./createTraceRuntimeOverlay";
import { StageNode } from "../StageNode";
import type { StageNodeData } from "../StageNode";
import { rawDefaults } from "../../theme/tokens";
import type { BaseComponentProps } from "../../types";
import { filterGraphForDrill, buildSubflowBreadcrumb } from "./_internal/subflowDrill";
import { normalizeSliceLeafIds, aggregateMountStatus } from "./_internal/overlayProjection";
import { useSubflowDrill } from "./_internal/useSubflowDrill";
import { useChartAutoRefit } from "./_internal/useChartAutoRefit";
import { SubflowBreadcrumbBar } from "./SubflowBreadcrumbBar";

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

function toStageNodeWithOverlay(
  node: TraceNode,
  doneStageIds: ReadonlySet<string>,
  activeStageId: string | null,
  errorMessage: string | undefined,
  executedOrderIds: readonly string[],
): Node {
  const isDone = doneStageIds.has(node.id);
  const isActive = activeStageId === node.id;
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

  const stageData: StageNodeData = {
    label: node.data.label,
    isDecider: node.data.isDecider,
    isFork: node.data.isFork,
    isSubflow: node.data.isSubflow,
    active: isActive,
    done: isDone,
    error: hasError,
    ...(node.data.description !== undefined && { description: node.data.description }),
    ...(node.data.icon !== undefined && { icon: node.data.icon }),
    ...(node.data.subflowId !== undefined && { subflowId: node.data.subflowId }),
    ...(node.data.isLazy === true && { isLazy: true }),
    ...(dimmed && { dimmed: true }),
    ...(stepNumbers && { stepNumbers }),
    ...(errorMessage && { errorMessage }),
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
    type: "smoothstep",
    animated: isLeadingEdge,
    style: { stroke: color, strokeWidth: traversed ? 2 : 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color, width: 16, height: 16 },
  };
  if (kind === "loop") {
    // Route loop-back edges AROUND the chart via the StageNode's
    // dedicated loop-source / loop-target handles + offset path.
    styled.style = { ...styled.style, strokeDasharray: "4 3" };
    (styled.data as any) = {
      ...(styled.data ?? {}),
      pathOptions: { borderRadius: 14, offset: 36 },
    };
    styled.sourceHandle = "loop-source";
    styled.targetHandle = "loop-target";
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
   */
  nodeTypes?: NodeTypes;
  /**
   * Consumer-supplied xyflow edge types. Merged with no built-in
   * defaults — pass `{ myEdge: MyEdge }` to register custom edge
   * components for edges you push into the graph with `type: 'myEdge'`.
   */
  edgeTypes?: EdgeTypes;
}

const DEFAULT_NODE_TYPES: NodeTypes = { stageNode: StageNode };

export function TracedFlow({
  graph,
  overlay,
  scrubIndex,
  layout: layoutProp,
  colors: colorOverrides,
  onNodeClick,
  onSubflowChange,
  nodeTypes: userNodeTypes,
  edgeTypes: userEdgeTypes,
  className,
  style,
}: TracedFlowProps) {
  const layout = layoutProp ?? defaultTraceFlowLayout;
  const colors = useMemo<TracedFlowColors>(
    () => ({ ...DEFAULT_COLORS, ...(colorOverrides ?? {}) }),
    [colorOverrides],
  );
  const mergedNodeTypes = useMemo<NodeTypes>(
    () => (userNodeTypes ? { ...DEFAULT_NODE_TYPES, ...userNodeTypes } : DEFAULT_NODE_TYPES),
    [userNodeTypes],
  );

  // ── Drill state + visibility derivations ──────────────────────────
  const drill = useSubflowDrill(graph, onSubflowChange);
  const filteredGraph = useMemo(
    () => filterGraphForDrill(graph, drill.currentSubflowId),
    [graph, drill.currentSubflowId],
  );
  const breadcrumb = useMemo(
    () => buildSubflowBreadcrumb(graph, drill.currentSubflowId),
    [graph, drill.currentSubflowId],
  );
  const positioned = useMemo<TraceGraph>(
    () => (layout === "passthrough" ? filteredGraph : layout(filteredGraph)),
    [filteredGraph, layout],
  );

  // ── Runtime overlay slice → leaf-normalize + mount aggregation ────
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
    const normalized = normalizeSliceLeafIds(sliceOverlay(overlay, idx));
    return aggregateMountStatus(normalized, graph, drill.currentSubflowId);
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
        ),
      ),
    [positioned.nodes, slice],
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
      if (data.isSubflow && data.subflowId) {
        drill.drillInto(data.subflowId);
      }
      onNodeClick?.(node.id);
    },
    [drill, onNodeClick],
  );

  // ── Container auto-refit (xyflow's fitView is mount-only) ─────────
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  useChartAutoRefit(wrapperRef, rfInstance);

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
          {...(userEdgeTypes && { edgeTypes: userEdgeTypes })}
          onNodeClick={handleNodeClick}
          onInit={setRfInstance}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        </ReactFlow>
      </div>
    </div>
  );
}
