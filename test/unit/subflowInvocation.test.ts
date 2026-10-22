import { describe, it, expect } from "vitest";
import {
  resolveSubflowInvocation,
  pathMountChain,
} from "../../src/components/ExplainableShell/_internal/subflowInvocation";
import type { StageSnapshot } from "../../src/types";
const visit = (path: string, index: number): StageSnapshot => ({
  stageName: "same label",
  stageLabel: "same label",
  subflowId: path,
  runtimeStageId: `${path}#${index}`,
  subflowResult: {},
  memory: {},
  narrative: "",
  startMs: 0,
  durationMs: 1,
});
describe("exact subflow invocation selection", () => {
  it("never resolves a nested mount by a root suffix or a label", () => {
    expect(
      resolveSubflowInvocation([visit("prepare", 1)], "pipeline/prepare"),
    ).toEqual({ kind: "missing" });
    expect(
      resolveSubflowInvocation([visit("prepare", 1)], "same label"),
    ).toEqual({ kind: "missing" });
    expect(pathMountChain("pipeline/prepare")).toEqual([
      "pipeline",
      "pipeline/prepare",
    ]);
  });
  it("returns every ambiguous visit, then selects only an explicit cursor or requested ID", () => {
    const stages = [visit("prepare", 1), visit("prepare", 9)];
    expect(resolveSubflowInvocation(stages, "prepare", "else#10")).toEqual({
      kind: "ambiguous",
      visits: [
        { runtimeStageId: "prepare#1", step: 1, visit: 1, total: 2 },
        { runtimeStageId: "prepare#9", step: 2, visit: 2, total: 2 },
      ],
    });
    expect(
      resolveSubflowInvocation(stages, "prepare", "prepare#9"),
    ).toMatchObject({ kind: "found", visit: 2, total: 2 });
    expect(
      resolveSubflowInvocation(stages, "prepare", undefined, "absent#2"),
    ).toMatchObject({ kind: "ambiguous" });
  });
  it("never substitutes an available last visit for a selected visit with missing exact data", () => {
    const first = visit("prepare", 1);
    delete first.subflowResult;
    const stages = [first, visit("prepare", 9)];
    expect(resolveSubflowInvocation(stages, "prepare", "prepare#1")).toEqual({
      kind: "missing",
    });
    expect(
      resolveSubflowInvocation(stages, "prepare", "else#10"),
    ).toMatchObject({
      kind: "ambiguous",
      visits: expect.arrayContaining([
        expect.objectContaining({ runtimeStageId: "prepare#1" }),
      ]),
    });
  });
  it("refuses duplicated invocation identities instead of naming either visit", () => {
    expect(
      resolveSubflowInvocation(
        [visit("prepare", 1), visit("prepare", 1)],
        "prepare",
        "prepare#1",
      ),
    ).toEqual({ kind: "missing" });
  });
});
