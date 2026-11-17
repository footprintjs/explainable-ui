import { describe, expect, it } from "vitest";
import { buildTraceWalk } from "../../src/trace/traceWalk";

type Write = { path: string; readKeys?: string[] };
const commit = (stage: string, trace: Write[], index: number) => ({
  stage, stageId: stage.toLowerCase(), runtimeStageId: `${stage.toLowerCase()}#${index}`, trace,
});

/** Count collection work during this synchronous call, without a timing threshold. */
function membershipWork(run: () => ReturnType<typeof buildTraceWalk>) {
  const mapHas = Object.getOwnPropertyDescriptor(Map.prototype, "has")!;
  const setHas = Object.getOwnPropertyDescriptor(Set.prototype, "has")!;
  let checks = 0;
  Object.defineProperty(Map.prototype, "has", { ...mapHas, value(this: Map<unknown, unknown>, key: unknown) {
    checks++; return mapHas.value.call(this, key);
  } });
  Object.defineProperty(Set.prototype, "has", { ...setHas, value(this: Set<unknown>, key: unknown) {
    checks++; return setHas.value.call(this, key);
  } });
  try { return { walk: run(), checks }; }
  finally {
    Object.defineProperty(Map.prototype, "has", mapHas);
    Object.defineProperty(Set.prototype, "has", setHas);
  }
}

describe("bounded Backtrack legacy fanout", () => {
  it("keeps a linear admitted legacy read list from becoming a quadratic ancestor queue or union", () => {
    const width = 256;
    const inputs = Array.from({ length: width }, (_, index) => `input${index}`);
    const outputs = Array.from({ length: width }, (_, index) => `output${index}`);
    const log = [commit("Load", inputs.map(path => ({ path })), 0),
      commit("Calc", outputs.map(path => ({ path })), 1), commit("End", [{ path: "result" }], 2)];
    const tree = { runtimeStageId: "load#0", stageReads: {}, next: {
      runtimeStageId: "calc#1", stageReads: Object.fromEntries(inputs.map(key => [key, true])), next: {
        runtimeStageId: "end#2", stageReads: Object.fromEntries(outputs.map(key => [key, true])),
      },
    } };
    const { walk, checks } = membershipWork(() => buildTraceWalk(log, tree, "result", { scope: { invocationPath: [] } }));
    expect(walk.stops.map(stop => stop.stageName)).toEqual(["End", "Calc", "Load"]);
    expect(walk.truncated).toBe(false);
    const calc = walk.stops[1], shared = calc.ingredientsByKey?.[outputs[0]];
    expect(calc.contributedKeys).toEqual(outputs);
    expect(calc.ingredients.map(input => input.key)).toEqual(inputs);
    for (const key of outputs) expect(calc.ingredientsByKey?.[key]).toBe(shared);
    expect(walk.stops[2].contributedKeys).toEqual(inputs);
    // There are O(width) admitted names. Re-enqueuing/unioning the shared
    // width-element list once per output exceeds this bound by a wide margin.
    expect(checks).toBeLessThan(width * 100);
  });

  it("retains independent per-write prefixes alongside a shared legacy stage list", () => {
    const log = [commit("Left", [{ path: "x", readKeys: [] }], 0), commit("Right", [{ path: "z", readKeys: [] }], 1),
      commit("Calc", [{ path: "a" }, { path: "b", readKeys: ["z"] }, { path: "c", readKeys: [] }, { path: "d" }], 2),
      commit("End", [{ path: "result", readKeys: ["a", "b", "c", "d"] }], 3)];
    const tree = { runtimeStageId: "left#0", next: { runtimeStageId: "right#1", next: {
      runtimeStageId: "calc#2", stageReads: { x: true, z: true }, next: { runtimeStageId: "end#3" },
    } } };
    const walk = buildTraceWalk(log, tree, "result", { scope: { invocationPath: [], nestedReadTracking: true } });
    const calc = walk.stops.find(stop => stop.stageName === "Calc")!;
    expect(calc.contributedKeys).toEqual(["a", "b", "c", "d"]);
    expect(calc.ingredientsByKey?.a.map(input => input.key)).toEqual(["x", "z"]);
    expect(calc.ingredientsByKey?.d).toBe(calc.ingredientsByKey?.a);
    expect(calc.ingredientsByKey?.b.map(input => input.key)).toEqual(["z"]);
    expect(calc.ingredientsByKey?.b).not.toBe(calc.ingredientsByKey?.a);
    expect(calc.ingredientsByKey?.c).toEqual([]);
    expect(walk.stops.map(stop => stop.stageName)).toEqual(["End", "Calc", "Right", "Left"]);
  });
});
