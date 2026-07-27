/** @vitest-environment jsdom */
/**
 * ExplainableShell — the three ways a replay used to fail QUIETLY.
 *
 * 1. Chart rendered but grey. `runtimeSnapshot` + `traceGraph` with no
 *    `runtimeOverlay` painted every node in its base colour — the run's own
 *    commit log was right there and nobody read it. The shell now derives the
 *    overlay (`overlayFromSnapshot`) when the prop is absent. OLD BEHAVIOUR:
 *    no node is dimmed and no step badge is drawn, because the overlay's
 *    execution order was empty.
 * 2. No chart at all. Handed run data with no `traceGraph`, the shell omitted
 *    the entire chart region with no console line and no note. OLD BEHAVIOUR:
 *    nothing is logged and nothing is rendered in its place.
 * 3. Chrome around nothing. Zero stages rendered the full three-panel shell
 *    with empty rows and no diagnosis. OLD BEHAVIOUR: no `shell-empty` node
 *    existed anywhere in the file.
 */
import { describe, expect, it, vi, afterEach } from "vitest";
import { render, cleanup, waitFor } from "@testing-library/react";
import * as React from "react";

import { ExplainableShell } from "../../src/components/ExplainableShell/ExplainableShell";
import type { TraceGraph } from "../../src/components/FlowchartView/traceStructureRecorder";

// ── Fixtures ──────────────────────────────────────────────────────────────
// A two-stage run recorded to a commit log, plus a chart with a THIRD stage
// that never ran — the un-run node is what proves the overlay was applied.

function runtimeNode(id: string, name: string, next?: unknown) {
  return {
    id,
    name,
    runtimeStageId: `${id}#${id === "alpha" ? 0 : 1}`,
    logs: {},
    errors: {},
    metrics: {},
    evals: {},
    ...(next ? { next } : {}),
  };
}

const RECORDING = {
  sharedState: { total: 3 },
  executionTree: runtimeNode("alpha", "Alpha", runtimeNode("beta", "Beta")),
  commitLog: [
    { idx: 0, stage: "Alpha", stageId: "alpha", runtimeStageId: "alpha#0", overwrite: {}, updates: {} },
    { idx: 1, stage: "Beta", stageId: "beta", runtimeStageId: "beta#1", overwrite: {}, updates: {} },
  ],
};

const GRAPH: TraceGraph = {
  nodes: [
    { id: "alpha", type: "stage", position: { x: 0, y: 0 }, data: { label: "Alpha", prevIds: [], nextIds: [] } },
    { id: "beta", type: "stage", position: { x: 0, y: 0 }, data: { label: "Beta", prevIds: [], nextIds: [] } },
    { id: "gamma", type: "stage", position: { x: 0, y: 0 }, data: { label: "Gamma", prevIds: [], nextIds: [] } },
  ],
  edges: [
    { id: "a->b", source: "alpha", target: "beta", data: { kind: "next" } },
    { id: "b->g", source: "beta", target: "gamma", data: { kind: "next" } },
  ],
} as unknown as TraceGraph;

function chartNode(container: HTMLElement, id: string): HTMLElement {
  const el = container.querySelector<HTMLElement>(`.react-flow__node[data-id="${id}"]`);
  expect(el, `node ${id} rendered`).toBeTruthy();
  return el!;
}

afterEach(cleanup);

// ── 1. The overlay the shell can work out for itself ──────────────────────

describe("ExplainableShell — a recording colours its own chart", () => {
  it("lights the executed path with NO runtimeOverlay prop", async () => {
    const { container } = render(
      React.createElement(ExplainableShell, {
        runtimeSnapshot: RECORDING as never,
        traceGraph: GRAPH,
      }),
    );

    await waitFor(() => expect(container.querySelectorAll(".react-flow__node").length).toBe(3));

    // The cursor sits on the first stage; the un-run stage fades. Without the
    // derived overlay NOTHING is dimmed — that is the old, grey chart.
    await waitFor(() => expect(chartNode(container, "gamma").style.opacity).toBe("0.35"));
    expect(chartNode(container, "alpha").style.opacity).toBe("");

    // Executed stages carry their execution-order badge.
    expect(chartNode(container, "alpha").textContent).toContain("1");
  });

  it("an explicit overlay still wins over the derived one", async () => {
    const { container } = render(
      React.createElement(ExplainableShell, {
        runtimeSnapshot: RECORDING as never,
        traceGraph: GRAPH,
        // This run "executed" only gamma — nothing like the commit log.
        runtimeOverlay: {
          executionOrder: [
            { runtimeStageId: "gamma#0", stageId: "gamma", stageName: "Gamma", timestampMs: 0 },
          ],
          errors: new Map(),
          running: false,
        } as never,
      }),
    );

    await waitFor(() => expect(container.querySelectorAll(".react-flow__node").length).toBe(3));
    await waitFor(() => expect(chartNode(container, "alpha").style.opacity).toBe("0.35"));
    expect(chartNode(container, "gamma").style.opacity).toBe("");
  });
});

// ── 2. The missing ingredient, named ──────────────────────────────────────

describe("ExplainableShell — no traceGraph is stated, not hidden", () => {
  it("warns in the console and names both ways to get a graph", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      React.createElement(ExplainableShell, {
        runtimeSnapshot: RECORDING as never,
      }),
    );
    const said = warn.mock.calls.map((c) => String(c[0])).join("\n");
    expect(said).toContain("traceGraph");
    expect(said).toContain("createTraceStructureRecorder");
    expect(said).toContain("graphFromStructure");
    warn.mockRestore();
  });

  it("shows the note where the chart would have been", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { container } = render(
      React.createElement(ExplainableShell, {
        runtimeSnapshot: RECORDING as never,
      }),
    );
    const note = container.querySelector('[data-fp="shell-missing-chart"]');
    expect(note).toBeTruthy();
    expect(note!.textContent).toContain("traceGraph");
    warn.mockRestore();
  });

  it("says nothing when the chart IS there", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { container } = render(
      React.createElement(ExplainableShell, {
        runtimeSnapshot: RECORDING as never,
        traceGraph: GRAPH,
      }),
    );
    await waitFor(() => expect(container.querySelectorAll(".react-flow__node").length).toBe(3));
    expect(container.querySelector('[data-fp="shell-missing-chart"]')).toBeNull();
    const said = warn.mock.calls.map((c) => String(c[0])).join("\n");
    expect(said).not.toContain("[ExplainableShell] No chart");
    warn.mockRestore();
  });
});

// ── 3. Nothing to show, said out loud ─────────────────────────────────────

describe("ExplainableShell — the empty state diagnoses", () => {
  it("with nothing passed, names the props that carry a run", () => {
    const { container } = render(React.createElement(ExplainableShell, {}));
    const empty = container.querySelector('[data-fp="shell-empty"]');
    expect(empty).toBeTruthy();
    expect(empty!.textContent).toContain("runtimeSnapshot");
    expect(empty!.textContent).toContain("traceGraph");
  });

  it("with a snapshot it cannot read, says so and shows why", () => {
    const { container } = render(
      React.createElement(ExplainableShell, {
        // `recorders` must be a list of recorder snapshots; a number is not
        // a shape this library can read.
        runtimeSnapshot: { ...RECORDING, recorders: 42 } as never,
      }),
    );
    const empty = container.querySelector('[data-fp="shell-empty"]');
    expect(empty).toBeTruthy();
    expect(empty!.textContent).toContain("could not be read");
    expect(container.querySelector('[data-fp="shell-empty-detail"]')!.textContent).toContain(
      "getSnapshot()",
    );
  });

  it("with an empty pre-converted array, blames the run, not the caller", () => {
    const { container } = render(React.createElement(ExplainableShell, { snapshots: [] }));
    expect(container.querySelector('[data-fp="shell-empty"]')!.textContent).toContain(
      "no stages to show",
    );
  });

  it("keeps working in unstyled mode", () => {
    const { container } = render(React.createElement(ExplainableShell, { unstyled: true }));
    expect(container.querySelector('[data-fp="shell-empty"]')).toBeTruthy();
  });

  it("goes away as soon as there is a run to show", async () => {
    const { container, rerender } = render(React.createElement(ExplainableShell, {}));
    expect(container.querySelector('[data-fp="shell-empty"]')).toBeTruthy();
    rerender(
      React.createElement(ExplainableShell, {
        runtimeSnapshot: RECORDING as never,
        traceGraph: GRAPH,
      }),
    );
    await waitFor(() => expect(container.querySelectorAll(".react-flow__node").length).toBe(3));
    expect(container.querySelector('[data-fp="shell-empty"]')).toBeNull();
  });
});
