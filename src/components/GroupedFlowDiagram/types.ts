/** App-approved presentation and structure, independent of recorded execution facts. */
export interface FlowDiagramNode {
  readonly id: string;
  readonly label: string;
  readonly kind?: "step" | "decision" | "group";
  /** Unique group instance ID, never the reusable flow's name. */
  readonly parentId?: string;
  /** A bundled icon key or a short Unicode symbol; never HTML or a remote URL. */
  readonly icon?: string;
  readonly description?: string;
}

export interface FlowDiagramEdge {
  readonly id: string;
  readonly source: string;
  readonly target: string;
  readonly label?: string;
}

export interface FlowDiagramDefinition {
  readonly nodes: readonly FlowDiagramNode[];
  readonly edges: readonly FlowDiagramEdge[];
}

/** Facts supplied by the host's admitted recording. Omission always means unknown. */
export type FlowDiagramNodeState = "unknown" | "running" | "completed" | "failed" | "not-run";
export type FlowDiagramEdgeState = "unknown" | "observed" | "not-taken";
export interface FlowDiagramObservation {
  readonly nodeStates?: Readonly<Record<string, FlowDiagramNodeState>>;
  readonly edgeStates?: Readonly<Record<string, FlowDiagramEdgeState>>;
}

/** Emphasis is provided by the host. This library does not discover causes by walking design arrows. */
export interface FlowDiagramHighlight {
  readonly nodeIds?: readonly string[];
  readonly edgeIds?: readonly string[];
  /** Exact host-supported cause. This presentation role never changes recorded execution state. */
  readonly rootCauseId?: string;
}

/** Canonical dependency evidence is an overlay, never an execution/design transition. */
export interface FlowDiagramRecordedRelationship {
  readonly id: string;
  readonly source: string;
  readonly target: string;
  readonly kind: "data" | "control";
  readonly attribution: "per-write" | "stage" | "recorded-control" | "recorded-read";
  readonly evidence: readonly string[];
  /** Routing hint only. Endpoints and arrow direction are never reversed. */
  readonly direction?: "backward" | "forward";
}
/** A new key expresses one explicit camera intent. Equivalent renders keep the current camera. */
export interface FlowDiagramFocusRequest {
  readonly key: unknown;
  readonly nodeIds: readonly string[];
}

export interface GroupedFlowDiagramModelOptions {
  readonly expandedGroupIds?: readonly string[];
  readonly observation?: FlowDiagramObservation;
  readonly highlight?: FlowDiagramHighlight;
  readonly selectedNodeId?: string;
  readonly direction?: "LR" | "TB";
}

export interface PositionedFlowDiagramNode {
  readonly node: FlowDiagramNode;
  readonly parentId?: string;
  readonly position: { readonly x: number; readonly y: number };
  readonly width: number;
  readonly height: number;
  readonly state: FlowDiagramNodeState;
  readonly expanded: boolean;
  readonly childCount: number;
  /** Recorded failures inside a group do not assert that the group itself failed. */
  readonly recordedIssueCount: number;
  readonly containsSelection: boolean;
  readonly highlighted: boolean;
  /** Only the exact supplied cause is labelled; a containing group is never its replacement. */
  readonly isRootCause?: boolean;
  readonly containsRootCause?: boolean;
}

export interface PositionedFlowDiagramEdge {
  readonly edge: FlowDiagramEdge;
  readonly source: string;
  readonly target: string;
  readonly state: FlowDiagramEdgeState;
  readonly highlighted: boolean;
  /** A collapsed proxy keeps the exact original edge identity; it adds no new relationship. */
  readonly collapsed: boolean;
}

export interface GroupedFlowDiagramModel {
  /** Validated structural metadata, including descendants hidden by collapsed groups. */
  readonly definition: FlowDiagramDefinition;
  /** Admitted states for every declared item, including collapsed descendants. */
  readonly nodeStates?: Readonly<Record<string, FlowDiagramNodeState>>;
  readonly nodes: readonly PositionedFlowDiagramNode[];
  readonly edges: readonly PositionedFlowDiagramEdge[];
  readonly width: number;
  readonly height: number;
  readonly direction: "LR" | "TB";
  readonly expandedGroupIds: readonly string[];
}

export interface GroupedFlowDiagramModelResult {
  readonly model?: GroupedFlowDiagramModel;
  /** Fixed actionable refusal, never an untrusted ID or label. */
  readonly error?: string;
}
