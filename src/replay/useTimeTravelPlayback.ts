import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { StageSnapshot } from "../types";
import type { ReplayControlsOptions, TracingRail } from "../model/replayControls";
import { prefersReducedMotion } from "./prefersReducedMotion";

interface PlaybackOptions {
  snapshots: StageSnapshot[];
  selectedIndex: number;
  onIndexChange(index: number): void;
  autoPlayable?: boolean;
  tracing?: TracingRail | null;
  autoPlay?: boolean;
  autoPlayKey?: unknown;
  replayControls?: ReplayControlsOptions;
  /** Run-offer memory belongs to the owner that outlives a remounted rail. */
  offered: { current: unknown };
  /** An empty live bootstrap has not presented a recording to its reader yet. */
  offerReady?: boolean;
};

const validIndex = (index: number, total: number) => Number.isFinite(index) && Number.isInteger(index) && index >= 0 && index < total;

/** Playback and navigation commands over the host's one controlled cursor. */
export function useTimeTravelPlayback({
  snapshots, selectedIndex, onIndexChange, autoPlayable = true, tracing = null,
  autoPlay = false, autoPlayKey, replayControls, offered, offerReady = true,
}: PlaybackOptions) {
  const [playing, setPlaying] = useState(false);
  const playRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // A generation makes cancellation effective even for a timer already queued
  // by the browser or a retained action from an older rendered control.
  const playState = useRef({ active: false, generation: {} });
  const autoRun = useRef<{ asked: number; seen: number } | null>(null);
  const total = snapshots.length;
  const recording = autoPlayKey ?? snapshots;
  const previousNext = replayControls?.previousNext !== false;
  const slider = replayControls?.slider !== false;
  const canPlay = autoPlayable && replayControls?.playPause !== false && !tracing && total >= 2;
  const interval = replayControls?.intervalMs;
  const intervalMs = typeof interval === "number" && Number.isFinite(interval) ? Math.max(200, Math.min(interval, 10_000)) : undefined;

  const stopPlaying = useCallback(() => {
    autoRun.current = null;
    playState.current = { active: false, generation: {} };
    if (playRef.current !== null) clearTimeout(playRef.current);
    playRef.current = null;
    setPlaying(false);
  }, []);
  const startPlaying = useCallback(() => {
    playState.current = { active: true, generation: {} };
    setPlaying(true);
  }, []);

  const isTracing = !!tracing;
  const stopIndices = useMemo(() => tracing
    ? [...new Set(tracing.stopIndices.filter(index => validIndex(index, total)))].sort((left, right) => left - right)
    : null, [tracing, total]);
  const stopSet = useMemo<ReadonlySet<number> | null>(() => stopIndices ? new Set(stopIndices) : null, [stopIndices]);
  const earlierStop = stopIndices?.filter(index => index < selectedIndex).at(-1) ?? null;
  const laterStop = stopIndices?.find(index => index > selectedIndex) ?? null;

  // Only the earliest stop offers the fork chooser. Mid-walk forks remain
  // reachable by the same monotone earlier/later navigation as every stop.
  const forkPrompt = isTracing && earlierStop === null && (tracing!.forkCount ?? 0) >= 2 && !!tracing!.onForkPrompt;
  const cursorValid = validIndex(selectedIndex, total);
  const canPrev = previousNext && cursorValid && (isTracing ? forkPrompt || earlierStop !== null : selectedIndex > 0);
  const canNext = previousNext && cursorValid && (isTracing ? laterStop !== null : selectedIndex < total - 1);

  const context = { snapshots, selectedIndex, onIndexChange, recording, total, canPlay, previousNext, slider,
    tracing, isTracing, forkPrompt, earlierStop, laterStop, canPrev, canNext, stopIndices, intervalMs };
  const latest = useRef(context);
  latest.current = context;

  const goPrev = useCallback(() => {
    const current = latest.current;
    if (!current.previousNext || !validIndex(current.selectedIndex, current.total)) return;
    stopPlaying();
    if (current.isTracing) {
      if (current.forkPrompt) current.tracing!.onForkPrompt!();
      else if (current.earlierStop !== null) current.onIndexChange(current.earlierStop);
    } else if (current.selectedIndex > 0) current.onIndexChange(current.selectedIndex - 1);
  }, [stopPlaying]);
  const goNext = useCallback(() => {
    const current = latest.current;
    if (!current.previousNext || !validIndex(current.selectedIndex, current.total)) return;
    stopPlaying();
    if (current.isTracing) {
      if (current.laterStop !== null) current.onIndexChange(current.laterStop);
    } else if (current.selectedIndex < current.total - 1) current.onIndexChange(current.selectedIndex + 1);
  }, [stopPlaying]);

  // A source replacement ends manual playback too. A new array under the
  // same explicit recording key is a refreshed projection, not a new offer.
  const observedRecording = useRef(recording);
  useEffect(() => {
    if (!Object.is(observedRecording.current, recording)) {
      observedRecording.current = recording;
      stopPlaying();
    }
  }, [recording, stopPlaying]);
  useEffect(() => { if (!canPlay) stopPlaying(); }, [canPlay, stopPlaying]);

  // A run autoPlay started ends for good when anything else takes the cursor.
  // Ordinary manual Play keeps its existing external-cursor-move behavior.
  useEffect(() => {
    const run = autoRun.current;
    if (!run) return;
    const movedElsewhere = selectedIndex !== run.seen && selectedIndex !== run.asked;
    if (!autoPlay || !canPlay || movedElsewhere) stopPlaying();
    else run.seen = selectedIndex;
  }, [selectedIndex, autoPlay, canPlay, stopPlaying]);

  // Every recording is offered once, including a hidden or disabled Play
  // control. Re-enabling it never takes the cursor away from the reader.
  useEffect(() => {
    if (!offerReady || Object.is(offered.current, recording)) return;
    offered.current = recording;
    if (playState.current.active) stopPlaying();
    if (!autoPlay || !canPlay || prefersReducedMotion()) return;
    autoRun.current = { asked: 0, seen: selectedIndex };
    if (selectedIndex !== 0) onIndexChange(0);
    startPlaying();
  }, [recording, offered, offerReady, autoPlay, canPlay, selectedIndex, onIndexChange, stopPlaying, startPlaying]);

  useEffect(() => {
    if (!playing || !canPlay || !playState.current.active) return;
    if (!validIndex(selectedIndex, total) || selectedIndex >= total - 1) {
      stopPlaying();
      return;
    }
    const finiteDuration = (duration: number) => Number.isFinite(duration) && duration > 0 ? duration : 0;
    const stageDur = finiteDuration(snapshots[selectedIndex]?.durationMs ?? 0);
    const totalDur = snapshots.reduce((sum, snapshot) => sum + finiteDuration(snapshot.durationMs), 0) || 1;
    const delay = intervalMs ?? Math.max(200, Math.min(stageDur / totalDur * 3000, 2000));
    const generation = playState.current.generation;
    let canceled = false;
    const timer = setTimeout(() => {
      const current = latest.current;
      if (canceled || !playState.current.active || playState.current.generation !== generation || !current.canPlay ||
        !Object.is(current.recording, recording) || current.snapshots !== snapshots || current.selectedIndex !== selectedIndex) return;
      if (playRef.current === timer) playRef.current = null;
      const next = selectedIndex + 1;
      if (!validIndex(next, current.total)) return;
      if (autoRun.current) autoRun.current.asked = next;
      current.onIndexChange(next);
    }, delay);
    playRef.current = timer;
    return () => {
      canceled = true;
      clearTimeout(timer);
      if (playRef.current === timer) playRef.current = null;
    };
  }, [playing, selectedIndex, snapshots, total, canPlay, intervalMs, recording, onIndexChange, stopPlaying]);

  const play = useCallback(() => {
    const current = latest.current;
    if (!current.canPlay || playState.current.active) return;
    if (!validIndex(current.selectedIndex, current.total) || current.selectedIndex >= current.total - 1) current.onIndexChange(0);
    startPlaying();
  }, [startPlaying]);
  const togglePlay = useCallback(() => {
    if (!latest.current.canPlay) return;
    if (playState.current.active) stopPlaying();
    else play();
  }, [stopPlaying, play]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    const current = latest.current;
    if (event.key === "Escape" && current.isTracing) {
      event.preventDefault();
      current.tracing!.onExit();
      return;
    }
    const target = event.target as HTMLElement;
    if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable ||
      target.closest?.('[contenteditable="true"], [contenteditable=""]')) return;
    if (event.key === " " && target.closest?.('button, [role="button"]')) return;
    const arrow = event.key === "ArrowLeft" || event.key === "ArrowRight";
    const yields = current.previousNext && autoRun.current !== null && arrow;
    if (yields) stopPlaying();
    const free = !playState.current.active || yields;
    if (event.key === "ArrowLeft" && current.canPrev && free) {
      event.preventDefault(); goPrev();
    } else if (event.key === "ArrowRight" && current.canNext && free) {
      event.preventDefault(); goNext();
    } else if (event.key === " " && current.canPlay) {
      event.preventDefault(); togglePlay();
    }
  }, [goPrev, goNext, togglePlay, stopPlaying]);

  const selectIndex = useCallback((index: number) => {
    const current = latest.current;
    if (!current.slider || !validIndex(index, current.total)) return;
    let target = index;
    if (current.stopIndices) {
      if (!current.stopIndices.length) return;
      target = current.stopIndices.reduce((nearest, stop) => Math.abs(stop - index) < Math.abs(nearest - index) ? stop : nearest);
    }
    stopPlaying();
    current.onIndexChange(target);
  }, [stopPlaying]);

  return { playing, play, canPlay, isTracing, stopSet, forkPrompt, canPrev, canNext, goPrev, goNext, selectIndex, togglePlay, stopPlaying, handleKeyDown };
}

/** Internal shared transport/controller type; no second playback owner is required. */
export type TimeTravelPlayback = ReturnType<typeof useTimeTravelPlayback>;
