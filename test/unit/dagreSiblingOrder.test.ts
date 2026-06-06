/**
 * Unit tests for the `siblingOrder` layout option — pins which side a fork's
 * branches draw on. The contract: the resolver returns child ids left-to-right
 * (index 0 = leftmost, last = rightmost), and the layout honors it for the
 * common symmetric decider/fork. This is what places the looping branch
 * (e.g. ToolCalls) on the right margin where the loop-back curve lives.
 *
 * Test types: unit (ordering), functional (swap), property (omitted children),
 * plus a guard that the default (no resolver) path is unchanged.
 */

import { describe, it, expect } from "vitest";
import type { Edge } from "@xyflow/react";
import type {
  TraceGraph,
  TraceNode,
  TraceNodeData,
  TraceEdgeData,
} from "../../src/components/FlowchartView/traceStructureRecorder";
import { dagreTraceLayout } from "../../src/components/FlowchartView/_internal/dagreTraceLayout";

function node(id: string): TraceNode {
  return {
    id,
    type: "stage",
    position: { x: 0, y: 0 },
    data: { label: id, isDecider: false, isFork: false, isStreaming: false, isSubflow: false, prevIds: [], nextIds: [] } as TraceNodeData,
  } as TraceNode;
}
const edge = (s: string, t: string, kind: TraceEdgeData["kind"] = "next"): Edge<TraceEdgeData> => ({
  id: `${s}->${t}:${kind}`,
  source: s,
  target: t,
  data: { kind },
});

/** A decider `route` forking to two branches `a` and `b`. */
function forkGraph(): TraceGraph {
  return {
    nodes: [node("root"), node("route"), node("a"), node("b")],
    edges: [
      edge("root", "route"),
      edge("route", "a", "decision-branch"),
      edge("route", "b", "decision-branch"),
    ],
  };
}

const xOf = (out: TraceGraph, id: string) => out.nodes.find((n) => n.id === id)!.position.x;

describe("dagreTraceLayout siblingOrder", () => {
  it("unit: list order is left-to-right — ['a','b'] puts a left, b right", () => {
    const out = dagreTraceLayout(forkGraph(), { siblingOrder: () => ["a", "b"] });
    expect(xOf(out, "b")).toBeGreaterThan(xOf(out, "a"));
  });

  it("functional: reversing the resolver swaps the sides", () => {
    const out = dagreTraceLayout(forkGraph(), { siblingOrder: () => ["b", "a"] });
    expect(xOf(out, "a")).toBeGreaterThan(xOf(out, "b"));
  });

  it("functional: only the named source is reordered (others untouched)", () => {
    // siblingOrder only fires for 'route'; an unrelated source is passed through.
    const out = dagreTraceLayout(forkGraph(), {
      siblingOrder: (src, kids) => (src === "route" ? ["b", "a"] : kids),
    });
    expect(xOf(out, "a")).toBeGreaterThan(xOf(out, "b"));
  });

  it("property: a child omitted by the resolver is still placed (kept after listed)", () => {
    const g: TraceGraph = {
      nodes: [node("root"), node("route"), node("a"), node("b"), node("c")],
      edges: [
        edge("root", "route"),
        edge("route", "a", "decision-branch"),
        edge("route", "b", "decision-branch"),
        edge("route", "c", "decision-branch"),
      ],
    };
    // Only mention 'c' first → it goes leftmost; a,b keep their order after it.
    const out = dagreTraceLayout(g, { siblingOrder: () => ["c"] });
    for (const id of ["a", "b", "c"]) {
      expect(out.nodes.find((n) => n.id === id)!.position.x).toBeTypeOf("number");
    }
    expect(xOf(out, "c")).toBeLessThan(xOf(out, "a"));
    expect(xOf(out, "c")).toBeLessThan(xOf(out, "b"));
  });

  it("guard: no resolver → layout identical to the default (option is opt-in)", () => {
    const g = forkGraph();
    const withDefault = dagreTraceLayout(g);
    const withNoopResolver = dagreTraceLayout(g, { siblingOrder: (_s, k) => k });
    const pos = (out: TraceGraph) => out.nodes.map((n) => `${n.id}:${Math.round(n.position.x)},${Math.round(n.position.y)}`).join("|");
    // A pass-through resolver reproduces the same geometry as no resolver.
    expect(pos(withNoopResolver)).toBe(pos(withDefault));
  });

  it("unit: single-child source is untouched by the resolver", () => {
    const g: TraceGraph = {
      nodes: [node("root"), node("only")],
      edges: [edge("root", "only")],
    };
    const spy: string[] = [];
    const out = dagreTraceLayout(g, {
      siblingOrder: (src, kids) => {
        spy.push(src);
        return kids;
      },
    });
    // root has a single child → resolver not consulted for it.
    expect(spy).not.toContain("root");
    expect(out.nodes.find((n) => n.id === "only")).toBeTruthy();
  });
});
