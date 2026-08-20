import { memo } from "react";
import { warnDeprecated } from "../../_internal/deprecate";
import { theme } from "../../theme";
import type { BreadcrumbEntry } from "./useSubflowNavigation";

/**
 * @deprecated Since 0.38.0 — removed in the next major. Its `breadcrumbs`
 * come from `useSubflowNavigation`, which is deprecated for keying the
 * drill by a non-unique id. Use `<TracedFlow>`'s own breadcrumb bar, or
 * `buildSubflowBreadcrumb(graph, mountNodeId)` to render your own trail.
 */
export interface SubflowBreadcrumbProps {
  breadcrumbs: BreadcrumbEntry[];
  onNavigate: (level: number) => void;
}

/**
 * Breadcrumb bar for subflow drill-down navigation.
 * Shows: Root > SubflowA > SubflowB — clicking any crumb navigates back.
 *
 * @deprecated Since 0.38.0 — removed in the next major. This is the
 * display half of the legacy `useSubflowNavigation` pair; the modern
 * chart draws its own trail from `buildSubflowBreadcrumb`. Use
 * `<TracedFlow>` (breadcrumb included), or call `buildSubflowBreadcrumb`
 * yourself when you own the layout.
 */
export const SubflowBreadcrumb = memo(function SubflowBreadcrumb({
  breadcrumbs,
  onNavigate,
}: SubflowBreadcrumbProps) {
  warnDeprecated(
    "SubflowBreadcrumb",
    "It renders the legacy useSubflowNavigation stack. Use <TracedFlow> " +
      "(which draws its own trail), or buildSubflowBreadcrumb(graph, mountNodeId).",
  );
  if (breadcrumbs.length <= 1) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "6px 12px",
        background: theme.bgSecondary,
        borderBottom: `1px solid ${theme.border}`,
        fontSize: 12,
        fontFamily: theme.fontSans,
        flexShrink: 0,
        overflowX: "auto",
      }}
    >
      {breadcrumbs.map((crumb, i) => {
        const isLast = i === breadcrumbs.length - 1;
        return (
          <span key={`${crumb.label}-${i}`} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {i > 0 && (
              <span style={{ color: theme.textMuted, fontSize: 10 }}>
                ›
              </span>
            )}
            {isLast ? (
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span
                  style={{
                    color: theme.primary,
                    fontWeight: 600,
                  }}
                >
                  {crumb.label}
                </span>
                {crumb.description && (
                  <span
                    style={{
                      color: theme.textMuted,
                      fontWeight: 400,
                      fontSize: 11,
                    }}
                  >
                    — {crumb.description}
                  </span>
                )}
              </span>
            ) : (
              <button
                onClick={() => onNavigate(i)}
                style={{
                  background: "none",
                  border: "none",
                  color: theme.textSecondary,
                  cursor: "pointer",
                  padding: "2px 4px",
                  borderRadius: 4,
                  fontSize: 12,
                  fontFamily: "inherit",
                  fontWeight: 500,
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = `${theme.primary}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = `${theme.textSecondary}`;
                }}
              >
                {crumb.label}
              </button>
            )}
          </span>
        );
      })}
    </div>
  );
});
