/**
 * Layout pipeline — integration smoke test.
 *
 * Renders a canonical diamond through the SAME composed pipeline `<TracedFlow>`
 * uses by default — measure-fed dagre → snap (spine drift) → fork+merge
 * centering — and asserts content-exact output: the fork AND the merge both
 * center on the branch span-midpoint (a symmetric diamond), and the linear
 * trunk/spine is straight, EVEN when the branches have unequal widths.
 *
 * Why this exists (the guardrail for an integration-drift class no version
 * audit can catch): the two bugs this run found both produced a chart that was
 * on the right code but silently MIS-LAID-OUT —
 *   1. the measure-then-layout probe read getNodes() (always 0×0) → estimated
 *      fallback widths → off-center forks/deciders;
 *   2. only forks were centered, so a diamond's merge drifted off the axis.
 * A version/range check (`audit:family`) sees neither — every version was
 * correct. This test exercises the real composition end-to-end so a regression
 * back to off-center output fails CI. It injects measured sizes through the
 * resolver exactly as the live probe would (no DOM/measurement needed → not
 * flaky in jsdom).
 *
 * Test types (Convention 3): integration, functional, property.
 */
import { describe, it, expect } from "vitest";
import type { Edge } from "@xyflow/react";
import {
  createDagreTraceLayout,
  type NodeFootprint,
  type NodeSizeResolver,
} from "../../src/components/FlowchartView/_internal/dagreTraceLayout";
import { createSnappedDagreLayout } from "../../src/components/FlowchartView/_internal/snapLinearSuccessors";
import { withForkCentering } from "../../src/components/FlowchartView/_internal/centerForkParents";
import type {
  TraceGraph,
  TraceNode,
  TraceNodeData,
  TraceEdgeData,
} from "../../src/components/FlowchartView/traceStructureRecorder";

const node = (id: string, extra: Partial<TraceNode> = {}): TraceNode =>
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
    ...extra,
  }) as TraceNode;

const edge = (s: string, t: string): Edge<TraceEdgeData> => ({
  id: `${s}->${t}`,
  source: s,
  target: t,
  data: { kind: "next" },
});

/** The EXACT default pipeline TracedFlow composes (mirror of its `dagreBase`). */
function defaultPipeline(measured: Record<string, NodeFootprint>) {
  const nodeSize: NodeSizeResolver = (n) => measured[n.id];
  const sizeOpts = { nodeSize };
  return withForkCentering(
    createSnappedDagreLayout(
      createDagreTraceLayout({ ...sizeOpts, rankSep: 52, nodeSep: 36 }),
      sizeOpts,
    ),
    { ...sizeOpts, nodeSep: 36 },
  );
}

describe("layout pipeline — content-exact symmetric diamond (integration)", () => {
  // decide → {wide, n1, n2} → cache → call. The wide branch makes the
  // span-midpoint diverge from dagre's barycenter — the exact shape that left
  // the merge off-center before the fix.
  const measured: Record<string, NodeFootprint> = {
    decide: { width: 120, height: 72 },
    wide: { width: 220, height: 40 },
    n1: { width: 80, height: 40 },
    n2: { width: 80, height: 40 },
    cache: { width: 110, height: 40 },
    call: { width: 130, height: 40 },
  };
  const graph: TraceGraph = {
    nodes: ["decide", "wide", "n1", "n2", "cache", "call"].map((id) =>
      node(id, id === "decide" ? { data: { ...node(id).data, isDecider: true } } : {}),
    ),
    edges: [
      edge("decide", "wide"),
      edge("decide", "n1"),
      edge("decide", "n2"),
      edge("wide", "cache"),
      edge("n1", "cache"),
      edge("n2", "cache"),
      edge("cache", "call"),
    ],
  };

  const run = () => {
    const out = defaultPipeline(measured)(graph);
    const cx = (id: string) => {
      const n = out.nodes.find((x) => x.id === id)!;
      return n.position.x + measured[id].width / 2;
    };
    const branches = [cx("wide"), cx("n1"), cx("n2")];
    const branchMid = (Math.min(...branches) + Math.max(...branches)) / 2;
    return { cx, branchMid };
  };

  it("integration: the FORK centers on the branch span-midpoint", () => {
    const { cx, branchMid } = run();
    expect(cx("decide")).toBeCloseTo(branchMid, 3);
  });

  it("integration: the MERGE centers on the same span-midpoint (the bug that was off by ~49px)", () => {
    const { cx, branchMid } = run();
    expect(cx("cache")).toBeCloseTo(branchMid, 3);
  });

  it("functional: the diamond is vertically symmetric and the spine below it is straight", () => {
    const { cx } = run();
    expect(cx("decide")).toBeCloseTo(cx("cache"), 3); // fork axis == merge axis
    expect(cx("call")).toBeCloseTo(cx("cache"), 3); // trunk below the merge follows
  });

  it("property: the diamond stays symmetric for ANY branch-width skew", () => {
    for (let t = 0; t < 120; t++) {
      const m: Record<string, NodeFootprint> = {
        decide: { width: 120, height: 72 },
        wide: { width: 60 + ((t * 17) % 240), height: 40 },
        n1: { width: 60 + ((t * 7) % 180), height: 40 },
        n2: { width: 60 + ((t * 13) % 180), height: 40 },
        cache: { width: 110, height: 40 },
        call: { width: 130, height: 40 },
      };
      const out = defaultPipeline(m)({ ...graph });
      const cx = (id: string) => {
        const n = out.nodes.find((x) => x.id === id)!;
        return n.position.x + m[id].width / 2;
      };
      // fork axis and merge axis coincide regardless of how skewed the branches are
      expect(cx("decide")).toBeCloseTo(cx("cache"), 3);
      expect(cx("call")).toBeCloseTo(cx("cache"), 3);
    }
  });
});
