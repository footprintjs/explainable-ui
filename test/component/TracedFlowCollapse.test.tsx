/** @vitest-environment jsdom */
/**
 * TracedFlow — `collapseNode` (the neutral hide-plumbing seam).
 *
 * What is being pinned:
 * 1. A node the predicate matches does not render; the path through it does
 *    (the contracted edge exists), so the chart still reads end to end.
 * 2. The predicate is the CALLER's — nothing about any id convention lives in
 *    this component; the test's predicate keys on the caller's own data field.
 * 3. Unset predicate → byte-identical node set (nothing silently hidden).
 */
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { createElement } from "react";
import { TracedFlow } from "../../src/flowchart";
import type { TraceGraph, TraceNode } from "../../src/components/FlowchartView/traceStructureRecorder";

const node = (id: string, data: Record<string, unknown> = {}) =>
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
      ...data,
    },
  }) as unknown as TraceGraph["nodes"][number];

const graph: TraceGraph = {
  nodes: [
    node("seed"),
    node("plumbing", { flavour: "framework", isSubflow: true, subflowId: "plumbing" }),
    node("plumbing/inner", { subflowOf: "plumbing" }),
    node("work"),
  ],
  edges: [
    { id: "seed->plumbing", source: "seed", target: "plumbing", data: { kind: "next" } },
    { id: "plumbing->work", source: "plumbing", target: "work", data: { kind: "next" } },
  ],
} as unknown as TraceGraph;

const ids = (container: HTMLElement): string[] =>
  Array.from(container.querySelectorAll(".react-flow__node")).map(
    (n) => n.getAttribute("data-id") ?? "",
  );

afterEach(cleanup);

describe("TracedFlow — collapseNode", () => {
  it("hides matched nodes and keeps the path through them", () => {
    const hide = (n: TraceNode): boolean => n.data?.flavour === "framework";
    const { container } = render(
      createElement(TracedFlow, { graph, collapseNode: hide, layout: "passthrough" }),
    );
    const rendered = ids(container);
    expect(rendered).toContain("seed");
    expect(rendered).toContain("work");
    expect(rendered).not.toContain("plumbing");
    expect(rendered).not.toContain("plumbing/inner");
    // Edge contraction itself is pinned by the collapseTraceGraph unit test —
    // xyflow draws no edge paths in jsdom (nodes are never measured), so the
    // DOM here can only vouch for the nodes.
  });

  it("hides nothing when the prop is unset", () => {
    const { container } = render(createElement(TracedFlow, { graph, layout: "passthrough" }));
    expect(ids(container).sort()).toEqual(["plumbing", "seed", "work"].sort());
  });
});
