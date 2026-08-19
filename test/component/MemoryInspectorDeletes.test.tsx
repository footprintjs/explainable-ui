/** @vitest-environment jsdom */
/**
 * 0.35.0 — deleted keys stay deleted.
 *
 * A `StageSnapshot.memory` is the ACCUMULATED state after that stage ran: the
 * adapter has already replayed every commit onto it, deletes included. The
 * inspector nevertheless re-accumulated by `Object.assign`-ing every earlier
 * snapshot's memory on top of each other — an operation that can only ever ADD
 * keys back. A key the run deleted therefore came back to life, and did so
 * right next to a `<ScopeDiff>` (they are composed together in `<MemoryPanel>`)
 * that was reporting the very same key "removed" in the very same view.
 */
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { MemoryInspector } from "../../src/components/MemoryInspector";
import { MemoryPanel } from "../../src/components/MemoryPanel";
import type { StageSnapshot } from "../../src/types";

function snap(name: string, memory: Record<string, unknown>): StageSnapshot {
  return {
    stageName: name,
    stageLabel: name,
    runtimeStageId: `${name}#0`,
    memory,
    narrative: "",
    startMs: 0,
    durationMs: 1,
  };
}

/** A run that writes `draft`, uses it, then deletes it. */
const RUN: StageSnapshot[] = [
  snap("write", { draft: "hello", keep: 1 }),
  snap("use", { draft: "hello", keep: 1, out: "HELLO" }),
  snap("cleanup", { keep: 1, out: "HELLO" }), // draft deleted here
];

function shownState(snapshots: StageSnapshot[], selectedIndex: number): Record<string, unknown> {
  const { container } = render(
    <MemoryInspector snapshots={snapshots} selectedIndex={selectedIndex} unstyled />,
  );
  const json = container.querySelector('[data-fp="memory-json"]')?.textContent ?? "{}";
  return JSON.parse(json) as Record<string, unknown>;
}

describe("MemoryInspector — a deleted key is gone", () => {
  it("does not resurrect a key the run deleted", () => {
    const state = shownState(RUN, 2);
    expect(state).not.toHaveProperty("draft");
    expect(state).toEqual({ keep: 1, out: "HELLO" });
  });

  it("still shows the key at the steps where it existed", () => {
    expect(shownState(RUN, 0)).toEqual({ draft: "hello", keep: 1 });
    expect(shownState(RUN, 1)).toEqual({ draft: "hello", keep: 1, out: "HELLO" });
  });

  it("scrubbing backward then forward gives the same answer", () => {
    // The old incremental cache extended forward from a remembered index,
    // which is precisely how a stale key survived a scrub.
    expect(shownState(RUN, 2)).toEqual({ keep: 1, out: "HELLO" });
    expect(shownState(RUN, 0)).toEqual({ draft: "hello", keep: 1 });
    expect(shownState(RUN, 2)).toEqual({ keep: 1, out: "HELLO" });
  });

  it("an index past the end clamps to the last step, deletions and all", () => {
    expect(shownState(RUN, 99)).toEqual({ keep: 1, out: "HELLO" });
  });

  it("a key deleted and then written again is present again", () => {
    const revived = [...RUN, snap("rewrite", { keep: 1, out: "HELLO", draft: "second" })];
    expect(shownState(revived, 3)).toEqual({ keep: 1, out: "HELLO", draft: "second" });
  });

  it("the `data` prop is still shown verbatim", () => {
    const { container } = render(<MemoryInspector data={{ a: 1 }} unstyled />);
    expect(container.querySelector('[data-fp="memory-json"]')?.textContent).toContain('"a": 1');
  });

  it("highlights keys that are new at this step", () => {
    const { container } = render(<MemoryInspector snapshots={RUN} selectedIndex={1} />);
    // `out` is new at step 1; `keep` is not. The new key gets the success wash.
    const rows = Array.from(container.querySelectorAll("div")).filter((d) =>
      (d.textContent ?? "").startsWith('"out"'),
    );
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0]!.getAttribute("style")).toContain("color-mix");
  });
});

describe("MemoryPanel — the inspector and the diff tell the same story", () => {
  it("a key the diff calls removed is absent from the state beside it", () => {
    const { container } = render(<MemoryPanel snapshots={RUN} selectedIndex={2} unstyled />);

    const removed = Array.from(container.querySelectorAll('[data-fp="diff-entry"]'))
      .filter((n) => n.getAttribute("data-type") === "removed")
      .map((n) => n.querySelector('[data-fp="diff-key"]')?.textContent);
    expect(removed).toContain("draft");

    const json = container.querySelector('[data-fp="memory-json"]')?.textContent ?? "{}";
    expect(JSON.parse(json)).not.toHaveProperty("draft");
  });
});
