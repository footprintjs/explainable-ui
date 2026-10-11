import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { stateAt, timeTravel } from "foottrace";
import {
  createSnapshots,
  subflowResultToSnapshots,
  toVisualizationSnapshots,
} from "../../src/adapters/fromRuntimeSnapshot";
import { createRecordStateReader } from "../../src/adapters/recordState";
import { MemoryInspector } from "../../src/components/MemoryInspector";
import { MemoryPanel } from "../../src/components/MemoryPanel";
import { StageDetailPanel } from "../../src/components/StageDetailPanel";
import { ScopeDiff } from "../../src/components/ScopeDiff";
import { recordStateDisplay } from "../../src/components/_internal/recordStateDisplay";
import { displayValue } from "../../src/components/_internal/displayValue";
import type { FoldedState } from "foottrace";
import fork from "../migration/fixtures/causal-phases/runtime-snapshot-10.0.0.json";
import childFixture from "../fixtures/golden/subflow-loop.json";

describe("M3 — canonical state, selected source and exact boundaries", () => {
  it("uses the actual merged fork state, own stops and recorded continuation boundaries", () => {
    const before = JSON.stringify(fork);
    const rows = toVisualizationSnapshots(fork);
    const a = rows.find((row) => row.runtimeStageId === "a#1")!;
    const b = rows.find((row) => row.runtimeStageId === "b#2")!;
    expect(a.memory).toEqual({ runs: { b: { x: 1 }, a: { y: 2 } } });
    expect(a.recordState).toMatchObject({
      status: "available",
      sourceId: "flow:root",
      stop: { commitIdx: 1, lastCommitIdx: 1 },
      current: { throughCommitIdx: 1 },
      previous: { throughCommitIdx: 0 },
    });
    expect(b.recordState).toMatchObject({
      status: "available",
      stop: { commitIdx: 2, lastCommitIdx: 4 },
      current: { throughCommitIdx: 4 },
      previous: { throughCommitIdx: 1 },
    });
    expect(rows.at(-1)!.memory).toEqual(fork.sharedState);
    expect(JSON.stringify(fork)).toBe(before);
  });

  it("uses the canonical previous stop even when presentation tree order differs", () => {
    const rows = toVisualizationSnapshots(fork);
    const b = rows.find((row) => row.runtimeStageId === "b#2")!;
    const unrelated = createSnapshots([
      { name: "unrelated", memory: { neverRecorded: true } },
    ])[0];
    const view = recordStateDisplay(b, unrelated);
    expect(view.canCompare).toBe(true);
    expect(view.previous).toEqual({ runs: { b: { x: 1 }, a: { y: 2 } } });
    expect(view.previous).not.toHaveProperty("neverRecorded");
  });

  it("retains real child input prologue, history indices and a separate source label", () => {
    const result = Object.values(childFixture.snapshot.subflowResults)[0];
    const before = JSON.stringify(result);
    const rows = subflowResultToSnapshots(result);
    const normalize = rows.find((row) =>
      row.runtimeStageId?.endsWith("normalize#2")
    )!;
    expect(normalize.recordState).toMatchObject({
      status: "available",
      sourceId: "flow:subtree:sf-enrich",
      stop: { commitIdx: 1 },
      previous: {
        throughCommitIdx: 0,
        basis: "log-only",
        state: { rawText: "  Hello GOLDEN Trace  " },
      },
    });
    const canonical = timeTravel({
      history: result.treeContext.history,
      executionTree: result.treeContext.stageContexts,
    });
    for (const row of rows) {
      const stop = canonical.stops.find(
        (stop) => stop.runtimeStageId === row.runtimeStageId
      )!;
      expect(row.memory).toEqual(canonical.stateAt(stop).state);
    }
    expect(JSON.stringify(result)).toBe(before);
  });

  it("never uses final sharedState as a missing initialState", () => {
    const { initialState: _base, ...withoutBase } = fork;
    const row = toVisualizationSnapshots({
      ...withoutBase,
      sharedState: { futureSecret: "not an input" },
    })[0];
    expect(row.memory).not.toHaveProperty("futureSecret");
    expect(row.recordState).toMatchObject({
      status: "available",
      current: { basis: "log-only" },
    });
    expect(recordStateDisplay(row).canCompare).toBe(false);
  });

  it("keeps a valid earlier prefix and qualifies a later dense invalid row at its original index", () => {
    const record = {
      ...fork,
      commitLog: [fork.commitLog[0], null, ...fork.commitLog.slice(1)],
    };
    const rows = toVisualizationSnapshots(record);
    // The next named stop is row2, so the seed's partition includes row1.
    expect(rows[0].recordState).toMatchObject({
      status: "available",
      current: { skipped: [{ index: 1 }] },
    });
    expect(stateAt(record, 0).skipped ?? []).toEqual([]);
    expect(rows.at(-1)!.memory).toEqual(fork.sharedState);
    expect(recordStateDisplay(rows.at(-1)).canCompare).toBe(false);
    expect(record.commitLog[1]).toBeNull();
  });

  it("does not reinterpret a future unknown verb as set or contaminate an earlier complete stop", () => {
    const invalid = {
      ...fork.commitLog[0],
      runtimeStageId: "invalid#4",
      trace: [{ ...fork.commitLog[0].trace[0], verb: "not-a-record-verb" }],
    };
    const commitLog = [...fork.commitLog, invalid];
    const before = JSON.stringify(commitLog);
    const rows = toVisualizationSnapshots({ ...fork, commitLog });
    const b = rows.find((row) => row.runtimeStageId === "b#2")!;
    const join = rows.at(-1)!;
    expect(b.recordState).toMatchObject({
      status: "available",
      current: { throughCommitIdx: 4 },
    });
    if (b.recordState?.status !== "available")
      throw new Error("Missing B state");
    expect(b.recordState.current.skipped ?? []).toEqual([]);
    expect(join.recordState).toMatchObject({
      status: "available",
      current: {
        skipped: [{ index: 6, reason: expect.stringContaining("verb") }],
      },
    });
    expect(join.memory).toEqual(fork.sharedState);
    expect(JSON.stringify(commitLog)).toBe(before);
  });

  it("refuses unsupported envelopes, missing child history and unaddressed stages explicitly", () => {
    const reader = createRecordStateReader({
      sourceId: "chosen",
      format: "snapshot",
      record: { executionTree: fork.executionTree },
      reads: { status: "unknown" },
    });
    expect(reader("seed#0")).toMatchObject({
      status: "unavailable",
      sourceId: "chosen",
      reason: "unsupported-source",
      message: expect.stringContaining("no commitLog"),
    });
    const result = Object.values(childFixture.snapshot.subflowResults)[0];
    const { history: _history, ...treeContext } = result.treeContext;
    const rows = subflowResultToSnapshots({ ...result, treeContext });
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows)
      expect(row.recordState).toMatchObject({
        status: "unavailable",
        message: expect.stringContaining("no history"),
      });
    const unmatched = createRecordStateReader({
      sourceId: "chosen",
      format: "snapshot",
      record: fork,
      reads: { status: "unknown" },
    });
    expect(unmatched("missing#100")).toMatchObject({
      status: "unavailable",
      reason: "stage-not-recorded",
    });
  });

  it("pins Foottrace1.0.1 sparse cursor refusal without repairing or renumbering rows", () => {
    const commitLog = [...fork.commitLog];
    delete commitLog[1];
    const before = Object.keys(commitLog);
    const rows = toVisualizationSnapshots({ ...fork, commitLog });
    expect(rows[0].recordState).toMatchObject({
      status: "unavailable",
      reason: "reader-refused",
    });
    expect(Object.keys(commitLog)).toEqual(before);
    expect(commitLog.length).toBe(fork.commitLog.length);
  });

  it("keeps manual snapshots explicitly caller-owned, without attaching record certainty", () => {
    const rows = createSnapshots([{ name: "manual", memory: { x: 1 } }]);
    expect(rows[0]).not.toHaveProperty("recordState");
    expect(recordStateDisplay(rows[0])).toEqual({
      memory: { x: 1 },
      previous: null,
      canCompare: true,
      notices: [],
    });
  });
});

describe.each([false, true])(
  "M3 — every memory surface preserves evidence (unstyled=%s)",
  (unstyled) => {
    it.each(["current", "previous"] as const)(
      "does not classify changes when only %s carries a qualifier",
      (side) => {
        const original = toVisualizationSnapshots(fork)[1];
        if (original.recordState?.status !== "available")
          throw new Error("Expected canonical evidence");
        const qualifiers: Partial<FoldedState>[] = [
          { basis: "log-only" },
          { redacted: true, redactedPaths: ["withheld"] },
          { skipped: [{ index: 0, reason: "unreadable captured row" }] },
        ];
        for (const qualification of qualifiers) {
          const snapshot = {
            ...original,
            recordState: {
              ...original.recordState,
              [side]: { ...original.recordState[side], ...qualification },
            },
          };
          expect(recordStateDisplay(snapshot).canCompare).toBe(false);
          const inspector = renderToStaticMarkup(
            <MemoryInspector snapshots={[snapshot]} unstyled={unstyled} />
          );
          expect(inspector).toContain("Changes are not classified");
          expect(inspector).not.toContain("10%, transparent"); // no new-key highlight
          for (const element of [
            <MemoryPanel
              snapshots={[snapshot]}
              selectedIndex={0}
              unstyled={unstyled}
            />,
            <StageDetailPanel
              snapshots={[snapshot]}
              selectedIndex={0}
              mode="dev"
              unstyled={unstyled}
            />,
          ]) {
            const html = renderToStaticMarkup(element);
            expect(html).toContain("Changes are not classified");
            expect(html).not.toMatch(
              /No changes|memory-change|memory-unchanged|scope-diff/
            );
          }
        }
      }
    );

    it("does not print the unavailable placeholder as empty state or a trustworthy diff", () => {
      const rows = toVisualizationSnapshots({ ...fork, commitLog: [] });
      const views = [
        <MemoryInspector
          snapshots={rows}
          selectedIndex={0}
          unstyled={unstyled}
        />,
        <MemoryPanel snapshots={rows} selectedIndex={0} unstyled={unstyled} />,
        <StageDetailPanel
          snapshots={rows}
          selectedIndex={0}
          mode="simple"
          unstyled={unstyled}
        />,
        <StageDetailPanel
          snapshots={rows}
          selectedIndex={0}
          mode="dev"
          unstyled={unstyled}
        />,
      ];
      for (const element of views) {
        const html = renderToStaticMarkup(element);
        expect(html).toContain("Recorded state unavailable");
        expect(html).not.toMatch(
          /Empty memory|\/\/ empty|No changes|memory-json|scope-diff|memory-change/
        );
      }
    });

    it("retains log-only, gap and redaction qualifications and suppresses certainty badges", () => {
      const { initialState: _base, ...record } = fork;
      const rows = toVisualizationSnapshots({
        ...record,
        commitLog: [
          { ...fork.commitLog[0], redactedPaths: ["hidden"] },
          null,
          ...fork.commitLog.slice(1),
        ],
      });
      const index = rows.length - 1;
      for (const element of [
        <MemoryPanel
          snapshots={rows}
          selectedIndex={index}
          unstyled={unstyled}
        />,
        <StageDetailPanel
          snapshots={rows}
          selectedIndex={index}
          mode="simple"
          unstyled={unstyled}
        />,
        <StageDetailPanel
          snapshots={rows}
          selectedIndex={index}
          mode="dev"
          unstyled={unstyled}
        />,
      ]) {
        const html = renderToStaticMarkup(element);
        expect(html).toContain("initial state was not recorded");
        expect(html).toContain("hidden");
        expect(html).toContain("skipped record row 1");
        expect(html).toContain("Changes are not classified");
        expect(html).not.toMatch(
          /No changes|memory-change|memory-unchanged|scope-diff/
        );
      }
    });

    it("uses bounded previews for dates, collections, bigints and cycles without crashing", () => {
      const circular: Record<string, unknown> = { self: undefined };
      circular.self = circular;
      const rows = createSnapshots([
        {
          name: "values",
          memory: {
            date: new Date("2026-01-01T00:00:00Z"),
            values: new Set([1]),
            big: 2n,
            circular,
          },
        },
      ]);
      for (const element of [
        <MemoryInspector snapshots={rows} unstyled={unstyled} />,
        <MemoryPanel snapshots={rows} selectedIndex={0} unstyled={unstyled} />,
        <StageDetailPanel
          snapshots={rows}
          selectedIndex={0}
          mode="dev"
          unstyled={unstyled}
        />,
        <ScopeDiff
          previous={null}
          current={rows[0].memory}
          unstyled={unstyled}
        />,
      ]) {
        const html = renderToStaticMarkup(element);
        expect(html).toContain("2026-01-01");
        expect(html).toContain("Set: 1 entries");
        expect(html).toContain("2n");
        expect(html).toContain("repeated reference");
      }
    });
  }
);

it("preserves ordinary JSON display and never calls accessors/toJSON while previewing", () => {
  const ordinary = { a: [1, null, true, { nested: "value" }] };
  expect(displayValue(ordinary)).toBe(JSON.stringify(ordinary));
  expect(displayValue(ordinary, 2)).toBe(JSON.stringify(ordinary, null, 2));
  let calls = 0;
  const value = {
    get hidden() {
      calls++;
      return "secret";
    },
    toJSON() {
      calls++;
      return "secret";
    },
  };
  expect(displayValue(value)).toContain("accessor not read");
  expect(calls).toBe(0);
});
