/** @vitest-environment jsdom */
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TraceDependencyView } from "../../src/components/DataTracePanel/TraceDependencyView";
import { buildTraceWalk } from "../../src/trace/traceWalk";
import type { StageSnapshot } from "../../src/types";

const log = [
  ["LoadRates", "load#1", "rates"], ["PickBase", "pick#2", "baseRate"],
  ["Audit", "audit#3", "auditNote"], ["AssessRisk", "risk#4", "riskFactor"],
  ["Quote", "quote#5", "quote"],
].map(([stage, runtimeStageId, key]) => ({ stage, stageId: stage, runtimeStageId, trace: [{ path: key }] }));
const reads = [{}, { rates: 1 }, {}, {}, { baseRate: 1, riskFactor: 1 }];
const tree: Record<string, unknown> = {};
let parent = tree;
log.forEach((entry, index) => {
  Object.assign(parent, { runtimeStageId: entry.runtimeStageId, stageReads: reads[index] });
  if (index < log.length - 1) { parent.next = {}; parent = parent.next as Record<string, unknown>; }
});
const snapshots: StageSnapshot[] = log.map((entry, index) => ({
  runtimeStageId: entry.runtimeStageId, stageName: entry.stage, stageLabel: entry.stage,
  memory: { rates: [3.1, 3.4, 9.9], baseRate: index === 1 ? 9.9 : 100, riskFactor: 1.2, quote: 11.88 },
  narrative: "", startMs: index, durationMs: 1,
}));
const walk = buildTraceWalk(log, tree, "quote");

describe("variable dependency investigation view", () => {
  it("shows both sibling inputs and writer-time values, without unrelated execution stages", () => {
    const follow = vi.fn();
    const { container } = render(<TraceDependencyView walk={walk} cursorRuntimeStageId="quote#5" snapshots={snapshots} onFollowIngredient={follow}><div>Execution chart</div></TraceDependencyView>);
    const graph = container.querySelector('[data-fp="trace-dependency-view"]')!;
    expect(graph.textContent).toContain("Why quote = 11.88?");
    const base = container.querySelector('[data-variable="baseRate"]') as HTMLButtonElement;
    expect(base.textContent).toContain("9.9"); // not the later cursor's100
    expect(base.textContent).toContain("PickBase");
    expect(container.querySelector('[data-variable="riskFactor"]')).toBeTruthy();
    expect(container.querySelector('[data-variable="auditNote"]')).toBeNull();
    expect(graph.textContent).toContain("recorded stage reads");
    expect(graph.textContent).toContain("not execution order or proof of exact derivation");
    fireEvent.click(base);
    expect(follow).toHaveBeenCalledWith({ key: "baseRate", writerRuntimeStageId: "pick#2", writerStageName: "PickBase", writerCommitIdx: 1 });
    expect(screen.queryByText("Execution chart")).toBeNull();
  });

  it("keeps the execution renderer available and resets to variables for a new question", () => {
    const props = { cursorRuntimeStageId: "quote#5", snapshots, onFollowIngredient: vi.fn() };
    const view = render(<TraceDependencyView {...props} walk={walk}><div>Execution chart</div></TraceDependencyView>);
    fireEvent.click(screen.getByRole("button", { name: /^Execution$/ }));
    expect(screen.getByText("Execution chart")).toBeTruthy();
    expect(screen.getByRole("button", { name: /^Execution$/ }).getAttribute("aria-pressed")).toBe("true");
    view.rerender(<TraceDependencyView {...props} walk={buildTraceWalk(log, tree, "baseRate")}><div>Execution chart</div></TraceDependencyView>);
    expect(screen.queryByText("Execution chart")).toBeNull();
    expect(screen.getByRole("button", { name: /^Variables$/ }).getAttribute("aria-pressed")).toBe("true");
  });

  it("gives keyboard/screen-reader users the same recorded input relationships", () => {
    render(<TraceDependencyView walk={walk} cursorRuntimeStageId="quote#5" snapshots={snapshots} onJumpToStop={vi.fn()}><div /></TraceDependencyView>);
    const output = screen.getByRole("button", { name: "Show quote at Quote" });
    const description = document.getElementById(output.getAttribute("aria-describedby")!);
    expect(description?.textContent).toContain("Recorded stage reads: baseRate, riskFactor");
    const controls = screen.getByRole("group", { name: "Investigation view" });
    expect(within(controls).getAllByRole("button")).toHaveLength(2);
  });

  it("does not replace a consumer's chart when there is no admitted trace question", () => {
    render(<TraceDependencyView walk={null} cursorRuntimeStageId={null} snapshots={snapshots}><div>Execution chart</div></TraceDependencyView>);
    expect(screen.getByText("Execution chart")).toBeTruthy();
    expect(screen.queryByRole("region", { name: "Variable investigation" })).toBeNull();
  });

  it("shows nested commit-path values from the writer snapshot without invoking accessors", () => {
    const key = "applicant\u001faddress\u001fzip";
    const ownLog = [{ stage: "Address", stageId: "address", runtimeStageId: "address#1", trace: [{ path: key }] }];
    const ownWalk = buildTraceWalk(ownLog, { runtimeStageId: "address#1", stageReads: {} }, key);
    const ownSnapshots = [{ ...snapshots[0], runtimeStageId: "address#1", memory: { applicant: { address: { zip: 75078 } } } }];
    const { container } = render(<TraceDependencyView walk={ownWalk} cursorRuntimeStageId="address#1" snapshots={ownSnapshots}><div /></TraceDependencyView>);
    const node = container.querySelector('[data-fp="trace-variable-node"]')!;
    expect(node.textContent).toContain("applicant › address › zip");
    expect(node.textContent).toContain("75078");
  });
});
