/** Scope selection only. The existing dataTrace / traceWalk own traversal. */
export interface TraceScope {
  /** Full mount invocation chain; chart labels and local names are not identity. */
  identity: readonly string[];
  commitLog: unknown[];
  executionTree: unknown;
  unavailable: boolean;
}

const MAX_ITEMS = 10_000;
const MAX_NAME_LENGTH = 4_096;

/** New child-record boundary: never evaluate accessors from a stored record. */
function own(value: unknown, key: PropertyKey): unknown {
  if (!value || typeof value !== 'object') return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  return descriptor && 'value' in descriptor ? descriptor.value : undefined;
}
function record(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object') return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
function array(value: unknown, spend: (count: number) => void): unknown[] {
  const length = own(value, 'length');
  if (!Array.isArray(value) || typeof length !== 'number' || !Number.isInteger(length) || length < 0 || length > MAX_ITEMS) throw new Error('unavailable');
  spend(length);
  const result: unknown[] = [];
  for (let index = 0; index < length; index++) {
    const descriptor = Object.getOwnPropertyDescriptor(value, index);
    if (!descriptor || !('value' in descriptor)) throw new Error('unavailable');
    result.push(descriptor.value);
  }
  return result;
}
function text(value: unknown): string {
  if (typeof value !== 'string' || value.length === 0 || value.length > MAX_NAME_LENGTH) throw new Error('unavailable');
  return value;
}

/**
 * Project the child's OWN trace evidence. Never substitute its parent's log.
 * Missing per-step reads or writes are unknown, not an empty successful trace.
 * Projection copies names only; it never reads stored values or error text.
 */
export function childTraceScope(result: unknown, identity: readonly string[]): TraceScope {
  const unavailable = (): TraceScope => ({ identity, commitLog: [], executionTree: undefined, unavailable: true });
  try {
    let remaining = MAX_ITEMS;
    const spend = (count: number) => {
      remaining -= count;
      if (remaining < 0) throw new Error('unavailable');
    };
    // Scope identity is host navigation state, not a local display label.
    if (identity.length === 0 || identity.length > 128 ||
      identity.some(part => typeof part !== 'string' || part.length === 0 || part.length > MAX_NAME_LENGTH) ||
      identity.join('').length > MAX_NAME_LENGTH * 2) return unavailable();
    const context = own(result, 'treeContext');
    const history = array(own(context, 'history'), spend);
    if (history.length === 0) return unavailable();
    const recordedCommits = history.map(entry => ({
      stage: text(own(entry, 'stage')),
      stageId: text(own(entry, 'stageId')),
      runtimeStageId: text(own(entry, 'runtimeStageId')),
      trace: array(own(entry, 'trace'), spend).map(write => ({ path: text(own(write, 'path')) })),
    }));
    type TraceNode = { runtimeStageId: string; stageReads?: Record<string, boolean>; next?: TraceNode; children?: TraceNode[] };
    const source = own(context, 'stageContexts');
    const executionTree = {} as TraceNode;
    const queue: Array<[unknown, TraceNode]> = [[source, executionTree]];
    const seen = new Set<unknown>();
    const runtimeIds = new Set<string>();
    const capturedReads = new Set<string>();
    for (let index = 0; index < queue.length; index++) {
      spend(1);
      const [node, target] = queue[index];
      if (!record(node) || seen.has(node)) return unavailable();
      seen.add(node);
      target.runtimeStageId = text(own(node, 'runtimeStageId'));
      if (runtimeIds.has(target.runtimeStageId)) return unavailable();
      runtimeIds.add(target.runtimeStageId);
      const reads = own(node, 'stageReads');
      if (record(reads)) {
        const keys = Object.keys(reads);
        spend(keys.length);
        if (keys.some(key => key.length > MAX_NAME_LENGTH)) return unavailable();
        target.stageReads = Object.fromEntries(keys.map(key => [key, true]));
        capturedReads.add(target.runtimeStageId);
      }
      const next = own(node, 'next');
      if (next !== undefined && next !== null) {
        target.next = {} as TraceNode;
        queue.push([next, target.next]);
      }
      const children = own(node, 'children');
      if (children !== undefined) {
        target.children = array(children, spend).map(child => {
          const projected = {} as TraceNode;
          queue.push([child, projected]);
          return projected;
        });
      }
    }
    // Current engine histories start with the mount's input-mapping bundle.
    // It belongs to the parent invocation, not to a step on this child rail.
    // Its writes become child inputs; their parent ancestry is not inferred.
    const mountInvocation = identity[identity.length - 1];
    const commitLog = recordedCommits.filter(entry =>
      entry.runtimeStageId !== mountInvocation || capturedReads.has(entry.runtimeStageId));
    if (commitLog.length === 0 || commitLog.some(entry => !capturedReads.has(entry.runtimeStageId))) return unavailable();
    return { identity, commitLog, executionTree, unavailable: false };
  } catch {
    // Includes hostile proxies: a failed inspection is unknown, never a trace.
    return unavailable();
  }
}
