/** @vitest-environment jsdom */
import * as React from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ExplainableShell } from "../../src/components/ExplainableShell/ExplainableShell";
import { CommentaryPanel } from "../../src/components/ExplainableView/CommentaryPanel";
import { TraceViewer } from "../../src/components/TraceViewer/TraceViewer";
import { useLensWorkbench } from "../../src/components/ExplainableShell/LensWorkbench";
import type { NarrativeEntry, StageSnapshot } from "../../src/types";

type Props = React.ComponentProps<typeof ExplainableShell>;

function storyRun(runId = "story-one") {
  const stages = [
    { id: "collect", label: "Collect" }, { id: "validate", label: "Validate" },
    { id: "validate", label: "Validate" }, { id: "finish", label: "Finish" },
  ].map((stage, index) => ({ ...stage, runtimeStageId: `${stage.id}#${index}`, count: index + 1 }));
  const snapshots: StageSnapshot[] = stages.map((stage, index) => ({ stageName: stage.id, stageLabel: stage.label,
    runtimeStageId: stage.runtimeStageId, memory: { count: stage.count }, narrative: "", startMs: index, durationMs: 1 }));
  const narrativeEntries: NarrativeEntry[] = [
    { type: "stage", text: "Collected order details.", depth: 0, stageId: "collect", stageName: "Collect", runtimeStageId: "collect#0" },
    { type: "stage", text: "Validated the first order.", depth: 0, stageId: "validate", stageName: "Validate", runtimeStageId: "validate#1" },
    { type: "stage", text: "Validated the second order.", depth: 0, stageId: "validate", stageName: "Validate", runtimeStageId: "validate#2" },
    { type: "condition", text: "Approved the second order.", depth: 1, stageId: "validate", stageName: "Validate", runtimeStageId: "validate#2" },
    { type: "stage", text: "Finished all orders.", depth: 0, stageId: "finish", stageName: "Finish", runtimeStageId: "finish#3" },
  ];
  const tree = stages.reduceRight<Record<string, unknown> | undefined>((next, stage) => ({ id: stage.id, name: stage.label,
    runtimeStageId: stage.runtimeStageId, stageReads: {}, stageWrites: { count: stage.count }, logs: {}, errors: {},
    ...(next ? { next } : {}) }), undefined);
  return { snapshots, narrativeEntries, runtimeSnapshot: { runId, sharedState: { count: 4 }, executionTree: tree, subflowResults: {},
    commitLog: stages.map(stage => ({ stage: stage.label, stageId: stage.id, runtimeStageId: stage.runtimeStageId,
      overwrite: { count: stage.count }, updates: {}, trace: [{ path: "count", verb: "set" }] })) } };
}

function setup(extra: Partial<Props> = {}) {
  const run = storyRun();
  // Admission cases deliberately request an exact-visit view. Passing an
  // explicit undefined below exercises the consumer's actual default surface.
  const commentaryOptions: Props["commentary"] = Object.prototype.hasOwnProperty.call(extra, "commentary") && extra.commentary === undefined
    ? undefined : { presentation: "current", followCursor: false, ...extra.commentary };
  const props: Props = { ...run, runtimeSnapshot: run.runtimeSnapshot as never, title: "Orders", view: "story",
    renderFlowchart: chart => <output aria-label="Chart visit">{chart.snapshots[chart.selectedIndex]?.runtimeStageId}</output>,
    ...extra, commentary: commentaryOptions };
  return { ...render(<ExplainableShell {...props} />), props, run };
}
function commentary() {
  const panel = document.querySelector('[data-fp="commentary-panel"]') as HTMLElement | null;
  expect(panel).toBeTruthy();
  return panel!;
}
function chartVisit() { return screen.getByLabelText("Chart visit").textContent; }
function ChartMountProbe({ visit, onMount, onUnmount }: { visit?: string; onMount: () => void; onUnmount: () => void }) {
  React.useEffect(() => { onMount(); return onUnmount; }, [onMount, onUnmount]);
  return <output aria-label="Chart visit">{visit}</output>;
}
function next(times = 1) {
  for (let index = 0; index < times; index++) fireEvent.click(screen.getByRole("button", { name: "Next stage" }));
}
function choose(index: number) {
  const ticks = screen.getByRole("toolbar").querySelectorAll('[data-fp="tt-tick"]');
  fireEvent.click(ticks[index]);
}
function withNarrowLayout(run: () => void) {
  const original = globalThis.ResizeObserver;
  class NarrowObserver {
    constructor(private readonly callback: ResizeObserverCallback) {}
    observe(target: Element) {
      if (target.getAttribute("data-fp") === "explainable-shell")
        this.callback([{ target, contentRect: { width: 480 } } as ResizeObserverEntry], this as unknown as ResizeObserver);
    }
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = NarrowObserver as unknown as typeof ResizeObserver;
  try { run(); } finally { globalThis.ResizeObserver = original; }
}

const originalMatchMedia = Object.getOwnPropertyDescriptor(window, "matchMedia");
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  if (originalMatchMedia) Object.defineProperty(window, "matchMedia", originalMatchMedia);
  else delete (window as { matchMedia?: unknown }).matchMedia;
});
function reducedMotion(value: boolean) {
  Object.defineProperty(window, "matchMedia", { configurable: true, value: (query: string) => ({
    matches: value && query.includes("prefers-reduced-motion: reduce"), media: query,
    addEventListener() {}, removeEventListener() {},
  }) });
}

describe("Lens Story commentary", () => {
  it("builds and rewinds the default scrolling transcript without revealing future lines", () => {
    reducedMotion(false);
    const scroll = vi.spyOn(Element.prototype, "scrollIntoView");
    setup({ commentary: undefined });
    const panel = commentary();
    expect(panel.getAttribute("data-presentation")).toBe("log");
    expect(panel.textContent).toContain("Collected order details.");
    expect(panel.textContent).not.toContain("Validated the first order.");
    scroll.mockClear();
    fireEvent.change(screen.getByRole("slider"), { target: { value: "2" } });
    expect(chartVisit()).toBe("validate#2");
    expect([...panel.querySelectorAll('[data-fp="commentary-prose"]')].map(entry => entry.textContent)).toEqual([
      "Collected order details.", "Validated the first order.", "Validated the second order.", "Approved the second order.",
    ]);
    expect(panel.textContent).not.toContain("Finished all orders.");
    expect(panel.querySelector('[data-fp-part="commentary-entry-kind"]')).toBeNull();
    expect(scroll).toHaveBeenCalled();
    const latestAnchor = scroll.mock.contexts.at(-1) as HTMLElement;
    expect(panel.contains(latestAnchor)).toBe(true);
    expect(latestAnchor.textContent).toContain("Approved the second order.");
    fireEvent.change(screen.getByRole("slider"), { target: { value: "1" } });
    expect(chartVisit()).toBe("validate#1");
    expect([...panel.querySelectorAll('[data-fp="commentary-prose"]')].map(entry => entry.textContent)).toEqual([
      "Collected order details.", "Validated the first order.",
    ]);
    expect(panel.textContent).not.toContain("Validated the second order.");
    expect(panel.textContent).not.toContain("Finished all orders.");
    expect((scroll.mock.contexts.at(-1) as HTMLElement).textContent).toContain("Validated the first order.");
  });

  it("preserves one cursor when switching between developer and Story views", () => {
    const scroll = vi.spyOn(Element.prototype, "scrollIntoView");
    const ui = setup({ view: undefined });
    expect(screen.getByRole("region", { name: "Stage activity" })).toBeTruthy();
    expect(document.querySelector('[data-fp="commentary-panel"]')).toBeNull();
    next();
    ui.rerender(<ExplainableShell {...ui.props} view="story" />);
    expect(chartVisit()).toBe("validate#1");
    expect(commentary().textContent).toContain("Validated the first order.");
    expect(commentary().textContent).not.toContain("Validated the second order.");
    next();
    expect(chartVisit()).toBe("validate#2");
    expect(commentary().textContent).toContain("Validated the second order.");
    expect(commentary().textContent).toContain("Approved the second order.");
    expect(commentary().textContent).not.toContain("Validated the first order.");
    expect(commentary().textContent).not.toContain("validate#2");
    expect(scroll).not.toHaveBeenCalled();
    ui.rerender(<ExplainableShell {...ui.props} view="developer" />);
    expect(screen.getByRole("region", { name: "Stage activity" }).querySelector('[data-fp="stage-activity-visit"]')?.textContent).toBe("validate#2");
    expect(chartVisit()).toBe("validate#2");
  });

  it("does not reveal a future visit whose log arrived before the current entry", () => {
    const run = storyRun();
    setup({ narrativeEntries: [run.narrativeEntries[4], ...run.narrativeEntries.slice(0, 4)], commentary: { presentation: "log" } });
    expect(commentary().textContent).toContain("Collected order details.");
    expect(commentary().textContent).not.toContain("Finished all orders.");
    next();
    expect(chartVisit()).toBe("validate#1");
    expect(commentary().textContent).toContain("Validated the first order.");
    expect(commentary().textContent).not.toContain("Validated the second order.");
    expect(commentary().textContent).not.toContain("Finished all orders.");
  });

  it("withholds current-step prose when only a stage name is recorded", () => {
    setup({ narrativeEntries: [{ type: "stage", text: "An unbound explanation must not be attributed here.",
      depth: 0, stageName: "Collect", stageId: "collect" }] });
    expect(chartVisit()).toBe("collect#0");
    expect(within(commentary()).getByRole("status").textContent).toContain("This commentary is not synchronized to an exact recorded step.");
    expect(commentary().textContent).not.toContain("An unbound explanation must not be attributed here.");
  });

  it("passes commentary title, custom entries and an explicit line limit to the shared panel", () => {
    setup({ commentary: { title: "Recorded outcome", presentation: "log", maxLines: 2,
      renderEntry: (entry, context) => <p data-recorded-visit={entry.runtimeStageId} data-current-entry={context.current}>{entry.text}</p> } });
    choose(2);
    expect(within(commentary()).getByText("Recorded outcome")).toBeTruthy();
    const rendered = [...commentary().querySelectorAll('[data-recorded-visit]')];
    expect(rendered.map(entry => entry.getAttribute("data-recorded-visit"))).toEqual(["validate#2", "validate#2"]);
    expect(rendered.map(entry => entry.textContent)).toEqual(["Validated the second order.", "Approved the second order."]);
    expect(commentary().textContent).not.toContain("Collected order details.");
    expect(commentary().textContent).not.toContain("Finished all orders.");
    fireEvent.click(screen.getByRole("button", { name: "Previous stage" }));
    expect(chartVisit()).toBe("validate#1");
    expect(commentary().textContent).toContain("Collected order details.");
    expect(commentary().textContent).toContain("Validated the first order.");
    expect(commentary().textContent).not.toContain("Approved the second order.");
  });

  it("uses the requested empty message instead of inventing stage commentary", () => {
    setup({ narrativeEntries: [], commentary: { title: "Recorded outcome", emptyMessage: "This step has no saved explanation." } });
    expect(commentary().textContent).toContain("Recorded outcome");
    expect(commentary().textContent).toContain("This step has no saved explanation.");
    expect(commentary().textContent).not.toContain("executed");
  });

  it("quarantines an old companion after a new run reuses all visit IDs and accepts a fresh pair", () => {
    const ui = setup({ snapshots: undefined });
    choose(2);
    expect(commentary().textContent).toContain("Approved the second order.");
    const replacement = { ...ui.run.runtimeSnapshot, runId: "story-two" };
    ui.rerender(<ExplainableShell {...ui.props} runtimeSnapshot={replacement as never} />);
    expect(commentary().textContent).not.toContain("Approved the second order.");
    expect(commentary().textContent).toContain("Commentary is unavailable for this recording.");
    const fresh = ui.run.narrativeEntries.map(entry => ({ ...entry, text: `New recording: ${entry.text}` }));
    ui.rerender(<ExplainableShell {...ui.props} runtimeSnapshot={replacement as never} narrativeEntries={fresh} />);
    expect(chartVisit()).toBe("validate#2");
    expect(commentary().textContent).toContain("New recording: Approved the second order.");
    expect(within(commentary()).queryByText("Approved the second order.", { exact: true })).toBeNull();
  });
});

describe("Lens Details audience choices", () => {
  it("switches only Details between Developer and Commentary on the same chart and cursor", () => {
    const onMount = vi.fn(), onUnmount = vi.fn();
    const ui = setup({ view: undefined, renderFlowchart: chart => <ChartMountProbe
      visit={chart.snapshots[chart.selectedIndex]?.runtimeStageId} onMount={onMount} onUnmount={onUnmount} /> });
    const originalChart = screen.getByLabelText("Chart visit");
    const originalRail = screen.getByRole("toolbar");
    expect(screen.getByRole("tab", { name: "Developer" }).getAttribute("aria-selected")).toBe("true");
    next();
    fireEvent.click(screen.getByRole("tab", { name: "Commentary" }));
    expect(screen.getByLabelText("Chart visit")).toBe(originalChart);
    expect(screen.getByRole("toolbar")).toBe(originalRail);
    expect(chartVisit()).toBe("validate#1");
    expect(commentary().textContent).toContain("Validated the first order.");
    expect(screen.queryByRole("region", { name: "Stage activity" })).toBeNull();
    next();
    fireEvent.click(screen.getByRole("tab", { name: "Developer" }));
    expect(screen.getByLabelText("Chart visit")).toBe(originalChart);
    expect(chartVisit()).toBe("validate#2");
    expect(screen.getByRole("region", { name: "Stage activity" }).querySelector('[data-fp="stage-activity-visit"]')?.textContent).toBe("validate#2");
    expect(document.querySelector('[data-fp="commentary-panel"]')).toBeNull();
    expect(onMount).toHaveBeenCalledTimes(1);
    expect(onUnmount).not.toHaveBeenCalled();
    ui.unmount();
    expect(onUnmount).toHaveBeenCalledTimes(1);
  });

  it("keeps narrow Details choices on the same chart and selected visit", () => {
    withNarrowLayout(() => {
      setup({ view: undefined, defaultView: "story" });
      fireEvent.click(screen.getByRole("button", { name: /Details/ }));
      const originalChart = screen.getByLabelText("Chart visit");
      next();
      expect(commentary().textContent).toContain("Validated the first order.");
      fireEvent.click(screen.getByRole("tab", { name: "Developer" }));
      expect(screen.getByLabelText("Chart visit")).toBe(originalChart);
      expect(chartVisit()).toBe("validate#1");
      expect(screen.getByRole("region", { name: "Stage activity" }).querySelector('[data-fp="stage-activity-visit"]')?.textContent).toBe("validate#1");
      fireEvent.click(screen.getByRole("tab", { name: "Commentary" }));
      expect(screen.getByLabelText("Chart visit")).toBe(originalChart);
      expect(commentary().textContent).toContain("Validated the first order.");
    });
  });

  it("supports keyboard Details navigation with roving focus and an unstyled tab strip", () => {
    setup({ view: undefined, unstyled: true });
    next();
    const originalChart = screen.getByLabelText("Chart visit"), originalRail = screen.getByRole("toolbar");
    const tabs = screen.getByRole("tablist", { name: "Details view" });
    const developer = within(tabs).getByRole("tab", { name: "Developer" });
    const story = within(tabs).getByRole("tab", { name: "Commentary" });
    expect(developer.tabIndex).toBe(0);
    expect(story.tabIndex).toBe(-1);
    expect(tabs.hasAttribute("style")).toBe(false);
    expect(tabs.querySelector("[style]")).toBeNull();
    act(() => developer.focus());
    fireEvent.keyDown(developer, { key: "ArrowRight" });
    expect(document.activeElement).toBe(story);
    expect(within(tabs).getByRole("tab", { selected: true })).toBe(story);
    expect(story.tabIndex).toBe(0);
    expect(developer.tabIndex).toBe(-1);
    expect(screen.getByRole("tabpanel", { name: "Commentary" }).textContent).toContain("Validated the first order.");
    fireEvent.keyDown(story, { key: "Home" });
    expect(document.activeElement).toBe(developer);
    expect(within(tabs).getByRole("tab", { selected: true })).toBe(developer);
    fireEvent.keyDown(developer, { key: "End" });
    expect(document.activeElement).toBe(story);
    expect(within(tabs).getByRole("tab", { selected: true })).toBe(story);
    fireEvent.keyDown(story, { key: "ArrowLeft" });
    expect(document.activeElement).toBe(developer);
    expect(within(tabs).getByRole("tab", { selected: true })).toBe(developer);
    expect(developer.tabIndex).toBe(0);
    expect(story.tabIndex).toBe(-1);
    expect(screen.getByLabelText("Chart visit")).toBe(originalChart);
    expect(screen.getByRole("toolbar")).toBe(originalRail);
    expect(chartVisit()).toBe("validate#1");
    expect(screen.getByRole("region", { name: "Stage activity" }).querySelector('[data-fp="stage-activity-visit"]')?.textContent).toBe("validate#1");
  });

  it("reports controlled audience changes and waits for the host to adopt them", () => {
    const onViewChange = vi.fn();
    const ui = setup({ view: "developer", onViewChange });
    next();
    const originalChart = screen.getByLabelText("Chart visit");
    fireEvent.click(screen.getByRole("tab", { name: "Commentary" }));
    expect(onViewChange).toHaveBeenCalledExactlyOnceWith("story");
    expect(screen.getByRole("region", { name: "Stage activity" })).toBeTruthy();
    expect(document.querySelector('[data-fp="commentary-panel"]')).toBeNull();
    ui.rerender(<ExplainableShell {...ui.props} view="story" />);
    expect(screen.getByLabelText("Chart visit")).toBe(originalChart);
    expect(commentary().textContent).toContain("Validated the first order.");
    fireEvent.click(screen.getByRole("tab", { name: "Developer" }));
    expect(onViewChange).toHaveBeenLastCalledWith("developer");
    expect(commentary()).toBeTruthy();
    ui.rerender(<ExplainableShell {...ui.props} view="developer" />);
    expect(screen.getByLabelText("Chart visit")).toBe(originalChart);
    expect(chartVisit()).toBe("validate#1");
    expect(document.querySelector('[data-fp="commentary-panel"]')).toBeNull();
  });

  it("keeps a controlled audience fixed when the host supplies no change callback", () => {
    setup({ view: "story" });
    expect(commentary().textContent).toContain("Collected order details.");
    expect(screen.queryByRole("tab", { name: "Developer" })).toBeNull();
    expect(screen.queryByRole("tab", { name: "Commentary" })).toBeNull();
    expect(screen.queryByRole("tablist", { name: "Details view" })).toBeNull();
    expect(document.querySelector('[data-fp="lens-view-label"]')?.textContent).toBe("Commentary");
    next();
    expect(chartVisit()).toBe("validate#1");
    expect(commentary().textContent).toContain("Validated the first order.");
  });
});

describe("TraceViewer commentary options", () => {
  it.each(["default", "controlled"] as const)("forwards %s audience, commentary rendering and replay controls", mode => {
    const run = storyRun();
    const onViewChange = vi.fn();
    const onError = vi.fn();
    const props: React.ComponentProps<typeof TraceViewer> = {
      recording: { snapshot: run.runtimeSnapshot, narrativeEntries: run.narrativeEntries },
      ...(mode === "default" ? { defaultView: "story" as const } : { view: "story" as const }),
      onViewChange, onError,
      commentary: { title: "Saved explanation", renderEntry: entry => <span>Saved: {entry.text}</span> },
      replayControls: { previousNext: false, playPause: false, slider: true, intervalMs: 400 },
      renderFlowchart: chart => <output aria-label="Chart visit">{chart.snapshots[chart.selectedIndex]?.runtimeStageId}</output>,
    };
    const ui = render(<TraceViewer {...props} />);
    expect(commentary().textContent).toContain("Saved explanation");
    expect(commentary().textContent).toContain("Saved: Collected order details.");
    expect(screen.queryByRole("button", { name: "Next stage" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Play" })).toBeNull();
    fireEvent.change(screen.getByRole("slider"), { target: { value: "2" } });
    const originalChart = screen.getByLabelText("Chart visit");
    expect(chartVisit()).toBe("validate#2");
    expect(commentary().textContent).toContain("Saved: Approved the second order.");
    fireEvent.click(screen.getByRole("tab", { name: "Developer" }));
    expect(onViewChange).toHaveBeenCalledExactlyOnceWith("developer");
    if (mode === "controlled") {
      expect(commentary()).toBeTruthy();
      ui.rerender(<TraceViewer {...props} view="developer" />);
    }
    expect(document.querySelector('[data-fp="commentary-panel"]')).toBeNull();
    expect(screen.getByLabelText("Chart visit")).toBe(originalChart);
    expect(chartVisit()).toBe("validate#2");
    expect(onError).not.toHaveBeenCalled();
  });
});

function HostStoryControls() {
  const lens = useLensWorkbench();
  return <div>
    <output aria-label="Host selected visit">{lens.selectedSnapshot?.runtimeStageId}</output>
    <button onClick={() => lens.actions.selectIndex(2)}>Show second validation</button>
  </div>;
}

describe("Lens custom commentary layouts", () => {
  it.each(["surface", "component"] as const)("shares the Root cursor with a custom %s", mode => {
    setup({ commentary: { title: "Customer commentary" }, renderLayout: lens => <main aria-label="Customer playback">
      {lens.surfaces.timeTravel}<HostStoryControls />{lens.surfaces.chart}
      {mode === "surface" ? lens.surfaces.commentary : <CommentaryPanel title="Customer commentary" presentation="current" />}
    </main> });
    expect(commentary().textContent).toContain("Collected order details.");
    fireEvent.click(screen.getByRole("button", { name: "Show second validation" }));
    expect(screen.getByLabelText("Host selected visit").textContent).toBe("validate#2");
    expect(chartVisit()).toBe("validate#2");
    expect(commentary().textContent).toContain("Customer commentary");
    expect(commentary().textContent).toContain("Approved the second order.");
    expect(commentary().textContent).not.toContain("Validated the first order.");
  });
});

function childResult(firstIndex: number, count: number) {
  return { subflowId: "quote", subflowName: "Quote", treeContext: { globalContext: { count },
    stageContexts: { id: "quote/load", name: "quote/Load", runtimeStageId: `quote/load#${firstIndex}`, stageReads: {},
      next: { id: "quote/save", name: "quote/Save", runtimeStageId: `quote/save#${firstIndex + 1}`, stageReads: {} } },
    history: [
      { stage: "quote/Load", stageId: "quote/load", runtimeStageId: `quote/load#${firstIndex}`, overwrite: { count: count - 1 }, updates: {}, trace: [{ path: "count" }] },
      { stage: "quote/Save", stageId: "quote/save", runtimeStageId: `quote/save#${firstIndex + 1}`, overwrite: { count }, updates: {}, trace: [{ path: "count" }] },
    ],
  } };
}

describe("Lens Story child scope", () => {
  it("keeps commentary on the exact repeated child invocation and local cursor", () => {
    const first = childResult(1, 3), second = childResult(10, 30);
    const roots: StageSnapshot[] = [first, second].map((result, index) => ({ stageName: "quote", stageLabel: "Quote",
      runtimeStageId: index ? "quote#9" : "quote#0", subflowId: "quote", subflowResult: result,
      memory: {}, narrative: "", startMs: index, durationMs: 1 }));
    const narrativeEntries: NarrativeEntry[] = [
      { type: "stage", text: "First quote started.", depth: 0, stageName: "Quote", stageId: "quote", runtimeStageId: "quote#0" },
      { type: "stage", text: "First quote loaded.", depth: 1, stageName: "quote/Load", stageId: "quote/load", runtimeStageId: "quote/load#1", subflowId: "quote" },
      { type: "stage", text: "First quote saved.", depth: 1, stageName: "quote/Save", stageId: "quote/save", runtimeStageId: "quote/save#2", subflowId: "quote" },
      { type: "stage", text: "Second quote started.", depth: 0, stageName: "Quote", stageId: "quote", runtimeStageId: "quote#9" },
      { type: "stage", text: "Second quote loaded.", depth: 1, stageName: "quote/Load", stageId: "quote/load", runtimeStageId: "quote/load#10", subflowId: "quote" },
      { type: "stage", text: "Second quote saved.", depth: 1, stageName: "quote/Save", stageId: "quote/save", runtimeStageId: "quote/save#11", subflowId: "quote" },
    ];
    let onNodeClick: Parameters<NonNullable<Props["renderFlowchart"]>>[0]["onNodeClick"];
    setup({ title: "Repeated quote", snapshots: roots, narrativeEntries,
      runtimeSnapshot: { runId: "repeated-story", sharedState: {}, subflowResults: { "quote#0": first, "quote#9": second },
        commitLog: roots.map(stage => ({ stage: "Quote", stageId: "quote", runtimeStageId: stage.runtimeStageId, trace: [] })),
        executionTree: { id: "quote", name: "Quote", runtimeStageId: "quote#0", subflowId: "quote", stageReads: {},
          next: { id: "quote", name: "Quote", runtimeStageId: "quote#9", subflowId: "quote", stageReads: {} } } } as never,
      renderFlowchart: chart => { onNodeClick = chart.onNodeClick; return <output aria-label="Chart visit">{chart.snapshots[chart.selectedIndex]?.runtimeStageId}</output>; },
    });
    act(() => onNodeClick?.("quote"));
    next();
    expect(chartVisit()).toBe("quote/save#2");
    expect(commentary().textContent).toContain("First quote saved.");
    expect(commentary().textContent).not.toContain("Second quote saved.");
    fireEvent.click(screen.getByRole("button", { name: "Repeated quote" }));
    next();
    act(() => onNodeClick?.("quote"));
    next();
    expect(chartVisit()).toBe("quote/save#11");
    expect(commentary().textContent).toContain("Second quote saved.");
    expect(commentary().textContent).not.toContain("First quote saved.");
    expect(commentary().textContent).not.toContain("Second quote started.");
  });
});

describe("Lens replay control configuration", () => {
  it.each([false, true])("passes slider-only controls through Story (unstyled=%s)", unstyled => {
    setup({ unstyled, replayControls: { previousNext: false, playPause: false, slider: true } });
    expect(screen.queryByRole("button", { name: "Previous stage" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Next stage" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Play" })).toBeNull();
    fireEvent.change(screen.getByRole("slider"), { target: { value: "2" } });
    expect(chartVisit()).toBe("validate#2");
    expect(commentary().textContent).toContain("Approved the second order.");
  });

  it.each([false, true])("uses the requested interval and stops playback when Play is hidden (autoPlay=%s)", autoPlay => {
    vi.useFakeTimers();
    const ui = setup({ autoPlay, replayControls: { intervalMs: 400, slider: true } });
    if (!autoPlay) fireEvent.click(screen.getByRole("button", { name: "Play" }));
    act(() => { vi.advanceTimersByTime(399); });
    expect(chartVisit()).toBe("collect#0");
    act(() => { vi.advanceTimersByTime(1); });
    expect(chartVisit()).toBe("validate#1");
    expect(commentary().textContent).toContain("Validated the first order.");
    ui.rerender(<ExplainableShell {...ui.props} replayControls={{ intervalMs: 400, slider: true, playPause: false }} />);
    expect(screen.queryByRole("button", { name: "Pause" })).toBeNull();
    act(() => { vi.advanceTimersByTime(1_000); });
    expect(chartVisit()).toBe("validate#1");
    fireEvent.keyDown(screen.getByRole("toolbar"), { key: " " });
    act(() => { vi.advanceTimersByTime(1_000); });
    expect(chartVisit()).toBe("validate#1");
  });

  it("does not start automatically or scroll commentary smoothly under reduced motion", () => {
    vi.useFakeTimers();
    reducedMotion(true);
    const scroll = vi.spyOn(Element.prototype, "scrollIntoView");
    setup({ autoPlay: true, commentary: { followCursor: true }, replayControls: { intervalMs: 400 } });
    act(() => { vi.advanceTimersByTime(1_000); });
    expect(chartVisit()).toBe("collect#0");
    expect(screen.queryByRole("button", { name: "Pause" })).toBeNull();
    next();
    expect(chartVisit()).toBe("validate#1");
    expect(scroll.mock.calls.some(([options]) => typeof options === "object" && options?.behavior === "smooth")).toBe(false);
  });
});
