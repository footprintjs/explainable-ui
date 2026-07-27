/** @vitest-environment jsdom */
/**
 * ExplainableShell — a recording tells its own story.
 *
 * Replaying a frozen `getSnapshot()` there is no executor left to call
 * `getNarrativeEntries()` on. When the run was recorded WITH footprintjs's
 * narrative recorder the snapshot carries the entries itself, so the shell
 * reads them from there. The `narrativeEntries` prop still wins — a caller
 * that passes entries is never second-guessed.
 */
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import * as React from "react";

import { ExplainableShell } from "../../src/components/ExplainableShell/ExplainableShell";
import type { NarrativeEntry, StageSnapshot } from "../../src/types";

const SNAPSHOTS: StageSnapshot[] = [
  {
    stageName: "seed",
    stageLabel: "Seed",
    runtimeStageId: "seed#0",
    memory: {},
    narrative: "",
    startMs: 0,
    durationMs: 0,
  },
  {
    stageName: "sum",
    stageLabel: "Sum",
    runtimeStageId: "sum#1",
    memory: {},
    narrative: "",
    startMs: 0,
    durationMs: 0,
  },
];

const RECORDED_ENTRIES = [
  { type: "stage", text: "Seeded the run from the request.", depth: 0, stageId: "seed", runtimeStageId: "seed#0", stageName: "Seed" },
  { type: "stage", text: "Totalled the line items.", depth: 0, stageId: "sum", runtimeStageId: "sum#1", stageName: "Sum" },
];

function snapshotWithNarrative(recorderName = "Narrative") {
  return {
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
    recorders: [{ id: "combined-narrative", name: recorderName, data: RECORDED_ENTRIES }],
  };
}

function renderShell(props: Record<string, unknown>) {
  return render(
    React.createElement(ExplainableShell, {
      snapshots: SNAPSHOTS,
      title: "Replay",
      ...props,
    } as never),
  );
}

/** Text of the STORY panel specifically — not "somewhere on the page",
 *  which a raw recorder dump would also satisfy. */
const storyText = (container: HTMLElement): string =>
  container.querySelector('[data-fp="story-narrative"]')?.textContent ?? "";

/** The Story TAB — a clickable tab, not the word "Story" anywhere on the
 *  page (the empty-state copy names the recorders you could attach, and
 *  that is help, not a story). */
const storyTabs = (container: HTMLElement): Element[] =>
  [...container.querySelectorAll("button")].filter((b) => b.textContent?.trim() === "Story");

describe("ExplainableShell — narrative carried by the snapshot", () => {
  it("renders the Story panel from the recorded entries", () => {
    const { container } = renderShell({ runtimeSnapshot: snapshotWithNarrative() as never });
    // "Story" is the user-facing name of the narrative tab.
    expect(storyTabs(container)).toHaveLength(1);
    expect(container.querySelector('[data-fp="story-narrative"]')).toBeTruthy();
    expect(storyText(container)).toContain("Seeded the run from the request.");
  });

  it("finds it by shape when upstream names the recorder something else", () => {
    const { container } = renderShell({
      runtimeSnapshot: snapshotWithNarrative("Execution Log") as never,
    });
    expect(storyText(container)).toContain("Seeded the run from the request.");
  });

  it("does not ALSO render the same recorder as a raw data tab", () => {
    const { container } = renderShell({ runtimeSnapshot: snapshotWithNarrative() as never });
    // One tab for the story — not a second one auto-generated from the
    // recorder's payload (which would show the entries as JSON).
    expect(storyTabs(container)).toHaveLength(1);
  });

  it("the narrativeEntries prop still wins", () => {
    const mine: NarrativeEntry[] = [
      { type: "stage", text: "CALLER SUPPLIED", depth: 0, stageId: "seed", runtimeStageId: "seed#0", stageName: "Seed" },
    ];
    const { container } = renderShell({
      runtimeSnapshot: snapshotWithNarrative() as never,
      narrativeEntries: mine,
    });
    expect(storyText(container)).toContain("CALLER SUPPLIED");
    expect(storyText(container)).not.toContain("Seeded the run from the request.");
  });

  it("no narrative recorded → no Story tab (nothing invented)", () => {
    const bare = { ...snapshotWithNarrative(), recorders: [] };
    const { container } = renderShell({ runtimeSnapshot: bare as never });
    expect(storyTabs(container)).toHaveLength(0);
    expect(container.querySelector('[data-fp="story-narrative"]')).toBeNull();
  });
});
