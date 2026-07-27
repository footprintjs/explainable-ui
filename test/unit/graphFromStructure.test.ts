/**
 * graphFromStructure — the post-hoc twin of createTraceStructureRecorder.
 *
 * The contract this file pins: a chart drawn from its SAVED
 * `buildTimeStructure` is the same chart the live recorder collected while
 * footprintjs built it. Same nodes, same ids, same edges, same order.
 *
 * These charts are built with the REAL footprintjs devDependency (build
 * only — nothing runs, so there is no wall clock and no nondeterminism),
 * which is the point: a hand-written structure fixture would pin our own
 * assumptions instead of the engine's actual serialization.
 *
 * Before this adapter existed the only spec→graph route in the ecosystem
 * was `structureGraphFromSpec` from `agentfootprint-lens/core`, which
 * imports `agentfootprint` — so a plain footprintjs consumer had to install
 * an agent framework to draw a saved run. This test would not compile
 * against the old code: there was no `graphFromStructure` to import.
 */
import { describe, it, expect } from "vitest";
import { flowChart, decide, select } from "footprintjs";
import { graphFromStructure } from "../../src/adapters/graphFromStructure";
import {
  createTraceStructureRecorder,
  type TraceGraph,
} from "../../src/components/FlowchartView/traceStructureRecorder";

const noop = async () => {};

/** Build a chart with the live recorder attached; return BOTH graphs. */
function bothGraphs(build: (recorder: unknown) => { buildTimeStructure: unknown }): {
  live: TraceGraph;
  posthoc: TraceGraph;
} {
  const trace = createTraceStructureRecorder();
  const chart = build(trace.recorder);
  return { live: trace.getGraph(), posthoc: graphFromStructure(chart.buildTimeStructure) };
}

/** `defaultBranch` is the one field a serialized structure cannot carry —
 *  footprintjs names it on the live `onDeciderComplete` event only (see the
 *  module JSDoc). Strip it so the rest can be compared exactly. */
function withoutDefaultBranch(graph: TraceGraph): TraceGraph {
  return {
    nodes: graph.nodes.map((n) => {
      const { defaultBranch: _drop, ...data } = n.data;
      return { ...n, data } as (typeof graph.nodes)[number];
    }),
    edges: graph.edges,
  };
}

// ── Unit ────────────────────────────────────────────────────────────────

describe("graphFromStructure — unit", () => {
  it("rebuilds a linear chain identically to the live recorder", () => {
    const { live, posthoc } = bothGraphs((recorder) =>
      flowChart("Intake", noop, "intake", {
        description: "Receive the application",
        structureRecorders: [recorder as never],
      })
        .addFunction("Enrich", noop, "enrich", "Attach the profile")
        .addFunction("Finish", noop, "finish")
        .build(),
    );

    expect(posthoc.nodes.map((n) => n.id)).toEqual(["intake", "enrich", "finish"]);
    expect(posthoc).toEqual(live);
  });

  it("carries the label, description and stage flags onto each node", () => {
    const { posthoc } = bothGraphs((recorder) =>
      flowChart("Intake", noop, "intake", {
        description: "Receive the application",
        structureRecorders: [recorder as never],
      })
        .addFunction("Enrich", noop, "enrich", "Attach the profile")
        .build(),
    );

    const enrich = posthoc.nodes.find((n) => n.id === "enrich")!;
    expect(enrich.data.label).toBe("Enrich");
    expect(enrich.data.description).toBe("Attach the profile");
    expect(enrich.data.isDecider).toBe(false);
    expect(enrich.data.prevIds).toEqual(["intake"]);
  });
});

// ── Integration (real engine shapes) ────────────────────────────────────

describe("graphFromStructure — real charts", () => {
  it("a decider and its branches match the live graph (bar the unserialized defaultBranch)", () => {
    const { live, posthoc } = bothGraphs((recorder) =>
      flowChart("Intake", noop, "intake", { structureRecorders: [recorder as never] })
        .addDeciderFunction(
          "ClassifyRisk",
          (scope) => decide(scope, [{ when: () => true, then: "approve" }], "reject"),
          "classify-risk",
          "Route by risk",
        )
        .addFunctionBranch("approve", "Approve", noop, "Issue approval")
        .addFunctionBranch("reject", "Reject", noop, "Issue rejection")
        .setDefault("reject")
        .end()
        .build(),
    );

    const decider = posthoc.nodes.find((n) => n.id === "classify-risk")!;
    expect(decider.data.isDecider).toBe(true);
    expect(decider.data.branchIds).toEqual(["approve", "reject"]);
    expect(posthoc.edges.filter((e) => e.data?.kind === "decision-branch").map((e) => e.target)).toEqual([
      "approve",
      "reject",
    ]);
    expect(withoutDefaultBranch(posthoc)).toEqual(withoutDefaultBranch(live));

    // Honest absence: the live event names the fallback branch, the saved
    // structure has no field for it. We omit rather than guess.
    expect(live.nodes.find((n) => n.id === "classify-risk")!.data.defaultBranch).toBe("reject");
    expect(decider.data.defaultBranch).toBeUndefined();
  });

  it("a selector's branches converge on one join node, announced once", () => {
    const { live, posthoc } = bothGraphs((recorder) =>
      flowChart("LoadPatient", noop, "load-patient", { structureRecorders: [recorder as never] })
        .addSelectorFunction(
          "Screen",
          (scope) => select(scope, [{ when: () => true, then: "diabetes" }]),
          "screen",
        )
        .addFunctionBranch("diabetes", "DiabetesScreening", noop)
        .addFunctionBranch("hypertension", "HypertensionCheck", noop)
        .end()
        .addFunction("Summarize", noop, "summarize")
        .build(),
    );

    expect(posthoc.nodes.filter((n) => n.id === "summarize")).toHaveLength(1);
    expect(posthoc.nodes.find((n) => n.id === "summarize")!.data.prevIds).toEqual([
      "diabetes",
      "hypertension",
    ]);
    expect(withoutDefaultBranch(posthoc)).toEqual(withoutDefaultBranch(live));
  });

  it("a mounted subflow yields the mount node plus path-qualified internals", () => {
    const { live, posthoc } = bothGraphs((recorder) => {
      const inner = flowChart("Normalize", noop, "normalize")
        .addFunction("Score", noop, "score")
        .build();
      return flowChart("Seed", noop, "seed", { structureRecorders: [recorder as never] })
        .addSubFlowChartNext("sf-enrich", inner, "EnrichText")
        .addFunction("Refine", noop, "refine")
        .build();
    });

    const mount = posthoc.nodes.find((n) => n.id === "sf-enrich")!;
    expect(mount.data.isSubflow).toBe(true);
    expect(mount.data.subflowId).toBe("sf-enrich");
    // Inner ids are path-qualified exactly like the runtime's
    // `subflowPath/stageId` — that is what lets the overlay light them.
    expect(posthoc.nodes.map((n) => n.id)).toContain("sf-enrich/normalize");
    expect(posthoc.nodes.find((n) => n.id === "sf-enrich/score")!.data.subflowOf).toBe("sf-enrich");
    expect(posthoc).toEqual(live);
  });

  it("a subflow mounted AS a decider branch keeps its internals", () => {
    const { live, posthoc } = bothGraphs((recorder) => {
      const inner = flowChart("Escalate", noop, "escalate")
        .addFunction("Notify", noop, "notify")
        .build();
      return flowChart("Intake", noop, "intake", { structureRecorders: [recorder as never] })
        .addDeciderFunction(
          "Triage",
          (scope) => decide(scope, [{ when: () => true, then: "auto" }], "human"),
          "triage",
        )
        .addFunctionBranch("auto", "AutoResolve", noop)
        .addSubFlowChartBranch("human", inner, "HumanReview")
        .end()
        .build();
    });

    const mount = posthoc.nodes.find((n) => n.id === "human")!;
    expect(mount.data.isSubflow).toBe(true);
    expect(posthoc.nodes.map((n) => n.id)).toContain("human/escalate");
    expect(withoutDefaultBranch(posthoc)).toEqual(withoutDefaultBranch(live));
  });

  it("a loopTo back-edge becomes a loop edge, not a duplicate node", () => {
    const { live, posthoc } = bothGraphs((recorder) =>
      flowChart("Seed", noop, "seed", { structureRecorders: [recorder as never] })
        .addFunction("Refine", noop, "refine")
        .addFunction("Evaluate", noop, "evaluate")
        .loopTo("refine")
        .build(),
    );

    expect(posthoc.nodes.map((n) => n.id)).toEqual(["seed", "refine", "evaluate"]);
    const loop = posthoc.edges.find((e) => e.data?.kind === "loop")!;
    expect([loop.source, loop.target]).toEqual(["evaluate", "refine"]);
    // Loop back-edges are visual only — they never feed prev/next.
    expect(posthoc.nodes.find((n) => n.id === "refine")!.data.prevIds).toEqual(["seed"]);
    expect(posthoc).toEqual(live);
  });
});

// ── Boundary ────────────────────────────────────────────────────────────

describe("graphFromStructure — boundary", () => {
  it("a missing structure draws no chart instead of throwing", () => {
    for (const input of [undefined, null, "", 42, {}, { id: "x" }, []]) {
      const graph = graphFromStructure(input);
      expect(graph).toEqual({ nodes: [], edges: [] });
    }
  });

  it("a single-stage chart is a one-node graph", () => {
    const { posthoc } = bothGraphs((recorder) =>
      flowChart("Only", noop, "only", { structureRecorders: [recorder as never] }).build(),
    );
    expect(posthoc.nodes).toHaveLength(1);
    expect(posthoc.edges).toHaveLength(0);
  });

  it("is pure — two calls on the same structure give equal, non-shared graphs", () => {
    const chart = flowChart("A", noop, "a").addFunction("B", noop, "b").build();
    const first = graphFromStructure(chart.buildTimeStructure);
    const second = graphFromStructure(chart.buildTimeStructure);
    expect(first).toEqual(second);
    first.nodes[0]!.data.label = "mutated";
    expect(second.nodes[0]!.data.label).toBe("A");
  });
});

// ── Scenario (the canonical replay path) ────────────────────────────────

describe("graphFromStructure — scenario", () => {
  it("survives the JSON round-trip a saved recording makes", async () => {
    const chart = flowChart("Intake", noop, "intake")
      .addDeciderFunction(
        "ClassifyRisk",
        (scope) => decide(scope, [{ when: () => true, then: "approve" }], "reject"),
        "classify-risk",
      )
      .addFunctionBranch("approve", "Approve", noop)
      .addFunctionBranch("reject", "Reject", noop)
      .end()
      .build();

    const direct = graphFromStructure(chart.buildTimeStructure);
    const roundTripped = graphFromStructure(
      JSON.parse(JSON.stringify(chart.buildTimeStructure)) as unknown,
    );
    expect(roundTripped).toEqual(direct);
    expect(roundTripped.nodes.length).toBeGreaterThan(0);
  });
});
