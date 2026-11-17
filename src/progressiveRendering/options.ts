import type { ProgressiveRenderingOptions } from './types';
export function resolveProgressiveRenderingOptions(input: unknown): ProgressiveRenderingOptions {
  if (input === undefined) return {};
  if (!input || typeof input !== 'object' || Array.isArray(input) ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(input))) throw new Error('Invalid rendering options: expected plain data.');
  const read = (key: string) => {
    const d = Object.getOwnPropertyDescriptor(input, key);
    if (d && !('value' in d)) throw new Error('Invalid rendering options: accessors are unsupported.');
    return d?.value;
  };
  const loadingIndicator = read('loadingIndicator'), prefetch = read('prefetch');
  if (loadingIndicator !== undefined && !['skeleton', 'spinner', 'text'].includes(loadingIndicator))
    throw new Error('Invalid rendering options: unknown loadingIndicator.');
  if (prefetch !== undefined && !['none', 'idle'].includes(prefetch))
    throw new Error('Invalid rendering options: unknown prefetch.');
  return { ...(loadingIndicator !== undefined && { loadingIndicator }), ...(prefetch !== undefined && { prefetch }) };
}
