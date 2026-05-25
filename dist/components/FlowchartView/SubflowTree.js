import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * SubflowTree — collapsible sidebar listing mounted subflows.
 *
 * Recorder-driven (v6+): derives the tree from a `TraceGraph` produced
 * by `createTraceStructureRecorder`. Filters nodes by
 * `data.isSubflow === true` and lists them as `SubflowTreeEntry[]`
 * keyed by `subflowId`.
 *
 * Limitation (intentional — recorder graph is flat / mount-only):
 *   Subflow-within-subflow nesting is NOT represented. The
 *   StructureRecorder records the MOUNT of each subflow in the parent
 *   chart, not the inner structure of each child chart. Rendering the
 *   nested tree requires a separate recorder attached to each child
 *   chart instance (deferred — see TODO below).
 *
 * Shared navigation layer — humans click through the tree just like
 * LLMs call getSubflowManifest() / getSubflowSpec().
 *
 * TODO(recorder-driven-nesting): when child charts attach their own
 * `traceStructureRecorder` and surface those graphs via a parent
 * registry, accept `Map<subflowId, TraceGraph>` and recurse to
 * restore the nested rendering the legacy SpecNode-walk supported.
 *
 * All colors come from `--fp-*` CSS variables set by the consumer.
 */
import { memo, useState, useCallback, useMemo } from "react";
import { theme } from "../../theme";
/** Extracts subflow entries from a recorder graph. Insertion-order preserving. */
export function graphToSubflowEntries(graph) {
    if (!graph?.nodes?.length)
        return [];
    const entries = [];
    for (const node of graph.nodes) {
        if (!node.data?.isSubflow)
            continue;
        const entry = {
            name: typeof node.data.label === "string" ? node.data.label : node.id,
            isSubflow: true,
        };
        if (typeof node.data.description === "string")
            entry.description = node.data.description;
        if (typeof node.data.subflowId === "string")
            entry.subflowId = node.data.subflowId;
        entries.push(entry);
    }
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
                                }, children: entry.description }))] })] }), hasChildren && expanded && (_jsx("div", { children: entry.children.map((child, i) => (_jsx(TreeNode, { entry: child, depth: depth + 1, activeStage: activeStage, doneStages: doneStages, onNodeSelect: onNodeSelect }, child.subflowId ?? `${child.name}-${i}`))) }))] }));
});
/** Section label used for "Flowchart" and "Subflows" headings. */
const SectionLabel = memo(function SectionLabel({ children }) {
    return (_jsx("div", { style: {
            padding: "4px 12px 8px",
            fontSize: 10,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: theme.textMuted,
        }, children: children }));
});
export const SubflowTree = memo(function SubflowTree({ graph, activeStage, doneStages, onNodeSelect, unstyled = false, className, style, }) {
    const subflowStages = useMemo(() => graphToSubflowEntries(graph), [graph]);
    // Don't render anything if there are no subflows
    if (subflowStages.length === 0)
        return null;
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
        }, children: [!unstyled && _jsx(SectionLabel, { children: "Subflows" }), subflowStages.map((entry, i) => (_jsx(TreeNode, { entry: entry, depth: 0, activeStage: activeStage, doneStages: doneStages, onNodeSelect: onNodeSelect }, entry.subflowId ?? `${entry.name}-${i}`)))] }));
});
//# sourceMappingURL=SubflowTree.js.map