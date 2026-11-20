import { describe, expect, it, vi } from "vitest";
import * as wording from "./wording";
import { gapMessages, investigationGapMessage, resolveInvestigationMarkLabel } from "./wording";

// Frozen 8bc default wording, a regression oracle only (not a runtime owner).
const expectedGaps = [
  ["not-collected", "Some evidence was not collected."],
  ["untracked-input", "An input's earlier origin is unknown."],
  ["redacted", "Some evidence is hidden."],
  ["conservative", "The recorded relationship is uncertain."],
  ["scope-boundary", "Evidence stops at an execution boundary."],
  ["invalid-data", "Some recorded evidence could not be read."],
  ["unavailable", "Some evidence is unavailable."],
  ["timeout", "The evidence search reached its time allowance."],
  ["cancelled", "The evidence search was cancelled."],
  ["cycle", "A repeated dependency could not be resolved."],
  ["node-limit", "The evidence search reached its item allowance."],
  ["depth-limit", "The evidence search reached its depth allowance."],
  ["edge-limit", "The evidence search reached its relationship allowance."],
  ["call-limit", "The evidence search reached its request allowance."],
  ["truncated", "The recorded evidence is incomplete."],
  ["strategy-failed", "Candidate ordering is unavailable."],
  ["not-checked", "Some evidence has not been checked."],
  ["no-match", "No matching evidence was found."],
  ["ambiguous", "More than one explanation remains possible."],
  ["stale", "Some evidence belongs to an earlier recording."],
  ["incompatible", "Some evidence uses an unsupported format."],
  ["unsupported", "Some evidence is unsupported."],
  ["not-permitted", "Some evidence is unavailable for this view."],
] as const;
const expectedMarks = [
  ["error", "Recorded error"], ["unknown-effect", "Outcome unknown"],
  ["gave-up", "Stopped retrying"], ["timeout", "Timed out"],
  ["retried", "Retried"], ["quality-drop", "Quality changed"],
  ["not-collected", "Evidence unavailable"], ["outlier", "Unusual result"],
] as const;

describe("pure canonical gap sentences", () => {
  it.each(expectedGaps)("preserves the exact existing sentence for %s", (code, sentence) => {
    expect(investigationGapMessage(code)).toBe(sentence);
  });
  it("has one frozen internal bank and no second default-name accessor on the facade", () => {
    expect(Object.keys(gapMessages)).toHaveLength(23);
    expect(Object.isFrozen(gapMessages)).toBe(true);
    expect(Reflect.set(gapMessages, "timeout", "changed")).toBe(false);
    expect(investigationGapMessage("timeout")).toBe("The evidence search reached its time allowance.");
    expect(Object.keys(wording).sort()).toEqual(["gapMessages", "investigationGapMessage", "resolveInvestigationMarkLabel"].sort());
  });
  it.each(["", "TIMEOUT", " timeout", "timeout ", "future-code", "constructor", "__proto__", "toString"])("has no invented sentence for %j", code => {
    expect(investigationGapMessage(code)).toBeUndefined();
  });
  it("rejects runtime nonstrings without coercion, even revoked Proxies", () => {
    const coerce = vi.fn(() => "timeout");
    const revoked = Proxy.revocable({}, {}); revoked.revoke();
    for (const value of [undefined, null, 1, true, Symbol("timeout"), new String("timeout"), { toString: coerce, [Symbol.toPrimitive]: coerce }, revoked.proxy]) {
      expect(investigationGapMessage(value as string)).toBeUndefined();
    }
    expect(coerce).not.toHaveBeenCalled();
  });
  it("rejects longer-than-longest keys before any fixed-bank own lookup", () => {
    const original = Object.prototype.hasOwnProperty;
    let bankLookups = 0;
    const spy = vi.spyOn(Object.prototype, "hasOwnProperty").mockImplementation(function (this: object, key: PropertyKey) {
      if (this === gapMessages) bankLookups++;
      return original.call(this, key);
    });
    let shortResult: string | undefined, longResult: string | undefined, before = 0, after = 0;
    try {
      shortResult = investigationGapMessage("strategy-failed");
      before = bankLookups;
      longResult = investigationGapMessage("x".repeat(16));
      after = bankLookups;
    } finally { spy.mockRestore(); }
    expect(shortResult).toBe("Candidate ordering is unavailable.");
    expect(before).toBe(1);
    expect(longResult).toBeUndefined();
    expect(after).toBe(before);
  });
});

describe("used mark label resolution", () => {
  it.each(expectedMarks)("keeps the exact default for %s", (kind, label) => {
    expect(resolveInvestigationMarkLabel(undefined, kind)).toBe(label);
    expect(resolveInvestigationMarkLabel({}, kind)).toBe(label);
  });
  it("preserves raw unknown kinds and admits known, unknown and raw-equal overrides", () => {
    expect(resolveInvestigationMarkLabel(undefined, "future-kind")).toBe("future-kind");
    expect(resolveInvestigationMarkLabel(undefined, "constructor")).toBe("constructor");
    expect(resolveInvestigationMarkLabel({ error: "Host wording" }, "error")).toBe("Host wording");
    expect(resolveInvestigationMarkLabel({ "future-kind": "Host future wording" }, "future-kind")).toBe("Host future wording");
    expect(resolveInvestigationMarkLabel({ error: "error" }, "error")).toBe("error");
    expect(resolveInvestigationMarkLabel({ error: " " }, "error")).toBe(" ");
  });
  it.each([undefined, null, false, 0, "host", () => "host"])("falls back for nonobject labels %j", labels => {
    expect(resolveInvestigationMarkLabel(labels, "error")).toBe("Recorded error");
  });
  it.each([undefined, null, 1, false, "", "x".repeat(513)])("keeps fallback for an invalid used scalar value", value => {
    expect(resolveInvestigationMarkLabel({ error: value }, "error")).toBe("Recorded error");
    expect(resolveInvestigationMarkLabel({ "future-kind": value }, "future-kind")).toBe("future-kind");
  });
  it.each([new String("host"), { text: "Host quotation", quote: true }])("adds a reason for an object supplied outside a parts list", value => {
    expect(resolveInvestigationMarkLabel({ error: value }, "error")).toEqual({
      fallback: "Recorded error", diagnostic: { code: "invalid-value", path: [] },
    });
  });
  it("counts the 512-unit boundary as UTF-16 without trimming or truncating", () => {
    const exact = "😀".repeat(256);
    expect(exact.length).toBe(512);
    expect(resolveInvestigationMarkLabel({ error: exact }, "error")).toBe(exact);
    expect(resolveInvestigationMarkLabel({ error: exact + "x" }, "error")).toBe("Recorded error");
  });
  it("ignores inherited/accessor/unused entries without executing getters", () => {
    const getter = vi.fn(() => "Host getter");
    const inherited = Object.create({ error: "Inherited wording" });
    expect(resolveInvestigationMarkLabel(inherited, "error")).toBe("Recorded error");
    const labels = Object.defineProperty({ error: "Own wording" }, "unused", { get: getter });
    expect(resolveInvestigationMarkLabel(labels, "error")).toBe("Own wording");
    const accessor = Object.defineProperty({}, "error", { get: getter });
    expect(resolveInvestigationMarkLabel(accessor, "error")).toBe("Recorded error");
    expect(getter).not.toHaveBeenCalled();
  });
  it("reads only one used descriptor without enumerating, cloning, freezing or mutating the map", () => {
    const forbidden = vi.fn(() => { throw new Error("Forbidden host-map operation"); });
    const descriptor = vi.fn((target: object, key: string | symbol) => Reflect.getOwnPropertyDescriptor(target, key));
    const labels = new Proxy({ error: "Own wording" }, {
      getOwnPropertyDescriptor: descriptor, get: forbidden, ownKeys: forbidden,
      getPrototypeOf: forbidden, preventExtensions: forbidden, set: forbidden,
      defineProperty: forbidden, deleteProperty: forbidden,
    });
    expect(resolveInvestigationMarkLabel(labels, "error")).toBe("Own wording");
    expect(descriptor).toHaveBeenCalledTimes(1);
    expect(descriptor.mock.calls[0]![1]).toBe("error");
    expect(forbidden).not.toHaveBeenCalled();
  });
  it("falls back from thrown/revoked Proxies without inspecting foreign errors or data values", () => {
    const inspect = vi.fn(() => { throw new Error("Do not inspect"); });
    const foreign = new Proxy({}, { get: inspect, getPrototypeOf: inspect, ownKeys: inspect, getOwnPropertyDescriptor: inspect });
    const labels = new Proxy({}, { getOwnPropertyDescriptor() { throw foreign; } });
    expect(resolveInvestigationMarkLabel(labels, "error")).toBe("Recorded error");
    expect(resolveInvestigationMarkLabel({ error: foreign }, "error")).toEqual({
      fallback: "Recorded error", diagnostic: { code: "invalid-value", path: [] },
    });
    const revoked = Proxy.revocable({}, {}); revoked.revoke();
    expect(resolveInvestigationMarkLabel(revoked.proxy, "future-kind")).toBe("future-kind");
    expect(inspect).not.toHaveBeenCalled();
  });
  it("keeps no wording cache when a host replaces its map", () => {
    const first = Object.freeze({ error: "First wording" });
    const second = Object.freeze({ error: "Second wording" });
    expect(resolveInvestigationMarkLabel(first, "error")).toBe("First wording");
    expect(resolveInvestigationMarkLabel(second, "error")).toBe("Second wording");
    expect(first.error).toBe("First wording");
  });
});
