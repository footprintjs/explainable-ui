import type { failureExplanationDisplayLimits, investigationDisplayLimits } from './limits';

/** Only fixed schema names and bounded array positions can appear in a diagnostic. */
export type DisplaySchemaField =
  | 'problem' | 'recordedCause' | 'suggestedNextStep' | 'text' | 'configuredText'
  | 'wordingSource' | 'evidenceRefs' | 'unknowns' | 'canonicalFindings' | 'causes'
  | 'consequences' | 'diagnosticFailures' | 'code' | 'summary' | 'nodes' | 'nodeId'
  | 'attention' | 'kind' | 'reason' | 'evidence' | 'confidence' | 'gaps' | 'from'
  | 'to' | 'attribution' | 'edges' | 'backward' | 'rootCause' | 'path'
  | 'alternatives' | 'impact' | 'projection' | 'requestedNodeId' | 'length';
export type DisplayPath = readonly (DisplaySchemaField | number)[];
export type DisplayDiagnosticCode =
  | 'invalid-own-field' | 'accessor-field' | 'invalid-value' | 'invalid-enum'
  | 'invalid-code' | 'duplicate-identity' | 'selection-mismatch'
  | 'inconsistent-evidence' | 'limit-exceeded' | 'unreadable-input';
export type DisplayLimitName =
  | keyof typeof investigationDisplayLimits
  | Exclude<keyof typeof failureExplanationDisplayLimits, 'findingCodePattern'>;

export type DisplayDiagnostic =
  | Readonly<{ code: 'limit-exceeded'; path: DisplayPath; limit?: DisplayLimitName; maximum?: number; observed?: number }>
  | Readonly<{ code: Exclude<DisplayDiagnosticCode, 'limit-exceeded'>; path: DisplayPath;
      limit?: never; maximum?: never; observed?: never }>;
/** Exact parser-counted retained free text and list slots on success; not serialized or DOM cost. */
export interface DisplayUsage {
  readonly textCodeUnits: number;
  readonly listItems: number;
}
export type DisplayCheckResult<T> =
  | Readonly<{ ok: true; value: T; usage: DisplayUsage }>
  | Readonly<{ ok: false; diagnostic: DisplayDiagnostic }>;
