/** @vitest-environment jsdom */
import { fireEvent, render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ExplainableShell } from "../../src/components/ExplainableShell/ExplainableShell";
import { ExplainableProvider, useExplainableRun, type ExplainableRecording } from "../../src/components/ExplainableView/ExplainableContext";
import type { StageSnapshot } from "../../src/types";

const snapshots: StageSnapshot[] = ["seed", "sum"].map((stage, index) => ({
  stageName: stage, stageLabel: stage, runtimeStageId: `${stage}#${index}`,
  memory: { count: index }, narrative: stage, startMs: index, durationMs: 1,
}));

function recording(runId: string, start: number): ExplainableRecording {
  const snapshot = {
      runId, sharedState: { count: start + 1 },
      executionTree: { id: "seed", name: "seed", runtimeStageId: "seed#0", next: { id: "sum", name: "sum", runtimeStageId: "sum#1" } },
      commitLog: ["seed", "sum"].map((stage, index) => ({
        idx: index, stage, stageId: stage, runtimeStageId: `${stage}#${index}`,
        overwrite: { count: start + index }, updates: {}, trace: [{ path: "count", verb: "set" }],
      })),
  };
  return { snapshot };
}

function StateProbe({ name }: { name: string }) {
  const run = useExplainableRun();
  return <>
    <output data-testid={`${name}-state`}>{`${run.selectedIndex}:${run.selectedSnapshot?.memory.count}`}</output>
    <button type="button" onClick={() => run.selectIndex(1)}>{`Advance ${name}`}</button>
  </>;
}

describe("presentation and viewer ownership contracts", () => {
  it("calls a host chart renderer only when its chart surface is shown", () => {
    const chart = vi.fn(() => <div data-testid="host-chart">Chart</div>);
    const view = render(<ExplainableShell snapshots={[]} renderFlowchart={chart} unstyled defaultTab="result" />);
    expect(chart).not.toHaveBeenCalled();
    view.rerender(<ExplainableShell snapshots={snapshots} renderFlowchart={chart} unstyled defaultTab="result" />);
    expect(chart).not.toHaveBeenCalled();
    fireEvent.click(view.getByRole("button", { name: "Explainable" }));
    expect(view.getByTestId("host-chart")).toBeTruthy();
    fireEvent.click(view.getByRole("button", { name: "Next stage" }));
    expect(chart).toHaveBeenLastCalledWith(expect.objectContaining({ selectedIndex: 1, snapshots }));
    chart.mockClear();
    fireEvent.click(view.getByRole("button", { name: "Result" }));
    expect(view.queryByTestId("host-chart")).toBeNull();
    expect(chart).not.toHaveBeenCalled();
  });

  it("keeps simultaneously mounted viewer cursors and recordings independent", () => {
    const first = recording("first", 10), second = recording("second", 100);
    const view = render(<>
      <ExplainableProvider recording={first}><StateProbe name="first" /></ExplainableProvider>
      <ExplainableProvider recording={second}><StateProbe name="second" /></ExplainableProvider>
    </>);
    expect(view.getByTestId("first-state").textContent).toBe("0:10");
    expect(view.getByTestId("second-state").textContent).toBe("0:100");
    fireEvent.click(view.getByRole("button", { name: "Advance first" }));
    expect(view.getByTestId("first-state").textContent).toBe("1:11");
    expect(view.getByTestId("second-state").textContent).toBe("0:100");
  });

  it("reports controlled cursor intent without taking ownership from the host", () => {
    const input = recording("controlled", 20), change = vi.fn();
    const view = render(<ExplainableProvider recording={input} selectedIndex={0} onSelectedIndexChange={change}><StateProbe name="controlled" /></ExplainableProvider>);
    fireEvent.click(view.getByRole("button", { name: "Advance controlled" }));
    expect(change).toHaveBeenCalledExactlyOnceWith(1);
    expect(view.getByTestId("controlled-state").textContent).toBe("0:20");
    view.rerender(<ExplainableProvider recording={input} selectedIndex={1} onSelectedIndexChange={change}><StateProbe name="controlled" /></ExplainableProvider>);
    expect(view.getByTestId("controlled-state").textContent).toBe("1:21");
  });

  it("renders each provider's initial cursor and recording during server rendering", () => {
    const html = renderToString(<>
      <ExplainableProvider recording={recording("server-first", 30)} defaultSelectedIndex={1}><StateProbe name="server-first" /></ExplainableProvider>
      <ExplainableProvider recording={recording("server-second", 200)}><StateProbe name="server-second" /></ExplainableProvider>
    </>);
    expect(html).toContain('data-testid="server-first-state">1:31');
    expect(html).toContain('data-testid="server-second-state">0:200');
  });
});
