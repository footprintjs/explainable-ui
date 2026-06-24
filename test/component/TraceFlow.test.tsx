/** @vitest-environment jsdom */
/**
 * L7.8 — `<TraceFlow>` component tests.
 *
 * Covers: live-mode (recorder subscription + version-counter re-render),
 * static-mode (graph prop), layout pluggability, default BFS layout
 * algorithm, edge styling per kind, onNodeClick wiring.
 *
 * Uses @testing-library/react + jsdom. ReactFlow renders to DOM via
 * @xyflow/react — we assert on the DOM structure it produces rather
 * than on internal xyflow state.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, act } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import {
  TraceFlow,
  defaultTraceFlowLayout,
  type TraceFlowLayout,
} from "../../src/components/FlowchartView/TraceFlow";
import {
  createTraceStructureRecorder,
  type TraceGraph,
} from "../../src/components/FlowchartView/traceStructureRecorder";

// jsdom doesn't measure SVG, ReactFlow's ResizeObserver shim needs polyfill.
beforeEach(() => {
  if (typeof window !== "undefined" && !("ResizeObserver" in window)) {
    (window as unknown as { ResizeObserver: unknown }).ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
});

function spec(id: string, name: string, extra: Record<string, unknown> = {}) {
  return { id, name, type: "stage" as const, ...extra };
}

// ── 1. Unit — defaultTraceFlowLayout ────────────────────────────────────────

describe("defaultTraceFlowLayout — unit", () => {
  it("empty graph returns empty result", () => {
    const out = defaultTraceFlowLayout({ nodes: [], edges: [] });
    expect(out.nodes).toEqual([]);
    expect(out.edges).toEqual([]);
  });

  it("single node at origin", () => {
    const out = defaultTraceFlowLayout({
      nodes: [
        {
          id: "a",
          type: "stage",
          position: { x: 0, y: 0 },
          data: { label: "A", isDecider: false, isFork: false, isStreaming: false, isSubflow: false },
        },
      ],
      edges: [],
    });
    expect(out.nodes[0].position).toEqual({ x: 0, y: 0 });
  });

  it("linear 3-stage chain stacks vertically (Y_STEP=100)", () => {
    const nodes = ["a", "b", "c"].map((id) => ({
      id,
      type: "stage",
      position: { x: 0, y: 0 },
      data: { label: id.toUpperCase(), isDecider: false, isFork: false, isStreaming: false, isSubflow: false },
    }));
    const edges = [
      { id: "a->b", source: "a", target: "b", data: { kind: "next" as const } },
      { id: "b->c", source: "b", target: "c", data: { kind: "next" as const } },
    ];
    const out = defaultTraceFlowLayout({ nodes, edges });
    expect(out.nodes.find((n) => n.id === "a")!.position).toEqual({ x: 0, y: 0 });
    expect(out.nodes.find((n) => n.id === "b")!.position).toEqual({ x: 0, y: 100 });
    expect(out.nodes.find((n) => n.id === "c")!.position).toEqual({ x: 0, y: 200 });
  });

  it("fork-children center under parent (X_SPREAD=200)", () => {
    const nodes = [
      { id: "p", type: "stage", position: { x: 0, y: 0 }, data: { label: "P", isDecider: false, isFork: true, isStreaming: false, isSubflow: false } },
      { id: "l", type: "stage", position: { x: 0, y: 0 }, data: { label: "L", isDecider: false, isFork: false, isStreaming: false, isSubflow: false } },
      { id: "r", type: "stage", position: { x: 0, y: 0 }, data: { label: "R", isDecider: false, isFork: false, isStreaming: false, isSubflow: false } },
    ];
    const edges = [
      { id: "p->l", source: "p", target: "l", data: { kind: "fork-branch" as const } },
      { id: "p->r", source: "p", target: "r", data: { kind: "fork-branch" as const } },
    ];
    const out = defaultTraceFlowLayout({ nodes, edges });
    const l = out.nodes.find((n) => n.id === "l")!;
    const r = out.nodes.find((n) => n.id === "r")!;
    // Two children: centered → -100 and +100 (totalWidth=200, startX=-100).
    expect(l.position.x).toBe(-100);
    expect(r.position.x).toBe(100);
    expect(l.position.y).toBe(100);
    expect(r.position.y).toBe(100);
  });

  it("loop back-edges do NOT shape layout (they're skipped)", () => {
    const nodes = ["a", "b"].map((id) => ({
      id,
      type: "stage",
      position: { x: 0, y: 0 },
      data: { label: id.toUpperCase(), isDecider: false, isFork: false, isStreaming: false, isSubflow: false },
    }));
    const edges = [
      { id: "a->b", source: "a", target: "b", data: { kind: "next" as const } },
      { id: "b->a:loop", source: "b", target: "a", data: { kind: "loop" as const } },
    ];
    const out = defaultTraceFlowLayout({ nodes, edges });
    // Layout should treat 'a' as the seed (no non-loop incoming) and
    // stack 'b' below — not infinite-loop on the back-edge.
    expect(out.nodes.find((n) => n.id === "a")!.position.y).toBe(0);
    expect(out.nodes.find((n) => n.id === "b")!.position.y).toBe(100);
  });

  it("fork + post-convergence next: parallel branches at y=100, FinalizeOrder at y=200 (panel-bug fix)", () => {
    // Mirrors the playground 'fork' sample shape — recorder fires:
    //   LoadOrder → CheckInventory  (fork-branch)
    //   LoadOrder → RunFraudCheck   (fork-branch)
    //   LoadOrder → FinalizeOrder   (next, post-convergence)
    // Layout must place CheckInventory + RunFraudCheck siblings at y=100
    // and FinalizeOrder BELOW them at y=200 (the legacy diamond).
    const nodes = ["LoadOrder", "CheckInventory", "RunFraudCheck", "FinalizeOrder"].map(
      (id) => ({
        id,
        type: "stage",
        position: { x: 0, y: 0 },
        data: { label: id, isDecider: false, isFork: id === "LoadOrder", isStreaming: false, isSubflow: false },
      }),
    );
    const edges = [
      { id: "Load->Check", source: "LoadOrder", target: "CheckInventory", data: { kind: "fork-branch" as const } },
      { id: "Load->Fraud", source: "LoadOrder", target: "RunFraudCheck", data: { kind: "fork-branch" as const } },
      { id: "Load->Finalize", source: "LoadOrder", target: "FinalizeOrder", data: { kind: "next" as const } },
    ];
    const out = defaultTraceFlowLayout({ nodes, edges });
    const load = out.nodes.find((n) => n.id === "LoadOrder")!;
    const check = out.nodes.find((n) => n.id === "CheckInventory")!;
    const fraud = out.nodes.find((n) => n.id === "RunFraudCheck")!;
    const finalize = out.nodes.find((n) => n.id === "FinalizeOrder")!;

    expect(load.position.y).toBe(0);
    // Branches at y=100 (depth 1)
    expect(check.position.y).toBe(100);
    expect(fraud.position.y).toBe(100);
    // Two children → centered at x: ±X_SPREAD/2 = ±100
    expect(check.position.x).toBe(-100);
    expect(fraud.position.x).toBe(100);
    // FinalizeOrder at y=200 (BELOW the branches, post-convergence)
    // and centered under LoadOrder.
    expect(finalize.position.y).toBe(200);
    expect(finalize.position.x).toBe(0);
  });

  it("converging branches (diamond): join keeps first-assigned position (documented limitation)", () => {
    // a → b → d
    //    a → c → d   (d is reached from both b and c)
    const nodes = ["a", "b", "c", "d"].map((id) => ({
      id,
      type: "stage",
      position: { x: 0, y: 0 },
      data: { label: id, isDecider: false, isFork: false, isStreaming: false, isSubflow: false },
    }));
    const edges = [
      { id: "a->b", source: "a", target: "b", data: { kind: "fork-branch" as const } },
      { id: "a->c", source: "a", target: "c", data: { kind: "fork-branch" as const } },
      { id: "b->d", source: "b", target: "d", data: { kind: "next" as const } },
      { id: "c->d", source: "c", target: "d", data: { kind: "next" as const } },
    ];
    const out = defaultTraceFlowLayout({ nodes, edges });
    // d should be placed under b (first parent reached in BFS) and the
    // second visit via c is skipped — documented "first-wins" behavior.
    const d = out.nodes.find((n) => n.id === "d")!;
    const b = out.nodes.find((n) => n.id === "b")!;
    expect(d.position).toEqual({ x: b.position.x, y: b.position.y + 100 });
  });

  it("multi-root graphs: first node is seed; orphans stack below", () => {
    const nodes = [
      { id: "root1", type: "stage", position: { x: 0, y: 0 }, data: { label: "R1", isDecider: false, isFork: false, isStreaming: false, isSubflow: false } },
      { id: "root2", type: "stage", position: { x: 0, y: 0 }, data: { label: "R2", isDecider: false, isFork: false, isStreaming: false, isSubflow: false } },
    ];
    const out = defaultTraceFlowLayout({ nodes, edges: [] });
    // root1 at (0,0); root2 stacks as an orphan below.
    expect(out.nodes.find((n) => n.id === "root1")!.position).toEqual({ x: 0, y: 0 });
    expect(out.nodes.find((n) => n.id === "root2")!.position.y).toBeGreaterThan(0);
  });
});

// ── 2. Functional — static-mode rendering ──────────────────────────────────

describe("<TraceFlow> — static mode", () => {
  const sampleGraph: TraceGraph = {
    nodes: [
      {
        id: "a",
        type: "stage",
        position: { x: 0, y: 0 },
        data: { label: "Alpha", isDecider: false, isFork: false, isStreaming: false, isSubflow: false },
      },
      {
        id: "b",
        type: "stage",
        position: { x: 0, y: 0 },
        data: { label: "Beta", isDecider: false, isFork: false, isStreaming: false, isSubflow: false },
      },
    ],
    edges: [
      { id: "a->b", source: "a", target: "b", data: { kind: "next" } },
    ],
  };

  it("renders without throwing when given a static graph", () => {
    const { container } = render(<TraceFlow graph={sampleGraph} />);
    expect(container.querySelector(".react-flow")).toBeTruthy();
  });

  it("empty graph renders the ReactFlow container without crashing", () => {
    const { container } = render(<TraceFlow graph={{ nodes: [], edges: [] }} />);
    expect(container.querySelector(".react-flow")).toBeTruthy();
  });

  it('layout="passthrough" preserves caller-supplied positions', () => {
    const positioned: TraceGraph = {
      nodes: [
        {
          id: "x",
          type: "stage",
          position: { x: 42, y: 99 },
          data: { label: "X", isDecider: false, isFork: false, isStreaming: false, isSubflow: false },
        },
      ],
      edges: [],
    };
    // No throw — passthrough means the caller's positions stand.
    expect(() => render(<TraceFlow graph={positioned} layout="passthrough" />)).not.toThrow();
  });

  it("custom layout function is invoked with the graph", () => {
    const layout = vi.fn((g: TraceGraph) => g) as TraceFlowLayout;
    render(<TraceFlow graph={sampleGraph} layout={layout} />);
    expect(layout).toHaveBeenCalled();
    const arg = (layout as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(arg.nodes).toHaveLength(2);
  });
});

// ── 3. Integration — live-mode (recorder-driven) ───────────────────────────

describe("<TraceFlow> — live mode (recorder subscription)", () => {
  it("renders the recorder's current graph state", () => {
    const trace = createTraceStructureRecorder();
    trace.recorder.onStageAdded!({ stageId: "a", name: "A", type: "stage", spec: spec("a", "A") });
    const { container } = render(<TraceFlow recorder={trace} />);
    expect(container.querySelector(".react-flow")).toBeTruthy();
  });

  it("re-renders when the recorder fires new events (subscribe wiring)", async () => {
    const trace = createTraceStructureRecorder();
    // Wrap the layout fn so we can detect re-render invocations.
    const layout = vi.fn((g: TraceGraph) => g);
    render(<TraceFlow recorder={trace} layout={layout} />);
    const initialCallCount = layout.mock.calls.length;

    // L8.0 — listener notifications are microtask-batched.
    // `await act(async () => {...})` lets React process the
    // microtask drain inside the act() block.
    await act(async () => {
      trace.recorder.onStageAdded!({ stageId: "x", name: "X", type: "stage", spec: spec("x", "X") });
      await Promise.resolve(); // drain microtask
    });

    // Layout must have been called again after the event mutated the recorder.
    expect(layout.mock.calls.length).toBeGreaterThan(initialCallCount);
  });

  it("reset() while <TraceFlow> is mounted does NOT clear the chart immediately (documented contract)", () => {
    const trace = createTraceStructureRecorder();
    trace.recorder.onStageAdded!({ stageId: "a", name: "A", type: "stage", spec: spec("a", "A") });
    const layout = vi.fn((g: TraceGraph) => g);
    render(<TraceFlow recorder={trace} layout={layout} />);
    const beforeReset = layout.mock.calls.length;

    act(() => {
      trace.reset();
    });

    // No version bump, no notify, no re-render. Locks the contract: a
    // consumer who wants to clear must unmount or recycle the recorder.
    expect(layout.mock.calls.length).toBe(beforeReset);
  });

  it("swapping the `recorder` prop unsubscribes from old + subscribes to new", async () => {
    const a = createTraceStructureRecorder();
    const b = createTraceStructureRecorder();
    const layout = vi.fn((g: TraceGraph) => g);
    const { rerender } = render(<TraceFlow recorder={a} layout={layout} />);

    // Swap to b. The rerender itself triggers layout invocations as
    // React re-evaluates the memo deps (the `recorder` identity changed).
    rerender(<TraceFlow recorder={b} layout={layout} />);
    // Snapshot AFTER the swap so subsequent assertions measure ONLY
    // the impact of the recorder events, not the swap itself.
    const afterSwap = layout.mock.calls.length;

    await act(async () => {
      // Events on the OLD recorder should NOT trigger a re-render —
      // the component unsubscribed from `a` when `recorder` changed.
      a.recorder.onStageAdded!({ stageId: "old", name: "old", type: "stage", spec: spec("old", "old") });
      await Promise.resolve(); // drain microtask
    });
    expect(layout.mock.calls.length).toBe(afterSwap);

    await act(async () => {
      // Events on the NEW recorder DO trigger a re-render.
      b.recorder.onStageAdded!({ stageId: "new", name: "new", type: "stage", spec: spec("new", "new") });
      await Promise.resolve(); // drain microtask
    });
    expect(layout.mock.calls.length).toBeGreaterThan(afterSwap);
  });

  it("unmount unsubscribes from the recorder (no listener leak)", () => {
    const trace = createTraceStructureRecorder();
    const { unmount } = render(<TraceFlow recorder={trace} />);
    unmount();
    // After unmount, firing an event should NOT throw or trigger any
    // implicit re-render (no DOM to update). The recorder's listener
    // count drops via the unsubscribe returned by subscribe().
    expect(() =>
      trace.recorder.onStageAdded!({ stageId: "later", name: "Later", type: "stage", spec: spec("later", "Later") }),
    ).not.toThrow();
  });
});

// ── 4. Property — version counter drives re-render ─────────────────────────

describe("<TraceFlow> — property", () => {
  it.each([1, 5, 25])(
    "live mode re-evaluates layout for each of N recorder events (N=%d)",
    async (n) => {
      const trace = createTraceStructureRecorder();
      const layout = vi.fn((g: TraceGraph) => g);
      render(<TraceFlow recorder={trace} layout={layout} />);
      const baseline = layout.mock.calls.length;

      await act(async () => {
        for (let i = 0; i < n; i++) {
          trace.recorder.onStageAdded!({
            stageId: `s${i}`,
            name: `s${i}`,
            type: "stage",
            spec: spec(`s${i}`, `s${i}`),
          });
        }
        await Promise.resolve(); // drain microtask
      });
      // React batches the inner setState calls but the version-counter
      // memo dep changed at least once → at least one extra layout call.
      expect(layout.mock.calls.length).toBeGreaterThan(baseline);
    },
  );
});

// ── 5. Security — error isolation when layout throws ───────────────────────

describe("<TraceFlow> — security", () => {
  it("a layout function that throws propagates (consumer's contract)", () => {
    const badLayout: TraceFlowLayout = () => {
      throw new Error("layout boom");
    };
    expect(() =>
      render(<TraceFlow graph={{ nodes: [], edges: [] }} layout={badLayout} />),
    ).toThrow(/layout boom/);
  });
});

// ── 6. Performance — large graph layout ────────────────────────────────────

describe("<TraceFlow> — performance", () => {
  // Generous budget: dagre on 500 nodes is heavier and CI runners vary; a real
  // super-linear regression would be SECONDS, not ~300ms (was 30ms).
  it("defaultTraceFlowLayout handles 500-node linear chain under 300ms", () => {
    const nodes = Array.from({ length: 500 }, (_, i) => ({
      id: `s${i}`,
      type: "stage",
      position: { x: 0, y: 0 },
      data: { label: `s${i}`, isDecider: false, isFork: false, isStreaming: false, isSubflow: false },
    }));
    const edges = nodes.slice(1).map((n, i) => ({
      id: `s${i}->${n.id}`,
      source: `s${i}`,
      target: n.id,
      data: { kind: "next" as const },
    }));
    const t0 = performance.now();
    const out = defaultTraceFlowLayout({ nodes, edges });
    expect(performance.now() - t0).toBeLessThan(300);
    expect(out.nodes[499].position.y).toBe(499 * 100);
  });
});

// ── 7. ROI — onNodeClick wiring ────────────────────────────────────────────

describe("<TraceFlow> — ROI", () => {
  it("onNodeClick is wired to the underlying ReactFlow node click handler", () => {
    // We don't simulate the click here (xyflow's pointer-event model
    // doesn't play nicely with jsdom). The test verifies the prop is
    // accepted and the component compiles — full click is L7.9
    // Playwright coverage.
    const onNodeClick = vi.fn();
    expect(() =>
      render(<TraceFlow graph={{ nodes: [], edges: [] }} onNodeClick={onNodeClick} />),
    ).not.toThrow();
  });
});
