"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/flowchart.ts
var flowchart_exports = {};
__export(flowchart_exports, {
  FlowchartView: () => FlowchartView,
  StageNode: () => StageNode,
  SubflowBreadcrumb: () => SubflowBreadcrumb,
  SubflowTree: () => SubflowTree,
  TimeTravelDebugger: () => TimeTravelDebugger,
  TracedFlowchartView: () => TracedFlowchartView,
  applyOverlay: () => applyOverlay,
  specToLayout: () => specToLayout,
  specToReactFlow: () => specToReactFlow,
  useSubflowNavigation: () => useSubflowNavigation
});
module.exports = __toCommonJS(flowchart_exports);

// src/components/FlowchartView/FlowchartView.tsx
var import_react5 = require("react");
var import_react6 = require("@xyflow/react");

// src/components/StageNode/StageNode.tsx
var import_react3 = require("react");
var import_react4 = require("@xyflow/react");

// src/theme/ThemeProvider.tsx
var import_react = require("react");

// src/theme/tokens.ts
var rawDefaults = {
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
var import_jsx_runtime = require("react/jsx-runtime");
var ThemeContext = (0, import_react.createContext)({});

// src/theme/styles.ts
function v(varName, fallback) {
  return `var(${varName}, ${fallback})`;
}
var theme = {
  primary: v("--fp-color-primary", "#6366f1"),
  success: v("--fp-color-success", "#22c55e"),
  error: v("--fp-color-error", "#ef4444"),
  warning: v("--fp-color-warning", "#f59e0b"),
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

// src/theme/useDarkModeTokens.ts
var import_react2 = require("react");

// src/components/StageNode/StageNode.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
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
      return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("svg", { ...props, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: "8", cy: "8", r: "6", stroke: color, strokeWidth: "1.5" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M5.5 8C5.5 6.5 6.5 5 8 5S10.5 6.5 10.5 8", stroke: color, strokeWidth: "1.2", strokeLinecap: "round" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: "8", cy: "9.5", r: "1", fill: color }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("line", { x1: "8", y1: "2", x2: "8", y2: "3.5", stroke: color, strokeWidth: "1", strokeLinecap: "round" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("line", { x1: "12.5", y1: "4", x2: "11.2", y2: "5", stroke: color, strokeWidth: "1", strokeLinecap: "round" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("line", { x1: "3.5", y1: "4", x2: "4.8", y2: "5", stroke: color, strokeWidth: "1", strokeLinecap: "round" })
      ] });
    // Tool / function call — gear
    case "tool":
    case "function":
      return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("svg", { ...props, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: "8", cy: "8", r: "3", stroke: color, strokeWidth: "1.5" }),
        [0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
          const rad = angle * Math.PI / 180;
          const x1 = 8 + Math.cos(rad) * 4.5;
          const y1 = 8 + Math.sin(rad) * 4.5;
          const x2 = 8 + Math.cos(rad) * 6;
          const y2 = 8 + Math.sin(rad) * 6;
          return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("line", { x1, y1, x2, y2, stroke: color, strokeWidth: "1.5", strokeLinecap: "round" }, angle);
        })
      ] });
    // RAG / retrieval — magnifying glass + doc
    case "rag":
    case "search":
    case "retrieval":
      return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("svg", { ...props, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: "7", cy: "7", r: "4", stroke: color, strokeWidth: "1.5" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("line", { x1: "10", y1: "10", x2: "13.5", y2: "13.5", stroke: color, strokeWidth: "1.5", strokeLinecap: "round" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("line", { x1: "5.5", y1: "6", x2: "8.5", y2: "6", stroke: color, strokeWidth: "1", strokeLinecap: "round" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("line", { x1: "5.5", y1: "8", x2: "7.5", y2: "8", stroke: color, strokeWidth: "1", strokeLinecap: "round" })
      ] });
    // Parse / process — diamond with arrows
    case "parse":
    case "process":
    case "transform":
      return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("svg", { ...props, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("rect", { x: "4", y: "4", width: "8", height: "8", rx: "1.5", stroke: color, strokeWidth: "1.5", transform: "rotate(45 8 8)" }) });
    // Start / seed — play triangle
    case "start":
    case "seed":
    case "init":
      return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("svg", { ...props, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M5 3.5L12.5 8L5 12.5V3.5Z", fill: color, opacity: "0.8" }) });
    // End / finalize — stop square
    case "end":
    case "finalize":
    case "output":
      return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("svg", { ...props, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("rect", { x: "4", y: "4", width: "8", height: "8", rx: "1.5", fill: color, opacity: "0.8" }) });
    // Agent — person silhouette
    case "agent":
    case "orchestrator":
      return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("svg", { ...props, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: "8", cy: "5", r: "2.5", stroke: color, strokeWidth: "1.5" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M3.5 14C3.5 11 5.5 9 8 9S12.5 11 12.5 14", stroke: color, strokeWidth: "1.5", strokeLinecap: "round" })
      ] });
    // Swarm — multi-agent
    case "swarm":
    case "multi-agent":
      return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("svg", { ...props, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: "5", cy: "5", r: "2", stroke: color, strokeWidth: "1.2" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: "11", cy: "5", r: "2", stroke: color, strokeWidth: "1.2" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: "8", cy: "11", r: "2", stroke: color, strokeWidth: "1.2" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("line", { x1: "5", y1: "7", x2: "8", y2: "9", stroke: color, strokeWidth: "1", opacity: "0.5" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("line", { x1: "11", y1: "7", x2: "8", y2: "9", stroke: color, strokeWidth: "1", opacity: "0.5" })
      ] });
    // Guard / guardrail — shield
    case "guard":
    case "guardrail":
    case "validate":
      return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("svg", { ...props, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M8 2L3 5V9C3 11.5 5 13.5 8 14.5C11 13.5 13 11.5 13 9V5L8 2Z", stroke: color, strokeWidth: "1.5", strokeLinejoin: "round" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M6 8L7.5 9.5L10 6.5", stroke: color, strokeWidth: "1.2", strokeLinecap: "round", strokeLinejoin: "round" })
      ] });
    // Stream — wave
    case "stream":
    case "streaming":
      return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("svg", { ...props, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M2 8C4 5 6 11 8 8S12 5 14 8", stroke: color, strokeWidth: "1.5", strokeLinecap: "round", fill: "none" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M2 11C4 8 6 14 8 11S12 8 14 11", stroke: color, strokeWidth: "1", strokeLinecap: "round", fill: "none", opacity: "0.5" })
      ] });
    // Memory / state — database cylinder
    case "memory":
    case "state":
    case "db":
      return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("svg", { ...props, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("ellipse", { cx: "8", cy: "4.5", rx: "5", ry: "2", stroke: color, strokeWidth: "1.3" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("line", { x1: "3", y1: "4.5", x2: "3", y2: "11.5", stroke: color, strokeWidth: "1.3" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("line", { x1: "13", y1: "4.5", x2: "13", y2: "11.5", stroke: color, strokeWidth: "1.3" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("ellipse", { cx: "8", cy: "11.5", rx: "5", ry: "2", stroke: color, strokeWidth: "1.3" })
      ] });
    // Loop — circular arrow
    case "loop":
    case "retry":
      return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("svg", { ...props, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M12 8A4 4 0 1 1 8 4", stroke: color, strokeWidth: "1.5", strokeLinecap: "round", fill: "none" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M8 1.5L10.5 4L8 6.5", stroke: color, strokeWidth: "1.3", strokeLinecap: "round", strokeLinejoin: "round", fill: "none" })
      ] });
    // Lazy / service — cloud (deferred resolution, loaded on demand)
    case "lazy":
    case "service":
    case "cloud":
      return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("svg", { ...props, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
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
      return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("svg", { ...props, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M8 2L14 8L8 14L2 8Z", stroke: color, strokeWidth: "1.5", fill: "none" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: "8", cy: "8", r: "1.5", fill: color })
      ] });
    default:
      return null;
  }
}
var StageNode = (0, import_react3.memo)(function StageNode2({
  data
}) {
  const { label, active, done, error, linked, icon, stepNumbers, dimmed, isSubflow, isLazy, isDecider, isFork, description } = data;
  const effectiveIcon = icon || (isLazy ? "lazy" : void 0);
  const isLazyUnresolved = isLazy && !done && !active;
  const injectedRef = (0, import_react3.useRef)(false);
  (0, import_react3.useEffect)(() => {
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
  const bg = active ? theme.primary : done ? theme.success : error ? theme.error : theme.bgSecondary;
  const borderColor = active ? theme.primary : done ? theme.success : error ? theme.error : theme.border;
  const shadow = active ? `0 0 16px color-mix(in srgb, ${theme.primary} 40%, transparent)` : done ? `0 0 8px color-mix(in srgb, ${theme.success} 20%, transparent)` : error ? `0 0 12px color-mix(in srgb, ${theme.error} 30%, transparent)` : `0 2px 8px rgba(0,0,0,0.15)`;
  const textColor = active || done || error ? "#fff" : theme.textPrimary;
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_react4.Handle, { type: "target", position: import_react4.Position.Top, style: { opacity: 0 } }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
      "div",
      {
        style: {
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: 6
        },
        children: [
          stepNumbers && stepNumbers.length > 0 && isOnPath && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
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
                const badgeBg = isLatest && active ? theme.primary : theme.success;
                const glow = isLatest && active ? `color-mix(in srgb, ${theme.primary} 50%, transparent)` : `color-mix(in srgb, ${theme.success} 40%, transparent)`;
                return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
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
          linked && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
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
          active && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "div",
            {
              style: {
                position: "absolute",
                inset: -6,
                borderRadius: isDecider ? 0 : `calc(${theme.radius} + 4px)`,
                clipPath: isDecider ? "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" : void 0,
                border: `2px solid ${theme.primary}`,
                opacity: 0.3,
                animation: "fp-pulse 1.5s ease-out infinite"
              }
            }
          ),
          isDecider ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { position: "relative", width: 120, height: 72 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
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
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
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
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
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
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 4 }, children: [
                    effectiveIcon && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(StageIcon, { type: effectiveIcon, color: textColor }),
                    !effectiveIcon && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: { fontSize: 9, color: textColor }, children: "\u25C7" }),
                    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
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
                  description && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
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
                  )
                ]
              }
            )
          ] }) : (
            /* Standard rectangular node */
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
              "div",
              {
                style: {
                  background: bg,
                  border: `2px ${isLazyUnresolved ? "dashed" : "solid"} ${borderColor}`,
                  borderRadius: theme.radius,
                  padding: description ? "8px 16px" : "10px 20px",
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
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6 }, children: [
                    effectiveIcon && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(StageIcon, { type: effectiveIcon, color: textColor }),
                    done && !effectiveIcon && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: { fontSize: 10, color: textColor }, children: "\u2713" }),
                    active && !effectiveIcon && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
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
                    error && !effectiveIcon && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: { fontSize: 10, color: textColor }, children: "\u2717" }),
                    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                      "span",
                      {
                        style: {
                          fontSize: 13,
                          fontWeight: 500,
                          color: textColor,
                          whiteSpace: "nowrap"
                        },
                        children: label
                      }
                    ),
                    isSubflow && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
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
                        children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
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
                  description && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
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
                  )
                ]
              }
            )
          )
        ]
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_react4.Handle, { type: "source", position: import_react4.Position.Bottom, style: { opacity: 0 } }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      import_react4.Handle,
      {
        id: "loop-source",
        type: "source",
        position: import_react4.Position.Right,
        style: { background: "transparent", border: "none", width: 6, height: 6 }
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      import_react4.Handle,
      {
        id: "loop-target",
        type: "target",
        position: import_react4.Position.Right,
        style: { background: "transparent", border: "none", width: 6, height: 6 }
      }
    )
  ] });
});

// src/components/FlowchartView/FlowchartView.tsx
var import_jsx_runtime3 = require("react/jsx-runtime");
var nodeTypes = { stageNode: StageNode };
function FlowchartView({
  nodes: rawNodes,
  edges: rawEdges,
  snapshots,
  selectedIndex = 0,
  onNodeClick,
  unstyled = false,
  className,
  style
}) {
  const enhancedNodes = (0, import_react5.useMemo)(() => {
    if (!snapshots || snapshots.length === 0) {
      return rawNodes.map((n) => ({
        ...n,
        type: "stageNode",
        data: {
          ...n.data,
          label: n.data.label || n.id,
          active: false,
          done: false,
          error: false
        }
      }));
    }
    const doneNames = new Set(
      snapshots.slice(0, selectedIndex).map((s) => s.stageName)
    );
    const activeName = snapshots[selectedIndex]?.stageName;
    return rawNodes.map((n) => ({
      ...n,
      type: "stageNode",
      data: {
        ...n.data,
        label: n.data.label || n.id,
        active: n.id === activeName,
        done: doneNames.has(n.id),
        error: false
      }
    }));
  }, [rawNodes, snapshots, selectedIndex]);
  const enhancedEdges = (0, import_react5.useMemo)(() => {
    if (!snapshots || snapshots.length === 0) {
      return rawEdges.map((e) => ({
        ...e,
        style: { stroke: theme.textMuted, strokeWidth: 1.5 },
        animated: false
      }));
    }
    const doneNames = new Set(
      snapshots.slice(0, selectedIndex + 1).map((s) => s.stageName)
    );
    const activeName = snapshots[selectedIndex]?.stageName;
    return rawEdges.map((e) => {
      const sourceIsDone = doneNames.has(e.source);
      const isFromActive = e.source === activeName;
      return {
        ...e,
        style: {
          stroke: sourceIsDone ? theme.success : theme.textMuted,
          strokeWidth: 1.5
        },
        animated: isFromActive
      };
    });
  }, [rawEdges, snapshots, selectedIndex]);
  const [nodes, , onNodesChange] = (0, import_react6.useNodesState)(enhancedNodes);
  const [edges, , onEdgesChange] = (0, import_react6.useEdgesState)(enhancedEdges);
  const handleNodeClick = (0, import_react5.useCallback)(
    (_, node) => {
      if (!onNodeClick || !snapshots) return;
      const idx = snapshots.findIndex((s) => s.stageName === node.id);
      if (idx >= 0) onNodeClick(idx);
    },
    [onNodeClick, snapshots]
  );
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
    "div",
    {
      className,
      style: {
        width: "100%",
        height: "100%",
        ...style
      },
      "data-fp": "flowchart-view",
      children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        import_react6.ReactFlow,
        {
          nodes,
          edges,
          onNodesChange,
          onEdgesChange,
          onNodeClick: handleNodeClick,
          nodeTypes,
          fitView: true,
          panOnDrag: false,
          zoomOnScroll: false,
          zoomOnPinch: false,
          zoomOnDoubleClick: false,
          preventScrolling: false,
          nodesDraggable: false,
          nodesConnectable: false,
          elementsSelectable: !!onNodeClick,
          children: !unstyled && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_react6.Background, { variant: import_react6.BackgroundVariant.Dots, gap: 16, size: 1 })
        }
      )
    }
  );
}

// src/components/FlowchartView/TracedFlowchartView.tsx
var import_react8 = require("react");
var import_react9 = require("@xyflow/react");

// src/components/FlowchartView/specToReactFlow.ts
var import_react7 = require("@xyflow/react");
var DEFAULT_COLORS = {
  edgeDefault: rawDefaults.colors.textMuted,
  edgeExecuted: rawDefaults.colors.success,
  edgeActive: rawDefaults.colors.primary,
  edgeLoop: rawDefaults.colors.warning,
  labelDefault: rawDefaults.colors.textSecondary,
  labelExecuted: rawDefaults.colors.success,
  labelLoop: rawDefaults.colors.warning,
  pathGlow: `${rawDefaults.colors.success}4D`
  // ~30% opacity hex
};
var Y_STEP = 100;
var X_SPREAD = 200;
function nid(n) {
  return n.id || n.name || `spec-${Math.random()}`;
}
function registerNode(state, node) {
  if (node.id && node.name) {
    state.idToName.set(node.id, node.name);
  }
}
function walkLayout(node, state, x, y) {
  if (!node) return { lastIds: [], bottomY: y };
  registerNode(state, node);
  const id = nid(node);
  if (state.seen.has(id)) {
    return { lastIds: [id], bottomY: y };
  }
  state.seen.add(id);
  const isDecider = node.type === "decider" || node.type === "selector" || !!node.hasDecider || !!node.hasSelector;
  const isFork = node.type === "fork";
  state.nodes.push({
    id,
    x,
    y,
    label: node.name,
    isDecider,
    isFork,
    description: node.description,
    icon: node.icon,
    subflowId: node.subflowId,
    isSubflow: !!node.isSubflowRoot,
    isLazy: node.isLazy
  });
  let lastIds = [id];
  let bottomY = y;
  if (node.children && node.children.length > 0) {
    const totalWidth = (node.children.length - 1) * X_SPREAD;
    const startX = x - totalWidth / 2;
    const childY = y + Y_STEP;
    const childResults = [];
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      if (!child) continue;
      const childX = startX + i * X_SPREAD;
      const edgeLabel = node.branchIds?.[i];
      state.edgeCounter++;
      state.edges.push({ id: `se${state.edgeCounter}`, source: id, target: nid(child), label: edgeLabel, isLoop: false });
      const result = walkLayout(child, state, childX, childY);
      childResults.push(result);
    }
    lastIds = childResults.flatMap((r) => r.lastIds);
    bottomY = Math.max(...childResults.map((r) => r.bottomY));
  }
  if (node.loopTarget) {
    state.edgeCounter++;
    state.edges.push({ id: `se${state.edgeCounter}`, source: id, target: node.loopTarget, label: "loop", isLoop: true });
  }
  if (node.next) {
    const rawNextId = nid(node.next);
    const resolvedNextId = state.idToName.get(rawNextId) ?? rawNextId;
    const isLoopRef = node.loopTarget && state.seen.has(resolvedNextId);
    if (isLoopRef) {
      for (const lid of lastIds) {
        state.edgeCounter++;
        state.edges.push({ id: `se${state.edgeCounter}`, source: lid, target: resolvedNextId, label: "loop", isLoop: true });
      }
      return { lastIds, bottomY };
    }
    const nextY = bottomY + Y_STEP;
    for (const lid of lastIds) {
      state.edgeCounter++;
      state.edges.push({ id: `se${state.edgeCounter}`, source: lid, target: resolvedNextId, isLoop: false });
    }
    return walkLayout(node.next, state, x, nextY);
  }
  return { lastIds, bottomY };
}
function specToLayout(spec) {
  const state = {
    nodes: [],
    edges: [],
    edgeCounter: 0,
    seen: /* @__PURE__ */ new Set(),
    idToName: /* @__PURE__ */ new Map()
  };
  walkLayout(spec, state, 300, 0);
  return { nodes: state.nodes, edges: state.edges, idToName: state.idToName };
}
function applyOverlay(layout, overlay, colors) {
  const c = { ...DEFAULT_COLORS, ...colors };
  const o = overlay ?? null;
  const nodes = layout.nodes.map((ln) => {
    const isDone = o ? o.doneStages.has(ln.id) : false;
    const isActive = o ? o.activeStage === ln.id : false;
    const wasExecuted = o ? o.executedStages.has(ln.id) : false;
    const dimmed = o && !wasExecuted;
    let stepNumbers;
    if (o?.executionOrder) {
      const nums = [];
      for (let i = 0; i < o.executionOrder.length; i++) {
        if (o.executionOrder[i] === ln.id) nums.push(i + 1);
      }
      if (nums.length > 0) stepNumbers = nums;
    }
    return {
      id: ln.id,
      position: { x: ln.x, y: ln.y },
      data: {
        label: ln.label,
        active: isActive,
        done: isDone,
        error: false,
        isDecider: ln.isDecider,
        isFork: ln.isFork,
        description: ln.description,
        icon: ln.icon,
        subflowId: ln.subflowId,
        dimmed,
        stepNumbers,
        isSubflow: ln.isSubflow,
        isLazy: ln.isLazy
      },
      type: "stage",
      style: dimmed ? { opacity: 0.35 } : void 0
    };
  });
  const edges = [];
  for (const le of layout.edges) {
    const executed = o && o.executedStages.has(le.source) && o.executedStages.has(le.target);
    const isLeadingEdge = o && le.source === o.activeStage && !o.doneStages.has(le.target);
    if (le.isLoop) {
      let loopExecuted = false;
      if (o?.executionOrder) {
        const lastSourceIdx = o.executionOrder.lastIndexOf(le.source);
        if (lastSourceIdx >= 0) {
          loopExecuted = o.executionOrder.slice(lastSourceIdx + 1).includes(le.target);
        }
      }
      edges.push({
        id: le.id,
        source: le.source,
        target: le.target,
        sourceHandle: "loop-source",
        targetHandle: "loop-target",
        label: le.label ?? "loop",
        type: "smoothstep",
        pathOptions: { offset: 100, borderRadius: 24 },
        markerEnd: { type: import_react7.MarkerType.ArrowClosed, color: c.edgeLoop, width: 16, height: 16 },
        style: {
          stroke: c.edgeLoop,
          strokeWidth: loopExecuted ? 3 : 2,
          strokeDasharray: "6 3",
          opacity: o && !loopExecuted ? 0.35 : 1
        },
        labelStyle: { fontSize: 10, fontWeight: 700, fill: c.labelLoop },
        animated: loopExecuted,
        zIndex: 2
      });
    } else if (executed) {
      edges.push({
        id: `${le.id}-glow`,
        source: le.source,
        target: le.target,
        style: { stroke: c.pathGlow, strokeWidth: 8, opacity: 0.4 },
        zIndex: 0,
        selectable: false,
        focusable: false
      });
      edges.push({
        id: le.id,
        source: le.source,
        target: le.target,
        label: le.label,
        style: {
          stroke: isLeadingEdge ? c.edgeActive : c.edgeExecuted,
          strokeWidth: 3.5
        },
        labelStyle: { fontSize: 10, fontWeight: 600, fill: c.labelExecuted },
        animated: !!isLeadingEdge,
        zIndex: 1
      });
    } else {
      edges.push({
        id: le.id,
        source: le.source,
        target: le.target,
        label: le.label,
        style: {
          stroke: c.edgeDefault,
          strokeWidth: 1.5,
          opacity: o ? 0.3 : 1
        },
        labelStyle: { fontSize: 10, fill: c.labelDefault }
      });
    }
  }
  return { nodes, edges };
}
function specToReactFlow(spec, overlay, colors) {
  const layout = specToLayout(spec);
  return applyOverlay(layout, overlay, colors);
}

// src/components/FlowchartView/TracedFlowchartView.tsx
var import_jsx_runtime4 = require("react/jsx-runtime");
var defaultNodeTypes = { stage: StageNode };
function FitViewOnResize() {
  const { fitView } = (0, import_react9.useReactFlow)();
  (0, import_react8.useEffect)(() => {
    const handler = () => {
      requestAnimationFrame(() => fitView({ padding: 0.3 }));
    };
    window.addEventListener("resize", handler);
    const timer = setTimeout(handler, 50);
    return () => {
      window.removeEventListener("resize", handler);
      clearTimeout(timer);
    };
  }, [fitView]);
  return null;
}
function TracedFlowchartView({
  spec,
  snapshots,
  snapshotIndex = 0,
  onNodeClick,
  nodeTypes: customNodeTypes,
  unstyled = false,
  className,
  style
}) {
  const nodeTypes2 = customNodeTypes ?? defaultNodeTypes;
  const overlay = (0, import_react8.useMemo)(() => {
    if (!snapshots || snapshots.length === 0) return void 0;
    const executionOrder = snapshots.slice(0, snapshotIndex + 1).map((s) => s.stageLabel);
    const doneStages = new Set(
      snapshots.slice(0, snapshotIndex).map((s) => s.stageLabel)
    );
    const activeStage = snapshots[snapshotIndex]?.stageLabel ?? null;
    const executedStages = /* @__PURE__ */ new Set([...doneStages]);
    if (activeStage) executedStages.add(activeStage);
    return { doneStages, activeStage, executedStages, executionOrder };
  }, [snapshots, snapshotIndex]);
  const layout = (0, import_react8.useMemo)(() => {
    if (!spec) return null;
    return specToLayout(spec);
  }, [spec]);
  const flowData = (0, import_react8.useMemo)(() => {
    if (!layout) return { nodes: [], edges: [] };
    return applyOverlay(layout, overlay);
  }, [layout, overlay]);
  const [nodes, setNodes, onNodesChange] = (0, import_react9.useNodesState)(flowData.nodes);
  const [edges, setEdges, onEdgesChange] = (0, import_react9.useEdgesState)(flowData.edges);
  (0, import_react8.useEffect)(() => {
    setNodes(flowData.nodes);
    setEdges(flowData.edges);
  }, [flowData, setNodes, setEdges]);
  const handleNodeClick = (0, import_react8.useCallback)(
    (_, node) => {
      if (!onNodeClick) return;
      onNodeClick(node.id);
    },
    [onNodeClick]
  );
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
    "div",
    {
      className,
      style: { width: "100%", height: "100%", ...style },
      "data-fp": "traced-flowchart",
      children: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
        import_react9.ReactFlow,
        {
          nodes,
          edges,
          onNodesChange,
          onEdgesChange,
          onNodeClick: handleNodeClick,
          nodeTypes: nodeTypes2,
          fitView: true,
          fitViewOptions: { padding: 0.3 },
          proOptions: { hideAttribution: true },
          panOnDrag: false,
          zoomOnScroll: false,
          zoomOnPinch: false,
          zoomOnDoubleClick: false,
          preventScrolling: false,
          nodesDraggable: false,
          nodesConnectable: false,
          elementsSelectable: !!onNodeClick,
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(FitViewOnResize, {}),
            !unstyled && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_react9.Background, { variant: import_react9.BackgroundVariant.Dots, gap: 16, size: 1 })
          ]
        }
      )
    }
  );
}

// src/components/FlowchartView/SubflowBreadcrumb.tsx
var import_react10 = require("react");
var import_jsx_runtime5 = require("react/jsx-runtime");
var SubflowBreadcrumb = (0, import_react10.memo)(function SubflowBreadcrumb2({
  breadcrumbs,
  onNavigate
}) {
  if (breadcrumbs.length <= 1) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
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
        return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { style: { display: "flex", alignItems: "center", gap: 4 }, children: [
          i > 0 && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { style: { color: theme.textMuted, fontSize: 10 }, children: "\u203A" }),
          isLast ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { style: { display: "flex", alignItems: "center", gap: 6 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
              "span",
              {
                style: {
                  color: theme.primary,
                  fontWeight: 600
                },
                children: crumb.label
              }
            ),
            crumb.description && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
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
          ] }) : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
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
var import_react11 = require("react");
function useSubflowNavigation(rootSpec, overlay, colors) {
  const [stack, setStack] = (0, import_react11.useState)([]);
  const currentSpec = stack.length > 0 ? stack[stack.length - 1].spec : rootSpec;
  const { nodes, edges } = (0, import_react11.useMemo)(() => {
    if (!currentSpec) return { nodes: [], edges: [] };
    return specToReactFlow(currentSpec, overlay, colors);
  }, [currentSpec, overlay, colors]);
  const subflowMap = (0, import_react11.useMemo)(() => {
    const map = /* @__PURE__ */ new Map();
    if (!currentSpec) return map;
    function collectSubflows(node) {
      if (node.isSubflowRoot && node.subflowStructure) {
        const id = node.name || node.id || "";
        map.set(id, node);
      }
      if (node.children) node.children.forEach(collectSubflows);
      if (node.next) collectSubflows(node.next);
    }
    collectSubflows(currentSpec);
    return map;
  }, [currentSpec]);
  const breadcrumbs = (0, import_react11.useMemo)(() => {
    const root = {
      label: rootSpec?.name || "Flowchart",
      spec: rootSpec,
      description: rootSpec?.description
    };
    return [root, ...stack];
  }, [rootSpec, stack]);
  const handleNodeClick = (0, import_react11.useCallback)(
    (nodeId) => {
      const subflowNode = subflowMap.get(nodeId);
      if (!subflowNode?.subflowStructure) return false;
      setStack((prev) => [
        ...prev,
        {
          label: subflowNode.subflowName || subflowNode.name,
          spec: subflowNode.subflowStructure,
          description: subflowNode.description
        }
      ]);
      return true;
    },
    [subflowMap]
  );
  const navigateTo = (0, import_react11.useCallback)(
    (level) => {
      if (level === 0) {
        setStack([]);
      } else {
        setStack((prev) => prev.slice(0, level));
      }
    },
    []
  );
  return {
    breadcrumbs,
    nodes,
    edges,
    handleNodeClick,
    navigateTo,
    isInSubflow: stack.length > 0,
    currentSubflowNodeName: stack.length > 0 ? stack[stack.length - 1].label : null
  };
}

// src/components/FlowchartView/SubflowTree.tsx
var import_react12 = require("react");
var import_jsx_runtime6 = require("react/jsx-runtime");
function specToTree(node) {
  if (!node) return [];
  const entries = [];
  const seen = /* @__PURE__ */ new Set();
  function walk(n) {
    if (!n) return;
    const id = n.name || n.id || "";
    if (seen.has(id)) return;
    seen.add(id);
    const entry = {
      name: n.name,
      description: n.description,
      subflowId: n.subflowId,
      isSubflow: !!n.isSubflowRoot
    };
    if (n.isSubflowRoot && n.subflowStructure) {
      entry.children = specToTree(n.subflowStructure);
    }
    entries.push(entry);
    if (n.children) {
      for (const child of n.children) {
        if (child) walk(child);
      }
    }
    if (n.next) {
      walk(n.next);
    }
  }
  walk(node);
  return entries;
}
var TreeNode = (0, import_react12.memo)(function TreeNode2({
  entry,
  depth,
  activeStage,
  doneStages,
  onNodeSelect
}) {
  const [expanded, setExpanded] = (0, import_react12.useState)(true);
  const hasChildren = entry.children && entry.children.length > 0;
  const isActive = activeStage === entry.name;
  const isDone = doneStages?.has(entry.name);
  const handleClick = (0, import_react12.useCallback)(() => {
    if (hasChildren) {
      setExpanded((prev) => !prev);
    }
    onNodeSelect?.(entry.name, !!entry.isSubflow);
  }, [hasChildren, onNodeSelect, entry.name, entry.isSubflow]);
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_jsx_runtime6.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
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
          hasChildren ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
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
          ) : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { style: { width: 12, flexShrink: 0 } }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
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
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { style: { display: "flex", flexDirection: "column", minWidth: 0 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
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
                  entry.isSubflow && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { style: { opacity: 0.5, marginLeft: 4, fontSize: 10 }, children: "\u229E" })
                ]
              }
            ),
            entry.description && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
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
    hasChildren && expanded && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { children: entry.children.map((child, i) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
      TreeNode2,
      {
        entry: child,
        depth: depth + 1,
        activeStage,
        doneStages,
        onNodeSelect
      },
      child.subflowId ?? `${child.name}-${i}`
    )) })
  ] });
});
var SectionLabel = (0, import_react12.memo)(function SectionLabel2({ children }) {
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
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
var SubflowTree = (0, import_react12.memo)(function SubflowTree2({
  spec,
  activeStage,
  doneStages,
  onNodeSelect,
  unstyled = false,
  className,
  style
}) {
  const tree = (0, import_react12.useMemo)(() => specToTree(spec), [spec]);
  const subflowStages = (0, import_react12.useMemo)(() => tree.filter((e) => e.isSubflow), [tree]);
  if (subflowStages.length === 0) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
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
        !unstyled && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(SectionLabel, { children: "Subflows" }),
        subflowStages.map((entry, i) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
          TreeNode,
          {
            entry,
            depth: 0,
            activeStage,
            doneStages,
            onNodeSelect
          },
          entry.subflowId ?? `${entry.name}-${i}`
        ))
      ]
    }
  );
});

// src/components/TimeTravelDebugger/TimeTravelDebugger.tsx
var import_react16 = require("react");

// src/components/MemoryInspector/MemoryInspector.tsx
var import_react13 = require("react");
var import_jsx_runtime7 = require("react/jsx-runtime");
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
  const cacheRef = (0, import_react13.useRef)(null);
  const { memory, newKeys } = (0, import_react13.useMemo)(() => {
    if (data) {
      return { memory: data, newKeys: /* @__PURE__ */ new Set() };
    }
    if (!snapshots || snapshots.length === 0) {
      return { memory: {}, newKeys: /* @__PURE__ */ new Set() };
    }
    const safeIdx = Math.min(selectedIndex, snapshots.length - 1);
    let merged;
    const cache = cacheRef.current;
    if (cache && cache.snapshots === snapshots && cache.index <= safeIdx) {
      merged = { ...cache.accumulated };
      for (let i = cache.index + 1; i <= safeIdx; i++) {
        Object.assign(merged, snapshots[i]?.memory);
      }
    } else {
      merged = {};
      for (let i = 0; i <= safeIdx; i++) {
        Object.assign(merged, snapshots[i]?.memory);
      }
    }
    cacheRef.current = { snapshots, index: safeIdx, accumulated: merged };
    const nk = /* @__PURE__ */ new Set();
    if (highlightNew && safeIdx > 0) {
      let prev;
      if (cache && cache.snapshots === snapshots && cache.index === safeIdx - 1) {
        prev = cache.accumulated;
      } else {
        prev = {};
        for (let i = 0; i < safeIdx; i++) {
          Object.assign(prev, snapshots[i]?.memory);
        }
      }
      const current = snapshots[safeIdx]?.memory ?? {};
      for (const k of Object.keys(current)) {
        if (!(k in prev)) nk.add(k);
      }
    } else if (highlightNew && safeIdx === 0 && snapshots[0]) {
      for (const k of Object.keys(snapshots[0].memory)) nk.add(k);
    }
    return { memory: merged, newKeys: nk };
  }, [data, snapshots, selectedIndex, highlightNew]);
  const entries = Object.entries(memory);
  const fs = fontSize[size];
  const pad = padding[size];
  if (unstyled) {
    return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className, style, "data-fp": "memory-inspector", role: "region", "aria-label": "Memory state", children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { "data-fp": "memory-label", children: "Memory State" }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("pre", { "data-fp": "memory-json", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("code", { children: JSON.stringify(memory, null, 2) }) })
    ] });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
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
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
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
        /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
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
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { style: { color: theme.textMuted }, children: "{" }),
              entries.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
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
                return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
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
                      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { style: { color: theme.primary }, children: [
                        '"',
                        key,
                        '"'
                      ] }),
                      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { style: { color: theme.textMuted }, children: ": " }),
                      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { style: { color: theme.success }, children: formatValue(value) }),
                      showTypes && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
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
                      !isLast && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { style: { color: theme.textMuted }, children: "," })
                    ]
                  },
                  key
                );
              }),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { style: { color: theme.textMuted }, children: "}" })
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
var import_react14 = require("react");
var import_jsx_runtime8 = require("react/jsx-runtime");
function NarrativeLog({
  snapshots,
  selectedIndex,
  narrative,
  size = "default",
  unstyled = false,
  className,
  style
}) {
  const entries = (0, import_react14.useMemo)(() => {
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
    return /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className, style, "data-fp": "narrative-log", children: entries.map((entry, i) => /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { "data-fp": "narrative-entry", "data-current": entry.isCurrent, children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("strong", { children: entry.label }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { children: entry.text })
    ] }, i)) });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(
    "div",
    {
      className,
      style: { padding: pad, fontFamily: theme.fontSans, ...style },
      "data-fp": "narrative-log",
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
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
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { style: { marginTop: 8, display: "flex", flexDirection: "column" }, children: entries.map((entry, i) => /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(
          "div",
          {
            style: {
              display: "flex",
              gap: 10,
              padding: `${pad}px 0`,
              borderBottom: i < entries.length - 1 ? `1px solid ${theme.border}` : "none"
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(
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
                    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
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
                    i < entries.length - 1 && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
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
              /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { style: { flex: 1, minWidth: 0 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
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
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
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
var import_react15 = require("react");
var import_jsx_runtime9 = require("react/jsx-runtime");
function GanttTimeline({
  snapshots,
  selectedIndex = 0,
  onSelect,
  size = "default",
  unstyled = false,
  className,
  style,
  maxVisibleRows = 5
}) {
  const [expanded, setExpanded] = (0, import_react15.useState)(false);
  const activeRowRef = (0, import_react15.useRef)(null);
  const scrollContainerRef = (0, import_react15.useRef)(null);
  const totalWallTime = (0, import_react15.useMemo)(
    () => Math.max(...snapshots.map((s) => s.startMs + s.durationMs), 1),
    [snapshots]
  );
  const fs = fontSize[size];
  const pad = padding[size];
  const labelWidth = size === "compact" ? 50 : size === "detailed" ? 100 : 80;
  const msWidth = size === "compact" ? 28 : 36;
  const rowHeight = size === "compact" ? 18 : 22;
  const collapsible = maxVisibleRows > 0 && snapshots.length > maxVisibleRows;
  const showAll = expanded || !collapsible;
  (0, import_react15.useEffect)(() => {
    if (!showAll && activeRowRef.current && scrollContainerRef.current) {
      activeRowRef.current.scrollIntoView({
        block: "nearest",
        behavior: "smooth"
      });
    }
  }, [selectedIndex, showAll]);
  if (unstyled) {
    return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className, style, "data-fp": "gantt-timeline", role: "listbox", "aria-label": "Execution timeline", children: snapshots.map((snap, idx) => /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
      "div",
      {
        "data-fp": "gantt-bar",
        "data-selected": idx === selectedIndex,
        "data-visible": idx <= selectedIndex,
        role: "option",
        "aria-selected": idx === selectedIndex,
        "aria-label": `${snap.stageLabel}, ${snap.durationMs}ms`,
        onClick: () => onSelect?.(idx),
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { "data-fp": "gantt-label", children: snap.stageLabel }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("span", { "data-fp": "gantt-duration", children: [
            snap.durationMs,
            "ms"
          ] })
        ]
      },
      `${snap.stageName}-${idx}`
    )) });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
    "div",
    {
      className,
      style: { padding: pad, fontFamily: theme.fontSans, ...style },
      "data-fp": "gantt-timeline",
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
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
              collapsible && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
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
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
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
              const leftPct = snap.startMs / totalWallTime * 100;
              const widthPct = Math.max(snap.durationMs / totalWallTime * 100, 1);
              const isSelected = idx === selectedIndex;
              const isVisible = idx <= selectedIndex;
              return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
                "div",
                {
                  ref: isSelected ? activeRowRef : void 0,
                  role: "option",
                  "aria-selected": isSelected,
                  "aria-label": `${snap.stageLabel}, ${snap.durationMs}ms`,
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
                    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
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
                    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                      "div",
                      {
                        style: {
                          flex: 1,
                          height: size === "compact" ? 6 : 8,
                          position: "relative",
                          background: theme.bgTertiary,
                          borderRadius: 3
                        },
                        children: isVisible && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
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
                    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
                      "span",
                      {
                        style: {
                          fontSize: fs.small,
                          color: theme.textMuted,
                          fontFamily: theme.fontMono,
                          width: msWidth,
                          flexShrink: 0
                        },
                        children: [
                          snap.durationMs,
                          "ms"
                        ]
                      }
                    )
                  ]
                },
                `${snap.stageName}-${idx}`
              );
            })
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
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
              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { children: "0ms" }),
              size !== "compact" && /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("span", { children: [
                (totalWallTime / 2).toFixed(1),
                "ms"
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("span", { children: [
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

// src/components/TimeTravelDebugger/TimeTravelDebugger.tsx
var import_jsx_runtime10 = require("react/jsx-runtime");
function TimeTravelDebugger({
  snapshots,
  nodes,
  edges,
  showGantt = true,
  layout = "horizontal",
  title = "Time-Travel Debugger",
  size = "default",
  unstyled = false,
  className,
  style
}) {
  const [selectedIndex, setSelectedIndex] = (0, import_react16.useState)(0);
  const fs = fontSize[size];
  const pad = padding[size];
  if (snapshots.length === 0) {
    return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
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
  if (unstyled) {
    return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className, style, "data-fp": "time-travel-debugger", children: [
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("h3", { children: title }),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
        "input",
        {
          type: "range",
          min: 0,
          max: snapshots.length - 1,
          value: selectedIndex,
          onChange: (e) => setSelectedIndex(parseInt(e.target.value))
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
        FlowchartView,
        {
          nodes,
          edges,
          snapshots,
          selectedIndex,
          onNodeClick: setSelectedIndex,
          unstyled: true
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
        MemoryInspector,
        {
          snapshots,
          selectedIndex,
          unstyled: true
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
        NarrativeLog,
        {
          snapshots,
          selectedIndex,
          unstyled: true
        }
      ),
      showGantt && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
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
  return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(
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
        /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(
          "div",
          {
            style: {
              padding: `${pad}px ${pad + 4}px`,
              borderBottom: `1px solid ${theme.border}`,
              background: theme.bgSecondary,
              flexShrink: 0
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(
                "div",
                {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 8
                  },
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
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
                    /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
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
              /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
                  ScrubButton,
                  {
                    label: "\\u25C0",
                    disabled: selectedIndex === 0,
                    onClick: () => setSelectedIndex((i) => Math.max(0, i - 1))
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
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
                /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
                  ScrubButton,
                  {
                    label: "\\u25B6",
                    disabled: selectedIndex === snapshots.length - 1,
                    onClick: () => setSelectedIndex((i) => Math.min(snapshots.length - 1, i + 1))
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(
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
        /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(
          "div",
          {
            style: {
              flex: 1,
              display: "flex",
              flexDirection: isHorizontal ? "row" : "column",
              overflow: "hidden"
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
                "div",
                {
                  style: {
                    flex: 1,
                    overflow: "hidden",
                    borderRight: isHorizontal ? `1px solid ${theme.border}` : "none",
                    borderBottom: !isHorizontal ? `1px solid ${theme.border}` : "none"
                  },
                  children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
                    FlowchartView,
                    {
                      nodes,
                      edges,
                      snapshots,
                      selectedIndex,
                      onNodeClick: setSelectedIndex,
                      size
                    }
                  )
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { style: { flex: 1, overflow: "auto" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
                  MemoryInspector,
                  {
                    snapshots,
                    selectedIndex,
                    size
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
                  "div",
                  {
                    style: {
                      height: 1,
                      background: theme.border,
                      margin: `0 ${pad}px`
                    }
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
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
        showGantt && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
          "div",
          {
            style: {
              borderTop: `1px solid ${theme.border}`,
              background: theme.bgSecondary,
              flexShrink: 0
            },
            children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
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
  return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FlowchartView,
  StageNode,
  SubflowBreadcrumb,
  SubflowTree,
  TimeTravelDebugger,
  TracedFlowchartView,
  applyOverlay,
  specToLayout,
  specToReactFlow,
  useSubflowNavigation
});
//# sourceMappingURL=flowchart.cjs.map