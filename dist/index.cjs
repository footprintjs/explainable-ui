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

// src/index.ts
var src_exports = {};
__export(src_exports, {
  ExplainableShell: () => ExplainableShell,
  FootprintTheme: () => FootprintTheme,
  GanttTimeline: () => GanttTimeline,
  MemoryInspector: () => MemoryInspector,
  MemoryPanel: () => MemoryPanel,
  NarrativeLog: () => NarrativeLog,
  NarrativePanel: () => NarrativePanel,
  NarrativeTrace: () => NarrativeTrace,
  ResultPanel: () => ResultPanel,
  ScopeDiff: () => ScopeDiff,
  SnapshotPanel: () => SnapshotPanel,
  StageDetailPanel: () => StageDetailPanel,
  StoryNarrative: () => StoryNarrative,
  SubflowTree: () => SubflowTree,
  TimeTravelControls: () => TimeTravelControls,
  buildEntryRangeIndex: () => buildEntryRangeIndex,
  computeRevealedEntryCount: () => computeRevealedEntryCount,
  coolDark: () => coolDark,
  coolLight: () => coolLight,
  createSnapshots: () => createSnapshots,
  defaultTokens: () => defaultTokens,
  extractSubflowNarrative: () => extractSubflowNarrative,
  rawDefaults: () => rawDefaults,
  subflowResultToSnapshots: () => subflowResultToSnapshots,
  themePresets: () => themePresets,
  toVisualizationSnapshots: () => toVisualizationSnapshots,
  tokensToCSSVars: () => tokensToCSSVars,
  useDarkModeTokens: () => useDarkModeTokens,
  useFootprintTheme: () => useFootprintTheme,
  warmDark: () => warmDark,
  warmLight: () => warmLight
});
module.exports = __toCommonJS(src_exports);

// src/theme/ThemeProvider.tsx
var import_react = require("react");

// src/theme/tokens.ts
function tokensToCSSVars(tokens) {
  const vars = {};
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
function useFootprintTheme() {
  return (0, import_react.useContext)(ThemeContext);
}
function FootprintTheme({ tokens = {}, children }) {
  const cssVars = tokensToCSSVars(tokens);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeContext.Provider, { value: tokens, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: cssVars, className: "fp-theme-root", children }) });
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
var import_react2 = require("react");
function useDarkModeTokens(options) {
  const lightTokens = options?.light ?? coolLight;
  const darkTokens = options?.dark ?? coolDark;
  const [isDark, setIsDark] = (0, import_react2.useState)(
    () => document.documentElement.classList.contains(options?.selector ?? "dark")
  );
  (0, import_react2.useEffect)(() => {
    const cls = options?.selector ?? "dark";
    const obs = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains(cls));
    });
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"]
    });
    return () => obs.disconnect();
  }, [options?.selector]);
  return isDark ? darkTokens : lightTokens;
}

// src/components/MemoryInspector/MemoryInspector.tsx
var import_react3 = require("react");
var import_jsx_runtime2 = require("react/jsx-runtime");
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
  const cacheRef = (0, import_react3.useRef)(null);
  const { memory, newKeys } = (0, import_react3.useMemo)(() => {
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
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className, style, "data-fp": "memory-inspector", role: "region", "aria-label": "Memory state", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { "data-fp": "memory-label", children: "Memory State" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("pre", { "data-fp": "memory-json", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("code", { children: JSON.stringify(memory, null, 2) }) })
    ] });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
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
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
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
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
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
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: { color: theme.textMuted }, children: "{" }),
              entries.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
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
                return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
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
                      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { style: { color: theme.primary }, children: [
                        '"',
                        key,
                        '"'
                      ] }),
                      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: { color: theme.textMuted }, children: ": " }),
                      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: { color: theme.success }, children: formatValue(value) }),
                      showTypes && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
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
                      !isLast && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: { color: theme.textMuted }, children: "," })
                    ]
                  },
                  key
                );
              }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: { color: theme.textMuted }, children: "}" })
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
var import_react4 = require("react");
var import_jsx_runtime3 = require("react/jsx-runtime");
function NarrativeLog({
  snapshots,
  selectedIndex,
  narrative,
  size = "default",
  unstyled = false,
  className,
  style
}) {
  const entries = (0, import_react4.useMemo)(() => {
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
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className, style, "data-fp": "narrative-log", children: entries.map((entry, i) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { "data-fp": "narrative-entry", "data-current": entry.isCurrent, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("strong", { children: entry.label }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { children: entry.text })
    ] }, i)) });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
    "div",
    {
      className,
      style: { padding: pad, fontFamily: theme.fontSans, ...style },
      "data-fp": "narrative-log",
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
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
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: { marginTop: 8, display: "flex", flexDirection: "column" }, children: entries.map((entry, i) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
          "div",
          {
            style: {
              display: "flex",
              gap: 10,
              padding: `${pad}px 0`,
              borderBottom: i < entries.length - 1 ? `1px solid ${theme.border}` : "none"
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
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
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
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
                    i < entries.length - 1 && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
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
              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { flex: 1, minWidth: 0 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
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
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
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
var import_react5 = require("react");
var import_jsx_runtime4 = require("react/jsx-runtime");
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
  const revealedGroups = (0, import_react5.useMemo)(() => parseGroups(revealed), [revealed]);
  const futureGroups = (0, import_react5.useMemo)(() => parseGroups(future), [future]);
  const [collapsedSet, setCollapsedSet] = (0, import_react5.useState)(() => {
    if (!defaultCollapsed) return /* @__PURE__ */ new Set();
    return new Set(parseGroups(narrative).map((g) => g.headerIdx));
  });
  const latestRef = (0, import_react5.useRef)(null);
  (0, import_react5.useEffect)(() => {
    latestRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [revealedGroups.length]);
  const toggle = (0, import_react5.useCallback)((idx) => {
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
    return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className, style, "data-fp": "narrative-trace", children: [
      revealedGroups.map((group, gi) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { "data-fp": "narrative-group", "data-latest": gi === lastIdx, children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
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
        !collapsedSet.has(group.headerIdx) && group.steps.map((step) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { "data-fp": "narrative-step", children: step.text }, step.idx))
      ] }, group.headerIdx)),
      futureGroups.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { "data-fp": "narrative-future-hint", children: [
        futureGroups.length,
        " more ",
        futureGroups.length === 1 ? "stage" : "stages",
        " ahead..."
      ] })
    ] });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
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
          return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
            "div",
            {
              ref: isLatest ? latestRef : void 0,
              style: { marginBottom: 2 },
              "data-fp": "narrative-group",
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
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
                      hasSteps && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
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
                      !hasSteps && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { style: { width: 10, flexShrink: 0 } }),
                      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: group.header })
                    ]
                  }
                ),
                !isCollapsed && group.steps.map((step) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
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
        futureGroups.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: {
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
var import_react6 = require("react");
var import_jsx_runtime5 = require("react/jsx-runtime");
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
  const [expanded, setExpanded] = (0, import_react6.useState)(false);
  const activeRowRef = (0, import_react6.useRef)(null);
  const scrollContainerRef = (0, import_react6.useRef)(null);
  const totalWallTime = (0, import_react6.useMemo)(
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
  (0, import_react6.useEffect)(() => {
    if (!showAll && activeRowRef.current && scrollContainerRef.current) {
      activeRowRef.current.scrollIntoView({
        block: "nearest",
        behavior: "smooth"
      });
    }
  }, [selectedIndex, showAll]);
  if (unstyled) {
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className, style, "data-fp": "gantt-timeline", role: "listbox", "aria-label": "Execution timeline", children: snapshots.map((snap, idx) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
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
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { "data-fp": "gantt-label", children: snap.stageLabel }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { "data-fp": "gantt-duration", children: [
            snap.durationMs,
            "ms"
          ] })
        ]
      },
      `${snap.stageName}-${idx}`
    )) });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
    "div",
    {
      className,
      style: { padding: pad, fontFamily: theme.fontSans, ...style },
      "data-fp": "gantt-timeline",
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
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
              collapsible && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
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
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
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
              return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
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
                    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
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
                    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
                      "div",
                      {
                        style: {
                          flex: 1,
                          height: size === "compact" ? 6 : 8,
                          position: "relative",
                          background: theme.bgTertiary,
                          borderRadius: 3
                        },
                        children: isVisible && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
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
                    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
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
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
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
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: "0ms" }),
              size !== "compact" && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { children: [
                (totalWallTime / 2).toFixed(1),
                "ms"
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { children: [
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
var import_react7 = require("react");
var import_jsx_runtime6 = require("react/jsx-runtime");
function SnapshotPanel({
  snapshots,
  showGantt = true,
  showScrubber = true,
  title = "Pipeline Inspector",
  size = "default",
  unstyled = false,
  className,
  style
}) {
  const [selectedIndex, setSelectedIndex] = (0, import_react7.useState)(0);
  const fs = fontSize[size];
  const pad = padding[size];
  if (snapshots.length === 0) {
    return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
      "div",
      {
        className,
        style: {
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
    return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className, style, "data-fp": "snapshot-panel", children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h3", { children: title }),
      showScrubber && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
        "input",
        {
          type: "range",
          min: 0,
          max: snapshots.length - 1,
          value: selectedIndex,
          onChange: (e) => setSelectedIndex(parseInt(e.target.value))
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
        MemoryInspector,
        {
          snapshots,
          selectedIndex,
          unstyled: true
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
        NarrativeLog,
        {
          snapshots,
          selectedIndex,
          unstyled: true
        }
      ),
      showGantt && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
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
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
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
      "data-fp": "snapshot-panel",
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
          "div",
          {
            style: {
              padding: `${pad}px ${pad + 4}px`,
              borderBottom: `1px solid ${theme.border}`,
              background: theme.bgSecondary,
              flexShrink: 0
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
                "div",
                {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: showScrubber ? 8 : 0
                  },
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
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
                    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
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
              showScrubber && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
                  ScrubButton,
                  {
                    label: "\\u25C0",
                    disabled: selectedIndex === 0,
                    onClick: () => setSelectedIndex((i) => Math.max(0, i - 1))
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
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
                /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
                  ScrubButton,
                  {
                    label: "\\u25B6",
                    disabled: selectedIndex === snapshots.length - 1,
                    onClick: () => setSelectedIndex((i) => Math.min(snapshots.length - 1, i + 1))
                  }
                )
              ] })
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { style: { flex: 1, overflow: "auto" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
            MemoryInspector,
            {
              snapshots,
              selectedIndex,
              size
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
            "div",
            {
              style: {
                height: 1,
                background: theme.border,
                margin: `0 ${pad}px`
              }
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
            NarrativeLog,
            {
              snapshots,
              selectedIndex,
              size
            }
          )
        ] }),
        showGantt && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
          "div",
          {
            style: {
              borderTop: `1px solid ${theme.border}`,
              background: theme.bgSecondary,
              flexShrink: 0
            },
            children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
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
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
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

// src/components/ScopeDiff/ScopeDiff.tsx
var import_react8 = require("react");
var import_jsx_runtime7 = require("react/jsx-runtime");
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
  const entries = (0, import_react8.useMemo)(() => computeDiff(previous, current), [previous, current]);
  const visible = hideUnchanged ? entries.filter((e) => e.type !== "unchanged") : entries;
  const fs = fontSize[size];
  const pad = padding[size];
  if (unstyled) {
    return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className, style, "data-fp": "scope-diff", children: visible.map((e) => /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { "data-fp": "diff-entry", "data-type": e.type, children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { "data-fp": "diff-key", children: e.key }),
      e.type === "changed" && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(import_jsx_runtime7.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { "data-fp": "diff-old", children: fmt(e.oldValue) }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { "data-fp": "diff-new", children: fmt(e.newValue) })
      ] }),
      (e.type === "added" || e.type === "unchanged") && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { "data-fp": "diff-value", children: fmt(e.newValue) }),
      e.type === "removed" && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { "data-fp": "diff-value", children: fmt(e.oldValue) })
    ] }, e.key)) });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
    "div",
    {
      className,
      style: { padding: pad, fontFamily: theme.fontMono, ...style },
      "data-fp": "scope-diff",
      children: [
        visible.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { style: { fontSize: fs.body, color: theme.textMuted, fontStyle: "italic" }, children: "No changes" }),
        visible.map((entry) => {
          const dc = diffColors[entry.type];
          return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
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
                /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
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
                /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { style: { color: theme.primary, fontWeight: 600, flexShrink: 0 }, children: entry.key }),
                /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { style: { color: theme.textMuted }, children: "=" }),
                entry.type === "changed" ? /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
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
                  /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { style: { color: theme.textMuted, margin: "0 4px" }, children: "\u2192" }),
                  /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { style: { color: theme.success }, children: fmt(entry.newValue) })
                ] }) : /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
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
var import_jsx_runtime8 = require("react/jsx-runtime");
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
    return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className, style, "data-fp": "result-panel", children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { "data-fp": "result-data", children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("pre", { children: data ? JSON.stringify(data, null, 2) : "No data" }) }),
      !hideConsole && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { "data-fp": "result-console", children: logs.map((line, i) => /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { "data-fp": "console-line", "data-error": line.startsWith("ERROR"), children: line }, i)) })
    ] });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(
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
        data && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { style: { flex: 1, overflow: "auto", padding: pad }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
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
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
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
        !hideConsole && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(
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
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
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
              logs.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { style: { fontSize: fs.body, color: theme.textMuted, fontStyle: "italic" }, children: "No console output" }),
              logs.map((line, i) => /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
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
var import_react9 = require("react");
var import_jsx_runtime9 = require("react/jsx-runtime");
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
var changeBadge = {
  added: { bg: "rgba(34,197,94,0.12)", fg: "#22c55e", label: "ADD" },
  updated: { bg: "rgba(245,158,11,0.12)", fg: "#f59e0b", label: "UPD" },
  removed: { bg: "rgba(239,68,68,0.12)", fg: "#ef4444", label: "DEL" }
};
function SimpleView({
  snapshot,
  fs,
  pad
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: 16 }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
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
      snapshot.description && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
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
    snapshot.status && /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
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
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
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
    snapshot.narrative && /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
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
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
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
    snapshot.durationMs > 0 && /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
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
  const rows = (0, import_react9.useMemo)(() => buildMemoryRows(currMemory, changes), [currMemory, changes]);
  const totalKeys = Object.keys(currMemory).length;
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: 12 }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
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
      snapshot.durationMs > 0 && /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
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
    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
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
          /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("span", { style: { fontWeight: 400, marginLeft: 6 }, children: [
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
    rows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
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
    ) : /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
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
        children: rows.map((row) => {
          if (row.kind === "change") {
            const { change } = row;
            const badge = changeBadge[change.type];
            return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
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
                  /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
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
                  /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
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
                  /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { style: { flex: 1, minWidth: 0, lineHeight: 1.8 }, children: change.type === "updated" ? /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(import_jsx_runtime9.Fragment, { children: [
                    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
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
                    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { style: { color: theme.textMuted, margin: "0 4px" }, children: "\u2192" }),
                    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { style: { color: theme.success }, children: fmt2(change.newValue) })
                  ] }) : change.type === "added" ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { style: { color: theme.success }, children: fmt2(change.newValue) }) : /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { style: { color: theme.error, textDecoration: "line-through" }, children: fmt2(change.oldValue) }) })
                ]
              },
              change.key
            );
          }
          return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
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
                /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                  "span",
                  {
                    style: {
                      width: 28,
                      flexShrink: 0,
                      lineHeight: 1.8
                    }
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                  "span",
                  {
                    style: {
                      color: theme.textSecondary,
                      fontWeight: 500,
                      flexShrink: 0,
                      lineHeight: 1.8
                    },
                    children: row.key
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { style: { flex: 1, minWidth: 0, lineHeight: 1.8, color: theme.textMuted }, children: fmt2(row.value) })
              ]
            },
            row.key
          );
        })
      }
    )
  ] });
}
function UnstyledSimpleView({ snapshot }) {
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { "data-fp": "stage-detail-simple", children: [
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { "data-fp": "stage-label", children: snapshot.stageLabel }),
    snapshot.description && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { "data-fp": "stage-description", children: snapshot.description }),
    snapshot.status && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { "data-fp": "stage-status", children: snapshot.status }),
    snapshot.narrative && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { "data-fp": "stage-narrative", children: snapshot.narrative })
  ] });
}
function UnstyledDevView({
  snapshot,
  changes,
  currMemory
}) {
  const rows = (0, import_react9.useMemo)(() => buildMemoryRows(currMemory, changes), [currMemory, changes]);
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { "data-fp": "stage-detail-dev", children: [
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { "data-fp": "stage-label", children: snapshot.stageLabel }),
    rows.map((row) => {
      if (row.kind === "change") {
        const c = row.change;
        return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { "data-fp": "memory-change", "data-type": c.type, children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { "data-fp": "change-key", children: c.key }),
          c.type === "updated" && /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(import_jsx_runtime9.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { "data-fp": "change-old", children: fmt2(c.oldValue) }),
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { "data-fp": "change-new", children: fmt2(c.newValue) })
          ] }),
          c.type === "added" && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { "data-fp": "change-value", children: fmt2(c.newValue) }),
          c.type === "removed" && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { "data-fp": "change-value", children: fmt2(c.oldValue) })
        ] }, c.key);
      }
      return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { "data-fp": "memory-unchanged", children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { "data-fp": "unchanged-key", children: row.key }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { "data-fp": "unchanged-value", children: fmt2(row.value) })
      ] }, row.key);
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
    return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("button", { "data-fp": "mode-toggle", "data-mode": activeMode, onClick: onToggle, children: activeMode === "simple" ? "Dev" : "Simple" });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
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
      children: ["simple", "dev"].map((m) => /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
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
  size = "default",
  unstyled = false,
  className,
  style
}) {
  const [internalMode, setInternalMode] = (0, import_react9.useState)(controlledMode ?? "simple");
  const activeMode = controlledMode ?? internalMode;
  const handleToggle = (0, import_react9.useCallback)(() => {
    const next = activeMode === "simple" ? "dev" : "simple";
    setInternalMode(next);
    onModeChange?.(next);
  }, [activeMode, onModeChange]);
  const snapshot = snapshots[selectedIndex];
  const prevMemory = selectedIndex > 0 ? snapshots[selectedIndex - 1]?.memory ?? null : null;
  const currMemory = snapshot?.memory ?? {};
  const changes = (0, import_react9.useMemo)(
    () => computeChanges(prevMemory, currMemory),
    [prevMemory, currMemory]
  );
  const fs = fontSize[size];
  const pad = padding[size];
  if (!snapshot) {
    return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className, style, "data-fp": "stage-detail-panel", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { style: unstyled ? {} : { color: theme.textMuted, fontSize: fs.body, fontStyle: "italic", padding: pad }, children: "No stage selected" }) });
  }
  if (unstyled) {
    return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className, style, "data-fp": "stage-detail-panel", "data-mode": activeMode, children: [
      showToggle && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(ModeToggle, { activeMode, onToggle: handleToggle, fs, unstyled: true }),
      activeMode === "simple" ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(UnstyledSimpleView, { snapshot }) : /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(UnstyledDevView, { snapshot, changes, currMemory })
    ] });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
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
        showToggle && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { style: { display: "flex", justifyContent: "flex-end", marginBottom: 12 }, children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(ModeToggle, { activeMode, onToggle: handleToggle, fs, unstyled: false }) }),
        activeMode === "simple" ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(SimpleView, { snapshot, fs, pad }) : /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(DevView, { snapshot, changes, currMemory, fs, pad })
      ]
    }
  );
}

// src/components/TimeTravelControls/TimeTravelControls.tsx
var import_react10 = require("react");
var import_jsx_runtime10 = require("react/jsx-runtime");
function TimeTravelControls({
  snapshots,
  selectedIndex,
  onIndexChange,
  autoPlayable = true,
  size = "default",
  unstyled = false,
  className,
  style
}) {
  const [playing, setPlaying] = (0, import_react10.useState)(false);
  const playRef = (0, import_react10.useRef)(null);
  const total = snapshots.length;
  const canPrev = selectedIndex > 0;
  const canNext = selectedIndex < total - 1;
  (0, import_react10.useEffect)(() => {
    if (!playing || !autoPlayable) return;
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
  }, [playing, selectedIndex, snapshots, total, onIndexChange, autoPlayable]);
  const togglePlay = (0, import_react10.useCallback)(() => {
    if (playing) {
      setPlaying(false);
    } else {
      if (selectedIndex >= total - 1) onIndexChange(0);
      setPlaying(true);
    }
  }, [playing, selectedIndex, total, onIndexChange]);
  const handleKeyDown = (0, import_react10.useCallback)(
    (e) => {
      if (e.key === "ArrowLeft" && canPrev && !playing) {
        e.preventDefault();
        setPlaying(false);
        onIndexChange(selectedIndex - 1);
      } else if (e.key === "ArrowRight" && canNext && !playing) {
        e.preventDefault();
        setPlaying(false);
        onIndexChange(selectedIndex + 1);
      } else if (e.key === " " && autoPlayable) {
        e.preventDefault();
        togglePlay();
      }
    },
    [canPrev, canNext, playing, selectedIndex, onIndexChange, autoPlayable, togglePlay]
  );
  const fs = fontSize[size];
  if (unstyled) {
    return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(
      "div",
      {
        className,
        style,
        "data-fp": "time-travel-controls",
        role: "toolbar",
        "aria-label": "Time travel controls",
        tabIndex: 0,
        onKeyDown: handleKeyDown,
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
            "button",
            {
              "data-fp": "tt-prev",
              disabled: !canPrev || playing,
              onClick: () => {
                setPlaying(false);
                onIndexChange(selectedIndex - 1);
              },
              "aria-label": "Previous stage",
              children: "Prev"
            }
          ),
          autoPlayable && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("button", { "data-fp": "tt-play", onClick: togglePlay, "aria-label": playing ? "Pause" : "Play", children: playing ? "Pause" : "Play" }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
            "button",
            {
              "data-fp": "tt-next",
              disabled: !canNext || playing,
              onClick: () => {
                setPlaying(false);
                onIndexChange(selectedIndex + 1);
              },
              "aria-label": "Next stage",
              children: "Next"
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { "data-fp": "tt-ticks", children: snapshots.map((snap, i) => /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
            "button",
            {
              "data-fp": "tt-tick",
              "data-active": i === selectedIndex,
              "data-done": i < selectedIndex,
              onClick: () => {
                setPlaying(false);
                onIndexChange(i);
              },
              title: snap.stageLabel
            },
            i
          )) })
        ]
      }
    );
  }
  const btnStyle = (disabled) => ({
    background: theme.bgTertiary,
    border: `1px solid ${theme.border}`,
    color: disabled ? theme.textMuted : theme.textPrimary,
    borderRadius: "6px",
    padding: "4px 12px",
    fontSize: fs.body,
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    flexShrink: 0
  });
  return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(
    "div",
    {
      className,
      style: {
        padding: "6px 12px",
        background: theme.bgSecondary,
        borderBottom: `1px solid ${theme.border}`,
        display: "flex",
        alignItems: "center",
        gap: 6,
        flexShrink: 0,
        ...style
      },
      "data-fp": "time-travel-controls",
      role: "toolbar",
      "aria-label": "Time travel controls",
      tabIndex: 0,
      onKeyDown: handleKeyDown,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
          "button",
          {
            style: btnStyle(!canPrev || playing),
            disabled: !canPrev || playing,
            onClick: () => {
              setPlaying(false);
              onIndexChange(selectedIndex - 1);
            },
            "aria-label": "Previous stage",
            children: "\u25C0"
          }
        ),
        autoPlayable && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
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
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
          "button",
          {
            style: btnStyle(!canNext || playing),
            disabled: !canNext || playing,
            onClick: () => {
              setPlaying(false);
              onIndexChange(selectedIndex + 1);
            },
            "aria-label": "Next stage",
            children: "\u25B6"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
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
              return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
                "button",
                {
                  onClick: () => {
                    setPlaying(false);
                    onIndexChange(i);
                  },
                  title: snap.stageLabel,
                  style: {
                    flex: 1,
                    height: isActive ? 14 : 8,
                    borderRadius: 3,
                    border: "none",
                    cursor: "pointer",
                    background: isActive ? theme.primary : isDone ? theme.success : theme.bgTertiary,
                    opacity: isDone || isActive ? 1 : 0.4,
                    transition: "all 0.15s ease"
                  }
                },
                i
              );
            })
          }
        )
      ]
    }
  );
}

// src/components/ExplainableShell/ExplainableShell.tsx
var import_react19 = require("react");

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

// src/adapters/fromRuntimeSnapshot.ts
function toVisualizationSnapshots(runtime, narrativeEntries) {
  const stageNarrativeMap = narrativeEntries?.length ? buildStageNarrativeMap(narrativeEntries) : /* @__PURE__ */ new Map();
  const stageTimings = extractStageTimings(runtime.recorders);
  const snapshots = [];
  flattenTree(runtime.executionTree, snapshots, runtime.sharedState, 0, runtime.subflowResults, {}, stageNarrativeMap, stageTimings);
  return snapshots;
}
function extractStageTimings(recorders) {
  const timings = /* @__PURE__ */ new Map();
  if (!recorders) return timings;
  for (const rec of recorders) {
    if (rec.name === "Metrics" && rec.data && typeof rec.data === "object") {
      const data = rec.data;
      if (data.stages) {
        for (const [stageName, metrics] of Object.entries(data.stages)) {
          if (typeof metrics.totalDuration === "number" && metrics.totalDuration > 0) {
            timings.set(stageName, Math.round(metrics.totalDuration));
          }
        }
      }
    }
  }
  return timings;
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
function flattenTree(node, out, sharedState, accumulatedMs = 0, subflowResults, cumulativeMemory = {}, stageNarrativeMap = /* @__PURE__ */ new Map(), stageTimings = /* @__PURE__ */ new Map()) {
  const stageName = node.name ?? node.id;
  const durationMs = (stageName ? stageTimings.get(stageName) : void 0) ?? (typeof node.metrics?.durationMs === "number" ? node.metrics.durationMs : 0);
  const startMs = accumulatedMs;
  const stageId = node.id || node.name || "unknown";
  const displayName = node.name || node.id || "unknown";
  const stageLines = stageNarrativeMap.get(stageId) ?? stageNarrativeMap.get(displayName);
  let narrative;
  if (stageLines) {
    narrative = stageLines.join("\n");
  } else {
    const parts = [`${displayName} executed.`];
    if (node.description) parts.push(node.description);
    if (node.stageWrites) {
      const keys = Object.keys(node.stageWrites);
      if (keys.length > 0) parts.push(`Wrote: ${keys.join(", ")}`);
    }
    narrative = parts.join("\n");
  }
  const memory = { ...cumulativeMemory };
  if (node.stageWrites) {
    for (const [key, value] of Object.entries(node.stageWrites)) {
      if (value === void 0) {
        delete memory[key];
      } else {
        memory[key] = value;
      }
    }
  }
  const sfResult = subflowResults?.[node.subflowId ?? stageId];
  out.push({
    stageName: displayName,
    stageLabel: stageId,
    runtimeStageId: node.runtimeStageId ?? void 0,
    memory,
    narrative,
    startMs,
    durationMs,
    status: "done",
    ...node.description ? { description: node.description } : void 0,
    ...node.subflowId ? { subflowId: node.subflowId } : void 0,
    ...sfResult ? { subflowResult: sfResult } : void 0
  });
  let nextMs = startMs + durationMs;
  if (node.children && node.children.length > 0) {
    let maxChildEnd = nextMs;
    for (const child of node.children) {
      const childEnd = flattenTree(child, out, sharedState, nextMs, subflowResults, memory, stageNarrativeMap, stageTimings);
      maxChildEnd = Math.max(maxChildEnd, childEnd);
    }
    nextMs = maxChildEnd;
  }
  if (node.next) {
    nextMs = flattenTree(node.next, out, sharedState, nextMs, subflowResults, memory, stageNarrativeMap, stageTimings);
  }
  return nextMs;
}
function subflowResultToSnapshots(subflowResult, narrativeEntries) {
  if (!subflowResult || typeof subflowResult !== "object") return [];
  const sf = subflowResult;
  if (!sf.treeContext?.stageContexts) return [];
  const runtime = {
    sharedState: sf.treeContext.globalContext ?? {},
    executionTree: sf.treeContext.stageContexts,
    commitLog: sf.treeContext.history ?? []
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

// src/components/MemoryPanel/MemoryPanel.tsx
var import_jsx_runtime11 = require("react/jsx-runtime");
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
    return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className, style, "data-fp": "memory-panel", children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(MemoryInspector, { snapshots, selectedIndex, unstyled: true }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(ScopeDiff, { previous: prevMemory, current: currMemory, unstyled: true })
    ] });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(
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
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(MemoryInspector, { snapshots, selectedIndex, size }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { style: { borderTop: `1px solid ${theme.border}` }, children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(ScopeDiff, { previous: prevMemory, current: currMemory, hideUnchanged: true, size }) })
      ]
    }
  );
}

// src/components/NarrativePanel/NarrativePanel.tsx
var import_react12 = require("react");

// src/components/StoryNarrative/StoryNarrative.tsx
var import_react11 = require("react");
var import_jsx_runtime12 = require("react/jsx-runtime");
var ENTRY_ICONS = {
  stage: { icon: "\u25B8", color: theme.primary, label: "Stage" },
  step: { icon: "\xB7", color: theme.textMuted, label: "Data operation" },
  condition: { icon: "\u25C7", color: theme.warning, label: "Decision" },
  fork: { icon: "\u2443", color: theme.primary, label: "Parallel" },
  selector: { icon: "\u2443", color: theme.primary, label: "Selector" },
  subflow: { icon: "\u21B3", color: theme.textSecondary, label: "Subflow" },
  loop: { icon: "\u21BB", color: theme.warning, label: "Loop" },
  break: { icon: "\u25A0", color: theme.error, label: "Break" },
  error: { icon: "\u2717", color: theme.error, label: "Error" }
};
function StoryNarrative({
  entries,
  revealedEntryCount,
  size = "default",
  unstyled = false,
  className,
  style: outerStyle
}) {
  const fs = fontSize[size];
  const pad = padding[size];
  const revealedCount = revealedEntryCount;
  const revealed = (0, import_react11.useMemo)(() => {
    const raw = entries.slice(0, revealedCount);
    return raw.filter((e) => {
      const sfId = e.subflowId;
      if (!sfId) return true;
      if (e.type === "subflow") return true;
      return false;
    });
  }, [entries, revealedCount]);
  const futureCount = (0, import_react11.useMemo)(() => {
    let count = 0;
    for (let i = revealedCount; i < entries.length; i++) {
      const e = entries[i];
      if (!e.subflowId || entries[i].type === "subflow") count++;
    }
    return count;
  }, [entries, revealedCount]);
  const latestRef = (0, import_react11.useRef)(null);
  (0, import_react11.useEffect)(() => {
    latestRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [revealed.length]);
  const numberedEntries = (0, import_react11.useMemo)(() => {
    let counter = 0;
    const subflowSeen = /* @__PURE__ */ new Set();
    let prevType = "";
    return revealed.map((entry) => {
      let cleanText = entry.text;
      cleanText = cleanText.replace(/^Stage \d+:\s*/, "");
      const isSelector = entry.type === "fork" && entry.text.includes("[Selected]");
      cleanText = cleanText.replace(/^\[(Selected|Parallel)\]:\s*/, "");
      if (entry.type === "subflow") {
        const toggleKey = entry.stageId ?? entry.text;
        const isExit = subflowSeen.has(toggleKey);
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
        const isForkHeading = prevType !== "fork" && prevType !== "selector";
        prevType = entry.type;
        if (isForkHeading) {
          counter++;
          const typeLabel = entry.type === "selector" || isSelector ? "Selector" : "Fork";
          return { ...entry, heading: `${counter}`, headingType: typeLabel, text: cleanText, isHeading: true };
        }
        return { ...entry, heading: null, isHeading: false, text: cleanText };
      }
      prevType = entry.type;
      return { ...entry, heading: null, isHeading: false };
    });
  }, [revealed]);
  if (unstyled) {
    return /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className, style: outerStyle, "data-fp": "story-narrative", role: "log", children: numberedEntries.map((entry, i) => {
      if (entry.isSubflowExit) return null;
      const ht = entry.headingType;
      return /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { "data-fp": "narrative-entry", "data-type": entry.type, children: entry.heading ? entry.text.startsWith("[") ? `${entry.heading}. ${entry.text}` : `${entry.heading}. [${ht}: ${entry.stageName ?? ""}] ${entry.text}` : entry.text }, i);
    }) });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(
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
          const meta = ENTRY_ICONS[entry.type] ?? ENTRY_ICONS.step;
          const isHeading = entry.isHeading;
          const isDecision = entry.type === "condition";
          const isError = entry.type === "error";
          const isBreak = entry.type === "break";
          const isSubflow = entry.isSubflow;
          const isLast = i === numberedEntries.length - 1;
          const headingType = entry.headingType;
          return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(
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
                /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
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
                /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
                  "span",
                  {
                    style: {
                      fontSize: isHeading ? fs.body : fs.small,
                      fontWeight: isHeading ? 600 : 400,
                      color: isError || isBreak ? theme.error : isDecision ? theme.warning : isHeading ? theme.textPrimary : theme.textSecondary,
                      lineHeight: 1.6,
                      fontFamily: entry.type === "step" ? theme.fontMono : theme.fontSans
                    },
                    children: entry.heading && headingType ? entry.text.startsWith("[") ? /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(import_jsx_runtime12.Fragment, { children: [
                      /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("strong", { children: [
                        entry.heading,
                        "."
                      ] }),
                      " ",
                      entry.text
                    ] }) : /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(import_jsx_runtime12.Fragment, { children: [
                      /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("strong", { children: [
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
        futureCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { style: {
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
var import_jsx_runtime13 = require("react/jsx-runtime");
function NarrativePanel({
  snapshots,
  selectedIndex,
  narrativeEntries,
  narrative: narrativeProp,
  size = "default",
  unstyled = false,
  className,
  style
}) {
  const fs = fontSize[size];
  const pad = padding[size];
  const narrative = (0, import_react12.useMemo)(() => {
    if (narrativeProp && narrativeProp.length > 0) return narrativeProp;
    const lines = [];
    for (const snap of snapshots) {
      const stageLines = (snap.narrative ?? "").split("\n").filter(Boolean);
      lines.push(...stageLines);
    }
    return lines;
  }, [narrativeProp, snapshots]);
  const revealedCount = (0, import_react12.useMemo)(() => {
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
  const rangeIndex = (0, import_react12.useMemo)(
    () => narrativeEntries?.length ? buildEntryRangeIndex(narrativeEntries) : void 0,
    [narrativeEntries]
  );
  const revealedEntryCount = (0, import_react12.useMemo)(
    () => narrativeEntries?.length ? computeRevealedEntryCount(narrativeEntries, snapshots, selectedIndex, rangeIndex) : 0,
    [narrativeEntries, snapshots, selectedIndex, rangeIndex]
  );
  const hasStructured = narrativeEntries && narrativeEntries.length > 0;
  const [copied, setCopied] = (0, import_react12.useState)(false);
  const buildLLMNarrative = (0, import_react12.useCallback)(() => {
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
        let text = e.text;
        if (opts?.inSubflow) {
          const prefix = `[${opts.inSubflow}/`;
          const idx = text.indexOf(prefix);
          if (idx !== -1) {
            text = text.slice(0, idx) + "[" + text.slice(idx + prefix.length);
          }
        }
        const isHeading = e.type === "stage" || e.type === "subflow" || e.type === "fork" || e.type === "selector";
        if (isHeading) {
          counter++;
          const sfId = e.subflowId;
          const idSuffix = e.type === "subflow" && sfId ? ` [\u2192 ${sfId}]` : "";
          lines.push(`${counter}. ${text}${idSuffix}`);
        } else {
          lines.push(`  ${text}`);
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
    return sections.join("\n");
  }, [narrativeEntries, narrative]);
  const handleCopy = (0, import_react12.useCallback)(async () => {
    const text = buildLLMNarrative();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2e3);
  }, [buildLLMNarrative]);
  if (unstyled) {
    return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("div", { className, style, "data-fp": "narrative-panel", children: hasStructured ? /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(StoryNarrative, { entries: narrativeEntries, revealedEntryCount, unstyled: true }) : /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(NarrativeTrace, { narrative, revealedCount, unstyled: true }) });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)(
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
        /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)(
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
              /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("span", { style: { fontStyle: "italic" }, children: "What happened at each stage, what data flowed, what decisions were made, and why." }),
              /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
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
        hasStructured ? /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
          StoryNarrative,
          {
            entries: narrativeEntries,
            revealedEntryCount,
            size,
            style: { flex: 1 }
          }
        ) : /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
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
var import_react13 = require("react");
var import_jsx_runtime14 = require("react/jsx-runtime");
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
var TreeNode = (0, import_react13.memo)(function TreeNode2({
  entry,
  depth,
  activeStage,
  doneStages,
  onNodeSelect
}) {
  const [expanded, setExpanded] = (0, import_react13.useState)(true);
  const hasChildren = entry.children && entry.children.length > 0;
  const isActive = activeStage === entry.name;
  const isDone = doneStages?.has(entry.name);
  const handleClick = (0, import_react13.useCallback)(() => {
    if (hasChildren) {
      setExpanded((prev) => !prev);
    }
    onNodeSelect?.(entry.name, !!entry.isSubflow);
  }, [hasChildren, onNodeSelect, entry.name, entry.isSubflow]);
  return /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)(import_jsx_runtime14.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)(
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
          hasChildren ? /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(
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
          ) : /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { style: { width: 12, flexShrink: 0 } }),
          /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(
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
          /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("span", { style: { display: "flex", flexDirection: "column", minWidth: 0 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)(
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
                  entry.isSubflow && /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { style: { opacity: 0.5, marginLeft: 4, fontSize: 10 }, children: "\u229E" })
                ]
              }
            ),
            entry.description && /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(
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
    hasChildren && expanded && /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("div", { children: entry.children.map((child, i) => /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(
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
var SectionLabel = (0, import_react13.memo)(function SectionLabel2({ children }) {
  return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(
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
var SubflowTree = (0, import_react13.memo)(function SubflowTree2({
  spec,
  activeStage,
  doneStages,
  onNodeSelect,
  unstyled = false,
  className,
  style
}) {
  const tree = (0, import_react13.useMemo)(() => specToTree(spec), [spec]);
  const subflowStages = (0, import_react13.useMemo)(() => tree.filter((e) => e.isSubflow), [tree]);
  if (subflowStages.length === 0) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)(
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
        !unstyled && /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(SectionLabel, { children: "Subflows" }),
        subflowStages.map((entry, i) => /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(
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

// src/components/FlowchartView/SubflowBreadcrumb.tsx
var import_react14 = require("react");
var import_jsx_runtime15 = require("react/jsx-runtime");
var SubflowBreadcrumb = (0, import_react14.memo)(function SubflowBreadcrumb2({
  breadcrumbs,
  onNavigate
}) {
  if (breadcrumbs.length <= 1) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
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
        return /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("span", { style: { display: "flex", alignItems: "center", gap: 4 }, children: [
          i > 0 && /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("span", { style: { color: theme.textMuted, fontSize: 10 }, children: "\u203A" }),
          isLast ? /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("span", { style: { display: "flex", alignItems: "center", gap: 6 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
              "span",
              {
                style: {
                  color: theme.primary,
                  fontWeight: 600
                },
                children: crumb.label
              }
            ),
            crumb.description && /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)(
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
          ] }) : /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
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

// src/components/FlowchartView/TracedFlowchartView.tsx
var import_react17 = require("react");
var import_react18 = require("@xyflow/react");

// src/components/StageNode/StageNode.tsx
var import_react15 = require("react");
var import_react16 = require("@xyflow/react");
var import_jsx_runtime16 = require("react/jsx-runtime");
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
      return /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("svg", { ...props, children: [
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("circle", { cx: "8", cy: "8", r: "6", stroke: color, strokeWidth: "1.5" }),
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("path", { d: "M5.5 8C5.5 6.5 6.5 5 8 5S10.5 6.5 10.5 8", stroke: color, strokeWidth: "1.2", strokeLinecap: "round" }),
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("circle", { cx: "8", cy: "9.5", r: "1", fill: color }),
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("line", { x1: "8", y1: "2", x2: "8", y2: "3.5", stroke: color, strokeWidth: "1", strokeLinecap: "round" }),
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("line", { x1: "12.5", y1: "4", x2: "11.2", y2: "5", stroke: color, strokeWidth: "1", strokeLinecap: "round" }),
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("line", { x1: "3.5", y1: "4", x2: "4.8", y2: "5", stroke: color, strokeWidth: "1", strokeLinecap: "round" })
      ] });
    // Tool / function call — gear
    case "tool":
    case "function":
      return /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("svg", { ...props, children: [
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("circle", { cx: "8", cy: "8", r: "3", stroke: color, strokeWidth: "1.5" }),
        [0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
          const rad = angle * Math.PI / 180;
          const x1 = 8 + Math.cos(rad) * 4.5;
          const y1 = 8 + Math.sin(rad) * 4.5;
          const x2 = 8 + Math.cos(rad) * 6;
          const y2 = 8 + Math.sin(rad) * 6;
          return /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("line", { x1, y1, x2, y2, stroke: color, strokeWidth: "1.5", strokeLinecap: "round" }, angle);
        })
      ] });
    // RAG / retrieval — magnifying glass + doc
    case "rag":
    case "search":
    case "retrieval":
      return /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("svg", { ...props, children: [
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("circle", { cx: "7", cy: "7", r: "4", stroke: color, strokeWidth: "1.5" }),
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("line", { x1: "10", y1: "10", x2: "13.5", y2: "13.5", stroke: color, strokeWidth: "1.5", strokeLinecap: "round" }),
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("line", { x1: "5.5", y1: "6", x2: "8.5", y2: "6", stroke: color, strokeWidth: "1", strokeLinecap: "round" }),
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("line", { x1: "5.5", y1: "8", x2: "7.5", y2: "8", stroke: color, strokeWidth: "1", strokeLinecap: "round" })
      ] });
    // Parse / process — diamond with arrows
    case "parse":
    case "process":
    case "transform":
      return /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("svg", { ...props, children: /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("rect", { x: "4", y: "4", width: "8", height: "8", rx: "1.5", stroke: color, strokeWidth: "1.5", transform: "rotate(45 8 8)" }) });
    // Start / seed — play triangle
    case "start":
    case "seed":
    case "init":
      return /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("svg", { ...props, children: /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("path", { d: "M5 3.5L12.5 8L5 12.5V3.5Z", fill: color, opacity: "0.8" }) });
    // End / finalize — stop square
    case "end":
    case "finalize":
    case "output":
      return /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("svg", { ...props, children: /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("rect", { x: "4", y: "4", width: "8", height: "8", rx: "1.5", fill: color, opacity: "0.8" }) });
    // Agent — person silhouette
    case "agent":
    case "orchestrator":
      return /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("svg", { ...props, children: [
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("circle", { cx: "8", cy: "5", r: "2.5", stroke: color, strokeWidth: "1.5" }),
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("path", { d: "M3.5 14C3.5 11 5.5 9 8 9S12.5 11 12.5 14", stroke: color, strokeWidth: "1.5", strokeLinecap: "round" })
      ] });
    // Swarm — multi-agent
    case "swarm":
    case "multi-agent":
      return /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("svg", { ...props, children: [
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("circle", { cx: "5", cy: "5", r: "2", stroke: color, strokeWidth: "1.2" }),
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("circle", { cx: "11", cy: "5", r: "2", stroke: color, strokeWidth: "1.2" }),
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("circle", { cx: "8", cy: "11", r: "2", stroke: color, strokeWidth: "1.2" }),
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("line", { x1: "5", y1: "7", x2: "8", y2: "9", stroke: color, strokeWidth: "1", opacity: "0.5" }),
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("line", { x1: "11", y1: "7", x2: "8", y2: "9", stroke: color, strokeWidth: "1", opacity: "0.5" })
      ] });
    // Guard / guardrail — shield
    case "guard":
    case "guardrail":
    case "validate":
      return /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("svg", { ...props, children: [
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("path", { d: "M8 2L3 5V9C3 11.5 5 13.5 8 14.5C11 13.5 13 11.5 13 9V5L8 2Z", stroke: color, strokeWidth: "1.5", strokeLinejoin: "round" }),
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("path", { d: "M6 8L7.5 9.5L10 6.5", stroke: color, strokeWidth: "1.2", strokeLinecap: "round", strokeLinejoin: "round" })
      ] });
    // Stream — wave
    case "stream":
    case "streaming":
      return /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("svg", { ...props, children: [
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("path", { d: "M2 8C4 5 6 11 8 8S12 5 14 8", stroke: color, strokeWidth: "1.5", strokeLinecap: "round", fill: "none" }),
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("path", { d: "M2 11C4 8 6 14 8 11S12 8 14 11", stroke: color, strokeWidth: "1", strokeLinecap: "round", fill: "none", opacity: "0.5" })
      ] });
    // Memory / state — database cylinder
    case "memory":
    case "state":
    case "db":
      return /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("svg", { ...props, children: [
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("ellipse", { cx: "8", cy: "4.5", rx: "5", ry: "2", stroke: color, strokeWidth: "1.3" }),
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("line", { x1: "3", y1: "4.5", x2: "3", y2: "11.5", stroke: color, strokeWidth: "1.3" }),
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("line", { x1: "13", y1: "4.5", x2: "13", y2: "11.5", stroke: color, strokeWidth: "1.3" }),
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("ellipse", { cx: "8", cy: "11.5", rx: "5", ry: "2", stroke: color, strokeWidth: "1.3" })
      ] });
    // Loop — circular arrow
    case "loop":
    case "retry":
      return /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("svg", { ...props, children: [
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("path", { d: "M12 8A4 4 0 1 1 8 4", stroke: color, strokeWidth: "1.5", strokeLinecap: "round", fill: "none" }),
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("path", { d: "M8 1.5L10.5 4L8 6.5", stroke: color, strokeWidth: "1.3", strokeLinecap: "round", strokeLinejoin: "round", fill: "none" })
      ] });
    // Lazy / service — cloud (deferred resolution, loaded on demand)
    case "lazy":
    case "service":
    case "cloud":
      return /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("svg", { ...props, children: /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
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
      return /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("svg", { ...props, children: [
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("path", { d: "M8 2L14 8L8 14L2 8Z", stroke: color, strokeWidth: "1.5", fill: "none" }),
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("circle", { cx: "8", cy: "8", r: "1.5", fill: color })
      ] });
    default:
      return null;
  }
}
var StageNode = (0, import_react15.memo)(function StageNode2({
  data
}) {
  const { label, active, done, error, linked, icon, stepNumbers, dimmed, isSubflow, isLazy, isDecider, isFork, description } = data;
  const effectiveIcon = icon || (isLazy ? "lazy" : void 0);
  const isLazyUnresolved = isLazy && !done && !active;
  const injectedRef = (0, import_react15.useRef)(false);
  (0, import_react15.useEffect)(() => {
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
  return /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)(import_jsx_runtime16.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(import_react16.Handle, { type: "target", position: import_react16.Position.Top, style: { opacity: 0 } }),
    /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)(
      "div",
      {
        style: {
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: 6
        },
        children: [
          stepNumbers && stepNumbers.length > 0 && isOnPath && /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
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
                return /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
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
          linked && /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
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
          active && /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
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
          isDecider ? /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { style: { position: "relative", width: 120, height: 72 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
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
            /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
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
            /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)(
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
                  /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 4 }, children: [
                    effectiveIcon && /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(StageIcon, { type: effectiveIcon, color: textColor }),
                    !effectiveIcon && /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { style: { fontSize: 9, color: textColor }, children: "\u25C7" }),
                    /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
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
                  description && /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
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
            /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)(
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
                  /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6 }, children: [
                    effectiveIcon && /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(StageIcon, { type: effectiveIcon, color: textColor }),
                    done && !effectiveIcon && /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { style: { fontSize: 10, color: textColor }, children: "\u2713" }),
                    active && !effectiveIcon && /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
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
                    error && !effectiveIcon && /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { style: { fontSize: 10, color: textColor }, children: "\u2717" }),
                    /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
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
                    isSubflow && /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
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
                        children: /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
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
                  description && /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
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
    /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(import_react16.Handle, { type: "source", position: import_react16.Position.Bottom, style: { opacity: 0 } }),
    /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
      import_react16.Handle,
      {
        id: "loop-source",
        type: "source",
        position: import_react16.Position.Right,
        style: { background: "transparent", border: "none", width: 6, height: 6 }
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
      import_react16.Handle,
      {
        id: "loop-target",
        type: "target",
        position: import_react16.Position.Right,
        style: { background: "transparent", border: "none", width: 6, height: 6 }
      }
    )
  ] });
});

// src/components/FlowchartView/specToReactFlow.ts
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
        pathOptions: { offset: 40, borderRadius: 16 },
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

// src/components/FlowchartView/TracedFlowchartView.tsx
var import_jsx_runtime17 = require("react/jsx-runtime");
var defaultNodeTypes = { stage: StageNode };
function FitViewOnResize() {
  const { fitView } = (0, import_react18.useReactFlow)();
  (0, import_react17.useEffect)(() => {
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
  const nodeTypes = customNodeTypes ?? defaultNodeTypes;
  const overlay = (0, import_react17.useMemo)(() => {
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
  const layout = (0, import_react17.useMemo)(() => {
    if (!spec) return null;
    return specToLayout(spec);
  }, [spec]);
  const flowData = (0, import_react17.useMemo)(() => {
    if (!layout) return { nodes: [], edges: [] };
    return applyOverlay(layout, overlay);
  }, [layout, overlay]);
  const [nodes, setNodes, onNodesChange] = (0, import_react18.useNodesState)(flowData.nodes);
  const [edges, setEdges, onEdgesChange] = (0, import_react18.useEdgesState)(flowData.edges);
  (0, import_react17.useEffect)(() => {
    setNodes(flowData.nodes);
    setEdges(flowData.edges);
  }, [flowData, setNodes, setEdges]);
  const handleNodeClick = (0, import_react17.useCallback)(
    (_, node) => {
      if (!onNodeClick) return;
      onNodeClick(node.id);
    },
    [onNodeClick]
  );
  return /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(
    "div",
    {
      className,
      style: { width: "100%", height: "100%", ...style },
      "data-fp": "traced-flowchart",
      children: /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)(
        import_react18.ReactFlow,
        {
          nodes,
          edges,
          onNodesChange,
          onEdgesChange,
          onNodeClick: handleNodeClick,
          nodeTypes,
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
            /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(FitViewOnResize, {}),
            !unstyled && /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(import_react18.Background, { variant: import_react18.BackgroundVariant.Dots, gap: 16, size: 1 })
          ]
        }
      )
    }
  );
}

// src/components/ExplainableShell/ExplainableShell.tsx
var import_jsx_runtime18 = require("react/jsx-runtime");
var HLinePill = (0, import_react19.memo)(function HLinePill2({
  label,
  detail,
  expanded,
  onClick
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { style: {
    display: "flex",
    alignItems: "center",
    gap: 0,
    padding: "0"
  }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { style: { flex: 1, height: 1, background: theme.border } }),
    /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)(
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
          /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { style: { fontSize: 7 }, children: expanded ? "\u25BC" : "\u25B6" }),
          label,
          detail && /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { style: { fontWeight: 400, opacity: 0.5, fontSize: 9 }, children: detail })
        ]
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { style: { flex: 1, height: 1, background: theme.border } })
  ] });
});
var VLinePill = (0, import_react19.memo)(function VLinePill2({
  label,
  expanded,
  side = "right",
  onClick
}) {
  const arrow = side === "right" ? expanded ? "\u25B6" : "\u25C0" : expanded ? "\u25C0" : "\u25B6";
  return /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { style: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 0,
    padding: "0"
  }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { style: { flex: 1, width: 1, background: theme.border } }),
    /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)(
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
          /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { style: { fontSize: 7, writingMode: "horizontal-tb" }, children: arrow }),
          label
        ]
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { style: { flex: 1, width: 1, background: theme.border } })
  ] });
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
function findNumericField(entry) {
  for (const [k, v2] of Object.entries(entry)) {
    if (typeof v2 === "number") return { key: k, value: v2 };
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
  const [showAggregate, setShowAggregate] = (0, import_react19.useState)(false);
  const detected = (0, import_react19.useMemo)(() => detectKeyedSteps(data), [data]);
  const visibleKeys = (0, import_react19.useMemo)(() => {
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
    return /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { style: { padding: 12, fontFamily: theme.fontMono, fontSize: 11, whiteSpace: "pre-wrap", overflow: "auto", height: "100%" }, children: typeof data === "string" ? data : JSON.stringify(data, null, 2) });
  }
  const steps = detected.steps;
  const allKeys = Object.keys(steps);
  const visibleEntries = allKeys.filter((k) => visibleKeys.has(k));
  const numField = allKeys.length > 0 ? findNumericField(steps[allKeys[0]]) : null;
  const numFieldKey = numField?.key ?? "";
  let runningTotal = 0;
  if (numFieldKey) {
    for (const k of visibleEntries) {
      runningTotal += steps[k][numFieldKey] ?? 0;
    }
  }
  let grandTotal = 0;
  if (numFieldKey) {
    for (const entry of Object.values(steps)) {
      grandTotal += entry[numFieldKey] ?? 0;
    }
  }
  return /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { style: { overflow: "auto", height: "100%", display: "flex", flexDirection: "column" }, children: [
    description && /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { style: { padding: "6px 12px", fontSize: 11, color: theme.textMuted, fontStyle: "italic", borderBottom: `1px solid ${theme.border}`, flexShrink: 0 }, children: description }),
    /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { style: { padding: 12, flex: 1, overflow: "auto" }, children: [
      preferredOperation === "aggregate" ? (
        /* AGGREGATE primary: show grand total prominently, per-step expandable */
        /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)(import_jsx_runtime18.Fragment, { children: [
          isAtEnd ? /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { style: { padding: "12px 14px", background: `color-mix(in srgb, ${theme.success} 12%, transparent)`, borderRadius: 6, border: `1px solid ${theme.success}44`, marginBottom: 16 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { style: { fontSize: 10, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4, fontWeight: 600 }, children: "Aggregate \u2014 grand total" }),
            numFieldKey && /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { style: { fontSize: 22, fontWeight: 700, color: theme.success }, children: [
              grandTotal < 1 ? grandTotal.toFixed(3) : grandTotal.toFixed(1),
              /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("span", { style: { fontSize: 11, color: theme.textMuted, fontWeight: 400, marginLeft: 8 }, children: [
                numFieldKey,
                " \xB7 ",
                allKeys.length,
                " steps"
              ] })
            ] })
          ] }) : /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { style: { padding: "8px 12px", background: `color-mix(in srgb, ${theme.primary} 8%, transparent)`, borderRadius: 6, marginBottom: 16 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { style: { fontSize: 10, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4, fontWeight: 600 }, children: "Accumulate \u2014 running total" }),
            numFieldKey && /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("span", { style: { fontWeight: 700, fontSize: 16, color: theme.primary }, children: [
              runningTotal < 1 ? runningTotal.toFixed(3) : runningTotal.toFixed(1),
              /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("span", { style: { fontSize: 10, color: theme.textMuted, fontWeight: 400, marginLeft: 8 }, children: [
                visibleEntries.length,
                " of ",
                allKeys.length,
                " steps"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { style: { fontSize: 10, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, fontWeight: 600 }, children: "Per-step detail" })
        ] })
      ) : preferredOperation === "accumulate" ? (
        /* ACCUMULATE primary: running total prominent, per-step listed */
        /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)(import_jsx_runtime18.Fragment, { children: [
          numFieldKey && visibleEntries.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { style: { padding: "10px 14px", background: `color-mix(in srgb, ${theme.primary} 8%, transparent)`, borderRadius: 6, marginBottom: 16 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { style: { fontSize: 10, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4, fontWeight: 600 }, children: "Accumulate \u2014 running total up to this step" }),
            /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { style: { fontWeight: 700, fontSize: 18, color: theme.primary }, children: runningTotal < 1 ? runningTotal.toFixed(3) : runningTotal.toFixed(1) }),
            /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("span", { style: { color: theme.textMuted, marginLeft: 8, fontSize: 10 }, children: [
              numFieldKey,
              " \xB7 ",
              visibleEntries.length,
              " of ",
              allKeys.length,
              " steps"
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { style: { fontSize: 10, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, fontWeight: 600 }, children: "Per-step detail" })
        ] })
      ) : (
        /* TRANSLATE primary: per-step entries prominent */
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { style: { fontSize: 10, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, fontWeight: 600 }, children: "Translate \u2014 per-step detail" })
      ),
      visibleEntries.map((key) => {
        const entry = steps[key];
        const label = entry.stageName ?? key;
        const numVal = numFieldKey ? entry[numFieldKey] : void 0;
        return /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { style: { display: "flex", alignItems: "center", padding: "4px 0", fontSize: 12, fontFamily: theme.fontMono, borderBottom: `1px solid ${theme.border}22` }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { style: { color: theme.textMuted, width: 140, flexShrink: 0, fontSize: 10 }, children: key }),
          /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { style: { fontWeight: 600, flex: 1 }, children: label }),
          numVal !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { style: { color: theme.primary, fontWeight: 700, marginLeft: 8 }, children: numVal < 1 ? numVal.toFixed(3) : numVal.toFixed(1) })
        ] }, key);
      }),
      visibleEntries.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { style: { color: theme.textMuted, fontSize: 11, fontStyle: "italic", padding: "8px 0" }, children: "Scrub the slider to reveal entries..." }),
      preferredOperation === "accumulate" && isAtEnd && numFieldKey && /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { style: { marginTop: 16 }, children: !showAggregate ? /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
        "button",
        {
          onClick: () => setShowAggregate(true),
          style: {
            background: theme.primary,
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "10px 20px",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
            width: "100%"
          },
          children: "Show Aggregate \u2014 Grand Total"
        }
      ) : /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { style: { padding: "10px 14px", background: `color-mix(in srgb, ${theme.success} 12%, transparent)`, borderRadius: 6, border: `1px solid ${theme.success}44` }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { style: { fontSize: 10, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4, fontWeight: 600 }, children: "Aggregate \u2014 grand total" }),
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { style: { fontSize: 22, fontWeight: 700, color: theme.success }, children: grandTotal < 1 ? grandTotal.toFixed(3) : grandTotal.toFixed(1) }),
        /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { style: { fontSize: 10, color: theme.textMuted, marginTop: 2 }, children: [
          allKeys.length,
          " steps \xB7 ",
          numFieldKey
        ] })
      ] }) })
    ] })
  ] });
}
var DetailsContent = (0, import_react19.memo)(function DetailsContent2({
  snapshots,
  selectedIndex,
  narrativeEntries,
  narrative,
  size,
  fillHeight,
  extraViews
}) {
  const builtInViews = [
    {
      id: "memory",
      name: "Memory",
      render: ({ snapshots: snaps, selectedIndex: idx }) => /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(MemoryPanel, { snapshots: snaps, selectedIndex: idx, size, style: fillHeight ? { height: "100%" } : void 0 })
    },
    {
      id: "narrative",
      name: "Narrative",
      render: ({ snapshots: snaps, selectedIndex: idx }) => /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(NarrativePanel, { snapshots: snaps, selectedIndex: idx, narrativeEntries, narrative, size, style: fillHeight ? { height: "100%" } : void 0 })
    }
  ];
  const allViews = [...builtInViews, ...extraViews ?? []];
  const [activeViewId, setActiveViewId] = (0, import_react19.useState)(allViews[0]?.id ?? "memory");
  const viewIds = allViews.map((v2) => v2.id).join(",");
  (0, import_react19.useEffect)(() => {
    if (!allViews.find((v2) => v2.id === activeViewId)) {
      setActiveViewId(allViews[0]?.id ?? "memory");
    }
  }, [viewIds]);
  const activeView = allViews.find((v2) => v2.id === activeViewId) ?? allViews[0];
  return /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { style: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { style: { display: "flex", borderBottom: `1px solid ${theme.border}`, flexShrink: 0, overflowX: "auto" }, children: allViews.map((view) => {
      const active = view.id === activeViewId;
      return /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
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
    /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { style: { flex: 1, overflow: "auto" }, children: activeView?.render({ snapshots, selectedIndex }) })
  ] });
});
function resolveSubflowLevel(parentSpec, parentSnapshots, subflowNodeName, narrativeEntries) {
  const specNode = findSubflowSpecNode(parentSpec, subflowNodeName);
  if (!specNode?.subflowStructure) return null;
  const parentSnap = parentSnapshots.find(
    (s) => s.stageName === subflowNodeName || s.stageLabel === subflowNodeName
  );
  if (!parentSnap?.subflowResult) return null;
  const sfId = specNode.subflowId ?? subflowNodeName;
  const sfDisplayName = specNode.subflowName ?? specNode.name;
  const sfNarrative = narrativeEntries ? extractSubflowNarrative(narrativeEntries, sfId, sfDisplayName) : void 0;
  const sfSnapshots = subflowResultToSnapshots(parentSnap.subflowResult, sfNarrative);
  if (sfSnapshots.length === 0) return null;
  return {
    subflowId: specNode.subflowId ?? subflowNodeName,
    label: specNode.subflowName ?? specNode.name,
    spec: specNode.subflowStructure,
    snapshots: sfSnapshots
  };
}
function findSubflowSpecNode(node, name) {
  if ((node.name === name || node.id === name) && node.isSubflowRoot) return node;
  if (node.children) {
    for (const child of node.children) {
      const f = findSubflowSpecNode(child, name);
      if (f) return f;
    }
  }
  if (node.next) return findSubflowSpecNode(node.next, name);
  return null;
}
function hasSubflowNodes(node) {
  if (!node) return false;
  if (node.isSubflowRoot) return true;
  if (node.children?.some((c) => c && hasSubflowNodes(c))) return true;
  if (node.next && hasSubflowNodes(node.next)) return true;
  return false;
}
function defaultRenderFlowchart({ spec: s, snapshots: snaps, selectedIndex, onNodeClick }) {
  return /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
    TracedFlowchartView,
    {
      spec: s,
      snapshots: snaps,
      snapshotIndex: selectedIndex,
      onNodeClick
    }
  );
}
function ExplainableShell({
  snapshots: snapshotsProp,
  runtimeSnapshot,
  spec,
  title,
  resultData: resultDataProp,
  logs = [],
  narrative: narrativeProp,
  narrativeEntries,
  tabs = ["result", "explainable"],
  defaultTab,
  hideConsole = false,
  hideTabs: hideTabsProp,
  panelLabels,
  defaultExpanded,
  recorderViews,
  renderFlowchart,
  size = "default",
  unstyled = false,
  className,
  style
}) {
  const derivedFromRuntime = (0, import_react19.useMemo)(() => {
    if (!runtimeSnapshot) return null;
    try {
      const snaps = toVisualizationSnapshots(runtimeSnapshot, narrativeEntries);
      const narr = [];
      for (const snap of snaps) {
        const lines = (snap.narrative ?? "").split("\n").filter(Boolean);
        narr.push(...lines);
      }
      return { snapshots: snaps, resultData: runtimeSnapshot.sharedState, narrative: narr };
    } catch {
      return null;
    }
  }, [runtimeSnapshot, narrativeEntries]);
  const snapshots = snapshotsProp ?? derivedFromRuntime?.snapshots ?? [];
  const resultData = resultDataProp ?? derivedFromRuntime?.resultData ?? null;
  const narrative = narrativeProp ?? derivedFromRuntime?.narrative;
  const effectiveRenderFlowchart = renderFlowchart ?? (spec ? defaultRenderFlowchart : void 0);
  const leftLabel = panelLabels?.topology ?? "Topology";
  const rightLabel = panelLabels?.details ?? "Details";
  const bottomLabel = panelLabels?.timeline ?? "Timeline";
  const shellRef = (0, import_react19.useRef)(null);
  const [isNarrow, setIsNarrow] = (0, import_react19.useState)(false);
  (0, import_react19.useEffect)(() => {
    const el = shellRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setIsNarrow(entry.contentRect.width < 640);
      window.dispatchEvent(new Event("resize"));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const autoRecorderViews = (0, import_react19.useMemo)(() => {
    const recorders = runtimeSnapshot?.recorders;
    if (!recorders?.length) return [];
    const explicitIds = new Set((recorderViews ?? []).map((v2) => v2.id));
    return recorders.filter((r) => !explicitIds.has(r.id)).map((r) => ({ id: r.id, name: r.name, description: r.description, preferredOperation: r.preferredOperation, data: r.data }));
  }, [runtimeSnapshot, recorderViews]);
  const hasNarrative = !!(narrative?.length || narrativeEntries?.length);
  const allTabs = (0, import_react19.useMemo)(() => {
    const tabs2 = [
      { id: "result", name: "Result", description: "Final output and console logs" },
      { id: "memory", name: "Memory", description: "Accumulator \u2014 progressive shared state at each stage" }
    ];
    if (hasNarrative) {
      tabs2.push({ id: "narrative", name: "Narrative", description: "Translator (SequenceRecorder) \u2014 interleaved flow + data narrative per execution step" });
    }
    for (const v2 of recorderViews ?? []) {
      tabs2.push({ id: v2.id, name: v2.name, description: v2.description });
    }
    for (const v2 of autoRecorderViews) {
      tabs2.push({ id: v2.id, name: v2.name, description: v2.description });
    }
    const hideSet = new Set(hideTabsProp ?? []);
    return hideSet.size > 0 ? tabs2.filter((t) => !hideSet.has(t.id)) : tabs2;
  }, [hasNarrative, recorderViews, autoRecorderViews, hideTabsProp]);
  const validTabIds = new Set(allTabs.map((t) => t.id));
  const resolvedDefault = defaultTab && validTabIds.has(defaultTab) ? defaultTab : allTabs[0]?.id ?? "result";
  const [activeTab, setActiveTab] = (0, import_react19.useState)(resolvedDefault);
  const [snapshotIdx, setSnapshotIdx] = (0, import_react19.useState)(0);
  const [drillDownStack, setDrillDownStack] = (0, import_react19.useState)([]);
  const [rightExpanded, setRightExpanded] = (0, import_react19.useState)(defaultExpanded?.details ?? true);
  const [leftExpanded, setLeftExpanded] = (0, import_react19.useState)(defaultExpanded?.topology ?? false);
  const [timelineExpanded, setTimelineExpanded] = (0, import_react19.useState)(defaultExpanded?.timeline ?? false);
  (0, import_react19.useEffect)(() => {
    if (isNarrow) {
      setLeftExpanded(false);
      setRightExpanded(false);
      setTimelineExpanded(false);
    }
  }, [isNarrow]);
  const triggerReflow = (0, import_react19.useCallback)(() => {
    requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
    setTimeout(() => window.dispatchEvent(new Event("resize")), 320);
  }, []);
  const toggleLeft = (0, import_react19.useCallback)((v2) => {
    setLeftExpanded(v2);
    triggerReflow();
  }, [triggerReflow]);
  const toggleRight = (0, import_react19.useCallback)((v2) => {
    setRightExpanded(v2);
    triggerReflow();
  }, [triggerReflow]);
  const toggleTimeline = (0, import_react19.useCallback)(() => {
    setTimelineExpanded((p) => !p);
    triggerReflow();
  }, [triggerReflow]);
  const isInSubflow = drillDownStack.length > 0;
  const currentLevel = (0, import_react19.useMemo)(() => {
    if (drillDownStack.length > 0) {
      const top = drillDownStack[drillDownStack.length - 1];
      return { spec: top.spec, snapshots: top.snapshots };
    }
    return { spec: spec ?? null, snapshots };
  }, [drillDownStack, spec, snapshots]);
  const activeSnapshots = currentLevel.snapshots;
  const activeSpec = currentLevel.spec;
  const safeIdx = activeSnapshots.length > 0 ? Math.max(0, Math.min(snapshotIdx, activeSnapshots.length - 1)) : 0;
  const activeNarrative = (0, import_react19.useMemo)(() => {
    if (!isInSubflow) return narrative;
    const lines = [];
    for (const snap of activeSnapshots) {
      const stageLines = (snap.narrative ?? "").split("\n").filter(Boolean);
      lines.push(...stageLines);
    }
    return lines.length > 0 ? lines : void 0;
  }, [isInSubflow, narrative, activeSnapshots]);
  const activeNarrativeEntries = isInSubflow ? void 0 : narrativeEntries;
  const breadcrumbs = (0, import_react19.useMemo)(() => {
    const root = { label: title || "Flowchart", spec, description: spec?.description };
    return [root, ...drillDownStack.map((e) => ({ label: e.label, spec: e.spec, description: void 0 }))];
  }, [spec, title, drillDownStack]);
  const showTreeSidebar = (0, import_react19.useMemo)(() => !!spec && hasSubflowNodes(spec), [spec]);
  const rootOverlay = (0, import_react19.useMemo)(() => {
    if (isInSubflow || !snapshots.length) return { activeStage: void 0, doneStages: void 0 };
    const doneStages = new Set(snapshots.slice(0, safeIdx).map((s) => s.stageLabel));
    const activeStage = snapshots[safeIdx]?.stageLabel ?? null;
    return { activeStage, doneStages };
  }, [isInSubflow, snapshots, safeIdx]);
  const handleTabChange = (0, import_react19.useCallback)((tab) => {
    setActiveTab(tab);
    setDrillDownStack([]);
  }, []);
  const handleSnapshotChange = (0, import_react19.useCallback)((idx) => {
    if (typeof idx === "number") setSnapshotIdx(idx);
  }, []);
  const handleDrillDown = (0, import_react19.useCallback)(
    (nodeName) => {
      if (!activeSpec) return;
      const entry = resolveSubflowLevel(activeSpec, activeSnapshots, nodeName, narrativeEntries);
      if (entry) {
        setDrillDownStack((prev) => [...prev, { ...entry, parentSnapshotIdx: snapshotIdx }]);
        setSnapshotIdx(0);
      }
    },
    [activeSpec, activeSnapshots, narrativeEntries, snapshotIdx]
  );
  const handleBreadcrumbNavigate = (0, import_react19.useCallback)((level) => {
    setDrillDownStack((prev) => {
      const popped = level === 0 ? prev[0] : prev[level];
      if (popped) setSnapshotIdx(popped.parentSnapshotIdx);
      return level === 0 ? [] : prev.slice(0, level);
    });
  }, []);
  const handleNodeClick = (0, import_react19.useCallback)(
    (indexOrId) => {
      if (typeof indexOrId === "number") {
        setSnapshotIdx(indexOrId);
        return;
      }
      if (activeSpec) {
        const sfNode = findSubflowSpecNode(activeSpec, indexOrId);
        if (sfNode?.subflowStructure) {
          handleDrillDown(indexOrId);
          return;
        }
      }
      const idx = activeSnapshots.findIndex((s) => s.stageLabel === indexOrId);
      if (idx >= 0) setSnapshotIdx(idx);
    },
    [activeSpec, activeSnapshots, handleDrillDown]
  );
  const handleTreeNodeSelect = (0, import_react19.useCallback)(
    (name, isSubflow) => {
      if (isSubflow && spec) {
        setDrillDownStack([]);
        const entry = resolveSubflowLevel(spec, snapshots, name, narrativeEntries);
        if (entry) {
          setDrillDownStack([{ ...entry, parentSnapshotIdx: snapshotIdx }]);
          setSnapshotIdx(0);
        }
      } else {
        setDrillDownStack([]);
        const idx = snapshots.findIndex((s) => s.stageLabel === name);
        if (idx >= 0) setSnapshotIdx(idx);
      }
    },
    [spec, snapshots, narrativeEntries, snapshotIdx]
  );
  const tabLabels = new Map(allTabs.map((t) => [t.id, t.name]));
  if (unstyled) {
    return /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className, style, "data-fp": "explainable-shell", children: [
      /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { "data-fp": "shell-tabs", children: allTabs.map((tab) => /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("button", { "data-fp": "shell-tab", "data-active": tab.id === activeTab, onClick: () => handleTabChange(tab.id), children: tab.name }, tab.id)) }),
      /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { "data-fp": "shell-content", "data-tab": activeTab, children: [
        activeTab === "result" && /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(ResultPanel, { data: resultData ?? null, logs, hideConsole, unstyled: true }),
        (activeTab === "explainable" || activeTab === "ai-compatible") && /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)(import_jsx_runtime18.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(TimeTravelControls, { snapshots: activeSnapshots, selectedIndex: safeIdx, onIndexChange: handleSnapshotChange, unstyled: true }),
          isInSubflow && /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(SubflowBreadcrumb, { breadcrumbs, onNavigate: handleBreadcrumbNavigate }),
          activeSpec && effectiveRenderFlowchart?.({ spec: activeSpec, snapshots: activeSnapshots, selectedIndex: safeIdx, onNodeClick: handleNodeClick }),
          /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(MemoryPanel, { snapshots: activeSnapshots, selectedIndex: safeIdx, unstyled: true }),
          /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(NarrativePanel, { snapshots: activeSnapshots, selectedIndex: safeIdx, narrativeEntries: activeNarrativeEntries, narrative: activeNarrative, unstyled: true }),
          /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(GanttTimeline, { snapshots: activeSnapshots, selectedIndex: safeIdx, onSelect: handleSnapshotChange, unstyled: true })
        ] })
      ] })
    ] });
  }
  const showTopology = !!effectiveRenderFlowchart && !!activeSpec;
  const detailsContent = (0, import_react19.useMemo)(() => {
    if (activeTab === "result") {
      return /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(ResultPanel, { data: resultData ?? null, logs, hideConsole, size });
    }
    if (activeTab === "memory") {
      return /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(MemoryPanel, { snapshots: activeSnapshots, selectedIndex: safeIdx, size, style: { height: "100%" } });
    }
    if (activeTab === "narrative") {
      return /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(NarrativePanel, { snapshots: activeSnapshots, selectedIndex: safeIdx, narrativeEntries: activeNarrativeEntries, narrative: activeNarrative, size, style: { height: "100%" } });
    }
    const customView = recorderViews?.find((v2) => v2.id === activeTab);
    if (customView?.render) {
      return customView.render({ snapshots: activeSnapshots, selectedIndex: safeIdx });
    }
    const autoView = autoRecorderViews.find((v2) => v2.id === activeTab);
    if (autoView) {
      return /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
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
  }, [activeTab, resultData, logs, hideConsole, size, activeSnapshots, safeIdx, activeNarrativeEntries, activeNarrative, recorderViews, autoRecorderViews]);
  const detailsPanel = /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { style: { display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { style: {
      display: "flex",
      borderBottom: `1px solid ${theme.border}`,
      background: theme.bgSecondary,
      flexShrink: 0,
      overflowX: "auto"
    }, children: allTabs.map((tab) => {
      const active = tab.id === activeTab;
      return /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
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
    /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { style: { flex: 1, overflow: "auto" }, children: detailsContent })
  ] });
  return /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)(
    "div",
    {
      ref: shellRef,
      className,
      style: {
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
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
          TimeTravelControls,
          {
            snapshots: activeSnapshots,
            selectedIndex: safeIdx,
            onIndexChange: handleSnapshotChange,
            size
          }
        ),
        isInSubflow && /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(SubflowBreadcrumb, { breadcrumbs, onNavigate: handleBreadcrumbNavigate }),
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { style: { flex: 1, overflow: isNarrow ? "auto" : "hidden", display: "flex", flexDirection: "column" }, children: isNarrow ? (
          /* ── Mobile: stacked vertical ── */
          /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)(import_jsx_runtime18.Fragment, { children: [
            showTopology && /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { style: { height: 350, flexShrink: 0, overflow: "hidden" }, children: effectiveRenderFlowchart({
              spec: activeSpec,
              snapshots: activeSnapshots,
              selectedIndex: safeIdx,
              onNodeClick: handleNodeClick
            }) }),
            showTreeSidebar && /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)(import_jsx_runtime18.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(HLinePill, { label: leftLabel, expanded: leftExpanded, onClick: () => toggleLeft(!leftExpanded) }),
              leftExpanded && /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { style: { maxHeight: 180, overflow: "auto", flexShrink: 0 }, children: /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
                SubflowTree,
                {
                  spec,
                  activeStage: rootOverlay.activeStage,
                  doneStages: rootOverlay.doneStages,
                  onNodeSelect: handleTreeNodeSelect
                }
              ) })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(HLinePill, { label: rightLabel, expanded: rightExpanded, onClick: () => toggleRight(!rightExpanded) }),
            rightExpanded && /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { style: { maxHeight: 350, flexShrink: 0, overflow: "hidden" }, children: detailsPanel }),
            /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(HLinePill, { label: bottomLabel, detail: `${activeSnapshots.length} stages`, expanded: timelineExpanded, onClick: toggleTimeline }),
            timelineExpanded && /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { style: { flexShrink: 0, overflow: "hidden" }, children: /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(GanttTimeline, { snapshots: activeSnapshots, selectedIndex: safeIdx, onSelect: handleSnapshotChange, size }) })
          ] })
        ) : showTopology ? (
          /* ── Desktop with topology: side-by-side ── */
          /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)(import_jsx_runtime18.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { style: { flex: 1, display: "flex", overflow: "hidden" }, children: [
              showTreeSidebar && (leftExpanded ? /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { style: { width: 220, flexShrink: 0, display: "flex", flexDirection: "row", overflow: "hidden" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { style: { flex: 1, overflow: "auto" }, children: /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
                  SubflowTree,
                  {
                    spec,
                    activeStage: rootOverlay.activeStage,
                    doneStages: rootOverlay.doneStages,
                    onNodeSelect: handleTreeNodeSelect
                  }
                ) }),
                /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(VLinePill, { label: leftLabel, expanded: true, side: "left", onClick: () => toggleLeft(false) })
              ] }) : /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(VLinePill, { label: leftLabel, expanded: false, side: "left", onClick: () => toggleLeft(true) })),
              /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { style: { flex: 1, overflow: "hidden", minWidth: 0 }, children: effectiveRenderFlowchart({
                spec: activeSpec,
                snapshots: activeSnapshots,
                selectedIndex: safeIdx,
                onNodeClick: handleNodeClick
              }) }),
              rightExpanded ? /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { style: { width: "38%", minWidth: 300, maxWidth: 500, display: "flex", flexDirection: "row", overflow: "hidden" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(VLinePill, { label: rightLabel, expanded: true, onClick: () => toggleRight(false) }),
                /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { style: { flex: 1, overflow: "hidden" }, children: detailsPanel })
              ] }) : /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(VLinePill, { label: rightLabel, expanded: false, onClick: () => toggleRight(true) })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(HLinePill, { label: bottomLabel, detail: `${activeSnapshots.length} stages`, expanded: timelineExpanded, onClick: toggleTimeline }),
            timelineExpanded && /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { style: { flexShrink: 0, overflow: "hidden" }, children: /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(GanttTimeline, { snapshots: activeSnapshots, selectedIndex: safeIdx, onSelect: handleSnapshotChange, size }) })
          ] })
        ) : (
          /* ── Desktop without topology: details panel takes full width ── */
          /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)(import_jsx_runtime18.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { style: { flex: 1, overflow: "hidden" }, children: detailsPanel }),
            /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(HLinePill, { label: bottomLabel, detail: `${activeSnapshots.length} stages`, expanded: timelineExpanded, onClick: toggleTimeline }),
            timelineExpanded && /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { style: { flexShrink: 0, overflow: "hidden" }, children: /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(GanttTimeline, { snapshots: activeSnapshots, selectedIndex: safeIdx, onSelect: handleSnapshotChange, size }) })
          ] })
        ) })
      ]
    }
  );
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ExplainableShell,
  FootprintTheme,
  GanttTimeline,
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
  TimeTravelControls,
  buildEntryRangeIndex,
  computeRevealedEntryCount,
  coolDark,
  coolLight,
  createSnapshots,
  defaultTokens,
  extractSubflowNarrative,
  rawDefaults,
  subflowResultToSnapshots,
  themePresets,
  toVisualizationSnapshots,
  tokensToCSSVars,
  useDarkModeTokens,
  useFootprintTheme,
  warmDark,
  warmLight
});
//# sourceMappingURL=index.cjs.map