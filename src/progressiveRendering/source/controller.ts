import type { RecordingSource, RecordingSourceOptions, PreparedSubflow, SubflowLoadRequest, SubflowLoadState } from '../types';
import type { TraceGraph } from '../../components/FlowchartView/traceStructureRecorder';
import { narrativeRecorderFromSnapshot } from '../../adapters/fromRuntimeSnapshot';
import { prepareSubflow } from '../prepare';
import { admitGraph, admitLoaded, admitPrepared } from '../prepare/admission';
import { abortError, checkSignal, copyData, invalid, own } from '../prepare/data';
import { scheduleTask, scheduleVisual, yieldToHost } from '../scheduler';
import { normalizeRequest, pathKey, readPath } from './request';
import { rootFields, scopedGraph, sourceView } from './views';

type Lease = { resolve(value: PreparedSubflow): void; reject(error: Error): void; clean(): void };
type Job = { key: string; request: SubflowLoadRequest; controller: AbortController; leases: Set<Lease>; started: boolean; queuedBackground: boolean; cancelStart?: () => void; value?: PreparedSubflow };

/** One creator-owned recording cohort. View unmount releases only its own
 * subscription and request signal; it must not dispose another view's source. */
export function createRecordingSource(options: RecordingSourceOptions): RecordingSource {
  const root = rootFields(options.snapshot), rootGraph = admitGraph(options.graph);
  const max = options.maxCachedSubflows ?? 64;
  if (!Number.isInteger(max) || max < 1 || max > 64 || typeof options.loadSubflow !== 'function') throw invalid();
  // The legacy narrative adapter uses ordinary reads. Give it only a detached
  // own-data recorder view, never executable properties from stored input.
  const rootNarrative = copyData(options.narrativeEntries ?? narrativeRecorderFromSnapshot({ recorders: copyData(root.recorders) })?.entries ?? []);
  const states = new Map<string, SubflowLoadState>(), jobs = new Map<string, Job>();
  const listeners = new Set<() => void>(), ready = new Map<string, Job>();
  const graphs = new Map<string, { layers: TraceGraph[]; value: TraceGraph }>();
  let disposed = false, revision = 0, snapshot = sourceView(root, rootNarrative, states, revision), cancelVisual: (() => void) | undefined;
  const alive = (job: Job) => !disposed && jobs.get(job.key) === job && !job.controller.signal.aborted;
  const emit = (dataChanged = false) => {
    if (disposed) return;
    snapshot = sourceView(root, rootNarrative, states, ++revision, dataChanged ? undefined : snapshot);
    for (const listener of [...listeners]) {
      try { listener(); } catch { /* Subscriber code cannot corrupt a delivered recording or strand request leases. */ }
    }
  };
  const settle = (job: Job, error?: Error) => {
    for (const lease of job.leases) { lease.clean(); error ? lease.reject(error) : lease.resolve(job.value!); }
    job.leases.clear();
  };
  const cancelJob = (job: Job) => {
    job.cancelStart?.(); job.controller.abort(); ready.delete(job.key); jobs.delete(job.key);
    states.delete(job.key); settle(job, abortError()); emit();
  };
  const flush = () => {
    cancelVisual = undefined;
    const complete: Job[] = [];
    for (const job of ready.values()) if (alive(job)) {
      states.set(job.key, Object.freeze({ status: 'ready', request: job.request, value: job.value! })); complete.push(job);
    }
    ready.clear(); if (!complete.length) return;
    emit(true);
    for (const job of complete) { jobs.delete(job.key); settle(job); }
  };
  const fail = (job: Job, message: string) => {
    if (!alive(job)) return;
    states.set(job.key, Object.freeze({ status: 'error', request: job.request, message }));
    jobs.delete(job.key); ready.delete(job.key); emit(); settle(job, new Error(message));
  };
  const run = async (job: Job) => {
    if (!alive(job) || job.started) return; job.started = true;
    let preparing = false;
    try {
      const existing = own(root.subflowResults, job.request.mountRuntimeStageId);
      const loaded = existing !== undefined ? { result: existing } : await options.loadSubflow(job.request, { signal: job.controller.signal });
      if (!alive(job)) return;
      preparing = true;
      states.set(job.key, Object.freeze({ status: 'preparing', request: job.request })); emit();
      await yieldToHost(job.controller.signal);
      if (!alive(job)) return;
      const admitted = admitLoaded(loaded, job.request);
      const prepared = await (options.prepareSubflow ?? prepareSubflow)(admitted, job.request, { signal: job.controller.signal });
      if (!alive(job)) return;
      job.value = admitPrepared(prepared, job.request);
      const graphCandidate = new Map(states);
      graphCandidate.set(job.key, { status: 'ready', request: job.request, value: job.value });
      scopedGraph(rootGraph, job.request.invocationPath, graphCandidate);
      ready.set(job.key, job); if (!cancelVisual) cancelVisual = scheduleVisual(flush);
    } catch { fail(job, preparing ? 'Recorded subflow evidence could not be prepared.' : 'Recorded subflow could not be loaded.'); }
  };
  const queue = (job: Job, background: boolean) => {
    job.cancelStart?.(); job.queuedBackground = background;
    job.cancelStart = scheduleTask(() => { void run(job); }, { background, signal: job.controller.signal });
  };
  const lease = (job: Job, signal?: AbortSignal): Promise<PreparedSubflow> => new Promise((resolve, reject) => {
    const onAbort = () => {
      if (!job.leases.delete(interest)) return;
      interest.clean(); reject(abortError()); if (!job.leases.size && alive(job)) cancelJob(job);
    };
    const interest: Lease = { resolve, reject, clean: () => signal?.removeEventListener('abort', onAbort) };
    job.leases.add(interest); signal?.addEventListener('abort', onAbort, { once: true });
    if (signal?.aborted) onAbort();
  });
  const source: RecordingSource = {
    rootSnapshot: options.snapshot, rootGraph,
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) { if (disposed) return () => undefined; listeners.add(listener); return () => { listeners.delete(listener); }; },
    getKey: pathKey,
    load(input, interests = {}) {
      try {
        if (disposed) throw abortError(); checkSignal(interests.signal);
        const request = normalizeRequest(input, options.snapshot, states), key = pathKey(request.invocationPath);
        const found = states.get(key); if (found?.status === 'ready') return Promise.resolve(found.value);
        // The flat exact-result map cannot safely encode two distinct parent
        // invocations with an identical child stamp. Refuse rather than alias.
        for (const [otherKey, state] of states) if (otherKey !== key && state.request.mountRuntimeStageId === request.mountRuntimeStageId) throw invalid();
        let job = jobs.get(key);
        if (job) {
          const result = lease(job, interests.signal);
          if (!interests.background && !job.started && job.queuedBackground) queue(job, false);
          return result;
        }
        if (!found && states.size >= max) return Promise.reject(new Error('The retained subflow limit was reached. Existing evidence was kept.'));
        job = { key, request, controller: new AbortController(), leases: new Set(), started: false, queuedBackground: interests.background === true };
        jobs.set(key, job); states.set(key, Object.freeze({ status: 'loading', request }));
        const result = lease(job, interests.signal); emit();
        if (alive(job)) {
          queue(job, interests.background === true);
        }
        return result;
      } catch { return Promise.reject(disposed || interests.signal?.aborted ? abortError() : new Error('Recorded subflow request is unavailable.')); }
    },
    getGraph(path) {
      const admitted = readPath(path), layers: TraceGraph[] = []; let lastLayerDepth = 0;
      for (let depth = 1; depth <= admitted.length; depth++) {
        const scope = states.get(pathKey(admitted.slice(0, depth)));
        if (scope?.status === 'ready' && scope.value.graph) { layers.push(scope.value.graph); lastLayerDepth = depth; }
      }
      if (!layers.length) return rootGraph;
      // Cache only actual retained graph-scope paths, never arbitrary suffixes
      // supplied by callers. Unrelated arrivals preserve this graph reference.
      const key = pathKey(admitted.slice(0, lastLayerDepth)), cached = graphs.get(key);
      if (cached && cached.layers.length === layers.length && layers.every((layer, index) => layer === cached.layers[index])) return cached.value;
      const value = scopedGraph(rootGraph, admitted, states); graphs.set(key, { layers, value }); return value;
    },
    dispose() {
      if (disposed) return; disposed = true; cancelVisual?.(); ready.clear(); listeners.clear(); graphs.clear();
      for (const job of jobs.values()) { job.cancelStart?.(); job.controller.abort(); settle(job, abortError()); }
      jobs.clear();
    },
  };
  return Object.freeze(source);
}
