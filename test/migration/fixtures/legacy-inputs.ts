/** Hand-built LEGACY SHAPES, never represented as real producer recordings. */
export function entry(
  index: number,
  overwrite: Record<string, unknown>,
  updates: Record<string, unknown>,
  trace: { path: string; verb: string }[]
) {
  return {
    stage: `Stage ${index}`,
    stageId: `s${index}`,
    runtimeStageId: `s${index}#${index}`,
    overwrite,
    updates,
    trace,
  };
}

interface Node {
  id: string;
  name: string;
  runtimeStageId: string;
  logs: Record<string, unknown>;
  errors: Record<string, unknown>;
  metrics: Record<string, unknown>;
  evals: Record<string, unknown>;
  next?: Node;
}

export function legacyRuntime(
  commitLog: ReturnType<typeof entry>[],
  initialState: Record<string, unknown> = {}
) {
  let next: Node | undefined;
  for (const row of [...commitLog].reverse()) {
    next = {
      id: row.stageId,
      name: row.stage,
      runtimeStageId: row.runtimeStageId,
      logs: {},
      errors: {},
      metrics: {},
      evals: {},
      ...(next && { next }),
    };
  }
  return {
    initialState,
    sharedState: { finalStateMustNotBeUsedAsBase: true },
    commitLog,
    executionTree: next ?? {
      id: "empty",
      name: "Empty",
      logs: {},
      errors: {},
      metrics: {},
      evals: {},
    },
  };
}

export const orderedLegacyLog = [
  entry(0, { value: { x: 1 }, items: ["first"] }, {}, [
    { path: "value", verb: "set" },
    { path: "items", verb: "set" },
  ]),
  entry(1, {}, { value: { y: 2 } }, [{ path: "value", verb: "merge" }]),
  entry(2, { value: { replacement: true } }, {}, [
    { path: "value", verb: "set" },
  ]),
  entry(3, { items: ["second"] }, { value: { z: 3 } }, [
    { path: "value", verb: "merge" },
    { path: "items", verb: "append" },
  ]),
  entry(4, {}, {}, [{ path: "value", verb: "delete" }]),
];
