/** @vitest-environment jsdom */
/**
 * Component render tests for NarrativePanel.
 *
 * Verifies the panel renders StoryNarrative (structured) or
 * NarrativeTrace (plain) based on input, and that progressive
 * reveal syncs to selectedIndex.
 */
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { NarrativePanel } from '../../src/components/NarrativePanel/NarrativePanel';
import type { NarrativeEntry, StageSnapshot } from '../../src/types';

function snap(stageLabel: string, stageName?: string, narrative?: string): StageSnapshot {
  return {
    stageLabel,
    stageName: stageName ?? stageLabel,
    narrative: narrative ?? `Stage: ${stageLabel}`,
    memory: {},
    startMs: 0,
    durationMs: 0,
  };
}

function e(type: NarrativeEntry['type'], text: string, stageId?: string): NarrativeEntry {
  return { type, text, depth: 0, stageId };
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
    // `narrative` is NOT a NarrativePanelProps field (it never was — this test
    // used to pass a phantom prop that React silently dropped, so the
    // assertion below only ever proved the fallback marker rendered, never
    // that the given text drove it). The real source for the fallback path
    // is each StageSnapshot's own `narrative` field, joined internally.
    const snapshots = [snap('parse', undefined, 'Stage 1: Parse request.')];
    const { container, getByText } = render(
      <NarrativePanel
        snapshots={snapshots}
        selectedIndex={0}
      />,
    );
    expect(container.querySelector('[data-fp="narrative-trace"]')).toBeTruthy();
    expect(getByText('Stage 1: Parse request.')).toBeTruthy();
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
    expect(screen.getByText(/Recorded entries in Root invocation/)).toBeTruthy();
    expect(screen.queryByText(/and why/)).toBeNull();
  });

  it('unstyled mode keeps the same scope and actions without built-in styles', () => {
    const snapshots = [snap('parse')];
    const view = render(
      <NarrativePanel
        snapshots={snapshots}
        selectedIndex={0}
        narrativeEntries={[e('stage', 'Stage 1: Parse.', 'parse')]}
        unstyled
      />,
    );
    expect(screen.getByText(/Recorded entries in Root invocation/)).toBeTruthy();
    expect(screen.getByRole('checkbox', { name: 'Follow cursor' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Copy recorded log' })).toBeTruthy();
    expect(view.container.querySelectorAll('[style]')).toHaveLength(0);
  });

  it('renders empty state without crashing', () => {
    const { container } = render(
      <NarrativePanel snapshots={[]} selectedIndex={0} />,
    );
    expect(container.querySelector('[data-fp="narrative-panel"]')).toBeTruthy();
  });

  it('reveals only the exact snapshot prefix when later snapshots have more plain lines', () => {
    const snapshots = [snap('A', undefined, 'First only'), snap('B', undefined, 'Future one\nFuture two\nFuture three\nFuture four\nFuture five\nFuture six\nFuture seven\nFuture eight\nFuture nine')];
    const view = render(<NarrativePanel snapshots={snapshots} selectedIndex={0} />);
    expect(screen.getByText('First only')).toBeTruthy();
    expect(screen.queryByText('Future one')).toBeNull();
    expect(screen.queryByText('Future nine')).toBeNull();
    view.rerender(<NarrativePanel snapshots={snapshots} selectedIndex={1} />);
    expect(screen.getByText('Future nine')).toBeTruthy();
  });

  it('does not parse apparent Stage headers to invent fallback visit boundaries', () => {
    render(<NarrativePanel snapshots={[snap('A', undefined, 'Stage 7: One\nStage 99: Still the same snapshot'), snap('B', undefined, 'Future')]} selectedIndex={0} />);
    expect(screen.getByText('Stage 99: Still the same snapshot')).toBeTruthy();
    expect(screen.queryByText('Future')).toBeNull();
  });

  it('keeps exact structured repeated-name visits separate and hides future text', () => {
    const snapshots = [{ ...snap('Same'), runtimeStageId: 'same#1' }, { ...snap('Same'), runtimeStageId: 'same#5' }];
    const entries = [{ ...e('stage', 'First exact visit'), runtimeStageId: 'same#1' }, { ...e('stage', 'Future exact visit'), runtimeStageId: 'same#5' }];
    const view = render(<NarrativePanel snapshots={snapshots} selectedIndex={0} narrativeEntries={entries} presentation="visits" />);
    expect(screen.getByText('First exact visit')).toBeTruthy();
    expect(screen.queryByText('Future exact visit')).toBeNull();
    expect(view.container.querySelector('[data-current="true"]')?.getAttribute('data-runtime-stage-id')).toBe('same#1');
  });

  it('does not expose a later visit merely because its narrative arrived earlier', () => {
    const snapshots = [{ ...snap('A'), runtimeStageId: 'a#0' }, { ...snap('B'), runtimeStageId: 'b#1' }];
    const entries = [{ ...e('stage', 'B arrived first'), runtimeStageId: 'b#1' }, { ...e('stage', 'A visible now'), runtimeStageId: 'a#0' }];
    const view = render(<NarrativePanel snapshots={snapshots} selectedIndex={0} narrativeEntries={entries} presentation="visits" />);
    expect(screen.getByText('A visible now')).toBeTruthy();
    expect(screen.queryByText('B arrived first')).toBeNull();
    expect(screen.getByText('1 more entry ahead...')).toBeTruthy();
    view.rerender(<NarrativePanel snapshots={snapshots} selectedIndex={1} narrativeEntries={entries} presentation="visits" />);
    const texts = [...view.container.querySelectorAll('[data-fp="narrative-text"]')].map(node => node.textContent);
    expect(texts).toEqual(['B arrived first', 'A visible now']);
  });

  it.each(['missing', 'unmatched', 'duplicate'])('shows an explicit unsynchronized log for %s exact ids', mode => {
    const snapshots = [{ ...snap('A'), runtimeStageId: 'a#0' }];
    if (mode === 'duplicate') snapshots.push({ ...snap('Again'), runtimeStageId: 'a#0' });
    const entries = [{ ...e('stage', 'Recorded unsynchronized event'), runtimeStageId: mode === 'missing' ? undefined : mode === 'unmatched' ? 'other#0' : 'a#0' }];
    const view = render(<NarrativePanel snapshots={snapshots} selectedIndex={0} narrativeEntries={entries} presentation="visits" />);
    expect(screen.getByRole('status').textContent).toContain('not synchronized to the selected step');
    expect(screen.getByText('Recorded unsynchronized event')).toBeTruthy();
    expect(view.container.querySelector('[data-fp="narrative-visit"]')).toBeNull();
    expect(view.container.querySelector('[data-current="true"]')).toBeNull();
  });

  it('keeps current child entries and boundaries separate from root, sibling and nested invocation contents', () => {
    const snapshots = [{ ...snap('Child'), runtimeStageId: 'child/step#2' }, { ...snap('Mount'), runtimeStageId: 'child/mount#3' }];
    const entries: NarrativeEntry[] = [
      { ...e('stage', 'Root hidden'), runtimeStageId: 'root#0' },
      { ...e('stage', 'Own child'), runtimeStageId: 'child/step#2', subflowId: 'child' },
      { ...e('stage', 'Sibling hidden'), runtimeStageId: 'sibling/step#8', subflowId: 'sibling' },
      { ...e('subflow', 'Entering nested'), runtimeStageId: 'child/mount#3', subflowId: 'child/nested', direction: 'entry' },
      { ...e('stage', 'Nested body hidden'), runtimeStageId: 'child/nested/step#4', subflowId: 'child/nested' },
      { ...e('subflow', 'Exiting nested'), runtimeStageId: 'child/mount#3', subflowId: 'child/nested', direction: 'exit' },
    ];
    render(<NarrativePanel snapshots={snapshots} selectedIndex={1} narrativeEntries={entries} scopeSubflowId="child" presentation="visits" />);
    expect(screen.queryByRole('status')).toBeNull();
    for (const text of ['Own child', 'Entering nested', 'Exiting nested']) expect(screen.getByText(text)).toBeTruthy();
    for (const text of ['Root hidden', 'Sibling hidden', 'Nested body hidden']) expect(screen.queryByText(text)).toBeNull();
  });

  it('does not scroll while reading and follows only after the user opts in', () => {
    const scroll = vi.fn();
    const previous = HTMLElement.prototype.scrollIntoView;
    HTMLElement.prototype.scrollIntoView = scroll;
    try {
      const snapshots = [{ ...snap('A'), runtimeStageId: 'a#0' }, { ...snap('B'), runtimeStageId: 'b#1' }];
      const entries = [{ ...e('stage', 'A event'), runtimeStageId: 'a#0' }, { ...e('stage', 'B event'), runtimeStageId: 'b#1' }];
      const view = render(<NarrativePanel snapshots={snapshots} selectedIndex={0} narrativeEntries={entries} />);
      expect(scroll).not.toHaveBeenCalled();
      view.rerender(<NarrativePanel snapshots={snapshots} selectedIndex={1} narrativeEntries={entries} />);
      expect(scroll).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole('checkbox', { name: 'Follow cursor' }));
      expect(scroll).toHaveBeenCalledWith({ behavior: 'auto', block: 'nearest' });
      scroll.mockClear();
      fireEvent.click(screen.getByRole('checkbox', { name: 'Follow cursor' }));
      view.rerender(<NarrativePanel snapshots={snapshots} selectedIndex={0} narrativeEntries={entries} />);
      expect(scroll).not.toHaveBeenCalled();
    } finally { HTMLElement.prototype.scrollIntoView = previous; }
  });

  it('does not scroll under reduced motion even with Follow cursor enabled', () => {
    const scroll = vi.fn(), previousScroll = HTMLElement.prototype.scrollIntoView, previousMedia = window.matchMedia;
    HTMLElement.prototype.scrollIntoView = scroll;
    window.matchMedia = vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() });
    try {
      render(<NarrativePanel snapshots={[{ ...snap('A'), runtimeStageId: 'a#0' }]} selectedIndex={0}
        narrativeEntries={[{ ...e('stage', 'Recorded entry'), runtimeStageId: 'a#0' }]} defaultFollowCursor />);
      expect((screen.getByRole('checkbox', { name: 'Follow cursor' }) as HTMLInputElement).checked).toBe(true);
      expect(scroll).not.toHaveBeenCalled();
    } finally { HTMLElement.prototype.scrollIntoView = previousScroll; window.matchMedia = previousMedia; }
  });

  it.each([false, true])('copies a clearly labeled full debug bundle without submitting a consumer form (unstyled=%s)', async unstyled => {
    const copy = vi.fn().mockResolvedValue(undefined), submit = vi.fn(event => event.preventDefault());
    Object.assign(navigator, { clipboard: { writeText: copy } });
    const entries = [{ ...e('stage', 'Visible recorded text'), runtimeStageId: 'a#0' }, { ...e('stage', 'Future recorded text'), runtimeStageId: 'b#1' }];
    const snapshots = [{ ...snap('A'), runtimeStageId: 'a#0' }, { ...snap('B'), runtimeStageId: 'b#1' }];
    render(<form onSubmit={submit}><NarrativePanel snapshots={snapshots} selectedIndex={0} narrativeEntries={entries}
      runtimeSnapshot={{ sharedState: { secretResult: 42 }, commitLog: [{ runtimeStageId: 'a#0' }] }} unstyled={unstyled} /></form>);
    const button = screen.getByRole('button', { name: 'Copy full run debug bundle' });
    expect(button.getAttribute('type')).toBe('button');
    expect(screen.getByText(/beyond this log's scope/)).toBeTruthy();
    expect(screen.queryByText('Future recorded text')).toBeNull();
    fireEvent.click(button);
    expect(copy).toHaveBeenCalledOnce();
    const exported = copy.mock.calls[0][0] as string;
    expect(exported).toContain('Future recorded text');
    expect(exported).toContain('Final Shared State');
    expect(exported).toContain('including root state and other invocations');
    expect(submit).not.toHaveBeenCalled();
    expect(await screen.findByRole('button', { name: 'Copied!' })).toBeTruthy();
  });
});
