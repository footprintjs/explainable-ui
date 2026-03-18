import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Self-contained flowchart with execution trace overlay.
 *
 * Consumer just passes `spec` and optionally `snapshots` + `snapshotIndex`.
 * The component internally computes the overlay, handles subflow drill-down,
 * and renders the correct nodes/edges — no manual overlay construction needed.
 *
 * Usage:
 *   <TracedFlowchartView spec={spec} />                          // static
 *   <TracedFlowchartView spec={spec} snapshots={snaps} snapshotIndex={idx} />  // traced
 *   <TracedFlowchartView spec={spec} snapshots={snaps} snapshotIndex={idx} showTree />
 */
import { useState, useMemo, useCallback } from "react";
import { ReactFlow, Background, BackgroundVariant, } from "@xyflow/react";
import { StageNode } from "../StageNode";
import { specToReactFlow } from "./specToReactFlow";
import { useSubflowNavigation } from "./useSubflowNavigation";
import { SubflowBreadcrumb } from "./SubflowBreadcrumb";
import { SubflowTree } from "./SubflowTree";
const nodeTypes = { stage: StageNode };
export function TracedFlowchartView({ spec, snapshots, snapshotIndex = 0, onNodeClick, onSubflowChange, showTree = false, treeWidth = 200, unstyled = false, className, style, }) {
    const [treeVisible, setTreeVisible] = useState(showTree);
    // Subflow navigation — no overlay passed (computed synchronously below)
    const subflowNav = useSubflowNavigation(spec);
    // Get the current level's spec from breadcrumbs
    const currentSpec = subflowNav.breadcrumbs.length > 0
        ? subflowNav.breadcrumbs[subflowNav.breadcrumbs.length - 1].spec
        : null;
    // Compute execution overlay from snapshots + index
    const overlay = useMemo(() => {
        if (!snapshots || snapshots.length === 0)
            return undefined;
        const executionOrder = snapshots
            .slice(0, snapshotIndex + 1)
            .map((s) => s.stageLabel);
        const doneStages = new Set(snapshots.slice(0, snapshotIndex).map((s) => s.stageLabel));
        const activeStage = snapshots[snapshotIndex]?.stageLabel ?? null;
        const executedStages = new Set([...doneStages]);
        if (activeStage)
            executedStages.add(activeStage);
        return { doneStages, activeStage, executedStages, executionOrder };
    }, [snapshots, snapshotIndex]);
    // Derive nodes/edges with overlay applied
    const { nodes, edges } = useMemo(() => {
        if (!currentSpec)
            return { nodes: [], edges: [] };
        return specToReactFlow(currentSpec, overlay);
    }, [currentSpec, overlay]);
    // Handle node clicks — drill into subflow or notify consumer
    const handleNodeClick = useCallback((_, node) => {
        // Try subflow drill-down first
        if (subflowNav.handleNodeClick(node.id)) {
            onSubflowChange?.(true, node.id);
            return;
        }
        // Otherwise notify consumer
        if (onNodeClick && snapshots) {
            const idx = snapshots.findIndex((s) => s.stageLabel === node.id);
            if (idx >= 0)
                onNodeClick(idx);
        }
        else if (onNodeClick) {
            onNodeClick(node.id);
        }
    }, [subflowNav, onNodeClick, onSubflowChange, snapshots]);
    // Navigate breadcrumb
    const handleBreadcrumbNavigate = useCallback((level) => {
        subflowNav.navigateTo(level);
        onSubflowChange?.(level > 0, null);
    }, [subflowNav, onSubflowChange]);
    // Tree node click — drill into subflow or jump to snapshot
    const handleTreeNodeSelect = useCallback((name, isSubflow) => {
        if (isSubflow) {
            if (subflowNav.handleNodeClick(name)) {
                onSubflowChange?.(true, name);
            }
        }
        else if (onNodeClick && snapshots) {
            const idx = snapshots.findIndex((s) => s.stageLabel === name);
            if (idx >= 0)
                onNodeClick(idx);
        }
    }, [subflowNav, onNodeClick, onSubflowChange, snapshots]);
    return (_jsxs("div", { className: className, style: { width: "100%", height: "100%", display: "flex", flexDirection: "row", ...style }, "data-fp": "traced-flowchart", children: [showTree && treeVisible && (_jsx(SubflowTree, { spec: spec, activeStage: overlay?.activeStage, doneStages: overlay?.doneStages, onNodeSelect: handleTreeNodeSelect, unstyled: unstyled, style: { width: treeWidth, flexShrink: 0, height: "100%" } })), _jsxs("div", { style: { flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100%" }, children: [(subflowNav.isInSubflow || (showTree && !treeVisible)) && (_jsxs("div", { style: { display: "flex", alignItems: "stretch", flexShrink: 0 }, children: [showTree && !treeVisible && (_jsx("button", { onClick: () => setTreeVisible(true), "data-fp": "tree-toggle", style: unstyled ? {} : {
                                    background: "transparent",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: "6px 8px",
                                    fontSize: 10,
                                    flexShrink: 0,
                                }, children: "\u25B6" })), _jsx("div", { style: { flex: 1 }, children: _jsx(SubflowBreadcrumb, { breadcrumbs: subflowNav.breadcrumbs, onNavigate: handleBreadcrumbNavigate }) })] })), showTree && treeVisible && (_jsxs("div", { style: { display: "flex", alignItems: "stretch", flexShrink: 0 }, children: [_jsx("button", { onClick: () => setTreeVisible(false), "data-fp": "tree-toggle", style: unstyled ? {} : {
                                    background: "transparent",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: "6px 8px",
                                    fontSize: 10,
                                    flexShrink: 0,
                                }, children: "\u25C0" }), _jsx("div", { style: { flex: 1 }, children: subflowNav.isInSubflow && (_jsx(SubflowBreadcrumb, { breadcrumbs: subflowNav.breadcrumbs, onNavigate: handleBreadcrumbNavigate })) })] })), _jsx("div", { style: { flex: 1, minHeight: 0 }, children: _jsx(ReactFlow, { nodes: nodes, edges: edges, onNodeClick: handleNodeClick, nodeTypes: nodeTypes, fitView: true, panOnDrag: false, zoomOnScroll: false, zoomOnPinch: false, zoomOnDoubleClick: false, preventScrolling: false, nodesDraggable: false, nodesConnectable: false, elementsSelectable: !!onNodeClick, children: !unstyled && (_jsx(Background, { variant: BackgroundVariant.Dots, gap: 16, size: 1 })) }) })] })] }));
}
//# sourceMappingURL=TracedFlowchartView.js.map