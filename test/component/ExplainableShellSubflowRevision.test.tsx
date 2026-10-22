/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { readFileSync } from "node:fs";
import { ExplainableShell } from "../../src/components/ExplainableShell/ExplainableShell";
import { createTraceStructureRecorder } from "../../src/components/FlowchartView/traceStructureRecorder";

type Props = React.ComponentProps<typeof ExplainableShell>;
type Run = {
  runtimeSnapshot: NonNullable<Props["runtimeSnapshot"]>;
  narrativeEntries: NonNullable<Props["narrativeEntries"]>;
  structureEvents: Array<{ method: string; event: unknown }>;
};
const recordings = {
  ...JSON.parse(
    readFileSync("test/fixtures/subflow-tracing/recordings.json", "utf8"),
  ),
  ...JSON.parse(
    readFileSync(
      "test/fixtures/subflow-tracing/review-recordings.json",
      "utf8",
    ),
  ),
  legacy: (() => {
    const old = JSON.parse(
      readFileSync("test/fixtures/golden/subflow-loop.json", "utf8"),
    );
    return { ...old, runtimeSnapshot: old.snapshot };
  })(),
} as Record<string, Run>;
function setup(name = "nested", graph = true) {
  const run = structuredClone(recordings[name]);
  const structure = createTraceStructureRecorder();
  for (const { method, event } of run.structureEvents) {
    const fn = (structure.recorder as unknown as Record<string, unknown>)[
      method
    ];
    if (typeof fn === "function") fn.call(structure.recorder, event);
  }
  const ref: {
    drill?: (key: string | null) => void;
    click?: (key: string | number) => void;
  } = {};
  const props: Props = {
    runtimeSnapshot: run.runtimeSnapshot,
    narrativeEntries: run.narrativeEntries,
    traceGraph: graph ? structure.getGraph() : undefined,
    renderFlowchart: (p) => {
      ref.drill = p.onSubflowChange;
      ref.click = p.onNodeClick;
      return React.createElement("div");
    },
  };
  const view = render(React.createElement(ExplainableShell, props));
  return {
    run,
    drill: (key: string) => act(() => ref.drill?.(key)),
    click: (key: string) => act(() => ref.click?.(key)),
    replace: (
      source: Props["runtimeSnapshot"],
      entries = props.narrativeEntries,
    ) =>
      view.rerender(
        React.createElement(ExplainableShell, {
          ...props,
          runtimeSnapshot: source,
          narrativeEntries: entries,
        }),
      ),
    inspector: () => {
      fireEvent.click(screen.getByText("Inspector"));
      fireEvent.click(screen.getByText("Data Trace"));
    },
  };
}
function move(count: number) {
  for (let i = 0; i < count; i++)
    fireEvent.click(screen.getByLabelText("Next stage"));
}
function trace(key: string) {
  const chip = [
    ...document.querySelectorAll('[data-fp="trace-any-chip"]'),
  ].find((n) => n.textContent === key);
  expect(chip).toBeTruthy();
  fireEvent.click(chip!);
}
function card() {
  return document.querySelector('[data-fp="trace-walk-card"]') as HTMLElement;
}

describe("recorded subflow review regressions", () => {
  it("traces the middle level and describes its child mount as a boundary, not an origin", () => {
    const ui = setup();
    ui.drill("pipeline");
    ui.inspector();
    move(1);
    trace("total");
    expect(card().textContent).toContain("computed inside");
    expect(card().textContent).not.toContain("this is an origin");
  });
  it("keeps a trace through an equal fresh snapshot of the same run", () => {
    const ui = setup();
    ui.drill("pipeline/prepare");
    ui.inspector();
    move(3);
    trace("total");
    expect(card().textContent).toContain("= 44");
    ui.replace(JSON.parse(JSON.stringify(ui.run.runtimeSnapshot)));
    expect(card()?.textContent).toContain("= 44");
    expect(screen.getByRole("toolbar").getAttribute("data-tracing")).toBe(
      "true",
    );
  });
  it("reconciles every panel and breadcrumb when a different run replaces the source", () => {
    const ui = setup();
    ui.drill("pipeline/prepare");
    ui.inspector();
    move(3);
    trace("total");
    ui.replace({
      ...structuredClone(recordings.repeated.runtimeSnapshot),
      runId: "another-run",
    } as Props["runtimeSnapshot"]);
    expect(document.body.textContent).not.toContain("= 44");
    expect(screen.queryByRole("button", { name: "pipeline" })).toBeNull();
    expect(
      document.querySelector('[data-fp="source-change-note"]'),
    ).toBeTruthy();
  });
  it("copies the selected invocation and mapped input boundary instead of claiming never written", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    const ui = setup();
    ui.drill("pipeline/prepare");
    ui.inspector();
    move(3);
    trace("total");
    fireEvent.click(screen.getByText("Copy story"));
    const text = writeText.mock.calls[0][0] as string;
    expect(text).toContain("pipeline/prepare#8");
    expect(text).toContain("received at the subflow boundary");
    expect(text).not.toContain("never written");
  });
  it.each([false, true])(
    "resolves an exact nested path with a missing graph chain (%s)",
    (graph) => {
      const ui = setup("nested", graph);
      ui.click("pipeline/prepare");
      ui.inspector();
      move(3);
      trace("total");
      expect(card().textContent).toContain("= 44");
      expect(card().textContent).not.toContain("= 24");
    },
  );
  it("offers an explicit repeated-visit choice without silently moving to the first visit", () => {
    const ui = setup("repeated");
    move(7);
    ui.click("prepare");
    expect(screen.getByText(/This step ran 2 times/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /visit 2 of 2/ }));
    ui.inspector();
    move(3);
    trace("total");
    expect(card().textContent).toContain("= 44");
    expect(screen.getByText(/prepare · visit 2 of 2/)).toBeTruthy();
  });
  it("keeps Story entries inside the selected visit runtime IDs", () => {
    const ui = setup("repeated");
    move(5);
    ui.drill("prepare");
    move(3);
    fireEvent.click(screen.getByText("Story"));
    const story = document.querySelector('[data-fp="story-narrative"]');
    expect(story).toBeTruthy();
    expect(story?.textContent).not.toContain("Write total = 24");
    expect(story?.textContent).toContain("44");
  });
  it("traces a real child seed that writes constants and has no stageReads field", () => {
    const ui = setup("seedless");
    ui.drill("prepare");
    ui.inspector();
    move(2);
    trace("total");
    expect(card().textContent).toContain("= 6");
    fireEvent.click(screen.getByLabelText("Earlier cause"));
    expect(card().textContent).toContain("Child Sum");
  });
  it("uses the same reads-off explanation in a child as at the root", () => {
    const ui = setup("readsOff");
    ui.drill("prepare");
    ui.inspector();
    move(3);
    trace("total");
    expect(card().textContent).toContain("reads were not recorded");
    expect(card().textContent).not.toContain("this is an origin");
    expect(document.querySelector('[data-fp="trace-unavailable"]')).toBeNull();
  });
  it.each([
    { steps: 2, total: 204 },
    { steps: 5, total: 404 },
  ])(
    "keeps nested repeated middle/leaf visits together at parent step $steps",
    ({ steps, total }) => {
      const ui = setup("nestedLoop");
      move(steps);
      ui.drill("pipeline");
      ui.inspector();
      move(1);
      trace("total");
      expect(card().textContent).toContain(`= ${total}`);
      expect(card().textContent).toContain("computed inside");
      ui.drill("pipeline/prepare");
      move(3);
      trace("total");
      expect(card().textContent).toContain(`= ${total}`);
    },
  );
  it.each([
    { branch: 0, total: 6 },
    { branch: 1, total: 8 },
    { branch: 2, total: 10 },
  ])(
    "traces fan-out branch $branch without sibling evidence",
    ({ branch, total }) => {
      const ui = setup("fanout");
      ui.drill(`fan~${branch}`);
      ui.inspector();
      move(1);
      trace("total");
      expect(card().textContent).toContain(`= ${total}`);
    },
  );
  it("keeps producer-redacted child values masked in all shown trace text", () => {
    const ui = setup("redacted");
    ui.drill("prepare");
    ui.inspector();
    trace("secret");
    expect(card().textContent).toContain("REDACTED");
    expect(document.body.textContent).not.toContain("TOP-SECRET");
  });
  it("handles chart scope and node callbacks once and shows the same visit choice", () => {
    const ui = setup("repeated");
    move(7);
    ui.drill("prepare");
    ui.click("prepare");
    expect(screen.getByText(/This step ran 2 times/)).toBeTruthy();
    expect(
      document
        .querySelector('[data-fp="tt-tick"][data-active]')
        ?.getAttribute("title"),
    ).toContain("check");
  });
  it("reads a legacy empty mapper stamp without claiming missing history", () => {
    const ui = setup("legacy");
    ui.drill("sf-enrich");
    ui.inspector();
    move(1);
    trace("score");
    expect(card()).toBeTruthy();
    expect(document.querySelector('[data-fp="trace-unavailable"]')).toBeNull();
  });
  it("keeps a valid invocation when a different source run still contains its exact ID", () => {
    const ui = setup();
    ui.drill("pipeline/prepare");
    ui.inspector();
    move(3);
    trace("total");
    const replacement = structuredClone(
      ui.run.runtimeSnapshot,
    ) as Props["runtimeSnapshot"] & { runId: string };
    replacement!.runId = "different-source-same-invocation";
    ui.replace(replacement);
    expect(screen.getByRole("button", { name: "pipeline" })).toBeTruthy();
    expect(document.querySelector('[data-fp="trace-walk-card"]')).toBeNull();
    move(3);
    trace("total");
    expect(card().textContent).toContain("= 44");
  });
  it("never borrows a last-visit alias when the exact selected result is missing", () => {
    const ui = setup("repeated");
    const source = structuredClone(ui.run.runtimeSnapshot);
    delete source.subflowResults?.["prepare#2"];
    ui.replace(source);
    move(2);
    ui.drill("prepare");
    ui.inspector();
    expect(
      document.querySelector('[data-fp="source-change-note"]')?.textContent,
    ).toContain("unavailable");
    expect(document.querySelector('[data-fp="trace-walk-card"]')).toBeNull();
  });

  it("refreshes same-run child data while keeping the frozen trace question", () => {
    const ui = setup();
    ui.drill("pipeline/prepare");
    ui.inspector();
    move(3);
    trace("total");
    const source = structuredClone(ui.run.runtimeSnapshot);
    const child = (
      source.subflowResults!["pipeline/prepare#8"] as {
        treeContext: {
          history: Record<string, unknown>[];
          stageContexts: Record<string, unknown>;
        };
      }
    ).treeContext;
    child.history.push({
      overwrite: { total: 88 },
      updates: {},
      redactedPaths: [],
      trace: [{ path: "total", verb: "set" }],
      stage: "Later Child Total",
      stageId: "pipeline/prepare/later",
      runtimeStageId: "pipeline/prepare/later#999",
      idx: 5,
    });
    let last = child.stageContexts;
    while (last.next) last = last.next as Record<string, unknown>;
    last.next = {
      ...last,
      id: "pipeline/prepare/later",
      name: "Later Child Total",
      runtimeStageId: "pipeline/prepare/later#999",
      stageWrites: { total: 88 },
      stageReads: { total: 44 },
      next: undefined,
    };
    ui.replace(source);
    expect(screen.getByRole("toolbar").getAttribute("data-tracing")).toBe(
      "true",
    );
    expect(card().textContent).toContain("= 44");
    expect(card().textContent).not.toContain("Later Child Total");
    fireEvent.click(document.querySelector('[data-fp="tt-exit-tracing"]')!);
    move(1);
    trace("total");
    expect(card().textContent).toContain("= 88");
  });
  it("withholds a root trace after mount metadata admission fails instead of naming an origin", () => {
    const children: unknown[] = [];
    children.length = 100_001;
    render(
      React.createElement(ExplainableShell, {
        snapshots: [
          {
            stageName: "Hidden computation",
            stageLabel: "Hidden computation",
            runtimeStageId: "hidden#1",
            memory: { total: 7 },
            narrative: "",
            startMs: 0,
            durationMs: 1,
          },
        ],
        runtimeSnapshot: {
          sharedState: { total: 7 },
          commitLog: [
            {
              stage: "Hidden computation",
              stageId: "hidden",
              runtimeStageId: "hidden#1",
              trace: [{ path: "total" }],
            },
          ],
          executionTree: {
            id: "hidden",
            runtimeStageId: "hidden#1",
            subflowId: "inner",
            children,
          },
        },
      }),
    );
    fireEvent.click(screen.getByText("Inspector"));
    fireEvent.click(screen.getByText("Data Trace"));
    expect(screen.getByText(/Root trace is too large/)).toBeTruthy();
    expect(document.querySelector('[data-fp="trace-any-chip"]')).toBeNull();
    expect(document.body.textContent).not.toContain("this is an origin");
  });
  it("does not retain a known-stale companion Story after a new run with identical invocation IDs", () => {
    const ui = setup();
    ui.drill("pipeline/prepare");
    move(3);
    fireEvent.click(screen.getByText("Story"));
    expect(
      document.querySelector('[data-fp="story-narrative"]')?.textContent,
    ).toContain("Write total = 44");
    const source = JSON.parse(
      JSON.stringify(ui.run.runtimeSnapshot).replace(/44/g, "888"),
    );
    source.runId = "new-run-same-ids";
    ui.replace(source);
    move(3);
    expect(
      document.querySelector('[data-fp="story-narrative"]')?.textContent,
    ).not.toContain("Write total = 44");
    expect(
      document.querySelector('[data-fp="companion-source-note"]'),
    ).toBeTruthy();
  });
  it("never enumerates unrelated snapshot accessors when preparing the view", () => {
    const source = structuredClone(recordings.nested.runtimeSnapshot);
    let calls = 0;
    Object.defineProperty(source, "unrelatedPrivateField", {
      enumerable: true,
      get() {
        calls++;
        return "PRIVATE-DO-NOT-READ";
      },
    });
    render(
      React.createElement(ExplainableShell, {
        runtimeSnapshot: source,
        renderFlowchart: () => React.createElement("div"),
      }),
    );
    expect(calls).toBe(0);
  });
  it("does not keep an unchanged snapshots prop from the old run", () => {
    const source = structuredClone(recordings.nested.runtimeSnapshot);
    const oldSnapshots = [
      {
        stageName: "Old only",
        stageLabel: "Old only",
        runtimeStageId: "old#1",
        memory: { stale: "OLD-PRIVATE-STATE" },
        narrative: "old",
        startMs: 0,
        durationMs: 1,
      },
    ];
    const props: Props = {
      runtimeSnapshot: source,
      snapshots: oldSnapshots,
      renderFlowchart: () => React.createElement("div"),
    };
    const ui = render(React.createElement(ExplainableShell, props));
    const next = {
      ...structuredClone(recordings.seedless.runtimeSnapshot),
      runId: "new-source",
    };
    ui.rerender(
      React.createElement(ExplainableShell, {
        ...props,
        runtimeSnapshot: next,
      }),
    );
    fireEvent.click(screen.getByText("Inspector"));
    expect(document.body.textContent).not.toContain("OLD-PRIVATE-STATE");
    expect(
      document.querySelector('[data-fp="companion-source-note"]'),
    ).toBeTruthy();
  });

  it("accepts a fresh paired Story after withholding an old companion", () => {
    const ui = setup();
    ui.drill("pipeline/prepare");
    move(3);
    fireEvent.click(screen.getByText("Story"));
    const source = JSON.parse(
      JSON.stringify(ui.run.runtimeSnapshot).replace(/44/g, "888"),
    );
    source.runId = "fresh-paired-run";
    ui.replace(source);
    expect(
      document.querySelector('[data-fp="story-unavailable"]'),
    ).toBeTruthy();
    const entries = JSON.parse(
      JSON.stringify(ui.run.narrativeEntries).replace(/44/g, "888"),
    );
    ui.replace(source, entries);
    move(3);
    expect(
      document.querySelector('[data-fp="story-narrative"]')?.textContent,
    ).toContain("Write total = 888");
    expect(document.querySelector('[data-fp="story-unavailable"]')).toBeNull();
  });
  it("uses this run's recorded Story when the external companion is unchanged", () => {
    const ui = setup();
    ui.drill("pipeline/prepare");
    move(3);
    fireEvent.click(screen.getByText("Story"));
    const source = JSON.parse(
      JSON.stringify(ui.run.runtimeSnapshot).replace(/44/g, "888"),
    );
    source.runId = "record-owned-story";
    const entries = JSON.parse(
      JSON.stringify(ui.run.narrativeEntries).replace(/44/g, "888"),
    );
    source.recorders = [
      { id: "recorded-story", name: "Narrative", data: { entries } },
    ];
    ui.replace(source);
    move(3);
    expect(
      document.querySelector('[data-fp="story-narrative"]')?.textContent,
    ).toContain("Write total = 888");
    expect(document.querySelector('[data-fp="story-unavailable"]')).toBeNull();
  });
  it("does not turn a missing root tree node into an origin when children recorded reads", () => {
    const childSource = structuredClone(recordings.nested.runtimeSnapshot);
    render(
      React.createElement(ExplainableShell, {
        snapshots: [
          {
            stageName: "Missing root",
            stageLabel: "Missing root",
            runtimeStageId: "missing-root#0",
            memory: { x: 7 },
            narrative: "",
            startMs: 0,
            durationMs: 1,
          },
        ],
        runtimeSnapshot: {
          sharedState: { x: 7 },
          commitLog: [
            {
              stage: "Missing root",
              stageId: "missing-root",
              runtimeStageId: "missing-root#0",
              trace: [{ path: "x" }],
            },
          ],
          executionTree: {},
          subflowResults: childSource.subflowResults,
        },
      }),
    );
    fireEvent.click(screen.getByText("Inspector"));
    fireEvent.click(screen.getByText("Data Trace"));
    const chip = document.querySelector('[data-fp="trace-any-chip"]');
    if (chip) fireEvent.click(chip);
    expect(document.body.textContent).not.toContain("this is an origin");
  });
  it("continues a direct nested drill after choosing an ambiguous ancestor visit", () => {
    const ui = setup("nestedLoop", false);
    ui.click("pipeline/prepare");
    expect(screen.getByText(/This step ran 2 times/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /visit 2 of 2/ }));
    expect(
      screen.queryByRole("group", { name: "Choose subflow visit" }),
    ).toBeNull();
    expect(screen.getByText(/pipeline · visit 2 of 2/)).toBeTruthy();
    ui.inspector();
    move(3);
    trace("total");
    expect(card().textContent).toContain("= 404");
  });
});
