import { useMemo, useSyncExternalStore } from 'react';
import { Controls } from '@xyflow/react';
import { FootprintLoadStatus, overlayFromSnapshot, projectTraceInvocation, useLensWorkbench } from 'footprint-explainable-ui';
import type { ExplainableShellProps, RecordingSource, TraceGraph } from 'footprint-explainable-ui';
import { TracedFlow } from 'footprint-explainable-ui/flowchart';
import { infrastructureNodeTypes } from './InfrastructureStageNode';
import { getDeviceGeometry } from './deviceGeometry';
import shapes from './shape-map.json';

type ChartProps = Parameters<NonNullable<ExplainableShellProps['renderFlowchart']>>[0];
const shapeMap: Readonly<Record<string, string>> = shapes;

/** Paint-only host mapping. Execution kind, IDs and recorded flags stay intact. */
export function decorateInfrastructureGraph(graph: TraceGraph, showStageId = false): TraceGraph {
  return { ...graph, nodes: graph.nodes.map(node => {
    const infrastructureKind = shapeMap[node.id];
    const { width, height } = getDeviceGeometry(infrastructureKind);
    return { ...node, width, height, data: { ...node.data, infrastructureKind, stageId: node.id, showStageId } };
  }) };
}

/** Uses the Shell's exact invocation and replay position, never a second cursor. */
export function InfrastructureChart({ source, ...props }: ChartProps & { source: RecordingSource }) {
  const { invocationPath, actions, traceWalk } = useLensWorkbench();
  const cohort = useSyncExternalStore(source.subscribe, source.getSnapshot, source.getSnapshot);
  const pathKey = source.getKey(invocationPath);
  const graph = source.getGraph(invocationPath);
  const decorated = useMemo(() => decorateInfrastructureGraph(graph, props.showStageId), [graph, props.showStageId]);
  const projection = useMemo(() => invocationPath.length
    ? projectTraceInvocation(cohort.snapshot, invocationPath[invocationPath.length - 1], { invocationPath })
    : null, [cohort.snapshot, pathKey]);
  const overlay = useMemo(() => overlayFromSnapshot(projection ?? source.rootSnapshot), [projection, source, cohort.rootRevision]);
  const runtimeId = props.snapshots[props.selectedIndex]?.runtimeStageId;
  const scrubIndex = overlay.executionOrder.findIndex(step => step.runtimeStageId === runtimeId);
  const layoutOptions = useMemo(() => ({ nodeSize: (node: TraceGraph['nodes'][number]) => getDeviceGeometry(node.data.infrastructureKind) }), []);
  if ((projection && !projection.availability.ok) || (runtimeId && scrubIndex < 0)) {
    return <FootprintLoadStatus state="error" label="This recorded chart scope is unavailable." />;
  }
  return <div className="deployment-chart">
    <div className="deployment-chart-tools" aria-label="Programmatic navigation example">
      <span>{invocationPath.length ? 'Server detail · recorded steps' : 'Deployment overview · recorded steps'}</span>
      {!invocationPath.length && !traceWalk && <>
        <button onClick={() => actions.drillDown('server-a')}>Open Server A details</button>
        <button onClick={() => actions.drillDown('server-b')}>Open Server B details</button>
      </>}
      {!!invocationPath.length && !traceWalk && <button onClick={actions.returnToRoot}>Return to overview</button>}
    </div>
    <div className="deployment-chart-canvas">
      <TracedFlow graph={decorated} overlay={overlay} scrubIndex={scrubIndex}
        nodeTypes={infrastructureNodeTypes} layoutOptions={layoutOptions} renderer={props.renderer}
        onNodeClick={id => props.onNodeClick?.(id)} onSubflowChange={props.onSubflowChange}
        currentSubflowId={props.currentSubflowId ?? null} sliceCone={props.sliceCone}
        traceWorkflow={props.traceWorkflow} unstyled={props.unstyled} minZoom={0.1} autoFit={{ padding: 0.06 }}>
        <Controls showInteractive={false} />
      </TracedFlow>
    </div>
  </div>;
}
