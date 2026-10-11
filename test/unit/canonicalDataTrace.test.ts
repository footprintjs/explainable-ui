import { describe, expect, it } from "vitest";
import { isCommitBundle, keysReadFromMap } from "foottrace";
import { buildDataTrace, buildSelectedDataTrace } from "../../src/components/ExplainableShell/_internal/dataTrace";
import { prepareTraceSource } from "../../src/adapters/recordInput/traceSource";
import type { FlowRecordSelection } from "../../src/adapters/recordInput";
import fork from "../migration/fixtures/causal-phases/runtime-snapshot-10.0.0.json";

function bundle(id: string, path: string, value: unknown = 1) {
  return { stage: id, stageId: id.split("#")[0], runtimeStageId: id, overwrite: { [path]: value }, updates: {}, redactedPaths: [], trace: [{ path, verb: "set" }] };
}
function select(commitLog: unknown[], executionTree: unknown = undefined): FlowRecordSelection {
  return { sourceId: "chosen", format: "snapshot", record: { commitLog, executionTree }, reads: { status: "unknown" } };
}
const pair = [bundle("seed#0", "x"), bundle("read#1", "y")];
const reads = { runtimeStageId: "seed#0", next: { runtimeStageId: "read#1", stageReads: { x: 1 } } };

describe("M4 — canonical causal projection and exact source prefixes", () => {
  it("R2: the real fork reads at A's own row, not its empty repeat", () => {
    const before = JSON.stringify(fork);
    for (const log of [fork.commitLog.slice(0, 2), fork.commitLog]) {
      const result = buildDataTrace(log, fork.executionTree, "a#1");
      expect(result.frames.map(row => row.runtimeStageId)).toEqual(["a#1", "seed#0"]);
      expect(result.frames[0].keysWritten).toEqual(["runs\u001fa\u001fy"]);
    }
    expect(JSON.stringify(fork)).toBe(before);
  });
  it("preserves selected prefix row objects, original addresses and supplied read source", () => {
    const source = keysReadFromMap({ "read#1": ["x"] });
    const input = { ...select(pair), reads: { status: "supplied" as const, source } };
    const result = prepareTraceSource(input, "read#1", 2);
    expect(result.status).toBe("available");
    if (result.status !== "available") throw new Error("not available");
    expect(result.log[0]).toBe(pair[0]);
    expect(result.log[1]).toBe(pair[1]);
    expect(result.reads).toBe(source);
    const projected = buildSelectedDataTrace(input, "read#1", { beforeCommitIdx: 2 });
    expect(projected.frames.map(row => row.runtimeStageId)).toEqual(["read#1", "seed#0"]);
    expect(projected.evidence?.readsCoverage).toBeUndefined();
    expect(projected.readsAvailable).toBe(true);
    expect(projected.note).toContain("coverage is unknown");
    const truncated = buildSelectedDataTrace(input, "read#1", { beforeCommitIdx: 2, maxDepth: 0 });
    expect(truncated.readsAvailable).toBe(true);
    expect(truncated.evidence?.truncated?.byDepth).toBe(true);
    expect(truncated.note).toContain("coverage is unknown");
  });
  it.each([null, { ...pair[1], trace: [{ path: "y", verb: "invented" }] }, { ...pair[1], trace: [{ path: "y" }] }])("does not query a future invalid row (%j), but refuses it inside the prefix", bad => {
    const log = [...pair, bad];
    const result = buildSelectedDataTrace(select(log, reads), "read#1", { beforeCommitIdx: 2 });
    expect(result.status).toBe("available");
    expect(result.frames.map(row => row.runtimeStageId)).toEqual(["read#1", "seed#0"]);
    expect(prepareTraceSource(select(log, reads), "read#1", 3)).toMatchObject({ status: "unavailable", reason: "log-gap" });
    expect(log[2]).toBe(bad);
  });
  it("does not skip sparse positions", () => {
    const log: unknown[] = [...pair];
    log.length = 3;
    expect(buildSelectedDataTrace(select(log, reads), "read#1", { beforeCommitIdx: 2 }).status).toBe("available");
    expect(prepareTraceSource(select(log, reads), "read#1", 3)).toMatchObject({ status: "unavailable", reason: "log-gap" });
    expect(2 in log).toBe(false);
  });
  it.each([-1, 1.5, NaN, Infinity, 3])("refuses an inexact/out-of-range boundary %s", beforeCommitIdx => {
    expect(prepareTraceSource(select(pair, reads), "read#1", beforeCommitIdx)).toMatchObject({ status: "unavailable", reason: "boundary" });
  });
  it("does not turn an absent target into a whole-log question", () => {
    expect(buildSelectedDataTrace(select(pair, reads), "read#1", { beforeCommitIdx: 1 })).toMatchObject({ status: "not-recorded", frames: [] });
    expect(buildDataTrace([], undefined, "absent").status).toBe("not-recorded");
  });
  it("keeps identical stage IDs in separately selected source records isolated", () => {
    const child = [bundle("seed#0", "different"), bundle("read#1", "y")];
    const childTree = { runtimeStageId: "seed#0", next: { runtimeStageId: "read#1", stageReads: { different: 1 } } };
    const root = buildSelectedDataTrace(select(pair, reads), "read#1", { beforeCommitIdx: 2 });
    const selectedChild = buildSelectedDataTrace({ sourceId: "child", format: "tree-context", record: { history: child, stageContexts: childTree }, reads: { status: "unknown" } }, "read#1", { beforeCommitIdx: 2 });
    expect(root.frames[1].linkedBy).toBe("x");
    expect(selectedChild.frames[1].linkedBy).toBe("different");
    expect(selectedChild.evidence?.sourceId).toBe("child");
  });
  it("R3: preserves the old path-only input as explicitly unsupported, without making up its verb", () => {
    const pathOnly = [{ stage: "Old", stageId: "old", runtimeStageId: "old#0", trace: [{ path: "x" }] }];
    expect(buildDataTrace(pathOnly, undefined, "old#0")).toMatchObject({ status: "unavailable", frames: [] });
    expect(buildDataTrace(pathOnly, undefined, "old#0").note).toContain("unreadable record row");
    expect(pathOnly[0].trace[0]).not.toHaveProperty("verb");
  });
  it("preserves stage attribution even when per-write provenance could narrow it", () => {
    const log = [bundle("a#0", "x"), bundle("b#1", "z"), { ...bundle("c#2", "y"), trace: [{ path: "y", verb: "set", readKeys: ["x"] }, { path: "q", verb: "set", readKeys: ["z"] }] }];
    const tree = { runtimeStageId: "c#2", stageReads: { x: 1, z: 1 } };
    expect(buildDataTrace(log, tree, "c#2").frames.map(row => row.runtimeStageId)).toEqual(["c#2", "a#0", "b#1"]);
  });
  it("keeps depth and frame truncation distinct, without flagging a leaf at its exact budget", () => {
    expect(buildDataTrace(pair, reads, "read#1", 0).evidence?.truncated).toEqual({ byDepth: true, byNodes: false });
    expect(buildDataTrace(pair, reads, "read#1", 10, 1).evidence?.truncated).toEqual({ byDepth: false, byNodes: true });
    expect(buildDataTrace(pair, reads, "read#1", 1, 2).evidence?.truncated).toBeUndefined();
    expect(buildDataTrace(pair, reads, "seed#0", 0, 1).evidence?.truncated).toBeUndefined();
  });
  it("does not claim all values came from the last frame or that no recorded reads proves independence", () => {
    for (const tree of [undefined, { runtimeStageId: "read#1" }, { runtimeStageId: "future#99", stageReads: { unrelated: 1 } }]) {
      const result = buildDataTrace(pair, tree, "read#1");
      expect(result.frames).toHaveLength(1);
      expect(result.note).toContain("read capture may be incomplete");
      expect(result.evidence?.root?.parents).toEqual([]);
    }
  });
  it("refuses malformed saved trees through the owner, instead of silently omitting descendants", () => {
    expect(prepareTraceSource(select(pair, { runtimeStageId: "read#1", next: null }), "read#1", 2)).toMatchObject({ status: "unavailable", reason: "reads" });
  });
  it("keeps nested-writer basis and unknown pre-run origins visible", () => {
    const log = [bundle("seed#0", "cfg", { a: 1 }), { ...bundle("nested#1", "cfg\u001fb", 2), overwrite: { cfg: { b: 2 } } }, bundle("read#2", "out")];
    const tree = { runtimeStageId: "read#2", stageReads: { cfg: {}, external: 3 } };
    const prepared = prepareTraceSource(select(log, tree), "read#2", 3);
    if (prepared.status !== "available") throw new Error("nested fixture is unavailable");
    expect(prepared.fold.state.cfg).toEqual({ a: 1, b: 2 });
    const result = buildDataTrace(log, tree, "read#2");
    expect(result.frames[1].runtimeStageId).toBe("nested#1");
    expect(result.evidence?.root?.parentEdges[0].basis).toBe("nested-rows");
    expect(result.evidence?.root?.preRunReads?.keys).toEqual(["external"]);
    expect(result.note).toContain("only nested parts");
    expect(result.note).toContain("origin is not proven");
  });
  it("does not attribute an unchanged child path to a later whole-container writer", () => {
    const log = [bundle("seed#0", "cfg", { a: 1, b: 2 }), bundle("other#1", "cfg", { a: 1, b: 3 }), bundle("read#2", "out")];
    const result = buildDataTrace(log, { runtimeStageId: "read#2", stageReads: { ["cfg\u001fa"]: 1 } }, "read#2");
    expect(result.frames.map(row => row.runtimeStageId)).toEqual(["read#2", "seed#0"]);
  });
  describe.each([0, 257])("Foottrace 1.0.3 saved-path boundary (%i empty padding rows)", padding => {
    const pads = Array.from({ length: padding }, (_, index) => ({ ...bundle(`padding#${index}`, "unused"), trace: [], overwrite: {} }));
    const seed = fork.commitLog[0];
    const { path: _path, ...withoutPath } = seed.trace[0];
    const damaged = [
      ["numeric", { ...seed, trace: [{ ...seed.trace[0], path: 42 }] }],
      ["missing", { ...seed, trace: [withoutPath] }],
    ] as const;

    it("keeps the genuine producer's causal answer correct at either lookup strategy", () => {
      const log = [...pads, ...fork.commitLog.slice(0, 2)];
      const before = JSON.stringify(log);
      const result = buildDataTrace(log, fork.executionTree, "a#1");
      expect(result.status).toBe("available");
      expect(result.frames.map(row => row.runtimeStageId)).toEqual(["a#1", "seed#0"]);
      expect(result.evidence?.root?.preRunReads).toBeUndefined();
      expect(JSON.stringify(log)).toBe(before);
    });

    it.each(damaged)("refuses the %s path through the official guard before explaining it", (_kind, malformed) => {
      const log = [...pads, malformed, fork.commitLog[1]];
      const before = JSON.stringify(log);
      expect(isCommitBundle(malformed)).toBe(false);
      expect(prepareTraceSource(select(log, fork.executionTree), "a#1", log.length)).toMatchObject({ status: "unavailable", reason: "log-gap" });
      const result = buildDataTrace(log, fork.executionTree, "a#1");
      expect(result).toMatchObject({ status: "unavailable", frames: [], readsAvailable: false });
      expect(result.note).toContain("unreadable record row");
      expect(result.evidence).toBeUndefined();
      expect(log[padding]).toBe(malformed);
      expect(malformed.overwrite).toBe(seed.overwrite);
      expect(JSON.stringify(log)).toBe(before);
    });

    it.each(damaged)("does not let a future %s path spoil a valid selected prefix", (_kind, malformed) => {
      const log = [...pads, ...fork.commitLog.slice(0, 2), malformed];
      const before = JSON.stringify(log);
      const result = buildSelectedDataTrace(select(log, fork.executionTree), "a#1", { beforeCommitIdx: padding + 2 });
      expect(result.status).toBe("available");
      expect(result.frames.map(row => row.runtimeStageId)).toEqual(["a#1", "seed#0"]);
      expect(result.evidence?.beforeCommitIdx).toBe(padding + 2);
      expect(result.evidence?.root?.preRunReads).toBeUndefined();
      expect(buildSelectedDataTrace(select(log, fork.executionTree), "a#1", { beforeCommitIdx: log.length })).toMatchObject({ status: "unavailable", frames: [] });
      expect(log[padding + 2]).toBe(malformed);
      expect(JSON.stringify(log)).toBe(before);
    });
  });
  it("preserves untracked-source and redaction qualifications", () => {
    const log = [pair[0], { ...pair[1], untrackedSources: ["env"], redactedPaths: ["y"] }];
    const result = buildDataTrace(log, reads, "read#1");
    expect(result.evidence?.root?.incompleteSources).toEqual(["env"]);
    expect(result.evidence?.redactedPaths).toEqual(["y"]);
    expect(result.note).toContain("not tracked");
    expect(result.note).toContain("redacted");
  });
  it("uses the recorded runtime ID as a display label when optional names are absent", () => {
    const unnamed = { runtimeStageId: "only#0", trace: [], overwrite: {}, updates: {} };
    expect(buildDataTrace([unnamed], undefined, "only#0").frames[0]).toMatchObject({ stageName: "only#0", stageId: "only#0" });
    expect(buildDataTrace([{ ...unnamed, stage: {}, stageId: 42 }], undefined, "only#0").frames[0]).toMatchObject({ stageName: "only#0", stageId: "only#0" });
  });
  it.each([0, -1, 1.5, NaN])("refuses an invalid frame budget %s explicitly", limit => {
    expect(buildDataTrace(pair, reads, "read#1", 10, limit)).toMatchObject({ status: "unavailable", frames: [] });
  });
});
