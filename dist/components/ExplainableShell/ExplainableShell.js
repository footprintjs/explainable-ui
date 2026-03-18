import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback, useMemo } from "react";
import { theme, fontSize, padding } from "../../theme";
import { ResultPanel } from "../ResultPanel";
import { GanttTimeline } from "../GanttTimeline";
import { MemoryInspector } from "../MemoryInspector";
import { NarrativeTrace } from "../NarrativeTrace";
import { ScopeDiff } from "../ScopeDiff";
import { TimeTravelControls } from "../TimeTravelControls";
// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function ExplainableShell({ snapshots, resultData, logs = [], narrative = [], tabs = ["result", "explainable", "ai-compatible"], defaultTab, hideConsole = false, renderFlowchart, size = "default", unstyled = false, className, style, }) {
    const [activeTab, setActiveTab] = useState(defaultTab ?? tabs[0]);
    const [snapshotIdx, setSnapshotIdx] = useState(0);
    const fs = fontSize[size];
    const pad = padding[size];
    const handleSnapshotChange = useCallback((idx) => {
        setSnapshotIdx(Math.max(0, Math.min(idx, snapshots.length - 1)));
    }, [snapshots.length]);
    // Progressive narrative reveal
    const revealedCount = useMemo(() => {
        if (snapshots.length === 0 || narrative.length === 0)
            return narrative.length;
        const boundaries = [];
        for (let i = 0; i < narrative.length; i++) {
            const trimmed = narrative[i].trimStart();
            if ((trimmed.startsWith("Stage ") && !trimmed.match(/^Stage\s+\d+:\s*Step\s/)) ||
                trimmed.startsWith("[")) {
                boundaries.push(i);
            }
        }
        if (boundaries.length === 0) {
            const ratio = (snapshotIdx + 1) / snapshots.length;
            return Math.max(1, Math.ceil(narrative.length * ratio));
        }
        const groupsToShow = Math.max(1, Math.min(Math.floor(((snapshotIdx + 1) / snapshots.length) * boundaries.length) || 1, boundaries.length));
        const endIdx = groupsToShow < boundaries.length ? boundaries[groupsToShow] : narrative.length;
        return Math.max(1, endIdx);
    }, [snapshots.length, snapshotIdx, narrative]);
    // Scope diff data
    const prevMemory = snapshotIdx > 0 ? snapshots[snapshotIdx - 1]?.memory : null;
    const currMemory = snapshots[snapshotIdx]?.memory ?? {};
    const tabLabels = {
        result: "Result",
        explainable: "Explainable",
        "ai-compatible": "AI-Compatible",
    };
    if (unstyled) {
        return (_jsxs("div", { className: className, style: style, "data-fp": "explainable-shell", children: [_jsx("div", { "data-fp": "shell-tabs", children: tabs.map((tab) => (_jsx("button", { "data-fp": "shell-tab", "data-active": tab === activeTab, onClick: () => setActiveTab(tab), children: tabLabels[tab] }, tab))) }), _jsxs("div", { "data-fp": "shell-content", "data-tab": activeTab, children: [activeTab === "result" && (_jsx(ResultPanel, { data: resultData ?? null, logs: logs, hideConsole: hideConsole, unstyled: true })), activeTab === "explainable" && (_jsxs(_Fragment, { children: [_jsx(TimeTravelControls, { snapshots: snapshots, selectedIndex: snapshotIdx, onIndexChange: handleSnapshotChange, unstyled: true }), renderFlowchart?.({ snapshots, selectedIndex: snapshotIdx, onNodeClick: handleSnapshotChange }), _jsx(MemoryInspector, { snapshots: snapshots, selectedIndex: snapshotIdx, unstyled: true }), _jsx(ScopeDiff, { previous: prevMemory, current: currMemory, unstyled: true }), _jsx(GanttTimeline, { snapshots: snapshots, selectedIndex: snapshotIdx, onSelect: handleSnapshotChange, unstyled: true })] })), activeTab === "ai-compatible" && (_jsxs(_Fragment, { children: [_jsx(TimeTravelControls, { snapshots: snapshots, selectedIndex: snapshotIdx, onIndexChange: handleSnapshotChange, unstyled: true }), renderFlowchart?.({ snapshots, selectedIndex: snapshotIdx, onNodeClick: handleSnapshotChange }), _jsx(NarrativeTrace, { narrative: narrative, revealedCount: revealedCount, unstyled: true })] }))] })] }));
    }
    // ── Styled mode ──
    return (_jsxs("div", { className: className, style: {
            height: "100%",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            background: theme.bgPrimary,
            color: theme.textPrimary,
            fontFamily: theme.fontSans,
            ...style,
        }, "data-fp": "explainable-shell", children: [_jsx("div", { style: {
                    display: "flex",
                    gap: 0,
                    borderBottom: `1px solid ${theme.border}`,
                    background: theme.bgSecondary,
                    flexShrink: 0,
                }, children: tabs.map((tab) => {
                    const active = tab === activeTab;
                    return (_jsx("button", { onClick: () => setActiveTab(tab), style: {
                            padding: `${pad - 4}px ${pad}px`,
                            fontSize: fs.label,
                            fontWeight: active ? 700 : 500,
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            color: active ? theme.primary : theme.textMuted,
                            background: "transparent",
                            border: "none",
                            borderBottom: active ? `2px solid ${theme.primary}` : "2px solid transparent",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                        }, children: tabLabels[tab] }, tab));
                }) }), _jsxs("div", { style: { flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }, children: [activeTab === "result" && (_jsx(ResultPanel, { data: resultData ?? null, logs: logs, hideConsole: hideConsole, size: size })), activeTab === "explainable" && (_jsxs(_Fragment, { children: [_jsx(TimeTravelControls, { snapshots: snapshots, selectedIndex: snapshotIdx, onIndexChange: handleSnapshotChange, size: size }), _jsxs("div", { style: { flex: 1, display: "flex", overflow: "hidden" }, children: [renderFlowchart && (_jsx("div", { style: { flex: 1, overflow: "hidden", borderRight: `1px solid ${theme.border}` }, children: renderFlowchart({ snapshots, selectedIndex: snapshotIdx, onNodeClick: handleSnapshotChange }) })), _jsxs("div", { style: {
                                            width: renderFlowchart ? "40%" : "100%",
                                            minWidth: 280,
                                            overflow: "auto",
                                            display: "flex",
                                            flexDirection: "column",
                                        }, children: [_jsx(MemoryInspector, { snapshots: snapshots, selectedIndex: snapshotIdx, size: size }), _jsx("div", { style: { borderTop: `1px solid ${theme.border}` }, children: _jsx(ScopeDiff, { previous: prevMemory, current: currMemory, hideUnchanged: true, size: size }) })] })] }), _jsx("div", { style: { borderTop: `1px solid ${theme.border}`, flexShrink: 0 }, children: _jsx(GanttTimeline, { snapshots: snapshots, selectedIndex: snapshotIdx, onSelect: handleSnapshotChange, size: size }) })] })), activeTab === "ai-compatible" && (_jsxs(_Fragment, { children: [_jsx(TimeTravelControls, { snapshots: snapshots, selectedIndex: snapshotIdx, onIndexChange: handleSnapshotChange, size: size }), _jsxs("div", { style: { flex: 1, display: "flex", overflow: "hidden" }, children: [renderFlowchart && (_jsx("div", { style: { flex: 1, overflow: "hidden", borderRight: `1px solid ${theme.border}` }, children: renderFlowchart({ snapshots, selectedIndex: snapshotIdx, onNodeClick: handleSnapshotChange }) })), _jsx(NarrativeTrace, { narrative: narrative, revealedCount: revealedCount, size: size, style: {
                                            width: renderFlowchart ? "40%" : "100%",
                                            minWidth: 280,
                                        } })] })] }))] })] }));
}
//# sourceMappingURL=ExplainableShell.js.map