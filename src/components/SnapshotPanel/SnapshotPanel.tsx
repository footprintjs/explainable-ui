import { useState } from "react";
import type { StageSnapshot, BaseComponentProps } from "../../types";
import { theme, fontSize, padding, themeModeVars } from "../../theme";
import type { ThemeModeProps } from "../../theme";
import { MemoryInspector } from "../MemoryInspector";
import { NarrativeLog } from "../NarrativeLog";
import { GanttTimeline } from "../GanttTimeline";

export interface SnapshotPanelProps extends BaseComponentProps, ThemeModeProps {
  /** Stage snapshots from pipeline execution */
  snapshots: StageSnapshot[];
  /** Show the Gantt timeline */
  showGantt?: boolean;
  /** Show the time-travel scrubber */
  showScrubber?: boolean;
  /** Title override */
  title?: string;
}

/**
 * All-in-one panel: time-travel scrubber + memory inspector + narrative log + gantt.
 * Drop this into any page to make a pipeline run inspectable.
 */
export function SnapshotPanel({
  snapshots,
  showGantt = true,
  showScrubber = true,
  title = "Pipeline Inspector",
  size = "default",
  unstyled = false,
  className,
  style,
  theme: themeMode,
}: SnapshotPanelProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const fs = fontSize[size];
  const pad = padding[size];

  if (snapshots.length === 0) {
    return (
      <div
        className={className}
        style={{
          ...themeModeVars(themeMode),
          padding: pad * 2,
          textAlign: "center",
          color: unstyled ? undefined : theme.textMuted,
          fontSize: fs.body,
          ...style,
        }}
        data-fp="snapshot-panel"
      >
        No snapshots to display
      </div>
    );
  }

  if (unstyled) {
    return (
      <div className={className} style={style} data-fp="snapshot-panel">
        <h3>{title}</h3>
        {showScrubber && (
          <input
            type="range"
            min={0}
            max={snapshots.length - 1}
            value={selectedIndex}
            onChange={(e) => setSelectedIndex(parseInt(e.target.value))}
          />
        )}
        <MemoryInspector
          snapshots={snapshots}
          selectedIndex={selectedIndex}
          unstyled
        />
        <NarrativeLog
          snapshots={snapshots}
          selectedIndex={selectedIndex}
          unstyled
        />
        {showGantt && (
          <GanttTimeline
            snapshots={snapshots}
            selectedIndex={selectedIndex}
            onSelect={setSelectedIndex}
            unstyled
          />
        )}
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        // The one-word switch (see theme/mode.ts) — this panel is the one
        // people drop into an existing app on its own.
        ...themeModeVars(themeMode),
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: theme.bgPrimary,
        fontFamily: theme.fontSans,
        overflow: "hidden",
        ...style,
      }}
      data-fp="snapshot-panel"
    >
      {/* Header with title + scrubber */}
      <div
        style={{
          padding: `${pad}px ${pad + 4}px`,
          borderBottom: `1px solid ${theme.border}`,
          background: theme.bgSecondary,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: showScrubber ? 8 : 0,
          }}
        >
          <span
            style={{
              fontSize: fs.body + 2,
              fontWeight: 600,
              color: theme.textPrimary,
            }}
          >
            {title}
          </span>
          <span
            style={{
              fontSize: fs.small,
              color: theme.textMuted,
              fontFamily: theme.fontMono,
            }}
          >
            {selectedIndex + 1}/{snapshots.length}
          </span>
        </div>

        {showScrubber && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ScrubButton
              glyph="◀"
              label="Previous stage"
              disabled={selectedIndex === 0}
              onClick={() => setSelectedIndex((i) => Math.max(0, i - 1))}
            />
            <input
              type="range"
              min={0}
              max={snapshots.length - 1}
              value={selectedIndex}
              onChange={(e) => setSelectedIndex(parseInt(e.target.value))}
              style={{
                flex: 1,
                height: 4,
                accentColor: theme.primary,
                cursor: "pointer",
              }}
            />
            <ScrubButton
              glyph="▶"
              label="Next stage"
              disabled={selectedIndex === snapshots.length - 1}
              onClick={() =>
                setSelectedIndex((i) => Math.min(snapshots.length - 1, i + 1))
              }
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <MemoryInspector
          snapshots={snapshots}
          selectedIndex={selectedIndex}
          size={size}
        />
        <div
          style={{
            height: 1,
            background: theme.border,
            margin: `0 ${pad}px`,
          }}
        />
        <NarrativeLog
          snapshots={snapshots}
          selectedIndex={selectedIndex}
          size={size}
        />
      </div>

      {/* Gantt footer */}
      {showGantt && (
        <div
          style={{
            borderTop: `1px solid ${theme.border}`,
            background: theme.bgSecondary,
            flexShrink: 0,
          }}
        >
          <GanttTimeline
            snapshots={snapshots}
            selectedIndex={selectedIndex}
            onSelect={setSelectedIndex}
            size={size}
          />
        </div>
      )}
    </div>
  );
}

/**
 * One transport button on the scrubber rail.
 *
 * `glyph` is the ARROW (a real character, not an escape — writing "\u25C0"
 * inside a JSX string attribute is not an escape sequence, so the six
 * characters printed verbatim where an arrow should have been). `label` is
 * the accessible name, because a bare triangle names nothing to a screen
 * reader. Chrome matches `<TimeTravelControls>`'s prev/next buttons — the
 * same transport controls, so they read as the same family.
 */
function ScrubButton({
  glyph,
  label,
  disabled,
  onClick,
}: {
  glyph: string;
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      data-fp="scrub-button"
      style={{
        background: theme.bgTertiary,
        border: `1px solid ${theme.border}`,
        color: disabled ? theme.textMuted : theme.textPrimary,
        borderRadius: 6,
        width: 28,
        height: 28,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        fontSize: 12,
        fontWeight: 600,
        lineHeight: 1,
        flexShrink: 0,
      }}
    >
      <span aria-hidden="true">{glyph}</span>
    </button>
  );
}
