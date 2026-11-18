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

import type * as React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  MarkerType,
} from "@xyflow/react";
import type { Node, Edge, NodeTypes, EdgeTypes, BackgroundProps, Viewport } from "@xyflow/react";
import type { TraceGraph, TraceNode, TraceEdge } from "./traceStructureRecorder";
import type { TraceFlowLayout } from "./TraceFlow";
import { defaultTraceFlowLayout } from "./TraceFlow";
import { dagreTraceLayout, createDagreTraceLayout } from "./_internal/dagreTraceLayout";
import { devWarn } from "./_internal/devWarn";
import type { DagreTraceLayoutOptions, NodeFootprint, NodeSizeResolver } from "./_internal/dagreTraceLayout";
import { createSnappedDagreLayout } from "./_internal/snapLinearSuccessors";
import { withForkCentering } from "./_internal/centerForkParents";
import type { RuntimeOverlay } from "./createTraceRuntimeOverlay";
import { sliceOverlay } from "./createTraceRuntimeOverlay";
import type { StageNodeData } from "../StageNode";
import { theme, componentStyles } from "../../theme/styles";
import { themeModeVars } from "../../theme/mode";
import type { ThemeModeProps } from "../../theme/mode";
import type { BaseComponentProps } from "../../types";
import { filterGraphForDrill, buildSubflowBreadcrumb } from "./_internal/subflowDrill";
import { collapseTraceGraph } from "./_internal/collapseGraph";
import { aggregateMountStatus, cursorStandInIds, edgeCarriesCursor } from "./_internal/overlayProjection";
import { useSubflowDrill } from "./_internal/useSubflowDrill";
import { TraceWorkflowAutoRefit } from "./_internal/TraceWorkflowAutoRefit";
import { chartLayoutKey, chartTopologyKey } from "./_internal/chartFitGeometry";
import { SubflowBreadcrumbBar } from "./SubflowBreadcrumbBar";
import type { SubflowBreadcrumbBarProps } from "./SubflowBreadcrumbBar";
import { GroupContainerNode } from "../GroupContainerNode";
import { LoopBackEdge } from "../LoopBackEdge";
import { SmartStepEdge } from "../SmartStepEdge";
import { applyGroupLayout, wrapInMainChartBox } from "./_internal/groupLayout";
import { MeasuredNodeSizes } from "./_internal/MeasuredNodeSizes";
import type { TraceWorkflowOverlay, TraceWorkflowRead, TraceWorkflowStage } from "../../trace/traceWorkflowOverlay";
import { projectTraceWorkflow, type VisibleWorkflowRead } from "./_internal/traceWorkflowProjection";
import { RecordedReadEdge } from "./RecordedReadEdge";
import { TRACE_MOTION_MS, useTraceMotion } from "../../_internal/useTraceMotion";
import { resolveFlowchartRenderer, type FlowchartRenderer } from "../../model/flowchart";
import { IsometricEdge, IsometricGrid } from "../IsometricFlow";
import { RendererContext, DefaultStageNode } from "../IsometricFlow/RendererContext";
import type { DiagramVisualProps } from "../../model/diagram";
import { indexStageVisits, memoizeElement } from "./_internal/elementProjection";
import { DiagramDrawingProvider, getDiagramNodeGeometry, prepareDiagramGeometry } from "../DiagramDrawing";
import { diagramNativeEdgeTypes } from "../DiagramAppearance";
import { createDiagramAppearanceProjector } from "../DiagramAppearance/model";
import { RendererGeometry } from "../IsometricFlow/RendererGeometry";
import { createIsometricTraceLayout, ISOMETRIC_NODE_WIDTH, ISOMETRIC_NODE_HEIGHT } from "./_internal/isometricTraceLayout";

// ─────────────────────────────────────────────────────────────────────────────
// Theming
// ─────────────────────────────────────────────────────────────────────────────

export interface TracedFlowColors {
  /** Default workflow edge stroke. Node renderers use semantic theme tokens. */
  default: string;
  /** Done — visually de-emphasised (lighter). */
  done: string;
  /** Active — current scrub position. */
  active: string;
  /** Optional error-edge paint, activated only when explicitly supplied through colors.error. */
  error: string;
  /** Loop back-edge color. */
  loop: string;
}

const DEFAULT_COLORS: TracedFlowColors = {
  default: theme.textMuted,
  done: theme.success,
  active: theme.primary,
  error: theme.error,
  loop: theme.warning,
};

/** Bridge xyflow accessories to the same palette as the chart, not its light CSS defaults. */
const ACCESSORY_THEME_STYLE = {
  "--xy-controls-button-background-color": theme.bgSecondary,
  "--xy-controls-button-background-color-hover": theme.bgTertiary,
  "--xy-controls-button-color": theme.textPrimary,
  "--xy-controls-button-color-hover": theme.textPrimary,
  "--xy-controls-button-border-color": theme.border,
  "--xy-controls-box-shadow": componentStyles().shadowPanel,
  "--xy-minimap-background-color": theme.bgSecondary,
  "--xy-minimap-mask-background-color": `color-mix(in srgb, ${theme.bgPrimary} 60%, transparent)`,
  "--xy-minimap-mask-stroke-color": theme.border,
  "--xy-minimap-node-background-color": theme.bgTertiary,
  "--xy-minimap-node-stroke-color": theme.border,
  "--xy-edge-label-background-color": theme.bgSecondary,
  "--xy-edge-label-color": theme.textPrimary,
} as React.CSSProperties;

// ─────────────────────────────────────────────────────────────────────────────
// Per-node / per-edge styling (pure)
// ─────────────────────────────────────────────────────────────────────────────

function toStageNodeWithOverlay(
  node: TraceNode,
  isDone: boolean,
  isActive: boolean,
  dimmed: boolean,
  errorMessage: string | undefined,
  stepNumbers: number[] | undefined,
  retryAttempts: number | undefined,
  suppressDimming: boolean,
): Node {
  const overlayFields = {
    active: isActive,
    done: isDone,
    error: !!errorMessage,
    dimmed,
    ...(errorMessage && { errorMessage }),
    ...(stepNumbers && { stepNumbers }),
    ...(retryAttempts !== undefined && retryAttempts > 1 && { retryAttempts }),
  };

  // Custom-node pass-through with overlay enrichment.
  //
  // Behaviour (v0.20+): when a consumer pushes a node with a non-default
  // `type`, we return it with overlay state MERGED INTO `data`
  // (`active`, `done`, `error`, `errorMessage`, `dimmed`, `stepNumbers`,
  // `retryAttempts`).
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
        ...(overlayFields.retryAttempts !== undefined &&
          consumerData.retryAttempts === undefined && {
            retryAttempts: overlayFields.retryAttempts,
          }),
      },
      ...(finalDimmed && !suppressDimming && { style: { ...(node.style ?? {}), opacity: 0.35 } }),
    } as Node;
  }

  const stageData: StageNodeData = {
    // Same pass-through rule as the custom-node branch above (and as
    // TraceFlow's `toStageNode`): the source data goes through WHOLE, so a
    // consumer's custom fields and the recorder's own metadata
    // (isStreaming, isPausable, branchIds, defaultBranch, prevIds, nextIds,
    // subflowOf) survive into `data` for a swapped-in renderer to read.
    ...node.data,
    label: node.data.label,
    isDecider: node.data.isDecider,
    isFork: node.data.isFork,
    isSubflow: node.data.isSubflow,
    // Overlay LAST — run status is derived here and always wins.
    ...overlayFields,
  } as StageNodeData;

  return {
    ...node,
    type: "stageNode",
    data: stageData as unknown as Record<string, unknown>,
    ...(dimmed && !suppressDimming && { style: { ...(node.style ?? {}), opacity: 0.35 } }),
  };
}

function styleEdgeWithOverlay(
  edge: TraceEdge,
  traversed: boolean,
  carriesCursor: boolean,
  isLeadingEdge: boolean,
  hasError: boolean,
  colors: TracedFlowColors,
  suppressMotion: boolean,
  unstyled: boolean,
  errorColorEnabled: boolean,
  renderer: FlowchartRenderer,
): Edge {
  const kind = edge.data?.kind ?? "next";
  let color: string = colors.default;
  if (carriesCursor) color = colors.active;
  else if (errorColorEnabled && hasError) color = colors.error;
  else if (kind === "loop") color = colors.loop;
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
    type: edge.type ?? (kind === "loop" ? "loopBack" : renderer === "isometric" ? "isometric" : "smartStep"),
    animated: !suppressMotion && (edge.animated ?? isLeadingEdge),
    style: {
      ...(!unstyled && { stroke: color, strokeWidth: kind === "loop" ? 1.5 : traversed || carriesCursor ? 2 : 1.5,
        ...(kind === "loop" && { strokeDasharray: "4 3" }) }),
      ...edge.style,
    },
    markerEnd: edge.markerEnd !== undefined ? edge.markerEnd : unstyled ? undefined
      : { type: MarkerType.ArrowClosed, color: typeof edge.style?.stroke === "string" ? edge.style.stroke : color, width: 16, height: 16 },
    ...(unstyled && { data: { ...edge.data, unstyled: true } }),
  };
  return styled;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export interface TracedFlowProps extends BaseComponentProps, ThemeModeProps, DiagramVisualProps {
  /** Built-in drawing and default geometry. Explicit layout and custom registries retain priority. */
  renderer?: FlowchartRenderer;
  /** Build-time graph from `createTraceStructureRecorder().getGraph()`. */
  graph: TraceGraph;
  /** Runtime overlay from `createTraceRuntimeOverlay().getOverlay()`. */
  overlay?: RuntimeOverlay;
  /** Time-travel scrub index. Defaults to the last step (latest state). */
  scrubIndex?: number;
  /** Override the renderer's default geometry; "passthrough" keeps authored positions. */
  layout?: TraceFlowLayout | "passthrough";
  /** Tune the flat measured pipeline; nodeSize also resolves custom isometric footprints. Ignored with a custom layout. */
  layoutOptions?: Omit<DagreTraceLayoutOptions, "direction">;
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
   * `stageNode` registry — keys you supply OVERRIDE
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
   * Consumer-supplied xyflow edge types. Consumer registry keys override
   * built-ins — pass `{ myEdge: MyEdge }` to register custom edge
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
  /** Static, scope-qualified recorded reads drawn separately from workflow execution edges. */
  traceWorkflow?: TraceWorkflowOverlay | null;
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
  mainChartBox?: { label?: string; kind?: string };
  /** Default dotted background; false removes it. Explicit props also work in unstyled mode. */
  background?: false | BackgroundProps;
  /** Replace or remove the default drill breadcrumb. Navigation commands retain the same scope owner. */
  breadcrumb?: false | ((props: SubflowBreadcrumbBarProps) => React.ReactNode);
  /** xyflow camera bounds. The existing minimum of 0.1 is retained when omitted. */
  minZoom?: number;
  maxZoom?: number;
  /** Controlled camera: disables the internal automatic fitter. */
  viewport?: Viewport;
  defaultViewport?: Viewport;
  onViewportChange?: (viewport: Viewport) => void;
  /** Initial/layout automatic fitting. Defaults to padding 0.18; false leaves camera ownership to the host. */
  autoFit?: boolean | { padding?: number; maxZoom?: number };
  /**
   * Children rendered INSIDE the `<ReactFlow>` element, after the
   * built-in `<Background>`. Use this slot to mount xyflow
   * accessory components like `<Controls />`, `<MiniMap />`, or a
   * custom legend. If unset, only the default Background is rendered.
   */
  children?: React.ReactNode;
}

const DEFAULT_NODE_TYPES: NodeTypes = {
  stageNode: DefaultStageNode,
  groupContainer: GroupContainerNode,
};


// Built-in edge types. `loopBack` curves loop-back edges along the right margin
// (see LoopBackEdge); `smartStep` routes rank-skipping edges around the node
// they skip (see SmartStepEdge). Always registered; merged UNDER consumer
// `edgeTypes` (consumer keys win).
const DEFAULT_EDGE_TYPES: EdgeTypes = { ...diagramNativeEdgeTypes, loopBack: LoopBackEdge, smartStep: SmartStepEdge, recordedRead: RecordedReadEdge, isometric: IsometricEdge };

export function TracedFlow({
  renderer: rendererProp,
  diagramGeometry, diagramDrawings, diagramAppearance,
  graph,
  overlay,
  scrubIndex,
  layout: layoutProp,
  layoutOptions,
  colors: colorOverrides,
  onNodeClick,
  onSubflowChange,
  currentSubflowId: controlledSubflowId,
  collapseNode,
  groupedSubflows,
  mainChartBox,
  nodeTypes: userNodeTypes,
  edgeTypes: userEdgeTypes,
  coActiveStageIds,
  sliceCone,
  traceWorkflow,
  background,
  breadcrumb: renderBreadcrumb,
  minZoom = 0.1,
  maxZoom,
  viewport,
  defaultViewport,
  onViewportChange,
  autoFit = true,
  theme: themeMode,
  unstyled = false,
  children,
  className,
  style,
}: TracedFlowProps) {
  const renderer = resolveFlowchartRenderer(rendererProp);
  const motionEnabled = useTraceMotion();
  const suppressMotion = unstyled || !!traceWorkflow || !motionEnabled;
  const errorColorEnabled = colorOverrides?.error !== undefined;
  // Investigation chrome changes size on entry and exit; neither is permission to reclaim a user's camera.
  const investigationSeen = useRef(false);
  if (traceWorkflow) investigationSeen.current = true;
  // The renderer chooses default geometry; an explicit layout retains priority.
  const layout = layoutProp ?? dagreTraceLayout;

  // Dev guardrail (integration-drift, not version-drift): passing the BARE
  // exported `dagreTraceLayout` as `layout` opts OUT of the built-in
  // measure-then-layout pipeline (content-exact sizing + fork/merge centering +
  // straight spines) — a silent footgun that once made the lens render stale
  // while pinned to a current eui. Omit `layout` to get the pipeline; pass a
  // custom layout only to deliberately override it.
  useEffect(() => {
    if (layoutProp === dagreTraceLayout) {
      devWarn(
        () =>
          "[footprint-explainable-ui] <TracedFlow layout={dagreTraceLayout}> bypasses the " +
          "built-in measure-then-layout pipeline (content-exact sizing, fork/merge centering, " +
          "straight spines). OMIT the `layout` prop to use it — passing the raw dagreTraceLayout " +
          "silently forfeits every layout improvement eui ships.",
      );
    }
  }, [layoutProp]);
  useEffect(() => {
    if (layoutOptions !== undefined && layoutProp !== undefined)
      devWarn(() => "[footprint-explainable-ui] TracedFlow layoutOptions applies only to the default measured layout; the supplied layout owns its options.");
  }, [layoutOptions, layoutProp]);
  const colors = useMemo<TracedFlowColors>(
    () => ({ ...DEFAULT_COLORS, ...(colorOverrides ?? {}) }),
    [colorOverrides],
  );
  const mergedNodeTypes = useMemo<NodeTypes>(
    () => userNodeTypes ? { ...DEFAULT_NODE_TYPES, ...userNodeTypes } : DEFAULT_NODE_TYPES,
    [userNodeTypes],
  );
  const mergedEdgeTypes = useMemo<EdgeTypes>(
    () => (userEdgeTypes ? { ...DEFAULT_EDGE_TYPES, ...userEdgeTypes } : DEFAULT_EDGE_TYPES),
    [userEdgeTypes],
  );

  // ── Node collapse (before drill: a hidden card cannot be drilled) ──
  const effectiveGraph = useMemo(
    () => prepareDiagramGeometry(collapseNode ? collapseTraceGraph(graph, collapseNode).graph : graph, diagramGeometry),
    [graph, collapseNode, diagramGeometry],
  );

  // ── Drill state + visibility derivations ──────────────────────────
  const drill = useSubflowDrill(effectiveGraph, onSubflowChange, controlledSubflowId);
  const groupedSet = useMemo(() => new Set(groupedSubflows ?? []), [groupedSubflows]);
  // Drill-filter the graph, but KEEP members of grouped subflows visible:
  // a grouped subflow renders its members nested in a container box rather
  // than hidden behind a drill card, so it opts out of drill hiding.
  const filteredGraph = useMemo(() => {
    const base = filterGraphForDrill(effectiveGraph, drill.currentSubflowId);
    if (groupedSet.size === 0) return base;
    const baseIds = new Set(base.nodes.map((n) => n.id));
    const extraNodes = effectiveGraph.nodes.filter(
      (n) =>
        n.data?.subflowOf !== undefined &&
        groupedSet.has(n.data.subflowOf) &&
        !baseIds.has(n.id),
    );
    if (extraNodes.length === 0) return base;
    const allIds = new Set([...baseIds, ...extraNodes.map((n) => n.id)]);
    const baseEdgeIds = new Set(base.edges.map((e) => e.id));
    const extraEdges = effectiveGraph.edges.filter(
      (e) => !baseEdgeIds.has(e.id) && allIds.has(e.source) && allIds.has(e.target),
    );
    return { nodes: [...base.nodes, ...extraNodes], edges: [...base.edges, ...extraEdges] };
  }, [effectiveGraph, drill.currentSubflowId, groupedSet]);
  const breadcrumb = useMemo(
    () => buildSubflowBreadcrumb(effectiveGraph, drill.currentSubflowId),
    [effectiveGraph, drill.currentSubflowId],
  );
  // Real rendered node sizes, captured by the <MeasuredNodeSizes> probe once
  // xyflow has measured them — fed into the dagre `nodeSize` resolver below so
  // the layout re-runs with content-exact spacing (measure-then-layout).
  const [measurement, setMeasurement] = useState<{ renderer: FlowchartRenderer; sizes: Map<string, NodeFootprint> } | null>(null);
  const measuredSizes = measurement?.renderer === renderer ? measurement.sizes : null;
  const acceptMeasurements = useCallback((sizes: Map<string, NodeFootprint>) => setMeasurement({ renderer, sizes }), [renderer]);
  const fixedStageNodes = !userNodeTypes?.stageNode;

  const positioned = useMemo<TraceGraph>(() => {
    // Default layout = dagre (measured content-exact sizes + tighter pro
    // spacing) → snap pass (kills Brandes–Köpf spine drift on asymmetric
    // graphs). The SAME nodeSize resolver goes to BOTH dagre and snap — else
    // snap reconstructs centers from wrong widths (the identical-resolver
    // invariant). A consumer's custom `layout` owns its own sizing;
    // "passthrough" keeps the incoming positions.
    const nodeSize: NodeSizeResolver | undefined = diagramGeometry || layoutOptions?.nodeSize || measuredSizes
      ? (n) => getDiagramNodeGeometry(diagramGeometry, n.id) ?? layoutOptions?.nodeSize?.(n) ?? measuredSizes?.get(n.id)
      : undefined;
    const sizeOpts = { nodeSize, nodeWidth: layoutOptions?.nodeWidth, nodeHeight: layoutOptions?.nodeHeight };
    const nodeSep = layoutOptions?.nodeSep ?? 36;
    // dagre → snap (spine drift) → fork-centering (off-center fork parents).
    // SAME sizeOpts to every stage (the identical-resolver invariant).
    const dagreBase: TraceFlowLayout = withForkCentering(
      createSnappedDagreLayout(
        createDagreTraceLayout({ ...layoutOptions, ...sizeOpts, direction: "TB", rankSep: layoutOptions?.rankSep ?? 52, nodeSep }),
        sizeOpts,
      ),
      { ...sizeOpts, nodeSep }, // same nodeSep → clamp preserves dagre's reserved gap
    );
    const isometricNodeSize: NodeSizeResolver = node => getDiagramNodeGeometry(diagramGeometry, node.id) ?? (fixedStageNodes &&
      !node.data.isGroupContainer && (node.type === undefined || node.type === "stage")
      ? { width: ISOMETRIC_NODE_WIDTH, height: ISOMETRIC_NODE_HEIGHT }
      : nodeSize?.(node));
    const isometricBase = createIsometricTraceLayout({ nodeSize: isometricNodeSize, fixedStageNodes, diagramGeometry });
    const isometricBounds = renderer === "isometric" && layoutProp === undefined ? { nodeSize: isometricNodeSize } : {};
    const realBase: TraceFlowLayout =
      layout === "passthrough"
        ? (g: TraceGraph) => g
        : layoutProp === undefined
          ? renderer === "isometric" ? isometricBase : dagreBase
          : (layout as TraceFlowLayout);

    // Per-subflow group boxes (granular; not the main-chart model).
    if (groupedSet.size > 0) {
      const grouped = applyGroupLayout(filteredGraph, {
        groupedSubflowIds: [...groupedSet],
        baseLayout: realBase,
        ...isometricBounds,
      });
      // Main box can still wrap the grouped result if both are requested.
      return mainChartBox
        ? wrapInMainChartBox(grouped, { baseLayout: (g) => g, ...isometricBounds, ...mainChartBox })
        : grouped;
    }

    // Main-chart box: wrap the whole (drill-filtered) chart in ONE box.
    // The base layout positions the contents; the box frames them.
    if (mainChartBox) {
      return wrapInMainChartBox(filteredGraph, { baseLayout: realBase, ...isometricBounds, ...mainChartBox });
    }

    return realBase(filteredGraph);
  }, [filteredGraph, layout, layoutProp, layoutOptions, groupedSet, mainChartBox, measuredSizes, renderer, fixedStageNodes, diagramGeometry]);

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
      retryAttempts: new Map<string, number>(),
    };
    if (!overlay) return empty;
    const idx = scrubIndex ?? Math.max(0, overlay.executionOrder.length - 1);
    return aggregateMountStatus(sliceOverlay(overlay, idx), effectiveGraph, drill.currentSubflowId);
  }, [overlay, scrubIndex, effectiveGraph, drill.currentSubflowId]);

  // ── xyflow nodes + edges (re-run per scrub tick) ──────────────────
  const suppressDimming = unstyled || !!traceWorkflow;
  const executionOrder = overlay?.executionOrder;
  const visitsAt = useMemo(() => indexStageVisits(executionOrder ?? []), [executionOrder]);
  const projectNode = useMemo(() => memoizeElement((
    source: TraceNode, done: boolean, active: boolean, dimmed: boolean,
    error: string | undefined, numbers: number[] | undefined, attempts: number | undefined,
  ) => {
    const node = toStageNodeWithOverlay(source, done, active, dimmed, error, numbers, attempts, suppressDimming);
    return { ...node, data: { ...node.data, ...(unstyled && { unstyled: true }),
      suppressMotion: suppressMotion || node.data.suppressMotion === true } };
  }), [unstyled, suppressDimming, suppressMotion]);

  const reactFlowNodes = useMemo<Node[]>(() => positioned.nodes.map(node => {
    const done = slice.doneStageIds.has(node.id);
    const active = slice.activeStageId === node.id || coActiveStageIds?.has(node.id) === true;
    const count = slice.executedOrderIds.length;
    return projectNode(node, done, active, !done && !active && count > 0,
      slice.errors.get(node.id), visitsAt(node.id, count), slice.retryAttempts?.get(node.id));
  }), [positioned.nodes, slice, coActiveStageIds, visitsAt, projectNode]);

  const projectEdge = useMemo(() => memoizeElement((
    edge: TraceEdge, traversed: boolean, carriesCursor: boolean, leading: boolean, error: boolean,
  ) => styleEdgeWithOverlay(edge, traversed, carriesCursor, leading, error, colors, suppressMotion,
    unstyled, errorColorEnabled, renderer)), [colors, suppressMotion, unstyled, errorColorEnabled, renderer]);

  const reactFlowEdges = useMemo<Edge[]>(() => {
    const cursor = slice.activeStageId;
    const standIns = cursorStandInIds(cursor);
    return positioned.edges.map(edge => {
      const targetDone = slice.doneStageIds.has(edge.target);
      const traversed = (slice.doneStageIds.has(edge.source) || cursor === edge.source) &&
        (targetDone || cursor === edge.target);
      const carriesCursor = edgeCarriesCursor(edge.data?.via, standIns);
      const leading = carriesCursor || (cursor === edge.source && !targetDone);
      const error = errorColorEnabled && (!!slice.errors.get(edge.source) || !!slice.errors.get(edge.target));
      return projectEdge(edge, traversed, carriesCursor, leading, error);
    });
  }, [positioned.edges, slice, projectEdge, errorColorEnabled]);

  const projectRead = useMemo(() => memoizeElement((read: TraceWorkflowRead, source: string, target: string) =>
    ({ ...read, source, target })), []);
  const workflowProjection = useMemo(() => projectTraceWorkflow(traceWorkflow, positioned.nodes, projectRead),
    [traceWorkflow, positioned.nodes, projectRead]);
  const projectWorkflowNode = useMemo(() => memoizeElement((node: Node, stage: TraceWorkflowStage | undefined) => ({
    ...node,
    data: { ...node.data, dimmed: false, traceContext: stage ? "displayed" : "outside",
      ...(stage ? { traceWorkflow: stage } : {}) },
    // A Backtrack inspection removes system fading but preserves authored opacity.
    style: unstyled ? node.style : { ...node.style, opacity: node.style?.opacity ?? 1,
      transition: motionEnabled ? `opacity ${TRACE_MOTION_MS}ms ease` : "none", animation: "none" },
  })), [motionEnabled, unstyled]);
  const workflowNodes = useMemo<Node[]>(() => traceWorkflow
    ? reactFlowNodes.map(node => projectWorkflowNode(node, workflowProjection.stages.get(node.id)))
    : reactFlowNodes, [traceWorkflow, reactFlowNodes, workflowProjection, projectWorkflowNode]);

  const projectWorkflowEdge = useMemo(() => memoizeElement((edge: Edge) => ({
    ...edge, animated: false,
    style: unstyled ? edge.style : { animation: "none", transition: motionEnabled ? `opacity ${TRACE_MOTION_MS}ms ease` : "none", opacity: 0.4, ...edge.style },
  })), [motionEnabled, unstyled]);
  const projectReadEdge = useMemo(() => memoizeElement((read: VisibleWorkflowRead, lane: number, scopeKey: string): Edge => ({
    id: `recorded-read:${JSON.stringify([scopeKey, read.key, read.sourceRuntimeStageId, read.targetRuntimeStageId])}`,
    source: read.source, target: read.target, type: "recordedRead", animated: false, selectable: false,
    zIndex: 2, data: { kind: "recorded-read", ...read, lane, scopeKey, ...(unstyled && { unstyled: true }) },
    ...(!unstyled && { style: { stroke: read.color, strokeWidth: 2, strokeDasharray: "6 4", animation: "none", transition: "none" },
      markerEnd: { type: MarkerType.ArrowClosed, color: read.color, width: 14, height: 14 } }),
  })), [unstyled]);
  const scopeKey = traceWorkflow?.scopeKey;
  const readEdges = useMemo<Edge[]>(() => scopeKey === undefined ? [] :
    workflowProjection.reads.map((read, lane) => projectReadEdge(read, lane, scopeKey)),
  [scopeKey, workflowProjection.reads, projectReadEdge]);
  const workflowEdges = useMemo<Edge[]>(() => traceWorkflow
    ? [...reactFlowEdges.map(edge => projectWorkflowEdge(edge)), ...readEdges]
    : reactFlowEdges, [traceWorkflow, reactFlowEdges, readEdges, projectWorkflowEdge]);

  // ── Dependency-cone overlay (sliceCone) ────────────────────────────
  // Two-phase reveal: when the cone changes, everything renders at the
  // dimmed opacity for one frame, then members transition UP staggered by
  // depth — the "causality walks backwards" animation. Opacity rides the
  // React Flow wrapper style so it works uniformly for stage AND custom
  // node renderers. No cone → the original arrays pass through untouched.
  const [coneRevealed, setConeRevealed] = useState(false);
  useEffect(() => {
    if (!sliceCone || traceWorkflow || unstyled) return;
    setConeRevealed(false);
    const raf = requestAnimationFrame(() => setConeRevealed(true));
    return () => cancelAnimationFrame(raf);
  }, [sliceCone, traceWorkflow, unstyled]);

  const projectConeNode = useMemo(() => memoizeElement((node: Node, depth: number | undefined) => ({
    ...node, style: depth === undefined ? { ...node.style, opacity: 0.22, transition: "opacity 260ms ease" }
      : { ...node.style, opacity: coneRevealed ? 1 : 0.22, transition: "opacity 320ms ease", transitionDelay: `${depth * 90}ms` },
  })), [coneRevealed]);
  const conedNodes = useMemo<Node[]>(() => {
    if (traceWorkflow) return workflowNodes;
    if (unstyled || !sliceCone?.size) return reactFlowNodes;
    return reactFlowNodes.map(node => projectConeNode(node, sliceCone.get(node.id)));
  }, [traceWorkflow, workflowNodes, reactFlowNodes, sliceCone, projectConeNode, unstyled]);

  const dimConeEdge = useMemo(() => memoizeElement((edge: Edge) => ({
    ...edge, style: { ...edge.style, opacity: 0.12, transition: "opacity 260ms ease" },
  })), []);
  const conedEdges = useMemo<Edge[]>(() => {
    if (traceWorkflow) return workflowEdges;
    if (unstyled || !sliceCone?.size) return reactFlowEdges;
    return reactFlowEdges.map(edge => sliceCone.has(edge.source) && sliceCone.has(edge.target) ? edge : dimConeEdge(edge));
  }, [traceWorkflow, workflowEdges, reactFlowEdges, sliceCone, dimConeEdge, unstyled]);

  // Paint is applied after layout, drill filtering and Backtrack projection.
  const projectNodeAppearance = useMemo(createDiagramAppearanceProjector<Node>, []);
  const projectEdgeAppearance = useMemo(createDiagramAppearanceProjector<Edge>, []);
  const nodes = useMemo(() => projectNodeAppearance(conedNodes, diagramAppearance?.nodes), [projectNodeAppearance, conedNodes, diagramAppearance?.nodes]);
  const edges = useMemo(() => projectEdgeAppearance(conedEdges, diagramAppearance?.edges), [projectEdgeAppearance, conedEdges, diagramAppearance?.edges]);

  // ── Click handling: drill on subflow mount click, propagate click ─
  const handleNodeClick = useCallback(
    (_: unknown, node: Node) => {
      const data = (node.data ?? {}) as StageNodeData;
      // Grouped subflows render inline (no drill) — only drill the ones
      // still in card mode. `groupedSubflows` is spelled in either
      // vocabulary (mount node id or local subflow id), so check both.
      const isGrouped =
        groupedSet.has(node.id) || (!!data.subflowId && groupedSet.has(data.subflowId));
      // Drill by the mount NODE id: `data.subflowId` is the child chart's
      // LOCAL id and repeats across mounts of the same chart, so it would
      // scope the drill to the wrong instance (see subflowDrill.ts).
      if (data.isSubflow && !isGrouped) {
        drill.drillInto(node.id);
      }
      onNodeClick?.(node.id);
    },
    [drill, onNodeClick, groupedSet],
  );

  // One measured-fit owner inside ReactFlow; overlay scrubbing is not a layout.
  const wrapperRef = useRef<HTMLDivElement>(null);
  const layoutKey = useMemo(() => chartLayoutKey(positioned.nodes), [positioned.nodes]);
  const refitKey = useMemo(() => JSON.stringify([
    chartLayoutKey(filteredGraph.nodes), chartTopologyKey(positioned.nodes),
    // A custom layout is an authored layout. Default measured-layout settling
    // must not take camera ownership back after a manual pan/zoom.
    layoutProp !== undefined ? layoutKey : null,
    ...(renderer === "isometric" ? [renderer] : []),
  ]), [filteredGraph.nodes, positioned.nodes, layoutProp, layoutKey, renderer]);

  const nodeIds = useMemo(() => positioned.nodes.map(node => node.id), [positioned.nodes]);

  return (
    <div
      ref={wrapperRef}
      data-fp="traced-flow"
      data-fp-renderer={renderer}
      data-unstyled={unstyled || undefined}
      className={className}
      style={{
        // The one-word switch, applied to this chart's own root so a chart
        // mounted alone in a light app is light (see theme/mode.ts).
        ...(!unstyled && themeModeVars(themeMode)),
        ...(!unstyled && ACCESSORY_THEME_STYLE),
        width: "100%",
        height: "100%",
        minHeight: 300,
        display: "flex",
        flexDirection: "column",
        ...style,
      }}
    >
      {breadcrumb.length > 1 && renderBreadcrumb !== false && (renderBreadcrumb
        ? renderBreadcrumb({ entries: breadcrumb, onNavigate: drill.setCurrentSubflowId, unstyled })
        : <SubflowBreadcrumbBar entries={breadcrumb} onNavigate={drill.setCurrentSubflowId} unstyled={unstyled} />)}
      <div style={{ flex: 1, minHeight: 0 }}>
        <DiagramDrawingProvider enableAppearance={diagramAppearance !== undefined} geometry={diagramGeometry} drawings={diagramDrawings}><RendererContext.Provider value={renderer}><ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={mergedNodeTypes}
          edgeTypes={mergedEdgeTypes}
          onNodeClick={handleNodeClick}
          minZoom={minZoom}
          maxZoom={maxZoom}
          viewport={viewport}
          defaultViewport={defaultViewport}
          onViewportChange={onViewportChange}
          proOptions={{ hideAttribution: true }}
        >
          {autoFit !== false && viewport === undefined && <TraceWorkflowAutoRefit wrapperRef={wrapperRef}
            refitKey={refitKey} layoutKey={layoutKey} padding={typeof autoFit === "object" ? autoFit.padding ?? 0.18 : 0.18}
            maxAutoZoom={typeof autoFit === "object" ? autoFit.maxZoom : undefined}
            preserveViewport={investigationSeen.current} stages={workflowProjection.stages} reads={workflowProjection.reads} />}
          <RendererGeometry renderer={renderer} nodeIds={nodeIds} />
          <MeasuredNodeSizes onSizes={acceptMeasurements} />
          {background !== false && (!unstyled || background !== undefined) && (renderer === "isometric" && background === undefined
            ? <IsometricGrid /> : <Background variant={BackgroundVariant.Dots} gap={20} size={1} {...background} />)}
          {children}
        </ReactFlow></RendererContext.Provider></DiagramDrawingProvider>
      </div>
    </div>
  );
}
