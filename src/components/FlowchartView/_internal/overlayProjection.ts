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
 *   - Mount is ACTIVE when ANY internal is active or done — but only
 *     when we're viewing the TOP-LEVEL chart (`currentSubflowId ===
 *     null`). When drilled INTO a subflow, the active highlight goes
 *     on the actual subflow stage, not on the parent's mount.
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
    const sfId = mount.data!.subflowId as string;
    const members = graph.nodes.filter((n) => n.data?.subflowOf === sfId);
    if (members.length === 0) continue;
    const anyActive = members.some((m) => m.id === slice.activeStageId);
    const anyDone = members.some((m) => slice.doneStageIds.has(m.id));
    const allDone = members.every((m) => slice.doneStageIds.has(m.id));
    if (allDone) doneIds.add(mount.id);
    else if ((anyActive || anyDone) && currentSubflowId === null) {
      activeId = mount.id;
    }
  }
  return { ...slice, doneStageIds: doneIds, activeStageId: activeId };
}
