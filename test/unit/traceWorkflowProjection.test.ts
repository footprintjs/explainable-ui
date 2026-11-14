import { describe, expect, it } from "vitest";
import { projectTraceWorkflow, traceWorkflowPaintBounds } from "../../src/components/FlowchartView/_internal/traceWorkflowProjection";
import type { TraceWorkflowOverlay, TraceWorkflowStage } from "../../src/trace/traceWorkflowOverlay";
import { chartFitViewport } from "../../src/components/FlowchartView/_internal/chartFitGeometry";
import { recordedReadGeometry } from "../../src/components/FlowchartView/_internal/recordedReadGeometry";

const stage = (runtimeStageId: string): TraceWorkflowStage => ({ runtimeStageId,
  stageId: runtimeStageId.split("#")[0], color: "teal", role: "input", values: [{ key: "value", preview: "1", color: "teal" }] });
const overlay = (stages: TraceWorkflowStage[], focusRuntimeStageId: string | null = null): TraceWorkflowOverlay => ({
  questionKey: "result", scopeKey: '[]', focusRuntimeStageId, stages,
  reads: [{ key: "value", sourceRuntimeStageId: stages[0].runtimeStageId, targetRuntimeStageId: stages.at(-1)!.runtimeStageId, color: "teal" }],
});

describe("workflow read projection", () => {
  it("reserves bounded caption/ring paint without changing measured node footprints", () => {
    const nodes = new Map([
      ["a", { measured: { width: 120, height: 40 }, internals: { positionAbsolute: { x: 10, y: 20 } } }],
      ["b", { measured: { width: 180, height: 50 }, internals: { positionAbsolute: { x: 20, y: 150 } } }],
    ]);
    const before = JSON.stringify([...nodes]);
    expect(traceWorkflowPaintBounds(nodes, ["a", "b"])).toEqual({ x: -40, y: 12, width: 260, height: 214 });
    expect(JSON.stringify([...nodes])).toBe(before);
    expect(traceWorkflowPaintBounds(nodes, [])).toBeUndefined();
    expect(traceWorkflowPaintBounds(new Map([["a", { ...nodes.get("a")!, measured: {} }]]), ["a"])).toBeUndefined();
  });

  it("fits every bounded read label and lane on a wide workflow, including the sixth outer lane", () => {
    const nodes = new Map([
      ["source", { measured: { width: 220, height: 60 }, internals: { positionAbsolute: { x: 0, y: 0 } } }],
      ["result", { measured: { width: 220, height: 60 }, internals: { positionAbsolute: { x: 0, y: 300 } } }],
      ["parallel", { measured: { width: 220, height: 60 }, internals: { positionAbsolute: { x: 980, y: 0 } } }],
    ]);
    const before = JSON.stringify([...nodes]);
    const stages = ["source", "result"];
    const reads = Array.from({ length: 6 }, () => ({ source: "source", target: "result" }));
    const state = { width: 600, height: 400, minZoom: 0.1, maxZoom: 2, nodeLookup: nodes };
    const oldFit = chartFitViewport({ ...state, visualBounds: traceWorkflowPaintBounds(nodes, stages) }, .18)!;
    const outside = recordedReadGeometry(nodes, "source", "result", 5)!;
    expect(oldFit.x + (outside.label.x + outside.label.width / 2) * oldFit.zoom).toBeLessThan(0);

    const visualBounds = traceWorkflowPaintBounds(nodes, stages, reads)!;
    const fit = chartFitViewport({ ...state, visualBounds }, .18)!;
    for (const [lane, read] of reads.entries()) {
      const route = recordedReadGeometry(nodes, read.source, read.target, lane)!;
      for (const box of [route.label, route.bounds]) {
        expect(fit.x + box.x * fit.zoom).toBeGreaterThanOrEqual(0);
        expect(fit.x + (box.x + box.width) * fit.zoom).toBeLessThanOrEqual(state.width);
        expect(fit.y + box.y * fit.zoom).toBeGreaterThanOrEqual(0);
        expect(fit.y + (box.y + box.height) * fit.zoom).toBeLessThanOrEqual(state.height);
      }
    }
    expect(JSON.stringify([...nodes])).toBe(before);
  });

  it("waits for measured read endpoints instead of fitting partial evidence lanes", () => {
    const nodes = new Map([
      ["source", { measured: { width: 220, height: 60 }, internals: { positionAbsolute: { x: 0, y: 0 } } }],
      ["result", { measured: {}, internals: { positionAbsolute: { x: 0, y: 300 } } }],
    ]);
    expect(recordedReadGeometry(nodes, "source", "result", 0)).toBeNull();
    expect(traceWorkflowPaintBounds(nodes, ["source"], [{ source: "source", target: "result" }])).toBeUndefined();
  });

  it("maps only exact qualified endpoints and never substitutes an execution neighbor", () => {
    const trace = overlay([stage("left/source#1"), stage("left/result#3")]);
    const projected = projectTraceWorkflow(trace, [{ id: "left/source" }, { id: "audit" }, { id: "left/result" }, { id: "right/source" }]);
    expect([...projected.stages.keys()]).toEqual(["left/source", "left/result"]);
    expect(projected.reads).toEqual([{ key: "value", source: "left/source", target: "left/result",
      sourceRuntimeStageId: "left/source#1", targetRuntimeStageId: "left/result#3", color: "teal" }]);
    expect(projectTraceWorkflow(trace, [{ id: "source" }, { id: "result" }]).reads).toEqual([]);
    expect(projectTraceWorkflow(trace, [{ id: "right/source" }, { id: "right/result" }]).stages.size).toBe(0);
    expect(projectTraceWorkflow(trace, [{ id: "left/source", hidden: true }, { id: "left/result" }]).reads).toEqual([]);
  });

  it("selects the exact focused loop visit and withholds edges to another visit of that static node", () => {
    const trace = overlay([stage("tick#1"), stage("tick#4"), stage("done#5")], "tick#4");
    trace.reads = [
      { key: "old", sourceRuntimeStageId: "tick#1", targetRuntimeStageId: "done#5", color: "red" },
      { key: "new", sourceRuntimeStageId: "tick#4", targetRuntimeStageId: "done#5", color: "teal" },
    ];
    const projected = projectTraceWorkflow(trace, [{ id: "tick" }, { id: "done" }]);
    expect(projected.stages.get("tick")!.runtimeStageId).toBe("tick#4");
    expect(projected.reads.map(read => read.key)).toEqual(["new"]);
    trace.focusRuntimeStageId = "done#5";
    expect(projectTraceWorkflow(trace, [{ id: "tick" }, { id: "done" }]).stages.has("tick")).toBe(false);
    expect(projectTraceWorkflow(trace, [{ id: "tick" }, { id: "done" }]).reads).toEqual([]);
  });

  it("refuses duplicate identities and a stage alias inconsistent with its runtime stamp", () => {
    const trace = overlay([stage("left/source#1"), stage("left/result#2")]);
    trace.stages = [trace.stages[0], trace.stages[0], trace.stages[1]];
    expect(projectTraceWorkflow(trace, [{ id: "left/source" }, { id: "left/result" }]).reads).toEqual([]);
    trace.stages = [{ ...stage("left/source#1"), stageId: "source" }, stage("left/result#2")];
    expect(projectTraceWorkflow(trace, [{ id: "source" }, { id: "left/result" }]).reads).toEqual([]);
    trace.stages = [stage("left/source#1"), stage("left/result#2")];
    expect(projectTraceWorkflow(trace, [{ id: "left/source" }, { id: "left/source" }, { id: "left/result" }]).reads).toEqual([]);
    trace.stages = [stage("left/source"), stage("left/result#2")];
    expect(projectTraceWorkflow(trace, [{ id: "left/source" }, { id: "left/result" }]).reads).toEqual([]);
  });
});
