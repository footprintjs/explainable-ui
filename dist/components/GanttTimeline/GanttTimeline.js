import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo, useRef, useEffect } from "react";
import { theme, fontSize, padding } from "../../theme";
/**
 * Horizontal Gantt-style timeline showing stage durations and overlap.
 * Collapses to `maxVisibleRows` with expand/collapse toggle.
 * Auto-scrolls to keep the active stage visible when collapsed.
 */
export function GanttTimeline({ snapshots, selectedIndex = 0, onSelect, size = "default", unstyled = false, className, style, maxVisibleRows = 5, }) {
    const [expanded, setExpanded] = useState(false);
    const activeRowRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const totalWallTime = useMemo(() => Math.max(...snapshots.map((s) => s.startMs + s.durationMs), 1), [snapshots]);
    const fs = fontSize[size];
    const pad = padding[size];
    const labelWidth = size === "compact" ? 50 : size === "detailed" ? 100 : 80;
    const msWidth = size === "compact" ? 28 : 36;
    const rowHeight = size === "compact" ? 18 : 22;
    const collapsible = maxVisibleRows > 0 && snapshots.length > maxVisibleRows;
    const showAll = expanded || !collapsible;
    // Auto-scroll to active row when collapsed
    useEffect(() => {
        if (!showAll && activeRowRef.current && scrollContainerRef.current) {
            activeRowRef.current.scrollIntoView({
                block: "nearest",
                behavior: "smooth",
            });
        }
    }, [selectedIndex, showAll]);
    if (unstyled) {
        return (_jsx("div", { className: className, style: style, "data-fp": "gantt-timeline", role: "listbox", "aria-label": "Execution timeline", children: snapshots.map((snap, idx) => (_jsxs("div", { "data-fp": "gantt-bar", "data-selected": idx === selectedIndex, "data-visible": idx <= selectedIndex, role: "option", "aria-selected": idx === selectedIndex, "aria-label": `${snap.stageLabel}, ${snap.durationMs}ms`, onClick: () => onSelect?.(idx), children: [_jsx("span", { "data-fp": "gantt-label", children: snap.stageLabel }), _jsxs("span", { "data-fp": "gantt-duration", children: [snap.durationMs, "ms"] })] }, `${snap.stageName}-${idx}`))) }));
    }
    return (_jsxs("div", { className: className, style: { padding: pad, fontFamily: theme.fontSans, ...style }, "data-fp": "gantt-timeline", children: [_jsxs("div", { style: {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }, children: [_jsx("span", { style: {
                            fontSize: fs.label,
                            fontWeight: 600,
                            color: theme.textMuted,
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                        }, children: size === "compact" ? "Timeline" : "Execution Timeline" }), collapsible && (_jsx("button", { onClick: () => setExpanded((e) => !e), style: {
                            background: "none",
                            border: `1px solid ${theme.border}`,
                            borderRadius: 4,
                            color: theme.textSecondary,
                            fontSize: fs.small,
                            padding: "2px 8px",
                            cursor: "pointer",
                            fontFamily: theme.fontSans,
                        }, children: expanded
                            ? "Collapse"
                            : `${snapshots.length - maxVisibleRows} more...` }))] }), _jsx("div", { ref: scrollContainerRef, role: "listbox", "aria-label": "Execution timeline", style: {
                    marginTop: 8,
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    ...(showAll
                        ? {}
                        : {
                            maxHeight: maxVisibleRows * (rowHeight + 4),
                            overflowY: "auto",
                            scrollbarWidth: "thin",
                        }),
                }, children: snapshots.map((snap, idx) => {
                    const leftPct = (snap.startMs / totalWallTime) * 100;
                    const widthPct = Math.max((snap.durationMs / totalWallTime) * 100, 1);
                    const isSelected = idx === selectedIndex;
                    const isVisible = idx <= selectedIndex;
                    return (_jsxs("div", { ref: isSelected ? activeRowRef : undefined, role: "option", "aria-selected": isSelected, "aria-label": `${snap.stageLabel}, ${snap.durationMs}ms`, onClick: () => onSelect?.(idx), style: {
                            display: "flex",
                            alignItems: "center",
                            gap: size === "compact" ? 4 : 8,
                            cursor: onSelect ? "pointer" : "default",
                            opacity: isVisible ? 1 : 0.3,
                            transition: "opacity 0.3s ease",
                            height: rowHeight,
                            flexShrink: 0,
                        }, children: [_jsx("span", { title: snap.stageLabel, style: {
                                    width: labelWidth,
                                    fontSize: fs.small,
                                    color: isSelected ? theme.primary : theme.textMuted,
                                    fontWeight: isSelected ? 600 : 400,
                                    textAlign: "right",
                                    flexShrink: 0,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }, children: snap.stageLabel }), _jsx("div", { style: {
                                    flex: 1,
                                    height: size === "compact" ? 6 : 8,
                                    position: "relative",
                                    background: theme.bgTertiary,
                                    borderRadius: 3,
                                }, children: isVisible && (_jsx("div", { style: {
                                        position: "absolute",
                                        left: `${leftPct}%`,
                                        top: 0,
                                        width: `${widthPct}%`,
                                        height: "100%",
                                        borderRadius: 3,
                                        background: isSelected ? theme.primary : theme.success,
                                        transition: "width 0.3s ease",
                                    } })) }), _jsxs("span", { style: {
                                    fontSize: fs.small,
                                    color: theme.textMuted,
                                    fontFamily: theme.fontMono,
                                    width: msWidth,
                                    flexShrink: 0,
                                }, children: [snap.durationMs, "ms"] })] }, `${snap.stageName}-${idx}`));
                }) }), _jsxs("div", { style: {
                    marginTop: 4,
                    marginLeft: labelWidth + (size === "compact" ? 4 : 8),
                    marginRight: msWidth + (size === "compact" ? 4 : 8),
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: fs.small - 1,
                    color: theme.textMuted,
                    fontFamily: theme.fontMono,
                }, children: [_jsx("span", { children: "0ms" }), size !== "compact" && (_jsxs("span", { children: [(totalWallTime / 2).toFixed(1), "ms"] })), _jsxs("span", { children: [totalWallTime.toFixed(1), "ms"] })] })] }));
}
//# sourceMappingURL=GanttTimeline.js.map