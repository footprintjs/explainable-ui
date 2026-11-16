/** @vitest-environment jsdom */
import * as React from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ExplainableShell } from "../../src/components/ExplainableShell/ExplainableShell";
import { CommentaryPanel } from "../../src/components/ExplainableView/CommentaryPanel";
import { ExplainableProvider } from "../../src/components/ExplainableView/ExplainableContext";
import type { NarrativeEntry, StageSnapshot } from "../../src/types";

type Props = React.ComponentProps<typeof ExplainableShell>;
const UNRECORDED_RESULT = "UNRECORDED_RESULT_PAYLOAD";

function groupedRun() {
  const stages = [
    { id: "input", label: "Read request" }, { id: "validate", label: "Validate" },
    { id: "validate", label: "Validate" }, { id: "deliver", label: "Deliver" },
  ].map((stage, index) => ({ ...stage, runtimeStageId: `${stage.id}#${index}`, budget: 4 - index }));
  const snapshots: StageSnapshot[] = stages.map((stage, index) => ({ stageName: stage.id, stageLabel: stage.label,
    runtimeStageId: stage.runtimeStageId, memory: { budget: stage.budget, rawResult: UNRECORDED_RESULT },
    narrative: "", startMs: index, durationMs: 1 }));
  const entry = (index: number, type: string, text: string, extra: Partial<NarrativeEntry> = {}): NarrativeEntry => ({
    type, text, depth: 0, stageName: stages[index].label, stageId: stages[index].id,
    runtimeStageId: stages[index].runtimeStageId, ...extra,
  });
  const narrativeEntries: NarrativeEntry[] = [
    entry(0, "stage", "Loaded a request."),
    entry(0, "comment", "Customer chose standard delivery."),
    entry(1, "stage", "Checked the first attempt."),
    entry(1, "step", "Step 1: Read budget = 4", { key: "budget", stepNumber: 1, rawValue: 4 }),
    entry(1, "condition", "Enough budget to continue."),
    entry(2, "stage", "Checked the retry."),
    entry(2, "step", "Step 2: Read budget = 3", { key: "budget", stepNumber: 2, rawValue: 3 }),
    entry(2, "step", "Step 3: Write decision = approved", { key: "decision", stepNumber: 3, rawValue: "approved" }),
    entry(2, "emit", "Result: order approved."),
    entry(3, "stage", "Notified the customer."),
  ];
  const executionTree = stages.reduceRight<Record<string, unknown> | undefined>((next, stage, index) => ({
    id: stage.id, name: stage.label, runtimeStageId: stage.runtimeStageId,
    stageReads: index ? { budget: stage.budget + 1 } : {}, stageWrites: { budget: stage.budget },
    ...(next ? { next } : {}),
  }), undefined);
  const runtimeSnapshot = { runId: "grouped-commentary", sharedState: { budget: 1 }, executionTree, subflowResults: {},
    commitLog: stages.map(stage => ({ stage: stage.label, stageId: stage.id, runtimeStageId: stage.runtimeStageId,
      overwrite: { budget: stage.budget }, updates: {}, trace: [{ path: "budget", verb: "set" }] })) };
  return { snapshots, narrativeEntries, runtimeSnapshot };
}
function setup(extra: Partial<Props> = {}) {
  const run = groupedRun();
  const props: Props = { ...run, runtimeSnapshot: run.runtimeSnapshot as never, title: "Orders", view: "story",
    renderFlowchart: chart => <output aria-label="Chart visit">{chart.snapshots[chart.selectedIndex]?.runtimeStageId}</output>, ...extra };
  return { ...render(<ExplainableShell {...props} />), props, run };
}
function panel() { return document.querySelector('[data-fp="commentary-panel"]') as HTMLElement; }
function visits() { return [...panel().querySelectorAll<HTMLElement>('[data-fp="commentary-visit"]')]; }
function visit(id: string) { return panel().querySelector<HTMLElement>(`[data-fp="commentary-visit"][data-runtime-stage-id="${id}"]`)!; }
function select(index: number) { fireEvent.change(screen.getByRole("slider"), { target: { value: String(index) } }); }
function prose() { return [...panel().querySelectorAll('[data-fp="commentary-prose"]')].map(node => node.textContent); }

afterEach(() => vi.restoreAllMocks());

describe("Lens grouped commentary", () => {
  it("keeps stage headings, inner messages and explicit emitted results in the admitted prefix", () => {
    setup();
    expect(visits().map(group => group.dataset.runtimeStageId)).toEqual(["input#0"]);
    expect(within(visit("input#0")).getByText("Read request", { exact: true })).toBeTruthy();
    expect(within(visit("input#0")).getByText("Customer chose standard delivery.").closest("details")).toBeNull();
    select(1);
    expect(visits().map(group => group.dataset.runtimeStageId)).toEqual(["input#0", "validate#1"]);
    expect(within(visit("validate#1")).getByText("Enough budget to continue.").closest("details")).toBeNull();
    expect(panel().textContent).not.toContain("Result");
    expect(panel().textContent).not.toContain(UNRECORDED_RESULT);
    select(2);
    expect(visits().map(group => group.dataset.runtimeStageId)).toEqual(["input#0", "validate#1", "validate#2"]);
    expect(within(panel()).getAllByText("Validate", { exact: true })).toHaveLength(2);
    const result = within(visit("validate#2")).getByText("Result: order approved.");
    expect(result.closest("details")).toBeNull();
    expect(prose()).toEqual(groupedRun().narrativeEntries.slice(0, 9).map(entry => entry.text));
    expect(panel().textContent).not.toContain("Notified the customer.");
    expect(panel().textContent).not.toContain("validate#2");
    const operations = visit("validate#2").querySelector<HTMLDetailsElement>('[data-fp="commentary-operations"]')!;
    expect(operations.open).toBe(false);
    expect(operations.querySelector("summary")?.textContent).toBe("Recorded operations (2)");
    expect(operations.textContent).toContain("Step 2: Read budget = 3");
    expect(operations.textContent).toContain("Step 3: Write decision = approved");
    select(1);
    expect(visits().map(group => group.dataset.runtimeStageId)).toEqual(["input#0", "validate#1"]);
    expect(panel().textContent).not.toContain("Result: order approved.");
  });

  it("preserves arrival order and follows a visible selected header when its operations are collapsed", () => {
    const run = groupedRun();
    const reordered = [run.narrativeEntries[9], run.narrativeEntries[5], run.narrativeEntries[0],
      run.narrativeEntries[6], run.narrativeEntries[2]];
    const scroll = vi.spyOn(Element.prototype, "scrollIntoView");
    setup({ narrativeEntries: reordered });
    scroll.mockClear();
    select(2);
    expect(visits().map(group => group.dataset.runtimeStageId)).toEqual(["validate#2", "input#0", "validate#2", "validate#1"]);
    expect(prose()).toEqual(reordered.slice(1).map(entry => entry.text));
    expect(panel().textContent).not.toContain("Notified the customer.");
    const currentEntry = panel().querySelector<HTMLElement>('[data-fp="commentary-entry"][data-current="true"]')!;
    expect(currentEntry.dataset.sourceIndex).toBe("3");
    expect(currentEntry.dataset.runtimeStageId).toBe("validate#2");
    const selectedGroup = currentEntry.closest<HTMLElement>('[data-fp="commentary-visit"]')!;
    expect(selectedGroup.querySelector<HTMLDetailsElement>("details")?.open).toBe(false);
    expect(scroll).toHaveBeenCalled();
    const anchor = scroll.mock.contexts.at(-1) as HTMLElement;
    expect(selectedGroup.contains(anchor)).toBe(true);
    expect(anchor.closest("details")).toBeNull();
  });

  it("retains global displayed renderer indices and original source indices across grouped operation blocks", () => {
    setup({ commentary: { maxLines: 6, renderEntry: (entry, context) =>
      <span data-display-index={context.index} data-render-current={context.current}>{entry.text}</span> } });
    select(2);
    const rows = [...panel().querySelectorAll<HTMLElement>('[data-fp="commentary-entry"]')];
    expect(rows.map(row => row.dataset.sourceIndex)).toEqual(["3", "4", "5", "6", "7", "8"]);
    expect(rows.map(row => row.querySelector("[data-display-index]")?.getAttribute("data-display-index"))).toEqual(["0", "1", "2", "3", "4", "5"]);
    expect(rows.map(row => row.querySelector("[data-render-current]")?.getAttribute("data-render-current"))).toEqual(["false", "false", "false", "false", "false", "true"]);
    expect(visits().map(group => group.dataset.runtimeStageId)).toEqual(["validate#1", "validate#2"]);
    expect(prose()).toEqual(groupedRun().narrativeEntries.slice(3, 9).map(entry => entry.text));
  });

  it("keeps grouped commentary and the chart on the same visit across Details choices", () => {
    setup({ view: undefined, defaultView: "story" });
    select(2);
    const chart = screen.getByLabelText("Chart visit");
    const expected = visits().map(group => group.dataset.runtimeStageId);
    fireEvent.click(screen.getByRole("tab", { name: "Developer" }));
    expect(screen.getByRole("region", { name: "Stage activity" }).querySelector('[data-fp="stage-activity-visit"]')?.textContent).toBe("validate#2");
    expect(screen.getByLabelText("Chart visit")).toBe(chart);
    fireEvent.click(screen.getByRole("tab", { name: "Commentary" }));
    expect(screen.getByLabelText("Chart visit")).toBe(chart);
    expect(chart.textContent).toBe("validate#2");
    expect(visits().map(group => group.dataset.runtimeStageId)).toEqual(expected);
    expect(visit("validate#2").dataset.current).toBe("true");
    expect(panel().textContent).toContain("Result: order approved.");
  });

  it("keeps the legacy standalone CommentaryPanel flat when grouping is not requested", () => {
    const run = groupedRun();
    render(<ExplainableProvider recording={{ snapshot: run.runtimeSnapshot, narrativeEntries: run.narrativeEntries }} selectedIndex={2}>
      <CommentaryPanel />
    </ExplainableProvider>);
    expect(visits()).toHaveLength(0);
    expect(prose()).toEqual(run.narrativeEntries.slice(0, 9).map(entry => entry.text));
    expect(panel().querySelector('[data-fp-part="commentary-entry-kind"]')).toBeTruthy();
  });
});

function childResult(first: number) {
  return { subflowId: "quote", subflowName: "Quote", treeContext: { globalContext: {},
    stageContexts: { id: "quote/load", name: "quote/Load", runtimeStageId: `quote/load#${first}`, stageReads: {},
      next: { id: "quote/save", name: "quote/Save", runtimeStageId: `quote/save#${first + 1}`, stageReads: {} } },
    history: [
      { stage: "quote/Load", stageId: "quote/load", runtimeStageId: `quote/load#${first}`, overwrite: {}, updates: {}, trace: [] },
      { stage: "quote/Save", stageId: "quote/save", runtimeStageId: `quote/save#${first + 1}`, overwrite: {}, updates: {}, trace: [] },
    ],
  } };
}

describe("Grouped commentary invocation boundaries", () => {
  it("keeps repeated child headings and emitted results inside the exact selected invocation", () => {
    const first = childResult(1), second = childResult(10);
    const snapshots: StageSnapshot[] = [first, second].map((result, index) => ({ stageName: "quote", stageLabel: "Quote",
      runtimeStageId: index ? "quote#9" : "quote#0", subflowId: "quote", subflowResult: result,
      memory: {}, narrative: "", startMs: index, durationMs: 1 }));
    const narrativeEntries: NarrativeEntry[] = [
      { type: "stage", text: "Opened first quote.", depth: 0, stageName: "Quote", stageId: "quote", runtimeStageId: "quote#0" },
      { type: "stage", text: "Loaded first quote.", depth: 1, stageName: "quote/Load", stageId: "quote/load", runtimeStageId: "quote/load#1", subflowId: "quote" },
      { type: "stage", text: "Saved first quote.", depth: 1, stageName: "quote/Save", stageId: "quote/save", runtimeStageId: "quote/save#2", subflowId: "quote" },
      { type: "emit", text: "Result: first quote accepted.", depth: 1, stageName: "quote/Save", stageId: "quote/save", runtimeStageId: "quote/save#2", subflowId: "quote" },
      { type: "stage", text: "Opened second quote.", depth: 0, stageName: "Quote", stageId: "quote", runtimeStageId: "quote#9" },
      { type: "stage", text: "Loaded second quote.", depth: 1, stageName: "quote/Load", stageId: "quote/load", runtimeStageId: "quote/load#10", subflowId: "quote" },
      { type: "stage", text: "Saved second quote.", depth: 1, stageName: "quote/Save", stageId: "quote/save", runtimeStageId: "quote/save#11", subflowId: "quote" },
      { type: "emit", text: "Result: second quote accepted.", depth: 1, stageName: "quote/Save", stageId: "quote/save", runtimeStageId: "quote/save#11", subflowId: "quote" },
    ];
    let onNodeClick: Parameters<NonNullable<Props["renderFlowchart"]>>[0]["onNodeClick"];
    setup({ title: "Repeated quotes", snapshots, narrativeEntries,
      runtimeSnapshot: { runId: "grouped-children", sharedState: {}, subflowResults: { "quote#0": first, "quote#9": second },
        commitLog: snapshots.map(stage => ({ stage: "Quote", stageId: "quote", runtimeStageId: stage.runtimeStageId, trace: [] })),
        executionTree: { id: "quote", name: "Quote", runtimeStageId: "quote#0", subflowId: "quote", stageReads: {},
          next: { id: "quote", name: "Quote", runtimeStageId: "quote#9", subflowId: "quote", stageReads: {} } } } as never,
      renderFlowchart: chart => { onNodeClick = chart.onNodeClick; return <output aria-label="Chart visit">{chart.snapshots[chart.selectedIndex]?.runtimeStageId}</output>; },
    });
    act(() => onNodeClick?.("quote"));
    select(1);
    expect(visits().map(group => group.dataset.runtimeStageId)).toEqual(["quote/load#1", "quote/save#2"]);
    expect(within(visit("quote/save#2")).getByText("quote/Save", { exact: true })).toBeTruthy();
    expect(visit("quote/save#2").textContent).toContain("Result: first quote accepted.");
    fireEvent.click(screen.getByRole("button", { name: "Repeated quotes" }));
    select(1);
    act(() => onNodeClick?.("quote"));
    select(1);
    expect(screen.getByLabelText("Chart visit").textContent).toBe("quote/save#11");
    expect(visits().map(group => group.dataset.runtimeStageId)).toEqual(["quote/load#10", "quote/save#11"]);
    expect(visit("quote/save#11").textContent).toContain("Result: second quote accepted.");
    expect(panel().textContent).not.toContain("Result: first quote accepted.");
    expect(panel().textContent).not.toContain("Opened second quote.");
  });
});
