/** @vitest-environment jsdom */
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { stateAt, timeTravel } from "foottrace";
import { ExplainableShell } from "../../src/components/ExplainableShell/ExplainableShell";
import type { TraceWalkCardProps } from "../../src/components/DataTracePanel/TraceWalkCard";
import { toVisualizationSnapshots } from "../../src/adapters/fromRuntimeSnapshot";

const captured = vi.hoisted(() => ({ card: undefined as TraceWalkCardProps | undefined }));
vi.mock("../../src/components/DataTracePanel/TraceWalkCard", async importOriginal => {
  const original = await importOriginal<typeof import("../../src/components/DataTracePanel/TraceWalkCard")>();
  return { TraceWalkCard: (props: TraceWalkCardProps) => { captured.card = props; return <original.TraceWalkCard {...props} />; } };
});
const row = (id: string, key: string, value: number) => ({ runtimeStageId: id, stageId: id.split("#")[0], stage: id,
  overwrite: { [key]: value }, updates: {}, redactedPaths: [], trace: [{ path: key, verb: "set" }] });
const stage = (id: string, reads: Record<string, unknown> = {}) => ({ id: id.split("#")[0], name: id, runtimeStageId: id, stageReads: reads, logs: {}, errors: {}, metrics: {}, evals: {} });
function recording() {
  return { sharedState: { out: 5, y: 3 }, initialState: {}, subflowResults: {},
    commitLog: [row("seed#0", "r", 1), row("a#1", "x", 2), row("b#2", "r", 9),
      { ...row("a#1", "y", 3), phase: "repeat" }, row("c#3", "out", 5)],
    executionTree: { ...stage("seed#0"), next: { ...stage("a#1", { r: 1 }), next: { ...stage("b#2"), next: stage("c#3", { x: 2, y: 3 }) } } } };
}
function openTrace(unstyled: boolean) {
  if (!unstyled) fireEvent.click(screen.getByText("Inspector"));
  fireEvent.click(screen.getByText("Data Trace"));
}
function anyKey(key: string) {
  fireEvent.click([...document.querySelectorAll('[data-fp="trace-any-chip"]')].find(node => node.textContent === key)!);
}

// The existing unstyled Shell has no Inspector/TraceWalk entry point. Both
// public Card presentations are covered in TraceWalkEvidence; no new UI here.
describe("M5 source-bound Shell", () => {
  const unstyled = false;
  it("shows exact continuation y at row3 while rail navigation visits A at row1", () => {
    render(<ExplainableShell runtimeSnapshot={recording()} unstyled={unstyled} />);
    for (let i = 0; i < 3; i++) fireEvent.click(screen.getByLabelText("Next stage"));
    openTrace(unstyled); anyKey("y");
    const card = document.querySelector('[data-fp="trace-walk-card"]')!;
    expect(card.textContent).toContain("y = 3");
    expect(card.textContent).toContain("Execution visit at record row 1; actual contributions: y at row 3");
    expect(card.textContent).toContain("Step 2"); // group A stops at row1; y's row3 is inside group B.
    expect(captured.card!.walk.stops[0].ingredients[0].writerCommitIdx).toBe(0);
    fireEvent.click(within(card as HTMLElement).getByTitle(/Follow r/));
    expect(captured.card!.walk.key).toBe("r");
    expect(captured.card!.walk.stops[0].commitIdx).toBe(0); // never later B's r=9
    fireEvent.click(screen.getByText("show all ingredients"));
    expect(captured.card!.walk.key).toBe("y");
    expect(captured.card!.walk.evidence?.beforeCommitIdx).toBe(5);
  });
  it("ignores stale and foreign follow/exit/chooser callbacks across source replacement", () => {
    const first = recording();
    const view = render(<ExplainableShell runtimeSnapshot={first} unstyled={unstyled} />);
    for (let i = 0; i < 3; i++) fireEvent.click(screen.getByLabelText("Next stage"));
    openTrace(unstyled); anyKey("out");
    const old = captured.card!;
    const ing = old.walk.stops[0].ingredients[0];
    act(() => old.onFollowIngredient?.({ ...ing })); // exact query membership, not matching fields
    expect(captured.card!.walk.key).toBe("out");
    view.rerender(<ExplainableShell runtimeSnapshot={recording()} unstyled={unstyled} />);
    expect(document.querySelector('[data-fp="trace-walk-card"]')).toBeNull();
    anyKey("out");
    const fresh = captured.card!;
    act(() => { old.onFollowIngredient?.(ing); old.onShowAll?.(); old.onExit?.(); old.onJumpToStop?.("seed#0"); old.onContinueTimeOrder?.(); });
    expect(captured.card!.walk).toBe(fresh.walk);
    expect(document.querySelector('[data-fp="trace-walk-card"]')).toBeTruthy();
  });
  it("accepts explicit zero boundary without claiming a stage already ran", () => {
    const runtime = recording(), snapshots = toVisualizationSnapshots(runtime);
    const start = timeTravel(runtime).stops.find(stop => stop.kind === "start");
    if (!start) throw new Error("fixture requires canonical start");
    const initial = stateAt(runtime, -1);
    snapshots.unshift({ stageName: start.stageId, stageLabel: start.label, runtimeStageId: start.runtimeStageId,
      memory: initial.state, narrative: "", startMs: 0, durationMs: 0,
      recordState: { status: "available", sourceId: "flow:root", stop: start, current: initial, previous: initial } });
    render(<ExplainableShell runtimeSnapshot={runtime} snapshots={snapshots} unstyled={unstyled} />);
    openTrace(unstyled); anyKey("out");
    expect(captured.card!.walk).toMatchObject({ status: "not-recorded", evidence: { beforeCommitIdx: 0 }, missing: { firstWriteCommitIdx: 4 } });
    expect(document.querySelector('[data-fp="trace-walk-card"]')!.textContent).toContain("separately checked whole-record hint");
  });
  it("refuses a mismatched selected stage instead of silently querying the whole log", () => {
    const runtime = recording(), snapshots = toVisualizationSnapshots(runtime);
    snapshots[0] = { ...snapshots[0], runtimeStageId: "foreign#0" };
    render(<ExplainableShell runtimeSnapshot={runtime} snapshots={snapshots} unstyled={unstyled} />);
    openTrace(unstyled); anyKey("out");
    expect(captured.card!.walk.status).toBe("unavailable");
    expect(captured.card!.walk.stops).toEqual([]);
    expect(document.querySelector('[data-fp="trace-walk-card"]')!.textContent).toContain("Cannot anchor");
  });
  it("cannot revive an old session through callbacks after a source/style switch", () => {
    const view = render(<ExplainableShell runtimeSnapshot={recording()} />);
    for (let i = 0; i < 3; i++) fireEvent.click(screen.getByLabelText("Next stage"));
    openTrace(false); anyKey("out");
    const old = captured.card!, replacement = recording();
    view.rerender(<ExplainableShell runtimeSnapshot={replacement} unstyled />);
    act(() => old.onFollowIngredient?.(old.walk.stops[0].ingredients[0]));
    view.rerender(<ExplainableShell runtimeSnapshot={replacement} />);
    expect(document.querySelector('[data-fp="trace-walk-card"]')).toBeNull();
    expect(screen.getByRole("toolbar").getAttribute("data-tracing")).toBeNull();
  });
});
