/** @vitest-environment jsdom */
import { useEffect } from "react";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { Handle, Position, useStoreApi, type EdgeProps, type NodeProps } from "@xyflow/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ExplainableShell, TraceViewer, type ExplainableShellProps, type StageSnapshot } from "footprint-explainable-ui";
import {
  TraceFlow, TracedFlow, IsometricStageNode, IsometricEdge, IsometricGrid,
  type RuntimeOverlay, type TraceGraph, type TraceWorkflowOverlay,
} from "footprint-explainable-ui/flowchart";
import recordings from "../../examples/local-playground/recordings.json";

// These tests supply measured graph geometry directly. jsdom has no browser
// layout/DOMMatrix; leave native handle-refresh frames to the browser checks.
beforeEach(() => {
  vi.stubGlobal("requestAnimationFrame", () => 0);
  vi.stubGlobal("cancelAnimationFrame", () => {});
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

const node = (id: string) => ({ id, type: "stage", position: { x: 25, y: 60 }, data: {
  label: id, isDecider: false, isFork: false, isStreaming: false, isSubflow: false, prevIds: [], nextIds: [],
} });
const graph: TraceGraph = { nodes: [node("seed"), node("total")], edges: [
  { id: "next", source: "seed", target: "total", data: { kind: "next" } },
] };
const overlay: RuntimeOverlay = { running: false, errors: new Map(), executionOrder: ["seed", "total"].map((stageId, index) => ({
  stageId, runtimeStageId: `${stageId}#${index}`, stageName: stageId, timestampMs: index,
})) };
type Store = ReturnType<typeof useStoreApi>;
function measure(store: Store) {
  act(() => {
    const lookup = store.getState().nodeLookup;
    for (const stage of lookup.values()) {
      stage.measured = { width: 168, height: 116 };
      stage.internals.handleBounds = {
        source: [{ nodeId: stage.id, type: "source", position: Position.Right, x: 118, y: 74, width: 8, height: 8 }],
        target: [{ nodeId: stage.id, type: "target", position: Position.Left, x: 42, y: 36, width: 8, height: 8 }],
      };
    }
    store.setState({ nodeLookup: new Map(lookup), width: 800, height: 500 });
  });
}

type ChartView = Parameters<NonNullable<ExplainableShellProps["renderFlowchart"]>>[0];
const SPLIT = { columns: "2fr 1fr", rows: "auto 1fr 1fr", areas: [
  ["timeTravel", "timeTravel"], ["flowchart", "developer"], ["flowchart", "commentary"],
] } as const;
function recording() {
  const visits = ["seed", "quote", "finish"];
  const snapshots: StageSnapshot[] = visits.map((id, index) => ({ stageName: id, stageLabel: id,
    runtimeStageId: `${id}#${index}`, memory: { count: index + 2 }, narrative: "", startMs: index, durationMs: 1 }));
  const executionTree = visits.reduceRight<Record<string, unknown> | undefined>((next, id, index) => ({
    id, name: id, runtimeStageId: `${id}#${index}`, stageReads: index ? { count: index + 1 } : {},
    stageWrites: { count: index + 2 }, ...(next ? { next } : {}),
  }), undefined);
  const runtimeSnapshot = { runId: "renderer-switch", sharedState: { count: 4 }, executionTree, commitLog: visits.map((id, index) => ({
    stage: id, stageId: id, runtimeStageId: `${id}#${index}`, overwrite: { count: index + 2 }, updates: {},
    trace: [{ path: "count", verb: "set", readKeys: index ? ["count"] : [] }],
  })) };
  return { snapshots, runtimeSnapshot };
}
function ProbeChart({ chart, mounted, unmounted }: { chart: ChartView; mounted: () => void; unmounted: () => void }) {
  useEffect(() => { mounted(); return unmounted; }, [mounted, unmounted]);
  return <output aria-label="Consumer chart" data-renderer={chart.renderer} data-scope={chart.currentSubflowId ?? "root"}>
    {chart.snapshots[chart.selectedIndex]?.runtimeStageId}
  </output>;
}

describe("built-in isometric public integration", () => {
  it("exposes reusable public drawing components without a separate example stylesheet", () => {
    expect(recordings.scenarios.map(scenario => scenario.id).sort()).toEqual(["linear", "loop", "parallel", "pricing", "retry", "shipping", "subflows"]);
    expect(typeof IsometricStageNode).toBe("function");
    expect(typeof IsometricEdge).toBe("function");
    expect(typeof IsometricGrid).toBe("function");
    const chart = render(<TraceFlow graph={graph} renderer="isometric" layout="passthrough" />);
    const stage = chart.container.querySelector<HTMLElement>('[data-fp="isometric-stage-node"]')!;
    expect(stage).toBeTruthy();
    expect(stage.style.width).toBe("168px");
    expect(stage.style.height).toBe("116px");
    expect(stage.querySelector("svg")).toBeTruthy();
    expect(stage.querySelectorAll(".react-flow__handle")).toHaveLength(2);
  });

  it.each(recordings.scenarios.map(scenario => scenario.id))("uses the built-in renderer for the real %s workflow without changing its recording", id => {
    const scenario = recordings.scenarios.find(value => value.id === id)!;
    const before = JSON.stringify(scenario);
    const recordedOverlay = { ...scenario.runtimeOverlay, errors: new Map(scenario.runtimeOverlay.errors as [string, string][]),
      retryAttempts: new Map((scenario.runtimeOverlay.retryAttempts ?? []) as [string, number][]) } as RuntimeOverlay;
    const chart = render(<TracedFlow graph={scenario.traceGraph as TraceGraph} overlay={recordedOverlay}
      renderer="isometric" scrubIndex={0} autoFit={false} />);
    expect(chart.container.querySelectorAll('[data-fp="isometric-stage-node"]').length).toBeGreaterThan(0);
    expect(chart.container.querySelector('[data-fp="isometric-stage-node"][data-active="true"]')).toBeTruthy();
    expect(JSON.stringify(scenario)).toBe(before);
  });

  it("keeps unique floor patterns in world coordinates and honors explicit background/unstyled choices", () => {
    const stores: Store[] = [];
    function StoreProbe({ index }: { index: number }) { stores[index] = useStoreApi(); return null; }
    const views = (unstyled = false, background?: false) => <>
      <TracedFlow graph={graph} renderer="isometric" autoFit={false} unstyled={unstyled} background={background}><StoreProbe index={0} /></TracedFlow>
      <TracedFlow graph={graph} renderer="isometric" autoFit={false}><StoreProbe index={1} /></TracedFlow>
    </>;
    const mounted = render(views());
    stores.forEach(measure);
    const floors = mounted.container.querySelectorAll<SVGSVGElement>("svg.iso-floor");
    expect(floors).toHaveLength(2);
    const ids = [...floors].map(floor => floor.querySelector("pattern")!.id);
    expect(new Set(ids).size).toBe(2);
    expect(floors[0].style.pointerEvents).toBe("none");
    expect(floors[0].closest(".react-flow__viewport")).toBeTruthy();
    expect(floors[0].querySelector("pattern")!.getAttribute("patternUnits")).toBe("userSpaceOnUse");
    expect(floors[0].querySelector("image, canvas")).toBeNull();
    act(() => stores[0].setState({ transform: [160, 80, 2] }));
    expect(floors[0].getAttribute("viewBox")).toBe("-144 -72 528 314");
    mounted.rerender(views(false, false));
    expect(mounted.container.querySelectorAll("svg.iso-floor")).toHaveLength(1);
    mounted.rerender(views(true));
    expect(mounted.container.querySelectorAll("svg.iso-floor")).toHaveLength(1);
  });

  it("lets explicit layouts and host node/edge renderers win while retaining recorded-read and loop edge types", async () => {
    let store!: Store;
    function StoreProbe() { store = useStoreApi(); return null; }
    const CustomNode = vi.fn(({ data }: NodeProps) => <div data-fp="consumer-node">
      <Handle type="target" position={Position.Left} />{String(data.label)}<Handle type="source" position={Position.Right} />
    </div>);
    const CustomEdge = vi.fn((props: EdgeProps) => <path data-fp="consumer-edge" d={`M${props.sourceX},${props.sourceY}L${props.targetX},${props.targetY}`} style={props.style} />);
    const customGraph: TraceGraph = { ...graph, edges: [
      { ...graph.edges[0], type: "brand", markerEnd: "brand-arrow", style: { stroke: "purple", strokeWidth: 5 },
        data: { kind: "next", consumerField: "kept" } },
      { id: "loop", source: "total", target: "seed", data: { kind: "loop" } },
    ] };
    const workflow: TraceWorkflowOverlay = { questionKey: "answer", scopeKey: "[]", focusRuntimeStageId: "total#1",
      stages: [{ stageId: "seed", runtimeStageId: "seed#0", role: "input", color: "teal", values: [] },
        { stageId: "total", runtimeStageId: "total#1", role: "question", color: "purple", values: [] }],
      reads: [{ sourceRuntimeStageId: "seed#0", targetRuntimeStageId: "total#1", key: "input", color: "teal" }] };
    const layout = vi.fn((input: TraceGraph) => ({ ...input, nodes: input.nodes.map(stage => ({ ...stage, position: { x: 123, y: 456 } })) }));
    const mounted = render(<TracedFlow graph={customGraph} renderer="isometric" overlay={overlay} scrubIndex={1}
      traceWorkflow={workflow} layout={layout} autoFit={false} nodeTypes={{ stageNode: CustomNode }} edgeTypes={{ brand: CustomEdge }}><StoreProbe /></TracedFlow>);
    measure(store);
    measure(store);
    expect(layout).toHaveBeenCalled();
    expect(store.getState().nodes.every(stage => stage.position.x === 123 && stage.position.y === 456)).toBe(true);
    expect(mounted.container.querySelector('[data-fp="consumer-node"]')).toBeTruthy();
    expect(mounted.container.querySelector('[data-fp="isometric-stage-node"]')).toBeNull();
    expect(store.getState().edges.find(edge => edge.id === "next")).toMatchObject({ type: "brand", markerEnd: "brand-arrow",
      data: { consumerField: "kept" }, style: { stroke: "purple", strokeWidth: 5 } });
    expect(store.getState().edges.find(edge => edge.id === "loop")?.type).toBe("loopBack");
    expect(store.getState().edges.some(edge => edge.type === "recordedRead")).toBe(true);
    await waitFor(() => expect(mounted.container.querySelector('[data-fp="consumer-edge"]')).toBeTruthy());
  });

  it("switches scoped drawings in concurrent charts without ReactFlow registry churn", () => {
    const stores: Store[] = [];
    function StoreProbe({ index }: { index: number }) { stores[index] = useStoreApi(); return null; }
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const views = (left: "flat" | "isometric", right: "flat" | "isometric") => <>
      <section aria-label="Left chart"><TracedFlow graph={graph} renderer={left} overlay={overlay} scrubIndex={1}
        layout="passthrough" autoFit={false}><StoreProbe index={0} /></TracedFlow></section>
      <section aria-label="Right chart"><TraceFlow graph={graph} renderer={right}
        layout="passthrough"><StoreProbe index={1} /></TraceFlow></section>
    </>;
    const mounted = render(views("flat", "isometric"));
    const left = screen.getByRole("region", { name: "Left chart" });
    const right = screen.getByRole("region", { name: "Right chart" });
    expect(left.querySelector('[data-fp="isometric-stage-node"]')).toBeNull();
    expect(right.querySelector('[data-fp="isometric-stage-node"]')).toBeTruthy();
    const originalNode = left.querySelector('.react-flow__node[data-id="seed"]');
    const onError = [vi.fn(), vi.fn()];
    act(() => stores.forEach((store, index) => store.setState({ onError: onError[index] })));
    for (let pass = 0; pass < 3; pass++) {
      mounted.rerender(views("isometric", "flat"));
      expect(left.querySelector('[data-fp="isometric-stage-node"][data-active="true"]')?.textContent).toContain("total");
      expect(right.querySelector('[data-fp="isometric-stage-node"]')).toBeNull();
      expect(left.querySelector('.react-flow__node[data-id="seed"]')).toBe(originalNode);
      expect(stores[0].getState().nodeLookup.get("seed")!.type).toBe("stageNode");
      mounted.rerender(views("flat", "isometric"));
      expect(left.querySelector('[data-fp="isometric-stage-node"]')).toBeNull();
      expect(right.querySelector('.react-flow__node[data-id="seed"] [data-fp="isometric-stage-node"]')?.textContent).toContain("seed");
    }
    // ReactFlow's real watcher compares registry component identities and
    // reports error002 when a renderer replaces a registered component.
    for (const error of onError) expect(error.mock.calls.some(call => call[0] === "002")).toBe(false);
    expect(warn.mock.calls.flat().join(" ")).not.toMatch(/error#002|new nodeTypes or edgeTypes/);
  });

  it("defaults to flat, reads JSON renderer configuration, and lets an explicit prop override it", () => {
    const run = recording();
    const chart = vi.fn((view: ChartView) => <output aria-label="Renderer override">{view.renderer}</output>);
    const mounted = render(<ExplainableShell {...run} renderFlowchart={chart} />);
    expect(screen.getByLabelText("Renderer override").textContent).toBe("flat");
    mounted.rerender(<ExplainableShell {...run} layout={{ ...SPLIT, flowchart: { renderer: "isometric" } }} renderFlowchart={chart} />);
    expect(screen.getByLabelText("Renderer override").textContent).toBe("isometric");
    mounted.rerender(<ExplainableShell {...run} layout={{ ...SPLIT, flowchart: { renderer: "isometric" } }}
      flowchart={{ renderer: "flat" }} renderFlowchart={chart} />);
    expect(screen.getByLabelText("Renderer override").textContent).toBe("flat");
    expect(mounted.container.querySelector(".react-flow")).toBeNull(); // The custom renderer remains the final chart override.
  });

  it("forwards TraceViewer renderer options and JSON precedence through the same public composition", () => {
    const run = recording();
    const chart = (view: ChartView) => <output aria-label="Viewer renderer">{view.renderer}</output>;
    const mounted = render(<TraceViewer recording={{ snapshot: run.runtimeSnapshot }} layout={{ ...SPLIT, flowchart: { renderer: "isometric" } }} renderFlowchart={chart} />);
    expect(screen.getByLabelText("Viewer renderer").textContent).toBe("isometric");
    mounted.rerender(<TraceViewer recording={{ snapshot: run.runtimeSnapshot }} layout={{ ...SPLIT, flowchart: { renderer: "isometric" } }}
      flowchart={{ renderer: "flat" }} renderFlowchart={chart} />);
    expect(screen.getByLabelText("Viewer renderer").textContent).toBe("flat");
  });

  it("preserves the replay cursor, Activity selection and Backtrack question while switching renderer", () => {
    const run = recording(), mountedChart = vi.fn(), unmountedChart = vi.fn();
    const chart = (view: ChartView) => <ProbeChart chart={view} mounted={mountedChart} unmounted={unmountedChart} />;
    const props = { ...run, layout: SPLIT, renderFlowchart: chart };
    const mounted = render(<ExplainableShell {...props} />);
    fireEvent.change(screen.getByRole("slider"), { target: { value: "1" } });
    const originalChart = screen.getByLabelText("Consumer chart");
    const activity = screen.getByRole("region", { name: "Stage activity" });
    fireEvent.click(within(activity).getByRole("button", { name: "Inspect write count" }));
    const inspector = within(activity).getByRole("complementary", { name: "Variable inspector" });
    fireEvent.click(within(inspector).getByRole("button", { name: "Backtrack write count" }));
    expect(screen.getByRole("toolbar", { name: "Tracing count" })).toBeTruthy();
    mounted.rerender(<ExplainableShell {...props} flowchart={{ renderer: "isometric" }} />);
    expect(screen.getByLabelText("Consumer chart")).toBe(originalChart);
    expect(originalChart.getAttribute("data-renderer")).toBe("isometric");
    expect(originalChart.textContent).toBe("quote#1");
    expect(mounted.container.querySelector('[data-fp="trace-walk-card"]')?.textContent).toContain("wrote count = 3");
    expect(screen.getByRole("toolbar", { name: "Tracing count" })).toBeTruthy();
    mounted.rerender(<ExplainableShell {...props} flowchart={{ renderer: "flat" }} />);
    fireEvent.click(mounted.container.querySelector('[data-fp="tt-exit-tracing"]')!);
    expect(screen.getByLabelText("Consumer chart").textContent).toBe("quote#1");
    expect(screen.getByRole("region", { name: "Stage activity" }).textContent).toContain("quote#1");
    expect(mountedChart).toHaveBeenCalledTimes(1);
    expect(unmountedChart).not.toHaveBeenCalled();
  });

  it("preserves an exact drilled invocation and its selected visit across renderer changes", () => {
    const scenario = recordings.scenarios.find(value => value.id === "subflows")!;
    let current!: ChartView;
    const chart = (view: ChartView) => { current = view; return <output aria-label="Drilled chart">{view.currentSubflowId}:{view.snapshots[view.selectedIndex]?.runtimeStageId}</output>; };
    const props = { runtimeSnapshot: scenario.runtimeSnapshot as unknown as NonNullable<ExplainableShellProps["runtimeSnapshot"]>, traceGraph: scenario.traceGraph as TraceGraph, renderFlowchart: chart };
    const mounted = render(<ExplainableShell {...props} />);
    act(() => current.onSubflowChange?.("pipeline/prepare"));
    expect(current.currentSubflowId).toBe("pipeline/prepare");
    const visit = current.snapshots[current.selectedIndex]?.runtimeStageId;
    expect(visit).toBeTruthy();
    const originalChart = screen.getByLabelText("Drilled chart");
    mounted.rerender(<ExplainableShell {...props} flowchart={{ renderer: "isometric" }} />);
    expect(current.renderer).toBe("isometric");
    expect(current.currentSubflowId).toBe("pipeline/prepare");
    expect(current.snapshots[current.selectedIndex]?.runtimeStageId).toBe(visit);
    expect(screen.getByLabelText("Drilled chart")).toBe(originalChart);
  });
});
