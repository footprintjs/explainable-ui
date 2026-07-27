/**
 * Per-execution durations — the Gantt's numbers.
 *
 * Two bugs pinned here, both of which made the timeline lie rather than
 * degrade:
 *
 * 1. **Timings were keyed by stage NAME and summed.** A loop that ran
 *    `Refine` three times at 10ms reported 30ms on ALL THREE rows — three
 *    fast passes rendered as three slow ones. The recorder's own data was
 *    already keyed by `runtimeStageId`, which is unique per execution.
 *    OLD BEHAVIOUR: `[30, 30, 30]`.
 * 2. **The timing recorder was found by `name === 'Metrics'`.** Renaming it,
 *    or shipping a custom one, dropped every duration and pushed the Gantt
 *    into its "no timing recorded" honest-degrade path — while the durations
 *    sat in the snapshot untouched. OLD BEHAVIOUR: all zeros.
 */
import { describe, it, expect } from "vitest";
import { toVisualizationSnapshots } from "../../src/adapters/fromRuntimeSnapshot";

function stage(id: string, name: string, runtimeStageId: string, next?: unknown) {
  return {
    id,
    name,
    runtimeStageId,
    logs: {},
    errors: {},
    metrics: {},
    evals: {},
    ...(next ? { next } : {}),
  };
}

/** Seed → Refine ×3 (a loop): same stage, three executions. */
const LOOP_TREE = stage(
  "seed",
  "Seed",
  "seed#0",
  stage("refine", "Refine", "refine#1", stage("refine", "Refine", "refine#2", stage("refine", "Refine", "refine#3"))),
);

function snapshotWithRecorder(recorder: Record<string, unknown>) {
  return {
    sharedState: {},
    commitLog: [],
    executionTree: LOOP_TREE,
    recorders: [recorder],
  } as unknown as Parameters<typeof toVisualizationSnapshots>[0];
}

const STEPS_10MS = {
  "seed#0": { stageName: "Seed", duration: 4, readCount: 0, writeCount: 1 },
  "refine#1": { stageName: "Refine", duration: 10, readCount: 1, writeCount: 1 },
  "refine#2": { stageName: "Refine", duration: 10, readCount: 1, writeCount: 1 },
  "refine#3": { stageName: "Refine", duration: 10, readCount: 1, writeCount: 1 },
};

// ── Unit ────────────────────────────────────────────────────────────────

describe("stage timings — one row, one execution", () => {
  it("gives each loop pass its own duration instead of the sum", () => {
    const snaps = toVisualizationSnapshots(
      snapshotWithRecorder({ id: "metrics-1", name: "Metrics", data: { steps: STEPS_10MS } }),
    );
    expect(snaps.map((s) => s.durationMs)).toEqual([4, 10, 10, 10]);
  });

  it("lays the rows out end to end, so the axis totals the real wall time", () => {
    const snaps = toVisualizationSnapshots(
      snapshotWithRecorder({ id: "metrics-1", name: "Metrics", data: { steps: STEPS_10MS } }),
    );
    expect(snaps.map((s) => s.startMs)).toEqual([0, 4, 14, 24]);
  });
});

// ── Integration — detection by shape ────────────────────────────────────

describe("stage timings — any recorder that publishes per-step durations", () => {
  it("reads a RENAMED timing recorder", () => {
    const snaps = toVisualizationSnapshots(
      snapshotWithRecorder({ id: "timing", name: "Timing", data: { steps: STEPS_10MS } }),
    );
    expect(snaps.map((s) => s.durationMs)).toEqual([4, 10, 10, 10]);
  });

  it("reads a custom recorder with its own name and extra fields", () => {
    const snaps = toVisualizationSnapshots(
      snapshotWithRecorder({
        id: "cost",
        name: "Latency & cost",
        data: {
          currency: "usd",
          steps: {
            "seed#0": { stageName: "Seed", duration: 7, usd: 0.01 },
            "refine#1": { stageName: "Refine", duration: 21, usd: 0.02 },
          },
        },
      }),
    );
    expect(snaps[0]!.durationMs).toBe(7);
    expect(snaps[1]!.durationMs).toBe(21);
  });

  it("still honours the legacy per-name aggregate shape", () => {
    const snaps = toVisualizationSnapshots(
      snapshotWithRecorder({
        id: "metrics-1",
        name: "Metrics",
        data: { stages: { Seed: { totalDuration: 5 }, Refine: { totalDuration: 30 } } },
      }),
    );
    // No per-execution key exists in this shape, so all three passes share
    // the aggregate — the honest reading of a snapshot that only aggregated.
    expect(snaps.map((s) => s.durationMs)).toEqual([5, 30, 30, 30]);
  });
});

// ── Boundary ────────────────────────────────────────────────────────────

describe("stage timings — what is NOT a timing recorder", () => {
  it("ignores a narrative recorder", () => {
    const snaps = toVisualizationSnapshots(
      snapshotWithRecorder({
        id: "narrative",
        name: "Narrative",
        data: [{ type: "stage", text: "Seeded.", depth: 0 }],
      }),
    );
    expect(snaps.every((s) => s.durationMs === 0)).toBe(true);
  });

  it("ignores a keyed recorder whose steps carry no duration", () => {
    const snaps = toVisualizationSnapshots(
      snapshotWithRecorder({
        id: "tokens",
        name: "Tokens",
        data: { steps: { "seed#0": { stageName: "Seed", tokensIn: 12, tokensOut: 30 } } },
      }),
    );
    expect(snaps.every((s) => s.durationMs === 0)).toBe(true);
  });

  it("ignores zero and negative durations rather than drawing a bar for them", () => {
    const snaps = toVisualizationSnapshots(
      snapshotWithRecorder({
        id: "metrics-1",
        name: "Metrics",
        data: { steps: { "seed#0": { stageName: "Seed", duration: 0 }, "refine#1": { stageName: "Refine", duration: -3 } } },
      }),
    );
    expect(snaps[0]!.durationMs).toBe(0);
    expect(snaps[1]!.durationMs).toBe(0);
  });

  it("survives a run recorded with no recorders at all", () => {
    const snaps = toVisualizationSnapshots({
      sharedState: {},
      commitLog: [],
      executionTree: LOOP_TREE,
    } as unknown as Parameters<typeof toVisualizationSnapshots>[0]);
    expect(snaps).toHaveLength(4);
    expect(snaps.every((s) => s.durationMs === 0)).toBe(true);
  });
});

// ── Scenario ────────────────────────────────────────────────────────────

describe("stage timings — a subflow's internals keep their own ids", () => {
  it("keys path-qualified executions separately from the parent's", () => {
    const tree = stage(
      "sf-enrich",
      "EnrichText",
      "sf-enrich#1",
      stage("normalize", "Normalize", "sf-enrich/normalize#2"),
    );
    const snaps = toVisualizationSnapshots({
      sharedState: {},
      commitLog: [],
      executionTree: tree,
      recorders: [
        {
          id: "metrics-1",
          name: "Metrics",
          data: {
            steps: {
              "sf-enrich#1": { stageName: "EnrichText", duration: 12 },
              "sf-enrich/normalize#2": { stageName: "Normalize", duration: 3 },
            },
          },
        },
      ],
    } as unknown as Parameters<typeof toVisualizationSnapshots>[0]);
    expect(snaps.map((s) => s.durationMs)).toEqual([12, 3]);
  });
});
