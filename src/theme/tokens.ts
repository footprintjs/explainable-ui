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

/** Default dark theme values (used as CSS variable fallbacks). */
export const defaultTokens: Required<{
  [K in keyof ThemeTokens]-?: Required<ThemeTokens[K]>;
}> = {
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
};
