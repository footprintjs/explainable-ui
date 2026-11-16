import {
  createDagreTraceLayout,
  GROUP_CONTAINER_NODE_TYPE,
  type TraceFlowLayout,
  type TraceGraph,
  type TraceNode,
} from "footprint-explainable-ui/flowchart";

export const ISOMETRIC_NODE_WIDTH = 168;
export const ISOMETRIC_NODE_HEIGHT = 116;

const COS_30 = Math.sqrt(3) / 2;
const SIN_30 = 0.5;
const OUTER_PADDING = 32;
const CARD_GAP = 24;

function isContainer(node: TraceNode): boolean {
  return node.type === GROUP_CONTAINER_NODE_TYPE || node.data.isGroupContainer === true;
}

function dimension(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback;
}

function footprint(node: TraceNode): { width: number; height: number } {
  return {
    width: dimension(node.style?.width, ISOMETRIC_NODE_WIDTH),
    height: dimension(node.style?.height, ISOMETRIC_NODE_HEIGHT),
  };
}

/**
 * A consumer-owned 2D projection, not a second execution model or 3D camera.
 * Group helpers call this for their interiors before stamping each outer box.
 * Already nested children retain those parent-relative interior positions;
 * their authoritative container is placed as one opaque outer footprint.
 */
export const isometricLayout: TraceFlowLayout = (graph: TraceGraph): TraceGraph => {
  if (graph.nodes.length === 0) return graph;

  const sized = graph.nodes.map((node): TraceNode => {
    const size = isContainer(node) ? footprint(node) : {
      width: ISOMETRIC_NODE_WIDTH,
      height: ISOMETRIC_NODE_HEIGHT,
    };
    return { ...node, style: { ...node.style, ...size } };
  });
  const ids = new Set(sized.map(node => node.id));
  const outer = sized.filter(node => !node.parentId || !ids.has(node.parentId));
  if (outer.length === 0) return { ...graph, nodes: sized };

  const outerIds = new Set(outer.map(node => node.id));
  const widths = outer.map(node => footprint(node).width);
  const heights = outer.map(node => footprint(node).height);
  const hasContainers = outer.some(isContainer);
  const layout = createDagreTraceLayout({
    direction: "LR",
    // A grouped frame can be much larger than a tile. Reserve its real size
    // before projecting, rather than laying it out as a small mount card.
    rankSep: hasContainers ? Math.max(104, Math.max(...heights) * 0.75) : Math.max(64, Math.max(...heights) * 0.4),
    nodeSep: hasContainers ? Math.max(112, Math.max(...widths) * 0.6) : Math.max(84, Math.max(...widths) * 0.4),
    edgeSep: 32,
    nodeWidth: ISOMETRIC_NODE_WIDTH,
    nodeHeight: ISOMETRIC_NODE_HEIGHT,
  });
  const positioned = layout({
    // External parent links do not belong to this isolated layout scope.
    // They are restored from the original nodes in the final result.
    nodes: outer.map(({ parentId: _parentId, ...node }) => node),
    edges: graph.edges.filter(edge => outerIds.has(edge.source) && outerIds.has(edge.target)),
  });
  const projected = positioned.nodes.map(node => {
    const { width, height } = footprint(node);
    const x = node.position.x + width / 2;
    const y = node.position.y + height / 2;
    return { id: node.id, width, height, x: COS_30 * (x - y), y: SIN_30 * (x + y) };
  });

  // Projection rotates the spacing directions but the rendered cards/frames
  // remain upright rectangles. Spread all centers uniformly only when needed
  // to clear their true bounds; this retains the fixed projection angle.
  let spread = 1;
  for (let i = 0; i < projected.length; i++) {
    for (let j = i + 1; j < projected.length; j++) {
      const a = projected[i], b = projected[j];
      const dx = Math.abs(a.x - b.x), dy = Math.abs(a.y - b.y);
      const horizontal = dx > 0 ? ((a.width + b.width) / 2 + CARD_GAP) / dx : Infinity;
      const vertical = dy > 0 ? ((a.height + b.height) / 2 + CARD_GAP) / dy : Infinity;
      const required = Math.min(horizontal, vertical);
      if (Number.isFinite(required)) spread = Math.max(spread, required);
    }
  }
  const minX = Math.min(...projected.map(node => node.x * spread - node.width / 2));
  const minY = Math.min(...projected.map(node => node.y * spread - node.height / 2));
  const positions = new Map(projected.map(node => [node.id, {
    x: node.x * spread - node.width / 2 - minX + OUTER_PADDING,
    y: node.y * spread - node.height / 2 - minY + OUTER_PADDING,
  }]));

  return {
    ...graph,
    nodes: sized.map(node => positions.has(node.id)
      ? { ...node, position: positions.get(node.id)! }
      : node),
    edges: graph.edges,
  };
};
