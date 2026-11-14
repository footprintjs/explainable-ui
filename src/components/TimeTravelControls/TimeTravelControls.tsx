import { useRef } from "react";
import type { StageSnapshot, BaseComponentProps } from "../../types";
import { theme, fontSize } from "../../theme";
import { useTimeTravelPlayback } from "./useTimeTravelPlayback";

/**
 * Same-Rail Rewind (tracing mode) — the rail's AXIS never changes, only its
 * stops do: every dependency was committed earlier than the value it fed, so
 * a backward slice is a sub-sequence of this same timeline. When `tracing`
 * is set, slice members stay landable ("stops"), everything else fades to
 * unlandable ticks, and prev/next walk stop-to-stop ("◀ earlier recorded step").
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
  /** Ingredient count at the CURRENT stop. At the earliest landable stop,
   *  >= 2 together with `onForkPrompt` offers "choose cause…" instead of a
   *  disabled button. Earlier recorded steps otherwise remain reachable in
   *  time order; following a particular input is a separate action. */
  forkCount?: number;
  /** Open the fork chooser at the earliest landable stop when `forkCount >= 2`
   *  (click or ArrowLeft on the walk-back control). */
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
  /**
   * Play the recording by itself, once: the cursor goes to the first stage and
   * walks to the last on the Play loop, then stops. Pause, scrubbing, arrow
   * keys, space, or any other move of the cursor stop it for good. It does not
   * start under `prefers-reduced-motion: reduce`, with `autoPlayable={false}`,
   * in tracing mode, or with fewer than two stages. Default false.
   */
  autoPlay?: boolean;
  /**
   * What counts as a new recording for `autoPlay`. Default: the `snapshots`
   * array itself, so keep it stable across renders or pass a run id here.
   */
  autoPlayKey?: unknown;
}

export function TimeTravelControls(props: TimeTravelControlsProps) {
  const offered = useRef<unknown>(undefined);
  return <TimeTravelRail {...props} offered={offered} />;
}

/**
 * The rail. Internal, not a package export. `offered` is the last recording
 * autoPlay was offered, held by whoever outlives this rail: a shell can remount
 * its rail at any time, so the shell holds it.
 */
export function TimeTravelRail({
  snapshots,
  selectedIndex,
  onIndexChange,
  autoPlayable = true,
  tracing = null,
  autoPlay = false,
  autoPlayKey,
  size = "default",
  unstyled = false,
  className,
  style,
  offered,
}: TimeTravelControlsProps & { offered: { current: unknown } }) {
  const {
    playing, isTracing, stopSet, forkPrompt, canPrev, canNext,
    goPrev, goNext, selectIndex, togglePlay, handleKeyDown,
  } = useTimeTravelPlayback({
    snapshots, selectedIndex, onIndexChange, autoPlayable, tracing,
    autoPlay, autoPlayKey, offered,
  });

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
                <button type="button" data-fp="tt-show-all" onClick={tracing!.onShowAll}>show all</button>
              </>
            )}
            {" · "}stop {tracing!.stopOrdinal} of {tracing!.totalStops}
            <button type="button" data-fp="tt-exit-tracing" onClick={tracing!.onExit} aria-label="Exit tracing">Done</button>
          </span>
        )}
        <button
          type="button"
          data-fp="tt-prev"
          disabled={!canPrev || playing}
          onClick={goPrev}
          aria-label={isTracing ? (forkPrompt ? "Choose cause" : "Earlier recorded step") : "Previous stage"}
        >
          {isTracing ? (forkPrompt ? "Choose cause…" : "Earlier recorded step") : "Prev"}
        </button>
        {autoPlayable && !isTracing && (
          <button type="button" data-fp="tt-play" onClick={togglePlay} aria-label={playing ? "Pause" : "Play"}>
            {playing ? "Pause" : "Play"}
          </button>
        )}
        <button
          type="button"
          data-fp="tt-next"
          disabled={!canNext || playing}
          onClick={goNext}
          aria-label={isTracing ? "Later recorded step" : "Next stage"}
        >
          {isTracing ? "Later recorded step" : "Next"}
        </button>
        <div data-fp="tt-ticks">
          {snapshots.map((snap, i) => {
            const isStop = !stopSet || stopSet.has(i);
            return (
              <button
                type="button"
                key={i}
                data-fp="tt-tick"
                data-active={i === selectedIndex}
                data-done={i < selectedIndex}
                data-stop={isTracing ? isStop : undefined}
                disabled={isTracing && !isStop}
                onClick={() => selectIndex(i)}
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
                type="button"
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
        type="button"
        style={btnStyle(!canPrev || playing)}
        disabled={!canPrev || playing}
        onClick={goPrev}
        aria-label={isTracing ? (forkPrompt ? "Choose cause" : "Earlier recorded step") : "Previous stage"}
        title={
          isTracing
            ? forkPrompt
              ? "This stop is a fork — choose which cause to follow"
              : "Earlier recorded step"
            : "Previous stage"
        }
        data-fp="tt-prev"
      >
        {isTracing ? (forkPrompt ? "⑂ choose cause…" : "◀ earlier recorded step") : "◀"}
      </button>

      {autoPlayable && !isTracing && (
        <button
          type="button"
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
        type="button"
        style={btnStyle(!canNext || playing)}
        disabled={!canNext || playing}
        onClick={goNext}
        aria-label={isTracing ? "Later recorded step" : "Next stage"}
        title={isTracing ? "Later recorded step" : "Next stage"}
        data-fp="tt-next"
      >
        {isTracing ? "later recorded step ▶" : "▶"}
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
              type="button"
              key={i}
              onClick={() => selectIndex(i)}
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
          type="button"
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
