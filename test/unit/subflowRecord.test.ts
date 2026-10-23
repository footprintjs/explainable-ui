import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { toVisualizationSnapshots } from "../../src/adapters/fromRuntimeSnapshot";
import {
  exactSubflowResults,
  resolveSubflowLevel,
} from "../../src/components/ExplainableShell/_internal/subflowRecord";
import type { NarrativeEntry } from "../../src/types";
const fixture = JSON.parse(
  readFileSync("test/fixtures/subflow-tracing/recordings.json", "utf8")
).nested;
describe("selected-record projection cache", () => {
  it("reuses names and rail projection but binds nested children from the latest result map", () => {
    const source = structuredClone(fixture.runtimeSnapshot);
    const parent = toVisualizationSnapshots(source);
    const results = exactSubflowResults(source.subflowResults)!;
    const first = resolveSubflowLevel({
      parent,
      key: "pipeline",
      parentPath: [],
      sourceRunId: "run",
      readsAvailable: true,
      results: results,
      narrative: fixture.narrativeEntries as NarrativeEntry[],
    });
    const again = resolveSubflowLevel({
      parent,
      key: "pipeline",
      parentPath: [],
      sourceRunId: "run",
      readsAvailable: true,
      results: results,
      narrative: fixture.narrativeEntries as NarrativeEntry[],
    });
    expect(first.kind).toBe("found");
    expect(again.kind).toBe("found");
    if (first.kind !== "found" || again.kind !== "found")
      throw Error("missing fixture");
    expect(again.entry.traceScope).toBe(first.entry.traceScope);
    const replacement = structuredClone(results["pipeline/prepare#8"]);
    const nextResults = { ...results, "pipeline/prepare#8": replacement };
    const changed = resolveSubflowLevel({
      parent,
      key: "pipeline",
      parentPath: [],
      sourceRunId: "run",
      readsAvailable: true,
      results: nextResults,
      narrative: fixture.narrativeEntries as NarrativeEntry[],
    });
    expect(changed.kind).toBe("found");
    if (changed.kind !== "found") throw Error("missing fixture");
    expect(
      changed.entry.snapshots.find(
        (stage) => stage.runtimeStageId === "pipeline/prepare#8"
      )?.subflowResult
    ).toBe(replacement);
  });
  it("refuses a path-only alias even when a partial record appears to have one visit", () => {
    const result = {
      subflowId: "only",
      treeContext: { stageContexts: { runtimeStageId: "only/step#2" } },
    };
    expect(exactSubflowResults({ only: result })).toEqual({});
  });
  it("keeps only explicit invocation witnesses rather than guessing a missing visit", () => {
    const result = {
      subflowId: "only",
      treeContext: { stageContexts: { runtimeStageId: "only/step#2" } },
    };
    expect(exactSubflowResults({ only: result, "only#9": result })).toEqual({
      "only#9": result,
    });
  });
});
