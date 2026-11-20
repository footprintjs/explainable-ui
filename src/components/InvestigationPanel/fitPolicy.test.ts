import { describe, expect, it, vi } from "vitest";
import { checkInvestigationAttention, checkInvestigationExplanation, fitInvestigationExplanation } from "./admission";

const base = {
  nodeId: "one", attention: [], path: ["one"], alternatives: [], confidence: "incomplete", gaps: [],
  impact: { nodes: [], confidence: "incomplete", gaps: [] },
} as const;
const mark = (evidence: readonly string[] = []) => ({
  kind: "error", reason: "ERROR_RECORDED", evidence,
});
const gap = (evidence: readonly string[] = []) => ({ code: "timeout", evidence });

describe("fit policy boundaries", () => {
  it("reads the default selection and both relationship properties once", () => {
    const rootKeys = vi.fn(Reflect.getOwnPropertyDescriptor);
    const impactKeys = vi.fn(Reflect.getOwnPropertyDescriptor);
    const impact = new Proxy({ ...base.impact, edges: [] }, { getOwnPropertyDescriptor: impactKeys });
    const backward = { nodes: ["one"], edges: [], confidence: "incomplete", gaps: [] };
    const source = new Proxy({ ...base, impact, backward }, { getOwnPropertyDescriptor: rootKeys });
    const fit = fitInvestigationExplanation(source, undefined, "relationships");
    expect(fit.ok).toBe(true);
    for (const key of ["nodeId", "backward"])
      expect(rootKeys.mock.calls.filter(([, name]) => key === name)).toHaveLength(1);
    expect(impactKeys.mock.calls.filter(([, name]) => name === "edges")).toHaveLength(1);
  });

  it("cuts the tail at an overlong reference but continues with subsequent rows", () => {
    const source = { ...base, attention: [mark(["a", "x".repeat(2049), "discarded"]), mark(["next"])] };
    const fit = fitInvestigationExplanation(source);
    expect(fit).toMatchObject({ ok: true, omittedReferences: 2, value: { attention: [
      { evidence: ["a"], omittedReferences: 2 }, { evidence: ["next"] },
    ] } });
    if (!fit.ok) return;
    expect(checkInvestigationExplanation(fit.value, "one")).toEqual({ ok: true, value: fit.value, usage: fit.usage });
  });

  it("never counts malformed tail slots as omitted references", () => {
    const getter = vi.fn(() => "private");
    const evidence = Array<string>(32).fill("x");
    Object.defineProperty(evidence, 32, { get: getter });
    expect(fitInvestigationExplanation({ ...base, attention: [mark(evidence)] })).toMatchObject({
      ok: false, diagnostic: { code: "accessor-field", path: ["attention", 0, "evidence", 32] },
    });
    expect(getter).not.toHaveBeenCalled();
    const sparse = Array<string>(32).fill("x");
    sparse.length = 33;
    expect(fitInvestigationExplanation({ ...base, attention: [mark(sparse)] })).toMatchObject({
      ok: false, diagnostic: { code: "invalid-value", path: ["attention", 0, "evidence", 32] },
    });
  });

  it("refuses declared work past the aggregate raw cap before reading an item of that list", () => {
    const evidence = Array<string>(1024).fill("x");
    const descriptor = vi.fn(Reflect.getOwnPropertyDescriptor);
    const final = new Proxy<string[]>(evidence, { getOwnPropertyDescriptor: descriptor });
    const source = { ...base, gaps: [...Array(63).fill(gap(evidence)), gap(final)] };
    expect(fitInvestigationExplanation(source)).toMatchObject({
      ok: false, diagnostic: {
        code: "limit-exceeded", path: ["gaps", 63, "evidence"],
        limit: "maxFitInputItems", maximum: 65536, observed: 65600,
      },
    });
    expect(descriptor.mock.calls.map(([, key]) => key)).toEqual(["length"]);
  });

  it("rejects sums that cannot be represented exactly in strict and fitting profiles", () => {
    const maximum = Number.MAX_SAFE_INTEGER;
    const claims = { ...base, gaps: [{ ...gap(), omittedReferences: 1 }],
      attention: [{ ...mark(), omittedReferences: maximum }] };
    const occurrences = { ...base, gaps: [{ ...gap(), occurrences: maximum }, gap()] };
    for (const read of [fitInvestigationExplanation, checkInvestigationExplanation]) {
      expect(read(claims, "one")).toMatchObject({
        ok: false, diagnostic: { code: "invalid-value", path: ["attention", 0, "omittedReferences"] },
      });
      expect(read(occurrences, "one")).toMatchObject({
        ok: false, diagnostic: { code: "invalid-value", path: ["gaps", 1, "occurrences"] },
      });
    }
    expect(fitInvestigationExplanation({ ...base, attention: [{ ...mark(Array<string>(33).fill("x")), omittedReferences: maximum }] })).toMatchObject({
      ok: false, diagnostic: { code: "invalid-value", path: ["attention", 0, "omittedReferences"] },
    });
  });

  it("preserves the serialized fit across merging, new cuts and refitting", () => {
    const merged = { ...base, gaps: Array(129).fill(gap(["ref"])) };
    const clipped = { ...base, gaps: [gap(["ref"]), ...Array(128).fill(gap())],
      attention: [mark(Array<string>(32).fill("x".repeat(2048)))] };
    for (const source of [merged, clipped]) {
      const fit = fitInvestigationExplanation(source);
      if (!fit.ok) throw new Error("Expected a fitted gap");
      const refit = fitInvestigationExplanation(JSON.parse(JSON.stringify(fit.value)));
      expect(JSON.stringify(refit)).toBe(JSON.stringify(fit));
    }
  });

  it("keeps explanation-only metadata unread in legacy attention-list admission", () => {
    const getter = vi.fn(() => { throw new Error("unused metadata"); });
    const marked = Object.defineProperty(mark(), "omittedReferences", { get: getter });
    const reported = Object.defineProperty(gap(), "occurrences", { get: getter });
    expect(checkInvestigationAttention({
      nodes: [{ nodeId: "one", attention: [marked] }], confidence: "incomplete", gaps: [reported],
    })).toMatchObject({ ok: true });
    expect(getter).not.toHaveBeenCalled();
  });
});
