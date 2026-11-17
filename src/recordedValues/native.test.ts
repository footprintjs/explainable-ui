import { afterEach, describe, expect, it, vi } from 'vitest';
import { copyData } from '../progressiveRendering/prepare';
import { sameOwnedData } from '../progressiveRendering/prepare';
import { createRecordingSource } from '../progressiveRendering/source';
import { attachSubflowWorker, createSubflowWorkerPreparation } from '../progressiveRendering/worker';
import type { LoadedSubflow, PreparationWorker, RecordingSource } from '../progressiveRendering/types';

const graph = { nodes: [], edges: [] };
const NativeDate = Date;
const row = (value: unknown) => ({ stage: 'A', stageId: 'a', runtimeStageId: 'a#1', overwrite: { value } });
const snapshot = (commitLog: unknown[]) => ({ runId: 'run', sharedState: {}, executionTree: { id: 'a', name: 'A', runtimeStageId: 'a#1' }, commitLog });
const sources: RecordingSource[] = [];
afterEach(() => { sources.splice(0).forEach(source => source.dispose()); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('native recorded-data fidelity', () => {
  it('detaches Date, Map, Set and BigInt without normalizing their values', () => {
    const key = { id: 'key' }, date = new Date(1234);
    const original = { key, date, again: date, big: 9007199254740993n,
      map: new Map<unknown, unknown>([[key, key], ['date', date]]), set: new Set<unknown>([key, date, 2n]) };
    const copy = copyData(original);
    expect(copy).not.toBe(original); expect(copy.key).not.toBe(key); expect(copy.date).not.toBe(date);
    expect(copy.date.getTime()).toBe(1234); expect(copy.again).toBe(copy.date); expect(copy.big).toBe(original.big);
    expect(copy.map.get(copy.key)).toBe(copy.key); expect(copy.map.get('date')).toBe(copy.date);
    expect(copy.set.has(copy.key)).toBe(true); expect(copy.set.has(copy.date)).toBe(true); expect(copy.set.has(2n)).toBe(true);
    copy.map.set('copy-only', true); copy.date.setTime(9999);
    expect(original.map.has('copy-only')).toBe(false); expect(date.getTime()).toBe(1234);
  });

  it('compares native changes rather than treating empty own-key sets as equality', () => {
    expect(sameOwnedData(new Date(1), new Date(2))).toBe(false);
    expect(sameOwnedData(new Map([['x', 1]]), new Map([['x', 2]]))).toBe(false);
    expect(sameOwnedData(new Set([1]), new Set([2]))).toBe(false);
  });

  it('preserves alias topology when comparing admitted data', () => {
    const shared = { x: 1 };
    expect(sameOwnedData(copyData({ a: shared, b: shared }), copyData({ a: { x: 1 }, b: { x: 1 } }))).toBe(false);
    expect(sameOwnedData(copyData({ a: { x: 1 }, b: { x: 1 } }), copyData({ a: shared, b: shared }))).toBe(false);
    const date = new Date(1);
    expect(sameOwnedData(copyData([date, date]), copyData([new Date(1), new Date(1)]))).toBe(false);
    expect(sameOwnedData(copyData({ a: shared, map: new Map([[shared, shared]]) }), copyData({ a: shared, map: new Map([[shared, shared]]) }))).toBe(true);
  });

  it('compares ordered native collection contents and Date epochs exactly', () => {
    expect(sameOwnedData(copyData(new Map<unknown, unknown>([['x', 1], ['y', 2n]])), copyData(new Map<unknown, unknown>([['x', 1], ['y', 2n]])))).toBe(true);
    expect(sameOwnedData(copyData(new Map([['x', 1], ['y', 2]])), copyData(new Map([['y', 2], ['x', 1]])))).toBe(false);
    expect(sameOwnedData(copyData(new Set([1, 2])), copyData(new Set([2, 1])))).toBe(false);
    expect(sameOwnedData(copyData(new Date(0)), copyData(new Date(0)))).toBe(true);
  });

  it.each(['iterator', 'forEach', 'constructor'] as const)('refuses a native own %s override without evaluating it', key => {
    let calls = 0; const value = new Map([['x', 1]]);
    Object.defineProperty(value, key === 'iterator' ? Symbol.iterator : key, { get() { calls++; throw new Error('PRIVATE'); } });
    expect(() => copyData(value)).toThrow('Recorded subflow evidence could not be prepared.'); expect(calls).toBe(0);
  });
  it('refuses Date custom properties without calling a hostile getTime or toJSON', () => {
    let calls = 0; const date = new Date(123);
    Object.defineProperty(date, 'getTime', { get() { calls++; throw new Error('PRIVATE'); } });
    Object.defineProperty(date, 'toJSON', { value() { calls++; throw new Error('PRIVATE'); } });
    expect(() => copyData(date)).toThrow(); expect(calls).toBe(0);
  });
  it('uses captured intrinsics even when prototype iterators and getTime are replaced', () => {
    const iterator = Object.getOwnPropertyDescriptor(Map.prototype, Symbol.iterator)!;
    const getTime = Object.getOwnPropertyDescriptor(Date.prototype, 'getTime')!;
    let calls = 0;
    Object.defineProperty(Map.prototype, Symbol.iterator, { ...iterator, value() { calls++; throw new Error('caller iterator'); } });
    Object.defineProperty(Date.prototype, 'getTime', { ...getTime, value() { calls++; throw new Error('caller method'); } });
    try {
      const copy = copyData({ date: new NativeDate(42), map: new Map([['x', 1]]) });
      const observed = calls;
      expect(getTime.value.call(copy.date)).toBe(42); expect(copy.map.get('x')).toBe(1); expect(observed).toBe(0);
    } finally { Object.defineProperty(Map.prototype, Symbol.iterator, iterator); Object.defineProperty(Date.prototype, 'getTime', getTime); }
  });
  it('refuses native custom data properties instead of silently dropping them', () => {
    const map = new Map([['x', 1]]); Object.defineProperty(map, 'extra', { value: 2, enumerable: false });
    expect(() => copyData(map)).toThrow();
    const set = new Set([1]); Object.defineProperty(set, Symbol('extra'), { value: 2 });
    expect(() => copyData(set)).toThrow();
  });
  it.each([NaN, Infinity, new Date(NaN), /x/, new Error('PRIVATE'), new Uint8Array([1]), new ArrayBuffer(1), () => 1, Symbol('x')])('refuses unsupported data at case %#', value => {
    expect(() => copyData(value)).toThrow('Recorded subflow evidence could not be prepared.');
  });
  it('refuses custom classes and subclasses without coercion', () => {
    class Custom { toJSON() { throw new Error('must not call'); } }
    class CustomMap extends Map {}
    expect(() => copyData(new Custom())).toThrow(); expect(() => copyData(new CustomMap())).toThrow();
  });
  it('keeps ordinary accessors unread and rejects native cycles', () => {
    let reads = 0; const object = {}; Object.defineProperty(object, 'x', { enumerable: true, get() { reads++; return 1; } });
    expect(() => copyData(object)).toThrow(); expect(reads).toBe(0);
    const map = new Map(); map.set('self', map); expect(() => copyData(map)).toThrow();
    const set = new Set(); set.add(set); expect(() => copyData(set)).toThrow();
  });
  it('bounds collection allocation by the existing work allowance', () => {
    const large = new Map<number, number>(); for (let i = 0; i < 50_001; i++) large.set(i, i);
    expect(() => copyData(large)).toThrow('Recorded subflow evidence could not be prepared.');
  });
  it('copies deep mixed data iteratively', () => {
    let value: unknown = 1n;
    for (let i = 0; i < 2_000; i++) value = i % 2 ? { next: value } : new Map([['next', value]]);
    expect(() => copyData(value)).not.toThrow();
  });

  it.each(['date', 'map', 'set', 'bigint'] as const)('refuses a rewritten %s history value but accepts a faithful append', kind => {
    vi.useFakeTimers(); vi.stubGlobal('requestAnimationFrame', undefined);
    const value = (n: number): unknown => kind === 'date' ? new NativeDate(n) : kind === 'map' ? new Map([['x', n]]) : kind === 'set' ? new Set([n]) : BigInt(n);
    const initial = snapshot([row(value(1))]);
    const source = createRecordingSource({ snapshot: initial, graph }); sources.push(source);
    expect(() => source.update({ snapshot: snapshot([row(value(2))]), graph })).toThrow();
    source.update({ snapshot: snapshot([row(value(1)), { ...row(value(3)), runtimeStageId: 'b#2' }]), graph }); vi.runAllTimers();
    expect(source.rootSnapshot.commitLog).toHaveLength(2);
  });
  it('keeps retained native history detached from later mutations of host objects', () => {
    const value = { date: new NativeDate(1), map: new Map([['x', 1]]) };
    const source = createRecordingSource({ snapshot: snapshot([row(value)]), graph }); sources.push(source);
    const before = source.rootSnapshot;
    value.date.setTime(2); value.map.set('x', 2);
    const retained = (before.commitLog[0] as ReturnType<typeof row>).overwrite.value as typeof value;
    expect(retained.date.getTime()).toBe(1); expect(retained.map.get('x')).toBe(1);
    expect(() => source.update({ snapshot: snapshot([row(value)]), graph })).toThrow(); expect(source.rootSnapshot).toBe(before);
  });
  it('rejects a history rewrite that changes only shared-reference topology', () => {
    const shared = { x: 1 };
    const source = createRecordingSource({ snapshot: snapshot([row({ a: shared, b: shared })]), graph }); sources.push(source);
    expect(() => source.update({ snapshot: snapshot([row({ a: { x: 1 }, b: { x: 1 } })]), graph })).toThrow();
  });
});

type Listener = ((event: MessageEvent) => void) | ((event: Event) => void);
class WorkerPort implements PreparationWorker {
  peer?: WorkerPort;
  listeners = new Map<string, Set<Listener>>();
  postMessage(message: unknown): void {
    const data = structuredClone(message);
    queueMicrotask(() => { for (const fn of this.peer?.listeners.get('message') ?? []) (fn as (event: MessageEvent) => void)(new MessageEvent('message', { data })); });
  }
  addEventListener(type: 'message', listener: (event: MessageEvent) => void): void;
  addEventListener(type: 'error' | 'messageerror', listener: (event: Event) => void): void;
  addEventListener(type: string, listener: Listener) { const set = this.listeners.get(type) ?? new Set<Listener>(); set.add(listener); this.listeners.set(type, set); }
  removeEventListener(type: 'message', listener: (event: MessageEvent) => void): void;
  removeEventListener(type: 'error' | 'messageerror', listener: (event: Event) => void): void;
  removeEventListener(type: string, listener: Listener) { this.listeners.get(type)?.delete(listener); }
}
it('prepares actual native values through the real worker handler and structured-clone ports', async () => {
  vi.useFakeTimers(); vi.stubGlobal('scheduler', undefined);
  const value = { date: new NativeDate(123), map: new Map([['amount', 35n]]), set: new Set([2n]) };
  const loaded: LoadedSubflow = { result: { subflowId: 'child', treeContext: { globalContext: {},
    stageContexts: { id: 'child/a', name: 'A', runtimeStageId: 'child/a#1', stageWrites: { value } },
    history: [{ stage: 'A', stageId: 'child/a', runtimeStageId: 'child/a#1', overwrite: { value }, trace: [{ path: 'value' }] }],
  } } };
  const main = new WorkerPort(), worker = new WorkerPort(); main.peer = worker; worker.peer = main;
  const detach = attachSubflowWorker(worker), prepare = createSubflowWorkerPreparation(main);
  try {
    const resultPromise = prepare(loaded, { invocationPath: ['child#1'], mountRuntimeStageId: 'child#1', subflowId: 'child' }, { signal: new AbortController().signal });
    const outcome = resultPromise.then(value => ({ value }), error => ({ error }));
    await vi.runAllTimersAsync(); const result = await outcome; if ('error' in result) throw result.error;
    const copy = result.value.snapshots[0].memory.value as typeof value;
    expect(copy.date.getTime()).toBe(123); expect(copy.map.get('amount')).toBe(35n); expect(copy.set.has(2n)).toBe(true);
    expect(copy.map).not.toBe(value.map); expect(value.date.getTime()).toBe(123); expect(value.map.get('amount')).toBe(35n);
  } finally { prepare.dispose(); detach(); }
});
