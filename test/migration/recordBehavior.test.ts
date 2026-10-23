import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import {
  mergeWritePatch,
  toVisualizationSnapshots,
} from "../../src/adapters/fromRuntimeSnapshot";
import {
  buildTraceWalk,
  formatTraceWalk,
} from "../../src/components/ExplainableShell/_internal/traceWalk";
import {
  entry,
  legacyRuntime,
  orderedLegacyLog,
} from "./fixtures/legacy-inputs";
import corpus from "./fixtures/corpus.json";
import corrections from "./corrections.json";
import fork from "./fixtures/causal-phases/runtime-snapshot-10.0.0.json";
import witness from "./fixtures/causal-phases/interleaved-fork-10.0.0.json";

const owns = (value: object, key: string) =>
  Object.prototype.hasOwnProperty.call(value, key);

describe("M1 — immutable source evidence", () => {
  it("preserves the five historical recordings and adds no regenerated baseline", () => {
    expect(corpus.goldenProducer).toBe("footprintjs 9.15.1");
    expect(corpus.goldenFiles).toHaveLength(6); // five recordings + their manifest
    for (const [path, sha256] of Object.entries(corpus.sha256)) {
      expect(
        createHash("sha256")
          .update(readFileSync(new URL(`../../${path}`, import.meta.url)))
          .digest("hex"),
        path
      ).toBe(sha256);
    }
  });

  it("keeps planned corrections separate from preservation guarantees", () => {
    expect(corrections.map((row) => row.id)).toEqual(["R1", "R2", "R3", "R4"]);
    for (const row of corrections.filter((row) => row.id !== "R4")) {
      expect(row.status).toBe("requires-owning-layer-review");
    }
    for (const row of corrections) {
      expect(row.approval).toBeNull();
      expect(row.observedIsCorrectnessOracle).toBe(false);
      expect(row.recordGroundedRequirement.length).toBeGreaterThan(0);
      expect(row.owner.length).toBeGreaterThan(0);
    }
    expect(corrections.find((row) => row.id === "R4")).toMatchObject({
      status: "foottrace-1.0.1-adoption-prepared",
      readerVersion: "1.0.1",
      owner:
        "Foottrace causalChain read-anchor rule; old Footprint 9 embedded reader maintenance separately",
      testedExpectation: expect.stringContaining("neither may report A-to-B"),
      publicVerification: expect.stringContaining("required before merge"),
    });
  });
});

describe("M1 — supported legacy projection behavior to preserve", () => {
  it("preserves ordered set/merge/replace/append/delete without resurrecting overwritten data", () => {
    const runtime = legacyRuntime(orderedLegacyLog);
    const before = structuredClone(runtime);
    const snapshots = toVisualizationSnapshots(runtime);
    expect(snapshots.map((row) => row.memory)).toEqual([
      { value: { x: 1 }, items: ["first"] },
      { value: { x: 1, y: 2 }, items: ["first"] },
      { value: { replacement: true }, items: ["first"] },
      { value: { replacement: true, z: 3 }, items: ["first", "second"] },
      { items: ["first", "second"] },
    ]);
    expect(snapshots.map((row) => row.runtimeStageId)).toEqual(
      orderedLegacyLog.map((row) => row.runtimeStageId)
    );
    expect(runtime).toEqual(before);
  });

  it("keeps delimiter-bearing paths distinct from literal dotted keys", () => {
    const snapshot = toVisualizationSnapshots(
      legacyRuntime([
        entry(0, { "a.b": "literal", a: { b: "nested" } }, {}, [
          { path: "a.b", verb: "set" },
          { path: "a\u001fb", verb: "set" },
        ]),
      ])
    )[0];
    expect(snapshot.memory).toEqual({ "a.b": "literal", a: { b: "nested" } });
  });

  it("rejects unsafe path structure and keeps summary markers atomic without changing caller data", () => {
    const marker = { __writeSummary: true, type: "array", length: 200 };
    const patch = JSON.parse(
      '{"constructor":{"prototype":{"polluted":true}},"safe":1}'
    );
    expect(mergeWritePatch({}, patch)).toEqual({ safe: 1 });
    expect(mergeWritePatch({ retained: true }, marker)).toEqual(marker);
    expect(mergeWritePatch(marker, { actual: true })).toEqual({ actual: true });
    expect(Object.prototype).not.toHaveProperty("polluted");
    expect(patch).toHaveProperty("constructor");
  });

  it("preserves explicit legacy stageWrites-only inputs without pretending they are a canonical record", () => {
    const runtime = legacyRuntime([]);
    const input = {
      ...runtime,
      executionTree: { ...runtime.executionTree, stageWrites: { legacy: 7 } },
    };
    expect(toVisualizationSnapshots(input)[0].memory).toEqual({ legacy: 7 });
    expect(input.commitLog).toEqual([]);
  });
});

describe("M1 — diagnostic observations, NOT approved future answers", () => {
  it("R1 identifies the old absent-base and set(undefined) interpretations", () => {
    const runtime = legacyRuntime(
      [
        entry(0, { visible: 1 }, {}, [{ path: "visible", verb: "set" }]),
        entry(1, { visible: undefined }, {}, [
          { path: "visible", verb: "set" },
        ]),
      ],
      { seed: 9 }
    );
    // The legacy adapter currently ignores a supplied base and removes an own
    // undefined-valued property. R1 owns the future interpretation, not this test.
    expect(toVisualizationSnapshots(runtime).map((row) => row.memory)).toEqual([
      { visible: 1 },
      {},
    ]);
    expect(runtime.initialState).toEqual({ seed: 9 });
    expect(owns(runtime.commitLog[1].overwrite, "visible")).toBe(true);
  });

  it("R1 exposes unknown-verb fallthrough and array-merge replacement as legacy policies", () => {
    const runtime = legacyRuntime([
      entry(0, { value: 7 }, {}, [{ path: "value", verb: "unrecognized" }]),
    ]);
    expect(toVisualizationSnapshots(runtime)[0].memory).toEqual({ value: 7 });
    expect(mergeWritePatch([1, 2], [3])).toEqual([3]);
    expect(
      corrections.find((row) => row.id === "R1")?.observedIsCorrectnessOracle
    ).toBe(false);
  });

  it("R3 corrects the old unproven run-input claim for a key that has no recorded evidence", () => {
    const walk = buildTraceWalk(orderedLegacyLog, undefined, "absent");
    expect(formatTraceWalk(walk, () => null)).toBe(
      "`absent`: no recorded write; value unknown."
    );
    expect(orderedLegacyLog.some((row) => owns(row.overwrite, "absent"))).toBe(
      false
    );
    expect(
      corrections.find((row) => row.id === "R3")?.recordGroundedRequirement
    ).toContain("not proof of an input");
  });

  it("R3 records incomplete trace-path inputs separately instead of inventing canonical values", () => {
    const pathOnly = [
      {
        stage: "Old",
        stageId: "old",
        runtimeStageId: "old#0",
        trace: [{ path: "x" }],
      },
    ];
    expect(
      buildTraceWalk(pathOnly, undefined, "x").stops[0].runtimeStageId
    ).toBe("old#0");
    expect(pathOnly[0]).not.toHaveProperty("overwrite");
    expect(pathOnly[0].trace[0]).not.toHaveProperty("verb");
  });

  it("R1 separates the actual final fork state from the old tree-based display", () => {
    const before = JSON.stringify(fork);
    expect(fork.commitLog).toEqual(witness.commitLog);
    expect(witness.valueActuallyRead).toBe(1);
    expect(witness.valueWritten).toBe(2);
    const snapshots = toVisualizationSnapshots(fork);
    expect(snapshots.map((row) => row.runtimeStageId)).toEqual([
      "seed#0",
      "a#1",
      "b#2",
      "join#3",
    ]);
    // Diagnostic output only: each branch gets a separate memory and Join
    // resumes with pre-fork memory. This is NOT the correct final record state.
    const observedJoin = snapshots.at(-1)?.memory;
    expect(observedJoin).toEqual({ runs: { b: { x: 1 } } });
    const recordTruth = { runs: { b: { x: 9 }, a: { y: 2 } } };
    expect(fork.sharedState).toEqual(recordTruth);
    expect(observedJoin).not.toEqual(recordTruth);
    expect(JSON.stringify(fork)).toBe(before);
  });

  it("R2 separates the own write's address from the old repeated-ID stop label", () => {
    const ownIndex = fork.commitLog.findIndex(
      (row) => row.runtimeStageId === "a#1" && row.phase === undefined
    );
    const walk = buildTraceWalk(
      fork.commitLog,
      fork.executionTree,
      "runs\u001fa\u001fy",
      { beforeCommitIdx: 2 }
    );
    expect(ownIndex).toBe(1);
    expect(fork.commitLog[3].trace).toEqual([]);
    expect(walk.stops[0]).toMatchObject({
      runtimeStageId: "a#1",
      commitIdx: 3,
    });
    expect(walk.stops[0].commitIdx).not.toBe(ownIndex);
    expect(walk.stops[0].ingredients).toContainEqual({
      key: "runs",
      writerRuntimeStageId: "seed#0",
      writerStageName: "Seed",
      writerCommitIdx: 0,
    });
  });
});
