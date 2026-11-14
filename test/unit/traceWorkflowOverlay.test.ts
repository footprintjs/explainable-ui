import { describe, expect, it, vi } from "vitest";
import type { StageSnapshot } from "../../src/types";
import { theme } from "../../src/theme";
import { buildTraceDependencyGraph } from "../../src/trace/traceDependencyGraph";
import { buildTraceWalk, type TraceIngredient, type TraceStop, type TraceWalk } from "../../src/trace/traceWalk";
import { buildTraceWorkflowOverlay, traceIngredientColor, traceNodeColors } from "../../src/trace/traceWorkflowOverlay";

function recording(steps: { id: string; writes: string[]; reads?: string[] }[], key = "total") {
  const log = steps.map(step => ({ stage: step.id, stageId: step.id.split("#")[0],
    runtimeStageId: step.id, trace: step.writes.map(path => ({ path })) }));
  let tree: Record<string, unknown> | undefined;
  for (const step of [...steps].reverse()) tree = {
    runtimeStageId: step.id, stageReads: Object.fromEntries((step.reads ?? []).map(key => [key, true])),
    ...(tree && { next: tree }),
  };
  return buildTraceWalk(log, tree, key);
}
const snapshot = (id: string, memory: Record<string, unknown>): StageSnapshot => ({
  stageName: id.split("#")[0], stageLabel: id, runtimeStageId: id, memory,
  narrative: "", startMs: 0, durationMs: 1,
});
const diamond = () => recording([
  { id: "seed#0", writes: ["leftInput", "rightInput"] },
  { id: "left#1", reads: ["leftInput"], writes: ["left"] },
  { id: "right#2", reads: ["rightInput"], writes: ["right"] },
  { id: "join#3", reads: ["left", "right"], writes: ["total"] },
]);
const ingredient = (key: string, id: string | null, idx: number | null): TraceIngredient => ({
  key, writerRuntimeStageId: id, writerCommitIdx: idx, writerStageName: id,
});
const stop = (id: string, idx: number, key: string, reads: TraceIngredient[] = []): TraceStop => ({
  runtimeStageId: id, stageId: "deliberately-not-a-runtime-address", stageName: id, commitIdx: idx,
  contributedKeys: [key], keysWritten: [key], ingredients: reads, depth: 0, loopPass: 0,
});
const walkWith = (...stops: TraceStop[]): TraceWalk => ({
  key: "total", stops, missing: null, inputTermini: [], readsAvailable: true, truncated: false,
});

describe("shared trace colors", () => {
  it("keeps the anchor purple, uses four source hues then neutral, and never colors unknown inputs as known", () => {
    const walk = walkWith(stop("join#8", 8, "total", [
      ingredient("unknown", null, null),
      ...Array.from({ length: 6 }, (_, index) => ingredient(`source${index}`, `source#${index}`, index)),
    ]));
    const graph = buildTraceDependencyGraph(walk), colors = traceNodeColors(graph);
    expect(colors.get(graph.nodes[0].id)).toBe("var(--fp-accent, #6366f1)");
    expect(colors.get(graph.nodes.find(node => node.key === "unknown")!.id)).toBe(theme.textMuted);
    const known = graph.nodes.filter(node => node.key.startsWith("source"));
    expect(known.map(node => colors.get(node.id))).toEqual([
      "var(--fp-chip-1, #0d9488)", "var(--fp-chip-2, #d97706)",
      "var(--fp-chip-3, #7c3aed)", "var(--fp-chip-4, #e11d48)", theme.textMuted, theme.textMuted,
    ]);
  });

  it("matches key, runtime visit and commit together instead of borrowing a color by name", () => {
    const walk = recording([
      { id: "seed#0", writes: ["score"] },
      { id: "refine#1", reads: ["score"], writes: ["score"] },
      { id: "report#2", reads: ["score"], writes: ["total"] },
    ]);
    const graph = buildTraceDependencyGraph(walk), colors = traceNodeColors(graph);
    const first = traceIngredientColor(graph, colors, ingredient("score", "refine#1", 1));
    const earlier = traceIngredientColor(graph, colors, ingredient("score", "seed#0", 0));
    expect(first).not.toBe(earlier);
    expect(first).not.toBe(theme.textMuted);
    for (const wrong of [ingredient("other", "refine#1", 1), ingredient("score", "refine#1", 0), ingredient("score", null, null)]) {
      expect(traceIngredientColor(graph, colors, wrong)).toBe(theme.textMuted);
    }
  });
});

describe("buildTraceWorkflowOverlay", () => {
  it("returns no overlay for no question or honest missing evidence", () => {
    expect(buildTraceWorkflowOverlay(null, [], null)).toBeNull();
    const walk = diamond(); walk.missing = { reason: "evidence-unavailable" };
    expect(buildTraceWorkflowOverlay(walk, [], null)).toBeNull();
  });

  it("groups multiple source values by writer while preserving a diamond's actual read directions", () => {
    const overlay = buildTraceWorkflowOverlay(diamond(), [
      snapshot("seed#0", { leftInput: 2, rightInput: 3 }),
      snapshot("left#1", { left: 4 }), snapshot("right#2", { right: 6 }), snapshot("join#3", { total: 10 }),
    ], "left#1")!;
    expect(overlay).toMatchObject({ questionKey: "total", scopeKey: "[]", focusRuntimeStageId: "left#1" });
    expect(overlay.stages.map(stage => [stage.runtimeStageId, stage.stageId, stage.role])).toEqual([
      ["join#3", "join", "question"], ["left#1", "left", "input"], ["right#2", "right", "input"], ["seed#0", "seed", "upstream"],
    ]);
    expect(overlay.stages.find(stage => stage.runtimeStageId === "seed#0")!.values).toEqual([
      { key: "leftInput", preview: "2", color: "var(--fp-chip-3, #7c3aed)" },
      { key: "rightInput", preview: "3", color: "var(--fp-chip-4, #e11d48)" },
    ]);
    expect(overlay.reads.map(read => [read.key, read.sourceRuntimeStageId, read.targetRuntimeStageId])).toEqual([
      ["left", "left#1", "join#3"], ["right", "right#2", "join#3"],
      ["leftInput", "seed#0", "left#1"], ["rightInput", "seed#0", "right#2"],
    ]);
    const left = overlay.stages.find(stage => stage.runtimeStageId === "left#1")!;
    expect(overlay.reads[0].color).toBe(left.values[0].color);
    expect(left.color).toBe(left.values[0].color);
  });

  it("reads writer-time snapshots, including nested engine paths and literal dotted keys, without invoking stored code", () => {
    const path = "profile\u001fzip", walk = recording([
      { id: "seed#0", writes: [path, "literal.dot", "accessor", "inherited"] },
      { id: "join#1", reads: [path, "literal.dot", "accessor", "inherited"], writes: ["total"] },
    ]);
    const getter = vi.fn(() => "PRIVATE"), memory = Object.create({ inherited: "PRIVATE" });
    Object.assign(memory, { profile: { zip: 12345 }, "literal.dot": false });
    Object.defineProperty(memory, "accessor", { enumerable: true, get: getter });
    const overlay = buildTraceWorkflowOverlay(walk, [snapshot("seed#0", memory), snapshot("join#1", { total: 1, profile: { zip: 99999 } })], null)!;
    expect(overlay.stages.find(stage => stage.runtimeStageId === "seed#0")!.values.map(value => [value.key, value.preview]))
      .toEqual([[path, "12345"], ["literal.dot", "false"], ["accessor", null], ["inherited", null]]);
    expect(getter).not.toHaveBeenCalled();
    expect(overlay.focusRuntimeStageId).toBe("join#1");
  });

  it("keeps repeated visits separate and qualifies both workflow IDs and scope without suffix inference", () => {
    const local = recording([
      { id: "mount/refine#0", writes: ["score"] },
      { id: "mount/refine#1", reads: ["score"], writes: ["score"] },
      { id: "mount/report#2", reads: ["score"], writes: ["total"] },
    ]);
    const walk: TraceWalk = { ...local, scope: { invocationPath: ["mount#7"] } };
    const overlay = buildTraceWorkflowOverlay(walk, [snapshot("mount/refine#0", { score: 2 }), snapshot("mount/refine#1", { score: 4 })], "unrelated#9")!;
    expect(overlay.scopeKey).toBe('["mount#7"]');
    expect(overlay.focusRuntimeStageId).toBe("mount/report#2");
    expect(overlay.stages.map(stage => [stage.runtimeStageId, stage.stageId])).toEqual([
      ["mount/report#2", "mount/report"], ["mount/refine#1", "mount/refine"], ["mount/refine#0", "mount/refine"],
    ]);
    expect(overlay.stages.filter(stage => stage.stageId === "mount/refine").map(stage => stage.values[0].preview)).toEqual(["4", "2"]);
  });

  it("deduplicates a shared source read per reader without connecting sibling inputs", () => {
    const walk = recording([
      { id: "seed#0", writes: ["base"] },
      { id: "middle#1", reads: ["base"], writes: ["left", "right"] },
      { id: "join#2", reads: ["left", "right"], writes: ["total"] },
    ]);
    const overlay = buildTraceWorkflowOverlay(walk, [], null)!;
    expect(overlay.stages.find(stage => stage.runtimeStageId === "middle#1")!.values.map(value => value.key)).toEqual(["left", "right"]);
    expect(overlay.reads.filter(read => read.key === "base")).toEqual([
      { key: "base", sourceRuntimeStageId: "seed#0", targetRuntimeStageId: "middle#1", color: expect.any(String) },
    ]);
    expect(overlay.reads.some(read => read.sourceRuntimeStageId === "middle#1" && read.targetRuntimeStageId === "middle#1")).toBe(false);
  });

  it("removes only the final execution stamp while preserving literal hashes in exact stage IDs", () => {
    const walk = recording([
      { id: "scope#variant/source#v2#0", writes: ["amount"] },
      { id: "scope#variant/report#v3#1", reads: ["amount"], writes: ["total"] },
    ]);
    const overlay = buildTraceWorkflowOverlay(walk, [snapshot("scope#variant/source#v2#0", { amount: 7 })], null)!;
    expect(overlay.stages.map(stage => [stage.runtimeStageId, stage.stageId])).toEqual([
      ["scope#variant/report#v3#1", "scope#variant/report#v3"],
      ["scope#variant/source#v2#0", "scope#variant/source#v2"],
    ]);
    expect(overlay.reads[0]).toMatchObject({ key: "amount", sourceRuntimeStageId: "scope#variant/source#v2#0", targetRuntimeStageId: "scope#variant/report#v3#1" });
    expect(overlay.stages[1].values[0].preview).toBe("7");
  });

  it("does not invent a workflow writer for unresolved inputs", () => {
    const walk = recording([{ id: "join#0", reads: ["external"], writes: ["total"] }]);
    const overlay = buildTraceWorkflowOverlay(walk, [], null)!;
    expect(overlay.stages).toHaveLength(1);
    expect(overlay.stages[0].role).toBe("question");
    expect(overlay.reads).toEqual([]);
    expect(overlay.stages[0].values[0].preview).toBeNull();
  });

  it("withholds ambiguous same-runtime commit versions and duplicate snapshot previews", () => {
    const walk = walkWith(stop("join#2", 2, "total", [ingredient("early", "same#0", 0), ingredient("late", "same#0", 1)]),
      stop("same#0", 1, "late"), stop("same#0", 0, "early"));
    const overlay = buildTraceWorkflowOverlay(walk, [], null)!;
    expect(overlay.stages.map(stage => stage.runtimeStageId)).toEqual(["join#2"]);
    expect(overlay.reads).toEqual([]);
    const duplicate = buildTraceWorkflowOverlay(diamond(), [snapshot("left#1", { left: 4 }), snapshot("left#1", { left: 99 })], null)!;
    expect(duplicate.stages.find(stage => stage.runtimeStageId === "left#1")!.values[0].preview).toBeNull();
    expect(buildTraceWorkflowOverlay(walkWith(stop("same#0", 1, "total", [ingredient("earlier", "same#0", 0)]), stop("same#0", 0, "earlier")), [], null)).toBeNull();
  });

  it("keeps names and reads within the graph's budget and does not inspect an oversized snapshot rail", () => {
    const walk = walkWith(stop("join#1000", 1000, "total", Array.from({ length: 200 }, (_, index) => ingredient(`value${index}`, `source#${index}`, index))));
    const inspection = vi.fn();
    const snapshots = new Proxy(new Array(100_001), { get(target, key, receiver) { if (key !== "length") inspection(); return Reflect.get(target, key, receiver); } }) as StageSnapshot[];
    const overlay = buildTraceWorkflowOverlay(walk, snapshots, null)!;
    expect(overlay.stages.length).toBeLessThanOrEqual(60);
    expect(overlay.reads.length).toBeLessThanOrEqual(120);
    expect(overlay.stages.every(stage => stage.values.every(value => value.preview === null))).toBe(true);
    expect(inspection).not.toHaveBeenCalled();
  });

  it("does not mutate frozen walk or snapshot inputs", () => {
    const walk = diamond(), snapshots = [snapshot("join#3", { total: 10 })];
    const freeze = (value: any): any => { if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };
    freeze(walk); freeze(snapshots);
    const before = JSON.stringify([walk, snapshots]);
    expect(buildTraceWorkflowOverlay(walk, snapshots, null)).toEqual(buildTraceWorkflowOverlay(walk, snapshots, null));
    expect(JSON.stringify([walk, snapshots])).toBe(before);
  });
});
