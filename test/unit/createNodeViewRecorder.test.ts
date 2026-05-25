/**
 * L8.1 — `createNodeViewRecorder` 7-pattern test matrix.
 *
 * Verifies the NodeView translator + walk helpers correctness:
 *   1. Unit — handle shape + minimal event handling
 *   2. Functional — end-to-end fork sample produces correct per-stage views
 *   3. Integration — composes with structure translator via .data.prevIds
 *   4. Property — N-loop iterations produce N ExecutionRecord entries
 *   5. Security — error isolation; orphan-event devWarn
 *   6. Performance — 1000-stage chart with execs accumulates under 30ms
 *   7. ROI — bi-directional traversal solves the "what fed this commit" use case
 */

import { describe, it, expect, vi } from "vitest";
import {
  createNodeViewRecorder,
  type NodeView,
} from "../../src/components/FlowchartView/createNodeViewRecorder";
import { createTraceStructureRecorder } from "../../src/components/FlowchartView/traceStructureRecorder";
import {
  walkForward,
  walkBackward,
  backtraceStructural,
  forwardtraceStructural,
} from "../../src/components/FlowchartView/walkHelpers";
import { asStageId } from "../../src/components/FlowchartView/_internal/keys";

// ── Test fixtures ──────────────────────────────────────────────────────────

const spec = (id: string, name: string, extra: Record<string, unknown> = {}) => ({
  id,
  name,
  type: "stage" as const,
  ...extra,
});

const tctx = (runtimeStageId: string, iteration = 0) => ({
  runtimeStageId,
  iteration,
});

/** Build a fork sample fixture: LoadOrder → (CheckInventory ∥ RunFraudCheck) → FinalizeOrder. */
function forkFixture() {
  const trace = createTraceStructureRecorder();
  const r = trace.recorder;
  r.onStageAdded!({ stageId: "LoadOrder", name: "LoadOrder", type: "stage", spec: spec("LoadOrder", "LoadOrder") });
  r.onStageAdded!({ stageId: "CheckInventory", name: "CheckInventory", type: "stage", spec: spec("CheckInventory", "CheckInventory") });
  r.onEdgeAdded!({ from: "LoadOrder", to: "CheckInventory", kind: "fork-branch" });
  r.onStageAdded!({ stageId: "RunFraudCheck", name: "RunFraudCheck", type: "stage", spec: spec("RunFraudCheck", "RunFraudCheck") });
  r.onEdgeAdded!({ from: "LoadOrder", to: "RunFraudCheck", kind: "fork-branch" });
  r.onStageAdded!({ stageId: "FinalizeOrder", name: "FinalizeOrder", type: "stage", spec: spec("FinalizeOrder", "FinalizeOrder") });
  // Convergence-expanded edges (post-fix in footprintjs):
  r.onEdgeAdded!({ from: "CheckInventory", to: "FinalizeOrder", kind: "next" });
  r.onEdgeAdded!({ from: "RunFraudCheck", to: "FinalizeOrder", kind: "next" });
  return trace;
}

// ── 1. Unit ────────────────────────────────────────────────────────────────

describe("createNodeViewRecorder — unit", () => {
  it("returns a handle with the canonical translator shape", () => {
    const trace = createTraceStructureRecorder();
    const nv = createNodeViewRecorder({ structure: trace });
    expect(nv.recorder).toBeDefined();
    expect(nv.recorder.id).toBe("node-view");
    expect(nv.getIndex).toBeInstanceOf(Function);
    expect(nv.subscribe).toBeInstanceOf(Function);
    expect(nv.version).toBeInstanceOf(Function);
    expect(nv.reset).toBeInstanceOf(Function);
  });

  it("throws if structure handle is missing (required option)", () => {
    expect(() =>
      // @ts-expect-error — structure intentionally omitted
      createNodeViewRecorder({}),
    ).toThrow(/structure.*required/i);
  });

  it("custom id is preserved", () => {
    const trace = createTraceStructureRecorder();
    const nv = createNodeViewRecorder({ structure: trace, id: "my-node-view" });
    expect(nv.recorder.id).toBe("my-node-view");
  });

  it("empty graph + no runtime events → empty index", () => {
    const trace = createTraceStructureRecorder();
    const nv = createNodeViewRecorder({ structure: trace });
    const idx = nv.getIndex();
    expect(idx.all).toEqual([]);
    expect(idx.byStageId.size).toBe(0);
    expect(idx.byRuntimeStageId.size).toBe(0);
  });
});

// ── 2. Functional ─────────────────────────────────────────────────────────

describe("createNodeViewRecorder — functional (fork sample)", () => {
  it("produces NodeView per stage with correct prevIds/nextIds from structure", () => {
    const trace = forkFixture();
    const nv = createNodeViewRecorder({ structure: trace });
    const idx = nv.getIndex();

    expect(idx.all.map((v) => v.stageId).sort()).toEqual([
      "CheckInventory",
      "FinalizeOrder",
      "LoadOrder",
      "RunFraudCheck",
    ]);

    const finalize = idx.byStageId.get(asStageId("FinalizeOrder"))!;
    expect(finalize.prevIds.sort()).toEqual(["CheckInventory", "RunFraudCheck"]);
    expect(finalize.nextIds).toEqual([]);

    const load = idx.byStageId.get(asStageId("LoadOrder"))!;
    expect(load.prevIds).toEqual([]);
    expect(load.nextIds.sort()).toEqual(["CheckInventory", "RunFraudCheck"]);
  });

  it("Flow.onStageExecuted populates executions[] + visit-data fields", () => {
    const trace = forkFixture();
    const nv = createNodeViewRecorder({ structure: trace });
    nv.recorder.onStageExecuted!({
      stageName: "LoadOrder",
      traversalContext: tctx("LoadOrder#0", 0),
      startTime: 100,
      endTime: 150,
    });
    nv.recorder.onStageExecuted!({
      stageName: "CheckInventory",
      traversalContext: tctx("CheckInventory#1", 0),
      startTime: 150,
      endTime: 180,
    });

    const idx = nv.getIndex();
    const load = idx.byStageId.get(asStageId("LoadOrder"))!;
    expect(load.visitedInRun).toBe(true);
    expect(load.executionCount).toBe(1);
    expect(load.firstExecutedAt).toBe(100);
    expect(load.lastExecutedAt).toBe(150);
    expect(load.totalDurationMs).toBe(50);
    expect(load.errorCount).toBe(0);

    const finalize = idx.byStageId.get(asStageId("FinalizeOrder"))!;
    expect(finalize.visitedInRun).toBe(false);
    expect(finalize.executionCount).toBe(0);
  });

  it("Scope.onCommit populates commitRuntimeStageIds[]", () => {
    const trace = forkFixture();
    const nv = createNodeViewRecorder({ structure: trace });
    nv.recorder.onCommit!({
      stage: "LoadOrder",
      runtimeStageId: "LoadOrder#0",
      updates: { order: { id: "ORD-001" } },
      reads: [],
    });
    nv.recorder.onCommit!({
      stage: "LoadOrder",
      runtimeStageId: "LoadOrder#4", // loop iteration 2
      updates: { order: { id: "ORD-002" } },
      reads: [],
    });
    const idx = nv.getIndex();
    const load = idx.byStageId.get(asStageId("LoadOrder"))!;
    expect(load.commitRuntimeStageIds).toEqual(["LoadOrder#0", "LoadOrder#4"]);
  });

  it("onError attaches errorMessage to most-recent execution + bumps errorCount", () => {
    const trace = forkFixture();
    const nv = createNodeViewRecorder({ structure: trace });
    nv.recorder.onStageExecuted!({
      stageName: "LoadOrder",
      traversalContext: tctx("LoadOrder#0"),
      startTime: 0,
      endTime: 10,
    });
    nv.recorder.onError!({
      stageName: "LoadOrder",
      message: "fetch failed",
      traversalContext: tctx("LoadOrder#0"),
    });
    const idx = nv.getIndex();
    const load = idx.byStageId.get(asStageId("LoadOrder"))!;
    expect(load.errorCount).toBe(1);
    expect(load.executions[0]!.errorMessage).toBe("fetch failed");
  });

  it("byRuntimeStageId maps execution + commit refs back to the same NodeView", () => {
    const trace = forkFixture();
    const nv = createNodeViewRecorder({ structure: trace });
    nv.recorder.onStageExecuted!({
      stageName: "LoadOrder",
      traversalContext: tctx("LoadOrder#0"),
    });
    nv.recorder.onCommit!({
      stage: "LoadOrder",
      runtimeStageId: "LoadOrder#0",
      updates: {},
      reads: [],
    });
    const idx = nv.getIndex();
    const viaStage = idx.byStageId.get(asStageId("LoadOrder"))!;
    const viaRuntime = idx.byRuntimeStageId.get(viaStage.executions[0]!.runtimeStageId)!;
    expect(viaRuntime.stageId).toBe(viaStage.stageId);
  });
});

// ── 3. Integration ────────────────────────────────────────────────────────

describe("createNodeViewRecorder — integration (composes with structure translator)", () => {
  it("reflects late-added structure stages on next getIndex() call", () => {
    const trace = createTraceStructureRecorder();
    const nv = createNodeViewRecorder({ structure: trace });
    expect(nv.getIndex().all).toEqual([]);

    trace.recorder.onStageAdded!({ stageId: "x", name: "X", type: "stage", spec: spec("x", "X") });
    const idx = nv.getIndex();
    expect(idx.all).toHaveLength(1);
    expect(idx.byStageId.get(asStageId("x"))!.label).toBe("X");
  });

  it("NodeView's version bumps when structure's version bumps", async () => {
    const trace = createTraceStructureRecorder();
    const nv = createNodeViewRecorder({ structure: trace });
    const v0 = nv.version();
    trace.recorder.onStageAdded!({ stageId: "x", name: "X", type: "stage", spec: spec("x", "X") });
    await Promise.resolve(); // notifier is microtask-batched
    expect(nv.version()).toBeGreaterThan(v0);
  });
});

// ── 4. Property ────────────────────────────────────────────────────────────

describe("createNodeViewRecorder — property", () => {
  it.each([1, 3, 10, 50])(
    "N loop iterations of the same stage produce N ExecutionRecord entries (N=%d)",
    (n) => {
      const trace = createTraceStructureRecorder();
      trace.recorder.onStageAdded!({ stageId: "loop", name: "loop", type: "stage", spec: spec("loop", "loop") });
      const nv = createNodeViewRecorder({ structure: trace });
      for (let i = 0; i < n; i++) {
        nv.recorder.onStageExecuted!({
          stageName: "loop",
          traversalContext: tctx(`loop#${i}`, i),
          startTime: i * 10,
          endTime: i * 10 + 5,
        });
      }
      const view = nv.getIndex().byStageId.get(asStageId("loop"))!;
      expect(view.executionCount).toBe(n);
      expect(view.executions).toHaveLength(n);
      expect(view.executions.map((e) => e.iteration)).toEqual(
        Array.from({ length: n }, (_, i) => i),
      );
    },
  );
});

// ── 5. Security ────────────────────────────────────────────────────────────

describe("createNodeViewRecorder — security (error isolation + orphan handling)", () => {
  it("onError without traversalContext.runtimeStageId is a dev-warn no-op, does NOT crash", () => {
    const trace = createTraceStructureRecorder();
    const nv = createNodeViewRecorder({ structure: trace });
    expect(() =>
      nv.recorder.onError!({
        stageName: "ghost",
        message: "boom",
        // no traversalContext
      }),
    ).not.toThrow();
  });

  it("onCommit without runtimeStageId is a dev-warn no-op, does NOT crash", () => {
    const trace = createTraceStructureRecorder();
    const nv = createNodeViewRecorder({ structure: trace });
    expect(() =>
      nv.recorder.onCommit!({
        stage: "ghost",
        updates: {},
        reads: [],
      }),
    ).not.toThrow();
  });

  it("throwing subscriber does NOT cascade to other subscribers", async () => {
    const trace = createTraceStructureRecorder();
    trace.recorder.onStageAdded!({ stageId: "a", name: "A", type: "stage", spec: spec("a", "A") });
    const nv = createNodeViewRecorder({ structure: trace });
    const bad = vi.fn(() => {
      throw new Error("subscriber boom");
    });
    const good = vi.fn();
    nv.subscribe(bad);
    nv.subscribe(good);
    nv.recorder.onStageExecuted!({
      stageName: "A",
      traversalContext: tctx("a#0"),
    });
    await Promise.resolve();
    expect(good).toHaveBeenCalled();
  });
});

// ── 6. Performance ─────────────────────────────────────────────────────────

describe("createNodeViewRecorder — performance", () => {
  it("1000-stage chart + 1000 executions builds index under 50ms", () => {
    const trace = createTraceStructureRecorder();
    for (let i = 0; i < 1000; i++) {
      trace.recorder.onStageAdded!({
        stageId: `s${i}`,
        name: `S${i}`,
        type: "stage",
        spec: spec(`s${i}`, `S${i}`),
      });
      if (i > 0) {
        trace.recorder.onEdgeAdded!({ from: `s${i - 1}`, to: `s${i}`, kind: "next" });
      }
    }
    const nv = createNodeViewRecorder({ structure: trace });
    for (let i = 0; i < 1000; i++) {
      nv.recorder.onStageExecuted!({
        stageName: `S${i}`,
        traversalContext: tctx(`s${i}#${i}`),
      });
    }
    const t0 = performance.now();
    const idx = nv.getIndex();
    expect(performance.now() - t0).toBeLessThan(50);
    expect(idx.all).toHaveLength(1000);
  });
});

// ── 7. ROI (bi-directional traversal solves the use case) ──────────────────

describe("walkHelpers — ROI: bi-directional traversal + backtrace", () => {
  it("walkBackward from FinalizeOrder returns BOTH fork branches (convergence-aware)", () => {
    const trace = forkFixture();
    const nv = createNodeViewRecorder({ structure: trace });
    const idx = nv.getIndex();
    const ancestors = walkBackward(idx, asStageId("FinalizeOrder"));
    expect(ancestors.map((n) => n.stageId).sort()).toEqual([
      "CheckInventory",
      "LoadOrder",
      "RunFraudCheck",
    ]);
  });

  it("walkForward from LoadOrder returns both branches + the convergence node", () => {
    const trace = forkFixture();
    const nv = createNodeViewRecorder({ structure: trace });
    const idx = nv.getIndex();
    const descendants = walkForward(idx, asStageId("LoadOrder"));
    expect(descendants.map((n) => n.stageId).sort()).toEqual([
      "CheckInventory",
      "FinalizeOrder",
      "RunFraudCheck",
    ]);
  });

  it("backtraceStructural stops at convergence (split) — gives innermost serial run", () => {
    const trace = forkFixture();
    const nv = createNodeViewRecorder({ structure: trace });
    const idx = nv.getIndex();
    const chain = backtraceStructural(idx, asStageId("FinalizeOrder"));
    // FinalizeOrder has 2 prevs (convergence) → backtrace stops at FinalizeOrder itself.
    expect(chain.map((n) => n.stageId)).toEqual(["FinalizeOrder"]);
  });

  it("backtraceStructural on a linear chain returns the full ancestry", () => {
    const trace = createTraceStructureRecorder();
    const r = trace.recorder;
    r.onStageAdded!({ stageId: "a", name: "A", type: "stage", spec: spec("a", "A") });
    r.onStageAdded!({ stageId: "b", name: "B", type: "stage", spec: spec("b", "B") });
    r.onEdgeAdded!({ from: "a", to: "b", kind: "next" });
    r.onStageAdded!({ stageId: "c", name: "C", type: "stage", spec: spec("c", "C") });
    r.onEdgeAdded!({ from: "b", to: "c", kind: "next" });
    const nv = createNodeViewRecorder({ structure: trace });
    const chain = backtraceStructural(nv.getIndex(), asStageId("c"));
    expect(chain.map((n) => n.stageId)).toEqual(["a", "b", "c"]);
  });

  it("forwardtraceStructural stops at a fork point", () => {
    const trace = forkFixture();
    const nv = createNodeViewRecorder({ structure: trace });
    const chain = forwardtraceStructural(nv.getIndex(), asStageId("LoadOrder"));
    // LoadOrder has 2 nexts (fork) → forwardtrace stops at LoadOrder itself.
    expect(chain.map((n) => n.stageId)).toEqual(["LoadOrder"]);
  });

  it("walkBackward with onlyVisited filters out non-executed branches", () => {
    const trace = forkFixture();
    const nv = createNodeViewRecorder({ structure: trace });
    // Only CheckInventory executed; RunFraudCheck did not.
    nv.recorder.onStageExecuted!({
      stageName: "CheckInventory",
      traversalContext: tctx("CheckInventory#1"),
    });
    nv.recorder.onStageExecuted!({
      stageName: "FinalizeOrder",
      traversalContext: tctx("FinalizeOrder#2"),
    });
    nv.recorder.onStageExecuted!({
      stageName: "LoadOrder",
      traversalContext: tctx("LoadOrder#0"),
    });
    const idx = nv.getIndex();
    const ancestors = walkBackward(idx, asStageId("FinalizeOrder"), { onlyVisited: true });
    const ids = ancestors.map((n) => n.stageId);
    expect(ids).toContain("CheckInventory");
    expect(ids).toContain("LoadOrder");
    expect(ids).not.toContain("RunFraudCheck"); // filtered: not visited
  });

  it("cycle defense: walkForward on a malformed graph with a cycle does not infinite-loop", () => {
    // Manually craft a TraceGraph with a non-loop forward cycle (a → b → a),
    // simulating future bug / manual edge injection. The walk must terminate.
    const trace = createTraceStructureRecorder();
    const r = trace.recorder;
    r.onStageAdded!({ stageId: "a", name: "A", type: "stage", spec: spec("a", "A") });
    r.onStageAdded!({ stageId: "b", name: "B", type: "stage", spec: spec("b", "B") });
    r.onEdgeAdded!({ from: "a", to: "b", kind: "next" });
    r.onEdgeAdded!({ from: "b", to: "a", kind: "next" }); // cycle!

    const nv = createNodeViewRecorder({ structure: trace });
    const idx = nv.getIndex();
    const result = walkForward(idx, asStageId("a"));
    // Should terminate; cycle visited-set caps the walk at the unique nodes.
    expect(result.map((n) => n.stageId)).toEqual(["b"]);
  });

  // L8.1 Panel 7 must-fix: cycle defense parity across ALL 4 walk helpers
  // (only walkForward had a cycle test). Verifies the visited-set guards
  // in walkBackward + backtraceStructural + forwardtraceStructural don't
  // regress.

  it("cycle defense: walkBackward terminates on a forward cycle (b → a → b)", () => {
    const trace = createTraceStructureRecorder();
    const r = trace.recorder;
    r.onStageAdded!({ stageId: "a", name: "A", type: "stage", spec: spec("a", "A") });
    r.onStageAdded!({ stageId: "b", name: "B", type: "stage", spec: spec("b", "B") });
    r.onEdgeAdded!({ from: "a", to: "b", kind: "next" });
    r.onEdgeAdded!({ from: "b", to: "a", kind: "next" });
    const nv = createNodeViewRecorder({ structure: trace });
    // Backward from 'a' should find 'b' (which has a → b → a inverse), terminate.
    const result = walkBackward(nv.getIndex(), asStageId("a"));
    expect(result.map((n) => n.stageId)).toEqual(["b"]);
  });

  it("cycle defense: backtraceStructural terminates on a single-prev cycle", () => {
    // Linear-with-cycle: a → b → a (a's prev = b, b's prev = a)
    const trace = createTraceStructureRecorder();
    const r = trace.recorder;
    r.onStageAdded!({ stageId: "a", name: "A", type: "stage", spec: spec("a", "A") });
    r.onStageAdded!({ stageId: "b", name: "B", type: "stage", spec: spec("b", "B") });
    r.onEdgeAdded!({ from: "a", to: "b", kind: "next" });
    r.onEdgeAdded!({ from: "b", to: "a", kind: "next" });
    const nv = createNodeViewRecorder({ structure: trace });
    // Both have prevIds.length === 1 — linear walk would loop. visited-set saves us.
    const result = backtraceStructural(nv.getIndex(), asStageId("a"));
    expect(result.map((n) => n.stageId).sort()).toEqual(["a", "b"]);
  });

  it("cycle defense: forwardtraceStructural terminates on a single-next cycle", () => {
    const trace = createTraceStructureRecorder();
    const r = trace.recorder;
    r.onStageAdded!({ stageId: "a", name: "A", type: "stage", spec: spec("a", "A") });
    r.onStageAdded!({ stageId: "b", name: "B", type: "stage", spec: spec("b", "B") });
    r.onEdgeAdded!({ from: "a", to: "b", kind: "next" });
    r.onEdgeAdded!({ from: "b", to: "a", kind: "next" });
    const nv = createNodeViewRecorder({ structure: trace });
    const result = forwardtraceStructural(nv.getIndex(), asStageId("a"));
    expect(result.map((n) => n.stageId).sort()).toEqual(["a", "b"]);
  });

  // L8.1 Panel 7 must-fix: option-parity matrix (includeStart + onlyVisited
  // for all 4 walk helpers). Code paths exist but weren't exercised in
  // most helpers.

  it("walkForward with includeStart:true puts the start node FIRST in the result", () => {
    const trace = forkFixture();
    const nv = createNodeViewRecorder({ structure: trace });
    const result = walkForward(nv.getIndex(), asStageId("LoadOrder"), { includeStart: true });
    expect(result[0]!.stageId).toBe("LoadOrder");
  });

  it("walkBackward with includeStart:true puts the start node FIRST in the result", () => {
    const trace = forkFixture();
    const nv = createNodeViewRecorder({ structure: trace });
    const result = walkBackward(nv.getIndex(), asStageId("FinalizeOrder"), { includeStart: true });
    expect(result[0]!.stageId).toBe("FinalizeOrder");
  });

  it("walkForward with onlyVisited:true filters out non-executed descendants", () => {
    const trace = forkFixture();
    const nv = createNodeViewRecorder({ structure: trace });
    nv.recorder.onStageExecuted!({
      stageName: "LoadOrder",
      traversalContext: tctx("LoadOrder#0"),
    });
    nv.recorder.onStageExecuted!({
      stageName: "CheckInventory",
      traversalContext: tctx("CheckInventory#1"),
    });
    // RunFraudCheck NOT executed; FinalizeOrder NOT executed.
    const result = walkForward(nv.getIndex(), asStageId("LoadOrder"), { onlyVisited: true });
    expect(result.map((n) => n.stageId)).toEqual(["CheckInventory"]);
  });

  it("forwardtraceStructural with onlyVisited filters non-executed nodes in the linear chain", () => {
    const trace = createTraceStructureRecorder();
    const r = trace.recorder;
    r.onStageAdded!({ stageId: "a", name: "A", type: "stage", spec: spec("a", "A") });
    r.onStageAdded!({ stageId: "b", name: "B", type: "stage", spec: spec("b", "B") });
    r.onEdgeAdded!({ from: "a", to: "b", kind: "next" });
    r.onStageAdded!({ stageId: "c", name: "C", type: "stage", spec: spec("c", "C") });
    r.onEdgeAdded!({ from: "b", to: "c", kind: "next" });
    const nv = createNodeViewRecorder({ structure: trace });
    nv.recorder.onStageExecuted!({ stageName: "A", traversalContext: tctx("a#0") });
    nv.recorder.onStageExecuted!({ stageName: "B", traversalContext: tctx("b#1") });
    // 'c' not executed — chain should stop at b.
    const chain = forwardtraceStructural(nv.getIndex(), asStageId("a"), { onlyVisited: true });
    expect(chain.map((n) => n.stageId)).toEqual(["a", "b"]);
  });
});

// ── Panel 7 must-fix: reset() semantics + runtime/structure boundary ───────

describe("createNodeViewRecorder — reset() semantics", () => {
  it("reset() clears executions + commit refs but PRESERVES structural prevIds/nextIds", () => {
    const trace = forkFixture();
    const nv = createNodeViewRecorder({ structure: trace });
    nv.recorder.onStageExecuted!({
      stageName: "LoadOrder",
      traversalContext: tctx("LoadOrder#0"),
    });
    nv.recorder.onCommit!({
      stage: "LoadOrder",
      runtimeStageId: "LoadOrder#0",
      updates: {},
      reads: [],
    });

    const before = nv.getIndex().byStageId.get(asStageId("LoadOrder"))!;
    expect(before.executionCount).toBe(1);
    expect(before.commitRuntimeStageIds).toHaveLength(1);

    nv.reset();

    const after = nv.getIndex().byStageId.get(asStageId("LoadOrder"))!;
    expect(after.executionCount).toBe(0);
    expect(after.commitRuntimeStageIds).toHaveLength(0);
    // CRITICAL: structural data survives reset (NodeView doesn't own it).
    expect(after.nextIds.sort()).toEqual(["CheckInventory", "RunFraudCheck"]);
    expect(after.label).toBe("LoadOrder");
  });
});

// ── Panel 1 must-fix: onError matches by runtimeStageId, not array index ───

describe("createNodeViewRecorder — onError runtimeStageId matching", () => {
  it("onError attaches to the execution with the MATCHING runtimeStageId, not the most-recent", () => {
    const trace = createTraceStructureRecorder();
    const r = trace.recorder;
    r.onStageAdded!({ stageId: "loop", name: "loop", type: "stage", spec: spec("loop", "loop") });
    const nv = createNodeViewRecorder({ structure: trace });

    // 3 loop iterations.
    nv.recorder.onStageExecuted!({ stageName: "loop", traversalContext: tctx("loop#0", 0) });
    nv.recorder.onStageExecuted!({ stageName: "loop", traversalContext: tctx("loop#1", 1) });
    nv.recorder.onStageExecuted!({ stageName: "loop", traversalContext: tctx("loop#2", 2) });

    // Error fires for iteration 1 (NOT the most-recent).
    nv.recorder.onError!({
      stageName: "loop",
      message: "iter-1 boom",
      traversalContext: tctx("loop#1", 1),
    });

    const view = nv.getIndex().byStageId.get(asStageId("loop"))!;
    expect(view.executions).toHaveLength(3);
    // Error must land on the matching iteration, not the array's last.
    expect(view.executions[0]!.errorMessage).toBeUndefined();
    expect(view.executions[1]!.errorMessage).toBe("iter-1 boom");
    expect(view.executions[2]!.errorMessage).toBeUndefined();
  });

  it("returns [] for unknown stageId (no throw) — defensive walk-helper contract", () => {
    const trace = forkFixture();
    const nv = createNodeViewRecorder({ structure: trace });
    const idx = nv.getIndex();
    expect(walkForward(idx, asStageId("ghost"))).toEqual([]);
    expect(walkBackward(idx, asStageId("ghost"))).toEqual([]);
    expect(backtraceStructural(idx, asStageId("ghost"))).toEqual([]);
    expect(forwardtraceStructural(idx, asStageId("ghost"))).toEqual([]);
  });
});
