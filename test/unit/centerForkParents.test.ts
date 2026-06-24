/**
 * centerForkParents — unit suite (mirrors snapLinearSuccessors.test.ts).
 *
 * Covers: span-midpoint centering, own-width recompute, the protection gates
 * (linear / merge / cross-compound / <2 kids), loop exclusion, purity,
 * idempotency, and — the regression guard the review panel demanded — the
 * same-rank SIBLING-OVERLAP clamp + a real-dagre composition no-overlap check.
 */
import { describe, it, expect } from "vitest";
import type { Edge } from "@xyflow/react";
import type {
  TraceGraph,
  TraceNode,
  TraceNodeData,
  TraceEdgeData,
} from "../../src/components/FlowchartView/traceStructureRecorder";
import {
  centerForkParents,
  withForkCentering,
} from "../../src/components/FlowchartView/_internal/centerForkParents";
import {
  createDagreTraceLayout,
  type NodeSizeResolver,
} from "../../src/components/FlowchartView/_internal/dagreTraceLayout";

function node(id: string, x = 0, y = 0, extra: Partial<TraceNode> = {}): TraceNode {
  return {
    id,
    type: "stage",
    position: { x, y },
    data: {
      label: id,
      isDecider: false,
      isFork: false,
      isStreaming: false,
      isSubflow: false,
      prevIds: [],
      nextIds: [],
    } as TraceNodeData,
    ...extra,
  } as TraceNode;
}
const edge = (
  s: string,
  t: string,
  kind: TraceEdgeData["kind"] = "next",
): Edge<TraceEdgeData> => ({ id: `${s}->${t}:${kind}`, source: s, target: t, data: { kind } });

const sizing =
  (overrides: Record<string, number> = {}): NodeSizeResolver =>
  (n) => ({ width: overrides[n.id] ?? 200, height: 80 });
const centerOf =
  (out: TraceGraph, w: Record<string, number> = {}) =>
  (id: string) => {
    const n = out.nodes.find((x) => x.id === id)!;
    return n.position.x + (w[id] ?? 200) / 2;
  };

describe("centerForkParents — centers a fork parent over its children's span", () => {
  it("centers a fork parent on the midpoint of its children's center-x", () => {
    // Parent sits off-center at x=0 (center 100); children at centers 100 and 700.
    const g: TraceGraph = {
      nodes: [node("f", 0, 0), node("a", 0, 100), node("b", 600, 100)],
      edges: [edge("f", "a"), edge("f", "b")],
    };
    const out = centerForkParents(g);
    const c = centerOf(out);
    expect(c("f")).toBeCloseTo((c("a") + c("b")) / 2, 5); // = (100+700)/2 = 400
    expect(c("f")).toBeCloseTo(400, 5);
  });

  it("uses span-midpoint (min+max), IGNORING interior children — asymmetric fan", () => {
    // 3 children: centers 100, 150, 700. Barycenter ≈ 316.7; span-mid = 400.
    const g: TraceGraph = {
      nodes: [node("f", 0, 0), node("a", 0, 100), node("b", 50, 100), node("c", 600, 100)],
      edges: [edge("f", "a"), edge("f", "b"), edge("f", "c")],
    };
    const c = centerOf(centerForkParents(g));
    expect(c("f")).toBeCloseTo(400, 5); // span-mid, NOT the 316.7 barycenter
  });

  it("recomputes top-left from the parent's OWN width (wide parent lands by center)", () => {
    const g: TraceGraph = {
      nodes: [node("f", 0, 0), node("a", 0, 100), node("b", 600, 100)],
      edges: [edge("f", "a"), edge("f", "b")],
    };
    const out = centerForkParents(g, { nodeSize: sizing({ f: 300 }) });
    const f = out.nodes.find((n) => n.id === "f")!;
    expect(f.position.x + 300 / 2).toBeCloseTo(400, 5); // center 400 → x = 400 - 150 = 250
    expect(f.position.x).toBeCloseTo(250, 5);
  });
});

describe("centerForkParents — never moves protected nodes", () => {
  it("a LINEAR node (out-degree < 2) is never moved", () => {
    const g: TraceGraph = { nodes: [node("a", 333, 0), node("b", 0, 100)], edges: [edge("a", "b")] };
    expect(centerForkParents(g).nodes.find((n) => n.id === "a")!.position.x).toBe(333);
  });

  it("a MERGE (in-degree > 1) is never moved even if it forks out", () => {
    // m has 2 preds (p1,p2) AND 2 succs (a,b) → it's a merge; must NOT be recentered.
    const g: TraceGraph = {
      nodes: [
        node("p1", 0, 0), node("p2", 400, 0),
        node("m", 999, 100),
        node("a", 0, 200), node("b", 600, 200),
      ],
      edges: [edge("p1", "m"), edge("p2", "m"), edge("m", "a"), edge("m", "b")],
    };
    expect(centerForkParents(g).nodes.find((n) => n.id === "m")!.position.x).toBe(999);
  });

  it("children in a DIFFERENT compound are not counted (needs >=2 same-compound kids)", () => {
    const g: TraceGraph = {
      nodes: [
        node("f", 333, 0),
        node("a", 0, 100, { parentId: "box" }),
        node("b", 600, 100, { parentId: "box" }),
      ],
      edges: [edge("f", "a"), edge("f", "b")],
    };
    // f.parentId is undefined; both kids are in "box" → 0 same-compound kids → no move.
    expect(centerForkParents(g).nodes.find((n) => n.id === "f")!.position.x).toBe(333);
  });
});

describe("centerForkParents — loop handling", () => {
  it("excludes loop back-edges from the fork test", () => {
    // a→b (next) + a→c (loop). Forward out-degree of a = 1 → NOT a fork → not moved.
    const g: TraceGraph = {
      nodes: [node("a", 333, 0), node("b", 0, 100), node("c", 600, 100)],
      edges: [edge("a", "b"), edge("a", "c", "loop")],
    };
    expect(centerForkParents(g).nodes.find((n) => n.id === "a")!.position.x).toBe(333);
  });
});

describe("centerForkParents — purity & idempotency", () => {
  it("never mutates the input graph", () => {
    const g: TraceGraph = {
      nodes: [node("f", 0, 0), node("a", 0, 100), node("b", 600, 100)],
      edges: [edge("f", "a"), edge("f", "b")],
    };
    const before = g.nodes.map((n) => n.position.x);
    centerForkParents(g);
    expect(g.nodes.map((n) => n.position.x)).toEqual(before);
  });

  it("is idempotent — re-running finds centers already equal", () => {
    const g: TraceGraph = {
      nodes: [node("f", 0, 0), node("a", 0, 100), node("b", 600, 100)],
      edges: [edge("f", "a"), edge("f", "b")],
    };
    const once = centerForkParents(g);
    const twice = centerForkParents(once);
    expect(twice.nodes.map((n) => n.position.x)).toEqual(once.nodes.map((n) => n.position.x));
  });
});

describe("centerForkParents — overlap safety (the clamp the panel required)", () => {
  it("SIBLING-OVERLAP: re-centering keeps same-rank clearance >= nodeSep", () => {
    // Two fork parents at the same rank (y=0), each pulled TOWARD the other by
    // its children. Without the clamp they would cross; with it, the gap holds.
    const g: TraceGraph = {
      nodes: [
        node("fL", 0, 0), node("fR", 260, 0), // gap 60 (200-wide), == nodeSep
        node("L1", 200, 100), node("L2", 400, 100), // fL pulled RIGHT (mid 400)
        node("R1", -100, 100), node("R2", 100, 100), // fR pulled LEFT (mid 100)
      ],
      edges: [edge("fL", "L1"), edge("fL", "L2"), edge("fR", "R1"), edge("fR", "R2")],
    };
    const out = centerForkParents(g, { nodeSep: 60 });
    const fL = out.nodes.find((n) => n.id === "fL")!;
    const fR = out.nodes.find((n) => n.id === "fR")!;
    const gap = fR.position.x - (fL.position.x + 200);
    expect(gap).toBeGreaterThanOrEqual(60 - 1e-6); // clearance never drops below nodeSep
  });

  it("moves freely to span-mid when there is no same-rank neighbor in the way", () => {
    const g: TraceGraph = {
      nodes: [node("f", 0, 0), node("a", 0, 100), node("b", 600, 100)],
      edges: [edge("f", "a"), edge("f", "b")],
    };
    expect(centerOf(centerForkParents(g, { nodeSep: 60 }))("f")).toBeCloseTo(400, 5);
  });

  it("composed over real dagre introduces NO node overlap", () => {
    // A fork → 3 slots → merge, run through dagre then fork-centering; assert no
    // two nodes overlap (the centering must not undo dagre's packing).
    const resolver = sizing({});
    const layout = withForkCentering(createDagreTraceLayout({ nodeSize: resolver }), {
      nodeSize: resolver,
      nodeSep: 60,
    });
    const g: TraceGraph = {
      nodes: [
        node("root", 0, 0),
        node("s1", 0, 0), node("s2", 0, 0), node("s3", 0, 0),
        node("join", 0, 0),
      ],
      edges: [
        edge("root", "s1"), edge("root", "s2"), edge("root", "s3"),
        edge("s1", "join"), edge("s2", "join"), edge("s3", "join"),
      ],
    };
    const out = layout(g);
    const boxes = out.nodes.map((n) => ({ id: n.id, x: n.position.x, y: n.position.y, w: 200, h: 80 }));
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i];
        const b = boxes[j];
        const overlap =
          a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
        expect(overlap, `${a.id} overlaps ${b.id}`).toBe(false);
      }
    }
  });
});
