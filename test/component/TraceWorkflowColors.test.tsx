// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { expect, it } from "vitest";
import { TraceWalkCard } from "../../src/components/DataTracePanel/TraceWalkCard";
import { buildTraceDependencyGraph } from "../../src/trace/traceDependencyGraph";
import { buildTraceWalk } from "../../src/trace/traceWalk";
import { traceIngredientColor, traceNodeColors } from "../../src/trace/traceWorkflowOverlay";

it("keeps an exact writer's shared graph color when the cursor moves to an upstream stop", () => {
  const log = [
    { stage: "Seed", stageId: "seed", runtimeStageId: "seed#0", trace: [{ path: "score" }] },
    { stage: "Refine", stageId: "refine", runtimeStageId: "refine#1", trace: [{ path: "score" }] },
    { stage: "Report", stageId: "report", runtimeStageId: "report#2", trace: [{ path: "total" }] },
  ];
  const tree = { runtimeStageId: "seed#0", next: { runtimeStageId: "refine#1", stageReads: { score: true },
    next: { runtimeStageId: "report#2", stageReads: { score: true } } } };
  const walk = buildTraceWalk(log, tree, "total"), graph = buildTraceDependencyGraph(walk), colors = traceNodeColors(graph);
  const expected = (id: string) => traceIngredientColor(graph, colors, walk.stops.find(stop => stop.runtimeStageId === id)!.ingredients[0]);
  const view = (id: string) => <TraceWalkCard walk={walk} cursorRuntimeStageId={id} stepNumberOf={() => null} onFollowIngredient={() => {}} />;
  const mounted = render(view("report#2"));
  const chip = () => mounted.container.querySelector<HTMLButtonElement>('[data-fp="twc-ingredient"]')!;
  expect(chip().style.color).toBe(expected("report#2"));
  mounted.rerender(view("refine#1"));
  expect(chip().style.color).toBe(expected("refine#1"));
  expect(expected("refine#1")).not.toBe(expected("report#2"));
});
