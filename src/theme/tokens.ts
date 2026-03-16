/** Default theme tokens — consumers override via CSS variables or ThemeProvider. */
export interface ThemeTokens {
  colors?: {
    primary?: string;
    success?: string;
    error?: string;
    warning?: string;
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

/** Maps ThemeTokens to CSS custom property assignments. */
export function tokensToCSSVars(tokens: ThemeTokens): Record<string, string> {
  const vars: Record<string, string> = {};
  if (tokens.colors) {
    const c = tokens.colors;
    if (c.primary) vars["--fp-color-primary"] = c.primary;
    if (c.success) vars["--fp-color-success"] = c.success;
    if (c.error) vars["--fp-color-error"] = c.error;
    if (c.warning) vars["--fp-color-warning"] = c.warning;
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

/** Default dark theme values with CSS variable references (consumers can override via CSS). */
export const defaultTokens: Required<{
  [K in keyof ThemeTokens]-?: Required<ThemeTokens[K]>;
}> = {
  colors: {
    primary: `var(--fp-color-primary, ${rawDefaults.colors.primary})`,
    success: `var(--fp-color-success, ${rawDefaults.colors.success})`,
    error: `var(--fp-color-error, ${rawDefaults.colors.error})`,
    warning: `var(--fp-color-warning, ${rawDefaults.colors.warning})`,
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
