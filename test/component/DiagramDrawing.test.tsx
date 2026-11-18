/** @vitest-environment jsdom */
import { memo } from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import { ReactFlow } from "@xyflow/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DiagramDrawingProvider, getDiagramNodeGeometry, prepareDiagramGeometry } from "../../src/components/DiagramDrawing";
import type { DiagramDrawingProps, DiagramGeometry, DiagramNodeGeometry } from "../../src/components/DiagramDrawing";
import type { TraceGraph } from "../../src/components/FlowchartView/traceStructureRecorder";
import { DefaultStageNode, RendererContext } from "../../src/components/IsometricFlow/RendererContext";
import { RendererGeometry } from "../../src/components/IsometricFlow/RendererGeometry";

const refresh = vi.hoisted(() => vi.fn());
vi.mock("@xyflow/react", async (original) => ({ ...await original<typeof import("@xyflow/react")>(),
  useUpdateNodeInternals: () => refresh,
}));
beforeEach(() => {
  refresh.mockClear();
  vi.stubGlobal("requestAnimationFrame", () => 0);
  vi.stubGlobal("cancelAnimationFrame", () => {});
  vi.stubGlobal("DOMMatrixReadOnly", class {});
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const shape: DiagramNodeGeometry = { width: 200, height: 96, source: { x: 181, y: 52 }, target: { x: 21, y: 6 }, drawing: "device" };
const definition: DiagramGeometry = { nodes: { job: shape } };
const graph: TraceGraph = { nodes: [{ id: "job", type: "stage", position: { x: 0, y: 0 }, data: {
  label: "Deploy", isDecider: false, isFork: false, isSubflow: false, isStreaming: false, prevIds: [], nextIds: [],
} }], edges: [] };
const nodeTypes = { stageNode: DefaultStageNode };
const drawings = { device: memo(function Device({ id, renderer, geometry, data }: DiagramDrawingProps) {
  return <svg data-testid="drawing" data-mode={renderer} data-object={id} width={geometry.width} height={geometry.height}
    data-activity={data.diagramAppearance?.activity} />;
}) };
function view(renderer: "flat" | "isometric", geometry: DiagramGeometry = definition) {
  const nodes = prepareDiagramGeometry(graph, geometry).nodes.map(node => ({ ...node, type: "stageNode",
    data: { ...node.data, active: true, traceContext: "displayed", traceWorkflow: { role: "question", color: "blue", values: [] } },
  }));
  return <DiagramDrawingProvider geometry={geometry} drawings={drawings}><RendererContext.Provider value={renderer}>
    <ReactFlow nodes={nodes} nodeTypes={nodeTypes} edges={[]}><RendererGeometry renderer={renderer} nodeIds={["job"]}/></ReactFlow>
  </RendererContext.Provider></DiagramDrawingProvider>;
}

describe("diagram drawing geometry", () => {
  it("uses exact IDs and one consistent footprint without changing the host graph or container bounds", () => {
    const input = { nodes: [...graph.nodes, { ...graph.nodes[0], id: "other/job" },
      { ...graph.nodes[0], id: "box", type: "groupContainer", style: { width: 600, height: 400 } }], edges: graph.edges };
    const result = prepareDiagramGeometry(input, { nodes: { job: shape, box: shape } });
    expect(result.nodes[0].style).toEqual({ width: 200, height: 96 });
    expect(result.nodes[0].data).toBe(input.nodes[0].data);
    expect(result.nodes[1]).toBe(input.nodes[1]);
    expect(result.nodes[2]).toBe(input.nodes[2]);
    expect(result.edges).toBe(input.edges);
    expect(input.nodes[0].style).toBeUndefined();
    expect(prepareDiagramGeometry(result, definition)).toBe(result);
  });

  it("overrides earlier SSR dimensions even when existing style already matches", () => {
    const initial = { ...graph.nodes[0], width: 80, height: 40, initialWidth: 70, initialHeight: 30,
      style: { width: shape.width, height: shape.height } };
    const sized = prepareDiagramGeometry({ nodes: [initial], edges: [] }, definition).nodes[0];
    expect(sized).toMatchObject({ width: shape.width, height: shape.height, style: initial.style });
    expect(initial.width).toBe(80);
  });

  it("uses stock geometry for unknown IDs, inherited registry entries, getters and invalid ports", () => {
    const getter = vi.fn(() => shape);
    const nodes = Object.create({ inherited: shape });
    Object.defineProperty(nodes, "getter", { get: getter });
    nodes.bad = { ...shape, source: { x: Infinity, y: 0 } };
    nodes.outside = { ...shape, width: 0 };
    nodes.below = { ...shape, target: { x: 0, y: 120 } };
    for (const id of ["absent", "constructor", "__proto__", "inherited", "getter", "bad", "outside", "below"])
      expect(getDiagramNodeGeometry({ nodes }, id)).toBeUndefined();
    expect(getter).not.toHaveBeenCalled();
  });

  it.each(["flat", "isometric"] as const)("renders trusted %s artwork, actual ports, labels and evidence", renderer => {
    const { container, rerender } = render(view(renderer));
    const stage = container.querySelector<HTMLElement>('.react-flow__node[data-id="job"]')!;
    const drawing = within(stage).getByTestId("drawing");
    expect(drawing.getAttribute("data-mode")).toBe(renderer);
    expect(drawing.getAttribute("data-object")).toBe("job");
    expect(stage.style.width).toBe("200px");
    expect(stage.style.height).toBe("96px");
    expect(stage.querySelectorAll(".react-flow__handle")).toHaveLength(2);
    expect(stage.querySelector<HTMLElement>(".source")!.style.left).toBe("181px");
    expect(stage.querySelector<HTMLElement>(".target")!.style.top).toBe("6px");
    expect(within(stage).getByText("Deploy")).toBeTruthy();
    expect(within(stage).getByText("VIEWING")).toBeTruthy();
    expect(within(stage).getByText("Question")).toBeTruthy();
    refresh.mockClear();
    const moved = { nodes: { job: { ...shape, source: { x: 162, y: 22 } } } };
    rerender(view(renderer, moved));
    expect(refresh).toHaveBeenCalledWith(["job"]);
    expect(stage.querySelector<HTMLElement>(".source")!.style.left).toBe("162px");
    refresh.mockClear();
    rerender(view(renderer, { nodes: { job: { ...moved.nodes.job } } }));
    expect(refresh).not.toHaveBeenCalled();
    rerender(view(renderer, { nodes: { job: { ...shape, drawing: "missing" } } }));
    expect(screen.queryByTestId("drawing")).toBeNull();
    if (renderer === "flat") {
      const body = stage.querySelector<HTMLElement>('[data-fp="stage-node-body"]')!;
      expect(body.style.width).toBe("100%");
      expect(body.style.height).toBe("100%");
    }
    expect(within(stage).getByText("Deploy")).toBeTruthy();
    expect(stage.querySelectorAll(".react-flow__handle")).toHaveLength(2);
  });
});
