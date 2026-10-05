/** @vitest-environment jsdom */
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ChartFitNode, ChartFitState } from "../../src/components/FlowchartView/_internal/chartFitGeometry";
import { chartFitViewport } from "../../src/components/FlowchartView/_internal/chartFitGeometry";
import { useChartAutoRefit } from "../../src/components/FlowchartView/_internal/useChartAutoRefit";

const mock = vi.hoisted(() => ({ store: null as unknown, setViewport: vi.fn() }));
vi.mock("@xyflow/react", async (importOriginal) => ({
  ...await importOriginal<typeof import("@xyflow/react")>(),
  useStoreApi: () => mock.store,
  useReactFlow: () => ({ setViewport: mock.setViewport }),
}));

const node = (width = 100, height = 40, x = 20, y = 30): ChartFitNode => ({
  measured: { width, height }, internals: { positionAbsolute: { x, y } },
});
function box(width = 800, height = 600) {
  const area = { width, height };
  const element = document.createElement("div");
  element.getBoundingClientRect = () => ({ ...area } as DOMRect);
  return { element, area };
}
type State = ChartFitState & { domNode: HTMLElement | null; panZoom: object | null; transform: [number, number, number] };
let state: State;
let wrapper: ReturnType<typeof box>;
let pane: ReturnType<typeof box>;
let nodes: Map<string, ChartFitNode>;
let listeners: Set<(state: State) => void>;
let frames: Map<number, FrameRequestCallback>;
let observers: TestResizeObserver[];
let raf: number;
class TestResizeObserver {
  observed = new Set<Element>();
  disconnected = false;
  constructor(readonly callback: () => void) { observers.push(this); }
  observe(element: Element) { this.observed.add(element); }
  unobserve(element: Element) { this.observed.delete(element); }
  disconnect() { this.disconnected = true; this.observed.clear(); }
}
function emit(update: Partial<State> = {}) {
  act(() => {
    state = { ...state, ...update };
    listeners.forEach((listener) => listener(state));
  });
}
function flush() {
  act(() => {
    const queued = [...frames.values()];
    frames.clear();
    queued.forEach((callback) => callback(0));
  });
}
function resize() { act(() => observers.filter((observer) => !observer.disconnected).forEach((observer) => observer.callback())); }
function mount(key = "root", padding = 0.18) {
  const wrapperRef = { current: wrapper.element };
  return renderHook(
    (props: { key: string; padding: number; layoutKey?: string }) => useChartAutoRefit({ wrapperRef, refitKey: props.key, padding: props.padding, layoutKey: props.layoutKey }),
    { initialProps: { key, padding } as { key: string; padding: number; layoutKey?: string } },
  );
}
beforeEach(() => {
  raf = 0; frames = new Map(); listeners = new Set(); observers = [];
  wrapper = box(); pane = box(); nodes = new Map([["a", node()]]);
  state = { width: 800, height: 600, minZoom: 0.1, maxZoom: 2, nodeLookup: nodes, domNode: pane.element, panZoom: {}, transform: [0, 0, 1] };
  mock.store = { getState: () => state, subscribe: (listener: (state: State) => void) => {
    listeners.add(listener); return () => { listeners.delete(listener); };
  } };
  mock.setViewport.mockReset().mockImplementation((viewport: { x: number; y: number; zoom: number }) => {
    state = { ...state, transform: [viewport.x, viewport.y, viewport.zoom] };
    listeners.forEach((listener) => listener(state));
    return Promise.resolve(true);
  });
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { frames.set(++raf, callback); return raf; });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => { frames.delete(id); });
  vi.stubGlobal("ResizeObserver", TestResizeObserver);
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("measured chart auto-refit", () => {
  it("does not fit a zero-size hidden chart before it is measurable (REGRESSION)", () => {
    wrapper.area.width = 0;
    mount(); flush();
    expect(mock.setViewport).not.toHaveBeenCalled();
    expect(frames.size).toBe(0);
    wrapper.area.width = 800;
    resize(); flush();
    expect(mock.setViewport).toHaveBeenCalledTimes(1);
  });

  it("applies a finite target immediately, without a queued fit or animated extent read", () => {
    mount();
    expect(mock.setViewport).not.toHaveBeenCalled();
    flush();
    expect(mock.setViewport).toHaveBeenCalledExactlyOnceWith(chartFitViewport(state, 0.18), { duration: 0 });
    expect(frames.size).toBe(0);
    expect(observers[0].observed).toEqual(new Set([wrapper.element, pane.element]));
  });

  it("checks the actual flow pane even with positive wrapper and stale positive store sizes", () => {
    pane.area.height = 0;
    mount(); flush();
    expect(mock.setViewport).not.toHaveBeenCalled();
    pane.area.height = 600;
    resize(); flush();
    expect(mock.setViewport).toHaveBeenCalledTimes(1);
  });

  it("waits for late in-place measurements instead of assuming two frames are sufficient", () => {
    nodes.set("a", node(0));
    mount();
    flush(); flush(); flush(); flush();
    expect(mock.setViewport).not.toHaveBeenCalled();
    expect(frames.size).toBe(0);
    nodes.set("a", node()); // The SAME Map; only its content changed.
    emit(); flush();
    expect(mock.setViewport).toHaveBeenCalledTimes(1);
  });

  it("requires every visible node, but ignores unmeasured hidden nodes", () => {
    nodes.set("b", node(0));
    mount(); flush();
    expect(mock.setViewport).not.toHaveBeenCalled();
    nodes.set("b", { ...node(0), hidden: true });
    emit(); flush();
    expect(mock.setViewport).toHaveBeenCalledTimes(1);
  });

  it("waits for viewport initialization and actual store size signals", () => {
    state = { ...state, panZoom: null, width: 0 };
    mount(); flush();
    expect(mock.setViewport).not.toHaveBeenCalled();
    emit({ panZoom: {} }); flush();
    expect(mock.setViewport).not.toHaveBeenCalled();
    emit({ width: 800 }); flush();
    expect(mock.setViewport).toHaveBeenCalledTimes(1);
  });

  it("rechecks hiding and replacement geometry after a frame was queued", () => {
    mount();
    pane.area.width = 0; // Hidden between the request and callback.
    flush();
    expect(mock.setViewport).not.toHaveBeenCalled();
    pane.area.width = 800;
    resize();
    nodes.set("a", node(Infinity)); // Graph changes before callback, no store notification needed.
    flush();
    expect(mock.setViewport).not.toHaveBeenCalled();
    expect(frames.size).toBe(0);
  });

  it("same-size resize can wake an existing fit after a transient hidden frame", () => {
    mount();
    pane.area.width = 0; flush(); // Hidden with no ResizeObserver callback.
    expect(mock.setViewport).not.toHaveBeenCalled();
    pane.area.width = 800; // Returns to the previously known size.
    resize(); flush();
    expect(mock.setViewport).toHaveBeenCalledTimes(1);
  });

  it("coalesces resize and store signals and reads latest dimensions", () => {
    mount(); resize(); resize();
    emit({ width: 600 }); emit({ width: 400 });
    expect(frames.size).toBe(1);
    flush();
    expect(mock.setViewport).toHaveBeenCalledExactlyOnceWith(chartFitViewport(state, 0.18), { duration: 0 });
  });

  it("preserves the camera on pan, node dragging, overlay events and stable rerenders", () => {
    const view = mount(); flush(); mock.setViewport.mockClear();
    emit(); // A store update unrelated to geometry, e.g. pan/selection/overlay.
    nodes.set("a", node(100, 40, 400, 500)); emit(); // Dragging changes position only.
    view.rerender({ key: "root", padding: 0.18 });
    expect(frames.size).toBe(0);
    expect(mock.setViewport).not.toHaveBeenCalled();
  });

  it("measurement loss/recovery after overlay adoption is not a new fit intent", () => {
    mount(); flush(); mock.setViewport.mockClear();
    nodes.set("a", { ...node(), measured: undefined }); emit(); flush();
    nodes.set("a", node()); emit(); flush();
    expect(mock.setViewport).not.toHaveBeenCalled();
  });

  it("manual camera ownership survives badge remeasurement and derived layout changes", () => {
    const view = mount(); flush(); mock.setViewport.mockClear();
    emit({ transform: [31, -42, 0.43] });
    nodes.set("a", { ...node(), measured: undefined }); emit(); flush();
    nodes.set("a", node(179, 40)); emit();
    view.rerender({ key: "root", padding: 0.18, layoutKey: "remeasured-layout" });
    resize(); // Same-size observer / synthetic resize is not a new intent either.
    act(() => window.dispatchEvent(new Event("resize")));
    flush();
    expect(mock.setViewport).not.toHaveBeenCalled();
    expect(state.transform).toEqual([31, -42, 0.43]);
    view.rerender({ key: "new-drill-scope", padding: 0.18, layoutKey: "new-drill-layout" });
    flush();
    expect(mock.setViewport).toHaveBeenCalledTimes(1);
  });

  it("real container size changes reacquire fit intent after a manual camera gesture", () => {
    mount(); flush(); mock.setViewport.mockClear();
    emit({ transform: [31, -42, 0.43] });
    resize(); flush();
    expect(mock.setViewport).not.toHaveBeenCalled();
    pane.area.width = 600;
    emit({ width: 600 }); resize(); flush();
    expect(mock.setViewport).toHaveBeenCalledTimes(1);
  });

  it("refits on an explicit drill/layout key and uses the new bounds", () => {
    const view = mount(); flush(); mock.setViewport.mockClear();
    nodes.set("a", node(100, 40, 700, 800));
    view.rerender({ key: "child", padding: 0.18 });
    flush();
    expect(mock.setViewport).toHaveBeenCalledExactlyOnceWith(chartFitViewport(state, 0.18), { duration: 0 });
  });

  it("updates the observed pane when its provider replaces the DOM node", () => {
    mount(); flush(); mock.setViewport.mockClear();
    const previous = pane.element;
    pane = box(); emit({ domNode: pane.element }); flush();
    expect(observers[0].observed.has(previous)).toBe(false);
    expect(observers[0].observed.has(pane.element)).toBe(true);
    expect(mock.setViewport).toHaveBeenCalledTimes(1);
  });

  it("cancels pending frames and detaches listeners on unmount or superseded layout", () => {
    const view = mount();
    const previousObserver = observers[0];
    view.rerender({ key: "new-layout", padding: 0.18 });
    expect(previousObserver.disconnected).toBe(true);
    expect(listeners.size).toBe(1);
    expect(frames.size).toBe(1);
    view.unmount();
    expect(listeners.size).toBe(0);
    expect(frames.size).toBe(0);
    act(() => window.dispatchEvent(new Event("resize")));
    previousObserver.callback(); // A late callback cannot revive a disposed owner.
    flush();
    expect(mock.setViewport).not.toHaveBeenCalled();
  });

  it("invalid padding leaves the viewport untouched and does not poll", () => {
    const view = mount("root", Infinity); flush();
    expect(mock.setViewport).not.toHaveBeenCalled();
    expect(frames.size).toBe(0);
    view.rerender({ key: "root", padding: 0 }); flush();
    expect(mock.setViewport).toHaveBeenCalledTimes(1);
  });

  it("keeps window-resize support when ResizeObserver is unavailable", () => {
    vi.stubGlobal("ResizeObserver", undefined);
    mount(); flush(); mock.setViewport.mockClear();
    pane.area.width = 900;
    act(() => window.dispatchEvent(new Event("resize"))); flush();
    expect(mock.setViewport).toHaveBeenCalledTimes(1);
  });
});
