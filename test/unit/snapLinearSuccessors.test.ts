/**
 * Unit tests for `snapLinearSuccessors` — the post-dagre spine alignment pass.
 *
 * The pass fixes balanced-mode x-drift: a pure single-in/single-out linear
 * successor snaps its center-x onto its single predecessor's center-x. These
 * tests pin BOTH the fix (the reported `messageAPI(merge) → callLLM(linear)`
 * drift) AND every node kind that must NEVER be moved (root, merge, fork
 * children, decision children, cross-compound hops), plus purity, idempotency,
 * and chain propagation.
 *
 * Drift is seeded DELIBERATELY by giving a successor an off-center
 * `position.x` (simulating dagre's averaged placement) rather than relying on
 * dagre's internal balancer to drift in a synthetic graph — that keeps the
 * assertions deterministic and independent of the installed dagre version. A
 * separate integration test composes the REAL `createSnappedDagreLayout`.
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
  snapLinearSuccessors,
  createSnappedDagreLayout,
} from "../../src/components/FlowchartView/_internal/snapLinearSuccessors";
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

/** Uniform 200×80 sizing unless a per-id override is supplied. */
const sizing =
  (overrides: Record<string, number> = {}): NodeSizeResolver =>
  (n) => ({ width: overrides[n.id] ?? 200, height: 80 });
const centerOf =
  (out: TraceGraph, w: Record<string, number> = {}) =>
  (id: string) => {
    const n = out.nodes.find((x) => x.id === id)!;
    return n.position.x + (w[id] ?? 200) / 2;
  };

describe("snapLinearSuccessors — the spine fix", () => {
  it("snaps a DRIFTED wide linear successor onto its merge predecessor's center", () => {
    // messageAPI(merge, w200) sits at center 917 (avg of its two slot parents).
    // callLLM(linear, w557) is DRIFTED to center 921 — the reported 6px bug.
    const W = { callLLM: 557 };
    const g: TraceGraph = {
      nodes: [
        node("slotA", 700, 0),
        node("slotB", 1000, 0),
        node("messageAPI", 817, 100), // center 817 + 100 = 917
        node("callLLM", 642.5, 200), // center 642.5 + 278.5 = 921 (drifted)
      ],
      edges: [edge("slotA", "messageAPI"), edge("slotB", "messageAPI"), edge("messageAPI", "callLLM")],
    };
    const out = snapLinearSuccessors(g, { nodeSize: sizing(W) });
    const c = centerOf(out, W);
    expect(c("callLLM")).toBeCloseTo(917, 6); // snapped onto the spine
    expect(c("messageAPI")).toBeCloseTo(917, 6); // merge NOT forced
  });

  it("recomputes top-left from the node's OWN width (wide node lands by center)", () => {
    const W = { wide: 557 };
    const g: TraceGraph = {
      nodes: [node("pred", 400, 0), node("wide", 0, 100)], // pred center 500; wide drifted to 278.5
      edges: [edge("pred", "wide")],
    };
    const out = snapLinearSuccessors(g, { nodeSize: sizing(W) });
    const wide = out.nodes.find((n) => n.id === "wide")!;
    // center must equal pred center (500); top-left = 500 - 557/2.
    expect(wide.position.x + 557 / 2).toBeCloseTo(500, 6);
    expect(wide.position.x).toBeCloseTo(500 - 278.5, 6);
  });

  it("propagates the correction down a chain a->b->c in one pass", () => {
    // a center 500; b and c both drifted; both must end at center 500.
    const g: TraceGraph = {
      nodes: [node("a", 400, 0), node("b", 999, 100), node("c", 12, 200)],
      edges: [edge("a", "b"), edge("b", "c")],
    };
    const out = snapLinearSuccessors(g, { nodeSize: sizing() });
    const c = centerOf(out);
    expect(c("b")).toBeCloseTo(500, 6);
    expect(c("c")).toBeCloseTo(500, 6);
  });
});

describe("snapLinearSuccessors — never moves protected nodes", () => {
  it("ROOT (0 predecessors) is never moved", () => {
    const g: TraceGraph = { nodes: [node("root", 333, 0), node("b", 0, 100)], edges: [edge("root", "b")] };
    const out = snapLinearSuccessors(g, { nodeSize: sizing() });
    expect(out.nodes.find((n) => n.id === "root")!.position.x).toBe(333);
  });

  it("MERGE (>1 predecessor) is never forced", () => {
    // d converges from b and c; its averaged center must be preserved.
    const g: TraceGraph = {
      nodes: [node("b", 100, 0), node("c", 500, 0), node("d", 277, 100)],
      edges: [edge("b", "d"), edge("c", "d")],
    };
    const out = snapLinearSuccessors(g, { nodeSize: sizing() });
    expect(out.nodes.find((n) => n.id === "d")!.position.x).toBe(277);
  });

  it("FORK children (predecessor out-degree > 1) are never snapped", () => {
    // 6-way fork: each branch has 1 pred (fork) but fork has out-degree 6.
    const branches = Array.from({ length: 6 }, (_, i) => `b${i}`);
    const g: TraceGraph = {
      nodes: [
        node("fork", 500, 0, { data: { ...node("fork").data, isFork: true } }),
        ...branches.map((b, i) => node(b, i * 250, 100)),
      ],
      edges: branches.map((b) => edge("fork", b, "fork-branch")),
    };
    const before = g.nodes.map((n) => n.position.x);
    const out = snapLinearSuccessors(g, { nodeSize: sizing() });
    out.nodes.forEach((n, i) => expect(n.position.x).toBe(before[i]));
  });

  it("DECISION children (decision-branch from a >1-out predecessor) are never snapped", () => {
    // context → slotA, context → slotB : both 1-pred but context out-degree 2.
    const g: TraceGraph = {
      nodes: [
        node("context", 500, 0, { data: { ...node("context").data, isDecider: true } }),
        node("slotA", 100, 100),
        node("slotB", 900, 100),
      ],
      edges: [edge("context", "slotA", "decision-branch"), edge("context", "slotB", "decision-branch")],
    };
    const out = snapLinearSuccessors(g, { nodeSize: sizing() });
    expect(out.nodes.find((n) => n.id === "slotA")!.position.x).toBe(100);
    expect(out.nodes.find((n) => n.id === "slotB")!.position.x).toBe(900);
  });

  it("cross-compound hop (different parentId) is never snapped", () => {
    const g: TraceGraph = {
      nodes: [
        node("box", 0, 0, { type: "groupContainer", style: { width: 400, height: 300 } }),
        node("outer", 333, 0), // top-level, parentId undefined
        node("inner", 5, 50, { parentId: "box", extent: "parent" }), // inside box
      ],
      edges: [edge("outer", "inner")], // crosses the compound boundary
    };
    const out = snapLinearSuccessors(g, { nodeSize: sizing() });
    // inner stays at its parent-relative x — not snapped to outer's center.
    expect(out.nodes.find((n) => n.id === "inner")!.position.x).toBe(5);
  });

  it("snaps WITHIN the same compound box (same parentId, parent-relative coords)", () => {
    const g: TraceGraph = {
      nodes: [
        node("box", 0, 0, { type: "groupContainer", style: { width: 1200, height: 600 } }),
        node("p", 400, 0, { parentId: "box", extent: "parent" }), // center 500 (relative)
        node("q", 12, 100, { parentId: "box", extent: "parent" }), // drifted
      ],
      edges: [edge("p", "q")],
    };
    const out = snapLinearSuccessors(g, { nodeSize: sizing() });
    expect(out.nodes.find((n) => n.id === "q")!.position.x + 100).toBeCloseTo(500, 6);
  });

  it("a fork NODE itself still snaps onto its own linear predecessor", () => {
    // seed -> fork (linear hop); fork -> b0, fork -> b1 (children protected).
    const g: TraceGraph = {
      nodes: [
        node("seed", 400, 0), // center 500
        node("fork", 50, 100, { data: { ...node("fork").data, isFork: true } }), // drifted
        node("b0", 0, 200),
        node("b1", 900, 200),
      ],
      edges: [edge("seed", "fork"), edge("fork", "b0", "fork-branch"), edge("fork", "b1", "fork-branch")],
    };
    const out = snapLinearSuccessors(g, { nodeSize: sizing() });
    const c = centerOf(out);
    expect(c("fork")).toBeCloseTo(500, 6); // fork snapped to seed
    expect(out.nodes.find((n) => n.id === "b0")!.position.x).toBe(0); // children untouched
    expect(out.nodes.find((n) => n.id === "b1")!.position.x).toBe(900);
  });
});

describe("snapLinearSuccessors — loop handling", () => {
  it("excludes loop back-edges: a->b with b->a(loop) still snaps b to a", () => {
    const g: TraceGraph = {
      nodes: [node("a", 400, 0), node("b", 12, 100)], // a center 500; b drifted
      edges: [edge("a", "b"), edge("b", "a", "loop")],
    };
    const out = snapLinearSuccessors(g, { nodeSize: sizing() });
    expect(out.nodes.find((n) => n.id === "b")!.position.x + 100).toBeCloseTo(500, 6);
  });

  it("a loop TARGET is not falsely treated as a merge (loop pred excluded)", () => {
    // header gets a forward edge from seed AND a loop back-edge from body.
    // Excluding the loop leaves it a 1-pred linear successor → it snaps.
    const g: TraceGraph = {
      nodes: [node("seed", 400, 0), node("header", 12, 100), node("body", 0, 200)],
      edges: [edge("seed", "header"), edge("header", "body"), edge("body", "header", "loop")],
    };
    const out = snapLinearSuccessors(g, { nodeSize: sizing() });
    expect(out.nodes.find((n) => n.id === "header")!.position.x + 100).toBeCloseTo(500, 6);
  });
});

describe("snapLinearSuccessors — purity, identity, idempotency", () => {
  it("does NOT mutate the input graph", () => {
    const g: TraceGraph = {
      nodes: [node("a", 400, 0), node("b", 12, 100)],
      edges: [edge("a", "b")],
    };
    const before = JSON.stringify(g);
    snapLinearSuccessors(g, { nodeSize: sizing() });
    expect(JSON.stringify(g)).toBe(before);
  });

  it("empty graph returns the SAME object (memo identity preserved)", () => {
    const g: TraceGraph = { nodes: [], edges: [] };
    expect(snapLinearSuccessors(g)).toBe(g);
  });

  it("passes edges through by reference (unchanged)", () => {
    const g: TraceGraph = {
      nodes: [node("a", 400, 0), node("b", 12, 100)],
      edges: [edge("a", "b")],
    };
    expect(snapLinearSuccessors(g, { nodeSize: sizing() }).edges).toBe(g.edges);
  });

  it("leaves UNCHANGED nodes referentially identical (only moves what drifted)", () => {
    const g: TraceGraph = {
      nodes: [node("a", 400, 0), node("b", 400, 100)], // b already centered on a
      edges: [edge("a", "b")],
    };
    const out = snapLinearSuccessors(g, { nodeSize: sizing() });
    expect(out.nodes[0]).toBe(g.nodes[0]); // a never a successor
    expect(out.nodes[1]).toBe(g.nodes[1]); // b already aligned → no rebuild
  });

  it("preserves node + edge counts and node order", () => {
    const g: TraceGraph = {
      nodes: [node("a", 400, 0), node("b", 12, 100), node("c", 99, 200)],
      edges: [edge("a", "b"), edge("b", "c")],
    };
    const out = snapLinearSuccessors(g, { nodeSize: sizing() });
    expect(out.nodes).toHaveLength(3);
    expect(out.nodes.map((n) => n.id)).toEqual(["a", "b", "c"]);
    expect(out.edges).toHaveLength(2);
  });

  it("is idempotent: running twice equals running once", () => {
    const W = { callLLM: 557 };
    const g: TraceGraph = {
      nodes: [
        node("slotA", 700, 0),
        node("slotB", 1000, 0),
        node("messageAPI", 817, 100),
        node("callLLM", 642.5, 200),
      ],
      edges: [edge("slotA", "messageAPI"), edge("slotB", "messageAPI"), edge("messageAPI", "callLLM")],
    };
    const once = snapLinearSuccessors(g, { nodeSize: sizing(W) });
    const twice = snapLinearSuccessors(once, { nodeSize: sizing(W) });
    const px = (out: TraceGraph, id: string) => out.nodes.find((n) => n.id === id)!.position.x;
    for (const id of ["slotA", "slotB", "messageAPI", "callLLM"]) {
      expect(px(twice, id)).toBeCloseTo(px(once, id), 9);
    }
  });

  it("ignores dangling edges whose endpoints are not nodes", () => {
    const g: TraceGraph = {
      nodes: [node("a", 400, 0), node("b", 12, 100)],
      edges: [edge("a", "b"), edge("ghost", "b"), edge("a", "phantom")],
    };
    // ghost->b would look like a 2nd predecessor; dangling so ignored → b snaps.
    const out = snapLinearSuccessors(g, { nodeSize: sizing() });
    expect(out.nodes.find((n) => n.id === "b")!.position.x + 100).toBeCloseTo(500, 6);
  });

  it("dedupes a doubled edge so it cannot fake a fork", () => {
    const g: TraceGraph = {
      nodes: [node("a", 400, 0), node("b", 12, 100)],
      edges: [edge("a", "b"), edge("a", "b")], // duplicate
    };
    const out = snapLinearSuccessors(g, { nodeSize: sizing() });
    expect(out.nodes.find((n) => n.id === "b")!.position.x + 100).toBeCloseTo(500, 6);
  });
});

describe("snapLinearSuccessors — width resolution parity", () => {
  it("uses style.width when no resolver match (matches dagre's sizeOf order)", () => {
    const g: TraceGraph = {
      nodes: [node("pred", 400, 0), node("wide", 0, 100, { style: { width: 557, height: 80 } })],
      edges: [edge("pred", "wide")],
    };
    const out = snapLinearSuccessors(g); // no nodeSize → falls to style
    const wide = out.nodes.find((n) => n.id === "wide")!;
    expect(wide.position.x + 557 / 2).toBeCloseTo(500, 6); // pred center 500
  });

  it("uses the nodeWidth fallback when neither resolver nor style provide a width", () => {
    const g: TraceGraph = {
      nodes: [node("pred", 400, 0), node("plain", 0, 100)],
      edges: [edge("pred", "plain")],
    };
    const out = snapLinearSuccessors(g, { nodeWidth: 200 });
    expect(out.nodes.find((n) => n.id === "plain")!.position.x + 100).toBeCloseTo(500, 6);
  });
});

describe("createSnappedDagreLayout — composed integration with real dagre", () => {
  const W = { callLLM: 557 };
  const nodeSize: NodeSizeResolver = (n) => ({ width: W[n.id as keyof typeof W] ?? 200, height: 80 });
  const buildGraph = (): TraceGraph => ({
    nodes: [
      node("context", 0, 0, { data: { ...node("context").data, isDecider: true } }),
      node("slotA"),
      node("slotB"),
      node("messageAPI"),
      node("callLLM"),
    ],
    edges: [
      edge("context", "slotA", "decision-branch"),
      edge("context", "slotB", "decision-branch"),
      edge("slotA", "messageAPI"),
      edge("slotB", "messageAPI"),
      edge("messageAPI", "callLLM"),
    ],
  });

  it("dagre-then-snap aligns callLLM exactly onto messageAPI's center", () => {
    const layout = createSnappedDagreLayout(createDagreTraceLayout({ nodeSize }), { nodeSize });
    const out = layout(buildGraph());
    const c = centerOf(out, W);
    expect(c("callLLM")).toBeCloseTo(c("messageAPI"), 6);
  });

  it("the snapped layout never moves the merge off its averaged center", () => {
    const dagreOnly = createDagreTraceLayout({ nodeSize });
    const snapped = createSnappedDagreLayout(dagreOnly, { nodeSize });
    const base = dagreOnly(buildGraph());
    const out = snapped(buildGraph());
    const c = (g: TraceGraph) => centerOf(g, W);
    expect(c(out)("messageAPI")).toBeCloseTo(c(base)("messageAPI"), 6);
  });

  it("composed layout returns a usable TraceFlowLayout (positions are finite)", () => {
    const layout = createSnappedDagreLayout(createDagreTraceLayout({ nodeSize }), { nodeSize });
    const out = layout(buildGraph());
    for (const n of out.nodes) {
      expect(Number.isFinite(n.position.x)).toBe(true);
      expect(Number.isFinite(n.position.y)).toBe(true);
    }
  });
});
