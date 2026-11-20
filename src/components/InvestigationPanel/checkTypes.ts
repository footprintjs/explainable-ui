import type { CauseResult } from "foottrace/cause";
import type { VisualInvestigationEdge } from "./visualTypes";

// Only fields retained by UI admission. Do not expose unused external graph models.
type DisplayAttention = Pick<CauseResult["attention"][number], "kind" | "reason" | "evidence">;
type DisplayGap = Pick<CauseResult["gaps"][number], "code" | "nodeId" | "evidence">;
type DisplayEdge = Pick<VisualInvestigationEdge, "from" | "to" | "kind" | "attribution" | "evidence">;
type DisplayCoverage = {
  readonly confidence: CauseResult["confidence"];
  readonly gaps: readonly DisplayGap[];
};

/** Detached display projection of the bounded attention list. */
export interface InvestigationAttentionDisplay extends DisplayCoverage {
  readonly nodes: readonly {
    readonly nodeId: string;
    readonly attention: readonly DisplayAttention[];
  }[];
}

/** Text projection deliberately omits backward data and impact edges. */
export interface InvestigationTextDisplay extends DisplayCoverage {
  readonly nodeId: string;
  readonly attention: readonly DisplayAttention[];
  readonly rootCause?: string;
  readonly path: readonly string[];
  readonly alternatives: readonly string[];
  readonly impact: DisplayCoverage & { readonly nodes: readonly string[] };
}

/** Explicit relationship projection of the existing bounded visual reader. */
export interface InvestigationRelationshipDisplay extends InvestigationTextDisplay {
  readonly backward?: DisplayCoverage & {
    readonly nodes: readonly string[];
    readonly edges: readonly DisplayEdge[];
  };
  readonly impact: InvestigationTextDisplay["impact"] & {
    readonly edges?: readonly DisplayEdge[];
  };
}
