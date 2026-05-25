/**
 * Unit tests for `walkSubflowSpecInto` — explainable-ui's local mirror
 * of footprintjs's `walkSubflowSpec`. Kept local to preserve the
 * no-`footprintjs`-dep boundary (see traceStructureRecorder.ts JSDoc).
 *
 * MIRROR-DRIFT GUARD: these tests pin the contract this local helper
 * must satisfy. If footprintjs's walker semantics change upstream
 * (e.g., order of children, treatment of loop edges, composed-path
 * format), the divergence surfaces here at test time rather than in
 * production rendering.
 */

import type { Node, Edge } from "@xyflow/react";
import { describe, it, expect } from "vitest";
import type {
  TraceEdgeData,
  TraceNodeData,
} from "../../src/components/FlowchartView/traceStructureRecorder";
import { walkSubflowSpecInto } from "../../src/components/FlowchartView/_internal/walkSubflowSpecInto";

interface SpecNode {
  readonly id: string;
  readonly name: string;
  readonly type?: "stage" | "decider" | "selector" | "fork" | "streaming" | "subflow" | "loop";
  readonly children?: readonly SpecNode[];
  readonly next?: SpecNode;
  readonly loopTarget?: string;
  readonly isLoopReference?: boolean;
  readonly isSubflowRoot?: boolean;
  readonly subflowId?: string;
  readonly subflowName?: string;
  readonly subflowStructure?: SpecNode;
}

function spec(id: string, name = id, extra: Partial<SpecNode> = {}): SpecNode {
  return { id, name, type: "stage", ...extra };
}

function makeSink() {
  const nodes: Array<Node<TraceNodeData>> = [];
  const edges: Array<Edge<TraceEdgeData>> = [];
  return {
    nodes,
    edges,
    upsertNode: (n: Node<TraceNodeData>) => nodes.push(n),
    pushEdge: (e: Edge<TraceEdgeData>) => edges.push(e),
  };
}

describe("walkSubflowSpecInto", () => {
  it("single-stage spec — emits one node with subflowOf set", () => {
    const sink = makeSink();
    walkSubflowSpecInto(spec("only"), "sub", sink);
    expect(sink.nodes).toHaveLength(1);
    expect(sink.nodes[0]!.id).toBe("only");
    expect(sink.nodes[0]!.data.subflowOf).toBe("sub");
  });

  it("linear chain — emits stages + next edges in order", () => {
    const chain: SpecNode = {
      ...spec("a"),
      next: { ...spec("b"), next: spec("c") },
    };
    const sink = makeSink();
    walkSubflowSpecInto(chain, "sub", sink);

    expect(sink.nodes.map((n) => n.id)).toEqual(["a", "b", "c"]);
    expect(sink.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ source: "a", target: "b", data: { kind: "next" } }),
        expect.objectContaining({ source: "b", target: "c", data: { kind: "next" } }),
      ]),
    );
  });

  it("every emitted node carries subflowOf = the passed subflowPath", () => {
    const chain: SpecNode = { ...spec("a"), next: spec("b") };
    const sink = makeSink();
    walkSubflowSpecInto(chain, "auth/verify", sink);
    for (const n of sink.nodes) {
      expect(n.data.subflowOf).toBe("auth/verify");
    }
  });

  it("decider with branches — emits decision-branch edges with label", () => {
    const decider: SpecNode = {
      ...spec("d", "Decide", { type: "decider" }),
      children: [spec("low"), spec("high")],
    };
    const sink = makeSink();
    walkSubflowSpecInto(decider, "sub", sink);

    const branchEdges = sink.edges.filter((e) => e.data?.kind === "decision-branch");
    expect(branchEdges).toHaveLength(2);
    expect(branchEdges[0]!.label).toBe("low");
    expect(branchEdges[1]!.label).toBe("high");
  });

  it("fork — emits fork-branch edges", () => {
    const fork: SpecNode = {
      ...spec("f", "Parallel", { type: "fork" }),
      children: [spec("a"), spec("b")],
    };
    const sink = makeSink();
    walkSubflowSpecInto(fork, "sub", sink);

    const forkEdges = sink.edges.filter((e) => e.data?.kind === "fork-branch");
    expect(forkEdges).toHaveLength(2);
  });

  it("loop reference — emits a loop edge", () => {
    const chain: SpecNode = {
      ...spec("a"),
      next: { ...spec("b"), next: spec("loop-ref", "loop", { isLoopReference: true }), loopTarget: "a" },
    };
    const sink = makeSink();
    walkSubflowSpecInto(chain, "sub", sink);

    const loopEdges = sink.edges.filter((e) => e.data?.kind === "loop");
    expect(loopEdges).toHaveLength(1);
    expect(loopEdges[0]).toMatchObject({ source: "b", target: "a" });
  });

  it("nested subflow — recurses with composed path", () => {
    const innermost: SpecNode = spec("inner-leaf");
    const innerMount: SpecNode = {
      ...spec("inner-mount", "InnerMount", {
        isSubflowRoot: true,
        subflowId: "inner",
        subflowStructure: innermost,
      }),
    };
    const outerRoot: SpecNode = { ...spec("outer-root"), next: innerMount };

    const sink = makeSink();
    walkSubflowSpecInto(outerRoot, "outer", sink);

    // Outer-level stages tagged with 'outer'
    const outerStages = sink.nodes.filter((n) => n.data.subflowOf === "outer");
    expect(outerStages.length).toBeGreaterThan(0);

    // Innermost stage tagged with composed path 'outer/inner'
    const innerStages = sink.nodes.filter((n) => n.data.subflowOf === "outer/inner");
    expect(innerStages.length).toBeGreaterThan(0);
    expect(innerStages.map((n) => n.id)).toContain("inner-leaf");
  });

  it("cycle guard — visiting same node twice doesn't re-emit", () => {
    // Construct a deliberately self-referential structure (shouldn't
    // happen in practice but the visited-set should defend).
    const node: any = spec("a");
    node.next = node;

    const sink = makeSink();
    walkSubflowSpecInto(node, "sub", sink);
    // 'a' emitted at most once.
    expect(sink.nodes.filter((n) => n.id === "a")).toHaveLength(1);
  });

  it("isSubflow flag propagates onto mount nodes", () => {
    const innerMount: SpecNode = spec("mount", "Mount", {
      isSubflowRoot: true,
      subflowId: "nested",
      subflowStructure: spec("leaf"),
    });
    const sink = makeSink();
    walkSubflowSpecInto(innerMount, "outer", sink);
    const mountNode = sink.nodes.find((n) => n.id === "mount");
    expect(mountNode?.data.isSubflow).toBe(true);
    expect(mountNode?.data.subflowId).toBe("nested");
  });
});
