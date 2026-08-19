/**
 * createTraceRuntimeOverlay — focused tests for the visited-state
 * recording paths.
 *
 * As of footprintjs v6 (proposal #003), the engine fires
 * `onStageExecuted` UNIFORMLY for every stage kind — linear / decider
 * / fork / selector / subflow-mount. The overlay therefore listens
 * only to `onStageExecuted` (and `onError` / `onRunStart` /
 * `onRunEnd`); the duplicate `onDecision` / `onFork` / `onSelected`
 * handlers from earlier versions are no longer needed.
 */

import { describe, it, expect } from "vitest";
import {
  createTraceRuntimeOverlay,
  sliceOverlay,
} from "../../src/components/FlowchartView/createTraceRuntimeOverlay";

const tc = (rsid: string) => ({ runtimeStageId: rsid, runId: "run-1" });

describe("createTraceRuntimeOverlay — visited state", () => {
  it("plain stages fire onStageExecuted → executionOrder grows", () => {
    const h = createTraceRuntimeOverlay();
    h.recorder.onStageExecuted!({ stageName: "A", traversalContext: tc("a#0") });
    h.recorder.onStageExecuted!({ stageName: "B", traversalContext: tc("b#1") });
    expect(h.getOverlay().executionOrder.map((s) => s.stageId)).toEqual(["a", "b"]);
  });

  it("DECIDER — onStageExecuted fires for the decider (v6 #003 uniform)", () => {
    const h = createTraceRuntimeOverlay();
    h.recorder.onStageExecuted!({ stageName: "A", traversalContext: tc("a#0") });
    // v6: engine fires onStageExecuted for deciders after onDecision.
    h.recorder.onStageExecuted!({
      stageName: "LoanDecision",
      traversalContext: tc("loan-decision#1"),
    });
    h.recorder.onStageExecuted!({ stageName: "Reject", traversalContext: tc("reject#2") });

    const order = h.getOverlay().executionOrder;
    expect(order.map((s) => s.stageId)).toEqual(["a", "loan-decision", "reject"]);

    // sliceOverlay at index 2 marks all three as executed.
    const slice = sliceOverlay(h.getOverlay(), 2);
    expect(slice.executedStageIds.has("loan-decision")).toBe(true);
  });

  it("FORK — onStageExecuted fires for the fork parent (v6 #003 uniform)", () => {
    const h = createTraceRuntimeOverlay();
    h.recorder.onStageExecuted!({ stageName: "Parallel", traversalContext: tc("parallel#0") });
    h.recorder.onStageExecuted!({ stageName: "A", traversalContext: tc("a#1") });
    h.recorder.onStageExecuted!({ stageName: "B", traversalContext: tc("b#2") });
    const order = h.getOverlay().executionOrder;
    expect(order.map((s) => s.stageId)).toEqual(["parallel", "a", "b"]);
  });

  it("SELECTOR — onStageExecuted fires for the selector (v6 #003 uniform)", () => {
    const h = createTraceRuntimeOverlay();
    h.recorder.onStageExecuted!({ stageName: "PickPath", traversalContext: tc("pick-path#0") });
    h.recorder.onStageExecuted!({ stageName: "Fast", traversalContext: tc("fast#1") });
    const order = h.getOverlay().executionOrder;
    expect(order.map((s) => s.stageId)).toEqual(["pick-path", "fast"]);
  });

  it("DEDUPE — same runtimeStageId fired twice is recorded ONCE", () => {
    const h = createTraceRuntimeOverlay();
    h.recorder.onStageExecuted!({
      stageName: "LoanDecision",
      traversalContext: tc("loan-decision#0"),
    });
    h.recorder.onStageExecuted!({
      stageName: "LoanDecision",
      traversalContext: tc("loan-decision#0"),
    });
    expect(h.getOverlay().executionOrder).toHaveLength(1);
  });

  it("reset() clears dedupe set so the same runtimeStageId can be re-recorded after reset", () => {
    const h = createTraceRuntimeOverlay();
    h.recorder.onStageExecuted!({ stageName: "A", traversalContext: tc("a#0") });
    expect(h.getOverlay().executionOrder).toHaveLength(1);
    h.reset();
    h.recorder.onStageExecuted!({ stageName: "A", traversalContext: tc("a#0") });
    expect(h.getOverlay().executionOrder).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// seed() — adopting a rebuilt overlay (the replay path)
// ─────────────────────────────────────────────────────────────────────────────

import { overlayFromSnapshot } from "../../src/adapters/overlayFromSnapshot";

describe("createTraceRuntimeOverlay — seed (replay adoption)", () => {
  it("adopts a rebuilt overlay: steps land, version bumps, subscribers hear it", async () => {
    const handle = createTraceRuntimeOverlay();
    let notified = 0;
    handle.subscribe(() => { notified += 1; });
    const before = handle.version();

    const rebuilt = overlayFromSnapshot({
      commitLog: [
        { runtimeStageId: "seed#0", stage: "Initialize" },
        { runtimeStageId: "sf-inj#2", stage: "Injection Engine" },
        { runtimeStageId: "sf-inj#2", stage: "Injection Engine" }, // dup bundle → one step
        { runtimeStageId: "sf-inj/gather#4", stage: "Gather" },
      ],
    });
    handle.seed(rebuilt);

    const overlay = handle.getOverlay();
    expect(overlay.executionOrder.map((s) => s.runtimeStageId)).toEqual([
      "seed#0",
      "sf-inj#2",
      "sf-inj/gather#4",
    ]);
    expect(overlay.executionOrder[2]!.stageId).toBe("sf-inj/gather"); // path kept, #N stripped
    expect(overlay.running).toBe(false);
    expect(handle.version()).toBeGreaterThan(before);
    await Promise.resolve(); // listener fires are microtask-batched (createNotifier)
    expect(notified).toBeGreaterThan(0);
  });

  it("seed REPLACES prior state and stays dedupe-consistent with later live events", () => {
    const handle = createTraceRuntimeOverlay();
    handle.recorder.onStageExecuted?.({
      stageName: "Old",
      stageType: "linear",
      traversalContext: { runtimeStageId: "old#0" },
    });
    handle.seed(overlayFromSnapshot({ commitLog: [{ runtimeStageId: "a#0", stage: "A" }] }));
    // A live event for an already-seeded step dedupes; a new one appends.
    handle.recorder.onStageExecuted?.({
      stageName: "A",
      stageType: "linear",
      traversalContext: { runtimeStageId: "a#0" },
    });
    handle.recorder.onStageExecuted?.({
      stageName: "B",
      stageType: "linear",
      traversalContext: { runtimeStageId: "b#1" },
    });
    expect(handle.getOverlay().executionOrder.map((s) => s.runtimeStageId)).toEqual(["a#0", "b#1"]);
  });

  it("getOverlay hands out copies — mutating the seeded input never reaches the handle", () => {
    const handle = createTraceRuntimeOverlay();
    const rebuilt = overlayFromSnapshot({ commitLog: [{ runtimeStageId: "a#0", stage: "A" }] });
    handle.seed(rebuilt);
    (rebuilt.executionOrder as unknown as { stageName: string }[])[0]!.stageName = "MUTATED";
    expect(handle.getOverlay().executionOrder[0]!.stageName).toBe("A");
  });
});
