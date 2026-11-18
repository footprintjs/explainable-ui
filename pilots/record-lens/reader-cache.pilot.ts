import { describe, expect, it, vi } from "vitest";
import { timeTravel } from "foottrace";
import type { KeysReadSource } from "foottrace";
import { createFoldWindow } from "../../src/record/foldWindow";
import { createRecordLensReader } from "../../src/record/model";

function recording(count: number) {
  return {
    initialState: { when: new Date(123), bytes: new Uint8Array([3, 5]) },
    commitLog: Array.from({ length: count }, (_, i) => ({
      stage: "Write", stageId: "write", runtimeStageId: "write#" + i,
      updates: {}, overwrite: { x: i }, trace: [{ path: "x", verb: "set" }],
    })),
  };
}

describe("prepared recording queries", () => {
  it("reuses an exact query, retaining its canonical writer and isolating mutable results", () => {
    const source = recording(4);
    const reads: KeysReadSource = { kind: "read-map", lookup: vi.fn(() => []) };
    const reader = createRecordLensReader({ sourceId: "same", source, reads });
    const first = reader.at(3, ["x"]);
    if (first.status !== "ready" || first.provenance?.status !== "ready") throw Error("Missing answer");
    const calls = vi.mocked(reads.lookup).mock.calls.length;
    expect(calls).toBeGreaterThan(0);
    first.provenance.slice.root!.keysWritten.push("consumer edit");
    (first.folded.state.when as Date).setTime(999);
    (first.folded.state.bytes as Uint8Array)[0] = 99;
    const again = reader.at(3, "x");
    if (again.status !== "ready" || again.provenance?.status !== "ready") throw Error("Missing answer");
    expect(reads.lookup).toHaveBeenCalledTimes(calls);
    expect(again.provenance.slice.root!.keysWritten).toEqual(["x"]);
    expect(again.provenance.slice.writer).toBe(source.commitLog[2]);
    expect(again.folded.state.when).toEqual(new Date(123));
    expect(again.folded.state.bytes).toEqual(new Uint8Array([3, 5]));
    const earlier = reader.at(2, "x");
    if (earlier.status !== "ready" || earlier.provenance?.status !== "ready") throw Error("Missing earlier answer");
    expect(earlier.provenance.slice.writer).toBe(source.commitLog[1]);

    const updated = recording(4);
    updated.commitLog[2].overwrite.x = 42;
    const next = createRecordLensReader({ sourceId: "same", source: updated, reads }).at(3, "x");
    expect(next).toMatchObject({ folded: { state: { x: 42 } }, provenance: { slice: { writer: updated.commitLog[2] } } });
    expect(reads.lookup).not.toHaveBeenCalledTimes(calls);
  });

  it("avoids speculative folds on a backward miss for a large state", () => {
    const source = { commitLog: recording(100).commitLog, initialState: { large: "x".repeat(8192) } };
    const cursor = timeTravel(source);
    const fold = vi.spyOn(cursor, "stateAt");
    const at = createFoldWindow(source, cursor);
    at(50);
    fold.mockClear();
    expect(at(49).folded.state.x).toBe(48);
    expect(fold.mock.calls.map(([stop]) => stop!.step)).toEqual([48]);
  });

  it("returns canonical folds and evidence across reverse-window boundaries, gaps and new seeks", () => {
    const rows: unknown[] = recording(100).commitLog;
    rows[39] = null;
    const source = { history: rows };
    const canonical = timeTravel(source);
    const reader = createRecordLensReader({ sourceId: "gapped", source });
    for (const step of [80, ...Array.from({ length: 78 }, (_, i) => 79 - i), 95, 3, 1, 0]) {
      const stop = reader.stops[step];
      const model = reader.at(step, "x");
      if (model.status !== "ready") throw Error("Missing fold");
      expect(model.folded).toEqual(canonical.stateAt(stop));
      if (step > 0) expect(model.previous).toEqual(canonical.stateAt(reader.stops[step - 1]));
      if (stop.lastCommitIdx >= 39) {
        expect(model.provenance).toMatchObject({ status: "unavailable", reason: "log-gap" });
      } else {
        expect(model.provenance?.status).toBe("ready");
      }
    }
  });
});
