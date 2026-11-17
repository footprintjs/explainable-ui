import { scheduleTask } from './task';

function cancelled(): Error { const error = new Error('Preparation was cancelled.'); error.name = 'AbortError'; return error; }

/** A real foreground task boundary with cooperative cancellation. */
export function yieldToHost(signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) return Promise.reject(cancelled());
  return new Promise((resolve, reject) => {
    let finished = false;
    let cancel: () => void = () => undefined;
    const abort = () => {
      if (finished) return;
      finished = true; cancel(); signal?.removeEventListener('abort', abort); reject(cancelled());
    };
    signal?.addEventListener('abort', abort, { once: true });
    cancel = scheduleTask(() => {
      if (finished) return;
      finished = true; signal?.removeEventListener('abort', abort); resolve();
    }, { signal });
  });
}
