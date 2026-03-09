import { useMemo, useCallback } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import type { Node, Edge } from "@xyflow/react";
import type { StageSnapshot, BaseComponentProps } from "../../types";
import { StageNode } from "../StageNode";
import type { StageNodeData } from "../StageNode";
import { theme } from "../../theme";

export interface FlowchartViewProps extends BaseComponentProps {
  /** ReactFlow nodes */
  nodes: Node[];
  /** ReactFlow edges */
  edges: Edge[];
  /** Optional snapshots for state-aware rendering (done/active coloring) */
  snapshots?: StageSnapshot[];
  /** Currently selected snapshot index (for state coloring) */
  selectedIndex?: number;
  /** Callback when a node is clicked */
  onNodeClick?: (index: number) => void;
}

const nodeTypes = { stageNode: StageNode };

/**
 * Pipeline flowchart visualization using ReactFlow.
 * When snapshots are provided, nodes are colored by execution state.
 */
export function FlowchartView({
  nodes: rawNodes,
  edges: rawEdges,
  snapshots,
  selectedIndex = 0,
  onNodeClick,
  unstyled = false,
  className,
  style,
}: FlowchartViewProps) {
  // Enhance nodes with execution state
  const enhancedNodes = useMemo(() => {
    if (!snapshots || snapshots.length === 0) {
      return rawNodes.map((n) => ({
        ...n,
        type: "stageNode",
        data: {
          ...n.data,
          label: (n.data as StageNodeData).label || n.id,
          active: false,
          done: false,
          error: false,
        },
      }));
    }

    const doneNames = new Set(
      snapshots.slice(0, selectedIndex).map((s) => s.stageName)
    );
    const activeName = snapshots[selectedIndex]?.stageName;

    return rawNodes.map((n) => ({
      ...n,
      type: "stageNode",
      data: {
        ...n.data,
        label: (n.data as StageNodeData).label || n.id,
        active: n.id === activeName,
        done: doneNames.has(n.id),
        error: false,
      },
    }));
  }, [rawNodes, snapshots, selectedIndex]);

  // Enhance edges with state coloring
  const enhancedEdges = useMemo(() => {
    if (!snapshots || snapshots.length === 0) {
      return rawEdges.map((e) => ({
        ...e,
        style: { stroke: theme.textMuted, strokeWidth: 1.5 },
        animated: false,
      }));
    }

    const doneNames = new Set(
      snapshots.slice(0, selectedIndex + 1).map((s) => s.stageName)
    );
    const activeName = snapshots[selectedIndex]?.stageName;

    return rawEdges.map((e) => {
      const sourceIsDone = doneNames.has(e.source);
      const isFromActive = e.source === activeName;
      return {
        ...e,
        style: {
          stroke: sourceIsDone ? theme.success : theme.textMuted,
          strokeWidth: 1.5,
        },
        animated: isFromActive,
      };
    });
  }, [rawEdges, snapshots, selectedIndex]);

  const [nodes, , onNodesChange] = useNodesState(enhancedNodes);
  const [edges, , onEdgesChange] = useEdgesState(enhancedEdges);

  const handleNodeClick = useCallback(
    (_: unknown, node: Node) => {
      if (!onNodeClick || !snapshots) return;
      const idx = snapshots.findIndex((s) => s.stageName === node.id);
      if (idx >= 0) onNodeClick(idx);
    },
    [onNodeClick, snapshots]
  );

  return (
    <div
      className={className}
      style={{
        width: "100%",
        height: "100%",
        ...style,
      }}
      data-fp="flowchart-view"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
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
  );
}
