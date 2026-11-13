import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { TimeTravelControlsProps } from "./TimeTravelControls";
import { prefersReducedMotion } from "./prefersReducedMotion";

type PlaybackOptions = Pick<TimeTravelControlsProps,
  "snapshots" | "selectedIndex" | "onIndexChange" | "autoPlayable" | "tracing" | "autoPlay" | "autoPlayKey"
> & {
  /** Run-offer memory belongs to the owner that outlives a remounted rail. */
  offered: { current: unknown };
};

/** Playback and navigation commands over the host's one controlled cursor. */
export function useTimeTravelPlayback({
  snapshots,
  selectedIndex,
  onIndexChange,
  autoPlayable = true,
  tracing = null,
  autoPlay = false,
  autoPlayKey,
  offered,
}: PlaybackOptions) {
  const [playing, setPlaying] = useState(false);
  const playRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const total = snapshots.length;
  // Set only while a run that autoPlay started is going. `asked` is the index
  // it last requested and `seen` the last one it saw, so any other move of the
  // ONE cursor (the timeline, the chart, a trace) reads as a person's.
  const autoRun = useRef<{ asked: number; seen: number } | null>(null);
  const recording = autoPlayKey ?? snapshots;

  const stopPlaying = useCallback(() => {
    autoRun.current = null;
    setPlaying(false);
  }, []);

  const isTracing = !!tracing;
  const stopSet = useMemo<ReadonlySet<number> | null>(
    () => (tracing ? new Set(tracing.stopIndices) : null),
    [tracing],
  );

  // In tracing mode "earlier cause" = the nearest stop BEFORE the cursor in
  // time (which is the NEXT stop in walk order — the walk runs backward).
  const earlierStop = useMemo(() => {
    if (!tracing) return null;
    const earlier = tracing.stopIndices.filter((i) => i < selectedIndex);
    return earlier.length > 0 ? earlier[earlier.length - 1] : null;
  }, [tracing, selectedIndex]);
  const laterStop = useMemo(() => {
    if (!tracing) return null;
    return tracing.stopIndices.find((i) => i > selectedIndex) ?? null;
  }, [tracing, selectedIndex]);

  // A fork stop PROMPTS instead of moving — but ONLY at the walk's earliest
  // stop, where the monotone walk has nowhere left to go.
  //
  // WHY THE GUARD (regression fix): the walk is reverse-commit order, and
  // every dependency committed earlier than the value it fed, so "◀ earlier
  // cause" already visits EVERY frame — including both parents of a fork
  // (traceWalk.ts's load-bearing fact: "forks are explained, not navigated").
  // Prompting whenever `forkCount >= 2` therefore hijacked the walk-back
  // button at nearly every stop of a real run — a stage that reads 6-9
  // written keys is a "fork" by that count — so the rail's ◀ never moved the
  // cursor and the walk was unreachable from the rail. Following an
  // ingredient RE-ANCHORS to a longer walk, which is genuine forward motion
  // only when there is no earlier stop; anywhere else it is a shortcut the
  // card already offers (its ingredient chips are always on screen).
  const forkPrompt =
    isTracing &&
    earlierStop === null &&
    (tracing!.forkCount ?? 0) >= 2 &&
    !!tracing!.onForkPrompt;

  const canPrev = isTracing ? forkPrompt || earlierStop !== null : selectedIndex > 0;
  const canNext = isTracing ? laterStop !== null : selectedIndex < total - 1;

  const goPrev = useCallback(() => {
    stopPlaying();
    if (isTracing) {
      if (forkPrompt) {
        tracing!.onForkPrompt!();
        return;
      }
      if (earlierStop !== null) onIndexChange(earlierStop);
    } else if (selectedIndex > 0) onIndexChange(selectedIndex - 1);
  }, [stopPlaying, isTracing, forkPrompt, tracing, earlierStop, selectedIndex, onIndexChange]);
  const goNext = useCallback(() => {
    stopPlaying();
    if (isTracing) {
      if (laterStop !== null) onIndexChange(laterStop);
    } else if (selectedIndex < total - 1) onIndexChange(selectedIndex + 1);
  }, [stopPlaying, isTracing, laterStop, selectedIndex, total, onIndexChange]);

  // A run autoPlay started ends for good when anything else takes the cursor.
  // The Play loop alone would only pause for tracing and then carry on.
  useEffect(() => {
    const run = autoRun.current;
    if (!run) return;
    const movedElsewhere = selectedIndex !== run.seen && selectedIndex !== run.asked;
    if (!autoPlay || !autoPlayable || isTracing || movedElsewhere) stopPlaying();
    else run.seen = selectedIndex;
  }, [selectedIndex, autoPlay, autoPlayable, isTracing, stopPlaying]);

  // Auto-advance with proportional timing
  useEffect(() => {
    if (!playing || !autoPlayable || isTracing) return;
    if (selectedIndex >= total - 1) {
      stopPlaying();
      return;
    }
    const stageDur = snapshots[selectedIndex]?.durationMs ?? 1;
    const totalDur = snapshots.reduce((s, snap) => s + snap.durationMs, 0) || 1;
    const fraction = stageDur / totalDur;
    const baseMs = 3000;
    const delay = Math.max(200, Math.min(fraction * baseMs, 2000));

    playRef.current = setTimeout(() => {
      if (autoRun.current) autoRun.current.asked = selectedIndex + 1;
      onIndexChange(selectedIndex + 1);
    }, delay);

    return () => {
      if (playRef.current) clearTimeout(playRef.current);
    };
  }, [playing, selectedIndex, snapshots, total, onIndexChange, autoPlayable, isTracing, stopPlaying]);

  // autoPlay's one shot: each recording is offered once, playable or not, so a
  // re-render, a finished trace or a later `autoPlay` never starts it.
  useEffect(() => {
    if (Object.is(offered.current, recording)) return;
    offered.current = recording;
    if (autoRun.current) stopPlaying(); // That run was playing the last recording.
    if (!autoPlay || !autoPlayable || isTracing || total < 2 || prefersReducedMotion()) return;
    autoRun.current = { asked: 0, seen: selectedIndex };
    if (selectedIndex !== 0) onIndexChange(0);
    setPlaying(true);
  }, [recording, offered, autoPlay, autoPlayable, isTracing, total, selectedIndex, onIndexChange, stopPlaying]);

  const togglePlay = useCallback(() => {
    if (playing) {
      stopPlaying();
    } else {
      if (selectedIndex >= total - 1) onIndexChange(0);
      setPlaying(true);
    }
  }, [playing, selectedIndex, total, onIndexChange, stopPlaying]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Manual Play makes the arrows wait for Pause. A recording playing by
      // itself yields to them, even where there is no stage to step to.
      const yields = autoRun.current !== null && (e.key === "ArrowLeft" || e.key === "ArrowRight");
      if (yields) stopPlaying();
      const free = !playing || yields;
      if (e.key === "ArrowLeft" && canPrev && free) {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight" && canNext && free) {
        e.preventDefault();
        goNext();
      } else if (e.key === "Escape" && isTracing) {
        e.preventDefault();
        tracing!.onExit();
      } else if (e.key === " " && autoPlayable && !isTracing) {
        e.preventDefault();
        togglePlay();
      }
    },
    [canPrev, canNext, playing, goPrev, goNext, autoPlayable, togglePlay, isTracing, tracing, stopPlaying]
  );

  const selectIndex = useCallback((index: number) => {
    stopPlaying();
    onIndexChange(index);
  }, [stopPlaying, onIndexChange]);

  return {
    playing,
    isTracing,
    stopSet,
    forkPrompt,
    canPrev,
    canNext,
    goPrev,
    goNext,
    selectIndex,
    togglePlay,
    handleKeyDown,
  };
}
