interface NativeScheduler {
  postTask(callback: () => void, options: { priority: 'background' | 'user-visible'; signal: AbortSignal }): Promise<unknown>;
}
const BACKGROUND_TIMEOUT_MS = 100;

/** One task boundary, never a microtask-only yield. Cancellation wins before invocation. */
export function scheduleTask(callback: () => void, options: { background?: boolean; signal?: AbortSignal } = {}): () => void {
  const host = globalThis as typeof globalThis & { scheduler?: NativeScheduler };
  const { signal, background = false } = options;
  if (signal?.aborted) return () => undefined;
  let finished = false, nativeCallbackThrew = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let idle: number | undefined;
  let native: AbortController | undefined;
  const clean = (fromNative = false) => {
    if (timer !== undefined) clearTimeout(timer);
    if (idle !== undefined) host.cancelIdleCallback?.(idle);
    if (!fromNative) native?.abort();
    signal?.removeEventListener('abort', cancel);
  };
  function cancel() { if (!finished) { finished = true; clean(); } }
  const run = (fromNative = false) => {
    if (finished) return;
    finished = true; clean(fromNative);
    try { callback(); } catch (error) { nativeCallbackThrew = fromNative; throw error; }
  };
  const fallback = (delay = 0) => {
    if (!finished && timer === undefined) timer = setTimeout(() => run(), delay);
  };
  signal?.addEventListener('abort', cancel, { once: true });

  if (background && typeof host.requestIdleCallback === 'function') {
    // A timer competitor also progresses when idle periods never arrive.
    fallback(BACKGROUND_TIMEOUT_MS);
    try { idle = host.requestIdleCallback(() => run(), { timeout: BACKGROUND_TIMEOUT_MS }); }
    catch { /* The already-armed timer is the fallback. */ }
  } else if (typeof host.scheduler?.postTask === 'function') {
    native = new AbortController();
    if (background) fallback(BACKGROUND_TIMEOUT_MS);
    try {
      const pending = host.scheduler.postTask(() => run(true), { priority: background ? 'background' : 'user-visible', signal: native.signal });
      Promise.resolve(pending).catch(error => {
        // Do not retry a callback which ran and failed. Match timer error delivery.
        if (nativeCallbackThrew) setTimeout(() => { throw error; }, 0);
        else if (!finished) fallback();
      });
    } catch (error) {
      if (nativeCallbackThrew) setTimeout(() => { throw error; }, 0);
      else fallback();
    }
  } else fallback(background ? BACKGROUND_TIMEOUT_MS : 0);
  return cancel;
}
