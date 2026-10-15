/**
 * Retry attempts on the runtime overlay — the chart's source of truth for
 * "this stage was tried more than once".
 *
 * Before 0.37.0 the three Minimal*Recorder mirrors omitted `onStageRetry`, so
 * a retried stage was visible in the STORY and invisible on the CHART. These
 * tests pin the fact the chart now paints from, on both paths:
 *
 *   live    — `createTraceRuntimeOverlay().recorder.onStageRetry`
 *   replay  — `overlayFromSnapshot(snapshot)`: each node's `attemptSummary`
 *             (footprintjs >= 10.1), or `{ narrativeEntries }`' `retry`
 *             entries for a 9.15–10.0 recording
 *
 * The engine's law these rest on (footprintjs >= 9.15.0): every attempt of a
 * stage runs under ONE runtimeStageId and produces ONE commit bundle, and
 * `onStageRetry` fires only for an attempt that FAILED and was followed by
 * another. So N retry events prove N+1 attempts, and a retried stage is still
 * exactly one stop on the time-travel rail.
 *
 * Test types (Convention 3): unit, functional, property, regression,
 * boundary/negative. Security and load do not apply to a pure counter.
 */

import { describe, it, expect } from "vitest";
import {
  createTraceRuntimeOverlay,
  sliceOverlay,
} from "../../src/components/FlowchartView/createTraceRuntimeOverlay";
import { overlayFromSnapshot } from "../../src/adapters/overlayFromSnapshot";

const tc = (rsid: string) => ({ runtimeStageId: rsid, runId: "run-1" });

/** One `onStageRetry` payload as footprintjs 9.15.x shapes it. */
const retryEvent = (rsid: string, attempt: number, maxAttempts = 3) => ({
  stageName: "FetchQuote",
  stageId: rsid.split("#")[0]!,
  attempt,
  maxAttempts,
  delayMs: 0,
  message: "quote service unavailable (503)",
  traversalContext: tc(rsid),
});

/** A `retry` narrative entry as footprintjs writes it. */
const retryEntry = (rsid: string) => ({
  type: "retry" as const,
  text: "[Retry]: attempt 1 of 3 at FetchQuote failed (…).",
  depth: 1,
  runtimeStageId: rsid,
});

const bundle = (idx: number, rsid: string, stage: string) => ({
  idx,
  runtimeStageId: rsid,
  stage,
  overwrite: {},
  updates: {},
});

// ─────────────────────────────────────────────────────────────────────────────
// Live recorder
// ─────────────────────────────────────────────────────────────────────────────

describe("createTraceRuntimeOverlay — onStageRetry", () => {
  it("unit: two failed attempts followed by a success = 3 attempts made", () => {
    const h = createTraceRuntimeOverlay();
    h.recorder.onStageRetry!(retryEvent("fetch-quote#0", 1));
    h.recorder.onStageRetry!(retryEvent("fetch-quote#0", 2));
    h.recorder.onStageExecuted!({
      stageName: "FetchQuote",
      stageType: "linear",
      traversalContext: tc("fetch-quote#0"),
    });
    expect(h.getOverlay().retryAttempts?.get("fetch-quote#0")).toBe(3);
  });

  it("unit: a stage that never retried has NO entry (1 attempt is the silent default)", () => {
    const h = createTraceRuntimeOverlay();
    h.recorder.onStageExecuted!({
      stageName: "Settle",
      stageType: "linear",
      traversalContext: tc("settle#1"),
    });
    expect(h.getOverlay().retryAttempts?.has("settle#1")).toBe(false);
    expect(h.getOverlay().retryAttempts?.size).toBe(0);
  });

  it("regression: retries do NOT add stops to the rail — one execution step, still", () => {
    // The engine runs every attempt under one runtimeStageId. If the overlay
    // ever pushed a step per attempt, time travel would gain two phantom
    // positions with no commit behind them.
    const h = createTraceRuntimeOverlay();
    h.recorder.onStageRetry!(retryEvent("fetch-quote#0", 1));
    h.recorder.onStageRetry!(retryEvent("fetch-quote#0", 2));
    h.recorder.onStageExecuted!({
      stageName: "FetchQuote",
      stageType: "linear",
      traversalContext: tc("fetch-quote#0"),
    });
    expect(h.getOverlay().executionOrder).toHaveLength(1);
  });

  it("functional: the attempt count survives seed() and clears on reset()", () => {
    const h = createTraceRuntimeOverlay();
    h.recorder.onStageRetry!(retryEvent("fetch-quote#0", 2));
    const captured = h.getOverlay();
    expect(captured.retryAttempts?.get("fetch-quote#0")).toBe(3);

    h.reset();
    expect(h.getOverlay().retryAttempts?.size).toBe(0);

    h.seed(captured);
    expect(h.getOverlay().retryAttempts?.get("fetch-quote#0")).toBe(3);
  });

  it("property: the count is monotonic — replaying earlier events cannot lower it", () => {
    const h = createTraceRuntimeOverlay();
    for (const attempt of [1, 2, 3, 1, 2]) {
      h.recorder.onStageRetry!(retryEvent("flaky#0", attempt, 4));
    }
    expect(h.getOverlay().retryAttempts?.get("flaky#0")).toBe(4);
  });

  it("boundary: an event with no runtimeStageId is dropped, not attributed to a guess", () => {
    const h = createTraceRuntimeOverlay();
    h.recorder.onStageRetry!({
      stageName: "FetchQuote",
      stageId: "fetch-quote",
      attempt: 1,
      maxAttempts: 3,
      delayMs: 0,
      message: "boom",
    });
    expect(h.getOverlay().retryAttempts?.size).toBe(0);
  });

  it("boundary: a missing `attempt` number falls back to counting the events", () => {
    // A hand-built or future event shape must still produce the right total,
    // because the count of retry events IS the count of failed attempts.
    const h = createTraceRuntimeOverlay();
    const noAttempt = { stageName: "FetchQuote", traversalContext: tc("fetch-quote#0") };
    h.recorder.onStageRetry!(noAttempt);
    h.recorder.onStageRetry!(noAttempt);
    expect(h.getOverlay().retryAttempts?.get("fetch-quote#0")).toBe(3);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Slice projection (runtimeStageId → the chart's base stage ids)
// ─────────────────────────────────────────────────────────────────────────────

describe("sliceOverlay — attempts projected onto chart nodes", () => {
  const overlayWith = (retryAttempts: Map<string, number>, steps: [string, string][]) => ({
    executionOrder: steps.map(([rsid, stageId], i) => ({
      runtimeStageId: rsid,
      stageId,
      stageName: stageId,
      timestampMs: i,
    })),
    errors: new Map<string, string>(),
    running: false,
    retryAttempts,
  });

  it("unit: the retried stage's node id carries the count", () => {
    const overlay = overlayWith(new Map([["fetch-quote#0", 3]]), [
      ["fetch-quote#0", "fetch-quote"],
      ["settle#1", "settle"],
    ]);
    const slice = sliceOverlay(overlay, 1);
    expect(slice.retryAttempts.get("fetch-quote")).toBe(3);
    expect(slice.retryAttempts.has("settle")).toBe(false);
  });

  it("functional: the count appears at the retried stage's OWN cursor, not before it", () => {
    // Scrubbed to step 0 (`seed`), the retried stage two steps later has not
    // happened yet — a chart that already showed its badge would be telling
    // the future.
    const overlay = overlayWith(new Map([["fetch-quote#1", 3]]), [
      ["seed#0", "seed"],
      ["fetch-quote#1", "fetch-quote"],
    ]);
    expect(sliceOverlay(overlay, 0).retryAttempts.has("fetch-quote")).toBe(false);
    expect(sliceOverlay(overlay, 1).retryAttempts.get("fetch-quote")).toBe(3);
  });

  it("functional: a loop's LATEST execution of a stage wins (matches `errors`)", () => {
    const overlay = overlayWith(
      new Map([
        ["refine#1", 2],
        ["refine#3", 4],
      ]),
      [
        ["refine#1", "refine"],
        ["check#2", "check"],
        ["refine#3", "refine"],
      ],
    );
    expect(sliceOverlay(overlay, 0).retryAttempts.get("refine")).toBe(2);
    expect(sliceOverlay(overlay, 2).retryAttempts.get("refine")).toBe(4);
  });

  it("regression: a stage that EXHAUSTED its policy still gets a count", () => {
    // It threw on its final attempt, so `onStageExecuted` never fired and it
    // has no execution step to be reached. Without the no-step fallback the
    // one node whose retries all failed would be the only retried node with
    // no badge — precisely backwards.
    const overlay = overlayWith(new Map([["fetch-quote#1", 3]]), [["seed#0", "seed"]]);
    expect(sliceOverlay(overlay, 0).retryAttempts.get("fetch-quote")).toBe(3);
  });

  it("boundary: an overlay with no attempt facts slices to an empty map, never undefined", () => {
    const overlay = {
      executionOrder: [],
      errors: new Map<string, string>(),
      running: false,
    };
    expect(sliceOverlay(overlay, 0).retryAttempts.size).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Post-hoc twin + live↔replay equivalence
// ─────────────────────────────────────────────────────────────────────────────

describe("overlayFromSnapshot — attempts rebuilt from the narrative", () => {
  it("unit: N retry entries mean N+1 attempts", () => {
    const overlay = overlayFromSnapshot(
      { commitLog: [bundle(0, "fetch-quote#0", "FetchQuote")] },
      { narrativeEntries: [retryEntry("fetch-quote#0"), retryEntry("fetch-quote#0")] },
    );
    expect(overlay.retryAttempts?.get("fetch-quote#0")).toBe(3);
  });

  it("boundary: no narrative = honest absence, not a fabricated 1", () => {
    // The commit log genuinely cannot know: a failed attempt commits nothing.
    const overlay = overlayFromSnapshot({ commitLog: [bundle(0, "fetch-quote#0", "FetchQuote")] });
    expect(overlay.retryAttempts?.size).toBe(0);
  });

  it("boundary: non-retry entries and malformed entries are ignored", () => {
    const overlay = overlayFromSnapshot(
      { commitLog: [bundle(0, "fetch-quote#0", "FetchQuote")] },
      {
        narrativeEntries: [
          { type: "stage", runtimeStageId: "fetch-quote#0" },
          { type: "retry" }, // no runtimeStageId — cannot be attributed
          null as unknown as { type: string },
          retryEntry("fetch-quote#0"),
        ],
      },
    );
    expect(overlay.retryAttempts?.get("fetch-quote#0")).toBe(2);
  });

  it("EQUIVALENCE: the live recorder and the post-hoc rebuild agree, fact for fact", () => {
    // The chart must tell the same story whether it is watching a run or
    // replaying a recording — the house rule for every overlay fact.
    const live = createTraceRuntimeOverlay();
    live.recorder.onStageRetry!(retryEvent("fetch-quote#0", 1));
    live.recorder.onStageRetry!(retryEvent("fetch-quote#0", 2));
    live.recorder.onStageExecuted!({
      stageName: "FetchQuote",
      stageType: "linear",
      traversalContext: tc("fetch-quote#0"),
    });
    live.recorder.onStageExecuted!({
      stageName: "Settle",
      stageType: "linear",
      traversalContext: tc("settle#1"),
    });

    const replayed = overlayFromSnapshot(
      {
        commitLog: [
          bundle(0, "fetch-quote#0", "FetchQuote"),
          bundle(1, "settle#1", "Settle"),
        ],
      },
      { narrativeEntries: [retryEntry("fetch-quote#0"), retryEntry("fetch-quote#0")] },
    );

    expect([...(replayed.retryAttempts ?? [])]).toEqual([...(live.getOverlay().retryAttempts ?? [])]);
    // ...and the projection the chart actually reads matches too.
    expect([...sliceOverlay(replayed, 1).retryAttempts]).toEqual([
      ...sliceOverlay(live.getOverlay(), 1).retryAttempts,
    ]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Post-hoc, footprintjs >= 10.1: the count the engine stamped on the tree
// ─────────────────────────────────────────────────────────────────────────────

/** An execution-tree node as footprintjs 10.1 shapes it, carrying a finished series' summary. */
const retriedNode = (id: string, rsid: string, count: number, extra: Record<string, unknown> = {}) => ({
  id,
  runtimeStageId: rsid,
  attemptSummary: {
    count,
    ok: 1,
    failed: count - 1,
    timeout: 0,
    aborted: 0,
    paused: 0,
    last: { next: "done", reason: "succeeded" },
  },
  ...extra,
});

describe("overlayFromSnapshot — attempts read from attemptSummary (footprintjs >= 10.1)", () => {
  it("unit: a retried node's stamped count is the attempt count — no narrative needed", () => {
    // 10.1 narrates `attempt` lines, never `retry`, so counting `retry`
    // entries would read zero; the tree has the number.
    const overlay = overlayFromSnapshot({
      commitLog: [bundle(0, "seed#0", "Seed"), bundle(1, "fetch-quote#1", "FetchQuote")],
      executionTree: { id: "seed", runtimeStageId: "seed#0", next: retriedNode("fetch-quote", "fetch-quote#1", 3) },
    });
    expect([...(overlay.retryAttempts ?? [])]).toEqual([["fetch-quote#1", 3]]);
    expect(sliceOverlay(overlay, 1).retryAttempts.get("fetch-quote")).toBe(3);
  });

  it("unit: a policy stage that succeeded first time (count 1) has no entry", () => {
    const overlay = overlayFromSnapshot({
      commitLog: [bundle(0, "settle#0", "Settle")],
      executionTree: retriedNode("settle", "settle#0", 1),
    });
    expect(overlay.retryAttempts?.size).toBe(0);
  });

  it("functional: fork children and subflow stages are counted under their own runtimeStageIds", () => {
    const overlay = overlayFromSnapshot({
      commitLog: [bundle(0, "seed#0", "Seed")],
      executionTree: {
        id: "seed",
        runtimeStageId: "seed#0",
        children: [retriedNode("a", "a#1", 2), { id: "b", runtimeStageId: "b#2" }],
      },
      subflowResults: {
        // dual-keyed, as footprintjs serves it: the same result under two keys
        "sf#3": { treeContext: { stageContexts: retriedNode("sf/inner", "sf/inner#4", 4) } },
        sf: { treeContext: { stageContexts: retriedNode("sf/inner", "sf/inner#4", 4) } },
      },
    });
    expect(Object.fromEntries(overlay.retryAttempts ?? [])).toEqual({ "a#1": 2, "sf/inner#4": 4 });
  });

  it("precedence: the tree's count wins; `retry` entries fill a stage the tree does not summarise", () => {
    // Older source: a 9.15–10.0 recording's narrative. Where both speak, the
    // stamped number is the record's — a narrative a formatter thinned out
    // must not lower it.
    const overlay = overlayFromSnapshot(
      {
        commitLog: [bundle(0, "fetch-quote#0", "FetchQuote"), bundle(1, "settle#1", "Settle")],
        executionTree: retriedNode("fetch-quote", "fetch-quote#0", 3, { next: { id: "settle", runtimeStageId: "settle#1" } }),
      },
      { narrativeEntries: [retryEntry("fetch-quote#0"), retryEntry("settle#1")] },
    );
    expect(overlay.retryAttempts?.get("fetch-quote#0")).toBe(3);
    expect(overlay.retryAttempts?.get("settle#1")).toBe(2);
  });

  it("regression: a 9.15–10.0 recording (no summary) still counts its `retry` entries", () => {
    const overlay = overlayFromSnapshot(
      {
        commitLog: [bundle(0, "fetch-quote#0", "FetchQuote")],
        executionTree: { id: "fetch-quote", runtimeStageId: "fetch-quote#0" },
      },
      { narrativeEntries: [retryEntry("fetch-quote#0"), retryEntry("fetch-quote#0")] },
    );
    expect(overlay.retryAttempts?.get("fetch-quote#0")).toBe(3);
  });

  it("regression: a subflow looped twice — its LATEST execution's count shows, as live and narrative do", () => {
    // The inner stage runs once per mount, under one id with two execution
    // indexes. It has no step on the replayed rail (subflow internals stay in
    // the subflow's own log), so the slice takes the LATER map entry for its
    // node — the map must be in execution order, whatever order the trees
    // are walked in.
    const overlay = overlayFromSnapshot({
      commitLog: [bundle(0, "seed#0", "Seed"), bundle(1, "sf#3", "Sub"), bundle(2, "sf#8", "Sub")],
      executionTree: { id: "seed", runtimeStageId: "seed#0" },
      subflowResults: {
        "sf#3": { treeContext: { stageContexts: retriedNode("sf/inner", "sf/inner#4", 2) } },
        "sf#8": { treeContext: { stageContexts: retriedNode("sf/inner", "sf/inner#9", 3) } },
      },
    });
    expect([...(overlay.retryAttempts ?? []).keys()]).toEqual(["sf/inner#4", "sf/inner#9"]);
    expect(sliceOverlay(overlay, 2).retryAttempts.get("sf/inner")).toBe(3);
  });

  it("boundary: malformed summaries and nodes are ignored, never guessed", () => {
    const overlay = overlayFromSnapshot({
      commitLog: [],
      executionTree: {
        id: "root",
        runtimeStageId: "root#0",
        attemptSummary: { count: "3" },
        children: [
          { id: "nan", runtimeStageId: "nan#1", attemptSummary: { count: Number.NaN } },
          { id: "frac", runtimeStageId: "frac#2", attemptSummary: { count: 2.5 } },
          { id: "no-id", attemptSummary: { count: 3 } },
          { id: "null-summary", runtimeStageId: "null#3", attemptSummary: null },
          null,
          "not a node",
        ],
      },
      subflowResults: { broken: null, alsoBroken: { treeContext: "x" } },
    });
    expect(overlay.retryAttempts?.size).toBe(0);
  });

  it("boundary: a hand-built tree with a cycle is walked once, not forever", () => {
    const node: Record<string, unknown> = retriedNode("loop", "loop#0", 2);
    node.next = node;
    node.children = [node];
    const overlay = overlayFromSnapshot({ commitLog: [], executionTree: node });
    expect(overlay.retryAttempts?.get("loop#0")).toBe(2);
  });
});
