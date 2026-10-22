import { describe, expect, it } from 'vitest';
import { childTraceScope } from '../../src/components/ExplainableShell/_internal/traceScope';

function fixture() {
  return { treeContext: {
    history: [
      { stage: 'Seed', stageId: 'seed', runtimeStageId: 'mount/seed#1', trace: [{ path: 'price' }] },
      { stage: 'Total', stageId: 'total', runtimeStageId: 'mount/total#2', trace: [{ path: 'total' }] },
    ],
    stageContexts: { runtimeStageId: 'mount/seed#1', stageReads: {},
      next: { runtimeStageId: 'mount/total#2', stageReads: { price: 2 } } },
  } };
}
const identity = ['outer#5', 'outer/mount#9'];

describe('selected child trace boundary', () => {
  it('keeps full invocation identity and projects only names, never stored values', () => {
    const input = fixture();
    let invoked = false;
    Object.defineProperty(input.treeContext.stageContexts.next.stageReads, 'price', {
      enumerable: true, get() { invoked = true; throw Error('must not run'); },
    });
    const selected = childTraceScope(input, identity);
    expect(selected.unavailable).toBe(false);
    expect(selected.identity).toEqual(identity);
    expect(selected.executionTree).toEqual({ runtimeStageId: 'mount/seed#1', stageReads: {},
      next: { runtimeStageId: 'mount/total#2', stageReads: { price: true } } });
    expect(invoked).toBe(false);
  });

  it.each(['treeContext', 'history', 'stageContexts', 'stageReads', 'trace', 'path'])('refuses accessor %s without invoking it', field => {
    const input = fixture();
    let target: object = input;
    if (field === 'history' || field === 'stageContexts') target = input.treeContext;
    if (field === 'stageReads') target = input.treeContext.stageContexts;
    if (field === 'trace') target = input.treeContext.history[0];
    if (field === 'path') target = input.treeContext.history[0].trace[0];
    let calls = 0;
    Object.defineProperty(target, field, { get() { calls++; throw Error('secret'); } });
    expect(childTraceScope(input, identity).unavailable).toBe(true);
    expect(calls).toBe(0);
  });

  it('labels the exact mount initializer as the child input boundary, never a child stage', () => {
    const input = fixture();
    input.treeContext.history.unshift({ stage: 'Mount', stageId: 'mount', runtimeStageId: 'outer/mount#9', trace: [{ path: 'input' }] });
    const selected = childTraceScope(input, identity);
    expect(selected.unavailable).toBe(false);
    expect(selected.commitLog).toHaveLength(2);
    expect(selected.commitLog).not.toContainEqual(expect.objectContaining({ runtimeStageId: 'outer/mount#9' }));
  });

  it.each(['history', 'stageContexts'])('treats missing %s as unavailable without falling back', field => {
    const input = fixture();
    delete (input.treeContext as Record<string, unknown>)[field];
    const selected = childTraceScope(input, identity);
    expect(selected).toEqual({ identity, unavailable: true, commitLog: [], executionTree: undefined });
  });

  it('refuses a different missing tree stage instead of treating it as an input mapper', () => {
    const input = fixture();
    input.treeContext.history.unshift({ stage: 'Missing', stageId: 'missing', runtimeStageId: 'different#3', trace: [{ path: 'x' }] });
    expect(childTraceScope(input, identity).unavailable).toBe(true);
  });

  it('does not read array properties through getters and bounds identity/name strings', () => {
    const input = fixture();
    let gets = 0;
    input.treeContext.history = new Proxy(input.treeContext.history, { get(target, key, receiver) { gets++; return Reflect.get(target, key, receiver); } });
    expect(childTraceScope(input, identity).unavailable).toBe(false);
    expect(gets).toBe(0);
    expect(childTraceScope(fixture(), []).unavailable).toBe(true);
    expect(childTraceScope(fixture(), ['x'.repeat(4_097)]).unavailable).toBe(true);
    expect(childTraceScope(fixture(), Array.from({ length: 129 }, () => 'mount#0')).unavailable).toBe(true);
    const largeName = fixture();
    largeName.treeContext.history[0].trace[0].path = 'x'.repeat(4_097);
    expect(childTraceScope(largeName, identity).unavailable).toBe(true);
  });

  it('refuses duplicate runtime IDs and an aggregate excess of trace names', () => {
    const duplicate = fixture();
    duplicate.treeContext.stageContexts.next.runtimeStageId = 'mount/seed#1';
    expect(childTraceScope(duplicate, identity).unavailable).toBe(true);
    const large = fixture();
    large.treeContext.history[0].trace = Array.from({ length: 6_000 }, (_, index) => ({ path: `price${index}` }));
    large.treeContext.history[1].trace = Array.from({ length: 6_000 }, (_, index) => ({ path: `total${index}` }));
    expect(childTraceScope(large, identity).unavailable).toBe(true);
  });

  it('does not borrow reads from a duplicate ID when the first node has no read evidence', () => {
    const input = fixture();
    input.treeContext.history = input.treeContext.history.slice(0, 1);
    delete (input.treeContext.stageContexts as { stageReads?: unknown }).stageReads;
    input.treeContext.stageContexts.next.runtimeStageId = input.treeContext.stageContexts.runtimeStageId;
    expect(childTraceScope(input, identity).unavailable).toBe(true);
  });

  it('refuses inherited reads, sparse history, cycles and oversized records', () => {
    const inherited = fixture();
    Object.setPrototypeOf(inherited.treeContext.stageContexts, { stageReads: {} });
    expect(childTraceScope(inherited, identity).unavailable).toBe(true);
    const sparse = fixture();
    delete sparse.treeContext.history[0];
    expect(childTraceScope(sparse, identity).unavailable).toBe(true);
    const cyclic = fixture();
    Object.assign(cyclic.treeContext.stageContexts.next, { next: cyclic.treeContext.stageContexts });
    expect(childTraceScope(cyclic, identity).unavailable).toBe(true);
    const oversized = fixture();
    oversized.treeContext.history.length = 10_001;
    expect(childTraceScope(oversized, identity).unavailable).toBe(true);
  });
});
