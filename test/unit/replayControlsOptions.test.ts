import { describe, expect, it, vi } from 'vitest';
import { resolveReplayControlsOptions } from '../../src/components/TimeTravelControls';

describe('shared replay policy resolver', () => {
  it('admits duration geometry separately from presentation and replay pace', () => {
    expect(resolveReplayControlsOptions({ scale: 'log-duration', presentation: 'segmented', intervalMs: 700 }, { presentation: 'range' }))
      .toMatchObject({ scale: 'log-duration', presentation: 'range', intervalMs: 700 });
    expect(resolveReplayControlsOptions({ scale: 'log-duration' }, { scale: 'steps' }).scale).toBe('steps');
    expect(() => resolveReplayControlsOptions({ scale: 'bytes' })).toThrow(/unknown scale/);
    const getter = vi.fn();
    expect(() => resolveReplayControlsOptions(Object.defineProperty({}, 'scale', { get: getter }))).toThrow(/plain data/);
    expect(getter).not.toHaveBeenCalled();
  });
  it('overrides individual JSON fields without resetting other presentation and visibility choices', () => {
    const json = Object.freeze({ presentation: 'range', previousNext: false, playPause: false, intervalMs: 650 });
    const explicit = Object.freeze({ previousNext: true, intervalMs: undefined, slider: false });
    expect(resolveReplayControlsOptions(json, explicit)).toEqual({ presentation: 'range', previousNext: true,
      playPause: false, intervalMs: 650, slider: false });
    expect(resolveReplayControlsOptions(json, { presentation: 'segmented', intervalMs: 1200 }).presentation).toBe('segmented');
    expect(Object.isFrozen(resolveReplayControlsOptions(json, explicit))).toBe(true);
  });

  it('retains finite pacing values for the existing playback clamp and accepts null-prototype data', () => {
    expect(resolveReplayControlsOptions({ intervalMs: -1 }).intervalMs).toBe(-1);
    expect(resolveReplayControlsOptions(Object.assign(Object.create(null), { presentation: 'range', intervalMs: 99999 }))).toEqual({ presentation: 'range', intervalMs: 99999 });
    expect(() => resolveReplayControlsOptions({}, { presentation: 'Range' })).toThrow(/^Invalid replay controls:/);
  });

  it('ignores unknown getters without invoking them and refuses known explicit accessors', () => {
    const getter = vi.fn(() => 'range');
    expect(resolveReplayControlsOptions(Object.defineProperty({ slider: false }, 'unused', { get: getter })).slider).toBe(false);
    expect(() => resolveReplayControlsOptions({}, Object.defineProperty({}, 'presentation', { get: getter }))).toThrow(/^Invalid replay controls:/);
    expect(getter).not.toHaveBeenCalled();
  });

  it('does not enumerate or read input properties through ordinary get, and owns absent fields', () => {
    const get = vi.fn(() => { throw Error('ordinary get must not run'); });
    const ownKeys = vi.fn(() => { throw Error('enumeration must not run'); });
    const value = new Proxy({ presentation: 'range' }, { get, ownKeys });
    const output = resolveReplayControlsOptions(value);
    expect(output.presentation).toBe('range'); expect(get).not.toHaveBeenCalled(); expect(ownKeys).not.toHaveBeenCalled();
    for (const key of ['previousNext', 'playPause', 'slider', 'intervalMs']) expect(Object.prototype.hasOwnProperty.call(output, key)).toBe(true);
  });

  it('refuses throwing metadata traps without inspecting the foreign thrown value', () => {
    const inspected = vi.fn();
    const failure = Object.defineProperty({}, 'message', { get: inspected });
    const value = new Proxy({}, { getPrototypeOf() { throw failure; } });
    expect(() => resolveReplayControlsOptions(value)).toThrow(/^Invalid replay controls: expected plain data\./);
    expect(inspected).not.toHaveBeenCalled();
  });
});
