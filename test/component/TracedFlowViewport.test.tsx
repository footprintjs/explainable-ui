/** @vitest-environment jsdom */
/**
 * Regression: scrubbing replaces the controlled ReactFlow node objects.
 * xyflow clears their internal measurements, then measures the rendered cards
 * again. That readiness cycle is not permission to reset the viewer's camera.
 *
 * This mounts the real TracedFlow and xyflow provider/store (no hook mocks).
 * jsdom cannot measure layout, so DOM boxes and ResizeObserver measurements are
 * supplied explicitly. Actual browser sizing needs a separate demo rehearsal.
 */
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, cleanup, render } from "@testing-library/react";
import { useStoreApi } from "@xyflow/react";
import { TracedFlow } from "../../src/components/FlowchartView/TracedFlow";
import { createTraceRuntimeOverlay } from "../../src/components/FlowchartView/createTraceRuntimeOverlay";
import type { TraceGraph } from "../../src/components/FlowchartView/traceStructureRecorder";

let frames: Map<number, FrameRequestCallback>;
let frameId = 0;

beforeEach(() => {
  frames = new Map();
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    frames.set(++frameId, callback);
    return frameId;
  });
  vi.stubGlobal("cancelAnimationFrame", (frame: number) => frames.delete(frame));
  vi.stubGlobal("ResizeObserver", class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(() => ({
    width: 800, height: 500, x: 0, y: 0,
    left: 0, top: 0, right: 800, bottom: 500,
    toJSON() {},
  }));
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function flushFrame(): void {
  act(() => {
    const queue = [...frames.values()];
    frames.clear();
    queue.forEach((callback) => callback(0));
  });
}

it.each([
  ["passthrough", 120],
  ["passthrough", 134],
  [undefined, 120],
  [undefined, 134],
] as const)(
  "keeps manual camera across scrub with layout=%s and remeasured width=%s",
  (layout, remeasuredWidth) => {
    let store!: ReturnType<typeof useStoreApi>;
    function Probe() {
      store = useStoreApi();
      return null;
    }

    const graph: TraceGraph = {
      nodes: ["a", "b"].map((id, index) => ({
        id, type: "stage", position: { x: 0, y: index * 100 },
        data: {
          label: id, isDecider: false, isFork: false,
          isStreaming: false, isSubflow: false, prevIds: [], nextIds: [],
        },
      })),
      edges: [],
    };
    const runtime = createTraceRuntimeOverlay();
    for (const id of ["a", "b"]) {
      runtime.recorder.onStageExecuted?.({
        stageName: id, stageId: id, stageType: "linear",
        traversalContext: { runtimeStageId: `${id}#0` },
      });
    }
    const overlay = runtime.getOverlay();
    const view = (index: number) => (
      <TracedFlow graph={graph} overlay={overlay} scrubIndex={index} layout={layout}>
        <Probe />
      </TracedFlow>
    );
    const mounted = render(view(1));
    const setViewport = vi.spyOn(store.getState().panZoom!, "setViewport")
      .mockImplementation(async (viewport) => {
        store.setState({ transform: [viewport.x, viewport.y, viewport.zoom] });
        return undefined;
      });
    const measure = (width = 120) => act(() => {
      for (const node of store.getState().nodeLookup.values()) {
        node.measured = { width, height: 40 };
        node.internals.handleBounds = { source: [], target: [] };
      }
      store.setState({ width: 800, height: 500 });
    });

    measure();
    flushFrame();
    expect(setViewport).toHaveBeenCalled();
    setViewport.mockClear();
    act(() => store.setState({ transform: [31, -42, 0.43] }));

    mounted.rerender(view(0));
    // Assert the real provider lifecycle that the original mock tests missed.
    expect(store.getState().nodeLookup.get("a")!.measured.width).toBeUndefined();
    flushFrame();
    expect(setViewport).not.toHaveBeenCalled();

    // Both identical geometry and an active badge changing card width preserve
    // the viewer's camera. The markup can change without taking ownership.
    measure(remeasuredWidth);
    flushFrame();
    expect(setViewport).not.toHaveBeenCalled();
    expect(store.getState().transform).toEqual([31, -42, 0.43]);
  },
);
