import type { InvestigationRelationshipDisplay } from '../checkTypes';

export type CoverageGap = InvestigationRelationshipDisplay['gaps'][number];

/** Private presentation contexts, not producer gap directions or graph evidence. */
export type CoverageContext = 'attention' | 'overall' | 'backward' | 'impact';
export interface SuppliedCoverage {
  readonly confidence: 'complete' | 'incomplete';
  readonly gaps: readonly CoverageGap[];
}
export interface CoverageSectionProps {
  readonly context: CoverageContext;
  readonly coverage?: SuppliedCoverage;
}
export interface GapGroup {
  readonly code: CoverageGap['code'];
  readonly entries: readonly CoverageGap[];
}
export interface RootCoverageEvidence {
  readonly rootCause?: string;
  readonly backward?: SuppliedCoverage;
}
