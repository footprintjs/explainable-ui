import { describe, expect, it } from "vitest";
import { buildSelectedTraceWalk, buildTraceWalk, formatTraceWalk, traceContributionPreview } from "../../src/components/ExplainableShell/_internal/traceWalk";
import type { FlowRecordSelection } from "../../src/adapters/recordInput";
import { stateAt } from "foottrace";
import fork from "../migration/fixtures/causal-phases/runtime-snapshot-10.0.0.json";

const commit = (id: string, path: string, value: unknown = 1) => ({
  stage: id, stageId: id.split("#")[0], runtimeStageId: id,
  overwrite: { [path]: value }, updates: {}, redactedPaths: [], trace: [{ path, verb: "set" }],
});
const log = [commit("seed#0", "r"), commit("parent#1", "x", 2), commit("other#2", "r", 9),
  { ...commit("parent#1", "y", 3), phase: "repeat" }, commit("child#3", "out", 5)];
const tree = { runtimeStageId: "seed#0", next: { runtimeStageId: "parent#1", stageReads: { r: 1 },
  next: { runtimeStageId: "child#3", stageReads: { x: 2, y: 3 } } } };
const selected = (commitLog: unknown[] = log, executionTree: unknown = tree, initialState?: Record<string, unknown>): FlowRecordSelection => ({
  sourceId: "flow:test", format: "snapshot", record: { commitLog, executionTree, ...(initialState && { initialState }) }, reads: { status: "unknown" },
});

describe("M5 — exact variable writers and qualified explanations", () => {
  it("R2 keeps the real fork's A writer at its own row, not its later empty repeat", () => {
    const before = JSON.stringify(fork);
    for (const beforeCommitIdx of [2, fork.commitLog.length]) {
      const walk = buildTraceWalk(fork.commitLog, fork.executionTree, "runs\u001fa\u001fy", { beforeCommitIdx });
      expect(walk.stops.map(stop => [stop.runtimeStageId, stop.commitIdx])).toEqual([["a#1", 1], ["seed#0", 0]]);
    }
    expect(JSON.stringify(fork)).toBe(before);
  });
  it("retains distinct exact writers for two keys from one stage's different phases", () => {
    const walk = buildTraceWalk(log, tree, "out");
    expect(walk.stops[0].ingredients).toEqual([
      expect.objectContaining({ key: "x", writerRuntimeStageId: "parent#1", writerCommitIdx: 1 }),
      expect.objectContaining({ key: "y", writerRuntimeStageId: "parent#1", writerCommitIdx: 3 }),
    ]);
    expect(walk.stops.find(stop => stop.runtimeStageId === "parent#1")).toMatchObject({
      readCommitIdx: 1, contributedWrites: [{ key: "x", commitIdx: 1 }, { key: "y", commitIdx: 3 }],
    });
    const followed = buildTraceWalk(log, tree, "y", { beforeCommitIdx: 4 });
    expect(followed.stops[0]).toMatchObject({ runtimeStageId: "parent#1", commitIdx: 3, readCommitIdx: 1 });
    expect(followed.stops[0].ingredients[0]).toMatchObject({ key: "r", writerCommitIdx: 0 });
  });
  it("R3 does not turn an absent writer or zero captured reads into a known input/origin", () => {
    const missing = formatTraceWalk(buildTraceWalk(log, undefined, "not-recorded"), () => null);
    expect(missing).toContain("No recorded writer");
    expect(missing).not.toContain("arrived with the run");
    const anchorOnly = formatTraceWalk(buildTraceWalk(log, undefined, "out"), () => null);
    expect(anchorOnly).toContain("read capture may be incomplete");
    expect(anchorOnly).not.toContain("reads nothing");
  });
  it("exposes depth truncation even when the frame count is below its limit", () => {
    const walk = buildTraceWalk(log, tree, "out", { maxDepth: 0, maxFrames: 50 });
    expect(walk.truncated).toBe(true);
    expect(formatTraceWalk(walk, () => null)).toContain("depth limit");
  });
  it("refuses a gap inside the selected prefix but leaves a valid earlier question usable", () => {
    const broken = [...log, null];
    expect(() => buildTraceWalk(broken, tree, "out", { beforeCommitIdx: 5 })).not.toThrow();
    expect(buildTraceWalk(broken, tree, "out", { beforeCommitIdx: 5 }).stops[0].commitIdx).toBe(4);
    const refused = buildTraceWalk(broken, tree, "out");
    expect(refused).toMatchObject({ stops: [], missing: null, status: "unavailable" });
    expect(formatTraceWalk(refused, () => null)).toContain("unreadable record row");
  });
  it.each([-1, .5, NaN, Infinity, 6])("refuses inexact or outside boundary %s instead of coercing the question", beforeCommitIdx => {
    expect(buildTraceWalk(log, tree, "out", { beforeCommitIdx })).toMatchObject({ status: "unavailable", missing: null, stops: [] });
  });
  it("keeps boundary zero valid with a recorded base and separately labels future evidence", () => {
    const walk = buildSelectedTraceWalk(selected(log, tree, { r: 10 }), "out", { beforeCommitIdx: 0 });
    expect(walk).toMatchObject({ status: "not-recorded", stops: [], missing: { reason: "not-yet-written", firstWriteCommitIdx: 4 }, evidence: { beforeCommitIdx: 0 } });
    expect(formatTraceWalk(walk, () => null)).toContain("separately checked whole-record hint");
    expect(formatTraceWalk(walk, () => null)).not.toContain("nothing has executed");
  });
  it.each([null, { ...commit("bad#9", "bad"), trace: [{ path: 42, verb: "set" }] },
    { ...commit("bad#9", "bad"), trace: [{ path: "bad", verb: "invented" }] }])("uses the official guard for corrupt rows only inside the question", bad => {
    const corrupt = [...log, bad];
    expect(buildTraceWalk(corrupt, tree, "out", { beforeCommitIdx: 5 }).status).toBe("available");
    expect(buildTraceWalk(corrupt, tree, "out").status).toBe("unavailable");
    const missing = buildTraceWalk(corrupt, tree, "absent", { beforeCommitIdx: 5 });
    expect(missing.status).toBe("not-recorded");
    expect(formatTraceWalk(missing, () => null)).toContain("Later record rows were not used");
    expect(formatTraceWalk(missing, () => null)).not.toContain("run's inputs");
  });
  it("does not filter a sparse hole into new addresses", () => {
    const sparse = [...log]; sparse.length++;
    expect(buildTraceWalk(sparse, tree, "out", { beforeCommitIdx: 5 }).stops[0].commitIdx).toBe(4);
    expect(buildTraceWalk(sparse, tree, "out").status).toBe("unavailable");
  });
  it("does not confuse an exact-budget leaf with a discovered omitted parent", () => {
    expect(buildTraceWalk(log, tree, "r", { beforeCommitIdx: 1, maxFrames: 1 }).truncated).toBe(false);
    expect(buildTraceWalk(log, tree, "out", { maxFrames: 1 })).toMatchObject({ truncated: true, evidence: { truncated: { byNodes: true } } });
    expect(buildTraceWalk(log, tree, "out", { maxDepth: 2 }).truncated).toBe(false);
  });
  it("retains stage attribution even when a write has narrower per-write read keys", () => {
    const rows = [commit("seed#0", "a"), commit("other#1", "b"), { ...commit("result#2", "x"), trace: [{ path: "x", verb: "set", readKeys: ["a"] }] }];
    const walk = buildTraceWalk(rows, { runtimeStageId: "result#2", stageReads: { a: 1, b: 1 } }, "x");
    expect(walk.stops[0].ingredients.map(row => row.key)).toEqual(["a", "b"]);
  });
  it("uses actual continuation values, with first-read ingredients unchanged", () => {
    const source = selected();
    const walk = buildSelectedTraceWalk(source, "out");
    const parent = walk.stops.find(stop => stop.runtimeStageId === "parent#1")!;
    expect(parent.ingredients[0].writerCommitIdx).toBe(0); // Other changed r at row2: not this execution's input.
    expect(traceContributionPreview(source, walk, parent, "x")).toBe(2);
    expect(traceContributionPreview(source, walk, parent, "y")).toBe(3); // A's rail visit row1 cannot show this.
    const copy = formatTraceWalk(walk, () => null);
    expect(copy).toContain("x at row 1, y at row 3");
  });
  it("keeps a frozen early preview despite a later overwrite by the same runtime ID", () => {
    const source = selected([commit("a#0", "x", 1), commit("b#1", "other", 0), { ...commit("a#0", "x", 9), phase: "repeat" }], undefined);
    const early = buildSelectedTraceWalk(source, "x", { beforeCommitIdx: 1 });
    expect(traceContributionPreview(source, early, early.stops[0], "x")).toBe(1);
  });
  it("preserves two same-key contributions and suppresses an ambiguous scalar preview", () => {
    const rows = [commit("seed#0", "r"), commit("a#1", "x", 1), commit("b#2", "b"),
      { ...commit("a#1", "x", 9), phase: "repeat" }, commit("c#3", "c"), commit("root#4", "out")];
    const reads = { runtimeStageId: "root#4", stageReads: { b: 1, c: 1 }, children: [
      { runtimeStageId: "b#2", stageReads: { x: 1 } }, { runtimeStageId: "c#3", stageReads: { x: 9 } }, { runtimeStageId: "a#1", stageReads: { r: 1 } },
    ] };
    const source = selected(rows, reads);
    const walk = buildSelectedTraceWalk(source, "out");
    const a = walk.stops.find(stop => stop.runtimeStageId === "a#1")!;
    expect(a.contributedWrites?.map(row => [row.key, row.commitIdx]).sort()).toEqual([["x", 1], ["x", 3]]);
    expect(traceContributionPreview(source, walk, a, "x")).toBeUndefined();
    expect(formatTraceWalk(walk, () => null)).toContain("Multiple recorded writer rows contribute x");
  });
  it("keeps canonical nested, base and redaction basis instead of asserting an exact scalar", () => {
    const rows = [{ ...commit("a#0", "cfg\u001fb", 2), overwrite: { cfg: { b: 2 } } }];
    const source = selected(rows, undefined, { cfg: { a: 1 } });
    const walk = buildSelectedTraceWalk(source, "cfg");
    expect(walk.stops[0].contributedWrites?.[0].valueBasis).toEqual(["nested-rows", "from-initial-state"]);
    expect(traceContributionPreview(source, walk, walk.stops[0], "cfg")).toBeUndefined();
    expect(formatTraceWalk(walk, () => null)).toContain("from-initial-state");
    const hidden = buildTraceWalk([{ ...commit("a#0", "secret", "hidden"), redactedPaths: ["secret"] }], undefined, "secret");
    expect(formatTraceWalk(hidden, () => null)).toContain("redacted");
  });
  it("keeps the recorded deleted/undefined convention distinct from physical property presence", () => {
    const deleteLog = [commit("a#0", "x"), { ...commit("b#1", "x"), overwrite: {}, trace: [{ path: "x", verb: "delete" }] }];
    const deletion = buildTraceWalk(deleteLog, undefined, "x");
    expect(Object.prototype.hasOwnProperty.call(stateAt({ commitLog: deleteLog }, 1).state, "x")).toBe(false);
    expect(deletion.stops[0].contributedWrites?.[0].valueBasis).toEqual(["deleted"]);
    expect(formatTraceWalk(deletion, () => null)).toContain("recorded changes to `x`");
    const ownUndefined = { ...commit("a#0", "x"), overwrite: { x: undefined } };
    const exact = buildTraceWalk([ownUndefined], undefined, "x");
    const folded = stateAt({ commitLog: [ownUndefined] }, 0).state;
    expect(Object.prototype.hasOwnProperty.call(folded, "x")).toBe(true);
    expect(folded.x).toBeUndefined();
    expect(exact.stops[0].contributedWrites?.[0].valueBasis).toEqual(["deleted"]);
    expect(formatTraceWalk(exact, () => null)).toContain("deleted/undefined value (record convention)");
  });
  it("keeps empty and literal dotted keys distinct from delimiter paths", () => {
    const rows = [commit("empty#0", "", 0), commit("literal#1", "a.b", 1), { ...commit("nested#2", "a\u001fb", 2), overwrite: { a: { b: 2 } } }];
    expect(buildTraceWalk(rows, undefined, "").stops[0].commitIdx).toBe(0);
    expect(buildTraceWalk(rows, undefined, "a.b").stops[0].commitIdx).toBe(1);
    expect(buildTraceWalk(rows, undefined, "a\u001fb").stops[0].commitIdx).toBe(2);
  });
  it("preserves supplied read lookup uncertainty, including a truncated nonempty lookup", () => {
    for (const captured of [[], ["x"]]) {
      const source: FlowRecordSelection = { ...selected(), reads: { status: "supplied", source: { kind: "caller-supplied", lookup: () => captured } } };
      const walk = buildSelectedTraceWalk(source, "out", { maxDepth: 0 });
      expect(walk.readsAvailable).toBe(captured.length > 0);
      expect(walk.evidence?.readsCoverage).toBeUndefined();
      expect(formatTraceWalk(walk, () => null)).toContain("Read coverage is unknown");
      expect(formatTraceWalk(walk, () => null)).not.toContain("reads nothing");
    }
  });
  it("never borrows a root writer or read tree for a child with colliding execution IDs", () => {
    const root = selected([commit("seed#0", "r", 1), commit("same#1", "x", 1)], { runtimeStageId: "same#1", stageReads: { r: 1 } });
    const child: FlowRecordSelection = { sourceId: "child", format: "tree-context", record: {
      history: [commit("seed#0", "other", 2), commit("same#1", "x", 2)],
      stageContexts: { runtimeStageId: "same#1", stageReads: { external: 2 } },
    }, reads: { status: "unknown" } };
    expect(buildSelectedTraceWalk(root, "x").stops[0].ingredients[0].writerCommitIdx).toBe(0);
    const answer = buildSelectedTraceWalk(child, "x");
    expect(answer.evidence?.sourceId).toBe("child");
    expect(answer.stops).toHaveLength(1);
    expect(answer.stops[0].ingredients).toEqual([{ key: "external", writerRuntimeStageId: null, writerStageName: null, writerCommitIdx: null }]);
  });
});
