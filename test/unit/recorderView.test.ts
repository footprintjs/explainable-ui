import { describe, expect, it } from "vitest";
import { detectKeyedSteps, insightName, projectKeyedRecorder, readRecorderNumber } from "../../src/model/recorderView";
import type { StageSnapshot } from "../../src/types";

function snapshot(runtimeStageId: string, stageName = runtimeStageId.split("#")[0]): StageSnapshot {
  return { runtimeStageId, stageName, stageLabel: stageName, memory: {}, narrative: "", startMs: 0, durationMs: 0 };
}

function project(data: unknown, snapshots: StageSnapshot[], selectedIndex = snapshots.length - 1) {
  const detected = detectKeyedSteps(data);
  expect(detected).not.toBeNull();
  const projected = projectKeyedRecorder(data, detected, snapshots, selectedIndex);
  expect(projected).not.toBeNull();
  return projected!;
}

describe("keyed recorder scope and cursor projection", () => {
  const child = [snapshot("first/clean#2"), snapshot("first/scale#3"), snapshot("first/sum#4")];
  const data = {
    numericField: "readCount", grandTotal: 13,
    steps: {
      "seed#0": { stageName: "Seed", readCount: 1, writeCount: 1, duration: 1 },
      "first/clean#2": { stageName: "Clean", readCount: 1, writeCount: 1, duration: 2 },
      "first/scale#3": { stageName: "Scale", readCount: 1, writeCount: 1, duration: 3 },
      "first/sum#4": { stageName: "Sum", readCount: 1, writeCount: 1, duration: 4 },
      "second/clean#6": { stageName: "Clean", readCount: 4, writeCount: 1, duration: 5 },
      "second/sum#7": { stageName: "Sum", readCount: 4, writeCount: 1, duration: 6 },
      "report#8": { stageName: "Report", readCount: 1, writeCount: 1, duration: 7 },
    },
  };

  it("keeps a child flow's total separate from the recorder's whole-run total", () => {
    const childView = project(data, child);
    expect(childView.scopeEntries).toEqual(child.map(stage => stage.runtimeStageId));
    expect(childView.currentScopeTotal).toBe(3);
    expect(childView.runningTotal).toBe(3);
    expect(childView.currentScopeTotals.readCount).toBe(3);
    expect(childView.currentScopeTotals.duration).toBe(9);
    expect(childView.unmatchedCount).toBe(4);
    expect(childView.isAtEnd).toBe(true);
  });

  it("excludes nested and sibling rows from the root flow's own totals", () => {
    const root = project(data, [snapshot("seed#0"), snapshot("report#8")]);
    expect(root.scopeEntries).toEqual(["seed#0", "report#8"]);
    expect(root.currentScopeTotal).toBe(2);
    expect(root.currentScopeTotals.writeCount).toBe(2);
    expect(root.currentScopeTotals.duration).toBe(8);
  });

  it("distinguishes the selected visit, through-cursor values and full current-flow totals", () => {
    const view = project(data, child, 1);
    expect(view.selectedEntryKey).toBe("first/scale#3");
    expect(view.visibleEntries).toEqual(["first/clean#2", "first/scale#3"]);
    expect(view.runningTotal).toBe(2);
    expect(view.visibleTotals.duration).toBe(5);
    expect(view.currentScopeTotal).toBe(3);
    expect(view.currentScopeTotals.duration).toBe(9);
    expect(view.isAtEnd).toBe(false);
  });

  it("keeps repeated stage names distinct when exact runtime visit IDs exist", () => {
    const repeated = { numericField: "readCount", grandTotal: 10, steps: {
      "refine#1": { stageName: "Refine", readCount: 2 },
      "refine#2": { stageName: "Refine", readCount: 8 },
    } };
    const view = project(repeated, [snapshot("refine#1", "Refine"), snapshot("refine#2", "Refine")], 0);
    expect(view.visibleEntries).toEqual(["refine#1"]);
    expect(view.runningTotal).toBe(2);
    expect(view.currentScopeTotal).toBe(10);
  });

  it("refuses ambiguous repeated runtime IDs and legacy repeated names", () => {
    const duplicateIds = project(data, [snapshot("seed#0"), snapshot("seed#0")]);
    expect(duplicateIds.scopeEntries).toEqual([]);
    expect(duplicateIds.selectedEntryKey).toBeNull();
    expect(duplicateIds.currentScopeTotal).toBeNull();
    expect(duplicateIds.ambiguousCount).toBeGreaterThan(0);

    const legacy = project({ numericField: "readCount", stages: { Refine: { readCount: 10 } } },
      [snapshot("refine#1", "Refine"), snapshot("refine#2", "Refine")]);
    expect(legacy.scopeEntries).toEqual([]);
    expect(legacy.currentScopeTotal).toBeNull();
    expect(legacy.ambiguousCount).toBeGreaterThan(0);
  });

  it("does not count both legacy name and label aliases as separate visits", () => {
    const selected = { ...snapshot("clean#1", "clean"), stageLabel: "Clean items" };
    const view = project({ numericField: "readCount", stages: {
      clean: { readCount: 1 }, "Clean items": { readCount: 8 },
    } }, [selected]);
    expect(view.scopeEntries).toEqual([]);
    expect(view.selectedEntryKey).toBeNull();
    expect(view.currentScopeTotal).toBeNull();
    expect(view.ambiguousCount).toBe(2);
  });
});

describe("recorder display names", () => {
  it("uses the default user-facing names while preserving custom and prototype-shaped names", () => {
    expect(insightName("Narrative")).toBe("Run log");
    expect(insightName("Metrics")).toBe("Metrics");
    expect(insightName("Memory")).toBe("State");
    for (const name of ["Latency & cost", "__proto__", "constructor"]) expect(insightName(name)).toBe(name);
  });
});

describe("recorded numeric availability", () => {
  it("preserves recorded zero counts and durations without replacing them with missing data", () => {
    const view = project({ numericField: "readCount", steps: { "zero#0": { readCount: 0, writeCount: 0, durationMs: 0 } } }, [snapshot("zero#0")]);
    expect(view.runningTotal).toBe(0);
    expect(view.currentScopeTotal).toBe(0);
    expect(view.currentScopeTotals.durationMs).toBe(0);
    expect(readRecorderNumber(view.steps["zero#0"], "readCount")).toBe(0);
  });

  it("does not depend on a recorder-wide grandTotal to reveal its selected numeric field", () => {
    const view = project({ numericField: "usd", steps: { "charge#0": { usd: 0.25 } } }, [snapshot("charge#0")]);
    expect(view.numFieldKey).toBe("usd");
    expect(view.runningTotal).toBe(0.25);
    expect(view.currentScopeTotal).toBe(0.25);
  });

  it("marks missing, strings and non-finite numeric fields unavailable instead of coercing or summing them", () => {
    for (const value of [undefined, "2", NaN, Infinity, -Infinity]) {
      const row = { readCount: value, writeCount: 1 };
      const view = project({ numericField: "readCount", grandTotal: 99, steps: { "bad#0": row } }, [snapshot("bad#0")]);
      expect(readRecorderNumber(row, "readCount")).toBeNull();
      expect(view.runningTotal).toBeNull();
      expect(view.currentScopeTotal).toBeNull();
      expect(view.visibleTotals.readCount).toBeNull();
      expect(view.currentScopeTotals.writeCount).toBe(1);
    }
  });

  it("does not claim a complete total when one recorded visit lacks the field", () => {
    const view = project({ numericField: "readCount", steps: {
      "a#0": { readCount: 2, writeCount: 1 }, "b#1": { writeCount: 1 },
    } }, [snapshot("a#0"), snapshot("b#1")]);
    expect(view.runningTotal).toBeNull();
    expect(view.currentScopeTotal).toBeNull();
    expect(view.currentScopeTotals.writeCount).toBe(2);
  });

  it("labels recorded metrics explicitly and does not invent timing for custom numeric data", () => {
    const metrics = project({ steps: { "a#0": { durationMs: 1.25, readCount: 2, writeCount: 3, commitCount: 1, pauseCount: 0 } } }, [snapshot("a#0")]);
    expect(metrics.columns).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: "durationMs", label: "Duration (ms)", kind: "duration", additive: true }),
      expect.objectContaining({ key: "readCount", label: "Reads", kind: "count", additive: true }),
      expect.objectContaining({ key: "writeCount", label: "Writes", kind: "count", additive: true }),
      expect.objectContaining({ key: "commitCount", label: "Commits", kind: "count", additive: true }),
      expect.objectContaining({ key: "pauseCount", label: "Pauses", kind: "count", additive: true }),
    ]));
    const custom = project({ numericField: "confidence", steps: { "a#0": { confidence: 0.8 } } }, [snapshot("a#0")]);
    expect(custom.columns).toEqual([expect.objectContaining({ key: "confidence", kind: "number", additive: false })]);
    expect(custom.currentScopeTotals.confidence).toBeNull();
    expect(custom.columns.some(column => column.kind === "duration")).toBe(false);
  });

  it("rejects impossible negative durations and counts while retaining signed custom values", () => {
    expect(readRecorderNumber({ durationMs: -1 }, "durationMs")).toBeNull();
    expect(readRecorderNumber({ readCount: -1 }, "readCount")).toBeNull();
    expect(readRecorderNumber({ usd: -1 }, "usd")).toBe(-1);
  });
});
