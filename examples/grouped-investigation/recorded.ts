import { createRecordGraph, explain } from 'foottrace/cause';
import type { Attention, CommitBundle } from 'foottrace';
import type { InvestigationPort } from '../../src/components/InvestigationPanel/types';
import type { FlowDiagramDefinition, FlowDiagramObservation } from '../../src/components/GroupedFlowDiagram/types';

export type ExampleRecording = 'complete' | 'missing' | 'ambiguous';

/** Synthetic saved commits. No application, payment or shipping service is run. */
function commit(stage: string, idx: number, key: string, value: unknown, reads: string[]): CommitBundle {
  return { idx, stage, stageId: stage.split('#')[0]!, runtimeStageId: stage,
    trace: [{ path: key, verb: 'set', readKeys: reads }], redactedPaths: [],
    overwrite: { [key]: value }, updates: {} };
}

export function createRecordedInvestigationExample(recording: ExampleRecording, onQuery?: () => void) {
  const address = { logRunId: 'example-order', drillPath: [] as string[] };
  const log = [
    commit('cart#1', 0, 'cartReady', true, []),
    commit('authorize#1', 1, 'authorized', true, ['cartReady']),
    commit('capture#1', 2, 'captured', true, ['authorized']),
    commit('rates#1', 3, 'rateCount', 0, []),
    commit('service-area#1', 4, 'deliveryAllowed', recording !== 'ambiguous', []),
    commit('decision#1', 5, 'usableRate', false, ['rateCount', 'deliveryAllowed']),
    commit('failed-order#1', 6, 'orderOutcome', 'no-shipping-option', ['usableRate']),
  ];
  const issue = (evidence: string): Attention => ({ kind: 'error', reason: 'BUSINESS_RULE_MATCHED', evidence: [evidence] });
  const graph = createRecordGraph([{ address, commitLog: log,
    reads: Object.fromEntries(log.map(item => [item.runtimeStageId!, item.trace.flatMap(row => row.readKeys ?? [])])),
    controlDeps: {}, complete: recording !== 'missing',
    attention: {
      'rates#1': [issue('commit:3:empty-rates')],
      ...(recording === 'ambiguous' ? { 'service-area#1': [issue('commit:4:service-area')] } : {}),
      'failed-order#1': [{ kind: 'error', reason: 'ERROR_RECORDED', evidence: ['commit:6:failed-order'] }],
    },
  }]);
  const node = (idx: number) => graph.nodeId(address, { runtimeStageId: log[idx]!.runtimeStageId!, commitIdx: idx, key: log[idx]!.trace[0]!.path });
  const ids = { cart: node(0), authorize: node(1), capture: node(2), shipping: node(3), serviceArea: node(4), decision: node(5), failure: node(6) };
  const labels = {
    [ids.cart]: 'Cart', [ids.authorize]: 'Authorize', [ids.capture]: 'Capture',
    [ids.shipping]: 'Shipping rates', [ids.serviceArea]: 'Service area check',
    [ids.decision]: 'Rates usable?', [ids.failure]: 'No shipping option',
  };
  const definition: FlowDiagramDefinition = { nodes: [
    { id: ids.cart, label: labels[ids.cart]!, icon: 'cart' },
    { id: 'payment-group', label: 'Payment', kind: 'group', icon: 'card' },
    { id: ids.authorize, label: labels[ids.authorize]!, parentId: 'payment-group', icon: 'lock' },
    { id: ids.capture, label: labels[ids.capture]!, parentId: 'payment-group', icon: 'payment' },
    { id: 'delivery-group', label: 'Delivery checks', kind: 'group', icon: 'shipping' },
    { id: ids.shipping, label: labels[ids.shipping]!, parentId: 'delivery-group', icon: 'shipping' },
    { id: ids.serviceArea, label: labels[ids.serviceArea]!, parentId: 'delivery-group', icon: 'step' },
    { id: ids.decision, label: labels[ids.decision]!, parentId: 'delivery-group', kind: 'decision' },
    { id: 'not-run:label', label: 'Label', icon: 'label' },
    { id: 'not-run:confirmation', label: 'Confirmation', icon: 'step' },
    { id: ids.failure, label: labels[ids.failure]!, icon: 'alert' },
  ], edges: [
    { id: 'design:cart-authorize', source: ids.cart, target: ids.authorize },
    { id: 'design:authorize-capture', source: ids.authorize, target: ids.capture },
    { id: 'design:capture-rates', source: ids.capture, target: ids.shipping },
    { id: 'design:capture-area', source: ids.capture, target: ids.serviceArea },
    { id: 'design:rates-decision', source: ids.shipping, target: ids.decision },
    { id: 'design:area-decision', source: ids.serviceArea, target: ids.decision },
    { id: 'design:yes', source: ids.decision, target: 'not-run:label', label: 'Yes' },
    { id: 'design:label-confirmation', source: 'not-run:label', target: 'not-run:confirmation' },
    { id: 'design:no', source: ids.decision, target: ids.failure, label: 'No' },
  ] };
  const observation: FlowDiagramObservation = { nodeStates: {
    ...Object.fromEntries(Object.values(ids).map(id => [id, id === ids.failure ? 'failed' : 'completed'] as const)),
    'not-run:label': 'not-run', 'not-run:confirmation': 'not-run',
  }, edgeStates: Object.fromEntries(definition.edges.map(edge => [edge.id,
    edge.id === 'design:yes' || edge.id === 'design:label-confirmation' ? 'not-taken' : 'observed'] as const)) };
  const queries: string[] = [];
  const allowed = new Set(Object.values(ids));
  // Declared separately to keep this example buildable with older development
  // readers. They return no backward graph, and the view must disclose that gap.
  const options = { includeBackward: true, maxNodes: 64, maxDepth: 16, maxEdges: 128, maxCalls: 256, timeoutMs: 2000 };
  const port: InvestigationPort = { binding: {}, labels,
    attention: { nodes: [{ nodeId: ids.failure, attention: [{ kind: 'error', reason: 'ERROR_RECORDED', evidence: ['commit:6:failed-order'] }] }], confidence: recording === 'missing' ? 'incomplete' : 'complete', gaps: recording === 'missing' ? [{ code: 'not-collected', evidence: [] }] : [] },
    explain: (nodeId, context) => {
      if (!allowed.has(nodeId)) throw new Error('This item did not execute in the example recording.');
      queries.push(nodeId); onQuery?.();
      return explain(graph, nodeId, { ...options, signal: context.signal });
    },
  };
  return { ids, definition, observation, port, queries };
}
