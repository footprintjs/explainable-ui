/** @vitest-environment jsdom */
import { describe, it, expect } from "vitest";
import { render, act, fireEvent, screen } from "@testing-library/react";
import * as React from "react";
import { readFileSync } from "node:fs";
import { createTraceStructureRecorder } from "../../src/components/FlowchartView/traceStructureRecorder";
import { ExplainableShell } from "../../src/components/ExplainableShell/ExplainableShell";
type Props = React.ComponentProps<typeof ExplainableShell>;
const runs = JSON.parse(
  readFileSync("test/fixtures/subflow-tracing/recordings.json", "utf8")
);
const review = JSON.parse(
  readFileSync("test/fixtures/subflow-tracing/review-recordings.json", "utf8")
);
function setup(name = "nested", extra: Partial<Props> = {}) {
  let current: any;
  const props: Props = {
    runtimeSnapshot: structuredClone(
      (runs[name] ?? review[name]).runtimeSnapshot
    ),
    renderFlowchart: (p) => {
      current = p;
      return (
        <div data-testid="position">
          {p.selectedIndex}:{p.snapshots[p.selectedIndex]?.stageName}
        </div>
      );
    },
    ...extra,
  };
  const view = render(<ExplainableShell {...props} />);
  return {
    click: (id: string) => act(() => current.onNodeClick(id)),
    drill: (id: string) => act(() => current.onSubflowChange(id)),
    replace: (next: Partial<Props>) =>
      view.rerender(<ExplainableShell {...props} {...next} />),
    props,
  };
}
function move(n: number) {
  for (let i = 0; i < n; i++)
    fireEvent.click(screen.getByLabelText("Next stage"));
}
const notice = () => document.querySelector('[data-fp="source-change-note"]');
describe("round-two navigation regressions", () => {
  it("selects an ordinary full-path step inside a recorded child without a drill refusal", () => {
    const ui = setup("seedless");
    ui.drill("prepare");
    ui.click("prepare/sum");
    expect(notice()).toBeNull();
    expect(screen.getByTestId("position").textContent).toContain("Child Sum");
  });
  it("routes ordinary nodes through the real chart without a false mount error", () => {
    const run = structuredClone(runs.nested);
    const trace = createTraceStructureRecorder();
    for (const { method, event } of run.structureEvents)
      (trace.recorder as any)[method](event);
    render(
      <ExplainableShell
        runtimeSnapshot={run.runtimeSnapshot}
        traceGraph={trace.getGraph()}
      />
    );
    const mount = document.querySelector(
      '.react-flow__node[data-id="prepare"]'
    );
    expect(mount).not.toBeNull();
    fireEvent.click(mount!);
    const step = document.querySelector(
      '.react-flow__node[data-id="prepare/sum"]'
    );
    expect(step).not.toBeNull();
    fireEvent.click(step!);
    expect(notice()).toBeNull();
    expect(document.body.textContent).toContain("Child Sum");
  });
  it("opens an explicitly clicked runtime invocation without a path guess", () => {
    const ui = setup("repeated");
    ui.click("prepare#9");
    expect(notice()).toBeNull();
    expect(screen.getByText(/prepare · visit 2 of 2/)).toBeTruthy();
  });
  it("closes the chooser when switching the visible details tab", () => {
    const ui = setup("repeated");
    move(7);
    ui.click("prepare");
    expect(
      document.querySelector('[data-fp="subflow-visit-choice"]')
    ).not.toBeNull();
    fireEvent.click(screen.getByText("Inspector"));
    expect(
      document.querySelector('[data-fp="subflow-visit-choice"]')
    ).toBeNull();
  });
  it("accepts an exact ordinary label containing a slash", () => {
    const ui = setup("nested", {
      runtimeSnapshot: undefined,
      snapshots: [
        {
          stageName: "Load",
          stageLabel: "Load",
          memory: {},
          narrative: "",
          startMs: 0,
          durationMs: 0,
        },
        {
          stageName: "Read/Write config",
          stageLabel: "Read/Write config",
          memory: {},
          narrative: "",
          startMs: 0,
          durationMs: 0,
        },
      ],
    });
    ui.click("Read/Write config");
    expect(screen.getByTestId("position").textContent).toBe(
      "1:Read/Write config"
    );
    expect(notice()).toBeNull();
  });
  it("keeps or clamps the root cursor across a new run with no permanent notice", () => {
    const ui = setup();
    move(3);
    ui.replace({
      runtimeSnapshot: structuredClone(review.seedless.runtimeSnapshot),
    });
    expect(screen.getByTestId("position").textContent).not.toMatch(/^0:/);
    expect(notice()).toBeNull();
  });
  it("clears a lost-invocation notice on the next cursor move", () => {
    const ui = setup();
    ui.drill("pipeline/prepare");
    ui.replace({
      runtimeSnapshot: structuredClone(review.seedless.runtimeSnapshot),
    });
    expect(notice()).not.toBeNull();
    fireEvent.click(screen.getByLabelText("Previous stage"));
    expect(notice()).toBeNull();
  });
  it("dismisses a visit chooser on cursor movement and uses non-submitting buttons", () => {
    const ui = setup("repeated");
    move(7);
    ui.click("prepare");
    const choice = document.querySelector('[data-fp="subflow-visit-choice"]');
    expect(choice).not.toBeNull();
    expect(choice?.querySelector("button")?.type).toBe("button");
    fireEvent.click(screen.getByLabelText("Previous stage"));
    expect(
      document.querySelector('[data-fp="subflow-visit-choice"]')
    ).toBeNull();
  });
  it("does not flag absent null inputs as stale across runs", () => {
    const ui = setup("nested", { runtimeOverlay: null });
    ui.replace({
      runtimeSnapshot: structuredClone(review.seedless.runtimeSnapshot),
      runtimeOverlay: null,
    });
    expect(
      document.querySelector('[data-fp="companion-source-note"]')
    ).toBeNull();
  });
  it("respects an explicit constant empty Story override after a new run", () => {
    const empty: any[] = [];
    const ui = setup("nested", { narrativeEntries: empty });
    const next = structuredClone(review.seedless.runtimeSnapshot);
    next.recorders = [
      {
        id: "story",
        name: "Narrative",
        data: [{ type: "stage", text: "THIS MUST STAY HIDDEN", depth: 0 }],
      },
    ];
    ui.replace({ runtimeSnapshot: next, narrativeEntries: empty });
    expect(
      document.querySelector('[data-fp="companion-source-note"]')
    ).toBeNull();
    expect(screen.queryByRole("tab", { name: "Story" })).toBeNull();
    expect(document.body.textContent).not.toContain("THIS MUST STAY HIDDEN");
  });
});
