/** @vitest-environment jsdom */
import { createElement, forwardRef, type HTMLAttributes } from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { FailureExplanationView } from './FailureExplanationView';
import type { FailureExplanationDisplay } from './types';
import { checkFailureExplanationDisplay } from './admission';
import { failureExplanationDisplayLimits as limits } from '../../displayAdmission';
import { FootprintTheme } from '../../theme';

const levels = ['HIGH', 'MEDIUM', 'LOW', 'UNVERIFIED'] as const;
const lists = ['causes', 'consequences', 'diagnosticFailures'] as const;
type FindingList = typeof lists[number];
type RawFinding = { code: string; summary: string; evidenceRefs: string[]; level?: unknown };
const section = (text: string) => ({ text, wordingSource: 'default' as const, evidenceRefs: [] as string[] });
function model() {
  return { problem: section('P'), recordedCause: section('C'), suggestedNextStep: section('N'), unknowns: [] as string[],
    canonicalFindings: { causes: [] as RawFinding[], consequences: [] as RawFinding[], diagnosticFailures: [] as RawFinding[] } };
}
type RawModel = ReturnType<typeof model>;
const finding = (level?: unknown): RawFinding => ({ code: 'R1', summary: 'S', evidenceRefs: ['ref1'], ...(level === undefined ? {} : { level }) });
// Runtime casts carry the newly recognized field on the parent base; packed readonly declarations are proved separately.
const element = (value: unknown) => createElement(FailureExplanationView, { explanation: value as FailureExplanationDisplay });
const html = (value: unknown) => renderToStaticMarkup(element(value));
const digest = (value: string) => createHash('sha256').update(value).digest('hex');
const caption = 'Finding levels are supplied by the host and are not verified by this view.';
const parentRawHtmlSha256 = '37277bf629585cbd1315ac689ea91057c62738e459c6668508f56384ddc9acf3';
function parentModel(): RawModel {
  return { problem: section('P'), recordedCause: section('C'), suggestedNextStep: section('N'), unknowns: ['Still unknown.'],
    canonicalFindings: {
      causes: [{ code: 'HIGH', summary: 'The word LOW is source text.', evidenceRefs: ['ref:shared', 'ref:shared'] }],
      consequences: [{ code: 'OUTCOME_1', summary: 'Outcome', evidenceRefs: [] }],
      diagnosticFailures: [{ code: 'RECORDER_1', summary: 'Recorder', evidenceRefs: ['ref:diag'] }],
    } };
}
function admitted(value: unknown) {
  const result = checkFailureExplanationDisplay(value);
  expect(result.ok).toBe(true);
  if (!result.ok) throw Error('Expected an admitted display');
  return result;
}
function refused(value: unknown) {
  const result = checkFailureExplanationDisplay(value);
  expect(result.ok).toBe(false);
  if (result.ok) throw Error('Expected whole-model refusal');
  expect(result).not.toHaveProperty('value'); expect(result).not.toHaveProperty('usage');
  expect(Object.isFrozen(result.diagnostic)).toBe(true); expect(Object.isFrozen(result.diagnostic.path)).toBe(true);
  return result.diagnostic;
}
const levelPath = (list: FindingList, index = 0) => ['canonicalFindings', list, index, 'level'];
function atBudget(extra = 0): RawModel {
  const value = model();
  // Other old fields consume8 units: C+N and two R1/S findings. Each repeated HIGH adds4 more units.
  value.problem.text = 'x'.repeat(limits.maxTextCodeUnits - 16 + extra);
  value.canonicalFindings.causes = [{ code: 'R1', summary: 'S', evidenceRefs: [], level: 'HIGH' }];
  value.canonicalFindings.consequences = [{ code: 'R1', summary: 'S', evidenceRefs: [], level: 'HIGH' }];
  return value;
}

describe('optional host-declared failure finding levels', () => {
  it.each(lists.flatMap(list => levels.map(level => ({ list, level }))))('retains and neutrally displays $level in $list', ({ list, level }) => {
    const input = model(); input.canonicalFindings[list] = [finding(level)];
    const checked = admitted(input), retained = checked.value.canonicalFindings[list][0]!;
    expect(retained).toEqual({ code: 'R1', summary: 'S', evidenceRefs: ['ref1'], level });
    expect(checked.usage).toEqual({ textCodeUnits: 10 + level.length, listItems: 2 });
    const view = render(element(input));
    const badge = screen.getByText(`Host level: ${level}`);
    expect(badge.getAttribute('data-fp-part')).toBe('failure-finding-level');
    expect(badge.tagName).toBe('SPAN'); expect(badge.getAttribute('tabindex')).toBeNull();
    expect(screen.getByText(caption)).toBeTruthy();
    expect(screen.getByText('S')).toBeTruthy(); expect(screen.getByText('ref1')).toBeTruthy();
    expect(view.container.querySelector('button,a')).toBeNull();
  });

  it.each(['absent', 'own undefined', 'inherited only'] as const)('preserves exact parent DTO/raw HTML/usage and never infers a label for %s levels', mode => {
    const input = parentModel(); let getters = 0;
    for (const list of lists) for (const entry of input.canonicalFindings[list]) {
      if (mode === 'own undefined') Object.defineProperty(entry, 'level', { value: undefined });
      if (mode === 'inherited only') Object.setPrototypeOf(entry, Object.create(Object.prototype, {
        level: { get() { getters++; throw Error('Inherited level must stay unread'); } },
      }));
    }
    const checked = admitted(input);
    expect(checked.value).toEqual(parentModel()); expect(checked.usage).toEqual({ textCodeUnits: 111, listItems: 7 });
    for (const list of lists) for (const entry of checked.value.canonicalFindings[list])
      expect(Object.prototype.hasOwnProperty.call(entry, 'level')).toBe(false);
    // Captured from raw parent c152 SSR, with no generated-ID normalization; proof includes its React19.2.7 runtime.
    expect(digest(html(input))).toBe(parentRawHtmlSha256);
    render(element(input));
    expect(screen.queryByText(/^Host level:/)).toBeNull(); expect(screen.queryByText(caption)).toBeNull();
    expect(screen.queryByText('Host level: UNVERIFIED')).toBeNull(); expect(getters).toBe(0);
  });

  it('uses the existing Badge adapter and one neutral style for every level without adding an action', () => {
    const input = model(); input.canonicalFindings.consequences = levels.map(level => finding(level));
    const first = render(element(input));
    const styles = levels.map(level => screen.getByText(`Host level: ${level}`).getAttribute('style'));
    expect(new Set(styles).size).toBe(1);
    expect(screen.getAllByText(caption)).toHaveLength(1);
    first.unmount();
    const Badge = forwardRef<HTMLSpanElement, HTMLAttributes<HTMLSpanElement>>(({ children, ...props }, ref) =>
      <span {...props} ref={ref} data-testid="finding-level-adapter">{children}</span>);
    render(<FootprintTheme components={{ Badge }}>{element(input)}</FootprintTheme>);
    const badges = screen.getAllByTestId('finding-level-adapter'); expect(badges).toHaveLength(4);
    expect(badges.map(badge => badge.textContent)).toEqual(levels.map(level => `Host level: ${level}`));
    for (const badge of badges) expect(badge.getAttribute('data-fp-part')).toBe('failure-finding-level');
  });

  it('preserves source order, duplicate findings/references and escaped text in the existing disclosure', () => {
    const input = model(), quoted = '<img src=x onerror="throw 1">';
    input.unknowns = ['The underlying cause remains unknown.'];
    input.canonicalFindings.causes = [
      { code: 'DUP', summary: quoted, evidenceRefs: ['ref:shared', 'ref:shared', '<a href="x">ref</a>'], level: 'LOW' },
      { code: 'DUP', summary: 'Second supplied finding', evidenceRefs: ['ref:second'], level: 'HIGH' },
      { code: 'DUP', summary: quoted, evidenceRefs: ['ref:shared'], level: 'LOW' },
    ];
    const checked = admitted(input);
    expect(checked.value.canonicalFindings.causes).toEqual(input.canonicalFindings.causes);
    const view = render(element(input)), disclosure = screen.getByText('Recorded cause details').closest('details')!;
    expect(disclosure.open).toBe(false); fireEvent.click(disclosure.querySelector('summary')!);
    const rows = Array.from(disclosure.querySelector('ul')!.children) as HTMLElement[];
    expect(rows).toHaveLength(3);
    expect(rows.map(row => within(row).getByText(/^Host level:/).textContent)).toEqual(['Host level: LOW', 'Host level: HIGH', 'Host level: LOW']);
    for (const row of rows) expect(within(row).getByText('DUP')).toBeTruthy();
    expect(within(rows[0]!).getAllByText('ref:shared')).toHaveLength(2);
    expect(within(rows[0]!).getByText('<a href="x">ref</a>')).toBeTruthy();
    expect(screen.getByText('The underlying cause remains unknown.')).toBeTruthy();
    expect(view.container.querySelector('img,a,script,button')).toBeNull();
    expect(input.canonicalFindings.causes.map(entry => entry.level)).toEqual(['LOW', 'HIGH', 'LOW']);
  });

  it.each(lists)('refuses invalid supplied members as a whole in %s without coercion or secret diagnostics', list => {
    let conversions = 0;
    const noncoercing = { toString() { conversions++; throw Error('PRIVATE LEVEL'); } };
    for (const invalid of [null, '', 'high', 'CRITICAL', 1, false, [], noncoercing]) {
      const input = model(); input.canonicalFindings[list] = [finding(invalid)];
      expect(refused(input)).toEqual({ code: 'invalid-enum', path: levelPath(list) });
      const view = render(element(input));
      expect(screen.getByRole('status').textContent).toContain('cause and outcome remain unknown');
      expect(screen.queryByRole('heading', { name: 'Problem' })).toBeNull();
      expect(view.container.textContent).not.toContain('invalid-enum');
      expect(screen.queryByText(/^Host level:/)).toBeNull(); view.unmount();
    }
    expect(conversions).toBe(0);
  });

  it('refuses an own level accessor without invoking it and exposes no partial admitted finding', () => {
    const input = model(), entry = finding(); let getters = 0;
    Object.defineProperty(entry, 'level', { get() { getters++; return 'HIGH'; } }); input.canonicalFindings.causes = [entry];
    expect(refused(input)).toEqual({ code: 'accessor-field', path: levelPath('causes') }); expect(getters).toBe(0);
    render(element(input)); expect(screen.queryByText('S')).toBeNull();
    expect(screen.getByRole('status').textContent).toContain('cause and outcome remain unknown'); expect(getters).toBe(0);
  });

  it('keeps foreign errors from level reflection unread and refuses with the fixed diagnostic', () => {
    let inspections = 0;
    const inspect = () => { inspections++; throw Error('PRIVATE ERROR'); };
    const foreign = new Proxy({}, { get: inspect, getPrototypeOf: inspect, ownKeys: inspect, getOwnPropertyDescriptor: inspect });
    const revoked = Proxy.revocable({}, {}); revoked.revoke();
    for (const thrown of [foreign, revoked.proxy, new Error('PRIVATE ERROR'), Symbol('PRIVATE ERROR')]) {
      const input = model(); input.canonicalFindings.causes = [new Proxy(finding('HIGH'), {
        getOwnPropertyDescriptor(target, key) { if (key === 'level') throw thrown; return Reflect.getOwnPropertyDescriptor(target, key); },
      })];
      expect(refused(input)).toEqual({ code: 'unreadable-input', path: [] });
    }
    expect(inspections).toBe(0);
  });

  it.each(['code', 'summary', 'references'] as const)('keeps the old %s failure before reading a new level descriptor', field => {
    const input = model(), entry = finding('HIGH'); let levelReads = 0;
    if (field === 'code') entry.code = 'bad';
    if (field === 'summary') entry.summary = '';
    if (field === 'references') entry.evidenceRefs = [42 as never];
    input.canonicalFindings.causes = [new Proxy(entry, {
      getOwnPropertyDescriptor(target, key) { if (key === 'level') { levelReads++; throw Error('Unvisited level'); } return Reflect.getOwnPropertyDescriptor(target, key); },
    })];
    expect(refused(input)).toEqual({ code: field === 'code' ? 'invalid-code' : 'invalid-value',
      path: ['canonicalFindings', 'causes', 0, ...(field === 'references' ? ['evidenceRefs', 0] : [field])] });
    expect(levelReads).toBe(0);
  });

  it('charges each repeated accepted level at the exact existing total-text ceiling without adding a list slot', () => {
    const exact = admitted(atBudget());
    expect(exact.usage).toEqual({ textCodeUnits: limits.maxTextCodeUnits, listItems: 2 });
    expect(exact.value.canonicalFindings.causes[0]).toHaveProperty('level', 'HIGH');
    expect(exact.value.canonicalFindings.consequences[0]).toHaveProperty('level', 'HIGH');
  });

  it('refuses the whole model when repeated levels exceed the unchanged text ceiling by one', () => {
    expect(refused(atBudget(1))).toEqual({ code: 'limit-exceeded', path: levelPath('consequences'),
      limit: 'maxTextCodeUnits', maximum: limits.maxTextCodeUnits, observed: limits.maxTextCodeUnits + 1 });
  });

  it('validates membership before charging an unsupported level near the existing text ceiling', () => {
    const input = model(); input.problem.text = 'x'.repeat(limits.maxTextCodeUnits - 5);
    input.canonicalFindings.causes = [{ code: 'R1', summary: 'S', evidenceRefs: [], level: 'UNSUPPORTED' }];
    expect(refused(input)).toEqual({ code: 'invalid-enum', path: levelPath('causes') });
  });

  it('retains a detached frozen readonly level and references after the host changes its own finding', () => {
    const input = model(), entry = finding('HIGH'); input.canonicalFindings.causes = [entry];
    const checked = admitted(input), retained = checked.value.canonicalFindings.causes[0]!;
    expect(retained).toHaveProperty('level', 'HIGH'); expect(Object.isFrozen(retained)).toBe(true);
    expect(Object.isFrozen(checked.value.canonicalFindings.causes)).toBe(true);
    expect(Reflect.set(retained, 'level', 'LOW')).toBe(false);
    entry.level = 'LOW'; entry.evidenceRefs.push('later');
    expect(retained).toHaveProperty('level', 'HIGH'); expect(retained.evidenceRefs).toEqual(['ref1']);
  });
});
