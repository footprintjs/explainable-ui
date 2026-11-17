import type { LoadedSubflow, PreparationWorker, PreparedSubflow, SubflowLoadRequest } from '../types';
import { preparationCancelled, preparationFailed, readWorkerMessage, workerMessage } from './protocol';

export type SubflowWorkerPreparation = ((value: LoadedSubflow, request: SubflowLoadRequest, options: { signal: AbortSignal }) => Promise<PreparedSubflow>) & { readonly dispose: () => void };
interface Pending {
  readonly signal: AbortSignal;
  readonly abort: () => void;
  readonly resolve: (value: PreparedSubflow) => void;
  readonly reject: (error: Error) => void;
}
let nextBridge = 0;

/** The supplied worker is a trusted preparation port; the source retains evidence admission. */
export function createSubflowWorkerPreparation(worker: PreparationWorker): SubflowWorkerPreparation {
  const owner = ++nextBridge;
  let nextRequest = 0, disposed = false, failed = false;
  const pending = new Map<string, Pending>();
  const cancelRemote = (id: string) => { try { worker.postMessage(workerMessage('cancel', id)); } catch { /* No error payload is exposed. */ } };
  const take = (id: string) => {
    const item = pending.get(id);
    if (item) { pending.delete(id); item.signal.removeEventListener('abort', item.abort); }
    return item;
  };
  const unreadable = () => {
    failed = true;
    for (const id of pending.keys()) take(id)?.reject(preparationFailed());
  };
  const receive = (event: MessageEvent) => {
    if (disposed || failed) return;
    let message;
    try { message = readWorkerMessage(event.data); } catch { unreadable(); return; }
    if (!message || message.type !== 'result') return;
    const item = take(message.id);
    if (!item) return;
    if (message.ok && message.value !== undefined) item.resolve(message.value as PreparedSubflow);
    else item.reject(preparationFailed());
  };
  worker.addEventListener('message', receive);
  worker.addEventListener('error', unreadable);
  worker.addEventListener('messageerror', unreadable);

  const prepare = (value: LoadedSubflow, request: SubflowLoadRequest, { signal }: { signal: AbortSignal }): Promise<PreparedSubflow> => {
    if (disposed) throw new Error('Preparation worker has been disposed.');
    if (failed) return Promise.reject(preparationFailed());
    if (signal.aborted) return Promise.reject(preparationCancelled());
    const id = `${owner}:${++nextRequest}`;
    return new Promise((resolve, reject) => {
      const abort = () => { take(id)?.reject(preparationCancelled()); cancelRemote(id); };
      pending.set(id, { signal, abort, resolve, reject });
      signal.addEventListener('abort', abort, { once: true });
      try { worker.postMessage(workerMessage('prepare', id, { value, request })); }
      catch { take(id)?.reject(preparationFailed()); }
    });
  };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    worker.removeEventListener('message', receive);
    worker.removeEventListener('error', unreadable);
    worker.removeEventListener('messageerror', unreadable);
    for (const id of pending.keys()) {
      take(id)?.reject(new Error('Preparation worker has been disposed.'));
      cancelRemote(id);
    }
  };
  return Object.freeze(Object.assign(prepare, { dispose }));
}
