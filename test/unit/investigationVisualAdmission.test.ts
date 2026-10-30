import { expect, it } from "vitest";
import { admitExplanation, admitVisualExplanation } from "../../src/components/InvestigationPanel/admission";
const edge = { from: "selected", to: "cause", kind: "data", attribution: "recorded-read", evidence: ["read:1"] };
const value = () => ({ nodeId: "selected", attention: [], rootCause: "cause", path: ["selected", "cause"], alternatives: [], confidence: "complete", gaps: [],
  backward: { nodes: ["selected", "cause"], edges: [edge], confidence: "complete", gaps: [] }, impact: { nodes: ["later"], edges: [{ ...edge, to: "later" }], confidence: "complete", gaps: [] } });
it("preserves admitted canonical relationships only in the visual projection", () => {
  const raw = value(); const visual = admitVisualExplanation(raw, "selected");
  expect(visual?.backward).toEqual(raw.backward); expect(visual?.impact.edges).toEqual(raw.impact.edges);
  expect(admitExplanation(raw, "selected")).not.toHaveProperty("backward"); expect(admitExplanation(raw, "selected")?.impact).not.toHaveProperty("edges");
});
it("keeps missing relationships absent, not an invented empty complete graph", () => {
  const raw = value(); delete (raw as any).backward; delete (raw.impact as any).edges;
  expect(admitVisualExplanation(raw, "selected")).not.toHaveProperty("backward");
  expect(admitVisualExplanation(raw, "selected")?.impact).not.toHaveProperty("edges");
});
it.each(["from", "to", "kind", "attribution", "evidence"])("refuses invalid relationship %s instead of silently changing its meaning", field => {
  const raw = value(); (raw.backward.edges[0] as any) = { ...edge, [field]: field === "evidence" ? ["x".repeat(2049)] : "PRIVATE_INVALID" };
  expect(admitVisualExplanation(raw, "selected")).toBeUndefined();
});
it("never reads relationship accessors and bounds the entire result", () => {
  let reads = 0; const raw = value(); Object.defineProperty(raw.backward, "edges", { get() { reads++; throw new Error("PRIVATE"); } });
  expect(admitVisualExplanation(raw, "selected")).toBeUndefined(); expect(reads).toBe(0);
  const big = value(); big.backward.edges = Array.from({ length: 513 }, () => edge); expect(admitVisualExplanation(big, "selected")).toBeUndefined();
});
it("refuses a supported root paired with incomplete backward evidence but preserves forward-only limits", () => {
  const raw = value(); raw.backward.confidence = "incomplete"; expect(admitVisualExplanation(raw, "selected")).toBeUndefined();
  const forward = value(); forward.confidence = "incomplete"; forward.gaps = [{ code: "edge-limit", evidence: [] }] as any; forward.impact.confidence = "incomplete"; forward.impact.gaps = [{ code: "edge-limit", evidence: [] }] as any;
  expect(admitVisualExplanation(forward, "selected")?.rootCause).toBe("cause");
});

it("preserves the text port's ignored future-field contract", () => {
  let reads = 0; const raw = value();
  Object.defineProperty(raw.impact, "edges", { get() { reads++; throw new Error("PRIVATE"); } });
  Object.defineProperty(raw, "backward", { get() { reads++; throw new Error("PRIVATE"); } });
  expect(admitExplanation(raw, "selected")?.rootCause).toBe("cause"); expect(reads).toBe(0);
  expect(admitVisualExplanation(raw, "selected")).toBeUndefined(); expect(reads).toBe(0);
});

it.each([
  { name: "a claimed path with no returned links", change: (raw: ReturnType<typeof value>) => { raw.backward.edges = []; } },
  { name: "an intermediate path ID absent from backward membership", change: (raw: ReturnType<typeof value>) => { raw.path = ["selected", "missing-hop", "cause"]; } },
  { name: "links pointing in the reverse direction", change: (raw: ReturnType<typeof value>) => { raw.backward.edges = [{ ...edge, from: "cause", to: "selected" }]; } },
  { name: "a stage-level relationship supporting a definite root", change: (raw: ReturnType<typeof value>) => { raw.backward.edges = [{ ...edge, attribution: "stage" }]; } },
])("refuses $name instead of drawing an unsupported root trail", ({ change }) => {
  const raw = value(); change(raw); expect(admitVisualExplanation(raw, "selected")).toBeUndefined();
});

it("requires path membership and adjacent link evidence even when no root is claimed", () => {
  const missingMember = { ...value(), rootCause: undefined, path: ["selected"], backward: { nodes: [], edges: [], confidence: "incomplete", gaps: [] } };
  expect(admitVisualExplanation(missingMember, "selected")).toBeUndefined();
  const missingLink = { ...value(), rootCause: undefined, backward: { ...value().backward, edges: [] } };
  expect(admitVisualExplanation(missingLink, "selected")).toBeUndefined();
});

it("keeps an exact self root with no edges and multi-hop recorded data/control paths valid", () => {
  const self = { ...value(), rootCause: "selected", path: ["selected"], backward: { nodes: ["selected"], edges: [], confidence: "complete", gaps: [] } };
  expect(admitVisualExplanation(self, "selected")?.rootCause).toBe("selected");
  const multi = value(); multi.path = ["selected", "middle", "cause"]; multi.backward.nodes = ["selected", "middle", "cause"];
  multi.backward.edges = [{ ...edge, to: "middle" }, { ...edge, from: "middle", kind: "control", attribution: "recorded-control" }];
  expect(admitVisualExplanation(multi, "selected")?.path).toEqual(multi.path);
});

it("keeps conservative coverage from supporting a root and leaves legacy missing-backward ports unchanged", () => {
  const uncertain = value(); uncertain.backward.gaps = [{ code: "conservative", evidence: [] }] as any;
  expect(admitVisualExplanation(uncertain, "selected")).toBeUndefined();
  const legacy = value(); delete (legacy as any).backward;
  expect(admitVisualExplanation(legacy, "selected")?.rootCause).toBe("cause");
  expect(admitExplanation(value(), "selected")?.rootCause).toBe("cause");
});

it("refuses alternatives outside supplied backward membership but accepts discovered uncertain candidates", () => {
  const raw = { ...value(), rootCause: undefined, path: ["selected"], alternatives: ["foreign-reference"] };
  expect(admitVisualExplanation(raw, "selected")).toBeUndefined();
  raw.alternatives = ["cause"];
  expect(admitVisualExplanation(raw, "selected")?.alternatives).toEqual(["cause"]);
  const legacy = { ...raw, alternatives: ["foreign-reference"] };
  delete (legacy as any).backward;
  expect(admitVisualExplanation(legacy, "selected")?.alternatives).toEqual(["foreign-reference"]);
});

it("keeps genuine partial and empty traversal results without claiming a root", () => {
  const gap = { code: "cancelled", evidence: [] };
  const empty = { nodeId: "selected", attention: [], path: [], alternatives: [], confidence: "incomplete", gaps: [gap],
    backward: { nodes: [], edges: [], confidence: "incomplete", gaps: [gap] }, impact: { nodes: [], edges: [], confidence: "incomplete", gaps: [gap] } };
  expect(admitVisualExplanation(empty, "selected")?.backward?.nodes).toEqual([]);
  const partial = { ...empty, path: ["selected"], backward: { ...empty.backward, nodes: ["selected"] } };
  expect(admitVisualExplanation(partial, "selected")?.path).toEqual(["selected"]);
});
