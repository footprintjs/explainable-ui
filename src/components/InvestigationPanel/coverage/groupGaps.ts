import type { Gap } from 'foottrace/cause';
import type { GapGroup } from './types';

/** Groups already admitted occurrences only; no deduplication, ranking or cross-context state. */
export function groupGaps(gaps: readonly Gap[]): readonly GapGroup[] {
  const groups = new Map<Gap['code'], Gap[]>();
  for (const entry of gaps) {
    const entries = groups.get(entry.code);
    if (entries) entries.push(entry);
    else groups.set(entry.code, [entry]);
  }
  return Object.freeze([...groups].map(([code, entries]) => Object.freeze({ code, entries: Object.freeze(entries) })));
}
