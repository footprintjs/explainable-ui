/** @vitest-environment jsdom */
/**
 * The four newer inspector components take the same chrome props as their
 * older siblings: `size`, `unstyled`, `className`, `style`.
 *
 * They shipped without them, so a consumer who had themed a whole screen
 * through `unstyled` hit four panels that ignored the word and painted
 * anyway — the inconsistency an audit found by reading the props tables
 * side by side. The props are ADDITIVE and default-off: with none passed,
 * the render is what it always was, which is what the "default is
 * unchanged" cases below pin.
 */
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';

import { InspectorPanel } from '../../src/components/InspectorPanel/InspectorPanel';
import { DataTracePanel } from '../../src/components/DataTracePanel/DataTracePanel';
import { TraceWalkCard } from '../../src/components/DataTracePanel/TraceWalkCard';
import { InsightPanel } from '../../src/components/InsightPanel/InsightPanel';
import type { StageSnapshot } from '../../src/types';
import type { TraceWalk } from '../../src/components/ExplainableShell/_internal/traceWalk';

const SNAPSHOTS: StageSnapshot[] = [
  {
    stageName: 'seed',
    stageLabel: 'Seed',
    runtimeStageId: 'seed#0',
    memory: { total: 42 },
    narrative: 'Seed ran.',
    startMs: 0,
    durationMs: 1,
  },
];

const WALK: TraceWalk = {
  key: 'total',
  stops: [
    {
      runtimeStageId: 'seed#0',
      stageId: 'seed',
      stageName: 'Seed',
      commitIdx: 0,
      contributedKeys: ['total'],
      keysWritten: ['total'],
      ingredients: [],
      depth: 0,
      loopPass: 0,
    },
  ],
  missing: null,
  inputTermini: [],
  readsAvailable: true,
  truncated: false,
};

/** Every case renders the same four panels — only the chrome props differ. */
const PANELS = [
  {
    name: 'InspectorPanel',
    fp: 'inspector-panel',
    render: (chrome: Record<string, unknown>) => (
      <InspectorPanel snapshots={SNAPSHOTS} selectedIndex={0} dataTraceFrames={[]} {...chrome} />
    ),
  },
  {
    name: 'DataTracePanel',
    fp: 'data-trace-panel',
    render: (chrome: Record<string, unknown>) => <DataTracePanel frames={[]} {...chrome} />,
  },
  {
    name: 'TraceWalkCard',
    fp: 'trace-walk-card',
    render: (chrome: Record<string, unknown>) => (
      <TraceWalkCard walk={WALK} cursorRuntimeStageId={null} stepNumberOf={() => 1} {...chrome} />
    ),
  },
  {
    name: 'InsightPanel',
    fp: 'insight-panel',
    render: (chrome: Record<string, unknown>) => (
      <InsightPanel
        insights={[{ id: 'story', name: 'Story', render: () => <div>the story</div> }]}
        mode="tabs"
        {...chrome}
      />
    ),
  },
] as const;

describe('inspector components accept the shared chrome props', () => {
  for (const panel of PANELS) {
    describe(panel.name, () => {
      it('paints by default — passing nothing is exactly what it was', () => {
        const { container } = render(panel.render({}));
        const root = container.querySelector(`[data-fp="${panel.fp}"]`);
        expect(root, 'the root must be findable by its data-fp name').toBeTruthy();
        expect(root!.getAttribute('style')).toBeTruthy();
      });

      it('unstyled strips the root\'s own styling but keeps the content', () => {
        const { container } = render(panel.render({ unstyled: true }));
        const root = container.querySelector(`[data-fp="${panel.fp}"]`);
        expect(root).toBeTruthy();
        // No inline style at all — the caller's CSS is in charge now.
        expect(root!.getAttribute('style')).toBeFalsy();
        expect(root!.textContent?.length ?? 0).toBeGreaterThan(0);
      });

      it('className lands on the root, and style merges over the defaults', () => {
        const { container } = render(
          panel.render({ className: 'mine', style: { outline: '2px solid red' } }),
        );
        const root = container.querySelector(`[data-fp="${panel.fp}"]`);
        expect(root!.classList.contains('mine')).toBe(true);
        expect(root!.getAttribute('style')).toContain('outline');
      });

      it('size changes the type scale', () => {
        const { container: a } = render(panel.render({ size: 'compact' }));
        const { container: b } = render(panel.render({ size: 'detailed' }));
        // Compare the whole subtree, not just the root's own style: two of
        // these four panels carry no font-size on the root at all (the
        // scale lands on the tab buttons inside), and "size did nothing"
        // is the failure worth catching either way.
        const markupOf = (c: HTMLElement) =>
          c.querySelector(`[data-fp="${panel.fp}"]`)!.outerHTML;
        expect(markupOf(a)).not.toEqual(markupOf(b));
      });
    });
  }
});
