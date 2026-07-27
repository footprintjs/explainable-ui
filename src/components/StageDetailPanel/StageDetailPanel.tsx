import { useState, useMemo, useCallback } from "react";
import type { StageSnapshot, BaseComponentProps } from "../../types";
import { theme, fontSize, padding } from "../../theme";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StageDetailMode = "simple" | "dev";

export interface MemoryChange {
  key: string;
  type: "added" | "updated" | "removed";
  oldValue?: unknown;
  newValue?: unknown;
}

/** Keys that are footprint engine internals — hidden by default in dev mode. */
export const DEFAULT_EXCLUDED_KEYS = new Set<string>([]);

export interface StageDetailPanelProps extends BaseComponentProps {
  /** Stage snapshots for time-travel */
  snapshots: StageSnapshot[];
  /** Current snapshot index */
  selectedIndex: number;
  /** Display mode: "simple" (description + narrative) or "dev" (memory story) */
  mode?: StageDetailMode;
  /** Show a toggle to switch between simple/dev modes (default: false) */
  showToggle?: boolean;
  /** Called when user toggles mode via built-in toggle */
  onModeChange?: (mode: StageDetailMode) => void;
  /** Keys to exclude from memory display (default: engine internals). Pass empty set to show all. */
  excludeKeys?: Set<string>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeChanges(
  prev: Record<string, unknown> | null,
  curr: Record<string, unknown>,
): MemoryChange[] {
  const changes: MemoryChange[] = [];
  const allKeys = new Set([...Object.keys(prev ?? {}), ...Object.keys(curr)]);

  for (const key of allKeys) {
    const inPrev = prev != null && key in prev;
    const inCurr = key in curr;
    const oldVal = prev?.[key];
    const newVal = curr[key];

    if (!inPrev && inCurr) {
      changes.push({ key, type: "added", newValue: newVal });
    } else if (inPrev && !inCurr) {
      changes.push({ key, type: "removed", oldValue: oldVal });
    } else if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes.push({ key, type: "updated", oldValue: oldVal, newValue: newVal });
    }
  }

  const order = { added: 0, updated: 1, removed: 2 };
  changes.sort((a, b) => order[a.type] - order[b.type]);
  return changes;
}

function fmt(v: unknown): string {
  if (typeof v === "string") return `"${v}"`;
  if (typeof v === "object" && v !== null) return JSON.stringify(v, null, 2);
  return String(v);
}

/**
 * ADD / UPD / DEL badges, painted from the theme's semantic roles.
 *
 * These three were the last hard-coded colours in a panel a light theme
 * otherwise re-themes completely — and being literals, they were invisible
 * to the token-coverage test (which only sees `var(--fp-*)` reads). The
 * washes are mixed FROM the same role, so one `success` override moves the
 * text and its background together.
 */
const wash = (color: string): string => `color-mix(in srgb, ${color} 12%, transparent)`;

const changeBadge: Record<MemoryChange["type"], { bg: string; fg: string; label: string }> = {
  added:   { bg: wash(theme.success), fg: theme.success, label: "ADD" },
  updated: { bg: wash(theme.warning), fg: theme.warning, label: "UPD" },
  removed: { bg: wash(theme.error),   fg: theme.error,   label: "DEL" },
};

// ---------------------------------------------------------------------------
// Simple Mode — description + narrative
// ---------------------------------------------------------------------------

function SimpleView({
  snapshot,
  fs,
  pad,
}: {
  snapshot: StageSnapshot;
  fs: { label: number; body: number; small: number };
  pad: number;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Stage header */}
      <div>
        <div
          style={{
            fontSize: fs.label + 2,
            fontWeight: 700,
            color: theme.textPrimary,
          }}
        >
          {snapshot.stageLabel}
        </div>
        {snapshot.description && (
          <div
            style={{
              fontSize: fs.body,
              color: theme.textSecondary,
              marginTop: 4,
              lineHeight: 1.5,
            }}
          >
            {snapshot.description}
          </div>
        )}
      </div>

      {/* Status badge */}
      {snapshot.status && (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background:
                snapshot.status === "done"
                  ? theme.success
                  : snapshot.status === "active"
                    ? theme.primary
                    : snapshot.status === "error"
                      ? theme.error
                      : theme.textMuted,
            }}
          />
          <span
            style={{
              fontSize: fs.small,
              color: theme.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {snapshot.status}
          </span>
        </div>
      )}

      {/* Narrative — what happened */}
      {snapshot.narrative && (
        <div>
          <div
            style={{
              fontSize: fs.label,
              fontWeight: 600,
              color: theme.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 6,
            }}
          >
            What happened
          </div>
          <div
            style={{
              fontSize: fs.body,
              lineHeight: 1.6,
              color: theme.textPrimary,
              background: theme.bgSecondary,
              border: `1px solid ${theme.border}`,
              borderRadius: theme.radius,
              padding: pad,
            }}
          >
            {snapshot.narrative}
          </div>
        </div>
      )}

      {/* Duration */}
      {snapshot.durationMs > 0 && (
        <div
          style={{
            fontSize: fs.small,
            color: theme.textMuted,
          }}
        >
          Completed in {snapshot.durationMs < 1 ? "<1" : snapshot.durationMs}ms
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dev Mode — memory story (browser DevTools style)
// ---------------------------------------------------------------------------

/** A row in the full memory ledger: either a changed key or an unchanged one. */
type MemoryRow =
  | { kind: "change"; change: MemoryChange }
  | { kind: "unchanged"; key: string; value: unknown };

function buildMemoryRows(
  currMemory: Record<string, unknown>,
  changes: MemoryChange[],
): MemoryRow[] {
  const changeMap = new Map(changes.map((c) => [c.key, c]));
  const rows: MemoryRow[] = [];

  // Changed keys first (ADD → UPD → DEL)
  for (const change of changes) {
    rows.push({ kind: "change", change });
  }

  // Then unchanged keys (sorted alphabetically)
  const unchangedKeys = Object.keys(currMemory)
    .filter((k) => !changeMap.has(k))
    .sort();
  for (const key of unchangedKeys) {
    rows.push({ kind: "unchanged", key, value: currMemory[key] });
  }

  return rows;
}

function DevView({
  snapshot,
  changes,
  currMemory,
  fs,
  pad,
}: {
  snapshot: StageSnapshot;
  changes: MemoryChange[];
  currMemory: Record<string, unknown>;
  fs: { label: number; body: number; small: number };
  pad: number;
}) {
  const rows = useMemo(() => buildMemoryRows(currMemory, changes), [currMemory, changes]);
  const totalKeys = Object.keys(currMemory).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Stage header with label */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            fontSize: fs.label + 2,
            fontWeight: 700,
            color: theme.textPrimary,
            fontFamily: theme.fontMono,
          }}
        >
          {snapshot.stageLabel}
        </span>
        {snapshot.durationMs > 0 && (
          <span
            style={{
              fontSize: fs.small,
              color: theme.textMuted,
              fontFamily: theme.fontMono,
            }}
          >
            {snapshot.durationMs}ms
          </span>
        )}
      </div>

      {/* Memory state section header */}
      <div
        style={{
          fontSize: fs.label,
          fontWeight: 600,
          color: theme.textMuted,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        Memory
        <span style={{ fontWeight: 400, marginLeft: 6 }}>
          ({totalKeys} key{totalKeys !== 1 ? "s" : ""}
          {changes.length > 0 && `, ${changes.length} changed`})
        </span>
      </div>

      {/* Full memory ledger */}
      {rows.length === 0 ? (
        <div
          style={{
            fontSize: fs.body,
            color: theme.textMuted,
            fontStyle: "italic",
            fontFamily: theme.fontMono,
            padding: `${pad}px`,
            background: theme.bgSecondary,
            borderRadius: theme.radius,
          }}
        >
          Empty memory
        </div>
      ) : (
        <div
          style={{
            fontFamily: theme.fontMono,
            fontSize: fs.body,
            background: theme.bgSecondary,
            border: `1px solid ${theme.border}`,
            borderRadius: theme.radius,
            overflow: "hidden",
          }}
        >
          {rows.map((row) => {
            if (row.kind === "change") {
              const { change } = row;
              const badge = changeBadge[change.type];
              return (
                <div
                  key={change.key}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                    padding: `6px ${pad}px`,
                    borderBottom: `1px solid ${theme.border}`,
                    background: badge.bg,
                  }}
                  data-fp="memory-change"
                  data-type={change.type}
                >
                  <span
                    style={{
                      fontSize: fs.small,
                      fontWeight: 700,
                      color: badge.fg,
                      width: 28,
                      flexShrink: 0,
                      textAlign: "center",
                      lineHeight: 1.8,
                    }}
                  >
                    {badge.label}
                  </span>
                  <span
                    style={{
                      color: theme.primary,
                      fontWeight: 600,
                      flexShrink: 0,
                      lineHeight: 1.8,
                    }}
                  >
                    {change.key}
                  </span>
                  <div style={{ flex: 1, minWidth: 0, lineHeight: 1.8 }}>
                    {change.type === "updated" ? (
                      <>
                        <span
                          style={{
                            color: theme.error,
                            textDecoration: "line-through",
                            opacity: 0.7,
                          }}
                        >
                          {fmt(change.oldValue)}
                        </span>
                        <span style={{ color: theme.textMuted, margin: "0 4px" }}>&rarr;</span>
                        <span style={{ color: theme.success }}>{fmt(change.newValue)}</span>
                      </>
                    ) : change.type === "added" ? (
                      <span style={{ color: theme.success }}>{fmt(change.newValue)}</span>
                    ) : (
                      <span style={{ color: theme.error, textDecoration: "line-through" }}>
                        {fmt(change.oldValue)}
                      </span>
                    )}
                  </div>
                </div>
              );
            }

            // Unchanged key — dimmed, no badge
            return (
              <div
                key={row.key}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  padding: `6px ${pad}px`,
                  borderBottom: `1px solid ${theme.border}`,
                  opacity: 0.5,
                }}
                data-fp="memory-unchanged"
              >
                <span
                  style={{
                    width: 28,
                    flexShrink: 0,
                    lineHeight: 1.8,
                  }}
                />
                <span
                  style={{
                    color: theme.textSecondary,
                    fontWeight: 500,
                    flexShrink: 0,
                    lineHeight: 1.8,
                  }}
                >
                  {row.key}
                </span>
                <div style={{ flex: 1, minWidth: 0, lineHeight: 1.8, color: theme.textMuted }}>
                  {fmt(row.value)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Unstyled Mode
// ---------------------------------------------------------------------------

function UnstyledSimpleView({ snapshot }: { snapshot: StageSnapshot }) {
  return (
    <div data-fp="stage-detail-simple">
      <div data-fp="stage-label">{snapshot.stageLabel}</div>
      {snapshot.description && (
        <div data-fp="stage-description">{snapshot.description}</div>
      )}
      {snapshot.status && <div data-fp="stage-status">{snapshot.status}</div>}
      {snapshot.narrative && (
        <div data-fp="stage-narrative">{snapshot.narrative}</div>
      )}
    </div>
  );
}

function UnstyledDevView({
  snapshot,
  changes,
  currMemory,
}: {
  snapshot: StageSnapshot;
  changes: MemoryChange[];
  currMemory: Record<string, unknown>;
}) {
  const rows = useMemo(() => buildMemoryRows(currMemory, changes), [currMemory, changes]);
  return (
    <div data-fp="stage-detail-dev">
      <div data-fp="stage-label">{snapshot.stageLabel}</div>
      {rows.map((row) => {
        if (row.kind === "change") {
          const c = row.change;
          return (
            <div key={c.key} data-fp="memory-change" data-type={c.type}>
              <span data-fp="change-key">{c.key}</span>
              {c.type === "updated" && (
                <>
                  <span data-fp="change-old">{fmt(c.oldValue)}</span>
                  <span data-fp="change-new">{fmt(c.newValue)}</span>
                </>
              )}
              {c.type === "added" && (
                <span data-fp="change-value">{fmt(c.newValue)}</span>
              )}
              {c.type === "removed" && (
                <span data-fp="change-value">{fmt(c.oldValue)}</span>
              )}
            </div>
          );
        }
        return (
          <div key={row.key} data-fp="memory-unchanged">
            <span data-fp="unchanged-key">{row.key}</span>
            <span data-fp="unchanged-value">{fmt(row.value)}</span>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Mode Toggle
// ---------------------------------------------------------------------------

function ModeToggle({
  activeMode,
  onToggle,
  fs,
  unstyled,
}: {
  activeMode: StageDetailMode;
  onToggle: () => void;
  fs: { label: number; body: number; small: number };
  unstyled: boolean;
}) {
  if (unstyled) {
    return (
      <button data-fp="mode-toggle" data-mode={activeMode} onClick={onToggle}>
        {activeMode === "simple" ? "Dev" : "Simple"}
      </button>
    );
  }

  return (
    <div
      style={{
        display: "inline-flex",
        borderRadius: 6,
        border: `1px solid ${theme.border}`,
        overflow: "hidden",
        flexShrink: 0,
      }}
      data-fp="mode-toggle"
    >
      {(["simple", "dev"] as const).map((m) => (
        <button
          key={m}
          onClick={m !== activeMode ? onToggle : undefined}
          style={{
            padding: "4px 10px",
            fontSize: fs.small,
            fontWeight: m === activeMode ? 700 : 400,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: m === activeMode ? theme.textPrimary : theme.textMuted,
            background: m === activeMode ? theme.bgTertiary : "transparent",
            border: "none",
            cursor: m === activeMode ? "default" : "pointer",
          }}
        >
          {m === "simple" ? "Simple" : "Dev"}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function StageDetailPanel({
  snapshots,
  selectedIndex,
  mode: controlledMode,
  showToggle = false,
  onModeChange,
  size = "default",
  unstyled = false,
  className,
  style,
}: StageDetailPanelProps) {
  const [internalMode, setInternalMode] = useState<StageDetailMode>(controlledMode ?? "simple");

  // Support both controlled (mode prop) and uncontrolled (internal state) usage
  const activeMode = controlledMode ?? internalMode;

  const handleToggle = useCallback(() => {
    const next: StageDetailMode = activeMode === "simple" ? "dev" : "simple";
    setInternalMode(next);
    onModeChange?.(next);
  }, [activeMode, onModeChange]);

  const snapshot = snapshots[selectedIndex];
  const prevMemory = selectedIndex > 0 ? snapshots[selectedIndex - 1]?.memory ?? null : null;
  const currMemory = snapshot?.memory ?? {};

  const changes = useMemo(
    () => computeChanges(prevMemory, currMemory),
    [prevMemory, currMemory],
  );

  const fs = fontSize[size];
  const pad = padding[size];

  if (!snapshot) {
    return (
      <div className={className} style={style} data-fp="stage-detail-panel">
        <div style={unstyled ? {} : { color: theme.textMuted, fontSize: fs.body, fontStyle: "italic", padding: pad }}>
          No stage selected
        </div>
      </div>
    );
  }

  if (unstyled) {
    return (
      <div className={className} style={style} data-fp="stage-detail-panel" data-mode={activeMode}>
        {showToggle && (
          <ModeToggle activeMode={activeMode} onToggle={handleToggle} fs={fs} unstyled />
        )}
        {activeMode === "simple" ? (
          <UnstyledSimpleView snapshot={snapshot} />
        ) : (
          <UnstyledDevView snapshot={snapshot} changes={changes} currMemory={currMemory} />
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
        overflow: "auto",
        ...style,
      }}
      data-fp="stage-detail-panel"
      data-mode={activeMode}
    >
      {showToggle && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          <ModeToggle activeMode={activeMode} onToggle={handleToggle} fs={fs} unstyled={false} />
        </div>
      )}
      {activeMode === "simple" ? (
        <SimpleView snapshot={snapshot} fs={fs} pad={pad} />
      ) : (
        <DevView snapshot={snapshot} changes={changes} currMemory={currMemory} fs={fs} pad={pad} />
      )}
    </div>
  );
}
