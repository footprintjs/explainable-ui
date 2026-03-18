import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { memo, useState, useCallback, useMemo } from "react";
import { theme } from "../../theme";
/** Extracts a flat-ish tree of entries from a SpecNode for display. */
export function specToTree(node) {
    const entries = [];
    const seen = new Set();
    function walk(n) {
        const id = n.name || n.id || "";
        if (seen.has(id))
            return;
        seen.add(id);
        const entry = {
            name: n.name,
            description: n.description,
            subflowId: n.subflowId,
            isSubflow: !!n.isSubflowRoot,
        };
        // If this is a subflow with nested structure, recurse into it
        if (n.isSubflowRoot && n.subflowStructure) {
            entry.children = specToTree(n.subflowStructure);
        }
        entries.push(entry);
        // Walk children (fork/decider branches)
        if (n.children) {
            for (const child of n.children) {
                walk(child);
            }
        }
        // Walk linear continuation
        if (n.next) {
            walk(n.next);
        }
    }
    walk(node);
    return entries;
}
/** Single tree node row */
const TreeNode = memo(function TreeNode({ entry, depth, activeStage, doneStages, onNodeSelect, }) {
    const [expanded, setExpanded] = useState(true);
    const hasChildren = entry.children && entry.children.length > 0;
    const isActive = activeStage === entry.name;
    const isDone = doneStages?.has(entry.name);
    const handleClick = useCallback(() => {
        if (hasChildren) {
            setExpanded((prev) => !prev);
        }
        onNodeSelect?.(entry.name, !!entry.isSubflow);
    }, [hasChildren, onNodeSelect, entry.name, entry.isSubflow]);
    return (_jsxs(_Fragment, { children: [_jsxs("button", { onClick: handleClick, "data-fp": "subflow-tree-node", style: {
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    width: "100%",
                    border: "none",
                    background: isActive
                        ? `color-mix(in srgb, ${theme.primary} 15%, transparent)`
                        : "transparent",
                    cursor: "pointer",
                    padding: `4px 8px 4px ${8 + depth * 16}px`,
                    fontFamily: theme.fontSans,
                    fontSize: 12,
                    textAlign: "left",
                    borderRadius: 4,
                    transition: "background 0.15s",
                }, onMouseEnter: (e) => {
                    if (!isActive) {
                        e.currentTarget.style.background = `color-mix(in srgb, ${theme.textMuted} 10%, transparent)`;
                    }
                }, onMouseLeave: (e) => {
                    if (!isActive) {
                        e.currentTarget.style.background = "transparent";
                    }
                }, children: [hasChildren ? (_jsx("span", { style: {
                            fontSize: 10,
                            color: theme.textMuted,
                            width: 12,
                            textAlign: "center",
                            flexShrink: 0,
                            transition: "transform 0.15s",
                            transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
                            display: "inline-block",
                        }, children: "\u25B6" })) : (_jsx("span", { style: { width: 12, flexShrink: 0 } })), _jsx("span", { style: {
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            flexShrink: 0,
                            background: isActive
                                ? theme.primary
                                : isDone
                                    ? theme.success
                                    : theme.border,
                        } }), _jsxs("span", { style: { display: "flex", flexDirection: "column", minWidth: 0 }, children: [_jsxs("span", { style: {
                                    color: isActive
                                        ? theme.primary
                                        : isDone
                                            ? theme.textPrimary
                                            : theme.textSecondary,
                                    fontWeight: isActive ? 600 : entry.isSubflow ? 500 : 400,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                }, children: [entry.name, entry.isSubflow && (_jsx("span", { style: { opacity: 0.5, marginLeft: 4, fontSize: 10 }, children: "\u229E" }))] }), entry.description && (_jsx("span", { style: {
                                    color: theme.textMuted,
                                    fontSize: 10,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                }, children: entry.description }))] })] }), hasChildren && expanded && (_jsx("div", { children: entry.children.map((child, i) => (_jsx(TreeNode, { entry: child, depth: depth + 1, activeStage: activeStage, doneStages: doneStages, onNodeSelect: onNodeSelect }, `${child.name}-${i}`))) }))] }));
});
/**
 * Collapsible tree sidebar showing the full subflow manifest.
 *
 * Shared navigation layer — humans click through the tree just like
 * LLMs call getSubflowManifest() / getSubflowSpec().
 *
 * All colors come from `--fp-*` CSS variables set by the consumer.
 */
export const SubflowTree = memo(function SubflowTree({ spec, activeStage, doneStages, onNodeSelect, unstyled = false, className, style, }) {
    const tree = useMemo(() => specToTree(spec), [spec]);
    return (_jsxs("div", { className: className, "data-fp": "subflow-tree", style: {
            ...(unstyled
                ? {}
                : {
                    fontFamily: theme.fontSans,
                    fontSize: 12,
                    background: theme.bgPrimary,
                    borderRight: `1px solid ${theme.border}`,
                    overflowY: "auto",
                    overflowX: "hidden",
                    padding: "8px 0",
                }),
            ...style,
        }, children: [!unstyled && (_jsx("div", { style: {
                    padding: "4px 12px 8px",
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: theme.textMuted,
                }, children: "Pipeline" })), tree.map((entry, i) => (_jsx(TreeNode, { entry: entry, depth: 0, activeStage: activeStage, doneStages: doneStages, onNodeSelect: onNodeSelect }, `${entry.name}-${i}`)))] }));
});
//# sourceMappingURL=SubflowTree.js.map