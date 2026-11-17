import { describe, expect, it } from 'vitest';
import { compareRecordedValues } from '../recordedValues';

describe('recorded-value comparison availability', () => {
  it('treats a nested getter as unavailable instead of a known difference', () => {
    let calls = 0; const nested = {};
    Object.defineProperty(nested, 'secret', { enumerable: true, get() { calls++; throw new Error('PRIVATE'); } });
    expect(compareRecordedValues({ x: nested }, { x: { secret: 1 } })).toBe('unavailable');
    expect(compareRecordedValues({ x: nested }, { x: nested })).toBe('unavailable');
    expect(calls).toBe(0);
  });
  it('checks both complete graphs before reporting an earlier primitive difference', () => {
    let calls = 0; const nested = {};
    Object.defineProperty(nested, 'x', { enumerable: true, get() { calls++; return 1; } });
    expect(compareRecordedValues({ earlier: 1, later: nested }, { earlier: 2, later: {} })).toBe('unavailable');
    expect(compareRecordedValues({ earlier: 1, later: {} }, { earlier: 2, later: nested })).toBe('unavailable');
    expect(calls).toBe(0);
  });
  it.each([new Date(NaN), /x/, new Error('PRIVATE'), new Uint8Array([1]), new ArrayBuffer(1), () => 1, Symbol('PRIVATE'), NaN, Infinity])('makes unsupported nested values unavailable at case %#', value => {
    expect(compareRecordedValues({ earlier: 1, later: value }, { earlier: 2, later: null })).toBe('unavailable');
    expect(compareRecordedValues({ earlier: 1, later: null }, { earlier: 2, later: value })).toBe('unavailable');
  });
  it('refuses custom classes and native custom properties without methods', () => {
    let calls = 0;
    class Custom { toJSON() { calls++; return {}; } }
    const map = new Map([['x', 1]]);
    Object.defineProperty(map, 'extra', { get() { calls++; return 1; } });
    expect(compareRecordedValues({ x: new Custom() }, { x: {} })).toBe('unavailable');
    expect(compareRecordedValues({ x: map }, { x: new Map([['x', 1]]) })).toBe('unavailable');
    expect(calls).toBe(0);
  });
  it('does not inspect proxy errors and refuses cycles', () => {
    let calls = 0;
    const error = new Proxy({}, { get() { calls++; return 1; } });
    const value = new Proxy({}, { getPrototypeOf() { throw error; } });
    expect(compareRecordedValues({ x: value }, { x: {} })).toBe('unavailable');
    const cycle: unknown[] = []; cycle.push(cycle);
    expect(compareRecordedValues(cycle, cycle)).toBe('unavailable'); expect(calls).toBe(0);
  });
  it.each([null, undefined, true, 35, 35n, 'x', { x: [1, undefined] }, new Date(1), new Map([['x', 35n]]), new Set([1, 2n])])('recognizes supported equal values at case %#', value => {
    expect(compareRecordedValues(value, value)).toBe('equal');
  });
  it.each([[1, 2], [35n, 36n], [new Date(1), new Date(2)], [new Map([['x', 1]]), new Map([['y', 1]])], [new Set([1, 2]), new Set([2, 1])], [{ x: undefined }, {}]])('recognizes supported differences at case %#', (a, b) => {
    expect(compareRecordedValues(a, b)).toBe('different');
  });
  it('preserves shared-reference topology and does not mutate caller values', () => {
    const shared = { x: 1 }, a = { first: shared, second: shared };
    expect(compareRecordedValues(a, { first: { x: 1 }, second: { x: 1 } })).toBe('different');
    expect(a.first).toBe(a.second); expect(a.first.x).toBe(1);
  });
  it('reports unavailable when bounded validation refuses the complete graph', () => {
    const huge = new Map<number, number>(); for (let i = 0; i < 50_001; i++) huge.set(i, i);
    expect(compareRecordedValues({ earlier: 1, later: huge }, { earlier: 2 })).toBe('unavailable');
  });
});
