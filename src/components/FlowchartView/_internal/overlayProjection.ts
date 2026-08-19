/**
 * Pure helper for projecting a raw `RuntimeOverlaySlice` into the
 * shape `<TracedFlow>` needs for per-node coloring:
 *
 *   `aggregateMountStatus` — when execution is INSIDE a subflow, light
 *   up the mount node in the parent view as done/active based on its
 *   internals' statuses.
 *
 * Pure (no I/O, no React).
 *
 * Note: there is NO id-normalization step. Both the overlay slice and
 * the structure graph use path-QUALIFIED stage ids (`subflowPath/stageId`,
 * mirroring runtimeStageId), so they match directly. (A former
 * `normalizeSliceLeafIds` step existed only while structure ids were
 * bare; once `walkSubflowSpecInto` started qualifying inner ids, leaf-
 * stripping became a mismatch and was removed.)
 */

import type { TraceGraph } from "../traceStructureRecorder";
import { resolveDrillScope } from "./subflowDrill";

export interface OverlaySlice {
  doneStageIds: ReadonlySet<string>;
  activeStageId: string | null;
  executedStageIds: ReadonlySet<string>;
  executedOrderIds: readonly string[];
  errors: ReadonlyMap<string, string>;
}

/**
 * Aggregate subflow internals' status onto their mount nodes.
 *
 *   - Mount is DONE when EVERY internal stage is done.
 *   - Mount is ACTIVE only when an internal stage is CURRENTLY active
 *     (not merely past-done), and only when viewing the TOP-LEVEL chart
 *     (`currentSubflowId === null`). When drilled INTO a subflow, the
 *     active highlight stays on the actual subflow stage, not the mount.
 *     (Promoting on past-done internals let a looping subflow steal
 *     "active" from the real live top-level node — see the inline note.)
 *
 * Pre-condition: slice has already been leaf-normalized so its
 * stage ids match `graph.nodes[].id`.
 */
export function aggregateMountStatus(
  slice: OverlaySlice,
  graph: TraceGraph,
  currentSubflowId: string | null,
): OverlaySlice {
  if (graph.nodes.length === 0) return slice;
  const mounts = graph.nodes.filter((n) => n.data?.isSubflow && n.data?.subflowId);
  if (mounts.length === 0) return slice;
  const doneIds = new Set(slice.doneStageIds);
  let activeId = slice.activeStageId;
  for (const mount of mounts) {
    // Members are matched through the SAME scope resolution the drill uses:
    // the mount's local `subflowId` repeats across mounts of one child chart,
    // so keying on it lights a nested mount from its top-level twin's stages.
    const scope = resolveDrillScope(graph, mount.id);
    const members = graph.nodes.filter((n) => n.data?.subflowOf === scope);
    if (members.length === 0) continue;
    const anyActive = members.some((m) => m.id === slice.activeStageId);
    const allDone = members.every((m) => slice.doneStageIds.has(m.id));
    if (allDone) doneIds.add(mount.id);
    // Promote "active" to the mount ONLY when the live node is genuinely INSIDE
    // this subflow (anyActive). Previously a mount with merely PAST-done members
    // (`anyDone`) also stole active — and once subflow internals are materialised
    // (for drill), a looping subflow's earlier-iteration done members made the
    // mount steal "active" from the real top-level live node (e.g. the tool
    // call), so that node's NOW highlight disappeared. The mount's own done-ness
    // still comes from its own commit + the allDone branch above.
    else if (anyActive && currentSubflowId === null) {
      activeId = mount.id;
    }
  }
  return { ...slice, doneStageIds: doneIds, activeStageId: activeId };
}
