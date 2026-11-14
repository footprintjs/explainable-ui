/** @vitest-environment jsdom */
import { useRef } from "react";
import { ReactFlow, useStoreApi } from "@xyflow/react";
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChartAutoRefit } from "../../src/components/FlowchartView/_internal/useChartAutoRefit";
import { TracedFlow } from "../../src/components/FlowchartView/TracedFlow";
import type { TraceGraph } from "../../src/components/FlowchartView/traceStructureRecorder";
import type { TraceWorkflowOverlay } from "../../src/trace/traceWorkflowOverlay";

let frames: Map<number, FrameRequestCallback>;
let nextFrame = 0;
let area = { width: 800, height: 500 };
let store!: ReturnType<typeof useStoreApi>;

const graph: TraceGraph = {
  nodes: ["a", "b"].map((id, index) => ({
    id, type: "stage", position: { x: 0, y: index * 120 },
    data: { label: id, isDecider: false, isFork: false, isStreaming: false,
      isSubflow: false, prevIds: [], nextIds: [] },
  })),
  edges: [],
};
const investigation: TraceWorkflowOverlay = {
  questionKey: "total", scopeKey: "[]", focusRuntimeStageId: "b#1",
  stages: [{ runtimeStageId: "b#1", stageId: "b", color: "rebeccapurple", role: "question",
    values: [{ key: "total", preview: "20", color: "rebeccapurple" }] }],
  reads: [],
};

function Probe() { store = useStoreApi(); return null; }
function Harness({ preserveViewport, intent = "root" }: { preserveViewport?: boolean; intent?: string }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  return <div ref={wrapperRef}><ReactFlow nodes={graph.nodes} edges={graph.edges}>
    <ChartAutoRefit wrapperRef={wrapperRef} refitKey={intent} preserveViewport={preserveViewport} />
    <Probe />
  </ReactFlow></div>;
}

beforeEach(() => {
  frames = new Map(); nextFrame = 0; area = { width: 800, height: 500 };
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { frames.set(++nextFrame, callback); return nextFrame; });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(() => ({
    ...area, x: 0, y: 0, left: 0, top: 0, right: area.width, bottom: area.height, toJSON() {},
  }));
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function flush() {
  act(() => { const queued = [...frames.values()]; frames.clear(); queued.forEach(callback => callback(0)); });
}
function measure() {
  act(() => {
    for (const node of store.getState().nodeLookup.values()) {
      node.measured = { width: 120, height: 40 };
      node.internals.handleBounds = { source: [], target: [] };
    }
    store.setState({ ...area });
  });
}
function cameraSpy() {
  return vi.spyOn(store.getState().panZoom!, "setViewport").mockImplementation(async viewport => {
    store.setState({ transform: [viewport.x, viewport.y, viewport.zoom] });
    return undefined;
  });
}
function resize(width: number, height: number) {
  area = { width, height }; measure();
  act(() => window.dispatchEvent(new Event("resize")));
  flush();
}
function pan() { act(() => store.setState({ transform: [31, -42, .43] })); }

describe("investigation camera ownership", () => {
  it("changes resize policy without reclaiming a manual camera, while explicit intents still fit", () => {
    const view = render(<Harness preserveViewport={false} />);
    const setViewport = cameraSpy();
    measure(); flush(); expect(setViewport).toHaveBeenCalled(); setViewport.mockClear(); pan();

    view.rerender(<Harness preserveViewport />); flush();
    resize(700, 420); // Opening a trace header or sidebar changes the pane, not the viewer's intent.
    expect(setViewport).not.toHaveBeenCalled();
    expect(store.getState().transform).toEqual([31, -42, .43]);

    view.rerender(<Harness preserveViewport={false} />); flush();
    expect(setViewport).not.toHaveBeenCalled(); // A policy toggle alone is not a fit request.
    resize(680, 410);
    expect(setViewport).toHaveBeenCalledTimes(1); // Explicit false retains the existing resize behavior.

    setViewport.mockClear(); pan();
    view.rerender(<Harness preserveViewport intent="exact-child-scope" />); flush();
    expect(setViewport).toHaveBeenCalledTimes(1);
    expect(store.getState().transform).not.toEqual([31, -42, .43]);
  });

  it("still performs the first fit when an initially hidden preserved chart becomes ready", () => {
    area.width = 0;
    render(<Harness preserveViewport />);
    const setViewport = cameraSpy();
    measure(); flush(); expect(setViewport).not.toHaveBeenCalled();
    resize(800, 500);
    expect(setViewport).toHaveBeenCalledTimes(1);
    setViewport.mockClear();
    resize(760, 460);
    expect(setViewport).toHaveBeenCalledTimes(1); // The auto-owned camera still follows its container.
  });

  it("keeps a manually panned TracedFlow camera on trace entry, follow, return and exit container resizes", () => {
    const chart = (traceWorkflow: TraceWorkflowOverlay | null, currentGraph = graph) => <TracedFlow
      graph={currentGraph} layout="passthrough" traceWorkflow={traceWorkflow}
    ><Probe /></TracedFlow>;
    const view = render(chart(null));
    const setViewport = cameraSpy();
    measure(); flush(); expect(setViewport).toHaveBeenCalled(); setViewport.mockClear(); pan();

    view.rerender(chart(investigation)); resize(700, 450);
    view.rerender(chart({ ...investigation, questionKey: "input", focusRuntimeStageId: "a#0" })); resize(680, 430);
    view.rerender(chart(investigation)); resize(700, 450);
    view.rerender(chart(null)); resize(800, 500);
    expect(setViewport).not.toHaveBeenCalled();
    expect(store.getState().transform).toEqual([31, -42, .43]);

    // Selecting a different actual workflow is still a new topology/layout intent.
    const child: TraceGraph = { nodes: [{ ...graph.nodes[0], id: "child/a" }], edges: [] };
    view.rerender(chart(null, child)); measure(); flush();
    expect(setViewport).toHaveBeenCalledTimes(1);
  });
});
