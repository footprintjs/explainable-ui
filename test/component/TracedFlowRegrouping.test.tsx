/** @vitest-environment jsdom */
import { useState } from "react";
import { Position, useStoreApi } from "@xyflow/react";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TracedFlow } from "../../src/components/FlowchartView/TracedFlow";
import type { TraceGraph, TraceNode } from "../../src/components/FlowchartView/traceStructureRecorder";

const roots = ["seed", "first", "second", "pipeline", "report"];
function node(id: string, label: string, subflowOf?: string): TraceNode {
  const mount = id === "first" || id === "second" || id === "pipeline" || id === "second/nested";
  return { id, type: "stage", position: { x: 0, y: 0 }, data: {
    label, isDecider: false, isFork: false, isStreaming: false,
    isSubflow: mount, ...(mount ? { subflowId: id } : {}),
    ...(subflowOf ? { subflowOf } : {}), prevIds: [], nextIds: [],
  } };
}
const graph: TraceGraph = {
  nodes: [node("seed", "Seed"), node("first", "Prepare"), node("second", "Prepare"),
    node("pipeline", "Pipeline"), node("report", "Report"),
    node("second/read", "Read", "second"), node("second/write", "Write", "second"),
    node("second/nested", "Nested", "second"), node("second/nested/leaf", "Leaf", "second/nested")],
  edges: [...roots.slice(1).map((target, index) => ({ id: `${roots[index]}-${target}`,
    source: roots[index], target, data: { kind: "next" as const } })),
    { id: "inner", source: "second/read", target: "second/write", data: { kind: "next" } },
    { id: "inner-nested", source: "second/write", target: "second/nested", data: { kind: "next" } }],
};

let frames: Map<number, FrameRequestCallback>;
let nextFrame: number;
let store!: ReturnType<typeof useStoreApi>;
function Probe() { store = useStoreApi(); return null; }
function Harness() {
  const [grouped, setGrouped] = useState(false);
  const [nestedGrouped, setNestedGrouped] = useState(false);
  const [outer, setOuter] = useState(false);
  const [scope, setScope] = useState<string | null>(null);
  return <><label><input type="checkbox" aria-label="Group Prepare (second)" checked={grouped}
    onChange={event => setGrouped(event.target.checked)} />Group Prepare (second)</label>
    <label><input type="checkbox" aria-label="Group nested" checked={nestedGrouped}
      onChange={event => setNestedGrouped(event.target.checked)} />Group nested</label>
    <label><input type="checkbox" aria-label="Outer workflow box" checked={outer}
      onChange={event => setOuter(event.target.checked)} />Outer workflow box</label>
    <button onClick={() => setScope("second")}>Open second scope</button>
    <button onClick={() => setScope("second/nested")}>Open nested scope</button>
    <button onClick={() => setScope(null)}>Return root</button>
    <TracedFlow graph={graph} currentSubflowId={scope} onSubflowChange={setScope}
      groupedSubflows={scope === null && grouped ? ["second"] : scope === "second" && nestedGrouped ? ["second/nested"] : []}
      mainChartBox={outer ? { label: "Workflow" } : undefined}><Probe /></TracedFlow></>;
}

beforeEach(() => {
  frames = new Map(); nextFrame = 0;
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    frames.set(++nextFrame, callback); return nextFrame;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal("DOMMatrixReadOnly", class { readonly m22 = 1; });
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(() => ({
    width: 800, height: 500, x: 0, y: 0, left: 0, top: 0, right: 800, bottom: 500, toJSON() {},
  }));
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function flushFrames() {
  act(() => {
    const pending = [...frames.values()]; frames.clear();
    for (const frame of pending) frame(0);
  });
}

/** Model the browser's measurement of the live wrapper, including stamped size. */
function measureAndSettle() {
  for (let pass = 0; pass < 6; pass++) {
    act(() => {
      const { nodeLookup } = store.getState();
      for (const current of nodeLookup.values()) {
        const width = typeof current.style?.width === "number" ? current.style.width : 120;
        const height = typeof current.style?.height === "number" ? current.style.height : 60;
        current.measured = { width, height };
        current.internals.handleBounds = {
          source: [{ nodeId: current.id, type: "source", position: Position.Bottom,
            x: width / 2 - 4, y: height - 4, width: 8, height: 8 }],
          target: [{ nodeId: current.id, type: "target", position: Position.Top,
            x: width / 2 - 4, y: -4, width: 8, height: 8 }],
        };
      }
      store.setState({ nodeLookup: new Map(nodeLookup), width: 800, height: 500 });
    });
    flushFrames();
    flushFrames();
  }
}

function rootGeometry() {
  return roots.map(id => {
    const current = store.getState().nodes.find(candidate => candidate.id === id)!;
    return { id, type: current.type, x: current.position.x, y: current.position.y,
      width: current.style?.width, height: current.style?.height };
  });
}

describe("TracedFlow regrouping measured cards", () => {
  it("restores compact cards and the fitted viewport after repeatedly ungrouping a same-name mount", () => {
    const view = render(<Harness />);
    const setViewport = vi.spyOn(store.getState().panZoom!, "setViewport").mockImplementation(async viewport => {
      store.setState({ transform: [viewport.x, viewport.y, viewport.zoom] });
      return undefined;
    });
    measureAndSettle();
    const baseline = rootGeometry();
    const initialViewport = [...store.getState().transform];
    expect(baseline.every(current => current.height === 60 && current.width === 120)).toBe(true);
    expect(initialViewport[2]).toBeGreaterThan(0.5);
    expect(setViewport).toHaveBeenCalled();
    expect(view.container.querySelectorAll('.react-flow__node')).toHaveLength(5);

    const checkbox = view.getByRole("checkbox", { name: "Group Prepare (second)" });
    for (let cycle = 0; cycle < 2; cycle++) {
      fireEvent.click(checkbox);
      measureAndSettle();
      const container = store.getState().nodeLookup.get("second")!;
      expect(container.type).toBe("groupContainer");
      expect(container.measured!.height).toBeGreaterThan(60);
      expect(store.getState().nodeLookup.get("first")!.type).toBe("stageNode");
      expect(store.getState().nodeLookup.get("second/read")!.parentId).toBe("second");
      expect(store.getState().nodeLookup.get("second/write")!.parentId).toBe("second");
      expect(store.getState().transform[2]).toBeLessThan(initialViewport[2]);

      fireEvent.click(checkbox);
      measureAndSettle();
      expect(store.getState().nodeLookup.get("second")!.measured).toEqual({ width: 120, height: 60 });
      expect(rootGeometry()).toEqual(baseline);
      expect(view.container.querySelectorAll('.react-flow__node')).toHaveLength(5);
      store.getState().transform.forEach((coordinate, index) => expect(coordinate).toBeCloseTo(initialViewport[index], 6));
    }
  });

  it("keeps intrinsic footprints across outer boxes and nested scope/group switches", () => {
    const view = render(<Harness />);
    vi.spyOn(store.getState().panZoom!, "setViewport").mockImplementation(async viewport => {
      store.setState({ transform: [viewport.x, viewport.y, viewport.zoom] });
      return undefined;
    });
    measureAndSettle();
    const baseline = rootGeometry();
    const initialViewport = [...store.getState().transform];
    const click = (name: string) => {
      fireEvent.click(view.getByRole("checkbox", { name }));
      measureAndSettle();
    };
    const navigate = (name: string) => {
      fireEvent.click(view.getByRole("button", { name }));
      measureAndSettle();
    };
    for (let cycle = 0; cycle < 2; cycle++) {
      click("Outer workflow box");
      click("Group Prepare (second)");
      expect(store.getState().nodeLookup.get("second")!.type).toBe("groupContainer");
      expect(store.getState().nodeLookup.get("second")!.parentId).toBe("__main_chart__");

      navigate("Open second scope");
      expect(store.getState().nodeLookup.has("seed")).toBe(false);
      expect(store.getState().nodeLookup.get("second/nested")!.measured).toEqual({ width: 120, height: 60 });
      click("Group nested");
      expect(store.getState().nodeLookup.get("second/nested")!.type).toBe("groupContainer");
      expect(store.getState().nodeLookup.get("second/nested/leaf")!.parentId).toBe("second/nested");

      navigate("Open nested scope");
      expect(store.getState().nodeLookup.has("second/nested")).toBe(false);
      expect(store.getState().nodeLookup.get("second/nested/leaf")!.measured).toEqual({ width: 120, height: 60 });
      click("Outer workflow box");
      expect(store.getState().nodeLookup.has("__main_chart__")).toBe(false);
      click("Outer workflow box");

      navigate("Open second scope");
      click("Group nested");
      expect(store.getState().nodeLookup.get("second/nested")!.measured).toEqual({ width: 120, height: 60 });
      const childPositions = ["second/read", "second/write", "second/nested"]
        .map(id => store.getState().nodeLookup.get(id)!.position.y);
      expect(childPositions[1] - childPositions[0]).toBe(112);
      expect(childPositions[2] - childPositions[1]).toBe(112);

      navigate("Return root");
      click("Group Prepare (second)");
      expect(store.getState().nodeLookup.get("second")!.measured).toEqual({ width: 120, height: 60 });
      click("Outer workflow box");
      expect(rootGeometry()).toEqual(baseline);
      store.getState().transform.forEach((coordinate, index) => expect(coordinate).toBeCloseTo(initialViewport[index], 6));
    }
  });
});
