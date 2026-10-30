/** @vitest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { Position } from "@xyflow/react";
import { RecordedRelationshipEdge } from "../../src/components/GroupedFlowDiagram/RecordedRelationshipEdge";
import { RecordedFocusContext } from "../../src/components/GroupedFlowDiagram/presentation";
vi.mock("@xyflow/react", async original => ({ ...await original<typeof import("@xyflow/react")>(),
  BaseEdge: (props: any) => <output data-testid={props.id} data-path={props.path} />,
  EdgeLabelRenderer: ({ children }: any) => children,
}));
const route = { points: [{ x: 400, y: 80 }, { x: 382, y: 80 }, { x: 382, y: 16 }, { x: 118, y: 16 }, { x: 118, y: 80 }, { x: 100, y: 80 }],
  label: { x: 250, y: 16, width: 48, height: 22 }, sourceSide: "left", targetSide: "right" };
const props = { id: "link", sourceX: 400, sourceY: 80, targetX: 100, targetY: 80, sourcePosition: Position.Left, targetPosition: Position.Right, label: "Recorded read · data", data: { route, relationship: { attribution: "recorded-read", kind: "data", direction: "backward" } } } as any;
it("routes from the actual handles rather than assuming execution direction", () => {
  render(<RecordedRelationshipEdge {...props} />);
  const path = screen.getByTestId("link").getAttribute("data-path")!;
  const firstLeg = path.match(/^M400,80 L([\d.]+),80/);
  expect(firstLeg).toBeTruthy(); expect(Number(firstLeg![1])).toBeLessThan(400); expect(Number(firstLeg![1])).toBeGreaterThan(382);
  expect(path.endsWith("100,80")).toBe(true); expect(path).toContain("Q");
  expect(screen.getByText("Read")).toBeTruthy();
  expect(screen.getByLabelText("Recorded read · data").getAttribute("title")).toBe("Recorded read · data");
});
it("retains separate curves and labels for parallel kinds and attributions", () => {
  const otherRoute = { ...route, points: route.points.map(p => p.y === 16 ? { ...p, y: -4 } : p), label: { ...route.label, y: -4 } };
  render(<><RecordedRelationshipEdge {...props} />
    <RecordedRelationshipEdge {...props} id="control" label="Recorded control · control" data={{ route: otherRoute, relationship: { attribution: "recorded-control", kind: "control", direction: "backward" } }} /></>);
  expect(screen.getByTestId("link").getAttribute("data-path")).not.toBe(screen.getByTestId("control").getAttribute("data-path"));
  expect(screen.getByText("Read").getAttribute("style")).not.toBe(screen.getByText("Rule").getAttribute("style"));
});

it("honors the obstacle-aware route and the actual handle pixels instead of drawing its old cubic through a card", () => {
  const route = { points: [{ x: 600, y: 180 }, { x: 584, y: 180 }, { x: 584, y: 40 }, { x: 116, y: 40 }, { x: 116, y: 180 }, { x: 100, y: 180 }],
    label: { x: 350, y: 40, width: 44, height: 24 }, sourceSide: "left", targetSide: "right" };
  render(<RecordedRelationshipEdge {...props} sourceX={601} targetX={99} sourceY={180} targetY={180} data={{ ...props.data, route }} />);
  const path = screen.getByTestId("link").getAttribute("data-path")!;
  expect(path.startsWith("M601,180")).toBe(true); expect(path.endsWith("99,180")).toBe(true);
  expect(path).toContain("40"); expect(path).toContain("Q"); expect(path).not.toContain(" C");
  expect(screen.getByText("Read").style.transform).toContain("350px,40px");
});

it("keeps routine Data metadata accessible while showing its caption only on hover or in whole-flow context", () => {
  const data = { ...props.data, relationship: { ...props.data.relationship, attribution: "per-write" } }, label = "Per-write link · data";
  const view = render(<RecordedFocusContext.Provider value={{ focused: true }}><RecordedRelationshipEdge {...props} label={label} data={data} /></RecordedFocusContext.Provider>);
  const caption = screen.getByLabelText(label), path = screen.getByTestId("link").getAttribute("data-path");
  expect(caption.style.opacity).toBe("0"); expect(caption.getAttribute("title")).toBe(label);
  const connection = document.querySelector('[data-recorded-connection="link"]')!;
  fireEvent.mouseEnter(connection); expect(caption.style.opacity).toBe("1");
  fireEvent.mouseLeave(connection); expect(caption.style.opacity).toBe("0");
  view.rerender(<RecordedFocusContext.Provider value={{ focused: false }}><RecordedRelationshipEdge {...props} label={label} data={data} /></RecordedFocusContext.Provider>);
  expect(caption.style.opacity).toBe("1"); expect(screen.getByTestId("link").getAttribute("data-path")).toBe(path);
});
