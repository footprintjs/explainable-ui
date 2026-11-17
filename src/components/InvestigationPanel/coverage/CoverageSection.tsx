import { useId } from 'react';
import { GroupedGapList } from './GroupedGapList';
import type { CoverageContext, CoverageSectionProps } from './types';

const headings: Readonly<Record<CoverageContext, string>> = {
  attention: 'Attention evidence coverage',
  overall: 'Overall reported coverage; direction not supplied',
  backward: 'Backward evidence coverage',
  impact: 'Affected-item coverage',
};
const absent: Readonly<Record<CoverageContext, string>> = {
  attention: 'Attention evidence coverage was not supplied. Coverage remains unknown.',
  overall: 'Overall evidence coverage was not supplied. Coverage remains unknown.',
  backward: 'Backward evidence was not supplied. Backward coverage remains unknown.',
  impact: 'Affected-item coverage was not supplied. Unlisted effects remain unknown.',
};

/** Confidence and gaps are source-reported, never a completeness verdict inferred by this view. */
export function CoverageSection({ context, coverage }: CoverageSectionProps) {
  const headingId = useId();
  return <section aria-labelledby={headingId} style={{ marginBlock: 16 }}>
    <h4 id={headingId}>{headings[context]}</h4>
    {coverage === undefined ? <p role="status">{absent[context]}</p> : <>
      <p>Source-reported confidence: {coverage.confidence}.</p>
      {coverage.confidence === 'incomplete' && <p role="status">The supplied coverage is incomplete. Unreported evidence remains unknown.</p>}
      {coverage.gaps.length > 0 ? <GroupedGapList gaps={coverage.gaps} />
        : <p>No gap entries were supplied. This does not verify completeness.</p>}
    </>}
  </section>;
}
