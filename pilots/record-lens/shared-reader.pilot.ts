import { describe, expect, it } from "vitest";
import { sliceToJSON, tagStops, timeTravel } from "foottrace";
import recording from "../../examples/headless-controller/recording.json";
import { buildRecordLensModel, createRecordLensReader } from "../../src/record/model";

const source = recording.snapshot;
const sourceId = "parallel";

describe("Foottrace 2 shared reader", () => {
  it("reuses canonical stops through scrubbing and follows both recorded writers of 35", () => {
    const reader = createRecordLensReader({ sourceId, source });
    expect(reader.stops).toEqual(timeTravel(source).stops);
    const combine = reader.stops.find(stop => stop.runtimeStageId === "combine#4")!;
    const model = reader.at(combine.step, "total");
    if (model.status !== "ready" || model.provenance?.status !== "ready") throw Error("Missing recorded total");
    expect(model.folded.state.total).toBe(35);
    expect(model.stops).toBe(reader.stops);
    const edges = sliceToJSON(model.provenance.slice).edges;
    for (const [branch, runtimeStageId, amount] of [["items", "items#2", 30], ["delivery", "delivery#3", 5]] as const) {
      const key = ["runs", branch, "amount"];
      expect(edges).toContainEqual(expect.objectContaining({ from: "combine#4", to: runtimeStageId, key: key.join("\u001f") }));
      const writerStop = reader.stops.find(stop => stop.runtimeStageId === runtimeStageId)!;
      const writer = reader.at(writerStop.step, key);
      if (writer.status !== "ready" || writer.provenance?.status !== "ready") throw Error("Missing recorded writer");
      expect(writer.provenance.slice.writer?.runtimeStageId).toBe(runtimeStageId);
      expect(writer.folded.state.runs).toMatchObject({ [branch]: { amount } });
      expect(writer.stops).toBe(reader.stops);
    }
    expect(reader.at(combine.step, "total")).toEqual(model);
  });

  it("leaves custom stop grouping, including its prologue, to the producer's Foottrace strategy", () => {
    const tagged = { ...source, commitLog: source.commitLog.map((row, index) => index === 2 ? { ...row, tags: ["milestone"] } : row) };
    const strategy = tagStops(["milestone"]);
    const canonical = timeTravel(tagged, { strategy });
    const reader = createRecordLensReader({ sourceId, source: tagged, strategy });
    expect(reader.stops).toEqual(canonical.stops);
    expect(reader.stops[0].prologue).toBe(true);
    expect(reader.stops).toHaveLength(3);
    for (const stop of reader.stops) {
      const model = reader.at(stop.step, "total");
      if (model.status !== "ready") throw Error("Missing canonical stop");
      expect(model.folded).toEqual(canonical.stateAt(stop));
      expect(model.folded.throughCommitIdx).toBe(stop.lastCommitIdx);
    }
  });

  it("constructs a fresh axis for a newly published revision, including append-in-place hosts", () => {
    const growing = { commitLog: source.commitLog.slice(0, 1) };
    const opts = { sourceId, source: growing };
    const old = createRecordLensReader(opts);
    const before = old.stops.length;
    growing.commitLog.push(...source.commitLog.slice(1));
    const updated = createRecordLensReader(opts);
    expect(updated.stops.length).toBeGreaterThan(before);
    expect(old.stops).not.toBe(updated.stops);
    expect(buildRecordLensModel({ ...opts, step: updated.stops.length - 1 }).selected?.kind).toBe("end");
    expect(updated.at(before + 10).status).toBe("refused");
  });
});
