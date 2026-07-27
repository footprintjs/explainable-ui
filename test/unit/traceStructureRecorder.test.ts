/**
 * L7.7 — `createTraceStructureRecorder` 7-pattern test matrix.
 *
 * Covers: event accumulation, idempotency, decider-completion patching,
 * subflow-mount patching, loop-edge handling, defensive-copy invariants,
 * onChange callback, type-conformance with footprintjs StructureRecorder.
 *
 * The recorder is consumer-side code in `footprint-explainable-ui`. The
 * footprintjs builder fires the events — we simulate by calling the
 * recorder methods directly to avoid a cross-package test dep.
 */

import { describe, it, expect, vi } from "vitest";
import {
  createTraceStructureRecorder,
  type MinimalStructureRecorder,
  type TraceGraph,
  type TraceNode,
  type TraceNodeData,
} from "../../src/components/FlowchartView/traceStructureRecorder";

// Minimal spec stub matching the shape the recorder reads.
function spec(id: string, name: string, extra: Record<string, unknown> = {}) {
  return { id, name, type: "stage" as const, ...extra };
}

// ── 1. Unit ────────────────────────────────────────────────────────────────

describe("createTraceStructureRecorder — unit (event-to-graph translation)", () => {
  it("onStageAdded pushes a single xyflow node with id + label", () => {
    const t = createTraceStructureRecorder();
    t.recorder.onStageAdded!({
      stageId: "a",
      name: "A",
      type: "stage",
      spec: spec("a", "A"),
    });
    const g = t.getGraph();
    expect(g.nodes).toHaveLength(1);
    expect(g.nodes[0].id).toBe("a");
    expect(g.nodes[0].data.label).toBe("A");
    expect(g.nodes[0].data.isDecider).toBe(false);
    expect(g.nodes[0].data.isFork).toBe(false);
    expect(g.nodes[0].data.isSubflow).toBe(false);
  });

  it("onEdgeAdded pushes a single xyflow edge with source/target/kind", () => {
    const t = createTraceStructureRecorder();
    t.recorder.onEdgeAdded!({ from: "a", to: "b", kind: "next" });
    const g = t.getGraph();
    expect(g.edges).toHaveLength(1);
    expect(g.edges[0].source).toBe("a");
    expect(g.edges[0].target).toBe("b");
    expect(g.edges[0].data!.kind).toBe("next");
  });

  it("derives isDecider from the real engine's spec.hasDecider (type stays 'stage')", () => {
    const t = createTraceStructureRecorder();
    t.recorder.onStageAdded!({
      stageId: "classify",
      name: "Classify",
      type: "stage",
      spec: spec("classify", "Classify", { hasDecider: true }),
    });
    expect(t.getGraph().nodes[0].data.isDecider).toBe(true);
  });

  it("derives isDecider from the real engine's spec.hasSelector (type stays 'stage')", () => {
    const t = createTraceStructureRecorder();
    t.recorder.onStageAdded!({
      stageId: "screen",
      name: "Screen",
      type: "stage",
      spec: spec("screen", "Screen", { hasSelector: true }),
    });
    expect(t.getGraph().nodes[0].data.isDecider).toBe(true);
  });

  it("onDeciderComplete marks the node isDecider even without spec flags", () => {
    const t = createTraceStructureRecorder();
    t.recorder.onStageAdded!({
      stageId: "route",
      name: "Route",
      type: "stage",
      spec: spec("route", "Route"),
    });
    expect(t.getGraph().nodes[0].data.isDecider).toBe(false);
    t.recorder.onDeciderComplete!({
      decider: "route",
      type: "decider",
      branchIds: ["a", "b"],
    });
    const node = t.getGraph().nodes[0];
    expect(node.data.isDecider).toBe(true);
    expect(node.data.branchIds).toEqual(["a", "b"]);
  });

  it("recorder has a stable id (default 'trace-structure')", () => {
    const t = createTraceStructureRecorder();
    expect(t.recorder.id).toBe("trace-structure");
  });

  it("custom id is preserved when passed in options", () => {
    const t = createTraceStructureRecorder({ id: "lens-trace" });
    expect(t.recorder.id).toBe("lens-trace");
  });
});

// ── 2. Functional ─────────────────────────────────────────────────────────

describe("createTraceStructureRecorder — functional", () => {
  it("a linear 3-stage chain produces 3 nodes + 2 edges", () => {
    const t = createTraceStructureRecorder();
    t.recorder.onStageAdded!({ stageId: "seed", name: "Seed", type: "stage", spec: spec("seed", "Seed") });
    t.recorder.onStageAdded!({ stageId: "a", name: "A", type: "stage", spec: spec("a", "A") });
    t.recorder.onEdgeAdded!({ from: "seed", to: "a", kind: "next" });
    t.recorder.onStageAdded!({ stageId: "b", name: "B", type: "stage", spec: spec("b", "B") });
    t.recorder.onEdgeAdded!({ from: "a", to: "b", kind: "next" });

    const g = t.getGraph();
    expect(g.nodes.map((n) => n.id)).toEqual(["seed", "a", "b"]);
    expect(g.edges.map((e) => `${e.source}->${e.target}`)).toEqual(["seed->a", "a->b"]);
  });

  it("decider event types set isDecider:true on the stage", () => {
    const t = createTraceStructureRecorder();
    t.recorder.onStageAdded!({
      stageId: "route",
      name: "Route",
      type: "decider",
      spec: spec("route", "Route", { type: "decider" }),
    });
    expect(t.getGraph().nodes[0].data.isDecider).toBe(true);
  });

  it("selector type also sets isDecider:true (selectors render same way visually)", () => {
    const t = createTraceStructureRecorder();
    t.recorder.onStageAdded!({
      stageId: "pick",
      name: "Pick",
      type: "selector",
      spec: spec("pick", "Pick", { type: "selector" }),
    });
    expect(t.getGraph().nodes[0].data.isDecider).toBe(true);
  });

  it("fork type sets isFork:true", () => {
    const t = createTraceStructureRecorder();
    t.recorder.onStageAdded!({
      stageId: "fork",
      name: "Fork",
      type: "fork",
      spec: spec("fork", "Fork", { type: "fork" }),
    });
    expect(t.getGraph().nodes[0].data.isFork).toBe(true);
  });

  it("isPausable flag on event propagates to node data", () => {
    const t = createTraceStructureRecorder();
    t.recorder.onStageAdded!({
      stageId: "p",
      name: "P",
      type: "stage",
      isPausable: true,
      spec: spec("p", "P"),
    });
    expect(t.getGraph().nodes[0].data.isPausable).toBe(true);
  });

  it("description + icon + subflowId from spec propagate to node data", () => {
    const t = createTraceStructureRecorder();
    t.recorder.onStageAdded!({
      stageId: "x",
      name: "X",
      type: "stage",
      spec: spec("x", "X", {
        description: "validates input",
        icon: "llm",
        subflowId: "sf-foo",
        isSubflowRoot: true,
      }),
    });
    const node = t.getGraph().nodes[0];
    expect(node.data.description).toBe("validates input");
    expect(node.data.icon).toBe("llm");
    expect(node.data.subflowId).toBe("sf-foo");
    expect(node.data.isSubflow).toBe(true);
  });

  it("onDeciderComplete patches the existing decider node with branchIds + defaultBranch", () => {
    const t = createTraceStructureRecorder();
    t.recorder.onStageAdded!({
      stageId: "route",
      name: "Route",
      type: "decider",
      spec: spec("route", "Route", { type: "decider" }),
    });
    t.recorder.onDeciderComplete!({
      decider: "route",
      type: "decider",
      branchIds: ["low", "high"],
      defaultBranch: "low",
    });
    const node = t.getGraph().nodes[0];
    expect(node.data.branchIds).toEqual(["low", "high"]);
    expect(node.data.defaultBranch).toBe("low");
  });

  it("onSubflowMounted upgrades the mount node with isSubflow + subflowId", () => {
    const t = createTraceStructureRecorder();
    // Mount node added first (the builder fires onStageAdded before onSubflowMounted).
    t.recorder.onStageAdded!({
      stageId: "sub",
      name: "Sub",
      type: "stage",
      spec: spec("sub", "Sub"),
    });
    t.recorder.onSubflowMounted!({
      subflowId: "sub",
      subflowName: "Sub",
      rootStageId: "sub",
      isLazy: true,
    });
    const node = t.getGraph().nodes[0];
    expect(node.data.isSubflow).toBe(true);
    expect(node.data.subflowId).toBe("sub");
    expect(node.data.isLazy).toBe(true);
  });

  it("onLoopEdgeAdded produces an edge with kind:'loop'", () => {
    const t = createTraceStructureRecorder();
    t.recorder.onLoopEdgeAdded!({ from: "tail", to: "seed" });
    const edge = t.getGraph().edges[0];
    expect(edge.source).toBe("tail");
    expect(edge.target).toBe("seed");
    expect(edge.data!.kind).toBe("loop");
  });
});

// ── 3. Integration ────────────────────────────────────────────────────────

describe("createTraceStructureRecorder — integration (realistic chart sequence)", () => {
  it("seed → decider → 2 branches → loop produces correct full graph", () => {
    const t = createTraceStructureRecorder();
    const r = t.recorder;
    // Seed
    r.onStageAdded!({ stageId: "seed", name: "seed", type: "stage", spec: spec("seed", "seed") });
    // Decider
    r.onStageAdded!({ stageId: "route", name: "route", type: "decider", spec: spec("route", "route", { type: "decider" }) });
    r.onEdgeAdded!({ from: "seed", to: "route", kind: "next" });
    // Branches
    r.onStageAdded!({ stageId: "low", name: "low", type: "stage", spec: spec("low", "low") });
    r.onEdgeAdded!({ from: "route", to: "low", kind: "decision-branch", label: "low" });
    r.onStageAdded!({ stageId: "high", name: "high", type: "stage", spec: spec("high", "high") });
    r.onEdgeAdded!({ from: "route", to: "high", kind: "decision-branch", label: "high" });
    r.onDeciderComplete!({
      decider: "route",
      type: "decider",
      branchIds: ["low", "high"],
      defaultBranch: "low",
    });
    // Loop back to seed
    r.onLoopEdgeAdded!({ from: "high", to: "seed" });

    const g = t.getGraph();
    expect(g.nodes.map((n) => n.id)).toEqual(["seed", "route", "low", "high"]);
    expect(g.edges.map((e) => `${e.source}->${e.target}:${e.data!.kind}`)).toEqual([
      "seed->route:next",
      "route->low:decision-branch",
      "route->high:decision-branch",
      "high->seed:loop",
    ]);
    expect(g.nodes[1].data.branchIds).toEqual(["low", "high"]);
  });
});

// ── 4. Property ────────────────────────────────────────────────────────────

describe("createTraceStructureRecorder — property", () => {
  it.each([1, 5, 50, 250])(
    "N-stage chain produces exactly N nodes + N-1 edges (N=%d)",
    (n) => {
      const t = createTraceStructureRecorder();
      const r = t.recorder;
      r.onStageAdded!({ stageId: "s0", name: "s0", type: "stage", spec: spec("s0", "s0") });
      for (let i = 1; i < n; i++) {
        r.onStageAdded!({ stageId: `s${i}`, name: `s${i}`, type: "stage", spec: spec(`s${i}`, `s${i}`) });
        r.onEdgeAdded!({ from: `s${i - 1}`, to: `s${i}`, kind: "next" });
      }
      const g = t.getGraph();
      expect(g.nodes).toHaveLength(n);
      expect(g.edges).toHaveLength(n - 1);
    },
  );
});

// ── 5. Security ────────────────────────────────────────────────────────────

describe("createTraceStructureRecorder — security (defensive-copy + immutability)", () => {
  it("getGraph() returns a defensive copy — mutating it does NOT affect subsequent reads", () => {
    const t = createTraceStructureRecorder();
    t.recorder.onStageAdded!({ stageId: "a", name: "A", type: "stage", spec: spec("a", "A") });
    const first = t.getGraph();
    first.nodes.length = 0; // truncate aggressively
    first.nodes.push({ id: "FAKE", position: { x: 0, y: 0 }, data: { label: "FAKE", isDecider: false, isFork: false, isSubflow: false } } as any);
    const second = t.getGraph();
    expect(second.nodes).toHaveLength(1);
    expect(second.nodes[0].id).toBe("a");
  });

  it("getGraph() returns nodes whose .data is also a defensive copy", () => {
    const t = createTraceStructureRecorder();
    t.recorder.onStageAdded!({ stageId: "a", name: "A", type: "stage", spec: spec("a", "A", { description: "orig" }) });
    const first = t.getGraph();
    (first.nodes[0].data as any).description = "mutated";
    const second = t.getGraph();
    expect(second.nodes[0].data.description).toBe("orig");
  });

  it("getGraphRef() returns LIVE arrays — documented as read-only fast-path", () => {
    const t = createTraceStructureRecorder();
    t.recorder.onStageAdded!({ stageId: "a", name: "A", type: "stage", spec: spec("a", "A") });
    const ref1 = t.getGraphRef();
    const ref2 = t.getGraphRef();
    // Same reference — caller MUST NOT mutate.
    expect(ref1.nodes).toBe(ref2.nodes);
  });

  it("recorder does NOT mutate the spec reference passed in the event", () => {
    const t = createTraceStructureRecorder();
    const passedSpec = spec("x", "X", { description: "orig" });
    t.recorder.onStageAdded!({ stageId: "x", name: "X", type: "stage", spec: passedSpec });
    expect(passedSpec.description).toBe("orig");
    expect(passedSpec.id).toBe("x");
  });
});

// ── 6. Performance ─────────────────────────────────────────────────────────

describe("createTraceStructureRecorder — performance", () => {
  // Generous budget (CI variance): an O(n²) accumulation regression on 500 stages
  // would be SECONDS, not ~200ms — catches blow-ups, absorbs runner noise (was 30ms).
  it("500-stage chain accumulation under 200ms", () => {
    const t = createTraceStructureRecorder();
    const r = t.recorder;
    const t0 = performance.now();
    r.onStageAdded!({ stageId: "s0", name: "s0", type: "stage", spec: spec("s0", "s0") });
    for (let i = 1; i < 500; i++) {
      r.onStageAdded!({ stageId: `s${i}`, name: `s${i}`, type: "stage", spec: spec(`s${i}`, `s${i}`) });
      r.onEdgeAdded!({ from: `s${i - 1}`, to: `s${i}`, kind: "next" });
    }
    expect(performance.now() - t0).toBeLessThan(200);
  });

  it("upsert path is O(1) — re-firing onStageAdded for same id does NOT duplicate", () => {
    const t = createTraceStructureRecorder();
    t.recorder.onStageAdded!({ stageId: "a", name: "A", type: "stage", spec: spec("a", "A") });
    t.recorder.onStageAdded!({ stageId: "a", name: "A2", type: "stage", spec: spec("a", "A2") });
    const g = t.getGraph();
    expect(g.nodes).toHaveLength(1);
    // Most-recent values win on merge.
    expect(g.nodes[0].data.label).toBe("A2");
  });
});

// ── 7. ROI / Lifecycle ────────────────────────────────────────────────────

describe("createTraceStructureRecorder — ROI + lifecycle", () => {
  it("type-conforms to MinimalStructureRecorder (compile-time check)", () => {
    const t = createTraceStructureRecorder();
    const _typed: MinimalStructureRecorder = t.recorder;
    expect(_typed.id).toBeDefined();
  });

  it("onChange callback fires after each event (incremental-render hook)", () => {
    const onChange = vi.fn();
    const t = createTraceStructureRecorder({ onChange });
    t.recorder.onStageAdded!({ stageId: "a", name: "A", type: "stage", spec: spec("a", "A") });
    t.recorder.onEdgeAdded!({ from: "a", to: "b", kind: "next" });
    expect(onChange).toHaveBeenCalledTimes(2);
    const last = onChange.mock.calls[1][0] as Readonly<TraceGraph>;
    expect(last.edges).toHaveLength(1);
  });

  it("reset() clears all internal state for reuse", () => {
    const t = createTraceStructureRecorder();
    t.recorder.onStageAdded!({ stageId: "a", name: "A", type: "stage", spec: spec("a", "A") });
    t.recorder.onEdgeAdded!({ from: "a", to: "b", kind: "next" });
    expect(t.getGraph().nodes).toHaveLength(1);
    t.reset();
    expect(t.getGraph().nodes).toHaveLength(0);
    expect(t.getGraph().edges).toHaveLength(0);
    // Re-use: recorder is functional again.
    t.recorder.onStageAdded!({ stageId: "x", name: "X", type: "stage", spec: spec("x", "X") });
    expect(t.getGraph().nodes[0].id).toBe("x");
  });

  it("duplicate-edge dedupe by id prevents seed-replay double-add scenarios", () => {
    const t = createTraceStructureRecorder();
    t.recorder.onEdgeAdded!({ from: "a", to: "b", kind: "next" });
    t.recorder.onEdgeAdded!({ from: "a", to: "b", kind: "next" });
    expect(t.getGraph().edges).toHaveLength(1);
  });

  it("dual edges between same pair with DIFFERENT kinds are kept as distinct edges", () => {
    const t = createTraceStructureRecorder();
    t.recorder.onEdgeAdded!({ from: "a", to: "b", kind: "next" });
    t.recorder.onEdgeAdded!({ from: "a", to: "b", kind: "decision-branch", label: "fallback" });
    expect(t.getGraph().edges).toHaveLength(2);
  });

  it("a TraceNodeData typed as expected (compile-time check)", () => {
    const t = createTraceStructureRecorder();
    t.recorder.onStageAdded!({ stageId: "a", name: "A", type: "stage", spec: spec("a", "A") });
    const data: TraceNodeData = t.getGraph().nodes[0].data;
    expect(data.label).toBe("A");
  });
});

// ── Panel-driven regression coverage (L7.7 review must-fix) ────────────────

describe("createTraceStructureRecorder — pub-sub subscribe() + version() (L7.8 contract)", () => {
  // L8.0 — listener notifications are MICROTASK-BATCHED. Multiple
  // synchronous events fired in one tick coalesce into a single
  // listener invocation. Tests drain pending microtasks via
  // `await Promise.resolve()` before asserting listener call counts.
  // version() bumps SYNCHRONOUSLY — assertions on version need no await.

  it("subscribe() listener fires (microtask-batched) after graph-mutating events", async () => {
    const t = createTraceStructureRecorder();
    const listener = vi.fn();
    t.subscribe(listener);
    t.recorder.onStageAdded!({ stageId: "a", name: "A", type: "stage", spec: spec("a", "A") });
    t.recorder.onEdgeAdded!({ from: "a", to: "b", kind: "next" });
    await Promise.resolve();
    // Two events in one tick → coalesced to ONE listener invocation.
    // For per-event delivery, consumers should poll `version()` rather
    // than rely on listener granularity (documented in notifier JSDoc).
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("subscribe() returns an unsubscribe function that removes the listener", async () => {
    const t = createTraceStructureRecorder();
    const listener = vi.fn();
    const unsub = t.subscribe(listener);
    t.recorder.onStageAdded!({ stageId: "a", name: "A", type: "stage", spec: spec("a", "A") });
    await Promise.resolve();
    expect(listener).toHaveBeenCalledTimes(1);
    unsub();
    t.recorder.onStageAdded!({ stageId: "b", name: "B", type: "stage", spec: spec("b", "B") });
    await Promise.resolve();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("multiple subscribers all fire (true pub-sub)", async () => {
    const t = createTraceStructureRecorder();
    const a = vi.fn();
    const b = vi.fn();
    t.subscribe(a);
    t.subscribe(b);
    t.recorder.onStageAdded!({ stageId: "x", name: "X", type: "stage", spec: spec("x", "X") });
    await Promise.resolve();
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
  });

  it("throwing subscriber does NOT cascade to other subscribers", async () => {
    const t = createTraceStructureRecorder();
    const bad = vi.fn(() => {
      throw new Error("subscriber boom");
    });
    const good = vi.fn();
    t.subscribe(bad);
    t.subscribe(good);
    expect(() =>
      t.recorder.onStageAdded!({ stageId: "x", name: "X", type: "stage", spec: spec("x", "X") }),
    ).not.toThrow();
    await Promise.resolve();
    expect(good).toHaveBeenCalledTimes(1);
  });

  it("version() bumps SYNCHRONOUSLY once per graph-mutating event (no microtask wait needed)", () => {
    const t = createTraceStructureRecorder();
    expect(t.version()).toBe(0);
    t.recorder.onStageAdded!({ stageId: "a", name: "A", type: "stage", spec: spec("a", "A") });
    expect(t.version()).toBe(1);
    t.recorder.onEdgeAdded!({ from: "a", to: "b", kind: "next" });
    expect(t.version()).toBe(2);
  });

  it("reset() does NOT bump version or notify subscribers (documented contract)", async () => {
    const t = createTraceStructureRecorder();
    const listener = vi.fn();
    t.subscribe(listener);
    t.recorder.onStageAdded!({ stageId: "a", name: "A", type: "stage", spec: spec("a", "A") });
    await Promise.resolve();
    const versionBeforeReset = t.version();
    const listenerCallsBefore = listener.mock.calls.length;
    t.reset();
    await Promise.resolve();
    expect(t.version()).toBe(versionBeforeReset);
    expect(listener).toHaveBeenCalledTimes(listenerCallsBefore);
  });

  it("subscribe + onChange both fire (onChange is SYNCHRONOUS — fires per event)", async () => {
    const onChange = vi.fn();
    const t = createTraceStructureRecorder({ onChange });
    const sub = vi.fn();
    t.subscribe(sub);
    t.recorder.onStageAdded!({ stageId: "a", name: "A", type: "stage", spec: spec("a", "A") });
    // onChange is synchronous (legacy contract, NOT batched).
    expect(onChange).toHaveBeenCalledTimes(1);
    // subscribe listener is microtask-batched.
    await Promise.resolve();
    expect(sub).toHaveBeenCalledTimes(1);
  });
});

describe("createTraceStructureRecorder — L8.0 prevIds/nextIds on TraceNode.data", () => {
  it("linear chain populates prevIds + nextIds correctly", () => {
    const t = createTraceStructureRecorder();
    const r = t.recorder;
    r.onStageAdded!({ stageId: "a", name: "A", type: "stage", spec: spec("a", "A") });
    r.onStageAdded!({ stageId: "b", name: "B", type: "stage", spec: spec("b", "B") });
    r.onEdgeAdded!({ from: "a", to: "b", kind: "next" });
    r.onStageAdded!({ stageId: "c", name: "C", type: "stage", spec: spec("c", "C") });
    r.onEdgeAdded!({ from: "b", to: "c", kind: "next" });

    const g = t.getGraph();
    const a = g.nodes.find((n) => n.id === "a")!;
    const b = g.nodes.find((n) => n.id === "b")!;
    const c = g.nodes.find((n) => n.id === "c")!;

    expect(a.data.prevIds).toEqual([]);
    expect(a.data.nextIds).toEqual(["b"]);
    expect(b.data.prevIds).toEqual(["a"]);
    expect(b.data.nextIds).toEqual(["c"]);
    expect(c.data.prevIds).toEqual(["b"]);
    expect(c.data.nextIds).toEqual([]);
  });

  it("fork convergence: post-fork node carries prevIds for BOTH branches", () => {
    // Mirrors the playground fork sample. footprintjs's recorder now
    // fires N convergence edges (one per fork child → next); the
    // translator's prev/next index naturally captures both sources.
    const t = createTraceStructureRecorder();
    const r = t.recorder;
    r.onStageAdded!({ stageId: "LoadOrder", name: "LoadOrder", type: "stage", spec: spec("LoadOrder", "LoadOrder") });
    r.onStageAdded!({ stageId: "CheckInventory", name: "CheckInventory", type: "stage", spec: spec("CheckInventory", "CheckInventory") });
    r.onEdgeAdded!({ from: "LoadOrder", to: "CheckInventory", kind: "fork-branch" });
    r.onStageAdded!({ stageId: "RunFraudCheck", name: "RunFraudCheck", type: "stage", spec: spec("RunFraudCheck", "RunFraudCheck") });
    r.onEdgeAdded!({ from: "LoadOrder", to: "RunFraudCheck", kind: "fork-branch" });
    r.onStageAdded!({ stageId: "FinalizeOrder", name: "FinalizeOrder", type: "stage", spec: spec("FinalizeOrder", "FinalizeOrder") });
    // The convergence-expanded edges (post-fork-fix): one from each branch.
    r.onEdgeAdded!({ from: "CheckInventory", to: "FinalizeOrder", kind: "next" });
    r.onEdgeAdded!({ from: "RunFraudCheck", to: "FinalizeOrder", kind: "next" });

    const g = t.getGraph();
    const finalize = g.nodes.find((n) => n.id === "FinalizeOrder")!;
    expect(finalize.data.prevIds.sort()).toEqual(["CheckInventory", "RunFraudCheck"]);

    const load = g.nodes.find((n) => n.id === "LoadOrder")!;
    expect(load.data.nextIds.sort()).toEqual(["CheckInventory", "RunFraudCheck"]);
  });

  it("loop back-edge does NOT contribute to prevIds/nextIds (invariant I1)", () => {
    const t = createTraceStructureRecorder();
    const r = t.recorder;
    r.onStageAdded!({ stageId: "seed", name: "seed", type: "stage", spec: spec("seed", "seed") });
    r.onStageAdded!({ stageId: "tail", name: "tail", type: "stage", spec: spec("tail", "tail") });
    r.onEdgeAdded!({ from: "seed", to: "tail", kind: "next" });
    // Loop back-edge from tail to seed — must NOT inflate seed.prevIds
    // (it's a visual annotation only, per invariant I1).
    r.onLoopEdgeAdded!({ from: "tail", to: "seed" });

    const g = t.getGraph();
    const seed = g.nodes.find((n) => n.id === "seed")!;
    const tail = g.nodes.find((n) => n.id === "tail")!;
    expect(seed.data.prevIds).toEqual([]); // not ['tail']
    expect(tail.data.nextIds).toEqual([]); // not ['seed']
  });

  it("L8.0 panel-fix: getGraphRef caller's cached prevIds array is NOT mutated when new edges fire (atomic-replace)", () => {
    const t = createTraceStructureRecorder();
    const r = t.recorder;
    r.onStageAdded!({ stageId: "a", name: "A", type: "stage", spec: spec("a", "A") });
    r.onStageAdded!({ stageId: "b", name: "B", type: "stage", spec: spec("b", "B") });
    r.onEdgeAdded!({ from: "a", to: "b", kind: "next" });

    // Consumer using getGraphRef caches a reference to the live arrays.
    const ref = t.getGraphRef();
    const b = ref.nodes.find((n) => n.id === "b")!;
    const cachedPrevIds = b.data.prevIds; // snapshot the array ref

    // Fire ANOTHER edge into b. The atomic-replace contract: b.data.prevIds
    // gets REPLACED with a fresh array; the consumer's cached ref must NOT
    // grow.
    r.onStageAdded!({ stageId: "c", name: "C", type: "stage", spec: spec("c", "C") });
    r.onEdgeAdded!({ from: "c", to: "b", kind: "next" });

    expect(cachedPrevIds).toEqual(["a"]); // cached ref unchanged
    expect(cachedPrevIds.length).toBe(1);
    // But the LIVE node.data.prevIds is fresh and updated:
    expect(b.data.prevIds.sort()).toEqual(["a", "c"]);
    // Identity check — the array ref has changed (atomic replace):
    expect(b.data.prevIds).not.toBe(cachedPrevIds);
  });

  it("edge fires BEFORE target's onStageAdded — prevIds still populated correctly", () => {
    // Ordering robustness: even if the edge from A→B fires before B's
    // onStageAdded (which shouldn't happen in practice, but test
    // defensively), B's prevIds picks up the prior edge.
    const t = createTraceStructureRecorder();
    const r = t.recorder;
    r.onStageAdded!({ stageId: "a", name: "A", type: "stage", spec: spec("a", "A") });
    // Edge fires before target is announced — index buffers it.
    r.onEdgeAdded!({ from: "a", to: "b", kind: "next" });
    r.onStageAdded!({ stageId: "b", name: "B", type: "stage", spec: spec("b", "B") });

    const g = t.getGraph();
    const b = g.nodes.find((n) => n.id === "b")!;
    expect(b.data.prevIds).toEqual(["a"]);
  });
});

describe("createTraceStructureRecorder — panel-driven regression coverage", () => {
  it("streaming type sets isStreaming:true on node data (Panel finding #2)", () => {
    const t = createTraceStructureRecorder();
    t.recorder.onStageAdded!({
      stageId: "stream",
      name: "stream",
      type: "streaming",
      spec: spec("stream", "stream", { type: "streaming", isStreaming: true }),
    });
    const node = t.getGraph().nodes[0];
    expect(node.data.isStreaming).toBe(true);
    expect(node.data.isDecider).toBe(false);
    expect(node.data.isFork).toBe(false);
  });

  it("non-streaming nodes carry isStreaming:false (no surprise undefined)", () => {
    const t = createTraceStructureRecorder();
    t.recorder.onStageAdded!({ stageId: "a", name: "A", type: "stage", spec: spec("a", "A") });
    expect(t.getGraph().nodes[0].data.isStreaming).toBe(false);
  });

  it("onDeciderComplete for unknown stageId no-ops (and warns in dev mode)", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    try {
      const t = createTraceStructureRecorder();
      // No onStageAdded fired for "ghost-decider".
      t.recorder.onDeciderComplete!({
        decider: "ghost-decider",
        type: "decider",
        branchIds: ["x"],
      });
      expect(t.getGraph().nodes).toHaveLength(0);
      expect(warn).toHaveBeenCalledOnce();
      const message = warn.mock.calls[0]?.[0] as string;
      expect(message).toContain("ghost-decider");
    } finally {
      warn.mockRestore();
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  // ── Out-of-order mounts: late-bind, never drop ─────────────────────
  // The builder fires onStageAdded before onSubflowMounted, but a BRIDGE
  // replaying a recorded event stream may not. The recorder used to warn
  // and drop the metadata, which silently downgraded the subflow to a
  // plain stage (no drill target, no subflow styling).

  it("onSubflowMounted BEFORE onStageAdded: the patch waits and lands when the node arrives", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    try {
      const t = createTraceStructureRecorder();
      t.recorder.onSubflowMounted!({
        subflowId: "sf-late",
        subflowName: "Late",
        rootStageId: "mount-late",
        isLazy: true,
      });
      // Nothing to patch yet — and nothing invented either.
      expect(t.getGraph().nodes).toHaveLength(0);

      t.recorder.onStageAdded!({
        stageId: "mount-late",
        name: "Late",
        type: "stage",
        spec: spec("mount-late", "Late"),
      });

      const node = t.getGraph().nodes[0];
      expect(node.data.isSubflow).toBe(true);
      expect(node.data.subflowId).toBe("sf-late");
      expect(node.data.isLazy).toBe(true);
      // Data preserved, so there is nothing to warn about.
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it("onSubflowMounted BEFORE onStageAdded: inner structure materializes immediately", () => {
    const t = createTraceStructureRecorder();
    const inner = spec("compose", "Compose");
    t.recorder.onSubflowMounted!({
      subflowId: "sf-early",
      subflowName: "Early",
      rootStageId: "mount-early",
      subflowSpec: inner,
      subflowPath: "sf-early",
    });
    // The inner walk never needed the mount node, so it runs right away.
    expect(t.getGraph().nodes.map((n) => n.id)).toContain("sf-early/compose");

    t.recorder.onStageAdded!({
      stageId: "mount-early",
      name: "Early",
      type: "stage",
      spec: spec("mount-early", "Early"),
    });
    const mount = t.getGraph().nodes.find((n) => n.id === "mount-early");
    expect(mount?.data.isSubflow).toBe(true);
    expect(mount?.data.subflowId).toBe("sf-early");
  });

  it("reset() drops buffered mount patches (a new build must not inherit them)", () => {
    const t = createTraceStructureRecorder();
    t.recorder.onSubflowMounted!({
      subflowId: "sf-stale",
      subflowName: "Stale",
      rootStageId: "mount-stale",
    });
    t.reset();
    t.recorder.onStageAdded!({
      stageId: "mount-stale",
      name: "Stale",
      type: "stage",
      spec: spec("mount-stale", "Stale"),
    });
    expect(t.getGraph().nodes[0].data.isSubflow).toBe(false);
    expect(t.getGraph().nodes[0].data.subflowId).toBeUndefined();
  });

  it("orphan-patch warnings stay silent in production mode", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    try {
      const t = createTraceStructureRecorder();
      t.recorder.onDeciderComplete!({ decider: "ghost", type: "decider", branchIds: [] });
      t.recorder.onSubflowMounted!({ subflowId: "x", subflowName: "X", rootStageId: "missing" });
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it("rootStageId !== subflowId divergence: recorder keys on rootStageId (forward-compat)", () => {
    // Today the upstream contract sets rootStageId === subflowId, but the
    // event interface treats them as semantically distinct. This test
    // locks in the recorder's keying choice so future upstream changes
    // (mount node id != subflow id) keep the lookup correct.
    const t = createTraceStructureRecorder();
    t.recorder.onStageAdded!({
      stageId: "mount-a",
      name: "Mount A",
      type: "stage",
      spec: spec("mount-a", "Mount A"),
    });
    t.recorder.onSubflowMounted!({
      subflowId: "sf-payment", // semantically different from rootStageId
      subflowName: "Payment",
      rootStageId: "mount-a",
    });
    const node = t.getGraph().nodes[0];
    expect(node.id).toBe("mount-a");
    expect(node.data.isSubflow).toBe(true);
    expect(node.data.subflowId).toBe("sf-payment");
  });

  it("getGraphRef mutation IS a footgun — corrupts subsequent getGraph reads (documented contract)", () => {
    const t = createTraceStructureRecorder();
    t.recorder.onStageAdded!({ stageId: "a", name: "A", type: "stage", spec: spec("a", "A") });
    const ref = t.getGraphRef();
    // Mutating the live arrays does affect subsequent state. This test
    // locks in the documented "read-only fast-path" contract — consumers
    // who ignore it get corrupted state, as documented.
    (ref.nodes as TraceNode[]).length = 0;
    expect(t.getGraph().nodes).toHaveLength(0); // recorder is now corrupted
    // After reset(), the recorder recovers.
    t.reset();
    t.recorder.onStageAdded!({ stageId: "b", name: "B", type: "stage", spec: spec("b", "B") });
    expect(t.getGraph().nodes).toHaveLength(1);
  });

  it("reset() mid-build: events after reset land in fresh state", () => {
    const t = createTraceStructureRecorder();
    t.recorder.onStageAdded!({ stageId: "a", name: "A", type: "stage", spec: spec("a", "A") });
    t.recorder.onStageAdded!({ stageId: "b", name: "B", type: "stage", spec: spec("b", "B") });
    t.recorder.onEdgeAdded!({ from: "a", to: "b", kind: "next" });
    expect(t.getGraph().nodes).toHaveLength(2);
    // Reset mid-conceptual-build.
    t.reset();
    // New events go into clean state.
    t.recorder.onStageAdded!({ stageId: "x", name: "X", type: "stage", spec: spec("x", "X") });
    t.recorder.onStageAdded!({ stageId: "y", name: "Y", type: "stage", spec: spec("y", "Y") });
    t.recorder.onEdgeAdded!({ from: "x", to: "y", kind: "next" });
    const g = t.getGraph();
    expect(g.nodes.map((n) => n.id)).toEqual(["x", "y"]);
    expect(g.edges.map((e) => `${e.source}->${e.target}`)).toEqual(["x->y"]);
  });
});

// ── subflowOf — stack-based subflow membership tracking ────────────

describe("createTraceStructureRecorder — subflowOf tracking", () => {
  /**
   * Reproduces the REAL event order footprintjs's builder emits for:
   *   parent: CreateOrder → [payment subflow] → ShipOrder
   *   subflow 'payment': ValidateCard → ChargeCard → SendReceipt
   *
   * footprintjs's builder constructs subflows FIRST (firing all their
   * inner-stage events), then mounts them in the parent. So the
   * subflow's internals appear in the event stream BEFORE the parent's
   * stages. The recorder must catch up retroactively at
   * onSubflowMounted time by identifying disconnected untagged
   * subgraphs as the just-mounted subflow's members.
   */
  function fireSubflowChart(t: ReturnType<typeof createTraceStructureRecorder>) {
    const r = t.recorder;
    // v6 (proposal #001) flow: recorder attached ONLY to the PARENT.
    // Inner subflow events are NOT fired directly to the parent's
    // recorder; instead, the mount event carries `subflowSpec` with
    // the inner structure, and the recorder walks it to materialize
    // inner nodes/edges with `subflowOf` set.
    //
    // The subflow's inner spec — exactly what the builder would
    // attach to `subflow.buildTimeStructure` (linear chain
    // validate-card → charge-card → send-receipt).
    const sendReceiptSpec = spec("send-receipt", "SendReceipt");
    const chargeCardSpec = { ...spec("charge-card", "ChargeCard"), next: sendReceiptSpec };
    const validateCardSpec = { ...spec("validate-card", "ValidateCard"), next: chargeCardSpec };

    // ── Parent fires its own stage events + the enriched mount event ──
    r.onStageAdded!({ stageId: "create-order", name: "CreateOrder", type: "stage", spec: spec("create-order", "CreateOrder") });
    r.onStageAdded!({ stageId: "payment", name: "ProcessPayment", type: "stage", spec: spec("payment", "ProcessPayment", { isSubflowRoot: true, subflowId: "payment" }) });
    r.onEdgeAdded!({ from: "create-order", to: "payment", kind: "next" });
    r.onSubflowMounted!({
      subflowId: "payment",
      subflowName: "ProcessPayment",
      rootStageId: "payment",
      subflowSpec: validateCardSpec,
      subflowPath: "payment",
    });
    r.onStageAdded!({ stageId: "ship-order", name: "ShipOrder", type: "stage", spec: spec("ship-order", "ShipOrder") });
    r.onEdgeAdded!({ from: "payment", to: "ship-order", kind: "next" });
  }

  it("parent stages have subflowOf === undefined", () => {
    const t = createTraceStructureRecorder();
    fireSubflowChart(t);
    const byId = new Map(t.getGraph().nodes.map((n) => [n.id, n.data]));
    expect(byId.get("create-order")?.subflowOf).toBeUndefined();
    expect(byId.get("payment")?.subflowOf).toBeUndefined();
    expect(byId.get("ship-order")?.subflowOf).toBeUndefined();
  });

  it("subflow internal stages have subflowOf === the parent mount's subflowId", () => {
    const t = createTraceStructureRecorder();
    fireSubflowChart(t);
    const byId = new Map(t.getGraph().nodes.map((n) => [n.id, n.data]));
    // Inner node ids are now path-qualified (mirrors runtimeStageId);
    // subflowOf still carries the bare parent subflowId.
    expect(byId.get("payment/validate-card")?.subflowOf).toBe("payment");
    expect(byId.get("payment/charge-card")?.subflowOf).toBe("payment");
    expect(byId.get("payment/send-receipt")?.subflowOf).toBe("payment");
  });

  it("mount node itself is NOT tagged with subflowOf (it lives in the parent chain)", () => {
    const t = createTraceStructureRecorder();
    fireSubflowChart(t);
    const payment = t.getGraph().nodes.find((n) => n.id === "payment");
    expect(payment?.data.isSubflow).toBe(true);
    expect(payment?.data.subflowOf).toBeUndefined();
  });

  it("the post-subflow parent stage (ship-order) is re-tagged to undefined after pop", () => {
    const t = createTraceStructureRecorder();
    fireSubflowChart(t);
    // ship-order is added WHILE the subflow stack is still pushed, so
    // it's initially tagged 'payment'. The mount → ship-order edge
    // pops the stack AND re-tags ship-order back to top-level.
    const shipOrder = t.getGraph().nodes.find((n) => n.id === "ship-order");
    expect(shipOrder?.data.subflowOf).toBeUndefined();
  });

  it("NESTED subflows — outer mount carries spec, walker recurses into inner mount", () => {
    const t = createTraceStructureRecorder();
    const r = t.recorder;
    // v6 flow: only the TOP (parent) fires events. The outer subflow's
    // spec (delivered on the mount event) contains the inner mount,
    // whose `subflowStructure` is the inner subflow's own spec.
    // walkSubflowSpecInto auto-recurses with composed paths
    // ('outer' → 'outer/inner').
    const innerRootSpec = spec("innerRoot", "InnerRoot");
    const innerNextSpec = spec("innerNext", "InnerNext");
    const innerMountSpec = {
      ...spec("innerMount", "InnerMount", {
        isSubflowRoot: true,
        subflowId: "inner",
        subflowStructure: innerRootSpec,
      }),
      next: innerNextSpec,
    };
    const outerRootSpec = { ...spec("outerRoot", "OuterRoot"), next: innerMountSpec };

    // ── Parent (top) fires its own stages + the outer mount event ──
    r.onStageAdded!({ stageId: "top", name: "Top", type: "stage", spec: spec("top", "Top") });
    r.onStageAdded!({
      stageId: "outerMount",
      name: "OuterMount",
      type: "stage",
      spec: spec("outerMount", "OuterMount", { isSubflowRoot: true, subflowId: "outer" }),
    });
    r.onEdgeAdded!({ from: "top", to: "outerMount", kind: "next" });
    r.onSubflowMounted!({
      subflowId: "outer",
      subflowName: "Outer",
      rootStageId: "outerMount",
      subflowSpec: outerRootSpec,
      subflowPath: "outer",
    });
    r.onStageAdded!({ stageId: "outerNext", name: "OuterNext", type: "stage", spec: spec("outerNext", "OuterNext") });
    r.onEdgeAdded!({ from: "outerMount", to: "outerNext", kind: "next" });

    const byId = new Map(t.getGraph().nodes.map((n) => [n.id, n.data]));
    // Parent-chain stages: subflowOf undefined.
    expect(byId.get("top")?.subflowOf).toBeUndefined();
    expect(byId.get("outerMount")?.subflowOf).toBeUndefined();
    expect(byId.get("outerNext")?.subflowOf).toBeUndefined();
    // Outer subflow internals tagged with 'outer'; ids path-qualified.
    expect(byId.get("outer/outerRoot")?.subflowOf).toBe("outer");
    expect(byId.get("outer/innerMount")?.subflowOf).toBe("outer");
    expect(byId.get("outer/innerNext")?.subflowOf).toBe("outer");
    // Inner subflow internals tagged with composed path 'outer/inner'.
    expect(byId.get("outer/inner/innerRoot")?.subflowOf).toBe("outer/inner");
  });

  it("reset() clears the subflow stack so a fresh re-build starts clean", () => {
    const t = createTraceStructureRecorder();
    fireSubflowChart(t);
    t.reset();
    // After reset, fire a flat chart — no nodes should be subflow-tagged
    const r = t.recorder;
    r.onStageAdded!({ stageId: "a", name: "A", type: "stage", spec: spec("a", "A") });
    r.onStageAdded!({ stageId: "b", name: "B", type: "stage", spec: spec("b", "B") });
    const all = t.getGraph().nodes;
    expect(all.every((n) => n.data.subflowOf === undefined)).toBe(true);
  });
});
