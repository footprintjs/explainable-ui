/**
 * Unit tests for `applyGroupLayout` / `createGroupedLayout` — the pure
 * graph transform that turns chosen subflows into xyflow native group
 * containers (parentId + extent:'parent').
 *
 * These pin the contract the renderer + TracedFlow wiring depend on:
 *   - container created (typed + sized) for each grouped subflow
 *   - members nested via parentId/extent, positioned in local box space
 *   - parent-before-child node order (xyflow requirement)
 *   - non-grouped subflows left untouched (they continue to drill)
 *   - identity passthrough when nothing groups
 *   - edges unchanged
 */

import { describe, it, expect } from "vitest";
import type { Node, Edge } from "@xyflow/react";
import type {
  TraceGraph,
  TraceNode,
  TraceNodeData,
  TraceEdgeData,
} from "../../src/components/FlowchartView/traceStructureRecorder";
import {
  applyGroupLayout,
  createGroupedLayout,
  wrapInMainChartBox,
  createMainChartBoxLayout,
  GROUP_CONTAINER_NODE_TYPE,
  MAIN_CHART_BOX_ID,
} from "../../src/components/FlowchartView/_internal/groupLayout";
import { createDagreTraceLayout } from "../../src/components/FlowchartView/_internal/dagreTraceLayout";
import { createSnappedDagreLayout } from "../../src/components/FlowchartView/_internal/snapLinearSuccessors";

// ── Test helpers ─────────────────────────────────────────────────────────

function node(
  id: string,
  data: Partial<TraceNodeData> = {},
): TraceNode {
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
      ...data,
    },
  } as TraceNode;
}

function edge(source: string, target: string): Edge<TraceEdgeData> {
  return { id: `${source}->${target}`, source, target, data: { kind: "next" } };
}

/**
 * Deterministic stub layout: stacks nodes vertically by array index
 * (x=0, y=index*100). Lets tests assert relative positions precisely.
 */
const stubLayout = (g: TraceGraph): TraceGraph => ({
  nodes: g.nodes.map((n, i) => ({ ...n, position: { x: 0, y: i * 100 } })),
  edges: g.edges,
});

/**
 * The merge-tree shape (LLM-only): seed → context → [sf-system-prompt,
 * sf-messages] mounts, each with one inner `compose` member → message-api.
 */
function mergeTreeGraph(): TraceGraph {
  return {
    nodes: [
      node("seed"),
      node("context", { isDecider: true }),
      node("sf-system-prompt", { isSubflow: true, subflowId: "sf-system-prompt" }),
      node("sf-system-prompt/compose", { subflowOf: "sf-system-prompt" }),
      node("sf-messages", { isSubflow: true, subflowId: "sf-messages" }),
      node("sf-messages/compose", { subflowOf: "sf-messages" }),
      node("message-api"),
      node("call-llm"),
    ],
    edges: [
      edge("seed", "context"),
      edge("context", "sf-system-prompt"),
      edge("context", "sf-messages"),
      edge("sf-system-prompt", "message-api"),
      edge("sf-messages", "message-api"),
      edge("message-api", "call-llm"),
    ],
  };
}

// ── Tests ────────────────────────────────────────────────────────────────

describe("applyGroupLayout", () => {
  it("identity: empty groupedSubflowIds returns the input graph unchanged", () => {
    const g = mergeTreeGraph();
    const out = applyGroupLayout(g, { groupedSubflowIds: [], baseLayout: stubLayout });
    expect(out).toBe(g);
  });

  it("identity: a requested id with no members/mount is a no-op", () => {
    const g = mergeTreeGraph();
    const out = applyGroupLayout(g, { groupedSubflowIds: ["does-not-exist"], baseLayout: stubLayout });
    expect(out).toBe(g);
  });

  it("converts the grouped subflow's mount into a container node (typed + sized)", () => {
    const g = mergeTreeGraph();
    const out = applyGroupLayout(g, {
      groupedSubflowIds: ["sf-system-prompt"],
      baseLayout: stubLayout,
    });
    const container = out.nodes.find((n) => n.id === "sf-system-prompt")!;
    expect(container.type).toBe(GROUP_CONTAINER_NODE_TYPE);
    expect(container.data.isGroupContainer).toBe(true);
    // Sized to fit the (one) member + header + padding.
    const style = container.style as { width: number; height: number };
    expect(style.width).toBeGreaterThan(0);
    expect(style.height).toBeGreaterThan(0);
  });

  it("nests members via parentId + extent:'parent' with header-offset positions", () => {
    const g = mergeTreeGraph();
    const padding = 16;
    const headerHeight = 44;
    const out = applyGroupLayout(g, {
      groupedSubflowIds: ["sf-system-prompt"],
      baseLayout: stubLayout,
      padding,
      headerHeight,
    });
    const member = out.nodes.find((n) => n.id === "sf-system-prompt/compose")!;
    expect(member.parentId).toBe("sf-system-prompt");
    expect(member.extent).toBe("parent");
    // Single member normalises to local origin → padding / header+padding.
    expect(member.position.x).toBe(padding);
    expect(member.position.y).toBe(headerHeight + padding);
  });

  it("INVARIANT: every nested member appears AFTER its container in the node array", () => {
    const g = mergeTreeGraph();
    const out = applyGroupLayout(g, {
      groupedSubflowIds: ["sf-system-prompt", "sf-messages"],
      baseLayout: stubLayout,
    });
    const indexOf = (id: string) => out.nodes.findIndex((n) => n.id === id);
    for (const m of out.nodes) {
      if (m.parentId) {
        expect(indexOf(m.parentId)).toBeGreaterThanOrEqual(0);
        expect(indexOf(m.parentId)).toBeLessThan(indexOf(m.id));
      }
    }
  });

  it("groups MULTIPLE subflows independently", () => {
    const g = mergeTreeGraph();
    const out = applyGroupLayout(g, {
      groupedSubflowIds: ["sf-system-prompt", "sf-messages"],
      baseLayout: stubLayout,
    });
    expect(out.nodes.find((n) => n.id === "sf-system-prompt")!.type).toBe(GROUP_CONTAINER_NODE_TYPE);
    expect(out.nodes.find((n) => n.id === "sf-messages")!.type).toBe(GROUP_CONTAINER_NODE_TYPE);
    expect(out.nodes.find((n) => n.id === "sf-system-prompt/compose")!.parentId).toBe("sf-system-prompt");
    expect(out.nodes.find((n) => n.id === "sf-messages/compose")!.parentId).toBe("sf-messages");
  });

  it("leaves a NON-grouped subflow untouched (mount stays a stage, member un-nested)", () => {
    const g = mergeTreeGraph();
    // Group only system-prompt; messages must keep drilling (no parentId).
    const out = applyGroupLayout(g, {
      groupedSubflowIds: ["sf-system-prompt"],
      baseLayout: stubLayout,
    });
    const msgMount = out.nodes.find((n) => n.id === "sf-messages")!;
    const msgMember = out.nodes.find((n) => n.id === "sf-messages/compose")!;
    expect(msgMount.type).toBe("stage");
    expect(msgMember.parentId).toBeUndefined();
  });

  it("preserves all edges unchanged", () => {
    const g = mergeTreeGraph();
    const out = applyGroupLayout(g, {
      groupedSubflowIds: ["sf-system-prompt", "sf-messages"],
      baseLayout: stubLayout,
    });
    expect(out.edges).toEqual(g.edges);
  });

  it("keeps the full node count (no nodes dropped, none duplicated)", () => {
    const g = mergeTreeGraph();
    const out = applyGroupLayout(g, {
      groupedSubflowIds: ["sf-system-prompt", "sf-messages"],
      baseLayout: stubLayout,
    });
    expect(out.nodes).toHaveLength(g.nodes.length);
    expect(new Set(out.nodes.map((n) => n.id)).size).toBe(g.nodes.length);
  });

  it("does not mutate the input graph", () => {
    const g = mergeTreeGraph();
    const before = JSON.stringify(g);
    applyGroupLayout(g, { groupedSubflowIds: ["sf-system-prompt"], baseLayout: stubLayout });
    expect(JSON.stringify(g)).toBe(before);
  });

  it("sizes the box larger for a multi-member subflow than a single-member one", () => {
    // Build a subflow with two members + an inner edge.
    const g: TraceGraph = {
      nodes: [
        node("root"),
        node("sf-big", { isSubflow: true, subflowId: "sf-big" }),
        node("sf-big/a", { subflowOf: "sf-big" }),
        node("sf-big/b", { subflowOf: "sf-big" }),
        node("sf-small", { isSubflow: true, subflowId: "sf-small" }),
        node("sf-small/only", { subflowOf: "sf-small" }),
      ],
      edges: [edge("sf-big/a", "sf-big/b")],
    };
    const out = applyGroupLayout(g, {
      groupedSubflowIds: ["sf-big", "sf-small"],
      baseLayout: stubLayout,
    });
    const big = out.nodes.find((n) => n.id === "sf-big")!.style as { height: number };
    const small = out.nodes.find((n) => n.id === "sf-small")!.style as { height: number };
    expect(big.height).toBeGreaterThan(small.height);
  });
});

describe("createGroupedLayout", () => {
  it("returns a TraceFlowLayout that applies grouping", () => {
    const layout = createGroupedLayout({
      groupedSubflowIds: ["sf-system-prompt"],
      baseLayout: stubLayout,
    });
    const out = layout(mergeTreeGraph());
    expect(out.nodes.find((n) => n.id === "sf-system-prompt")!.type).toBe(GROUP_CONTAINER_NODE_TYPE);
  });
});

describe("wrapInMainChartBox", () => {
  /**
   * The Lens model: the whole chart is ONE box; subflows inside stay as
   * drill cards. So we feed wrapInMainChartBox the drill-filtered graph
   * (top-level nodes only — slot internals hidden behind their cards).
   */
  function drillFilteredMergeTree(): TraceGraph {
    // Top-level view of the merge tree: slot subflows appear as single
    // mount cards (their `compose` members hidden behind drill).
    return {
      nodes: [
        node("seed"),
        node("context", { isDecider: true }),
        node("sf-system-prompt", { isSubflow: true, subflowId: "sf-system-prompt" }),
        node("sf-messages", { isSubflow: true, subflowId: "sf-messages" }),
        node("message-api"),
        node("call-llm"),
      ],
      edges: [
        edge("seed", "context"),
        edge("context", "sf-system-prompt"),
        edge("context", "sf-messages"),
        edge("sf-system-prompt", "message-api"),
        edge("sf-messages", "message-api"),
        edge("message-api", "call-llm"),
      ],
    };
  }

  it("identity: empty graph returns unchanged", () => {
    const g: TraceGraph = { nodes: [], edges: [] };
    expect(wrapInMainChartBox(g, { baseLayout: stubLayout })).toBe(g);
  });

  it("synthesises ONE container node (the main box) of type groupContainer", () => {
    const out = wrapInMainChartBox(drillFilteredMergeTree(), {
      baseLayout: stubLayout,
      label: "LLM call",
      kind: "LLMCall",
    });
    const box = out.nodes.find((n) => n.id === MAIN_CHART_BOX_ID)!;
    expect(box).toBeDefined();
    expect(box.type).toBe(GROUP_CONTAINER_NODE_TYPE);
    expect(box.data.isMainChart).toBe(true);
    expect(box.data.label).toBe("LLM call");
    expect(box.data.kind).toBe("LLMCall");
    const style = box.style as { width: number; height: number };
    expect(style.width).toBeGreaterThan(0);
    expect(style.height).toBeGreaterThan(0);
  });

  it("nests EVERY top-level node under the main box (slots stay as cards inside)", () => {
    const g = drillFilteredMergeTree();
    const out = wrapInMainChartBox(g, { baseLayout: stubLayout });
    for (const original of g.nodes) {
      const wrapped = out.nodes.find((n) => n.id === original.id)!;
      expect(wrapped.parentId).toBe(MAIN_CHART_BOX_ID);
      expect(wrapped.extent).toBe("parent");
    }
    // The slot subflows are still plain stage cards (NOT boxed) — they drill.
    expect(out.nodes.find((n) => n.id === "sf-system-prompt")!.type).not.toBe(
      GROUP_CONTAINER_NODE_TYPE,
    );
  });

  it("INVARIANT: the container is FIRST in the array (xyflow parent-before-child)", () => {
    const out = wrapInMainChartBox(drillFilteredMergeTree(), { baseLayout: stubLayout });
    expect(out.nodes[0]!.id).toBe(MAIN_CHART_BOX_ID);
  });

  it("preserves node count + 1 (the synthesised box) and all edges", () => {
    const g = drillFilteredMergeTree();
    const out = wrapInMainChartBox(g, { baseLayout: stubLayout });
    expect(out.nodes).toHaveLength(g.nodes.length + 1);
    expect(out.edges).toEqual(g.edges);
  });

  it("does not mutate the input graph", () => {
    const g = drillFilteredMergeTree();
    const before = JSON.stringify(g);
    wrapInMainChartBox(g, { baseLayout: stubLayout });
    expect(JSON.stringify(g)).toBe(before);
  });

  it("leaves already-nested nodes parented as-is (composes with prior nesting)", () => {
    // A node already nested under some other parent must NOT be re-parented.
    const g: TraceGraph = {
      nodes: [
        node("a"),
        { ...node("child"), parentId: "a", extent: "parent" } as TraceNode,
      ],
      edges: [],
    };
    const out = wrapInMainChartBox(g, { baseLayout: stubLayout });
    expect(out.nodes.find((n) => n.id === "child")!.parentId).toBe("a"); // unchanged
    expect(out.nodes.find((n) => n.id === "a")!.parentId).toBe(MAIN_CHART_BOX_ID); // wrapped
  });

  it("createMainChartBoxLayout returns a TraceFlowLayout that wraps", () => {
    const layout = createMainChartBoxLayout({ baseLayout: stubLayout, label: "Agent" });
    const out = layout(drillFilteredMergeTree());
    expect(out.nodes[0]!.id).toBe(MAIN_CHART_BOX_ID);
    expect(out.nodes[0]!.data.label).toBe("Agent");
  });

  it("SIZES the box from a top-level CONTAINER's style.width, not as a 200px point", () => {
    // A graph where one top-level node is already a wide group container
    // (style.width set by a prior applyGroupLayout pass). The main box must
    // be sized from that footprint — not the default node width.
    const g: TraceGraph = {
      nodes: [
        node("seed"),
        {
          ...node("sf-llm-call", { isSubflow: true, isGroupContainer: true }),
          type: GROUP_CONTAINER_NODE_TYPE,
          position: { x: 0, y: 0 },
          style: { width: 1756, height: 600 },
        } as TraceNode,
      ],
      edges: [edge("seed", "sf-llm-call")],
    };
    const padding = 16;
    // Identity baseLayout: freeze the prior pass's coords (mirrors TracedFlow).
    const out = wrapInMainChartBox(g, { baseLayout: (x) => x, padding, label: "Agent" });
    const box = out.nodes.find((n) => n.id === MAIN_CHART_BOX_ID)!;
    const style = box.style as { width: number; height: number };
    // Must be wide enough to hold the 1756px container + 2*padding.
    expect(style.width).toBeGreaterThanOrEqual(1756 + padding * 2);
  });
});

describe("nested box composition (applyGroupLayout THEN wrapInMainChartBox)", () => {
  /**
   * Reproduces the measured bug: group sf-llm-call into a box, then wrap the
   * whole chart in an Agent box. The inner LLM-call container MUST sit fully
   * inside the Agent box (no overflow), with its own members still inside it.
   *
   * Uses a stub base layout that gives nodes real horizontal SPREAD so the
   * inner container ends up genuinely wide — surfacing the footprint bug.
   */

  // A base layout that spreads nodes BOTH horizontally and vertically so a
  // multi-member subflow produces a wide container (width > DEFAULT_NODE_W).
  const spreadLayout = (g: TraceGraph): TraceGraph => ({
    nodes: g.nodes.map((n, i) => ({ ...n, position: { x: i * 300, y: i * 120 } })),
    edges: g.edges,
  });

  // LLM-call subflow with three members → a wide inner container.
  function chartWithWideSubflow(): TraceGraph {
    return {
      nodes: [
        node("seed"),
        node("sf-llm-call", { isSubflow: true, subflowId: "sf-llm-call" }),
        node("sf-llm-call/system-prompt", { subflowOf: "sf-llm-call" }),
        node("sf-llm-call/messages", { subflowOf: "sf-llm-call" }),
        node("sf-llm-call/invoke", { subflowOf: "sf-llm-call" }),
        node("answer"),
      ],
      edges: [
        edge("seed", "sf-llm-call"),
        edge("sf-llm-call/system-prompt", "sf-llm-call/messages"),
        edge("sf-llm-call/messages", "sf-llm-call/invoke"),
        edge("sf-llm-call", "answer"),
      ],
    };
  }

  /** A node's absolute extent {x0,y0,x1,y1} from position + footprint. */
  function extentOf(
    out: TraceGraph,
    id: string,
    fallbackW = 200,
    fallbackH = 80,
  ): { x0: number; y0: number; x1: number; y1: number } {
    const n = out.nodes.find((m) => m.id === id)!;
    const s = (n.style ?? {}) as { width?: number; height?: number };
    const w = typeof s.width === "number" ? s.width : fallbackW;
    const h = typeof s.height === "number" ? s.height : fallbackH;
    return { x0: n.position.x, y0: n.position.y, x1: n.position.x + w, y1: n.position.y + h };
  }

  it("re-parents the inner container under the main box and its members under it", () => {
    const grouped = applyGroupLayout(chartWithWideSubflow(), {
      groupedSubflowIds: ["sf-llm-call"],
      baseLayout: spreadLayout,
    });
    const out = wrapInMainChartBox(grouped, { baseLayout: (g) => g, label: "Agent" });

    // sf-llm-call is now a child of the Agent box…
    expect(out.nodes.find((n) => n.id === "sf-llm-call")!.parentId).toBe(MAIN_CHART_BOX_ID);
    // …and its members are still children of sf-llm-call.
    expect(out.nodes.find((n) => n.id === "sf-llm-call/system-prompt")!.parentId).toBe(
      "sf-llm-call",
    );
  });

  it("GEOMETRY: the inner LLM-call box sits FULLY INSIDE the Agent box", () => {
    const grouped = applyGroupLayout(chartWithWideSubflow(), {
      groupedSubflowIds: ["sf-llm-call"],
      baseLayout: spreadLayout,
    });
    const padding = 16;
    const out = wrapInMainChartBox(grouped, {
      baseLayout: (g) => g,
      label: "Agent",
      padding,
    });

    // sf-llm-call is wide enough to expose the bug (multi-member container).
    const llm = extentOf(out, "sf-llm-call");
    expect(llm.x1 - llm.x0).toBeGreaterThan(200); // genuinely wider than a leaf

    // The Agent box's INTERIOR (its own size, minus padding margins). Child
    // coords are parent-relative, so the interior box runs from `padding` to
    // `width - padding` on x (header strip on y handled by reparent offset).
    const agentBox = out.nodes.find((n) => n.id === MAIN_CHART_BOX_ID)!;
    const agentStyle = agentBox.style as { width: number; height: number };

    // ASSERTION: inner box fully inside outer box (parent-relative coords).
    expect(llm.x0).toBeGreaterThanOrEqual(padding - 0.001); // left inside
    expect(llm.x1).toBeLessThanOrEqual(agentStyle.width - padding + 0.001); // right inside
    expect(llm.y0).toBeGreaterThanOrEqual(0); // below the box origin
    expect(llm.y1).toBeLessThanOrEqual(agentStyle.height + 0.001); // bottom inside
  });

  it("GEOMETRY: the LLM-call members stay fully inside the LLM-call box", () => {
    const grouped = applyGroupLayout(chartWithWideSubflow(), {
      groupedSubflowIds: ["sf-llm-call"],
      baseLayout: spreadLayout,
    });
    const out = wrapInMainChartBox(grouped, { baseLayout: (g) => g, label: "Agent" });

    const llmStyle = out.nodes.find((n) => n.id === "sf-llm-call")!.style as {
      width: number;
      height: number;
    };
    for (const id of [
      "sf-llm-call/system-prompt",
      "sf-llm-call/messages",
      "sf-llm-call/invoke",
    ]) {
      const m = extentOf(out, id);
      expect(m.x0).toBeGreaterThanOrEqual(0);
      expect(m.x1).toBeLessThanOrEqual(llmStyle.width + 0.001);
      expect(m.y0).toBeGreaterThanOrEqual(0);
      expect(m.y1).toBeLessThanOrEqual(llmStyle.height + 0.001);
    }
  });

  it("does not drop or duplicate nodes through the two-pass compose", () => {
    const g = chartWithWideSubflow();
    const grouped = applyGroupLayout(g, {
      groupedSubflowIds: ["sf-llm-call"],
      baseLayout: spreadLayout,
    });
    const out = wrapInMainChartBox(grouped, { baseLayout: (g2) => g2, label: "Agent" });
    // original nodes + 1 synthesised Agent box.
    expect(out.nodes).toHaveLength(g.nodes.length + 1);
    expect(new Set(out.nodes.map((n) => n.id)).size).toBe(g.nodes.length + 1);
  });

  it("NO-OVERLAP: outer SIBLINGS are placed clear of the wide inner container (inside-out sizing)", () => {
    // The reported bug: the outer layout placed Route/answer using the mount's
    // DEFAULT 200px size (before the box was sized), so once the container
    // ballooned the siblings overlapped it. With inside-out sizing the outer
    // pass must see the container's REAL footprint and reserve space for it.
    // Use real dagre so siblings are genuinely positioned by the layout.
    const grouped = applyGroupLayout(chartWithWideSubflow(), {
      groupedSubflowIds: ["sf-llm-call"],
      baseLayout: createDagreTraceLayout(),
    });
    const overlaps = (
      a: { x0: number; y0: number; x1: number; y1: number },
      b: { x0: number; y0: number; x1: number; y1: number },
    ) => !(a.x1 <= b.x0 || a.x0 >= b.x1 || a.y1 <= b.y0 || a.y0 >= b.y1);
    const llm = extentOf(grouped, "sf-llm-call");
    // The outer siblings (seed, answer) must NOT overlap the LLM-call box.
    for (const sib of ["seed", "answer"]) {
      expect(overlaps(extentOf(grouped, sib), llm)).toBe(false);
    }
  });

  it("PROPERTY: any wide inner container is contained for arbitrary spreads", () => {
    // Fuzz the inner container width via different base-layout spreads; the
    // inner box must always end up inside the outer box.
    const padding = 16;
    for (const spread of [120, 300, 555, 900, 1400]) {
      const layout = (g: TraceGraph): TraceGraph => ({
        nodes: g.nodes.map((n, i) => ({ ...n, position: { x: i * spread, y: i * 90 } })),
        edges: g.edges,
      });
      const grouped = applyGroupLayout(chartWithWideSubflow(), {
        groupedSubflowIds: ["sf-llm-call"],
        baseLayout: layout,
      });
      const out = wrapInMainChartBox(grouped, { baseLayout: (g) => g, label: "Agent", padding });
      const llm = extentOf(out, "sf-llm-call");
      const agentStyle = out.nodes.find((n) => n.id === MAIN_CHART_BOX_ID)!.style as {
        width: number;
        height: number;
      };
      expect(llm.x0).toBeGreaterThanOrEqual(padding - 0.001);
      expect(llm.x1).toBeLessThanOrEqual(agentStyle.width - padding + 0.001);
      expect(llm.y1).toBeLessThanOrEqual(agentStyle.height + 0.001);
    }
  });
});

describe("post-container siblings clear a stamped container (consumer nodeSize resolver)", () => {
  // The LIVE Agent-chart bug. The outer baseLayout is a dagre layout carrying a
  // consumer `nodeSize` resolver that sizes EVERY subflow as a slim bar
  // (`{210, 38}`) — the same resolver the playground's `lensNodeSize` uses.
  //
  // Before the fix, that resolver out-ranked the box footprint PASS 2 stamps
  // onto the mount: dagre was told the container was 38px tall while it rendered
  // ~794px, so the post-container siblings (Route → tool-calls / final) ranked
  // only ~half a slim-bar below the box CENTER and landed geometrically INSIDE
  // the box. The fix makes a stamped group container's `style` footprint win
  // over the resolver in `sizeOf`, so dagre reserves the box's TRUE height.
  //
  // Uses REAL dagre via `createSnappedDagreLayout(createDagreTraceLayout(...))`
  // — exactly the live composition — so the assertion exercises the real
  // ranking, not a stub.

  // Agent shape: agent-entry → sf-llm-call (GROUP) → route(decider) →
  // [tool-calls | final]. The three sf-llm-call members make the box genuinely
  // tall/wide once grouped.
  function agentChart(): TraceGraph {
    return {
      nodes: [
        node("agent-entry"),
        node("sf-llm-call", { isSubflow: true, subflowId: "sf-llm-call" }),
        node("sf-llm-call/system-prompt", { subflowOf: "sf-llm-call" }),
        node("sf-llm-call/messages", { subflowOf: "sf-llm-call" }),
        node("sf-llm-call/invoke", { subflowOf: "sf-llm-call" }),
        node("route", { isDecider: true }),
        node("tool-calls"),
        node("final"),
      ],
      edges: [
        edge("agent-entry", "sf-llm-call"),
        edge("sf-llm-call/system-prompt", "sf-llm-call/messages"),
        edge("sf-llm-call/messages", "sf-llm-call/invoke"),
        edge("sf-llm-call", "route"),
        edge("route", "tool-calls"),
        edge("route", "final"),
      ],
    };
  }

  // The playground's resolver: subflow mounts → slim bars. Returns undefined
  // for everything else so those nodes fall through to style/default.
  const slimBarResolver = (n: TraceNode) =>
    n.data?.isSubflow ? { width: 210, height: 38 } : undefined;

  // Live composition: dagre + spine-snap, both fed the SAME resolver.
  const liveBaseLayout = createSnappedDagreLayout(
    createDagreTraceLayout({ nodeSize: slimBarResolver }),
    { nodeSize: slimBarResolver },
  );

  /** A node's absolute extent {x0,y0,x1,y1} from position + footprint. */
  function extentOf(out: TraceGraph, id: string, fallbackW = 200, fallbackH = 80) {
    const n = out.nodes.find((m) => m.id === id)!;
    const s = (n.style ?? {}) as { width?: number; height?: number };
    const w = typeof s.width === "number" ? s.width : fallbackW;
    const h = typeof s.height === "number" ? s.height : fallbackH;
    return { x0: n.position.x, y0: n.position.y, x1: n.position.x + w, y1: n.position.y + h };
  }
  const overlaps = (
    a: { x0: number; y0: number; x1: number; y1: number },
    b: { x0: number; y0: number; x1: number; y1: number },
  ) => !(a.x1 <= b.x0 || a.x0 >= b.x1 || a.y1 <= b.y0 || a.y0 >= b.y1);

  it("NO non-member node overlaps the container box (real dagre + slim-bar resolver)", () => {
    const grouped = applyGroupLayout(agentChart(), {
      groupedSubflowIds: ["sf-llm-call"],
      baseLayout: liveBaseLayout,
    });

    const llm = extentOf(grouped, "sf-llm-call");
    // Sanity: the resolver did NOT shrink the rendered box — it kept its true
    // (member-derived) height, far taller than the 38px slim bar.
    expect(llm.y1 - llm.y0).toBeGreaterThan(38);

    // EVERY non-member node (the outer siblings + the entry) must be clear of
    // the container box. Members are nested INSIDE it, so they're excluded.
    const memberIds = new Set([
      "sf-llm-call/system-prompt",
      "sf-llm-call/messages",
      "sf-llm-call/invoke",
    ]);
    for (const n of grouped.nodes) {
      if (n.id === "sf-llm-call") continue; // the box itself
      if (n.parentId !== undefined || memberIds.has(n.id)) continue; // nested members
      expect(overlaps(extentOf(grouped, n.id), llm)).toBe(false);
    }
  });

  it("post-container siblings rank fully BELOW the container bottom edge", () => {
    const grouped = applyGroupLayout(agentChart(), {
      groupedSubflowIds: ["sf-llm-call"],
      baseLayout: liveBaseLayout,
    });
    const llm = extentOf(grouped, "sf-llm-call");
    // route is sf-llm-call's `next`; tool-calls/final are route's children.
    for (const sib of ["route", "tool-calls", "final"]) {
      const e = extentOf(grouped, sib);
      expect(e.y0).toBeGreaterThanOrEqual(llm.y1); // top of sibling ≥ box bottom
    }
  });

  it("the slim-bar resolver still applies to NON-grouped subflow mounts", () => {
    // A second subflow that is NOT grouped must stay a slim bar (the resolver
    // still wins for it — only GROUPED, stamped containers flip to style).
    const g: TraceGraph = {
      nodes: [
        node("agent-entry"),
        node("sf-llm-call", { isSubflow: true, subflowId: "sf-llm-call" }),
        node("sf-llm-call/invoke", { subflowOf: "sf-llm-call" }),
        node("sf-other", { isSubflow: true, subflowId: "sf-other" }), // NOT grouped
        node("final"),
      ],
      edges: [
        edge("agent-entry", "sf-llm-call"),
        edge("sf-llm-call", "sf-other"),
        edge("sf-other", "final"),
      ],
    };
    const grouped = applyGroupLayout(g, {
      groupedSubflowIds: ["sf-llm-call"], // only sf-llm-call grouped
      baseLayout: liveBaseLayout,
    });
    const other = grouped.nodes.find((n) => n.id === "sf-other")!;
    // sf-other is left as a drill card; the resolver sizes it to the slim bar.
    // Its style is NOT stamped to a box footprint (it was never grouped).
    const s = (other.style ?? {}) as { width?: number; height?: number };
    // No box stamp → style carries no width/height (or not the box footprint).
    expect(s.height === undefined || s.height === 38).toBe(true);
  });
});
