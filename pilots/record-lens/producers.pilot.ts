import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { isCommitBundle, sliceToJSON, timeTravel } from "foottrace";
import { buildRecordLensModel } from "../../src/record/model";
import type { RecordLensInput } from "../../src/record/types";
import {
  flowChildFixture,
  flowFixture,
  hciFixture,
  hciObservation,
} from "./fixtures/records";
import type { ProducerFixture } from "./fixtures/records";
import provenance from "./fixtures/provenance.json";

function read(fixture: ProducerFixture, step: number, extra: Partial<RecordLensInput> = {}) {
  const model = buildRecordLensModel({ ...fixture, step, ...extra });
  if (model.status === "refused") throw new Error(model.refusal.message);
  return model;
}

function explanation(fixture: ProducerFixture, step: number, key: string, extra: Partial<RecordLensInput> = {}) {
  const model = read(fixture, step, { selectedKey: key, ...extra });
  if (model.provenance?.status !== "ready") throw new Error("Expected canonical provenance");
  return model.provenance;
}

describe("record model with real public producer recordings", () => {
  it("records the actual producer versions, not hand-authored trace examples", () => {
    expect(provenance.versions.flow).toEqual({ footprintjs: "10.0.0", foottrace: "1.0.0" });
    expect(provenance.versions.hci).toEqual({ hcifootprint: "3.0.0", footprintjs: "9.48.3", foottrace: "1.0.0" });
    expect(provenance.flow.rootRows).toBe(5);
    expect(provenance.flow.childRows).toBe(2);
    expect(provenance.hci.rows).toBe(4);
  });

  it("preserves the exact recorded fixture bytes named in generation evidence", () => {
    for (const [name, expected] of Object.entries(provenance.fixtureSha256)) {
      const bytes = readFileSync(new URL(`./fixtures/${name}`, import.meta.url));
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(expected);
    }
  });

  it.each([flowFixture, flowChildFixture, hciFixture])(
    "reads every canonical stop of $sourceId through the same model",
    fixture => {
      const cursor = timeTravel(fixture.source);
      for (const stop of cursor.stops) {
        const model = read(fixture, stop.step);
        expect(model.sourceId).toBe(fixture.sourceId);
        expect(model.selected).toEqual(stop);
        expect(model.stops).toEqual(cursor.stops);
        expect(model.folded).toEqual(cursor.stateAt(stop));
        expect(model.folded.skipped ?? []).toEqual([]);
      }
    },
  );

  it("keeps an actual stage transaction atomic and its mount/exit rows grouped", () => {
    const first = read(flowFixture, 1);
    expect(first.folded.state).toEqual({ principal: 100, fee: 5 });
    expect(first.changes.map(change => change.key)).toEqual(["principal", "fee"]);
    const mount = read(flowFixture, 3, { selectedKey: "approved" });
    expect(mount.selected).toMatchObject({ runtimeStageId: "review#2", kind: "mount", commitIdx: 2, lastCommitIdx: 3 });
    expect(mount.folded.throughCommitIdx).toBe(3);
    expect(mount.folded.state).toEqual({ principal: 100, fee: 5, net: 95, approved: true });
    expect(mount.provenance).toMatchObject({ status: "ready", slice: { before: 4, writer: { runtimeStageId: "review#2" } } });
    expect(mount.stops.filter(stop => stop.runtimeStageId === "review#2")).toHaveLength(1);
  });

  it("keeps the caller-selected child seed and causal edges in the child's source", () => {
    const start = read(flowChildFixture, 0);
    expect(start.selected).toMatchObject({ kind: "start", commitIdx: -1, lastCommitIdx: 0 });
    expect(start.folded.state).toEqual({ net: 95 });
    expect(start.previous.state).toEqual({});
    const child = read(flowChildFixture, 1, { selectedKey: "approved" });
    expect(child.folded.state).toEqual({ net: 95, approved: true });
    expect(child.folded.state).not.toHaveProperty("principal");
    const slice = explanation(flowChildFixture, 1, "approved").slice;
    expect(slice.writer?.runtimeStageId).toBe("review/check#3");
    expect(slice.root?.parents.map(parent => parent.runtimeStageId)).toEqual(["review#2"]);
  });

  it("folds HCI's actual delta appends without requiring a flow tree or replacing the list", () => {
    expect(hciFixture.source).not.toHaveProperty("executionTree");
    expect(hciFixture.source).not.toHaveProperty("subflowResults");
    expect(read(hciFixture, 0).folded.state).toEqual({ authenticated: false, items: [], itemCount: 0 });
    expect(read(hciFixture, 2).folded.state.items).toEqual([{ id: "p1" }]);
    expect(read(hciFixture, 3).folded.state.items).toEqual([{ id: "p1" }, { id: "p2" }]);
    expect(read(hciFixture, 3).changes).toContainEqual({ key: "items", kind: "changed", before: [{ id: "p1" }], after: [{ id: "p1" }, { id: "p2" }] });
  });

  it("retains the HCI guard-read evidence instead of inventing an execution tree", () => {
    expect(hciFixture.reads.lookup("checkout#3")).toEqual(["authenticated", "itemCount"]);
    const provenance = explanation(hciFixture, 4, "orderId");
    expect(provenance.reads).toBe("provided");
    const flat = sliceToJSON(provenance.slice);
    expect(flat.writerId).toBe("checkout#3");
    expect(Object.keys(flat.nodes ?? {}).sort()).toEqual(["add#2", "checkout#3", "unlock#0"]);
    expect(provenance.slice.keysReadKind).toBe("map");
  });

  it("retains observed Flow read coverage without inventing coverage for HCI", () => {
    expect(flowFixture.reads.coverage).toEqual({ steps: 4, stepsWithReads: 1 });
    expect(flowChildFixture.reads.coverage).toEqual({ steps: 1, stepsWithReads: 1 });
    expect(explanation(flowFixture, 2, "net").slice.readsCoverage).toEqual(flowFixture.reads.coverage);
    expect(hciFixture.reads.coverage).toBeUndefined();
    expect(explanation(hciFixture, 4, "orderId").slice.readsCoverage).toBeUndefined();
  });

  it("keeps missing read evidence unknown rather than rebuilding it from display state", () => {
    const known = explanation(flowFixture, 2, "net");
    expect(known.slice.root?.parents.map(parent => parent.runtimeStageId)).toEqual(["seed#0"]);
    expect(flowFixture.reads.lookup("total#1")).toEqual(["principal", "fee"]);
    const unknown = explanation(flowFixture, 2, "net", { reads: undefined });
    expect(unknown.reads).toBe("unknown");
    expect(unknown.slice.keysReadKind).toBe("not-recorded");
    expect(unknown.slice.writer?.runtimeStageId).toBe("total#1");
    expect(unknown.slice.root?.parents).toEqual([]);
  });

  it("answers the historical value and writer before a later overwrite", () => {
    expect(read(flowFixture, 2).folded.state.net).toBe(95);
    expect(explanation(flowFixture, 2, "net").slice.writer?.runtimeStageId).toBe("total#1");
    expect(read(flowFixture, 4).folded.state.net).toBe(80);
    expect(explanation(flowFixture, 4, "net").slice.writer?.runtimeStageId).toBe("revise#4");
    expect(explanation(hciFixture, 2, "orderId").slice.missing).toBe("never-written");
    expect(read(hciFixture, 2).folded.state).not.toHaveProperty("orderId");
  });

  it("does not mislabel HCI's pending interaction as a committed state change", () => {
    expect(hciObservation.transitions).toContainEqual({ id: "add#4", outcome: "pending" });
    const model = read(hciFixture, 5);
    expect(model.stops.some(stop => stop.runtimeStageId === hciObservation.pendingId)).toBe(false);
    expect(model.folded.state.itemCount).toBe(hciObservation.liveItemCount);
    expect(model.folded.state.items).toEqual([{ id: "p1" }, { id: "p2" }]);
  });

  it("preserves producer redaction in reconstructed state and provenance", () => {
    const model = read(hciFixture, 1, { selectedKey: "privateNote" });
    expect(model.folded.state.privateNote).toBe("REDACTED");
    expect(hciFixture.source.commitLog?.filter(isCommitBundle)[0].redactedPaths).toContain("privateNote");
    expect(explanation(hciFixture, 1, "privateNote").slice.notes?.map(note => note.code)).toContain("redacted");
    expect(JSON.stringify(hciFixture.source)).not.toContain("fixture-only-private-note");
  });

  it("does not carry a numeric cursor from a root into a shorter child source", () => {
    expect(read(flowFixture, 4).sourceId).toBe("flow:root");
    expect(buildRecordLensModel({ ...flowChildFixture, step: 4 })).toMatchObject({ sourceId: "flow:review", status: "refused", refusal: { code: "invalid-step" } });
    expect(read(flowChildFixture, 1).selected?.runtimeStageId).toBe("review/check#3");
    expect(read(flowFixture, 4).selected?.runtimeStageId).toBe("revise#4");
  });

  it("only observes the saved recordings without mutating their bytes or read maps", () => {
    const fixtures = [flowFixture, flowChildFixture, hciFixture];
    const before = JSON.stringify(fixtures.map(fixture => fixture.source));
    const reads = fixtures.map(fixture => fixture.reads.lookup("total#1"));
    for (const fixture of fixtures) {
      for (const stop of timeTravel(fixture.source).stops) read(fixture, stop.step, { selectedKey: "net" });
    }
    expect(JSON.stringify(fixtures.map(fixture => fixture.source))).toBe(before);
    expect(fixtures.map(fixture => fixture.reads.lookup("total#1"))).toEqual(reads);
  });
});
