import { createRecordingSource } from 'footprint-explainable-ui';
import type { LoadedSubflow, NarrativeEntry, RecordingSource, RuntimeSnapshotInput, SubflowLoadRequest, TraceGraph } from 'footprint-explainable-ui';
import manifest from './recording/manifest.json';

// URLs, not JSON imports: the child payloads are separate HTTP requests on open.
// Vite's assetsInlineLimit:0 also keeps them separate in the static Pages build.
const overviewUrl = new URL('./recording/overview.json', import.meta.url).href;
const childUrls: Readonly<Record<string, string>> = {
  'server-a.json': new URL('./recording/server-a.json', import.meta.url).href,
  'server-b.json': new URL('./recording/server-b.json', import.meta.url).href,
};
export interface DeliveryPolicy { delayMs: number; failNext: boolean }
interface Overview { snapshot: RuntimeSnapshotInput; graph: TraceGraph; narrativeEntries: NarrativeEntry[] }
export interface DeploymentRecording { source: RecordingSource; overviewBytes: number }
type Fetch = typeof fetch;

/** A small demo delay is asynchronous and abortable; it never stands for recorded time. */
function pause(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const abort = () => { clearTimeout(timer); signal.removeEventListener('abort', abort); reject(new DOMException('Cancelled', 'AbortError')); };
    const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve(); }, ms);
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) abort();
  });
}

function sameRequest(request: SubflowLoadRequest, entry: typeof manifest.children[number]): boolean {
  return request.mountRuntimeStageId === entry.mountRuntimeStageId && request.subflowId === entry.subflowId
    && request.runId === entry.runId && JSON.stringify(request.invocationPath) === JSON.stringify(entry.invocationPath);
}

export function createDetailLoader(policy: DeliveryPolicy, fetcher: Fetch = fetch) {
  return async (request: SubflowLoadRequest, { signal }: { signal: AbortSignal }): Promise<LoadedSubflow> => {
    const entry = manifest.children.find(child => sameRequest(request, child));
    if (!entry || !childUrls[entry.file]) throw new Error('No exact recorded detail asset.');
    const fail = policy.failNext; policy.failNext = false;
    if (policy.delayMs > 0) await pause(policy.delayMs, signal);
    if (fail) throw new Error('Simulated detail storage failure.');
    const response = await fetcher(childUrls[entry.file], { signal });
    if (!response.ok) throw new Error('Detail recording could not be fetched.');
    return await response.json() as LoadedSubflow;
  };
}

export async function loadDeploymentRecording(policy: DeliveryPolicy, signal: AbortSignal, fetcher: Fetch = fetch): Promise<DeploymentRecording> {
  const response = await fetcher(overviewUrl, { signal });
  if (!response.ok) throw new Error('Overview recording could not be fetched.');
  const text = await response.text();
  if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
  const overview = JSON.parse(text) as Overview;
  return { overviewBytes: new TextEncoder().encode(text).length, source: createRecordingSource({
    snapshot: overview.snapshot, graph: overview.graph, narrativeEntries: overview.narrativeEntries,
    loadSubflow: createDetailLoader(policy, fetcher),
  }) };
}
