/** @vitest-environment jsdom */
import * as React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { it, expect } from 'vitest';
import { ExplainableShell } from '../../src/components/ExplainableShell';
import { createRecordingSource } from '../../src/progressiveRendering';
const captured = JSON.parse(readFileSync('test/fixtures/backtrack/parallel35-canonical.snapshot.json', 'utf8'));
it('waits honestly on an engine13 pre-run stub, then accepts its first real recording', async () => {
  const before = { runId: '', sharedState: {}, commitLog: [], executionTree: { name: 'Root', runtimeStageId: undefined, stageReads: {}, stageWrites: {}, logs: {}, errors: {}, metrics: {}, evals: {} } };
  const graph = { nodes: [], edges: [] }, source = createRecordingSource({ snapshot: before, graph });
  const view = render(<ExplainableShell source={source} renderFlowchart={({ snapshots }) => <output data-testid="started-stages">{snapshots.map(stage => stage.runtimeStageId).join(',')}</output>}
    layout={{ columns: '1fr', areas: [['timeTravel'], ['flowchart']], rendering: { loadingIndicator: 'spinner' } }} />);
  try {
    expect(screen.getByText('Waiting for recorded execution…')).toBeTruthy();
    expect(document.querySelector('[data-fp="loading-spinner"]')).toBeTruthy();
    expect(screen.queryByRole('toolbar')).toBeNull();
    expect(screen.queryByTestId('started-stages')).toBeNull();
    act(() => source.update({ snapshot: captured, graph }));
    await waitFor(() => expect(screen.getByTestId('started-stages').textContent).toContain(captured.commitLog.at(-1).runtimeStageId));
    expect(screen.queryByText('Waiting for recorded execution…')).toBeNull();
    expect(screen.getByRole('toolbar')).toBeTruthy();
  } finally { view.unmount(); source.dispose(); }
});
