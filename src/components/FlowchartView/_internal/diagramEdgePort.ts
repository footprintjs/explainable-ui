import { getDiagramNodeGeometry, type DiagramGeometry } from "../../DiagramDrawing";
import type { ChartFitNode } from "./chartFitGeometry";
import { GROUP_CONTAINER_NODE_TYPE } from "./groupLayout";

/** Semantic lanes have their own route, but an explicit host port is still its endpoint. */
export function diagramEdgePort(geometry: DiagramGeometry | undefined, id: string, kind: "source" | "target",
  node: ChartFitNode & { readonly type?: string; readonly data?: { readonly isGroupContainer?: unknown } }) {
  if (!geometry || node.type === GROUP_CONTAINER_NODE_TYPE || node.data?.isGroupContainer === true) return undefined;
  const point = getDiagramNodeGeometry(geometry, id)?.[kind];
  if (!point) return undefined;
  return { x: node.internals.positionAbsolute.x + point.x, y: node.internals.positionAbsolute.y + point.y };
}
