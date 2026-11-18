/** @vitest-environment jsdom */
import * as React from 'react';
import { readFileSync } from 'node:fs';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ExplainableShell } from '../../src/components/ExplainableShell';
import { createRecordingSource } from '../../src/progressiveRendering';
import { toVisualizationSnapshots } from '../../src/adapters/fromRuntimeSnapshot';
import type { RecordingSource, LoadedSubflow, SubflowLoadRequest } from '../../src/progressiveRendering';
import type { TraceGraph } from '../../src/components/FlowchartView/traceStructureRecorder';

const observations = vi.hoisted(() => ({ chart: null as any }));
vi.mock('../../src/components/FlowchartView/TracedFlow', () => ({
  TracedFlow(props: any) {
    observations.chart = props;
    return <div data-testid="review-chart" data-scope={props.currentSubflowId ?? 'root'}>
      <button onClick={() => props.onNodeClick?.('child#2')}>Open first recorded child</button>
      {props.graph.nodes.filter((node: any) => node.data.isSubflow).map((node: any) =>
        <button key={node.id} onClick={() => props.onNodeClick?.(node.id)}>Open graph {node.id}</button>)}
    </div>;
  },
}));

const fixture = JSON.parse(readFileSync('test/fixtures/subflow-handoff/recording.json', 'utf8'));
const sources: RecordingSource[] = [];
afterEach(() => { sources.splice(0).forEach(source => source.dispose()); vi.unstubAllGlobals(); });

function graphNode(id: string, subflowOf?: string, isSubflow = false): TraceGraph['nodes'][number] {
  return { id, type: 'stage', position: { x: 0, y: 0 }, data: { label: id, isSubflow,
    isDecider: false, isFork: false, isStreaming: false, prevIds: [], nextIds: [],
    ...(subflowOf ? { subflowOf } : {}), ...(isSubflow ? { subflowId: id } : {}) } };
}
const rootGraph: TraceGraph = { nodes: [graphNode('child', undefined, true)], edges: [] };
function rootSnapshot(recording = fixture) {
  const snapshot = structuredClone(recording.runtimeSnapshot);
  snapshot.subflowResults = {};
  return snapshot;
}
function child(recording = fixture): LoadedSubflow {
  return { result: recording.runtimeSnapshot.subflowResults['child#2'], graph: {
    nodes: [graphNode('child/prepare', 'child'), graphNode('child/inner', 'child', true)], edges: [],
  } };
}
function sourceFor(snapshot: ReturnType<typeof rootSnapshot>, loadSubflow: (request: SubflowLoadRequest, options: { signal: AbortSignal }) => LoadedSubflow | Promise<LoadedSubflow>) {
  const source = createRecordingSource({ snapshot, graph: rootGraph, loadSubflow });
  sources.push(source);
  return source;
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}
function scope() { return screen.getByTestId('review-chart').getAttribute('data-scope'); }
function tick() {
  return [...screen.getByRole('toolbar').querySelectorAll('[data-fp="tt-tick"]')]
    .findIndex(element => element.getAttribute('data-active') === 'true');
}

describe('independent lazy-rendering navigation regressions', () => {
  it('does not turn an ordinary recorded stage into a lazy subflow mount', async () => {
    const invented = JSON.parse(JSON.stringify(fixture.runtimeSnapshot.subflowResults['child#2'])
      .split('child#2').join('use#6').split('child').join('use'));
    const load = vi.fn(() => ({ result: invented }));
    const source = sourceFor(rootSnapshot(), load);
    await expect(source.load({ invocationPath: ['use#6'], mountRuntimeStageId: 'use#6', subflowId: 'use' })).rejects.toThrow();
    expect(load).not.toHaveBeenCalled();
    expect(source.getSnapshot().snapshot.subflowResults?.['use#6']).toBeUndefined();
  });

  it('keeps one background request alive through its own pending and ready notifications', async () => {
    const idle: IdleRequestCallback[] = [];
    vi.stubGlobal('requestIdleCallback', vi.fn((callback: IdleRequestCallback) => { idle.push(callback); return idle.length; }));
    vi.stubGlobal('cancelIdleCallback', vi.fn());
    const delivery = deferred<LoadedSubflow>();
    let requestSignal: AbortSignal | undefined;
    const load = vi.fn((_request: SubflowLoadRequest, options: { signal: AbortSignal }) => {
      requestSignal = options.signal;
      return delivery.promise;
    });
    const source = sourceFor(rootSnapshot(), load);
    render(<ExplainableShell source={source} rendering={{ prefetch: 'idle' }} />);
    expect(idle).toHaveLength(1);
    expect(load).not.toHaveBeenCalled();
    act(() => idle[0]({ didTimeout: false, timeRemaining: () => 20 }));
    await waitFor(() => expect(load).toHaveBeenCalledTimes(1));
    expect(requestSignal?.aborted).toBe(false);
    await act(async () => delivery.resolve(child()));
    await waitFor(() => expect(source.getSnapshot().scopes.get(source.getKey(['child#2']))?.status).toBe('ready'));
    expect(requestSignal?.aborted).toBe(false);
    expect(load).toHaveBeenCalledTimes(1);
    expect(idle).toHaveLength(1);
    expect(scope()).toBe('root');
    expect(screen.queryByText('Loading this recorded subflow…')).toBeNull();
  });

  it('resets a drilled Backtrack session when the source is replaced around the same root object', async () => {
    const snapshot = rootSnapshot();
    const first = sourceFor(snapshot, () => child());
    await first.load({ invocationPath: ['child#2'], mountRuntimeStageId: 'child#2', subflowId: 'child' });
    const secondLoad = vi.fn(() => child());
    const second = sourceFor(snapshot, secondLoad);
    expect(first.rootSnapshot).toEqual(second.rootSnapshot);
    expect(first.rootSnapshot).not.toBe(snapshot);
    expect(second.rootSnapshot).not.toBe(snapshot);
    const view = render(<ExplainableShell source={first} />);
    fireEvent.click(screen.getByText('Inspector'));
    fireEvent.click(screen.getByText('Data Trace'));
    const mountIndex = toVisualizationSnapshots(snapshot).findIndex(stage => stage.runtimeStageId === 'child#2');
    while (tick() < mountIndex) fireEvent.click(screen.getByLabelText('Next stage'));
    const chip = [...document.querySelectorAll('[data-fp="trace-any-chip"]')].find(element => element.textContent === 'renamed');
    expect(chip).toBeTruthy();
    fireEvent.click(chip!);
    fireEvent.click(await screen.findByRole('button', { name: 'Follow child source middleOutput in child#2' }));
    expect(scope()).toBe('child');
    expect(screen.getByRole('toolbar').getAttribute('aria-label')).toBe('Tracing middleOutput');
    view.rerender(<ExplainableShell source={second} />);
    await waitFor(() => expect(scope()).toBe('root'));
    expect(screen.getByRole('toolbar').getAttribute('aria-label')).not.toMatch(/^Tracing /);
    expect(screen.queryByText('Why middleOutput?')).toBeNull();
    expect(secondLoad).not.toHaveBeenCalled();
    expect(second.getSnapshot().scopes.size).toBe(0);
  });

  it('uses recorded graph ancestry when an inner mount path contains an ordinary grouping segment', async () => {
    // Relabel the native fixture consistently; "group" is not a subflow mount.
    const recording = JSON.parse(JSON.stringify(fixture).split('child/inner').join('child/group/inner'));
    const load = vi.fn((request: SubflowLoadRequest) => request.subflowId === 'child' ? {
      result: recording.runtimeSnapshot.subflowResults['child#2'],
      graph: { nodes: [graphNode('child/prepare', 'child'), graphNode('child/group/inner', 'child', true)], edges: [] },
    } : {
      result: recording.runtimeSnapshot.subflowResults['child/group/inner#4'],
      graph: { nodes: [graphNode('child/group/inner/compute', 'child/group/inner')], edges: [] },
    });
    const source = sourceFor(rootSnapshot(recording), load);
    render(<ExplainableShell source={source} />);
    fireEvent.click(screen.getByRole('button', { name: 'Open first recorded child' }));
    await waitFor(() => expect(scope()).toBe('child'));
    fireEvent.click(screen.getByRole('button', { name: 'Open graph child/group/inner' }));
    await waitFor(() => expect(scope()).toBe('child/group/inner'));
    expect(load).toHaveBeenCalledTimes(2);
    expect(load.mock.calls[1][0].invocationPath).toEqual(['child#2', 'child/group/inner#4']);
    expect(observations.chart.graph.nodes.some((node: any) => node.id === 'child/group/inner/compute')).toBe(true);
  });

  it.each(['flat', 'isometric'] as const)('keeps the %s chart overlay aligned with the loaded child cursor', async renderer => {
    const source = sourceFor(rootSnapshot(), () => child());
    render(<ExplainableShell source={source} flowchart={{ renderer }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Open first recorded child' }));
    await waitFor(() => expect(scope()).toBe('child'));
    const activeStep = () => observations.chart.overlay.executionOrder[observations.chart.scrubIndex]?.runtimeStageId;
    expect(observations.chart.renderer).toBe(renderer);
    expect(observations.chart.overlay.executionOrder.map((step: any) => step.runtimeStageId)).toEqual(['child/prepare#3', 'child/inner#4']);
    expect(activeStep()).toBe('child/prepare#3');
    fireEvent.click(screen.getByLabelText('Next stage'));
    expect(activeStep()).toBe('child/inner#4');
    expect(observations.chart.currentSubflowId).toBe('child');
  });
});
