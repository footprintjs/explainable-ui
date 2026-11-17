import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildTraceWalk, formatTraceWalk, projectTraceInvocation, type TraceWalkOptions } from "../../src/index";

// Untouched output from the actual FootPrint output-handoff recorder. The
// repeated and nested mounts retain their original histories and addresses.
const recording = JSON.parse(readFileSync("test/fixtures/subflow-handoff/recording.json", "utf8"));
const fixture = () => structuredClone(recording.runtimeSnapshot);
function rootWalk(snapshot: ReturnType<typeof fixture>, beforeCommitIdx = 3, runtimeSnapshot: unknown = snapshot) {
  const options: TraceWalkOptions = { beforeCommitIdx, runtimeSnapshot };
  return buildTraceWalk(snapshot.commitLog, snapshot.executionTree, "renamed", options);
}

describe("detached recorded output handoffs", () => {
  it.each([["child#2", 3], ["child#9", 8]])("enriches %s with the exact captured child cutoff", (mount, cutoff) => {
    const snapshot = fixture(), before = JSON.stringify(snapshot);
    const walk = rootWalk(snapshot, Number(cutoff));
    expect(walk.stops[0].runtimeStageId).toBe(mount);
    expect(walk.stops[0].handoffSources).toEqual([{
      key: "middleOutput", mountRuntimeStageId: mount, invocationPath: [mount], beforeCommitIdx: 3,
    }]);
    expect(formatTraceWalk(walk, () => null)).toContain("Output mapping observed child reads:");
    expect(JSON.stringify(snapshot)).toBe(before);
    const source = walk.stops[0].handoffSources![0];
    expect(Object.isFrozen(source)).toBe(true);
    expect(Object.isFrozen(source.invocationPath)).toBe(true);
    snapshot.subflowResults[String(mount)].outputHandoff.writes[0].reads[0] = "changed";
    expect(source.key).toBe("middleOutput");
  });

  it.each([
    ["child#2", "child/inner#4"], ["child#9", "child/inner#11"],
  ])("keeps the %s nested question on its own rail", (mount, inner) => {
    const snapshot = fixture();
    const selected = projectTraceInvocation(snapshot, mount, { invocationPath: [mount] });
    expect(selected.availability.ok).toBe(true);
    const walk = buildTraceWalk(selected.commitLog, selected.executionTree, "middleOutput", {
      scope: selected.scope, runtimeSnapshot: snapshot,
    });
    expect(walk.stops[0].runtimeStageId).toBe(inner);
    expect(walk.stops[0].handoffSources).toEqual([{
      key: "localOutput", mountRuntimeStageId: inner,
      invocationPath: [mount, inner], beforeCommitIdx: 1,
    }]);
    expect(walk.stops.every(stop => !stop.runtimeStageId.includes("compute"))).toBe(true);
    expect(walk.scope?.invocationPath).toEqual([mount]);
  });

  it("preserves the existing local-only walk when no runtime snapshot is supplied", () => {
    const snapshot = fixture();
    const walk = buildTraceWalk(snapshot.commitLog, snapshot.executionTree, "renamed", { beforeCommitIdx: 3 });
    expect(walk.stops[0].runtimeStageId).toBe("child#2");
    expect(walk.stops.every(stop => stop.handoffSources === undefined)).toBe(true);
    expect(formatTraceWalk(walk, () => null)).toContain("subflow boundary:");
    expect(formatTraceWalk(walk, () => null)).not.toContain("Output mapping observed child reads:");
  });

  it("keeps a recorded-read question bound to its earlier writer and cutoff", () => {
    const snapshot = fixture();
    const walk = buildTraceWalk(snapshot.commitLog, snapshot.executionTree, "renamed", {
      readerCommitIdx: 4, beforeCommitIdx: 4, runtimeSnapshot: snapshot,
    });
    expect(walk.stops[0].runtimeStageId).toBe("child#2");
    expect(walk.stops[0].handoffSources?.[0].invocationPath).toEqual(["child#2"]);
    expect(walk.stops[0].handoffSources?.[0].beforeCommitIdx).toBe(3);
  });

  it("requires admitted complete child units and does not revise a previously returned question on load", () => {
    const snapshot = fixture(), unit = snapshot.subflowResults["child#2"];
    snapshot.subflowResults = {};
    const before = rootWalk(snapshot);
    expect(before.stops[0].handoffSources).toBeUndefined();
    snapshot.subflowResults["child#2"] = unit;
    const after = rootWalk(snapshot);
    expect(after.stops[0].handoffSources).toHaveLength(1);
    expect(before.stops[0].handoffSources).toBeUndefined();
    expect(before.stops).not.toBe(after.stops);
  });

  it.each(["missing", "partial", "wrong-address", "alias-only", "future-cutoff"])("withholds %s evidence", problem => {
    const snapshot = fixture(), unit = snapshot.subflowResults["child#2"];
    if (problem === "missing") delete unit.outputHandoff;
    if (problem === "partial") unit.outputHandoff.status = "partial";
    if (problem === "wrong-address") unit.outputHandoff.child.address.drillPath = ["child#9"];
    if (problem === "alias-only") delete snapshot.subflowResults["child#2"];
    if (problem === "future-cutoff") unit.outputHandoff.child.beforeCommitIdx = unit.treeContext.history.length + 1;
    const walk = rootWalk(snapshot);
    expect(walk.stops[0].handoffSources).toBeUndefined();
    expect(formatTraceWalk(walk, () => null)).toContain("subflow boundary:");
  });

  it("does not invoke accessors while inspecting optional handoff evidence", () => {
    const snapshot = fixture();
    let reads = 0;
    Object.defineProperty(snapshot.subflowResults["child#2"], "outputHandoff", { get() { reads++; return {}; } });
    expect(rootWalk(snapshot).stops[0].handoffSources).toBeUndefined();
    expect(reads).toBe(0);
  });
});
