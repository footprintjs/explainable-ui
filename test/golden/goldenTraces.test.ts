/**
 * U2 — Golden-trace pipeline tests.
 *
 * Each fixture under `test/fixtures/golden/` is a REAL footprintjs run,
 * recorded by `scripts/generate-golden-fixtures.mjs`: the raw
 * StructureRecorder / FlowRecorder / ScopeRecorder event streams plus the
 * post-run snapshot + narrative entries — the exact duck-typed artifacts
 * explainable-ui consumes. These tests replay them through the full
 * converter/layout/narrative pipeline and pin the OUTPUT via file
 * snapshots in `test/golden/__snapshots__/`.
 *
 * Why: the unit suite fabricates engine events by hand ("we simulate by
 * calling the recorder methods directly"), so engine-shape drift between
 * footprintjs releases would pass unit tests and break rendering silently.
 * The goldens close that gap — they are the contract corpus against the
 * real engine.
 *
 * Workflow on an INTENTIONAL change
 * ─────────────────────────────────
 *   1. Engine-side shape change (new footprintjs):
 *        npm i -D --save-exact footprintjs@<version>
 *        npm run fixtures:regen          # re-records fixtures, fails on nondeterminism
 *   2. Pipeline-side output change (eui converter/layout edit):
 *        npx vitest run test/golden -u   # updates the output snapshots
 *   3. REVIEW the snapshot diff before committing — an unexpected diff here
 *      is exactly the regression this suite exists to catch.
 *
 * Real-engine decider spelling these goldens exercise: footprintjs fires
 * `onStageAdded` with `type: "stage"` for decider/selector stages and stamps
 * `hasDecider: true` / `hasSelector: true` on the spec instead. The
 * converter derives `TraceNodeData.isDecider` from BOTH spellings (and from
 * `onDeciderComplete`'s sealed branch list), so real traces and hand-built
 * `type: 'decider'` fixtures render decision nodes identically.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import {
  createTraceStructureRecorder,
  type TraceGraph,
} from "../../src/components/FlowchartView/traceStructureRecorder";
import { createTraceRuntimeOverlay } from "../../src/components/FlowchartView/createTraceRuntimeOverlay";
import { createNodeViewRecorder } from "../../src/components/FlowchartView/createNodeViewRecorder";
import { createCommitFlowRecorder } from "../../src/components/FlowchartView/createCommitFlowRecorder";
import { dagreTraceLayout } from "../../src/components/FlowchartView/_internal/dagreTraceLayout";
import { toVisualizationSnapshots, type NarrativeEntry } from "../../src/adapters/fromRuntimeSnapshot";
import { overlayFromSnapshot } from "../../src/adapters/overlayFromSnapshot";
import {
  buildEntryRangeIndex,
  computeRevealedEntryCount,
  extractSubflowNarrative,
} from "../../src/utils/narrativeSync";

// ─────────────────────────────────────────────────────────────────────────────
// Fixture loading (manifest-driven — new fixtures are picked up automatically)
// ─────────────────────────────────────────────────────────────────────────────

interface RecordedEvent {
  channel?: "flow" | "scope";
  method: string;
  event: Record<string, unknown>;
}

interface GoldenFixture {
  name: string;
  description: string;
  structureEvents: RecordedEvent[];
  runtimeEvents: RecordedEvent[];
  narrativeEntries: NarrativeEntry[];
  snapshot: Parameters<typeof toVisualizationSnapshots>[0];
}

const FIXTURE_DIR = new URL("../fixtures/golden/", import.meta.url);

const manifest = JSON.parse(readFileSync(new URL("manifest.json", FIXTURE_DIR), "utf8")) as {
  footprintjs: string;
  fixtures: { file: string; name: string }[];
};

const fixtures: GoldenFixture[] = manifest.fixtures.map(
  (f) => JSON.parse(readFileSync(new URL(f.file, FIXTURE_DIR), "utf8")) as GoldenFixture,
);

const byName = (name: string): GoldenFixture => {
  const fx = fixtures.find((f) => f.name === name);
  if (!fx) throw new Error(`golden fixture '${name}' missing — run \`npm run fixtures:regen\``);
  return fx;
};

// ─────────────────────────────────────────────────────────────────────────────
// Replay + serialization helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Replay recorded events into recorders, dispatching by method name.
 *  Order is the engine's real fire order (e.g. Scope.onCommit BEFORE
 *  Flow.onStageExecuted — the L8.0 invariant the translators rely on). */
function replay(events: RecordedEvent[], ...recorders: Record<string, unknown>[]): void {
  for (const { method, event } of events) {
    for (const r of recorders) {
      const handler = r[method];
      if (typeof handler === "function") handler.call(r, event);
    }
  }
}

function buildGraph(fx: GoldenFixture): TraceGraph {
  const structure = createTraceStructureRecorder();
  replay(fx.structureEvents, structure.recorder as unknown as Record<string, unknown>);
  return structure.getGraph();
}

/** Convert Maps/Sets to plain JSON-able values for stable snapshots. */
function jsonable(value: unknown): unknown {
  if (value instanceof Map) {
    return Object.fromEntries([...value.entries()].map(([k, v]) => [String(k), jsonable(v)]));
  }
  if (value instanceof Set) return [...value].map(jsonable);
  if (Array.isArray(value)) return value.map(jsonable);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, jsonable(v)]));
  }
  return value;
}

const stringify = (value: unknown): string => JSON.stringify(jsonable(value), null, 2) + "\n";

const snapshotPath = (fixture: string, aspect: string): string =>
  `__snapshots__/${fixture}.${aspect}.json`;

// ─────────────────────────────────────────────────────────────────────────────
// Pipeline goldens — one block per fixture, one snapshot per pipeline output
// ─────────────────────────────────────────────────────────────────────────────

for (const fx of fixtures) {
  describe(`golden: ${fx.name}`, () => {
    it("structure events → TraceGraph (nodes + edges)", async () => {
      await expect(stringify(buildGraph(fx))).toMatchFileSnapshot(
        snapshotPath(fx.name, "structure-graph"),
      );
    });

    it("TraceGraph → dagreTraceLayout positions (TraceFlow default layout)", async () => {
      const positioned = dagreTraceLayout(buildGraph(fx));
      const positions = positioned.nodes.map((n) => ({
        id: n.id,
        x: Math.round(n.position.x),
        y: Math.round(n.position.y),
      }));
      await expect(stringify(positions)).toMatchFileSnapshot(snapshotPath(fx.name, "layout"));
    });

    it("flow events → runtime overlay (execution order, errors, running)", async () => {
      const overlay = createTraceRuntimeOverlay();
      replay(fx.runtimeEvents, overlay.recorder as unknown as Record<string, unknown>);
      const { executionOrder, errors, running } = overlay.getOverlay();
      const out = {
        // timestampMs is stamped at replay time (wall clock) — excluded.
        executionOrder: executionOrder.map(({ timestampMs: _t, ...rest }) => rest),
        errors,
        running,
      };
      await expect(stringify(out)).toMatchFileSnapshot(snapshotPath(fx.name, "overlay"));
    });

    it("snapshot alone → runtime overlay (post-hoc, no live recorder)", async () => {
      const overlay = overlayFromSnapshot(fx.snapshot);
      const out = {
        // timestampMs is 0 by construction (commit bundles carry no clock).
        executionOrder: overlay.executionOrder.map(({ timestampMs: _t, ...rest }) => rest),
        errors: overlay.errors,
        running: overlay.running,
      };
      await expect(stringify(out)).toMatchFileSnapshot(
        snapshotPath(fx.name, "overlay-from-snapshot"),
      );
    });

    it("flow+scope events → NodeView index", async () => {
      const structure = createTraceStructureRecorder();
      replay(fx.structureEvents, structure.recorder as unknown as Record<string, unknown>);
      const nodeView = createNodeViewRecorder({ structure });
      replay(fx.runtimeEvents, nodeView.recorder as unknown as Record<string, unknown>);
      const index = nodeView.getIndex();
      const out = {
        all: index.all,
        byStageIdKeys: [...index.byStageId.keys()],
        byRuntimeStageIdKeys: [...index.byRuntimeStageId.keys()],
      };
      await expect(stringify(out)).toMatchFileSnapshot(snapshotPath(fx.name, "node-views"));
    });

    it("flow+scope events → CommitFlow index (commits + data lineage)", async () => {
      const structure = createTraceStructureRecorder();
      replay(fx.structureEvents, structure.recorder as unknown as Record<string, unknown>);
      const commitFlow = createCommitFlowRecorder({ structure });
      replay(fx.runtimeEvents, commitFlow.recorder as unknown as Record<string, unknown>);
      const index = commitFlow.getIndex();
      const out = {
        commits: index.commits,
        dataEdges: index.dataEdges,
        byRuntimeStageIdKeys: [...index.byRuntimeStageId.keys()],
      };
      await expect(stringify(out)).toMatchFileSnapshot(snapshotPath(fx.name, "commit-flow"));
    });

    it("snapshot + narrative → visualization StageSnapshots (adapter)", async () => {
      const snaps = toVisualizationSnapshots(fx.snapshot, fx.narrativeEntries);
      await expect(stringify(snaps)).toMatchFileSnapshot(snapshotPath(fx.name, "stage-snapshots"));
    });

    it("narrative entries → range index + revealed counts (narrativeSync)", async () => {
      const rangeIndex = buildEntryRangeIndex(fx.narrativeEntries);
      const snaps = toVisualizationSnapshots(fx.snapshot, fx.narrativeEntries);
      const indexed = snaps.map((_, i) =>
        computeRevealedEntryCount(fx.narrativeEntries, snaps, i, rangeIndex),
      );
      const scanned = snaps.map((_, i) => computeRevealedEntryCount(fx.narrativeEntries, snaps, i));
      const out = { rangeIndex, revealedWithIndex: indexed, revealedWithoutIndex: scanned };
      await expect(stringify(out)).toMatchFileSnapshot(snapshotPath(fx.name, "narrative-sync"));
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Cross-fixture semantic invariants — explicit guards beyond opaque snapshots
// ─────────────────────────────────────────────────────────────────────────────

describe("golden: semantic invariants", () => {
  it("manifest pins the footprintjs version the fixtures were recorded with", () => {
    expect(manifest.footprintjs).toMatch(/^\d+\.\d+\.\d+/);
    expect(fixtures.length).toBeGreaterThanOrEqual(4);
  });

  it("linear-decider: real decider node is a decision node (isDecider + sealed branchIds)", () => {
    const graph = buildGraph(byName("linear-decider"));
    const decider = graph.nodes.find((n) => n.id === "classify-risk");
    expect(decider?.data.branchIds).toEqual(["approve", "review", "reject"]);
    expect(decider?.data.defaultBranch).toBe("reject");
    // Real engine fires onStageAdded with type 'stage' + spec.hasDecider —
    // the converter derives isDecider from that flag (and from the sealed
    // branch list), so real traces render the decision diamond.
    expect(decider?.data.isDecider).toBe(true);
    // Non-decider stages stay plain.
    const linear = graph.nodes.find((n) => n.id === "enrich");
    expect(linear?.data.isDecider).toBe(false);
  });

  it("parallel-fork: real selector node (spec.hasSelector) is a decision node too", () => {
    const graph = buildGraph(byName("parallel-fork"));
    const selector = graph.nodes.find((n) => n.id === "screen");
    expect(selector?.data.isDecider).toBe(true);
    expect(selector?.data.branchIds).toEqual(["diabetes", "hypertension", "obesity"]);
  });

  it("linear-decider: cumulative memory at the deep-write stage retains sibling fields", () => {
    const fx = byName("linear-decider");
    const snaps = toVisualizationSnapshots(fx.snapshot, fx.narrativeEntries);
    // 'enrich' sets the full applicant, then deep-writes applicant.address.zip.
    // The commit bundle is replayed (set full object, then merge the patch),
    // so the sibling field survives alongside the updated leaf — matching
    // the engine's sharedState instead of the collapsed stageWrites patch.
    const enrich = snaps.find((s) => s.stageLabel === "enrich");
    expect(enrich?.memory.applicant).toEqual({ name: "Ada", address: { zip: "94016" } });
    // ...and the merged object persists through later stages' cumulative views.
    const approve = snaps.find((s) => s.stageLabel === "approve");
    expect(approve?.memory.applicant).toEqual({ name: "Ada", address: { zip: "94016" } });
  });

  it("parallel-fork: branch memory mirrors the engine's namespaced fork-child state", () => {
    const fx = byName("parallel-fork");
    const snaps = toVisualizationSnapshots(fx.snapshot, fx.narrativeEntries);
    // The engine commits fork-child writes under runs.<branchId> (visible in
    // the fixture's final sharedState); commit replay shows that truthfully
    // instead of fabricating a top-level key the engine never held.
    const hyp = snaps.find((s) => s.stageLabel === "hypertension");
    expect(hyp?.memory.runs).toEqual({ hypertension: { hypertensionRisk: "high" } });
    expect(hyp?.memory).not.toHaveProperty("hypertensionRisk");
  });

  it("subflow-loop: loop edge present and loop re-executes stages (executionIndex bumps)", () => {
    const fx = byName("subflow-loop");
    const graph = buildGraph(fx);
    expect(graph.edges.some((e) => e.data?.kind === "loop")).toBe(true);

    const overlay = createTraceRuntimeOverlay();
    replay(fx.runtimeEvents, overlay.recorder as unknown as Record<string, unknown>);
    const refineSteps = overlay
      .getOverlay()
      .executionOrder.filter((s) => s.stageId === "refine");
    expect(refineSteps.length).toBe(2);
    expect(new Set(refineSteps.map((s) => s.runtimeStageId)).size).toBe(2);
  });

  it("subflow-loop: subflow internals walked from subflowSpec (path-qualified ids)", () => {
    const graph = buildGraph(byName("subflow-loop"));
    const ids = graph.nodes.map((n) => n.id);
    expect(ids).toContain("sf-enrich/normalize");
    expect(ids).toContain("sf-enrich/score");
    const narrative = extractSubflowNarrative(byName("subflow-loop").narrativeEntries, "sf-enrich");
    expect(narrative.length).toBeGreaterThan(0);
  });

  it("parallel-fork: both selected branches committed; unselected branch did not", () => {
    const fx = byName("parallel-fork");
    const structure = createTraceStructureRecorder();
    replay(fx.structureEvents, structure.recorder as unknown as Record<string, unknown>);
    const commitFlow = createCommitFlowRecorder({ structure });
    replay(fx.runtimeEvents, commitFlow.recorder as unknown as Record<string, unknown>);
    const committedStageIds = new Set(commitFlow.getIndex().commits.map((c) => c.stageId));
    expect(committedStageIds.has("hypertension")).toBe(true);
    expect(committedStageIds.has("obesity")).toBe(true);
    expect(committedStageIds.has("diabetes")).toBe(false); // glucose 96 ≤ 100
    expect(committedStageIds.has("summarize")).toBe(true); // convergence ran
  });

  // ── Post-hoc overlay (replaying a recording) ─────────────────────────────
  //
  // A saved snapshot has no live recorder, so `overlayFromSnapshot` rebuilds
  // the overlay from `snapshot.commitLog`. What must hold is ALIGNMENT WITH
  // THE RAIL: the shell translates its cursor by looking up
  // `snapshots[selectedIndex].runtimeStageId` inside `overlay.executionOrder`
  // (ExplainableShell.tsx), so one overlay step per rail step, same order, is
  // exactly the property that makes a replayed chart scrub correctly.

  it("every fixture: the derived overlay lines up with the rail, step for step", () => {
    for (const fx of fixtures) {
      const rail = toVisualizationSnapshots(fx.snapshot, fx.narrativeEntries);
      const overlay = overlayFromSnapshot(fx.snapshot);
      expect(
        overlay.executionOrder.map((s) => s.runtimeStageId),
        `fixture ${fx.name}`,
      ).toEqual(rail.map((s) => s.runtimeStageId));
    }
  });

  it("flat runs: the derived overlay IS the live recorder's overlay", () => {
    // No pause, no subflows — the two paths see the same set of executions,
    // so the post-hoc rebuild is byte-equal to what the live run recorded.
    for (const name of ["linear-decider", "parallel-fork"]) {
      const fx = byName(name);
      const live = createTraceRuntimeOverlay();
      replay(fx.runtimeEvents, live.recorder as unknown as Record<string, unknown>);
      const strip = (steps: readonly { timestampMs: number }[]) =>
        steps.map(({ timestampMs: _t, ...rest }) => rest);
      expect(strip(overlayFromSnapshot(fx.snapshot).executionOrder), `fixture ${name}`).toEqual(
        strip(live.getOverlay().executionOrder),
      );
    }
  });

  it("pause-resume: the derived overlay ALSO holds the pre-pause execution", () => {
    // The stage that paused had already committed its writes (footprintjs
    // commits before the pause unwinds), so the commit log carries
    // approval#1 as well as the post-resume approval#2. The live recorder
    // only ever saw #2 complete. The rail shows both — so the derived
    // overlay showing both is what keeps the two in step.
    const fx = byName("pause-resume");
    const derived = overlayFromSnapshot(fx.snapshot).executionOrder.map((s) => s.runtimeStageId);
    const live = createTraceRuntimeOverlay();
    replay(fx.runtimeEvents, live.recorder as unknown as Record<string, unknown>);
    const liveIds = live.getOverlay().executionOrder.map((s) => s.runtimeStageId);
    expect(derived).toContain("approval#1");
    expect(liveIds).not.toContain("approval#1");
    // Superset, not a different story: everything the live run recorded is
    // still there, in the same order.
    expect(derived.filter((id) => liveIds.includes(id))).toEqual(liveIds);
  });

  it("subflow-loop: the derived overlay stops at mounts (engine isolates subflow commits)", () => {
    // Deep-subflow commits never reach the run-level commitLog by design, so
    // a recording can light the MOUNT node but not the stages inside it —
    // the same stages the snapshot's own rail shows. Documented, not hidden:
    // a live overlay sees the internals, a replayed one honestly cannot.
    const fx = byName("subflow-loop");
    const derived = overlayFromSnapshot(fx.snapshot).executionOrder.map((s) => s.stageId);
    expect(derived).toContain("sf-enrich");
    expect(derived).not.toContain("sf-enrich/normalize");
    const live = createTraceRuntimeOverlay();
    replay(fx.runtimeEvents, live.recorder as unknown as Record<string, unknown>);
    expect(live.getOverlay().executionOrder.map((s) => s.stageId)).toContain("sf-enrich/normalize");
  });

  it("pause-resume: narrative spans the pause boundary; resume starts a fresh runId", () => {
    const fx = byName("pause-resume");
    const types = fx.narrativeEntries.map((e) => e.type);
    expect(types).toContain("pause");
    expect(types).toContain("resume");

    const runIds = new Set(
      fx.runtimeEvents
        .map((e) => (e.event as { traversalContext?: { runId?: string } }).traversalContext?.runId)
        .filter((id): id is string => typeof id === "string"),
    );
    expect(runIds).toEqual(new Set(["run-1", "run-2"]));
  });
});
