/**
 * Dumb flowchart renderer — spec + snapshots → ReactFlow graph with overlay.
 *
 * No internal navigation state. The consumer (ExplainableShell) owns
 * drill-down, breadcrumb, and SubflowTree. This component just renders
 * whatever spec + snapshots it receives at any level.
 *
 * Usage:
 *   <TracedFlowchartView spec={spec} />                                        // static
 *   <TracedFlowchartView spec={spec} snapshots={snaps} snapshotIndex={idx} />  // traced
 */
import { useMemo, useCallback, useEffect } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  useReactFlow,
} from "@xyflow/react";
import type { Node, NodeTypes } from "@xyflow/react";
import type { StageSnapshot, BaseComponentProps } from "../../types";
import { StageNode } from "../StageNode";
import { specToLayout, applyOverlay } from "./specToReactFlow";
import type { SpecNode, ExecutionOverlay } from "./specToReactFlow";

export interface TracedFlowchartViewProps extends BaseComponentProps {
  /** Pipeline spec from builder.toSpec() — for the current level */
  spec: SpecNode;
  /** Visualization snapshots (enables trace overlay when provided) */
  snapshots?: StageSnapshot[];
  /** Current time-travel position */
  snapshotIndex?: number;
  /** Callback when a node is clicked (receives snapshot index, or node id if no snapshots) */
  onNodeClick?: (indexOrId: number | string) => void;
  /** Override default node types */
  nodeTypes?: NodeTypes;
}

const defaultNodeTypes: NodeTypes = { stage: StageNode as any };

/** Calls fitView when the container resizes (e.g. panel expand/collapse). */
function FitViewOnResize() {
  const { fitView } = useReactFlow();
  useEffect(() => {
    const handler = () => { requestAnimationFrame(() => fitView({ padding: 0.3 })); };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [fitView]);
  return null;
}

export function TracedFlowchartView({
  spec,
  snapshots,
  snapshotIndex = 0,
  onNodeClick,
  nodeTypes: customNodeTypes,
  unstyled = false,
  className,
  style,
}: TracedFlowchartViewProps) {
  const nodeTypes = customNodeTypes ?? defaultNodeTypes;

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

  // Phase 1: static layout — only recomputes when spec changes
  const layout = useMemo(() => {
    if (!spec) return null;
    return specToLayout(spec);
  }, [spec]);

  // Phase 2: apply overlay — cheap, runs per slider tick
  const { nodes, edges } = useMemo(() => {
    if (!layout) return { nodes: [], edges: [] };
    return applyOverlay(layout, overlay);
  }, [layout, overlay]);

  // Handle node clicks — always send string node id.
  // The consumer (ExplainableShell) decides whether to drill into a subflow
  // or jump to a snapshot index based on the node name.
  const handleNodeClick = useCallback(
    (_: unknown, node: Node) => {
      if (!onNodeClick) return;
      onNodeClick(node.id);
    },
    [onNodeClick]
  );

  return (
    <div
      className={className}
      style={{ width: "100%", height: "100%", ...style }}
      data-fp="traced-flowchart"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        proOptions={{ hideAttribution: true }}
        panOnDrag={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        preventScrolling={false}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={!!onNodeClick}
      >
        <FitViewOnResize />
        {!unstyled && (
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        )}
      </ReactFlow>
    </div>
  );
}
