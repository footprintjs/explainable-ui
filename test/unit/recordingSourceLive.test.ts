import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRecordingSource } from '../../src/progressiveRendering';
import type { RecordingSource, RecordingSourceUpdate, LoadedSubflow, SubflowLoadRequest } from '../../src/progressiveRendering';
import type { TraceGraph } from '../../src/components/FlowchartView/traceStructureRecorder';

// Synthetic recorded rows exercise the cumulative delivery protocol, not an
// inferred engine outcome or a claim of independently verified causal truth.
const row = (id: string, value: number) => ({ stage: id, stageId: id, runtimeStageId: `${id}#1`, trace: [{ path: id, readKeys: [] }], overwrite: { [id]: value } });
function graph(ids = ['child']): TraceGraph {
  return { nodes: ids.map(id => ({ id, position: { x: 0, y: 0 }, data: { label: id, isDecider: false, isFork: false,
    isSubflow: id === 'child', isStreaming: false, prevIds: [], nextIds: [] } })), edges: [] };
}
function root(commitLog: unknown[] = [], extra = {}) {
  return { runId: 'run', sharedState: {}, executionTree: { id: 'child', subflowId: 'child', runtimeStageId: 'child#1' }, commitLog, ...extra };
}
const request: SubflowLoadRequest = { invocationPath: ['child#1'], mountRuntimeStageId: 'child#1', subflowId: 'child', runId: 'run' };
function child(amount = 35): LoadedSubflow {
  const first = { stage: 'Sum', stageId: 'child/sum', runtimeStageId: 'child/sum#9', trace: [{ path: 'total' }], overwrite: { total: 35 } };
  return { result: { subflowId: 'child', treeContext: { globalContext: {},
    stageContexts: { id: 'child/sum', name: 'Sum', runtimeStageId: 'child/sum#9', stageReads: {}, stageWrites: { total: 35 },
      ...(amount !== 35 && { next: { id: 'child/after', name: 'After', runtimeStageId: 'child/after#10', stageReads: {}, stageWrites: { total: amount } } }) },
    history: [first, ...(amount !== 35 ? [{ stage: 'After', stageId: 'child/after', runtimeStageId: 'child/after#10', trace: [{ path: 'total' }], overwrite: { total: amount } }] : [])],
  } }, graph: graph(['child/sum']) };
}
let frame!: FrameRequestCallback;
const sources: RecordingSource[] = [];
function start(options: Parameters<typeof createRecordingSource>[0] = { snapshot: root(), graph: graph() }) {
  vi.useFakeTimers(); vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { frame = callback; return 1; });
  vi.stubGlobal('cancelAnimationFrame', vi.fn()); const source = createRecordingSource(options); sources.push(source); return source;
}
const publish = () => frame(0);
afterEach(() => { sources.splice(0).forEach(source => source.dispose()); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('complete cumulative live source cohorts', () => {
  it('retains a non-enumerable own runId for exact requests without modifying the host snapshot', async () => {
    const original = root(); Object.defineProperty(original, 'runId', { value: 'run', enumerable: false, configurable: true });
    Object.defineProperty(original, 'logAddress', { value: ['recorded'], enumerable: false });
    const before = Object.getOwnPropertyDescriptor(original, 'runId');
    const loader = vi.fn(() => child()), source = start({ snapshot: original, graph: graph(), loadSubflow: loader });
    expect((source.rootSnapshot as { runId?: string }).runId).toBe('run');
    expect((source.rootSnapshot as unknown as Record<string, unknown>).logAddress).toEqual(['recorded']);
    const loading = source.load(request); await vi.advanceTimersByTimeAsync(10); publish(); await loading;
    expect(loader).toHaveBeenCalledWith(expect.objectContaining({ runId: 'run' }), expect.anything());
    expect(Object.getOwnPropertyDescriptor(original, 'runId')).toEqual(before); expect(Object.isFrozen(original)).toBe(false);
  });

  it('refuses a changed non-enumerable own runId instead of silently treating both roots as legacy', () => {
    const before = root(); Object.defineProperty(before, 'runId', { value: 'run', enumerable: false });
    const source = start({ snapshot: before, graph: graph() });
    const changed = root(); Object.defineProperty(changed, 'runId', { value: 'another-run', enumerable: false });
    expect(() => source.update({ snapshot: changed, graph: graph() })).toThrow();
    expect((source.rootSnapshot as { runId?: string }).runId).toBe('run'); expect(source.getSnapshot().rootRevision).toBe(0);
  });

  it('never evaluates an own runId accessor and preserves an absent optional own field', () => {
    const input = root(); let reads = 0;
    Object.defineProperty(input, 'runId', { get() { reads++; throw Error('private accessor'); }, enumerable: false });
    expect(() => start({ snapshot: input, graph: graph() })).toThrow(); expect(reads).toBe(0);
    const absent = root(); delete (absent as { runId?: string }).runId;
    const source = start({ snapshot: absent, graph: graph() }); expect(source.rootSnapshot).not.toHaveProperty('runId');
    expect(() => source.update({ snapshot: input, graph: graph() })).toThrow(); expect(reads).toBe(0);
    expect(Object.getOwnPropertyDescriptor(input, 'runId')?.get).toBeDefined();
  });
  it.each(['', undefined])('accepts the engine13 before-run bootstrap and latches one real run ID from %s', bootstrapId => {
    // Shape reported by published engine13 getSnapshot() before run(): a root
    // StageContext stub, no native runtime stamp, empty history and empty runId.
    const before = { runId: bootstrapId, sharedState: {}, commitLog: [], executionTree: { id: 'Seed', name: 'Seed', runtimeStageId: undefined } };
    const source = start({ snapshot: before, graph: graph() });
    expect((source.rootSnapshot as { runId?: string }).runId).toBe(bootstrapId);
    source.update({ snapshot: root([row('a', 1)]), graph: graph() });
    expect(() => source.update({ snapshot: root([row('a', 1)], { runId: 'second-run' }), graph: graph() })).toThrow();
    // The bootstrap getter stays honest until the first run is published.
    expect((source.rootSnapshot as { runId?: string }).runId).toBe(bootstrapId); publish();
    expect((source.rootSnapshot as { runId?: string }).runId).toBe('run');
    expect(() => source.update({ snapshot: root([row('a', 1)], { runId: 'second-run' }), graph: graph() })).toThrow();
    expect(() => source.update({ snapshot: before, graph: graph() })).toThrow();
  });

  it.each([
    { commitLog: [row('a', 1)], executionTree: {} },
    { commitLog: [], executionTree: { runtimeStageId: 'a#1' } },
    { commitLog: [], executionTree: {}, subflowResults: { 'child#1': child().result } },
  ])('refuses an empty run ID once recorded evidence exists', evidence => {
    const snapshot = { sharedState: {}, runId: '', ...evidence };
    expect(() => start({ snapshot, graph: graph() })).toThrow();
  });
  it('coalesces multiple updates to the latest complete history with no pending getter leak', () => {
    const source = start(), before = source.rootSnapshot, beforeGraph = source.rootGraph, listener = vi.fn(); source.subscribe(listener);
    const first = root([row('a', 1)]), latest = root([row('a', 1), row('b', 2)]);
    source.update({ snapshot: first, graph: graph(['child', 'a']) }); source.update({ snapshot: latest, graph: graph(['child', 'a', 'b']) });
    expect(source.rootSnapshot).toBe(before); expect(source.rootGraph).toBe(beforeGraph); expect(listener).not.toHaveBeenCalled();
    publish(); expect(source.rootSnapshot.commitLog).toEqual(latest.commitLog); expect(source.rootSnapshot.commitLog).not.toBe(latest.commitLog);
    expect(source.getSnapshot().snapshot.commitLog).toBe(source.rootSnapshot.commitLog);
    expect(source.rootGraph.nodes.map(node => node.id)).toEqual(['child', 'a', 'b']); expect(listener).toHaveBeenCalledTimes(1);
    expect(source.getSnapshot().rootRevision).toBe(1); expect(Object.isFrozen(source.rootSnapshot)).toBe(true);
  });

  it('owns accepted rows so mutation of an earlier host snapshot cannot rewrite its prefix', () => {
    const original = root([row('a', 1)]), source = start({ snapshot: original, graph: graph() });
    (original.commitLog[0] as ReturnType<typeof row>).overwrite.a = 999;
    expect((source.rootSnapshot.commitLog[0] as ReturnType<typeof row>).overwrite.a).toBe(1);
    expect(() => source.update({ snapshot: root(original.commitLog), graph: graph() })).toThrow();
    expect(source.getSnapshot().rootRevision).toBe(0);
  });

  it.each(['run', 'defined-to-absent', 'absent-to-defined', 'shrink', 'pending-regression'])('refuses %s before publication', kind => {
    const initial = root([row('a', 1)]);
    if (kind === 'absent-to-defined') delete (initial as { runId?: string }).runId;
    const source = start({ snapshot: initial, graph: graph() });
    let changed = root([row('a', 1)]);
    if (kind === 'run') changed.runId = 'other';
    if (kind === 'defined-to-absent') delete (changed as { runId?: string }).runId;
    if (kind === 'shrink') changed = root([]);
    if (kind === 'pending-regression') source.update({ snapshot: root([row('a', 1), row('b', 2)]), graph: graph() });
    expect(() => source.update({ snapshot: changed, graph: graph() })).toThrow();
    expect(source.rootSnapshot.commitLog).toHaveLength(1);
  });

  it.each(['write-value', 'write-path', 'read-prefix', 'timing', 'runtime-id'])('refuses same-length %s history rewrites', kind => {
    const original = row('a', 1), source = start({ snapshot: root([original]), graph: graph() });
    const changed: Record<string, unknown> = structuredClone(original);
    if (kind === 'write-value') changed.overwrite = { a: 999 };
    if (kind === 'write-path') changed.trace = [{ path: 'other', readKeys: [] }];
    if (kind === 'read-prefix') changed.trace = [{ path: 'a', readKeys: ['input'] }];
    if (kind === 'timing') changed.beganAt = 0;
    if (kind === 'runtime-id') changed.runtimeStageId = 'other#1';
    expect(() => source.update({ snapshot: root([changed]), graph: graph() })).toThrow();
    expect(source.rootSnapshot.commitLog).toEqual([original]);
  });

  it('checks same-frame history rewrites against the latest pending cohort', () => {
    const source = start(); source.update({ snapshot: root([row('a', 1)]), graph: graph() });
    expect(() => source.update({ snapshot: root([row('a', 999)]), graph: graph() })).toThrow();
    publish(); expect(source.rootSnapshot.commitLog).toEqual([row('a', 1)]);
  });

  it('retains prior runtime IDs without requiring immutable branch preorder', () => {
    const originalTree = { runtimeStageId: 'fork#0', children: [{ runtimeStageId: 'a#1' }, { runtimeStageId: 'b#2' }] };
    const source = start({ snapshot: root([], { executionTree: originalTree }), graph: graph() });
    const appendedTree = { runtimeStageId: 'fork#0', children: [{ runtimeStageId: 'a#1', next: { runtimeStageId: 'new#3' } }, { runtimeStageId: 'b#2' }] };
    source.update({ snapshot: root([], { executionTree: appendedTree }), graph: graph() }); publish();
    expect(source.rootSnapshot.executionTree).toEqual(appendedTree);
    expect(() => source.update({ snapshot: root([], { executionTree: { runtimeStageId: 'fork#0', children: [{ runtimeStageId: 'a#1' }] } }), graph: graph() })).toThrow();
  });

  it('keeps loaded child evidence and graph identity when the root appends unrelated history', async () => {
    const source = start({ snapshot: root(), graph: graph(), loadSubflow: () => child() });
    const loading = source.load(request); await vi.advanceTimersByTimeAsync(10); publish(); const loaded = await loading;
    const selectedGraph = source.getGraph(['child#1']), rootGraph = source.rootGraph, rootRev = source.getSnapshot().rootRevision;
    source.update({ snapshot: root([row('a', 1)]), graph: graph() }); publish();
    const scope = source.getSnapshot().scopes.get(source.getKey(['child#1']));
    expect(scope?.status === 'ready' ? scope.value : undefined).toBe(loaded);
    expect(source.getSnapshot().snapshot.subflowResults?.['child#1']).toBe(loaded.result);
    expect(source.getGraph(['child#1'])).toBe(selectedGraph); expect(source.rootGraph).toBe(rootGraph);
    expect(source.getSnapshot().rootRevision).toBe(rootRev + 1);
  });

  it('uses authoritative appended inline child evidence instead of older cached data/geometry', async () => {
    const source = start({ snapshot: root(), graph: graph(), loadSubflow: () => child() });
    const loading = source.load(request); await vi.advanceTimersByTimeAsync(10); publish(); await loading;
    const authoritative = child(99).result;
    source.update({ snapshot: root([row('a', 1)], { subflowResults: { 'child#1': authoritative } }), graph: graph(['child', 'child/after']) }); publish();
    expect(source.getSnapshot().scopes.has(source.getKey(['child#1']))).toBe(false);
    expect(source.getSnapshot().snapshot.subflowResults?.['child#1']).toEqual(authoritative);
    expect(source.getGraph(['child#1'])).toBe(source.rootGraph);
    expect(() => source.update({ snapshot: root([row('a', 1), row('b', 2)]), graph: graph() })).toThrow();
  });

  it('refuses authoritative root data rewriting a separately loaded child’s recorded past', async () => {
    const source = start({ snapshot: root(), graph: graph(), loadSubflow: () => child() });
    const loading = source.load(request); await vi.advanceTimersByTimeAsync(10); publish(); const loaded = await loading;
    const rewritten = child().result as { treeContext: { history: Array<{ overwrite: { total: number } }> } };
    rewritten.treeContext.history[0].overwrite.total = 999;
    expect(() => source.update({ snapshot: root([], { subflowResults: { 'child#1': rewritten } }), graph: graph() })).toThrow();
    expect(source.getSnapshot().snapshot.subflowResults?.['child#1']).toBe(loaded.result);
  });

  it('cancels old pending delivery before a newly authoritative child can publish', async () => {
    let resolve!: (value: LoadedSubflow) => void;
    const source = start({ snapshot: root(), graph: graph(), loadSubflow: () => new Promise<LoadedSubflow>(done => { resolve = done; }) });
    const loading = source.load(request), cancelled = expect(loading).rejects.toMatchObject({ name: 'AbortError' });
    await vi.advanceTimersByTimeAsync(0);
    source.update({ snapshot: root([], { subflowResults: { 'child#1': child(99).result } }), graph: graph() }); await cancelled; publish();
    resolve(child()); await Promise.resolve(); await Promise.resolve();
    const result = source.getSnapshot().snapshot.subflowResults?.['child#1'] as { treeContext: { history: unknown[] } };
    expect(result.treeContext.history).toHaveLength(2); expect(source.getSnapshot().scopes.size).toBe(0);
  });

  it('rejects a load created after a queued authoritative update even when its old network response arrives after publication', async () => {
    let resolve!: (value: LoadedSubflow) => void;
    const source = start({ snapshot: root(), graph: graph(), loadSubflow: () => new Promise<LoadedSubflow>(done => { resolve = done; }) });
    const authoritative = child(99).result;
    source.update({ snapshot: root([], { subflowResults: { 'child#1': authoritative } }), graph: graph() });
    const loading = source.load(request), rejected = expect(loading).rejects.toMatchObject({ name: 'AbortError' });
    await vi.advanceTimersByTimeAsync(0); publish();
    expect(source.getSnapshot().snapshot.subflowResults?.['child#1']).toEqual(authoritative);
    resolve(child()); await vi.advanceTimersByTimeAsync(10); await rejected; publish();
    expect(source.getSnapshot().snapshot.subflowResults?.['child#1']).toEqual(authoritative);
    expect(source.getSnapshot().scopes.has(source.getKey(['child#1']))).toBe(false);
  });

  it('supports a pure live source without a pretend loader and still prepares inline evidence', async () => {
    const source = start({ snapshot: root([], { subflowResults: { 'child#1': child().result } }), graph: graph() });
    expect(source.canLoadSubflows).toBe(false);
    const loading = source.load(request); await vi.advanceTimersByTimeAsync(10); publish(); expect((await loading).snapshots[0].memory.total).toBe(35);
    const missing = start(); await expect(missing.load(request)).rejects.toThrow('loading is unavailable');
  });

  it('increments only rootRevision for published roots and refuses disposed writes', () => {
    const source = start(), rootBefore = source.rootSnapshot;
    const value: RecordingSourceUpdate = { snapshot: root(), graph: graph(), narrativeEntries: [{ type: 'step', text: 'Recorded arrival', depth: 0 }] };
    source.update(value); expect(source.getSnapshot().rootRevision).toBe(0); publish();
    expect(source.getSnapshot().rootRevision).toBe(1); expect(source.getSnapshot().narrativeEntries[0].text).toBe('Recorded arrival');
    expect(rootBefore).not.toBe(source.rootSnapshot); source.dispose(); expect(() => source.update(value)).toThrow('disposed');
  });
});

describe('capture on recorder notification', () => {
  it('captures one complete cohort and publishes it in the same frame', async () => {
    const source = start(), listener = vi.fn();
    source.subscribe(listener);
    const history = [row('items', 30)];
    const read = vi.fn(() => ({ snapshot: root(history), graph: graph() }));
    const first = source.requestUpdate(read);
    history.push(row('delivery', 5), row('combine', 35));
    expect(source.requestUpdate(read)).toBe(first);
    expect(read).not.toHaveBeenCalled();
    publish();
    await first;
    expect(read).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(source.rootSnapshot.commitLog).toEqual(history);
    expect(source.getSnapshot().rootRevision).toBe(1);
  });

  it('uses the latest reader and lets an admitted eager capture supersede an unread request', async () => {
    const source = start();
    const skipped = vi.fn(() => { throw new Error('obsolete'); });
    const read = vi.fn(() => ({ snapshot: root([row('a', 1)]), graph: graph() }));
    const first = source.requestUpdate(skipped);
    source.requestUpdate(read);
    publish();
    await first;
    const final = source.requestUpdate(skipped);
    const history = [row('a', 1), row('b', 2)];
    source.update({ snapshot: root(history), graph: graph() });
    publish();
    await final;
    expect(skipped).not.toHaveBeenCalled();
    expect(read).toHaveBeenCalledTimes(1);
    expect(source.rootSnapshot.commitLog).toEqual(history);
  });

  it('rejects failed capture and prevents a later run from replacing valid pending evidence', async () => {
    const source = start();
    const first = row('a', 1);
    source.update({ snapshot: root([first]), graph: graph() });
    const wrongRun = source.requestUpdate(() => ({ snapshot: root([], { runId: 'another-run' }), graph: graph() }));
    publish();
    await expect(wrongRun).rejects.toThrow('same run');
    expect(source.rootSnapshot.commitLog).toEqual([first]);
    const failure = source.requestUpdate(() => { throw new Error('recorder unavailable'); });
    publish();
    await expect(failure).rejects.toThrow('recorder unavailable');
    expect(source.getSnapshot().rootRevision).toBe(1);
    const retry = source.requestUpdate(() => ({ snapshot: root([first, row('b', 2)]), graph: graph() }));
    publish();
    await retry;
    expect(source.getSnapshot().rootRevision).toBe(2);
  });

  it('cancels a pending capture on disposal without reading the replaced run', async () => {
    const source = start(), read = vi.fn(() => ({ snapshot: root(), graph: graph() }));
    const pending = source.requestUpdate(read);
    source.dispose();
    publish();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    await expect(source.requestUpdate(read)).rejects.toMatchObject({ name: 'AbortError' });
    expect(read).not.toHaveBeenCalled();
  });

  it('delivers final evidence with the frame timer fallback and retains reentrant notifications', async () => {
    const source = start();
    const first = row('a', 1);
    let followUp: Promise<void> | undefined;
    const unsubscribe = source.subscribe(() => {
      unsubscribe();
      followUp = source.requestUpdate(() => ({ snapshot: root([first, row('b', 2)]), graph: graph() }));
    });
    const initial = source.requestUpdate(() => ({ snapshot: root([first]), graph: graph() }));
    await vi.advanceTimersByTimeAsync(100);
    await initial;
    expect(source.rootSnapshot.commitLog).toEqual([first]);
    await vi.advanceTimersByTimeAsync(100);
    await followUp;
    expect(source.rootSnapshot.commitLog).toHaveLength(2);
  });
});
