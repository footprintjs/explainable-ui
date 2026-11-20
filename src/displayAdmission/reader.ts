import type { DisplayCheckResult, DisplayDiagnosticCode, DisplayLimitName, DisplayPath, DisplayUsage } from './types';
import { copyDisplayPath, deliberateDisplayRefusal, refuseDisplay, unreadableDiagnostic, type DisplayLimitDetails } from './tokens';

interface ReaderLimits { readonly maxTextCodeUnits: number; readonly maxTotalListItems?: number }
function checkedPath(path: DisplayPath): DisplayPath {
  const copy = copyDisplayPath(path);
  if (!copy) refuseDisplay('unreadable-input', []);
  return copy;
}
/** Missing is undefined; an accessor is refused without invoking it. Dynamic label keys stay outside diagnostics. */
export function readOwnField(value: unknown, key: string, path: DisplayPath = []): unknown {
  const at = checkedPath(path);
  if (typeof key !== 'string') refuseDisplay('unreadable-input', []);
  if (!value || typeof value !== 'object') refuseDisplay('invalid-own-field', at);
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  if (descriptor === undefined) return undefined;
  if (!('value' in descriptor)) refuseDisplay('accessor-field', at);
  return descriptor.value;
}

/** One parser's retained-text/list accounting. No graph work, trimming, logging or foreign error inspection. */
export class DisplayReader {
  private textCodeUnits = 0;
  private listItems = 0;
  constructor(private readonly limits: ReaderLimits) {}

  field(value: unknown, key: string, path: DisplayPath): unknown { return readOwnField(value, key, path); }
  fail(code: DisplayDiagnosticCode, path: DisplayPath, details?: DisplayLimitDetails): never {
    return refuseDisplay(code, path, details);
  }
  text(value: unknown, path: DisplayPath, maximum: number, limit: DisplayLimitName): string {
    if (typeof value !== 'string') this.fail('invalid-value', path);
    this.countText(value.length, path, maximum, limit);
    return value;
  }
  countText(length: number, path: DisplayPath, maximum: number, limit: DisplayLimitName): void {
    const at = checkedPath(path);
    if (length === 0) this.fail('invalid-value', at);
    if (length > maximum) this.fail('limit-exceeded', at, { limit, maximum, observed: length });
    this.textCodeUnits += length;
    if (this.textCodeUnits > this.limits.maxTextCodeUnits)
      this.fail('limit-exceeded', at, { limit: 'maxTextCodeUnits', maximum: this.limits.maxTextCodeUnits, observed: this.textCodeUnits });
  }
  list<T>(value: unknown, path: DisplayPath, maximum: number, limit: DisplayLimitName,
    parse: (entry: unknown, entryPath: DisplayPath) => T): T[] {
    const at = checkedPath(path);
    if (!Array.isArray(value)) this.fail('invalid-value', at);
    const length = this.field(value, 'length', [...at, 'length']);
    if (typeof length !== 'number' || !Number.isSafeInteger(length) || length < 0) this.fail('invalid-value', at);
    if (length > maximum) this.fail('limit-exceeded', at, { limit, maximum, observed: length });
    this.listItems += length;
    if (this.limits.maxTotalListItems !== undefined && this.listItems > this.limits.maxTotalListItems)
      this.fail('limit-exceeded', at, { limit: 'maxTotalListItems', maximum: this.limits.maxTotalListItems, observed: this.listItems });
    const copy: T[] = [];
    for (let index = 0; index < length; index++) {
      const entryPath: DisplayPath = [...at, index];
      copy.push(parse(this.field(value, String(index), entryPath), entryPath));
    }
    return copy;
  }
  /** Exact only for a successfully completed schema parser. */
  usage(): DisplayUsage { return Object.freeze({ textCodeUnits: this.textCodeUnits, listItems: this.listItems }); }
}

export function runDisplayCheck<T>(limits: ReaderLimits, parse: (reader: DisplayReader) => T): DisplayCheckResult<T> {
  try {
    const reader = new DisplayReader(limits);
    const value = parse(reader);
    return Object.freeze({ ok: true, value, usage: reader.usage() });
  } catch (thrown) {
    return Object.freeze({ ok: false, diagnostic: deliberateDisplayRefusal(thrown) ?? unreadableDiagnostic });
  }
}
