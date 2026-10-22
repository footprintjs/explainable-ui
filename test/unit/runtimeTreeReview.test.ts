import { describe, it, expect } from "vitest";
import {
  toVisualizationSnapshots,
  subflowResultToSnapshots,
} from "../../src/adapters/fromRuntimeSnapshot";
import { exactSubflowResults } from "../../src/components/ExplainableShell/_internal/subflowRecord";
describe("recorded tree conversion regressions", () => {
  it("never treats inherited object names as subflow results", () => {
    const results = exactSubflowResults({ "prepare#1": {} })!;
    expect(Object.getPrototypeOf(results)).toBeNull();
    const rows = toVisualizationSnapshots({
      sharedState: {},
      commitLog: [],
      executionTree: { id: "constructor", runtimeStageId: "constructor#1" },
      subflowResults: results,
    } as any);
    expect(rows[0].subflowResult).toBeUndefined();
  });
  it("refuses an array-like child list instead of accepting a malformed rail", () => {
    expect(() =>
      toVisualizationSnapshots({
        sharedState: {},
        commitLog: [],
        executionTree: {
          id: "root",
          children: { 0: { id: "hidden" }, length: 1 },
        },
      } as any)
    ).toThrow("child list");
  });
  it("refuses a malformed parallel child rather than silently omitting later siblings", () => {
    expect(() =>
      toVisualizationSnapshots({
        sharedState: {},
        commitLog: [],
        executionTree: { id: "root", children: [null, { id: "later" }] },
      } as any)
    ).toThrow("invalid child");
  });
  it("refuses a cyclic tree without recursive overflow", () => {
    const tree: any = { id: "root" };
    tree.next = tree;
    expect(() =>
      toVisualizationSnapshots({
        sharedState: {},
        commitLog: [],
        executionTree: tree,
      } as any)
    ).toThrow("cycle");
  });
  it("opens a three-thousand-step child without recursive stack exhaustion", () => {
    let tree: any;
    for (let i = 2999; i >= 0; i--)
      tree = {
        id: `step${i}`,
        runtimeStageId: `prepare/step${i}#${i}`,
        next: tree,
        stageWrites: { value: i },
      };
    const rows = subflowResultToSnapshots({
      treeContext: { stageContexts: tree, history: [], globalContext: {} },
    });
    expect(rows).toHaveLength(3000);
    expect(rows[2999].memory.value).toBe(2999);
  });
});
