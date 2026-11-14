import type { FailureExplanationDisplay, FailureExplanationDisplaySection } from './types';

// Fixed display ceilings in UTF-16 code units, not storage or query budgets.
const MAX_TEXT = 262_144;
const MAX_ITEMS = 1_024;
const MAX_ITEM_TEXT = 4_096;
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

  private text(value: unknown, maximum = MAX_TEXT): string {
    if (typeof value !== 'string' || value.length === 0 || value.length > maximum) throw new Refused();
    this.remaining -= value.length;
    if (this.remaining < 0) throw new Refused();
    return value;
  }

  strings(value: unknown): readonly string[] {
    if (!Array.isArray(value)) throw new Refused();
    const length = field(value, 'length');
    if (typeof length !== 'number' || !Number.isSafeInteger(length) || length < 0 || length > MAX_ITEMS) throw new Refused();
    const copy: string[] = [];
    // Never invoke an input array's map, iterator or accessor entries.
    for (let index = 0; index < length; index++) copy.push(this.text(field(value, String(index)), MAX_ITEM_TEXT));
    return Object.freeze(copy);
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
    return Object.freeze({
      problem: reader.section(field(value, 'problem')),
      recordedCause: reader.section(field(value, 'recordedCause')),
      suggestedNextStep: reader.section(field(value, 'suggestedNextStep')),
      unknowns: reader.strings(field(value, 'unknowns')),
    });
  } catch {
    return undefined;
  }
}
