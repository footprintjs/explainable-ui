import { describe, expect, it } from "vitest";
import {
  formatSlice,
  keysReadFromMap,
  sliceForKey,
  stateAt,
  timeTravel,
} from "foottrace";
import type { CommitBundle, KeysReadSource, TimeTravelSource } from "foottrace";
import { buildRecordLensModel } from "../../src/record/model";
import type { RecordLensInput } from "../../src/record/types";

function write(
  id: string,
  values: Record<string, unknown>,
  extra: Partial<CommitBundle> = {}
): CommitBundle {
  return {
    stage: id,
    stageId: id.split("#")[0],
    runtimeStageId: id,
    trace: Object.keys(values).map((path) => ({ path, verb: "set" })),
    overwrite: values,
    updates: {},
    redactedPaths: [],
    ...extra,
  };
}

function read(
  source: TimeTravelSource,
  step: number,
  options: Partial<RecordLensInput> = {}
) {
  return buildRecordLensModel({
    sourceId: "selected-source",
    source,
    step,
    ...options,
  });
}

function readable(
  source: TimeTravelSource,
  step: number,
  options: Partial<RecordLensInput> = {}
) {
  const model = read(source, step, options);
  if (model.status === "refused") throw new Error(model.refusal.message);
  return model;
}

describe("source-only record model", () => {
  it("keeps canonical stops and folds including both bookends", () => {
    const source = {
      initialState: { untouched: 1 },
      commitLog: [write("one#1", { x: 2 }), write("two#2", { x: 3 })],
    };
    const cursor = timeTravel(source);
    for (const stop of cursor.stops) {
      const model = readable(source, stop.step);
      expect(model.stops).toEqual(cursor.stops);
      expect(model.selected).toEqual(stop);
      expect(model.folded).toEqual(cursor.stateAt(stop));
    }
    expect(readable(source, 0).changes).toEqual([]);
    expect(readable(source, cursor.stops.length - 1).changes).toEqual([]);
  });

  it.each([
    -1,
    0.5,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    3,
    100,
  ])(
    "refuses invalid step %s instead of showing a neighbouring state",
    (step) => {
      const model = read({ commitLog: [write("one#1", { value: 1 })] }, step);
      expect(model).toMatchObject({
        status: "refused",
        selected: null,
        refusal: { code: "invalid-step" },
      });
      expect(model).not.toHaveProperty("folded");
    }
  );

  it("requires the caller's explicit source label", () => {
    expect(read({}, 0, { sourceId: "  " })).toMatchObject({
      status: "refused",
      refusal: { code: "invalid-source-id" },
    });
  });

  it("does not silently accept the multi-source cursor overload", () => {
    // @ts-expect-error JavaScript callers must not bypass the one-source boundary either.
    expect(read([{ initialState: { other: 1 } }], 0)).toMatchObject({
      status: "refused",
      refusal: { code: "read-refused" },
    });
  });

  it.each([{}, { commitLog: [] }, { history: [] }])(
    "shows an empty log's real base without invented stops",
    (source) => {
      const model = readable({ ...source, initialState: { seed: 7 } }, 0, {
        selectedKey: "seed",
      });
      expect(model).toMatchObject({
        status: "empty",
        selected: null,
        stops: [],
        folded: {
          state: { seed: 7 },
          basis: "initial+log",
          throughCommitIdx: -1,
        },
      });
      expect(model.provenance).toMatchObject({
        status: "ready",
        slice: { missing: "empty-log" },
        reads: "unknown",
      });
      expect(read(source, 1)).toMatchObject({
        status: "refused",
        refusal: { code: "invalid-step" },
      });
    }
  );

  it("preserves a withheld base as log-only rather than claiming a complete state", () => {
    const log = [write("one#1", { observed: 2 })];
    expect(readable({ commitLog: log }, 0).folded).toEqual(
      stateAt({ commitLog: log }, -1)
    );
    expect(readable({ commitLog: log }, 1).folded).toMatchObject({
      basis: "log-only",
      state: { observed: 2 },
    });
    expect(readable({ commitLog: log, initialState: {} }, 1).folded.basis).toBe(
      "initial+log"
    );
  });

  it("compares top-level values with canonical equality, including dates and sets", () => {
    const source = {
      initialState: {
        changed: new Date(0),
        same: new Set([1, 2]),
        removed: true,
        undefinedValue: undefined,
      },
      commitLog: [
        write(
          "one#1",
          {
            changed: new Date(1),
            same: new Set([2, 1]),
            added: undefined,
            removed: undefined,
          },
          {
            trace: [
              { path: "changed", verb: "set" },
              { path: "same", verb: "set" },
              { path: "added", verb: "set" },
              { path: "removed", verb: "delete" },
            ],
          }
        ),
      ],
    };
    const changes = readable(source, 1).changes;
    expect(changes).toContainEqual({
      key: "changed",
      kind: "changed",
      before: new Date(0),
      after: new Date(1),
    });
    expect(changes).toContainEqual({
      key: "removed",
      kind: "removed",
      before: true,
    });
    // Foottrace determines whether a set(undefined) survives; Lens never reimplements it.
    expect(
      changes.some(
        (change) => change.key === "same" || change.key === "undefinedValue"
      )
    ).toBe(false);
  });

  it("preserves phase grouping and folds through lastCommitIdx, not only the first bundle", () => {
    const source = {
      initialState: {},
      commitLog: [
        write("mount#1", { initial: 1 }),
        write("mount#1", { mapped: 2 }, { phase: "exit" }),
        write("next#2", { next: 3 }),
      ],
    };
    const model = readable(source, 1, { selectedKey: "mapped" });
    expect(model.selected).toMatchObject({
      kind: "mount",
      commitIdx: 0,
      lastCommitIdx: 1,
    });
    expect(model.folded.state).toEqual({ initial: 1, mapped: 2 });
    expect(model.provenance).toMatchObject({
      status: "ready",
      slice: { before: 2, writer: { runtimeStageId: "mount#1" } },
    });
  });

  it("keeps a caller-selected nested history source and its seed addresses local", () => {
    const source = {
      initialState: { seed: 0 },
      history: [
        write("sub#1", { seeded: 1 }),
        write("sub/inner#2", { inner: 2 }),
      ],
    };
    const model = readable(source, 0, { sourceId: "nested/sub" });
    expect(model.sourceId).toBe("nested/sub");
    expect(model.selected).toMatchObject({
      kind: "start",
      commitIdx: -1,
      lastCommitIdx: 0,
    });
    expect(model.folded.state).toEqual({ seed: 0, seeded: 1 });
    expect(model.previous.state).toEqual({ seed: 0 });
    expect(model.changes).toEqual([{ key: "seeded", kind: "added", after: 1 }]);
    expect(readable(source, 1).selected?.commitIdx).toBe(1);
  });

  it("gives commitLog canonical precedence over history without concatenation", () => {
    const model = readable(
      {
        commitLog: [write("chosen#1", { x: 1 })],
        history: [write("other#99", { x: 99 })],
      },
      1,
      { selectedKey: "x" }
    );
    expect(model.folded.state).toEqual({ x: 1 });
    expect(model.provenance).toMatchObject({
      status: "ready",
      slice: { writer: { runtimeStageId: "chosen#1" } },
    });
  });

  it("uses the canonical diamond slice and formatter verbatim", () => {
    const commitLog = [
      write("seed#1", { input: 1 }),
      write("left#2", { left: 2 }),
      write("right#3", { right: 3 }),
      write("join#4", { total: 5 }),
    ];
    const reads = keysReadFromMap({
      "left#2": ["input"],
      "right#3": ["input"],
      "join#4": ["left", "right"],
    });
    const model = readable({ initialState: {}, commitLog }, 4, {
      reads,
      selectedKey: "total",
    });
    const expected = sliceForKey(commitLog, "total", reads, { before: 4 });
    expect(model.provenance).toEqual({
      status: "ready",
      slice: expected,
      prose: formatSlice(expected),
      reads: "provided",
    });
    expect(
      expected.root?.parents.map((parent) => parent.runtimeStageId)
    ).toEqual(["left#2", "right#3"]);
  });

  it("does not expose a future writer or future causal read in a historical question", () => {
    const source = {
      initialState: {},
      commitLog: [
        write("old#1", { x: 1 }),
        write("new#2", { x: 2, future: true }),
      ],
    };
    const model = readable(source, 1, { selectedKey: "x" });
    expect(model.provenance).toMatchObject({
      status: "ready",
      slice: { writer: { runtimeStageId: "old#1" }, before: 1 },
    });
    expect(
      readable(source, 1, { selectedKey: "future" }).provenance
    ).toMatchObject({ status: "ready", slice: { missing: "never-written" } });
  });

  it("marks absent or zero-coverage read evidence as unknown", () => {
    const source = { commitLog: [write("one#1", { x: 1 })] };
    expect(readable(source, 1, { selectedKey: "x" }).provenance).toMatchObject({
      status: "ready",
      reads: "unknown",
    });
    const reads: KeysReadSource = {
      kind: "captured-off",
      lookup: () => [],
      coverage: { steps: 1, stepsWithReads: 0 },
    };
    expect(
      readable(source, 1, { selectedKey: "x", reads }).provenance
    ).toMatchObject({
      status: "ready",
      reads: "unknown",
      slice: { readsCoverage: reads.coverage },
    });
  });

  it.each([
    null,
    { runtimeStageId: "bad#2", trace: [{ path: "x", verb: "not-a-verb" }] },
  ])(
    "keeps a corrupt row's address and refuses a causal slice across it",
    (bad) => {
      const source = {
        initialState: {},
        commitLog: [write("one#1", { x: 1 }), bad, write("three#3", { y: 2 })],
      };
      const cursor = timeTravel(source);
      const final = readable(source, cursor.stops.length - 1, {
        selectedKey: "y",
      });
      expect(final.folded.skipped).toEqual(stateAt(source, 2).skipped);
      expect(final.folded.skipped?.[0].index).toBe(1);
      expect(
        final.stops.find((stop) => stop.runtimeStageId === "three#3")?.commitIdx
      ).toBe(2);
      expect(final.provenance).toMatchObject({
        status: "unavailable",
        reason: "log-gap",
      });
    }
  );

  it("fails closed when the canonical cursor refuses a sparse source", () => {
    const log: unknown[] = [
      write("one#1", { x: 1 }),
      ,
      write("three#3", { y: 2 }),
    ];
    const source = { commitLog: log };
    // Foottrace 1.0.0's axis currently refuses a sparse hole before it can fold.
    // Do not normalize/filter the source to work around that reader limitation.
    const model = read(source, 0, { selectedKey: "y" });
    expect(model).toMatchObject({
      status: "refused",
      refusal: { code: "read-refused" },
    });
    expect(model).not.toHaveProperty("folded");
    expect(1 in log).toBe(false);
  });

  it("a future gap does not prevent a complete earlier prefix from being explained", () => {
    const source = {
      commitLog: [write("one#1", { x: 1 }), write("two#2", { y: 2 }), null],
    };
    expect(readable(source, 1, { selectedKey: "x" }).provenance).toMatchObject({
      status: "ready",
      slice: { before: 1 },
    });
  });

  it("passes redaction and canonical provenance notes through unchanged", () => {
    const source = {
      initialState: {},
      commitLog: [
        write(
          "secret#1",
          { secret: "REDACTED" },
          { redactedPaths: ["secret"] }
        ),
      ],
    };
    const model = readable(source, 1, { selectedKey: "secret" });
    expect(model.folded).toEqual(stateAt(source, 0));
    expect(model.folded).toMatchObject({
      redacted: true,
      redactedPaths: ["secret"],
    });
    expect(model.provenance).toMatchObject({
      status: "ready",
      slice: {
        notes: expect.arrayContaining([
          expect.objectContaining({ code: "redacted" }),
        ]),
      },
    });
  });

  it("refuses only the failed causal query while retaining a readable state", () => {
    const source = { commitLog: [write("one#1", { x: 1 })] };
    const reads: KeysReadSource = {
      kind: "failed-source",
      lookup: () => {
        throw new Error("sensitive provider detail");
      },
    };
    const model = readable(source, 1, { selectedKey: "x", reads });
    expect(model.provenance).toMatchObject({
      status: "unavailable",
      reason: "query-refused",
    });
    expect(model.folded.state).toEqual({ x: 1 });
    expect(JSON.stringify(model)).not.toContain("sensitive provider detail");
  });

  it("refuses an unreadable fold rather than substituting an empty result", () => {
    const model = read({ initialState: { unsupported: () => undefined } }, 0);
    expect(model).toMatchObject({
      status: "refused",
      refusal: { code: "read-refused" },
    });
    expect(model).not.toHaveProperty("folded");
  });

  it("does not mutate or freeze the caller's source when calculating state and provenance", () => {
    const source = {
      initialState: { base: { preserved: 1 } },
      commitLog: [write("one#1", { value: { nested: 2 } })],
    };
    const before = structuredClone(source);
    readable(source, 1, { selectedKey: "value" });
    expect(source).toEqual(before);
    expect(Object.isFrozen(source.initialState.base)).toBe(false);
    expect(Object.isFrozen(source.commitLog[0].overwrite.value)).toBe(false);
  });
});
