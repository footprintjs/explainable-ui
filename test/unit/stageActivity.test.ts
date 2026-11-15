import { describe, expect, it, vi } from "vitest";
import type { NarrativeEntry, StageSnapshot } from "../../src/types";
import { childTraceScope, type TraceScope } from "../../src/trace/traceScope";
import { formatStageActivitySummary, projectStageActivity, type StageActivityInput } from "../../src/trace/stageActivity";

const snapshot = (id: string, memory: Record<string, unknown>): StageSnapshot => ({
  runtimeStageId: id, stageName: id.slice(0, id.lastIndexOf("#")), stageLabel: id,
  memory, narrative: "", startMs: 0, durationMs: 1,
});
type Step = { id: string; reads?: string[]; writes: string[]; memory: Record<string, unknown> };
function recording(steps: Step[], selectedIndex = steps.length - 1, invocationPath: string[] = []): StageActivityInput {
  let tree: Record<string, unknown> | undefined;
  for (const step of [...steps].reverse()) tree = {
    runtimeStageId: step.id, stageReads: Object.fromEntries((step.reads ?? []).map(key => [key, true])),
    ...(tree && { next: tree }),
  };
  const scope: TraceScope = {
    invocationPath, availability: { ok: true }, mountLabels: new Map(), readsAvailable: true,
    executionTree: tree,
    commitLog: steps.map(step => ({ stage: step.id.split("#")[0], stageId: step.id.split("#")[0], runtimeStageId: step.id,
      trace: step.writes.map(path => ({ path })) })),
  };
  return { scope, snapshots: steps.map(step => snapshot(step.id, step.memory)), selectedIndex };
}
const increment = () => recording([
  { id: "seed#0", writes: ["count"], memory: { count: 2 } },
  { id: "increment#1", reads: ["count"], writes: ["count"], memory: { count: 3 } },
  { id: "later#2", writes: ["count"], memory: { count: 999 } },
], 1);
const narrative = (id: string, text: string, key = "count", stepNumber = 1, type = "step"): NarrativeEntry => ({
  runtimeStageId: id, text, key, stepNumber, type, depth: 0,
});

describe("projectStageActivity", () => {
  it("separates a read's previous writer from the same visit's committed write and future changes", () => {
    const input = increment();
    const view = projectStageActivity({ ...input, narrativeEntries: [
      narrative("increment#1", "Step 4: Read count = 2", "count", 4),
      narrative("increment#1", "Step 5: Write count = 3", "count", 5),
    ] });
    expect(view.availability).toEqual({ ok: true });
    expect(view.identity).toMatchObject({ runtimeStageId: "increment#1", commitIdx: 1, invocationPath: [] });
    expect(view.reads[0]).toMatchObject({ id: "read:count", value: { state: "recorded", preview: "2" },
      writer: { runtimeStageId: "seed#0", commitIdx: 0 }, traceTarget: { kind: "read", runtimeStageId: "increment#1", beforeCommitIdx: 1 } });
    expect(view.reads[0].valueLabel).toContain("read-call value not established here");
    expect(view.writes[0]).toMatchObject({ id: "write:count", before: { state: "recorded", preview: "2" },
      after: { state: "recorded", preview: "3" }, change: "updated", traceTarget: { kind: "write", beforeCommitIdx: 2 } });
    expect(view.events.map(event => [event.variableId, event.reportedOperation])).toEqual([["read:count", "read"], ["write:count", "write"]]);
    expect(formatStageActivitySummary(view)).not.toContain("999");
  });

  it("preserves repeated narrative reads and their recorded order without turning the read set into call order", () => {
    const input = increment();
    const first = narrative("increment#1", "Step 8: Read count = 2", "count", 8);
    const view = projectStageActivity({ ...input, narrativeEntries: [first,
      narrative("increment#1", "Step 9: Read count = 2", "count", 9),
      narrative("increment#1", "Step 10: Write count = 3", "count", 10),
    ] });
    expect(view.events.map(event => event.text)).toEqual([first.text, "Step 9: Read count = 2", "Step 10: Write count = 3"]);
    expect(view.reads).toHaveLength(1);
    expect(view.notes.join(" ")).toContain("not a global ordering across parallel stages");
    expect(view.notes.join(" ")).toContain("narrative's wording");
    expect(view.notes.join(" ")).toContain("not record every intermediate assignment");
  });

  it("requires an exact visit for narrative and never joins by a repeated leaf name", () => {
    const input = recording([
      { id: "first/seed#0", writes: ["count"], memory: { count: 2 } },
      { id: "first/refine#1", reads: ["count"], writes: ["count"], memory: { count: 3 } },
      { id: "first/refine#2", reads: ["count"], writes: ["count"], memory: { count: 4 } },
    ], 1, ["first#7"]);
    const view = projectStageActivity({ ...input, narrativeEntries: [
      narrative("first/refine#1", "selected visit", "count"),
      narrative("first/refine#2", "later visit", "count"),
      narrative("second/refine#1", "other invocation", "count"),
      { ...narrative("", "missing identity"), runtimeStageId: undefined, stageName: "first/refine" },
    ] });
    expect(view.events.map(event => event.text)).toEqual(["selected visit"]);
    expect(view.reads[0].traceTarget?.invocationPath).toEqual(["first#7"]);
    expect(view.writes[0].after?.preview).toBe("3");
    expect(view.writes[0].traceTarget?.beforeCommitIdx).toBe(2);
  });

  it("only lists committed paths, preserves nested paths and literal dots, and distinguishes absence from undefined", () => {
    const nested = "profile\u001fzip";
    const view = projectStageActivity(recording([
      { id: "seed#0", writes: [nested, "literal.dot", "removed", "undefinedValue"], memory: { profile: { zip: 1 }, "literal.dot": 7, removed: 9, undefinedValue: undefined } },
      { id: "update#1", writes: [nested, "literal.dot", "removed", "undefinedValue"], memory: { profile: { zip: 2 }, "literal.dot": 8, undefinedValue: undefined, unrelated: "not a write" } },
    ]));
    expect(view.writes.map(write => write.label)).toEqual(["profile › zip", "literal.dot", "removed", "undefinedValue"]);
    expect(view.writes[0]).toMatchObject({ before: { preview: "1" }, after: { preview: "2" }, change: "updated" });
    expect(view.writes[1]).toMatchObject({ before: { preview: "7" }, after: { preview: "8" } });
    expect(view.writes[2]).toMatchObject({ before: { state: "recorded" }, after: { state: "absent" }, change: "removed" });
    expect(view.writes[3]).toMatchObject({ before: { state: "recorded", preview: "undefined" }, after: { state: "recorded", preview: "undefined" }, change: "unchanged" });
    expect(formatStageActivitySummary(view)).not.toContain("unrelated");
  });

  it("does not treat the first available state as an empty before-state", () => {
    const view = projectStageActivity(recording([{ id: "only#0", writes: ["result"], memory: { result: 8 } }]));
    expect(view.writes[0]).toMatchObject({ before: { state: "unavailable" }, after: { preview: "8" }, change: "unknown" });
    expect(formatStageActivitySummary(view)).toContain("unavailable → 8");
    expect(formatStageActivitySummary(view)).not.toContain("not present → 8");
  });

  it("uses the immediately preceding commit's snapshot rather than a nearby unrelated rail item", () => {
    const input = increment();
    const view = projectStageActivity({ ...input, snapshots: [input.snapshots[2], input.snapshots[1], input.snapshots[0]] });
    expect(view.writes[0].before?.preview).toBe("2");
    expect(view.writes[0].after?.preview).toBe("3");
  });

  it("uses the correct latest direct writer when another direct parent also wrote the same key", () => {
    const view = projectStageActivity(recording([
      { id: "first#0", writes: ["a", "b"], memory: { a: 1, b: 2 } },
      { id: "second#1", writes: ["b"], memory: { a: 1, b: 3 } },
      { id: "join#2", reads: ["a", "b"], writes: ["total"], memory: { a: 10, b: 30, total: 4 } },
    ]));
    expect(view.reads.map(read => [read.key, read.value.preview, read.writer?.runtimeStageId])).toEqual([["a", "1", "first#0"], ["b", "3", "second#1"]]);
  });

  it("keeps unavailable read-call values distinct from later memory and ignores mutable rawValue companions", () => {
    const input = increment();
    const getter = vi.fn(() => "PRIVATE");
    const entry = narrative("increment#1", "Step 1: Read input = value omitted", "input", 1);
    Object.defineProperty(entry, "rawValue", { get: getter });
    const view = projectStageActivity({ ...input, narrativeEntries: [entry] });
    const read = view.reads.find(value => value.key === "input")!;
    expect(read).toMatchObject({ source: "narrative", value: { state: "unavailable" }, writer: null });
    expect(read.traceTarget?.beforeCommitIdx).toBe(1);
    expect(view.events[0].text).toContain("value omitted");
    expect(getter).not.toHaveBeenCalled();
    expect(JSON.stringify(view)).not.toContain("PRIVATE");
  });

  it("does not silently interpret custom narrative wording or mismatched text keys as typed operations", () => {
    const input = increment();
    const view = projectStageActivity({ ...input, narrativeEntries: [
      narrative("increment#1", "Incremented count using application logic"),
      narrative("increment#1", "Step 1: Read differentKey = 4", "count", 1),
      narrative("increment#1", "Step 99: Write count = 3", "count", 2),
    ] });
    expect(view.events.every(event => event.kind === "step" && event.reportedOperation === undefined && event.variableId === undefined)).toBe(true);
    expect(view.reads.map(read => read.key)).toEqual(["count"]); // independent recorded tree evidence
    expect(view.reads[0].source).toBe("stage-read");
  });

  it("does not manufacture a sequence when only a stage read set and commits exist", () => {
    const view = projectStageActivity(increment());
    expect(view.events).toEqual([]);
    expect(view.coverage.narrative).toBe("unavailable");
    expect(view.reads[0].key).toBe("count");
    expect(view.writes[0].key).toBe("count");
  });

  it("records a saved branch without fabricating predicate source or narrative ordering", () => {
    const input = recording([{ id: "choose#0", writes: [], memory: {} }]);
    (input.scope.executionTree as Record<string, unknown>).flowMessages = [
      { type: "branch", targetStage: "QueueManualReview", rationale: "returned branchId: manual", predicate: "FAKE SOURCE" },
    ];
    const view = projectStageActivity(input);
    expect(view.events).toEqual([]);
    expect(view.decisions).toEqual([{ id: "tree-decision:0", kind: "decision", source: "execution-tree", text: "Recorded branch: QueueManualReview. returned branchId: manual" }]);
    expect(formatStageActivitySummary(view)).toContain("Separate recorded branch messages");
    expect(formatStageActivitySummary(view)).not.toContain("FAKE SOURCE");
  });

  it("keeps stage-scoped errors, decisions and emitted events while excluding another visit's logs", () => {
    const input = increment();
    const view = projectStageActivity({ ...input, narrativeEntries: [
      narrative("increment#1", "recorded condition outcome", "", 1, "condition"),
      narrative("increment#1", "stage failed", "", 2, "error"),
      narrative("increment#1", "published event", "", 3, "emit"),
      narrative("later#2", "OTHER VISIT LOG", "", 4, "log"),
    ], logs: ["RUN-LEVEL SECRET"] } as StageActivityInput);
    expect(view.events.map(event => event.kind)).toEqual(["decision", "error", "event"]);
    expect(view.decisions.map(event => event.text)).toEqual(["recorded condition outcome"]);
    expect(view.logs).toEqual([]);
    expect(view.coverage.logs).toBe("unavailable");
    expect(view.notes.join(" ")).toContain("run-level logs are not attributed");
    expect(JSON.stringify(view)).not.toContain("SECRET");
    expect(JSON.stringify(view)).not.toContain("OTHER VISIT");
  });

  it("only labels logs stage-scoped when a log record has the selected runtime address", () => {
    const view = projectStageActivity({ ...increment(), narrativeEntries: [narrative("increment#1", "selected log", "", 1, "log")] });
    expect(view.coverage.logs).toBe("stage-scoped");
    expect(view.logs.map(event => event.text)).toEqual(["selected log"]);
  });

  it("rejects ambiguous commits, selected snapshots and execution-tree addresses", () => {
    const input = increment();
    expect(projectStageActivity({ ...input, scope: { ...input.scope, commitLog: [...input.scope.commitLog, input.scope.commitLog[1]] } }).availability.ok).toBe(false);
    expect(projectStageActivity({ ...input, snapshots: [...input.snapshots, input.snapshots[1]] }).availability.ok).toBe(false);
    expect(projectStageActivity({ ...input, scope: { ...input.scope, executionTree: { runtimeStageId: "increment#1", children: [{ runtimeStageId: "increment#1" }] } } }).availability.ok).toBe(false);
  });

  it("admits explicit value-free exit/repeat bookends and preserves raw commit cutoffs", () => {
    for (const phase of ["exit", "repeat"]) {
      const input = recording([
        { id: "seed#0", writes: ["input"], memory: { input: 2 } },
        { id: "mount#1", reads: ["input"], writes: ["childValue"], memory: { input: 2, childValue: 3 } },
        { id: "report#2", reads: ["childValue"], writes: ["total"], memory: { input: 2, childValue: 3, total: 6 } },
      ]);
      input.scope.commitLog.splice(2, 0, { stage: "mount", stageId: "mount", runtimeStageId: "mount#1", trace: [], phase, overwrite: {}, updates: {}, redactedPaths: [] });
      const view = projectStageActivity(input);
      expect(view.availability.ok).toBe(true);
      expect(view.identity.commitIdx).toBe(3);
      expect(view.reads[0]).toMatchObject({ value: { preview: "3" }, writer: { runtimeStageId: "mount#1", commitIdx: 1 }, traceTarget: { beforeCommitIdx: 3 } });
      expect(view.writes[0].traceTarget?.beforeCommitIdx).toBe(4);
      const mount = projectStageActivity({ ...input, selectedIndex: 1 });
      expect(mount.availability.ok).toBe(true);
      expect(mount.reads[0]).toMatchObject({ value: { preview: "2" }, traceTarget: { beforeCommitIdx: 1 } });
      expect(mount.writes[0].traceTarget?.beforeCommitIdx).toBe(2);
    }
  });

  it("does not accept a phase marker as proof of an empty row when data or redactions exist", () => {
    const input = increment();
    for (const payload of [{ overwrite: { hidden: "PRIVATE" } }, { updates: { hidden: "PRIVATE" } }, { redactedPaths: ["hidden"] }, { phase: "unrecognized" }]) {
      const bookend = { ...(input.scope.commitLog[1] as Record<string, unknown>), trace: [], phase: "exit", overwrite: {}, updates: {}, redactedPaths: [], ...payload };
      const view = projectStageActivity({ ...input, scope: { ...input.scope, commitLog: [...input.scope.commitLog.slice(0, 2), bookend, input.scope.commitLog[2]] } });
      expect(view.availability.ok).toBe(false);
      expect(JSON.stringify(view)).not.toContain("PRIVATE");
    }
  });

  it("retains safe empty child phases without retaining their state payloads", () => {
    const mount = { stage: "Prepare", stageId: "outer/prepare", runtimeStageId: "outer/prepare#1", trace: [{ path: "value" }], overwrite: { value: 3 }, updates: {} };
    const summarize = { stage: "Summarize", stageId: "outer/summarize", runtimeStageId: "outer/summarize#5", trace: [{ path: "total" }], overwrite: { total: 6 }, updates: {} };
    const phase = { ...mount, phase: "exit", trace: [], overwrite: {}, updates: {}, redactedPaths: [] };
    const result = { treeContext: {
      history: [{ runtimeStageId: "outer#0", overwrite: { seed: 2 }, trace: [] }, mount, phase, summarize],
      stageContexts: { runtimeStageId: mount.runtimeStageId, stageReads: {}, next: { runtimeStageId: summarize.runtimeStageId, stageReads: { value: true } } },
    } };
    const scope = childTraceScope(result, ["outer#0"], true);
    expect(scope.availability.ok).toBe(true);
    expect(scope.commitLog[1]).toMatchObject({ phase: "exit", trace: [] });
    expect(scope.commitLog[1]).not.toHaveProperty("overwrite");
    expect(scope.commitLog[1]).not.toHaveProperty("updates");
    const view = projectStageActivity({ scope, snapshots: [snapshot(mount.runtimeStageId, { value: 3 }), snapshot(summarize.runtimeStageId, { value: 3, total: 6 })], selectedIndex: 1 });
    expect(view.availability.ok).toBe(true);
    expect(view.identity.stageLabel).toBe(summarize.runtimeStageId); // custom snapshot labels stay custom
    expect(view.reads[0]).toMatchObject({ value: { preview: "3" }, traceTarget: { beforeCommitIdx: 2, invocationPath: ["outer#0"] } });
    expect(view.writes[0].traceTarget?.beforeCommitIdx).toBe(3);
    const humanLabel = projectStageActivity({ scope, snapshots: [snapshot(mount.runtimeStageId, { value: 3 }), { ...snapshot(summarize.runtimeStageId, { value: 3, total: 6 }), stageLabel: "outer/summarize" }], selectedIndex: 1 });
    expect(humanLabel.identity.stageLabel).toBe("Summarize");
  });

  it("does not preserve a child phase when its payload is nonempty or inaccessible", () => {
    const getter = vi.fn(() => ({ PRIVATE: true }));
    const primary = { stage: "Prepare", stageId: "outer/prepare", runtimeStageId: "outer/prepare#1", trace: [{ path: "value" }] };
    for (const hidden of [false, true]) {
      const phase = { ...primary, phase: "exit", trace: [], overwrite: { PRIVATE: true }, updates: {} };
      if (hidden) Object.defineProperty(phase, "overwrite", { get: getter });
      const scope = childTraceScope({ treeContext: { history: [primary, phase], stageContexts: { runtimeStageId: primary.runtimeStageId } } }, ["outer#0"], true);
      expect(scope.availability.ok).toBe(true);
      expect(scope.commitLog[1]).not.toHaveProperty("phase");
      expect(JSON.stringify(scope.commitLog)).not.toContain("PRIVATE");
      expect(projectStageActivity({ scope, snapshots: [snapshot(primary.runtimeStageId, { value: 3 })], selectedIndex: 0 }).availability.ok).toBe(false);
    }
    expect(getter).not.toHaveBeenCalled();
  });

  it("does not send a read after an in-stage write to the prior stage's different value", () => {
    const view = projectStageActivity({ ...increment(), narrativeEntries: [
      narrative("increment#1", "Step 1: Write count = 3", "count", 1),
      narrative("increment#1", "Step 2: Read count = 3", "count", 2),
    ] });
    expect(view.reads[0]).toMatchObject({ value: { state: "unavailable" }, writer: null, traceTarget: null });
    expect(view.reads[0].valueLabel).toContain("Read after in-stage write");
    expect(view.events[1].text).toBe("Step 2: Read count = 3");
    expect(view.events[1].variableId).toBeUndefined();
    expect(view.writes[0].traceTarget?.beforeCommitIdx).toBe(2);
    expect(view.notes.join(" ")).toContain("pre-stage history is not substituted");
  });

  it("keeps pre-write and post-write narrative reads visible while withholding an ambiguous grouped origin", () => {
    const view = projectStageActivity({ ...increment(), narrativeEntries: [
      narrative("increment#1", "Step 1: Read count = 2", "count", 1),
      narrative("increment#1", "Step 2: Write count = 3", "count", 2),
      narrative("increment#1", "Step 3: Read count = 3", "count", 3),
    ] });
    expect(view.events.map(event => event.text)).toHaveLength(3);
    expect(view.events[0].variableId).toBe("read:count");
    expect(view.events[2].variableId).toBeUndefined();
    expect(view.reads[0].traceTarget).toBeNull();
    expect(view.reads[0].value.state).toBe("unavailable");
  });

  it("withholds an ambiguous prior writer preview rather than selecting a later snapshot", () => {
    const input = increment();
    const view = projectStageActivity({ ...input, snapshots: [...input.snapshots, snapshot("seed#0", { count: "WRONG" })] });
    expect(view.availability.ok).toBe(true);
    expect(view.reads[0].value.state).toBe("unavailable");
    expect(view.writes[0].before?.state).toBe("unavailable");
    expect(JSON.stringify(view)).not.toContain("WRONG");
  });

  it("does not invoke getters, toJSON, inherited fields or custom formatters", () => {
    const getter = vi.fn(() => "PRIVATE"), toJSON = vi.fn(() => "PRIVATE");
    const memory: Record<string, unknown> = { nested: { toJSON }, inherited: Object.create({ secret: "PRIVATE" }) };
    Object.defineProperty(memory, "accessor", { get: getter, enumerable: true });
    const input = recording([
      { id: "seed#0", writes: ["accessor", "nested", "inherited\u001fsecret"], memory },
      { id: "read#1", reads: ["accessor", "nested", "inherited\u001fsecret"], writes: [], memory: {} },
    ]);
    const view = projectStageActivity(input);
    expect(view.reads[0].value.state).toBe("unavailable");
    expect(view.reads[2].value.state).toBe("unavailable");
    expect(formatStageActivitySummary(view)).not.toContain("PRIVATE");
    expect(getter).not.toHaveBeenCalled();
    expect(toJSON).not.toHaveBeenCalled();
  });

  it("discards unreadable narrative without losing independently admitted writes", () => {
    const getter = vi.fn(() => "PRIVATE");
    const entry = narrative("increment#1", "placeholder");
    Object.defineProperty(entry, "text", { get: getter });
    const view = projectStageActivity({ ...increment(), narrativeEntries: [entry] });
    expect(view.events).toEqual([]);
    expect(view.coverage.narrative).toBe("unavailable");
    expect(view.writes[0].after?.preview).toBe("3");
    expect(getter).not.toHaveBeenCalled();
  });

  it("retains unknown read coverage when execution-tree evidence is unreadable", () => {
    const input = increment();
    const reads = {};
    const getter = vi.fn(() => true);
    Object.defineProperty(reads, "count", { get: getter, enumerable: true });
    const view = projectStageActivity({ ...input, scope: { ...input.scope, executionTree: { runtimeStageId: "increment#1", stageReads: reads } } });
    expect(view.reads).toEqual([]);
    expect(view.coverage.reads).toBe("unknown");
    expect(view.writes[0].key).toBe("count");
    expect(getter).not.toHaveBeenCalled();
  });

  it("keeps object writes conservative when bounded previews cannot establish exact equality", () => {
    const view = projectStageActivity(recording([
      { id: "seed#0", writes: ["obj"], memory: { obj: { same: 1 } } },
      { id: "write#1", writes: ["obj"], memory: { obj: { same: 1 } } },
    ]));
    expect(view.writes[0].change).toBe("written");
  });

  it("caps variables and repeated events and bounds copied narrative text", () => {
    const keys = Array.from({ length: 101 }, (_, i) => `key${i}`);
    const input = recording([
      { id: "seed#0", writes: keys, memory: Object.fromEntries(keys.map(key => [key, 1])) },
      { id: "read#1", reads: keys, writes: keys, memory: Object.fromEntries(keys.map(key => [key, 2])) },
    ]);
    const view = projectStageActivity({ ...input, narrativeEntries: Array.from({ length: 201 }, (_, i) => narrative("read#1", `Step ${i}: Read key0 = 1`, "key0", i)) });
    expect(view.reads).toHaveLength(100); expect(view.writes).toHaveLength(100); expect(view.events).toHaveLength(200);
    expect(view.coverage.truncated).toBe(true);
    expect(view.notes.join(" ")).toContain("display limits");
    const long = projectStageActivity({ ...increment(), narrativeEntries: [narrative("increment#1", "x".repeat(100_000))] });
    expect(long.events[0].text.length).toBeLessThanOrEqual(4096);
    expect(long.coverage.truncated).toBe(true);
    expect(formatStageActivitySummary(long).length).toBeLessThan(8_000);
  });

  it("refuses oversized or identity-free evidence without retaining unbounded addresses", () => {
    const input = increment();
    const missing = projectStageActivity({ ...input, snapshots: [{ ...input.snapshots[0], runtimeStageId: undefined }], selectedIndex: 0 });
    expect(missing.availability.ok).toBe(false); expect(missing.reads).toEqual([]);
    const huge = projectStageActivity({ ...input, snapshots: [{ ...input.snapshots[0], runtimeStageId: "a".repeat(10_000) }], selectedIndex: 0 });
    expect(huge.availability.ok).toBe(false); expect(huge.identity.runtimeStageId).toBeNull();
    const tooLarge = projectStageActivity({ ...input, scope: { ...input.scope, commitLog: new Array(100_001) } });
    expect(tooLarge.availability.ok).toBe(false); expect(tooLarge.events).toEqual([]);
  });

  it("clearly formats unknown evidence instead of describing an original source", () => {
    const input = recording([{ id: "read#0", reads: ["external"], writes: [], memory: { external: 7 } }]);
    const view = projectStageActivity({ ...input, scope: { ...input.scope, readsAvailable: false } });
    expect(view.coverage.reads).toBe("unknown");
    expect(view.reads[0].value).toEqual({ state: "unavailable", preview: null });
    const copy = formatStageActivitySummary(view);
    expect(copy).toContain("prior writer unknown");
    expect(copy).toContain("read-call value not established here");
    expect(copy).not.toContain("value from before the run");
  });
});
