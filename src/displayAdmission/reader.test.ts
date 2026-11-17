import { describe, expect, it } from "vitest";
import {
  failureExplanationDisplayLimits,
  investigationDisplayLimits,
  runDisplayCheck,
  type DisplayPath,
} from "../displayAdmission";

describe("shared bounded display reader", () => {
  it("counts repeated UTF-16 text and list slots exactly without freezing a legacy list value", () => {
    const result = runDisplayCheck({ maxTextCodeUnits: 4 }, reader =>
      reader.list(["😀", "😀"], ["unknowns"], 2, "maxItemsPerList", (value, path) =>
        reader.text(value, path, 4, "maxReferenceOrUnknownCodeUnits")));
    expect(result).toEqual({ ok: true, value: ["😀", "😀"], usage: { textCodeUnits: 4, listItems: 2 } });
    expect(Object.isFrozen(result)).toBe(true);
    if (!result.ok) throw new Error("expected admitted projection");
    expect(Object.isFrozen(result.usage)).toBe(true);
    expect(Object.isFrozen(result.value)).toBe(false);
  });

  it("checks a field ceiling before the aggregate text allowance and exposes no refused usage", () => {
    const result = runDisplayCheck({ maxTextCodeUnits: 1 }, reader =>
      reader.text("AB", ["problem", "text"], 1, "maxFindingCodeUnits"));
    expect(result).toEqual({ ok: false, diagnostic: { code: "limit-exceeded", path: ["problem", "text"],
      limit: "maxFindingCodeUnits", maximum: 1, observed: 2 } });
    expect(result).not.toHaveProperty("usage");
    expect(result).not.toHaveProperty("value");
  });

  it("charges a captured list length before inspecting entries", () => {
    const values = ["a", "b"];
    let getters = 0;
    Object.defineProperty(values, "0", { get() { getters++; throw new Error("private input"); } });
    const result = runDisplayCheck({ maxTextCodeUnits: 100, maxTotalListItems: 1 }, reader =>
      reader.list(values, ["unknowns"], 2, "maxItemsPerList", (value, path) =>
        reader.text(value, path, 10, "maxReferenceOrUnknownCodeUnits")));
    expect(result).toEqual({ ok: false, diagnostic: { code: "limit-exceeded", path: ["unknowns"],
      limit: "maxTotalListItems", maximum: 1, observed: 2 } });
    expect(getters).toBe(0);
  });

  it("copies own array entries without caller methods or inherited hole values", () => {
    let reads = 0;
    const values = ["a", "b"];
    Object.defineProperty(values, "map", { get() { reads++; throw new Error("input method"); } });
    Object.defineProperty(values, Symbol.iterator, { get() { reads++; throw new Error("input iterator"); } });
    const parse = (input: unknown) => runDisplayCheck({ maxTextCodeUnits: 10 }, reader =>
      reader.list(input, ["unknowns"], 2, "maxItemsPerList", (value, path) =>
        reader.text(value, path, 10, "maxReferenceOrUnknownCodeUnits")));
    expect(parse(values)).toEqual({ ok: true, value: ["a", "b"], usage: { textCodeUnits: 2, listItems: 2 } });
    const hole = new Array(1);
    Object.setPrototypeOf(hole, Object.create(Array.prototype, {
      0: { get() { reads++; throw new Error("inherited entry"); } },
    }));
    expect(parse(hole)).toEqual({ ok: false, diagnostic: { code: "invalid-value", path: ["unknowns", 0] } });
    expect(reads).toBe(0);
  });

  it("refuses accessor fields without executing them", () => {
    let getters = 0;
    const input = Object.defineProperty({}, "text", { get() { getters++; throw new Error("private text"); } });
    const result = runDisplayCheck({ maxTextCodeUnits: 10 }, reader =>
      reader.text(reader.field(input, "text", ["problem", "text"]), ["problem", "text"], 10, "maxTextCodeUnits"));
    expect(result).toEqual({ ok: false, diagnostic: { code: "accessor-field", path: ["problem", "text"] } });
    expect(getters).toBe(0);
  });

  it("classifies foreign thrown values only by refusal-token identity", () => {
    let inspections = 0;
    const trap = () => { inspections++; throw new Error("PRIVATE_FOREIGN_ERROR"); };
    const hostile = new Proxy({}, { get: trap, getPrototypeOf: trap, ownKeys: trap, getOwnPropertyDescriptor: trap });
    const callable = new Proxy(() => undefined, { get: trap, getPrototypeOf: trap, ownKeys: trap, getOwnPropertyDescriptor: trap });
    const revoked = Proxy.revocable({}, {}); revoked.revoke();
    for (const foreign of [new Error("PRIVATE_FOREIGN_ERROR"), hostile, callable, revoked.proxy, "PRIVATE_FOREIGN_ERROR", null]) {
      const result = runDisplayCheck({ maxTextCodeUnits: 10 }, () => { throw foreign; });
      expect(result).toEqual({ ok: false, diagnostic: { code: "unreadable-input", path: [] } });
      expect(JSON.stringify(result)).not.toContain("PRIVATE_FOREIGN_ERROR");
    }
    expect(inspections).toBe(0);
  });

  it("detaches and freezes valid diagnostics, replacing bad internal paths with a fixed refusal", () => {
    const supplied = ["canonicalFindings", "causes", 0, "code"] as DisplayPath;
    const result = runDisplayCheck({ maxTextCodeUnits: 10 }, reader => reader.fail("invalid-code", supplied));
    expect(result).toEqual({ ok: false, diagnostic: { code: "invalid-code", path: ["canonicalFindings", "causes", 0, "code"] } });
    if (result.ok) throw new Error("expected refusal");
    Object.defineProperty(supplied, "0", { value: "summary" });
    expect(result.diagnostic.path).toEqual(["canonicalFindings", "causes", 0, "code"]);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.diagnostic)).toBe(true);
    expect(Object.isFrozen(result.diagnostic.path)).toBe(true);
    for (const path of [["PRIVATE_NODE_ID"], ["nodes", -1], ["nodes", 1025], ["nodes", 0.5], Array(9).fill("nodes")]) {
      expect(runDisplayCheck({ maxTextCodeUnits: 10 }, reader => reader.fail("invalid-code", path as DisplayPath)))
        .toEqual({ ok: false, diagnostic: { code: "unreadable-input", path: [] } });
    }
    expect(Object.isFrozen(investigationDisplayLimits)).toBe(true);
    expect(Object.isFrozen(failureExplanationDisplayLimits)).toBe(true);
    expect(typeof failureExplanationDisplayLimits.findingCodePattern).toBe("string");
  });
});
