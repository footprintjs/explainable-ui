import type { CoverageGap, GapGroup } from './types';

/** Groups already admitted occurrences only; no deduplication, ranking or cross-context state. */
export function groupGaps(gaps: readonly CoverageGap[]): readonly GapGroup[] {
  const groups = new Map<CoverageGap['code'], CoverageGap[]>();
  for (const entry of gaps) {
    const entries = groups.get(entry.code);
    if (entries) entries.push(entry);
    else groups.set(entry.code, [entry]);
  }
  return Object.freeze([...groups].map(([code, entries]) => Object.freeze({ code, entries: Object.freeze(entries) })));
}
