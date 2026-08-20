/**
 * useSubflowNavigation — LEGACY drill-down breadcrumb tracker.
 *
 * DEPRECATED since 0.38.0 — removed in the next major. Two reasons, both
 * structural rather than stylistic:
 *
 *   1. **The key it emits is the wrong one.** `currentSubflowId` here is
 *      the child chart's LOCAL `subflowId`. That is not unique: mount the
 *      same chart twice and both mounts report the same key, so a filter
 *      keyed on it shows the other mount's stages — or nothing. The modern
 *      drill keys by the MOUNT NODE'S id, which is unique by construction
 *      (see `_internal/subflowDrill.ts`, "Drill KEY vs. child SCOPE").
 *   2. **It is half a system.** `currentGraph` is documented to swap to the
 *      child's graph and never has (see the TODO below) — it returns the
 *      root graph at every level, so the chart never actually narrows.
 *
 * Use instead: `<TracedFlow>`'s built-in drill — it owns the scope
 * (`currentSubflowId` + `onSubflowChange`, mount-node keyed) and renders
 * its own breadcrumb. Driving it yourself is the same two pure functions
 * the component calls: `filterGraphForDrill(graph, mountNodeId)` and
 * `buildSubflowBreadcrumb(graph, mountNodeId)`, both exported from
 * `footprint-explainable-ui/flowchart`.
 *
 * Original notes follow.
 *
 * ---
 *
 * Recorder-driven (v6+): replaces the legacy SpecNode-walk path. Accepts
 * a `TraceGraph` (from `createTraceStructureRecorder`) and tracks WHICH
 * subflow the user has drilled into.
 *
 * Limitation (intentional — recorder graph is flat / mount-only):
 *   The StructureRecorder records the MOUNT of each subflow in the
 *   parent chart, not the inner structure of each child chart. So
 *   "drill into a subflow" today returns the SAME graph with the
 *   `currentSubflowId` marker advanced — there is no separate
 *   child-graph to swap in. Filtering nodes by
 *   `data.subflowId === <selected>` would only surface mount nodes,
 *   not the child chart's stages.
 *
 * TODO(recorder-driven-nesting): when child charts attach their own
 * `traceStructureRecorder` and surface those graphs via a registry,
 * accept `Map<subflowId, TraceGraph>` and swap `currentGraph` to the
 * child's graph on drill-down. Consumers can then render
 * `<TraceFlow graph={currentGraph} />` per level.
 */

import { useState, useCallback, useMemo } from "react";
import { warnDeprecated } from "../../_internal/deprecate";
import type { TraceGraph } from "./traceStructureRecorder";

export interface BreadcrumbEntry {
  /** Display name for this level */
  label: string;
  /** The subflow id that was drilled into to reach this level
   *  (undefined for root). */
  subflowId?: string;
  /** Human-readable description of this subflow */
  description?: string;
}

export interface SubflowNavigation {
  /** Current breadcrumb path (root → ... → current) */
  breadcrumbs: BreadcrumbEntry[];
  /** Current graph — today identical to the root graph (see file-level
   *  TODO). Consumers should still treat this as the source of truth so
   *  they remain forward-compatible once per-subflow graphs are wired in. */
  currentGraph: TraceGraph;
  /** Subflow id of the level the user is currently inside (null at root). */
  currentSubflowId: string | null;
  /** Display name of the subflow node we drilled into (null at root). */
  currentSubflowNodeName: string | null;
  /** Call when a node is clicked — drills in if it's a subflow.
   *  Returns true when the click pushed a new level. */
  handleNodeClick: (nodeId: string) => boolean;
  /** Navigate to a specific breadcrumb level (0 = root) */
  navigateTo: (level: number) => void;
  /** Whether we're currently inside a subflow (not at root) */
  isInSubflow: boolean;
}

const EMPTY_GRAPH: TraceGraph = { nodes: [], edges: [] };

/**
 * Hook that tracks subflow drill-down state for a recorder-driven chart.
 *
 * Maintains a breadcrumb stack. When a subflow node is clicked the
 * stack pushes a new entry; breadcrumb clicks pop back to that level.
 * See file-level docs for the deferred per-subflow graph swap.
 *
 * @deprecated Since 0.38.0 — removed in the next major. Use
 * `<TracedFlow>`'s built-in drill (`currentSubflowId` / `onSubflowChange`,
 * keyed by the mount node's id), or drive it yourself with
 * `filterGraphForDrill` + `buildSubflowBreadcrumb`.
 */
export function useSubflowNavigation(
  rootGraph: TraceGraph | null,
): SubflowNavigation {
  warnDeprecated(
    "useSubflowNavigation",
    "It keys the drill by the child chart's LOCAL subflowId, which is not " +
      "unique across two mounts of the same chart. Use <TracedFlow>'s built-in " +
      "drill (currentSubflowId + onSubflowChange), or filterGraphForDrill + " +
      "buildSubflowBreadcrumb with the MOUNT NODE'S id.",
  );
  const [stack, setStack] = useState<BreadcrumbEntry[]>([]);

  const safeRootGraph = rootGraph ?? EMPTY_GRAPH;

  // Lookup: subflow id → mount node display name. Populated from the
  // recorder graph so click handlers can resolve the node-id the
  // consumer passes.
  const subflowMounts = useMemo(() => {
    const map = new Map<
      string,
      { subflowId: string; label: string; description?: string }
    >();
    for (const node of safeRootGraph.nodes) {
      if (!node.data?.isSubflow) continue;
      const subflowId =
        typeof node.data.subflowId === "string" ? node.data.subflowId : node.id;
      const label =
        typeof node.data.label === "string" ? node.data.label : node.id;
      const entry: { subflowId: string; label: string; description?: string } = {
        subflowId,
        label,
      };
      if (typeof node.data.description === "string") {
        entry.description = node.data.description;
      }
      // Key by stable id AND by the node id callers usually pass.
      map.set(node.id, entry);
      map.set(subflowId, entry);
    }
    return map;
  }, [safeRootGraph]);

  const breadcrumbs: BreadcrumbEntry[] = useMemo(() => {
    const rootLabel = "Flowchart";
    const root: BreadcrumbEntry = { label: rootLabel };
    return [root, ...stack];
  }, [stack]);

  const handleNodeClick = useCallback(
    (nodeId: string): boolean => {
      const mount = subflowMounts.get(nodeId);
      if (!mount) return false;
      setStack((prev) => {
        const entry: BreadcrumbEntry = {
          label: mount.label,
          subflowId: mount.subflowId,
        };
        if (mount.description !== undefined) entry.description = mount.description;
        return [...prev, entry];
      });
      return true;
    },
    [subflowMounts],
  );

  const navigateTo = useCallback((level: number) => {
    if (level === 0) {
      setStack([]);
    } else {
      setStack((prev) => prev.slice(0, level));
    }
  }, []);

  const top = stack[stack.length - 1];
  return {
    breadcrumbs,
    // TODO(recorder-driven-nesting): swap to per-subflow graph when
    // child charts attach their own recorders.
    currentGraph: safeRootGraph,
    currentSubflowId: top?.subflowId ?? null,
    currentSubflowNodeName: top?.label ?? null,
    handleNodeClick,
    navigateTo,
    isInSubflow: stack.length > 0,
  };
}
