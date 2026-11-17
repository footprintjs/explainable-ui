import { prepareSubflow } from '../prepare';
import type { LoadedSubflow, PreparationWorker, SubflowLoadRequest } from '../types';
import { readWorkerMessage, workerMessage } from './protocol';

/** Install inside the host's worker. Uses the same canonical converter as default preparation. */
export function attachSubflowWorker(port: PreparationWorker): () => void {
  let disposed = false;
  const active = new Map<string, AbortController>();
  const send = (message: object) => { try { port.postMessage(message); } catch { /* A closed port cannot receive recovery. */ } };
  const receive = (event: MessageEvent) => {
    if (disposed) return;
    let message;
    try { message = readWorkerMessage(event.data); } catch { return; }
    if (!message) return;
    if (message.type === 'cancel') { active.get(message.id)?.abort(); active.delete(message.id); return; }
    if (message.type !== 'prepare' || active.has(message.id)) return;
    const { id } = message;
    const control = new AbortController(); active.set(id, control);
    const current = () => !disposed && !control.signal.aborted && active.get(id) === control;
    Promise.resolve().then(() => {
      if (!current()) return;
      return prepareSubflow(message.value as LoadedSubflow, message.request as SubflowLoadRequest, { signal: control.signal });
    }).then(value => {
      if (!current()) return;
      try { port.postMessage(workerMessage('result', id, { ok: true, value })); }
      catch { send(workerMessage('result', id, { ok: false })); }
    }, () => {
      if (current()) send(workerMessage('result', id, { ok: false }));
    }).finally(() => { if (active.get(id) === control) active.delete(id); });
  };
  port.addEventListener('message', receive);
  return () => {
    if (disposed) return;
    disposed = true; port.removeEventListener('message', receive);
    for (const control of active.values()) control.abort();
    active.clear();
  };
}
