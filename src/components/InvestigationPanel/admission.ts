import type {
  AttentionListResult,
  AttentionReason,
  CauseResult,
  Confidence,
  Gap,
  GapCode,
  MarkedNode,
} from "foottrace/cause";
import type { InvestigationResult } from "./types";
import { gapMessages } from "./wording";
import type { VisualInvestigationResult, VisualInvestigationEdge } from "./visualTypes";
import { admitsRecordedAttribution } from "../../recordedRelationships/attribution";
import {
  DisplayReader,
  investigationDisplayLimits,
  readOwnField,
  runDisplayCheck,
  type DisplayCheckResult,
  type DisplayPath,
} from "../../displayAdmission";
import type {
  InvestigationAttentionDisplay,
  InvestigationRelationshipDisplay,
  InvestigationTextDisplay,
} from "./checkTypes";
type Attention = CauseResult["attention"][number];

// Display admission only. Foottrace and the host own graph traversal, storage admission and causal claims.
const reasons = {
  ERROR_RECORDED: true,
  UNKNOWN_EFFECT_RECORDED: true,
  RETRY_STOP_RECORDED: true,
  TIMEOUT_RECORDED: true,
  RETRY_RECORDED: true,
  QUALITY_DROP_RECORDED: true,
  EVIDENCE_NOT_COLLECTED: true,
  OUTLIER_RECORDED: true,
  BUSINESS_RULE_MATCHED: true,
} satisfies Record<AttentionReason, true>;

const at = (path: DisplayPath, key: DisplayPath[number]): DisplayPath => [...path, key];

class Admission {
  constructor(readonly reader: DisplayReader) {}
  field(value: unknown, key: string, path: DisplayPath): unknown {
    return this.reader.field(value, key, path);
  }
  text(value: unknown, path: DisplayPath): string {
    return this.reader.text(value, path, investigationDisplayLimits.maxStringCodeUnits, "maxStringCodeUnits");
  }
  confidence(value: unknown, path: DisplayPath): Confidence {
    if (value !== "complete" && value !== "incomplete") this.reader.fail("invalid-enum", path);
    return value;
  }
  evidence(value: unknown, path: DisplayPath): string[] {
    return this.reader.list(value, path, investigationDisplayLimits.maxReferencesPerList, "maxReferencesPerList", (entry, entryPath) => this.text(entry, entryPath));
  }
  attention = (value: unknown, path: DisplayPath): Attention => {
    const reason = this.field(value, "reason", at(path, "reason"));
    if (typeof reason !== "string" || !Object.prototype.hasOwnProperty.call(reasons, reason))
      this.reader.fail("invalid-enum", at(path, "reason"));
    return {
      kind: this.text(this.field(value, "kind", at(path, "kind")), at(path, "kind")),
      reason: reason as AttentionReason,
      evidence: this.evidence(this.field(value, "evidence", at(path, "evidence")), at(path, "evidence")),
    };
  };
  gaps(value: unknown, path: DisplayPath): Gap[] {
    return this.reader.list(value, path, investigationDisplayLimits.maxGapsPerList, "maxGapsPerList", (entry, entryPath) => {
      const code = this.field(entry, "code", at(entryPath, "code"));
      if (typeof code !== "string" || !Object.prototype.hasOwnProperty.call(gapMessages, code))
        this.reader.fail("invalid-enum", at(entryPath, "code"));
      const nodeId = this.field(entry, "nodeId", at(entryPath, "nodeId"));
      return {
        code: code as GapCode,
        ...(nodeId !== undefined && { nodeId: this.text(nodeId, at(entryPath, "nodeId")) }),
        evidence: this.evidence(this.field(entry, "evidence", at(entryPath, "evidence")), at(entryPath, "evidence")),
      };
    });
  }
  edges(value: unknown, members: ReadonlySet<string>, path: DisplayPath): VisualInvestigationEdge[] {
    return this.reader.list(value, path, investigationDisplayLimits.maxEdgesPerList, "maxEdgesPerList", (entry, entryPath) => {
      const from = this.text(this.field(entry, "from", at(entryPath, "from")), at(entryPath, "from"));
      const to = this.text(this.field(entry, "to", at(entryPath, "to")), at(entryPath, "to"));
      const kind = this.field(entry, "kind", at(entryPath, "kind"));
      const attribution = this.field(entry, "attribution", at(entryPath, "attribution"));
      if (!members.has(from)) this.reader.fail("inconsistent-evidence", at(entryPath, "from"));
      if (!members.has(to)) this.reader.fail("inconsistent-evidence", at(entryPath, "to"));
      if (kind !== "data" && kind !== "control") this.reader.fail("invalid-enum", at(entryPath, "kind"));
      if (!admitsRecordedAttribution(attribution, kind))
        this.reader.fail(attribution === "recorded-write" && kind === "control" ? "inconsistent-evidence" : "invalid-enum", at(entryPath, "attribution"));
      return { from, to, kind, attribution: attribution as VisualInvestigationEdge["attribution"], evidence: this.evidence(this.field(entry, "evidence", at(entryPath, "evidence")), at(entryPath, "evidence")) };
    });
  }
  backward(value: unknown, selected: string, root: string | undefined, path: readonly string[], alternatives: readonly string[]): NonNullable<VisualInvestigationResult["backward"]> {
    const nodesPath: DisplayPath = ["backward", "nodes"];
    const nodes = this.reader.list(this.field(value, "nodes", nodesPath), nodesPath, investigationDisplayLimits.maxItemsPerList, "maxItemsPerList", (entry, entryPath) => this.text(entry, entryPath));
    const members = new Set(nodes);
    if (members.size !== nodes.length) this.reader.fail("duplicate-identity", nodesPath);
    if (nodes.length > 0 && !members.has(selected)) this.reader.fail("inconsistent-evidence", nodesPath);
    const confidence = this.confidence(this.field(value, "confidence", ["backward", "confidence"]), ["backward", "confidence"]);
    const gaps = this.gaps(this.field(value, "gaps", ["backward", "gaps"]), ["backward", "gaps"]);
    if (root !== undefined) {
      if (!members.has(root)) this.reader.fail("inconsistent-evidence", nodesPath);
      if (confidence !== "complete") this.reader.fail("inconsistent-evidence", ["backward", "confidence"]);
      if (gaps.length) this.reader.fail("inconsistent-evidence", ["backward", "gaps"]);
    }
    const edges = this.edges(this.field(value, "edges", ["backward", "edges"]), members, ["backward", "edges"]);
    if (path.some(id => !members.has(id))) this.reader.fail("inconsistent-evidence", ["path"]);
    if (alternatives.some(id => !members.has(id))) this.reader.fail("inconsistent-evidence", ["alternatives"]);
    if (root !== undefined && edges.some(edge => edge.attribution === "stage")) this.reader.fail("inconsistent-evidence", ["backward", "edges"]);
    // Supplied path adjacency only: no graph traversal or new root strategy.
    const links = new Map<string, Set<string>>();
    for (const edge of edges) {
      const targets = links.get(edge.from) ?? new Set<string>();
      targets.add(edge.to); links.set(edge.from, targets);
    }
    for (let index = 1; index < path.length; index++)
      if (!links.get(path[index - 1]!)?.has(path[index]!)) this.reader.fail("inconsistent-evidence", ["path", index]);
    return { nodes, edges, confidence, gaps };
  }
  impact(value: unknown, selected: string, visual: boolean): VisualInvestigationResult["impact"] {
    const nodesPath: DisplayPath = ["impact", "nodes"];
    const nodes = this.reader.list(this.field(value, "nodes", nodesPath), nodesPath, investigationDisplayLimits.maxItemsPerList, "maxItemsPerList", (entry, entryPath) => this.text(entry, entryPath));
    if (new Set(nodes).size !== nodes.length) this.reader.fail("duplicate-identity", nodesPath);
    return {
      nodes,
      confidence: this.confidence(this.field(value, "confidence", ["impact", "confidence"]), ["impact", "confidence"]),
      gaps: this.gaps(this.field(value, "gaps", ["impact", "gaps"]), ["impact", "gaps"]),
      ...(visual && this.field(value, "edges", ["impact", "edges"]) !== undefined ? { edges: this.edges(this.field(value, "edges", ["impact", "edges"]), new Set([selected, ...nodes]), ["impact", "edges"]) } : {}),
    };
  }
}

function readAttention(value: unknown, reader: Admission): InvestigationAttentionDisplay {
  const nodes = reader.reader.list(reader.field(value, "nodes", ["nodes"]), ["nodes"], investigationDisplayLimits.maxItemsPerList, "maxItemsPerList", (entry, entryPath): MarkedNode => ({
    nodeId: reader.text(reader.field(entry, "nodeId", at(entryPath, "nodeId")), at(entryPath, "nodeId")),
    attention: reader.reader.list(reader.field(entry, "attention", at(entryPath, "attention")), at(entryPath, "attention"), investigationDisplayLimits.maxMarksPerItem, "maxMarksPerItem", reader.attention),
  }));
  if (new Set(nodes.map(node => node.nodeId)).size !== nodes.length) reader.reader.fail("duplicate-identity", ["nodes"]);
  return {
    nodes,
    confidence: reader.confidence(reader.field(value, "confidence", ["confidence"]), ["confidence"]),
    gaps: reader.gaps(reader.field(value, "gaps", ["gaps"]), ["gaps"]),
  };
}

function readExplanation(value: unknown, requested: string, visual: boolean, reader: Admission): VisualInvestigationResult {
  const nodeId = reader.text(reader.field(value, "nodeId", ["nodeId"]), ["nodeId"]);
  if (nodeId !== requested) reader.reader.fail("selection-mismatch", ["nodeId"]);
  const path = reader.reader.list(reader.field(value, "path", ["path"]), ["path"], investigationDisplayLimits.maxItemsPerList, "maxItemsPerList", (entry, entryPath) => reader.text(entry, entryPath));
  const alternatives = reader.reader.list(reader.field(value, "alternatives", ["alternatives"]), ["alternatives"], investigationDisplayLimits.maxItemsPerList, "maxItemsPerList", (entry, entryPath) => reader.text(entry, entryPath));
  if (path.length && path[0] !== nodeId) reader.reader.fail("inconsistent-evidence", ["path", 0]);
  if (new Set(path).size !== path.length) reader.reader.fail("duplicate-identity", ["path"]);
  if (new Set(alternatives).size !== alternatives.length) reader.reader.fail("duplicate-identity", ["alternatives"]);
  const confidence = reader.confidence(reader.field(value, "confidence", ["confidence"]), ["confidence"]);
  const gaps = reader.gaps(reader.field(value, "gaps", ["gaps"]), ["gaps"]);
  const root = reader.field(value, "rootCause", ["rootCause"]);
  const rootCause = root === undefined ? undefined : reader.text(root, ["rootCause"]);
  if (rootCause !== undefined && (alternatives.length || path[path.length - 1] !== rootCause)) reader.reader.fail("inconsistent-evidence", ["rootCause"]);
  return {
    nodeId,
    attention: reader.reader.list(reader.field(value, "attention", ["attention"]), ["attention"], investigationDisplayLimits.maxMarksPerItem, "maxMarksPerItem", reader.attention),
    ...(rootCause !== undefined && { rootCause }),
    path,
    alternatives,
    impact: reader.impact(reader.field(value, "impact", ["impact"]), nodeId, visual),
    ...(visual && reader.field(value, "backward", ["backward"]) !== undefined ? { backward: reader.backward(reader.field(value, "backward", ["backward"]), nodeId, rootCause, path, alternatives) } : {}),
    confidence,
    gaps,
  };
}

/** Check the same detached attention projection used by InvestigationPanel. */
export function checkInvestigationAttention(value: unknown): DisplayCheckResult<InvestigationAttentionDisplay> {
  return runDisplayCheck(investigationDisplayLimits, reader => readAttention(value, new Admission(reader)));
}

/** Text mode intentionally leaves backward data and impact edges unread. */
export function checkInvestigationExplanation(value: unknown, requestedNodeId: string, projection?: "text"): DisplayCheckResult<InvestigationTextDisplay>;
export function checkInvestigationExplanation(value: unknown, requestedNodeId: string, projection: "relationships"): DisplayCheckResult<InvestigationRelationshipDisplay>;
export function checkInvestigationExplanation(value: unknown, requestedNodeId: string, projection?: "text" | "relationships"): DisplayCheckResult<InvestigationTextDisplay | InvestigationRelationshipDisplay>;
export function checkInvestigationExplanation(value: unknown, requestedNodeId: string, projection: "text" | "relationships" = "text"): DisplayCheckResult<InvestigationTextDisplay | InvestigationRelationshipDisplay> {
  return runDisplayCheck(investigationDisplayLimits, reader => {
    if (projection !== "text" && projection !== "relationships") reader.fail("invalid-enum", ["projection"]);
    return readExplanation(value, requestedNodeId, projection === "relationships", new Admission(reader));
  });
}

export function admitAttention(value: unknown): AttentionListResult | undefined {
  const result = checkInvestigationAttention(value);
  return result.ok ? result.value : undefined;
}
/** Legacy text projection intentionally leaves optional graph relationships with the host. */
export function admitExplanation(value: unknown, requested: string): InvestigationResult | undefined {
  const result = checkInvestigationExplanation(value, requested);
  return result.ok ? result.value : undefined;
}
/** The grouped view admits only explicitly supplied, bounded canonical relationships. */
export function admitVisualExplanation(value: unknown, requested: string): VisualInvestigationResult | undefined {
  const result = checkInvestigationExplanation(value, requested, "relationships");
  return result.ok ? result.value : undefined;
}
export function displayLabel(labels: unknown, nodeId: string): string {
  try {
    const label = readOwnField(labels, nodeId);
    return typeof label === "string" && label.length > 0 && label.length <= 512 ? label : nodeId;
  } catch {
    return nodeId;
  }
}
