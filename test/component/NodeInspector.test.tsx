/** @vitest-environment jsdom */
/**
 * L8.1 — `<NodeInspector>` minimum coverage per Panel 7 must-fix.
 *
 * Demo renderer, but still shipped library surface. Three scenarios:
 *   - null selectedId → placeholder ("Select a stage to inspect.")
 *   - valid stage → renders identity + neighbor chains
 *   - unknown stageId → falls back to placeholder (no crash)
 *   - onNavigate click — receives the clicked stageId
 */

import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { NodeInspector } from "../../src/components/FlowchartView/NodeInspector";
import { createNodeViewRecorder } from "../../src/components/FlowchartView/createNodeViewRecorder";
import { createTraceStructureRecorder } from "../../src/components/FlowchartView/traceStructureRecorder";
import { asStageId } from "../../src/components/FlowchartView/_internal/keys";

const spec = (id: string, name: string) => ({ id, name, type: "stage" as const });

function linearFixture() {
  const trace = createTraceStructureRecorder();
  const r = trace.recorder;
  r.onStageAdded!({ stageId: "a", name: "Alpha", type: "stage", spec: spec("a", "Alpha") });
  r.onStageAdded!({ stageId: "b", name: "Beta", type: "stage", spec: spec("b", "Beta") });
  r.onEdgeAdded!({ from: "a", to: "b", kind: "next" });
  r.onStageAdded!({ stageId: "c", name: "Gamma", type: "stage", spec: spec("c", "Gamma") });
  r.onEdgeAdded!({ from: "b", to: "c", kind: "next" });
  return trace;
}

describe("<NodeInspector>", () => {
  it("renders placeholder when selectedId is null", () => {
    const trace = linearFixture();
    const nv = createNodeViewRecorder({ structure: trace });
    const { getByText } = render(<NodeInspector index={nv.getIndex()} selectedId={null} />);
    expect(getByText(/Select a stage to inspect/i)).toBeTruthy();
  });

  it("renders placeholder when selectedId is unknown (no crash)", () => {
    const trace = linearFixture();
    const nv = createNodeViewRecorder({ structure: trace });
    const { getByText } = render(
      <NodeInspector index={nv.getIndex()} selectedId={asStageId("ghost")} />,
    );
    expect(getByText(/Select a stage to inspect/i)).toBeTruthy();
  });

  it("renders identity (label + stageId + type) for a valid stage", () => {
    const trace = linearFixture();
    const nv = createNodeViewRecorder({ structure: trace });
    const { container } = render(
      <NodeInspector index={nv.getIndex()} selectedId={asStageId("b")} />,
    );
    expect(container.textContent).toContain("Beta");
    expect(container.textContent).toContain("b");
    expect(container.textContent).toContain("stage");
  });

  it("shows 'Visited: no' for a stage with no executions", () => {
    const trace = linearFixture();
    const nv = createNodeViewRecorder({ structure: trace });
    const { container } = render(
      <NodeInspector index={nv.getIndex()} selectedId={asStageId("a")} />,
    );
    expect(container.textContent).toMatch(/Visited.*no/i);
  });

  it("shows execution count + duration when stage has executions", () => {
    const trace = linearFixture();
    const nv = createNodeViewRecorder({ structure: trace });
    nv.recorder.onStageExecuted!({
      stageName: "Beta",
      traversalContext: { runtimeStageId: "b#1", iteration: 0 },
      startTime: 100,
      endTime: 150,
    });
    const { container } = render(
      <NodeInspector index={nv.getIndex()} selectedId={asStageId("b")} />,
    );
    expect(container.textContent).toMatch(/Visited.*yes/i);
    expect(container.textContent).toContain("Executions");
    expect(container.textContent).toContain("1");
    expect(container.textContent).toContain("50"); // 50ms duration
  });

  it("onNavigate fires with the clicked stageId from breadcrumb", () => {
    const trace = linearFixture();
    const nv = createNodeViewRecorder({ structure: trace });
    const onNavigate = vi.fn();
    // Inspect 'c' — should show prev chain [a, b] as clickable crumbs.
    const { getByText } = render(
      <NodeInspector
        index={nv.getIndex()}
        selectedId={asStageId("c")}
        onNavigate={onNavigate}
      />,
    );
    // 'Alpha' is in the prev chain as a breadcrumb.
    const alpha = getByText("Alpha");
    fireEvent.click(alpha);
    expect(onNavigate).toHaveBeenCalledWith("a");
  });
});
