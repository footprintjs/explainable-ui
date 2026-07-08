import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { StageSnapshot, BaseComponentProps } from "../../types";
import { theme, fontSize } from "../../theme";

/**
 * Same-Rail Rewind (tracing mode) — the rail's AXIS never changes, only its
 * stops do: every dependency was committed earlier than the value it fed, so
 * a backward slice is a sub-sequence of this same timeline. When `tracing`
 * is set, slice members stay landable ("stops"), everything else fades to
 * unlandable ticks, and prev/next walk stop-to-stop ("◀ earlier cause").
 * The cursor stays the ONE `selectedIndex` — no second position exists.
 *
 * THEMING: tracing mode recolors its chrome with ONE token, `--fp-tracing`
 * (default #0d9488 teal) — the TRACING badge, the rail's bottom border, the
 * stop ticks, the walk buttons, and Done — so the tracing rail is
 * unmistakably not normal time-travel. Consumers retheme by setting
 * `--fp-tracing` on any ancestor. Normal mode never reads the token.
 */
export interface TracingRail {
  /** The traced variable — rendered in the mode header. */
  tracedKey: string;
  /** Set while an ingredient filter is active ("▸ via key"). */
  viaKey?: string | null;
  /** Snapshot indices that are stops, ASCENDING. All other ticks become
   *  faint and unlandable (context, not destinations). */
  stopIndices: number[];
  /** 1-based position of the cursor in WALK order (newest first) + total —
   *  the "stop 2 of 6" label. */
  stopOrdinal: number;
  totalStops: number;
  /** Exit tracing (Done button / Escape). The cursor stays put. */
  onExit: () => void;
  /** Clear the via filter back to the full walk (breadcrumb's "show all"). */
  onShowAll?: () => void;
  /** Ingredient count at the CURRENT stop. Together with `onForkPrompt`,
   *  >= 2 turns the walk-back control into "choose cause…": it PROMPTS
   *  instead of moving, so a silent default never hides one parent of a
   *  fork. 0/undefined = not a fork — classic earlier-cause behavior. */
  forkCount?: number;
  /** Open the fork chooser — fired INSTEAD of a cursor move when
   *  `forkCount >= 2` (click or ArrowLeft on the walk-back control). */
  onForkPrompt?: () => void;
}

export interface TimeTravelControlsProps extends BaseComponentProps {
  /** Stage snapshots */
  snapshots: StageSnapshot[];
  /** Currently selected stage index */
  selectedIndex: number;
  /** Callback when selected index changes */
  onIndexChange: (index: number) => void;
  /** Enable auto-play with Gantt-proportional timing */
  autoPlayable?: boolean;
  /** Same-Rail Rewind session — when set, the rail is in tracing mode. */
  tracing?: TracingRail | null;
}

export function TimeTravelControls({
  snapshots,
  selectedIndex,
  onIndexChange,
  autoPlayable = true,
  tracing = null,
  size = "default",
  unstyled = false,
  className,
  style,
}: TimeTravelControlsProps) {
  const [playing, setPlaying] = useState(false);
  const playRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const total = snapshots.length;

  const isTracing = !!tracing;
  const stopSet = useMemo(
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

  // A fork stop PROMPTS instead of moving: the walk-back control asks which
  // ingredient to follow (F2). Enabled even when there is no earlier stop —
  // it opens a chooser, it does not move the cursor.
  const forkPrompt = isTracing && (tracing!.forkCount ?? 0) >= 2 && !!tracing!.onForkPrompt;

  const canPrev = isTracing ? forkPrompt || earlierStop !== null : selectedIndex > 0;
  const canNext = isTracing ? laterStop !== null : selectedIndex < total - 1;

  const goPrev = useCallback(() => {
    setPlaying(false);
    if (isTracing) {
      if (forkPrompt) {
        tracing!.onForkPrompt!();
        return;
      }
      if (earlierStop !== null) onIndexChange(earlierStop);
    } else if (selectedIndex > 0) onIndexChange(selectedIndex - 1);
  }, [isTracing, forkPrompt, tracing, earlierStop, selectedIndex, onIndexChange]);
  const goNext = useCallback(() => {
    setPlaying(false);
    if (isTracing) {
      if (laterStop !== null) onIndexChange(laterStop);
    } else if (selectedIndex < total - 1) onIndexChange(selectedIndex + 1);
  }, [isTracing, laterStop, selectedIndex, total, onIndexChange]);

  // Auto-advance with proportional timing
  useEffect(() => {
    if (!playing || !autoPlayable || isTracing) return;
    if (selectedIndex >= total - 1) {
      setPlaying(false);
      return;
    }
    const stageDur = snapshots[selectedIndex]?.durationMs ?? 1;
    const totalDur = snapshots.reduce((s, snap) => s + snap.durationMs, 0) || 1;
    const fraction = stageDur / totalDur;
    const baseMs = 3000;
    const delay = Math.max(200, Math.min(fraction * baseMs, 2000));

    playRef.current = setTimeout(() => {
      onIndexChange(selectedIndex + 1);
    }, delay);

    return () => {
      if (playRef.current) clearTimeout(playRef.current);
    };
  }, [playing, selectedIndex, snapshots, total, onIndexChange, autoPlayable, isTracing]);

  const togglePlay = useCallback(() => {
    if (playing) {
      setPlaying(false);
    } else {
      if (selectedIndex >= total - 1) onIndexChange(0);
      setPlaying(true);
    }
  }, [playing, selectedIndex, total, onIndexChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft" && canPrev && !playing) {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight" && canNext && !playing) {
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
    [canPrev, canNext, playing, goPrev, goNext, autoPlayable, togglePlay, isTracing, tracing]
  );

  const fs = fontSize[size];
  // F3: tracing chrome uses its OWN token — teal by default, distinct from
  // the violet accent, green done-ticks, and the orange NOW ring — so a
  // glance tells tracing from normal time-travel. Never read in normal mode.
  const tracingColor = "var(--fp-tracing, #0d9488)";

  if (unstyled) {
    return (
      <div
        className={className}
        style={style}
        data-fp="time-travel-controls"
        data-tracing={isTracing || undefined}
        role="toolbar"
        aria-label={isTracing ? `Tracing ${tracing!.tracedKey}` : "Time travel controls"}
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        {isTracing && (
          <span data-fp="tt-tracing-header">
            Tracing {tracing!.tracedKey}
            {tracing!.viaKey && (
              <>
                {" "}▸ via {tracing!.viaKey}{" "}
                <button data-fp="tt-show-all" onClick={tracing!.onShowAll}>show all</button>
              </>
            )}
            {" · "}stop {tracing!.stopOrdinal} of {tracing!.totalStops}
            <button data-fp="tt-exit-tracing" onClick={tracing!.onExit} aria-label="Exit tracing">Done</button>
          </span>
        )}
        <button
          data-fp="tt-prev"
          disabled={!canPrev || playing}
          onClick={goPrev}
          aria-label={isTracing ? (forkPrompt ? "Choose cause" : "Earlier cause") : "Previous stage"}
        >
          {isTracing ? (forkPrompt ? "Choose cause…" : "Earlier cause") : "Prev"}
        </button>
        {autoPlayable && !isTracing && (
          <button data-fp="tt-play" onClick={togglePlay} aria-label={playing ? "Pause" : "Play"}>
            {playing ? "Pause" : "Play"}
          </button>
        )}
        <button
          data-fp="tt-next"
          disabled={!canNext || playing}
          onClick={goNext}
          aria-label={isTracing ? "Toward result" : "Next stage"}
        >
          {isTracing ? "Toward result" : "Next"}
        </button>
        <div data-fp="tt-ticks">
          {snapshots.map((snap, i) => {
            const isStop = !stopSet || stopSet.has(i);
            return (
              <button
                key={i}
                data-fp="tt-tick"
                data-active={i === selectedIndex}
                data-done={i < selectedIndex}
                data-stop={isTracing ? isStop : undefined}
                disabled={isTracing && !isStop}
                onClick={() => { setPlaying(false); onIndexChange(i); }}
                title={snap.stageLabel}
              />
            );
          })}
        </div>
      </div>
    );
  }

  // In tracing mode the walk buttons (and Done) carry the tracing color on
  // border + label — part of F3's "unmistakably different" rail chrome.
  const btnStyle = (disabled: boolean): React.CSSProperties => ({
    background: theme.bgTertiary,
    border: `1px solid ${isTracing ? tracingColor : theme.border}`,
    color: disabled ? theme.textMuted : isTracing ? tracingColor : theme.textPrimary,
    borderRadius: "6px",
    padding: "4px 12px",
    fontSize: fs.body,
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    flexShrink: 0,
  });

  return (
    <div
      className={className}
      style={{
        padding: "6px 12px",
        background: theme.bgSecondary,
        borderBottom: isTracing ? `2px solid ${tracingColor}` : `1px solid ${theme.border}`,
        display: "flex",
        alignItems: "center",
        gap: 6,
        flexShrink: 0,
        ...style,
      }}
      data-fp="time-travel-controls"
      data-tracing={isTracing || undefined}
      role="toolbar"
      aria-label={isTracing ? `Tracing ${tracing!.tracedKey}` : "Time travel controls"}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Tracing-mode header — loud chrome so the changed rail is never a surprise */}
      {isTracing && (
        <span
          data-fp="tt-tracing-header"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexShrink: 0,
            fontSize: fs.body,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "#fff",
              background: tracingColor,
              borderRadius: 4,
              padding: "2px 7px",
            }}
          >
            Tracing
          </span>
          <span style={{ fontFamily: "monospace", fontWeight: 600, color: tracingColor }}>
            {tracing!.tracedKey}
          </span>
          {tracing!.viaKey && (
            <span style={{ color: theme.textMuted }}>
              ▸ via{" "}
              <span style={{ fontFamily: "monospace", color: theme.textSecondary }}>
                {tracing!.viaKey}
              </span>{" "}
              <button
                data-fp="tt-show-all"
                onClick={tracing!.onShowAll}
                style={{
                  border: "none",
                  background: "transparent",
                  color: tracingColor,
                  cursor: "pointer",
                  fontSize: fs.body,
                  textDecoration: "underline",
                  padding: 0,
                }}
              >
                show all
              </button>
            </span>
          )}
          <span style={{ color: theme.textMuted }}>
            · stop {tracing!.stopOrdinal} of {tracing!.totalStops}
          </span>
        </span>
      )}

      <button
        style={btnStyle(!canPrev || playing)}
        disabled={!canPrev || playing}
        onClick={goPrev}
        aria-label={isTracing ? (forkPrompt ? "Choose cause" : "Earlier cause") : "Previous stage"}
        title={
          isTracing
            ? forkPrompt
              ? "This stop is a fork — choose which cause to follow"
              : "Earlier cause"
            : "Previous stage"
        }
        data-fp="tt-prev"
      >
        {isTracing ? (forkPrompt ? "⑂ choose cause…" : "◀ earlier cause") : "◀"}
      </button>

      {autoPlayable && !isTracing && (
        <button
          onClick={togglePlay}
          style={{
            background: playing ? theme.primary : theme.bgTertiary,
            border: `1px solid ${theme.border}`,
            color: playing ? "white" : theme.textPrimary,
            borderRadius: "6px",
            width: 28,
            height: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            fontSize: 14,
            flexShrink: 0,
          }}
          title={playing ? "Pause" : "Play"}
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? "⏸" : "▶"}
        </button>
      )}

      <button
        style={btnStyle(!canNext || playing)}
        disabled={!canNext || playing}
        onClick={goNext}
        aria-label={isTracing ? "Toward result" : "Next stage"}
        title={isTracing ? "Toward result" : "Next stage"}
        data-fp="tt-next"
      >
        {isTracing ? "toward result ▶" : "▶"}
      </button>

      {/* Tick-mark timeline — in tracing mode non-stops fade to unlandable
          ticks (context, not destinations); stops stay bright and clickable. */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          gap: 2,
          padding: "0 4px",
        }}
      >
        {snapshots.map((snap, i) => {
          const isActive = i === selectedIndex;
          const isDone = i < selectedIndex;
          const isStop = !stopSet || stopSet.has(i);
          const unlandable = isTracing && !isStop;
          return (
            <button
              key={i}
              onClick={() => { setPlaying(false); onIndexChange(i); }}
              disabled={unlandable}
              title={unlandable ? `${snap.stageLabel} (not part of this trace)` : snap.stageLabel}
              data-fp="tt-tick"
              data-stop={isTracing ? isStop : undefined}
              data-active={isActive || undefined}
              style={{
                flex: 1,
                height: isActive ? 14 : unlandable ? 4 : 8,
                borderRadius: 3,
                border: "none",
                cursor: unlandable ? "default" : "pointer",
                background: isTracing
                  ? isActive
                    ? tracingColor
                    : isStop
                      ? "color-mix(in srgb, " + tracingColor + " 55%, transparent)"
                      : theme.bgTertiary
                  : isActive
                    ? theme.primary
                    : isDone
                      ? theme.success
                      : theme.bgTertiary,
                opacity: unlandable ? 0.3 : isTracing || isDone || isActive ? 1 : 0.4,
                transition: "all 0.15s ease",
              }}
            />
          );
        })}
      </div>

      {isTracing && (
        <button
          data-fp="tt-exit-tracing"
          onClick={tracing!.onExit}
          aria-label="Exit tracing"
          style={{ ...btnStyle(false), background: "transparent" }}
        >
          Done ✕
        </button>
      )}
    </div>
  );
}
