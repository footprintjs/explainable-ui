/**
 * Pure helpers for subflow drill-down on a `TraceGraph`.
 *
 * Filtering and breadcrumb computation are derived from the
 * `TraceNodeData.subflowOf` field that the structure recorder sets
 * at `onSubflowMounted` time. Both functions are pure (no I/O, no
 * React) so they can be unit-tested in isolation and reused by any
 * renderer.
 *
 * Drill KEY vs. child SCOPE (why `resolveDrillScope` exists)
 * ──────────────────────────────────────────────────────────
 * A drill is identified by the MOUNT NODE'S id — `pipeline/prepare` —
 * because node ids are globally unique. `data.subflowId` is NOT: it is
 * the child chart's own LOCAL id, so mounting the same chart twice
 * (top level AND inside another subflow) gives two mounts the same
 * `subflowId`. Drilling by that shared id showed the OTHER mount's
 * stages, or — when only the nested mount existed — nothing at all.
 *
 * The children's `subflowOf` tag is what the filter actually matches,
 * and two producers spell it differently:
 *
 *   - eui's own recorder (`walkSubflowSpecInto`) tags inner stages with
 *     the mount PATH, which equals the mount node's id.
 *   - a consumer bridge may materialise internals tagged with the
 *     mount's LOCAL `subflowId` instead.
 *
 * `resolveDrillScope` turns a drill key into whichever of the two the
 * graph in hand actually uses, so both producers drill correctly and a
 * caller that still passes a bare `subflowId` keeps working.
 */

import type { TraceGraph } from "../traceStructureRecorder";

type TraceNode = TraceGraph["nodes"][number];

/**
 * Find the mount node a drill key names. Prefers the unambiguous node-id
 * form; falls back to the legacy bare-`subflowId` form so keys minted
 * before the drill was re-keyed still resolve.
 */
export function findMountNode(graph: TraceGraph, drillKey: string): TraceNode | undefined {
  return (
    graph.nodes.find((n) => n.id === drillKey && n.data?.isSubflow === true) ??
    graph.nodes.find((n) => n.data?.isSubflow === true && n.data?.subflowId === drillKey)
  );
}

/**
 * Resolve a drill key to the `subflowOf` value that selects that mount's
 * children in THIS graph. Returns the key unchanged when the graph has no
 * children for it — an empty scope is the honest answer for a subflow
 * whose internals were never recorded (a lazy mount, say).
 */
export function resolveDrillScope(graph: TraceGraph, drillKey: string): string {
  // The key already names a child scope (recorder graphs: mount node id).
  for (const n of graph.nodes) {
    if (n.data?.subflowOf === drillKey) return drillKey;
  }
  // The key is a mount node id whose children were tagged with the mount's
  // LOCAL subflow id instead.
  const local = graph.nodes.find((n) => n.id === drillKey)?.data?.subflowId;
  if (typeof local === "string" && local !== drillKey) {
    for (const n of graph.nodes) {
      if (n.data?.subflowOf === local) return local;
    }
  }
  return drillKey;
}

/**
 * Filter the trace graph by drill-down scope.
 *
 *   - `currentSubflowId === null`  → show top-level (nodes with no
 *     `subflowOf`). Subflow internals are hidden; their mount node
 *     stays visible as a single clickable card.
 *   - `currentSubflowId === 'X'`   → show only the stages of the mount
 *     `X` names — `X` being the mount NODE id (preferred, unique) or
 *     its local `subflowId` (legacy).
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
  const scope = currentSubflowId === null ? null : resolveDrillScope(graph, currentSubflowId);
  const matchesScope = (subflowOf: string | undefined): boolean =>
    scope === null ? subflowOf === undefined : subflowOf === scope;
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

/** Entry in the breadcrumb path. `subflowId === null` is the root.
 *  For a drilled level this carries the DRILL KEY (the mount node's id),
 *  which is what `onNavigate` hands back to the drill. */
export interface BreadcrumbEntry {
  subflowId: string | null;
  label: string;
}

/**
 * Build the breadcrumb path for the current drill level.
 *
 * Always starts with the root `{ subflowId: null, label: 'Chart' }`, then
 * one entry per ancestor mount, outermost first — walked by following each
 * mount's own `subflowOf` up to the top level. Drill keys are unique node
 * ids, so the FULL chain is recoverable: drilling `Pipeline` → `Prepare`
 * reads `Chart › Pipeline › Prepare`, and clicking `Pipeline` goes back one
 * level instead of all the way out.
 */
export function buildSubflowBreadcrumb(
  graph: TraceGraph,
  currentSubflowId: string | null,
): BreadcrumbEntry[] {
  const trail: BreadcrumbEntry[] = [];
  const seen = new Set<string>();
  let key: string | undefined = currentSubflowId ?? undefined;
  while (key !== undefined && !seen.has(key)) {
    seen.add(key);
    const mount = findMountNode(graph, key);
    if (mount === undefined) {
      trail.unshift({ subflowId: key, label: key });
      break;
    }
    trail.unshift({ subflowId: mount.id, label: mount.data?.label ?? mount.id });
    key = mount.data?.subflowOf;
  }
  return [{ subflowId: null, label: "Chart" }, ...trail];
}
