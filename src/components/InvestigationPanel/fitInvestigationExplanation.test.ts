import { describe, expect, it } from "vitest";
import { canonicalFixturePort, selected } from "../../../test/fixtures/investigation/recorded";
import { checkInvestigationExplanation, fitInvestigationExplanation } from "./admission";

const base = {
  nodeId: "one", attention: [], path: ["one"], alternatives: [], confidence: "incomplete",
  gaps: [], impact: { nodes: [], confidence: "incomplete", gaps: [] },
} as const;
const mark = (evidence: string[]) => ({ kind: "error", reason: "ERROR_RECORDED", evidence });
const gap = (evidence: string[], nodeId?: string) => ({ code: "timeout", nodeId, evidence });

describe("fitInvestigationExplanation", () => {
  it("preserves Foottrace's actual explanation and the strict projection's exact usage", async () => {
    const raw = await canonicalFixturePort().explain(selected, { signal: new AbortController().signal });
    for (const profile of ["text", "relationships"] as const) {
      const strict = checkInvestigationExplanation(raw, selected, profile);
      expect(strict.ok).toBe(true);
      expect(fitInvestigationExplanation(raw, selected, profile)).toEqual({ ...strict, omittedReferences: 0 });
    }
    expect(fitInvestigationExplanation(base, "other")).toEqual(checkInvestigationExplanation(base, "other"));
  });

  it("reports each reference beyond 32 in its own row and preserves repeated references", () => {
    for (const n of [31, 32, 33, 44]) {
      const evidence = Array<string>(n).fill("same");
      const input = { ...base, attention: [mark(evidence)], gaps: [gap(evidence)] };
      const fit = fitInvestigationExplanation(input);
      if (!fit.ok) throw new Error(JSON.stringify(fit.diagnostic));
      const omitted = Math.max(n - 32, 0);
      expect(fit.omittedReferences).toBe(omitted * 2);
      expect(fit.value.attention[0]?.omittedReferences).toBe(omitted || undefined);
      expect(fit.value.gaps[0]?.omittedReferences).toBe(omitted || undefined);
      expect(fit.value.gaps[0]?.evidence).toEqual(evidence.slice(0, 32));
      expect(fitInvestigationExplanation(JSON.parse(JSON.stringify(fit.value)))).toEqual(fit);
      expect(checkInvestigationExplanation(fit.value, "one")).toMatchObject({ ok: true, value: fit.value, usage: fit.usage });
      expect(input.attention[0]?.evidence).toHaveLength(n);
    }
  });

  it("reserves space for all non-reference facts before retaining a global prefix of references", () => {
    const input = { ...base, attention: [mark(Array<string>(32).fill("x".repeat(2048)))], gaps: [gap(["y"])] };
    expect(checkInvestigationExplanation(input, "one")).toMatchObject({ ok: false, diagnostic: { limit: "maxTextCodeUnits" } });
    const fit = fitInvestigationExplanation(input);
    if (!fit.ok) throw new Error(JSON.stringify(fit.diagnostic));
    expect(fit.omittedReferences).toBe(2);
    expect(fit.value.attention[0]?.evidence).toHaveLength(31);
    expect(fit.value.gaps[0]).toMatchObject({ code: "timeout", omittedReferences: 1, evidence: [] });
    expect(fit.usage).toEqual({
      textCodeUnits: 31 * 2048 + 11, listItems: 34,
    });
    const over = { ...base, impact: { ...base.impact, nodes: Array.from({ length: 33 }, (_, i) => String(i).padEnd(2048, "x")) } };
    expect(fitInvestigationExplanation(over)).toMatchObject({ ok: false, diagnostic: { limit: "maxTextCodeUnits" } });
    expect(fitInvestigationExplanation({ ...base, nodeId: "a".repeat(2049) })).toMatchObject({
      ok: false, diagnostic: { limit: "maxStringCodeUnits" },
    });
  });

  it("merges only over-limit gaps with the same code and exact subject inside each coverage scope", () => {
    const first = gap(["a"], "host-a");
    const second = gap(["b"], "host-b");
    const input = { ...base, gaps: [first, second, ...Array(127).fill(first)], impact: { ...base.impact, gaps: [first] } };
    const fit = fitInvestigationExplanation(input);
    if (!fit.ok) throw new Error(JSON.stringify(fit.diagnostic));
    expect(fit.value.gaps).toHaveLength(2);
    expect(fit.value.gaps[0]).toEqual({ code: "timeout", nodeId: "host-a", occurrences: 128, evidence: Array(32).fill("a"), omittedReferences: 96 });
    expect(fit.value.gaps[1]).toEqual(second);
    expect(fit.value.impact.gaps).toEqual([first]);
    expect(fitInvestigationExplanation(fit.value)).toEqual(fit);
    const unique = { ...base, gaps: Array.from({ length: 129 }, (_, i) => gap([], String(i))) };
    expect(fitInvestigationExplanation(unique)).toMatchObject({ ok: false, diagnostic: { limit: "maxGapsPerList" } });
  });

  it("keeps relationship omissions out of the text projection and attached to the correct direction", () => {
    const edge = { from: "one", to: "two", kind: "data", attribution: "recorded-read", evidence: Array(35).fill("ref") };
    const input = {
      ...base, impact: { ...base.impact, nodes: ["two"], edges: [edge] },
      backward: { nodes: ["one", "two"], edges: [edge], confidence: "incomplete", gaps: [] },
    };
    expect(fitInvestigationExplanation(input)).toMatchObject({ ok: true, omittedReferences: 0 });
    const fitted = fitInvestigationExplanation(input, "one", "relationships");
    if (!fitted.ok) throw new Error(JSON.stringify(fitted.diagnostic));
    expect(fitted.omittedReferences).toBe(6);
    expect(fitted.value.backward?.edges[0]?.omittedReferences).toBe(3);
    expect(fitted.value.impact.edges?.[0]?.omittedReferences).toBe(3);
    expect(fitInvestigationExplanation(fitted.value, "one", "relationships")).toEqual(fitted);
  });

  it("refuses malformed and excessive inputs without reading entries past the input bound", () => {
    let calls = 0;
    const evidence = new Array(1_000_000);
    Object.defineProperty(evidence, 0, { get() { calls++; return "x"; } });
    expect(fitInvestigationExplanation({ ...base, attention: [mark(evidence)] })).toMatchObject({ ok: false, diagnostic: { code: "limit-exceeded" } });
    expect(calls).toBe(0);
    const cyclic: unknown[] = [];
    cyclic.push(cyclic);
    expect(fitInvestigationExplanation({ ...base, gaps: [{ code: "timeout", evidence: cyclic }] }).ok).toBe(false);
    const accessor = Object.defineProperty({ ...base }, "nodeId", { get() { calls++; return "one"; } });
    expect(fitInvestigationExplanation(accessor)).toMatchObject({ ok: false, diagnostic: { code: "accessor-field" } });
    expect(calls).toBe(0);
  });
});
