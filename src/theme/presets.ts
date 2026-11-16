import { rawDefaults, type ThemeTokens } from "./tokens";

/**
 * Built-in palettes.
 *
 * Each preset carries EVERY role the components read — including the
 * node-state roles, the accent pair, the surfaces and the tracing colour.
 * A preset with holes is worse than no preset: the components fall back to
 * their hard-coded (dark) defaults for the missing roles, so a light theme
 * shows dark patches. `test/unit/themeTokens.test.ts` fails when a preset
 * stops covering a token the source reads.
 *
 * The cool presets keep the historic raw defaults for the node roles
 * (amber cursor / green visited / indigo lead) so nothing re-colours for
 * consumers already on them; the warm presets use their own palette.
 */

/** Cool dark theme (the library default) */
export const coolDark: ThemeTokens = {
  ...rawDefaults,
  colors: {
    ...rawDefaults.colors,
    primary: "#6366f1",
    success: "#22c55e",
    error: "#ef4444",
    warning: "#f59e0b",
    nodeCursor: "#f59e0b",
    nodeVisited: "#22c55e",
    nodeMain: "#6366f1",
    accent: "#6366f1",
    accentBg: "rgba(99,102,241,0.12)",
    tracing: "#14b8a6",
    chip1: "#0d9488",
    chip2: "#d97706",
    chip3: "#7c3aed",
    chip4: "#e11d48",
    bg: "#0f172a",
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
};

/** Warm dark theme — charcoal-purple palette */
export const warmDark: ThemeTokens = {
  ...rawDefaults,
  colors: {
    ...rawDefaults.colors,
    primary: "#7c6cf0",
    success: "#3dd68c",
    error: "#f06292",
    warning: "#ffb74d",
    nodeCursor: "#ffb74d",
    nodeVisited: "#3dd68c",
    nodeMain: "#7c6cf0",
    accent: "#7c6cf0",
    accentBg: "rgba(124,108,240,0.14)",
    tracing: "#3ecfb2",
    chip1: "#0d9488",
    chip2: "#d97706",
    chip3: "#7c3aed",
    chip4: "#e11d48",
    bg: "#1e1a2e",
    bgElevated: "#2a2540",
    bgPrimary: "#1e1a2e",
    bgSecondary: "#2a2540",
    bgTertiary: "#3a3455",
    textPrimary: "#f0e6d6",
    textSecondary: "#a89eb4",
    textMuted: "#6e6480",
    border: "#3a3455",
  },
  radius: "8px",
  fontFamily: {
    sans: "Inter, system-ui, -apple-system, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
  },
};

/** Warm light theme — cream/peach palette */
export const warmLight: ThemeTokens = {
  ...rawDefaults,
  colors: {
    ...rawDefaults.colors,
    primary: "#7c6cf0",
    success: "#22a860",
    error: "#d94452",
    warning: "#e09030",
    nodeCursor: "#e09030",
    nodeVisited: "#22a860",
    nodeMain: "#7c6cf0",
    accent: "#7c6cf0",
    accentBg: "rgba(124,108,240,0.12)",
    tracing: "#0e9c88",
    chip1: "#0d9488",
    chip2: "#d97706",
    chip3: "#7c3aed",
    chip4: "#e11d48",
    bg: "#faf5ef",
    bgElevated: "#f0e6d6",
    bgPrimary: "#faf5ef",
    bgSecondary: "#f0e6d6",
    bgTertiary: "#e4d5c3",
    textPrimary: "#2e2938",
    textSecondary: "#5c5468",
    textMuted: "#8a7e96",
    border: "#d6c8b4",
  },
  radius: "8px",
  fontFamily: {
    sans: "Inter, system-ui, -apple-system, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
  },
};

/** Cool light theme — neutral grays, matches Tailwind zinc palette */
export const coolLight: ThemeTokens = {
  ...rawDefaults,
  colors: {
    ...rawDefaults.colors,
    primary: "#6366f1",
    success: "#22c55e",
    error: "#ef4444",
    warning: "#f59e0b",
    nodeCursor: "#f59e0b",
    nodeVisited: "#22c55e",
    nodeMain: "#6366f1",
    accent: "#6366f1",
    accentBg: "rgba(99,102,241,0.10)",
    tracing: "#0d9488",
    chip1: "#0d9488",
    chip2: "#d97706",
    chip3: "#7c3aed",
    chip4: "#e11d48",
    bg: "#ffffff",
    bgElevated: "#f9fafb",
    bgPrimary: "#ffffff",
    bgSecondary: "#f9fafb",
    bgTertiary: "#e5e7eb",
    textPrimary: "#18181b",
    textSecondary: "#52525b",
    textMuted: "#a1a1aa",
    border: "#e5e7eb",
  },
  radius: "8px",
  fontFamily: {
    sans: "Inter, system-ui, -apple-system, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
  },
};

const paperMono = "'IBM Plex Mono', 'SFMono-Regular', Consolas, 'Liberation Mono', monospace";

/** Paper light — cream surfaces, pastel recorded states and ink outlines. */
export const paperLight: ThemeTokens = {
  ...rawDefaults,
  colors: {
    ...rawDefaults.colors,
    primary: "#465d50", success: "#4f7054", error: "#a4473e", warning: "#8d602c",
    onPrimary: "#fffdf6", onSuccess: "#fffdf6", onError: "#fffdf6", onWarning: "#fffdf6", onTracing: "#fffdf6",
    nodeCursor: "#edc5a9", nodeVisited: "#cbd9ba", nodeMain: "#d7d0e5",
    onNodeCursor: "#34382f", onNodeVisited: "#34382f", onNodeMain: "#34382f",
    accent: "#465d50", accentBg: "#e4e8d9", tracing: "#536b58",
    chip1: "#536b58", chip2: "#8d602c", chip3: "#75638b", chip4: "#a05d55",
    bg: "#f6f2e9", bgElevated: "#fffdf6", bgPrimary: "#f6f2e9", bgSecondary: "#fffdf6", bgTertiary: "#e8e4d8",
    textPrimary: "#34382f", textSecondary: "#616657", textMuted: "#686d5d", border: "#4e5148",
  },
  radius: "5px",
  radii: { control: "5px", panel: "5px", badge: "5px" },
  borders: { width: "1px", focusWidth: "2px" },
  elevation: { panel: "2px 3px 0 #4e5148", popover: "3px 4px 0 #4e5148", focus: "none" },
  nodes: { borderColor: "#34382f", borderWidth: "1px", borderStyle: "solid", radius: "5px",
    shadow: "2px 3px 0 #34382f", shapeShadow: "drop-shadow(2px 3px 0 #34382f)", badgeShadow: "none", pulseOpacity: "0", groupStatusDisplay: "inline-flex" },
  fontFamily: { sans: paperMono, mono: paperMono },
};

/** Paper dark — warm charcoal surfaces with the same readable pastel states. */
export const paperDark: ThemeTokens = {
  ...rawDefaults,
  colors: {
    ...rawDefaults.colors,
    primary: "#cbd9ba", success: "#c0d0aa", error: "#ecaca0", warning: "#e7c391",
    onPrimary: "#34382f", onSuccess: "#34382f", onError: "#34382f", onWarning: "#34382f", onTracing: "#34382f",
    nodeCursor: "#edc5a9", nodeVisited: "#cbd9ba", nodeMain: "#d7d0e5",
    onNodeCursor: "#34382f", onNodeVisited: "#34382f", onNodeMain: "#34382f",
    accent: "#cbd9ba", accentBg: "#3e4937", tracing: "#c0d0aa",
    chip1: "#c0d0aa", chip2: "#e7c391", chip3: "#d7d0e5", chip4: "#ecaca0",
    bg: "#252923", bgElevated: "#3a4035", bgPrimary: "#252923", bgSecondary: "#32372f", bgTertiary: "#454b3d",
    textPrimary: "#f2eedf", textSecondary: "#cbcbb7", textMuted: "#a8ad9a", border: "#a5aa97",
  },
  radius: "5px",
  radii: { control: "5px", panel: "5px", badge: "5px" },
  borders: { width: "1px", focusWidth: "2px" },
  elevation: { panel: "2px 3px 0 #10160f", popover: "3px 4px 0 #10160f", focus: "none" },
  nodes: { borderColor: "#171d16", borderWidth: "1px", borderStyle: "solid", radius: "5px",
    shadow: "2px 3px 0 #10160f", shapeShadow: "drop-shadow(2px 3px 0 #10160f)", badgeShadow: "none", pulseOpacity: "0", groupStatusDisplay: "inline-flex" },
  fontFamily: { sans: paperMono, mono: paperMono },
};

/** All built-in theme presets */
export const themePresets = {
  coolDark,
  coolLight,
  warmDark,
  warmLight,
  paperLight,
  paperDark,
} as const;

export type ThemePresetName = keyof typeof themePresets;
