import { describe, expect, it } from "vitest";
import {
  applyGroupLayout,
  GROUP_CONTAINER_NODE_TYPE,
  wrapInMainChartBox,
  type TraceGraph,
  type TraceNode,
} from "footprint-explainable-ui/flowchart";
import recordings from "../../examples/local-playground/recordings.json";
import {
  ISOMETRIC_NODE_HEIGHT,
  ISOMETRIC_NODE_WIDTH,
  isometricTraceLayout as isometricLayout,
  createIsometricTraceLayout,
} from "../../src/components/FlowchartView/_internal/isometricTraceLayout";

const scenarios = recordings.scenarios as unknown as { id: string; traceGraph: TraceGraph }[];

function freeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

function size(node: TraceNode): { width: number; height: number } {
  return { width: node.style!.width as number, height: node.style!.height as number };
}

function expectFinite(graph: TraceGraph): void {
  for (const node of graph.nodes) {
    expect(Number.isFinite(node.position.x), `${node.id} x`).toBe(true);
    expect(Number.isFinite(node.position.y), `${node.id} y`).toBe(true);
    expect(node.position.x, `${node.id} x`).toBeGreaterThanOrEqual(0);
    expect(node.position.y, `${node.id} y`).toBeGreaterThanOrEqual(0);
    expect(size(node).width).toBeGreaterThan(0);
    expect(size(node).height).toBeGreaterThan(0);
  }
}

function expectNoSiblingOverlap(graph: TraceGraph): void {
  for (let i = 0; i < graph.nodes.length; i++) {
    for (let j = i + 1; j < graph.nodes.length; j++) {
      const a = graph.nodes[i], b = graph.nodes[j];
      // A frame intentionally contains its descendants. Compare only nodes
      // whose positions use the same parent coordinate system.
      if (a.parentId !== b.parentId) continue;
      const aw = size(a).width, ah = size(a).height;
      const bw = size(b).width, bh = size(b).height;
      const overlapX = Math.min(a.position.x + aw, b.position.x + bw) - Math.max(a.position.x, b.position.x);
      const overlapY = Math.min(a.position.y + ah, b.position.y + bh) - Math.max(a.position.y, b.position.y);
      expect(overlapX <= 0.001 || overlapY <= 0.001, `${a.id} overlaps ${b.id}`).toBe(true);
    }
  }
}

function expectContained(graph: TraceGraph): void {
  const byId = new Map(graph.nodes.map(node => [node.id, node]));
  for (const node of graph.nodes) {
    if (!node.parentId) continue;
    const parent = byId.get(node.parentId)!;
    expect(parent, `${node.id} parent`).toBeDefined();
    expect(node.position.x + size(node).width).toBeLessThanOrEqual(size(parent).width + 0.001);
    expect(node.position.y + size(node).height).toBeLessThanOrEqual(size(parent).height + 0.001);
    expect(graph.nodes.indexOf(parent)).toBeLessThan(graph.nodes.indexOf(node));
  }
}

describe("built-in isometric layout", () => {
  it("returns an empty graph unchanged", () => {
    const graph: TraceGraph = { nodes: [], edges: [] };
    expect(isometricLayout(graph)).toBe(graph);
  });

  it.each(scenarios)("keeps $id deterministic, immutable and clear of card overlaps", ({ traceGraph }) => {
    const graph = freeze(structuredClone(traceGraph));
    const before = JSON.stringify(graph);
    const result = isometricLayout(graph);
    expect(isometricLayout(graph)).toEqual(result);
    expect(JSON.stringify(graph)).toBe(before);
    expect(result.edges).toBe(graph.edges);
    expect(result.nodes.map(node => node.id)).toEqual(graph.nodes.map(node => node.id));
    for (let i = 0; i < result.nodes.length; i++) {
      expect(result.nodes[i].data).toBe(graph.nodes[i].data);
      expect(result.nodes[i].parentId).toBe(graph.nodes[i].parentId);
      expect(size(result.nodes[i])).toEqual({ width: ISOMETRIC_NODE_WIDTH, height: ISOMETRIC_NODE_HEIGHT });
    }
    expectFinite(result);
    expectNoSiblingOverlap(result);
  });

  it("places a linear workflow along the 30-degree reading direction", () => {
    const graph = scenarios.find(scenario => scenario.id === "linear")!.traceGraph;
    const result = isometricLayout(graph);
    for (let i = 1; i < result.nodes.length; i++) {
      const a = result.nodes[i - 1], b = result.nodes[i];
      const dx = b.position.x - a.position.x, dy = b.position.y - a.position.y;
      expect(dx).toBeGreaterThan(0);
      expect(dy).toBeGreaterThan(0);
      expect(Math.atan2(dy, dx) * 180 / Math.PI).toBeCloseTo(30, 5);
    }
  });

  it("honors an existing group footprint and its already-local child positions", () => {
    const template = scenarios[0].traceGraph.nodes[0];
    const graph = freeze({
      nodes: [
        { ...template, id: "frame", type: GROUP_CONTAINER_NODE_TYPE, position: { x: 5, y: 7 },
          style: { width: 720, height: 440, opacity: 0.8 }, data: { ...template.data, isGroupContainer: true } },
        { ...template, id: "child", parentId: "frame", extent: "parent" as const, position: { x: 32, y: 70 },
          style: { background: "transparent" } },
        { ...template, id: "next", position: { x: 0, y: 0 } },
      ],
      edges: [{ id: "frame-next", source: "frame", target: "next", data: { kind: "next" as const } }],
    } as TraceGraph);
    const result = isometricLayout(graph);
    expect(size(result.nodes[0])).toEqual({ width: 720, height: 440 });
    expect(result.nodes[0].style?.opacity).toBe(0.8);
    expect(result.nodes[1].position).toEqual({ x: 32, y: 70 });
    expect(result.nodes[1].parentId).toBe("frame");
    expect(result.nodes[1].extent).toBe("parent");
    expect(result.nodes[1].style?.background).toBe("transparent");
    expect(result.nodes[1].data).toBe(graph.nodes[1].data);
    expect(result.edges).toBe(graph.edges);
    expectFinite(result);
    expectContained(result);
    expectNoSiblingOverlap(result);
  });

  it.each([
    { scope: null, groups: ["first"] },
    { scope: null, groups: ["first", "second", "pipeline"] },
    { scope: "pipeline", groups: ["pipeline/prepare"] },
  ])("sizes and places native groups without overlaps at $scope: $groups", ({ scope, groups }) => {
    const original = scenarios.find(scenario => scenario.id === "subflows")!.traceGraph;
    const visibleScopes = new Set<string | undefined>([scope ?? undefined, ...groups]);
    const nodes = original.nodes.filter(node => visibleScopes.has(node.data.subflowOf)).map(node =>
      node.data.isSubflow ? { ...node, data: { ...node.data, subflowId: node.id } } : node);
    const ids = new Set(nodes.map(node => node.id));
    const graph = freeze({ nodes, edges: original.edges.filter(edge => ids.has(edge.source) && ids.has(edge.target)) });
    const before = JSON.stringify(graph);
    const result = applyGroupLayout(graph, { groupedSubflowIds: groups, baseLayout: isometricLayout });
    expect(JSON.stringify(graph)).toBe(before);
    expect(result.edges).toBe(graph.edges);
    for (const groupId of groups) {
      const container = result.nodes.find(node => node.id === groupId)!;
      expect(container.type).toBe(GROUP_CONTAINER_NODE_TYPE);
      expect(size(container).width).toBeGreaterThan(ISOMETRIC_NODE_WIDTH);
      expect(size(container).height).toBeGreaterThan(ISOMETRIC_NODE_HEIGHT);
      expect(result.nodes.some(node => node.parentId === groupId)).toBe(true);
    }
    expectFinite(result);
    expectContained(result);
    expectNoSiblingOverlap(result);

    const wrapped = wrapInMainChartBox(result, { baseLayout: graph => graph, label: "Recorded workflow" });
    expectFinite(wrapped);
    expectContained(wrapped);
    expectNoSiblingOverlap(wrapped);
    const repositioned = isometricLayout(freeze(wrapped));
    expectContained(repositioned);
    for (const node of wrapped.nodes.filter(node => node.parentId)) {
      expect(repositioned.nodes.find(candidate => candidate.id === node.id)!.position).toEqual(node.position);
    }
  });

  it("keeps custom node styles and intrinsic dimensions while using measured footprints only for placement", () => {
    const template = scenarios[0].traceGraph.nodes[0];
    const graph = freeze({
      nodes: [
        { ...template, id: "measured", type: "custom", style: { width: "auto", color: "red" } },
        { ...template, id: "intrinsic", type: "custom", style: undefined, width: 350, height: 200 },
        { ...template, id: "styled", type: "custom", style: { width: 95, height: 45 } },
      ],
      edges: [
        { id: "a", source: "measured", target: "intrinsic", data: { kind: "next" as const } },
        { id: "b", source: "intrinsic", target: "styled", data: { kind: "next" as const } },
      ],
    } as TraceGraph);
    let calls = 0;
    const result = createIsometricTraceLayout({ nodeSize: node => {
      calls++;
      return node.id === "measured" ? { width: 420, height: 160 } : undefined;
    } })(graph);
    expect(calls).toBe(3);
    for (let i = 0; i < result.nodes.length; i++) {
      expect(result.nodes[i].style).toBe(graph.nodes[i].style);
      expect(result.nodes[i].width).toBe(graph.nodes[i].width);
      expect(result.nodes[i].height).toBe(graph.nodes[i].height);
      expect(result.nodes[i].data).toBe(graph.nodes[i].data);
    }
    const footprints = [{ width: 420, height: 160 }, { width: 350, height: 200 }, { width: 95, height: 45 }];
    for (let i = 0; i < result.nodes.length; i++) for (let j = i + 1; j < result.nodes.length; j++) {
      const a = result.nodes[i], b = result.nodes[j];
      expect(a.position.x + footprints[i].width <= b.position.x || b.position.x + footprints[j].width <= a.position.x ||
        a.position.y + footprints[i].height <= b.position.y || b.position.y + footprints[j].height <= a.position.y).toBe(true);
    }
  });

  it("keeps replacement stage cards measurable and responds to later measurement changes", () => {
    const template = scenarios[0].traceGraph.nodes[0];
    const graph = freeze({ nodes: [
      { ...template, id: "a", type: "stage", style: undefined },
      { ...template, id: "b", type: undefined, style: { color: "red" } },
    ], edges: [{ id: "ab", source: "a", target: "b", data: { kind: "next" as const } }] } as TraceGraph);
    const measured = new Map<string, { width: number; height: number }>();
    const layout = createIsometricTraceLayout({ fixedStageNodes: false, nodeSize: node => measured.get(node.id) });
    const initial = layout(graph);
    measured.set("a", { width: 500, height: 150 });
    measured.set("b", { width: 320, height: 240 });
    const resized = layout(graph);
    expect(resized.nodes.map(node => node.position)).not.toEqual(initial.nodes.map(node => node.position));
    for (let i = 0; i < resized.nodes.length; i++) {
      expect(resized.nodes[i].style).toBe(graph.nodes[i].style);
      expect(resized.nodes[i].style?.width).toBeUndefined();
      expect(resized.nodes[i].style?.height).toBeUndefined();
      expect(resized.nodes[i].measured).toBe(graph.nodes[i].measured);
    }
    const [a, b] = resized.nodes;
    expect(a.position.x + 500 <= b.position.x || a.position.y + 150 <= b.position.y).toBe(true);
  });

  it("keeps fixed built-in geometry and authoritative container sizes ahead of a resolver", () => {
    const template = scenarios[0].traceGraph.nodes[0];
    const graph = freeze({ nodes: [
      { ...template, id: "box", type: GROUP_CONTAINER_NODE_TYPE, style: { width: 720, height: 440 },
        data: { ...template.data, isGroupContainer: true } },
      { ...template, id: "child", parentId: "box", extent: "parent" as const, position: { x: 40, y: 80 } },
      { ...template, id: "next" },
    ], edges: [{ id: "out", source: "box", target: "next", data: { kind: "next" as const } }] } as TraceGraph);
    let calls = 0;
    const result = createIsometricTraceLayout({ nodeSize: () => { calls++; return { width: 1, height: 1 }; } })(graph);
    expect(calls).toBe(0);
    expect(result.nodes[0].style).toBe(graph.nodes[0].style);
    expect(size(result.nodes[0])).toEqual({ width: 720, height: 440 });
    expect(size(result.nodes[1])).toEqual({ width: ISOMETRIC_NODE_WIDTH, height: ISOMETRIC_NODE_HEIGHT });
    expect(result.nodes[1].position).toBe(graph.nodes[1].position);
    expectContained(result);
    expectNoSiblingOverlap(result);
  });

  it("contains measured custom children in native groups and the main box without forcing their styles", () => {
    const template = scenarios[0].traceGraph.nodes[0];
    const graph = freeze({ nodes: [
      { ...template, id: "mount", data: { ...template.data, isSubflow: true, subflowId: "sf" } },
      { ...template, id: "wide-child", type: "custom", style: undefined, data: { ...template.data, subflowOf: "sf" } },
      { ...template, id: "next", type: "custom", style: { color: "red" } },
    ], edges: [{ id: "out", source: "mount", target: "next", data: { kind: "next" as const } }] } as TraceGraph);
    const measured = new Map([
      ["wide-child", { width: 420, height: 240 }],
      ["next", { width: 380, height: 220 }],
    ]);
    const nodeSize = (node: TraceNode) => measured.get(node.id) ?? { width: 1, height: 1 };
    const layout = createIsometricTraceLayout({ fixedStageNodes: false, nodeSize });
    const grouped = applyGroupLayout(graph, { groupedSubflowIds: ["sf"], baseLayout: layout, nodeSize });
    const child = grouped.nodes.find(node => node.id === "wide-child")!;
    const group = grouped.nodes.find(node => node.id === "mount")!;
    expect(child.style).toBeUndefined();
    expect(child.position.x + 420).toBeLessThanOrEqual(size(group).width);
    expect(child.position.y + 240).toBeLessThanOrEqual(size(group).height);
    const wrapped = wrapInMainChartBox(grouped, { baseLayout: graph => graph, nodeSize });
    const outer = wrapped.nodes[0];
    for (const node of wrapped.nodes.filter(node => node.parentId === outer.id)) {
      const footprint = node.data.isGroupContainer ? size(node) : measured.get(node.id)!;
      expect(node.position.x + footprint.width).toBeLessThanOrEqual(size(outer).width);
      expect(node.position.y + footprint.height).toBeLessThanOrEqual(size(outer).height);
    }
    expect(wrapped.nodes.find(node => node.id === "wide-child")!.style).toBeUndefined();
    expect(wrapped.nodes.find(node => node.id === "next")!.style).toBe(graph.nodes[2].style);
    expect(wrapped.edges).toBe(graph.edges);
  });

  it("honors existing container stamps over stale resolver bounds and ignores invalid custom measurements", () => {
    const template = scenarios[0].traceGraph.nodes[0];
    const graph = freeze({ nodes: [
      { ...template, id: "box", type: GROUP_CONTAINER_NODE_TYPE, style: { width: 720, height: 440 },
        data: { ...template.data, isGroupContainer: true } },
      { ...template, id: "next", type: "custom", position: { x: 760, y: 0 }, style: { width: 90, height: 50 } },
    ], edges: [] } as TraceGraph);
    const result = wrapInMainChartBox(graph, { baseLayout: graph => graph,
      nodeSize: node => node.id === "box" ? { width: 1, height: 1 } : { width: NaN, height: 0 } });
    expect(result.nodes[0].style).toMatchObject({ width: 882, height: 516 });
    expect(result.nodes[1].style).toBe(graph.nodes[0].style);
    expect(result.nodes[2].style).toBe(graph.nodes[1].style);
    expectContained(result);
  });

  it("preserves loop/custom edges and external parent links without feeding them into local placement", () => {
    const graph = structuredClone(scenarios.find(scenario => scenario.id === "loop")!.traceGraph);
    const external = { ...graph.nodes[0], parentId: "outside-this-scope" };
    graph.nodes[0] = external;
    const original = freeze(graph);
    const result = isometricLayout(original);
    const noLoop = isometricLayout({ ...original, edges: original.edges.filter(edge => edge.data?.kind !== "loop") });
    expect(result.nodes.map(node => node.position)).toEqual(noLoop.nodes.map(node => node.position));
    expect(result.nodes[0].parentId).toBe("outside-this-scope");
    expect(result.edges).toBe(original.edges);
    expect(result.edges.some(edge => edge.data?.kind === "loop")).toBe(true);
  });

  it("lays out a large disconnected recording with finite separated tiles", () => {
    const template = scenarios[0].traceGraph.nodes[0];
    const graph: TraceGraph = { nodes: Array.from({ length: 2_000 }, (_, index) => ({
      ...template, id: `stage-${index}`, position: { x: 0, y: 0 },
    })), edges: [] };
    const result = isometricLayout(graph);
    expect(result.nodes).toHaveLength(graph.nodes.length);
    expect(result.edges).toBe(graph.edges);
    expectFinite(result);
    // Disconnected dagre vertices share one rank. Their projected centers
    // stay on one line, so separated neighbors also separate farther pairs.
    const ordered = [...result.nodes].sort((a, b) => a.position.y - b.position.y);
    for (let i = 1; i < ordered.length; i++) {
      const a = ordered[i - 1], b = ordered[i];
      expect(Math.abs(a.position.x - b.position.x) >= ISOMETRIC_NODE_WIDTH ||
        Math.abs(a.position.y - b.position.y) >= ISOMETRIC_NODE_HEIGHT).toBe(true);
    }
  }, 20_000);
});
