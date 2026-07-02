/**
 * buildDataTrace — the REAL backward slice behind the shell's Data Trace tab
 * (local mirror of footprintjs' causalChain thin-slice walk).
 *
 * What is being pinned:
 * 1. THE regression this replaced: the old implementation walked the commit
 *    log LINEARLY backwards (idx--) — chronology dressed as causality. The
 *    fan-in fixture here is exactly where it lied: the step BEFORE the
 *    target chronologically is NOT its dependency.
 * 2. Read→write semantics: frames link via the actual read key, transitively.
 * 3. Honesty: reads-unavailable is a flagged state, not "no dependencies".
 */

import { describe, expect, it } from "vitest";

import { buildDataTrace } from "../../src/components/ExplainableShell/_internal/dataTrace";

// ── Fixture builders (duck-typed snapshot shapes) ──────────────────────

function commit(stage: string, runtimeStageId: string, writes: string[]) {
  return {
    stage,
    stageId: stage.toLowerCase(),
    runtimeStageId,
    trace: writes.map((path) => ({ path })),
  };
}

function tree(nodes: Array<{ id: string; reads?: string[] }>) {
  // linear next-chain is enough — the walker only harvests stageReads keys
  let root: Record<string, unknown> | undefined;
  let cur: Record<string, unknown> | undefined;
  for (const n of nodes) {
    const node: Record<string, unknown> = {
      runtimeStageId: n.id,
      ...(n.reads && { stageReads: Object.fromEntries(n.reads.map((k) => [k, 1])) }),
    };
    if (!root) root = node;
    else (cur as Record<string, unknown>).next = node;
    cur = node;
  }
  return root;
}

describe("buildDataTrace — real read→write walk", () => {
  // THE fan-in case: chronological neighbor ≠ dependency.
  //   A#0 writes x · B#1 writes noise · C#2 reads x, writes y
  // Old (linear) walk from C: C → B → A (B falsely blamed).
  // Real walk: C → A only.
  const log = [commit("A", "a#0", ["x"]), commit("B", "b#1", ["noise"]), commit("C", "c#2", ["y"])];
  const t = tree([
    { id: "a#0" },
    { id: "b#1" },
    { id: "c#2", reads: ["x"] },
  ]);

  it("fan-in: links the actual writer, NOT the chronological neighbor", () => {
    const { frames, readsAvailable } = buildDataTrace(log, t, "c#2");
    expect(readsAvailable).toBe(true);
    expect(frames.map((f) => f.runtimeStageId)).toEqual(["c#2", "a#0"]); // no b#1
    expect(frames[1].linkedBy).toBe("x"); // the real edge label
    expect(frames[1].depth).toBe(1);
  });

  it("transitive chains resolve depth by dependency hops", () => {
    const log3 = [
      commit("Seed", "seed#0", ["input"]),
      commit("Process", "process#1", ["processed"]),
      commit("Format", "format#2", ["output"]),
    ];
    const t3 = tree([
      { id: "seed#0" },
      { id: "process#1", reads: ["input"] },
      { id: "format#2", reads: ["processed"] },
    ]);
    const { frames } = buildDataTrace(log3, t3, "format#2");
    expect(frames.map((f) => `${f.runtimeStageId}@${f.depth}`)).toEqual([
      "format#2@0",
      "process#1@1",
      "seed#0@2",
    ]);
    expect(frames.map((f) => f.linkedBy)).toEqual(["", "processed", "input"]);
  });

  it("diamond: shared ancestor appears once (DAG, not a path)", () => {
    const logD = [
      commit("Base", "base#0", ["k"]),
      commit("Left", "left#1", ["l"]),
      commit("Right", "right#2", ["r"]),
      commit("Join", "join#3", ["out"]),
    ];
    const tD = tree([
      { id: "base#0" },
      { id: "left#1", reads: ["k"] },
      { id: "right#2", reads: ["k"] },
      { id: "join#3", reads: ["l", "r"] },
    ]);
    const { frames } = buildDataTrace(logD, tD, "join#3");
    const ids = frames.map((f) => f.runtimeStageId);
    expect(ids).toHaveLength(4);
    expect(new Set(ids).size).toBe(4); // base once, not twice
  });

  it("honesty: no reads anywhere → single frame + readsAvailable false", () => {
    const bare = tree([{ id: "a#0" }, { id: "b#1" }, { id: "c#2" }]); // no stageReads at all
    const { frames, readsAvailable } = buildDataTrace(log, bare, "c#2");
    expect(readsAvailable).toBe(false);
    expect(frames).toHaveLength(1); // NEVER a fabricated chain
    expect(frames[0].runtimeStageId).toBe("c#2");
  });

  it("unknown target / empty log return empty frames without throwing", () => {
    expect(buildDataTrace(log, t, "ghost#9").frames).toEqual([]);
    expect(buildDataTrace([], t, "c#2").frames).toEqual([]);
  });

  it("budgets bound the walk (maxDepth, maxFrames)", () => {
    // a 30-deep chain
    const logN = Array.from({ length: 30 }, (_, i) => commit(`S${i}`, `s${i}#${i}`, [`k${i}`]));
    const tN = tree(Array.from({ length: 30 }, (_, i) => ({ id: `s${i}#${i}`, reads: i > 0 ? [`k${i - 1}`] : [] })));
    const capped = buildDataTrace(logN, tN, "s29#29", 5);
    expect(Math.max(...capped.frames.map((f) => f.depth))).toBe(5);
    const framesCapped = buildDataTrace(logN, tN, "s29#29", 100, 8);
    expect(framesCapped.frames.length).toBeLessThanOrEqual(8);
  });
});
