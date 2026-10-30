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
import type { VisualInvestigationResult, VisualInvestigationEdge } from "./visualTypes";
type Attention = CauseResult["attention"][number];

// Display admission only. Foottrace and the host own graph traversal, storage admission and causal claims.
const MAX_ITEMS = 256;
const MAX_TEXT = 65_536;
const MAX_STRING = 2_048;
export const gapMessages = {
  "not-collected": "Some evidence was not collected.",
  "untracked-input": "An input's earlier origin is unknown.",
  redacted: "Some evidence is hidden.",
  conservative: "The recorded relationship is uncertain.",
  "scope-boundary": "Evidence stops at an execution boundary.",
  "invalid-data": "Some recorded evidence could not be read.",
  unavailable: "Some evidence is unavailable.",
  timeout: "The evidence search reached its time allowance.",
  cancelled: "The evidence search was cancelled.",
  cycle: "A repeated dependency could not be resolved.",
  "node-limit": "The evidence search reached its item allowance.",
  "depth-limit": "The evidence search reached its depth allowance.",
  "edge-limit": "The evidence search reached its relationship allowance.",
  "call-limit": "The evidence search reached its request allowance.",
  truncated: "The recorded evidence is incomplete.",
  "strategy-failed": "Candidate ordering is unavailable.",
  "not-checked": "Some evidence has not been checked.",
  "no-match": "No matching evidence was found.",
  ambiguous: "More than one explanation remains possible.",
  stale: "Some evidence belongs to an earlier recording.",
  incompatible: "Some evidence uses an unsupported format.",
  unsupported: "Some evidence is unsupported.",
  "not-permitted": "Some evidence is unavailable for this view.",
} satisfies Record<GapCode, string>;
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

class Refused extends Error {}
function field(value: unknown, key: string): unknown {
  if (!value || typeof value !== "object") throw new Refused();
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  if (!descriptor) return undefined;
  if (!("value" in descriptor)) throw new Refused();
  return descriptor.value;
}
class Admission {
  remaining = MAX_TEXT;
  text(value: unknown): string {
    if (typeof value !== "string" || !value.length || value.length > MAX_STRING)
      throw new Refused();
    this.remaining -= value.length;
    if (this.remaining < 0) throw new Refused();
    return value;
  }
  list<T>(value: unknown, max: number, parse: (entry: unknown) => T): T[] {
    if (!Array.isArray(value)) throw new Refused();
    const length = field(value, "length");
    if (
      typeof length !== "number" ||
      !Number.isSafeInteger(length) ||
      length < 0 ||
      length > max
    )
      throw new Refused();
    const copy: T[] = [];
    for (let index = 0; index < length; index++)
      copy.push(parse(field(value, String(index))));
    return copy;
  }
  confidence(value: unknown): Confidence {
    if (value !== "complete" && value !== "incomplete") throw new Refused();
    return value;
  }
  evidence = (value: unknown) =>
    this.list(value, 32, (entry) => this.text(entry));
  attention = (value: unknown): Attention => {
    const reason = field(value, "reason");
    if (
      typeof reason !== "string" ||
      !Object.prototype.hasOwnProperty.call(reasons, reason)
    )
      throw new Refused();
    return {
      kind: this.text(field(value, "kind")),
      reason: reason as AttentionReason,
      evidence: this.evidence(field(value, "evidence")),
    };
  };
  gaps = (value: unknown): Gap[] =>
    this.list(value, 128, (entry) => {
      const code = field(entry, "code");
      if (
        typeof code !== "string" ||
        !Object.prototype.hasOwnProperty.call(gapMessages, code)
      )
        throw new Refused();
      const nodeId = field(entry, "nodeId");
      return {
        code: code as GapCode,
        ...(nodeId !== undefined && { nodeId: this.text(nodeId) }),
        evidence: this.evidence(field(entry, "evidence")),
      };
    });
  edges(value: unknown, members: ReadonlySet<string>): VisualInvestigationEdge[] {
    return this.list(value, 512, entry => {
      const from = this.text(field(entry, "from")), to = this.text(field(entry, "to"));
      const kind = field(entry, "kind"), attribution = field(entry, "attribution");
      if (!members.has(from) || !members.has(to) || (kind !== "data" && kind !== "control")
        || !["per-write", "stage", "recorded-control", "recorded-read"].includes(attribution as string)) throw new Refused();
      return { from, to, kind, attribution: attribution as VisualInvestigationEdge["attribution"], evidence: this.evidence(field(entry, "evidence")) };
    });
  }
  backward(value: unknown, selected: string, root: string | undefined, path: readonly string[], alternatives: readonly string[]): NonNullable<VisualInvestigationResult["backward"]> {
    const nodes = this.list(field(value, "nodes"), MAX_ITEMS, entry => this.text(entry));
    const members = new Set(nodes);
    if (members.size !== nodes.length || (nodes.length > 0 && !members.has(selected))) throw new Refused();
    const confidence = this.confidence(field(value, "confidence")), gaps = this.gaps(field(value, "gaps"));
    if (root !== undefined && (!members.has(root) || confidence !== "complete" || gaps.length)) throw new Refused();
    const edges = this.edges(field(value, "edges"), members);
    if (path.some(id => !members.has(id)) || alternatives.some(id => !members.has(id))
      || (root !== undefined && edges.some(edge => edge.attribution === "stage"))) throw new Refused();
    // Check only the supplied path's adjacent pairs. This is consistency admission,
    // not graph traversal, candidate discovery or another root-cause strategy.
    const links = new Map<string, Set<string>>();
    for (const edge of edges) {
      const targets = links.get(edge.from) ?? new Set<string>();
      targets.add(edge.to); links.set(edge.from, targets);
    }
    for (let index = 1; index < path.length; index++) if (!links.get(path[index - 1]!)?.has(path[index]!)) throw new Refused();
    return { nodes, edges, confidence, gaps };
  }
  impact(value: unknown, selected: string, visual: boolean): VisualInvestigationResult["impact"] {
    const nodes = this.list(field(value, "nodes"), MAX_ITEMS, (entry) =>
      this.text(entry)
    );
    if (new Set(nodes).size !== nodes.length) throw new Refused();
    return {
      nodes,
      confidence: this.confidence(field(value, "confidence")),
      gaps: this.gaps(field(value, "gaps")),
      ...(visual && field(value, "edges") !== undefined ? { edges: this.edges(field(value, "edges"), new Set([selected, ...nodes])) } : {}),
    };
  }
}
export function admitAttention(
  value: unknown
): AttentionListResult | undefined {
  try {
    const reader = new Admission();
    const nodes = reader.list(
      field(value, "nodes"),
      MAX_ITEMS,
      (entry): MarkedNode => ({
        nodeId: reader.text(field(entry, "nodeId")),
        attention: reader.list(field(entry, "attention"), 16, reader.attention),
      })
    );
    if (new Set(nodes.map((node) => node.nodeId)).size !== nodes.length)
      return undefined;
    return {
      nodes,
      confidence: reader.confidence(field(value, "confidence")),
      gaps: reader.gaps(field(value, "gaps")),
    };
  } catch {
    return undefined;
  }
}
function readExplanation(value: unknown, requested: string, visual: boolean): VisualInvestigationResult | undefined {
  try {
    const reader = new Admission();
    const nodeId = reader.text(field(value, "nodeId"));
    if (nodeId !== requested) return undefined;
    const path = reader.list(field(value, "path"), MAX_ITEMS, (entry) =>
      reader.text(entry)
    );
    const alternatives = reader.list(
      field(value, "alternatives"),
      MAX_ITEMS,
      (entry) => reader.text(entry)
    );
    if (
      (path.length && path[0] !== nodeId) ||
      new Set(path).size !== path.length ||
      new Set(alternatives).size !== alternatives.length
    )
      return undefined;
    const confidence = reader.confidence(field(value, "confidence"));
    const gaps = reader.gaps(field(value, "gaps"));
    const root = field(value, "rootCause");
    const rootCause = root === undefined ? undefined : reader.text(root);
    if (
      rootCause !== undefined &&
      (alternatives.length || path[path.length - 1] !== rootCause)
    )
      return undefined;
    return {
      nodeId,
      attention: reader.list(field(value, "attention"), 16, reader.attention),
      ...(rootCause !== undefined && { rootCause }),
      path,
      alternatives,
      impact: reader.impact(field(value, "impact"), nodeId, visual),
      ...(visual && field(value, "backward") !== undefined ? { backward: reader.backward(field(value, "backward"), nodeId, rootCause, path, alternatives) } : {}),
      confidence,
      gaps,
    };
  } catch {
    return undefined;
  }
}
/** Legacy text projection intentionally leaves optional graph relationships with the host. */
export function admitExplanation(value: unknown, requested: string): InvestigationResult | undefined {
  return readExplanation(value, requested, false);
}
/** The grouped view admits only explicitly supplied, bounded canonical relationships. */
export function admitVisualExplanation(value: unknown, requested: string): VisualInvestigationResult | undefined {
  return readExplanation(value, requested, true);
}
export function displayLabel(labels: unknown, nodeId: string): string {
  try {
    const label = field(labels, nodeId);
    return typeof label === "string" && label.length > 0 && label.length <= 512
      ? label
      : nodeId;
  } catch {
    return nodeId;
  }
}
