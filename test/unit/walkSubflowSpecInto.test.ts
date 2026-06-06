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
    // Node id is path-qualified (mirrors runtimeStageId); subflowOf stays bare.
    expect(sink.nodes[0]!.id).toBe("sub/only");
    expect(sink.nodes[0]!.data.subflowOf).toBe("sub");
  });

  it("linear chain — emits stages + next edges in order", () => {
    const chain: SpecNode = {
      ...spec("a"),
      next: { ...spec("b"), next: spec("c") },
    };
    const sink = makeSink();
    walkSubflowSpecInto(chain, "sub", sink);

    expect(sink.nodes.map((n) => n.id)).toEqual(["sub/a", "sub/b", "sub/c"]);
    expect(sink.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ source: "sub/a", target: "sub/b", data: { kind: "next" } }),
        expect.objectContaining({ source: "sub/b", target: "sub/c", data: { kind: "next" } }),
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
    expect(loopEdges[0]).toMatchObject({ source: "sub/b", target: "sub/a" });
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
    // Fully composed path qualifies the innermost stage id.
    expect(innerStages.map((n) => n.id)).toContain("outer/inner/inner-leaf");
  });

  it("cycle guard — visiting same node twice doesn't re-emit", () => {
    // Construct a deliberately self-referential structure (shouldn't
    // happen in practice but the visited-set should defend).
    const node: any = spec("a");
    node.next = node;

    const sink = makeSink();
    walkSubflowSpecInto(node, "sub", sink);
    // 'a' emitted at most once (id qualified as 'sub/a').
    expect(sink.nodes.filter((n) => n.id === "sub/a")).toHaveLength(1);
  });

  it("isSubflow flag propagates onto mount nodes", () => {
    const innerMount: SpecNode = spec("mount", "Mount", {
      isSubflowRoot: true,
      subflowId: "nested",
      subflowStructure: spec("leaf"),
    });
    const sink = makeSink();
    walkSubflowSpecInto(innerMount, "outer", sink);
    // Mount node id is path-qualified; subflowId stays the LOCAL id.
    const mountNode = sink.nodes.find((n) => n.id === "outer/mount");
    expect(mountNode?.data.isSubflow).toBe(true);
    expect(mountNode?.data.subflowId).toBe("nested");
  });

  it("REGRESSION: two sibling subflows sharing a local stage id get DISTINCT qualified ids", () => {
    // The bug: two slot subflows each have an inner stage named `compose`.
    // Walked into ONE graph they must NOT collide (the recorder dedupes by
    // id; a collision would orphan one of them — the floating-Compose bug
    // seen in the messageAPI merge-tree chart).
    const compose = spec("compose", "Compose");
    const sink = makeSink();
    walkSubflowSpecInto(compose, "sf-system-prompt", sink);
    walkSubflowSpecInto(compose, "sf-messages", sink);

    const ids = sink.nodes.map((n) => n.id);
    expect(ids).toEqual(["sf-system-prompt/compose", "sf-messages/compose"]);
    // Distinct ids → no dedup collision when fed to a single recorder.
    expect(new Set(ids).size).toBe(2);
  });
});
