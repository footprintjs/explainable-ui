import { theme } from '../../../theme/styles';
import { omittedReferenceCount, ReferenceOmissionNotice } from '../ReferenceOmissions';
import { gapMessages } from '../wording';
import { groupGaps } from './groupGaps';
import type { CoverageGap } from './types';

const codeStyle = { fontFamily: theme.fontMono };

/** Render supplied occurrences and retained references within their own scope. */
export function GroupedGapList({ gaps }: { readonly gaps: readonly CoverageGap[] }) {
  return <ul aria-label="Supplied gap groups">
    {groupGaps(gaps).map(group => {
      const occurrences = group.entries.reduce((count, entry) => count + (entry.occurrences ?? 1), 0);
      return <li key={group.code} style={{ marginBlock: 12 }}>
        <p role="status">{gapMessages[group.code]}</p>
        <p>{occurrences} supplied {occurrences === 1 ? 'entry' : 'entries'}</p>
        <ReferenceOmissionNotice count={omittedReferenceCount(group.entries)} />
        <details>
          <summary>View supplied entries for {group.code}</summary>
          <ol aria-label={`Supplied entries for ${group.code}`}>
            {group.entries.map((entry, index) => <li key={index}>
              {entry.nodeId !== undefined && <p>Supplied item ID: <code style={codeStyle}>{entry.nodeId}</code></p>}
              {entry.evidence.length > 0 ? <ul aria-label="Supplied evidence references">
                {entry.evidence.map((reference, position) => <li key={position}><code style={codeStyle}>{reference}</code></li>)}
              </ul> : entry.omittedReferences === undefined && <p>No evidence references were supplied for this entry.</p>}
              <ReferenceOmissionNotice count={entry.omittedReferences ?? 0} />
            </li>)}
          </ol>
        </details>
      </li>;
    })}
  </ul>;
}
