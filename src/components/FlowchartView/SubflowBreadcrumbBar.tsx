/**
 * SubflowBreadcrumbBar — clickable trail of subflow drill levels.
 *
 *   Chart › Outer Subflow › Inner Subflow
 *
 * The last entry renders disabled (you're already here). Earlier
 * entries are clickable — fire `onNavigate(subflowId)` (null = root).
 *
 * Pure presentation: takes the precomputed `entries` array (built by
 * `buildSubflowBreadcrumb` in `_internal/subflowDrill.ts`). No drill
 * state lives here.
 */

import type { BreadcrumbEntry } from "./_internal/subflowDrill";
import { theme } from "../../theme";

export interface SubflowBreadcrumbBarProps {
  entries: BreadcrumbEntry[];
  onNavigate: (subflowId: string | null) => void;
}

export function SubflowBreadcrumbBar({ entries, onNavigate }: SubflowBreadcrumbBarProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 12px",
        fontSize: 11,
        background: theme.bgSecondary,
        borderBottom: `1px solid ${theme.border}`,
        flexShrink: 0,
      }}
      aria-label="Subflow breadcrumb"
    >
      {entries.map((entry, i) => {
        const isLast = i === entries.length - 1;
        return (
          <span
            key={entry.subflowId ?? "__top__"}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <button
              type="button"
              onClick={() => onNavigate(entry.subflowId)}
              disabled={isLast}
              style={{
                background: "transparent",
                border: "none",
                padding: 0,
                fontSize: 11,
                fontWeight: isLast ? 600 : 500,
                color: isLast ? theme.textPrimary : theme.primary,
                cursor: isLast ? "default" : "pointer",
                textDecoration: isLast ? "none" : "underline",
                fontFamily: "inherit",
              }}
            >
              {entry.label}
            </button>
            {!isLast && <span style={{ color: theme.textMuted }}>›</span>}
          </span>
        );
      })}
    </div>
  );
}
