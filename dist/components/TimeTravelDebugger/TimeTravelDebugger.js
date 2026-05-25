import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { theme, fontSize, padding } from "../../theme";
import { MemoryInspector } from "../MemoryInspector";
import { NarrativeLog } from "../NarrativeLog";
import { GanttTimeline } from "../GanttTimeline";
import { TraceFlow } from "../FlowchartView/TraceFlow";
import { TracedFlow } from "../FlowchartView/TracedFlow";
/**
 * Full time-travel debugger: scrubber + recorder-driven flowchart +
 * memory + narrative + gantt. This is the "batteries included"
 * component for pipeline debugging.
 *
 * v6+: chart rendering is recorder-driven. Pass `graph` (always) and
 * optionally `runtimeOverlay` for per-step coloring tied to the
 * scrubber.
 */
export function TimeTravelDebugger({ snapshots, graph, runtimeOverlay, showGantt = true, layout = "horizontal", title = "Time-Travel Debugger", size = "default", unstyled = false, className, style, }) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const fs = fontSize[size];
    const pad = padding[size];
    if (snapshots.length === 0) {
        return (_jsx("div", { className: className, style: {
                padding: pad * 2,
                textAlign: "center",
                color: theme.textMuted,
                ...style,
            }, children: "No snapshots to debug" }));
    }
    const isHorizontal = layout === "horizontal";
    // Click → jump scrubber to whichever snapshot maps to the clicked
    // stage. Matches the legacy `onNodeClick(index)` semantics: callers
    // receive a stage id, we translate to a snapshot index.
    const handleNodeClick = (stageId) => {
        const idx = snapshots.findIndex((s) => s.stageName === stageId || s.stageLabel === stageId);
        if (idx >= 0)
            setSelectedIndex(idx);
    };
    const chart = runtimeOverlay ? (_jsx(TracedFlow, { graph: graph, overlay: runtimeOverlay, scrubIndex: selectedIndex, onNodeClick: handleNodeClick })) : (_jsx(TraceFlow, { graph: graph, onNodeClick: handleNodeClick }));
    if (unstyled) {
        return (_jsxs("div", { className: className, style: style, "data-fp": "time-travel-debugger", children: [_jsx("h3", { children: title }), _jsx("input", { type: "range", min: 0, max: snapshots.length - 1, value: selectedIndex, onChange: (e) => setSelectedIndex(parseInt(e.target.value)) }), chart, _jsx(MemoryInspector, { snapshots: snapshots, selectedIndex: selectedIndex, unstyled: true }), _jsx(NarrativeLog, { snapshots: snapshots, selectedIndex: selectedIndex, unstyled: true }), showGantt && (_jsx(GanttTimeline, { snapshots: snapshots, selectedIndex: selectedIndex, onSelect: setSelectedIndex, unstyled: true }))] }));
    }
    return (_jsxs("div", { className: className, style: {
            display: "flex",
            flexDirection: "column",
            height: "100%",
            background: theme.bgPrimary,
            fontFamily: theme.fontSans,
            overflow: "hidden",
            ...style,
        }, "data-fp": "time-travel-debugger", children: [_jsxs("div", { style: {
                    padding: `${pad}px ${pad + 4}px`,
                    borderBottom: `1px solid ${theme.border}`,
                    background: theme.bgSecondary,
                    flexShrink: 0,
                }, children: [_jsxs("div", { style: {
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 8,
                        }, children: [_jsx("span", { style: {
                                    fontSize: fs.body + 2,
                                    fontWeight: 600,
                                    color: theme.textPrimary,
                                }, children: title }), _jsx("span", { style: {
                                    fontSize: fs.small,
                                    color: theme.textMuted,
                                }, children: "Scrub to replay execution" })] }), _jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [_jsx(ScrubButton, { label: "\u25C0", disabled: selectedIndex === 0, onClick: () => setSelectedIndex((i) => Math.max(0, i - 1)) }), _jsx("input", { type: "range", min: 0, max: snapshots.length - 1, value: selectedIndex, onChange: (e) => setSelectedIndex(parseInt(e.target.value)), style: {
                                    flex: 1,
                                    height: 4,
                                    accentColor: theme.primary,
                                    cursor: "pointer",
                                } }), _jsx(ScrubButton, { label: "\u25B6", disabled: selectedIndex === snapshots.length - 1, onClick: () => setSelectedIndex((i) => Math.min(snapshots.length - 1, i + 1)) }), _jsxs("span", { style: {
                                    fontSize: fs.small,
                                    color: theme.textMuted,
                                    flexShrink: 0,
                                    fontFamily: theme.fontMono,
                                }, children: [selectedIndex + 1, "/", snapshots.length] })] })] }), _jsxs("div", { style: {
                    flex: 1,
                    display: "flex",
                    flexDirection: isHorizontal ? "row" : "column",
                    overflow: "hidden",
                }, children: [_jsx("div", { style: {
                            flex: 1,
                            overflow: "hidden",
                            borderRight: isHorizontal
                                ? `1px solid ${theme.border}`
                                : "none",
                            borderBottom: !isHorizontal
                                ? `1px solid ${theme.border}`
                                : "none",
                        }, children: chart }), _jsxs("div", { style: { flex: 1, overflow: "auto" }, children: [_jsx(MemoryInspector, { snapshots: snapshots, selectedIndex: selectedIndex, size: size }), _jsx("div", { style: {
                                    height: 1,
                                    background: theme.border,
                                    margin: `0 ${pad}px`,
                                } }), _jsx(NarrativeLog, { snapshots: snapshots, selectedIndex: selectedIndex, size: size })] })] }), showGantt && (_jsx("div", { style: {
                    borderTop: `1px solid ${theme.border}`,
                    background: theme.bgSecondary,
                    flexShrink: 0,
                }, children: _jsx(GanttTimeline, { snapshots: snapshots, selectedIndex: selectedIndex, onSelect: setSelectedIndex, size: size }) }))] }));
}
function ScrubButton({ label, disabled, onClick, }) {
    return (_jsx("button", { onClick: onClick, disabled: disabled, style: {
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
            flexShrink: 0,
        }, children: label }));
}
//# sourceMappingURL=TimeTravelDebugger.js.map