import type { CSSProperties } from 'react';
import type { ExplanationText } from '../../displayAdmission/explanationText';
import type { FindingLevel } from './findingLevel';

/** Display projection only. The host admits and binds the underlying evidence. */
export interface FailureExplanationDisplaySection {
  /** Canonical admitted wording, retained even when business guidance is supplied. */
  readonly text: ExplanationText;
  readonly configuredText?: ExplanationText;
  readonly wordingSource: 'default' | 'configured';
  /** Opaque text references, never URLs or navigation authority. */
  readonly evidenceRefs: readonly string[];
}

/** A canonical recorded finding, never configured advice or execution authority. */
export interface FailureExplanationDisplayFinding {
  readonly code: string;
  readonly summary: ExplanationText;
  readonly evidenceRefs: readonly string[];
  /** Host-declared display assessment; never inferred confidence or verification. */
  readonly level?: FindingLevel;
}

/** Structurally accepts a formatted Blueprint explanation without a runtime dependency. */
export interface FailureExplanationDisplay {
  readonly problem: FailureExplanationDisplaySection;
  readonly recordedCause: FailureExplanationDisplaySection;
  readonly suggestedNextStep: FailureExplanationDisplaySection;
  readonly unknowns: readonly ExplanationText[];
  readonly canonicalFindings: {
    readonly causes: readonly FailureExplanationDisplayFinding[];
    readonly consequences: readonly FailureExplanationDisplayFinding[];
    readonly diagnosticFailures: readonly FailureExplanationDisplayFinding[];
  };
}

export interface FailureExplanationViewProps {
  /** Replace or clear this result whenever the selected recording/item changes. */
  readonly explanation?: FailureExplanationDisplay | null;
  /** Host-authored statement for this selection's empty unknowns list. */
  readonly emptyUnknownsText?: string;
  readonly className?: string;
  readonly style?: CSSProperties;
}
