/** @vitest-environment jsdom */
/**
 * `theme="light"` — the one-word switch on the components people mount alone.
 *
 * Every `--fp-*` fallback in this library is DARK, so a panel dropped into a
 * light app renders dark and the only fix was a wall of CSS variables. The
 * coarse switch existed on `<ExplainableShell traceTheme={{mode}}>` and
 * nowhere else.
 *
 * OLD BEHAVIOUR: `theme` is not a prop on any of these — the root element
 * carries no `--fp-*` variables at all, whatever you pass.
 */
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, waitFor } from "@testing-library/react";
import * as React from "react";

import { GanttTimeline } from "../../src/components/GanttTimeline";
import { SnapshotPanel } from "../../src/components/SnapshotPanel";
import { TracedFlow } from "../../src/components/FlowchartView/TracedFlow";
import { TraceViewer } from "../../src/components/TraceViewer/TraceViewer";
import { coolLight, coolDark } from "../../src/theme/presets";
import type { StageSnapshot } from "../../src/types";
import type { TraceGraph } from "../../src/components/FlowchartView/traceStructureRecorder";

const SNAPSHOTS: StageSnapshot[] = [
  { stageName: "alpha", stageLabel: "Alpha", memory: {}, narrative: "", startMs: 0, durationMs: 4 },
  { stageName: "beta", stageLabel: "Beta", memory: {}, narrative: "", startMs: 4, durationMs: 6 },
];

const GRAPH: TraceGraph = {
  nodes: [{ id: "alpha", type: "stage", position: { x: 0, y: 0 }, data: { label: "Alpha", prevIds: [], nextIds: [] } }],
  edges: [],
} as unknown as TraceGraph;

const LIGHT_BG = coolLight.colors!.bgPrimary!;
const DARK_BG = coolDark.colors!.bgPrimary!;

/** The root element a component stamps its variables on. */
function root(container: HTMLElement, fp: string): HTMLElement {
  const el = container.querySelector<HTMLElement>(`[data-fp="${fp}"]`);
  expect(el, `${fp} rendered`).toBeTruthy();
  return el!;
}

afterEach(cleanup);

describe("the one-word theme switch", () => {
  it("<GanttTimeline theme='light'> carries the light palette", () => {
    const { container } = render(
      React.createElement(GanttTimeline, { snapshots: SNAPSHOTS, theme: "light" }),
    );
    expect(root(container, "gantt-timeline").style.getPropertyValue("--fp-bg-primary")).toBe(LIGHT_BG);
  });

  it("<GanttTimeline theme='dark'> carries the dark palette", () => {
    const { container } = render(
      React.createElement(GanttTimeline, { snapshots: SNAPSHOTS, theme: "dark" }),
    );
    expect(root(container, "gantt-timeline").style.getPropertyValue("--fp-bg-primary")).toBe(DARK_BG);
  });

  it("<SnapshotPanel theme='light'> carries it too — including its empty state", () => {
    const { container } = render(
      React.createElement(SnapshotPanel, { snapshots: SNAPSHOTS, theme: "light" }),
    );
    expect(root(container, "snapshot-panel").style.getPropertyValue("--fp-text-primary")).toBe(
      coolLight.colors!.textPrimary!,
    );
    cleanup();
    const empty = render(React.createElement(SnapshotPanel, { snapshots: [], theme: "light" }));
    expect(root(empty.container, "snapshot-panel").style.getPropertyValue("--fp-bg-primary")).toBe(
      LIGHT_BG,
    );
  });

  it("<TracedFlow theme='light'> themes the chart it draws", async () => {
    const { container } = render(React.createElement(TracedFlow, { graph: GRAPH, theme: "light" }));
    await waitFor(() => expect(container.querySelectorAll(".react-flow__node").length).toBe(1));
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.getPropertyValue("--fp-node-visited")).toBe(coolLight.colors!.nodeVisited!);
  });

  it("<TraceViewer theme='light'> re-themes the whole viewer", async () => {
    const recording = {
      snapshot: {
        sharedState: {},
        commitLog: [],
        executionTree: {
          id: "alpha",
          name: "Alpha",
          runtimeStageId: "alpha#0",
          logs: {},
          errors: {},
          metrics: {},
          evals: {},
        },
      },
    };
    const { container } = render(
      React.createElement(TraceViewer, { recording: recording as never, theme: "light" }),
    );
    await waitFor(() =>
      expect(root(container, "explainable-shell").style.getPropertyValue("--fp-bg-primary")).toBe(
        LIGHT_BG,
      ),
    );
  });

  it("omitting the prop changes nothing — unthemed components stay as they were", () => {
    const { container } = render(React.createElement(GanttTimeline, { snapshots: SNAPSHOTS }));
    expect(root(container, "gantt-timeline").style.getPropertyValue("--fp-bg-primary")).toBe("");
  });
});
