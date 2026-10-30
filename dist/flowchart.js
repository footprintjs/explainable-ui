// src/components/GroupedFlowDiagram/GroupedFlowDiagram.tsx
import { useEffect as useEffect3, useMemo, useRef as useRef2, useState as useState2 } from "react";
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

// src/theme/useDarkModeTokens.ts
import { useState, useEffect } from "react";

// src/theme/mode.ts
function themeModeVars(mode) {
  if (!mode) return {};
  return tokensToCSSVars(mode === "light" ? coolLight : coolDark);
}

// src/components/FlowchartView/_internal/useChartAutoRefit.ts
import { useEffect as useEffect2, useRef } from "react";
import { useReactFlow, useStoreApi } from "@xyflow/react";

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
  const bounds = measuredChartBounds(state.nodeLookup);
  if (!bounds) return null;
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
function useChartAutoRefit({ wrapperRef, padding: padding2 = 0.1, refitKey, layoutKey, focusNodeIds, focusRequestKey, maxAutoZoom }) {
  const store = useStoreApi();
  const { setViewport } = useReactFlow();
  const requestLayoutFit = useRef(null);
  useEffect2(() => {
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
      return chartFitViewport({ ...state, nodeLookup, maxZoom: maxAutoZoom === void 0 ? state.maxZoom : Math.min(state.maxZoom, maxAutoZoom) }, padding2);
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
  useEffect2(() => {
    requestLayoutFit.current?.();
  }, [layoutKey]);
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
function DependencyHandles({ direction }) {
  return /* @__PURE__ */ jsxs2(Fragment, { children: [
    /* @__PURE__ */ jsx4(Handle2, { id: "dependency-source", type: "source", position: direction === "LR" ? Position2.Left : Position2.Top, isConnectable: false, style: { opacity: 0 } }),
    /* @__PURE__ */ jsx4(Handle2, { id: "dependency-target", type: "target", position: direction === "LR" ? Position2.Right : Position2.Bottom, isConnectable: false, style: { opacity: 0 } })
  ] });
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
    /* @__PURE__ */ jsx4(DependencyHandles, { direction: d.direction }),
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
        decision && /* @__PURE__ */ jsx4("svg", { "aria-hidden": "true", width: item.width, height: item.height, style: { position: "absolute", inset: 0 }, children: /* @__PURE__ */ jsx4("polygon", { points: `${item.width / 2},2 ${item.width - 2},${item.height / 2} ${item.width / 2},${item.height - 2} 2,${item.height / 2}`, fill: theme.bgElevated, stroke: border, strokeWidth: "2" }) }),
        /* @__PURE__ */ jsxs2(
          "button",
          {
            type: "button",
            className: "nodrag nopan",
            "aria-label": action2,
            "aria-describedby": statusId,
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
              padding: decision ? "18px 42px" : "12px 18px",
              fontFamily: theme.fontSans,
              cursor: "pointer",
              color: "inherit",
              border: decision ? "none" : `2px ${group || item.state === "not-run" ? "dashed" : "solid"} ${border}`,
              borderRadius: 16,
              background: decision ? "transparent" : theme.bgElevated,
              boxShadow: !decision ? "0 7px 20px rgba(0, 0, 0, 0.03137255)" : void 0,
              outline: d.selected ? `3px solid ${theme.tracing}` : void 0,
              outlineOffset: 4
            },
            children: [
              /* @__PURE__ */ jsx4(DiagramIcon, { icon: node.icon ?? (group ? "flow" : "step"), style: { color: item.state === "not-run" ? theme.textMuted : theme.warning } }),
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
        /* @__PURE__ */ jsx4(DependencyHandles, { direction: d.direction }),
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
import { BaseEdge, EdgeLabelRenderer, Position as Position3 } from "@xyflow/react";
import { Fragment as Fragment2, jsx as jsx5, jsxs as jsxs3 } from "react/jsx-runtime";
function RecordedRelationshipEdge(props) {
  const data = props.data;
  const relationship = data?.relationship;
  const lane = relationship?.direction === "backward" ? -64 : 64;
  const spread = lane + ((data?.parallelIndex ?? 0) - ((data?.parallelCount ?? 1) - 1) / 2) * 36;
  const caption = relationship?.attribution === "stage" ? "Step" : relationship?.attribution === "recorded-read" ? "Read" : relationship?.kind === "control" ? "Rule" : relationship?.kind === "data" ? "Data" : "Link";
  const fullLabel = typeof props.label === "string" ? props.label : "Recorded dependency";
  const horizontal = props.sourcePosition === Position3.Left || props.sourcePosition === Position3.Right;
  const delta = horizontal ? props.targetX - props.sourceX : props.targetY - props.sourceY;
  const bend = Math.max(32, Math.abs(delta) * 0.35);
  const control = (x2, y2, position) => [
    x2 + (position === Position3.Left ? -bend : position === Position3.Right ? bend : 0) + (horizontal ? 0 : spread),
    y2 + (position === Position3.Top ? -bend : position === Position3.Bottom ? bend : 0) + (horizontal ? spread : 0)
  ];
  const one = control(props.sourceX, props.sourceY, props.sourcePosition), two = control(props.targetX, props.targetY, props.targetPosition);
  const path = `M${props.sourceX},${props.sourceY} C${one[0]},${one[1]} ${two[0]},${two[1]} ${props.targetX},${props.targetY}`;
  const x = (props.sourceX + props.targetX) / 2 + (horizontal ? 0 : spread * 0.75);
  const y = (props.sourceY + props.targetY) / 2 + (horizontal ? spread * 0.75 : 0);
  return /* @__PURE__ */ jsxs3(Fragment2, { children: [
    /* @__PURE__ */ jsx5(BaseEdge, { id: props.id, path, markerEnd: props.markerEnd, style: props.style }),
    /* @__PURE__ */ jsx5(EdgeLabelRenderer, { children: /* @__PURE__ */ jsx5(
      "span",
      {
        className: "nodrag nopan",
        title: fullLabel,
        "aria-label": fullLabel,
        "data-relationship-id": props.id,
        style: {
          position: "absolute",
          transform: `translate(-50%, -50%) translate(${x}px,${y}px)`,
          fontFamily: theme.fontSans,
          fontSize: 11,
          maxWidth: 180,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          borderRadius: 4,
          padding: "3px 6px",
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
  const [localExpanded, setLocalExpanded] = useState2(props.defaultExpandedGroupIds ?? []);
  const [localSelected, setLocalSelected] = useState2();
  const wrapper = useRef2(null);
  const [narrow, setNarrow] = useState2(false);
  const [focusIds, setFocusIds] = useState2();
  const [focusRequest, setFocusRequest] = useState2(0);
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
  const camera = useMemo(() => !model || props.focusRequest === void 0 ? void 0 : admitFocusRequest(props.focusRequest, model), [model, props.focusRequest]);
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
  const nodes = model?.nodes.map((item) => ({
    id: item.node.id,
    type: item.expanded ? "flowDiagramGroup" : "flowDiagramItem",
    parentId: item.parentId,
    position: item.position,
    width: item.width,
    height: item.height,
    style: { width: item.width, height: item.height, pointerEvents: "all" },
    draggable: false,
    selectable: false,
    data: {
      item,
      caption: names.get(item.node.id) ?? "",
      selected: item.node.id === selected,
      direction: model.direction,
      canToggle,
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
  const parallelCounts = /* @__PURE__ */ new Map(), parallelIndices = /* @__PURE__ */ new Map();
  for (const item of overlay ?? []) {
    const pair = JSON.stringify([item.source, item.target]);
    parallelCounts.set(pair, (parallelCounts.get(pair) ?? 0) + 1);
  }
  for (const item of overlay ?? []) {
    const relationship = item.relationship;
    const pair = JSON.stringify([item.source, item.target]), parallelIndex = parallelIndices.get(pair) ?? 0;
    parallelIndices.set(pair, parallelIndex + 1);
    edges.push({
      id: relationship.id,
      source: item.source,
      target: item.target,
      type: "recordedRelationship",
      ...relationship.direction === "backward" ? { sourceHandle: "dependency-source", targetHandle: "dependency-target" } : {},
      label: `${relationshipLabels[relationship.attribution]} \xB7 ${relationship.kind}`,
      ariaLabel: `${relationshipLabels[relationship.attribution]}. ${relationship.kind} dependency.${item.collapsed ? " Grouped view of the original relationship." : ""}`,
      data: { relationship, collapsed: item.collapsed, parallelIndex, parallelCount: parallelCounts.get(pair) },
      className: "gfd-recorded-relationship",
      markerEnd: { type: MarkerType.ArrowClosed, color: theme.tracing },
      style: { stroke: theme.tracing, strokeWidth: 3, ...relationship.attribution === "stage" ? { strokeDasharray: "6 5" } : {} },
      labelStyle: { fill: theme.textPrimary, fontSize: 12 },
      labelBgStyle: { fill: theme.bgElevated },
      labelBgPadding: [7, 4]
    });
  }
  useEffect3(() => {
    if (!camera || Object.is(lastCameraKey.current, camera.key)) return;
    lastCameraKey.current = camera.key;
    requestFocus(camera.nodeIds.length ? camera.nodeIds : void 0);
  }, [Boolean(camera), camera?.key]);
  const geometry = model ? JSON.stringify(model.nodes.map((node) => [node.node.id, node.parentId, node.position, node.width, node.height])) : "";
  useEffect3(() => {
    const element = wrapper.current;
    if (!element) return;
    const measure = () => setNarrow(element.clientWidth > 0 && element.clientWidth < 600);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [Boolean(model)]);
  useEffect3(() => {
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
      style: { display: "flex", flexDirection: "column", width: "100%", height: 560, minHeight: 320, minWidth: 0, fontFamily: theme.fontSans, color: theme.textPrimary, ...props.style },
      children: [
        /* @__PURE__ */ jsxs4("div", { style: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, padding: "10px 0" }, children: [
          /* @__PURE__ */ jsx6("button", { type: "button", style: buttonStyle, onClick: () => requestFocus(), children: "Fit diagram" }),
          /* @__PURE__ */ jsx6("button", { type: "button", style: buttonStyle, disabled: !selected || !canToggle, onClick: () => {
            if (!selected) return;
            requestFocus([selected]);
            const next = [.../* @__PURE__ */ new Set([...model.expandedGroupIds, ...getFlowDiagramAncestors(model.definition, selected)])];
            changeExpanded(next);
          }, children: "Reveal selection" }),
          /* @__PURE__ */ jsx6("button", { type: "button", style: buttonStyle, disabled: !highlightFocusIds.size, onClick: () => {
            if (highlightFocusIds.size) requestFocus([...highlightFocusIds]);
          }, children: "Focus highlighted path" }),
          /* @__PURE__ */ jsx6("span", { style: { fontSize: 11, color: theme.textSecondary }, children: "Open a flow to see its steps. Missing information stays unknown." })
        ] }),
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
              /* @__PURE__ */ jsx6(ChartAutoRefit, { wrapperRef: wrapper, refitKey: geometry, padding: 0.06, focusNodeIds: focusIds, focusRequestKey: focusRequest, maxAutoZoom: 1 }),
              /* @__PURE__ */ jsx6(Background, { gap: 24, color: theme.border }),
              /* @__PURE__ */ jsx6(Controls, { showInteractive: false })
            ]
          }
        ) }),
        /* @__PURE__ */ jsxs4("p", { style: { margin: "8px 0 0", fontSize: 11, color: theme.textSecondary }, children: [
          "\u2713 Completed step \xB7 \xD7 Failed step \xB7 ? Unknown \xB7 Dashed relationship: not verified or recorded as not taken",
          overlay.length > 0 ? " \xB7 Highlighted dependency links are recorded evidence, not execution transitions" : ""
        ] })
      ]
    }
  );
}

// src/components/StageNode/StageNode.tsx
import { memo, useEffect as useEffect4, useRef as useRef3 } from "react";
import { Handle as Handle3, Position as Position4 } from "@xyflow/react";
import { Fragment as Fragment3, jsx as jsx7, jsxs as jsxs5 } from "react/jsx-runtime";
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
      return /* @__PURE__ */ jsxs5("svg", { ...props, children: [
        /* @__PURE__ */ jsx7("circle", { cx: "8", cy: "8", r: "6", stroke: color, strokeWidth: "1.5" }),
        /* @__PURE__ */ jsx7("path", { d: "M5.5 8C5.5 6.5 6.5 5 8 5S10.5 6.5 10.5 8", stroke: color, strokeWidth: "1.2", strokeLinecap: "round" }),
        /* @__PURE__ */ jsx7("circle", { cx: "8", cy: "9.5", r: "1", fill: color }),
        /* @__PURE__ */ jsx7("line", { x1: "8", y1: "2", x2: "8", y2: "3.5", stroke: color, strokeWidth: "1", strokeLinecap: "round" }),
        /* @__PURE__ */ jsx7("line", { x1: "12.5", y1: "4", x2: "11.2", y2: "5", stroke: color, strokeWidth: "1", strokeLinecap: "round" }),
        /* @__PURE__ */ jsx7("line", { x1: "3.5", y1: "4", x2: "4.8", y2: "5", stroke: color, strokeWidth: "1", strokeLinecap: "round" })
      ] });
    // Tool / function call — gear
    case "tool":
    case "function":
      return /* @__PURE__ */ jsxs5("svg", { ...props, children: [
        /* @__PURE__ */ jsx7("circle", { cx: "8", cy: "8", r: "3", stroke: color, strokeWidth: "1.5" }),
        [0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
          const rad = angle * Math.PI / 180;
          const x1 = 8 + Math.cos(rad) * 4.5;
          const y1 = 8 + Math.sin(rad) * 4.5;
          const x2 = 8 + Math.cos(rad) * 6;
          const y2 = 8 + Math.sin(rad) * 6;
          return /* @__PURE__ */ jsx7("line", { x1, y1, x2, y2, stroke: color, strokeWidth: "1.5", strokeLinecap: "round" }, angle);
        })
      ] });
    // RAG / retrieval — magnifying glass + doc
    case "rag":
    case "search":
    case "retrieval":
      return /* @__PURE__ */ jsxs5("svg", { ...props, children: [
        /* @__PURE__ */ jsx7("circle", { cx: "7", cy: "7", r: "4", stroke: color, strokeWidth: "1.5" }),
        /* @__PURE__ */ jsx7("line", { x1: "10", y1: "10", x2: "13.5", y2: "13.5", stroke: color, strokeWidth: "1.5", strokeLinecap: "round" }),
        /* @__PURE__ */ jsx7("line", { x1: "5.5", y1: "6", x2: "8.5", y2: "6", stroke: color, strokeWidth: "1", strokeLinecap: "round" }),
        /* @__PURE__ */ jsx7("line", { x1: "5.5", y1: "8", x2: "7.5", y2: "8", stroke: color, strokeWidth: "1", strokeLinecap: "round" })
      ] });
    // Parse / process — diamond with arrows
    case "parse":
    case "process":
    case "transform":
      return /* @__PURE__ */ jsx7("svg", { ...props, children: /* @__PURE__ */ jsx7("rect", { x: "4", y: "4", width: "8", height: "8", rx: "1.5", stroke: color, strokeWidth: "1.5", transform: "rotate(45 8 8)" }) });
    // Start / seed — play triangle
    case "start":
    case "seed":
    case "init":
      return /* @__PURE__ */ jsx7("svg", { ...props, children: /* @__PURE__ */ jsx7("path", { d: "M5 3.5L12.5 8L5 12.5V3.5Z", fill: color, opacity: "0.8" }) });
    // End / finalize — stop square
    case "end":
    case "finalize":
    case "output":
      return /* @__PURE__ */ jsx7("svg", { ...props, children: /* @__PURE__ */ jsx7("rect", { x: "4", y: "4", width: "8", height: "8", rx: "1.5", fill: color, opacity: "0.8" }) });
    // Agent — person silhouette
    case "agent":
    case "orchestrator":
      return /* @__PURE__ */ jsxs5("svg", { ...props, children: [
        /* @__PURE__ */ jsx7("circle", { cx: "8", cy: "5", r: "2.5", stroke: color, strokeWidth: "1.5" }),
        /* @__PURE__ */ jsx7("path", { d: "M3.5 14C3.5 11 5.5 9 8 9S12.5 11 12.5 14", stroke: color, strokeWidth: "1.5", strokeLinecap: "round" })
      ] });
    // Swarm — multi-agent
    case "swarm":
    case "multi-agent":
      return /* @__PURE__ */ jsxs5("svg", { ...props, children: [
        /* @__PURE__ */ jsx7("circle", { cx: "5", cy: "5", r: "2", stroke: color, strokeWidth: "1.2" }),
        /* @__PURE__ */ jsx7("circle", { cx: "11", cy: "5", r: "2", stroke: color, strokeWidth: "1.2" }),
        /* @__PURE__ */ jsx7("circle", { cx: "8", cy: "11", r: "2", stroke: color, strokeWidth: "1.2" }),
        /* @__PURE__ */ jsx7("line", { x1: "5", y1: "7", x2: "8", y2: "9", stroke: color, strokeWidth: "1", opacity: "0.5" }),
        /* @__PURE__ */ jsx7("line", { x1: "11", y1: "7", x2: "8", y2: "9", stroke: color, strokeWidth: "1", opacity: "0.5" })
      ] });
    // Guard / guardrail — shield
    case "guard":
    case "guardrail":
    case "validate":
      return /* @__PURE__ */ jsxs5("svg", { ...props, children: [
        /* @__PURE__ */ jsx7("path", { d: "M8 2L3 5V9C3 11.5 5 13.5 8 14.5C11 13.5 13 11.5 13 9V5L8 2Z", stroke: color, strokeWidth: "1.5", strokeLinejoin: "round" }),
        /* @__PURE__ */ jsx7("path", { d: "M6 8L7.5 9.5L10 6.5", stroke: color, strokeWidth: "1.2", strokeLinecap: "round", strokeLinejoin: "round" })
      ] });
    // Stream — wave
    case "stream":
    case "streaming":
      return /* @__PURE__ */ jsxs5("svg", { ...props, children: [
        /* @__PURE__ */ jsx7("path", { d: "M2 8C4 5 6 11 8 8S12 5 14 8", stroke: color, strokeWidth: "1.5", strokeLinecap: "round", fill: "none" }),
        /* @__PURE__ */ jsx7("path", { d: "M2 11C4 8 6 14 8 11S12 8 14 11", stroke: color, strokeWidth: "1", strokeLinecap: "round", fill: "none", opacity: "0.5" })
      ] });
    // Memory / state — database cylinder
    case "memory":
    case "state":
    case "db":
      return /* @__PURE__ */ jsxs5("svg", { ...props, children: [
        /* @__PURE__ */ jsx7("ellipse", { cx: "8", cy: "4.5", rx: "5", ry: "2", stroke: color, strokeWidth: "1.3" }),
        /* @__PURE__ */ jsx7("line", { x1: "3", y1: "4.5", x2: "3", y2: "11.5", stroke: color, strokeWidth: "1.3" }),
        /* @__PURE__ */ jsx7("line", { x1: "13", y1: "4.5", x2: "13", y2: "11.5", stroke: color, strokeWidth: "1.3" }),
        /* @__PURE__ */ jsx7("ellipse", { cx: "8", cy: "11.5", rx: "5", ry: "2", stroke: color, strokeWidth: "1.3" })
      ] });
    // System prompt — document with lines
    case "system-prompt":
    case "prompt":
    case "instructions":
    case "document":
      return /* @__PURE__ */ jsxs5("svg", { ...props, children: [
        /* @__PURE__ */ jsx7("rect", { x: "3.5", y: "2", width: "9", height: "12", rx: "1.5", stroke: color, strokeWidth: "1.3", fill: "none" }),
        /* @__PURE__ */ jsx7("line", { x1: "5.5", y1: "5", x2: "10.5", y2: "5", stroke: color, strokeWidth: "1", strokeLinecap: "round" }),
        /* @__PURE__ */ jsx7("line", { x1: "5.5", y1: "7.5", x2: "10.5", y2: "7.5", stroke: color, strokeWidth: "1", strokeLinecap: "round" }),
        /* @__PURE__ */ jsx7("line", { x1: "5.5", y1: "10", x2: "8.5", y2: "10", stroke: color, strokeWidth: "1", strokeLinecap: "round" })
      ] });
    // Messages / conversation — chat bubble
    case "messages":
    case "chat":
    case "conversation":
      return /* @__PURE__ */ jsxs5("svg", { ...props, children: [
        /* @__PURE__ */ jsx7("rect", { x: "2.5", y: "3", width: "11", height: "8", rx: "2", stroke: color, strokeWidth: "1.3", fill: "none" }),
        /* @__PURE__ */ jsx7("path", { d: "M5.5 11L5.5 13.5L8.5 11", stroke: color, strokeWidth: "1.3", strokeLinecap: "round", strokeLinejoin: "round", fill: "none" }),
        /* @__PURE__ */ jsx7("line", { x1: "5", y1: "6", x2: "11", y2: "6", stroke: color, strokeWidth: "1", strokeLinecap: "round" }),
        /* @__PURE__ */ jsx7("line", { x1: "5", y1: "8.5", x2: "9", y2: "8.5", stroke: color, strokeWidth: "1", strokeLinecap: "round" })
      ] });
    // Loop — circular arrow
    case "loop":
    case "retry":
      return /* @__PURE__ */ jsxs5("svg", { ...props, children: [
        /* @__PURE__ */ jsx7("path", { d: "M12 8A4 4 0 1 1 8 4", stroke: color, strokeWidth: "1.5", strokeLinecap: "round", fill: "none" }),
        /* @__PURE__ */ jsx7("path", { d: "M8 1.5L10.5 4L8 6.5", stroke: color, strokeWidth: "1.3", strokeLinecap: "round", strokeLinejoin: "round", fill: "none" })
      ] });
    // Lazy / service — cloud (deferred resolution, loaded on demand)
    case "lazy":
    case "service":
    case "cloud":
      return /* @__PURE__ */ jsx7("svg", { ...props, children: /* @__PURE__ */ jsx7(
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
      return /* @__PURE__ */ jsxs5("svg", { ...props, children: [
        /* @__PURE__ */ jsx7("path", { d: "M8 2L14 8L8 14L2 8Z", stroke: color, strokeWidth: "1.5", fill: "none" }),
        /* @__PURE__ */ jsx7("circle", { cx: "8", cy: "8", r: "1.5", fill: color })
      ] });
    default:
      return null;
  }
}
var StageNode = memo(function StageNode2({
  data
}) {
  const { label, active, done, error, linked, icon, stepNumbers, dimmed, isSubflow, isLazy, isDecider, isFork, description, stageId, showStageId, retryAttempts } = data;
  const effectiveIcon = icon || (isLazy ? "lazy" : void 0);
  const isLazyUnresolved = isLazy && !done && !active;
  const injectedRef = useRef3(false);
  useEffect4(() => {
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
  return /* @__PURE__ */ jsxs5(Fragment3, { children: [
    /* @__PURE__ */ jsx7(Handle3, { type: "target", position: Position4.Top, style: { opacity: 0 } }),
    /* @__PURE__ */ jsx7("div", { style: { width: "100%", display: "flex", justifyContent: "center" }, children: /* @__PURE__ */ jsxs5(
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
          stepNumbers && stepNumbers.length > 0 && isOnPath && /* @__PURE__ */ jsx7(
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
                return /* @__PURE__ */ jsx7(
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
          linked && /* @__PURE__ */ jsx7(
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
          active && /* @__PURE__ */ jsx7(
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
          active && /* @__PURE__ */ jsx7(
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
          showRetryBadge && /* @__PURE__ */ jsxs5(
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
                /* @__PURE__ */ jsx7("span", { "aria-hidden": "true", children: "\u21BA" }),
                /* @__PURE__ */ jsxs5("span", { "aria-hidden": "true", children: [
                  "\xD7",
                  retryAttempts
                ] })
              ]
            }
          ),
          isDecider ? /* @__PURE__ */ jsxs5("div", { style: { position: "relative", width: 120, height: 72 }, children: [
            /* @__PURE__ */ jsx7(
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
            /* @__PURE__ */ jsx7(
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
            /* @__PURE__ */ jsxs5(
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
                  /* @__PURE__ */ jsxs5("div", { style: { display: "flex", alignItems: "center", gap: 4 }, children: [
                    effectiveIcon && /* @__PURE__ */ jsx7(StageIcon, { type: effectiveIcon, color: textColor }),
                    !effectiveIcon && /* @__PURE__ */ jsx7("span", { style: { fontSize: 9, color: textColor }, children: "\u25C7" }),
                    /* @__PURE__ */ jsx7(
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
                  description && /* @__PURE__ */ jsx7(
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
                  showStageId && stageId && /* @__PURE__ */ jsx7(
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
            /* @__PURE__ */ jsxs5(
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
                  /* @__PURE__ */ jsxs5("div", { style: { display: "flex", alignItems: "center", gap: 6 }, children: [
                    effectiveIcon && /* @__PURE__ */ jsx7(StageIcon, { type: effectiveIcon, color: textColor }),
                    done && !effectiveIcon && /* @__PURE__ */ jsx7("span", { style: { fontSize: 10, color: textColor }, children: "\u2713" }),
                    active && !effectiveIcon && /* @__PURE__ */ jsx7(
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
                    error && !effectiveIcon && /* @__PURE__ */ jsx7("span", { style: { fontSize: 10, color: textColor }, children: "\u2717" }),
                    /* @__PURE__ */ jsx7(
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
                    isSubflow && /* @__PURE__ */ jsx7(
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
                        children: /* @__PURE__ */ jsx7(
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
                  description && /* @__PURE__ */ jsx7(
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
                  showStageId && stageId && /* @__PURE__ */ jsx7(
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
    /* @__PURE__ */ jsx7(Handle3, { type: "source", position: Position4.Bottom, style: { opacity: 0 } })
  ] });
});

// src/components/TimeTravelDebugger/TimeTravelDebugger.tsx
import { useState as useState6 } from "react";

// src/components/FlowchartView/_internal/devWarn.ts
function isDevModeEnv() {
  const proc = globalThis.process;
  return proc?.env?.NODE_ENV !== "production";
}
function devWarn(messageFn, ...extras) {
  if (!isDevModeEnv()) return;
  console.warn(messageFn(), ...extras);
}

// src/_internal/deprecate.ts
var announced = /* @__PURE__ */ new Set();
function warnDeprecated(what, useInstead) {
  if (announced.has(what)) return;
  announced.add(what);
  devWarn(
    () => `[footprint-explainable-ui] ${what} is deprecated and will be removed in the next major. ${useInstead}`
  );
}

// src/components/MemoryInspector/MemoryInspector.tsx
import { useMemo as useMemo2 } from "react";
import { jsx as jsx8, jsxs as jsxs6 } from "react/jsx-runtime";
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
    return /* @__PURE__ */ jsxs6("div", { className, style, "data-fp": "memory-inspector", role: "region", "aria-label": "Memory state", children: [
      /* @__PURE__ */ jsx8("div", { "data-fp": "memory-label", children: "Memory State" }),
      /* @__PURE__ */ jsx8("pre", { "data-fp": "memory-json", children: /* @__PURE__ */ jsx8("code", { children: JSON.stringify(memory, null, 2) }) })
    ] });
  }
  return /* @__PURE__ */ jsxs6(
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
            children: "Memory State"
          }
        ),
        /* @__PURE__ */ jsxs6(
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
              /* @__PURE__ */ jsx8("span", { style: { color: theme.textMuted }, children: "{" }),
              entries.length === 0 && /* @__PURE__ */ jsx8(
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
                return /* @__PURE__ */ jsxs6(
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
                      /* @__PURE__ */ jsxs6("span", { style: { color: theme.primary }, children: [
                        '"',
                        key,
                        '"'
                      ] }),
                      /* @__PURE__ */ jsx8("span", { style: { color: theme.textMuted }, children: ": " }),
                      /* @__PURE__ */ jsx8("span", { style: { color: theme.success }, children: formatValue(value) }),
                      showTypes && /* @__PURE__ */ jsxs6(
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
                      !isLast && /* @__PURE__ */ jsx8("span", { style: { color: theme.textMuted }, children: "," })
                    ]
                  },
                  key
                );
              }),
              /* @__PURE__ */ jsx8("span", { style: { color: theme.textMuted }, children: "}" })
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
import { jsx as jsx9, jsxs as jsxs7 } from "react/jsx-runtime";
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
    return /* @__PURE__ */ jsx9("div", { className, style, "data-fp": "narrative-log", children: entries.map((entry, i) => /* @__PURE__ */ jsxs7("div", { "data-fp": "narrative-entry", "data-current": entry.isCurrent, children: [
      /* @__PURE__ */ jsx9("strong", { children: entry.label }),
      /* @__PURE__ */ jsx9("p", { children: entry.text })
    ] }, i)) });
  }
  return /* @__PURE__ */ jsxs7(
    "div",
    {
      className,
      style: { padding: pad, fontFamily: theme.fontSans, ...style },
      "data-fp": "narrative-log",
      children: [
        /* @__PURE__ */ jsx9(
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
        /* @__PURE__ */ jsx9("div", { style: { marginTop: 8, display: "flex", flexDirection: "column" }, children: entries.map((entry, i) => /* @__PURE__ */ jsxs7(
          "div",
          {
            style: {
              display: "flex",
              gap: 10,
              padding: `${pad}px 0`,
              borderBottom: i < entries.length - 1 ? `1px solid ${theme.border}` : "none"
            },
            children: [
              /* @__PURE__ */ jsxs7(
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
                    /* @__PURE__ */ jsx9(
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
                    i < entries.length - 1 && /* @__PURE__ */ jsx9(
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
              /* @__PURE__ */ jsxs7("div", { style: { flex: 1, minWidth: 0 }, children: [
                /* @__PURE__ */ jsx9(
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
                /* @__PURE__ */ jsx9(
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

// src/components/GanttTimeline/GanttTimeline.tsx
import { useState as useState3, useMemo as useMemo4, useRef as useRef4, useEffect as useEffect5 } from "react";
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
  const [expanded, setExpanded] = useState3(false);
  const activeRowRef = useRef4(null);
  const scrollContainerRef = useRef4(null);
  const totalWallTime = useMemo4(
    () => Math.max(...snapshots.map((s) => s.startMs + s.durationMs), 1),
    [snapshots]
  );
  const untimed = useMemo4(
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
  useEffect5(() => {
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

// src/components/FlowchartView/TraceFlow.tsx
import { useMemo as useMemo5, useCallback, useRef as useRef5, useSyncExternalStore } from "react";
import {
  ReactFlow as ReactFlow2,
  Background as Background2,
  BackgroundVariant,
  MarkerType as MarkerType2
} from "@xyflow/react";

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
var DEFAULT_NODE_W = 200;
var DEFAULT_NODE_H = 80;
function footprintOf(node, fallbackW, fallbackH) {
  const style = node.style ?? {};
  const w = typeof style.width === "number" ? style.width : fallbackW;
  const h = typeof style.height === "number" ? style.height : fallbackH;
  return { width: w, height: h };
}
function applyGroupLayout(graph, opts) {
  const padding2 = opts.padding ?? DEFAULT_PADDING;
  const headerHeight = opts.headerHeight ?? DEFAULT_HEADER;
  const nodeW = opts.nodeWidth ?? DEFAULT_NODE_W;
  const nodeH = opts.nodeHeight ?? DEFAULT_NODE_H;
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
function createGroupedLayout(opts) {
  return (graph) => applyGroupLayout(graph, opts);
}
var MAIN_CHART_BOX_ID = "__main_chart__";
function wrapInMainChartBox(graph, opts) {
  if (graph.nodes.length === 0) return graph;
  const padding2 = opts.padding ?? DEFAULT_PADDING;
  const headerHeight = opts.headerHeight ?? DEFAULT_HEADER;
  const nodeW = opts.nodeWidth ?? DEFAULT_NODE_W;
  const nodeH = opts.nodeHeight ?? DEFAULT_NODE_H;
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
function createMainChartBoxLayout(opts) {
  return (graph) => wrapInMainChartBox(graph, opts);
}

// src/components/LoopBackEdge/LoopBackEdge.tsx
import { jsx as jsx11 } from "react/jsx-runtime";
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
  return /* @__PURE__ */ jsx11(
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
import { BaseEdge as BaseEdge3, getSmoothStepPath, useStore as useStore2 } from "@xyflow/react";
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
import { jsx as jsx12 } from "react/jsx-runtime";
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
  const [path] = getSmoothStepPath({
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
  return /* @__PURE__ */ jsx12(BaseEdge3, { id, path, markerEnd, style });
}

// src/components/FlowchartView/_internal/dagreTraceLayout.ts
import dagre2 from "dagre";
var DEFAULT_NODE_W2 = 200;
var DEFAULT_NODE_H2 = 80;
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
  const fallbackW = options.nodeWidth ?? DEFAULT_NODE_W2;
  const fallbackH = options.nodeHeight ?? DEFAULT_NODE_H2;
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

// src/components/FlowchartView/TraceFlow.tsx
import { jsx as jsx13, jsxs as jsxs9 } from "react/jsx-runtime";
var Y_STEP = 100;
var X_SPREAD = 200;
var defaultTraceFlowLayout = (graph) => {
  if (graph.nodes.length === 0) return { nodes: [], edges: graph.edges };
  const branchChildrenOf = /* @__PURE__ */ new Map();
  const nextChildrenOf = /* @__PURE__ */ new Map();
  const hasIncomingForward = /* @__PURE__ */ new Set();
  for (const e of graph.edges) {
    const kind = e.data?.kind;
    if (kind === "loop") continue;
    hasIncomingForward.add(e.target);
    if (kind === "fork-branch" || kind === "decision-branch") {
      const arr = branchChildrenOf.get(e.source) ?? [];
      arr.push(e.target);
      branchChildrenOf.set(e.source, arr);
    } else {
      const arr = nextChildrenOf.get(e.source) ?? [];
      arr.push(e.target);
      nextChildrenOf.set(e.source, arr);
    }
  }
  const seed = graph.nodes.find((n) => !hasIncomingForward.has(n.id)) ?? graph.nodes[0];
  const positions = /* @__PURE__ */ new Map();
  function layoutSubtree(nodeId, x, y) {
    if (positions.has(nodeId)) {
      return positions.get(nodeId).y;
    }
    positions.set(nodeId, { x, y });
    let deepestBranchY = y;
    const branches = branchChildrenOf.get(nodeId) ?? [];
    if (branches.length > 0) {
      const childY = y + Y_STEP;
      const totalWidth = (branches.length - 1) * X_SPREAD;
      const startX = x - totalWidth / 2;
      for (let i = 0; i < branches.length; i++) {
        const childId = branches[i];
        const childX = startX + i * X_SPREAD;
        const subtreeBottom = layoutSubtree(childId, childX, childY);
        if (subtreeBottom > deepestBranchY) deepestBranchY = subtreeBottom;
      }
    }
    const nextChildren = nextChildrenOf.get(nodeId) ?? [];
    if (nextChildren.length > 0) {
      const nextY = branches.length > 0 ? deepestBranchY + Y_STEP : y + Y_STEP;
      const totalWidth = (nextChildren.length - 1) * X_SPREAD;
      const startX = x - totalWidth / 2;
      let deepestNextY = nextY;
      for (let i = 0; i < nextChildren.length; i++) {
        const childId = nextChildren[i];
        const childX = startX + i * X_SPREAD;
        const subtreeBottom = layoutSubtree(childId, childX, nextY);
        if (subtreeBottom > deepestNextY) deepestNextY = subtreeBottom;
      }
      return deepestNextY;
    }
    return deepestBranchY;
  }
  layoutSubtree(seed.id, 0, 0);
  let maxY = 0;
  for (const p of positions.values()) {
    if (p.y > maxY) maxY = p.y;
  }
  let orphanY = maxY + Y_STEP;
  for (const n of graph.nodes) {
    if (!positions.has(n.id)) {
      positions.set(n.id, { x: 0, y: orphanY });
      orphanY += Y_STEP;
    }
  }
  return {
    nodes: graph.nodes.map((n) => ({
      ...n,
      position: positions.get(n.id) ?? n.position
    })),
    edges: graph.edges
  };
};
var DEFAULT_EDGE_COLORS = {
  next: rawDefaults.colors.textMuted,
  forkBranch: rawDefaults.colors.textMuted,
  decisionBranch: rawDefaults.colors.primary,
  loop: rawDefaults.colors.warning
};
function styleEdge(edge, colors) {
  const kind = edge.data?.kind ?? "next";
  const color = kind === "loop" ? colors.loop : kind === "fork-branch" ? colors.forkBranch : kind === "decision-branch" ? colors.decisionBranch : colors.next;
  const styled = {
    ...edge,
    // Loop back-edges use the custom `loopBack` edge — a curve routed along the
    // right margin (clear of the spine) instead of a straight/step center line.
    // Every other edge uses `smartStep`: a smoothstep superset that routes a
    // RANK-SKIPPING edge around the node it skips (else identical to smoothstep).
    type: kind === "loop" ? "loopBack" : "smartStep",
    animated: false,
    style: { stroke: color, strokeWidth: 1.5 },
    markerEnd: { type: MarkerType2.ArrowClosed, color, width: 16, height: 16 }
  };
  if (kind === "loop") {
    styled.style = { ...styled.style, strokeDasharray: "4 3" };
  }
  return styled;
}
var DEFAULT_NODE_TYPES = { stageNode: StageNode };
var DEFAULT_EDGE_TYPES = { loopBack: LoopBackEdge, smartStep: SmartStepEdge };
function toStageNode(node) {
  if (node.type !== void 0 && node.type !== "stage") {
    return node;
  }
  const data = node.data;
  const stageData = {
    // Pass the source data through WHOLE. An allow-list here dropped every
    // field it did not name: the consumer's OWN custom fields (which the
    // `nodeTypes` extension contract promises a swapped-in renderer can read
    // off `data`) and the recorder's own metadata the bundled renderer
    // happens not to use — isStreaming, isPausable, branchIds, defaultBranch,
    // prevIds, nextIds, subflowOf. A renderer cannot read what never arrived.
    ...data,
    // Then the fields this function OWNS. Run status is blank here by design
    // — `<TraceFlow>` is the structure-only chart; `<TracedFlow>` is the one
    // that paints an overlay — so these must win over anything the source
    // data carried.
    label: data.label,
    isDecider: data.isDecider,
    isFork: data.isFork,
    isSubflow: data.isSubflow,
    active: false,
    done: false,
    error: false
  };
  return {
    ...node,
    type: "stageNode",
    data: stageData
  };
}
var EMPTY_GRAPH = { nodes: [], edges: [] };
function subscribeToRecorder(recorder) {
  return (listener) => {
    if (!recorder) return () => {
    };
    return recorder.subscribe(listener);
  };
}
function getRecorderVersion(recorder) {
  return () => {
    if (!recorder) return 0;
    return recorder.version();
  };
}
function TraceFlow(props) {
  const proc = globalThis.process;
  const isDev = proc?.env?.NODE_ENV !== "production";
  if (isDev && !props.recorder && !props.graph) {
    console.warn(
      "[TraceFlow] neither `recorder` nor `graph` prop was provided \u2014 rendering an empty chart. Pass one of: <TraceFlow recorder={handle} /> OR <TraceFlow graph={{nodes, edges}} />."
    );
  }
  const layout = props.layout ?? dagreTraceLayout;
  const edgeColors = useMemo5(
    () => ({ ...DEFAULT_EDGE_COLORS, ...props.edgeColors ?? {} }),
    [props.edgeColors]
  );
  const subscribe = useMemo5(
    () => subscribeToRecorder(props.recorder),
    [props.recorder]
  );
  const getVersion = useMemo5(
    () => getRecorderVersion(props.recorder),
    [props.recorder]
  );
  const version = useSyncExternalStore(subscribe, getVersion, getVersion);
  const { recorder, graph: graphProp } = props;
  const graph = useMemo5(() => {
    if (recorder) return recorder.getGraph();
    if (graphProp) return graphProp;
    return EMPTY_GRAPH;
  }, [recorder, graphProp, version]);
  const positioned = useMemo5(() => {
    if (layout === "passthrough") return graph;
    return layout(graph);
  }, [graph, layout]);
  const reactFlowNodes = useMemo5(
    () => positioned.nodes.map(toStageNode),
    [positioned.nodes]
  );
  const reactFlowEdges = useMemo5(
    () => positioned.edges.map((e) => styleEdge(e, edgeColors)),
    [positioned.edges, edgeColors]
  );
  const onNodeClickRef = props.onNodeClick;
  const handleNodeClick = useCallback(
    (_, node) => {
      onNodeClickRef?.(node.id);
    },
    [onNodeClickRef]
  );
  const { nodeTypes: userNodeTypes, edgeTypes: userEdgeTypes } = props;
  const mergedNodeTypes = useMemo5(
    () => userNodeTypes ? { ...DEFAULT_NODE_TYPES, ...userNodeTypes } : DEFAULT_NODE_TYPES,
    [userNodeTypes]
  );
  const mergedEdgeTypes = useMemo5(
    () => userEdgeTypes ? { ...DEFAULT_EDGE_TYPES, ...userEdgeTypes } : DEFAULT_EDGE_TYPES,
    [userEdgeTypes]
  );
  const wrapperRef = useRef5(null);
  const refitKey = chartLayoutKey(positioned.nodes);
  return /* @__PURE__ */ jsx13(
    "div",
    {
      ref: wrapperRef,
      className: props.className,
      style: {
        width: "100%",
        height: "100%",
        minHeight: 300,
        ...props.style
      },
      children: /* @__PURE__ */ jsxs9(
        ReactFlow2,
        {
          nodes: reactFlowNodes,
          edges: reactFlowEdges,
          nodeTypes: mergedNodeTypes,
          edgeTypes: mergedEdgeTypes,
          onNodeClick: handleNodeClick,
          proOptions: { hideAttribution: true },
          children: [
            /* @__PURE__ */ jsx13(ChartAutoRefit, { wrapperRef, refitKey }),
            /* @__PURE__ */ jsx13(Background2, { variant: BackgroundVariant.Dots, gap: 20, size: 1 }),
            props.children
          ]
        }
      )
    }
  );
}

// src/components/FlowchartView/TracedFlow.tsx
import { useCallback as useCallback3, useEffect as useEffect8, useMemo as useMemo6, useRef as useRef7, useState as useState5 } from "react";
import {
  ReactFlow as ReactFlow3,
  Background as Background3,
  BackgroundVariant as BackgroundVariant2,
  MarkerType as MarkerType3
} from "@xyflow/react";

// src/components/FlowchartView/_internal/snapLinearSuccessors.ts
function snapLinearSuccessors(graph, options = {}) {
  if (graph.nodes.length === 0) return graph;
  const fallbackW = options.nodeWidth ?? DEFAULT_NODE_W2;
  const fallbackH = options.nodeHeight ?? DEFAULT_NODE_H2;
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
  const fallbackW = options.nodeWidth ?? DEFAULT_NODE_W2;
  const fallbackH = options.nodeHeight ?? DEFAULT_NODE_H2;
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
function createTraceRuntimeOverlay(options = {}) {
  const id = options.id ?? "trace-runtime-overlay";
  const startTime = performance.now();
  let executionOrder = [];
  const recordedRuntimeStageIds = /* @__PURE__ */ new Set();
  const errors = /* @__PURE__ */ new Map();
  const retryAttempts = /* @__PURE__ */ new Map();
  let running = false;
  const notifier = createNotifier("traceRuntimeOverlay");
  const notifyChange = notifier.notify;
  function pushStep(runtimeStageId, stageId, stageName) {
    if (recordedRuntimeStageIds.has(runtimeStageId)) return;
    recordedRuntimeStageIds.add(runtimeStageId);
    executionOrder.push({
      runtimeStageId,
      stageId,
      stageName,
      timestampMs: performance.now() - startTime
    });
    notifyChange();
  }
  const recorder = {
    id,
    onRunStart() {
      running = true;
      notifyChange();
    },
    onRunEnd() {
      running = false;
      notifyChange();
    },
    onStageExecuted(event) {
      const runtimeStageId = event.traversalContext.runtimeStageId;
      const baseStageId = parseStageIdFromRuntimeStageId(runtimeStageId);
      pushStep(runtimeStageId, baseStageId, event.stageName);
    },
    onStageRetry(event) {
      const runtimeStageId = event.traversalContext?.runtimeStageId;
      if (!runtimeStageId) return;
      const attempt = event.attempt;
      const attemptsMade = typeof attempt === "number" && Number.isFinite(attempt) && attempt >= 1 ? Math.floor(attempt) + 1 : (retryAttempts.get(runtimeStageId) ?? 1) + 1;
      const known = retryAttempts.get(runtimeStageId) ?? 1;
      if (attemptsMade > known) {
        retryAttempts.set(runtimeStageId, attemptsMade);
        notifyChange();
      }
    },
    onError(event) {
      const fallbackId = event.stageId ?? (event.traversalContext ? parseStageIdFromRuntimeStageId(event.traversalContext.runtimeStageId) : event.stageName);
      errors.set(fallbackId, event.message ?? "error");
      notifyChange();
    }
  };
  return {
    recorder,
    getOverlay() {
      return {
        executionOrder: executionOrder.map((s) => ({ ...s })),
        errors: new Map(errors),
        running,
        retryAttempts: new Map(retryAttempts)
      };
    },
    subscribe: notifier.subscribe,
    version: notifier.version,
    reset() {
      executionOrder = [];
      recordedRuntimeStageIds.clear();
      errors.clear();
      retryAttempts.clear();
      running = false;
    },
    seed(overlay) {
      executionOrder = overlay.executionOrder.map((s) => ({ ...s }));
      recordedRuntimeStageIds.clear();
      for (const step of executionOrder) recordedRuntimeStageIds.add(step.runtimeStageId);
      errors.clear();
      for (const [stageId, message] of overlay.errors) errors.set(stageId, message);
      retryAttempts.clear();
      if (overlay.retryAttempts) {
        for (const [rsid, attempts] of overlay.retryAttempts) retryAttempts.set(rsid, attempts);
      }
      running = overlay.running;
      notifyChange();
    }
  };
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
import { useCallback as useCallback2, useEffect as useEffect6, useRef as useRef6, useState as useState4 } from "react";
function useSubflowDrill(graph, onSubflowChange, controlledSubflowId) {
  const isControlled = controlledSubflowId !== void 0;
  const [ownSubflowId, setOwnSubflowId] = useState4(null);
  const currentSubflowId = isControlled ? controlledSubflowId : ownSubflowId;
  const lastGraphRef = useRef6(null);
  if (!isControlled && lastGraphRef.current !== graph) {
    lastGraphRef.current = graph;
    if (ownSubflowId !== null && findMountNode(graph, ownSubflowId) === void 0) {
      queueMicrotask(() => setOwnSubflowId(null));
    }
  }
  const lastNotifiedRef = useRef6(void 0);
  useEffect6(() => {
    if (isControlled) return;
    if (lastNotifiedRef.current === currentSubflowId) return;
    lastNotifiedRef.current = currentSubflowId;
    onSubflowChange?.(currentSubflowId);
  }, [isControlled, currentSubflowId, onSubflowChange]);
  const setCurrentSubflowId = useCallback2(
    (id) => {
      if (isControlled) onSubflowChange?.(id);
      else setOwnSubflowId(id);
    },
    [isControlled, onSubflowChange]
  );
  const drillInto = useCallback2(
    (mountNodeId) => setCurrentSubflowId(mountNodeId),
    [setCurrentSubflowId]
  );
  const drillUp = useCallback2(() => setCurrentSubflowId(null), [setCurrentSubflowId]);
  return { currentSubflowId, drillInto, drillUp, setCurrentSubflowId };
}

// src/components/FlowchartView/SubflowBreadcrumbBar.tsx
import { jsx as jsx14, jsxs as jsxs10 } from "react/jsx-runtime";
function SubflowBreadcrumbBar({ entries, onNavigate }) {
  return /* @__PURE__ */ jsx14(
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
        return /* @__PURE__ */ jsxs10(
          "span",
          {
            style: { display: "inline-flex", alignItems: "center", gap: 6 },
            children: [
              /* @__PURE__ */ jsx14(
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
              !isLast && /* @__PURE__ */ jsx14("span", { style: { color: theme.textMuted }, children: "\u203A" })
            ]
          },
          entry.subflowId ?? "__top__"
        );
      })
    }
  );
}

// src/components/FlowchartView/_internal/MeasuredNodeSizes.tsx
import { useEffect as useEffect7 } from "react";
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
  useEffect7(() => {
    if (!initialized || sizes.size === 0) return;
    onSizes(sizes);
  }, [initialized, sizes, onSizes]);
  return null;
}

// src/components/FlowchartView/TracedFlow.tsx
import { jsx as jsx15, jsxs as jsxs11 } from "react/jsx-runtime";
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
    markerEnd: { type: MarkerType3.ArrowClosed, color, width: 16, height: 16 }
  };
  if (kind === "loop") {
    styled.style = { ...styled.style, strokeDasharray: "4 3" };
  }
  return styled;
}
var DEFAULT_NODE_TYPES2 = {
  stageNode: StageNode,
  groupContainer: GroupContainerNode
};
var DEFAULT_EDGE_TYPES2 = { loopBack: LoopBackEdge, smartStep: SmartStepEdge };
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
  useEffect8(() => {
    if (layoutProp === dagreTraceLayout) {
      devWarn(
        () => "[footprint-explainable-ui] <TracedFlow layout={dagreTraceLayout}> bypasses the built-in measure-then-layout pipeline (content-exact sizing, fork/merge centering, straight spines). OMIT the `layout` prop to use it \u2014 passing the raw dagreTraceLayout silently forfeits every layout improvement eui ships."
      );
    }
  }, [layoutProp]);
  const colors = useMemo6(
    () => ({ ...DEFAULT_COLORS, ...colorOverrides ?? {} }),
    [colorOverrides]
  );
  const mergedNodeTypes = useMemo6(
    () => userNodeTypes ? { ...DEFAULT_NODE_TYPES2, ...userNodeTypes } : DEFAULT_NODE_TYPES2,
    [userNodeTypes]
  );
  const mergedEdgeTypes = useMemo6(
    () => userEdgeTypes ? { ...DEFAULT_EDGE_TYPES2, ...userEdgeTypes } : DEFAULT_EDGE_TYPES2,
    [userEdgeTypes]
  );
  const effectiveGraph = useMemo6(
    () => collapseNode ? collapseTraceGraph(graph, collapseNode).graph : graph,
    [graph, collapseNode]
  );
  const drill = useSubflowDrill(effectiveGraph, onSubflowChange, controlledSubflowId);
  const groupedSet = useMemo6(() => new Set(groupedSubflows ?? []), [groupedSubflows]);
  const filteredGraph = useMemo6(() => {
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
  const breadcrumb = useMemo6(
    () => buildSubflowBreadcrumb(effectiveGraph, drill.currentSubflowId),
    [effectiveGraph, drill.currentSubflowId]
  );
  const [measuredSizes, setMeasuredSizes] = useState5(null);
  const positioned = useMemo6(() => {
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
  const slice = useMemo6(() => {
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
  const reactFlowNodes = useMemo6(
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
  const cursorStandIns = useMemo6(() => cursorStandInIds(slice.activeStageId), [slice.activeStageId]);
  const reactFlowEdges = useMemo6(
    () => positioned.edges.map(
      (e) => styleEdgeWithOverlay(e, slice.doneStageIds, slice.activeStageId, colors, cursorStandIns)
    ),
    [positioned.edges, slice, colors, cursorStandIns]
  );
  const [coneRevealed, setConeRevealed] = useState5(false);
  useEffect8(() => {
    if (!sliceCone) return;
    setConeRevealed(false);
    const raf = requestAnimationFrame(() => setConeRevealed(true));
    return () => cancelAnimationFrame(raf);
  }, [sliceCone]);
  const conedNodes = useMemo6(() => {
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
  const conedEdges = useMemo6(() => {
    if (!sliceCone || sliceCone.size === 0) return reactFlowEdges;
    return reactFlowEdges.map((e) => {
      const inCone = sliceCone.has(e.source) && sliceCone.has(e.target);
      return inCone ? e : { ...e, style: { ...e.style, opacity: 0.12, transition: "opacity 260ms ease" } };
    });
  }, [reactFlowEdges, sliceCone]);
  const handleNodeClick = useCallback3(
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
  const wrapperRef = useRef7(null);
  const layoutKey = chartLayoutKey(positioned.nodes);
  const refitKey = JSON.stringify([
    chartLayoutKey(filteredGraph.nodes),
    chartTopologyKey(positioned.nodes),
    // A custom layout is an authored layout. Default measured-layout settling
    // must not take camera ownership back after a manual pan/zoom.
    layoutProp !== void 0 ? layoutKey : null
  ]);
  return /* @__PURE__ */ jsxs11(
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
        breadcrumb.length > 1 && /* @__PURE__ */ jsx15(
          SubflowBreadcrumbBar,
          {
            entries: breadcrumb,
            onNavigate: drill.setCurrentSubflowId
          }
        ),
        /* @__PURE__ */ jsx15("div", { style: { flex: 1, minHeight: 0 }, children: /* @__PURE__ */ jsxs11(
          ReactFlow3,
          {
            nodes: conedNodes,
            edges: conedEdges,
            nodeTypes: mergedNodeTypes,
            edgeTypes: mergedEdgeTypes,
            onNodeClick: handleNodeClick,
            minZoom: 0.1,
            proOptions: { hideAttribution: true },
            children: [
              /* @__PURE__ */ jsx15(ChartAutoRefit, { wrapperRef, refitKey, layoutKey, padding: 0.18 }),
              /* @__PURE__ */ jsx15(MeasuredNodeSizes, { onSizes: setMeasuredSizes }),
              /* @__PURE__ */ jsx15(Background3, { variant: BackgroundVariant2.Dots, gap: 20, size: 1 }),
              children
            ]
          }
        ) })
      ]
    }
  );
}

// src/components/TimeTravelDebugger/TimeTravelDebugger.tsx
import { jsx as jsx16, jsxs as jsxs12 } from "react/jsx-runtime";
function TimeTravelDebugger({
  snapshots,
  graph,
  runtimeOverlay,
  showGantt = true,
  layout = "horizontal",
  title = "Time-Travel Debugger",
  size = "default",
  unstyled = false,
  className,
  style
}) {
  warnDeprecated(
    "TimeTravelDebugger",
    "Use <SnapshotPanel> (same panels, controlled cursor), <ExplainableShell> (those plus the chart and drill-down), or the footprint-viewer package."
  );
  const [selectedIndex, setSelectedIndex] = useState6(0);
  const fs = fontSize[size];
  const pad = padding[size];
  if (snapshots.length === 0) {
    return /* @__PURE__ */ jsx16(
      "div",
      {
        className,
        style: {
          padding: pad * 2,
          textAlign: "center",
          color: theme.textMuted,
          ...style
        },
        children: "No snapshots to debug"
      }
    );
  }
  const isHorizontal = layout === "horizontal";
  const handleNodeClick = (stageId) => {
    const idx = snapshots.findIndex(
      (s) => s.stageName === stageId || s.stageLabel === stageId
    );
    if (idx >= 0) setSelectedIndex(idx);
  };
  const chart = runtimeOverlay ? /* @__PURE__ */ jsx16(
    TracedFlow,
    {
      graph,
      overlay: runtimeOverlay,
      scrubIndex: selectedIndex,
      onNodeClick: handleNodeClick
    }
  ) : /* @__PURE__ */ jsx16(TraceFlow, { graph, onNodeClick: handleNodeClick });
  if (unstyled) {
    return /* @__PURE__ */ jsxs12("div", { className, style, "data-fp": "time-travel-debugger", children: [
      /* @__PURE__ */ jsx16("h3", { children: title }),
      /* @__PURE__ */ jsx16(
        "input",
        {
          type: "range",
          min: 0,
          max: snapshots.length - 1,
          value: selectedIndex,
          onChange: (e) => setSelectedIndex(parseInt(e.target.value))
        }
      ),
      chart,
      /* @__PURE__ */ jsx16(
        MemoryInspector,
        {
          snapshots,
          selectedIndex,
          unstyled: true
        }
      ),
      /* @__PURE__ */ jsx16(
        NarrativeLog,
        {
          snapshots,
          selectedIndex,
          unstyled: true
        }
      ),
      showGantt && /* @__PURE__ */ jsx16(
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
  return /* @__PURE__ */ jsxs12(
    "div",
    {
      className,
      style: {
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: theme.bgPrimary,
        fontFamily: theme.fontSans,
        overflow: "hidden",
        ...style
      },
      "data-fp": "time-travel-debugger",
      children: [
        /* @__PURE__ */ jsxs12(
          "div",
          {
            style: {
              padding: `${pad}px ${pad + 4}px`,
              borderBottom: `1px solid ${theme.border}`,
              background: theme.bgSecondary,
              flexShrink: 0
            },
            children: [
              /* @__PURE__ */ jsxs12(
                "div",
                {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 8
                  },
                  children: [
                    /* @__PURE__ */ jsx16(
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
                    /* @__PURE__ */ jsx16(
                      "span",
                      {
                        style: {
                          fontSize: fs.small,
                          color: theme.textMuted
                        },
                        children: "Scrub to replay execution"
                      }
                    )
                  ]
                }
              ),
              /* @__PURE__ */ jsxs12("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
                /* @__PURE__ */ jsx16(
                  ScrubButton,
                  {
                    label: "\u25C0",
                    disabled: selectedIndex === 0,
                    onClick: () => setSelectedIndex((i) => Math.max(0, i - 1))
                  }
                ),
                /* @__PURE__ */ jsx16(
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
                /* @__PURE__ */ jsx16(
                  ScrubButton,
                  {
                    label: "\u25B6",
                    disabled: selectedIndex === snapshots.length - 1,
                    onClick: () => setSelectedIndex((i) => Math.min(snapshots.length - 1, i + 1))
                  }
                ),
                /* @__PURE__ */ jsxs12(
                  "span",
                  {
                    style: {
                      fontSize: fs.small,
                      color: theme.textMuted,
                      flexShrink: 0,
                      fontFamily: theme.fontMono
                    },
                    children: [
                      selectedIndex + 1,
                      "/",
                      snapshots.length
                    ]
                  }
                )
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsxs12(
          "div",
          {
            style: {
              flex: 1,
              display: "flex",
              flexDirection: isHorizontal ? "row" : "column",
              overflow: "hidden"
            },
            children: [
              /* @__PURE__ */ jsx16(
                "div",
                {
                  style: {
                    flex: 1,
                    overflow: "hidden",
                    borderRight: isHorizontal ? `1px solid ${theme.border}` : "none",
                    borderBottom: !isHorizontal ? `1px solid ${theme.border}` : "none"
                  },
                  children: chart
                }
              ),
              /* @__PURE__ */ jsxs12("div", { style: { flex: 1, overflow: "auto" }, children: [
                /* @__PURE__ */ jsx16(
                  MemoryInspector,
                  {
                    snapshots,
                    selectedIndex,
                    size
                  }
                ),
                /* @__PURE__ */ jsx16(
                  "div",
                  {
                    style: {
                      height: 1,
                      background: theme.border,
                      margin: `0 ${pad}px`
                    }
                  }
                ),
                /* @__PURE__ */ jsx16(
                  NarrativeLog,
                  {
                    snapshots,
                    selectedIndex,
                    size
                  }
                )
              ] })
            ]
          }
        ),
        showGantt && /* @__PURE__ */ jsx16(
          "div",
          {
            style: {
              borderTop: `1px solid ${theme.border}`,
              background: theme.bgSecondary,
              flexShrink: 0
            },
            children: /* @__PURE__ */ jsx16(
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
  label,
  disabled,
  onClick
}) {
  return /* @__PURE__ */ jsx16(
    "button",
    {
      onClick,
      disabled,
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
        flexShrink: 0
      },
      children: label
    }
  );
}

// src/components/FlowchartView/SubflowBreadcrumb.tsx
import { memo as memo2 } from "react";
import { jsx as jsx17, jsxs as jsxs13 } from "react/jsx-runtime";
var SubflowBreadcrumb = memo2(function SubflowBreadcrumb2({
  breadcrumbs,
  onNavigate
}) {
  warnDeprecated(
    "SubflowBreadcrumb",
    "It renders the legacy useSubflowNavigation stack. Use <TracedFlow> (which draws its own trail), or buildSubflowBreadcrumb(graph, mountNodeId)."
  );
  if (breadcrumbs.length <= 1) return null;
  return /* @__PURE__ */ jsx17(
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
        return /* @__PURE__ */ jsxs13("span", { style: { display: "flex", alignItems: "center", gap: 4 }, children: [
          i > 0 && /* @__PURE__ */ jsx17("span", { style: { color: theme.textMuted, fontSize: 10 }, children: "\u203A" }),
          isLast ? /* @__PURE__ */ jsxs13("span", { style: { display: "flex", alignItems: "center", gap: 6 }, children: [
            /* @__PURE__ */ jsx17(
              "span",
              {
                style: {
                  color: theme.primary,
                  fontWeight: 600
                },
                children: crumb.label
              }
            ),
            crumb.description && /* @__PURE__ */ jsxs13(
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
          ] }) : /* @__PURE__ */ jsx17(
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

// src/components/FlowchartView/useSubflowNavigation.ts
import { useState as useState7, useCallback as useCallback4, useMemo as useMemo7 } from "react";
var EMPTY_GRAPH2 = { nodes: [], edges: [] };
function useSubflowNavigation(rootGraph) {
  warnDeprecated(
    "useSubflowNavigation",
    "It keys the drill by the child chart's LOCAL subflowId, which is not unique across two mounts of the same chart. Use <TracedFlow>'s built-in drill (currentSubflowId + onSubflowChange), or filterGraphForDrill + buildSubflowBreadcrumb with the MOUNT NODE'S id."
  );
  const [stack, setStack] = useState7([]);
  const safeRootGraph = rootGraph ?? EMPTY_GRAPH2;
  const subflowMounts = useMemo7(() => {
    const map = /* @__PURE__ */ new Map();
    for (const node of safeRootGraph.nodes) {
      if (!node.data?.isSubflow) continue;
      const subflowId = typeof node.data.subflowId === "string" ? node.data.subflowId : node.id;
      const label = typeof node.data.label === "string" ? node.data.label : node.id;
      const entry = {
        subflowId,
        label
      };
      if (typeof node.data.description === "string") {
        entry.description = node.data.description;
      }
      map.set(node.id, entry);
      map.set(subflowId, entry);
    }
    return map;
  }, [safeRootGraph]);
  const breadcrumbs = useMemo7(() => {
    const rootLabel = "Flowchart";
    const root = { label: rootLabel };
    return [root, ...stack];
  }, [stack]);
  const handleNodeClick = useCallback4(
    (nodeId) => {
      const mount = subflowMounts.get(nodeId);
      if (!mount) return false;
      setStack((prev) => {
        const entry = {
          label: mount.label,
          subflowId: mount.subflowId
        };
        if (mount.description !== void 0) entry.description = mount.description;
        return [...prev, entry];
      });
      return true;
    },
    [subflowMounts]
  );
  const navigateTo = useCallback4((level) => {
    if (level === 0) {
      setStack([]);
    } else {
      setStack((prev) => prev.slice(0, level));
    }
  }, []);
  const top = stack[stack.length - 1];
  return {
    breadcrumbs,
    // TODO(recorder-driven-nesting): swap to per-subflow graph when
    // child charts attach their own recorders.
    currentGraph: safeRootGraph,
    currentSubflowId: top?.subflowId ?? null,
    currentSubflowNodeName: top?.label ?? null,
    handleNodeClick,
    navigateTo,
    isInSubflow: stack.length > 0
  };
}

// src/components/FlowchartView/SubflowTree.tsx
import { memo as memo3, useState as useState8, useCallback as useCallback5, useMemo as useMemo8 } from "react";
import { Fragment as Fragment4, jsx as jsx18, jsxs as jsxs14 } from "react/jsx-runtime";
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
  const [expanded, setExpanded] = useState8(true);
  const hasChildren = entry.children && entry.children.length > 0;
  const isActive = activeStage === entry.name;
  const isDone = doneStages?.has(entry.name);
  const handleClick = useCallback5(() => {
    if (hasChildren) {
      setExpanded((prev) => !prev);
    }
    onNodeSelect?.(entry.name, !!entry.isSubflow, entry.nodeId);
  }, [hasChildren, onNodeSelect, entry.name, entry.isSubflow, entry.nodeId]);
  return /* @__PURE__ */ jsxs14(Fragment4, { children: [
    /* @__PURE__ */ jsxs14(
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
          hasChildren ? /* @__PURE__ */ jsx18(
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
          ) : /* @__PURE__ */ jsx18("span", { style: { width: 12, flexShrink: 0 } }),
          /* @__PURE__ */ jsx18(
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
          /* @__PURE__ */ jsxs14("span", { style: { display: "flex", flexDirection: "column", minWidth: 0 }, children: [
            /* @__PURE__ */ jsxs14(
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
                  entry.isSubflow && /* @__PURE__ */ jsx18("span", { style: { opacity: 0.5, marginLeft: 4, fontSize: 10 }, children: "\u229E" })
                ]
              }
            ),
            entry.description && /* @__PURE__ */ jsx18(
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
    hasChildren && expanded && /* @__PURE__ */ jsx18("div", { children: entry.children.map((child, i) => /* @__PURE__ */ jsx18(
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
  return /* @__PURE__ */ jsx18(
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
  const subflowStages = useMemo8(() => graphToSubflowEntries(graph), [graph]);
  if (subflowStages.length === 0) return null;
  return /* @__PURE__ */ jsxs14(
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
        !unstyled && /* @__PURE__ */ jsx18(SectionLabel, { children: "Subflows" }),
        subflowStages.map((entry, i) => /* @__PURE__ */ jsx18(
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

// src/components/FlowchartView/_internal/keys.ts
function asStageId(s) {
  return s;
}
function asRuntimeStageId(s) {
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

// src/components/SlotPillNode/SlotPillNode.tsx
import { Handle as Handle4, Position as Position6 } from "@xyflow/react";
import { jsx as jsx19, jsxs as jsxs15 } from "react/jsx-runtime";
function SlotPillNode({ data }) {
  const d = data;
  const lit = !!(d.active || d.selected);
  const accent = lit ? theme.primary : d.done ? theme.nodeVisited : theme.textMuted;
  const opacity = d.dimmed && !lit ? 0.45 : 1;
  return /* @__PURE__ */ jsxs15(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "0 12px",
        borderRadius: 999,
        // full pill
        border: `1.5px solid ${lit ? theme.primary : theme.border}`,
        // Fills derive from the theme so the pill follows dark/light — the lit
        // state is a faint primary tint over the resting node bg, unlit is the
        // resting bg itself (visible against the canvas via the border).
        background: lit ? `color-mix(in srgb, ${theme.primary} 14%, ${theme.bgSecondary})` : theme.bgSecondary,
        boxShadow: lit ? `0 0 0 2px color-mix(in srgb, ${theme.primary} 25%, transparent)` : "none",
        opacity,
        fontSize: 12,
        fontWeight: 600,
        color: lit ? theme.textPrimary : theme.textSecondary,
        whiteSpace: "nowrap",
        overflow: "hidden",
        transition: "opacity 120ms, box-shadow 120ms, border-color 120ms"
      },
      title: d.label,
      children: [
        /* @__PURE__ */ jsx19(
          "span",
          {
            "aria-hidden": true,
            style: {
              flexShrink: 0,
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: accent
            }
          }
        ),
        d.icon ? /* @__PURE__ */ jsx19("span", { "aria-hidden": true, style: { flexShrink: 0 }, children: d.icon }) : null,
        /* @__PURE__ */ jsx19("span", { style: { overflow: "hidden", textOverflow: "ellipsis" }, children: d.label }),
        /* @__PURE__ */ jsx19(Handle4, { type: "target", position: Position6.Top, style: { opacity: 0 } }),
        /* @__PURE__ */ jsx19(Handle4, { type: "source", position: Position6.Bottom, style: { opacity: 0 } })
      ]
    }
  );
}

// src/components/FlowchartView/_internal/traceGroupLayout.ts
function buildAdjacency(graph, fallbackW, fallbackH, nodeSize) {
  const preds = /* @__PURE__ */ new Map();
  const branchSuccs = /* @__PURE__ */ new Map();
  const width = /* @__PURE__ */ new Map();
  const height = /* @__PURE__ */ new Map();
  const resolvedStyle = /* @__PURE__ */ new Map();
  const ids = /* @__PURE__ */ new Set();
  for (const n of graph.nodes) {
    ids.add(n.id);
    const s = sizeOf(n, fallbackW, fallbackH, nodeSize);
    width.set(n.id, s.width);
    height.set(n.id, s.height);
    const resolved = nodeSize?.(n);
    if (resolved && resolved.width === s.width && resolved.height === s.height) {
      resolvedStyle.set(n.id, resolved);
    }
    preds.set(n.id, []);
    branchSuccs.set(n.id, []);
  }
  const seen = /* @__PURE__ */ new Set();
  for (const e of graph.edges) {
    if (e.data?.kind === "loop") continue;
    if (!ids.has(e.source) || !ids.has(e.target)) continue;
    const key = `${e.source}\0${e.target}`;
    if (seen.has(key)) continue;
    seen.add(key);
    preds.get(e.target).push(e.source);
    if (e.data?.kind === "fork-branch" || e.data?.kind === "decision-branch") {
      branchSuccs.get(e.source).push(e.target);
    }
  }
  return { preds, branchSuccs, width, height, resolvedStyle };
}
function assignRanks(preds, ids) {
  const rank = /* @__PURE__ */ new Map();
  const inProgress = /* @__PURE__ */ new Set();
  const visit = (id) => {
    const memo4 = rank.get(id);
    if (memo4 !== void 0) return memo4;
    if (inProgress.has(id)) return 0;
    inProgress.add(id);
    const ps = preds.get(id) ?? [];
    let r = 0;
    for (const p of ps) {
      const pr = visit(p);
      if (pr + 1 > r) r = pr + 1;
    }
    inProgress.delete(id);
    rank.set(id, r);
    return r;
  };
  for (const id of ids) visit(id);
  return rank;
}
function spanCenter(ids, center, width) {
  let left = Infinity;
  let right = -Infinity;
  for (const id of ids) {
    const c = center.get(id);
    if (c === void 0) continue;
    const w = width.get(id) ?? 0;
    if (c - w / 2 < left) left = c - w / 2;
    if (c + w / 2 > right) right = c + w / 2;
  }
  if (!Number.isFinite(left)) return 0;
  return (left + right) / 2;
}
function ancestorsOf(start, preds) {
  const seen = /* @__PURE__ */ new Set();
  const stack = [start];
  while (stack.length) {
    const n = stack.pop();
    if (seen.has(n)) continue;
    seen.add(n);
    for (const p of preds.get(n) ?? []) if (!seen.has(p)) stack.push(p);
  }
  return seen;
}
function lowestCommonAncestor(inputs, preds, rank) {
  if (inputs.length === 0) return void 0;
  let common = ancestorsOf(inputs[0], preds);
  for (let i = 1; i < inputs.length && common.size > 0; i++) {
    const a = ancestorsOf(inputs[i], preds);
    common = new Set([...common].filter((x) => a.has(x)));
  }
  let best;
  let bestRank = -Infinity;
  for (const id of common) {
    const r = rank.get(id) ?? -Infinity;
    if (r > bestRank) bestRank = r, best = id;
  }
  return best;
}
function orderBand(ids, preds, center, insertionIndex, siblingOrder) {
  if (siblingOrder && ids.length > 1) {
    const parents = new Set(ids.map((id) => preds.get(id)?.[0]));
    if (parents.size === 1) {
      const parent = [...parents][0];
      if (parent !== void 0) {
        const ordered = siblingOrder(parent, ids);
        const used = /* @__PURE__ */ new Set();
        const out = [];
        for (const id of ordered) if (ids.includes(id) && !used.has(id)) out.push(id), used.add(id);
        for (const id of ids) if (!used.has(id)) out.push(id);
        return out;
      }
    }
  }
  return [...ids].sort((a, b) => {
    const pa = preds.get(a)?.[0];
    const pb = preds.get(b)?.[0];
    const ca = pa !== void 0 ? center.get(pa) : void 0;
    const cb = pb !== void 0 ? center.get(pb) : void 0;
    if (ca !== void 0 && cb !== void 0 && ca !== cb) return ca - cb;
    return (insertionIndex.get(a) ?? 0) - (insertionIndex.get(b) ?? 0);
  });
}
function traceGroupLayout(graph, options = {}) {
  if (graph.nodes.length === 0) return { nodes: graph.nodes, edges: graph.edges };
  if (graph.nodes.length === 1) {
    const only = graph.nodes[0];
    return { nodes: [{ ...only, position: { x: 0, y: 0 } }], edges: graph.edges };
  }
  const rankSep = options.rankSep ?? 80;
  const nodeSep = options.nodeSep ?? 60;
  const fallbackW = options.nodeWidth ?? DEFAULT_NODE_W2;
  const fallbackH = options.nodeHeight ?? DEFAULT_NODE_H2;
  const mergeCentering = options.enableMergeCentering ?? true;
  const mergeAlign = options.mergeAlign ?? "span";
  const ids = graph.nodes.map((n) => n.id);
  const insertionIndex = new Map(ids.map((id, i) => [id, i]));
  const { preds, branchSuccs, width, height, resolvedStyle } = buildAdjacency(
    graph,
    fallbackW,
    fallbackH,
    options.nodeSize
  );
  const rank = assignRanks(preds, ids);
  let maxRank = 0;
  for (const r of rank.values()) if (r > maxRank) maxRank = r;
  for (const id of ids) if (!rank.has(id)) rank.set(id, maxRank + 1);
  maxRank = 0;
  for (const r of rank.values()) if (r > maxRank) maxRank = r;
  const byRank = /* @__PURE__ */ new Map();
  const bandMaxH = /* @__PURE__ */ new Map();
  for (const id of ids) {
    const r = rank.get(id);
    (byRank.get(r) ?? byRank.set(r, []).get(r)).push(id);
    bandMaxH.set(r, Math.max(bandMaxH.get(r) ?? 0, height.get(id)));
  }
  const bandTop = /* @__PURE__ */ new Map();
  let yAcc = 0;
  for (let r = 0; r <= maxRank; r++) {
    bandTop.set(r, yAcc);
    yAcc += (bandMaxH.get(r) ?? fallbackH) + rankSep;
  }
  const center = /* @__PURE__ */ new Map();
  const mergeCenterX = (ps) => {
    if (mergeAlign === "fork-origin") {
      const lca = lowestCommonAncestor(ps, preds, rank);
      const lcaC = lca !== void 0 ? center.get(lca) : void 0;
      if (lcaC !== void 0) return lcaC;
    }
    return spanCenter(ps, center, width);
  };
  for (let r = 0; r <= maxRank; r++) {
    const band = orderBand(byRank.get(r) ?? [], preds, center, insertionIndex, options.siblingOrder);
    let cursor = -Infinity;
    let i = 0;
    while (i < band.length) {
      const id = band[i];
      const ps = preds.get(id) ?? [];
      const parent = ps.length === 1 ? ps[0] : void 0;
      const parentBranches = parent !== void 0 ? branchSuccs.get(parent) ?? [] : [];
      const isForkChild = parent !== void 0 && parentBranches.length >= 2 && parentBranches.includes(id);
      if (isForkChild) {
        const run = [];
        let j = i;
        while (j < band.length) {
          const cand = band[j];
          const cps = preds.get(cand) ?? [];
          if (cps.length === 1 && cps[0] === parent && parentBranches.includes(cand)) run.push(cand), j++;
          else break;
        }
        const totalW = run.reduce((s, rid) => s + width.get(rid), 0) + (run.length - 1) * nodeSep;
        let left = (center.get(parent) ?? 0) - totalW / 2;
        if (cursor !== -Infinity && left < cursor) left = cursor;
        let x = left;
        for (const rid of run) {
          const w = width.get(rid);
          center.set(rid, x + w / 2);
          x += w + nodeSep;
        }
        cursor = x;
        i = j;
      } else {
        const w = width.get(id);
        let desired;
        if (ps.length === 0) desired = (cursor === -Infinity ? 0 : cursor) + w / 2;
        else if (ps.length === 1) desired = center.get(ps[0]) ?? 0;
        else desired = mergeCenterX(ps);
        const cursorCenter = cursor === -Infinity ? -Infinity : cursor + w / 2;
        const c = Math.max(cursorCenter, desired);
        center.set(id, c);
        cursor = c + w / 2 + nodeSep;
        i++;
      }
    }
  }
  if (mergeCentering) {
    for (let r = maxRank; r >= 1; r--) {
      for (const id of byRank.get(r) ?? []) {
        const ps = preds.get(id) ?? [];
        if (ps.length > 1) center.set(id, mergeCenterX(ps));
      }
    }
  }
  const centerById = center;
  const positioned = graph.nodes.map((n) => {
    const r = rank.get(n.id);
    const w = width.get(n.id);
    const h = height.get(n.id);
    let x = (centerById.get(n.id) ?? 0) - w / 2;
    let y = (bandTop.get(r) ?? 0) + ((bandMaxH.get(r) ?? h) - h) / 2;
    if (n.parentId) {
      const pr = rank.get(n.parentId);
      const pw = width.get(n.parentId);
      const ph = height.get(n.parentId);
      if (pr !== void 0 && pw !== void 0 && ph !== void 0) {
        const parentX = (centerById.get(n.parentId) ?? 0) - pw / 2;
        const parentY = (bandTop.get(pr) ?? 0) + ((bandMaxH.get(pr) ?? ph) - ph) / 2;
        x -= parentX;
        y -= parentY;
      }
    }
    const styleSize = resolvedStyle.get(n.id);
    if (styleSize) {
      return { ...n, position: { x, y }, style: { ...n.style ?? {}, width: styleSize.width, height: styleSize.height } };
    }
    return { ...n, position: { x, y } };
  });
  return { nodes: positioned, edges: graph.edges };
}
function createTraceGroupLayout(options = {}) {
  return (graph) => traceGroupLayout(graph, options);
}

// src/components/FlowchartView/createNodeViewRecorder.ts
function baseStageIdOf(runtimeStageId) {
  const hashIdx = runtimeStageId.indexOf("#");
  return hashIdx >= 0 ? runtimeStageId.slice(0, hashIdx) : runtimeStageId;
}
function createNodeViewRecorder(options) {
  const id = options.id ?? "node-view";
  const structure = options.structure;
  if (!structure) {
    throw new Error(
      "[createNodeViewRecorder] `structure` option is required. Pass the handle returned by `createTraceStructureRecorder()`."
    );
  }
  let executionsOf = /* @__PURE__ */ new Map();
  let commitRefsOf = /* @__PURE__ */ new Map();
  let stageIdOfRuntimeStageId = /* @__PURE__ */ new Map();
  let attemptsOfRuntimeStageId = /* @__PURE__ */ new Map();
  const notifier = createNotifier("node-view");
  const unsubStructure = structure.subscribe(() => notifier.notify());
  function recordExecution(event) {
    const rsid = event.traversalContext?.runtimeStageId;
    if (!rsid) {
      devWarn(
        () => `[createNodeViewRecorder] onStageExecuted event without traversalContext.runtimeStageId \u2014 execution attribution dropped (stage=${event.stageName}).`
      );
      return;
    }
    const stageId = asStageId(baseStageIdOf(rsid));
    const runtimeStageId = asRuntimeStageId(rsid);
    const execList = executionsOf.get(stageId) ?? [];
    const record2 = {
      runtimeStageId,
      ...event.traversalContext.iteration !== void 0 && {
        iteration: event.traversalContext.iteration
      },
      ...event.startTime !== void 0 && { startMs: event.startTime },
      ...event.endTime !== void 0 && { endMs: event.endTime }
    };
    execList.push(record2);
    executionsOf.set(stageId, execList);
    stageIdOfRuntimeStageId.set(runtimeStageId, stageId);
    notifier.notify();
  }
  function recordError(event) {
    const rsid = event.traversalContext?.runtimeStageId;
    if (!rsid) {
      devWarn(
        () => `[createNodeViewRecorder] onError event without traversalContext.runtimeStageId \u2014 error attribution dropped (stage=${event.stageName}).`
      );
      return;
    }
    const stageId = asStageId(baseStageIdOf(rsid));
    const runtimeStageId = asRuntimeStageId(rsid);
    const execList = executionsOf.get(stageId);
    const matchIdx = execList ? execList.findIndex((e) => e.runtimeStageId === runtimeStageId) : -1;
    if (!execList || matchIdx === -1) {
      const synth = {
        runtimeStageId,
        errorMessage: event.message ?? "error"
      };
      if (execList) {
        execList.push(synth);
      } else {
        executionsOf.set(stageId, [synth]);
      }
    } else {
      const match = execList[matchIdx];
      execList[matchIdx] = { ...match, errorMessage: event.message ?? "error" };
    }
    stageIdOfRuntimeStageId.set(runtimeStageId, stageId);
    notifier.notify();
  }
  function recordRetry(event) {
    const rsid = event.traversalContext?.runtimeStageId;
    if (!rsid) {
      devWarn(
        () => `[createNodeViewRecorder] onStageRetry event without traversalContext.runtimeStageId \u2014 attempt attribution dropped (stage=${event.stageName}).`
      );
      return;
    }
    const attempt = event.attempt;
    const prior = attemptsOfRuntimeStageId.get(rsid);
    const attemptsMade = typeof attempt === "number" && Number.isFinite(attempt) && attempt >= 1 ? Math.floor(attempt) + 1 : (prior?.attempts ?? 1) + 1;
    attemptsOfRuntimeStageId.set(rsid, {
      attempts: Math.max(attemptsMade, prior?.attempts ?? 0),
      ...typeof event.maxAttempts === "number" && Number.isFinite(event.maxAttempts) ? { maxAttempts: event.maxAttempts } : prior?.maxAttempts !== void 0 ? { maxAttempts: prior.maxAttempts } : {}
    });
    notifier.notify();
  }
  function recordCommit(event) {
    const rsid = event.runtimeStageId;
    if (!rsid) {
      devWarn(
        () => `[createNodeViewRecorder] onCommit event without runtimeStageId \u2014 commit attribution dropped (stage=${event.stage ?? event.stageId ?? "?"}).`
      );
      return;
    }
    const stageId = asStageId(baseStageIdOf(rsid));
    const refs = commitRefsOf.get(stageId) ?? [];
    refs.push(asRuntimeStageId(rsid));
    commitRefsOf.set(stageId, refs);
    stageIdOfRuntimeStageId.set(asRuntimeStageId(rsid), stageId);
    notifier.notify();
  }
  const recorder = {
    id,
    onStageExecuted: recordExecution,
    onError: recordError,
    onStageRetry: recordRetry,
    onCommit: recordCommit,
    // onRunStart / onRunEnd — no-op for now (state stays alive across
    // runs; consumers call .reset() between runs if they want fresh
    // state). Listed for shape conformance with FlowRecorder.
    onRunStart() {
    },
    onRunEnd() {
    }
  };
  function buildView(structNode) {
    const stageId = asStageId(structNode.id);
    const execs = executionsOf.get(stageId) ?? [];
    const commitRefs = commitRefsOf.get(stageId) ?? [];
    const visitedInRun = execs.length > 0;
    const executionCount = execs.length;
    const firstExecutedAt = execs.length > 0 && execs[0].startMs !== void 0 ? execs[0].startMs : null;
    const lastExecutedAt = execs.length > 0 && execs[execs.length - 1].endMs !== void 0 ? execs[execs.length - 1].endMs : null;
    let totalDurationMs = 0;
    let errorCount = 0;
    for (const e of execs) {
      if (e.startMs !== void 0 && e.endMs !== void 0) {
        totalDurationMs += e.endMs - e.startMs;
      }
      if (e.errorMessage) errorCount++;
    }
    const withAttempts = execs.map((e) => {
      const attemptInfo = attemptsOfRuntimeStageId.get(e.runtimeStageId);
      if (!attemptInfo || attemptInfo.attempts <= 1) return { ...e };
      return {
        ...e,
        attempts: attemptInfo.attempts,
        ...attemptInfo.maxAttempts !== void 0 && { maxAttempts: attemptInfo.maxAttempts }
      };
    });
    const retriedExecutionCount = withAttempts.filter(
      (e) => e.attempts !== void 0 && e.attempts > 1
    ).length;
    const d = structNode.data;
    return {
      stageId,
      label: d.label,
      type: structNode.type ?? "stage",
      isDecider: d.isDecider,
      isFork: d.isFork,
      isSubflow: d.isSubflow,
      isStreaming: d.isStreaming,
      isPausable: d.isPausable === true,
      ...d.description !== void 0 && { description: d.description },
      ...d.icon !== void 0 && { icon: d.icon },
      ...d.subflowId !== void 0 && { subflowId: d.subflowId },
      // L8.1 Panel 2 must-fix: branchIds is a live ref from the
      // structure translator's internal graph — defensive copy via
      // slice() prevents consumer mutation from corrupting it.
      ...d.branchIds !== void 0 && { branchIds: d.branchIds.slice() },
      ...d.defaultBranch !== void 0 && { defaultBranch: d.defaultBranch },
      // Note: structure translator always sets prevIds/nextIds (never
      // undefined). The slice() copies defend against consumer mutation.
      prevIds: d.prevIds.slice(),
      nextIds: d.nextIds.slice(),
      executions: withAttempts,
      visitedInRun,
      executionCount,
      firstExecutedAt,
      lastExecutedAt,
      totalDurationMs,
      errorCount,
      retriedExecutionCount,
      commitRuntimeStageIds: commitRefs.slice()
    };
  }
  let cachedIndex = null;
  let cachedOwnVersion = -1;
  let cachedStructureVersion = -1;
  return {
    recorder,
    getIndex() {
      const own = notifier.version();
      const struct = structure.version();
      if (cachedIndex !== null && cachedOwnVersion === own && cachedStructureVersion === struct) {
        return cachedIndex;
      }
      const graphRef = structure.getGraphRef();
      const byStageId = /* @__PURE__ */ new Map();
      const byRuntimeStageId = /* @__PURE__ */ new Map();
      const all = [];
      for (const structNode of graphRef.nodes) {
        const view = buildView(structNode);
        byStageId.set(view.stageId, view);
        all.push(view);
        for (const exec of view.executions) {
          byRuntimeStageId.set(exec.runtimeStageId, view);
        }
        for (const rsid of view.commitRuntimeStageIds) {
          byRuntimeStageId.set(rsid, view);
        }
      }
      cachedIndex = { byStageId, byRuntimeStageId, all };
      cachedOwnVersion = own;
      cachedStructureVersion = struct;
      return cachedIndex;
    },
    subscribe: notifier.subscribe,
    version: notifier.version,
    reset() {
      executionsOf = /* @__PURE__ */ new Map();
      commitRefsOf = /* @__PURE__ */ new Map();
      stageIdOfRuntimeStageId = /* @__PURE__ */ new Map();
      attemptsOfRuntimeStageId = /* @__PURE__ */ new Map();
      cachedIndex = null;
      cachedOwnVersion = -1;
      cachedStructureVersion = -1;
      void unsubStructure;
    }
  };
}

// src/components/FlowchartView/createCommitFlowRecorder.ts
function baseStageIdOf2(runtimeStageId) {
  const hashIdx = runtimeStageId.indexOf("#");
  return hashIdx >= 0 ? runtimeStageId.slice(0, hashIdx) : runtimeStageId;
}
function createCommitFlowRecorder(options) {
  const id = options.id ?? "commit-flow";
  const structure = options.structure;
  if (!structure) {
    throw new Error(
      "[createCommitFlowRecorder] `structure` option is required. Pass the handle returned by `createTraceStructureRecorder()`."
    );
  }
  let rawCommits = [];
  let attemptsOfRuntimeStageId = /* @__PURE__ */ new Map();
  const notifier = createNotifier("commit-flow");
  const unsubStructure = structure.subscribe(() => notifier.notify());
  function recordCommit(event) {
    const rsid = event.runtimeStageId;
    if (!rsid) {
      devWarn(
        () => `[createCommitFlowRecorder] onCommit without runtimeStageId \u2014 commit dropped (stage=${event.stage ?? event.stageId ?? "?"}).`
      );
      return;
    }
    const stageId = asStageId(baseStageIdOf2(rsid));
    rawCommits.push({
      runtimeStageId: asRuntimeStageId(rsid),
      stageId,
      commitIdx: rawCommits.length,
      updates: event.updates ? { ...event.updates } : {},
      reads: event.reads ? [...event.reads] : []
    });
    notifier.notify();
  }
  function recordRetry(event) {
    const rsid = event.traversalContext?.runtimeStageId;
    if (!rsid) {
      devWarn(
        () => `[createCommitFlowRecorder] onStageRetry without runtimeStageId \u2014 attempt attribution dropped (stage=${event.stageName}).`
      );
      return;
    }
    const attempt = event.attempt;
    const prior = attemptsOfRuntimeStageId.get(rsid) ?? 1;
    const attemptsMade = typeof attempt === "number" && Number.isFinite(attempt) && attempt >= 1 ? Math.floor(attempt) + 1 : prior + 1;
    if (attemptsMade > prior) {
      attemptsOfRuntimeStageId.set(rsid, attemptsMade);
      notifier.notify();
    }
  }
  const recorder = {
    id,
    onCommit: recordCommit,
    onStageRetry: recordRetry,
    onStageExecuted() {
    },
    onError() {
    },
    onRunStart() {
    },
    onRunEnd() {
    }
  };
  function buildIndex() {
    const graphRef = structure.getGraphRef();
    const nodeByStageId = /* @__PURE__ */ new Map();
    for (const n of graphRef.nodes) nodeByStageId.set(n.id, n);
    const writersOf = /* @__PURE__ */ new Map();
    for (const rc of rawCommits) {
      for (const k of Object.keys(rc.updates)) {
        const list2 = writersOf.get(k) ?? [];
        list2.push({ commitIdx: rc.commitIdx, runtimeStageId: rc.runtimeStageId });
        writersOf.set(k, list2);
      }
    }
    const commitsOfStage = /* @__PURE__ */ new Map();
    for (const rc of rawCommits) {
      const list2 = commitsOfStage.get(rc.stageId) ?? [];
      list2.push(rc.commitIdx);
      commitsOfStage.set(rc.stageId, list2);
    }
    const commits = [];
    const byRuntimeStageId = /* @__PURE__ */ new Map();
    const dataEdges = [];
    for (const rc of rawCommits) {
      const structNode = nodeByStageId.get(rc.stageId);
      const structuralPrevIds = (structNode?.data.prevIds ?? []).slice();
      const structuralNextIds = (structNode?.data.nextIds ?? []).slice();
      const runtimePrevIds = [];
      for (const pStageId of structuralPrevIds) {
        const list2 = commitsOfStage.get(pStageId);
        if (!list2) continue;
        let chosenIdx = null;
        for (let i = list2.length - 1; i >= 0; i--) {
          if (list2[i] < rc.commitIdx) {
            chosenIdx = list2[i];
            break;
          }
        }
        if (chosenIdx !== null) {
          runtimePrevIds.push(rawCommits[chosenIdx].runtimeStageId);
        }
      }
      const runtimeNextIds = [];
      for (const nStageId of structuralNextIds) {
        const list2 = commitsOfStage.get(nStageId);
        if (!list2) continue;
        let chosenIdx = null;
        for (let i = 0; i < list2.length; i++) {
          if (list2[i] > rc.commitIdx) {
            chosenIdx = list2[i];
            break;
          }
        }
        if (chosenIdx !== null) {
          runtimeNextIds.push(rawCommits[chosenIdx].runtimeStageId);
        }
      }
      const dataDependencies = [];
      for (const key of rc.reads) {
        const writers = writersOf.get(key);
        let source = null;
        if (writers) {
          for (let i = writers.length - 1; i >= 0; i--) {
            if (writers[i].commitIdx < rc.commitIdx) {
              source = writers[i];
              break;
            }
          }
        }
        if (source) {
          dataDependencies.push({
            key,
            sourceRuntimeStageId: source.runtimeStageId,
            sourceCommitIdx: source.commitIdx
          });
          dataEdges.push(
            Object.freeze({ from: source.commitIdx, to: rc.commitIdx, key })
          );
        } else {
          dataDependencies.push({
            key,
            sourceRuntimeStageId: null,
            sourceCommitIdx: null
          });
        }
      }
      const attempts = attemptsOfRuntimeStageId.get(rc.runtimeStageId);
      const view = {
        runtimeStageId: rc.runtimeStageId,
        stageId: rc.stageId,
        commitIdx: rc.commitIdx,
        structuralPrevIds,
        structuralNextIds,
        runtimePrevIds,
        runtimeNextIds,
        dataDependencies,
        updates: { ...rc.updates },
        reads: rc.reads.slice(),
        ...attempts !== void 0 && attempts > 1 && { attempts }
      };
      commits.push(view);
      byRuntimeStageId.set(view.runtimeStageId, view);
    }
    return { commits, byRuntimeStageId, dataEdges };
  }
  let cachedIndex = null;
  let cachedOwnVersion = -1;
  let cachedStructureVersion = -1;
  return {
    recorder,
    getIndex() {
      const own = notifier.version();
      const struct = structure.version();
      if (cachedIndex !== null && cachedOwnVersion === own && cachedStructureVersion === struct) {
        return cachedIndex;
      }
      cachedIndex = buildIndex();
      cachedOwnVersion = own;
      cachedStructureVersion = struct;
      return cachedIndex;
    },
    subscribe: notifier.subscribe,
    version: notifier.version,
    reset() {
      rawCommits = [];
      attemptsOfRuntimeStageId = /* @__PURE__ */ new Map();
      cachedIndex = null;
      cachedOwnVersion = -1;
      cachedStructureVersion = -1;
      void unsubStructure;
    }
  };
}
function backtraceDataFlow(index, startRuntimeStageId) {
  const start = index.byRuntimeStageId.get(startRuntimeStageId);
  if (!start) return [];
  const visitedIdx = /* @__PURE__ */ new Set([start.commitIdx]);
  const queue = [start.commitIdx];
  const collectedIdxs = /* @__PURE__ */ new Set([start.commitIdx]);
  let head = 0;
  while (head < queue.length) {
    const cur = index.commits[queue[head++]];
    if (!cur) continue;
    for (const dep of cur.dataDependencies) {
      if (dep.sourceCommitIdx === null) continue;
      if (visitedIdx.has(dep.sourceCommitIdx)) continue;
      visitedIdx.add(dep.sourceCommitIdx);
      collectedIdxs.add(dep.sourceCommitIdx);
      queue.push(dep.sourceCommitIdx);
    }
  }
  return Array.from(collectedIdxs).sort((a, b) => a - b).map((idx) => index.commits[idx]).filter((c) => c !== void 0);
}

// src/components/FlowchartView/createTraceBundle.ts
function createTraceBundle(options = {}) {
  const structure = createTraceStructureRecorder(options.structure);
  const runtimeOverlay = createTraceRuntimeOverlay(options.runtimeOverlay);
  const nodeView = createNodeViewRecorder({
    ...options.nodeView ?? {},
    structure
  });
  const commitFlow = createCommitFlowRecorder({
    ...options.commitFlow ?? {},
    structure
  });
  return {
    structure,
    runtimeOverlay,
    nodeView,
    commitFlow,
    attachTo(executor) {
      executor.attachFlowRecorder(runtimeOverlay.recorder);
      executor.attachFlowRecorder(nodeView.recorder);
      executor.attachFlowRecorder(commitFlow.recorder);
      if (typeof executor.attachScopeRecorder === "function") {
        executor.attachScopeRecorder(nodeView.recorder);
        executor.attachScopeRecorder(commitFlow.recorder);
      } else {
        devWarn(
          () => "[createTraceBundle] executor.attachScopeRecorder is missing \u2014 NodeView.commitRuntimeStageIds[] AND CommitFlow.commits[] will be empty. Upgrade to footprintjs v6.0+."
        );
      }
    }
  };
}

// src/components/FlowchartView/_internal/useTranslator.ts
import { useMemo as useMemo9, useSyncExternalStore as useSyncExternalStore2 } from "react";
function useTranslator(handle, getSnapshot) {
  const subscribe = useMemo9(() => handle.subscribe.bind(handle), [handle]);
  const getVersion = useMemo9(() => handle.version.bind(handle), [handle]);
  const version = useSyncExternalStore2(subscribe, getVersion, getVersion);
  return useMemo9(() => getSnapshot(), [version, getSnapshot]);
}

// src/components/FlowchartView/walkHelpers.ts
function walkForward(index, startId, options = {}) {
  return bfsWalk(index, startId, (n) => n.nextIds, options);
}
function walkBackward(index, startId, options = {}) {
  return bfsWalk(index, startId, (n) => n.prevIds, options);
}
function backtraceStructural(index, stageId, options = {}) {
  const start = index.byStageId.get(stageId);
  if (!start) return [];
  const chain = [start];
  const cap = options.maxDepth ?? index.all.length;
  const visited = /* @__PURE__ */ new Set([stageId]);
  let cur = start;
  let hops = 0;
  while (cur && hops < cap) {
    if (cur.prevIds.length === 0 || cur.prevIds.length > 1) {
      break;
    }
    const nextId = cur.prevIds[0];
    if (visited.has(nextId)) break;
    visited.add(nextId);
    const next = index.byStageId.get(nextId);
    if (!next) break;
    if (options.onlyVisited && !next.visitedInRun) break;
    chain.unshift(next);
    cur = next;
    hops++;
  }
  return chain;
}
function forwardtraceStructural(index, stageId, options = {}) {
  const start = index.byStageId.get(stageId);
  if (!start) return [];
  const chain = [start];
  const cap = options.maxDepth ?? index.all.length;
  const visited = /* @__PURE__ */ new Set([stageId]);
  let cur = start;
  let hops = 0;
  while (cur && hops < cap) {
    if (cur.nextIds.length === 0 || cur.nextIds.length > 1) break;
    const nextId = cur.nextIds[0];
    if (visited.has(nextId)) break;
    visited.add(nextId);
    const next = index.byStageId.get(nextId);
    if (!next) break;
    if (options.onlyVisited && !next.visitedInRun) break;
    chain.push(next);
    cur = next;
    hops++;
  }
  return chain;
}
function bfsWalk(index, startId, neighborsOf, options) {
  const start = index.byStageId.get(startId);
  if (!start) return [];
  const cap = options.maxDepth ?? index.all.length;
  const visited = /* @__PURE__ */ new Set();
  visited.add(startId);
  const out = [];
  if (options.includeStart) out.push(start);
  const queue = [[start, 0]];
  let head = 0;
  while (head < queue.length) {
    const [node, depth] = queue[head++];
    if (depth >= cap) continue;
    for (const neighborId of neighborsOf(node)) {
      if (visited.has(neighborId)) continue;
      visited.add(neighborId);
      const neighbor = index.byStageId.get(neighborId);
      if (!neighbor) continue;
      if (options.onlyVisited && !neighbor.visitedInRun) continue;
      out.push(neighbor);
      queue.push([neighbor, depth + 1]);
    }
  }
  return out;
}

// src/components/FlowchartView/NodeInspector.tsx
import { useMemo as useMemo10 } from "react";
import { Fragment as Fragment5, jsx as jsx20, jsxs as jsxs16 } from "react/jsx-runtime";
function NodeInspector({
  index,
  selectedId,
  onNavigate,
  onlyVisited = false,
  className,
  style
}) {
  const view = selectedId ? index.byStageId.get(selectedId) ?? null : null;
  const prevChain = useMemo10(
    () => view ? backtraceStructural(index, view.stageId, { onlyVisited }) : [],
    [index, view, onlyVisited]
  );
  const nextChain = useMemo10(
    () => view ? forwardtraceStructural(index, view.stageId, { onlyVisited }) : [],
    [index, view, onlyVisited]
  );
  if (!view) {
    return /* @__PURE__ */ jsx20(
      "div",
      {
        className,
        style: {
          padding: 16,
          color: theme.textMuted,
          fontStyle: "italic",
          ...style
        },
        children: "Select a stage to inspect."
      }
    );
  }
  return /* @__PURE__ */ jsxs16(
    "div",
    {
      className,
      style: {
        padding: 14,
        color: theme.textPrimary,
        fontSize: 13,
        overflow: "auto",
        ...style
      },
      children: [
        /* @__PURE__ */ jsxs16("div", { style: { marginBottom: 16 }, children: [
          /* @__PURE__ */ jsx20("div", { style: { fontSize: 16, fontWeight: 700, color: theme.textPrimary }, children: view.label }),
          /* @__PURE__ */ jsxs16("div", { style: { fontSize: 11, fontFamily: "monospace", color: theme.textMuted, marginTop: 2 }, children: [
            view.stageId,
            " \xB7 ",
            view.type,
            view.isDecider && " \xB7 decider",
            view.isFork && " \xB7 fork",
            view.isSubflow && " \xB7 subflow",
            view.isStreaming && " \xB7 streaming",
            view.isPausable && " \xB7 pausable"
          ] }),
          view.description && /* @__PURE__ */ jsx20("div", { style: { fontSize: 12, color: theme.textSecondary, marginTop: 6 }, children: view.description })
        ] }),
        /* @__PURE__ */ jsxs16(Section, { title: "Runtime", children: [
          /* @__PURE__ */ jsx20(Row, { label: "Visited", value: view.visitedInRun ? "yes" : "no" }),
          view.visitedInRun && /* @__PURE__ */ jsxs16(Fragment5, { children: [
            /* @__PURE__ */ jsx20(Row, { label: "Executions", value: String(view.executionCount) }),
            view.firstExecutedAt !== null && /* @__PURE__ */ jsx20(Row, { label: "First at", value: `${view.firstExecutedAt.toFixed(1)}ms` }),
            view.lastExecutedAt !== null && /* @__PURE__ */ jsx20(Row, { label: "Last at", value: `${view.lastExecutedAt.toFixed(1)}ms` }),
            view.totalDurationMs > 0 && /* @__PURE__ */ jsx20(Row, { label: "Total", value: `${view.totalDurationMs.toFixed(1)}ms` }),
            view.errorCount > 0 && /* @__PURE__ */ jsx20(Row, { label: "Errors", value: String(view.errorCount), valueColor: theme.error })
          ] })
        ] }),
        prevChain.length > 1 && /* @__PURE__ */ jsx20(Section, { title: `Prev chain (${prevChain.length - 1} hops)`, children: /* @__PURE__ */ jsx20(Crumbs, { nodes: prevChain.slice(0, -1), onClick: onNavigate }) }),
        view.prevIds.length > 1 && /* @__PURE__ */ jsx20(Section, { title: "Multiple prev (convergence)", children: /* @__PURE__ */ jsx20(
          Crumbs,
          {
            nodes: view.prevIds.map((id) => index.byStageId.get(id)).filter((n) => n !== void 0),
            onClick: onNavigate
          }
        ) }),
        nextChain.length > 1 && /* @__PURE__ */ jsx20(Section, { title: `Next chain (${nextChain.length - 1} hops)`, children: /* @__PURE__ */ jsx20(Crumbs, { nodes: nextChain.slice(1), onClick: onNavigate }) }),
        view.nextIds.length > 1 && /* @__PURE__ */ jsx20(Section, { title: "Multiple next (fork/decider)", children: /* @__PURE__ */ jsx20(
          Crumbs,
          {
            nodes: view.nextIds.map((id) => index.byStageId.get(id)).filter((n) => n !== void 0),
            onClick: onNavigate
          }
        ) }),
        view.commitRuntimeStageIds.length > 0 && /* @__PURE__ */ jsx20(Section, { title: `Commits (${view.commitRuntimeStageIds.length})`, children: /* @__PURE__ */ jsx20("div", { style: { fontFamily: "monospace", fontSize: 11, color: theme.textSecondary }, children: view.commitRuntimeStageIds.map((rsid) => /* @__PURE__ */ jsx20("div", { children: rsid }, rsid)) }) })
      ]
    }
  );
}
function Section({ title, children }) {
  return /* @__PURE__ */ jsxs16("div", { style: { marginBottom: 14 }, children: [
    /* @__PURE__ */ jsx20(
      "div",
      {
        style: {
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 0.4,
          textTransform: "uppercase",
          color: theme.textMuted,
          marginBottom: 6
        },
        children: title
      }
    ),
    children
  ] });
}
function Row({ label, value, valueColor }) {
  return /* @__PURE__ */ jsxs16("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 12, padding: "2px 0" }, children: [
    /* @__PURE__ */ jsx20("span", { style: { color: theme.textMuted }, children: label }),
    /* @__PURE__ */ jsx20("span", { style: { color: valueColor ?? theme.textSecondary, fontFamily: "monospace" }, children: value })
  ] });
}
function Crumbs({ nodes, onClick }) {
  if (nodes.length === 0) return null;
  return /* @__PURE__ */ jsx20("div", { style: { display: "flex", flexWrap: "wrap", gap: 6 }, children: nodes.map((n, i) => /* @__PURE__ */ jsxs16("span", { style: { display: "inline-flex", alignItems: "center", gap: 4 }, children: [
    /* @__PURE__ */ jsx20(
      "button",
      {
        onClick: onClick ? () => onClick(n.stageId) : void 0,
        style: {
          fontSize: 11,
          fontFamily: "monospace",
          padding: "3px 8px",
          borderRadius: 4,
          border: `1px solid ${theme.border}`,
          background: "transparent",
          color: n.visitedInRun ? theme.success : theme.textSecondary,
          cursor: onClick ? "pointer" : "default"
        },
        children: n.label
      }
    ),
    i < nodes.length - 1 && /* @__PURE__ */ jsx20("span", { style: { color: theme.textMuted, fontSize: 10 }, children: "\u203A" })
  ] }, n.stageId)) });
}

// src/components/FlowchartView/CommitInspector.tsx
import { useMemo as useMemo11 } from "react";
import { jsx as jsx21, jsxs as jsxs17 } from "react/jsx-runtime";
function CommitInspector({
  index,
  selectedRuntimeStageId,
  onNavigate,
  className,
  style
}) {
  const view = selectedRuntimeStageId ? index.byRuntimeStageId.get(selectedRuntimeStageId) ?? null : null;
  const lineage = useMemo11(
    () => view ? backtraceDataFlow(index, view.runtimeStageId) : [],
    [index, view]
  );
  if (!view) {
    return /* @__PURE__ */ jsx21(
      "div",
      {
        className,
        style: {
          padding: 16,
          color: theme.textMuted,
          fontStyle: "italic",
          ...style
        },
        children: "Select a commit to inspect."
      }
    );
  }
  return /* @__PURE__ */ jsxs17(
    "div",
    {
      className,
      style: {
        padding: 14,
        color: theme.textPrimary,
        fontSize: 13,
        overflow: "auto",
        ...style
      },
      children: [
        /* @__PURE__ */ jsxs17("div", { style: { marginBottom: 16 }, children: [
          /* @__PURE__ */ jsx21("div", { style: { fontSize: 16, fontWeight: 700, color: theme.textPrimary }, children: view.stageId }),
          /* @__PURE__ */ jsxs17(
            "div",
            {
              style: {
                fontSize: 11,
                fontFamily: "monospace",
                color: theme.textMuted,
                marginTop: 2
              },
              children: [
                view.runtimeStageId,
                " \xB7 commitIdx ",
                view.commitIdx
              ]
            }
          )
        ] }),
        view.structuralPrevIds.length > 0 && /* @__PURE__ */ jsx21(Section2, { title: "Structural prev (chart shape)", children: /* @__PURE__ */ jsx21(PlainTags, { labels: view.structuralPrevIds }) }),
        view.structuralNextIds.length > 0 && /* @__PURE__ */ jsx21(Section2, { title: "Structural next (chart shape)", children: /* @__PURE__ */ jsx21(PlainTags, { labels: view.structuralNextIds }) }),
        view.runtimePrevIds.length > 0 && /* @__PURE__ */ jsx21(Section2, { title: "Runtime prev (this execution)", children: /* @__PURE__ */ jsx21(RuntimeRefs, { refs: view.runtimePrevIds, onClick: onNavigate }) }),
        view.runtimeNextIds.length > 0 && /* @__PURE__ */ jsx21(Section2, { title: "Runtime next (this execution)", children: /* @__PURE__ */ jsx21(RuntimeRefs, { refs: view.runtimeNextIds, onClick: onNavigate }) }),
        Object.keys(view.updates).length > 0 && /* @__PURE__ */ jsx21(Section2, { title: `Updates (${Object.keys(view.updates).length})`, children: /* @__PURE__ */ jsx21(KeyValueGrid, { entries: Object.entries(view.updates) }) }),
        view.reads.length > 0 && /* @__PURE__ */ jsx21(Section2, { title: `Reads (${view.reads.length})`, children: /* @__PURE__ */ jsx21(PlainTags, { labels: view.reads }) }),
        view.dataDependencies.length > 0 && /* @__PURE__ */ jsx21(Section2, { title: `Data dependencies (${view.dataDependencies.length})`, children: /* @__PURE__ */ jsx21("table", { style: { fontSize: 11, fontFamily: "monospace", width: "100%", borderCollapse: "collapse" }, children: /* @__PURE__ */ jsx21("tbody", { children: view.dataDependencies.map((dep) => /* @__PURE__ */ jsxs17("tr", { children: [
          /* @__PURE__ */ jsx21("td", { style: { color: theme.textSecondary, padding: "2px 8px 2px 0" }, children: dep.key }),
          /* @__PURE__ */ jsx21("td", { style: { color: dep.sourceRuntimeStageId ? theme.textPrimary : theme.textMuted }, children: dep.sourceRuntimeStageId ? /* @__PURE__ */ jsxs17(
            "button",
            {
              onClick: onNavigate ? () => onNavigate(dep.sourceRuntimeStageId) : void 0,
              style: crumbButtonStyle(onNavigate !== void 0),
              children: [
                "\u2190 ",
                dep.sourceRuntimeStageId
              ]
            }
          ) : /* @__PURE__ */ jsx21("em", { children: "(no prior writer \u2014 default or external)" }) })
        ] }, dep.key)) }) }) }),
        lineage.length > 1 && /* @__PURE__ */ jsx21(Section2, { title: `Lineage chain (${lineage.length - 1} ancestor commits)`, children: /* @__PURE__ */ jsx21("div", { style: { display: "flex", flexWrap: "wrap", gap: 6 }, children: lineage.slice(0, -1).map((c, i) => /* @__PURE__ */ jsxs17("span", { style: { display: "inline-flex", alignItems: "center", gap: 4 }, children: [
          /* @__PURE__ */ jsx21(
            "button",
            {
              onClick: onNavigate ? () => onNavigate(c.runtimeStageId) : void 0,
              style: crumbButtonStyle(onNavigate !== void 0),
              children: c.runtimeStageId
            }
          ),
          i < lineage.length - 2 && /* @__PURE__ */ jsx21("span", { style: { color: theme.textMuted, fontSize: 10 }, children: "\u2192" })
        ] }, c.runtimeStageId)) }) })
      ]
    }
  );
}
function Section2({ title, children }) {
  return /* @__PURE__ */ jsxs17("div", { style: { marginBottom: 14 }, children: [
    /* @__PURE__ */ jsx21(
      "div",
      {
        style: {
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 0.4,
          textTransform: "uppercase",
          color: theme.textMuted,
          marginBottom: 6
        },
        children: title
      }
    ),
    children
  ] });
}
function PlainTags({ labels }) {
  return /* @__PURE__ */ jsx21("div", { style: { display: "flex", flexWrap: "wrap", gap: 4 }, children: labels.map((l) => /* @__PURE__ */ jsx21(
    "span",
    {
      style: {
        fontSize: 11,
        fontFamily: "monospace",
        padding: "2px 6px",
        borderRadius: 3,
        background: "var(--fp-bg-secondary, transparent)",
        color: theme.textSecondary
      },
      children: l
    },
    l
  )) });
}
function RuntimeRefs({
  refs,
  onClick
}) {
  return /* @__PURE__ */ jsx21("div", { style: { display: "flex", flexWrap: "wrap", gap: 6 }, children: refs.map((r) => /* @__PURE__ */ jsx21(
    "button",
    {
      onClick: onClick ? () => onClick(r) : void 0,
      style: crumbButtonStyle(onClick !== void 0),
      children: r
    },
    r
  )) });
}
function KeyValueGrid({ entries }) {
  return /* @__PURE__ */ jsx21("table", { style: { fontSize: 11, fontFamily: "monospace", width: "100%", borderCollapse: "collapse" }, children: /* @__PURE__ */ jsx21("tbody", { children: entries.map(([k, v2]) => /* @__PURE__ */ jsxs17("tr", { children: [
    /* @__PURE__ */ jsx21("td", { style: { color: theme.textSecondary, padding: "2px 8px 2px 0", verticalAlign: "top" }, children: k }),
    /* @__PURE__ */ jsx21("td", { style: { color: theme.textPrimary, wordBreak: "break-word" }, children: typeof v2 === "object" ? JSON.stringify(v2) : String(v2) })
  ] }, k)) }) });
}
function crumbButtonStyle(clickable) {
  return {
    fontSize: 11,
    fontFamily: "monospace",
    padding: "3px 8px",
    borderRadius: 4,
    border: `1px solid ${theme.border}`,
    background: "transparent",
    color: theme.textSecondary,
    cursor: clickable ? "pointer" : "default"
  };
}

// src/components/FlowchartView/buildCommitChainTree.ts
function indexGraph(graph) {
  const byStageId = /* @__PURE__ */ new Map();
  const allNodeIds = [];
  for (const node of graph.nodes) {
    const stageId = asStageId(node.id);
    allNodeIds.push(stageId);
    byStageId.set(stageId, { branchChildren: [], linearNext: [] });
  }
  for (const edge of graph.edges) {
    const kind = edge.data?.kind;
    if (kind === "loop") continue;
    const sourceEntry = byStageId.get(asStageId(edge.source));
    if (!sourceEntry) continue;
    const target = asStageId(edge.target);
    if (!byStageId.has(target)) continue;
    if (kind === "fork-branch" || kind === "decision-branch") {
      sourceEntry.branchChildren.push(target);
    } else {
      sourceEntry.linearNext.push(target);
    }
  }
  return { byStageId, allNodeIds };
}
function findSeed(graph, fromStageId) {
  if (fromStageId) {
    const n = graph.nodes.find((n2) => n2.id === fromStageId);
    return n ? asStageId(n.id) : null;
  }
  const hasIncoming = /* @__PURE__ */ new Set();
  for (const e of graph.edges) {
    if (e.data?.kind !== "loop") hasIncoming.add(e.target);
  }
  const seed = graph.nodes.find((n) => !hasIncoming.has(n.id)) ?? graph.nodes[0];
  return seed ? asStageId(seed.id) : null;
}
function bfsReachable(startId, index) {
  const reachable = /* @__PURE__ */ new Set([startId]);
  const order = [startId];
  const queue = [startId];
  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++];
    const entry = index.byStageId.get(cur);
    if (!entry) continue;
    for (const next of [...entry.branchChildren, ...entry.linearNext]) {
      if (reachable.has(next)) continue;
      reachable.add(next);
      order.push(next);
      queue.push(next);
    }
  }
  return { order, reachable };
}
function findConvergence(branches, index) {
  if (branches.length < 2) return null;
  const firstWalk = bfsReachable(branches[0], index);
  const reachableSets = [firstWalk.reachable];
  for (let i = 1; i < branches.length; i++) {
    reachableSets.push(bfsReachable(branches[i], index).reachable);
  }
  const startSet = new Set(branches);
  for (const candidate of firstWalk.order) {
    if (startSet.has(candidate)) continue;
    if (reachableSets.every((s) => s.has(candidate))) {
      return candidate;
    }
  }
  return null;
}
function walkChain(startId, untilId, index, visited) {
  const items = [];
  let cur = startId;
  while (cur !== null && cur !== untilId) {
    if (visited.has(cur)) break;
    visited.add(cur);
    const entry = index.byStageId.get(cur);
    if (!entry) break;
    const branches = entry.branchChildren;
    const linearNexts = entry.linearNext;
    items.push({ kind: "leaf", stageId: cur });
    if (branches.length >= 2) {
      const convergence = findConvergence(branches, index);
      const branchChains = [];
      for (const b of branches) {
        const branchVisited = new Set(visited);
        const sub = walkChain(b, convergence, index, branchVisited);
        if (sub !== null) branchChains.push(sub);
        for (const v2 of branchVisited) visited.add(v2);
      }
      if (branchChains.length > 0) {
        items.push({ kind: "parallel", branches: branchChains });
      }
      cur = convergence;
    } else if (branches.length === 1 && linearNexts.length === 0) {
      cur = branches[0];
    } else if (linearNexts.length >= 1) {
      if (linearNexts.length > 1) {
        devWarn(
          () => `[buildCommitChainTree] stage '${cur}' has ${linearNexts.length} linear-next edges; chain decomposition follows only the first ('${linearNexts[0]}'). Use 'fork-branch' or 'decision-branch' edge kinds to express parallel/conditional splits.`
        );
      }
      cur = linearNexts[0];
    } else {
      cur = null;
    }
  }
  if (items.length === 0) return null;
  if (items.length === 1) return items[0];
  return { kind: "serial", items };
}
function structureAsChainTree(graph, options = {}) {
  if (graph.nodes.length === 0) return null;
  const index = indexGraph(graph);
  const seed = findSeed(graph, options.rootStageId);
  if (!seed) return null;
  const visited = /* @__PURE__ */ new Set();
  return walkChain(seed, null, index, visited);
}
function buildCommitChainTree(graph, commitFlow, options = {}) {
  const structural = structureAsChainTree(graph, options);
  if (!structural) return null;
  const commitsByStageId = /* @__PURE__ */ new Map();
  for (const c of commitFlow.commits) {
    const list2 = commitsByStageId.get(c.stageId) ?? [];
    list2.push(c);
    commitsByStageId.set(c.stageId, list2);
  }
  return decorate(structural, commitsByStageId);
}
function decorate(node, commitsByStageId) {
  if (node.kind === "leaf") {
    return {
      kind: "leaf",
      stageId: node.stageId,
      commits: commitsByStageId.get(node.stageId) ?? []
    };
  }
  if (node.kind === "serial") {
    return {
      kind: "serial",
      items: node.items.map((n) => decorate(n, commitsByStageId))
    };
  }
  return {
    kind: "parallel",
    branches: node.branches.map((b) => decorate(b, commitsByStageId))
  };
}

// src/components/FlowchartView/CommitChainView.tsx
import { Fragment as Fragment6, jsx as jsx22, jsxs as jsxs18 } from "react/jsx-runtime";
function CommitChainView({
  chain,
  selectedRuntimeStageId = null,
  onSelectCommit,
  resolveLabel,
  revealedThroughCommitIdx = null,
  className,
  style
}) {
  if (!chain) {
    return /* @__PURE__ */ jsx22(
      "div",
      {
        className,
        style: {
          padding: 16,
          color: theme.textMuted,
          fontStyle: "italic",
          ...style
        },
        children: "No chain to display."
      }
    );
  }
  return /* @__PURE__ */ jsx22(
    "div",
    {
      className,
      style: {
        padding: 12,
        color: theme.textPrimary,
        fontSize: 12,
        overflow: "auto",
        ...style
      },
      children: /* @__PURE__ */ jsx22(
        ChainShell,
        {
          node: chain,
          renderLeaf: (leaf) => /* @__PURE__ */ jsx22(
            Leaf,
            {
              leaf,
              selectedRuntimeStageId,
              onSelectCommit,
              resolveLabel,
              revealedThroughCommitIdx
            }
          )
        }
      )
    }
  );
}
function ChainShell({ node, renderLeaf }) {
  if (node.kind === "leaf") {
    return /* @__PURE__ */ jsx22(Fragment6, { children: renderLeaf(node) });
  }
  if (node.kind === "serial") {
    return /* @__PURE__ */ jsx22(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0
        },
        children: node.items.map((child, i) => /* @__PURE__ */ jsxs18(
          "div",
          {
            style: { display: "flex", flexDirection: "column", alignItems: "center" },
            children: [
              /* @__PURE__ */ jsx22(ChainShell, { node: child, renderLeaf }),
              i < node.items.length - 1 && /* @__PURE__ */ jsx22(Connector, { orientation: "vertical" })
            ]
          },
          chainKey(child, i)
        ))
      }
    );
  }
  return /* @__PURE__ */ jsxs18(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 0
      },
      children: [
        /* @__PURE__ */ jsx22(ForkMarker, {}),
        /* @__PURE__ */ jsx22(
          "div",
          {
            style: {
              display: "flex",
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 18,
              padding: "4px 0",
              borderLeft: `1px dashed ${theme.border}`,
              borderRight: `1px dashed ${theme.border}`,
              paddingLeft: 12,
              paddingRight: 12
            },
            children: node.branches.map((branch, i) => /* @__PURE__ */ jsx22(
              "div",
              {
                style: {
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  minWidth: 120
                },
                children: /* @__PURE__ */ jsx22(ChainShell, { node: branch, renderLeaf })
              },
              chainKey(branch, i)
            ))
          }
        ),
        /* @__PURE__ */ jsx22(ForkMarker, {})
      ]
    }
  );
}
function chainKey(node, fallbackIndex) {
  const leaf = firstLeafOf(node);
  return leaf ? `${node.kind}:${leaf.stageId}` : `${node.kind}:idx${fallbackIndex}`;
}
function firstLeafOf(node) {
  if (node.kind === "leaf") return node;
  if (node.kind === "serial") {
    for (const item of node.items) {
      const l = firstLeafOf(item);
      if (l) return l;
    }
    return null;
  }
  for (const branch of node.branches) {
    const l = firstLeafOf(branch);
    if (l) return l;
  }
  return null;
}
function Leaf({
  leaf,
  selectedRuntimeStageId,
  onSelectCommit,
  resolveLabel,
  revealedThroughCommitIdx
}) {
  const label = resolveLabel ? resolveLabel(leaf.stageId) : leaf.stageId;
  const commits = "commits" in leaf ? leaf.commits : [];
  if (commits.length === 0) {
    return /* @__PURE__ */ jsxs18(
      "div",
      {
        style: {
          ...boxBaseStyle,
          borderStyle: "dashed",
          color: theme.textMuted,
          background: "transparent"
        },
        title: `${leaf.stageId} \u2014 not executed in this run`,
        children: [
          /* @__PURE__ */ jsx22("div", { style: { fontWeight: 600 }, children: label }),
          /* @__PURE__ */ jsx22("div", { style: { fontSize: 10, fontStyle: "italic" }, children: "not executed" })
        ]
      }
    );
  }
  return /* @__PURE__ */ jsx22("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }, children: commits.map((c, i) => {
    const isSelected = c.runtimeStageId === selectedRuntimeStageId;
    const clickable = onSelectCommit !== void 0;
    const isRevealed = revealedThroughCommitIdx === null || c.commitIdx <= revealedThroughCommitIdx;
    return /* @__PURE__ */ jsxs18(
      "button",
      {
        type: "button",
        onClick: clickable ? () => onSelectCommit(c.runtimeStageId) : void 0,
        style: {
          ...boxBaseStyle,
          cursor: clickable ? "pointer" : "default",
          borderColor: isSelected ? theme.success : theme.border,
          borderWidth: isSelected ? 2 : 1,
          // Mixed FROM the same role the border uses, so one `success`
          // override moves both (raw rgba here was unthemeable).
          background: isSelected ? `color-mix(in srgb, ${theme.success} 8%, transparent)` : "transparent",
          color: theme.textPrimary,
          textAlign: "left",
          fontFamily: "inherit",
          padding: "6px 10px",
          opacity: isRevealed ? 1 : 0.35
        },
        "aria-disabled": !isRevealed,
        "aria-current": isSelected ? "true" : void 0,
        title: c.runtimeStageId,
        children: [
          /* @__PURE__ */ jsxs18("div", { style: { fontWeight: 600 }, children: [
            label,
            commits.length > 1 && /* @__PURE__ */ jsxs18("span", { style: { color: theme.textMuted, fontWeight: 400, marginLeft: 6 }, children: [
              "iter ",
              i + 1,
              "/",
              commits.length
            ] })
          ] }),
          /* @__PURE__ */ jsxs18(
            "div",
            {
              style: {
                fontSize: 10,
                fontFamily: "monospace",
                color: theme.textMuted,
                marginTop: 2
              },
              children: [
                "#",
                c.commitIdx,
                " \xB7 ",
                c.runtimeStageId
              ]
            }
          )
        ]
      },
      c.commitIdx
    );
  }) });
}
function Connector({ orientation }) {
  return orientation === "vertical" ? /* @__PURE__ */ jsx22(
    "div",
    {
      "aria-hidden": true,
      style: {
        width: 1,
        height: 12,
        background: theme.border
      }
    }
  ) : /* @__PURE__ */ jsx22(
    "div",
    {
      "aria-hidden": true,
      style: {
        height: 1,
        width: 12,
        background: theme.border
      }
    }
  );
}
function ForkMarker() {
  return /* @__PURE__ */ jsx22(
    "div",
    {
      "aria-hidden": true,
      style: {
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: theme.border,
        margin: "2px 0"
      }
    }
  );
}
var boxBaseStyle = {
  display: "inline-block",
  minWidth: 110,
  padding: "6px 10px",
  border: `1px solid ${theme.border}`,
  borderRadius: 4,
  fontSize: 12,
  color: theme.textPrimary,
  background: "transparent"
};

// src/components/FlowchartView/TraceExplorerShell.tsx
import { useMemo as useMemo13, useState as useState9, useCallback as useCallback7 } from "react";

// src/components/FlowchartView/RunSlider.tsx
import { useCallback as useCallback6, useMemo as useMemo12 } from "react";
import { jsx as jsx23, jsxs as jsxs19 } from "react/jsx-runtime";
function RunSlider({
  index,
  cursorRuntimeStageId,
  onCursorChange,
  renderLabel,
  className,
  style
}) {
  const total = index.commits.length;
  const cursorCommitIdx = useMemo12(() => {
    if (!cursorRuntimeStageId) return 0;
    const view = index.byRuntimeStageId.get(cursorRuntimeStageId);
    return view ? view.commitIdx : 0;
  }, [index, cursorRuntimeStageId]);
  const handleSliderChange = useCallback6(
    (e) => {
      const value = Number(e.target.value);
      const view = index.commits[value];
      onCursorChange(view ? view.runtimeStageId : null);
    },
    [index, onCursorChange]
  );
  const label = useMemo12(() => {
    const commit = index.commits[cursorCommitIdx] ?? null;
    const rsid = cursorRuntimeStageId ?? commit?.runtimeStageId ?? null;
    if (renderLabel)
      return renderLabel({
        commitIdx: cursorCommitIdx,
        total,
        runtimeStageId: rsid,
        commit,
        index
      });
    if (total === 0) return /* @__PURE__ */ jsx23("span", { style: { color: theme.textMuted }, children: "No commits yet" });
    return /* @__PURE__ */ jsxs19("span", { style: { fontFamily: "monospace", fontSize: 11, color: theme.textSecondary }, children: [
      "#",
      cursorCommitIdx + 1,
      " / ",
      total,
      " \xB7 ",
      commit?.runtimeStageId ?? "\u2014"
    ] });
  }, [renderLabel, cursorCommitIdx, total, index, cursorRuntimeStageId]);
  const disabled = total < 2;
  return /* @__PURE__ */ jsxs19(
    "div",
    {
      className,
      style: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "8px 12px",
        background: theme.bgSecondary,
        border: `1px solid ${theme.border}`,
        borderRadius: 6,
        ...style
      },
      children: [
        /* @__PURE__ */ jsx23(
          "span",
          {
            style: {
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 0.4,
              textTransform: "uppercase",
              color: theme.textMuted
            },
            children: "Time"
          }
        ),
        /* @__PURE__ */ jsx23(
          "input",
          {
            type: "range",
            min: 0,
            max: Math.max(0, total - 1),
            step: 1,
            value: Math.min(cursorCommitIdx, Math.max(0, total - 1)),
            onChange: handleSliderChange,
            disabled,
            "aria-label": "Commit time cursor",
            "aria-valuemin": 0,
            "aria-valuemax": Math.max(0, total - 1),
            "aria-valuenow": cursorCommitIdx,
            "aria-valuetext": total === 0 ? "no commits" : `commit ${cursorCommitIdx + 1} of ${total}`,
            style: { flex: 1, accentColor: theme.success }
          }
        ),
        /* @__PURE__ */ jsx23("div", { style: { minWidth: 200, textAlign: "right" }, children: label })
      ]
    }
  );
}

// src/components/FlowchartView/TraceExplorerShell.tsx
import { jsx as jsx24, jsxs as jsxs20 } from "react/jsx-runtime";
function TraceExplorerShell({
  bundle,
  selectedRuntimeStageId: controlledSel,
  onSelectionChange,
  slots,
  className,
  style
}) {
  const [internalSel, setInternalSel] = useState9(null);
  const isControlled = controlledSel !== void 0;
  const selectedRuntimeStageId = isControlled ? controlledSel : internalSel;
  const handleSelect = useCallback7(
    (rsid) => {
      if (!isControlled) setInternalSel(rsid);
      onSelectionChange?.(rsid);
    },
    [isControlled, onSelectionChange]
  );
  const handleSelectCommit = useCallback7(
    (rsid) => handleSelect(rsid),
    [handleSelect]
  );
  const selectedStageId = useMemo13(() => {
    if (!selectedRuntimeStageId) return null;
    const hashIdx = selectedRuntimeStageId.lastIndexOf("#");
    if (hashIdx <= 0) return null;
    return asStageId(selectedRuntimeStageId.slice(0, hashIdx));
  }, [selectedRuntimeStageId]);
  const ChainPane = useMemo13(
    () => slots?.chain ?? DefaultChainPane,
    [slots?.chain]
  );
  const CommitPane = useMemo13(
    () => slots?.commitInspector ?? DefaultCommitPane,
    [slots?.commitInspector]
  );
  const NodePane = useMemo13(
    () => slots?.nodeInspector ?? DefaultNodePane,
    [slots?.nodeInspector]
  );
  const SliderPane = useMemo13(() => {
    if (slots && "slider" in slots) {
      return slots.slider ?? null;
    }
    return DefaultSliderPane;
  }, [slots]);
  const chain = useTranslator(
    bundle.commitFlow,
    () => buildCommitChainTree(bundle.structure.getGraph(), bundle.commitFlow.getIndex())
  );
  const commitIndex = useTranslator(
    bundle.commitFlow,
    () => bundle.commitFlow.getIndex()
  );
  const nodeIndex = useTranslator(bundle.nodeView, () => bundle.nodeView.getIndex());
  const handleStageNavigate = useCallback7(
    (stageId) => {
      const candidates = commitIndex.commits.filter((c) => c.stageId === stageId);
      const first = candidates[0];
      handleSelect(first ? first.runtimeStageId : null);
    },
    [commitIndex, handleSelect]
  );
  const revealedThroughCommitIdx = useMemo13(() => {
    if (!selectedRuntimeStageId) return null;
    const view = commitIndex.byRuntimeStageId.get(selectedRuntimeStageId);
    return view ? view.commitIdx : -1;
  }, [selectedRuntimeStageId, commitIndex]);
  const layoutStyle = useMemo13(
    () => SliderPane ? SHELL_STYLE_WITH_SLIDER : SHELL_STYLE_NO_SLIDER,
    [SliderPane]
  );
  return /* @__PURE__ */ jsxs20("div", { className, style: { ...layoutStyle, ...style }, children: [
    SliderPane && /* @__PURE__ */ jsx24(Pane, { area: "slider", children: /* @__PURE__ */ jsx24(
      SliderPane,
      {
        index: commitIndex,
        cursorRuntimeStageId: selectedRuntimeStageId,
        onCursorChange: handleSelect
      }
    ) }),
    /* @__PURE__ */ jsx24(Pane, { area: "chain", children: /* @__PURE__ */ jsx24(
      ChainPane,
      {
        chain,
        selectedRuntimeStageId,
        onSelectCommit: handleSelectCommit,
        revealedThroughCommitIdx
      }
    ) }),
    /* @__PURE__ */ jsx24(Pane, { area: "commit", children: /* @__PURE__ */ jsx24(
      CommitPane,
      {
        index: commitIndex,
        selectedRuntimeStageId,
        onNavigate: handleSelectCommit
      }
    ) }),
    /* @__PURE__ */ jsx24(Pane, { area: "node", children: /* @__PURE__ */ jsx24(
      NodePane,
      {
        index: nodeIndex,
        selectedStageId,
        onNavigate: handleStageNavigate
      }
    ) })
  ] });
}
function DefaultChainPane({
  chain,
  selectedRuntimeStageId,
  onSelectCommit,
  revealedThroughCommitIdx
}) {
  return /* @__PURE__ */ jsx24(
    CommitChainView,
    {
      chain,
      selectedRuntimeStageId,
      onSelectCommit,
      revealedThroughCommitIdx
    }
  );
}
function DefaultCommitPane({
  index,
  selectedRuntimeStageId,
  onNavigate
}) {
  return /* @__PURE__ */ jsx24(
    CommitInspector,
    {
      index,
      selectedRuntimeStageId,
      onNavigate
    }
  );
}
function DefaultNodePane({ index, selectedStageId, onNavigate }) {
  return /* @__PURE__ */ jsx24(NodeInspector, { index, selectedId: selectedStageId, onNavigate });
}
function DefaultSliderPane({
  index,
  cursorRuntimeStageId,
  onCursorChange
}) {
  return /* @__PURE__ */ jsx24(
    RunSlider,
    {
      index,
      cursorRuntimeStageId,
      onCursorChange
    }
  );
}
var SHELL_STYLE_WITH_SLIDER = {
  display: "grid",
  gridTemplateColumns: "minmax(280px, 1fr) minmax(320px, 1fr)",
  gridTemplateRows: "auto 1fr auto",
  gridTemplateAreas: '"slider slider" "chain commit" "node node"',
  gap: 12,
  padding: 12,
  background: theme.bgPrimary,
  color: theme.textPrimary
};
var SHELL_STYLE_NO_SLIDER = {
  display: "grid",
  gridTemplateColumns: "minmax(280px, 1fr) minmax(320px, 1fr)",
  gridTemplateRows: "1fr auto",
  gridTemplateAreas: '"chain commit" "node node"',
  gap: 12,
  padding: 12,
  background: theme.bgPrimary,
  color: theme.textPrimary
};
var PANE_BASE_STYLE = {
  border: `1px solid ${theme.border}`,
  borderRadius: 6,
  background: theme.bgSecondary,
  overflow: "auto",
  minHeight: 0
  // permit shrinking inside grid
};
function Pane({ area, children }) {
  return /* @__PURE__ */ jsx24("div", { role: "region", "aria-label": area, style: { ...PANE_BASE_STYLE, gridArea: area }, children });
}

// src/adapters/overlayFromSnapshot.ts
function baseStageIdOf3(runtimeStageId) {
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
      const stageId = baseStageIdOf3(runtimeStageId);
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

// src/components/GroupedFlowInvestigation/GroupedFlowInvestigation.tsx
import { useEffect as useEffect10, useMemo as useMemo15, useRef as useRef10, useState as useState12 } from "react";

// src/_internal/useIsomorphicLayoutEffect.ts
import { useEffect as useEffect9, useLayoutEffect } from "react";
var useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect9 : useLayoutEffect;

// src/components/InvestigationPanel/InvestigationPanel.tsx
import { useMemo as useMemo14, useRef as useRef9, useState as useState11 } from "react";

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
import { useRef as useRef8, useState as useState10 } from "react";
function useInvestigationQuery(port, admit) {
  const owner = port.binding;
  const currentOwner = useRef8(null);
  const active = useRef8(null);
  const [state, setState] = useState10(null);
  const [selection, setSelection] = useState10(null);
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
import { Fragment as Fragment7, jsx as jsx25, jsxs as jsxs21 } from "react/jsx-runtime";
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
  return /* @__PURE__ */ jsx25(Fragment7, { children: marks.map((mark, index) => /* @__PURE__ */ jsx25(
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
  return /* @__PURE__ */ jsx25(Fragment7, { children: gaps.map((gap, index) => /* @__PURE__ */ jsx25("p", { role: "status", children: gapMessages[gap.code] }, index)) });
}
function InvestigationPanel(props) {
  if (!props.port)
    return /* @__PURE__ */ jsxs21(
      "section",
      {
        "aria-label": "Investigation",
        className: props.className,
        style: { ...box, ...props.style },
        children: [
          /* @__PURE__ */ jsx25("h2", { children: "Needs attention" }),
          /* @__PURE__ */ jsx25("p", { role: "status", children: "Investigation is unavailable for this recording." })
        ]
      }
    );
  return /* @__PURE__ */ jsx25(BoundInvestigationPanel, { ...props, port: props.port });
}
function BoundInvestigationPanel(props) {
  const controller = useInvestigationQuery(props.port, admitExplanation);
  return /* @__PURE__ */ jsx25(InvestigationPanelView, { ...props, controller });
}
function InvestigationPanelView({ port, className, style, controller, showAttention = true, focusExternalRequests = true }) {
  const attention = useMemo14(
    () => showAttention ? admitAttention(port.attention) : void 0,
    [port.attention, showAttention]
  );
  const { owner, currentOwner, active, selected } = controller;
  const explanationElement = useRef9(null);
  const attentionElements = useRef9(/* @__PURE__ */ new Map());
  const returnTo = useRef9(null);
  const focusIntent = useRef9(null);
  const [page, setPage] = useState11({ owner, count: 20 });
  const visible = page.owner === owner ? page.count : 20;
  const [showPath, setShowPath] = useState11(false);
  const [showImpact, setShowImpact] = useState11(false);
  const [showAlternatives, setShowAlternatives] = useState11(false);
  const lastRequest = useRef9(null);
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
  const item = (nodeId, index) => /* @__PURE__ */ jsxs21("li", { style: row, children: [
    /* @__PURE__ */ jsx25("span", { children: label(nodeId) }),
    " ",
    /* @__PURE__ */ jsx25(
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
  return /* @__PURE__ */ jsxs21(
    "section",
    {
      "aria-label": "Investigation",
      className,
      style: { ...box, ...style },
      children: [
        /* @__PURE__ */ jsx25("h2", { style: { marginBlockStart: 0 }, children: showAttention ? "Needs attention" : "Understand this step" }),
        /* @__PURE__ */ jsx25("p", { style: { color: theme.textSecondary }, children: "Choose an item to inspect its recorded causes and effects." }),
        showAttention && (!attention ? /* @__PURE__ */ jsx25("p", { role: "alert", children: "The attention list could not be verified." }) : /* @__PURE__ */ jsxs21(Fragment7, { children: [
          /* @__PURE__ */ jsx25(Gaps, { gaps: attention.gaps }),
          attention.confidence === "incomplete" && attention.nodes.length > 0 && /* @__PURE__ */ jsx25("p", { role: "status", children: "Attention coverage is incomplete. Other outcomes remain unknown." }),
          !attention.nodes.length ? /* @__PURE__ */ jsx25("p", { children: attention.confidence === "incomplete" || attention.gaps.length ? "No attention items are available. Coverage is unknown." : "No attention items were reported in the supplied evidence." }) : /* @__PURE__ */ jsx25("ul", { style: { listStyle: "none", padding: 0 }, children: attention.nodes.slice(0, selected ? 20 : visible).map((node, index) => /* @__PURE__ */ jsxs21("li", { style: row, children: [
            /* @__PURE__ */ jsx25("div", { children: label(node.nodeId) }),
            /* @__PURE__ */ jsx25(Badges, { marks: node.attention }),
            " ",
            /* @__PURE__ */ jsx25(
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
          !selected && attention.nodes.length > visible && /* @__PURE__ */ jsx25(
            "button",
            {
              type: "button",
              style: button,
              onClick: () => setPage({ owner, count: visible + 20 }),
              children: "Show more attention items"
            }
          )
        ] })),
        selected && /* @__PURE__ */ jsxs21(
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
              /* @__PURE__ */ jsx25("button", { type: "button", style: button, onClick: close, children: "Close investigation" }),
              /* @__PURE__ */ jsx25("h3", { children: label(selected.nodeId) }),
              selected.status === "loading" ? /* @__PURE__ */ jsx25("p", { role: "status", children: "Loading explanation\u2026" }) : selected.status === "error" ? /* @__PURE__ */ jsxs21(Fragment7, { children: [
                /* @__PURE__ */ jsx25("p", { role: "alert", children: "Explanation unavailable. Try again." }),
                /* @__PURE__ */ jsx25(
                  "button",
                  {
                    type: "button",
                    style: button,
                    onClick: () => query(selected.nodeId),
                    children: "Try again"
                  }
                )
              ] }) : selected.status === "refused" ? /* @__PURE__ */ jsxs21(Fragment7, { children: [
                /* @__PURE__ */ jsx25("p", { role: "alert", children: "This explanation could not be verified." }),
                /* @__PURE__ */ jsx25("p", { children: "Its evidence is unsupported, too large, or from a different selection." })
              ] }) : /* @__PURE__ */ jsxs21(Fragment7, { children: [
                /* @__PURE__ */ jsx25(Badges, { marks: selected.result.attention }),
                /* @__PURE__ */ jsx25("h4", { children: selected.result.rootCause ? "Supported root cause" : "Root cause unknown" }),
                selected.result.rootCause && /* @__PURE__ */ jsx25("p", { children: label(selected.result.rootCause) }),
                !selected.result.rootCause && /* @__PURE__ */ jsx25("p", { children: "The supplied evidence does not establish one root cause." }),
                !!selected.result.gaps.length && /* @__PURE__ */ jsx25("h4", { children: "Evidence coverage" }),
                /* @__PURE__ */ jsx25(Gaps, { gaps: selected.result.gaps }),
                selected.result.confidence === "incomplete" && !selected.result.gaps.length && /* @__PURE__ */ jsx25("p", { role: "status", children: "The recorded explanation is incomplete." }),
                /* @__PURE__ */ jsxs21("details", { children: [
                  /* @__PURE__ */ jsx25("summary", { children: "Recorded evidence references" }),
                  /* @__PURE__ */ jsx25("ul", { children: [
                    ...selected.result.attention.flatMap(
                      (mark) => mark.evidence
                    ),
                    ...selected.result.gaps.flatMap((gap) => gap.evidence),
                    ...selected.result.impact.gaps.flatMap(
                      (gap) => gap.evidence
                    )
                  ].map((reference, index) => /* @__PURE__ */ jsx25("li", { children: reference }, index)) })
                ] }),
                /* @__PURE__ */ jsx25(
                  "button",
                  {
                    type: "button",
                    style: button,
                    "aria-expanded": showPath,
                    onClick: () => setShowPath((value) => !value),
                    children: showPath ? "Hide recorded path" : "Show recorded path"
                  }
                ),
                showPath && /* @__PURE__ */ jsxs21(Fragment7, { children: [
                  /* @__PURE__ */ jsx25("h4", { children: "Recorded dependency path" }),
                  selected.result.path.length ? /* @__PURE__ */ jsx25("ol", { children: selected.result.path.map(item) }) : /* @__PURE__ */ jsx25("p", { children: "No dependency path was supplied." })
                ] }),
                !!selected.result.alternatives.length && /* @__PURE__ */ jsxs21(Fragment7, { children: [
                  /* @__PURE__ */ jsx25("h4", { children: "Alternative candidates" }),
                  /* @__PURE__ */ jsx25("p", { children: "These candidates remain uncertain." }),
                  /* @__PURE__ */ jsx25(
                    "button",
                    {
                      type: "button",
                      style: button,
                      "aria-expanded": showAlternatives,
                      onClick: () => setShowAlternatives((value) => !value),
                      children: showAlternatives ? "Hide alternative candidates" : "Show alternative candidates"
                    }
                  ),
                  showAlternatives && /* @__PURE__ */ jsx25("ul", { children: selected.result.alternatives.map(item) })
                ] }),
                /* @__PURE__ */ jsx25("div", { style: { marginBlockStart: 16 }, children: /* @__PURE__ */ jsx25(
                  "button",
                  {
                    type: "button",
                    style: button,
                    "aria-expanded": showImpact,
                    onClick: () => setShowImpact((value) => !value),
                    children: showImpact ? "Hide affected items" : "Show affected items"
                  }
                ) }),
                showImpact && /* @__PURE__ */ jsxs21(Fragment7, { children: [
                  /* @__PURE__ */ jsx25("h4", { children: "Affected items" }),
                  /* @__PURE__ */ jsx25(Gaps, { gaps: selected.result.impact.gaps }),
                  selected.result.impact.confidence === "incomplete" && /* @__PURE__ */ jsx25("p", { role: "status", children: "Affected-item coverage is incomplete. Unlisted items remain unknown." }),
                  selected.result.impact.nodes.length ? /* @__PURE__ */ jsx25("ul", { children: selected.result.impact.nodes.map(item) }) : /* @__PURE__ */ jsx25("p", { children: "No affected items were reported in the supplied evidence." })
                ] })
              ] })
            ]
          }
        )
      ]
    }
  );
}

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
import { jsx as jsx26, jsxs as jsxs22 } from "react/jsx-runtime";
function DependencyEvidence({ result, direction, labels }) {
  const source = direction === "cause" ? result.backward : result.impact;
  if (!source?.edges) return null;
  return /* @__PURE__ */ jsxs22("details", { children: [
    /* @__PURE__ */ jsxs22("summary", { children: [
      "Recorded dependency evidence (",
      source.edges.length,
      ")"
    ] }),
    /* @__PURE__ */ jsx26("p", { children: "These are the returned relationships, including references outside this diagram. Names do not establish identity or a cause." }),
    /* @__PURE__ */ jsx26("ol", { children: source.edges.slice(0, 64).map((edge, index) => /* @__PURE__ */ jsxs22("li", { children: [
      /* @__PURE__ */ jsxs22("span", { children: [
        displayLabel(labels, edge.from),
        " \u2192 ",
        displayLabel(labels, edge.to),
        " \xB7 ",
        edge.kind,
        " \xB7 ",
        edge.attribution
      ] }),
      /* @__PURE__ */ jsx26("ul", { children: edge.evidence.map((reference, at) => /* @__PURE__ */ jsx26("li", { children: reference }, at)) })
    ] }, index)) }),
    source.edges.length > 64 && /* @__PURE__ */ jsxs22("p", { children: [
      source.edges.length - 64,
      " additional relationships are retained in the admitted result and not expanded here."
    ] }),
    !source.edges.length && /* @__PURE__ */ jsx26("p", { children: "No relationships were returned for this direction. This is not evidence of success or absence of external effects." })
  ] });
}

// src/components/GroupedFlowInvestigation/GroupedFlowInvestigation.tsx
import { jsx as jsx27, jsxs as jsxs23 } from "react/jsx-runtime";
var action = { font: "inherit", fontSize: 12, border: `1px solid ${theme.border}`, borderRadius: 8, padding: "7px 12px", background: theme.bgElevated, color: theme.textPrimary, cursor: "pointer" };
function GroupedFlowInvestigation(props) {
  const admitted = useMemo15(() => {
    return projectGroupedFlowDiagram(props.definition, { observation: props.observation });
  }, [props.definition, props.observation]);
  if (!admitted.model) return /* @__PURE__ */ jsx27(GroupedFlowDiagram, { definition: props.definition, observation: props.observation, className: props.className, style: props.style });
  if (!props.port) return /* @__PURE__ */ jsxs23("section", { className: props.className, style: props.style, children: [
    /* @__PURE__ */ jsx27(GroupedFlowDiagram, { definition: admitted.model.definition, observation: props.observation, direction: props.direction }),
    /* @__PURE__ */ jsx27(InvestigationPanel, { port: null })
  ] });
  return /* @__PURE__ */ jsx27(BoundGroupedFlowInvestigation, { ...props, port: props.port, admitted: admitted.model });
}
function BoundGroupedFlowInvestigation({ admitted, port, ...props }) {
  const controller = useInvestigationQuery(port, admitVisualExplanation);
  const { owner, selected } = controller;
  const ready = selected?.status === "ready" ? selected : void 0;
  const wrapper = useRef10(null);
  const [narrow, setNarrow] = useState12(false);
  const [expansion, setExpansion] = useState12({ owner, ids: [] });
  const [mode, setMode] = useState12();
  const [focusCommand, setFocusCommand] = useState12();
  const phase = mode && mode.request === selected?.request ? mode.value : "cause";
  const diagramBindings = useRef10(/* @__PURE__ */ new WeakMap());
  const nextDiagramBinding = useRef10(0);
  const diagramBindingKey = useMemo15(() => {
    let key = diagramBindings.current.get(owner);
    if (key === void 0) {
      key = nextDiagramBinding.current++;
      diagramBindings.current.set(owner, key);
    }
    return key;
  }, [owner]);
  const known = useMemo15(() => new Map(admitted.definition.nodes.map((node) => [node.id, node])), [admitted.definition]);
  const states = useMemo15(() => new Map(Object.entries(admitted.nodeStates ?? {})), [admitted]);
  const projected = useMemo15(() => ready ? projectInvestigation(admitted.definition, ready.result, phase) : void 0, [admitted.definition, ready, phase]);
  const currentIds = expansion.owner === owner ? expansion.ids : [];
  const automaticExpansion = useRef10(void 0);
  const needsReveal = ready && (automaticExpansion.current?.request !== ready.request || automaticExpansion.current?.phase !== phase);
  const expandedGroupIds = needsReveal ? [.../* @__PURE__ */ new Set([...currentIds, ...projected?.groupIds ?? []])] : currentIds;
  useIsomorphicLayoutEffect(() => {
    if (!ready || !needsReveal) return;
    automaticExpansion.current = { request: ready.request, phase };
    setExpansion({ owner, ids: expandedGroupIds });
  });
  useEffect10(() => {
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
  const cameraKey = useMemo15(() => ({ owner, request: ready?.request, phase, command: activeFocusCommand }), [owner, ready?.request, phase, activeFocusCommand]);
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
  return /* @__PURE__ */ jsxs23(
    "section",
    {
      ref: wrapper,
      className: props.className,
      "aria-label": props["aria-label"] ?? "Grouped flow investigation",
      style: { display: "grid", gap: 16, minWidth: 0, color: theme.textPrimary, fontFamily: theme.fontSans, ...props.style },
      children: [
        /* @__PURE__ */ jsx27("div", { role: "status", "aria-label": "Cause summary", "aria-live": "polite", style: { padding: "12px 16px", border: `1px solid ${theme.border}`, borderRadius: 10, background: theme.bgElevated }, children: /* @__PURE__ */ jsx27("strong", { children: summary }) }),
        /* @__PURE__ */ jsx27(
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
            focusRequest: ready && focusNodeIds.length ? { key: cameraKey, nodeIds: focusNodeIds } : void 0
          },
          diagramBindingKey
        ),
        /* @__PURE__ */ jsxs23("div", { style: { display: "flex", flexWrap: "wrap", gap: 8 }, children: [
          /* @__PURE__ */ jsx27("button", { type: "button", style: action, disabled: !selectedId || selected?.status === "loading", onClick: () => {
            if (selectedId) controller.query(selectedId);
          }, children: "Investigate selected item" }),
          /* @__PURE__ */ jsx27("button", { type: "button", style: action, disabled: !ready, "aria-pressed": phase === "cause", onClick: () => {
            if (ready) setMode({ request: ready.request, value: "cause" });
          }, children: "Why it happened" }),
          /* @__PURE__ */ jsx27("button", { type: "button", style: action, disabled: !ready, "aria-pressed": phase === "impact", onClick: () => {
            if (ready) setMode({ request: ready.request, value: "impact" });
          }, children: "What it affected" }),
          /* @__PURE__ */ jsx27("button", { type: "button", style: action, disabled: !ready || !selectedId, onClick: () => {
            if (ready) setFocusCommand((previous) => ({ request: ready.request, phase, count: (previous?.count ?? 0) + 1 }));
          }, children: "Back to selected item" })
        ] }),
        projected && /* @__PURE__ */ jsxs23("div", { role: "status", children: [
          /* @__PURE__ */ jsx27("p", { children: phase === "cause" ? "Dependency arrows point from an item toward its recorded source. They do not show execution order or prove how a value was used." : "Arrows show returned recorded relationships to linked items, not proof of harm or delivery." }),
          !projected.relationshipsAvailable && /* @__PURE__ */ jsx27("p", { children: phase === "cause" ? "Backward connections were not provided. References can be shown, but missing links remain unknown." : "Impact connections were not provided. The full effect of these references remains unknown." }),
          projected.confidence === "incomplete" && /* @__PURE__ */ jsx27("p", { children: "Some evidence is missing. The highlighted references do not establish the full dependency picture." }),
          projected.unmapped > 0 && /* @__PURE__ */ jsxs23("p", { children: [
            projected.unmapped,
            " recorded ",
            projected.unmapped === 1 ? "item is" : "items are",
            " not shown in this diagram. No substitute item has been selected."
          ] })
        ] }),
        /* @__PURE__ */ jsx27(InvestigationPanelView, { port, controller, showAttention: false, focusExternalRequests: false }),
        ready && /* @__PURE__ */ jsx27(DependencyEvidence, { result: ready.result, direction: phase, labels: port.labels })
      ]
    }
  );
}
export {
  CommitChainView,
  CommitInspector,
  GROUP_CONTAINER_NODE_TYPE,
  GroupContainerNode,
  GroupedFlowDiagram,
  GroupedFlowInvestigation,
  LoopBackEdge,
  MAIN_CHART_BOX_ID,
  NodeInspector,
  RunSlider,
  SlotPillNode,
  SmartStepEdge,
  StageNode,
  SubflowBreadcrumb,
  SubflowTree,
  TimeTravelDebugger,
  TraceExplorerShell,
  TraceFlow,
  TracedFlow,
  applyGroupLayout,
  asRuntimeStageId,
  asStageId,
  backtraceDataFlow,
  backtraceStructural,
  buildCommitChainTree,
  buildSubflowBreadcrumb,
  collapseTraceGraph,
  createCommitFlowRecorder,
  createDagreTraceLayout,
  createGroupedLayout,
  createMainChartBoxLayout,
  createNodeViewRecorder,
  createSnappedDagreLayout,
  createTraceBundle,
  createTraceGroupLayout,
  createTraceRuntimeOverlay,
  createTraceStructureRecorder,
  dagreTraceLayout,
  defaultTraceFlowLayout,
  filterGraphForDrill,
  forwardtraceStructural,
  getFlowDiagramAncestors,
  graphFromStructure,
  overlayFromSnapshot,
  projectGroupedFlowDiagram,
  sliceOverlay,
  snapLinearSuccessors,
  structureAsChainTree,
  traceGroupLayout,
  useSubflowNavigation,
  useTranslator,
  walkBackward,
  walkForward,
  wrapInMainChartBox
};
//# sourceMappingURL=flowchart.js.map