/** @vitest-environment jsdom */
/**
 * L8.2 — `<CommitInspector>` minimum coverage. Mirrors NodeInspector
 * tests for parity per L8.2 Panel 7 must-fix.
 *
 * Scenarios:
 *   - null selectedRuntimeStageId → placeholder
 *   - unknown rsid → placeholder (no crash)
 *   - valid commit → renders identity + structural neighbors
 *   - data dependencies render (resolved + null source)
 *   - lineage chain (backtraceDataFlow result) renders
 *   - onNavigate fires with the clicked runtimeStageId
 */

import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { CommitInspector } from "../../src/components/FlowchartView/CommitInspector";
import { createCommitFlowRecorder } from "../../src/components/FlowchartView/createCommitFlowRecorder";
import { createTraceStructureRecorder } from "../../src/components/FlowchartView/traceStructureRecorder";
import { asRuntimeStageId } from "../../src/components/FlowchartView/_internal/keys";

const spec = (id: string, name: string) => ({ id, name, type: "stage" as const });

function forkFixture() {
  const trace = createTraceStructureRecorder();
  const r = trace.recorder;
  r.onStageAdded!({ stageId: "LoadOrder", name: "LoadOrder", type: "stage", spec: spec("LoadOrder", "LoadOrder") });
  r.onStageAdded!({ stageId: "CheckInventory", name: "CheckInventory", type: "stage", spec: spec("CheckInventory", "CheckInventory") });
  r.onEdgeAdded!({ from: "LoadOrder", to: "CheckInventory", kind: "fork-branch" });
  r.onStageAdded!({ stageId: "RunFraudCheck", name: "RunFraudCheck", type: "stage", spec: spec("RunFraudCheck", "RunFraudCheck") });
  r.onEdgeAdded!({ from: "LoadOrder", to: "RunFraudCheck", kind: "fork-branch" });
  r.onStageAdded!({ stageId: "FinalizeOrder", name: "FinalizeOrder", type: "stage", spec: spec("FinalizeOrder", "FinalizeOrder") });
  r.onEdgeAdded!({ from: "CheckInventory", to: "FinalizeOrder", kind: "next" });
  r.onEdgeAdded!({ from: "RunFraudCheck", to: "FinalizeOrder", kind: "next" });
  return trace;
}

function commitFlowWithFork() {
  const trace = forkFixture();
  const cf = createCommitFlowRecorder({ structure: trace });
  const fire = (rsid: string, updates: Record<string, unknown> = {}, reads: string[] = []) =>
    cf.recorder.onCommit!({
      stage: rsid.split("#")[0],
      runtimeStageId: rsid,
      updates,
      reads,
    });
  fire("LoadOrder#0", { order: "ORD-001" });
  fire("CheckInventory#1", { inStock: true }, ["order"]);
  fire("RunFraudCheck#2", { fraudCleared: true }, ["order"]);
  fire("FinalizeOrder#3", { orderStatus: "confirmed" }, ["inStock", "fraudCleared", "mystery"]);
  return cf;
}

describe("<CommitInspector>", () => {
  it("renders placeholder when selectedRuntimeStageId is null", () => {
    const cf = commitFlowWithFork();
    const { getByText } = render(
      <CommitInspector index={cf.getIndex()} selectedRuntimeStageId={null} />,
    );
    expect(getByText(/Select a commit to inspect/i)).toBeTruthy();
  });

  it("renders placeholder when selectedRuntimeStageId is unknown (no crash)", () => {
    const cf = commitFlowWithFork();
    const { getByText } = render(
      <CommitInspector
        index={cf.getIndex()}
        selectedRuntimeStageId={asRuntimeStageId("ghost#99")}
      />,
    );
    expect(getByText(/Select a commit to inspect/i)).toBeTruthy();
  });

  it("renders identity (stageId + runtimeStageId + commitIdx) for a valid commit", () => {
    const cf = commitFlowWithFork();
    const { container } = render(
      <CommitInspector
        index={cf.getIndex()}
        selectedRuntimeStageId={asRuntimeStageId("FinalizeOrder#3")}
      />,
    );
    expect(container.textContent).toContain("FinalizeOrder");
    expect(container.textContent).toContain("FinalizeOrder#3");
    expect(container.textContent).toContain("commitIdx 3");
  });

  it("renders structural prev neighbors", () => {
    const cf = commitFlowWithFork();
    const { container } = render(
      <CommitInspector
        index={cf.getIndex()}
        selectedRuntimeStageId={asRuntimeStageId("FinalizeOrder#3")}
      />,
    );
    expect(container.textContent).toContain("Structural prev");
    expect(container.textContent).toContain("CheckInventory");
    expect(container.textContent).toContain("RunFraudCheck");
  });

  it("renders runtime prev (clickable refs) for a fork-merge commit", () => {
    const cf = commitFlowWithFork();
    const { container } = render(
      <CommitInspector
        index={cf.getIndex()}
        selectedRuntimeStageId={asRuntimeStageId("FinalizeOrder#3")}
      />,
    );
    expect(container.textContent).toContain("Runtime prev");
    expect(container.textContent).toContain("CheckInventory#1");
    expect(container.textContent).toContain("RunFraudCheck#2");
  });

  it("renders data dependencies including resolved source AND missing-source fallback", () => {
    const cf = commitFlowWithFork();
    const { container } = render(
      <CommitInspector
        index={cf.getIndex()}
        selectedRuntimeStageId={asRuntimeStageId("FinalizeOrder#3")}
      />,
    );
    expect(container.textContent).toContain("Data dependencies");
    // Resolved deps
    expect(container.textContent).toContain("inStock");
    expect(container.textContent).toContain("fraudCleared");
    // 'mystery' was read but never written → fallback rendered.
    expect(container.textContent).toContain("mystery");
    expect(container.textContent).toContain("no prior writer");
  });

  it("renders the lineage chain when ancestry exists", () => {
    const cf = commitFlowWithFork();
    const { container } = render(
      <CommitInspector
        index={cf.getIndex()}
        selectedRuntimeStageId={asRuntimeStageId("FinalizeOrder#3")}
      />,
    );
    expect(container.textContent).toContain("Lineage chain");
    expect(container.textContent).toContain("LoadOrder#0");
  });

  it("onNavigate fires with the clicked runtimeStageId from a runtime-prev button", () => {
    const cf = commitFlowWithFork();
    const onNavigate = vi.fn();
    const { getAllByText } = render(
      <CommitInspector
        index={cf.getIndex()}
        selectedRuntimeStageId={asRuntimeStageId("FinalizeOrder#3")}
        onNavigate={onNavigate}
      />,
    );
    // The runtimeStageId 'CheckInventory#1' appears in multiple
    // sections (runtime-prev, data-dep source, lineage chain) — they
    // ALL navigate to the same target. Verify at least one fires.
    const allMatches = getAllByText("CheckInventory#1");
    expect(allMatches.length).toBeGreaterThan(0);
    fireEvent.click(allMatches[0]!);
    expect(onNavigate).toHaveBeenCalledWith("CheckInventory#1");
  });
});
