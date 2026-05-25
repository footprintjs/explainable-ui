/**
 * useSubflowDrill — drill state for the chart's view scope.
 *
 *   - Owns `currentSubflowId: string | null` (null = top-level)
 *   - Exposes `drillInto(subflowId)` and `drillUp()` for navigation
 *   - Notifies the host via `onSubflowChange(mountStageId | null)`
 *     whenever the drill state changes — host wires this to its own
 *     drill-stack so data panels follow
 *
 * Drill changes are EXPLICIT — there's no auto-drill on scrub. The
 * mount node's status reflects "execution is inside" via
 * `aggregateMountStatus` (see overlayProjection.ts).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { TraceGraph } from "../traceStructureRecorder";

export interface SubflowDrillHandle {
  /** Current drill scope. `null` = top-level. */
  currentSubflowId: string | null;
  /** Navigate INTO the given subflow (by `subflowId`). */
  drillInto: (subflowId: string) => void;
  /** Pop back up to the parent / top-level. */
  drillUp: () => void;
  /** Direct setter for breadcrumb navigation (any target including `null`). */
  setCurrentSubflowId: (id: string | null) => void;
}

export function useSubflowDrill(
  graph: TraceGraph,
  onSubflowChange?: (mountStageId: string | null) => void,
): SubflowDrillHandle {
  const [currentSubflowId, setCurrentSubflowId] = useState<string | null>(null);

  // Reset drill state when the graph IDENTITY changes (e.g., the
  // user switched to a different sample in the playground sidebar).
  // Without this, the drill state from sample A persists into
  // sample B's rendering — `currentSubflowId='payment'` survives the
  // chart swap, but sample B has no 'payment' subflow, so the filter
  // returns no visible nodes (blank chart).
  //
  // Also reset when the currently-drilled subflow no longer exists
  // in the new graph (defensive — graph mutations could remove a
  // subflow without changing the wrapper reference).
  const lastGraphRef = useRef<TraceGraph | null>(null);
  if (lastGraphRef.current !== graph) {
    lastGraphRef.current = graph;
    if (
      currentSubflowId !== null &&
      !graph.nodes.some((n) => n.data?.subflowId === currentSubflowId)
    ) {
      // Schedule reset for next render (can't setState during render).
      queueMicrotask(() => setCurrentSubflowId(null));
    }
  }

  // Notify the host when drill changes. Resolve the mount stage id
  // from the graph (the parent-chart node whose `subflowId` matches).
  const lastNotifiedRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (lastNotifiedRef.current === currentSubflowId) return;
    lastNotifiedRef.current = currentSubflowId;
    if (currentSubflowId === null) {
      onSubflowChange?.(null);
    } else {
      const mount = graph.nodes.find((n) => n.data?.subflowId === currentSubflowId);
      if (mount) onSubflowChange?.(mount.id);
    }
  }, [currentSubflowId, graph, onSubflowChange]);

  const drillInto = useCallback((subflowId: string) => {
    setCurrentSubflowId(subflowId);
  }, []);
  const drillUp = useCallback(() => {
    setCurrentSubflowId(null);
  }, []);

  return { currentSubflowId, drillInto, drillUp, setCurrentSubflowId };
}
