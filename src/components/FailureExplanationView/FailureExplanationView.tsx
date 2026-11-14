import { useId } from 'react';
import type { CSSProperties } from 'react';
import { theme } from '../../theme/styles';
import { admitFailureExplanation } from './admission';
import type { FailureExplanationDisplayFinding, FailureExplanationViewProps } from './types';

const box: CSSProperties = {
  color: theme.textPrimary, background: theme.bg, border: `1px solid ${theme.border}`,
  borderRadius: theme.radius, padding: 20, fontFamily: theme.fontSans, lineHeight: 1.6,
  minWidth: 0, overflowWrap: 'anywhere',
};
const card: CSSProperties = {
  minWidth: 0, padding: 16, border: `1px solid ${theme.border}`,
  borderRadius: theme.radius, background: theme.bgElevated,
};
const titles = ['Problem', 'Recorded cause', 'Suggested next step'] as const;

function FindingList({ findings }: { findings: readonly FailureExplanationDisplayFinding[] }) {
  return <ul>{findings.map((finding, index) => (
    <li key={index} style={{ marginBlock: 12 }}>
      <code style={{ color: theme.textSecondary, fontSize: 12 }}>{finding.code}</code>
      <p style={{ whiteSpace: 'pre-wrap', marginBlock: 6 }}>{finding.summary}</p>
      {finding.evidenceRefs.length > 0 && <details>
        <summary>Recorded references</summary>
        <ul>{finding.evidenceRefs.map((reference, number) => <li key={number}><code>{reference}</code></li>)}</ul>
      </details>}
    </li>
  ))}</ul>;
}

/** Optional presentation only: no diagnosis, graph traversal, storage query or executable advice. */
export function FailureExplanationView(props: FailureExplanationViewProps) {
  const id = useId();
  const model = admitFailureExplanation(props.explanation);
  if (!model) return (
    <section aria-label="Recorded failure explanation" className={props.className} style={{ ...box, ...props.style }}>
      <p role="status">Explanation is unavailable. The cause and outcome remain unknown. Reload the recording or ask an administrator to check it.</p>
    </section>
  );
  const sections = [model.problem, model.recordedCause, model.suggestedNextStep];
  return (
    <section aria-label="Recorded failure explanation" className={props.className} style={{ ...box, ...props.style }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 16rem), 1fr))', gap: 12 }}>
        {sections.map((section, index) => (
          <section key={index} aria-labelledby={`${id}-${index}`} style={card}>
            <h3 id={`${id}-${index}`} style={{ marginBlockStart: 0, fontSize: 16 }}>{titles[index]}</h3>
            <p style={{ whiteSpace: 'pre-wrap' }}>{section.text}</p>
            {section.configuredText !== undefined && (
              <div style={{ borderInlineStart: `3px solid ${theme.primary}`, paddingInlineStart: 12 }}>
                <p style={{ color: theme.textSecondary, marginBlockEnd: 4, fontSize: 12 }}>Business guidance</p>
                <p style={{ marginBlockStart: 0, whiteSpace: 'pre-wrap' }}>{section.configuredText}</p>
              </div>
            )}
            {section.evidenceRefs.length > 0 && (
              <details>
                <summary style={{ color: theme.textSecondary, cursor: 'pointer' }}>Recorded references</summary>
                <ul>{section.evidenceRefs.map((reference, number) => <li key={number}><code>{reference}</code></li>)}</ul>
              </details>
            )}
            {index === 1 && model.canonicalFindings.causes.length > 0 && <details>
              <summary>Recorded cause details</summary>
              <FindingList findings={model.canonicalFindings.causes} />
            </details>}
          </section>
        ))}
      </div>
      {model.canonicalFindings.consequences.length > 0 && (
        <section aria-labelledby={`${id}-outcomes`} style={{ ...card, marginBlockStart: 12 }}>
          <h3 id={`${id}-outcomes`} style={{ marginBlockStart: 0, fontSize: 16 }}>Other recorded outcomes</h3>
          <FindingList findings={model.canonicalFindings.consequences} />
        </section>
      )}
      {model.canonicalFindings.diagnosticFailures.length > 0 && (
        <section aria-labelledby={`${id}-recording`} style={{ ...card, marginBlockStart: 12, borderInlineStart: `3px solid ${theme.warning}` }}>
          <h3 id={`${id}-recording`} style={{ marginBlockStart: 0, fontSize: 16 }}>Recording problems</h3>
          <FindingList findings={model.canonicalFindings.diagnosticFailures} />
        </section>
      )}
      <section aria-labelledby={`${id}-unknowns`} style={{ ...card, marginBlockStart: 12, borderInlineStart: `3px solid ${theme.warning}` }}>
        <h3 id={`${id}-unknowns`} style={{ marginBlockStart: 0, fontSize: 16 }}>Still unknown</h3>
        {model.unknowns.length > 0
          ? <ul>{model.unknowns.map((unknown, index) => <li key={index}>{unknown}</li>)}</ul>
          : <p>No additional unknowns were supplied. This view does not verify the underlying evidence.</p>}
      </section>
    </section>
  );
}
