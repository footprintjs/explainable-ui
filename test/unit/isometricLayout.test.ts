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
  isometricLayout,
} from "../../examples/local-playground/isometricLayout";

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

describe("consumer isometric layout", () => {
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
});
