/** @vitest-environment jsdom */
/**
 * L8.3 — `<CommitChainView>` minimum coverage. Mirrors NodeInspector
 * and CommitInspector component tests for parity per L8.x panel rules.
 *
 * Scenarios:
 *   - null chain → placeholder
 *   - linear chain → all stage labels rendered in order
 *   - fork chain → branch stage labels rendered (parallel block)
 *   - loop → one leaf with "iter N/M" badge AND N clickable boxes
 *   - empty leaf (never executed) → "not executed" placeholder
 *   - onSelectCommit fires with the clicked runtimeStageId
 *   - selectedRuntimeStageId highlight applies
 *   - resolveLabel maps stageId → friendly label
 */

import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { CommitChainView } from "../../src/components/FlowchartView/CommitChainView";
import {
  buildCommitChainTree,
  structureAsChainTree,
  type CommitChain,
} from "../../src/components/FlowchartView/buildCommitChainTree";
import { createTraceStructureRecorder } from "../../src/components/FlowchartView/traceStructureRecorder";
import { createCommitFlowRecorder } from "../../src/components/FlowchartView/createCommitFlowRecorder";
import { asStageId, asRuntimeStageId } from "../../src/components/FlowchartView/_internal/keys";

const spec = (id: string, name: string) => ({ id, name, type: "stage" as const });

function linearWithCommits(stages: string[]) {
  const trace = createTraceStructureRecorder();
  const r = trace.recorder;
  for (const s of stages) {
    r.onStageAdded!({ stageId: s, name: s, type: "stage", spec: spec(s, s) });
  }
  for (let i = 0; i < stages.length - 1; i++) {
    r.onEdgeAdded!({ from: stages[i]!, to: stages[i + 1]!, kind: "next" });
  }
  const cf = createCommitFlowRecorder({ structure: trace });
  for (let i = 0; i < stages.length; i++) {
    cf.recorder.onCommit!({
      stage: stages[i]!,
      runtimeStageId: `${stages[i]}#${i}`,
      updates: {},
      reads: [],
    });
  }
  return buildCommitChainTree(trace.getGraph(), cf.getIndex());
}

function forkWithCommits() {
  const trace = createTraceStructureRecorder();
  const r = trace.recorder;
  for (const id of ["LoadOrder", "CheckInventory", "RunFraudCheck", "FinalizeOrder"]) {
    r.onStageAdded!({ stageId: id, name: id, type: "stage", spec: spec(id, id) });
  }
  r.onEdgeAdded!({ from: "LoadOrder", to: "CheckInventory", kind: "fork-branch" });
  r.onEdgeAdded!({ from: "LoadOrder", to: "RunFraudCheck", kind: "fork-branch" });
  r.onEdgeAdded!({ from: "CheckInventory", to: "FinalizeOrder", kind: "next" });
  r.onEdgeAdded!({ from: "RunFraudCheck", to: "FinalizeOrder", kind: "next" });
  const cf = createCommitFlowRecorder({ structure: trace });
  const fire = (rsid: string, updates: Record<string, unknown> = {}, reads: string[] = []) =>
    cf.recorder.onCommit!({
      stage: rsid.split("#")[0],
      runtimeStageId: rsid,
      updates,
      reads,
    });
  fire("LoadOrder#0", { order: "X" });
  fire("CheckInventory#1", { inStock: true }, ["order"]);
  fire("RunFraudCheck#2", { fraudCleared: true }, ["order"]);
  fire("FinalizeOrder#3", { status: "ok" }, ["inStock", "fraudCleared"]);
  return buildCommitChainTree(trace.getGraph(), cf.getIndex());
}

function loopWithCommits() {
  const trace = createTraceStructureRecorder();
  const r = trace.recorder;
  for (const id of ["Seed", "Body", "Exit"]) {
    r.onStageAdded!({ stageId: id, name: id, type: "stage", spec: spec(id, id) });
  }
  r.onEdgeAdded!({ from: "Seed", to: "Body", kind: "next" });
  r.onLoopEdgeAdded!({ from: "Body", to: "Body" });
  r.onEdgeAdded!({ from: "Body", to: "Exit", kind: "next" });
  const cf = createCommitFlowRecorder({ structure: trace });
  const fire = (rsid: string) =>
    cf.recorder.onCommit!({ stage: rsid.split("#")[0], runtimeStageId: rsid, updates: {}, reads: [] });
  fire("Seed#0");
  fire("Body#1");
  fire("Body#2");
  fire("Body#3");
  fire("Exit#4");
  return buildCommitChainTree(trace.getGraph(), cf.getIndex());
}

describe("<CommitChainView>", () => {
  it("renders placeholder when chain is null", () => {
    const { getByText } = render(<CommitChainView chain={null} />);
    expect(getByText(/No chain to display/i)).toBeTruthy();
  });

  it("renders all stage labels for a linear chain in order", () => {
    const chain = linearWithCommits(["Alpha", "Beta", "Gamma"]);
    const { container } = render(<CommitChainView chain={chain} />);
    const text = container.textContent ?? "";
    expect(text).toContain("Alpha");
    expect(text).toContain("Beta");
    expect(text).toContain("Gamma");
    // Order check via string indices.
    expect(text.indexOf("Alpha")).toBeLessThan(text.indexOf("Beta"));
    expect(text.indexOf("Beta")).toBeLessThan(text.indexOf("Gamma"));
  });

  it("renders all branch stage labels for a fork chain", () => {
    const chain = forkWithCommits();
    const { container } = render(<CommitChainView chain={chain} />);
    const text = container.textContent ?? "";
    expect(text).toContain("LoadOrder");
    expect(text).toContain("CheckInventory");
    expect(text).toContain("RunFraudCheck");
    expect(text).toContain("FinalizeOrder");
  });

  it("LOOP — renders N boxes for N iterations with iter badge", () => {
    const chain = loopWithCommits();
    const { container, getAllByText } = render(<CommitChainView chain={chain} />);
    const text = container.textContent ?? "";
    // 3 Body iterations → 3 "iter k/3" badges.
    expect(text).toContain("iter 1/3");
    expect(text).toContain("iter 2/3");
    expect(text).toContain("iter 3/3");
    // Three distinct Body buttons rendered (one per iteration).
    const bodyButtons = container.querySelectorAll("button");
    // Includes Seed + 3×Body + Exit = 5 buttons.
    expect(bodyButtons.length).toBeGreaterThanOrEqual(5);
  });

  it("renders 'not executed' placeholder for leaves with empty commits[]", () => {
    // Linear chain A→B but only A fires.
    const trace = createTraceStructureRecorder();
    const r = trace.recorder;
    r.onStageAdded!({ stageId: "A", name: "A", type: "stage", spec: spec("A", "A") });
    r.onStageAdded!({ stageId: "B", name: "B", type: "stage", spec: spec("B", "B") });
    r.onEdgeAdded!({ from: "A", to: "B", kind: "next" });
    const cf = createCommitFlowRecorder({ structure: trace });
    cf.recorder.onCommit!({ stage: "A", runtimeStageId: "A#0", updates: {}, reads: [] });

    const chain = buildCommitChainTree(trace.getGraph(), cf.getIndex());
    const { container } = render(<CommitChainView chain={chain} />);
    expect(container.textContent).toContain("not executed");
  });

  it("onSelectCommit fires with the runtimeStageId of the clicked commit", () => {
    const chain = linearWithCommits(["A", "B", "C"]);
    const onSelectCommit = vi.fn();
    const { container } = render(
      <CommitChainView chain={chain} onSelectCommit={onSelectCommit} />,
    );
    // Click the first commit button.
    const buttons = container.querySelectorAll("button");
    expect(buttons.length).toBeGreaterThan(0);
    fireEvent.click(buttons[0]!);
    expect(onSelectCommit).toHaveBeenCalledTimes(1);
    // First commit is A#0.
    expect(onSelectCommit).toHaveBeenCalledWith("A#0");
  });

  it("selectedRuntimeStageId applies the highlight to the matching commit", () => {
    const chain = linearWithCommits(["A", "B"]);
    const { container } = render(
      <CommitChainView
        chain={chain}
        selectedRuntimeStageId={asRuntimeStageId("B#1")}
        onSelectCommit={() => {}}
      />,
    );
    // Find buttons; the one for B#1 should have a thicker green-ish border.
    const buttons = Array.from(container.querySelectorAll("button"));
    const bButton = buttons.find((b) => b.getAttribute("title") === "B#1");
    expect(bButton).toBeTruthy();
    // The border-width style switches to 2 when selected.
    expect((bButton as HTMLElement).style.borderWidth).toBe("2px");
  });

  it("accepts StructureChain (pre-execution) — every leaf renders as 'not executed'", () => {
    // Build a structure WITHOUT any commits.
    const trace = createTraceStructureRecorder();
    const r = trace.recorder;
    for (const id of ["Plan", "Run", "Report"]) {
      r.onStageAdded!({ stageId: id, name: id, type: "stage", spec: spec(id, id) });
    }
    r.onEdgeAdded!({ from: "Plan", to: "Run", kind: "next" });
    r.onEdgeAdded!({ from: "Run", to: "Report", kind: "next" });
    const sChain = structureAsChainTree(trace.getGraph());
    const { container } = render(<CommitChainView chain={sChain} />);
    const text = container.textContent ?? "";
    expect(text).toContain("Plan");
    expect(text).toContain("Run");
    expect(text).toContain("Report");
    // All three should render the "not executed" placeholder.
    const notExecuted = (text.match(/not executed/g) ?? []).length;
    expect(notExecuted).toBe(3);
  });

  it("re-rendering with mutated chain preserves selection (stable keys)", () => {
    // First render: A → B → C, B selected.
    const cf1 = linearWithCommits(["A", "B", "C"]);
    const { rerender, container } = render(
      <CommitChainView
        chain={cf1}
        selectedRuntimeStageId={asRuntimeStageId("B#1")}
        onSelectCommit={() => {}}
      />,
    );
    // Second render: same chart, more commits (A→B→C, but B now has 2 commits).
    // Stable keys on serial.items mean B's leaf component re-uses, doesn't
    // get a fresh mount with stale selection.
    const trace = createTraceStructureRecorder();
    const r = trace.recorder;
    for (const s of ["A", "B", "C"]) {
      r.onStageAdded!({ stageId: s, name: s, type: "stage", spec: spec(s, s) });
    }
    r.onEdgeAdded!({ from: "A", to: "B", kind: "next" });
    r.onEdgeAdded!({ from: "B", to: "C", kind: "next" });
    const cf = createCommitFlowRecorder({ structure: trace });
    cf.recorder.onCommit!({ stage: "A", runtimeStageId: "A#0", updates: {}, reads: [] });
    cf.recorder.onCommit!({ stage: "B", runtimeStageId: "B#1", updates: {}, reads: [] });
    cf.recorder.onCommit!({ stage: "B", runtimeStageId: "B#2", updates: {}, reads: [] });
    cf.recorder.onCommit!({ stage: "C", runtimeStageId: "C#3", updates: {}, reads: [] });
    const cf2 = buildCommitChainTree(trace.getGraph(), cf.getIndex());
    rerender(
      <CommitChainView
        chain={cf2}
        selectedRuntimeStageId={asRuntimeStageId("B#1")}
        onSelectCommit={() => {}}
      />,
    );
    // Selection on B#1 must still be applied after rerender.
    const buttons = Array.from(container.querySelectorAll("button"));
    const selected = buttons.find((b) => b.getAttribute("title") === "B#1");
    expect(selected).toBeTruthy();
    expect((selected as HTMLElement).style.borderWidth).toBe("2px");
  });

  it("revealedThroughCommitIdx dims commits past the cursor (L8.5 time-travel)", () => {
    const chain = linearWithCommits(["A", "B", "C", "D"]);
    const { container } = render(
      <CommitChainView chain={chain} revealedThroughCommitIdx={1} />,
    );
    const buttons = Array.from(container.querySelectorAll("button"));
    const byTitle = new Map<string, HTMLButtonElement>();
    for (const b of buttons) {
      const title = b.getAttribute("title");
      if (title) byTitle.set(title, b as HTMLButtonElement);
    }
    // Buttons for commits 0,1 are revealed (opacity 1, aria-disabled=false);
    // 2,3 are dimmed (opacity 0.35, aria-disabled=true) but still clickable.
    expect(byTitle.get("A#0")!.style.opacity).toBe("1");
    expect(byTitle.get("A#0")!.getAttribute("aria-disabled")).toBe("false");
    expect(byTitle.get("B#1")!.style.opacity).toBe("1");
    expect(byTitle.get("C#2")!.style.opacity).toBe("0.35");
    expect(byTitle.get("C#2")!.getAttribute("aria-disabled")).toBe("true");
    expect(byTitle.get("D#3")!.style.opacity).toBe("0.35");
    expect(byTitle.get("D#3")!.getAttribute("aria-disabled")).toBe("true");
    // Dimmed buttons stay clickable (jump forward in time).
    expect(byTitle.get("D#3")!.disabled).toBe(false);
  });

  it("revealedThroughCommitIdx === -1 dims ALL commits (stale-cursor sentinel)", () => {
    const chain = linearWithCommits(["A", "B", "C"]);
    const { container } = render(
      <CommitChainView chain={chain} revealedThroughCommitIdx={-1} />,
    );
    const buttons = Array.from(container.querySelectorAll("button"));
    for (const b of buttons) {
      expect((b as HTMLElement).style.opacity).toBe("0.35");
    }
  });

  it("dimming in fork-merge shape — mixed reveal across parallel branches", () => {
    const chain = forkWithCommits();
    // Commit indices: LoadOrder#0, CheckInventory#1, RunFraudCheck#2, FinalizeOrder#3
    // Cursor at 2 → reveal LoadOrder, CheckInventory, RunFraudCheck; dim FinalizeOrder.
    const { container } = render(
      <CommitChainView chain={chain} revealedThroughCommitIdx={2} />,
    );
    const buttons = Array.from(container.querySelectorAll("button"));
    const op = (title: string) =>
      buttons.find((b) => b.getAttribute("title") === title)?.style.opacity;
    expect(op("LoadOrder#0")).toBe("1");
    expect(op("CheckInventory#1")).toBe("1");
    expect(op("RunFraudCheck#2")).toBe("1");
    expect(op("FinalizeOrder#3")).toBe("0.35");
  });

  it("aria-current marks the selected commit (a11y)", () => {
    const chain = linearWithCommits(["A", "B", "C"]);
    const { container } = render(
      <CommitChainView
        chain={chain}
        selectedRuntimeStageId={asRuntimeStageId("B#1")}
        onSelectCommit={() => {}}
      />,
    );
    const buttons = Array.from(container.querySelectorAll("button"));
    const selected = buttons.find((b) => b.getAttribute("title") === "B#1");
    expect(selected!.getAttribute("aria-current")).toBe("true");
    const unselected = buttons.find((b) => b.getAttribute("title") === "A#0");
    expect(unselected!.getAttribute("aria-current")).toBeNull();
  });

  it("revealedThroughCommitIdx === null reveals everything (default behavior)", () => {
    const chain = linearWithCommits(["A", "B", "C"]);
    const { container } = render(<CommitChainView chain={chain} />);
    const buttons = Array.from(container.querySelectorAll("button"));
    for (const b of buttons) {
      expect((b as HTMLElement).style.opacity).toBe("1");
    }
  });

  it("resolveLabel maps stageId → friendly label", () => {
    const chain = linearWithCommits(["LoadOrder", "ShipOrder"]);
    const { container } = render(
      <CommitChainView
        chain={chain}
        resolveLabel={(id) => (id === asStageId("LoadOrder") ? "Step 1: Load" : "Step 2: Ship")}
      />,
    );
    expect(container.textContent).toContain("Step 1: Load");
    expect(container.textContent).toContain("Step 2: Ship");
  });
});
