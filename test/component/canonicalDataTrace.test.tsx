/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ExplainableShell } from "../../src/components/ExplainableShell/ExplainableShell";
import { DataTracePanel } from "../../src/components/DataTracePanel/DataTracePanel";
import { buildDataTrace } from "../../src/components/ExplainableShell/_internal/dataTrace";
import { toVisualizationSnapshots } from "../../src/adapters/fromRuntimeSnapshot";
import fork from "../migration/fixtures/causal-phases/runtime-snapshot-10.0.0.json";

describe("M4 — visible causal evidence", () => {
  it.each([false, true])("keeps qualifications and navigation with unstyled=%s", unstyled => {
    const result = buildDataTrace(fork.commitLog, fork.executionTree, "a#1");
    const onFrameClick = vi.fn();
    const { container } = render(<DataTracePanel frames={result.frames} note={result.note} fromStageName="A" onFrameClick={onFrameClick} unstyled={unstyled} />);
    expect(container.textContent).toContain("read capture may be incomplete");
    expect(container.textContent).not.toContain("(origin)");
    expect(container.textContent).not.toContain("Every value here was derived");
    const frames = container.querySelectorAll('[data-fp="data-trace-frame"]');
    fireEvent.click(frames[1]);
    expect(onFrameClick).toHaveBeenCalledExactlyOnceWith("seed#0");
  });
  it("queries the selected canonical prefix despite an unreadable future row in the shell", () => {
    const selected = toVisualizationSnapshots(fork).find(row => row.runtimeStageId === "a#1")!;
    const runtimeSnapshot = { ...fork, commitLog: [...fork.commitLog.slice(0, 2), null] };
    const { rerender } = render(<ExplainableShell snapshots={[selected]} runtimeSnapshot={runtimeSnapshot} />);
    fireEvent.click(screen.getByText("Inspector"));
    fireEvent.click(screen.getByText("Data Trace"));
    const frames = document.querySelectorAll('[data-fp="data-trace-frame"]');
    expect([...frames].map(row => row.textContent)).toHaveLength(2);
    expect(frames[0].textContent).toContain("A");
    expect(frames[1].textContent).toContain("Seed");
    expect(document.body.textContent).toContain("read capture may be incomplete");
    expect(runtimeSnapshot.commitLog[2]).toBeNull();
    const replacement = { ...runtimeSnapshot, commitLog: [{ ...fork.commitLog[0], stage: "Replacement Seed" }, fork.commitLog[1], null] };
    rerender(<ExplainableShell snapshots={[selected]} runtimeSnapshot={replacement} />);
    expect(document.querySelectorAll('[data-fp="data-trace-frame"]')[1].textContent).toContain("Replacement Seed");
    if (selected.recordState?.status !== "available") throw new Error("no canonical fixture evidence");
    const stale = { ...selected, recordState: { ...selected.recordState, stop: { ...selected.recordState.stop, lastCommitIdx: 999 } } };
    rerender(<ExplainableShell snapshots={[stale]} runtimeSnapshot={replacement} />);
    expect(screen.getByText("The selected boundary is not an exact position in this source.")).toBeTruthy();
    expect(document.querySelectorAll('[data-fp="data-trace-frame"]')).toHaveLength(0);
  });
  it("does not pair a child-labelled selection with root evidence", () => {
    const selected = toVisualizationSnapshots(fork).find(row => row.runtimeStageId === "a#1")!;
    if (!selected.recordState) throw new Error("fixture has no evidence");
    const child = { ...selected, recordState: { ...selected.recordState, sourceId: "flow:subtree:child" } };
    render(<ExplainableShell snapshots={[child]} runtimeSnapshot={fork} />);
    fireEvent.click(screen.getByText("Inspector"));
    fireEvent.click(screen.getByText("Data Trace"));
    expect(screen.getByText("The selected position belongs to a different recorded source.")).toBeTruthy();
    expect(document.querySelectorAll('[data-fp="data-trace-frame"]')).toHaveLength(0);
  });
  it("recomputes the boundary and parents when a runtime-only source is replaced", () => {
    // Synthetic ordered counterfactual, not a new producer fixture: B now writes
    // before A reads 9. IDs and row count stay the same; A's own row moves to 2.
    const replacement = {
      ...fork,
      commitLog: [0, 2, 1, 4, 3, 5].map(index => fork.commitLog[index]),
      executionTree: {
        ...fork.executionTree,
        children: fork.executionTree.children.map(child => child.runtimeStageId === "a#1"
          ? { ...child, stageReads: { runs: { b: { x: 9 } } } }
          : child),
      },
    };
    const before = JSON.stringify(replacement);
    const selectedBefore = toVisualizationSnapshots(fork).find(row => row.runtimeStageId === "a#1");
    const selectedAfter = toVisualizationSnapshots(replacement).find(row => row.runtimeStageId === "a#1");
    expect(selectedBefore?.recordState).toMatchObject({ status: "available", stop: { commitIdx: 1, lastCommitIdx: 1 } });
    expect(selectedAfter?.recordState).toMatchObject({ status: "available", stop: { commitIdx: 2, lastCommitIdx: 4 } });
    const { rerender } = render(<ExplainableShell runtimeSnapshot={fork} />);
    fireEvent.click(screen.getByLabelText("Next stage"));
    fireEvent.click(screen.getByText("Inspector"));
    fireEvent.click(screen.getByText("Data Trace"));
    const frameIds = () => [...document.querySelectorAll('[data-fp="data-trace-frame"]')].map(row => row.textContent);
    expect(frameIds()).toHaveLength(2);
    expect(frameIds()[0]).toContain("A");
    expect(frameIds()[1]).toContain("Seed");
    rerender(<ExplainableShell runtimeSnapshot={replacement} />);
    expect(frameIds()).toHaveLength(2);
    expect(frameIds()[0]).toContain("A");
    expect(frameIds()[1]).toContain("B");
    expect(frameIds()[1]).not.toContain("Seed");
    expect(JSON.stringify(replacement)).toBe(before);
  });

  const seed = fork.commitLog[0];
  const { path: _path, ...withoutPath } = seed.trace[0];
  const damaged = [
    ["numeric", { ...seed, trace: [{ ...seed.trace[0], path: 42 }] }],
    ["missing", { ...seed, trace: [withoutPath] }],
  ] as const;
  describe.each([false, true])("malformed saved paths with unstyled=%s", unstyled => {
    it.each(damaged)("shows refusal, never an invented origin, for a %s path", (_kind, malformed) => {
      const result = buildDataTrace([malformed, fork.commitLog[1]], fork.executionTree, "a#1");
      const { container } = render(<DataTracePanel frames={result.frames} note={result.note} fromStageName="A" unstyled={unstyled} />);
      expect(container.textContent).toContain("unreadable record row");
      expect(container.querySelectorAll('[data-fp="data-trace-frame"]')).toHaveLength(0);
      expect(container.textContent).not.toContain("(origin)");
    });
  });
  it.each(damaged)("shows selected-prefix refusal in the Shell for a %s path", (_kind, malformed) => {
    const selected = toVisualizationSnapshots(fork).find(row => row.runtimeStageId === "a#1")!;
    const runtimeSnapshot = { ...fork, commitLog: [malformed, fork.commitLog[1]] };
    const before = JSON.stringify(runtimeSnapshot);
    render(<ExplainableShell snapshots={[selected]} runtimeSnapshot={runtimeSnapshot} />);
    fireEvent.click(screen.getByText("Inspector"));
    fireEvent.click(screen.getByText("Data Trace"));
    expect(document.body.textContent).toContain("unreadable record row");
    expect(document.querySelectorAll('[data-fp="data-trace-frame"]')).toHaveLength(0);
    expect(JSON.stringify(runtimeSnapshot)).toBe(before);
  });
});
