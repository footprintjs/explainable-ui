import { isPlainRecord, readName, readOwnArray, WorkBudget } from '../../trace/safeRecordRead';
import type { RuntimeSnapshotInput } from '../../model/recording';
import type { SubflowLoadRequest, SubflowLoadState } from '../types';
import { invalid, own } from '../prepare';
import { childTraceScope } from '../../trace/traceScope';

export function readPath(input: unknown, empty = true): readonly string[] {
  const path = readOwnArray(input, new WorkBudget()).map(readName);
  if ((!empty && !path.length) || path.length > 128 || path.join('').length > 8192 || new Set(path).size !== path.length) throw invalid();
  return Object.freeze(path);
}
export function pathKey(path: readonly string[]): string { return JSON.stringify(readPath(path)); }

export function normalizeRequest(input: unknown, root: RuntimeSnapshotInput, states: ReadonlyMap<string, SubflowLoadState>): SubflowLoadRequest {
  if (!isPlainRecord(input)) throw invalid();
  const path = readPath(own(input, 'invocationPath'), false);
  const mountRuntimeStageId = readName(own(input, 'mountRuntimeStageId'));
  const subflowId = readName(own(input, 'subflowId'));
  if (path.at(-1) !== mountRuntimeStageId) throw invalid();
  const runId = own(root, 'runId'), suppliedRun = own(input, 'runId');
  if (runId !== undefined && (typeof runId !== 'string' || !runId.length)) throw invalid();
  if (suppliedRun !== undefined && suppliedRun !== runId) throw invalid();
  let tree = own(root, 'executionTree'), parentSubflow: string | undefined;
  for (let depth = 0; depth < path.length; depth++) {
    const selected = recordedMount(tree, path[depth]);
    if (parentSubflow && !selected.startsWith(`${parentSubflow}/`)) throw invalid();
    if (depth === path.length - 1) { if (selected !== subflowId) throw invalid(); break; }
    const ancestry = path.slice(0, depth + 1), state = states.get(pathKey(ancestry));
    const result = state?.status === 'ready' ? state.value.result : own(own(root, 'subflowResults'), path[depth]);
    if (!childTraceScope(result, ancestry).availability.ok) throw invalid();
    const resultId = own(result, 'subflowId'); if (resultId !== undefined && resultId !== selected) throw invalid();
    tree = own(own(result, 'treeContext'), 'stageContexts'); parentSubflow = selected;
  }
  return Object.freeze({ invocationPath: path, mountRuntimeStageId, subflowId, ...(typeof runId === 'string' && { runId }) });
}

function recordedMount(tree: unknown, runtimeId: string): string {
  const stack = [tree], seen = new Set<unknown>(), budget = new WorkBudget(); let matches = 0;
  let subflowId: string | undefined;
  while (stack.length) {
    budget.spend(1); const node = stack.pop();
    if (!isPlainRecord(node) || seen.has(node)) throw invalid(); seen.add(node);
    if (own(node, 'runtimeStageId') === runtimeId) {
      const recordedSubflow = own(node, 'subflowId');
      subflowId = readName(recordedSubflow);
      matches++;
    }
    const next = own(node, 'next'); if (next !== undefined && next !== null) stack.push(next);
    const children = own(node, 'children'); if (children !== undefined) stack.push(...readOwnArray(children, budget));
  }
  if (matches !== 1 || !subflowId) throw invalid();
  return subflowId;
}
