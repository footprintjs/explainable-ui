import { describe, expect, it } from "vitest";
import legacyParallel from "../fixtures/backtrack/legacy-parallel.snapshot.json";
import canonicalParallel from "../fixtures/backtrack/parallel35-canonical.snapshot.json";
import captureMetadata from "../fixtures/backtrack/parallel35-canonical.metadata.json";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { buildDataTrace } from "../../src/trace/dataTrace";
import { buildTraceWalk, formatTraceWalk } from "../../src/trace/traceWalk";
import { buildTraceDependencyGraph } from "../../src/trace/traceDependencyGraph";
import { childTraceScope, runHasRecordedReads } from "../../src/trace/traceScope";

type Write = { path: string; readKeys?: string[] };
type Commit = { stage: string; stageId: string; runtimeStageId: string; trace: Write[] };
const path = (...parts: string[]) => parts.join("\u001f");
const items = path("runs", "items", "amount"), delivery = path("runs", "delivery", "amount");

function parallel() {
  return structuredClone(legacyParallel) as unknown as {
    sharedState: { total: number; unitPrice: number; quantity: number; deliveryFee: number; runs: { items: { amount: number }; delivery: { amount: number } } };
    commitLog: Commit[];
    executionTree: unknown;
  };
}
function setTotalReads(snapshot: ReturnType<typeof parallel>, reads: string[]) {
  snapshot.commitLog.find(commit => commit.stage === "Combine")!.trace.find(write => write.path === "total")!.readKeys = reads;
}
const commit = (stage: string, trace: Write[]): Commit => ({ stage, stageId: stage.toLowerCase(), runtimeStageId: `${stage.toLowerCase()}#0`, trace });
function tree(log: Commit[], reads: Record<string, string[]> = {}) {
  let result: object | undefined;
  for (let at = log.length - 1; at >= 0; at--) result = {
    runtimeStageId: log[at].runtimeStageId,
    stageReads: Object.fromEntries((reads[log[at].stage] ?? []).map(key => [key, true])),
    ...(result ? { next: result } : {}),
  };
  return result;
}
function links(walk: ReturnType<typeof buildTraceWalk>) {
  const graph = buildTraceDependencyGraph(walk);
  const nodes = new Map(graph.nodes.map(node => [node.id, node]));
  return graph.edges.map(edge => ({ from: nodes.get(edge.source)!.key, to: nodes.get(edge.target)!.key,
    writer: nodes.get(edge.source)!.stageName, kind: nodes.get(edge.source)!.kind }));
}

describe("exact per-write read prefixes", () => {
  it("follows the actual opt-in producer capture without changing the Combine expression", () => {
    const snapshot = canonicalParallel;
    expect(createHash("sha256").update(readFileSync("test/fixtures/backtrack/parallel35-canonical.snapshot.json")).digest("hex"))
      .toBe(captureMetadata.snapshotSha256);
    expect(snapshot.nestedReadTracking).toBe(true);
    expect(snapshot.sharedState).toMatchObject({ total: 35, runs: { items: { amount: 30 }, delivery: { amount: 5 } } });
    const walk = buildTraceWalk(snapshot.commitLog, snapshot.executionTree, "total", {
      scope: { invocationPath: [], nestedReadTracking: snapshot.nestedReadTracking === true ? true : undefined },
    });
    expect(walk.stops.map(stop => [stop.stageName, stop.commitIdx])).toEqual([
      ["Combine", 6], ["Delivery", 3], ["Items", 2], ["LoadOrder", 0],
    ]);
    expect(links(walk).filter(link => link.kind === "recorded")).toEqual(expect.arrayContaining([
      { from: items, to: "total", writer: "Items", kind: "recorded" },
      { from: delivery, to: "total", writer: "Delivery", kind: "recorded" },
      { from: "unitPrice", to: items, writer: "LoadOrder", kind: "recorded" },
      { from: "quantity", to: items, writer: "LoadOrder", kind: "recorded" },
      { from: "deliveryFee", to: delivery, writer: "LoadOrder", kind: "recorded" },
    ]));
    expect(walk.inputTermini).toEqual(["runs", path("runs", "items"), path("runs", "delivery")]);
    expect(links(walk).filter(link => link.kind === "unresolved").map(link => link.from)).toEqual(walk.inputTermini);
    expect(walk.truncated).toBe(false);
  });
  it("traces the recorded total 35 through Items 30 and Delivery 5 to LoadOrder inputs", () => {
    const snapshot = parallel();
    expect(snapshot.sharedState).toMatchObject({ total: 35, runs: { items: { amount: 30 }, delivery: { amount: 5 } } });
    setTotalReads(snapshot, [items, delivery]);
    const walk = buildTraceWalk(snapshot.commitLog, snapshot.executionTree, "total", { scope: { invocationPath: [], nestedReadTracking: true } });
    expect(walk.stops.map(stop => stop.stageName)).toEqual(["Combine", "Delivery", "Items", "LoadOrder"]);
    expect(walk.stops[0].ingredients.map(input => [input.key, input.writerStageName])).toEqual([[items, "Items"], [delivery, "Delivery"]]);
    expect(walk.stops.find(stop => stop.stageName === "Items")!.commitIdx).toBe(2); // Empty repeat bookend is at 4.
    expect(walk.stops.find(stop => stop.stageName === "Delivery")!.commitIdx).toBe(3); // Empty repeat bookend is at 5.
    const itemVisit = snapshot.commitLog.find(commit => commit.stage === "Items" && commit.trace.length)!.runtimeStageId;
    expect(buildDataTrace(snapshot.commitLog, snapshot.executionTree, itemVisit, 10, 50, items, { nestedReadTracking: true }).frames[0])
      .toMatchObject({ commitIdx: 2, keysWritten: [items], readKeys: ["unitPrice", "quantity"] });
    expect(links(walk)).toEqual(expect.arrayContaining([
      { from: items, to: "total", writer: "Items", kind: "recorded" },
      { from: delivery, to: "total", writer: "Delivery", kind: "recorded" },
      { from: "unitPrice", to: items, writer: "LoadOrder", kind: "recorded" },
      { from: "quantity", to: items, writer: "LoadOrder", kind: "recorded" },
      { from: "deliveryFee", to: delivery, writer: "LoadOrder", kind: "recorded" },
    ]));
    expect(links(walk)).toHaveLength(5);
    expect(walk.inputTermini).toEqual([]);
    expect(formatTraceWalk(walk, () => null)).toContain("runs › items › amount (← Items)");
    expect(formatTraceWalk(walk, () => null)).not.toContain("\u001f");
  });

  it("retains actual root and intermediate reads as unresolved alongside exact leaf writers", () => {
    const snapshot = parallel();
    const intermediate = ["runs", path("runs", "items"), path("runs", "delivery")];
    setTotalReads(snapshot, [intermediate[0], intermediate[1], items, intermediate[2], delivery]);
    const walk = buildTraceWalk(snapshot.commitLog, snapshot.executionTree, "total", { scope: { invocationPath: [], nestedReadTracking: true } });
    expect(walk.inputTermini).toEqual(intermediate);
    expect(walk.stops[0].ingredients.filter(input => input.writerRuntimeStageId === null).map(input => input.key)).toEqual(intermediate);
    expect(links(walk).filter(link => link.kind === "unresolved").map(link => link.from)).toEqual(intermediate);
    expect(links(walk).filter(link => link.to === "total" && link.kind === "recorded").map(link => link.writer)).toEqual(["Items", "Delivery"]);
  });

  it("keeps the old runs-only capture coarse instead of guessing descendant writers", () => {
    const snapshot = parallel();
    const walk = buildTraceWalk(snapshot.commitLog, snapshot.executionTree, "total");
    expect(walk.stops.map(stop => stop.stageName)).toEqual(["Combine"]);
    expect(walk.inputTermini).toEqual(["runs"]);
    expect(links(walk)).toEqual([{ from: "runs", to: "total", writer: null, kind: "unresolved" }]);
  });

  it("does not interpret dot-joined legacy read labels as canonical paths", () => {
    const snapshot = parallel();
    setTotalReads(snapshot, ["runs.items.amount", "runs.delivery.amount"]);
    const walk = buildTraceWalk(snapshot.commitLog, snapshot.executionTree, "total");
    expect(walk.stops.map(stop => stop.stageName)).toEqual(["Combine"]);
    expect(walk.inputTermini).toEqual(["runs.items.amount", "runs.delivery.amount"]);
  });

  it("withholds a legacy dotted collision even when a literal-dot local writer exists", () => {
    const log = [commit("Literal", [{ path: "a.b", readKeys: [] }]),
      commit("Nested", [{ path: path("a", "b"), readKeys: [] }]),
      commit("Use", [{ path: "answer", readKeys: ["a.b"] }])];
    const executionTree = tree(log, { Use: ["a.b"] });
    const legacy = buildTraceWalk(log, executionTree, "answer");
    expect(legacy.stops.map(stop => stop.stageName)).toEqual(["Use"]);
    expect(legacy.stops[0].ingredients[0]).toMatchObject({ key: "a.b", writerRuntimeStageId: null,
      unresolvedReason: "ambiguous-read-path" });
    expect(formatTraceWalk(legacy, () => null)).toContain("read path encoding is ambiguous; source unknown");
    expect(formatTraceWalk(legacy, () => null)).not.toContain("← Literal");
    const canonical = buildTraceWalk(log, executionTree, "answer", { scope: { invocationPath: [], nestedReadTracking: true } });
    expect(canonical.stops.map(stop => stop.stageName)).toEqual(["Use", "Literal"]);
    delete log[2].trace[0].readKeys;
    const stageFallback = buildTraceWalk(log, executionTree, "answer", { scope: { invocationPath: [], nestedReadTracking: true } });
    expect(stageFallback.stops.map(stop => stop.stageName)).toEqual(["Use"]);
    expect(stageFallback.stops[0].ingredients[0].unresolvedReason).toBe("ambiguous-read-path");
  });

  it("keeps canonical and ambiguous uses of the same dotted label on their own outputs", () => {
    const log = [commit("Literal", [{ path: "a.b", readKeys: [] }]),
      commit("Both", [{ path: "first", readKeys: ["a.b"] }, { path: "second" }]),
      commit("Join", [{ path: "total", readKeys: ["first", "second"] }])];
    const walk = buildTraceWalk(log, tree(log, { Both: ["a.b"] }), "total",
      { scope: { invocationPath: [], nestedReadTracking: true } });
    expect(links(walk)).toEqual(expect.arrayContaining([
      { from: "a.b", to: "first", writer: "Literal", kind: "recorded" },
      { from: "a.b", to: "second", writer: null, kind: "unresolved" },
    ]));
    expect(links(walk).some(link => link.to === "second" && link.writer === "Literal")).toBe(false);
  });

  it("withholds a legacy scope-local flat read instead of choosing an unrelated root writer", () => {
    const local = path("runs", "items", "x"), total = path("runs", "items", "total");
    const log = [commit("Global", [{ path: "x", readKeys: [] }]),
      commit("Local", [{ path: local, readKeys: [] }]),
      commit("Use", [{ path: total, readKeys: ["x"] }])];
    Object.assign(log[0], { overwrite: { x: 1 } });
    Object.assign(log[1], { overwrite: { runs: { items: { x: 30 } } } });
    // Actual legacy read value is 30, but its label `x` cannot identify that writer.
    const executionTree = { runtimeStageId: "global#0", next: { runtimeStageId: "local#0",
      next: { runtimeStageId: "use#0", stageReads: { x: 30 } } } };
    const legacy = buildTraceWalk(log, executionTree, total);
    expect(legacy.stops.map(stop => stop.stageName)).toEqual(["Use"]);
    expect(legacy.stops[0].ingredients[0]).toMatchObject({ key: "x", writerRuntimeStageId: null,
      unresolvedReason: "legacy-address-unknown" });
    expect(formatTraceWalk(legacy, () => null)).toContain("legacy read address is unknown; source unknown");
    expect(buildDataTrace(log, executionTree, "use#0").frames.map(frame => frame.stageName)).toEqual(["Use"]);
    delete log[2].trace[0].readKeys;
    expect(buildTraceWalk(log, executionTree, total).stops[0].ingredients[0].unresolvedReason).toBe("legacy-address-unknown");
    expect(buildTraceWalk(log, executionTree, total, { scope: { invocationPath: [], nestedReadTracking: true } })
      .stops[0].ingredients[0].unresolvedReason).toBe("legacy-address-unknown");
    log[2].trace[0].readKeys = [local];
    const canonical = buildTraceWalk(log, executionTree, total, { scope: { invocationPath: [], nestedReadTracking: true } });
    expect(canonical.stops.map(stop => stop.stageName)).toEqual(["Use", "Local"]);
    expect(canonical.stops[0].ingredients[0].key).toBe(local);
  });

  it("keeps a legacy root fallback unknown across a nested writer boundary until capture attests the address", () => {
    const total = path("runs", "items", "total");
    const log = [commit("Global", [{ path: "x", readKeys: [] }]), commit("Use", [{ path: total, readKeys: ["x"] }])];
    const legacy = buildTraceWalk(log, tree(log, { Use: ["x"] }), total);
    expect(legacy.stops.map(stop => stop.stageName)).toEqual(["Use"]);
    expect(legacy.stops[0].ingredients[0].unresolvedReason).toBe("legacy-address-unknown");
    const canonical = buildTraceWalk(log, tree(log), total, { scope: { invocationPath: [], nestedReadTracking: true } });
    expect(canonical.stops.map(stop => stop.stageName)).toEqual(["Use", "Global"]);
  });

  it("distinguishes a captured empty prefix from absent legacy readKeys", () => {
    const log = [commit("Seed", [{ path: "x", readKeys: [] }]), commit("Use", [{ path: "answer", readKeys: [] }])];
    const executionTree = tree(log, { Use: ["x"] });
    const empty = buildTraceWalk(log, executionTree, "answer");
    expect(empty.stops.map(stop => stop.stageName)).toEqual(["Use"]);
    expect(empty.stops[0].ingredients).toEqual([]);
    expect(empty.readsAvailable).toBe(true);
    delete log[1].trace[0].readKeys;
    const legacy = buildTraceWalk(log, executionTree, "answer");
    expect(legacy.stops.map(stop => stop.stageName)).toEqual(["Use", "Seed"]);
  });

  it("does not attach B's later read prefix to A in the same commit", () => {
    const log = [commit("X", [{ path: "x", readKeys: [] }]), commit("Z", [{ path: "z", readKeys: [] }]),
      commit("Both", [{ path: "a", readKeys: ["x"] }, { path: "b", readKeys: ["x", "z"] }]),
      commit("Join", [{ path: "total", readKeys: ["a", "b"] }])];
    const executionTree = tree(log, { Both: ["x", "z"], Join: ["a", "b"] });
    const a = buildTraceWalk(log, executionTree, "a");
    expect(a.stops.map(stop => stop.stageName)).toEqual(["Both", "X"]);
    expect(a.stops[0].ingredients.map(input => input.key)).toEqual(["x"]);
    const b = buildTraceWalk(log, executionTree, "b");
    expect(b.stops.map(stop => stop.stageName)).toEqual(["Both", "Z", "X"]);
    const total = buildTraceWalk(log, executionTree, "total");
    expect(total.stops.find(stop => stop.stageName === "Both")!.ingredients.map(input => input.key)).toEqual(["x", "z"]);
    expect(links(total)).toEqual(expect.arrayContaining([
      { from: "x", to: "a", writer: "X", kind: "recorded" },
      { from: "x", to: "b", writer: "X", kind: "recorded" },
      { from: "z", to: "b", writer: "Z", kind: "recorded" },
    ]));
    expect(links(total).some(link => link.from === "z" && link.to === "a")).toBe(false);
  });

  it("preserves exclusive cutoffs and selects the final exact write of a path", () => {
    const log = [commit("X", [{ path: "x", readKeys: [] }]), commit("Z", [{ path: "z", readKeys: [] }]),
      commit("Use", [{ path: "answer", readKeys: ["z"] }, { path: "answer", readKeys: ["z", "x"] }])];
    const executionTree = tree(log);
    expect(buildTraceWalk(log, executionTree, "answer", { beforeCommitIdx: 2 }).missing?.reason).toBe("not-yet-written");
    expect(buildTraceWalk(log, executionTree, "answer").stops.map(stop => stop.stageName)).toEqual(["Use", "Z", "X"]);
    expect(buildDataTrace(log, executionTree, "use#0", 10, 50, "answer").frames.map(frame => frame.stageName)).toEqual(["Use", "Z", "X"]);
    expect(buildDataTrace(log, executionTree, "use#0", 10, 50, "missing").frames).toEqual([]);
  });

  it("admits per-write read coverage without stage values and retains it in a child scope", () => {
    const key = path("input", "value");
    const log = [commit("Load", [{ path: key, readKeys: [] }]), commit("Use", [{ path: "answer", readKeys: [key] }])];
    const executionTree = tree(log);
    expect(runHasRecordedReads({ commitLog: log, executionTree })).toBe(true);
    const result = { treeContext: { history: log, stageContexts: executionTree } };
    const selected = childTraceScope(result, ["mount#0"], undefined, true);
    expect(selected.availability).toEqual({ ok: true });
    expect(selected.readsAvailable).toBe(true);
    expect(selected.nestedReadTracking).toBe(true);
    expect((selected.commitLog as Commit[])[1].trace[0].readKeys).toEqual([key]);
    expect(buildTraceWalk(selected.commitLog, selected.executionTree, "answer", { scope: { invocationPath: selected.invocationPath,
      readsAvailable: selected.readsAvailable } }).stops.map(stop => stop.stageName)).toEqual(["Use", "Load"]);
  });

  it("refuses malformed per-write evidence without executing its accessors or reading values", () => {
    const log = [commit("Use", [{ path: "answer", readKeys: [] }])];
    const executionTree = tree(log);
    let calls = 0;
    Object.defineProperty(log[0].trace[0], "readKeys", { get() { calls++; throw new Error("must not run"); } });
    expect(buildTraceWalk(log, executionTree, "answer").missing?.reason).toBe("evidence-unavailable");
    expect(buildDataTrace(log, executionTree, "use#0").frames).toEqual([]);
    expect(childTraceScope({ treeContext: { history: log, stageContexts: executionTree } }, ["mount#0"]).availability.ok).toBe(false);
    expect(calls).toBe(0);
    const valueOnly = [commit("Load", [{ path: "answer", readKeys: [] }])];
    Object.defineProperty(valueOnly[0], "overwrite", { get() { calls++; throw new Error("private value"); } });
    expect(buildTraceWalk(valueOnly, tree(valueOnly), "answer").stops).toHaveLength(1);
    expect(calls).toBe(0);
  });

  it("refuses sparse or over-budget read prefixes instead of widening to legacy stage reads", () => {
    for (const readKeys of [Array<string>(1), Array<string>(100_001), ["x", 3]]) {
      const log = [commit("Seed", [{ path: "x", readKeys: [] }]), commit("Use", [{ path: "answer" }])];
      Object.assign(log[1].trace[0], { readKeys });
      expect(buildTraceWalk(log, tree(log, { Use: ["x"] }), "answer").missing?.reason).toBe("evidence-unavailable");
      expect(buildDataTrace(log, tree(log, { Use: ["x"] }), "use#0").frames).toEqual([]);
    }
  });
});
