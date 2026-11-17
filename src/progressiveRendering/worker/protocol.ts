const PROTOCOL = 'fp-subflow-prepare:1';
export interface WorkerMessage {
  readonly type: 'prepare' | 'cancel' | 'result';
  readonly id: string;
  readonly value?: unknown;
  readonly request?: unknown;
  readonly ok?: boolean;
}
function field(value: object, key: string): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  return descriptor && 'value' in descriptor ? descriptor.value : undefined;
}
/** Inspect only fixed wire metadata; foreign exception/error text is never read. */
export function readWorkerMessage(value: unknown): WorkerMessage | undefined {
  try {
    if (!value || typeof value !== 'object' || field(value, 'protocol') !== PROTOCOL) return;
    const type = field(value, 'type'), id = field(value, 'id');
    if ((type !== 'prepare' && type !== 'cancel' && type !== 'result') || typeof id !== 'string' || !id.length || id.length > 64) return;
    if (type === 'cancel') return { type, id };
    if (type === 'prepare') return { type, id, value: field(value, 'value'), request: field(value, 'request') };
    const ok = field(value, 'ok') === true;
    return { type, id, ok, ...(ok ? { value: field(value, 'value') } : {}) };
  } catch { return; }
}
export function workerMessage(type: WorkerMessage['type'], id: string, fields?: { value?: unknown; request?: unknown; ok?: boolean }): object {
  return Object.freeze({ protocol: PROTOCOL, type, id, ...fields });
}
export function preparationFailed(): Error { return new Error('Subflow preparation could not be completed.'); }
export function preparationCancelled(): Error { const error = new Error('Preparation was cancelled.'); error.name = 'AbortError'; return error; }
