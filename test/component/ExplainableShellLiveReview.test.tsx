/** @vitest-environment jsdom */
import * as React from 'react';
import { readFileSync } from 'node:fs';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ExplainableShell, type ExplainableShellProps } from '../../src/components/ExplainableShell';
import { createRecordingSource, type LoadedSubflow, type RecordingSource, type SubflowLoadRequest } from '../../src/progressiveRendering';

const sources: RecordingSource[] = [];
afterEach(() => { sources.splice(0).forEach(source => source.dispose()); });

function stage(id: string, runtimeStageId: string, name: string, writes: Record<string, unknown> = {}) {
  return { id, runtimeStageId, name, isFork: false, isDecider: false, stageWrites: writes, stageReads: {}, logs: {}, errors: {}, metrics: {}, evals: {} };
}
function commit(stageId: string, runtimeStageId: string, name: string, values: Record<string, unknown>, idx: number) {
  return { idx, stageId, runtimeStageId, stage: name, overwrite: values, updates: {},
    trace: Object.keys(values).map(path => ({ path, verb: 'set', readKeys: [] })) };
}
function initial() {
  return { runId: 'parallel-live-review', sharedState: { a: 1, b: 2 },
    executionTree: { ...stage('fork', 'fork#0', 'Fork'), isFork: true, children: [
      stage('branchA/First', 'branchA/First#1', 'First branch', { a: 1 }),
      stage('branchB/Done', 'branchB/Done#2', 'Second branch', { b: 2 }),
    ] },
    commitLog: [commit('fork', 'fork#0', 'Fork', {}, 0), commit('branchA/First', 'branchA/First#1', 'First branch', { a: 1 }, 1),
      commit('branchB/Done', 'branchB/Done#2', 'Second branch', { b: 2 }, 2)],
  };
}
function continuation(root: ReturnType<typeof initial>) {
  return { ...structuredClone(root), sharedState: { a: 1, b: 2, c: 3 }, executionTree: {
    ...structuredClone(root.executionTree), children: [
      { ...structuredClone(root.executionTree.children[0]), next: stage('branchA/Later', 'branchA/Later#3', 'Later first-branch step', { c: 3 }) },
      structuredClone(root.executionTree.children[1]),
    ],
  }, commitLog: [...structuredClone(root.commitLog), commit('branchA/Later', 'branchA/Later#3', 'Later first-branch step', { c: 3 }, 3)] };
}
function chart(props: Parameters<NonNullable<ExplainableShellProps['renderFlowchart']>>[0]) {
  return <div data-testid="live-review-chart">
    <output data-testid="live-review-selected">{props.snapshots[props.selectedIndex]?.runtimeStageId}</output>
    <div data-testid="live-review-stages">{props.snapshots.map(stage => stage.runtimeStageId).join(',')}</div>
    <button onClick={() => props.onNodeClick?.('branchB/Done#2')}>Inspect completed second branch</button>
  </div>;
}
function setup() {
  const root = initial(), graph = { nodes: [], edges: [] };
  const source = createRecordingSource({ snapshot: root, graph }); sources.push(source);
  render(<ExplainableShell source={source} renderFlowchart={chart} />);
  fireEvent.click(screen.getByRole('button', { name: 'Inspect completed second branch' }));
  expect(screen.getByTestId('live-review-selected').textContent).toBe('branchB/Done#2');
  return { root, graph, source };
}

describe('independent cumulative live-rendering regressions', () => {
  it('keeps a requested exact drill alive when live growth reindexes the same selected mount', async () => {
    const native = JSON.parse(readFileSync('test/fixtures/subflow-handoff/recording.json', 'utf8')).runtimeSnapshot;
    const base = initial();
    const root = { ...base, executionTree: { ...base.executionTree, children: [base.executionTree.children[0],
      { ...stage('child', 'child#2', 'Child', { b: 2 }), subflowId: 'child' }] },
      commitLog: [...base.commitLog.slice(0, 2), commit('child', 'child#2', 'Child', { b: 2 }, 2)] };
    let deliver!: (value: LoadedSubflow) => void;
    let signal: AbortSignal | undefined;
    const load = vi.fn((_request: SubflowLoadRequest, options: { signal: AbortSignal }) => {
      signal = options.signal;
      return new Promise<LoadedSubflow>(resolve => { deliver = resolve; });
    });
    const graph = { nodes: [], edges: [] };
    const source = createRecordingSource({ snapshot: root, graph, loadSubflow: load }); sources.push(source);
    const renderChart: NonNullable<ExplainableShellProps['renderFlowchart']> = props => <div data-testid="pending-live-chart" data-scope={props.currentSubflowId ?? 'root'}>
      <output data-testid="pending-live-selected">{props.snapshots[props.selectedIndex]?.runtimeStageId}</output>
      <div data-testid="pending-live-stages">{props.snapshots.map(stage => stage.runtimeStageId).join(',')}</div>
      <button onClick={() => props.onNodeClick?.(2)}>Select mount without opening</button>
      <button onClick={() => props.onNodeClick?.('child#2')}>Open requested exact child</button>
    </div>;
    render(<ExplainableShell source={source} renderFlowchart={renderChart} />);
    fireEvent.click(screen.getByRole('button', { name: 'Select mount without opening' }));
    expect(screen.getByTestId('pending-live-selected').textContent).toBe('child#2');
    fireEvent.click(screen.getByRole('button', { name: 'Open requested exact child' }));
    await waitFor(() => expect(load).toHaveBeenCalledTimes(1));
    act(() => source.update({ snapshot: continuation(root), graph }));
    await waitFor(() => expect(screen.getByTestId('pending-live-stages').textContent).toContain('branchA/Later#3'));
    expect(screen.getByTestId('pending-live-selected').textContent).toBe('child#2');
    expect(signal?.aborted).toBe(false);
    expect(screen.getByText('Loading this recorded subflow…')).toBeTruthy();
    await act(async () => deliver({ result: native.subflowResults['child#2'] }));
    await waitFor(() => expect(screen.getByTestId('pending-live-chart').getAttribute('data-scope')).toBe('child'));
    expect(screen.getByTestId('pending-live-selected').textContent).toBe('child/prepare#3');
    expect(load.mock.calls[0][0].invocationPath).toEqual(['child#2']);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('keeps the selected runtime stage when an earlier parallel branch grows', async () => {
    const { root, graph, source } = setup();
    const original = JSON.stringify(root);
    act(() => source.update({ snapshot: continuation(root), graph }));
    await waitFor(() => expect(screen.getByTestId('live-review-stages').textContent).toContain('branchA/Later#3'));
    expect(screen.getByTestId('live-review-selected').textContent).toBe('branchB/Done#2');
    expect(screen.getAllByTestId('live-review-chart')).toHaveLength(1);
    expect(JSON.stringify(root)).toBe(original);
  });

  it('retains a Backtrack question and its cursor while another parallel branch grows', async () => {
    const { root, graph, source } = setup();
    fireEvent.click(screen.getByText('Inspector'));
    fireEvent.click(screen.getByText('Data Trace'));
    const chip = [...document.querySelectorAll('[data-fp="trace-any-chip"]')].find(element => element.textContent === 'b');
    expect(chip).toBeTruthy(); fireEvent.click(chip!);
    expect(screen.getByRole('toolbar').getAttribute('aria-label')).toBe('Tracing b');
    act(() => source.update({ snapshot: continuation(root), graph }));
    await waitFor(() => expect(screen.getByTestId('live-review-stages').textContent).toContain('branchA/Later#3'));
    expect(screen.getByRole('toolbar').getAttribute('aria-label')).toBe('Tracing b');
    expect(screen.getByTestId('live-review-selected').textContent).toBe('branchB/Done#2');
    expect(document.querySelector('[data-fp="trace-walk-card"]')?.textContent).toContain('b');
  });
});
