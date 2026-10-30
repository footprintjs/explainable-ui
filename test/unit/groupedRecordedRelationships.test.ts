import { expect, it } from "vitest";
import { projectGroupedFlowDiagram } from "../../src/components/GroupedFlowDiagram/layout";
import { projectRecordedRelationships } from "../../src/components/GroupedFlowDiagram/relationships";
const definition = { nodes: [{ id: "g", label: "Work", kind: "group" as const }, { id: "a", label: "First", parentId: "g" }, { id: "b", label: "Next", parentId: "g" }, { id: "c", label: "Done" }], edges: [{ id: "design", source: "a", target: "b" }] };
const relationship = { id: "recorded", source: "b", target: "a", kind: "data" as const, attribution: "recorded-read" as const, evidence: ["read:1"] };
it("projects backward links separately without changing layout or design edge states", () => {
  const model = projectGroupedFlowDiagram(definition, { expandedGroupIds: ["g"] }).model!; const before = JSON.stringify(model);
  const overlay = projectRecordedRelationships([relationship], model);
  expect(overlay?.[0]?.relationship).toMatchObject({ id: "recorded", source: "b", target: "a", kind: "data", attribution: "recorded-read", evidence: ["read:1"] });
  expect(JSON.stringify(model)).toBe(before); expect(model.edges[0]?.state).toBe("unknown");
});
it("omits only hidden internal overlay links and preserves their identity after expansion", () => {
  const model = projectGroupedFlowDiagram(definition).model!; expect(projectRecordedRelationships([relationship], model)).toEqual([]);
  const cross = { ...relationship, source: "c", target: "a" }; expect(projectRecordedRelationships([cross], model)?.[0]).toMatchObject({ source: "c", target: "g", collapsed: true, relationship: { id: "recorded", source: "c", target: "a" } });
});
it("refuses unknown endpoints, duplicate or structural edge identities and unsafe fields", () => {
  const model = projectGroupedFlowDiagram(definition).model!;
  for (const edges of [[{ ...relationship, target: "missing" }], [relationship, relationship], [{ ...relationship, id: "design" }], [{ ...relationship, attribution: "PRIVATE" }]]) expect(projectRecordedRelationships(edges as any, model)).toBeUndefined();
  let reads = 0; const raw = Object.defineProperty({ ...relationship }, "evidence", { get() { reads++; return []; } });
  expect(projectRecordedRelationships([raw], model)).toBeUndefined(); expect(reads).toBe(0);
});
it.each([false, true])("refuses a recorded dependency touching a not-run ancestor or hidden item (expanded=%s)", expanded => {
  const underNotRun = projectGroupedFlowDiagram(definition, { observation: { nodeStates: { g: "not-run" } }, expandedGroupIds: expanded ? ["g"] : [] }).model!;
  expect(projectRecordedRelationships([{ ...relationship, source: "c", target: "a" }], underNotRun)).toBeUndefined();
  const hiddenNotRun = projectGroupedFlowDiagram(definition, { observation: { nodeStates: { a: "not-run" } }, expandedGroupIds: expanded ? ["g"] : [] }).model!;
  expect(projectRecordedRelationships([{ ...relationship, source: "c", target: "a" }], hiddenNotRun)).toBeUndefined();
});
it("keeps older typed model literals valid and refuses overlays whose hidden item states are unavailable", () => {
  const legacy: import("../../src/components/GroupedFlowDiagram/types").GroupedFlowDiagramModel = {
    definition: { nodes: [], edges: [] }, nodes: [], edges: [], width: 0, height: 0, direction: "LR", expandedGroupIds: [],
  };
  expect(projectRecordedRelationships([], legacy)).toBeUndefined();
});
