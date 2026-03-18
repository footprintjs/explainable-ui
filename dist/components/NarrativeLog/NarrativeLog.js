import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from "react";
import { theme, fontSize, padding } from "../../theme";
/**
 * Timeline-style execution log showing what happened at each stage.
 * Supports both full snapshots mode and single-narrative mode.
 */
export function NarrativeLog({ snapshots, selectedIndex, narrative, size = "default", unstyled = false, className, style, }) {
    const entries = useMemo(() => {
        if (narrative) {
            return [{ label: "Output", text: narrative, isCurrent: true }];
        }
        const idx = selectedIndex ?? snapshots.length - 1;
        return snapshots.slice(0, idx + 1).map((s, i) => ({
            label: s.stageLabel,
            text: s.narrative,
            isCurrent: i === idx,
        }));
    }, [snapshots, selectedIndex, narrative]);
    const fs = fontSize[size];
    const pad = padding[size];
    if (unstyled) {
        return (_jsx("div", { className: className, style: style, "data-fp": "narrative-log", children: entries.map((entry, i) => (_jsxs("div", { "data-fp": "narrative-entry", "data-current": entry.isCurrent, children: [_jsx("strong", { children: entry.label }), _jsx("p", { children: entry.text })] }, i))) }));
    }
    return (_jsxs("div", { className: className, style: { padding: pad, fontFamily: theme.fontSans, ...style }, "data-fp": "narrative-log", children: [_jsx("span", { style: {
                    fontSize: fs.label,
                    fontWeight: 600,
                    color: theme.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                }, children: "Execution Log" }), _jsx("div", { style: { marginTop: 8, display: "flex", flexDirection: "column" }, children: entries.map((entry, i) => (_jsxs("div", { style: {
                        display: "flex",
                        gap: 10,
                        padding: `${pad}px 0`,
                        borderBottom: i < entries.length - 1 ? `1px solid ${theme.border}` : "none",
                    }, children: [_jsxs("div", { style: {
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                width: 12,
                                flexShrink: 0,
                                paddingTop: 5,
                            }, children: [_jsx("div", { style: {
                                        width: 8,
                                        height: 8,
                                        borderRadius: "50%",
                                        background: entry.isCurrent ? theme.primary : theme.success,
                                        flexShrink: 0,
                                    } }), i < entries.length - 1 && (_jsx("div", { style: {
                                        width: 1,
                                        flex: 1,
                                        background: theme.border,
                                        marginTop: 4,
                                    } }))] }), _jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [_jsx("span", { style: {
                                        fontSize: fs.label,
                                        fontWeight: 600,
                                        color: entry.isCurrent ? theme.primary : theme.textMuted,
                                    }, children: entry.label }), _jsx("div", { style: {
                                        fontSize: fs.body,
                                        lineHeight: 1.5,
                                        color: entry.isCurrent ? theme.textPrimary : theme.textSecondary,
                                        marginTop: 2,
                                    }, children: entry.text })] })] }, i))) })] }));
}
//# sourceMappingURL=NarrativeLog.js.map