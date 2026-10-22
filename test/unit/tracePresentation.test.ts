import { describe, it, expect } from "vitest";
import {
  buildTraceWalk,
  formatTraceWalk,
} from "../../src/components/ExplainableShell/_internal/traceWalk";
import {
  presentScopedWalk,
  tracePresentation,
} from "../../src/components/ExplainableShell/_internal/tracePresentation";
import type { TraceScope } from "../../src/components/ExplainableShell/_internal/traceScope";
const log = [
  {
    stage: "Seed",
    stageId: "seed",
    runtimeStageId: "seed#1",
    trace: [{ path: "total" }],
  },
];
const tree = { runtimeStageId: "seed#1", stageReads: { base: 1 } };
function scope(path: string): TraceScope {
  return {
    invocationPath: [path],
    commitLog: log,
    executionTree: tree,
    availability: { ok: true },
    readsAvailable: true,
    mountLabels: new Map(),
  };
}
describe("private scoped copy metadata", () => {
  it("keeps identical IDs and separate walks from sharing scope or boundary metadata", () => {
    const root = buildTraceWalk(log, tree, "total");
    const first = presentScopedWalk(
      buildTraceWalk(log, tree, "total"),
      scope("first#2"),
    );
    const second = presentScopedWalk(
      buildTraceWalk(log, tree, "total"),
      scope("second#9"),
    );
    expect(tracePresentation(root)).toBeUndefined();
    expect(formatTraceWalk(root, () => 1)).toContain(
      "run input — never written",
    );
    expect(formatTraceWalk(first, () => 1)).toContain(
      "input mapping of first#2",
    );
    expect(formatTraceWalk(first, () => 1)).not.toContain("second#9");
    expect(formatTraceWalk(second, () => 1)).toContain(
      "input mapping of second#9",
    );
    expect(formatTraceWalk(second, () => 1)).not.toContain("first#2");
  });
  it("keeps the mapped input boundary in an honest missing-value copied answer", () => {
    const walk = presentScopedWalk(
      buildTraceWalk(log, tree, "base"),
      scope("child#3"),
    );
    const text = formatTraceWalk(walk, () => null);
    expect(text).toContain("Tracing subflow invocation child#3");
    expect(text).toContain("received at the subflow boundary");
    expect(text).not.toContain("never written");
  });
});
