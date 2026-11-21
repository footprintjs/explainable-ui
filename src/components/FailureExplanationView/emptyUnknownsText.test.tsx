/** @vitest-environment jsdom */
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { failureExplanationDisplayLimits as limits } from '../../displayAdmission';
import { FailureExplanationView } from './FailureExplanationView';

const section = (text: string) => ({ text, wordingSource: 'default' as const, evidenceRefs: [] });
const model = {
  problem: section('P'), recordedCause: section('C'), suggestedNextStep: section('N'),
  unknowns: [], canonicalFindings: { causes: [], consequences: [], diagnosticFailures: [] },
};
const original = 'The supplied list is empty. This does not establish that everything is known. This view does not verify the underlying evidence.';
const region = () => screen.getByRole('region', { name: 'Still unknown' });

describe('host statement for an empty unknowns list', () => {
  it('keeps the original paragraph exactly when the host supplies nothing', () => {
    render(<FailureExplanationView explanation={model} />);
    expect(region().querySelector('p')?.outerHTML).toBe(`<p>${original}</p>`);
    expect(region().querySelectorAll('p')).toHaveLength(1);
  });

  it('labels a host statement, escapes markup and keeps the verification sentence beside it', () => {
    const line = 'Checked <b>both</b> recorded attempts.';
    render(<FailureExplanationView explanation={model} emptyUnknownsText={line} />);
    const statement = within(region()).getByText('Host statement').closest('p')!;
    expect(statement.querySelector('b')).toBeNull();
    expect(within(statement).getByText(line)).toBeTruthy();
    expect(statement.nextElementSibling?.textContent).toBe(original);
  });

  it('ignores a same-named field in the recording and never asks it for a statement', () => {
    let reads = 0;
    const recording = Object.defineProperty({ ...model }, 'emptyUnknownsText', {
      get() { reads++; return 'The record claims everything was verified.'; },
    });
    render(<FailureExplanationView explanation={recording} />);
    expect(region().querySelector('p')?.textContent).toBe(original);
    expect(region().querySelectorAll('p')).toHaveLength(1);
    expect(reads).toBe(0);
  });

  it('replaces the host statement when the selection changes and hides it while unknowns exist', () => {
    const { rerender } = render(<FailureExplanationView explanation={model} emptyUnknownsText="Checked first attempt" />);
    expect(within(region()).getByText('Checked first attempt')).toBeTruthy();
    rerender(<FailureExplanationView explanation={{ ...model, unknowns: ['One receipt is missing'] }} emptyUnknownsText="Checked first attempt" />);
    expect(within(region()).getByRole('listitem').textContent).toBe('One receipt is missing');
    expect(region().querySelector('p')).toBeNull();
    rerender(<FailureExplanationView explanation={model} emptyUnknownsText="Checked next attempt" />);
    expect(screen.queryByText('Checked first attempt')).toBeNull();
    expect(within(region()).getByText('Checked next attempt')).toBeTruthy();
    rerender(<FailureExplanationView explanation={null} emptyUnknownsText="Checked next attempt" />);
    expect(screen.queryByText('Checked next attempt')).toBeNull();
    expect(screen.getByRole('status')).toBeTruthy();
  });

  it.each(['', ' \t ', 'x'.repeat(limits.maxReferenceOrUnknownCodeUnits + 1), { toString() { throw Error('untrusted'); } }])(
    'retains the exact fallback for an invalid host line (%#)', input => {
      render(<FailureExplanationView explanation={model} emptyUnknownsText={input as string} />);
      expect(region().querySelectorAll('p')).toHaveLength(1);
      expect(region().querySelector('p')?.outerHTML).toBe(`<p>${original}</p>`);
    });

  it('applies the original UTF-16 unknown and combined display limits before displaying a line', () => {
    const line = '😀'.repeat(limits.maxReferenceOrUnknownCodeUnits / 2);
    const { rerender } = render(<FailureExplanationView explanation={model} emptyUnknownsText={line} />);
    expect(within(region()).getByText(line)).toBeTruthy();
    rerender(<FailureExplanationView explanation={model} emptyUnknownsText={line + 'x'} />);
    expect(region().querySelectorAll('p')).toHaveLength(1);
    const nearLimit = { ...model, problem: section('x'.repeat(limits.maxTextCodeUnits - 4)) };
    rerender(<FailureExplanationView explanation={nearLimit} emptyUnknownsText="OK" />);
    expect(within(region()).getByText('OK')).toBeTruthy();
    rerender(<FailureExplanationView explanation={nearLimit} emptyUnknownsText="OK!" />);
    expect(region().querySelectorAll('p')).toHaveLength(1);
    expect(region().querySelector('p')?.textContent).toBe(original);
    expect(screen.getByRole('heading', { name: 'Problem' })).toBeTruthy();
  });
});
