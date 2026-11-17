import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { scheduleTask, scheduleVisual, yieldToHost } from '../../src/progressiveRendering/scheduler';

beforeEach(() => { vi.useFakeTimers(); vi.stubGlobal('scheduler', undefined); vi.stubGlobal('requestIdleCallback', undefined); vi.stubGlobal('cancelIdleCallback', undefined); vi.stubGlobal('requestAnimationFrame', undefined); vi.stubGlobal('cancelAnimationFrame', undefined); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('progressive scheduling boundaries', () => {
  it('yields past microtasks before foreground work runs', async () => {
    const callback = vi.fn(); scheduleTask(callback);
    await Promise.resolve(); vi.runAllTicks();
    expect(callback).not.toHaveBeenCalled();
    vi.runAllTimers(); expect(callback).toHaveBeenCalledTimes(1);
  });
  it('cancels pending task work and honors an already aborted signal', () => {
    const callback = vi.fn(), control = new AbortController();
    const cancel = scheduleTask(callback); cancel(); cancel();
    scheduleTask(callback, { signal: control.signal }); control.abort();
    scheduleTask(callback, { signal: control.signal });
    vi.runAllTimers(); vi.runAllTicks(); expect(callback).not.toHaveBeenCalled();
  });
  it('uses native prioritized tasks and cancels their pending signal', async () => {
    let run!: () => void; let signal!: AbortSignal;
    const postTask = vi.fn((callback: () => void, options: { signal: AbortSignal; priority: string }) => { run = callback; signal = options.signal; return Promise.resolve(); });
    vi.stubGlobal('scheduler', { postTask });
    const callback = vi.fn(); const cancel = scheduleTask(callback);
    expect(postTask).toHaveBeenCalledOnce(); expect(postTask.mock.calls[0][1].priority).toBe('user-visible');
    cancel(); expect(signal.aborted).toBe(true); run(); await Promise.resolve(); expect(callback).not.toHaveBeenCalled();
  });
  it('falls back once when native scheduling rejects or throws', async () => {
    const callback = vi.fn();
    vi.stubGlobal('scheduler', { postTask: () => Promise.reject(new Error('native failure')) });
    scheduleTask(callback); await Promise.resolve(); vi.runAllTimers(); expect(callback).toHaveBeenCalledTimes(1);
    vi.stubGlobal('scheduler', { postTask: () => { throw new Error('unavailable'); } });
    scheduleTask(callback); vi.runAllTimers(); expect(callback).toHaveBeenCalledTimes(2);
  });
  it('makes background progress even if the idle callback never arrives', () => {
    const idle = vi.fn((_callback: () => void, _options: { timeout: number }) => 7), cancelIdle = vi.fn();
    vi.stubGlobal('requestIdleCallback', idle); vi.stubGlobal('cancelIdleCallback', cancelIdle);
    const callback = vi.fn(); scheduleTask(callback, { background: true });
    expect(idle.mock.calls[0][1]).toHaveProperty('timeout');
    vi.runAllTimers(); expect(callback).toHaveBeenCalledTimes(1); expect(cancelIdle).toHaveBeenCalledWith(7);
    idle.mock.calls[0][0](); expect(callback).toHaveBeenCalledTimes(1);
  });
  it('cancels idle and timeout competitors together', () => {
    let idle!: () => void; const cancelled = vi.fn();
    vi.stubGlobal('requestIdleCallback', (callback: () => void) => { idle = callback; return 3; });
    vi.stubGlobal('cancelIdleCallback', cancelled);
    const callback = vi.fn(); const cancel = scheduleTask(callback, { background: true }); cancel();
    idle(); vi.runAllTimers(); expect(callback).not.toHaveBeenCalled(); expect(cancelled).toHaveBeenCalledWith(3);
  });
  it('bounds background waiting when native low-priority work is starved', () => {
    let native!: () => void; let signal!: AbortSignal;
    vi.stubGlobal('scheduler', { postTask(callback: () => void, options: { signal: AbortSignal }) {
      native = callback; signal = options.signal; return new Promise(() => undefined);
    } });
    const callback = vi.fn(); scheduleTask(callback, { background: true });
    vi.runAllTimers(); expect(callback).toHaveBeenCalledTimes(1); expect(signal.aborted).toBe(true);
    native(); expect(callback).toHaveBeenCalledTimes(1);
  });
  it('publishes once through rAF and cancels its timer competitor', () => {
    let frame!: FrameRequestCallback; const cancelFrame = vi.fn();
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { frame = callback; return 8; });
    vi.stubGlobal('cancelAnimationFrame', cancelFrame);
    const callback = vi.fn(); scheduleVisual(callback); expect(callback).not.toHaveBeenCalled();
    frame(0); vi.runAllTimers(); expect(callback).toHaveBeenCalledTimes(1);
  });
  it('progresses in hidden documents without waiting for rAF', () => {
    vi.stubGlobal('document', { hidden: true }); const raf = vi.fn(() => 8);
    vi.stubGlobal('requestAnimationFrame', raf);
    const callback = vi.fn(); scheduleVisual(callback); vi.runAllTimers();
    expect(callback).toHaveBeenCalledTimes(1); expect(raf).not.toHaveBeenCalled();
  });
  it('has a timer fallback when a scheduled frame is suspended', () => {
    let frame!: FrameRequestCallback; const cancelled = vi.fn();
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { frame = callback; return 8; });
    vi.stubGlobal('cancelAnimationFrame', cancelled);
    const callback = vi.fn(); scheduleVisual(callback); vi.runAllTimers(); frame(0);
    expect(callback).toHaveBeenCalledTimes(1); expect(cancelled).toHaveBeenCalledWith(8);
  });
  it('cancels frame and timer competitors without a second callback', () => {
    let frame!: FrameRequestCallback;
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { frame = callback; return 8; });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    const callback = vi.fn(); const cancel = scheduleVisual(callback); cancel(); frame(0); vi.runAllTimers();
    expect(callback).not.toHaveBeenCalled();
  });
  it('yields with task fallback and rejects a cancelled yield', async () => {
    let continued = false; const pending = yieldToHost().then(() => { continued = true; });
    await Promise.resolve(); vi.runAllTicks(); expect(continued).toBe(false);
    vi.runAllTimers(); await pending; expect(continued).toBe(true);
    const control = new AbortController(); const cancelled = yieldToHost(control.signal);
    const assertion = expect(cancelled).rejects.toMatchObject({ name: 'AbortError' }); control.abort(); await assertion;
  });
  it('supports cancelled yields without browser-only exception globals', async () => {
    vi.stubGlobal('DOMException', undefined);
    const control = new AbortController(); control.abort();
    await expect(yieldToHost(control.signal)).rejects.toMatchObject({ name: 'AbortError' });
  });
});
