/**
 * buildTraceWalk — the Same-Rail Rewind walk (variable-anchored backward
 * slice, linearized reverse-time so ONE slider drives it).
 *
 * What is being pinned:
 * 1. THE topological guarantee the whole design rests on: reverse commit
 *    order visits BOTH parents of a fork with one monotone button — the
 *    diamond fixture proves no branch-choosing UI is needed.
 * 2. Ingredient-following = re-anchoring (buildTraceWalk(K, {before})) —
 *    one function, no traversal modes.
 * 3. Honest absence has TWO truthful sentences: 'never-written' (checked
 *    against the FULL log) vs 'not-yet-written' (a cutoff artifact) —
 *    conflating them asserts a falsehood.
 * 4. Loop iterations are distinct stops with pass numbers; run-input
 *    termini are named, never invented as sources.
 * 5. formatTraceWalk is the parity artifact: [Copy story] and an LLM tool
 *    emit the same string.
 */

import { describe, expect, it } from "vitest";

import {
  buildTraceWalk,
  formatTraceWalk,
} from "../../src/components/ExplainableShell/_internal/traceWalk";

// ── Fixture builders (duck-typed snapshot shapes, as dataTrace.test) ────

function commit(stage: string, runtimeStageId: string, writes: string[]) {
  return {
    stage,
    stageId: stage.toLowerCase(),
    runtimeStageId,
    trace: writes.map((path) => ({ path })),
  };
}

function tree(nodes: Array<{ id: string; reads?: string[] }>) {
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

// The diamond: total ← {subtotal (sum), tax (applyTax ← {rate, subtotal})}.
// applyTax has TWO parents — the fork the owner asked about.
const DIAMOND_LOG = [
  commit("Seed", "seed#0", ["rate", "items"]),
  commit("Sum", "sum#1", ["subtotal"]),
  commit("Audit", "audit#2", ["auditNote"]), // NOT a dependency — must be skipped
  commit("ApplyTax", "applyTax#3", ["tax"]),
  commit("ComputeTotal", "computeTotal#4", ["total"]),
];
const DIAMOND_TREE = tree([
  { id: "seed#0" },
  { id: "sum#1", reads: ["items"] },
  { id: "audit#2", reads: ["subtotal"] },
  { id: "applyTax#3", reads: ["rate", "subtotal"] },
  { id: "computeTotal#4", reads: ["subtotal", "tax"] },
]);

describe("buildTraceWalk — the reverse-time walk", () => {
  it("anchors at the last writer and orders stops newest-first (reverse commit order)", () => {
    const walk = buildTraceWalk(DIAMOND_LOG, DIAMOND_TREE, "total");
    expect(walk.missing).toBeNull();
    expect(walk.stops.map((s) => s.runtimeStageId)).toEqual([
      "computeTotal#4",
      "applyTax#3",
      "sum#1",
      "seed#0",
    ]);
    // audit#2 wrote nothing the value depends on — not a stop.
    expect(walk.stops.some((s) => s.runtimeStageId === "audit#2")).toBe(false);
  });

  it("visits BOTH parents of a fork with the one monotone order (the diamond guarantee)", () => {
    const walk = buildTraceWalk(DIAMOND_LOG, DIAMOND_TREE, "total");
    const fork = walk.stops.find((s) => s.runtimeStageId === "applyTax#3")!;
    expect(fork.ingredients.map((i) => i.key).sort()).toEqual(["rate", "subtotal"]);
    // Both parents appear LATER in the walk — no stop is ever skipped.
    const order = walk.stops.map((s) => s.runtimeStageId);
    expect(order.indexOf("sum#1")).toBeGreaterThan(order.indexOf("applyTax#3"));
    expect(order.indexOf("seed#0")).toBeGreaterThan(order.indexOf("applyTax#3"));
  });

  it("resolves each ingredient to its writer; contributedKeys derive from ingredient edges", () => {
    const walk = buildTraceWalk(DIAMOND_LOG, DIAMOND_TREE, "total");
    const anchor = walk.stops[0];
    expect(anchor.contributedKeys).toEqual(["total"]);
    const bySid = new Map(walk.stops.map((s) => [s.runtimeStageId, s]));
    // sum#1 feeds BOTH computeTotal and applyTax via `subtotal`.
    expect(bySid.get("sum#1")!.contributedKeys).toEqual(["subtotal"]);
    // seed#0 contributed `rate` (to applyTax); `items` (to sum) too.
    expect(bySid.get("seed#0")!.contributedKeys.sort()).toEqual(["items", "rate"]);
    const tax = anchor.ingredients.find((i) => i.key === "tax")!;
    expect(tax.writerRuntimeStageId).toBe("applyTax#3");
    expect(tax.writerStageName).toBe("ApplyTax");
  });

  it("names run-input termini instead of inventing sources", () => {
    // sum reads `items` written by seed; seed itself reads `config`, which
    // NOTHING wrote — a run input.
    const log = [commit("Seed", "seed#0", ["items"]), commit("Sum", "sum#1", ["subtotal"])];
    const t = tree([
      { id: "seed#0", reads: ["config"] },
      { id: "sum#1", reads: ["items"] },
    ]);
    const walk = buildTraceWalk(log, t, "subtotal");
    expect(walk.inputTermini).toEqual(["config"]);
    const seed = walk.stops.find((s) => s.runtimeStageId === "seed#0")!;
    expect(seed.ingredients[0]).toMatchObject({ key: "config", writerRuntimeStageId: null });
  });

  it("ingredient-following IS re-anchoring: follow `subtotal` at applyTax = walk(subtotal, before applyTax)", () => {
    const walk = buildTraceWalk(DIAMOND_LOG, DIAMOND_TREE, "total");
    const fork = walk.stops.find((s) => s.runtimeStageId === "applyTax#3")!;
    const sub = buildTraceWalk(DIAMOND_LOG, DIAMOND_TREE, "subtotal", {
      beforeCommitIdx: fork.commitIdx,
    });
    expect(sub.missing).toBeNull();
    expect(sub.stops[0].runtimeStageId).toBe("sum#1"); // the ingredient's writer is the new anchor
    // The sub-walk is the ingredient's upstream cone only — applyTax/computeTotal are gone.
    expect(sub.stops.every((s) => s.commitIdx < fork.commitIdx)).toBe(true);
  });
});

describe("buildTraceWalk — honest absence (two truthful sentences)", () => {
  it("'never-written': no commit in the WHOLE log wrote the key", () => {
    const walk = buildTraceWalk(DIAMOND_LOG, DIAMOND_TREE, "phantom");
    expect(walk.stops).toHaveLength(0);
    expect(walk.missing).toEqual({ reason: "never-written" });
  });

  it("'not-yet-written': a later commit writes it — the cutoff, not the run, is why it's absent", () => {
    const walk = buildTraceWalk(DIAMOND_LOG, DIAMOND_TREE, "total", { beforeCommitIdx: 4 });
    expect(walk.stops).toHaveLength(0);
    expect(walk.missing).toMatchObject({
      reason: "not-yet-written",
      firstWriteCommitIdx: 4,
      firstWriterStageName: "ComputeTotal",
    });
  });
});

describe("buildTraceWalk — loops, honesty flags, budgets", () => {
  it("loop iterations are distinct stops with time-ordered pass numbers", () => {
    // acc#1 and acc#3 both write `sum`; each pass reads the previous `sum`.
    const log = [
      commit("Seed", "seed#0", ["sum"]),
      commit("Acc", "acc#1", ["sum"]),
      commit("Tick", "tick#2", ["i"]),
      commit("Acc", "acc#3", ["sum"]),
    ];
    const t = tree([
      { id: "seed#0" },
      { id: "acc#1", reads: ["sum"] },
      { id: "tick#2", reads: ["i"] },
      { id: "acc#3", reads: ["sum"] },
    ]);
    const walk = buildTraceWalk(log, t, "sum");
    expect(walk.stops.map((s) => s.runtimeStageId)).toEqual(["acc#3", "acc#1", "seed#0"]);
    const passes = new Map(walk.stops.map((s) => [s.runtimeStageId, s.loopPass]));
    expect(passes.get("acc#1")).toBe(1);
    expect(passes.get("acc#3")).toBe(2);
    expect(passes.get("seed#0")).toBe(0); // single visit — no pass label
  });

  it("readsAvailable=false when the tree recorded no reads (unknowable, not absent)", () => {
    const walk = buildTraceWalk(DIAMOND_LOG, tree([{ id: "seed#0" }]), "total");
    expect(walk.readsAvailable).toBe(false);
    expect(walk.stops).toHaveLength(1); // anchor only — the chain is unknowable
  });

  it("flags truncation when the frame budget bites", () => {
    // A 6-link chain with budget 3: k5←k4←k3←k2←k1←k0.
    const log = Array.from({ length: 6 }, (_, i) => commit(`S${i}`, `s${i}#${i}`, [`k${i}`]));
    const t = tree(
      Array.from({ length: 6 }, (_, i) => ({
        id: `s${i}#${i}`,
        reads: i > 0 ? [`k${i - 1}`] : undefined,
      })),
    );
    const walk = buildTraceWalk(log, t, "k5", { maxFrames: 3 });
    expect(walk.stops).toHaveLength(3);
    expect(walk.truncated).toBe(true);
    const full = buildTraceWalk(log, t, "k5");
    expect(full.truncated).toBe(false);
    expect(full.stops).toHaveLength(6);
  });
});

describe("formatTraceWalk — the parity artifact", () => {
  const stepOf = (rsid: string): number | null => {
    const i = DIAMOND_LOG.findIndex((c) => c.runtimeStageId === rsid);
    return i >= 0 ? i + 1 : null;
  };

  it("narrates the walk in walk order with ingredients and termini", () => {
    const walk = buildTraceWalk(DIAMOND_LOG, DIAMOND_TREE, "total");
    const text = formatTraceWalk(walk, stepOf);
    expect(text).toContain("Tracing `total` — 4 stops, newest first.");
    expect(text).toContain("stop 1/4 · step 5 · ComputeTotal wrote `total`");
    expect(text).toContain("subtotal (← Sum, step 2)");
    expect(text).toContain("tax (← ApplyTax, step 4)");
    // Walk order in the text matches the stops array (line order).
    const lines = text.split("\n");
    expect(lines[1]).toContain("ComputeTotal");
    expect(lines[2]).toContain("ApplyTax");
  });

  it("absence renders the exact truthful sentence, not an empty chain", () => {
    const never = buildTraceWalk(DIAMOND_LOG, DIAMOND_TREE, "phantom");
    expect(formatTraceWalk(never, stepOf)).toBe(
      "`phantom` was never written in this run — it arrived with the run's inputs.",
    );
    const notYet = buildTraceWalk(DIAMOND_LOG, DIAMOND_TREE, "total", { beforeCommitIdx: 4 });
    expect(formatTraceWalk(notYet, stepOf)).toContain(
      "has not been written yet at this moment — its first write happens later, at ComputeTotal (step 5).",
    );
  });

  it("carries the honesty flags into the text", () => {
    const noReads = buildTraceWalk(DIAMOND_LOG, tree([{ id: "x#0" }]), "total");
    expect(formatTraceWalk(noReads, stepOf)).toContain("unknowable, not absent");
  });
});
