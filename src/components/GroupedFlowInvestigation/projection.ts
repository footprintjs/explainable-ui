import type { FlowDiagramDefinition, FlowDiagramRecordedRelationship } from "../GroupedFlowDiagram/types";
import type { VisualInvestigationResult } from "../InvestigationPanel/visualTypes";

/** Presentation membership only. It neither traverses dependencies nor ranks causes. */
export function projectInvestigation(definition: FlowDiagramDefinition, result: VisualInvestigationResult, direction: "cause" | "impact") {
  const known = new Map(definition.nodes.map(node => [node.id, node]));
  const source = direction === "cause" ? result.backward : result.impact;
  const references = direction === "cause" ? result.backward?.nodes ?? result.path : result.impact.nodes;
  const ids = new Set([result.nodeId, ...references, ...(direction === "cause" && result.rootCause ? [result.rootCause] : [])]);
  const relationshipIds = new Set(definition.edges.map(edge => edge.id));
  const relationships: FlowDiagramRecordedRelationship[] = [];
  let sequence = 0;
  for (const edge of source?.edges ?? []) {
    ids.add(edge.from); ids.add(edge.to);
    if (!known.has(edge.from) || !known.has(edge.to)) continue;
    let id: string;
    do { id = `recorded-dependency:${sequence++}`; } while (relationshipIds.has(id));
    relationshipIds.add(id);
    relationships.push({ id, source: edge.from, target: edge.to, kind: edge.kind, attribution: edge.attribution,
      evidence: edge.evidence, direction: direction === "cause" ? "backward" : "forward" });
  }
  const nodeIds = [...ids].filter(id => known.has(id));
  const groupIds = new Set<string>();
  for (const id of nodeIds) {
    let parent = known.get(id)?.parentId;
    while (parent !== undefined) { groupIds.add(parent); parent = known.get(parent)?.parentId; }
  }
  return { nodeIds, groupIds: [...groupIds], relationships, unmapped: ids.size - nodeIds.length,
    relationshipsAvailable: source?.edges !== undefined,
    confidence: source?.confidence, gaps: source?.gaps ?? [] };
}
