import { Fragment } from 'react';
import type { CSSProperties } from 'react';
import type { ExplanationLabel } from '../displayAdmission/explanationText';
import { theme } from '../theme/styles';

const quoteStyle: CSSProperties = {
  display: 'inline-block',
  maxInlineSize: '100%',
  boxSizing: 'border-box',
  paddingInline: '0.2em',
  border: `1px solid ${theme.border}`,
  borderRadius: '0.2em',
  whiteSpace: 'normal',
  overflowWrap: 'anywhere',
  unicodeBidi: 'isolate',
};

/** Accepts only text already detached by display admission. */
export function renderExplanationText(value: ExplanationLabel) {
  if (typeof value === 'string') return value;
  if ('fallback' in value) {
    const reason = value.diagnostic.code === 'limit-exceeded'
      ? 'Record quotation exceeds the display limit.'
      : 'Record quotation is unavailable because it is malformed.';
    return <>{value.fallback}{' '}<span data-part="record-quote-refusal">{reason}</span></>;
  }
  return value.map((part, index) => part.quote
    ? <q key={index} data-part="record-quote" role="group" aria-label="Recorded quotation" dir="ltr" style={quoteStyle}>
        <bdi>{part.text}</bdi>
      </q>
    : <Fragment key={index}>{part.text}</Fragment>);
}
