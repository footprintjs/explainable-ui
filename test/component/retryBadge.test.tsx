/** @vitest-environment jsdom */
/**
 * The attempt badge — a retried stage says so ON THE CHART.
 *
 * Until 0.37.0 a stage that failed twice and then succeeded looked, on the
 * flowchart, exactly like a stage that sailed through first time: the retry
 * lines existed only in the narrative. These tests pin the badge and, more
 * importantly, pin what it must NOT say — a policy that was declared and never
 * fired gets nothing, because declared is not the same as happened.
 *
 * Test types (Convention 3): unit, functional, accessibility, regression,
 * integration (through `<TracedFlow>` with a real overlay).
 */

import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, waitFor } from "@testing-library/react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ReactFlowProvider } from "@xyflow/react";
import { StageNode } from "../../src/components/StageNode";
import type { StageNodeData } from "../../src/components/StageNode/StageNode";
import { TracedFlow } from "../../src/flowchart";
import type { TraceGraph } from "../../src/components/FlowchartView/traceStructureRecorder";
import {
  createTraceRuntimeOverlay,
  type RuntimeOverlay,
} from "../../src/components/FlowchartView/createTraceRuntimeOverlay";

afterEach(cleanup);

/** Render one StageNode to static HTML. */
function html(data: Partial<StageNodeData>): string {
  const props = { data: { label: "FetchQuote", ...data } } as unknown as Parameters<
    typeof StageNode
  >[0];
  return renderToStaticMarkup(
    createElement(ReactFlowProvider, null, createElement(StageNode, props)),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// The badge itself
// ─────────────────────────────────────────────────────────────────────────────

describe("StageNode — attempt badge", () => {
  it("unit: attempts > 1 renders the ↺ ×N chip", () => {
    const out = html({ retryAttempts: 3, done: true });
    expect(out).toContain("\u21BA"); // ↺
    expect(out).toContain("×3");
  });

  it("unit: attempts == 1 renders NOTHING — one attempt is the silent default", () => {
    expect(html({ retryAttempts: 1, done: true })).not.toContain("\u21BA");
  });

  it("unit: no attempt data renders nothing (the ordinary stage)", () => {
    expect(html({ done: true })).not.toContain("\u21BA");
  });

  it("regression: a DECLARED-but-never-fired policy shows nothing", () => {
    // The overlay only ever records executions that actually retried, so the
    // node arrives with no `retryAttempts` at all. Pinned here because the
    // tempting shortcut — reading the declared policy off the structure event
    // — would paint healthy stages as flaky (and would miss every
    // `.retry()` modifier form anyway; see the golden honesty pin).
    expect(html({ retryAttempts: undefined, done: true })).not.toContain("\u21BA");
  });

  it("accessibility: the label says how many attempts AND how the last one ended", () => {
    expect(html({ retryAttempts: 3, done: true })).toContain(
      "retried, attempt 3 of 3 succeeded",
    );
  });

  it("accessibility: a stage that exhausted its policy reads `failed`, not `succeeded`", () => {
    expect(html({ retryAttempts: 3, error: true })).toContain("retried, attempt 3 of 3 failed");
  });

  it("functional: the badge sits ALONGSIDE the error state, never replacing it", () => {
    // A stage whose retries all failed is still a failed stage. The chip is
    // attempt telemetry; the red is the outcome.
    const out = html({ retryAttempts: 3, error: true });
    expect(out).toContain("\u21BA");
    expect(out).toContain("\u2717"); // the error ✗ glyph
  });

  it("functional: a decider (diamond) wears the same chip as a rectangle", () => {
    // The chip hangs off the shared outer wrapper, so both shapes get it —
    // the diamond's clip-path would have swallowed an inner one.
    expect(html({ retryAttempts: 2, isDecider: true, done: true })).toContain("\u21BA");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// End to end: overlay → chart
// ─────────────────────────────────────────────────────────────────────────────

const node = (id: string) =>
  ({
    id,
    type: "stage",
    position: { x: 0, y: 0 },
    data: {
      label: id,
      isDecider: false,
      isFork: false,
      isStreaming: false,
      isSubflow: false,
      prevIds: [],
      nextIds: [],
    },
  }) as unknown as TraceGraph["nodes"][number];

const graph: TraceGraph = {
  nodes: [node("fetch-quote"), node("settle")],
  edges: [
    {
      id: "fetch-quote->settle",
      source: "fetch-quote",
      target: "settle",
      data: { kind: "next" },
    },
  ],
} as unknown as TraceGraph;

/** A live overlay for: FetchQuote fails twice then succeeds, Settle runs once
 *  under a declared policy it never needs. */
function retriedRun(): RuntimeOverlay {
  const h = createTraceRuntimeOverlay();
  const tc = (rsid: string) => ({ runtimeStageId: rsid, runId: "run-1" });
  h.recorder.onStageRetry!({
    stageName: "FetchQuote",
    stageId: "fetch-quote",
    attempt: 1,
    maxAttempts: 3,
    delayMs: 0,
    message: "503",
    traversalContext: tc("fetch-quote#0"),
  });
  h.recorder.onStageRetry!({
    stageName: "FetchQuote",
    stageId: "fetch-quote",
    attempt: 2,
    maxAttempts: 3,
    delayMs: 0,
    message: "503",
    traversalContext: tc("fetch-quote#0"),
  });
  h.recorder.onStageExecuted!({
    stageName: "FetchQuote",
    stageType: "linear",
    traversalContext: tc("fetch-quote#0"),
  });
  h.recorder.onStageExecuted!({
    stageName: "Settle",
    stageType: "linear",
    traversalContext: tc("settle#1"),
  });
  return h.getOverlay();
}

/** The chip rendered on a given chart node, if any. */
function badgeOn(container: HTMLElement, nodeId: string): string | null {
  const el = Array.from(container.querySelectorAll<HTMLElement>(".react-flow__node")).find(
    (n) => n.getAttribute("data-id") === nodeId,
  );
  expect(el, `node ${nodeId} rendered`).toBeTruthy();
  return el!.querySelector<HTMLElement>('[role="img"]')?.getAttribute("aria-label") ?? null;
}

describe("TracedFlow — a retried stage is visible on the chart (INTEGRATION)", () => {
  it("the retried node wears the badge; the never-retried node does not", async () => {
    const { container } = render(
      createElement(TracedFlow, { graph, overlay: retriedRun(), layout: "passthrough" }),
    );
    await waitFor(() => expect(badgeOn(container, "fetch-quote")).toBeTruthy());
    expect(badgeOn(container, "fetch-quote")).toBe("retried, attempt 3 of 3 succeeded");
    expect(badgeOn(container, "settle")).toBeNull();
  });

  it("at the first cursor, only the stage that actually retried is marked", async () => {
    const { container } = render(
      createElement(TracedFlow, {
        graph,
        overlay: retriedRun(),
        scrubIndex: 0,
        layout: "passthrough",
      }),
    );
    // Step 0 IS fetch-quote — all three attempts happened inside that ONE
    // step, which is the whole point: retries do not add cursor positions.
    // `settle` declares a policy it never needed and stays clean.
    await waitFor(() => expect(badgeOn(container, "fetch-quote")).toBeTruthy());
    expect(badgeOn(container, "settle")).toBeNull();
  });
});
