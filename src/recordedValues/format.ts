import { isPlainRecord, optionalOwnDataField } from '../trace/safeRecordRead';
import { nativeEntries, nativeEpoch, nativeKind, nativeSize } from './native';

export interface RecordedValueFormatOptions {
  indent?: number;
  maxChars?: number;
  maxItems?: number;
  maxDepth?: number;
}
const UNAVAILABLE = '[Unavailable]', TRUNCATED = '[Truncated]', CIRCULAR = '[Circular]';
const stringify = JSON.stringify, DateType = Date, dateISO = Date.prototype.toISOString;
const bigString = BigInt.prototype.toString;
const OUTPUT_LIMIT = Symbol('recorded-output-limit');

/** Fixed limits also apply when a caller supplies non-data options. */
function limit(options: unknown, name: keyof RecordedValueFormatOptions, fallback: number, low: number, high: number): number {
  try {
    const value = optionalOwnDataField(options, name);
    return typeof value === 'number' && Number.isFinite(value) ? Math.max(low, Math.min(high, Math.floor(value))) : fallback;
  } catch { return fallback; }
}

/** A bounded preview, not a serialization or a JS sandbox. No recorded methods,
 * iterators, accessors, coercion hooks or thrown error fields are evaluated. */
export function formatRecordedValue(value: unknown, options: RecordedValueFormatOptions = {}): string {
  const maxChars = limit(options, 'maxChars', 10_000, 16, 500_000);
  const maxItems = limit(options, 'maxItems', 200, 1, 10_000);
  const maxDepth = limit(options, 'maxDepth', 8, 0, 64);
  const indent = limit(options, 'indent', 0, 0, 8);
  const active = new WeakSet<object>();
  let output = '', items = 0, bigLimit: bigint | undefined;
  function append(text: string): void {
    if (output.length + text.length > maxChars) {
      const room = Math.max(0, maxChars - TRUNCATED.length - output.length);
      output = (output + text.slice(0, room)).slice(0, maxChars - TRUNCATED.length) + TRUNCATED;
      throw OUTPUT_LIMIT;
    }
    output += text;
  }
  function quote(text: string): void {
    // JSON.stringify sees only a primitive bounded string, never the input object.
    const prefix = text.slice(0, maxChars);
    append(stringify(prefix));
    if (prefix.length !== text.length) { output = output.slice(0, maxChars - TRUNCATED.length) + TRUNCATED; throw OUTPUT_LIMIT; }
  }
  function newline(depth: number): void { if (indent) append('\n' + ' '.repeat(indent * depth)); }
  function separator(at: number, depth: number): void { if (at) append(','); newline(depth); }
  function native(value: object, kind: 'date' | 'map' | 'set', depth: number): void {
    if (kind === 'date') { append('Date('); quote(dateISO.call(new DateType(nativeEpoch(value)))); append(')'); return; }
    const size = nativeSize(value, kind), slots = size * (kind === 'map' ? 2 : 1);
    append(kind === 'map' ? `Map(${size}) {` : `Set(${size}) {`);
    // Reject collection work before scratch allocation; never walk a huge Map to
    // produce a tiny preview. The typed size remains useful when entries truncate.
    if (slots > maxItems - items) { append(` ${TRUNCATED} }`); return; }
    const entries = nativeEntries(value, kind, size);
    for (let at = 0; at < entries.length; at += kind === 'map' ? 2 : 1) {
      if (at) append(','); append(' '); visit(entries[at], depth + 1);
      if (kind === 'map') { append(' => '); visit(entries[at + 1], depth + 1); }
    }
    append(size ? ' }' : '}');
  }
  function array(value: unknown[], depth: number): void {
    const length = optionalOwnDataField(value, 'length');
    if (Object.getPrototypeOf(value) !== Array.prototype || typeof length !== 'number' || !Number.isSafeInteger(length) || length < 0) { append(UNAVAILABLE); return; }
    append('['); let at = 0;
    for (; at < length; at++) {
      separator(at, depth + 1);
      if (items >= maxItems) { append(TRUNCATED); break; }
      const descriptor = Object.getOwnPropertyDescriptor(value, at);
      if (!descriptor || !('value' in descriptor)) append(UNAVAILABLE);
      else visit(descriptor.value, depth + 1);
    }
    if (at || length) newline(depth); append(']');
  }
  function record(value: Record<string, unknown>, depth: number): void {
    // An inert redaction hook must not reveal fields the previous JSON view hid.
    const toJSON = Object.getOwnPropertyDescriptor(value, 'toJSON');
    if (toJSON && (!('value' in toJSON) || typeof toJSON.value === 'function')) { append(UNAVAILABLE); return; }
    append('{'); let at = 0;
    // No value lookup occurs during enumeration. Bound displayed fields before
    // reading any descriptor value; inherited properties never become evidence.
    for (const key in value) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor?.enumerable) continue;
      separator(at++, depth + 1);
      if (items >= maxItems) { append(TRUNCATED); break; }
      quote(key); append(indent ? ': ' : ':');
      if ('value' in descriptor) visit(descriptor.value, depth + 1); else append(UNAVAILABLE);
    }
    if (at) newline(depth); append('}');
  }
  function visit(value: unknown, depth: number): void {
    if (++items > maxItems || depth > maxDepth) { append(TRUNCATED); return; }
    if (value === undefined) { append('undefined'); return; }
    if (value === null) { append('null'); return; }
    if (typeof value === 'string') { quote(value); return; }
    if (typeof value === 'boolean') { append(value ? 'true' : 'false'); return; }
    if (typeof value === 'number') { append(Number.isFinite(value) ? stringify(value) : UNAVAILABLE); return; }
    if (typeof value === 'bigint') {
      // Avoid allocating a gigantic decimal string just to truncate its preview.
      bigLimit ??= 10n ** BigInt(maxChars);
      if (value >= bigLimit || value <= -bigLimit) append(`BigInt(${TRUNCATED})`);
      else append(bigString.call(value) + 'n');
      return;
    }
    if (typeof value !== 'object') { append(UNAVAILABLE); return; }
    if (active.has(value)) { append(CIRCULAR); return; }
    active.add(value);
    const start = output.length;
    try {
      const kind = nativeKind(value);
      if (kind) native(value, kind, depth);
      else if (Array.isArray(value)) array(value, depth);
      else if (isPlainRecord(value)) record(value, depth);
      else append(UNAVAILABLE);
    } catch (error) {
      if (error === OUTPUT_LIMIT) throw error;
      output = output.slice(0, start); append(UNAVAILABLE);
    } finally { active.delete(value); }
  }
  try { visit(value, 0); } catch (error) { if (error !== OUTPUT_LIMIT) return UNAVAILABLE; }
  return output;
}
