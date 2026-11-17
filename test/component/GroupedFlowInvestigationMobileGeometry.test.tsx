/** @vitest-environment jsdom */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { GroupedFlowInvestigation } from "../../src/components/GroupedFlowInvestigation/GroupedFlowInvestigation";
import { chartFitViewport } from "../../src/components/FlowchartView/_internal/chartFitGeometry";

// Real investigation, layout, relationship routing and camera intent. jsdom has
// no physical layout; only the canvas/xyflow measurement door is doubled here.
const latest = vi.hoisted(() => ({ nodes: [] as any[], edges: [] as any[], fit: undefined as any }));
vi.mock("@xyflow/react", async original => ({ ...await original<typeof import("@xyflow/react")>(),
  ReactFlow: ({ nodes, edges, nodeTypes, children }: any) => {
    latest.nodes = nodes; latest.edges = edges;
    return <div>{nodes.map((node: any) => {
      const Component = nodeTypes[node.type]; return <Component {...node} key={node.id} />;
    })}{children}</div>;
  }, Handle: () => null, Background: () => null, Controls: () => null,
}));
vi.mock("../../src/components/FlowchartView/_internal/useChartAutoRefit", () => ({
  ChartAutoRefit: (props: any) => { latest.fit = props; return null; },
}));
const originalWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientWidth");
afterEach(() => {
  if (originalWidth) Object.defineProperty(HTMLElement.prototype, "clientWidth", originalWidth);
  else delete (HTMLElement.prototype as any).clientWidth;
});

function fixture(attribution: "recorded-read" | "recorded-write", path = false) {
  const definition = { nodes: [{ id: "batch", label: "Batch", kind: "group" as const },
    { id: "effect", label: "Failure", parentId: "batch" },
    ...(path ? [{ id: "middle", label: "Recorded middle", parentId: "batch" }] : []), { id: "source", label: "Source", parentId: "batch" },
    { id: "other", label: "Unrelated item", parentId: "batch" }], edges: [] };
  const evidence = { from: "effect", to: path ? "middle" : "source", kind: "data" as const, attribution, evidence: ["proof:read"] };
  const explain = vi.fn(async () => ({ nodeId: "effect", rootCause: "source", path: path ? ["effect", "middle", "source"] : ["effect", "source"], attention: [], alternatives: [],
    confidence: "complete" as const, gaps: [], backward: { nodes: path ? ["effect", "middle", "source"] : ["effect", "source"], edges: [evidence, ...(path ? [{ ...evidence, from: "middle", to: "source" }] : [])], confidence: "complete" as const, gaps: [] },
    impact: { nodes: ["other"], edges: [{ ...evidence, from: "effect", to: "other" }], confidence: "complete" as const, gaps: [] } }));
  return { definition, observation: { nodeStates: { effect: "failed" as const, source: "completed" as const } },
    port: { binding: {}, attention: { nodes: [], confidence: "complete" as const, gaps: [] }, explain } };
}
const canvas = () => document.querySelector<HTMLElement>("[data-camera-focus]")!;
const targets = () => latest.fit.focusNodeIds as string[];
function geometry(width: number, height: number) {
  const byId = new Map(latest.nodes.map(node => [node.id, node]));
  const absolute = (node: any): { x: number; y: number } => {
    const parent = node.parentId ? absolute(byId.get(node.parentId)) : { x: 0, y: 0 };
    return { x: parent.x + node.position.x, y: parent.y + node.position.y };
  };
  const measured = new Map(latest.nodes.map(node => [node.id, {
    measured: { width: node.width, height: node.height }, internals: { positionAbsolute: absolute(node) },
  }]));
  const chosen = new Map(targets().map(id => [id, measured.get(id)!]));
  const viewport = chartFitViewport({ width, height, minZoom: .1, maxZoom: 1, nodeLookup: chosen,
    visualBounds: latest.fit.visualBounds }, latest.fit.padding)!;
  expect(viewport).not.toBeNull();
  const contains = (box: { x: number; y: number; width: number; height: number }) => {
    expect(box.x * viewport.zoom + viewport.x).toBeGreaterThanOrEqual(-.01);
    expect(box.y * viewport.zoom + viewport.y).toBeGreaterThanOrEqual(-.01);
    expect((box.x + box.width) * viewport.zoom + viewport.x).toBeLessThanOrEqual(width + .01);
    expect((box.y + box.height) * viewport.zoom + viewport.y).toBeLessThanOrEqual(height + .01);
  };
  return { byId, absolute, contains };
}

it.each([
  { width: 253, direction: "TB" as const, attribution: "recorded-read" as const },
  { width: 253, direction: "TB" as const, attribution: "recorded-write" as const },
  { width: 320, direction: "LR" as const, attribution: "recorded-read" as const },
  { width: 320, direction: "LR" as const, attribution: "recorded-write" as const },
])("fits selected effect, supported source and $attribution paint inside a $width px $direction canvas", async ({ width, direction, attribution }) => {
  Object.defineProperty(HTMLElement.prototype, "clientWidth", { configurable: true, get: () => width });
  const source = fixture(attribution);
  render(<GroupedFlowInvestigation {...source} direction={direction} />);
  fireEvent.click(screen.getByRole("button", { name: "Expand Batch" }));
  fireEvent.click(screen.getByRole("button", { name: /^Select Failure/ }));
  await screen.findByText("Supported cause");
  await waitFor(() => expect(targets()).toContain("source"));
  const { byId, absolute, contains } = geometry(width, 350);
  for (const id of ["effect", "source"]) {
    const node = byId.get(id)!;
    contains({ ...absolute(node), width: node.width, height: node.height });
  }
  const relationship = latest.edges.find(edge => edge.data?.relationship?.attribution === attribution);
  expect(relationship).toBeTruthy();
  for (const point of relationship.data.route.points) contains({ x: point.x - 2, y: point.y - 2, width: 4, height: 4 });
  const label = relationship.data.route.label;
  contains({ x: label.x - label.width / 2 - 6, y: label.y - label.height / 2 - 6,
    width: label.width + 12, height: label.height + 12 });
  expect(new Set(targets())).toEqual(new Set(["effect", "source"]));
  fireEvent.click(screen.getByRole("button", { name: "Back to selected item" }));
  await waitFor(() => expect(targets()).toEqual(["effect"]));
  fireEvent.click(screen.getByRole("button", { name: "Fit recorded view" }));
  await waitFor(() => expect(new Set(targets())).toEqual(new Set(["effect", "source"])));
  expect(source.port.explain).toHaveBeenCalledTimes(1);
  expect(canvas().getAttribute("data-investigation-focus")).toBe("true");
});


it("fits a returned intermediate path and all its routed captions without fitting unrelated group contents", async () => {
  Object.defineProperty(HTMLElement.prototype, "clientWidth", { configurable: true, get: () => 253 });
  const source = fixture("recorded-read", true); render(<GroupedFlowInvestigation {...source} direction="TB" />);
  fireEvent.click(screen.getByRole("button", { name: "Expand Batch" }));
  fireEvent.click(screen.getByRole("button", { name: /^Select Failure/ }));
  await screen.findByText("Supported cause");
  await waitFor(() => expect(new Set(targets())).toEqual(new Set(["effect", "middle", "source"])));
  const { byId, absolute, contains } = geometry(253, 350);
  for (const id of ["effect", "middle", "source"]) {
    const node = byId.get(id)!; contains({ ...absolute(node), width: node.width, height: node.height });
  }
  const relationships = latest.edges.filter(edge => edge.data?.relationship);
  expect(relationships).toHaveLength(2);
  for (const relationship of relationships) {
    for (const point of relationship.data.route.points) contains({ x: point.x - 2, y: point.y - 2, width: 4, height: 4 });
    const label = relationship.data.route.label;
    contains({ x: label.x - label.width / 2 - 6, y: label.y - label.height / 2 - 6, width: label.width + 12, height: label.height + 12 });
  }
  expect(source.port.explain).toHaveBeenCalledTimes(1);
});

it("fits the selected item and returned impact with its caption without another query", async () => {
  Object.defineProperty(HTMLElement.prototype, "clientWidth", { configurable: true, get: () => 253 });
  const source = fixture("recorded-write"); render(<GroupedFlowInvestigation {...source} direction="TB" />);
  fireEvent.click(screen.getByRole("button", { name: "Expand Batch" }));
  fireEvent.click(screen.getByRole("button", { name: /^Select Failure/ })); await screen.findByText("Supported cause");
  fireEvent.click(screen.getByRole("button", { name: "What it affected" }));
  await waitFor(() => expect(new Set(targets())).toEqual(new Set(["effect", "other"])));
  const { byId, absolute, contains } = geometry(253, 350);
  for (const id of ["effect", "other"]) { const node = byId.get(id)!; contains({ ...absolute(node), width: node.width, height: node.height }); }
  const relationship = latest.edges.find(edge => edge.data?.relationship?.direction === "forward");
  expect(relationship).toBeTruthy();
  const label = relationship.data.route.label;
  contains({ x: label.x - label.width / 2 - 6, y: label.y - label.height / 2 - 6, width: label.width + 12, height: label.height + 12 });
  expect(screen.queryByText("Supported cause")).toBeNull(); expect(source.port.explain).toHaveBeenCalledTimes(1);
});
