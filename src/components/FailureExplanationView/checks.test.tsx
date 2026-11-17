/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { FailureExplanationView } from './FailureExplanationView';
import { checkFailureExplanationDisplay } from './admission';
import { failureExplanationDisplayLimits as limits } from '../../displayAdmission';

const section = (text: string) => ({ text, wordingSource: 'default' as const, evidenceRefs: [] as string[] });
const model = () => ({ problem: section('P'), recordedCause: section('C'), suggestedNextStep: section('N'),
  unknowns: [] as string[], canonicalFindings: { causes: [] as { code: string; summary: string; evidenceRefs: string[] }[],
    consequences: [], diagnosticFailures: [] } });

function refused(value: unknown) {
  const result = checkFailureExplanationDisplay(value);
  expect(result.ok).toBe(false);
  if (result.ok) throw Error('Expected a refusal');
  expect(result).not.toHaveProperty('value');
  expect(result).not.toHaveProperty('usage');
  expect(Object.isFrozen(result.diagnostic)).toBe(true);
  expect(Object.isFrozen(result.diagnostic.path)).toBe(true);
  return result.diagnostic;
}

describe('bounded failure-display preflight', () => {
  it('returns a detached frozen projection and exact repeated UTF16/list usage', () => {
    const input = model(); input.unknowns = ['💡'];
    input.canonicalFindings.causes.push({ code: 'R1', summary: '💡', evidenceRefs: ['same', 'same'] });
    const result = checkFailureExplanationDisplay(input);
    expect(result.ok).toBe(true); if (!result.ok) throw Error('Expected acceptance');
    expect(result.usage).toEqual({ textCodeUnits: 17, listItems: 4 });
    expect(Object.isFrozen(result)).toBe(true); expect(Object.isFrozen(result.usage)).toBe(true);
    expect(Object.isFrozen(result.value)).toBe(true); expect(Object.isFrozen(result.value.problem)).toBe(true);
    expect(Object.isFrozen(result.value.canonicalFindings.causes)).toBe(true);
    input.problem.text = 'changed'; input.canonicalFindings.causes[0]!.evidenceRefs.push('later');
    expect(result.value.problem.text).toBe('P');
    expect(result.value.canonicalFindings.causes[0]!.evidenceRefs).toEqual(['same', 'same']);
  });
  it('uses the exact total-text ceiling and stops at the first overflowing field', () => {
    const input = model(); input.problem.text = 'x'.repeat(limits.maxTextCodeUnits - 2);
    expect(checkFailureExplanationDisplay(input).ok).toBe(true);
    input.problem.text += 'x';
    expect(refused(input)).toEqual({ code: 'limit-exceeded', path: ['suggestedNextStep', 'text'],
      limit: 'maxTextCodeUnits', maximum: limits.maxTextCodeUnits, observed: limits.maxTextCodeUnits + 1 });
    input.problem.text = 'x'.repeat(limits.maxTextCodeUnits + 1);
    expect(refused(input)).toEqual({ code: 'limit-exceeded', path: ['problem', 'text'],
      limit: 'maxTextCodeUnits', maximum: limits.maxTextCodeUnits, observed: limits.maxTextCodeUnits + 1 });
  });
  it('uses the exact reference/unknown ceiling without normalizing Unicode', () => {
    const input = model(); input.unknowns = ['💡'.repeat(limits.maxReferenceOrUnknownCodeUnits / 2)];
    expect(checkFailureExplanationDisplay(input).ok).toBe(true); input.unknowns[0] += 'x';
    expect(refused(input)).toEqual({ code: 'limit-exceeded', path: ['unknowns', 0],
      limit: 'maxReferenceOrUnknownCodeUnits', maximum: 4096, observed: 4097 });
  });
  it('keeps per-list and aggregate list limits separate and refuses before reading the tail', () => {
    const input = model(); input.unknowns = Array(limits.maxItemsPerList).fill('u');
    expect(checkFailureExplanationDisplay(input).ok).toBe(true); input.unknowns.push('u');
    expect(refused(input)).toEqual({ code: 'limit-exceeded', path: ['unknowns'],
      limit: 'maxItemsPerList', maximum: 1024, observed: 1025 });
    input.unknowns.pop();
    for (const section of [input.problem, input.recordedCause, input.suggestedNextStep]) section.evidenceRefs = Array(1024).fill('r');
    expect(checkFailureExplanationDisplay(input).ok).toBe(true);
    let reads = 0; const finding = { code: 'R1', summary: 'S', evidenceRefs: [] };
    Object.defineProperty(finding, 'code', { get() { reads++; throw Error('Unvisited tail'); } });
    input.canonicalFindings.causes.push(finding);
    expect(refused(input)).toEqual({ code: 'limit-exceeded', path: ['canonicalFindings', 'causes'],
      limit: 'maxTotalListItems', maximum: 4096, observed: 4097 });
    expect(reads).toBe(0);
  });
  it.each(['r20', 'NO-RUN-LOG', 'R', 'AB\n'])('identifies an invalid finding code without returning it (%#)', code => {
    const input = model(); input.canonicalFindings.causes.push({ code, summary: 'SECRET SUMMARY', evidenceRefs: ['SECRET REF'] });
    const diagnostic = refused(input);
    expect(diagnostic).toEqual({ code: 'invalid-code', path: ['canonicalFindings', 'causes', 0, 'code'] });
    expect(JSON.stringify(diagnostic)).not.toContain(code); expect(JSON.stringify(diagnostic)).not.toContain('SECRET');
  });
  it('exports an inert pattern string and preserves the code length limit', () => {
    expect(typeof limits.findingCodePattern).toBe('string'); expect(Object.isFrozen(limits)).toBe(true);
    const input = model(); input.canonicalFindings.causes.push({ code: 'A'.repeat(80), summary: 'S', evidenceRefs: [] });
    expect(checkFailureExplanationDisplay(input).ok).toBe(true); input.canonicalFindings.causes[0]!.code += 'A';
    expect(refused(input)).toEqual({ code: 'limit-exceeded', path: ['canonicalFindings', 'causes', 0, 'code'],
      limit: 'maxFindingCodeUnits', maximum: 80, observed: 81 });
  });
  it('keeps ordinary getters, caller list methods and future presentation fields unread', () => {
    const input = model(); let reads = 0;
    for (const [value, key] of [[input.problem, 'textParts'], [input, 'levels'], [input.unknowns, 'map'],
      [input.unknowns, Symbol.iterator]] as const) Object.defineProperty(value, key, { get() { reads++; throw Error('Ignored'); } });
    expect(checkFailureExplanationDisplay(input).ok).toBe(true); expect(reads).toBe(0);
    Object.defineProperty(input.problem, 'text', { get() { reads++; return 'SECRET'; } });
    expect(refused(input)).toEqual({ code: 'accessor-field', path: ['problem', 'text'] }); expect(reads).toBe(0);
  });
  it('retains delayed missing-container checks and configured-text descriptor ordering', () => {
    const input = model(); delete (input as Partial<typeof input>).canonicalFindings;
    input.problem.text = '';
    expect(refused(input)).toEqual({ code: 'invalid-value', path: ['problem', 'text'] });
    const other = model(); Object.assign(other.problem, { wordingSource: 'unknown' });
    let reads = 0; Object.defineProperty(other.problem, 'configuredText', { get() { reads++; return 'SECRET'; } });
    expect(refused(other)).toEqual({ code: 'accessor-field', path: ['problem', 'configuredText'] }); expect(reads).toBe(0);
  });
  it('refuses holes at the original schema location instead of accepting inherited values', () => {
    const input = model(); input.canonicalFindings.causes.length = 1;
    expect(refused(input)).toEqual({ code: 'invalid-own-field', path: ['canonicalFindings', 'causes', 0, 'code'] });
    input.canonicalFindings.causes = []; input.unknowns.length = 1;
    expect(refused(input)).toEqual({ code: 'invalid-value', path: ['unknowns', 0] });
  });
  it('never reads a foreign thrown object or accepts a forged private refusal', () => {
    let reads = 0;
    const hostile = new Proxy({}, { get() { reads++; throw Error('Foreign property'); },
      getPrototypeOf() { reads++; throw Error('Foreign prototype'); }, ownKeys() { reads++; throw Error('Foreign keys'); } });
    const revoked = Proxy.revocable({}, {}); revoked.revoke();
    const foreign = [hostile, revoked.proxy, new Error('SECRET ERROR'),
      { code: 'invalid-code', path: ['SECRET PATH'] }, Symbol('SECRET SYMBOL')];
    for (const error of foreign) {
      const input = model(); input.problem = new Proxy(input.problem, { getOwnPropertyDescriptor() { throw error; } });
      let diagnostic: ReturnType<typeof refused> | undefined;
      expect(() => { diagnostic = refused(input); }).not.toThrow();
      expect(diagnostic).toEqual({ code: 'unreadable-input', path: [] });
      expect(JSON.stringify(diagnostic)).not.toContain('SECRET');
    }
    expect(reads).toBe(0);
  });
  it('matches reader acceptance/refusal while keeping diagnostics out of the rendered message', () => {
    const good = model(), bad = model(); bad.canonicalFindings.causes.push({ code: 'bad', summary: 'SECRET FRAGMENT', evidenceRefs: [] });
    for (const value of [good, bad, undefined, {}]) {
      const result = checkFailureExplanationDisplay(value);
      render(<FailureExplanationView explanation={value as never} />);
      if (result.ok) expect(screen.getByRole('heading', { name: 'Problem' })).toBeTruthy();
      else {
        expect(screen.getByRole('status').textContent).toContain('cause and outcome remain unknown');
        expect(screen.queryByText('SECRET FRAGMENT')).toBeNull();
        expect(screen.getByRole('status').textContent).not.toMatch(/invalid-code|canonicalFindings/);
      }
      cleanup();
    }
  });
});
