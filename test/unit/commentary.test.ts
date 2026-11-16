import { describe, expect, it } from "vitest";
import { projectCommentary, type CommentaryInput } from "../../src/model/commentary";
import type { NarrativeEntry, StageSnapshot } from "../../src/types";

const snapshot = (id: string, subflowId?: string): StageSnapshot => ({ stageName: "Check", stageLabel: "Check order",
  runtimeStageId: id, subflowId, narrative: "Fallback is not commentary", memory: {}, startMs: 0, durationMs: 1 });
const entry = (id: string | undefined, text: string, subflowId?: string, type = "stage"): NarrativeEntry =>
  ({ type, text, runtimeStageId: id, subflowId, stageId: "check", stageName: "Check", depth: 0 });
const input = (extra: Partial<CommentaryInput> = {}): CommentaryInput => ({
  snapshots: [snapshot("check#0"), snapshot("check#3")], selectedIndex: 1,
  narrativeEntries: [entry("check#0", "First check"), entry("check#3", "Repeated check")], ...extra,
});
const text = (value: ReturnType<typeof projectCommentary>) => value.entries.map(item => item.entry.text);

describe("commentary exact cursor projection", () => {
  it("keeps the legacy log through the cursor and isolates the exact current repeated visit", () => {
    expect(text(projectCommentary(input({ selectedIndex: 0 })))).toEqual(["First check"]);
    expect(text(projectCommentary(input()))).toEqual(["First check", "Repeated check"]);
    expect(text(projectCommentary(input({ presentation: "current" })))).toEqual(["Repeated check"]);
    expect(text(projectCommentary(input({ presentation: "current", selectedIndex: 0 })))).toEqual(["First check"]);
  });

  it("filters future visits by identity when recorder arrival order differs from rail order", () => {
    const events = [entry("check#3", "Future arrived first"), entry("check#0", "Visible second"), entry("check#3", "Future duplicate")];
    const first = projectCommentary(input({ narrativeEntries: events, selectedIndex: 0 }));
    expect(text(first)).toEqual(["Visible second"]);
    expect(first.futureCount).toBe(2);
    expect(text(projectCommentary(input({ narrativeEntries: events })))).toEqual(events.map(item => item.text));
  });

  it("keeps duplicate recorded messages and original event indices", () => {
    const repeated = entry("check#3", "Same message", undefined, "custom-comment");
    const result = projectCommentary(input({ narrativeEntries: [entry("check#0", "Earlier"), repeated, repeated], maxLines: 2 }));
    expect(text(result)).toEqual(["Same message", "Same message"]);
    expect(result.entries.map(item => item.sourceIndex)).toEqual([1, 2]);
    expect(result.hiddenCount).toBe(1);
    expect(result.entries.every(item => item.entry === repeated)).toBe(true);
  });

  it("does not invent commentary from snapshot narrative when the explicit entry stream is empty", () => {
    const result = projectCommentary(input({ narrativeEntries: [] }));
    expect(result.availability).toBe("exact");
    expect(text(result)).toEqual([]);
  });

  it("never shows a previous visit's commentary as the current step's prose", () => {
    const result = projectCommentary(input({ narrativeEntries: [entry("check#0", "Earlier only")], presentation: "current" }));
    expect(result.availability).toBe("exact");
    expect(result.selectedRuntimeStageId).toBe("check#3");
    expect(text(result)).toEqual([]);
  });

  it.each([-1, 9, NaN, 0.5])("withholds entries for an invalid cursor %s", selectedIndex => {
    const result = projectCommentary(input({ selectedIndex }));
    expect(result.availability).toBe("unsynchronized");
    expect(text(result)).toEqual([]);
  });

  it.each(["missing-entry", "missing-rail", "duplicate-rail", "unmatched-entry"])("does not infer legacy visit identity for %s", problem => {
    const value = input();
    const result = projectCommentary({ ...value,
      snapshots: problem === "missing-rail" ? [{ ...snapshot("check#0"), runtimeStageId: undefined }]
        : problem === "duplicate-rail" ? [snapshot("check#0"), snapshot("check#0")] : value.snapshots,
      narrativeEntries: problem === "missing-entry" ? [entry(undefined, "Legacy prose")]
        : problem === "unmatched-entry" ? [entry("old-run#9", "Stale prose")] : value.narrativeEntries,
    });
    expect(result.availability).toBe("unsynchronized");
    expect(text(result)).toEqual([]);
  });

  it("quarantines a known stale source even when its exact-looking ids are reused", () => {
    const result = projectCommentary(input({ narrativeAvailable: false }));
    expect(result.availability).toBe("unavailable");
    expect(text(result)).toEqual([]);
  });

  it("admits child visits that actually appear on a flattened whole-recording rail", () => {
    const result = projectCommentary(input({ snapshots: [snapshot("root#0"), snapshot("first/check#1", "first")], selectedIndex: 1,
      narrativeEntries: [entry("root#0", "Root comment"), entry("first/check#1", "Child comment", "first")], presentation: "current" }));
    expect(result.availability).toBe("exact");
    expect(text(result)).toEqual(["Child comment"]);
  });

  it("does not admit a sibling body with a rebased matching id inside a drilled invocation", () => {
    const result = projectCommentary(input({ snapshots: [snapshot("check#0")], selectedIndex: 0, narrativeScopeSubflowId: "first",
      narrativeEntries: [entry("check#0", "Own child", "first"), entry("check#0", "Sibling hidden", "second"), entry("check#0", "Nested hidden", "first/nested")] }));
    expect(result.availability).toBe("exact");
    expect(text(result)).toEqual(["Own child"]);
  });

  it("withholds conflicting scope claims for one exact id when no owner can disambiguate them", () => {
    const result = projectCommentary(input({ snapshots: [snapshot("check#0")], selectedIndex: 0,
      narrativeEntries: [entry("check#0", "A", "first"), entry("check#0", "B", "second")] }));
    expect(result.availability).toBe("unsynchronized");
    expect(text(result)).toEqual([]);
  });

  it("uses an explicit snapshot scope to exclude a conflicting commentary owner", () => {
    const result = projectCommentary(input({ snapshots: [snapshot("check#0", "first")], selectedIndex: 0,
      narrativeEntries: [entry("check#0", "Own", "first"), entry("check#0", "Sibling", "second")] }));
    expect(result.availability).toBe("exact");
    expect(text(result)).toEqual(["Own"]);
  });

  it("keeps exact mount entry and exit boundaries without admitting nested bodies", () => {
    const result = projectCommentary(input({ snapshots: [snapshot("child/mount#0")], selectedIndex: 0, narrativeScopeSubflowId: "child",
      narrativeEntries: [entry("child/mount#0", "Entering nested", "child/nested", "subflow"),
        entry("child/nested/check#1", "Nested body", "child/nested"),
        entry("child/mount#0", "Exiting nested", "child/nested", "subflow"),
        entry("child/mount#0", "Sibling boundary", "sibling", "subflow")] }));
    expect(result.availability).toBe("exact");
    expect(text(result)).toEqual(["Entering nested", "Exiting nested"]);
  });

  it("treats a zero line limit as an explicit empty window", () => {
    const result = projectCommentary(input({ maxLines: 0 }));
    expect(text(result)).toEqual([]);
    expect(result.hiddenCount).toBe(2);
  });
});
