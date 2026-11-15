/** @vitest-environment jsdom */
import * as React from "react";
import { readFileSync } from "node:fs";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ExplainableShell } from "../../src/components/ExplainableShell/ExplainableShell";
import type { NarrativeEntry, StageSnapshot } from "../../src/types";
import type { StageActivityPanelProps } from "../../src/components/StageActivityPanel/StageActivityPanel";
import type { TimeTravelControlsProps } from "../../src/components/TimeTravelControls/TimeTravelControls";
import { toVisualizationSnapshots } from "../../src/adapters/fromRuntimeSnapshot";

// Keep the real panel in the integration path. Retaining its public callback
// models an old rendered action that a host still holds after replacing a run.
const panelCapture = vi.hoisted(() => ({ props: null as StageActivityPanelProps | null }));
const railCapture = vi.hoisted(() => ({ props: null as TimeTravelControlsProps | null }));
vi.mock("../../src/components/StageActivityPanel/StageActivityPanel", async importOriginal => {
  const actual = await importOriginal<typeof import("../../src/components/StageActivityPanel/StageActivityPanel")>();
  return {
    ...actual,
    StageActivityPanel(props: StageActivityPanelProps) {
      panelCapture.props = props;
      return React.createElement(actual.StageActivityPanel, props);
    },
  };
});
vi.mock("../../src/components/TimeTravelControls/TimeTravelControls", async importOriginal => {
  const actual = await importOriginal<typeof import("../../src/components/TimeTravelControls/TimeTravelControls")>();
  return {
    ...actual,
    TimeTravelRail(props: React.ComponentProps<typeof actual.TimeTravelRail>) {
      railCapture.props = props;
      return React.createElement(actual.TimeTravelRail, props);
    },
  };
});

type Props = React.ComponentProps<typeof ExplainableShell>;

function counterRun(runId = "counter-one", seed = 2, written = 3, later = 99) {
  const stages = [
    { name: "Seed", id: "seed", runtimeStageId: "seed#0", count: seed, reads: {} },
    { name: "Increment", id: "increment", runtimeStageId: "increment#1", count: written, reads: { count: seed } },
    { name: "Later", id: "later", runtimeStageId: "later#2", count: later, reads: {} },
  ];
  const nodes = stages.map(stage => ({
    id: stage.id, name: stage.name, runtimeStageId: stage.runtimeStageId,
    stageReads: stage.reads, stageWrites: { count: stage.count },
    next: undefined as unknown,
  }));
  nodes[0].next = nodes[1];
  nodes[1].next = nodes[2];
  const snapshots: StageSnapshot[] = stages.map((stage, index) => ({
    stageName: stage.name, stageLabel: stage.name, runtimeStageId: stage.runtimeStageId,
    memory: { count: stage.count }, narrative: "", startMs: index, durationMs: 1, status: "done",
  }));
  const narrativeEntries: NarrativeEntry[] = [
    { type: "step", text: `Step 1: Write count = ${seed}`, depth: 1, stageName: "Seed", stageId: "seed", runtimeStageId: "seed#0", stepNumber: 1, key: "count", rawValue: seed },
    { type: "step", text: `Step 2: Read count = ${seed}`, depth: 1, stageName: "Increment", stageId: "increment", runtimeStageId: "increment#1", stepNumber: 2, key: "count", rawValue: seed },
    { type: "step", text: `Step 3: Write count = ${written}`, depth: 1, stageName: "Increment", stageId: "increment", runtimeStageId: "increment#1", stepNumber: 3, key: "count", rawValue: written },
    { type: "step", text: `Step 4: Write count = ${later}`, depth: 1, stageName: "Later", stageId: "later", runtimeStageId: "later#2", stepNumber: 4, key: "count", rawValue: later },
  ];
  const runtimeSnapshot = {
    runId, sharedState: { count: later }, executionTree: nodes[0], subflowResults: {},
    commitLog: stages.map(stage => ({
      stage: stage.name, stageId: stage.id, runtimeStageId: stage.runtimeStageId,
      overwrite: { count: stage.count }, updates: {}, trace: [{ path: "count", verb: "set" }],
    })),
  };
  return { snapshots, narrativeEntries, runtimeSnapshot };
}

function stageActivity() { return screen.getByRole("region", { name: "Stage activity" }); }
function variableInspector() { return within(stageActivity()).getByRole("complementary", { name: "Variable inspector" }); }
function traceCard() { return document.querySelector('[data-fp="trace-walk-card"]') as HTMLElement; }
function returnToActivity(stageLabel: string) {
  fireEvent.click(within(screen.getByRole("toolbar")).getByRole("button", { name: `Return to ${stageLabel} activity` }));
}
function expectReadAtVisit(runtimeStageId: string, value: string) {
  expect(stageActivity().querySelector('[data-fp="stage-activity-visit"]')?.textContent).toBe(runtimeStageId);
  expect(within(variableInspector()).getByText("Read key")).toBeTruthy();
  expect(variableInspector().querySelector('[data-fp="stage-activity-value"]')?.textContent).toBe(value);
  expect(within(variableInspector()).getByRole("button", { name: "Backtrack read count" })).toBeTruthy();
  expect(document.querySelector('[data-fp="trace-walk-card"]')).toBeNull();
  expect(document.querySelector('[data-fp="trace-activity-origin"]')).toBeNull();
  expect(document.querySelector('[data-fp="trace-execution-legend"]')).toBeNull();
  expect(screen.getByRole("toolbar").getAttribute("data-tracing")).toBeNull();
  expect(stageActivity().contains(document.activeElement)).toBe(true);
  expect(document.activeElement?.getAttribute("data-variable-kind")).toBe("read");
  expect(document.activeElement?.getAttribute("data-variable-key")).toBe("count");
  expect(document.activeElement?.getAttribute("aria-pressed")).toBe("true");
}
function next(times = 1) {
  for (let index = 0; index < times; index++) fireEvent.click(screen.getByRole("button", { name: "Next stage" }));
}
function activeTick() {
  return [...screen.getByRole("toolbar").querySelectorAll('[data-fp="tt-tick"]')]
    .findIndex(tick => tick.getAttribute("data-active") === "true");
}
function openActivity() {
  fireEvent.click(screen.getByRole("button", { name: "Inspector" }));
  return stageActivity();
}
function renderCounter(extra: Partial<Props> = {}) {
  const run = counterRun();
  const props: Props = {
    ...run, runtimeSnapshot: run.runtimeSnapshot as never,
    title: "Counter run", renderFlowchart: () => React.createElement("div"), ...extra,
  };
  return { ...render(React.createElement(ExplainableShell, props)), run, props };
}

beforeEach(() => { panelCapture.props = null; railCapture.props = null; });

describe("ExplainableShell stage Activity", () => {
  it("opens Activity in the Inspector while keeping State and Data Trace available", () => {
    renderCounter();
    const activity = openActivity();
    expect(within(activity).getByRole("heading", { name: "Seed" })).toBeTruthy();
    expect(activity.querySelector('[data-fp="stage-activity-visit"]')?.textContent).toBe("seed#0");
    expect(screen.getByRole("button", { name: "Activity" }).getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(screen.getByRole("button", { name: "State" }));
    expect(document.querySelector('[data-fp="memory-panel"]')).toBeTruthy();
    expect(screen.queryByRole("region", { name: "Stage activity" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /^Data Trace/ }));
    expect(document.querySelector('[data-fp="trace-search"]')).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Activity" }));
    expect(stageActivity()).toBeTruthy();
  });

  it("backtracks a read before the selected stage and its write after that stage, excluding later values", () => {
    renderCounter();
    next();
    openActivity();
    fireEvent.click(within(stageActivity()).getByRole("button", { name: "Inspect read count" }));
    expect(variableInspector().textContent).toContain("seed#0");
    expect(variableInspector().querySelector('[data-fp="stage-activity-value"]')?.textContent).toBe("2");
    fireEvent.click(within(variableInspector()).getByRole("button", { name: "Backtrack read count" }));

    expect(traceCard().textContent).toContain("Why count?");
    expect(traceCard().textContent).toContain("wrote count = 2");
    expect(activeTick()).toBe(0);
    expect(traceCard().textContent).not.toContain("99");
    expect(screen.queryByRole("region", { name: "Stage activity" })).toBeNull();
    expect(document.querySelector('[data-fp="trace-activity-origin"]')?.textContent).toBe("From Increment · read count");
    expect(document.querySelector('[data-fp="trace-view-position"]')?.textContent).toBe("Viewing recorded step 1 of 3");
    expect(document.querySelector('[data-fp="trace-execution-legend"]')?.textContent).toContain("Other steps: context");
    expect(document.activeElement?.getAttribute("aria-label")).toBe("Return to Increment activity");

    returnToActivity("Increment");
    expectReadAtVisit("increment#1", "2");
    expect(activeTick()).toBe(1);
    expect(screen.getByRole("button", { name: "Activity" }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(within(stageActivity()).getByRole("button", { name: "Inspect write count" }));
    expect(variableInspector().querySelector('[data-fp="stage-activity-value"]')?.textContent).toBe("3");
    fireEvent.click(within(variableInspector()).getByRole("button", { name: "Backtrack write count" }));
    expect(traceCard().textContent).toContain("wrote count = 3");
    expect(activeTick()).toBe(1);
    expect(traceCard().textContent).not.toContain("99");
    expect(within(screen.getByRole("toolbar")).getByText(/stop 1 of 2/)).toBeTruthy();
  });

  it.each(["Escape", "Activity tab"])("returns to the original read and visit through %s", returnAction => {
    renderCounter();
    next();
    openActivity();
    fireEvent.click(within(stageActivity()).getByRole("button", { name: "Inspect read count" }));
    fireEvent.click(within(variableInspector()).getByRole("button", { name: "Backtrack read count" }));
    expect(activeTick()).toBe(0);
    if (returnAction === "Escape") fireEvent.keyDown(screen.getByRole("toolbar"), { key: "Escape" });
    else fireEvent.click(screen.getByRole("button", { name: "Activity" }));
    expectReadAtVisit("increment#1", "2");
    expect(activeTick()).toBe(1);
  });

  it("returns a first-visit read with no prior writer through Escape on the focused card action", () => {
    const run = counterRun();
    run.runtimeSnapshot.executionTree.stageReads = { count: 2 };
    renderCounter({ ...run, runtimeSnapshot: run.runtimeSnapshot as never });
    openActivity();
    fireEvent.click(within(stageActivity()).getByRole("button", { name: "Inspect read count" }));
    const unavailableValue = variableInspector().querySelector('[data-fp="stage-activity-value"]')?.textContent;
    expect(unavailableValue).toBe("Value preview unavailable");
    fireEvent.click(within(variableInspector()).getByRole("button", { name: "Backtrack read count" }));

    expect(traceCard().getAttribute("data-missing")).toBeTruthy();
    expect(screen.getByRole("toolbar").getAttribute("data-tracing")).toBeNull();
    expect(railCapture.props!.tracing).toBeNull();
    const investigation = screen.getByRole("region", { name: "Variable investigation" });
    expect(investigation.querySelector('[data-fp="trace-activity-origin"]')?.textContent).toBe("From Seed · read count");
    expect(investigation.querySelector('[data-fp="trace-view-position"]')?.textContent).toBe("Viewing recorded step 1 of 3");
    expect(within(investigation).queryByRole("group", { name: "Investigation view" })).toBeNull();
    const returnAction = within(traceCard()).getByRole("button", { name: "Return to Seed activity" });
    expect(document.activeElement).toBe(returnAction);
    expect(screen.queryByRole("region", { name: "Stage activity" })).toBeNull();
    fireEvent.keyDown(document.activeElement!, { key: "Escape" });

    expectReadAtVisit("seed#0", unavailableValue!);
    expect(activeTick()).toBe(0);
    expect(screen.getByRole("button", { name: "Activity" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("returns to the written variable after following an earlier source", () => {
    renderCounter();
    next();
    openActivity();
    fireEvent.click(within(stageActivity()).getByRole("button", { name: "Inspect write count" }));
    fireEvent.click(within(variableInspector()).getByRole("button", { name: "Backtrack write count" }));
    fireEvent.click(within(traceCard()).getByTitle("Follow count — re-anchor the walk on its writer"));
    expect(activeTick()).toBe(0);
    expect(traceCard().textContent).toContain("wrote count = 2");
    expect(screen.getByRole("navigation", { name: "Investigation trail" })).toBeTruthy();
    returnToActivity("Increment");
    expect(stageActivity().querySelector('[data-fp="stage-activity-visit"]')?.textContent).toBe("increment#1");
    expect(activeTick()).toBe(1);
    expect(within(variableInspector()).getByText("Written key")).toBeTruthy();
    expect(variableInspector().querySelector('[data-fp="stage-activity-value"]')?.textContent).toBe("3");
    expect(screen.queryByRole("navigation", { name: "Investigation trail" })).toBeNull();
  });

  it("does not let a retained return action replace a new run's active investigation", () => {
    const ui = renderCounter();
    next();
    openActivity();
    fireEvent.click(within(stageActivity()).getByRole("button", { name: "Inspect read count" }));
    fireEvent.click(within(variableInspector()).getByRole("button", { name: "Backtrack read count" }));
    const oldReturn = railCapture.props!.tracing!.onExit;
    const replacement = counterRun("counter-two", 20, 30, 990);
    ui.rerender(React.createElement(ExplainableShell, {
      ...ui.props, ...replacement, runtimeSnapshot: replacement.runtimeSnapshot as never,
    }));
    // A new run starts at the traced writer; choose its Increment explicitly.
    expect(activeTick()).toBe(0);
    next();
    fireEvent.click(screen.getByRole("button", { name: "Activity" }));
    fireEvent.click(within(stageActivity()).getByRole("button", { name: "Inspect write count" }));
    fireEvent.click(within(variableInspector()).getByRole("button", { name: "Backtrack write count" }));
    expect(traceCard().textContent).toContain("wrote count = 30");
    act(() => oldReturn());
    expect(traceCard().textContent).toContain("wrote count = 30");
    expect(screen.queryByRole("region", { name: "Stage activity" })).toBeNull();
    expect(activeTick()).toBe(1);
    returnToActivity("Increment");
    expect(stageActivity().querySelector('[data-fp="stage-activity-visit"]')?.textContent).toBe("increment#1");
    expect(within(variableInspector()).getByText("Written key")).toBeTruthy();
    expect(variableInspector().querySelector('[data-fp="stage-activity-value"]')?.textContent).toBe("30");
  });

  it("resets the inspected read when moving to another visit of the same variable", () => {
    renderCounter();
    next();
    openActivity();
    fireEvent.click(within(stageActivity()).getByRole("button", { name: "Inspect read count" }));
    expect(within(variableInspector()).getByText("Read key")).toBeTruthy();
    next();
    expect(within(stageActivity()).getByRole("heading", { name: "Later" })).toBeTruthy();
    expect(within(variableInspector()).getByText("Written key")).toBeTruthy();
    expect(variableInspector().querySelector('[data-fp="stage-activity-value"]')?.textContent).toBe("99");
    expect(screen.queryByRole("button", { name: "Backtrack read count" })).toBeNull();
  });

  it("refuses a retained Activity callback after a new run reuses the same runtime IDs", () => {
    const ui = renderCounter();
    next();
    openActivity();
    const oldProps = panelCapture.props!;
    const oldTarget = oldProps.activity.reads.find(variable => variable.key === "count")!.traceTarget!;
    const oldTrace = oldProps.onTraceVariable!;
    expect(oldTarget).toBeTruthy();

    const replacement = counterRun("counter-two", 20, 30, 990);
    ui.rerender(React.createElement(ExplainableShell, {
      ...ui.props, ...replacement, runtimeSnapshot: replacement.runtimeSnapshot as never,
    }));
    act(() => oldTrace(oldTarget));
    expect(document.querySelector('[data-fp="trace-walk-card"]')).toBeNull();
    expect(screen.getByRole("toolbar").getAttribute("data-tracing")).toBeNull();
    expect(within(stageActivity()).queryByText("Step 2: Read count = 2", { exact: true })).toBeNull();
    expect(within(stageActivity()).getByText("Step 2: Read count = 20", { exact: true })).toBeTruthy();

    // The stale action is rejected without disabling the fresh run's read.
    fireEvent.click(within(stageActivity()).getByRole("button", { name: "Inspect read count" }));
    fireEvent.click(within(variableInspector()).getByRole("button", { name: "Backtrack read count" }));
    expect(traceCard().textContent).toContain("wrote count = 20");
  });

  it("shows unknown history instead of exposing an unscoped trace action", () => {
    const run = counterRun();
    const { commitLog: _history, ...withoutHistory } = run.runtimeSnapshot;
    renderCounter({ runtimeSnapshot: withoutHistory as never });
    const activity = openActivity();
    expect(within(activity).getByRole("status").textContent).toMatch(/Activity is unavailable for this exact visit/);
    expect(within(activity).queryByRole("button", { name: /^Backtrack/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "State" }));
    expect(document.querySelector('[data-fp="memory-panel"]')).toBeTruthy();
  });

  it("keeps narrative absence and run-level logs explicit while showing recorded read keys", () => {
    renderCounter({ narrativeEntries: undefined, logs: ["UNSCOPED CONSOLE SENTINEL"] });
    next();
    const activity = openActivity();
    expect(activity.textContent).toMatch(/No ordered narrative steps recorded|Recorded narrative is unavailable/);
    expect(within(activity).getByRole("button", { name: "Inspect read count" })).toBeTruthy();
    expect(activity.textContent).toContain("No stage-scoped logs captured");
    expect(activity.textContent).not.toContain("UNSCOPED CONSOLE SENTINEL");
  });

  it("offers the same read action on the unstyled Explainable surface", () => {
    renderCounter({ unstyled: true });
    fireEvent.click(screen.getByRole("button", { name: "Explainable" }));
    next();
    fireEvent.click(within(stageActivity()).getByRole("button", { name: "Inspect read count" }));
    fireEvent.click(within(variableInspector()).getByRole("button", { name: "Backtrack read count" }));
    expect(traceCard().textContent).toContain("wrote count = 2");
    expect(traceCard().hasAttribute("style")).toBe(false);
    expect(traceCard().querySelector("[style]")).toBeNull();
    expect(document.querySelector('[data-fp="memory-panel"]')).toBeTruthy();
    returnToActivity("Increment");
    expectReadAtVisit("increment#1", "2");
    expect(activeTick()).toBe(1);
    expect(document.querySelector('[data-fp="memory-panel"]')).toBeTruthy();
  });

  it("opens Activity from narrow Details and preserves its read cutoff when tracing", () => {
    withNarrowLayout(() => {
      renderCounter();
      next();
      fireEvent.click(screen.getByRole("button", { name: /Details/ }));
      expect(stageActivity()).toBeTruthy();
      fireEvent.click(within(stageActivity()).getByRole("button", { name: "Inspect read count" }));
      fireEvent.click(within(variableInspector()).getByRole("button", { name: "Backtrack read count" }));
      expect(traceCard().textContent).toContain("wrote count = 2");
      expect(activeTick()).toBe(0);
      returnToActivity("Increment");
      expectReadAtVisit("increment#1", "2");
      expect(activeTick()).toBe(1);
      expect(screen.getByRole("button", { name: "Activity" }).getAttribute("aria-pressed")).toBe("true");
    });
  });

  it("respects an explicit legacy default tab on narrow Details", () => {
    withNarrowLayout(() => {
      renderCounter({ defaultTab: "memory" });
      fireEvent.click(screen.getByRole("button", { name: /Details/ }));
      expect(document.querySelector('[data-fp="memory-panel"]')).toBeTruthy();
      expect(screen.queryByRole("region", { name: "Stage activity" })).toBeNull();
      fireEvent.click(screen.getByRole("button", { name: "Inspector" }));
      expect(stageActivity()).toBeTruthy();
    });
  });

  it("shows the stage cone only while narrow Details displays Inspector Data Trace", () => {
    withNarrowLayout(() => {
      type ChartProps = Parameters<NonNullable<Props["renderFlowchart"]>>[0];
      let chart: ChartProps | undefined;
      const ui = renderCounter({ renderFlowchart: props => { chart = props; return React.createElement("div"); } });
      next();
      fireEvent.click(screen.getByRole("button", { name: /Details/ }));
      expect(chart?.sliceCone).toBeUndefined();
      fireEvent.click(screen.getByRole("button", { name: /^Data Trace/ }));
      expect([...chart!.sliceCone!.keys()]).toEqual(expect.arrayContaining(["seed", "increment"]));

      fireEvent.click(screen.getByRole("button", { name: "Memory" }));
      expect(chart?.sliceCone).toBeUndefined();
      fireEvent.click(screen.getByRole("button", { name: "Inspector" }));
      expect([...chart!.sliceCone!.keys()]).toEqual(expect.arrayContaining(["seed", "increment"]));
      fireEvent.click(screen.getByRole("button", { name: "Activity" }));
      expect(chart?.sliceCone).toBeUndefined();

      // A selected legacy Data Trace tab must not dim an unstyled surface.
      fireEvent.click(screen.getByRole("button", { name: /^Data Trace/ }));
      ui.rerender(React.createElement(ExplainableShell, { ...ui.props, unstyled: true }));
      fireEvent.click(screen.getByRole("button", { name: "Explainable" }));
      expect(chart?.sliceCone).toBeUndefined();
    });
  });
});

function withNarrowLayout(run: () => void) {
  const original = globalThis.ResizeObserver;
  class NarrowObserver {
    constructor(private readonly callback: ResizeObserverCallback) {}
    observe(target: Element) {
      if (target.getAttribute("data-fp") === "explainable-shell") {
        this.callback([{ target, contentRect: { width: 480 } } as ResizeObserverEntry], this as unknown as ResizeObserver);
      }
    }
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = NarrowObserver as unknown as typeof ResizeObserver;
  try { run(); } finally { globalThis.ResizeObserver = original; }
}

function childCounter(seed: number, written: number, startIndex: number) {
  const seedId = `quote/seed#${startIndex}`, incrementId = `quote/increment#${startIndex + 1}`;
  const increment = {
    id: "quote/increment", name: "quote/Increment", runtimeStageId: incrementId,
    stageReads: { count: seed }, stageWrites: { count: written }, logs: {}, errors: {},
  };
  return {
    subflowId: "quote", subflowName: "Quote",
    treeContext: {
      globalContext: { count: written },
      stageContexts: { id: "quote/seed", name: "quote/Seed", runtimeStageId: seedId,
        stageReads: {}, stageWrites: { count: seed }, logs: {}, errors: {}, next: increment },
      history: [
        { stage: "quote/Seed", stageId: "quote/seed", runtimeStageId: seedId, overwrite: { count: seed }, updates: {}, trace: [{ path: "count", verb: "set" }] },
        { stage: "quote/Increment", stageId: "quote/increment", runtimeStageId: incrementId, overwrite: { count: written }, updates: {}, trace: [{ path: "count", verb: "set" }] },
      ],
    },
  };
}

describe("Stage Activity exact child invocation", () => {
  it("backtracks a captured mount write when its explicit empty exit shares the same visit ID", () => {
    // Real engine output: a mount's output commit and empty exit bookend share
    // its runtime stamp. They are one visit, not ambiguous sibling executions.
    const recorded = JSON.parse(readFileSync("test/fixtures/subflow-handoff/recording.json", "utf8"));
    const snapshot = structuredClone(recorded.runtimeSnapshot);
    const snapshots = toVisualizationSnapshots(snapshot);
    const targetIndex = snapshots.findIndex(stage => stage.runtimeStageId === "child#9");
    expect(targetIndex).toBeGreaterThanOrEqual(0);
    expect(snapshot.commitLog.filter((commit: { runtimeStageId: string }) => commit.runtimeStageId === "child#9")).toHaveLength(2);
    render(React.createElement(ExplainableShell, {
      runtimeSnapshot: snapshot, title: "Recorded child", renderFlowchart: () => React.createElement("div"),
    }));
    openActivity();
    next(targetIndex);
    expect(stageActivity().querySelector('[data-fp="stage-activity-visit"]')?.textContent).toBe("child#9");
    fireEvent.click(within(stageActivity()).getByRole("button", { name: "Inspect write renamed" }));
    const backtrack = within(variableInspector()).getByRole("button", { name: "Backtrack write renamed" });
    expect(backtrack.hasAttribute("disabled")).toBe(false);
    fireEvent.click(backtrack);
    expect(traceCard().textContent).toContain("wrote renamed = 4");
    expect(traceCard().textContent).toContain("subflow boundary");
    expect(activeTick()).toBe(targetIndex);
    fireEvent.click(within(traceCard()).getByRole("button", { name: "Follow child source middleOutput in child#9" }));
    fireEvent.click(within(traceCard()).getByRole("button", { name: "Follow child source localOutput in child/inner#11" }));
    expect(screen.getByRole("toolbar").getAttribute("aria-label")).toBe("Tracing localOutput");
    expect(traceCard().textContent).toContain("child#9 → child/inner#11");
    expect(screen.getByRole("toolbar").querySelectorAll('[data-fp="tt-tick"]')).toHaveLength(1);
    returnToActivity("Child");
    expect(stageActivity().querySelector('[data-fp="stage-activity-visit"]')?.textContent).toBe("child#9");
    expect(within(variableInspector()).getByText("Written key")).toBeTruthy();
    expect(within(variableInspector()).getByRole("button", { name: "Backtrack write renamed" })).toBeTruthy();
    expect(variableInspector().querySelector('[data-fp="stage-activity-value"]')?.textContent).toBe("4");
    expect(activeTick()).toBe(targetIndex);
    expect(screen.getByRole("toolbar").querySelectorAll('[data-fp="tt-tick"]')).toHaveLength(snapshots.length);
    expect(screen.queryByRole("navigation", { name: "Investigation trail" })).toBeNull();
  });

  it("keeps a narrow child visit and cursor when switching Inspector, Memory and Narrative", () => {
    withNarrowLayout(() => {
      const result = childCounter(2, 3, 1);
      const mount: StageSnapshot = { stageName: "quote", stageLabel: "Quote", runtimeStageId: "quote#0",
        subflowId: "quote", subflowResult: result, memory: {}, narrative: "", startMs: 0, durationMs: 1 };
      type ChartProps = Parameters<NonNullable<Props["renderFlowchart"]>>[0];
      let chart: ChartProps | undefined;
      render(React.createElement(ExplainableShell, {
        title: "Child counter", snapshots: [mount],
        narrativeEntries: [{ type: "stage", text: "Increment the child counter.", depth: 1, stageName: "quote/Increment",
          stageId: "quote/increment", runtimeStageId: "quote/increment#2", subflowId: "quote" }],
        runtimeSnapshot: { runId: "narrow-child", sharedState: {}, subflowResults: { "quote#0": result },
          commitLog: [{ stage: "Quote", stageId: "quote", runtimeStageId: "quote#0", trace: [] }],
          executionTree: { id: "quote", name: "Quote", runtimeStageId: "quote#0", subflowId: "quote", stageReads: {} } } as never,
        traceGraph: { nodes: [], edges: [] } as never,
        renderFlowchart: props => { chart = props; return React.createElement("div"); },
      }));
      fireEvent.click(screen.getByRole("button", { name: /Details/ }));
      act(() => chart?.onNodeClick?.("quote"));
      next();
      const selectedVisit = () => chart?.snapshots[chart.selectedIndex].runtimeStageId;
      expect(selectedVisit()).toBe("quote/increment#2");
      expect(activeTick()).toBe(1);
      expect(stageActivity().querySelector('[data-fp="stage-activity-visit"]')?.textContent).toBe("quote/increment#2");

      fireEvent.click(screen.getByRole("button", { name: "Memory" }));
      expect(document.querySelector('[data-fp="memory-panel"]')).toBeTruthy();
      expect(selectedVisit()).toBe("quote/increment#2");
      expect(activeTick()).toBe(1);
      fireEvent.click(screen.getByRole("button", { name: "Narrative" }));
      expect(screen.getByText("Increment the child counter.")).toBeTruthy();
      expect(selectedVisit()).toBe("quote/increment#2");
      expect(activeTick()).toBe(1);
      fireEvent.click(screen.getByRole("button", { name: "Inspector" }));
      expect(stageActivity().querySelector('[data-fp="stage-activity-visit"]')?.textContent).toBe("quote/increment#2");
      expect(variableInspector().querySelector('[data-fp="stage-activity-value"]')?.textContent).toBe("3");
      expect(activeTick()).toBe(1);
    });
  });

  it("does not mix values between repeated mounts with the same stage and variable names", () => {
    const first = childCounter(2, 3, 1), second = childCounter(20, 30, 10);
    const snapshots: StageSnapshot[] = [first, second].map((result, index) => ({
      stageName: "quote", stageLabel: "Quote", runtimeStageId: index === 0 ? "quote#0" : "quote#9",
      subflowId: "quote", subflowResult: result, memory: {}, narrative: "", startMs: index, durationMs: 1,
    }));
    const controls: { onNodeClick?: (id: number | string) => void } = {};
    render(React.createElement(ExplainableShell, {
      title: "Repeated quote", snapshots,
      runtimeSnapshot: { runId: "repeated", sharedState: {}, subflowResults: { "quote#0": first, "quote#9": second },
        commitLog: snapshots.map(snapshot => ({ stage: "Quote", stageId: "quote", runtimeStageId: snapshot.runtimeStageId, trace: [{ path: "parentTotal" }] })),
        executionTree: { id: "quote", name: "Quote", runtimeStageId: "quote#0", subflowId: "quote", stageReads: {},
          next: { id: "quote", name: "Quote", runtimeStageId: "quote#9", subflowId: "quote", stageReads: {} } } } as never,
      traceGraph: { nodes: [], edges: [] } as never,
      renderFlowchart: props => { controls.onNodeClick = props.onNodeClick; return React.createElement("div"); },
    }));
    openActivity();
    act(() => controls.onNodeClick?.("quote"));
    next();
    fireEvent.click(within(stageActivity()).getByRole("button", { name: "Inspect read count" }));
    expect(variableInspector().querySelector('[data-fp="stage-activity-value"]')?.textContent).toBe("2");
    expect(stageActivity().textContent).toContain("quote#0");

    fireEvent.click(screen.getByRole("button", { name: "Repeated quote" }));
    next();
    act(() => controls.onNodeClick?.("quote"));
    next();
    fireEvent.click(within(stageActivity()).getByRole("button", { name: "Inspect read count" }));
    expect(variableInspector().querySelector('[data-fp="stage-activity-value"]')?.textContent).toBe("20");
    expect(stageActivity().textContent).toContain("quote#9");
    expect(variableInspector().textContent).toContain("quote/seed#10");
    fireEvent.click(within(variableInspector()).getByRole("button", { name: "Backtrack read count" }));
    expect(traceCard().textContent).toContain("wrote count = 20");
    returnToActivity("increment");
    expectReadAtVisit("quote/increment#11", "20");
    expect(stageActivity().textContent).toContain("quote#9");
    expect(stageActivity().textContent).not.toContain("quote#0");
    expect(variableInspector().textContent).toContain("quote/seed#10");
    expect(activeTick()).toBe(1);
  });
});
