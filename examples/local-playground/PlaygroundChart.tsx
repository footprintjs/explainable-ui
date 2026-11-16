import { Controls, useStore } from '@xyflow/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ExplainableShellProps } from 'footprint-explainable-ui';
import {
  TracedFlow,
  GROUP_CONTAINER_NODE_TYPE,
  createTraceGroupLayout,
  createSnappedDagreLayout,
  type NodeFootprint,
  type NodeSizeResolver,
  type RuntimeOverlay,
  type TraceGraph,
} from 'footprint-explainable-ui/flowchart';
import { ExampleGroupContainerNode, type NodeIconMode } from '../node-icons/NodeIcons';
import { isometricLayout } from './isometricLayout';
import { IsometricStageNode, IsometricEdge, IsometricGrid } from './IsometricView';

const exampleIconNodeTypes = { [GROUP_CONTAINER_NODE_TYPE]: ExampleGroupContainerNode };
const isometricNodeTypes = { stageNode: IsometricStageNode };
const isometricIconNodeTypes = { ...isometricNodeTypes, ...exampleIconNodeTypes };
const isometricEdgeTypes = { isometric: IsometricEdge };
const isometricAutoFit = { padding: 0.06 };

export interface PlaygroundChartOptions {
  layout: 'default' | 'straight' | 'isometric';
  groupedSubflows: string[];
  outerBox: boolean;
  mode: 'light' | 'dark';
  iconMode: NodeIconMode;
}

interface ChartRecording {
  title: string;
  traceGraph: TraceGraph;
  runtimeOverlay: RuntimeOverlay;
}

type ShellChartView = Parameters<NonNullable<ExplainableShellProps['renderFlowchart']>>[0];

// A consumer-owned custom layout needs the rendered footprints too. Subscribe
// to the existing xyflow store through its public hook, publishing only whole,
// ready sets. The signature stays stable across overlay-only updates.
function LayoutMeasurements({ onReady }: { onReady: (key: string) => void }) {
  const key = useStore((state) => {
    const dimensions: [string, NodeFootprint][] = [];
    let visibleCount = 0;
    for (const [id, node] of state.nodeLookup) {
      if (node.hidden) continue;
      visibleCount++;
      const width = Math.round(node.measured?.width ?? 0);
      const height = Math.round(node.measured?.height ?? 0);
      if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return '';
      // Boxes are sized by the group layout, not by intrinsic card content.
      // Their mount id becomes a drill card again when the box is unchecked.
      if (node.data.isGroupContainer === true) continue;
      dimensions.push([id, { width, height }]);
    }
    return visibleCount ? JSON.stringify(dimensions) : '';
  });
  useEffect(() => { if (key) onReady(key); }, [key, onReady]);
  return null;
}

/** Existing Shell extension point: the Shell continues to own cursor and drill. */
export function createPlaygroundRenderer(
  recording: ChartRecording,
  options: PlaygroundChartOptions,
): NonNullable<ExplainableShellProps['renderFlowchart']> {
  // A nested capture can retain a local subflowId ("prepare") while its
  // members carry the mount path ("pipeline/prepare"). The grouping port
  // joins those two fields. Qualify that display key on a fresh graph copy
  // so repeated local names use their exact native mount membership.
  const chartGraph: TraceGraph = {
    ...recording.traceGraph,
    nodes: recording.traceGraph.nodes.map((node) => node.data.isSubflow
      ? { ...node, data: { ...node.data, subflowId: node.id } }
      : node),
  };
  return (view) => <PlaygroundChart recording={recording} chartGraph={chartGraph} options={options} view={view} />;
}

function PlaygroundChart({ recording, chartGraph, options, view }: {
  recording: ChartRecording;
  chartGraph: TraceGraph;
  options: PlaygroundChartOptions;
  view: ShellChartView;
}) {
    const { snapshots, selectedIndex, currentSubflowId, onSubflowChange, onNodeClick, sliceCone, traceWorkflow } = view;
    const [measurement, setMeasurement] = useState<{ key: string; sizes: Map<string, NodeFootprint> }>(() => ({ key: '', sizes: new Map() }));
    const acceptMeasurements = useCallback((key: string) => {
      setMeasurement((current) => current.key === key ? current : {
        key, sizes: new Map(JSON.parse(key) as [string, NodeFootprint][]),
      });
    }, []);
    const straightLayout = useMemo(() => {
      const nodeSize: NodeSizeResolver = (node) => measurement.sizes.get(node.id);
      return createSnappedDagreLayout(createTraceGroupLayout({
        mergeAlign: 'fork-origin', nodeSize, rankSep: 52, nodeSep: 36,
      }), { nodeSize });
    }, [measurement]);
    const pendingSelection = useRef<{ scope: string; stageId: string } | null>(null);
    useEffect(() => {
      const pending = pendingSelection.current;
      if (!pending || pending.scope !== currentSubflowId) return;
      pendingSelection.current = null;
      onNodeClick?.(pending.stageId);
    }, [currentSubflowId, snapshots, onNodeClick]);

    const selectNode = (id: string) => {
      const node = chartGraph.nodes.find((candidate) => candidate.id === id);
      const scope = node?.data.subflowOf;
      if (node?.data.isSubflow || !scope) {
        onNodeClick?.(id);
        return;
      }
      const localId = id.startsWith(`${scope}/`) ? id.slice(scope.length + 1) : id;
      if (scope !== currentSubflowId) {
        // A member visible inside a group still belongs to its own recording.
        // Open that scope, then select its row after the Shell supplies it.
        pendingSelection.current = { scope, stageId: localId };
        onSubflowChange?.(scope);
      } else {
        onNodeClick?.(localId);
      }
    };
    const runtimeId = snapshots[selectedIndex]?.runtimeStageId;
    const order = recording.runtimeOverlay.executionOrder;
    let overlayIndex = runtimeId ? order.findIndex((step) => step.runtimeStageId === runtimeId) : -1;
    if (overlayIndex < 0 && runtimeId && currentSubflowId) {
      overlayIndex = order.findIndex((step) => step.runtimeStageId === `${currentSubflowId}/${runtimeId}`);
    }
    // Older recorders may qualify a child differently. Use a suffix only when
    // it identifies one exact runtime invocation in this recording.
    if (overlayIndex < 0 && runtimeId) {
      const candidates = order.flatMap((step, index) => step.runtimeStageId.endsWith(`/${runtimeId}`) ? [index] : []);
      if (candidates.length === 1) overlayIndex = candidates[0];
    }

    // Expand sibling groups at the current level. A nested mount stays a
    // drill card inside its parent's group; it can be expanded when that
    // parent's scope is opened. This uses the shipped grouping mechanism.
    const requested = new Set(options.groupedSubflows);
    const grouped = chartGraph.nodes
      .filter((node) => node.data.isSubflow && node.data.subflowId !== undefined
        && requested.has(node.data.subflowId)
        && (node.data.subflowOf ?? null) === (currentSubflowId ?? null))
      .map((node) => node.data.subflowId!);
    const scopeLabel = currentSubflowId
      ? recording.traceGraph.nodes.find((node) => node.id === currentSubflowId)?.data.label ?? recording.title
      : recording.title;

    const isometric = options.layout === 'isometric';
    const displayGraph = useMemo(() => isometric ? {
      ...chartGraph,
      edges: chartGraph.edges.map(edge => edge.data?.kind === 'loop' || edge.type === 'recordedRead'
        ? edge : { ...edge, type: 'isometric' }),
    } : chartGraph, [chartGraph, isometric]);

    return <TracedFlow
      graph={displayGraph}
      nodeTypes={isometric
        ? options.iconMode === 'recorded' ? isometricNodeTypes : isometricIconNodeTypes
        : options.iconMode === 'recorded' ? undefined : exampleIconNodeTypes}
      edgeTypes={isometric ? isometricEdgeTypes : undefined}
      background={isometric ? false : undefined}
      autoFit={isometric ? isometricAutoFit : undefined}
      overlay={recording.runtimeOverlay}
      scrubIndex={overlayIndex >= 0 ? overlayIndex : selectedIndex}
      currentSubflowId={currentSubflowId ?? null}
      onSubflowChange={(id) => onSubflowChange?.(id)}
      onNodeClick={selectNode}
      sliceCone={sliceCone}
      traceWorkflow={traceWorkflow}
      groupedSubflows={grouped}
      mainChartBox={options.outerBox ? { label: scopeLabel, kind: 'Workflow' } : undefined}
      {...(isometric ? { layout: isometricLayout } : options.layout === 'straight' ? { layout: straightLayout } : {})}
      unstyled={view.unstyled}
      style={{ minHeight: 0 }}
    >
      <Controls showInteractive={false} />
      {isometric ? <IsometricGrid unstyled={view.unstyled} /> : <LayoutMeasurements onReady={acceptMeasurements} />}
    </TracedFlow>;
}
