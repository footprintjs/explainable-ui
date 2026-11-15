/** @vitest-environment jsdom */
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StoryNarrative } from "../../src/components/StoryNarrative/StoryNarrative";
import type { NarrativeEntry } from "../../src/types";

const entry = (type: string, text: string, runtimeStageId?: string, extra: Partial<NarrativeEntry> = {}): NarrativeEntry =>
  ({ type, text, runtimeStageId, stageName: runtimeStageId?.split("#")[0], depth: 0, ...extra });
const texts = (container: HTMLElement) => [...container.querySelectorAll('[data-fp="narrative-text"]')].map(node => node.textContent);

describe("StoryNarrative recorded headings and visit groups", () => {
  it("preserves recorded StageN, fork prefixes and unknown custom text without synthetic numbering", () => {
    const entries = [entry("stage", "Stage 7: Read request.", "read#3"), entry("fork", "[Parallel]: A, B.", "fork#4"),
      entry("selector", "[Selected]: B.", "fork#4"), entry("custom", "CUSTOM bytes kept.", "fork#4")];
    const { container } = render(<StoryNarrative entries={entries} revealedEntryCount={entries.length} unstyled />);
    expect(texts(container)).toEqual(entries.map(item => item.text));
    expect(container.textContent).not.toContain("1. [Stage");
  });

  it("groups only contiguous exact visits and emphasizes the admitted selected visit", () => {
    const entries = [entry("stage", "First run", "same#1"), entry("step", "Read x", "same#1"),
      entry("stage", "Second run", "same#5")];
    const { container } = render(<StoryNarrative entries={entries} revealedEntryCount={3} presentation="visits" selectedRuntimeStageId="same#5" />);
    const groups = container.querySelectorAll('[data-fp="narrative-visit"]');
    expect(groups).toHaveLength(2);
    expect(groups[0].getAttribute("data-current")).toBeNull();
    expect(groups[1].getAttribute("data-current")).toBe("true");
    expect(groups[1].textContent).toContain("same#5");
  });

  it("collapses only recorded operations and leaves decisions, errors and emitted events visible in array order", () => {
    const entries = [entry("stage", "Recorded stage", "a#0"), entry("step", "Read a = 2", "a#0"),
      entry("condition", "Decision: accepted", "a#0"), entry("step", "Write b = 3", "a#0"),
      entry("error", "Attempt failed", "a#0"), entry("emit", "queued", "a#0")];
    const { container } = render(<StoryNarrative entries={entries} revealedEntryCount={entries.length} presentation="visits" />);
    const operations = [...container.querySelectorAll('details[data-fp="narrative-operations"]')];
    expect(operations).toHaveLength(2);
    expect(operations.every(detail => !detail.hasAttribute("open"))).toBe(true);
    for (const text of ["Decision: accepted", "Attempt failed", "queued"]) expect(screen.getByText(text).closest("details")).toBeNull();
    expect(texts(container)).toEqual(entries.map(item => item.text));
  });

  it("preserves repeated subflow entry and exit boundaries and hides nested internals", () => {
    const entries = [entry("subflow", "Entering Prepare", "mount#1", { subflowId: "prepare", direction: "entry" }),
      entry("stage", "Hidden child", "prepare/inner#2", { subflowId: "prepare" }),
      entry("subflow", "Exiting Prepare", "mount#1", { subflowId: "prepare", direction: "exit" }),
      entry("subflow", "Entering Prepare again", "mount#8", { subflowId: "prepare", direction: "entry" })];
    const { container } = render(<StoryNarrative entries={entries} revealedEntryCount={4} presentation="visits" />);
    expect(texts(container)).toEqual(["Entering Prepare", "Exiting Prepare", "Entering Prepare again"]);
  });

  it("never merges a reappearing id across another recorded visit", () => {
    const entries = [entry("stage", "A entry", "a#0"), entry("stage", "B", "b#1"), entry("emit", "A late event", "a#0")];
    const { container } = render(<StoryNarrative entries={entries} revealedEntryCount={3} presentation="visits" />);
    expect(container.querySelectorAll('[data-fp="narrative-visit"]')).toHaveLength(3);
    expect(texts(container)).toEqual(entries.map(item => item.text));
  });

  it.each([false, true])("bounds long text with an accessible full-text action (unstyled=%s)", unstyled => {
    const text = "payload-".repeat(120);
    render(<StoryNarrative entries={[entry("step", text, "a#0")]} revealedEntryCount={1} unstyled={unstyled} />);
    expect(screen.queryByText(text)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Show full recorded text/ }));
    expect(screen.getByText(text)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Show less recorded text" }));
    expect(screen.queryByText(text)).toBeNull();
  });

  it("renders future hints and accessible log name in unstyled mode without future contents", () => {
    render(<StoryNarrative entries={[entry("stage", "Visible", "a#0"), entry("stage", "Future", "b#1")]} revealedEntryCount={1} unstyled />);
    const log = screen.getByRole("log", { name: "Execution narrative" });
    expect(within(log).getByText("1 more entry ahead...")).toBeTruthy();
    expect(screen.queryByText("Future")).toBeNull();
  });
});
