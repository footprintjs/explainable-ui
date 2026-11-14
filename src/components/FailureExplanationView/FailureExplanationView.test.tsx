/** @vitest-environment jsdom */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FailureExplanationView } from './FailureExplanationView';

const section = (text: string) => ({ text, wordingSource: 'default' as const, evidenceRefs: ['record:attempt:2'] });
const explanation = () => ({
  problem: section('The recorded service call timed out.'),
  recordedCause: section('The adapter reported a timeout; the upstream reason is unknown.'),
  suggestedNextStep: section('Check the original operation before retrying.'),
  unknowns: ['Customer delivery is unknown.', 'The service root cause is unknown.'],
});
const unavailable = () => expect(screen.getByRole('status').textContent).toContain('cause and outcome remain unknown');

describe('optional plain-language explanation display', () => {
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
    expect(screen.getByRole('heading', { name: 'Still unknown' })).toBeTruthy();
    expect(screen.getByText(/does not verify the underlying evidence/)).toBeTruthy();
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
});
