import { describe, it, expect } from "vitest";
import {
  buildTraceWalk,
  formatTraceWalk,
} from "../../src/components/ExplainableShell/_internal/traceWalk";
const log = [
  {
    stage: "Seed",
    stageId: "seed",
    runtimeStageId: "seed#1",
    trace: [{ path: "total" }],
  },
];
const tree = { runtimeStageId: "seed#1", stageReads: { base: 1 } };
function scope(path: string) {
  return { invocationPath: [path], readsAvailable: true, mountLabels: {} };
}
describe("explicit scoped copy metadata", () => {
  it("keeps identical IDs and separate walks from sharing scope or boundary metadata", () => {
    const root = buildTraceWalk(log, tree, "total");
    const first = buildTraceWalk(log, tree, "total", { scope: scope("first#2") });
    const second = buildTraceWalk(log, tree, "total", { scope: scope("second#9") });
    expect(root.scope).toBeUndefined();
    expect(formatTraceWalk(root, () => 1)).toContain(
      "run input — never written",
    );
    expect(formatTraceWalk(first, () => 1)).toContain(
      "present when invocation first#2 started",
    );
    expect(formatTraceWalk(first, () => 1)).not.toContain("second#9");
    expect(formatTraceWalk(second, () => 1)).toContain(
      "present when invocation second#9 started",
    );
    expect(formatTraceWalk(second, () => 1)).not.toContain("first#2");
  });
  it("keeps the mapped input boundary in an honest missing-value copied answer", () => {
    const walk = buildTraceWalk(log, tree, "base", { scope: scope("child#3") });
    const text = formatTraceWalk(walk, () => null);
    expect(text).toContain("Tracing subflow invocation child#3");
    expect(text).toContain("present when invocation child#3 started");
    expect(text).not.toContain("never written");
  });
});
