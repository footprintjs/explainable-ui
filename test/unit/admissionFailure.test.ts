import { describe, it, expect } from "vitest";
import {
  childTraceScope,
  rootMountLabels,
} from "../../src/components/ExplainableShell/_internal/traceScope";
import { TraceAdmissionError } from "../../src/components/ExplainableShell/_internal/safeRecordRead";
function child(tree: unknown) {
  return {
    treeContext: {
      history: [
        {
          stage: "Step",
          stageId: "step",
          runtimeStageId: "step#1",
          trace: [{ path: "x" }],
        },
      ],
      stageContexts: tree,
    },
  };
}
function throwingNode(error: unknown) {
  return new Proxy(
    {},
    {
      getPrototypeOf() {
        throw error;
      },
    },
  );
}
describe("failed admission inspection is always contained", () => {
  it.each(["child", "root"] as const)(
    "contains a hostile thrown proxy in %s admission",
    (kind) => {
      const thrown = new Proxy(
        {},
        {
          getPrototypeOf() {
            throw Error("private-prototype");
          },
          getOwnPropertyDescriptor() {
            throw Error("private-descriptor");
          },
        },
      );
      let escaped = false;
      let availability: unknown;
      try {
        availability =
          kind === "child"
            ? childTraceScope(child(throwingNode(thrown)), ["mount#0"])
                .availability
            : rootMountLabels(throwingNode(thrown)).availability;
      } catch {
        escaped = true;
      }
      expect(escaped).toBe(false);
      expect(availability).toEqual({ ok: false, reason: "malformed" });
    },
  );
  it.each(["child", "root"] as const)(
    "never reads spoofed admission error getters in %s admission",
    (kind) => {
      let reads = 0;
      const thrown = Object.create(TraceAdmissionError.prototype);
      Object.defineProperties(thrown, {
        reason: {
          get() {
            reads++;
            return "too-large";
          },
        },
        items: {
          get() {
            reads++;
            return 77;
          },
        },
      });
      const availability =
        kind === "child"
          ? childTraceScope(child(throwingNode(thrown)), ["mount#0"])
              .availability
          : rootMountLabels(throwingNode(thrown)).availability;
      expect(reads).toBe(0);
      expect(availability).toEqual({ ok: false, reason: "malformed" });
    },
  );
});
