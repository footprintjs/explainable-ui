import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import * as api from "../../src/index";
const nested = JSON.parse(
  readFileSync("test/fixtures/subflow-tracing/recordings.json", "utf8")
).nested.runtimeSnapshot;
const childId = "pipeline/prepare#8";
const child = nested.subflowResults[childId].treeContext;
const step = (id: string) =>
  child.history.slice(1).findIndex((row: any) => row.runtimeStageId === id) +
    1 || null;
describe("public scoped trace explanations", () => {
  it("exposes an exact invocation projection and explicit detached scope", () => {
    const projected = api.projectTraceInvocation(nested, childId);
    expect(projected.availability).toEqual({ ok: true });
    expect(projected.scope.invocationPath).toEqual([childId]);
    const walk = api.buildTraceWalk(
      projected.commitLog,
      projected.executionTree,
      "total",
      { scope: projected.scope }
    );
    const text = api.formatTraceWalk(walk, step);
    expect(text).toContain("Tracing subflow invocation pipeline/prepare#8");
    expect(text).toContain(
      "present when invocation pipeline/prepare#8 started (input mapping, or state restored on resume)"
    );
    expect(text).not.toContain("never written");
    const copied = JSON.parse(JSON.stringify(walk));
    expect(api.formatTraceWalk(copied, step)).toBe(text);
  });
  it("never describes the raw start bundle as an origin when explicit scope is supplied", () => {
    const scope = { invocationPath: [childId] };
    const walk = api.buildTraceWalk(
      child.history,
      child.stageContexts,
      "total",
      { scope }
    );
    const text = api.formatTraceWalk(walk, step);
    expect(text).toContain("state restored on resume");
    expect(text).not.toContain("reads nothing — origin");
    expect(text).not.toContain("run input — never written");
  });
  it("allows a formatter scope without mutating an existing walk", () => {
    const walk = api.buildTraceWalk(
      child.history.slice(1),
      child.stageContexts,
      "total"
    );
    const before = JSON.stringify(walk);
    const scope = { invocationPath: [childId] };
    expect(api.formatTraceWalk(walk, step, { scope })).toContain(
      "state restored on resume"
    );
    expect(JSON.stringify(walk)).toBe(before);
  });
  it("does not promote aliases or inherited results into an exact invocation", () => {
    expect(
      api.projectTraceInvocation(nested, "pipeline/prepare").availability.ok
    ).toBe(false);
    expect(
      api.projectTraceInvocation(
        {
          ...nested,
          subflowResults: Object.create({
            [childId]: nested.subflowResults[childId],
          }),
        },
        childId
      ).availability.ok
    ).toBe(false);
    expect(
      api.projectTraceInvocation(nested, childId, {
        invocationPath: ["missing#1", childId],
      }).availability.ok
    ).toBe(false);
  });
  it.each(["root", "child"])(
    "refuses an oversized %s mount label before returning a usable scope",
    (level) => {
      const source = structuredClone(nested);
      let node =
        level === "root"
          ? source.executionTree
          : source.subflowResults["pipeline#6"].treeContext.stageContexts;
      while (node && !node.subflowId) node = node.next;
      expect(node).toBeTruthy();
      node.name = "x".repeat(5000);
      const projection = api.projectTraceInvocation(source, "pipeline#6");
      expect(projection.availability).toEqual({
        ok: false,
        reason: "malformed",
      });
      expect(projection.commitLog).toEqual([]);
    }
  );
  it("honors formatter-only reads-off scope without changing the walk", () => {
    const walk = api.buildTraceWalk(
      child.history.slice(1),
      child.stageContexts,
      "total"
    );
    const original = JSON.stringify(walk);
    const text = api.formatTraceWalk(walk, step, {
      scope: { invocationPath: [childId], readsAvailable: false },
    });
    expect(text).toContain("reads were not recorded");
    expect(text).not.toContain("reads nothing — origin");
    expect(JSON.stringify(walk)).toBe(original);
  });
  it("clones and freezes scope and never shares scope between walks", () => {
    const input = {
      invocationPath: [childId],
      mountLabels: { "seed#1": "Nested" },
      readsAvailable: false,
    };
    const walk = api.buildTraceWalk(
      child.history.slice(1),
      child.stageContexts,
      "total",
      { scope: input }
    );
    input.invocationPath[0] = "other#2";
    input.mountLabels["seed#1"] = "Changed";
    expect(walk.scope?.invocationPath).toEqual([childId]);
    expect(walk.scope?.mountLabels?.["seed#1"]).toBe("Nested");
    expect(Object.isFrozen(walk.scope)).toBe(true);
    expect(Object.isFrozen(walk.scope?.invocationPath)).toBe(true);
    expect(walk.readsAvailable).toBe(false);
    expect(api.buildTraceWalk([], undefined, "x").scope).toBeUndefined();
  });
  it("does not execute scope accessors or retain mutable formatter overrides", () => {
    let calls = 0;
    const hostile = {
      invocationPath: [childId],
      mountLabels: Object.defineProperty({}, "x", {
        enumerable: true,
        get() {
          calls++;
          return "trap";
        },
      }),
    };
    expect(() =>
      api.buildTraceWalk([], undefined, "x", { scope: hostile })
    ).toThrow(
      "Trace scope must contain only bounded recorded names and flags."
    );
    expect(calls).toBe(0);
    expect(() =>
      api.formatTraceWalk(api.buildTraceWalk([], undefined, "x"), () => null, {
        scope: hostile,
      })
    ).toThrow(
      "Trace scope must contain only bounded recorded names and flags."
    );
    expect(calls).toBe(0);
  });
  it("validates an explicitly supplied exact ancestry chain", () => {
    const projected = api.projectTraceInvocation(nested, childId, {
      invocationPath: ["pipeline#6", childId],
    });
    expect(projected.availability).toEqual({ ok: true });
    expect(projected.scope.invocationPath).toEqual(["pipeline#6", childId]);
    const wrongBranch = api.projectTraceInvocation(nested, childId, {
      invocationPath: ["prepare#1", childId],
    });
    expect(wrongBranch.availability).toEqual({
      ok: false,
      reason: "ancestor-not-recorded",
    });
  });
});
