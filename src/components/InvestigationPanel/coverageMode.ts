import type { InvestigationPanelProps } from './types';

/** Closed host presentation setting; no coercion or silent fallback for invalid input. */
export function resolveCoverageMode(value: unknown): InvestigationPanelProps['coverageMode'] {
  if (value === undefined) return 'overall';
  return value === 'overall' || value === 'directional' ? value : undefined;
}
