/** @vitest-environment jsdom */
/**
 * TracedFlow — raw-layout dev guardrail.
 *
 * Passing the BARE exported `dagreTraceLayout` as the `layout` prop opts out of
 * the built-in measure-then-layout pipeline (content-exact sizing + fork/merge
 * centering + straight spines). That is a silent footgun — it once made the
 * lens render stale while pinned to a current eui. TracedFlow dev-warns so a
 * consumer notices; this pins that behavior.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { createElement } from "react";
import { TracedFlow, dagreTraceLayout } from "../../src/flowchart";
import type {
  TraceGraph,
  TraceNode,
  TraceNodeData,
} from "../../src/components/FlowchartView/traceStructureRecorder";

const node = (id: string): TraceNode =>
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
    } as TraceNodeData,
  }) as TraceNode;

const graph: TraceGraph = {
  nodes: [node("a"), node("b")],
  edges: [{ id: "a->b", source: "a", target: "b", data: { kind: "next" } }],
};

const warnedBypass = (warn: ReturnType<typeof vi.spyOn>) =>
  warn.mock.calls.some((c) => String(c[0]).includes("bypasses the"));

afterEach(cleanup);

describe("TracedFlow — raw-layout dev guardrail", () => {
  it("WARNS when handed the bare dagreTraceLayout", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(createElement(TracedFlow, { graph, layout: dagreTraceLayout }));
    expect(warnedBypass(warn)).toBe(true);
    warn.mockRestore();
  });

  it("does NOT warn when `layout` is omitted (the canonical pipeline)", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(createElement(TracedFlow, { graph }));
    expect(warnedBypass(warn)).toBe(false);
    warn.mockRestore();
  });
});
