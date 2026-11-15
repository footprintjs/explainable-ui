import { FootprintButton, componentStyles, useFootprintComponents } from "../../theme";
import { memo, type CSSProperties } from "react";
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
  unstyled?: boolean;
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
  unstyled = false,
}: SubflowBreadcrumbProps) {
  const ui = componentStyles();
  const sx = (value: CSSProperties): CSSProperties | undefined => unstyled ? undefined : value;
  const nativeButton = !useFootprintComponents().Button;
  warnDeprecated(
    "SubflowBreadcrumb",
    "It renders the legacy useSubflowNavigation stack. Use <TracedFlow> " +
      "(which draws its own trail), or buildSubflowBreadcrumb(graph, mountNodeId).",
  );
  if (breadcrumbs.length <= 1) return null;

  return (
    <div
      data-fp="subflow-breadcrumb"
      style={sx({
        display: "flex",
        alignItems: "center",
        gap: ui.spaceXs,
        padding: `${ui.controlGap} ${ui.padding}`,
        background: theme.bgSecondary,
        borderBottom: `${ui.borderWidth} solid ${theme.border}`,
        fontSize: ui.body,
        fontFamily: theme.fontSans,
        flexShrink: 0,
        overflowX: "auto",
      })}
    >
      {breadcrumbs.map((crumb, i) => {
        const isLast = i === breadcrumbs.length - 1;
        return (
          <span key={`${crumb.label}-${i}`} style={sx({ display: "flex", alignItems: "center", gap: ui.spaceXs })}>
            {i > 0 && (
              <span style={sx({ color: theme.textMuted, fontSize: ui.small })}>
                ›
              </span>
            )}
            {isLast ? (
              <span style={sx({ display: "flex", alignItems: "center", gap: ui.controlGap })}>
                <span
                  style={sx({
                    color: theme.primary,
                    fontWeight: ui.weightStrong,
                  })}
                >
                  {crumb.label}
                </span>
                {crumb.description && (
                  <span
                    style={sx({
                      color: theme.textMuted,
                      fontWeight: ui.weightNormal,
                      fontSize: ui.label,
                    })}
                  >
                    — {crumb.description}
                  </span>
                )}
              </span>
            ) : (
              <FootprintButton
                onClick={() => onNavigate(i)}
                defaultStyle={sx({
                  background: "none",
                  border: "none",
                  color: theme.textSecondary,
                  cursor: "pointer",
                  padding: `calc(${ui.spaceXs} / 2) ${ui.spaceXs}`,
                  borderRadius: ui.radiusControl,
                  fontSize: ui.body,
                  fontFamily: "inherit",
                  fontWeight: ui.weightMedium,
                  transition: `color ${ui.fastDuration} ${ui.easing}`,
                })}
                onMouseEnter={(e) => {
                  if (!unstyled && nativeButton) e.currentTarget.style.color = theme.primary;
                }}
                onMouseLeave={(e) => {
                  if (!unstyled && nativeButton) e.currentTarget.style.color = theme.textSecondary;
                }}
              >
                {crumb.label}
              </FootprintButton>
            )}
          </span>
        );
      })}
    </div>
  );
});
