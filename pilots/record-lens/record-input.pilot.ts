import { describe, expect, it } from "vitest";
import {
  isCommitBundle,
  keysReadFromMap,
  stateAt,
  timeTravel,
} from "foottrace";
import type { KeysReadSource } from "foottrace";
import {
  adaptFlowRecord,
  type FlowRecordSelection,
} from "../../src/adapters/recordInput";
import { buildRecordLensModel } from "../../src/record/model";
import { flowFixture, flowChildFixture, hciFixture } from "./fixtures/records";
import snapshot from "../../test/migration/fixtures/causal-phases/runtime-snapshot-10.0.0.json";
import legacy from "../../test/fixtures/golden/linear-decider.json";
import legacySubflow from "../../test/fixtures/golden/subflow-loop.json";

function selection(
  record: unknown,
  options: Partial<FlowRecordSelection> = {}
): FlowRecordSelection {
  return {
    sourceId: "chosen-source",
    format: "snapshot",
    record,
    reads: { status: "unknown" },
    ...options,
  };
}

function accepted(input: FlowRecordSelection) {
  const result = adaptFlowRecord(input);
  if (result.status === "refused") throw new Error(result.message);
  return result;
}

describe("M2 — explicit Flow record input, without a second reader", () => {
  it("keeps the recorded base, rows, tree and subflow references, but not final state", () => {
    const source = {
      ...snapshot,
      sharedState: { mustNeverBeTheBase: true },
      subflowResults: { selectedChild: flowChildFixture.source },
    };
    const result = accepted(selection(source));
    expect(result.source.commitLog).toBe(source.commitLog);
    expect(result.source.initialState).toBe(source.initialState);
    expect(result.source.executionTree).toBe(source.executionTree);
    expect(result.source.subflowResults).toBe(source.subflowResults);
    expect(result.source).not.toHaveProperty("sharedState");
    expect(result.evidence).toEqual({
      base: "recorded",
      reads: { status: "unknown" },
    });
    expect(stateAt(result.source, -1).state).toEqual(snapshot.initialState);
  });

  it("makes missing base distinct from a genuinely recorded empty base", () => {
    const result = accepted(
      selection({
        commitLog: snapshot.commitLog,
        sharedState: snapshot.sharedState,
      })
    );
    expect(result.source).not.toHaveProperty("initialState");
    expect(result.evidence.base).toBe("missing");
    expect(stateAt(result.source, 1).basis).toBe("log-only");
    const empty = accepted(selection({ initialState: {}, commitLog: [] }));
    expect(empty.evidence.base).toBe("recorded");
    expect(stateAt(empty.source, -1).basis).toBe("initial+log");
  });

  it("reads a genuine 9.15.1 snapshot as log-only without guessing from its version", () => {
    const result = accepted(selection(legacy.snapshot));
    expect(result.source.commitLog).toBe(legacy.snapshot.commitLog);
    expect(result.evidence.base).toBe("missing");
    expect(stateAt(result.source, 0).basis).toBe("log-only");
  });

  it("selects child history explicitly even when the envelope also contains a root log", () => {
    const result = accepted(
      selection(
        {
          ...flowChildFixture.source,
          commitLog: flowFixture.source.commitLog,
        },
        {
          sourceId: flowChildFixture.sourceId,
          format: "subtree",
          reads: { status: "supplied", source: flowChildFixture.reads },
        }
      )
    );
    expect(result.source.history).toBe(flowChildFixture.source.history);
    expect(result.source).not.toHaveProperty("commitLog");
    expect(result.sourceId).toBe(flowChildFixture.sourceId);
    expect(result.evidence.reads).toEqual({
      status: "supplied",
      source: flowChildFixture.reads,
    });
    expect(timeTravel(result.source).stops).toEqual(
      timeTravel(flowChildFixture.source).stops
    );
    expect(timeTravel(result.source).stops[0].lastCommitIdx).toBe(0);
    expect(stateAt(result.source, 0).state).toEqual({ net: 95 });
  });

  it("does not discover a child or fall back to another source's available log", () => {
    expect(adaptFlowRecord(selection({ history: [] }))).toMatchObject({
      status: "refused",
      code: "missing-log",
    });
    expect(
      adaptFlowRecord(selection({ commitLog: [] }, { format: "subtree" }))
    ).toMatchObject({
      status: "refused",
      code: "missing-log",
    });
  });

  it("maps a genuine selected treeContext's own stageContexts without borrowing the root tree or final context", () => {
    const child =
      legacySubflow.snapshot.subflowResults["sf-enrich#1"].treeContext;
    const result = accepted(
      selection(child, {
        sourceId: "sf-enrich#1",
        format: "tree-context",
      })
    );
    expect(result.source.history).toBe(child.history);
    expect(result.source.executionTree).toBe(child.stageContexts);
    expect(result.source).not.toHaveProperty("initialState");
    expect(result.source).not.toHaveProperty("globalContext");
    expect(result.source).not.toHaveProperty("subflowResults");
    expect(result.evidence.reads).toEqual({ status: "unknown" });
    expect(timeTravel(result.source).stops[0]).toMatchObject({
      kind: "start",
      lastCommitIdx: 0,
    });
    expect(stateAt(result.source, 0)).toMatchObject({
      basis: "log-only",
      state: { rawText: "  Hello GOLDEN Trace  " },
    });
  });

  it("preserves explicit read coverage without inferring capture completeness or reading the tree", () => {
    const reads: KeysReadSource = {
      ...keysReadFromMap({ "reader#20": ["input"] }),
      coverage: { steps: 100, stepsWithReads: 1 },
    };
    const evidence = { status: "supplied", source: reads } as const;
    const result = accepted(selection(snapshot, { reads: evidence }));
    expect(result.evidence.reads).toBe(evidence);
    expect(result.evidence.reads).toEqual({
      status: "supplied",
      source: reads,
    });
    expect(reads.lookup("reader#20")).toEqual(["input"]);
    expect(accepted(selection(snapshot)).evidence.reads).toEqual({
      status: "unknown",
    });
    expect(result.evidence).not.toHaveProperty("complete");
  });

  it.each([
    null,
    { runtimeStageId: "bad#9", trace: [{ path: "x", verb: "invented" }] },
    { runtimeStageId: "bad#9", trace: [{ path: "x" }] },
    { stageWrites: { x: 99 } },
  ])(
    "keeps unreadable row %j at its address; Foottrace qualifies only the crossed prefix",
    (bad) => {
      const log = [snapshot.commitLog[0], bad, snapshot.commitLog[1]];
      const result = accepted(selection({ commitLog: log }));
      expect(result.source.commitLog).toBe(log);
      expect(result.source.commitLog?.[1]).toBe(bad);
      expect(stateAt(result.source, 0).skipped).toBeUndefined();
      expect(stateAt(result.source, 2).skipped?.[0].index).toBe(1);
      expect(
        timeTravel(result.source).stops.find(
          (stop) => stop.runtimeStageId === "a#1"
        )?.commitIdx
      ).toBe(2);
    }
  );

  it.each(["unknown", "missing"])(
    "qualifies a %s verb in an otherwise valid real bundle without blocking or changing earlier history",
    (variant) => {
      const fixtureBefore = JSON.stringify(snapshot);
      const original = snapshot.commitLog[2];
      expect(isCommitBundle(original)).toBe(true);
      expect(original.trace).toHaveLength(1);
      const bad = {
        ...original,
        trace: original.trace.map(({ verb, ...entry }) =>
          variant === "missing" ? entry : { ...entry, verb: "invented" }
        ),
      };
      expect({ ...bad, trace: original.trace }).toEqual(original);
      const log = [snapshot.commitLog[0], snapshot.commitLog[1], bad];
      const before = JSON.stringify(log);
      const result = accepted(
        selection({ initialState: snapshot.initialState, commitLog: log })
      );
      expect(result.source.commitLog).toBe(log);
      expect(result.source.commitLog?.[2]).toBe(bad);

      const earlier = stateAt(result.source, 1);
      expect(earlier.state).toEqual({ runs: { b: { x: 1 }, a: { y: 2 } } });
      expect(earlier.skipped).toBeUndefined();
      const later = stateAt(result.source, 2);
      expect(later.state).toEqual(earlier.state);
      expect(later.skipped).toEqual([
        {
          index: 2,
          reason: expect.stringContaining(
            variant === "missing"
              ? "trace[0].verb is missing, not "
              : 'trace[0].verb is "invented", not '
          ),
        },
      ]);
      expect(JSON.stringify(log)).toBe(before);
      expect(JSON.stringify(snapshot)).toBe(fixtureBefore);
    }
  );

  it("does not fill or compact a sparse row to bypass the canonical cursor's limitation", () => {
    const log = [snapshot.commitLog[0], , snapshot.commitLog[1]];
    const result = accepted(selection({ commitLog: log }));
    expect(result.source.commitLog).toBe(log);
    expect(1 in log).toBe(false);
    expect(stateAt(result.source, 0).skipped).toBeUndefined();
    expect(stateAt(result.source, 2).skipped?.[0].index).toBe(1);
    expect(
      buildRecordLensModel({
        sourceId: result.sourceId,
        source: result.source,
        step: 0,
      })
    ).toMatchObject({
      status: "refused",
      refusal: { code: "read-refused" },
    });
    expect(1 in log).toBe(false);
  });

  it("preserves real producer behavior by delegating every selected stop unchanged", () => {
    for (const fixture of [flowFixture, flowChildFixture, hciFixture]) {
      const result = accepted(
        selection(fixture.source, {
          sourceId: fixture.sourceId,
          format: fixture.source.history ? "subtree" : "snapshot",
          reads: { status: "supplied", source: fixture.reads },
        })
      );
      const expected = timeTravel(fixture.source);
      const actual = timeTravel(result.source);
      expect(actual.stops).toEqual(expected.stops);
      for (let i = 0; i < actual.stops.length; i++) {
        expect(actual.stateAt(actual.stops[i])).toEqual(
          expected.stateAt(expected.stops[i])
        );
      }
    }
  });

  it.each([
    [null, "invalid-record"],
    [[], "invalid-record"],
    [new Date(), "invalid-record"],
    [
      { sharedState: { x: 1 }, executionTree: { stageWrites: { x: 1 } } },
      "missing-log",
    ],
    [{ commitLog: null }, "invalid-log"],
    [{ commitLog: "not a log" }, "invalid-log"],
    [{ commitLog: [], initialState: null }, "invalid-base"],
    [{ commitLog: [], initialState: [] }, "invalid-base"],
    [{ commitLog: [], initialState: new Date() }, "invalid-base"],
  ])(
    "refuses unsupported envelope %j with %s instead of fabricating a record",
    (record, code) => {
      expect(adaptFlowRecord(selection(record))).toMatchObject({
        status: "refused",
        code,
      });
    }
  );

  it("requires a label and a supported explicit format", () => {
    expect(
      adaptFlowRecord(selection({ commitLog: [] }, { sourceId: " " }))
    ).toMatchObject({
      status: "refused",
      code: "invalid-source-id",
    });
    expect(
      adaptFlowRecord({
        ...selection({ commitLog: [] }),
        // @ts-expect-error Also refuse unsupported formats supplied by JavaScript callers.
        format: "stageWrites",
      })
    ).toMatchObject({ status: "refused", code: "unsupported-format" });
  });

  it("requires an explicit read-evidence choice from JavaScript callers too", () => {
    expect(
      adaptFlowRecord({
        ...selection({ commitLog: [] }),
        // @ts-expect-error Missing evidence is not an implicit assertion of no reads.
        reads: undefined,
      })
    ).toMatchObject({ status: "refused", code: "invalid-read-evidence" });
    expect(
      adaptFlowRecord({
        ...selection({ commitLog: [] }),
        // @ts-expect-error A supplied strategy must implement Foottrace's read interface.
        reads: { status: "supplied", source: {} },
      })
    ).toMatchObject({ status: "refused", code: "invalid-read-evidence" });
  });
});
