/** @vitest-environment jsdom */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { GroupedFlowInvestigation } from "../../src/components/GroupedFlowInvestigation/GroupedFlowInvestigation";

// Exercise the real composition AND GroupedFlowDiagram state. Only browser canvas
// measurements are doubled; replacing the whole diagram would miss retained camera IDs.
vi.mock("@xyflow/react", async original => ({ ...await original<typeof import("@xyflow/react")>(),
  ReactFlow: ({ nodes, nodeTypes, children }: any) => <div>{nodes.map((node: any) => {
    const Component = nodeTypes[node.type]; return <Component {...node} key={node.id} />;
  })}{children}</div>, Handle: () => null, Background: () => null, Controls: () => null,
}));
vi.mock("../../src/components/FlowchartView/_internal/useChartAutoRefit", () => ({ ChartAutoRefit: () => null }));
function source(suffix: string) {
  const failed = `failed-${suffix}`, root = `source-${suffix}`;
  return { definition: { nodes: [{ id: failed, label: "Failure" }, { id: root, label: "Source" }], edges: [] },
    observation: { nodeStates: { [failed]: "failed" as const, [root]: "completed" as const } },
    port: { binding: {}, attention: { nodes: [], confidence: "complete" as const, gaps: [] }, labels: { [failed]: "Failure", [root]: "Source" },
      explain: vi.fn(async () => ({ nodeId: failed, rootCause: root, path: [failed, root], attention: [], alternatives: [], confidence: "complete" as const, gaps: [],
        backward: { nodes: [failed, root], edges: [{ from: failed, to: root, kind: "data" as const, attribution: "per-write" as const, evidence: [`proof:${suffix}`] }], confidence: "complete" as const, gaps: [] },
        impact: { nodes: [], edges: [], confidence: "complete" as const, gaps: [] } })) } };
}
const canvas = () => document.querySelector<HTMLElement>("[data-camera-focus]")!;
async function explain() {
  fireEvent.click(screen.getByRole("button", { name: "Select Failure" }));
  await waitFor(() => expect(canvas().getAttribute("data-camera-focus")).toContain("source-a"));
}
it("clears retained camera IDs when the committed binding changes, even before a new query", async () => {
  const a = source("a"), b = source("b"), view = render(<GroupedFlowInvestigation {...a} />);
  await explain(); const oldCanvas = canvas();
  view.rerender(<GroupedFlowInvestigation {...b} />);
  expect(canvas()).not.toBe(oldCanvas);
  expect(canvas().getAttribute("data-camera-focus")).toBe("overview");
  expect(document.querySelector('[data-node-id="failed-a"]')).toBeNull();
  expect(canvas().getAttribute("data-camera-focus")).not.toMatch(/failed-a|source-a/);
  expect(b.port.explain).not.toHaveBeenCalled();
});
it("retains the actual diagram and accepted camera target on equivalent same-binding rerenders", async () => {
  const a = source("a"), view = render(<GroupedFlowInvestigation {...a} />);
  await explain(); const oldCanvas = canvas(), before = oldCanvas.getAttribute("data-camera-focus");
  view.rerender(<GroupedFlowInvestigation {...a} definition={JSON.parse(JSON.stringify(a.definition))} observation={JSON.parse(JSON.stringify(a.observation))} />);
  expect(canvas()).toBe(oldCanvas); expect(canvas().getAttribute("data-camera-focus")).toBe(before);
  expect(a.port.explain).toHaveBeenCalledTimes(1);
});

it("shows the exact supported cause above the real diagram and badges only that completed card in cause mode", async () => {
  const a = source("a"), view = render(<GroupedFlowInvestigation {...a} />);
  const summary = screen.getByRole("status", { name: "Cause summary" });
  expect(summary.textContent).toContain("Select a failed item");
  fireEvent.click(screen.getByRole("button", { name: "Select Failure" }));
  expect(summary.textContent).toContain("Checking recorded evidence");
  await screen.findByText("Supported cause");
  expect(summary.textContent).toContain("Supported cause: Source");
  expect(summary.compareDocumentPosition(canvas()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(screen.getByText("Supported cause").closest("[data-node-id]")?.getAttribute("data-node-id")).toBe("source-a");
  expect(document.querySelector('[data-node-id="source-a"]')?.getAttribute("data-state")).toBe("completed");
  fireEvent.click(screen.getByRole("button", { name: "What it affected" }));
  expect(screen.queryByText("Supported cause")).toBeNull(); expect(a.port.explain).toHaveBeenCalledTimes(1);
  expect(summary.textContent).toContain("Showing recorded affected items below.");
  fireEvent.click(screen.getByRole("button", { name: "Why it happened" }));
  expect(screen.getByText("Supported cause")).toBeTruthy(); expect(a.port.explain).toHaveBeenCalledTimes(1);
  view.rerender(<GroupedFlowInvestigation {...source("b")} />);
  expect(screen.queryByText("Supported cause")).toBeNull();
  expect(screen.getByRole("status", { name: "Cause summary" }).textContent).toContain("Select a failed item");
});

it.each(["partial", "tied", "malformed", "unmapped"])("never badges a %s result as a diagram cause", async reason => {
  const a = source("a"), original = await a.port.explain();
  const gap = { code: "ambiguous" as const, evidence: [] };
  const result = reason === "unmapped" ? { ...original, rootCause: "outside", path: ["failed-a", "outside"], backward: { ...original.backward,
    nodes: ["failed-a", "outside"], edges: [{ ...original.backward.edges[0]!, to: "outside" }] } }
    : reason === "malformed" ? { ...original, backward: { ...original.backward, edges: [] } }
    : { ...original, rootCause: undefined, path: ["failed-a"], alternatives: reason === "tied" ? ["source-a"] : [],
      confidence: "incomplete" as const, gaps: [gap], backward: { ...original.backward, confidence: "incomplete" as const, gaps: [gap] } };
  a.port.explain.mockResolvedValue(result as any);
  render(<GroupedFlowInvestigation {...a} />);
  fireEvent.click(screen.getByRole("button", { name: "Select Failure" }));
  await screen.findByText(reason === "malformed" ? "This explanation could not be verified." : reason === "unmapped" ? "Supported root cause" : "Root cause unknown");
  expect(screen.queryByText("Supported cause")).toBeNull();
  const summary = screen.getByRole("status", { name: "Cause summary" });
  expect(summary.textContent).toContain(reason === "unmapped" ? "not shown in this diagram" : "Cause unknown");
});

it("keeps the exact cause badge when only the separately returned impact is incomplete, then clears it on passive selection", async () => {
  const a = source("a"), original = await a.port.explain(), gap = { code: "edge-limit" as const, evidence: [] };
  a.port.explain.mockResolvedValue({ ...original, confidence: "incomplete", gaps: [gap], impact: { ...original.impact, confidence: "incomplete", gaps: [gap] } } as any);
  render(<GroupedFlowInvestigation {...a} />);
  fireEvent.click(screen.getByRole("button", { name: "Select Failure" }));
  await screen.findByText("Supported cause");
  fireEvent.click(screen.getByRole("button", { name: "Select Source" }));
  expect(screen.queryByText("Supported cause")).toBeNull();
  expect(screen.getByRole("status", { name: "Cause summary" }).textContent).toContain("Select a failed item");
});

it("does not badge a returned cause that contradicts the diagram’s explicit not-run state", async () => {
  const a = source("a");
  render(<GroupedFlowInvestigation {...a} observation={{ nodeStates: { "failed-a": "failed", "source-a": "not-run" } }} />);
  fireEvent.click(screen.getByRole("button", { name: "Select Failure" }));
  await screen.findByText("Supported root cause");
  expect(screen.queryByText("Supported cause")).toBeNull();
  expect(screen.getByRole("status", { name: "Cause summary" }).textContent).toContain("Cause unknown");
});

it("keeps keyboard focus at the clicked diagram card rather than scrolling to the lower text panel", async () => {
  const a = source("a"); render(<GroupedFlowInvestigation {...a} />);
  const trigger = screen.getByRole("button", { name: "Select Failure" });
  trigger.focus(); fireEvent.click(trigger);
  expect(document.activeElement).toBe(trigger);
  await screen.findByText("Supported cause"); expect(document.activeElement).toBe(trigger);
  fireEvent.click(screen.getByRole("button", { name: "Show recorded path" }));
  const related = screen.getByRole("button", { name: "Investigate related item 1" });
  related.focus(); fireEvent.click(related);
  expect(document.activeElement).toBe(screen.getByRole("region", { name: "Selected explanation" }));
});
