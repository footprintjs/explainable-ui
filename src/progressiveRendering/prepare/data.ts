import { isPlainRecord, optionalOwnDataField, readOwnArray, WorkBudget } from '../../trace/safeRecordRead';

export function invalid(): Error { return new Error('Recorded subflow evidence could not be prepared.'); }
export function abortError(): Error { const error = new Error('Recorded subflow request was cancelled.'); error.name = 'AbortError'; return error; }
export function checkSignal(signal?: AbortSignal): void { if (signal?.aborted) throw abortError(); }
export const own = optionalOwnDataField;

/** Detach stored JSON-like data without evaluating accessors, coercions or prototypes.
 * Shared references are allowed; cycles and executable/non-plain values are refused.
 * The existing trace work limit also bounds this defensive copy. */
export function copyData<T>(input: T): T {
  const budget = new WorkBudget();
  const copied = new WeakMap<object, object>();
  const active = new Set<object>();
  type Frame = { input: object; output: Record<string, unknown> | unknown[]; keys: string[]; at: number };
  const frames: Frame[] = [];
  function enter(value: unknown): unknown {
    budget.spend(1);
    if (value === null || value === undefined || typeof value === 'string' || typeof value === 'boolean') return value;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (!value || typeof value !== 'object' || (!Array.isArray(value) && !isPlainRecord(value))) throw invalid();
    if (active.has(value)) throw invalid();
    const previous = copied.get(value); if (previous) return previous;
    const array = Array.isArray(value);
    const entries = array ? readOwnArray(value, budget) : undefined;
    const keys = entries ? entries.map((_, index) => String(index)) : Object.keys(value);
    budget.spend(keys.length);
    const output = array ? [] : Object.create(null);
    copied.set(value, output); active.add(value);
    frames.push({ input: value, output, keys, at: 0 });
    return output;
  }
  const result = enter(input);
  while (frames.length) {
    const frame = frames[frames.length - 1];
    if (frame.at === frame.keys.length) { Object.freeze(frame.output); active.delete(frame.input); frames.pop(); continue; }
    const key = frame.keys[frame.at++];
    const value = own(frame.input, key);
    const output = enter(value);
    Object.defineProperty(frame.output, key, { value: output, enumerable: true, configurable: false, writable: false });
  }
  return result as T;
}

/** A frozen read-only view, unlike Object.freeze(new Map()), has no mutator door. */
export function readonlyMap<K, V>(entries: Iterable<readonly [K, V]>): ReadonlyMap<K, V> {
  const map = new Map(entries);
  const view: ReadonlyMap<K, V> = {
    get size() { return map.size; },
    get: key => map.get(key), has: key => map.has(key),
    entries: () => map.entries(), keys: () => map.keys(), values: () => map.values(),
    forEach(callback, thisArg) { map.forEach((value, key) => callback.call(thisArg, value, key, view)); },
    [Symbol.iterator]: () => map[Symbol.iterator](),
  };
  return Object.freeze(view);
}
