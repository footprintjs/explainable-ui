import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { theme } from "../../theme";
/**
 * Custom ReactFlow node for pipeline stages.
 * All colors and fonts come from `--fp-*` CSS variables (via theme).
 * Shows execution state via color, icon, step badge, and pulse animation.
 */
export const StageNode = memo(function StageNode({ data, }) {
    const { label, active, done, error, linked, stepNumbers, dimmed, isSubflow, description } = data;
    const isOnPath = active || done;
    const bg = active
        ? theme.primary
        : done
            ? theme.success
            : error
                ? theme.error
                : theme.bgSecondary;
    const borderColor = active
        ? theme.primary
        : done
            ? theme.success
            : error
                ? theme.error
                : theme.border;
    const shadow = active
        ? `0 0 16px color-mix(in srgb, ${theme.primary} 40%, transparent)`
        : done
            ? `0 0 8px color-mix(in srgb, ${theme.success} 20%, transparent)`
            : error
                ? `0 0 12px color-mix(in srgb, ${theme.error} 30%, transparent)`
                : `0 2px 8px rgba(0,0,0,0.15)`;
    // Colored states use white for contrast; default uses consumer's text color.
    const textColor = active || done || error ? "#fff" : theme.textPrimary;
    return (_jsxs(_Fragment, { children: [_jsx(Handle, { type: "target", position: Position.Top, style: { opacity: 0 } }), _jsxs("div", { style: {
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                }, children: [stepNumbers && stepNumbers.length > 0 && isOnPath && (_jsx("div", { style: {
                            position: "absolute",
                            top: -10,
                            left: -10,
                            display: "flex",
                            gap: 3,
                            zIndex: 10,
                        }, children: stepNumbers.map((num, i) => {
                            const isLatest = i === stepNumbers.length - 1;
                            const badgeBg = isLatest && active ? theme.primary : theme.success;
                            const glow = isLatest && active
                                ? `color-mix(in srgb, ${theme.primary} 50%, transparent)`
                                : `color-mix(in srgb, ${theme.success} 40%, transparent)`;
                            return (_jsx("div", { style: {
                                    width: 22,
                                    height: 22,
                                    borderRadius: "50%",
                                    background: badgeBg,
                                    color: "#fff",
                                    fontSize: 11,
                                    fontWeight: 700,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    boxShadow: `0 0 8px ${glow}`,
                                }, children: num }, num));
                        }) })), linked && (_jsx("div", { style: {
                            position: "absolute",
                            inset: -6,
                            borderRadius: `calc(${theme.radius} + 4px)`,
                            border: `2px solid ${theme.primary}`,
                            opacity: 0.4,
                            animation: "fp-pulse 2s ease-in-out infinite",
                        } })), active && (_jsx("div", { style: {
                            position: "absolute",
                            inset: -6,
                            borderRadius: `calc(${theme.radius} + 4px)`,
                            border: `2px solid ${theme.primary}`,
                            opacity: 0.3,
                            animation: "fp-pulse 1.5s ease-out infinite",
                        } })), _jsxs("div", { style: {
                            background: bg,
                            border: `2px solid ${borderColor}`,
                            borderRadius: theme.radius,
                            padding: description ? "8px 16px" : "10px 20px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: description ? 2 : 0,
                            boxShadow: shadow,
                            transition: "all 0.3s ease",
                            fontFamily: theme.fontSans,
                            minWidth: 100,
                            justifyContent: "center",
                        }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: 6 }, children: [done && (_jsx("span", { style: { fontSize: 10, color: textColor }, children: "\u2713" })), active && (_jsx("span", { style: {
                                            width: 8,
                                            height: 8,
                                            borderRadius: "50%",
                                            background: "#fff",
                                            animation: "fp-blink 1s ease-in-out infinite",
                                            flexShrink: 0,
                                        } })), error && (_jsx("span", { style: { fontSize: 10, color: textColor }, children: "\u2717" })), _jsx("span", { style: {
                                            fontSize: 13,
                                            fontWeight: 500,
                                            color: textColor,
                                            whiteSpace: "nowrap",
                                        }, children: label }), isSubflow && (_jsx("span", { style: {
                                            display: "inline-flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            width: 16,
                                            height: 16,
                                            borderRadius: 3,
                                            border: `1.5px solid ${textColor}`,
                                            position: "relative",
                                            opacity: 0.7,
                                            flexShrink: 0,
                                        }, children: _jsx("span", { style: {
                                                width: 8,
                                                height: 8,
                                                borderRadius: 2,
                                                border: `1px solid ${textColor}`,
                                            } }) }))] }), description && (_jsx("span", { style: {
                                    fontSize: 10,
                                    fontWeight: 400,
                                    color: textColor,
                                    opacity: 0.7,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    maxWidth: 160,
                                }, children: description }))] })] }), _jsx(Handle, { type: "source", position: Position.Bottom, style: { opacity: 0 } }), _jsx(Handle, { id: "loop-source", type: "source", position: Position.Right, style: { background: "transparent", border: "none", width: 6, height: 6 } }), _jsx(Handle, { id: "loop-target", type: "target", position: Position.Right, style: { background: "transparent", border: "none", width: 6, height: 6 } })] }));
});
//# sourceMappingURL=StageNode.js.map