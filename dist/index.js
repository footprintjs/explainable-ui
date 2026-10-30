// src/components/GroupedFlowDiagram/GroupedFlowDiagram.tsx
import { useContext as useContext3, useEffect as useEffect4, useMemo, useRef as useRef2, useState as useState3 } from "react";
import { Background, Controls, MarkerType, ReactFlow } from "@xyflow/react";

// src/theme/ThemeProvider.tsx
import { createContext, useContext } from "react";

// src/theme/tokens.ts
function tokensToCSSVars(tokens) {
  const vars = {};
  if (tokens.colors) {
    const c = tokens.colors;
    if (c.primary) vars["--fp-color-primary"] = c.primary;
    if (c.success) vars["--fp-color-success"] = c.success;
    if (c.error) vars["--fp-color-error"] = c.error;
    if (c.warning) vars["--fp-color-warning"] = c.warning;
    if (c.nodeCursor) vars["--fp-node-cursor"] = c.nodeCursor;
    if (c.nodeVisited) vars["--fp-node-visited"] = c.nodeVisited;
    if (c.nodeMain) vars["--fp-node-main"] = c.nodeMain;
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
var rawDefaults = {
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
    border: "#334155"
  },
  radius: "8px",
  fontFamily: {
    sans: "Inter, system-ui, -apple-system, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace"
  }
};
var defaultTokens = {
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
    border: `var(--fp-border, ${rawDefaults.colors.border})`
  },
  radius: `var(--fp-radius, ${rawDefaults.radius})`,
  fontFamily: {
    sans: `var(--fp-font-sans, ${rawDefaults.fontFamily.sans})`,
    mono: `var(--fp-font-mono, ${rawDefaults.fontFamily.mono})`
  }
};

// src/theme/ThemeProvider.tsx
import { jsx } from "react/jsx-runtime";
var ThemeContext = createContext({});
function useFootprintTheme() {
  return useContext(ThemeContext);
}
function FootprintTheme({ tokens = {}, children }) {
  const cssVars = tokensToCSSVars(tokens);
  return /* @__PURE__ */ jsx(ThemeContext.Provider, { value: tokens, children: /* @__PURE__ */ jsx(
    "div",
    {
      style: { ...cssVars, display: "contents" },
      className: "fp-theme-root",
      children
    }
  ) });
}

// src/theme/styles.ts
function v(varName, fallback) {
  return `var(${varName}, ${fallback})`;
}
var theme = {
  primary: v("--fp-color-primary", "#6366f1"),
  success: v("--fp-color-success", "#22c55e"),
  error: v("--fp-color-error", "#ef4444"),
  warning: v("--fp-color-warning", "#f59e0b"),
  // Semantic NODE-STATE colors — first-class, themeable roles a runtime overlay
  // maps onto (scrub cursor / executed / a group's lead node). Distinct from the
  // generic `primary` accent so the three read as three different things.
  nodeCursor: v("--fp-node-cursor", "#f59e0b"),
  // the current / scrubbed-to step
  nodeVisited: v("--fp-node-visited", "#22c55e"),
  // executed up to the cursor
  nodeMain: v("--fp-node-main", "#6366f1"),
  // the lead / "hero" node of a group
  // Short-alias roles. Panels written against these read the SAME token the
  // presets emit (see tokensToCSSVars) — they exist so a component can say
  // "accent" without deciding whether it means the brand primary.
  accent: v("--fp-accent", "#6366f1"),
  // active tab / selected rule
  accentBg: v("--fp-accent-bg", "rgba(99,102,241,0.12)"),
  // wash behind an accented row
  tracing: v("--fp-tracing", "#0d9488"),
  // the tracing-rail chrome
  bg: v("--fp-bg", "#1a1b26"),
  // panel body surface
  bgElevated: v("--fp-bg-elevated", "#1e293b"),
  // raised card on the body surface
  bgPrimary: v("--fp-bg-primary", "#0f172a"),
  bgSecondary: v("--fp-bg-secondary", "#1e293b"),
  bgTertiary: v("--fp-bg-tertiary", "#334155"),
  textPrimary: v("--fp-text-primary", "#f8fafc"),
  textSecondary: v("--fp-text-secondary", "#94a3b8"),
  textMuted: v("--fp-text-muted", "#64748b"),
  border: v("--fp-border", "#334155"),
  radius: v("--fp-radius", "8px"),
  fontSans: v("--fp-font-sans", "Inter, system-ui, -apple-system, sans-serif"),
  fontMono: v("--fp-font-mono", "'JetBrains Mono', 'Fira Code', monospace")
};
var fontSize = {
  compact: { label: 10, body: 11, small: 9 },
  default: { label: 11, body: 12, small: 10 },
  detailed: { label: 12, body: 13, small: 11 }
};
var padding = {
  compact: 8,
  default: 12,
  detailed: 16
};

// src/theme/presets.ts
var coolDark = {
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
    border: "#334155"
  },
  radius: "8px",
  fontFamily: {
    sans: "Inter, system-ui, -apple-system, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace"
  }
};
var warmDark = {
  colors: {
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
    border: "#3a3455"
  },
  radius: "8px",
  fontFamily: {
    sans: "Inter, system-ui, -apple-system, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace"
  }
};
var warmLight = {
  colors: {
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
    border: "#d6c8b4"
  },
  radius: "8px",
  fontFamily: {
    sans: "Inter, system-ui, -apple-system, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace"
  }
};
var coolLight = {
  colors: {
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
    border: "#e5e7eb"
  },
  radius: "8px",
  fontFamily: {
    sans: "Inter, system-ui, -apple-system, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace"
  }
};
var themePresets = {
  coolDark,
  coolLight,
  warmDark,
  warmLight
};

// src/theme/useDarkModeTokens.ts
import { useState, useEffect } from "react";
function isDark(spec) {
  if (typeof document === "undefined") return false;
  const root = document.documentElement;
  if (!root) return false;
  if (/^[.[#:]/.test(spec)) {
    try {
      return root.matches(spec);
    } catch {
      return root.classList.contains(spec.replace(/^\./, ""));
    }
  }
  return root.classList.contains(spec);
}
function useDarkModeTokens(options) {
  const lightTokens = options?.light ?? coolLight;
  const darkTokens = options?.dark ?? coolDark;
  const spec = options?.darkClass ?? options?.selector ?? "dark";
  const [isDarkMode, setIsDarkMode] = useState(false);
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (!root) return;
    setIsDarkMode(isDark(spec));
    const obs = new MutationObserver(() => setIsDarkMode(isDark(spec)));
    obs.observe(root, { attributes: true });
    return () => obs.disconnect();
  }, [spec]);
  return isDarkMode ? darkTokens : lightTokens;
}

// src/theme/mode.ts
function themeModeVars(mode) {
  if (!mode) return {};
  return tokensToCSSVars(mode === "light" ? coolLight : coolDark);
}

// src/components/FlowchartView/_internal/useChartAutoRefit.ts
import { useEffect as useEffect3, useRef } from "react";
import { useReactFlow, useStoreApi } from "@xyflow/react";

// src/_internal/useIsomorphicLayoutEffect.ts
import { useEffect as useEffect2, useLayoutEffect } from "react";
var useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect2 : useLayoutEffect;

// src/components/FlowchartView/_internal/chartFitGeometry.ts
import { getViewportForBounds } from "@xyflow/react";
var positiveFinite = (value) => typeof value === "number" && Number.isFinite(value) && value > 0;
function measuredChartBounds(nodes) {
  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  for (const node of nodes.values()) {
    if (node.hidden) continue;
    const width2 = node.measured?.width;
    const height2 = node.measured?.height;
    const { x, y } = node.internals.positionAbsolute;
    if (!positiveFinite(width2) || !positiveFinite(height2) || !Number.isFinite(x) || !Number.isFinite(y)) {
      return null;
    }
    left = Math.min(left, x);
    top = Math.min(top, y);
    right = Math.max(right, x + width2);
    bottom = Math.max(bottom, y + height2);
  }
  const width = right - left;
  const height = bottom - top;
  if (!Number.isFinite(left) || !Number.isFinite(top) || !positiveFinite(width) || !positiveFinite(height)) return null;
  return { x: left, y: top, width, height };
}
function chartFitViewport(state, padding2) {
  if (!positiveFinite(state.width) || !positiveFinite(state.height) || !positiveFinite(state.minZoom) || !positiveFinite(state.maxZoom) || state.maxZoom < state.minZoom || !Number.isFinite(padding2) || padding2 < 0) return null;
  let bounds = measuredChartBounds(state.nodeLookup);
  if (!bounds) return null;
  if (state.visualBounds) {
    const extra = state.visualBounds;
    if (![extra.x, extra.y, extra.width, extra.height].every(Number.isFinite) || !positiveFinite(extra.width) || !positiveFinite(extra.height)) return null;
    const x = Math.min(bounds.x, extra.x), y = Math.min(bounds.y, extra.y);
    bounds = { x, y, width: Math.max(bounds.x + bounds.width, extra.x + extra.width) - x, height: Math.max(bounds.y + bounds.height, extra.y + extra.height) - y };
    if (![bounds.x, bounds.y, bounds.width, bounds.height].every(Number.isFinite)) return null;
  }
  const viewport = getViewportForBounds(bounds, state.width, state.height, state.minZoom, state.maxZoom, padding2);
  return Number.isFinite(viewport.x) && Number.isFinite(viewport.y) && positiveFinite(viewport.zoom) ? viewport : null;
}
function chartMeasurementKey(state) {
  return JSON.stringify([
    state.width,
    state.height,
    state.minZoom,
    state.maxZoom,
    measuredChartBounds(state.nodeLookup) !== null,
    Array.from(state.nodeLookup, ([id, node]) => node.hidden ? [id, "hidden"] : [id, node.measured?.width, node.measured?.height])
  ]);
}
function chartLayoutKey(nodes) {
  return JSON.stringify(nodes.map((node) => [
    node.id,
    node.parentId,
    node.hidden,
    node.position.x,
    node.position.y,
    node.origin,
    node.width,
    node.height
  ]));
}
function chartTopologyKey(nodes) {
  return JSON.stringify(nodes.map((node) => [node.id, node.parentId, node.hidden]));
}

// src/components/FlowchartView/_internal/useChartAutoRefit.ts
function hasVisibleArea(element) {
  if (!element) return false;
  const { width, height } = element.getBoundingClientRect();
  return positiveFinite(width) && positiveFinite(height);
}
function useChartAutoRefit({ wrapperRef, padding: padding2 = 0.1, refitKey, layoutKey, focusNodeIds, focusRequestKey, maxAutoZoom, visualBounds }) {
  const store = useStoreApi();
  const { setViewport } = useReactFlow();
  const requestLayoutFit = useRef(null);
  const visualBoundsKey = JSON.stringify(visualBounds);
  const committedVisualBounds = useRef(visualBounds);
  useIsomorphicLayoutEffect(() => {
    committedVisualBounds.current = visualBounds;
  }, [visualBoundsKey]);
  useEffect3(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    let disposed = false;
    let frame = null;
    let pane = null;
    let measurementKey = chartMeasurementKey(store.getState());
    let panZoom = store.getState().panZoom;
    let lastTransform = [...store.getState().transform];
    let autoOwned = true;
    let pendingFit = true;
    let applyingFit = false;
    let lastSuccessfulViewport = null;
    const desiredViewport = (state) => {
      let nodeLookup = state.nodeLookup;
      if (focusNodeIds?.length) {
        const selected = /* @__PURE__ */ new Map();
        for (const id of focusNodeIds) {
          const node = nodeLookup.get(id);
          if (!node || node.hidden) return null;
          selected.set(id, node);
        }
        nodeLookup = selected;
      }
      return chartFitViewport({ ...state, nodeLookup, visualBounds: committedVisualBounds.current, maxZoom: maxAutoZoom === void 0 ? state.maxZoom : Math.min(state.maxZoom, maxAutoZoom) }, padding2);
    };
    const readContainerKey = () => {
      const state = store.getState();
      const outer = wrapper.getBoundingClientRect();
      const inner = state.domNode?.getBoundingClientRect();
      return JSON.stringify([outer.width, outer.height, inner?.width, inner?.height, state.width, state.height]);
    };
    let containerKey = readContainerKey();
    const cancelFrame = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
    };
    const requestFit = () => {
      if (disposed || !pendingFit) return;
      cancelFrame();
      frame = requestAnimationFrame(() => {
        frame = null;
        if (disposed || !pendingFit) return;
        const state = store.getState();
        if (!state.panZoom || !hasVisibleArea(wrapper) || !hasVisibleArea(state.domNode)) return;
        const viewport = desiredViewport(state);
        if (!viewport) return;
        pendingFit = false;
        lastSuccessfulViewport = JSON.stringify(viewport);
        applyingFit = true;
        try {
          void setViewport(viewport, { duration: 0 });
        } finally {
          applyingFit = false;
        }
      });
    };
    const requestIntent = () => {
      autoOwned = true;
      pendingFit = true;
      requestFit();
    };
    const checkContainer = () => {
      const nextKey = readContainerKey();
      if (nextKey === containerKey) {
        requestFit();
        return;
      }
      containerKey = nextKey;
      requestIntent();
    };
    requestLayoutFit.current = () => {
      if (!autoOwned) return;
      pendingFit = true;
      requestFit();
    };
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(checkContainer);
    observer?.observe(wrapper);
    const observePane = () => {
      const current = store.getState().domNode;
      if (current === pane) return false;
      if (pane && pane !== wrapper) observer?.unobserve(pane);
      pane = current;
      if (pane && pane !== wrapper) observer?.observe(pane);
      return true;
    };
    observePane();
    const unsubscribe = store.subscribe((state) => {
      const cameraChanged = state.transform.some((value, index) => value !== lastTransform[index]);
      lastTransform = [...state.transform];
      if (cameraChanged && !applyingFit) {
        autoOwned = false;
        pendingFit = false;
        cancelFrame();
      }
      const paneChanged = observePane();
      const nextKey = chartMeasurementKey(state);
      const measurementsChanged = nextKey !== measurementKey;
      const viewportChanged = state.panZoom !== panZoom;
      measurementKey = nextKey;
      panZoom = state.panZoom;
      if (paneChanged || viewportChanged) requestIntent();
      if (measurementsChanged) {
        checkContainer();
        const viewport = desiredViewport(state);
        if (autoOwned && viewport && JSON.stringify(viewport) !== lastSuccessfulViewport) pendingFit = true;
        requestFit();
      }
    });
    window.addEventListener("resize", checkContainer);
    requestFit();
    return () => {
      disposed = true;
      unsubscribe();
      observer?.disconnect();
      requestLayoutFit.current = null;
      window.removeEventListener("resize", checkContainer);
      cancelFrame();
    };
  }, [store, setViewport, wrapperRef, padding2, refitKey, focusNodeIds, focusRequestKey, maxAutoZoom]);
  useEffect3(() => {
    requestLayoutFit.current?.();
  }, [layoutKey]);
  useEffect3(() => {
    requestLayoutFit.current?.();
  }, [visualBoundsKey]);
}
function ChartAutoRefit(props) {
  useChartAutoRefit(props);
  return null;
}

// src/components/GroupedFlowDiagram/DiagramNodes.tsx
import { useId } from "react";
import { Handle as Handle2, Position as Position2 } from "@xyflow/react";

// src/components/GroupContainerNode/GroupContainerNode.tsx
import { Handle, Position } from "@xyflow/react";
import { jsx as jsx2, jsxs } from "react/jsx-runtime";
function GroupContainerNode({ data }) {
  const d = data;
  const expandable = d.headerMode === "expandable";
  const borderColor = d.error ? theme.error : expandable && d.highlighted ? theme.tracing : d.active ? theme.primary : d.done ? theme.nodeVisited : theme.border;
  return /* @__PURE__ */ jsxs(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        border: `1.5px ${d.active || d.done || d.error ? "solid" : "dashed"} ${borderColor}`,
        borderRadius: 12,
        // Translucent (theme-derived) so the dotted background + nested children
        // read clearly, while still following dark/light.
        background: `color-mix(in srgb, ${theme.textMuted} 7%, transparent)`,
        opacity: d.dimmed ? 0.4 : 1,
        position: "relative"
      },
      children: [
        /* @__PURE__ */ jsxs(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 12px",
              fontSize: expandable && d.compactHeader ? 14 : 12,
              fontWeight: 600,
              color: theme.textMuted,
              letterSpacing: 0.2
            },
            children: [
              (expandable ? d.iconContent : void 0) ?? (d.icon ? /* @__PURE__ */ jsx2("span", { "aria-hidden": true, children: d.icon }) : null),
              /* @__PURE__ */ jsx2("span", { title: d.label, style: expandable && d.compactHeader ? { minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } : void 0, children: d.label }),
              expandable && d.headerAction ? /* @__PURE__ */ jsx2("span", { style: { marginLeft: "auto", flexShrink: 0 }, children: d.headerAction }) : null
            ]
          }
        ),
        expandable && d.statusLabel ? /* @__PURE__ */ jsx2("div", { id: d.statusLabelId, title: d.statusLabel, style: { padding: "0 12px", fontSize: 11, color: theme.textSecondary, ...d.compactHeader ? { maxHeight: 32, lineHeight: "16px", overflow: "hidden" } : {} }, children: d.statusLabel }) : null,
        /* @__PURE__ */ jsx2(Handle, { type: "target", position: expandable && d.handleDirection === "LR" ? Position.Left : Position.Top, style: { opacity: 0 } }),
        /* @__PURE__ */ jsx2(Handle, { type: "source", position: expandable && d.handleDirection === "LR" ? Position.Right : Position.Bottom, style: { opacity: 0 } })
      ]
    }
  );
}

// src/components/GroupedFlowDiagram/icons.tsx
import { jsx as jsx3 } from "react/jsx-runtime";
var paths = {
  cart: "M3 4h3l3 14h13l4-10H7 M10 24h.1 M22 24h.1",
  card: "M4 7h24v18H4z M4 12h24 M8 20h6",
  payment: "M16 3v26 M22 9c-2-4-13-3-12 3 1 5 13 2 13 8 0 6-12 7-15 2",
  shipping: "M3 8h16v15H3z M19 13h6l4 6v4H19 M8 26h.1 M24 26h.1",
  label: "M3 8h18l8 8-8 8H3z M8 12v8 M11 12v8 M15 12v8 M18 12v8",
  lock: "M7 14h18v15H7z M11 14V8c0-8 10-8 10 0v6",
  alert: "M16 3 30 28H2z M16 11v8 M16 23h.1",
  flow: "M4 4h9v8H4z M20 20h9v8h-9z M8 12v12h12 M20 4h9v8h-9z M13 8h7",
  step: "M5 5h22v22H5z M10 16l4 4 8-9"
};
function DiagramIcon({ icon, style }) {
  const path = icon && Object.prototype.hasOwnProperty.call(paths, icon) ? paths[icon] : void 0;
  if (!path && icon && /\p{Extended_Pictographic}/u.test(icon)) {
    return /* @__PURE__ */ jsx3("span", { "aria-hidden": "true", style: { fontSize: 28, lineHeight: 1, ...style }, children: icon });
  }
  return /* @__PURE__ */ jsx3("svg", { "aria-hidden": "true", width: "30", height: "30", viewBox: "0 0 32 32", fill: "none", stroke: "currentColor", strokeWidth: "2.3", strokeLinecap: "round", strokeLinejoin: "round", style, children: /* @__PURE__ */ jsx3("path", { d: path ?? paths.step }) });
}

// src/components/GroupedFlowDiagram/DiagramNodes.tsx
import { Fragment, jsx as jsx4, jsxs as jsxs2 } from "react/jsx-runtime";
var statusText = { unknown: "Status unknown", running: "Running", completed: "Completed", failed: "Failed", "not-run": "Not run (recorded)" };
var smallButton = { font: "inherit", border: `1px solid ${theme.border}`, borderRadius: 8, padding: "5px 10px", background: theme.bgElevated, color: theme.textPrimary, cursor: "pointer" };
function DependencyHandles({ ports = [] }) {
  return /* @__PURE__ */ jsx4(Fragment, { children: ports.map((port) => /* @__PURE__ */ jsx4(
    Handle2,
    {
      id: port.id,
      type: port.type,
      "data-recorded-port": port.id,
      position: { left: Position2.Left, right: Position2.Right, top: Position2.Top, bottom: Position2.Bottom }[port.side],
      isConnectable: false,
      style: { opacity: 0, pointerEvents: "none", ...port.side === "top" || port.side === "bottom" ? { left: port.offset } : { top: port.offset } }
    },
    port.id
  )) });
}
function CauseBadge({ item }) {
  if (!item.isRootCause && !item.containsRootCause) return null;
  return /* @__PURE__ */ jsx4("span", { style: {
    position: "absolute",
    zIndex: 2,
    top: -12,
    left: 10,
    padding: "4px 9px",
    borderRadius: 7,
    fontSize: 11,
    lineHeight: "16px",
    fontWeight: 700,
    color: item.isRootCause ? theme.bg : theme.textSecondary,
    background: item.isRootCause ? theme.textPrimary : theme.bgElevated,
    border: `1px solid ${theme.tracing}`,
    pointerEvents: "none"
  }, children: item.isRootCause ? "Supported cause" : "Cause inside" });
}
function DiagramGroupNode(props) {
  const d = props.data, item = d.item;
  const statusId = useId();
  const action2 = /* @__PURE__ */ jsx4(
    "button",
    {
      type: "button",
      className: "nodrag nopan",
      style: smallButton,
      disabled: !d.canToggle,
      "aria-label": `Collapse ${item.node.label}${d.caption ? ` \xB7 ${d.caption}` : ""}`,
      "aria-expanded": "true",
      "aria-describedby": statusId,
      onClick: (event) => {
        event.stopPropagation();
        d.onToggle(item.node.id);
      },
      children: "Collapse"
    }
  );
  const text3 = [d.caption, statusText[item.state], item.recordedIssueCount ? `${item.recordedIssueCount} recorded issue${item.recordedIssueCount === 1 ? "" : "s"} inside` : "", item.containsSelection ? "Selection inside" : ""].filter(Boolean).join(" \xB7 ");
  return /* @__PURE__ */ jsxs2("div", { "data-node-id": item.node.id, "data-state": item.state, "data-highlighted": item.highlighted, "data-selected": d.selected, "data-expanded": "true", style: { position: "relative", width: "100%", height: "100%" }, children: [
    /* @__PURE__ */ jsx4(GroupContainerNode, { ...props, data: {
      label: item.node.label,
      headerMode: "expandable",
      iconContent: /* @__PURE__ */ jsx4(DiagramIcon, { icon: item.node.icon ?? "flow", style: { width: 22, height: 22, color: theme.nodeMain } }),
      headerAction: action2,
      statusLabel: text3,
      statusLabelId: statusId,
      handleDirection: d.direction,
      highlighted: item.highlighted,
      compactHeader: true,
      error: item.state === "failed",
      done: item.state === "completed",
      active: item.state === "running"
    } }),
    /* @__PURE__ */ jsx4(DependencyHandles, { ports: d.recordedPorts }),
    /* @__PURE__ */ jsx4(CauseBadge, { item })
  ] });
}
function DiagramItemNode({ data: d }) {
  const item = d.item, node = item.node, group = node.kind === "group", decision = node.kind === "decision";
  const statusId = useId();
  const border = item.state === "failed" ? theme.error : item.highlighted ? theme.tracing : group ? theme.nodeMain : theme.border;
  const caption = d.caption ? ` \xB7 ${d.caption}` : "";
  const action2 = group ? `Expand ${node.label}${caption}` : `Select ${node.label}${caption}`;
  return /* @__PURE__ */ jsxs2(
    "div",
    {
      "data-node-id": node.id,
      "data-state": item.state,
      "data-highlighted": item.highlighted,
      "data-selected": d.selected,
      style: {
        position: "relative",
        width: item.width,
        height: item.height,
        color: theme.textPrimary,
        filter: item.highlighted ? "drop-shadow(0 0 9px color-mix(in srgb, var(--fp-tracing, #0d9488) 25%, transparent))" : void 0
      },
      children: [
        /* @__PURE__ */ jsx4(Handle2, { type: "target", position: d.direction === "LR" ? Position2.Left : Position2.Top, isConnectable: false }),
        /* @__PURE__ */ jsxs2(
          "button",
          {
            type: "button",
            className: "nodrag nopan",
            "aria-label": action2,
            "aria-describedby": `${statusId}${decision ? ` ${statusId}-decision` : ""}`,
            "aria-expanded": group ? false : void 0,
            "aria-pressed": group ? void 0 : d.selected,
            disabled: group && (!item.childCount || !d.canToggle),
            title: node.description ? `${node.label}. ${node.description}` : node.label,
            onClick: (event) => {
              event.stopPropagation();
              group ? d.onToggle(node.id) : d.onSelect(node.id);
            },
            style: {
              position: "relative",
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              padding: "12px 18px",
              fontFamily: theme.fontSans,
              cursor: "pointer",
              color: "inherit",
              borderWidth: 2,
              borderStyle: group || item.state === "not-run" ? "dashed" : "solid",
              borderColor: border,
              borderRadius: 16,
              background: theme.bgElevated,
              boxShadow: "0 7px 20px rgba(0, 0, 0, 0.03137255)",
              outline: d.selected ? `3px solid ${theme.tracing}` : void 0,
              outlineOffset: 4
            },
            children: [
              /* @__PURE__ */ jsx4(DiagramIcon, { icon: node.icon ?? (group ? "flow" : "step"), style: { color: item.state === "not-run" ? theme.textMuted : theme.warning } }),
              decision && /* @__PURE__ */ jsxs2("span", { id: `${statusId}-decision`, style: { fontSize: 10, lineHeight: "12px", color: theme.textSecondary }, children: [
                /* @__PURE__ */ jsx4("span", { "aria-hidden": "true", children: "\u25C7 " }),
                "Decision"
              ] }),
              /* @__PURE__ */ jsx4("strong", { style: { fontSize: 18, lineHeight: 1.2, maxWidth: "100%", maxHeight: group ? 22 : 44, overflow: "hidden", overflowWrap: "anywhere", ...group ? { whiteSpace: "nowrap", textOverflow: "ellipsis" } : {} }, children: node.label }),
              d.caption && /* @__PURE__ */ jsx4("span", { style: { fontSize: 10, color: theme.textSecondary }, children: d.caption }),
              /* @__PURE__ */ jsxs2("span", { id: statusId, style: { fontSize: group ? 11 : 12, color: item.state === "failed" ? theme.error : theme.textSecondary }, children: [
                statusText[item.state],
                group ? ` \xB7 ${item.childCount ? `${item.childCount} items inside` : "Step information unavailable"}` : ""
              ] }),
              group && (item.recordedIssueCount > 0 || item.containsSelection) && /* @__PURE__ */ jsxs2("span", { style: { display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 6px", fontSize: 10 }, children: [
                item.recordedIssueCount > 0 && /* @__PURE__ */ jsxs2("span", { style: { color: theme.error }, children: [
                  item.recordedIssueCount,
                  " recorded issue",
                  item.recordedIssueCount === 1 ? "" : "s",
                  " inside"
                ] }),
                item.containsSelection && /* @__PURE__ */ jsx4("span", { style: { color: theme.tracing }, children: "Selection inside" })
              ] })
            ]
          }
        ),
        item.state === "completed" && /* @__PURE__ */ jsx4("span", { "aria-hidden": "true", style: { position: "absolute", top: -9, right: -9, width: 26, height: 26, borderRadius: "50%", background: theme.success, color: "white", textAlign: "center", fontSize: 19 }, children: "\u2713" }),
        item.state === "failed" && /* @__PURE__ */ jsx4("span", { "aria-hidden": "true", style: { position: "absolute", top: -9, right: -9, width: 26, height: 26, borderRadius: "50%", background: theme.error, color: "white", textAlign: "center", fontSize: 20 }, children: "\xD7" }),
        /* @__PURE__ */ jsx4(Handle2, { type: "source", position: d.direction === "LR" ? Position2.Right : Position2.Bottom, isConnectable: false }),
        /* @__PURE__ */ jsx4(DependencyHandles, { ports: d.recordedPorts }),
        /* @__PURE__ */ jsx4(CauseBadge, { item })
      ]
    }
  );
}
var diagramNodeTypes = { flowDiagramItem: DiagramItemNode, flowDiagramGroup: DiagramGroupNode };

// src/components/GroupedFlowDiagram/layout.ts
import dagre from "dagre";
var MAX_NODES = 512;
var MAX_EDGES = 1024;
var MAX_GROUP_DEPTH = 16;
var PADDING = 24;
var HEADER_HEIGHT = 72;
var CANVAS_PADDING = 24;
var STEP_WIDTH = 180;
var STEP_HEIGHT = 148;
var DECISION_HEIGHT = 172;
var GROUP_MIN_WIDTH = 220;
var GROUP_MIN_HEIGHT = 168;
var ERROR = {
  definition: "Provide a diagram with plain data objects and bounded node and edge arrays.",
  nodes: "Provide up to 512 nodes with unique IDs, short labels, and valid node details.",
  edges: "Provide up to 1024 edges with unique IDs, short labels, and existing node endpoints.",
  hierarchy: "Use existing groups as parents, remove parent cycles, and limit nesting to 16 groups.",
  options: "Provide plain diagram options with a supported direction and bounded ID lists.",
  expansion: "Expand only group IDs declared in this diagram.",
  selection: "Select a node ID declared in this diagram.",
  observation: "Provide valid recorded states only for node and edge IDs declared in this diagram.",
  contradiction: "Resolve conflicting recorded states: an observed connection cannot touch a step marked not run, and a group marked not run cannot contain recorded activity.",
  highlight: "Highlight only declared node and edge IDs; a cause marker must reference an item not recorded as not run.",
  layout: "Simplify the diagram structure and try arranging it again."
};
var admissionMessages = /* @__PURE__ */ new WeakMap();
var AdmissionError = class extends Error {
  constructor(message) {
    super(message);
    admissionMessages.set(this, message);
  }
};
function record(value, message) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new AdmissionError(message);
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) throw new AdmissionError(message);
  return value;
}
function field(object, key, message) {
  const descriptor = Object.getOwnPropertyDescriptor(object, key);
  if (!descriptor) return void 0;
  if (!("value" in descriptor)) throw new AdmissionError(message);
  return descriptor.value;
}
function array(value, limit, message) {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) throw new AdmissionError(message);
  const length = field(value, "length", message);
  if (typeof length !== "number" || !Number.isInteger(length) || length > limit) throw new AdmissionError(message);
  const result = [];
  for (let i = 0; i < length; i++) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(i));
    if (!descriptor || !("value" in descriptor)) throw new AdmissionError(message);
    result.push(descriptor.value);
  }
  return result;
}
function text(value, limit, message, allowEmpty = false) {
  if (typeof value !== "string" || value.length > limit || !allowEmpty && !value.trim() || /[\u0000-\u001f\u007f]/.test(value)) {
    throw new AdmissionError(message);
  }
  return value;
}
function optionalText(value, limit, message) {
  return value === void 0 ? void 0 : text(value, limit, message, true);
}
function admitDefinition(input) {
  const source = record(input, ERROR.definition);
  const nodeValues = array(field(source, "nodes", ERROR.definition), MAX_NODES, ERROR.nodes);
  const edgeValues = array(field(source, "edges", ERROR.definition), MAX_EDGES, ERROR.edges);
  const byId = /* @__PURE__ */ new Map();
  const nodes = nodeValues.map((value) => {
    const item = record(value, ERROR.nodes);
    const id = text(field(item, "id", ERROR.nodes), 256, ERROR.nodes);
    const label = text(field(item, "label", ERROR.nodes), 160, ERROR.nodes);
    const kindValue = field(item, "kind", ERROR.nodes);
    if (kindValue !== void 0 && kindValue !== "step" && kindValue !== "decision" && kindValue !== "group") throw new AdmissionError(ERROR.nodes);
    const parentValue = field(item, "parentId", ERROR.nodes);
    const parentId = parentValue === void 0 ? void 0 : text(parentValue, 256, ERROR.nodes);
    const description = optionalText(field(item, "description", ERROR.nodes), 320, ERROR.nodes);
    const icon = optionalText(field(item, "icon", ERROR.nodes), 32, ERROR.nodes);
    if (icon !== void 0 && (!icon.length || /[<>&/\\:\s]/u.test(icon))) throw new AdmissionError(ERROR.nodes);
    if (byId.has(id)) throw new AdmissionError(ERROR.nodes);
    const node = {
      id,
      label,
      kind: kindValue ?? "step",
      ...parentId !== void 0 ? { parentId } : {},
      ...description !== void 0 ? { description } : {},
      ...icon !== void 0 ? { icon } : {}
    };
    byId.set(id, node);
    return node;
  });
  const edgeIds = /* @__PURE__ */ new Set();
  const edges = edgeValues.map((value) => {
    const item = record(value, ERROR.edges);
    const id = text(field(item, "id", ERROR.edges), 256, ERROR.edges);
    const sourceId = text(field(item, "source", ERROR.edges), 256, ERROR.edges);
    const target = text(field(item, "target", ERROR.edges), 256, ERROR.edges);
    const label = optionalText(field(item, "label", ERROR.edges), 160, ERROR.edges);
    if (edgeIds.has(id) || !byId.has(sourceId) || !byId.has(target)) throw new AdmissionError(ERROR.edges);
    edgeIds.add(id);
    return { id, source: sourceId, target, ...label !== void 0 ? { label } : {} };
  });
  const ancestors = /* @__PURE__ */ new Map();
  const children = /* @__PURE__ */ new Map();
  for (const node of nodes) {
    const path = [];
    const visited = /* @__PURE__ */ new Set([node.id]);
    let parentId = node.parentId;
    while (parentId !== void 0) {
      const parent = byId.get(parentId);
      if (!parent || parent.kind !== "group" || visited.has(parentId)) throw new AdmissionError(ERROR.hierarchy);
      visited.add(parentId);
      path.unshift(parentId);
      if (path.length + (node.kind === "group" ? 1 : 0) > MAX_GROUP_DEPTH) throw new AdmissionError(ERROR.hierarchy);
      parentId = parent.parentId;
    }
    ancestors.set(node.id, path);
    const siblings = children.get(node.parentId) ?? [];
    siblings.push(node);
    children.set(node.parentId, siblings);
  }
  return { nodes, edges, byId, edgeIds, ancestors, children };
}
function idList(value, limit, message) {
  return value === void 0 ? [] : array(value, limit, message).map((item) => text(item, 256, message));
}
function stateMap(value, ids, limit, states) {
  const result = /* @__PURE__ */ new Map();
  if (value === void 0) return result;
  const object = record(value, ERROR.observation);
  const keys = Object.getOwnPropertyNames(object);
  if (keys.length > limit || Object.getOwnPropertySymbols(object).length) throw new AdmissionError(ERROR.observation);
  for (const key of keys) {
    const state = field(object, key, ERROR.observation);
    if (!ids.has(key) || typeof state !== "string" || !states.includes(state)) throw new AdmissionError(ERROR.observation);
    result.set(key, state);
  }
  return result;
}
function admitOptions(value, definition) {
  const object = value === void 0 ? {} : record(value, ERROR.options);
  const directionValue = field(object, "direction", ERROR.options);
  const direction = directionValue === void 0 ? "LR" : directionValue;
  if (direction !== "LR" && direction !== "TB") throw new AdmissionError(ERROR.options);
  const expanded = new Set(idList(field(object, "expandedGroupIds", ERROR.options), MAX_NODES, ERROR.options));
  for (const id of expanded) if (definition.byId.get(id)?.kind !== "group") throw new AdmissionError(ERROR.expansion);
  const selected = field(object, "selectedNodeId", ERROR.options);
  const selectedNodeId = selected === void 0 ? void 0 : text(selected, 256, ERROR.selection);
  if (selectedNodeId !== void 0 && !definition.byId.has(selectedNodeId)) throw new AdmissionError(ERROR.selection);
  const observationValue = field(object, "observation", ERROR.options);
  const observation = observationValue === void 0 ? {} : record(observationValue, ERROR.observation);
  const nodeStates = stateMap(field(observation, "nodeStates", ERROR.observation), definition.byId, MAX_NODES, ["unknown", "running", "completed", "failed", "not-run"]);
  const edgeStates = stateMap(field(observation, "edgeStates", ERROR.observation), definition.edgeIds, MAX_EDGES, ["unknown", "observed", "not-taken"]);
  const notRunAtOrAbove = (id) => nodeStates.get(id) === "not-run" || definition.ancestors.get(id).some((parent) => nodeStates.get(parent) === "not-run");
  for (const edge of definition.edges) {
    if (edgeStates.get(edge.id) === "observed" && (notRunAtOrAbove(edge.source) || notRunAtOrAbove(edge.target))) {
      throw new AdmissionError(ERROR.contradiction);
    }
  }
  for (const node of definition.nodes) {
    const state = nodeStates.get(node.id);
    if (state === "running" || state === "completed" || state === "failed") {
      if (definition.ancestors.get(node.id).some((id) => nodeStates.get(id) === "not-run")) throw new AdmissionError(ERROR.contradiction);
    }
  }
  const highlightValue = field(object, "highlight", ERROR.options);
  const highlight = highlightValue === void 0 ? {} : record(highlightValue, ERROR.highlight);
  const highlightedNodes = new Set(idList(field(highlight, "nodeIds", ERROR.highlight), MAX_NODES, ERROR.highlight));
  const highlightedEdges = new Set(idList(field(highlight, "edgeIds", ERROR.highlight), MAX_EDGES, ERROR.highlight));
  for (const id of highlightedNodes) if (!definition.byId.has(id)) throw new AdmissionError(ERROR.highlight);
  for (const id of highlightedEdges) if (!definition.edgeIds.has(id)) throw new AdmissionError(ERROR.highlight);
  const root = field(highlight, "rootCauseId", ERROR.highlight);
  const rootCauseId = root === void 0 ? void 0 : text(root, 256, ERROR.highlight);
  if (rootCauseId !== void 0 && (!definition.byId.has(rootCauseId) || notRunAtOrAbove(rootCauseId))) throw new AdmissionError(ERROR.highlight);
  for (const id of [...highlightedNodes]) for (const parent of definition.ancestors.get(id)) highlightedNodes.add(parent);
  for (const edge of definition.edges) {
    if (!highlightedEdges.has(edge.id)) continue;
    for (const id of [edge.source, edge.target]) {
      if (definition.byId.get(id).kind === "group") highlightedNodes.add(id);
      for (const parent of definition.ancestors.get(id)) highlightedNodes.add(parent);
    }
  }
  return { expanded, direction, selectedNodeId, nodeStates, edgeStates, highlightedNodes, highlightedEdges, rootCauseId };
}
function getFlowDiagramAncestors(definition, nodeId) {
  try {
    const admitted = admitDefinition(definition);
    return typeof nodeId === "string" ? [...admitted.ancestors.get(nodeId) ?? []] : [];
  } catch {
    return [];
  }
}
function projectGroupedFlowDiagram(definition, options) {
  try {
    const data = admitDefinition(definition);
    const config = admitOptions(options, data);
    const representative = (id) => data.ancestors.get(id).find((parent) => !config.expanded.has(parent)) ?? id;
    const edges = [];
    for (const edge of data.edges) {
      const source = representative(edge.source);
      const target = representative(edge.target);
      const collapsed = source !== edge.source || target !== edge.target;
      if (collapsed && source === target) continue;
      edges.push({ edge, source, target, collapsed, state: config.edgeStates.get(edge.id) ?? "unknown", highlighted: config.highlightedEdges.has(edge.id) });
    }
    const positions = /* @__PURE__ */ new Map();
    const sizes = /* @__PURE__ */ new Map();
    const childAtLevel = (id, parentId) => {
      const path = data.ancestors.get(id);
      if (parentId === void 0) return path[0] ?? id;
      const parentIndex = path.indexOf(parentId);
      return parentIndex < 0 ? void 0 : path[parentIndex + 1] ?? id;
    };
    const arrangeChildren = (parentId) => {
      const children = data.children.get(parentId) ?? [];
      if (!children.length) return { width: 0, height: 0 };
      const graph = new dagre.graphlib.Graph({ multigraph: true });
      graph.setGraph({ rankdir: config.direction, ranksep: 40, nodesep: 44, edgesep: 20, ranker: "longest-path" });
      graph.setDefaultEdgeLabel(() => ({}));
      const internalIds = /* @__PURE__ */ new Map();
      children.forEach((child, index) => {
        let size;
        if (child.kind === "group" && config.expanded.has(child.id)) {
          const contents = arrangeChildren(child.id);
          size = {
            width: Math.max(GROUP_MIN_WIDTH, contents.width + PADDING * 2),
            height: Math.max(GROUP_MIN_HEIGHT, contents.height + PADDING * 2 + HEADER_HEIGHT)
          };
        } else size = child.kind === "group" ? { width: GROUP_MIN_WIDTH, height: GROUP_MIN_HEIGHT } : { width: STEP_WIDTH, height: child.kind === "decision" ? DECISION_HEIGHT : STEP_HEIGHT };
        sizes.set(child.id, size);
        const internalId = `n${index}`;
        internalIds.set(child.id, internalId);
        graph.setNode(internalId, size);
      });
      edges.forEach((edge, index) => {
        const source = childAtLevel(edge.source, parentId);
        const target = childAtLevel(edge.target, parentId);
        if (source === void 0 || target === void 0 || source === target) return;
        const internalSource = internalIds.get(source);
        const internalTarget = internalIds.get(target);
        if (internalSource !== void 0 && internalTarget !== void 0) graph.setEdge(internalSource, internalTarget, {}, `e${index}`);
      });
      dagre.layout(graph);
      const raw = children.map((child) => {
        const placed = graph.node(internalIds.get(child.id));
        const size = sizes.get(child.id);
        if (!placed || !Number.isFinite(placed.x) || !Number.isFinite(placed.y)) throw new Error(ERROR.layout);
        return { child, size, x: placed.x - size.width / 2, y: placed.y - size.height / 2 };
      });
      const minX = Math.min(...raw.map((item) => item.x));
      const minY = Math.min(...raw.map((item) => item.y));
      const offsetX = parentId === void 0 ? CANVAS_PADDING : PADDING;
      const offsetY = parentId === void 0 ? CANVAS_PADDING : PADDING + HEADER_HEIGHT;
      let width = 0;
      let height = 0;
      for (const item of raw) {
        const x = item.x - minX;
        const y = item.y - minY;
        positions.set(item.child.id, { x: x + offsetX, y: y + offsetY });
        width = Math.max(width, x + item.size.width);
        height = Math.max(height, y + item.size.height);
      }
      return { width, height };
    };
    const canvas = arrangeChildren();
    const issueCounts = /* @__PURE__ */ new Map();
    for (const [id, state] of config.nodeStates) {
      if (state === "failed") for (const parent of data.ancestors.get(id)) issueCounts.set(parent, (issueCounts.get(parent) ?? 0) + 1);
    }
    const selectedAncestors = new Set(config.selectedNodeId ? data.ancestors.get(config.selectedNodeId) : []);
    const causeAncestors = new Set(config.rootCauseId ? data.ancestors.get(config.rootCauseId) : []);
    const nodes = [];
    const appendChildren = (parentId) => {
      for (const node of data.children.get(parentId) ?? []) {
        const expanded = node.kind === "group" && config.expanded.has(node.id);
        nodes.push({
          node,
          ...node.parentId !== void 0 ? { parentId: node.parentId } : {},
          position: positions.get(node.id),
          ...sizes.get(node.id),
          state: config.nodeStates.get(node.id) ?? "unknown",
          expanded,
          childCount: data.children.get(node.id)?.length ?? 0,
          recordedIssueCount: issueCounts.get(node.id) ?? 0,
          containsSelection: selectedAncestors.has(node.id),
          highlighted: config.highlightedNodes.has(node.id),
          ...config.rootCauseId !== void 0 ? { isRootCause: config.rootCauseId === node.id, containsRootCause: causeAncestors.has(node.id) } : {}
        });
        if (expanded) appendChildren(node.id);
      }
    };
    appendChildren();
    return {
      model: {
        definition: { nodes: data.nodes, edges: data.edges },
        nodeStates: Object.fromEntries(data.nodes.map((node) => [node.id, config.nodeStates.get(node.id) ?? "unknown"])),
        nodes,
        edges,
        direction: config.direction,
        width: canvas.width ? canvas.width + CANVAS_PADDING * 2 : 0,
        height: canvas.height ? canvas.height + CANVAS_PADDING * 2 : 0,
        expandedGroupIds: data.nodes.filter((node) => config.expanded.has(node.id)).map((node) => node.id)
      }
    };
  } catch (error) {
    const message = typeof error === "object" && error !== null ? admissionMessages.get(error) : void 0;
    return { error: message ?? ERROR.layout };
  }
}

// src/components/GroupedFlowDiagram/relationships.ts
function field2(value, key) {
  if (!value || typeof value !== "object") throw new Error();
  const item = Object.getOwnPropertyDescriptor(value, key);
  if (!item) return void 0;
  if (!("value" in item)) throw new Error();
  return item.value;
}
function plain(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) throw new Error();
}
function list(value, max) {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) throw new Error();
  const length = field2(value, "length");
  if (typeof length !== "number" || !Number.isInteger(length) || length < 0 || length > max) throw new Error();
  return Array.from({ length }, (_, index) => {
    const item = Object.getOwnPropertyDescriptor(value, String(index));
    if (!item || !("value" in item)) throw new Error();
    return item.value;
  });
}
function text2(value, max) {
  if (typeof value !== "string" || !value.trim() || value.length > max || /[\u0000-\u001f\u007f]/.test(value)) throw new Error();
  return value;
}
function projectRecordedRelationships(value, model) {
  try {
    if (!model.nodeStates) return void 0;
    const nodeStates = model.nodeStates;
    const nodes = new Map(model.definition.nodes.map((node) => [node.id, node]));
    const used = new Set(model.definition.edges.map((edge) => edge.id));
    const expanded = new Set(model.expandedGroupIds);
    const notRun = (id) => {
      let current = id;
      while (current !== void 0) {
        if (nodeStates[current] === "not-run") return true;
        current = nodes.get(current)?.parentId;
      }
      return false;
    };
    let remaining = 65536;
    const readText = (value2, maximum) => {
      const result = text2(value2, maximum);
      remaining -= result.length;
      if (remaining < 0) throw new Error();
      return result;
    };
    const representative = (id) => {
      const ancestors = [];
      let parent = nodes.get(id)?.parentId;
      while (parent !== void 0) {
        ancestors.unshift(parent);
        parent = nodes.get(parent)?.parentId;
      }
      return ancestors.find((ancestor) => !expanded.has(ancestor)) ?? id;
    };
    const admitted = list(value, 512).map((entry) => {
      plain(entry);
      const id = readText(field2(entry, "id"), 256), source = readText(field2(entry, "source"), 256), target = readText(field2(entry, "target"), 256);
      const kind = field2(entry, "kind"), attribution = field2(entry, "attribution"), direction = field2(entry, "direction");
      if (used.has(id) || !nodes.has(source) || !nodes.has(target) || notRun(source) || notRun(target) || kind !== "data" && kind !== "control" || !["per-write", "stage", "recorded-control", "recorded-read"].includes(attribution) || direction !== void 0 && direction !== "backward" && direction !== "forward") throw new Error();
      used.add(id);
      return {
        id,
        source,
        target,
        kind,
        attribution,
        evidence: list(field2(entry, "evidence"), 32).map((value2) => readText(value2, 2048)),
        ...direction !== void 0 ? { direction } : {}
      };
    });
    return admitted.flatMap((relationship) => {
      const source = representative(relationship.source), target = representative(relationship.target);
      const collapsed = source !== relationship.source || target !== relationship.target;
      return collapsed && source === target ? [] : [{ relationship, source, target, collapsed }];
    });
  } catch {
    return void 0;
  }
}
function admitFocusRequest(value, model) {
  try {
    plain(value);
    const known = new Set(model.definition.nodes.map((node) => node.id));
    const nodeIds = list(field2(value, "nodeIds"), 512).map((value2) => text2(value2, 256));
    if (nodeIds.some((id) => !known.has(id))) return void 0;
    return { key: field2(value, "key"), nodeIds: [...new Set(nodeIds)] };
  } catch {
    return void 0;
  }
}

// src/components/GroupedFlowDiagram/RecordedRelationshipEdge.tsx
import { BaseEdge, EdgeLabelRenderer } from "@xyflow/react";

// src/components/GroupedFlowDiagram/recordedRouting.ts
import { getSmoothStepPath, Position as Position3 } from "@xyflow/react";
var SIDE = { left: Position3.Left, right: Position3.Right, top: Position3.Top, bottom: Position3.Bottom };
var HALO = 16;
var STUB = 18;
var MAX_WORK = 2e6;
var MAX_VISITS = 1e5;
var intersects = (a, b) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
var point = (box2, side, offset) => ({
  x: side === "left" ? box2.x : side === "right" ? box2.x + box2.width : box2.x + (offset ?? box2.width / 2),
  y: side === "top" ? box2.y : side === "bottom" ? box2.y + box2.height : box2.y + (offset ?? box2.height / 2)
});
var escape = (p, side) => ({ x: p.x + (side === "left" ? -STUB : side === "right" ? STUB : 0), y: p.y + (side === "top" ? -STUB : side === "bottom" ? STUB : 0) });
var crossing = (a, b, box2) => a.x === b.x ? a.x > box2.x && a.x < box2.x + box2.width && Math.max(a.y, b.y) > box2.y && Math.min(a.y, b.y) < box2.y + box2.height : a.y > box2.y && a.y < box2.y + box2.height && Math.max(a.x, b.x) > box2.x && Math.min(a.x, b.x) < box2.x + box2.width;
var distance = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
var Queue = class {
  constructor() {
    this.items = [];
  }
  before(a, b) {
    return a.score < b.score || a.score === b.score && a.key < b.key;
  }
  push(value) {
    let at = this.items.length;
    this.items.push(value);
    while (at) {
      const parent = at - 1 >> 1;
      if (!this.before(value, this.items[parent])) break;
      this.items[at] = this.items[parent];
      at = parent;
    }
    this.items[at] = value;
  }
  pop() {
    const result = this.items[0], last = this.items.pop();
    if (!this.items.length || !last) return result;
    let at = 0;
    while (at * 2 + 1 < this.items.length) {
      let child = at * 2 + 1;
      if (child + 1 < this.items.length && this.before(this.items[child + 1], this.items[child])) child++;
      if (!this.before(this.items[child], last)) break;
      this.items[at] = this.items[child];
      at = child;
    }
    this.items[at] = last;
    return result;
  }
};
function routeRecordedRelationships(links, model) {
  const routes = /* @__PURE__ */ new Map(), decorations = /* @__PURE__ */ new Map();
  let work = 0, visits = 0;
  const outcome = () => ({ routes, decorations, undrawn: links.length - routes.size, work });
  if (model.nodes.length > 512 || model.edges.length > 1024 || links.length > 512) return outcome();
  const byId = new Map(model.nodes.map((item) => [item.node.id, item])), boxes = /* @__PURE__ */ new Map();
  const absolute = (item, depth = 0) => {
    if (depth > 16) throw new Error();
    const cached = boxes.get(item.node.id);
    if (cached) return cached;
    const parent = item.parentId ? byId.get(item.parentId) : void 0;
    if (item.parentId && !parent) throw new Error();
    const origin = parent ? absolute(parent, depth + 1) : { x: 0, y: 0 };
    const box2 = { x: item.position.x + origin.x, y: item.position.y + origin.y, width: item.width, height: item.height, owner: item.node.id };
    if (![box2.x, box2.y, box2.width, box2.height].every(Number.isFinite) || Math.max(Math.abs(box2.x), Math.abs(box2.y), box2.width, box2.height) > 1e6 || box2.width <= 0 || box2.height <= 0) throw new Error();
    boxes.set(item.node.id, box2);
    return box2;
  };
  try {
    for (const item of model.nodes) absolute(item);
  } catch {
    return outcome();
  }
  for (const item of model.nodes) if (item.isRootCause || item.containsRootCause) {
    const box2 = boxes.get(item.node.id);
    decorations.set(item.node.id, { x: box2.x, y: box2.y - 16, width: box2.width + 18, height: box2.height + 16 });
  }
  const obstacles = model.nodes.map((item) => {
    const box2 = boxes.get(item.node.id);
    return {
      x: box2.x - HALO,
      y: box2.y - (item.isRootCause || item.containsRootCause ? 28 : HALO),
      width: box2.width + HALO * 2,
      height: (item.expanded ? 72 : box2.height) + HALO + (item.isRootCause || item.containsRootCause ? 28 : HALO),
      owner: box2.owner
    };
  });
  for (const edge of model.edges) {
    if (!edge.edge.label) continue;
    const a = boxes.get(edge.source), b = boxes.get(edge.target);
    if (!a || !b) continue;
    const horizontal = model.direction === "LR", source = point(a, horizontal ? "right" : "bottom"), target = point(b, horizontal ? "left" : "top");
    const [, x, y] = getSmoothStepPath({
      sourceX: source.x,
      sourceY: source.y,
      targetX: target.x,
      targetY: target.y,
      sourcePosition: horizontal ? Position3.Right : Position3.Bottom,
      targetPosition: horizontal ? Position3.Left : Position3.Top
    });
    const width2 = Math.min(180, edge.edge.label.length * 8 + 24);
    obstacles.push({ x: x - width2 / 2, y: y - 20, width: width2, height: 40 });
  }
  const ordered = [...links].sort((a, b) => a.relationship.id < b.relationship.id ? -1 : a.relationship.id > b.relationship.id ? 1 : 0);
  const candidates = /* @__PURE__ */ new Map();
  const facingSources = /* @__PURE__ */ new Map();
  const slots = (id, side, type, remote, remotePort) => {
    const box2 = boxes.get(id), item = byId.get(id), length = side === "top" || side === "bottom" ? box2.width : box2.height;
    const count = Math.min(6, Math.floor((length - 56) / 24) + 1), offsets = Array.from({ length: Math.max(0, count) }, (_, index2) => 28 + (length - 56) * index2 / Math.max(1, count - 1)).filter((offset) => Math.abs(offset - length / 2) >= 20 && !(item.expanded && (side === "left" || side === "right") && offset < 96));
    const neighbour = side === "top" || side === "bottom" ? (remotePort?.x ?? remote.x + remote.width / 2) - box2.x : (remotePort?.y ?? remote.y + remote.height / 2) - box2.y;
    return offsets.sort((a, b) => Math.abs(a - neighbour) - Math.abs(b - neighbour) || (type === "source" ? a - b : b - a));
  };
  const xs = /* @__PURE__ */ new Set(), ys = /* @__PURE__ */ new Set();
  for (const box2 of obstacles) for (const offset of [-18, 0, 18]) {
    xs.add(box2.x + offset);
    xs.add(box2.x + box2.width + offset);
    ys.add(box2.y + offset);
    ys.add(box2.y + box2.height + offset);
  }
  for (const [ordinal, link] of ordered.entries()) {
    const a = boxes.get(link.source), b = boxes.get(link.target);
    if (!a || !b) continue;
    const backward = link.relationship.direction === "backward";
    const fallback = link.source === link.target ? [["bottom", "right"], ["right", "top"], ["left", "bottom"]] : model.direction === "LR" ? backward ? [["bottom", "bottom"], ["top", "top"], ["left", "right"]] : [["top", "top"], ["bottom", "bottom"], ["right", "left"]] : backward ? [["right", "right"], ["left", "left"], ["top", "bottom"]] : [["left", "left"], ["right", "right"], ["bottom", "top"]];
    const facing = link.source === link.target ? void 0 : model.direction === "LR" ? b.x + b.width + STUB * 2 <= a.x ? ["left", "right"] : a.x + a.width + STUB * 2 <= b.x ? ["right", "left"] : void 0 : b.y + b.height + STUB * 2 <= a.y ? ["top", "bottom"] : a.y + a.height + STUB * 2 <= b.y ? ["bottom", "top"] : void 0;
    if (facing) facingSources.set(link.relationship.id, facing[0]);
    const pairs = facing ? [facing, ...fallback.filter((pair) => pair[0] !== facing[0] || pair[1] !== facing[1])] : fallback;
    const options = pairs.filter(([sourceSide, targetSide]) => !(sourceSide === "top" && (byId.get(link.source)?.expanded || byId.get(link.source)?.isRootCause || byId.get(link.source)?.containsRootCause)) && !(targetSide === "top" && (byId.get(link.target)?.expanded || byId.get(link.target)?.isRootCause || byId.get(link.target)?.containsRootCause))).flatMap(([sourceSide, targetSide]) => slots(link.source, sourceSide, "source", b).flatMap((sourceOffset) => slots(link.target, targetSide, "target", a, point(a, sourceSide, sourceOffset)).map((targetOffset) => {
      const source = point(a, sourceSide, sourceOffset), target = point(b, targetSide, targetOffset), start = escape(source, sourceSide), end = escape(target, targetSide);
      for (const p of [start, end]) {
        xs.add(p.x);
        ys.add(p.y);
      }
      return {
        sourceSide,
        targetSide,
        source,
        target,
        start,
        end,
        sourcePort: { id: `recorded-${ordinal}-source`, type: "source", side: sourceSide, offset: sourceOffset },
        targetPort: { id: `recorded-${ordinal}-target`, type: "target", side: targetSide, offset: targetOffset }
      };
    })));
    candidates.set(link.relationship.id, options);
  }
  const fanGroups = /* @__PURE__ */ new Map(), fans = /* @__PURE__ */ new Map();
  for (const link of ordered) {
    const side = facingSources.get(link.relationship.id), relationship = link.relationship;
    if (!side || link.collapsed || link.source !== relationship.source || link.target !== relationship.target || !relationship.direction) continue;
    const key = JSON.stringify([relationship.source, relationship.direction, side, relationship.attribution === "stage"]);
    const group = fanGroups.get(key) ?? [];
    group.push(link);
    fanGroups.set(key, group);
  }
  for (const [key, group] of fanGroups) {
    if (group.length < 2 || new Set(group.map((link) => link.target)).size !== group.length) continue;
    const side = facingSources.get(group[0].relationship.id), box2 = boxes.get(group[0].source), length = side === "left" || side === "right" ? box2.height : box2.width;
    let common;
    for (const link of group) {
      const offsets = new Set((candidates.get(link.relationship.id) ?? []).filter((option) => option.sourceSide === side).map((option) => option.sourcePort.offset));
      common = common ? new Set([...common].filter((offset2) => offsets.has(offset2))) : offsets;
    }
    const offset = [...common].sort((a, b) => Math.abs(a - length / 2) - Math.abs(b - length / 2) || a - b)[0];
    if (offset !== void 0) for (const link of group) fans.set(link.relationship.id, { key, side, offset });
  }
  const columns = [...xs].sort((a, b) => a - b), rows = [...ys].sort((a, b) => a - b), width = columns.length;
  if (!width || !rows.length) return outcome();
  const position = (at) => ({ x: columns[at % width], y: rows[Math.floor(at / width)] });
  const index = (p) => rows.indexOf(p.y) * width + columns.indexOf(p.x);
  const occupied = /* @__PURE__ */ new Map(), occupiedVertices = /* @__PURE__ */ new Map(), checked = /* @__PURE__ */ new Map(), labels = [], usedPorts = /* @__PURE__ */ new Map();
  const portKey = (id, port) => JSON.stringify([id, port.side, port.offset]);
  const segmentKey = (a, b) => a < b ? `${a}:${b}` : `${b}:${a}`;
  const clear = (a, b, boxes2, ignore) => {
    for (const box2 of boxes2) {
      if (work >= MAX_WORK) return false;
      work++;
      if ((ignore === void 0 || box2.owner !== ignore) && crossing(a, b, box2)) return false;
    }
    return true;
  };
  const search = (start, end) => {
    const from = index(start), to = index(end);
    if (from === to) return void 0;
    const queue = new Queue(), costs = /* @__PURE__ */ new Map(), parents = /* @__PURE__ */ new Map();
    queue.push({ at: from, direction: 0, cost: 0, score: distance(start, end), key: from * 3 });
    costs.set(from * 3, 0);
    let local = 0, current;
    while ((current = queue.pop()) && ++local <= 12e3 && ++visits <= MAX_VISITS && work < MAX_WORK) {
      if (costs.get(current.key) !== current.cost) continue;
      if (current.at === to) {
        const points = [], segments = [];
        let key = current.key;
        while (key !== void 0) {
          const at = Math.floor(key / 3), previous = parents.get(key);
          points.push(position(at));
          if (previous !== void 0) segments.push(segmentKey(at, Math.floor(previous / 3)));
          key = previous;
        }
        return { points: points.reverse(), segments };
      }
      const x = current.at % width, y = Math.floor(current.at / width), a = position(current.at);
      for (const next of [x > 0 ? current.at - 1 : -1, x + 1 < width ? current.at + 1 : -1, y > 0 ? current.at - width : -1, y + 1 < rows.length ? current.at + width : -1]) {
        if (next < 0) continue;
        const b = position(next), edge = segmentKey(current.at, next);
        let free = checked.get(edge);
        if (free === void 0) {
          free = clear(a, b, obstacles);
          checked.set(edge, free);
        }
        if (!free || !clear(a, b, labels)) continue;
        const direction = a.y === b.y ? 1 : 2, cost = current.cost + distance(a, b) + (current.direction && current.direction !== direction ? 20 : 0) + (occupied.get(edge) ?? 0) * (100 + distance(a, b) * 4) + (occupiedVertices.get(next) ?? 0) * 500;
        const key = next * 3 + direction;
        if (cost >= (costs.get(key) ?? Infinity)) continue;
        costs.set(key, cost);
        parents.set(key, current.key);
        queue.push({ at: next, direction, cost, score: cost + distance(b, end), key });
      }
    }
    return void 0;
  };
  const labelFor = (points) => {
    const segments = points.slice(1).map((b, at) => ({ a: points[at], b, length: distance(points[at], b) })).sort((a, b) => b.length - a.length);
    for (const { a, b, length } of segments) {
      if (length < 28) continue;
      for (const fraction of [0.5, 0.25, 0.75, 0.125, 0.875]) for (const offset of [0, 20, -20, 38, -38]) {
        const horizontal = a.y === b.y, x = a.x + (b.x - a.x) * fraction + (horizontal ? 0 : offset), y = a.y + (b.y - a.y) * fraction + (horizontal ? offset : 0);
        const box2 = { x: x - 28, y: y - 15, width: 56, height: 30 };
        if ([...obstacles, ...labels].every((other) => {
          if (work >= MAX_WORK) return false;
          work++;
          return !intersects(box2, other);
        })) return { x, y, width: 48, height: 22, box: box2 };
      }
    }
    return void 0;
  };
  for (const link of ordered) {
    if (work >= MAX_WORK || visits > MAX_VISITS) break;
    const fan = fans.get(link.relationship.id), options = candidates.get(link.relationship.id) ?? [];
    const shared = (option) => fan !== void 0 && option.sourceSide === fan.side && option.sourcePort.offset === fan.offset;
    const preferred = fan ? [...options.filter(shared), ...options.filter((option) => !shared(option))] : options;
    for (const option of preferred) {
      const sourceKey = portKey(link.source, option.sourcePort), targetKey = portKey(link.target, option.targetPort);
      const sourceOwner = usedPorts.get(sourceKey);
      if (sourceOwner !== void 0 && (!shared(option) || sourceOwner !== fan?.key) || usedPorts.has(targetKey) || sourceKey === targetKey) continue;
      if (!clear(option.source, option.start, obstacles, link.source) || !clear(option.end, option.target, obstacles, link.target) || !clear(option.source, option.start, labels) || !clear(option.end, option.target, labels)) continue;
      const found = search(option.start, option.end);
      if (!found) continue;
      const corners = found.points.filter((p, at, all) => !at || at === all.length - 1 || all[at - 1].x === p.x !== (p.x === all[at + 1].x));
      const points = [option.source, ...corners, option.target], label = labelFor(points);
      if (!label) continue;
      labels.push(label.box);
      for (const segment of found.segments) occupied.set(segment, (occupied.get(segment) ?? 0) + 1);
      for (const p of found.points) {
        const at = index(p);
        occupiedVertices.set(at, (occupiedVertices.get(at) ?? 0) + 1);
      }
      usedPorts.set(sourceKey, shared(option) ? fan.key : "");
      usedPorts.set(targetKey, "");
      routes.set(link.relationship.id, {
        points,
        sourceSide: option.sourceSide,
        targetSide: option.targetSide,
        sourcePort: option.sourcePort,
        targetPort: option.targetPort,
        label: { x: label.x, y: label.y, width: label.width, height: label.height }
      });
      break;
    }
  }
  return outcome();
}
function recordedRoutePath(route, source, target) {
  const interior = route.points.slice(1, -1).map((p) => ({ ...p }));
  const normalize = (anchor, side, reverse) => {
    const axis = side === "left" || side === "right" ? "y" : "x", from = reverse ? interior.length - 1 : 0;
    const expected = route.points[from + 1][axis];
    if (Math.abs(expected - anchor[axis]) > 1e-3) return;
    for (let at = from; at >= 0 && at < interior.length && route.points[at + 1][axis] === expected; at += reverse ? -1 : 1) interior[at][axis] = anchor[axis];
  };
  normalize(source, route.sourceSide, false);
  normalize(target, route.targetSide, true);
  const start = interior[0], end = interior[interior.length - 1];
  const bridge = (p, actual, side) => side === "left" || side === "right" ? { x: p.x, y: actual.y } : { x: actual.x, y: p.y };
  const assembled = [source, bridge(start, source, route.sourceSide), ...interior, bridge(end, target, route.targetSide), target].filter((p, at, all) => !at || p.x !== all[at - 1].x || p.y !== all[at - 1].y);
  const points = [];
  for (const next of assembled) {
    while (points.length > 1) {
      const a = points[points.length - 2], middle = points[points.length - 1];
      const straight = a.x === middle.x && middle.x === next.x && middle.y >= Math.min(a.y, next.y) && middle.y <= Math.max(a.y, next.y) || a.y === middle.y && middle.y === next.y && middle.x >= Math.min(a.x, next.x) && middle.x <= Math.max(a.x, next.x);
      if (!straight) break;
      points.pop();
    }
    points.push(next);
  }
  let path = `M${source.x},${source.y}`;
  for (let at = 1; at < points.length - 1; at++) {
    const a = points[at - 1], p = points[at], b = points[at + 1];
    const radius = Math.min(16, distance(a, p) / 2, distance(p, b) / 2);
    const before = { x: p.x + Math.sign(a.x - p.x) * radius, y: p.y + Math.sign(a.y - p.y) * radius }, after = { x: p.x + Math.sign(b.x - p.x) * radius, y: p.y + Math.sign(b.y - p.y) * radius };
    path += ` L${before.x},${before.y} Q${p.x},${p.y} ${after.x},${after.y}`;
  }
  return `${path} L${target.x},${target.y}`;
}
function recordedVisualBounds(plan, links, focus) {
  const selected = focus?.length ? new Set(focus) : void 0;
  let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
  const include = (box2) => {
    left = Math.min(left, box2.x);
    top = Math.min(top, box2.y);
    right = Math.max(right, box2.x + box2.width);
    bottom = Math.max(bottom, box2.y + box2.height);
  };
  for (const [id, box2] of plan.decorations) if (!selected || selected.has(id)) include(box2);
  for (const link of links) {
    if (selected && (selected.size < 2 || !selected.has(link.source) || !selected.has(link.target))) continue;
    const route = plan.routes.get(link.relationship.id);
    if (!route) continue;
    for (const p of route.points) include({ x: p.x - 2, y: p.y - 2, width: 4, height: 4 });
    include({ x: route.label.x - route.label.width / 2 - 6, y: route.label.y - route.label.height / 2 - 6, width: route.label.width + 12, height: route.label.height + 12 });
  }
  return Number.isFinite(left) ? { x: left, y: top, width: right - left, height: bottom - top } : void 0;
}

// src/components/GroupedFlowDiagram/RecordedRelationshipEdge.tsx
import { useContext as useContext2, useState as useState2 } from "react";

// src/components/GroupedFlowDiagram/presentation.ts
import { createContext as createContext2 } from "react";
var RecordedFocusContext = createContext2({ focused: false });
function visibleRecordedFitTargets(ids, model) {
  if (ids.length > 512) return void 0;
  const declared = new Map(model.definition.nodes.map((node) => [node.id, node])), visible = new Set(model.nodes.map((item) => item.node.id)), result = /* @__PURE__ */ new Set();
  for (const id of ids) {
    if (!declared.has(id)) return void 0;
    let target = id, depth = 0;
    while (!visible.has(target)) {
      if (depth++ >= 16) return void 0;
      const parent = declared.get(target)?.parentId;
      if (parent === void 0 || !declared.has(parent)) return void 0;
      target = parent;
    }
    result.add(target);
  }
  return [...result];
}

// src/components/GroupedFlowDiagram/RecordedRelationshipEdge.tsx
import { Fragment as Fragment2, jsx as jsx5, jsxs as jsxs3 } from "react/jsx-runtime";
function RecordedRelationshipEdge(props) {
  const { focused } = useContext2(RecordedFocusContext), [hovered, setHovered] = useState2(false);
  const data = props.data;
  const relationship = data?.relationship;
  const route = data?.route;
  if (!route) return null;
  const caption = relationship?.attribution === "stage" ? "Step" : relationship?.attribution === "recorded-read" ? "Read" : relationship?.kind === "control" ? "Rule" : relationship?.kind === "data" ? "Data" : "Link";
  const fullLabel = typeof props.label === "string" ? props.label : "Recorded dependency";
  const path = recordedRoutePath(route, { x: props.sourceX, y: props.sourceY }, { x: props.targetX, y: props.targetY });
  const { x, y } = route.label;
  const showCaption = !focused || caption !== "Data" || hovered || props.selected;
  return /* @__PURE__ */ jsxs3(Fragment2, { children: [
    /* @__PURE__ */ jsxs3("g", { onMouseEnter: () => setHovered(true), onMouseLeave: () => setHovered(false), "data-recorded-connection": props.id, children: [
      /* @__PURE__ */ jsx5("title", { children: fullLabel }),
      /* @__PURE__ */ jsx5(BaseEdge, { id: props.id, path, markerEnd: props.markerEnd, style: props.style })
    ] }),
    /* @__PURE__ */ jsx5(EdgeLabelRenderer, { children: /* @__PURE__ */ jsx5(
      "span",
      {
        className: "nodrag nopan",
        title: fullLabel,
        "aria-label": fullLabel,
        "data-relationship-id": props.id,
        "data-caption-visible": showCaption,
        style: {
          position: "absolute",
          transform: `translate(-50%, -50%) translate(${x}px,${y}px)`,
          fontFamily: theme.fontSans,
          fontSize: 11,
          width: route.label.width,
          height: route.label.height,
          boxSizing: "border-box",
          textAlign: "center",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          borderRadius: 4,
          padding: "2px 5px",
          opacity: showCaption ? 1 : 0,
          border: `1px solid ${relationship?.direction === "backward" ? theme.error : relationship?.direction === "forward" ? theme.tracing : theme.textSecondary}`,
          color: theme.textPrimary,
          background: theme.bgElevated,
          pointerEvents: "none"
        },
        children: caption
      }
    ) })
  ] });
}
var recordedRelationshipEdgeTypes = { recordedRelationship: RecordedRelationshipEdge };

// src/components/GroupedFlowDiagram/GroupedFlowDiagram.tsx
import { jsx as jsx6, jsxs as jsxs4 } from "react/jsx-runtime";
var buttonStyle = { font: "inherit", fontSize: 12, border: `1px solid ${theme.border}`, borderRadius: 8, padding: "7px 12px", background: theme.bgElevated, color: theme.textPrimary, cursor: "pointer" };
function GroupedFlowDiagram(props) {
  const { focused: recordedFocus, fitNodeIds } = useContext3(RecordedFocusContext);
  const [localExpanded, setLocalExpanded] = useState3(props.defaultExpandedGroupIds ?? []);
  const [localSelected, setLocalSelected] = useState3();
  const wrapper = useRef2(null);
  const [narrow, setNarrow] = useState3(false);
  const [focusIds, setFocusIds] = useState3();
  const [focusRequest, setFocusRequest] = useState3(0);
  const initiallyFocused = useRef2(false);
  const expanded = props.expandedGroupIds ?? localExpanded;
  const selected = props.selectedNodeId === void 0 ? localSelected : props.selectedNodeId ?? void 0;
  const canToggle = props.expandedGroupIds === void 0 || typeof props.onExpandedGroupIdsChange === "function";
  const result = useMemo(
    () => projectGroupedFlowDiagram(props.definition, {
      expandedGroupIds: expanded,
      observation: props.observation,
      highlight: props.highlight,
      selectedNodeId: selected,
      direction: props.direction
    }),
    [props.definition, expanded, props.observation, props.highlight, selected, props.direction]
  );
  const model = result.model;
  const overlay = useMemo(() => !model || props.recordedRelationships === void 0 ? [] : projectRecordedRelationships(props.recordedRelationships, model), [model, props.recordedRelationships]);
  const routing = useMemo(() => model && overlay ? routeRecordedRelationships(overlay, model) : void 0, [model, overlay]);
  const visualBounds = useMemo(() => routing && overlay ? recordedVisualBounds(routing, overlay, focusIds) : void 0, [routing, overlay, focusIds]);
  const fitTargets = useMemo(() => model && recordedFocus ? visibleRecordedFitTargets(fitNodeIds ?? [], model) : void 0, [model, recordedFocus, fitNodeIds]);
  const camera = useMemo(() => {
    if (!model || props.focusRequest === void 0) return void 0;
    const requested = admitFocusRequest(props.focusRequest, model);
    if (!requested || !recordedFocus || !requested.nodeIds.length) return requested;
    const visible = visibleRecordedFitTargets(requested.nodeIds, model);
    return visible ? { ...requested, nodeIds: visible } : void 0;
  }, [model, props.focusRequest, recordedFocus]);
  const lastCameraKey = useRef2(/* @__PURE__ */ Symbol());
  const changeExpanded = (next) => {
    if (props.expandedGroupIds === void 0) setLocalExpanded(next);
    props.onExpandedGroupIdsChange?.(next);
  };
  const select = (id) => {
    if (props.selectedNodeId === void 0) setLocalSelected(id);
    props.onSelectNode?.(id);
  };
  const requestFocus = (ids) => {
    setFocusIds(ids);
    setFocusRequest((value) => value + 1);
  };
  const names = useMemo(() => {
    if (!model) return /* @__PURE__ */ new Map();
    const groups = model.definition.nodes.filter((node) => node.kind === "group");
    const groupIndex = new Map(groups.map((node, index) => [node.id, index + 1]));
    const counts = /* @__PURE__ */ new Map();
    const siblingCounts = /* @__PURE__ */ new Map();
    for (const node of model.definition.nodes) {
      counts.set(node.label, (counts.get(node.label) ?? 0) + 1);
      const key = JSON.stringify([node.parentId ?? null, node.label]);
      siblingCounts.set(key, (siblingCounts.get(key) ?? 0) + 1);
    }
    return new Map(model.definition.nodes.map((node, index) => {
      const duplicate = (counts.get(node.label) ?? 0) > 1;
      if (node.kind === "group" && duplicate) return [node.id, `Group ${groupIndex.get(node.id)}`];
      const context = node.parentId ? `Group ${groupIndex.get(node.parentId)}` : "";
      const siblingDuplicate = (siblingCounts.get(JSON.stringify([node.parentId ?? null, node.label])) ?? 0) > 1;
      return [node.id, [context, siblingDuplicate || !node.parentId && duplicate ? `Item ${index + 1}` : ""].filter(Boolean).join(" \xB7 ")];
    }));
  }, [props.definition, model]);
  const ports = /* @__PURE__ */ new Map();
  for (const item of overlay ?? []) {
    const route = routing?.routes.get(item.relationship.id);
    if (!route) continue;
    ports.set(item.source, [...ports.get(item.source) ?? [], route.sourcePort]);
    ports.set(item.target, [...ports.get(item.target) ?? [], route.targetPort]);
  }
  const nodes = model?.nodes.map((item) => ({
    id: item.node.id,
    type: item.expanded ? "flowDiagramGroup" : "flowDiagramItem",
    parentId: item.parentId,
    position: item.position,
    width: item.width,
    height: item.height,
    style: { width: item.width, height: item.height, pointerEvents: "all", ...recordedFocus && !item.highlighted ? { opacity: 0.28 } : {} },
    draggable: false,
    selectable: false,
    data: {
      item,
      caption: names.get(item.node.id) ?? "",
      selected: item.node.id === selected,
      direction: model.direction,
      canToggle,
      recordedPorts: ports.get(item.node.id),
      onToggle: (id) => {
        requestFocus(narrow ? [id] : void 0);
        changeExpanded(model.expandedGroupIds.includes(id) ? model.expandedGroupIds.filter((value) => value !== id) : [...model.expandedGroupIds, id]);
      },
      onSelect: select
    }
  })) ?? [];
  const edges = model?.edges.map((item) => {
    const color = item.highlighted ? theme.tracing : theme.textMuted;
    return {
      id: item.edge.id,
      source: item.source,
      target: item.target,
      type: "smoothstep",
      label: item.edge.label,
      ...recordedFocus ? { hidden: true } : {},
      className: `gfd-edge-${item.state}${item.highlighted ? " gfd-edge-highlighted" : ""}`,
      ariaLabel: `${item.edge.label ?? "Relationship"}. ${item.state === "observed" ? "Recorded" : item.state === "not-taken" ? "Not taken (recorded)" : "Not verified"}${item.collapsed ? ". Grouped view of the original relationship" : ""}.`,
      markerEnd: { type: MarkerType.ArrowClosed, color },
      style: { stroke: color, strokeWidth: item.highlighted ? 4 : 2, ...item.state !== "observed" ? { strokeDasharray: "6 5" } : {} },
      labelStyle: { fill: theme.textPrimary, fontSize: 12, fontWeight: 600 },
      labelBgStyle: { fill: theme.bgElevated },
      labelBgPadding: [7, 4]
    };
  }) ?? [];
  const highlightFocusIds = new Set(model?.nodes.filter((node) => node.highlighted && !node.expanded).map((node) => node.node.id));
  for (const edge of model?.edges ?? []) {
    if (edge.highlighted) {
      highlightFocusIds.add(edge.source);
      highlightFocusIds.add(edge.target);
    }
  }
  if (!highlightFocusIds.size) {
    for (const node of model?.nodes ?? []) if (node.highlighted) highlightFocusIds.add(node.node.id);
  }
  const relationshipLabels = { "per-write": "Per-write link", stage: "Step-level link", "recorded-control": "Recorded control", "recorded-read": "Recorded read" };
  for (const item of overlay ?? []) {
    const relationship = item.relationship;
    const route = routing?.routes.get(relationship.id);
    if (!route) continue;
    const color = relationship.direction === "backward" ? theme.error : relationship.direction === "forward" ? theme.tracing : theme.textSecondary;
    edges.push({
      id: relationship.id,
      source: item.source,
      target: item.target,
      type: "recordedRelationship",
      sourceHandle: route.sourcePort.id,
      targetHandle: route.targetPort.id,
      label: `${relationshipLabels[relationship.attribution]} \xB7 ${relationship.kind}`,
      ariaLabel: `${relationship.direction === "backward" ? "Backward source trail, not a failed step. " : relationship.direction === "forward" ? "Forward recorded impact. " : "Recorded dependency. "}${relationshipLabels[relationship.attribution]}. ${relationship.kind} dependency.${item.collapsed ? " Grouped view of the original relationship." : ""}`,
      data: { relationship, collapsed: item.collapsed, route },
      className: "gfd-recorded-relationship",
      markerEnd: { type: MarkerType.ArrowClosed, color, width: 14, height: 14 },
      style: { stroke: color, strokeWidth: 1.8, ...relationship.attribution === "stage" ? { strokeDasharray: "6 5" } : {} },
      labelStyle: { fill: theme.textPrimary, fontSize: 12 },
      labelBgStyle: { fill: theme.bgElevated },
      labelBgPadding: [7, 4]
    });
  }
  useEffect4(() => {
    if (!camera || Object.is(lastCameraKey.current, camera.key)) return;
    lastCameraKey.current = camera.key;
    requestFocus(camera.nodeIds.length ? camera.nodeIds : void 0);
  }, [Boolean(camera), camera?.key]);
  const geometry = model ? JSON.stringify(model.nodes.map((node) => [node.node.id, node.parentId, node.position, node.width, node.height])) : "";
  useEffect4(() => {
    const element = wrapper.current;
    if (!element) return;
    const measure = () => setNarrow(element.clientWidth > 0 && element.clientWidth < 600);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [Boolean(model)]);
  useEffect4(() => {
    if (model && narrow && !initiallyFocused.current && selected && model.nodes.some((node) => node.node.id === selected)) {
      initiallyFocused.current = true;
      requestFocus([selected]);
    }
  }, [model, selected, narrow]);
  if (!model || !overlay || props.focusRequest !== void 0 && !camera) return /* @__PURE__ */ jsxs4("section", { role: "alert", className: props.className, style: { color: theme.textPrimary, fontFamily: theme.fontSans, ...props.style }, children: [
    /* @__PURE__ */ jsx6("p", { children: "This diagram cannot be shown yet. Its saved information or grouping needs checking." }),
    /* @__PURE__ */ jsxs4("details", { children: [
      /* @__PURE__ */ jsx6("summary", { children: "How to fix this diagram" }),
      /* @__PURE__ */ jsx6("p", { children: result.error ?? (!overlay ? "Provide bounded recorded relationships with unique IDs, declared endpoints and supported attribution." : "Focus only declared diagram items using a bounded plain camera request.") })
    ] }),
    props.expandedGroupIds === void 0 && props.selectedNodeId === void 0 && /* @__PURE__ */ jsx6("button", { type: "button", style: buttonStyle, onClick: () => {
      setLocalExpanded([]);
      setLocalSelected(void 0);
    }, children: "Reset view" })
  ] });
  return /* @__PURE__ */ jsxs4(
    "section",
    {
      className: props.className,
      "aria-label": props["aria-label"] ?? "Grouped flow diagram",
      "data-camera-focus": focusIds?.join(" ") ?? "overview",
      "data-narrow": narrow,
      "data-direction": model.direction,
      "data-investigation-focus": recordedFocus,
      style: { display: "flex", flexDirection: "column", width: "100%", height: 560, minHeight: 320, minWidth: 0, fontFamily: theme.fontSans, color: theme.textPrimary, ...props.style },
      children: [
        /* @__PURE__ */ jsxs4("div", { style: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, padding: "10px 0" }, children: [
          /* @__PURE__ */ jsx6("button", { type: "button", style: buttonStyle, disabled: recordedFocus && !fitTargets?.length, onClick: () => {
            if (recordedFocus) {
              if (fitTargets?.length) requestFocus(fitTargets);
            } else requestFocus();
          }, children: recordedFocus ? "Fit recorded view" : "Fit diagram" }),
          /* @__PURE__ */ jsx6("button", { type: "button", style: buttonStyle, disabled: !selected || !canToggle, onClick: () => {
            if (!selected) return;
            requestFocus([selected]);
            const next = [.../* @__PURE__ */ new Set([...model.expandedGroupIds, ...getFlowDiagramAncestors(model.definition, selected)])];
            changeExpanded(next);
          }, children: "Reveal selection" }),
          /* @__PURE__ */ jsx6("button", { type: "button", style: buttonStyle, disabled: !highlightFocusIds.size, onClick: () => {
            if (highlightFocusIds.size) requestFocus([...highlightFocusIds]);
          }, children: recordedFocus ? "All recorded connections" : "Focus highlighted path" }),
          /* @__PURE__ */ jsx6("span", { style: { fontSize: 11, color: theme.textSecondary }, children: "Open a flow to see its steps. Missing information stays unknown." })
        ] }),
        recordedFocus && !fitTargets?.length && /* @__PURE__ */ jsx6("p", { role: "status", children: "The recorded view cannot be fitted yet. Check its diagram mapping or expand the containing flow." }),
        /* @__PURE__ */ jsx6("div", { ref: wrapper, style: { flex: 1, minHeight: 220, minWidth: 0, border: `1px solid ${theme.border}`, borderRadius: 16, overflow: "hidden", background: theme.bg }, children: /* @__PURE__ */ jsxs4(
          ReactFlow,
          {
            nodes,
            edges,
            nodeTypes: diagramNodeTypes,
            edgeTypes: recordedRelationshipEdgeTypes,
            nodesDraggable: false,
            nodesConnectable: false,
            nodesFocusable: false,
            edgesFocusable: false,
            minZoom: 0.1,
            maxZoom: 1.6,
            preventScrolling: false,
            proOptions: { hideAttribution: true },
            children: [
              /* @__PURE__ */ jsx6(ChartAutoRefit, { wrapperRef: wrapper, refitKey: geometry, padding: 0.06, focusNodeIds: focusIds, focusRequestKey: focusRequest, maxAutoZoom: 1, visualBounds }),
              /* @__PURE__ */ jsx6(Background, { gap: 24, color: theme.border }),
              /* @__PURE__ */ jsx6(Controls, { showInteractive: false })
            ]
          }
        ) }),
        !!routing?.undrawn && /* @__PURE__ */ jsxs4("p", { role: "status", "data-routing-unavailable": routing.undrawn, style: { margin: "8px 0 0", fontSize: 12 }, children: [
          routing.undrawn,
          " recorded ",
          routing.undrawn === 1 ? "connection could" : "connections could",
          " not be drawn. Expand the flow or inspect the recorded evidence. The explanation is unchanged."
        ] }),
        /* @__PURE__ */ jsxs4("p", { style: { margin: "8px 0 0", fontSize: 11, color: theme.textSecondary }, children: [
          "\u2713 Completed step \xB7 \xD7 Failed step \xB7 ? Unknown \xB7 Dashed relationship: not verified or recorded as not taken",
          overlay.length > 0 ? " \xB7 Warm backward links: recorded sources, not failed steps \xB7 Teal forward links: recorded impact, not proof of harm" : ""
        ] })
      ]
    }
  );
}

// src/components/MemoryInspector/MemoryInspector.tsx
import { useMemo as useMemo2 } from "react";
import { jsx as jsx7, jsxs as jsxs5 } from "react/jsx-runtime";
function MemoryInspector({
  data,
  snapshots,
  selectedIndex = 0,
  showTypes = false,
  highlightNew = true,
  size = "default",
  unstyled = false,
  className,
  style
}) {
  const { memory, newKeys } = useMemo2(() => {
    if (data) {
      return { memory: data, newKeys: /* @__PURE__ */ new Set() };
    }
    if (!snapshots || snapshots.length === 0) {
      return { memory: {}, newKeys: /* @__PURE__ */ new Set() };
    }
    const safeIdx = Math.min(selectedIndex, snapshots.length - 1);
    const merged = snapshots[safeIdx]?.memory ?? {};
    const nk = /* @__PURE__ */ new Set();
    if (highlightNew) {
      const prev = safeIdx > 0 ? snapshots[safeIdx - 1]?.memory ?? {} : {};
      for (const k of Object.keys(merged)) {
        if (!(k in prev)) nk.add(k);
      }
    }
    return { memory: merged, newKeys: nk };
  }, [data, snapshots, selectedIndex, highlightNew]);
  const entries = Object.entries(memory);
  const fs = fontSize[size];
  const pad = padding[size];
  if (unstyled) {
    return /* @__PURE__ */ jsxs5("div", { className, style, "data-fp": "memory-inspector", role: "region", "aria-label": "Memory state", children: [
      /* @__PURE__ */ jsx7("div", { "data-fp": "memory-label", children: "Memory State" }),
      /* @__PURE__ */ jsx7("pre", { "data-fp": "memory-json", children: /* @__PURE__ */ jsx7("code", { children: JSON.stringify(memory, null, 2) }) })
    ] });
  }
  return /* @__PURE__ */ jsxs5(
    "div",
    {
      className,
      style: {
        padding: pad,
        fontFamily: theme.fontSans,
        ...style
      },
      "data-fp": "memory-inspector",
      role: "region",
      "aria-label": "Memory state",
      children: [
        /* @__PURE__ */ jsx7(
          "span",
          {
            style: {
              fontSize: fs.label,
              fontWeight: 600,
              color: theme.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.08em"
            },
            children: "Memory State"
          }
        ),
        /* @__PURE__ */ jsxs5(
          "div",
          {
            style: {
              marginTop: 8,
              background: theme.bgSecondary,
              border: `1px solid ${theme.border}`,
              borderRadius: theme.radius,
              padding: `${pad}px ${pad + 4}px`,
              fontFamily: theme.fontMono,
              fontSize: fs.body,
              lineHeight: 1.8
            },
            children: [
              /* @__PURE__ */ jsx7("span", { style: { color: theme.textMuted }, children: "{" }),
              entries.length === 0 && /* @__PURE__ */ jsx7(
                "div",
                {
                  style: {
                    paddingLeft: 16,
                    color: theme.textMuted,
                    fontStyle: "italic"
                  },
                  children: "// empty"
                }
              ),
              entries.map(([key, value], i) => {
                const isNew = newKeys.has(key);
                const isLast = i === entries.length - 1;
                return /* @__PURE__ */ jsxs5(
                  "div",
                  {
                    style: {
                      paddingLeft: 16,
                      background: isNew ? `color-mix(in srgb, ${theme.success} 10%, transparent)` : "transparent",
                      borderRadius: 4,
                      marginLeft: -4,
                      marginRight: -4,
                      paddingRight: 4
                    },
                    children: [
                      /* @__PURE__ */ jsxs5("span", { style: { color: theme.primary }, children: [
                        '"',
                        key,
                        '"'
                      ] }),
                      /* @__PURE__ */ jsx7("span", { style: { color: theme.textMuted }, children: ": " }),
                      /* @__PURE__ */ jsx7("span", { style: { color: theme.success }, children: formatValue(value) }),
                      showTypes && /* @__PURE__ */ jsxs5(
                        "span",
                        {
                          style: {
                            color: theme.textMuted,
                            fontSize: fs.small,
                            marginLeft: 8,
                            opacity: 0.6
                          },
                          children: [
                            "(",
                            typeof value,
                            ")"
                          ]
                        }
                      ),
                      !isLast && /* @__PURE__ */ jsx7("span", { style: { color: theme.textMuted }, children: "," })
                    ]
                  },
                  key
                );
              }),
              /* @__PURE__ */ jsx7("span", { style: { color: theme.textMuted }, children: "}" })
            ]
          }
        )
      ]
    }
  );
}
function formatValue(value) {
  if (typeof value === "string") return `"${value}"`;
  if (typeof value === "object" && value !== null) return JSON.stringify(value);
  return String(value);
}

// src/components/NarrativeLog/NarrativeLog.tsx
import { useMemo as useMemo3 } from "react";
import { jsx as jsx8, jsxs as jsxs6 } from "react/jsx-runtime";
function NarrativeLog({
  snapshots,
  selectedIndex,
  narrative,
  size = "default",
  unstyled = false,
  className,
  style
}) {
  const entries = useMemo3(() => {
    if (narrative) {
      return [{ label: "Output", text: narrative, isCurrent: true }];
    }
    const idx = selectedIndex ?? snapshots.length - 1;
    return snapshots.slice(0, idx + 1).map((s, i) => ({
      label: s.stageLabel,
      text: s.narrative,
      isCurrent: i === idx
    }));
  }, [snapshots, selectedIndex, narrative]);
  const fs = fontSize[size];
  const pad = padding[size];
  if (unstyled) {
    return /* @__PURE__ */ jsx8("div", { className, style, "data-fp": "narrative-log", children: entries.map((entry, i) => /* @__PURE__ */ jsxs6("div", { "data-fp": "narrative-entry", "data-current": entry.isCurrent, children: [
      /* @__PURE__ */ jsx8("strong", { children: entry.label }),
      /* @__PURE__ */ jsx8("p", { children: entry.text })
    ] }, i)) });
  }
  return /* @__PURE__ */ jsxs6(
    "div",
    {
      className,
      style: { padding: pad, fontFamily: theme.fontSans, ...style },
      "data-fp": "narrative-log",
      children: [
        /* @__PURE__ */ jsx8(
          "span",
          {
            style: {
              fontSize: fs.label,
              fontWeight: 600,
              color: theme.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.08em"
            },
            children: "Execution Log"
          }
        ),
        /* @__PURE__ */ jsx8("div", { style: { marginTop: 8, display: "flex", flexDirection: "column" }, children: entries.map((entry, i) => /* @__PURE__ */ jsxs6(
          "div",
          {
            style: {
              display: "flex",
              gap: 10,
              padding: `${pad}px 0`,
              borderBottom: i < entries.length - 1 ? `1px solid ${theme.border}` : "none"
            },
            children: [
              /* @__PURE__ */ jsxs6(
                "div",
                {
                  style: {
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    width: 12,
                    flexShrink: 0,
                    paddingTop: 5
                  },
                  children: [
                    /* @__PURE__ */ jsx8(
                      "div",
                      {
                        style: {
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: entry.isCurrent ? theme.primary : theme.success,
                          flexShrink: 0
                        }
                      }
                    ),
                    i < entries.length - 1 && /* @__PURE__ */ jsx8(
                      "div",
                      {
                        style: {
                          width: 1,
                          flex: 1,
                          background: theme.border,
                          marginTop: 4
                        }
                      }
                    )
                  ]
                }
              ),
              /* @__PURE__ */ jsxs6("div", { style: { flex: 1, minWidth: 0 }, children: [
                /* @__PURE__ */ jsx8(
                  "span",
                  {
                    style: {
                      fontSize: fs.label,
                      fontWeight: 600,
                      color: entry.isCurrent ? theme.primary : theme.textMuted
                    },
                    children: entry.label
                  }
                ),
                /* @__PURE__ */ jsx8(
                  "div",
                  {
                    style: {
                      fontSize: fs.body,
                      lineHeight: 1.5,
                      color: entry.isCurrent ? theme.textPrimary : theme.textSecondary,
                      marginTop: 2
                    },
                    children: entry.text
                  }
                )
              ] })
            ]
          },
          i
        )) })
      ]
    }
  );
}

// src/components/NarrativeTrace/NarrativeTrace.tsx
import { useState as useState4, useCallback, useMemo as useMemo4, useEffect as useEffect5, useRef as useRef3 } from "react";
import { jsx as jsx9, jsxs as jsxs7 } from "react/jsx-runtime";
function parseGroups(lines) {
  const groups = [];
  let current = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trimStart();
    const isStep = trimmed.startsWith("Step ") || /^\s/.test(line);
    if (!isStep || !current) {
      current = { header: line, headerIdx: i, steps: [] };
      groups.push(current);
    } else {
      current.steps.push({ text: trimmed, idx: i });
    }
  }
  return groups;
}
function NarrativeTrace({
  narrative,
  revealedCount,
  defaultCollapsed = false,
  onStageClick,
  size = "default",
  unstyled = false,
  className,
  style
}) {
  const revealed = revealedCount != null ? narrative.slice(0, revealedCount) : narrative;
  const future = revealedCount != null ? narrative.slice(revealedCount) : [];
  const revealedGroups = useMemo4(() => parseGroups(revealed), [revealed]);
  const futureGroups = useMemo4(() => parseGroups(future), [future]);
  const [collapsedSet, setCollapsedSet] = useState4(() => {
    if (!defaultCollapsed) return /* @__PURE__ */ new Set();
    return new Set(parseGroups(narrative).map((g) => g.headerIdx));
  });
  const latestRef = useRef3(null);
  useEffect5(() => {
    latestRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [revealedGroups.length]);
  const toggle = useCallback((idx) => {
    setCollapsedSet((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }, []);
  const lastIdx = revealedGroups.length - 1;
  const fs = fontSize[size];
  const pad = padding[size];
  if (unstyled) {
    return /* @__PURE__ */ jsxs7("div", { className, style, "data-fp": "narrative-trace", children: [
      revealedGroups.map((group, gi) => /* @__PURE__ */ jsxs7("div", { "data-fp": "narrative-group", "data-latest": gi === lastIdx, children: [
        /* @__PURE__ */ jsx9(
          "div",
          {
            "data-fp": "narrative-header",
            "data-collapsible": group.steps.length > 0,
            "data-collapsed": collapsedSet.has(group.headerIdx),
            role: group.steps.length > 0 ? "button" : void 0,
            tabIndex: group.steps.length > 0 ? 0 : void 0,
            "aria-expanded": group.steps.length > 0 ? !collapsedSet.has(group.headerIdx) : void 0,
            "aria-label": `Stage ${gi + 1}, ${group.steps.length} steps${gi === lastIdx ? ", current" : ""}`,
            onClick: () => {
              if (group.steps.length > 0) toggle(group.headerIdx);
              onStageClick?.(group.headerIdx);
            },
            onKeyDown: (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (group.steps.length > 0) toggle(group.headerIdx);
                onStageClick?.(group.headerIdx);
              }
            },
            children: group.header
          }
        ),
        !collapsedSet.has(group.headerIdx) && group.steps.map((step) => /* @__PURE__ */ jsx9("div", { "data-fp": "narrative-step", children: step.text }, step.idx))
      ] }, group.headerIdx)),
      futureGroups.length > 0 && /* @__PURE__ */ jsxs7("div", { "data-fp": "narrative-future-hint", children: [
        futureGroups.length,
        " more ",
        futureGroups.length === 1 ? "stage" : "stages",
        " ahead..."
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxs7(
    "div",
    {
      className,
      style: {
        flex: 1,
        overflow: "auto",
        padding: pad,
        fontFamily: theme.fontMono,
        ...style
      },
      "data-fp": "narrative-trace",
      children: [
        revealedGroups.map((group, gi) => {
          const isLatest = gi === lastIdx;
          const isCollapsed = collapsedSet.has(group.headerIdx);
          const hasSteps = group.steps.length > 0;
          return /* @__PURE__ */ jsxs7(
            "div",
            {
              ref: isLatest ? latestRef : void 0,
              style: { marginBottom: 2 },
              "data-fp": "narrative-group",
              children: [
                /* @__PURE__ */ jsxs7(
                  "div",
                  {
                    role: hasSteps ? "button" : void 0,
                    tabIndex: hasSteps ? 0 : void 0,
                    "aria-expanded": hasSteps ? !isCollapsed : void 0,
                    "aria-label": `Stage ${gi + 1}, ${group.steps.length} steps${isLatest ? ", current" : ", completed"}`,
                    onClick: () => {
                      if (hasSteps) toggle(group.headerIdx);
                      onStageClick?.(group.headerIdx);
                    },
                    onKeyDown: (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        if (hasSteps) toggle(group.headerIdx);
                        onStageClick?.(group.headerIdx);
                      }
                    },
                    style: {
                      fontSize: fs.body,
                      lineHeight: 1.7,
                      color: isLatest ? theme.textPrimary : theme.textSecondary,
                      padding: `4px ${pad - 4}px`,
                      borderRadius: 4,
                      background: isLatest ? theme.bgTertiary : "transparent",
                      borderLeft: isLatest ? `3px solid ${theme.primary}` : `3px solid ${theme.success}`,
                      cursor: hasSteps ? "pointer" : "default",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      userSelect: "none",
                      transition: "all 0.15s ease"
                    },
                    children: [
                      hasSteps && /* @__PURE__ */ jsx9(
                        "span",
                        {
                          style: {
                            fontSize: fs.small - 1,
                            color: theme.textMuted,
                            transition: "transform 0.15s ease",
                            transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
                            display: "inline-block",
                            width: 10,
                            flexShrink: 0
                          },
                          children: "\u25BC"
                        }
                      ),
                      !hasSteps && /* @__PURE__ */ jsx9("span", { style: { width: 10, flexShrink: 0 } }),
                      /* @__PURE__ */ jsx9("span", { children: group.header })
                    ]
                  }
                ),
                !isCollapsed && group.steps.map((step) => /* @__PURE__ */ jsx9(
                  "div",
                  {
                    style: {
                      fontSize: fs.small,
                      lineHeight: 1.6,
                      color: isLatest ? theme.textSecondary : theme.textMuted,
                      padding: `2px ${pad - 4}px 2px ${pad + 20}px`,
                      opacity: isLatest ? 0.9 : 0.7,
                      transition: "all 0.15s ease"
                    },
                    "data-fp": "narrative-step",
                    children: step.text
                  },
                  step.idx
                ))
              ]
            },
            group.headerIdx
          );
        }),
        futureGroups.length > 0 && /* @__PURE__ */ jsxs7("div", { style: {
          opacity: 0.3,
          fontSize: fs.small,
          color: theme.textMuted,
          padding: `8px ${pad}px`,
          fontStyle: "italic"
        }, children: [
          futureGroups.length,
          " more ",
          futureGroups.length === 1 ? "stage" : "stages",
          " ahead..."
        ] })
      ]
    }
  );
}

// src/components/GanttTimeline/GanttTimeline.tsx
import { useState as useState5, useMemo as useMemo5, useRef as useRef4, useEffect as useEffect6 } from "react";
import { jsx as jsx10, jsxs as jsxs8 } from "react/jsx-runtime";
var NO_TIMING_NOTE = "No timing recorded \u2014 bars show the order stages ran, not how long they took.";
var NO_TIMING_HINT = "Durations come from footprintjs's metrics recorder; this run was recorded without one.";
var NO_DURATION = "\u2014";
function GanttTimeline({
  snapshots,
  selectedIndex = 0,
  onSelect,
  size = "default",
  unstyled = false,
  className,
  style,
  theme: themeMode,
  maxVisibleRows = 5
}) {
  const [expanded, setExpanded] = useState5(false);
  const activeRowRef = useRef4(null);
  const scrollContainerRef = useRef4(null);
  const totalWallTime = useMemo5(
    () => Math.max(...snapshots.map((s) => s.startMs + s.durationMs), 1),
    [snapshots]
  );
  const untimed = useMemo5(
    () => snapshots.length > 0 && snapshots.every((s) => s.durationMs === 0),
    [snapshots]
  );
  const rowDuration = (snap) => untimed ? NO_DURATION : `${snap.durationMs}ms`;
  const rowLabel = (snap, idx) => untimed ? `${snap.stageLabel}, step ${idx + 1} of ${snapshots.length}, no timing recorded` : `${snap.stageLabel}, ${snap.durationMs}ms`;
  const barGeometry = (snap, idx) => untimed ? { leftPct: idx / snapshots.length * 100, widthPct: 100 / snapshots.length } : {
    leftPct: snap.startMs / totalWallTime * 100,
    widthPct: Math.max(snap.durationMs / totalWallTime * 100, 1)
  };
  const fs = fontSize[size];
  const pad = padding[size];
  const labelWidth = size === "compact" ? 50 : size === "detailed" ? 100 : 80;
  const msWidth = size === "compact" ? 28 : 36;
  const rowHeight = size === "compact" ? 18 : 22;
  const collapsible = maxVisibleRows > 0 && snapshots.length > maxVisibleRows;
  const showAll = expanded || !collapsible;
  useEffect6(() => {
    if (!showAll && activeRowRef.current && scrollContainerRef.current) {
      activeRowRef.current.scrollIntoView({
        block: "nearest",
        behavior: "smooth"
      });
    }
  }, [selectedIndex, showAll]);
  if (unstyled) {
    return /* @__PURE__ */ jsxs8(
      "div",
      {
        className,
        style,
        "data-fp": "gantt-timeline",
        "data-timing": untimed ? "none" : void 0,
        role: "listbox",
        "aria-label": "Execution timeline",
        children: [
          snapshots.map((snap, idx) => /* @__PURE__ */ jsxs8(
            "div",
            {
              "data-fp": "gantt-bar",
              "data-selected": idx === selectedIndex,
              "data-visible": idx <= selectedIndex,
              role: "option",
              "aria-selected": idx === selectedIndex,
              "aria-label": rowLabel(snap, idx),
              onClick: () => onSelect?.(idx),
              children: [
                /* @__PURE__ */ jsx10("span", { "data-fp": "gantt-label", children: snap.stageLabel }),
                /* @__PURE__ */ jsx10("span", { "data-fp": "gantt-duration", children: rowDuration(snap) })
              ]
            },
            `${snap.stageName}-${idx}`
          )),
          untimed && /* @__PURE__ */ jsx10("div", { "data-fp": "gantt-no-timing", title: NO_TIMING_HINT, children: NO_TIMING_NOTE })
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxs8(
    "div",
    {
      className,
      style: { ...themeModeVars(themeMode), padding: pad, fontFamily: theme.fontSans, ...style },
      "data-fp": "gantt-timeline",
      "data-timing": untimed ? "none" : void 0,
      children: [
        /* @__PURE__ */ jsxs8(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            },
            children: [
              /* @__PURE__ */ jsx10(
                "span",
                {
                  style: {
                    fontSize: fs.label,
                    fontWeight: 600,
                    color: theme.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em"
                  },
                  children: size === "compact" ? "Timeline" : "Execution Timeline"
                }
              ),
              collapsible && /* @__PURE__ */ jsx10(
                "button",
                {
                  onClick: () => setExpanded((e) => !e),
                  style: {
                    background: "none",
                    border: `1px solid ${theme.border}`,
                    borderRadius: 4,
                    color: theme.textSecondary,
                    fontSize: fs.small,
                    padding: "2px 8px",
                    cursor: "pointer",
                    fontFamily: theme.fontSans
                  },
                  children: expanded ? "Collapse" : `${snapshots.length - maxVisibleRows} more...`
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ jsx10(
          "div",
          {
            ref: scrollContainerRef,
            role: "listbox",
            "aria-label": "Execution timeline",
            style: {
              marginTop: 8,
              display: "flex",
              flexDirection: "column",
              gap: 4,
              ...showAll ? {} : {
                maxHeight: maxVisibleRows * (rowHeight + 4),
                overflowY: "auto",
                scrollbarWidth: "thin"
              }
            },
            children: snapshots.map((snap, idx) => {
              const { leftPct, widthPct } = barGeometry(snap, idx);
              const isSelected = idx === selectedIndex;
              const isVisible = idx <= selectedIndex;
              return /* @__PURE__ */ jsxs8(
                "div",
                {
                  ref: isSelected ? activeRowRef : void 0,
                  role: "option",
                  "aria-selected": isSelected,
                  "aria-label": rowLabel(snap, idx),
                  onClick: () => onSelect?.(idx),
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: size === "compact" ? 4 : 8,
                    cursor: onSelect ? "pointer" : "default",
                    opacity: isVisible ? 1 : 0.3,
                    transition: "opacity 0.3s ease",
                    height: rowHeight,
                    flexShrink: 0
                  },
                  children: [
                    /* @__PURE__ */ jsx10(
                      "span",
                      {
                        title: snap.stageLabel,
                        style: {
                          width: labelWidth,
                          fontSize: fs.small,
                          color: isSelected ? theme.primary : theme.textMuted,
                          fontWeight: isSelected ? 600 : 400,
                          textAlign: "right",
                          flexShrink: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        },
                        children: snap.stageLabel
                      }
                    ),
                    /* @__PURE__ */ jsx10(
                      "div",
                      {
                        style: {
                          flex: 1,
                          height: size === "compact" ? 6 : 8,
                          position: "relative",
                          background: theme.bgTertiary,
                          borderRadius: 3
                        },
                        children: isVisible && /* @__PURE__ */ jsx10(
                          "div",
                          {
                            style: {
                              position: "absolute",
                              left: `${leftPct}%`,
                              top: 0,
                              width: `${widthPct}%`,
                              height: "100%",
                              borderRadius: 3,
                              background: isSelected ? theme.primary : theme.success,
                              transition: "width 0.3s ease"
                            }
                          }
                        )
                      }
                    ),
                    /* @__PURE__ */ jsx10(
                      "span",
                      {
                        style: {
                          fontSize: fs.small,
                          color: theme.textMuted,
                          fontFamily: theme.fontMono,
                          width: msWidth,
                          flexShrink: 0
                        },
                        children: rowDuration(snap)
                      }
                    )
                  ]
                },
                `${snap.stageName}-${idx}`
              );
            })
          }
        ),
        untimed ? /* @__PURE__ */ jsx10(
          "div",
          {
            "data-fp": "gantt-no-timing",
            title: NO_TIMING_HINT,
            style: {
              marginTop: 6,
              fontSize: fs.small,
              color: theme.textMuted,
              fontStyle: "italic",
              lineHeight: 1.4
            },
            children: NO_TIMING_NOTE
          }
        ) : /* @__PURE__ */ jsxs8(
          "div",
          {
            style: {
              marginTop: 4,
              marginLeft: labelWidth + (size === "compact" ? 4 : 8),
              marginRight: msWidth + (size === "compact" ? 4 : 8),
              display: "flex",
              justifyContent: "space-between",
              fontSize: fs.small - 1,
              color: theme.textMuted,
              fontFamily: theme.fontMono
            },
            children: [
              /* @__PURE__ */ jsx10("span", { children: "0ms" }),
              size !== "compact" && /* @__PURE__ */ jsxs8("span", { children: [
                (totalWallTime / 2).toFixed(1),
                "ms"
              ] }),
              /* @__PURE__ */ jsxs8("span", { children: [
                totalWallTime.toFixed(1),
                "ms"
              ] })
            ]
          }
        )
      ]
    }
  );
}

// src/components/SnapshotPanel/SnapshotPanel.tsx
import { useState as useState6 } from "react";
import { jsx as jsx11, jsxs as jsxs9 } from "react/jsx-runtime";
function SnapshotPanel({
  snapshots,
  showGantt = true,
  showScrubber = true,
  title = "Pipeline Inspector",
  size = "default",
  unstyled = false,
  className,
  style,
  theme: themeMode
}) {
  const [selectedIndex, setSelectedIndex] = useState6(0);
  const fs = fontSize[size];
  const pad = padding[size];
  if (snapshots.length === 0) {
    return /* @__PURE__ */ jsx11(
      "div",
      {
        className,
        style: {
          ...themeModeVars(themeMode),
          padding: pad * 2,
          textAlign: "center",
          color: unstyled ? void 0 : theme.textMuted,
          fontSize: fs.body,
          ...style
        },
        "data-fp": "snapshot-panel",
        children: "No snapshots to display"
      }
    );
  }
  if (unstyled) {
    return /* @__PURE__ */ jsxs9("div", { className, style, "data-fp": "snapshot-panel", children: [
      /* @__PURE__ */ jsx11("h3", { children: title }),
      showScrubber && /* @__PURE__ */ jsx11(
        "input",
        {
          type: "range",
          min: 0,
          max: snapshots.length - 1,
          value: selectedIndex,
          onChange: (e) => setSelectedIndex(parseInt(e.target.value))
        }
      ),
      /* @__PURE__ */ jsx11(
        MemoryInspector,
        {
          snapshots,
          selectedIndex,
          unstyled: true
        }
      ),
      /* @__PURE__ */ jsx11(
        NarrativeLog,
        {
          snapshots,
          selectedIndex,
          unstyled: true
        }
      ),
      showGantt && /* @__PURE__ */ jsx11(
        GanttTimeline,
        {
          snapshots,
          selectedIndex,
          onSelect: setSelectedIndex,
          unstyled: true
        }
      )
    ] });
  }
  return /* @__PURE__ */ jsxs9(
    "div",
    {
      className,
      style: {
        // The one-word switch (see theme/mode.ts) — this panel is the one
        // people drop into an existing app on its own.
        ...themeModeVars(themeMode),
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: theme.bgPrimary,
        fontFamily: theme.fontSans,
        overflow: "hidden",
        ...style
      },
      "data-fp": "snapshot-panel",
      children: [
        /* @__PURE__ */ jsxs9(
          "div",
          {
            style: {
              padding: `${pad}px ${pad + 4}px`,
              borderBottom: `1px solid ${theme.border}`,
              background: theme.bgSecondary,
              flexShrink: 0
            },
            children: [
              /* @__PURE__ */ jsxs9(
                "div",
                {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: showScrubber ? 8 : 0
                  },
                  children: [
                    /* @__PURE__ */ jsx11(
                      "span",
                      {
                        style: {
                          fontSize: fs.body + 2,
                          fontWeight: 600,
                          color: theme.textPrimary
                        },
                        children: title
                      }
                    ),
                    /* @__PURE__ */ jsxs9(
                      "span",
                      {
                        style: {
                          fontSize: fs.small,
                          color: theme.textMuted,
                          fontFamily: theme.fontMono
                        },
                        children: [
                          selectedIndex + 1,
                          "/",
                          snapshots.length
                        ]
                      }
                    )
                  ]
                }
              ),
              showScrubber && /* @__PURE__ */ jsxs9("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
                /* @__PURE__ */ jsx11(
                  ScrubButton,
                  {
                    glyph: "\u25C0",
                    label: "Previous stage",
                    disabled: selectedIndex === 0,
                    onClick: () => setSelectedIndex((i) => Math.max(0, i - 1))
                  }
                ),
                /* @__PURE__ */ jsx11(
                  "input",
                  {
                    type: "range",
                    min: 0,
                    max: snapshots.length - 1,
                    value: selectedIndex,
                    onChange: (e) => setSelectedIndex(parseInt(e.target.value)),
                    style: {
                      flex: 1,
                      height: 4,
                      accentColor: theme.primary,
                      cursor: "pointer"
                    }
                  }
                ),
                /* @__PURE__ */ jsx11(
                  ScrubButton,
                  {
                    glyph: "\u25B6",
                    label: "Next stage",
                    disabled: selectedIndex === snapshots.length - 1,
                    onClick: () => setSelectedIndex((i) => Math.min(snapshots.length - 1, i + 1))
                  }
                )
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsxs9("div", { style: { flex: 1, overflow: "auto" }, children: [
          /* @__PURE__ */ jsx11(
            MemoryInspector,
            {
              snapshots,
              selectedIndex,
              size
            }
          ),
          /* @__PURE__ */ jsx11(
            "div",
            {
              style: {
                height: 1,
                background: theme.border,
                margin: `0 ${pad}px`
              }
            }
          ),
          /* @__PURE__ */ jsx11(
            NarrativeLog,
            {
              snapshots,
              selectedIndex,
              size
            }
          )
        ] }),
        showGantt && /* @__PURE__ */ jsx11(
          "div",
          {
            style: {
              borderTop: `1px solid ${theme.border}`,
              background: theme.bgSecondary,
              flexShrink: 0
            },
            children: /* @__PURE__ */ jsx11(
              GanttTimeline,
              {
                snapshots,
                selectedIndex,
                onSelect: setSelectedIndex,
                size
              }
            )
          }
        )
      ]
    }
  );
}
function ScrubButton({
  glyph,
  label,
  disabled,
  onClick
}) {
  return /* @__PURE__ */ jsx11(
    "button",
    {
      type: "button",
      onClick,
      disabled,
      "aria-label": label,
      title: label,
      "data-fp": "scrub-button",
      style: {
        background: theme.bgTertiary,
        border: `1px solid ${theme.border}`,
        color: disabled ? theme.textMuted : theme.textPrimary,
        borderRadius: 6,
        width: 28,
        height: 28,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        fontSize: 12,
        fontWeight: 600,
        lineHeight: 1,
        flexShrink: 0
      },
      children: /* @__PURE__ */ jsx11("span", { "aria-hidden": "true", children: glyph })
    }
  );
}

// src/components/ScopeDiff/ScopeDiff.tsx
import { useMemo as useMemo6 } from "react";
import { Fragment as Fragment3, jsx as jsx12, jsxs as jsxs10 } from "react/jsx-runtime";
function computeDiff(prev, curr) {
  const entries = [];
  const allKeys = /* @__PURE__ */ new Set([...Object.keys(prev ?? {}), ...Object.keys(curr)]);
  for (const key of allKeys) {
    const inPrev = prev != null && key in prev;
    const inCurr = key in curr;
    const oldVal = prev?.[key];
    const newVal = curr[key];
    if (!inPrev && inCurr) {
      entries.push({ key, type: "added", newValue: newVal });
    } else if (inPrev && !inCurr) {
      entries.push({ key, type: "removed", oldValue: oldVal });
    } else if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      entries.push({ key, type: "changed", oldValue: oldVal, newValue: newVal });
    } else {
      entries.push({ key, type: "unchanged", newValue: newVal });
    }
  }
  const order = { added: 0, changed: 1, removed: 2, unchanged: 3 };
  entries.sort((a, b) => order[a.type] - order[b.type]);
  return entries;
}
function fmt(v2) {
  if (typeof v2 === "string") return `"${v2}"`;
  if (typeof v2 === "object" && v2 !== null) return JSON.stringify(v2, null, 2);
  return String(v2);
}
var diffColors = {
  added: { bg: `color-mix(in srgb, ${theme.success} 10%, transparent)`, fg: theme.success, icon: "+" },
  removed: { bg: `color-mix(in srgb, ${theme.error} 10%, transparent)`, fg: theme.error, icon: "-" },
  changed: { bg: `color-mix(in srgb, ${theme.warning} 10%, transparent)`, fg: theme.warning, icon: "~" },
  unchanged: { bg: "transparent", fg: "", icon: " " }
};
function ScopeDiff({
  previous,
  current,
  hideUnchanged = false,
  size = "default",
  unstyled = false,
  className,
  style
}) {
  const entries = useMemo6(() => computeDiff(previous, current), [previous, current]);
  const visible = hideUnchanged ? entries.filter((e) => e.type !== "unchanged") : entries;
  const fs = fontSize[size];
  const pad = padding[size];
  if (unstyled) {
    return /* @__PURE__ */ jsx12("div", { className, style, "data-fp": "scope-diff", children: visible.map((e) => /* @__PURE__ */ jsxs10("div", { "data-fp": "diff-entry", "data-type": e.type, children: [
      /* @__PURE__ */ jsx12("span", { "data-fp": "diff-key", children: e.key }),
      e.type === "changed" && /* @__PURE__ */ jsxs10(Fragment3, { children: [
        /* @__PURE__ */ jsx12("span", { "data-fp": "diff-old", children: fmt(e.oldValue) }),
        /* @__PURE__ */ jsx12("span", { "data-fp": "diff-new", children: fmt(e.newValue) })
      ] }),
      (e.type === "added" || e.type === "unchanged") && /* @__PURE__ */ jsx12("span", { "data-fp": "diff-value", children: fmt(e.newValue) }),
      e.type === "removed" && /* @__PURE__ */ jsx12("span", { "data-fp": "diff-value", children: fmt(e.oldValue) })
    ] }, e.key)) });
  }
  return /* @__PURE__ */ jsxs10(
    "div",
    {
      className,
      style: { padding: pad, fontFamily: theme.fontMono, ...style },
      "data-fp": "scope-diff",
      children: [
        visible.length === 0 && /* @__PURE__ */ jsx12("div", { style: { fontSize: fs.body, color: theme.textMuted, fontStyle: "italic" }, children: "No changes" }),
        visible.map((entry) => {
          const dc = diffColors[entry.type];
          return /* @__PURE__ */ jsxs10(
            "div",
            {
              style: {
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                padding: `4px ${pad - 4}px`,
                marginBottom: 2,
                borderRadius: 4,
                background: dc.bg,
                fontSize: fs.body,
                lineHeight: 1.5
              },
              "data-fp": "diff-entry",
              children: [
                /* @__PURE__ */ jsx12(
                  "span",
                  {
                    style: {
                      width: 16,
                      flexShrink: 0,
                      fontWeight: 700,
                      color: dc.fg || theme.textMuted,
                      textAlign: "center"
                    },
                    children: dc.icon
                  }
                ),
                /* @__PURE__ */ jsx12("span", { style: { color: theme.primary, fontWeight: 600, flexShrink: 0 }, children: entry.key }),
                /* @__PURE__ */ jsx12("span", { style: { color: theme.textMuted }, children: "=" }),
                entry.type === "changed" ? /* @__PURE__ */ jsxs10("span", { children: [
                  /* @__PURE__ */ jsx12(
                    "span",
                    {
                      style: {
                        color: theme.error,
                        textDecoration: "line-through",
                        opacity: 0.7
                      },
                      children: fmt(entry.oldValue)
                    }
                  ),
                  /* @__PURE__ */ jsx12("span", { style: { color: theme.textMuted, margin: "0 4px" }, children: "\u2192" }),
                  /* @__PURE__ */ jsx12("span", { style: { color: theme.success }, children: fmt(entry.newValue) })
                ] }) : /* @__PURE__ */ jsx12(
                  "span",
                  {
                    style: {
                      color: entry.type === "added" ? theme.success : entry.type === "removed" ? theme.error : theme.textPrimary
                    },
                    children: fmt(entry.type === "removed" ? entry.oldValue : entry.newValue)
                  }
                )
              ]
            },
            entry.key
          );
        })
      ]
    }
  );
}

// src/components/ResultPanel/ResultPanel.tsx
import { jsx as jsx13, jsxs as jsxs11 } from "react/jsx-runtime";
function ResultPanel({
  data,
  logs = [],
  hideConsole = false,
  size = "default",
  unstyled = false,
  className,
  style
}) {
  const fs = fontSize[size];
  const pad = padding[size];
  if (unstyled) {
    return /* @__PURE__ */ jsxs11("div", { className, style, "data-fp": "result-panel", children: [
      /* @__PURE__ */ jsx13("div", { "data-fp": "result-data", children: /* @__PURE__ */ jsx13("pre", { children: data ? JSON.stringify(data, null, 2) : "No data" }) }),
      !hideConsole && /* @__PURE__ */ jsx13("div", { "data-fp": "result-console", children: logs.map((line, i) => /* @__PURE__ */ jsx13("div", { "data-fp": "console-line", "data-error": line.startsWith("ERROR"), children: line }, i)) })
    ] });
  }
  return /* @__PURE__ */ jsxs11(
    "div",
    {
      className,
      style: {
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        ...style
      },
      "data-fp": "result-panel",
      children: [
        data && /* @__PURE__ */ jsxs11("div", { style: { flex: 1, overflow: "auto", padding: pad }, children: [
          /* @__PURE__ */ jsx13(
            "div",
            {
              style: {
                fontSize: fs.label,
                fontWeight: 600,
                color: theme.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 8
              },
              children: size === "compact" ? "Result" : "Business Result (Scope)"
            }
          ),
          /* @__PURE__ */ jsx13(
            "pre",
            {
              style: {
                fontSize: fs.body,
                fontFamily: theme.fontMono,
                color: theme.textPrimary,
                background: theme.bgSecondary,
                padding: pad,
                borderRadius: theme.radius,
                overflow: "auto",
                margin: 0
              },
              children: JSON.stringify(data, null, 2)
            }
          )
        ] }),
        !hideConsole && /* @__PURE__ */ jsxs11(
          "div",
          {
            style: {
              borderTop: `1px solid ${theme.border}`,
              padding: pad,
              overflow: "auto",
              maxHeight: "40%",
              flexShrink: 0
            },
            children: [
              /* @__PURE__ */ jsx13(
                "div",
                {
                  style: {
                    fontSize: fs.label,
                    fontWeight: 600,
                    color: theme.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 8
                  },
                  children: "Console"
                }
              ),
              logs.length === 0 && /* @__PURE__ */ jsx13("div", { style: { fontSize: fs.body, color: theme.textMuted, fontStyle: "italic" }, children: "No console output" }),
              logs.map((line, i) => /* @__PURE__ */ jsx13(
                "div",
                {
                  style: {
                    fontSize: fs.body,
                    fontFamily: theme.fontMono,
                    color: line.startsWith("ERROR") ? theme.error : theme.textPrimary,
                    padding: "2px 0",
                    borderBottom: `1px solid ${theme.bgSecondary}`,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word"
                  },
                  children: line
                },
                i
              ))
            ]
          }
        )
      ]
    }
  );
}

// src/components/StageDetailPanel/StageDetailPanel.tsx
import { useState as useState7, useMemo as useMemo7, useCallback as useCallback2 } from "react";
import { Fragment as Fragment4, jsx as jsx14, jsxs as jsxs12 } from "react/jsx-runtime";
var DEFAULT_EXCLUDED_KEYS = /* @__PURE__ */ new Set([]);
function withoutExcluded(memory, exclude) {
  if (exclude.size === 0) return memory;
  const out = {};
  for (const [k, v2] of Object.entries(memory)) {
    if (!exclude.has(k)) out[k] = v2;
  }
  return out;
}
function computeChanges(prev, curr) {
  const changes = [];
  const allKeys = /* @__PURE__ */ new Set([...Object.keys(prev ?? {}), ...Object.keys(curr)]);
  for (const key of allKeys) {
    const inPrev = prev != null && key in prev;
    const inCurr = key in curr;
    const oldVal = prev?.[key];
    const newVal = curr[key];
    if (!inPrev && inCurr) {
      changes.push({ key, type: "added", newValue: newVal });
    } else if (inPrev && !inCurr) {
      changes.push({ key, type: "removed", oldValue: oldVal });
    } else if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes.push({ key, type: "updated", oldValue: oldVal, newValue: newVal });
    }
  }
  const order = { added: 0, updated: 1, removed: 2 };
  changes.sort((a, b) => order[a.type] - order[b.type]);
  return changes;
}
function fmt2(v2) {
  if (typeof v2 === "string") return `"${v2}"`;
  if (typeof v2 === "object" && v2 !== null) return JSON.stringify(v2, null, 2);
  return String(v2);
}
var wash = (color) => `color-mix(in srgb, ${color} 12%, transparent)`;
var changeBadge = {
  added: { bg: wash(theme.success), fg: theme.success, label: "ADD" },
  updated: { bg: wash(theme.warning), fg: theme.warning, label: "UPD" },
  removed: { bg: wash(theme.error), fg: theme.error, label: "DEL" }
};
function SimpleView({
  snapshot,
  fs,
  pad
}) {
  return /* @__PURE__ */ jsxs12("div", { style: { display: "flex", flexDirection: "column", gap: 16 }, children: [
    /* @__PURE__ */ jsxs12("div", { children: [
      /* @__PURE__ */ jsx14(
        "div",
        {
          style: {
            fontSize: fs.label + 2,
            fontWeight: 700,
            color: theme.textPrimary
          },
          children: snapshot.stageLabel
        }
      ),
      snapshot.description && /* @__PURE__ */ jsx14(
        "div",
        {
          style: {
            fontSize: fs.body,
            color: theme.textSecondary,
            marginTop: 4,
            lineHeight: 1.5
          },
          children: snapshot.description
        }
      )
    ] }),
    snapshot.status && /* @__PURE__ */ jsxs12("div", { style: { display: "flex", alignItems: "center", gap: 6 }, children: [
      /* @__PURE__ */ jsx14(
        "div",
        {
          style: {
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: snapshot.status === "done" ? theme.success : snapshot.status === "active" ? theme.primary : snapshot.status === "error" ? theme.error : theme.textMuted
          }
        }
      ),
      /* @__PURE__ */ jsx14(
        "span",
        {
          style: {
            fontSize: fs.small,
            color: theme.textMuted,
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          },
          children: snapshot.status
        }
      )
    ] }),
    snapshot.narrative && /* @__PURE__ */ jsxs12("div", { children: [
      /* @__PURE__ */ jsx14(
        "div",
        {
          style: {
            fontSize: fs.label,
            fontWeight: 600,
            color: theme.textMuted,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 6
          },
          children: "What happened"
        }
      ),
      /* @__PURE__ */ jsx14(
        "div",
        {
          style: {
            fontSize: fs.body,
            lineHeight: 1.6,
            color: theme.textPrimary,
            background: theme.bgSecondary,
            border: `1px solid ${theme.border}`,
            borderRadius: theme.radius,
            padding: pad
          },
          children: snapshot.narrative
        }
      )
    ] }),
    snapshot.durationMs > 0 && /* @__PURE__ */ jsxs12(
      "div",
      {
        style: {
          fontSize: fs.small,
          color: theme.textMuted
        },
        children: [
          "Completed in ",
          snapshot.durationMs < 1 ? "<1" : snapshot.durationMs,
          "ms"
        ]
      }
    )
  ] });
}
function buildMemoryRows(currMemory, changes) {
  const changeMap = new Map(changes.map((c) => [c.key, c]));
  const rows = [];
  for (const change of changes) {
    rows.push({ kind: "change", change });
  }
  const unchangedKeys = Object.keys(currMemory).filter((k) => !changeMap.has(k)).sort();
  for (const key of unchangedKeys) {
    rows.push({ kind: "unchanged", key, value: currMemory[key] });
  }
  return rows;
}
function DevView({
  snapshot,
  changes,
  currMemory,
  fs,
  pad
}) {
  const rows = useMemo7(() => buildMemoryRows(currMemory, changes), [currMemory, changes]);
  const totalKeys = Object.keys(currMemory).length;
  return /* @__PURE__ */ jsxs12("div", { style: { display: "flex", flexDirection: "column", gap: 12 }, children: [
    /* @__PURE__ */ jsxs12("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
      /* @__PURE__ */ jsx14(
        "span",
        {
          style: {
            fontSize: fs.label + 2,
            fontWeight: 700,
            color: theme.textPrimary,
            fontFamily: theme.fontMono
          },
          children: snapshot.stageLabel
        }
      ),
      snapshot.durationMs > 0 && /* @__PURE__ */ jsxs12(
        "span",
        {
          style: {
            fontSize: fs.small,
            color: theme.textMuted,
            fontFamily: theme.fontMono
          },
          children: [
            snapshot.durationMs,
            "ms"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxs12(
      "div",
      {
        style: {
          fontSize: fs.label,
          fontWeight: 600,
          color: theme.textMuted,
          textTransform: "uppercase",
          letterSpacing: "0.08em"
        },
        children: [
          "Memory",
          /* @__PURE__ */ jsxs12("span", { style: { fontWeight: 400, marginLeft: 6 }, children: [
            "(",
            totalKeys,
            " key",
            totalKeys !== 1 ? "s" : "",
            changes.length > 0 && `, ${changes.length} changed`,
            ")"
          ] })
        ]
      }
    ),
    rows.length === 0 ? /* @__PURE__ */ jsx14(
      "div",
      {
        style: {
          fontSize: fs.body,
          color: theme.textMuted,
          fontStyle: "italic",
          fontFamily: theme.fontMono,
          padding: `${pad}px`,
          background: theme.bgSecondary,
          borderRadius: theme.radius
        },
        children: "Empty memory"
      }
    ) : /* @__PURE__ */ jsx14(
      "div",
      {
        style: {
          fontFamily: theme.fontMono,
          fontSize: fs.body,
          background: theme.bgSecondary,
          border: `1px solid ${theme.border}`,
          borderRadius: theme.radius,
          overflow: "hidden"
        },
        children: rows.map((row2) => {
          if (row2.kind === "change") {
            const { change } = row2;
            const badge = changeBadge[change.type];
            return /* @__PURE__ */ jsxs12(
              "div",
              {
                style: {
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  padding: `6px ${pad}px`,
                  borderBottom: `1px solid ${theme.border}`,
                  background: badge.bg
                },
                "data-fp": "memory-change",
                "data-type": change.type,
                children: [
                  /* @__PURE__ */ jsx14(
                    "span",
                    {
                      style: {
                        fontSize: fs.small,
                        fontWeight: 700,
                        color: badge.fg,
                        width: 28,
                        flexShrink: 0,
                        textAlign: "center",
                        lineHeight: 1.8
                      },
                      children: badge.label
                    }
                  ),
                  /* @__PURE__ */ jsx14(
                    "span",
                    {
                      style: {
                        color: theme.primary,
                        fontWeight: 600,
                        flexShrink: 0,
                        lineHeight: 1.8
                      },
                      children: change.key
                    }
                  ),
                  /* @__PURE__ */ jsx14("div", { style: { flex: 1, minWidth: 0, lineHeight: 1.8 }, children: change.type === "updated" ? /* @__PURE__ */ jsxs12(Fragment4, { children: [
                    /* @__PURE__ */ jsx14(
                      "span",
                      {
                        style: {
                          color: theme.error,
                          textDecoration: "line-through",
                          opacity: 0.7
                        },
                        children: fmt2(change.oldValue)
                      }
                    ),
                    /* @__PURE__ */ jsx14("span", { style: { color: theme.textMuted, margin: "0 4px" }, children: "\u2192" }),
                    /* @__PURE__ */ jsx14("span", { style: { color: theme.success }, children: fmt2(change.newValue) })
                  ] }) : change.type === "added" ? /* @__PURE__ */ jsx14("span", { style: { color: theme.success }, children: fmt2(change.newValue) }) : /* @__PURE__ */ jsx14("span", { style: { color: theme.error, textDecoration: "line-through" }, children: fmt2(change.oldValue) }) })
                ]
              },
              change.key
            );
          }
          return /* @__PURE__ */ jsxs12(
            "div",
            {
              style: {
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                padding: `6px ${pad}px`,
                borderBottom: `1px solid ${theme.border}`,
                opacity: 0.5
              },
              "data-fp": "memory-unchanged",
              children: [
                /* @__PURE__ */ jsx14(
                  "span",
                  {
                    style: {
                      width: 28,
                      flexShrink: 0,
                      lineHeight: 1.8
                    }
                  }
                ),
                /* @__PURE__ */ jsx14(
                  "span",
                  {
                    style: {
                      color: theme.textSecondary,
                      fontWeight: 500,
                      flexShrink: 0,
                      lineHeight: 1.8
                    },
                    children: row2.key
                  }
                ),
                /* @__PURE__ */ jsx14("div", { style: { flex: 1, minWidth: 0, lineHeight: 1.8, color: theme.textMuted }, children: fmt2(row2.value) })
              ]
            },
            row2.key
          );
        })
      }
    )
  ] });
}
function UnstyledSimpleView({ snapshot }) {
  return /* @__PURE__ */ jsxs12("div", { "data-fp": "stage-detail-simple", children: [
    /* @__PURE__ */ jsx14("div", { "data-fp": "stage-label", children: snapshot.stageLabel }),
    snapshot.description && /* @__PURE__ */ jsx14("div", { "data-fp": "stage-description", children: snapshot.description }),
    snapshot.status && /* @__PURE__ */ jsx14("div", { "data-fp": "stage-status", children: snapshot.status }),
    snapshot.narrative && /* @__PURE__ */ jsx14("div", { "data-fp": "stage-narrative", children: snapshot.narrative })
  ] });
}
function UnstyledDevView({
  snapshot,
  changes,
  currMemory
}) {
  const rows = useMemo7(() => buildMemoryRows(currMemory, changes), [currMemory, changes]);
  return /* @__PURE__ */ jsxs12("div", { "data-fp": "stage-detail-dev", children: [
    /* @__PURE__ */ jsx14("div", { "data-fp": "stage-label", children: snapshot.stageLabel }),
    rows.map((row2) => {
      if (row2.kind === "change") {
        const c = row2.change;
        return /* @__PURE__ */ jsxs12("div", { "data-fp": "memory-change", "data-type": c.type, children: [
          /* @__PURE__ */ jsx14("span", { "data-fp": "change-key", children: c.key }),
          c.type === "updated" && /* @__PURE__ */ jsxs12(Fragment4, { children: [
            /* @__PURE__ */ jsx14("span", { "data-fp": "change-old", children: fmt2(c.oldValue) }),
            /* @__PURE__ */ jsx14("span", { "data-fp": "change-new", children: fmt2(c.newValue) })
          ] }),
          c.type === "added" && /* @__PURE__ */ jsx14("span", { "data-fp": "change-value", children: fmt2(c.newValue) }),
          c.type === "removed" && /* @__PURE__ */ jsx14("span", { "data-fp": "change-value", children: fmt2(c.oldValue) })
        ] }, c.key);
      }
      return /* @__PURE__ */ jsxs12("div", { "data-fp": "memory-unchanged", children: [
        /* @__PURE__ */ jsx14("span", { "data-fp": "unchanged-key", children: row2.key }),
        /* @__PURE__ */ jsx14("span", { "data-fp": "unchanged-value", children: fmt2(row2.value) })
      ] }, row2.key);
    })
  ] });
}
function ModeToggle({
  activeMode,
  onToggle,
  fs,
  unstyled
}) {
  if (unstyled) {
    return /* @__PURE__ */ jsx14("button", { "data-fp": "mode-toggle", "data-mode": activeMode, onClick: onToggle, children: activeMode === "simple" ? "Dev" : "Simple" });
  }
  return /* @__PURE__ */ jsx14(
    "div",
    {
      style: {
        display: "inline-flex",
        borderRadius: 6,
        border: `1px solid ${theme.border}`,
        overflow: "hidden",
        flexShrink: 0
      },
      "data-fp": "mode-toggle",
      children: ["simple", "dev"].map((m) => /* @__PURE__ */ jsx14(
        "button",
        {
          onClick: m !== activeMode ? onToggle : void 0,
          style: {
            padding: "4px 10px",
            fontSize: fs.small,
            fontWeight: m === activeMode ? 700 : 400,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: m === activeMode ? theme.textPrimary : theme.textMuted,
            background: m === activeMode ? theme.bgTertiary : "transparent",
            border: "none",
            cursor: m === activeMode ? "default" : "pointer"
          },
          children: m === "simple" ? "Simple" : "Dev"
        },
        m
      ))
    }
  );
}
function StageDetailPanel({
  snapshots,
  selectedIndex,
  mode: controlledMode,
  showToggle = false,
  onModeChange,
  excludeKeys = DEFAULT_EXCLUDED_KEYS,
  size = "default",
  unstyled = false,
  className,
  style
}) {
  const [internalMode, setInternalMode] = useState7(controlledMode ?? "simple");
  const activeMode = controlledMode ?? internalMode;
  const handleToggle = useCallback2(() => {
    const next = activeMode === "simple" ? "dev" : "simple";
    setInternalMode(next);
    onModeChange?.(next);
  }, [activeMode, onModeChange]);
  const snapshot = snapshots[selectedIndex];
  const rawPrevMemory = selectedIndex > 0 ? snapshots[selectedIndex - 1]?.memory ?? null : null;
  const rawCurrMemory = snapshot?.memory ?? {};
  const currMemory = useMemo7(
    () => withoutExcluded(rawCurrMemory, excludeKeys),
    [rawCurrMemory, excludeKeys]
  );
  const changes = useMemo7(
    () => computeChanges(
      rawPrevMemory === null ? null : withoutExcluded(rawPrevMemory, excludeKeys),
      currMemory
    ),
    [rawPrevMemory, currMemory, excludeKeys]
  );
  const fs = fontSize[size];
  const pad = padding[size];
  if (!snapshot) {
    return /* @__PURE__ */ jsx14("div", { className, style, "data-fp": "stage-detail-panel", children: /* @__PURE__ */ jsx14("div", { style: unstyled ? {} : { color: theme.textMuted, fontSize: fs.body, fontStyle: "italic", padding: pad }, children: "No stage selected" }) });
  }
  if (unstyled) {
    return /* @__PURE__ */ jsxs12("div", { className, style, "data-fp": "stage-detail-panel", "data-mode": activeMode, children: [
      showToggle && /* @__PURE__ */ jsx14(ModeToggle, { activeMode, onToggle: handleToggle, fs, unstyled: true }),
      activeMode === "simple" ? /* @__PURE__ */ jsx14(UnstyledSimpleView, { snapshot }) : /* @__PURE__ */ jsx14(UnstyledDevView, { snapshot, changes, currMemory })
    ] });
  }
  return /* @__PURE__ */ jsxs12(
    "div",
    {
      className,
      style: {
        padding: pad,
        fontFamily: theme.fontSans,
        overflow: "auto",
        ...style
      },
      "data-fp": "stage-detail-panel",
      "data-mode": activeMode,
      children: [
        showToggle && /* @__PURE__ */ jsx14("div", { style: { display: "flex", justifyContent: "flex-end", marginBottom: 12 }, children: /* @__PURE__ */ jsx14(ModeToggle, { activeMode, onToggle: handleToggle, fs, unstyled: false }) }),
        activeMode === "simple" ? /* @__PURE__ */ jsx14(SimpleView, { snapshot, fs, pad }) : /* @__PURE__ */ jsx14(DevView, { snapshot, changes, currMemory, fs, pad })
      ]
    }
  );
}

// src/components/TimeTravelControls/TimeTravelControls.tsx
import { useState as useState8, useEffect as useEffect7, useRef as useRef5, useCallback as useCallback3, useMemo as useMemo8 } from "react";
import { Fragment as Fragment5, jsx as jsx15, jsxs as jsxs13 } from "react/jsx-runtime";
function TimeTravelControls({
  snapshots,
  selectedIndex,
  onIndexChange,
  autoPlayable = true,
  tracing = null,
  size = "default",
  unstyled = false,
  className,
  style
}) {
  const [playing, setPlaying] = useState8(false);
  const playRef = useRef5(null);
  const total = snapshots.length;
  const isTracing = !!tracing;
  const stopSet = useMemo8(
    () => tracing ? new Set(tracing.stopIndices) : null,
    [tracing]
  );
  const earlierStop = useMemo8(() => {
    if (!tracing) return null;
    const earlier = tracing.stopIndices.filter((i) => i < selectedIndex);
    return earlier.length > 0 ? earlier[earlier.length - 1] : null;
  }, [tracing, selectedIndex]);
  const laterStop = useMemo8(() => {
    if (!tracing) return null;
    return tracing.stopIndices.find((i) => i > selectedIndex) ?? null;
  }, [tracing, selectedIndex]);
  const forkPrompt = isTracing && earlierStop === null && (tracing.forkCount ?? 0) >= 2 && !!tracing.onForkPrompt;
  const canPrev = isTracing ? forkPrompt || earlierStop !== null : selectedIndex > 0;
  const canNext = isTracing ? laterStop !== null : selectedIndex < total - 1;
  const goPrev = useCallback3(() => {
    setPlaying(false);
    if (isTracing) {
      if (forkPrompt) {
        tracing.onForkPrompt();
        return;
      }
      if (earlierStop !== null) onIndexChange(earlierStop);
    } else if (selectedIndex > 0) onIndexChange(selectedIndex - 1);
  }, [isTracing, forkPrompt, tracing, earlierStop, selectedIndex, onIndexChange]);
  const goNext = useCallback3(() => {
    setPlaying(false);
    if (isTracing) {
      if (laterStop !== null) onIndexChange(laterStop);
    } else if (selectedIndex < total - 1) onIndexChange(selectedIndex + 1);
  }, [isTracing, laterStop, selectedIndex, total, onIndexChange]);
  useEffect7(() => {
    if (!playing || !autoPlayable || isTracing) return;
    if (selectedIndex >= total - 1) {
      setPlaying(false);
      return;
    }
    const stageDur = snapshots[selectedIndex]?.durationMs ?? 1;
    const totalDur = snapshots.reduce((s, snap) => s + snap.durationMs, 0) || 1;
    const fraction = stageDur / totalDur;
    const baseMs = 3e3;
    const delay = Math.max(200, Math.min(fraction * baseMs, 2e3));
    playRef.current = setTimeout(() => {
      onIndexChange(selectedIndex + 1);
    }, delay);
    return () => {
      if (playRef.current) clearTimeout(playRef.current);
    };
  }, [playing, selectedIndex, snapshots, total, onIndexChange, autoPlayable, isTracing]);
  const togglePlay = useCallback3(() => {
    if (playing) {
      setPlaying(false);
    } else {
      if (selectedIndex >= total - 1) onIndexChange(0);
      setPlaying(true);
    }
  }, [playing, selectedIndex, total, onIndexChange]);
  const handleKeyDown = useCallback3(
    (e) => {
      if (e.key === "ArrowLeft" && canPrev && !playing) {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight" && canNext && !playing) {
        e.preventDefault();
        goNext();
      } else if (e.key === "Escape" && isTracing) {
        e.preventDefault();
        tracing.onExit();
      } else if (e.key === " " && autoPlayable && !isTracing) {
        e.preventDefault();
        togglePlay();
      }
    },
    [canPrev, canNext, playing, goPrev, goNext, autoPlayable, togglePlay, isTracing, tracing]
  );
  const fs = fontSize[size];
  const tracingColor = "var(--fp-tracing, #0d9488)";
  if (unstyled) {
    return /* @__PURE__ */ jsxs13(
      "div",
      {
        className,
        style,
        "data-fp": "time-travel-controls",
        "data-tracing": isTracing || void 0,
        role: "toolbar",
        "aria-label": isTracing ? `Tracing ${tracing.tracedKey}` : "Time travel controls",
        tabIndex: 0,
        onKeyDown: handleKeyDown,
        children: [
          isTracing && /* @__PURE__ */ jsxs13("span", { "data-fp": "tt-tracing-header", children: [
            "Tracing ",
            tracing.tracedKey,
            tracing.viaKey && /* @__PURE__ */ jsxs13(Fragment5, { children: [
              " ",
              "\u25B8 via ",
              tracing.viaKey,
              " ",
              /* @__PURE__ */ jsx15("button", { "data-fp": "tt-show-all", onClick: tracing.onShowAll, children: "show all" })
            ] }),
            " \xB7 ",
            "stop ",
            tracing.stopOrdinal,
            " of ",
            tracing.totalStops,
            /* @__PURE__ */ jsx15("button", { "data-fp": "tt-exit-tracing", onClick: tracing.onExit, "aria-label": "Exit tracing", children: "Done" })
          ] }),
          /* @__PURE__ */ jsx15(
            "button",
            {
              "data-fp": "tt-prev",
              disabled: !canPrev || playing,
              onClick: goPrev,
              "aria-label": isTracing ? forkPrompt ? "Choose cause" : "Earlier cause" : "Previous stage",
              children: isTracing ? forkPrompt ? "Choose cause\u2026" : "Earlier cause" : "Prev"
            }
          ),
          autoPlayable && !isTracing && /* @__PURE__ */ jsx15("button", { "data-fp": "tt-play", onClick: togglePlay, "aria-label": playing ? "Pause" : "Play", children: playing ? "Pause" : "Play" }),
          /* @__PURE__ */ jsx15(
            "button",
            {
              "data-fp": "tt-next",
              disabled: !canNext || playing,
              onClick: goNext,
              "aria-label": isTracing ? "Toward result" : "Next stage",
              children: isTracing ? "Toward result" : "Next"
            }
          ),
          /* @__PURE__ */ jsx15("div", { "data-fp": "tt-ticks", children: snapshots.map((snap, i) => {
            const isStop = !stopSet || stopSet.has(i);
            return /* @__PURE__ */ jsx15(
              "button",
              {
                "data-fp": "tt-tick",
                "data-active": i === selectedIndex,
                "data-done": i < selectedIndex,
                "data-stop": isTracing ? isStop : void 0,
                disabled: isTracing && !isStop,
                onClick: () => {
                  setPlaying(false);
                  onIndexChange(i);
                },
                title: snap.stageLabel
              },
              i
            );
          }) })
        ]
      }
    );
  }
  const btnStyle = (disabled) => ({
    background: theme.bgTertiary,
    border: `1px solid ${isTracing ? tracingColor : theme.border}`,
    color: disabled ? theme.textMuted : isTracing ? tracingColor : theme.textPrimary,
    borderRadius: "6px",
    padding: "4px 12px",
    fontSize: fs.body,
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    flexShrink: 0
  });
  return /* @__PURE__ */ jsxs13(
    "div",
    {
      className,
      style: {
        padding: "6px 12px",
        background: theme.bgSecondary,
        borderBottom: isTracing ? `2px solid ${tracingColor}` : `1px solid ${theme.border}`,
        display: "flex",
        alignItems: "center",
        gap: 6,
        flexShrink: 0,
        ...style
      },
      "data-fp": "time-travel-controls",
      "data-tracing": isTracing || void 0,
      role: "toolbar",
      "aria-label": isTracing ? `Tracing ${tracing.tracedKey}` : "Time travel controls",
      tabIndex: 0,
      onKeyDown: handleKeyDown,
      children: [
        isTracing && /* @__PURE__ */ jsxs13(
          "span",
          {
            "data-fp": "tt-tracing-header",
            style: {
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexShrink: 0,
              fontSize: fs.body
            },
            children: [
              /* @__PURE__ */ jsx15(
                "span",
                {
                  style: {
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "#fff",
                    background: tracingColor,
                    borderRadius: 4,
                    padding: "2px 7px"
                  },
                  children: "Tracing"
                }
              ),
              /* @__PURE__ */ jsx15("span", { style: { fontFamily: "monospace", fontWeight: 600, color: tracingColor }, children: tracing.tracedKey }),
              tracing.viaKey && /* @__PURE__ */ jsxs13("span", { style: { color: theme.textMuted }, children: [
                "\u25B8 via",
                " ",
                /* @__PURE__ */ jsx15("span", { style: { fontFamily: "monospace", color: theme.textSecondary }, children: tracing.viaKey }),
                " ",
                /* @__PURE__ */ jsx15(
                  "button",
                  {
                    "data-fp": "tt-show-all",
                    onClick: tracing.onShowAll,
                    style: {
                      border: "none",
                      background: "transparent",
                      color: tracingColor,
                      cursor: "pointer",
                      fontSize: fs.body,
                      textDecoration: "underline",
                      padding: 0
                    },
                    children: "show all"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs13("span", { style: { color: theme.textMuted }, children: [
                "\xB7 stop ",
                tracing.stopOrdinal,
                " of ",
                tracing.totalStops
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsx15(
          "button",
          {
            style: btnStyle(!canPrev || playing),
            disabled: !canPrev || playing,
            onClick: goPrev,
            "aria-label": isTracing ? forkPrompt ? "Choose cause" : "Earlier cause" : "Previous stage",
            title: isTracing ? forkPrompt ? "This stop is a fork \u2014 choose which cause to follow" : "Earlier cause" : "Previous stage",
            "data-fp": "tt-prev",
            children: isTracing ? forkPrompt ? "\u2442 choose cause\u2026" : "\u25C0 earlier cause" : "\u25C0"
          }
        ),
        autoPlayable && !isTracing && /* @__PURE__ */ jsx15(
          "button",
          {
            onClick: togglePlay,
            style: {
              background: playing ? theme.primary : theme.bgTertiary,
              border: `1px solid ${theme.border}`,
              color: playing ? "white" : theme.textPrimary,
              borderRadius: "6px",
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: 14,
              flexShrink: 0
            },
            title: playing ? "Pause" : "Play",
            "aria-label": playing ? "Pause" : "Play",
            children: playing ? "\u23F8" : "\u25B6"
          }
        ),
        /* @__PURE__ */ jsx15(
          "button",
          {
            style: btnStyle(!canNext || playing),
            disabled: !canNext || playing,
            onClick: goNext,
            "aria-label": isTracing ? "Toward result" : "Next stage",
            title: isTracing ? "Toward result" : "Next stage",
            "data-fp": "tt-next",
            children: isTracing ? "toward result \u25B6" : "\u25B6"
          }
        ),
        /* @__PURE__ */ jsx15(
          "div",
          {
            style: {
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 2,
              padding: "0 4px"
            },
            children: snapshots.map((snap, i) => {
              const isActive = i === selectedIndex;
              const isDone = i < selectedIndex;
              const isStop = !stopSet || stopSet.has(i);
              const unlandable = isTracing && !isStop;
              return /* @__PURE__ */ jsx15(
                "button",
                {
                  onClick: () => {
                    setPlaying(false);
                    onIndexChange(i);
                  },
                  disabled: unlandable,
                  title: unlandable ? `${snap.stageLabel} (not part of this trace)` : snap.stageLabel,
                  "data-fp": "tt-tick",
                  "data-stop": isTracing ? isStop : void 0,
                  "data-active": isActive || void 0,
                  style: {
                    flex: 1,
                    height: isActive ? 14 : unlandable ? 4 : 8,
                    borderRadius: 3,
                    border: "none",
                    cursor: unlandable ? "default" : "pointer",
                    background: isTracing ? isActive ? tracingColor : isStop ? "color-mix(in srgb, " + tracingColor + " 55%, transparent)" : theme.bgTertiary : isActive ? theme.primary : isDone ? theme.success : theme.bgTertiary,
                    opacity: unlandable ? 0.3 : isTracing || isDone || isActive ? 1 : 0.4,
                    transition: "all 0.15s ease"
                  }
                },
                i
              );
            })
          }
        ),
        isTracing && /* @__PURE__ */ jsx15(
          "button",
          {
            "data-fp": "tt-exit-tracing",
            onClick: tracing.onExit,
            "aria-label": "Exit tracing",
            style: { ...btnStyle(false), background: "transparent" },
            children: "Done \u2715"
          }
        )
      ]
    }
  );
}

// src/components/ExplainableShell/ExplainableShell.tsx
import { memo as memo9, useState as useState19, useCallback as useCallback9, useMemo as useMemo16, useRef as useRef11, useEffect as useEffect14 } from "react";

// src/trace/safeRecordRead.ts
function ownDataField(value, key) {
  if (!value || typeof value !== "object") return void 0;
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  return descriptor && "value" in descriptor ? descriptor.value : void 0;
}
function optionalOwnDataField(value, key) {
  if (!value || typeof value !== "object") return void 0;
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  if (descriptor && !("value" in descriptor))
    throw new TraceAdmissionError("malformed");
  return descriptor?.value;
}
function isPlainRecord(value) {
  if (!value || typeof value !== "object") return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
var TRACE_WORK_LIMIT = 1e5;
var TraceAdmissionError = class extends Error {
  constructor(reason, items) {
    super(reason);
    this.reason = reason;
    this.items = items;
  }
};
var WorkBudget = class {
  constructor(limit = TRACE_WORK_LIMIT) {
    this.limit = limit;
    this.items = 0;
  }
  spend(count) {
    this.items += count;
    if (this.items > this.limit)
      throw new TraceAdmissionError("too-large", this.items);
  }
};
function readOwnArray(value, budget) {
  const length = ownDataField(value, "length");
  if (!Array.isArray(value) || typeof length !== "number" || !Number.isInteger(length) || length < 0)
    throw new TraceAdmissionError("malformed");
  budget.spend(length);
  const result = [];
  for (let index = 0; index < length; index++) {
    const descriptor = Object.getOwnPropertyDescriptor(value, index);
    if (!descriptor || !("value" in descriptor))
      throw new TraceAdmissionError("malformed");
    result.push(descriptor.value);
  }
  return result;
}
function readName(value) {
  if (typeof value !== "string" || value.length === 0 || value.length > 4096)
    throw new TraceAdmissionError("malformed");
  return value;
}
function classifyAdmissionFailure(error) {
  try {
    const reason = ownDataField(error, "reason");
    if (reason !== "too-large" && reason !== "malformed")
      return { reason: "malformed" };
    const items = ownDataField(error, "items");
    if (reason === "too-large" && typeof items === "number" && Number.isSafeInteger(items) && items > 0)
      return { reason, items };
    return { reason: "malformed" };
  } catch {
    return { reason: "malformed" };
  }
}

// src/trace/traceScope.ts
function runHasRecordedReads(snapshot, additionalResults = []) {
  try {
    const budget = new WorkBudget();
    const seen = /* @__PURE__ */ new Set();
    const queue = [ownDataField(snapshot, "executionTree")];
    for (const result of additionalResults)
      queue.push(
        ownDataField(ownDataField(result, "treeContext"), "stageContexts")
      );
    const results = ownDataField(snapshot, "subflowResults");
    if (isPlainRecord(results))
      for (const key of Object.keys(results)) {
        budget.spend(1);
        queue.push(
          ownDataField(
            ownDataField(ownDataField(results, key), "treeContext"),
            "stageContexts"
          )
        );
      }
    for (let index = 0; index < queue.length; index++) {
      budget.spend(1);
      const node = queue[index];
      if (!isPlainRecord(node) || seen.has(node)) continue;
      seen.add(node);
      const reads = ownDataField(node, "stageReads");
      if (isPlainRecord(reads) && Object.keys(reads).length > 0) return true;
      const next = ownDataField(node, "next");
      if (next) queue.push(next);
      const children = ownDataField(node, "children");
      if (children !== void 0) queue.push(...readOwnArray(children, budget));
    }
  } catch {
  }
  return false;
}
function sourceRunKey(snapshot) {
  try {
    const id = ownDataField(snapshot, "runId");
    return typeof id === "string" && id.length > 0 ? id : snapshot;
  } catch {
    return snapshot;
  }
}
function childTraceScope(result, invocationPath, readsAvailable) {
  const unavailable = (reason, items) => ({
    invocationPath,
    commitLog: [],
    executionTree: void 0,
    availability: {
      ok: false,
      reason,
      ...items === void 0 ? {} : { items }
    },
    readsAvailable: readsAvailable ?? false,
    mountLabels: /* @__PURE__ */ new Map()
  });
  try {
    const budget = new WorkBudget();
    if (invocationPath.length === 0 || invocationPath.length > 128 || invocationPath.some(
      (part) => typeof part !== "string" || part.length === 0 || part.length > 4096
    ) || invocationPath.join("").length > 8192)
      return unavailable("malformed");
    const context = ownDataField(result, "treeContext");
    const rawHistory = ownDataField(context, "history");
    if (rawHistory === void 0) return unavailable("no-history");
    const history = readOwnArray(rawHistory, budget);
    if (history.length === 0) return unavailable("no-history");
    const mountInvocation = invocationPath[invocationPath.length - 1];
    const firstId = ownDataField(history[0], "runtimeStageId");
    const start = firstId === "" || firstId === mountInvocation ? ownDataField(history[0], "overwrite") : void 0;
    const startKeys = [];
    if (isPlainRecord(start)) {
      const keys = Object.keys(start);
      budget.spend(keys.length);
      for (const key of keys) {
        const descriptor = Object.getOwnPropertyDescriptor(start, key);
        if (descriptor && "value" in descriptor && descriptor.value !== void 0)
          startKeys.push(readName(key));
      }
    }
    const recordedCommits = history.map((entry, index) => {
      const runtimeStageId = ownDataField(entry, "runtimeStageId");
      if (index === 0 && (runtimeStageId === "" || runtimeStageId === mountInvocation))
        return null;
      return {
        stage: readName(ownDataField(entry, "stage")),
        stageId: readName(ownDataField(entry, "stageId")),
        runtimeStageId: readName(runtimeStageId),
        trace: readOwnArray(ownDataField(entry, "trace"), budget).map(
          (write) => ({ path: readName(ownDataField(write, "path")) })
        )
      };
    });
    const executionTree = {};
    const queue = [
      [ownDataField(context, "stageContexts"), executionTree]
    ];
    const seen = /* @__PURE__ */ new Set();
    const runtimeIds = /* @__PURE__ */ new Set();
    const mountLabels = /* @__PURE__ */ new Map();
    let ownReads = false;
    for (let index = 0; index < queue.length; index++) {
      budget.spend(1);
      const [node, target] = queue[index];
      if (!isPlainRecord(node) || seen.has(node))
        return unavailable("malformed");
      seen.add(node);
      target.runtimeStageId = readName(ownDataField(node, "runtimeStageId"));
      if (runtimeIds.has(target.runtimeStageId))
        return unavailable("malformed");
      runtimeIds.add(target.runtimeStageId);
      const readDescriptor = Object.getOwnPropertyDescriptor(
        node,
        "stageReads"
      );
      if (readDescriptor && !("value" in readDescriptor))
        return unavailable("malformed");
      const reads = ownDataField(node, "stageReads");
      if (reads !== void 0 && !isPlainRecord(reads))
        return unavailable("malformed");
      if (isPlainRecord(reads)) {
        const keys = Object.keys(reads);
        budget.spend(keys.length);
        if (keys.some((key) => key.length > 4096))
          return unavailable("malformed");
        target.stageReads = Object.fromEntries(keys.map((key) => [key, true]));
        ownReads || (ownReads = keys.length > 0);
      }
      const subflowId = ownDataField(node, "subflowId");
      if (typeof subflowId === "string" && subflowId.length > 0) {
        const name = optionalOwnDataField(node, "name");
        mountLabels.set(
          target.runtimeStageId,
          readName(
            typeof name === "string" && name.length > 0 ? name : subflowId
          )
        );
      }
      const next = ownDataField(node, "next");
      if (next !== void 0 && next !== null) {
        target.next = {};
        queue.push([next, target.next]);
      }
      const children = ownDataField(node, "children");
      if (children !== void 0)
        target.children = readOwnArray(children, budget).map((child) => {
          const projected = {};
          queue.push([child, projected]);
          return projected;
        });
    }
    const commitLog = recordedCommits.filter(
      (entry) => entry !== null
    );
    if (commitLog.some((entry) => !runtimeIds.has(entry.runtimeStageId)))
      return unavailable("malformed");
    return {
      invocationPath,
      commitLog,
      executionTree,
      availability: { ok: true },
      readsAvailable: readsAvailable ?? ownReads,
      mountLabels,
      startKeys: Object.freeze(startKeys)
    };
  } catch (error) {
    const failure = classifyAdmissionFailure(error);
    return unavailable(failure.reason, failure.items);
  }
}
function rootMountLabels(tree, commitLog) {
  const labels = /* @__PURE__ */ new Map();
  const budget = new WorkBudget();
  const seen = /* @__PURE__ */ new Set();
  const queue = tree === void 0 || tree === null ? [] : [tree];
  const runtimeIds = /* @__PURE__ */ new Set();
  try {
    for (let i = 0; i < queue.length; i++) {
      budget.spend(1);
      const node = queue[i];
      if (!isPlainRecord(node)) throw new TraceAdmissionError("malformed");
      if (seen.has(node)) throw new TraceAdmissionError("malformed");
      seen.add(node);
      const id = optionalOwnDataField(node, "runtimeStageId");
      if (typeof id === "string" && id.length > 0) {
        if (runtimeIds.has(id)) throw new TraceAdmissionError("malformed");
        runtimeIds.add(id);
      }
      const mount = optionalOwnDataField(node, "subflowId");
      const name = optionalOwnDataField(node, "name");
      if (typeof id === "string" && typeof mount === "string" && mount.length > 0)
        labels.set(
          readName(id),
          readName(typeof name === "string" && name.length > 0 ? name : mount)
        );
      const next = optionalOwnDataField(node, "next");
      if (next !== void 0 && next !== null) queue.push(next);
      const children = optionalOwnDataField(node, "children");
      if (children !== void 0)
        for (const child of readOwnArray(children, budget)) queue.push(child);
    }
    if (commitLog !== void 0) {
      for (const [index, entry] of readOwnArray(commitLog, budget).entries()) {
        const id = optionalOwnDataField(entry, "runtimeStageId");
        if (index === 0 && id === "") continue;
        if (typeof id !== "string" || !runtimeIds.has(id))
          throw new TraceAdmissionError("malformed");
      }
    }
    return { labels, availability: { ok: true }, hasTree: runtimeIds.size > 0 };
  } catch (error) {
    return {
      labels: /* @__PURE__ */ new Map(),
      hasTree: false,
      availability: { ok: false, ...classifyAdmissionFailure(error) }
    };
  }
}

// src/adapters/fromRuntimeSnapshot.ts
function looksLikeNarrativeEntry(value) {
  if (value === null || typeof value !== "object") return false;
  const e = value;
  return typeof e.type === "string" && typeof e.text === "string" && typeof e.depth === "number";
}
function readEntries(data) {
  const candidate = Array.isArray(data) ? data : isPlainRecord2(data) && Array.isArray(data.entries) ? data.entries : void 0;
  if (!candidate || candidate.length === 0) return void 0;
  return looksLikeNarrativeEntry(candidate[0]) ? candidate : void 0;
}
function narrativeRecorderFromSnapshot(runtime) {
  const recorders = isPlainRecord2(runtime) ? runtime.recorders : void 0;
  if (!Array.isArray(recorders)) return void 0;
  let firstMatch;
  for (const rec of recorders) {
    if (!isPlainRecord2(rec)) continue;
    const entries = readEntries(rec.data);
    if (!entries) continue;
    const match = { id: typeof rec.id === "string" ? rec.id : "", entries };
    const name = typeof rec.name === "string" ? rec.name : "";
    if (/narrative|story/i.test(name)) return match;
    firstMatch ?? (firstMatch = match);
  }
  return firstMatch;
}
function narrativeFromSnapshot(runtime) {
  return narrativeRecorderFromSnapshot(runtime)?.entries;
}
var COMMIT_PATH_DELIM = "";
var UNSAFE_KEYS = /* @__PURE__ */ new Set(["__proto__", "constructor", "prototype"]);
function isSummaryMarker(value) {
  return value !== null && typeof value === "object" && (value.__writeSummary === true || value.__readSummary === true);
}
function isPlainRecord2(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function mergeWritePatch(base, patch) {
  if (isSummaryMarker(patch)) return patch;
  if (patch === null || typeof patch !== "object") return patch;
  if (Array.isArray(patch)) return patch;
  if (isSummaryMarker(base) || !isPlainRecord2(base)) {
    base = {};
  }
  const out = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    if (UNSAFE_KEYS.has(key)) continue;
    out[key] = mergeWritePatch(out[key], value);
  }
  return out;
}
function getPath(root, segs) {
  let cur = root;
  for (const seg of segs) {
    if (!isPlainRecord2(cur) && !Array.isArray(cur)) return void 0;
    cur = cur[seg];
  }
  return cur;
}
function setPath(memory, segs, value) {
  if (segs.some((s) => UNSAFE_KEYS.has(s))) return;
  let obj = memory;
  for (let i = 0; i < segs.length - 1; i++) {
    const cur = obj[segs[i]];
    const next = Array.isArray(cur) ? cur.slice() : isPlainRecord2(cur) && !isSummaryMarker(cur) ? { ...cur } : {};
    obj[segs[i]] = next;
    obj = next;
  }
  const last = segs[segs.length - 1];
  if (value === void 0) {
    delete obj[last];
  } else {
    obj[last] = value;
  }
}
function applyCommitBundle(memory, bundle) {
  const trace = Array.isArray(bundle.trace) ? bundle.trace : void 0;
  if (trace) {
    for (const op of trace) {
      if (!op || typeof op.path !== "string") continue;
      const segs = op.path.split(COMMIT_PATH_DELIM);
      if (op.verb === "merge") {
        setPath(memory, segs, mergeWritePatch(getPath(memory, segs), getPath(bundle.updates, segs)));
      } else if (op.verb === "append") {
        const tail = getPath(bundle.overwrite, segs);
        const current = getPath(memory, segs);
        setPath(memory, segs, Array.isArray(current) && Array.isArray(tail) ? [...current, ...tail] : tail);
      } else if (op.verb === "delete") {
        setPath(memory, segs, void 0);
      } else {
        setPath(memory, segs, getPath(bundle.overwrite, segs));
      }
    }
    return;
  }
  if (isPlainRecord2(bundle.overwrite)) {
    for (const [key, value] of Object.entries(bundle.overwrite)) setPath(memory, [key], value);
  }
  if (isPlainRecord2(bundle.updates)) {
    for (const [key, value] of Object.entries(bundle.updates)) {
      setPath(memory, [key], mergeWritePatch(memory[key], value));
    }
  }
}
function indexCommitLog(commitLog) {
  const index = /* @__PURE__ */ new Map();
  if (!Array.isArray(commitLog)) return index;
  for (const entry of commitLog) {
    if (!isPlainRecord2(entry)) continue;
    const bundle = entry;
    if (typeof bundle.runtimeStageId !== "string" || bundle.runtimeStageId.length === 0) continue;
    if (!isPlainRecord2(bundle.overwrite) && !isPlainRecord2(bundle.updates) && !Array.isArray(bundle.trace)) {
      continue;
    }
    const list2 = index.get(bundle.runtimeStageId);
    if (list2) list2.push(bundle);
    else index.set(bundle.runtimeStageId, [bundle]);
  }
  return index;
}
function toVisualizationSnapshots(runtime, narrativeEntries) {
  const entries = narrativeEntries?.length ? narrativeEntries : narrativeFromSnapshot(runtime);
  const stageNarrativeMap = entries?.length ? buildStageNarrativeMap(entries) : /* @__PURE__ */ new Map();
  if (runtime?.executionTree === null || typeof runtime?.executionTree !== "object") return [];
  const stageTimings = extractStageTimings(runtime.recorders);
  const commitIndex = indexCommitLog(runtime.commitLog);
  const snapshots = [];
  flattenTree(runtime.executionTree, snapshots, runtime.sharedState, 0, runtime.subflowResults, {}, stageNarrativeMap, stageTimings, commitIndex);
  return snapshots;
}
function readStepDurations(data) {
  if (!isPlainRecord2(data)) return void 0;
  const steps = data.steps;
  if (!isPlainRecord2(steps)) return void 0;
  const first = Object.values(steps)[0];
  if (!isPlainRecord2(first) || typeof first.duration !== "number") return void 0;
  return steps;
}
function readAggregateDurations(data) {
  if (!isPlainRecord2(data)) return void 0;
  const stages = data.stages;
  if (!isPlainRecord2(stages)) return void 0;
  const first = Object.values(stages)[0];
  if (!isPlainRecord2(first) || typeof first.totalDuration !== "number") return void 0;
  return stages;
}
function extractStageTimings(recorders) {
  const byRuntimeStageId = /* @__PURE__ */ new Map();
  const byStageName = /* @__PURE__ */ new Map();
  if (!recorders) return { byRuntimeStageId, byStageName };
  for (const rec of recorders) {
    const steps = readStepDurations(rec?.data);
    if (steps) {
      for (const [runtimeStageId, step] of Object.entries(steps)) {
        const d = step?.duration;
        if (typeof d !== "number" || d <= 0 || byRuntimeStageId.has(runtimeStageId)) continue;
        byRuntimeStageId.set(runtimeStageId, Math.round(d));
      }
    }
    const stages = readAggregateDurations(rec?.data);
    if (stages) {
      for (const [stageName, metrics] of Object.entries(stages)) {
        if (typeof metrics.totalDuration === "number" && metrics.totalDuration > 0) {
          byStageName.set(stageName, Math.round(metrics.totalDuration));
        }
      }
    }
  }
  return { byRuntimeStageId, byStageName };
}
function buildStageNarrativeMap(entries) {
  const map = /* @__PURE__ */ new Map();
  let currentStageName;
  for (const entry of entries) {
    if (entry.stageName) {
      currentStageName = entry.stageName;
    }
    if (currentStageName) {
      if (!map.has(currentStageName)) {
        map.set(currentStageName, []);
      }
      const indent = "  ".repeat(entry.depth);
      map.get(currentStageName).push(`${indent}${entry.text}`);
    }
  }
  return map;
}
function flattenTree(node, out, sharedState, accumulatedMs = 0, subflowResults, cumulativeMemory = {}, stageNarrativeMap = /* @__PURE__ */ new Map(), stageTimings = {
  byRuntimeStageId: /* @__PURE__ */ new Map(),
  byStageName: /* @__PURE__ */ new Map()
}, commitIndex = /* @__PURE__ */ new Map()) {
  const frameFor = (node2, start, inherited) => ({
    node: node2,
    start,
    inherited,
    phase: "enter",
    end: start,
    childrenStart: start,
    childIndex: 0,
    waiting: false
  });
  const frames = [frameFor(node, accumulatedMs, cumulativeMemory)];
  const active = /* @__PURE__ */ new Set();
  const seen = /* @__PURE__ */ new Set();
  let completedMs = accumulatedMs;
  while (frames.length) {
    const frame = frames[frames.length - 1];
    if (frame.phase === "enter") {
      if (active.has(frame.node))
        throw new Error("Recorded stage tree contains a cycle");
      if (seen.has(frame.node))
        throw new Error("Recorded stage tree contains shared nodes");
      seen.add(frame.node);
      active.add(frame.node);
      const node2 = frame.node;
      if (node2.children && !Array.isArray(node2.children))
        throw new Error("Recorded stage tree has an invalid child list");
      const accumulatedMs2 = frame.start;
      const cumulativeMemory2 = frame.inherited;
      const stageName = node2.name ?? node2.id;
      const durationMs = (node2.runtimeStageId ? stageTimings.byRuntimeStageId.get(node2.runtimeStageId) : void 0) ?? (stageName ? stageTimings.byStageName.get(stageName) : void 0) ?? (typeof node2.metrics?.durationMs === "number" ? node2.metrics.durationMs : 0);
      const startMs = accumulatedMs2;
      const stageId = node2.id || node2.name || "unknown";
      const displayName = node2.name || node2.id || "unknown";
      const stageLines = stageNarrativeMap.get(stageId) ?? stageNarrativeMap.get(displayName);
      let narrative;
      if (stageLines) {
        narrative = stageLines.join("\n");
      } else {
        const parts = [`${displayName} executed.`];
        if (node2.description) parts.push(node2.description);
        if (node2.stageWrites) {
          const keys = Object.keys(node2.stageWrites);
          if (keys.length > 0) parts.push(`Wrote: ${keys.join(", ")}`);
        }
        narrative = parts.join("\n");
      }
      const memory = { ...cumulativeMemory2 };
      const bundles = node2.runtimeStageId ? commitIndex.get(node2.runtimeStageId) : void 0;
      if (bundles && bundles.length > 0) {
        for (const bundle of bundles) applyCommitBundle(memory, bundle);
      } else if (node2.stageWrites) {
        for (const [key, value] of Object.entries(node2.stageWrites)) {
          if (UNSAFE_KEYS.has(key)) continue;
          if (value === void 0) {
            delete memory[key];
          } else {
            memory[key] = mergeWritePatch(memory[key], value);
          }
        }
      }
      const sfResult = (node2.runtimeStageId && subflowResults && Object.prototype.hasOwnProperty.call(
        subflowResults,
        node2.runtimeStageId
      ) ? subflowResults[node2.runtimeStageId] : void 0) ?? (subflowResults && Object.prototype.hasOwnProperty.call(
        subflowResults,
        node2.subflowId ?? stageId
      ) ? subflowResults[node2.subflowId ?? stageId] : void 0);
      out.push({
        stageName: displayName,
        stageLabel: stageId,
        runtimeStageId: node2.runtimeStageId ?? void 0,
        memory,
        narrative,
        startMs,
        durationMs,
        status: "done",
        ...node2.description ? { description: node2.description } : void 0,
        ...node2.subflowId ? { subflowId: node2.subflowId } : void 0,
        ...sfResult ? { subflowResult: sfResult } : void 0
      });
      frame.memory = memory;
      frame.end = startMs + durationMs;
      frame.childrenStart = frame.end;
      frame.phase = "children";
    }
    if (frame.phase === "children") {
      if (frame.waiting) {
        frame.end = Math.max(frame.end, completedMs);
        frame.waiting = false;
      }
      if (frame.node.children && frame.childIndex < frame.node.children.length) {
        const child = frame.node.children[frame.childIndex++];
        if (!child || typeof child !== "object")
          throw new Error("Recorded stage tree has an invalid child");
        frame.waiting = true;
        frames.push(frameFor(child, frame.childrenStart, frame.memory));
        continue;
      }
      frame.phase = "continuation";
    }
    if (frame.phase === "continuation" && frame.node.next) {
      frame.phase = "return";
      frames.push(frameFor(frame.node.next, frame.end, frame.memory));
      continue;
    }
    completedMs = frame.phase === "return" ? completedMs : frame.end;
    active.delete(frame.node);
    frames.pop();
  }
  return completedMs;
}
function subflowResultToSnapshots(subflowResult, narrativeEntries, subflowResults) {
  if (!subflowResult || typeof subflowResult !== "object") return [];
  const sf = subflowResult;
  if (!sf.treeContext?.stageContexts) return [];
  const runtime = {
    sharedState: sf.treeContext.globalContext ?? {},
    executionTree: sf.treeContext.stageContexts,
    commitLog: sf.treeContext.history ?? [],
    ...subflowResults ? { subflowResults } : void 0
  };
  const snapshots = toVisualizationSnapshots(runtime, narrativeEntries);
  const prefix = sf.subflowId ? `${sf.subflowId}/` : "";
  if (prefix) {
    for (const snap of snapshots) {
      if (snap.stageName.startsWith(prefix)) {
        snap.stageName = snap.stageName.slice(prefix.length);
      }
      if (snap.stageLabel.startsWith(prefix)) {
        snap.stageLabel = snap.stageLabel.slice(prefix.length);
      }
    }
  }
  return snapshots;
}
function createSnapshots(stages) {
  let accMs = 0;
  return stages.map((s) => {
    const duration = s.durationMs ?? 1;
    const snap = {
      stageName: s.name,
      stageLabel: s.label ?? s.name,
      memory: s.memory ?? {},
      narrative: s.narrative ?? `${s.label ?? s.name} completed.`,
      startMs: accMs,
      durationMs: duration,
      status: "done",
      ...s.description ? { description: s.description } : void 0,
      ...s.subflowId ? { subflowId: s.subflowId } : void 0
    };
    accMs += duration;
    return snap;
  });
}

// src/components/ExplainableShell/_internal/subflowInvocation.ts
function resolveSubflowInvocation(snapshots, mountKey, cursorId, requestedId) {
  const candidates = snapshots.map((snapshot, index) => ({ snapshot, index })).filter(
    ({ snapshot }) => snapshot.subflowId === mountKey || snapshot.runtimeStageId?.split("#")[0] === mountKey
  );
  const ids = candidates.flatMap(
    ({ snapshot }) => snapshot.runtimeStageId ? [snapshot.runtimeStageId] : []
  );
  if (new Set(ids).size !== ids.length) return { kind: "missing" };
  const selected = requestedId ? candidates.find(({ snapshot }) => snapshot.runtimeStageId === requestedId) : candidates.find(
    ({ snapshot }) => snapshot.runtimeStageId === cursorId
  ) ?? (candidates.length === 1 ? candidates[0] : void 0);
  if (selected && !selected.snapshot.subflowResult) return { kind: "missing" };
  if (selected)
    return {
      kind: "found",
      ...selected,
      visit: candidates.indexOf(selected) + 1,
      total: candidates.length
    };
  if (candidates.length > 1)
    return {
      kind: "ambiguous",
      visits: candidates.flatMap(
        ({ snapshot, index }, visit) => snapshot.runtimeStageId ? [
          {
            runtimeStageId: snapshot.runtimeStageId,
            step: index + 1,
            visit: visit + 1,
            total: candidates.length
          }
        ] : []
      )
    };
  return { kind: "missing" };
}
function pathMountChain(path) {
  return path.split("/").map((_, index, parts) => parts.slice(0, index + 1).join("/"));
}

// src/components/ExplainableShell/_internal/subflowRecord.ts
function exactSubflowResults(results) {
  if (!isPlainRecord(results)) return void 0;
  return Object.assign(
    /* @__PURE__ */ Object.create(null),
    Object.fromEntries(
      Object.keys(results).filter((key) => key.includes("#")).map((key) => [key, ownDataField(results, key)])
    )
  );
}
var cache = /* @__PURE__ */ new WeakMap();
function resolveSubflowLevel({
  parent,
  key,
  cursorId,
  parentPath,
  sourceRunId,
  readsAvailable,
  results,
  narrative,
  requestedId
}) {
  const resolution = resolveSubflowInvocation(
    parent,
    key,
    cursorId,
    requestedId
  );
  if (resolution.kind !== "found") return resolution;
  const snapshot = resolution.snapshot;
  const mountRuntimeStageId = snapshot.runtimeStageId;
  if (!mountRuntimeStageId) return { kind: "missing" };
  const invocationPath = [...parentPath, mountRuntimeStageId];
  const result = snapshot.subflowResult;
  if (!result || typeof result !== "object") return { kind: "missing" };
  let cached = cache.get(result);
  if (!cached) {
    cached = /* @__PURE__ */ new Map();
    cache.set(result, cached);
  }
  const cacheKey = JSON.stringify([invocationPath, readsAvailable]);
  let projection = cached.get(cacheKey);
  if (!projection) {
    const scope = childTraceScope(result, invocationPath, readsAvailable);
    let snapshots2 = [];
    try {
      snapshots2 = subflowResultToSnapshots(result);
    } catch {
      return { kind: "conversion-failed" };
    }
    projection = { scope, snapshots: snapshots2 };
    cached.set(cacheKey, projection);
  }
  if (!projection.snapshots.length) return { kind: "missing" };
  const snapshots = projection.snapshots.map((stage) => {
    const child = stage.runtimeStageId ? ownDataField(results, stage.runtimeStageId) : void 0;
    return child ? { ...stage, subflowResult: child } : stage;
  });
  const runtimeIds = new Set(snapshots.map((stage) => stage.runtimeStageId));
  const selectedNarrative = narrative?.filter(
    (entry) => !!entry.runtimeStageId && runtimeIds.has(entry.runtimeStageId)
  );
  const label = snapshot.stageLabel ?? snapshot.stageName ?? key;
  return {
    kind: "found",
    entry: {
      subflowId: key,
      label: resolution.total > 1 ? `${label} \xB7 visit ${resolution.visit} of ${resolution.total}` : label,
      spec: null,
      snapshots,
      narrative: selectedNarrative,
      traceScope: projection.scope,
      sourceRunId,
      parentSnapshotIdx: resolution.index,
      mountRuntimeStageId
    }
  };
}

// src/components/ExplainableShell/_internal/useSubflowNavigation.ts
import { useState as useState9, useMemo as useMemo9, useRef as useRef6, useEffect as useEffect8, useCallback as useCallback4 } from "react";

// src/components/FlowchartView/_internal/subflowDrill.ts
function findMountNode(graph, drillKey) {
  return graph.nodes.find((n) => n.id === drillKey && n.data?.isSubflow === true) ?? graph.nodes.find((n) => n.data?.isSubflow === true && n.data?.subflowId === drillKey);
}
function resolveDrillScope(graph, drillKey) {
  for (const n of graph.nodes) {
    if (n.data?.subflowOf === drillKey) return drillKey;
  }
  const local = graph.nodes.find((n) => n.id === drillKey)?.data?.subflowId;
  if (typeof local === "string" && local !== drillKey) {
    for (const n of graph.nodes) {
      if (n.data?.subflowOf === local) return local;
    }
  }
  const mount = graph.nodes.find(
    (n) => n.data?.isSubflow === true && n.data?.subflowId === drillKey
  );
  if (mount !== void 0 && mount.id !== drillKey) {
    for (const n of graph.nodes) {
      if (n.data?.subflowOf === mount.id) return mount.id;
    }
  }
  return drillKey;
}
function filterGraphForDrill(graph, currentSubflowId) {
  if (graph.nodes.length === 0) return graph;
  const scope = currentSubflowId === null ? null : resolveDrillScope(graph, currentSubflowId);
  const matchesScope = (subflowOf) => scope === null ? subflowOf === void 0 : subflowOf === scope;
  const visibleIds = /* @__PURE__ */ new Set();
  for (const n of graph.nodes) {
    if (matchesScope(n.data?.subflowOf)) visibleIds.add(n.id);
  }
  if (visibleIds.size === graph.nodes.length) return graph;
  return {
    nodes: graph.nodes.filter((n) => visibleIds.has(n.id)),
    edges: graph.edges.filter((e) => visibleIds.has(e.source) && visibleIds.has(e.target))
  };
}
function buildSubflowBreadcrumb(graph, currentSubflowId) {
  const trail = [];
  const seen = /* @__PURE__ */ new Set();
  let key = currentSubflowId ?? void 0;
  while (key !== void 0 && !seen.has(key)) {
    seen.add(key);
    const mount = findMountNode(graph, key);
    if (mount === void 0) {
      trail.unshift({ subflowId: key, label: key });
      break;
    }
    trail.unshift({ subflowId: mount.id, label: mount.data?.label ?? mount.id });
    key = mount.data?.subflowOf;
  }
  return [{ subflowId: null, label: "Chart" }, ...trail];
}

// src/components/ExplainableShell/_internal/useSubflowNavigation.ts
function useSubflowNavigation({
  snapshots,
  sourceRunId,
  readsAvailable,
  exactResults,
  narrativeEntries,
  traceGraph,
  snapshotIdx,
  setSnapshotIdxRaw,
  activeTab,
  onScopeReset
}) {
  const [drillDownStack, setDrillDownStack] = useState9([]);
  const [navigationNotice, setNavigationNotice] = useState9("");
  const [visitChoice, setVisitChoice] = useState9(null);
  const clearTransient = useCallback4(() => {
    setNavigationNotice("");
    setVisitChoice(null);
  }, []);
  const setSnapshotIdx = useCallback4(
    (value) => {
      clearTransient();
      setSnapshotIdxRaw(value);
    },
    [clearTransient, setSnapshotIdxRaw]
  );
  const selectedStack = useMemo9(() => {
    if (drillDownStack.length === 0) return drillDownStack;
    const resolved = [];
    let parent = snapshots;
    for (const previous of drillDownStack) {
      const found = resolveSubflowLevel({
        parent,
        key: previous.subflowId,
        parentPath: resolved.at(-1)?.traceScope.invocationPath ?? [],
        sourceRunId,
        readsAvailable,
        results: exactResults,
        narrative: narrativeEntries,
        requestedId: previous.mountRuntimeStageId
      });
      if (found.kind !== "found") break;
      resolved.push(found.entry);
      parent = found.entry.snapshots;
    }
    return resolved;
  }, [
    drillDownStack,
    sourceRunId,
    snapshots,
    readsAvailable,
    exactResults,
    narrativeEntries
  ]);
  const priorRun = useRef6(sourceRunId);
  const sourceChanged = priorRun.current !== sourceRunId && (typeof sourceRunId === "string" || drillDownStack.length > 0);
  useEffect8(() => {
    if (priorRun.current === sourceRunId) return;
    priorRun.current = sourceRunId;
    if (!drillDownStack.length && typeof sourceRunId !== "string") return;
    onScopeReset();
    clearTransient();
    const moved = selectedStack.length !== drillDownStack.length;
    setDrillDownStack(selectedStack);
    if (moved) {
      const departed = drillDownStack[selectedStack.length];
      setSnapshotIdxRaw(departed?.parentSnapshotIdx ?? 0);
      setNavigationNotice(
        selectedStack.length ? `New run: returned to ${selectedStack.at(-1).label}; the selected visit is not in this run.` : "New run: returned to the root; the selected visit is not in this run."
      );
    }
  }, [
    sourceRunId,
    selectedStack,
    drillDownStack,
    onScopeReset,
    clearTransient,
    setSnapshotIdxRaw
  ]);
  useEffect8(() => {
    clearTransient();
  }, [activeTab, clearTransient]);
  const buildDrillStack = useCallback4(
    (mountKey, selectedInvocations = /* @__PURE__ */ new Map()) => {
      const graphChain = traceGraph ? buildSubflowBreadcrumb(traceGraph, mountKey).slice(1).flatMap((entry) => entry.subflowId ? [entry.subflowId] : []) : [];
      const keys = graphChain.length > 1 ? graphChain : pathMountChain(mountKey);
      const stack = [];
      let parent = snapshots;
      for (const [depth, key] of keys.entries()) {
        const existing = selectedStack[depth];
        const requestedId = selectedInvocations.get(key);
        const parentPath = stack.at(-1)?.traceScope.invocationPath ?? [];
        const existingPath = existing?.traceScope.invocationPath;
        const sameParent = existingPath !== void 0 && existingPath.length === parentPath.length + 1 && parentPath.every((part, index) => existingPath[index] === part);
        if (existing?.subflowId === key && existing.sourceRunId === sourceRunId && sameParent && (!requestedId || requestedId === existing.mountRuntimeStageId)) {
          stack.push(existing);
          parent = existing.snapshots;
          continue;
        }
        const cursorIdx = sameParent ? existing?.parentSnapshotIdx : depth === selectedStack.length ? snapshotIdx : void 0;
        const found = resolveSubflowLevel({
          parent,
          key,
          cursorId: cursorIdx === void 0 ? void 0 : parent[cursorIdx]?.runtimeStageId,
          parentPath,
          sourceRunId,
          readsAvailable,
          results: exactResults,
          narrative: narrativeEntries,
          requestedId
        });
        if (found.kind !== "found")
          return { ...found, mountKey, choiceKey: key, selectedInvocations };
        stack.push(found.entry);
        parent = found.entry.snapshots;
      }
      return { kind: "found", stack };
    },
    [
      traceGraph,
      selectedStack,
      snapshots,
      snapshotIdx,
      sourceRunId,
      readsAvailable,
      exactResults,
      narrativeEntries
    ]
  );
  const applyDrill = useCallback4(
    (mountKey, selectedInvocations = /* @__PURE__ */ new Map()) => {
      const resolution = buildDrillStack(mountKey, selectedInvocations);
      if (resolution.kind === "ambiguous") {
        setVisitChoice({
          mountKey,
          visits: resolution.visits,
          choiceKey: resolution.choiceKey,
          selectedInvocations: resolution.selectedInvocations
        });
        return;
      }
      if (resolution.kind !== "found") {
        setVisitChoice(null);
        setNavigationNotice(
          resolution.kind === "conversion-failed" ? "The recorded invocation could not be drawn. Trace evidence remains unknown." : "That recorded subflow invocation is unavailable."
        );
        return;
      }
      onScopeReset();
      setVisitChoice(null);
      setNavigationNotice("");
      setDrillDownStack(resolution.stack);
      setSnapshotIdxRaw(0);
    },
    [buildDrillStack, onScopeReset, setSnapshotIdxRaw]
  );
  const handleDrillDown = applyDrill;
  const handleBreadcrumbNavigate = useCallback4(
    (level) => {
      onScopeReset();
      setVisitChoice(null);
      const popped = level === 0 ? selectedStack[0] : selectedStack[level];
      if (popped) setSnapshotIdxRaw(popped.parentSnapshotIdx);
      setNavigationNotice("");
      setDrillDownStack(level === 0 ? [] : selectedStack.slice(0, level));
    },
    [selectedStack, onScopeReset, setSnapshotIdxRaw]
  );
  const chartHandledMount = useRef6(null);
  const handleChartSubflowChange = useCallback4(
    (mountKey) => {
      chartHandledMount.current = mountKey;
      queueMicrotask(() => {
        if (chartHandledMount.current === mountKey)
          chartHandledMount.current = null;
      });
      if (mountKey === null) {
        handleBreadcrumbNavigate(0);
        return;
      }
      const at = selectedStack.findIndex(
        (entry) => entry.subflowId === mountKey
      );
      if (at >= 0) {
        if (at < selectedStack.length - 1) handleBreadcrumbNavigate(at + 1);
        return;
      }
      applyDrill(mountKey);
    },
    [selectedStack, handleBreadcrumbNavigate, applyDrill]
  );
  const activeSnapshots = selectedStack.at(-1)?.snapshots ?? snapshots;
  const handleNodeClick = useCallback4(
    (indexOrId) => {
      if (typeof indexOrId === "number") {
        setSnapshotIdx(indexOrId);
        return;
      }
      if (chartHandledMount.current === indexOrId) return;
      const knownMount = activeSnapshots.some(
        (stage) => (stage.subflowId || stage.subflowResult) && (stage.subflowId === indexOrId || stage.runtimeStageId === indexOrId || stage.runtimeStageId?.split("#")[0] === indexOrId)
      ) || traceGraph?.nodes.some(
        (node) => node.id === indexOrId && node.data?.isSubflow === true
      ) || Object.keys(exactResults ?? {}).some(
        (id) => (id === indexOrId || id.split("#")[0] === indexOrId) && exactResults[id] !== null && typeof exactResults[id] === "object"
      );
      if (knownMount) {
        const exactId = exactResults && Object.prototype.hasOwnProperty.call(exactResults, indexOrId) ? indexOrId : void 0;
        const path = exactId ? exactId.split("#")[0] : indexOrId;
        applyDrill(path, exactId ? /* @__PURE__ */ new Map([[path, exactId]]) : void 0);
        return;
      }
      clearTransient();
      const rows = activeSnapshots.map((stage, index) => ({ stage, index }));
      let matches = rows.filter(
        ({ stage }) => stage.runtimeStageId === indexOrId || stage.runtimeStageId?.split("#")[0] === indexOrId
      );
      if (!matches.length)
        matches = rows.filter(
          ({ stage }) => stage.stageLabel === indexOrId || stage.stageName === indexOrId
        );
      const selected = matches.filter(({ index }) => index <= snapshotIdx).at(-1) ?? matches[0];
      if (selected) setSnapshotIdxRaw(selected.index);
    },
    [
      activeSnapshots,
      traceGraph,
      exactResults,
      applyDrill,
      clearTransient,
      setSnapshotIdx,
      snapshotIdx,
      setSnapshotIdxRaw
    ]
  );
  const resetRoot = useCallback4(() => {
    onScopeReset();
    clearTransient();
    setDrillDownStack([]);
  }, [onScopeReset, clearTransient]);
  return {
    sourceChanged,
    selectedStack,
    navigationNotice,
    visitChoice,
    clearTransient,
    setSnapshotIdx,
    resetRoot,
    handleDrillDown,
    handleBreadcrumbNavigate,
    handleChartSubflowChange,
    handleNodeClick,
    applyDrill
  };
}

// src/components/ExplainableShell/_internal/SubflowNavigationStatus.tsx
import { Fragment as Fragment6, jsx as jsx16, jsxs as jsxs14 } from "react/jsx-runtime";
function SubflowNavigationStatus({
  staleInputs,
  notice,
  choice,
  onChoose,
  onDismiss
}) {
  return /* @__PURE__ */ jsxs14(Fragment6, { children: [
    staleInputs && /* @__PURE__ */ jsx16(
      "div",
      {
        "data-fp": "companion-source-note",
        role: "status",
        style: { padding: 10 },
        children: "Some details from the previous run were withheld. Their evidence for this run is unknown."
      }
    ),
    notice && /* @__PURE__ */ jsxs14("div", { "data-fp": "source-change-note", role: "status", style: { padding: 10 }, children: [
      notice,
      " ",
      /* @__PURE__ */ jsx16("button", { type: "button", onClick: onDismiss, children: "Dismiss" })
    ] }),
    choice && /* @__PURE__ */ jsxs14(
      "div",
      {
        "data-fp": "subflow-visit-choice",
        role: "group",
        "aria-label": "Choose subflow visit",
        style: { padding: 10 },
        children: [
          /* @__PURE__ */ jsxs14("div", { children: [
            "This step ran ",
            choice.visits.length,
            " times. Choose a visit:"
          ] }),
          choice.visits.map((visit) => /* @__PURE__ */ jsxs14(
            "button",
            {
              type: "button",
              onClick: () => onChoose(
                choice.mountKey,
                new Map([
                  ...choice.selectedInvocations,
                  [choice.choiceKey, visit.runtimeStageId]
                ])
              ),
              children: [
                "step ",
                visit.step,
                " \xB7 visit ",
                visit.visit,
                " of ",
                visit.total
              ]
            },
            visit.runtimeStageId
          )),
          /* @__PURE__ */ jsx16("button", { type: "button", onClick: onDismiss, children: "Cancel" })
        ]
      }
    )
  ] });
}

// src/components/ExplainableShell/_internal/TraceUnavailableNote.tsx
import { jsx as jsx17, jsxs as jsxs15 } from "react/jsx-runtime";
function TraceUnavailableNote({
  availability,
  scopeLabel = "Child"
}) {
  if (availability.ok) return null;
  const reason = availability.reason === "too-large" ? `${scopeLabel} trace is too large to trace here (more than ${TRACE_WORK_LIMIT.toLocaleString(
    "en-US"
  )} inspected items).` : availability.reason === "no-history" ? `${scopeLabel} trace history was not recorded.` : `${scopeLabel} trace evidence is unavailable or malformed.`;
  return /* @__PURE__ */ jsxs15("div", { "data-fp": "trace-unavailable", role: "status", style: { padding: 14 }, children: [
    reason,
    " Dependencies are unknown.",
    scopeLabel === "Child" && " No parent record was substituted."
  ] });
}
function StoryUnavailableNote() {
  return /* @__PURE__ */ jsx17("div", { "data-fp": "story-narrative", children: /* @__PURE__ */ jsx17("div", { "data-fp": "story-unavailable", role: "status", children: "Story for this source run is unknown until paired narrative is supplied." }) });
}

// src/components/ExplainableShell/_internal/useRunCompanions.ts
import { useState as useState10 } from "react";
function hasPayload(value) {
  return value !== null && typeof value === "object" && (!Array.isArray(value) || value.length > 0);
}
function useRunCompanions(source, inputs) {
  const sourceKey = sourceRunKey(source);
  const runId = typeof sourceKey === "string" ? sourceKey : void 0;
  const [cohort, setCohort] = useState10(() => ({
    runId,
    refs: inputs,
    quarantined: {}
  }));
  let current = cohort;
  const keys = Object.keys(inputs);
  if (cohort.runId !== runId) {
    const quarantined = {};
    for (const key of keys)
      if (hasPayload(inputs[key]) && inputs[key] === cohort.refs[key])
        quarantined[key] = inputs[key];
    current = { runId, refs: inputs, quarantined };
  } else if (keys.some((key) => inputs[key] !== cohort.refs[key]))
    current = { ...cohort, refs: inputs };
  if (current !== cohort) setCohort(current);
  const values = {};
  const staleKeys = [];
  for (const key of keys) {
    if (hasPayload(inputs[key]) && inputs[key] === current.quarantined[key])
      staleKeys.push(key);
    else values[key] = inputs[key];
  }
  return { values, staleKeys };
}

// src/trace/dataTrace.ts
function readsByStep(tree) {
  const byStep = /* @__PURE__ */ new Map();
  if (!tree) return byStep;
  const visited = /* @__PURE__ */ new Set();
  const stack = [tree];
  while (stack.length > 0) {
    const node = stack.pop();
    if (visited.has(node)) continue;
    visited.add(node);
    if (node.runtimeStageId && node.stageReads) {
      const keys = Object.keys(node.stageReads);
      if (keys.length > 0) byStep.set(node.runtimeStageId, keys);
    }
    if (node.next) stack.push(node.next);
    if (node.children) for (const c of node.children) stack.push(c);
  }
  return byStep;
}
function buildDataTrace(commitLog, executionTree, targetRuntimeStageId, maxDepth = 10, maxFrames = 50) {
  const log = commitLog ?? [];
  const reads = readsByStep(executionTree);
  const readsAvailable = reads.size > 0;
  if (!log.length) return { frames: [], readsAvailable };
  const idxOf = /* @__PURE__ */ new Map();
  for (let i = 0; i < log.length; i++) idxOf.set(log[i].runtimeStageId, i);
  const startIdx = idxOf.get(targetRuntimeStageId);
  if (startIdx === void 0) return { frames: [], readsAvailable };
  const tracedPaths = (entry) => entry.trace ?? [];
  const findLastWriter = (key, beforeIdx) => {
    for (let i = beforeIdx - 1; i >= 0; i--) {
      if (tracedPaths(log[i]).some((t) => t.path === key)) return i;
    }
    return -1;
  };
  const frames = [];
  const visited = /* @__PURE__ */ new Set();
  const queue = [[startIdx, 0, ""]];
  while (queue.length > 0 && frames.length < maxFrames) {
    const [idx, depth, linkedBy] = queue.shift();
    const commit = log[idx];
    if (visited.has(commit.runtimeStageId)) continue;
    visited.add(commit.runtimeStageId);
    frames.push({
      runtimeStageId: commit.runtimeStageId,
      stageId: commit.stageId,
      stageName: commit.stage,
      keysWritten: tracedPaths(commit).map((t) => t.path),
      linkedBy,
      depth
    });
    if (depth >= maxDepth) continue;
    for (const key of reads.get(commit.runtimeStageId) ?? []) {
      const writerIdx = findLastWriter(key, idx);
      if (writerIdx >= 0 && !visited.has(log[writerIdx].runtimeStageId)) {
        queue.push([writerIdx, depth + 1, key]);
      }
    }
  }
  return { frames, readsAvailable };
}

// src/trace/walkScope.ts
function snapshotWalkScope(value) {
  try {
    const budget = new WorkBudget();
    if (!isPlainRecord(value)) throw new Error();
    const invocationPath = readOwnArray(
      optionalOwnDataField(value, "invocationPath"),
      budget
    ).map(readName);
    if (invocationPath.length > 128 || invocationPath.join("").length > 8192)
      throw new Error();
    const sourceLabels = optionalOwnDataField(value, "mountLabels");
    let mountLabels;
    if (sourceLabels !== void 0) {
      if (!isPlainRecord(sourceLabels)) throw new Error();
      const names = Object.keys(sourceLabels);
      budget.spend(names.length);
      mountLabels = Object.freeze(
        Object.fromEntries(
          names.map((name) => [
            readName(name),
            readName(optionalOwnDataField(sourceLabels, name))
          ])
        )
      );
    }
    const sourceKeys = optionalOwnDataField(value, "startKeys");
    const startKeys = sourceKeys === void 0 ? void 0 : Object.freeze(readOwnArray(sourceKeys, budget).map(readName));
    const readsAvailable = optionalOwnDataField(value, "readsAvailable");
    if (readsAvailable !== void 0 && typeof readsAvailable !== "boolean")
      throw new Error();
    return Object.freeze({
      invocationPath: Object.freeze(invocationPath),
      ...mountLabels === void 0 ? {} : { mountLabels },
      ...startKeys === void 0 ? {} : { startKeys },
      ...readsAvailable === void 0 ? {} : { readsAvailable }
    });
  } catch {
    throw new TypeError(
      "Trace scope must contain only bounded recorded names and flags."
    );
  }
}

// src/trace/tracePresentation.ts
function scopeSentence(scope) {
  return scope?.invocationPath.length ? `Tracing subflow invocation ${scope.invocationPath.join(
    " \u2192 "
  )}. Parent ancestry is unknown.` : void 0;
}
var START_SENTENCE = "recorded at invocation start; earlier origin unknown";
function inputSentence(scope, key) {
  return scope?.startKeys?.includes(key) ? START_SENTENCE : "no recorded write; value unknown";
}
function isInvocationStart(scope, runtimeStageId) {
  return !!scope?.invocationPath.length && (runtimeStageId === scope.invocationPath[scope.invocationPath.length - 1] || runtimeStageId === "");
}
function mountLabel(scope, runtimeStageId) {
  if (!scope?.mountLabels) return void 0;
  const descriptor = Object.getOwnPropertyDescriptor(
    scope.mountLabels,
    runtimeStageId
  );
  return descriptor && "value" in descriptor && typeof descriptor.value === "string" ? descriptor.value : void 0;
}

// src/trace/traceWalk.ts
var DEFAULT_MAX_DEPTH = 10;
var DEFAULT_MAX_FRAMES = 50;
function buildTraceWalk(commitLog, executionTree, key, opts) {
  const root = opts?.scope === void 0 ? rootMountLabels(executionTree) : void 0;
  const inferred = root?.availability.ok && root.labels.size > 0 ? { invocationPath: [], mountLabels: Object.fromEntries(root.labels) } : void 0;
  const selectedScope = opts?.scope ?? inferred;
  const scope = selectedScope === void 0 ? void 0 : snapshotWalkScope(selectedScope);
  const scoped = scope === void 0 ? {} : { scope };
  let log;
  try {
    if (root && !root.availability.ok) throw new Error("Unavailable tree evidence");
    const budget = new WorkBudget();
    log = readOwnArray(commitLog ?? [], budget).map((entry) => ({
      stage: ownDataField(entry, "stage"),
      stageId: ownDataField(entry, "stageId"),
      runtimeStageId: ownDataField(entry, "runtimeStageId"),
      trace: readOwnArray(ownDataField(entry, "trace"), budget).map((write) => ({
        path: readName(ownDataField(write, "path"))
      }))
    }));
  } catch {
    return {
      key,
      stops: [],
      missing: { reason: "evidence-unavailable" },
      inputTermini: [],
      readsAvailable: false,
      truncated: false,
      ...scoped
    };
  }
  const cutoff = opts?.beforeCommitIdx ?? log.length;
  const maxDepth = opts?.maxDepth ?? DEFAULT_MAX_DEPTH;
  const maxFrames = opts?.maxFrames ?? DEFAULT_MAX_FRAMES;
  const writerOf = (k, beforeIdx) => {
    for (let i = Math.min(beforeIdx, log.length) - 1; i >= 0; i--) {
      if (log[i].trace.some((t) => t.path === k)) return i;
    }
    return -1;
  };
  const anchorIdx = writerOf(key, cutoff);
  if (anchorIdx < 0) {
    const firstEver = log.findIndex((c) => c.trace.some((t) => t.path === key));
    const missing = firstEver < 0 ? { reason: "never-written" } : {
      reason: "not-yet-written",
      firstWriteCommitIdx: firstEver,
      firstWriterRuntimeStageId: log[firstEver].runtimeStageId,
      firstWriterStageName: log[firstEver].stage
    };
    return {
      key,
      stops: [],
      missing,
      inputTermini: [],
      readsAvailable: scope?.readsAvailable ?? true,
      truncated: false,
      ...scoped
    };
  }
  const slice = buildDataTrace(
    log.slice(0, anchorIdx + 1),
    executionTree,
    log[anchorIdx].runtimeStageId,
    maxDepth,
    maxFrames + 1
  );
  const truncated = slice.frames.length > maxFrames;
  const frames = truncated ? slice.frames.slice(0, maxFrames) : slice.frames;
  const idxOf = /* @__PURE__ */ new Map();
  for (let i = 0; i < log.length; i++) idxOf.set(log[i].runtimeStageId, i);
  const readsOf = readKeysByStep(executionTree);
  const inputTermini = [];
  const terminiSeen = /* @__PURE__ */ new Set();
  const stops = frames.map((f) => {
    const commitIdx = idxOf.get(f.runtimeStageId) ?? -1;
    const ingredients = (readsOf.get(f.runtimeStageId) ?? []).map((k) => {
      const w = writerOf(k, commitIdx);
      if (w < 0 && !terminiSeen.has(k)) {
        terminiSeen.add(k);
        inputTermini.push(k);
      }
      return {
        key: k,
        writerRuntimeStageId: w >= 0 ? log[w].runtimeStageId : null,
        writerStageName: w >= 0 ? log[w].stage : null,
        writerCommitIdx: w >= 0 ? w : null
      };
    });
    return {
      runtimeStageId: f.runtimeStageId,
      stageId: f.stageId,
      stageName: f.stageName,
      commitIdx,
      contributedKeys: [],
      keysWritten: f.keysWritten,
      ingredients,
      depth: f.depth,
      loopPass: 0
    };
  });
  const stopById = new Map(stops.map((s) => [s.runtimeStageId, s]));
  const contributed = /* @__PURE__ */ new Map();
  contributed.set(log[anchorIdx].runtimeStageId, /* @__PURE__ */ new Set([key]));
  for (const s of stops) {
    for (const ing of s.ingredients) {
      if (!ing.writerRuntimeStageId || !stopById.has(ing.writerRuntimeStageId))
        continue;
      const set = contributed.get(ing.writerRuntimeStageId) ?? /* @__PURE__ */ new Set();
      set.add(ing.key);
      contributed.set(ing.writerRuntimeStageId, set);
    }
  }
  for (const s of stops)
    s.contributedKeys = [...contributed.get(s.runtimeStageId) ?? []];
  stops.sort((a, b) => b.commitIdx - a.commitIdx);
  const byStagePart = /* @__PURE__ */ new Map();
  for (const s of stops) {
    const part = s.runtimeStageId.split("#")[0];
    const arr = byStagePart.get(part) ?? [];
    arr.push(s);
    byStagePart.set(part, arr);
  }
  for (const arr of byStagePart.values()) {
    if (arr.length < 2) continue;
    for (let i = 0; i < arr.length; i++) arr[i].loopPass = arr.length - i;
  }
  return {
    key,
    stops,
    missing: null,
    inputTermini,
    readsAvailable: scope?.readsAvailable ?? slice.readsAvailable,
    truncated,
    ...scoped
  };
}
function readKeysByStep(tree) {
  const byStep = /* @__PURE__ */ new Map();
  const root = tree;
  if (!root) return byStep;
  const visited = /* @__PURE__ */ new Set();
  const stack = [root];
  while (stack.length > 0) {
    const node = stack.pop();
    if (visited.has(node)) continue;
    visited.add(node);
    if (node.runtimeStageId && node.stageReads) {
      const keys = Object.keys(node.stageReads);
      if (keys.length > 0) byStep.set(node.runtimeStageId, keys);
    }
    if (node.next) stack.push(node.next);
    if (node.children) for (const c of node.children) stack.push(c);
  }
  return byStep;
}
function formatTraceWalk(walk, stepNumberOf, options) {
  const selectedScope = options?.scope ?? walk.scope;
  const presentation = selectedScope === void 0 ? void 0 : snapshotWalkScope(selectedScope);
  const readsAvailable = presentation?.readsAvailable ?? walk.readsAvailable;
  const scope = scopeSentence(presentation);
  const lines = scope ? [scope] : [];
  if (walk.missing) {
    if (walk.missing.reason === "evidence-unavailable") {
      lines.push(`\`${walk.key}\`: write evidence is unavailable; value origin unknown.`);
    } else if (walk.missing.reason === "never-written") {
      lines.push(`\`${walk.key}\`: ${inputSentence(presentation, walk.key)}.`);
    } else {
      const at = walk.missing.firstWriterRuntimeStageId ? stepNumberOf(walk.missing.firstWriterRuntimeStageId) : null;
      lines.push(
        `\`${walk.key}\` has not been written yet at this moment \u2014 its first write happens later` + (walk.missing.firstWriterStageName ? `, at ${walk.missing.firstWriterStageName}${at ? ` (step ${at})` : ""}.` : ".")
      );
    }
    return lines.join("\n");
  }
  lines.push(
    `Tracing \`${walk.key}\` \u2014 ${walk.stops.length} stops, newest first.`
  );
  walk.stops.forEach((stop, i) => {
    const step = stepNumberOf(stop.runtimeStageId);
    const pass = stop.loopPass > 0 ? ` (pass ${stop.loopPass})` : "";
    const boundary = mountLabel(presentation, stop.runtimeStageId);
    const made = isInvocationStart(presentation, stop.runtimeStageId) ? ` \xB7 ${START_SENTENCE}` : boundary ? ` \xB7 computed inside ${boundary}; drill in to trace it` : stop.ingredients.length > 0 ? ` \xB7 made from: ${stop.ingredients.map(
      (ing) => ing.writerRuntimeStageId ? `${ing.key} (\u2190 ${ing.writerStageName}${stepNumberOf(ing.writerRuntimeStageId) ? `, step ${stepNumberOf(ing.writerRuntimeStageId)}` : ""})` : `${ing.key} (${inputSentence(presentation, ing.key)})`
    ).join(", ")}` : readsAvailable ? " \xB7 reads nothing \u2014 origin" : "";
    lines.push(
      `stop ${i + 1}/${walk.stops.length} \xB7 ${step ? `step ${step} \xB7 ` : ""}${stop.stageName}${pass} wrote \`${stop.contributedKeys.join("`, `")}\`${made}`
    );
  });
  if (walk.inputTermini.length > 0) {
    lines.push(`No local writer: ${walk.inputTermini.map((key) => `${key} (${inputSentence(presentation, key)})`).join(", ")}`);
  }
  if (!readsAvailable) {
    lines.push(
      "\u26A0 reads were not recorded \u2014 dependencies are unknowable, not absent."
    );
  }
  if (walk.truncated) {
    lines.push(
      "\u26A0 walk truncated at its frame budget \u2014 the earliest stop may not be the true origin."
    );
  }
  return lines.join("\n");
}

// src/components/DataTracePanel/TraceWalkCard.tsx
import { memo, useMemo as useMemo10, useState as useState11 } from "react";
import { Fragment as Fragment7, jsx as jsx18, jsxs as jsxs16 } from "react/jsx-runtime";
var CHIP_COLORS = [
  v("--fp-chip-1", "#0d9488"),
  v("--fp-chip-2", "#d97706"),
  v("--fp-chip-3", "#7c3aed"),
  v("--fp-chip-4", "#e11d48")
];
var PAINT = (s) => s;
var BARE = () => void 0;
var TraceWalkCard = memo(function TraceWalkCard2({
  walk,
  cursorRuntimeStageId,
  viaKey,
  stepNumberOf,
  previewValueOf,
  onFollowIngredient,
  onJumpToStop,
  onShowAll,
  onExit,
  forkChooserOpen,
  onContinueTimeOrder,
  canContinueTimeOrder = true,
  size = "default",
  unstyled = false,
  className,
  style
}) {
  const presentation = walk.scope;
  const fs = fontSize[size];
  const sx = unstyled ? BARE : PAINT;
  const [copied, setCopied] = useState11(false);
  const accent = "var(--fp-accent, #6366f1)";
  const tracingColor = "var(--fp-tracing, #0d9488)";
  const currentIdx = useMemo10(() => {
    if (!cursorRuntimeStageId) return 0;
    const i = walk.stops.findIndex((s) => s.runtimeStageId === cursorRuntimeStageId);
    return i >= 0 ? i : 0;
  }, [walk, cursorRuntimeStageId]);
  const current = walk.stops[currentIdx];
  const boundary = mountLabel(presentation, current?.runtimeStageId ?? "");
  const atInvocationStart = isInvocationStart(presentation, current?.runtimeStageId ?? "");
  const followableCount = current ? current.ingredients.filter((ing) => ing.writerRuntimeStageId !== null).length : 0;
  const chooserVisible = !!forkChooserOpen && followableCount >= 2;
  const inputLabel = inputSentence(presentation, walk.key);
  const copyStory = () => {
    const text3 = formatTraceWalk(walk, stepNumberOf);
    void navigator.clipboard?.writeText(text3).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  };
  if (walk.missing) {
    return /* @__PURE__ */ jsxs16(
      "div",
      {
        className,
        "data-fp": "trace-walk-card",
        "data-missing": walk.missing.reason,
        style: { ...sx({ padding: "14px", fontSize: fs.body + 1, lineHeight: 1.55 }), ...style },
        children: [
          /* @__PURE__ */ jsx18(CardHeader, { label: `Why this value \u2014 \`${walk.key}\``, onExit, sx, fs }),
          scopeSentence(presentation) && /* @__PURE__ */ jsx18("div", { "data-fp": "trace-scope-note", children: scopeSentence(presentation) }),
          /* @__PURE__ */ jsx18("div", { style: sx({ color: theme.textPrimary, marginTop: 8 }), children: walk.missing.reason === "evidence-unavailable" ? /* @__PURE__ */ jsxs16(Fragment7, { children: [
            /* @__PURE__ */ jsx18("code", { children: walk.key }),
            ": write evidence is unavailable; value origin unknown."
          ] }) : walk.missing.reason === "never-written" ? /* @__PURE__ */ jsxs16(Fragment7, { children: [
            /* @__PURE__ */ jsx18("code", { style: sx({ color: accent }), children: walk.key }),
            ": ",
            inputLabel,
            "."
          ] }) : /* @__PURE__ */ jsxs16(Fragment7, { children: [
            /* @__PURE__ */ jsx18("code", { style: sx({ color: accent }), children: walk.key }),
            " has ",
            /* @__PURE__ */ jsx18("b", { children: "not been written yet at this moment" }),
            " \u2014 its first write happens later",
            walk.missing.firstWriterStageName && /* @__PURE__ */ jsxs16(Fragment7, { children: [
              ", at ",
              /* @__PURE__ */ jsx18("b", { children: walk.missing.firstWriterStageName }),
              walk.missing.firstWriterRuntimeStageId && stepNumberOf(walk.missing.firstWriterRuntimeStageId) && /* @__PURE__ */ jsxs16(Fragment7, { children: [
                " (step ",
                stepNumberOf(walk.missing.firstWriterRuntimeStageId),
                ")"
              ] })
            ] }),
            "."
          ] }) })
        ]
      }
    );
  }
  if (!current) return null;
  const step = stepNumberOf(current.runtimeStageId);
  const preview = previewValueOf ? previewValue(previewValueOf(current.contributedKeys[0] ?? walk.key)) : null;
  return /* @__PURE__ */ jsxs16(
    "div",
    {
      className,
      "data-fp": "trace-walk-card",
      style: { ...sx({ padding: "10px 14px 14px", fontSize: fs.body + 1, lineHeight: 1.5 }), ...style },
      children: [
        /* @__PURE__ */ jsx18(
          CardHeader,
          {
            label: `Why this value \u2014 stop ${currentIdx + 1} of ${walk.stops.length}`,
            onExit,
            sx,
            fs
          }
        ),
        viaKey && /* @__PURE__ */ jsxs16("div", { "data-fp": "twc-breadcrumb", style: sx({ fontSize: fs.label, color: theme.textMuted, marginTop: 4 }), children: [
          /* @__PURE__ */ jsx18("code", { style: sx({ color: accent }), children: walk.key }),
          " \u25B8 via ",
          /* @__PURE__ */ jsx18("code", { children: viaKey }),
          onShowAll && /* @__PURE__ */ jsxs16(Fragment7, { children: [
            " \xB7 ",
            /* @__PURE__ */ jsx18(
              "button",
              {
                onClick: onShowAll,
                style: sx({ border: "none", background: "transparent", color: accent, cursor: "pointer", fontSize: fs.label, textDecoration: "underline", padding: 0 }),
                children: "show all ingredients"
              }
            )
          ] })
        ] }),
        scopeSentence(presentation) && /* @__PURE__ */ jsx18("div", { "data-fp": "trace-scope-note", children: scopeSentence(presentation) }),
        /* @__PURE__ */ jsxs16("div", { "data-fp": "twc-stop-headline", style: sx({ marginTop: 10, fontWeight: 600, color: theme.textPrimary }), children: [
          step && /* @__PURE__ */ jsxs16("span", { style: sx({ color: theme.textMuted, fontWeight: 500 }), children: [
            "Step ",
            step,
            " \xB7 "
          ] }),
          current.stageName,
          current.loopPass > 0 && /* @__PURE__ */ jsxs16("span", { style: sx({ color: theme.textMuted, fontWeight: 500 }), children: [
            " (pass ",
            current.loopPass,
            ")"
          ] })
        ] }),
        /* @__PURE__ */ jsxs16("div", { style: sx({ marginTop: 2, color: theme.textSecondary }), children: [
          "wrote",
          " ",
          current.contributedKeys.map((k, i) => /* @__PURE__ */ jsxs16("code", { style: sx({ color: accent }), children: [
            i > 0 && ", ",
            k
          ] }, k)),
          preview !== null && /* @__PURE__ */ jsxs16("span", { style: sx({ color: theme.textMuted }), children: [
            " = ",
            preview
          ] })
        ] }),
        chooserVisible && /* @__PURE__ */ jsxs16(
          "div",
          {
            "data-fp": "twc-fork-chooser",
            style: sx({
              marginTop: 10,
              padding: "10px 12px",
              border: `1.5px solid ${tracingColor}`,
              borderRadius: 8,
              background: `color-mix(in srgb, ${tracingColor} 8%, transparent)`
            }),
            children: [
              /* @__PURE__ */ jsxs16("div", { style: sx({ fontWeight: 600, fontSize: fs.body, color: theme.textPrimary }), children: [
                "This value was made from ",
                current.ingredients.length,
                " ingredients \u2014 which one should the walk follow?"
              ] }),
              /* @__PURE__ */ jsx18("div", { style: sx({ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }), children: current.ingredients.map((ing, i) => /* @__PURE__ */ jsx18(
                IngredientChip,
                {
                  ing,
                  color: i < CHIP_COLORS.length ? CHIP_COLORS[i] : theme.textMuted,
                  step: ing.writerRuntimeStageId ? stepNumberOf(ing.writerRuntimeStageId) : null,
                  onFollow: onFollowIngredient,
                  sx,
                  fs,
                  inputLabel: inputSentence(presentation, ing.key)
                },
                ing.key
              )) }),
              /* @__PURE__ */ jsx18(
                "button",
                {
                  "data-fp": "twc-continue-time",
                  onClick: canContinueTimeOrder ? onContinueTimeOrder : void 0,
                  disabled: !canContinueTimeOrder,
                  title: canContinueTimeOrder ? void 0 : "This is the walk's earliest stop \u2014 there is nothing earlier to visit",
                  style: sx({
                    display: "block",
                    width: "100%",
                    marginTop: 8,
                    border: `1px solid ${theme.border}`,
                    background: theme.bgTertiary,
                    color: theme.textPrimary,
                    borderRadius: 6,
                    padding: "5px 10px",
                    fontSize: fs.label,
                    fontWeight: 600,
                    cursor: "pointer"
                  }),
                  children: "visit all, oldest cause last (time order)"
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ jsx18("div", { style: sx({ marginTop: 10 }), children: atInvocationStart ? /* @__PURE__ */ jsxs16("div", { "data-fp": "twc-boundary", children: [
          START_SENTENCE,
          "."
        ] }) : boundary ? /* @__PURE__ */ jsxs16("div", { "data-fp": "twc-boundary", children: [
          "computed inside ",
          boundary,
          "; drill in to trace it."
        ] }) : chooserVisible ? null : current.ingredients.length > 0 ? /* @__PURE__ */ jsxs16(Fragment7, { children: [
          /* @__PURE__ */ jsxs16("div", { style: sx({ fontSize: fs.label, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }), children: [
            "Made from ",
            current.ingredients.length,
            " ingredient",
            current.ingredients.length > 1 ? "s" : ""
          ] }),
          /* @__PURE__ */ jsx18("div", { style: sx({ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }), children: current.ingredients.map((ing, i) => /* @__PURE__ */ jsx18(
            IngredientChip,
            {
              ing,
              color: i < CHIP_COLORS.length ? CHIP_COLORS[i] : theme.textMuted,
              step: ing.writerRuntimeStageId ? stepNumberOf(ing.writerRuntimeStageId) : null,
              onFollow: onFollowIngredient,
              sx,
              fs,
              inputLabel: inputSentence(presentation, ing.key)
            },
            ing.key
          )) })
        ] }) : walk.readsAvailable ? /* @__PURE__ */ jsx18("div", { "data-fp": "twc-origin", style: sx({ fontSize: fs.body, color: theme.textMuted, fontStyle: "italic" }), children: "reads nothing \u2014 this is an origin." }) : /* @__PURE__ */ jsx18("div", { "data-fp": "twc-unknowable", style: sx({ fontSize: fs.body, color: theme.textMuted, fontStyle: "italic" }), children: "\u26A0 reads were not recorded \u2014 ingredients are unknowable, not absent." }) }),
        /* @__PURE__ */ jsxs16("div", { style: sx({ marginTop: 14 }), children: [
          /* @__PURE__ */ jsx18("div", { style: sx({ fontSize: fs.label, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600, marginBottom: 4 }), children: "The story, newest first" }),
          walk.stops.map((s, i) => {
            const isCurrent = i === currentIdx;
            return /* @__PURE__ */ jsxs16(
              "button",
              {
                "data-fp": "twc-itinerary-row",
                "data-current": isCurrent || void 0,
                onClick: () => onJumpToStop?.(s.runtimeStageId),
                style: sx({
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  border: "none",
                  borderLeft: isCurrent ? `3px solid ${accent}` : "3px solid transparent",
                  background: isCurrent ? "var(--fp-accent-bg, rgba(99,102,241,0.12))" : "transparent",
                  padding: "4px 8px",
                  cursor: onJumpToStop ? "pointer" : "default",
                  color: "inherit",
                  fontSize: fs.body
                }),
                children: [
                  /* @__PURE__ */ jsxs16("span", { style: sx({ color: theme.textMuted }), children: [
                    i + 1,
                    "."
                  ] }),
                  " ",
                  /* @__PURE__ */ jsx18("code", { style: sx({ color: accent }), children: s.contributedKeys.join(", ") }),
                  /* @__PURE__ */ jsx18("span", { style: sx({ color: theme.textMuted }), children: " \u2190 " }),
                  s.stageName,
                  s.loopPass > 0 && /* @__PURE__ */ jsxs16("span", { style: sx({ color: theme.textMuted }), children: [
                    " (pass ",
                    s.loopPass,
                    ")"
                  ] }),
                  stepNumberOf(s.runtimeStageId) && /* @__PURE__ */ jsxs16("span", { style: sx({ color: theme.textMuted }), children: [
                    " \xB7 step ",
                    stepNumberOf(s.runtimeStageId)
                  ] }),
                  s.ingredients.length > 1 && /* @__PURE__ */ jsxs16("span", { style: sx({ color: theme.warning, fontWeight: 600 }), children: [
                    " \u2442 ",
                    s.ingredients.length
                  ] })
                ]
              },
              s.runtimeStageId
            );
          })
        ] }),
        /* @__PURE__ */ jsxs16("div", { style: sx({ marginTop: 12, display: "flex", flexDirection: "column", gap: 4 }), children: [
          walk.inputTermini.length > 0 && /* @__PURE__ */ jsxs16("div", { "data-fp": "twc-run-inputs", style: sx({ fontSize: fs.label, color: theme.textMuted }), children: [
            "\u2691 No local writer: ",
            walk.inputTermini.map((k, i) => /* @__PURE__ */ jsxs16("span", { children: [
              i > 0 && ", ",
              /* @__PURE__ */ jsx18("code", { children: k }),
              " (",
              inputSentence(presentation, k),
              ")"
            ] }, k))
          ] }),
          walk.truncated && /* @__PURE__ */ jsx18("div", { "data-fp": "twc-truncated", style: sx({ fontSize: fs.label, color: theme.warning }), children: "\u26A0 walk truncated at its frame budget \u2014 the earliest stop may not be the true origin." }),
          /* @__PURE__ */ jsx18(
            "button",
            {
              "data-fp": "twc-copy-story",
              onClick: copyStory,
              style: sx({
                alignSelf: "flex-start",
                marginTop: 4,
                border: `1px solid ${theme.border}`,
                background: theme.bgTertiary,
                color: theme.textPrimary,
                borderRadius: 6,
                padding: "4px 10px",
                fontSize: fs.label,
                fontWeight: 600,
                cursor: "pointer"
              }),
              children: copied ? "Copied \u2713" : "Copy story"
            }
          )
        ] })
      ]
    }
  );
});
function CardHeader({
  label,
  onExit,
  sx,
  fs
}) {
  return /* @__PURE__ */ jsxs16("div", { style: sx({ display: "flex", alignItems: "center", justifyContent: "space-between" }), children: [
    /* @__PURE__ */ jsx18("div", { style: sx({ fontSize: fs.label, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }), children: label }),
    onExit && /* @__PURE__ */ jsx18(
      "button",
      {
        "data-fp": "twc-exit",
        onClick: onExit,
        "aria-label": "Exit tracing",
        style: sx({ border: "none", background: "transparent", color: theme.textMuted, cursor: "pointer", fontSize: fs.body }),
        children: "Done \u2715"
      }
    )
  ] });
}
function IngredientChip({
  ing,
  color,
  step,
  onFollow,
  sx,
  fs,
  inputLabel
}) {
  const terminus = !ing.writerRuntimeStageId;
  return /* @__PURE__ */ jsxs16(
    "button",
    {
      "data-fp": "twc-ingredient",
      "data-terminus": terminus || void 0,
      disabled: terminus || !onFollow,
      onClick: () => onFollow?.(ing),
      title: terminus ? `${ing.key}: ${inputLabel}` : `Follow ${ing.key} \u2014 re-anchor the walk on its writer`,
      style: sx({
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        border: `1px solid ${terminus ? theme.border : color}`,
        background: "transparent",
        color: terminus ? theme.textMuted : color,
        borderRadius: 12,
        padding: "3px 10px",
        fontSize: fs.label,
        fontWeight: 600,
        cursor: terminus || !onFollow ? "default" : "pointer"
      }),
      children: [
        /* @__PURE__ */ jsx18("code", { children: ing.key }),
        terminus ? /* @__PURE__ */ jsxs16("span", { style: sx({ fontWeight: 400 }), children: [
          "\u2014 ",
          inputLabel,
          " \u2691"
        ] }) : /* @__PURE__ */ jsxs16("span", { style: sx({ fontWeight: 400 }), children: [
          "\u2190 ",
          ing.writerStageName,
          step && ` \xB7 step ${step}`
        ] })
      ]
    }
  );
}
function previewValue(v2) {
  if (v2 === void 0) return null;
  try {
    const s = typeof v2 === "string" ? JSON.stringify(v2) : JSON.stringify(v2);
    if (s === void 0) return null;
    return s.length > 60 ? `${s.slice(0, 57)}\u2026` : s;
  } catch {
    return null;
  }
}

// src/components/DataTracePanel/DataTracePanel.tsx
import { memo as memo2 } from "react";
import { jsx as jsx19, jsxs as jsxs17 } from "react/jsx-runtime";
var DataTracePanel = memo2(function DataTracePanel2({
  frames,
  selectedStageId,
  onFrameClick,
  fromStageName,
  note,
  size = "default",
  unstyled = false,
  className,
  style
}) {
  const fs = fontSize[size];
  const pad = padding[size];
  const base = fs.body + 1;
  const sx = (s) => unstyled ? void 0 : s;
  const noteLine = note ? /* @__PURE__ */ jsx19("div", { style: sx({ color: theme.textMuted, fontSize: fs.label, fontStyle: "italic", marginBottom: 8 }), children: note }) : null;
  if (frames.length === 0) {
    return /* @__PURE__ */ jsxs17(
      "div",
      {
        className,
        "data-fp": "data-trace-panel",
        style: { ...sx({ padding: `${pad + 2}px ${pad + 2}px ${pad}px`, fontSize: base, lineHeight: 1.55 }), ...style },
        children: [
          /* @__PURE__ */ jsx19(
            "div",
            {
              style: sx({
                fontSize: fs.label,
                color: theme.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                fontWeight: 600,
                marginBottom: 6
              }),
              children: "Backward causal chain"
            }
          ),
          /* @__PURE__ */ jsx19("div", { style: sx({ color: theme.textSecondary, marginBottom: 10 }), children: "Trace any value back to the stage that created it \u2014 and everything upstream that influenced it." }),
          noteLine,
          /* @__PURE__ */ jsx19("div", { style: sx({ color: theme.textMuted, fontSize: fs.body }), children: "Select a stage above to see its dependency chain." })
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxs17(
    "div",
    {
      className,
      "data-fp": "data-trace-panel",
      style: { ...sx({ padding: "8px 0", fontSize: base }), ...style },
      children: [
        note && /* @__PURE__ */ jsx19("div", { style: sx({ padding: "4px 12px 0", fontSize: fs.label, color: theme.textMuted, fontStyle: "italic" }), children: note }),
        fromStageName && /* @__PURE__ */ jsxs17("div", { style: sx({ padding: "4px 12px 8px" }), children: [
          /* @__PURE__ */ jsxs17(
            "div",
            {
              style: sx({
                fontSize: fs.label,
                color: theme.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                fontWeight: 600
              }),
              children: [
                "Data trace from ",
                fromStageName
              ]
            }
          ),
          /* @__PURE__ */ jsx19(
            "div",
            {
              style: sx({
                fontSize: fs.label,
                color: theme.textMuted,
                fontStyle: "italic",
                marginTop: 3
              }),
              children: "Every value here was derived from the stages below."
            }
          )
        ] }),
        frames.map((frame, i) => /* @__PURE__ */ jsx19(
          DataTraceFrame,
          {
            frame,
            isFirst: i === 0,
            isLast: i === frames.length - 1,
            isSelected: frame.runtimeStageId === selectedStageId,
            onClick: onFrameClick,
            unstyled,
            size
          },
          frame.runtimeStageId
        ))
      ]
    }
  );
});
var DataTraceFrame = memo2(function DataTraceFrame2({
  frame,
  isFirst,
  isLast,
  isSelected,
  onClick,
  unstyled = false,
  size = "default"
}) {
  const fs = fontSize[size];
  const sx = (s) => unstyled ? void 0 : s;
  return /* @__PURE__ */ jsxs17(
    "button",
    {
      onClick: () => onClick?.(frame.runtimeStageId),
      "data-fp": "data-trace-frame",
      "data-selected": isSelected || void 0,
      style: sx({
        display: "block",
        width: "100%",
        textAlign: "left",
        border: "none",
        background: isSelected ? "var(--fp-accent-bg, rgba(99,102,241,0.12))" : "transparent",
        padding: "6px 12px 6px 16px",
        cursor: onClick ? "pointer" : "default",
        borderLeft: isSelected ? "3px solid var(--fp-accent, #6366f1)" : "3px solid transparent",
        color: "inherit",
        fontSize: fs.body + 1
      }),
      children: [
        /* @__PURE__ */ jsxs17("div", { style: sx({ display: "flex", alignItems: "center", gap: 6 }), children: [
          !isFirst && /* @__PURE__ */ jsx19("span", { style: sx({ color: theme.textMuted, fontSize: fs.label }), children: "\u2191" }),
          /* @__PURE__ */ jsx19(
            "span",
            {
              style: sx({
                fontWeight: isFirst ? 600 : 400,
                color: isFirst ? "var(--fp-accent, #6366f1)" : theme.textPrimary
              }),
              children: frame.stageName
            }
          ),
          isLast && !isFirst && /* @__PURE__ */ jsx19(
            "span",
            {
              style: sx({
                fontSize: fs.small,
                color: theme.textMuted,
                fontStyle: "italic"
              }),
              children: "(origin)"
            }
          )
        ] }),
        frame.keysWritten.length > 0 && /* @__PURE__ */ jsxs17(
          "div",
          {
            style: sx({
              fontSize: fs.label,
              color: theme.textMuted,
              paddingLeft: isFirst ? 0 : 18,
              marginTop: 2
            }),
            children: [
              "wrote:",
              " ",
              /* @__PURE__ */ jsx19("span", { style: sx({ color: theme.textSecondary }), children: frame.keysWritten.join(", ") })
            ]
          }
        ),
        frame.linkedBy && /* @__PURE__ */ jsxs17(
          "div",
          {
            style: sx({
              fontSize: fs.label,
              color: "var(--fp-accent, #6366f1)",
              paddingLeft: 18,
              marginTop: 1
            }),
            children: [
              "\u2190 via ",
              frame.linkedBy
            ]
          }
        )
      ]
    }
  );
});

// src/adapters/overlayFromSnapshot.ts
function baseStageIdOf(runtimeStageId) {
  const hashIdx = runtimeStageId.indexOf("#");
  return hashIdx >= 0 ? runtimeStageId.slice(0, hashIdx) : runtimeStageId;
}
function overlayFromSnapshot(snapshot, options = {}) {
  const commitLog = snapshot?.commitLog;
  const executionOrder = [];
  if (Array.isArray(commitLog)) {
    const seen = /* @__PURE__ */ new Set();
    for (const entry of commitLog) {
      if (entry === null || typeof entry !== "object") continue;
      const bundle = entry;
      const runtimeStageId = bundle.runtimeStageId;
      if (typeof runtimeStageId !== "string" || runtimeStageId.length === 0) continue;
      if (seen.has(runtimeStageId)) continue;
      seen.add(runtimeStageId);
      const stageId = baseStageIdOf(runtimeStageId);
      executionOrder.push({
        runtimeStageId,
        stageId,
        // `bundle.stage` is the stage's display name; fall back to the id
        // rather than inventing a label when an older engine omitted it.
        stageName: typeof bundle.stage === "string" && bundle.stage.length > 0 ? bundle.stage : stageId,
        timestampMs: 0
        // see "honest absence" in the module JSDoc
      });
    }
  }
  return {
    executionOrder,
    errors: /* @__PURE__ */ new Map(),
    running: false,
    retryAttempts: retryAttemptsFrom(snapshot, options.narrativeEntries)
  };
}
function retryAttemptsFrom(snapshot, entries) {
  const attempts = retryAttemptsFromNarrative(entries);
  for (const [runtimeStageId, count] of attemptsFromTrees(snapshot)) attempts.set(runtimeStageId, count);
  return new Map([...attempts].sort(([a], [b]) => compareExecutionIndex(a, b)));
}
function compareExecutionIndex(a, b) {
  const x = executionIndexOf(a);
  const y = executionIndexOf(b);
  return x === y ? 0 : x < y ? -1 : 1;
}
function executionIndexOf(runtimeStageId) {
  const hashIdx = runtimeStageId.lastIndexOf("#");
  const index = hashIdx >= 0 ? Number(runtimeStageId.slice(hashIdx + 1)) : Number.NaN;
  return Number.isFinite(index) ? index : Number.POSITIVE_INFINITY;
}
function attemptsFromTrees(snapshot) {
  const counts = /* @__PURE__ */ new Map();
  const roots = [snapshot?.executionTree];
  const subflowResults = snapshot?.subflowResults;
  if (subflowResults !== null && typeof subflowResults === "object") {
    for (const result of Object.values(subflowResults)) {
      const treeContext = isObject(result) ? result.treeContext : void 0;
      roots.push(isObject(treeContext) ? treeContext.stageContexts : void 0);
    }
  }
  const seen = /* @__PURE__ */ new Set();
  const stack = roots.filter(isObject);
  while (stack.length > 0) {
    const node = stack.pop();
    if (seen.has(node)) continue;
    seen.add(node);
    const count = isObject(node.attemptSummary) ? node.attemptSummary.count : void 0;
    const runtimeStageId = node.runtimeStageId;
    if (typeof count === "number" && Number.isInteger(count) && count > 1 && typeof runtimeStageId === "string" && runtimeStageId.length > 0) {
      counts.set(runtimeStageId, count);
    }
    if (isObject(node.next)) stack.push(node.next);
    if (Array.isArray(node.children)) {
      for (const child of node.children) if (isObject(child)) stack.push(child);
    }
  }
  return counts;
}
function isObject(value) {
  return value !== null && typeof value === "object";
}
function retryAttemptsFromNarrative(entries) {
  const attempts = /* @__PURE__ */ new Map();
  if (!Array.isArray(entries)) return attempts;
  for (const entry of entries) {
    if (entry === null || typeof entry !== "object") continue;
    if (entry.type !== "retry") continue;
    const runtimeStageId = entry.runtimeStageId;
    if (typeof runtimeStageId !== "string" || runtimeStageId.length === 0) continue;
    attempts.set(runtimeStageId, (attempts.get(runtimeStageId) ?? 1) + 1);
  }
  return attempts;
}

// src/components/FlowchartView/_internal/devWarn.ts
function isDevModeEnv() {
  const proc = globalThis.process;
  return proc?.env?.NODE_ENV !== "production";
}
function devWarn(messageFn, ...extras) {
  if (!isDevModeEnv()) return;
  console.warn(messageFn(), ...extras);
}

// src/components/MemoryPanel/MemoryPanel.tsx
import { jsx as jsx20, jsxs as jsxs18 } from "react/jsx-runtime";
function MemoryPanel({
  snapshots,
  selectedIndex,
  size = "default",
  unstyled = false,
  className,
  style
}) {
  const prevMemory = selectedIndex > 0 ? snapshots[selectedIndex - 1]?.memory ?? null : null;
  const currMemory = snapshots[selectedIndex]?.memory ?? {};
  if (unstyled) {
    return /* @__PURE__ */ jsxs18("div", { className, style, "data-fp": "memory-panel", children: [
      /* @__PURE__ */ jsx20(MemoryInspector, { snapshots, selectedIndex, unstyled: true }),
      /* @__PURE__ */ jsx20(ScopeDiff, { previous: prevMemory, current: currMemory, unstyled: true })
    ] });
  }
  return /* @__PURE__ */ jsxs18(
    "div",
    {
      className,
      style: {
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
        ...style
      },
      "data-fp": "memory-panel",
      children: [
        /* @__PURE__ */ jsx20(MemoryInspector, { snapshots, selectedIndex, size }),
        /* @__PURE__ */ jsx20("div", { style: { borderTop: `1px solid ${theme.border}` }, children: /* @__PURE__ */ jsx20(ScopeDiff, { previous: prevMemory, current: currMemory, hideUnchanged: true, size }) })
      ]
    }
  );
}

// src/components/NarrativePanel/NarrativePanel.tsx
import { useMemo as useMemo13, useState as useState12, useCallback as useCallback5 } from "react";

// src/utils/narrativeSync.ts
function buildEntryRangeIndex(entries) {
  const ranges = /* @__PURE__ */ new Map();
  let lastId;
  for (let i = 0; i < entries.length; i++) {
    const id = entries[i].runtimeStageId;
    if (id) {
      const existing = ranges.get(id);
      if (!existing) {
        ranges.set(id, { firstIdx: i, endIdx: i + 1 });
      } else {
        existing.endIdx = i + 1;
      }
      lastId = id;
    } else if (lastId) {
      ranges.get(lastId).endIdx = i + 1;
    }
  }
  return ranges;
}
function computeRevealedEntryCount(narrativeEntries, snapshots, selectedIndex, rangeIndex) {
  if (!narrativeEntries.length || snapshots.length === 0) return 0;
  if (rangeIndex) {
    let maxEndIdx = 0;
    for (let si = 0; si <= selectedIndex && si < snapshots.length; si++) {
      const targetId = snapshots[si].runtimeStageId;
      if (!targetId) continue;
      const range = rangeIndex.get(targetId);
      if (range && range.endIdx > maxEndIdx) {
        maxEndIdx = range.endIdx;
      }
    }
    return maxEndIdx;
  }
  let entryIdx = 0;
  for (let si = 0; si <= selectedIndex && si < snapshots.length; si++) {
    const targetId = snapshots[si].runtimeStageId;
    if (!targetId) continue;
    let found = false;
    for (let j = entryIdx; j < narrativeEntries.length; j++) {
      if (narrativeEntries[j].runtimeStageId === targetId) {
        found = true;
        entryIdx = j;
        break;
      }
    }
    if (!found) continue;
    while (entryIdx < narrativeEntries.length) {
      const eId = narrativeEntries[entryIdx].runtimeStageId;
      if (eId && eId !== targetId) break;
      entryIdx++;
    }
  }
  return entryIdx;
}
function extractSubflowNarrative(entries, subflowId, subflowName) {
  const prefix = subflowId + "/";
  const byPrefix = entries.filter((e) => e.stageName?.startsWith(prefix));
  if (byPrefix.length > 0) return byPrefix;
  const byId = entries.filter((e) => e.subflowId === subflowId);
  if (byId.length > 0) return byId;
  const result = [];
  const searchName = subflowName ?? subflowId;
  let inside = false;
  for (const entry of entries) {
    if (entry.type === "subflow" && entry.direction === "entry" && entry.stageName === searchName) {
      inside = true;
      continue;
    }
    if (inside && entry.type === "subflow" && entry.direction === "exit" && entry.stageName === searchName) break;
    if (inside) result.push(entry);
  }
  return result;
}

// src/components/StoryNarrative/StoryNarrative.tsx
import { useMemo as useMemo12, useRef as useRef7, useEffect as useEffect9 } from "react";
import { Fragment as Fragment8, jsx as jsx21, jsxs as jsxs19 } from "react/jsx-runtime";
var ENTRY_ICONS = {
  stage: { icon: "\u25B8", color: theme.primary, label: "Stage" },
  step: { icon: "\xB7", color: theme.textMuted, label: "Data operation" },
  condition: { icon: "\u25C7", color: theme.warning, label: "Decision" },
  fork: { icon: "\u2443", color: theme.primary, label: "Parallel" },
  selector: { icon: "\u2443", color: theme.primary, label: "Selector" },
  subflow: { icon: "\u21B3", color: theme.textSecondary, label: "Subflow" },
  loop: { icon: "\u21BB", color: theme.warning, label: "Loop" },
  break: { icon: "\u25A0", color: theme.error, label: "Break" },
  error: { icon: "\u2717", color: theme.error, label: "Error" },
  // Retry is ATTEMPT telemetry, not an outcome: attempt N failed and the same
  // stage is about to run again, so it may still succeed. That is why it is
  // warning-weight (like `condition`) and not error-weight (like `error` /
  // `break`) — colouring it red would tell the reader the run failed when it
  // may not have. The mirrored arrow keeps the "went round again" reading while
  // staying tellable apart from `loop`'s ↻, which is a by-design back-edge in
  // the chart rather than a failure. Precedent for icon reuse with a distinct
  // label: `fork` and `selector` already share ⑃.
  retry: { icon: "\u21BA", color: theme.warning, label: "Retry" },
  // One attempt of a retried stage (footprintjs >= 10.1, where it replaces the
  // `retry` line), styled exactly as `retry` was. The entry carries its outcome
  // only in its text, and this renderer never parses prose, so every line of
  // the series gets the same weight: the stage needed its retry policy. Shares
  // ↺ with `retry` and tells itself apart by its label (as fork and selector do).
  attempt: { icon: "\u21BA", color: theme.warning, label: "Attempt" },
  // The run stopped and is waiting on someone — warning-weight for the same
  // reason `retry` is: it wants the eye, but nothing has failed. Hollow ▷ for
  // the resume so it reads against `stage`'s filled ▸ at a glance, and
  // success-coloured because a resumed run is a run that carried on.
  pause: { icon: "\u2016", color: theme.warning, label: "Paused" },
  resume: { icon: "\u25B7", color: theme.success, label: "Resumed" },
  // `scope.$emit` — the consumer's own telemetry riding the narrative. Neutral
  // weight: it is the app talking, not the engine reporting on itself.
  emit: { icon: "\u25C8", color: theme.textSecondary, label: "Emitted event" }
};
var UNKNOWN_ENTRY_BADGE = { icon: "\u25E6", color: theme.textSecondary, label: "Narrative entry" };
function badgeOf(type) {
  return Object.prototype.hasOwnProperty.call(ENTRY_ICONS, type) ? ENTRY_ICONS[type] : UNKNOWN_ENTRY_BADGE;
}
function StoryNarrative({
  entries,
  revealedEntryCount,
  scopeSubflowId,
  size = "default",
  unstyled = false,
  className,
  style: outerStyle
}) {
  const fs = fontSize[size];
  const pad = padding[size];
  const revealedCount = revealedEntryCount;
  const isOwnLevel = useMemo12(() => {
    return (e) => {
      const sfId = e.subflowId;
      if (!sfId) return scopeSubflowId === void 0;
      if (e.type === "subflow") return true;
      return sfId === scopeSubflowId;
    };
  }, [scopeSubflowId]);
  const revealed = useMemo12(
    () => entries.slice(0, revealedCount).filter(isOwnLevel),
    [entries, revealedCount, isOwnLevel]
  );
  const futureCount = useMemo12(() => {
    let count = 0;
    for (let i = revealedCount; i < entries.length; i++) {
      if (isOwnLevel(entries[i])) count++;
    }
    return count;
  }, [entries, revealedCount, isOwnLevel]);
  const latestRef = useRef7(null);
  useEffect9(() => {
    latestRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [revealed.length]);
  const numberedEntries = useMemo12(() => {
    let counter = 0;
    const subflowSeen = /* @__PURE__ */ new Set();
    let prevType = "";
    return revealed.map((entry) => {
      const prevEntryType = prevType;
      prevType = entry.type;
      let cleanText = entry.text;
      cleanText = cleanText.replace(/^Stage \d+:\s*/, "");
      const isSelector = entry.type === "fork" && entry.text.includes("[Selected]");
      cleanText = cleanText.replace(/^\[(Selected|Parallel)\]:\s*/, "");
      if (entry.type === "subflow") {
        const toggleKey = entry.stageId ?? entry.text;
        const direction = entry.direction;
        const isExit = direction !== void 0 ? direction === "exit" : subflowSeen.has(toggleKey);
        if (!isExit) {
          subflowSeen.add(toggleKey);
          counter++;
          return {
            ...entry,
            heading: `${counter}`,
            headingType: "Subflow",
            text: cleanText,
            isHeading: true,
            isSubflow: true
          };
        }
        return { ...entry, heading: null, isHeading: false, isSubflowExit: true };
      }
      if (entry.type === "stage") {
        counter++;
        return { ...entry, heading: `${counter}`, headingType: "Stage", text: cleanText, isHeading: true };
      }
      if (entry.type === "condition") {
        return { ...entry, heading: null, headingType: "Decision", text: cleanText, isHeading: false };
      }
      if (entry.type === "fork" || entry.type === "selector") {
        const isForkHeading = prevEntryType !== "fork" && prevEntryType !== "selector";
        if (isForkHeading) {
          counter++;
          const typeLabel = entry.type === "selector" || isSelector ? "Selector" : "Fork";
          return { ...entry, heading: `${counter}`, headingType: typeLabel, text: cleanText, isHeading: true };
        }
        return { ...entry, heading: null, isHeading: false, text: cleanText };
      }
      return { ...entry, heading: null, isHeading: false };
    });
  }, [revealed]);
  if (unstyled) {
    return /* @__PURE__ */ jsx21("div", { className, style: outerStyle, "data-fp": "story-narrative", role: "log", children: numberedEntries.map((entry, i) => {
      if (entry.isSubflowExit) return null;
      const ht = entry.headingType;
      return /* @__PURE__ */ jsx21("div", { "data-fp": "narrative-entry", "data-type": entry.type, children: entry.heading ? entry.text.startsWith("[") ? `${entry.heading}. ${entry.text}` : `${entry.heading}. [${ht}: ${entry.stageName ?? ""}] ${entry.text}` : entry.text }, i);
    }) });
  }
  return /* @__PURE__ */ jsxs19(
    "div",
    {
      className,
      style: {
        flex: 1,
        overflow: "auto",
        padding: pad,
        fontFamily: theme.fontSans,
        ...outerStyle
      },
      "data-fp": "story-narrative",
      role: "log",
      "aria-label": "Execution narrative",
      children: [
        numberedEntries.map((entry, i) => {
          if (entry.isSubflowExit) return null;
          const meta = badgeOf(entry.type);
          const isHeading = entry.isHeading;
          const isDecision = entry.type === "condition";
          const isError = entry.type === "error";
          const isBreak = entry.type === "break";
          const isAttemptLine = entry.type === "retry" || entry.type === "attempt";
          const isSubflow = entry.isSubflow;
          const isLast = i === numberedEntries.length - 1;
          const headingType = entry.headingType;
          return /* @__PURE__ */ jsxs19(
            "div",
            {
              ref: isLast ? latestRef : void 0,
              style: {
                display: "flex",
                gap: 8,
                padding: isHeading ? `${pad - 4}px 0` : `2px 0`,
                marginLeft: entry.depth * 16,
                borderBottom: isHeading ? `1px solid ${theme.border}` : void 0,
                marginTop: isHeading && i > 0 ? 8 : 0
              },
              children: [
                /* @__PURE__ */ jsx21(
                  "span",
                  {
                    style: {
                      color: meta.color,
                      fontWeight: 700,
                      fontSize: isHeading ? fs.body : fs.small,
                      width: 16,
                      textAlign: "center",
                      flexShrink: 0
                    },
                    title: meta.label,
                    "aria-label": meta.label,
                    children: meta.icon
                  }
                ),
                /* @__PURE__ */ jsx21(
                  "span",
                  {
                    style: {
                      fontSize: isHeading ? fs.body : fs.small,
                      fontWeight: isHeading ? 600 : 400,
                      color: isError || isBreak ? theme.error : isDecision || isAttemptLine ? theme.warning : isHeading ? theme.textPrimary : theme.textSecondary,
                      lineHeight: 1.6,
                      fontFamily: entry.type === "step" ? theme.fontMono : theme.fontSans
                    },
                    children: entry.heading && headingType ? entry.text.startsWith("[") ? /* @__PURE__ */ jsxs19(Fragment8, { children: [
                      /* @__PURE__ */ jsxs19("strong", { children: [
                        entry.heading,
                        "."
                      ] }),
                      " ",
                      entry.text
                    ] }) : /* @__PURE__ */ jsxs19(Fragment8, { children: [
                      /* @__PURE__ */ jsxs19("strong", { children: [
                        entry.heading,
                        ". [",
                        headingType,
                        entry.stageName ? `: ${entry.stageName}` : "",
                        "]"
                      ] }),
                      " ",
                      entry.text
                    ] }) : entry.text
                  }
                )
              ]
            },
            i
          );
        }),
        futureCount > 0 && /* @__PURE__ */ jsxs19("div", { style: {
          opacity: 0.3,
          fontSize: fs.small,
          color: theme.textMuted,
          padding: `8px 0`,
          fontStyle: "italic"
        }, children: [
          futureCount,
          " more ",
          futureCount === 1 ? "entry" : "entries",
          " ahead..."
        ] })
      ]
    }
  );
}

// src/components/NarrativePanel/NarrativePanel.tsx
import { jsx as jsx22, jsxs as jsxs20 } from "react/jsx-runtime";
function safeJsonStringify(value) {
  const seen = /* @__PURE__ */ new WeakSet();
  const MAX_CHARS = 5e5;
  try {
    let text3 = JSON.stringify(
      value,
      (_key, v2) => {
        if (typeof v2 === "object" && v2 !== null) {
          if (seen.has(v2)) return "[Circular]";
          seen.add(v2);
        }
        return v2;
      },
      2
    );
    if (text3 && text3.length > MAX_CHARS) {
      text3 = text3.slice(0, MAX_CHARS) + `
... [truncated at ${MAX_CHARS} chars]`;
    }
    return text3 ?? "undefined";
  } catch (err) {
    return `[stringify error: ${err instanceof Error ? err.message : String(err)}]`;
  }
}
function NarrativePanel({
  snapshots,
  selectedIndex,
  narrativeEntries,
  scopeSubflowId,
  runtimeSnapshot,
  spec,
  size = "default",
  unstyled = false,
  className,
  style
}) {
  const fs = fontSize[size];
  const pad = padding[size];
  const narrative = useMemo13(() => {
    const lines = [];
    for (const snap of snapshots) {
      const stageLines = (snap.narrative ?? "").split("\n").filter(Boolean);
      lines.push(...stageLines);
    }
    return lines;
  }, [snapshots]);
  const revealedCount = useMemo13(() => {
    if (snapshots.length === 0 || narrative.length === 0) return narrative.length;
    const stageBoundaries = [];
    for (let i = 0; i < narrative.length; i++) {
      const trimmed = narrative[i].trimStart();
      if (trimmed.startsWith("Stage ") && !trimmed.match(/^Stage\s+\d+:\s*Step\s/)) {
        stageBoundaries.push(i);
      }
    }
    if (stageBoundaries.length === 0) {
      const ratio = (selectedIndex + 1) / snapshots.length;
      return Math.max(1, Math.ceil(narrative.length * ratio));
    }
    const groupsToShow = Math.min(selectedIndex + 1, stageBoundaries.length);
    const endIdx = groupsToShow < stageBoundaries.length ? stageBoundaries[groupsToShow] : narrative.length;
    return Math.max(1, endIdx);
  }, [snapshots.length, selectedIndex, narrative]);
  const rangeIndex = useMemo13(
    () => narrativeEntries?.length ? buildEntryRangeIndex(narrativeEntries) : void 0,
    [narrativeEntries]
  );
  const revealedEntryCount = useMemo13(
    () => narrativeEntries?.length ? computeRevealedEntryCount(narrativeEntries, snapshots, selectedIndex, rangeIndex) : 0,
    [narrativeEntries, snapshots, selectedIndex, rangeIndex]
  );
  const hasStructured = narrativeEntries && narrativeEntries.length > 0;
  const [copied, setCopied] = useState12(false);
  const buildLLMNarrative = useCallback5(() => {
    if (!narrativeEntries?.length) {
      return narrative.join("\n");
    }
    const root = [];
    const subflows = /* @__PURE__ */ new Map();
    const subflowNames = /* @__PURE__ */ new Map();
    for (const entry of narrativeEntries) {
      const sfId = entry.subflowId;
      if (!sfId) {
        root.push(entry);
      } else {
        if (entry.type === "subflow") {
          const isExit = entry.direction === "exit";
          if (!isExit) {
            root.push(entry);
          }
          if (entry.stageName && !isExit) {
            subflowNames.set(sfId, entry.stageName);
          }
        } else {
          if (!subflows.has(sfId)) subflows.set(sfId, []);
          subflows.get(sfId).push(entry);
        }
      }
    }
    const renderEntries = (entries, opts) => {
      let counter = 0;
      const lines = [];
      for (const e of entries) {
        if (opts?.inSubflow && e.type === "subflow") continue;
        let text3 = e.text;
        if (opts?.inSubflow) {
          const prefix = `[${opts.inSubflow}/`;
          const idx = text3.indexOf(prefix);
          if (idx !== -1) {
            text3 = text3.slice(0, idx) + "[" + text3.slice(idx + prefix.length);
          }
        }
        const isHeading = e.type === "stage" || e.type === "subflow" || e.type === "fork" || e.type === "selector";
        if (isHeading) {
          counter++;
          const sfId = e.subflowId;
          const idSuffix = e.type === "subflow" && sfId ? ` [\u2192 ${sfId}]` : "";
          lines.push(`${counter}. ${text3}${idSuffix}`);
        } else {
          lines.push(`  ${text3}`);
        }
      }
      return lines.join("\n");
    };
    const sections = [];
    sections.push("## Execution Narrative\n");
    sections.push(renderEntries(root));
    if (subflows.size > 0) {
      sections.push("\n\n## Subflow Details");
      sections.push("Use the subflow IDs above to look up details below.\n");
      for (const [sfId, entries] of subflows) {
        const name = subflowNames.get(sfId) ?? sfId;
        sections.push(`### ${name} (${sfId})
`);
        sections.push(renderEntries(entries, { inSubflow: sfId }));
        sections.push("");
      }
    }
    if (runtimeSnapshot) {
      const snap = runtimeSnapshot;
      if (snap.sharedState !== void 0) {
        sections.push("\n\n## Final Shared State");
        sections.push("```json");
        sections.push(safeJsonStringify(snap.sharedState));
        sections.push("```");
      }
      if (Array.isArray(snap.commitLog) && snap.commitLog.length > 0) {
        sections.push("\n\n## Commit Log");
        sections.push(
          "Each entry = one stage execution's writes to shared state. `rsid` is the runtimeStageId (use it to correlate with narrative + executionTree).\n"
        );
        sections.push("```json");
        sections.push(safeJsonStringify(snap.commitLog));
        sections.push("```");
      }
      if (snap.recorders && typeof snap.recorders === "object") {
        sections.push("\n\n## Recorder Snapshots");
        sections.push(
          "Per-recorder data captured DURING the run (metrics, tokens, instructions, emit events).\n"
        );
        sections.push("```json");
        sections.push(safeJsonStringify(snap.recorders));
        sections.push("```");
      }
      if (snap.subflowResults && typeof snap.subflowResults === "object") {
        const keys = Object.keys(snap.subflowResults);
        if (keys.length > 0) {
          sections.push("\n\n## Subflow Results");
          sections.push("```json");
          sections.push(safeJsonStringify(snap.subflowResults));
          sections.push("```");
        }
      }
    }
    if (spec) {
      sections.push("\n\n## Flowchart Spec (topology)");
      sections.push(
        "Node + edge metadata for the chart that ran. Useful for 'where in the graph did step N happen?' questions.\n"
      );
      sections.push("```json");
      sections.push(safeJsonStringify(spec));
      sections.push("```");
    }
    return sections.join("\n");
  }, [narrativeEntries, narrative, runtimeSnapshot, spec]);
  const handleCopy = useCallback5(async () => {
    const text3 = buildLLMNarrative();
    await navigator.clipboard.writeText(text3);
    setCopied(true);
    setTimeout(() => setCopied(false), 2e3);
  }, [buildLLMNarrative]);
  if (unstyled) {
    return /* @__PURE__ */ jsx22("div", { className, style, "data-fp": "narrative-panel", children: hasStructured ? /* @__PURE__ */ jsx22(StoryNarrative, { entries: narrativeEntries, revealedEntryCount, scopeSubflowId, unstyled: true }) : /* @__PURE__ */ jsx22(NarrativeTrace, { narrative, revealedCount, unstyled: true }) });
  }
  return /* @__PURE__ */ jsxs20(
    "div",
    {
      className,
      style: {
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
        ...style
      },
      "data-fp": "narrative-panel",
      children: [
        /* @__PURE__ */ jsxs20(
          "div",
          {
            style: {
              padding: `${pad - 4}px ${pad}px`,
              fontSize: fs.small,
              color: theme.textMuted,
              borderBottom: `1px solid ${theme.border}`,
              flexShrink: 0,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            },
            children: [
              /* @__PURE__ */ jsx22("span", { style: { fontStyle: "italic" }, children: "What happened at each stage, what data flowed, what decisions were made, and why." }),
              /* @__PURE__ */ jsx22(
                "button",
                {
                  onClick: handleCopy,
                  title: "Copy narrative as LLM-ready text (includes subflow details)",
                  style: {
                    background: copied ? theme.success : theme.bgSecondary,
                    border: `1px solid ${theme.border}`,
                    borderRadius: 4,
                    padding: "2px 8px",
                    fontSize: fs.small,
                    color: copied ? "#fff" : theme.textSecondary,
                    cursor: "pointer",
                    flexShrink: 0,
                    marginLeft: 8,
                    transition: "all 0.2s"
                  },
                  children: copied ? "Copied!" : "Copy for LLM"
                }
              )
            ]
          }
        ),
        hasStructured ? /* @__PURE__ */ jsx22(
          StoryNarrative,
          {
            entries: narrativeEntries,
            revealedEntryCount,
            scopeSubflowId,
            size,
            style: { flex: 1 }
          }
        ) : /* @__PURE__ */ jsx22(
          NarrativeTrace,
          {
            narrative,
            revealedCount,
            size,
            style: { flex: 1 }
          }
        )
      ]
    }
  );
}

// src/components/FlowchartView/SubflowTree.tsx
import { memo as memo3, useState as useState13, useCallback as useCallback6, useMemo as useMemo14 } from "react";
import { Fragment as Fragment9, jsx as jsx23, jsxs as jsxs21 } from "react/jsx-runtime";
function graphToSubflowEntries(graph) {
  if (!graph?.nodes?.length) return [];
  const entries = [];
  for (const node of graph.nodes) {
    if (!node.data?.isSubflow) continue;
    const entry = {
      name: typeof node.data.label === "string" ? node.data.label : node.id,
      isSubflow: true,
      nodeId: node.id
    };
    if (typeof node.data.description === "string") entry.description = node.data.description;
    if (typeof node.data.subflowId === "string") entry.subflowId = node.data.subflowId;
    entries.push(entry);
  }
  return entries;
}
var TreeNode = memo3(function TreeNode2({
  entry,
  depth,
  activeStage,
  doneStages,
  onNodeSelect
}) {
  const [expanded, setExpanded] = useState13(true);
  const hasChildren = entry.children && entry.children.length > 0;
  const isActive = activeStage === entry.name;
  const isDone = doneStages?.has(entry.name);
  const handleClick = useCallback6(() => {
    if (hasChildren) {
      setExpanded((prev) => !prev);
    }
    onNodeSelect?.(entry.name, !!entry.isSubflow, entry.nodeId);
  }, [hasChildren, onNodeSelect, entry.name, entry.isSubflow, entry.nodeId]);
  return /* @__PURE__ */ jsxs21(Fragment9, { children: [
    /* @__PURE__ */ jsxs21(
      "button",
      {
        onClick: handleClick,
        "data-fp": "subflow-tree-node",
        style: {
          display: "flex",
          alignItems: "center",
          gap: 6,
          width: "100%",
          border: "none",
          background: isActive ? `color-mix(in srgb, ${theme.primary} 15%, transparent)` : "transparent",
          cursor: "pointer",
          padding: `4px 8px 4px ${8 + depth * 16}px`,
          fontFamily: theme.fontSans,
          fontSize: 12,
          textAlign: "left",
          borderRadius: 4,
          transition: "background 0.15s"
        },
        onMouseEnter: (e) => {
          if (!isActive) {
            e.currentTarget.style.background = `color-mix(in srgb, ${theme.textMuted} 10%, transparent)`;
          }
        },
        onMouseLeave: (e) => {
          if (!isActive) {
            e.currentTarget.style.background = "transparent";
          }
        },
        children: [
          hasChildren ? /* @__PURE__ */ jsx23(
            "span",
            {
              style: {
                fontSize: 10,
                color: theme.textMuted,
                width: 12,
                textAlign: "center",
                flexShrink: 0,
                transition: "transform 0.15s",
                transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
                display: "inline-block"
              },
              children: "\u25B6"
            }
          ) : /* @__PURE__ */ jsx23("span", { style: { width: 12, flexShrink: 0 } }),
          /* @__PURE__ */ jsx23(
            "span",
            {
              style: {
                width: 6,
                height: 6,
                borderRadius: "50%",
                flexShrink: 0,
                background: isActive ? theme.primary : isDone ? theme.success : theme.border
              }
            }
          ),
          /* @__PURE__ */ jsxs21("span", { style: { display: "flex", flexDirection: "column", minWidth: 0 }, children: [
            /* @__PURE__ */ jsxs21(
              "span",
              {
                style: {
                  color: isActive ? theme.primary : isDone ? theme.textPrimary : theme.textSecondary,
                  fontWeight: isActive ? 600 : entry.isSubflow ? 500 : 400,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                },
                children: [
                  entry.name,
                  entry.isSubflow && /* @__PURE__ */ jsx23("span", { style: { opacity: 0.5, marginLeft: 4, fontSize: 10 }, children: "\u229E" })
                ]
              }
            ),
            entry.description && /* @__PURE__ */ jsx23(
              "span",
              {
                style: {
                  color: theme.textMuted,
                  fontSize: 10,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                },
                children: entry.description
              }
            )
          ] })
        ]
      }
    ),
    hasChildren && expanded && /* @__PURE__ */ jsx23("div", { children: entry.children.map((child, i) => /* @__PURE__ */ jsx23(
      TreeNode2,
      {
        entry: child,
        depth: depth + 1,
        activeStage,
        doneStages,
        onNodeSelect
      },
      child.nodeId ?? child.subflowId ?? `${child.name}-${i}`
    )) })
  ] });
});
var SectionLabel = memo3(function SectionLabel2({ children }) {
  return /* @__PURE__ */ jsx23(
    "div",
    {
      style: {
        padding: "4px 12px 8px",
        fontSize: 10,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        color: theme.textMuted
      },
      children
    }
  );
});
var SubflowTree = memo3(function SubflowTree2({
  graph,
  activeStage,
  doneStages,
  onNodeSelect,
  unstyled = false,
  className,
  style
}) {
  const subflowStages = useMemo14(() => graphToSubflowEntries(graph), [graph]);
  if (subflowStages.length === 0) return null;
  return /* @__PURE__ */ jsxs21(
    "div",
    {
      className,
      "data-fp": "subflow-tree",
      style: {
        ...unstyled ? {} : {
          fontFamily: theme.fontSans,
          fontSize: 12,
          background: theme.bgPrimary,
          borderRight: `1px solid ${theme.border}`,
          overflowY: "auto",
          overflowX: "hidden",
          padding: "8px 0"
        },
        ...style
      },
      children: [
        !unstyled && /* @__PURE__ */ jsx23(SectionLabel, { children: "Subflows" }),
        subflowStages.map((entry, i) => /* @__PURE__ */ jsx23(
          TreeNode,
          {
            entry,
            depth: 0,
            activeStage,
            doneStages,
            onNodeSelect
          },
          entry.nodeId ?? entry.subflowId ?? `${entry.name}-${i}`
        ))
      ]
    }
  );
});

// src/components/FlowchartView/SubflowBreadcrumb.tsx
import { memo as memo4 } from "react";

// src/_internal/deprecate.ts
var announced = /* @__PURE__ */ new Set();
function warnDeprecated(what, useInstead) {
  if (announced.has(what)) return;
  announced.add(what);
  devWarn(
    () => `[footprint-explainable-ui] ${what} is deprecated and will be removed in the next major. ${useInstead}`
  );
}

// src/components/FlowchartView/SubflowBreadcrumb.tsx
import { jsx as jsx24, jsxs as jsxs22 } from "react/jsx-runtime";
var SubflowBreadcrumb = memo4(function SubflowBreadcrumb2({
  breadcrumbs,
  onNavigate
}) {
  warnDeprecated(
    "SubflowBreadcrumb",
    "It renders the legacy useSubflowNavigation stack. Use <TracedFlow> (which draws its own trail), or buildSubflowBreadcrumb(graph, mountNodeId)."
  );
  if (breadcrumbs.length <= 1) return null;
  return /* @__PURE__ */ jsx24(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "6px 12px",
        background: theme.bgSecondary,
        borderBottom: `1px solid ${theme.border}`,
        fontSize: 12,
        fontFamily: theme.fontSans,
        flexShrink: 0,
        overflowX: "auto"
      },
      children: breadcrumbs.map((crumb, i) => {
        const isLast = i === breadcrumbs.length - 1;
        return /* @__PURE__ */ jsxs22("span", { style: { display: "flex", alignItems: "center", gap: 4 }, children: [
          i > 0 && /* @__PURE__ */ jsx24("span", { style: { color: theme.textMuted, fontSize: 10 }, children: "\u203A" }),
          isLast ? /* @__PURE__ */ jsxs22("span", { style: { display: "flex", alignItems: "center", gap: 6 }, children: [
            /* @__PURE__ */ jsx24(
              "span",
              {
                style: {
                  color: theme.primary,
                  fontWeight: 600
                },
                children: crumb.label
              }
            ),
            crumb.description && /* @__PURE__ */ jsxs22(
              "span",
              {
                style: {
                  color: theme.textMuted,
                  fontWeight: 400,
                  fontSize: 11
                },
                children: [
                  "\u2014 ",
                  crumb.description
                ]
              }
            )
          ] }) : /* @__PURE__ */ jsx24(
            "button",
            {
              onClick: () => onNavigate(i),
              style: {
                background: "none",
                border: "none",
                color: theme.textSecondary,
                cursor: "pointer",
                padding: "2px 4px",
                borderRadius: 4,
                fontSize: 12,
                fontFamily: "inherit",
                fontWeight: 500,
                transition: "color 0.15s"
              },
              onMouseEnter: (e) => {
                e.currentTarget.style.color = `${theme.primary}`;
              },
              onMouseLeave: (e) => {
                e.currentTarget.style.color = `${theme.textSecondary}`;
              },
              children: crumb.label
            }
          )
        ] }, `${crumb.label}-${i}`);
      })
    }
  );
});

// src/components/FlowchartView/TracedFlow.tsx
import { useCallback as useCallback8, useEffect as useEffect13, useMemo as useMemo15, useRef as useRef10, useState as useState15 } from "react";
import {
  ReactFlow as ReactFlow2,
  Background as Background2,
  BackgroundVariant,
  MarkerType as MarkerType2
} from "@xyflow/react";

// src/components/FlowchartView/_internal/dagreTraceLayout.ts
import dagre2 from "dagre";
var DEFAULT_NODE_W = 200;
var DEFAULT_NODE_H = 80;
function sizeOf(node, fallbackW, fallbackH, resolver) {
  const style = node.style ?? {};
  const styleW = typeof style.width === "number" ? style.width : void 0;
  const styleH = typeof style.height === "number" ? style.height : void 0;
  if (node.data?.isGroupContainer && styleW !== void 0 && styleH !== void 0) {
    return { width: styleW, height: styleH };
  }
  const resolved = resolver?.(node);
  if (resolved) return { width: resolved.width, height: resolved.height };
  return {
    width: styleW ?? fallbackW,
    height: styleH ?? fallbackH
  };
}
function reorderSiblingEdges(edges, siblingOrder) {
  const bySource = /* @__PURE__ */ new Map();
  for (const e of edges) {
    if (e.data?.kind === "loop") continue;
    const arr = bySource.get(e.source);
    if (arr) arr.push(e);
    else bySource.set(e.source, [e]);
  }
  const out = [];
  for (const [src, group] of bySource) {
    if (group.length < 2) {
      out.push(...group);
      continue;
    }
    const ordered = siblingOrder(src, group.map((e) => e.target));
    const byTarget = new Map(group.map((e) => [e.target, e]));
    const used = /* @__PURE__ */ new Set();
    for (const t of ordered) {
      const e = byTarget.get(t);
      if (e && !used.has(t)) {
        out.push(e);
        used.add(t);
      }
    }
    for (const e of group) if (!used.has(e.target)) out.push(e);
  }
  return out;
}
function dagreTraceLayout(graph, options = {}) {
  if (graph.nodes.length === 0) return graph;
  const direction = options.direction ?? "TB";
  const rankSep = options.rankSep ?? 80;
  const nodeSep = options.nodeSep ?? 60;
  const edgeSep = options.edgeSep ?? 20;
  const fallbackW = options.nodeWidth ?? DEFAULT_NODE_W;
  const fallbackH = options.nodeHeight ?? DEFAULT_NODE_H;
  const g = new dagre2.graphlib.Graph({ compound: true });
  g.setGraph({ rankdir: direction, ranksep: rankSep, nodesep: nodeSep, edgesep: edgeSep });
  g.setDefaultEdgeLabel(() => ({}));
  const sizes = /* @__PURE__ */ new Map();
  const resolvedStyleSizes = /* @__PURE__ */ new Map();
  for (const node of graph.nodes) {
    const resolved = options.nodeSize?.(node);
    const size = sizeOf(node, fallbackW, fallbackH, options.nodeSize);
    sizes.set(node.id, size);
    if (resolved && resolved.width === size.width && resolved.height === size.height) {
      resolvedStyleSizes.set(node.id, resolved);
    }
    g.setNode(node.id, { width: size.width, height: size.height });
    if (node.parentId) {
      g.setParent(node.id, node.parentId);
    }
  }
  const layoutEdges = options.siblingOrder ? reorderSiblingEdges(graph.edges, options.siblingOrder) : graph.edges;
  for (const e of layoutEdges) {
    if (e.data?.kind === "loop") continue;
    if (g.hasNode(e.source) && g.hasNode(e.target)) {
      const label = {};
      const weight = options.edgeWeight?.(e);
      const minlen = options.edgeMinLen?.(e);
      if (typeof weight === "number") label.weight = weight;
      if (typeof minlen === "number") label.minlen = minlen;
      g.setEdge(e.source, e.target, label);
    }
  }
  dagre2.layout(g);
  const positioned = graph.nodes.map((node) => {
    const laidOut = g.node(node.id);
    if (!laidOut) return node;
    const size = sizes.get(node.id);
    let x = laidOut.x - size.width / 2;
    let y = laidOut.y - size.height / 2;
    if (node.parentId) {
      const parent = g.node(node.parentId);
      const parentSize = sizes.get(node.parentId);
      if (parent && parentSize) {
        x -= parent.x - parentSize.width / 2;
        y -= parent.y - parentSize.height / 2;
      }
    }
    const styleSize = resolvedStyleSizes.get(node.id);
    if (styleSize) {
      return {
        ...node,
        position: { x, y },
        style: { ...node.style ?? {}, width: styleSize.width, height: styleSize.height }
      };
    }
    return { ...node, position: { x, y } };
  });
  return { nodes: positioned, edges: graph.edges };
}
function createDagreTraceLayout(options = {}) {
  return (graph) => dagreTraceLayout(graph, options);
}

// src/components/FlowchartView/_internal/snapLinearSuccessors.ts
function snapLinearSuccessors(graph, options = {}) {
  if (graph.nodes.length === 0) return graph;
  const fallbackW = options.nodeWidth ?? DEFAULT_NODE_W;
  const fallbackH = options.nodeHeight ?? DEFAULT_NODE_H;
  const byId = /* @__PURE__ */ new Map();
  const width = /* @__PURE__ */ new Map();
  for (const n of graph.nodes) {
    byId.set(n.id, n);
    width.set(n.id, sizeOf(n, fallbackW, fallbackH, options.nodeSize).width);
  }
  const preds = /* @__PURE__ */ new Map();
  const outDegree = /* @__PURE__ */ new Map();
  const seenEdge = /* @__PURE__ */ new Set();
  for (const e of graph.edges) {
    if (e.data?.kind === "loop") continue;
    if (!byId.has(e.source) || !byId.has(e.target)) continue;
    const key = `${e.source}\0${e.target}`;
    if (seenEdge.has(key)) continue;
    seenEdge.add(key);
    const list2 = preds.get(e.target);
    if (list2) list2.push(e.source);
    else preds.set(e.target, [e.source]);
    outDegree.set(e.source, (outDegree.get(e.source) ?? 0) + 1);
  }
  const workingX = /* @__PURE__ */ new Map();
  for (const n of graph.nodes) workingX.set(n.id, n.position.x);
  const centerX = (id) => workingX.get(id) + width.get(id) / 2;
  const order = [...graph.nodes].sort(
    (a, b) => a.position.y - b.position.y || a.position.x - b.position.x || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
  );
  for (const n of order) {
    const p = preds.get(n.id);
    if (!p || p.length !== 1) continue;
    const pid = p[0];
    if ((outDegree.get(pid) ?? 0) !== 1) continue;
    const P = byId.get(pid);
    if ((n.parentId ?? void 0) !== (P.parentId ?? void 0)) continue;
    workingX.set(n.id, centerX(pid) - width.get(n.id) / 2);
  }
  const nodes = graph.nodes.map((n) => {
    const nx = workingX.get(n.id);
    return nx === n.position.x ? n : { ...n, position: { x: nx, y: n.position.y } };
  });
  return { nodes, edges: graph.edges };
}
function createSnappedDagreLayout(base, options = {}) {
  return (graph) => snapLinearSuccessors(base(graph), options);
}

// src/components/FlowchartView/_internal/centerForkParents.ts
function centerForkParents(graph, options = {}) {
  if (graph.nodes.length === 0) return graph;
  const fallbackW = options.nodeWidth ?? DEFAULT_NODE_W;
  const fallbackH = options.nodeHeight ?? DEFAULT_NODE_H;
  const byId = /* @__PURE__ */ new Map();
  const width = /* @__PURE__ */ new Map();
  for (const n of graph.nodes) {
    byId.set(n.id, n);
    width.set(n.id, sizeOf(n, fallbackW, fallbackH, options.nodeSize).width);
  }
  const childrenOf = /* @__PURE__ */ new Map();
  const predsOf = /* @__PURE__ */ new Map();
  const outDegree = /* @__PURE__ */ new Map();
  const inDegree = /* @__PURE__ */ new Map();
  const seen = /* @__PURE__ */ new Set();
  for (const e of graph.edges) {
    if (e.data?.kind === "loop") continue;
    if (!byId.has(e.source) || !byId.has(e.target)) continue;
    const key = `${e.source} ${e.target}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const cl = childrenOf.get(e.source);
    if (cl) cl.push(e.target);
    else childrenOf.set(e.source, [e.target]);
    const pl = predsOf.get(e.target);
    if (pl) pl.push(e.source);
    else predsOf.set(e.target, [e.source]);
    outDegree.set(e.source, (outDegree.get(e.source) ?? 0) + 1);
    inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1);
  }
  const workingX = /* @__PURE__ */ new Map();
  for (const n of graph.nodes) workingX.set(n.id, n.position.x);
  const centerX = (id) => workingX.get(id) + width.get(id) / 2;
  const nodeSep = options.nodeSep ?? 60;
  const clampX = (id, desiredX) => {
    const w = width.get(id);
    const x0 = workingX.get(id);
    const self = byId.get(id);
    let minX = -Infinity;
    let maxX = Infinity;
    for (const m of graph.nodes) {
      if (m.id === id || m.parentId !== self.parentId) continue;
      if (Math.abs(m.position.y - self.position.y) > 1) continue;
      const mLeft = workingX.get(m.id);
      const mRight = mLeft + width.get(m.id);
      if (mRight <= x0) minX = Math.max(minX, mRight + nodeSep);
      else if (mLeft >= x0 + w) maxX = Math.min(maxX, mLeft - nodeSep - w);
    }
    return minX <= maxX ? Math.max(minX, Math.min(maxX, desiredX)) : x0;
  };
  const evenFanKids = (forkCenter, kids) => {
    if (kids.length < 2) return;
    const sorted = [...kids].sort((a, b) => centerX(a) - centerX(b));
    let gap = 0;
    for (let i = 0; i < sorted.length - 1; i++) {
      gap = Math.max(gap, width.get(sorted[i]) / 2 + nodeSep + width.get(sorted[i + 1]) / 2);
    }
    const mid = (sorted.length - 1) / 2;
    for (let i = 0; i < sorted.length; i++) {
      workingX.set(sorted[i], forkCenter + (i - mid) * gap - width.get(sorted[i]) / 2);
    }
  };
  const order = [...graph.nodes].sort(
    (a, b) => b.position.y - a.position.y || a.position.x - b.position.x || a.id.localeCompare(b.id)
  );
  for (const n of order) {
    const outD = outDegree.get(n.id) ?? 0;
    const inD = inDegree.get(n.id) ?? 0;
    const isFork = outD >= 2 && inD <= 1;
    const isMerge = inD >= 2 && outD <= 1;
    if (!isFork && !isMerge) continue;
    const kin = ((isFork ? childrenOf.get(n.id) : predsOf.get(n.id)) ?? []).filter(
      (k) => byId.get(k)?.parentId === n.parentId
      // same compound only
    );
    if (kin.length < 2) continue;
    const centers = kin.map(centerX);
    const wN = width.get(n.id);
    const span = (Math.min(...centers) + Math.max(...centers)) / 2;
    workingX.set(n.id, clampX(n.id, span - wN / 2));
    if (isFork) {
      const succSets = kin.map((k) => childrenOf.get(k) ?? []);
      const isDiamond = kin.length >= 2 && succSets[0].some((s) => succSets.every((ss) => ss.includes(s)));
      if (isDiamond) evenFanKids(centerX(n.id), kin);
    }
    const stepOf = isFork ? predsOf : childrenOf;
    let curId = n.id;
    const walked = /* @__PURE__ */ new Set([curId]);
    for (; ; ) {
      const nexts = stepOf.get(curId);
      if (!nexts || nexts.length !== 1) break;
      const m = nexts[0];
      if (walked.has(m)) break;
      if ((outDegree.get(m) ?? 0) > 1) break;
      if ((inDegree.get(m) ?? 0) > 1) break;
      if (byId.get(m)?.parentId !== byId.get(curId)?.parentId) break;
      workingX.set(m, clampX(m, centerX(curId) - width.get(m) / 2));
      walked.add(m);
      curId = m;
    }
  }
  for (const n of order) {
    const outD = outDegree.get(n.id) ?? 0;
    const inD = inDegree.get(n.id) ?? 0;
    if (!(outD >= 2 && inD <= 1)) continue;
    const kids = (childrenOf.get(n.id) ?? []).filter(
      (k) => byId.get(k)?.parentId === n.parentId
    );
    if (kids.length < 2) continue;
    const succSets = kids.map((k) => childrenOf.get(k) ?? []);
    const isDiamond = succSets[0].some((s) => succSets.every((ss) => ss.includes(s)));
    if (isDiamond) continue;
    const ps = predsOf.get(n.id);
    if (!ps || ps.length !== 1) continue;
    const pred = ps[0];
    if ((outDegree.get(pred) ?? 0) !== 1) continue;
    if (byId.get(pred)?.parentId !== byId.get(n.id)?.parentId) continue;
    const before = centerX(n.id);
    workingX.set(n.id, clampX(n.id, centerX(pred) - width.get(n.id) / 2));
    const delta = centerX(n.id) - before;
    if (delta === 0) continue;
    for (const k of kids) workingX.set(k, clampX(k, workingX.get(k) + delta));
  }
  const nodes = graph.nodes.map(
    (n) => workingX.get(n.id) === n.position.x ? n : { ...n, position: { x: workingX.get(n.id), y: n.position.y } }
  );
  return { nodes, edges: graph.edges };
}
function withForkCentering(base, options = {}) {
  return (graph) => centerForkParents(base(graph), options);
}

// src/components/FlowchartView/_internal/notifyChange.ts
function createNotifier(label = "notifier") {
  const listeners = /* @__PURE__ */ new Set();
  let v2 = 0;
  let pending = false;
  function flush() {
    if (!pending) return;
    pending = false;
    const snapshot = Array.from(listeners);
    for (const l of snapshot) {
      try {
        l();
      } catch (err) {
        devWarn(
          () => `[${label}] subscribe() listener threw \u2014 isolated; other subscribers continue.`,
          err
        );
      }
    }
  }
  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    version() {
      return v2;
    },
    notify() {
      v2 += 1;
      if (pending) return;
      pending = true;
      queueMicrotask(flush);
    },
    flushPending() {
      flush();
    }
  };
}

// src/components/FlowchartView/createTraceRuntimeOverlay.ts
function parseStageIdFromRuntimeStageId(runtimeStageId) {
  const hashIdx = runtimeStageId.indexOf("#");
  return hashIdx >= 0 ? runtimeStageId.slice(0, hashIdx) : runtimeStageId;
}
function sliceOverlay(overlay, index) {
  const order = overlay.executionOrder;
  if (order.length === 0) {
    return {
      doneStageIds: /* @__PURE__ */ new Set(),
      activeStageId: null,
      executedStageIds: /* @__PURE__ */ new Set(),
      executedOrderIds: [],
      errors: overlay.errors,
      retryAttempts: projectRetryAttempts(overlay, -1)
    };
  }
  if (index >= order.length) {
    const allDone = new Set(order.map((s) => s.stageId));
    return {
      doneStageIds: allDone,
      activeStageId: null,
      executedStageIds: new Set(allDone),
      executedOrderIds: order.map((s) => s.stageId),
      errors: overlay.errors,
      retryAttempts: projectRetryAttempts(overlay, order.length - 1)
    };
  }
  const clampedIndex = Math.max(0, Math.min(index, order.length - 1));
  const doneStageIds = /* @__PURE__ */ new Set();
  for (let i = 0; i < clampedIndex; i++) {
    doneStageIds.add(order[i].stageId);
  }
  const activeStep = order[clampedIndex];
  const activeStageId = activeStep ? activeStep.stageId : null;
  const executedStageIds = new Set(doneStageIds);
  if (activeStageId) executedStageIds.add(activeStageId);
  const executedOrderIds = order.slice(0, clampedIndex + 1).map((s) => s.stageId);
  return {
    doneStageIds,
    activeStageId,
    executedStageIds,
    executedOrderIds,
    errors: overlay.errors,
    retryAttempts: projectRetryAttempts(overlay, clampedIndex)
  };
}
var NO_RETRIES = /* @__PURE__ */ new Map();
function projectRetryAttempts(overlay, upToIndex) {
  const source = overlay.retryAttempts;
  if (!source || source.size === 0) return NO_RETRIES;
  const order = overlay.executionOrder;
  const out = /* @__PURE__ */ new Map();
  for (let i = 0; i <= upToIndex && i < order.length; i++) {
    const step = order[i];
    const attempts = source.get(step.runtimeStageId);
    if (attempts !== void 0 && attempts > 1) out.set(step.stageId, attempts);
  }
  const stepped = new Set(order.map((s) => s.runtimeStageId));
  for (const [runtimeStageId, attempts] of source) {
    if (attempts > 1 && !stepped.has(runtimeStageId)) {
      out.set(parseStageIdFromRuntimeStageId(runtimeStageId), attempts);
    }
  }
  return out;
}

// src/components/StageNode/StageNode.tsx
import { memo as memo5, useEffect as useEffect10, useRef as useRef8 } from "react";
import { Handle as Handle3, Position as Position4 } from "@xyflow/react";
import { Fragment as Fragment10, jsx as jsx25, jsxs as jsxs23 } from "react/jsx-runtime";
var KEYFRAMES_ID = "fp-stage-node-keyframes";
var KEYFRAMES_CSS = `
@media (prefers-reduced-motion: no-preference) {
  @keyframes fp-pulse {
    0%, 100% { opacity: 0.4; transform: scale(1); }
    50% { opacity: 0.15; transform: scale(1.06); }
  }
  @keyframes fp-blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
}
@media (prefers-reduced-motion: reduce) {
  @keyframes fp-pulse { 0%, 100% { opacity: 0.3; } }
  @keyframes fp-blink { 0%, 100% { opacity: 1; } }
}
`;
var ICON_SIZE = 16;
function StageIcon({ type, color }) {
  const s = ICON_SIZE;
  const props = { width: s, height: s, viewBox: `0 0 ${s} ${s}`, fill: "none", style: { flexShrink: 0 } };
  switch (type) {
    // LLM / AI call — brain/sparkle
    case "llm":
    case "ai":
      return /* @__PURE__ */ jsxs23("svg", { ...props, children: [
        /* @__PURE__ */ jsx25("circle", { cx: "8", cy: "8", r: "6", stroke: color, strokeWidth: "1.5" }),
        /* @__PURE__ */ jsx25("path", { d: "M5.5 8C5.5 6.5 6.5 5 8 5S10.5 6.5 10.5 8", stroke: color, strokeWidth: "1.2", strokeLinecap: "round" }),
        /* @__PURE__ */ jsx25("circle", { cx: "8", cy: "9.5", r: "1", fill: color }),
        /* @__PURE__ */ jsx25("line", { x1: "8", y1: "2", x2: "8", y2: "3.5", stroke: color, strokeWidth: "1", strokeLinecap: "round" }),
        /* @__PURE__ */ jsx25("line", { x1: "12.5", y1: "4", x2: "11.2", y2: "5", stroke: color, strokeWidth: "1", strokeLinecap: "round" }),
        /* @__PURE__ */ jsx25("line", { x1: "3.5", y1: "4", x2: "4.8", y2: "5", stroke: color, strokeWidth: "1", strokeLinecap: "round" })
      ] });
    // Tool / function call — gear
    case "tool":
    case "function":
      return /* @__PURE__ */ jsxs23("svg", { ...props, children: [
        /* @__PURE__ */ jsx25("circle", { cx: "8", cy: "8", r: "3", stroke: color, strokeWidth: "1.5" }),
        [0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
          const rad = angle * Math.PI / 180;
          const x1 = 8 + Math.cos(rad) * 4.5;
          const y1 = 8 + Math.sin(rad) * 4.5;
          const x2 = 8 + Math.cos(rad) * 6;
          const y2 = 8 + Math.sin(rad) * 6;
          return /* @__PURE__ */ jsx25("line", { x1, y1, x2, y2, stroke: color, strokeWidth: "1.5", strokeLinecap: "round" }, angle);
        })
      ] });
    // RAG / retrieval — magnifying glass + doc
    case "rag":
    case "search":
    case "retrieval":
      return /* @__PURE__ */ jsxs23("svg", { ...props, children: [
        /* @__PURE__ */ jsx25("circle", { cx: "7", cy: "7", r: "4", stroke: color, strokeWidth: "1.5" }),
        /* @__PURE__ */ jsx25("line", { x1: "10", y1: "10", x2: "13.5", y2: "13.5", stroke: color, strokeWidth: "1.5", strokeLinecap: "round" }),
        /* @__PURE__ */ jsx25("line", { x1: "5.5", y1: "6", x2: "8.5", y2: "6", stroke: color, strokeWidth: "1", strokeLinecap: "round" }),
        /* @__PURE__ */ jsx25("line", { x1: "5.5", y1: "8", x2: "7.5", y2: "8", stroke: color, strokeWidth: "1", strokeLinecap: "round" })
      ] });
    // Parse / process — diamond with arrows
    case "parse":
    case "process":
    case "transform":
      return /* @__PURE__ */ jsx25("svg", { ...props, children: /* @__PURE__ */ jsx25("rect", { x: "4", y: "4", width: "8", height: "8", rx: "1.5", stroke: color, strokeWidth: "1.5", transform: "rotate(45 8 8)" }) });
    // Start / seed — play triangle
    case "start":
    case "seed":
    case "init":
      return /* @__PURE__ */ jsx25("svg", { ...props, children: /* @__PURE__ */ jsx25("path", { d: "M5 3.5L12.5 8L5 12.5V3.5Z", fill: color, opacity: "0.8" }) });
    // End / finalize — stop square
    case "end":
    case "finalize":
    case "output":
      return /* @__PURE__ */ jsx25("svg", { ...props, children: /* @__PURE__ */ jsx25("rect", { x: "4", y: "4", width: "8", height: "8", rx: "1.5", fill: color, opacity: "0.8" }) });
    // Agent — person silhouette
    case "agent":
    case "orchestrator":
      return /* @__PURE__ */ jsxs23("svg", { ...props, children: [
        /* @__PURE__ */ jsx25("circle", { cx: "8", cy: "5", r: "2.5", stroke: color, strokeWidth: "1.5" }),
        /* @__PURE__ */ jsx25("path", { d: "M3.5 14C3.5 11 5.5 9 8 9S12.5 11 12.5 14", stroke: color, strokeWidth: "1.5", strokeLinecap: "round" })
      ] });
    // Swarm — multi-agent
    case "swarm":
    case "multi-agent":
      return /* @__PURE__ */ jsxs23("svg", { ...props, children: [
        /* @__PURE__ */ jsx25("circle", { cx: "5", cy: "5", r: "2", stroke: color, strokeWidth: "1.2" }),
        /* @__PURE__ */ jsx25("circle", { cx: "11", cy: "5", r: "2", stroke: color, strokeWidth: "1.2" }),
        /* @__PURE__ */ jsx25("circle", { cx: "8", cy: "11", r: "2", stroke: color, strokeWidth: "1.2" }),
        /* @__PURE__ */ jsx25("line", { x1: "5", y1: "7", x2: "8", y2: "9", stroke: color, strokeWidth: "1", opacity: "0.5" }),
        /* @__PURE__ */ jsx25("line", { x1: "11", y1: "7", x2: "8", y2: "9", stroke: color, strokeWidth: "1", opacity: "0.5" })
      ] });
    // Guard / guardrail — shield
    case "guard":
    case "guardrail":
    case "validate":
      return /* @__PURE__ */ jsxs23("svg", { ...props, children: [
        /* @__PURE__ */ jsx25("path", { d: "M8 2L3 5V9C3 11.5 5 13.5 8 14.5C11 13.5 13 11.5 13 9V5L8 2Z", stroke: color, strokeWidth: "1.5", strokeLinejoin: "round" }),
        /* @__PURE__ */ jsx25("path", { d: "M6 8L7.5 9.5L10 6.5", stroke: color, strokeWidth: "1.2", strokeLinecap: "round", strokeLinejoin: "round" })
      ] });
    // Stream — wave
    case "stream":
    case "streaming":
      return /* @__PURE__ */ jsxs23("svg", { ...props, children: [
        /* @__PURE__ */ jsx25("path", { d: "M2 8C4 5 6 11 8 8S12 5 14 8", stroke: color, strokeWidth: "1.5", strokeLinecap: "round", fill: "none" }),
        /* @__PURE__ */ jsx25("path", { d: "M2 11C4 8 6 14 8 11S12 8 14 11", stroke: color, strokeWidth: "1", strokeLinecap: "round", fill: "none", opacity: "0.5" })
      ] });
    // Memory / state — database cylinder
    case "memory":
    case "state":
    case "db":
      return /* @__PURE__ */ jsxs23("svg", { ...props, children: [
        /* @__PURE__ */ jsx25("ellipse", { cx: "8", cy: "4.5", rx: "5", ry: "2", stroke: color, strokeWidth: "1.3" }),
        /* @__PURE__ */ jsx25("line", { x1: "3", y1: "4.5", x2: "3", y2: "11.5", stroke: color, strokeWidth: "1.3" }),
        /* @__PURE__ */ jsx25("line", { x1: "13", y1: "4.5", x2: "13", y2: "11.5", stroke: color, strokeWidth: "1.3" }),
        /* @__PURE__ */ jsx25("ellipse", { cx: "8", cy: "11.5", rx: "5", ry: "2", stroke: color, strokeWidth: "1.3" })
      ] });
    // System prompt — document with lines
    case "system-prompt":
    case "prompt":
    case "instructions":
    case "document":
      return /* @__PURE__ */ jsxs23("svg", { ...props, children: [
        /* @__PURE__ */ jsx25("rect", { x: "3.5", y: "2", width: "9", height: "12", rx: "1.5", stroke: color, strokeWidth: "1.3", fill: "none" }),
        /* @__PURE__ */ jsx25("line", { x1: "5.5", y1: "5", x2: "10.5", y2: "5", stroke: color, strokeWidth: "1", strokeLinecap: "round" }),
        /* @__PURE__ */ jsx25("line", { x1: "5.5", y1: "7.5", x2: "10.5", y2: "7.5", stroke: color, strokeWidth: "1", strokeLinecap: "round" }),
        /* @__PURE__ */ jsx25("line", { x1: "5.5", y1: "10", x2: "8.5", y2: "10", stroke: color, strokeWidth: "1", strokeLinecap: "round" })
      ] });
    // Messages / conversation — chat bubble
    case "messages":
    case "chat":
    case "conversation":
      return /* @__PURE__ */ jsxs23("svg", { ...props, children: [
        /* @__PURE__ */ jsx25("rect", { x: "2.5", y: "3", width: "11", height: "8", rx: "2", stroke: color, strokeWidth: "1.3", fill: "none" }),
        /* @__PURE__ */ jsx25("path", { d: "M5.5 11L5.5 13.5L8.5 11", stroke: color, strokeWidth: "1.3", strokeLinecap: "round", strokeLinejoin: "round", fill: "none" }),
        /* @__PURE__ */ jsx25("line", { x1: "5", y1: "6", x2: "11", y2: "6", stroke: color, strokeWidth: "1", strokeLinecap: "round" }),
        /* @__PURE__ */ jsx25("line", { x1: "5", y1: "8.5", x2: "9", y2: "8.5", stroke: color, strokeWidth: "1", strokeLinecap: "round" })
      ] });
    // Loop — circular arrow
    case "loop":
    case "retry":
      return /* @__PURE__ */ jsxs23("svg", { ...props, children: [
        /* @__PURE__ */ jsx25("path", { d: "M12 8A4 4 0 1 1 8 4", stroke: color, strokeWidth: "1.5", strokeLinecap: "round", fill: "none" }),
        /* @__PURE__ */ jsx25("path", { d: "M8 1.5L10.5 4L8 6.5", stroke: color, strokeWidth: "1.3", strokeLinecap: "round", strokeLinejoin: "round", fill: "none" })
      ] });
    // Lazy / service — cloud (deferred resolution, loaded on demand)
    case "lazy":
    case "service":
    case "cloud":
      return /* @__PURE__ */ jsx25("svg", { ...props, children: /* @__PURE__ */ jsx25(
        "path",
        {
          d: "M4.5 12C2.8 12 1.5 10.7 1.5 9C1.5 7.5 2.5 6.3 3.8 6C4 4 5.8 2.5 8 2.5C9.8 2.5 11.3 3.5 11.9 5C13.9 5.2 15.5 6.8 15.5 8.8C15.5 10.8 13.9 12.5 11.8 12.5H4.5",
          stroke: color,
          strokeWidth: "1.3",
          strokeLinecap: "round",
          fill: "none"
        }
      ) });
    // Decision — diamond (already handled by isDecider shape)
    case "decision":
    case "router":
      return /* @__PURE__ */ jsxs23("svg", { ...props, children: [
        /* @__PURE__ */ jsx25("path", { d: "M8 2L14 8L8 14L2 8Z", stroke: color, strokeWidth: "1.5", fill: "none" }),
        /* @__PURE__ */ jsx25("circle", { cx: "8", cy: "8", r: "1.5", fill: color })
      ] });
    default:
      return null;
  }
}
var StageNode = memo5(function StageNode2({
  data
}) {
  const { label, active, done, error, linked, icon, stepNumbers, dimmed, isSubflow, isLazy, isDecider, isFork, description, stageId, showStageId, retryAttempts } = data;
  const effectiveIcon = icon || (isLazy ? "lazy" : void 0);
  const isLazyUnresolved = isLazy && !done && !active;
  const injectedRef = useRef8(false);
  useEffect10(() => {
    if (injectedRef.current) return;
    if (typeof document !== "undefined" && !document.getElementById(KEYFRAMES_ID)) {
      const styleEl = document.createElement("style");
      styleEl.id = KEYFRAMES_ID;
      styleEl.textContent = KEYFRAMES_CSS;
      document.head.appendChild(styleEl);
    }
    injectedRef.current = true;
  }, []);
  const isOnPath = active || done;
  const showRetryBadge = typeof retryAttempts === "number" && retryAttempts > 1;
  const retryLabel = showRetryBadge ? `retried, attempt ${retryAttempts} of ${retryAttempts} ${error ? "failed" : "succeeded"}` : void 0;
  const isHero = data.emphasis === "hero";
  const isMuted = data.emphasis === "muted";
  const sizeScale = data.size === "lg" ? 1.3 : data.size === "sm" ? 0.85 : 1;
  const restingBg = isHero ? `color-mix(in srgb, ${theme.nodeMain} 12%, ${theme.bgSecondary})` : theme.bgSecondary;
  const restingBorder = isHero ? theme.nodeMain : theme.border;
  const restingShadow = isHero ? `0 0 10px color-mix(in srgb, ${theme.nodeMain} 22%, transparent)` : `0 2px 8px rgba(0,0,0,0.15)`;
  const bg = active ? theme.nodeCursor : isHero && done ? theme.nodeMain : done ? theme.nodeVisited : error ? theme.error : restingBg;
  const borderColor = active ? theme.nodeCursor : isHero && done ? theme.nodeMain : done ? theme.nodeVisited : error ? theme.error : restingBorder;
  const shadow = active ? `0 0 22px color-mix(in srgb, ${theme.nodeCursor} 55%, transparent)` : isHero && done ? `0 0 12px color-mix(in srgb, ${theme.nodeMain} 30%, transparent)` : done ? `0 0 8px color-mix(in srgb, ${theme.nodeVisited} 20%, transparent)` : error ? `0 0 12px color-mix(in srgb, ${theme.error} 30%, transparent)` : restingShadow;
  const textColor = active ? "#1a1a1a" : done || error ? "#fff" : theme.textPrimary;
  return /* @__PURE__ */ jsxs23(Fragment10, { children: [
    /* @__PURE__ */ jsx25(Handle3, { type: "target", position: Position4.Top, style: { opacity: 0 } }),
    /* @__PURE__ */ jsx25("div", { style: { width: "100%", display: "flex", justifyContent: "center" }, children: /* @__PURE__ */ jsxs23(
      "div",
      {
        style: {
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: 6,
          // Plumbing recedes. Layers with the run-overlay `dimmed` (not-yet-run)
          // — a muted AND not-run node is faintest, which is correct.
          opacity: isMuted ? 0.5 : void 0
        },
        children: [
          stepNumbers && stepNumbers.length > 0 && isOnPath && /* @__PURE__ */ jsx25(
            "div",
            {
              style: {
                position: "absolute",
                top: -10,
                left: -10,
                display: "flex",
                gap: 3,
                zIndex: 10
              },
              children: stepNumbers.map((num, i) => {
                const isLatest = i === stepNumbers.length - 1;
                const badgeBg = isLatest && active ? theme.nodeCursor : theme.nodeVisited;
                const glow = isLatest && active ? `color-mix(in srgb, ${theme.nodeCursor} 50%, transparent)` : `color-mix(in srgb, ${theme.nodeVisited} 40%, transparent)`;
                return /* @__PURE__ */ jsx25(
                  "div",
                  {
                    style: {
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: badgeBg,
                      color: "#fff",
                      fontSize: 11,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: `0 0 8px ${glow}`
                    },
                    children: num
                  },
                  num
                );
              })
            }
          ),
          linked && /* @__PURE__ */ jsx25(
            "div",
            {
              style: {
                position: "absolute",
                inset: -6,
                borderRadius: isDecider ? 0 : `calc(${theme.radius} + 4px)`,
                clipPath: isDecider ? "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" : void 0,
                border: `2px solid ${theme.primary}`,
                opacity: 0.4,
                animation: "fp-pulse 2s ease-in-out infinite"
              }
            }
          ),
          active && /* @__PURE__ */ jsx25(
            "div",
            {
              style: {
                position: "absolute",
                inset: -6,
                borderRadius: isDecider ? 0 : `calc(${theme.radius} + 4px)`,
                clipPath: isDecider ? "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" : void 0,
                border: `2px solid ${theme.nodeCursor}`,
                opacity: 0.3,
                animation: "fp-pulse 1.5s ease-out infinite"
              }
            }
          ),
          active && /* @__PURE__ */ jsx25(
            "div",
            {
              style: {
                position: "absolute",
                top: -9,
                right: -8,
                zIndex: 11,
                background: theme.warning,
                color: "#1a1a1a",
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: 0.6,
                padding: "2px 6px",
                borderRadius: 10,
                boxShadow: `0 0 10px color-mix(in srgb, ${theme.warning} 60%, transparent)`
              },
              children: "NOW"
            }
          ),
          showRetryBadge && /* @__PURE__ */ jsxs23(
            "div",
            {
              role: "img",
              "aria-label": retryLabel,
              title: retryLabel,
              style: {
                position: "absolute",
                bottom: -9,
                right: -8,
                zIndex: 11,
                display: "flex",
                alignItems: "center",
                gap: 2,
                background: theme.bgSecondary,
                border: `1px solid ${theme.warning}`,
                color: theme.warning,
                fontFamily: theme.fontSans,
                fontSize: 9,
                fontWeight: 700,
                lineHeight: 1,
                letterSpacing: 0.2,
                padding: "2px 5px",
                borderRadius: 9,
                whiteSpace: "nowrap"
              },
              children: [
                /* @__PURE__ */ jsx25("span", { "aria-hidden": "true", children: "\u21BA" }),
                /* @__PURE__ */ jsxs23("span", { "aria-hidden": "true", children: [
                  "\xD7",
                  retryAttempts
                ] })
              ]
            }
          ),
          isDecider ? /* @__PURE__ */ jsxs23("div", { style: { position: "relative", width: 120, height: 72 }, children: [
            /* @__PURE__ */ jsx25(
              "div",
              {
                style: {
                  position: "absolute",
                  inset: 0,
                  background: bg,
                  clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
                  border: "none",
                  boxShadow: shadow,
                  transition: "all 0.3s ease"
                }
              }
            ),
            /* @__PURE__ */ jsx25(
              "div",
              {
                style: {
                  position: "absolute",
                  inset: -2,
                  clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
                  background: borderColor,
                  zIndex: -1,
                  ...isLazyUnresolved ? {
                    background: "transparent"
                    // Dashed border via SVG for clip-path (CSS border doesn't work with clip-path)
                  } : {}
                }
              }
            ),
            /* @__PURE__ */ jsxs23(
              "div",
              {
                style: {
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                  fontFamily: theme.fontSans,
                  zIndex: 1
                },
                children: [
                  /* @__PURE__ */ jsxs23("div", { style: { display: "flex", alignItems: "center", gap: 4 }, children: [
                    effectiveIcon && /* @__PURE__ */ jsx25(StageIcon, { type: effectiveIcon, color: textColor }),
                    !effectiveIcon && /* @__PURE__ */ jsx25("span", { style: { fontSize: 9, color: textColor }, children: "\u25C7" }),
                    /* @__PURE__ */ jsx25(
                      "span",
                      {
                        style: {
                          fontSize: 11,
                          fontWeight: 600,
                          color: textColor,
                          whiteSpace: "nowrap"
                        },
                        children: label
                      }
                    )
                  ] }),
                  description && /* @__PURE__ */ jsx25(
                    "span",
                    {
                      style: {
                        fontSize: 8,
                        fontWeight: 400,
                        color: textColor,
                        opacity: 0.7,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: 100
                      },
                      children: description
                    }
                  ),
                  showStageId && stageId && /* @__PURE__ */ jsx25(
                    "span",
                    {
                      style: {
                        fontSize: 8,
                        fontFamily: "ui-monospace, monospace",
                        color: textColor,
                        opacity: 0.55,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: 100
                      },
                      title: `stageId: ${stageId}`,
                      children: stageId
                    }
                  )
                ]
              }
            )
          ] }) : (
            /* Standard rectangular node */
            /* @__PURE__ */ jsxs23(
              "div",
              {
                style: {
                  background: bg,
                  border: `${isHero ? "2.5px" : isMuted ? "1px" : "2px"} ${isLazyUnresolved ? "dashed" : "solid"} ${borderColor}`,
                  borderRadius: theme.radius,
                  padding: description ? `${Math.round(6 * sizeScale)}px ${Math.round(12 * sizeScale)}px` : `${Math.round(7 * sizeScale)}px ${Math.round(14 * sizeScale)}px`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: description ? 2 : 0,
                  boxShadow: shadow,
                  transition: "all 0.3s ease",
                  fontFamily: theme.fontSans,
                  minWidth: 100,
                  justifyContent: "center"
                },
                children: [
                  /* @__PURE__ */ jsxs23("div", { style: { display: "flex", alignItems: "center", gap: 6 }, children: [
                    effectiveIcon && /* @__PURE__ */ jsx25(StageIcon, { type: effectiveIcon, color: textColor }),
                    done && !effectiveIcon && /* @__PURE__ */ jsx25("span", { style: { fontSize: 10, color: textColor }, children: "\u2713" }),
                    active && !effectiveIcon && /* @__PURE__ */ jsx25(
                      "span",
                      {
                        style: {
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: "#fff",
                          animation: "fp-blink 1s ease-in-out infinite",
                          flexShrink: 0
                        }
                      }
                    ),
                    error && !effectiveIcon && /* @__PURE__ */ jsx25("span", { style: { fontSize: 10, color: textColor }, children: "\u2717" }),
                    /* @__PURE__ */ jsx25(
                      "span",
                      {
                        style: {
                          fontSize: Math.round(13 * sizeScale),
                          fontWeight: isHero ? 700 : 500,
                          color: textColor,
                          whiteSpace: "nowrap"
                        },
                        children: label
                      }
                    ),
                    isSubflow && /* @__PURE__ */ jsx25(
                      "span",
                      {
                        style: {
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 16,
                          height: 16,
                          borderRadius: 3,
                          border: `1.5px solid ${textColor}`,
                          position: "relative",
                          opacity: 0.7,
                          flexShrink: 0
                        },
                        children: /* @__PURE__ */ jsx25(
                          "span",
                          {
                            style: {
                              width: 8,
                              height: 8,
                              borderRadius: 2,
                              border: `1px solid ${textColor}`
                            }
                          }
                        )
                      }
                    )
                  ] }),
                  description && /* @__PURE__ */ jsx25(
                    "span",
                    {
                      style: {
                        fontSize: 10,
                        fontWeight: 400,
                        color: textColor,
                        opacity: 0.7,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: 160
                      },
                      children: description
                    }
                  ),
                  showStageId && stageId && /* @__PURE__ */ jsx25(
                    "span",
                    {
                      style: {
                        fontSize: 9,
                        fontFamily: "ui-monospace, monospace",
                        color: textColor,
                        opacity: 0.55,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: 160
                      },
                      title: `stageId: ${stageId}`,
                      children: stageId
                    }
                  )
                ]
              }
            )
          )
        ]
      }
    ) }),
    /* @__PURE__ */ jsx25(Handle3, { type: "source", position: Position4.Bottom, style: { opacity: 0 } })
  ] });
});

// src/components/FlowchartView/_internal/collapseGraph.ts
function scopesOf(node) {
  const local = node.data?.subflowId;
  return typeof local === "string" && local !== node.id ? [node.id, local] : [node.id];
}
function collapseTraceGraph(graph, hide) {
  const hiddenNodeIds = [];
  const removed = /* @__PURE__ */ new Set();
  const removedScopes = /* @__PURE__ */ new Set();
  for (const node of graph.nodes) {
    if (!hide(node)) continue;
    hiddenNodeIds.push(node.id);
    removed.add(node.id);
    for (const scope of scopesOf(node)) removedScopes.add(scope);
  }
  if (hiddenNodeIds.length === 0) return { graph, hiddenNodeIds };
  let grew = true;
  while (grew) {
    grew = false;
    for (const node of graph.nodes) {
      if (removed.has(node.id)) continue;
      const parent = node.data?.subflowOf;
      if (parent !== void 0 && removedScopes.has(parent)) {
        removed.add(node.id);
        for (const scope of scopesOf(node)) removedScopes.add(scope);
        grew = true;
      }
    }
  }
  const viaOf = (e) => Array.isArray(e.data?.via) ? e.data.via : [];
  let edges = [...graph.edges];
  for (const hiddenId of removed) {
    const incoming = edges.filter((e) => e.target === hiddenId && e.source !== hiddenId);
    const outgoing = edges.filter((e) => e.source === hiddenId && e.target !== hiddenId);
    edges = edges.filter((e) => e.source !== hiddenId && e.target !== hiddenId);
    for (const inEdge of incoming) {
      for (const outEdge of outgoing) {
        if (inEdge.source === outEdge.target) continue;
        const kind = inEdge.data?.kind === "loop" || outEdge.data?.kind === "loop" ? "loop" : outEdge.data?.kind ?? inEdge.data?.kind ?? "next";
        const via = [.../* @__PURE__ */ new Set([...viaOf(inEdge), hiddenId, ...viaOf(outEdge)])];
        edges.push({
          id: `${inEdge.source}->${outEdge.target}~collapsed`,
          source: inEdge.source,
          target: outEdge.target,
          data: { kind, via }
        });
      }
    }
  }
  const byEndpoints = /* @__PURE__ */ new Map();
  for (const e of edges) {
    const key = `${e.source}\0${e.target}`;
    const kept = byEndpoints.get(key);
    if (kept === void 0) {
      byEndpoints.set(key, e);
      continue;
    }
    const mergedVia = [.../* @__PURE__ */ new Set([...viaOf(kept), ...viaOf(e)])];
    if (mergedVia.length > viaOf(kept).length) {
      byEndpoints.set(key, {
        ...kept,
        data: { ...kept.data ?? { kind: "next" }, via: mergedVia }
      });
    }
  }
  const dedupedEdges = [...byEndpoints.values()];
  return {
    graph: {
      nodes: graph.nodes.filter((n) => !removed.has(n.id)),
      edges: dedupedEdges
    },
    hiddenNodeIds
  };
}

// src/components/FlowchartView/_internal/overlayProjection.ts
function aggregateMountStatus(slice, graph, currentSubflowId) {
  if (graph.nodes.length === 0) return slice;
  const nodeIds = new Set(graph.nodes.map((n) => n.id));
  const mounts = graph.nodes.filter((n) => n.data?.isSubflow && n.data?.subflowId);
  const doneIds = new Set(slice.doneStageIds);
  let activeId = slice.activeStageId;
  for (const mount of mounts) {
    const scope = resolveDrillScope(graph, mount.id);
    const members = graph.nodes.filter((n) => n.data?.subflowOf === scope);
    if (members.length === 0) continue;
    const anyActive = members.some((m) => m.id === slice.activeStageId);
    const allDone = members.every((m) => slice.doneStageIds.has(m.id));
    if (allDone) doneIds.add(mount.id);
    else if (anyActive && currentSubflowId === null) {
      activeId = mount.id;
    }
  }
  if (activeId !== null && !nodeIds.has(activeId)) {
    for (const ancestor of pathAncestorsOf(activeId)) {
      if (nodeIds.has(ancestor)) {
        activeId = ancestor;
        break;
      }
    }
  }
  return { ...slice, doneStageIds: doneIds, activeStageId: activeId };
}
function pathAncestorsOf(stageId) {
  const ancestors = [];
  let id = stageId;
  for (; ; ) {
    const cut = id.lastIndexOf("/");
    if (cut < 0) break;
    id = id.slice(0, cut);
    ancestors.push(id);
  }
  return ancestors;
}
var NO_IDS = /* @__PURE__ */ new Set();
function cursorStandInIds(activeStageId) {
  if (activeStageId === null || activeStageId.length === 0) return NO_IDS;
  return /* @__PURE__ */ new Set([activeStageId, ...pathAncestorsOf(activeStageId)]);
}
function edgeCarriesCursor(via, standIns) {
  if (standIns.size === 0 || !Array.isArray(via)) return false;
  return via.some((v2) => typeof v2 === "string" && standIns.has(v2));
}

// src/components/FlowchartView/_internal/useSubflowDrill.ts
import { useCallback as useCallback7, useEffect as useEffect11, useRef as useRef9, useState as useState14 } from "react";
function useSubflowDrill(graph, onSubflowChange, controlledSubflowId) {
  const isControlled = controlledSubflowId !== void 0;
  const [ownSubflowId, setOwnSubflowId] = useState14(null);
  const currentSubflowId = isControlled ? controlledSubflowId : ownSubflowId;
  const lastGraphRef = useRef9(null);
  if (!isControlled && lastGraphRef.current !== graph) {
    lastGraphRef.current = graph;
    if (ownSubflowId !== null && findMountNode(graph, ownSubflowId) === void 0) {
      queueMicrotask(() => setOwnSubflowId(null));
    }
  }
  const lastNotifiedRef = useRef9(void 0);
  useEffect11(() => {
    if (isControlled) return;
    if (lastNotifiedRef.current === currentSubflowId) return;
    lastNotifiedRef.current = currentSubflowId;
    onSubflowChange?.(currentSubflowId);
  }, [isControlled, currentSubflowId, onSubflowChange]);
  const setCurrentSubflowId = useCallback7(
    (id) => {
      if (isControlled) onSubflowChange?.(id);
      else setOwnSubflowId(id);
    },
    [isControlled, onSubflowChange]
  );
  const drillInto = useCallback7(
    (mountNodeId) => setCurrentSubflowId(mountNodeId),
    [setCurrentSubflowId]
  );
  const drillUp = useCallback7(() => setCurrentSubflowId(null), [setCurrentSubflowId]);
  return { currentSubflowId, drillInto, drillUp, setCurrentSubflowId };
}

// src/components/FlowchartView/SubflowBreadcrumbBar.tsx
import { jsx as jsx26, jsxs as jsxs24 } from "react/jsx-runtime";
function SubflowBreadcrumbBar({ entries, onNavigate }) {
  return /* @__PURE__ */ jsx26(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 12px",
        fontSize: 11,
        background: theme.bgSecondary,
        borderBottom: `1px solid ${theme.border}`,
        flexShrink: 0
      },
      "aria-label": "Subflow breadcrumb",
      children: entries.map((entry, i) => {
        const isLast = i === entries.length - 1;
        return /* @__PURE__ */ jsxs24(
          "span",
          {
            style: { display: "inline-flex", alignItems: "center", gap: 6 },
            children: [
              /* @__PURE__ */ jsx26(
                "button",
                {
                  type: "button",
                  onClick: () => onNavigate(entry.subflowId),
                  disabled: isLast,
                  style: {
                    background: "transparent",
                    border: "none",
                    padding: 0,
                    fontSize: 11,
                    fontWeight: isLast ? 600 : 500,
                    color: isLast ? theme.textPrimary : theme.primary,
                    cursor: isLast ? "default" : "pointer",
                    textDecoration: isLast ? "none" : "underline",
                    fontFamily: "inherit"
                  },
                  children: entry.label
                }
              ),
              !isLast && /* @__PURE__ */ jsx26("span", { style: { color: theme.textMuted }, children: "\u203A" })
            ]
          },
          entry.subflowId ?? "__top__"
        );
      })
    }
  );
}

// src/components/LoopBackEdge/LoopBackEdge.tsx
import { BaseEdge as BaseEdge2, useStore } from "@xyflow/react";

// src/components/FlowchartView/_internal/loopRouting.ts
var LOOP_LANE_GAP = 56;
function loopLaneX(contentRights, gap = LOOP_LANE_GAP) {
  let max = -Infinity;
  for (const r of contentRights) if (r > max) max = r;
  if (!Number.isFinite(max)) max = 0;
  return max + gap;
}
function loopBackPath(source, target, laneX, radius = 22) {
  const { right: sx, centerY: sy } = source;
  const { right: tx, centerY: ty } = target;
  const r = Math.max(
    0,
    Math.min(radius, Math.abs(sy - ty) / 2, laneX - sx, laneX - tx)
  );
  const up = ty <= sy;
  const vy1 = up ? sy - r : sy + r;
  const vy2 = up ? ty + r : ty - r;
  return [
    `M ${sx},${sy}`,
    `L ${laneX - r},${sy}`,
    `Q ${laneX},${sy} ${laneX},${vy1}`,
    `L ${laneX},${vy2}`,
    `Q ${laneX},${ty} ${laneX - r},${ty}`,
    `L ${tx},${ty}`
  ].join(" ");
}

// src/components/FlowchartView/_internal/groupLayout.ts
var GROUP_CONTAINER_NODE_TYPE = "groupContainer";
var DEFAULT_PADDING = 16;
var DEFAULT_HEADER = 44;
var DEFAULT_NODE_W2 = 200;
var DEFAULT_NODE_H2 = 80;
function footprintOf(node, fallbackW, fallbackH) {
  const style = node.style ?? {};
  const w = typeof style.width === "number" ? style.width : fallbackW;
  const h = typeof style.height === "number" ? style.height : fallbackH;
  return { width: w, height: h };
}
function applyGroupLayout(graph, opts) {
  const padding2 = opts.padding ?? DEFAULT_PADDING;
  const headerHeight = opts.headerHeight ?? DEFAULT_HEADER;
  const nodeW = opts.nodeWidth ?? DEFAULT_NODE_W2;
  const nodeH = opts.nodeHeight ?? DEFAULT_NODE_H2;
  const baseLayout = opts.baseLayout;
  const requested = new Set(opts.groupedSubflowIds);
  const membersBySubflow = /* @__PURE__ */ new Map();
  for (const n of graph.nodes) {
    const of = n.data?.subflowOf;
    if (of !== void 0 && requested.has(of)) {
      const arr = membersBySubflow.get(of) ?? [];
      arr.push(n);
      membersBySubflow.set(of, arr);
    }
  }
  const mountBySubflow = /* @__PURE__ */ new Map();
  for (const n of graph.nodes) {
    const sfId = n.data?.subflowId;
    if (n.data?.isSubflow && sfId !== void 0 && requested.has(sfId) && membersBySubflow.has(sfId)) {
      mountBySubflow.set(sfId, n);
    }
  }
  const activeGroups = /* @__PURE__ */ new Set();
  for (const sfId of mountBySubflow.keys()) activeGroups.add(sfId);
  if (activeGroups.size === 0) {
    return graph;
  }
  const memberIds = /* @__PURE__ */ new Set();
  for (const sfId of activeGroups) {
    for (const m of membersBySubflow.get(sfId) ?? []) memberIds.add(m.id);
  }
  const containerNodes = [];
  const nestedMembers = [];
  const groupBox = /* @__PURE__ */ new Map();
  for (const sfId of activeGroups) {
    const members = membersBySubflow.get(sfId);
    const innerOnlyEdges = graph.edges.filter((e) => {
      const s = members.some((m) => m.id === e.source);
      const t = members.some((m) => m.id === e.target);
      return s && t;
    });
    const innerPositioned = baseLayout({ nodes: members, edges: innerOnlyEdges });
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const m of innerPositioned.nodes) {
      const p = m.position;
      const { width, height } = footprintOf(m, nodeW, nodeH);
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x + width > maxX) maxX = p.x + width;
      if (p.y + height > maxY) maxY = p.y + height;
    }
    if (!Number.isFinite(minX)) {
      minX = 0;
      minY = 0;
      maxX = 0;
      maxY = 0;
    }
    const boxWidth = maxX - minX + padding2 * 2;
    const boxHeight = maxY - minY + headerHeight + padding2 * 2;
    groupBox.set(sfId, { width: boxWidth, height: boxHeight, minX, minY, members: innerPositioned.nodes });
  }
  const outerNodes = graph.nodes.filter((n) => !memberIds.has(n.id)).map((n) => {
    const box2 = n.data?.subflowId ? groupBox.get(n.data.subflowId) : void 0;
    return box2 ? {
      ...n,
      style: { ...n.style ?? {}, width: box2.width, height: box2.height },
      data: { ...n.data, isGroupContainer: true }
    } : n;
  });
  const outerEdges = graph.edges.filter(
    (e) => !memberIds.has(e.source) && !memberIds.has(e.target)
  );
  const outerPositioned = baseLayout({ nodes: outerNodes, edges: outerEdges });
  const outerPosById = new Map(outerPositioned.nodes.map((n) => [n.id, n.position]));
  for (const sfId of activeGroups) {
    const mount = mountBySubflow.get(sfId);
    const box2 = groupBox.get(sfId);
    const { width: boxWidth, height: boxHeight, minX, minY } = box2;
    const mountPos = outerPosById.get(mount.id) ?? mount.position ?? { x: 0, y: 0 };
    containerNodes.push({
      ...mount,
      type: GROUP_CONTAINER_NODE_TYPE,
      position: mountPos,
      style: { ...mount.style ?? {}, width: boxWidth, height: boxHeight },
      data: { ...mount.data, isGroupContainer: true }
    });
    for (const m of box2.members) {
      const relX = m.position.x - minX + padding2;
      const relY = m.position.y - minY + headerHeight + padding2;
      nestedMembers.push({
        ...m,
        parentId: mount.id,
        extent: "parent",
        position: { x: relX, y: relY }
      });
    }
  }
  const containerById = new Map(containerNodes.map((c) => [c.id, c]));
  const outerOut = outerPositioned.nodes.map(
    (n) => containerById.get(n.id) ?? n
  );
  return {
    nodes: [...outerOut, ...nestedMembers],
    edges: graph.edges
  };
}
var MAIN_CHART_BOX_ID = "__main_chart__";
function wrapInMainChartBox(graph, opts) {
  if (graph.nodes.length === 0) return graph;
  const padding2 = opts.padding ?? DEFAULT_PADDING;
  const headerHeight = opts.headerHeight ?? DEFAULT_HEADER;
  const nodeW = opts.nodeWidth ?? DEFAULT_NODE_W2;
  const nodeH = opts.nodeHeight ?? DEFAULT_NODE_H2;
  const mainId = opts.id ?? MAIN_CHART_BOX_ID;
  const positioned = opts.baseLayout(graph);
  const topLevel = positioned.nodes.filter((n) => n.parentId === void 0);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const n of topLevel) {
    const p = n.position;
    const { width, height } = footprintOf(n, nodeW, nodeH);
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x + width > maxX) maxX = p.x + width;
    if (p.y + height > maxY) maxY = p.y + height;
  }
  if (!Number.isFinite(minX)) {
    minX = 0;
    minY = 0;
    maxX = 0;
    maxY = 0;
  }
  const hasLoopEdge = graph.edges.some((e) => e.data?.kind === "loop");
  const loopReserve = hasLoopEdge ? LOOP_LANE_GAP : 0;
  const boxWidth = maxX - minX + padding2 * 2 + loopReserve;
  const boxHeight = maxY - minY + headerHeight + padding2 * 2;
  const container = {
    id: mainId,
    type: GROUP_CONTAINER_NODE_TYPE,
    position: { x: 0, y: 0 },
    style: { width: boxWidth, height: boxHeight },
    data: {
      label: opts.label ?? "Chart",
      isDecider: false,
      isFork: false,
      isStreaming: false,
      isSubflow: false,
      isGroupContainer: true,
      isMainChart: true,
      ...opts.kind !== void 0 && { kind: opts.kind },
      prevIds: [],
      nextIds: []
    }
  };
  const topLevelIds = new Set(topLevel.map((n) => n.id));
  const reparented = positioned.nodes.map((n) => {
    if (!topLevelIds.has(n.id)) return n;
    return {
      ...n,
      parentId: mainId,
      extent: "parent",
      position: {
        x: n.position.x - minX + padding2,
        y: n.position.y - minY + headerHeight + padding2
      }
    };
  });
  return { nodes: [container, ...reparented], edges: graph.edges };
}

// src/components/LoopBackEdge/LoopBackEdge.tsx
import { jsx as jsx27 } from "react/jsx-runtime";
var LOOP_DASH = "5 5";
var LOOP_STROKE_OPACITY_CAP = 0.55;
var LOOP_STROKE_WIDTH = 1.5;
function softenLoopStyle(style) {
  const passedStrokeOpacity = typeof style?.strokeOpacity === "number" ? style.strokeOpacity : 1;
  return {
    ...style,
    strokeDasharray: style?.strokeDasharray ?? LOOP_DASH,
    strokeOpacity: Math.min(passedStrokeOpacity, LOOP_STROKE_OPACITY_CAP),
    strokeWidth: LOOP_STROKE_WIDTH
  };
}
var LOOP_CORNER_RADIUS = 28;
function rightEdge(node) {
  return node.internals.positionAbsolute.x + (node.measured.width ?? 0);
}
function centerY(node) {
  return node.internals.positionAbsolute.y + (node.measured.height ?? 0) / 2;
}
function LoopBackEdge({ id, source, target, markerEnd, style }) {
  const path = useStore((s) => {
    const src = s.nodeLookup.get(source);
    const tgt = s.nodeLookup.get(target);
    if (!src || !tgt) return "";
    const contentRights = [];
    for (const n of s.nodeLookup.values()) {
      if (n.type === GROUP_CONTAINER_NODE_TYPE) continue;
      contentRights.push(rightEdge(n));
    }
    const laneX = loopLaneX([...contentRights, rightEdge(src), rightEdge(tgt)], LOOP_LANE_GAP);
    return loopBackPath(
      { right: rightEdge(src), centerY: centerY(src) },
      { right: rightEdge(tgt), centerY: centerY(tgt) },
      laneX,
      LOOP_CORNER_RADIUS
    );
  });
  if (!path) return null;
  return /* @__PURE__ */ jsx27(
    BaseEdge2,
    {
      id,
      path,
      markerEnd,
      style: softenLoopStyle(style),
      "aria-label": "Loop back"
    }
  );
}

// src/components/SmartStepEdge/SmartStepEdge.tsx
import { BaseEdge as BaseEdge3, getSmoothStepPath as getSmoothStepPath2, useStore as useStore2 } from "@xyflow/react";
import { Position as Position5 } from "@xyflow/react";

// src/components/FlowchartView/_internal/stepRouting.ts
function staggeredBendY(sourceBottom, targetTop, others, minGapFromTarget = 8) {
  let lowestSkippedBottom = -Infinity;
  for (const n of others) {
    const cy = (n.top + n.bottom) / 2;
    if (cy > sourceBottom && cy < targetTop && n.bottom > lowestSkippedBottom) {
      lowestSkippedBottom = n.bottom;
    }
  }
  if (lowestSkippedBottom === -Infinity) return null;
  return Math.min((lowestSkippedBottom + targetTop) / 2, targetTop - minGapFromTarget);
}
function forkFanBendY(sourceBottom, childTops, minGapFromTarget = 8) {
  if (childTops.length < 2) return null;
  const nearestTop = Math.min(...childTops);
  return Math.min((sourceBottom + nearestTop) / 2, nearestTop - minGapFromTarget);
}
function resolveStepBendY(forkBend, staggeredBend) {
  return staggeredBend ?? forkBend;
}

// src/components/SmartStepEdge/SmartStepEdge.tsx
import { jsx as jsx28 } from "react/jsx-runtime";
function SmartStepEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style
}) {
  const bendY = useStore2((s) => {
    const src = s.nodeLookup.get(source);
    const tgt = s.nodeLookup.get(target);
    if (!src || !tgt) return null;
    const sourceBottom = src.internals.positionAbsolute.y + (src.measured.height ?? 0);
    const targetTop = tgt.internals.positionAbsolute.y;
    const childTops = [];
    for (const e of s.edges) {
      if (e.source !== source) continue;
      if (e.data?.kind === "loop") continue;
      const c = s.nodeLookup.get(e.target);
      if (c && c.type !== GROUP_CONTAINER_NODE_TYPE) {
        childTops.push(c.internals.positionAbsolute.y);
      }
    }
    const fan = forkFanBendY(sourceBottom, childTops);
    const others = [];
    for (const n of s.nodeLookup.values()) {
      if (n.id === source || n.id === target) continue;
      if (n.type === GROUP_CONTAINER_NODE_TYPE) continue;
      const top = n.internals.positionAbsolute.y;
      others.push({ top, bottom: top + (n.measured.height ?? 0) });
    }
    const staggered = staggeredBendY(sourceBottom, targetTop, others);
    return resolveStepBendY(fan, staggered);
  });
  const [path] = getSmoothStepPath2({
    sourceX,
    sourceY,
    sourcePosition: sourcePosition ?? Position5.Bottom,
    targetX,
    targetY,
    targetPosition: targetPosition ?? Position5.Top,
    // Override the bend only for a staggered edge; otherwise let getSmoothStepPath
    // use its default centerY (== the built-in `smoothstep` path, byte-for-byte).
    ...bendY !== null ? { centerY: bendY } : {}
  });
  return /* @__PURE__ */ jsx28(BaseEdge3, { id, path, markerEnd, style });
}

// src/components/FlowchartView/_internal/MeasuredNodeSizes.tsx
import { useEffect as useEffect12 } from "react";
import { useNodesInitialized, useStore as useStore3 } from "@xyflow/react";

// src/components/FlowchartView/_internal/measuredFootprints.ts
function extractMeasuredFootprints(entries) {
  const sizes = /* @__PURE__ */ new Map();
  for (const [id, node] of entries) {
    const width = node.measured?.width;
    const height = node.measured?.height;
    if (typeof width === "number" && typeof height === "number" && width > 0 && height > 0) {
      sizes.set(id, { width: Math.round(width), height: Math.round(height) });
    }
  }
  return sizes;
}
function sameFootprints(a, b) {
  if (a === b) return true;
  if (a.size !== b.size) return false;
  for (const [id, s] of a) {
    const t = b.get(id);
    if (!t || t.width !== s.width || t.height !== s.height) return false;
  }
  return true;
}

// src/components/FlowchartView/_internal/MeasuredNodeSizes.tsx
function MeasuredNodeSizes({
  onSizes,
  includeHiddenNodes = false
}) {
  const initialized = useNodesInitialized({ includeHiddenNodes });
  const sizes = useStore3(
    (s) => extractMeasuredFootprints(s.nodeLookup),
    sameFootprints
  );
  useEffect12(() => {
    if (!initialized || sizes.size === 0) return;
    onSizes(sizes);
  }, [initialized, sizes, onSizes]);
  return null;
}

// src/components/FlowchartView/TracedFlow.tsx
import { jsx as jsx29, jsxs as jsxs25 } from "react/jsx-runtime";
var DEFAULT_COLORS = {
  default: rawDefaults.colors.textMuted,
  done: rawDefaults.colors.success,
  active: rawDefaults.colors.primary,
  error: rawDefaults.colors.error,
  loop: rawDefaults.colors.warning
};
var EMPTY_SET = /* @__PURE__ */ new Set();
function deriveOverlayFields(node, doneStageIds, activeStageId, errorMessage, executedOrderIds, coActiveStageIds, retryAttempts) {
  const isDone = doneStageIds.has(node.id);
  const isActive = activeStageId === node.id || coActiveStageIds.has(node.id);
  const wasExecuted = isDone || isActive;
  const hasError = !!errorMessage;
  const dimmed = !wasExecuted && executedOrderIds.length > 0;
  let stepNumbers;
  if (executedOrderIds.length > 0) {
    const nums = [];
    for (let i = 0; i < executedOrderIds.length; i++) {
      if (executedOrderIds[i] === node.id) nums.push(i + 1);
    }
    if (nums.length > 0) stepNumbers = nums;
  }
  return {
    active: isActive,
    done: isDone,
    error: hasError,
    dimmed,
    ...errorMessage && { errorMessage },
    ...stepNumbers && { stepNumbers },
    // Attempts are only ever interesting above 1 — a stage that ran once is
    // the silent default, and "×1" on every node would be noise, not truth.
    ...retryAttempts !== void 0 && retryAttempts > 1 && { retryAttempts }
  };
}
function toStageNodeWithOverlay(node, doneStageIds, activeStageId, errorMessage, executedOrderIds, coActiveStageIds, retryAttempts) {
  const overlayFields = deriveOverlayFields(
    node,
    doneStageIds,
    activeStageId,
    errorMessage,
    executedOrderIds,
    coActiveStageIds,
    retryAttempts
  );
  const { dimmed } = overlayFields;
  if (node.type !== void 0 && node.type !== "stage") {
    const consumerData = node.data ?? {};
    const consumerActive = consumerData.active === true;
    const consumerDone = consumerData.done === true;
    const consumerError = consumerData.error === true;
    const finalActive = consumerActive || overlayFields.active;
    const finalDone = consumerDone || overlayFields.done;
    const finalError = consumerError || overlayFields.error;
    const finalDimmed = !finalActive && !finalDone && dimmed;
    return {
      ...node,
      data: {
        ...node.data,
        active: finalActive,
        done: finalDone,
        error: finalError,
        ...overlayFields.errorMessage !== void 0 && consumerData.errorMessage === void 0 && {
          errorMessage: overlayFields.errorMessage
        },
        ...finalDimmed && { dimmed: true },
        ...overlayFields.stepNumbers && { stepNumbers: overlayFields.stepNumbers },
        ...overlayFields.retryAttempts !== void 0 && consumerData.retryAttempts === void 0 && {
          retryAttempts: overlayFields.retryAttempts
        }
      },
      ...finalDimmed && { style: { ...node.style ?? {}, opacity: 0.35 } }
    };
  }
  const stageData = {
    // Same pass-through rule as the custom-node branch above (and as
    // TraceFlow's `toStageNode`): the source data goes through WHOLE, so a
    // consumer's custom fields and the recorder's own metadata
    // (isStreaming, isPausable, branchIds, defaultBranch, prevIds, nextIds,
    // subflowOf) survive into `data` for a swapped-in renderer to read.
    ...node.data,
    label: node.data.label,
    isDecider: node.data.isDecider,
    isFork: node.data.isFork,
    isSubflow: node.data.isSubflow,
    // Overlay LAST — run status is derived here and always wins.
    ...overlayFields
  };
  return {
    ...node,
    type: "stageNode",
    data: stageData,
    ...dimmed && { style: { opacity: 0.35 } }
  };
}
function styleEdgeWithOverlay(edge, doneStageIds, activeStageId, colors, cursorStandIns) {
  const kind = edge.data?.kind ?? "next";
  const sourceExecuted = doneStageIds.has(edge.source) || activeStageId === edge.source;
  const targetExecuted = doneStageIds.has(edge.target) || activeStageId === edge.target;
  const traversed = sourceExecuted && targetExecuted;
  const carriesCursor = edgeCarriesCursor(edge.data?.via, cursorStandIns);
  const isLeadingEdge = carriesCursor || activeStageId === edge.source && !doneStageIds.has(edge.target);
  let color = colors.default;
  if (carriesCursor) color = colors.active;
  else if (kind === "loop") color = colors.loop;
  else if (isLeadingEdge) color = colors.active;
  else if (traversed) color = colors.done;
  const styled = {
    ...edge,
    // Loop back-edges use the custom `loopBack` edge — a curve routed along the
    // right margin (clear of the spine). It reads node bounds from the store
    // and anchors on right edges itself, so it needs NO dedicated loop handles
    // on the node (the old approach broke for any node missing them).
    // Every other edge uses `smartStep`: a smoothstep superset that routes a
    // RANK-SKIPPING edge around the node it skips (else identical to smoothstep).
    type: kind === "loop" ? "loopBack" : "smartStep",
    animated: isLeadingEdge,
    style: { stroke: color, strokeWidth: traversed || carriesCursor ? 2 : 1.5 },
    markerEnd: { type: MarkerType2.ArrowClosed, color, width: 16, height: 16 }
  };
  if (kind === "loop") {
    styled.style = { ...styled.style, strokeDasharray: "4 3" };
  }
  return styled;
}
var DEFAULT_NODE_TYPES = {
  stageNode: StageNode,
  groupContainer: GroupContainerNode
};
var DEFAULT_EDGE_TYPES = { loopBack: LoopBackEdge, smartStep: SmartStepEdge };
function TracedFlow({
  graph,
  overlay,
  scrubIndex,
  layout: layoutProp,
  colors: colorOverrides,
  onNodeClick,
  onSubflowChange,
  currentSubflowId: controlledSubflowId,
  collapseNode,
  groupedSubflows,
  mainChartBox,
  nodeTypes: userNodeTypes,
  edgeTypes: userEdgeTypes,
  coActiveStageIds,
  sliceCone,
  theme: themeMode,
  children,
  className,
  style
}) {
  const layout = layoutProp ?? dagreTraceLayout;
  useEffect13(() => {
    if (layoutProp === dagreTraceLayout) {
      devWarn(
        () => "[footprint-explainable-ui] <TracedFlow layout={dagreTraceLayout}> bypasses the built-in measure-then-layout pipeline (content-exact sizing, fork/merge centering, straight spines). OMIT the `layout` prop to use it \u2014 passing the raw dagreTraceLayout silently forfeits every layout improvement eui ships."
      );
    }
  }, [layoutProp]);
  const colors = useMemo15(
    () => ({ ...DEFAULT_COLORS, ...colorOverrides ?? {} }),
    [colorOverrides]
  );
  const mergedNodeTypes = useMemo15(
    () => userNodeTypes ? { ...DEFAULT_NODE_TYPES, ...userNodeTypes } : DEFAULT_NODE_TYPES,
    [userNodeTypes]
  );
  const mergedEdgeTypes = useMemo15(
    () => userEdgeTypes ? { ...DEFAULT_EDGE_TYPES, ...userEdgeTypes } : DEFAULT_EDGE_TYPES,
    [userEdgeTypes]
  );
  const effectiveGraph = useMemo15(
    () => collapseNode ? collapseTraceGraph(graph, collapseNode).graph : graph,
    [graph, collapseNode]
  );
  const drill = useSubflowDrill(effectiveGraph, onSubflowChange, controlledSubflowId);
  const groupedSet = useMemo15(() => new Set(groupedSubflows ?? []), [groupedSubflows]);
  const filteredGraph = useMemo15(() => {
    const base = filterGraphForDrill(effectiveGraph, drill.currentSubflowId);
    if (groupedSet.size === 0) return base;
    const baseIds = new Set(base.nodes.map((n) => n.id));
    const extraNodes = effectiveGraph.nodes.filter(
      (n) => n.data?.subflowOf !== void 0 && groupedSet.has(n.data.subflowOf) && !baseIds.has(n.id)
    );
    if (extraNodes.length === 0) return base;
    const allIds = /* @__PURE__ */ new Set([...baseIds, ...extraNodes.map((n) => n.id)]);
    const baseEdgeIds = new Set(base.edges.map((e) => e.id));
    const extraEdges = effectiveGraph.edges.filter(
      (e) => !baseEdgeIds.has(e.id) && allIds.has(e.source) && allIds.has(e.target)
    );
    return { nodes: [...base.nodes, ...extraNodes], edges: [...base.edges, ...extraEdges] };
  }, [effectiveGraph, drill.currentSubflowId, groupedSet]);
  const breadcrumb = useMemo15(
    () => buildSubflowBreadcrumb(effectiveGraph, drill.currentSubflowId),
    [effectiveGraph, drill.currentSubflowId]
  );
  const [measuredSizes, setMeasuredSizes] = useState15(null);
  const positioned = useMemo15(() => {
    const nodeSize = measuredSizes ? (n) => measuredSizes.get(n.id) : void 0;
    const sizeOpts = nodeSize ? { nodeSize } : {};
    const dagreBase = withForkCentering(
      createSnappedDagreLayout(
        createDagreTraceLayout({ ...sizeOpts, rankSep: 52, nodeSep: 36 }),
        sizeOpts
      ),
      { ...sizeOpts, nodeSep: 36 }
      // same nodeSep → clamp preserves dagre's reserved gap
    );
    const realBase = layout === "passthrough" ? (g) => g : layoutProp === void 0 ? dagreBase : layout;
    if (groupedSet.size > 0) {
      const grouped = applyGroupLayout(filteredGraph, {
        groupedSubflowIds: [...groupedSet],
        baseLayout: realBase
      });
      return mainChartBox ? wrapInMainChartBox(grouped, { baseLayout: (g) => g, ...mainChartBox }) : grouped;
    }
    if (mainChartBox) {
      return wrapInMainChartBox(filteredGraph, { baseLayout: realBase, ...mainChartBox });
    }
    return realBase(filteredGraph);
  }, [filteredGraph, layout, layoutProp, groupedSet, mainChartBox, measuredSizes]);
  const slice = useMemo15(() => {
    const empty = {
      doneStageIds: /* @__PURE__ */ new Set(),
      activeStageId: null,
      executedStageIds: /* @__PURE__ */ new Set(),
      executedOrderIds: [],
      errors: /* @__PURE__ */ new Map(),
      retryAttempts: /* @__PURE__ */ new Map()
    };
    if (!overlay) return empty;
    const idx = scrubIndex ?? Math.max(0, overlay.executionOrder.length - 1);
    return aggregateMountStatus(sliceOverlay(overlay, idx), effectiveGraph, drill.currentSubflowId);
  }, [overlay, scrubIndex, effectiveGraph, drill.currentSubflowId]);
  const reactFlowNodes = useMemo15(
    () => positioned.nodes.map(
      (n) => toStageNodeWithOverlay(
        n,
        slice.doneStageIds,
        slice.activeStageId,
        slice.errors.get(n.id),
        slice.executedOrderIds,
        coActiveStageIds ?? EMPTY_SET,
        slice.retryAttempts?.get(n.id)
      )
    ),
    [positioned.nodes, slice, coActiveStageIds]
  );
  const cursorStandIns = useMemo15(() => cursorStandInIds(slice.activeStageId), [slice.activeStageId]);
  const reactFlowEdges = useMemo15(
    () => positioned.edges.map(
      (e) => styleEdgeWithOverlay(e, slice.doneStageIds, slice.activeStageId, colors, cursorStandIns)
    ),
    [positioned.edges, slice, colors, cursorStandIns]
  );
  const [coneRevealed, setConeRevealed] = useState15(false);
  useEffect13(() => {
    if (!sliceCone) return;
    setConeRevealed(false);
    const raf = requestAnimationFrame(() => setConeRevealed(true));
    return () => cancelAnimationFrame(raf);
  }, [sliceCone]);
  const conedNodes = useMemo15(() => {
    if (!sliceCone || sliceCone.size === 0) return reactFlowNodes;
    return reactFlowNodes.map((n) => {
      const depth = sliceCone.get(n.id);
      if (depth === void 0) {
        return { ...n, style: { ...n.style, opacity: 0.22, transition: "opacity 260ms ease" } };
      }
      return {
        ...n,
        style: {
          ...n.style,
          opacity: coneRevealed ? 1 : 0.22,
          transition: "opacity 320ms ease",
          transitionDelay: `${depth * 90}ms`
        }
      };
    });
  }, [reactFlowNodes, sliceCone, coneRevealed]);
  const conedEdges = useMemo15(() => {
    if (!sliceCone || sliceCone.size === 0) return reactFlowEdges;
    return reactFlowEdges.map((e) => {
      const inCone = sliceCone.has(e.source) && sliceCone.has(e.target);
      return inCone ? e : { ...e, style: { ...e.style, opacity: 0.12, transition: "opacity 260ms ease" } };
    });
  }, [reactFlowEdges, sliceCone]);
  const handleNodeClick = useCallback8(
    (_, node) => {
      const data = node.data ?? {};
      const isGrouped = groupedSet.has(node.id) || !!data.subflowId && groupedSet.has(data.subflowId);
      if (data.isSubflow && !isGrouped) {
        drill.drillInto(node.id);
      }
      onNodeClick?.(node.id);
    },
    [drill, onNodeClick, groupedSet]
  );
  const wrapperRef = useRef10(null);
  const layoutKey = chartLayoutKey(positioned.nodes);
  const refitKey = JSON.stringify([
    chartLayoutKey(filteredGraph.nodes),
    chartTopologyKey(positioned.nodes),
    // A custom layout is an authored layout. Default measured-layout settling
    // must not take camera ownership back after a manual pan/zoom.
    layoutProp !== void 0 ? layoutKey : null
  ]);
  return /* @__PURE__ */ jsxs25(
    "div",
    {
      ref: wrapperRef,
      className,
      style: {
        // The one-word switch, applied to this chart's own root so a chart
        // mounted alone in a light app is light (see theme/mode.ts).
        ...themeModeVars(themeMode),
        width: "100%",
        height: "100%",
        minHeight: 300,
        display: "flex",
        flexDirection: "column",
        ...style
      },
      children: [
        breadcrumb.length > 1 && /* @__PURE__ */ jsx29(
          SubflowBreadcrumbBar,
          {
            entries: breadcrumb,
            onNavigate: drill.setCurrentSubflowId
          }
        ),
        /* @__PURE__ */ jsx29("div", { style: { flex: 1, minHeight: 0 }, children: /* @__PURE__ */ jsxs25(
          ReactFlow2,
          {
            nodes: conedNodes,
            edges: conedEdges,
            nodeTypes: mergedNodeTypes,
            edgeTypes: mergedEdgeTypes,
            onNodeClick: handleNodeClick,
            minZoom: 0.1,
            proOptions: { hideAttribution: true },
            children: [
              /* @__PURE__ */ jsx29(ChartAutoRefit, { wrapperRef, refitKey, layoutKey, padding: 0.18 }),
              /* @__PURE__ */ jsx29(MeasuredNodeSizes, { onSizes: setMeasuredSizes }),
              /* @__PURE__ */ jsx29(Background2, { variant: BackgroundVariant.Dots, gap: 20, size: 1 }),
              children
            ]
          }
        ) })
      ]
    }
  );
}

// src/components/InspectorPanel/InspectorPanel.tsx
import { memo as memo6, useState as useState16 } from "react";
import { jsx as jsx30, jsxs as jsxs26 } from "react/jsx-runtime";
var InspectorPanel = memo6(function InspectorPanel2({
  snapshots,
  selectedIndex,
  dataTraceFrames,
  dataTraceNote,
  selectedStageId,
  onNavigateToStage,
  onTabChange,
  tab: controlledTab,
  traceContent,
  size = "default",
  unstyled = false,
  className,
  style
}) {
  const [internalTab, setTabState] = useState16("state");
  const tab = controlledTab ?? internalTab;
  const setTab = (t) => {
    setTabState(t);
    onTabChange?.(t);
  };
  const currentSnapshot = snapshots[selectedIndex];
  const sx = (s) => unstyled ? void 0 : s;
  return /* @__PURE__ */ jsxs26(
    "div",
    {
      className,
      "data-fp": "inspector-panel",
      style: {
        ...sx({
          display: "flex",
          flexDirection: "column",
          height: "100%",
          overflow: "hidden"
        }),
        ...style
      },
      children: [
        /* @__PURE__ */ jsxs26(
          "div",
          {
            "data-fp": "inspector-tabs",
            style: sx({
              display: "flex",
              borderBottom: `1px solid ${theme.border}`,
              flexShrink: 0
            }),
            children: [
              /* @__PURE__ */ jsx30(
                TabButton,
                {
                  active: tab === "state",
                  onClick: () => setTab("state"),
                  label: "State",
                  size,
                  unstyled
                }
              ),
              /* @__PURE__ */ jsx30(
                TabButton,
                {
                  active: tab === "trace",
                  onClick: () => setTab("trace"),
                  label: "Data Trace",
                  badge: dataTraceFrames.length > 0 ? String(dataTraceFrames.length) : void 0,
                  size,
                  unstyled
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ jsxs26("div", { "data-fp": "inspector-body", style: sx({ flex: 1, overflow: "auto" }), children: [
          tab === "state" && /* @__PURE__ */ jsx30(
            MemoryPanel,
            {
              snapshots,
              selectedIndex,
              size,
              unstyled
            }
          ),
          tab === "trace" && (traceContent ?? /* @__PURE__ */ jsx30(
            DataTracePanel,
            {
              frames: dataTraceFrames,
              note: dataTraceNote,
              selectedStageId,
              onFrameClick: onNavigateToStage,
              fromStageName: currentSnapshot?.stageName,
              size,
              unstyled
            }
          ))
        ] })
      ]
    }
  );
});
function TabButton({
  active,
  onClick,
  label,
  badge,
  size = "default",
  unstyled = false
}) {
  const fs = fontSize[size];
  const sx = (s) => unstyled ? void 0 : s;
  return /* @__PURE__ */ jsxs26(
    "button",
    {
      onClick,
      "data-fp": "inspector-tab",
      "data-active": active || void 0,
      style: sx({
        padding: "8px 14px",
        border: "none",
        borderBottom: active ? "2px solid var(--fp-accent, #6366f1)" : "2px solid transparent",
        background: "transparent",
        color: active ? "var(--fp-accent, #6366f1)" : theme.textMuted,
        fontWeight: active ? 600 : 400,
        fontSize: fs.body,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 4
      }),
      children: [
        label,
        badge && /* @__PURE__ */ jsx30(
          "span",
          {
            style: sx({
              fontSize: fs.small,
              background: active ? "var(--fp-accent, #6366f1)" : theme.textMuted,
              color: "#fff",
              borderRadius: 8,
              padding: "1px 5px",
              fontWeight: 600
            }),
            children: badge
          }
        )
      ]
    }
  );
}

// src/components/InsightPanel/InsightPanel.tsx
import { memo as memo7, useState as useState17 } from "react";
import { jsx as jsx31, jsxs as jsxs27 } from "react/jsx-runtime";
var InsightPanel = memo7(function InsightPanel2({
  insights,
  expandedId,
  mode,
  size = "default",
  unstyled = false,
  className,
  style
}) {
  const chrome = { size, unstyled, className, style };
  if (insights.length === 0) {
    return /* @__PURE__ */ jsx31(NoInsights, { ...chrome });
  }
  if (mode === "grid") {
    return /* @__PURE__ */ jsx31(InsightGrid, { insights, ...chrome });
  }
  return /* @__PURE__ */ jsx31(InsightTabs, { insights, defaultId: expandedId, ...chrome });
});
var styler = (unstyled) => (s) => unstyled ? void 0 : s;
var INGREDIENTS = [
  { panel: "Story", call: "narrative()", from: "footprintjs/recorders" },
  { panel: "Performance", call: "metrics()", from: "footprintjs/recorders" },
  { panel: "Quality", call: "new QualityRecorder(scoreFn)", from: "footprintjs/trace" },
  { panel: "Cost", call: "costRecorder()", from: "agentfootprint/observe" }
];
var NoInsights = memo7(function NoInsights2({
  size,
  unstyled,
  className,
  style
}) {
  const fs = fontSize[size];
  const sx = styler(unstyled);
  return /* @__PURE__ */ jsxs27(
    "div",
    {
      className,
      "data-fp": "insights-empty",
      style: {
        ...sx({ padding: padding[size], color: theme.textMuted, fontSize: fs.body, lineHeight: 1.6 }),
        ...style
      },
      children: [
        /* @__PURE__ */ jsx31("div", { style: sx({ marginBottom: 8 }), children: "Nothing to show \u2014 this run was recorded without any of these. Each one lights one panel:" }),
        /* @__PURE__ */ jsx31("table", { style: sx({ borderCollapse: "collapse" }), children: /* @__PURE__ */ jsx31("tbody", { children: INGREDIENTS.map(({ panel, call, from }) => /* @__PURE__ */ jsxs27("tr", { "data-fp": "insights-empty-row", children: [
          /* @__PURE__ */ jsx31("td", { style: sx({ paddingRight: 10, color: theme.textSecondary, whiteSpace: "nowrap" }), children: panel }),
          /* @__PURE__ */ jsxs27("td", { style: sx({ fontFamily: theme.fontMono, fontSize: fs.label, whiteSpace: "nowrap" }), children: [
            call,
            /* @__PURE__ */ jsxs27("span", { style: sx({ opacity: 0.7 }), children: [
              " \u2014 from ",
              from
            ] })
          ] })
        ] }, panel)) }) }),
        /* @__PURE__ */ jsxs27("div", { style: sx({ marginTop: 8 }), children: [
          "Attach with ",
          /* @__PURE__ */ jsx31("code", { children: "executor.attachScopeRecorder(...)" }),
          " before the run, then pass the snapshot here \u2014 each recorder's data rides along inside it."
        ] })
      ]
    }
  );
});
var InsightTabs = memo7(function InsightTabs2({
  insights,
  defaultId,
  size,
  unstyled,
  className,
  style
}) {
  const [activeId, setActiveId] = useState17(defaultId ?? insights[0]?.id);
  const active = insights.find((i) => i.id === activeId) ?? insights[0];
  const fs = fontSize[size];
  const sx = styler(unstyled);
  return /* @__PURE__ */ jsxs27(
    "div",
    {
      className,
      "data-fp": "insight-panel",
      "data-mode": "tabs",
      style: {
        ...sx({
          display: "flex",
          flexDirection: "column",
          height: "100%",
          overflow: "hidden"
        }),
        ...style
      },
      children: [
        /* @__PURE__ */ jsx31(
          "div",
          {
            "data-fp": "insight-tabs",
            style: sx({
              display: "flex",
              borderBottom: `1px solid ${theme.border}`,
              flexShrink: 0,
              overflowX: "auto"
            }),
            children: insights.map((insight) => /* @__PURE__ */ jsx31(
              "button",
              {
                onClick: () => setActiveId(insight.id),
                "data-fp": "insight-tab",
                "data-active": activeId === insight.id || void 0,
                style: sx({
                  padding: "8px 12px",
                  border: "none",
                  borderBottom: activeId === insight.id ? "2px solid var(--fp-accent, #6366f1)" : "2px solid transparent",
                  background: "transparent",
                  color: activeId === insight.id ? "var(--fp-accent, #6366f1)" : theme.textMuted,
                  fontWeight: activeId === insight.id ? 600 : 400,
                  fontSize: fs.body,
                  cursor: "pointer",
                  whiteSpace: "nowrap"
                }),
                children: insight.name
              },
              insight.id
            ))
          }
        ),
        /* @__PURE__ */ jsx31("div", { "data-fp": "insight-body", style: sx({ flex: 1, overflow: "auto" }), children: active?.render() })
      ]
    }
  );
});
var InsightGrid = memo7(function InsightGrid2({
  insights,
  size,
  unstyled,
  className,
  style
}) {
  const cols = insights.length <= 2 ? 1 : 2;
  const fs = fontSize[size];
  const sx = styler(unstyled);
  return /* @__PURE__ */ jsx31(
    "div",
    {
      className,
      "data-fp": "insight-panel",
      "data-mode": "grid",
      style: {
        ...sx({
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          height: "100%",
          overflow: "auto",
          gap: 1,
          background: theme.border
        }),
        ...style
      },
      children: insights.map((insight) => /* @__PURE__ */ jsxs27(
        "div",
        {
          "data-fp": "insight-cell",
          style: sx({
            background: "var(--fp-bg, #1a1b26)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden"
          }),
          children: [
            /* @__PURE__ */ jsxs27(
              "div",
              {
                style: sx({
                  padding: "6px 10px",
                  fontSize: fs.label,
                  fontWeight: 600,
                  color: theme.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  borderBottom: `1px solid ${theme.border}`,
                  flexShrink: 0
                }),
                children: [
                  insight.name,
                  insight.summary && /* @__PURE__ */ jsx31(
                    "span",
                    {
                      style: sx({
                        marginLeft: 8,
                        fontWeight: 400,
                        fontSize: fs.small,
                        color: theme.textMuted
                      }),
                      children: insight.summary
                    }
                  )
                ]
              }
            ),
            /* @__PURE__ */ jsx31("div", { "data-fp": "insight-cell-body", style: sx({ flex: 1, overflow: "auto" }), children: insight.render() })
          ]
        },
        insight.id
      ))
    }
  );
});

// src/components/CompactTimeline/CompactTimeline.tsx
import { memo as memo8, useState as useState18 } from "react";
import { jsx as jsx32, jsxs as jsxs28 } from "react/jsx-runtime";
var tint = (color, percent) => `color-mix(in srgb, ${color} ${percent}%, transparent)`;
var CompactTimeline = memo8(function CompactTimeline2({
  snapshots,
  selectedIndex,
  defaultExpanded = false,
  label = "Timeline"
}) {
  const [expanded, setExpanded] = useState18(defaultExpanded);
  if (snapshots.length === 0) return null;
  return /* @__PURE__ */ jsxs28("div", { style: { borderTop: `1px solid ${theme.border}` }, children: [
    /* @__PURE__ */ jsxs28(
      "button",
      {
        onClick: () => setExpanded((e) => !e),
        style: {
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 12px",
          border: "none",
          background: "transparent",
          cursor: "pointer",
          fontSize: 11,
          color: theme.textMuted,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.5px"
        },
        children: [
          /* @__PURE__ */ jsx32("span", { style: { fontSize: 10 }, children: expanded ? "\u25BC" : "\u25B8" }),
          label,
          /* @__PURE__ */ jsxs28("span", { style: { fontWeight: 400, fontSize: 10 }, children: [
            snapshots.length,
            " stages"
          ] }),
          !expanded && /* @__PURE__ */ jsxs28(
            "div",
            {
              style: {
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: 2,
                marginLeft: 8
              },
              children: [
                snapshots.map((snap, i) => /* @__PURE__ */ jsx32(
                  "div",
                  {
                    style: {
                      width: i === selectedIndex ? 8 : 5,
                      height: i === selectedIndex ? 8 : 5,
                      borderRadius: "50%",
                      background: i < selectedIndex ? "var(--fp-success, #22c55e)" : i === selectedIndex ? "var(--fp-accent, #6366f1)" : tint(theme.textMuted, 25),
                      transition: "all 0.15s",
                      flexShrink: 0
                    },
                    title: snap.stageName
                  },
                  i
                )),
                /* @__PURE__ */ jsx32(
                  "div",
                  {
                    style: {
                      flex: 1,
                      height: 1,
                      background: tint(theme.textMuted, 20),
                      marginLeft: -2,
                      marginRight: 4
                    }
                  }
                )
              ]
            }
          )
        ]
      }
    ),
    expanded && /* @__PURE__ */ jsx32("div", { style: { padding: "0 12px 8px" }, children: /* @__PURE__ */ jsx32(
      GanttTimeline,
      {
        snapshots,
        selectedIndex
      }
    ) })
  ] });
});

// src/components/ExplainableShell/ExplainableShell.tsx
import { Fragment as Fragment11, jsx as jsx33, jsxs as jsxs29 } from "react/jsx-runtime";
var EXPLAINABLE_TAB_ID = "explainable";
function isExplainableTab(tabId) {
  return tabId === EXPLAINABLE_TAB_ID || tabId === "ai-compatible";
}
var HLinePill = memo9(function HLinePill2({
  label,
  detail,
  expanded,
  onClick
}) {
  return /* @__PURE__ */ jsxs29("div", { style: {
    display: "flex",
    alignItems: "center",
    gap: 0,
    padding: "0"
  }, children: [
    /* @__PURE__ */ jsx33("div", { style: { flex: 1, height: 1, background: theme.border } }),
    /* @__PURE__ */ jsxs29(
      "button",
      {
        onClick,
        style: {
          display: "flex",
          alignItems: "center",
          gap: 5,
          padding: "3px 12px",
          margin: "4px 0",
          fontSize: 10,
          fontWeight: 600,
          fontFamily: "inherit",
          color: theme.textMuted,
          background: theme.bgSecondary,
          border: `1px solid ${theme.border}`,
          borderRadius: 10,
          cursor: "pointer",
          whiteSpace: "nowrap",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          transition: "color 0.15s ease"
        },
        children: [
          /* @__PURE__ */ jsx33("span", { style: { fontSize: 7 }, children: expanded ? "\u25BC" : "\u25B6" }),
          label,
          detail && /* @__PURE__ */ jsx33("span", { style: { fontWeight: 400, opacity: 0.5, fontSize: 9 }, children: detail })
        ]
      }
    ),
    /* @__PURE__ */ jsx33("div", { style: { flex: 1, height: 1, background: theme.border } })
  ] });
});
var VLinePill = memo9(function VLinePill2({
  label,
  expanded,
  side = "right",
  onClick
}) {
  const arrow = side === "right" ? expanded ? "\u25B6" : "\u25C0" : expanded ? "\u25C0" : "\u25B6";
  return /* @__PURE__ */ jsxs29("div", { style: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 0,
    padding: "0"
  }, children: [
    /* @__PURE__ */ jsx33("div", { style: { flex: 1, width: 1, background: theme.border } }),
    /* @__PURE__ */ jsxs29(
      "button",
      {
        onClick,
        style: {
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "10px 4px",
          margin: "0 3px",
          fontSize: 10,
          fontWeight: 600,
          fontFamily: "inherit",
          color: theme.textMuted,
          background: theme.bgSecondary,
          border: `1px solid ${theme.border}`,
          borderRadius: 10,
          cursor: "pointer",
          whiteSpace: "nowrap",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          writingMode: "vertical-lr",
          transition: "color 0.15s ease"
        },
        children: [
          /* @__PURE__ */ jsx33("span", { style: { fontSize: 7, writingMode: "horizontal-tb" }, children: arrow }),
          label
        ]
      }
    ),
    /* @__PURE__ */ jsx33("div", { style: { flex: 1, width: 1, background: theme.border } })
  ] });
});
var MissingChartNote = memo9(function MissingChartNote2({ unstyled }) {
  const body = /* @__PURE__ */ jsxs29(Fragment11, { children: [
    /* @__PURE__ */ jsx33("strong", { children: "No chart \u2014 `traceGraph` was not provided." }),
    /* @__PURE__ */ jsx33("div", { children: "A snapshot holds the memory, the story and the timeline. Only the chart's own structure can draw the chart. Two ways to get one:" }),
    /* @__PURE__ */ jsx33("pre", { style: unstyled ? void 0 : { margin: 0, whiteSpace: "pre-wrap", fontFamily: theme.fontMono, fontSize: 11 }, children: `// live build
const trace = createTraceStructureRecorder();
flowChart(..., { structureRecorders: [trace.recorder] });
<ExplainableShell traceGraph={trace.getGraph()} />

// saved run \u2014 save chart.buildTimeStructure with your snapshot
<ExplainableShell traceGraph={graphFromStructure(saved.structure)} />` })
  ] });
  if (unstyled) return /* @__PURE__ */ jsx33("div", { "data-fp": "shell-missing-chart", children: body });
  return /* @__PURE__ */ jsx33(
    "div",
    {
      "data-fp": "shell-missing-chart",
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 8,
        justifyContent: "center",
        alignItems: "flex-start",
        height: "100%",
        padding: 20,
        color: theme.textMuted,
        fontSize: 12,
        lineHeight: 1.5,
        maxWidth: 520,
        margin: "0 auto"
      },
      children: body
    }
  );
});
var EmptyShell = memo9(function EmptyShell2({
  reason,
  detail,
  unstyled,
  className,
  style
}) {
  const body = /* @__PURE__ */ jsxs29(Fragment11, { children: [
    /* @__PURE__ */ jsx33("div", { style: unstyled ? void 0 : { fontWeight: 700, color: theme.textPrimary, fontSize: 13 }, children: reason }),
    /* @__PURE__ */ jsx33("div", { "data-fp": "shell-empty-detail", children: detail })
  ] });
  if (unstyled) {
    return /* @__PURE__ */ jsx33("div", { className, style, "data-fp": "shell-empty", children: body });
  }
  return /* @__PURE__ */ jsx33(
    "div",
    {
      className,
      "data-fp": "shell-empty",
      style: {
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        padding: 24,
        background: theme.bgPrimary,
        color: theme.textMuted,
        fontFamily: theme.fontSans,
        fontSize: 12,
        lineHeight: 1.6,
        ...style
      },
      children: body
    }
  );
});
function detectKeyedSteps(data) {
  if (!data || typeof data !== "object") return null;
  const obj = data;
  for (const val of Object.values(obj)) {
    if (val && typeof val === "object" && !Array.isArray(val)) {
      const entries = Object.entries(val);
      if (entries.length === 0) continue;
      const allObjectsWithNumbers = entries.every(([, v2]) => {
        if (!v2 || typeof v2 !== "object" || Array.isArray(v2)) return false;
        return Object.values(v2).some((f) => typeof f === "number");
      });
      if (allObjectsWithNumbers) {
        const keyType = entries.some(([k]) => k.includes("#")) ? "runtimeStageId" : "stageName";
        return { steps: val, keyType };
      }
    }
  }
  return null;
}
function extractRenderHints(data) {
  if (!data || typeof data !== "object") return null;
  const obj = data;
  if (typeof obj.numericField === "string" && typeof obj.grandTotal === "number") {
    return { numericField: obj.numericField, grandTotal: obj.grandTotal };
  }
  return null;
}
function KeyedRecorderView({
  data,
  description,
  preferredOperation = "accumulate",
  snapshots,
  selectedIndex
}) {
  const [showAggregate, setShowAggregate] = useState19(false);
  const detected = useMemo16(() => detectKeyedSteps(data), [data]);
  const visibleKeys = useMemo16(() => {
    const keys = /* @__PURE__ */ new Set();
    for (let i = 0; i <= selectedIndex && i < snapshots.length; i++) {
      const snap = snapshots[i];
      if (detected?.keyType === "runtimeStageId") {
        if (snap.runtimeStageId) keys.add(snap.runtimeStageId);
      } else {
        if (snap.stageName) keys.add(snap.stageName);
        if (snap.stageLabel) keys.add(snap.stageLabel);
      }
    }
    return keys;
  }, [snapshots, selectedIndex, detected?.keyType]);
  const isAtEnd = selectedIndex >= snapshots.length - 1;
  if (!detected) {
    return /* @__PURE__ */ jsx33("div", { style: { padding: 12, fontFamily: theme.fontMono, fontSize: 11, whiteSpace: "pre-wrap", overflow: "auto", height: "100%" }, children: typeof data === "string" ? data : JSON.stringify(data, null, 2) });
  }
  const steps = detected.steps;
  const hints = extractRenderHints(data);
  const numFieldKey = hints?.numericField ?? "";
  const allKeys = Object.keys(steps);
  const visibleEntries = allKeys.filter((k) => visibleKeys.has(k));
  let runningTotal = 0;
  if (numFieldKey) {
    for (const k of visibleEntries) {
      runningTotal += steps[k][numFieldKey] ?? 0;
    }
  }
  const grandTotal = hints?.grandTotal ?? 0;
  return /* @__PURE__ */ jsxs29("div", { style: { overflow: "auto", height: "100%", display: "flex", flexDirection: "column" }, children: [
    description && /* @__PURE__ */ jsx33("div", { style: { padding: "6px 12px", fontSize: 11, color: theme.textMuted, fontStyle: "italic", borderBottom: `1px solid ${theme.border}`, flexShrink: 0 }, children: description }),
    /* @__PURE__ */ jsxs29("div", { style: { padding: 12, flex: 1, overflow: "auto" }, children: [
      preferredOperation === "aggregate" ? (
        /* AGGREGATE: collect silently during scrub, button at end to reveal total */
        /* @__PURE__ */ jsxs29(Fragment11, { children: [
          isAtEnd ? /* @__PURE__ */ jsx33("div", { style: { marginBottom: 16 }, children: !showAggregate ? /* @__PURE__ */ jsx33(
            "button",
            {
              onClick: () => setShowAggregate(true),
              style: {
                background: theme.primary,
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "12px 20px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                width: "100%"
              },
              children: "Aggregate \u2014 Show Grand Total"
            }
          ) : /* @__PURE__ */ jsxs29("div", { style: { padding: "14px 16px", background: `color-mix(in srgb, ${theme.success} 12%, transparent)`, borderRadius: 8, border: `1px solid ${theme.success}44` }, children: [
            /* @__PURE__ */ jsx33("div", { style: { fontSize: 10, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, fontWeight: 600 }, children: "Aggregate \u2014 grand total" }),
            numFieldKey && /* @__PURE__ */ jsxs29("div", { style: { fontSize: 26, fontWeight: 700, color: theme.success }, children: [
              grandTotal < 1 ? grandTotal.toFixed(3) : grandTotal.toFixed(1),
              /* @__PURE__ */ jsxs29("span", { style: { fontSize: 11, color: theme.textMuted, fontWeight: 400, marginLeft: 8 }, children: [
                numFieldKey,
                " \xB7 ",
                allKeys.length,
                " steps"
              ] })
            ] })
          ] }) }) : /* @__PURE__ */ jsxs29("div", { style: { padding: "10px 14px", background: `color-mix(in srgb, ${theme.textMuted} 6%, transparent)`, borderRadius: 6, marginBottom: 16, border: `1px dashed ${theme.border}` }, children: [
            /* @__PURE__ */ jsx33("div", { style: { fontSize: 10, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }, children: "Collecting data..." }),
            /* @__PURE__ */ jsxs29("div", { style: { fontSize: 11, color: theme.textMuted, marginTop: 4 }, children: [
              visibleEntries.length,
              " of ",
              allKeys.length,
              " steps collected. Scrub to end to aggregate."
            ] })
          ] }),
          /* @__PURE__ */ jsx33("div", { style: { fontSize: 10, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, fontWeight: 600 }, children: "Per-step detail" })
        ] })
      ) : preferredOperation === "accumulate" ? (
        /* ACCUMULATE: running total grows with slider — IS the total at end, no button */
        /* @__PURE__ */ jsxs29(Fragment11, { children: [
          numFieldKey && visibleEntries.length > 0 && /* @__PURE__ */ jsxs29("div", { style: { padding: "10px 14px", background: `color-mix(in srgb, ${theme.primary} 8%, transparent)`, borderRadius: 6, marginBottom: 16 }, children: [
            /* @__PURE__ */ jsx33("div", { style: { fontSize: 10, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4, fontWeight: 600 }, children: "Accumulate \u2014 running total up to this step" }),
            /* @__PURE__ */ jsx33("span", { style: { fontWeight: 700, fontSize: 18, color: theme.primary }, children: runningTotal < 1 ? runningTotal.toFixed(3) : runningTotal.toFixed(1) }),
            /* @__PURE__ */ jsxs29("span", { style: { color: theme.textMuted, marginLeft: 8, fontSize: 10 }, children: [
              numFieldKey,
              " \xB7 ",
              visibleEntries.length,
              " of ",
              allKeys.length,
              " steps"
            ] })
          ] }),
          /* @__PURE__ */ jsx33("div", { style: { fontSize: 10, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, fontWeight: 600 }, children: "Per-step detail" })
        ] })
      ) : (
        /* TRANSLATE: per-step entries prominent, no totals */
        /* @__PURE__ */ jsx33("div", { style: { fontSize: 10, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, fontWeight: 600 }, children: "Translate \u2014 per-step detail" })
      ),
      visibleEntries.map((key) => {
        const entry = steps[key];
        const label = entry.stageName ?? key;
        const numVal = numFieldKey ? entry[numFieldKey] : void 0;
        return /* @__PURE__ */ jsxs29("div", { style: { display: "flex", alignItems: "center", padding: "4px 0", fontSize: 12, fontFamily: theme.fontMono, borderBottom: `1px solid ${theme.border}22` }, children: [
          /* @__PURE__ */ jsx33("span", { style: { color: theme.textMuted, width: 140, flexShrink: 0, fontSize: 10 }, children: key }),
          /* @__PURE__ */ jsx33("span", { style: { fontWeight: 600, flex: 1 }, children: label }),
          numVal !== void 0 && /* @__PURE__ */ jsx33("span", { style: { color: theme.primary, fontWeight: 700, marginLeft: 8 }, children: numVal < 1 ? numVal.toFixed(3) : numVal.toFixed(1) })
        ] }, key);
      }),
      visibleEntries.length === 0 && /* @__PURE__ */ jsx33("div", { style: { color: theme.textMuted, fontSize: 11, fontStyle: "italic", padding: "8px 0" }, children: "Scrub the slider to reveal entries..." })
    ] })
  ] });
}
var DetailsContent = memo9(function DetailsContent2({
  snapshots,
  selectedIndex,
  narrativeEntries,
  size,
  fillHeight,
  extraViews
}) {
  const builtInViews = [
    {
      id: "memory",
      name: "Memory",
      render: ({ snapshots: snaps, selectedIndex: idx }) => /* @__PURE__ */ jsx33(MemoryPanel, { snapshots: snaps, selectedIndex: idx, size, style: fillHeight ? { height: "100%" } : void 0 })
    },
    {
      id: "narrative",
      name: "Narrative",
      render: ({ snapshots: snaps, selectedIndex: idx }) => /* @__PURE__ */ jsx33(NarrativePanel, { snapshots: snaps, selectedIndex: idx, narrativeEntries, size, style: fillHeight ? { height: "100%" } : void 0 })
    }
  ];
  const allViews = [...builtInViews, ...extraViews ?? []];
  const [activeViewId, setActiveViewId] = useState19(allViews[0]?.id ?? "memory");
  const viewIds = allViews.map((v2) => v2.id).join(",");
  useEffect14(() => {
    if (!allViews.find((v2) => v2.id === activeViewId)) {
      setActiveViewId(allViews[0]?.id ?? "memory");
    }
  }, [viewIds]);
  const activeView = allViews.find((v2) => v2.id === activeViewId) ?? allViews[0];
  return /* @__PURE__ */ jsxs29("div", { style: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }, children: [
    /* @__PURE__ */ jsx33("div", { style: { display: "flex", borderBottom: `1px solid ${theme.border}`, flexShrink: 0, overflowX: "auto" }, children: allViews.map((view) => {
      const active = view.id === activeViewId;
      return /* @__PURE__ */ jsx33(
        "button",
        {
          onClick: () => setActiveViewId(view.id),
          style: {
            flex: allViews.length <= 3 ? 1 : void 0,
            padding: "6px 8px",
            fontSize: 11,
            fontWeight: active ? 600 : 400,
            color: active ? theme.primary : theme.textMuted,
            background: active ? `color-mix(in srgb, ${theme.primary} 8%, transparent)` : "transparent",
            border: "none",
            borderBottom: active ? `2px solid ${theme.primary}` : "2px solid transparent",
            cursor: "pointer",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            fontFamily: "inherit",
            whiteSpace: "nowrap"
          },
          children: view.name
        },
        view.id
      );
    }) }),
    /* @__PURE__ */ jsx33("div", { style: { flex: 1, overflow: "auto" }, children: activeView?.render({ snapshots, selectedIndex }) })
  ] });
});
var RIGHT_PANEL_MODE_LABELS = {
  insights: "Insights",
  what: "Inspector",
  result: "Result"
};
var RightPanel = memo9(function RightPanel2({
  mode,
  onModeChange,
  snapshots,
  selectedIndex,
  activeTab,
  allTabs,
  renderTabBody,
  size,
  onNavigateToStage,
  dataTrace,
  onInspectorTabChange,
  inspectorTab,
  traceContent
}) {
  const modes = useMemo16(
    () => allTabs.some((t) => t.id === "result") ? ["insights", "what", "result"] : ["insights", "what"],
    [allTabs]
  );
  return /* @__PURE__ */ jsxs29(Fragment11, { children: [
    /* @__PURE__ */ jsx33("div", { style: {
      display: "flex",
      borderBottom: `1px solid ${theme.border}`,
      flexShrink: 0,
      background: theme.bgSecondary
    }, children: modes.map((m) => /* @__PURE__ */ jsx33(
      "button",
      {
        onClick: () => onModeChange(m),
        style: {
          flex: 1,
          padding: "7px 12px",
          fontSize: 11,
          fontWeight: mode === m ? 700 : 500,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: mode === m ? theme.primary : theme.textMuted,
          background: "transparent",
          border: "none",
          borderBottom: mode === m ? `2px solid ${theme.primary}` : "2px solid transparent",
          cursor: "pointer",
          fontFamily: "inherit"
        },
        children: RIGHT_PANEL_MODE_LABELS[m]
      },
      m
    )) }),
    /* @__PURE__ */ jsx33("div", { style: { flex: 1, overflow: "hidden" }, children: mode === "result" ? /* @__PURE__ */ jsx33("div", { style: { height: "100%", overflow: "auto" }, children: renderTabBody("result", false) }) : mode === "insights" ? /* @__PURE__ */ jsx33(
      InsightPanel,
      {
        mode: "tabs",
        expandedId: activeTab,
        insights: allTabs.filter((t) => t.id !== "result" && t.id !== "memory").map((tab) => ({
          id: tab.id,
          name: insightName(tab.name),
          render: () => renderTabBody(tab.id, false)
        }))
      }
    ) : /* @__PURE__ */ jsx33(
      InspectorPanel,
      {
        snapshots,
        selectedIndex,
        dataTraceFrames: dataTrace.frames,
        dataTraceNote: dataTrace.readsAvailable ? void 0 : "\u26A0 reads were not recorded (readTracking off) \u2014 dependencies are unknowable, not absent.",
        onTabChange: onInspectorTabChange,
        tab: inspectorTab,
        traceContent,
        selectedStageId: snapshots[selectedIndex]?.runtimeStageId,
        onNavigateToStage
      }
    ) })
  ] });
});
function insightName(name) {
  const map = {
    "Narrative": "Story",
    "Memory": "State",
    "Metrics": "Performance",
    "Quality": "Quality",
    "Cost": "Cost"
  };
  return map[name] ?? name;
}
function ExplainableShell({
  snapshots: snapshotsProp,
  runtimeSnapshot,
  title,
  resultData: resultDataProp,
  logs = [],
  narrativeEntries: narrativeEntriesProp,
  tabs: deprecatedTabs,
  defaultTab,
  hideConsole = false,
  hideTabs: hideTabsProp,
  panelLabels,
  defaultExpanded,
  recorderViews,
  renderFlowchart,
  showStageId = false,
  traceGraph,
  runtimeOverlay: runtimeOverlayProp,
  traceTheme,
  size = "default",
  unstyled = false,
  className,
  style
}) {
  const snapshotNarrative = useMemo16(
    () => narrativeRecorderFromSnapshot(runtimeSnapshot),
    [runtimeSnapshot]
  );
  const companions = useRunCompanions(runtimeSnapshot, {
    narrativeEntries: narrativeEntriesProp,
    snapshots: snapshotsProp,
    resultData: resultDataProp,
    runtimeOverlay: runtimeOverlayProp
  });
  const companionNarrativeMissing = companions.staleKeys.includes("narrativeEntries") && !snapshotNarrative;
  const narrativeEntries = companions.values.narrativeEntries ?? snapshotNarrative?.entries;
  const exactResults = useMemo16(
    () => exactSubflowResults(ownDataField(runtimeSnapshot, "subflowResults")),
    [runtimeSnapshot]
  );
  const derivedFromRuntime = useMemo16(() => {
    if (!runtimeSnapshot) return null;
    try {
      const sharedState = ownDataField(runtimeSnapshot, "sharedState");
      if (!isPlainRecord(sharedState)) throw new Error("sharedState is not a plain object");
      const input = {
        sharedState,
        executionTree: ownDataField(runtimeSnapshot, "executionTree"),
        commitLog: ownDataField(runtimeSnapshot, "commitLog"),
        subflowResults: exactResults,
        recorders: ownDataField(runtimeSnapshot, "recorders")
      };
      const snaps = toVisualizationSnapshots(input, narrativeEntries);
      return { snapshots: snaps, resultData: input.sharedState, error: null };
    } catch (err) {
      return {
        snapshots: [],
        resultData: null,
        error: err instanceof Error ? err.message : String(err)
      };
    }
  }, [runtimeSnapshot, narrativeEntries, exactResults]);
  const snapshots = companions.values.snapshots ?? derivedFromRuntime?.snapshots ?? [];
  const resultData = companions.values.resultData ?? derivedFromRuntime?.resultData ?? null;
  const runtimeOverlay = useMemo16(
    () => companions.values.runtimeOverlay ?? // Retries leave no mark on the commit log (a failed attempt discards its
    // writes): the snapshot's tree carries their counts (footprintjs >= 10.1),
    // and for an older recording the narrative's `retry` entries do.
    (runtimeSnapshot ? overlayFromSnapshot(runtimeSnapshot, { narrativeEntries }) : void 0),
    [companions.values.runtimeOverlay, runtimeSnapshot, narrativeEntries]
  );
  const missingChart = snapshots.length > 0 && !traceGraph?.nodes.length && !renderFlowchart;
  useEffect14(() => {
    if (!missingChart) return;
    devWarn(
      () => "[ExplainableShell] No chart: `traceGraph` is missing, so the flowchart region is not rendered. A snapshot cannot draw the chart \u2014 only the chart's own structure can. Two ways to get one:\n  live build \u2014 const trace = createTraceStructureRecorder();\n               flowChart(..., { structureRecorders: [trace.recorder] });\n               <ExplainableShell traceGraph={trace.getGraph()} />\n  saved run  \u2014 save `chart.buildTimeStructure` next to your snapshot, then\n               <ExplainableShell traceGraph={graphFromStructure(saved.structure)} />"
    );
  }, [missingChart]);
  const tracedFlowRenderer = useMemo16(() => {
    if (!traceGraph) return void 0;
    return ({ selectedIndex, snapshots: snapshots2, onNodeClick, sliceCone: sliceCone2, currentSubflowId, onSubflowChange }) => {
      const activeRsid = snapshots2[selectedIndex]?.runtimeStageId;
      let overlayIdx = selectedIndex;
      if (activeRsid && runtimeOverlay) {
        let i = runtimeOverlay.executionOrder.findIndex(
          (s) => s.runtimeStageId === activeRsid
        );
        if (i < 0) {
          i = runtimeOverlay.executionOrder.findIndex(
            (s) => s.runtimeStageId?.endsWith("/" + activeRsid)
          );
        }
        if (i >= 0) overlayIdx = i;
      }
      const traceColors = traceTheme && {
        ...traceTheme.visited !== void 0 && { done: traceTheme.visited },
        ...traceTheme.current !== void 0 && { active: traceTheme.current },
        ...traceTheme.mode !== void 0 && { default: traceTheme.mode === "dark" ? "#94a3b8" : "#64748b" }
      };
      return /* @__PURE__ */ jsx33(
        TracedFlow,
        {
          graph: traceGraph,
          overlay: runtimeOverlay ?? void 0,
          sliceCone: sliceCone2 ?? void 0,
          colors: traceColors || void 0,
          scrubIndex: overlayIdx,
          onNodeClick: (stageId) => onNodeClick?.(stageId),
          currentSubflowId: currentSubflowId ?? null,
          onSubflowChange: (mountId) => onSubflowChange?.(mountId)
        }
      );
    };
  }, [traceGraph, runtimeOverlay, traceTheme]);
  const effectiveRenderFlowchart = renderFlowchart ?? tracedFlowRenderer;
  const leftLabel = panelLabels?.topology ?? "Topology";
  const rightLabel = panelLabels?.details ?? "Details";
  const bottomLabel = panelLabels?.timeline ?? "Timeline";
  const shellRef = useRef11(null);
  const [isNarrow, setIsNarrow] = useState19(false);
  const [isMedium, setIsMedium] = useState19(false);
  useEffect14(() => {
    const el = shellRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      setIsNarrow(w < 640);
      setIsMedium(w >= 640 && w < 960);
      window.dispatchEvent(new Event("resize"));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const autoRecorderViews = useMemo16(() => {
    const recorders = runtimeSnapshot?.recorders;
    if (!recorders?.length) return [];
    const explicitIds = new Set((recorderViews ?? []).map((v2) => v2.id));
    if (snapshotNarrative?.id) explicitIds.add(snapshotNarrative.id);
    return recorders.filter((r) => !explicitIds.has(r.id)).map((r) => ({ id: r.id, name: r.name, description: r.description, preferredOperation: r.preferredOperation, data: r.data }));
  }, [runtimeSnapshot, recorderViews, snapshotNarrative]);
  const hasNarrative = !!narrativeEntries?.length || companionNarrativeMissing;
  const allTabs = useMemo16(() => {
    const tabs = [
      { id: "result", name: "Result", description: "Final output and console logs" },
      { id: "memory", name: "Memory", description: "Accumulator \u2014 progressive shared state at each stage" }
    ];
    if (hasNarrative) {
      tabs.push({ id: "narrative", name: "Narrative", description: "Translator (SequenceRecorder) \u2014 interleaved flow + data narrative per execution step" });
    }
    for (const v2 of recorderViews ?? []) {
      tabs.push({ id: v2.id, name: v2.name, description: v2.description });
    }
    for (const v2 of autoRecorderViews) {
      tabs.push({ id: v2.id, name: v2.name, description: v2.description });
    }
    const hideSet = new Set(hideTabsProp ?? []);
    return hideSet.size > 0 ? tabs.filter((t) => !hideSet.has(t.id)) : tabs;
  }, [hasNarrative, recorderViews, autoRecorderViews, hideTabsProp]);
  const unstyledTabs = useMemo16(
    () => [
      ...allTabs,
      {
        id: EXPLAINABLE_TAB_ID,
        name: "Explainable",
        description: "Chart, memory, narrative and timeline in one scroll"
      }
    ],
    [allTabs]
  );
  const validTabIds = new Set(allTabs.map((t) => t.id));
  const resolvedDefault = defaultTab && validTabIds.has(defaultTab) ? defaultTab : allTabs[0]?.id ?? "result";
  const [activeTab, setActiveTab] = useState19(resolvedDefault);
  const [snapshotIdx, setSnapshotIdxRaw] = useState19(0);
  const [rightExpanded, setRightExpanded] = useState19(defaultExpanded?.details ?? true);
  const [rightPanelMode, setRightPanelMode] = useState19("insights");
  const [inspectorTab, setInspectorTab] = useState19("state");
  const [tracing, setTracing] = useState19(null);
  const [forkChooserOpen, setForkChooserOpen] = useState19(false);
  const [traceSearch, setTraceSearch] = useState19("");
  useEffect14(() => {
    setForkChooserOpen(false);
  }, [snapshotIdx]);
  useEffect14(() => {
    if (deprecatedTabs === void 0) return;
    devWarn(
      () => "[ExplainableShell] the `tabs` prop is deprecated and has no effect. Use `hideTabs` to drop tabs by id, and `defaultTab` to choose which tab opens first."
    );
  }, [deprecatedTabs]);
  const [leftExpanded, setLeftExpanded] = useState19(defaultExpanded?.topology ?? false);
  const [timelineExpanded, setTimelineExpanded] = useState19(defaultExpanded?.timeline ?? false);
  useEffect14(() => {
    if (isNarrow) {
      setLeftExpanded(false);
      setRightExpanded(false);
      setTimelineExpanded(false);
    }
  }, [isNarrow]);
  const triggerReflow = useCallback9(() => {
    requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
    setTimeout(() => window.dispatchEvent(new Event("resize")), 320);
  }, []);
  const toggleLeft = useCallback9((v2) => {
    setLeftExpanded(v2);
    triggerReflow();
  }, [triggerReflow]);
  const toggleRight = useCallback9((v2) => {
    setRightExpanded(v2);
    triggerReflow();
  }, [triggerReflow]);
  const toggleTimeline = useCallback9(() => {
    setTimelineExpanded((p) => !p);
    triggerReflow();
  }, [triggerReflow]);
  const sourceRunId = sourceRunKey(runtimeSnapshot);
  const readsAvailable = useMemo16(
    () => runHasRecordedReads(
      runtimeSnapshot,
      snapshots.flatMap(
        (stage) => stage.subflowResult ? [stage.subflowResult] : []
      )
    ),
    [runtimeSnapshot, snapshots]
  );
  const onScopeReset = useCallback9(() => {
    setTracing(null);
    setForkChooserOpen(false);
    setTraceSearch("");
  }, []);
  const navigation = useSubflowNavigation({
    snapshots,
    sourceRunId,
    readsAvailable,
    exactResults,
    narrativeEntries,
    traceGraph,
    snapshotIdx,
    setSnapshotIdxRaw,
    activeTab: JSON.stringify([activeTab, rightPanelMode, inspectorTab]),
    onScopeReset
  });
  const {
    selectedStack,
    setSnapshotIdx,
    handleDrillDown,
    handleBreadcrumbNavigate,
    handleChartSubflowChange,
    handleNodeClick
  } = navigation;
  const isInSubflow = selectedStack.length > 0;
  const currentLevel = useMemo16(() => {
    const top = selectedStack.at(-1);
    return top ?? {
      spec: null,
      snapshots,
      narrative: void 0,
      subflowId: void 0,
      traceScope: void 0
    };
  }, [selectedStack, snapshots]);
  const activeTraceScope = useMemo16(() => {
    if (currentLevel.traceScope) return currentLevel.traceScope;
    const metadata = rootMountLabels(runtimeSnapshot?.executionTree, runtimeSnapshot?.commitLog);
    return {
      invocationPath: [],
      commitLog: metadata.availability.ok ? runtimeSnapshot?.commitLog ?? [] : [],
      executionTree: metadata.availability.ok ? runtimeSnapshot?.executionTree : void 0,
      availability: metadata.availability,
      readsAvailable: readsAvailable && metadata.hasTree,
      mountLabels: metadata.labels
    };
  }, [currentLevel.traceScope, runtimeSnapshot, readsAvailable]);
  const activeTraceKey = isInSubflow ? JSON.stringify(activeTraceScope.invocationPath) : null;
  const activeSnapshots = currentLevel.snapshots;
  const safeIdx = activeSnapshots.length > 0 ? Math.max(0, Math.min(snapshotIdx, activeSnapshots.length - 1)) : 0;
  const shellDataTrace = useMemo16(() => {
    const trace = activeTraceScope.availability.ok && (isInSubflow || runtimeSnapshot?.commitLog) ? buildDataTrace(activeTraceScope.commitLog, activeTraceScope.executionTree, activeSnapshots[safeIdx]?.runtimeStageId ?? "") : { frames: [], readsAvailable: false };
    return { ...trace, readsAvailable: activeTraceScope.readsAvailable };
  }, [activeTraceScope, isInSubflow, runtimeSnapshot, activeSnapshots, safeIdx]);
  const allTracedKeys = useMemo16(() => {
    const log = activeTraceScope.commitLog;
    if (!log?.length) return [];
    const seen = /* @__PURE__ */ new Set();
    const keys = [];
    for (const c of log) {
      for (const t of c.trace ?? []) {
        if (!seen.has(t.path)) {
          seen.add(t.path);
          keys.push(t.path);
        }
      }
    }
    return keys;
  }, [activeTraceScope]);
  const traceWalk = useMemo16(() => {
    if (navigation.sourceChanged || !tracing || tracing.scope !== activeTraceKey || !activeTraceScope.availability.ok) return null;
    const scope = tracing.via.length > 0 ? tracing.via[tracing.via.length - 1] : tracing;
    return buildTraceWalk(activeTraceScope.commitLog, activeTraceScope.executionTree, scope.key, {
      beforeCommitIdx: scope.beforeCommitIdx,
      scope: {
        invocationPath: activeTraceScope.invocationPath,
        mountLabels: Object.fromEntries(activeTraceScope.mountLabels),
        readsAvailable: activeTraceScope.readsAvailable,
        startKeys: activeTraceScope.startKeys
      }
    });
  }, [tracing, activeTraceScope, activeTraceKey, navigation.sourceChanged]);
  const traceStopIndices = useMemo16(() => {
    if (!traceWalk || traceWalk.missing) return [];
    const idxByRsid = new Map(activeSnapshots.map((sn, i) => [sn.runtimeStageId, i]));
    return traceWalk.stops.map((stop) => idxByRsid.get(stop.runtimeStageId)).filter((i) => i !== void 0).sort((a, b) => a - b);
  }, [traceWalk, activeSnapshots]);
  const sliceCone = useMemo16(() => {
    if (traceWalk && !traceWalk.missing && traceWalk.stops.length >= 2) {
      const cone2 = /* @__PURE__ */ new Map();
      for (const stop of traceWalk.stops) {
        const stagePart = stop.runtimeStageId.split("#")[0];
        const prev = cone2.get(stagePart);
        if (prev === void 0 || stop.depth < prev) cone2.set(stagePart, stop.depth);
      }
      return cone2;
    }
    if (rightPanelMode !== "what" || inspectorTab !== "trace") return void 0;
    if (shellDataTrace.frames.length < 2) return void 0;
    const cone = /* @__PURE__ */ new Map();
    for (const f of shellDataTrace.frames) {
      const stagePart = f.runtimeStageId.split("#")[0];
      const prev = cone.get(stagePart);
      if (prev === void 0 || f.depth < prev) cone.set(stagePart, f.depth);
    }
    return cone;
  }, [traceWalk, rightPanelMode, inspectorTab, shellDataTrace]);
  const activeNarrativeEntries = isInSubflow ? currentLevel.narrative : narrativeEntries;
  const narrativeScopeSubflowId = useMemo16(() => {
    if (!isInSubflow) return void 0;
    const key = currentLevel.subflowId;
    const entries = currentLevel.narrative ?? [];
    if (key !== void 0 && entries.some((e) => e.subflowId === key)) return key;
    let shallowest;
    for (const e of entries) {
      const id = e.subflowId;
      if (id === void 0) continue;
      if (shallowest === void 0 || id.length < shallowest.length) shallowest = id;
    }
    return shallowest ?? key;
  }, [isInSubflow, currentLevel]);
  const breadcrumbs = useMemo16(() => {
    const root = { label: title || "Flowchart", spec: null, description: void 0 };
    return [root, ...selectedStack.map((e) => ({ label: e.label, spec: e.spec, description: void 0 }))];
  }, [title, selectedStack]);
  const showTreeSidebar = useMemo16(() => {
    if (traceGraph?.nodes?.length) {
      return traceGraph.nodes.some((n) => n.data?.isSubflow === true);
    }
    return false;
  }, [traceGraph]);
  const rootOverlay = useMemo16(() => {
    if (isInSubflow || !snapshots.length) return { activeStage: void 0, doneStages: void 0 };
    const doneStages = new Set(snapshots.slice(0, safeIdx).map((s) => s.stageLabel));
    const activeStage = snapshots[safeIdx]?.stageLabel ?? null;
    return { activeStage, doneStages };
  }, [isInSubflow, snapshots, safeIdx]);
  const handleTabChange = useCallback9((tab) => {
    setActiveTab(tab);
    navigation.resetRoot();
  }, [navigation.resetRoot]);
  const handleSnapshotChange = useCallback9((idx) => {
    if (typeof idx === "number") setSnapshotIdx(idx);
  }, [setSnapshotIdx]);
  const jumpToAnchor = useCallback9(
    (walk) => {
      const anchor = walk.stops[0];
      if (!anchor) return;
      const idx = activeSnapshots.findIndex((sn) => sn.runtimeStageId === anchor.runtimeStageId);
      if (idx >= 0) setSnapshotIdx(idx);
    },
    [activeSnapshots]
  );
  const handleStartTracing = useCallback9(
    (key) => {
      if (!activeTraceScope.availability.ok) return;
      const log = activeTraceScope.commitLog;
      const cursorRsid = activeSnapshots[safeIdx]?.runtimeStageId;
      const cursorCommitIdx = log.findIndex((c) => c.runtimeStageId === cursorRsid);
      const beforeCommitIdx = cursorCommitIdx >= 0 ? cursorCommitIdx + 1 : void 0;
      setTracing({ scope: activeTraceKey, key, beforeCommitIdx, via: [] });
      setForkChooserOpen(false);
      setTraceSearch("");
      setRightPanelMode("what");
      setInspectorTab("trace");
      jumpToAnchor(
        buildTraceWalk(activeTraceScope.commitLog, activeTraceScope.executionTree, key, { beforeCommitIdx })
      );
    },
    [activeTraceScope, activeTraceKey, activeSnapshots, safeIdx, jumpToAnchor]
  );
  const handleFollowIngredient = useCallback9(
    (ing) => {
      if (!tracing || !activeTraceScope.availability.ok || ing.writerCommitIdx === null) return;
      const scope = { key: ing.key, beforeCommitIdx: ing.writerCommitIdx + 1 };
      setTracing({ ...tracing, via: [...tracing.via, scope] });
      setForkChooserOpen(false);
      jumpToAnchor(
        buildTraceWalk(activeTraceScope.commitLog, activeTraceScope.executionTree, scope.key, {
          beforeCommitIdx: scope.beforeCommitIdx
        })
      );
    },
    [tracing, activeTraceScope, jumpToAnchor]
  );
  const handleShowAllIngredients = useCallback9(() => {
    if (!tracing || !activeTraceScope.availability.ok) return;
    setTracing({ ...tracing, via: [] });
    setForkChooserOpen(false);
    jumpToAnchor(
      buildTraceWalk(activeTraceScope.commitLog, activeTraceScope.executionTree, tracing.key, {
        beforeCommitIdx: tracing.beforeCommitIdx
      })
    );
  }, [tracing, activeTraceScope, jumpToAnchor]);
  const handleExitTracing = useCallback9(() => {
    setTracing(null);
    setForkChooserOpen(false);
  }, []);
  const handleForkPrompt = useCallback9(() => setForkChooserOpen(true), []);
  const handleContinueTimeOrder = useCallback9(() => {
    const earlier = traceStopIndices.filter((i) => i < safeIdx);
    if (earlier.length > 0) setSnapshotIdx(earlier[earlier.length - 1]);
    setForkChooserOpen(false);
  }, [traceStopIndices, safeIdx]);
  const chartDrillKey = selectedStack.at(-1)?.subflowId ?? null;
  const handleTreeNodeSelect = useCallback9(
    (name, isSubflow, nodeId) => {
      if (isSubflow) {
        handleDrillDown(nodeId ?? name);
      } else {
        navigation.resetRoot();
        const idx = snapshots.findIndex((s) => s.stageLabel === name);
        if (idx >= 0) setSnapshotIdx(idx);
      }
    },
    [snapshots, handleDrillDown, navigation.resetRoot, setSnapshotIdx]
  );
  const navigateToStage = useCallback9(
    (id) => {
      const idx = activeSnapshots.findIndex((sn) => sn.runtimeStageId === id);
      if (idx >= 0) setSnapshotIdx(idx);
    },
    [activeSnapshots]
  );
  const activeViaKey = tracing && tracing.via.length > 0 ? tracing.via[tracing.via.length - 1].key : null;
  const stepNumberOf = useCallback9(
    (rsid) => {
      const i = activeSnapshots.findIndex((sn) => sn.runtimeStageId === rsid);
      return i >= 0 ? i + 1 : null;
    },
    [activeSnapshots]
  );
  const tracingRail = useMemo16(() => {
    if (!tracing || !traceWalk || traceWalk.missing || traceStopIndices.length === 0) return null;
    const cursorRsid = activeSnapshots[safeIdx]?.runtimeStageId;
    const walkIdx = traceWalk.stops.findIndex((st) => st.runtimeStageId === cursorRsid);
    const currentStop = traceWalk.stops[walkIdx >= 0 ? walkIdx : 0];
    return {
      tracedKey: tracing.key,
      viaKey: activeViaKey,
      stopIndices: traceStopIndices,
      stopOrdinal: walkIdx >= 0 ? walkIdx + 1 : 1,
      totalStops: traceWalk.stops.length,
      onExit: handleExitTracing,
      onShowAll: activeViaKey ? handleShowAllIngredients : void 0,
      // Followable ingredients only — termini can't be chosen, so a stop of
      // run-inputs must not prompt (matches the card's chooser gate).
      forkCount: currentStop?.ingredients.filter((ing) => ing.writerRuntimeStageId !== null).length ?? 0,
      onForkPrompt: handleForkPrompt
    };
  }, [tracing, traceWalk, traceStopIndices, activeSnapshots, safeIdx, activeViaKey, handleExitTracing, handleShowAllIngredients, handleForkPrompt]);
  const traceTabContent = useMemo16(() => {
    if (!activeTraceScope.availability.ok) {
      return /* @__PURE__ */ jsx33(TraceUnavailableNote, { availability: activeTraceScope.availability, scopeLabel: isInSubflow ? "Child" : "Root" });
    }
    if (tracing && traceWalk) {
      return /* @__PURE__ */ jsx33(Fragment11, { children: /* @__PURE__ */ jsx33(
        TraceWalkCard,
        {
          walk: traceWalk,
          cursorRuntimeStageId: activeSnapshots[safeIdx]?.runtimeStageId ?? null,
          viaKey: activeViaKey,
          stepNumberOf,
          previewValueOf: (k) => activeSnapshots[safeIdx]?.memory?.[k],
          onFollowIngredient: handleFollowIngredient,
          onJumpToStop: navigateToStage,
          onShowAll: activeViaKey ? handleShowAllIngredients : void 0,
          onExit: handleExitTracing,
          forkChooserOpen,
          onContinueTimeOrder: handleContinueTimeOrder,
          canContinueTimeOrder: traceStopIndices.some((i) => i < safeIdx)
        }
      ) });
    }
    const chipStyle = {
      border: "1px solid var(--fp-accent, #6366f1)",
      background: "transparent",
      color: "var(--fp-accent, #6366f1)",
      borderRadius: 12,
      padding: "2px 10px",
      margin: "0 6px 6px 0",
      fontSize: 11,
      fontWeight: 600,
      fontFamily: "monospace",
      cursor: "pointer"
    };
    const query = traceSearch.trim().toLowerCase();
    const matchedKeys = query ? allTracedKeys.filter((k) => k.toLowerCase().includes(query)) : allTracedKeys;
    const shownKeys = matchedKeys.slice(0, 12);
    return /* @__PURE__ */ jsxs29(Fragment11, { children: [
      (shellDataTrace.frames[0]?.keysWritten?.length ?? 0) > 0 && /* @__PURE__ */ jsxs29("div", { "data-fp": "trace-entry", style: { padding: "10px 14px 0", fontSize: 12 }, children: [
        /* @__PURE__ */ jsx33("span", { style: { color: theme.textMuted, marginRight: 6 }, children: "This step wrote:" }),
        shellDataTrace.frames[0].keysWritten.map((k) => /* @__PURE__ */ jsx33(
          "button",
          {
            "data-fp": "trace-entry-chip",
            onClick: () => handleStartTracing(k),
            title: "Where did " + k + " come from? Walk its causes on the timeline.",
            style: chipStyle,
            children: k
          },
          k
        ))
      ] }),
      allTracedKeys.length > 0 && /* @__PURE__ */ jsxs29("div", { "data-fp": "trace-any", style: { padding: "6px 14px 0", fontSize: 12 }, children: [
        /* @__PURE__ */ jsx33("div", { style: { color: theme.textMuted, marginBottom: 4 }, children: "Trace any variable:" }),
        /* @__PURE__ */ jsx33(
          "input",
          {
            "data-fp": "trace-search",
            value: traceSearch,
            onChange: (e) => setTraceSearch(e.target.value),
            placeholder: "search any variable...",
            style: {
              display: "block",
              width: "100%",
              boxSizing: "border-box",
              background: theme.bgTertiary,
              border: `1px solid ${theme.border}`,
              borderRadius: 6,
              color: theme.textPrimary,
              fontSize: 11,
              fontFamily: "monospace",
              padding: "4px 8px",
              marginBottom: 6
            }
          }
        ),
        shownKeys.map((k) => /* @__PURE__ */ jsx33(
          "button",
          {
            "data-fp": "trace-any-chip",
            onClick: () => handleStartTracing(k),
            title: "Where did " + k + " come from? Walk its causes on the timeline.",
            style: chipStyle,
            children: k
          },
          k
        )),
        query === "" && matchedKeys.length > shownKeys.length && /* @__PURE__ */ jsxs29("span", { style: { color: theme.textMuted, fontSize: 11 }, children: [
          "+",
          matchedKeys.length - shownKeys.length,
          " more \u2014 type to search"
        ] })
      ] }),
      /* @__PURE__ */ jsx33(
        DataTracePanel,
        {
          frames: shellDataTrace.frames,
          note: shellDataTrace.readsAvailable ? void 0 : "\u26A0 reads were not recorded (readTracking off) \u2014 dependencies are unknowable, not absent.",
          selectedStageId: activeSnapshots[safeIdx]?.runtimeStageId,
          onFrameClick: navigateToStage,
          fromStageName: activeSnapshots[safeIdx]?.stageName
        }
      )
    ] });
  }, [tracing, traceWalk, activeSnapshots, safeIdx, activeViaKey, stepNumberOf, handleFollowIngredient, navigateToStage, handleShowAllIngredients, handleExitTracing, handleStartTracing, activeTraceScope, isInSubflow, shellDataTrace, forkChooserOpen, handleContinueTimeOrder, traceStopIndices, traceSearch, allTracedKeys]);
  const navigationStatus = /* @__PURE__ */ jsx33(
    SubflowNavigationStatus,
    {
      staleInputs: companions.staleKeys.length > 0,
      notice: navigation.navigationNotice,
      choice: navigation.visitChoice,
      onChoose: navigation.applyDrill,
      onDismiss: navigation.clearTransient
    }
  );
  const tabLabels = new Map(allTabs.map((t) => [t.id, t.name]));
  const renderTabBody = useCallback9(
    (tabId, plain2) => {
      if (tabId === "result") {
        return /* @__PURE__ */ jsx33(
          ResultPanel,
          {
            data: resultData ?? null,
            logs,
            hideConsole,
            size,
            unstyled: plain2
          }
        );
      }
      if (tabId === "memory") {
        return /* @__PURE__ */ jsx33(
          MemoryPanel,
          {
            snapshots: activeSnapshots,
            selectedIndex: safeIdx,
            size,
            unstyled: plain2,
            style: plain2 ? void 0 : { height: "100%" }
          }
        );
      }
      if (tabId === "narrative") {
        if (companionNarrativeMissing) return /* @__PURE__ */ jsx33(StoryUnavailableNote, {});
        return /* @__PURE__ */ jsx33(
          NarrativePanel,
          {
            snapshots: activeSnapshots,
            selectedIndex: safeIdx,
            narrativeEntries: activeNarrativeEntries,
            scopeSubflowId: narrativeScopeSubflowId,
            runtimeSnapshot,
            size,
            unstyled: plain2,
            style: plain2 ? void 0 : { height: "100%" }
          }
        );
      }
      const customView = recorderViews?.find((v2) => v2.id === tabId);
      if (customView?.render) {
        return customView.render({ snapshots: activeSnapshots, selectedIndex: safeIdx });
      }
      const autoView = autoRecorderViews.find((v2) => v2.id === tabId);
      if (autoView) {
        return /* @__PURE__ */ jsx33(
          KeyedRecorderView,
          {
            data: autoView.data,
            description: autoView.description,
            preferredOperation: autoView.preferredOperation,
            snapshots: activeSnapshots,
            selectedIndex: safeIdx
          }
        );
      }
      return null;
    },
    [
      resultData,
      logs,
      hideConsole,
      size,
      activeSnapshots,
      safeIdx,
      activeNarrativeEntries,
      companionNarrativeMissing,
      narrativeScopeSubflowId,
      runtimeSnapshot,
      recorderViews,
      autoRecorderViews
    ]
  );
  const shellThemeVars = useMemo16(() => {
    if (!traceTheme) return {};
    return {
      // ONE mapping from mode → palette, shared with the standalone
      // components' `theme="light"` prop (theme/mode.ts).
      ...themeModeVars(traceTheme.mode),
      ...traceTheme.visited !== void 0 && { ["--fp-node-visited"]: traceTheme.visited },
      ...traceTheme.current !== void 0 && { ["--fp-node-cursor"]: traceTheme.current }
    };
  }, [traceTheme]);
  const renderEmptyState = (themeVars) => {
    const shellStyle = { ...themeVars, ...style };
    if (derivedFromRuntime?.error) {
      return /* @__PURE__ */ jsx33(
        EmptyShell,
        {
          unstyled,
          className,
          style: shellStyle,
          reason: "That snapshot could not be read.",
          detail: /* @__PURE__ */ jsxs29(Fragment11, { children: [
            /* @__PURE__ */ jsxs29("div", { children: [
              "Expected a footprintjs ",
              /* @__PURE__ */ jsx33("code", { children: "executor.getSnapshot()" }),
              " \u2014",
              " ",
              /* @__PURE__ */ jsx33("code", { children: "{ sharedState, executionTree, commitLog }" }),
              "."
            ] }),
            /* @__PURE__ */ jsx33("div", { style: unstyled ? void 0 : { fontFamily: theme.fontMono, fontSize: 11, marginTop: 6 }, children: derivedFromRuntime.error })
          ] })
        }
      );
    }
    const gotRunData = !!runtimeSnapshot || !!snapshotsProp;
    return /* @__PURE__ */ jsx33(
      EmptyShell,
      {
        unstyled,
        className,
        style: shellStyle,
        reason: gotRunData ? "That run has no stages to show." : "No run to show yet.",
        detail: gotRunData ? /* @__PURE__ */ jsxs29("div", { children: [
          "The snapshot was read fine but its ",
          /* @__PURE__ */ jsx33("code", { children: "executionTree" }),
          " is empty \u2014 a run that was never executed, or a snapshot taken before ",
          /* @__PURE__ */ jsx33("code", { children: "run()" }),
          " finished."
        ] }) : /* @__PURE__ */ jsxs29(Fragment11, { children: [
          /* @__PURE__ */ jsxs29("div", { children: [
            "Pass a recorded run: ",
            /* @__PURE__ */ jsxs29("code", { children: [
              "runtimeSnapshot=",
              "{executor.getSnapshot()}"
            ] }),
            " (the shell converts it), or pre-converted",
            " ",
            /* @__PURE__ */ jsxs29("code", { children: [
              "snapshots=",
              "{toVisualizationSnapshots(...)}"
            ] }),
            "."
          ] }),
          /* @__PURE__ */ jsxs29("div", { children: [
            "Add ",
            /* @__PURE__ */ jsx33("code", { children: "traceGraph" }),
            " for the chart \u2014 it comes from the chart's structure, not the snapshot."
          ] })
        ] })
      }
    );
  };
  if (unstyled) {
    if (snapshots.length === 0) return renderEmptyState({});
    return /* @__PURE__ */ jsxs29("div", { className, style, "data-fp": "explainable-shell", children: [
      /* @__PURE__ */ jsx33("div", { "data-fp": "shell-tabs", children: unstyledTabs.map((tab) => /* @__PURE__ */ jsx33("button", { "data-fp": "shell-tab", "data-active": tab.id === activeTab, onClick: () => handleTabChange(tab.id), children: tab.name }, tab.id)) }),
      /* @__PURE__ */ jsx33("div", { "data-fp": "shell-content", "data-tab": activeTab, children: isExplainableTab(activeTab) ? /* @__PURE__ */ jsxs29(Fragment11, { children: [
        /* @__PURE__ */ jsx33(TimeTravelControls, { snapshots: activeSnapshots, selectedIndex: safeIdx, onIndexChange: handleSnapshotChange, unstyled: true, tracing: tracingRail }),
        navigationStatus,
        isInSubflow && /* @__PURE__ */ jsx33(SubflowBreadcrumb, { breadcrumbs, onNavigate: handleBreadcrumbNavigate }),
        (traceGraph || renderFlowchart) && effectiveRenderFlowchart?.({ spec: null, snapshots: activeSnapshots, selectedIndex: safeIdx, onNodeClick: handleNodeClick, showStageId, currentSubflowId: chartDrillKey, onSubflowChange: handleChartSubflowChange, ...sliceCone && { sliceCone } }),
        missingChart && /* @__PURE__ */ jsx33(MissingChartNote, { unstyled: true }),
        /* @__PURE__ */ jsx33(MemoryPanel, { snapshots: activeSnapshots, selectedIndex: safeIdx, unstyled: true }),
        companionNarrativeMissing ? /* @__PURE__ */ jsx33(StoryUnavailableNote, {}) : /* @__PURE__ */ jsx33(NarrativePanel, { snapshots: activeSnapshots, selectedIndex: safeIdx, narrativeEntries: activeNarrativeEntries, scopeSubflowId: narrativeScopeSubflowId, unstyled: true }),
        /* @__PURE__ */ jsx33(GanttTimeline, { snapshots: activeSnapshots, selectedIndex: safeIdx, onSelect: handleSnapshotChange, unstyled: true })
      ] }) : renderTabBody(activeTab, true) })
    ] });
  }
  const showTopology = !!effectiveRenderFlowchart && (!!renderFlowchart || !!traceGraph);
  const detailsContent = renderTabBody(activeTab, false);
  const detailsPanel = /* @__PURE__ */ jsxs29("div", { style: { display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }, children: [
    /* @__PURE__ */ jsx33("div", { style: {
      display: "flex",
      borderBottom: `1px solid ${theme.border}`,
      background: theme.bgSecondary,
      flexShrink: 0,
      overflowX: "auto"
    }, children: allTabs.map((tab) => {
      const active = tab.id === activeTab;
      return /* @__PURE__ */ jsx33(
        "button",
        {
          onClick: () => handleTabChange(tab.id),
          title: tab.description,
          style: {
            padding: "6px 14px",
            fontSize: 11,
            fontWeight: active ? 700 : 500,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: active ? theme.primary : theme.textMuted,
            background: "transparent",
            border: "none",
            borderBottom: active ? `2px solid ${theme.primary}` : "2px solid transparent",
            cursor: "pointer",
            fontFamily: "inherit",
            whiteSpace: "nowrap"
          },
          children: tab.name
        },
        tab.id
      );
    }) }),
    /* @__PURE__ */ jsx33("div", { style: { flex: 1, overflow: "auto" }, children: detailsContent })
  ] });
  if (snapshots.length === 0) return renderEmptyState(shellThemeVars);
  return /* @__PURE__ */ jsxs29(
    "div",
    {
      ref: shellRef,
      className,
      style: {
        ...shellThemeVars,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: theme.bgPrimary,
        color: theme.textPrimary,
        fontFamily: theme.fontSans,
        fontSize: 12,
        ...style
      },
      "data-fp": "explainable-shell",
      children: [
        /* @__PURE__ */ jsx33(
          TimeTravelControls,
          {
            snapshots: activeSnapshots,
            selectedIndex: safeIdx,
            onIndexChange: handleSnapshotChange,
            size,
            tracing: tracingRail
          }
        ),
        navigationStatus,
        isInSubflow && /* @__PURE__ */ jsx33(SubflowBreadcrumb, { breadcrumbs, onNavigate: handleBreadcrumbNavigate }),
        /* @__PURE__ */ jsx33("div", { style: { flex: 1, overflow: isNarrow ? "auto" : "hidden", display: "flex", flexDirection: "column" }, children: isNarrow ? (
          /* ── Mobile: stacked vertical ── */
          /* @__PURE__ */ jsxs29(Fragment11, { children: [
            showTopology && /* @__PURE__ */ jsx33("div", { style: { height: 350, flexShrink: 0, overflow: "hidden" }, children: effectiveRenderFlowchart({
              spec: null,
              snapshots: activeSnapshots,
              selectedIndex: safeIdx,
              onNodeClick: handleNodeClick,
              showStageId,
              currentSubflowId: chartDrillKey,
              onSubflowChange: handleChartSubflowChange,
              ...sliceCone && { sliceCone }
            }) }),
            missingChart && /* @__PURE__ */ jsx33(MissingChartNote, {}),
            showTreeSidebar && /* @__PURE__ */ jsxs29(Fragment11, { children: [
              /* @__PURE__ */ jsx33(HLinePill, { label: leftLabel, expanded: leftExpanded, onClick: () => toggleLeft(!leftExpanded) }),
              leftExpanded && /* @__PURE__ */ jsx33("div", { style: { maxHeight: 180, overflow: "auto", flexShrink: 0 }, children: /* @__PURE__ */ jsx33(
                SubflowTree,
                {
                  graph: traceGraph ?? { nodes: [], edges: [] },
                  activeStage: rootOverlay.activeStage,
                  doneStages: rootOverlay.doneStages,
                  onNodeSelect: handleTreeNodeSelect
                }
              ) })
            ] }),
            /* @__PURE__ */ jsx33(HLinePill, { label: rightLabel, expanded: rightExpanded, onClick: () => toggleRight(!rightExpanded) }),
            rightExpanded && /* @__PURE__ */ jsx33("div", { style: { maxHeight: 350, flexShrink: 0, overflow: "hidden" }, children: detailsPanel }),
            /* @__PURE__ */ jsx33(HLinePill, { label: bottomLabel, detail: `${activeSnapshots.length} stages`, expanded: timelineExpanded, onClick: toggleTimeline }),
            timelineExpanded && /* @__PURE__ */ jsx33("div", { style: { flexShrink: 0, overflow: "hidden" }, children: /* @__PURE__ */ jsx33(GanttTimeline, { snapshots: activeSnapshots, selectedIndex: safeIdx, onSelect: handleSnapshotChange, size }) })
          ] })
        ) : (
          /* ── Desktop: two-column — Flowchart | Right Panel ── */
          /* @__PURE__ */ jsxs29(Fragment11, { children: [
            /* @__PURE__ */ jsxs29("div", { style: { flex: 1, display: "flex", overflow: "hidden" }, children: [
              showTreeSidebar && (leftExpanded ? /* @__PURE__ */ jsxs29("div", { style: { width: 180, flexShrink: 0, display: "flex", flexDirection: "row", overflow: "hidden" }, children: [
                /* @__PURE__ */ jsx33("div", { style: { flex: 1, overflow: "auto" }, children: /* @__PURE__ */ jsx33(
                  SubflowTree,
                  {
                    graph: traceGraph ?? { nodes: [], edges: [] },
                    activeStage: rootOverlay.activeStage,
                    doneStages: rootOverlay.doneStages,
                    onNodeSelect: handleTreeNodeSelect
                  }
                ) }),
                /* @__PURE__ */ jsx33(VLinePill, { label: leftLabel, expanded: true, side: "left", onClick: () => toggleLeft(false) })
              ] }) : /* @__PURE__ */ jsx33(VLinePill, { label: leftLabel, expanded: false, side: "left", onClick: () => toggleLeft(true) })),
              showTopology ? /* @__PURE__ */ jsx33("div", { style: { flex: 1, overflow: "hidden", minWidth: 0 }, children: effectiveRenderFlowchart({
                spec: null,
                snapshots: activeSnapshots,
                selectedIndex: safeIdx,
                onNodeClick: handleNodeClick,
                showStageId,
                currentSubflowId: chartDrillKey,
                onSubflowChange: handleChartSubflowChange,
                ...sliceCone && { sliceCone }
              }) }) : /* @__PURE__ */ jsx33("div", { style: { flex: 1, minWidth: 0, overflow: "auto" }, children: missingChart && /* @__PURE__ */ jsx33(MissingChartNote, {}) }),
              /* @__PURE__ */ jsx33(VLinePill, { label: rightLabel, expanded: rightExpanded, onClick: () => toggleRight(!rightExpanded) }),
              rightExpanded && /* @__PURE__ */ jsx33("div", { style: { width: "42%", minWidth: 320, maxWidth: 550, display: "flex", flexDirection: "column", overflow: "hidden" }, children: /* @__PURE__ */ jsx33(
                RightPanel,
                {
                  mode: rightPanelMode,
                  onModeChange: setRightPanelMode,
                  dataTrace: shellDataTrace,
                  onInspectorTabChange: setInspectorTab,
                  inspectorTab,
                  traceContent: traceTabContent,
                  snapshots: activeSnapshots,
                  selectedIndex: safeIdx,
                  activeTab,
                  allTabs,
                  renderTabBody,
                  size,
                  onNavigateToStage: navigateToStage
                }
              ) })
            ] }),
            /* @__PURE__ */ jsx33(
              CompactTimeline,
              {
                snapshots: activeSnapshots,
                selectedIndex: safeIdx,
                defaultExpanded: timelineExpanded,
                label: bottomLabel
              }
            )
          ] })
        ) })
      ]
    }
  );
}

// src/components/TraceViewer/TraceViewer.tsx
import * as React from "react";
import { useMemo as useMemo17 } from "react";

// src/components/FlowchartView/_internal/keys.ts
function asStageId(s) {
  return s;
}

// src/components/FlowchartView/_internal/walkSubflowSpecInto.ts
function walkSubflowSpecInto(spec, subflowPath, sink) {
  walkNode(spec, subflowPath, sink, /* @__PURE__ */ new Set());
}
function qid(subflowPath, localId) {
  return `${subflowPath}/${localId}`;
}
function walkNode(node, subflowPath, sink, visited) {
  const fullId = qid(subflowPath, node.id);
  if (visited.has(fullId)) return;
  visited.add(fullId);
  if (node.isLoopReference) return;
  if (node.isSubflowRoot && node.subflowId !== void 0 && node.subflowStructure) {
    const nestedPath = `${subflowPath}/${node.subflowId}`;
    walkNode(node.subflowStructure, nestedPath, sink, visited);
  }
  const type = node.type ?? "stage";
  const isDecider = type === "decider" || type === "selector" || node.hasDecider === true || node.hasSelector === true;
  const isFork = type === "fork";
  const isStreaming = type === "streaming";
  const isSubflow = !!node.isSubflowRoot;
  const data = {
    label: node.name,
    isDecider,
    isFork,
    isStreaming,
    isSubflow,
    subflowOf: subflowPath,
    prevIds: [],
    nextIds: []
  };
  if (node.description !== void 0) data.description = node.description;
  if (node.icon !== void 0) data.icon = node.icon;
  if (node.subflowId !== void 0) data.subflowId = node.subflowId;
  if (node.isLazy === true) data.isLazy = true;
  if (node.isPausable === true) data.isPausable = true;
  sink.upsertNode({
    id: asStageId(fullId),
    type: "stage",
    position: { x: 0, y: 0 },
    data
  });
  if (node.children && node.children.length > 0) {
    const edgeKind = type === "fork" ? "fork-branch" : "decision-branch";
    for (const child of node.children) {
      const childFullId = qid(subflowPath, child.id);
      const edgeId = `${fullId}->${childFullId}:${edgeKind}${edgeKind === "decision-branch" ? `:${child.id}` : ""}`;
      const edgeData = { kind: edgeKind };
      if (edgeKind === "decision-branch") edgeData.label = child.id;
      const edge = {
        id: edgeId,
        source: fullId,
        target: childFullId,
        data: edgeData
      };
      if (edgeKind === "decision-branch") edge.label = child.id;
      sink.pushEdge(edge);
      walkNode(child, subflowPath, sink, visited);
    }
  }
  if (node.next) {
    if (node.next.isLoopReference && node.loopTarget) {
      const loopFullId = qid(subflowPath, node.loopTarget);
      sink.pushEdge({
        id: `${fullId}->${loopFullId}:loop`,
        source: fullId,
        target: loopFullId,
        data: { kind: "loop" }
      });
    } else {
      const nextFullId = qid(subflowPath, node.next.id);
      const edgeId = `${fullId}->${nextFullId}:next`;
      sink.pushEdge({
        id: edgeId,
        source: fullId,
        target: nextFullId,
        data: { kind: "next" }
      });
      walkNode(node.next, subflowPath, sink, visited);
    }
  }
}

// src/components/FlowchartView/traceStructureRecorder.ts
function createTraceStructureRecorder(options = {}) {
  const id = options.id ?? "trace-structure";
  const onChange = options.onChange;
  let nodes = [];
  let edges = [];
  const nodeIndex = /* @__PURE__ */ new Map();
  const seenEdgeIds = /* @__PURE__ */ new Set();
  const prevIdsOf = /* @__PURE__ */ new Map();
  const nextIdsOf = /* @__PURE__ */ new Map();
  const pendingMountPatches = /* @__PURE__ */ new Map();
  const notifier = createNotifier("traceStructureRecorder");
  function notifyChange() {
    if (onChange) {
      try {
        onChange({ nodes, edges });
      } catch (err) {
        devWarn(
          () => "[traceStructureRecorder] onChange callback threw \u2014 isolated.",
          err
        );
      }
    }
    notifier.notify();
  }
  function upsertNode(node) {
    const existing = nodeIndex.get(node.id);
    if (existing !== void 0) {
      nodes[existing] = {
        ...nodes[existing],
        ...node,
        data: { ...nodes[existing].data, ...node.data }
      };
    } else {
      nodeIndex.set(node.id, nodes.length);
      nodes.push(node);
    }
  }
  function pushEdge(edge) {
    if (seenEdgeIds.has(edge.id)) return;
    seenEdgeIds.add(edge.id);
    edges.push(edge);
    const kind = edge.data?.kind;
    if (kind === "loop") return;
    const source = asStageId(edge.source);
    const target = asStageId(edge.target);
    const nextArr = nextIdsOf.get(source) ?? [];
    nextArr.push(target);
    nextIdsOf.set(source, nextArr);
    const prevArr = prevIdsOf.get(target) ?? [];
    prevArr.push(source);
    prevIdsOf.set(target, prevArr);
    syncNeighborsOnto(source);
    syncNeighborsOnto(target);
  }
  function applyMountPatch(event) {
    const existing = nodeIndex.get(event.rootStageId);
    if (existing === void 0) return false;
    const node = nodes[existing];
    const data = {
      ...node.data,
      isSubflow: true,
      subflowId: event.subflowId
    };
    if (event.isLazy === true) data.isLazy = true;
    nodes[existing] = { ...node, data };
    return true;
  }
  function syncNeighborsOnto(stageId) {
    const idx = nodeIndex.get(stageId);
    if (idx === void 0) return;
    const node = nodes[idx];
    const prevs = prevIdsOf.get(stageId);
    const nexts = nextIdsOf.get(stageId);
    node.data.prevIds = prevs ? prevs.slice() : [];
    node.data.nextIds = nexts ? nexts.slice() : [];
  }
  const recorder = {
    id,
    onStageAdded(event) {
      const spec = event.spec;
      const type = event.type;
      const isDecider = type === "decider" || type === "selector" || spec.hasDecider === true || spec.hasSelector === true;
      const isFork = type === "fork";
      const isStreaming = type === "streaming";
      const isSubflow = !!spec.isSubflowRoot;
      const stageId = asStageId(event.stageId);
      const data = {
        label: event.name,
        isDecider,
        isFork,
        isStreaming,
        isSubflow,
        // L8.0 — seed prev/next from any edges that already fired
        // pointing AT this node. Convergence case: a fork-branch edge
        // from LoadOrder fires BEFORE the child's onStageAdded; this
        // line ensures the child's prevIds picks up the back-pointer.
        // Atomic copy (not shared ref) — see `syncNeighborsOnto` for
        // the panel-flagged consumer-safety rationale.
        prevIds: (prevIdsOf.get(stageId) ?? []).slice(),
        nextIds: (nextIdsOf.get(stageId) ?? []).slice()
      };
      if (spec.description !== void 0) data.description = spec.description;
      if (spec.icon !== void 0) data.icon = spec.icon;
      if (spec.subflowId !== void 0) data.subflowId = spec.subflowId;
      if (spec.isLazy === true) data.isLazy = true;
      if (event.isPausable === true) data.isPausable = true;
      upsertNode({
        id: event.stageId,
        type: "stage",
        // No layout here — downstream consumer applies positions.
        position: { x: 0, y: 0 },
        data
      });
      const pending = pendingMountPatches.get(event.stageId);
      if (pending) {
        pendingMountPatches.delete(event.stageId);
        for (const mount of pending) applyMountPatch(mount);
      }
      notifyChange();
    },
    onEdgeAdded(event) {
      const edgeId = `${event.from}->${event.to}:${event.kind}${event.label ? `:${event.label}` : ""}`;
      const data = { kind: event.kind };
      if (event.label !== void 0) data.label = event.label;
      const edge = {
        id: edgeId,
        source: event.from,
        target: event.to,
        data
      };
      if (event.label !== void 0) edge.label = event.label;
      pushEdge(edge);
      notifyChange();
    },
    onLoopEdgeAdded(event) {
      const edgeId = `${event.from}->${event.to}:loop`;
      pushEdge({
        id: edgeId,
        source: event.from,
        target: event.to,
        data: { kind: "loop" }
      });
      notifyChange();
    },
    onDeciderComplete(event) {
      const existing = nodeIndex.get(event.decider);
      if (existing === void 0) {
        devWarn(
          () => `[traceStructureRecorder] onDeciderComplete fired for unknown stageId "${event.decider}" \u2014 branch metadata dropped. Did the upstream fire onStageAdded for this id first?`
        );
        return;
      }
      const node = nodes[existing];
      const data = {
        ...node.data,
        branchIds: event.branchIds,
        // A sealed branch list IS decider-ness — engines that stamp neither
        // `type: 'decider'` nor `spec.hasDecider` still get a decision node.
        isDecider: true
      };
      if (event.defaultBranch !== void 0) data.defaultBranch = event.defaultBranch;
      nodes[existing] = { ...node, data };
      notifyChange();
    },
    onSubflowMounted(event) {
      if (!applyMountPatch(event)) {
        const queued = pendingMountPatches.get(event.rootStageId);
        if (queued) queued.push(event);
        else pendingMountPatches.set(event.rootStageId, [event]);
      }
      const subflowPath = event.subflowPath ?? event.subflowId;
      if (event.subflowSpec) {
        walkSubflowSpecInto(event.subflowSpec, subflowPath, {
          upsertNode,
          pushEdge
        });
      }
      notifyChange();
    }
  };
  return {
    recorder,
    getGraph() {
      return {
        nodes: nodes.map((n) => ({ ...n, data: { ...n.data } })),
        edges: edges.map((e) => ({ ...e, data: e.data ? { ...e.data } : void 0 }))
      };
    },
    getGraphRef() {
      return { nodes, edges };
    },
    subscribe: notifier.subscribe,
    version: notifier.version,
    reset() {
      nodes = [];
      edges = [];
      nodeIndex.clear();
      seenEdgeIds.clear();
      prevIdsOf.clear();
      nextIdsOf.clear();
      pendingMountPatches.clear();
    }
  };
}

// src/adapters/graphFromStructure.ts
function looksLikeStructure(value) {
  if (value === null || typeof value !== "object") return false;
  const n = value;
  return typeof n.id === "string" && typeof n.name === "string";
}
function convergenceEdges(node, targetId) {
  const children = node.children;
  const isBranching = (node.type === "fork" || node.type === "decider" || node.type === "selector") && Array.isArray(children) && children.length > 0;
  if (!isBranching) return [{ from: node.id, to: targetId }];
  const edges = [];
  for (const child of children) {
    if (child.isLoopReference) continue;
    if (child.next?.isLoopReference) continue;
    edges.push({ from: child.id, to: child.convergeAt ?? targetId });
  }
  return edges;
}
function graphFromStructure(structure) {
  const trace = createTraceStructureRecorder({ id: "graph-from-structure" });
  if (!looksLikeStructure(structure)) return trace.getGraph();
  const rec = trace.recorder;
  const announced2 = /* @__PURE__ */ new Set();
  const walked = /* @__PURE__ */ new Set();
  const announce = (node) => {
    if (announced2.has(node.id)) return;
    announced2.add(node.id);
    rec.onStageAdded?.({
      stageId: node.id,
      name: node.name,
      // The serialized spelling of a decision stage is `type: 'decider'`;
      // the live builder's is `type: 'stage'` + `spec.hasDecider`. The
      // recorder reads BOTH, so either front door yields the same node.
      type: node.type ?? "stage",
      ...node.isPausable === true ? { isPausable: true } : {},
      spec: node
    });
  };
  const mounted = /* @__PURE__ */ new Set();
  const mount = (node) => {
    if (!node.isSubflowRoot || node.subflowId === void 0 || mounted.has(node.id)) return;
    mounted.add(node.id);
    rec.onSubflowMounted?.({
      subflowId: node.subflowId,
      subflowName: node.subflowName ?? node.name,
      rootStageId: node.id,
      ...node.isLazy === true ? { isLazy: true } : {},
      ...node.subflowStructure ? { subflowSpec: node.subflowStructure } : {},
      subflowPath: node.subflowId
    });
  };
  const walk = (node) => {
    if (node.isLoopReference || walked.has(node.id)) return;
    walked.add(node.id);
    announce(node);
    mount(node);
    const children = node.children ?? [];
    if (children.length > 0) {
      const kind = node.type === "fork" ? "fork-branch" : "decision-branch";
      for (const child of children) {
        announce(child);
        rec.onEdgeAdded?.({
          from: node.id,
          to: child.id,
          kind,
          ...kind === "decision-branch" ? { label: child.id } : {}
        });
        mount(child);
      }
      const isDecision = node.type === "decider" || node.type === "selector" || node.hasDecider === true || node.hasSelector === true;
      if (isDecision) {
        rec.onDeciderComplete?.({
          decider: node.id,
          type: node.hasSelector === true || node.type === "selector" ? "selector" : "decider",
          branchIds: node.branchIds ?? children.map((c) => c.id)
          // `defaultBranch` is deliberately absent — see the module JSDoc.
        });
      }
      for (const child of children) walk(child);
    }
    const next = node.next;
    if (!next) return;
    if (next.isLoopReference) {
      rec.onLoopEdgeAdded?.({ from: node.id, to: node.loopTarget ?? next.id });
      return;
    }
    announce(next);
    for (const edge of convergenceEdges(node, next.id)) {
      rec.onEdgeAdded?.({ from: edge.from, to: edge.to, kind: "next" });
    }
    mount(next);
    walk(next);
  };
  walk(structure);
  return trace.getGraph();
}

// src/components/TraceViewer/TraceViewer.tsx
import { jsx as jsx34 } from "react/jsx-runtime";
function parseRecording(input) {
  if (input == null) {
    return { ok: false, error: { kind: "invalid-json", message: "No recording provided." } };
  }
  let candidate = input;
  if (typeof input === "string") {
    if (!input.trim()) {
      return { ok: false, error: { kind: "invalid-json", message: "Empty input." } };
    }
    try {
      candidate = JSON.parse(input);
    } catch (err) {
      return { ok: false, error: { kind: "invalid-json", message: err.message } };
    }
  }
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return {
      ok: false,
      error: { kind: "not-object", message: "A recording must be a JSON object." }
    };
  }
  const rec = candidate;
  if (rec.schemaVersion !== void 0 && rec.schemaVersion !== 1) {
    return {
      ok: false,
      error: {
        kind: "unsupported-version",
        message: `Unsupported schemaVersion ${String(rec.schemaVersion)}. This viewer reads version 1.`,
        version: Number(rec.schemaVersion)
      }
    };
  }
  if (!rec.snapshot || typeof rec.snapshot !== "object") {
    return {
      ok: false,
      error: {
        kind: "missing-snapshot",
        message: "This recording has no `snapshot`. A recording is { snapshot: executor.getSnapshot(), structure: chart.buildTimeStructure }."
      }
    };
  }
  return { ok: true, recording: rec };
}
function prepare(input) {
  const parsed = parseRecording(input);
  if (!parsed.ok) return parsed;
  try {
    const snapshots = toVisualizationSnapshots(
      parsed.recording.snapshot,
      parsed.recording.narrativeEntries ?? void 0
    );
    if (snapshots.length === 0) {
      return {
        ok: false,
        error: {
          kind: "no-stages",
          message: "This recording's snapshot has no executed stages \u2014 its `executionTree` is empty. Was the snapshot taken before run() finished?"
        }
      };
    }
    return { ok: true, recording: parsed.recording, snapshotCount: snapshots.length };
  } catch (err) {
    return {
      ok: false,
      error: {
        kind: "unreadable-snapshot",
        message: `Could not read this snapshot: ${err instanceof Error ? err.message : String(err)}`
      }
    };
  }
}
var DEFAULT_TABS = ["explainable"];
function TraceViewer({
  recording,
  trace,
  onError,
  fallback,
  tabs = DEFAULT_TABS,
  defaultTab = "narrative",
  hideTabs,
  size,
  panelLabels,
  recorderViews,
  renderFlowchart,
  traceTheme,
  theme: themeMode
}) {
  const input = recording ?? trace;
  const prepared = useMemo17(() => prepare(input), [input]);
  React.useEffect(() => {
    if (!prepared.ok && onError) onError(prepared.error);
  }, [prepared, onError]);
  const traceGraph = useMemo17(() => {
    if (!prepared.ok) return void 0;
    const structure = prepared.recording.structure ?? prepared.recording.blueprint;
    const graph = graphFromStructure(structure);
    return graph.nodes.length > 0 ? graph : void 0;
  }, [prepared]);
  const runtimeOverlay = useMemo17(
    () => prepared.ok ? overlayFromSnapshot(prepared.recording.snapshot, {
      // Retry attempts are never in the commit log (a discarded attempt
      // commits nothing): the snapshot's tree carries them on footprintjs
      // >= 10.1, the narrative's `retry` entries on an older recording.
      narrativeEntries: prepared.recording.narrativeEntries
    }) : void 0,
    [prepared]
  );
  if (!prepared.ok) {
    return fallback ?? null;
  }
  return /* @__PURE__ */ jsx34(
    ExplainableShell,
    {
      runtimeSnapshot: prepared.recording.snapshot,
      traceGraph,
      runtimeOverlay,
      narrativeEntries: prepared.recording.narrativeEntries,
      tabs,
      defaultTab,
      hideTabs,
      size,
      panelLabels,
      recorderViews,
      renderFlowchart,
      traceTheme: traceTheme ?? (themeMode ? { mode: themeMode } : void 0)
    }
  );
}

// src/components/ExplainableView/ExplainableContext.tsx
import { createContext as createContext3, useCallback as useCallback10, useContext as useContext4, useMemo as useMemo18, useState as useState20 } from "react";
import { jsx as jsx35 } from "react/jsx-runtime";
var ExplainableRunContext = createContext3(null);
function parseRecording2(input) {
  if (input == null || input === "") {
    return { recording: null, error: "No recording provided." };
  }
  let candidate = input;
  if (typeof input === "string") {
    try {
      candidate = JSON.parse(input);
    } catch (error) {
      return {
        recording: null,
        error: `Could not parse recording JSON: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return { recording: null, error: "A recording must be a JSON object." };
  }
  const recording = candidate;
  if (!recording.snapshot || typeof recording.snapshot !== "object") {
    return { recording: null, error: "The recording is missing its `snapshot`." };
  }
  if (recording.schemaVersion !== void 0 && recording.schemaVersion !== 1) {
    return {
      recording: null,
      error: `Unsupported recording schemaVersion ${String(recording.schemaVersion)}.`
    };
  }
  return { recording, error: null };
}
function ExplainableProvider({
  recording: input,
  selectedIndex: controlledIndex,
  defaultSelectedIndex = 0,
  onSelectedIndexChange,
  theme: theme2,
  children,
  className,
  style
}) {
  const parsed = useMemo18(() => parseRecording2(input), [input]);
  const prepared = useMemo18(() => {
    if (!parsed.recording) {
      return {
        snapshots: [],
        narrativeEntries: [],
        traceGraph: graphFromStructure(void 0),
        runtimeOverlay: overlayFromSnapshot(void 0),
        error: parsed.error
      };
    }
    const narrativeEntries = parsed.recording.narrativeEntries ?? narrativeFromSnapshot(parsed.recording.snapshot) ?? [];
    const runtimeSnapshot = parsed.recording.snapshot;
    try {
      return {
        snapshots: toVisualizationSnapshots(runtimeSnapshot, narrativeEntries),
        narrativeEntries,
        traceGraph: graphFromStructure(
          parsed.recording.structure ?? parsed.recording.blueprint
        ),
        runtimeOverlay: overlayFromSnapshot(parsed.recording.snapshot, { narrativeEntries }),
        error: null
      };
    } catch (error) {
      return {
        snapshots: [],
        narrativeEntries,
        traceGraph: graphFromStructure(
          parsed.recording.structure ?? parsed.recording.blueprint
        ),
        runtimeOverlay: overlayFromSnapshot(parsed.recording.snapshot, { narrativeEntries }),
        error: `Could not read recording snapshot: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }, [parsed]);
  const [uncontrolledIndex, setUncontrolledIndex] = useState20(defaultSelectedIndex);
  const requestedIndex = controlledIndex ?? uncontrolledIndex;
  const selectedIndex = Math.max(
    0,
    Math.min(requestedIndex, Math.max(0, prepared.snapshots.length - 1))
  );
  const selectIndex = useCallback10(
    (nextIndex) => {
      const clamped = Math.max(
        0,
        Math.min(nextIndex, Math.max(0, prepared.snapshots.length - 1))
      );
      if (controlledIndex === void 0) setUncontrolledIndex(clamped);
      onSelectedIndexChange?.(clamped);
    },
    [controlledIndex, onSelectedIndexChange, prepared.snapshots.length]
  );
  const value = useMemo18(
    () => ({
      recording: parsed.recording,
      snapshots: prepared.snapshots,
      selectedIndex,
      selectedSnapshot: prepared.snapshots[selectedIndex],
      selectIndex,
      traceGraph: prepared.traceGraph,
      runtimeOverlay: prepared.runtimeOverlay,
      narrativeEntries: prepared.narrativeEntries,
      resultData: parsed.recording?.resultData ?? parsed.recording?.snapshot.sharedState ?? null,
      logs: parsed.recording?.logs ? [...parsed.recording.logs] : [],
      flowchartColors: theme2?.flowchart,
      error: prepared.error
    }),
    [parsed.recording, prepared, selectedIndex, selectIndex, theme2?.flowchart]
  );
  return /* @__PURE__ */ jsx35(ExplainableRunContext.Provider, { value, children: /* @__PURE__ */ jsx35(
    "div",
    {
      className,
      "data-fp": "explainable-provider",
      style: { ...themeModeVars(theme2?.mode), display: "contents", ...style },
      children: /* @__PURE__ */ jsx35(FootprintTheme, { tokens: theme2?.tokens, children })
    }
  ) });
}
function useExplainableRun() {
  const value = useContext4(ExplainableRunContext);
  if (!value) {
    throw new Error("Explainable components must be rendered inside <ExplainableProvider>.");
  }
  return value;
}

// src/components/ExplainableView/TimelinePanel.tsx
import { useEffect as useEffect16, useRef as useRef12 } from "react";
import { jsx as jsx36, jsxs as jsxs30 } from "react/jsx-runtime";
function formatOffset(milliseconds) {
  return milliseconds < 1e3 ? `+${Math.round(milliseconds)}ms` : `+${(milliseconds / 1e3).toFixed(1)}s`;
}
function TimelinePanel({
  title = "Timeline",
  renderDetail,
  unstyled = false,
  className,
  style
}) {
  const { snapshots, selectedIndex, selectIndex, error } = useExplainableRun();
  const focusedRef = useRef12(null);
  useEffect16(() => {
    focusedRef.current?.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
  }, [selectedIndex]);
  if (unstyled) {
    return /* @__PURE__ */ jsx36("div", { className, style, "data-fp": "timeline-panel", children: snapshots.map((snapshot, index) => /* @__PURE__ */ jsx36("button", { onClick: () => selectIndex(index), children: snapshot.stageLabel }, `${snapshot.runtimeStageId ?? snapshot.stageName}-${index}`)) });
  }
  return /* @__PURE__ */ jsxs30(
    "section",
    {
      className,
      "data-fp": "timeline-panel",
      style: {
        display: "flex",
        height: "100%",
        minHeight: 0,
        flexDirection: "column",
        overflow: "hidden",
        background: theme.bgSecondary,
        color: theme.textPrimary,
        fontFamily: theme.fontSans,
        ...style
      },
      children: [
        /* @__PURE__ */ jsxs30("header", { style: { padding: "10px 12px", borderBottom: `1px solid ${theme.border}` }, children: [
          /* @__PURE__ */ jsx36("strong", { style: { fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }, children: title }),
          /* @__PURE__ */ jsx36("span", { style: { marginLeft: 8, color: theme.textMuted, fontSize: 10 }, children: snapshots.length ? `${selectedIndex + 1} / ${snapshots.length}` : "0 stages" })
        ] }),
        /* @__PURE__ */ jsx36("div", { role: "listbox", "aria-label": title, style: { flex: 1, minHeight: 0, overflowY: "auto", padding: "6px 0 12px" }, children: snapshots.length === 0 ? /* @__PURE__ */ jsx36("p", { style: { margin: 0, padding: 14, color: theme.textMuted, fontSize: 12 }, children: error ?? "This recording has no stages to walk." }) : snapshots.map((snapshot, index) => {
          const selected = index === selectedIndex;
          const visited = index < selectedIndex;
          return /* @__PURE__ */ jsxs30("div", { ref: selected ? focusedRef : void 0, children: [
            /* @__PURE__ */ jsxs30(
              "button",
              {
                type: "button",
                role: "option",
                "aria-selected": selected,
                "aria-label": `Go to stage ${index + 1}: ${snapshot.stageLabel}`,
                onClick: () => selectIndex(index),
                style: {
                  display: "grid",
                  gridTemplateColumns: "50px 18px 1fr",
                  gap: 9,
                  alignItems: "center",
                  width: "100%",
                  padding: "9px 12px",
                  border: 0,
                  borderLeft: selected ? `3px solid ${theme.warning}` : "3px solid transparent",
                  background: selected ? `color-mix(in srgb, ${theme.warning} 12%, transparent)` : "transparent",
                  color: selected ? theme.textPrimary : theme.textSecondary,
                  cursor: "pointer",
                  font: "inherit",
                  textAlign: "left"
                },
                children: [
                  /* @__PURE__ */ jsx36("span", { style: { color: theme.textMuted, fontFamily: theme.fontMono, fontSize: 10, textAlign: "right" }, children: formatOffset(snapshot.startMs) }),
                  /* @__PURE__ */ jsx36(
                    "span",
                    {
                      "aria-hidden": "true",
                      style: {
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        border: `2px solid ${selected ? theme.warning : visited ? theme.success : theme.border}`,
                        background: selected ? theme.warning : visited ? theme.success : theme.bgSecondary,
                        boxShadow: selected ? `0 0 0 4px color-mix(in srgb, ${theme.warning} 22%, transparent)` : void 0
                      }
                    }
                  ),
                  /* @__PURE__ */ jsxs30("span", { children: [
                    /* @__PURE__ */ jsx36("strong", { style: { display: "block", fontSize: 12 }, children: snapshot.stageLabel }),
                    /* @__PURE__ */ jsx36("small", { style: { color: theme.textMuted, fontFamily: theme.fontMono }, children: snapshot.runtimeStageId ?? snapshot.stageName })
                  ] })
                ]
              }
            ),
            selected && (snapshot.description || renderDetail) ? /* @__PURE__ */ jsxs30("div", { style: { margin: "0 12px 10px 80px", color: theme.textSecondary, fontSize: 12, lineHeight: 1.5 }, children: [
              snapshot.description ? /* @__PURE__ */ jsx36("p", { style: { margin: "0 0 8px" }, children: snapshot.description }) : null,
              renderDetail?.(snapshot, index)
            ] }) : null
          ] }, `${snapshot.runtimeStageId ?? snapshot.stageName}-${index}`);
        }) })
      ]
    }
  );
}

// src/components/ExplainableView/FlowchartPanel.tsx
import { useCallback as useCallback11, useMemo as useMemo19 } from "react";
import { jsx as jsx37, jsxs as jsxs31 } from "react/jsx-runtime";
function baseStageId(runtimeStageId) {
  const hashIndex = runtimeStageId.indexOf("#");
  return hashIndex >= 0 ? runtimeStageId.slice(0, hashIndex) : runtimeStageId;
}
function FlowchartPanel({
  title = "Flowchart",
  colors,
  unstyled = false,
  className,
  style
}) {
  const {
    traceGraph,
    runtimeOverlay,
    snapshots,
    selectedIndex,
    selectIndex,
    flowchartColors
  } = useExplainableRun();
  const scrubIndex = useMemo19(() => {
    const runtimeStageId = snapshots[selectedIndex]?.runtimeStageId;
    if (!runtimeStageId) return selectedIndex;
    const match = runtimeOverlay.executionOrder.findIndex(
      (step) => step.runtimeStageId === runtimeStageId
    );
    return match >= 0 ? match : selectedIndex;
  }, [runtimeOverlay.executionOrder, selectedIndex, snapshots]);
  const handleNodeClick = useCallback11(
    (stageId) => {
      const candidates = snapshots.map((snapshot, index) => ({
        index,
        stageId: baseStageId(snapshot.runtimeStageId ?? snapshot.stageName)
      })).filter((candidate) => candidate.stageId === stageId);
      const next = candidates.find((candidate) => candidate.index >= selectedIndex) ?? candidates[candidates.length - 1];
      if (next) selectIndex(next.index);
    },
    [selectedIndex, selectIndex, snapshots]
  );
  if (unstyled) {
    return /* @__PURE__ */ jsx37("div", { className, style, "data-fp": "flowchart-panel", children: traceGraph.nodes.map((node) => /* @__PURE__ */ jsx37("button", { onClick: () => handleNodeClick(node.id), children: String(node.data.label) }, node.id)) });
  }
  return /* @__PURE__ */ jsxs31(
    "section",
    {
      className,
      "data-fp": "flowchart-panel",
      style: {
        display: "flex",
        height: "100%",
        minHeight: 0,
        flexDirection: "column",
        overflow: "hidden",
        background: theme.bgPrimary,
        color: theme.textPrimary,
        fontFamily: theme.fontSans,
        ...style
      },
      children: [
        /* @__PURE__ */ jsxs31("header", { style: { padding: "10px 12px", borderBottom: `1px solid ${theme.border}` }, children: [
          /* @__PURE__ */ jsx37("strong", { style: { fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }, children: title }),
          /* @__PURE__ */ jsxs31("span", { style: { marginLeft: 8, color: theme.textMuted, fontSize: 10 }, children: [
            traceGraph.nodes.length,
            " nodes \xB7 click to move the cursor"
          ] })
        ] }),
        /* @__PURE__ */ jsx37("div", { style: { flex: 1, minHeight: 0, overflow: "hidden" }, children: traceGraph.nodes.length ? /* @__PURE__ */ jsx37(
          TracedFlow,
          {
            graph: traceGraph,
            overlay: runtimeOverlay,
            scrubIndex,
            colors: { ...flowchartColors, ...colors },
            onNodeClick: handleNodeClick
          }
        ) : /* @__PURE__ */ jsx37("p", { style: { padding: 18, color: theme.textMuted, fontSize: 12 }, children: "This recording carried no structure, so there is no chart to draw." }) })
      ]
    }
  );
}

// src/components/ExplainableView/ValueInspector.tsx
import { jsx as jsx38, jsxs as jsxs32 } from "react/jsx-runtime";
function ValueInspector({
  title = "Inspect values",
  size = "compact",
  unstyled = false,
  className,
  style
}) {
  const { snapshots, selectedIndex, selectedSnapshot, error } = useExplainableRun();
  if (unstyled) {
    return /* @__PURE__ */ jsxs32("div", { className, style, "data-fp": "value-inspector", children: [
      /* @__PURE__ */ jsx38("strong", { children: selectedSnapshot?.stageLabel ?? title }),
      /* @__PURE__ */ jsx38(MemoryPanel, { snapshots, selectedIndex, unstyled: true })
    ] });
  }
  return /* @__PURE__ */ jsxs32(
    "section",
    {
      className,
      "data-fp": "value-inspector",
      style: {
        display: "flex",
        height: "100%",
        minHeight: 0,
        flexDirection: "column",
        overflow: "hidden",
        background: theme.bgPrimary,
        color: theme.textPrimary,
        fontFamily: theme.fontSans,
        ...style
      },
      children: [
        /* @__PURE__ */ jsxs32("header", { style: { padding: "10px 12px", borderBottom: `1px solid ${theme.border}` }, children: [
          /* @__PURE__ */ jsx38("strong", { style: { display: "block", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }, children: title }),
          selectedSnapshot ? /* @__PURE__ */ jsxs32("span", { style: { display: "block", marginTop: 4, color: theme.textMuted, fontFamily: theme.fontMono, fontSize: 10 }, children: [
            selectedSnapshot.stageLabel,
            " \xB7 ",
            selectedSnapshot.runtimeStageId ?? selectedSnapshot.stageName
          ] }) : null
        ] }),
        /* @__PURE__ */ jsx38("div", { style: { flex: 1, minHeight: 0, overflow: "auto" }, children: snapshots.length ? /* @__PURE__ */ jsx38(MemoryPanel, { snapshots, selectedIndex, size, style: { height: "100%" } }) : /* @__PURE__ */ jsx38("p", { style: { padding: 14, color: theme.textMuted, fontSize: 12 }, children: error ?? "No values to inspect." }) })
      ]
    }
  );
}

// src/components/ExplainableView/CommentaryPanel.tsx
import { useMemo as useMemo20, useRef as useRef13, useEffect as useEffect17 } from "react";
import { Fragment as Fragment12, jsx as jsx39, jsxs as jsxs33 } from "react/jsx-runtime";
function CommentaryPanel({
  title = "Commentary",
  maxLines = 200,
  renderEntry,
  emptyMessage = "This recording carried no narrative commentary.",
  unstyled = false,
  className,
  style
}) {
  const { snapshots, selectedIndex, narrativeEntries } = useExplainableRun();
  const currentRef = useRef13(null);
  const rangeIndex = useMemo20(
    () => narrativeEntries.length ? buildEntryRangeIndex(narrativeEntries) : void 0,
    [narrativeEntries]
  );
  const revealedCount = useMemo20(
    () => narrativeEntries.length ? computeRevealedEntryCount(
      narrativeEntries,
      snapshots,
      selectedIndex,
      rangeIndex
    ) : 0,
    [narrativeEntries, snapshots, selectedIndex, rangeIndex]
  );
  const dedupedEntries = useMemo20(() => {
    const revealed = narrativeEntries.slice(0, revealedCount);
    return revealed.filter(
      (entry, index) => index === 0 || entry.text !== revealed[index - 1]?.text
    );
  }, [narrativeEntries, revealedCount]);
  const visibleEntries = dedupedEntries.slice(
    Math.max(0, dedupedEntries.length - maxLines)
  );
  const hiddenCount = Math.max(0, dedupedEntries.length - visibleEntries.length);
  useEffect17(() => {
    currentRef.current?.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
  }, [visibleEntries.length]);
  if (unstyled) {
    return /* @__PURE__ */ jsx39("div", { className, style, "data-fp": "commentary-panel", role: "log", children: visibleEntries.map((entry, index) => /* @__PURE__ */ jsx39("div", { children: renderEntry?.(entry, { index, current: index === visibleEntries.length - 1 }) ?? entry.text }, `${entry.runtimeStageId ?? entry.stageId ?? entry.type}-${index}`)) });
  }
  return /* @__PURE__ */ jsxs33(
    "section",
    {
      className,
      "data-fp": "commentary-panel",
      style: {
        display: "flex",
        height: "100%",
        minHeight: 0,
        flexDirection: "column",
        overflow: "hidden",
        background: theme.bgElevated,
        color: theme.textPrimary,
        fontFamily: theme.fontSans,
        ...style
      },
      children: [
        /* @__PURE__ */ jsxs33("header", { style: { padding: "10px 12px", borderBottom: `1px solid ${theme.border}` }, children: [
          /* @__PURE__ */ jsx39("strong", { style: { fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }, children: title }),
          /* @__PURE__ */ jsxs33("span", { style: { marginLeft: 8, color: theme.textMuted, fontSize: 10 }, children: [
            revealedCount,
            " of ",
            narrativeEntries.length,
            " lines"
          ] })
        ] }),
        /* @__PURE__ */ jsx39("div", { role: "log", "aria-live": "polite", style: { flex: 1, minHeight: 0, overflowY: "auto", padding: "6px 12px" }, children: visibleEntries.length === 0 ? /* @__PURE__ */ jsx39("p", { style: { color: theme.textMuted, fontSize: 12, fontStyle: "italic" }, children: emptyMessage }) : /* @__PURE__ */ jsxs33(Fragment12, { children: [
          hiddenCount > 0 ? /* @__PURE__ */ jsxs33("p", { style: { color: theme.textMuted, fontSize: 11, fontStyle: "italic" }, children: [
            "\u2026 ",
            hiddenCount,
            " earlier lines hidden; scrub backward to revisit them."
          ] }) : null,
          visibleEntries.map((entry, index) => {
            const current = index === visibleEntries.length - 1;
            return /* @__PURE__ */ jsxs33(
              "div",
              {
                ref: current ? currentRef : void 0,
                "data-current": current,
                style: {
                  display: "grid",
                  gridTemplateColumns: "82px 1fr",
                  gap: 10,
                  padding: "7px 8px",
                  borderBottom: `1px solid ${theme.border}`,
                  borderLeft: current ? `3px solid ${theme.warning}` : "3px solid transparent",
                  background: current ? `color-mix(in srgb, ${theme.warning} 14%, transparent)` : "transparent",
                  color: current ? theme.textPrimary : theme.textSecondary,
                  lineHeight: 1.55
                },
                children: [
                  /* @__PURE__ */ jsx39("span", { style: { color: current ? theme.warning : theme.textMuted, fontFamily: theme.fontMono, fontSize: 10 }, children: entry.type }),
                  /* @__PURE__ */ jsx39("div", { style: { fontSize: 12 }, children: renderEntry?.(entry, { index, current }) ?? entry.text })
                ]
              },
              `${entry.runtimeStageId ?? entry.stageId ?? entry.type}-${index}`
            );
          })
        ] }) })
      ]
    }
  );
}

// src/components/ExplainableView/TimeTravelBar.tsx
import { jsx as jsx40 } from "react/jsx-runtime";
function TimeTravelBar({
  autoPlayable = true,
  size,
  unstyled = false,
  className,
  style
}) {
  const { snapshots, selectedIndex, selectIndex } = useExplainableRun();
  return /* @__PURE__ */ jsx40(
    TimeTravelControls,
    {
      snapshots,
      selectedIndex,
      onIndexChange: selectIndex,
      autoPlayable,
      size,
      unstyled,
      className,
      style: {
        boxSizing: "border-box",
        width: "100%",
        minWidth: 0,
        overflow: "hidden",
        ...style
      }
    }
  );
}

// src/components/ExplainableView/CompactTimelinePanel.tsx
import { jsx as jsx41 } from "react/jsx-runtime";
function CompactTimelinePanel({
  defaultExpanded = false,
  unstyled = false,
  className,
  style
}) {
  const { snapshots, selectedIndex, selectIndex } = useExplainableRun();
  if (unstyled) {
    return /* @__PURE__ */ jsx41("div", { className, "data-fp": "compact-timeline-panel", style, children: snapshots.map((snapshot, index) => /* @__PURE__ */ jsx41(
      "button",
      {
        "aria-current": index === selectedIndex ? "step" : void 0,
        onClick: () => selectIndex(index),
        type: "button",
        children: snapshot.stageLabel
      },
      snapshot.runtimeStageId
    )) });
  }
  return /* @__PURE__ */ jsx41(
    "section",
    {
      className,
      "data-fp": "compact-timeline-panel",
      style: {
        width: "100%",
        minWidth: 0,
        overflow: "hidden",
        background: theme.bgPrimary,
        color: theme.textPrimary,
        ...style
      },
      children: /* @__PURE__ */ jsx41(
        CompactTimeline,
        {
          snapshots,
          selectedIndex,
          defaultExpanded
        }
      )
    }
  );
}

// src/components/ExplainableView/SurfaceCollapseHandle.tsx
import { jsx as jsx42, jsxs as jsxs34 } from "react/jsx-runtime";
function SurfaceCollapseHandle({
  label = "Details",
  expanded,
  orientation = "vertical",
  onToggle,
  className,
  style,
  unstyled = false
}) {
  const action2 = expanded ? "Collapse" : "Expand";
  if (unstyled) {
    return /* @__PURE__ */ jsxs34(
      "button",
      {
        "aria-expanded": expanded,
        "aria-label": `${action2} ${label.toLowerCase()}`,
        className,
        "data-fp": "surface-collapse-handle",
        onClick: onToggle,
        style,
        type: "button",
        children: [
          action2,
          " ",
          label
        ]
      }
    );
  }
  const vertical = orientation === "vertical";
  return /* @__PURE__ */ jsxs34(
    "div",
    {
      className,
      "data-fp": "surface-collapse-handle",
      "data-orientation": orientation,
      style: {
        display: "flex",
        minWidth: 0,
        minHeight: 0,
        flexDirection: vertical ? "column" : "row",
        alignItems: "center",
        ...style
      },
      children: [
        /* @__PURE__ */ jsx42(
          "div",
          {
            style: vertical ? { flex: 1, width: 1, background: theme.border } : { flex: 1, height: 1, background: theme.border }
          }
        ),
        /* @__PURE__ */ jsxs34(
          "button",
          {
            "aria-expanded": expanded,
            "aria-label": `${action2} ${label.toLowerCase()}`,
            onClick: onToggle,
            type: "button",
            style: {
              display: "flex",
              alignItems: "center",
              gap: 4,
              margin: vertical ? "0 3px" : "4px 0",
              padding: vertical ? "10px 4px" : "3px 12px",
              border: `1px solid ${theme.border}`,
              borderRadius: 10,
              background: theme.bgSecondary,
              color: theme.textMuted,
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              writingMode: vertical ? "vertical-lr" : "horizontal-tb"
            },
            children: [
              /* @__PURE__ */ jsx42("span", { style: { fontSize: 7, writingMode: "horizontal-tb" }, children: vertical ? expanded ? "\u25B6" : "\u25C0" : expanded ? "\u25BC" : "\u25B6" }),
              label
            ]
          }
        ),
        /* @__PURE__ */ jsx42(
          "div",
          {
            style: vertical ? { flex: 1, width: 1, background: theme.border } : { flex: 1, height: 1, background: theme.border }
          }
        )
      ]
    }
  );
}

// src/components/ExplainableView/ExplainableView.tsx
import * as React2 from "react";
import { jsx as jsx43, jsxs as jsxs35 } from "react/jsx-runtime";
var layoutPresets = {
  developer: {
    columns: "minmax(0, 1.7fr) minmax(300px, 0.8fr)",
    rows: "auto minmax(0, 1fr) auto",
    areas: [
      ["timeTravel", "timeTravel"],
      ["flowchart", "inspector"],
      ["timeline", "timeline"]
    ],
    minHeight: 720,
    gap: 1
  },
  product: {
    columns: "minmax(0, 1.7fr) minmax(300px, 0.8fr)",
    rows: "auto minmax(0, 1fr) minmax(0, 0.55fr)",
    areas: [
      ["timeTravel", "timeTravel"],
      ["flowchart", "inspector"],
      ["commentary", "commentary"]
    ],
    minHeight: 720,
    gap: 1
  },
  studio: {
    columns: "minmax(0, 1.7fr) minmax(300px, 0.8fr)",
    rows: "auto minmax(0, 1.35fr) minmax(0, 0.8fr) auto",
    areas: [
      ["timeTravel", "timeTravel"],
      ["flowchart", "stageRail"],
      ["inspector", "commentary"],
      ["timeline", "timeline"]
    ],
    minHeight: 720,
    gap: 1
  },
  linear: {
    columns: "minmax(0, 1fr)",
    rows: "auto minmax(320px, auto) repeat(3, minmax(320px, auto)) auto",
    areas: [
      ["timeTravel"],
      ["stageRail"],
      ["flowchart"],
      ["inspector"],
      ["commentary"],
      ["timeline"]
    ],
    minHeight: 720,
    gap: 1
  }
};
function resolveLayout(layout) {
  const definition = typeof layout === "string" ? layoutPresets[layout] : layout;
  const name = typeof layout === "string" ? layout : "custom";
  if (definition.areas.length === 0 || definition.areas[0]?.length === 0) {
    throw new Error("ExplainableView layout areas must contain at least one surface.");
  }
  const width = definition.areas[0]?.length ?? 0;
  if (definition.areas.some((row2) => row2.length !== width)) {
    throw new Error("ExplainableView layout area rows must have equal lengths.");
  }
  const surfaces = Array.from(
    new Set(
      definition.areas.flat().filter((surface) => surface !== ".")
    )
  );
  return {
    definition,
    name,
    surfaces
  };
}
function renderSlot(slot, fallback, context) {
  if (slot === void 0) return fallback;
  return typeof slot === "function" ? slot(context) : slot;
}
function ViewContents({
  layout,
  slots,
  minHeight,
  detailsExpanded: controlledDetailsExpanded,
  defaultDetailsExpanded = true,
  onDetailsExpandedChange,
  detailsLabel = "Details",
  unstyled,
  className,
  style
}) {
  const context = useExplainableRun();
  const resolved = resolveLayout(layout);
  const rootRef = React2.useRef(null);
  const [isNarrow, setIsNarrow] = React2.useState(false);
  const [uncontrolledDetailsExpanded, setUncontrolledDetailsExpanded] = React2.useState(defaultDetailsExpanded);
  const detailsExpanded = controlledDetailsExpanded ?? uncontrolledDetailsExpanded;
  const toggleDetails = () => {
    const nextExpanded = !detailsExpanded;
    if (controlledDetailsExpanded === void 0) {
      setUncontrolledDetailsExpanded(nextExpanded);
    }
    onDetailsExpandedChange?.(nextExpanded);
  };
  React2.useEffect(() => {
    const element = rootRef.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      setIsNarrow(entry.contentRect.width < 640);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const responsiveDefinition = resolved.definition;
  const responsiveTemplateAreas = responsiveDefinition.areas.map((row2) => `"${row2.join(" ")}"`).join(" ");
  const renderSurface = (surface) => {
    const fallback = {
      timeTravel: /* @__PURE__ */ jsx43(TimeTravelBar, { unstyled }),
      timeline: /* @__PURE__ */ jsx43(CompactTimelinePanel, { unstyled }),
      stageRail: /* @__PURE__ */ jsx43(TimelinePanel, { unstyled }),
      flowchart: /* @__PURE__ */ jsx43(FlowchartPanel, { unstyled }),
      inspector: /* @__PURE__ */ jsx43(ValueInspector, { unstyled }),
      commentary: /* @__PURE__ */ jsx43(CommentaryPanel, { unstyled })
    }[surface];
    return renderSlot(slots?.[surface], fallback, context);
  };
  if (unstyled) {
    return /* @__PURE__ */ jsx43("div", { className, style, "data-fp": "explainable-view", "data-layout": resolved.name, children: resolved.surfaces.map((surface) => /* @__PURE__ */ jsx43("div", { "data-fp-surface": surface, children: renderSurface(surface) }, surface)) });
  }
  if (resolved.name === "developer" || resolved.name === "product") {
    const product = resolved.name === "product";
    const surfaceStyle = {
      display: "flex",
      minWidth: 0,
      minHeight: 0,
      flexDirection: "column",
      overflow: "hidden"
    };
    return /* @__PURE__ */ jsxs35(
      "div",
      {
        ref: rootRef,
        className,
        "data-fp": "explainable-view",
        "data-layout": resolved.name,
        "data-narrow": isNarrow || void 0,
        style: {
          boxSizing: "border-box",
          display: "flex",
          height: "100%",
          maxHeight: "100%",
          minHeight: minHeight ?? resolved.definition.minHeight ?? 720,
          flexDirection: "column",
          overflow: "hidden",
          overscrollBehavior: "contain",
          border: `1px solid ${theme.border}`,
          borderRadius: "var(--fp-radius, 8px)",
          background: theme.border,
          ...style
        },
        children: [
          /* @__PURE__ */ jsx43("div", { "data-fp-surface": "timeTravel", style: { ...surfaceStyle, flex: "0 0 auto" }, children: renderSurface("timeTravel") }),
          /* @__PURE__ */ jsxs35(
            "div",
            {
              "data-fp": "workbench-main",
              style: {
                display: "flex",
                flex: 1,
                minWidth: 0,
                minHeight: 0,
                flexDirection: isNarrow ? "column" : "row",
                overflow: "hidden"
              },
              children: [
                /* @__PURE__ */ jsx43(
                  "div",
                  {
                    "data-fp-surface": "flowchart",
                    style: {
                      ...surfaceStyle,
                      flex: detailsExpanded && isNarrow ? "1 1 58%" : "1 1 auto"
                    },
                    children: renderSurface("flowchart")
                  }
                ),
                /* @__PURE__ */ jsx43(
                  SurfaceCollapseHandle,
                  {
                    expanded: detailsExpanded,
                    label: detailsLabel,
                    onToggle: toggleDetails,
                    orientation: isNarrow ? "horizontal" : "vertical"
                  }
                ),
                detailsExpanded ? /* @__PURE__ */ jsx43(
                  "div",
                  {
                    "data-fp-surface": "inspector",
                    style: {
                      ...surfaceStyle,
                      width: isNarrow ? "100%" : "42%",
                      minWidth: isNarrow ? 0 : 300,
                      maxWidth: isNarrow ? "none" : 550,
                      flex: isNarrow ? "0 1 42%" : "0 0 auto"
                    },
                    children: renderSurface("inspector")
                  }
                ) : null
              ]
            }
          ),
          product ? /* @__PURE__ */ jsx43(
            "div",
            {
              "data-fp-surface": "commentary",
              style: {
                ...surfaceStyle,
                width: "100%",
                flex: "0 0 34%",
                borderTop: `1px solid ${theme.border}`
              },
              children: renderSurface("commentary")
            }
          ) : /* @__PURE__ */ jsx43("div", { "data-fp-surface": "timeline", style: { ...surfaceStyle, flex: "0 0 auto" }, children: renderSurface("timeline") })
        ]
      }
    );
  }
  return /* @__PURE__ */ jsx43(
    "div",
    {
      ref: rootRef,
      className,
      "data-fp": "explainable-view",
      "data-layout": resolved.name,
      "data-narrow": isNarrow || void 0,
      style: {
        boxSizing: "border-box",
        display: "grid",
        height: resolved.name === "linear" ? void 0 : "100%",
        maxHeight: resolved.name === "linear" ? void 0 : "100%",
        gridTemplateColumns: responsiveDefinition.columns,
        gridTemplateRows: responsiveDefinition.rows,
        gridTemplateAreas: responsiveTemplateAreas,
        gap: responsiveDefinition.gap ?? 1,
        minHeight: minHeight ?? responsiveDefinition.minHeight ?? 720,
        overflow: resolved.name === "linear" ? "auto" : "hidden",
        overscrollBehavior: "contain",
        border: `1px solid ${theme.border}`,
        borderRadius: "var(--fp-radius, 8px)",
        background: theme.border,
        ...style
      },
      children: resolved.surfaces.map((surface) => /* @__PURE__ */ jsx43(
        "div",
        {
          "data-fp-surface": surface,
          style: {
            display: "flex",
            minWidth: 0,
            minHeight: 0,
            flexDirection: "column",
            gridArea: surface,
            overflow: "hidden"
          },
          children: renderSurface(surface)
        },
        surface
      ))
    }
  );
}
function ExplainableView({
  recording,
  selectedIndex,
  defaultSelectedIndex,
  onSelectedIndexChange,
  theme: viewTheme,
  layout = "developer",
  slots,
  minHeight,
  detailsExpanded,
  defaultDetailsExpanded,
  onDetailsExpandedChange,
  detailsLabel,
  unstyled = false,
  className,
  style
}) {
  return /* @__PURE__ */ jsx43(
    ExplainableProvider,
    {
      recording,
      selectedIndex,
      defaultSelectedIndex,
      onSelectedIndexChange,
      theme: viewTheme,
      children: /* @__PURE__ */ jsx43(
        ViewContents,
        {
          layout,
          slots,
          minHeight,
          detailsExpanded,
          defaultDetailsExpanded,
          onDetailsExpandedChange,
          detailsLabel,
          unstyled,
          className,
          style
        }
      )
    }
  );
}

// src/trace/projectTraceInvocation.ts
function projectTraceInvocation(snapshot, exactMountId, options) {
  const unavailable = (availability) => ({
    availability,
    commitLog: [],
    executionTree: void 0,
    scope: Object.freeze({
      invocationPath: Object.freeze([]),
      readsAvailable: false
    })
  });
  try {
    const targetId = readName(exactMountId);
    if (!targetId.includes("#"))
      return unavailable({ ok: false, reason: "invocation-not-recorded" });
    const budget = new WorkBudget();
    const pathValue = ownDataField(options, "invocationPath");
    const path = pathValue === void 0 ? [targetId] : readOwnArray(pathValue, budget).map(readName);
    if (path.length === 0 || path.length > 128 || path.join("").length > 8192 || path[path.length - 1] !== targetId)
      return unavailable({ ok: false, reason: "ancestor-not-recorded" });
    const results = ownDataField(snapshot, "subflowResults");
    if (!isPlainRecord(results))
      return unavailable({ ok: false, reason: "invocation-not-recorded" });
    const root = rootMountLabels(
      ownDataField(snapshot, "executionTree"),
      ownDataField(snapshot, "commitLog")
    );
    if (!root.availability.ok) return unavailable(root.availability);
    const readsAvailable = root.hasTree && runHasRecordedReads(snapshot);
    let parents = root.labels;
    for (let index = 0; index < path.length; index++) {
      if (path.length > 1 && !parents.has(path[index]))
        return unavailable({ ok: false, reason: "ancestor-not-recorded" });
      const result = ownDataField(results, path[index]);
      if (result === void 0)
        return unavailable({
          ok: false,
          reason: index === path.length - 1 ? "invocation-not-recorded" : "ancestor-not-recorded"
        });
      const selected = childTraceScope(
        result,
        path.slice(0, index + 1),
        readsAvailable
      );
      if (!selected.availability.ok) return unavailable(selected.availability);
      parents = selected.mountLabels;
      if (index === path.length - 1) {
        return {
          availability: selected.availability,
          commitLog: selected.commitLog,
          executionTree: selected.executionTree,
          scope: Object.freeze({
            invocationPath: Object.freeze([...path]),
            mountLabels: Object.freeze(
              Object.fromEntries(selected.mountLabels)
            ),
            readsAvailable: selected.readsAvailable,
            startKeys: selected.startKeys
          })
        };
      }
    }
    return unavailable({ ok: false, reason: "invocation-not-recorded" });
  } catch (error) {
    return unavailable({ ok: false, ...classifyAdmissionFailure(error) });
  }
}

// src/components/InvestigationPanel/InvestigationPanel.tsx
import { useMemo as useMemo21, useRef as useRef16, useState as useState23 } from "react";

// src/components/InvestigationPanel/admission.ts
var MAX_ITEMS = 256;
var MAX_TEXT = 65536;
var MAX_STRING = 2048;
var gapMessages = {
  "not-collected": "Some evidence was not collected.",
  "untracked-input": "An input's earlier origin is unknown.",
  redacted: "Some evidence is hidden.",
  conservative: "The recorded relationship is uncertain.",
  "scope-boundary": "Evidence stops at an execution boundary.",
  "invalid-data": "Some recorded evidence could not be read.",
  unavailable: "Some evidence is unavailable.",
  timeout: "The evidence search reached its time allowance.",
  cancelled: "The evidence search was cancelled.",
  cycle: "A repeated dependency could not be resolved.",
  "node-limit": "The evidence search reached its item allowance.",
  "depth-limit": "The evidence search reached its depth allowance.",
  "edge-limit": "The evidence search reached its relationship allowance.",
  "call-limit": "The evidence search reached its request allowance.",
  truncated: "The recorded evidence is incomplete.",
  "strategy-failed": "Candidate ordering is unavailable.",
  "not-checked": "Some evidence has not been checked.",
  "no-match": "No matching evidence was found.",
  ambiguous: "More than one explanation remains possible.",
  stale: "Some evidence belongs to an earlier recording.",
  incompatible: "Some evidence uses an unsupported format.",
  unsupported: "Some evidence is unsupported.",
  "not-permitted": "Some evidence is unavailable for this view."
};
var reasons = {
  ERROR_RECORDED: true,
  UNKNOWN_EFFECT_RECORDED: true,
  RETRY_STOP_RECORDED: true,
  TIMEOUT_RECORDED: true,
  RETRY_RECORDED: true,
  QUALITY_DROP_RECORDED: true,
  EVIDENCE_NOT_COLLECTED: true,
  OUTLIER_RECORDED: true,
  BUSINESS_RULE_MATCHED: true
};
var Refused = class extends Error {
};
function field3(value, key) {
  if (!value || typeof value !== "object") throw new Refused();
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  if (!descriptor) return void 0;
  if (!("value" in descriptor)) throw new Refused();
  return descriptor.value;
}
var Admission = class {
  constructor() {
    this.remaining = MAX_TEXT;
    this.evidence = (value) => this.list(value, 32, (entry) => this.text(entry));
    this.attention = (value) => {
      const reason = field3(value, "reason");
      if (typeof reason !== "string" || !Object.prototype.hasOwnProperty.call(reasons, reason))
        throw new Refused();
      return {
        kind: this.text(field3(value, "kind")),
        reason,
        evidence: this.evidence(field3(value, "evidence"))
      };
    };
    this.gaps = (value) => this.list(value, 128, (entry) => {
      const code = field3(entry, "code");
      if (typeof code !== "string" || !Object.prototype.hasOwnProperty.call(gapMessages, code))
        throw new Refused();
      const nodeId = field3(entry, "nodeId");
      return {
        code,
        ...nodeId !== void 0 && { nodeId: this.text(nodeId) },
        evidence: this.evidence(field3(entry, "evidence"))
      };
    });
  }
  text(value) {
    if (typeof value !== "string" || !value.length || value.length > MAX_STRING)
      throw new Refused();
    this.remaining -= value.length;
    if (this.remaining < 0) throw new Refused();
    return value;
  }
  list(value, max, parse) {
    if (!Array.isArray(value)) throw new Refused();
    const length = field3(value, "length");
    if (typeof length !== "number" || !Number.isSafeInteger(length) || length < 0 || length > max)
      throw new Refused();
    const copy = [];
    for (let index = 0; index < length; index++)
      copy.push(parse(field3(value, String(index))));
    return copy;
  }
  confidence(value) {
    if (value !== "complete" && value !== "incomplete") throw new Refused();
    return value;
  }
  edges(value, members) {
    return this.list(value, 512, (entry) => {
      const from = this.text(field3(entry, "from")), to = this.text(field3(entry, "to"));
      const kind = field3(entry, "kind"), attribution = field3(entry, "attribution");
      if (!members.has(from) || !members.has(to) || kind !== "data" && kind !== "control" || !["per-write", "stage", "recorded-control", "recorded-read"].includes(attribution)) throw new Refused();
      return { from, to, kind, attribution, evidence: this.evidence(field3(entry, "evidence")) };
    });
  }
  backward(value, selected, root, path, alternatives) {
    const nodes = this.list(field3(value, "nodes"), MAX_ITEMS, (entry) => this.text(entry));
    const members = new Set(nodes);
    if (members.size !== nodes.length || nodes.length > 0 && !members.has(selected)) throw new Refused();
    const confidence = this.confidence(field3(value, "confidence")), gaps = this.gaps(field3(value, "gaps"));
    if (root !== void 0 && (!members.has(root) || confidence !== "complete" || gaps.length)) throw new Refused();
    const edges = this.edges(field3(value, "edges"), members);
    if (path.some((id) => !members.has(id)) || alternatives.some((id) => !members.has(id)) || root !== void 0 && edges.some((edge) => edge.attribution === "stage")) throw new Refused();
    const links = /* @__PURE__ */ new Map();
    for (const edge of edges) {
      const targets = links.get(edge.from) ?? /* @__PURE__ */ new Set();
      targets.add(edge.to);
      links.set(edge.from, targets);
    }
    for (let index = 1; index < path.length; index++) if (!links.get(path[index - 1])?.has(path[index])) throw new Refused();
    return { nodes, edges, confidence, gaps };
  }
  impact(value, selected, visual) {
    const nodes = this.list(
      field3(value, "nodes"),
      MAX_ITEMS,
      (entry) => this.text(entry)
    );
    if (new Set(nodes).size !== nodes.length) throw new Refused();
    return {
      nodes,
      confidence: this.confidence(field3(value, "confidence")),
      gaps: this.gaps(field3(value, "gaps")),
      ...visual && field3(value, "edges") !== void 0 ? { edges: this.edges(field3(value, "edges"), /* @__PURE__ */ new Set([selected, ...nodes])) } : {}
    };
  }
};
function admitAttention(value) {
  try {
    const reader = new Admission();
    const nodes = reader.list(
      field3(value, "nodes"),
      MAX_ITEMS,
      (entry) => ({
        nodeId: reader.text(field3(entry, "nodeId")),
        attention: reader.list(field3(entry, "attention"), 16, reader.attention)
      })
    );
    if (new Set(nodes.map((node) => node.nodeId)).size !== nodes.length)
      return void 0;
    return {
      nodes,
      confidence: reader.confidence(field3(value, "confidence")),
      gaps: reader.gaps(field3(value, "gaps"))
    };
  } catch {
    return void 0;
  }
}
function readExplanation(value, requested, visual) {
  try {
    const reader = new Admission();
    const nodeId = reader.text(field3(value, "nodeId"));
    if (nodeId !== requested) return void 0;
    const path = reader.list(
      field3(value, "path"),
      MAX_ITEMS,
      (entry) => reader.text(entry)
    );
    const alternatives = reader.list(
      field3(value, "alternatives"),
      MAX_ITEMS,
      (entry) => reader.text(entry)
    );
    if (path.length && path[0] !== nodeId || new Set(path).size !== path.length || new Set(alternatives).size !== alternatives.length)
      return void 0;
    const confidence = reader.confidence(field3(value, "confidence"));
    const gaps = reader.gaps(field3(value, "gaps"));
    const root = field3(value, "rootCause");
    const rootCause = root === void 0 ? void 0 : reader.text(root);
    if (rootCause !== void 0 && (alternatives.length || path[path.length - 1] !== rootCause))
      return void 0;
    return {
      nodeId,
      attention: reader.list(field3(value, "attention"), 16, reader.attention),
      ...rootCause !== void 0 && { rootCause },
      path,
      alternatives,
      impact: reader.impact(field3(value, "impact"), nodeId, visual),
      ...visual && field3(value, "backward") !== void 0 ? { backward: reader.backward(field3(value, "backward"), nodeId, rootCause, path, alternatives) } : {},
      confidence,
      gaps
    };
  } catch {
    return void 0;
  }
}
function admitExplanation(value, requested) {
  return readExplanation(value, requested, false);
}
function admitVisualExplanation(value, requested) {
  return readExplanation(value, requested, true);
}
function displayLabel(labels, nodeId) {
  try {
    const label = field3(labels, nodeId);
    return typeof label === "string" && label.length > 0 && label.length <= 512 ? label : nodeId;
  } catch {
    return nodeId;
  }
}

// src/components/InvestigationPanel/useInvestigationQuery.ts
import { useRef as useRef15, useState as useState22 } from "react";
function useInvestigationQuery(port, admit) {
  const owner = port.binding;
  const currentOwner = useRef15(null);
  const active = useRef15(null);
  const [state, setState] = useState22(null);
  const [selection, setSelection] = useState22(null);
  useIsomorphicLayoutEffect(() => {
    currentOwner.current = owner;
    if (!active.current) setState((previous) => previous?.owner === owner && previous.status === "loading" ? null : previous);
    return () => {
      currentOwner.current = null;
      active.current?.abort();
      active.current = null;
    };
  }, [owner]);
  const close = () => {
    if (currentOwner.current !== owner) return;
    active.current?.abort();
    active.current = null;
    setState(null);
  };
  const select = (nodeId) => {
    if (currentOwner.current !== owner) return;
    close();
    setSelection({ owner, nodeId });
  };
  const query = (nodeId) => {
    const controller = new AbortController();
    if (currentOwner.current !== owner) {
      controller.abort();
      return controller;
    }
    active.current?.abort();
    active.current = controller;
    setSelection({ owner, nodeId });
    setState({ owner, nodeId, request: controller, status: "loading" });
    Promise.resolve().then(() => {
      if (controller.signal.aborted || currentOwner.current !== owner) return void 0;
      return port.explain(nodeId, { signal: controller.signal });
    }).then((value) => {
      if (active.current !== controller || controller.signal.aborted || currentOwner.current !== owner) return;
      const result = admit(value, nodeId);
      setState(result ? { owner, nodeId, request: controller, status: "ready", result } : { owner, nodeId, request: controller, status: "refused" });
    }, () => {
      if (active.current === controller && !controller.signal.aborted && currentOwner.current === owner)
        setState({ owner, nodeId, request: controller, status: "error" });
    });
    return controller;
  };
  return {
    owner,
    currentOwner,
    active,
    selected: state?.owner === owner ? state : null,
    selection: selection?.owner === owner ? selection.nodeId : void 0,
    query,
    close,
    select
  };
}

// src/components/InvestigationPanel/InvestigationPanel.tsx
import { Fragment as Fragment13, jsx as jsx44, jsxs as jsxs36 } from "react/jsx-runtime";
var box = {
  color: theme.textPrimary,
  background: theme.bg,
  border: `1px solid ${theme.border}`,
  borderRadius: theme.radius,
  padding: 20,
  fontFamily: theme.fontSans,
  lineHeight: 1.5,
  minWidth: 0,
  overflowWrap: "anywhere"
};
var button = {
  color: theme.textPrimary,
  background: theme.bgSecondary,
  border: `1px solid ${theme.border}`,
  borderRadius: 6,
  padding: "6px 10px",
  font: "inherit",
  cursor: "pointer"
};
var row = {
  borderBlockEnd: `1px solid ${theme.border}`,
  paddingBlock: 12
};
var attentionNames = {
  error: "Recorded error",
  "unknown-effect": "Outcome unknown",
  "gave-up": "Stopped retrying",
  timeout: "Timed out",
  retried: "Retried",
  "quality-drop": "Quality changed",
  "not-collected": "Evidence unavailable",
  outlier: "Unusual result"
};
function Badges({ marks }) {
  return /* @__PURE__ */ jsx44(Fragment13, { children: marks.map((mark, index) => /* @__PURE__ */ jsx44(
    "span",
    {
      style: {
        display: "inline-block",
        marginInlineEnd: 6,
        marginBlock: 3,
        padding: "2px 7px",
        borderRadius: 4,
        background: theme.accentBg
      },
      children: Object.prototype.hasOwnProperty.call(attentionNames, mark.kind) ? attentionNames[mark.kind] : mark.kind
    },
    index
  )) });
}
function Gaps({ gaps }) {
  return /* @__PURE__ */ jsx44(Fragment13, { children: gaps.map((gap, index) => /* @__PURE__ */ jsx44("p", { role: "status", children: gapMessages[gap.code] }, index)) });
}
function InvestigationPanel(props) {
  if (!props.port)
    return /* @__PURE__ */ jsxs36(
      "section",
      {
        "aria-label": "Investigation",
        className: props.className,
        style: { ...box, ...props.style },
        children: [
          /* @__PURE__ */ jsx44("h2", { children: "Needs attention" }),
          /* @__PURE__ */ jsx44("p", { role: "status", children: "Investigation is unavailable for this recording." })
        ]
      }
    );
  return /* @__PURE__ */ jsx44(BoundInvestigationPanel, { ...props, port: props.port });
}
function BoundInvestigationPanel(props) {
  const controller = useInvestigationQuery(props.port, admitExplanation);
  return /* @__PURE__ */ jsx44(InvestigationPanelView, { ...props, controller });
}
function InvestigationPanelView({ port, className, style, controller, showAttention = true, focusExternalRequests = true }) {
  const attention = useMemo21(
    () => showAttention ? admitAttention(port.attention) : void 0,
    [port.attention, showAttention]
  );
  const { owner, currentOwner, active, selected } = controller;
  const explanationElement = useRef16(null);
  const attentionElements = useRef16(/* @__PURE__ */ new Map());
  const returnTo = useRef16(null);
  const focusIntent = useRef16(null);
  const [page, setPage] = useState23({ owner, count: 20 });
  const visible = page.owner === owner ? page.count : 20;
  const [showPath, setShowPath] = useState23(false);
  const [showImpact, setShowImpact] = useState23(false);
  const [showAlternatives, setShowAlternatives] = useState23(false);
  const lastRequest = useRef16(null);
  useIsomorphicLayoutEffect(() => {
    if (returnTo.current?.owner !== owner) returnTo.current = null;
    return () => {
      focusIntent.current = null;
    };
  }, [owner]);
  useIsomorphicLayoutEffect(() => {
    if (!selected || selected.request === lastRequest.current) return;
    lastRequest.current = selected.request;
    setShowPath(false);
    setShowImpact(false);
    setShowAlternatives(false);
    if (focusExternalRequests) focusIntent.current = { owner, kind: "explanation", request: selected.request };
  });
  useIsomorphicLayoutEffect(() => {
    const intent = focusIntent.current;
    if (!intent || intent.owner !== owner || currentOwner.current !== owner)
      return;
    if (intent.kind === "explanation") {
      if (selected?.request !== intent.request || active.current !== intent.request || intent.request.signal.aborted)
        return;
      focusIntent.current = null;
      explanationElement.current?.focus();
    } else if (!selected) {
      focusIntent.current = null;
      attentionElements.current.get(intent.nodeId)?.focus();
    }
  });
  const close = () => {
    const target = returnTo.current;
    focusIntent.current = target?.owner === owner ? { ...target, kind: "attention" } : null;
    controller.close();
  };
  const query = (nodeId, fromAttention = false) => {
    if (fromAttention) returnTo.current = { owner, nodeId };
    const request = controller.query(nodeId);
    focusIntent.current = { owner, kind: "explanation", request };
  };
  const label = (nodeId) => displayLabel(port.labels, nodeId);
  const item = (nodeId, index) => /* @__PURE__ */ jsxs36("li", { style: row, children: [
    /* @__PURE__ */ jsx44("span", { children: label(nodeId) }),
    " ",
    /* @__PURE__ */ jsx44(
      "button",
      {
        type: "button",
        style: button,
        "aria-label": `Investigate related item ${index + 1}`,
        onClick: () => query(nodeId),
        children: "Investigate"
      }
    )
  ] }, `${index}:${nodeId}`);
  return /* @__PURE__ */ jsxs36(
    "section",
    {
      "aria-label": "Investigation",
      className,
      style: { ...box, ...style },
      children: [
        /* @__PURE__ */ jsx44("h2", { style: { marginBlockStart: 0 }, children: showAttention ? "Needs attention" : "Understand this step" }),
        /* @__PURE__ */ jsx44("p", { style: { color: theme.textSecondary }, children: "Choose an item to inspect its recorded causes and effects." }),
        showAttention && (!attention ? /* @__PURE__ */ jsx44("p", { role: "alert", children: "The attention list could not be verified." }) : /* @__PURE__ */ jsxs36(Fragment13, { children: [
          /* @__PURE__ */ jsx44(Gaps, { gaps: attention.gaps }),
          attention.confidence === "incomplete" && attention.nodes.length > 0 && /* @__PURE__ */ jsx44("p", { role: "status", children: "Attention coverage is incomplete. Other outcomes remain unknown." }),
          !attention.nodes.length ? /* @__PURE__ */ jsx44("p", { children: attention.confidence === "incomplete" || attention.gaps.length ? "No attention items are available. Coverage is unknown." : "No attention items were reported in the supplied evidence." }) : /* @__PURE__ */ jsx44("ul", { style: { listStyle: "none", padding: 0 }, children: attention.nodes.slice(0, selected ? 20 : visible).map((node, index) => /* @__PURE__ */ jsxs36("li", { style: row, children: [
            /* @__PURE__ */ jsx44("div", { children: label(node.nodeId) }),
            /* @__PURE__ */ jsx44(Badges, { marks: node.attention }),
            " ",
            /* @__PURE__ */ jsx44(
              "button",
              {
                ref: (element) => {
                  if (element)
                    attentionElements.current.set(node.nodeId, element);
                  else attentionElements.current.delete(node.nodeId);
                },
                type: "button",
                style: button,
                "aria-label": `Investigate item ${index + 1}`,
                onClick: () => query(node.nodeId, true),
                children: "Investigate"
              }
            )
          ] }, node.nodeId)) }),
          !selected && attention.nodes.length > visible && /* @__PURE__ */ jsx44(
            "button",
            {
              type: "button",
              style: button,
              onClick: () => setPage({ owner, count: visible + 20 }),
              children: "Show more attention items"
            }
          )
        ] })),
        selected && /* @__PURE__ */ jsxs36(
          "section",
          {
            ref: explanationElement,
            tabIndex: -1,
            "aria-label": "Selected explanation",
            "aria-busy": selected.status === "loading",
            style: {
              borderBlockStart: `1px solid ${theme.border}`,
              marginBlockStart: 20,
              paddingBlockStart: 16
            },
            children: [
              /* @__PURE__ */ jsx44("button", { type: "button", style: button, onClick: close, children: "Close investigation" }),
              /* @__PURE__ */ jsx44("h3", { children: label(selected.nodeId) }),
              selected.status === "loading" ? /* @__PURE__ */ jsx44("p", { role: "status", children: "Loading explanation\u2026" }) : selected.status === "error" ? /* @__PURE__ */ jsxs36(Fragment13, { children: [
                /* @__PURE__ */ jsx44("p", { role: "alert", children: "Explanation unavailable. Try again." }),
                /* @__PURE__ */ jsx44(
                  "button",
                  {
                    type: "button",
                    style: button,
                    onClick: () => query(selected.nodeId),
                    children: "Try again"
                  }
                )
              ] }) : selected.status === "refused" ? /* @__PURE__ */ jsxs36(Fragment13, { children: [
                /* @__PURE__ */ jsx44("p", { role: "alert", children: "This explanation could not be verified." }),
                /* @__PURE__ */ jsx44("p", { children: "Its evidence is unsupported, too large, or from a different selection." })
              ] }) : /* @__PURE__ */ jsxs36(Fragment13, { children: [
                /* @__PURE__ */ jsx44(Badges, { marks: selected.result.attention }),
                /* @__PURE__ */ jsx44("h4", { children: selected.result.rootCause ? "Supported root cause" : "Root cause unknown" }),
                selected.result.rootCause && /* @__PURE__ */ jsx44("p", { children: label(selected.result.rootCause) }),
                !selected.result.rootCause && /* @__PURE__ */ jsx44("p", { children: "The supplied evidence does not establish one root cause." }),
                !!selected.result.gaps.length && /* @__PURE__ */ jsx44("h4", { children: "Evidence coverage" }),
                /* @__PURE__ */ jsx44(Gaps, { gaps: selected.result.gaps }),
                selected.result.confidence === "incomplete" && !selected.result.gaps.length && /* @__PURE__ */ jsx44("p", { role: "status", children: "The recorded explanation is incomplete." }),
                /* @__PURE__ */ jsxs36("details", { children: [
                  /* @__PURE__ */ jsx44("summary", { children: "Recorded evidence references" }),
                  /* @__PURE__ */ jsx44("ul", { children: [
                    ...selected.result.attention.flatMap(
                      (mark) => mark.evidence
                    ),
                    ...selected.result.gaps.flatMap((gap) => gap.evidence),
                    ...selected.result.impact.gaps.flatMap(
                      (gap) => gap.evidence
                    )
                  ].map((reference, index) => /* @__PURE__ */ jsx44("li", { children: reference }, index)) })
                ] }),
                /* @__PURE__ */ jsx44(
                  "button",
                  {
                    type: "button",
                    style: button,
                    "aria-expanded": showPath,
                    onClick: () => setShowPath((value) => !value),
                    children: showPath ? "Hide recorded path" : "Show recorded path"
                  }
                ),
                showPath && /* @__PURE__ */ jsxs36(Fragment13, { children: [
                  /* @__PURE__ */ jsx44("h4", { children: "Recorded dependency path" }),
                  selected.result.path.length ? /* @__PURE__ */ jsx44("ol", { children: selected.result.path.map(item) }) : /* @__PURE__ */ jsx44("p", { children: "No dependency path was supplied." })
                ] }),
                !!selected.result.alternatives.length && /* @__PURE__ */ jsxs36(Fragment13, { children: [
                  /* @__PURE__ */ jsx44("h4", { children: "Alternative candidates" }),
                  /* @__PURE__ */ jsx44("p", { children: "These candidates remain uncertain." }),
                  /* @__PURE__ */ jsx44(
                    "button",
                    {
                      type: "button",
                      style: button,
                      "aria-expanded": showAlternatives,
                      onClick: () => setShowAlternatives((value) => !value),
                      children: showAlternatives ? "Hide alternative candidates" : "Show alternative candidates"
                    }
                  ),
                  showAlternatives && /* @__PURE__ */ jsx44("ul", { children: selected.result.alternatives.map(item) })
                ] }),
                /* @__PURE__ */ jsx44("div", { style: { marginBlockStart: 16 }, children: /* @__PURE__ */ jsx44(
                  "button",
                  {
                    type: "button",
                    style: button,
                    "aria-expanded": showImpact,
                    onClick: () => setShowImpact((value) => !value),
                    children: showImpact ? "Hide affected items" : "Show affected items"
                  }
                ) }),
                showImpact && /* @__PURE__ */ jsxs36(Fragment13, { children: [
                  /* @__PURE__ */ jsx44("h4", { children: "Affected items" }),
                  /* @__PURE__ */ jsx44(Gaps, { gaps: selected.result.impact.gaps }),
                  selected.result.impact.confidence === "incomplete" && /* @__PURE__ */ jsx44("p", { role: "status", children: "Affected-item coverage is incomplete. Unlisted items remain unknown." }),
                  selected.result.impact.nodes.length ? /* @__PURE__ */ jsx44("ul", { children: selected.result.impact.nodes.map(item) }) : /* @__PURE__ */ jsx44("p", { children: "No affected items were reported in the supplied evidence." })
                ] })
              ] })
            ]
          }
        )
      ]
    }
  );
}

// src/components/GroupedFlowInvestigation/GroupedFlowInvestigation.tsx
import { useEffect as useEffect19, useMemo as useMemo22, useRef as useRef17, useState as useState24 } from "react";

// src/components/GroupedFlowInvestigation/projection.ts
function projectInvestigation(definition, result, direction) {
  const known = new Map(definition.nodes.map((node) => [node.id, node]));
  const source = direction === "cause" ? result.backward : result.impact;
  const references = direction === "cause" ? result.backward?.nodes ?? result.path : result.impact.nodes;
  const ids = /* @__PURE__ */ new Set([result.nodeId, ...references, ...direction === "cause" && result.rootCause ? [result.rootCause] : []]);
  const relationshipIds = new Set(definition.edges.map((edge) => edge.id));
  const relationships = [];
  let sequence = 0;
  for (const edge of source?.edges ?? []) {
    ids.add(edge.from);
    ids.add(edge.to);
    if (!known.has(edge.from) || !known.has(edge.to)) continue;
    let id;
    do {
      id = `recorded-dependency:${sequence++}`;
    } while (relationshipIds.has(id));
    relationshipIds.add(id);
    relationships.push({
      id,
      source: edge.from,
      target: edge.to,
      kind: edge.kind,
      attribution: edge.attribution,
      evidence: edge.evidence,
      direction: direction === "cause" ? "backward" : "forward"
    });
  }
  const nodeIds = [...ids].filter((id) => known.has(id));
  const groupIds = /* @__PURE__ */ new Set();
  for (const id of nodeIds) {
    let parent = known.get(id)?.parentId;
    while (parent !== void 0) {
      groupIds.add(parent);
      parent = known.get(parent)?.parentId;
    }
  }
  return {
    nodeIds,
    groupIds: [...groupIds],
    relationships,
    unmapped: ids.size - nodeIds.length,
    relationshipsAvailable: source?.edges !== void 0,
    confidence: source?.confidence,
    gaps: source?.gaps ?? []
  };
}

// src/components/GroupedFlowInvestigation/DependencyEvidence.tsx
import { jsx as jsx45, jsxs as jsxs37 } from "react/jsx-runtime";
function DependencyEvidence({ result, direction, labels }) {
  const source = direction === "cause" ? result.backward : result.impact;
  if (!source?.edges) return null;
  return /* @__PURE__ */ jsxs37("details", { children: [
    /* @__PURE__ */ jsxs37("summary", { children: [
      "Recorded dependency evidence (",
      source.edges.length,
      ")"
    ] }),
    /* @__PURE__ */ jsx45("p", { children: "These are the returned relationships, including references outside this diagram. Names do not establish identity or a cause." }),
    /* @__PURE__ */ jsx45("ol", { children: source.edges.slice(0, 64).map((edge, index) => /* @__PURE__ */ jsxs37("li", { children: [
      /* @__PURE__ */ jsxs37("span", { children: [
        displayLabel(labels, edge.from),
        " \u2192 ",
        displayLabel(labels, edge.to),
        " \xB7 ",
        edge.kind,
        " \xB7 ",
        edge.attribution
      ] }),
      /* @__PURE__ */ jsx45("ul", { children: edge.evidence.map((reference, at) => /* @__PURE__ */ jsx45("li", { children: reference }, at)) })
    ] }, index)) }),
    source.edges.length > 64 && /* @__PURE__ */ jsxs37("p", { children: [
      source.edges.length - 64,
      " additional relationships are retained in the admitted result and not expanded here."
    ] }),
    !source.edges.length && /* @__PURE__ */ jsx45("p", { children: "No relationships were returned for this direction. This is not evidence of success or absence of external effects." })
  ] });
}

// src/components/GroupedFlowInvestigation/GroupedFlowInvestigation.tsx
import { jsx as jsx46, jsxs as jsxs38 } from "react/jsx-runtime";
var action = { font: "inherit", fontSize: 12, border: `1px solid ${theme.border}`, borderRadius: 8, padding: "7px 12px", background: theme.bgElevated, color: theme.textPrimary, cursor: "pointer" };
function GroupedFlowInvestigation(props) {
  const admitted = useMemo22(() => {
    return projectGroupedFlowDiagram(props.definition, { observation: props.observation });
  }, [props.definition, props.observation]);
  if (!admitted.model) return /* @__PURE__ */ jsx46(GroupedFlowDiagram, { definition: props.definition, observation: props.observation, className: props.className, style: props.style });
  if (!props.port) return /* @__PURE__ */ jsxs38("section", { className: props.className, style: props.style, children: [
    /* @__PURE__ */ jsx46(GroupedFlowDiagram, { definition: admitted.model.definition, observation: props.observation, direction: props.direction }),
    /* @__PURE__ */ jsx46(InvestigationPanel, { port: null })
  ] });
  return /* @__PURE__ */ jsx46(BoundGroupedFlowInvestigation, { ...props, port: props.port, admitted: admitted.model });
}
function BoundGroupedFlowInvestigation({ admitted, port, ...props }) {
  const controller = useInvestigationQuery(port, admitVisualExplanation);
  const { owner, selected } = controller;
  const ready = selected?.status === "ready" ? selected : void 0;
  const wrapper = useRef17(null);
  const [narrow, setNarrow] = useState24(false);
  const [expansion, setExpansion] = useState24({ owner, ids: [] });
  const [mode, setMode] = useState24();
  const [focusCommand, setFocusCommand] = useState24();
  const [view, setView] = useState24();
  const activeView = view?.request === ready?.request ? view : void 0;
  const whole = activeView?.whole ?? false;
  const phase = mode && mode.request === selected?.request ? mode.value : "cause";
  const diagramBindings = useRef17(/* @__PURE__ */ new WeakMap());
  const nextDiagramBinding = useRef17(0);
  const diagramBindingKey = useMemo22(() => {
    let key = diagramBindings.current.get(owner);
    if (key === void 0) {
      key = nextDiagramBinding.current++;
      diagramBindings.current.set(owner, key);
    }
    return key;
  }, [owner]);
  const known = useMemo22(() => new Map(admitted.definition.nodes.map((node) => [node.id, node])), [admitted.definition]);
  const states = useMemo22(() => new Map(Object.entries(admitted.nodeStates ?? {})), [admitted]);
  const projected = useMemo22(() => ready ? projectInvestigation(admitted.definition, ready.result, phase) : void 0, [admitted.definition, ready, phase]);
  const currentIds = expansion.owner === owner ? expansion.ids : [];
  const automaticExpansion = useRef17(void 0);
  const needsReveal = ready && (automaticExpansion.current?.request !== ready.request || automaticExpansion.current?.phase !== phase);
  const expandedGroupIds = needsReveal ? [.../* @__PURE__ */ new Set([...currentIds, ...projected?.groupIds ?? []])] : currentIds;
  useIsomorphicLayoutEffect(() => {
    if (!ready || !needsReveal) return;
    automaticExpansion.current = { request: ready.request, phase };
    setExpansion({ owner, ids: expandedGroupIds });
  });
  useEffect19(() => {
    const element = wrapper.current;
    if (!element) return;
    const measure = () => setNarrow(element.clientWidth > 0 && element.clientWidth < 600);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const selectedId = controller.selection && known.has(controller.selection) ? controller.selection : null;
  const activeFocusCommand = focusCommand?.request === ready?.request && focusCommand?.phase === phase ? focusCommand : void 0;
  const cameraKey = useMemo22(() => ({ owner, request: ready?.request, phase, command: activeFocusCommand, view: activeView }), [owner, ready?.request, phase, activeFocusCommand, activeView]);
  let focusNodeIds = [.../* @__PURE__ */ new Set([...projected?.groupIds ?? [], ...projected?.nodeIds ?? []])];
  if (ready && (activeFocusCommand || narrow)) {
    const target = !activeFocusCommand && phase === "cause" && ready.result.rootCause && known.has(ready.result.rootCause) ? ready.result.rootCause : selectedId;
    focusNodeIds = target ? [target] : [];
  }
  const choose = (nodeId) => {
    if (!known.has(nodeId)) return;
    if (states.get(nodeId) === "failed") controller.query(nodeId);
    else controller.select(nodeId);
  };
  const root = ready?.result.rootCause;
  let mappedRoot = root && known.has(root) ? root : void 0;
  for (let id = mappedRoot; id !== void 0; id = known.get(id)?.parentId) {
    if (states.get(id) === "not-run") {
      mappedRoot = void 0;
      break;
    }
  }
  const summary = selected?.status === "loading" ? "Checking recorded evidence\u2026" : ready && mappedRoot ? `Supported cause: ${known.get(mappedRoot).label}. ${phase === "cause" ? "The recorded path is highlighted below." : "Showing recorded affected items below."}` : ready && root && !known.has(root) ? "The supported cause is not shown in this diagram. No substitute card is labelled." : ready || selected?.status === "error" || selected?.status === "refused" ? "Cause unknown. The available evidence does not support a cause on this diagram." : "Select a failed item, or select another item and choose Investigate selected item.";
  const recordedFitIds = narrow && ready ? phase === "cause" && mappedRoot ? [mappedRoot] : selectedId ? [selectedId] : [] : [.../* @__PURE__ */ new Set([...projected?.groupIds ?? [], ...projected?.nodeIds ?? []])];
  const changeView = () => {
    if (!ready || controller.currentOwner.current !== owner || controller.active.current !== ready.request || ready.request.signal.aborted) return;
    setView({ request: ready.request, whole: !whole });
  };
  return /* @__PURE__ */ jsxs38(
    "section",
    {
      ref: wrapper,
      className: props.className,
      "aria-label": props["aria-label"] ?? "Grouped flow investigation",
      style: { display: "grid", gap: 16, minWidth: 0, color: theme.textPrimary, fontFamily: theme.fontSans, ...props.style },
      children: [
        /* @__PURE__ */ jsx46("div", { role: "status", "aria-label": "Cause summary", "aria-live": "polite", style: { padding: "12px 16px", border: `1px solid ${theme.border}`, borderRadius: 10, background: theme.bgElevated }, children: /* @__PURE__ */ jsx46("strong", { children: summary }) }),
        ready && /* @__PURE__ */ jsxs38("div", { style: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }, children: [
          /* @__PURE__ */ jsx46("strong", { children: whole ? "Whole flow" : phase === "cause" ? "Cause focus" : "Impact focus" }),
          /* @__PURE__ */ jsx46("button", { type: "button", style: action, onClick: changeView, children: whole ? "Focus on recorded links" : "Show whole flow" }),
          !whole && /* @__PURE__ */ jsx46("span", { style: { fontSize: 12, color: theme.textSecondary }, children: "Workflow arrows are hidden so the recorded connections are easier to follow." })
        ] }),
        /* @__PURE__ */ jsx46(RecordedFocusContext.Provider, { value: { focused: !!ready && !whole, fitNodeIds: recordedFitIds }, children: /* @__PURE__ */ jsx46(
          GroupedFlowDiagram,
          {
            definition: admitted.definition,
            observation: props.observation,
            direction: props.direction,
            selectedNodeId: selectedId,
            onSelectNode: choose,
            expandedGroupIds,
            onExpandedGroupIdsChange: (ids) => setExpansion({ owner, ids }),
            highlight: projected ? { nodeIds: projected.nodeIds, ...phase === "cause" && mappedRoot ? { rootCauseId: mappedRoot } : {} } : void 0,
            recordedRelationships: projected?.relationships,
            focusRequest: ready && (whole || focusNodeIds.length) ? { key: cameraKey, nodeIds: whole ? [] : focusNodeIds } : void 0
          },
          diagramBindingKey
        ) }),
        /* @__PURE__ */ jsxs38("div", { style: { display: "flex", flexWrap: "wrap", gap: 8 }, children: [
          /* @__PURE__ */ jsx46("button", { type: "button", style: action, disabled: !selectedId || selected?.status === "loading", onClick: () => {
            if (selectedId) controller.query(selectedId);
          }, children: "Investigate selected item" }),
          /* @__PURE__ */ jsx46("button", { type: "button", style: action, disabled: !ready, "aria-pressed": phase === "cause", onClick: () => {
            if (ready) setMode({ request: ready.request, value: "cause" });
          }, children: "Why it happened" }),
          /* @__PURE__ */ jsx46("button", { type: "button", style: action, disabled: !ready, "aria-pressed": phase === "impact", onClick: () => {
            if (ready) setMode({ request: ready.request, value: "impact" });
          }, children: "What it affected" }),
          /* @__PURE__ */ jsx46("button", { type: "button", style: action, disabled: !ready || !selectedId, onClick: () => {
            if (ready) setFocusCommand((previous) => ({ request: ready.request, phase, count: (previous?.count ?? 0) + 1 }));
          }, children: "Back to selected item" })
        ] }),
        projected && /* @__PURE__ */ jsxs38("div", { role: "status", children: [
          /* @__PURE__ */ jsx46("p", { children: phase === "cause" ? "Dependency arrows point from an item toward its recorded source. They do not show execution order or prove how a value was used." : "Arrows show returned recorded relationships to linked items, not proof of harm or delivery." }),
          !projected.relationshipsAvailable && /* @__PURE__ */ jsx46("p", { children: phase === "cause" ? "Backward connections were not provided. References can be shown, but missing links remain unknown." : "Impact connections were not provided. The full effect of these references remains unknown." }),
          projected.confidence === "incomplete" && /* @__PURE__ */ jsx46("p", { children: "Some evidence is missing. The highlighted references do not establish the full dependency picture." }),
          projected.unmapped > 0 && /* @__PURE__ */ jsxs38("p", { children: [
            projected.unmapped,
            " recorded ",
            projected.unmapped === 1 ? "item is" : "items are",
            " not shown in this diagram. No substitute item has been selected."
          ] })
        ] }),
        /* @__PURE__ */ jsx46(InvestigationPanelView, { port, controller, showAttention: false, focusExternalRequests: false }),
        ready && /* @__PURE__ */ jsx46(DependencyEvidence, { result: ready.result, direction: phase, labels: port.labels })
      ]
    }
  );
}
export {
  CommentaryPanel,
  CompactTimeline,
  CompactTimelinePanel,
  DEFAULT_EXCLUDED_KEYS,
  DataTracePanel,
  ExplainableProvider,
  ExplainableShell,
  ExplainableView,
  FlowchartPanel,
  FootprintTheme,
  GanttTimeline,
  GroupedFlowDiagram,
  GroupedFlowInvestigation,
  InsightPanel,
  InspectorPanel,
  InvestigationPanel,
  MemoryInspector,
  MemoryPanel,
  NarrativeLog,
  NarrativePanel,
  NarrativeTrace,
  ResultPanel,
  ScopeDiff,
  SnapshotPanel,
  StageDetailPanel,
  StoryNarrative,
  SubflowTree,
  SurfaceCollapseHandle,
  TimeTravelBar,
  TimeTravelControls,
  TimelinePanel,
  TraceViewer,
  TraceWalkCard,
  ValueInspector,
  buildEntryRangeIndex,
  buildTraceWalk,
  computeRevealedEntryCount,
  coolDark,
  coolLight,
  createSnapshots,
  defaultTokens,
  extractSubflowNarrative,
  formatTraceWalk,
  getFlowDiagramAncestors,
  graphFromStructure,
  mergeWritePatch,
  narrativeFromSnapshot,
  overlayFromSnapshot,
  projectGroupedFlowDiagram,
  projectTraceInvocation,
  rawDefaults,
  subflowResultToSnapshots,
  themeModeVars,
  themePresets,
  toVisualizationSnapshots,
  tokensToCSSVars,
  useDarkModeTokens,
  useExplainableRun,
  useFootprintTheme,
  warmDark,
  warmLight
};
//# sourceMappingURL=index.js.map