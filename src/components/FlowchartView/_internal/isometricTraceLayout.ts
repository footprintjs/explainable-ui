import { getDiagramNodeGeometry, prepareDiagramGeometry, type DiagramGeometry } from "../../DiagramDrawing";
import type { TraceFlowLayout } from "../TraceFlow";
import type { TraceGraph, TraceNode } from "../traceStructureRecorder";
import { createDagreTraceLayout, type NodeFootprint, type NodeSizeResolver } from "./dagreTraceLayout";
import { GROUP_CONTAINER_NODE_TYPE } from "./groupLayout";

export const ISOMETRIC_NODE_WIDTH = 168;
export const ISOMETRIC_NODE_HEIGHT = 116;

const COS_30 = Math.sqrt(3) / 2;
const SIN_30 = 0.5;
const OUTER_PADDING = 32;
const CARD_GAP = 24;

export interface IsometricTraceLayoutOptions {
  /** Measured/custom footprints affect layout only; they never stamp custom node styles. */
  readonly nodeSize?: NodeSizeResolver;
  /** Fixed built-in tiles use 168×116. Disable for a consumer stageNode replacement. */
  readonly fixedStageNodes?: boolean;
  /** Explicit host footprints override the stock tile dimensions for those IDs. */
  readonly diagramGeometry?: DiagramGeometry;
}

function isContainer(node: TraceNode): boolean {
  return node.type === GROUP_CONTAINER_NODE_TYPE || node.data.isGroupContainer === true;
}

function isStage(node: TraceNode): boolean {
  return node.type === undefined || node.type === "stage";
}

function dimension(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback;
}

interface ProjectedNode extends NodeFootprint {
  readonly id: string;
  readonly x: number;
  readonly y: number;
}

/**
 * Closest centers in O(n log n), with linear scratch storage. The recursive
 * halves are merged in y order; a strip compares at most seven successors.
 * This avoids an all-pairs scan when a large recording is projected.
 */
function minimumCenterDistance(points: readonly ProjectedNode[]): number {
  if (points.length < 2) return Infinity;
  const byX = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  const byY = byX.slice();
  const scratch = new Array<ProjectedNode>(points.length);
  const squared = (a: ProjectedNode, b: ProjectedNode) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
  const visit = (from: number, to: number): number => {
    if (to - from <= 3) {
      let best = Infinity;
      for (let i = from; i < to; i++) for (let j = i + 1; j < to; j++) best = Math.min(best, squared(byX[i], byX[j]));
      const ordered = byX.slice(from, to).sort((a, b) => a.y - b.y || a.x - b.x);
      for (let i = 0; i < ordered.length; i++) byY[from + i] = ordered[i];
      return best;
    }
    const middle = Math.floor((from + to) / 2);
    const middleX = byX[middle].x;
    let best = Math.min(visit(from, middle), visit(middle, to));
    let left = from, right = middle;
    for (let at = from; at < to; at++) {
      scratch[at] = right === to || left < middle && byY[left].y <= byY[right].y
        ? byY[left++] : byY[right++];
    }
    for (let at = from; at < to; at++) byY[at] = scratch[at];
    let count = 0;
    for (let at = from; at < to; at++) {
      if ((byY[at].x - middleX) ** 2 < best) scratch[count++] = byY[at];
    }
    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count && j <= i + 7; j++) {
        if ((scratch[j].y - scratch[i].y) ** 2 >= best) break;
        best = Math.min(best, squared(scratch[i], scratch[j]));
      }
    }
    return best;
  };
  return Math.sqrt(visit(0, points.length));
}

/**
 * Fixed-angle presentation of the existing graph. Parent-relative children
 * are already laid out by group helpers and stay local; their authoritative
 * container is placed as one outer footprint. IDs, data and edges pass through.
 */
export function createIsometricTraceLayout(options: IsometricTraceLayoutOptions = {}): TraceFlowLayout {
  const fixedStageNodes = options.fixedStageNodes !== false;
  return (graph: TraceGraph): TraceGraph => {
    if (graph.nodes.length === 0) return graph;
    const prepared = prepareDiagramGeometry(graph, options.diagramGeometry);
    const nodes = prepared.nodes.map(node => fixedStageNodes && isStage(node) && !isContainer(node) && !getDiagramNodeGeometry(options.diagramGeometry, node.id)
      ? { ...node, style: { ...node.style, width: ISOMETRIC_NODE_WIDTH, height: ISOMETRIC_NODE_HEIGHT } }
      : node);
    const ids = new Set(nodes.map(node => node.id));
    const outer = nodes.filter(node => !node.parentId || !ids.has(node.parentId));
    if (!outer.length) return { ...graph, nodes };

    const footprints = new Map<string, NodeFootprint>();
    let maxWidth = 0, maxHeight = 0, hasContainers = false;
    for (const node of outer) {
      const container = isContainer(node);
      const authored = !container ? getDiagramNodeGeometry(options.diagramGeometry, node.id) : undefined;
      const fixed = fixedStageNodes && isStage(node) && !container && !authored;
      const styleWidth = dimension(node.style?.width, NaN);
      const styleHeight = dimension(node.style?.height, NaN);
      // Stamped container dimensions and fixed built-in tiles are authoritative.
      const resolved = fixed || container && Number.isFinite(styleWidth) && Number.isFinite(styleHeight)
        ? undefined : authored ?? options.nodeSize?.(node);
      const fallbackWidth = dimension(node.measured?.width, dimension(node.width, ISOMETRIC_NODE_WIDTH));
      const fallbackHeight = dimension(node.measured?.height, dimension(node.height, ISOMETRIC_NODE_HEIGHT));
      const width = container ? dimension(styleWidth, dimension(resolved?.width, fallbackWidth))
        : fixed ? ISOMETRIC_NODE_WIDTH : dimension(resolved?.width, dimension(styleWidth, fallbackWidth));
      const height = container ? dimension(styleHeight, dimension(resolved?.height, fallbackHeight))
        : fixed ? ISOMETRIC_NODE_HEIGHT : dimension(resolved?.height, dimension(styleHeight, fallbackHeight));
      footprints.set(node.id, { width, height });
      maxWidth = Math.max(maxWidth, width); maxHeight = Math.max(maxHeight, height);
      hasContainers ||= container;
    }
    const outerIds = new Set(outer.map(node => node.id));
    const layout = createDagreTraceLayout({
      direction: "LR",
      rankSep: Math.max(hasContainers ? 104 : 64, maxHeight * (hasContainers ? 0.75 : 0.4)),
      nodeSep: Math.max(hasContainers ? 112 : 84, maxWidth * (hasContainers ? 0.6 : 0.4)),
      edgeSep: 32,
    });
    const positioned = layout({
      // These sizes are private layout inputs. Restore original custom styles
      // below so fallback dimensions cannot suppress xyflow measurement.
      nodes: outer.map(({ parentId: _parentId, ...node }) => ({
        ...node, style: { ...node.style, ...footprints.get(node.id)! },
      })),
      edges: graph.edges.filter(edge => outerIds.has(edge.source) && outerIds.has(edge.target)),
    });
    const projected = positioned.nodes.map(node => {
      const { width, height } = footprints.get(node.id)!;
      const x = node.position.x + width / 2, y = node.position.y + height / 2;
      return { id: node.id, width, height, x: COS_30 * (x - y), y: SIN_30 * (x + y) };
    });
    // Upright cards can collide after projection. A conservative global
    // footprint diagonal / closest distance ensures at least one axis clears
    // every pair, including the gap. Uniform scaling retains the 30° direction.
    const distance = minimumCenterDistance(projected);
    const spread = distance > 0 ? Math.max(1, Math.hypot(maxWidth + CARD_GAP, maxHeight + CARD_GAP) / distance) : 1;
    let minX = Infinity, minY = Infinity;
    for (const node of projected) {
      minX = Math.min(minX, node.x * spread - node.width / 2);
      minY = Math.min(minY, node.y * spread - node.height / 2);
    }
    const positions = new Map(projected.map(node => [node.id, {
      x: node.x * spread - node.width / 2 - minX + OUTER_PADDING,
      y: node.y * spread - node.height / 2 - minY + OUTER_PADDING,
    }]));
    return { ...graph, nodes: nodes.map(node => positions.has(node.id)
      ? { ...node, position: positions.get(node.id)! } : node), edges: graph.edges };
  };
}

export const isometricTraceLayout = createIsometricTraceLayout();
