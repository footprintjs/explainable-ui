import { describe, it, expect } from "vitest";
import { rootMountLabels } from "../../src/components/ExplainableShell/_internal/traceScope";
describe("root mount metadata admission", () => {
  it("never invokes a stored child-array index getter and discards partial labels", () => {
    let reads = 0;
    const children: unknown[] = [];
    Object.defineProperty(children, 0, {
      enumerable: true,
      get() {
        reads++;
        throw Error("must not execute");
      },
    });
    const result = rootMountLabels({
      runtimeStageId: "outer#1",
      subflowId: "outer",
      children,
    });
    expect(reads).toBe(0);
    expect(result.availability).toEqual({ ok: false, reason: "malformed" });
    expect(result.labels.size).toBe(0);
  });
  it("bounds a huge sparse array before enqueueing and reports too-large, not origin metadata", () => {
    const children: unknown[] = [];
    children.length = 100_001;
    const result = rootMountLabels({
      runtimeStageId: "outer#1",
      subflowId: "outer",
      children,
    });
    expect(result.availability).toMatchObject({
      ok: false,
      reason: "too-large",
    });
    expect(result.labels.size).toBe(0);
  });
  it("refuses an accessor child field without evaluating it", () => {
    let reads = 0;
    const tree = { runtimeStageId: "outer#1", subflowId: "outer" };
    Object.defineProperty(tree, "children", {
      get() {
        reads++;
        return [];
      },
    });
    const result = rootMountLabels(tree);
    expect(reads).toBe(0);
    expect(result.availability).toMatchObject({ ok: false });
    expect(result.labels.size).toBe(0);
  });
  it("refuses duplicate runtime IDs and cyclic metadata instead of certifying root coverage", () => {
    const duplicate = {
      runtimeStageId: "a#1",
      next: { runtimeStageId: "a#1" },
    };
    expect(
      rootMountLabels(duplicate, [{ runtimeStageId: "a#1" }]).availability,
    ).toEqual({ ok: false, reason: "malformed" });
    const cycle: { runtimeStageId: string; next?: unknown } = {
      runtimeStageId: "a#1",
    };
    cycle.next = cycle;
    expect(
      rootMountLabels(cycle, [{ runtimeStageId: "a#1" }]).availability,
    ).toEqual({ ok: false, reason: "malformed" });
  });
  it("accepts a real no-read step with multiple saved bundles under its one valid ID", () => {
    expect(
      rootMountLabels({ runtimeStageId: "a#1" }, [
        { runtimeStageId: "a#1" },
        { runtimeStageId: "a#1" },
      ]).availability,
    ).toEqual({ ok: true });
  });
});
