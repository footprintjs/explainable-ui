import { describe, expect, it } from "vitest";
import type { Node } from "@xyflow/react";
import { chartFitViewport, chartLayoutKey, chartMeasurementKey, measuredChartBounds } from "../../src/components/FlowchartView/_internal/chartFitGeometry";
import type { ChartFitNode, ChartFitState } from "../../src/components/FlowchartView/_internal/chartFitGeometry";

const node = (x = 20, y = 30, width = 100, height = 40): ChartFitNode => ({
  measured: { width, height }, internals: { positionAbsolute: { x, y } },
});
const state = (nodeLookup: Map<string, ChartFitNode> = new Map([["a", node()]])): ChartFitState => ({
  width: 800, height: 600, minZoom: 0.1, maxZoom: 2, nodeLookup,
});

describe("finite measured fit policy", () => {
  it("uses absolute parent/group positions and measured sizes", () => {
    const nodes = new Map([["a", node(10, 20, 40, 60)], ["b", node(-30, 100, 80, 50)]]);
    expect(measuredChartBounds(nodes)).toEqual({ x: -30, y: 20, width: 80, height: 130 });
    const viewport = chartFitViewport(state(nodes), 0.18)!;
    expect(Object.values(viewport).every(Number.isFinite)).toBe(true);
    expect(viewport.zoom).toBeGreaterThan(0);
  });

  it("refuses empty and all-hidden graphs", () => {
    expect(chartFitViewport(state(new Map()), 0.1)).toBeNull();
    expect(chartFitViewport(state(new Map([["a", { ...node(), hidden: true }]])), 0.1)).toBeNull();
  });

  it.each([0, -1, NaN, Infinity, -Infinity])("refuses invalid width/height %s rather than fitting a subset", (value) => {
    const nodes = new Map([["good", node()], ["bad", node(20, 30, value)]]);
    expect(chartFitViewport(state(nodes), 0.1)).toBeNull();
    nodes.set("bad", node(20, 30, 100, value));
    expect(chartFitViewport(state(nodes), 0.1)).toBeNull();
  });

  it("does not substitute estimated or declared dimensions for a measurement", () => {
    const unmeasured = { ...node(), measured: undefined, width: 100, height: 40 };
    expect(chartFitViewport(state(new Map([["a", unmeasured]])), 0.1)).toBeNull();
  });

  it.each([NaN, Infinity, -Infinity])("refuses invalid absolute coordinates %s", (value) => {
    expect(chartFitViewport(state(new Map([["a", node(value)]])), 0.1)).toBeNull();
    expect(chartFitViewport(state(new Map([["a", node(20, value)]])), 0.1)).toBeNull();
  });

  it("rejects overflow on node edges, cumulative span and viewport calculation", () => {
    expect(chartFitViewport(state(new Map([["a", node(Number.MAX_VALUE, 0, Number.MAX_VALUE)]])), 0.1)).toBeNull();
    const nodes = new Map([["left", node(-Number.MAX_VALUE, 0)], ["right", node(Number.MAX_VALUE, 0)]]);
    expect(chartFitViewport(state(nodes), 0.1)).toBeNull();
    const huge = new Map([["a", node(Number.MAX_VALUE / 2, 0, Number.MAX_VALUE / 4)]]);
    expect(chartFitViewport({ ...state(huge), minZoom: 4, maxZoom: 4 }, 0.1)).toBeNull();
  });

  it.each([0, -1, NaN, Infinity])("refuses invalid viewport dimensions and zoom limit %s", (value) => {
    for (const key of ["width", "height", "minZoom", "maxZoom"]) {
      expect(chartFitViewport({ ...state(), [key]: value }, 0.1)).toBeNull();
    }
  });

  it("rejects inverted zoom limits and invalid padding", () => {
    expect(chartFitViewport({ ...state(), minZoom: 3, maxZoom: 1 }, 0.1)).toBeNull();
    for (const padding of [-1, NaN, Infinity]) expect(chartFitViewport(state(), padding)).toBeNull();
  });

  it("derived measurement key notices in-place Map updates but not ordinary camera/position changes", () => {
    const current = state();
    const nodes = current.nodeLookup as Map<string, ChartFitNode>;
    const first = chartMeasurementKey(current);
    nodes.set("a", node(200, 400));
    expect(chartMeasurementKey(current)).toBe(first);
    nodes.set("a", node(200, 400, 101));
    expect(chartMeasurementKey(current)).not.toBe(first);
  });

  it("layout key is stable for colors/labels/selection/scrubbing, changes for actual geometry", () => {
    const a: Node = { id: "a", position: { x: 10, y: 20 }, data: { label: "first" } };
    const first = chartLayoutKey([a]);
    expect(chartLayoutKey([{ ...a, data: { label: "changed", active: true }, selected: true, style: { color: "red" } }])).toBe(first);
    expect(chartLayoutKey([{ ...a, position: { x: 11, y: 20 } }])).not.toBe(first);
    expect(chartLayoutKey([{ ...a, parentId: "group" }])).not.toBe(first);
  });
});
