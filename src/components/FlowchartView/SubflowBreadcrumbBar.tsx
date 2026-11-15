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
import { theme, componentStyles, FootprintButton } from "../../theme";

export interface SubflowBreadcrumbBarProps {
  entries: BreadcrumbEntry[];
  onNavigate: (subflowId: string | null) => void;
  unstyled?: boolean;
}

export function SubflowBreadcrumbBar({ entries, onNavigate, unstyled = false }: SubflowBreadcrumbBarProps) {
  const ui = componentStyles();
  return (
    <div
      data-fp="subflow-breadcrumb"
      style={unstyled ? undefined : {
        display: "flex",
        alignItems: "center",
        gap: ui.controlGap,
        padding: `calc(${ui.spaceSm} - 2px) ${ui.spaceMd}`,
        fontSize: ui.label,
        background: theme.bgSecondary,
        borderBottom: `${ui.borderWidth} solid ${theme.border}`,
        flexShrink: 0,
      }}
      aria-label="Subflow breadcrumb"
    >
      {entries.map((entry, i) => {
        const isLast = i === entries.length - 1;
        return (
          <span
            key={entry.subflowId ?? "__top__"}
            style={unstyled ? undefined : { display: "inline-flex", alignItems: "center", gap: ui.controlGap }}
          >
            <FootprintButton
              part="subflow-breadcrumb-button"
              unstyled={unstyled}
              type="button"
              onClick={() => onNavigate(entry.subflowId)}
              disabled={isLast}
              defaultStyle={{
                background: "transparent",
                border: "none",
                padding: 0,
                fontSize: ui.label,
                fontWeight: isLast ? `calc(${ui.weightStrong} - 100)` : ui.weightMedium,
                color: isLast ? theme.textPrimary : theme.primary,
                cursor: isLast ? "default" : "pointer",
                textDecoration: isLast ? "none" : "underline",
                fontFamily: "inherit",
              }}
            >
              {entry.label}
            </FootprintButton>
            {!isLast && <span style={unstyled ? undefined : { color: theme.textMuted }}>›</span>}
          </span>
        );
      })}
    </div>
  );
}
