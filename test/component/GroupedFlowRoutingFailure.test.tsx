/** @vitest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { GroupedFlowInvestigation } from "../../src/components/GroupedFlowInvestigation/GroupedFlowInvestigation";

vi.mock("../../src/components/GroupedFlowDiagram/recordedRouting", () => ({ routeRecordedRelationships: (links: readonly unknown[]) => ({ routes: new Map(), decorations: new Map(), undrawn: links.length, work: 0 }), recordedVisualBounds: () => undefined }));
vi.mock("@xyflow/react", async original => ({ ...await original<typeof import("@xyflow/react")>(),
  ReactFlow: ({ nodes, nodeTypes, children }: any) => <div>{nodes.map((node: any) => { const Component = nodeTypes[node.type]; return <Component {...node} key={node.id} />; })}{children}</div>,
  Handle: () => null, Background: () => null, Controls: () => null,
}));
vi.mock("../../src/components/FlowchartView/_internal/useChartAutoRefit", () => ({ ChartAutoRefit: () => null }));

it("keeps the accepted cause, execution status and recorded evidence when connections cannot be drawn", async () => {
  const edge = { from: "failed", to: "root", kind: "data" as const, attribution: "per-write" as const, evidence: ["write:proof"] };
  const port = { binding: {}, labels: { failed: "Failure", root: "Rates" }, attention: { nodes: [], confidence: "complete" as const, gaps: [] },
    explain: vi.fn(async () => ({ nodeId: "failed", rootCause: "root", path: ["failed", "root"], alternatives: [], attention: [], confidence: "complete" as const, gaps: [],
      backward: { nodes: ["failed", "root"], edges: [edge], confidence: "complete" as const, gaps: [] }, impact: { nodes: [], edges: [], confidence: "complete" as const, gaps: [] } })) };
  render(<GroupedFlowInvestigation definition={{ nodes: [{ id: "failed", label: "Failure" }, { id: "root", label: "Rates" }], edges: [] }}
    observation={{ nodeStates: { failed: "failed", root: "completed" } }} port={port} />);
  fireEvent.click(screen.getByRole("button", { name: "Select Failure" })); await screen.findByText("Supported cause");
  expect(document.querySelector('[data-node-id="root"]')?.getAttribute("data-state")).toBe("completed");
  expect(screen.getByText(/1 recorded connection could not be drawn/).textContent).toContain("The explanation is unchanged");
  expect(screen.getByText("Supported root cause")).toBeTruthy(); expect(screen.queryByText("Root cause unknown")).toBeNull();
  fireEvent.click(screen.getByText("Recorded dependency evidence (1)")); expect(screen.getByText("write:proof")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "What it affected" })); expect(port.explain).toHaveBeenCalledTimes(1);
});
