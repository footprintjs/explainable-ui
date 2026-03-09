import { useMemo } from "react";
import type { StageSnapshot, BaseComponentProps } from "../../types";
import { theme, fontSize, padding } from "../../theme";

export interface MemoryInspectorProps extends BaseComponentProps {
  /** Single memory object or snapshots (will accumulate up to selectedIndex) */
  data?: Record<string, unknown>;
  /** When using snapshots mode, pass these instead of data */
  snapshots?: StageSnapshot[];
  /** Index to accumulate up to (for time-travel) */
  selectedIndex?: number;
  /** Show data types alongside values */
  showTypes?: boolean;
  /** Highlight keys that are new at this step */
  highlightNew?: boolean;
}

/**
 * Displays pipeline memory state as formatted JSON.
 * Supports both static (data prop) and time-travel (snapshots + selectedIndex) modes.
 */
export function MemoryInspector({
  data,
  snapshots,
  selectedIndex = 0,
  showTypes = false,
  highlightNew = true,
  size = "default",
  unstyled = false,
  className,
  style,
}: MemoryInspectorProps) {
  // Compute accumulated memory from snapshots
  const { memory, newKeys } = useMemo(() => {
    if (data) {
      return { memory: data, newKeys: new Set<string>() };
    }
    if (!snapshots || snapshots.length === 0) {
      return { memory: {}, newKeys: new Set<string>() };
    }

    const merged: Record<string, unknown> = {};
    for (let i = 0; i <= Math.min(selectedIndex, snapshots.length - 1); i++) {
      Object.assign(merged, snapshots[i]?.memory);
    }

    const nk = new Set<string>();
    if (highlightNew && selectedIndex > 0) {
      const prev: Record<string, unknown> = {};
      for (let i = 0; i < selectedIndex; i++) {
        Object.assign(prev, snapshots[i]?.memory);
      }
      const current = snapshots[selectedIndex]?.memory ?? {};
      for (const k of Object.keys(current)) {
        if (!(k in prev)) nk.add(k);
      }
    } else if (highlightNew && selectedIndex === 0 && snapshots[0]) {
      for (const k of Object.keys(snapshots[0].memory)) nk.add(k);
    }

    return { memory: merged, newKeys: nk };
  }, [data, snapshots, selectedIndex, highlightNew]);

  const entries = Object.entries(memory);
  const fs = fontSize[size];
  const pad = padding[size];

  if (unstyled) {
    return (
      <div className={className} style={style} data-fp="memory-inspector">
        <div data-fp="memory-label">Memory State</div>
        <pre data-fp="memory-json">
          {JSON.stringify(memory, null, 2)}
        </pre>
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        padding: pad,
        fontFamily: theme.fontSans,
        ...style,
      }}
      data-fp="memory-inspector"
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
        Memory State
      </span>
      <div
        style={{
          marginTop: 8,
          background: theme.bgSecondary,
          border: `1px solid ${theme.border}`,
          borderRadius: theme.radius,
          padding: `${pad}px ${pad + 4}px`,
          fontFamily: theme.fontMono,
          fontSize: fs.body,
          lineHeight: 1.8,
        }}
      >
        <span style={{ color: theme.textMuted }}>{"{"}</span>
        {entries.length === 0 && (
          <div
            style={{
              paddingLeft: 16,
              color: theme.textMuted,
              fontStyle: "italic",
            }}
          >
            {"// empty"}
          </div>
        )}
        {entries.map(([key, value], i) => {
          const isNew = newKeys.has(key);
          const isLast = i === entries.length - 1;
          return (
            <div
              key={key}
              style={{
                paddingLeft: 16,
                background: isNew
                  ? `color-mix(in srgb, ${theme.success} 10%, transparent)`
                  : "transparent",
                borderRadius: 4,
                marginLeft: -4,
                marginRight: -4,
                paddingRight: 4,
              }}
            >
              <span style={{ color: theme.primary }}>&quot;{key}&quot;</span>
              <span style={{ color: theme.textMuted }}>: </span>
              <span style={{ color: theme.success }}>
                {formatValue(value)}
              </span>
              {showTypes && (
                <span
                  style={{
                    color: theme.textMuted,
                    fontSize: fs.small,
                    marginLeft: 8,
                    opacity: 0.6,
                  }}
                >
                  ({typeof value})
                </span>
              )}
              {!isLast && <span style={{ color: theme.textMuted }}>,</span>}
            </div>
          );
        })}
        <span style={{ color: theme.textMuted }}>{"}"}</span>
      </div>
    </div>
  );
}

function formatValue(value: unknown): string {
  if (typeof value === "string") return `"${value}"`;
  if (typeof value === "object" && value !== null) return JSON.stringify(value);
  return String(value);
}
