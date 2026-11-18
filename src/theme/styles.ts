import type { Size } from "../types";
import { rawDefaults } from "./rawDefaults";

/**
 * Helper to resolve a CSS variable with a fallback.
 * Usage: v("--fp-color-primary", "#6366f1")
 */
export function v(varName: string, fallback: string): string {
  return `var(${varName}, ${fallback})`;
}

/** Shorthand for common theme variables */
export const theme = {
  primary: v("--fp-color-primary", "#6366f1"),
  success: v("--fp-color-success", "#22c55e"),
  error: v("--fp-color-error", "#ef4444"),
  warning: v("--fp-color-warning", "#f59e0b"),
  onPrimary: v("--fp-on-primary", rawDefaults.colors.onPrimary),
  onSuccess: v("--fp-on-success", rawDefaults.colors.onSuccess),
  onError: v("--fp-on-error", rawDefaults.colors.onError),
  onWarning: v("--fp-on-warning", rawDefaults.colors.onWarning),
  onTracing: v("--fp-on-tracing", rawDefaults.colors.onTracing),
  onNodeCursor: v("--fp-on-node-cursor", rawDefaults.colors.onNodeCursor),
  onNodeVisited: v("--fp-on-node-visited", rawDefaults.colors.onNodeVisited),
  onNodeMain: v("--fp-on-node-main", rawDefaults.colors.onNodeMain),
  onNodeError: v("--fp-on-error", rawDefaults.colors.onError),
  // Semantic NODE-STATE colors — first-class, themeable roles a runtime overlay
  // maps onto (scrub cursor / executed / a group's lead node). Distinct from the
  // generic `primary` accent so the three read as three different things.
  nodeCursor: v("--fp-node-cursor", "#f59e0b"), // the current / scrubbed-to step
  nodeVisited: v("--fp-node-visited", "#22c55e"), // executed up to the cursor
  nodeMain: v("--fp-node-main", "#6366f1"), // the lead / "hero" node of a group
  // Short-alias roles. Panels written against these read the SAME token the
  // presets emit (see tokensToCSSVars) — they exist so a component can say
  // "accent" without deciding whether it means the brand primary.
  accent: v("--fp-accent", "#6366f1"), // active tab / selected rule
  accentBg: v("--fp-accent-bg", "rgba(99,102,241,0.12)"), // wash behind an accented row
  tracing: v("--fp-tracing", "#0d9488"), // the tracing-rail chrome
  bg: v("--fp-bg", "#1a1b26"), // panel body surface
  bgElevated: v("--fp-bg-elevated", "#1e293b"), // raised card on the body surface
  bgPrimary: v("--fp-bg-primary", "#0f172a"),
  bgSecondary: v("--fp-bg-secondary", "#1e293b"),
  bgTertiary: v("--fp-bg-tertiary", "#334155"),
  textPrimary: v("--fp-text-primary", "#f8fafc"),
  textSecondary: v("--fp-text-secondary", "#94a3b8"),
  textMuted: v("--fp-text-muted", "#64748b"),
  border: v("--fp-border", "#334155"),
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
    body: sizeOffset("--fp-font-size-body", rawDefaults.typography.body, fontOffset),
    small: sizeOffset("--fp-font-size-small", rawDefaults.typography.small, fontOffset),
    lineHeight: v("--fp-line-height", rawDefaults.typography.lineHeight),
    controlHeight: `max(0px, ${sizeOffset("--fp-control-height", rawDefaults.controls.height, fontOffset * 4)})`,
    controlPadding: `${v("--fp-space-xs", rawDefaults.spacing.xs)} ${v("--fp-control-padding-x", rawDefaults.controls.paddingX)}`,
    iconSize: sizeOffset("--fp-icon-size", rawDefaults.controls.iconSize, fontOffset),
    radiusControl: `var(--fp-radius-control, var(--fp-radius, ${rawDefaults.radii.control}))`,
    borderWidth: v("--fp-border-width", rawDefaults.borders.width),
    focusWidth: v("--fp-focus-width", rawDefaults.borders.focusWidth),
    fastDuration: v("--fp-motion-fast-duration", rawDefaults.motion.fastDuration),
    easing: v("--fp-motion-easing", rawDefaults.motion.easing),
    spaceXs: v("--fp-space-xs", rawDefaults.spacing.xs),
    spaceSm: v("--fp-space-sm", rawDefaults.spacing.sm),
  };
}

export function componentStyles(size: Size = "default") {
  const fontOffset = fontSize[size].body - fontSize.default.body;
  const padOffset = padding[size] - padding.default;
  return {
    ...controlStyles(size),
    label: sizeOffset("--fp-font-size-label", rawDefaults.typography.label, fontOffset),
    title: sizeOffset("--fp-font-size-title", rawDefaults.typography.title, fontOffset),
    weightNormal: v("--fp-font-weight-normal", rawDefaults.typography.weightNormal),
    weightMedium: v("--fp-font-weight-medium", rawDefaults.typography.weightMedium),
    weightStrong: v("--fp-font-weight-strong", rawDefaults.typography.weightStrong),
    padding: `max(0px, ${sizeOffset("--fp-space-md", rawDefaults.spacing.md, padOffset)})`,
    controlPaddingX: v("--fp-control-padding-x", rawDefaults.controls.paddingX),
    controlGap: v("--fp-control-gap", rawDefaults.controls.gap),
    radiusPanel: `var(--fp-radius-panel, var(--fp-radius, ${rawDefaults.radii.panel}))`,
    radiusBadge: `var(--fp-radius-badge, var(--fp-radius, ${rawDefaults.radii.badge}))`,
    shadowPanel: v("--fp-shadow-panel", rawDefaults.elevation.panel),
    shadowPopover: v("--fp-shadow-popover", rawDefaults.elevation.popover),
    shadowFocus: v("--fp-shadow-focus", rawDefaults.elevation.focus),
    duration: v("--fp-motion-duration", rawDefaults.motion.duration),
    spaceMd: v("--fp-space-md", rawDefaults.spacing.md),
    spaceLg: v("--fp-space-lg", rawDefaults.spacing.lg),
    spaceXl: v("--fp-space-xl", rawDefaults.spacing.xl),
  };
}
