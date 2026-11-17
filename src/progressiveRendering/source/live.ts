import type { RuntimeSnapshotInput } from '../../model/recording';
import type { TraceGraph } from '../../components/FlowchartView/traceStructureRecorder';
import type { NarrativeEntry } from '../../types';
import type { RecordingSourceUpdate } from '../types';
import { narrativeRecorderFromSnapshot } from '../../adapters/fromRuntimeSnapshot';
import { isPlainRecord, readName, readOwnArray, WorkBudget } from '../../trace/safeRecordRead';
import { admitGraph, copyData, invalid, own, sameOwnedData } from '../prepare';
export { sameOwnedData } from '../prepare';
import { rootFields } from './views';

export interface LiveCohort {
  readonly fields: Record<string, unknown>;
  readonly graph: TraceGraph;
  readonly narrative: readonly NarrativeEntry[];
  readonly treeIds: ReadonlySet<string>;
  readonly bootstrap: boolean;
}

function assertPrefix(previous: unknown, next: unknown): void {
  const before = readOwnArray(previous, new WorkBudget()), after = readOwnArray(next, new WorkBudget());
  if (after.length < before.length) throw invalid();
  // One comparison budget covers the entire admitted prefix, not one per row.
  if (!sameOwnedData(before, after.slice(0, before.length))) throw invalid();
}
function treeIds(tree: unknown): ReadonlySet<string> {
  const ids = new Set<string>(), seen = new Set<unknown>(), budget = new WorkBudget();
  const queue: unknown[] = tree === null || tree === undefined ? [] : [tree];
  for (let index = 0; index < queue.length; index++) {
    budget.spend(1); const node = queue[index];
    if (!isPlainRecord(node) || seen.has(node)) throw invalid(); seen.add(node);
    const id = own(node, 'runtimeStageId'); if (id !== undefined) { const name = readName(id); if (ids.has(name)) throw invalid(); ids.add(name); }
    const next = own(node, 'next'); if (next !== undefined && next !== null) queue.push(next);
    const children = own(node, 'children'); if (children !== undefined) queue.push(...readOwnArray(children, budget));
  }
  return ids;
}
function assertTreePrefix(previous: ReadonlySet<string>, next: ReadonlySet<string>): void {
  for (const id of previous) if (!next.has(id)) throw invalid();
}
export function assertCumulativeChild(before: unknown, after: unknown): void {
  const oldContext = own(before, 'treeContext'), newContext = own(after, 'treeContext');
  const oldHistory = own(oldContext, 'history');
  if (oldHistory !== undefined) assertPrefix(oldHistory, own(newContext, 'history'));
  assertTreePrefix(treeIds(own(oldContext, 'stageContexts')), treeIds(own(newContext, 'stageContexts')));
}

/** Admission happens before queuing a visual callback. Kept historical copies
 * cannot be rewritten by mutation of a caller's previously supplied objects. */
export function admitCohort(value: RecordingSourceUpdate, previous?: LiveCohort): LiveCohort {
  const original = own(value, 'snapshot') as RuntimeSnapshotInput;
  const input = copyData(rootFields(original)), run = own(input, 'runId');
  if (run !== undefined && typeof run !== 'string') throw invalid();
  const history = input.commitLog;
  const inline = input.subflowResults;
  if (inline !== undefined && !isPlainRecord(inline)) throw invalid();
  const fields: Record<string, unknown> = Object.freeze({ ...input, commitLog: history, ...(inline !== undefined && { subflowResults: inline }) });
  const ids = treeIds(fields.executionTree);
  // Engine13 publishes an empty runId before run() creates the first run.
  // This is a bootstrap absence, only while no recorded evidence exists.
  const bootstrap = (run === undefined || run === '') && ids.size === 0
    && readOwnArray(history, new WorkBudget()).length === 0 && (inline === undefined || Object.keys(inline).length === 0);
  if (run === '' && !bootstrap) throw invalid();
  if (previous && !previous.bootstrap && run !== own(previous.fields, 'runId')) throw invalid();
  if (previous) {
    assertPrefix(previous.fields.commitLog, history); assertTreePrefix(previous.treeIds, ids);
    const oldInline = previous.fields.subflowResults;
    if (oldInline !== undefined && !isPlainRecord(oldInline)) throw invalid();
    if (isPlainRecord(oldInline)) for (const key of Object.keys(oldInline)) if (key.includes('#')) {
      const before = own(oldInline, key), after = own(inline, key); if (after === undefined) throw invalid();
      assertCumulativeChild(before, after);
    }
  }
  const candidateGraph = admitGraph(own(value, 'graph'));
  const graph = previous && sameOwnedData(previous.graph, candidateGraph) ? previous.graph : candidateGraph;
  const suppliedNarrative = own(value, 'narrativeEntries');
  const narrative = copyData(suppliedNarrative ?? narrativeRecorderFromSnapshot({ recorders: copyData(input.recorders) })?.entries ?? []);
  for (const entry of readOwnArray(narrative, new WorkBudget())) {
    if (!isPlainRecord(entry) || typeof own(entry, 'text') !== 'string' || typeof own(entry, 'type') !== 'string' || typeof own(entry, 'depth') !== 'number') throw invalid();
  }
  return Object.freeze({ fields, graph, narrative: narrative as readonly NarrativeEntry[], treeIds: ids, bootstrap });
}
