/** @vitest-environment jsdom */
import * as React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CommentaryPanel } from "../../src/components/ExplainableView/CommentaryPanel";
import { LensWorkbenchContext, type LensWorkbenchContextValue } from "../../src/components/ExplainableShell/LensWorkbench";
import type { NarrativeEntry, StageSnapshot } from "../../src/types";

const snapshots: StageSnapshot[] = [0, 1, 2].map(index => ({ stageName: "Review", stageLabel: `Snapshot label ${index}`,
  runtimeStageId: `review#${index}`, narrative: "Not a separate result.", memory: {}, startMs: index, durationMs: 1 }));
const entry = (type: string, text: string, index: number, stageName?: string): NarrativeEntry => ({
  type, text, runtimeStageId: `review#${index}`, depth: type === "stage" ? 0 : 1, stageName,
});
const entries = [entry("stage", "The request arrived.", 0, "Recorded intake"), entry("step", "Read amount = 4.", 0),
  entry("condition", "The recorded decision accepted it.", 0), entry("step", "Write total = 5.", 0),
  entry("emit", "The quote was recorded as 5.", 0), entry("stage", "The review ran again.", 1),
  entry("error", "The recorded attempt failed.", 1), entry("future-kind", "The original custom text.", 1),
  entry("stage", "A future visit must remain hidden.", 2)];
function value(index: number, narrativeEntries = entries): LensWorkbenchContextValue {
  return { snapshots, selectedIndex: index, selectedSnapshot: snapshots[index], narrativeEntries,
    invocationPath: [], narrativeAvailable: true } as unknown as LensWorkbenchContextValue;
}
function panel(index: number, narrativeEntries = entries, extra: Partial<React.ComponentProps<typeof CommentaryPanel>> = {}) {
  return <LensWorkbenchContext.Provider value={value(index, narrativeEntries)}>
    <CommentaryPanel groupByStage showEntryTypes={false} {...extra} />
  </LensWorkbenchContext.Provider>;
}

describe("CommentaryPanel existing recorded visit presentation", () => {
  it("keeps standalone grouping opt-in", () => {
    const view = render(<LensWorkbenchContext.Provider value={value(0)}><CommentaryPanel /></LensWorkbenchContext.Provider>);
    expect(view.container.querySelector('[data-fp="commentary-visit"]')).toBeNull();
    expect(screen.getByText("The request arrived.")).toBeTruthy();
  });

  it("restores recorded stage headings and operation disclosure while keeping decisions, outcomes and errors visible", () => {
    const view = render(panel(1));
    const groups = view.container.querySelectorAll('[data-fp="commentary-visit"]');
    expect(groups).toHaveLength(2);
    expect(groups[0].getAttribute("aria-label")).toBe("Stage Recorded intake");
    expect(groups[1].getAttribute("aria-label")).toBe("Stage Snapshot label 1");
    expect(groups[1].getAttribute("data-current")).toBe("true");
    const operations = view.container.querySelectorAll('details[data-fp="commentary-operations"]');
    expect(operations).toHaveLength(2);
    expect(Array.from(operations).every(details => !details.hasAttribute("open"))).toBe(true);
    expect(screen.getByText("Read amount = 4.").closest("details")).toBe(operations[0]);
    for (const text of ["The recorded decision accepted it.", "The quote was recorded as 5.", "The recorded attempt failed.", "The original custom text."]) {
      expect(screen.getByText(text).closest("details")).toBeNull();
    }
    expect(screen.queryByText("review#0")).toBeNull();
    expect(view.container.querySelector('[data-fp-part="commentary-entry-kind"]')).toBeNull();
    expect(screen.queryByText("A future visit must remain hidden.")).toBeNull();
    expect(screen.queryByText("Not a separate result.")).toBeNull();
    expect(screen.queryByText(/^Result$/)).toBeNull();
  });

  it("keeps repeated-name visits separate and rewinds the accumulated transcript without later headings", () => {
    const view = render(panel(1));
    expect(view.container.querySelectorAll('[data-fp="commentary-visit"]')).toHaveLength(2);
    view.rerender(panel(0));
    expect(view.container.querySelectorAll('[data-fp="commentary-visit"]')).toHaveLength(1);
    expect(screen.getByText("Recorded intake")).toBeTruthy();
    expect(screen.queryByText("Snapshot label 1")).toBeNull();
    expect(screen.queryByText("The recorded attempt failed.")).toBeNull();
  });

  it("preserves noncontiguous visits, duplicate rows, source indices and custom renderer global contexts", () => {
    const reordered = [entry("emit", "A repeated comment.", 0), entry("emit", "Selected visit.", 1),
      entry("emit", "A repeated comment.", 0), entry("emit", "Future.", 2)];
    const renderEntry = vi.fn((item: NarrativeEntry, _context: { index: number; current: boolean }) => item.text);
    const view = render(panel(1, reordered, { renderEntry }));
    const groups = view.container.querySelectorAll('[data-fp="commentary-visit"]');
    expect(Array.from(groups).map(group => group.getAttribute("data-runtime-stage-id"))).toEqual(["review#0", "review#1", "review#0"]);
    const rows = view.container.querySelectorAll('[data-fp="commentary-entry"]');
    expect(Array.from(rows).map(row => row.textContent)).toEqual(["A repeated comment.", "Selected visit.", "A repeated comment."]);
    expect(Array.from(rows).map(row => row.getAttribute("data-source-index"))).toEqual(["0", "1", "2"]);
    expect(renderEntry.mock.calls.map(call => call[1])).toEqual([
      { index: 0, current: false }, { index: 1, current: true }, { index: 2, current: false },
    ]);
    expect(screen.queryByText("Future.")).toBeNull();
  });

  it("follows a visible stage header when the selected comment is a closed recorded operation", () => {
    const scroll = vi.fn(), oldScroll = HTMLElement.prototype.scrollIntoView;
    HTMLElement.prototype.scrollIntoView = scroll;
    const reordered = [entry("step", "Selected read.", 1), entry("emit", "Earlier visit arrived later.", 0)];
    try {
      const view = render(panel(1, reordered, { followCursor: true }));
      const selected = view.container.querySelector('[data-fp="commentary-entry"][data-current="true"]');
      const details = selected?.closest("details");
      expect(details).toBeTruthy();
      expect(details?.hasAttribute("open")).toBe(false);
      expect(scroll).toHaveBeenCalledTimes(1);
      const target = scroll.mock.contexts[0] as HTMLElement;
      expect(target.getAttribute("data-fp")).toBe("commentary-visit-heading");
      expect(target.closest("details")).toBeNull();
      expect(target.textContent).toContain("Snapshot label 1");
      expect(target.closest('[data-fp="commentary-visit"]')?.getAttribute("data-runtime-stage-id")).toBe("review#1");
    } finally { HTMLElement.prototype.scrollIntoView = oldScroll; }
  });

  it("does not select or follow another visit when the selected comment is outside the visible line window", () => {
    const scroll = vi.fn(), oldScroll = HTMLElement.prototype.scrollIntoView;
    HTMLElement.prototype.scrollIntoView = scroll;
    try {
      const view = render(panel(1, [entry("step", "Hidden selected read.", 1), entry("emit", "Visible older visit.", 0)],
        { followCursor: true, maxLines: 1 }));
      expect(view.container.querySelector('[data-current="true"]')).toBeNull();
      expect(scroll).not.toHaveBeenCalled();
      expect(screen.queryByText("Hidden selected read.")).toBeNull();
      expect(screen.getByText("Visible older visit.")).toBeTruthy();
    } finally { HTMLElement.prototype.scrollIntoView = oldScroll; }
  });

  it.each([false, true])("reuses accessible recorded-text expansion in the grouped transcript (unstyled=%s)", unstyled => {
    const long = "Original recorded message. ".repeat(40);
    const view = render(panel(0, [entry("emit", long, 0, "Recorded title")], { unstyled }));
    expect(screen.queryByText(long.trim())).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Show full recorded text/ }));
    expect(screen.getByText(long.trim())).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Show less recorded text" }));
    expect(screen.queryByText(long.trim())).toBeNull();
    expect(screen.getByText("Recorded title")).toBeTruthy();
    if (unstyled) expect(view.container.querySelectorAll("[style]")).toHaveLength(0);
  });
});
