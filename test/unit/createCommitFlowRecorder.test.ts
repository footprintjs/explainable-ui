/**
 * L8.2 — `createCommitFlowRecorder` 7-pattern test matrix.
 *
 * Test discipline carried forward from L8.1 panel reviews:
 *   - Required structure handle → throws (Unit)
 *   - Microtask-batched listener → tests `await Promise.resolve()`
 *   - Cycle defense on backtraceDataFlow (Security/ROI)
 *   - reset() preserves structural data, clears runtime
 *   - Loop iteration matching: runtimePrevIds[N] points at iter N's
 *     branches, NOT iter 0's
 *   - Null (not undefined) for missing data-dep sources
 *   - findLastWriter "strictly-before" rule (invariant I2)
 */

import { describe, it, expect, vi } from "vitest";
import {
  createCommitFlowRecorder,
  backtraceDataFlow,
  type CommitFlowIndex,
} from "../../src/components/FlowchartView/createCommitFlowRecorder";
import { createTraceStructureRecorder } from "../../src/components/FlowchartView/traceStructureRecorder";
import { asRuntimeStageId } from "../../src/components/FlowchartView/_internal/keys";

const spec = (id: string, name: string, extra: Record<string, unknown> = {}) => ({
  id,
  name,
  type: "stage" as const,
  ...extra,
});

/** Fork sample fixture mirroring the playground example. */
function forkFixture() {
  const trace = createTraceStructureRecorder();
  const r = trace.recorder;
  r.onStageAdded!({ stageId: "LoadOrder", name: "LoadOrder", type: "stage", spec: spec("LoadOrder", "LoadOrder") });
  r.onStageAdded!({ stageId: "CheckInventory", name: "CheckInventory", type: "stage", spec: spec("CheckInventory", "CheckInventory") });
  r.onEdgeAdded!({ from: "LoadOrder", to: "CheckInventory", kind: "fork-branch" });
  r.onStageAdded!({ stageId: "RunFraudCheck", name: "RunFraudCheck", type: "stage", spec: spec("RunFraudCheck", "RunFraudCheck") });
  r.onEdgeAdded!({ from: "LoadOrder", to: "RunFraudCheck", kind: "fork-branch" });
  r.onStageAdded!({ stageId: "FinalizeOrder", name: "FinalizeOrder", type: "stage", spec: spec("FinalizeOrder", "FinalizeOrder") });
  r.onEdgeAdded!({ from: "CheckInventory", to: "FinalizeOrder", kind: "next" });
  r.onEdgeAdded!({ from: "RunFraudCheck", to: "FinalizeOrder", kind: "next" });
  return trace;
}

/** Helper: fire a commit event. */
function fireCommit(
  handle: ReturnType<typeof createCommitFlowRecorder>,
  rsid: string,
  updates: Record<string, unknown> = {},
  reads: string[] = [],
): void {
  handle.recorder.onCommit!({
    stage: rsid.split("#")[0],
    runtimeStageId: rsid,
    updates,
    reads,
  });
}

// ── 1. Unit ────────────────────────────────────────────────────────────────

describe("createCommitFlowRecorder — unit", () => {
  it("returns a handle with the canonical translator shape", () => {
    const trace = createTraceStructureRecorder();
    const cf = createCommitFlowRecorder({ structure: trace });
    expect(cf.recorder).toBeDefined();
    expect(cf.recorder.id).toBe("commit-flow");
    expect(cf.getIndex).toBeInstanceOf(Function);
    expect(cf.subscribe).toBeInstanceOf(Function);
    expect(cf.version).toBeInstanceOf(Function);
    expect(cf.reset).toBeInstanceOf(Function);
  });

  it("throws if structure handle is missing (required option)", () => {
    expect(() =>
      // @ts-expect-error — structure intentionally omitted
      createCommitFlowRecorder({}),
    ).toThrow(/structure.*required/i);
  });

  it("custom id is preserved", () => {
    const trace = createTraceStructureRecorder();
    const cf = createCommitFlowRecorder({ structure: trace, id: "my-commits" });
    expect(cf.recorder.id).toBe("my-commits");
  });

  it("empty graph + no commits → empty index", () => {
    const trace = createTraceStructureRecorder();
    const cf = createCommitFlowRecorder({ structure: trace });
    const idx = cf.getIndex();
    expect(idx.commits).toEqual([]);
    expect(idx.byRuntimeStageId.size).toBe(0);
    expect(idx.dataEdges).toEqual([]);
  });

  it("onCommit without runtimeStageId is a dev-warn no-op (does NOT crash)", () => {
    const trace = createTraceStructureRecorder();
    const cf = createCommitFlowRecorder({ structure: trace });
    expect(() =>
      cf.recorder.onCommit!({
        stage: "ghost",
        updates: {},
        reads: [],
      }),
    ).not.toThrow();
    expect(cf.getIndex().commits).toHaveLength(0);
  });
});

// ── 2. Functional (fork sample) ────────────────────────────────────────────

describe("createCommitFlowRecorder — functional", () => {
  it("each onCommit produces one CommitView keyed by runtimeStageId", () => {
    const trace = forkFixture();
    const cf = createCommitFlowRecorder({ structure: trace });
    fireCommit(cf, "LoadOrder#0", { order: "ORD-001" }, []);
    fireCommit(cf, "CheckInventory#1", { inStock: true }, ["order"]);
    fireCommit(cf, "RunFraudCheck#2", { fraudCleared: true }, ["order"]);
    fireCommit(cf, "FinalizeOrder#3", { orderStatus: "confirmed" }, ["inStock", "fraudCleared"]);

    const idx = cf.getIndex();
    expect(idx.commits).toHaveLength(4);
    expect(idx.byRuntimeStageId.size).toBe(4);
    expect(idx.byRuntimeStageId.get(asRuntimeStageId("FinalizeOrder#3"))?.stageId).toBe("FinalizeOrder");
  });

  it("structuralPrevIds/NextIds project from the structure translator", () => {
    const trace = forkFixture();
    const cf = createCommitFlowRecorder({ structure: trace });
    fireCommit(cf, "LoadOrder#0", { order: "ORD-001" }, []);
    fireCommit(cf, "CheckInventory#1", { inStock: true }, ["order"]);
    fireCommit(cf, "RunFraudCheck#2", { fraudCleared: true }, ["order"]);
    fireCommit(cf, "FinalizeOrder#3", { orderStatus: "confirmed" }, ["inStock", "fraudCleared"]);

    const finalize = cf.getIndex().byRuntimeStageId.get(asRuntimeStageId("FinalizeOrder#3"))!;
    expect(finalize.structuralPrevIds.sort()).toEqual(["CheckInventory", "RunFraudCheck"]);
    expect(finalize.structuralNextIds).toEqual([]);

    const load = cf.getIndex().byRuntimeStageId.get(asRuntimeStageId("LoadOrder#0"))!;
    expect(load.structuralPrevIds).toEqual([]);
    expect(load.structuralNextIds.sort()).toEqual(["CheckInventory", "RunFraudCheck"]);
  });

  it("runtimePrevIds: fork-merge case returns BOTH parallel branch commits", () => {
    const trace = forkFixture();
    const cf = createCommitFlowRecorder({ structure: trace });
    fireCommit(cf, "LoadOrder#0");
    fireCommit(cf, "CheckInventory#1");
    fireCommit(cf, "RunFraudCheck#2");
    fireCommit(cf, "FinalizeOrder#3");

    const finalize = cf.getIndex().byRuntimeStageId.get(asRuntimeStageId("FinalizeOrder#3"))!;
    expect(finalize.runtimePrevIds.sort()).toEqual(["CheckInventory#1", "RunFraudCheck#2"]);
  });

  it("runtimeNextIds: from LoadOrder, returns both branches' soonest commits", () => {
    const trace = forkFixture();
    const cf = createCommitFlowRecorder({ structure: trace });
    fireCommit(cf, "LoadOrder#0");
    fireCommit(cf, "CheckInventory#1");
    fireCommit(cf, "RunFraudCheck#2");

    const load = cf.getIndex().byRuntimeStageId.get(asRuntimeStageId("LoadOrder#0"))!;
    expect(load.runtimeNextIds.sort()).toEqual(["CheckInventory#1", "RunFraudCheck#2"]);
  });

  it("dataDependencies: per-read-key findLastWriter populates each entry", () => {
    const trace = forkFixture();
    const cf = createCommitFlowRecorder({ structure: trace });
    fireCommit(cf, "LoadOrder#0", { order: "ORD-001" });
    fireCommit(cf, "CheckInventory#1", { inStock: true }, ["order"]);
    fireCommit(cf, "RunFraudCheck#2", { fraudCleared: true }, ["order"]);
    fireCommit(
      cf,
      "FinalizeOrder#3",
      { orderStatus: "confirmed" },
      ["inStock", "fraudCleared"],
    );

    const finalize = cf.getIndex().byRuntimeStageId.get(asRuntimeStageId("FinalizeOrder#3"))!;
    const inStockDep = finalize.dataDependencies.find((d) => d.key === "inStock")!;
    const fraudDep = finalize.dataDependencies.find((d) => d.key === "fraudCleared")!;
    expect(inStockDep.sourceRuntimeStageId).toBe("CheckInventory#1");
    expect(inStockDep.sourceCommitIdx).toBe(1);
    expect(fraudDep.sourceRuntimeStageId).toBe("RunFraudCheck#2");
    expect(fraudDep.sourceCommitIdx).toBe(2);
  });

  it("dataDependencies: read of a never-written key returns NULL source (not undefined)", () => {
    const trace = forkFixture();
    const cf = createCommitFlowRecorder({ structure: trace });
    fireCommit(cf, "LoadOrder#0", { order: "ORD-001" }, ["mysteryKey"]);

    const load = cf.getIndex().byRuntimeStageId.get(asRuntimeStageId("LoadOrder#0"))!;
    const mysteryDep = load.dataDependencies.find((d) => d.key === "mysteryKey")!;
    expect(mysteryDep.sourceRuntimeStageId).toBeNull();
    expect(mysteryDep.sourceCommitIdx).toBeNull();
  });

  it("dataEdges flat list mirrors per-CommitView dataDependencies (only resolved ones)", () => {
    const trace = forkFixture();
    const cf = createCommitFlowRecorder({ structure: trace });
    fireCommit(cf, "LoadOrder#0", { order: "ORD-001" });
    fireCommit(cf, "CheckInventory#1", { inStock: true }, ["order", "missingKey"]);

    const idx = cf.getIndex();
    // Only the resolved (order → inStock commit) edge — `missingKey`
    // has null source and is NOT in dataEdges.
    expect(idx.dataEdges).toEqual([{ from: 0, to: 1, key: "order" }]);
  });
});

// ── 3. Integration (loop semantics + invariant I2 strict-<) ───────────────

describe("createCommitFlowRecorder — integration (loop iterations)", () => {
  it("loop iteration 2: runtimePrevIds points at iter-2 branches, NOT iter-1", () => {
    // Fork sample, looped twice.
    const trace = forkFixture();
    const cf = createCommitFlowRecorder({ structure: trace });
    // Iteration 1
    fireCommit(cf, "LoadOrder#0");
    fireCommit(cf, "CheckInventory#1");
    fireCommit(cf, "RunFraudCheck#2");
    fireCommit(cf, "FinalizeOrder#3");
    // Iteration 2
    fireCommit(cf, "LoadOrder#4");
    fireCommit(cf, "CheckInventory#5");
    fireCommit(cf, "RunFraudCheck#6");
    fireCommit(cf, "FinalizeOrder#7");

    const finalize2 = cf.getIndex().byRuntimeStageId.get(asRuntimeStageId("FinalizeOrder#7"))!;
    expect(finalize2.runtimePrevIds.sort()).toEqual(["CheckInventory#5", "RunFraudCheck#6"]);
    // NOT iter-1's commits.
    expect(finalize2.runtimePrevIds).not.toContain("CheckInventory#1");
    expect(finalize2.runtimePrevIds).not.toContain("RunFraudCheck#2");
  });

  it("findLastWriter uses strict < (invariant I2): a commit reading X cannot match itself as the source", () => {
    const trace = createTraceStructureRecorder();
    trace.recorder.onStageAdded!({ stageId: "a", name: "A", type: "stage", spec: spec("a", "A") });
    const cf = createCommitFlowRecorder({ structure: trace });
    // Single commit that reads + writes the same key.
    fireCommit(cf, "a#0", { x: 1 }, ["x"]);

    const c = cf.getIndex().byRuntimeStageId.get(asRuntimeStageId("a#0"))!;
    // Its read of 'x' should NOT be sourced from itself (strict < rule).
    expect(c.dataDependencies[0]!.sourceCommitIdx).toBeNull();
  });

  it("CommitFlow's version bumps when structure's version bumps", async () => {
    const trace = createTraceStructureRecorder();
    const cf = createCommitFlowRecorder({ structure: trace });
    const v0 = cf.version();
    trace.recorder.onStageAdded!({ stageId: "x", name: "X", type: "stage", spec: spec("x", "X") });
    await Promise.resolve();
    expect(cf.version()).toBeGreaterThan(v0);
  });
});

// ── 4. Property ────────────────────────────────────────────────────────────

describe("createCommitFlowRecorder — property", () => {
  it.each([1, 5, 25, 100])(
    "N linear commits each reading the prior one produces N-1 data edges (N=%d)",
    (n) => {
      const trace = createTraceStructureRecorder();
      const r = trace.recorder;
      // Linear chain of N stages.
      for (let i = 0; i < n; i++) {
        r.onStageAdded!({ stageId: `s${i}`, name: `S${i}`, type: "stage", spec: spec(`s${i}`, `S${i}`) });
        if (i > 0) {
          r.onEdgeAdded!({ from: `s${i - 1}`, to: `s${i}`, kind: "next" });
        }
      }
      const cf = createCommitFlowRecorder({ structure: trace });
      // s0 writes 'k', s1 reads 'k' + writes 'k' (passing forward), s2 reads + writes ...
      for (let i = 0; i < n; i++) {
        fireCommit(cf, `s${i}#${i}`, { k: i }, i > 0 ? ["k"] : []);
      }
      const idx = cf.getIndex();
      // N-1 data edges, each from commit i-1 → commit i.
      expect(idx.dataEdges).toHaveLength(n - 1);
      for (let i = 0; i < idx.dataEdges.length; i++) {
        expect(idx.dataEdges[i]!).toEqual({ from: i, to: i + 1, key: "k" });
      }
    },
  );
});

// ── 5. Security (error isolation + cycle defense) ─────────────────────────

describe("createCommitFlowRecorder — security", () => {
  it("throwing subscriber does NOT cascade to other subscribers", async () => {
    const trace = forkFixture();
    const cf = createCommitFlowRecorder({ structure: trace });
    const bad = vi.fn(() => {
      throw new Error("boom");
    });
    const good = vi.fn();
    cf.subscribe(bad);
    cf.subscribe(good);
    fireCommit(cf, "LoadOrder#0");
    await Promise.resolve();
    expect(good).toHaveBeenCalled();
  });

  it("backtraceDataFlow cycle defense — does not infinite-loop on a malformed cycle", () => {
    // Manually craft a data-cycle by reading + writing the same chain.
    const trace = forkFixture();
    const cf = createCommitFlowRecorder({ structure: trace });
    // a writes 'x', b reads 'x' + writes 'y', a reads 'y' (creates back-edge)
    fireCommit(cf, "LoadOrder#0", { x: 1 });
    fireCommit(cf, "CheckInventory#1", { y: 2 }, ["x"]);
    fireCommit(cf, "LoadOrder#2", { x: 3 }, ["y"]);

    // backtraceDataFlow from the last commit. The visited-set should
    // terminate even though x → y → x is a logical cycle.
    expect(() =>
      backtraceDataFlow(cf.getIndex(), asRuntimeStageId("LoadOrder#2")),
    ).not.toThrow();
  });
});

// ── 6. Performance ─────────────────────────────────────────────────────────

describe("createCommitFlowRecorder — performance", () => {
  // Budget is generous on purpose (CI runners are slower + noisy neighbours): a
  // genuine O(n²) regression on 1000 items would be SECONDS, not ~250ms — so this
  // still catches blow-ups while absorbing runner variance (was 50ms, flaked ~54ms).
  it("1000 commits with linear data flow build index under 250ms", () => {
    const trace = createTraceStructureRecorder();
    const r = trace.recorder;
    for (let i = 0; i < 1000; i++) {
      r.onStageAdded!({ stageId: `s${i}`, name: `S${i}`, type: "stage", spec: spec(`s${i}`, `S${i}`) });
      if (i > 0) r.onEdgeAdded!({ from: `s${i - 1}`, to: `s${i}`, kind: "next" });
    }
    const cf = createCommitFlowRecorder({ structure: trace });
    for (let i = 0; i < 1000; i++) {
      fireCommit(cf, `s${i}#${i}`, { k: i }, i > 0 ? ["k"] : []);
    }
    const t0 = performance.now();
    const idx = cf.getIndex();
    expect(performance.now() - t0).toBeLessThan(250);
    expect(idx.commits).toHaveLength(1000);
  });

  it("repeated getIndex() returns cached result (version unchanged)", () => {
    const trace = forkFixture();
    const cf = createCommitFlowRecorder({ structure: trace });
    fireCommit(cf, "LoadOrder#0");
    const a = cf.getIndex();
    const b = cf.getIndex();
    expect(a).toBe(b); // SAME reference — cache hit
  });

  // L8.2 Panel 5 must-fix: loop-heavy worst-case bench. 100 stages
  // each executed 50× = 5000 commits, each reading the prior commit's
  // write. Verifies the per-key writer-list backward scan stays fast
  // under loop-heavy workloads (the panel's pathological concern).
  it("loop-heavy bench: 100 stages × 50 iter = 5000 commits builds index under 200ms", () => {
    const trace = createTraceStructureRecorder();
    const r = trace.recorder;
    // Linear chain of 100 stages.
    for (let i = 0; i < 100; i++) {
      r.onStageAdded!({ stageId: `s${i}`, name: `S${i}`, type: "stage", spec: spec(`s${i}`, `S${i}`) });
      if (i > 0) r.onEdgeAdded!({ from: `s${i - 1}`, to: `s${i}`, kind: "next" });
    }
    const cf = createCommitFlowRecorder({ structure: trace });
    // 50 loop iterations of the 100-stage chain — total 5000 commits.
    let commitCounter = 0;
    for (let iter = 0; iter < 50; iter++) {
      for (let i = 0; i < 100; i++) {
        fireCommit(
          cf,
          `s${i}#${commitCounter++}`,
          { k: iter * 100 + i },
          i > 0 ? ["k"] : [],
        );
      }
    }
    const t0 = performance.now();
    const idx = cf.getIndex();
    const elapsed = performance.now() - t0;
    expect(elapsed).toBeLessThan(200);
    expect(idx.commits).toHaveLength(5000);
  });
});

// ── 7. ROI (backtraceDataFlow solves the use case) ────────────────────────

describe("backtraceDataFlow — ROI: data-lineage backtrace", () => {
  it("returns the full ancestry chain (oldest first, includes start) for FinalizeOrder", () => {
    const trace = forkFixture();
    const cf = createCommitFlowRecorder({ structure: trace });
    fireCommit(cf, "LoadOrder#0", { order: "ORD-001" });
    fireCommit(cf, "CheckInventory#1", { inStock: true }, ["order"]);
    fireCommit(cf, "RunFraudCheck#2", { fraudCleared: true }, ["order"]);
    fireCommit(cf, "FinalizeOrder#3", { orderStatus: "confirmed" }, ["inStock", "fraudCleared"]);

    const lineage = backtraceDataFlow(
      cf.getIndex(),
      asRuntimeStageId("FinalizeOrder#3"),
    );
    expect(lineage.map((c) => c.runtimeStageId)).toEqual([
      "LoadOrder#0",
      "CheckInventory#1",
      "RunFraudCheck#2",
      "FinalizeOrder#3",
    ]);
  });

  it("backtraceDataFlow returns [start] only when no data dependencies", () => {
    const trace = forkFixture();
    const cf = createCommitFlowRecorder({ structure: trace });
    fireCommit(cf, "LoadOrder#0", { order: "ORD-001" }, []);

    const lineage = backtraceDataFlow(cf.getIndex(), asRuntimeStageId("LoadOrder#0"));
    expect(lineage.map((c) => c.runtimeStageId)).toEqual(["LoadOrder#0"]);
  });

  it("backtraceDataFlow returns [] for unknown runtimeStageId (no throw)", () => {
    const trace = forkFixture();
    const cf = createCommitFlowRecorder({ structure: trace });
    expect(
      backtraceDataFlow(cf.getIndex(), asRuntimeStageId("ghost#99")),
    ).toEqual([]);
  });

  it("partial reads: lineage only includes commits whose writes were ACTUALLY read", () => {
    // FinalizeOrder reads ONLY 'fraudCleared', not 'inStock'. Lineage
    // should include RunFraudCheck (wrote fraudCleared) + LoadOrder
    // (RunFraudCheck reads 'order' from LoadOrder), but NOT CheckInventory.
    const trace = forkFixture();
    const cf = createCommitFlowRecorder({ structure: trace });
    fireCommit(cf, "LoadOrder#0", { order: "ORD-001" });
    fireCommit(cf, "CheckInventory#1", { inStock: true }, ["order"]);
    fireCommit(cf, "RunFraudCheck#2", { fraudCleared: true }, ["order"]);
    fireCommit(cf, "FinalizeOrder#3", { orderStatus: "rejected" }, ["fraudCleared"]);

    const lineage = backtraceDataFlow(
      cf.getIndex(),
      asRuntimeStageId("FinalizeOrder#3"),
    );
    const ids = lineage.map((c) => c.runtimeStageId);
    expect(ids).toContain("FinalizeOrder#3");
    expect(ids).toContain("RunFraudCheck#2");
    expect(ids).toContain("LoadOrder#0"); // RunFraudCheck's source for 'order'
    expect(ids).not.toContain("CheckInventory#1"); // never reached
  });
});

// ── reset() semantics ──────────────────────────────────────────────────────

describe("createCommitFlowRecorder — reset() semantics", () => {
  it("reset() clears commits but PRESERVES structure-derived prev/next on next index build", () => {
    const trace = forkFixture();
    const cf = createCommitFlowRecorder({ structure: trace });
    fireCommit(cf, "LoadOrder#0");
    fireCommit(cf, "CheckInventory#1");
    expect(cf.getIndex().commits).toHaveLength(2);

    cf.reset();

    const after = cf.getIndex();
    expect(after.commits).toHaveLength(0);
    expect(after.byRuntimeStageId.size).toBe(0);
    expect(after.dataEdges).toEqual([]);
    // Fire a fresh commit — its structural projection still works
    // because the structure handle is untouched.
    fireCommit(cf, "LoadOrder#0");
    const fresh = cf.getIndex().byRuntimeStageId.get(asRuntimeStageId("LoadOrder#0"))!;
    expect(fresh.structuralNextIds.sort()).toEqual(["CheckInventory", "RunFraudCheck"]);
  });
});
