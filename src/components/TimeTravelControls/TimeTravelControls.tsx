import { useState, useEffect, useRef, useCallback } from "react";
import type { StageSnapshot, BaseComponentProps } from "../../types";
import { theme, fontSize } from "../../theme";

export interface TimeTravelControlsProps extends BaseComponentProps {
  /** Stage snapshots */
  snapshots: StageSnapshot[];
  /** Currently selected stage index */
  selectedIndex: number;
  /** Callback when selected index changes */
  onIndexChange: (index: number) => void;
  /** Enable auto-play with Gantt-proportional timing */
  autoPlayable?: boolean;
}

export function TimeTravelControls({
  snapshots,
  selectedIndex,
  onIndexChange,
  autoPlayable = true,
  size = "default",
  unstyled = false,
  className,
  style,
}: TimeTravelControlsProps) {
  const [playing, setPlaying] = useState(false);
  const playRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const total = snapshots.length;
  const canPrev = selectedIndex > 0;
  const canNext = selectedIndex < total - 1;

  // Auto-advance with proportional timing
  useEffect(() => {
    if (!playing || !autoPlayable) return;
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
  }, [playing, selectedIndex, snapshots, total, onIndexChange, autoPlayable]);

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
        setPlaying(false);
        onIndexChange(selectedIndex - 1);
      } else if (e.key === "ArrowRight" && canNext && !playing) {
        e.preventDefault();
        setPlaying(false);
        onIndexChange(selectedIndex + 1);
      } else if (e.key === " " && autoPlayable) {
        e.preventDefault();
        togglePlay();
      }
    },
    [canPrev, canNext, playing, selectedIndex, onIndexChange, autoPlayable, togglePlay]
  );

  const fs = fontSize[size];

  if (unstyled) {
    return (
      <div
        className={className}
        style={style}
        data-fp="time-travel-controls"
        role="toolbar"
        aria-label="Time travel controls"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        <button
          data-fp="tt-prev"
          disabled={!canPrev || playing}
          onClick={() => { setPlaying(false); onIndexChange(selectedIndex - 1); }}
          aria-label="Previous stage"
        >
          Prev
        </button>
        {autoPlayable && (
          <button data-fp="tt-play" onClick={togglePlay} aria-label={playing ? "Pause" : "Play"}>
            {playing ? "Pause" : "Play"}
          </button>
        )}
        <button
          data-fp="tt-next"
          disabled={!canNext || playing}
          onClick={() => { setPlaying(false); onIndexChange(selectedIndex + 1); }}
          aria-label="Next stage"
        >
          Next
        </button>
        <div data-fp="tt-ticks">
          {snapshots.map((snap, i) => (
            <button
              key={i}
              data-fp="tt-tick"
              data-active={i === selectedIndex}
              data-done={i < selectedIndex}
              onClick={() => { setPlaying(false); onIndexChange(i); }}
              title={snap.stageLabel}
            />
          ))}
        </div>
      </div>
    );
  }

  const btnStyle = (disabled: boolean): React.CSSProperties => ({
    background: theme.bgTertiary,
    border: `1px solid ${theme.border}`,
    color: disabled ? theme.textMuted : theme.textPrimary,
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
        borderBottom: `1px solid ${theme.border}`,
        display: "flex",
        alignItems: "center",
        gap: 6,
        flexShrink: 0,
        ...style,
      }}
      data-fp="time-travel-controls"
      role="toolbar"
      aria-label="Time travel controls"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <button
        style={btnStyle(!canPrev || playing)}
        disabled={!canPrev || playing}
        onClick={() => { setPlaying(false); onIndexChange(selectedIndex - 1); }}
        aria-label="Previous stage"
      >
        &#9664;
      </button>

      {autoPlayable && (
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
          {playing ? "\u23F8" : "\u25B6"}
        </button>
      )}

      <button
        style={btnStyle(!canNext || playing)}
        disabled={!canNext || playing}
        onClick={() => { setPlaying(false); onIndexChange(selectedIndex + 1); }}
        aria-label="Next stage"
      >
        &#9654;
      </button>

      {/* Tick-mark timeline */}
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
          return (
            <button
              key={i}
              onClick={() => { setPlaying(false); onIndexChange(i); }}
              title={snap.stageLabel}
              style={{
                flex: 1,
                height: isActive ? 14 : 8,
                borderRadius: 3,
                border: "none",
                cursor: "pointer",
                background: isActive
                  ? theme.primary
                  : isDone
                    ? theme.success
                    : theme.bgTertiary,
                opacity: isDone || isActive ? 1 : 0.4,
                transition: "all 0.15s ease",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
