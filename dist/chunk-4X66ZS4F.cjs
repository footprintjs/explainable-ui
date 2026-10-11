'use strict';

var chunkDGKL4TUX_cjs = require('./chunk-DGKL4TUX.cjs');
var chunkG4GT73OY_cjs = require('./chunk-G4GT73OY.cjs');
var chunkCOT43DA6_cjs = require('./chunk-COT43DA6.cjs');
var react = require('react');
var jsxRuntime = require('react/jsx-runtime');
var foottrace = require('foottrace');

function recordStateDisplay(snapshot, previous) {
  const evidence = snapshot?.recordState;
  if (!evidence) {
    return {
      memory: snapshot?.memory ?? {},
      previous: previous?.memory ?? null,
      canCompare: true,
      notices: []
    };
  }
  if (evidence.status === "unavailable") {
    return {
      memory: null,
      previous: null,
      canCompare: false,
      notices: [`Recorded state unavailable: ${evidence.message}`]
    };
  }
  const notices = [];
  for (const [label, state] of [
    ["Selected state", evidence.current],
    ["Previous recorded state", evidence.previous]
  ]) {
    if (state.basis === "log-only")
      notices.push(
        `${label}: recorded writes only; the initial state was not recorded.`
      );
    if (state.redacted || state.redactedPaths.length)
      notices.push(
        `${label}: redacted values are withheld${state.redactedPaths.length ? ` (${state.redactedPaths.join(", ")})` : ""}.`
      );
    for (const gap of state.skipped ?? [])
      notices.push(`${label}: skipped record row ${gap.index}: ${gap.reason}`);
  }
  const complete = (state) => state.basis === "initial+log" && !state.redacted && !state.redactedPaths.length && !state.skipped?.length;
  const canCompare = complete(evidence.current) && complete(evidence.previous);
  if (!canCompare)
    notices.push(
      "Changes are not classified because one or both recorded states are incomplete."
    );
  return {
    memory: evidence.current.state,
    previous: evidence.previous.state,
    canCompare,
    notices
  };
}
function RecordStateNotice({
  view
}) {
  if (!view.notices.length) return null;
  return /* @__PURE__ */ jsxRuntime.jsx("div", { "data-fp": "record-state-evidence", role: "note", children: view.notices.map((notice) => /* @__PURE__ */ jsxRuntime.jsx("p", { children: notice }, notice)) });
}
function isJsonData(value, ancestors = /* @__PURE__ */ new Set()) {
  if (value === null || typeof value === "string" || typeof value === "boolean")
    return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value !== "object") return false;
  const proto = Object.getPrototypeOf(value);
  if (!Array.isArray(value) && proto !== Object.prototype && proto !== null || "toJSON" in value || ancestors.has(value))
    return false;
  ancestors.add(value);
  try {
    for (const key of Object.keys(value)) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !("value" in descriptor) || !isJsonData(descriptor.value, ancestors))
        return false;
    }
    return true;
  } finally {
    ancestors.delete(value);
  }
}
function jsonText(value, indent) {
  try {
    return isJsonData(value) ? JSON.stringify(value, null, indent) : void 0;
  } catch {
    return void 0;
  }
}
function displayValue(value, indent) {
  if (typeof value === "string") return `"${value}"`;
  if (value === null || typeof value !== "object")
    return typeof value === "bigint" ? chunkDGKL4TUX_cjs.previewValue(value) : String(value);
  return jsonText(value, indent) ?? chunkDGKL4TUX_cjs.previewValue(value);
}
function displayValuesEqual(a, b) {
  const aJson = jsonText(a), bJson = jsonText(b);
  return aJson !== void 0 && bJson !== void 0 ? aJson === bJson : foottrace.deepEqual(a, b);
}
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
  const { view, newKeys } = react.useMemo(() => {
    if (data) {
      return {
        view: { memory: data, previous: null, canCompare: true, notices: [] },
        newKeys: /* @__PURE__ */ new Set()
      };
    }
    if (!snapshots || snapshots.length === 0) {
      return { view: recordStateDisplay(), newKeys: /* @__PURE__ */ new Set() };
    }
    const safeIdx = Math.max(0, Math.min(selectedIndex, snapshots.length - 1));
    const view2 = recordStateDisplay(snapshots[safeIdx], snapshots[safeIdx - 1]);
    const nk = /* @__PURE__ */ new Set();
    if (highlightNew && view2.canCompare && view2.memory) {
      const prev = view2.previous ?? {};
      for (const k of Object.keys(view2.memory)) {
        if (!(k in prev)) nk.add(k);
      }
    }
    return { view: view2, newKeys: nk };
  }, [data, snapshots, selectedIndex, highlightNew]);
  const memory = view.memory;
  const entries = Object.entries(memory ?? {});
  const fs = chunkCOT43DA6_cjs.fontSize[size];
  const pad = chunkCOT43DA6_cjs.padding[size];
  if (unstyled) {
    return /* @__PURE__ */ jsxRuntime.jsxs(
      "div",
      {
        className,
        style,
        "data-fp": "memory-inspector",
        role: "region",
        "aria-label": "Memory state",
        children: [
          /* @__PURE__ */ jsxRuntime.jsx("div", { "data-fp": "memory-label", children: "Memory State" }),
          /* @__PURE__ */ jsxRuntime.jsx(RecordStateNotice, { view }),
          memory !== null && /* @__PURE__ */ jsxRuntime.jsx("pre", { "data-fp": "memory-json", children: /* @__PURE__ */ jsxRuntime.jsx("code", { children: displayValue(memory, 2) }) })
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "div",
    {
      className,
      style: {
        padding: pad,
        fontFamily: chunkCOT43DA6_cjs.theme.fontSans,
        ...style
      },
      "data-fp": "memory-inspector",
      role: "region",
      "aria-label": "Memory state",
      children: [
        /* @__PURE__ */ jsxRuntime.jsx(
          "span",
          {
            style: {
              fontSize: fs.label,
              fontWeight: 600,
              color: chunkCOT43DA6_cjs.theme.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.08em"
            },
            children: "Memory State"
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsx(RecordStateNotice, { view }),
        memory !== null && /* @__PURE__ */ jsxRuntime.jsxs(
          "div",
          {
            style: {
              marginTop: 8,
              background: chunkCOT43DA6_cjs.theme.bgSecondary,
              border: `1px solid ${chunkCOT43DA6_cjs.theme.border}`,
              borderRadius: chunkCOT43DA6_cjs.theme.radius,
              padding: `${pad}px ${pad + 4}px`,
              fontFamily: chunkCOT43DA6_cjs.theme.fontMono,
              fontSize: fs.body,
              lineHeight: 1.8
            },
            children: [
              /* @__PURE__ */ jsxRuntime.jsx("span", { style: { color: chunkCOT43DA6_cjs.theme.textMuted }, children: "{" }),
              entries.length === 0 && /* @__PURE__ */ jsxRuntime.jsx(
                "div",
                {
                  style: {
                    paddingLeft: 16,
                    color: chunkCOT43DA6_cjs.theme.textMuted,
                    fontStyle: "italic"
                  },
                  children: view.canCompare ? "// empty" : "// no values in the available recorded state"
                }
              ),
              entries.map(([key, value], i) => {
                const isNew = newKeys.has(key);
                const isLast = i === entries.length - 1;
                return /* @__PURE__ */ jsxRuntime.jsxs(
                  "div",
                  {
                    style: {
                      paddingLeft: 16,
                      background: isNew ? `color-mix(in srgb, ${chunkCOT43DA6_cjs.theme.success} 10%, transparent)` : "transparent",
                      borderRadius: 4,
                      marginLeft: -4,
                      marginRight: -4,
                      paddingRight: 4
                    },
                    children: [
                      /* @__PURE__ */ jsxRuntime.jsxs("span", { style: { color: chunkCOT43DA6_cjs.theme.primary }, children: [
                        '"',
                        key,
                        '"'
                      ] }),
                      /* @__PURE__ */ jsxRuntime.jsx("span", { style: { color: chunkCOT43DA6_cjs.theme.textMuted }, children: ": " }),
                      /* @__PURE__ */ jsxRuntime.jsx("span", { style: { color: chunkCOT43DA6_cjs.theme.success }, children: displayValue(value) }),
                      showTypes && /* @__PURE__ */ jsxRuntime.jsxs(
                        "span",
                        {
                          style: {
                            color: chunkCOT43DA6_cjs.theme.textMuted,
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
                      !isLast && /* @__PURE__ */ jsxRuntime.jsx("span", { style: { color: chunkCOT43DA6_cjs.theme.textMuted }, children: "," })
                    ]
                  },
                  key
                );
              }),
              /* @__PURE__ */ jsxRuntime.jsx("span", { style: { color: chunkCOT43DA6_cjs.theme.textMuted }, children: "}" })
            ]
          }
        )
      ]
    }
  );
}
function NarrativeLog({
  snapshots,
  selectedIndex,
  narrative,
  size = "default",
  unstyled = false,
  className,
  style
}) {
  const entries = react.useMemo(() => {
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
  const fs = chunkCOT43DA6_cjs.fontSize[size];
  const pad = chunkCOT43DA6_cjs.padding[size];
  if (unstyled) {
    return /* @__PURE__ */ jsxRuntime.jsx("div", { className, style, "data-fp": "narrative-log", children: entries.map((entry, i) => /* @__PURE__ */ jsxRuntime.jsxs("div", { "data-fp": "narrative-entry", "data-current": entry.isCurrent, children: [
      /* @__PURE__ */ jsxRuntime.jsx("strong", { children: entry.label }),
      /* @__PURE__ */ jsxRuntime.jsx("p", { children: entry.text })
    ] }, i)) });
  }
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "div",
    {
      className,
      style: { padding: pad, fontFamily: chunkCOT43DA6_cjs.theme.fontSans, ...style },
      "data-fp": "narrative-log",
      children: [
        /* @__PURE__ */ jsxRuntime.jsx(
          "span",
          {
            style: {
              fontSize: fs.label,
              fontWeight: 600,
              color: chunkCOT43DA6_cjs.theme.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.08em"
            },
            children: "Execution Log"
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsx("div", { style: { marginTop: 8, display: "flex", flexDirection: "column" }, children: entries.map((entry, i) => /* @__PURE__ */ jsxRuntime.jsxs(
          "div",
          {
            style: {
              display: "flex",
              gap: 10,
              padding: `${pad}px 0`,
              borderBottom: i < entries.length - 1 ? `1px solid ${chunkCOT43DA6_cjs.theme.border}` : "none"
            },
            children: [
              /* @__PURE__ */ jsxRuntime.jsxs(
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
                    /* @__PURE__ */ jsxRuntime.jsx(
                      "div",
                      {
                        style: {
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: entry.isCurrent ? chunkCOT43DA6_cjs.theme.primary : chunkCOT43DA6_cjs.theme.success,
                          flexShrink: 0
                        }
                      }
                    ),
                    i < entries.length - 1 && /* @__PURE__ */ jsxRuntime.jsx(
                      "div",
                      {
                        style: {
                          width: 1,
                          flex: 1,
                          background: chunkCOT43DA6_cjs.theme.border,
                          marginTop: 4
                        }
                      }
                    )
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntime.jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
                /* @__PURE__ */ jsxRuntime.jsx(
                  "span",
                  {
                    style: {
                      fontSize: fs.label,
                      fontWeight: 600,
                      color: entry.isCurrent ? chunkCOT43DA6_cjs.theme.primary : chunkCOT43DA6_cjs.theme.textMuted
                    },
                    children: entry.label
                  }
                ),
                /* @__PURE__ */ jsxRuntime.jsx(
                  "div",
                  {
                    style: {
                      fontSize: fs.body,
                      lineHeight: 1.5,
                      color: entry.isCurrent ? chunkCOT43DA6_cjs.theme.textPrimary : chunkCOT43DA6_cjs.theme.textSecondary,
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
  const [expanded, setExpanded] = react.useState(false);
  const activeRowRef = react.useRef(null);
  const scrollContainerRef = react.useRef(null);
  const totalWallTime = react.useMemo(
    () => Math.max(...snapshots.map((s) => s.startMs + s.durationMs), 1),
    [snapshots]
  );
  const untimed = react.useMemo(
    () => snapshots.length > 0 && snapshots.every((s) => s.durationMs === 0),
    [snapshots]
  );
  const rowDuration = (snap) => untimed ? NO_DURATION : `${snap.durationMs}ms`;
  const rowLabel = (snap, idx) => untimed ? `${snap.stageLabel}, step ${idx + 1} of ${snapshots.length}, no timing recorded` : `${snap.stageLabel}, ${snap.durationMs}ms`;
  const barGeometry = (snap, idx) => untimed ? { leftPct: idx / snapshots.length * 100, widthPct: 100 / snapshots.length } : {
    leftPct: snap.startMs / totalWallTime * 100,
    widthPct: Math.max(snap.durationMs / totalWallTime * 100, 1)
  };
  const fs = chunkCOT43DA6_cjs.fontSize[size];
  const pad = chunkCOT43DA6_cjs.padding[size];
  const labelWidth = size === "compact" ? 50 : size === "detailed" ? 100 : 80;
  const msWidth = size === "compact" ? 28 : 36;
  const rowHeight = size === "compact" ? 18 : 22;
  const collapsible = maxVisibleRows > 0 && snapshots.length > maxVisibleRows;
  const showAll = expanded || !collapsible;
  react.useEffect(() => {
    if (!showAll && activeRowRef.current && scrollContainerRef.current) {
      activeRowRef.current.scrollIntoView({
        block: "nearest",
        behavior: "smooth"
      });
    }
  }, [selectedIndex, showAll]);
  if (unstyled) {
    return /* @__PURE__ */ jsxRuntime.jsxs(
      "div",
      {
        className,
        style,
        "data-fp": "gantt-timeline",
        "data-timing": untimed ? "none" : void 0,
        role: "listbox",
        "aria-label": "Execution timeline",
        children: [
          snapshots.map((snap, idx) => /* @__PURE__ */ jsxRuntime.jsxs(
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
                /* @__PURE__ */ jsxRuntime.jsx("span", { "data-fp": "gantt-label", children: snap.stageLabel }),
                /* @__PURE__ */ jsxRuntime.jsx("span", { "data-fp": "gantt-duration", children: rowDuration(snap) })
              ]
            },
            `${snap.stageName}-${idx}`
          )),
          untimed && /* @__PURE__ */ jsxRuntime.jsx("div", { "data-fp": "gantt-no-timing", title: NO_TIMING_HINT, children: NO_TIMING_NOTE })
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "div",
    {
      className,
      style: { ...chunkG4GT73OY_cjs.themeModeVars(themeMode), padding: pad, fontFamily: chunkCOT43DA6_cjs.theme.fontSans, ...style },
      "data-fp": "gantt-timeline",
      "data-timing": untimed ? "none" : void 0,
      children: [
        /* @__PURE__ */ jsxRuntime.jsxs(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            },
            children: [
              /* @__PURE__ */ jsxRuntime.jsx(
                "span",
                {
                  style: {
                    fontSize: fs.label,
                    fontWeight: 600,
                    color: chunkCOT43DA6_cjs.theme.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em"
                  },
                  children: size === "compact" ? "Timeline" : "Execution Timeline"
                }
              ),
              collapsible && /* @__PURE__ */ jsxRuntime.jsx(
                "button",
                {
                  onClick: () => setExpanded((e) => !e),
                  style: {
                    background: "none",
                    border: `1px solid ${chunkCOT43DA6_cjs.theme.border}`,
                    borderRadius: 4,
                    color: chunkCOT43DA6_cjs.theme.textSecondary,
                    fontSize: fs.small,
                    padding: "2px 8px",
                    cursor: "pointer",
                    fontFamily: chunkCOT43DA6_cjs.theme.fontSans
                  },
                  children: expanded ? "Collapse" : `${snapshots.length - maxVisibleRows} more...`
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsx(
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
              return /* @__PURE__ */ jsxRuntime.jsxs(
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
                    /* @__PURE__ */ jsxRuntime.jsx(
                      "span",
                      {
                        title: snap.stageLabel,
                        style: {
                          width: labelWidth,
                          fontSize: fs.small,
                          color: isSelected ? chunkCOT43DA6_cjs.theme.primary : chunkCOT43DA6_cjs.theme.textMuted,
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
                    /* @__PURE__ */ jsxRuntime.jsx(
                      "div",
                      {
                        style: {
                          flex: 1,
                          height: size === "compact" ? 6 : 8,
                          position: "relative",
                          background: chunkCOT43DA6_cjs.theme.bgTertiary,
                          borderRadius: 3
                        },
                        children: isVisible && /* @__PURE__ */ jsxRuntime.jsx(
                          "div",
                          {
                            style: {
                              position: "absolute",
                              left: `${leftPct}%`,
                              top: 0,
                              width: `${widthPct}%`,
                              height: "100%",
                              borderRadius: 3,
                              background: isSelected ? chunkCOT43DA6_cjs.theme.primary : chunkCOT43DA6_cjs.theme.success,
                              transition: "width 0.3s ease"
                            }
                          }
                        )
                      }
                    ),
                    /* @__PURE__ */ jsxRuntime.jsx(
                      "span",
                      {
                        style: {
                          fontSize: fs.small,
                          color: chunkCOT43DA6_cjs.theme.textMuted,
                          fontFamily: chunkCOT43DA6_cjs.theme.fontMono,
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
        untimed ? /* @__PURE__ */ jsxRuntime.jsx(
          "div",
          {
            "data-fp": "gantt-no-timing",
            title: NO_TIMING_HINT,
            style: {
              marginTop: 6,
              fontSize: fs.small,
              color: chunkCOT43DA6_cjs.theme.textMuted,
              fontStyle: "italic",
              lineHeight: 1.4
            },
            children: NO_TIMING_NOTE
          }
        ) : /* @__PURE__ */ jsxRuntime.jsxs(
          "div",
          {
            style: {
              marginTop: 4,
              marginLeft: labelWidth + (size === "compact" ? 4 : 8),
              marginRight: msWidth + (size === "compact" ? 4 : 8),
              display: "flex",
              justifyContent: "space-between",
              fontSize: fs.small - 1,
              color: chunkCOT43DA6_cjs.theme.textMuted,
              fontFamily: chunkCOT43DA6_cjs.theme.fontMono
            },
            children: [
              /* @__PURE__ */ jsxRuntime.jsx("span", { children: "0ms" }),
              size !== "compact" && /* @__PURE__ */ jsxRuntime.jsxs("span", { children: [
                (totalWallTime / 2).toFixed(1),
                "ms"
              ] }),
              /* @__PURE__ */ jsxRuntime.jsxs("span", { children: [
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
    retryAttempts: retryAttemptsFrom(options.narrativeEntries)
  };
}
function retryAttemptsFrom(entries) {
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
var TreeNode = react.memo(function TreeNode2({
  entry,
  depth,
  activeStage,
  doneStages,
  onNodeSelect
}) {
  const [expanded, setExpanded] = react.useState(true);
  const hasChildren = entry.children && entry.children.length > 0;
  const isActive = activeStage === entry.name;
  const isDone = doneStages?.has(entry.name);
  const handleClick = react.useCallback(() => {
    if (hasChildren) {
      setExpanded((prev) => !prev);
    }
    onNodeSelect?.(entry.name, !!entry.isSubflow, entry.nodeId);
  }, [hasChildren, onNodeSelect, entry.name, entry.isSubflow, entry.nodeId]);
  return /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
    /* @__PURE__ */ jsxRuntime.jsxs(
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
          background: isActive ? `color-mix(in srgb, ${chunkCOT43DA6_cjs.theme.primary} 15%, transparent)` : "transparent",
          cursor: "pointer",
          padding: `4px 8px 4px ${8 + depth * 16}px`,
          fontFamily: chunkCOT43DA6_cjs.theme.fontSans,
          fontSize: 12,
          textAlign: "left",
          borderRadius: 4,
          transition: "background 0.15s"
        },
        onMouseEnter: (e) => {
          if (!isActive) {
            e.currentTarget.style.background = `color-mix(in srgb, ${chunkCOT43DA6_cjs.theme.textMuted} 10%, transparent)`;
          }
        },
        onMouseLeave: (e) => {
          if (!isActive) {
            e.currentTarget.style.background = "transparent";
          }
        },
        children: [
          hasChildren ? /* @__PURE__ */ jsxRuntime.jsx(
            "span",
            {
              style: {
                fontSize: 10,
                color: chunkCOT43DA6_cjs.theme.textMuted,
                width: 12,
                textAlign: "center",
                flexShrink: 0,
                transition: "transform 0.15s",
                transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
                display: "inline-block"
              },
              children: "\u25B6"
            }
          ) : /* @__PURE__ */ jsxRuntime.jsx("span", { style: { width: 12, flexShrink: 0 } }),
          /* @__PURE__ */ jsxRuntime.jsx(
            "span",
            {
              style: {
                width: 6,
                height: 6,
                borderRadius: "50%",
                flexShrink: 0,
                background: isActive ? chunkCOT43DA6_cjs.theme.primary : isDone ? chunkCOT43DA6_cjs.theme.success : chunkCOT43DA6_cjs.theme.border
              }
            }
          ),
          /* @__PURE__ */ jsxRuntime.jsxs("span", { style: { display: "flex", flexDirection: "column", minWidth: 0 }, children: [
            /* @__PURE__ */ jsxRuntime.jsxs(
              "span",
              {
                style: {
                  color: isActive ? chunkCOT43DA6_cjs.theme.primary : isDone ? chunkCOT43DA6_cjs.theme.textPrimary : chunkCOT43DA6_cjs.theme.textSecondary,
                  fontWeight: isActive ? 600 : entry.isSubflow ? 500 : 400,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                },
                children: [
                  entry.name,
                  entry.isSubflow && /* @__PURE__ */ jsxRuntime.jsx("span", { style: { opacity: 0.5, marginLeft: 4, fontSize: 10 }, children: "\u229E" })
                ]
              }
            ),
            entry.description && /* @__PURE__ */ jsxRuntime.jsx(
              "span",
              {
                style: {
                  color: chunkCOT43DA6_cjs.theme.textMuted,
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
    hasChildren && expanded && /* @__PURE__ */ jsxRuntime.jsx("div", { children: entry.children.map((child, i) => /* @__PURE__ */ jsxRuntime.jsx(
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
var SectionLabel = react.memo(function SectionLabel2({ children }) {
  return /* @__PURE__ */ jsxRuntime.jsx(
    "div",
    {
      style: {
        padding: "4px 12px 8px",
        fontSize: 10,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        color: chunkCOT43DA6_cjs.theme.textMuted
      },
      children
    }
  );
});
var SubflowTree = react.memo(function SubflowTree2({
  graph,
  activeStage,
  doneStages,
  onNodeSelect,
  unstyled = false,
  className,
  style
}) {
  const subflowStages = react.useMemo(() => graphToSubflowEntries(graph), [graph]);
  if (subflowStages.length === 0) return null;
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "div",
    {
      className,
      "data-fp": "subflow-tree",
      style: {
        ...unstyled ? {} : {
          fontFamily: chunkCOT43DA6_cjs.theme.fontSans,
          fontSize: 12,
          background: chunkCOT43DA6_cjs.theme.bgPrimary,
          borderRight: `1px solid ${chunkCOT43DA6_cjs.theme.border}`,
          overflowY: "auto",
          overflowX: "hidden",
          padding: "8px 0"
        },
        ...style
      },
      children: [
        !unstyled && /* @__PURE__ */ jsxRuntime.jsx(SectionLabel, { children: "Subflows" }),
        subflowStages.map((entry, i) => /* @__PURE__ */ jsxRuntime.jsx(
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

// src/_internal/deprecate.ts
var announced = /* @__PURE__ */ new Set();
function warnDeprecated(what, useInstead) {
  if (announced.has(what)) return;
  announced.add(what);
  chunkG4GT73OY_cjs.devWarn(
    () => `[footprint-explainable-ui] ${what} is deprecated and will be removed in the next major. ${useInstead}`
  );
}
var SubflowBreadcrumb = react.memo(function SubflowBreadcrumb2({
  breadcrumbs,
  onNavigate
}) {
  warnDeprecated(
    "SubflowBreadcrumb",
    "It renders the legacy useSubflowNavigation stack. Use <TracedFlow> (which draws its own trail), or buildSubflowBreadcrumb(graph, mountNodeId)."
  );
  if (breadcrumbs.length <= 1) return null;
  return /* @__PURE__ */ jsxRuntime.jsx(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "6px 12px",
        background: chunkCOT43DA6_cjs.theme.bgSecondary,
        borderBottom: `1px solid ${chunkCOT43DA6_cjs.theme.border}`,
        fontSize: 12,
        fontFamily: chunkCOT43DA6_cjs.theme.fontSans,
        flexShrink: 0,
        overflowX: "auto"
      },
      children: breadcrumbs.map((crumb, i) => {
        const isLast = i === breadcrumbs.length - 1;
        return /* @__PURE__ */ jsxRuntime.jsxs("span", { style: { display: "flex", alignItems: "center", gap: 4 }, children: [
          i > 0 && /* @__PURE__ */ jsxRuntime.jsx("span", { style: { color: chunkCOT43DA6_cjs.theme.textMuted, fontSize: 10 }, children: "\u203A" }),
          isLast ? /* @__PURE__ */ jsxRuntime.jsxs("span", { style: { display: "flex", alignItems: "center", gap: 6 }, children: [
            /* @__PURE__ */ jsxRuntime.jsx(
              "span",
              {
                style: {
                  color: chunkCOT43DA6_cjs.theme.primary,
                  fontWeight: 600
                },
                children: crumb.label
              }
            ),
            crumb.description && /* @__PURE__ */ jsxRuntime.jsxs(
              "span",
              {
                style: {
                  color: chunkCOT43DA6_cjs.theme.textMuted,
                  fontWeight: 400,
                  fontSize: 11
                },
                children: [
                  "\u2014 ",
                  crumb.description
                ]
              }
            )
          ] }) : /* @__PURE__ */ jsxRuntime.jsx(
            "button",
            {
              onClick: () => onNavigate(i),
              style: {
                background: "none",
                border: "none",
                color: chunkCOT43DA6_cjs.theme.textSecondary,
                cursor: "pointer",
                padding: "2px 4px",
                borderRadius: 4,
                fontSize: 12,
                fontFamily: "inherit",
                fontWeight: 500,
                transition: "color 0.15s"
              },
              onMouseEnter: (e) => {
                e.currentTarget.style.color = `${chunkCOT43DA6_cjs.theme.primary}`;
              },
              onMouseLeave: (e) => {
                e.currentTarget.style.color = `${chunkCOT43DA6_cjs.theme.textSecondary}`;
              },
              children: crumb.label
            }
          )
        ] }, `${crumb.label}-${i}`);
      })
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
  const notifier = chunkG4GT73OY_cjs.createNotifier("traceStructureRecorder");
  function notifyChange() {
    if (onChange) {
      try {
        onChange({ nodes, edges });
      } catch (err) {
        chunkG4GT73OY_cjs.devWarn(
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
        chunkG4GT73OY_cjs.devWarn(
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

exports.GanttTimeline = GanttTimeline;
exports.MemoryInspector = MemoryInspector;
exports.NarrativeLog = NarrativeLog;
exports.RecordStateNotice = RecordStateNotice;
exports.SubflowBreadcrumb = SubflowBreadcrumb;
exports.SubflowTree = SubflowTree;
exports.asRuntimeStageId = asRuntimeStageId;
exports.asStageId = asStageId;
exports.createTraceStructureRecorder = createTraceStructureRecorder;
exports.displayValue = displayValue;
exports.displayValuesEqual = displayValuesEqual;
exports.graphFromStructure = graphFromStructure;
exports.overlayFromSnapshot = overlayFromSnapshot;
exports.recordStateDisplay = recordStateDisplay;
exports.warnDeprecated = warnDeprecated;
//# sourceMappingURL=chunk-4X66ZS4F.cjs.map
//# sourceMappingURL=chunk-4X66ZS4F.cjs.map