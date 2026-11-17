import type { Gap } from 'foottrace/cause';
import { theme } from '../../../theme/styles';
import { gapMessages } from '../wording';
import { groupGaps } from './groupGaps';

const codeStyle = { fontFamily: theme.fontMono };

/** Every supplied occurrence and duplicate reference remains available as escaped disclosure text. */
export function GroupedGapList({ gaps }: { readonly gaps: readonly Gap[] }) {
  return <ul aria-label="Supplied gap groups">
    {groupGaps(gaps).map(group => <li key={group.code} style={{ marginBlock: 12 }}>
      <p role="status">{gapMessages[group.code]}</p>
      <p>{group.entries.length} supplied {group.entries.length === 1 ? 'entry' : 'entries'}</p>
      <details>
        <summary>View supplied entries for {group.code}</summary>
        <ol aria-label={`Supplied entries for ${group.code}`}>
          {group.entries.map((entry, index) => <li key={index}>
            {entry.nodeId !== undefined && <p>Supplied item ID: <code style={codeStyle}>{entry.nodeId}</code></p>}
            {entry.evidence.length > 0 ? <ul aria-label="Supplied evidence references">
              {entry.evidence.map((reference, position) => <li key={position}><code style={codeStyle}>{reference}</code></li>)}
            </ul> : <p>No evidence references were supplied for this entry.</p>}
          </li>)}
        </ol>
      </details>
    </li>)}
  </ul>;
}
