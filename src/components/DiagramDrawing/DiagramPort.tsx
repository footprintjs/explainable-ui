import { Handle, Position, type HandleProps } from "@xyflow/react";
import type { DiagramNodeGeometry } from "./types";

/** A zero-size XYFlow handle puts its measured endpoint precisely at the authored point. */
export function DiagramPort({ geometry, ...native }: HandleProps & { geometry?: DiagramNodeGeometry }) {
  if (!geometry) return <Handle {...native} />;
  const { x, y } = geometry[native.type];
  const distance = { [Position.Left]: x, [Position.Right]: geometry.width - x,
    [Position.Top]: y, [Position.Bottom]: geometry.height - y };
  let position = native.position;
  for (const side of [Position.Left, Position.Right, Position.Top, Position.Bottom])
    if (distance[side] < distance[position]) position = side;
  return <Handle {...native} position={position} style={{ ...native.style, left: x, top: y, right: "auto", bottom: "auto",
    width: 0, height: 0, minWidth: 0, minHeight: 0, border: 0, transform: "none", opacity: 0 }} />;
}
