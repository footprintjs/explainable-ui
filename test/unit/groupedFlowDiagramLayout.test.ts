import { describe, expect, it } from "vitest";
import {
  getFlowDiagramAncestors,
  projectGroupedFlowDiagram,
} from "../../src/components/GroupedFlowDiagram/layout";
import type {
  FlowDiagramDefinition,
  FlowDiagramNode,
  GroupedFlowDiagramModelOptions,
} from "../../src/components/GroupedFlowDiagram/types";

const definition: FlowDiagramDefinition = {
  nodes: [
    { id: "start", label: "Order received" },
    { id: "payment-1", label: "Payment", kind: "group" },
    { id: "risk-1", label: "Risk review", kind: "group", parentId: "payment-1" },
    { id: "checks-1", label: "Checks", kind: "group", parentId: "risk-1" },
    { id: "check-1", label: "Check", parentId: "checks-1" },
    { id: "charge-1", label: "Charge", parentId: "payment-1" },
    { id: "payment-2", label: "Payment", kind: "group" },
    { id: "check-2", label: "Check", parentId: "payment-2" },
    { id: "done", label: "Receipt" },
  ],
  edges: [
    { id: "arrive", source: "start", target: "check-1" },
    { id: "review-charge", source: "check-1", target: "charge-1" },
    { id: "retry-payment", source: "charge-1", target: "check-2" },
    { id: "receipt", source: "check-2", target: "done" },
  ],
};

it.each([["arrive", "payment-1"], ["arrive", "risk-1"], ["review-charge", "risk-1"], ["retry-payment", "payment-1"]])("refuses observed %s under recorded not-run ancestor %s even with missing child states", (edgeId, parentId) => {
  for (const expandedGroupIds of [[], ["payment-1", "risk-1", "checks-1"]]) {
    const result = projectGroupedFlowDiagram(definition, { expandedGroupIds, observation: {
      nodeStates: { [parentId]: "not-run" }, edgeStates: { [edgeId]: "observed" },
    } });
    expect(result.model).toBeUndefined();
    expect(result.error).toContain("Resolve conflicting recorded states");
  }
});

it("keeps unknown and not-taken relationships distinct from an observed contradiction", () => {
  const result = projectGroupedFlowDiagram(definition, { observation: { nodeStates: { "payment-1": "not-run" }, edgeStates: { arrive: "not-taken" } } });
  expect(result.error).toBeUndefined();
  expect(result.model?.edges.find(edge => edge.edge.id === "arrive")?.state).toBe("not-taken");
});

function project(input = definition, options?: GroupedFlowDiagramModelOptions) {
  const result = projectGroupedFlowDiagram(input, options);
  expect(result.error).toBeUndefined();
  expect(result.model).toBeDefined();
  return result.model!;
}

function boxesOverlap(a: { position: { x: number; y: number }; width: number; height: number }, b: typeof a) {
  return a.position.x < b.position.x + b.width
    && b.position.x < a.position.x + a.width
    && a.position.y < b.position.y + b.height
    && b.position.y < a.position.y + a.height;
}

function expectContainedAndSeparated(model: ReturnType<typeof project>) {
  const byId = new Map(model.nodes.map((node) => [node.node.id, node]));
  for (const node of model.nodes) {
    expect(Number.isFinite(node.position.x + node.position.y + node.width + node.height)).toBe(true);
    if (node.parentId) {
      const parent = byId.get(node.parentId)!;
      expect(model.nodes.indexOf(parent)).toBeLessThan(model.nodes.indexOf(node));
      expect(node.position.x).toBeGreaterThanOrEqual(24);
      expect(node.position.y).toBeGreaterThanOrEqual(96);
      expect(node.position.x + node.width).toBeLessThanOrEqual(parent.width - 24);
      expect(node.position.y + node.height).toBeLessThanOrEqual(parent.height - 24);
    }
    for (const other of model.nodes) {
      if (node !== other && node.parentId === other.parentId) {
        expect(boxesOverlap(node, other)).toBe(false);
      }
    }
  }
}

describe("projectGroupedFlowDiagram", () => {
  it("starts with one card per top-level node and retains original boundary edge identities", () => {
    const model = project();
    expect(model.direction).toBe("LR");
    expect(model.nodes.map((n) => n.node.id)).toEqual(["start", "payment-1", "payment-2", "done"]);
    expect(model.nodes.find((n) => n.node.id === "payment-1")).toMatchObject({
      width: 220, height: 168, expanded: false, childCount: 2, state: "unknown",
    });
    expect(model.edges.map((e) => [e.edge.id, e.source, e.target, e.collapsed])).toEqual([
      ["arrive", "start", "payment-1", true],
      ["retry-payment", "payment-1", "payment-2", true],
      ["receipt", "payment-2", "done", true],
    ]);
  });

  it.each(["LR", "TB"] as const)("sizes three group levels inside out without overlapping %s siblings", (direction) => {
    const model = project(definition, {
      direction, expandedGroupIds: ["payment-1", "risk-1", "checks-1", "payment-2"],
    });
    expect(model.nodes).toHaveLength(definition.nodes.length);
    expectContainedAndSeparated(model);
    expect(model.edges.map((e) => e.edge.id)).toEqual(definition.edges.map((e) => e.id));
    expect(model.edges.every((e) => !e.collapsed)).toBe(true);
    const start = model.nodes.find((n) => n.node.id === "start")!;
    const payment = model.nodes.find((n) => n.node.id === "payment-1")!;
    expect(direction === "LR" ? payment.position.x : payment.position.y)
      .toBeGreaterThan(direction === "LR" ? start.position.x + start.width : start.position.y + start.height);
  });

  it("hides all descendants of a collapsed group even if a hidden group remains expanded", () => {
    const model = project(definition, { expandedGroupIds: ["risk-1", "checks-1"] });
    expect(model.nodes.some((n) => n.parentId)).toBe(false);
    expect(model.expandedGroupIds).toEqual(["risk-1", "checks-1"]);
  });

  it("outputs parents before children even when declarations arrive in the reverse order", () => {
    const model = project({ nodes: [...definition.nodes].reverse(), edges: definition.edges }, {
      expandedGroupIds: ["payment-1", "risk-1", "checks-1", "payment-2"],
    });
    expectContainedAndSeparated(model);
  });

  it("keeps a wide branching group separate from its following sibling", () => {
    const children = Array.from({ length: 12 }, (_, i) => ({ id: `branch-${i}`, label: "Review", parentId: "g" }));
    const input: FlowDiagramDefinition = {
      nodes: [{ id: "g", label: "Reviews", kind: "group" }, { id: "fork", label: "Choose", parentId: "g", kind: "decision" }, ...children, { id: "after", label: "After" }],
      edges: [...children.map((n, i) => ({ id: `fork-${i}`, source: "fork", target: n.id })), { id: "after", source: children[0]!.id, target: "after" }],
    };
    expectContainedAndSeparated(project(input, { expandedGroupIds: ["g"] }));
  });

  it("does not infer execution facts from graph connectivity, other node states, or missing observations", () => {
    const model = project(definition, {
      expandedGroupIds: ["payment-1", "risk-1", "checks-1", "payment-2"],
      observation: {
        nodeStates: { "check-1": "failed", "charge-1": "completed", "check-2": "not-run" },
        edgeStates: { arrive: "observed", "retry-payment": "not-taken" },
      },
    });
    const states = new Map(model.nodes.map((n) => [n.node.id, n.state]));
    expect(states.get("start")).toBe("unknown");
    expect(states.get("done")).toBe("unknown");
    expect(states.get("payment-1")).toBe("unknown");
    expect(states.get("check-2")).toBe("not-run");
    expect(model.edges.map((e) => e.state)).toEqual(["observed", "unknown", "not-taken", "unknown"]);
  });

  it("reports recorded issues inside ancestors without manufacturing the group's own status", () => {
    const options: GroupedFlowDiagramModelOptions = {
      expandedGroupIds: ["payment-1", "risk-1"],
      observation: { nodeStates: { "check-1": "failed", "charge-1": "completed" } },
    };
    const model = project(definition, options);
    expect(model.nodes.find((n) => n.node.id === "payment-1")).toMatchObject({ state: "unknown", recordedIssueCount: 1 });
    expect(model.nodes.find((n) => n.node.id === "risk-1")).toMatchObject({ state: "unknown", recordedIssueCount: 1 });
    expect(project(definition, { observation: { nodeStates: { "payment-1": "completed", "check-1": "failed" } } })
      .nodes.find((n) => n.node.id === "payment-1")).toMatchObject({ state: "completed", recordedIssueCount: 1 });
    expect(project(definition, { observation: { nodeStates: { "charge-1": "completed", "risk-1": "completed" } } })
      .nodes.find((n) => n.node.id === "payment-1")!.state).toBe("unknown");
  });

  it("keeps selected hidden descendants discoverable and emphasizes only host IDs plus their containers", () => {
    const model = project(definition, {
      selectedNodeId: "check-1",
      highlight: { nodeIds: ["check-1"], edgeIds: ["receipt"] },
    });
    expect(model.nodes.find((n) => n.node.id === "payment-1")).toMatchObject({ containsSelection: true, highlighted: true });
    expect(model.nodes.find((n) => n.node.id === "start")).toMatchObject({ containsSelection: false, highlighted: false });
    expect(model.nodes.find((n) => n.node.id === "done")!.highlighted).toBe(false);
    expect(model.edges.filter((e) => e.highlighted).map((e) => e.edge.id)).toEqual(["receipt"]);
    expect(getFlowDiagramAncestors(definition, "check-1")).toEqual(["payment-1", "risk-1", "checks-1"]);
    expect(getFlowDiagramAncestors(definition, "missing")).toEqual([]);
  });

  it("emphasizes folded Pay for an explicitly highlighted hidden authorize step without adding execution facts", () => {
    const input: FlowDiagramDefinition = {
      nodes: [
        { id: "start", label: "Start" }, { id: "pay", label: "Pay", kind: "group" },
        { id: "authorize", label: "Authorize", parentId: "pay" },
        { id: "capture", label: "Capture", parentId: "pay" }, { id: "done", label: "Done" },
      ],
      edges: [
        { id: "enter", source: "start", target: "authorize" },
        { id: "internal", source: "authorize", target: "capture" },
        { id: "exit", source: "capture", target: "done" },
      ],
    };
    const highlight = { nodeIds: ["authorize"] };
    const folded = project(input, { highlight });
    expect(folded.nodes.filter((n) => n.highlighted).map((n) => n.node.id)).toEqual(["pay"]);
    expect(folded.nodes.find((n) => n.node.id === "pay")).toMatchObject({ state: "unknown", recordedIssueCount: 0 });
    expect(folded.nodes.every((n) => n.state === "unknown")).toBe(true);
    expect(folded.edges.every((e) => e.state === "unknown" && !e.highlighted)).toBe(true);
    const expanded = project(input, { highlight, expandedGroupIds: ["pay"] });
    expect(expanded.nodes.filter((n) => n.highlighted).map((n) => n.node.id)).toEqual(["pay", "authorize"]);
    expect(expanded.nodes.find((n) => n.node.id === "capture")!.highlighted).toBe(false);
    expect(expanded.nodes.find((n) => n.node.id === "start")!.highlighted).toBe(false);
    expect(highlight.nodeIds).toEqual(["authorize"]);
  });

  it("emphasizes a container for a highlighted hidden internal edge without highlighting its leaf endpoints", () => {
    const input: FlowDiagramDefinition = {
      nodes: [
        { id: "pay", label: "Pay", kind: "group" },
        { id: "authorize", label: "Authorize", parentId: "pay" },
        { id: "capture", label: "Capture", parentId: "pay" },
        { id: "unrelated", label: "Other work" },
      ],
      edges: [{ id: "internal", source: "authorize", target: "capture" }],
    };
    const folded = project(input, { highlight: { edgeIds: ["internal"] } });
    expect(folded.edges).toEqual([]);
    expect(folded.nodes.find((n) => n.node.id === "pay")).toMatchObject({ highlighted: true, state: "unknown", recordedIssueCount: 0 });
    expect(folded.nodes.find((n) => n.node.id === "unrelated")!.highlighted).toBe(false);
    const expanded = project(input, { highlight: { edgeIds: ["internal"] }, expandedGroupIds: ["pay"] });
    expect(expanded.nodes.filter((n) => n.highlighted).map((n) => n.node.id)).toEqual(["pay"]);
    expect(expanded.edges[0]).toMatchObject({ highlighted: true, state: "unknown", collapsed: false });
    expect(expanded.nodes.every((n) => n.state === "unknown")).toBe(true);
  });

  it("keeps parallel collapsed edges independent and never adds a bridge for disconnected nodes", () => {
    const input: FlowDiagramDefinition = {
      nodes: [{ id: "g", label: "Work", kind: "group" }, { id: "a", label: "A", parentId: "g" }, { id: "b", label: "B", parentId: "g" }, { id: "x", label: "X" }, { id: "isolated", label: "Unconnected" }],
      edges: [{ id: "one", source: "x", target: "a" }, { id: "two", source: "x", target: "b" }, { id: "inside", source: "a", target: "b" }],
    };
    const model = project(input, { observation: { edgeStates: { one: "observed", two: "not-taken" } } });
    expect(model.edges.map((e) => [e.edge.id, e.source, e.target, e.state])).toEqual([
      ["one", "x", "g", "observed"], ["two", "x", "g", "not-taken"],
    ]);
    expect(model.edges.every((e) => input.edges.some((original) => original.id === e.edge.id))).toBe(true);
  });

  it("handles hostile object-key IDs as independent IDs using safe internal dagre keys", () => {
    const input: FlowDiagramDefinition = {
      nodes: [{ id: "__proto__", label: "Outer", kind: "group" }, { id: "constructor", label: "Inner", parentId: "__proto__" }, { id: "toString", label: "Result" }],
      edges: [{ id: "__proto__", source: "constructor", target: "toString" }],
    };
    const states = Object.create(null) as Record<string, "failed">;
    Object.defineProperty(states, "constructor", { value: "failed", enumerable: true });
    const model = project(input, { expandedGroupIds: ["__proto__"], observation: { nodeStates: states } });
    expect(model.nodes.find((n) => n.node.id === "constructor")!.state).toBe("failed");
    expectContainedAndSeparated(model);
  });

  it("does not mutate frozen inputs or retain mutable input objects", () => {
    const input = structuredClone(definition);
    for (const n of input.nodes) Object.freeze(n);
    for (const e of input.edges) Object.freeze(e);
    Object.freeze(input.nodes); Object.freeze(input.edges); Object.freeze(input);
    const options = Object.freeze({ expandedGroupIds: Object.freeze(["payment-1"]) });
    const before = JSON.stringify(input);
    const model = project(input, options);
    expect(JSON.stringify(input)).toBe(before);
    expect(model.nodes[0]!.node).not.toBe(input.nodes[0]);
    expect(model.edges[0]!.edge).not.toBe(input.edges[0]);
    expect(model.definition).not.toBe(input);
    expect(model.definition.nodes).not.toBe(input.nodes);
    expect(model.definition.edges).not.toBe(input.edges);
    expect(project(input, options)).toEqual(model);
  });

  it("retains only admitted structural metadata for hidden descendants without reading extra accessors", () => {
    let accessorCalls = 0;
    const child = Object.defineProperty({ id: "child", label: "Review", parentId: "group", runtimeSecret: "omit" }, "extra", {
      enumerable: true, get() { accessorCalls++; throw new Error("UNTRUSTED"); },
    });
    const edge = Object.defineProperty({ id: "inside", source: "child", target: "sibling", recordedState: "failed" }, "extra", {
      enumerable: true, get() { accessorCalls++; throw new Error("UNTRUSTED"); },
    });
    const model = project({ nodes: [{ id: "group", label: "Work", kind: "group" }, child, { id: "sibling", label: "Review", parentId: "group" }], edges: [edge] }, {
      observation: { nodeStates: { child: "failed" } },
    });
    expect(model.nodes).toHaveLength(1);
    expect(model.definition.nodes).toEqual([
      { id: "group", label: "Work", kind: "group" },
      { id: "child", label: "Review", kind: "step", parentId: "group" },
      { id: "sibling", label: "Review", kind: "step", parentId: "group" },
    ]);
    expect(model.definition.edges).toEqual([{ id: "inside", source: "child", target: "sibling" }]);
    expect(getFlowDiagramAncestors(model.definition, "child")).toEqual(["group"]);
    expect(accessorCalls).toBe(0);
  });

  it("supports structural cycles and explicit self edges without asserting an execution", () => {
    const input: FlowDiagramDefinition = {
      nodes: [{ id: "a", label: "A" }, { id: "b", label: "B", kind: "decision" }],
      edges: [{ id: "ab", source: "a", target: "b" }, { id: "ba", source: "b", target: "a" }, { id: "aa", source: "a", target: "a" }],
    };
    const model = project(input);
    expect(model.nodes[0]).toMatchObject({ width: 180, height: 148 });
    expect(model.nodes[1]).toMatchObject({ width: 180, height: 172 });
    expect(model.edges.map((e) => e.edge.id)).toEqual(["ab", "ba", "aa"]);
    expectContainedAndSeparated(model);
  });

  it("returns an empty bounded model for an empty declared graph", () => {
    expect(project({ nodes: [], edges: [] })).toMatchObject({ nodes: [], edges: [], width: 0, height: 0 });
  });

  it("accepts the sixteen-group depth boundary and treats Unicode icons as inert presentation", () => {
    const groups: FlowDiagramNode[] = Array.from({ length: 16 }, (_, i) => ({ id: `g${i}`, label: "Group", kind: "group", ...(i ? { parentId: `g${i - 1}` } : {}) }));
    const model = project({ nodes: [...groups, { id: "leaf", label: "<script> is a label", parentId: "g15", icon: "✓" }], edges: [] }, { expandedGroupIds: groups.map((g) => g.id) });
    expectContainedAndSeparated(model);
    expect(model.nodes[model.nodes.length - 1]!.node).toMatchObject({ id: "leaf", icon: "✓", label: "<script> is a label" });
  });

  it("admits the inclusive node, edge, and text size limits", () => {
    const nodes: FlowDiagramNode[] = Array.from({ length: 512 }, (_, i) => ({ id: i ? `n${i}` : "a".repeat(256), label: "b".repeat(160), description: "c".repeat(320), icon: "d".repeat(32) }));
    const edges = Array.from({ length: 1024 }, (_, i) => ({ id: `e${i}`, source: nodes[i % nodes.length]!.id, target: nodes[i % nodes.length]!.id, label: "e".repeat(160) }));
    const model = project({ nodes, edges });
    expect(model.nodes).toHaveLength(512);
    expect(model.edges).toHaveLength(1024);
    expect(Number.isFinite(model.width + model.height)).toBe(true);
  });
});

describe("grouped flow input admission", () => {
  const invalid = (value: unknown, options?: unknown) => {
    const result = projectGroupedFlowDiagram(value as FlowDiagramDefinition, options as GroupedFlowDiagramModelOptions);
    expect(result.model).toBeUndefined();
    expect(result.error).toMatch(/\S/);
    expect(result.error).not.toContain("UNTRUSTED");
    return result.error;
  };

  it.each([
    { nodes: [{ id: "x", label: "A" }, { id: "x", label: "B" }], edges: [] },
    { nodes: [{ id: "x", label: "A" }], edges: [{ id: "e", source: "x", target: "missing" }] },
    { nodes: [{ id: "x", label: "A", parentId: "missing" }], edges: [] },
    { nodes: [{ id: "x", label: "A" }, { id: "y", label: "B", parentId: "x" }], edges: [] },
    { nodes: [{ id: "x", label: "A", kind: "group", parentId: "y" }, { id: "y", label: "B", kind: "group", parentId: "x" }], edges: [] },
    { nodes: [{ id: "x", label: "A", kind: "group", parentId: "x" }], edges: [] },
    { nodes: [{ id: "x", label: "UNTRUSTED".repeat(30) }], edges: [] },
    { nodes: [{ id: "x".repeat(257), label: "A" }], edges: [] },
    { nodes: [{ id: "x", label: "A", description: "a".repeat(321) }], edges: [] },
    { nodes: [{ id: "x", label: "A", icon: "<img src=x onerror=UNTRUSTED>" }], edges: [] },
    { nodes: [{ id: "x", label: "A", icon: "https://UNTRUSTED.test/icon" }], edges: [] },
    { nodes: [{ id: "x", label: "A", icon: "a".repeat(33) }], edges: [] },
  ])("refuses malformed hierarchy, identity, text, or icon input with a fixed message %#", (input) => {
    invalid(input);
    expect(getFlowDiagramAncestors(input as FlowDiagramDefinition, "x")).toEqual([]);
  });

  it("refuses duplicate edge IDs", () => {
    invalid({ nodes: [{ id: "x", label: "A" }], edges: [{ id: "e", source: "x", target: "x" }, { id: "e", source: "x", target: "x" }] });
  });

  it("refuses contradictory supplied observations without inventing replacement states", () => {
    invalid(definition, { observation: { nodeStates: { start: "not-run" }, edgeStates: { arrive: "observed" } } });
    invalid(definition, { observation: { nodeStates: { "check-1": "not-run" }, edgeStates: { arrive: "observed" } } });
    for (const state of ["completed", "running", "failed"]) {
      invalid(definition, { observation: { nodeStates: { "payment-1": "not-run", "check-1": state } } });
    }
    expect(project(definition, { observation: { nodeStates: { "payment-1": "not-run" } } })
      .nodes.find((n) => n.node.id === "payment-1")!.state).toBe("not-run");
  });

  it("bounds nodes, edges, nesting, and option lists before layout", () => {
    invalid({ nodes: Array.from({ length: 513 }, (_, i) => ({ id: String(i), label: "A" })), edges: [] });
    invalid({ nodes: [{ id: "x", label: "A" }], edges: Array.from({ length: 1025 }, (_, i) => ({ id: String(i), source: "x", target: "x" })) });
    const nodes: FlowDiagramNode[] = Array.from({ length: 17 }, (_, i) => ({ id: `g${i}`, label: "Group", kind: "group", ...(i ? { parentId: `g${i - 1}` } : {}) }));
    invalid({ nodes, edges: [] });
    invalid(definition, { expandedGroupIds: Array.from({ length: 513 }, () => "payment-1") });
    invalid(definition, { highlight: { edgeIds: Array.from({ length: 1025 }, () => "arrive") } });
  });

  it.each([
    { expandedGroupIds: ["UNTRUSTED"] },
    { expandedGroupIds: ["start"] },
    { selectedNodeId: "UNTRUSTED" },
    { highlight: { nodeIds: ["UNTRUSTED"] } },
    { highlight: { edgeIds: ["UNTRUSTED"] } },
    { observation: { nodeStates: { UNTRUSTED: "failed" } } },
    { observation: { edgeStates: { arrive: "completed" } } },
    { direction: "UNTRUSTED" },
    { direction: null },
  ])("refuses unknown or invalid options without reflecting their untrusted content %#", (options) => {
    invalid(definition, options);
  });

  it("never invokes getters on definitions, nodes, arrays, options, or state maps", () => {
    let calls = 0;
    const getter = () => { calls++; throw new Error("UNTRUSTED"); };
    const ownGetter = (key: string, rest: object = {}) => Object.defineProperty(rest, key, { enumerable: true, get: getter });
    invalid(ownGetter("nodes", { edges: [] }));
    invalid({ nodes: [ownGetter("id", { label: "A" })], edges: [] });
    invalid({ nodes: ownGetter("0", new Array(1)), edges: [] });
    invalid(definition, ownGetter("expandedGroupIds"));
    invalid(definition, { observation: { nodeStates: ownGetter("start") } });
    expect(calls).toBe(0);
  });

  it("rejects inherited data and sparse arrays instead of admitting prototype or absent fields", () => {
    invalid(Object.create({ nodes: [], edges: [] }));
    invalid({ nodes: [Object.create({ id: "x", label: "A" })], edges: [] });
    invalid({ nodes: new Array(1), edges: [] });
    invalid(definition, { observation: { nodeStates: Object.create({ start: "completed" }) } });
  });

  it("contains reflection failures without reading a hostile thrown object's message or prototype", () => {
    const thrown = new Proxy({}, { getPrototypeOf() { throw new Error("UNTRUSTED"); }, get() { throw new Error("UNTRUSTED"); } });
    const input = new Proxy({}, { getPrototypeOf() { throw thrown; } });
    invalid(input);
    expect(getFlowDiagramAncestors(input as FlowDiagramDefinition, "x")).toEqual([]);
  });
});
