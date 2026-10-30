import type { VisualInvestigationResult } from "../InvestigationPanel/visualTypes";
import { displayLabel } from "../InvestigationPanel/admission";

/** Folded, bounded evidence makes parallel relationships readable without merging their meaning. */
export function DependencyEvidence({ result, direction, labels }: { result: VisualInvestigationResult; direction: "cause" | "impact"; labels: unknown }) {
  const source = direction === "cause" ? result.backward : result.impact;
  if (!source?.edges) return null;
  return <details>
    <summary>Recorded dependency evidence ({source.edges.length})</summary>
    <p>These are the returned relationships, including references outside this diagram. Names do not establish identity or a cause.</p>
    <ol>{source.edges.slice(0, 64).map((edge, index) => <li key={index}>
      <span>{displayLabel(labels, edge.from)} → {displayLabel(labels, edge.to)} · {edge.kind} · {edge.attribution}</span>
      <ul>{edge.evidence.map((reference, at) => <li key={at}>{reference}</li>)}</ul>
    </li>)}</ol>
    {source.edges.length > 64 && <p>{source.edges.length - 64} additional relationships are retained in the admitted result and not expanded here.</p>}
    {!source.edges.length && <p>No relationships were returned for this direction. This is not evidence of success or absence of external effects.</p>}
  </details>;
}
