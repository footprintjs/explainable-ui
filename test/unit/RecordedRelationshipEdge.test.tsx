/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { Position } from "@xyflow/react";
import { RecordedRelationshipEdge } from "../../src/components/GroupedFlowDiagram/RecordedRelationshipEdge";
vi.mock("@xyflow/react", async original => ({ ...await original<typeof import("@xyflow/react")>(),
  BaseEdge: (props: any) => <output data-testid={props.id} data-path={props.path} />,
  EdgeLabelRenderer: ({ children }: any) => children,
}));
const props = { id: "link", sourceX: 400, sourceY: 80, targetX: 100, targetY: 80, sourcePosition: Position.Left, targetPosition: Position.Right, label: "Recorded read · data", data: { relationship: { attribution: "recorded-read", kind: "data", direction: "backward" } } } as any;
it("routes from the actual handles rather than assuming execution direction", () => {
  render(<RecordedRelationshipEdge {...props} />);
  const path = screen.getByTestId("link").getAttribute("data-path")!;
  expect(path).toBe("M400,80 C295,16 205,16 100,80");
  expect(screen.getByText("Read")).toBeTruthy();
  expect(screen.getByLabelText("Recorded read · data").getAttribute("title")).toBe("Recorded read · data");
});
it("retains separate curves and labels for parallel kinds and attributions", () => {
  render(<><RecordedRelationshipEdge {...props} data={{ ...props.data, parallelIndex: 0, parallelCount: 2 }} />
    <RecordedRelationshipEdge {...props} id="control" label="Recorded control · control" data={{ relationship: { attribution: "recorded-control", kind: "control", direction: "backward" }, parallelIndex: 1, parallelCount: 2 }} /></>);
  expect(screen.getByTestId("link").getAttribute("data-path")).not.toBe(screen.getByTestId("control").getAttribute("data-path"));
  expect(screen.getByText("Read").getAttribute("style")).not.toBe(screen.getByText("Rule").getAttribute("style"));
});
