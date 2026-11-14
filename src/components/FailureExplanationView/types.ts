import type { CSSProperties } from 'react';

/** Display projection only. The host admits and binds the underlying evidence. */
export interface FailureExplanationDisplaySection {
  /** Canonical admitted wording, retained even when business guidance is supplied. */
  readonly text: string;
  readonly configuredText?: string;
  readonly wordingSource: 'default' | 'configured';
  /** Opaque text references, never URLs or navigation authority. */
  readonly evidenceRefs: readonly string[];
}

/** Structurally accepts a formatted Blueprint explanation without a runtime dependency. */
export interface FailureExplanationDisplay {
  readonly problem: FailureExplanationDisplaySection;
  readonly recordedCause: FailureExplanationDisplaySection;
  readonly suggestedNextStep: FailureExplanationDisplaySection;
  readonly unknowns: readonly string[];
}

export interface FailureExplanationViewProps {
  /** Replace or clear this result whenever the selected recording/item changes. */
  readonly explanation?: FailureExplanationDisplay | null;
  readonly className?: string;
  readonly style?: CSSProperties;
}
