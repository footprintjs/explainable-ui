import { readOwnField, runDisplayCheck, type DisplayReader } from './reader';
import type { DisplayDiagnostic, DisplayLimitName, DisplayPath } from './types';
import { investigationDisplayLimits } from './limits';

export interface ExplanationTextPart {
  readonly text: string;
  /** Identifies an excerpt supplied by the host as quoted record text. */
  readonly quote?: true;
}

export type ExplanationText = string | readonly ExplanationTextPart[];

export function readExplanationText(
  reader: DisplayReader,
  value: unknown,
  path: DisplayPath,
  maximum: number,
  limit: DisplayLimitName,
  maxParts: number,
): ExplanationText {
  if (!Array.isArray(value)) return reader.text(value, path, maximum, limit);
  let length = 0;
  const parts = reader.list(value, path, maxParts, 'maxItemsPerList', (entry, at) => {
    if (!entry || typeof entry !== 'object') return reader.fail('invalid-value', at);
    const keys = Reflect.ownKeys(entry);
    if (keys.length > 2 || keys.some(key => key !== 'text' && key !== 'quote')) {
      return reader.fail('invalid-value', at);
    }
    const text = reader.field(entry, 'text', [...at, 'text']);
    if (typeof text !== 'string') return reader.fail('invalid-value', [...at, 'text']);
    length += text.length;
    if (!keys.includes('quote')) return Object.freeze({ text });
    if (reader.field(entry, 'quote', [...at, 'quote']) !== true) {
      return reader.fail('invalid-value', [...at, 'quote']);
    }
    if (!text.length) return reader.fail('invalid-value', [...at, 'text']);
    return Object.freeze({ text, quote: true as const });
  });
  reader.countText(length, path, maximum, limit);
  return Object.freeze(parts);
}

type LabelRefusal = Readonly<{ fallback: string; diagnostic: DisplayDiagnostic }>;
export type ExplanationLabel = ExplanationText | LabelRefusal;

/** The map is only a source of names for already admitted IDs and kinds. */
export function readExplanationLabel(labels: unknown, key: string, fallback: string): ExplanationLabel {
  const maxLabelUnits = 512;
  try {
    const value = readOwnField(labels, key);
    if (typeof value === 'string') return value.length && value.length <= maxLabelUnits ? value : fallback;
    if (!value || typeof value !== 'object') return fallback;
    const result = runDisplayCheck(investigationDisplayLimits, reader =>
      readExplanationText(reader, value, [], maxLabelUnits,
        'maxStringCodeUnits', investigationDisplayLimits.maxItemsPerList));
    return result.ok ? result.value : { fallback, diagnostic: result.diagnostic };
  } catch {
    return fallback;
  }
}
