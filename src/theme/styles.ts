import type { Size } from "../types";
import { borders, colors, controls, elevation, motion, radii, spacing, typography } from "./rawDefaults";

/**
 * Helper to resolve a CSS variable with a fallback.
 * Usage: v("--fp-color-primary", "#6366f1")
 */
export function v(varName: string, fallback: string): string {
  return `var(${varName}, ${fallback})`;
}

/** Shorthand for common theme variables */
export const theme = {
  primary: v("--fp-color-primary", colors.primary),
  success: v("--fp-color-success", colors.success),
  error: v("--fp-color-error", colors.error),
  warning: v("--fp-color-warning", colors.warning),
  onPrimary: v("--fp-on-primary", colors.onPrimary),
  onSuccess: v("--fp-on-success", colors.onSuccess),
  onError: v("--fp-on-error", colors.onError),
  onWarning: v("--fp-on-warning", colors.onWarning),
  onTracing: v("--fp-on-tracing", colors.onTracing),
  onNodeCursor: v("--fp-on-node-cursor", colors.onNodeCursor),
  onNodeVisited: v("--fp-on-node-visited", colors.onNodeVisited),
  onNodeMain: v("--fp-on-node-main", colors.onNodeMain),
  onNodeError: v("--fp-on-error", colors.onError),
  // Semantic NODE-STATE colors — first-class, themeable roles a runtime overlay
  // maps onto (scrub cursor / executed / a group's lead node). Distinct from the
  // generic `primary` accent so the three read as three different things.
  nodeCursor: v("--fp-node-cursor", colors.nodeCursor), // the current / scrubbed-to step
  nodeVisited: v("--fp-node-visited", colors.nodeVisited), // executed up to the cursor
  nodeMain: v("--fp-node-main", colors.nodeMain), // the lead / "hero" node of a group
  // Short-alias roles. Panels written against these read the SAME token the
  // presets emit (see tokensToCSSVars) — they exist so a component can say
  // "accent" without deciding whether it means the brand primary.
  accent: v("--fp-accent", colors.accent), // active tab / selected rule
  accentBg: v("--fp-accent-bg", colors.accentBg), // wash behind an accented row
  tracing: v("--fp-tracing", colors.tracing), // the tracing-rail chrome
  bg: v("--fp-bg", colors.bg), // panel body surface
  bgElevated: v("--fp-bg-elevated", colors.bgElevated), // raised card on the body surface
  bgPrimary: v("--fp-bg-primary", colors.bgPrimary),
  bgSecondary: v("--fp-bg-secondary", colors.bgSecondary),
  bgTertiary: v("--fp-bg-tertiary", colors.bgTertiary),
  textPrimary: v("--fp-text-primary", colors.textPrimary),
  textSecondary: v("--fp-text-secondary", colors.textSecondary),
  textMuted: v("--fp-text-muted", colors.textMuted),
  border: v("--fp-border", colors.border),
  radius: v("--fp-radius", "8px"),
  fontSans: v("--fp-font-sans", "Inter, system-ui, -apple-system, sans-serif"),
  fontMono: v("--fp-font-mono", "'JetBrains Mono', 'Fira Code', monospace"),
} as const;

/** Font sizes per size variant */
export const fontSize: Record<Size, { label: number; body: number; small: number }> = {
  compact: { label: 10, body: 11, small: 9 },
  default: { label: 11, body: 12, small: 10 },
  detailed: { label: 12, body: 13, small: 11 },
};

/** Padding per size variant */
export const padding: Record<Size, number> = {
  compact: 8,
  default: 12,
  detailed: 16,
};


/**
 * CSS recipes for visual sizes. Numeric layout/math callers retain fontSize
 * and padding above; components use these strings for themeable paint.
 * Size offsets keep the historic compact/default/detailed density distinct.
 */
function sizeOffset(name: string, fallback: string, amount: number) {
  return amount === 0 ? v(name, fallback) : `calc(${v(name, fallback)} ${amount < 0 ? "-" : "+"} ${Math.abs(amount)}px)`;
}

/** The recording slider and its controls share these recipes with the full Shell. */
export function controlStyles(size: Size = "default") {
  const fontOffset = fontSize[size].body - fontSize.default.body;
  return {
    body: sizeOffset("--fp-font-size-body", typography.body, fontOffset),
    small: sizeOffset("--fp-font-size-small", typography.small, fontOffset),
    lineHeight: v("--fp-line-height", typography.lineHeight),
    controlHeight: `max(0px, ${sizeOffset("--fp-control-height", controls.height, fontOffset * 4)})`,
    controlPadding: `${v("--fp-space-xs", spacing.xs)} ${v("--fp-control-padding-x", controls.paddingX)}`,
    iconSize: sizeOffset("--fp-icon-size", controls.iconSize, fontOffset),
    radiusControl: `var(--fp-radius-control, var(--fp-radius, ${radii.control}))`,
    borderWidth: v("--fp-border-width", borders.width),
    focusWidth: v("--fp-focus-width", borders.focusWidth),
    fastDuration: v("--fp-motion-fast-duration", motion.fastDuration),
    easing: v("--fp-motion-easing", motion.easing),
    spaceXs: v("--fp-space-xs", spacing.xs),
    spaceSm: v("--fp-space-sm", spacing.sm),
  };
}

export function componentStyles(size: Size = "default") {
  const fontOffset = fontSize[size].body - fontSize.default.body;
  const padOffset = padding[size] - padding.default;
  return {
    ...controlStyles(size),
    label: sizeOffset("--fp-font-size-label", typography.label, fontOffset),
    title: sizeOffset("--fp-font-size-title", typography.title, fontOffset),
    weightNormal: v("--fp-font-weight-normal", typography.weightNormal),
    weightMedium: v("--fp-font-weight-medium", typography.weightMedium),
    weightStrong: v("--fp-font-weight-strong", typography.weightStrong),
    padding: `max(0px, ${sizeOffset("--fp-space-md", spacing.md, padOffset)})`,
    controlPaddingX: v("--fp-control-padding-x", controls.paddingX),
    controlGap: v("--fp-control-gap", controls.gap),
    radiusPanel: `var(--fp-radius-panel, var(--fp-radius, ${radii.panel}))`,
    radiusBadge: `var(--fp-radius-badge, var(--fp-radius, ${radii.badge}))`,
    shadowPanel: v("--fp-shadow-panel", elevation.panel),
    shadowPopover: v("--fp-shadow-popover", elevation.popover),
    shadowFocus: v("--fp-shadow-focus", elevation.focus),
    duration: v("--fp-motion-duration", motion.duration),
    spaceMd: v("--fp-space-md", spacing.md),
    spaceLg: v("--fp-space-lg", spacing.lg),
    spaceXl: v("--fp-space-xl", spacing.xl),
  };
}
