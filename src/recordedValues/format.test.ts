import { describe, expect, it } from 'vitest';
import { formatRecordedValue } from '../recordedValues';

describe('bounded recorded-value presentation', () => {
  it.each([null, true, 35, 'quoted\n"value"', [1, null, 'x'], { z: [1, true], a: { b: 'x' } }])('preserves ordinary compact and indented JSON at case %#', value => {
    expect(formatRecordedValue(value)).toBe(JSON.stringify(value));
    expect(formatRecordedValue(value, { indent: 2 })).toBe(JSON.stringify(value, null, 2));
  });
  it('shows supported native facts instead of empty objects or crashing', () => {
    expect(formatRecordedValue(35n)).toBe('35n');
    expect(formatRecordedValue(new Date(0))).toBe('Date("1970-01-01T00:00:00.000Z")');
    expect(formatRecordedValue(new Map<unknown, unknown>([['amount', 35n], [2, new Set([1, 'x'])]]))).toBe('Map(2) { "amount" => 35n, 2 => Set(2) { 1, "x" } }');
    expect(formatRecordedValue(undefined)).toBe('undefined');
    expect(formatRecordedValue({ missing: undefined })).toBe('{"missing":undefined}');
  });
  it('never reads a stored getter, toJSON or its foreign thrown error', () => {
    let calls = 0;
    const object = { x: 1 };
    Object.defineProperty(object, 'secret', { enumerable: true, get() { calls++; throw new Error('PRIVATE'); } });
    const value = { object, toJSON() { calls++; throw new Error('PRIVATE'); } };
    const text = formatRecordedValue(value);
    expect(calls).toBe(0); expect(text).toContain('[Unavailable]'); expect(text).not.toContain('PRIVATE');
  });
  it('keeps an inert own toJSON redaction hook from exposing the rest of a value', () => {
    let calls = 0;
    const method = { secret: 'PRIVATE', toJSON() { calls++; return '[redacted]'; } };
    const accessor = { secret: 'PRIVATE' };
    Object.defineProperty(accessor, 'toJSON', { get() { calls++; return () => '[redacted]'; } });
    expect(formatRecordedValue(method)).toBe('[Unavailable]');
    expect(formatRecordedValue(accessor)).toBe('[Unavailable]');
    expect(calls).toBe(0);
    expect(formatRecordedValue({ toJSON: 'ordinary data', x: 1 })).toBe('{"toJSON":"ordinary data","x":1}');
  });
  it('uses native methods captured before caller overrides', () => {
    const iterator = Object.getOwnPropertyDescriptor(Map.prototype, Symbol.iterator)!;
    const getTime = Object.getOwnPropertyDescriptor(Date.prototype, 'getTime')!;
    const toJSON = Object.getOwnPropertyDescriptor(Date.prototype, 'toJSON')!;
    let calls = 0;
    Object.defineProperty(Map.prototype, Symbol.iterator, { ...iterator, value() { calls++; throw new Error('PRIVATE'); } });
    Object.defineProperty(Date.prototype, 'getTime', { ...getTime, value() { calls++; throw new Error('PRIVATE'); } });
    Object.defineProperty(Date.prototype, 'toJSON', { ...toJSON, value() { calls++; throw new Error('PRIVATE'); } });
    try {
      expect(formatRecordedValue(new Map([['date', new Date(0)]]))).toContain('Date("1970-01-01T00:00:00.000Z")');
      expect(calls).toBe(0);
    } finally {
      Object.defineProperty(Map.prototype, Symbol.iterator, iterator);
      Object.defineProperty(Date.prototype, 'getTime', getTime);
      Object.defineProperty(Date.prototype, 'toJSON', toJSON);
    }
  });
  it('refuses native custom properties without reading them', () => {
    let calls = 0; const value = new Map([['x', 1]]);
    Object.defineProperty(value, 'forEach', { get() { calls++; return () => {}; } });
    expect(formatRecordedValue(value)).toBe('[Unavailable]'); expect(calls).toBe(0);
  });
  it.each([() => 1, Symbol('PRIVATE'), new Date(NaN), /PRIVATE/, new Error('PRIVATE'), new Uint8Array([1]), NaN, Infinity])('marks unsupported data without coercion at case %#', value => {
    expect(formatRecordedValue(value)).toBe('[Unavailable]');
  });
  it('refuses custom prototypes and does not inspect proxy failures', () => {
    let calls = 0;
    class Custom { toString() { calls++; return 'PRIVATE'; } toJSON() { calls++; return 'PRIVATE'; } }
    const foreign = new Proxy({}, { get() { calls++; throw new Error('must not read error'); } });
    expect(formatRecordedValue(new Custom())).toBe('[Unavailable]');
    expect(formatRecordedValue(new Proxy({}, { getPrototypeOf() { throw foreign; } }))).toBe('[Unavailable]');
    expect(calls).toBe(0);
  });
  it('distinguishes cycles from repeated shared values', () => {
    const shared = { x: 1 }, cycle: Record<string, unknown> = {}; cycle.self = cycle;
    expect(formatRecordedValue([shared, shared])).toBe('[{"x":1},{"x":1}]');
    expect(formatRecordedValue(cycle)).toContain('[Circular]');
  });
  it('bounds native collection scratch work before collecting entries', () => {
    const map = new Map<number, number>(); for (let index = 0; index < 10_000; index++) map.set(index, index);
    expect(formatRecordedValue(map, { maxItems: 3 })).toBe('Map(10000) { [Truncated] }');
    expect(formatRecordedValue(new Set([1, 2, 3]), { maxItems: 2 })).toBe('Set(3) { [Truncated] }');
  });
  it('bounds depth, item count, huge primitive output and preserves an explicit marker', () => {
    let deep: unknown = 1; for (let index = 0; index < 5000; index++) deep = { next: deep };
    expect(formatRecordedValue(deep, { maxDepth: 2 })).toContain('[Truncated]');
    expect(formatRecordedValue([1, 2, 3, 4], { maxItems: 2 })).toContain('[Truncated]');
    for (const value of ['x'.repeat(100_000), 10n ** 10_000n, { ['k'.repeat(1000)]: 'x' }]) {
      const text = formatRecordedValue(value, { maxChars: 40 });
      expect(text.length).toBeLessThanOrEqual(40); expect(text).toContain('[Truncated]');
    }
  });
  it('honors the existing large clipboard allowance while staying explicitly bounded', () => {
    const text = formatRecordedValue('x'.repeat(110_000), { maxChars: 500_000 });
    expect(text).toHaveLength(110_002); expect(text).not.toContain('[Truncated]');
    const bounded = formatRecordedValue('x'.repeat(600_000), { maxChars: 900_000 });
    expect(bounded.length).toBeLessThanOrEqual(500_000); expect(bounded).toContain('[Truncated]');
  });
  it('uses fixed defaults for accessor options without invoking them', () => {
    let calls = 0; const options = {};
    Object.defineProperty(options, 'maxItems', { get() { calls++; return 1; } });
    expect(formatRecordedValue([1, 2], options)).toBe('[1,2]'); expect(calls).toBe(0);
  });
});
