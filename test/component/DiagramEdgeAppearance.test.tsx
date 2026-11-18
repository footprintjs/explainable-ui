/** @vitest-environment jsdom */
import { cleanup, render } from "@testing-library/react";
import { Position, type EdgeProps, type ReactFlowState } from "@xyflow/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DiagramEdgeAppearance, diagramNativeEdgeTypes, type DiagramObjectAppearance } from "../../src/components/DiagramAppearance";
import { DiagramDrawingProvider, type DiagramGeometry } from "../../src/components/DiagramDrawing";
import { RecordedReadEdge } from "../../src/components/FlowchartView/RecordedReadEdge";
import { recordedReadGeometry } from "../../src/components/FlowchartView/_internal/recordedReadGeometry";
import { traceWorkflowPaintBounds } from "../../src/components/FlowchartView/_internal/traceWorkflowProjection";
import { SmartStepEdge } from "../../src/components/SmartStepEdge/SmartStepEdge";
import { LoopBackEdge } from "../../src/components/LoopBackEdge/LoopBackEdge";
import { IsometricEdge } from "../../src/components/IsometricFlow/IsometricEdge";

function node(id: string, x: number, y: number) {
  return { id, type: "stage", data: {}, measured: { width: 100, height: 40 }, internals: { positionAbsolute: { x, y } } };
}
const nodes = new Map([["a", node("a", 5, 25)], ["b", node("b", 70, 155)]]);
vi.mock("@xyflow/react", async original => ({
  ...await original<typeof import("@xyflow/react")>(),
  useStore: (select: (state: ReactFlowState) => unknown) => select({ nodeLookup: nodes, edges: [] } as unknown as ReactFlowState),
  EdgeLabelRenderer: () => null,
}));
const originalBox = Object.getOwnPropertyDescriptor(SVGElement.prototype, "getBBox");
beforeEach(() => {
  // jsdom has no SVG layout. Native EdgeText only needs a measured label box.
  Object.defineProperty(SVGElement.prototype, "getBBox", { configurable: true, value: () => ({ x: 0, y: 0, width: 60, height: 12 }) });
});
afterEach(() => {
  cleanup();
  if (originalBox) Object.defineProperty(SVGElement.prototype, "getBBox", originalBox);
  else Reflect.deleteProperty(SVGElement.prototype, "getBBox");
});

const props: EdgeProps = {
  id: "route", source: "a", target: "b", sourceX: 13, sourceY: 29, targetX: 161, targetY: 173,
  sourcePosition: Position.Right, targetPosition: Position.Left, markerStart: "url(#from)", markerEnd: "url(#to)",
  pathOptions: { curvature: 0.7, borderRadius: 8, offset: 12, stepPosition: 0.71 },
  style: { stroke: "#778899" }, interactionWidth: 31, label: "Route label", type: "straight",
  animated: false, selected: false, selectable: true, deletable: true,
};
const geometry: DiagramGeometry = { nodes: {
  a: { width: 100, height: 40, source: { x: 8, y: 4 }, target: { x: 0, y: 0 } },
  b: { width: 100, height: 40, source: { x: 99, y: 0 }, target: { x: 91, y: 18 } },
} };

describe("diagram edge appearance", () => {
  it.each(Object.entries({ ...diagramNativeEdgeTypes, smartStep: SmartStepEdge, loopBack: LoopBackEdge,
    isometric: IsometricEdge, recordedRead: RecordedReadEdge }))("annotates the actual %s path, retaining its arrow and hit geometry", (name, Edge) => {
    const view = (appearance?: DiagramObjectAppearance) =>
      <svg><DiagramDrawingProvider geometry={geometry}><Edge {...props} type={name} data={{ key: "runs",
        sourceRuntimeStageId: "a#0", targetRuntimeStageId: "b#0", diagramAppearance: appearance }} /></DiagramDrawingProvider></svg>;
    const { container, rerender, getByRole } = render(view());
    const base = container.querySelector(".react-flow__edge-path")!;
    const path = base.getAttribute("d");
    expect(path).toBeTruthy();
    expect(base.getAttribute("marker-end")).toBe("url(#to)");
    expect(container.querySelector('[data-fp="diagram-edge-appearance"]')).toBeNull();
    const hit = container.querySelector(".react-flow__edge-interaction");
    if (name in diagramNativeEdgeTypes) {
      expect(base.getAttribute("id")).toBeNull();
      expect(base.getAttribute("marker-start")).toBe("url(#from)");
      expect(hit?.getAttribute("stroke-width")).toBe("31");
      expect(container.textContent).toContain("Route label");
    }
    if (name === "loopBack") {
      expect(path).toMatch(/^M 13,29 L .* Q .* L 161,173$/);
    } else if (name === "recordedRead") {
      expect(path).toMatch(/^M 13 29 C .*, 161 173$/);
    }
    rerender(view({ activity: "removing", progress: { completed: 2, total: 5, unit: "items" } }));
    const overlay = getByRole("img", { name: "Removing · 2 of 5 items" });
    expect(overlay.getAttribute("pointer-events")).toBe("none");
    expect(overlay.querySelector("path")?.getAttribute("d")).toBe(path);
    expect(overlay.querySelector("path")?.getAttribute("stroke-dasharray")).toBe("0.4 1");
    expect(overlay.querySelector("textPath")?.getAttribute("href")).toBe("#" + overlay.querySelector("path")?.id);
    expect(container.querySelector(".react-flow__edge-path")).toBe(base);
    expect(container.querySelector(".react-flow__edge-interaction")).toBe(hit);
    rerender(view());
    expect(container.querySelector(".react-flow__edge-path")).toBe(base);
    expect(container.querySelector('[data-fp="diagram-edge-appearance"]')).toBeNull();
  });

  it("uses a static mark for unmeasured activity and keeps a known zero distinct", () => {
    const view = (appearance?: DiagramObjectAppearance) => <svg><DiagramEdgeAppearance path="M0 0L10 0" appearance={appearance}>
      <path d="M0 0L10 0" data-testid="drawing"/>
    </DiagramEdgeAppearance></svg>;
    const { container, getByRole, rerender, getByTestId } = render(view({ activity: "creating" }));
    const drawing = getByTestId("drawing");
    const accent = getByRole("img", { name: "Creating" }).querySelector("path");
    expect(accent?.getAttribute("pathLength")).toBeNull();
    rerender(view({ activity: "creating", progress: { completed: 0, total: 4 } }));
    expect(accent?.getAttribute("stroke")).toBe("none");
    expect(accent?.getAttribute("pathLength")).toBe("1");
    rerender(view({ presence: "removed", health: "offline" }));
    expect(getByRole("img", { name: "Removed · Health · offline" })).toBeTruthy();
    expect(container.querySelector("style")?.nextElementSibling).toBe(drawing);
    rerender(view());
    expect(container.querySelector("svg")!.children).toHaveLength(1);
  });

  it("keeps default left-side ports for ordinary evidence and sizes Backtrack to the read's actual custom route", () => {
    expect(recordedReadGeometry(nodes, "a", "b", 0)?.path).toMatch(/^M 5 45 C .*, 70 175$/);
    const route = recordedReadGeometry(nodes, "a", "b", 0, geometry)!;
    expect(traceWorkflowPaintBounds(nodes, [], [{ source: "a", target: "b" }], geometry)).toEqual(route.bounds);
    const grouped = new Map(nodes).set("a", { ...nodes.get("a")!, type: "groupContainer" });
    expect(recordedReadGeometry(grouped, "a", "b", 0, geometry)?.path).toMatch(/^M 5 45 C .*, 161 173$/);
  });
});
