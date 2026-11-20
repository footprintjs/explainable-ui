import type { CSSProperties } from "react";
import type { ExplanationText } from "../../displayAdmission/explanationText";
import type {
  AttentionListResult,
  CauseResult,
  GraphContext,
  ImpactResult,
  NodeId,
} from "foottrace/cause";

/** Canonical display projection: unused graph edges stay with the host and may evolve independently. */
export type InvestigationResult = Pick<CauseResult,
  "nodeId" | "attention" | "rootCause" | "path" | "alternatives" | "confidence" | "gaps"
> & {
  readonly impact: Omit<ImpactResult, "edges">;
};

/** The host binds authorization, run, tenant, storage, exact invocation/attempt/visit, and query budgets. */
export interface InvestigationPort {
  /** Replace this identity whenever any bound source or selected execution changes. Never reuse it across runs. */
  readonly binding: object;
  /** Bounded canonical attention results, prepared by the host without an eager UI graph query. */
  readonly attention: AttentionListResult;
  /** Optional display names only; all selections and requests retain the opaque canonical node ID. */
  readonly labels?: Readonly<Record<NodeId, ExplanationText>>;
  /** Call Foottrace's canonical explain API; honor cancellation and enforce storage/query work limits here. */
  readonly explain: (
    nodeId: NodeId,
    context: GraphContext
  ) => InvestigationResult | Promise<InvestigationResult>;
}

export interface InvestigationPanelProps {
  /** Optional display names for exact mark kinds; evidence and identity remain unchanged. */
  readonly markLabels?: Readonly<Record<string, ExplanationText>>;
  readonly port?: InvestigationPort | null;
  /** Explicit richer evidence presentation; overall preserves the legacy text projection. */
  readonly coverageMode?: "overall" | "directional";
  readonly className?: string;
  readonly style?: CSSProperties;
}
