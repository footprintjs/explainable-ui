import { useMemo } from "react";
import type { StageSnapshot, BaseComponentProps } from "../../types";
import { theme, fontSize, padding } from "../../theme";

export interface NarrativeLogProps extends BaseComponentProps {
  /** Snapshots to display narratives from */
  snapshots: StageSnapshot[];
  /** Show narratives up to this index (for time-travel sync) */
  selectedIndex?: number;
  /** Show a single narrative string (simple mode) */
  narrative?: string;
}

/**
 * Timeline-style execution log showing what happened at each stage.
 * Supports both full snapshots mode and single-narrative mode.
 */
export function NarrativeLog({
  snapshots,
  selectedIndex,
  narrative,
  size = "default",
  unstyled = false,
  className,
  style,
}: NarrativeLogProps) {
  const entries = useMemo(() => {
    if (narrative) {
      return [{ label: "Output", text: narrative, isCurrent: true }];
    }
    const idx = selectedIndex ?? snapshots.length - 1;
    return snapshots.slice(0, idx + 1).map((s, i) => ({
      label: s.stageLabel,
      text: s.narrative,
      isCurrent: i === idx,
    }));
  }, [snapshots, selectedIndex, narrative]);

  const fs = fontSize[size];
  const pad = padding[size];

  if (unstyled) {
    return (
      <div className={className} style={style} data-fp="narrative-log">
        {entries.map((entry, i) => (
          <div key={i} data-fp="narrative-entry" data-current={entry.isCurrent}>
            <strong>{entry.label}</strong>
            <p>{entry.text}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{ padding: pad, fontFamily: theme.fontSans, ...style }}
      data-fp="narrative-log"
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
        Execution Log
      </span>
      <div style={{ marginTop: 8, display: "flex", flexDirection: "column" }}>
        {entries.map((entry, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 10,
              padding: `${pad}px 0`,
              borderBottom:
                i < entries.length - 1 ? `1px solid ${theme.border}` : "none",
            }}
          >
            {/* Timeline dot + line */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: 12,
                flexShrink: 0,
                paddingTop: 5,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: entry.isCurrent ? theme.primary : theme.success,
                  flexShrink: 0,
                }}
              />
              {i < entries.length - 1 && (
                <div
                  style={{
                    width: 1,
                    flex: 1,
                    background: theme.border,
                    marginTop: 4,
                  }}
                />
              )}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <span
                style={{
                  fontSize: fs.label,
                  fontWeight: 600,
                  color: entry.isCurrent ? theme.primary : theme.textMuted,
                }}
              >
                {entry.label}
              </span>
              <div
                style={{
                  fontSize: fs.body,
                  lineHeight: 1.5,
                  color: entry.isCurrent ? theme.textPrimary : theme.textSecondary,
                  marginTop: 2,
                }}
              >
                {entry.text}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
