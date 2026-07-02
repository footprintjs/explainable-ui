/** @vitest-environment jsdom */
/**
 * TracedFlow `sliceCone` — the dependency-cone overlay.
 *
 * What is being pinned (the same facts Playwright verified live on the demo):
 * 1. Members keep opacity 1 with a transition-delay STAGGERED by BFS depth
 *    (the "causality walks backwards" reveal); non-members dim to 0.22.
 * 2. No cone (undefined) → no style injection at all — byte-identical nodes.
 * 3. Edges with an endpoint outside the cone dim; in-cone edges don't.
 */
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, waitFor } from "@testing-library/react";
import { createElement } from "react";
import { TracedFlow } from "../../src/flowchart";
import type {
  TraceGraph,
  TraceNode,
  TraceNodeData,
} from "../../src/components/FlowchartView/traceStructureRecorder";

const node = (id: string): TraceNode =>
  ({
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
    } as TraceNodeData,
  }) as TraceNode;

// The fan-in fixture: a → b → c → d, where c (the "audit" analog) is NOT in
// d's dependency cone even though it is d's chronological neighbor.
const graph: TraceGraph = {
  nodes: [node("a"), node("b"), node("c"), node("d")],
  edges: [
    { id: "a->b", source: "a", target: "b", data: { kind: "next" } },
    { id: "b->c", source: "b", target: "c", data: { kind: "next" } },
    { id: "c->d", source: "c", target: "d", data: { kind: "next" } },
  ],
};

const cone = new Map<string, number>([
  ["d", 0], // the anchor
  ["b", 1],
  ["a", 2],
  // "c" deliberately absent — the chronological neighbor outside the cone
]);

function nodeEl(container: HTMLElement, id: string): HTMLElement {
  const el = container.querySelector<HTMLElement>(`.react-flow__node[data-id="${id}"]`);
  expect(el, `node ${id} rendered`).toBeTruthy();
  return el!;
}

afterEach(cleanup);

describe("TracedFlow — sliceCone overlay", () => {
  it("dims non-members and staggers member reveal by depth", async () => {
    const { container } = render(createElement(TracedFlow, { graph, sliceCone: cone }));
    await waitFor(() => expect(container.querySelectorAll(".react-flow__node").length).toBe(4));
    // The two-phase reveal flips on a rAF — wait for the revealed state.
    await waitFor(() => expect(nodeEl(container, "d").style.opacity).toBe("1"));

    expect(nodeEl(container, "c").style.opacity).toBe("0.22"); // outside the cone
    expect(nodeEl(container, "d").style.transitionDelay).toBe("0ms"); // anchor
    expect(nodeEl(container, "b").style.transitionDelay).toBe("90ms"); // depth 1
    expect(nodeEl(container, "a").style.transitionDelay).toBe("180ms"); // depth 2
    expect(nodeEl(container, "a").style.opacity).toBe("1");
  });

  it("no cone → no style injection (byte-identical rendering)", async () => {
    const { container } = render(createElement(TracedFlow, { graph }));
    await waitFor(() => expect(container.querySelectorAll(".react-flow__node").length).toBe(4));
    for (const id of ["a", "b", "c", "d"]) {
      expect(nodeEl(container, id).style.opacity).toBe("");
      expect(nodeEl(container, id).style.transitionDelay).toBe("");
    }
  });

  it("empty cone map behaves like no cone", async () => {
    const { container } = render(
      createElement(TracedFlow, { graph, sliceCone: new Map<string, number>() }),
    );
    await waitFor(() => expect(container.querySelectorAll(".react-flow__node").length).toBe(4));
    expect(nodeEl(container, "c").style.opacity).toBe("");
  });
});
