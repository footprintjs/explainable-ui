import { subflowResultToSnapshots } from '../adapters/fromRuntimeSnapshot';
import { yieldToHost } from './scheduler';
import type { LoadedSubflow, PreparedSubflow, SubflowLoadRequest } from './types';
import { admitLoaded, admitPrepared } from './prepare/admission';
import { abortError, checkSignal, invalid } from './prepare/data';

/** Canonical per-scope projection. The converter itself is one synchronous unit;
 * the task boundary lets pending paint first, not subdivide a large conversion. */
export async function prepareSubflow(value: LoadedSubflow, request: SubflowLoadRequest, options: { signal: AbortSignal }): Promise<PreparedSubflow> {
  try {
    checkSignal(options.signal);
    await yieldToHost(options.signal);
    checkSignal(options.signal);
    const loaded = admitLoaded(value, request);
    const snapshots = subflowResultToSnapshots(loaded.result, loaded.narrativeEntries ? [...loaded.narrativeEntries] : undefined);
    checkSignal(options.signal);
    return admitPrepared({ ...loaded, snapshots }, request);
  } catch { throw options.signal.aborted ? abortError() : invalid(); }
}

// Internal sibling doors; the package facade exports only the public preparation API.
export { admitGraph, admitLoaded, admitPrepared } from './prepare/admission';
export { abortError, checkSignal, copyData, invalid, own, readonlyMap } from './prepare/data';
export { sameOwnedData } from './prepare/native-equality';
