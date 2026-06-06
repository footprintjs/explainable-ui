/**
 * groupLayout — xyflow NATIVE container boxes for the trace chart.
 *
 * Two box mechanisms live here, plus the existing drill (elsewhere):
 *
 *   - **Drill** (`subflowDrill.ts` + `useSubflowDrill`): a subflow shows as
 *     ONE mount card; clicking it zooms in. The DEFAULT for every subflow.
 *   - **Main-chart box** (`wrapInMainChartBox`): wrap the WHOLE chart in ONE
 *     container box. This is the Lens model — the primitive you're viewing
 *     (LLMCall / Agent) is always one box; every subflow inside it stays a
 *     drill card. A `nodeTypes` registry then styles each inner card
 *     (system-prompt / messages / tools / LLM). USE THIS for Lens.
 *   - **Per-subflow group** (`applyGroupLayout`): box individual subflows
 *     (mount → container, members nested inside). A more granular tool kept
 *     for consumers that want specific subflows inlined as boxes rather than
 *     drilled. NOT what the Lens main-chart model uses.
 *
 * All are pure `(graph, opts) => graph` (no React, no I/O) and compose with
 * `<TracedFlow>` before nodes reach `<ReactFlow>`. explainable-ui stays
 * policy-free: it offers the mechanisms; the consumer (Lens) picks.
 *
 * Pure: `(graph, opts) => graph`. No React, no I/O. Composed by `<TracedFlow>`
 * before the nodes reach `<ReactFlow>`.
 *
 * What it does, given `groupedSubflowIds`:
 *   1. For each grouped subflow that is actually present (a mount node whose
 *      `subflowId` is listed AND has ≥1 member where `subflowOf === id`):
 *      - lay the OUTER graph out with `baseLayout` (members excluded; the
 *        mount stays as the box anchor);
 *      - lay the subflow's MEMBERS out with `baseLayout` in isolation, then
 *        normalise them to the box's local coordinate space;
 *      - size the container box to fit the members (+ header + padding);
 *      - convert the mount node to `type: 'groupContainer'` with a `style`
 *        width/height, and nest each member via `parentId` + `extent`.
 *   2. Subflows NOT listed are left untouched (they continue to drill).
 *
 * Node ORDER invariant (xyflow requirement): a parent node MUST appear
 * before its children in the array. We emit all outer nodes (containers
 * included) first, then all nested members — so every container precedes
 * its members.
 */

import type { TraceGraph, TraceNode } from "../traceStructureRecorder";
import type { TraceFlowLayout } from "../TraceFlow";
import { LOOP_LANE_GAP } from "./loopRouting";

/** xyflow node type used for the container box. Consumers register a
 *  renderer for this key (explainable-ui ships a default `GroupContainerNode`). */
export const GROUP_CONTAINER_NODE_TYPE = "groupContainer";

export interface GroupLayoutOptions {
  /** Subflow ids (the mount's `subflowId`) to render as group boxes. */
  readonly groupedSubflowIds: readonly string[];
  /** Layout for both the outer graph and each subflow's interior. */
  readonly baseLayout: TraceFlowLayout;
  /** Inner padding inside the container box, in px. Default 16. */
  readonly padding?: number;
  /** Header strip height (room for the box title), in px. Default 44. */
  readonly headerHeight?: number;
  /** Assumed node footprint for box sizing (the layout sets positions, not
   *  sizes). Defaults match the bundled `StageNode` footprint. */
  readonly nodeWidth?: number;
  readonly nodeHeight?: number;
}

const DEFAULT_PADDING = 16;
const DEFAULT_HEADER = 44;
const DEFAULT_NODE_W = 200;
const DEFAULT_NODE_H = 80;

/**
 * Resolve a node's rendered FOOTPRINT for box-sizing math.
 *
 * A node's true extent is `position + footprint`, not its top-left corner.
 * For a `groupContainer` produced by a prior pass the footprint lives on
 * `style.width/height` (e.g. a boxed subflow ~1756px wide); for a plain
 * stage card it is the configured default. Composing nested boxes therefore
 * REQUIRES reading this — otherwise a wide container is measured as a point
 * and the outer box is sized far too small to contain it.
 *
 * Mirrors `dagreTraceLayout.sizeOf` (`style.width/height` → default) so the
 * box transforms and the dagre layout agree on every node's footprint.
 */
function footprintOf(
  node: TraceNode,
  fallbackW: number,
  fallbackH: number,
): { width: number; height: number } {
  const style = (node.style ?? {}) as { width?: unknown; height?: unknown };
  const w = typeof style.width === "number" ? style.width : fallbackW;
  const h = typeof style.height === "number" ? style.height : fallbackH;
  return { width: w, height: h };
}

/**
 * Apply group-container nesting to a positioned-or-unpositioned graph.
 * Returns a NEW graph (input is not mutated). Edges pass through unchanged
 * — xyflow resolves them by node id regardless of nesting, so an edge that
 * pointed at a now-container mount still connects to the box, and
 * member↔member edges render inside it.
 */
export function applyGroupLayout(graph: TraceGraph, opts: GroupLayoutOptions): TraceGraph {
  const padding = opts.padding ?? DEFAULT_PADDING;
  const headerHeight = opts.headerHeight ?? DEFAULT_HEADER;
  const nodeW = opts.nodeWidth ?? DEFAULT_NODE_W;
  const nodeH = opts.nodeHeight ?? DEFAULT_NODE_H;
  const baseLayout = opts.baseLayout;

  // Which requested subflows are genuinely groupable: a mount node carrying
  // that subflowId AND at least one member tagged subflowOf === id.
  const requested = new Set(opts.groupedSubflowIds);
  const membersBySubflow = new Map<string, TraceNode[]>();
  for (const n of graph.nodes) {
    const of = n.data?.subflowOf;
    if (of !== undefined && requested.has(of)) {
      const arr = membersBySubflow.get(of) ?? [];
      arr.push(n);
      membersBySubflow.set(of, arr);
    }
  }
  const mountBySubflow = new Map<string, TraceNode>();
  for (const n of graph.nodes) {
    const sfId = n.data?.subflowId;
    if (n.data?.isSubflow && sfId !== undefined && requested.has(sfId) && membersBySubflow.has(sfId)) {
      mountBySubflow.set(sfId, n);
    }
  }
  // Only group subflows that have BOTH a mount and members.
  const activeGroups = new Set<string>();
  for (const sfId of mountBySubflow.keys()) activeGroups.add(sfId);

  // Nothing to do — return input unchanged (preserves upstream memoization).
  if (activeGroups.size === 0) {
    return graph;
  }

  // Member ids across all active groups (excluded from the outer layout).
  const memberIds = new Set<string>();
  for (const sfId of activeGroups) {
    for (const m of membersBySubflow.get(sfId) ?? []) memberIds.add(m.id);
  }

  // ── PASS 1 — lay out each group's MEMBERS and size its box FIRST. We must
  //    know each container's true footprint BEFORE the outer layout runs, or
  //    dagre would place the outer siblings (Route, ToolCalls, …) around the
  //    mount's default 200px point and they'd collide once the box balloons.
  //    (Inside-out reflow: size the inner box, then place the outer graph
  //    around it at its real size.) ──
  const containerNodes: TraceNode[] = [];
  const nestedMembers: TraceNode[] = [];
  /** Per-group: box size + the normalisation origin needed when nesting. */
  const groupBox = new Map<
    string,
    { width: number; height: number; minX: number; minY: number; members: TraceNode[] }
  >();

  for (const sfId of activeGroups) {
    const members = membersBySubflow.get(sfId)!;
    const innerOnlyEdges = graph.edges.filter((e) => {
      const s = members.some((m) => m.id === e.source);
      const t = members.some((m) => m.id === e.target);
      return s && t;
    });
    const innerPositioned = baseLayout({ nodes: members, edges: innerOnlyEdges });

    // Normalise member positions to the box's local space (min → 0). Measure
    // each member's full FOOTPRINT (position + width/height), not just its
    // top-left corner — a member may itself be a sized container (nested
    // composition), and corner-only math would undersize this box around it.
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const m of innerPositioned.nodes) {
      const p = m.position;
      const { width, height } = footprintOf(m, nodeW, nodeH);
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x + width > maxX) maxX = p.x + width;
      if (p.y + height > maxY) maxY = p.y + height;
    }
    if (!Number.isFinite(minX)) {
      minX = 0;
      minY = 0;
      maxX = 0;
      maxY = 0;
    }

    // maxX/maxY already include each member's footprint, so the inner extent
    // is just the spanned distance (no extra nodeW/nodeH to add).
    const boxWidth = maxX - minX + padding * 2;
    const boxHeight = maxY - minY + headerHeight + padding * 2;
    groupBox.set(sfId, { width: boxWidth, height: boxHeight, minX, minY, members: innerPositioned.nodes });
  }

  // ── PASS 2 — lay out the OUTER graph with each mount STAMPED at its real
  //    box size, so dagre reserves the correct footprint and outer siblings
  //    are placed clear of the box (no overlap). ──
  const outerNodes = graph.nodes
    .filter((n) => !memberIds.has(n.id))
    .map((n) => {
      const box = n.data?.subflowId ? groupBox.get(n.data.subflowId) : undefined;
      // Stamp the box's footprint onto the mount so the dagre baseLayout
      // (which reads style.width/height via sizeOf) places siblings around it.
      // ALSO flag `data.isGroupContainer` so `sizeOf` treats this stamped
      // footprint as AUTHORITATIVE — i.e. style WINS over any consumer
      // `nodeSize` resolver. Without the flag, a resolver that sizes by
      // recorder semantics (e.g. "any subflow → a 38px slim bar") out-ranks
      // the stamp: dagre reserves 38px while the box renders ~794px, so the
      // post-container siblings (route / tool-calls / final) rank inside the
      // box and overlap it. The flag makes dagre reserve the box's TRUE height.
      return box
        ? {
            ...n,
            style: { ...(n.style ?? {}), width: box.width, height: box.height },
            data: { ...n.data, isGroupContainer: true },
          }
        : n;
    });
  const outerEdges = graph.edges.filter(
    (e) => !memberIds.has(e.source) && !memberIds.has(e.target),
  );
  const outerPositioned = baseLayout({ nodes: outerNodes, edges: outerEdges });
  const outerPosById = new Map(outerPositioned.nodes.map((n) => [n.id, n.position]));

  // ── Emit containers (at their outer position) + nest their members. ──
  for (const sfId of activeGroups) {
    const mount = mountBySubflow.get(sfId)!;
    const box = groupBox.get(sfId)!;
    const { width: boxWidth, height: boxHeight, minX, minY } = box;

    // Container = the mount node, retyped + sized, keeping its outer position.
    const mountPos = outerPosById.get(mount.id) ?? mount.position ?? { x: 0, y: 0 };
    containerNodes.push({
      ...mount,
      type: GROUP_CONTAINER_NODE_TYPE,
      position: mountPos,
      style: { ...(mount.style ?? {}), width: boxWidth, height: boxHeight },
      data: { ...mount.data, isGroupContainer: true },
    });

    // Members nested under the container, positioned in local space below
    // the header strip.
    for (const m of box.members) {
      const relX = m.position.x - minX + padding;
      const relY = m.position.y - minY + headerHeight + padding;
      nestedMembers.push({
        ...(m as TraceNode),
        parentId: mount.id,
        extent: "parent",
        position: { x: relX, y: relY },
      });
    }
  }

  // ── Reassemble: outer nodes (with containers swapped in) FIRST, then
  //    nested members — guarantees every parent precedes its children. ──
  const containerById = new Map(containerNodes.map((c) => [c.id, c]));
  const outerOut: TraceNode[] = outerPositioned.nodes.map(
    (n) => containerById.get(n.id) ?? n,
  );

  return {
    nodes: [...outerOut, ...nestedMembers],
    edges: graph.edges,
  };
}

/**
 * Convenience: wrap a base layout into a `TraceFlowLayout` that applies
 * group containers. Pass to `<TraceFlow layout={...}>` / `<TracedFlow>`.
 */
export function createGroupedLayout(opts: GroupLayoutOptions): TraceFlowLayout {
  return (graph: TraceGraph) => applyGroupLayout(graph, opts);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main-chart box — wrap the ENTIRE (drill-filtered) chart in ONE container
// ─────────────────────────────────────────────────────────────────────────────
//
// The Lens model: the chart you're looking at (an LLMCall / Agent primitive)
// is ALWAYS one box; every subflow INSIDE it is a drill card (click → zoom).
// This is distinct from `applyGroupLayout` (which boxes individual subflows).
// Here there's no per-subflow mount — the whole graph is the box's contents,
// so we synthesise ONE container node and nest every top-level node under it.
//
// Composition contract: feed this the ALREADY drill-filtered graph (top-level
// nodes only; subflow internals hidden behind their drill cards). Nodes that
// already carry a `parentId` are left parented as-is (only parentId-less
// top-level nodes get re-parented to the main box), so this composes safely
// even if some upstream nesting exists.

/** Default id for the synthesised main-chart container node. */
export const MAIN_CHART_BOX_ID = "__main_chart__";

export interface MainChartBoxOptions {
  /** Layout applied to the chart's contents before wrapping. */
  readonly baseLayout: TraceFlowLayout;
  /** Container node id. Default `__main_chart__`. */
  readonly id?: string;
  /** Box title (rendered in the container header). */
  readonly label?: string;
  /** Optional taxonomy hint surfaced on `data` (e.g. 'LLMCall' | 'Agent'). */
  readonly kind?: string;
  readonly padding?: number;
  readonly headerHeight?: number;
  readonly nodeWidth?: number;
  readonly nodeHeight?: number;
}

/**
 * Wrap an entire graph in a single main-chart container box. Pure
 * `(graph, opts) => graph`; input not mutated. Empty graph → returned
 * unchanged (nothing to wrap).
 */
export function wrapInMainChartBox(graph: TraceGraph, opts: MainChartBoxOptions): TraceGraph {
  if (graph.nodes.length === 0) return graph;

  const padding = opts.padding ?? DEFAULT_PADDING;
  const headerHeight = opts.headerHeight ?? DEFAULT_HEADER;
  const nodeW = opts.nodeWidth ?? DEFAULT_NODE_W;
  const nodeH = opts.nodeHeight ?? DEFAULT_NODE_H;
  const mainId = opts.id ?? MAIN_CHART_BOX_ID;

  const positioned = opts.baseLayout(graph);

  // Only top-level nodes (no existing parentId) get re-parented to the box;
  // already-nested nodes keep their parent (their relative position is
  // unaffected by re-parenting their ancestor — xyflow positions are
  // parent-relative).
  const topLevel = positioned.nodes.filter((n) => n.parentId === undefined);

  // Bounding box of the top-level nodes → container size. We measure each
  // node's full FOOTPRINT (position + width/height), not just its top-left
  // corner — a top-level node may itself be a wide group container (from a
  // prior `applyGroupLayout` pass) carrying a large `style.width`. Reading
  // only the corner would size the box as if that container were a 200px
  // node, so it would overflow the outer box (the nesting bug).
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const n of topLevel) {
    const p = n.position;
    const { width, height } = footprintOf(n, nodeW, nodeH);
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x + width > maxX) maxX = p.x + width;
    if (p.y + height > maxY) maxY = p.y + height;
  }
  if (!Number.isFinite(minX)) {
    minX = 0;
    minY = 0;
    maxX = 0;
    maxY = 0;
  }

  // maxX/maxY already include the widest/tallest node's footprint, so the
  // box size is just the spanned extent + padding (+ header for the title).
  // When the chart has a loop-back edge, `LoopBackEdge` bows out to a lane
  // `LOOP_LANE_GAP` right of the widest content node — reserve that width so
  // the curve renders INSIDE the frame instead of spilling past its right border.
  const hasLoopEdge = graph.edges.some((e) => e.data?.kind === "loop");
  const loopReserve = hasLoopEdge ? LOOP_LANE_GAP : 0;
  const boxWidth = maxX - minX + padding * 2 + loopReserve;
  const boxHeight = maxY - minY + headerHeight + padding * 2;

  const container: TraceNode = {
    id: mainId,
    type: GROUP_CONTAINER_NODE_TYPE,
    position: { x: 0, y: 0 },
    style: { width: boxWidth, height: boxHeight },
    data: {
      label: opts.label ?? "Chart",
      isDecider: false,
      isFork: false,
      isStreaming: false,
      isSubflow: false,
      isGroupContainer: true,
      isMainChart: true,
      ...(opts.kind !== undefined && { kind: opts.kind }),
      prevIds: [],
      nextIds: [],
    },
  } as TraceNode;

  const topLevelIds = new Set(topLevel.map((n) => n.id));
  const reparented: TraceNode[] = positioned.nodes.map((n) => {
    if (!topLevelIds.has(n.id)) return n; // already nested — leave as-is
    return {
      ...n,
      parentId: mainId,
      extent: "parent",
      position: {
        x: n.position.x - minX + padding,
        y: n.position.y - minY + headerHeight + padding,
      },
    };
  });

  // Container FIRST (xyflow parent-before-child invariant).
  return { nodes: [container, ...reparented], edges: graph.edges };
}

/**
 * Convenience: a `TraceFlowLayout` that wraps the whole chart in one
 * main-chart box. Pass to `<TraceFlow layout={...}>` / `<TracedFlow>`.
 */
export function createMainChartBoxLayout(opts: MainChartBoxOptions): TraceFlowLayout {
  return (graph: TraceGraph) => wrapInMainChartBox(graph, opts);
}
