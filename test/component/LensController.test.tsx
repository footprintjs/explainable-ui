/** @vitest-environment jsdom */
import * as React from 'react';
import * as PublicAPI from '../../src/index';
import { readFileSync } from 'node:fs';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRecordingSource, type LoadedSubflow, type RecordingSource, type RecordingSourceOptions, type SubflowLoadRequest } from '../../src/progressiveRendering';
import type { LensController, LensControllerProviderProps } from '../../src/workbench';

// Dynamic lookup keeps absent public exports an honest availability assertion,
// rather than turning a missing static import into a purported behavior RED.
const exportsAtRuntime = PublicAPI as unknown as Record<string, unknown>;
const Provider = exportsAtRuntime.LensControllerProvider as React.ComponentType<LensControllerProviderProps> | undefined;
const useController = exportsAtRuntime.useLensController as (() => LensController) | undefined;
const available = !!Provider && typeof useController === 'function';
const sources: RecordingSource[] = [];
afterEach(() => { cleanup(); sources.splice(0).forEach(source => source.dispose()); vi.useRealTimers(); vi.unstubAllGlobals(); });

const gallery = JSON.parse(readFileSync('examples/local-playground/recordings.json', 'utf8'));
const parallel = gallery.scenarios.find((scenario: { id: string }) => scenario.id === 'parallel');
const overview = JSON.parse(readFileSync('examples/deployment-shapes/recording/overview.json', 'utf8'));
const serverA = JSON.parse(readFileSync('examples/deployment-shapes/recording/server-a.json', 'utf8')) as LoadedSubflow;
const manifest = JSON.parse(readFileSync('examples/deployment-shapes/recording/manifest.json', 'utf8'));
const requestA: SubflowLoadRequest = manifest.children.find((child: SubflowLoadRequest) => child.subflowId === 'server-a');
const track = (options: RecordingSourceOptions) => { const source = createRecordingSource(options); sources.push(source); return source; };
const parallelSource = () => track({ snapshot: structuredClone(parallel.runtimeSnapshot), graph: structuredClone(parallel.traceGraph), narrativeEntries: structuredClone(parallel.narrativeEntries) });
const deploymentSource = (loadSubflow: RecordingSourceOptions['loadSubflow']) => track({ snapshot: structuredClone(overview.snapshot), graph: structuredClone(overview.graph), narrativeEntries: structuredClone(overview.narrativeEntries), loadSubflow });
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(done => { resolve = done; }); return { promise, resolve }; }
function mount(options: LensControllerProviderProps) {
  const seen: { first?: LensController; second?: LensController } = {};
  function Probe({ name }: { name: 'first' | 'second' }) { seen[name] = useController!(); return null; }
  const Owner = Provider!;
  const tree = (props: LensControllerProviderProps) => <Owner {...props}><Probe name="first" /><Probe name="second" /></Owner>;
  const view = render(tree(options));
  return { view, first: () => seen.first!, second: () => seen.second!, rerender: (props: LensControllerProviderProps) => view.rerender(tree(props)) };
}
function totalTarget(controller: LensController) {
  const variable = controller.activity.writes.find(value => value.key === 'total');
  expect(variable?.value.preview).toContain('35'); expect(variable?.traceTarget).toBeTruthy();
  return variable!.traceTarget!;
}

it('publishes the headless provider and hook through the public root', () => {
  expect(exportsAtRuntime.LensControllerProvider).toBeDefined();
  expect(exportsAtRuntime.useLensController).toBeTypeOf('function');
});

describe.skipIf(!available)('renderless Lens controller behavior', () => {
  it('emits no built-in DOM while two consumers share selection and one playback clock', () => {
    vi.useFakeTimers();
    const source = parallelSource(); const model = mount({ source, replayControls: { intervalMs: 200 } });
    expect(model.view.container.innerHTML).toBe('');
    act(() => model.first().actions.selectStage('combine#4'));
    expect(model.first().selectedSnapshot?.runtimeStageId).toBe('combine#4');
    expect(model.second().selectedIndex).toBe(model.first().selectedIndex);
    act(() => model.second().actions.selectIndex(0));
    expect(model.first().selectedIndex).toBe(0);
    act(() => model.first().actions.play());
    expect(model.second().playback.playing).toBe(true);
    expect(vi.getTimerCount()).toBe(1);
    act(() => vi.advanceTimersByTime(200));
    expect(model.first().selectedIndex).toBe(1); expect(model.second().selectedIndex).toBe(1);
    model.view.unmount(); expect(vi.getTimerCount()).toBe(0);
  });

  it('keeps explicit context selection usable when transport actions are disabled', () => {
    const model = mount({ source: parallelSource(), replayControls: { previousNext: false, playPause: false, slider: false } });
    act(() => model.first().actions.selectStage('items#2'));
    const selected = model.first().selectedIndex;
    act(() => { const actions = model.first().actions; actions.previous(); actions.next(); actions.scrubTo(0); actions.play(); });
    expect(model.first().selectedIndex).toBe(selected); expect(model.first().playback.playing).toBe(false);
    expect(model.first().playback.canPlay).toBe(false); expect(model.first().playback.canPrevious).toBe(false); expect(model.first().playback.canNext).toBe(false);
    act(() => model.second().actions.selectIndex(0)); expect(model.first().selectedIndex).toBe(0);
    act(() => model.first().actions.selectStage('combine#4'));
    expect(model.second().selectedSnapshot?.runtimeStageId).toBe('combine#4');
  });

  it('traces published native total35 through both branch writers and restores the Activity question', () => {
    const model = mount({ source: parallelSource() });
    act(() => model.first().actions.selectStage('combine#4'));
    act(() => model.first().actions.selectActivityVariable('write:total'));
    const target = totalTarget(model.first());
    act(() => model.first().actions.backtrack(target));
    expect(model.first().traceWalk?.stops.map(stop => stop.stageName)).toEqual(['Combine', 'Delivery', 'Items', 'LoadOrder']);
    expect(model.first().selectedSnapshot?.memory).toMatchObject({ total: 35 });
    expect(model.first().snapshots.find(stage => stage.runtimeStageId === 'delivery#3')?.memory).toMatchObject({ runs: { delivery: { amount: 5 } } });
    const origin = model.first().activityOrigin;
    expect(origin).toMatchObject({ runtimeStageId: 'combine#4', key: 'total', kind: 'write', invocationPath: [] });
    const items = model.first().traceWalk!.stops[0].ingredients.find(ingredient => ingredient.writerStageName === 'Items');
    expect(items).toBeTruthy();
    act(() => model.first().actions.followIngredient(items!));
    expect(model.second().selectedSnapshot?.runtimeStageId).toBe('items#2');
    expect(model.first().selectedSnapshot?.memory).toMatchObject({ runs: { items: { amount: 30 } } });
    expect(model.first().questionTrail[0]?.key).toBe('total');
    act(() => model.first().actions.returnToQuestion(0));
    expect(model.first().traceWalk?.key).toBe('total'); expect(model.first().activityOrigin).toEqual(origin);
    act(() => model.first().actions.exitBacktrack());
    expect(model.second().selectedSnapshot?.runtimeStageId).toBe('combine#4');
    expect(model.first().selectedActivityVariableId).toBe('write:total'); expect(model.first().traceWalk).toBeNull();
    expect(model.first().presentationRequest).toMatchObject({ kind: 'activity', origin: { runtimeStageId: 'combine#4', key: 'total' } });
    // DOM focus belongs to Shell/custom presentation adapters, not this model.
  });

  it('cancels an exact lazy drill without a late jump and admits a deliberate fresh drill', async () => {
    const late = deferred<LoadedSubflow>(); let aborted: AbortSignal | undefined;
    const loader = vi.fn((_request: SubflowLoadRequest, options: { signal: AbortSignal }) => { aborted = options.signal; return late.promise; })
      .mockImplementationOnce((_request, options) => { aborted = options.signal; return late.promise; })
      .mockResolvedValue(structuredClone(serverA));
    const source = deploymentSource(loader); const model = mount({ source });
    act(() => model.first().actions.drillDown(requestA.subflowId));
    await waitFor(() => expect(loader).toHaveBeenCalledTimes(1));
    expect(loader.mock.calls[0][0].invocationPath).toEqual(requestA.invocationPath);
    expect(model.first().pendingLoad?.request.mountRuntimeStageId).toBe(requestA.mountRuntimeStageId);
    expect(model.first().invocationPath).toEqual([]); expect(model.first().snapshots).toHaveLength(7);
    act(() => { model.first().actions.cancelPending(); model.first().actions.selectIndex(1); });
    expect(aborted?.aborted).toBe(true);
    await act(async () => { late.resolve(structuredClone(serverA)); await new Promise(done => setTimeout(done, 30)); });
    expect(model.first().invocationPath).toEqual([]); expect(model.first().selectedIndex).toBe(1); expect(model.first().pendingLoad).toBeNull();
    act(() => model.first().actions.drillDown(requestA.subflowId));
    await waitFor(() => expect(model.first().invocationPath).toEqual(requestA.invocationPath));
    expect(loader).toHaveBeenCalledTimes(2);
    expect(model.first().snapshots.map(snapshot => snapshot.runtimeStageId)).toEqual(['server-a/deploy#4', 'server-a/start#7', 'server-a/health-result#9']);
    expect(model.first().graph?.nodes.some(node => node.id === 'server-a/health-result')).toBe(true);
  });

  it('pins a selected runtime stage and frozen trace while an earlier live branch grows', async () => {
    vi.useFakeTimers(); vi.stubGlobal('requestAnimationFrame', undefined);
    const stage = (id: string, runtimeStageId: string, writes: Record<string, unknown> = {}) => ({ id, runtimeStageId, name: id, isFork: false, isDecider: false, stageWrites: writes, stageReads: {}, logs: {}, errors: {}, metrics: {}, evals: {} });
    const commit = (id: string, runtimeStageId: string, values: Record<string, unknown>, idx: number) => ({ idx, stageId: id, runtimeStageId, stage: id, overwrite: values, updates: {}, trace: Object.keys(values).map(path => ({ path, verb: 'set', readKeys: [] })) });
    const root = { runId: 'headless-parallel-live', sharedState: { a: 1, b: 2 }, executionTree: { ...stage('fork', 'fork#0'), isFork: true,
      children: [stage('a', 'a#1', { a: 1 }), stage('b', 'b#2', { b: 2 })] },
      commitLog: [commit('fork', 'fork#0', {}, 0), commit('a', 'a#1', { a: 1 }, 1), commit('b', 'b#2', { b: 2 }, 2)] };
    const graph = { nodes: [], edges: [] }; const source = track({ snapshot: root, graph }); const model = mount({ source });
    act(() => model.first().actions.selectStage('b#2'));
    const variable = model.first().activity.writes.find(value => value.key === 'b')!;
    act(() => model.first().actions.backtrack(variable.traceTarget!));
    const before = model.first().traceWalk;
    const retainedSelectStage = model.first().actions.selectStage;
    const updated = { ...structuredClone(root), sharedState: { a: 1, b: 2, c: 3 }, executionTree: { ...structuredClone(root.executionTree), children: [
      { ...structuredClone(root.executionTree.children[0]), next: stage('later-a', 'later-a#3', { c: 3 }) }, structuredClone(root.executionTree.children[1])
    ] }, commitLog: [...structuredClone(root.commitLog), commit('later-a', 'later-a#3', { c: 3 }, 3)] };
    await act(async () => { source.update({ snapshot: updated, graph }); await vi.advanceTimersByTimeAsync(40); });
    expect(model.first().snapshots).toHaveLength(4);
    expect(model.first().selectedIndex).toBe(3); expect(model.second().selectedSnapshot?.runtimeStageId).toBe('b#2');
    expect(model.first().traceWalk?.key).toBe('b'); expect(model.first().traceWalk?.stops).toEqual(before?.stops);
    act(() => retainedSelectStage('b#2'));
    expect(model.first().selectedSnapshot?.runtimeStageId).toBe('b#2');
  });

  it('rejects an old-source exit after a replacement source opens its own Backtrack question', () => {
    const firstSource = parallelSource(), replacement = parallelSource(); const model = mount({ source: firstSource });
    act(() => model.first().actions.selectStage('combine#4'));
    act(() => model.first().actions.backtrack(totalTarget(model.first())));
    const staleExit = model.first().actions.exitBacktrack;
    model.rerender({ source: replacement }); expect(model.first().traceWalk).toBeNull();
    act(() => model.first().actions.selectStage('combine#4'));
    act(() => model.first().actions.backtrack(totalTarget(model.first())));
    act(() => staleExit());
    expect(model.first().traceWalk?.key).toBe('total'); expect(model.first().activityOrigin?.runtimeStageId).toBe('combine#4');
  });

  it('releases Provider interest on unmount while a creator-owned source serves another lease', async () => {
    const delivery = deferred<LoadedSubflow>(); let signal: AbortSignal | undefined;
    const loader = vi.fn((_request: SubflowLoadRequest, options: { signal: AbortSignal }) => { signal = options.signal; return delivery.promise; });
    const source = deploymentSource(loader); const model = mount({ source });
    act(() => model.first().actions.drillDown(requestA.subflowId));
    await waitFor(() => expect(loader).toHaveBeenCalledTimes(1));
    const otherConsumer = source.load(requestA);
    model.view.unmount(); expect(signal?.aborted).toBe(false);
    delivery.resolve(structuredClone(serverA));
    const prepared = await otherConsumer;
    expect(prepared.snapshots.at(-1)?.memory.healthy).toBe(true);
    expect((await source.load(requestA)).snapshots).toHaveLength(3);
    expect(loader).toHaveBeenCalledTimes(1);
    // The creator remains responsible for source.dispose(), performed in cleanup.
  });
  it('exposes repeated native mount choices and opens only the deliberately chosen invocation', () => {
    // Genuine historical Footprint10.3 capture, not a new13.0 producer claim.
    const repeated = JSON.parse(readFileSync('test/fixtures/subflow-tracing/recordings.json', 'utf8')).repeated;
    const model = mount({ runtimeSnapshot: structuredClone(repeated.runtimeSnapshot), narrativeEntries: structuredClone(repeated.narrativeEntries) });
    act(() => model.first().actions.drillDown('prepare'));
    expect(model.first().invocationPath).toEqual([]);
    expect(model.first().visitChoice?.mountStageId).toBe('prepare');
    expect(model.first().visitChoice?.visits.map(visit => visit.runtimeStageId)).toEqual(['prepare#2', 'prepare#9']);
    act(() => model.first().actions.chooseInvocation('not-a-recorded-visit'));
    expect(model.first().invocationPath).toEqual([]); expect(model.first().visitChoice).not.toBeNull();
    act(() => model.first().actions.chooseInvocation('prepare#2'));
    expect(model.first().invocationPath).toEqual(['prepare#2']); expect(model.first().visitChoice).toBeNull();
    expect(model.first().snapshots.at(-1)?.memory.total).toBe(24);
    act(() => model.first().actions.returnToRoot()); act(() => model.first().actions.selectIndex(0));
    act(() => model.first().actions.drillDown('prepare'));
    act(() => model.first().actions.chooseInvocation('prepare#9'));
    expect(model.first().invocationPath).toEqual(['prepare#9']); expect(model.first().snapshots.at(-1)?.memory.total).toBe(44);
  });

});
