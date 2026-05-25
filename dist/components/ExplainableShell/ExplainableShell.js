import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * ExplainableShell — Pure orchestrator for explainable pipeline visualization.
 *
 * Collapsible sections use the **line + centered pill** pattern:
 * - Collapsed = thin divider line with a pill button sitting on it
 * - Expanded = full content with a pill at the closing edge
 *
 * Sub-components are memo'd to minimize re-renders when scrubbing the
 * time-travel slider. Only components that depend on snapshotIdx re-render.
 *
 * Consumer controls theme via --fp-* CSS custom properties.
 */
import { memo, useState, useCallback, useMemo, useRef, useEffect } from "react";
import { theme } from "../../theme";
import { extractSubflowNarrative } from "../../utils/narrativeSync";
import { toVisualizationSnapshots, subflowResultToSnapshots } from "../../adapters/fromRuntimeSnapshot";
import { ResultPanel } from "../ResultPanel";
import { GanttTimeline } from "../GanttTimeline";
import { TimeTravelControls } from "../TimeTravelControls";
import { MemoryPanel } from "../MemoryPanel";
import { NarrativePanel } from "../NarrativePanel";
import { SubflowTree } from "../FlowchartView/SubflowTree";
import { SubflowBreadcrumb } from "../FlowchartView/SubflowBreadcrumb";
import { TracedFlow } from "../FlowchartView/TracedFlow";
import { InspectorPanel } from "../InspectorPanel/InspectorPanel";
import { InsightPanel } from "../InsightPanel/InsightPanel";
import { CompactTimeline } from "../CompactTimeline/CompactTimeline";
// ---------------------------------------------------------------------------
// Line + Pill — collapsed state is just a line with a pill centered on it
// ---------------------------------------------------------------------------
/** Horizontal line with centered pill (for top/bottom edges) */
const HLinePill = memo(function HLinePill({ label, detail, expanded, onClick, }) {
    return (_jsxs("div", { style: {
            display: "flex",
            alignItems: "center",
            gap: 0,
            padding: "0",
        }, children: [_jsx("div", { style: { flex: 1, height: 1, background: theme.border } }), _jsxs("button", { onClick: onClick, style: {
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
                    transition: "color 0.15s ease",
                }, children: [_jsx("span", { style: { fontSize: 7 }, children: expanded ? "▼" : "▶" }), label, detail && _jsx("span", { style: { fontWeight: 400, opacity: 0.5, fontSize: 9 }, children: detail })] }), _jsx("div", { style: { flex: 1, height: 1, background: theme.border } })] }));
});
/** Vertical line with centered pill (for left/right edges).
 *  `side` controls arrow direction:
 *  - "right": expanded=▶ collapsed=◀ (panel is on right, collapses right)
 *  - "left":  expanded=◀ collapsed=▶ (panel is on left, collapses left)
 */
const VLinePill = memo(function VLinePill({ label, expanded, side = "right", onClick, }) {
    const arrow = side === "right"
        ? (expanded ? "▶" : "◀")
        : (expanded ? "◀" : "▶");
    return (_jsxs("div", { style: {
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0,
            padding: "0",
        }, children: [_jsx("div", { style: { flex: 1, width: 1, background: theme.border } }), _jsxs("button", { onClick: onClick, style: {
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
                    transition: "color 0.15s ease",
                }, children: [_jsx("span", { style: { fontSize: 7, writingMode: "horizontal-tb" }, children: arrow }), label] }), _jsx("div", { style: { flex: 1, width: 1, background: theme.border } })] }));
});
// ---------------------------------------------------------------------------
// KeyedRecorderView — Time-travel aware renderer for auto-detected recorders
// ---------------------------------------------------------------------------
/**
 * Detects if data has a keyed-recorder shape: an object property whose values
 * are objects with at least one numeric field. Returns { steps, keyType }.
 * keyType: 'runtimeStageId' (keys contain '#') or 'stageName' (plain names).
 */
function detectKeyedSteps(data) {
    if (!data || typeof data !== "object")
        return null;
    const obj = data;
    for (const val of Object.values(obj)) {
        if (val && typeof val === "object" && !Array.isArray(val)) {
            const entries = Object.entries(val);
            if (entries.length === 0)
                continue;
            // Check: values must be objects with at least one numeric field
            const allObjectsWithNumbers = entries.every(([, v]) => {
                if (!v || typeof v !== "object" || Array.isArray(v))
                    return false;
                return Object.values(v).some((f) => typeof f === "number");
            });
            if (allObjectsWithNumbers) {
                const keyType = entries.some(([k]) => k.includes("#")) ? "runtimeStageId" : "stageName";
                return { steps: val, keyType };
            }
        }
    }
    return null;
}
/** Extract render hints from recorder data: numericField name + grandTotal. */
function extractRenderHints(data) {
    if (!data || typeof data !== "object")
        return null;
    const obj = data;
    if (typeof obj.numericField === "string" && typeof obj.grandTotal === "number") {
        return { numericField: obj.numericField, grandTotal: obj.grandTotal };
    }
    return null;
}
function KeyedRecorderView({ data, description, preferredOperation = "accumulate", snapshots, selectedIndex, }) {
    const [showAggregate, setShowAggregate] = useState(false);
    const detected = useMemo(() => detectKeyedSteps(data), [data]);
    // Visible keys up to slider position — match by runtimeStageId or stageName
    const visibleKeys = useMemo(() => {
        const keys = new Set();
        for (let i = 0; i <= selectedIndex && i < snapshots.length; i++) {
            const snap = snapshots[i];
            if (detected?.keyType === "runtimeStageId") {
                if (snap.runtimeStageId)
                    keys.add(snap.runtimeStageId);
            }
            else {
                // Match by stageName or stageLabel
                if (snap.stageName)
                    keys.add(snap.stageName);
                if (snap.stageLabel)
                    keys.add(snap.stageLabel);
            }
        }
        return keys;
    }, [snapshots, selectedIndex, detected?.keyType]);
    const isAtEnd = selectedIndex >= snapshots.length - 1;
    if (!detected) {
        // Fallback: raw JSON for non-keyed data
        return (_jsx("div", { style: { padding: 12, fontFamily: theme.fontMono, fontSize: 11, whiteSpace: "pre-wrap", overflow: "auto", height: "100%" }, children: typeof data === "string" ? data : JSON.stringify(data, null, 2) }));
    }
    const steps = detected.steps;
    const hints = extractRenderHints(data);
    const numFieldKey = hints?.numericField ?? "";
    // Progressive entries (accumulate)
    const allKeys = Object.keys(steps);
    const visibleEntries = allKeys.filter((k) => visibleKeys.has(k));
    // Running total — computed from visible entries using the declared numeric field
    let runningTotal = 0;
    if (numFieldKey) {
        for (const k of visibleEntries) {
            runningTotal += steps[k][numFieldKey] ?? 0;
        }
    }
    // Grand total — provided by the recorder, not recomputed
    const grandTotal = hints?.grandTotal ?? 0;
    return (_jsxs("div", { style: { overflow: "auto", height: "100%", display: "flex", flexDirection: "column" }, children: [description && (_jsx("div", { style: { padding: "6px 12px", fontSize: 11, color: theme.textMuted, fontStyle: "italic", borderBottom: `1px solid ${theme.border}`, flexShrink: 0 }, children: description })), _jsxs("div", { style: { padding: 12, flex: 1, overflow: "auto" }, children: [preferredOperation === "aggregate" ? (
                    /* AGGREGATE: collect silently during scrub, button at end to reveal total */
                    _jsxs(_Fragment, { children: [isAtEnd ? (_jsx("div", { style: { marginBottom: 16 }, children: !showAggregate ? (_jsx("button", { onClick: () => setShowAggregate(true), style: {
                                        background: theme.primary, color: "#fff", border: "none", borderRadius: 8,
                                        padding: "12px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                                        fontFamily: "inherit", width: "100%",
                                    }, children: "Aggregate \u2014 Show Grand Total" })) : (_jsxs("div", { style: { padding: "14px 16px", background: `color-mix(in srgb, ${theme.success} 12%, transparent)`, borderRadius: 8, border: `1px solid ${theme.success}44` }, children: [_jsx("div", { style: { fontSize: 10, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, fontWeight: 600 }, children: "Aggregate \u2014 grand total" }), numFieldKey && (_jsxs("div", { style: { fontSize: 26, fontWeight: 700, color: theme.success }, children: [grandTotal < 1 ? grandTotal.toFixed(3) : grandTotal.toFixed(1), _jsxs("span", { style: { fontSize: 11, color: theme.textMuted, fontWeight: 400, marginLeft: 8 }, children: [numFieldKey, " \u00B7 ", allKeys.length, " steps"] })] }))] })) })) : (_jsxs("div", { style: { padding: "10px 14px", background: `color-mix(in srgb, ${theme.textMuted} 6%, transparent)`, borderRadius: 6, marginBottom: 16, border: `1px dashed ${theme.border}` }, children: [_jsx("div", { style: { fontSize: 10, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }, children: "Collecting data..." }), _jsxs("div", { style: { fontSize: 11, color: theme.textMuted, marginTop: 4 }, children: [visibleEntries.length, " of ", allKeys.length, " steps collected. Scrub to end to aggregate."] })] })), _jsx("div", { style: { fontSize: 10, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, fontWeight: 600 }, children: "Per-step detail" })] })) : preferredOperation === "accumulate" ? (
                    /* ACCUMULATE: running total grows with slider — IS the total at end, no button */
                    _jsxs(_Fragment, { children: [numFieldKey && visibleEntries.length > 0 && (_jsxs("div", { style: { padding: "10px 14px", background: `color-mix(in srgb, ${theme.primary} 8%, transparent)`, borderRadius: 6, marginBottom: 16 }, children: [_jsx("div", { style: { fontSize: 10, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4, fontWeight: 600 }, children: "Accumulate \u2014 running total up to this step" }), _jsx("span", { style: { fontWeight: 700, fontSize: 18, color: theme.primary }, children: runningTotal < 1 ? runningTotal.toFixed(3) : runningTotal.toFixed(1) }), _jsxs("span", { style: { color: theme.textMuted, marginLeft: 8, fontSize: 10 }, children: [numFieldKey, " \u00B7 ", visibleEntries.length, " of ", allKeys.length, " steps"] })] })), _jsx("div", { style: { fontSize: 10, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, fontWeight: 600 }, children: "Per-step detail" })] })) : (
                    /* TRANSLATE: per-step entries prominent, no totals */
                    _jsx("div", { style: { fontSize: 10, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, fontWeight: 600 }, children: "Translate \u2014 per-step detail" })), visibleEntries.map((key) => {
                        const entry = steps[key];
                        const label = entry.stageName ?? key;
                        const numVal = numFieldKey ? entry[numFieldKey] : undefined;
                        return (_jsxs("div", { style: { display: "flex", alignItems: "center", padding: "4px 0", fontSize: 12, fontFamily: theme.fontMono, borderBottom: `1px solid ${theme.border}22` }, children: [_jsx("span", { style: { color: theme.textMuted, width: 140, flexShrink: 0, fontSize: 10 }, children: key }), _jsx("span", { style: { fontWeight: 600, flex: 1 }, children: label }), numVal !== undefined && (_jsx("span", { style: { color: theme.primary, fontWeight: 700, marginLeft: 8 }, children: numVal < 1 ? numVal.toFixed(3) : numVal.toFixed(1) }))] }, key));
                    }), visibleEntries.length === 0 && (_jsx("div", { style: { color: theme.textMuted, fontSize: 11, fontStyle: "italic", padding: "8px 0" }, children: "Scrub the slider to reveal entries..." }))] })] }));
}
// ---------------------------------------------------------------------------
// DetailsContent — Recorder-driven tab switcher (Memory + Narrative are defaults)
// ---------------------------------------------------------------------------
const DetailsContent = memo(function DetailsContent({ snapshots, selectedIndex, narrativeEntries, size, fillHeight, extraViews, }) {
    // Built-in views (always available)
    const builtInViews = [
        {
            id: "memory",
            name: "Memory",
            render: ({ snapshots: snaps, selectedIndex: idx }) => (_jsx(MemoryPanel, { snapshots: snaps, selectedIndex: idx, size: size, style: fillHeight ? { height: "100%" } : undefined })),
        },
        {
            id: "narrative",
            name: "Narrative",
            render: ({ snapshots: snaps, selectedIndex: idx }) => (_jsx(NarrativePanel, { snapshots: snaps, selectedIndex: idx, narrativeEntries: narrativeEntries, size: size, style: fillHeight ? { height: "100%" } : undefined })),
        },
    ];
    const allViews = [...builtInViews, ...(extraViews ?? [])];
    const [activeViewId, setActiveViewId] = useState(allViews[0]?.id ?? "memory");
    // Reset tab when available views change (e.g., recorder toggled on/off)
    const viewIds = allViews.map((v) => v.id).join(",");
    useEffect(() => {
        if (!allViews.find((v) => v.id === activeViewId)) {
            setActiveViewId(allViews[0]?.id ?? "memory");
        }
    }, [viewIds]); // eslint-disable-line react-hooks/exhaustive-deps
    const activeView = allViews.find((v) => v.id === activeViewId) ?? allViews[0];
    return (_jsxs("div", { style: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }, children: [_jsx("div", { style: { display: "flex", borderBottom: `1px solid ${theme.border}`, flexShrink: 0, overflowX: "auto" }, children: allViews.map((view) => {
                    const active = view.id === activeViewId;
                    return (_jsx("button", { onClick: () => setActiveViewId(view.id), style: {
                            flex: allViews.length <= 3 ? 1 : undefined,
                            padding: "6px 8px", fontSize: 11,
                            fontWeight: active ? 600 : 400,
                            color: active ? theme.primary : theme.textMuted,
                            background: active ? `color-mix(in srgb, ${theme.primary} 8%, transparent)` : "transparent",
                            border: "none",
                            borderBottom: active ? `2px solid ${theme.primary}` : "2px solid transparent",
                            cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "inherit",
                            whiteSpace: "nowrap",
                        }, children: view.name }, view.id));
                }) }), _jsx("div", { style: { flex: 1, overflow: "auto" }, children: activeView?.render({ snapshots, selectedIndex }) })] }));
});
// ---------------------------------------------------------------------------
// Subflow resolution helpers
// ---------------------------------------------------------------------------
function resolveSubflowLevel(parentSpec, parentSnapshots, subflowNodeName, narrativeEntries) {
    const specNode = findSubflowSpecNode(parentSpec, subflowNodeName);
    if (!specNode?.subflowStructure)
        return null;
    const parentSnap = parentSnapshots.find((s) => s.stageName === subflowNodeName || s.stageLabel === subflowNodeName);
    if (!parentSnap?.subflowResult)
        return null;
    // Extract subflow narrative: prefer subflowId (structured), fall back to display name (text scan)
    const sfId = specNode.subflowId ?? subflowNodeName;
    const sfDisplayName = specNode.subflowName ?? specNode.name;
    const sfNarrative = narrativeEntries
        ? extractSubflowNarrative(narrativeEntries, sfId, sfDisplayName)
        : undefined;
    const sfSnapshots = subflowResultToSnapshots(parentSnap.subflowResult, sfNarrative);
    if (sfSnapshots.length === 0)
        return null;
    return {
        subflowId: specNode.subflowId ?? subflowNodeName,
        label: specNode.subflowName ?? specNode.name,
        spec: specNode.subflowStructure,
        snapshots: sfSnapshots,
    };
}
function findSubflowSpecNode(node, name) {
    if ((node.name === name || node.id === name) && node.isSubflowRoot)
        return node;
    if (node.children) {
        for (const child of node.children) {
            const f = findSubflowSpecNode(child, name);
            if (f)
                return f;
        }
    }
    if (node.next)
        return findSubflowSpecNode(node.next, name);
    return null;
}
function hasSubflowNodes(node) {
    if (!node)
        return false;
    if (node.isSubflowRoot)
        return true;
    if (node.children?.some((c) => c && hasSubflowNodes(c)))
        return true;
    if (node.next && hasSubflowNodes(node.next))
        return true;
    return false;
}
function buildDataTrace(commitLog, targetRuntimeStageId, maxDepth = 10) {
    const log = commitLog;
    if (!log?.length)
        return [];
    const idxMap = new Map();
    for (let i = 0; i < log.length; i++)
        idxMap.set(log[i].runtimeStageId, i);
    const startIdx = idxMap.get(targetRuntimeStageId);
    if (startIdx === undefined)
        return [];
    const startCommit = log[startIdx];
    const frames = [];
    const visited = new Set();
    // BFS backward: for each commit, find what keys existed before it that it might have read
    // Simplified: trace the write chain backward — each commit's written keys link to whoever wrote the keys it implicitly depends on
    let current = startCommit;
    let currentIdx = startIdx;
    let depth = 0;
    while (current && depth <= maxDepth) {
        if (visited.has(current.runtimeStageId))
            break;
        visited.add(current.runtimeStageId);
        frames.push({
            runtimeStageId: current.runtimeStageId,
            stageId: current.stageId,
            stageName: current.stage,
            keysWritten: current.trace.map((t) => t.path),
            linkedBy: depth === 0 ? "" : current.trace[0]?.path ?? "",
            depth,
        });
        // Find the previous commit (the one right before this one)
        if (currentIdx > 0) {
            currentIdx--;
            current = log[currentIdx];
            depth++;
        }
        else {
            break;
        }
    }
    return frames;
}
const RightPanel = memo(function RightPanel({ mode, onModeChange, snapshots, selectedIndex, runtimeSnapshot, spec, activeTab, allTabs, activeNarrativeEntries, recorderViews, autoRecorderViews, size, onNavigateToStage, }) {
    return (_jsxs(_Fragment, { children: [_jsx("div", { style: {
                    display: "flex",
                    borderBottom: `1px solid ${theme.border}`,
                    flexShrink: 0,
                    background: theme.bgSecondary,
                }, children: ["insights", "what"].map((m) => (_jsx("button", { onClick: () => onModeChange(m), style: {
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
                        fontFamily: "inherit",
                    }, children: m === "insights" ? "Insights" : "Inspector" }, m))) }), _jsx("div", { style: { flex: 1, overflow: "hidden" }, children: mode === "insights" ? (_jsx(InsightPanel, { mode: "tabs", expandedId: activeTab, insights: allTabs.filter((t) => t.id !== "result" && t.id !== "memory").map((tab) => ({
                        id: tab.id,
                        name: insightName(tab.name),
                        render: () => {
                            if (tab.id === "narrative")
                                return _jsx(NarrativePanel, { snapshots: snapshots, selectedIndex: selectedIndex, narrativeEntries: activeNarrativeEntries, runtimeSnapshot: runtimeSnapshot, spec: spec, size: size, style: { height: "100%" } });
                            const customView = recorderViews?.find((v) => v.id === tab.id);
                            if (customView?.render)
                                return customView.render({ snapshots, selectedIndex });
                            const autoView = autoRecorderViews.find((v) => v.id === tab.id);
                            if (autoView)
                                return _jsx(KeyedRecorderView, { data: autoView.data, description: autoView.description, preferredOperation: autoView.preferredOperation, snapshots: snapshots, selectedIndex: selectedIndex });
                            return null;
                        },
                    })) })) : (_jsx(InspectorPanel, { snapshots: snapshots, selectedIndex: selectedIndex, dataTraceFrames: runtimeSnapshot?.commitLog ? buildDataTrace(runtimeSnapshot.commitLog, snapshots[selectedIndex]?.runtimeStageId ?? '') : [], selectedStageId: snapshots[selectedIndex]?.runtimeStageId, onNavigateToStage: onNavigateToStage })) })] }));
});
/** Map internal recorder names to user-facing Insight names. */
function insightName(name) {
    const map = {
        "Narrative": "Story",
        "Memory": "State",
        "Metrics": "Performance",
        "Quality": "Quality",
        "Cost": "Cost",
    };
    return map[name] ?? name;
}
export function ExplainableShell({ snapshots: snapshotsProp, runtimeSnapshot, spec, title, resultData: resultDataProp, logs = [], narrativeEntries, tabs = ["result", "explainable"], defaultTab, hideConsole = false, hideTabs: hideTabsProp, panelLabels, defaultExpanded, recorderViews, renderFlowchart, showStageId = false, traceGraph, runtimeOverlay, size = "default", unstyled = false, className, style, }) {
    // Convert runtimeSnapshot → visualization snapshots (zero-boilerplate mode)
    const derivedFromRuntime = useMemo(() => {
        if (!runtimeSnapshot)
            return null;
        try {
            const snaps = toVisualizationSnapshots(runtimeSnapshot, narrativeEntries);
            return { snapshots: snaps, resultData: runtimeSnapshot.sharedState };
        }
        catch {
            return null;
        }
    }, [runtimeSnapshot, narrativeEntries]);
    // Use derived data when runtimeSnapshot is provided, otherwise use explicit props
    const snapshots = snapshotsProp ?? derivedFromRuntime?.snapshots ?? [];
    const resultData = resultDataProp ?? derivedFromRuntime?.resultData ?? null;
    // Flowchart renderer selection (v6+ — recorder-driven only):
    //   - explicit `renderFlowchart` always wins (consumer override)
    //   - `traceGraph` → render via `<TracedFlow>` (event-driven graph
    //     + optional runtime overlay, no spec-tree post-walk)
    //
    // Consumers MUST pass `traceGraph` for chart visualization. The
    // legacy `spec={...}` → post-walk fallback was removed when the
    // recorder gained convergence-edge expansion (post-fork `next`
    // fires N edges, one per branch child) — the recorder graph is now
    // the single source of truth.
    const tracedFlowRenderer = useMemo(() => {
        if (!traceGraph)
            return undefined;
        return ({ selectedIndex, snapshots, onNodeClick }) => {
            // The shell's `selectedIndex` indexes into `snapshots[]` (which
            // may be filtered to a drill-down subset). The overlay's
            // `executionOrder` is the FULL execution timeline (all stages
            // including subflow internals). When the two arrays have
            // different lengths, passing selectedIndex straight through
            // misaligns the chart's active highlight.
            //
            // Translate: take the runtimeStageId at snapshots[selectedIndex]
            // and find the matching position in overlay.executionOrder.
            // Fall back to selectedIndex when no overlay or no match
            // (charts without subflows have aligned indexes anyway).
            const activeRsid = snapshots[selectedIndex]?.runtimeStageId;
            let overlayIdx = selectedIndex;
            if (activeRsid && runtimeOverlay) {
                const i = runtimeOverlay.executionOrder.findIndex((s) => s.runtimeStageId === activeRsid);
                if (i >= 0)
                    overlayIdx = i;
            }
            return (_jsx(TracedFlow, { graph: traceGraph, overlay: runtimeOverlay ?? undefined, scrubIndex: overlayIdx, onNodeClick: (stageId) => onNodeClick?.(stageId), onSubflowChange: (mountId) => {
                    // Forward chart's drill state to the shell's drill-down
                    // stack so memory/narrative/timeline panels follow the
                    // chart into/out of subflows. We route through the same
                    // onNodeClick channel — it already triggers drill-down
                    // for subflow mount nodes via the shell's handleNodeClick
                    // → handleDrillDown path.
                    //
                    // The `mountId === null` case (popping back to top) is
                    // intentionally NOT auto-triggered here: the shell's
                    // breadcrumb-back button is the right user gesture for
                    // navigating UP from a subflow. Auto-popping on scrub
                    // would surprise users who manually drilled in.
                    if (mountId !== null)
                        onNodeClick?.(mountId);
                } }));
        };
    }, [traceGraph, runtimeOverlay]);
    const effectiveRenderFlowchart = renderFlowchart ?? tracedFlowRenderer;
    const leftLabel = panelLabels?.topology ?? "Topology";
    const rightLabel = panelLabels?.details ?? "Details";
    const bottomLabel = panelLabels?.timeline ?? "Timeline";
    // Responsive: detect narrow container + notify children of size changes
    const shellRef = useRef(null);
    const [isNarrow, setIsNarrow] = useState(false);
    const [isMedium, setIsMedium] = useState(false);
    useEffect(() => {
        const el = shellRef.current;
        if (!el)
            return;
        const ro = new ResizeObserver(([entry]) => {
            const w = entry.contentRect.width;
            setIsNarrow(w < 640);
            setIsMedium(w >= 640 && w < 960);
            // Notify ReactFlow (and other layout-sensitive children) that our container resized
            window.dispatchEvent(new Event("resize"));
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);
    // Auto-detect recorder views from runtimeSnapshot.recorders
    const autoRecorderViews = useMemo(() => {
        const recorders = runtimeSnapshot?.recorders;
        if (!recorders?.length)
            return [];
        // Don't auto-generate for IDs that have explicit recorderViews
        const explicitIds = new Set((recorderViews ?? []).map((v) => v.id));
        return recorders
            .filter((r) => !explicitIds.has(r.id))
            .map((r) => ({ id: r.id, name: r.name, description: r.description, preferredOperation: r.preferredOperation, data: r.data }));
    }, [runtimeSnapshot, recorderViews]);
    // Build tab list: Result + Memory (always), Narrative (when data exists),
    // explicit recorder views, auto-detected recorder views
    const hasNarrative = !!narrativeEntries?.length;
    const allTabs = useMemo(() => {
        const tabs = [
            { id: "result", name: "Result", description: "Final output and console logs" },
            { id: "memory", name: "Memory", description: "Accumulator — progressive shared state at each stage" },
        ];
        if (hasNarrative) {
            tabs.push({ id: "narrative", name: "Narrative", description: "Translator (SequenceRecorder) — interleaved flow + data narrative per execution step" });
        }
        for (const v of recorderViews ?? []) {
            tabs.push({ id: v.id, name: v.name, description: v.description });
        }
        for (const v of autoRecorderViews) {
            tabs.push({ id: v.id, name: v.name, description: v.description });
        }
        // Filter hidden tabs
        const hideSet = new Set(hideTabsProp ?? []);
        return hideSet.size > 0 ? tabs.filter((t) => !hideSet.has(t.id)) : tabs;
    }, [hasNarrative, recorderViews, autoRecorderViews, hideTabsProp]);
    const validTabIds = new Set(allTabs.map((t) => t.id));
    const resolvedDefault = defaultTab && validTabIds.has(defaultTab) ? defaultTab : allTabs[0]?.id ?? "result";
    const [activeTab, setActiveTab] = useState(resolvedDefault);
    const [snapshotIdx, setSnapshotIdx] = useState(0);
    const [drillDownStack, setDrillDownStack] = useState([]);
    const [rightExpanded, setRightExpanded] = useState(defaultExpanded?.details ?? true);
    const [rightPanelMode, setRightPanelMode] = useState("insights");
    const [leftExpanded, setLeftExpanded] = useState(defaultExpanded?.topology ?? false);
    const [timelineExpanded, setTimelineExpanded] = useState(defaultExpanded?.timeline ?? false);
    // Auto-collapse all panels when switching to narrow (mobile)
    useEffect(() => {
        if (isNarrow) {
            setLeftExpanded(false);
            setRightExpanded(false);
            setTimelineExpanded(false);
        }
    }, [isNarrow]);
    // Notify ReactFlow (and any ResizeObserver-based children) when panels toggle
    const triggerReflow = useCallback(() => {
        // Fire twice: once immediately for fast response, once after CSS transition ends
        requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
        setTimeout(() => window.dispatchEvent(new Event("resize")), 320);
    }, []);
    const toggleLeft = useCallback((v) => { setLeftExpanded(v); triggerReflow(); }, [triggerReflow]);
    const toggleRight = useCallback((v) => { setRightExpanded(v); triggerReflow(); }, [triggerReflow]);
    const toggleTimeline = useCallback(() => { setTimelineExpanded((p) => !p); triggerReflow(); }, [triggerReflow]);
    const isInSubflow = drillDownStack.length > 0;
    const currentLevel = useMemo(() => {
        if (drillDownStack.length > 0) {
            const top = drillDownStack[drillDownStack.length - 1];
            return { spec: top.spec, snapshots: top.snapshots };
        }
        return { spec: spec ?? null, snapshots };
    }, [drillDownStack, spec, snapshots]);
    const activeSnapshots = currentLevel.snapshots;
    const activeSpec = currentLevel.spec;
    const safeIdx = activeSnapshots.length > 0
        ? Math.max(0, Math.min(snapshotIdx, activeSnapshots.length - 1))
        : 0;
    const activeNarrativeEntries = isInSubflow ? undefined : narrativeEntries;
    const breadcrumbs = useMemo(() => {
        const root = { label: title || "Flowchart", spec: spec, description: spec?.description };
        return [root, ...drillDownStack.map((e) => ({ label: e.label, spec: e.spec, description: undefined }))];
    }, [spec, title, drillDownStack]);
    // Recorder-driven: derive subflow presence from the build-time graph.
    // Falls back to the legacy spec walk only when traceGraph is absent
    // (e.g., a consumer still threading raw spec). When both are absent,
    // the tree sidebar is hidden.
    const showTreeSidebar = useMemo(() => {
        if (traceGraph?.nodes?.length) {
            return traceGraph.nodes.some((n) => n.data?.isSubflow === true);
        }
        return !!spec && hasSubflowNodes(spec);
    }, [traceGraph, spec]);
    const rootOverlay = useMemo(() => {
        if (isInSubflow || !snapshots.length)
            return { activeStage: undefined, doneStages: undefined };
        const doneStages = new Set(snapshots.slice(0, safeIdx).map((s) => s.stageLabel));
        const activeStage = snapshots[safeIdx]?.stageLabel ?? null;
        return { activeStage, doneStages };
    }, [isInSubflow, snapshots, safeIdx]);
    // ── Handlers ──
    const handleTabChange = useCallback((tab) => {
        setActiveTab(tab);
        setDrillDownStack([]);
    }, []);
    const handleSnapshotChange = useCallback((idx) => {
        if (typeof idx === "number")
            setSnapshotIdx(idx);
    }, []);
    const handleDrillDown = useCallback((nodeName) => {
        if (!activeSpec)
            return;
        const entry = resolveSubflowLevel(activeSpec, activeSnapshots, nodeName, narrativeEntries);
        if (entry) {
            setDrillDownStack((prev) => [...prev, { ...entry, parentSnapshotIdx: snapshotIdx }]);
            setSnapshotIdx(0);
        }
    }, [activeSpec, activeSnapshots, narrativeEntries, snapshotIdx]);
    const handleBreadcrumbNavigate = useCallback((level) => {
        setDrillDownStack((prev) => {
            const popped = level === 0 ? prev[0] : prev[level];
            if (popped)
                setSnapshotIdx(popped.parentSnapshotIdx);
            return level === 0 ? [] : prev.slice(0, level);
        });
    }, []);
    const handleNodeClick = useCallback((indexOrId) => {
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
        if (idx >= 0)
            setSnapshotIdx(idx);
    }, [activeSpec, activeSnapshots, handleDrillDown]);
    const handleTreeNodeSelect = useCallback((name, isSubflow) => {
        if (isSubflow && spec) {
            setDrillDownStack([]);
            const entry = resolveSubflowLevel(spec, snapshots, name, narrativeEntries);
            if (entry) {
                setDrillDownStack([{ ...entry, parentSnapshotIdx: snapshotIdx }]);
                setSnapshotIdx(0);
            }
        }
        else {
            setDrillDownStack([]);
            const idx = snapshots.findIndex((s) => s.stageLabel === name);
            if (idx >= 0)
                setSnapshotIdx(idx);
        }
    }, [spec, snapshots, narrativeEntries, snapshotIdx]);
    // Map tab id → label for rendering
    const tabLabels = new Map(allTabs.map((t) => [t.id, t.name]));
    // ── Unstyled mode ──
    if (unstyled) {
        return (_jsxs("div", { className: className, style: style, "data-fp": "explainable-shell", children: [_jsx("div", { "data-fp": "shell-tabs", children: allTabs.map((tab) => (_jsx("button", { "data-fp": "shell-tab", "data-active": tab.id === activeTab, onClick: () => handleTabChange(tab.id), children: tab.name }, tab.id))) }), _jsxs("div", { "data-fp": "shell-content", "data-tab": activeTab, children: [activeTab === "result" && _jsx(ResultPanel, { data: resultData ?? null, logs: logs, hideConsole: hideConsole, unstyled: true }), (activeTab === "explainable" || activeTab === "ai-compatible") && (_jsxs(_Fragment, { children: [_jsx(TimeTravelControls, { snapshots: activeSnapshots, selectedIndex: safeIdx, onIndexChange: handleSnapshotChange, unstyled: true }), isInSubflow && _jsx(SubflowBreadcrumb, { breadcrumbs: breadcrumbs, onNavigate: handleBreadcrumbNavigate }), activeSpec && effectiveRenderFlowchart?.({ spec: activeSpec, snapshots: activeSnapshots, selectedIndex: safeIdx, onNodeClick: handleNodeClick, showStageId }), _jsx(MemoryPanel, { snapshots: activeSnapshots, selectedIndex: safeIdx, unstyled: true }), _jsx(NarrativePanel, { snapshots: activeSnapshots, selectedIndex: safeIdx, narrativeEntries: activeNarrativeEntries, unstyled: true }), _jsx(GanttTimeline, { snapshots: activeSnapshots, selectedIndex: safeIdx, onSelect: handleSnapshotChange, unstyled: true })] }))] })] }));
    }
    // ── Styled mode ──
    // Show topology when spec has subflows
    const showTopology = !!effectiveRenderFlowchart && !!activeSpec;
    // Render the active details tab content
    const detailsContent = useMemo(() => {
        if (activeTab === "result") {
            return _jsx(ResultPanel, { data: resultData ?? null, logs: logs, hideConsole: hideConsole, size: size });
        }
        if (activeTab === "memory") {
            return _jsx(MemoryPanel, { snapshots: activeSnapshots, selectedIndex: safeIdx, size: size, style: { height: "100%" } });
        }
        if (activeTab === "narrative") {
            return _jsx(NarrativePanel, { snapshots: activeSnapshots, selectedIndex: safeIdx, narrativeEntries: activeNarrativeEntries, size: size, style: { height: "100%" } });
        }
        const customView = recorderViews?.find((v) => v.id === activeTab);
        if (customView?.render) {
            return customView.render({ snapshots: activeSnapshots, selectedIndex: safeIdx });
        }
        // Auto-detected recorder view — time-travel aware for keyed recorders, JSON fallback
        const autoView = autoRecorderViews.find((v) => v.id === activeTab);
        if (autoView) {
            return (_jsx(KeyedRecorderView, { data: autoView.data, description: autoView.description, preferredOperation: autoView.preferredOperation, snapshots: activeSnapshots, selectedIndex: safeIdx }));
        }
        return null;
    }, [activeTab, resultData, logs, hideConsole, size, activeSnapshots, safeIdx, activeNarrativeEntries, recorderViews, autoRecorderViews]);
    // Details panel with internal tabs
    const detailsPanel = (_jsxs("div", { style: { display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }, children: [_jsx("div", { style: {
                    display: "flex",
                    borderBottom: `1px solid ${theme.border}`,
                    background: theme.bgSecondary,
                    flexShrink: 0,
                    overflowX: "auto",
                }, children: allTabs.map((tab) => {
                    const active = tab.id === activeTab;
                    return (_jsx("button", { onClick: () => handleTabChange(tab.id), title: tab.description, style: {
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
                            whiteSpace: "nowrap",
                        }, children: tab.name }, tab.id));
                }) }), _jsx("div", { style: { flex: 1, overflow: "auto" }, children: detailsContent })] }));
    return (_jsxs("div", { ref: shellRef, className: className, style: {
            height: "100%",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            background: theme.bgPrimary,
            color: theme.textPrimary,
            fontFamily: theme.fontSans,
            fontSize: 12,
            ...style,
        }, "data-fp": "explainable-shell", children: [_jsx(TimeTravelControls, { snapshots: activeSnapshots, selectedIndex: safeIdx, onIndexChange: handleSnapshotChange, size: size }), isInSubflow && (_jsx(SubflowBreadcrumb, { breadcrumbs: breadcrumbs, onNavigate: handleBreadcrumbNavigate })), _jsx("div", { style: { flex: 1, overflow: isNarrow ? "auto" : "hidden", display: "flex", flexDirection: "column" }, children: isNarrow ? (
                /* ── Mobile: stacked vertical ── */
                _jsxs(_Fragment, { children: [showTopology && (_jsx("div", { style: { height: 350, flexShrink: 0, overflow: "hidden" }, children: effectiveRenderFlowchart({
                                spec: activeSpec,
                                snapshots: activeSnapshots,
                                selectedIndex: safeIdx,
                                onNodeClick: handleNodeClick,
                                showStageId,
                            }) })), showTreeSidebar && (_jsxs(_Fragment, { children: [_jsx(HLinePill, { label: leftLabel, expanded: leftExpanded, onClick: () => toggleLeft(!leftExpanded) }), leftExpanded && (_jsx("div", { style: { maxHeight: 180, overflow: "auto", flexShrink: 0 }, children: _jsx(SubflowTree, { graph: traceGraph ?? { nodes: [], edges: [] }, activeStage: rootOverlay.activeStage, doneStages: rootOverlay.doneStages, onNodeSelect: handleTreeNodeSelect }) }))] })), _jsx(HLinePill, { label: rightLabel, expanded: rightExpanded, onClick: () => toggleRight(!rightExpanded) }), rightExpanded && (_jsx("div", { style: { maxHeight: 350, flexShrink: 0, overflow: "hidden" }, children: detailsPanel })), _jsx(HLinePill, { label: bottomLabel, detail: `${activeSnapshots.length} stages`, expanded: timelineExpanded, onClick: toggleTimeline }), timelineExpanded && (_jsx("div", { style: { flexShrink: 0, overflow: "hidden" }, children: _jsx(GanttTimeline, { snapshots: activeSnapshots, selectedIndex: safeIdx, onSelect: handleSnapshotChange, size: size }) }))] })) : (
                /* ── Desktop: two-column — Flowchart | Right Panel ── */
                _jsxs(_Fragment, { children: [_jsxs("div", { style: { flex: 1, display: "flex", overflow: "hidden" }, children: [showTreeSidebar && (leftExpanded ? (_jsxs("div", { style: { width: 180, flexShrink: 0, display: "flex", flexDirection: "row", overflow: "hidden" }, children: [_jsx("div", { style: { flex: 1, overflow: "auto" }, children: _jsx(SubflowTree, { graph: traceGraph ?? { nodes: [], edges: [] }, activeStage: rootOverlay.activeStage, doneStages: rootOverlay.doneStages, onNodeSelect: handleTreeNodeSelect }) }), _jsx(VLinePill, { label: "Topology", expanded: true, side: "left", onClick: () => toggleLeft(false) })] })) : (_jsx(VLinePill, { label: "Topology", expanded: false, side: "left", onClick: () => toggleLeft(true) }))), showTopology ? (_jsx("div", { style: { flex: 1, overflow: "hidden", minWidth: 0 }, children: effectiveRenderFlowchart({
                                        spec: activeSpec,
                                        snapshots: activeSnapshots,
                                        selectedIndex: safeIdx,
                                        onNodeClick: handleNodeClick,
                                        showStageId,
                                    }) })) : (_jsx("div", { style: { flex: 1 } })), _jsx(VLinePill, { label: "Details", expanded: rightExpanded, onClick: () => toggleRight(!rightExpanded) }), rightExpanded && (_jsx("div", { style: { width: "42%", minWidth: 320, maxWidth: 550, display: "flex", flexDirection: "column", overflow: "hidden" }, children: _jsx(RightPanel, { mode: rightPanelMode, onModeChange: setRightPanelMode, snapshots: activeSnapshots, selectedIndex: safeIdx, runtimeSnapshot: runtimeSnapshot, spec: spec, activeTab: activeTab, allTabs: allTabs, activeNarrativeEntries: activeNarrativeEntries, recorderViews: recorderViews, autoRecorderViews: autoRecorderViews, size: size, onNavigateToStage: (id) => {
                                            const idx = activeSnapshots.findIndex((s) => s.runtimeStageId === id);
                                            if (idx >= 0)
                                                setSnapshotIdx(idx);
                                        } }) }))] }), _jsx(CompactTimeline, { snapshots: activeSnapshots, selectedIndex: safeIdx, defaultExpanded: timelineExpanded })] })) })] }));
}
//# sourceMappingURL=ExplainableShell.js.map