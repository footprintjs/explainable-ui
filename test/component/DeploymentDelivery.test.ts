import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import type { SubflowLoadRequest } from '../../src/progressiveRendering';
import { createDetailLoader, loadDeploymentRecording } from '../../examples/deployment-shapes/recordingDelivery';
import manifest from '../../examples/deployment-shapes/recording/manifest.json';

const read = (file: string) => readFileSync(`examples/deployment-shapes/recording/${file}`, 'utf8');
const request = (index = 0): SubflowLoadRequest => {
  const entry = manifest.children[index];
  return { invocationPath: entry.invocationPath, mountRuntimeStageId: entry.mountRuntimeStageId, subflowId: entry.subflowId, runId: entry.runId };
};
function storage() {
  return vi.fn<typeof fetch>(async (input, options) => {
    if (options?.signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
    const file = new URL(String(input)).pathname.split('/').at(-1)!;
    return new Response(read(file), { status: 200 });
  });
}

describe('deployment recording delivery', () => {
  it('fetches only the overview first, then admits and retains exact independently fetched server invocations', async () => {
    const fetcher = storage();
    const recording = await loadDeploymentRecording({ delayMs: 0, failNext: false }, new AbortController().signal, fetcher);
    const source = recording.source;
    try {
      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(String(fetcher.mock.calls[0][0])).toContain('overview.json');
      expect(source.rootSnapshot.subflowResults).toBeUndefined();
      expect(source.rootGraph.nodes).toHaveLength(7);
      for (let index = 0; index < 2; index++) {
        const child = await source.load(request(index));
        expect(child.snapshots).toHaveLength(3);
        expect(child.graph?.nodes.every(node => node.id.startsWith(`${request(index).subflowId}/`))).toBe(true);
        expect(child.narrativeEntries).toHaveLength(15);
      }
      expect(fetcher).toHaveBeenCalledTimes(3);
      const again = await source.load(request());
      expect(again.snapshots.at(-1)?.memory.healthy).toBe(true);
      expect(fetcher).toHaveBeenCalledTimes(3);
      expect(source.rootSnapshot.subflowResults).toBeUndefined();
    } finally { source.dispose(); }
  });

  it('rejects another visit or ancestry before making a request', async () => {
    const fetcher = storage(), load = createDetailLoader({ delayMs: 0, failNext: false }, fetcher);
    for (const bad of [{ ...request(), mountRuntimeStageId: 'server-a#999' }, { ...request(), invocationPath: ['other#1', ...request().invocationPath] }, { ...request(), runId: 'another-run' }]) {
      await expect(load(bad, { signal: new AbortController().signal })).rejects.toThrow('No exact');
    }
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('cancels a slow detail request before fetching and retries a simulated storage failure', async () => {
    const fetcher = storage(), policy = { delayMs: 800, failNext: false }, load = createDetailLoader(policy, fetcher);
    const abort = new AbortController(), pending = load(request(), { signal: abort.signal });
    abort.abort(); await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetcher).not.toHaveBeenCalled();
    policy.delayMs = 0; policy.failNext = true;
    await expect(load(request(), { signal: new AbortController().signal })).rejects.toThrow('Simulated');
    expect(fetcher).not.toHaveBeenCalled();
    const child = await load(request(), { signal: new AbortController().signal });
    expect(child.narrativeEntries).toHaveLength(15); expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
