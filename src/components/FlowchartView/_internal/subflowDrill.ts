/**
 * Pure helpers for subflow drill-down on a `TraceGraph`.
 *
 * Filtering and breadcrumb computation are derived from the
 * `TraceNodeData.subflowOf` field that the structure recorder sets
 * at `onSubflowMounted` time. Both functions are pure (no I/O, no
 * React) so they can be unit-tested in isolation and reused by any
 * renderer.
 */

import type { TraceGraph } from "../traceStructureRecorder";

/**
 * Filter the trace graph by drill-down scope.
 *
 *   - `currentSubflowId === null`  → show top-level (nodes with no
 *     `subflowOf`). Subflow internals are hidden; their mount node
 *     stays visible as a single clickable card.
 *   - `currentSubflowId === 'X'`   → show only nodes where
 *     `subflowOf === 'X'` (the drilled-in subflow's internals).
 *
 * Edges follow the same filter — only edges where both endpoints
 * are in the visible set survive. When nothing would be filtered
 * out, returns the original graph reference (preserves upstream
 * memoization).
 */
export function filterGraphForDrill(
  graph: TraceGraph,
  currentSubflowId: string | null,
): TraceGraph {
  if (graph.nodes.length === 0) return graph;
  const matchesScope = (subflowOf: string | undefined): boolean =>
    currentSubflowId === null ? subflowOf === undefined : subflowOf === currentSubflowId;
  const visibleIds = new Set<string>();
  for (const n of graph.nodes) {
    if (matchesScope(n.data?.subflowOf)) visibleIds.add(n.id);
  }
  if (visibleIds.size === graph.nodes.length) return graph;
  return {
    nodes: graph.nodes.filter((n) => visibleIds.has(n.id)),
    edges: graph.edges.filter((e) => visibleIds.has(e.source) && visibleIds.has(e.target)),
  };
}

/** Entry in the breadcrumb path. `subflowId === null` is the root. */
export interface BreadcrumbEntry {
  subflowId: string | null;
  label: string;
}

/**
 * Build the breadcrumb path for the current drill level.
 *
 * Always starts with the root `{ subflowId: null, label: 'Chart' }`.
 * When drilled into a subflow, appends one entry with the mount
 * node's display label (falling back to the subflow id). Multi-level
 * drill chains are NOT supported by the current chart UX (drill is
 * always from root or sibling — clicking a deeper subflow's mount
 * replaces the current scope), so the path has at most 2 entries.
 */
export function buildSubflowBreadcrumb(
  graph: TraceGraph,
  currentSubflowId: string | null,
): BreadcrumbEntry[] {
  const out: BreadcrumbEntry[] = [{ subflowId: null, label: "Chart" }];
  if (currentSubflowId !== null) {
    const mount = graph.nodes.find((n) => n.data?.subflowId === currentSubflowId);
    out.push({
      subflowId: currentSubflowId,
      label: mount?.data?.label ?? currentSubflowId,
    });
  }
  return out;
}
