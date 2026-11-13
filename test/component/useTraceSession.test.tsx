/** @vitest-environment jsdom */
import { useState } from "react";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useTraceSessionController, useTraceSessionState } from "../../src/components/ExplainableShell/_internal/useTraceSession";
import type { TraceScope } from "../../src/trace/traceScope";
import type { StageSnapshot } from "../../src/types";

const stages = [
  { id: "seed#0", writes: ["rate", "items"], reads: [] },
  { id: "sum#1", writes: ["subtotal"], reads: ["items"] },
  { id: "audit#2", writes: ["auditNote"], reads: ["subtotal"] },
  { id: "tax#3", writes: ["tax"], reads: ["rate", "subtotal"] },
  { id: "total#4", writes: ["total"], reads: ["subtotal", "tax"] },
];
const snapshots: StageSnapshot[] = stages.map((stage, index) => ({
  runtimeStageId: stage.id,
  stageName: stage.id.split("#")[0],
  stageLabel: stage.id.split("#")[0],
  memory: {}, narrative: "", startMs: index, durationMs: 1,
}));

function scopeWithReads(recordReads = true): TraceScope {
  let tree: Record<string, unknown> | undefined;
  for (const stage of [...stages].reverse()) {
    tree = {
      runtimeStageId: stage.id,
      ...(recordReads && stage.reads.length ? { stageReads: Object.fromEntries(stage.reads.map(key => [key, true])) } : {}),
      ...(tree ? { next: tree } : {}),
    };
  }
  return {
    invocationPath: [],
    commitLog: stages.map(stage => ({
      stage: stage.id.split("#")[0],
      stageId: stage.id.split("#")[0],
      runtimeStageId: stage.id,
      trace: stage.writes.map(path => ({ path })),
    })),
    executionTree: tree,
    availability: { ok: true },
    readsAvailable: recordReads,
    mountLabels: new Map(),
  };
}

function renderSession(scope = scopeWithReads(), initialIndex = 4) {
  const openInspector = vi.fn();
  const options = { scope, scopeKey: null as string | null, sourceChanged: false, showDataTraceCone: false };
  const hook = renderHook(({ scope, scopeKey, sourceChanged, showDataTraceCone }: typeof options) => {
    const [cursor, setCursor] = useState(initialIndex);
    const session = useTraceSessionState(cursor);
    const controller = useTraceSessionController({
      session,
      activeTraceScope: scope,
      activeTraceKey: scopeKey,
      activeSnapshots: snapshots,
      safeIdx: cursor,
      sourceChanged,
      traceHistoryAvailable: true,
      showDataTraceCone,
      setSnapshotIdx: setCursor,
      onStartInspector: openInspector,
    });
    return { ...controller, cursor, setCursor, reset: session.reset };
  }, { initialProps: options });
  return { ...hook, options, openInspector };
}

describe("trace session controller", () => {
  it("freezes the recorded question while one cursor moves across the dependency rail", () => {
    const { result, openInspector } = renderSession();
    act(() => result.current.handleStartTracing("total"));
    const walk = result.current.traceWalk;
    expect(openInspector).toHaveBeenCalledOnce();
    expect(result.current.cursor).toBe(4);
    expect(result.current.traceStopIndices).toEqual([0, 1, 3, 4]);
    expect(result.current.sliceCone?.has("audit")).toBe(false);

    act(() => result.current.handleForkPrompt());
    expect(result.current.forkChooserOpen).toBe(true);
    act(() => result.current.handleContinueTimeOrder());
    expect(result.current.cursor).toBe(3);
    expect(result.current.forkChooserOpen).toBe(false);
    expect(result.current.traceWalk).toBe(walk);
    expect(result.current.tracingRail?.stopOrdinal).toBe(2);

    act(() => result.current.handleExitTracing());
    expect(result.current.tracingRail).toBeNull();
    expect(result.current.cursor).toBe(3);
  });

  it("re-anchors on an exact ingredient writer and restores the original frozen question", () => {
    const { result } = renderSession();
    act(() => result.current.handleStartTracing("total"));
    const ingredient = result.current.traceWalk!.stops[0].ingredients.find(entry => entry.key === "subtotal")!;
    act(() => result.current.handleFollowIngredient(ingredient));
    expect(result.current.cursor).toBe(1);
    expect(result.current.activeViaKey).toBe("subtotal");
    expect(result.current.traceStopIndices).toEqual([0, 1]);
    expect(result.current.tracingRail?.tracedKey).toBe("total");

    act(() => result.current.handleShowAllIngredients());
    expect(result.current.cursor).toBe(4);
    expect(result.current.activeViaKey).toBeNull();
    expect(result.current.traceStopIndices).toEqual([0, 1, 3, 4]);
  });

  it("keeps a not-yet-written question honest after the cursor advances", () => {
    const { result } = renderSession(scopeWithReads(), 1);
    act(() => result.current.handleStartTracing("total"));
    expect(result.current.cursor).toBe(1);
    expect(result.current.traceWalk?.missing?.reason).toBe("not-yet-written");
    expect(result.current.tracingRail).toBeNull();

    act(() => result.current.setCursor(4));
    expect(result.current.traceWalk?.missing?.reason).toBe("not-yet-written");
    act(() => result.current.handleStartTracing("total"));
    expect(result.current.traceWalk?.missing).toBeNull();
  });

  it("withholds old questions on source or scope replacement and exposes a stable navigation reset", () => {
    const { result, rerender, options } = renderSession();
    const reset = result.current.reset;
    act(() => result.current.handleStartTracing("total"));
    rerender({ ...options, sourceChanged: true });
    expect(result.current.traceWalk).toBeNull();
    expect(result.current.tracingRail).toBeNull();
    rerender({ ...options, scopeKey: '["child#3"]' });
    expect(result.current.traceWalk).toBeNull();
    expect(result.current.reset).toBe(reset);

    act(() => { result.current.setTraceSearch("subtotal"); result.current.handleForkPrompt(); });
    act(() => result.current.reset());
    expect(result.current.tracing).toBeNull();
    expect(result.current.forkChooserOpen).toBe(false);
    expect(result.current.traceSearch).toBe("");
    expect(result.current.cursor).toBe(4);
  });

  it("retains unknown read coverage and refuses a scope with unavailable history", () => {
    const { result, rerender, options, openInspector } = renderSession(scopeWithReads(false));
    act(() => result.current.handleStartTracing("total"));
    expect(result.current.traceWalk?.readsAvailable).toBe(false);
    expect(result.current.traceWalk?.stops).toHaveLength(1);
    expect(result.current.shellDataTrace.readsAvailable).toBe(false);
    expect(result.current.sliceCone).toBeUndefined();

    act(() => result.current.reset());
    openInspector.mockClear();
    rerender({ ...options, scope: { ...options.scope, commitLog: [], availability: { ok: false, reason: "no-history" } } });
    act(() => result.current.handleStartTracing("total"));
    expect(result.current.tracing).toBeNull();
    expect(result.current.shellDataTrace.frames).toEqual([]);
    expect(openInspector).not.toHaveBeenCalled();
  });
});
