/**
 * Pure helpers for projecting a raw `RuntimeOverlaySlice` into the
 * shape `<TracedFlow>` needs for per-node coloring:
 *
 *   1. `normalizeSliceLeafIds` — strips subflow path prefixes from
 *      stage ids so they match `TraceNode.id` (graph stores LEAF ids
 *      like `charge-card`; overlay records path-prefixed ids like
 *      `payment/charge-card`).
 *   2. `aggregateMountStatus` — when execution is INSIDE a subflow,
 *      light up the mount node in the parent view as
 *      done/active based on its internals' statuses.
 *
 * Both are pure (no I/O, no React). Composed in TracedFlow as
 * `aggregate(normalize(raw))`.
 */

import type { TraceGraph } from "../traceStructureRecorder";

export interface OverlaySlice {
  doneStageIds: ReadonlySet<string>;
  activeStageId: string | null;
  executedStageIds: ReadonlySet<string>;
  executedOrderIds: readonly string[];
  errors: ReadonlyMap<string, string>;
}

/** Strip everything before the last `/` — `'payment/charge-card'` → `'charge-card'`. */
function leafId(id: string): string {
  const i = id.lastIndexOf("/");
  return i >= 0 ? id.slice(i + 1) : id;
}

/**
 * Normalize all stage ids in a slice to LEAF ids so they line up
 * with `TraceNode.id` keys for coloring lookups.
 */
export function normalizeSliceLeafIds(slice: OverlaySlice): OverlaySlice {
  return {
    doneStageIds: new Set(Array.from(slice.doneStageIds).map(leafId)),
    activeStageId: slice.activeStageId ? leafId(slice.activeStageId) : null,
    executedStageIds: new Set(Array.from(slice.executedStageIds).map(leafId)),
    executedOrderIds: slice.executedOrderIds.map(leafId),
    errors: new Map(Array.from(slice.errors).map(([k, v]) => [leafId(k), v])),
  };
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
