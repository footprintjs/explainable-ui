import type { ReplayControlsOptions } from './replayControls';

const fields = ['previousNext', 'playPause', 'slider', 'intervalMs', 'presentation', 'scale'] as const;
function invalid(reason: string): never { throw new Error(`Invalid replay controls: ${reason}`); }
function record(input: unknown): object | undefined {
  if (input === undefined) return undefined;
  let prototype;
  try { prototype = input && typeof input === 'object' ? Object.getPrototypeOf(input) : undefined; }
  catch { return invalid('expected plain data.'); }
  if (!input || typeof input !== 'object' || Array.isArray(input) ||
    (prototype !== Object.prototype && prototype !== null)) invalid('expected plain data.');
  return input;
}
function field(input: object | undefined, key: typeof fields[number]): unknown {
  if (!input) return undefined;
  let descriptor;
  try { descriptor = Object.getOwnPropertyDescriptor(input, key); }
  catch { return invalid(`${key} must be plain data.`); }
  if (descriptor && !('value' in descriptor)) invalid(`${key} must be plain data.`);
  const value = descriptor?.value;
  if (value !== undefined) {
    if (key === 'presentation') {
      if (value !== 'range' && value !== 'segmented') invalid('unknown presentation.');
    } else if (key === 'scale') {
      if (value !== 'steps' && value !== 'duration' && value !== 'log-duration') invalid('unknown scale.');
    } else if (key === 'intervalMs') {
      if (typeof value !== 'number' || !Number.isFinite(value)) invalid('intervalMs must be finite.');
    } else if (typeof value !== 'boolean') invalid(`${key} must be boolean.`);
  }
  return value;
}

/** Plain JSON policy first; explicitly defined props override individual fields. @internal */
export function resolveReplayControlsOptions(json?: unknown, explicit?: unknown): ReplayControlsOptions {
  const stored = record(json), props = record(explicit);
  const result: Record<string, unknown> = {};
  for (const key of fields) {
    const fallback = field(stored, key), override = field(props, key);
    // Own undefined fields also keep inherited optional getters out of rendering.
    Object.defineProperty(result, key, { value: override === undefined ? fallback : override, enumerable: true });
  }
  return Object.freeze(result) as ReplayControlsOptions;
}
