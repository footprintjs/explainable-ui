import { runDisplayCheck, failureExplanationDisplayLimits as limits } from '../../displayAdmission';
import type { DisplayCheckResult, DisplayReader, DisplayPath, DisplayLimitName } from '../../displayAdmission';
import type { FailureExplanationDisplay, FailureExplanationDisplayFinding, FailureExplanationDisplaySection } from './types';

const findingCode = new RegExp(limits.findingCodePattern);

/** Schema logic only; shared display admission owns inert reads, budgets and diagnostics. */
class FailureAdmission {
  constructor(private readonly reader: DisplayReader) {}

  private text(value: unknown, path: DisplayPath, maximum: number = limits.maxTextCodeUnits,
    limit: DisplayLimitName = 'maxTextCodeUnits'): string {
    return this.reader.text(value, path, maximum, limit);
  }

  private list<T>(value: unknown, path: DisplayPath,
    parse: (entry: unknown, entryPath: DisplayPath) => T): readonly T[] {
    return Object.freeze(this.reader.list(value, path, limits.maxItemsPerList, 'maxItemsPerList', parse));
  }

  strings(value: unknown, path: DisplayPath): readonly string[] {
    return this.list(value, path, (entry, entryPath) => this.text(entry, entryPath,
      limits.maxReferenceOrUnknownCodeUnits, 'maxReferenceOrUnknownCodeUnits'));
  }

  findings(value: unknown, path: DisplayPath): readonly FailureExplanationDisplayFinding[] {
    const r = this.reader;
    return this.list(value, path, (entry, entryPath) => {
      const codePath: DisplayPath = [...entryPath, 'code'];
      const code = this.text(r.field(entry, 'code', codePath), codePath,
        limits.maxFindingCodeUnits, 'maxFindingCodeUnits');
      if (!findingCode.test(code)) r.fail('invalid-code', codePath);
      const summaryPath: DisplayPath = [...entryPath, 'summary'];
      const refsPath: DisplayPath = [...entryPath, 'evidenceRefs'];
      return Object.freeze({ code,
        summary: this.text(r.field(entry, 'summary', summaryPath), summaryPath),
        evidenceRefs: this.strings(r.field(entry, 'evidenceRefs', refsPath), refsPath) });
    });
  }

  section(value: unknown, path: DisplayPath): FailureExplanationDisplaySection {
    const r = this.reader;
    const textPath: DisplayPath = [...path, 'text'];
    const sourcePath: DisplayPath = [...path, 'wordingSource'];
    const configuredPath: DisplayPath = [...path, 'configuredText'];
    const refsPath: DisplayPath = [...path, 'evidenceRefs'];
    const text = this.text(r.field(value, 'text', textPath), textPath);
    const wordingSource = r.field(value, 'wordingSource', sourcePath);
    // Preserve descriptor-read order even when the source enum will be refused.
    const configured = r.field(value, 'configuredText', configuredPath);
    if (wordingSource !== 'default' && wordingSource !== 'configured') return r.fail('invalid-enum', sourcePath);
    if ((wordingSource === 'configured') !== (configured !== undefined)) r.fail('inconsistent-evidence', configuredPath);
    const configuredText = configured === undefined ? undefined : this.text(configured, configuredPath);
    const evidenceRefs = this.strings(r.field(value, 'evidenceRefs', refsPath), refsPath);
    return Object.freeze({ text, wordingSource, evidenceRefs, ...(configuredText === undefined ? {} : { configuredText }) });
  }
}

/** Preflight the exact bounded display projection; this does not authenticate its evidence. */
export function checkFailureExplanationDisplay(value: unknown): DisplayCheckResult<FailureExplanationDisplay> {
  return runDisplayCheck(limits, r => {
    const reader = new FailureAdmission(r);
    // The descriptor is read first; its missing value is checked only at its original parse position.
    const canonicalFindings = r.field(value, 'canonicalFindings', ['canonicalFindings']);
    return Object.freeze({
      problem: reader.section(r.field(value, 'problem', ['problem']), ['problem']),
      recordedCause: reader.section(r.field(value, 'recordedCause', ['recordedCause']), ['recordedCause']),
      suggestedNextStep: reader.section(r.field(value, 'suggestedNextStep', ['suggestedNextStep']), ['suggestedNextStep']),
      unknowns: reader.strings(r.field(value, 'unknowns', ['unknowns']), ['unknowns']),
      canonicalFindings: Object.freeze({
        causes: reader.findings(r.field(canonicalFindings, 'causes', ['canonicalFindings', 'causes']), ['canonicalFindings', 'causes']),
        consequences: reader.findings(r.field(canonicalFindings, 'consequences', ['canonicalFindings', 'consequences']), ['canonicalFindings', 'consequences']),
        diagnosticFailures: reader.findings(r.field(canonicalFindings, 'diagnosticFailures', ['canonicalFindings', 'diagnosticFailures']), ['canonicalFindings', 'diagnosticFailures']),
      }),
    });
  });
}

/** Components and public preflight checks share the same parser and refusal behavior. */
export function admitFailureExplanation(value: unknown): FailureExplanationDisplay | undefined {
  const result = checkFailureExplanationDisplay(value);
  return result.ok ? result.value : undefined;
}
