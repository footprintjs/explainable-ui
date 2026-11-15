/** @vitest-environment jsdom */
import { act, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Position, useStoreApi } from "@xyflow/react";
import { TracedFlow } from "../../src/components/FlowchartView/TracedFlow";
import type { TraceGraph } from "../../src/components/FlowchartView/traceStructureRecorder";
import type { RuntimeOverlay } from "../../src/components/FlowchartView/createTraceRuntimeOverlay";
import type { TraceWorkflowOverlay } from "../../src/trace/traceWorkflowOverlay";
import { StageNode } from "../../src/components/StageNode";

const graph: TraceGraph = {
  nodes: ["source", "audit", "result"].map((id, index) => ({ id, type: "stage", position: { x: 100, y: index * 150 },
    style: { width: 180, height: 80 }, data: { label: id, isDecider: false, isFork: false, isStreaming: false,
      isSubflow: false, prevIds: [], nextIds: [] } })),
  edges: [ { id: "source-audit", source: "source", target: "audit", data: { kind: "next" } },
    { id: "audit-result", source: "audit", target: "result", data: { kind: "next" } } ],
};
const runtime: RuntimeOverlay = { running: false, errors: new Map([["audit", "failed audit"]]),
  executionOrder: ["source", "audit", "result"].map((stageId, index) => ({ stageId, runtimeStageId: `${stageId}#${index}`,
    stageName: stageId, timestampMs: index })) };
const trace: TraceWorkflowOverlay = { questionKey: "answer", scopeKey: "[]", focusRuntimeStageId: "result#2",
  stages: [ { stageId: "source", runtimeStageId: "source#0", color: "teal", role: "input", values: [{ key: "amount", preview: "7", color: "teal" }] },
    { stageId: "result", runtimeStageId: "result#2", color: "purple", role: "question", values: [{ key: "answer", preview: "14", color: "purple" }] } ],
  reads: [{ key: "amount", sourceRuntimeStageId: "source#0", targetRuntimeStageId: "result#2", color: "teal" }] };

const originalBox = Object.getOwnPropertyDescriptor(SVGElement.prototype, "getBBox");
beforeEach(() => Object.defineProperty(SVGElement.prototype, "getBBox", { configurable: true,
  value: () => ({ x: 0, y: 0, width: 160, height: 16 }) }));
afterEach(() => {
  vi.unstubAllGlobals();
  if (originalBox) Object.defineProperty(SVGElement.prototype, "getBBox", originalBox);
  else delete (SVGElement.prototype as unknown as { getBBox?: unknown }).getBBox;
});

describe("TracedFlow recorded workflow reads", () => {
  it("keeps workflow topology, geometry and execution status while adding a distinct direct static read", async () => {
    let store!: ReturnType<typeof useStoreApi>;
    function Probe() { store = useStoreApi(); return null; }
    const view = (workflow?: TraceWorkflowOverlay) => <TracedFlow graph={graph} overlay={runtime} scrubIndex={2}
      traceWorkflow={workflow} layout="passthrough"><Probe /></TracedFlow>;
    const mounted = render(view());
    const measure = () => act(() => {
      const lookup = store.getState().nodeLookup;
      for (const node of lookup.values()) {
        node.measured = { width: 180, height: 80 };
        node.internals.handleBounds = {
          source: [{ nodeId: node.id, type: "source", position: Position.Bottom, x: 86, y: 76, width: 8, height: 8 }],
          target: [{ nodeId: node.id, type: "target", position: Position.Top, x: 86, y: -4, width: 8, height: 8 }],
        };
      }
      store.setState({ nodeLookup: new Map(lookup), width: 800, height: 600 });
    });
    measure();
    const executionPaths = () => [...mounted.container.querySelectorAll('.react-flow__edge:not([data-id^="recorded-read:"]) .react-flow__edge-path')]
      .map(path => path.getAttribute("d"));
    await waitFor(() => expect(executionPaths()).toHaveLength(2));
    const baselinePaths = executionPaths();
    const baseline = store.getState().nodes.map(node => ({ id: node.id, position: node.position, width: node.style?.width,
      active: node.data.active, done: node.data.done, error: node.data.error }));
    const executionTypes = store.getState().edges.map(edge => [edge.id, edge.type, edge.source, edge.target]);
    act(() => store.setState({ transform: [51, -24, 0.67] }));
    mounted.rerender(view(trace));
    measure();
    expect(store.getState().transform).toEqual([51, -24, 0.67]);
    expect(store.getState().nodes.map(node => ({ id: node.id, position: node.position, width: node.style?.width,
      active: node.data.active, done: node.data.done, error: node.data.error }))).toEqual(baseline);
    expect(executionPaths()).toEqual(baselinePaths);
    expect(store.getState().edges.filter(edge => edge.type !== "recordedRead").map(edge => [edge.id, edge.type, edge.source, edge.target])).toEqual(executionTypes);
    const read = store.getState().edges.find(edge => edge.type === "recordedRead")!;
    expect(read).toMatchObject({ source: "source", target: "result", animated: false,
      data: { key: "amount", sourceRuntimeStageId: "source#0", targetRuntimeStageId: "result#2" } });
    expect(read.style?.strokeDasharray).toBe("6 4");
    expect(mounted.container.querySelector('[data-fp="trace-workflow-read"]')?.getAttribute("aria-label"))
      .toBe("Recorded read amount from source#0 to result#2");
    const label = mounted.container.querySelector<HTMLElement>('[data-fp="trace-workflow-read-label"]')!;
    expect(label.textContent).toBe("amount · recorded read");
    expect(label.style.maxWidth).toBe("220px");
    expect(label.style.height).toBe("20px");
    expect(label.style.textOverflow).toBe("ellipsis");
    expect(store.getState().edges.every(edge => !edge.animated)).toBe(true);
    expect(store.getState().nodeLookup.get("audit")!.style?.opacity).toBe(1);
    expect(store.getState().nodeLookup.get("audit")!.data.error).toBe(true);
    expect(store.getState().nodeLookup.get("source")!.data.done).toBe(true);
    expect(store.getState().nodeLookup.get("result")!.data.active).toBe(true);
    await waitFor(() => expect(mounted.container.querySelector('[data-fp="trace-workflow-role"]')?.textContent).toBeTruthy());
    mounted.rerender(view());
    expect(store.getState().edges.some(edge => edge.type === "recordedRead")).toBe(false);
    expect(store.getState().nodes.every(node => node.data.traceWorkflow === undefined)).toBe(true);
    expect(store.getState().transform).toEqual([51, -24, 0.67]);
  });

  it("keeps context and later trace stages readable without marking them visited", () => {
    const mutedGraph = { ...graph, nodes: graph.nodes.map(node => node.id === "audit"
      ? { ...node, data: { ...node.data, emphasis: "muted" as const } } : node) };
    let store!: ReturnType<typeof useStoreApi>;
    function Probe() { store = useStoreApi(); return null; }
    const chart = (workflow?: TraceWorkflowOverlay) => <TracedFlow graph={mutedGraph} overlay={runtime}
      scrubIndex={0} traceWorkflow={workflow} layout="passthrough"><Probe /></TracedFlow>;
    const mounted = render(chart());
    const stage = (id: string) => mounted.container.querySelector<HTMLElement>(`.react-flow__node[data-id="${id}"] [data-fp="stage-node"]`)!;
    const statuses = () => store.getState().nodes.map(node => ({ id: node.id,
      active: node.data.active, done: node.data.done, error: node.data.error }));
    const baseline = statuses();
    const futureBody = stage("result").querySelector<HTMLElement>('[data-fp="stage-node-body"]')!.style.background;
    expect(store.getState().nodeLookup.get("audit")!.style?.opacity).toBe(0.35);
    expect((stage("audit").firstElementChild as HTMLElement).style.opacity).toBe("0.5");
    expect(mounted.getByText("NOW")).toBeTruthy();

    mounted.rerender(chart(trace));
    expect(statuses()).toEqual(baseline);
    expect(store.getState().nodes.every(node => node.style?.opacity === 1 && node.data.dimmed === false)).toBe(true);
    expect((stage("audit").firstElementChild as HTMLElement).style.opacity).toBe("1");
    expect(stage("audit").getAttribute("data-trace-context")).toBe("outside");
    expect(stage("audit").title).toContain("Outside displayed trace");
    expect(stage("audit").textContent).toContain("Outside displayed trace");
    const caption = stage("audit").querySelector<HTMLElement>('[data-fp="trace-context-caption"]')!;
    expect(caption.style.position).toBe("absolute");
    expect(caption.style.top).toBe("calc(100% + 7px)");
    expect(stage("result").getAttribute("data-trace-context")).toBe("displayed");
    expect(stage("result").querySelector<HTMLElement>('[data-fp="stage-node-body"]')!.style.background).toBe(futureBody);
    expect(store.getState().nodeLookup.get("result")!.data).toMatchObject({ active: false, done: false });
    expect(stage("result").querySelector('[data-fp="trace-workflow-ring"]')).toBeTruthy();
    expect(mounted.getByText("VIEWING")).toBeTruthy();
    expect(mounted.queryByText("NOW")).toBeNull();

    mounted.rerender(chart());
    expect(statuses()).toEqual(baseline);
    expect(store.getState().nodeLookup.get("audit")!.style?.opacity).toBe(0.35);
    expect(store.getState().nodeLookup.get("audit")!.data.dimmed).toBe(true);
    expect((stage("audit").firstElementChild as HTMLElement).style.opacity).toBe("0.5");
    expect(stage("audit").hasAttribute("data-trace-context")).toBe(false);
    expect(mounted.queryByText("Outside displayed trace")).toBeNull();
    expect(mounted.getByText("NOW")).toBeTruthy();
  });

  it.each([{}, { done: true, error: true }])("retains custom-node authored opacity, metadata and status overrides: %j", overrides => {
    const customGraph = { ...graph, nodes: graph.nodes.map(node => node.id === "audit"
      ? { ...node, type: "customStage", style: { ...node.style, opacity: 0.8 },
        data: { ...node.data, ...overrides, customLabel: "host-controlled" } } : node) };
    let store!: ReturnType<typeof useStoreApi>;
    function Probe() { store = useStoreApi(); return null; }
    const nodeTypes = { customStage: StageNode };
    const chart = (workflow?: TraceWorkflowOverlay) => <TracedFlow graph={customGraph} overlay={runtime}
      nodeTypes={nodeTypes} scrubIndex={0} traceWorkflow={workflow} layout="passthrough"><Probe /></TracedFlow>;
    const mounted = render(chart());
    const baseline = store.getState().nodeLookup.get("audit")!;
    const status = { active: baseline.data.active, done: baseline.data.done, error: baseline.data.error };
    mounted.rerender(chart(trace));
    const node = store.getState().nodeLookup.get("audit")!;
    expect(node.type).toBe("customStage");
    expect(node.style?.opacity).toBe(0.8);
    expect(node.data).toMatchObject({ ...status, customLabel: "host-controlled", dimmed: false, traceContext: "outside" });
    mounted.rerender(chart());
    expect(store.getState().nodeLookup.get("audit")!.style?.opacity).toBe(baseline.style?.opacity);
    expect(customGraph.nodes.find(node => node.id === "audit")!.style?.opacity).toBe(0.8);
  });

  it("reacts to reduced motion and keeps recorded-read edges static even when motion is allowed", async () => {
    let reduced = false;
    const listeners = new Set<() => void>();
    vi.stubGlobal("matchMedia", () => ({ get matches() { return reduced; },
      addEventListener: (_: string, listener: () => void) => listeners.add(listener),
      removeEventListener: (_: string, listener: () => void) => listeners.delete(listener) }));
    let store!: ReturnType<typeof useStoreApi>;
    function Probe() { store = useStoreApi(); return null; }
    const mounted = render(<TracedFlow graph={graph} overlay={runtime} scrubIndex={0} layout="passthrough"><Probe /></TracedFlow>);
    await waitFor(() => expect(store.getState().edges.find(edge => edge.id === "source-audit")?.animated).toBe(true));
    act(() => { reduced = true; listeners.forEach(listener => listener()); });
    expect(store.getState().edges.every(edge => !edge.animated)).toBe(true);
    expect(store.getState().nodes.every(node => node.data.suppressMotion === true)).toBe(true);
    mounted.rerender(<TracedFlow graph={graph} overlay={runtime} scrubIndex={0} traceWorkflow={trace} layout="passthrough"><Probe /></TracedFlow>);
    act(() => { reduced = false; listeners.forEach(listener => listener()); });
    expect(store.getState().edges.every(edge => !edge.animated)).toBe(true);
    expect(store.getState().nodes.every(node => node.data.suppressMotion === true)).toBe(true);
    expect(store.getState().nodes.every(node => node.style?.transition === "opacity 240ms ease")).toBe(true);
    expect(store.getState().edges.filter(edge => edge.type !== "recordedRead")
      .every(edge => edge.style?.transition === "opacity 240ms ease")).toBe(true);
    expect(store.getState().edges.find(edge => edge.type === "recordedRead")?.style?.transition).toBe("none");
    act(() => { reduced = true; listeners.forEach(listener => listener()); });
    expect(store.getState().nodes.every(node => node.style?.transition === "none")).toBe(true);
    expect(store.getState().edges.every(edge => edge.style?.transition === "none")).toBe(true);
  });
});
