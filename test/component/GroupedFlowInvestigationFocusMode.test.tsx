/** @vitest-environment jsdom */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { GroupedFlowInvestigation } from "../../src/components/GroupedFlowInvestigation/GroupedFlowInvestigation";
vi.mock("@xyflow/react", async original => ({ ...await original<typeof import("@xyflow/react")>(),
  ReactFlow: ({ nodes, edges, nodeTypes, children }: any) => <div data-testid="focus-model" data-nodes={JSON.stringify(nodes)} data-edges={JSON.stringify(edges)}>{nodes.map((node: any) => {
    const Component = nodeTypes[node.type]; return <Component {...node} key={node.id} />;
  })}{children}</div>, Handle: () => null, Background: () => null, Controls: () => null,
}));
vi.mock("../../src/components/FlowchartView/_internal/useChartAutoRefit", () => ({ ChartAutoRefit: () => null }));
const definition = { nodes: [{ id: "root", label: "Rates" }, { id: "failed", label: "Failure" }, { id: "unrelated", label: "Payment" }],
  edges: [{ id: "design", source: "root", target: "failed", label: "No" }] };
const observation = { nodeStates: { root: "completed" as const, failed: "failed" as const, unrelated: "completed" as const } };
const edge = { from: "failed", to: "root", kind: "data" as const, attribution: "per-write" as const, evidence: ["proof"] };
const answer = { nodeId: "failed", rootCause: "root", path: ["failed", "root"], attention: [], alternatives: [], confidence: "complete" as const, gaps: [],
  backward: { nodes: ["failed", "root"], edges: [edge], confidence: "complete" as const, gaps: [] }, impact: { nodes: [], edges: [], confidence: "complete" as const, gaps: [] } };
const port = () => ({ binding: {}, attention: { nodes: [], confidence: "complete" as const, gaps: [] }, explain: vi.fn(async () => answer) });
const edges = () => JSON.parse(screen.getByTestId("focus-model").getAttribute("data-edges")!);
const nodes = () => JSON.parse(screen.getByTestId("focus-model").getAttribute("data-nodes")!);
it("defaults to a clear recorded-cause view only after a query, and restores all workflow context without another query", async () => {
  const source = port(), view = render(<GroupedFlowInvestigation definition={definition} observation={observation} port={source} />);
  expect(edges().find((edge: any) => edge.id === "design").hidden).not.toBe(true); const before = nodes().map(({ id, position, width, height }: any) => ({ id, position, width, height }));
  fireEvent.click(screen.getByRole("button", { name: "Select Failure" })); await screen.findByText("Supported cause");
  expect(screen.getByText("Cause focus")).toBeTruthy(); expect(edges().find((edge: any) => edge.id === "design").hidden).toBe(true);
  expect(edges().filter((edge: any) => edge.type === "recordedRelationship")).toHaveLength(1);
  expect(nodes().find((node: any) => node.id === "unrelated").style.opacity).toBeLessThan(1);
  expect(nodes().map(({ id, position, width, height }: any) => ({ id, position, width, height }))).toEqual(before);
  fireEvent.click(screen.getByRole("button", { name: "Show whole flow" }));
  expect(edges().find((edge: any) => edge.id === "design").hidden).not.toBe(true); expect(source.explain).toHaveBeenCalledTimes(1);
  view.rerender(<GroupedFlowInvestigation definition={JSON.parse(JSON.stringify(definition))} observation={observation} port={source} />);
  expect(screen.getByRole("button", { name: "Focus on recorded links" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Investigate selected item" }));
  await waitFor(() => expect(source.explain).toHaveBeenCalledTimes(2)); await screen.findByText("Cause focus");
});

it("keeps every returned uncertain source and alternative in focus without inventing a supported cause", async () => {
  const source = port(); source.explain.mockResolvedValue({ ...answer, rootCause: undefined, path: ["failed"], alternatives: ["root"], confidence: "incomplete", gaps: [{ code: "ambiguous", evidence: [] }],
    backward: { ...answer.backward, confidence: "incomplete", gaps: [{ code: "ambiguous", evidence: [] }] } } as any);
  render(<GroupedFlowInvestigation definition={definition} observation={observation} port={source} />);
  fireEvent.click(screen.getByRole("button", { name: "Select Failure" })); await screen.findByText("Root cause unknown");
  expect(nodes().find((node: any) => node.id === "root").style.opacity ?? 1).toBe(1); expect(edges().filter((edge: any) => edge.type === "recordedRelationship")).toHaveLength(1);
  expect(screen.queryByText("Supported cause")).toBeNull(); expect(screen.getByText("Cause focus")).toBeTruthy();
});

it("does not carry a whole-flow choice or old focus intent into another committed recording binding", async () => {
  const first = port(), second = port(), view = render(<GroupedFlowInvestigation definition={definition} observation={observation} port={first} />);
  fireEvent.click(screen.getByRole("button", { name: "Select Failure" })); await screen.findByText("Cause focus");
  fireEvent.click(screen.getByRole("button", { name: "Show whole flow" })); expect(screen.getByText("Whole flow")).toBeTruthy();
  view.rerender(<GroupedFlowInvestigation definition={definition} observation={observation} port={second} />);
  expect(screen.queryByText("Whole flow")).toBeNull(); expect(screen.queryByText("Supported cause")).toBeNull(); expect(second.explain).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Select Failure" })); await screen.findByText("Cause focus");
  expect(edges().find((edge: any) => edge.id === "design").hidden).toBe(true); expect(second.explain).toHaveBeenCalledTimes(1); expect(first.explain).toHaveBeenCalledTimes(1);
});
