import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { createRecordingSource } from '../../src/progressiveRendering';
import type { LoadedSubflow, RecordingSource, RecordingSourceOptions, SubflowLoadRequest } from '../../src/progressiveRendering';
import type { TraceGraph } from '../../src/components/FlowchartView/traceStructureRecorder';

const sources: RecordingSource[] = [];
function graph(ids: string[]): TraceGraph {
  return { nodes: ids.map(id => ({ id, position: { x: 0, y: 0 }, data: {
    label: id, isDecider: false, isFork: false, isSubflow: false, isStreaming: false, prevIds: [], nextIds: [],
  } })), edges: [] };
}
function request(id = 'child', visit = 1, parent: string[] = []): SubflowLoadRequest {
  const mountRuntimeStageId = `${id}#${visit}`;
  return { invocationPath: [...parent, mountRuntimeStageId], mountRuntimeStageId, subflowId: id, runId: 'run' };
}
function child(id = 'child', amount = 35): LoadedSubflow {
  return { result: { subflowId: id, treeContext: {
    globalContext: {},
    stageContexts: { id: `${id}/sum`, name: `${id}/Sum`, runtimeStageId: `${id}/sum#9`, stageReads: {}, stageWrites: { total: amount } },
    history: [{ stage: `${id}/Sum`, stageId: `${id}/sum`, runtimeStageId: `${id}/sum#9`, trace: [{ path: 'total' }], overwrite: { total: amount } }],
  } }, graph: graph([`${id}/sum`]) };
}
function setup(loadSubflow: RecordingSourceOptions['loadSubflow'], extra: Partial<RecordingSourceOptions> = {}) {
  const snapshot = { runId: 'run', sharedState: {}, commitLog: [], executionTree: {
    id: 'child', subflowId: 'child', runtimeStageId: 'child#1', next: { id: 'child', subflowId: 'child', runtimeStageId: 'child#2' },
  } };
  const source = createRecordingSource({ snapshot, graph: graph(['child', 'unrelated']), loadSubflow, ...extra });
  sources.push(source);
  return { source, snapshot };
}
function deferred<T>() { let resolve!: (value: T) => void; let reject!: (error: unknown) => void; const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; }
afterEach(() => { sources.splice(0).forEach(source => source.dispose()); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('recording source delivery and exact evidence ownership', () => {
  it('publishes pending immediately and a coherent ready unit without changing the original root', async () => {
    const delivery = deferred<LoadedSubflow>();
    const { source, snapshot } = setup(() => delivery.promise);
    const first = source.getSnapshot(); const notices: string[] = [];
    source.subscribe(() => notices.push(source.getSnapshot().scopes.get(source.getKey(['child#1']))!.status));
    const pending = source.load(request());
    expect(source.getSnapshot().scopes.get(source.getKey(['child#1']))?.status).toBe('loading');
    expect(source.getSnapshot().snapshot).toBe(first.snapshot);
    expect(source.getSnapshot().narrativeEntries).toBe(first.narrativeEntries);
    delivery.resolve(child()); const value = await pending;
    expect(value.snapshots[0].memory.total).toBe(35);
    expect(source.rootSnapshot).not.toBe(snapshot); expect(source.rootSnapshot).toEqual(snapshot); expect(Object.isFrozen(source.rootSnapshot)).toBe(true);
    expect(snapshot).not.toHaveProperty('subflowResults');
    expect(source.getSnapshot().snapshot.subflowResults?.['child#1']).toBe(value.result);
    expect(first.snapshot).not.toHaveProperty('subflowResults.child#1');
    expect(notices).toEqual(['loading', 'preparing', 'ready']);
    expect(Object.isFrozen(source.getSnapshot())).toBe(true);
    expect(Object.isFrozen(value.snapshots)).toBe(true);
    expect((source.getSnapshot().scopes as unknown as { set?: unknown }).set).toBeUndefined();
  });

  it('deduplicates delivery but caller cancellation releases only its own lease', async () => {
    const delivery = deferred<LoadedSubflow>(); let signal!: AbortSignal;
    const loader = vi.fn((_request, options) => { signal = options.signal; return delivery.promise; });
    const { source } = setup(loader);
    const a = new AbortController(); const b = new AbortController();
    const first = source.load(request(), { signal: a.signal }); const second = source.load(request(), { signal: b.signal });
    await new Promise(resolve => setTimeout(resolve, 0));
    const rejected = expect(first).rejects.toMatchObject({ name: 'AbortError' });
    a.abort(); await rejected;
    expect(signal.aborted).toBe(false); expect(loader).toHaveBeenCalledTimes(1);
    delivery.resolve(child()); await second;
    const ready = source.getSnapshot().scopes.get(source.getKey(['child#1']));
    expect(ready?.status).toBe('ready');
    expect(await source.load(request())).toBe(ready?.status === 'ready' ? ready.value : undefined);
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('ignores late ignored-abort delivery and allows a clean retry', async () => {
    const late = deferred<LoadedSubflow>(); let count = 0; let oldSignal!: AbortSignal;
    const { source } = setup((_request, options) => { oldSignal = options.signal; return ++count === 1 ? late.promise : child(); });
    const abort = new AbortController(); const first = source.load(request(), { signal: abort.signal });
    await new Promise(resolve => setTimeout(resolve, 0));
    const rejected = expect(first).rejects.toMatchObject({ name: 'AbortError' }); abort.abort(); await rejected;
    expect(oldSignal.aborted).toBe(true);
    const second = await source.load(request()); late.resolve(child('child', 999)); await Promise.resolve();
    expect(second.snapshots[0].memory.total).toBe(35);
    expect(source.getSnapshot().snapshot.subflowResults?.['child#1']).toBe(second.result);
  });

  it('isolates different visits sharing diagram IDs and keeps unrelated root nodes', async () => {
    let count = 0; const { source } = setup(() => { const value = child('child', ++count); value.graph!.nodes[0].data.label = `visit ${count}`; return value; });
    const rootGraph = source.getGraph([]);
    await source.load(request()); const firstGraph = source.getGraph(['child#1']); await source.load(request('child', 2));
    expect(source.getGraph([])).toBe(rootGraph); expect(rootGraph).toBe(source.rootGraph);
    expect(source.getGraph(['child#1'])).toBe(firstGraph);
    expect(source.getGraph(['child#1']).nodes.find(node => node.id === 'child/sum')?.data.label).toBe('visit 1');
    expect(source.getGraph(['child#2']).nodes.find(node => node.id === 'child/sum')?.data.label).toBe('visit 2');
    expect(source.getGraph([]).nodes.map(node => node.id)).toEqual(['child', 'unrelated']);
    expect(source.getGraph(['child#1']).nodes.map(node => node.id)).toEqual(['child', 'unrelated', 'child/sum']);
    expect(Object.keys(source.getSnapshot().snapshot.subflowResults!)).toEqual(['child#1', 'child#2']);
  });

  it('loads a nested child only below its exact admitted parent', async () => {
    const outer = child();
    const raw = outer.result as { treeContext: { stageContexts: Record<string, unknown> } };
    Object.assign(raw.treeContext.stageContexts, { next: { id: 'child/nested', subflowId: 'child/nested', runtimeStageId: 'child/nested#10', stageReads: {} } });
    const parent = { ...outer, graph: graph(['child/sum', 'child/nested']) };
    const loader = vi.fn((req: SubflowLoadRequest) => req.subflowId === 'child' ? parent : child('child/nested'));
    const { source } = setup(loader);
    await expect(source.load(request('child/nested', 10, ['child#1']))).rejects.toThrow();
    expect(loader).not.toHaveBeenCalled();
    await source.load(request()); await source.load(request('child/nested', 10, ['child#1']));
    expect(source.getGraph(['child#1', 'child/nested#10']).nodes.map(node => node.id)).toContain('child/nested/sum');
    expect(source.getGraph(['child#2']).nodes.map(node => node.id)).not.toContain('child/nested/sum');
  });

  it.each([
    () => ({ result: {} }),
    () => { const value = child(); (value.result as { treeContext: { history: unknown[] } }).treeContext.history = []; return value; },
    () => ({ ...child(), graph: graph(['unrelated']) }),
  ])('refuses malformed/empty evidence or foreign diagram geometry without publishing it', async make => {
    const { source } = setup(make);
    await expect(source.load(request())).rejects.toThrow();
    expect(source.getSnapshot().scopes.get(source.getKey(['child#1']))?.status).toBe('error');
    expect(source.getSnapshot().snapshot.subflowResults?.['child#1']).toBeUndefined();
    expect(source.getGraph([]).nodes.map(node => node.id)).toEqual(['child', 'unrelated']);
  });

  it('never invokes stored accessors or inspects a rejected error object', async () => {
    let calls = 0; const value = child();
    Object.defineProperty(value.result, 'treeContext', { get() { calls++; throw Error('secret'); } });
    const { source } = setup(() => value); await expect(source.load(request())).rejects.toThrow(); expect(calls).toBe(0);
    const thrown = new Proxy({}, { get() { calls++; throw Error('secret'); }, getOwnPropertyDescriptor() { calls++; throw Error('secret'); } });
    const failing = setup(() => Promise.reject(thrown)).source;
    await expect(failing.load(request())).rejects.toThrow('Recorded subflow could not be loaded.'); expect(calls).toBe(0);
  });

  it('refuses forged request metadata before delivery', async () => {
    const loader = vi.fn(() => child()); const { source } = setup(loader);
    await expect(source.load({ ...request(), runId: 'another' })).rejects.toThrow();
    await expect(source.load({ ...request(), invocationPath: ['child#2'] })).rejects.toThrow();
    const getter = { ...request() }; let calls = 0;
    Object.defineProperty(getter, 'subflowId', { get() { calls++; return 'child'; } });
    await expect(source.load(getter)).rejects.toThrow(); expect(calls).toBe(0); expect(loader).not.toHaveBeenCalled();
  });

  it('does not infer a loadable subflow from an ordinary recorded stage ID', async () => {
    const loader = vi.fn(() => child());
    const { source } = setup(loader, { snapshot: { sharedState: {}, commitLog: [], executionTree: { runtimeStageId: 'child#1' } } });
    const req = request(); delete (req as { runId?: string }).runId;
    await expect(source.load(req)).rejects.toThrow(); expect(loader).not.toHaveBeenCalled();
    expect(source.getSnapshot().scopes.size).toBe(0);
  });

  it('retains loaded evidence at the cache bound rather than evicting a return location', async () => {
    const loader = vi.fn(() => child()); const { source } = setup(loader, { maxCachedSubflows: 1 });
    const first = await source.load(request()); await expect(source.load(request('child', 2))).rejects.toThrow();
    expect(await source.load(request())).toBe(first); expect(loader).toHaveBeenCalledTimes(1);
    expect(source.getSnapshot().snapshot.subflowResults?.['child#1']).toBe(first.result);
  });

  it('validates trusted preparation output before publication', async () => {
    const { source } = setup(() => child(), { prepareSubflow: (value: LoadedSubflow) => ({ ...value, snapshots: [{ runtimeStageId: 'invented#1', memory: { total: 999 },
      stageName: 'invented', stageLabel: 'invented', narrative: '', startMs: 0, durationMs: 0 }] }) });
    await expect(source.load(request())).rejects.toThrow();
    expect(source.getSnapshot().snapshot.subflowResults?.['child#1']).toBeUndefined();
  });

  it('admits an exact inline native parent before loading its missing grandchild', async () => {
    const fixture = JSON.parse(readFileSync('test/fixtures/subflow-tracing/recordings.json', 'utf8')).nested;
    const original = fixture.runtimeSnapshot;
    const result = original.subflowResults['pipeline/prepare#8'];
    const snapshot = { ...original, subflowResults: { 'pipeline#6': original.subflowResults['pipeline#6'] } };
    const loader = vi.fn(() => ({ result }));
    const source = createRecordingSource({ snapshot, graph: graph(['pipeline']), loadSubflow: loader }); sources.push(source);
    const loaded = await source.load({ invocationPath: ['pipeline#6', 'pipeline/prepare#8'], mountRuntimeStageId: 'pipeline/prepare#8', subflowId: 'pipeline/prepare' });
    expect(loaded.snapshots.length).toBeGreaterThan(0);
    expect(source.getSnapshot().snapshot.subflowResults?.['pipeline/prepare#8']).toBe(loaded.result);
    expect(source.getSnapshot().snapshot).toHaveProperty('logAddress', original.logAddress);
    expect(snapshot.subflowResults).not.toHaveProperty('pipeline/prepare#8');
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('coalesces ready cohorts per frame, keeping data references stable until publication', async () => {
    vi.useFakeTimers(); let frame!: FrameRequestCallback;
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { frame = callback; return 1; });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    const { source } = setup(() => child()); const before = source.getSnapshot();
    const a = source.load(request()), b = source.load(request('child', 2));
    await vi.advanceTimersByTimeAsync(10);
    expect(source.getSnapshot().snapshot).toBe(before.snapshot);
    expect(source.getSnapshot().narrativeEntries).toBe(before.narrativeEntries);
    expect(source.getSnapshot().snapshot.subflowResults?.['child#1']).toBeUndefined();
    frame(0); await a; await b;
    expect([...source.getSnapshot().scopes.values()].map(scope => scope.status)).toEqual(['ready', 'ready']);
    expect(Object.keys(source.getSnapshot().snapshot.subflowResults!)).toEqual(['child#1', 'child#2']);
    vi.unstubAllGlobals();
  });

  it('keeps a legacy source object as identity and never synthesizes a runId', async () => {
    const snapshot = { sharedState: {}, commitLog: [], executionTree: { runtimeStageId: 'child#1', subflowId: 'child' } };
    const loader = vi.fn(() => child()); const source = createRecordingSource({ snapshot, graph: graph(['child']), loadSubflow: loader }); sources.push(source);
    const req = request(); delete (req as { runId?: string }).runId;
    await source.load(req);
    expect(source.rootSnapshot).not.toBe(snapshot); expect(source.rootSnapshot).toEqual(snapshot); expect(Object.isFrozen(source.rootSnapshot)).toBe(true);
    expect(source.getSnapshot().snapshot).not.toHaveProperty('runId');
    expect(loader.mock.calls[0]).toBeDefined();
    expect((source.getSnapshot().scopes.get(source.getKey(['child#1']))!.request)).not.toHaveProperty('runId');
  });

  it('keeps root recorder narrative when a loaded child adds its own prose', async () => {
    const rootEntry = { type: 'step', text: 'Root recorded message', depth: 0, runtimeStageId: 'child#1' };
    const childEntry = { type: 'step', text: 'Child recorded message', depth: 1, runtimeStageId: 'child/sum#9' };
    const base = setup(() => child()).snapshot;
    const source = createRecordingSource({ snapshot: { ...base, recorders: [{ id: 'narrative', name: 'Narrative', data: [rootEntry] }] },
      graph: graph(['child']), loadSubflow: () => ({ ...child(), narrativeEntries: [childEntry] }) }); sources.push(source);
    expect(source.getSnapshot().narrativeEntries).toEqual([rootEntry]);
    await source.load(request()); expect(source.getSnapshot().narrativeEntries).toEqual([rootEntry, childEntry]);
    expect(rootEntry.text).toBe('Root recorded message');
  });

  it('promotes an idle queued exact request when foreground interest joins', async () => {
    vi.useFakeTimers(); const cancelIdle = vi.fn();
    vi.stubGlobal('requestIdleCallback', vi.fn(() => 1)); vi.stubGlobal('cancelIdleCallback', cancelIdle);
    const loader = vi.fn(() => child()); const { source } = setup(loader);
    const background = source.load(request(), { background: true }); expect(loader).not.toHaveBeenCalled();
    const foreground = source.load(request()); expect(loader).not.toHaveBeenCalled(); expect(cancelIdle).toHaveBeenCalled();
    await vi.runAllTimersAsync(); expect(await foreground).toBe(await background);
  });

  it('takes a foreground task boundary and can cancel before invoking a synchronous host loader', async () => {
    vi.useFakeTimers(); const loader = vi.fn(() => child()); const { source } = setup(loader);
    const abort = new AbortController(), pending = source.load(request(), { signal: abort.signal });
    expect(loader).not.toHaveBeenCalled();
    expect(source.getSnapshot().scopes.get(source.getKey(['child#1']))?.status).toBe('loading');
    const cancelled = expect(pending).rejects.toMatchObject({ name: 'AbortError' }); abort.abort(); await cancelled;
    await vi.runAllTimersAsync(); expect(loader).not.toHaveBeenCalled();
    const retry = source.load(request()); expect(loader).not.toHaveBeenCalled();
    await vi.runAllTimersAsync(); await retry; expect(loader).toHaveBeenCalledTimes(1);
  });

  it('refuses an edge ID that could replace unrelated retained root geometry', async () => {
    const rootGraph = graph(['child', 'unrelated']); rootGraph.edges.push({ id: 'retained', source: 'child', target: 'unrelated' });
    const loaded = { ...child(), graph: graph(['child/sum', 'child/next']) };
    loaded.graph.edges.push({ id: 'retained', source: 'child/sum', target: 'child/next' });
    const { source } = setup(() => loaded, { graph: rootGraph });
    await expect(source.load(request())).rejects.toThrow();
    expect(source.getGraph([]).edges).toEqual(rootGraph.edges);
    expect(source.getSnapshot().snapshot.subflowResults?.['child#1']).toBeUndefined();
  });

  it('preserves unrelated path-shaped root IDs and their edges when a child arrives', async () => {
    const rootGraph = graph(['child', 'child/group/sibling', 'unrelated']);
    rootGraph.edges.push({ id: 'retained', source: 'child/group/sibling', target: 'unrelated' });
    const { source } = setup(() => child(), { graph: rootGraph }); await source.load(request());
    expect(source.getGraph(['child#1']).nodes.map(node => node.id)).toEqual(['child', 'child/group/sibling', 'unrelated', 'child/sum']);
    expect(source.getGraph(['child#1']).edges).toEqual(rootGraph.edges);
  });

  it('refuses a loaded node ID colliding with unrelated retained root geometry', async () => {
    const rootGraph = graph(['child', 'child/sum', 'unrelated']);
    const { source } = setup(() => child(), { graph: rootGraph });
    await expect(source.load(request())).rejects.toThrow();
    expect(source.getGraph([])).toBe(source.rootGraph);
    expect(source.getGraph(['child#1']).nodes).toEqual(rootGraph.nodes);
    expect(source.getSnapshot().snapshot.subflowResults?.['child#1']).toBeUndefined();
  });

  it('replaces recorded nested ownership while retaining cyclic or unknown ancestry', async () => {
    const rootGraph = graph(['child', 'child/branch', 'child/branch/old', 'child/cycleA', 'child/cycleB', 'child/unknown']);
    Object.assign(rootGraph.nodes[1].data, { isSubflow: true, subflowOf: 'child' });
    rootGraph.nodes[2].data.subflowOf = 'child/branch';
    Object.assign(rootGraph.nodes[3].data, { isSubflow: true, subflowOf: 'child/cycleB' });
    Object.assign(rootGraph.nodes[4].data, { isSubflow: true, subflowOf: 'child/cycleA' });
    rootGraph.nodes[5].data.subflowOf = 'unknown-mount';
    const { source } = setup(() => child(), { graph: rootGraph }); await source.load(request());
    expect(source.getGraph(['child#1']).nodes.map(node => node.id)).toEqual(['child', 'child/cycleA', 'child/cycleB', 'child/unknown', 'child/sum']);
  });

  it('keeps delivery and other subscribers working when a subscriber throws', async () => {
    const { source } = setup(() => child()); const observed = vi.fn();
    source.subscribe(() => { throw Error('host subscriber'); }); source.subscribe(observed);
    expect((await source.load(request())).snapshots[0].memory.total).toBe(35);
    expect(observed).toHaveBeenCalledTimes(3);
  });

  it('disposal aborts work, ignores late settlement, and does not notify removed subscribers', async () => {
    const delivery = deferred<LoadedSubflow>(); const { source } = setup(() => delivery.promise);
    const listener = vi.fn(); const off = source.subscribe(listener); off();
    const pending = source.load(request()); const rejected = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    source.dispose(); await rejected; delivery.resolve(child()); await Promise.resolve();
    expect(listener).not.toHaveBeenCalled(); await expect(source.load(request())).rejects.toThrow();
  });
});
