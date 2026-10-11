import { useMemo } from "react";
import type { StageSnapshot, BaseComponentProps } from "../../types";
import { theme, fontSize, padding } from "../../theme";
import {
  recordStateDisplay,
  RecordStateNotice,
} from "../_internal/recordStateDisplay";
import { displayValue } from "../_internal/displayValue";

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
  const { view, newKeys } = useMemo(() => {
    if (data) {
      return {
        view: { memory: data, previous: null, canCompare: true, notices: [] },
        newKeys: new Set<string>(),
      };
    }
    if (!snapshots || snapshots.length === 0) {
      return { view: recordStateDisplay(), newKeys: new Set<string>() };
    }

    const safeIdx = Math.max(0, Math.min(selectedIndex, snapshots.length - 1));
    const view = recordStateDisplay(snapshots[safeIdx], snapshots[safeIdx - 1]);

    const nk = new Set<string>();
    if (highlightNew && view.canCompare && view.memory) {
      const prev = view.previous ?? {};
      for (const k of Object.keys(view.memory)) {
        if (!(k in prev)) nk.add(k);
      }
    }

    return { view, newKeys: nk };
  }, [data, snapshots, selectedIndex, highlightNew]);

  const memory = view.memory;
  const entries = Object.entries(memory ?? {});
  const fs = fontSize[size];
  const pad = padding[size];

  if (unstyled) {
    return (
      <div
        className={className}
        style={style}
        data-fp="memory-inspector"
        role="region"
        aria-label="Memory state"
      >
        <div data-fp="memory-label">Memory State</div>
        <RecordStateNotice view={view} />
        {memory !== null && (
          <pre data-fp="memory-json">
            <code>{displayValue(memory, 2)}</code>
          </pre>
        )}
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
      <RecordStateNotice view={view} />
      {memory !== null && (
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
              {view.canCompare
                ? "// empty"
                : "// no values in the available recorded state"}
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
                  {displayValue(value)}
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
      )}
    </div>
  );
}
