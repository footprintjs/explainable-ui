/** @vitest-environment jsdom */
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FailureExplanationView } from './FailureExplanationView';

const section = (text: string) => ({ text, wordingSource: 'default' as const, evidenceRefs: ['record:attempt:2'] });
const findings = (): { code: string; summary: string; evidenceRefs: string[] }[] => [];
const explanation = () => ({
  problem: section('The recorded service call timed out.'),
  recordedCause: section('The adapter reported a timeout; the upstream reason is unknown.'),
  suggestedNextStep: section('Check the original operation before retrying.'),
  unknowns: ['Customer delivery is unknown.', 'The service root cause is unknown.'],
  canonicalFindings: { causes: findings(), consequences: findings(), diagnosticFailures: findings() },
});
const unavailable = () => expect(screen.getByRole('status').textContent).toContain('cause and outcome remain unknown');

describe('optional plain-language explanation display', () => {
  it('exposes fixed section hooks scoped to each instance with unique accessible headings', () => {
    const model = explanation();
    model.canonicalFindings.consequences.push({ code: 'OUTCOME_RECORDED', summary: 'An outcome was recorded.', evidenceRefs: [] });
    model.canonicalFindings.diagnosticFailures.push({ code: 'RECORDING_FAILED', summary: 'Recording stopped.', evidenceRefs: [] });
    render(<><FailureExplanationView explanation={model} /><FailureExplanationView explanation={model} /></>);
    const views = screen.getAllByRole('region', { name: 'Recorded failure explanation' });
    const sections = [
      ['problem', 'Problem'], ['recordedCause', 'Recorded cause'],
      ['suggestedNextStep', 'Suggested next step'], ['consequences', 'Other recorded outcomes'],
      ['recording', 'Recording problems'], ['unknowns', 'Still unknown'],
    ];
    const headingIds: string[] = [];
    for (const view of views) {
      expect(view.getAttribute('data-fp')).toBe('failure-explanation');
      expect(view.querySelectorAll('[data-section]')).toHaveLength(sections.length);
      for (const [key, title] of sections) {
        const section = within(view).getByRole('region', { name: title! });
        expect(section.getAttribute('data-section')).toBe(key);
        const heading = within(section).getByRole('heading', { name: title! });
        expect(section.getAttribute('aria-labelledby')).toBe(heading.id);
        expect(document.getElementById(heading.id)).toBe(heading);
        headingIds.push(heading.id);
      }
    }
    expect(new Set(headingIds).size).toBe(12);
  });
  it('removes optional section hooks on replacement and all admitted hooks on refusal', () => {
    const model = explanation();
    model.canonicalFindings.consequences.push({ code: 'OUTCOME_RECORDED', summary: 'An earlier outcome.', evidenceRefs: [] });
    const { rerender } = render(<FailureExplanationView explanation={model} />);
    const view = screen.getByRole('region', { name: 'Recorded failure explanation' });
    expect(view.querySelector('[data-section="consequences"]')).not.toBeNull();
    rerender(<FailureExplanationView explanation={explanation()} />);
    expect(view.querySelector('[data-section="consequences"]')).toBeNull();
    expect(view.querySelector('[data-section="recording"]')).toBeNull();
    expect(view.querySelectorAll('[data-section]')).toHaveLength(4);
    rerender(<FailureExplanationView explanation={null} />);
    expect(view.getAttribute('data-fp')).toBe('failure-explanation');
    expect(view.querySelectorAll('[data-section]')).toHaveLength(0);
    unavailable();
  });
  it('keeps complete canonical outcomes and recording failures distinct from causes', () => {
    const model = explanation();
    model.canonicalFindings.causes.push({ code: 'AUTH_REJECTION_RECORDED', summary: 'An access problem was reported.', evidenceRefs: ['source:auth'] });
    model.canonicalFindings.consequences.push({ code: 'PHYSICAL_RECOVERY_RECORDED', summary: 'A later observed attempt answered.', evidenceRefs: ['source:recovery'] });
    model.canonicalFindings.diagnosticFailures.push({ code: 'TRACE_PERSISTENCE_FAILED', summary: 'The recording was not confirmed saved.', evidenceRefs: ['source:save'] });
    const { container } = render(<FailureExplanationView explanation={model} />);
    const cause = screen.getByRole('region', { name: 'Recorded cause' });
    expect(within(cause).getByText(model.recordedCause.text)).toBeTruthy();
    expect(within(cause).getByText('AUTH_REJECTION_RECORDED')).toBeTruthy();
    expect(within(cause).getByText('An access problem was reported.')).toBeTruthy();
    const outcomes = screen.getByRole('region', { name: 'Other recorded outcomes' });
    expect(within(outcomes).getByText('PHYSICAL_RECOVERY_RECORDED')).toBeTruthy();
    expect(within(outcomes).getByText('A later observed attempt answered.')).toBeTruthy();
    const recording = screen.getByRole('region', { name: 'Recording problems' });
    expect(within(recording).getByText('TRACE_PERSISTENCE_FAILED')).toBeTruthy();
    expect(within(recording).getByText('The recording was not confirmed saved.')).toBeTruthy();
    expect(within(cause).queryByText('The recording was not confirmed saved.')).toBeNull();
    for (const ref of ['source:auth', 'source:recovery', 'source:save']) expect(screen.getByText(ref)).toBeTruthy();
    expect(screen.getByText(model.unknowns[0]!)).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull(); expect(screen.queryByRole('link')).toBeNull();
    expect(container.querySelector('a,button')).toBeNull();
  });
  it.each([
    undefined,
    { causes: [], consequences: [], diagnosticFailures: undefined },
    { causes: [], consequences: [null], diagnosticFailures: [] },
    { causes: [], consequences: [], diagnosticFailures: [{ code: 'BAD', summary: 'x'.repeat(262145), evidenceRefs: [] }] },
  ])('refuses missing or malformed canonical findings instead of hiding them (%#)', canonicalFindings => {
    render(<FailureExplanationView explanation={{ ...explanation(), canonicalFindings } as never} />);
    unavailable(); expect(screen.queryByRole('heading', { name: 'Problem' })).toBeNull();
  });
  it('refuses a canonical finding getter without invoking it', () => {
    const model = explanation(); let reads = 0;
    const finding = { code: 'TRACE_OBSERVER_FAILED', summary: 'Unavailable', evidenceRefs: [] };
    Object.defineProperty(finding, 'summary', { get() { reads++; return 'Fabricated'; } });
    model.canonicalFindings.diagnosticFailures.push(finding);
    render(<FailureExplanationView explanation={model} />); unavailable(); expect(reads).toBe(0);
  });
  it('counts canonical finding strings toward the whole-view allowance', () => {
    const model = explanation();
    model.canonicalFindings.consequences.push(...Array.from({ length: 2 }, () => ({ code: 'OUTCOME_RECORDED', summary: 'x'.repeat(140000), evidenceRefs: [] })));
    render(<FailureExplanationView explanation={model} />); unavailable();
  });
  it('bounds total nested finding references even when their text is short', () => {
    const model = explanation();
    model.canonicalFindings.diagnosticFailures.push(...Array.from({ length: 5 }, () => ({ code: 'TRACE_OBSERVER_FAILED', summary: 'Recording stopped.', evidenceRefs: Array(1024).fill('ref') })));
    render(<FailureExplanationView explanation={model} />); unavailable();
  });
  it('copies finding arrays without invoking caller-owned map or iterator', () => {
    const model = explanation(); let calls = 0;
    model.canonicalFindings.diagnosticFailures.push({ code: 'TRACE_OBSERVER_FAILED', summary: 'Recording stopped.', evidenceRefs: [] });
    for (const key of ['map', Symbol.iterator]) Object.defineProperty(model.canonicalFindings.diagnosticFailures, key, {
      get() { calls++; throw Error('Caller-owned method'); },
    });
    render(<FailureExplanationView explanation={model} />);
    expect(screen.getByText('Recording stopped.')).toBeTruthy(); expect(calls).toBe(0);
  });
  it('shows three canonical sections and every unknown without an automatic action', () => {
    const model = explanation(); render(<FailureExplanationView explanation={model} />);
    for (const title of ['Problem', 'Recorded cause', 'Suggested next step', 'Still unknown'])
      expect(screen.getByRole('heading', { name: title })).toBeTruthy();
    for (const item of [model.problem.text, model.recordedCause.text, model.suggestedNextStep.text, ...model.unknowns])
      expect(screen.getByText(item)).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
  });
  it('keeps canonical text beside clearly labelled configured guidance', () => {
    const model = explanation();
    render(<FailureExplanationView explanation={{ ...model, problem: {
      ...model.problem, configuredText: 'A connected business service did not answer in time.', wordingSource: 'configured',
    } }} />);
    expect(screen.getByText(model.problem.text)).toBeTruthy();
    expect(screen.getByText('Business guidance')).toBeTruthy();
    expect(screen.getByText('A connected business service did not answer in time.')).toBeTruthy();
    expect(screen.getByText(model.unknowns[0]!)).toBeTruthy();
  });
  it('keeps references as inert disclosure text even when they resemble URLs', () => {
    const model = explanation(); model.problem.evidenceRefs = ['javascript:alert(1)'];
    render(<FailureExplanationView explanation={model} />);
    const details = screen.getAllByText('Recorded references')[0]!.closest('details')!;
    expect(details.open).toBe(false);
    fireEvent.click(details.querySelector('summary')!);
    expect(screen.getByText('javascript:alert(1)')).toBeTruthy();
    expect(screen.queryByRole('link')).toBeNull();
  });
  it('escapes authored and canonical markup as text', () => {
    const model = explanation(); model.problem.text = '<img src=x onerror=alert(1)>';
    const { container } = render(<FailureExplanationView explanation={model} />);
    expect(screen.getByText(model.problem.text)).toBeTruthy();
    expect(container.querySelector('img,script')).toBeNull();
  });
  it('explains an empty supplied uncertainty list without claiming verification', () => {
    render(<FailureExplanationView explanation={{ ...explanation(), unknowns: [] }} />);
    const unknowns = screen.getByRole('region', { name: 'Still unknown' });
    expect(within(unknowns).getByText(/The supplied list is empty/)).toBeTruthy();
    expect(within(unknowns).getByText(/does not establish that everything is known/)).toBeTruthy();
    expect(within(unknowns).getByText(/does not verify the underlying evidence/)).toBeTruthy();
  });
  it('replaces the old explanation immediately when the host changes or clears the selection', () => {
    const { rerender } = render(<FailureExplanationView explanation={explanation()} />);
    const replacement = explanation(); replacement.problem.text = 'The other recorded operation was refused.';
    rerender(<FailureExplanationView explanation={replacement} />);
    expect(screen.queryByText('The recorded service call timed out.')).toBeNull();
    expect(screen.getByText(replacement.problem.text)).toBeTruthy();
    rerender(<FailureExplanationView explanation={null} />); unavailable();
    expect(screen.queryByText(replacement.problem.text)).toBeNull();
  });
  it.each([null, undefined, {}, { ...explanation(), unknowns: undefined },
    { ...explanation(), problem: { ...section('A problem'), wordingSource: 'configured' } },
    { ...explanation(), problem: { ...section('A problem'), configuredText: 'Unlabelled copy' } },
    { ...explanation(), unknowns: Array(1025).fill('Unknown') },
    { ...explanation(), problem: section('x'.repeat(262145)) },
    { ...explanation(), problem: section('x'.repeat(140000)), recordedCause: section('y'.repeat(140000)) },
    { ...explanation(), unknowns: ['x'.repeat(4097)] },
    Object.create(explanation()),
  ])('refuses a missing, contradictory or over-budget model as a whole (%#)', model => {
    render(<FailureExplanationView explanation={model as never} />); unavailable();
    expect(screen.queryByRole('heading', { name: 'Problem' })).toBeNull();
  });
  it('refuses ordinary getters on nested fields without executing them', () => {
    let reads = 0; const model = explanation();
    Object.defineProperty(model.recordedCause, 'text', { get() { reads++; return 'A fabricated cause'; } });
    render(<FailureExplanationView explanation={model} />); unavailable(); expect(reads).toBe(0);
  });
  it('does not invoke caller-owned array iteration methods or unrelated fields', () => {
    const model = explanation(); let calls = 0;
    Object.defineProperty(model.unknowns, 'map', { get() { calls++; throw Error('caller map'); } });
    Object.defineProperty(model.unknowns, Symbol.iterator, { get() { calls++; throw Error('caller iterator'); } });
    Object.defineProperty(model, 'extra', { get() { calls++; throw Error('irrelevant'); } });
    render(<FailureExplanationView explanation={model} />);
    expect(screen.getByText(model.problem.text)).toBeTruthy(); expect(calls).toBe(0);
  });
  it('refuses accessor array entries and sparse lists without rendering confident fragments', () => {
    const model = explanation(); let reads = 0;
    Object.defineProperty(model.unknowns, '0', { get() { reads++; return 'hidden'; } });
    render(<FailureExplanationView explanation={model} />); unavailable(); expect(reads).toBe(0);
  });
  it('refuses missing array entries rather than quietly omitting uncertainty', () => {
    const model = explanation(); delete model.unknowns[0];
    render(<FailureExplanationView explanation={model} />); unavailable();
  });
  it('gives a nontechnical recovery step for the recording, without suggesting a repeat business action', () => {
    render(<FailureExplanationView explanation={null} />);
    expect(screen.getByRole('status').textContent).toContain('Reload the recording or ask an administrator to check it.');
    expect(screen.getByRole('status').textContent).not.toContain('admitted');
  });
});
