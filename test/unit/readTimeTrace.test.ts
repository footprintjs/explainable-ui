import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import capture from "../fixtures/backtrack/native-read-time.json";
import { buildTraceWalk, formatTraceWalk } from "../../src/trace/traceWalk";
import { buildDataTrace } from "../../src/trace/dataTrace";
import { buildTraceDependencyGraph } from "../../src/trace/traceDependencyGraph";
import { childTraceScope, type TraceScope } from "../../src/trace/traceScope";
import { projectStageActivity } from "../../src/trace/stageActivity";
import type { StageSnapshot } from "../../src/types";

type Commit = { stage: string; stageId: string; runtimeStageId: string; idx?: number; beganAt?: number; sawUntil?: number;
  trace: { path: string; readKeys?: string[] }[] };
const cases = capture.cases as Record<keyof typeof capture.cases, Commit[]>;
const scope = { invocationPath: [], nestedReadTracking: true as const };
// Identity/read-name tree only; ordering and values come from actual native bundles.
const tree = (log: Commit[]) => {
  const nodes = [...new Map(log.map(commit => [commit.runtimeStageId, {
    runtimeStageId: commit.runtimeStageId,
    stageReads: Object.fromEntries(commit.trace.flatMap(write => write.readKeys ?? []).map(key => [key, true])),
  }])).values()];
  return { ...nodes[0], ...(nodes.length > 1 ? { children: nodes.slice(1) } : {}) };
};
const walk = (log: Commit[], key = "y") => buildTraceWalk(log, tree(log), key, { scope });
const snap = (id: string, memory: Record<string, unknown>): StageSnapshot => ({ runtimeStageId: id,
  stageName: id.split("#")[0], stageLabel: id, memory, narrative: "", startMs: 0, durationMs: 1 });
const activity = (log: Commit[]) => projectStageActivity({ scope: { ...scope, availability: { ok: true },
  readsAvailable: true, mountLabels: new Map(), commitLog: log, executionTree: tree(log) } as TraceScope,
  snapshots: [snap("load#0", { x: 1 }), snap("overwrite#0", { x: 99 }), snap("derive#0", { x: 99, y: 1 })], selectedIndex: 2 });

describe("native read-time source binding", () => {
  it("uses unchanged actual Foottrace bundles and records their public release provenance", () => {
    expect(capture.recordLayer.version).toBe("2.0.0-rc.2");
    expect(createHash("sha256").update(readFileSync("test/fixtures/backtrack/native-read-time.json")).digest("hex"))
      .toBe("0bbca4ea2a4f407398cdd7b9ec6f5f74e32e49360fed63610d36d842ca35fa45");
    expect(cases.began[2]).toMatchObject({ idx: 2, beganAt: 1 });
    expect(cases.overlap[2]).toMatchObject({ idx: 2, beganAt: 1, sawUntil: 2 });
  });

  it("dates a pinned read before the sibling overwrite in walk, stage slice and Activity", () => {
    const log = cases.began;
    const result = walk(log);
    expect(result.stops.map(stop => [stop.stageName, stop.commitIdx])).toEqual([["Derive", 2], ["Load", 0]]);
    expect(result.stops[0].ingredients[0]).toMatchObject({ key: "x", writerStageName: "Load", writerCommitIdx: 0 });
    expect(buildDataTrace(log, tree(log), "derive#0").frames.map(frame => frame.stageName)).toEqual(["Derive", "Load"]);
    const view = activity(log);
    expect(view.availability).toEqual({ ok: true });
    expect(view.reads.find(read => read.key === "x")).toMatchObject({ writer: { stageName: "Load", commitIdx: 0 },
      value: { preview: "1" }, traceTarget: { beforeCommitIdx: 2, kind: "read" } });
    const reader = buildTraceWalk(log, tree(log), "x", { readerCommitIdx: 2, scope });
    expect(reader.stops[0].stageName).toBe("Load");
    // Ordinary time-cutoff questions retain their prior array-position semantics.
    expect(buildTraceWalk(log, tree(log), "x", { beforeCommitIdx: 2, scope }).stops[0].stageName).toBe("Overwrite");
  });

  it("does not date a visit's stage inspection at a later empty continuation", () => {
    const log = [...structuredClone(cases.began), { stage: "Derive", stageId: "derive", runtimeStageId: "derive#0", idx: 3, trace: [], phase: "repeat", overwrite: {}, updates: {}, redactedPaths: [] }];
    expect(buildDataTrace(log, tree(log), "derive#0").frames.map(frame => [frame.stageName, frame.commitIdx]))
      .toEqual([["Derive", 2], ["Load", 0]]);
  });

  it("refuses an ambiguous stage row while exact write targets remain anchored", () => {
    for (const extra of [{}, { phase: "exit", overwrite: { x: 500 } }]) {
      const log = [...structuredClone(cases.began), { stage: "Derive", stageId: "derive", runtimeStageId: "derive#0", idx: 3, trace: [], ...extra }];
      expect(buildDataTrace(log, tree(log), "derive#0").frames).toEqual([]);
      expect(buildDataTrace(log, tree(log), "derive#0", 10, 50, "y").frames.map(frame => frame.stageName)).toEqual(["Derive", "Load"]);
    }
  });

  it("does not choose one source when a recorded key write overlaps the look window", () => {
    const log = cases.overlap, result = walk(log);
    expect(result.stops.map(stop => stop.stageName)).toEqual(["Derive"]);
    expect(result.stops[0].ingredients.find(input => input.key === "x")).toMatchObject({
      writerCommitIdx: null, unresolvedReason: "read-window-ambiguous" });
    expect(buildDataTrace(log, tree(log), "derive#0").frames.map(frame => frame.stageName)).toEqual(["Derive"]);
    expect(activity(log).reads.find(read => read.key === "x")?.writer).toBeNull();
    expect(formatTraceWalk(result, () => null)).toContain("overlaps this read window");
    const graph = buildTraceDependencyGraph(result);
    expect(graph.nodes.find(node => node.key === "x")).toMatchObject({ kind: "unresolved", unresolvedReason: "read-window-ambiguous" });
    expect(graph.nodes.some(node => node.stageName === "Overwrite")).toBe(false);
    const reader = buildTraceWalk(log, tree(log), "x", { readerCommitIdx: 2, scope });
    expect(reader.missing).toMatchObject({ reason: "evidence-unavailable", unresolvedReason: "read-window-ambiguous" });
    expect(formatTraceWalk(reader, () => null)).toContain("overlaps this read window");
    expect(buildTraceDependencyGraph(reader).nodes[0]).toMatchObject({ kind: "unresolved", unresolvedReason: "read-window-ambiguous" });
  });

  it("still binds an unaffected key when only another key was written in the window", () => {
    const result = walk(cases.unrelatedWindow);
    expect(result.stops[0].ingredients.find(input => input.key === "x")?.writerStageName).toBe("Load");
    expect(result.stops[0].ingredients.find(input => input.key === "other")).toMatchObject({ writerCommitIdx: null,
      unresolvedReason: "read-window-ambiguous" });
  });

  it("preserves native indices through mapper removal while keeping cursor indices local", () => {
    const log = cases.mapperOffset;
    const selected = childTraceScope({ treeContext: { history: log, stageContexts: tree(log.slice(1)) } }, ["mount#0"], true, true);
    expect(selected.availability).toEqual({ ok: true });
    expect(selected.commitLog.map(commit => (commit as Commit).idx)).toEqual([1, 2, 3]);
    expect((selected.commitLog[2] as Commit).beganAt).toBe(2);
    const result = buildTraceWalk(selected.commitLog, selected.executionTree, "y", { scope: { invocationPath: selected.invocationPath, nestedReadTracking: true } });
    expect(result.stops.map(stop => [stop.stageName, stop.commitIdx])).toEqual([["Derive", 2], ["Load", 0]]);
  });

  it("refuses unsafe or unmappable timing rather than silently treating it as legacy", () => {
    const mutations: ((log: Commit[]) => void)[] = [
      log => { delete log[0].idx; }, log => { log[1].idx = 0; },
      log => { log[1].idx = 7; log[2].idx = 8; },
      log => { log[2].beganAt = -1; }, log => { log[2].beganAt = 2; },
      log => { log[2].sawUntil = 1; }, log => { log[2].sawUntil = 3; },
      log => { delete log[2].beganAt; log[2].sawUntil = 2; },
      log => { log[0].idx = Number.MAX_SAFE_INTEGER; },
    ];
    for (const mutate of mutations) {
      const log = structuredClone(cases.began); mutate(log);
      expect(walk(log).missing?.reason).toBe("evidence-unavailable");
      expect(buildDataTrace(log, tree(log), "derive#0").frames).toEqual([]);
      expect(childTraceScope({ treeContext: { history: log, stageContexts: tree(log) } }, ["mount#0"], true, true).availability.ok).toBe(false);
    }
    for (const field of ["idx", "beganAt", "sawUntil"]) {
      const log = structuredClone(cases.began); let calls = 0;
      Object.defineProperty(log[2], field, { get() { calls++; throw new Error("must not execute stored code"); } });
      expect(walk(log).missing?.reason).toBe("evidence-unavailable");
      expect(buildDataTrace(log, tree(log), "derive#0").frames).toEqual([]);
      expect(calls).toBe(0);
    }
  });

  it("keeps the prior convention when an old recording has no timing metadata", () => {
    const log = structuredClone(cases.began);
    for (const commit of log) { delete commit.idx; delete commit.beganAt; delete commit.sawUntil; }
    expect(walk(log).stops[0].ingredients[0].writerStageName).toBe("Overwrite");
  });
});

describe("known path replacement is not an exact source", () => {
  it.each(["parentReplacement", "childReplacement", "sameCommitRelated"] as const)("withholds a stale per-path recipe in actual %s bundles", name => {
    const log = cases[name], result = walk(log, "result");
    expect(result.stops.map(stop => stop.stageName)).toEqual(["Derive"]);
    expect(result.stops[0].ingredients[0]).toMatchObject({ writerCommitIdx: null, unresolvedReason: "related-write" });
    expect(buildDataTrace(log, tree(log), "derive#0").frames.map(frame => frame.stageName)).toEqual(["Derive"]);
    expect(formatTraceWalk(result, () => null)).toContain("parent or child path changed");
  });

  it.each(["parentReplacement", "childReplacement", "sameCommitRelated"] as const)("does not anchor a visible variable to a stale exact recipe in %s", name => {
    const log = cases[name];
    const key = log[2].trace[0].readKeys![0];
    const result = buildTraceWalk(log, tree(log), key, { beforeCommitIdx: 2, scope });
    expect(result.stops).toEqual([]);
    expect(result.missing).toMatchObject({ reason: "evidence-unavailable", unresolvedReason: "related-write" });
    expect(formatTraceWalk(result, () => null)).toContain("parent or child path changed");
    expect(buildTraceDependencyGraph(result).nodes[0]).toMatchObject({ kind: "unresolved", unresolvedReason: "related-write" });
    // An earlier exact recipe remains usable before the replacement existed.
    if (name !== "sameCommitRelated") {
      expect(buildTraceWalk(log, tree(log), key, { beforeCommitIdx: 1, scope }).stops[0].stageName).toBe("Load");
    }
  });

  it("does not conflate literal dots or different sibling segments", () => {
    for (const changed of ["cfg.other", "cfg\u001fother"]) {
      const log: Commit[] = [{ stage: "Load", stageId: "load", runtimeStageId: "load#0", trace: [{ path: "cfg\u001famount", readKeys: [] }] },
        { stage: "Other", stageId: "other", runtimeStageId: "other#0", trace: [{ path: changed, readKeys: [] }] },
        { stage: "Derive", stageId: "derive", runtimeStageId: "derive#0", trace: [{ path: "result", readKeys: ["cfg\u001famount"] }] }];
      expect(walk(log, "result").stops.map(stop => stop.stageName)).toEqual(["Derive", "Load"]);
    }
  });

  it("keeps all legacy inputs unknown across a mixed root/nested write boundary", () => {
    const log = cases.legacyMixed;
    for (const key of ["rootout", "runs\u001fbranch\u001flocalout"]) {
      const result = buildTraceWalk(log, tree(log), key);
      expect(result.stops.map(stop => stop.stageName)).toEqual(["Mixed"]);
      expect(result.stops[0].ingredients[0]).toMatchObject({ key: "x", writerCommitIdx: null, unresolvedReason: "legacy-address-unknown" });
    }
  });
});
