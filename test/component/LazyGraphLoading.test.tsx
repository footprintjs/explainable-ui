/** @vitest-environment jsdom */
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { TracedFlowProps } from "../../src/components/FlowchartView/TracedFlow";
import { ExplainableShell } from "../../src/components/ExplainableShell/ExplainableShell";
import { LazyTracedFlow } from "../../src/components/_internal/LazyTracedFlow";
import { ExplainableProvider, FlowchartPanel, TimeTravelBar, type ExplainableRecording } from "../../src/components/ExplainableView";
import { graphFromStructure } from "../../src/adapters/graphFromStructure";
import { toVisualizationSnapshots } from "../../src/adapters/fromRuntimeSnapshot";

const load = vi.hoisted(() => {
  let finish = () => {};
  const pending = new Promise<void>(resolve => { finish = resolve; });
  return { pending, finish: () => finish(), attempts: 0 };
});
vi.mock("../../src/components/FlowchartView/TracedFlow", async () => {
  load.attempts++;
  await load.pending;
  return { TracedFlow: ({ graph, scrubIndex, colors, onNodeClick, currentSubflowId, onSubflowChange }: TracedFlowProps) => (
    <div data-testid="loaded-graph" data-graph={graph.nodes[0]?.id} data-index={scrubIndex} data-active={colors?.active} data-drill={currentSubflowId ?? "root"}>
      <button onClick={() => onNodeClick?.(graph.nodes[0].id)}>Graph first stage</button>
      <button onClick={() => onSubflowChange?.(null)}>Graph root</button>
    </div>
  ) };
});

function recording(prefix: string) {
  const first = `${prefix}-first`, last = `${prefix}-last`;
  return { snapshot: { sharedState: { x: 2 },
    executionTree: { id: first, name: first, runtimeStageId: `${first}#0`, logs: {}, errors: {}, metrics: {}, evals: {}, next: { id: last, name: last, runtimeStageId: `${last}#1`, logs: {}, errors: {}, metrics: {}, evals: {} } },
    commitLog: [first, last].map((stage, index) => ({ stage, stageId: stage, runtimeStageId: `${stage}#${index}`, overwrite: { x: index + 1 }, updates: {}, redactedPaths: [], trace: [{ path: "x", verb: "set" }] })),
  }, structure: { id: first, name: first, next: { id: last, name: last } } } satisfies ExplainableRecording;
}
const first = recording("old"), replacement = recording("new");
function view(input: ExplainableRecording, index: number, color: string, open: boolean) {
  return <ExplainableProvider recording={input} selectedIndex={index} theme={{ mode: "light", flowchart: { active: color } }}>
    <TimeTravelBar />
    {open && <FlowchartPanel />}
  </ExplainableProvider>;
}

describe("M6 lazy composite graph boundary", () => {
  it("does not request the graph for a caller-supplied Shell renderer", () => {
    render(<ExplainableShell snapshots={toVisualizationSnapshots(first.snapshot)} traceGraph={graphFromStructure(first.structure)}
      renderFlowchart={() => <div data-testid="custom-graph">Host graph</div>} />);
    expect(screen.getByTestId("custom-graph")).toBeTruthy();
    expect(load.attempts).toBe(0);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("does not request the graph for empty or unstyled panels", () => {
    const host = render(<ExplainableProvider recording={{ snapshot: first.snapshot }}><FlowchartPanel /></ExplainableProvider>);
    expect(screen.getByText("This recording carried no structure, so there is no chart to draw.")).toBeTruthy();
    host.rerender(<ExplainableProvider recording={first}><FlowchartPanel unstyled /></ExplainableProvider>);
    expect(screen.getByRole("button", { name: "old-first" })).toBeTruthy();
    expect(load.attempts).toBe(0);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("starts on graph mount only and keeps the latest source/cursor/theme across pending unmount/remount", async () => {
    const host = render(view(first, 0, "old-color", false));
    host.rerender(view(first, 1, "next-color", false));
    expect(load.attempts).toBe(0); // importing the composite surfaces is not opening the graph.
    host.rerender(view(first, 1, "next-color", true));
    expect(screen.getByRole("status").textContent).toContain("Loading flowchart");
    await waitFor(() => expect(load.attempts).toBe(1));
    host.rerender(view(replacement, 0, "replacement-color", true));
    expect(screen.queryByTestId("loaded-graph")).toBeNull();
    host.unmount();
    const remounted = render(view(replacement, 1, "final-color", true));
    await act(async () => { load.finish(); await load.pending; });
    const graph = await screen.findByTestId("loaded-graph");
    expect(graph.dataset.graph).toBe("new-first");
    expect(graph.dataset.index).toBe("1");
    expect(graph.dataset.active).toBe("final-color");
    expect(screen.queryByRole("status")).toBeNull();
    expect(load.attempts).toBe(1);
    remounted.unmount();
    render(view(first, 0, "remount-color", true));
    expect(screen.getByTestId("loaded-graph").dataset.graph).toBe("old-first");
    expect(screen.getByTestId("loaded-graph").dataset.index).toBe("0");
    expect(screen.getByTestId("loaded-graph").dataset.active).toBe("remount-color");
    expect(load.attempts).toBe(1);
  });

  it("retains Shell navigation and theme when the same graph component is lazy", async () => {
    // Also permits running this single case without the pending-load case.
    await act(async () => { load.finish(); await load.pending; });
    const host = render(<ExplainableShell snapshots={toVisualizationSnapshots(first.snapshot)} traceGraph={graphFromStructure(first.structure)} traceTheme={{ current: "before", mode: "dark" }} />);
    const graph = await screen.findByTestId("loaded-graph");
    fireEvent.click(screen.getByLabelText("Next stage"));
    expect(graph.dataset.index).toBe("1");
    host.rerender(<ExplainableShell snapshots={toVisualizationSnapshots(replacement.snapshot)} traceGraph={graphFromStructure(replacement.structure)} traceTheme={{ current: "after", mode: "light" }} />);
    expect(graph.dataset.graph).toBe("new-first");
    expect(graph.dataset.index).toBe("1");
    expect(graph.dataset.active).toBe("after");
    fireEvent.click(screen.getByText("Graph first stage"));
    expect(graph.dataset.index).toBe("0");
    expect(graph.dataset.drill).toBe("root");
  });

  it("forwards controlled drill state and callbacks without keeping a second local copy", async () => {
    await act(async () => { load.finish(); await load.pending; });
    const onSubflowChange = vi.fn();
    const host = render(<LazyTracedFlow graph={graphFromStructure(first.structure)} currentSubflowId="old-child" onSubflowChange={onSubflowChange} />);
    const graph = await screen.findByTestId("loaded-graph");
    expect(graph.dataset.drill).toBe("old-child");
    host.rerender(<LazyTracedFlow graph={graphFromStructure(replacement.structure)} currentSubflowId="new-child" onSubflowChange={onSubflowChange} />);
    expect(graph.dataset.graph).toBe("new-first");
    expect(graph.dataset.drill).toBe("new-child");
    fireEvent.click(screen.getByText("Graph root"));
    expect(onSubflowChange).toHaveBeenCalledExactlyOnceWith(null);
    expect(graph.dataset.drill).toBe("new-child");
  });
});
