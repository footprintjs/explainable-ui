import { afterEach, describe, expect, it, vi } from 'vitest';
import { attachSubflowWorker, createSubflowWorkerPreparation } from '../../src/progressiveRendering';
import type { LoadedSubflow, PreparationWorker, PreparedSubflow, SubflowLoadRequest } from '../../src/progressiveRendering';

type PortListener = ((event: MessageEvent) => void) | ((event: Event) => void);
class Port implements PreparationWorker {
  readonly messages: unknown[] = [];
  readonly listeners = new Map<string, Set<PortListener>>();
  peer?: Port;
  postMessage(value: unknown) { this.messages.push(value); if (this.peer) queueMicrotask(() => this.peer?.emit('message', value)); }
  addEventListener(type: 'message', listener: (event: MessageEvent) => void): void;
  addEventListener(type: 'error' | 'messageerror', listener: (event: Event) => void): void;
  addEventListener(type: string, listener: ((event: MessageEvent) => void) | ((event: Event) => void)) {
    const entries = this.listeners.get(type) ?? new Set<PortListener>(); entries.add(listener); this.listeners.set(type, entries);
  }
  removeEventListener(type: 'message', listener: (event: MessageEvent) => void): void;
  removeEventListener(type: 'error' | 'messageerror', listener: (event: Event) => void): void;
  removeEventListener(type: string, listener: ((event: MessageEvent) => void) | ((event: Event) => void)) { this.listeners.get(type)?.delete(listener); }
  emit(type: 'message' | 'error' | 'messageerror', data?: unknown) {
    const event = type === 'message' ? new MessageEvent('message', { data }) : new Event(type);
    for (const listener of this.listeners.get(type) ?? []) {
      if (type === 'message') (listener as (event: MessageEvent) => void)(event as MessageEvent);
      else (listener as (event: Event) => void)(event);
    }
  }
}
const request: SubflowLoadRequest = { invocationPath: ['child#1'], mountRuntimeStageId: 'child#1', subflowId: 'child' };
const loaded: LoadedSubflow = { result: { subflowId: 'child', treeContext: {
  globalContext: {}, stageContexts: { id: 'child/sum', name: 'child/Sum', runtimeStageId: 'child/sum#9', stageReads: {}, stageWrites: { total: 35 } },
  history: [{ runtimeStageId: 'child/sum#9', stage: 'child/Sum', stageId: 'child/sum', trace: [{ path: 'total' }], overwrite: { total: 35 } }],
} }, graph: { nodes: [{ id: 'child/sum', position: { x: 0, y: 0 }, data: { label: 'Sum', isDecider: false, isFork: false, isSubflow: false, isStreaming: false, prevIds: [], nextIds: [] } }], edges: [] } };
const prepared = { ...loaded, snapshots: [] } as PreparedSubflow;
const bridges: { dispose(): void }[] = [];
function setup() { const port = new Port(); const prepare = createSubflowWorkerPreparation(port); bridges.push(prepare); return { port, prepare }; }
function response(port: Port, sentIndex = 0, value: unknown = prepared, ok = true) {
  const sent = port.messages[sentIndex] as { protocol: string; id: string };
  port.emit('message', { protocol: sent.protocol, type: 'result', id: sent.id, ok, value });
}
afterEach(() => { for (const bridge of bridges.splice(0)) bridge.dispose(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('explicit preparation worker transport', () => {
  it('rejects aborted work and discards its late response', async () => {
    const { port, prepare } = setup(); const control = new AbortController();
    const pending = prepare(loaded, request, { signal: control.signal });
    const rejected = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    control.abort(); response(port); await rejected;
    expect(port.messages).toContainEqual(expect.objectContaining({ type: 'cancel' }));
  });
  it('matches concurrent responses by request ID rather than arrival order', async () => {
    const { port, prepare } = setup(); const signal = new AbortController().signal;
    const a = prepare(loaded, request, { signal }), b = prepare(loaded, request, { signal });
    response(port, 1, { ...prepared, marker: 'second' }); response(port, 0, { ...prepared, marker: 'first' });
    await expect(a).resolves.toHaveProperty('marker', 'first'); await expect(b).resolves.toHaveProperty('marker', 'second');
  });
  it('ignores unrelated messages without reading their payload', async () => {
    const { port, prepare } = setup(); const pending = prepare(loaded, request, { signal: new AbortController().signal });
    let reads = 0; const unrelated = { protocol: 'other', type: 'result', id: '1' };
    Object.defineProperty(unrelated, 'value', { get() { reads++; throw new Error('secret'); } });
    port.emit('message', unrelated); response(port); await expect(pending).resolves.toBe(prepared); expect(reads).toBe(0);
  });
  it('sanitizes worker failures without inspecting foreign error payloads', async () => {
    const { port, prepare } = setup(); const pending = prepare(loaded, request, { signal: new AbortController().signal });
    const sent = port.messages[0] as { protocol: string; id: string }; let reads = 0;
    const message = { protocol: sent.protocol, type: 'result', id: sent.id, ok: false };
    Object.defineProperty(message, 'error', { get() { reads++; throw new Error('PRIVATE'); } });
    port.emit('message', message); await expect(pending).rejects.toThrow('Subflow preparation could not be completed.'); expect(reads).toBe(0);
  });
  it.each(['error', 'messageerror'] as const)('settles pending work on a %s event', async type => {
    const { port, prepare } = setup(); const pending = prepare(loaded, request, { signal: new AbortController().signal });
    port.emit(type); await expect(pending).rejects.toThrow('Subflow preparation could not be completed.');
  });
  it('refuses already-aborted calls before posting work', async () => {
    const { port, prepare } = setup(); const control = new AbortController(); control.abort();
    await expect(prepare(loaded, request, { signal: control.signal })).rejects.toMatchObject({ name: 'AbortError' }); expect(port.messages).toEqual([]);
  });
  it('rejects pending work and removes its own listeners on disposal', async () => {
    const { port, prepare } = setup(); const pending = prepare(loaded, request, { signal: new AbortController().signal });
    prepare.dispose(); await expect(pending).rejects.toThrow('Preparation worker has been disposed.');
    expect([...port.listeners.values()].every(entries => entries.size === 0)).toBe(true);
    expect(() => prepare(loaded, request, { signal: new AbortController().signal })).toThrow('Preparation worker has been disposed.');
  });
  it('sanitizes a synchronous postMessage refusal', async () => {
    const { port, prepare } = setup(); port.postMessage = () => { throw new Error('PRIVATE CLONE FAILURE'); };
    await expect(prepare(loaded, request, { signal: new AbortController().signal })).rejects.toThrow('Subflow preparation could not be completed.');
  });
  it('does not revive a disposed bridge through an old request ID', async () => {
    const port = new Port(); const first = createSubflowWorkerPreparation(port); bridges.push(first);
    const a = first(loaded, request, { signal: new AbortController().signal }); const rejected = expect(a).rejects.toThrow(); first.dispose(); await rejected;
    const second = createSubflowWorkerPreparation(port); bridges.push(second); const b = second(loaded, request, { signal: new AbortController().signal });
    const old = port.messages[0] as { id: string }; const latest = [...port.messages].reverse().find(message => (message as { type: string }).type === 'prepare') as { id: string };
    expect(latest.id).not.toBe(old.id); response(port, 0); response(port, port.messages.indexOf(latest)); await expect(b).resolves.toBe(prepared);
  });
  it('runs the actual canonical converter behind a paired worker port', async () => {
    vi.useFakeTimers(); vi.stubGlobal('scheduler', undefined);
    const main = new Port(), worker = new Port(); main.peer = worker; worker.peer = main;
    const detach = attachSubflowWorker(worker); const prepare = createSubflowWorkerPreparation(main); bridges.push(prepare);
    try {
      const original = JSON.stringify(loaded); const pending = prepare(loaded, request, { signal: new AbortController().signal });
      const settled = pending.then(value => ({ value }), error => ({ error }));
      await vi.runAllTimersAsync(); const outcome = await settled;
      if ('error' in outcome) throw outcome.error;
      const result = outcome.value;
      expect(result.snapshots[0].runtimeStageId).toBe('child/sum#9'); expect(result.snapshots[0].memory.total).toBe(35);
      expect(JSON.stringify(loaded)).toBe(original);
    } finally { detach(); }
  });
  it('cancels a paired worker job before its scheduled converter starts', async () => {
    vi.useFakeTimers(); vi.stubGlobal('scheduler', undefined);
    const main = new Port(), worker = new Port(); main.peer = worker; worker.peer = main;
    const detach = attachSubflowWorker(worker); const prepare = createSubflowWorkerPreparation(main); bridges.push(prepare);
    try {
      const control = new AbortController(); const pending = prepare(loaded, request, { signal: control.signal });
      const rejected = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
      control.abort(); await rejected; await vi.runAllTimersAsync();
      expect(worker.messages).toEqual([]);
    } finally { detach(); }
  });
  it('returns a fixed wire failure when the canonical converter refuses the child', async () => {
    vi.useFakeTimers(); vi.stubGlobal('scheduler', undefined);
    const main = new Port(), worker = new Port(); main.peer = worker; worker.peer = main;
    const detach = attachSubflowWorker(worker); const prepare = createSubflowWorkerPreparation(main); bridges.push(prepare);
    try {
      const pending = prepare({ result: null }, request, { signal: new AbortController().signal });
      const rejected = expect(pending).rejects.toThrow('Subflow preparation could not be completed.');
      await vi.runAllTimersAsync(); await rejected;
      expect(worker.messages).toEqual([expect.objectContaining({ type: 'result', ok: false })]);
      expect(worker.messages[0]).not.toHaveProperty('error'); expect(worker.messages[0]).not.toHaveProperty('value');
    } finally { detach(); }
  });
});
