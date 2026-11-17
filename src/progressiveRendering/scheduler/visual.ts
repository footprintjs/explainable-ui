const FRAME_FALLBACK_MS = 100;

/** Publish a bounded ready cohort once, including when frames are suspended. */
export function scheduleVisual(callback: () => void): () => void {
  const host = globalThis;
  let finished = false;
  let frame: number | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const clean = () => {
    if (timer !== undefined) clearTimeout(timer);
    if (frame !== undefined) host.cancelAnimationFrame?.(frame);
  };
  const run = () => { if (!finished) { finished = true; clean(); callback(); } };
  const hidden = typeof document !== 'undefined' && document.hidden;
  timer = setTimeout(run, hidden ? 0 : FRAME_FALLBACK_MS);
  if (!hidden && typeof host.requestAnimationFrame === 'function') {
    try { frame = host.requestAnimationFrame(run); } catch { /* Timer remains armed. */ }
  } else {
    clearTimeout(timer); timer = setTimeout(run, 0);
  }
  return () => { if (!finished) { finished = true; clean(); } };
}
