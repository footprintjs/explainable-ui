import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from "react";
import { theme, fontSize, padding } from "../../theme";
/**
 * Displays pipeline memory state as formatted JSON.
 * Supports both static (data prop) and time-travel (snapshots + selectedIndex) modes.
 */
export function MemoryInspector({ data, snapshots, selectedIndex = 0, showTypes = false, highlightNew = true, size = "default", unstyled = false, className, style, }) {
    // Compute accumulated memory from snapshots
    const { memory, newKeys } = useMemo(() => {
        if (data) {
            return { memory: data, newKeys: new Set() };
        }
        if (!snapshots || snapshots.length === 0) {
            return { memory: {}, newKeys: new Set() };
        }
        const merged = {};
        for (let i = 0; i <= Math.min(selectedIndex, snapshots.length - 1); i++) {
            Object.assign(merged, snapshots[i]?.memory);
        }
        const nk = new Set();
        if (highlightNew && selectedIndex > 0) {
            const prev = {};
            for (let i = 0; i < selectedIndex; i++) {
                Object.assign(prev, snapshots[i]?.memory);
            }
            const current = snapshots[selectedIndex]?.memory ?? {};
            for (const k of Object.keys(current)) {
                if (!(k in prev))
                    nk.add(k);
            }
        }
        else if (highlightNew && selectedIndex === 0 && snapshots[0]) {
            for (const k of Object.keys(snapshots[0].memory))
                nk.add(k);
        }
        return { memory: merged, newKeys: nk };
    }, [data, snapshots, selectedIndex, highlightNew]);
    const entries = Object.entries(memory);
    const fs = fontSize[size];
    const pad = padding[size];
    if (unstyled) {
        return (_jsxs("div", { className: className, style: style, "data-fp": "memory-inspector", children: [_jsx("div", { "data-fp": "memory-label", children: "Memory State" }), _jsx("pre", { "data-fp": "memory-json", children: JSON.stringify(memory, null, 2) })] }));
    }
    return (_jsxs("div", { className: className, style: {
            padding: pad,
            fontFamily: theme.fontSans,
            ...style,
        }, "data-fp": "memory-inspector", children: [_jsx("span", { style: {
                    fontSize: fs.label,
                    fontWeight: 600,
                    color: theme.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                }, children: "Memory State" }), _jsxs("div", { style: {
                    marginTop: 8,
                    background: theme.bgSecondary,
                    border: `1px solid ${theme.border}`,
                    borderRadius: theme.radius,
                    padding: `${pad}px ${pad + 4}px`,
                    fontFamily: theme.fontMono,
                    fontSize: fs.body,
                    lineHeight: 1.8,
                }, children: [_jsx("span", { style: { color: theme.textMuted }, children: "{" }), entries.length === 0 && (_jsx("div", { style: {
                            paddingLeft: 16,
                            color: theme.textMuted,
                            fontStyle: "italic",
                        }, children: "// empty" })), entries.map(([key, value], i) => {
                        const isNew = newKeys.has(key);
                        const isLast = i === entries.length - 1;
                        return (_jsxs("div", { style: {
                                paddingLeft: 16,
                                background: isNew
                                    ? `color-mix(in srgb, ${theme.success} 10%, transparent)`
                                    : "transparent",
                                borderRadius: 4,
                                marginLeft: -4,
                                marginRight: -4,
                                paddingRight: 4,
                            }, children: [_jsxs("span", { style: { color: theme.primary }, children: ["\"", key, "\""] }), _jsx("span", { style: { color: theme.textMuted }, children: ": " }), _jsx("span", { style: { color: theme.success }, children: formatValue(value) }), showTypes && (_jsxs("span", { style: {
                                        color: theme.textMuted,
                                        fontSize: fs.small,
                                        marginLeft: 8,
                                        opacity: 0.6,
                                    }, children: ["(", typeof value, ")"] })), !isLast && _jsx("span", { style: { color: theme.textMuted }, children: "," })] }, key));
                    }), _jsx("span", { style: { color: theme.textMuted }, children: "}" })] })] }));
}
function formatValue(value) {
    if (typeof value === "string")
        return `"${value}"`;
    if (typeof value === "object" && value !== null)
        return JSON.stringify(value);
    return String(value);
}
//# sourceMappingURL=MemoryInspector.js.map