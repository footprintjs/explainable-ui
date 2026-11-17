import { isPlainRecord, optionalOwnDataField, readOwnArray, WorkBudget } from '../trace/safeRecordRead';
import { nativeEntries, nativeEpoch, nativeKind, nativeSize, newNative, putNative, unsupported } from './native';

type Frame = { input: object; output: object; at: number } & (
  | { kind: 'object'; keys: string[] }
  | { kind: 'map' | 'set'; entries: unknown[]; key?: unknown }
);

/** Iterative data-only clone. Shared aliases survive; active ancestors are cycles. */
export function copyOwnedData<T>(input: T): T {
  const budget = new WorkBudget(), copied = new WeakMap<object, object>(), active = new Set<object>();
  const frames: Frame[] = [];
  function enter(value: unknown): unknown {
    budget.spend(1);
    if (value === null || value === undefined || typeof value === 'string' || typeof value === 'boolean' || typeof value === 'bigint') return value;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (!value || typeof value !== 'object') unsupported();
    if (active.has(value)) unsupported();
    const previous = copied.get(value); if (previous) return previous;
    const native = nativeKind(value);
    if (native === 'date') {
      const output = Object.freeze(newNative(native, nativeEpoch(value)));
      copied.set(value, output); return output;
    }
    if (native) {
      const size = nativeSize(value, native);
      budget.spend(size * (native === 'map' ? 2 : 1));
      const entries = nativeEntries(value, native, size), output = newNative(native);
      copied.set(value, output); active.add(value);
      frames.push({ kind: native, input: value, output, entries, at: 0 }); return output;
    }
    const array = Array.isArray(value);
    if (array ? Object.getPrototypeOf(value) !== Array.prototype : !isPlainRecord(value)) unsupported();
    const arrayEntries = array ? readOwnArray(value, budget) : undefined;
    const allKeys = Reflect.ownKeys(value);
    budget.spend(allKeys.length);
    const keys: string[] = [];
    for (const key of allKeys) {
      if (array && key === 'length') continue;
      if (typeof key !== 'string') unsupported();
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !('value' in descriptor) || !descriptor.enumerable) unsupported();
      if (array && (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= arrayEntries!.length)) unsupported();
      keys.push(key);
    }
    const output = array ? [] : Object.create(null);
    copied.set(value, output); active.add(value);
    frames.push({ kind: 'object', input: value, output, keys, at: 0 }); return output;
  }
  const result = enter(input);
  while (frames.length) {
    const frame = frames[frames.length - 1];
    const length = frame.kind === 'object' ? frame.keys.length : frame.entries.length;
    if (frame.at === length) { Object.freeze(frame.output); active.delete(frame.input); frames.pop(); continue; }
    if (frame.kind === 'object') {
      const key = frame.keys[frame.at++];
      Object.defineProperty(frame.output, key, { value: enter(optionalOwnDataField(frame.input, key)), enumerable: true, configurable: false, writable: false });
    } else if (frame.kind === 'set') putNative(frame.output, 'set', enter(frame.entries[frame.at++]));
    else if (frame.at % 2 === 0) frame.key = enter(frame.entries[frame.at++]);
    else putNative(frame.output, 'map', frame.key, enter(frame.entries[frame.at++]));
  }
  return result as T;
}
