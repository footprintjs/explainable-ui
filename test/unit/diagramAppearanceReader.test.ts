import { describe, expect, it } from "vitest";
import { createDiagramAppearanceReader } from "../../src/flowchart";

describe("diagram appearance at a shared replay step", () => {
  it("isolates nodes and edges, rewinds sparse updates and clears only the addressed object", () => {
    const reader = createDiagramAppearanceReader([
      { step: 100000, target: "node", id: "a", appearance: { presence: "removed" } },
      { step: 2, target: "edge", id: "a", appearance: { activity: "updating" } },
      { step: 5, target: "node", id: "a", appearance: { activity: "removing" } },
      { step: 5, target: "node", id: "a", appearance: { activity: "removing", health: "available" } },
      { step: 8, target: "edge", id: "a", appearance: null },
      { step: 0, target: "node", id: "__proto__", appearance: { progress: { completed: 0, total: 2 } } },
    ]);
    expect(reader.at(100000).nodes?.a).toEqual({ presence: "removed" });
    expect(reader.at(8).edges?.a).toBeUndefined();
    const prior = reader.at(5);
    expect(prior.nodes?.a).toEqual({ activity: "removing", health: "available" });
    expect(prior.edges?.a).toEqual({ activity: "updating" });
    expect(reader.at(5)).toBe(prior);
    expect(reader.at(0).nodes?.["__proto__"]).toEqual({ progress: { completed: 0, total: 2 } });
    expect(reader.at(0).nodes?.a).toBeUndefined();
    expect(reader.at(-1)).toEqual({});
  });

  it("rejects events without a valid integer step or object kind", () => {
    expect(() => createDiagramAppearanceReader([{ step: -1, target: "node", id: "x", appearance: {} }])).toThrow(TypeError);
    expect(() => createDiagramAppearanceReader([{ step: 1, target: "unknown" as never, id: "x", appearance: {} }])).toThrow(TypeError);
  });
});
