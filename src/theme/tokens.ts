/** Default theme tokens — consumers override via CSS variables or ThemeProvider. */
export interface ThemeTokens {
  colors?: {
    primary?: string;
    success?: string;
    error?: string;
    warning?: string;
    /** Text/icon colors paired with independently configurable fills. */
    onPrimary?: string;
    onSuccess?: string;
    onError?: string;
    onWarning?: string;
    onTracing?: string;
    onNodeCursor?: string;
    onNodeVisited?: string;
    onNodeMain?: string;
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
  /** Legacy global radius; also seeds component radii unless explicitly set. */
  radius?: string;
  typography?: {
    body?: string; label?: string; small?: string; title?: string;
    lineHeight?: string;
    weightNormal?: string; weightMedium?: string; weightStrong?: string;
  };
  spacing?: { xs?: string; sm?: string; md?: string; lg?: string; xl?: string };
  radii?: { control?: string; panel?: string; badge?: string };
  borders?: { width?: string; focusWidth?: string };
  elevation?: { panel?: string; popover?: string; focus?: string };
  /** Chart-card paint overrides. Omitted fields retain each renderer's
   *  existing status-dependent appearance. `initial` restores that fallback. */
  nodes?: {
    borderColor?: string;
    borderWidth?: string;
    borderStyle?: string;
    radius?: string;
    shadow?: string;
    /** CSS filter for clipped shapes, such as none or drop-shadow(...).
     *  Unlike a box shadow, drop-shadow() accepts no spread or inset. */
    shapeShadow?: string;
    badgeShadow?: string;
    pulseOpacity?: string;
    /** Display value for the group header's recorded-state cue. Default none. */
    groupStatusDisplay?: string;
  };
  /** Alpha applied to node and edge drawings after confirmed removal. */
  diagram?: { removedOpacity?: string };
  motion?: { duration?: string; fastDuration?: string; easing?: string };
  controls?: { height?: string; paddingX?: string; gap?: string; iconSize?: string };
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
    if (c.onPrimary) vars["--fp-on-primary"] = c.onPrimary;
    if (c.onSuccess) vars["--fp-on-success"] = c.onSuccess;
    if (c.onError) vars["--fp-on-error"] = c.onError;
    if (c.onWarning) vars["--fp-on-warning"] = c.onWarning;
    if (c.onTracing) vars["--fp-on-tracing"] = c.onTracing;
    if (c.onNodeCursor) vars["--fp-on-node-cursor"] = c.onNodeCursor;
    if (c.onNodeVisited) vars["--fp-on-node-visited"] = c.onNodeVisited;
    if (c.onNodeMain) vars["--fp-on-node-main"] = c.onNodeMain;
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
  if (tokens.radius) {
    vars["--fp-radius"] = tokens.radius;
    vars["--fp-radius-control"] = tokens.radius;
    vars["--fp-radius-panel"] = tokens.radius;
    vars["--fp-radius-badge"] = tokens.radius;
  }
  const write = (values: Record<string, string | undefined> | undefined, names: Record<string, string>) => {
    if (!values) return;
    for (const [key, name] of Object.entries(names)) if (values[key]) vars[name] = values[key]!;
  };
  write(tokens.typography, {
    body: "--fp-font-size-body", label: "--fp-font-size-label", small: "--fp-font-size-small", title: "--fp-font-size-title",
    lineHeight: "--fp-line-height", weightNormal: "--fp-font-weight-normal", weightMedium: "--fp-font-weight-medium", weightStrong: "--fp-font-weight-strong",
  });
  write(tokens.spacing, { xs: "--fp-space-xs", sm: "--fp-space-sm", md: "--fp-space-md", lg: "--fp-space-lg", xl: "--fp-space-xl" });
  write(tokens.radii, { control: "--fp-radius-control", panel: "--fp-radius-panel", badge: "--fp-radius-badge" });
  write(tokens.borders, { width: "--fp-border-width", focusWidth: "--fp-focus-width" });
  write(tokens.elevation, { panel: "--fp-shadow-panel", popover: "--fp-shadow-popover", focus: "--fp-shadow-focus" });
  write(tokens.nodes, {
    borderColor: "--fp-node-border-color", borderWidth: "--fp-node-border-width", borderStyle: "--fp-node-border-style",
    radius: "--fp-node-radius", shadow: "--fp-node-shadow", shapeShadow: "--fp-node-shape-shadow",
    badgeShadow: "--fp-node-badge-shadow", pulseOpacity: "--fp-node-pulse-opacity", groupStatusDisplay: "--fp-node-group-status-display",
  });
  write(tokens.diagram, { removedOpacity: "--fp-diagram-removed-opacity" });
  write(tokens.motion, { duration: "--fp-motion-duration", fastDuration: "--fp-motion-fast-duration", easing: "--fp-motion-easing" });
  write(tokens.controls, { height: "--fp-control-height", paddingX: "--fp-control-padding-x", gap: "--fp-control-gap", iconSize: "--fp-icon-size" });
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
    onPrimary: "#fff", onSuccess: "#fff", onError: "#fff", onWarning: "#1a1a1a", onTracing: "#fff",
    onNodeCursor: "#1a1a1a", onNodeVisited: "#fff", onNodeMain: "#fff",
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
  typography: {
    body: "12px", label: "11px", small: "10px", title: "14px", lineHeight: "1.5",
    weightNormal: "400", weightMedium: "500", weightStrong: "700",
  },
  spacing: { xs: "4px", sm: "8px", md: "12px", lg: "16px", xl: "24px" },
  radii: { control: "6px", panel: "8px", badge: "12px" },
  borders: { width: "1px", focusWidth: "2px" },
  elevation: { panel: "0 2px 8px rgba(0,0,0,0.15)", popover: "0 6px 24px rgba(0,0,0,0.2)", focus: "none" },
  // CSS-wide initial makes a custom property guaranteed-invalid, so var()
  // selects the renderer's existing status-dependent fallback recipe.
  // Group status cues remain hidden unless a theme explicitly opts in.
  nodes: {
    borderColor: "initial", borderWidth: "initial", borderStyle: "initial", radius: "initial",
    shadow: "initial", shapeShadow: "initial", badgeShadow: "initial", pulseOpacity: "initial", groupStatusDisplay: "none",
  },
  diagram: { removedOpacity: "0.4" },
  motion: { duration: "240ms", fastDuration: "120ms", easing: "ease" },
  controls: { height: "28px", paddingX: "8px", gap: "6px", iconSize: "14px" },
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
    onPrimary: `var(--fp-on-primary, ${rawDefaults.colors.onPrimary})`,
    onSuccess: `var(--fp-on-success, ${rawDefaults.colors.onSuccess})`,
    onError: `var(--fp-on-error, ${rawDefaults.colors.onError})`,
    onWarning: `var(--fp-on-warning, ${rawDefaults.colors.onWarning})`,
    onTracing: `var(--fp-on-tracing, ${rawDefaults.colors.onTracing})`,
    onNodeCursor: `var(--fp-on-node-cursor, ${rawDefaults.colors.onNodeCursor})`,
    onNodeVisited: `var(--fp-on-node-visited, ${rawDefaults.colors.onNodeVisited})`,
    onNodeMain: `var(--fp-on-node-main, ${rawDefaults.colors.onNodeMain})`,
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
  typography: {
    body: `var(--fp-font-size-body, ${rawDefaults.typography.body})`, label: `var(--fp-font-size-label, ${rawDefaults.typography.label})`,
    small: `var(--fp-font-size-small, ${rawDefaults.typography.small})`, title: `var(--fp-font-size-title, ${rawDefaults.typography.title})`,
    lineHeight: `var(--fp-line-height, ${rawDefaults.typography.lineHeight})`,
    weightNormal: `var(--fp-font-weight-normal, ${rawDefaults.typography.weightNormal})`, weightMedium: `var(--fp-font-weight-medium, ${rawDefaults.typography.weightMedium})`, weightStrong: `var(--fp-font-weight-strong, ${rawDefaults.typography.weightStrong})`,
  },
  spacing: { xs: `var(--fp-space-xs, ${rawDefaults.spacing.xs})`, sm: `var(--fp-space-sm, ${rawDefaults.spacing.sm})`, md: `var(--fp-space-md, ${rawDefaults.spacing.md})`, lg: `var(--fp-space-lg, ${rawDefaults.spacing.lg})`, xl: `var(--fp-space-xl, ${rawDefaults.spacing.xl})` },
  radii: { control: `var(--fp-radius-control, ${rawDefaults.radii.control})`, panel: `var(--fp-radius-panel, ${rawDefaults.radii.panel})`, badge: `var(--fp-radius-badge, ${rawDefaults.radii.badge})` },
  borders: { width: `var(--fp-border-width, ${rawDefaults.borders.width})`, focusWidth: `var(--fp-focus-width, ${rawDefaults.borders.focusWidth})` },
  elevation: { panel: `var(--fp-shadow-panel, ${rawDefaults.elevation.panel})`, popover: `var(--fp-shadow-popover, ${rawDefaults.elevation.popover})`, focus: `var(--fp-shadow-focus, ${rawDefaults.elevation.focus})` },
  nodes: {
    borderColor: `var(--fp-node-border-color, ${rawDefaults.nodes.borderColor})`,
    borderWidth: `var(--fp-node-border-width, ${rawDefaults.nodes.borderWidth})`,
    borderStyle: `var(--fp-node-border-style, ${rawDefaults.nodes.borderStyle})`,
    radius: `var(--fp-node-radius, ${rawDefaults.nodes.radius})`,
    shadow: `var(--fp-node-shadow, ${rawDefaults.nodes.shadow})`,
    shapeShadow: `var(--fp-node-shape-shadow, ${rawDefaults.nodes.shapeShadow})`,
    badgeShadow: `var(--fp-node-badge-shadow, ${rawDefaults.nodes.badgeShadow})`,
    pulseOpacity: `var(--fp-node-pulse-opacity, ${rawDefaults.nodes.pulseOpacity})`,
    groupStatusDisplay: `var(--fp-node-group-status-display, ${rawDefaults.nodes.groupStatusDisplay})`,
  },
  diagram: { removedOpacity: `var(--fp-diagram-removed-opacity, ${rawDefaults.diagram.removedOpacity})` },
  motion: { duration: `var(--fp-motion-duration, ${rawDefaults.motion.duration})`, fastDuration: `var(--fp-motion-fast-duration, ${rawDefaults.motion.fastDuration})`, easing: `var(--fp-motion-easing, ${rawDefaults.motion.easing})` },
  controls: { height: `var(--fp-control-height, ${rawDefaults.controls.height})`, paddingX: `var(--fp-control-padding-x, ${rawDefaults.controls.paddingX})`, gap: `var(--fp-control-gap, ${rawDefaults.controls.gap})`, iconSize: `var(--fp-icon-size, ${rawDefaults.controls.iconSize})` },
  fontFamily: {
    sans: `var(--fp-font-sans, ${rawDefaults.fontFamily.sans})`,
    mono: `var(--fp-font-mono, ${rawDefaults.fontFamily.mono})`,
  },
};
