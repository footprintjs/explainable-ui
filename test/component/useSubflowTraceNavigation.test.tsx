/** @vitest-environment jsdom */
import { useMemo, useState } from "react";
import { readFileSync } from "node:fs";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { toVisualizationSnapshots } from "../../src/adapters/fromRuntimeSnapshot";
import { exactSubflowResults } from "../../src/components/ExplainableShell/_internal/subflowRecord";
import { useSubflowNavigation } from "../../src/components/ExplainableShell/_internal/useSubflowNavigation";

const recording = JSON.parse(readFileSync("test/fixtures/subflow-handoff/recording.json", "utf8"));

function setup() {
  const reset = vi.fn();
  const transitionAttempts: boolean[] = [];
  const source = structuredClone(recording.runtimeSnapshot);
  const hook = renderHook(({ snapshot, probeTransition }: { snapshot: typeof source; probeTransition: boolean }) => {
    const exactResults = useMemo(() => exactSubflowResults(snapshot.subflowResults), [snapshot]);
    const snapshots = useMemo(() => toVisualizationSnapshots({ ...snapshot, subflowResults: exactResults }), [snapshot, exactResults]);
    const [cursor, setCursor] = useState(0);
    const navigation = useSubflowNavigation({
      snapshots, sourceRunId: snapshot.runId, readsAvailable: true,
      exactResults, narrativeEntries: undefined, snapshotIdx: cursor,
      setSnapshotIdxRaw: setCursor, activeTab: "explainable", onScopeReset: reset,
    });
    // A transition is refused before the reconciliation effect can clear history.
    if (probeTransition && navigation.sourceChanged)
      transitionAttempts.push(navigation.restoreTraceQuestion([], "use#6"));
    const activeSnapshots = navigation.selectedStack.at(-1)?.snapshots ?? snapshots;
    return { ...navigation, cursorId: activeSnapshots[cursor]?.runtimeStageId };
  }, { initialProps: { snapshot: source, probeTransition: false } });
  return { ...hook, source, reset, transitionAttempts };
}

describe("saved trace location navigation", () => {
  it("restores exact nested, same-scope and root cursors across repeated visits", () => {
    const { result, reset } = setup();
    let restored = false;
    act(() => { restored = result.current.restoreTraceQuestion(["child#9", "child/inner#11"], "child/inner/compute#12"); });
    expect(restored).toBe(true);
    expect(result.current.selectedStack.map(entry => entry.mountRuntimeStageId)).toEqual(["child#9", "child/inner#11"]);
    expect(result.current.cursorId).toBe("child/inner/compute#12");

    act(() => { restored = result.current.restoreTraceQuestion(["child#9"], "child/prepare#10"); });
    expect(restored).toBe(true);
    expect(result.current.cursorId).toBe("child/prepare#10");
    act(() => { restored = result.current.restoreTraceQuestion(["child#9"], "child/inner#11"); });
    expect(restored).toBe(true);
    expect(result.current.cursorId).toBe("child/inner#11");

    act(() => { restored = result.current.restoreTraceQuestion([], "use#6"); });
    expect(restored).toBe(true);
    expect(result.current.selectedStack).toEqual([]);
    expect(result.current.cursorId).toBe("use#6");
    expect(reset).toHaveBeenCalledTimes(4);
  });

  it("refuses wrong ancestry, aliases and absent cursors without changing location", () => {
    const { result, reset } = setup();
    act(() => { result.current.restoreTraceQuestion(["child#2"], "child/prepare#3"); });
    reset.mockClear();
    for (const [path, cursor] of [
      [["child#2", "child/inner#11"], "child/inner/compute#12"],
      [["child"], "child/prepare#3"],
      [["child#2"], "child/prepare#10"],
      [[], "missing#99"],
    ] as const) {
      let restored = true;
      act(() => { restored = result.current.restoreTraceQuestion(path, cursor); });
      expect(restored).toBe(false);
      expect(result.current.selectedStack.map(entry => entry.mountRuntimeStageId)).toEqual(["child#2"]);
      expect(result.current.cursorId).toBe("child/prepare#3");
    }
    expect(reset).not.toHaveBeenCalled();
  });

  it("revalidates a fresh same-run record instead of reusing the saved child chain", () => {
    const { result, rerender, source, reset } = setup();
    act(() => { result.current.restoreTraceQuestion(["child#2", "child/inner#4"], "child/inner/compute#5"); });
    const next = structuredClone(source);
    delete next.subflowResults["child/inner#4"];
    rerender({ snapshot: next, probeTransition: false });
    reset.mockClear();
    let restored = true;
    act(() => { restored = result.current.restoreTraceQuestion(["child#2", "child/inner#4"], "child/inner/compute#5"); });
    expect(restored).toBe(false);
    expect(reset).not.toHaveBeenCalled();
  });

  it("refuses restoration during a source-run transition", () => {
    const { rerender, source, transitionAttempts } = setup();
    rerender({ snapshot: { ...source, runId: "replacement-run" }, probeTransition: true });
    expect(transitionAttempts.length).toBeGreaterThan(0);
    expect(transitionAttempts).toEqual(transitionAttempts.map(() => false));
  });
});
