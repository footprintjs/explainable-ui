import type { Size } from "../types";

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
  // Semantic NODE-STATE colors — first-class, themeable roles a runtime overlay
  // maps onto (scrub cursor / executed / a group's lead node). Distinct from the
  // generic `primary` accent so the three read as three different things.
  nodeCursor: v("--fp-node-cursor", "#f59e0b"), // the current / scrubbed-to step
  nodeVisited: v("--fp-node-visited", "#22c55e"), // executed up to the cursor
  nodeMain: v("--fp-node-main", "#6366f1"), // the lead / "hero" node of a group
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
