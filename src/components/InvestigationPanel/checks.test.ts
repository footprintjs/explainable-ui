import { describe, expect, expectTypeOf, it, vi } from "vitest";
import type { DisplayCheckResult } from "../../displayAdmission";
import { investigationDisplayLimits as limits } from "../../displayAdmission";
import {
  admitAttention,
  admitExplanation,
  admitVisualExplanation,
  checkInvestigationAttention,
  checkInvestigationExplanation,
} from "./admission";
import type { InvestigationRelationshipDisplay, InvestigationTextDisplay } from "./checkTypes";

const edge = () => ({ from: "s", to: "r", kind: "data", attribution: "recorded-read", evidence: ["read"] });
const value = () => ({
  nodeId: "s", attention: [], rootCause: "r", path: ["s", "r"], alternatives: [] as string[],
  confidence: "complete", gaps: [],
  impact: { nodes: ["i"], edges: [{ ...edge(), to: "i", evidence: ["edge"] }], confidence: "complete", gaps: [] },
  backward: { nodes: ["s", "r"], edges: [edge()], confidence: "complete", gaps: [] },
});

function refusal(result: DisplayCheckResult<unknown>, code: string, path: readonly (string | number)[]) {
  expect(result.ok).toBe(false);
  if (result.ok) throw new Error("Expected whole-result refusal");
  expect(result.diagnostic).toMatchObject({ code, path });
  expect(result).not.toHaveProperty("value");
  expect(result).not.toHaveProperty("usage");
  return result.diagnostic;
}

describe("Investigation display check projections", () => {
  it("uses the legacy parser's detached attention value and exact retained-occurrence accounting", () => {
    const raw = {
      nodes: [{ nodeId: "n", attention: [{ kind: "err", reason: "ERROR_RECORDED", evidence: ["ref", "ref"] }] }],
      confidence: "complete", gaps: [{ code: "not-collected", nodeId: "n", evidence: ["r"] }],
    };
    const result = checkInvestigationAttention(raw);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.usage).toEqual({ textCodeUnits: 12, listItems: 6 });
    expect(result.value).toEqual(admitAttention(raw));
    expect(result.value.nodes).not.toBe(raw.nodes);
    raw.nodes[0]!.attention[0]!.evidence[0] = "changed";
    expect(result.value.nodes[0]!.attention[0]!.evidence).toEqual(["ref", "ref"]);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.usage)).toBe(true);
  });

  it("retains relationships only in the explicit profile, with accurate usage and overload types", () => {
    const raw = value();
    const text = checkInvestigationExplanation(raw, "s");
    const relationships = checkInvestigationExplanation(raw, "s", "relationships");
    expectTypeOf(text).toEqualTypeOf<DisplayCheckResult<InvestigationTextDisplay>>();
    expectTypeOf(relationships).toEqualTypeOf<DisplayCheckResult<InvestigationRelationshipDisplay>>();
    expect(text.ok && text.usage).toEqual({ textCodeUnits: 5, listItems: 3 });
    expect(relationships.ok && relationships.usage).toEqual({ textCodeUnits: 19, listItems: 9 });
    if (!text.ok || !relationships.ok) throw new Error("Expected valid projections");
    expect(text.value).toEqual(admitExplanation(raw, "s"));
    expect(relationships.value).toEqual(admitVisualExplanation(raw, "s"));
    expect(text.value).not.toHaveProperty("backward");
    expect(text.value.impact).not.toHaveProperty("edges");
    expect(relationships.value.backward).toEqual(raw.backward);
    expect(relationships.value.impact.edges).toEqual(raw.impact.edges);
    expect(relationships.value.backward!.edges).not.toBe(raw.backward.edges);
  });

  it("keeps legacy ignored graph fields entirely unread, including their accessors", () => {
    const raw = value();
    const getter = vi.fn(() => { throw new Error("PRIVATE_REFERENCE"); });
    Object.defineProperty(raw, "backward", { get: getter });
    Object.defineProperty(raw.impact, "edges", { get: getter });
    expect(checkInvestigationExplanation(raw, "s").ok).toBe(true);
    refusal(checkInvestigationExplanation(raw, "s", "relationships"), "accessor-field", ["impact", "edges"]);
    expect(getter).not.toHaveBeenCalled();
  });

  it("refuses invalid runtime profiles before reading payload data", () => {
    const reflect = vi.fn(() => { throw new Error("PRIVATE_PAYLOAD"); });
    const payload = new Proxy({}, { getOwnPropertyDescriptor: reflect });
    refusal(checkInvestigationExplanation(payload, "PRIVATE_SELECTED_ID", "PRIVATE_PROFILE" as "text"), "invalid-enum", ["projection"]);
    expect(reflect).not.toHaveBeenCalled();
  });

  it("stops at the selected-ID mismatch without exposing either ID or reading later fields", () => {
    const raw = { ...value(), nodeId: "PRIVATE_RETURNED_ID" };
    const later = vi.fn(() => []);
    Object.defineProperty(raw, "path", { get: later });
    const result = checkInvestigationExplanation(raw, "PRIVATE_REQUESTED_ID");
    refusal(result, "selection-mismatch", ["nodeId"]);
    expect(JSON.stringify(result)).not.toContain("PRIVATE_");
    expect(later).not.toHaveBeenCalled();
  });

  it.each([
    { path: ["path", 0], code: "inconsistent-evidence", change: (raw: ReturnType<typeof value>) => { raw.path = ["wrong", "r"]; } },
    { path: ["path"], code: "duplicate-identity", change: (raw: ReturnType<typeof value>) => { raw.path = ["s", "s"]; } },
    { path: ["alternatives"], code: "duplicate-identity", change: (raw: ReturnType<typeof value>) => { raw.alternatives = ["a", "a"]; } },
    { path: ["rootCause"], code: "inconsistent-evidence", change: (raw: ReturnType<typeof value>) => { raw.alternatives = ["a"]; } },
    { path: ["impact", "nodes"], code: "duplicate-identity", change: (raw: ReturnType<typeof value>) => { raw.impact.nodes = ["i", "i"]; } },
    { path: ["backward", "nodes"], code: "inconsistent-evidence", change: (raw: ReturnType<typeof value>) => { raw.backward.nodes = ["r"]; } },
    { path: ["backward", "confidence"], code: "inconsistent-evidence", change: (raw: ReturnType<typeof value>) => { raw.backward.confidence = "incomplete"; } },
    { path: ["backward", "edges", 0, "to"], code: "inconsistent-evidence", change: (raw: ReturnType<typeof value>) => { raw.backward.edges[0]!.to = "PRIVATE_MISSING_ID"; } },
    { path: ["backward", "edges", 0, "kind"], code: "invalid-enum", change: (raw: ReturnType<typeof value>) => { raw.backward.edges[0]!.kind = "PRIVATE_KIND"; } },
    { path: ["backward", "edges", 0, "attribution"], code: "inconsistent-evidence", change: (raw: ReturnType<typeof value>) => { raw.backward.edges[0]!.kind = "control"; raw.backward.edges[0]!.attribution = "recorded-write"; } },
    { path: ["backward", "edges"], code: "inconsistent-evidence", change: (raw: ReturnType<typeof value>) => { raw.backward.edges[0]!.attribution = "stage"; } },
    { path: ["path", 1], code: "inconsistent-evidence", change: (raw: ReturnType<typeof value>) => { raw.backward.edges = []; } },
  ])("reports schema-only $code at $path without changing existing refusal", ({ path, code, change }) => {
    const raw = value(); change(raw);
    const result = checkInvestigationExplanation(raw, "s", "relationships");
    refusal(result, code, path);
    expect(admitVisualExplanation(raw, "s")).toBeUndefined();
    expect(JSON.stringify(result)).not.toContain("PRIVATE_");
  });

  it("preserves supported backward roots when only forward/overall coverage is incomplete", () => {
    const raw = { ...value(), confidence: "incomplete", gaps: [{ code: "edge-limit", evidence: [] }], impact: { ...value().impact, confidence: "incomplete", gaps: [{ code: "edge-limit", evidence: [] }] } };
    const result = checkInvestigationExplanation(raw, "s", "relationships");
    expect(result.ok && result.value.rootCause).toBe("r");
  });

  it("does not inspect foreign thrown objects, even a Proxy, while returning one fixed fallback", () => {
    const inspect = vi.fn(() => { throw new Error("Must not inspect thrown data"); });
    const foreign = new Proxy({}, { get: inspect, getPrototypeOf: inspect, ownKeys: inspect, getOwnPropertyDescriptor: inspect });
    const payload = new Proxy({}, { getOwnPropertyDescriptor() { throw foreign; } });
    const result = checkInvestigationAttention(payload);
    expect(result).toEqual({ ok: false, diagnostic: { code: "unreadable-input", path: [] } });
    expect(inspect).not.toHaveBeenCalled();
  });

  it("keeps holes/accessors refused and never calls caller array methods or iterators", () => {
    const raw = value();
    const method = vi.fn(() => { throw new Error("PRIVATE_METHOD"); });
    Object.defineProperty(raw.path, "map", { get: method });
    Object.defineProperty(raw.path, Symbol.iterator, { get: method });
    expect(checkInvestigationExplanation(raw, "s").ok).toBe(true);
    expect(method).not.toHaveBeenCalled();
    const holes = { ...value(), path: new Array(2) };
    refusal(checkInvestigationExplanation(holes, "s"), "invalid-value", ["path", 0]);
  });
});

describe("unchanged Investigation limits", () => {
  it("counts UTF-16 code units at the per-string boundary", () => {
    const id = "😀".repeat(limits.maxStringCodeUnits / 2);
    const raw = { nodes: [{ nodeId: id, attention: [] }], confidence: "complete", gaps: [] };
    const result = checkInvestigationAttention(raw);
    expect(result.ok && result.usage.textCodeUnits).toBe(2048);
    const diagnostic = refusal(checkInvestigationAttention({ ...raw, nodes: [{ nodeId: id + "x", attention: [] }] }), "limit-exceeded", ["nodes", 0, "nodeId"]);
    expect(diagnostic).toMatchObject({ limit: "maxStringCodeUnits", maximum: 2048, observed: 2049 });
  });

  it("accepts exact total text and stops at the first one-over occurrence", () => {
    const nodes = Array.from({ length: 32 }, (_, index) => ({ nodeId: String(index).padStart(2, "0") + "x".repeat(2046), attention: [] }));
    const raw = { nodes, confidence: "complete", gaps: [] };
    const result = checkInvestigationAttention(raw);
    expect(result.ok && result.usage.textCodeUnits).toBe(65_536);
    const diagnostic = refusal(checkInvestigationAttention({ ...raw, nodes: [...nodes, { nodeId: "n", attention: [] }] }), "limit-exceeded", ["nodes", 32, "nodeId"]);
    expect(diagnostic).toMatchObject({ limit: "maxTextCodeUnits", maximum: 65_536, observed: 65_537 });
  });

  it("does not add FailureExplanation's aggregate item limit to valid Investigation lists", () => {
    const nodes = Array.from({ length: 256 }, (_, index) => ({ nodeId: String(index), attention: Array.from({ length: 16 }, () => ({ kind: "x", reason: "ERROR_RECORDED", evidence: [] })) }));
    const result = checkInvestigationAttention({ nodes, confidence: "complete", gaps: [] });
    expect(result.ok && result.usage.listItems).toBe(4352);
  });

  it("preserves the visual edge cap without trimming or deduplicating", () => {
    const raw = value(); raw.backward.edges = Array.from({ length: 512 }, () => edge());
    expect(checkInvestigationExplanation(raw, "s", "relationships").ok).toBe(true);
    raw.backward.edges.push(edge());
    const diagnostic = refusal(checkInvestigationExplanation(raw, "s", "relationships"), "limit-exceeded", ["backward", "edges"]);
    expect(diagnostic).toMatchObject({ limit: "maxEdgesPerList", maximum: 512, observed: 513 });
  });
});
