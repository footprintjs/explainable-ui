import { expect, it } from "vitest";
import { shapeBoundaryPoint } from "../../src/components/GroupedFlowDiagram/nodeShapeGeometry";

it.each([
  ["diamond", "left", 25, 50, 25],
  ["diamond", "right", 25, 150, 25],
  ["diamond", "top", 25, 25, 37.5],
  ["diamond", "bottom", 25, 25, 62.5],
  ["parcel", "left", 7, 12, 7],
  ["parcel", "right", 93, 188, 93],
  ["parcel", "top", 12, 12, 7],
  ["parcel", "bottom", 188, 188, 93],
  ["document", "left", 9, 0, 9],
  ["document", "right", 9, 184, 9],
  ["document", "top", 184, 184, 9],
  ["document", "bottom", 184, 184, 100],
] as const)("locates the %s %s outline at offset %i", (shape, side, offset, x, y) => {
  const point = shapeBoundaryPoint(shape, 200, 100, side, offset);
  expect(point.x).toBeCloseTo(x, 10);
  expect(point.y).toBeCloseTo(y, 10);
});

it.each(["diamond", "parcel", "document", undefined] as const)("keeps centered workflow handles on all four %s sides", shape => {
  expect(shapeBoundaryPoint(shape, 200, 100, "left")).toEqual({ x: 0, y: 50 });
  expect(shapeBoundaryPoint(shape, 200, 100, "right")).toEqual({ x: 200, y: 50 });
  expect(shapeBoundaryPoint(shape, 200, 100, "top")).toEqual({ x: 100, y: 0 });
  expect(shapeBoundaryPoint(shape, 200, 100, "bottom")).toEqual({ x: 100, y: 100 });
});
