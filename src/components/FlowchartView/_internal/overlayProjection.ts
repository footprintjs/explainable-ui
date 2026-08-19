/**
 * Pure helpers for projecting a raw `RuntimeOverlaySlice` into the
 * shape `<TracedFlow>` needs for per-node coloring:
 *
 *   `aggregateMountStatus` — when execution is INSIDE a subflow, light
 *   up the mount node in the parent view as done/active based on its
 *   internals' statuses; and when the active id names a node the graph
 *   does not CONTAIN (hidden by a collapse, or internals that were never
 *   materialised), promote it to its nearest visible path ancestor so
 *   the cursor never goes dark.
 *
 *   `cursorStandInIds` / `edgeCarriesCursor` — the id set that "stands
 *   for" the cursor (the active id plus its path ancestors), and the
 *   check a contracted edge uses to say "the cursor is inside me"
 *   (collapseTraceGraph stamps `data.via` with the node ids each
 *   contraction passed through).
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
  const nodeIds = new Set(graph.nodes.map((n) => n.id));
  const mounts = graph.nodes.filter((n) => n.data?.isSubflow && n.data?.subflowId);
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
  // Nearest-visible-ancestor fallback (collapse-aware). When the active id
  // names a node THIS graph does not contain — hidden by `collapseTraceGraph`,
  // or an inner stage whose internals were never materialised — the cursor
  // must not go dark: promote it to the first path ancestor (`a/b/c` → `a/b`
  // → `a`) the graph actually shows. Fires ONLY for ids with no node at all,
  // so it can never steal "active" from a node that could light itself. With
  // no visible ancestor either, the id is left as-is — the edge that
  // contracted THROUGH the hidden node still carries the cursor (see
  // `edgeCarriesCursor` + TracedFlow's edge styling).
  if (activeId !== null && !nodeIds.has(activeId)) {
    for (const ancestor of pathAncestorsOf(activeId)) {
      if (nodeIds.has(ancestor)) {
        activeId = ancestor;
        break;
      }
    }
  }
  return { ...slice, doneStageIds: doneIds, activeStageId: activeId };
}

/** The path ancestors of a qualified stage id, nearest first
 *  (`a/b/c` → `['a/b', 'a']`). A top-level id has none. */
function pathAncestorsOf(stageId: string): string[] {
  const ancestors: string[] = [];
  let id = stageId;
  for (;;) {
    const cut = id.lastIndexOf("/");
    if (cut < 0) break;
    id = id.slice(0, cut);
    ancestors.push(id);
  }
  return ancestors;
}

const NO_IDS: ReadonlySet<string> = new Set<string>();

/**
 * The id set that "stands for" the cursor on a chart: the active stage id
 * itself plus every path ancestor of it. A contracted edge whose `via` list
 * intersects this set is carrying the cursor — the hidden node the cursor
 * sits on (or sits INSIDE) was contracted into that edge.
 */
export function cursorStandInIds(activeStageId: string | null): ReadonlySet<string> {
  if (activeStageId === null || activeStageId.length === 0) return NO_IDS;
  return new Set([activeStageId, ...pathAncestorsOf(activeStageId)]);
}

/**
 * Does this edge's `via` list (the node ids `collapseTraceGraph` contracted
 * through) intersect the cursor's stand-in set? Duck-typed on purpose — edge
 * `data` is `Record<string, unknown>` at the call site.
 */
export function edgeCarriesCursor(via: unknown, standIns: ReadonlySet<string>): boolean {
  if (standIns.size === 0 || !Array.isArray(via)) return false;
  return via.some((v) => typeof v === "string" && standIns.has(v));
}
