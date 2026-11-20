/** @vitest-environment jsdom */
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FailureExplanationView } from '../../src/components/FailureExplanationView/FailureExplanationView';
import { DependencyEvidence } from '../../src/components/GroupedFlowInvestigation/DependencyEvidence';
import { InvestigationPanel } from '../../src/components/InvestigationPanel/InvestigationPanel';
import type { InvestigationPort } from '../../src/components/InvestigationPanel/types';
import { checkFailureExplanationDisplay, failureExplanationDisplayLimits } from '../../src/displayChecks';
import { attention, explanation, earlier, later, selected } from '../fixtures/investigation/recorded';

const quoteSelector = '[data-part="record-quote"]';
const quoted = (text: string) => [{ text: 'Before ' }, { text, quote: true }, { text: ' after' }] as const;

function failureModel() {
  const section = (text: string) => ({ text, wordingSource: 'default' as const, evidenceRefs: [] });
  return {
    problem: section('P'), recordedCause: section('C'), suggestedNextStep: section('N'),
    unknowns: [], canonicalFindings: { causes: [], consequences: [], diagnosticFailures: [] },
  };
}

function investigationPort() {
  return { binding: {}, attention, explain: vi.fn<InvestigationPort['explain']>(async () => explanation) };
}

function openInvestigation() {
  fireEvent.click(screen.getByRole('button', { name: 'Investigate item 1' }));
}

function checkQuote(element: HTMLElement, original: string) {
  expect(element.textContent).toBe(original);
  const isolatedText = element.querySelector('bdi');
  expect(isolatedText?.childNodes).toHaveLength(1);
  expect(isolatedText?.firstChild?.nodeType).toBe(Node.TEXT_NODE);
  expect(isolatedText?.textContent).toBe(original);
  expect(element).toHaveAccessibleName('Recorded quotation');
  expect(element.previousSibling?.textContent).toBe('Before ');
  expect(element.nextSibling?.textContent).toBe(' after');
}

afterEach(cleanup);

describe('record quotations in the explanation views', () => {
  it('renders existing strings as the same unwrapped escaped text', () => {
    const failure = failureModel();
    const value = 'Legacy <b>x</b>  words';
    const { container } = render(<>
      <FailureExplanationView explanation={{
        ...failure,
        problem: { ...failure.problem, text: value, wordingSource: 'configured', configuredText: value },
        unknowns: [value],
        canonicalFindings: {
          ...failure.canonicalFindings, causes: [{ code: 'CAUSE', summary: value, evidenceRefs: [] }],
        },
      }} />
      <InvestigationPanel port={{ ...investigationPort(), labels: { [selected]: value } }} markLabels={{ error: value }} />
    </>);
    const text = screen.getAllByText(value, { normalizer: content => content });
    expect(text.length).toBeGreaterThanOrEqual(6);
    for (const node of text) expect(node.innerHTML).toBe('Legacy &lt;b&gt;x&lt;/b&gt;  words');
    expect(container.querySelector(quoteSelector)).toBeNull();
  });

  it('keeps exact quote text in all six fields, including the collapsed finding', () => {
    const failure = failureModel();
    const markup = '<b>x</b> [HIGH]\n          \ty';
    const long = `\u202e\u200b${'w'.repeat(180)}\u200b`;
    const expected = [markup, 'recorded guidance', 'recorded finding', 'recorded unknown', long, 'recorded mark'];
    const { container } = render(<>
      <FailureExplanationView explanation={{
        ...failure,
        problem: {
          ...failure.problem, text: quoted(expected[0]!), wordingSource: 'configured',
          configuredText: quoted(expected[1]!),
        },
        unknowns: [quoted(expected[3]!)],
        canonicalFindings: {
          ...failure.canonicalFindings, causes: [{ code: 'CAUSE', summary: quoted(expected[2]!), evidenceRefs: [] }],
        },
      }} />
      <InvestigationPanel port={{ ...investigationPort(), labels: { [selected]: quoted(expected[4]!) } }}
        markLabels={{ error: quoted(expected[5]!) }} />
    </>);
    const quotes = [...container.querySelectorAll<HTMLElement>(quoteSelector)];
    expect(quotes).toHaveLength(expected.length);
    expected.forEach(original => checkQuote(quotes.find(element => element.textContent === original)!, original));
    const finding = quotes.find(element => element.textContent === expected[2]);
    expect(finding?.closest('details')?.hasAttribute('open')).toBe(false);
    expect(container.querySelector('b')).toBeNull();
    expect(container.querySelector('[data-part="failure-finding-level"]')).toBeNull();
    const styled = getComputedStyle(quotes.find(element => element.textContent === long)!);
    expect(styled.unicodeBidi).toBe('isolate');
    expect(styled.whiteSpace).toBe('normal');
    expect(styled.overflowWrap).toBe('anywhere');
  });

  it('keeps the recorded path disclosure on opaque IDs while displaying quoted labels', async () => {
    const original = 'Recorded source';
    const port = investigationPort();
    render(<InvestigationPanel port={{ ...port, labels: { [earlier]: quoted(original) } }} />);
    expect(port.explain).not.toHaveBeenCalled();
    openInvestigation();
    await screen.findByText('Supported root cause');
    fireEvent.click(screen.getByRole('button', { name: 'Show recorded path' }));
    const path = screen.getByRole('region', { name: 'Selected explanation' }).querySelector('ol');
    const quote = path?.querySelector<HTMLElement>(quoteSelector);
    expect(quote).toBeTruthy();
    checkQuote(quote!, original);
    expect(port.explain.mock.calls[0]?.[0]).toBe(selected);
  });

  it('keeps grouped dependency names as quotes beside the recorded relationship', () => {
    const from = '<b>Check</b>';
    const to = '\u202eSave';
    const { container } = render(<DependencyEvidence result={explanation} direction="impact" labels={{
      [selected]: quoted(from), [later]: quoted(to),
    }} />);
    const quotes = [...container.querySelectorAll<HTMLElement>(quoteSelector)];
    expect(quotes).toHaveLength(2);
    checkQuote(quotes[0]!, from);
    checkQuote(quotes[1]!, to);
    expect(quotes[0]?.parentElement?.textContent).toBe(`Before ${from} after → Before ${to} after · data · per-write`);
    expect(screen.getByText('record:save#4:read')).toBeTruthy();
  });

  it('refuses malformed quote input with a bounded diagnostic and never invokes getters', () => {
    const accessor = vi.fn(() => { throw Error('HOST SECRET'); });
    const extra = Object.defineProperty({ text: 'HOST SECRET', quote: true }, 'private', { get: accessor });
    const getterPart = Object.defineProperty({ quote: true }, 'text', { get: accessor });
    const getterList = Object.defineProperty([{ text: 'HOST SECRET' }], 0, { get: accessor });
    const malformed = [
      [{ text: '', quote: true }], [{ text: 'HOST SECRET', quote: false }], [extra],
      [{ text: 'HOST SECRET', quote: true, [Symbol('private')]: null }],
      [getterPart], getterList, Array(1), { text: 'HOST SECRET', quote: true },
    ];
    for (const text of malformed) {
      const input = failureModel();
      const invalid = { ...input, problem: { ...input.problem, text } };
      const checked = checkFailureExplanationDisplay(invalid);
      expect(checked.ok).toBe(false);
      if (checked.ok) throw Error('Expected a refusal');
      expect(checked.diagnostic).toMatchObject({ path: expect.arrayContaining(['problem', 'text']) });
      expect(JSON.stringify(checked.diagnostic)).not.toContain('HOST SECRET');
      const { container } = render(<FailureExplanationView explanation={invalid as never} />);
      expect(screen.getByRole('status').textContent).toContain('The cause and outcome remain unknown.');
      expect(container.querySelector(quoteSelector)).toBeNull();
      cleanup();
    }
    expect(accessor).not.toHaveBeenCalled();
  });

  it('checks combined UTF-16 lengths under the same limit names as scalar text', () => {
    const input = failureModel();
    const limits = failureExplanationDisplayLimits;
    const withinLimit = 'a'.repeat(limits.maxReferenceOrUnknownCodeUnits - 2);
    const exact = [{ text: withinLimit }, { text: '💡', quote: true }] as const;
    expect(checkFailureExplanationDisplay({ ...input, unknowns: [exact] }).ok).toBe(true);
    for (const unknown of [withinLimit + '💡x', [exact[0], { text: '💡x', quote: true }]]) {
      expect(checkFailureExplanationDisplay({ ...input, unknowns: [unknown] })).toMatchObject({
        ok: false, diagnostic: { code: 'limit-exceeded', limit: 'maxReferenceOrUnknownCodeUnits',
          maximum: limits.maxReferenceOrUnknownCodeUnits, observed: limits.maxReferenceOrUnknownCodeUnits + 1 },
      });
    }
    const half = 'x'.repeat(limits.maxTextCodeUnits / 2);
    for (const value of [half + half, [{ text: half }, { text: half, quote: true }]]) {
      expect(checkFailureExplanationDisplay({ ...input, problem: { ...input.problem, text: value } })).toMatchObject({
        ok: false, diagnostic: { code: 'limit-exceeded', limit: 'maxTextCodeUnits', maximum: limits.maxTextCodeUnits },
      });
    }
  });

  it('shows a safe fallback and reason for malformed label parts without changing legacy fallback', () => {
    const accessor = vi.fn(() => { throw Error('HOST SECRET'); });
    const invalid = Object.defineProperty([{ text: 'HOST SECRET' }], 0, { get: accessor });
    const port = investigationPort();
    const { container, rerender } = render(<InvestigationPanel
      port={{ ...port, labels: { [selected]: invalid } }} markLabels={{ error: [{ text: 'HOST SECRET', quote: false }] } as never} />);
    const row = screen.getByRole('button', { name: 'Investigate item 1' }).closest('li')!;
    expect(within(row).getByText(selected)).toBeTruthy();
    expect(within(row).getByText('Recorded error')).toBeTruthy();
    expect(row.textContent).toMatch(/Record quotation/);
    expect(row.textContent).not.toContain('HOST SECRET');
    expect(container.querySelector(quoteSelector)).toBeNull();
    expect(port.explain).not.toHaveBeenCalled();
    expect(accessor).not.toHaveBeenCalled();

    rerender(<InvestigationPanel
      port={{ ...port, labels: { [selected]: { text: 'HOST SECRET', quote: true } } } as never}
      markLabels={{ error: '' }} />);
    expect(screen.getByText(selected)).toBeTruthy();
    expect(container.textContent).toMatch(/Record quotation/);
    expect(container.textContent).not.toContain('HOST SECRET');

    rerender(<InvestigationPanel port={{ ...port, labels: { [selected]: 42 } } as never} markLabels={{ error: '' }} />);
    expect(screen.getByText(selected)).toBeTruthy();
    expect(screen.getByText('Recorded error')).toBeTruthy();
    expect(container.textContent).not.toMatch(/Record quotation/);
  });
});
