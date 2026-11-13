import { describe, expect, it, vi } from "vitest";
import { recordedPathLabel, recordedValueAtPath, recordedValuePreview } from "../../src/trace/recordedValuePreview";

describe("inert recorded value previews", () => {
  it("reads deep recorded paths, preserves literal dots, and refuses inherited/accessor values", () => {
    const getter = vi.fn(() => "private");
    const memory = { applicant: { address: { zip: 75078 } }, "address.zip": "literal", rows: [{ score: 2 }] };
    Object.defineProperty(memory, "secret", { get: getter });
    expect(recordedValueAtPath(memory, "applicant\u001faddress\u001fzip")).toBe(75078);
    expect(recordedValueAtPath(memory, "rows\u001f0\u001fscore")).toBe(2);
    expect(recordedValueAtPath(memory, "address.zip")).toBe("literal");
    expect(recordedValueAtPath(memory, "toString")).toBeUndefined();
    expect(recordedValueAtPath(memory, "secret")).toBeUndefined();
    expect(getter).not.toHaveBeenCalled();
    expect(recordedPathLabel("applicant\u001faddress\u001fzip")).toBe("applicant › address › zip");
  });
  it("shows falsy values and short arrays without conflating absence", () => {
    expect(recordedValuePreview(undefined)).toBeNull();
    expect(recordedValuePreview(null)).toBe("null");
    expect(recordedValuePreview(0)).toBe("0");
    expect(recordedValuePreview(false)).toBe("false");
    expect(recordedValuePreview([3.1, 3.4, 9.9])).toBe("[3.1, 3.4, 9.9]");
  });
  it("never invokes getters or toJSON and bounds recursive/long values", () => {
    const getter = vi.fn(() => { throw new Error("must not run"); });
    const toJSON = vi.fn(() => "secret");
    const value = { toJSON, nested: { a: { b: { c: 1 } } } };
    Object.defineProperty(value, "token", { enumerable: true, get: getter });
    expect(recordedValuePreview(value)).not.toContain("secret");
    expect(getter).not.toHaveBeenCalled();
    expect(toJSON).not.toHaveBeenCalled();
    expect(recordedValuePreview("a".repeat(10_000))!.length).toBeLessThanOrEqual(100);
    const circular: Record<string, unknown> = {}; circular.self = circular;
    expect(recordedValuePreview(circular)).toContain("[circular]");
  });
});
