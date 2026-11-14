/** @vitest-environment jsdom */
import * as React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ExplainableShell, type ExplainableShellProps } from "../../src/components/ExplainableShell/ExplainableShell";
import type { TraceGraph } from "../../src/components/FlowchartView/traceStructureRecorder";
import type { TraceWorkflowOverlay } from "../../src/trace/traceWorkflowOverlay";
import type { StageSnapshot } from "../../src/types";

const renderDefaultChart = vi.hoisted(() => vi.fn());
vi.mock("../../src/components/FlowchartView/TracedFlow", () => ({
  TracedFlow: (props: unknown) => { renderDefaultChart(props); return null; },
}));

const stages = [
  { id: "seed", writes: ["items", "rate"], reads: [] },
  { id: "sum", writes: ["subtotal"], reads: ["items"] },
  { id: "audit", writes: ["auditNote"], reads: ["subtotal"] },
  { id: "tax", writes: ["tax"], reads: ["subtotal", "rate"] },
  { id: "total", writes: ["total"], reads: ["subtotal", "tax"] },
];
const snapshots: StageSnapshot[] = stages.map((stage, index) => ({
  runtimeStageId: `${stage.id}#${index}`, stageName: stage.id, stageLabel: stage.id,
  memory: { items: [1, 2], rate: 0.2, subtotal: index === 1 ? 10 : 99, tax: 2, total: 12 },
  narrative: "", startMs: index, durationMs: 1,
}));
const log = stages.map((stage, index) => ({
  runtimeStageId: `${stage.id}#${index}`, stageId: stage.id, stage: stage.id,
  trace: stage.writes.map(path => ({ path })),
}));
let tree: Record<string, unknown> | undefined;
for (let index = stages.length - 1; index >= 0; index--) {
  const stage = stages[index];
  tree = { runtimeStageId: `${stage.id}#${index}`,
    stageReads: Object.fromEntries(stage.reads.map(key => [key, true])), ...(tree ? { next: tree } : {}) };
}
const runtimeSnapshot = { runId: "workflow-overlay", sharedState: {}, commitLog: log, executionTree: tree, subflowResults: {} };
const graph: TraceGraph = {
  nodes: stages.map(stage => ({ id: stage.id, type: "stage", position: { x: 0, y: 0 }, data: {
    label: stage.id, isDecider: false, isFork: false, isSubflow: false, isStreaming: false, prevIds: [], nextIds: [],
  } })),
  edges: [],
};
type ChartProps = Parameters<NonNullable<ExplainableShellProps["renderFlowchart"]>>[0];

function startTracing() {
  for (let index = 1; index < stages.length; index++) fireEvent.click(screen.getByLabelText("Next stage"));
  fireEvent.click(screen.getByText("Inspector"));
  fireEvent.click(screen.getByText("Data Trace"));
  const total = [...document.querySelectorAll('[data-fp="trace-any-chip"]')].find(chip => chip.textContent === "total");
  expect(total).toBeTruthy();
  fireEvent.click(total!);
}

describe("Shell workflow trace forwarding", () => {
  it("forwards the same selected investigation to a custom chart in styled and unstyled surfaces", () => {
    let chart: ChartProps | undefined;
    const props: ExplainableShellProps = { runtimeSnapshot, snapshots,
      renderFlowchart: value => { chart = value; return <div>Custom workflow</div>; } };
    const ui = render(<ExplainableShell {...props} unstyled />);
    fireEvent.click(screen.getByRole("button", { name: "Explainable" }));
    expect(chart?.traceWorkflow).toBeNull();
    ui.rerender(<ExplainableShell {...props} />);
    startTracing();
    expect(chart?.traceWorkflow?.questionKey).toBe("total");
    expect(chart?.traceWorkflow?.focusRuntimeStageId).toBe("total#4");
    expect(chart?.traceWorkflow?.stages.map(stage => stage.runtimeStageId)).not.toContain("audit#2");
    expect(chart?.traceWorkflow?.stages.find(stage => stage.runtimeStageId === "sum#1")?.values)
      .toContainEqual(expect.objectContaining({ key: "subtotal", preview: "10" }));
    expect(chart?.traceWorkflow?.reads).toContainEqual(expect.objectContaining({
      key: "subtotal", sourceRuntimeStageId: "sum#1", targetRuntimeStageId: "total#4",
    }));

    fireEvent.click(screen.getByLabelText("Earlier recorded step"));
    expect(chart?.traceWorkflow?.focusRuntimeStageId).toBe("tax#3");
    const current = chart?.traceWorkflow;
    ui.rerender(<ExplainableShell {...props} unstyled />);
    expect(screen.getByText("Custom workflow")).toBeTruthy();
    expect(chart?.traceWorkflow).toBe(current);
    fireEvent.click(within(screen.getByRole("toolbar")).getByLabelText("Exit tracing"));
    expect(chart?.traceWorkflow).toBeNull();
  });

  it("passes the overlay through the default chart renderer and clears it on exit", () => {
    renderDefaultChart.mockClear();
    render(<ExplainableShell runtimeSnapshot={runtimeSnapshot} snapshots={snapshots} traceGraph={graph} />);
    const overlay = () => (renderDefaultChart.mock.lastCall?.[0] as { traceWorkflow?: TraceWorkflowOverlay | null })?.traceWorkflow;
    expect(overlay()).toBeNull();
    startTracing();
    expect(overlay()?.questionKey).toBe("total");
    expect(overlay()?.focusRuntimeStageId).toBe("total#4");
    fireEvent.click(within(screen.getByRole("toolbar")).getByLabelText("Exit tracing"));
    expect(overlay()).toBeNull();
  });
});
