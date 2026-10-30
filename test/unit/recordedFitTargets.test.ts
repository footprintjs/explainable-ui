import { expect, it } from "vitest";
import { projectGroupedFlowDiagram } from "../../src/components/GroupedFlowDiagram/layout";
import { visibleRecordedFitTargets } from "../../src/components/GroupedFlowDiagram/presentation";
const definition = { nodes: [{ id: "outer", label: "Outer", kind: "group" as const },
  { id: "inner", label: "Inner", kind: "group" as const, parentId: "outer" }, { id: "leaf", label: "Cause", parentId: "inner" }, { id: "failed", label: "Failure" }], edges: [] };
it("uses exact visible IDs and only the nearest admitted visible ancestor for a hidden target", () => {
  const folded = projectGroupedFlowDiagram(definition, { expandedGroupIds: ["outer"] }).model!;
  expect(visibleRecordedFitTargets(["leaf"], folded)).toEqual(["inner"]);
  expect(visibleRecordedFitTargets(["outer", "failed", "inner", "leaf"], folded)).toEqual(["outer", "failed", "inner"]);
  expect(visibleRecordedFitTargets(["leaf"], projectGroupedFlowDiagram(definition).model!)).toEqual(["outer"]);
  const open = projectGroupedFlowDiagram(definition, { expandedGroupIds: ["outer", "inner"] }).model!;
  expect(visibleRecordedFitTargets(["leaf", "failed"], open)).toEqual(["leaf", "failed"]);
});
it("refuses any unknown fit ID instead of choosing an arbitrary group or a partial target batch", () => {
  const model = projectGroupedFlowDiagram(definition).model!, before = JSON.stringify(model);
  expect(visibleRecordedFitTargets(["outside"], model)).toBeUndefined();
  expect(visibleRecordedFitTargets(["failed", "outside"], model)).toBeUndefined();
  expect(visibleRecordedFitTargets([], model)).toEqual([]); expect(JSON.stringify(model)).toBe(before);
});
