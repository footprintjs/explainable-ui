/** @vitest-environment jsdom */
import { useLayoutEffect } from "react";
import { act, cleanup, render } from "@testing-library/react";
import { ReactFlowProvider, useStoreApi, type Node } from "@xyflow/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MeasuredNodeSizes } from "../../src/components/FlowchartView/_internal/MeasuredNodeSizes";

afterEach(cleanup);

const nodes: Node[] = ["load", "sum"].map(id => ({ id, position: { x: 0, y: 0 }, data: {} }));
type Dimensions = { width?: number; height?: number };

function mountProbe(initialNodes = nodes, includeHiddenNodes = false) {
  let store!: ReturnType<typeof useStoreApi>;
  const onSizes = vi.fn();
  function CaptureStore() {
    const api = useStoreApi();
    useLayoutEffect(() => { store = api; }, [api]);
    return null;
  }
  render(<ReactFlowProvider initialNodes={initialNodes}>
    <CaptureStore />
    <MeasuredNodeSizes onSizes={onSizes} includeHiddenNodes={includeHiddenNodes} />
  </ReactFlowProvider>);

  // ResizeObserver publishes internal measurements independently from the
  // controlled user-node props. Exercise that real store path without a canvas
  // or a mocked useStore/useNodesInitialized implementation.
  const measure = (dimensions: Record<string, Dimensions>) => act(() => {
    const { nodeLookup } = store.getState();
    for (const [id, measured] of Object.entries(dimensions)) {
      const node = nodeLookup.get(id)!;
      nodeLookup.set(id, { ...node, measured });
    }
    store.setState({});
  });
  return { store, measure, onSizes };
}

describe("MeasuredNodeSizes with controlled ReactFlow internals", () => {
  it("publishes complete internal footprints even while cached nodesInitialized stays false", () => {
    const { store, measure, onSizes } = mountProbe();
    expect(store.getState().nodesInitialized).toBe(false);
    expect(onSizes).not.toHaveBeenCalled();
    measure({ load: { width: 132, height: 44 } });
    expect(onSizes).not.toHaveBeenCalled();
    measure({ sum: { width: 80, height: 52 } });
    expect(store.getState().nodesInitialized).toBe(false);
    expect(onSizes).toHaveBeenCalledTimes(1);
    expect([...onSizes.mock.calls[0][0]]).toEqual([
      ["load", { width: 132, height: 44 }],
      ["sum", { width: 80, height: 52 }],
    ]);

    measure({ load: { width: 132, height: 44 } });
    expect(onSizes).toHaveBeenCalledTimes(1);
    measure({ load: { width: 160, height: 44 } });
    expect(onSizes).toHaveBeenCalledTimes(2);
    expect(onSizes.mock.calls[1][0].get("load")).toEqual({ width: 160, height: 44 });
  });

  it("does not republish identical sizes after controlled-node measurements are rebuilt", () => {
    const { measure, onSizes } = mountProbe();
    const complete = { load: { width: 132, height: 44 }, sum: { width: 80, height: 52 } };
    measure(complete);
    measure({ load: {}, sum: {} });
    expect(onSizes).toHaveBeenCalledTimes(1);
    measure(complete);
    expect(onSizes).toHaveBeenCalledTimes(1);
    measure({ sum: { width: 80, height: 60 } });
    expect(onSizes).toHaveBeenCalledTimes(2);
  });

  it.each([false, true])("honors includeHiddenNodes=%s when deciding required measurements", includeHiddenNodes => {
    const { measure, onSizes } = mountProbe([
      nodes[0], { ...nodes[1], hidden: true },
    ], includeHiddenNodes);
    measure({ load: { width: 132, height: 44 } });
    expect(onSizes).toHaveBeenCalledTimes(includeHiddenNodes ? 0 : 1);
    measure({ sum: { width: 80, height: 52 } });
    expect(onSizes).toHaveBeenCalledTimes(1);
    expect([...onSizes.mock.calls[0][0].keys()]).toEqual(includeHiddenNodes ? ["load", "sum"] : ["load"]);
  });

  it.each([false, true])("does not publish an empty or entirely hidden view (includeHiddenNodes=%s)", includeHiddenNodes => {
    const empty = mountProbe([], includeHiddenNodes);
    expect(empty.onSizes).not.toHaveBeenCalled();
    cleanup();
    const hidden = mountProbe(nodes.map(node => ({ ...node, hidden: true })), includeHiddenNodes);
    hidden.measure({ load: { width: 132, height: 44 }, sum: { width: 80, height: 52 } });
    expect(hidden.onSizes).not.toHaveBeenCalled();
  });

  it.each([
    { width: 0, height: 40 },
    { width: 120 },
    { width: Number.POSITIVE_INFINITY, height: 40 },
    { width: 120, height: Number.NaN },
  ])("withholds incomplete or invalid internal dimensions $width × $height", invalid => {
    const { measure, onSizes } = mountProbe();
    measure({ load: { width: 132, height: 44 }, sum: invalid });
    expect(onSizes).not.toHaveBeenCalled();
    measure({ sum: { width: 80, height: 52 } });
    expect(onSizes).toHaveBeenCalledTimes(1);
  });
});
