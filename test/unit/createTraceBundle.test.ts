/**
 * L8.0 — `createTraceBundle` smoke tests.
 *
 * The bundle is consumer ergonomics sugar — it composes existing
 * translators (which have their own deep tests). These tests verify
 * the bundling wiring + the `attachTo(executor)` contract, NOT the
 * underlying translator behavior (covered elsewhere).
 */

import { describe, it, expect, vi } from "vitest";
import { createTraceBundle } from "../../src/components/FlowchartView/createTraceBundle";

const spec = (id: string, name: string) => ({ id, name, type: "stage" as const });

describe("createTraceBundle — composition + lifecycle", () => {
  it("returns a bundle with structure + runtimeOverlay translators", () => {
    const b = createTraceBundle();
    expect(b.structure).toBeDefined();
    expect(b.structure.recorder).toBeDefined();
    expect(b.structure.getGraph).toBeInstanceOf(Function);
    expect(b.runtimeOverlay).toBeDefined();
    expect(b.runtimeOverlay.recorder).toBeDefined();
    expect(b.runtimeOverlay.getOverlay).toBeInstanceOf(Function);
    expect(b.attachTo).toBeInstanceOf(Function);
  });

  it("forwards per-translator options through", () => {
    const b = createTraceBundle({
      structure: { id: "my-structure" },
      runtimeOverlay: { id: "my-overlay" },
    });
    expect(b.structure.recorder.id).toBe("my-structure");
    expect(b.runtimeOverlay.recorder.id).toBe("my-overlay");
  });

  it("attachTo(executor) attaches all 3 FlowRecorders + 2 ScopeRecorders (L8.2 update)", () => {
    const b = createTraceBundle();
    const attachFlowRecorder = vi.fn();
    const attachScopeRecorder = vi.fn();
    const mockExecutor = { attachFlowRecorder, attachScopeRecorder };
    b.attachTo(mockExecutor);
    // FlowRecorder: runtimeOverlay + nodeView + commitFlow
    expect(attachFlowRecorder).toHaveBeenCalledTimes(3);
    expect(attachFlowRecorder).toHaveBeenCalledWith(b.runtimeOverlay.recorder);
    expect(attachFlowRecorder).toHaveBeenCalledWith(b.nodeView.recorder);
    expect(attachFlowRecorder).toHaveBeenCalledWith(b.commitFlow.recorder);
    // ScopeRecorder: nodeView + commitFlow (for onCommit data)
    expect(attachScopeRecorder).toHaveBeenCalledTimes(2);
    expect(attachScopeRecorder).toHaveBeenCalledWith(b.nodeView.recorder);
    expect(attachScopeRecorder).toHaveBeenCalledWith(b.commitFlow.recorder);
  });

  it("attachTo gracefully handles executors without attachScopeRecorder (optional)", () => {
    const b = createTraceBundle();
    const attachFlowRecorder = vi.fn();
    // Executor without attachScopeRecorder method (older footprintjs / partial impl).
    const mockExecutor = { attachFlowRecorder };
    expect(() => b.attachTo(mockExecutor)).not.toThrow();
    expect(attachFlowRecorder).toHaveBeenCalledTimes(3);
  });

  it("bundle includes a nodeView translator", () => {
    const b = createTraceBundle();
    expect(b.nodeView).toBeDefined();
    expect(b.nodeView.recorder).toBeDefined();
    expect(b.nodeView.getIndex).toBeInstanceOf(Function);
  });

  it("bundle includes a commitFlow translator (L8.2)", () => {
    const b = createTraceBundle();
    expect(b.commitFlow).toBeDefined();
    expect(b.commitFlow.recorder).toBeDefined();
    expect(b.commitFlow.getIndex).toBeInstanceOf(Function);
  });

  it("structure recorder still receives events normally when attached via flowChart options", () => {
    // The bundle's structure.recorder is the same handle returned by
    // createTraceStructureRecorder — it accumulates events identically.
    const b = createTraceBundle();
    b.structure.recorder.onStageAdded!({
      stageId: "a",
      name: "A",
      type: "stage",
      spec: spec("a", "A"),
    });
    expect(b.structure.getGraph().nodes).toHaveLength(1);
  });

  it("bundle's translators have INDEPENDENT version counters (they're separate translators)", () => {
    // Validates the architecture: each translator has its own
    // notifier — the bundle is a composition, not a shared bus.
    const b = createTraceBundle();
    expect(b.structure.version()).toBe(0);
    expect(b.runtimeOverlay.version()).toBe(0);

    b.structure.recorder.onStageAdded!({
      stageId: "a",
      name: "A",
      type: "stage",
      spec: spec("a", "A"),
    });

    expect(b.structure.version()).toBe(1);
    // runtimeOverlay untouched.
    expect(b.runtimeOverlay.version()).toBe(0);
  });
});
