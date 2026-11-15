/** @vitest-environment jsdom */
import { act, fireEvent, render, waitFor } from "@testing-library/react";
import { BackgroundVariant, Controls, MiniMap, Position, useStoreApi, type EdgeProps } from "@xyflow/react";
import type { CSSProperties } from "react";
import { describe, expect, it, vi } from "vitest";
import { TracedFlow } from "../../src/components/FlowchartView/TracedFlow";
import type { TraceGraph } from "../../src/components/FlowchartView/traceStructureRecorder";
import type { RuntimeOverlay } from "../../src/components/FlowchartView/createTraceRuntimeOverlay";
import type { TraceWorkflowOverlay } from "../../src/trace/traceWorkflowOverlay";

const graph: TraceGraph = {
  nodes: ["a", "b", "c"].map((id, index) => ({ id, type: "stage", position: { x: 0, y: index * 140 },
    data: { label: id, isDecider: false, isFork: false, isStreaming: false, isSubflow: false, prevIds: [], nextIds: [] } })),
  edges: [ { id: "ab", source: "a", target: "b", data: { kind: "next" } },
    { id: "bc", source: "b", target: "c", data: { kind: "next" } } ],
};
const overlay: RuntimeOverlay = { running: false, errors: new Map([["c", "recorded failure"]]),
  executionOrder: ["a", "b", "c"].map((stageId, index) => ({ stageId, runtimeStageId: `${stageId}#${index}`, stageName: stageId, timestampMs: index })) };

function measure(store: ReturnType<typeof useStoreApi>, widths = [120, 120, 120]) {
  act(() => {
    const lookup = store.getState().nodeLookup;
    for (const [index, node] of [...lookup.values()].entries()) {
      const width = widths[index];
      node.measured = { width, height: 40 };
      node.internals.handleBounds = {
        source: [{ nodeId: node.id, type: "source", position: Position.Bottom, x: width / 2 - 4, y: 36, width: 8, height: 8 }],
        target: [{ nodeId: node.id, type: "target", position: Position.Top, x: width / 2 - 4, y: -4, width: 8, height: 8 }],
      };
    }
    store.setState({ nodeLookup: new Map(lookup), width: 800, height: 500 });
  });
}

describe("TracedFlow host customization", () => {
  it("themes real xyflow accessories locally, lets explicit host styles win, and leaves unstyled accessories alone", () => {
    const hostStyle = { "--xy-controls-button-background-color": "papayawhip", "--xy-controls-button-color": "#222" } as CSSProperties;
    const chart = (unstyled = false, style?: CSSProperties) => <TracedFlow graph={graph} layout="passthrough"
      autoFit={false} unstyled={unstyled} style={style}><Controls /><MiniMap /></TracedFlow>;
    const mounted = render(chart());
    const root = () => mounted.container.querySelector<HTMLElement>('[data-fp="traced-flow"]')!;
    expect(root().style.getPropertyValue("--xy-controls-button-background-color")).toBe("var(--fp-bg-secondary, #1e293b)");
    expect(root().style.getPropertyValue("--xy-controls-button-background-color-hover")).toBe("var(--fp-bg-tertiary, #334155)");
    expect(root().style.getPropertyValue("--xy-controls-button-color")).toBe("var(--fp-text-primary, #f8fafc)");
    expect(root().style.getPropertyValue("--xy-controls-button-border-color")).toBe("var(--fp-border, #334155)");
    expect(root().style.getPropertyValue("--xy-controls-box-shadow")).toContain("--fp-shadow-panel");
    expect(root().style.getPropertyValue("--xy-minimap-background-color")).toContain("--fp-bg-secondary");
    expect(root().style.getPropertyValue("--xy-edge-label-color")).toContain("--fp-text-primary");
    const buttons = mounted.container.querySelectorAll(".react-flow__controls-button");
    expect(buttons).toHaveLength(4);
    for (const button of buttons) {
      expect(button.getAttribute("aria-label")).toBeTruthy();
      expect(button.querySelector("svg path")).toBeTruthy();
    }
    expect(mounted.container.querySelector(".react-flow__minimap-svg")).toBeTruthy();

    mounted.rerender(chart(false, hostStyle));
    expect(root().style.getPropertyValue("--xy-controls-button-background-color")).toBe("papayawhip");
    expect(root().style.getPropertyValue("--xy-controls-button-color")).toBe("#222");
    mounted.rerender(chart(true));
    expect(root().style.getPropertyValue("--xy-controls-button-background-color")).toBe("");
    expect(root().style.getPropertyValue("--xy-minimap-background-color")).toBe("");
    expect(mounted.container.querySelectorAll(".react-flow__controls-button")).toHaveLength(4);
    mounted.rerender(chart(true, hostStyle));
    expect(root().style.getPropertyValue("--xy-controls-button-background-color")).toBe("papayawhip");
  });

  it("renders authored edge types and preserves host paint, markers and metadata through scrub", async () => {
    let store!: ReturnType<typeof useStoreApi>;
    function Probe() { store = useStoreApi(); return null; }
    const CustomEdge = vi.fn((props: EdgeProps) => <path data-fp="host-edge" d={`M${props.sourceX},${props.sourceY} L${props.targetX},${props.targetY}`} style={props.style} />);
    const edgeTypes = { brandEdge: CustomEdge };
    const authored = { stroke: "rebeccapurple", strokeWidth: 5, strokeDasharray: "8 2", opacity: 0.7 };
    const customGraph: TraceGraph = { ...graph, edges: [{ ...graph.edges[0], type: "brandEdge", style: authored,
      markerEnd: "brand-arrow", data: { ...graph.edges[0].data!, hostField: "kept" } }, graph.edges[1]] };
    const chart = (index: number, unstyled = false) => <TracedFlow graph={customGraph} overlay={overlay} scrubIndex={index}
      edgeTypes={edgeTypes} layout="passthrough" autoFit={false} unstyled={unstyled}><Probe /></TracedFlow>;
    const mounted = render(chart(0));
    measure(store);
    await waitFor(() => expect(mounted.container.querySelector('[data-fp="host-edge"]')).toBeTruthy());
    const assertAuthored = () => {
      const edge = store.getState().edges.find(edge => edge.id === "ab")!;
      expect(edge).toMatchObject({ type: "brandEdge", markerEnd: "brand-arrow", data: { hostField: "kept" } });
      expect(edge.style).toMatchObject(authored);
    };
    assertAuthored();
    mounted.rerender(chart(2)); measure(store); assertAuthored();
    mounted.rerender(chart(2, true)); measure(store); assertAuthored();
    expect(store.getState().edges.find(edge => edge.id === "bc")!.style).toEqual({});
    expect(customGraph.edges[0].style).toBe(authored);
  });

  it("uses CSS-variable defaults and the error color override on recorded-error edges", () => {
    let store!: ReturnType<typeof useStoreApi>;
    function Probe() { store = useStoreApi(); return null; }
    const mounted = render(<TracedFlow graph={graph} layout="passthrough" autoFit={false}><Probe /></TracedFlow>);
    expect(store.getState().edges[0].style?.stroke).toBe("var(--fp-text-muted, #64748b)");
    mounted.rerender(<TracedFlow graph={graph} overlay={overlay} scrubIndex={2} layout="passthrough" autoFit={false}><Probe /></TracedFlow>);
    expect(store.getState().edges.find(edge => edge.id === "bc")!.style?.stroke).toBe("var(--fp-color-success, #22c55e)");
    mounted.rerender(<TracedFlow graph={graph} overlay={overlay} scrubIndex={2} colors={{ error: "maroon" }} layout="passthrough" autoFit={false}><Probe /></TracedFlow>);
    expect(store.getState().edges.find(edge => edge.id === "bc")!.style?.stroke).toBe("maroon");
  });

  it("makes the background optional and accepts host background props in styled or unstyled charts", () => {
    const mounted = render(<TracedFlow graph={graph} layout="passthrough" autoFit={false} />);
    expect(mounted.container.querySelector(".react-flow__background")).toBeTruthy();
    mounted.rerender(<TracedFlow graph={graph} layout="passthrough" autoFit={false} background={false} />);
    expect(mounted.container.querySelector(".react-flow__background")).toBeNull();
    mounted.rerender(<TracedFlow graph={graph} layout="passthrough" autoFit={false} unstyled />);
    expect(mounted.container.querySelector(".react-flow__background")).toBeNull();
    mounted.rerender(<TracedFlow graph={graph} layout="passthrough" autoFit={false} unstyled
      background={{ id: "brand-grid", className: "brand-grid", variant: BackgroundVariant.Lines, gap: 32, color: "hotpink" }} />);
    expect(mounted.container.querySelector(".react-flow__background.brand-grid")).toBeTruthy();
  });

  it.each([false, true])("keeps the same interactive drill graph with unstyled=%s and a host breadcrumb", unstyled => {
    const subflowGraph: TraceGraph = { nodes: [
      { ...graph.nodes[0], id: "mount", data: { ...graph.nodes[0].data, label: "Mount", isSubflow: true, subflowId: "child" } },
      { ...graph.nodes[1], id: "mount/child", data: { ...graph.nodes[1].data, label: "Child", subflowOf: "mount" } },
    ], edges: [] };
    const changed = vi.fn();
    const mounted = render(<TracedFlow graph={subflowGraph} layout="passthrough" autoFit={false} unstyled={unstyled}
      onSubflowChange={changed} breadcrumb={({ onNavigate }) => <button onClick={() => onNavigate(null)}>Host back</button>} />);
    fireEvent.click(mounted.container.querySelector('.react-flow__node[data-id="mount"]')!);
    expect(mounted.container.querySelector('.react-flow__node[data-id="mount/child"]')).toBeTruthy();
    expect(changed).toHaveBeenCalledWith("mount");
    expect(mounted.container.querySelectorAll(".react-flow__handle")).toHaveLength(2);
    const body = mounted.container.querySelector<HTMLElement>('[data-fp="stage-node-body"]')!;
    if (unstyled) expect(body.style.background).toBe("");
    fireEvent.click(mounted.getByText("Host back"));
    expect(mounted.container.querySelector('.react-flow__node[data-id="mount"]')).toBeTruthy();
    expect(changed).toHaveBeenLastCalledWith(null);
  });

  it("retains measured sizes and spine alignment when tuning the default layout", () => {
    let store!: ReturnType<typeof useStoreApi>;
    function Probe() { store = useStoreApi(); return null; }
    render(<TracedFlow graph={graph} autoFit={false} layoutOptions={{ rankSep: 100, nodeSep: 42 }}><Probe /></TracedFlow>);
    measure(store, [100, 140, 80]);
    measure(store, [100, 140, 80]);
    const nodes = store.getState().nodes;
    expect(nodes.map(node => node.style?.width)).toEqual([100, 140, 80]);
    expect(nodes[1].position.y - nodes[0].position.y).toBe(140);
    const centers = nodes.map(node => node.position.x + Number(node.style?.width) / 2);
    expect(centers.every(center => Math.abs(center - centers[0]) < 0.001)).toBe(true);
  });

  it("keeps soft loop defaults while honoring explicit host stroke properties in the real renderer", async () => {
    let store!: ReturnType<typeof useStoreApi>;
    function Probe() { store = useStoreApi(); return null; }
    const loopGraph: TraceGraph = { ...graph, edges: [{ id: "loop", source: "c", target: "a", data: { kind: "loop" } }] };
    const chart = (currentGraph = loopGraph, unstyled = false) => <TracedFlow graph={currentGraph} layout="passthrough"
      autoFit={false} unstyled={unstyled}><Probe /></TracedFlow>;
    const mounted = render(chart()); measure(store);
    const path = () => mounted.container.querySelector<SVGElement>('.react-flow__edge[data-id="loop"] .react-flow__edge-path')!;
    await waitFor(() => expect(path()).toBeTruthy());
    expect(path().style.strokeOpacity).toBe("0.55");
    expect(path().style.strokeWidth).toBe("1.5");
    const hostGraph = { ...loopGraph, edges: [{ ...loopGraph.edges[0], style: { strokeWidth: 6, strokeOpacity: 0.9, strokeDasharray: "1 2" } }] };
    mounted.rerender(chart(hostGraph)); measure(store);
    expect(path().style.strokeWidth).toBe("6");
    expect(path().style.strokeOpacity).toBe("0.9");
    expect(path().style.strokeDasharray).toBe("1 2");
    mounted.rerender(chart(loopGraph, true)); measure(store);
    expect(path().style.strokeWidth).toBe("");
    expect(path().style.strokeOpacity).toBe("");
    expect(path().style.strokeDasharray).toBe("");
  });

  it("keeps recorded-read content and routing in unstyled mode without its default paint", async () => {
    let store!: ReturnType<typeof useStoreApi>;
    function Probe() { store = useStoreApi(); return null; }
    const workflow: TraceWorkflowOverlay = { questionKey: "answer", scopeKey: "[]", focusRuntimeStageId: "c#2",
      stages: [{ stageId: "a", runtimeStageId: "a#0", role: "input", color: "teal", values: [] },
        { stageId: "c", runtimeStageId: "c#2", role: "question", color: "purple", values: [] }],
      reads: [{ sourceRuntimeStageId: "a#0", targetRuntimeStageId: "c#2", key: "amount", color: "teal" }] };
    const mounted = render(<TracedFlow graph={graph} traceWorkflow={workflow} layout="passthrough" autoFit={false} unstyled><Probe /></TracedFlow>);
    measure(store);
    await waitFor(() => expect(mounted.getByText("amount · recorded read")).toBeTruthy());
    const label = mounted.getByText("amount · recorded read");
    expect(label.style.transform).toContain("translate");
    expect(label.style.background).toBe("");
    expect(label.style.fontSize).toBe("");
    const path = mounted.container.querySelector<SVGElement>('[data-fp="trace-workflow-read"] .react-flow__edge-path')!;
    expect(path.getAttribute("d")).toBeTruthy();
    expect(path.style.strokeDasharray).toBe("");
    expect(store.getState().edges.some(edge => edge.type === "recordedRead")).toBe(true);
  });

  it("ignores measured-layout options when a custom layout owns the graph", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      let store!: ReturnType<typeof useStoreApi>;
      function Probe() { store = useStoreApi(); return null; }
      const customLayout = vi.fn((input: TraceGraph) => input);
      render(<TracedFlow graph={graph} layout={customLayout} layoutOptions={{ rankSep: 999 }} autoFit={false}><Probe /></TracedFlow>);
      expect(customLayout).toHaveBeenCalled();
      expect(store.getState().nodes[1].position.y).toBe(140);
      expect(warn.mock.calls.flat().join(" ")).toContain("layoutOptions applies only");
    } finally { warn.mockRestore(); }
  });
});
