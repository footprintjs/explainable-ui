/**
 * Tests for loop-back edge routing — the right-margin curve that replaces the
 * old straight-down-the-spine loop line.
 *
 * Two layers:
 *   - PURE GEOMETRY (`loopRouting`): the lane x and the SVG curve path.
 *   - LAYOUT RESERVE (`wrapInMainChartBox`): the box reserves `LOOP_LANE_GAP`
 *     of right-margin width when a loop edge is present, so the curve renders
 *     INSIDE the frame.
 *
 * Test types (per project Convention 3): unit, functional, property.
 */

import { describe, it, expect } from "vitest";
import type { Edge } from "@xyflow/react";
import {
  LOOP_LANE_GAP,
  loopLaneX,
  loopBackPath,
} from "../../src/components/FlowchartView/_internal/loopRouting";
import { wrapInMainChartBox } from "../../src/components/FlowchartView/_internal/groupLayout";
import type {
  TraceGraph,
  TraceNode,
  TraceNodeData,
  TraceEdgeData,
} from "../../src/components/FlowchartView/traceStructureRecorder";

// ── Helpers ────────────────────────────────────────────────────────────────

/** Parse every `x,y` coordinate pair out of an SVG path string (in order). */
function pathPoints(path: string): Array<{ x: number; y: number }> {
  const nums = (path.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
  const pts: Array<{ x: number; y: number }> = [];
  for (let i = 0; i + 1 < nums.length; i += 2) pts.push({ x: nums[i]!, y: nums[i + 1]! });
  return pts;
}

function node(id: string, x: number, w: number, h = 80, data: Partial<TraceNodeData> = {}): TraceNode {
  return {
    id,
    type: "stage",
    position: { x, y: 0 },
    style: { width: w, height: h },
    data: { label: id, isDecider: false, isFork: false, isStreaming: false, isSubflow: false, prevIds: [], nextIds: [], ...data },
  } as TraceNode;
}

function edge(source: string, target: string, kind: TraceEdgeData["kind"] = "next"): Edge<TraceEdgeData> {
  return { id: `${source}->${target}:${kind}`, source, target, data: { kind } };
}

/** Stub layout: keep each node's given position (identity). */
const keepPositions = (g: TraceGraph): TraceGraph => g;

// ── loopLaneX ────────────────────────────────────────────────────────────

describe("loopLaneX (lane clear of every content node)", () => {
  it("unit: returns the widest right edge plus the gap", () => {
    expect(loopLaneX([100, 240, 180])).toBe(240 + LOOP_LANE_GAP);
  });

  it("unit: honors a custom gap", () => {
    expect(loopLaneX([100, 240], 10)).toBe(250);
  });

  it("unit: empty input degrades to the gap (max → 0)", () => {
    expect(loopLaneX([])).toBe(LOOP_LANE_GAP);
  });

  it("property: the lane is right of EVERY content node, for any rights", () => {
    for (let trial = 0; trial < 200; trial++) {
      const n = 1 + (trial % 6);
      const rights = Array.from({ length: n }, (_, i) => ((trial * 7 + i * 13) % 1000) - 200);
      const lane = loopLaneX(rights);
      for (const r of rights) expect(lane).toBeGreaterThan(r);
    }
  });
});

// ── loopBackPath ──────────────────────────────────────────────────────────

describe("loopBackPath (right-margin routed curve)", () => {
  it("unit: starts at the source's right edge and ends at the target's right edge", () => {
    const pts = pathPoints(loopBackPath({ right: 300, centerY: 900 }, { right: 320, centerY: 120 }, 460));
    expect(pts[0]).toEqual({ x: 300, y: 900 });
    expect(pts[pts.length - 1]).toEqual({ x: 320, y: 120 });
  });

  it("unit: the route never goes right of the lane (the lane is its max-x)", () => {
    const laneX = 460;
    const pts = pathPoints(loopBackPath({ right: 300, centerY: 900 }, { right: 320, centerY: 120 }, laneX));
    const maxX = Math.max(...pts.map((p) => p.x));
    expect(maxX).toBe(laneX); // hugs the lane; the bezier-bow version overshot/undershot
  });

  it("functional: the route HUGS the lane (right of both endpoints) — no node-crossing", () => {
    // The lane is the route's rightmost extent and is right of both endpoints,
    // so the vertical run clears every node (which all sit left of the lane).
    const source = { right: 300, centerY: 900 };
    const target = { right: 300, centerY: 120 };
    const laneX = loopLaneX([source.right, target.right]);
    const pts = pathPoints(loopBackPath(source, target, laneX));
    const maxX = Math.max(...pts.map((p) => p.x));
    expect(maxX).toBe(laneX);
    expect(maxX).toBeGreaterThan(source.right);
    expect(maxX).toBeGreaterThan(target.right);
    // and the turn-in to the target happens AT the target's row (its centerY),
    // i.e. there are points on the lane at the target's y → cleared above nodes.
    expect(pts.some((p) => Math.abs(p.x - laneX) < 1 && p.y === target.centerY)).toBe(true);
  });

  it("property: the route's max-x is exactly the lane for any endpoints + the lane clears both", () => {
    for (let trial = 0; trial < 200; trial++) {
      const sr = ((trial * 11) % 600) - 100;
      const tr = ((trial * 17) % 600) - 100;
      const laneX = loopLaneX([sr, tr]);
      const pts = pathPoints(loopBackPath({ right: sr, centerY: 0 }, { right: tr, centerY: 500 }, laneX));
      const maxX = Math.max(...pts.map((p) => p.x));
      expect(maxX).toBeLessThanOrEqual(laneX + 0.001);
      expect(laneX).toBeGreaterThan(sr);
      expect(laneX).toBeGreaterThan(tr);
    }
  });
});

// ── wrapInMainChartBox loop-lane reserve ───────────────────────────────────

describe("wrapInMainChartBox reserves the loop lane", () => {
  const nodes = [node("a", 0, 200), node("b", 0, 200)];

  it("functional: a loop edge widens the box by exactly LOOP_LANE_GAP", () => {
    const noLoop: TraceGraph = { nodes, edges: [edge("a", "b")] };
    const withLoop: TraceGraph = { nodes, edges: [edge("a", "b"), edge("b", "a", "loop")] };

    const boxOf = (g: TraceGraph) => {
      const out = wrapInMainChartBox(g, { baseLayout: keepPositions });
      const container = out.nodes.find((n) => n.id === "__main_chart__")!;
      return (container.style as { width: number }).width;
    };

    expect(boxOf(withLoop) - boxOf(noLoop)).toBe(LOOP_LANE_GAP);
  });

  it("functional: the lane x falls INSIDE the reserved box width", () => {
    const withLoop: TraceGraph = { nodes, edges: [edge("a", "b"), edge("b", "a", "loop")] };
    const out = wrapInMainChartBox(withLoop, { baseLayout: keepPositions });
    const container = out.nodes.find((n) => n.id === "__main_chart__")!;
    const boxWidth = (container.style as { width: number }).width;

    // Content nodes (re-parented) sit at their absolute right; the lane is just
    // right of the widest. It must be within the box's right border.
    const contentRights = out.nodes
      .filter((n) => n.id !== "__main_chart__")
      .map((n) => n.position.x + (n.style as { width: number }).width);
    const laneX = loopLaneX(contentRights);
    expect(laneX).toBeLessThanOrEqual(boxWidth);
  });
});
