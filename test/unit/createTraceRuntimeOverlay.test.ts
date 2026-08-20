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
  type MinimalFlowRecorder,
} from "../../src/components/FlowchartView/createTraceRuntimeOverlay";

const tc = (rsid: string) => ({ runtimeStageId: rsid, runId: "run-1" });

// The real `onStageExecuted` event type (module-private in the source, so
// pulled off the exported `MinimalFlowRecorder` interface). footprintjs v6+
// fires this uniformly for every stage kind and stamps `stageType`; the
// overlay handler itself never reads it (see createTraceRuntimeOverlay.ts),
// so callers below pass whichever kind the scenario is actually about.
type StageExecutedEvent = Parameters<NonNullable<MinimalFlowRecorder["onStageExecuted"]>>[0];

function stageEvent(
  stageName: string,
  rsid: string,
  stageType: StageExecutedEvent["stageType"] = "linear",
): StageExecutedEvent {
  return { stageName, traversalContext: tc(rsid), stageType };
}

describe("createTraceRuntimeOverlay — visited state", () => {
  it("plain stages fire onStageExecuted → executionOrder grows", () => {
    const h = createTraceRuntimeOverlay();
    h.recorder.onStageExecuted!(stageEvent("A", "a#0"));
    h.recorder.onStageExecuted!(stageEvent("B", "b#1"));
    expect(h.getOverlay().executionOrder.map((s) => s.stageId)).toEqual(["a", "b"]);
  });

  it("DECIDER — onStageExecuted fires for the decider (v6 #003 uniform)", () => {
    const h = createTraceRuntimeOverlay();
    h.recorder.onStageExecuted!(stageEvent("A", "a#0"));
    // v6: engine fires onStageExecuted for deciders after onDecision.
    h.recorder.onStageExecuted!(stageEvent("LoanDecision", "loan-decision#1", "decider"));
    h.recorder.onStageExecuted!(stageEvent("Reject", "reject#2"));

    const order = h.getOverlay().executionOrder;
    expect(order.map((s) => s.stageId)).toEqual(["a", "loan-decision", "reject"]);

    // sliceOverlay at index 2 marks all three as executed.
    const slice = sliceOverlay(h.getOverlay(), 2);
    expect(slice.executedStageIds.has("loan-decision")).toBe(true);
  });

  it("FORK — onStageExecuted fires for the fork parent (v6 #003 uniform)", () => {
    const h = createTraceRuntimeOverlay();
    h.recorder.onStageExecuted!(stageEvent("Parallel", "parallel#0", "fork"));
    h.recorder.onStageExecuted!(stageEvent("A", "a#1"));
    h.recorder.onStageExecuted!(stageEvent("B", "b#2"));
    const order = h.getOverlay().executionOrder;
    expect(order.map((s) => s.stageId)).toEqual(["parallel", "a", "b"]);
  });

  it("SELECTOR — onStageExecuted fires for the selector (v6 #003 uniform)", () => {
    const h = createTraceRuntimeOverlay();
    h.recorder.onStageExecuted!(stageEvent("PickPath", "pick-path#0", "selector"));
    h.recorder.onStageExecuted!(stageEvent("Fast", "fast#1"));
    const order = h.getOverlay().executionOrder;
    expect(order.map((s) => s.stageId)).toEqual(["pick-path", "fast"]);
  });

  it("DEDUPE — same runtimeStageId fired twice is recorded ONCE", () => {
    const h = createTraceRuntimeOverlay();
    h.recorder.onStageExecuted!(stageEvent("LoanDecision", "loan-decision#0", "decider"));
    h.recorder.onStageExecuted!(stageEvent("LoanDecision", "loan-decision#0", "decider"));
    expect(h.getOverlay().executionOrder).toHaveLength(1);
  });

  it("reset() clears dedupe set so the same runtimeStageId can be re-recorded after reset", () => {
    const h = createTraceRuntimeOverlay();
    h.recorder.onStageExecuted!(stageEvent("A", "a#0"));
    expect(h.getOverlay().executionOrder).toHaveLength(1);
    h.reset();
    h.recorder.onStageExecuted!(stageEvent("A", "a#0"));
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

// ─────────────────────────────────────────────────────────────────────────────
// 0.35.0 — end of run. `sliceOverlay`'s docblock has always said
// "`index >= executionOrder.length` → all done, no active", but the code
// clamped the index to the last step instead, so a finished run went on
// painting its final stage as the one still running. A finished run shows
// finished.
// ─────────────────────────────────────────────────────────────────────────────
describe("sliceOverlay — the end of the run", () => {
  function overlayOf(...ids: string[]) {
    const h = createTraceRuntimeOverlay();
    ids.forEach((id, i) => h.recorder.onStageExecuted!(stageEvent(id, `${id}#${i}`)));
    return h.getOverlay();
  }

  it("index === length → every step done, nothing active", () => {
    const slice = sliceOverlay(overlayOf("a", "b", "c"), 3);
    expect(slice.activeStageId).toBeNull();
    expect([...slice.doneStageIds].sort()).toEqual(["a", "b", "c"]);
  });

  it("index past the end → same answer, not the last step re-run", () => {
    const slice = sliceOverlay(overlayOf("a", "b", "c"), 99);
    expect(slice.activeStageId).toBeNull();
    expect([...slice.doneStageIds].sort()).toEqual(["a", "b", "c"]);
  });

  it("executedStageIds and executedOrderIds cover the WHOLE run", () => {
    const slice = sliceOverlay(overlayOf("a", "b", "c"), 3);
    expect([...slice.executedStageIds].sort()).toEqual(["a", "b", "c"]);
    expect(slice.executedOrderIds).toEqual(["a", "b", "c"]);
  });

  it("the last IN-RANGE index still has an active step (the boundary)", () => {
    // length-1 is the cursor sitting ON the final stage — still running it.
    // Only length and beyond mean the run is over.
    const slice = sliceOverlay(overlayOf("a", "b", "c"), 2);
    expect(slice.activeStageId).toBe("c");
    expect([...slice.doneStageIds].sort()).toEqual(["a", "b"]);
  });

  it("an empty overlay is unchanged — nothing done, nothing active", () => {
    const slice = sliceOverlay(overlayOf(), 5);
    expect(slice.activeStageId).toBeNull();
    expect(slice.doneStageIds.size).toBe(0);
    expect(slice.executedOrderIds).toEqual([]);
  });

  it("a loop's repeated stage is done exactly once at the end", () => {
    const h = createTraceRuntimeOverlay();
    h.recorder.onStageExecuted!(stageEvent("P", "p#0"));
    h.recorder.onStageExecuted!(stageEvent("P", "p#1"));
    const slice = sliceOverlay(h.getOverlay(), 2);
    expect(slice.activeStageId).toBeNull();
    expect([...slice.doneStageIds]).toEqual(["p"]);
    expect(slice.executedOrderIds).toEqual(["p", "p"]);
  });
});
