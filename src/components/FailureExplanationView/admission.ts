import type { FailureExplanationDisplay, FailureExplanationDisplayFinding, FailureExplanationDisplaySection } from './types';

// Fixed display ceilings in UTF-16 code units, not storage or query budgets.
const MAX_TEXT = 262_144;
const MAX_ITEMS = 1_024;
const MAX_ITEM_TEXT = 4_096;
const MAX_TOTAL_ITEMS = 4_096;
class Refused extends Error {}

function field(value: unknown, key: string): unknown {
  if (!value || typeof value !== 'object') throw new Refused();
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  if (descriptor === undefined) return undefined;
  if (!('value' in descriptor)) throw new Refused();
  return descriptor.value;
}

class Admission {
  private remaining = MAX_TEXT;
  private remainingItems = MAX_TOTAL_ITEMS;

  private text(value: unknown, maximum = MAX_TEXT): string {
    if (typeof value !== 'string' || value.length === 0 || value.length > maximum) throw new Refused();
    this.remaining -= value.length;
    if (this.remaining < 0) throw new Refused();
    return value;
  }

  private list<T>(value: unknown, parse: (entry: unknown) => T): readonly T[] {
    if (!Array.isArray(value)) throw new Refused();
    const length = field(value, 'length');
    if (typeof length !== 'number' || !Number.isSafeInteger(length) || length < 0 || length > MAX_ITEMS) throw new Refused();
    this.remainingItems -= length;
    if (this.remainingItems < 0) throw new Refused();
    const copy: T[] = [];
    // Never invoke an input array's map, iterator or accessor entries.
    for (let index = 0; index < length; index++) copy.push(parse(field(value, String(index))));
    return Object.freeze(copy);
  }

  strings(value: unknown): readonly string[] {
    return this.list(value, entry => this.text(entry, MAX_ITEM_TEXT));
  }

  findings(value: unknown): readonly FailureExplanationDisplayFinding[] {
    return this.list(value, entry => {
      const code = this.text(field(entry, 'code'), 80);
      if (!/^[A-Z][A-Z0-9_]{1,79}$/.test(code)) throw new Refused();
      return Object.freeze({ code, summary: this.text(field(entry, 'summary')),
        evidenceRefs: this.strings(field(entry, 'evidenceRefs')) });
    });
  }

  section(value: unknown): FailureExplanationDisplaySection {
    const text = this.text(field(value, 'text'));
    const wordingSource = field(value, 'wordingSource');
    const configured = field(value, 'configuredText');
    if ((wordingSource !== 'default' && wordingSource !== 'configured')
      || (wordingSource === 'configured') !== (configured !== undefined)) throw new Refused();
    const configuredText = configured === undefined ? undefined : this.text(configured);
    const evidenceRefs = this.strings(field(value, 'evidenceRefs'));
    return Object.freeze({ text, wordingSource, evidenceRefs, ...(configuredText === undefined ? {} : { configuredText }) });
  }
}

/** Select/copy only known own data fields. Shape consistency does not authenticate a producer. */
export function admitFailureExplanation(value: unknown): FailureExplanationDisplay | undefined {
  try {
    const reader = new Admission();
    const canonicalFindings = field(value, 'canonicalFindings');
    return Object.freeze({
      problem: reader.section(field(value, 'problem')),
      recordedCause: reader.section(field(value, 'recordedCause')),
      suggestedNextStep: reader.section(field(value, 'suggestedNextStep')),
      unknowns: reader.strings(field(value, 'unknowns')),
      canonicalFindings: Object.freeze({
        causes: reader.findings(field(canonicalFindings, 'causes')),
        consequences: reader.findings(field(canonicalFindings, 'consequences')),
        diagnosticFailures: reader.findings(field(canonicalFindings, 'diagnosticFailures')),
      }),
    });
  } catch {
    return undefined;
  }
}
