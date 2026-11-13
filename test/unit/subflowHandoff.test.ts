import { describe, expect, it } from "vitest";
import { subflowHandoffSources } from "../../src/trace/subflowHandoff";

const address = (drillPath: string[] = []) => ({ logRunId: "run-1", drillPath });
const commit = (runtimeStageId: string, path: string) => ({
  runtimeStageId, stageId: runtimeStageId.split("#")[0], stage: runtimeStageId,
  trace: [{ path }], overwrite: { [path]: 1 },
});
function fixture() {
  const child = {
    treeContext: {
      logAddress: address(["worker#1"]),
      history: [commit("worker#1", "input"), commit("worker/compute#2", "childValue"), commit("worker/later#3", "childValue")],
      stageContexts: { runtimeStageId: "worker/compute#2", stageReads: { input: 1 }, next: { runtimeStageId: "worker/later#3", stageReads: { input: 1 } } },
    },
    outputHandoff: {
      version: 1, attribution: "observed-read-prefix", status: "captured", limitations: [] as string[],
      parent: { address: address(), runtimeStageId: "worker#1", commitIdx: 1 },
      child: { address: address(["worker#1"]), beforeCommitIdx: 2 },
      writes: [{ path: "answer", reads: ["childValue"] }],
    },
  };
  const snapshot = {
    logAddress: address(),
    commitLog: [commit("seed#0", "input"), commit("worker#1", "answer"), commit("consume#4", "final")],
    executionTree: { runtimeStageId: "seed#0", children: [{ runtimeStageId: "worker#1", subflowId: "worker", name: "Worker" }], next: { runtimeStageId: "consume#4", stageReads: { answer: 1 } } },
    subflowResults: { "worker#1": child },
  };
  return { snapshot, child, handoff: child.outputHandoff };
}
const sources = (snapshot: unknown, writtenKeys = ["answer"], beforeCommitIdx = 2) => subflowHandoffSources({
  snapshot, invocationPath: [], mountRuntimeStageId: "worker#1", writtenKeys, beforeCommitIdx,
});

describe("recorded subflow output handoffs", () => {
  it("keeps renamed child sources separate and converts the exact raw cutoff past the seed", () => {
    const { snapshot } = fixture();
    const before = JSON.stringify(snapshot);
    const result = sources(snapshot);
    expect(result).toEqual([{ key: "childValue", mountRuntimeStageId: "worker#1", invocationPath: ["worker#1"], beforeCommitIdx: 1 }]);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result[0])).toBe(true);
    expect(Object.isFrozen(result[0].invocationPath)).toBe(true);
    expect(JSON.stringify(snapshot)).toBe(before);
    expect(sources(snapshot, ["unrelated"])).toEqual([]);
  });

  it.each(["explicit-output", "privacy-active", "budget-exhausted", "output-mutated"])("withholds partial %s evidence", limitation => {
    const { snapshot, handoff } = fixture();
    handoff.status = "partial";
    handoff.limitations = [limitation];
    expect(sources(snapshot)).toEqual([]);
    handoff.status = "captured";
    expect(sources(snapshot)).toEqual([]);
  });

  it.each(["parent-run", "child-run", "parent-path", "child-path", "context-address"])("rejects the wrong %s identity", problem => {
    const { snapshot, handoff, child } = fixture();
    if (problem === "parent-run") handoff.parent.address.logRunId = "other";
    if (problem === "child-run") handoff.child.address.logRunId = "other";
    if (problem === "parent-path") handoff.parent.address.drillPath.push("other#0");
    if (problem === "child-path") handoff.child.address.drillPath[0] = "worker#5";
    if (problem === "context-address") child.treeContext.logAddress.drillPath[0] = "worker#5";
    expect(sources(snapshot)).toEqual([]);
  });

  it("requires actual surviving parent write rows within the selected prefix", () => {
    const { snapshot, handoff } = fixture();
    expect(sources(snapshot, ["answer"], 1)).toEqual([]);
    handoff.writes[0].path = "not-written";
    expect(sources(snapshot, ["not-written"])).toEqual([]);
    handoff.writes[0].path = "answer";
    handoff.parent.commitIdx = 0;
    expect(sources(snapshot)).toEqual([]);
  });

  it("does not revive a handoff superseded by a later write", () => {
    const { snapshot } = fixture();
    snapshot.commitLog[2] = commit("consume#4", "answer");
    expect(sources(snapshot, ["answer"], 3)).toEqual([]);
    expect(sources(snapshot, ["answer"], 2)).toHaveLength(1);
  });

  it("rejects a future child cutoff and a missing exact invocation instead of using a path alias", () => {
    const { snapshot, handoff, child } = fixture();
    handoff.child.beforeCommitIdx = 4;
    expect(sources(snapshot)).toEqual([]);
    handoff.child.beforeCommitIdx = 2;
    const aliased = { ...snapshot, subflowResults: { worker: child } };
    expect(sources(aliased)).toEqual([]);
  });

  it("dates nested parent and child cutoffs on their own histories, excluding each seed", () => {
    const { snapshot: inner, child, handoff } = fixture();
    const parentPath = ["outer#0"];
    handoff.parent.address = address(parentPath);
    handoff.parent.commitIdx = 2;
    handoff.child.address = address([...parentPath, "worker#1"]);
    child.treeContext.logAddress = address([...parentPath, "worker#1"]);
    const snapshot = {
      logAddress: address(), commitLog: [commit("outer#0", "top")],
      executionTree: { runtimeStageId: "outer#0", subflowId: "outer" },
      subflowResults: {
        "outer#0": { treeContext: {
          logAddress: address(parentPath),
          history: [commit("outer#0", "input"), ...inner.commitLog],
          stageContexts: inner.executionTree,
        } },
        "worker#1": child,
      },
    };
    expect(subflowHandoffSources({
      snapshot, invocationPath: parentPath, mountRuntimeStageId: "worker#1",
      writtenKeys: ["answer"], beforeCommitIdx: 2,
    })).toEqual([{ key: "childValue", mountRuntimeStageId: "worker#1", invocationPath: ["outer#0", "worker#1"], beforeCommitIdx: 1 }]);
  });

  it("does not execute accessors or admit duplicate/oversized read prefixes", () => {
    const { snapshot, handoff } = fixture();
    let calls = 0;
    Object.defineProperty(handoff, "writes", { get() { calls++; return []; } });
    expect(sources(snapshot)).toEqual([]);
    expect(calls).toBe(0);
    const next = fixture();
    next.handoff.writes[0].reads = ["childValue", "childValue"];
    expect(sources(next.snapshot)).toEqual([]);
    next.handoff.writes[0].reads = Array.from({ length: 4_097 }, (_, index) => `key${index}`);
    expect(sources(next.snapshot)).toEqual([]);
  });
});
