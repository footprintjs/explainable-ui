import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { theme, fontSize, padding } from "../../theme";
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function parseGroups(lines) {
    const groups = [];
    let current = null;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trimStart();
        const isStep = trimmed.startsWith("Step ") || /^\s/.test(line);
        if (!isStep || !current) {
            current = { header: line, headerIdx: i, steps: [] };
            groups.push(current);
        }
        else {
            current.steps.push({ text: trimmed, idx: i });
        }
    }
    return groups;
}
// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function NarrativeTrace({ narrative, revealedCount, defaultCollapsed = false, onStageClick, size = "default", unstyled = false, className, style, }) {
    const revealed = revealedCount != null ? narrative.slice(0, revealedCount) : narrative;
    const future = revealedCount != null ? narrative.slice(revealedCount) : [];
    const revealedGroups = useMemo(() => parseGroups(revealed), [revealed]);
    const futureGroups = useMemo(() => parseGroups(future), [future]);
    const [collapsedSet, setCollapsedSet] = useState(() => {
        if (!defaultCollapsed)
            return new Set();
        return new Set(parseGroups(narrative).map((g) => g.headerIdx));
    });
    const latestRef = useRef(null);
    useEffect(() => {
        latestRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, [revealedGroups.length]);
    const toggle = useCallback((idx) => {
        setCollapsedSet((prev) => {
            const next = new Set(prev);
            if (next.has(idx))
                next.delete(idx);
            else
                next.add(idx);
            return next;
        });
    }, []);
    const lastIdx = revealedGroups.length - 1;
    const fs = fontSize[size];
    const pad = padding[size];
    // ── Unstyled mode ──
    if (unstyled) {
        return (_jsxs("div", { className: className, style: style, "data-fp": "narrative-trace", children: [revealedGroups.map((group, gi) => (_jsxs("div", { "data-fp": "narrative-group", "data-latest": gi === lastIdx, children: [_jsx("div", { "data-fp": "narrative-header", "data-collapsible": group.steps.length > 0, "data-collapsed": collapsedSet.has(group.headerIdx), onClick: () => {
                                if (group.steps.length > 0)
                                    toggle(group.headerIdx);
                                onStageClick?.(group.headerIdx);
                            }, children: group.header }), !collapsedSet.has(group.headerIdx) &&
                            group.steps.map((step) => (_jsx("div", { "data-fp": "narrative-step", children: step.text }, step.idx)))] }, group.headerIdx))), futureGroups.map((group) => (_jsxs("div", { "data-fp": "narrative-group", "data-future": true, children: [_jsx("div", { "data-fp": "narrative-header", children: group.header }), group.steps.map((step) => (_jsx("div", { "data-fp": "narrative-step", children: step.text }, `f-${step.idx}`)))] }, `f-${group.headerIdx}`)))] }));
    }
    // ── Styled mode ──
    return (_jsxs("div", { className: className, style: {
            flex: 1,
            overflow: "auto",
            padding: pad,
            fontFamily: theme.fontMono,
            ...style,
        }, "data-fp": "narrative-trace", children: [revealedGroups.map((group, gi) => {
                const isLatest = gi === lastIdx;
                const isCollapsed = collapsedSet.has(group.headerIdx);
                const hasSteps = group.steps.length > 0;
                return (_jsxs("div", { ref: isLatest ? latestRef : undefined, style: { marginBottom: 2 }, "data-fp": "narrative-group", children: [_jsxs("div", { onClick: () => {
                                if (hasSteps)
                                    toggle(group.headerIdx);
                                onStageClick?.(group.headerIdx);
                            }, style: {
                                fontSize: fs.body,
                                lineHeight: 1.7,
                                color: isLatest ? theme.textPrimary : theme.textSecondary,
                                padding: `4px ${pad - 4}px`,
                                borderRadius: 4,
                                background: isLatest ? theme.bgTertiary : "transparent",
                                borderLeft: isLatest
                                    ? `3px solid ${theme.primary}`
                                    : `3px solid ${theme.success}`,
                                cursor: hasSteps ? "pointer" : "default",
                                fontWeight: 600,
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                userSelect: "none",
                                transition: "all 0.15s ease",
                            }, children: [hasSteps && (_jsx("span", { style: {
                                        fontSize: fs.small - 1,
                                        color: theme.textMuted,
                                        transition: "transform 0.15s ease",
                                        transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
                                        display: "inline-block",
                                        width: 10,
                                        flexShrink: 0,
                                    }, children: "\u25BC" })), !hasSteps && _jsx("span", { style: { width: 10, flexShrink: 0 } }), _jsx("span", { children: group.header })] }), !isCollapsed &&
                            group.steps.map((step) => (_jsx("div", { style: {
                                    fontSize: fs.small,
                                    lineHeight: 1.6,
                                    color: isLatest ? theme.textSecondary : theme.textMuted,
                                    padding: `2px ${pad - 4}px 2px ${pad + 20}px`,
                                    opacity: isLatest ? 0.9 : 0.7,
                                    transition: "all 0.15s ease",
                                }, "data-fp": "narrative-step", children: step.text }, step.idx)))] }, group.headerIdx));
            }), futureGroups.length > 0 && (_jsx("div", { style: { opacity: 0.2 }, children: futureGroups.map((group) => (_jsxs("div", { style: { marginBottom: 2 }, children: [_jsx("div", { style: {
                                fontSize: fs.body,
                                lineHeight: 1.7,
                                color: theme.textMuted,
                                padding: `4px ${pad - 4}px`,
                                borderLeft: `3px solid ${theme.border}`,
                                fontWeight: 600,
                                paddingLeft: pad + 12,
                            }, children: group.header }), group.steps.map((step) => (_jsx("div", { style: {
                                fontSize: fs.small,
                                lineHeight: 1.6,
                                color: theme.textMuted,
                                padding: `2px ${pad - 4}px 2px ${pad + 20}px`,
                            }, children: step.text }, `f-${step.idx}`)))] }, `f-${group.headerIdx}`))) }))] }));
}
//# sourceMappingURL=NarrativeTrace.js.map