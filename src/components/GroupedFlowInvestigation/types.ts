import type { CSSProperties } from "react";
import type { InvestigationPanelProps, InvestigationPort } from "../InvestigationPanel/types";
import type { FlowDiagramDefinition, FlowDiagramObservation } from "../GroupedFlowDiagram/types";

/** The diagram and bound port use the same exact item IDs; labels never resolve identity. */
export interface GroupedFlowInvestigationProps {
  readonly definition: FlowDiagramDefinition;
  readonly observation?: FlowDiagramObservation;
  readonly port?: InvestigationPort | null;
  /** Presentation only: grouped investigation already admits recorded relationships. */
  readonly coverageMode?: InvestigationPanelProps["coverageMode"];
  readonly direction?: "LR" | "TB";
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly "aria-label"?: string;
}
