import { useState, useMemo, useRef, useEffect } from "react";
import type { StageSnapshot, BaseComponentProps } from "../../types";
import { theme, fontSize, padding, themeModeVars } from "../../theme";
import type { ThemeModeProps } from "../../theme";

export interface GanttTimelineProps extends BaseComponentProps, ThemeModeProps {
  /** Stage snapshots with timing info */
  snapshots: StageSnapshot[];
  /** Currently selected stage index */
  selectedIndex?: number;
  /** Callback when a stage bar is clicked */
  onSelect?: (index: number) => void;
  /** Max visible rows before collapsing (0 = no collapse). Default: 5 */
  maxVisibleRows?: number;
}

/** The note shown instead of the time axis when nothing timed the run.
 *  Says what the bars DO mean, so the chart isn't read as "everything took
 *  0ms" (which is what the old 1%-wide bars + "0ms" rows looked like). */
const NO_TIMING_NOTE = "No timing recorded — bars show the order stages ran, not how long they took.";
const NO_TIMING_HINT = "Durations come from footprintjs's metrics recorder; this run was recorded without one.";
/** Per-row duration cell when there is no timing to show. Not "0ms". */
const NO_DURATION = "—";

/**
 * Horizontal Gantt-style timeline showing stage durations and overlap.
 * Collapses to `maxVisibleRows` with expand/collapse toggle.
 * Auto-scrolls to keep the active stage visible when collapsed.
 *
 * Honest degrade: a run recorded without a metrics recorder has all-zero
 * durations. Rather than draw invisible 1%-wide bars against a fabricated
 * 1ms axis and label every row "0ms", the component switches to SEQUENCE
 * bars — equal width, positioned by execution order — plus one note saying
 * so. Order is real; duration is not, and is never invented.
 */
export function GanttTimeline({
  snapshots,
  selectedIndex = 0,
  onSelect,
  size = "default",
  unstyled = false,
  className,
  style,
  theme: themeMode,
  maxVisibleRows = 5,
}: GanttTimelineProps) {
  const [expanded, setExpanded] = useState(false);
  const activeRowRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const totalWallTime = useMemo(
    () => Math.max(...snapshots.map((s) => s.startMs + s.durationMs), 1),
    [snapshots]
  );

  // One non-zero duration anywhere means the run WAS timed — keep the real
  // time axis. Stages that all report zero mean nothing measured them (see
  // the component JSDoc). An EMPTY timeline is neither — leave it alone.
  const untimed = useMemo(
    () => snapshots.length > 0 && snapshots.every((s) => s.durationMs === 0),
    [snapshots],
  );
  const rowDuration = (snap: StageSnapshot): string =>
    untimed ? NO_DURATION : `${snap.durationMs}ms`;
  const rowLabel = (snap: StageSnapshot, idx: number): string =>
    untimed
      ? `${snap.stageLabel}, step ${idx + 1} of ${snapshots.length}, no timing recorded`
      : `${snap.stageLabel}, ${snap.durationMs}ms`;
  /** Bar geometry: real time when timed, equal-width sequence slots when not. */
  const barGeometry = (snap: StageSnapshot, idx: number): { leftPct: number; widthPct: number } =>
    untimed
      ? { leftPct: (idx / snapshots.length) * 100, widthPct: 100 / snapshots.length }
      : {
          leftPct: (snap.startMs / totalWallTime) * 100,
          widthPct: Math.max((snap.durationMs / totalWallTime) * 100, 1),
        };

  const fs = fontSize[size];
  const pad = padding[size];
  const labelWidth = size === "compact" ? 50 : size === "detailed" ? 100 : 80;
  const msWidth = size === "compact" ? 28 : 36;
  const rowHeight = size === "compact" ? 18 : 22;

  const collapsible = maxVisibleRows > 0 && snapshots.length > maxVisibleRows;
  const showAll = expanded || !collapsible;

  // Auto-scroll to active row when collapsed
  useEffect(() => {
    if (!showAll && activeRowRef.current && scrollContainerRef.current) {
      activeRowRef.current.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [selectedIndex, showAll]);

  if (unstyled) {
    return (
      <div
        className={className}
        style={style}
        data-fp="gantt-timeline"
        data-timing={untimed ? "none" : undefined}
        role="listbox"
        aria-label="Execution timeline"
      >
        {snapshots.map((snap, idx) => (
          <div
            key={`${snap.stageName}-${idx}`}
            data-fp="gantt-bar"
            data-selected={idx === selectedIndex}
            data-visible={idx <= selectedIndex}
            role="option"
            aria-selected={idx === selectedIndex}
            aria-label={rowLabel(snap, idx)}
            onClick={() => onSelect?.(idx)}
          >
            <span data-fp="gantt-label">{snap.stageLabel}</span>
            <span data-fp="gantt-duration">{rowDuration(snap)}</span>
          </div>
        ))}
        {untimed && (
          <div data-fp="gantt-no-timing" title={NO_TIMING_HINT}>
            {NO_TIMING_NOTE}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={className}
      // `theme="light"` stamps the light preset here, so a timeline mounted
      // on its own follows the host app instead of the dark fallbacks.
      style={{ ...themeModeVars(themeMode), padding: pad, fontFamily: theme.fontSans, ...style }}
      data-fp="gantt-timeline"
      data-timing={untimed ? "none" : undefined}
    >
      {/* Header with collapse toggle */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: fs.label,
            fontWeight: 600,
            color: theme.textMuted,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          {size === "compact" ? "Timeline" : "Execution Timeline"}
        </span>
        {collapsible && (
          <button
            onClick={() => setExpanded((e) => !e)}
            style={{
              background: "none",
              border: `1px solid ${theme.border}`,
              borderRadius: 4,
              color: theme.textSecondary,
              fontSize: fs.small,
              padding: "2px 8px",
              cursor: "pointer",
              fontFamily: theme.fontSans,
            }}
          >
            {expanded
              ? "Collapse"
              : `${snapshots.length - maxVisibleRows} more...`}
          </button>
        )}
      </div>

      {/* Scrollable rows container */}
      <div
        ref={scrollContainerRef}
        role="listbox"
        aria-label="Execution timeline"
        style={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          gap: 4,
          ...(showAll
            ? {}
            : {
                maxHeight: maxVisibleRows * (rowHeight + 4),
                overflowY: "auto",
                scrollbarWidth: "thin",
              }),
        }}
      >
        {snapshots.map((snap, idx) => {
          const { leftPct, widthPct } = barGeometry(snap, idx);
          const isSelected = idx === selectedIndex;
          const isVisible = idx <= selectedIndex;

          return (
            <div
              key={`${snap.stageName}-${idx}`}
              ref={isSelected ? activeRowRef : undefined}
              role="option"
              aria-selected={isSelected}
              aria-label={rowLabel(snap, idx)}
              onClick={() => onSelect?.(idx)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: size === "compact" ? 4 : 8,
                cursor: onSelect ? "pointer" : "default",
                opacity: isVisible ? 1 : 0.3,
                transition: "opacity 0.3s ease",
                height: rowHeight,
                flexShrink: 0,
              }}
            >
              <span
                title={snap.stageLabel}
                style={{
                  width: labelWidth,
                  fontSize: fs.small,
                  color: isSelected ? theme.primary : theme.textMuted,
                  fontWeight: isSelected ? 600 : 400,
                  textAlign: "right",
                  flexShrink: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {snap.stageLabel}
              </span>
              <div
                style={{
                  flex: 1,
                  height: size === "compact" ? 6 : 8,
                  position: "relative",
                  background: theme.bgTertiary,
                  borderRadius: 3,
                }}
              >
                {isVisible && (
                  <div
                    style={{
                      position: "absolute",
                      left: `${leftPct}%`,
                      top: 0,
                      width: `${widthPct}%`,
                      height: "100%",
                      borderRadius: 3,
                      background: isSelected ? theme.primary : theme.success,
                      transition: "width 0.3s ease",
                    }}
                  />
                )}
              </div>
              <span
                style={{
                  fontSize: fs.small,
                  color: theme.textMuted,
                  fontFamily: theme.fontMono,
                  width: msWidth,
                  flexShrink: 0,
                }}
              >
                {rowDuration(snap)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Time axis — or, when nothing timed the run, the note that replaces
          it. Printing "0ms … 1.0ms" under sequence bars would be a made-up
          axis; the note says what the bars actually mean instead. */}
      {untimed ? (
        <div
          data-fp="gantt-no-timing"
          title={NO_TIMING_HINT}
          style={{
            marginTop: 6,
            fontSize: fs.small,
            color: theme.textMuted,
            fontStyle: "italic",
            lineHeight: 1.4,
          }}
        >
          {NO_TIMING_NOTE}
        </div>
      ) : (
        <div
          style={{
            marginTop: 4,
            marginLeft: labelWidth + (size === "compact" ? 4 : 8),
            marginRight: msWidth + (size === "compact" ? 4 : 8),
            display: "flex",
            justifyContent: "space-between",
            fontSize: fs.small - 1,
            color: theme.textMuted,
            fontFamily: theme.fontMono,
          }}
        >
          <span>0ms</span>
          {size !== "compact" && (
            <span>{(totalWallTime / 2).toFixed(1)}ms</span>
          )}
          <span>{totalWallTime.toFixed(1)}ms</span>
        </div>
      )}
    </div>
  );
}
