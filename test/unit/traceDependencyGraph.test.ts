import { describe, expect, it } from "vitest";
import { buildTraceDependencyGraph } from "../../src/trace/traceDependencyGraph";
import { buildTraceWalk, type TraceIngredient, type TraceStop, type TraceWalk } from "../../src/trace/traceWalk";

function recorded(stages: Array<{ id: string; writes: string[]; reads?: string[] }>, key = "total") {
  const log = stages.map(({ id, writes }) => ({
    stage: id, stageId: id.split("#")[0], runtimeStageId: id,
    trace: writes.map(path => ({ path })),
  }));
  let executionTree: Record<string, unknown> | undefined;
  for (let i = stages.length - 1; i >= 0; i--) {
    const stage = stages[i];
    executionTree = {
      runtimeStageId: stage.id,
      ...(stage.reads && { stageReads: Object.fromEntries(stage.reads.map(name => [name, true])) }),
      ...(executionTree && { next: executionTree }),
    };
  }
  return buildTraceWalk(log, executionTree, key);
}

const diamond = () => recorded([
  { id: "seed#0", writes: ["leftInput", "rightInput"] },
  { id: "left#1", reads: ["leftInput"], writes: ["left"] },
  { id: "right#2", reads: ["rightInput"], writes: ["right"] },
  { id: "join#3", reads: ["left", "right"], writes: ["total"] },
]);

function links(graph: ReturnType<typeof buildTraceDependencyGraph>) {
  const nodes = new Map(graph.nodes.map(node => [node.id, node]));
  return graph.edges.map(edge => {
    const source = nodes.get(edge.source)!;
    const target = nodes.get(edge.target)!;
    return `${source.key}@${source.commitIdx} -> ${target.key}@${target.commitIdx}`;
  });
}

function emptyWalk(key = "total"): TraceWalk {
  return { key, stops: [], missing: null, inputTermini: [], readsAvailable: true, truncated: false };
}

function stop(runtimeStageId: string, commitIdx: number, key: string, ingredients: TraceIngredient[] = []): TraceStop {
  return {
    runtimeStageId, commitIdx, stageName: runtimeStageId, stageId: runtimeStageId,
    contributedKeys: [key], keysWritten: [key], ingredients, depth: 0, loopPass: 0,
  };
}

const unknown = (key: string): TraceIngredient => ({
  key, writerRuntimeStageId: null, writerStageName: null, writerCommitIdx: null,
});

describe("buildTraceDependencyGraph", () => {
  it("keeps a diamond's sibling inputs on their recorded branches", () => {
    const graph = buildTraceDependencyGraph(diamond());
    expect(links(graph).sort()).toEqual([
      "left@1 -> total@3", "leftInput@0 -> left@1",
      "right@2 -> total@3", "rightInput@0 -> right@2",
    ]);
    expect(graph.nodes).toHaveLength(5);
    expect(graph.nodes[0]).toMatchObject({ key: "total", kind: "recorded", isAnchor: true });
    expect(graph.nodes.filter(node => node.isAnchor)).toHaveLength(1);
    expect(graph.truncated).toBe(false);
  });

  it("deduplicates one shared written key while retaining both recorded read edges", () => {
    const graph = buildTraceDependencyGraph(recorded([
      { id: "seed#0", writes: ["base"] },
      { id: "left#1", reads: ["base"], writes: ["left"] },
      { id: "right#2", reads: ["base"], writes: ["right"] },
      { id: "join#3", reads: ["left", "right"], writes: ["total"] },
    ]));
    const source = graph.nodes.filter(node => node.key === "base");
    expect(source).toHaveLength(1);
    expect(graph.edges.filter(edge => edge.source === source[0].id)).toHaveLength(2);
    expect(graph.nodes).toHaveLength(4);
    expect(graph.truncated).toBe(false);
  });

  it("keeps overwritten loop values as separate writer visits", () => {
    const graph = buildTraceDependencyGraph(recorded([
      { id: "seed#0", writes: ["score"] },
      { id: "refine#1", reads: ["score"], writes: ["score"] },
      { id: "refine#2", reads: ["score"], writes: ["score"] },
      { id: "report#3", reads: ["score"], writes: ["total"] },
    ]));
    expect(links(graph)).toEqual([
      "score@2 -> total@3", "score@1 -> score@2", "score@0 -> score@1",
    ]);
    expect(graph.nodes.filter(node => node.key === "score").map(node => node.runtimeStageId))
      .toEqual(["refine#2", "refine#1", "seed#0"]);
    expect(new Set(graph.nodes.map(node => node.id)).size).toBe(4);
  });

  it("includes the commit position in identity even when runtime stamps repeat", () => {
    const walk = emptyWalk();
    walk.stops = [
      stop("join#2", 2, "total", [
        { key: "earlier", writerRuntimeStageId: "same#0", writerStageName: "Same", writerCommitIdx: 0 },
        { key: "later", writerRuntimeStageId: "same#0", writerStageName: "Same", writerCommitIdx: 1 },
      ]),
      stop("same#0", 1, "later"),
      stop("same#0", 0, "earlier"),
    ];
    const graph = buildTraceDependencyGraph(walk);
    expect(graph.nodes.filter(node => node.runtimeStageId === "same#0").map(node => node.commitIdx)).toEqual([0, 1]);
    expect(new Set(graph.nodes.map(node => node.id)).size).toBe(3);
    expect(graph.nodes.every(node => node.kind === "recorded")).toBe(true);
  });

  it("keeps an unresolved read separate for each reader rather than inventing a shared origin", () => {
    const graph = buildTraceDependencyGraph(recorded([
      { id: "left#0", reads: ["external"], writes: ["left"] },
      { id: "right#1", reads: ["external"], writes: ["right"] },
      { id: "join#2", reads: ["left", "right"], writes: ["total"] },
    ]));
    const unresolved = graph.nodes.filter(node => node.kind === "unresolved");
    expect(unresolved).toHaveLength(2);
    expect(new Set(unresolved.map(node => node.id)).size).toBe(2);
    for (const node of unresolved) {
      expect(node).toMatchObject({ key: "external", runtimeStageId: null, stageName: null, commitIdx: null, isAnchor: false });
      expect(graph.edges.filter(edge => edge.source === node.id)).toHaveLength(1);
    }
    expect(graph.nodes.every(node => !node.id.includes("origin"))).toBe(true);
  });

  it("keeps a known excluded writer as outside-view rather than an unresolved input", () => {
    const walk = diamond();
    walk.stops = walk.stops.slice(0, 1);
    walk.truncated = true;
    const graph = buildTraceDependencyGraph(walk);
    expect(graph.nodes.filter(node => node.kind === "outside-view").map(node => [node.key, node.runtimeStageId, node.commitIdx]))
      .toEqual([["left", "left#1", 1], ["right", "right#2", 2]]);
    expect(graph.nodes.some(node => node.kind === "unresolved")).toBe(false);
    expect(graph.truncated).toBe(true);
  });

  it.each(["never-written", "not-yet-written", "evidence-unavailable"] as const)(
    "does not invent a writer for a missing question (%s)", reason => {
      const walk = emptyWalk();
      walk.missing = { reason, firstWriteCommitIdx: 9, firstWriterRuntimeStageId: "future#9" };
      const graph = buildTraceDependencyGraph(walk);
      expect(graph.nodes).toHaveLength(1);
      expect(graph.nodes[0]).toMatchObject({ key: "total", kind: "unresolved", isAnchor: true, runtimeStageId: null, commitIdx: null });
      expect(graph.edges).toEqual([]);
    },
  );

  it("does not synthesize dependencies when reads were not recorded", () => {
    const walk = emptyWalk();
    walk.readsAvailable = false;
    walk.stops = [stop("answer#0", 0, "total")];
    const graph = buildTraceDependencyGraph(walk);
    expect(graph.nodes).toHaveLength(1);
    expect(graph.edges).toEqual([]);
    expect(graph.truncated).toBe(false); // Unknown read coverage is not a drawing-size omission.
  });

  it("prioritizes the anchor and caps a broad graph at 60 nodes", () => {
    const walk = emptyWalk();
    walk.stops = [stop("answer#1", 1, "total", Array.from({ length: 100 }, (_, at) => unknown(`input${at}`)))];
    const graph = buildTraceDependencyGraph(walk);
    expect(graph.nodes).toHaveLength(60);
    expect(graph.nodes[0]).toMatchObject({ key: "total", isAnchor: true });
    expect(graph.edges).toHaveLength(59);
    expect(graph.truncated).toBe(true);
  });

  it("caps dense stage-read expansion at 120 edges without dangling endpoints", () => {
    const inputs = Array.from({ length: 20 }, (_, at) => `input${at}`);
    const outputs = Array.from({ length: 20 }, (_, at) => `output${at}`);
    const graph = buildTraceDependencyGraph(recorded([
      { id: "seed#0", writes: inputs },
      { id: "compute#1", reads: inputs, writes: outputs },
      { id: "join#2", reads: outputs, writes: ["total"] },
    ]));
    expect(graph.nodes.length).toBeLessThanOrEqual(60);
    expect(graph.edges).toHaveLength(120);
    const ids = new Set(graph.nodes.map(node => node.id));
    expect(graph.edges.every(edge => ids.has(edge.source) && ids.has(edge.target))).toBe(true);
    expect(new Set(graph.edges.map(edge => edge.id)).size).toBe(120);
    expect(graph.truncated).toBe(true);
  });

  it("bounds inspection even when a huge ingredient list only repeats one edge", () => {
    let inspected = 0;
    const ingredients = new Proxy([] as TraceIngredient[], {
      get(target, property, receiver) {
        if (property === "length") return 1_000_000;
        if (typeof property === "string" && /^\d+$/.test(property)) {
          inspected++;
          return unknown("external");
        }
        return Reflect.get(target, property, receiver);
      },
    });
    const walk = emptyWalk();
    walk.stops = [stop("answer#1", 1, "total", ingredients)];
    const graph = buildTraceDependencyGraph(walk);
    expect(inspected).toBeLessThanOrEqual(8_192);
    expect(graph.nodes).toHaveLength(2);
    expect(graph.edges).toHaveLength(1);
    expect(graph.truncated).toBe(true);
  });

  it("bounds the stop index before traversing a very large supplied walk", () => {
    let inspected = 0;
    const anchor = stop("answer#1", 1, "total");
    const walk = emptyWalk();
    walk.stops = new Proxy([] as TraceStop[], {
      get(target, property, receiver) {
        if (property === "length") return 1_000_000;
        if (typeof property === "string" && /^\d+$/.test(property)) {
          inspected++;
          return anchor;
        }
        return Reflect.get(target, property, receiver);
      },
    });
    const graph = buildTraceDependencyGraph(walk);
    expect(inspected).toBeLessThanOrEqual(513);
    expect(graph.nodes[0]).toMatchObject({ key: "total", isAnchor: true });
    expect(graph.truncated).toBe(true);
  });

  it("is deterministic and leaves its frozen input unchanged", () => {
    const walk = diamond();
    const freeze = (value: unknown): void => {
      if (value && typeof value === "object") {
        Object.values(value).forEach(freeze);
        Object.freeze(value);
      }
    };
    freeze(walk);
    const before = JSON.stringify(walk);
    const graph = buildTraceDependencyGraph(walk);
    expect(buildTraceDependencyGraph(walk)).toEqual(graph);
    expect(JSON.stringify(walk)).toBe(before);
  });
});
