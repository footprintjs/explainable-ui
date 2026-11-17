import type { TraceGraph } from '../../components/FlowchartView/traceStructureRecorder';
import type { LoadedSubflow, PreparedSubflow, SubflowLoadRequest } from '../types';
import type { NarrativeEntry, StageSnapshot } from '../../types';
import { childTraceScope } from '../../trace/traceScope';
import { isPlainRecord, readName, readOwnArray, WorkBudget } from '../../trace/safeRecordRead';
import { copyData, invalid, own } from './data';

export function admitGraph(input: unknown, prefix?: string): TraceGraph {
  const graph = copyData(input);
  const budget = new WorkBudget();
  const nodes = readOwnArray(own(graph, 'nodes'), budget);
  const edges = readOwnArray(own(graph, 'edges'), budget);
  const ids = new Set<string>();
  for (const node of nodes) {
    const id = readName(own(node, 'id'));
    if (ids.has(id) || (prefix && !id.startsWith(prefix))) throw invalid();
    ids.add(id);
    const position = own(node, 'position');
    const data = own(node, 'data');
    if (typeof own(position, 'x') !== 'number' || typeof own(position, 'y') !== 'number' || !isPlainRecord(data)
      || typeof own(data, 'label') !== 'string') throw invalid();
    for (const flag of ['isDecider', 'isFork', 'isSubflow', 'isStreaming']) if (typeof own(data, flag) !== 'boolean') throw invalid();
    for (const field of ['prevIds', 'nextIds']) for (const id of readOwnArray(own(data, field), budget)) readName(id);
    const parent = own(node, 'parentId');
    if (parent !== undefined && (typeof parent !== 'string' || (prefix && !parent.startsWith(prefix)))) throw invalid();
    const subflowOf = own(own(node, 'data'), 'subflowOf');
    if (subflowOf !== undefined && (typeof subflowOf !== 'string' || (prefix && subflowOf !== prefix.slice(0, -1) && !subflowOf.startsWith(prefix)))) throw invalid();
  }
  const edgeIds = new Set<string>();
  for (const edge of edges) {
    const id = readName(own(edge, 'id'));
    if (edgeIds.has(id) || !ids.has(readName(own(edge, 'source'))) || !ids.has(readName(own(edge, 'target')))) throw invalid();
    edgeIds.add(id);
  }
  return graph as TraceGraph;
}

function admitNarrative(input: unknown): readonly NarrativeEntry[] | undefined {
  if (input === undefined) return undefined;
  const entries = copyData(input);
  for (const entry of readOwnArray(entries, new WorkBudget())) {
    if (!isPlainRecord(entry) || typeof own(entry, 'text') !== 'string' || typeof own(entry, 'type') !== 'string'
      || typeof own(entry, 'depth') !== 'number') throw invalid();
    const runtimeId = own(entry, 'runtimeStageId');
    if (runtimeId !== undefined) readName(runtimeId);
  }
  return entries as readonly NarrativeEntry[];
}

export function admitLoaded(input: unknown, request: SubflowLoadRequest): LoadedSubflow {
  if (!isPlainRecord(input)) throw invalid();
  const result = copyData(own(input, 'result'));
  const resultId = own(result, 'subflowId');
  if (resultId !== undefined && resultId !== request.subflowId) throw invalid();
  const scope = childTraceScope(result, request.invocationPath);
  if (!scope.availability.ok) throw invalid();
  if (treeRuntimeIds(scope.executionTree).some(id => !id.startsWith(`${request.subflowId}/`))) throw invalid();
  const graphInput = own(input, 'graph'), narrative = admitNarrative(own(input, 'narrativeEntries'));
  return Object.freeze({ result, ...(graphInput !== undefined && { graph: admitGraph(graphInput, `${request.subflowId}/`) }),
    ...(narrative !== undefined && { narrativeEntries: narrative }) });
}

/** Tree order is the converter's pre-order: node, branch children, continuation. */
export function treeRuntimeIds(tree: unknown): string[] {
  const ids: string[] = [], stack = [tree], seen = new Set<unknown>(), budget = new WorkBudget();
  while (stack.length) {
    budget.spend(1); const node = stack.pop();
    if (!isPlainRecord(node) || seen.has(node)) throw invalid(); seen.add(node);
    ids.push(readName(own(node, 'runtimeStageId')));
    const next = own(node, 'next'); if (next !== undefined && next !== null) stack.push(next);
    const children = own(node, 'children');
    if (children !== undefined) stack.push(...readOwnArray(children, budget).reverse());
  }
  return ids;
}

/** The host preparation callback is trusted executable code. This checks its
 * structural correspondence, not the truth of host-provided state values. */
export function admitPrepared(input: unknown, request: SubflowLoadRequest): PreparedSubflow {
  const loaded = admitLoaded(input, request);
  const expected = treeRuntimeIds(own(own(loaded.result, 'treeContext'), 'stageContexts'));
  const snapshots = copyData(own(input, 'snapshots'));
  const entries = readOwnArray(snapshots, new WorkBudget());
  if (!entries.length || entries.length !== expected.length) throw invalid();
  entries.forEach((entry, index) => {
    if (own(entry, 'runtimeStageId') !== expected[index] || !isPlainRecord(own(entry, 'memory'))
      || typeof own(entry, 'stageName') !== 'string' || typeof own(entry, 'stageLabel') !== 'string'
      || typeof own(entry, 'narrative') !== 'string'
      || typeof own(entry, 'startMs') !== 'number' || typeof own(entry, 'durationMs') !== 'number') throw invalid();
  });
  return Object.freeze({ ...loaded, snapshots: snapshots as StageSnapshot[] });
}
