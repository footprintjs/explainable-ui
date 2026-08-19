/**
 * useSubflowDrill — drill state for the chart's view scope.
 *
 *   - Owns `currentSubflowId: string | null` (null = top-level) — the
 *     MOUNT NODE'S id, which is unique even when the same child chart is
 *     mounted twice (see subflowDrill.ts, "Drill KEY vs. child SCOPE")
 *   - Exposes `drillInto(mountNodeId)` and `drillUp()` for navigation
 *   - Notifies the host via `onSubflowChange(mountStageId | null)`
 *     whenever the drill state changes — host wires this to its own
 *     drill-stack so data panels follow
 *
 * CONTROLLED mode: pass `controlledSubflowId` (a `string | null`) and the
 * hook stops owning the value — it reports the host's and routes every
 * navigation through `onSubflowChange`. That is what makes ONE drill state
 * possible: a shell that also drills from a tree, a breadcrumb or a
 * deep-link owns the value once, and the chart can never disagree with the
 * panels next to it. Leave it `undefined` for a standalone chart and the
 * hook keeps its own state (unchanged behaviour).
 *
 * Drill changes are EXPLICIT — there's no auto-drill on scrub. The
 * mount node's status reflects "execution is inside" via
 * `aggregateMountStatus` (see overlayProjection.ts).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { TraceGraph } from "../traceStructureRecorder";
import { findMountNode } from "./subflowDrill";

export interface SubflowDrillHandle {
  /** Current drill scope — the mount node's id. `null` = top-level. */
  currentSubflowId: string | null;
  /** Navigate INTO the given subflow (by mount node id). */
  drillInto: (mountNodeId: string) => void;
  /** Pop back up to the parent / top-level. */
  drillUp: () => void;
  /** Direct setter for breadcrumb navigation (any target including `null`). */
  setCurrentSubflowId: (id: string | null) => void;
}

export function useSubflowDrill(
  graph: TraceGraph,
  onSubflowChange?: (mountStageId: string | null) => void,
  controlledSubflowId?: string | null,
): SubflowDrillHandle {
  const isControlled = controlledSubflowId !== undefined;
  const [ownSubflowId, setOwnSubflowId] = useState<string | null>(null);
  const currentSubflowId = isControlled ? controlledSubflowId : ownSubflowId;

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
  //
  // Controlled mode does NOT self-reset: the host owns the value, so
  // silently clearing it here would fight whoever set it.
  const lastGraphRef = useRef<TraceGraph | null>(null);
  if (!isControlled && lastGraphRef.current !== graph) {
    lastGraphRef.current = graph;
    if (ownSubflowId !== null && findMountNode(graph, ownSubflowId) === undefined) {
      // Schedule reset for next render (can't setState during render).
      queueMicrotask(() => setOwnSubflowId(null));
    }
  }

  // Notify the host when drill changes. The drill key IS the mount node's
  // id, so there is nothing to resolve — pass it straight through.
  const lastNotifiedRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (isControlled) return; // the host set it; echoing it back is a loop
    if (lastNotifiedRef.current === currentSubflowId) return;
    lastNotifiedRef.current = currentSubflowId;
    onSubflowChange?.(currentSubflowId);
  }, [isControlled, currentSubflowId, onSubflowChange]);

  const setCurrentSubflowId = useCallback(
    (id: string | null) => {
      if (isControlled) onSubflowChange?.(id);
      else setOwnSubflowId(id);
    },
    [isControlled, onSubflowChange],
  );
  const drillInto = useCallback(
    (mountNodeId: string) => setCurrentSubflowId(mountNodeId),
    [setCurrentSubflowId],
  );
  const drillUp = useCallback(() => setCurrentSubflowId(null), [setCurrentSubflowId]);

  return { currentSubflowId, drillInto, drillUp, setCurrentSubflowId };
}
