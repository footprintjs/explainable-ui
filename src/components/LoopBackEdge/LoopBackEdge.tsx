/**
 * LoopBackEdge — xyflow custom edge for `loopTo` back-edges, routed as a
 * CURVE along the chart's right margin instead of straight down the spine.
 *
 * WHY a custom edge (not handle-based side-routing): the prior approach asked
 * every node type to declare dedicated `loop-source` / `loop-target` handles;
 * any node missing them (custom consumer nodes, group boxes, slot pills)
 * silently fell back to the default top/bottom handles and the loop collapsed
 * back onto the spine. This component sidesteps handles entirely: it reads the
 * source/target node bounds straight from the xyflow store, anchors on their
 * RIGHT edges, and bows out to a shared lane clear of every content node. It
 * therefore works for ANY node type with zero per-node wiring — register it
 * once and every loop curves.
 *
 * The math lives in `_internal/loopRouting` (pure, unit-tested); this is the
 * thin React adapter. `style` (stroke color + dash) and `markerEnd` (arrow)
 * flow through from the renderer's edge styler unchanged.
 */

import { BaseEdge, useStore } from "@xyflow/react";
import type { EdgeProps, InternalNode, ReactFlowState } from "@xyflow/react";
import { LOOP_LANE_GAP, loopBackPath, loopLaneX } from "../FlowchartView/_internal/loopRouting";
import { GROUP_CONTAINER_NODE_TYPE } from "../FlowchartView/_internal/groupLayout";

/** Absolute x of a node's right edge. */
function rightEdge(node: InternalNode): number {
  return node.internals.positionAbsolute.x + (node.measured.width ?? 0);
}

/** Absolute y of a node's vertical center. */
function centerY(node: InternalNode): number {
  return node.internals.positionAbsolute.y + (node.measured.height ?? 0) / 2;
}

export function LoopBackEdge({ id, source, target, markerEnd, style }: EdgeProps) {
  // Derive the full SVG path inside the store selector and return it as a
  // STRING — primitive equality means the edge only re-renders when its
  // geometry actually changes (no per-tick churn, no render loop).
  const path = useStore((s: ReactFlowState) => {
    const src = s.nodeLookup.get(source);
    const tgt = s.nodeLookup.get(target);
    if (!src || !tgt) return "";

    // Lane sits right of every CONTENT node. Group containers (the frame box
    // itself) are excluded — the box spans the whole chart, so counting it
    // would always push the lane outside its own border.
    const contentRights: number[] = [];
    for (const n of s.nodeLookup.values()) {
      if (n.type === GROUP_CONTAINER_NODE_TYPE) continue;
      contentRights.push(rightEdge(n));
    }
    // Add the endpoints explicitly: when source or target IS a group container
    // (a loop into/out of a box), the loop above skipped it, so include its
    // right edge here so the lane still clears the endpoint. For ordinary
    // (content) endpoints this is a harmless duplicate — loopLaneX takes a max.
    const laneX = loopLaneX([...contentRights, rightEdge(src), rightEdge(tgt)], LOOP_LANE_GAP);

    return loopBackPath(
      { right: rightEdge(src), centerY: centerY(src) },
      { right: rightEdge(tgt), centerY: centerY(tgt) },
      laneX,
    );
  });

  if (!path) return null;
  return (
    <BaseEdge id={id} path={path} markerEnd={markerEnd} style={style} aria-label="Loop back" />
  );
}
