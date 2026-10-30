// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { GroupedFlowDiagram } from "../../src/components/GroupedFlowDiagram/GroupedFlowDiagram";
import { GroupContainerNode } from "../../src/components/GroupContainerNode";
import type { FlowDiagramDefinition } from "../../src/components/GroupedFlowDiagram/types";
import { theme } from "../../src/theme";
vi.mock("../../src/components/FlowchartView/_internal/useChartAutoRefit", () => ({ ChartAutoRefit: (props: any) => <output data-testid="camera-targets" data-focus={props.focusNodeIds?.join(" ") ?? "overview"} /> }));

vi.mock("@xyflow/react", async original => ({ ...await original<typeof import("@xyflow/react")>(),
  ReactFlow: ({ nodes, edges, nodeTypes, children }: any) => <div data-testid="canvas-model" data-model-nodes={JSON.stringify(nodes.map(({ id, position, width, height, parentId }: any) => ({ id, position, width, height, parentId })))}
    data-model-edges={JSON.stringify(edges.map(({ id, source, target, sourceHandle, targetHandle, data, className, style, markerEnd, ariaLabel }: any) => ({ id, source, target, sourceHandle, targetHandle, data, className, style, markerEnd, ariaLabel })))}>{nodes.map((node: any) => {
    const Component = nodeTypes[node.type];
    return <div key={node.id}><Component id={node.id} data={node.data} /></div>;
  })}{children}</div>, Handle: () => null, Background: () => null, Controls: () => null,
}));
const definition: FlowDiagramDefinition = { nodes: [
  { id: "payment", label: "Payment", kind: "group" },
  { id: "authorize", label: "Authorize card", parentId: "payment" },
  { id: "capture", label: "Capture payment", parentId: "payment" },
  { id: "ship", label: "Shipping rates" },
], edges: [{ id: "paid-ship", source: "capture", target: "ship" }] };

it("does not expose existing extra group metadata without the new header opt-in", () => {
  const data = { label: "Existing group", headerAction: "PRIVATE_METADATA", statusLabel: "PRIVATE_STATUS", iconContent: { privateField: "PRIVATE_ICON" } };
  render(<GroupContainerNode {...({ data } as any)} />);
  expect(screen.getByText("Existing group")).toBeTruthy();
  expect(document.body.textContent).not.toContain("PRIVATE_");
});

it("opens one flow card into recorded children without inventing a group completion", () => {
  render(<GroupedFlowDiagram definition={definition} observation={{ nodeStates: { authorize: "completed", capture: "completed" } }} />);
  expect(screen.queryByText("Authorize card")).toBeNull();
  expect(screen.getByRole("button", { name: /Expand Payment/ }).textContent).toContain("Status unknown");
  fireEvent.click(screen.getByRole("button", { name: /Expand Payment/ }));
  expect(screen.getByText("Authorize card")).toBeTruthy();
  expect(screen.getByRole("button", { name: /Collapse Payment/ })).toBeTruthy();
});

it("emits a single controlled expansion and selects the exact child ID", () => {
  const expand = vi.fn(), select = vi.fn();
  const { rerender } = render(<GroupedFlowDiagram definition={definition} expandedGroupIds={[]} onExpandedGroupIdsChange={expand} onSelectNode={select} />);
  fireEvent.click(screen.getByRole("button", { name: /Expand Payment/ }));
  expect(expand).toHaveBeenCalledExactlyOnceWith(["payment"]);
  expect(select).not.toHaveBeenCalled();
  rerender(<GroupedFlowDiagram definition={definition} expandedGroupIds={["payment"]} onExpandedGroupIdsChange={expand} onSelectNode={select} />);
  fireEvent.click(screen.getByRole("button", { name: /Select Authorize card/ }));
  expect(select).toHaveBeenCalledExactlyOnceWith("authorize");
});

it("reveals the selected child's group without choosing another visit", () => {
  const expand = vi.fn();
  render(<GroupedFlowDiagram definition={definition} selectedNodeId="capture" expandedGroupIds={[]} onExpandedGroupIdsChange={expand} />);
  expect(screen.getByText("Selection inside")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Reveal selection" }));
  expect(expand).toHaveBeenCalledExactlyOnceWith(["payment"]);
});

it("keeps equivalent rerenders expanded and refuses missing evidence as an actionable fixed message", () => {
  const { rerender } = render(<GroupedFlowDiagram definition={definition} />);
  fireEvent.click(screen.getByRole("button", { name: /Expand Payment/ }));
  rerender(<GroupedFlowDiagram definition={JSON.parse(JSON.stringify(definition))} />);
  expect(screen.getByText("Authorize card")).toBeTruthy();
  rerender(<GroupedFlowDiagram definition={{ nodes: [{ id: "secret", label: "PRIVATE_NAME", parentId: "missing" }], edges: [] }} />);
  expect(screen.getByRole("alert").textContent).not.toContain("PRIVATE_NAME");
  expect(screen.getByText("How to fix this diagram")).toBeTruthy();
});

it("distinguishes repeated nested flows and same-name steps using instance context", () => {
  const select = vi.fn();
  const nested: FlowDiagramDefinition = { nodes: [
    { id: "root", label: "Order", kind: "group" },
    { id: "pay-a", label: "Payment", kind: "group", parentId: "root" },
    { id: "pay-b", label: "Payment", kind: "group", parentId: "root" },
    { id: "a1", label: "Validate", parentId: "pay-a" },
    { id: "a2", label: "Validate", parentId: "pay-a" },
    { id: "b1", label: "Validate", parentId: "pay-b" },
  ], edges: [] };
  render(<GroupedFlowDiagram definition={nested} defaultExpandedGroupIds={["root"]} onSelectNode={select} />);
  fireEvent.click(screen.getByRole("button", { name: "Expand Payment · Group 2" }));
  fireEvent.click(screen.getByRole("button", { name: "Select Validate · Group 2 · Item 5" }));
  expect(select).toHaveBeenCalledExactlyOnceWith("a2");
  expect(screen.getByRole("button", { name: "Expand Payment · Group 3" })).toBeTruthy();
});

it.each(["includes", "filter", "iterator"])("does not re-enter an admitted array's extra %s accessor during a gesture", field => {
  const getter = vi.fn(() => { throw new Error("PRIVATE_ACCESSOR"); });
  const expanded = field === "filter" ? ["payment"] : [];
  Object.defineProperty(expanded, field === "iterator" ? Symbol.iterator : field, { get: getter });
  const onChange = vi.fn();
  render(<GroupedFlowDiagram definition={definition} expandedGroupIds={expanded} onExpandedGroupIdsChange={onChange} selectedNodeId="capture" />);
  fireEvent.click(screen.getByRole("button", { name: field === "filter" ? /Collapse Payment/ : /Expand Payment/ }));
  expect(getter).not.toHaveBeenCalled();
  expect(onChange).toHaveBeenCalledExactlyOnceWith(field === "filter" ? [] : ["payment"]);
  fireEvent.click(screen.getByRole("button", { name: "Reveal selection" }));
  expect(getter).not.toHaveBeenCalled();
  expect(onChange).toHaveBeenLastCalledWith(["payment"]);
});

it.each([
  { name: "a root connection", definition: { nodes: [{ id: "a", label: "First" }, { id: "b", label: "Next" }], edges: [{ id: "link", source: "a", target: "b" }] }, expanded: [], expected: "a b" },
  { name: "an expanded group's internal connection", definition: { ...definition, edges: [{ id: "link", source: "authorize", target: "capture" }] }, expanded: ["payment"], expected: "authorize capture" },
  { name: "a collapsed group's hidden internal connection", definition: { ...definition, edges: [{ id: "link", source: "authorize", target: "capture" }] }, expanded: [], expected: "payment" },
])("focuses $name without promoting its endpoint evidence", ({ definition: diagram, expanded, expected }) => {
  const { container } = render(<GroupedFlowDiagram definition={diagram} defaultExpandedGroupIds={expanded} highlight={{ edgeIds: ["link"] }} />);
  const focus = screen.getByRole("button", { name: "Focus highlighted path" });
  expect((focus as HTMLButtonElement).disabled).toBe(false);
  fireEvent.click(focus);
  expect(screen.getByTestId("camera-targets").getAttribute("data-focus")).toBe(expected);
  expect([...container.querySelectorAll("[data-node-id]")].every(node => node.getAttribute("data-state") === "unknown")).toBe(true);
  const endpointIds = expected.split(" ").filter(id => id !== "payment");
  for (const id of endpointIds) expect(container.querySelector(`[data-node-id="${id}"]`)?.getAttribute("data-highlighted")).toBe("false");
});

it("focuses an explicitly highlighted expanded group when no leaves are emphasized", () => {
  render(<GroupedFlowDiagram definition={definition} defaultExpandedGroupIds={["payment"]} highlight={{ nodeIds: ["payment"] }} />);
  fireEvent.click(screen.getByRole("button", { name: "Focus highlighted path" }));
  expect(screen.getByTestId("camera-targets").getAttribute("data-focus")).toBe("payment");
});

it("keeps the structural geometry and transitions unchanged when recorded dependencies are overlaid", () => {
  const props = { definition, defaultExpandedGroupIds: ["payment"] };
  const { rerender } = render(<GroupedFlowDiagram {...props} />);
  const before = screen.getByTestId("canvas-model").getAttribute("data-model-nodes");
  const relationships = [{ id: "dep", source: "capture", target: "authorize", kind: "data" as const, attribution: "recorded-read" as const, evidence: ["read:1"], direction: "backward" as const }];
  rerender(<GroupedFlowDiagram {...props} recordedRelationships={relationships} />);
  expect(screen.getByTestId("canvas-model").getAttribute("data-model-nodes")).toBe(before);
  const edges = JSON.parse(screen.getByTestId("canvas-model").getAttribute("data-model-edges")!);
  expect(edges.find((edge: any) => edge.id === "paid-ship").className).toBe("gfd-edge-unknown");
  expect(edges.find((edge: any) => edge.id === "dep")).toMatchObject({ source: "capture", target: "authorize", sourceHandle: "recorded-bottom-source", targetHandle: "recorded-bottom-target", data: { relationship: relationships[0], route: expect.any(Object) }, style: { strokeWidth: 1.8 }, markerEnd: { width: 14, height: 14 } });
});

it("applies one explicit camera key without stealing camera ownership on equivalent renders", () => {
  const key = {};
  const props = { definition, defaultExpandedGroupIds: ["payment"] };
  const { rerender } = render(<GroupedFlowDiagram {...props} focusRequest={{ key, nodeIds: ["ship"] }} />);
  expect(screen.getByTestId("camera-targets").getAttribute("data-focus")).toBe("ship");
  rerender(<GroupedFlowDiagram {...props} focusRequest={{ key, nodeIds: ["capture"] }} />);
  expect(screen.getByTestId("camera-targets").getAttribute("data-focus")).toBe("ship");
  rerender(<GroupedFlowDiagram {...props} focusRequest={{ key: {}, nodeIds: ["capture"] }} />);
  expect(screen.getByTestId("camera-targets").getAttribute("data-focus")).toBe("capture");
});

it("refuses malformed camera intent without running its accessors or selecting an arbitrary substitute", () => {
  let reads = 0;
  const request = Object.defineProperty({ nodeIds: ["ship"] }, "key", { get() { reads++; return {}; } });
  const { rerender } = render(<GroupedFlowDiagram definition={definition} focusRequest={request as any} />);
  expect(reads).toBe(0); expect(screen.getByRole("alert")).toBeTruthy();
  rerender(<GroupedFlowDiagram definition={definition} focusRequest={{ key: {}, nodeIds: ["PRIVATE_MISSING"] }} />);
  expect(screen.getByRole("alert").textContent).not.toContain("PRIVATE_MISSING");
});

it("keeps decision identity and dimensions in a rounded card with a small decision marker and the host icon", () => {
  const diagram = { nodes: [{ id: "choice", label: "Rates found?", kind: "decision" as const, icon: "🧭" }, { id: "next", label: "Continue" }], edges: [{ id: "yes", source: "choice", target: "next", label: "Yes" }] };
  render(<GroupedFlowDiagram definition={diagram} />);
  const card = screen.getByRole("button", { name: "Select Rates found?" });
  expect(card.style.borderRadius).toBe("16px"); expect(card.style.borderStyle).toBe("solid");
  expect(card.querySelector("polygon")).toBeNull(); expect(screen.getByText("Decision")).toBeTruthy(); expect(screen.getByText("🧭")).toBeTruthy();
  const nodes = JSON.parse(screen.getByTestId("canvas-model").getAttribute("data-model-nodes")!);
  expect(nodes.find((node: any) => node.id === "choice")).toMatchObject({ width: 180, height: 172 });
});

it("distinguishes the backward source trail from forward impact without recolouring structural paths or completed nodes", () => {
  const relation = { id: "cause", source: "capture", target: "authorize", kind: "data" as const, attribution: "recorded-read" as const, evidence: ["proof"], direction: "backward" as const };
  render(<GroupedFlowDiagram definition={definition} defaultExpandedGroupIds={["payment"]} observation={{ nodeStates: { capture: "completed", authorize: "completed" } }}
    recordedRelationships={[relation, { ...relation, id: "impact", direction: "forward" }]} />);
  const edges = JSON.parse(screen.getByTestId("canvas-model").getAttribute("data-model-edges")!);
  expect(edges.find((edge: any) => edge.id === "cause").style.stroke).toBe(theme.error);
  expect(edges.find((edge: any) => edge.id === "impact").style.stroke).toBe(theme.tracing);
  expect(edges.find((edge: any) => edge.id === "paid-ship").style.stroke).toBe(theme.textMuted);
  expect(screen.getByText(/Warm backward links/).textContent).toContain("not failed steps");
  expect(document.querySelector('[data-node-id="authorize"]')?.getAttribute("data-state")).toBe("completed");
});

it("keeps a relationship without a direction hint neutral rather than claiming forward impact", () => {
  render(<GroupedFlowDiagram definition={definition} defaultExpandedGroupIds={["payment"]} recordedRelationships={[
    { id: "neutral", source: "capture", target: "authorize", kind: "data", attribution: "recorded-read", evidence: ["proof"] },
  ]} />);
  const edge = JSON.parse(screen.getByTestId("canvas-model").getAttribute("data-model-edges")!).find((edge: any) => edge.id === "neutral");
  expect(edge.style.stroke).toBe(theme.textSecondary); expect(edge.ariaLabel).toContain("Recorded dependency.");
  expect(edge.ariaLabel).not.toMatch(/Forward recorded impact|Backward source trail/);
});
