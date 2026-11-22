import type { InvestigationResult } from "./types";
import type { FlowDiagramRecordedRelationship } from "../GroupedFlowDiagram/types";
import type { EvidenceOmissions } from "./checkTypes";

export type VisualInvestigationEdge = Omit<FlowDiagramRecordedRelationship, "id" | "source" | "target" | "direction"> & EvidenceOmissions & {
  readonly from: string; readonly to: string;
};
/** The visualization can additionally retain bounded impact relationships. */
export type VisualInvestigationResult = Omit<InvestigationResult, "impact"> & {
  readonly impact: InvestigationResult["impact"] & { readonly edges?: readonly VisualInvestigationEdge[] };
};
