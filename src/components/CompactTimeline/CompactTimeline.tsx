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
}

export const CompactTimeline = memo(function CompactTimeline({
  snapshots,
  selectedIndex,
  defaultExpanded = false,
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
        Timeline
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
                        : theme.textMuted + "40",
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
                background: theme.textMuted + "30",
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
