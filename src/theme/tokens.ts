/** Default theme tokens — consumers override via CSS variables or ThemeProvider. */
export interface ThemeTokens {
  colors?: {
    primary?: string;
    success?: string;
    error?: string;
    warning?: string;
    /** Semantic node-state roles (a runtime overlay maps onto these): the scrub
     *  cursor, the visited path, and a group's lead node. */
    nodeCursor?: string;
    nodeVisited?: string;
    nodeMain?: string;
    /** Interactive accent — active tab, selected row rule, focused chip.
     *  Defaults to `primary` when omitted, so setting one colour is enough. */
    accent?: string;
    /** The translucent wash BEHIND an accented row (selected trace step). */
    accentBg?: string;
    /** Panel body surface — the plain background a panel paints itself with. */
    bg?: string;
    /** Raised surface (cards, popovers) sitting ON the body surface. */
    bgElevated?: string;
    /** Tracing-rail chrome — the "you are walking a value's causes" colour.
     *  One token drives the badge, rail border, stops and walk buttons. */
    tracing?: string;
    /** CATEGORICAL chip palette (four hues) for the ingredient chips on one
     *  trace stop. Not semantic — their only job is to stay tellable apart,
     *  which is why they are their own roles and not `primary`/`success`. */
    chip1?: string;
    chip2?: string;
    chip3?: string;
    chip4?: string;
    bgPrimary?: string;
    bgSecondary?: string;
    bgTertiary?: string;
    textPrimary?: string;
    textSecondary?: string;
    textMuted?: string;
    border?: string;
  };
  radius?: string;
  fontFamily?: {
    sans?: string;
    mono?: string;
  };
}

/**
 * Maps ThemeTokens to CSS custom property assignments.
 *
 * Every `--fp-*` variable the components actually read must be emitted
 * here — a component reading a variable this function never writes can
 * only ever show its hard-coded fallback, which is how a "light" theme
 * ends up with dark patches. `test/unit/themeTokens.test.ts` greps the
 * source for `--fp-*` reads and fails when one has no emitter, so a new
 * token can't silently drift back out of the theme.
 */
export function tokensToCSSVars(tokens: ThemeTokens): Record<string, string> {
  const vars: Record<string, string> = {};
  if (tokens.colors) {
    const c = tokens.colors;
    if (c.primary) vars["--fp-color-primary"] = c.primary;
    if (c.success) vars["--fp-color-success"] = c.success;
    if (c.error) vars["--fp-color-error"] = c.error;
    if (c.warning) vars["--fp-color-warning"] = c.warning;
    if (c.nodeCursor) vars["--fp-node-cursor"] = c.nodeCursor;
    if (c.nodeVisited) vars["--fp-node-visited"] = c.nodeVisited;
    if (c.nodeMain) vars["--fp-node-main"] = c.nodeMain;
    // Two spellings exist in the wild: components written against the short
    // aliases (`--fp-accent`, `--fp-success`) and against the long role names.
    // Emit both from ONE token so a consumer never has to know which a given
    // component happens to use. `accent` falls back to `primary` — the two
    // are the same colour in every built-in preset.
    const accent = c.accent ?? c.primary;
    if (accent) vars["--fp-accent"] = accent;
    if (c.accentBg) vars["--fp-accent-bg"] = c.accentBg;
    if (c.success) vars["--fp-success"] = c.success;
    if (c.tracing) vars["--fp-tracing"] = c.tracing;
    if (c.chip1) vars["--fp-chip-1"] = c.chip1;
    if (c.chip2) vars["--fp-chip-2"] = c.chip2;
    if (c.chip3) vars["--fp-chip-3"] = c.chip3;
    if (c.chip4) vars["--fp-chip-4"] = c.chip4;
    if (c.bg) vars["--fp-bg"] = c.bg;
    if (c.bgElevated) vars["--fp-bg-elevated"] = c.bgElevated;
    if (c.bgPrimary) vars["--fp-bg-primary"] = c.bgPrimary;
    if (c.bgSecondary) vars["--fp-bg-secondary"] = c.bgSecondary;
    if (c.bgTertiary) vars["--fp-bg-tertiary"] = c.bgTertiary;
    if (c.textPrimary) vars["--fp-text-primary"] = c.textPrimary;
    if (c.textSecondary) vars["--fp-text-secondary"] = c.textSecondary;
    if (c.textMuted) vars["--fp-text-muted"] = c.textMuted;
    if (c.border) vars["--fp-border"] = c.border;
  }
  if (tokens.radius) vars["--fp-radius"] = tokens.radius;
  if (tokens.fontFamily?.sans) vars["--fp-font-sans"] = tokens.fontFamily.sans;
  if (tokens.fontFamily?.mono) vars["--fp-font-mono"] = tokens.fontFamily.mono;
  return vars;
}

/** Raw fallback values — used by tokensToCSSVars() and anywhere a real color is needed. */
export const rawDefaults = {
  colors: {
    primary: "#6366f1",
    success: "#22c55e",
    error: "#ef4444",
    warning: "#f59e0b",
    nodeCursor: "#f59e0b",
    nodeVisited: "#22c55e",
    nodeMain: "#6366f1",
    accent: "#6366f1",
    accentBg: "rgba(99,102,241,0.12)",
    tracing: "#0d9488",
    chip1: "#0d9488",
    chip2: "#d97706",
    chip3: "#7c3aed",
    chip4: "#e11d48",
    bg: "#1a1b26",
    bgElevated: "#1e293b",
    bgPrimary: "#0f172a",
    bgSecondary: "#1e293b",
    bgTertiary: "#334155",
    textPrimary: "#f8fafc",
    textSecondary: "#94a3b8",
    textMuted: "#64748b",
    border: "#334155",
  },
  radius: "8px",
  fontFamily: {
    sans: "Inter, system-ui, -apple-system, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
  },
} as const;

/**
 * Default dark theme values with CSS variable references (consumers can
 * override via CSS).
 *
 * WARNING — do NOT pass this object to `<FootprintTheme tokens={...}>` (or to
 * `tokensToCSSVars`). Every value here is already a `var(--fp-…, fallback)`
 * REFERENCE, so feeding them back in emits self-referential declarations like
 * `--fp-accent: var(--fp-accent, #6366f1)`, which resolve to nothing and blank
 * out the colours they were meant to set. Start from `rawDefaults` (plain hex)
 * or from a preset in `theme/presets.ts` and override the fields you want.
 */
export const defaultTokens: Required<{
  [K in keyof ThemeTokens]-?: Required<ThemeTokens[K]>;
}> = {
  colors: {
    primary: `var(--fp-color-primary, ${rawDefaults.colors.primary})`,
    success: `var(--fp-color-success, ${rawDefaults.colors.success})`,
    error: `var(--fp-color-error, ${rawDefaults.colors.error})`,
    warning: `var(--fp-color-warning, ${rawDefaults.colors.warning})`,
    nodeCursor: `var(--fp-node-cursor, ${rawDefaults.colors.nodeCursor})`,
    nodeVisited: `var(--fp-node-visited, ${rawDefaults.colors.nodeVisited})`,
    nodeMain: `var(--fp-node-main, ${rawDefaults.colors.nodeMain})`,
    accent: `var(--fp-accent, ${rawDefaults.colors.accent})`,
    accentBg: `var(--fp-accent-bg, ${rawDefaults.colors.accentBg})`,
    tracing: `var(--fp-tracing, ${rawDefaults.colors.tracing})`,
    chip1: `var(--fp-chip-1, ${rawDefaults.colors.chip1})`,
    chip2: `var(--fp-chip-2, ${rawDefaults.colors.chip2})`,
    chip3: `var(--fp-chip-3, ${rawDefaults.colors.chip3})`,
    chip4: `var(--fp-chip-4, ${rawDefaults.colors.chip4})`,
    bg: `var(--fp-bg, ${rawDefaults.colors.bg})`,
    bgElevated: `var(--fp-bg-elevated, ${rawDefaults.colors.bgElevated})`,
    bgPrimary: `var(--fp-bg-primary, ${rawDefaults.colors.bgPrimary})`,
    bgSecondary: `var(--fp-bg-secondary, ${rawDefaults.colors.bgSecondary})`,
    bgTertiary: `var(--fp-bg-tertiary, ${rawDefaults.colors.bgTertiary})`,
    textPrimary: `var(--fp-text-primary, ${rawDefaults.colors.textPrimary})`,
    textSecondary: `var(--fp-text-secondary, ${rawDefaults.colors.textSecondary})`,
    textMuted: `var(--fp-text-muted, ${rawDefaults.colors.textMuted})`,
    border: `var(--fp-border, ${rawDefaults.colors.border})`,
  },
  radius: `var(--fp-radius, ${rawDefaults.radius})`,
  fontFamily: {
    sans: `var(--fp-font-sans, ${rawDefaults.fontFamily.sans})`,
    mono: `var(--fp-font-mono, ${rawDefaults.fontFamily.mono})`,
  },
};
