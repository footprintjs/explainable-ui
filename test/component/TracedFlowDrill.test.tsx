/** @vitest-environment jsdom */
/**
 * TracedFlow — subflow drill (the same facts Playwright verified on the demo).
 *
 * What is being pinned:
 * 1. Clicking a mount card drills by the mount NODE id. It used to drill by
 *    `data.subflowId` — the child chart's LOCAL id — so the same chart mounted
 *    twice gave two mounts one key, and the nested one showed the top-level
 *    twin's stages (or nothing, with no twin to borrow from).
 * 2. Drilling shows exactly THAT mount's stages.
 * 3. `currentSubflowId` makes the drill CONTROLLED: the chart renders the
 *    host's scope and reports gestures instead of keeping a second, private
 *    state that can drift out of step with the panels beside it.
 */
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { createElement } from "react";
import { TracedFlow } from "../../src/flowchart";
import type { TraceGraph } from "../../src/components/FlowchartView/traceStructureRecorder";

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
      prevIds: [],
      nextIds: [],
      ...data,
    },
  }) as unknown as TraceGraph["nodes"][number];

/** `prepare` mounted twice — top level and inside `pipeline`. */
const graph: TraceGraph = {
  nodes: [
    node("seed"),
    node("prepare", { isSubflow: true, subflowId: "prepare" }),
    node("prepare/clean", { subflowOf: "prepare" }),
    node("pipeline", { isSubflow: true, subflowId: "pipeline" }),
    node("pipeline/prepare", { isSubflow: true, subflowId: "prepare", subflowOf: "pipeline" }),
    node("pipeline/prepare/clean", { subflowOf: "pipeline/prepare" }),
    node("pipeline/prepare/scale", { subflowOf: "pipeline/prepare" }),
  ],
  edges: [
    { id: "seed->prepare", source: "seed", target: "prepare", data: { kind: "next" } },
    {
      id: "pipeline/prepare/clean->pipeline/prepare/scale",
      source: "pipeline/prepare/clean",
      target: "pipeline/prepare/scale",
      data: { kind: "next" },
    },
  ],
} as unknown as TraceGraph;

const ids = (container: HTMLElement): string[] =>
  Array.from(container.querySelectorAll(".react-flow__node")).map(
    (n) => n.getAttribute("data-id") ?? "",
  );

function clickNode(container: HTMLElement, id: string): void {
  const el = Array.from(container.querySelectorAll<HTMLElement>(".react-flow__node")).find(
    (n) => n.getAttribute("data-id") === id,
  );
  expect(el, `node ${id} rendered`).toBeTruthy();
  fireEvent.click(el!);
}

afterEach(cleanup);

describe("TracedFlow — drill keys on the mount node (REGRESSION)", () => {
  it("reports the mount NODE id, not the local subflow id", async () => {
    const onSubflowChange = vi.fn();
    const { container } = render(
      createElement(TracedFlow, { graph, onSubflowChange, layout: "passthrough" }),
    );
    await waitFor(() => expect(ids(container)).toContain("pipeline"));
    clickNode(container, "pipeline"); // the nested mount lives one level down
    await waitFor(() => expect(ids(container)).toContain("pipeline/prepare"));
    clickNode(container, "pipeline/prepare");
    await waitFor(() => expect(onSubflowChange).toHaveBeenCalledWith("pipeline/prepare"));
  });

  it("drilling a NESTED mount shows ITS stages, not the twin's", async () => {
    const { container } = render(createElement(TracedFlow, { graph, layout: "passthrough" }));
    await waitFor(() => expect(ids(container)).toContain("pipeline"));
    clickNode(container, "pipeline");
    await waitFor(() => expect(ids(container)).toContain("pipeline/prepare"));
    clickNode(container, "pipeline/prepare");
    await waitFor(() =>
      expect(ids(container).sort()).toEqual([
        "pipeline/prepare/clean",
        "pipeline/prepare/scale",
      ]),
    );
  });

  it("drilling the top-level twin still shows its own stage", async () => {
    const { container } = render(createElement(TracedFlow, { graph, layout: "passthrough" }));
    await waitFor(() => expect(ids(container)).toContain("prepare"));
    clickNode(container, "prepare");
    await waitFor(() => expect(ids(container)).toEqual(["prepare/clean"]));
  });
});

describe("TracedFlow — controlled drill (INTEGRATION)", () => {
  it("renders the host's scope and does not keep its own", async () => {
    const onSubflowChange = vi.fn();
    const { container } = render(
      createElement(TracedFlow, {
        graph,
        currentSubflowId: "pipeline/prepare",
        onSubflowChange,
        layout: "passthrough",
      }),
    );
    await waitFor(() =>
      expect(ids(container).sort()).toEqual([
        "pipeline/prepare/clean",
        "pipeline/prepare/scale",
      ]),
    );
    // A click REPORTS but does not move the view — the host owns the value.
    clickNode(container, "pipeline/prepare/clean");
    expect(ids(container).sort()).toEqual(["pipeline/prepare/clean", "pipeline/prepare/scale"]);
  });

  it("uncontrolled charts keep drilling on their own (unchanged default)", async () => {
    const { container } = render(createElement(TracedFlow, { graph, layout: "passthrough" }));
    await waitFor(() => expect(ids(container)).toContain("pipeline"));
    clickNode(container, "pipeline");
    await waitFor(() => expect(ids(container)).toEqual(["pipeline/prepare"]));
  });
});
