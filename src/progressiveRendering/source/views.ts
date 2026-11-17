import type { RuntimeSnapshotInput } from '../../model/recording';
import type { TraceGraph } from '../../components/FlowchartView/traceStructureRecorder';
import type { NarrativeEntry } from '../../types';
import type { RecordingSourceSnapshot, SubflowLoadState } from '../types';
import { isPlainRecord } from '../../trace/safeRecordRead';
import { invalid, own, readonlyMap } from '../prepare';
import { ownedGraphIds } from './ownership';

export function rootFields(snapshot: RuntimeSnapshotInput): Record<string, unknown> {
  if (!isPlainRecord(snapshot)) throw invalid();
  const result: Record<string, unknown> = Object.create(null);
  for (const field of Object.keys(snapshot)) {
    const descriptor = Object.getOwnPropertyDescriptor(snapshot, field);
    // Unused stored accessors are not evaluated or copied into the cohort.
    if (descriptor && 'value' in descriptor) result[field] = descriptor.value;
  }
  for (const field of ['sharedState', 'executionTree', 'commitLog', 'runId', 'nestedReadTracking', 'subflowResults', 'recorders']) own(snapshot, field);
  if (!isPlainRecord(result.sharedState) || !Array.isArray(result.commitLog)) throw invalid();
  return Object.freeze(result);
}
export function sourceView(root: Record<string, unknown>, narrative: readonly NarrativeEntry[], states: ReadonlyMap<string, SubflowLoadState>, revision: number, previous?: RecordingSourceSnapshot) {
  if (previous) return Object.freeze({ revision, snapshot: previous.snapshot, narrativeEntries: previous.narrativeEntries, scopes: readonlyMap(states) });
  const results: Record<string, unknown> = Object.create(null);
  if (root.subflowResults !== undefined) {
    if (!isPlainRecord(root.subflowResults)) throw invalid();
    for (const key of Object.keys(root.subflowResults)) if (key.includes('#')) results[key] = own(root.subflowResults, key);
  }
  const entries = [...narrative];
  for (const state of states.values()) if (state.status === 'ready') {
    results[state.request.mountRuntimeStageId] = state.value.result;
    if (state.value.narrativeEntries) entries.push(...state.value.narrativeEntries);
  }
  return Object.freeze({ revision, snapshot: Object.freeze({ ...root, subflowResults: Object.freeze(results) }) as unknown as RuntimeSnapshotInput,
    narrativeEntries: Object.freeze(entries) as unknown as NarrativeEntry[], scopes: readonlyMap(states) });
}
export function scopedGraph(root: TraceGraph, path: readonly string[], states: ReadonlyMap<string, SubflowLoadState>): TraceGraph {
  let nodes = root.nodes, edges = root.edges, changed = false;
  for (let length = 1; length <= path.length; length++) {
    const scope = states.get(JSON.stringify(path.slice(0, length)));
    if (scope?.status !== 'ready' || !scope.value.graph) continue;
    const removed = ownedGraphIds(nodes, scope.request.subflowId);
    if (!removed.size && !scope.value.graph.nodes.length && !scope.value.graph.edges.length) continue;
    changed = true;
    const retainedNodes = nodes.filter(node => !removed.has(node.id));
    const retainedNodeIds = new Set(retainedNodes.map(node => node.id));
    if (scope.value.graph.nodes.some(node => retainedNodeIds.has(node.id))) throw invalid();
    nodes = [...retainedNodes, ...scope.value.graph.nodes];
    const retainedEdges = edges.filter(edge => !removed.has(edge.source) && !removed.has(edge.target));
    const retainedIds = new Set(retainedEdges.map(edge => edge.id));
    if (scope.value.graph.edges.some(edge => retainedIds.has(edge.id))) throw invalid();
    edges = [...retainedEdges, ...scope.value.graph.edges];
  }
  if (!changed) return root;
  return Object.freeze({ nodes: Object.freeze(nodes), edges: Object.freeze(edges) }) as unknown as TraceGraph;
}
