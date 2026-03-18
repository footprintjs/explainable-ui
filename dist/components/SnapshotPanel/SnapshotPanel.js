import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { theme, fontSize, padding } from "../../theme";
import { MemoryInspector } from "../MemoryInspector";
import { NarrativeLog } from "../NarrativeLog";
import { GanttTimeline } from "../GanttTimeline";
/**
 * All-in-one panel: time-travel scrubber + memory inspector + narrative log + gantt.
 * Drop this into any page to make a pipeline run inspectable.
 */
export function SnapshotPanel({ snapshots, showGantt = true, showScrubber = true, title = "Pipeline Inspector", size = "default", unstyled = false, className, style, }) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const fs = fontSize[size];
    const pad = padding[size];
    if (snapshots.length === 0) {
        return (_jsx("div", { className: className, style: {
                padding: pad * 2,
                textAlign: "center",
                color: unstyled ? undefined : theme.textMuted,
                fontSize: fs.body,
                ...style,
            }, "data-fp": "snapshot-panel", children: "No snapshots to display" }));
    }
    if (unstyled) {
        return (_jsxs("div", { className: className, style: style, "data-fp": "snapshot-panel", children: [_jsx("h3", { children: title }), showScrubber && (_jsx("input", { type: "range", min: 0, max: snapshots.length - 1, value: selectedIndex, onChange: (e) => setSelectedIndex(parseInt(e.target.value)) })), _jsx(MemoryInspector, { snapshots: snapshots, selectedIndex: selectedIndex, unstyled: true }), _jsx(NarrativeLog, { snapshots: snapshots, selectedIndex: selectedIndex, unstyled: true }), showGantt && (_jsx(GanttTimeline, { snapshots: snapshots, selectedIndex: selectedIndex, onSelect: setSelectedIndex, unstyled: true }))] }));
    }
    return (_jsxs("div", { className: className, style: {
            display: "flex",
            flexDirection: "column",
            height: "100%",
            background: theme.bgPrimary,
            fontFamily: theme.fontSans,
            overflow: "hidden",
            ...style,
        }, "data-fp": "snapshot-panel", children: [_jsxs("div", { style: {
                    padding: `${pad}px ${pad + 4}px`,
                    borderBottom: `1px solid ${theme.border}`,
                    background: theme.bgSecondary,
                    flexShrink: 0,
                }, children: [_jsxs("div", { style: {
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: showScrubber ? 8 : 0,
                        }, children: [_jsx("span", { style: {
                                    fontSize: fs.body + 2,
                                    fontWeight: 600,
                                    color: theme.textPrimary,
                                }, children: title }), _jsxs("span", { style: {
                                    fontSize: fs.small,
                                    color: theme.textMuted,
                                    fontFamily: theme.fontMono,
                                }, children: [selectedIndex + 1, "/", snapshots.length] })] }), showScrubber && (_jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [_jsx(ScrubButton, { label: "\\u25C0", disabled: selectedIndex === 0, onClick: () => setSelectedIndex((i) => Math.max(0, i - 1)) }), _jsx("input", { type: "range", min: 0, max: snapshots.length - 1, value: selectedIndex, onChange: (e) => setSelectedIndex(parseInt(e.target.value)), style: {
                                    flex: 1,
                                    height: 4,
                                    accentColor: theme.primary,
                                    cursor: "pointer",
                                } }), _jsx(ScrubButton, { label: "\\u25B6", disabled: selectedIndex === snapshots.length - 1, onClick: () => setSelectedIndex((i) => Math.min(snapshots.length - 1, i + 1)) })] }))] }), _jsxs("div", { style: { flex: 1, overflow: "auto" }, children: [_jsx(MemoryInspector, { snapshots: snapshots, selectedIndex: selectedIndex, size: size }), _jsx("div", { style: {
                            height: 1,
                            background: theme.border,
                            margin: `0 ${pad}px`,
                        } }), _jsx(NarrativeLog, { snapshots: snapshots, selectedIndex: selectedIndex, size: size })] }), showGantt && (_jsx("div", { style: {
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
//# sourceMappingURL=SnapshotPanel.js.map