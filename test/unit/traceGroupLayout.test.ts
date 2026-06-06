/**
 * Tests for `traceGroupLayout` — the group-based layout (longest-path rank
 * bands + merge-centering-by-construction).
 *
 * Pins: rank assignment (incl. STAGGERED merges), merge centering under the
 * inputs' SPAN (equal-width == center-average; asymmetric == span, no drift),
 * the full agent merge-tree's relative layout, degenerate inputs, composition
 * with the existing snap pass, idempotency, and prototype-pollution safety.
 *
 * Test types (Convention 3): unit, functional, integration, property, security.
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
  traceGroupLayout,
  createTraceGroupLayout,
} from "../../src/components/FlowchartView/_internal/traceGroupLayout";
import { createSnappedDagreLayout } from "../../src/components/FlowchartView/_internal/snapLinearSuccessors";
import type { NodeSizeResolver } from "../../src/components/FlowchartView/_internal/dagreTraceLayout";

// ── Helpers ──────────────────────────────────────────────────────────────

function node(id: string, extra: Partial<TraceNodeData> = {}): TraceNode {
  return {
    id,
    type: "stage",
    position: { x: 0, y: 0 },
    data: {
      label: id,
      isDecider: false,
      isFork: false,
      isStreaming: false,
      isSubflow: false,
      prevIds: [],
      nextIds: [],
      ...extra,
    } as TraceNodeData,
  } as TraceNode;
}
const edge = (s: string, t: string, kind: TraceEdgeData["kind"] = "next"): Edge<TraceEdgeData> => ({
  id: `${s}->${t}:${kind}`,
  source: s,
  target: t,
  data: { kind },
});
/** Uniform 200×80 unless a per-id width override is supplied. */
const sizing =
  (w: Record<string, number> = {}): NodeSizeResolver =>
  (n) => ({ width: w[n.id] ?? 200, height: 80 });
const cx =
  (out: TraceGraph, w: Record<string, number> = {}) =>
  (id: string) => {
    const n = out.nodes.find((x) => x.id === id)!;
    return n.position.x + (w[id] ?? 200) / 2;
  };
const yOf = (out: TraceGraph, id: string) => out.nodes.find((x) => x.id === id)!.position.y;

/** The agent merge-tree graph (loop included; layout must ignore it). */
function agentGraph(): TraceGraph {
  return {
    nodes: [
      node("context", { isDecider: true }),
      node("sf-system-prompt", { isSubflow: true, subflowId: "sf-system-prompt" }),
      node("sf-messages", { isSubflow: true, subflowId: "sf-messages" }),
      node("sf-tools", { isSubflow: true, subflowId: "sf-tools" }),
      node("message-api"),
      node("call-llm"),
      node("sf-route", { isDecider: true }),
      node("final"),
      node("tool-calls"),
    ],
    edges: [
      edge("context", "sf-system-prompt", "decision-branch"),
      edge("context", "sf-messages", "decision-branch"),
      edge("context", "sf-tools", "decision-branch"),
      edge("sf-system-prompt", "message-api"),
      edge("sf-messages", "message-api"),
      edge("sf-tools", "call-llm"), // staggered merge — tools bypasses message-api
      edge("message-api", "call-llm"),
      edge("call-llm", "sf-route"),
      edge("sf-route", "final", "decision-branch"),
      edge("sf-route", "tool-calls", "decision-branch"),
      edge("tool-calls", "context", "loop"), // excluded from layout
    ],
  };
}

// ── UNIT — ranks (observed via y bands) ────────────────────────────────────

describe("traceGroupLayout — ranks", () => {
  const opt = { nodeSize: sizing(), rankSep: 80 };

  it("linear chain ranks top-to-bottom", () => {
    const out = traceGroupLayout({ nodes: [node("a"), node("b"), node("c")], edges: [edge("a", "b"), edge("b", "c")] }, opt);
    expect(yOf(out, "a")).toBeLessThan(yOf(out, "b"));
    expect(yOf(out, "b")).toBeLessThan(yOf(out, "c"));
  });

  it("diamond: branches share a band, merge sits below both", () => {
    const g: TraceGraph = {
      nodes: [node("a"), node("b"), node("c"), node("d")],
      edges: [edge("a", "b", "fork-branch"), edge("a", "c", "fork-branch"), edge("b", "d"), edge("c", "d")],
    };
    const out = traceGroupLayout(g, opt);
    expect(yOf(out, "b")).toBe(yOf(out, "c")); // same band
    expect(yOf(out, "d")).toBeGreaterThan(yOf(out, "b")); // merge below
  });

  it("STAGGERED merge: call-llm is below BOTH message-api and tools, even though tools is a band higher", () => {
    const out = traceGroupLayout(agentGraph(), opt);
    expect(yOf(out, "sf-tools")).toBe(yOf(out, "sf-system-prompt")); // tools in the slot band
    expect(yOf(out, "message-api")).toBeGreaterThan(yOf(out, "sf-tools")); // 1 band below slots
    expect(yOf(out, "call-llm")).toBeGreaterThan(yOf(out, "message-api")); // below message-api
    expect(yOf(out, "call-llm")).toBeGreaterThan(yOf(out, "sf-tools")); // and below tools (staggered)
  });
});

// ── UNIT — merge centering (span) ──────────────────────────────────────────

describe("traceGroupLayout — merge centering", () => {
  it("equal-width inputs: merge centers at the midpoint of its inputs", () => {
    const g: TraceGraph = { nodes: [node("a"), node("b"), node("m")], edges: [edge("a", "m"), edge("b", "m")] };
    const out = traceGroupLayout(g, { nodeSize: sizing() });
    const c = cx(out);
    expect(c("m")).toBeCloseTo((c("a") + c("b")) / 2, 1);
  });

  it("asymmetric widths: merge centers under the SPAN, not the center-average", () => {
    const w = { a: 200, b: 600, m: 100 };
    const g: TraceGraph = { nodes: [node("a"), node("b"), node("m")], edges: [edge("a", "m"), edge("b", "m")] };
    const out = traceGroupLayout(g, { nodeSize: sizing(w) });
    const c = cx(out, w);
    const left = Math.min(c("a") - w.a / 2, c("b") - w.b / 2);
    const right = Math.max(c("a") + w.a / 2, c("b") + w.b / 2);
    const spanCenter = (left + right) / 2;
    const avgCenter = (c("a") + c("b")) / 2;
    expect(c("m")).toBeCloseTo(spanCenter, 1); // centers under the visual span
    expect(spanCenter).not.toBeCloseTo(avgCenter, 0); // and the two differ for asymmetric widths
  });
});

// ── FUNCTIONAL — agent merge-tree relative layout ──────────────────────────

describe("traceGroupLayout — agent merge-tree", () => {
  const opt = { nodeSize: sizing(), rankSep: 80, nodeSep: 60 };

  it("message-api is centered under the {system-prompt, messages} midpoint", () => {
    const out = traceGroupLayout(agentGraph(), opt);
    const c = cx(out);
    expect(c("message-api")).toBeCloseTo((c("sf-system-prompt") + c("sf-messages")) / 2, 1);
  });

  it("call-llm is centered under the SPAN of {message-api, tools}", () => {
    const out = traceGroupLayout(agentGraph(), opt);
    const c = cx(out);
    const left = Math.min(c("message-api") - 100, c("sf-tools") - 100);
    const right = Math.max(c("message-api") + 100, c("sf-tools") + 100);
    expect(c("call-llm")).toBeCloseTo((left + right) / 2, 1);
  });

  it("route's branches {final, tool-calls} are symmetric about route", () => {
    const out = traceGroupLayout(agentGraph(), opt);
    const c = cx(out);
    expect(c("sf-route") - c("final")).toBeCloseTo(c("tool-calls") - c("sf-route"), 1);
  });

  it("the loop edge contributes nothing — all three slots share one band", () => {
    const out = traceGroupLayout(agentGraph(), opt);
    expect(yOf(out, "sf-system-prompt")).toBe(yOf(out, "sf-messages"));
    expect(yOf(out, "sf-system-prompt")).toBe(yOf(out, "sf-tools"));
  });
});

// ── FUNCTIONAL — agent merge-tree with ASYMMETRIC (funnel) widths ──────────
// Replicates the demo: slots have measured (different) widths; each merge node
// is funnel-sized (≈ sum of its inputs). Centering must still hold by SPAN.

describe("traceGroupLayout — agent with funnel/asymmetric widths", () => {
  const W = {
    "sf-system-prompt": 250,
    "sf-messages": 200,
    "sf-tools": 130,
    "message-api": 250 + 28 + 200, // = 478 (sys + gap + msg)
    "call-llm": 478 + 28 + 130, // = 636 (message-api + gap + tools)
    context: 200,
    "sf-route": 200,
    final: 200,
    "tool-calls": 200,
  } as Record<string, number>;
  const opt = { nodeSize: sizing(W), rankSep: 80, nodeSep: 28 };

  it("message-api centers under the SPAN of {sys, msg}", () => {
    const out = traceGroupLayout(agentGraph(), opt);
    const c = cx(out, W);
    const left = Math.min(c("sf-system-prompt") - W["sf-system-prompt"]! / 2, c("sf-messages") - W["sf-messages"]! / 2);
    const right = Math.max(c("sf-system-prompt") + W["sf-system-prompt"]! / 2, c("sf-messages") + W["sf-messages"]! / 2);
    expect(c("message-api")).toBeCloseTo((left + right) / 2, 1);
  });

  it("call-llm centers under the SPAN of {message-api, tools}", () => {
    const out = traceGroupLayout(agentGraph(), opt);
    const c = cx(out, W);
    const left = Math.min(c("message-api") - W["message-api"]! / 2, c("sf-tools") - W["sf-tools"]! / 2);
    const right = Math.max(c("message-api") + W["message-api"]! / 2, c("sf-tools") + W["sf-tools"]! / 2);
    expect(c("call-llm")).toBeCloseTo((left + right) / 2, 1);
  });

  it("route inherits call-llm's center (a vertical spine, no snap needed)", () => {
    const out = traceGroupLayout(agentGraph(), opt);
    const c = cx(out, W);
    expect(c("sf-route")).toBeCloseTo(c("call-llm"), 1);
  });

  it("route's branches are symmetric about route", () => {
    const out = traceGroupLayout(agentGraph(), opt);
    const c = cx(out, W);
    expect(c("sf-route") - c("final")).toBeCloseTo(c("tool-calls") - c("sf-route"), 1);
  });
});

// ── FUNCTIONAL — degenerate ────────────────────────────────────────────────

describe("traceGroupLayout — degenerate", () => {
  it("empty graph returns a fresh empty graph (pure — no input reference returned)", () => {
    const g: TraceGraph = { nodes: [], edges: [] };
    const out = traceGroupLayout(g);
    expect(out).not.toBe(g); // fresh wrapper, for contract uniformity
    expect(out.nodes).toEqual([]);
  });

  it("a plain `next` child of a fork parent is NOT centered as a fork branch (grouping keys on edge KIND)", () => {
    // A forks to b, c (branch edges) AND has a plain `next` child d, all in band 1.
    // Only b, c are the parallel group → symmetric about A; d must not be swept in.
    const g: TraceGraph = {
      nodes: [node("a"), node("b"), node("c"), node("d")],
      edges: [edge("a", "b", "fork-branch"), edge("a", "c", "fork-branch"), edge("a", "d", "next")],
    };
    const out = traceGroupLayout(g, { nodeSize: sizing() });
    const c = cx(out);
    expect(yOf(out, "b")).toBe(yOf(out, "c")); // b,c same band
    expect(yOf(out, "b")).toBe(yOf(out, "d")); // d co-ranked (also a child of a)
    // The fork group {b,c} is centered about A — symmetric.
    expect(c("a") - c("b")).toBeCloseTo(c("c") - c("a"), 1);
    // d is placed (no infinite loop / no crash) and on the band.
    expect(c("d")).toBeTypeOf("number");
  });
  it("single node placed at origin", () => {
    const out = traceGroupLayout({ nodes: [node("solo")], edges: [] });
    expect(out.nodes[0]!.position).toEqual({ x: 0, y: 0 });
  });
  it("pure linear chain → all centers equal (a vertical spine)", () => {
    const out = traceGroupLayout({ nodes: [node("a"), node("b"), node("c")], edges: [edge("a", "b"), edge("b", "c")] }, { nodeSize: sizing() });
    const c = cx(out);
    expect(c("b")).toBeCloseTo(c("a"), 1);
    expect(c("c")).toBeCloseTo(c("a"), 1);
  });
});

// ── INTEGRATION — compose with the snap pass ───────────────────────────────

describe("traceGroupLayout + snap", () => {
  it("snap straightens the call-llm→route spine without moving the merges", () => {
    const base = createTraceGroupLayout({ nodeSize: sizing(), rankSep: 80, nodeSep: 60 });
    const layout = createSnappedDagreLayout(base, { nodeSize: sizing() });
    const out = layout(agentGraph());
    const c = cx(out);
    // route is a pure linear successor of call-llm → snap aligns it exactly.
    expect(c("sf-route")).toBeCloseTo(c("call-llm"), 1);
    // the merge stays centered under its inputs (snap must not move merges).
    expect(c("message-api")).toBeCloseTo((c("sf-system-prompt") + c("sf-messages")) / 2, 1);
  });
});

// ── PROPERTY ───────────────────────────────────────────────────────────────

describe("traceGroupLayout — invariants", () => {
  it("idempotent: laying out twice yields identical positions", () => {
    const opt = { nodeSize: sizing() };
    const once = traceGroupLayout(agentGraph(), opt);
    const twice = traceGroupLayout(once, opt);
    for (const n of once.nodes) {
      const m = twice.nodes.find((x) => x.id === n.id)!;
      expect(m.position.x).toBeCloseTo(n.position.x, 3);
      expect(m.position.y).toBeCloseTo(n.position.y, 3);
    }
  });
  it("every merge sits strictly below all its inputs", () => {
    const out = traceGroupLayout(agentGraph(), { nodeSize: sizing() });
    for (const [merge, inputs] of [
      ["message-api", ["sf-system-prompt", "sf-messages"]],
      ["call-llm", ["message-api", "sf-tools"]],
    ] as const) {
      for (const i of inputs) expect(yOf(out, merge)).toBeGreaterThan(yOf(out, i));
    }
  });
  it("same-band siblings do not overlap in x", () => {
    const out = traceGroupLayout(agentGraph(), { nodeSize: sizing(), nodeSep: 60 });
    const c = cx(out);
    // the three slots share a band — adjacent centers differ by ≥ one node width.
    const slots = ["sf-system-prompt", "sf-messages", "sf-tools"].map((id) => c(id)).sort((a, b) => a - b);
    expect(slots[1]! - slots[0]!).toBeGreaterThanOrEqual(200);
    expect(slots[2]! - slots[1]!).toBeGreaterThanOrEqual(200);
  });
});

// ── FUNCTIONAL/PROPERTY — mergeAlign: "fork-origin" (straight trunk) ─────────
// Default "span" centers a join under its inputs' splay → the trunk ZIG-ZAGS.
// "fork-origin" aligns a join with the fork it re-converges (its inputs' lowest
// common ancestor) → the trunk is ONE straight centered column.

describe('traceGroupLayout — mergeAlign: "fork-origin"', () => {
  const opt = { nodeSize: sizing(), rankSep: 80, nodeSep: 60, mergeAlign: "fork-origin" as const };

  it("the trunk is ONE straight column: context, message-api, call-llm, route share a center", () => {
    const c = cx(traceGroupLayout(agentGraph(), opt));
    const trunk = c("context");
    expect(c("message-api")).toBeCloseTo(trunk, 1);
    expect(c("call-llm")).toBeCloseTo(trunk, 1);
    expect(c("sf-route")).toBeCloseTo(trunk, 1);
  });

  it("slots splay SYMMETRICALLY around the trunk (middle slot on axis)", () => {
    const c = cx(traceGroupLayout(agentGraph(), opt));
    expect(c("sf-messages")).toBeCloseTo(c("context"), 1);
    expect(c("context") - c("sf-system-prompt")).toBeCloseTo(c("sf-tools") - c("context"), 1);
  });

  it("route's branches stay symmetric about the trunk", () => {
    const c = cx(traceGroupLayout(agentGraph(), opt));
    expect(c("sf-route") - c("final")).toBeCloseTo(c("tool-calls") - c("sf-route"), 1);
  });

  it("CONTRAST: span-mode zig-zags (message-api ≠ call-llm); fork-origin straightens them", () => {
    const span = cx(traceGroupLayout(agentGraph(), { ...opt, mergeAlign: "span" }));
    expect(span("message-api")).not.toBeCloseTo(span("call-llm"), 0); // the zig-zag
    const fork = cx(traceGroupLayout(agentGraph(), opt));
    expect(fork("message-api")).toBeCloseTo(fork("call-llm"), 1); // straightened
  });

  it("straightens REGARDLESS of input widths (alignment is by fork, not width)", () => {
    const W = { "sf-system-prompt": 250, "sf-messages": 200, "sf-tools": 130, "message-api": 478, "call-llm": 636 } as Record<string, number>;
    const c = cx(traceGroupLayout(agentGraph(), { nodeSize: sizing(W), rankSep: 80, nodeSep: 28, mergeAlign: "fork-origin" }), W);
    expect(c("message-api")).toBeCloseTo(c("context"), 1);
    expect(c("call-llm")).toBeCloseTo(c("context"), 1);
    expect(c("sf-route")).toBeCloseTo(c("context"), 1);
  });

  it("nested fork: inner join returns to the INNER fork; outer join returns to root", () => {
    // root ⟂ {a, b}; a ⟂ {a1, a2} join at aj; aj + b join at j.
    const g: TraceGraph = {
      nodes: ["root", "a", "b", "a1", "a2", "aj", "j"].map((id) => node(id)),
      edges: [
        edge("root", "a", "fork-branch"), edge("root", "b", "fork-branch"),
        edge("a", "a1", "fork-branch"), edge("a", "a2", "fork-branch"),
        edge("a1", "aj"), edge("a2", "aj"),
        edge("aj", "j"), edge("b", "j"),
      ],
    };
    const c = cx(traceGroupLayout(g, { nodeSize: sizing(), mergeAlign: "fork-origin" }));
    expect(c("aj")).toBeCloseTo(c("a"), 1); // inner join → inner fork
    expect(c("j")).toBeCloseTo(c("root"), 1); // outer join → root
  });

  it("default (no mergeAlign) is byte-identical to explicit 'span' (opt-in; consumers unaffected)", () => {
    const def = traceGroupLayout(agentGraph(), { nodeSize: sizing() });
    const span = traceGroupLayout(agentGraph(), { nodeSize: sizing(), mergeAlign: "span" });
    for (const n of def.nodes) {
      const m = span.nodes.find((x) => x.id === n.id)!;
      expect(m.position.x).toBeCloseTo(n.position.x, 3);
      expect(m.position.y).toBeCloseTo(n.position.y, 3);
    }
  });

  it("disjoint inputs (no common ancestor) fall back to span (no throw)", () => {
    // Two independent roots feed a merge — no LCA → span fallback.
    const g: TraceGraph = { nodes: [node("p"), node("q"), node("m")], edges: [edge("p", "m"), edge("q", "m")] };
    const c = cx(traceGroupLayout(g, { nodeSize: sizing(), mergeAlign: "fork-origin" }));
    expect(c("m")).toBeCloseTo((c("p") + c("q")) / 2, 1); // span fallback
  });
});

// ── SECURITY ───────────────────────────────────────────────────────────────

describe("traceGroupLayout — safety", () => {
  it("node ids like __proto__ / constructor do not corrupt the layout", () => {
    const g: TraceGraph = {
      nodes: [node("__proto__"), node("constructor"), node("m")],
      edges: [edge("__proto__", "m"), edge("constructor", "m")],
    };
    const out = traceGroupLayout(g, { nodeSize: sizing() });
    expect(out.nodes).toHaveLength(3);
    expect(yOf(out, "m")).toBeGreaterThan(yOf(out, "__proto__"));
  });
  it("an unknown edge kind is treated as a forward edge (fail-open, no throw)", () => {
    const g: TraceGraph = {
      nodes: [node("a"), node("b")],
      edges: [{ id: "a->b", source: "a", target: "b", data: { kind: "weird" as unknown as TraceEdgeData["kind"] } }],
    };
    expect(() => traceGroupLayout(g, { nodeSize: sizing() })).not.toThrow();
    const out = traceGroupLayout(g, { nodeSize: sizing() });
    expect(yOf(out, "b")).toBeGreaterThan(yOf(out, "a"));
  });
});
