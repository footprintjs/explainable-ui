import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from "react";
import { theme, fontSize, padding } from "../../theme";
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function computeDiff(prev, curr) {
    const entries = [];
    const allKeys = new Set([...Object.keys(prev ?? {}), ...Object.keys(curr)]);
    for (const key of allKeys) {
        const inPrev = prev != null && key in prev;
        const inCurr = key in curr;
        const oldVal = prev?.[key];
        const newVal = curr[key];
        if (!inPrev && inCurr) {
            entries.push({ key, type: "added", newValue: newVal });
        }
        else if (inPrev && !inCurr) {
            entries.push({ key, type: "removed", oldValue: oldVal });
        }
        else if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
            entries.push({ key, type: "changed", oldValue: oldVal, newValue: newVal });
        }
        else {
            entries.push({ key, type: "unchanged", newValue: newVal });
        }
    }
    const order = { added: 0, changed: 1, removed: 2, unchanged: 3 };
    entries.sort((a, b) => order[a.type] - order[b.type]);
    return entries;
}
function fmt(v) {
    if (typeof v === "string")
        return `"${v}"`;
    if (typeof v === "object" && v !== null)
        return JSON.stringify(v, null, 2);
    return String(v);
}
const diffColors = {
    added: { bg: `color-mix(in srgb, ${theme.success} 10%, transparent)`, fg: theme.success, icon: "+" },
    removed: { bg: `color-mix(in srgb, ${theme.error} 10%, transparent)`, fg: theme.error, icon: "-" },
    changed: { bg: `color-mix(in srgb, ${theme.warning} 10%, transparent)`, fg: theme.warning, icon: "~" },
    unchanged: { bg: "transparent", fg: "", icon: " " },
};
// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function ScopeDiff({ previous, current, hideUnchanged = false, size = "default", unstyled = false, className, style, }) {
    const entries = useMemo(() => computeDiff(previous, current), [previous, current]);
    const visible = hideUnchanged ? entries.filter((e) => e.type !== "unchanged") : entries;
    const fs = fontSize[size];
    const pad = padding[size];
    if (unstyled) {
        return (_jsx("div", { className: className, style: style, "data-fp": "scope-diff", children: visible.map((e) => (_jsxs("div", { "data-fp": "diff-entry", "data-type": e.type, children: [_jsx("span", { "data-fp": "diff-key", children: e.key }), e.type === "changed" && (_jsxs(_Fragment, { children: [_jsx("span", { "data-fp": "diff-old", children: fmt(e.oldValue) }), _jsx("span", { "data-fp": "diff-new", children: fmt(e.newValue) })] })), (e.type === "added" || e.type === "unchanged") && (_jsx("span", { "data-fp": "diff-value", children: fmt(e.newValue) })), e.type === "removed" && (_jsx("span", { "data-fp": "diff-value", children: fmt(e.oldValue) }))] }, e.key))) }));
    }
    return (_jsxs("div", { className: className, style: { padding: pad, fontFamily: theme.fontMono, ...style }, "data-fp": "scope-diff", children: [visible.length === 0 && (_jsx("div", { style: { fontSize: fs.body, color: theme.textMuted, fontStyle: "italic" }, children: "No changes" })), visible.map((entry) => {
                const dc = diffColors[entry.type];
                return (_jsxs("div", { style: {
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 8,
                        padding: `4px ${pad - 4}px`,
                        marginBottom: 2,
                        borderRadius: 4,
                        background: dc.bg,
                        fontSize: fs.body,
                        lineHeight: 1.5,
                    }, "data-fp": "diff-entry", children: [_jsx("span", { style: {
                                width: 16,
                                flexShrink: 0,
                                fontWeight: 700,
                                color: dc.fg || theme.textMuted,
                                textAlign: "center",
                            }, children: dc.icon }), _jsx("span", { style: { color: theme.primary, fontWeight: 600, flexShrink: 0 }, children: entry.key }), _jsx("span", { style: { color: theme.textMuted }, children: "=" }), entry.type === "changed" ? (_jsxs("span", { children: [_jsx("span", { style: {
                                        color: theme.error,
                                        textDecoration: "line-through",
                                        opacity: 0.7,
                                    }, children: fmt(entry.oldValue) }), _jsx("span", { style: { color: theme.textMuted, margin: "0 4px" }, children: "\u2192" }), _jsx("span", { style: { color: theme.success }, children: fmt(entry.newValue) })] })) : (_jsx("span", { style: {
                                color: entry.type === "added"
                                    ? theme.success
                                    : entry.type === "removed"
                                        ? theme.error
                                        : theme.textPrimary,
                            }, children: fmt(entry.type === "removed" ? entry.oldValue : entry.newValue) }))] }, entry.key));
            })] }));
}
//# sourceMappingURL=ScopeDiff.js.map