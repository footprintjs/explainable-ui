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
import {
  ReactFlow,
  Background,
  BackgroundVariant,
} from "@xyflow/react";
import type { Node, NodeTypes } from "@xyflow/react";
import type { StageSnapshot, BaseComponentProps } from "../../types";
import { StageNode } from "../StageNode";
import { specToReactFlow } from "./specToReactFlow";
import type { SpecNode, ExecutionOverlay } from "./specToReactFlow";
import { useSubflowNavigation } from "./useSubflowNavigation";
import { SubflowBreadcrumb } from "./SubflowBreadcrumb";
import { SubflowTree } from "./SubflowTree";

export interface TracedFlowchartViewProps extends BaseComponentProps {
  /** Pipeline spec from builder.toSpec() */
  spec: SpecNode;
  /** Visualization snapshots (enables trace overlay when provided) */
  snapshots?: StageSnapshot[];
  /** Current time-travel position */
  snapshotIndex?: number;
  /** Callback when a node is clicked (receives snapshot index, or node id if no snapshots) */
  onNodeClick?: (indexOrId: number | string) => void;
  /** Callback when subflow navigation changes (true = entered subflow) */
  onSubflowChange?: (isInSubflow: boolean, subflowNodeName: string | null) => void;
  /** Show collapsible subflow tree sidebar (default: false) */
  showTree?: boolean;
  /** Width of the tree sidebar in pixels (default: 200) */
  treeWidth?: number;
}

const nodeTypes: NodeTypes = { stage: StageNode as any };

export function TracedFlowchartView({
  spec,
  snapshots,
  snapshotIndex = 0,
  onNodeClick,
  onSubflowChange,
  showTree = false,
  treeWidth = 200,
  unstyled = false,
  className,
  style,
}: TracedFlowchartViewProps) {
  const [treeVisible, setTreeVisible] = useState(showTree);

  // Subflow navigation — no overlay passed (computed synchronously below)
  const subflowNav = useSubflowNavigation(spec);

  // Get the current level's spec from breadcrumbs
  const currentSpec = subflowNav.breadcrumbs.length > 0
    ? subflowNav.breadcrumbs[subflowNav.breadcrumbs.length - 1].spec
    : null;

  // Compute execution overlay from snapshots + index
  const overlay = useMemo<ExecutionOverlay | undefined>(() => {
    if (!snapshots || snapshots.length === 0) return undefined;
    const executionOrder = snapshots
      .slice(0, snapshotIndex + 1)
      .map((s) => s.stageLabel);
    const doneStages = new Set(
      snapshots.slice(0, snapshotIndex).map((s) => s.stageLabel)
    );
    const activeStage = snapshots[snapshotIndex]?.stageLabel ?? null;
    const executedStages = new Set([...doneStages]);
    if (activeStage) executedStages.add(activeStage);
    return { doneStages, activeStage, executedStages, executionOrder };
  }, [snapshots, snapshotIndex]);

  // Derive nodes/edges with overlay applied
  const { nodes, edges } = useMemo(() => {
    if (!currentSpec) return { nodes: [], edges: [] };
    return specToReactFlow(currentSpec, overlay);
  }, [currentSpec, overlay]);

  // Handle node clicks — drill into subflow or notify consumer
  const handleNodeClick = useCallback(
    (_: unknown, node: Node) => {
      // Try subflow drill-down first
      if (subflowNav.handleNodeClick(node.id)) {
        onSubflowChange?.(true, node.id);
        return;
      }
      // Otherwise notify consumer
      if (onNodeClick && snapshots) {
        const idx = snapshots.findIndex((s) => s.stageLabel === node.id);
        if (idx >= 0) onNodeClick(idx);
      } else if (onNodeClick) {
        onNodeClick(node.id);
      }
    },
    [subflowNav, onNodeClick, onSubflowChange, snapshots]
  );

  // Navigate breadcrumb
  const handleBreadcrumbNavigate = useCallback(
    (level: number) => {
      subflowNav.navigateTo(level);
      onSubflowChange?.(level > 0, null);
    },
    [subflowNav, onSubflowChange]
  );

  // Tree node click — drill into subflow or jump to snapshot
  const handleTreeNodeSelect = useCallback(
    (name: string, isSubflow: boolean) => {
      if (isSubflow) {
        if (subflowNav.handleNodeClick(name)) {
          onSubflowChange?.(true, name);
        }
      } else if (onNodeClick && snapshots) {
        const idx = snapshots.findIndex((s) => s.stageLabel === name);
        if (idx >= 0) onNodeClick(idx);
      }
    },
    [subflowNav, onNodeClick, onSubflowChange, snapshots]
  );

  return (
    <div
      className={className}
      style={{ width: "100%", height: "100%", display: "flex", flexDirection: "row", ...style }}
      data-fp="traced-flowchart"
    >
      {/* Subflow tree sidebar */}
      {showTree && treeVisible && (
        <SubflowTree
          spec={spec}
          activeStage={overlay?.activeStage}
          doneStages={overlay?.doneStages}
          onNodeSelect={handleTreeNodeSelect}
          unstyled={unstyled}
          style={{ width: treeWidth, flexShrink: 0, height: "100%" }}
        />
      )}

      {/* Main flowchart area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100%" }}>
        {/* Breadcrumb + optional tree toggle */}
        {(subflowNav.isInSubflow || (showTree && !treeVisible)) && (
          <div style={{ display: "flex", alignItems: "stretch", flexShrink: 0 }}>
            {showTree && !treeVisible && (
              <button
                onClick={() => setTreeVisible(true)}
                data-fp="tree-toggle"
                style={unstyled ? {} : {
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "6px 8px",
                  fontSize: 10,
                  flexShrink: 0,
                }}
              >
                ▶
              </button>
            )}
            <div style={{ flex: 1 }}>
              <SubflowBreadcrumb
                breadcrumbs={subflowNav.breadcrumbs}
                onNavigate={handleBreadcrumbNavigate}
              />
            </div>
          </div>
        )}

        {/* Tree collapse button (shown in tree header area) */}
        {showTree && treeVisible && (
          <div style={{ display: "flex", alignItems: "stretch", flexShrink: 0 }}>
            <button
              onClick={() => setTreeVisible(false)}
              data-fp="tree-toggle"
              style={unstyled ? {} : {
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "6px 8px",
                fontSize: 10,
                flexShrink: 0,
              }}
            >
              ◀
            </button>
            <div style={{ flex: 1 }}>
              {subflowNav.isInSubflow && (
                <SubflowBreadcrumb
                  breadcrumbs={subflowNav.breadcrumbs}
                  onNavigate={handleBreadcrumbNavigate}
                />
              )}
            </div>
          </div>
        )}

        <div style={{ flex: 1, minHeight: 0 }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodeClick={handleNodeClick}
            nodeTypes={nodeTypes}
            fitView
            panOnDrag={false}
            zoomOnScroll={false}
            zoomOnPinch={false}
            zoomOnDoubleClick={false}
            preventScrolling={false}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={!!onNodeClick}
          >
            {!unstyled && (
              <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
            )}
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}
