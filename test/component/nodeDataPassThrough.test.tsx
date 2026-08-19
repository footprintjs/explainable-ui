/** @vitest-environment jsdom */
/**
 * 0.35.0 — a node's data reaches the renderer WHOLE.
 *
 * The documented `nodeTypes` extension contract is: swap in your own stage
 * renderer and read your own fields off `data`. Both charts broke it the same
 * way — they rebuilt `data` from a fixed allow-list of the fields the BUNDLED
 * `<StageNode>` happens to read, so everything else was dropped on the floor:
 *
 *   - the consumer's own custom fields (the contract itself), and
 *   - the recorder's own metadata — `isStreaming`, `isPausable`, `branchIds`,
 *     `defaultBranch`, `prevIds`, `nextIds`, `subflowOf` — which the built-in
 *     renderer ignores but a custom one is entitled to use.
 *
 * A renderer cannot read what never arrived, so these assert through the
 * SHIPPED components with a real swapped-in renderer, not through the
 * conversion helper.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { createElement } from "react";
import type { NodeProps } from "@xyflow/react";

import { TraceFlow } from "../../src/components/FlowchartView/TraceFlow";
import { TracedFlow } from "../../src/flowchart";
import type { TraceGraph } from "../../src/components/FlowchartView/traceStructureRecorder";

beforeEach(() => {
  if (typeof window !== "undefined" && !("ResizeObserver" in window)) {
    (window as unknown as { ResizeObserver: unknown }).ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
});

/** A renderer that prints whatever it was handed, so a dropped field is a
 *  missing line in the DOM rather than a silent nothing. */
function ProbeNode({ data }: NodeProps) {
  const d = data as Record<string, unknown>;
  return createElement(
    "div",
    { "data-testid": "probe" },
    createElement("span", { "data-testid": "custom" }, String(d.myOwnField ?? "MISSING")),
    createElement("span", { "data-testid": "cost" }, String(d.costUsd ?? "MISSING")),
    createElement("span", { "data-testid": "streaming" }, String(d.isStreaming ?? "MISSING")),
    createElement("span", { "data-testid": "pausable" }, String(d.isPausable ?? "MISSING")),
    createElement("span", { "data-testid": "branches" }, JSON.stringify(d.branchIds ?? "MISSING")),
    createElement("span", { "data-testid": "default-branch" }, String(d.defaultBranch ?? "MISSING")),
    createElement("span", { "data-testid": "prev" }, JSON.stringify(d.prevIds ?? "MISSING")),
    createElement("span", { "data-testid": "next" }, JSON.stringify(d.nextIds ?? "MISSING")),
    createElement("span", { "data-testid": "subflow-of" }, String(d.subflowOf ?? "MISSING")),
    // The fields the conversion OWNS must still be right.
    createElement("span", { "data-testid": "label" }, String(d.label ?? "MISSING")),
    createElement("span", { "data-testid": "active" }, String(d.active)),
    createElement("span", { "data-testid": "done" }, String(d.done)),
  );
}

const RICH_GRAPH: TraceGraph = {
  nodes: [
    {
      id: "grade",
      type: "stage",
      position: { x: 0, y: 0 },
      data: {
        label: "Grade",
        isDecider: true,
        isFork: false,
        isSubflow: false,
        // ── recorder metadata the bundled renderer never reads ──
        isStreaming: true,
        isPausable: true,
        branchIds: ["pass", "fail"],
        defaultBranch: "fail",
        prevIds: ["seed"],
        nextIds: ["pass", "fail"],
        subflowOf: "pipeline",
        // ── the consumer's own fields (the documented contract) ──
        myOwnField: "kept",
        costUsd: 0.42,
      },
    },
  ] as unknown as TraceGraph["nodes"],
  edges: [],
};

const text = (c: HTMLElement, id: string) => c.querySelector(`[data-testid="${id}"]`)?.textContent;

describe("TraceFlow — custom node data survives the conversion", () => {
  it("hands the consumer's own fields to a swapped-in stageNode renderer", () => {
    const { container } = render(
      createElement(TraceFlow, {
        graph: RICH_GRAPH,
        layout: "passthrough",
        nodeTypes: { stageNode: ProbeNode },
      }),
    );
    expect(text(container, "custom")).toBe("kept");
    expect(text(container, "cost")).toBe("0.42");
  });

  it("hands over the recorder metadata the bundled renderer ignores", () => {
    const { container } = render(
      createElement(TraceFlow, {
        graph: RICH_GRAPH,
        layout: "passthrough",
        nodeTypes: { stageNode: ProbeNode },
      }),
    );
    expect(text(container, "streaming")).toBe("true");
    expect(text(container, "pausable")).toBe("true");
    expect(text(container, "branches")).toBe('["pass","fail"]');
    expect(text(container, "default-branch")).toBe("fail");
    expect(text(container, "prev")).toBe('["seed"]');
    expect(text(container, "next")).toBe('["pass","fail"]');
    expect(text(container, "subflow-of")).toBe("pipeline");
  });

  it("still owns label and run status — the structure chart paints neither", () => {
    const { container } = render(
      createElement(TraceFlow, {
        graph: RICH_GRAPH,
        layout: "passthrough",
        nodeTypes: { stageNode: ProbeNode },
      }),
    );
    expect(text(container, "label")).toBe("Grade");
    expect(text(container, "active")).toBe("false");
    expect(text(container, "done")).toBe("false");
  });
});

describe("TracedFlow — the same, with the overlay still winning", () => {
  // Root-level twin of RICH_GRAPH: `<TracedFlow>` filters by drill scope, and
  // at the root only nodes WITHOUT a `subflowOf` are on screen.
  const ROOT_GRAPH: TraceGraph = {
    nodes: [
      {
        ...RICH_GRAPH.nodes[0],
        data: { ...RICH_GRAPH.nodes[0]!.data, subflowOf: undefined },
      },
    ] as unknown as TraceGraph["nodes"],
    edges: [],
  };

  const overlay = {
    executionOrder: [
      { runtimeStageId: "grade#0", stageId: "grade", stageName: "Grade", timestampMs: 0 },
    ],
    errors: new Map<string, string>(),
    running: false,
  };

  function renderTraced() {
    return render(
      createElement(TracedFlow, {
        graph: ROOT_GRAPH,
        overlay,
        scrubIndex: 0,
        layout: "passthrough",
        nodeTypes: { stageNode: ProbeNode },
      } as never),
    );
  }

  it("passes custom fields and recorder metadata through", async () => {
    const { container } = renderTraced();
    await waitFor(() => expect(container.querySelector('[data-testid="probe"]')).toBeTruthy());
    expect(text(container, "custom")).toBe("kept");
    expect(text(container, "cost")).toBe("0.42");
    expect(text(container, "streaming")).toBe("true");
    expect(text(container, "pausable")).toBe("true");
    expect(text(container, "branches")).toBe('["pass","fail"]');
    expect(text(container, "default-branch")).toBe("fail");
    expect(text(container, "prev")).toBe('["seed"]');
    expect(text(container, "next")).toBe('["pass","fail"]');
  });

  it("run status comes from the overlay, never from the source data", async () => {
    // The graph carries no active/done of its own; the overlay says this node
    // is the cursor. Pass-through must not be able to shout that down.
    const { container } = renderTraced();
    await waitFor(() => expect(container.querySelector('[data-testid="probe"]')).toBeTruthy());
    expect(text(container, "active")).toBe("true");
    expect(text(container, "done")).toBe("false");
    expect(text(container, "label")).toBe("Grade");
  });
});
