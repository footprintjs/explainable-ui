import type { CauseResult } from "foottrace/cause";
import type { DisplayCheckResult } from "../../displayAdmission";
import type { VisualInvestigationEdge } from "./visualTypes";

// Only fields retained by UI admission. Do not expose unused external graph models.
type DisplayAttention = Pick<CauseResult["attention"][number], "kind" | "reason" | "evidence">;
type DisplayGap = Pick<CauseResult["gaps"][number], "code" | "nodeId" | "evidence">;
/** A display-only count on the evidence row whose references were cut. */
export interface EvidenceOmissions { readonly omittedReferences?: number }
type ExplanationGap = DisplayGap & EvidenceOmissions & { readonly occurrences?: number };
/** Success reports the total omitted count for this projection, including zero. */
export type FitInvestigationExplanationResult<T> =
  | (Extract<DisplayCheckResult<T>, { ok: true }> & { readonly omittedReferences: number })
  | Extract<DisplayCheckResult<T>, { ok: false }>;

type DisplayEdge = Pick<VisualInvestigationEdge, "from" | "to" | "kind" | "attribution" | "evidence"> & EvidenceOmissions;
type DisplayCoverage<G = DisplayGap> = {
  readonly confidence: CauseResult["confidence"];
  readonly gaps: readonly G[];
};

/** Detached display projection of the bounded attention list. */
export interface InvestigationAttentionDisplay extends DisplayCoverage {
  readonly nodes: readonly {
    readonly nodeId: string;
    readonly attention: readonly DisplayAttention[];
  }[];
}

/** Text projection deliberately omits backward data and impact edges. */
export interface InvestigationTextDisplay extends DisplayCoverage<ExplanationGap> {
  readonly nodeId: string;
  readonly attention: readonly (DisplayAttention & EvidenceOmissions)[];
  readonly rootCause?: string;
  readonly path: readonly string[];
  readonly alternatives: readonly string[];
  readonly impact: DisplayCoverage<ExplanationGap> & { readonly nodes: readonly string[] };
}

/** Explicit relationship projection of the existing bounded visual reader. */
export interface InvestigationRelationshipDisplay extends InvestigationTextDisplay {
  readonly backward?: DisplayCoverage<ExplanationGap> & {
    readonly nodes: readonly string[];
    readonly edges: readonly DisplayEdge[];
  };
  readonly impact: InvestigationTextDisplay["impact"] & {
    readonly edges?: readonly DisplayEdge[];
  };
}
