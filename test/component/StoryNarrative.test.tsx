/** @vitest-environment jsdom */
/**
 * Component render tests for StoryNarrative.
 *
 * Verifies DOM output, heading labels, entry filtering, and
 * progressive reveal via revealedEntryCount.
 */
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StoryNarrative } from '../../src/components/StoryNarrative/StoryNarrative';
import type { NarrativeEntry } from '../../src/types';

function e(type: NarrativeEntry['type'], text: string, extra?: Partial<NarrativeEntry>): NarrativeEntry {
  return { type, text, depth: 0, ...extra } as NarrativeEntry;
}

describe('StoryNarrative component', () => {
  it('renders with role="log"', () => {
    const { container } = render(
      <StoryNarrative entries={[]} revealedEntryCount={0} />,
    );
    expect(container.querySelector('[role="log"]')).toBeTruthy();
  });

  it('renders data-fp="story-narrative" marker', () => {
    const { container } = render(
      <StoryNarrative entries={[]} revealedEntryCount={0} />,
    );
    expect(container.querySelector('[data-fp="story-narrative"]')).toBeTruthy();
  });

  it('renders stage heading with correct label', () => {
    // Component strips "Stage N: " prefix — match the cleaned text
    const entries = [e('stage', 'Stage 1: Parse request.')];
    render(<StoryNarrative entries={entries} revealedEntryCount={1} unstyled />);
    expect(screen.getByText(/Parse request/)).toBeTruthy();
  });

  it('renders Fork heading for [Parallel] forks', () => {
    const entries = [
      e('stage', 'Stage 1: First.'),
      e('fork', '[Parallel]: Forking into 3 paths: A, B, C.'),
    ];
    render(<StoryNarrative entries={entries} revealedEntryCount={2} unstyled />);
    expect(screen.getByText(/Forking into 3 paths/)).toBeTruthy();
  });

  it('renders Selector heading for [Selected] forks', () => {
    const entries = [
      e('stage', 'Stage 1: First.'),
      e('fork', '[Selected]: 2 of 3 selected: A, B.'),
    ];
    render(<StoryNarrative entries={entries} revealedEntryCount={2} unstyled />);
    expect(screen.getByText(/2 of 3 selected/)).toBeTruthy();
  });

  it('renders Decider heading with same number as parent stage', () => {
    const entries = [
      e('stage', 'Stage 1: Evaluate risk.'),
      e('condition', '[Condition]: Risk is high, chose reject.'),
    ];
    render(<StoryNarrative entries={entries} revealedEntryCount={2} unstyled />);
    expect(screen.getByText(/Risk is high/)).toBeTruthy();
  });

  it('respects revealedEntryCount — hides future entries', () => {
    const entries = [
      e('stage', 'Stage 1: First.'),
      e('step', 'Write x = 1'),
      e('stage', 'Stage 2: Second.'),
    ];
    const { container } = render(
      <StoryNarrative entries={entries} revealedEntryCount={2} unstyled />,
    );
    const rendered = container.querySelectorAll('[data-fp="narrative-entry"]');
    expect(rendered).toHaveLength(2);
  });

  it('shows "N more entries ahead" hint for unrevealed entries', () => {
    const entries = [
      e('stage', 'Stage 1: First.'),
      e('stage', 'Stage 2: Second.'),
      e('stage', 'Stage 3: Third.'),
    ];
    render(<StoryNarrative entries={entries} revealedEntryCount={1} />);
    expect(screen.getByText(/2 more entries ahead/)).toBeTruthy();
  });

  it('filters out subflow internal entries', () => {
    const entries = [
      e('stage', 'Stage 1: Root.'),
      { type: 'stage' as const, text: 'Internal subflow stage', depth: 1, subflowId: 'sf-1' } as any,
      { type: 'subflow' as const, text: 'Entering the Auth subflow.', depth: 0, subflowId: 'sf-1' } as any,
    ];
    const { container } = render(
      <StoryNarrative entries={entries} revealedEntryCount={3} unstyled />,
    );
    const rendered = container.querySelectorAll('[data-fp="narrative-entry"]');
    // Root stage + Entering marker shown; internal stage hidden
    expect(rendered).toHaveLength(2);
  });

  it('hides Exiting subflow markers in styled mode', () => {
    const entries = [
      e('stage', 'Stage 1: Root.'),
      { type: 'subflow' as const, text: 'Entering the Auth subflow.', depth: 0, subflowId: 'sf-1', stageId: 'sf-1' } as any,
      { type: 'subflow' as const, text: 'Exiting the Auth subflow.', depth: 0, subflowId: 'sf-1', stageId: 'sf-1' } as any,
    ];
    render(<StoryNarrative entries={entries} revealedEntryCount={3} />);
    // Exit marker rendered as null — toggle detects second occurrence of same stageId
    expect(screen.queryByText(/Exiting/)).toBeNull();
  });

  it('renders empty state without crashing', () => {
    const { container } = render(
      <StoryNarrative entries={[]} revealedEntryCount={0} />,
    );
    expect(container.querySelector('[data-fp="story-narrative"]')).toBeTruthy();
  });

  // ── retry (footprintjs >= 9.15.0) ──────────────────────────────────────
  // A retry entry is attempt telemetry nested inside its own stage. Before eui
  // learned the type it fell through to the generic `step` icon and a bridge
  // upstream had to relabel it, so the badge lied. These pin the treatment.

  it('renders a retry entry with its own type marker, not step', () => {
    const entries = [
      e('stage', 'Stage 1: Call the flaky API.'),
      e('retry', '[Retry]: attempt 1 of 3 at CallApi failed (timeout). Waited 200ms before the next attempt.', { depth: 1 }),
    ];
    const { container } = render(
      <StoryNarrative entries={entries} revealedEntryCount={2} unstyled />,
    );
    const marked = container.querySelector('[data-fp="narrative-entry"][data-type="retry"]');
    expect(marked).toBeTruthy();
    expect(container.querySelector('[data-type="step"]')).toBeNull();
  });

  it('gives retry its own icon and label — not the generic step fallback', () => {
    const entries = [e('retry', '[Retry]: attempt 2 of 3 at CallApi failed (429).', { depth: 1 })];
    render(<StoryNarrative entries={entries} revealedEntryCount={1} />);
    const icon = screen.getByLabelText('Retry');
    expect(icon.textContent).toBe('↺');
    // Distinct from loop's back-edge glyph — a retry is a failure, not a
    // by-design loop, and the two must not read as the same event.
    expect(icon.textContent).not.toBe('↻');
  });

  it('shows retry text verbatim and gives it no heading number', () => {
    const entries = [
      e('stage', 'Stage 1: Call the flaky API.'),
      e('retry', '[Retry]: attempt 1 of 3 at CallApi failed (timeout).', { depth: 1 }),
      e('stage', 'Stage 2: Format the answer.'),
    ];
    render(<StoryNarrative entries={entries} revealedEntryCount={3} unstyled />);
    // Verbatim: the renderer upstream already wrote the sentence.
    expect(screen.getByText(/attempt 1 of 3 at CallApi failed/)).toBeTruthy();
    // The stage AFTER the retry is still number 2 — a retry does not advance
    // the flowchart, so it must not consume a heading number.
    expect(screen.getByText(/^2\./)).toBeTruthy();
  });
});
