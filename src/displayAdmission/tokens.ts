import { failureExplanationDisplayLimits, investigationDisplayLimits } from './limits';
import type { DisplayDiagnostic, DisplayDiagnosticCode, DisplayLimitName, DisplayPath, DisplaySchemaField } from './types';

const schemaFields: ReadonlySet<string> = new Set<DisplaySchemaField>([
  'problem', 'recordedCause', 'suggestedNextStep', 'text', 'configuredText', 'wordingSource',
  'evidenceRefs', 'unknowns', 'canonicalFindings', 'causes', 'consequences', 'diagnosticFailures',
  'code', 'summary', 'level', 'nodes', 'nodeId', 'attention', 'kind', 'reason', 'evidence', 'confidence',
  'gaps', 'from', 'to', 'attribution', 'edges', 'backward', 'rootCause', 'path', 'alternatives',
  'impact', 'projection', 'requestedNodeId', 'length', 'quote', 'omittedReferences', 'occurrences',
]);
const codes: ReadonlySet<string> = new Set<DisplayDiagnosticCode>([
  'invalid-own-field', 'accessor-field', 'invalid-value', 'invalid-enum', 'invalid-code',
  'duplicate-identity', 'selection-mismatch', 'inconsistent-evidence', 'limit-exceeded', 'unreadable-input',
]);
const limitNames: ReadonlySet<string> = new Set([
  ...Object.keys(investigationDisplayLimits),
  ...Object.keys(failureExplanationDisplayLimits).filter(key => key !== 'findingCodePattern'),
  'maxFitItemsPerList', 'maxFitInputItems',
]);
const emptyPath: DisplayPath = Object.freeze([]);
export const unreadableDiagnostic: DisplayDiagnostic = Object.freeze({ code: 'unreadable-input', path: emptyPath });
const refusals = new WeakMap<object, DisplayDiagnostic>();

/** Internal paths are validated too; never copy arbitrary labels, IDs or accessor values into diagnostics. */
export function copyDisplayPath(path: DisplayPath): DisplayPath | undefined {
  try {
    if (!Array.isArray(path)) return undefined;
    const descriptor = Object.getOwnPropertyDescriptor(path, 'length');
    if (!descriptor || !('value' in descriptor)) return undefined;
    const length: unknown = descriptor.value;
    if (typeof length !== 'number' || !Number.isSafeInteger(length) || length < 0 || length > 8) return undefined;
    const copy: (DisplaySchemaField | number)[] = [];
    for (let index = 0; index < length; index++) {
      const part = Object.getOwnPropertyDescriptor(path, String(index));
      if (!part || !('value' in part)) return undefined;
      const value: unknown = part.value;
      if (typeof value === 'string' && schemaFields.has(value)) copy.push(value as DisplaySchemaField);
      else if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= 1_024) copy.push(value);
      else return undefined;
    }
    return Object.freeze(copy);
  } catch { return undefined; }
}

export interface DisplayLimitDetails { limit: DisplayLimitName; maximum: number; observed: number }
function copyLimitDetails(details: DisplayLimitDetails): Readonly<DisplayLimitDetails> | undefined {
  try {
    if (!details || typeof details !== 'object') return undefined;
    const own = (key: keyof DisplayLimitDetails): unknown => {
      const field = Object.getOwnPropertyDescriptor(details, key);
      return field && 'value' in field ? field.value : undefined;
    };
    const limit = own('limit'), maximum = own('maximum'), observed = own('observed');
    if (typeof limit !== 'string' || !limitNames.has(limit) || typeof maximum !== 'number'
      || !Number.isSafeInteger(maximum) || maximum < 0 || typeof observed !== 'number'
      || !Number.isSafeInteger(observed) || observed < 0) return undefined;
    return Object.freeze({ limit: limit as DisplayLimitName, maximum, observed });
  } catch { return undefined; }
}
function throwDiagnostic(diagnostic: DisplayDiagnostic): never {
  const token: object = Object.freeze(Object.create(null));
  refusals.set(token, diagnostic);
  throw token;
}
export function refuseDisplay(code: DisplayDiagnosticCode, path: DisplayPath, details?: DisplayLimitDetails): never {
  const copiedPath = copyDisplayPath(path);
  if (!copiedPath || !codes.has(code) || (details !== undefined && code !== 'limit-exceeded'))
    return throwDiagnostic(unreadableDiagnostic);
  if (code === 'limit-exceeded') {
    const copiedDetails = details === undefined ? undefined : copyLimitDetails(details);
    if (details !== undefined && !copiedDetails) return throwDiagnostic(unreadableDiagnostic);
    return throwDiagnostic(Object.freeze({ code, path: copiedPath, ...copiedDetails }));
  }
  return throwDiagnostic(Object.freeze({ code, path: copiedPath }));
}
/** WeakMap identity lookup does not inspect foreign objects, functions or revoked Proxies. */
export function deliberateDisplayRefusal(thrown: unknown): DisplayDiagnostic | undefined {
  if ((typeof thrown === 'object' && thrown !== null) || typeof thrown === 'function')
    return refusals.get(thrown);
  return undefined;
}
