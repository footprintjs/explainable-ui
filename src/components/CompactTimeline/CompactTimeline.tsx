/**
 * CompactTimeline — Collapsed = dot line, expanded = Gantt chart.
 *
 * Collapsed: single row of colored dots showing execution progress.
 * Expanded: delegates to GanttTimeline for full duration bars.
 */
import { memo, useState } from "react";
import { theme } from "../../theme";
import type { StageSnapshot } from "../../types";
import { GanttTimeline } from "../GanttTimeline";

export interface CompactTimelineProps {
  snapshots: StageSnapshot[];
  selectedIndex: number;
  /** Start expanded or collapsed. Default: collapsed. */
  defaultExpanded?: boolean;
  /** Header text. Default: "Timeline". `<ExplainableShell>` passes
   *  `panelLabels.timeline` here so the desktop footer is labelled by the
   *  same prop as the mobile pill. */
  label?: string;
}

/**
 * A token is a `var(--fp-…, #fallback)` STRING, so the old
 * `theme.textMuted + "40"` produced `var(--fp-text-muted, #64748b)40` — not a
 * colour any browser parses, which is why the pending dots and the connecting
 * line were invisible in the shipped shell footer. `color-mix` is how the rest
 * of this library tints a token (see StageDetailPanel's `wash`).
 */
const tint = (color: string, percent: number): string =>
  `color-mix(in srgb, ${color} ${percent}%, transparent)`;

export const CompactTimeline = memo(function CompactTimeline({
  snapshots,
  selectedIndex,
  defaultExpanded = false,
  label = "Timeline",
}: CompactTimelineProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (snapshots.length === 0) return null;

  return (
    <div style={{ borderTop: `1px solid ${theme.border}` }}>
      {/* Toggle header */}
      <button
        onClick={() => setExpanded((e) => !e)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 12px",
          border: "none",
          background: "transparent",
          cursor: "pointer",
          fontSize: 11,
          color: theme.textMuted,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        <span style={{ fontSize: 10 }}>{expanded ? "▼" : "▸"}</span>
        {label}
        <span style={{ fontWeight: 400, fontSize: 10 }}>
          {snapshots.length} stages
        </span>

        {/* Compact dot line (visible when collapsed) */}
        {!expanded && (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 2,
              marginLeft: 8,
            }}
          >
            {snapshots.map((snap, i) => (
              <div
                key={i}
                style={{
                  width: i === selectedIndex ? 8 : 5,
                  height: i === selectedIndex ? 8 : 5,
                  borderRadius: "50%",
                  background:
                    i < selectedIndex
                      ? "var(--fp-success, #22c55e)"
                      : i === selectedIndex
                        ? "var(--fp-accent, #6366f1)"
                        : tint(theme.textMuted, 25),
                  transition: "all 0.15s",
                  flexShrink: 0,
                }}
                title={snap.stageName}
              />
            ))}
            {/* Connecting line */}
            <div
              style={{
                flex: 1,
                height: 1,
                background: tint(theme.textMuted, 20),
                marginLeft: -2,
                marginRight: 4,
              }}
            />
          </div>
        )}
      </button>

      {/* Expanded: full Gantt */}
      {expanded && (
        <div style={{ padding: "0 12px 8px" }}>
          <GanttTimeline
            snapshots={snapshots}
            selectedIndex={selectedIndex}
          />
        </div>
      )}
    </div>
  );
});
