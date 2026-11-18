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
