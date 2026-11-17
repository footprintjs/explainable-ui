import { optionalOwnDataField } from '../../trace/safeRecordRead';
import { copyOwnedData } from './native-copy';

export function invalid(): Error { return new Error('Recorded subflow evidence could not be prepared.'); }
export function abortError(): Error { const error = new Error('Recorded subflow request was cancelled.'); error.name = 'AbortError'; return error; }
export function checkSignal(signal?: AbortSignal): void { if (signal?.aborted) throw abortError(); }
export const own = optionalOwnDataField;

/** Detach supported plain/native data without caller getters, iterators or coercion.
 * Shared aliases survive; cycles/custom classes refuse. Native internals remain
 * mutable in JavaScript, so consumers must treat their detached leaves as readonly. */
export function copyData<T>(input: T): T {
  try { return copyOwnedData(input); } catch { throw invalid(); }
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
