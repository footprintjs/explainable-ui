import type { RootCoverageEvidence } from './types';

/** Presentation of an already admitted explicit root; no discovery, ranking or forward-coverage inference. */
export function supportsRecordedRoot(result: RootCoverageEvidence): boolean {
  return typeof result.rootCause === 'string' && result.rootCause.length > 0
    && result.backward?.confidence === 'complete' && result.backward.gaps.length === 0;
}
