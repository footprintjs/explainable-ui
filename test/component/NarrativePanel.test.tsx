/** @vitest-environment jsdom */
/**
 * Component render tests for NarrativePanel.
 *
 * Verifies the panel renders StoryNarrative (structured) or
 * NarrativeTrace (plain) based on input, and that progressive
 * reveal syncs to selectedIndex.
 */
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NarrativePanel } from '../../src/components/NarrativePanel/NarrativePanel';
import type { NarrativeEntry, StageSnapshot } from '../../src/types';

function snap(stageLabel: string, stageName?: string): StageSnapshot {
  return {
    stageLabel,
    stageName: stageName ?? stageLabel,
    narrative: `Stage: ${stageLabel}`,
    state: {},
  } as StageSnapshot;
}

function e(type: NarrativeEntry['type'], text: string, stageId?: string): NarrativeEntry {
  return { type, text, depth: 0, stageId } as NarrativeEntry & { stageId?: string };
}

describe('NarrativePanel component', () => {
  it('renders data-fp="narrative-panel" marker', () => {
    const { container } = render(
      <NarrativePanel snapshots={[]} selectedIndex={0} />,
    );
    expect(container.querySelector('[data-fp="narrative-panel"]')).toBeTruthy();
  });

  it('renders StoryNarrative when narrativeEntries are provided', () => {
    const snapshots = [snap('parse')];
    const entries = [e('stage', 'Stage 1: Parse request.', 'parse')];
    const { container } = render(
      <NarrativePanel
        snapshots={snapshots}
        selectedIndex={0}
        narrativeEntries={entries}
      />,
    );
    expect(container.querySelector('[data-fp="story-narrative"]')).toBeTruthy();
  });

  it('renders NarrativeTrace fallback when no narrativeEntries', () => {
    const snapshots = [snap('parse')];
    const { container } = render(
      <NarrativePanel
        snapshots={snapshots}
        selectedIndex={0}
        narrative={['Stage 1: Parse request.']}
      />,
    );
    expect(container.querySelector('[data-fp="narrative-trace"]')).toBeTruthy();
  });

  it('renders intro text in styled mode', () => {
    const snapshots = [snap('parse')];
    render(
      <NarrativePanel
        snapshots={snapshots}
        selectedIndex={0}
        narrativeEntries={[e('stage', 'Stage 1: Parse.', 'parse')]}
      />,
    );
    expect(screen.getByText(/What happened at each stage/)).toBeTruthy();
  });

  it('unstyled mode skips intro text', () => {
    const snapshots = [snap('parse')];
    render(
      <NarrativePanel
        snapshots={snapshots}
        selectedIndex={0}
        narrativeEntries={[e('stage', 'Stage 1: Parse.', 'parse')]}
        unstyled
      />,
    );
    expect(screen.queryByText(/What happened at each stage/)).toBeNull();
  });

  it('renders empty state without crashing', () => {
    const { container } = render(
      <NarrativePanel snapshots={[]} selectedIndex={0} />,
    );
    expect(container.querySelector('[data-fp="narrative-panel"]')).toBeTruthy();
  });
});
