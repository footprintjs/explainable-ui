import { expect, it } from "vitest";
import { admitVisualExplanation } from "../components/InvestigationPanel/admission";
import { projectInvestigation } from "../components/GroupedFlowInvestigation/projection";
import { projectGroupedFlowDiagram } from "../components/GroupedFlowDiagram/layout";
import { projectRecordedRelationships } from "../components/GroupedFlowDiagram/relationships";

const definition = { nodes: [{ id: "work", label: "Work", kind: "group" as const },
  { id: "source", label: "Earlier version", parentId: "work" },
  { id: "selected", label: "Partial update", parentId: "work" }, { id: "later", label: "Later item" }],
  edges: [{ id: "design", source: "source", target: "selected" }] };
const read = { from: "selected", to: "source", kind: "data" as const, attribution: "recorded-read", evidence: ["read:proof"] };
const write = { ...read, attribution: "recorded-write", evidence: ["retained:proof"] };
const finding = () => ({ nodeId: "selected", attention: [], rootCause: "source", path: ["selected", "source"],
  alternatives: [], confidence: "complete", gaps: [], backward: { nodes: ["selected", "source"], edges: [{ ...write, evidence: [...write.evidence] }, { ...read, evidence: [...read.evidence] }], confidence: "complete", gaps: [] },
  impact: { nodes: ["later"], edges: [{ ...write, to: "later", evidence: ["impact:retained"] }], confidence: "complete", gaps: [] } });

it("keeps retained-write and read evidence distinct through cause and impact projection", () => {
  const raw = finding(), admitted = admitVisualExplanation(raw, "selected");
  expect(admitted?.backward?.edges).toEqual([write, read]);
  expect(admitted?.impact.edges).toEqual(raw.impact.edges);
  const projected = projectInvestigation(definition, admitted!, "cause");
  expect(projected.relationships.map(edge => [edge.source, edge.target, edge.attribution, edge.evidence]))
    .toEqual([["selected", "source", "recorded-write", ["retained:proof"]], ["selected", "source", "recorded-read", ["read:proof"]]]);
  expect(new Set(projected.relationships.map(edge => edge.id)).size).toBe(2);
  const impact = projectInvestigation(definition, admitted!, "impact");
  expect(impact.relationships[0]).toMatchObject({ source: "selected", target: "later", direction: "forward", attribution: "recorded-write", evidence: ["impact:retained"] });
});

it("preserves retained-write identities across grouped collapse and expansion without changing workflow states", () => {
  const relationship = { id: "retained", source: "later", target: "source", kind: "data", attribution: "recorded-write", evidence: ["retained:proof"], direction: "backward" };
  const collapsed = projectGroupedFlowDiagram(definition).model!, expanded = projectGroupedFlowDiagram(definition, { expandedGroupIds: ["work"] }).model!;
  const before = JSON.stringify(expanded);
  expect(projectRecordedRelationships([relationship], collapsed)?.[0]).toMatchObject({ source: "later", target: "work", collapsed: true, relationship });
  expect(projectRecordedRelationships([relationship], expanded)?.[0]).toMatchObject({ source: "later", target: "source", collapsed: false, relationship });
  expect(JSON.stringify(expanded)).toBe(before);
  expect(expanded.edges[0]?.state).toBe("unknown");
  const notRun = projectGroupedFlowDiagram(definition, { observation: { nodeStates: { work: "not-run" } } }).model!;
  expect(projectRecordedRelationships([relationship], notRun)).toBeUndefined();
});

it("does not turn missing or conservative retained-write evidence into a supported root", () => {
  const absent = finding(); delete (absent as any).backward;
  const legacy = admitVisualExplanation(absent, "selected"); expect(legacy).toBeDefined(); expect(legacy).not.toHaveProperty("backward");
  const gap = finding(); gap.backward.gaps = [{ code: "conservative", evidence: [] }] as any;
  expect(admitVisualExplanation(gap, "selected")).toBeUndefined();
  const partial = { ...finding(), rootCause: undefined, path: ["selected"], backward: { ...finding().backward,
    confidence: "incomplete", gaps: [{ code: "unsupported", evidence: [] }] } };
  expect(admitVisualExplanation(partial, "selected")?.backward).toEqual(partial.backward);
});

it("refuses unsupported or non-data retained writes and never invokes proof accessors", () => {
  for (const patch of [{ kind: "control" }, { attribution: "future-write" }, { to: "foreign" }]) {
    const raw = finding(); raw.backward.edges = [{ ...write, ...patch }] as any;
    expect(admitVisualExplanation(raw, "selected")).toBeUndefined();
    const model = projectGroupedFlowDiagram(definition).model!;
    const { from, to, ...relationship } = { ...write, ...patch };
    expect(projectRecordedRelationships([{ id: "bad", source: from, target: to, ...relationship }], model)).toBeUndefined();
  }
  let calls = 0;
  const raw = finding(); Object.defineProperty(raw.backward.edges[0], "evidence", { get() { calls++; return ["PRIVATE"]; } });
  expect(admitVisualExplanation(raw, "selected")).toBeUndefined(); expect(calls).toBe(0);
});
