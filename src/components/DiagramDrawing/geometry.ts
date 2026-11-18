import type { TraceGraph } from "../FlowchartView/traceStructureRecorder";
import type { DiagramGeometry, DiagramNodeGeometry, DiagramPoint } from "./types";

function ownValue(value: unknown, key: string): unknown {
  if (!value || typeof value !== "object") return undefined;
  return Object.getOwnPropertyDescriptor(value, key)?.value;
}

function readPoint(point: unknown, width: number, height: number): DiagramPoint | undefined {
  const x = ownValue(point, "x");
  const y = ownValue(point, "y");
  if (typeof x !== "number" || !Number.isFinite(x) || x < 0 || x > width ||
      typeof y !== "number" || !Number.isFinite(y) || y < 0 || y > height) return undefined;
  return { x, y };
}

/** Malformed or absent entries use the stock geometry, with no partial overrides. */
export function getDiagramNodeGeometry(geometry: DiagramGeometry | undefined, id: string): DiagramNodeGeometry | undefined {
  if (!geometry) return undefined;
  const raw = ownValue(ownValue(geometry, "nodes"), id);
  if (!raw || typeof raw !== "object") return undefined;
  const width = ownValue(raw, "width");
  const height = ownValue(raw, "height");
  if (typeof width !== "number" || !Number.isFinite(width) || width <= 0 ||
      typeof height !== "number" || !Number.isFinite(height) || height <= 0) return undefined;
  const source = readPoint(ownValue(raw, "source"), width, height);
  const target = readPoint(ownValue(raw, "target"), width, height);
  if (!source || !target) return undefined;
  const drawing = Object.getOwnPropertyDescriptor(raw, "drawing");
  if (drawing && (!("value" in drawing) || (drawing.value !== undefined && typeof drawing.value !== "string"))) return undefined;
  // Build a plain value to avoid consulting inherited properties at render time.
  return { width, height, source, target,
    ...(drawing?.value !== undefined && { drawing: drawing.value }) };
}

/** Layout reads the same CSS box that XYFlow measures. Containers own their group bounds. */
export function prepareDiagramGeometry(graph: TraceGraph, geometry?: DiagramGeometry): TraceGraph {
  if (!geometry) return graph;
  let changed = false;
  const nodes = graph.nodes.map(node => {
    if (node.type === "groupContainer" || node.data.isGroupContainer) return node;
    const shape = getDiagramNodeGeometry(geometry, node.id);
    if (!shape || (shape.width === node.width && shape.height === node.height &&
        shape.width === node.style?.width && shape.height === node.style?.height)) return node;
    changed = true;
    // XYFlow prioritizes node.width/height over inline styles, including during SSR.
    const size = { width: shape.width, height: shape.height };
    return { ...node, ...size, style: { ...node.style, ...size } };
  });
  return changed ? { ...graph, nodes } : graph;
}
