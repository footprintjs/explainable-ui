/** @vitest-environment jsdom */
/**
 * TimeTravelControls tracing mode — the Same-Rail Rewind rail.
 *
 * What is being pinned:
 * 1. ONE rail, one cursor: tracing changes AFFORDANCE (which ticks are
 *    landable, what prev/next mean), never the axis or the cursor type.
 * 2. Direction-honest buttons: "earlier cause" moves the cursor to a
 *    SMALLER index (leftward in time) — never a relabeled "+1".
 * 3. Non-stop ticks are unlandable in tracing mode (disabled), stop ticks
 *    stay clickable; Escape exits and the cursor stays put.
 * 4. Normal mode is byte-compatible: no tracing prop → the classic rail.
 */

import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { TimeTravelControls } from "../../src/components/TimeTravelControls/TimeTravelControls";
import type { TracingRail } from "../../src/components/TimeTravelControls/TimeTravelControls";
import type { StageSnapshot } from "../../src/types";

const snap = (label: string): StageSnapshot => ({
  stageName: label.toLowerCase(),
  stageLabel: label,
  runtimeStageId: `${label.toLowerCase()}#0`,
  memory: {},
  narrative: "",
  startMs: 0,
  durationMs: 1,
});

const SNAPSHOTS = ["Seed", "Sum", "Audit", "ApplyTax", "Total"].map(snap);

function renderTracing(
  overrides: Partial<Parameters<typeof TimeTravelControls>[0]> = {},
  tracingOverrides: Partial<TracingRail> = {},
) {
  const onIndexChange = vi.fn();
  const onExit = vi.fn();
  const utils = render(
    <TimeTravelControls
      snapshots={SNAPSHOTS}
      selectedIndex={4}
      onIndexChange={onIndexChange}
      tracing={{
        tracedKey: "total",
        stopIndices: [0, 1, 3, 4], // Audit (idx 2) is NOT a dependency
        stopOrdinal: 1,
        totalStops: 4,
        onExit,
        ...tracingOverrides,
      }}
      {...overrides}
    />,
  );
  return { onIndexChange, onExit, ...utils };
}

describe("TimeTravelControls — tracing mode", () => {
  it("renders the loud mode header (traced key + stop N of M) and Done", () => {
    renderTracing();
    expect(screen.getByText("Tracing")).toBeTruthy();
    expect(screen.getByText("total")).toBeTruthy();
    expect(screen.getByText(/stop 1 of 4/)).toBeTruthy();
    expect(screen.getByLabelText("Exit tracing")).toBeTruthy();
  });

  it("'earlier cause' moves the ONE cursor to the nearest stop before it (skipping non-stops)", () => {
    const { onIndexChange } = renderTracing({ selectedIndex: 4 });
    fireEvent.click(screen.getByLabelText("Earlier cause"));
    expect(onIndexChange).toHaveBeenCalledWith(3);
  });

  it("'earlier cause' skips the non-dependency tick entirely (3 → 1, never 2)", () => {
    const { onIndexChange } = renderTracing({ selectedIndex: 3 });
    fireEvent.click(screen.getByLabelText("Earlier cause"));
    expect(onIndexChange).toHaveBeenCalledWith(1);
  });

  it("'toward result' walks forward along stops only", () => {
    const { onIndexChange } = renderTracing({ selectedIndex: 1 });
    fireEvent.click(screen.getByLabelText("Toward result"));
    expect(onIndexChange).toHaveBeenCalledWith(3);
  });

  it("disables 'earlier cause' at the walk's earliest stop (the origin — no invented past)", () => {
    renderTracing({ selectedIndex: 0 });
    expect((screen.getByLabelText("Earlier cause") as HTMLButtonElement).disabled).toBe(true);
  });

  it("non-stop ticks are unlandable; stop ticks stay clickable", () => {
    const { onIndexChange } = renderTracing();
    const ticks = screen.getAllByTitle(/./).filter((el) => el.getAttribute("data-fp") === "tt-tick");
    expect((ticks[2] as HTMLButtonElement).disabled).toBe(true); // Audit — not in the trace
    expect((ticks[1] as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(ticks[1]);
    expect(onIndexChange).toHaveBeenCalledWith(1);
  });

  it("Escape exits tracing; the cursor is untouched", () => {
    const { onExit, onIndexChange } = renderTracing();
    fireEvent.keyDown(screen.getByRole("toolbar"), { key: "Escape" });
    expect(onExit).toHaveBeenCalledOnce();
    expect(onIndexChange).not.toHaveBeenCalled();
  });

  it("arrow keys drive the stop walk (ArrowLeft = earlier cause)", () => {
    const { onIndexChange } = renderTracing({ selectedIndex: 3 });
    fireEvent.keyDown(screen.getByRole("toolbar"), { key: "ArrowLeft" });
    expect(onIndexChange).toHaveBeenCalledWith(1);
  });

  it("renders the via breadcrumb with 'show all' when an ingredient filter is active", () => {
    const onShowAll = vi.fn();
    render(
      <TimeTravelControls
        snapshots={SNAPSHOTS}
        selectedIndex={1}
        onIndexChange={vi.fn()}
        tracing={{
          tracedKey: "total",
          viaKey: "subtotal",
          stopIndices: [0, 1],
          stopOrdinal: 1,
          totalStops: 2,
          onExit: vi.fn(),
          onShowAll,
        }}
      />,
    );
    expect(screen.getByText("subtotal")).toBeTruthy();
    fireEvent.click(screen.getByText("show all"));
    expect(onShowAll).toHaveBeenCalledOnce();
  });

  it("hides autoplay in tracing mode (the walk is steered, not played)", () => {
    renderTracing();
    expect(screen.queryByLabelText("Play")).toBeNull();
  });

  it("normal mode is unchanged: classic prev/next semantics, play button present", () => {
    const onIndexChange = vi.fn();
    render(
      <TimeTravelControls snapshots={SNAPSHOTS} selectedIndex={2} onIndexChange={onIndexChange} />,
    );
    expect(screen.getByLabelText("Play")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Previous stage"));
    expect(onIndexChange).toHaveBeenCalledWith(1);
  });
});

describe("TimeTravelControls — fork chooser (F2)", () => {
  // THE LAW (traceWalk.ts): the walk is reverse-commit order and already
  // visits EVERY frame, both parents of a fork included — "forks are
  // explained, not navigated". So walking back MOVES at every stop that
  // still has an earlier stop. The chooser is the terminus affordance:
  // following an ingredient RE-ANCHORS to a longer walk, which is only
  // genuine forward motion once there is nothing earlier left to visit.
  it("a fork MID-WALK still moves the cursor — the chooser never hijacks the walk", () => {
    const onForkPrompt = vi.fn();
    const { onIndexChange } = renderTracing({ selectedIndex: 4 }, { forkCount: 6, onForkPrompt });
    const btn = screen.getByLabelText("Earlier cause") as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
    expect(btn.textContent).toMatch(/earlier cause/);
    fireEvent.click(btn);
    expect(onIndexChange).toHaveBeenCalledWith(3);
    expect(onForkPrompt).not.toHaveBeenCalled();
  });

  it("ArrowLeft at a mid-walk fork moves the cursor too", () => {
    const onForkPrompt = vi.fn();
    const { onIndexChange } = renderTracing({ selectedIndex: 4 }, { forkCount: 3, onForkPrompt });
    fireEvent.keyDown(screen.getByRole("toolbar"), { key: "ArrowLeft" });
    expect(onIndexChange).toHaveBeenCalledWith(3);
    expect(onForkPrompt).not.toHaveBeenCalled();
  });

  // REGRESSION (the neo dead state): every stop of a real agent walk is a
  // "fork" by ingredient count (stages read 6-9 written keys). Prompting on
  // forkCount alone froze the cursor at the anchor forever. Walking the whole
  // rail with a fork at EVERY stop must reach the origin.
  it("walks the entire rail even when every stop is a fork (no dead state)", () => {
    const onForkPrompt = vi.fn();
    const visited: number[] = [];
    let idx = 4;
    for (let hop = 0; hop < 5; hop++) {
      const onIndexChange = vi.fn();
      const { unmount } = render(
        <TimeTravelControls
          snapshots={SNAPSHOTS}
          selectedIndex={idx}
          onIndexChange={onIndexChange}
          tracing={{
            tracedKey: "total",
            stopIndices: [0, 1, 3, 4],
            stopOrdinal: 1,
            totalStops: 4,
            onExit: vi.fn(),
            forkCount: 9,
            onForkPrompt,
          }}
        />,
      );
      const btn = screen.getByLabelText(/Earlier cause|Choose cause/) as HTMLButtonElement;
      fireEvent.click(btn);
      unmount();
      if (onIndexChange.mock.calls.length === 0) break; // terminus reached
      idx = onIndexChange.mock.calls[0][0] as number;
      visited.push(idx);
    }
    // 4 → 3 → 1 → 0, then the origin prompts instead of moving.
    expect(visited).toEqual([3, 1, 0]);
    expect(onForkPrompt).toHaveBeenCalledOnce();
  });

  it("forkCount undefined keeps the classic earlier-cause behavior", () => {
    const { onIndexChange } = renderTracing({ selectedIndex: 4 }, { onForkPrompt: vi.fn() });
    fireEvent.click(screen.getByLabelText("Earlier cause"));
    expect(onIndexChange).toHaveBeenCalledWith(3);
  });

  it("forkCount 1 (not a fork) keeps the classic earlier-cause behavior", () => {
    const onForkPrompt = vi.fn();
    const { onIndexChange } = renderTracing({ selectedIndex: 4 }, { forkCount: 1, onForkPrompt });
    fireEvent.click(screen.getByLabelText("Earlier cause"));
    expect(onIndexChange).toHaveBeenCalledWith(3);
    expect(onForkPrompt).not.toHaveBeenCalled();
  });

  it("'choose cause' stays enabled AT the earliest stop — it prompts, it does not move", () => {
    const onForkPrompt = vi.fn();
    const { onIndexChange } = renderTracing({ selectedIndex: 0 }, { forkCount: 2, onForkPrompt });
    const btn = screen.getByLabelText("Choose cause") as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
    expect(btn.textContent).toMatch(/choose cause/);
    fireEvent.click(btn);
    expect(onForkPrompt).toHaveBeenCalledOnce();
    expect(onIndexChange).not.toHaveBeenCalled();
  });

  it("the earliest stop with nothing to follow simply disables walk-back", () => {
    const { onIndexChange } = renderTracing({ selectedIndex: 0 }, { forkCount: 1, onForkPrompt: vi.fn() });
    const btn = screen.getByLabelText("Earlier cause") as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(onIndexChange).not.toHaveBeenCalled();
  });
});
