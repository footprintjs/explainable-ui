/** @vitest-environment jsdom */
import { useRef, useState, type KeyboardEvent } from "react";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTimeTravelPlayback } from "../../src/replay/useTimeTravelPlayback";
import type { TimeTravelControlsProps, TracingRail } from "../../src/components/TimeTravelControls/TimeTravelControls";
import type { StageSnapshot } from "../../src/types";

const snapshots: StageSnapshot[] = ["A", "B", "C", "D", "E"].map((stageName, index) => ({
  stageName, stageLabel: stageName, runtimeStageId: `${stageName}#${index}`,
  memory: {}, narrative: "", startMs: index, durationMs: 1,
}));
type Options = Partial<Omit<TimeTravelControlsProps, "selectedIndex" | "onIndexChange">>;

function renderPlayback(initialProps: Options = {}, initialIndex = 0) {
  const asked = vi.fn();
  const hook = renderHook((props: Options) => {
    const [index, setIndex] = useState(initialIndex);
    const offered = useRef<unknown>(undefined);
    const controls = useTimeTravelPlayback({ snapshots, ...props, selectedIndex: index,
      onIndexChange: value => { asked(value); setIndex(value); }, offered });
    return { ...controls, index };
  }, { initialProps });
  return { ...hook, asked };
}

function keyboard(key: string, target: HTMLElement = document.createElement("div")) {
  return { key, target, preventDefault: vi.fn() } as unknown as KeyboardEvent;
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });

describe("replay playback configuration", () => {
  it.each([false, true])("hiding Play cancels an active run without resuming when shown again (autoPlay=%s)", autoPlay => {
    const { result, rerender, asked } = renderPlayback({ autoPlay });
    if (!autoPlay) act(() => result.current.togglePlay());
    expect(result.current.playing).toBe(true);
    const oldToggle = result.current.togglePlay;
    rerender({ autoPlay, replayControls: { playPause: false } });
    expect(result.current.playing).toBe(false);
    act(() => { oldToggle(); result.current.handleKeyDown(keyboard(" ")); vi.advanceTimersByTime(20_000); });
    expect(asked).not.toHaveBeenCalled();
    rerender({ autoPlay, replayControls: { playPause: true } });
    act(() => vi.advanceTimersByTime(20_000));
    expect(result.current.playing).toBe(false);
    expect(asked).not.toHaveBeenCalled();
  });

  it("consumes a hidden autoplay offer and honors the legacy Play veto", () => {
    const { result, rerender, asked } = renderPlayback({ autoPlay: true, replayControls: { playPause: false } });
    rerender({ autoPlay: true });
    act(() => vi.advanceTimersByTime(20_000));
    expect(asked).not.toHaveBeenCalled();
    rerender({ autoPlayable: false });
    act(() => { result.current.togglePlay(); result.current.handleKeyDown(keyboard(" ")); });
    expect(result.current.playing).toBe(false);
    expect(asked).not.toHaveBeenCalled();
  });

  it("gates retained navigation and slider actions when their controls are hidden", () => {
    const { result, rerender, asked } = renderPlayback({}, 2);
    const previous = result.current.goPrev, next = result.current.goNext, select = result.current.selectIndex;
    rerender({ replayControls: { previousNext: false, slider: false } });
    act(() => { previous(); next(); select(4); result.current.handleKeyDown(keyboard("ArrowLeft")); result.current.handleKeyDown(keyboard("ArrowRight")); });
    expect(asked).not.toHaveBeenCalled();
    expect(result.current.canPrev).toBe(false);
    expect(result.current.canNext).toBe(false);
  });

  it("does not let hidden arrow shortcuts interrupt autoplay", () => {
    const { result } = renderPlayback({ autoPlay: true, replayControls: { previousNext: false } });
    act(() => result.current.handleKeyDown(keyboard("ArrowRight")));
    expect(result.current.playing).toBe(true);
    act(() => vi.advanceTimersByTime(600));
    expect(result.current.index).toBe(1);
  });

  it.each([[750, 750], [-1, 200], [20_000, 10_000], [NaN, 600], [Infinity, 600]])("uses interval %s as a %s ms delay", (intervalMs, delay) => {
    const { result } = renderPlayback({ replayControls: { intervalMs } });
    act(() => result.current.togglePlay());
    act(() => vi.advanceTimersByTime(delay - 1));
    expect(result.current.index).toBe(0);
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.index).toBe(1);
  });
});

describe("one cursor and admitted trace stops", () => {
  it("rejects non-finite, fractional and out-of-range selection requests", () => {
    const { result, asked } = renderPlayback();
    act(() => result.current.togglePlay());
    act(() => { for (const index of [-1, snapshots.length, NaN, Infinity, 1.5]) result.current.selectIndex(index); });
    expect(asked).not.toHaveBeenCalled();
    expect(result.current.playing).toBe(true);
    act(() => result.current.selectIndex(3));
    expect(asked).toHaveBeenCalledExactlyOnceWith(3);
    expect(result.current.playing).toBe(false);
  });

  it("snaps trace requests to the nearest valid stop with lower-index ties", () => {
    const tracing: TracingRail = { tracedKey: "total", stopIndices: [4, 0, 2, 2, -1, 50, NaN, 2.5], stopOrdinal: 1, totalStops: 3, onExit: vi.fn() };
    const { result, asked, rerender } = renderPlayback({ tracing });
    expect([...result.current.stopSet!]).toEqual([0, 2, 4]);
    act(() => result.current.selectIndex(1));
    act(() => result.current.selectIndex(3));
    act(() => result.current.selectIndex(4));
    expect(asked.mock.calls.map(([index]) => index)).toEqual([0, 2, 4]);
    asked.mockClear();
    rerender({ tracing: { ...tracing, stopIndices: [-1, NaN] } });
    act(() => result.current.selectIndex(2));
    expect(asked).not.toHaveBeenCalled();
  });

  it("leaves editable/native control keys alone while Escape still exits a focused range", () => {
    const exit = vi.fn();
    const { result, rerender, asked } = renderPlayback({}, 1);
    for (const tag of ["input", "textarea", "select"]) {
      const target = document.createElement(tag);
      act(() => { result.current.handleKeyDown(keyboard("ArrowRight", target)); result.current.handleKeyDown(keyboard(" ", target)); });
    }
    const button = document.createElement("button"), child = document.createElement("span"); button.append(child);
    act(() => result.current.handleKeyDown(keyboard(" ", child)));
    const hostButton = document.createElement("div"); hostButton.setAttribute("role", "button");
    act(() => result.current.handleKeyDown(keyboard(" ", hostButton)));
    expect(asked).not.toHaveBeenCalled();
    expect(result.current.playing).toBe(false);
    rerender({ tracing: { tracedKey: "total", stopIndices: [0, 2], stopOrdinal: 1, totalStops: 2, onExit: exit } });
    const escape = keyboard("Escape", document.createElement("input"));
    act(() => result.current.handleKeyDown(escape));
    expect(exit).toHaveBeenCalledOnce();
    expect(escape.preventDefault).toHaveBeenCalledOnce();
  });
});

describe("playback cancellation generations", () => {
  it("stops manual playback on a new recording and rejects an already queued old timer", () => {
    const { result, rerender, asked } = renderPlayback();
    const timers = vi.spyOn(globalThis, "setTimeout");
    act(() => result.current.togglePlay());
    const oldTimer = timers.mock.calls.at(-1)![0] as () => void;
    rerender({ snapshots: [...snapshots] });
    expect(result.current.playing).toBe(false);
    act(() => { oldTimer(); vi.advanceTimersByTime(20_000); });
    expect(asked).not.toHaveBeenCalled();
  });

  it("invalidates a replaced projection's timer while the same keyed recording continues", () => {
    const { result, rerender, asked } = renderPlayback({ autoPlayKey: "same-run" });
    const timers = vi.spyOn(globalThis, "setTimeout");
    act(() => result.current.togglePlay());
    const oldTimer = timers.mock.calls.at(-1)![0] as () => void;
    rerender({ autoPlayKey: "same-run", snapshots: [...snapshots] });
    act(() => oldTimer());
    expect(asked).not.toHaveBeenCalled();
    expect(result.current.playing).toBe(true);
    act(() => vi.advanceTimersByTime(600));
    expect(asked).toHaveBeenCalledExactlyOnceWith(1);
  });

  it("starts the new recording's offered run while an earlier recording was still playing", () => {
    const { result, rerender, asked } = renderPlayback({ autoPlay: true, autoPlayKey: "first" });
    act(() => vi.advanceTimersByTime(600));
    expect(result.current.index).toBe(1);
    asked.mockClear();
    rerender({ autoPlay: true, autoPlayKey: "second", snapshots: [...snapshots] });
    expect(result.current.index).toBe(0);
    expect(result.current.playing).toBe(true);
    act(() => vi.advanceTimersByTime(600));
    expect(asked.mock.calls.map(([index]) => index)).toEqual([0, 1]);
  });

  it("rejects a queued timer after unmount", () => {
    const { result, unmount, asked } = renderPlayback();
    const timers = vi.spyOn(globalThis, "setTimeout");
    act(() => result.current.togglePlay());
    const oldTimer = timers.mock.calls.at(-1)![0] as () => void;
    unmount();
    act(() => oldTimer());
    expect(asked).not.toHaveBeenCalled();
  });
});
