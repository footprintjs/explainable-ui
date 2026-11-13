/** @vitest-environment jsdom */
import { expect, it } from "vitest";
import { render } from "@testing-library/react";
import { useStoreApi } from "@xyflow/react";
import { TracedFlow } from "../../src/components/FlowchartView/TracedFlow";
import { createTraceRuntimeOverlay } from "../../src/components/FlowchartView/createTraceRuntimeOverlay";
import type { TraceGraph } from "../../src/components/FlowchartView/traceStructureRecorder";

it.each(["stage", undefined])(
  "preserves authored footprints and styles through scrub for type=%s",
  (type) => {
    // Use real TracedFlow + xyflow wrappers. The authored footprint stands in
    // for dimensions stamped by a layout; jsdom supplies no measured boxes.
    const authoredStyle = Object.freeze({
      width: 240,
      height: 112,
      borderRadius: 12,
      backgroundColor: "rebeccapurple",
      opacity: 0.8,
    });
    const ids = ["a", "b", "c"];
    const graph: TraceGraph = {
      nodes: ids.map((id, index) => ({
        id,
        type,
        position: { x: 0, y: index * 164 },
        style: authoredStyle,
        data: {
          label: id,
          isDecider: false,
          isFork: false,
          isStreaming: false,
          isSubflow: false,
          prevIds: [],
          nextIds: [],
        },
      })),
      edges: [],
    };
    const runtime = createTraceRuntimeOverlay();
    for (const id of ids) {
      runtime.recorder.onStageExecuted?.({
        stageName: id,
        stageId: id,
        stageType: "linear",
        traversalContext: { runtimeStageId: `${id}#0` },
      });
    }
    const overlay = runtime.getOverlay();
    let store!: ReturnType<typeof useStoreApi>;
    function Probe() {
      store = useStoreApi();
      return null;
    }
    const view = (scrubIndex?: number) => (
      <TracedFlow
        graph={graph}
        overlay={scrubIndex === undefined ? undefined : overlay}
        scrubIndex={scrubIndex}
        layout="passthrough"
      >
        <Probe />
      </TracedFlow>
    );
    const mounted = render(view());
    const assertNode = (id: string, state: "unknown" | "future" | "active" | "done") => {
      const dimmed = state === "future";
      const wrapper = mounted.container.querySelector<HTMLElement>(
        `.react-flow__node[data-id="${id}"]`,
      );
      expect(wrapper, `${id} rendered`).toBeTruthy();
      expect(wrapper!.style.width).toBe("240px");
      expect(wrapper!.style.height).toBe("112px");
      expect(wrapper!.style.borderRadius).toBe("12px");
      expect(wrapper!.style.backgroundColor).toBe("rebeccapurple");
      expect(wrapper!.style.opacity).toBe(dimmed ? "0.35" : "0.8");
      const node = store.getState().nodeLookup.get(id)!;
      expect(node.style).toEqual({ ...authoredStyle, opacity: dimmed ? 0.35 : 0.8 });
      expect(node.data).toMatchObject({
        active: state === "active",
        done: state === "done",
        dimmed,
      });
    };

    ids.forEach((id) => assertNode(id, "unknown"));
    mounted.rerender(view(0));
    assertNode("a", "active");
    assertNode("b", "future");
    assertNode("c", "future");
    mounted.rerender(view(1));
    assertNode("a", "done");
    assertNode("b", "active");
    assertNode("c", "future");
    mounted.rerender(view(2));
    assertNode("a", "done");
    assertNode("b", "done");
    assertNode("c", "active");
    mounted.rerender(view(0));
    assertNode("b", "future");
    assertNode("c", "future");
    mounted.rerender(view());
    ids.forEach((id) => assertNode(id, "unknown"));
    // Applying the overlay must not write its opacity back into the graph.
    graph.nodes.forEach((node) => expect(node.style).toBe(authoredStyle));
  },
);
