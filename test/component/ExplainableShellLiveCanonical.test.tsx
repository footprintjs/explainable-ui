/** @vitest-environment jsdom */
import * as React from 'react';
import { readFileSync } from 'node:fs';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, it } from 'vitest';
import { ExplainableShell, type ExplainableShellProps } from '../../src/components/ExplainableShell';
import { createRecordingSource } from '../../src/progressiveRendering';
import { buildTraceWalk } from '../../src/trace/traceWalk';
const native = JSON.parse(readFileSync('test/fixtures/backtrack/parallel35-canonical.snapshot.json', 'utf8'));
it('keeps native total35 → Items30 / Delivery5 evidence through a live cohort publication', async () => {
  const graph = { nodes: [], edges: [] };
  const source = createRecordingSource({ snapshot: native, graph });
  const chart: NonNullable<ExplainableShellProps['renderFlowchart']> = props => <div>
    <output data-testid="canonical-live-selected">{props.snapshots[props.selectedIndex]?.runtimeStageId}</output>
    <button onClick={() => props.onNodeClick?.(props.snapshots.find(stage => stage.stageName === 'Combine')!.runtimeStageId!)}>Inspect total stage</button>
  </div>;
  const view = render(<ExplainableShell source={source} renderFlowchart={chart} />);
  try {
    fireEvent.click(screen.getByRole('button', { name: 'Inspect total stage' }));
    const selected = screen.getByTestId('canonical-live-selected').textContent;
    fireEvent.click(screen.getByRole('button', { name: 'Backtrack write total' }));
    expect(screen.getByRole('toolbar').getAttribute('aria-label')).toBe('Tracing total');
    expect(document.querySelector('[data-fp="trace-walk-card"]')?.textContent).toContain('35');
    act(() => source.update({ snapshot: structuredClone(native), graph }));
    await waitFor(() => expect(source.getSnapshot().rootRevision).toBe(1));
    expect(screen.getByRole('toolbar').getAttribute('aria-label')).toBe('Tracing total');
    expect(screen.getByTestId('canonical-live-selected').textContent).toBe(selected);
    const current = source.getSnapshot().snapshot;
    const walk = buildTraceWalk(current.commitLog, current.executionTree, 'total', { scope: { invocationPath: [], nestedReadTracking: true } });
    expect(walk.stops.map(stop => stop.stageName)).toEqual(['Combine', 'Delivery', 'Items', 'LoadOrder']);
    expect(current.sharedState).toMatchObject({ total: 35, runs: { items: { amount: 30 }, delivery: { amount: 5 } } });
  } finally { view.unmount(); source.dispose(); }
});
