import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { theme, fontSize, padding } from "../../theme";
export function ResultPanel({ data, logs = [], hideConsole = false, size = "default", unstyled = false, className, style, }) {
    const fs = fontSize[size];
    const pad = padding[size];
    if (unstyled) {
        return (_jsxs("div", { className: className, style: style, "data-fp": "result-panel", children: [_jsx("div", { "data-fp": "result-data", children: _jsx("pre", { children: data ? JSON.stringify(data, null, 2) : "No data" }) }), !hideConsole && (_jsx("div", { "data-fp": "result-console", children: logs.map((line, i) => (_jsx("div", { "data-fp": "console-line", "data-error": line.startsWith("ERROR"), children: line }, i))) }))] }));
    }
    return (_jsxs("div", { className: className, style: {
            height: "100%",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            ...style,
        }, "data-fp": "result-panel", children: [data && (_jsxs("div", { style: { flex: 1, overflow: "auto", padding: pad }, children: [_jsx("div", { style: {
                            fontSize: fs.label,
                            fontWeight: 600,
                            color: theme.textMuted,
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            marginBottom: 8,
                        }, children: size === "compact" ? "Result" : "Business Result (Scope)" }), _jsx("pre", { style: {
                            fontSize: fs.body,
                            fontFamily: theme.fontMono,
                            color: theme.textPrimary,
                            background: theme.bgSecondary,
                            padding: pad,
                            borderRadius: theme.radius,
                            overflow: "auto",
                            margin: 0,
                        }, children: JSON.stringify(data, null, 2) })] })), !hideConsole && (_jsxs("div", { style: {
                    borderTop: `1px solid ${theme.border}`,
                    padding: pad,
                    overflow: "auto",
                    maxHeight: "40%",
                    flexShrink: 0,
                }, children: [_jsx("div", { style: {
                            fontSize: fs.label,
                            fontWeight: 600,
                            color: theme.textMuted,
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            marginBottom: 8,
                        }, children: "Console" }), logs.length === 0 && (_jsx("div", { style: { fontSize: fs.body, color: theme.textMuted, fontStyle: "italic" }, children: "No console output" })), logs.map((line, i) => (_jsx("div", { style: {
                            fontSize: fs.body,
                            fontFamily: theme.fontMono,
                            color: line.startsWith("ERROR") ? theme.error : theme.textPrimary,
                            padding: "2px 0",
                            borderBottom: `1px solid ${theme.bgSecondary}`,
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                        }, children: line }, i)))] }))] }));
}
//# sourceMappingURL=ResultPanel.js.map