import { useMemo } from "react";
import type { StageSnapshot, BaseComponentProps } from "../../types";
import { theme, fontSize, padding } from "../../theme";

export interface MemoryInspectorProps extends BaseComponentProps {
  /** A memory object to show as-is. Takes precedence over `snapshots`. */
  data?: Record<string, unknown>;
  /** When using snapshots mode, pass these instead of data */
  snapshots?: StageSnapshot[];
  /** Which step's state to show (for time-travel). Each snapshot's `memory`
   *  is already the accumulated state after that stage — including its
   *  deletions — so this reads that step, it does not re-accumulate. */
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
  const { memory, newKeys } = useMemo(() => {
    if (data) {
      return { memory: data, newKeys: new Set<string>() };
    }
    if (!snapshots || snapshots.length === 0) {
      return { memory: {}, newKeys: new Set<string>() };
    }

    const safeIdx = Math.min(selectedIndex, snapshots.length - 1);

    // A snapshot's `memory` IS the accumulated state after that stage ran
    // (see `StageSnapshot.memory`) — the adapter has already replayed every
    // commit onto it, deletes included. So the state at this step is simply
    // this step's memory.
    //
    // This used to `Object.assign` every earlier snapshot's memory on top of
    // each other, which can only ever ADD keys back: a key the run DELETED
    // was resurrected from the step before it, and the ScopeDiff composed
    // right beside this panel (MemoryPanel) reported that same key "removed"
    // in the very same view. Deleted stays deleted.
    const merged = snapshots[safeIdx]?.memory ?? {};

    const nk = new Set<string>();
    if (highlightNew) {
      const prev = safeIdx > 0 ? snapshots[safeIdx - 1]?.memory ?? {} : {};
      for (const k of Object.keys(merged)) {
        if (!(k in prev)) nk.add(k);
      }
    }

    return { memory: merged, newKeys: nk };
  }, [data, snapshots, selectedIndex, highlightNew]);

  const entries = Object.entries(memory);
  const fs = fontSize[size];
  const pad = padding[size];

  if (unstyled) {
    return (
      <div className={className} style={style} data-fp="memory-inspector" role="region" aria-label="Memory state">
        <div data-fp="memory-label">Memory State</div>
        <pre data-fp="memory-json">
          <code>{JSON.stringify(memory, null, 2)}</code>
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
      role="region"
      aria-label="Memory state"
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
