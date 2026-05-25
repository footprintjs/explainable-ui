import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { memo, useEffect, useRef } from "react";
import { Handle, Position } from "@xyflow/react";
import { theme } from "../../theme";
const KEYFRAMES_ID = "fp-stage-node-keyframes";
const KEYFRAMES_CSS = `
@media (prefers-reduced-motion: no-preference) {
  @keyframes fp-pulse {
    0%, 100% { opacity: 0.4; transform: scale(1); }
    50% { opacity: 0.15; transform: scale(1.06); }
  }
  @keyframes fp-blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
}
@media (prefers-reduced-motion: reduce) {
  @keyframes fp-pulse { 0%, 100% { opacity: 0.3; } }
  @keyframes fp-blink { 0%, 100% { opacity: 1; } }
}
`;
// ── Stage icon SVGs ───────────────────────────────────────────────────────
// Inline SVGs for crisp rendering at any size. Consumers pass a string key
// via SpecNode.icon; StageNode renders the matching mini-icon.
const ICON_SIZE = 16;
function StageIcon({ type, color }) {
    const s = ICON_SIZE;
    const props = { width: s, height: s, viewBox: `0 0 ${s} ${s}`, fill: "none", style: { flexShrink: 0 } };
    switch (type) {
        // LLM / AI call — brain/sparkle
        case "llm":
        case "ai":
            return (_jsxs("svg", { ...props, children: [_jsx("circle", { cx: "8", cy: "8", r: "6", stroke: color, strokeWidth: "1.5" }), _jsx("path", { d: "M5.5 8C5.5 6.5 6.5 5 8 5S10.5 6.5 10.5 8", stroke: color, strokeWidth: "1.2", strokeLinecap: "round" }), _jsx("circle", { cx: "8", cy: "9.5", r: "1", fill: color }), _jsx("line", { x1: "8", y1: "2", x2: "8", y2: "3.5", stroke: color, strokeWidth: "1", strokeLinecap: "round" }), _jsx("line", { x1: "12.5", y1: "4", x2: "11.2", y2: "5", stroke: color, strokeWidth: "1", strokeLinecap: "round" }), _jsx("line", { x1: "3.5", y1: "4", x2: "4.8", y2: "5", stroke: color, strokeWidth: "1", strokeLinecap: "round" })] }));
        // Tool / function call — gear
        case "tool":
        case "function":
            return (_jsxs("svg", { ...props, children: [_jsx("circle", { cx: "8", cy: "8", r: "3", stroke: color, strokeWidth: "1.5" }), [0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
                        const rad = (angle * Math.PI) / 180;
                        const x1 = 8 + Math.cos(rad) * 4.5;
                        const y1 = 8 + Math.sin(rad) * 4.5;
                        const x2 = 8 + Math.cos(rad) * 6;
                        const y2 = 8 + Math.sin(rad) * 6;
                        return _jsx("line", { x1: x1, y1: y1, x2: x2, y2: y2, stroke: color, strokeWidth: "1.5", strokeLinecap: "round" }, angle);
                    })] }));
        // RAG / retrieval — magnifying glass + doc
        case "rag":
        case "search":
        case "retrieval":
            return (_jsxs("svg", { ...props, children: [_jsx("circle", { cx: "7", cy: "7", r: "4", stroke: color, strokeWidth: "1.5" }), _jsx("line", { x1: "10", y1: "10", x2: "13.5", y2: "13.5", stroke: color, strokeWidth: "1.5", strokeLinecap: "round" }), _jsx("line", { x1: "5.5", y1: "6", x2: "8.5", y2: "6", stroke: color, strokeWidth: "1", strokeLinecap: "round" }), _jsx("line", { x1: "5.5", y1: "8", x2: "7.5", y2: "8", stroke: color, strokeWidth: "1", strokeLinecap: "round" })] }));
        // Parse / process — diamond with arrows
        case "parse":
        case "process":
        case "transform":
            return (_jsx("svg", { ...props, children: _jsx("rect", { x: "4", y: "4", width: "8", height: "8", rx: "1.5", stroke: color, strokeWidth: "1.5", transform: "rotate(45 8 8)" }) }));
        // Start / seed — play triangle
        case "start":
        case "seed":
        case "init":
            return (_jsx("svg", { ...props, children: _jsx("path", { d: "M5 3.5L12.5 8L5 12.5V3.5Z", fill: color, opacity: "0.8" }) }));
        // End / finalize — stop square
        case "end":
        case "finalize":
        case "output":
            return (_jsx("svg", { ...props, children: _jsx("rect", { x: "4", y: "4", width: "8", height: "8", rx: "1.5", fill: color, opacity: "0.8" }) }));
        // Agent — person silhouette
        case "agent":
        case "orchestrator":
            return (_jsxs("svg", { ...props, children: [_jsx("circle", { cx: "8", cy: "5", r: "2.5", stroke: color, strokeWidth: "1.5" }), _jsx("path", { d: "M3.5 14C3.5 11 5.5 9 8 9S12.5 11 12.5 14", stroke: color, strokeWidth: "1.5", strokeLinecap: "round" })] }));
        // Swarm — multi-agent
        case "swarm":
        case "multi-agent":
            return (_jsxs("svg", { ...props, children: [_jsx("circle", { cx: "5", cy: "5", r: "2", stroke: color, strokeWidth: "1.2" }), _jsx("circle", { cx: "11", cy: "5", r: "2", stroke: color, strokeWidth: "1.2" }), _jsx("circle", { cx: "8", cy: "11", r: "2", stroke: color, strokeWidth: "1.2" }), _jsx("line", { x1: "5", y1: "7", x2: "8", y2: "9", stroke: color, strokeWidth: "1", opacity: "0.5" }), _jsx("line", { x1: "11", y1: "7", x2: "8", y2: "9", stroke: color, strokeWidth: "1", opacity: "0.5" })] }));
        // Guard / guardrail — shield
        case "guard":
        case "guardrail":
        case "validate":
            return (_jsxs("svg", { ...props, children: [_jsx("path", { d: "M8 2L3 5V9C3 11.5 5 13.5 8 14.5C11 13.5 13 11.5 13 9V5L8 2Z", stroke: color, strokeWidth: "1.5", strokeLinejoin: "round" }), _jsx("path", { d: "M6 8L7.5 9.5L10 6.5", stroke: color, strokeWidth: "1.2", strokeLinecap: "round", strokeLinejoin: "round" })] }));
        // Stream — wave
        case "stream":
        case "streaming":
            return (_jsxs("svg", { ...props, children: [_jsx("path", { d: "M2 8C4 5 6 11 8 8S12 5 14 8", stroke: color, strokeWidth: "1.5", strokeLinecap: "round", fill: "none" }), _jsx("path", { d: "M2 11C4 8 6 14 8 11S12 8 14 11", stroke: color, strokeWidth: "1", strokeLinecap: "round", fill: "none", opacity: "0.5" })] }));
        // Memory / state — database cylinder
        case "memory":
        case "state":
        case "db":
            return (_jsxs("svg", { ...props, children: [_jsx("ellipse", { cx: "8", cy: "4.5", rx: "5", ry: "2", stroke: color, strokeWidth: "1.3" }), _jsx("line", { x1: "3", y1: "4.5", x2: "3", y2: "11.5", stroke: color, strokeWidth: "1.3" }), _jsx("line", { x1: "13", y1: "4.5", x2: "13", y2: "11.5", stroke: color, strokeWidth: "1.3" }), _jsx("ellipse", { cx: "8", cy: "11.5", rx: "5", ry: "2", stroke: color, strokeWidth: "1.3" })] }));
        // Loop — circular arrow
        case "loop":
        case "retry":
            return (_jsxs("svg", { ...props, children: [_jsx("path", { d: "M12 8A4 4 0 1 1 8 4", stroke: color, strokeWidth: "1.5", strokeLinecap: "round", fill: "none" }), _jsx("path", { d: "M8 1.5L10.5 4L8 6.5", stroke: color, strokeWidth: "1.3", strokeLinecap: "round", strokeLinejoin: "round", fill: "none" })] }));
        // Lazy / service — cloud (deferred resolution, loaded on demand)
        case "lazy":
        case "service":
        case "cloud":
            return (_jsx("svg", { ...props, children: _jsx("path", { d: "M4.5 12C2.8 12 1.5 10.7 1.5 9C1.5 7.5 2.5 6.3 3.8 6C4 4 5.8 2.5 8 2.5C9.8 2.5 11.3 3.5 11.9 5C13.9 5.2 15.5 6.8 15.5 8.8C15.5 10.8 13.9 12.5 11.8 12.5H4.5", stroke: color, strokeWidth: "1.3", strokeLinecap: "round", fill: "none" }) }));
        // Decision — diamond (already handled by isDecider shape)
        case "decision":
        case "router":
            return (_jsxs("svg", { ...props, children: [_jsx("path", { d: "M8 2L14 8L8 14L2 8Z", stroke: color, strokeWidth: "1.5", fill: "none" }), _jsx("circle", { cx: "8", cy: "8", r: "1.5", fill: color })] }));
        default:
            return null;
    }
}
/**
 * Custom ReactFlow node for pipeline stages.
 * All colors and fonts come from `--fp-*` CSS variables (via theme).
 * Shows execution state via color, icon, step badge, and pulse animation.
 */
export const StageNode = memo(function StageNode({ data, }) {
    const { label, active, done, error, linked, icon, stepNumbers, dimmed, isSubflow, isLazy, isDecider, isFork, description, stageId, showStageId } = data;
    // Lazy nodes show cloud icon by default (unless another icon is specified)
    const effectiveIcon = icon || (isLazy ? "lazy" : undefined);
    // Lazy + unresolved = dashed border
    const isLazyUnresolved = isLazy && !done && !active;
    // Inject keyframes once into document head
    const injectedRef = useRef(false);
    useEffect(() => {
        if (injectedRef.current)
            return;
        if (typeof document !== "undefined" && !document.getElementById(KEYFRAMES_ID)) {
            const styleEl = document.createElement("style");
            styleEl.id = KEYFRAMES_ID;
            styleEl.textContent = KEYFRAMES_CSS;
            document.head.appendChild(styleEl);
        }
        injectedRef.current = true;
    }, []);
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
                            borderRadius: isDecider ? 0 : `calc(${theme.radius} + 4px)`,
                            clipPath: isDecider ? "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" : undefined,
                            border: `2px solid ${theme.primary}`,
                            opacity: 0.4,
                            animation: "fp-pulse 2s ease-in-out infinite",
                        } })), active && (_jsx("div", { style: {
                            position: "absolute",
                            inset: -6,
                            borderRadius: isDecider ? 0 : `calc(${theme.radius} + 4px)`,
                            clipPath: isDecider ? "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" : undefined,
                            border: `2px solid ${theme.primary}`,
                            opacity: 0.3,
                            animation: "fp-pulse 1.5s ease-out infinite",
                        } })), isDecider ? (_jsxs("div", { style: { position: "relative", width: 120, height: 72 }, children: [_jsx("div", { style: {
                                    position: "absolute",
                                    inset: 0,
                                    background: bg,
                                    clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
                                    border: "none",
                                    boxShadow: shadow,
                                    transition: "all 0.3s ease",
                                } }), _jsx("div", { style: {
                                    position: "absolute",
                                    inset: -2,
                                    clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
                                    background: borderColor,
                                    zIndex: -1,
                                    ...(isLazyUnresolved ? {
                                        background: "transparent",
                                        // Dashed border via SVG for clip-path (CSS border doesn't work with clip-path)
                                    } : {}),
                                } }), _jsxs("div", { style: {
                                    position: "absolute",
                                    inset: 0,
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 1,
                                    fontFamily: theme.fontSans,
                                    zIndex: 1,
                                }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: 4 }, children: [effectiveIcon && _jsx(StageIcon, { type: effectiveIcon, color: textColor }), !effectiveIcon && (_jsx("span", { style: { fontSize: 9, color: textColor }, children: "\u25C7" })), _jsx("span", { style: {
                                                    fontSize: 11,
                                                    fontWeight: 600,
                                                    color: textColor,
                                                    whiteSpace: "nowrap",
                                                }, children: label })] }), description && (_jsx("span", { style: {
                                            fontSize: 8,
                                            fontWeight: 400,
                                            color: textColor,
                                            opacity: 0.7,
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            maxWidth: 100,
                                        }, children: description })), showStageId && stageId && (_jsx("span", { style: {
                                            fontSize: 8,
                                            fontFamily: "ui-monospace, monospace",
                                            color: textColor,
                                            opacity: 0.55,
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            maxWidth: 100,
                                        }, title: `stageId: ${stageId}`, children: stageId }))] })] })) : (
                    /* Standard rectangular node */
                    _jsxs("div", { style: {
                            background: bg,
                            border: `2px ${isLazyUnresolved ? "dashed" : "solid"} ${borderColor}`,
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
                        }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: 6 }, children: [effectiveIcon && _jsx(StageIcon, { type: effectiveIcon, color: textColor }), done && !effectiveIcon && (_jsx("span", { style: { fontSize: 10, color: textColor }, children: "\u2713" })), active && !effectiveIcon && (_jsx("span", { style: {
                                            width: 8,
                                            height: 8,
                                            borderRadius: "50%",
                                            background: "#fff",
                                            animation: "fp-blink 1s ease-in-out infinite",
                                            flexShrink: 0,
                                        } })), error && !effectiveIcon && (_jsx("span", { style: { fontSize: 10, color: textColor }, children: "\u2717" })), _jsx("span", { style: {
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
                                }, children: description })), showStageId && stageId && (_jsx("span", { style: {
                                    fontSize: 9,
                                    fontFamily: "ui-monospace, monospace",
                                    color: textColor,
                                    opacity: 0.55,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    maxWidth: 160,
                                }, title: `stageId: ${stageId}`, children: stageId }))] }))] }), _jsx(Handle, { type: "source", position: Position.Bottom, style: { opacity: 0 } }), _jsx(Handle, { id: "loop-source", type: "source", position: Position.Bottom, style: { background: "transparent", border: "none", width: 6, height: 6, left: "75%" } }), _jsx(Handle, { id: "loop-target", type: "target", position: Position.Right, style: { background: "transparent", border: "none", width: 6, height: 6 } })] }));
});
//# sourceMappingURL=StageNode.js.map