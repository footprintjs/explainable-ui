/** @vitest-environment jsdom */
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ExplainableShell, LensControllerProvider, useLensController, createRecordingSource,
  type LensController, type LensControllerProviderProps, type LoadedSubflow, type RecordingSource, type SubflowLoadRequest,
} from '../../src/index';

const gallery = JSON.parse(readFileSync('examples/local-playground/recordings.json', 'utf8'));
const parallel = gallery.scenarios.find((scenario: { id: string }) => scenario.id === 'parallel');
const overview = JSON.parse(readFileSync('examples/deployment-shapes/recording/overview.json', 'utf8'));
const sources: RecordingSource[] = [];
afterEach(() => { cleanup(); sources.splice(0).forEach(source => source.dispose()); vi.useRealTimers(); });
function remember(source: RecordingSource) { sources.push(source); return source; }
function parallelSource() {
  return remember(createRecordingSource({ snapshot: structuredClone(parallel.runtimeSnapshot),
    graph: structuredClone(parallel.traceGraph), narrativeEntries: structuredClone(parallel.narrativeEntries) }));
}
function mount(source: RecordingSource, intervalMs?: number) {
  let controller!: LensController;
  function Probe() { controller = useLensController(); return null; }
  const tree = (withShell: boolean) => <LensControllerProvider source={source} replayControls={{ intervalMs }}>
    <Probe />{withShell && <ExplainableShell renderFlowchart={() => <div>Custom chart</div>} />}
  </LensControllerProvider>;
  const view = render(tree(false));
  return { current: () => controller, view, showShell: () => view.rerender(tree(true)) };
}
function startTotal(controller: LensController) {
  const variable = controller.activity.writes.find(value => value.key === 'total');
  expect(variable?.traceTarget).toBeTruthy();
  controller.actions.backtrack(variable!.traceTarget!);
}
function ingredient(controller: LensController, stageName: string) {
  const value = controller.traceWalk!.stops.flatMap(stop => stop.ingredients)
    .find(value => value.writerStageName === stageName);
  expect(value).toBeTruthy(); return value!;
}

describe('independent public controller review regressions', () => {
  it('exposes distinct recording diagnoses during SSR while rendering only explicit children', () => {
    const waiting = remember(createRecordingSource({ snapshot: { runId: '', sharedState: {}, commitLog: [],
      executionTree: { id: 'Seed', name: 'Seed', runtimeStageId: undefined } }, graph: { nodes: [], edges: [] } }));
    const cases: { options: LensControllerProviderProps; status: string; reason?: string }[] = [
      { options: {}, status: 'waiting', reason: 'no-recording' },
      { options: { runtimeSnapshot: { sharedState: {}, commitLog: [], executionTree: undefined } }, status: 'empty', reason: 'no-stages' },
      { options: { source: waiting }, status: 'waiting', reason: 'no-stages' },
      { options: { runtimeSnapshot: { sharedState: null, commitLog: [], executionTree: undefined } as unknown as NonNullable<LensControllerProviderProps['runtimeSnapshot']> }, status: 'error', reason: 'unreadable' },
      { options: { source: parallelSource() }, status: 'ready' },
    ];
    for (const item of cases) {
      let seen: LensController['recordingStatus'] | undefined;
      function Probe() { seen = useLensController().recordingStatus; return <output>Host view</output>; }
      const markup = renderToStaticMarkup(<LensControllerProvider {...item.options}><Probe /></LensControllerProvider>);
      expect(markup).toBe('<output>Host view</output>');
      expect(seen).toEqual({ status: item.status, ...(item.reason ? { reason: item.reason } : {}) });
    }
  });

  it('keeps play idempotent when two consumers ask before the next render', () => {
    vi.useFakeTimers();
    const model = mount(parallelSource(), 200);
    act(() => { model.current().actions.play(); model.current().actions.play(); });
    expect(model.current().playback.playing).toBe(true);
    expect(vi.getTimerCount()).toBe(1);
    act(() => vi.advanceTimersByTime(200));
    expect(model.current().selectedIndex).toBe(1);
  });

  it('does not cancel an existing exact pending drill when a Shell presenter mounts', async () => {
    let pendingRequest: SubflowLoadRequest | undefined;
    const loader = vi.fn((request: SubflowLoadRequest) => {
      pendingRequest = request;
      return new Promise<LoadedSubflow>(() => {});
    });
    const source = remember(createRecordingSource({ snapshot: structuredClone(overview.snapshot),
      graph: structuredClone(overview.graph), narrativeEntries: structuredClone(overview.narrativeEntries), loadSubflow: loader }));
    const model = mount(source);
    act(() => model.current().actions.drillDown('server-a'));
    await waitFor(() => expect(loader).toHaveBeenCalledTimes(1));
    expect(pendingRequest).toMatchObject(model.current().pendingLoad!.request);
    const before = model.current().pendingLoad!.request;
    model.showShell();
    expect(model.current().pendingLoad?.request).toEqual(before);
    expect(model.current().invocationPath).toEqual([]);
  });

  it('refuses a retained old-question rail callback while another ingredient is investigated', () => {
    const model = mount(parallelSource());
    act(() => model.current().actions.selectStage('combine#4'));
    act(() => startTotal(model.current()));
    act(() => model.current().actions.followIngredient(ingredient(model.current(), 'Items')));
    const staleShowAll = model.current().tracingRail?.onShowAll;
    expect(staleShowAll).toBeTypeOf('function');
    act(() => model.current().actions.exitBacktrack());
    act(() => startTotal(model.current()));
    act(() => model.current().actions.followIngredient(ingredient(model.current(), 'Delivery')));
    const before = model.current();
    expect(before.tracingRail?.viaKey).toBeTruthy();
    act(() => staleShowAll!());
    expect(model.current().tracingRail?.viaKey).toBe(before.tracingRail?.viaKey);
    expect(model.current().selectedSnapshot?.runtimeStageId).toBe(before.selectedSnapshot?.runtimeStageId);
  });
});
