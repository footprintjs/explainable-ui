/** @vitest-environment jsdom */
import * as React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CommentaryPanel } from "../../src/components/ExplainableView/CommentaryPanel";
import { ExplainableProvider, type ExplainableRecording } from "../../src/components/ExplainableView/ExplainableContext";
import { LensWorkbenchContext, type LensWorkbenchContextValue } from "../../src/components/ExplainableShell/LensWorkbench";
import type { NarrativeEntry, StageSnapshot } from "../../src/types";

const snapshots: StageSnapshot[] = [0, 1, 2].map(index => ({ stageName: "Check", stageLabel: `Check ${index + 1}`,
  runtimeStageId: `check#${index}`, narrative: "Not an inferred comment", memory: {}, startMs: index, durationMs: 1 }));
const entries: NarrativeEntry[] = snapshots.map((snapshot, index) => ({ type: index === 1 ? "business-comment" : "stage",
  text: `Recorded comment ${index + 1}.`, runtimeStageId: snapshot.runtimeStageId, stageId: "Check", depth: 0 }));
const recording: ExplainableRecording = {
  snapshot: { sharedState: {}, executionTree: { id: "Check", name: "Check", runtimeStageId: "check#0",
    next: { id: "Check", name: "Check", runtimeStageId: "check#1", next: { id: "Check", name: "Check", runtimeStageId: "check#2" } } },
  commitLog: snapshots.map((snapshot, index) => ({ idx: index, stage: "Check", stageId: "Check", runtimeStageId: snapshot.runtimeStageId,
    overwrite: {}, updates: {}, trace: [] })) }, narrativeEntries: entries,
};
function lens(index: number, extra: Partial<LensWorkbenchContextValue> = {}): LensWorkbenchContextValue {
  return { snapshots, selectedIndex: index, selectedSnapshot: snapshots[index], narrativeEntries: entries,
    invocationPath: [], narrativeAvailable: true, ...extra } as LensWorkbenchContextValue;
}

describe("CommentaryPanel shared owner bridge", () => {
  it("follows raw JSON recording cursor changes and rewind without another position", () => {
    const view = render(<ExplainableProvider recording={JSON.stringify(recording)} selectedIndex={0}>
      <CommentaryPanel presentation="current" />
    </ExplainableProvider>);
    expect(screen.getByText("Recorded comment 1.")).toBeTruthy();
    expect(screen.queryByText("Recorded comment 2.")).toBeNull();
    view.rerender(<ExplainableProvider recording={JSON.stringify(recording)} selectedIndex={2}><CommentaryPanel presentation="current" /></ExplainableProvider>);
    expect(screen.queryByText("Recorded comment 1.")).toBeNull();
    expect(screen.getByText("Recorded comment 3.")).toBeTruthy();
    view.rerender(<ExplainableProvider recording={JSON.stringify(recording)} selectedIndex={0}><CommentaryPanel presentation="current" /></ExplainableProvider>);
    expect(screen.getByText("Recorded comment 1.")).toBeTruthy();
    expect(screen.queryByText("Recorded comment 3.")).toBeNull();
  });

  it("prefers the complete Lens cursor when both provider contexts are present", () => {
    render(<ExplainableProvider recording={recording} selectedIndex={0}>
      <LensWorkbenchContext.Provider value={lens(1)}><CommentaryPanel presentation="current" /></LensWorkbenchContext.Provider>
    </ExplainableProvider>);
    expect(screen.getByText("Recorded comment 2.")).toBeTruthy();
    expect(screen.queryByText("Recorded comment 1.")).toBeNull();
    expect(screen.queryByText("business-comment")).toBeNull();
    expect(screen.queryByText("check#1")).toBeNull();
  });

  it("reuses the accumulated transcript for plain prose, following forward and rewinding without future text", () => {
    const scroll = vi.fn(), oldScroll = HTMLElement.prototype.scrollIntoView;
    HTMLElement.prototype.scrollIntoView = scroll;
    const panel = (index: number, showEntryTypes = false) => <LensWorkbenchContext.Provider value={lens(index)}>
      <CommentaryPanel presentation="log" showEntryTypes={showEntryTypes} followCursor />
    </LensWorkbenchContext.Provider>;
    try {
      const view = render(panel(0));
      expect(screen.getByText("Recorded comment 1.")).toBeTruthy();
      expect(screen.queryByText("Recorded comment 2.")).toBeNull();
      view.rerender(panel(1));
      expect(screen.getByText("Recorded comment 1.")).toBeTruthy();
      expect(screen.getByText("Recorded comment 2.")).toBeTruthy();
      expect(screen.queryByText("Recorded comment 3.")).toBeNull();
      expect(screen.queryByText("business-comment")).toBeNull();
      expect(screen.queryByText("check#1")).toBeNull();
      expect(view.container.querySelector('[data-fp-part="commentary-entry-kind"]')).toBeNull();
      expect(view.container.querySelector<HTMLElement>('[data-fp="commentary-entry"]')?.style.display).not.toBe("grid");
      expect(view.container.querySelector('[data-current="true"]')?.textContent).toBe("Recorded comment 2.");
      expect(scroll).toHaveBeenCalled();
      scroll.mockClear();
      view.rerender(panel(0));
      expect(screen.getByText("Recorded comment 1.")).toBeTruthy();
      expect(screen.queryByText("Recorded comment 2.")).toBeNull();
      expect(scroll).toHaveBeenCalled();
      view.rerender(panel(1, true));
      expect(screen.getByText("business-comment")).toBeTruthy();
    } finally { HTMLElement.prototype.scrollIntoView = oldScroll; }
  });

  it("retains the plain accumulated transcript in unstyled mode", () => {
    const view = render(<LensWorkbenchContext.Provider value={lens(1)}>
      <CommentaryPanel showEntryTypes={false} unstyled />
    </LensWorkbenchContext.Provider>);
    expect(screen.getByText("Recorded comment 1.")).toBeTruthy();
    expect(screen.getByText("Recorded comment 2.")).toBeTruthy();
    expect(screen.queryByText("business-comment")).toBeNull();
    expect(view.container.querySelectorAll("[style]")).toHaveLength(0);
  });

  it("follows the last displayed selected-visit comment without reordering out-of-order transcript entries", () => {
    const scroll = vi.fn(), oldScroll = HTMLElement.prototype.scrollIntoView;
    HTMLElement.prototype.scrollIntoView = scroll;
    const outOfOrder = [entries[1], entries[1], entries[0]];
    const renderEntry = vi.fn((entry: NarrativeEntry, _context: { index: number; current: boolean }) => entry.text);
    const panel = (index: number) => <LensWorkbenchContext.Provider value={lens(index, { narrativeEntries: outOfOrder })}>
      <CommentaryPanel showEntryTypes={false} followCursor renderEntry={renderEntry} />
    </LensWorkbenchContext.Provider>;
    try {
      const view = render(panel(0));
      expect(screen.queryByText("Recorded comment 2.")).toBeNull();
      expect(screen.getByText("Recorded comment 1.")).toBeTruthy();
      scroll.mockClear();
      renderEntry.mockClear();
      view.rerender(panel(1));
      const rows = Array.from(view.container.querySelectorAll('[data-fp="commentary-entry"]'));
      expect(rows.map(row => row.textContent)).toEqual(["Recorded comment 2.", "Recorded comment 2.", "Recorded comment 1."]);
      expect(rows.map(row => row.getAttribute("data-source-index"))).toEqual(["0", "1", "2"]);
      expect(view.container.querySelectorAll('[data-current="true"]')).toHaveLength(1);
      expect(rows[1].getAttribute("data-current")).toBe("true");
      expect(scroll).toHaveBeenCalledTimes(1);
      expect(scroll.mock.contexts[0]).toBe(rows[1]);
      expect(renderEntry.mock.calls.map(call => call[1])).toEqual([
        { index: 0, current: false }, { index: 1, current: true }, { index: 2, current: false },
      ]);
      scroll.mockClear();
      view.rerender(panel(2));
      expect(view.container.querySelector('[data-current="true"]')).toBeNull();
      expect(scroll).not.toHaveBeenCalled();
      expect(screen.getAllByText("Recorded comment 2.")).toHaveLength(2);
    } finally { HTMLElement.prototype.scrollIntoView = oldScroll; }
  });

  it("retains log rendering, duplicate events and custom renderEntry contexts", () => {
    const repeated = { ...entries[1], text: "Repeated business note." };
    const renderEntry = vi.fn((entry: NarrativeEntry, context: { index: number; current: boolean }) =>
      <span>{context.index}: {entry.text}</span>);
    const value = lens(1, { narrativeEntries: [entries[0], repeated, repeated, entries[2]] });
    render(<LensWorkbenchContext.Provider value={value}><CommentaryPanel renderEntry={renderEntry} maxLines={2} /></LensWorkbenchContext.Provider>);
    expect(screen.getByText("0: Repeated business note.")).toBeTruthy();
    expect(screen.getByText("1: Repeated business note.")).toBeTruthy();
    expect(screen.getByText(/1 earlier lines hidden by the line limit/)).toBeTruthy();
    expect(renderEntry.mock.calls.map(call => call[1])).toEqual([{ index: 0, current: false }, { index: 1, current: true }]);
    expect(screen.queryByText("Recorded comment 3.")).toBeNull();
  });

  it.each([false, true])("quarantines stale same-ID prose and recovers with a fresh admitted stream (unstyled=%s)", unstyled => {
    const panel = (value: LensWorkbenchContextValue) => <LensWorkbenchContext.Provider value={value}>
      <CommentaryPanel presentation="current" unstyled={unstyled} />
    </LensWorkbenchContext.Provider>;
    const view = render(panel(lens(1, { narrativeAvailable: false })));
    expect(screen.getByRole("status").textContent).toBe("Commentary is unavailable for this recording.");
    expect(screen.queryByText("Recorded comment 2.")).toBeNull();
    view.rerender(panel(lens(1, { narrativeEntries: [{ ...entries[1], text: "Fresh recorded prose." }] })));
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.getByText("Fresh recorded prose.")).toBeTruthy();
    expect(screen.queryByText("Recorded comment 2.")).toBeNull();
    if (unstyled) expect(view.container.querySelectorAll("[style]")).toHaveLength(0);
  });

  it("does not render unplaceable legacy prose or call its custom renderer", () => {
    const renderEntry = vi.fn();
    render(<LensWorkbenchContext.Provider value={lens(0, { narrativeEntries: [{ ...entries[0], runtimeStageId: undefined }] })}>
      <CommentaryPanel presentation="current" renderEntry={renderEntry} />
    </LensWorkbenchContext.Provider>);
    expect(screen.getByRole("status").textContent).toContain("not synchronized to an exact recorded step");
    expect(screen.queryByText("Recorded comment 1.")).toBeNull();
    expect(renderEntry).not.toHaveBeenCalled();
  });

  it("keeps current-stage line limits explicit without promising that scrubbing reveals capped lines", () => {
    const extra = { ...entries[0], text: "Another note from this same stage." };
    render(<LensWorkbenchContext.Provider value={lens(0, { narrativeEntries: [entries[0], extra] })}>
      <CommentaryPanel presentation="current" maxLines={1} />
    </LensWorkbenchContext.Provider>);
    expect(screen.getByText(/earlier comments from this step hidden by the line limit/)).toBeTruthy();
    expect(screen.queryByText(/scrub backward/i)).toBeNull();
    expect(screen.getByText("Another note from this same stage.")).toBeTruthy();
    expect(screen.queryByText("Recorded comment 1.")).toBeNull();
  });

  it("does not claim commentary is absent from the recording when it only belongs to a later visit", () => {
    render(<LensWorkbenchContext.Provider value={lens(0, { narrativeEntries: [entries[2]] })}>
      <CommentaryPanel />
    </LensWorkbenchContext.Provider>);
    expect(screen.getByText("No recorded commentary through this step.")).toBeTruthy();
    expect(screen.queryByText("This recording carried no narrative commentary.")).toBeNull();
    expect(screen.queryByText("Recorded comment 3.")).toBeNull();
  });

  it("keeps an explicit empty entry stream empty instead of replacing it from other narrative fields", () => {
    render(<ExplainableProvider recording={{ ...recording, narrativeEntries: [] }}>
      <CommentaryPanel emptyMessage="No saved comments were supplied." />
    </ExplainableProvider>);
    expect(screen.getByText("No saved comments were supplied.")).toBeTruthy();
    expect(screen.queryByText("Not an inferred comment")).toBeNull();
    expect(screen.queryByText("Recorded comment 1.")).toBeNull();
  });

  it("never scrolls while reading unless Follow cursor is explicitly requested", () => {
    const scroll = vi.fn(), old = HTMLElement.prototype.scrollIntoView;
    HTMLElement.prototype.scrollIntoView = scroll;
    try {
      const view = render(<LensWorkbenchContext.Provider value={lens(0)}><CommentaryPanel presentation="current" /></LensWorkbenchContext.Provider>);
      view.rerender(<LensWorkbenchContext.Provider value={lens(1)}><CommentaryPanel presentation="current" /></LensWorkbenchContext.Provider>);
      expect(scroll).not.toHaveBeenCalled();
      view.rerender(<LensWorkbenchContext.Provider value={lens(1)}><CommentaryPanel presentation="current" followCursor /></LensWorkbenchContext.Provider>);
      expect(scroll).toHaveBeenCalled();
    } finally { HTMLElement.prototype.scrollIntoView = old; }
  });

  it("respects reduced motion even when Follow cursor is requested", () => {
    const scroll = vi.fn(), oldScroll = HTMLElement.prototype.scrollIntoView, oldMedia = window.matchMedia;
    HTMLElement.prototype.scrollIntoView = scroll;
    window.matchMedia = vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() });
    try {
      render(<LensWorkbenchContext.Provider value={lens(1)}><CommentaryPanel presentation="current" followCursor /></LensWorkbenchContext.Provider>);
      expect(scroll).not.toHaveBeenCalled();
    } finally { HTMLElement.prototype.scrollIntoView = oldScroll; window.matchMedia = oldMedia; }
  });
});
