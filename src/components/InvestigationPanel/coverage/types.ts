import type { Gap } from 'foottrace/cause';

/** Private presentation contexts, not producer gap directions or graph evidence. */
export type CoverageContext = 'attention' | 'overall' | 'backward' | 'impact';
export interface SuppliedCoverage {
  readonly confidence: 'complete' | 'incomplete';
  readonly gaps: readonly Gap[];
}
export interface CoverageSectionProps {
  readonly context: CoverageContext;
  readonly coverage?: SuppliedCoverage;
}
export interface GapGroup {
  readonly code: Gap['code'];
  readonly entries: readonly Gap[];
}
export interface RootCoverageEvidence {
  readonly rootCause?: string;
  readonly backward?: SuppliedCoverage;
}
