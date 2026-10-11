'use strict';

var chunk4X66ZS4F_cjs = require('./chunk-4X66ZS4F.cjs');
var chunkDGKL4TUX_cjs = require('./chunk-DGKL4TUX.cjs');
var chunkG4GT73OY_cjs = require('./chunk-G4GT73OY.cjs');
var chunkCOT43DA6_cjs = require('./chunk-COT43DA6.cjs');
var React2 = require('react');
var jsxRuntime = require('react/jsx-runtime');
var foottrace = require('foottrace');

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var React2__namespace = /*#__PURE__*/_interopNamespace(React2);

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
  const revealedGroups = React2.useMemo(() => parseGroups(revealed), [revealed]);
  const futureGroups = React2.useMemo(() => parseGroups(future), [future]);
  const [collapsedSet, setCollapsedSet] = React2.useState(() => {
    if (!defaultCollapsed) return /* @__PURE__ */ new Set();
    return new Set(parseGroups(narrative).map((g) => g.headerIdx));
  });
  const latestRef = React2.useRef(null);
  React2.useEffect(() => {
    latestRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [revealedGroups.length]);
  const toggle = React2.useCallback((idx) => {
    setCollapsedSet((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }, []);
  const lastIdx = revealedGroups.length - 1;
  const fs = chunkCOT43DA6_cjs.fontSize[size];
  const pad = chunkCOT43DA6_cjs.padding[size];
  if (unstyled) {
    return /* @__PURE__ */ jsxRuntime.jsxs("div", { className, style, "data-fp": "narrative-trace", children: [
      revealedGroups.map((group, gi) => /* @__PURE__ */ jsxRuntime.jsxs("div", { "data-fp": "narrative-group", "data-latest": gi === lastIdx, children: [
        /* @__PURE__ */ jsxRuntime.jsx(
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
        !collapsedSet.has(group.headerIdx) && group.steps.map((step) => /* @__PURE__ */ jsxRuntime.jsx("div", { "data-fp": "narrative-step", children: step.text }, step.idx))
      ] }, group.headerIdx)),
      futureGroups.length > 0 && /* @__PURE__ */ jsxRuntime.jsxs("div", { "data-fp": "narrative-future-hint", children: [
        futureGroups.length,
        " more ",
        futureGroups.length === 1 ? "stage" : "stages",
        " ahead..."
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "div",
    {
      className,
      style: {
        flex: 1,
        overflow: "auto",
        padding: pad,
        fontFamily: chunkCOT43DA6_cjs.theme.fontMono,
        ...style
      },
      "data-fp": "narrative-trace",
      children: [
        revealedGroups.map((group, gi) => {
          const isLatest = gi === lastIdx;
          const isCollapsed = collapsedSet.has(group.headerIdx);
          const hasSteps = group.steps.length > 0;
          return /* @__PURE__ */ jsxRuntime.jsxs(
            "div",
            {
              ref: isLatest ? latestRef : void 0,
              style: { marginBottom: 2 },
              "data-fp": "narrative-group",
              children: [
                /* @__PURE__ */ jsxRuntime.jsxs(
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
                      color: isLatest ? chunkCOT43DA6_cjs.theme.textPrimary : chunkCOT43DA6_cjs.theme.textSecondary,
                      padding: `4px ${pad - 4}px`,
                      borderRadius: 4,
                      background: isLatest ? chunkCOT43DA6_cjs.theme.bgTertiary : "transparent",
                      borderLeft: isLatest ? `3px solid ${chunkCOT43DA6_cjs.theme.primary}` : `3px solid ${chunkCOT43DA6_cjs.theme.success}`,
                      cursor: hasSteps ? "pointer" : "default",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      userSelect: "none",
                      transition: "all 0.15s ease"
                    },
                    children: [
                      hasSteps && /* @__PURE__ */ jsxRuntime.jsx(
                        "span",
                        {
                          style: {
                            fontSize: fs.small - 1,
                            color: chunkCOT43DA6_cjs.theme.textMuted,
                            transition: "transform 0.15s ease",
                            transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
                            display: "inline-block",
                            width: 10,
                            flexShrink: 0
                          },
                          children: "\u25BC"
                        }
                      ),
                      !hasSteps && /* @__PURE__ */ jsxRuntime.jsx("span", { style: { width: 10, flexShrink: 0 } }),
                      /* @__PURE__ */ jsxRuntime.jsx("span", { children: group.header })
                    ]
                  }
                ),
                !isCollapsed && group.steps.map((step) => /* @__PURE__ */ jsxRuntime.jsx(
                  "div",
                  {
                    style: {
                      fontSize: fs.small,
                      lineHeight: 1.6,
                      color: isLatest ? chunkCOT43DA6_cjs.theme.textSecondary : chunkCOT43DA6_cjs.theme.textMuted,
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
        futureGroups.length > 0 && /* @__PURE__ */ jsxRuntime.jsxs("div", { style: {
          opacity: 0.3,
          fontSize: fs.small,
          color: chunkCOT43DA6_cjs.theme.textMuted,
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
  const [selectedIndex, setSelectedIndex] = React2.useState(0);
  const fs = chunkCOT43DA6_cjs.fontSize[size];
  const pad = chunkCOT43DA6_cjs.padding[size];
  if (snapshots.length === 0) {
    return /* @__PURE__ */ jsxRuntime.jsx(
      "div",
      {
        className,
        style: {
          ...chunkG4GT73OY_cjs.themeModeVars(themeMode),
          padding: pad * 2,
          textAlign: "center",
          color: unstyled ? void 0 : chunkCOT43DA6_cjs.theme.textMuted,
          fontSize: fs.body,
          ...style
        },
        "data-fp": "snapshot-panel",
        children: "No snapshots to display"
      }
    );
  }
  if (unstyled) {
    return /* @__PURE__ */ jsxRuntime.jsxs("div", { className, style, "data-fp": "snapshot-panel", children: [
      /* @__PURE__ */ jsxRuntime.jsx("h3", { children: title }),
      showScrubber && /* @__PURE__ */ jsxRuntime.jsx(
        "input",
        {
          type: "range",
          min: 0,
          max: snapshots.length - 1,
          value: selectedIndex,
          onChange: (e) => setSelectedIndex(parseInt(e.target.value))
        }
      ),
      /* @__PURE__ */ jsxRuntime.jsx(
        chunk4X66ZS4F_cjs.MemoryInspector,
        {
          snapshots,
          selectedIndex,
          unstyled: true
        }
      ),
      /* @__PURE__ */ jsxRuntime.jsx(
        chunk4X66ZS4F_cjs.NarrativeLog,
        {
          snapshots,
          selectedIndex,
          unstyled: true
        }
      ),
      showGantt && /* @__PURE__ */ jsxRuntime.jsx(
        chunk4X66ZS4F_cjs.GanttTimeline,
        {
          snapshots,
          selectedIndex,
          onSelect: setSelectedIndex,
          unstyled: true
        }
      )
    ] });
  }
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "div",
    {
      className,
      style: {
        // The one-word switch (see theme/mode.ts) — this panel is the one
        // people drop into an existing app on its own.
        ...chunkG4GT73OY_cjs.themeModeVars(themeMode),
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: chunkCOT43DA6_cjs.theme.bgPrimary,
        fontFamily: chunkCOT43DA6_cjs.theme.fontSans,
        overflow: "hidden",
        ...style
      },
      "data-fp": "snapshot-panel",
      children: [
        /* @__PURE__ */ jsxRuntime.jsxs(
          "div",
          {
            style: {
              padding: `${pad}px ${pad + 4}px`,
              borderBottom: `1px solid ${chunkCOT43DA6_cjs.theme.border}`,
              background: chunkCOT43DA6_cjs.theme.bgSecondary,
              flexShrink: 0
            },
            children: [
              /* @__PURE__ */ jsxRuntime.jsxs(
                "div",
                {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: showScrubber ? 8 : 0
                  },
                  children: [
                    /* @__PURE__ */ jsxRuntime.jsx(
                      "span",
                      {
                        style: {
                          fontSize: fs.body + 2,
                          fontWeight: 600,
                          color: chunkCOT43DA6_cjs.theme.textPrimary
                        },
                        children: title
                      }
                    ),
                    /* @__PURE__ */ jsxRuntime.jsxs(
                      "span",
                      {
                        style: {
                          fontSize: fs.small,
                          color: chunkCOT43DA6_cjs.theme.textMuted,
                          fontFamily: chunkCOT43DA6_cjs.theme.fontMono
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
              showScrubber && /* @__PURE__ */ jsxRuntime.jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
                /* @__PURE__ */ jsxRuntime.jsx(
                  ScrubButton,
                  {
                    glyph: "\u25C0",
                    label: "Previous stage",
                    disabled: selectedIndex === 0,
                    onClick: () => setSelectedIndex((i) => Math.max(0, i - 1))
                  }
                ),
                /* @__PURE__ */ jsxRuntime.jsx(
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
                      accentColor: chunkCOT43DA6_cjs.theme.primary,
                      cursor: "pointer"
                    }
                  }
                ),
                /* @__PURE__ */ jsxRuntime.jsx(
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
        /* @__PURE__ */ jsxRuntime.jsxs("div", { style: { flex: 1, overflow: "auto" }, children: [
          /* @__PURE__ */ jsxRuntime.jsx(
            chunk4X66ZS4F_cjs.MemoryInspector,
            {
              snapshots,
              selectedIndex,
              size
            }
          ),
          /* @__PURE__ */ jsxRuntime.jsx(
            "div",
            {
              style: {
                height: 1,
                background: chunkCOT43DA6_cjs.theme.border,
                margin: `0 ${pad}px`
              }
            }
          ),
          /* @__PURE__ */ jsxRuntime.jsx(
            chunk4X66ZS4F_cjs.NarrativeLog,
            {
              snapshots,
              selectedIndex,
              size
            }
          )
        ] }),
        showGantt && /* @__PURE__ */ jsxRuntime.jsx(
          "div",
          {
            style: {
              borderTop: `1px solid ${chunkCOT43DA6_cjs.theme.border}`,
              background: chunkCOT43DA6_cjs.theme.bgSecondary,
              flexShrink: 0
            },
            children: /* @__PURE__ */ jsxRuntime.jsx(
              chunk4X66ZS4F_cjs.GanttTimeline,
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
  label: label2,
  disabled,
  onClick
}) {
  return /* @__PURE__ */ jsxRuntime.jsx(
    "button",
    {
      type: "button",
      onClick,
      disabled,
      "aria-label": label2,
      title: label2,
      "data-fp": "scrub-button",
      style: {
        background: chunkCOT43DA6_cjs.theme.bgTertiary,
        border: `1px solid ${chunkCOT43DA6_cjs.theme.border}`,
        color: disabled ? chunkCOT43DA6_cjs.theme.textMuted : chunkCOT43DA6_cjs.theme.textPrimary,
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
      children: /* @__PURE__ */ jsxRuntime.jsx("span", { "aria-hidden": "true", children: glyph })
    }
  );
}
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
    } else if (!chunk4X66ZS4F_cjs.displayValuesEqual(oldVal, newVal)) {
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
  return chunk4X66ZS4F_cjs.displayValue(v2, 2);
}
var diffColors = {
  added: { bg: `color-mix(in srgb, ${chunkCOT43DA6_cjs.theme.success} 10%, transparent)`, fg: chunkCOT43DA6_cjs.theme.success, icon: "+" },
  removed: { bg: `color-mix(in srgb, ${chunkCOT43DA6_cjs.theme.error} 10%, transparent)`, fg: chunkCOT43DA6_cjs.theme.error, icon: "-" },
  changed: { bg: `color-mix(in srgb, ${chunkCOT43DA6_cjs.theme.warning} 10%, transparent)`, fg: chunkCOT43DA6_cjs.theme.warning, icon: "~" },
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
  const entries = React2.useMemo(() => computeDiff(previous, current), [previous, current]);
  const visible = hideUnchanged ? entries.filter((e) => e.type !== "unchanged") : entries;
  const fs = chunkCOT43DA6_cjs.fontSize[size];
  const pad = chunkCOT43DA6_cjs.padding[size];
  if (unstyled) {
    return /* @__PURE__ */ jsxRuntime.jsx("div", { className, style, "data-fp": "scope-diff", children: visible.map((e) => /* @__PURE__ */ jsxRuntime.jsxs("div", { "data-fp": "diff-entry", "data-type": e.type, children: [
      /* @__PURE__ */ jsxRuntime.jsx("span", { "data-fp": "diff-key", children: e.key }),
      e.type === "changed" && /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
        /* @__PURE__ */ jsxRuntime.jsx("span", { "data-fp": "diff-old", children: fmt(e.oldValue) }),
        /* @__PURE__ */ jsxRuntime.jsx("span", { "data-fp": "diff-new", children: fmt(e.newValue) })
      ] }),
      (e.type === "added" || e.type === "unchanged") && /* @__PURE__ */ jsxRuntime.jsx("span", { "data-fp": "diff-value", children: fmt(e.newValue) }),
      e.type === "removed" && /* @__PURE__ */ jsxRuntime.jsx("span", { "data-fp": "diff-value", children: fmt(e.oldValue) })
    ] }, e.key)) });
  }
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "div",
    {
      className,
      style: { padding: pad, fontFamily: chunkCOT43DA6_cjs.theme.fontMono, ...style },
      "data-fp": "scope-diff",
      children: [
        visible.length === 0 && /* @__PURE__ */ jsxRuntime.jsx("div", { style: { fontSize: fs.body, color: chunkCOT43DA6_cjs.theme.textMuted, fontStyle: "italic" }, children: "No changes" }),
        visible.map((entry) => {
          const dc = diffColors[entry.type];
          return /* @__PURE__ */ jsxRuntime.jsxs(
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
                /* @__PURE__ */ jsxRuntime.jsx(
                  "span",
                  {
                    style: {
                      width: 16,
                      flexShrink: 0,
                      fontWeight: 700,
                      color: dc.fg || chunkCOT43DA6_cjs.theme.textMuted,
                      textAlign: "center"
                    },
                    children: dc.icon
                  }
                ),
                /* @__PURE__ */ jsxRuntime.jsx("span", { style: { color: chunkCOT43DA6_cjs.theme.primary, fontWeight: 600, flexShrink: 0 }, children: entry.key }),
                /* @__PURE__ */ jsxRuntime.jsx("span", { style: { color: chunkCOT43DA6_cjs.theme.textMuted }, children: "=" }),
                entry.type === "changed" ? /* @__PURE__ */ jsxRuntime.jsxs("span", { children: [
                  /* @__PURE__ */ jsxRuntime.jsx(
                    "span",
                    {
                      style: {
                        color: chunkCOT43DA6_cjs.theme.error,
                        textDecoration: "line-through",
                        opacity: 0.7
                      },
                      children: fmt(entry.oldValue)
                    }
                  ),
                  /* @__PURE__ */ jsxRuntime.jsx("span", { style: { color: chunkCOT43DA6_cjs.theme.textMuted, margin: "0 4px" }, children: "\u2192" }),
                  /* @__PURE__ */ jsxRuntime.jsx("span", { style: { color: chunkCOT43DA6_cjs.theme.success }, children: fmt(entry.newValue) })
                ] }) : /* @__PURE__ */ jsxRuntime.jsx(
                  "span",
                  {
                    style: {
                      color: entry.type === "added" ? chunkCOT43DA6_cjs.theme.success : entry.type === "removed" ? chunkCOT43DA6_cjs.theme.error : chunkCOT43DA6_cjs.theme.textPrimary
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
function ResultPanel({
  data,
  logs = [],
  hideConsole = false,
  size = "default",
  unstyled = false,
  className,
  style
}) {
  const fs = chunkCOT43DA6_cjs.fontSize[size];
  const pad = chunkCOT43DA6_cjs.padding[size];
  if (unstyled) {
    return /* @__PURE__ */ jsxRuntime.jsxs("div", { className, style, "data-fp": "result-panel", children: [
      /* @__PURE__ */ jsxRuntime.jsx("div", { "data-fp": "result-data", children: /* @__PURE__ */ jsxRuntime.jsx("pre", { children: data ? JSON.stringify(data, null, 2) : "No data" }) }),
      !hideConsole && /* @__PURE__ */ jsxRuntime.jsx("div", { "data-fp": "result-console", children: logs.map((line, i) => /* @__PURE__ */ jsxRuntime.jsx("div", { "data-fp": "console-line", "data-error": line.startsWith("ERROR"), children: line }, i)) })
    ] });
  }
  return /* @__PURE__ */ jsxRuntime.jsxs(
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
        data && /* @__PURE__ */ jsxRuntime.jsxs("div", { style: { flex: 1, overflow: "auto", padding: pad }, children: [
          /* @__PURE__ */ jsxRuntime.jsx(
            "div",
            {
              style: {
                fontSize: fs.label,
                fontWeight: 600,
                color: chunkCOT43DA6_cjs.theme.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 8
              },
              children: size === "compact" ? "Result" : "Business Result (Scope)"
            }
          ),
          /* @__PURE__ */ jsxRuntime.jsx(
            "pre",
            {
              style: {
                fontSize: fs.body,
                fontFamily: chunkCOT43DA6_cjs.theme.fontMono,
                color: chunkCOT43DA6_cjs.theme.textPrimary,
                background: chunkCOT43DA6_cjs.theme.bgSecondary,
                padding: pad,
                borderRadius: chunkCOT43DA6_cjs.theme.radius,
                overflow: "auto",
                margin: 0
              },
              children: JSON.stringify(data, null, 2)
            }
          )
        ] }),
        !hideConsole && /* @__PURE__ */ jsxRuntime.jsxs(
          "div",
          {
            style: {
              borderTop: `1px solid ${chunkCOT43DA6_cjs.theme.border}`,
              padding: pad,
              overflow: "auto",
              maxHeight: "40%",
              flexShrink: 0
            },
            children: [
              /* @__PURE__ */ jsxRuntime.jsx(
                "div",
                {
                  style: {
                    fontSize: fs.label,
                    fontWeight: 600,
                    color: chunkCOT43DA6_cjs.theme.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 8
                  },
                  children: "Console"
                }
              ),
              logs.length === 0 && /* @__PURE__ */ jsxRuntime.jsx("div", { style: { fontSize: fs.body, color: chunkCOT43DA6_cjs.theme.textMuted, fontStyle: "italic" }, children: "No console output" }),
              logs.map((line, i) => /* @__PURE__ */ jsxRuntime.jsx(
                "div",
                {
                  style: {
                    fontSize: fs.body,
                    fontFamily: chunkCOT43DA6_cjs.theme.fontMono,
                    color: line.startsWith("ERROR") ? chunkCOT43DA6_cjs.theme.error : chunkCOT43DA6_cjs.theme.textPrimary,
                    padding: "2px 0",
                    borderBottom: `1px solid ${chunkCOT43DA6_cjs.theme.bgSecondary}`,
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
    } else if (!chunk4X66ZS4F_cjs.displayValuesEqual(oldVal, newVal)) {
      changes.push({ key, type: "updated", oldValue: oldVal, newValue: newVal });
    }
  }
  const order = { added: 0, updated: 1, removed: 2 };
  changes.sort((a, b) => order[a.type] - order[b.type]);
  return changes;
}
function fmt2(v2) {
  return chunk4X66ZS4F_cjs.displayValue(v2, 2);
}
var wash = (color) => `color-mix(in srgb, ${color} 12%, transparent)`;
var changeBadge = {
  added: { bg: wash(chunkCOT43DA6_cjs.theme.success), fg: chunkCOT43DA6_cjs.theme.success, label: "ADD" },
  updated: { bg: wash(chunkCOT43DA6_cjs.theme.warning), fg: chunkCOT43DA6_cjs.theme.warning, label: "UPD" },
  removed: { bg: wash(chunkCOT43DA6_cjs.theme.error), fg: chunkCOT43DA6_cjs.theme.error, label: "DEL" }
};
function SimpleView({
  snapshot,
  fs,
  pad
}) {
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 16 }, children: [
    /* @__PURE__ */ jsxRuntime.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntime.jsx(
        "div",
        {
          style: {
            fontSize: fs.label + 2,
            fontWeight: 700,
            color: chunkCOT43DA6_cjs.theme.textPrimary
          },
          children: snapshot.stageLabel
        }
      ),
      snapshot.description && /* @__PURE__ */ jsxRuntime.jsx(
        "div",
        {
          style: {
            fontSize: fs.body,
            color: chunkCOT43DA6_cjs.theme.textSecondary,
            marginTop: 4,
            lineHeight: 1.5
          },
          children: snapshot.description
        }
      )
    ] }),
    snapshot.status && /* @__PURE__ */ jsxRuntime.jsxs("div", { style: { display: "flex", alignItems: "center", gap: 6 }, children: [
      /* @__PURE__ */ jsxRuntime.jsx(
        "div",
        {
          style: {
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: snapshot.status === "done" ? chunkCOT43DA6_cjs.theme.success : snapshot.status === "active" ? chunkCOT43DA6_cjs.theme.primary : snapshot.status === "error" ? chunkCOT43DA6_cjs.theme.error : chunkCOT43DA6_cjs.theme.textMuted
          }
        }
      ),
      /* @__PURE__ */ jsxRuntime.jsx(
        "span",
        {
          style: {
            fontSize: fs.small,
            color: chunkCOT43DA6_cjs.theme.textMuted,
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          },
          children: snapshot.status
        }
      )
    ] }),
    snapshot.narrative && /* @__PURE__ */ jsxRuntime.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntime.jsx(
        "div",
        {
          style: {
            fontSize: fs.label,
            fontWeight: 600,
            color: chunkCOT43DA6_cjs.theme.textMuted,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 6
          },
          children: "What happened"
        }
      ),
      /* @__PURE__ */ jsxRuntime.jsx(
        "div",
        {
          style: {
            fontSize: fs.body,
            lineHeight: 1.6,
            color: chunkCOT43DA6_cjs.theme.textPrimary,
            background: chunkCOT43DA6_cjs.theme.bgSecondary,
            border: `1px solid ${chunkCOT43DA6_cjs.theme.border}`,
            borderRadius: chunkCOT43DA6_cjs.theme.radius,
            padding: pad
          },
          children: snapshot.narrative
        }
      )
    ] }),
    snapshot.durationMs > 0 && /* @__PURE__ */ jsxRuntime.jsxs(
      "div",
      {
        style: {
          fontSize: fs.small,
          color: chunkCOT43DA6_cjs.theme.textMuted
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
  canCompare,
  fs,
  pad
}) {
  const rows = React2.useMemo(() => buildMemoryRows(currMemory, changes), [currMemory, changes]);
  const totalKeys = Object.keys(currMemory).length;
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 12 }, children: [
    /* @__PURE__ */ jsxRuntime.jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
      /* @__PURE__ */ jsxRuntime.jsx(
        "span",
        {
          style: {
            fontSize: fs.label + 2,
            fontWeight: 700,
            color: chunkCOT43DA6_cjs.theme.textPrimary,
            fontFamily: chunkCOT43DA6_cjs.theme.fontMono
          },
          children: snapshot.stageLabel
        }
      ),
      snapshot.durationMs > 0 && /* @__PURE__ */ jsxRuntime.jsxs(
        "span",
        {
          style: {
            fontSize: fs.small,
            color: chunkCOT43DA6_cjs.theme.textMuted,
            fontFamily: chunkCOT43DA6_cjs.theme.fontMono
          },
          children: [
            snapshot.durationMs,
            "ms"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntime.jsxs(
      "div",
      {
        style: {
          fontSize: fs.label,
          fontWeight: 600,
          color: chunkCOT43DA6_cjs.theme.textMuted,
          textTransform: "uppercase",
          letterSpacing: "0.08em"
        },
        children: [
          "Memory",
          /* @__PURE__ */ jsxRuntime.jsxs("span", { style: { fontWeight: 400, marginLeft: 6 }, children: [
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
    rows.length === 0 ? /* @__PURE__ */ jsxRuntime.jsx(
      "div",
      {
        style: {
          fontSize: fs.body,
          color: chunkCOT43DA6_cjs.theme.textMuted,
          fontStyle: "italic",
          fontFamily: chunkCOT43DA6_cjs.theme.fontMono,
          padding: `${pad}px`,
          background: chunkCOT43DA6_cjs.theme.bgSecondary,
          borderRadius: chunkCOT43DA6_cjs.theme.radius
        },
        children: canCompare ? "Empty memory" : "No values in the available recorded state"
      }
    ) : /* @__PURE__ */ jsxRuntime.jsx(
      "div",
      {
        style: {
          fontFamily: chunkCOT43DA6_cjs.theme.fontMono,
          fontSize: fs.body,
          background: chunkCOT43DA6_cjs.theme.bgSecondary,
          border: `1px solid ${chunkCOT43DA6_cjs.theme.border}`,
          borderRadius: chunkCOT43DA6_cjs.theme.radius,
          overflow: "hidden"
        },
        children: rows.map((row) => {
          if (row.kind === "change") {
            const { change } = row;
            const badge = changeBadge[change.type];
            return /* @__PURE__ */ jsxRuntime.jsxs(
              "div",
              {
                style: {
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  padding: `6px ${pad}px`,
                  borderBottom: `1px solid ${chunkCOT43DA6_cjs.theme.border}`,
                  background: badge.bg
                },
                "data-fp": "memory-change",
                "data-type": change.type,
                children: [
                  /* @__PURE__ */ jsxRuntime.jsx(
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
                  /* @__PURE__ */ jsxRuntime.jsx(
                    "span",
                    {
                      style: {
                        color: chunkCOT43DA6_cjs.theme.primary,
                        fontWeight: 600,
                        flexShrink: 0,
                        lineHeight: 1.8
                      },
                      children: change.key
                    }
                  ),
                  /* @__PURE__ */ jsxRuntime.jsx("div", { style: { flex: 1, minWidth: 0, lineHeight: 1.8 }, children: change.type === "updated" ? /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntime.jsx(
                      "span",
                      {
                        style: {
                          color: chunkCOT43DA6_cjs.theme.error,
                          textDecoration: "line-through",
                          opacity: 0.7
                        },
                        children: fmt2(change.oldValue)
                      }
                    ),
                    /* @__PURE__ */ jsxRuntime.jsx("span", { style: { color: chunkCOT43DA6_cjs.theme.textMuted, margin: "0 4px" }, children: "\u2192" }),
                    /* @__PURE__ */ jsxRuntime.jsx("span", { style: { color: chunkCOT43DA6_cjs.theme.success }, children: fmt2(change.newValue) })
                  ] }) : change.type === "added" ? /* @__PURE__ */ jsxRuntime.jsx("span", { style: { color: chunkCOT43DA6_cjs.theme.success }, children: fmt2(change.newValue) }) : /* @__PURE__ */ jsxRuntime.jsx("span", { style: { color: chunkCOT43DA6_cjs.theme.error, textDecoration: "line-through" }, children: fmt2(change.oldValue) }) })
                ]
              },
              change.key
            );
          }
          return /* @__PURE__ */ jsxRuntime.jsxs(
            "div",
            {
              style: {
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                padding: `6px ${pad}px`,
                borderBottom: `1px solid ${chunkCOT43DA6_cjs.theme.border}`,
                opacity: canCompare ? 0.5 : 1
              },
              "data-fp": canCompare ? "memory-unchanged" : "memory-recorded",
              children: [
                /* @__PURE__ */ jsxRuntime.jsx(
                  "span",
                  {
                    style: {
                      width: 28,
                      flexShrink: 0,
                      lineHeight: 1.8
                    }
                  }
                ),
                /* @__PURE__ */ jsxRuntime.jsx(
                  "span",
                  {
                    style: {
                      color: chunkCOT43DA6_cjs.theme.textSecondary,
                      fontWeight: 500,
                      flexShrink: 0,
                      lineHeight: 1.8
                    },
                    children: row.key
                  }
                ),
                /* @__PURE__ */ jsxRuntime.jsx("div", { style: { flex: 1, minWidth: 0, lineHeight: 1.8, color: chunkCOT43DA6_cjs.theme.textMuted }, children: fmt2(row.value) })
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
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { "data-fp": "stage-detail-simple", children: [
    /* @__PURE__ */ jsxRuntime.jsx("div", { "data-fp": "stage-label", children: snapshot.stageLabel }),
    snapshot.description && /* @__PURE__ */ jsxRuntime.jsx("div", { "data-fp": "stage-description", children: snapshot.description }),
    snapshot.status && /* @__PURE__ */ jsxRuntime.jsx("div", { "data-fp": "stage-status", children: snapshot.status }),
    snapshot.narrative && /* @__PURE__ */ jsxRuntime.jsx("div", { "data-fp": "stage-narrative", children: snapshot.narrative })
  ] });
}
function UnstyledDevView({
  snapshot,
  changes,
  currMemory,
  canCompare
}) {
  const rows = React2.useMemo(() => buildMemoryRows(currMemory, changes), [currMemory, changes]);
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { "data-fp": "stage-detail-dev", children: [
    /* @__PURE__ */ jsxRuntime.jsx("div", { "data-fp": "stage-label", children: snapshot.stageLabel }),
    rows.map((row) => {
      if (row.kind === "change") {
        const c = row.change;
        return /* @__PURE__ */ jsxRuntime.jsxs("div", { "data-fp": "memory-change", "data-type": c.type, children: [
          /* @__PURE__ */ jsxRuntime.jsx("span", { "data-fp": "change-key", children: c.key }),
          c.type === "updated" && /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
            /* @__PURE__ */ jsxRuntime.jsx("span", { "data-fp": "change-old", children: fmt2(c.oldValue) }),
            /* @__PURE__ */ jsxRuntime.jsx("span", { "data-fp": "change-new", children: fmt2(c.newValue) })
          ] }),
          c.type === "added" && /* @__PURE__ */ jsxRuntime.jsx("span", { "data-fp": "change-value", children: fmt2(c.newValue) }),
          c.type === "removed" && /* @__PURE__ */ jsxRuntime.jsx("span", { "data-fp": "change-value", children: fmt2(c.oldValue) })
        ] }, c.key);
      }
      return /* @__PURE__ */ jsxRuntime.jsxs("div", { "data-fp": canCompare ? "memory-unchanged" : "memory-recorded", children: [
        /* @__PURE__ */ jsxRuntime.jsx("span", { "data-fp": "unchanged-key", children: row.key }),
        /* @__PURE__ */ jsxRuntime.jsx("span", { "data-fp": "unchanged-value", children: fmt2(row.value) })
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
    return /* @__PURE__ */ jsxRuntime.jsx("button", { "data-fp": "mode-toggle", "data-mode": activeMode, onClick: onToggle, children: activeMode === "simple" ? "Dev" : "Simple" });
  }
  return /* @__PURE__ */ jsxRuntime.jsx(
    "div",
    {
      style: {
        display: "inline-flex",
        borderRadius: 6,
        border: `1px solid ${chunkCOT43DA6_cjs.theme.border}`,
        overflow: "hidden",
        flexShrink: 0
      },
      "data-fp": "mode-toggle",
      children: ["simple", "dev"].map((m) => /* @__PURE__ */ jsxRuntime.jsx(
        "button",
        {
          onClick: m !== activeMode ? onToggle : void 0,
          style: {
            padding: "4px 10px",
            fontSize: fs.small,
            fontWeight: m === activeMode ? 700 : 400,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: m === activeMode ? chunkCOT43DA6_cjs.theme.textPrimary : chunkCOT43DA6_cjs.theme.textMuted,
            background: m === activeMode ? chunkCOT43DA6_cjs.theme.bgTertiary : "transparent",
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
  const [internalMode, setInternalMode] = React2.useState(controlledMode ?? "simple");
  const activeMode = controlledMode ?? internalMode;
  const handleToggle = React2.useCallback(() => {
    const next = activeMode === "simple" ? "dev" : "simple";
    setInternalMode(next);
    onModeChange?.(next);
  }, [activeMode, onModeChange]);
  const snapshot = snapshots[selectedIndex];
  const view = chunk4X66ZS4F_cjs.recordStateDisplay(snapshot, snapshots[selectedIndex - 1]);
  const rawPrevMemory = view.previous;
  const rawCurrMemory = view.memory ?? {};
  const currMemory = React2.useMemo(
    () => withoutExcluded(rawCurrMemory, excludeKeys),
    [rawCurrMemory, excludeKeys]
  );
  const changes = React2.useMemo(
    () => view.canCompare ? computeChanges(
      rawPrevMemory === null ? null : withoutExcluded(rawPrevMemory, excludeKeys),
      currMemory
    ) : [],
    [rawPrevMemory, currMemory, excludeKeys, view.canCompare]
  );
  const fs = chunkCOT43DA6_cjs.fontSize[size];
  const pad = chunkCOT43DA6_cjs.padding[size];
  if (!snapshot) {
    return /* @__PURE__ */ jsxRuntime.jsx("div", { className, style, "data-fp": "stage-detail-panel", children: /* @__PURE__ */ jsxRuntime.jsx("div", { style: unstyled ? {} : { color: chunkCOT43DA6_cjs.theme.textMuted, fontSize: fs.body, fontStyle: "italic", padding: pad }, children: "No stage selected" }) });
  }
  if (unstyled) {
    return /* @__PURE__ */ jsxRuntime.jsxs("div", { className, style, "data-fp": "stage-detail-panel", "data-mode": activeMode, children: [
      /* @__PURE__ */ jsxRuntime.jsx(chunk4X66ZS4F_cjs.RecordStateNotice, { view }),
      showToggle && /* @__PURE__ */ jsxRuntime.jsx(ModeToggle, { activeMode, onToggle: handleToggle, fs, unstyled: true }),
      activeMode === "simple" ? /* @__PURE__ */ jsxRuntime.jsx(UnstyledSimpleView, { snapshot }) : view.memory !== null ? /* @__PURE__ */ jsxRuntime.jsx(UnstyledDevView, { snapshot, changes, currMemory, canCompare: view.canCompare }) : /* @__PURE__ */ jsxRuntime.jsx("div", { "data-fp": "stage-label", children: snapshot.stageLabel })
    ] });
  }
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "div",
    {
      className,
      style: {
        padding: pad,
        fontFamily: chunkCOT43DA6_cjs.theme.fontSans,
        overflow: "auto",
        ...style
      },
      "data-fp": "stage-detail-panel",
      "data-mode": activeMode,
      children: [
        /* @__PURE__ */ jsxRuntime.jsx(chunk4X66ZS4F_cjs.RecordStateNotice, { view }),
        showToggle && /* @__PURE__ */ jsxRuntime.jsx("div", { style: { display: "flex", justifyContent: "flex-end", marginBottom: 12 }, children: /* @__PURE__ */ jsxRuntime.jsx(ModeToggle, { activeMode, onToggle: handleToggle, fs, unstyled: false }) }),
        activeMode === "simple" ? /* @__PURE__ */ jsxRuntime.jsx(SimpleView, { snapshot, fs, pad }) : view.memory !== null ? /* @__PURE__ */ jsxRuntime.jsx(DevView, { snapshot, changes, currMemory, canCompare: view.canCompare, fs, pad }) : /* @__PURE__ */ jsxRuntime.jsx("div", { "data-fp": "stage-label", children: snapshot.stageLabel })
      ]
    }
  );
}
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
  const [playing, setPlaying] = React2.useState(false);
  const playRef = React2.useRef(null);
  const total = snapshots.length;
  const isTracing = !!tracing;
  const stopSet = React2.useMemo(
    () => tracing ? new Set(tracing.stopIndices) : null,
    [tracing]
  );
  const earlierStop = React2.useMemo(() => {
    if (!tracing) return null;
    const earlier = tracing.stopIndices.filter((i) => i < selectedIndex);
    return earlier.length > 0 ? earlier[earlier.length - 1] : null;
  }, [tracing, selectedIndex]);
  const laterStop = React2.useMemo(() => {
    if (!tracing) return null;
    return tracing.stopIndices.find((i) => i > selectedIndex) ?? null;
  }, [tracing, selectedIndex]);
  const forkPrompt = isTracing && earlierStop === null && (tracing.forkCount ?? 0) >= 2 && !!tracing.onForkPrompt;
  const canPrev = isTracing ? forkPrompt || earlierStop !== null : selectedIndex > 0;
  const canNext = isTracing ? laterStop !== null : selectedIndex < total - 1;
  const goPrev = React2.useCallback(() => {
    setPlaying(false);
    if (isTracing) {
      if (forkPrompt) {
        tracing.onForkPrompt();
        return;
      }
      if (earlierStop !== null) onIndexChange(earlierStop);
    } else if (selectedIndex > 0) onIndexChange(selectedIndex - 1);
  }, [isTracing, forkPrompt, tracing, earlierStop, selectedIndex, onIndexChange]);
  const goNext = React2.useCallback(() => {
    setPlaying(false);
    if (isTracing) {
      if (laterStop !== null) onIndexChange(laterStop);
    } else if (selectedIndex < total - 1) onIndexChange(selectedIndex + 1);
  }, [isTracing, laterStop, selectedIndex, total, onIndexChange]);
  React2.useEffect(() => {
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
  const togglePlay = React2.useCallback(() => {
    if (playing) {
      setPlaying(false);
    } else {
      if (selectedIndex >= total - 1) onIndexChange(0);
      setPlaying(true);
    }
  }, [playing, selectedIndex, total, onIndexChange]);
  const handleKeyDown = React2.useCallback(
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
  const fs = chunkCOT43DA6_cjs.fontSize[size];
  const tracingColor = "var(--fp-tracing, #0d9488)";
  if (unstyled) {
    return /* @__PURE__ */ jsxRuntime.jsxs(
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
          isTracing && /* @__PURE__ */ jsxRuntime.jsxs("span", { "data-fp": "tt-tracing-header", children: [
            "Tracing ",
            tracing.tracedKey,
            tracing.viaKey && /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
              " ",
              "\u25B8 via ",
              tracing.viaKey,
              " ",
              /* @__PURE__ */ jsxRuntime.jsx("button", { "data-fp": "tt-show-all", onClick: tracing.onShowAll, children: "show all" })
            ] }),
            " \xB7 ",
            "stop ",
            tracing.stopOrdinal,
            " of ",
            tracing.totalStops,
            /* @__PURE__ */ jsxRuntime.jsx("button", { "data-fp": "tt-exit-tracing", onClick: tracing.onExit, "aria-label": "Exit tracing", children: "Done" })
          ] }),
          /* @__PURE__ */ jsxRuntime.jsx(
            "button",
            {
              "data-fp": "tt-prev",
              disabled: !canPrev || playing,
              onClick: goPrev,
              "aria-label": isTracing ? forkPrompt ? "Choose cause" : "Earlier cause" : "Previous stage",
              children: isTracing ? forkPrompt ? "Choose cause\u2026" : "Earlier cause" : "Prev"
            }
          ),
          autoPlayable && !isTracing && /* @__PURE__ */ jsxRuntime.jsx("button", { "data-fp": "tt-play", onClick: togglePlay, "aria-label": playing ? "Pause" : "Play", children: playing ? "Pause" : "Play" }),
          /* @__PURE__ */ jsxRuntime.jsx(
            "button",
            {
              "data-fp": "tt-next",
              disabled: !canNext || playing,
              onClick: goNext,
              "aria-label": isTracing ? "Toward result" : "Next stage",
              children: isTracing ? "Toward result" : "Next"
            }
          ),
          /* @__PURE__ */ jsxRuntime.jsx("div", { "data-fp": "tt-ticks", children: snapshots.map((snap, i) => {
            const isStop = !stopSet || stopSet.has(i);
            return /* @__PURE__ */ jsxRuntime.jsx(
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
    background: chunkCOT43DA6_cjs.theme.bgTertiary,
    border: `1px solid ${isTracing ? tracingColor : chunkCOT43DA6_cjs.theme.border}`,
    color: disabled ? chunkCOT43DA6_cjs.theme.textMuted : isTracing ? tracingColor : chunkCOT43DA6_cjs.theme.textPrimary,
    borderRadius: "6px",
    padding: "4px 12px",
    fontSize: fs.body,
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    flexShrink: 0
  });
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "div",
    {
      className,
      style: {
        padding: "6px 12px",
        background: chunkCOT43DA6_cjs.theme.bgSecondary,
        borderBottom: isTracing ? `2px solid ${tracingColor}` : `1px solid ${chunkCOT43DA6_cjs.theme.border}`,
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
        isTracing && /* @__PURE__ */ jsxRuntime.jsxs(
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
              /* @__PURE__ */ jsxRuntime.jsx(
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
              /* @__PURE__ */ jsxRuntime.jsx("span", { style: { fontFamily: "monospace", fontWeight: 600, color: tracingColor }, children: tracing.tracedKey }),
              tracing.viaKey && /* @__PURE__ */ jsxRuntime.jsxs("span", { style: { color: chunkCOT43DA6_cjs.theme.textMuted }, children: [
                "\u25B8 via",
                " ",
                /* @__PURE__ */ jsxRuntime.jsx("span", { style: { fontFamily: "monospace", color: chunkCOT43DA6_cjs.theme.textSecondary }, children: tracing.viaKey }),
                " ",
                /* @__PURE__ */ jsxRuntime.jsx(
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
              /* @__PURE__ */ jsxRuntime.jsxs("span", { style: { color: chunkCOT43DA6_cjs.theme.textMuted }, children: [
                "\xB7 stop ",
                tracing.stopOrdinal,
                " of ",
                tracing.totalStops
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsx(
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
        autoPlayable && !isTracing && /* @__PURE__ */ jsxRuntime.jsx(
          "button",
          {
            onClick: togglePlay,
            style: {
              background: playing ? chunkCOT43DA6_cjs.theme.primary : chunkCOT43DA6_cjs.theme.bgTertiary,
              border: `1px solid ${chunkCOT43DA6_cjs.theme.border}`,
              color: playing ? "white" : chunkCOT43DA6_cjs.theme.textPrimary,
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
        /* @__PURE__ */ jsxRuntime.jsx(
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
        /* @__PURE__ */ jsxRuntime.jsx(
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
              return /* @__PURE__ */ jsxRuntime.jsx(
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
                    background: isTracing ? isActive ? tracingColor : isStop ? "color-mix(in srgb, " + tracingColor + " 55%, transparent)" : chunkCOT43DA6_cjs.theme.bgTertiary : isActive ? chunkCOT43DA6_cjs.theme.primary : isDone ? chunkCOT43DA6_cjs.theme.success : chunkCOT43DA6_cjs.theme.bgTertiary,
                    opacity: unlandable ? 0.3 : isTracing || isDone || isActive ? 1 : 0.4,
                    transition: "all 0.15s ease"
                  }
                },
                i
              );
            })
          }
        ),
        isTracing && /* @__PURE__ */ jsxRuntime.jsx(
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

// src/adapters/recordInput/index.ts
function isRecord(value) {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
function adaptFlowRecord(input) {
  if (typeof input.sourceId !== "string" || !input.sourceId.trim()) {
    return {
      status: "refused",
      code: "invalid-source-id",
      message: "Select and label one recorded source."
    };
  }
  if (input.format !== "snapshot" && input.format !== "subtree" && input.format !== "tree-context") {
    return {
      status: "refused",
      code: "unsupported-format",
      message: "Select a snapshot, subtree, or tree-context envelope explicitly."
    };
  }
  if (!isRecord(input.record)) {
    return {
      status: "refused",
      code: "invalid-record",
      message: "The selected recording must be a plain source object."
    };
  }
  const field = input.format === "snapshot" ? "commitLog" : "history";
  const log = input.record[field];
  if (log === void 0) {
    return {
      status: "refused",
      code: "missing-log",
      message: `The selected source has no ${field}; stageWrites alone cannot reconstruct its record.`
    };
  }
  if (!Array.isArray(log)) {
    return {
      status: "refused",
      code: "invalid-log",
      message: `The selected source's ${field} must be an array.`
    };
  }
  const base = input.record.initialState;
  if (base !== void 0 && !isRecord(base)) {
    return {
      status: "refused",
      code: "invalid-base",
      message: "The recorded initialState must be a plain state object or absent."
    };
  }
  if (!input.reads || input.reads.status !== "unknown" && input.reads.status !== "supplied" || input.reads.status === "supplied" && (!input.reads.source || typeof input.reads.source.kind !== "string" || typeof input.reads.source.lookup !== "function")) {
    return {
      status: "refused",
      code: "invalid-read-evidence",
      message: "Declare reads unknown or supply this source's KeysReadSource explicitly."
    };
  }
  const tree = input.format === "tree-context" ? input.record.stageContexts : input.record.executionTree;
  const source = {
    ...field === "commitLog" ? { commitLog: log } : { history: log },
    ...base !== void 0 && { initialState: base },
    ...tree !== void 0 && { executionTree: tree },
    ...input.record.subflowResults !== void 0 && {
      subflowResults: input.record.subflowResults
    }
  };
  return {
    status: "accepted",
    sourceId: input.sourceId,
    source,
    evidence: {
      base: base === void 0 ? "missing" : "recorded",
      reads: input.reads
    }
  };
}

// src/adapters/recordInput/traceSource.ts
function isReadablePrefix(rows) {
  for (let index = 0; index < rows.length; index++) {
    if (!foottrace.isCommitBundle(rows[index])) return false;
  }
  return true;
}
function prepareTracePrefix(selection, beforeCommitIdx) {
  const input = adaptFlowRecord(selection);
  if (input.status === "refused") return { status: "unavailable", sourceId: selection.sourceId, reason: "source", message: input.message };
  const raw = input.source.commitLog ?? input.source.history;
  return preparePrefix(input, beforeCommitIdx ?? raw?.length ?? 0);
}
function prepareTraceSource(selection, targetRuntimeStageId, beforeCommitIdx) {
  const refused = (reason, message) => ({ status: "unavailable", sourceId: selection.sourceId, reason, message });
  const input = adaptFlowRecord(selection);
  if (input.status === "refused") return refused("source", input.message);
  const raw = input.source.commitLog ?? input.source.history;
  if (!raw) return refused("source", "The selected source has no recorded log.");
  let before = beforeCommitIdx;
  if (before === void 0) {
    try {
      const stop = foottrace.timeTravel(input.source).stops.find((row) => row.kind !== "start" && row.kind !== "end" && row.runtimeStageId === targetRuntimeStageId);
      if (!stop) return refused("boundary", "No exact recorded position is available for the selected stage.");
      before = stop.lastCommitIdx + 1;
    } catch {
      return refused("boundary", "The selected stage has no readable canonical boundary.");
    }
  }
  return preparePrefix(input, before);
}
function preparePrefix(input, before) {
  const refused = (reason, message) => ({ status: "unavailable", sourceId: input.sourceId, reason, message });
  const raw = input.source.commitLog ?? input.source.history;
  if (!raw) return refused("source", "The selected source has no recorded log.");
  if (!Number.isSafeInteger(before) || before < 0 || before > raw.length) {
    return refused("boundary", "The selected boundary is not an exact position in this source.");
  }
  const log = raw.slice(0, before);
  if (!isReadablePrefix(log)) {
    return refused("log-gap", "Causal tracing is unavailable: the selected prefix contains an unreadable record row. Row positions have not been changed.");
  }
  let reads;
  try {
    reads = input.evidence.reads.status === "supplied" ? input.evidence.reads.source : input.source.executionTree === void 0 ? { kind: "unknown", lookup: () => [] } : foottrace.keysReadFromExecutionTree(input.source.executionTree);
  } catch (error) {
    return refused("reads", error instanceof Error ? error.message : "The selected source's read evidence is unreadable.");
  }
  try {
    const fold = foottrace.stateAt({ commitLog: log, ...input.source.initialState !== void 0 && { initialState: input.source.initialState } }, before - 1);
    return {
      status: "available",
      sourceId: input.sourceId,
      beforeCommitIdx: before,
      log,
      reads,
      fold,
      ...input.source.initialState !== void 0 && { initialState: input.source.initialState }
    };
  } catch {
    return refused("reader", "Foottrace could not read this source at the selected boundary.");
  }
}

// src/components/ExplainableShell/_internal/dataTrace.ts
function unavailableDataTrace(note) {
  return { status: "unavailable", frames: [], readsAvailable: false, note };
}
function buildSelectedDataTrace(selection, targetRuntimeStageId, options = {}) {
  const maxDepth = options.maxDepth ?? 10;
  const maxFrames = options.maxFrames ?? 50;
  if (!Number.isSafeInteger(maxDepth) || maxDepth < 0 || !Number.isSafeInteger(maxFrames) || maxFrames < 1) {
    return unavailableDataTrace("Causal tracing needs a nonnegative depth and a positive frame limit.");
  }
  const source = prepareTraceSource(selection, targetRuntimeStageId, options.beforeCommitIdx);
  if (source.status === "unavailable") return unavailableDataTrace(source.message);
  try {
    let observedReads = false;
    const root = foottrace.causalChain(source.log, targetRuntimeStageId, (id) => {
      const keys = source.reads.lookup(id);
      observedReads || (observedReads = keys.length > 0);
      return keys;
    }, { maxDepth, maxNodes: maxFrames, edgeAttribution: "stage" });
    return projectDataTrace(source, root, observedReads);
  } catch {
    return unavailableDataTrace("Foottrace could not explain the selected source prefix.");
  }
}
function projectDataTrace(source, root, observedReads) {
  const nodes = root ? foottrace.flattenCausalDAG(root) : [];
  const readsAvailable = observedReads || (source.reads.coverage?.stepsWithReads ?? 0) > 0 || nodes.some((node) => node.parentEdges.some((edge) => edge.kind === "data") || (node.preRunReads?.keys.length ?? 0) > 0);
  const notes = ["Recorded stage-level dependencies; read capture may be incomplete."];
  if (!source.reads.coverage) notes.push("Read coverage is unknown; the supplied lookup does not establish complete capture.");
  if (!readsAvailable) notes.push("Read coverage is unknown or no read keys were recorded; missing edges do not prove independence.");
  if (!root) notes.push("No recorded causal anchor was found in this source prefix.");
  if (root?.truncated?.byDepth) notes.push("The depth limit cut the explanation short.");
  if (root?.truncated?.byNodes) notes.push("The frame limit cut the explanation short.");
  if (nodes.some((node) => node.incompleteSources?.length)) notes.push("Some consumed sources were not tracked.");
  if (nodes.some((node) => node.preRunReads?.keys.length)) notes.push("Some reads have no earlier recorded writer; their origin is not proven by this log.");
  const nestedEdges = nodes.flatMap((node) => node.parentEdges.filter((edge) => edge.basis === "nested-rows").map((edge) => ({ from: node.runtimeStageId, to: edge.parent.runtimeStageId, ...edge.key !== void 0 && { key: edge.key } })));
  if (nestedEdges.length) notes.push("Some writers changed only nested parts of a value.");
  if (source.fold.redacted) notes.push("Recorded values were redacted; the explanation may omit hidden evidence.");
  return {
    status: root ? "available" : "not-recorded",
    frames: nodes.map(({ runtimeStageId, stageId, stageName, keysWritten, linkedBy, depth }) => ({
      runtimeStageId,
      stageId: typeof stageId === "string" ? stageId : runtimeStageId,
      stageName: typeof stageName === "string" ? stageName : runtimeStageId,
      keysWritten,
      linkedBy,
      depth
    })),
    readsAvailable,
    note: notes.join(" "),
    evidence: {
      sourceId: source.sourceId,
      beforeCommitIdx: source.beforeCommitIdx,
      readsKind: source.reads.kind,
      ...root && { root },
      ...source.reads.coverage !== void 0 && { readsCoverage: source.reads.coverage },
      ...root?.truncated !== void 0 && { truncated: root.truncated },
      nodes: nodes.map(({ runtimeStageId, incompleteSources, preRunReads }) => ({ runtimeStageId, ...incompleteSources && { incompleteSources }, ...preRunReads && { preRunReads } })),
      nestedEdges,
      redactedPaths: source.fold.redactedPaths
    }
  };
}

// src/components/ExplainableShell/_internal/traceWalkText.ts
var unknownIngredientText = "no earlier recorded writer; origin unknown";
var noIngredientsText = "No earlier dependencies are established by the captured reads.";
function missingTraceText(walk, stepOf) {
  const missing = walk.missing;
  if (missing?.reason !== "not-yet-written") return `No recorded writer for \`${walk.key}\` in this source range; its origin is unknown.`;
  const step = missing.firstWriterRuntimeStageId ? stepOf(missing.firstWriterRuntimeStageId) : null;
  return `No recorded writer for \`${walk.key}\` before this moment \u2014 its first recorded write is later` + (missing.firstWriterStageName ? `, at ${missing.firstWriterStageName}${step ? ` (step ${step})` : ""}.` : ".") + " This is a separately checked whole-record hint.";
}
function contributionPositionText(stop) {
  const writes = stop.contributedWrites;
  if (!writes?.length || writes.every((write) => write.commitIdx === stop.commitIdx && write.commitIdx === stop.readCommitIdx)) return void 0;
  return `Execution visit at record row ${stop.readCommitIdx ?? stop.commitIdx}; actual contributions: ${writes.map((write) => `${write.key} at row ${write.commitIdx}`).join(", ")}. Record rows are zero-based; the grouped rail visit may show a different moment.`;
}
function contributionBasisText(stop) {
  const notes = [];
  const qualified = stop.contributedWrites?.filter((write) => write.valueBasis?.length);
  if (qualified?.length) notes.push(`Value preview qualified: ${qualified.map((write) => `${write.key} (${write.valueBasis.join(", ")})`).join("; ")}. No exact value is asserted for these contributions.`);
  if (qualified?.some((write) => write.valueBasis?.includes("deleted"))) notes.push("The deleted code denotes a deleted/undefined value (record convention), not a claim about physical property presence.");
  const repeated = stop.contributedKeys.filter((key) => (stop.contributedWrites?.filter((write) => write.key === key).length ?? 0) > 1);
  if (repeated.length) notes.push(`Multiple recorded writer rows contribute ${repeated.join(", ")}; a single value preview would be ambiguous.`);
  return notes.length ? notes.join(" ") : void 0;
}

// src/components/ExplainableShell/_internal/traceWalk.ts
var label = (value, fallback) => typeof value === "string" ? value : fallback;
function unavailableTraceWalk(key, note) {
  return { key, stops: [], missing: null, inputTermini: [], readsAvailable: false, truncated: false, status: "unavailable", note };
}
function buildTraceWalk(commitLog, executionTree, key, opts) {
  return buildSelectedTraceWalk({ sourceId: "flow:record", format: "snapshot", record: { commitLog, executionTree }, reads: { status: "unknown" } }, key, opts);
}
function buildSelectedTraceWalk(selection, key, opts = {}) {
  const maxDepth = opts.maxDepth ?? 10, maxFrames = opts.maxFrames ?? 50;
  if (!Number.isSafeInteger(maxDepth) || maxDepth < 0 || !Number.isSafeInteger(maxFrames) || maxFrames < 1)
    return unavailableTraceWalk(key, "Causal tracing needs a nonnegative depth and a positive frame limit.");
  const source = prepareTracePrefix(selection, opts.beforeCommitIdx);
  if (source.status === "unavailable") return unavailableTraceWalk(key, source.message);
  try {
    let observedReads = false;
    const reads = { ...source.reads, lookup: (id) => {
      const keys = source.reads.lookup(id);
      observedReads || (observedReads = keys.length > 0);
      return keys;
    } };
    const slice = foottrace.sliceForKey(source.log, key, reads, { before: source.beforeCommitIdx, maxDepth, maxNodes: maxFrames, edgeAttribution: "stage" });
    const projected = projectDataTrace(source, slice.root, observedReads);
    const notes = [projected.note, ...(slice.notes ?? []).map((note) => note.detail)];
    const evidence = {
      sourceId: source.sourceId,
      beforeCommitIdx: source.beforeCommitIdx,
      readsKind: source.reads.kind,
      ...source.reads.coverage && { readsCoverage: source.reads.coverage },
      ...slice.root?.truncated && { truncated: slice.root.truncated }
    };
    if (!slice.root || !slice.writer) {
      const missing = { reason: "never-written" };
      const whole = prepareTracePrefix(selection);
      if (whole.status === "available") {
        try {
          const first = foottrace.keyTimeline(whole.log, key, whole.reads).moments?.find((moment) => moment.kind === "write");
          if (first && first.commitIdx >= source.beforeCommitIdx) {
            Object.assign(missing, {
              reason: "not-yet-written",
              firstWriteCommitIdx: first.commitIdx,
              firstWriterRuntimeStageId: first.runtimeStageId,
              firstWriterStageName: label(first.stageName, first.runtimeStageId)
            });
          }
        } catch {
          notes.push("The separate whole-record first-write hint is unavailable.");
        }
      } else notes.push("Later record rows were not used to establish a whole-record first-write hint.");
      return {
        key,
        stops: [],
        missing,
        inputTermini: [],
        readsAvailable: projected.readsAvailable,
        truncated: false,
        status: "not-recorded",
        note: notes.join(" "),
        evidence
      };
    }
    const nodes = foottrace.flattenCausalDAG(slice.root);
    const readIndex = foottrace.buildCommitIndex(source.log);
    const anchorIndex = source.log.indexOf(slice.writer);
    const contributions = /* @__PURE__ */ new Map();
    contributions.set(slice.writer.runtimeStageId, [{ key, commitIdx: anchorIndex }]);
    const termini = /* @__PURE__ */ new Set();
    const stops = nodes.map((node) => {
      const readCommitIdx = readIndex.get(node.runtimeStageId);
      if (readCommitIdx === void 0) throw new Error("Canonical node has no source-local read anchor");
      const ingredients = node.parentEdges.flatMap((edge) => {
        if (edge.kind !== "data" || edge.key === void 0) return [];
        const edgeKey = edge.key;
        const writer = foottrace.findLastWriter(source.log, edgeKey, readCommitIdx);
        if (!writer || writer.runtimeStageId !== edge.parent.runtimeStageId) throw new Error("Canonical edge writer cannot be resolved in this source");
        const writerCommitIdx = source.log.indexOf(writer);
        const writes = contributions.get(writer.runtimeStageId) ?? [];
        if (!writes.some((write) => write.key === edgeKey && write.commitIdx === writerCommitIdx)) writes.push({ key: edgeKey, commitIdx: writerCommitIdx });
        contributions.set(writer.runtimeStageId, writes);
        return [{
          key: edgeKey,
          writerRuntimeStageId: writer.runtimeStageId,
          writerStageName: label(writer.stage, writer.runtimeStageId),
          writerCommitIdx,
          ...edge.basis && { basis: edge.basis }
        }];
      });
      for (const read of node.preRunReads?.keys ?? []) {
        termini.add(read);
        ingredients.push({ key: read, writerRuntimeStageId: null, writerStageName: null, writerCommitIdx: null });
      }
      return {
        runtimeStageId: node.runtimeStageId,
        stageId: label(node.stageId, node.runtimeStageId),
        stageName: label(node.stageName, node.runtimeStageId),
        commitIdx: node === slice.root ? anchorIndex : readCommitIdx,
        readCommitIdx,
        contributedKeys: [],
        contributedWrites: [],
        keysWritten: node.keysWritten,
        ingredients,
        depth: node.depth,
        loopPass: 0
      };
    });
    for (const stop of stops) {
      stop.contributedWrites = contributions.get(stop.runtimeStageId) ?? [];
      for (const write of stop.contributedWrites) {
        const value = foottrace.commitValueAtWithBasis(
          source.log,
          write.commitIdx,
          write.key,
          source.initialState === void 0 ? void 0 : { initialState: source.initialState }
        );
        if (value.basis.length) write.valueBasis = value.basis;
      }
      stop.contributedKeys = [...new Set(stop.contributedWrites.map((write) => write.key))];
    }
    stops.sort((a, b) => b.commitIdx - a.commitIdx);
    const visits = /* @__PURE__ */ new Map();
    for (const stop of stops) {
      const stagePart = stop.runtimeStageId.split("#")[0];
      const group = visits.get(stagePart) ?? [];
      group.push(stop);
      visits.set(stagePart, group);
    }
    for (const group of visits.values()) if (group.length > 1) group.forEach((stop, index) => {
      stop.loopPass = group.length - index;
    });
    return {
      key,
      stops,
      missing: null,
      inputTermini: [...termini],
      readsAvailable: projected.readsAvailable,
      truncated: !!(slice.root.truncated?.byDepth || slice.root.truncated?.byNodes),
      status: "available",
      note: notes.join(" "),
      evidence
    };
  } catch {
    return unavailableTraceWalk(key, "Foottrace could not explain the selected source prefix.");
  }
}
function traceContributionPreview(selection, walk, stop, key) {
  if (!walk.evidence || walk.status !== "available") return void 0;
  const writes = stop.contributedWrites?.filter((row) => row.key === key);
  const write = writes?.length === 1 ? writes[0] : void 0;
  if (!write || write.commitIdx >= walk.evidence.beforeCommitIdx) return void 0;
  const source = prepareTracePrefix(selection, walk.evidence.beforeCommitIdx);
  if (source.status !== "available" || source.sourceId !== walk.evidence.sourceId) return void 0;
  try {
    const value = foottrace.commitValueAtWithBasis(
      source.log,
      write.commitIdx,
      key,
      source.initialState === void 0 ? void 0 : { initialState: source.initialState }
    );
    return value.basis.length === 0 ? value.value : void 0;
  } catch {
    return void 0;
  }
}
function formatTraceWalk(walk, stepNumberOf) {
  const lines = [];
  if (walk.status === "unavailable") return walk.note ?? "Recorded explanation unavailable.";
  if (walk.missing) lines.push(missingTraceText(walk, stepNumberOf));
  else {
    lines.push(`Tracing \`${walk.key}\` \u2014 ${walk.stops.length} stops, newest first.`);
    walk.stops.forEach((stop, i) => {
      const step = stepNumberOf(stop.runtimeStageId);
      const pass = stop.loopPass > 0 ? ` (pass ${stop.loopPass})` : "";
      const made = stop.ingredients.length ? ` \xB7 recorded ingredients: ${stop.ingredients.map((ing) => ing.writerRuntimeStageId ? `${ing.key} (\u2190 ${ing.writerStageName}${stepNumberOf(ing.writerRuntimeStageId) ? `, step ${stepNumberOf(ing.writerRuntimeStageId)}` : ""}${ing.basis ? "; nested contribution" : ""})` : `${ing.key} (${unknownIngredientText})`).join(", ")}` : ` \xB7 ${noIngredientsText}`;
      lines.push(`stop ${i + 1}/${walk.stops.length} \xB7 ${step ? `step ${step} \xB7 ` : ""}${stop.stageName}${pass} recorded changes to \`${stop.contributedKeys.join("`, `")}\`${made}`);
      const positions = contributionPositionText(stop);
      if (positions) lines.push(positions);
      const basis = contributionBasisText(stop);
      if (basis) lines.push(basis);
    });
    if (walk.inputTermini.length) lines.push(`Reads without an earlier recorded writer (origin unknown): ${walk.inputTermini.join(", ")}`);
  }
  if (walk.note) lines.push(walk.note);
  else if (!walk.readsAvailable) lines.push("Read evidence is unknown; dependencies are unknowable, not absent.");
  if (walk.truncated && !walk.evidence?.truncated) lines.push("The recorded explanation is truncated; its earliest displayed stop need not be an origin.");
  return lines.join("\n");
}
var CHIP_COLORS = [
  chunkCOT43DA6_cjs.v("--fp-chip-1", "#0d9488"),
  chunkCOT43DA6_cjs.v("--fp-chip-2", "#d97706"),
  chunkCOT43DA6_cjs.v("--fp-chip-3", "#7c3aed"),
  chunkCOT43DA6_cjs.v("--fp-chip-4", "#e11d48")
];
var PAINT = (s) => s;
var BARE = () => void 0;
var TraceWalkCard = React2.memo(function TraceWalkCard2({
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
  const fs = chunkCOT43DA6_cjs.fontSize[size];
  const sx = unstyled ? BARE : PAINT;
  const [copied, setCopied] = React2.useState(null);
  const [copyError, setCopyError] = React2.useState(null);
  const copyGeneration = React2.useRef(0);
  const copyWalk = React2.useRef(walk);
  if (copyWalk.current !== walk) {
    copyWalk.current = walk;
    copyGeneration.current++;
  }
  React2.useEffect(() => {
    setCopied(null);
    setCopyError(null);
    return () => {
      copyGeneration.current++;
    };
  }, [walk]);
  const accent = "var(--fp-accent, #6366f1)";
  const tracingColor = "var(--fp-tracing, #0d9488)";
  const currentIdx = React2.useMemo(() => {
    if (!cursorRuntimeStageId) return 0;
    const i = walk.stops.findIndex((s) => s.runtimeStageId === cursorRuntimeStageId);
    return i >= 0 ? i : 0;
  }, [walk, cursorRuntimeStageId]);
  const current = walk.stops[currentIdx];
  const followableCount = current ? current.ingredients.filter((ing) => ing.writerRuntimeStageId !== null).length : 0;
  const chooserVisible = !!forkChooserOpen && followableCount >= 2;
  const copyStory = async () => {
    const generation = ++copyGeneration.current;
    setCopyError(null);
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(formatTraceWalk(walk, stepNumberOf));
      if (copyGeneration.current !== generation) return;
      setCopied(walk);
      setTimeout(() => {
        if (copyGeneration.current === generation) setCopied(null);
      }, 1600);
    } catch {
      if (copyGeneration.current === generation) {
        setCopied(null);
        setCopyError(walk);
      }
    }
  };
  if (walk.status === "unavailable") return /* @__PURE__ */ jsxRuntime.jsxs("div", { "data-fp": "trace-walk-card", "data-unavailable": "true", className, style: { ...sx({ padding: "14px" }), ...style }, children: [
    /* @__PURE__ */ jsxRuntime.jsx(CardHeader, { label: `Why this value \u2014 \`${walk.key}\``, onExit, sx, fs }),
    /* @__PURE__ */ jsxRuntime.jsx("p", { children: walk.note ?? "Recorded explanation unavailable." })
  ] });
  if (walk.missing) {
    return /* @__PURE__ */ jsxRuntime.jsxs(
      "div",
      {
        className,
        "data-fp": "trace-walk-card",
        "data-missing": walk.missing.reason,
        style: { ...sx({ padding: "14px", fontSize: fs.body + 1, lineHeight: 1.55 }), ...style },
        children: [
          /* @__PURE__ */ jsxRuntime.jsx(CardHeader, { label: `Why this value \u2014 \`${walk.key}\``, onExit, sx, fs }),
          /* @__PURE__ */ jsxRuntime.jsx("div", { style: sx({ color: chunkCOT43DA6_cjs.theme.textPrimary, marginTop: 8 }), children: missingTraceText(walk, stepNumberOf) }),
          walk.note && /* @__PURE__ */ jsxRuntime.jsx("p", { "data-fp": "twc-evidence", children: walk.note })
        ]
      }
    );
  }
  if (!current) return null;
  const step = stepNumberOf(current.runtimeStageId);
  const previewKey = current.contributedKeys[0] ?? walk.key;
  const contributions = current.contributedWrites?.filter((write) => write.key === previewKey);
  const previewAllowed = !contributions || contributions.length === 1 && !contributions[0].valueBasis?.length;
  const preview = previewAllowed && previewValueOf ? previewValue2(() => previewValueOf(previewKey)) : null;
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "div",
    {
      className,
      "data-fp": "trace-walk-card",
      style: { ...sx({ padding: "10px 14px 14px", fontSize: fs.body + 1, lineHeight: 1.5 }), ...style },
      children: [
        /* @__PURE__ */ jsxRuntime.jsx(
          CardHeader,
          {
            label: `Why this value \u2014 stop ${currentIdx + 1} of ${walk.stops.length}`,
            onExit,
            sx,
            fs
          }
        ),
        viaKey && /* @__PURE__ */ jsxRuntime.jsxs("div", { "data-fp": "twc-breadcrumb", style: sx({ fontSize: fs.label, color: chunkCOT43DA6_cjs.theme.textMuted, marginTop: 4 }), children: [
          /* @__PURE__ */ jsxRuntime.jsx("code", { style: sx({ color: accent }), children: walk.key }),
          " \u25B8 via ",
          /* @__PURE__ */ jsxRuntime.jsx("code", { children: viaKey }),
          onShowAll && /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
            " \xB7 ",
            /* @__PURE__ */ jsxRuntime.jsx(
              "button",
              {
                onClick: onShowAll,
                style: sx({ border: "none", background: "transparent", color: accent, cursor: "pointer", fontSize: fs.label, textDecoration: "underline", padding: 0 }),
                children: "show all ingredients"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntime.jsxs("div", { "data-fp": "twc-stop-headline", style: sx({ marginTop: 10, fontWeight: 600, color: chunkCOT43DA6_cjs.theme.textPrimary }), children: [
          step && /* @__PURE__ */ jsxRuntime.jsxs("span", { style: sx({ color: chunkCOT43DA6_cjs.theme.textMuted, fontWeight: 500 }), children: [
            "Step ",
            step,
            " \xB7 "
          ] }),
          current.stageName,
          current.loopPass > 0 && /* @__PURE__ */ jsxRuntime.jsxs("span", { style: sx({ color: chunkCOT43DA6_cjs.theme.textMuted, fontWeight: 500 }), children: [
            " (pass ",
            current.loopPass,
            ")"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntime.jsxs("div", { style: sx({ marginTop: 2, color: chunkCOT43DA6_cjs.theme.textSecondary }), children: [
          "recorded changes to",
          " ",
          current.contributedKeys.map((k, i) => /* @__PURE__ */ jsxRuntime.jsxs("code", { style: sx({ color: accent }), children: [
            i > 0 && ", ",
            k
          ] }, k)),
          preview !== null && /* @__PURE__ */ jsxRuntime.jsxs("span", { style: sx({ color: chunkCOT43DA6_cjs.theme.textMuted }), children: [
            current.contributedKeys.length > 1 ? ` \xB7 preview ${previewKey}` : "",
            " = ",
            preview
          ] })
        ] }),
        contributionPositionText(current) && /* @__PURE__ */ jsxRuntime.jsx("p", { "data-fp": "twc-positions", children: contributionPositionText(current) }),
        contributionBasisText(current) && /* @__PURE__ */ jsxRuntime.jsx("p", { "data-fp": "twc-value-basis", children: contributionBasisText(current) }),
        chooserVisible && /* @__PURE__ */ jsxRuntime.jsxs(
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
              /* @__PURE__ */ jsxRuntime.jsxs("div", { style: sx({ fontWeight: 600, fontSize: fs.body, color: chunkCOT43DA6_cjs.theme.textPrimary }), children: [
                "This stage has ",
                current.ingredients.length,
                " recorded ingredients \u2014 which one should the walk follow?"
              ] }),
              /* @__PURE__ */ jsxRuntime.jsx("div", { style: sx({ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }), children: current.ingredients.map((ing, i) => /* @__PURE__ */ jsxRuntime.jsx(
                IngredientChip,
                {
                  ing,
                  color: i < CHIP_COLORS.length ? CHIP_COLORS[i] : chunkCOT43DA6_cjs.theme.textMuted,
                  step: ing.writerRuntimeStageId ? stepNumberOf(ing.writerRuntimeStageId) : null,
                  onFollow: onFollowIngredient,
                  sx,
                  fs
                },
                ing.key
              )) }),
              /* @__PURE__ */ jsxRuntime.jsx(
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
                    border: `1px solid ${chunkCOT43DA6_cjs.theme.border}`,
                    background: chunkCOT43DA6_cjs.theme.bgTertiary,
                    color: chunkCOT43DA6_cjs.theme.textPrimary,
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
        /* @__PURE__ */ jsxRuntime.jsx("div", { style: sx({ marginTop: 10 }), children: chooserVisible ? null : current.ingredients.length > 0 ? /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
          /* @__PURE__ */ jsxRuntime.jsxs("div", { style: sx({ fontSize: fs.label, color: chunkCOT43DA6_cjs.theme.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }), children: [
            current.ingredients.length,
            " recorded ingredient",
            current.ingredients.length > 1 ? "s" : "",
            " (stage-level)"
          ] }),
          /* @__PURE__ */ jsxRuntime.jsx("div", { style: sx({ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }), children: current.ingredients.map((ing, i) => /* @__PURE__ */ jsxRuntime.jsx(
            IngredientChip,
            {
              ing,
              color: i < CHIP_COLORS.length ? CHIP_COLORS[i] : chunkCOT43DA6_cjs.theme.textMuted,
              step: ing.writerRuntimeStageId ? stepNumberOf(ing.writerRuntimeStageId) : null,
              onFollow: onFollowIngredient,
              sx,
              fs
            },
            ing.key
          )) })
        ] }) : /* @__PURE__ */ jsxRuntime.jsxs("div", { "data-fp": "twc-unknowable", style: sx({ fontSize: fs.body, color: chunkCOT43DA6_cjs.theme.textMuted, fontStyle: "italic" }), children: [
          noIngredientsText,
          " ",
          !walk.readsAvailable && "Read evidence is unknown; ingredients are unknowable, not absent."
        ] }) }),
        /* @__PURE__ */ jsxRuntime.jsxs("div", { style: sx({ marginTop: 14 }), children: [
          /* @__PURE__ */ jsxRuntime.jsx("div", { style: sx({ fontSize: fs.label, color: chunkCOT43DA6_cjs.theme.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600, marginBottom: 4 }), children: "The story, newest first" }),
          walk.stops.map((s, i) => {
            const isCurrent = i === currentIdx;
            return /* @__PURE__ */ jsxRuntime.jsxs(
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
                  /* @__PURE__ */ jsxRuntime.jsxs("span", { style: sx({ color: chunkCOT43DA6_cjs.theme.textMuted }), children: [
                    i + 1,
                    "."
                  ] }),
                  " ",
                  /* @__PURE__ */ jsxRuntime.jsx("code", { style: sx({ color: accent }), children: s.contributedKeys.join(", ") }),
                  /* @__PURE__ */ jsxRuntime.jsx("span", { style: sx({ color: chunkCOT43DA6_cjs.theme.textMuted }), children: " \u2190 " }),
                  s.stageName,
                  s.loopPass > 0 && /* @__PURE__ */ jsxRuntime.jsxs("span", { style: sx({ color: chunkCOT43DA6_cjs.theme.textMuted }), children: [
                    " (pass ",
                    s.loopPass,
                    ")"
                  ] }),
                  stepNumberOf(s.runtimeStageId) && /* @__PURE__ */ jsxRuntime.jsxs("span", { style: sx({ color: chunkCOT43DA6_cjs.theme.textMuted }), children: [
                    " \xB7 step ",
                    stepNumberOf(s.runtimeStageId)
                  ] }),
                  s.ingredients.length > 1 && /* @__PURE__ */ jsxRuntime.jsxs("span", { style: sx({ color: chunkCOT43DA6_cjs.theme.warning, fontWeight: 600 }), children: [
                    " \u2442 ",
                    s.ingredients.length
                  ] })
                ]
              },
              s.runtimeStageId
            );
          })
        ] }),
        /* @__PURE__ */ jsxRuntime.jsxs("div", { style: sx({ marginTop: 12, display: "flex", flexDirection: "column", gap: 4 }), children: [
          walk.inputTermini.length > 0 && /* @__PURE__ */ jsxRuntime.jsxs("div", { "data-fp": "twc-run-inputs", style: sx({ fontSize: fs.label, color: chunkCOT43DA6_cjs.theme.textMuted }), children: [
            "Reads without an earlier recorded writer (origin unknown): ",
            walk.inputTermini.map((k, i) => /* @__PURE__ */ jsxRuntime.jsxs("code", { children: [
              i > 0 && ", ",
              k
            ] }, k))
          ] }),
          walk.note && /* @__PURE__ */ jsxRuntime.jsx("div", { "data-fp": "twc-evidence", children: walk.note }),
          walk.truncated && !walk.evidence?.truncated && /* @__PURE__ */ jsxRuntime.jsx("div", { "data-fp": "twc-truncated", style: sx({ fontSize: fs.label, color: chunkCOT43DA6_cjs.theme.warning }), children: "The recorded explanation is truncated; its earliest displayed stop need not be an origin." }),
          /* @__PURE__ */ jsxRuntime.jsx(
            "button",
            {
              "data-fp": "twc-copy-story",
              onClick: copyStory,
              style: sx({
                alignSelf: "flex-start",
                marginTop: 4,
                border: `1px solid ${chunkCOT43DA6_cjs.theme.border}`,
                background: chunkCOT43DA6_cjs.theme.bgTertiary,
                color: chunkCOT43DA6_cjs.theme.textPrimary,
                borderRadius: 6,
                padding: "4px 10px",
                fontSize: fs.label,
                fontWeight: 600,
                cursor: "pointer"
              }),
              children: copied === walk ? "Copied \u2713" : "Copy story"
            }
          ),
          copyError === walk && /* @__PURE__ */ jsxRuntime.jsx("div", { role: "status", children: "Copy failed. Please try again." })
        ] })
      ]
    }
  );
});
function CardHeader({
  label: label2,
  onExit,
  sx,
  fs
}) {
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { style: sx({ display: "flex", alignItems: "center", justifyContent: "space-between" }), children: [
    /* @__PURE__ */ jsxRuntime.jsx("div", { style: sx({ fontSize: fs.label, color: chunkCOT43DA6_cjs.theme.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }), children: label2 }),
    onExit && /* @__PURE__ */ jsxRuntime.jsx(
      "button",
      {
        "data-fp": "twc-exit",
        onClick: onExit,
        "aria-label": "Exit tracing",
        style: sx({ border: "none", background: "transparent", color: chunkCOT43DA6_cjs.theme.textMuted, cursor: "pointer", fontSize: fs.body }),
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
  fs
}) {
  const terminus = !ing.writerRuntimeStageId;
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "button",
    {
      "data-fp": "twc-ingredient",
      "data-terminus": terminus || void 0,
      disabled: terminus || !onFollow,
      onClick: () => onFollow?.(ing),
      title: terminus ? `${ing.key}: ${unknownIngredientText}` : `Follow ${ing.key} \u2014 re-anchor the walk on its writer`,
      style: sx({
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        border: `1px solid ${terminus ? chunkCOT43DA6_cjs.theme.border : color}`,
        background: "transparent",
        color: terminus ? chunkCOT43DA6_cjs.theme.textMuted : color,
        borderRadius: 12,
        padding: "3px 10px",
        fontSize: fs.label,
        fontWeight: 600,
        cursor: terminus || !onFollow ? "default" : "pointer"
      }),
      children: [
        /* @__PURE__ */ jsxRuntime.jsx("code", { children: ing.key }),
        terminus ? /* @__PURE__ */ jsxRuntime.jsx("span", { style: sx({ fontWeight: 400 }), children: "\u2014 origin unknown" }) : /* @__PURE__ */ jsxRuntime.jsxs("span", { style: sx({ fontWeight: 400 }), children: [
          "\u2190 ",
          ing.writerStageName,
          step && ` \xB7 step ${step}`,
          ing.basis && " \xB7 nested contribution"
        ] })
      ]
    }
  );
}
function previewValue2(read) {
  try {
    const v2 = read();
    if (v2 === void 0) return null;
    const s = chunkDGKL4TUX_cjs.previewValue(v2);
    return s.length > 60 ? `${s.slice(0, 57)}\u2026` : s;
  } catch {
    return null;
  }
}
var DataTracePanel = React2.memo(function DataTracePanel2({
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
  const fs = chunkCOT43DA6_cjs.fontSize[size];
  const pad = chunkCOT43DA6_cjs.padding[size];
  const base = fs.body + 1;
  const sx = (s) => unstyled ? void 0 : s;
  const noteLine = note ? /* @__PURE__ */ jsxRuntime.jsx("div", { style: sx({ color: chunkCOT43DA6_cjs.theme.textMuted, fontSize: fs.label, fontStyle: "italic", marginBottom: 8 }), children: note }) : null;
  if (frames.length === 0) {
    return /* @__PURE__ */ jsxRuntime.jsxs(
      "div",
      {
        className,
        "data-fp": "data-trace-panel",
        style: { ...sx({ padding: `${pad + 2}px ${pad + 2}px ${pad}px`, fontSize: base, lineHeight: 1.55 }), ...style },
        children: [
          /* @__PURE__ */ jsxRuntime.jsx(
            "div",
            {
              style: sx({
                fontSize: fs.label,
                color: chunkCOT43DA6_cjs.theme.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                fontWeight: 600,
                marginBottom: 6
              }),
              children: "Backward causal chain"
            }
          ),
          /* @__PURE__ */ jsxRuntime.jsx("div", { style: sx({ color: chunkCOT43DA6_cjs.theme.textSecondary, marginBottom: 10 }), children: "Inspect recorded dependencies and the evidence available for a selected stage." }),
          noteLine,
          /* @__PURE__ */ jsxRuntime.jsx("div", { style: sx({ color: chunkCOT43DA6_cjs.theme.textMuted, fontSize: fs.body }), children: "Select a stage above to see its dependency chain." })
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "div",
    {
      className,
      "data-fp": "data-trace-panel",
      style: { ...sx({ padding: "8px 0", fontSize: base }), ...style },
      children: [
        note && /* @__PURE__ */ jsxRuntime.jsx("div", { style: sx({ padding: "4px 12px 0", fontSize: fs.label, color: chunkCOT43DA6_cjs.theme.textMuted, fontStyle: "italic" }), children: note }),
        fromStageName && /* @__PURE__ */ jsxRuntime.jsxs("div", { style: sx({ padding: "4px 12px 8px" }), children: [
          /* @__PURE__ */ jsxRuntime.jsxs(
            "div",
            {
              style: sx({
                fontSize: fs.label,
                color: chunkCOT43DA6_cjs.theme.textMuted,
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
          /* @__PURE__ */ jsxRuntime.jsx(
            "div",
            {
              style: sx({
                fontSize: fs.label,
                color: chunkCOT43DA6_cjs.theme.textMuted,
                fontStyle: "italic",
                marginTop: 3
              }),
              children: "Recorded dependencies for this stage. Missing evidence may limit the explanation."
            }
          )
        ] }),
        frames.map((frame, i) => /* @__PURE__ */ jsxRuntime.jsx(
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
var DataTraceFrame = React2.memo(function DataTraceFrame2({
  frame,
  isFirst,
  isLast,
  isSelected,
  onClick,
  unstyled = false,
  size = "default"
}) {
  const fs = chunkCOT43DA6_cjs.fontSize[size];
  const sx = (s) => unstyled ? void 0 : s;
  return /* @__PURE__ */ jsxRuntime.jsxs(
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
        /* @__PURE__ */ jsxRuntime.jsxs("div", { style: sx({ display: "flex", alignItems: "center", gap: 6 }), children: [
          !isFirst && /* @__PURE__ */ jsxRuntime.jsx("span", { style: sx({ color: chunkCOT43DA6_cjs.theme.textMuted, fontSize: fs.label }), children: "\u2191" }),
          /* @__PURE__ */ jsxRuntime.jsx(
            "span",
            {
              style: sx({
                fontWeight: isFirst ? 600 : 400,
                color: isFirst ? "var(--fp-accent, #6366f1)" : chunkCOT43DA6_cjs.theme.textPrimary
              }),
              children: frame.stageName
            }
          ),
          isLast && !isFirst && /* @__PURE__ */ jsxRuntime.jsx(
            "span",
            {
              style: sx({
                fontSize: fs.small,
                color: chunkCOT43DA6_cjs.theme.textMuted,
                fontStyle: "italic"
              }),
              children: "(last displayed frame)"
            }
          )
        ] }),
        frame.keysWritten.length > 0 && /* @__PURE__ */ jsxRuntime.jsxs(
          "div",
          {
            style: sx({
              fontSize: fs.label,
              color: chunkCOT43DA6_cjs.theme.textMuted,
              paddingLeft: isFirst ? 0 : 18,
              marginTop: 2
            }),
            children: [
              "wrote:",
              " ",
              /* @__PURE__ */ jsxRuntime.jsx("span", { style: sx({ color: chunkCOT43DA6_cjs.theme.textSecondary }), children: frame.keysWritten.join(", ") })
            ]
          }
        ),
        frame.linkedBy && /* @__PURE__ */ jsxRuntime.jsxs(
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
function createRecordStateReader(selection) {
  const input = adaptFlowRecord(selection);
  if (input.status === "refused") {
    return () => ({
      status: "unavailable",
      sourceId: selection.sourceId,
      reason: "unsupported-source",
      message: input.message
    });
  }
  let cursor;
  try {
    cursor = foottrace.timeTravel(input.source);
  } catch {
    return () => ({
      status: "unavailable",
      sourceId: selection.sourceId,
      reason: "reader-refused",
      message: "Foottrace could not read this source's recorded positions."
    });
  }
  const positions = /* @__PURE__ */ new Map();
  for (const stop of cursor.stops) {
    if (stop.kind === "start" || stop.kind === "end") continue;
    positions.set(stop.runtimeStageId, {
      stop,
      previous: cursor.stops[stop.step - 1]
    });
  }
  return (runtimeStageId) => {
    const position = runtimeStageId ? positions.get(runtimeStageId) : void 0;
    if (!position) {
      return {
        status: "unavailable",
        sourceId: selection.sourceId,
        reason: "stage-not-recorded",
        message: "No exact recorded position is available for this stage execution."
      };
    }
    try {
      return {
        status: "available",
        sourceId: selection.sourceId,
        stop: position.stop,
        previous: position.previous ? cursor.stateAt(position.previous) : foottrace.stateAt(input.source, -1),
        current: cursor.stateAt(position.stop)
      };
    } catch {
      return {
        status: "unavailable",
        sourceId: selection.sourceId,
        reason: "reader-refused",
        message: "Foottrace could not reconstruct state at this recorded position."
      };
    }
  };
}

// src/adapters/fromRuntimeSnapshot.ts
function looksLikeNarrativeEntry(value) {
  if (value === null || typeof value !== "object") return false;
  const e = value;
  return typeof e.type === "string" && typeof e.text === "string" && typeof e.depth === "number";
}
function readEntries(data) {
  const candidate = Array.isArray(data) ? data : isPlainRecord(data) && Array.isArray(data.entries) ? data.entries : void 0;
  if (!candidate || candidate.length === 0) return void 0;
  return looksLikeNarrativeEntry(candidate[0]) ? candidate : void 0;
}
function narrativeRecorderFromSnapshot(runtime) {
  const recorders = isPlainRecord(runtime) ? runtime.recorders : void 0;
  if (!Array.isArray(recorders)) return void 0;
  let firstMatch;
  for (const rec of recorders) {
    if (!isPlainRecord(rec)) continue;
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
var UNSAFE_KEYS = /* @__PURE__ */ new Set(["__proto__", "constructor", "prototype"]);
function isSummaryMarker(value) {
  return value !== null && typeof value === "object" && (value.__writeSummary === true || value.__readSummary === true);
}
function isPlainRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function mergeWritePatch(base, patch) {
  if (isSummaryMarker(patch)) return patch;
  if (patch === null || typeof patch !== "object") return patch;
  if (Array.isArray(patch)) return patch;
  if (isSummaryMarker(base) || !isPlainRecord(base)) {
    base = {};
  }
  const out = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    if (UNSAFE_KEYS.has(key)) continue;
    out[key] = mergeWritePatch(out[key], value);
  }
  return out;
}
function toVisualizationSnapshots(runtime, narrativeEntries) {
  const entries = narrativeEntries?.length ? narrativeEntries : narrativeFromSnapshot(runtime);
  const stageNarrativeMap = entries?.length ? buildStageNarrativeMap(entries) : /* @__PURE__ */ new Map();
  if (runtime?.executionTree === null || typeof runtime?.executionTree !== "object") return [];
  const stageTimings = extractStageTimings(runtime.recorders);
  const readState = createRecordStateReader({
    sourceId: "flow:root",
    format: "snapshot",
    record: runtime,
    reads: { status: "unknown" }
  });
  const snapshots = [];
  flattenTree(runtime.executionTree, snapshots, 0, runtime.subflowResults, stageNarrativeMap, stageTimings, readState);
  return snapshots;
}
function readStepDurations(data) {
  if (!isPlainRecord(data)) return void 0;
  const steps = data.steps;
  if (!isPlainRecord(steps)) return void 0;
  const first = Object.values(steps)[0];
  if (!isPlainRecord(first) || typeof first.duration !== "number") return void 0;
  return steps;
}
function readAggregateDurations(data) {
  if (!isPlainRecord(data)) return void 0;
  const stages = data.stages;
  if (!isPlainRecord(stages)) return void 0;
  const first = Object.values(stages)[0];
  if (!isPlainRecord(first) || typeof first.totalDuration !== "number") return void 0;
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
function flattenTree(node, out, accumulatedMs = 0, subflowResults, stageNarrativeMap = /* @__PURE__ */ new Map(), stageTimings = { byRuntimeStageId: /* @__PURE__ */ new Map(), byStageName: /* @__PURE__ */ new Map() }, readState = () => ({
  status: "unavailable",
  sourceId: "flow:unselected",
  reason: "unsupported-source",
  message: "No recorded source was supplied."
})) {
  const stageName = node.name ?? node.id;
  const durationMs = (node.runtimeStageId ? stageTimings.byRuntimeStageId.get(node.runtimeStageId) : void 0) ?? (stageName ? stageTimings.byStageName.get(stageName) : void 0) ?? (typeof node.metrics?.durationMs === "number" ? node.metrics.durationMs : 0);
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
  const recordState = readState(node.runtimeStageId);
  const memory = recordState.status === "available" ? recordState.current.state : {};
  const sfResult = (node.runtimeStageId ? subflowResults?.[node.runtimeStageId] : void 0) ?? subflowResults?.[node.subflowId ?? stageId];
  out.push({
    stageName: displayName,
    stageLabel: stageId,
    runtimeStageId: node.runtimeStageId ?? void 0,
    memory,
    recordState,
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
      const childEnd = flattenTree(child, out, nextMs, subflowResults, stageNarrativeMap, stageTimings, readState);
      maxChildEnd = Math.max(maxChildEnd, childEnd);
    }
    nextMs = maxChildEnd;
  }
  if (node.next) {
    nextMs = flattenTree(node.next, out, nextMs, subflowResults, stageNarrativeMap, stageTimings, readState);
  }
  return nextMs;
}
function subflowResultToSnapshots(subflowResult, narrativeEntries, subflowResults) {
  if (!subflowResult || typeof subflowResult !== "object") return [];
  const sf = subflowResult;
  if (!sf.treeContext?.stageContexts) return [];
  const readState = createRecordStateReader({
    sourceId: `flow:subtree:${sf.subflowId ?? "selected"}`,
    format: "tree-context",
    record: sf.treeContext,
    reads: { status: "unknown" }
  });
  const snapshots = [];
  flattenTree(
    sf.treeContext.stageContexts,
    snapshots,
    0,
    subflowResults,
    narrativeEntries?.length ? buildStageNarrativeMap(narrativeEntries) : /* @__PURE__ */ new Map(),
    { byRuntimeStageId: /* @__PURE__ */ new Map(), byStageName: /* @__PURE__ */ new Map() },
    readState
  );
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
function MemoryPanel({
  snapshots,
  selectedIndex,
  size = "default",
  unstyled = false,
  className,
  style
}) {
  const view = chunk4X66ZS4F_cjs.recordStateDisplay(
    snapshots[selectedIndex],
    snapshots[selectedIndex - 1]
  );
  if (unstyled) {
    return /* @__PURE__ */ jsxRuntime.jsxs("div", { className, style, "data-fp": "memory-panel", children: [
      /* @__PURE__ */ jsxRuntime.jsx(
        chunk4X66ZS4F_cjs.MemoryInspector,
        {
          snapshots,
          selectedIndex,
          unstyled: true
        }
      ),
      view.canCompare && view.memory !== null && /* @__PURE__ */ jsxRuntime.jsx(ScopeDiff, { previous: view.previous, current: view.memory, unstyled: true })
    ] });
  }
  return /* @__PURE__ */ jsxRuntime.jsxs(
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
        /* @__PURE__ */ jsxRuntime.jsx(
          chunk4X66ZS4F_cjs.MemoryInspector,
          {
            snapshots,
            selectedIndex,
            size
          }
        ),
        view.canCompare && view.memory !== null && /* @__PURE__ */ jsxRuntime.jsx("div", { style: { borderTop: `1px solid ${chunkCOT43DA6_cjs.theme.border}` }, children: /* @__PURE__ */ jsxRuntime.jsx(
          ScopeDiff,
          {
            previous: view.previous,
            current: view.memory,
            hideUnchanged: true,
            size
          }
        ) })
      ]
    }
  );
}
var ENTRY_ICONS = {
  stage: { icon: "\u25B8", color: chunkCOT43DA6_cjs.theme.primary, label: "Stage" },
  step: { icon: "\xB7", color: chunkCOT43DA6_cjs.theme.textMuted, label: "Data operation" },
  condition: { icon: "\u25C7", color: chunkCOT43DA6_cjs.theme.warning, label: "Decision" },
  fork: { icon: "\u2443", color: chunkCOT43DA6_cjs.theme.primary, label: "Parallel" },
  selector: { icon: "\u2443", color: chunkCOT43DA6_cjs.theme.primary, label: "Selector" },
  subflow: { icon: "\u21B3", color: chunkCOT43DA6_cjs.theme.textSecondary, label: "Subflow" },
  loop: { icon: "\u21BB", color: chunkCOT43DA6_cjs.theme.warning, label: "Loop" },
  break: { icon: "\u25A0", color: chunkCOT43DA6_cjs.theme.error, label: "Break" },
  error: { icon: "\u2717", color: chunkCOT43DA6_cjs.theme.error, label: "Error" },
  // Retry is ATTEMPT telemetry, not an outcome: attempt N failed and the same
  // stage is about to run again, so it may still succeed. That is why it is
  // warning-weight (like `condition`) and not error-weight (like `error` /
  // `break`) — colouring it red would tell the reader the run failed when it
  // may not have. The mirrored arrow keeps the "went round again" reading while
  // staying tellable apart from `loop`'s ↻, which is a by-design back-edge in
  // the chart rather than a failure. Precedent for icon reuse with a distinct
  // label: `fork` and `selector` already share ⑃.
  retry: { icon: "\u21BA", color: chunkCOT43DA6_cjs.theme.warning, label: "Retry" },
  // The run stopped and is waiting on someone — warning-weight for the same
  // reason `retry` is: it wants the eye, but nothing has failed. Hollow ▷ for
  // the resume so it reads against `stage`'s filled ▸ at a glance, and
  // success-coloured because a resumed run is a run that carried on.
  pause: { icon: "\u2016", color: chunkCOT43DA6_cjs.theme.warning, label: "Paused" },
  resume: { icon: "\u25B7", color: chunkCOT43DA6_cjs.theme.success, label: "Resumed" },
  // `scope.$emit` — the consumer's own telemetry riding the narrative. Neutral
  // weight: it is the app talking, not the engine reporting on itself.
  emit: { icon: "\u25C8", color: chunkCOT43DA6_cjs.theme.textSecondary, label: "Emitted event" }
};
function StoryNarrative({
  entries,
  revealedEntryCount,
  scopeSubflowId,
  size = "default",
  unstyled = false,
  className,
  style: outerStyle
}) {
  const fs = chunkCOT43DA6_cjs.fontSize[size];
  const pad = chunkCOT43DA6_cjs.padding[size];
  const revealedCount = revealedEntryCount;
  const isOwnLevel = React2.useMemo(() => {
    return (e) => {
      const sfId = e.subflowId;
      if (!sfId) return scopeSubflowId === void 0;
      if (e.type === "subflow") return true;
      return sfId === scopeSubflowId;
    };
  }, [scopeSubflowId]);
  const revealed = React2.useMemo(
    () => entries.slice(0, revealedCount).filter(isOwnLevel),
    [entries, revealedCount, isOwnLevel]
  );
  const futureCount = React2.useMemo(() => {
    let count = 0;
    for (let i = revealedCount; i < entries.length; i++) {
      if (isOwnLevel(entries[i])) count++;
    }
    return count;
  }, [entries, revealedCount, isOwnLevel]);
  const latestRef = React2.useRef(null);
  React2.useEffect(() => {
    latestRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [revealed.length]);
  const numberedEntries = React2.useMemo(() => {
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
    return /* @__PURE__ */ jsxRuntime.jsx("div", { className, style: outerStyle, "data-fp": "story-narrative", role: "log", children: numberedEntries.map((entry, i) => {
      if (entry.isSubflowExit) return null;
      const ht = entry.headingType;
      return /* @__PURE__ */ jsxRuntime.jsx("div", { "data-fp": "narrative-entry", "data-type": entry.type, children: entry.heading ? entry.text.startsWith("[") ? `${entry.heading}. ${entry.text}` : `${entry.heading}. [${ht}: ${entry.stageName ?? ""}] ${entry.text}` : entry.text }, i);
    }) });
  }
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "div",
    {
      className,
      style: {
        flex: 1,
        overflow: "auto",
        padding: pad,
        fontFamily: chunkCOT43DA6_cjs.theme.fontSans,
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
          const isRetry = entry.type === "retry";
          entry.isSubflow;
          const isLast = i === numberedEntries.length - 1;
          const headingType = entry.headingType;
          return /* @__PURE__ */ jsxRuntime.jsxs(
            "div",
            {
              ref: isLast ? latestRef : void 0,
              style: {
                display: "flex",
                gap: 8,
                padding: isHeading ? `${pad - 4}px 0` : `2px 0`,
                marginLeft: entry.depth * 16,
                borderBottom: isHeading ? `1px solid ${chunkCOT43DA6_cjs.theme.border}` : void 0,
                marginTop: isHeading && i > 0 ? 8 : 0
              },
              children: [
                /* @__PURE__ */ jsxRuntime.jsx(
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
                /* @__PURE__ */ jsxRuntime.jsx(
                  "span",
                  {
                    style: {
                      fontSize: isHeading ? fs.body : fs.small,
                      fontWeight: isHeading ? 600 : 400,
                      color: isError || isBreak ? chunkCOT43DA6_cjs.theme.error : isDecision || isRetry ? chunkCOT43DA6_cjs.theme.warning : isHeading ? chunkCOT43DA6_cjs.theme.textPrimary : chunkCOT43DA6_cjs.theme.textSecondary,
                      lineHeight: 1.6,
                      fontFamily: entry.type === "step" ? chunkCOT43DA6_cjs.theme.fontMono : chunkCOT43DA6_cjs.theme.fontSans
                    },
                    children: entry.heading && headingType ? entry.text.startsWith("[") ? /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
                      /* @__PURE__ */ jsxRuntime.jsxs("strong", { children: [
                        entry.heading,
                        "."
                      ] }),
                      " ",
                      entry.text
                    ] }) : /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
                      /* @__PURE__ */ jsxRuntime.jsxs("strong", { children: [
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
        futureCount > 0 && /* @__PURE__ */ jsxRuntime.jsxs("div", { style: {
          opacity: 0.3,
          fontSize: fs.small,
          color: chunkCOT43DA6_cjs.theme.textMuted,
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
function safeJsonStringify(value) {
  const seen = /* @__PURE__ */ new WeakSet();
  const MAX_CHARS = 5e5;
  try {
    let text = JSON.stringify(
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
    if (text && text.length > MAX_CHARS) {
      text = text.slice(0, MAX_CHARS) + `
... [truncated at ${MAX_CHARS} chars]`;
    }
    return text ?? "undefined";
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
  const fs = chunkCOT43DA6_cjs.fontSize[size];
  const pad = chunkCOT43DA6_cjs.padding[size];
  const narrative = React2.useMemo(() => {
    const lines = [];
    for (const snap of snapshots) {
      const stageLines = (snap.narrative ?? "").split("\n").filter(Boolean);
      lines.push(...stageLines);
    }
    return lines;
  }, [snapshots]);
  const revealedCount = React2.useMemo(() => {
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
  const rangeIndex = React2.useMemo(
    () => narrativeEntries?.length ? buildEntryRangeIndex(narrativeEntries) : void 0,
    [narrativeEntries]
  );
  const revealedEntryCount = React2.useMemo(
    () => narrativeEntries?.length ? computeRevealedEntryCount(narrativeEntries, snapshots, selectedIndex, rangeIndex) : 0,
    [narrativeEntries, snapshots, selectedIndex, rangeIndex]
  );
  const hasStructured = narrativeEntries && narrativeEntries.length > 0;
  const [copied, setCopied] = React2.useState(false);
  const buildLLMNarrative = React2.useCallback(() => {
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
  const handleCopy = React2.useCallback(async () => {
    const text = buildLLMNarrative();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2e3);
  }, [buildLLMNarrative]);
  if (unstyled) {
    return /* @__PURE__ */ jsxRuntime.jsx("div", { className, style, "data-fp": "narrative-panel", children: hasStructured ? /* @__PURE__ */ jsxRuntime.jsx(StoryNarrative, { entries: narrativeEntries, revealedEntryCount, scopeSubflowId, unstyled: true }) : /* @__PURE__ */ jsxRuntime.jsx(NarrativeTrace, { narrative, revealedCount, unstyled: true }) });
  }
  return /* @__PURE__ */ jsxRuntime.jsxs(
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
        /* @__PURE__ */ jsxRuntime.jsxs(
          "div",
          {
            style: {
              padding: `${pad - 4}px ${pad}px`,
              fontSize: fs.small,
              color: chunkCOT43DA6_cjs.theme.textMuted,
              borderBottom: `1px solid ${chunkCOT43DA6_cjs.theme.border}`,
              flexShrink: 0,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            },
            children: [
              /* @__PURE__ */ jsxRuntime.jsx("span", { style: { fontStyle: "italic" }, children: "What happened at each stage, what data flowed, what decisions were made, and why." }),
              /* @__PURE__ */ jsxRuntime.jsx(
                "button",
                {
                  onClick: handleCopy,
                  title: "Copy narrative as LLM-ready text (includes subflow details)",
                  style: {
                    background: copied ? chunkCOT43DA6_cjs.theme.success : chunkCOT43DA6_cjs.theme.bgSecondary,
                    border: `1px solid ${chunkCOT43DA6_cjs.theme.border}`,
                    borderRadius: 4,
                    padding: "2px 8px",
                    fontSize: fs.small,
                    color: copied ? "#fff" : chunkCOT43DA6_cjs.theme.textSecondary,
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
        hasStructured ? /* @__PURE__ */ jsxRuntime.jsx(
          StoryNarrative,
          {
            entries: narrativeEntries,
            revealedEntryCount,
            scopeSubflowId,
            size,
            style: { flex: 1 }
          }
        ) : /* @__PURE__ */ jsxRuntime.jsx(
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
var Graph = React2.lazy(() => import('./TracedFlow-WLBHHEBM.cjs').then(({ TracedFlow }) => ({ default: TracedFlow })));
var GraphLoadBoundary = class extends React2.Component {
  constructor() {
    super(...arguments);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) return /* @__PURE__ */ jsxRuntime.jsx("div", { role: "alert", "aria-label": "Graph unavailable", "data-fp": "graph-unavailable", children: "The flowchart could not be loaded or rendered. Check that the graph dependencies are installed, then reload the page. The other views remain available." });
    return this.props.children;
  }
};
function LazyTracedFlow(props) {
  return /* @__PURE__ */ jsxRuntime.jsx(GraphLoadBoundary, { children: /* @__PURE__ */ jsxRuntime.jsx(React2.Suspense, { fallback: /* @__PURE__ */ jsxRuntime.jsx("div", { role: "status", "aria-live": "polite", "data-fp": "graph-loading", children: "Loading flowchart\u2026" }), children: /* @__PURE__ */ jsxRuntime.jsx(Graph, { ...props }) }) });
}
var InspectorPanel = React2.memo(function InspectorPanel2({
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
  const [internalTab, setTabState] = React2.useState("state");
  const tab = controlledTab ?? internalTab;
  const setTab = (t) => {
    setTabState(t);
    onTabChange?.(t);
  };
  const currentSnapshot = snapshots[selectedIndex];
  const sx = (s) => unstyled ? void 0 : s;
  return /* @__PURE__ */ jsxRuntime.jsxs(
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
        /* @__PURE__ */ jsxRuntime.jsxs(
          "div",
          {
            "data-fp": "inspector-tabs",
            style: sx({
              display: "flex",
              borderBottom: `1px solid ${chunkCOT43DA6_cjs.theme.border}`,
              flexShrink: 0
            }),
            children: [
              /* @__PURE__ */ jsxRuntime.jsx(
                TabButton,
                {
                  active: tab === "state",
                  onClick: () => setTab("state"),
                  label: "State",
                  size,
                  unstyled
                }
              ),
              /* @__PURE__ */ jsxRuntime.jsx(
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
        /* @__PURE__ */ jsxRuntime.jsxs("div", { "data-fp": "inspector-body", style: sx({ flex: 1, overflow: "auto" }), children: [
          tab === "state" && /* @__PURE__ */ jsxRuntime.jsx(
            MemoryPanel,
            {
              snapshots,
              selectedIndex,
              size,
              unstyled
            }
          ),
          tab === "trace" && (traceContent ?? /* @__PURE__ */ jsxRuntime.jsx(
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
  label: label2,
  badge,
  size = "default",
  unstyled = false
}) {
  const fs = chunkCOT43DA6_cjs.fontSize[size];
  const sx = (s) => unstyled ? void 0 : s;
  return /* @__PURE__ */ jsxRuntime.jsxs(
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
        color: active ? "var(--fp-accent, #6366f1)" : chunkCOT43DA6_cjs.theme.textMuted,
        fontWeight: active ? 600 : 400,
        fontSize: fs.body,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 4
      }),
      children: [
        label2,
        badge && /* @__PURE__ */ jsxRuntime.jsx(
          "span",
          {
            style: sx({
              fontSize: fs.small,
              background: active ? "var(--fp-accent, #6366f1)" : chunkCOT43DA6_cjs.theme.textMuted,
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
var InsightPanel = React2.memo(function InsightPanel2({
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
    return /* @__PURE__ */ jsxRuntime.jsx(NoInsights, { ...chrome });
  }
  if (mode === "grid") {
    return /* @__PURE__ */ jsxRuntime.jsx(InsightGrid, { insights, ...chrome });
  }
  return /* @__PURE__ */ jsxRuntime.jsx(InsightTabs, { insights, defaultId: expandedId, ...chrome });
});
var styler = (unstyled) => (s) => unstyled ? void 0 : s;
var INGREDIENTS = [
  { panel: "Story", call: "narrative()", from: "footprintjs/recorders" },
  { panel: "Performance", call: "metrics()", from: "footprintjs/recorders" },
  { panel: "Quality", call: "new QualityRecorder(scoreFn)", from: "footprintjs/trace" },
  { panel: "Cost", call: "costRecorder()", from: "agentfootprint/observe" }
];
var NoInsights = React2.memo(function NoInsights2({
  size,
  unstyled,
  className,
  style
}) {
  const fs = chunkCOT43DA6_cjs.fontSize[size];
  const sx = styler(unstyled);
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "div",
    {
      className,
      "data-fp": "insights-empty",
      style: {
        ...sx({ padding: chunkCOT43DA6_cjs.padding[size], color: chunkCOT43DA6_cjs.theme.textMuted, fontSize: fs.body, lineHeight: 1.6 }),
        ...style
      },
      children: [
        /* @__PURE__ */ jsxRuntime.jsx("div", { style: sx({ marginBottom: 8 }), children: "Nothing to show \u2014 this run was recorded without any of these. Each one lights one panel:" }),
        /* @__PURE__ */ jsxRuntime.jsx("table", { style: sx({ borderCollapse: "collapse" }), children: /* @__PURE__ */ jsxRuntime.jsx("tbody", { children: INGREDIENTS.map(({ panel, call, from }) => /* @__PURE__ */ jsxRuntime.jsxs("tr", { "data-fp": "insights-empty-row", children: [
          /* @__PURE__ */ jsxRuntime.jsx("td", { style: sx({ paddingRight: 10, color: chunkCOT43DA6_cjs.theme.textSecondary, whiteSpace: "nowrap" }), children: panel }),
          /* @__PURE__ */ jsxRuntime.jsxs("td", { style: sx({ fontFamily: chunkCOT43DA6_cjs.theme.fontMono, fontSize: fs.label, whiteSpace: "nowrap" }), children: [
            call,
            /* @__PURE__ */ jsxRuntime.jsxs("span", { style: sx({ opacity: 0.7 }), children: [
              " \u2014 from ",
              from
            ] })
          ] })
        ] }, panel)) }) }),
        /* @__PURE__ */ jsxRuntime.jsxs("div", { style: sx({ marginTop: 8 }), children: [
          "Attach with ",
          /* @__PURE__ */ jsxRuntime.jsx("code", { children: "executor.attachScopeRecorder(...)" }),
          " before the run, then pass the snapshot here \u2014 each recorder's data rides along inside it."
        ] })
      ]
    }
  );
});
var InsightTabs = React2.memo(function InsightTabs2({
  insights,
  defaultId,
  size,
  unstyled,
  className,
  style
}) {
  const [activeId, setActiveId] = React2.useState(defaultId ?? insights[0]?.id);
  const active = insights.find((i) => i.id === activeId) ?? insights[0];
  const fs = chunkCOT43DA6_cjs.fontSize[size];
  const sx = styler(unstyled);
  return /* @__PURE__ */ jsxRuntime.jsxs(
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
        /* @__PURE__ */ jsxRuntime.jsx(
          "div",
          {
            "data-fp": "insight-tabs",
            style: sx({
              display: "flex",
              borderBottom: `1px solid ${chunkCOT43DA6_cjs.theme.border}`,
              flexShrink: 0,
              overflowX: "auto"
            }),
            children: insights.map((insight) => /* @__PURE__ */ jsxRuntime.jsx(
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
                  color: activeId === insight.id ? "var(--fp-accent, #6366f1)" : chunkCOT43DA6_cjs.theme.textMuted,
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
        /* @__PURE__ */ jsxRuntime.jsx("div", { "data-fp": "insight-body", style: sx({ flex: 1, overflow: "auto" }), children: active?.render() })
      ]
    }
  );
});
var InsightGrid = React2.memo(function InsightGrid2({
  insights,
  size,
  unstyled,
  className,
  style
}) {
  const cols = insights.length <= 2 ? 1 : 2;
  const fs = chunkCOT43DA6_cjs.fontSize[size];
  const sx = styler(unstyled);
  return /* @__PURE__ */ jsxRuntime.jsx(
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
          background: chunkCOT43DA6_cjs.theme.border
        }),
        ...style
      },
      children: insights.map((insight) => /* @__PURE__ */ jsxRuntime.jsxs(
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
            /* @__PURE__ */ jsxRuntime.jsxs(
              "div",
              {
                style: sx({
                  padding: "6px 10px",
                  fontSize: fs.label,
                  fontWeight: 600,
                  color: chunkCOT43DA6_cjs.theme.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  borderBottom: `1px solid ${chunkCOT43DA6_cjs.theme.border}`,
                  flexShrink: 0
                }),
                children: [
                  insight.name,
                  insight.summary && /* @__PURE__ */ jsxRuntime.jsx(
                    "span",
                    {
                      style: sx({
                        marginLeft: 8,
                        fontWeight: 400,
                        fontSize: fs.small,
                        color: chunkCOT43DA6_cjs.theme.textMuted
                      }),
                      children: insight.summary
                    }
                  )
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntime.jsx("div", { "data-fp": "insight-cell-body", style: sx({ flex: 1, overflow: "auto" }), children: insight.render() })
          ]
        },
        insight.id
      ))
    }
  );
});
var tint = (color, percent) => `color-mix(in srgb, ${color} ${percent}%, transparent)`;
var CompactTimeline = React2.memo(function CompactTimeline2({
  snapshots,
  selectedIndex,
  defaultExpanded = false,
  label: label2 = "Timeline"
}) {
  const [expanded, setExpanded] = React2.useState(defaultExpanded);
  if (snapshots.length === 0) return null;
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { style: { borderTop: `1px solid ${chunkCOT43DA6_cjs.theme.border}` }, children: [
    /* @__PURE__ */ jsxRuntime.jsxs(
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
          color: chunkCOT43DA6_cjs.theme.textMuted,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.5px"
        },
        children: [
          /* @__PURE__ */ jsxRuntime.jsx("span", { style: { fontSize: 10 }, children: expanded ? "\u25BC" : "\u25B8" }),
          label2,
          /* @__PURE__ */ jsxRuntime.jsxs("span", { style: { fontWeight: 400, fontSize: 10 }, children: [
            snapshots.length,
            " stages"
          ] }),
          !expanded && /* @__PURE__ */ jsxRuntime.jsxs(
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
                snapshots.map((snap, i) => /* @__PURE__ */ jsxRuntime.jsx(
                  "div",
                  {
                    style: {
                      width: i === selectedIndex ? 8 : 5,
                      height: i === selectedIndex ? 8 : 5,
                      borderRadius: "50%",
                      background: i < selectedIndex ? "var(--fp-success, #22c55e)" : i === selectedIndex ? "var(--fp-accent, #6366f1)" : tint(chunkCOT43DA6_cjs.theme.textMuted, 25),
                      transition: "all 0.15s",
                      flexShrink: 0
                    },
                    title: snap.stageName
                  },
                  i
                )),
                /* @__PURE__ */ jsxRuntime.jsx(
                  "div",
                  {
                    style: {
                      flex: 1,
                      height: 1,
                      background: tint(chunkCOT43DA6_cjs.theme.textMuted, 20),
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
    expanded && /* @__PURE__ */ jsxRuntime.jsx("div", { style: { padding: "0 12px 8px" }, children: /* @__PURE__ */ jsxRuntime.jsx(
      chunk4X66ZS4F_cjs.GanttTimeline,
      {
        snapshots,
        selectedIndex
      }
    ) })
  ] });
});
var EXPLAINABLE_TAB_ID = "explainable";
function isExplainableTab(tabId) {
  return tabId === EXPLAINABLE_TAB_ID || tabId === "ai-compatible";
}
var HLinePill = React2.memo(function HLinePill2({
  label: label2,
  detail,
  expanded,
  onClick
}) {
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { style: {
    display: "flex",
    alignItems: "center",
    gap: 0,
    padding: "0"
  }, children: [
    /* @__PURE__ */ jsxRuntime.jsx("div", { style: { flex: 1, height: 1, background: chunkCOT43DA6_cjs.theme.border } }),
    /* @__PURE__ */ jsxRuntime.jsxs(
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
          color: chunkCOT43DA6_cjs.theme.textMuted,
          background: chunkCOT43DA6_cjs.theme.bgSecondary,
          border: `1px solid ${chunkCOT43DA6_cjs.theme.border}`,
          borderRadius: 10,
          cursor: "pointer",
          whiteSpace: "nowrap",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          transition: "color 0.15s ease"
        },
        children: [
          /* @__PURE__ */ jsxRuntime.jsx("span", { style: { fontSize: 7 }, children: expanded ? "\u25BC" : "\u25B6" }),
          label2,
          detail && /* @__PURE__ */ jsxRuntime.jsx("span", { style: { fontWeight: 400, opacity: 0.5, fontSize: 9 }, children: detail })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntime.jsx("div", { style: { flex: 1, height: 1, background: chunkCOT43DA6_cjs.theme.border } })
  ] });
});
var VLinePill = React2.memo(function VLinePill2({
  label: label2,
  expanded,
  side = "right",
  onClick
}) {
  const arrow = side === "right" ? expanded ? "\u25B6" : "\u25C0" : expanded ? "\u25C0" : "\u25B6";
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { style: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 0,
    padding: "0"
  }, children: [
    /* @__PURE__ */ jsxRuntime.jsx("div", { style: { flex: 1, width: 1, background: chunkCOT43DA6_cjs.theme.border } }),
    /* @__PURE__ */ jsxRuntime.jsxs(
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
          color: chunkCOT43DA6_cjs.theme.textMuted,
          background: chunkCOT43DA6_cjs.theme.bgSecondary,
          border: `1px solid ${chunkCOT43DA6_cjs.theme.border}`,
          borderRadius: 10,
          cursor: "pointer",
          whiteSpace: "nowrap",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          writingMode: "vertical-lr",
          transition: "color 0.15s ease"
        },
        children: [
          /* @__PURE__ */ jsxRuntime.jsx("span", { style: { fontSize: 7, writingMode: "horizontal-tb" }, children: arrow }),
          label2
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntime.jsx("div", { style: { flex: 1, width: 1, background: chunkCOT43DA6_cjs.theme.border } })
  ] });
});
var MissingChartNote = React2.memo(function MissingChartNote2({ unstyled }) {
  const body = /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
    /* @__PURE__ */ jsxRuntime.jsx("strong", { children: "No chart \u2014 `traceGraph` was not provided." }),
    /* @__PURE__ */ jsxRuntime.jsx("div", { children: "A snapshot holds the memory, the story and the timeline. Only the chart's own structure can draw the chart. Two ways to get one:" }),
    /* @__PURE__ */ jsxRuntime.jsx("pre", { style: unstyled ? void 0 : { margin: 0, whiteSpace: "pre-wrap", fontFamily: chunkCOT43DA6_cjs.theme.fontMono, fontSize: 11 }, children: `// live build
const trace = createTraceStructureRecorder();
flowChart(..., { structureRecorders: [trace.recorder] });
<ExplainableShell traceGraph={trace.getGraph()} />

// saved run \u2014 save chart.buildTimeStructure with your snapshot
<ExplainableShell traceGraph={graphFromStructure(saved.structure)} />` })
  ] });
  if (unstyled) return /* @__PURE__ */ jsxRuntime.jsx("div", { "data-fp": "shell-missing-chart", children: body });
  return /* @__PURE__ */ jsxRuntime.jsx(
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
        color: chunkCOT43DA6_cjs.theme.textMuted,
        fontSize: 12,
        lineHeight: 1.5,
        maxWidth: 520,
        margin: "0 auto"
      },
      children: body
    }
  );
});
var EmptyShell = React2.memo(function EmptyShell2({
  reason,
  detail,
  unstyled,
  className,
  style
}) {
  const body = /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
    /* @__PURE__ */ jsxRuntime.jsx("div", { style: unstyled ? void 0 : { fontWeight: 700, color: chunkCOT43DA6_cjs.theme.textPrimary, fontSize: 13 }, children: reason }),
    /* @__PURE__ */ jsxRuntime.jsx("div", { "data-fp": "shell-empty-detail", children: detail })
  ] });
  if (unstyled) {
    return /* @__PURE__ */ jsxRuntime.jsx("div", { className, style, "data-fp": "shell-empty", children: body });
  }
  return /* @__PURE__ */ jsxRuntime.jsx(
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
        background: chunkCOT43DA6_cjs.theme.bgPrimary,
        color: chunkCOT43DA6_cjs.theme.textMuted,
        fontFamily: chunkCOT43DA6_cjs.theme.fontSans,
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
  const [showAggregate, setShowAggregate] = React2.useState(false);
  const detected = React2.useMemo(() => detectKeyedSteps(data), [data]);
  const visibleKeys = React2.useMemo(() => {
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
    return /* @__PURE__ */ jsxRuntime.jsx("div", { style: { padding: 12, fontFamily: chunkCOT43DA6_cjs.theme.fontMono, fontSize: 11, whiteSpace: "pre-wrap", overflow: "auto", height: "100%" }, children: typeof data === "string" ? data : JSON.stringify(data, null, 2) });
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
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { style: { overflow: "auto", height: "100%", display: "flex", flexDirection: "column" }, children: [
    description && /* @__PURE__ */ jsxRuntime.jsx("div", { style: { padding: "6px 12px", fontSize: 11, color: chunkCOT43DA6_cjs.theme.textMuted, fontStyle: "italic", borderBottom: `1px solid ${chunkCOT43DA6_cjs.theme.border}`, flexShrink: 0 }, children: description }),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { style: { padding: 12, flex: 1, overflow: "auto" }, children: [
      preferredOperation === "aggregate" ? (
        /* AGGREGATE: collect silently during scrub, button at end to reveal total */
        /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
          isAtEnd ? /* @__PURE__ */ jsxRuntime.jsx("div", { style: { marginBottom: 16 }, children: !showAggregate ? /* @__PURE__ */ jsxRuntime.jsx(
            "button",
            {
              onClick: () => setShowAggregate(true),
              style: {
                background: chunkCOT43DA6_cjs.theme.primary,
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
          ) : /* @__PURE__ */ jsxRuntime.jsxs("div", { style: { padding: "14px 16px", background: `color-mix(in srgb, ${chunkCOT43DA6_cjs.theme.success} 12%, transparent)`, borderRadius: 8, border: `1px solid ${chunkCOT43DA6_cjs.theme.success}44` }, children: [
            /* @__PURE__ */ jsxRuntime.jsx("div", { style: { fontSize: 10, color: chunkCOT43DA6_cjs.theme.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, fontWeight: 600 }, children: "Aggregate \u2014 grand total" }),
            numFieldKey && /* @__PURE__ */ jsxRuntime.jsxs("div", { style: { fontSize: 26, fontWeight: 700, color: chunkCOT43DA6_cjs.theme.success }, children: [
              grandTotal < 1 ? grandTotal.toFixed(3) : grandTotal.toFixed(1),
              /* @__PURE__ */ jsxRuntime.jsxs("span", { style: { fontSize: 11, color: chunkCOT43DA6_cjs.theme.textMuted, fontWeight: 400, marginLeft: 8 }, children: [
                numFieldKey,
                " \xB7 ",
                allKeys.length,
                " steps"
              ] })
            ] })
          ] }) }) : /* @__PURE__ */ jsxRuntime.jsxs("div", { style: { padding: "10px 14px", background: `color-mix(in srgb, ${chunkCOT43DA6_cjs.theme.textMuted} 6%, transparent)`, borderRadius: 6, marginBottom: 16, border: `1px dashed ${chunkCOT43DA6_cjs.theme.border}` }, children: [
            /* @__PURE__ */ jsxRuntime.jsx("div", { style: { fontSize: 10, color: chunkCOT43DA6_cjs.theme.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }, children: "Collecting data..." }),
            /* @__PURE__ */ jsxRuntime.jsxs("div", { style: { fontSize: 11, color: chunkCOT43DA6_cjs.theme.textMuted, marginTop: 4 }, children: [
              visibleEntries.length,
              " of ",
              allKeys.length,
              " steps collected. Scrub to end to aggregate."
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntime.jsx("div", { style: { fontSize: 10, color: chunkCOT43DA6_cjs.theme.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, fontWeight: 600 }, children: "Per-step detail" })
        ] })
      ) : preferredOperation === "accumulate" ? (
        /* ACCUMULATE: running total grows with slider — IS the total at end, no button */
        /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
          numFieldKey && visibleEntries.length > 0 && /* @__PURE__ */ jsxRuntime.jsxs("div", { style: { padding: "10px 14px", background: `color-mix(in srgb, ${chunkCOT43DA6_cjs.theme.primary} 8%, transparent)`, borderRadius: 6, marginBottom: 16 }, children: [
            /* @__PURE__ */ jsxRuntime.jsx("div", { style: { fontSize: 10, color: chunkCOT43DA6_cjs.theme.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4, fontWeight: 600 }, children: "Accumulate \u2014 running total up to this step" }),
            /* @__PURE__ */ jsxRuntime.jsx("span", { style: { fontWeight: 700, fontSize: 18, color: chunkCOT43DA6_cjs.theme.primary }, children: runningTotal < 1 ? runningTotal.toFixed(3) : runningTotal.toFixed(1) }),
            /* @__PURE__ */ jsxRuntime.jsxs("span", { style: { color: chunkCOT43DA6_cjs.theme.textMuted, marginLeft: 8, fontSize: 10 }, children: [
              numFieldKey,
              " \xB7 ",
              visibleEntries.length,
              " of ",
              allKeys.length,
              " steps"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntime.jsx("div", { style: { fontSize: 10, color: chunkCOT43DA6_cjs.theme.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, fontWeight: 600 }, children: "Per-step detail" })
        ] })
      ) : (
        /* TRANSLATE: per-step entries prominent, no totals */
        /* @__PURE__ */ jsxRuntime.jsx("div", { style: { fontSize: 10, color: chunkCOT43DA6_cjs.theme.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, fontWeight: 600 }, children: "Translate \u2014 per-step detail" })
      ),
      visibleEntries.map((key) => {
        const entry = steps[key];
        const label2 = entry.stageName ?? key;
        const numVal = numFieldKey ? entry[numFieldKey] : void 0;
        return /* @__PURE__ */ jsxRuntime.jsxs("div", { style: { display: "flex", alignItems: "center", padding: "4px 0", fontSize: 12, fontFamily: chunkCOT43DA6_cjs.theme.fontMono, borderBottom: `1px solid ${chunkCOT43DA6_cjs.theme.border}22` }, children: [
          /* @__PURE__ */ jsxRuntime.jsx("span", { style: { color: chunkCOT43DA6_cjs.theme.textMuted, width: 140, flexShrink: 0, fontSize: 10 }, children: key }),
          /* @__PURE__ */ jsxRuntime.jsx("span", { style: { fontWeight: 600, flex: 1 }, children: label2 }),
          numVal !== void 0 && /* @__PURE__ */ jsxRuntime.jsx("span", { style: { color: chunkCOT43DA6_cjs.theme.primary, fontWeight: 700, marginLeft: 8 }, children: numVal < 1 ? numVal.toFixed(3) : numVal.toFixed(1) })
        ] }, key);
      }),
      visibleEntries.length === 0 && /* @__PURE__ */ jsxRuntime.jsx("div", { style: { color: chunkCOT43DA6_cjs.theme.textMuted, fontSize: 11, fontStyle: "italic", padding: "8px 0" }, children: "Scrub the slider to reveal entries..." })
    ] })
  ] });
}
React2.memo(function DetailsContent2({
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
      render: ({ snapshots: snaps, selectedIndex: idx }) => /* @__PURE__ */ jsxRuntime.jsx(MemoryPanel, { snapshots: snaps, selectedIndex: idx, size, style: fillHeight ? { height: "100%" } : void 0 })
    },
    {
      id: "narrative",
      name: "Narrative",
      render: ({ snapshots: snaps, selectedIndex: idx }) => /* @__PURE__ */ jsxRuntime.jsx(NarrativePanel, { snapshots: snaps, selectedIndex: idx, narrativeEntries, size, style: fillHeight ? { height: "100%" } : void 0 })
    }
  ];
  const allViews = [...builtInViews, ...extraViews ?? []];
  const [activeViewId, setActiveViewId] = React2.useState(allViews[0]?.id ?? "memory");
  const viewIds = allViews.map((v2) => v2.id).join(",");
  React2.useEffect(() => {
    if (!allViews.find((v2) => v2.id === activeViewId)) {
      setActiveViewId(allViews[0]?.id ?? "memory");
    }
  }, [viewIds]);
  const activeView = allViews.find((v2) => v2.id === activeViewId) ?? allViews[0];
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { style: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }, children: [
    /* @__PURE__ */ jsxRuntime.jsx("div", { style: { display: "flex", borderBottom: `1px solid ${chunkCOT43DA6_cjs.theme.border}`, flexShrink: 0, overflowX: "auto" }, children: allViews.map((view) => {
      const active = view.id === activeViewId;
      return /* @__PURE__ */ jsxRuntime.jsx(
        "button",
        {
          onClick: () => setActiveViewId(view.id),
          style: {
            flex: allViews.length <= 3 ? 1 : void 0,
            padding: "6px 8px",
            fontSize: 11,
            fontWeight: active ? 600 : 400,
            color: active ? chunkCOT43DA6_cjs.theme.primary : chunkCOT43DA6_cjs.theme.textMuted,
            background: active ? `color-mix(in srgb, ${chunkCOT43DA6_cjs.theme.primary} 8%, transparent)` : "transparent",
            border: "none",
            borderBottom: active ? `2px solid ${chunkCOT43DA6_cjs.theme.primary}` : "2px solid transparent",
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
    /* @__PURE__ */ jsxRuntime.jsx("div", { style: { flex: 1, overflow: "auto" }, children: activeView?.render({ snapshots, selectedIndex }) })
  ] });
});
function resolveSubflowFromRuntime(parentSnapshots, drillKey, narrativeEntries, subflowResults) {
  const localId = drillKey.split("/").pop() ?? drillKey;
  const pathOf = (s) => s.runtimeStageId?.split("#")[0];
  const withResult = parentSnapshots.filter((s) => !!s.subflowResult);
  const parentSnap = (
    // Tier 1 — this exact mount, by full path.
    withResult.find((s) => s.subflowId === drillKey || pathOf(s) === drillKey) ?? // Tier 2 — the same mount seen from inside its own subflow, where the
    // enclosing prefix has been stripped off the ids.
    withResult.find((s) => {
      const p = pathOf(s);
      return p !== void 0 && drillKey.endsWith("/" + p) || s.subflowId !== void 0 && drillKey.endsWith("/" + s.subflowId);
    }) ?? // Tier 3 — legacy callers that drill by a bare subflow id or a label.
    withResult.find((s) => {
      const leaf = pathOf(s)?.split("/").pop();
      return s.subflowId === localId || s.stageName === drillKey || s.stageLabel === drillKey || leaf === drillKey || leaf === localId;
    })
  );
  if (!parentSnap?.subflowResult) return null;
  const label2 = parentSnap.stageLabel ?? parentSnap.stageName ?? localId;
  const sfNarrative = narrativeEntries ? extractSubflowNarrative(narrativeEntries, drillKey, label2) : void 0;
  const sfSnapshots = subflowResultToSnapshots(
    parentSnap.subflowResult,
    sfNarrative,
    subflowResults
  );
  if (sfSnapshots.length === 0) return null;
  return { subflowId: drillKey, label: label2, spec: null, snapshots: sfSnapshots, narrative: sfNarrative };
}
var RIGHT_PANEL_MODE_LABELS = {
  insights: "Insights",
  what: "Inspector",
  result: "Result"
};
var RightPanel = React2.memo(function RightPanel2({
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
  const modes = React2.useMemo(
    () => allTabs.some((t) => t.id === "result") ? ["insights", "what", "result"] : ["insights", "what"],
    [allTabs]
  );
  return /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
    /* @__PURE__ */ jsxRuntime.jsx("div", { style: {
      display: "flex",
      borderBottom: `1px solid ${chunkCOT43DA6_cjs.theme.border}`,
      flexShrink: 0,
      background: chunkCOT43DA6_cjs.theme.bgSecondary
    }, children: modes.map((m) => /* @__PURE__ */ jsxRuntime.jsx(
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
          color: mode === m ? chunkCOT43DA6_cjs.theme.primary : chunkCOT43DA6_cjs.theme.textMuted,
          background: "transparent",
          border: "none",
          borderBottom: mode === m ? `2px solid ${chunkCOT43DA6_cjs.theme.primary}` : "2px solid transparent",
          cursor: "pointer",
          fontFamily: "inherit"
        },
        children: RIGHT_PANEL_MODE_LABELS[m]
      },
      m
    )) }),
    /* @__PURE__ */ jsxRuntime.jsx("div", { style: { flex: 1, overflow: "hidden" }, children: mode === "result" ? /* @__PURE__ */ jsxRuntime.jsx("div", { style: { height: "100%", overflow: "auto" }, children: renderTabBody("result", false) }) : mode === "insights" ? /* @__PURE__ */ jsxRuntime.jsx(
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
    ) : /* @__PURE__ */ jsxRuntime.jsx(
      InspectorPanel,
      {
        snapshots,
        selectedIndex,
        dataTraceFrames: dataTrace.frames,
        dataTraceNote: dataTrace.note,
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
  const snapshotNarrative = React2.useMemo(
    () => narrativeRecorderFromSnapshot(runtimeSnapshot),
    [runtimeSnapshot]
  );
  const narrativeEntries = narrativeEntriesProp ?? snapshotNarrative?.entries;
  const derivedFromRuntime = React2.useMemo(() => {
    if (!runtimeSnapshot) return null;
    try {
      const snaps = toVisualizationSnapshots(runtimeSnapshot, narrativeEntries);
      return { snapshots: snaps, resultData: runtimeSnapshot.sharedState, error: null };
    } catch (err) {
      return {
        snapshots: [],
        resultData: null,
        error: err instanceof Error ? err.message : String(err)
      };
    }
  }, [runtimeSnapshot, narrativeEntries]);
  const snapshots = snapshotsProp ?? derivedFromRuntime?.snapshots ?? [];
  const resultData = resultDataProp ?? derivedFromRuntime?.resultData ?? null;
  const runtimeOverlay = React2.useMemo(
    () => runtimeOverlayProp ?? // The narrative rides along because retries leave no mark on the commit
    // log: a failed attempt discards its writes. Without it a replayed
    // retried stage would be the one thing the chart could not show.
    (runtimeSnapshot ? chunk4X66ZS4F_cjs.overlayFromSnapshot(runtimeSnapshot, { narrativeEntries }) : void 0),
    [runtimeOverlayProp, runtimeSnapshot, narrativeEntries]
  );
  const missingChart = snapshots.length > 0 && !traceGraph?.nodes.length;
  React2.useEffect(() => {
    if (!missingChart) return;
    chunkG4GT73OY_cjs.devWarn(
      () => "[ExplainableShell] No chart: `traceGraph` is missing, so the flowchart region is not rendered. A snapshot cannot draw the chart \u2014 only the chart's own structure can. Two ways to get one:\n  live build \u2014 const trace = createTraceStructureRecorder();\n               flowChart(..., { structureRecorders: [trace.recorder] });\n               <ExplainableShell traceGraph={trace.getGraph()} />\n  saved run  \u2014 save `chart.buildTimeStructure` next to your snapshot, then\n               <ExplainableShell traceGraph={graphFromStructure(saved.structure)} />"
    );
  }, [missingChart]);
  const tracedFlowRenderer = React2.useMemo(() => {
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
      return /* @__PURE__ */ jsxRuntime.jsx(
        LazyTracedFlow,
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
  const shellRef = React2.useRef(null);
  const [isNarrow, setIsNarrow] = React2.useState(false);
  const [isMedium, setIsMedium] = React2.useState(false);
  React2.useEffect(() => {
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
  const autoRecorderViews = React2.useMemo(() => {
    const recorders = runtimeSnapshot?.recorders;
    if (!recorders?.length) return [];
    const explicitIds = new Set((recorderViews ?? []).map((v2) => v2.id));
    if (snapshotNarrative?.id) explicitIds.add(snapshotNarrative.id);
    return recorders.filter((r) => !explicitIds.has(r.id)).map((r) => ({ id: r.id, name: r.name, description: r.description, preferredOperation: r.preferredOperation, data: r.data }));
  }, [runtimeSnapshot, recorderViews, snapshotNarrative]);
  const hasNarrative = !!narrativeEntries?.length;
  const allTabs = React2.useMemo(() => {
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
  const unstyledTabs = React2.useMemo(
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
  const [activeTab, setActiveTab] = React2.useState(resolvedDefault);
  const [snapshotIdx, setSnapshotIdx] = React2.useState(0);
  const [drillDownStack, setDrillDownStack] = React2.useState([]);
  const [rightExpanded, setRightExpanded] = React2.useState(defaultExpanded?.details ?? true);
  const [rightPanelMode, setRightPanelMode] = React2.useState("insights");
  const [inspectorTab, setInspectorTab] = React2.useState("state");
  const [traceSession, setTracing] = React2.useState(null);
  const traceContext = React2.useRef({ record: runtimeSnapshot, child: drillDownStack.length > 0, session: traceSession, cursor: snapshotIdx });
  traceContext.current = { record: runtimeSnapshot, child: drillDownStack.length > 0, session: traceSession, cursor: snapshotIdx };
  const ownsTraceSession = React2.useCallback((session) => {
    const current = traceContext.current;
    return !!session && current.session === session && current.record === session.record && !current.child;
  }, []);
  const tracing = traceSession?.record === runtimeSnapshot && drillDownStack.length === 0 ? traceSession : null;
  React2.useEffect(() => {
    if (traceSession && !tracing) setTracing(null);
  }, [traceSession, tracing]);
  const [forkChooserOpen, setForkChooserOpen] = React2.useState(false);
  const [traceSearch, setTraceSearch] = React2.useState("");
  React2.useEffect(() => {
    setForkChooserOpen(false);
  }, [snapshotIdx]);
  React2.useEffect(() => {
    if (deprecatedTabs === void 0) return;
    chunkG4GT73OY_cjs.devWarn(
      () => "[ExplainableShell] the `tabs` prop is deprecated and has no effect. Use `hideTabs` to drop tabs by id, and `defaultTab` to choose which tab opens first."
    );
  }, [deprecatedTabs]);
  const [leftExpanded, setLeftExpanded] = React2.useState(defaultExpanded?.topology ?? false);
  const [timelineExpanded, setTimelineExpanded] = React2.useState(defaultExpanded?.timeline ?? false);
  React2.useEffect(() => {
    if (isNarrow) {
      setLeftExpanded(false);
      setRightExpanded(false);
      setTimelineExpanded(false);
    }
  }, [isNarrow]);
  const triggerReflow = React2.useCallback(() => {
    requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
    setTimeout(() => window.dispatchEvent(new Event("resize")), 320);
  }, []);
  const toggleLeft = React2.useCallback((v2) => {
    setLeftExpanded(v2);
    triggerReflow();
  }, [triggerReflow]);
  const toggleRight = React2.useCallback((v2) => {
    setRightExpanded(v2);
    triggerReflow();
  }, [triggerReflow]);
  const toggleTimeline = React2.useCallback(() => {
    setTimelineExpanded((p) => !p);
    triggerReflow();
  }, [triggerReflow]);
  const isInSubflow = drillDownStack.length > 0;
  const currentLevel = React2.useMemo(() => {
    if (drillDownStack.length > 0) {
      const top = drillDownStack[drillDownStack.length - 1];
      return { spec: top.spec, snapshots: top.snapshots, narrative: top.narrative, subflowId: top.subflowId };
    }
    return { spec: null, snapshots, narrative: void 0, subflowId: void 0 };
  }, [drillDownStack, snapshots]);
  const activeSnapshots = currentLevel.snapshots;
  const safeIdx = activeSnapshots.length > 0 ? Math.max(0, Math.min(snapshotIdx, activeSnapshots.length - 1)) : 0;
  const shellDataTrace = React2.useMemo(() => {
    if (isInSubflow) return unavailableDataTrace("Data Trace is not yet supported for this child source; the root recording is not used in its place.");
    if (!runtimeSnapshot) return unavailableDataTrace("No recording was supplied for Data Trace.");
    const selected = activeSnapshots[safeIdx];
    if (!selected || typeof selected.runtimeStageId !== "string") return unavailableDataTrace("Select a stage with an exact recorded position.");
    const evidence = selected.recordState;
    if (evidence?.status === "unavailable") return unavailableDataTrace(evidence.message);
    if (evidence && (evidence.sourceId !== "flow:root" || evidence.stop.runtimeStageId !== selected.runtimeStageId)) {
      return unavailableDataTrace("The selected position belongs to a different recorded source.");
    }
    return buildSelectedDataTrace(
      { sourceId: "flow:root", format: "snapshot", record: runtimeSnapshot, reads: { status: "unknown" } },
      selected.runtimeStageId,
      evidence ? { beforeCommitIdx: evidence.stop.lastCommitIdx + 1 } : {}
    );
  }, [runtimeSnapshot, activeSnapshots, safeIdx, isInSubflow]);
  const allTracedKeys = React2.useMemo(() => {
    const log = runtimeSnapshot?.commitLog;
    if (!log?.length) return [];
    const seen = /* @__PURE__ */ new Set();
    const keys = [];
    for (const c of log) {
      if (!foottrace.isCommitBundle(c)) continue;
      for (const t of c.trace ?? []) {
        if (!seen.has(t.path)) {
          seen.add(t.path);
          keys.push(t.path);
        }
      }
    }
    return keys;
  }, [runtimeSnapshot]);
  const traceWalk = React2.useMemo(() => {
    if (!tracing) return null;
    const scope = tracing.via.length > 0 ? tracing.via[tracing.via.length - 1] : tracing;
    if (tracing.refusal) return unavailableTraceWalk(scope.key, tracing.refusal);
    return buildSelectedTraceWalk({ sourceId: "flow:root", format: "snapshot", record: tracing.record, reads: { status: "unknown" } }, scope.key, {
      beforeCommitIdx: scope.beforeCommitIdx
    });
  }, [tracing]);
  const traceStopIndices = React2.useMemo(() => {
    if (!traceWalk || traceWalk.missing || isInSubflow) return [];
    const idxByRsid = new Map(activeSnapshots.map((sn, i) => [sn.runtimeStageId, i]));
    return traceWalk.stops.map((stop) => idxByRsid.get(stop.runtimeStageId)).filter((i) => i !== void 0).sort((a, b) => a - b);
  }, [traceWalk, activeSnapshots, isInSubflow]);
  const sliceCone = React2.useMemo(() => {
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
  const narrativeScopeSubflowId = React2.useMemo(() => {
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
  const breadcrumbs = React2.useMemo(() => {
    const root = { label: title || "Flowchart", spec: null, description: void 0 };
    return [root, ...drillDownStack.map((e) => ({ label: e.label, spec: e.spec, description: void 0 }))];
  }, [title, drillDownStack]);
  const showTreeSidebar = React2.useMemo(() => {
    if (traceGraph?.nodes?.length) {
      return traceGraph.nodes.some((n) => n.data?.isSubflow === true);
    }
    return false;
  }, [traceGraph]);
  const rootOverlay = React2.useMemo(() => {
    if (isInSubflow || !snapshots.length) return { activeStage: void 0, doneStages: void 0 };
    const doneStages = new Set(snapshots.slice(0, safeIdx).map((s) => s.stageLabel));
    const activeStage = snapshots[safeIdx]?.stageLabel ?? null;
    return { activeStage, doneStages };
  }, [isInSubflow, snapshots, safeIdx]);
  const handleTabChange = React2.useCallback((tab) => {
    setActiveTab(tab);
    setDrillDownStack([]);
  }, []);
  const handleSnapshotChange = React2.useCallback((idx) => {
    if (typeof idx === "number") setSnapshotIdx(idx);
  }, []);
  const jumpToAnchor = React2.useCallback(
    (walk) => {
      const anchor = walk.stops[0];
      if (!anchor) return;
      const idx = activeSnapshots.findIndex((sn) => sn.runtimeStageId === anchor.runtimeStageId);
      if (idx >= 0) setSnapshotIdx(idx);
    },
    [activeSnapshots]
  );
  const handleStartTracing = React2.useCallback(
    (key) => {
      if (!runtimeSnapshot?.commitLog || isInSubflow) return;
      if (traceContext.current.record !== runtimeSnapshot || traceContext.current.child || traceContext.current.cursor !== snapshotIdx || traceContext.current.session !== traceSession) return;
      const beforeCommitIdx = shellDataTrace.evidence?.beforeCommitIdx;
      const refusal = beforeCommitIdx === void 0 || shellDataTrace.status === "unavailable" ? `Cannot anchor this question to the selected position. ${shellDataTrace.note}` : void 0;
      setTracing({ record: runtimeSnapshot, key, beforeCommitIdx, refusal, via: [] });
      setForkChooserOpen(false);
      setTraceSearch("");
      setRightPanelMode("what");
      setInspectorTab("trace");
      if (!refusal) jumpToAnchor(buildSelectedTraceWalk({ sourceId: "flow:root", format: "snapshot", record: runtimeSnapshot, reads: { status: "unknown" } }, key, { beforeCommitIdx }));
    },
    [runtimeSnapshot, isInSubflow, shellDataTrace, jumpToAnchor, snapshotIdx, traceSession]
  );
  const handleFollowIngredient = React2.useCallback(
    (ing) => {
      if (!tracing || !ownsTraceSession(tracing) || ing.writerCommitIdx === null) return;
      if (!traceWalk?.stops.some((stop) => stop.ingredients.includes(ing))) return;
      const scope = { key: ing.key, beforeCommitIdx: ing.writerCommitIdx + 1 };
      setTracing({ ...tracing, via: [...tracing.via, scope] });
      setForkChooserOpen(false);
      jumpToAnchor(
        buildSelectedTraceWalk({ sourceId: "flow:root", format: "snapshot", record: tracing.record, reads: { status: "unknown" } }, scope.key, {
          beforeCommitIdx: scope.beforeCommitIdx
        })
      );
    },
    [tracing, traceWalk, jumpToAnchor, ownsTraceSession]
  );
  const handleShowAllIngredients = React2.useCallback(() => {
    if (!tracing || !ownsTraceSession(tracing)) return;
    setTracing({ ...tracing, via: [] });
    setForkChooserOpen(false);
    jumpToAnchor(
      buildSelectedTraceWalk({ sourceId: "flow:root", format: "snapshot", record: tracing.record, reads: { status: "unknown" } }, tracing.key, {
        beforeCommitIdx: tracing.beforeCommitIdx
      })
    );
  }, [tracing, jumpToAnchor, ownsTraceSession]);
  const handleExitTracing = React2.useCallback(() => {
    if (!ownsTraceSession(tracing)) return;
    setTracing(null);
    setForkChooserOpen(false);
  }, [tracing, ownsTraceSession]);
  const handleForkPrompt = React2.useCallback(() => {
    if (ownsTraceSession(tracing)) setForkChooserOpen(true);
  }, [tracing, ownsTraceSession]);
  const handleContinueTimeOrder = React2.useCallback(() => {
    if (!ownsTraceSession(tracing)) return;
    const earlier = traceStopIndices.filter((i) => i < safeIdx);
    if (earlier.length > 0) setSnapshotIdx(earlier[earlier.length - 1]);
    setForkChooserOpen(false);
  }, [tracing, traceStopIndices, safeIdx, ownsTraceSession]);
  const chartDrillKey = drillDownStack.length > 0 ? drillDownStack[drillDownStack.length - 1].subflowId : null;
  const buildDrillStack = React2.useCallback(
    (mountKey) => {
      const chain = traceGraph ? chunkG4GT73OY_cjs.buildSubflowBreadcrumb(traceGraph, mountKey).slice(1).map((c) => c.subflowId).filter((id) => id !== null) : [mountKey];
      const keys = chain.length > 0 ? chain : [mountKey];
      const stack = [];
      let levelSnapshots = snapshots;
      for (const key of keys) {
        const entry = resolveSubflowFromRuntime(
          levelSnapshots,
          key,
          narrativeEntries,
          runtimeSnapshot?.subflowResults
        );
        if (!entry) return null;
        stack.push({ ...entry, parentSnapshotIdx: stack.length === 0 ? snapshotIdx : 0 });
        levelSnapshots = entry.snapshots;
      }
      return stack.length > 0 ? stack : null;
    },
    [traceGraph, snapshots, narrativeEntries, runtimeSnapshot, snapshotIdx]
  );
  const handleDrillDown = React2.useCallback(
    (mountKey) => {
      const stack = buildDrillStack(mountKey);
      if (stack) {
        setTracing(null);
        setForkChooserOpen(false);
        setDrillDownStack(stack);
        setSnapshotIdx(0);
      }
    },
    [buildDrillStack]
  );
  const handleBreadcrumbNavigate = React2.useCallback((level) => {
    setDrillDownStack((prev) => {
      const popped = level === 0 ? prev[0] : prev[level];
      if (popped) setSnapshotIdx(popped.parentSnapshotIdx);
      return level === 0 ? [] : prev.slice(0, level);
    });
  }, []);
  const handleChartSubflowChange = React2.useCallback(
    (mountKey) => {
      if (mountKey === null) {
        handleBreadcrumbNavigate(0);
        return;
      }
      const at = drillDownStack.findIndex((e) => e.subflowId === mountKey);
      if (at >= 0) {
        if (at < drillDownStack.length - 1) handleBreadcrumbNavigate(at + 1);
        return;
      }
      handleDrillDown(mountKey);
    },
    [drillDownStack, handleBreadcrumbNavigate, handleDrillDown]
  );
  const handleNodeClick = React2.useCallback(
    (indexOrId) => {
      if (typeof indexOrId === "number") {
        setSnapshotIdx(indexOrId);
        return;
      }
      if (buildDrillStack(indexOrId)) {
        handleChartSubflowChange(indexOrId);
        return;
      }
      const idx = activeSnapshots.findIndex((s) => s.stageLabel === indexOrId);
      if (idx >= 0) setSnapshotIdx(idx);
    },
    [activeSnapshots, buildDrillStack, handleChartSubflowChange]
  );
  const handleTreeNodeSelect = React2.useCallback(
    (name, isSubflow, nodeId) => {
      if (isSubflow) {
        handleDrillDown(nodeId ?? name);
      } else {
        setDrillDownStack([]);
        const idx = snapshots.findIndex((s) => s.stageLabel === name);
        if (idx >= 0) setSnapshotIdx(idx);
      }
    },
    [snapshots, handleDrillDown]
  );
  const navigateToStage = React2.useCallback(
    (id) => {
      const idx = activeSnapshots.findIndex((sn) => sn.runtimeStageId === id);
      if (idx >= 0) setSnapshotIdx(idx);
    },
    [activeSnapshots]
  );
  const activeViaKey = tracing && tracing.via.length > 0 ? tracing.via[tracing.via.length - 1].key : null;
  const stepNumberOf = React2.useCallback(
    (rsid) => {
      const i = activeSnapshots.findIndex((sn) => sn.runtimeStageId === rsid);
      return i >= 0 ? i + 1 : null;
    },
    [activeSnapshots]
  );
  const tracingRail = React2.useMemo(() => {
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
  const traceTabContent = React2.useMemo(() => {
    if (tracing && traceWalk) {
      const currentStop = traceWalk.stops.find((stop) => stop.runtimeStageId === activeSnapshots[safeIdx]?.runtimeStageId) ?? traceWalk.stops[0];
      return /* @__PURE__ */ jsxRuntime.jsx(
        TraceWalkCard,
        {
          walk: traceWalk,
          cursorRuntimeStageId: activeSnapshots[safeIdx]?.runtimeStageId ?? null,
          viaKey: activeViaKey,
          stepNumberOf,
          previewValueOf: (k) => currentStop ? traceContributionPreview({ sourceId: "flow:root", format: "snapshot", record: tracing.record, reads: { status: "unknown" } }, traceWalk, currentStop, k) : void 0,
          onFollowIngredient: handleFollowIngredient,
          onJumpToStop: (id) => {
            if (ownsTraceSession(tracing)) navigateToStage(id);
          },
          onShowAll: activeViaKey ? handleShowAllIngredients : void 0,
          onExit: handleExitTracing,
          forkChooserOpen,
          onContinueTimeOrder: handleContinueTimeOrder,
          canContinueTimeOrder: traceStopIndices.some((i) => i < safeIdx)
        }
      );
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
    return /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
      !isInSubflow && (shellDataTrace.frames[0]?.keysWritten?.length ?? 0) > 0 && /* @__PURE__ */ jsxRuntime.jsxs("div", { "data-fp": "trace-entry", style: { padding: "10px 14px 0", fontSize: 12 }, children: [
        /* @__PURE__ */ jsxRuntime.jsx("span", { style: { color: chunkCOT43DA6_cjs.theme.textMuted, marginRight: 6 }, children: "This step wrote:" }),
        shellDataTrace.frames[0].keysWritten.map((k) => /* @__PURE__ */ jsxRuntime.jsx(
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
      !isInSubflow && allTracedKeys.length > 0 && /* @__PURE__ */ jsxRuntime.jsxs("div", { "data-fp": "trace-any", style: { padding: "6px 14px 0", fontSize: 12 }, children: [
        /* @__PURE__ */ jsxRuntime.jsx("div", { style: { color: chunkCOT43DA6_cjs.theme.textMuted, marginBottom: 4 }, children: "Trace any variable:" }),
        /* @__PURE__ */ jsxRuntime.jsx(
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
              background: chunkCOT43DA6_cjs.theme.bgTertiary,
              border: `1px solid ${chunkCOT43DA6_cjs.theme.border}`,
              borderRadius: 6,
              color: chunkCOT43DA6_cjs.theme.textPrimary,
              fontSize: 11,
              fontFamily: "monospace",
              padding: "4px 8px",
              marginBottom: 6
            }
          }
        ),
        shownKeys.map((k) => /* @__PURE__ */ jsxRuntime.jsx(
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
        query === "" && matchedKeys.length > shownKeys.length && /* @__PURE__ */ jsxRuntime.jsxs("span", { style: { color: chunkCOT43DA6_cjs.theme.textMuted, fontSize: 11 }, children: [
          "+",
          matchedKeys.length - shownKeys.length,
          " more \u2014 type to search"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntime.jsx(
        DataTracePanel,
        {
          frames: shellDataTrace.frames,
          note: shellDataTrace.note,
          selectedStageId: activeSnapshots[safeIdx]?.runtimeStageId,
          onFrameClick: navigateToStage,
          fromStageName: activeSnapshots[safeIdx]?.stageName
        }
      )
    ] });
  }, [tracing, traceWalk, activeSnapshots, safeIdx, activeViaKey, stepNumberOf, handleFollowIngredient, navigateToStage, handleShowAllIngredients, handleExitTracing, handleStartTracing, isInSubflow, shellDataTrace, forkChooserOpen, handleContinueTimeOrder, traceStopIndices, traceSearch, allTracedKeys, ownsTraceSession]);
  new Map(allTabs.map((t) => [t.id, t.name]));
  const renderTabBody = React2.useCallback(
    (tabId, plain) => {
      if (tabId === "result") {
        return /* @__PURE__ */ jsxRuntime.jsx(
          ResultPanel,
          {
            data: resultData ?? null,
            logs,
            hideConsole,
            size,
            unstyled: plain
          }
        );
      }
      if (tabId === "memory") {
        return /* @__PURE__ */ jsxRuntime.jsx(
          MemoryPanel,
          {
            snapshots: activeSnapshots,
            selectedIndex: safeIdx,
            size,
            unstyled: plain,
            style: plain ? void 0 : { height: "100%" }
          }
        );
      }
      if (tabId === "narrative") {
        return /* @__PURE__ */ jsxRuntime.jsx(
          NarrativePanel,
          {
            snapshots: activeSnapshots,
            selectedIndex: safeIdx,
            narrativeEntries: activeNarrativeEntries,
            scopeSubflowId: narrativeScopeSubflowId,
            runtimeSnapshot,
            size,
            unstyled: plain,
            style: plain ? void 0 : { height: "100%" }
          }
        );
      }
      const customView = recorderViews?.find((v2) => v2.id === tabId);
      if (customView?.render) {
        return customView.render({ snapshots: activeSnapshots, selectedIndex: safeIdx });
      }
      const autoView = autoRecorderViews.find((v2) => v2.id === tabId);
      if (autoView) {
        return /* @__PURE__ */ jsxRuntime.jsx(
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
      narrativeScopeSubflowId,
      runtimeSnapshot,
      recorderViews,
      autoRecorderViews
    ]
  );
  const shellThemeVars = React2.useMemo(() => {
    if (!traceTheme) return {};
    return {
      // ONE mapping from mode → palette, shared with the standalone
      // components' `theme="light"` prop (theme/mode.ts).
      ...chunkG4GT73OY_cjs.themeModeVars(traceTheme.mode),
      ...traceTheme.visited !== void 0 && { ["--fp-node-visited"]: traceTheme.visited },
      ...traceTheme.current !== void 0 && { ["--fp-node-cursor"]: traceTheme.current }
    };
  }, [traceTheme]);
  const renderEmptyState = (themeVars) => {
    const shellStyle = { ...themeVars, ...style };
    if (derivedFromRuntime?.error) {
      return /* @__PURE__ */ jsxRuntime.jsx(
        EmptyShell,
        {
          unstyled,
          className,
          style: shellStyle,
          reason: "That snapshot could not be read.",
          detail: /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
            /* @__PURE__ */ jsxRuntime.jsxs("div", { children: [
              "Expected a footprintjs ",
              /* @__PURE__ */ jsxRuntime.jsx("code", { children: "executor.getSnapshot()" }),
              " \u2014",
              " ",
              /* @__PURE__ */ jsxRuntime.jsx("code", { children: "{ sharedState, executionTree, commitLog }" }),
              "."
            ] }),
            /* @__PURE__ */ jsxRuntime.jsx("div", { style: unstyled ? void 0 : { fontFamily: chunkCOT43DA6_cjs.theme.fontMono, fontSize: 11, marginTop: 6 }, children: derivedFromRuntime.error })
          ] })
        }
      );
    }
    const gotRunData = !!runtimeSnapshot || !!snapshotsProp;
    return /* @__PURE__ */ jsxRuntime.jsx(
      EmptyShell,
      {
        unstyled,
        className,
        style: shellStyle,
        reason: gotRunData ? "That run has no stages to show." : "No run to show yet.",
        detail: gotRunData ? /* @__PURE__ */ jsxRuntime.jsxs("div", { children: [
          "The snapshot was read fine but its ",
          /* @__PURE__ */ jsxRuntime.jsx("code", { children: "executionTree" }),
          " is empty \u2014 a run that was never executed, or a snapshot taken before ",
          /* @__PURE__ */ jsxRuntime.jsx("code", { children: "run()" }),
          " finished."
        ] }) : /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
          /* @__PURE__ */ jsxRuntime.jsxs("div", { children: [
            "Pass a recorded run: ",
            /* @__PURE__ */ jsxRuntime.jsxs("code", { children: [
              "runtimeSnapshot=",
              "{executor.getSnapshot()}"
            ] }),
            " (the shell converts it), or pre-converted",
            " ",
            /* @__PURE__ */ jsxRuntime.jsxs("code", { children: [
              "snapshots=",
              "{toVisualizationSnapshots(...)}"
            ] }),
            "."
          ] }),
          /* @__PURE__ */ jsxRuntime.jsxs("div", { children: [
            "Add ",
            /* @__PURE__ */ jsxRuntime.jsx("code", { children: "traceGraph" }),
            " for the chart \u2014 it comes from the chart's structure, not the snapshot."
          ] })
        ] })
      }
    );
  };
  if (unstyled) {
    if (snapshots.length === 0) return renderEmptyState({});
    return /* @__PURE__ */ jsxRuntime.jsxs("div", { className, style, "data-fp": "explainable-shell", children: [
      /* @__PURE__ */ jsxRuntime.jsx("div", { "data-fp": "shell-tabs", children: unstyledTabs.map((tab) => /* @__PURE__ */ jsxRuntime.jsx("button", { "data-fp": "shell-tab", "data-active": tab.id === activeTab, onClick: () => handleTabChange(tab.id), children: tab.name }, tab.id)) }),
      /* @__PURE__ */ jsxRuntime.jsx("div", { "data-fp": "shell-content", "data-tab": activeTab, children: isExplainableTab(activeTab) ? /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
        /* @__PURE__ */ jsxRuntime.jsx(TimeTravelControls, { snapshots: activeSnapshots, selectedIndex: safeIdx, onIndexChange: handleSnapshotChange, unstyled: true, tracing: tracingRail }),
        isInSubflow && /* @__PURE__ */ jsxRuntime.jsx(chunk4X66ZS4F_cjs.SubflowBreadcrumb, { breadcrumbs, onNavigate: handleBreadcrumbNavigate }),
        traceGraph && effectiveRenderFlowchart?.({ spec: null, snapshots: activeSnapshots, selectedIndex: safeIdx, onNodeClick: handleNodeClick, showStageId, currentSubflowId: chartDrillKey, onSubflowChange: handleChartSubflowChange, ...sliceCone && { sliceCone } }),
        missingChart && /* @__PURE__ */ jsxRuntime.jsx(MissingChartNote, { unstyled: true }),
        /* @__PURE__ */ jsxRuntime.jsx(MemoryPanel, { snapshots: activeSnapshots, selectedIndex: safeIdx, unstyled: true }),
        /* @__PURE__ */ jsxRuntime.jsx(NarrativePanel, { snapshots: activeSnapshots, selectedIndex: safeIdx, narrativeEntries: activeNarrativeEntries, scopeSubflowId: narrativeScopeSubflowId, unstyled: true }),
        /* @__PURE__ */ jsxRuntime.jsx(chunk4X66ZS4F_cjs.GanttTimeline, { snapshots: activeSnapshots, selectedIndex: safeIdx, onSelect: handleSnapshotChange, unstyled: true })
      ] }) : renderTabBody(activeTab, true) })
    ] });
  }
  const showTopology = !!effectiveRenderFlowchart && !!traceGraph;
  const detailsContent = renderTabBody(activeTab, false);
  const detailsPanel = /* @__PURE__ */ jsxRuntime.jsxs("div", { style: { display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }, children: [
    /* @__PURE__ */ jsxRuntime.jsx("div", { style: {
      display: "flex",
      borderBottom: `1px solid ${chunkCOT43DA6_cjs.theme.border}`,
      background: chunkCOT43DA6_cjs.theme.bgSecondary,
      flexShrink: 0,
      overflowX: "auto"
    }, children: allTabs.map((tab) => {
      const active = tab.id === activeTab;
      return /* @__PURE__ */ jsxRuntime.jsx(
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
            color: active ? chunkCOT43DA6_cjs.theme.primary : chunkCOT43DA6_cjs.theme.textMuted,
            background: "transparent",
            border: "none",
            borderBottom: active ? `2px solid ${chunkCOT43DA6_cjs.theme.primary}` : "2px solid transparent",
            cursor: "pointer",
            fontFamily: "inherit",
            whiteSpace: "nowrap"
          },
          children: tab.name
        },
        tab.id
      );
    }) }),
    /* @__PURE__ */ jsxRuntime.jsx("div", { style: { flex: 1, overflow: "auto" }, children: detailsContent })
  ] });
  if (snapshots.length === 0) return renderEmptyState(shellThemeVars);
  return /* @__PURE__ */ jsxRuntime.jsxs(
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
        background: chunkCOT43DA6_cjs.theme.bgPrimary,
        color: chunkCOT43DA6_cjs.theme.textPrimary,
        fontFamily: chunkCOT43DA6_cjs.theme.fontSans,
        fontSize: 12,
        ...style
      },
      "data-fp": "explainable-shell",
      children: [
        /* @__PURE__ */ jsxRuntime.jsx(
          TimeTravelControls,
          {
            snapshots: activeSnapshots,
            selectedIndex: safeIdx,
            onIndexChange: handleSnapshotChange,
            size,
            tracing: tracingRail
          }
        ),
        isInSubflow && /* @__PURE__ */ jsxRuntime.jsx(chunk4X66ZS4F_cjs.SubflowBreadcrumb, { breadcrumbs, onNavigate: handleBreadcrumbNavigate }),
        /* @__PURE__ */ jsxRuntime.jsx("div", { style: { flex: 1, overflow: isNarrow ? "auto" : "hidden", display: "flex", flexDirection: "column" }, children: isNarrow ? (
          /* ── Mobile: stacked vertical ── */
          /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
            showTopology && /* @__PURE__ */ jsxRuntime.jsx("div", { style: { height: 350, flexShrink: 0, overflow: "hidden" }, children: effectiveRenderFlowchart({
              spec: null,
              snapshots: activeSnapshots,
              selectedIndex: safeIdx,
              onNodeClick: handleNodeClick,
              showStageId,
              currentSubflowId: chartDrillKey,
              onSubflowChange: handleChartSubflowChange,
              ...sliceCone && { sliceCone }
            }) }),
            missingChart && /* @__PURE__ */ jsxRuntime.jsx(MissingChartNote, {}),
            showTreeSidebar && /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
              /* @__PURE__ */ jsxRuntime.jsx(HLinePill, { label: leftLabel, expanded: leftExpanded, onClick: () => toggleLeft(!leftExpanded) }),
              leftExpanded && /* @__PURE__ */ jsxRuntime.jsx("div", { style: { maxHeight: 180, overflow: "auto", flexShrink: 0 }, children: /* @__PURE__ */ jsxRuntime.jsx(
                chunk4X66ZS4F_cjs.SubflowTree,
                {
                  graph: traceGraph ?? { nodes: [], edges: [] },
                  activeStage: rootOverlay.activeStage,
                  doneStages: rootOverlay.doneStages,
                  onNodeSelect: handleTreeNodeSelect
                }
              ) })
            ] }),
            /* @__PURE__ */ jsxRuntime.jsx(HLinePill, { label: rightLabel, expanded: rightExpanded, onClick: () => toggleRight(!rightExpanded) }),
            rightExpanded && /* @__PURE__ */ jsxRuntime.jsx("div", { style: { maxHeight: 350, flexShrink: 0, overflow: "hidden" }, children: detailsPanel }),
            /* @__PURE__ */ jsxRuntime.jsx(HLinePill, { label: bottomLabel, detail: `${activeSnapshots.length} stages`, expanded: timelineExpanded, onClick: toggleTimeline }),
            timelineExpanded && /* @__PURE__ */ jsxRuntime.jsx("div", { style: { flexShrink: 0, overflow: "hidden" }, children: /* @__PURE__ */ jsxRuntime.jsx(chunk4X66ZS4F_cjs.GanttTimeline, { snapshots: activeSnapshots, selectedIndex: safeIdx, onSelect: handleSnapshotChange, size }) })
          ] })
        ) : (
          /* ── Desktop: two-column — Flowchart | Right Panel ── */
          /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
            /* @__PURE__ */ jsxRuntime.jsxs("div", { style: { flex: 1, display: "flex", overflow: "hidden" }, children: [
              showTreeSidebar && (leftExpanded ? /* @__PURE__ */ jsxRuntime.jsxs("div", { style: { width: 180, flexShrink: 0, display: "flex", flexDirection: "row", overflow: "hidden" }, children: [
                /* @__PURE__ */ jsxRuntime.jsx("div", { style: { flex: 1, overflow: "auto" }, children: /* @__PURE__ */ jsxRuntime.jsx(
                  chunk4X66ZS4F_cjs.SubflowTree,
                  {
                    graph: traceGraph ?? { nodes: [], edges: [] },
                    activeStage: rootOverlay.activeStage,
                    doneStages: rootOverlay.doneStages,
                    onNodeSelect: handleTreeNodeSelect
                  }
                ) }),
                /* @__PURE__ */ jsxRuntime.jsx(VLinePill, { label: leftLabel, expanded: true, side: "left", onClick: () => toggleLeft(false) })
              ] }) : /* @__PURE__ */ jsxRuntime.jsx(VLinePill, { label: leftLabel, expanded: false, side: "left", onClick: () => toggleLeft(true) })),
              showTopology ? /* @__PURE__ */ jsxRuntime.jsx("div", { style: { flex: 1, overflow: "hidden", minWidth: 0 }, children: effectiveRenderFlowchart({
                spec: null,
                snapshots: activeSnapshots,
                selectedIndex: safeIdx,
                onNodeClick: handleNodeClick,
                showStageId,
                currentSubflowId: chartDrillKey,
                onSubflowChange: handleChartSubflowChange,
                ...sliceCone && { sliceCone }
              }) }) : /* @__PURE__ */ jsxRuntime.jsx("div", { style: { flex: 1, minWidth: 0, overflow: "auto" }, children: missingChart && /* @__PURE__ */ jsxRuntime.jsx(MissingChartNote, {}) }),
              /* @__PURE__ */ jsxRuntime.jsx(VLinePill, { label: rightLabel, expanded: rightExpanded, onClick: () => toggleRight(!rightExpanded) }),
              rightExpanded && /* @__PURE__ */ jsxRuntime.jsx("div", { style: { width: "42%", minWidth: 320, maxWidth: 550, display: "flex", flexDirection: "column", overflow: "hidden" }, children: /* @__PURE__ */ jsxRuntime.jsx(
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
            /* @__PURE__ */ jsxRuntime.jsx(
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
  const prepared = React2.useMemo(() => prepare(input), [input]);
  React2__namespace.useEffect(() => {
    if (!prepared.ok && onError) onError(prepared.error);
  }, [prepared, onError]);
  const traceGraph = React2.useMemo(() => {
    if (!prepared.ok) return void 0;
    const structure = prepared.recording.structure ?? prepared.recording.blueprint;
    const graph = chunk4X66ZS4F_cjs.graphFromStructure(structure);
    return graph.nodes.length > 0 ? graph : void 0;
  }, [prepared]);
  const runtimeOverlay = React2.useMemo(
    () => prepared.ok ? chunk4X66ZS4F_cjs.overlayFromSnapshot(prepared.recording.snapshot, {
      // Retry attempts live in the narrative, never in the commit log —
      // a discarded attempt commits nothing.
      narrativeEntries: prepared.recording.narrativeEntries
    }) : void 0,
    [prepared]
  );
  if (!prepared.ok) {
    return fallback ?? null;
  }
  return /* @__PURE__ */ jsxRuntime.jsx(
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
var ExplainableRunContext = React2.createContext(null);
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
  const parsed = React2.useMemo(() => parseRecording2(input), [input]);
  const prepared = React2.useMemo(() => {
    if (!parsed.recording) {
      return {
        snapshots: [],
        narrativeEntries: [],
        traceGraph: chunk4X66ZS4F_cjs.graphFromStructure(void 0),
        runtimeOverlay: chunk4X66ZS4F_cjs.overlayFromSnapshot(void 0),
        error: parsed.error
      };
    }
    const narrativeEntries = parsed.recording.narrativeEntries ?? narrativeFromSnapshot(parsed.recording.snapshot) ?? [];
    const runtimeSnapshot = parsed.recording.snapshot;
    try {
      return {
        snapshots: toVisualizationSnapshots(runtimeSnapshot, narrativeEntries),
        narrativeEntries,
        traceGraph: chunk4X66ZS4F_cjs.graphFromStructure(
          parsed.recording.structure ?? parsed.recording.blueprint
        ),
        runtimeOverlay: chunk4X66ZS4F_cjs.overlayFromSnapshot(parsed.recording.snapshot, { narrativeEntries }),
        error: null
      };
    } catch (error) {
      return {
        snapshots: [],
        narrativeEntries,
        traceGraph: chunk4X66ZS4F_cjs.graphFromStructure(
          parsed.recording.structure ?? parsed.recording.blueprint
        ),
        runtimeOverlay: chunk4X66ZS4F_cjs.overlayFromSnapshot(parsed.recording.snapshot, { narrativeEntries }),
        error: `Could not read recording snapshot: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }, [parsed]);
  const [uncontrolledIndex, setUncontrolledIndex] = React2.useState(defaultSelectedIndex);
  const requestedIndex = controlledIndex ?? uncontrolledIndex;
  const selectedIndex = Math.max(
    0,
    Math.min(requestedIndex, Math.max(0, prepared.snapshots.length - 1))
  );
  const selectIndex = React2.useCallback(
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
  const value = React2.useMemo(
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
  return /* @__PURE__ */ jsxRuntime.jsx(ExplainableRunContext.Provider, { value, children: /* @__PURE__ */ jsxRuntime.jsx(
    "div",
    {
      className,
      "data-fp": "explainable-provider",
      style: { ...chunkG4GT73OY_cjs.themeModeVars(theme2?.mode), display: "contents", ...style },
      children: /* @__PURE__ */ jsxRuntime.jsx(chunkG4GT73OY_cjs.FootprintTheme, { tokens: theme2?.tokens, children })
    }
  ) });
}
function useExplainableRun() {
  const value = React2.useContext(ExplainableRunContext);
  if (!value) {
    throw new Error("Explainable components must be rendered inside <ExplainableProvider>.");
  }
  return value;
}
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
  const focusedRef = React2.useRef(null);
  React2.useEffect(() => {
    focusedRef.current?.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
  }, [selectedIndex]);
  if (unstyled) {
    return /* @__PURE__ */ jsxRuntime.jsx("div", { className, style, "data-fp": "timeline-panel", children: snapshots.map((snapshot, index) => /* @__PURE__ */ jsxRuntime.jsx("button", { onClick: () => selectIndex(index), children: snapshot.stageLabel }, `${snapshot.runtimeStageId ?? snapshot.stageName}-${index}`)) });
  }
  return /* @__PURE__ */ jsxRuntime.jsxs(
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
        background: chunkCOT43DA6_cjs.theme.bgSecondary,
        color: chunkCOT43DA6_cjs.theme.textPrimary,
        fontFamily: chunkCOT43DA6_cjs.theme.fontSans,
        ...style
      },
      children: [
        /* @__PURE__ */ jsxRuntime.jsxs("header", { style: { padding: "10px 12px", borderBottom: `1px solid ${chunkCOT43DA6_cjs.theme.border}` }, children: [
          /* @__PURE__ */ jsxRuntime.jsx("strong", { style: { fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }, children: title }),
          /* @__PURE__ */ jsxRuntime.jsx("span", { style: { marginLeft: 8, color: chunkCOT43DA6_cjs.theme.textMuted, fontSize: 10 }, children: snapshots.length ? `${selectedIndex + 1} / ${snapshots.length}` : "0 stages" })
        ] }),
        /* @__PURE__ */ jsxRuntime.jsx("div", { role: "listbox", "aria-label": title, style: { flex: 1, minHeight: 0, overflowY: "auto", padding: "6px 0 12px" }, children: snapshots.length === 0 ? /* @__PURE__ */ jsxRuntime.jsx("p", { style: { margin: 0, padding: 14, color: chunkCOT43DA6_cjs.theme.textMuted, fontSize: 12 }, children: error ?? "This recording has no stages to walk." }) : snapshots.map((snapshot, index) => {
          const selected = index === selectedIndex;
          const visited = index < selectedIndex;
          return /* @__PURE__ */ jsxRuntime.jsxs("div", { ref: selected ? focusedRef : void 0, children: [
            /* @__PURE__ */ jsxRuntime.jsxs(
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
                  borderLeft: selected ? `3px solid ${chunkCOT43DA6_cjs.theme.warning}` : "3px solid transparent",
                  background: selected ? `color-mix(in srgb, ${chunkCOT43DA6_cjs.theme.warning} 12%, transparent)` : "transparent",
                  color: selected ? chunkCOT43DA6_cjs.theme.textPrimary : chunkCOT43DA6_cjs.theme.textSecondary,
                  cursor: "pointer",
                  font: "inherit",
                  textAlign: "left"
                },
                children: [
                  /* @__PURE__ */ jsxRuntime.jsx("span", { style: { color: chunkCOT43DA6_cjs.theme.textMuted, fontFamily: chunkCOT43DA6_cjs.theme.fontMono, fontSize: 10, textAlign: "right" }, children: formatOffset(snapshot.startMs) }),
                  /* @__PURE__ */ jsxRuntime.jsx(
                    "span",
                    {
                      "aria-hidden": "true",
                      style: {
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        border: `2px solid ${selected ? chunkCOT43DA6_cjs.theme.warning : visited ? chunkCOT43DA6_cjs.theme.success : chunkCOT43DA6_cjs.theme.border}`,
                        background: selected ? chunkCOT43DA6_cjs.theme.warning : visited ? chunkCOT43DA6_cjs.theme.success : chunkCOT43DA6_cjs.theme.bgSecondary,
                        boxShadow: selected ? `0 0 0 4px color-mix(in srgb, ${chunkCOT43DA6_cjs.theme.warning} 22%, transparent)` : void 0
                      }
                    }
                  ),
                  /* @__PURE__ */ jsxRuntime.jsxs("span", { children: [
                    /* @__PURE__ */ jsxRuntime.jsx("strong", { style: { display: "block", fontSize: 12 }, children: snapshot.stageLabel }),
                    /* @__PURE__ */ jsxRuntime.jsx("small", { style: { color: chunkCOT43DA6_cjs.theme.textMuted, fontFamily: chunkCOT43DA6_cjs.theme.fontMono }, children: snapshot.runtimeStageId ?? snapshot.stageName })
                  ] })
                ]
              }
            ),
            selected && (snapshot.description || renderDetail) ? /* @__PURE__ */ jsxRuntime.jsxs("div", { style: { margin: "0 12px 10px 80px", color: chunkCOT43DA6_cjs.theme.textSecondary, fontSize: 12, lineHeight: 1.5 }, children: [
              snapshot.description ? /* @__PURE__ */ jsxRuntime.jsx("p", { style: { margin: "0 0 8px" }, children: snapshot.description }) : null,
              renderDetail?.(snapshot, index)
            ] }) : null
          ] }, `${snapshot.runtimeStageId ?? snapshot.stageName}-${index}`);
        }) })
      ]
    }
  );
}
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
  const scrubIndex = React2.useMemo(() => {
    const runtimeStageId = snapshots[selectedIndex]?.runtimeStageId;
    if (!runtimeStageId) return selectedIndex;
    const match = runtimeOverlay.executionOrder.findIndex(
      (step) => step.runtimeStageId === runtimeStageId
    );
    return match >= 0 ? match : selectedIndex;
  }, [runtimeOverlay.executionOrder, selectedIndex, snapshots]);
  const handleNodeClick = React2.useCallback(
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
    return /* @__PURE__ */ jsxRuntime.jsx("div", { className, style, "data-fp": "flowchart-panel", children: traceGraph.nodes.map((node) => /* @__PURE__ */ jsxRuntime.jsx("button", { onClick: () => handleNodeClick(node.id), children: String(node.data.label) }, node.id)) });
  }
  return /* @__PURE__ */ jsxRuntime.jsxs(
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
        background: chunkCOT43DA6_cjs.theme.bgPrimary,
        color: chunkCOT43DA6_cjs.theme.textPrimary,
        fontFamily: chunkCOT43DA6_cjs.theme.fontSans,
        ...style
      },
      children: [
        /* @__PURE__ */ jsxRuntime.jsxs("header", { style: { padding: "10px 12px", borderBottom: `1px solid ${chunkCOT43DA6_cjs.theme.border}` }, children: [
          /* @__PURE__ */ jsxRuntime.jsx("strong", { style: { fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }, children: title }),
          /* @__PURE__ */ jsxRuntime.jsxs("span", { style: { marginLeft: 8, color: chunkCOT43DA6_cjs.theme.textMuted, fontSize: 10 }, children: [
            traceGraph.nodes.length,
            " nodes \xB7 click to move the cursor"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntime.jsx("div", { style: { flex: 1, minHeight: 0, overflow: "hidden" }, children: traceGraph.nodes.length ? /* @__PURE__ */ jsxRuntime.jsx(
          LazyTracedFlow,
          {
            graph: traceGraph,
            overlay: runtimeOverlay,
            scrubIndex,
            colors: { ...flowchartColors, ...colors },
            onNodeClick: handleNodeClick
          }
        ) : /* @__PURE__ */ jsxRuntime.jsx("p", { style: { padding: 18, color: chunkCOT43DA6_cjs.theme.textMuted, fontSize: 12 }, children: "This recording carried no structure, so there is no chart to draw." }) })
      ]
    }
  );
}
function ValueInspector({
  title = "Inspect values",
  size = "compact",
  unstyled = false,
  className,
  style
}) {
  const { snapshots, selectedIndex, selectedSnapshot, error } = useExplainableRun();
  if (unstyled) {
    return /* @__PURE__ */ jsxRuntime.jsxs("div", { className, style, "data-fp": "value-inspector", children: [
      /* @__PURE__ */ jsxRuntime.jsx("strong", { children: selectedSnapshot?.stageLabel ?? title }),
      /* @__PURE__ */ jsxRuntime.jsx(MemoryPanel, { snapshots, selectedIndex, unstyled: true })
    ] });
  }
  return /* @__PURE__ */ jsxRuntime.jsxs(
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
        background: chunkCOT43DA6_cjs.theme.bgPrimary,
        color: chunkCOT43DA6_cjs.theme.textPrimary,
        fontFamily: chunkCOT43DA6_cjs.theme.fontSans,
        ...style
      },
      children: [
        /* @__PURE__ */ jsxRuntime.jsxs("header", { style: { padding: "10px 12px", borderBottom: `1px solid ${chunkCOT43DA6_cjs.theme.border}` }, children: [
          /* @__PURE__ */ jsxRuntime.jsx("strong", { style: { display: "block", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }, children: title }),
          selectedSnapshot ? /* @__PURE__ */ jsxRuntime.jsxs("span", { style: { display: "block", marginTop: 4, color: chunkCOT43DA6_cjs.theme.textMuted, fontFamily: chunkCOT43DA6_cjs.theme.fontMono, fontSize: 10 }, children: [
            selectedSnapshot.stageLabel,
            " \xB7 ",
            selectedSnapshot.runtimeStageId ?? selectedSnapshot.stageName
          ] }) : null
        ] }),
        /* @__PURE__ */ jsxRuntime.jsx("div", { style: { flex: 1, minHeight: 0, overflow: "auto" }, children: snapshots.length ? /* @__PURE__ */ jsxRuntime.jsx(MemoryPanel, { snapshots, selectedIndex, size, style: { height: "100%" } }) : /* @__PURE__ */ jsxRuntime.jsx("p", { style: { padding: 14, color: chunkCOT43DA6_cjs.theme.textMuted, fontSize: 12 }, children: error ?? "No values to inspect." }) })
      ]
    }
  );
}
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
  const currentRef = React2.useRef(null);
  const rangeIndex = React2.useMemo(
    () => narrativeEntries.length ? buildEntryRangeIndex(narrativeEntries) : void 0,
    [narrativeEntries]
  );
  const revealedCount = React2.useMemo(
    () => narrativeEntries.length ? computeRevealedEntryCount(
      narrativeEntries,
      snapshots,
      selectedIndex,
      rangeIndex
    ) : 0,
    [narrativeEntries, snapshots, selectedIndex, rangeIndex]
  );
  const dedupedEntries = React2.useMemo(() => {
    const revealed = narrativeEntries.slice(0, revealedCount);
    return revealed.filter(
      (entry, index) => index === 0 || entry.text !== revealed[index - 1]?.text
    );
  }, [narrativeEntries, revealedCount]);
  const visibleEntries = dedupedEntries.slice(
    Math.max(0, dedupedEntries.length - maxLines)
  );
  const hiddenCount = Math.max(0, dedupedEntries.length - visibleEntries.length);
  React2.useEffect(() => {
    currentRef.current?.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
  }, [visibleEntries.length]);
  if (unstyled) {
    return /* @__PURE__ */ jsxRuntime.jsx("div", { className, style, "data-fp": "commentary-panel", role: "log", children: visibleEntries.map((entry, index) => /* @__PURE__ */ jsxRuntime.jsx("div", { children: renderEntry?.(entry, { index, current: index === visibleEntries.length - 1 }) ?? entry.text }, `${entry.runtimeStageId ?? entry.stageId ?? entry.type}-${index}`)) });
  }
  return /* @__PURE__ */ jsxRuntime.jsxs(
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
        background: chunkCOT43DA6_cjs.theme.bgElevated,
        color: chunkCOT43DA6_cjs.theme.textPrimary,
        fontFamily: chunkCOT43DA6_cjs.theme.fontSans,
        ...style
      },
      children: [
        /* @__PURE__ */ jsxRuntime.jsxs("header", { style: { padding: "10px 12px", borderBottom: `1px solid ${chunkCOT43DA6_cjs.theme.border}` }, children: [
          /* @__PURE__ */ jsxRuntime.jsx("strong", { style: { fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }, children: title }),
          /* @__PURE__ */ jsxRuntime.jsxs("span", { style: { marginLeft: 8, color: chunkCOT43DA6_cjs.theme.textMuted, fontSize: 10 }, children: [
            revealedCount,
            " of ",
            narrativeEntries.length,
            " lines"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntime.jsx("div", { role: "log", "aria-live": "polite", style: { flex: 1, minHeight: 0, overflowY: "auto", padding: "6px 12px" }, children: visibleEntries.length === 0 ? /* @__PURE__ */ jsxRuntime.jsx("p", { style: { color: chunkCOT43DA6_cjs.theme.textMuted, fontSize: 12, fontStyle: "italic" }, children: emptyMessage }) : /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
          hiddenCount > 0 ? /* @__PURE__ */ jsxRuntime.jsxs("p", { style: { color: chunkCOT43DA6_cjs.theme.textMuted, fontSize: 11, fontStyle: "italic" }, children: [
            "\u2026 ",
            hiddenCount,
            " earlier lines hidden; scrub backward to revisit them."
          ] }) : null,
          visibleEntries.map((entry, index) => {
            const current = index === visibleEntries.length - 1;
            return /* @__PURE__ */ jsxRuntime.jsxs(
              "div",
              {
                ref: current ? currentRef : void 0,
                "data-current": current,
                style: {
                  display: "grid",
                  gridTemplateColumns: "82px 1fr",
                  gap: 10,
                  padding: "7px 8px",
                  borderBottom: `1px solid ${chunkCOT43DA6_cjs.theme.border}`,
                  borderLeft: current ? `3px solid ${chunkCOT43DA6_cjs.theme.warning}` : "3px solid transparent",
                  background: current ? `color-mix(in srgb, ${chunkCOT43DA6_cjs.theme.warning} 14%, transparent)` : "transparent",
                  color: current ? chunkCOT43DA6_cjs.theme.textPrimary : chunkCOT43DA6_cjs.theme.textSecondary,
                  lineHeight: 1.55
                },
                children: [
                  /* @__PURE__ */ jsxRuntime.jsx("span", { style: { color: current ? chunkCOT43DA6_cjs.theme.warning : chunkCOT43DA6_cjs.theme.textMuted, fontFamily: chunkCOT43DA6_cjs.theme.fontMono, fontSize: 10 }, children: entry.type }),
                  /* @__PURE__ */ jsxRuntime.jsx("div", { style: { fontSize: 12 }, children: renderEntry?.(entry, { index, current }) ?? entry.text })
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
function TimeTravelBar({
  autoPlayable = true,
  size,
  unstyled = false,
  className,
  style
}) {
  const { snapshots, selectedIndex, selectIndex } = useExplainableRun();
  return /* @__PURE__ */ jsxRuntime.jsx(
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
function CompactTimelinePanel({
  defaultExpanded = false,
  unstyled = false,
  className,
  style
}) {
  const { snapshots, selectedIndex, selectIndex } = useExplainableRun();
  if (unstyled) {
    return /* @__PURE__ */ jsxRuntime.jsx("div", { className, "data-fp": "compact-timeline-panel", style, children: snapshots.map((snapshot, index) => /* @__PURE__ */ jsxRuntime.jsx(
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
  return /* @__PURE__ */ jsxRuntime.jsx(
    "section",
    {
      className,
      "data-fp": "compact-timeline-panel",
      style: {
        width: "100%",
        minWidth: 0,
        overflow: "hidden",
        background: chunkCOT43DA6_cjs.theme.bgPrimary,
        color: chunkCOT43DA6_cjs.theme.textPrimary,
        ...style
      },
      children: /* @__PURE__ */ jsxRuntime.jsx(
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
function SurfaceCollapseHandle({
  label: label2 = "Details",
  expanded,
  orientation = "vertical",
  onToggle,
  className,
  style,
  unstyled = false
}) {
  const action = expanded ? "Collapse" : "Expand";
  if (unstyled) {
    return /* @__PURE__ */ jsxRuntime.jsxs(
      "button",
      {
        "aria-expanded": expanded,
        "aria-label": `${action} ${label2.toLowerCase()}`,
        className,
        "data-fp": "surface-collapse-handle",
        onClick: onToggle,
        style,
        type: "button",
        children: [
          action,
          " ",
          label2
        ]
      }
    );
  }
  const vertical = orientation === "vertical";
  return /* @__PURE__ */ jsxRuntime.jsxs(
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
        /* @__PURE__ */ jsxRuntime.jsx(
          "div",
          {
            style: vertical ? { flex: 1, width: 1, background: chunkCOT43DA6_cjs.theme.border } : { flex: 1, height: 1, background: chunkCOT43DA6_cjs.theme.border }
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsxs(
          "button",
          {
            "aria-expanded": expanded,
            "aria-label": `${action} ${label2.toLowerCase()}`,
            onClick: onToggle,
            type: "button",
            style: {
              display: "flex",
              alignItems: "center",
              gap: 4,
              margin: vertical ? "0 3px" : "4px 0",
              padding: vertical ? "10px 4px" : "3px 12px",
              border: `1px solid ${chunkCOT43DA6_cjs.theme.border}`,
              borderRadius: 10,
              background: chunkCOT43DA6_cjs.theme.bgSecondary,
              color: chunkCOT43DA6_cjs.theme.textMuted,
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
              /* @__PURE__ */ jsxRuntime.jsx("span", { style: { fontSize: 7, writingMode: "horizontal-tb" }, children: vertical ? expanded ? "\u25B6" : "\u25C0" : expanded ? "\u25BC" : "\u25B6" }),
              label2
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsx(
          "div",
          {
            style: vertical ? { flex: 1, width: 1, background: chunkCOT43DA6_cjs.theme.border } : { flex: 1, height: 1, background: chunkCOT43DA6_cjs.theme.border }
          }
        )
      ]
    }
  );
}
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
  if (definition.areas.some((row) => row.length !== width)) {
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
  const rootRef = React2__namespace.useRef(null);
  const [isNarrow, setIsNarrow] = React2__namespace.useState(false);
  const [uncontrolledDetailsExpanded, setUncontrolledDetailsExpanded] = React2__namespace.useState(defaultDetailsExpanded);
  const detailsExpanded = controlledDetailsExpanded ?? uncontrolledDetailsExpanded;
  const toggleDetails = () => {
    const nextExpanded = !detailsExpanded;
    if (controlledDetailsExpanded === void 0) {
      setUncontrolledDetailsExpanded(nextExpanded);
    }
    onDetailsExpandedChange?.(nextExpanded);
  };
  React2__namespace.useEffect(() => {
    const element = rootRef.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      setIsNarrow(entry.contentRect.width < 640);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const responsiveDefinition = resolved.definition;
  const responsiveTemplateAreas = responsiveDefinition.areas.map((row) => `"${row.join(" ")}"`).join(" ");
  const renderSurface = (surface) => {
    const fallback = {
      timeTravel: /* @__PURE__ */ jsxRuntime.jsx(TimeTravelBar, { unstyled }),
      timeline: /* @__PURE__ */ jsxRuntime.jsx(CompactTimelinePanel, { unstyled }),
      stageRail: /* @__PURE__ */ jsxRuntime.jsx(TimelinePanel, { unstyled }),
      flowchart: /* @__PURE__ */ jsxRuntime.jsx(FlowchartPanel, { unstyled }),
      inspector: /* @__PURE__ */ jsxRuntime.jsx(ValueInspector, { unstyled }),
      commentary: /* @__PURE__ */ jsxRuntime.jsx(CommentaryPanel, { unstyled })
    }[surface];
    return renderSlot(slots?.[surface], fallback, context);
  };
  if (unstyled) {
    return /* @__PURE__ */ jsxRuntime.jsx("div", { className, style, "data-fp": "explainable-view", "data-layout": resolved.name, children: resolved.surfaces.map((surface) => /* @__PURE__ */ jsxRuntime.jsx("div", { "data-fp-surface": surface, children: renderSurface(surface) }, surface)) });
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
    return /* @__PURE__ */ jsxRuntime.jsxs(
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
          border: `1px solid ${chunkCOT43DA6_cjs.theme.border}`,
          borderRadius: "var(--fp-radius, 8px)",
          background: chunkCOT43DA6_cjs.theme.border,
          ...style
        },
        children: [
          /* @__PURE__ */ jsxRuntime.jsx("div", { "data-fp-surface": "timeTravel", style: { ...surfaceStyle, flex: "0 0 auto" }, children: renderSurface("timeTravel") }),
          /* @__PURE__ */ jsxRuntime.jsxs(
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
                /* @__PURE__ */ jsxRuntime.jsx(
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
                /* @__PURE__ */ jsxRuntime.jsx(
                  SurfaceCollapseHandle,
                  {
                    expanded: detailsExpanded,
                    label: detailsLabel,
                    onToggle: toggleDetails,
                    orientation: isNarrow ? "horizontal" : "vertical"
                  }
                ),
                detailsExpanded ? /* @__PURE__ */ jsxRuntime.jsx(
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
          product ? /* @__PURE__ */ jsxRuntime.jsx(
            "div",
            {
              "data-fp-surface": "commentary",
              style: {
                ...surfaceStyle,
                width: "100%",
                flex: "0 0 34%",
                borderTop: `1px solid ${chunkCOT43DA6_cjs.theme.border}`
              },
              children: renderSurface("commentary")
            }
          ) : /* @__PURE__ */ jsxRuntime.jsx("div", { "data-fp-surface": "timeline", style: { ...surfaceStyle, flex: "0 0 auto" }, children: renderSurface("timeline") })
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxRuntime.jsx(
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
        border: `1px solid ${chunkCOT43DA6_cjs.theme.border}`,
        borderRadius: "var(--fp-radius, 8px)",
        background: chunkCOT43DA6_cjs.theme.border,
        ...style
      },
      children: resolved.surfaces.map((surface) => /* @__PURE__ */ jsxRuntime.jsx(
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
  return /* @__PURE__ */ jsxRuntime.jsx(
    ExplainableProvider,
    {
      recording,
      selectedIndex,
      defaultSelectedIndex,
      onSelectedIndexChange,
      theme: viewTheme,
      children: /* @__PURE__ */ jsxRuntime.jsx(
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

Object.defineProperty(exports, "GanttTimeline", {
  enumerable: true,
  get: function () { return chunk4X66ZS4F_cjs.GanttTimeline; }
});
Object.defineProperty(exports, "MemoryInspector", {
  enumerable: true,
  get: function () { return chunk4X66ZS4F_cjs.MemoryInspector; }
});
Object.defineProperty(exports, "NarrativeLog", {
  enumerable: true,
  get: function () { return chunk4X66ZS4F_cjs.NarrativeLog; }
});
Object.defineProperty(exports, "SubflowTree", {
  enumerable: true,
  get: function () { return chunk4X66ZS4F_cjs.SubflowTree; }
});
Object.defineProperty(exports, "graphFromStructure", {
  enumerable: true,
  get: function () { return chunk4X66ZS4F_cjs.graphFromStructure; }
});
Object.defineProperty(exports, "overlayFromSnapshot", {
  enumerable: true,
  get: function () { return chunk4X66ZS4F_cjs.overlayFromSnapshot; }
});
Object.defineProperty(exports, "FootprintTheme", {
  enumerable: true,
  get: function () { return chunkG4GT73OY_cjs.FootprintTheme; }
});
Object.defineProperty(exports, "coolDark", {
  enumerable: true,
  get: function () { return chunkG4GT73OY_cjs.coolDark; }
});
Object.defineProperty(exports, "coolLight", {
  enumerable: true,
  get: function () { return chunkG4GT73OY_cjs.coolLight; }
});
Object.defineProperty(exports, "defaultTokens", {
  enumerable: true,
  get: function () { return chunkG4GT73OY_cjs.defaultTokens; }
});
Object.defineProperty(exports, "rawDefaults", {
  enumerable: true,
  get: function () { return chunkG4GT73OY_cjs.rawDefaults; }
});
Object.defineProperty(exports, "themeModeVars", {
  enumerable: true,
  get: function () { return chunkG4GT73OY_cjs.themeModeVars; }
});
Object.defineProperty(exports, "themePresets", {
  enumerable: true,
  get: function () { return chunkG4GT73OY_cjs.themePresets; }
});
Object.defineProperty(exports, "tokensToCSSVars", {
  enumerable: true,
  get: function () { return chunkG4GT73OY_cjs.tokensToCSSVars; }
});
Object.defineProperty(exports, "useDarkModeTokens", {
  enumerable: true,
  get: function () { return chunkG4GT73OY_cjs.useDarkModeTokens; }
});
Object.defineProperty(exports, "useFootprintTheme", {
  enumerable: true,
  get: function () { return chunkG4GT73OY_cjs.useFootprintTheme; }
});
Object.defineProperty(exports, "warmDark", {
  enumerable: true,
  get: function () { return chunkG4GT73OY_cjs.warmDark; }
});
Object.defineProperty(exports, "warmLight", {
  enumerable: true,
  get: function () { return chunkG4GT73OY_cjs.warmLight; }
});
exports.CommentaryPanel = CommentaryPanel;
exports.CompactTimeline = CompactTimeline;
exports.CompactTimelinePanel = CompactTimelinePanel;
exports.DEFAULT_EXCLUDED_KEYS = DEFAULT_EXCLUDED_KEYS;
exports.DataTracePanel = DataTracePanel;
exports.ExplainableProvider = ExplainableProvider;
exports.ExplainableShell = ExplainableShell;
exports.ExplainableView = ExplainableView;
exports.FlowchartPanel = FlowchartPanel;
exports.InsightPanel = InsightPanel;
exports.InspectorPanel = InspectorPanel;
exports.MemoryPanel = MemoryPanel;
exports.NarrativePanel = NarrativePanel;
exports.NarrativeTrace = NarrativeTrace;
exports.ResultPanel = ResultPanel;
exports.ScopeDiff = ScopeDiff;
exports.SnapshotPanel = SnapshotPanel;
exports.StageDetailPanel = StageDetailPanel;
exports.StoryNarrative = StoryNarrative;
exports.SurfaceCollapseHandle = SurfaceCollapseHandle;
exports.TimeTravelBar = TimeTravelBar;
exports.TimeTravelControls = TimeTravelControls;
exports.TimelinePanel = TimelinePanel;
exports.TraceViewer = TraceViewer;
exports.TraceWalkCard = TraceWalkCard;
exports.ValueInspector = ValueInspector;
exports.buildEntryRangeIndex = buildEntryRangeIndex;
exports.buildTraceWalk = buildTraceWalk;
exports.computeRevealedEntryCount = computeRevealedEntryCount;
exports.createSnapshots = createSnapshots;
exports.extractSubflowNarrative = extractSubflowNarrative;
exports.formatTraceWalk = formatTraceWalk;
exports.mergeWritePatch = mergeWritePatch;
exports.narrativeFromSnapshot = narrativeFromSnapshot;
exports.subflowResultToSnapshots = subflowResultToSnapshots;
exports.toVisualizationSnapshots = toVisualizationSnapshots;
exports.useExplainableRun = useExplainableRun;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map