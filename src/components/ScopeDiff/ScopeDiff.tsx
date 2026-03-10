import { useMemo } from "react";
import type { BaseComponentProps } from "../../types";
import { theme, fontSize, padding } from "../../theme";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DiffEntry {
  key: string;
  type: "added" | "removed" | "changed" | "unchanged";
  oldValue?: unknown;
  newValue?: unknown;
}

export interface ScopeDiffProps extends BaseComponentProps {
  /** Memory state before the current stage */
  previous: Record<string, unknown> | null;
  /** Memory state after the current stage */
  current: Record<string, unknown>;
  /** Hide unchanged keys (default: false) */
  hideUnchanged?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeDiff(
  prev: Record<string, unknown> | null,
  curr: Record<string, unknown>
): DiffEntry[] {
  const entries: DiffEntry[] = [];
  const allKeys = new Set([...Object.keys(prev ?? {}), ...Object.keys(curr)]);

  for (const key of allKeys) {
    const inPrev = prev != null && key in prev;
    const inCurr = key in curr;
    const oldVal = prev?.[key];
    const newVal = curr[key];

    if (!inPrev && inCurr) {
      entries.push({ key, type: "added", newValue: newVal });
    } else if (inPrev && !inCurr) {
      entries.push({ key, type: "removed", oldValue: oldVal });
    } else if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      entries.push({ key, type: "changed", oldValue: oldVal, newValue: newVal });
    } else {
      entries.push({ key, type: "unchanged", newValue: newVal });
    }
  }

  const order = { added: 0, changed: 1, removed: 2, unchanged: 3 };
  entries.sort((a, b) => order[a.type] - order[b.type]);
  return entries;
}

function fmt(v: unknown): string {
  if (typeof v === "string") return `"${v}"`;
  if (typeof v === "object" && v !== null) return JSON.stringify(v, null, 2);
  return String(v);
}

const diffColors: Record<DiffEntry["type"], { bg: string; fg: string; icon: string }> = {
  added: { bg: "rgba(34,197,94,0.10)", fg: "#22c55e", icon: "+" },
  removed: { bg: "rgba(239,68,68,0.10)", fg: "#ef4444", icon: "-" },
  changed: { bg: "rgba(245,158,11,0.10)", fg: "#f59e0b", icon: "~" },
  unchanged: { bg: "transparent", fg: "", icon: " " },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ScopeDiff({
  previous,
  current,
  hideUnchanged = false,
  size = "default",
  unstyled = false,
  className,
  style,
}: ScopeDiffProps) {
  const entries = useMemo(() => computeDiff(previous, current), [previous, current]);
  const visible = hideUnchanged ? entries.filter((e) => e.type !== "unchanged") : entries;

  const fs = fontSize[size];
  const pad = padding[size];

  if (unstyled) {
    return (
      <div className={className} style={style} data-fp="scope-diff">
        {visible.map((e) => (
          <div key={e.key} data-fp="diff-entry" data-type={e.type}>
            <span data-fp="diff-key">{e.key}</span>
            {e.type === "changed" && (
              <>
                <span data-fp="diff-old">{fmt(e.oldValue)}</span>
                <span data-fp="diff-new">{fmt(e.newValue)}</span>
              </>
            )}
            {(e.type === "added" || e.type === "unchanged") && (
              <span data-fp="diff-value">{fmt(e.newValue)}</span>
            )}
            {e.type === "removed" && (
              <span data-fp="diff-value">{fmt(e.oldValue)}</span>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{ padding: pad, fontFamily: theme.fontMono, ...style }}
      data-fp="scope-diff"
    >
      {visible.length === 0 && (
        <div style={{ fontSize: fs.body, color: theme.textMuted, fontStyle: "italic" }}>
          No changes
        </div>
      )}
      {visible.map((entry) => {
        const dc = diffColors[entry.type];
        return (
          <div
            key={entry.key}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              padding: `4px ${pad - 4}px`,
              marginBottom: 2,
              borderRadius: 4,
              background: dc.bg,
              fontSize: fs.body,
              lineHeight: 1.5,
            }}
            data-fp="diff-entry"
          >
            <span
              style={{
                width: 16,
                flexShrink: 0,
                fontWeight: 700,
                color: dc.fg || theme.textMuted,
                textAlign: "center",
              }}
            >
              {dc.icon}
            </span>
            <span style={{ color: theme.primary, fontWeight: 600, flexShrink: 0 }}>
              {entry.key}
            </span>
            <span style={{ color: theme.textMuted }}>=</span>
            {entry.type === "changed" ? (
              <span>
                <span
                  style={{
                    color: theme.error,
                    textDecoration: "line-through",
                    opacity: 0.7,
                  }}
                >
                  {fmt(entry.oldValue)}
                </span>
                <span style={{ color: theme.textMuted, margin: "0 4px" }}>&rarr;</span>
                <span style={{ color: theme.success }}>{fmt(entry.newValue)}</span>
              </span>
            ) : (
              <span
                style={{
                  color:
                    entry.type === "added"
                      ? theme.success
                      : entry.type === "removed"
                        ? theme.error
                        : theme.textPrimary,
                }}
              >
                {fmt(entry.type === "removed" ? entry.oldValue : entry.newValue)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
