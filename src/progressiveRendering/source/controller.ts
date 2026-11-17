import type { RecordingSource, RecordingSourceOptions, RecordingSourceSnapshot, PreparedSubflow, SubflowLoadRequest, SubflowLoadState } from '../types';
import type { RuntimeSnapshotInput } from '../../model/recording';
import type { TraceGraph } from '../../components/FlowchartView/traceStructureRecorder';
import { prepareSubflow } from '../prepare';
import { admitLoaded, admitPrepared } from '../prepare';
import { abortError, checkSignal, invalid, own } from '../prepare';
import { scheduleTask, scheduleVisual, yieldToHost } from '../scheduler';
import { normalizeRequest, pathKey, readPath } from './request';
import { scopedGraph, sourceView } from './views';
import { admitCohort, assertCumulativeChild, sameOwnedData, type LiveCohort } from './live';

type Lease = { resolve(value: PreparedSubflow): void; reject(error: Error): void; clean(): void };
type Job = { key: string; request: SubflowLoadRequest; controller: AbortController; leases: Set<Lease>; started: boolean; queuedBackground: boolean; cancelStart?: () => void; value?: PreparedSubflow };

/** One creator-owned recording cohort. View unmount releases only its own
 * subscription and request signal; it must not dispose another view's source. */
export function createRecordingSource(options: RecordingSourceOptions): RecordingSource {
  let cohort = admitCohort(options), pendingRoot: LiveCohort | undefined;
  const loader = options.loadSubflow, hostPrepare = options.prepareSubflow;
  const max = options.maxCachedSubflows ?? 64;
  if (!Number.isInteger(max) || max < 1 || max > 64 || (loader !== undefined && typeof loader !== 'function')) throw invalid();
  let states = new Map<string, SubflowLoadState>();
  const jobs = new Map<string, Job>();
  const listeners = new Set<() => void>(), ready = new Map<string, Job>();
  const graphs = new Map<string, { root: TraceGraph; layers: TraceGraph[]; value: TraceGraph }>();
  let disposed = false, revision = 0, rootRevision = 0;
  let snapshot = sourceView(cohort.fields, cohort.narrative, states, revision), cancelVisual: (() => void) | undefined;
  let publication: { cohort: LiveCohort; states: Map<string, SubflowLoadState>; view: RecordingSourceSnapshot; jobs: Job[]; rootChanged: boolean } | undefined;
  const alive = (job: Job) => !disposed && jobs.get(job.key) === job && !job.controller.signal.aborted;
  const emit = (dataChanged = false) => {
    if (disposed) return;
    snapshot = sourceView(cohort.fields, cohort.narrative, states, ++revision, dataChanged ? undefined : snapshot, rootRevision);
    for (const listener of [...listeners]) {
      try { listener(); } catch { /* Subscriber code cannot corrupt a delivered recording or strand request leases. */ }
    }
    if (publication) queuePublication();
  };
  const settle = (job: Job, error?: Error) => {
    for (const lease of job.leases) { lease.clean(); error ? lease.reject(error) : lease.resolve(job.value!); }
    job.leases.clear();
  };
  const cancelJob = (job: Job, notify = true) => {
    job.cancelStart?.(); job.controller.abort(); ready.delete(job.key); jobs.delete(job.key);
    states.delete(job.key); settle(job, abortError()); if (notify) emit();
  };
  function candidateStates(target: LiveCohort): Map<string, SubflowLoadState> {
    if (target === cohort) return new Map(states);
    const result = new Map<string, SubflowLoadState>();
    for (const [key, state] of [...states].sort((a, b) => a[1].request.invocationPath.length - b[1].request.invocationPath.length)) {
      try { normalizeRequest(state.request, target.fields as unknown as RuntimeSnapshotInput, result); } catch { continue; }
      const authoritative = own(target.fields.subflowResults, state.request.mountRuntimeStageId);
      if (authoritative !== undefined && !sameOwnedData(authoritative, own(cohort.fields.subflowResults, state.request.mountRuntimeStageId))) {
        admitLoaded({ result: authoritative }, state.request);
        if (state.status === 'ready') assertCumulativeChild(state.value.result, authoritative);
        continue;
      }
      result.set(key, state);
      if (state.status === 'ready') {
        try { scopedGraph(target.graph, state.request.invocationPath, result); }
        catch {
          // A newer root graph may now own a previously cached drawing. Keep
          // its exact evidence but let the current root own the geometry.
          const { graph: _oldGraph, ...value } = state.value;
          result.set(key, Object.freeze({ ...state, value: Object.freeze(value) }));
        }
      }
    }
    return result;
  }
  function queuePublication(): void {
    if (!pendingRoot && !ready.size) { publication = undefined; cancelVisual?.(); cancelVisual = undefined; return; }
    const target = pendingRoot ?? cohort, nextStates = candidateStates(target), complete: Job[] = [];
    for (const job of [...ready.values()]) if (alive(job)) {
      try {
        // A request may have started after an update's cancellation pass but
        // before that root was published. Never overwrite its newer inline fact.
        normalizeRequest(job.request, target.fields as unknown as RuntimeSnapshotInput, nextStates);
        const authoritative = own(target.fields.subflowResults, job.request.mountRuntimeStageId);
        if (authoritative !== undefined && !sameOwnedData(authoritative, job.value!.result)) throw invalid();
        const state = Object.freeze({ status: 'ready' as const, request: job.request, value: job.value! });
        const geometry = new Map(nextStates); geometry.set(job.key, state);
        scopedGraph(target.graph, job.request.invocationPath, geometry);
        nextStates.set(job.key, state); complete.push(job);
      } catch { cancelJob(job, false); nextStates.delete(job.key); }
    }
    const rootChanged = pendingRoot !== undefined;
    publication = { cohort: target, states: nextStates,
      view: sourceView(target.fields, target.narrative, nextStates, revision + 1, undefined, rootRevision + Number(rootChanged)), jobs: complete, rootChanged };
    if (!cancelVisual) cancelVisual = scheduleVisual(flush);
  }
  function flush(): void {
    cancelVisual = undefined;
    const next = publication; publication = undefined; if (!next || disposed) return;
    cohort = next.cohort; pendingRoot = undefined; states = next.states;
    if (next.rootChanged) rootRevision++;
    snapshot = Object.freeze({ ...next.view, revision: ++revision, rootRevision });
    ready.clear();
    for (const job of next.jobs) { jobs.delete(job.key); settle(job); }
    for (const listener of [...listeners]) { try { listener(); } catch { /* Host subscription code is isolated. */ } }
  }
  const fail = (job: Job, message: string) => {
    if (!alive(job)) return;
    states.set(job.key, Object.freeze({ status: 'error', request: job.request, message }));
    jobs.delete(job.key); ready.delete(job.key); emit(); settle(job, new Error(message));
  };
  const run = async (job: Job) => {
    if (!alive(job) || job.started) return; job.started = true;
    let preparing = false;
    try {
      const existing = own(cohort.fields.subflowResults, job.request.mountRuntimeStageId);
      if (existing === undefined && !loader) throw invalid();
      const loaded = existing !== undefined ? { result: existing } : await loader!(job.request, { signal: job.controller.signal });
      if (!alive(job)) return;
      preparing = true;
      states.set(job.key, Object.freeze({ status: 'preparing', request: job.request })); emit();
      await yieldToHost(job.controller.signal);
      if (!alive(job)) return;
      const admitted = admitLoaded(loaded, job.request);
      const prepared = await (hostPrepare ?? prepareSubflow)(admitted, job.request, { signal: job.controller.signal });
      if (!alive(job)) return;
      job.value = admitPrepared(prepared, job.request);
      const target = pendingRoot ?? cohort, graphCandidate = candidateStates(target);
      normalizeRequest(job.request, target.fields as unknown as RuntimeSnapshotInput, graphCandidate);
      graphCandidate.set(job.key, { status: 'ready', request: job.request, value: job.value });
      scopedGraph(target.graph, job.request.invocationPath, graphCandidate);
      ready.set(job.key, job); queuePublication();
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
    get rootSnapshot() { return cohort.fields as unknown as RuntimeSnapshotInput; },
    get rootGraph() { return cohort.graph; },
    canLoadSubflows: typeof loader === 'function',
    update(value) {
      if (disposed) throw new Error('The recording source was disposed.');
      let target: LiveCohort, valid: Map<string, SubflowLoadState>;
      try { target = admitCohort(value, pendingRoot ?? cohort); valid = candidateStates(target); }
      catch { throw new Error('Live updates require a complete cumulative recording from the same run.'); }
      // The source owns old child facts until one atomic new root cohort takes
      // their place. Invalidate stale jobs before any old result can publish.
      for (const job of [...jobs.values()]) {
        const provided = own(target.fields.subflowResults, job.request.mountRuntimeStageId);
        if (!valid.has(job.key) || (provided !== undefined && !sameOwnedData(provided, own(cohort.fields.subflowResults, job.request.mountRuntimeStageId)))) cancelJob(job, false);
      }
      pendingRoot = target; queuePublication();
    },
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) { if (disposed) return () => undefined; listeners.add(listener); return () => { listeners.delete(listener); }; },
    getKey: pathKey,
    load(input, interests = {}) {
      try {
        if (disposed) throw abortError(); checkSignal(interests.signal);
        const request = normalizeRequest(input, cohort.fields as unknown as RuntimeSnapshotInput, states), key = pathKey(request.invocationPath);
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
        if (!loader && own(cohort.fields.subflowResults, request.mountRuntimeStageId) === undefined) return Promise.reject(new Error('Recorded subflow loading is unavailable.'));
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
      if (!layers.length) return cohort.graph;
      // Cache only actual retained graph-scope paths, never arbitrary suffixes
      // supplied by callers. Unrelated arrivals preserve this graph reference.
      const key = pathKey(admitted.slice(0, lastLayerDepth)), cached = graphs.get(key);
      if (cached && cached.root === cohort.graph && cached.layers.length === layers.length && layers.every((layer, index) => layer === cached.layers[index])) return cached.value;
      const value = scopedGraph(cohort.graph, admitted, states); graphs.set(key, { root: cohort.graph, layers, value }); return value;
    },
    dispose() {
      if (disposed) return; disposed = true; cancelVisual?.(); publication = undefined; pendingRoot = undefined; ready.clear(); listeners.clear(); graphs.clear();
      for (const job of jobs.values()) { job.cancelStart?.(); job.controller.abort(); settle(job, abortError()); }
      jobs.clear();
    },
  };
  return Object.freeze(source);
}
