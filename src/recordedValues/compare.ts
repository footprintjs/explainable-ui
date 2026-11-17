import { copyOwnedData } from './native-copy';
import { sameOwnedData } from './native-equality';

export type RecordedValueComparison = 'equal' | 'different' | 'unavailable';

/** Display-only comparison of complete bounded data graphs. Validate both sides
 * before a known difference: an unsupported later value makes it unavailable.
 * Reuse the admitted-data kernel rather than broadening its boolean semantics.
 * Each detached validation copy uses the existing 100,000-work-item allowance. */
export function compareRecordedValues(a: unknown, b: unknown): RecordedValueComparison {
  try {
    const left = copyOwnedData(a), right = copyOwnedData(b);
    return sameOwnedData(left, right) ? 'equal' : 'different';
  } catch { return 'unavailable'; }
}
