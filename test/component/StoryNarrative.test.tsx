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
import type { KnownNarrativeEntryType, NarrativeEntry } from '../../src/types';

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

  // ── pause / resume / emit ──────────────────────────────────────────────
  // These three were in the entry union — and in real engine output — while
  // the badge map still keyed off `string`, so each one rendered with the
  // `step` badge: icon `·`, and `aria-label="Data operation"`. A screen
  // reader was told a paused run was a data operation. The map is now keyed
  // by the union itself, so a missing kind is a compile error; these pin the
  // rendering a reader actually gets.

  it('gives pause, resume and emit their own badges — none falls back to step', () => {
    const cases: [NarrativeEntry['type'], string, string][] = [
      ['pause', 'Paused', '‖'],
      ['resume', 'Resumed', '▷'],
      ['emit', 'Emitted event', '◈'],
    ];
    for (const [type, label, icon] of cases) {
      const { unmount } = render(
        <StoryNarrative entries={[e(type, `a ${type} happened`, { depth: 1 })]} revealedEntryCount={1} />,
      );
      const badge = screen.getByLabelText(label);
      expect(badge.textContent).toBe(icon);
      expect(screen.queryByLabelText('Data operation')).toBeNull();
      unmount();
    }
  });

  it('every narrative kind renders a badge of its own', () => {
    // The runtime half of the compile-time gate. The list is a record keyed
    // by the known union, so a known kind missing from it is a compile error
    // (`npm test` typechecks this file) — the list cannot fall behind.
    const known: Record<KnownNarrativeEntryType, true> = {
      stage: true, step: true, condition: true, fork: true, selector: true, subflow: true,
      loop: true, break: true, error: true, pause: true, resume: true, emit: true, retry: true,
      attempt: true,
    };
    const kinds = Object.keys(known) as KnownNarrativeEntryType[];
    const labels = kinds.map((type) => {
      const { container, unmount } = render(
        <StoryNarrative entries={[e(type, `${type} line`, { depth: 1 })]} revealedEntryCount={1} />,
      );
      // The badge is the icon span; the list root carries its own aria-label.
      const label = container.querySelector('span[aria-label]')?.getAttribute('aria-label');
      unmount();
      return label;
    });
    // Only `step` may say "Data operation", and no known kind may wear the
    // unknown-kind badge — either would be a fallback firing for a kind this
    // release knows, which is exactly the bug this guards.
    expect(labels.filter((l) => l === 'Data operation')).toEqual(['Data operation']);
    expect(labels).not.toContain('Narrative entry');
    expect(labels.every((l) => typeof l === 'string' && l.length > 0)).toBe(true);
  });

  it('an entry kind from a NEWER footprintjs still renders, labelled honestly', () => {
    // Forward compatibility: the fallback is not dead code, it is what an
    // unknown-to-us kind gets. It must render, not crash or vanish — and the
    // TYPE accepts it with no cast, which is what keeps a consumer compiling.
    const entries: NarrativeEntry[] = [
      { type: 'stage', text: 'Stage 1: Seed.', depth: 0 },
      { type: 'teleport', text: 'something new happened', depth: 1 },
      { type: 'stage', text: 'Stage 2: Finish.', depth: 0 },
    ];
    const styled = render(<StoryNarrative entries={entries} revealedEntryCount={3} />);
    expect(screen.getByText(/something new happened/)).toBeTruthy();
    // A plain generic badge: it claims nothing about the entry. The `step`
    // badge would tell a screen reader it was a "Data operation".
    const badge = screen.getByLabelText('Narrative entry');
    expect(badge.textContent).toBe('◦');
    expect(screen.queryByLabelText('Data operation')).toBeNull();
    // It is not a step of the flowchart, so it takes no heading number.
    expect(screen.getByText(/2\. \[Stage/)).toBeTruthy();
    styled.unmount();
    // Unstyled mode passes the raw kind through as `data-type`, so a consumer
    // styling by selector can reach a kind this release never heard of.
    const { container } = render(
      <StoryNarrative entries={entries} revealedEntryCount={3} unstyled />,
    );
    expect(container.querySelector('[data-type="teleport"]')?.textContent).toBe('something new happened');
  });

  it('a kind named like an Object.prototype member gets the generic badge, not a phantom one', () => {
    // The kind is any string. A plain `map[type]` lookup would find
    // `Object.prototype.constructor` for "constructor" and render a badge
    // with no icon and no label.
    for (const type of ['constructor', 'toString', '__proto__', 'hasOwnProperty']) {
      const { unmount } = render(
        <StoryNarrative entries={[{ type, text: `${type} happened`, depth: 1 }]} revealedEntryCount={1} />,
      );
      expect(screen.getByLabelText('Narrative entry').textContent).toBe('◦');
      expect(screen.getByText(`${type} happened`)).toBeTruthy();
      unmount();
    }
  });

  it('accepts a newer engine’s entries without a cast — the consumer’s own assignment compiles', () => {
    // The exact shape that broke two apps when footprintjs added `attempt`: the
    // engine's entry type is a union of literals that includes a kind this
    // package had never listed. `npm test` typechecks this file, so a return
    // to a closed union fails here, at compile time, before any consumer.
    interface NewerEngineEntry {
      type: 'stage' | 'attempt' | 'deadline';
      text: string;
      depth: number;
      runtimeStageId?: string;
    }
    const fromEngine: NewerEngineEntry[] = [
      { type: 'stage', text: 'Stage 1: Charge.', depth: 0, runtimeStageId: 'charge#0' },
      { type: 'attempt', text: 'Attempt 1 of 2 at Charge succeeded in 3ms.', depth: 1 },
      { type: 'deadline', text: 'The run had 2s left.', depth: 1 },
    ];
    const accepted: NarrativeEntry[] = fromEngine;
    render(<StoryNarrative entries={accepted} revealedEntryCount={3} />);
    expect(screen.getByLabelText('Attempt')).toBeTruthy();
    expect(screen.getByLabelText('Narrative entry')).toBeTruthy();
    // The KNOWN list stays closed: only the entry's `type` is open.
    // @ts-expect-error — 'deadline' is not a kind this release knows
    const notKnown: KnownNarrativeEntryType = 'deadline';
    expect(notKnown).toBe('deadline');
  });

  // ── attempt (footprintjs >= 10.1) ──────────────────────────────────────
  // One line per attempt of a retried stage, replacing the `retry` line. It
  // is styled exactly as `retry` was: same glyph, same warning weight, nested
  // in its stage, no heading number — and its own label.

  it('renders each attempt as its own line, verbatim, with the Attempt badge', () => {
    const entries = [
      e('stage', 'Stage 1: Fetch rate.'),
      e('attempt', 'Attempt 1 of 3 at Fetch rate failed in 812ms (server: 503), retrying in 100ms.', { depth: 1 }),
      e('attempt', 'Attempt 2 of 3 at Fetch rate succeeded in 9ms.', { depth: 1 }),
    ];
    render(<StoryNarrative entries={entries} revealedEntryCount={3} />);
    const badges = screen.getAllByLabelText('Attempt');
    expect(badges).toHaveLength(2);
    expect(badges.every((badge) => badge.textContent === '↺')).toBe(true);
    expect(screen.getByText(/failed in 812ms \(server: 503\), retrying in 100ms\./)).toBeTruthy();
    expect(screen.getByText(/succeeded in 9ms\./)).toBeTruthy();
  });

  it('styles an attempt line exactly as a retry line', () => {
    const styleOf = (type: 'retry' | 'attempt') => {
      const { container, unmount } = render(
        <StoryNarrative entries={[e(type, 'one try', { depth: 1 })]} revealedEntryCount={1} />,
      );
      const row = container.querySelector('[data-fp="story-narrative"] > div');
      const spans = row ? Array.from(row.querySelectorAll('span')) : [];
      const style = {
        row: row?.getAttribute('style'),
        icon: spans[0]?.getAttribute('style'),
        iconText: spans[0]?.textContent,
        text: spans[1]?.getAttribute('style'),
      };
      unmount();
      return style;
    };
    expect(styleOf('attempt')).toEqual(styleOf('retry'));
    // Warning weight, not error weight: an attempt is not the stage's outcome.
    expect(styleOf('attempt').text).toContain('--fp-color-warning');
  });

  it('gives attempt lines no heading number — the next stage keeps its number', () => {
    const entries = [
      e('stage', 'Stage 1: Fetch rate.'),
      e('attempt', 'Attempt 1 of 2 at Fetch rate failed in 4ms (boom), retrying immediately.', { depth: 1 }),
      e('attempt', 'Attempt 2 of 2 at Fetch rate succeeded in 3ms.', { depth: 1 }),
      e('stage', 'Stage 2: Format the answer.'),
    ];
    const { container } = render(<StoryNarrative entries={entries} revealedEntryCount={4} unstyled />);
    // Every row, exactly: an attempt line numbered by mistake would read "2. …" and push the stage to "4.".
    const rows = Array.from(container.querySelectorAll('[data-fp="narrative-entry"]')).map((row) => [
      row.getAttribute('data-type'),
      row.textContent,
    ]);
    expect(rows).toEqual([
      ['stage', '1. [Stage: ] Fetch rate.'],
      ['attempt', 'Attempt 1 of 2 at Fetch rate failed in 4ms (boom), retrying immediately.'],
      ['attempt', 'Attempt 2 of 2 at Fetch rate succeeded in 3ms.'],
      ['stage', '2. [Stage: ] Format the answer.'],
    ]);
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
