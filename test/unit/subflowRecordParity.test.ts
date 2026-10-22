import { projectTraceInvocation } from "../../src/index";
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import {
  timeTravel,
  keysReadFromExecutionTree,
  type ExecutionTree,
} from "foottrace";
import {
  childTraceScope,
  runHasRecordedReads,
} from "../../src/components/ExplainableShell/_internal/traceScope";
type Result = {
  treeContext: {
    history: Array<{ runtimeStageId: string }>;
    stageContexts: ExecutionTree;
  };
};
type Source = {
  executionTree: ExecutionTree;
  commitLog: unknown[];
  subflowResults: Record<string, Result>;
};
const base = JSON.parse(
  readFileSync("test/fixtures/subflow-tracing/recordings.json", "utf8"),
) as Record<string, { runtimeSnapshot: Source }>;
const bytes = readFileSync(
  "test/fixtures/subflow-tracing/review-recordings.json",
  "utf8",
);
const additional = JSON.parse(bytes) as typeof base;
const legacy = JSON.parse(
  readFileSync("test/fixtures/golden/subflow-loop.json", "utf8"),
) as { runtimeSnapshot: Source; snapshot: Source; runtime: Source };
const provenance = JSON.parse(
  readFileSync("test/fixtures/subflow-tracing/review-provenance.json", "utf8"),
);
describe("selected records agree with the dev-only Foottrace reader", () => {
  it("pins the offline producer and untouched review fixture bytes", () => {
    expect(provenance.producer.footprintjs).toBe("10.3.0");
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(
      provenance.sha256,
    );
  });
  for (const [name, run] of Object.entries({
    ...base,
    ...additional,
    legacy: {
      runtimeSnapshot:
        legacy.runtimeSnapshot ?? legacy.snapshot ?? legacy.runtime,
    },
  })) {
    it(`matches visits, child commit rail and mapper boundary: ${name}`, () => {
      const source = run.runtimeSnapshot;
      const cursor = timeTravel(source);
      const trees = [
        source.executionTree,
        ...Object.values(source.subflowResults).map(
          (result) => result.treeContext.stageContexts,
        ),
      ];
      const coverage = keysReadFromExecutionTree(trees).coverage;
      const hasReads = (coverage?.stepsWithReads ?? 0) > 0;
      expect(runHasRecordedReads(source)).toBe(hasReads);
      for (const [id, result] of Object.entries(source.subflowResults).filter(
        ([id]) => id.includes("#"),
      )) {
        const drilled = cursor.drill(id);
        expect(drilled, `exact ${id}`).toBeTruthy();
        const selected = childTraceScope(result, [id], hasReads);
        expect(selected.availability).toEqual({ ok: true });
        const publicProjection = projectTraceInvocation(source, id);
        expect(publicProjection.availability).toEqual({ ok: true });
        expect(publicProjection.commitLog).toEqual(selected.commitLog);
        expect(publicProjection.executionTree).toEqual(selected.executionTree);
        expect(publicProjection.scope.readsAvailable).toBe(selected.readsAvailable);
        const stops = drilled!.stops.filter(
          (stop) => stop.kind === "commit" || stop.kind === "mount",
        );
        expect([
          ...new Set(
            selected.commitLog.map(
              (entry) => (entry as { runtimeStageId: string }).runtimeStageId,
            ),
          ),
        ]).toEqual(stops.map((stop) => stop.runtimeStageId));
        expect(drilled!.stops[0].kind).toBe("start");
        const first = result.treeContext.history[0];
        if (
          first &&
          (first.runtimeStageId === id || first.runtimeStageId === "")
        ) {
          expect(selected.commitLog).toHaveLength(
            result.treeContext.history.length - 1,
          );
          const mapper = first as { overwrite?: Record<string, unknown> };
          expect(drilled!.stateAt(drilled!.stops[0]).state).toMatchObject(
            mapper.overwrite ?? {},
          );
        }
      }
      expect(cursor.drill("missing#999")).toBeUndefined();
    });
  }
});
