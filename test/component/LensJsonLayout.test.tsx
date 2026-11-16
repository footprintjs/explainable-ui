/** @vitest-environment jsdom */
import * as React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ExplainableShell } from "../../src/components/ExplainableShell/ExplainableShell";
import { TraceViewer } from "../../src/components/TraceViewer/TraceViewer";
import type { NarrativeEntry, StageSnapshot } from "../../src/types";

type Props = React.ComponentProps<typeof ExplainableShell>;
type Layout = NonNullable<Props["layout"]>;

const SPLIT: Layout = {
  columns: "2fr 1fr", rows: "auto minmax(0, 1fr) minmax(0, 1fr)", minHeight: 480, gap: 12,
  areas: [["timeTravel", "timeTravel"], ["flowchart", "developer"], ["flowchart", "commentary"]],
};
const CORE: Layout = { columns: "1fr", rows: "auto minmax(0, 1fr)", areas: [["timeTravel"], ["flowchart"]] };

function recording() {
  const stages = [
    { id: "seed", label: "Seed", count: 2 }, { id: "quote", label: "Quote", count: 3 },
    { id: "quote", label: "Quote", count: 4 }, { id: "finish", label: "Finish", count: 5 },
  ].map((stage, index) => ({ ...stage, runtimeStageId: `${stage.id}#${index}` }));
  const snapshots: StageSnapshot[] = stages.map((stage, index) => ({ stageName: stage.id, stageLabel: stage.label,
    runtimeStageId: stage.runtimeStageId, memory: { count: stage.count }, narrative: "", startMs: index, durationMs: 1 }));
  const text = ["Prepared request.", "First quote saved.", "Second quote saved.", "Finished request."];
  const narrativeEntries: NarrativeEntry[] = stages.map((stage, index) => ({ type: "stage", text: text[index], depth: 0,
    stageName: stage.label, stageId: stage.id, runtimeStageId: stage.runtimeStageId }));
  const executionTree = stages.reduceRight<Record<string, unknown> | undefined>((next, stage, index) => ({
    id: stage.id, name: stage.label, runtimeStageId: stage.runtimeStageId,
    stageReads: index ? { count: stage.count - 1 } : {}, stageWrites: { count: stage.count },
    ...(next ? { next } : {}),
  }), undefined);
  const runtimeSnapshot = { runId: "grid-layout", sharedState: { count: 5 }, executionTree, subflowResults: {},
    commitLog: stages.map(stage => ({ stage: stage.label, stageId: stage.id, runtimeStageId: stage.runtimeStageId,
      overwrite: { count: stage.count }, updates: {}, trace: [{ path: "count", verb: "set" }] })) };
  return { snapshots, narrativeEntries, runtimeSnapshot };
}
function setup(extra: Partial<Props> = {}) {
  const run = recording();
  const props: Props = { ...run, runtimeSnapshot: run.runtimeSnapshot as never, layout: SPLIT,
    renderFlowchart: chart => <output aria-label="Chart visit">{chart.snapshots[chart.selectedIndex]?.runtimeStageId}</output>, ...extra };
  return { ...render(<ExplainableShell {...props} />), props, run };
}
function surface(name: string) {
  const area = document.querySelector<HTMLElement>(`[data-fp-surface="${name}"]`);
  expect(area).toBeTruthy();
  return area!;
}
function activity() { return screen.getByRole("region", { name: "Stage activity" }); }
function activityVisit() { return activity().querySelector('[data-fp="stage-activity-visit"]')?.textContent; }
function currentCommentVisit() {
  return surface("commentary").querySelector('[data-fp="commentary-entry"][data-current="true"]')?.getAttribute("data-runtime-stage-id");
}
function select(index: number) { fireEvent.change(screen.getByRole("slider"), { target: { value: String(index) } }); }
function ChartProbe({ visit, onMount, onUnmount }: { visit?: string; onMount: () => void; onUnmount: () => void }) {
  React.useEffect(() => { onMount(); return onUnmount; }, [onMount, onUnmount]);
  return <output aria-label="Chart visit">{visit}</output>;
}

afterEach(() => vi.restoreAllMocks());

describe("Lens JSON layout integration", () => {
  it("keeps split developer and commentary areas on the chart's one selected visit", () => {
    setup();
    const root = document.querySelector('[data-fp="explainable-shell"]')!;
    expect(root.getAttribute("data-layout")).toBe("grid");
    expect(document.querySelectorAll('[data-fp-surface="flowchart"]')).toHaveLength(1);
    expect(document.querySelectorAll('[data-fp-surface="timeTravel"]')).toHaveLength(1);
    expect(screen.queryByRole("tablist", { name: "Details view" })).toBeNull();
    select(2);
    expect(screen.getByLabelText("Chart visit").textContent).toBe("quote#2");
    expect(activityVisit()).toBe("quote#2");
    expect(currentCommentVisit()).toBe("quote#2");
    expect(surface("commentary").textContent).toContain("Second quote saved.");
    expect(surface("commentary").textContent).not.toContain("Finished request.");
    select(1);
    expect(screen.getByLabelText("Chart visit").textContent).toBe("quote#1");
    expect(activityVisit()).toBe("quote#1");
    expect(currentCommentVisit()).toBe("quote#1");
    expect(surface("commentary").textContent).not.toContain("Second quote saved.");
  });

  it("shows the variable dependency graph when backtracking a recording without chart topology", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    setup({ renderFlowchart: undefined, traceGraph: undefined });
    const flowchart = surface("flowchart");
    expect(flowchart.querySelector('[data-fp="shell-missing-chart"]')).toBeTruthy();
    select(2);
    fireEvent.click(within(activity()).getByRole("button", { name: "Inspect write count" }));
    const inspector = within(activity()).getByRole("complementary", { name: "Variable inspector" });
    fireEvent.click(within(inspector).getByRole("button", { name: "Backtrack write count" }));

    expect(screen.getByRole("toolbar", { name: "Tracing count" }).getAttribute("data-tracing")).toBe("true");
    expect(surface("developer").querySelector('[data-fp="trace-walk-card"]')?.textContent).toContain("wrote count = 4");
    expect(within(flowchart).getByRole("region", { name: "Variable investigation" })).toBeTruthy();
    expect(within(flowchart).getByRole("button", { name: "Variables" }).getAttribute("aria-pressed")).toBe("true");
    expect(flowchart.querySelector('[data-fp="trace-dependency-canvas"]')).toBeTruthy();
    expect(flowchart.querySelectorAll('[data-fp="trace-variable-node"]').length).toBeGreaterThan(1);
    expect(flowchart.querySelector('[data-fp="shell-missing-chart"]')).toBeNull();
  });

  it("does not mount omitted optional surfaces or call their renderers", () => {
    const audit = vi.fn(() => <div>UNMOUNTED AUDIT</div>);
    const prose = vi.fn((entry: NarrativeEntry) => <span>{entry.text}</span>);
    const onMount = vi.fn(), onUnmount = vi.fn();
    const chart = vi.fn<NonNullable<Props["renderFlowchart"]>>(props => <ChartProbe
      visit={props.snapshots[props.selectedIndex]?.runtimeStageId} onMount={onMount} onUnmount={onUnmount} />);
    setup({ layout: CORE, defaultTab: "audit", recorderViews: [{ id: "audit", name: "Audit", render: audit }],
      commentary: { renderEntry: prose }, renderFlowchart: chart });
    expect(audit).not.toHaveBeenCalled();
    expect(prose).not.toHaveBeenCalled();
    expect(chart).toHaveBeenCalled();
    expect(onMount).toHaveBeenCalledTimes(1);
    expect(onUnmount).not.toHaveBeenCalled();
    for (const name of ["developer", "commentary", "details", "timeline"])
      expect(document.querySelector(`[data-fp-surface="${name}"]`)).toBeNull();
    expect(document.querySelector('[data-fp="commentary-panel"]')).toBeNull();
    expect(document.querySelector('[data-fp="inspector-panel"]')).toBeNull();
    expect(document.querySelector('[data-fp="gantt-timeline"], [data-fp="gantt"]')).toBeNull();
    expect(screen.queryByText("UNMOUNTED AUDIT")).toBeNull();
  });

  it("rearranges named areas without remounting the chart, resetting the cursor or losing the inspected read", () => {
    const onMount = vi.fn(), onUnmount = vi.fn();
    const ui = setup({ renderFlowchart: chart => <ChartProbe visit={chart.snapshots[chart.selectedIndex]?.runtimeStageId}
      onMount={onMount} onUnmount={onUnmount} /> });
    select(1);
    fireEvent.click(within(activity()).getByRole("button", { name: "Inspect read count" }));
    const originalChart = screen.getByLabelText("Chart visit"), originalRail = screen.getByRole("toolbar");
    const originalDeveloper = surface("developer");
    const rearranged: Layout = { columns: "1fr 2fr", rows: "minmax(0, 1fr) minmax(0, 1fr) auto", gap: "1rem",
      areas: [["commentary", "flowchart"], ["developer", "flowchart"], ["timeTravel", "timeTravel"]] };
    ui.rerender(<ExplainableShell {...ui.props} layout={rearranged} />);
    expect([...document.querySelectorAll('[data-fp-surface]')].map(area => area.getAttribute("data-fp-surface"))).toEqual([
      "commentary", "flowchart", "developer", "timeTravel",
    ]);
    expect(screen.getByLabelText("Chart visit")).toBe(originalChart);
    expect(screen.getByRole("toolbar")).toBe(originalRail);
    expect(surface("developer")).toBe(originalDeveloper);
    expect(screen.getByLabelText("Chart visit").textContent).toBe("quote#1");
    expect(activityVisit()).toBe("quote#1");
    expect(currentCommentVisit()).toBe("quote#1");
    const inspector = within(activity()).getByRole("complementary", { name: "Variable inspector" });
    expect(within(inspector).getByText("Read key")).toBeTruthy();
    expect(inspector.querySelector('[data-fp="stage-activity-value"]')?.textContent).toBe("2");
    expect(onMount).toHaveBeenCalledTimes(1);
    expect(onUnmount).not.toHaveBeenCalled();
  });

  it("retains the two-choice Details helper and optional timeline on the same grid cursor", () => {
    const layout: Layout = { columns: "2fr 1fr", rows: "auto 1fr auto",
      areas: [["timeTravel", "timeTravel"], ["flowchart", "details"], ["timeline", "timeline"]] };
    setup({ layout });
    expect(surface("timeline").querySelector('[data-fp="gantt-timeline"], [data-fp="gantt"]')).toBeTruthy();
    const originalChart = screen.getByLabelText("Chart visit");
    select(1);
    fireEvent.click(screen.getByRole("tab", { name: "Commentary" }));
    expect(surface("details").textContent).toContain("First quote saved.");
    expect(screen.getByLabelText("Chart visit")).toBe(originalChart);
    select(2);
    fireEvent.click(screen.getByRole("tab", { name: "Developer" }));
    expect(activityVisit()).toBe("quote#2");
    expect(screen.getByLabelText("Chart visit")).toBe(originalChart);
    expect(screen.getByLabelText("Chart visit").textContent).toBe("quote#2");
    expect(document.querySelector('[data-fp="commentary-panel"]')).toBeNull();
  });

  it("forwards the public layout from TraceViewer while preserving slider and commentary synchronization", () => {
    const run = recording();
    const onError = vi.fn();
    const layout: Layout = { columns: "2fr 1fr", rows: "auto 1fr",
      areas: [["timeTravel", "timeTravel"], ["flowchart", "commentary"]] };
    render(<TraceViewer recording={{ snapshot: run.runtimeSnapshot, narrativeEntries: run.narrativeEntries }}
      layout={layout} onError={onError} renderFlowchart={chart =>
        <output aria-label="Chart visit">{chart.snapshots[chart.selectedIndex]?.runtimeStageId}</output>} />);
    expect(document.querySelector('[data-fp="explainable-shell"]')?.getAttribute("data-layout")).toBe("grid");
    select(2);
    expect(screen.getByLabelText("Chart visit").textContent).toBe("quote#2");
    expect(currentCommentVisit()).toBe("quote#2");
    expect(surface("commentary").textContent).toContain("Second quote saved.");
    expect(surface("commentary").textContent).not.toContain("Finished request.");
    expect(document.querySelector('[data-fp-surface="developer"]')).toBeNull();
    expect(onError).not.toHaveBeenCalled();
  });

  it("gives a renderLayout callback precedence over a supplied JSON layout", () => {
    const renderLayout = vi.fn<NonNullable<Props["renderLayout"]>>(lens => <main aria-label="Host arrangement">
      {lens.surfaces.timeTravel}{lens.surfaces.chart}
    </main>);
    // This JSON would be refused if it were consumed: the callback owns layout.
    setup({ layout: { columns: "1fr", areas: [["commentary"]] }, renderLayout });
    expect(screen.getByRole("main", { name: "Host arrangement" })).toBeTruthy();
    expect(document.querySelector('[data-fp="explainable-shell"]')?.getAttribute("data-layout")).toBe("custom");
    expect(document.querySelector('[data-layout="grid"]')).toBeNull();
    select(2);
    expect(screen.getByLabelText("Chart visit").textContent).toBe("quote#2");
    expect(renderLayout).toHaveBeenCalled();
  });

  it("reports an invalid consumer layout instead of silently dropping required surfaces", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => setup({ layout: { columns: "1fr", areas: [["commentary"]] } }))
      .toThrow(/Invalid Lens layout: timeTravel and flowchart areas are required/);
  });
});
