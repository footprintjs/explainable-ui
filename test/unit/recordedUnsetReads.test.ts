import { describe, expect, it, vi } from "vitest";
import { createScopedRecordGraph } from "../../src/record";
import { stageReadKeys } from "../../src/trace/readProvenance";
import { WorkBudget } from "../../src/trace/safeRecordRead";
import { projectStageActivity } from "../../src/trace/stageActivity";
import { childTraceScope, runHasRecordedReads } from "../../src/trace/traceScope";
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
    expect(runHasRecordedReads(stored)).toBe(true);
  });

  it("keeps unset reads available in a saved child scope and Stage Activity", () => {
    const stored = saved(recording({ y: undefined }, ["y"]));
    const scope = childTraceScope({
      treeContext: { history: stored.commitLog, stageContexts: stored.executionTree },
    }, ["child"]);
    expect(scope.availability).toEqual({ ok: true });
    expect(scope.readsAvailable).toBe(true);
    const walk = buildTraceWalk(scope.commitLog, scope.executionTree, "answer", {
      scope: { invocationPath: scope.invocationPath, mountLabels: Object.fromEntries(scope.mountLabels) },
    });
    expect(walk.inputTermini).toEqual(["y"]);
    const activity = projectStageActivity({
      scope,
      snapshots: stored.commitLog.map(row => ({
        runtimeStageId: row.runtimeStageId,
        stageName: row.stage, stageLabel: row.stage, memory: {}, narrative: "", startMs: 0, durationMs: 1,
      })),
      selectedIndex: 1,
    });
    expect(activity.reads[0]).toMatchObject({ key: "y", source: "stage-read" });
  });

  it("preserves printed paths and charges the existing read budget", () => {
    const node = { runtimeStageId: "B", undefinedReadKeys: ["config.region", "config\u001fregion"] };
    expect(stageReadKeys(node, new WorkBudget(3)).get("B")).toEqual(["config\u001fregion", "config.region"]);
    expect(() => stageReadKeys(node, new WorkBudget(2))).toThrow("too-large");
  });

  it("charges the same budget live and after JSON and bounds duplicate list entries", () => {
    const names = Array.from({ length: 100 }, (_, index) => `unset${index}`);
    const stageReads = Object.fromEntries(names.map(name => [name, undefined]));
    function longRun(stages: number) {
      let next: object | undefined;
      for (let index = stages - 1; index >= 0; index--) {
        next = { runtimeStageId: `later${index}`, stageReads, undefinedReadKeys: names, next };
      }
      return {
        commitLog: [commit("A", "x", 7), commit("B", "answer", 7)],
        executionTree: { runtimeStageId: "A", next: { runtimeStageId: "B", stageReads: { x: 7 }, next } },
      };
    }
    const reopen = <T>(run: T): T => JSON.parse(JSON.stringify(run));
    const walkRun = (run: ReturnType<typeof longRun>) => buildTraceWalk(run.commitLog, run.executionTree, "answer");
    for (const [stages, spent] of [[500, 50_503], [990, 99_993]] as const) {
      const live = longRun(stages);
      const restored = reopen(live);
      for (const recording of [live, restored]) {
        const budget = new WorkBudget();
        expect(stageReadKeys(recording.executionTree, budget).get("later0")).toHaveLength(100);
        expect(budget.items).toBe(spent);
      }
      expect(walkRun(live).stops.map(stop => stop.runtimeStageId)).toEqual(["B", "A"]);
      expect(walkRun(restored)).toEqual(walkRun(live));
    }
    const tooLarge = longRun(991);
    for (const recording of [tooLarge, reopen(tooLarge)]) {
      expect(() => stageReadKeys(recording.executionTree, new WorkBudget())).toThrow("too-large");
      expect(walkRun(recording)).toMatchObject({ stops: [], missing: { reason: "evidence-unavailable" } });
    }

    const repeats = { runtimeStageId: "repeat", undefinedReadKeys: ["missing", "missing", "missing"] };
    const budget = new WorkBudget(4);
    expect(stageReadKeys(repeats, budget).get("repeat")).toEqual(["missing"]);
    expect(budget.items).toBe(4);
    const repeatedList = { ...repeats, next: { ...repeats, runtimeStageId: "again" } };
    expect(() => stageReadKeys(repeatedList, new WorkBudget(7))).toThrow("too-large");
  });
});
