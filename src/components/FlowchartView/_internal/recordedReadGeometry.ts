import type { Rect } from "@xyflow/react";
import { GROUP_CONTAINER_NODE_TYPE } from "./groupLayout";
import { positiveFinite, type ChartFitNode } from "./chartFitGeometry";

export const RECORDED_READ_LABEL_WIDTH = 220;
export const RECORDED_READ_LABEL_HEIGHT = 20;

interface ReadNode extends ChartFitNode { readonly type?: string; }
export interface RecordedReadGeometry {
  readonly path: string;
  readonly label: Rect;
  readonly bounds: Rect;
}

/** One paint-only route for rendering and automatic fitting. Labels have a
 * bounded HTML box, so fitting does not guess a font's text measurements. */
export function recordedReadGeometry(
  nodes: ReadonlyMap<string, ReadNode>, source: string, target: string, lane: number,
): RecordedReadGeometry | null {
  const from = nodes.get(source), to = nodes.get(target);
  if (!from || !to || from.hidden || to.hidden || !Number.isSafeInteger(lane) || lane < 0) return null;
  const sx = from.internals.positionAbsolute.x, tx = to.internals.positionAbsolute.x;
  const fromY = from.internals.positionAbsolute.y, toY = to.internals.positionAbsolute.y;
  const fromHeight = from.measured?.height, toHeight = to.measured?.height;
  if (![sx, tx, fromY, toY].every(Number.isFinite) || !positiveFinite(fromHeight) || !positiveFinite(toHeight)) return null;
  let left = Math.min(sx, tx);
  for (const node of nodes.values()) {
    if (node.hidden || node.type === GROUP_CONTAINER_NODE_TYPE) continue;
    const x = node.internals.positionAbsolute.x;
    if (Number.isFinite(x)) left = Math.min(left, x);
  }
  const sy = fromY + fromHeight / 2, ty = toY + toHeight / 2;
  const x = left - 36 - (lane % 6) * 18;
  const label = { x: x - RECORDED_READ_LABEL_WIDTH / 2, y: (sy + ty) / 2 - RECORDED_READ_LABEL_HEIGHT / 2,
    width: RECORDED_READ_LABEL_WIDTH, height: RECORDED_READ_LABEL_HEIGHT };
  // The cubic stays inside its control-point hull. Include stroke/marker room
  // and the full maximum label box, even when its text happens to be short.
  const minX = Math.min(x - 8, label.x), maxX = Math.max(sx, tx, label.x + label.width) + 8;
  const minY = Math.min(sy, ty, label.y) - 8, maxY = Math.max(sy, ty, label.y + label.height) + 8;
  return { path: `M ${sx} ${sy} C ${x} ${sy}, ${x} ${ty}, ${tx} ${ty}`, label,
    bounds: { x: minX, y: minY, width: maxX - minX, height: maxY - minY } };
}
