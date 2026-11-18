import type { FlowDiagramNode } from "./types";

type Shape = NonNullable<FlowDiagramNode["shape"]>;
export type ShapeSide = "left" | "right" | "top" | "bottom";
type Vertex = readonly [number, number];

// Coordinates are fractions of the node box. Drawing and attachment use the same perimeter.
const perimeters: Record<Shape, readonly Vertex[]> = {
  diamond: [[.5, 0], [1, .5], [.5, 1], [0, .5]],
  parcel: [[0, .14], [.12, 0], [1, 0], [1, .86], [.88, 1], [0, 1]],
  document: [[0, 0], [.84, 0], [1, .18], [1, 1], [0, 1]],
};

const details: Record<Shape, readonly (readonly Vertex[])[]> = {
  diamond: [],
  parcel: [
    [[0, .14], [.88, .14], [1, 0]],
    [[.88, .14], [.88, 1]],
    [[.49, 0], [.37, .14], [.37, .22], [.46, .22], [.46, .14], [.58, 0]],
  ],
  document: [[[.84, 0], [.84, .18], [1, .18]]],
};

// One fill-only area for the shaded parcel faces or the folded paper corner.
const facets: Record<Shape, readonly Vertex[]> = {
  diamond: [],
  parcel: [[0, .14], [.12, 0], [1, 0], [1, .86], [.88, 1], [.88, .14]],
  document: [[.84, 0], [1, .18], [.84, .18]],
};

export function shapeOutline(shape: Shape, width: number, height: number) {
  const path = (vertices: readonly Vertex[]) => vertices.map(([x, y], i) =>
    `${i === 0 ? "M" : "L"}${x * width},${y * height}`).join(" ");
  return {
    outline: `${path(perimeters[shape])} Z`,
    details: details[shape].map(path).join(" "),
    facets: facets[shape].length ? `${path(facets[shape])} Z` : "",
  };
}

/** Intersect the port's horizontal or vertical connector with the outside contour. */
export function shapeBoundaryPoint(shape: Shape | undefined, width: number, height: number, side: ShapeSide, offset?: number) {
  const horizontal = side === "left" || side === "right";
  const near = side === "left" || side === "top";
  const length = horizontal ? height : width;
  const along = Math.max(0, Math.min(length, offset ?? length / 2));
  let boundary = near ? 0 : 1;
  if (shape) {
    const vertices = perimeters[shape], cut = along / length;
    const fixedAxis = horizontal ? 1 : 0, movingAxis = horizontal ? 0 : 1;
    boundary = near ? Infinity : -Infinity;
    for (let i = 0; i < vertices.length; i++) {
      const a = vertices[i]!, b = vertices[(i + 1) % vertices.length]!;
      const start = a[fixedAxis], end = b[fixedAxis];
      if (start === end || cut < Math.min(start, end) || cut > Math.max(start, end)) continue;
      const position = a[movingAxis] + (cut - start) / (end - start) * (b[movingAxis] - a[movingAxis]);
      boundary = near ? Math.min(boundary, position) : Math.max(boundary, position);
    }
  }
  return horizontal ? { x: boundary * width, y: along } : { x: along, y: boundary * height };
}
