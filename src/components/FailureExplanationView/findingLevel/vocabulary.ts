const findingLevels = Object.freeze(['HIGH', 'MEDIUM', 'LOW', 'UNVERIFIED'] as const);

/** Host-declared display assessment; no inference, ranking or verification. */
export type FindingLevel = typeof findingLevels[number];

/** Exact primitive-string membership; caller objects are never inspected or coerced. */
export function isFindingLevel(value: unknown): value is FindingLevel {
  return typeof value === 'string' && findingLevels.includes(value as FindingLevel);
}
