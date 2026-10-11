import { describe, expect, it } from "vitest";
import {
  isCommitBundle,
  keysReadFromExecutionTree,
  sliceForKey,
  sliceToJSON,
  stateAt,
  timeTravel,
} from "foottrace";
import { buildRecordLensModel } from "../../src/record/model";
import { flowFixture, flowChildFixture, hciFixture } from "./fixtures/records";
import witness from "../../test/migration/fixtures/causal-phases/interleaved-fork-10.0.0.json";
import snapshot from "../../test/migration/fixtures/causal-phases/runtime-snapshot-10.0.0.json";

function modelAt(
  fixture: typeof flowFixture,
  step: number,
  selectedKey?: string
) {
  const model = buildRecordLensModel({ ...fixture, step, selectedKey });
  if (model.status === "refused") throw new Error(model.refusal.message);
  return model;
}

describe("M1 — real record truth (Node22 only, not the legacy display oracle)", () => {
  it("pins independently known root and child states at every canonical stop", () => {
    expect(
      timeTravel(flowFixture.source).stops.map(
        (stop) => modelAt(flowFixture, stop.step).folded.state
      )
    ).toEqual([
      {},
      { principal: 100, fee: 5 },
      { principal: 100, fee: 5, net: 95 },
      { principal: 100, fee: 5, net: 95, approved: true },
      { principal: 100, fee: 5, net: 80, approved: true },
      { principal: 100, fee: 5, net: 80, approved: true },
    ]);
    expect(
      timeTravel(flowChildFixture.source).stops.map(
        (stop) => modelAt(flowChildFixture, stop.step).folded.state
      )
    ).toEqual([
      { net: 95 },
      { net: 95, approved: true },
      { net: 95, approved: true },
    ]);
  });

  it("pins HCI append order, genuine starting base, redaction and pending exclusion", () => {
    const states = timeTravel(hciFixture.source).stops.map(
      (stop) => modelAt(hciFixture, stop.step).folded.state
    );
    const initial = { authenticated: false, items: [], itemCount: 0 };
    const unlocked = {
      ...initial,
      authenticated: true,
      privateNote: "REDACTED",
    };
    const one = { ...unlocked, items: [{ id: "p1" }], itemCount: 1 };
    const two = {
      ...unlocked,
      items: [{ id: "p1" }, { id: "p2" }],
      itemCount: 2,
    };
    expect(states).toEqual([
      initial,
      unlocked,
      one,
      two,
      { ...two, orderId: "demo-order-1" },
      { ...two, orderId: "demo-order-1" },
    ]);
    expect(
      timeTravel(hciFixture.source).stops.some(
        (stop) => stop.runtimeStageId === "add#4"
      )
    ).toBe(false);
  });

  it("the actual fork record folds to the independently observed state at each original row", () => {
    expect(snapshot.commitLog).toEqual(witness.commitLog);
    const source = {
      initialState: snapshot.initialState,
      commitLog: snapshot.commitLog,
    };
    expect(
      source.commitLog.map((_, index) => stateAt(source, index).state)
    ).toEqual([
      { runs: { b: { x: 1 } } },
      { runs: { b: { x: 1 }, a: { y: 2 } } },
      ...Array.from({ length: 4 }, () => ({
        runs: { b: { x: 9 }, a: { y: 2 } },
      })),
    ]);
    expect(stateAt(source, 5).state).toEqual(snapshot.sharedState);
  });

  it("R4 correction: early and full records keep A's own write and prior Seed cause", () => {
    // The fixture was produced with Foottrace 1.0.0 and stays byte-identical.
    // The corrected reader must explain that evidence, not preserve the old
    // later-parent defect. No Lens-side causal algorithm or workaround is used.
    const log = witness.commitLog.map((row) => {
      if (!isCommitBundle(row))
        throw new Error("Real fixture contains an invalid row");
      return row;
    });
    const reads = keysReadFromExecutionTree(witness.executionTree);
    const key = ["runs", "a", "y"];
    const early = sliceToJSON(sliceForKey(log.slice(0, 2), key, reads));
    const fullSlice = sliceForKey(log, key, reads);
    const full = sliceToJSON(fullSlice);
    expect(witness.valueActuallyRead).toBe(1);
    expect(witness.executionTree.children[0].stageReads?.runs.b.x).toBe(1);
    expect(log[2].overwrite.runs).toEqual({ b: { x: 9 } });
    for (const result of [early, full]) {
      expect
        .soft(result.edges)
        .toContainEqual(expect.objectContaining({ from: "a#1", to: "seed#0" }));
      expect
        .soft(result.edges)
        .not.toContainEqual(
          expect.objectContaining({ from: "a#1", to: "b#2" })
        );
    }
    expect(fullSlice.writer).toBe(log[1]);
    expect.soft(fullSlice.root?.keysWritten).toEqual(["runs\u001fa\u001fy"]);
    expect(full.nodes).toEqual(early.nodes);
  });
});
