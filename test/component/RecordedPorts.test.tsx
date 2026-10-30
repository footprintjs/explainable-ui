/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { GroupedFlowDiagram } from "../../src/components/GroupedFlowDiagram/GroupedFlowDiagram";
vi.mock("@xyflow/react", async original => ({ ...await original<typeof import("@xyflow/react")>(),
  ReactFlow: ({ nodes, edges, nodeTypes, children }: any) => <div data-testid="port-edges" data-edges={JSON.stringify(edges)}>{nodes.map((node: any) => {
    const Component = nodeTypes[node.type]; return <Component {...node} key={node.id} />;
  })}{children}</div>, Handle: ({ id, type, position, style }: any) => <i data-handle-id={id ?? "workflow"} data-handle-type={type} data-side={position} data-offset={style?.left ?? style?.top ?? "centre"} />,
  Background: () => null, Controls: () => null,
}));
vi.mock("../../src/components/FlowchartView/_internal/useChartAutoRefit", () => ({ ChartAutoRefit: () => null }));
it("binds every directed relationship endpoint to its own rendered offset handle without merging evidence identities", () => {
  const relation = { kind: "data" as const, attribution: "recorded-read" as const, evidence: ["read:proof"], direction: "backward" as const };
  render(<GroupedFlowDiagram definition={{ nodes: [{ id: "root", label: "Rates" }, { id: "decision", label: "Rates found?", kind: "decision" }, { id: "failed", label: "Failure" }], edges: [] }} recordedRelationships={[
    { ...relation, id: "0-incoming", source: "failed", target: "decision" }, { ...relation, id: "1-read", source: "decision", target: "root" },
    { ...relation, id: "2-rule", source: "decision", target: "root", kind: "control", attribution: "recorded-control" },
  ]} />);
  const edges = JSON.parse(screen.getByTestId("port-edges").getAttribute("data-edges")!), ids = edges.map((edge: any) => edge.id);
  expect(ids.sort()).toEqual(["0-incoming", "1-read", "2-rule"]);
  const decision = document.querySelector('[data-node-id="decision"]')!;
  const endpoints = edges.flatMap((edge: any) => [edge.source === "decision" ? edge.sourceHandle : undefined, edge.target === "decision" ? edge.targetHandle : undefined].filter(Boolean));
  expect(new Set(endpoints).size).toBe(3);
  for (const handle of endpoints) {
    const rendered = decision.querySelector(`[data-handle-id="${handle}"]`)!;
    expect(rendered).toBeTruthy(); expect(rendered.getAttribute("data-offset")).not.toBe("centre");
  }
});
