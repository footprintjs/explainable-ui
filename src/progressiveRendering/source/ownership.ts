import type { TraceGraph } from '../../components/FlowchartView/traceStructureRecorder';

/** A path-shaped ID is not evidence of graph ownership. Follow only recorded
 * subflowOf links through unique mount nodes; missing/ambiguous/cyclic ancestry
 * remains retained rather than being guessed into the replacement scope. */
export function ownedGraphIds(nodes: TraceGraph['nodes'], mount: string): ReadonlySet<string> {
  const mounts = new Map<string, TraceGraph['nodes']>();
  for (const node of nodes) if (node.data.isSubflow) {
    for (const key of new Set([node.id, node.data.subflowId].filter((key): key is string => typeof key === 'string'))) {
      const candidates = mounts.get(key) ?? []; candidates.push(node); mounts.set(key, candidates);
    }
  }
  const owned = new Set<string>();
  for (const node of nodes) {
    let parent = node.data.subflowOf;
    const seen = new Set<string>([node.id]);
    while (parent !== undefined && !seen.has(parent)) {
      if (parent === mount) { owned.add(node.id); break; }
      seen.add(parent);
      const candidates = mounts.get(parent);
      if (candidates?.length !== 1) break;
      parent = candidates[0].data.subflowOf;
    }
  }
  return owned;
}
