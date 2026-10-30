/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { GroupedFlowDiagram } from "../../src/components/GroupedFlowDiagram/GroupedFlowDiagram";
import { projectGroupedFlowDiagram } from "../../src/components/GroupedFlowDiagram/layout";

vi.mock("@xyflow/react", async original => ({ ...await original<typeof import("@xyflow/react")>(),
  ReactFlow: ({ nodes, nodeTypes, children }: any) => <div>{nodes.map((node: any) => {
    const Component = nodeTypes[node.type]; return <Component {...node} key={node.id} />;
  })}{children}</div>, Handle: () => null, Background: () => null, Controls: () => null,
}));
vi.mock("../../src/components/FlowchartView/_internal/useChartAutoRefit", () => ({ ChartAutoRefit: () => null }));

const definition = { nodes: [{ id: "group", label: "Checks", kind: "group" as const },
  { id: "root", label: "Shipping rates", parentId: "group" }, { id: "failed", label: "Order failed" }], edges: [] };
const observation = { nodeStates: { root: "completed" as const, failed: "failed" as const } };

it("marks the exact supported cause while an ancestor says only cause inside, preserving execution and geometry", () => {
  const before = projectGroupedFlowDiagram(definition, { observation, expandedGroupIds: ["group"] }).model!;
  const after = projectGroupedFlowDiagram(definition, { observation, expandedGroupIds: ["group"], highlight: { rootCauseId: "root" } as any }).model!;
  expect(after.nodes.find(item => item.node.id === "root")).toMatchObject({ isRootCause: true, containsRootCause: false, state: "completed" });
  expect(after.nodes.find(item => item.node.id === "group")).toMatchObject({ isRootCause: false, containsRootCause: true });
  expect(after.nodes.map(({ position, width, height, state }) => ({ position, width, height, state }))).toEqual(before.nodes.map(({ position, width, height, state }) => ({ position, width, height, state })));
  const view = render(<GroupedFlowDiagram definition={definition} observation={observation} highlight={{ rootCauseId: "root" } as any} />);
  expect(screen.queryByText("Supported cause")).toBeNull();
  expect(screen.getByText("Cause inside").closest("[data-node-id]")?.getAttribute("data-node-id")).toBe("group");
  view.rerender(<GroupedFlowDiagram definition={definition} observation={observation} expandedGroupIds={["group"]} highlight={{ rootCauseId: "root" } as any} />);
  expect(screen.getByText("Supported cause").closest("[data-node-id]")?.getAttribute("data-node-id")).toBe("root");
  expect(document.querySelector('[data-node-id="root"]')?.getAttribute("data-state")).toBe("completed");
  expect(screen.getByText("Cause inside").closest("[data-node-id]")?.getAttribute("data-node-id")).toBe("group");
});

it.each(["missing", "not-run", "hidden-not-run", "accessor"])("refuses a %s root marker without substituting an ancestor or running code", reason => {
  const getter = vi.fn(() => "root");
  const highlight = reason === "accessor" ? Object.defineProperty({}, "rootCauseId", { get: getter }) : { rootCauseId: reason === "missing" ? "outside" : "root" };
  const states: Record<string, "not-run"> = {};
  if (reason === "not-run") states.root = "not-run";
  if (reason === "hidden-not-run") states.group = "not-run";
  const result = projectGroupedFlowDiagram(definition, { observation: { nodeStates: states }, highlight: highlight as any });
  expect(result.model).toBeUndefined(); expect(result.error).toBeTruthy(); expect(getter).not.toHaveBeenCalled();
});
