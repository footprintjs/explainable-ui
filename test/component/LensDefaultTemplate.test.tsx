/** @vitest-environment jsdom */
import * as React from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ExplainableShell } from "../../src/components/ExplainableShell/ExplainableShell";
import { useLensWorkbench, type LensWorkbenchContextValue } from "../../src/components/ExplainableShell/LensWorkbench";
import type { NarrativeEntry, StageSnapshot } from "../../src/types";

type Props = React.ComponentProps<typeof ExplainableShell>;

const snapshots: StageSnapshot[] = [
  { stageName: "seed", stageLabel: "Seed", runtimeStageId: "seed#0", memory: { count: 2 }, narrative: "", startMs: 0, durationMs: 1 },
  { stageName: "increment", stageLabel: "Increment", runtimeStageId: "increment#1", memory: { count: 3 }, narrative: "", startMs: 1, durationMs: 2 },
];
const narrativeEntries: NarrativeEntry[] = [
  { type: "stage", text: "Seeded the counter.", depth: 0, stageId: "seed", stageName: "Seed", runtimeStageId: "seed#0" },
  { type: "stage", text: "Incremented the counter.", depth: 0, stageId: "increment", stageName: "Increment", runtimeStageId: "increment#1" },
];
const runtimeSnapshot = {
  runId: "default-template", sharedState: { count: 3 }, subflowResults: {},
  commitLog: snapshots.map((stage, index) => ({ stage: stage.stageLabel, stageId: stage.stageName,
    runtimeStageId: stage.runtimeStageId, overwrite: { count: index + 2 }, updates: {}, trace: [{ path: "count", verb: "set" }] })),
  executionTree: { id: "seed", name: "Seed", runtimeStageId: "seed#0", stageReads: {}, stageWrites: { count: 2 },
    next: { id: "increment", name: "Increment", runtimeStageId: "increment#1", stageReads: { count: 2 }, stageWrites: { count: 3 } } },
};

function setup(extra: Partial<Props> = {}) {
  const props: Props = { snapshots, narrativeEntries, runtimeSnapshot: runtimeSnapshot as never,
    resultData: { finalCount: 3 }, title: "Counter", renderFlowchart: () => <div />, ...extra };
  return { ...render(<ExplainableShell {...props} />), props };
}
function activity() { return screen.getByRole("region", { name: "Stage activity" }); }
function next() { fireEvent.click(screen.getByRole("button", { name: "Next stage" })); }
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

describe("Lens default developer template", () => {
  it.each([
    ["omitted", {}],
    ["unknown", { defaultTab: "not-a-recorder" }],
    ["hidden", { defaultTab: "narrative", hideTabs: ["narrative"] }],
  ] as const)("opens exact stage Activity when the default is %s", (_name, extra) => {
    setup({ ...extra, hideTabs: "hideTabs" in extra ? [...extra.hideTabs] : undefined });
    expect(within(activity()).getByRole("heading", { name: "Seed" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Activity" }).getAttribute("aria-pressed")).toBe("true");
    expect(document.querySelector('[data-fp="result-panel"]')).toBeNull();
    next();
    expect(activity().querySelector('[data-fp="stage-activity-visit"]')?.textContent).toBe("increment#1");
  });

  it("honors an explicit Result default instead of opening another mode", () => {
    setup({ defaultTab: "result" });
    expect(document.querySelector('[data-fp="result-panel"]')).toBeTruthy();
    expect(document.querySelector('[data-fp="result-panel"]')?.textContent).toContain('"finalCount": 3');
    expect(screen.queryByRole("region", { name: "Stage activity" })).toBeNull();
  });

  it("honors the public memory ID by opening Inspector State", () => {
    setup({ defaultTab: "memory" });
    expect(document.querySelector('[data-fp="memory-panel"]')).toBeTruthy();
    expect(screen.getByRole("button", { name: "State" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.queryByRole("region", { name: "Stage activity" })).toBeNull();
  });

  it("honors the public narrative ID and presents the selected visit in Run log", () => {
    setup({ defaultTab: "narrative" });
    expect(screen.getByRole("button", { name: "Run data" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Run log" }).getAttribute("data-active")).toBe("true");
    expect(screen.getByText("Seeded the counter.")).toBeTruthy();
    expect(document.querySelector('[data-fp="narrative-panel"]')?.getAttribute("data-presentation")).toBe("visits");
    expect(document.querySelector('[data-fp="narrative-visit"][data-current="true"]')?.textContent).toContain("seed#0");
    expect((screen.getByRole("checkbox", { name: "Follow cursor" }) as HTMLInputElement).checked).toBe(false);
    next();
    expect(screen.getByText("Incremented the counter.")).toBeTruthy();
    expect(document.querySelector('[data-fp="narrative-visit"][data-current="true"]')?.textContent).toContain("increment#1");
  });

  it("honors a custom recorder default and keeps the selected recorder after changing stages", () => {
    setup({ defaultTab: "audit", recorderViews: [{ id: "audit", name: "Audit", render: ({ snapshots: stages, selectedIndex }) =>
      <output aria-label="Audit visit">{stages[selectedIndex].runtimeStageId}</output> }] });
    expect(screen.getByRole("button", { name: "Audit" }).getAttribute("data-active")).toBe("true");
    expect(screen.getByLabelText("Audit visit").textContent).toBe("seed#0");
    next();
    expect(screen.getByLabelText("Audit visit").textContent).toBe("increment#1");
  });

  it("selects an available Run data tab when a selected recorder disappears", () => {
    const ui = setup({ defaultTab: "audit", recorderViews: [{ id: "audit", name: "Audit", render: () => <div>Audit result</div> }] });
    expect(screen.getByText("Audit result")).toBeTruthy();
    ui.rerender(<ExplainableShell {...ui.props} recorderViews={[]} />);
    const panel = document.querySelector('[data-fp="insight-panel"]') as HTMLElement;
    expect(within(panel).getByRole("button", { name: "Run log" }).getAttribute("data-active")).toBe("true");
    expect(within(panel).getByText("Seeded the counter.")).toBeTruthy();
  });

  it("opens narrow Details in Activity while respecting an explicit Result default", () => {
    withNarrowLayout(() => {
      const ui = setup();
      fireEvent.click(screen.getByRole("button", { name: /Details/ }));
      expect(activity().querySelector('[data-fp="stage-activity-visit"]')?.textContent).toBe("seed#0");
      ui.unmount();
      setup({ defaultTab: "result" });
      fireEvent.click(screen.getByRole("button", { name: /Details/ }));
      expect(document.querySelector('[data-fp="result-panel"]')).toBeTruthy();
      expect(screen.queryByRole("region", { name: "Stage activity" })).toBeNull();
    });
  });

  it.each([undefined, "unknown", "explainable", "ai-compatible"])("opens the unstyled whole surface for default %s", defaultTab => {
    setup({ unstyled: true, defaultTab });
    expect(activity().querySelector('[data-fp="stage-activity-visit"]')?.textContent).toBe("seed#0");
    expect(document.querySelector('[data-fp="memory-panel"]')).toBeTruthy();
    expect(document.querySelector('[data-fp="time-travel-controls"]')).toBeTruthy();
    expect(document.querySelector('[data-fp="gantt-timeline"], [data-fp="gantt"]')).toBeTruthy();
  });

  it("keeps an explicit unstyled memory choice and hidden-default fallback functional", () => {
    const ui = setup({ unstyled: true, defaultTab: "memory" });
    expect(document.querySelector('[data-fp="memory-panel"]')).toBeTruthy();
    expect(screen.queryByRole("region", { name: "Stage activity" })).toBeNull();
    ui.unmount();
    setup({ unstyled: true, defaultTab: "narrative", hideTabs: ["narrative"] });
    expect(activity()).toBeTruthy();
    expect(document.querySelector('[data-fp="memory-panel"]')).toBeTruthy();
  });
});

function HostSelectionControls() {
  const lens = useLensWorkbench();
  const read = lens.activity.reads.find(variable => variable.key === "count");
  return <div>
    <output aria-label="Host selected visit">{lens.selectedSnapshot?.runtimeStageId}</output>
    <button onClick={() => lens.actions.selectStage("increment#1")}>Inspect Increment</button>
    <button disabled={!read?.traceTarget} onClick={() => read?.traceTarget && lens.actions.backtrack(read.traceTarget)}>Host backtrack read</button>
  </div>;
}
function HostInvocation() {
  const lens = useLensWorkbench();
  return <output aria-label="Host invocation">{lens.invocationPath.join(" / ") || "root"}</output>;
}

describe("Lens custom layout", () => {
  const layout = (lens: LensWorkbenchContextValue) => <main aria-label="Custom debugger">
    {lens.surfaces.timeTravel}{lens.surfaces.breadcrumb}<HostSelectionControls />
    {lens.surfaces.chart}{lens.surfaces.inspector}
  </main>;

  it("shares exact cursor and validated backtrack-return behavior with host controls", () => {
    setup({ renderLayout: layout });
    expect(screen.getByRole("main", { name: "Custom debugger" })).toBeTruthy();
    expect(screen.getByLabelText("Host selected visit").textContent).toBe("seed#0");
    fireEvent.click(screen.getByRole("button", { name: "Inspect Increment" }));
    expect(screen.getByLabelText("Host selected visit").textContent).toBe("increment#1");
    fireEvent.click(screen.getByRole("button", { name: "Host backtrack read" }));
    expect(screen.getByLabelText("Host selected visit").textContent).toBe("seed#0");
    expect(document.querySelector('[data-fp="trace-walk-card"]')?.textContent).toContain("wrote count = 2");
    fireEvent.click(within(screen.getByRole("toolbar")).getByRole("button", { name: "Return to Increment activity" }));
    expect(screen.getByLabelText("Host selected visit").textContent).toBe("increment#1");
    expect(activity().querySelector('[data-fp="stage-activity-visit"]')?.textContent).toBe("increment#1");
    expect(document.activeElement?.getAttribute("data-variable-kind")).toBe("read");
    expect(document.activeElement?.getAttribute("aria-pressed")).toBe("true");
  });

  it("rejects a retained custom-layout trace target after the run changes", () => {
    let current: LensWorkbenchContextValue | undefined;
    const ui = setup({ renderLayout: lens => { current = lens; return layout(lens); } });
    fireEvent.click(screen.getByRole("button", { name: "Inspect Increment" }));
    const oldBacktrack = current!.actions.backtrack;
    const oldTarget = current!.activity.reads.find(variable => variable.key === "count")!.traceTarget!;
    ui.rerender(<ExplainableShell {...ui.props} runtimeSnapshot={{ ...runtimeSnapshot, runId: "next-template-run" } as never} />);
    act(() => oldBacktrack(oldTarget));
    expect(document.querySelector('[data-fp="trace-walk-card"]')).toBeNull();
    expect(activity().querySelector('[data-fp="stage-activity-visit"]')?.textContent).toBe("increment#1");
  });
});

describe("Lens Metrics scope", () => {
  it.each([false, true])("shows child totals of 3 instead of the root total of 13 (custom layout: %s)", customLayout => {
    const child = {
      subflowId: "quote", subflowName: "Quote", treeContext: {
        globalContext: { count: 3 },
        stageContexts: { id: "quote/clean", name: "quote/Clean", runtimeStageId: "quote/clean#2", stageReads: {},
          next: { id: "quote/save", name: "quote/Save", runtimeStageId: "quote/save#3", stageReads: {} } },
        history: [
          { stage: "quote/Clean", stageId: "quote/clean", runtimeStageId: "quote/clean#2", overwrite: { count: 1 }, trace: [{ path: "count" }] },
          { stage: "quote/Save", stageId: "quote/save", runtimeStageId: "quote/save#3", overwrite: { count: 3 }, trace: [{ path: "count" }] },
        ],
      },
    };
    const rootSnapshots: StageSnapshot[] = [
      { stageName: "root", stageLabel: "Root", runtimeStageId: "root#0", memory: {}, narrative: "", startMs: 0, durationMs: 1 },
      { stageName: "quote", stageLabel: "Quote", runtimeStageId: "quote#1", subflowId: "quote", subflowResult: child,
        memory: {}, narrative: "", startMs: 1, durationMs: 1 },
    ];
    type ChartProps = Parameters<NonNullable<Props["renderFlowchart"]>>[0];
    let chart: ChartProps | undefined;
    setup({ defaultTab: "metrics", snapshots: rootSnapshots, narrativeEntries: [
      { type: "stage", text: "Root-only preparation.", depth: 0, stageId: "root", stageName: "Root", runtimeStageId: "root#0" },
      { type: "stage", text: "Entered the quote.", depth: 0, stageId: "quote", stageName: "Quote", runtimeStageId: "quote#1" },
      { type: "stage", text: "Cleaned this child visit.", depth: 1, stageId: "quote/clean", stageName: "quote/Clean", runtimeStageId: "quote/clean#2", subflowId: "quote" },
      { type: "stage", text: "Saved this child visit.", depth: 1, stageId: "quote/save", stageName: "quote/Save", runtimeStageId: "quote/save#3", subflowId: "quote" },
      { type: "stage", text: "Another invocation must stay hidden.", depth: 1, stageId: "quote/save", stageName: "quote/Save", runtimeStageId: "quote/save#99", subflowId: "quote" },
    ],
      runtimeSnapshot: { runId: "scoped-metrics", sharedState: {}, subflowResults: { "quote#1": child },
        commitLog: rootSnapshots.map(stage => ({ stage: stage.stageLabel, stageId: stage.stageName, runtimeStageId: stage.runtimeStageId, trace: [] })),
        executionTree: { id: "root", name: "Root", runtimeStageId: "root#0", stageReads: {},
          next: { id: "quote", name: "Quote", runtimeStageId: "quote#1", subflowId: "quote", stageReads: {} } },
        recorders: [{ id: "metrics", name: "Metrics", data: { numericField: "readCount", grandTotal: 13, steps: {
          "root#0": { stageName: "Root", duration: 4, readCount: 10, writeCount: 1, commitCount: 1 },
          "quote#1": { stageName: "Quote", duration: 3, readCount: 3, writeCount: 1, commitCount: 1 },
          "quote/clean#2": { stageName: "Clean", duration: 1.25, readCount: 1, writeCount: 1, commitCount: 1 },
          "quote/save#3": { stageName: "Save", duration: 1.75, readCount: 2, writeCount: 1, commitCount: 1 },
          "quote/save#99": { stageName: "Unrelated repeated Save", duration: 90, readCount: 99, writeCount: 99, commitCount: 99 },
        } } }],
      } as never,
      renderFlowchart: props => { chart = props; return <div />; },
      renderLayout: customLayout ? lens => <main aria-label="Scoped custom debugger">
        <HostInvocation />{lens.surfaces.timeTravel}{lens.surfaces.breadcrumb}{lens.surfaces.chart}{lens.surfaces.runData}
      </main> : undefined,
    });
    if (customLayout) expect(screen.getByLabelText("Host invocation").textContent).toBe("root");
    const reads = () => within(screen.getByRole("table", { name: "Metrics summary" })).getByRole("row", { name: /^Reads/ });
    expect([...reads().querySelectorAll("td")].map(cell => cell.textContent)).toEqual(["10", "10", "13"]);
    fireEvent.click(screen.getByRole("button", { name: "Run log" }));
    expect(screen.getByText("Root-only preparation.")).toBeTruthy();
    expect(screen.queryByText("Cleaned this child visit.")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Metrics" }));
    next();
    act(() => chart!.onNodeClick?.("quote"));
    if (customLayout) expect(screen.getByLabelText("Host invocation").textContent).toBe("quote#1");
    expect([...reads().querySelectorAll("td")].map(cell => cell.textContent)).toEqual(["1", "1", "3"]);
    next();
    expect([...reads().querySelectorAll("td")].map(cell => cell.textContent)).toEqual(["2", "3", "3"]);
    const details = screen.getByRole("table", { name: "Recorded visit metrics" });
    expect(details.textContent).toContain("quote/save#3");
    expect(details.textContent).not.toContain("quote/save#99");
    expect(within(details).getByRole("row", { name: /quote\/save#3/ }).getAttribute("aria-current")).toBe("step");
    expect(screen.getByRole("table", { name: "Metrics summary" }).textContent).toContain("Duration (ms)");
    fireEvent.click(screen.getByRole("button", { name: "Run log" }));
    expect(screen.getByText("Cleaned this child visit.")).toBeTruthy();
    expect(screen.getByText("Saved this child visit.")).toBeTruthy();
    expect(screen.queryByText("Root-only preparation.")).toBeNull();
    expect(screen.queryByText("Another invocation must stay hidden.")).toBeNull();
    expect(document.querySelector('[data-fp="narrative-visit"][data-current="true"]')?.getAttribute("data-runtime-stage-id")).toBe("quote/save#3");
  });
});
