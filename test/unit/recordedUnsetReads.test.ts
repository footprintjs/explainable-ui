import { describe, expect, it, vi } from "vitest";
import { createScopedRecordGraph } from "../../src/record";
import { buildTraceWalk } from "../../src/trace/traceWalk";

function commit(stage: string, key: string, value: number) {
  return {
    stage, stageId: stage, runtimeStageId: stage,
    trace: [{ path: key, verb: "set" }],
    updates: {},
    overwrite: { [key]: value },
  };
}

function recording(stageReads: Record<string, unknown>, undefinedReadKeys?: unknown) {
  const b = {
    runtimeStageId: "B",
    stageReads,
    ...(undefinedReadKeys === undefined ? {} : { undefinedReadKeys }),
    next: { runtimeStageId: "C" },
  };
  return {
    runId: "captured",
    logAddress: { logRunId: "captured", drillPath: [] as string[] },
    initialState: {},
    commitLog: [commit("A", "x", 7), commit("B", "answer", 7), commit("C", "y", 42)],
    executionTree: { runtimeStageId: "A", next: b },
  };
}

function saved(value: ReturnType<typeof recording>): ReturnType<typeof recording> {
  return JSON.parse(JSON.stringify(value));
}

function walk(value: ReturnType<typeof recording>) {
  return buildTraceWalk(value.commitLog, value.executionTree, "answer");
}

function ingredientKeys(value: ReturnType<typeof recording>) {
  return walk(value).stops[0]?.ingredients.map(ingredient => ingredient.key);
}

async function scoped(value: ReturnType<typeof recording>) {
  return createScopedRecordGraph(value)!.read({ invocationPath: [], key: "answer", beforeCommitIdx: 3 });
}

describe("unset reads in live and saved recordings", () => {
  it("keeps reads made before a later write and reads with no writer", () => {
    const live = recording({ y: undefined, x: 7, never: undefined }, ["y", "never"]);
    const restored = saved(live);
    expect(Object.keys(restored.executionTree.next.stageReads)).toEqual(["x"]);
    const expected = walk(live);
    expect(expected.stops.map(stop => stop.runtimeStageId)).toEqual(["B", "A"]);
    expect(ingredientKeys(live)).toEqual(["never", "x", "y"]);
    expect(expected.inputTermini).toEqual(["never", "y"]);
    expect(walk(restored)).toEqual(expected);
  });

  it("reports the same lack of an earlier writer in the scoped graph", async () => {
    const live = recording({ x: 7, y: undefined, never: undefined }, ["y", "never"]);
    const expected = await scoped(live);
    expect(expected.writer?.runtimeStageId).toBe("B");
    expect(expected.candidates?.map(writer => writer.runtimeStageId)).toEqual(["A"]);
    expect(expected.gaps.map(gap => gap.code)).toContain("untracked-input");
    expect(await scoped(saved(live))).toEqual(expected);
  });

  it("keeps previous recordings and skips malformed optional read lists", () => {
    const legacy = recording({ x: 7 });
    const expected = walk(legacy);
    expect(ingredientKeys(legacy)).toEqual(["x"]);
    expect(walk(saved(legacy))).toEqual(expected);
    for (const malformed of ["y", ["y", false], ["y", ""]]) {
      expect(walk(saved(recording({ x: 7 }, malformed)))).toEqual(expected);
    }
    const accessor = vi.fn(() => { throw new Error("read evidence must be data"); });
    const unsafeField = recording({ x: 7 });
    Object.defineProperty(unsafeField.executionTree.next, "undefinedReadKeys", { get: accessor });
    const unsafeItems = ["y"];
    Object.defineProperty(unsafeItems, 0, { get: accessor });
    expect(walk(unsafeField)).toEqual(expected);
    expect(walk(recording({ x: 7 }, unsafeItems))).toEqual(expected);
    expect(accessor).not.toHaveBeenCalled();
    expect(ingredientKeys(recording({ z: 9, x: 7 }, []))).toEqual(["z", "x"]);
  });

  it("reads a side list even when the saved stage omits stageReads", () => {
    const stored = saved(recording({}, ["y", "y"]));
    Reflect.deleteProperty(stored.executionTree.next, "stageReads");
    expect(ingredientKeys(stored)).toEqual(["y"]);
  });
});
