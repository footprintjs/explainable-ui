/** @vitest-environment jsdom */
import * as React from 'react';
import { readFileSync } from 'node:fs';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ExplainableShell, type ExplainableShellProps } from '../../src/components/ExplainableShell';
import { createRecordingSource } from '../../src/progressiveRendering/source';
import type { RecordingSourceOptions } from '../../src/progressiveRendering/types';
import { FootprintTheme } from '../../src/theme';
import { toVisualizationSnapshots } from '../../src/adapters/fromRuntimeSnapshot';
const fixture = JSON.parse(readFileSync('test/fixtures/subflow-handoff/recording.json', 'utf8'));
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(r => { resolve = r; }); return { promise, resolve }; }
function chart(props: Parameters<NonNullable<ExplainableShellProps['renderFlowchart']>>[0]) {
  return <div data-testid="chart" data-scope={props.currentSubflowId ?? 'root'}>
    <button onClick={() => props.onNodeClick?.('child#2')}>Open first child</button>
    <span>{props.snapshots.map(s => s.runtimeStageId).join(',')}</span>
  </div>;
}
function setup(load: RecordingSourceOptions['loadSubflow'] = vi.fn(async () => ({ result: fixture.runtimeSnapshot.subflowResults['child#2'] })), extra: Partial<ExplainableShellProps> = {}) {
  const snapshot = structuredClone(fixture.runtimeSnapshot); snapshot.subflowResults = {};
  const source = createRecordingSource({ snapshot, graph: { nodes: [], edges: [] }, loadSubflow: load });
  const view = render(<ExplainableShell source={source} renderFlowchart={chart} {...extra} />);
  return { source, view, snapshot, load };
}
async function open() { fireEvent.click(screen.getByRole('button', { name: 'Open first child' })); }
function tick() { return [...screen.getByRole('toolbar').querySelectorAll('[data-fp="tt-tick"]')].findIndex(e => e.getAttribute('data-active') === 'true'); }

describe('lazy recorded scopes keep one navigation owner', () => {
  it('loads the exact visit, leaves root usable while pending, then navigates with recorded history', async () => {
    const job = deferred<any>(); const load = vi.fn((_request: any, _options: any) => job.promise); const { source, snapshot } = setup(load);
    const original = JSON.stringify(snapshot); await open();
    expect(screen.getByText('Loading this recorded subflow…')).toBeTruthy();
    expect(screen.getByTestId('chart').getAttribute('data-scope')).toBe('root');
    await waitFor(() => expect(load).toHaveBeenCalledTimes(1));
    expect(load.mock.calls[0][0].invocationPath).toEqual(['child#2']);
    await act(async () => job.resolve({ result: fixture.runtimeSnapshot.subflowResults['child#2'] }));
    await waitFor(() => expect(screen.getByTestId('chart').getAttribute('data-scope')).toBe('child'));
    expect(screen.queryByText('Loading this recorded subflow…')).toBeNull();
    expect(JSON.stringify(snapshot)).toBe(original);
    source.dispose();
  });
  it.each(['Cancel', 'Next stage'])('%s invalidates pending navigation even if the host ignores abort', async name => {
    const job = deferred<any>(); const { source, load } = setup(vi.fn(() => job.promise)); await open();
    await waitFor(() => expect(load).toHaveBeenCalled());
    fireEvent.click(name === 'Cancel' ? screen.getByRole('button', { name }) : screen.getByLabelText(name));
    await act(async () => job.resolve({ result: fixture.runtimeSnapshot.subflowResults['child#2'] }));
    await new Promise(r => setTimeout(r, 40));
    expect(screen.getByTestId('chart').getAttribute('data-scope')).toBe('root');
    expect(screen.queryByText('Loading this recorded subflow…')).toBeNull(); source.dispose();
  });
  it('shows local error and Retry, without replacing root or exposing an exception', async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error('private token')).mockResolvedValue({ result: fixture.runtimeSnapshot.subflowResults['child#2'] });
    const { source } = setup(load); await open();
    await screen.findByRole('button', { name: 'Retry' });
    expect(screen.getByRole('alert').textContent).not.toContain('private token');
    expect(screen.getByTestId('chart').getAttribute('data-scope')).toBe('root');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(screen.getByTestId('chart').getAttribute('data-scope')).toBe('child')); source.dispose();
  });
  it('uses JSON loading presentation and explicit props take precedence', async () => {
    const job = deferred<any>(); const layout = { columns: '1fr', areas: [['timeTravel'], ['flowchart'], ['details']] as const,
      rendering: { loadingIndicator: 'spinner' as const } };
    const { source, view } = setup(vi.fn(() => job.promise), { layout }); await open();
    expect(document.querySelector('[data-fp="loading-spinner"]')).toBeTruthy();
    view.rerender(<ExplainableShell source={source} renderFlowchart={chart} layout={layout} rendering={{ loadingIndicator: 'text' }} />);
    expect(document.querySelector('[data-fp="loading-spinner"]')).toBeNull();
    expect(screen.getByText('Loading this recorded subflow…')).toBeTruthy(); source.dispose();
  });
  it('forwards accessible loading/error state to a host theme adapter', async () => {
    const snapshot = structuredClone(fixture.runtimeSnapshot); snapshot.subflowResults = {};
    const source = createRecordingSource({ snapshot, graph: { nodes: [], edges: [] }, loadSubflow: () => new Promise(() => {}) });
    render(<FootprintTheme components={{ LoadStatus: ({ state, label, children, indicator, ...props }) => <section {...props} data-testid="host-status">{state}:{label}{children}</section> }}>
      <ExplainableShell source={source} renderFlowchart={chart} /></FootprintTheme>);
    await open(); expect(screen.getByTestId('host-status').getAttribute('aria-busy')).toBe('true');
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy(); source.dispose();
  });
  it('loads actual handoff evidence without leaving the active Backtrack question', async () => {
    const { source, snapshot } = setup();
    fireEvent.click(screen.getByText('Inspector')); fireEvent.click(screen.getByText('Data Trace'));
    const mountIndex = toVisualizationSnapshots(snapshot).findIndex(stage => stage.runtimeStageId === 'child#2');
    while (tick() < mountIndex) fireEvent.click(screen.getByLabelText('Next stage'));
    const chip = [...document.querySelectorAll('[data-fp="trace-any-chip"]')].find(e => e.textContent === 'renamed'); expect(chip).toBeTruthy(); fireEvent.click(chip!);
    expect(screen.queryByRole('button', { name: 'Follow child source middleOutput in child#2' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Load recorded subflow evidence: child#2' }));
    await screen.findByRole('button', { name: 'Follow child source middleOutput in child#2' });
    expect(screen.getByRole('toolbar').getAttribute('aria-label')).toBe('Tracing renamed');
    fireEvent.click(screen.getByRole('button', { name: 'Follow child source middleOutput in child#2' }));
    expect(screen.getByRole('toolbar').getAttribute('aria-label')).toBe('Tracing middleOutput');
    expect(snapshot.subflowResults).toEqual({}); source.dispose();
  });
});
