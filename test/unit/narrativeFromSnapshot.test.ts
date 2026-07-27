/**
 * narrativeFromSnapshot — the story a recording carries with it.
 *
 * footprintjs's narrative recorder implements `toSnapshot()`, so a saved
 * `getSnapshot()` can hold its own narrative. Replaying that recording used
 * to lose it: with no live executor there was nothing to call
 * `getNarrativeEntries()` on, and the panel fell back to synthetic
 * "X executed. Wrote: y" lines.
 *
 * Detection is by SHAPE (type/text/depth), with the recorder name used only
 * to break ties — see the rationale in the adapter. These tests pin that:
 * an entry-shaped payload is found whatever it's called, and a
 * non-narrative recorder is never mistaken for one.
 */

import { describe, it, expect } from "vitest";
import {
  narrativeFromSnapshot,
  narrativeRecorderFromSnapshot,
  toVisualizationSnapshots,
} from "../../src/adapters/fromRuntimeSnapshot";

const entries = [
  { type: "stage", text: "Stage 1: Seed the run.", depth: 0, stageId: "seed", runtimeStageId: "seed#0", stageName: "Seed" },
  { type: "step", text: "  wrote items", depth: 1, stageId: "seed", runtimeStageId: "seed#0", key: "items" },
  { type: "stage", text: "Stage 2: Total it up.", depth: 0, stageId: "sum", runtimeStageId: "sum#1", stageName: "Sum" },
];

const metricsRecorder = {
  id: "metrics",
  name: "Metrics",
  data: { steps: { "seed#0": { stageName: "Seed", duration: 4 } } },
};

describe("narrativeFromSnapshot", () => {
  it("reads entries carried directly as the recorder's data array", () => {
    const found = narrativeFromSnapshot({
      recorders: [metricsRecorder, { id: "narrative", name: "Narrative", data: entries }],
    });
    expect(found).toEqual(entries);
  });

  it("reads entries wrapped in { entries } too (either envelope)", () => {
    const found = narrativeFromSnapshot({
      recorders: [{ id: "narrative", name: "Narrative", data: { entries } }],
    });
    expect(found).toEqual(entries);
  });

  it("finds the narrative by SHAPE even when upstream renames the recorder", () => {
    // The parallel footprintjs change may land a different name; the shape
    // (type + text + depth) is the contract this adapter actually needs.
    const found = narrativeFromSnapshot({
      recorders: [{ id: "story-log", name: "Something Else", data: entries }],
    });
    expect(found).toEqual(entries);
  });

  it("prefers the narrative-NAMED recorder when two payloads look alike", () => {
    const other = [{ type: "stage", text: "decoy", depth: 0 }];
    const found = narrativeFromSnapshot({
      recorders: [
        { id: "decoy", name: "Audit", data: other },
        { id: "narrative", name: "Narrative", data: entries },
      ],
    });
    expect(found).toEqual(entries);
  });

  it("returns undefined when the run recorded no narrative — absence stays absent", () => {
    expect(narrativeFromSnapshot({ recorders: [metricsRecorder] })).toBeUndefined();
    expect(narrativeFromSnapshot({ recorders: [] })).toBeUndefined();
    expect(narrativeFromSnapshot({})).toBeUndefined();
    expect(narrativeFromSnapshot(null)).toBeUndefined();
    expect(narrativeFromSnapshot({ recorders: "nope" })).toBeUndefined();
  });

  it("is not fooled by arrays of other things", () => {
    expect(
      narrativeFromSnapshot({ recorders: [{ id: "x", name: "X", data: [1, 2, 3] }] }),
    ).toBeUndefined();
    expect(
      narrativeFromSnapshot({
        recorders: [{ id: "x", name: "X", data: [{ text: "no depth", type: "stage" }] }],
      }),
    ).toBeUndefined();
    expect(
      narrativeFromSnapshot({ recorders: [{ id: "x", name: "X", data: { entries: [] } }] }),
    ).toBeUndefined();
  });

  it("reports the recorder id so a UI can avoid rendering the story twice", () => {
    expect(
      narrativeRecorderFromSnapshot({
        recorders: [{ id: "combined-narrative", name: "Narrative", data: entries }],
      }),
    ).toEqual({ id: "combined-narrative", entries });
  });
});

describe("toVisualizationSnapshots — narrative fallback", () => {
  const runtime = {
    sharedState: {},
    commitLog: [],
    executionTree: {
      id: "seed",
      name: "Seed",
      runtimeStageId: "seed#0",
      logs: {},
      errors: {},
      metrics: {},
      evals: {},
      stageWrites: { items: 2 },
      next: {
        id: "sum",
        name: "Sum",
        runtimeStageId: "sum#1",
        logs: {},
        errors: {},
        metrics: {},
        evals: {},
      },
    },
  };

  it("uses the snapshot's own narrative when the caller passes none", () => {
    const snaps = toVisualizationSnapshots({
      ...runtime,
      recorders: [{ id: "narrative", name: "Narrative", data: entries }],
    } as never);
    expect(snaps[0]!.narrative).toContain("Stage 1: Seed the run.");
    expect(snaps[1]!.narrative).toContain("Stage 2: Total it up.");
  });

  it("the caller's entries still win", () => {
    const mine = [{ type: "stage", text: "MY LINE", depth: 0, stageName: "Seed", stageId: "seed" }];
    const snaps = toVisualizationSnapshots(
      { ...runtime, recorders: [{ id: "narrative", name: "Narrative", data: entries }] } as never,
      mine as never,
    );
    expect(snaps[0]!.narrative).toBe("MY LINE");
  });

  it("falls back to the built line when nothing recorded a narrative", () => {
    const snaps = toVisualizationSnapshots(runtime as never);
    expect(snaps[0]!.narrative).toContain("Seed executed.");
    expect(snaps[0]!.narrative).toContain("Wrote: items");
  });
});
