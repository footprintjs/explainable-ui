import type { InvestigationResult } from "./types";
import type { FlowDiagramRecordedRelationship } from "../GroupedFlowDiagram/types";

export type VisualInvestigationEdge = Omit<FlowDiagramRecordedRelationship, "id" | "source" | "target" | "direction"> & {
  readonly from: string; readonly to: string;
};
/** Internal visualization projection. The published text port remains unchanged. */
export type VisualInvestigationResult = Omit<InvestigationResult, "impact" | "backward"> & {
  readonly backward?: { readonly nodes: readonly string[]; readonly edges: readonly VisualInvestigationEdge[];
    readonly confidence: InvestigationResult["confidence"]; readonly gaps: InvestigationResult["gaps"] };
  readonly impact: InvestigationResult["impact"] & { readonly edges?: readonly VisualInvestigationEdge[] };
};
