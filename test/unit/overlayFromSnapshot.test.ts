/**
 * overlayFromSnapshot — the post-hoc twin of `createTraceRuntimeOverlay`.
 *
 * The contract under test: a FROZEN snapshot must colour the chart exactly
 * like the live recorder did. So the equivalence tests below feed the SAME
 * run to both paths (live: FlowRecorder events → recorder; post-hoc:
 * commitLog → builder) and assert the overlays match — and then that
 * `sliceOverlay` (what `<TracedFlow>` actually calls) agrees at every scrub
 * position.
 */

import { describe, it, expect } from "vitest";
import { overlayFromSnapshot } from "../../src/adapters/overlayFromSnapshot";
import {
  createTraceRuntimeOverlay,
  sliceOverlay,
} from "../../src/components/FlowchartView/createTraceRuntimeOverlay";

/** One commit bundle as footprintjs writes it (the fields we read). */
const bundle = (idx: number, runtimeStageId: string, stage: string) => ({
  idx,
  runtimeStageId,
  stage,
  overwrite: {},
  updates: {},
  trace: [],
});

describe("overlayFromSnapshot — execution order from the commit log", () => {
  it("one step per stage execution, in commit-log order", () => {
    const overlay = overlayFromSnapshot({
      commitLog: [
        bundle(0, "seed#0", "Seed"),
        bundle(1, "classify#1", "Classify"),
        bundle(2, "approve#2", "Approve"),
      ],
    });
    expect(overlay.executionOrder.map((s) => s.runtimeStageId)).toEqual([
      "seed#0",
      "classify#1",
      "approve#2",
    ]);
    expect(overlay.executionOrder.map((s) => s.stageId)).toEqual([
      "seed",
      "classify",
      "approve",
    ]);
    expect(overlay.executionOrder.map((s) => s.stageName)).toEqual([
      "Seed",
      "Classify",
      "Approve",
    ]);
  });

  it("dedupes multi-bundle executions by runtimeStageId, keeping the first", () => {
    // A subflow mount commits its outputMapper result AND a boundary bundle.
    const overlay = overlayFromSnapshot({
      commitLog: [
        bundle(0, "seed#0", "Seed"),
        bundle(1, "sf-enrich#1", "EnrichText"),
        bundle(2, "sf-enrich#1", "EnrichText"),
        bundle(3, "done#2", "Done"),
      ],
    });
    expect(overlay.executionOrder).toHaveLength(3);
    expect(overlay.executionOrder[1]!.runtimeStageId).toBe("sf-enrich#1");
  });

  it("keeps loop re-executions as separate steps (same stageId, bumping index)", () => {
    const overlay = overlayFromSnapshot({
      commitLog: [
        bundle(0, "refine#4", "Refine"),
        bundle(1, "evaluate#5", "Evaluate"),
        bundle(2, "refine#6", "Refine"),
        bundle(3, "evaluate#7", "Evaluate"),
      ],
    });
    expect(overlay.executionOrder).toHaveLength(4);
    expect(overlay.executionOrder.map((s) => s.stageId)).toEqual([
      "refine",
      "evaluate",
      "refine",
      "evaluate",
    ]);
  });

  it("keeps subflow-path-qualified stage ids intact (chart node ids are qualified too)", () => {
    const overlay = overlayFromSnapshot({
      commitLog: [bundle(0, "sf-enrich/normalize#2", "sf-enrich/Normalize")],
    });
    expect(overlay.executionOrder[0]!.stageId).toBe("sf-enrich/normalize");
  });

  it("honest absence: timestampMs 0, no errors, not running", () => {
    const overlay = overlayFromSnapshot({ commitLog: [bundle(0, "seed#0", "Seed")] });
    expect(overlay.executionOrder[0]!.timestampMs).toBe(0);
    expect(overlay.errors.size).toBe(0);
    expect(overlay.running).toBe(false);
  });

  it("falls back to the stage id when a bundle carries no stage name", () => {
    const overlay = overlayFromSnapshot({
      commitLog: [{ idx: 0, runtimeStageId: "seed#0" }],
    });
    expect(overlay.executionOrder[0]!.stageName).toBe("seed");
  });

  it("survives junk: missing/empty log, non-objects, missing runtimeStageIds", () => {
    expect(overlayFromSnapshot(undefined).executionOrder).toEqual([]);
    expect(overlayFromSnapshot(null).executionOrder).toEqual([]);
    expect(overlayFromSnapshot({}).executionOrder).toEqual([]);
    expect(overlayFromSnapshot({ commitLog: "nope" as unknown }).executionOrder).toEqual([]);
    const overlay = overlayFromSnapshot({
      commitLog: [null, 42, "x", {}, { runtimeStageId: "" }, bundle(0, "real#0", "Real")],
    });
    expect(overlay.executionOrder.map((s) => s.runtimeStageId)).toEqual(["real#0"]);
  });
});

describe("overlayFromSnapshot — equivalence with the live recorder", () => {
  /** The run both paths see: stage executions in order, one commit each. */
  const run = [
    { rsid: "seed#0", name: "Seed" },
    { rsid: "classify#1", name: "Classify" },
    { rsid: "approve#2", name: "Approve" },
    { rsid: "notify#3", name: "Notify" },
  ];

  const liveOverlay = () => {
    const handle = createTraceRuntimeOverlay();
    handle.recorder.onRunStart!({});
    for (const step of run) {
      handle.recorder.onStageExecuted!({
        stageName: step.name,
        stageType: "linear",
        traversalContext: { runtimeStageId: step.rsid, runId: "run-1" },
      });
    }
    handle.recorder.onRunEnd!({});
    return handle.getOverlay();
  };

  const postHocOverlay = () =>
    overlayFromSnapshot({
      commitLog: run.map((step, i) => bundle(i, step.rsid, step.name)),
    });

  it("produces the same executionOrder the live recorder produced", () => {
    const live = liveOverlay().executionOrder.map(({ timestampMs: _t, ...rest }) => rest);
    const postHoc = postHocOverlay().executionOrder.map(({ timestampMs: _t, ...rest }) => rest);
    expect(postHoc).toEqual(live);
  });

  it("sliceOverlay agrees at every scrub position (this is what colours the chart)", () => {
    const live = liveOverlay();
    const postHoc = postHocOverlay();
    for (let i = 0; i < run.length; i++) {
      const a = sliceOverlay(live, i);
      const b = sliceOverlay(postHoc, i);
      expect(b.activeStageId).toBe(a.activeStageId);
      expect([...b.doneStageIds]).toEqual([...a.doneStageIds]);
      expect(b.executedOrderIds).toEqual(a.executedOrderIds);
    }
  });

  it("typed as the live RuntimeOverlay — accepted by sliceOverlay unchanged", () => {
    const slice = sliceOverlay(postHocOverlay(), 1);
    expect(slice.activeStageId).toBe("classify");
    expect([...slice.doneStageIds]).toEqual(["seed"]);
  });
});
