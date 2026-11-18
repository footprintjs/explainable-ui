/**
 * SmartStepEdge — a smooth-step edge that routes a RANK-SKIPPING (staggered)
 * edge AROUND the node(s) it skips, instead of bending through them.
 *
 * It is a drop-in superset of the built-in `smoothstep` edge: for an ordinary
 * adjacent edge it produces the IDENTICAL path (default midpoint bend); only
 * when the edge skips a rank — a node sits vertically between its endpoints —
 * does it move the bend into the gap below that node (see `stepRouting`).
 *
 * WHY a custom edge (not a layout tweak): which edges skip a rank depends on the
 * final laid-out geometry, which only the renderer knows. Like `LoopBackEdge`,
 * this reads node bounds straight from the xyflow store, so it works for ANY
 * staggered merge in ANY chart with zero per-node or per-chart wiring — register
 * it once as the default step edge and every staggered edge routes cleanly.
 *
 * The decision math lives in `_internal/stepRouting` (pure, unit-tested); this
 * is the thin React adapter. `style` + `markerEnd` flow through unchanged.
 */

import { BaseEdge, getSmoothStepPath, useStore } from "@xyflow/react";
import type { EdgeProps, ReactFlowState } from "@xyflow/react";
import { Position } from "@xyflow/react";
import { StockEdgeAppearance, appearanceFromData } from "../DiagramAppearance";
import { selectStepBend } from "./routingIndex";

export function SmartStepEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
  data,
}: EdgeProps) {
  // The bend y for a staggered edge, or null for an ordinary adjacent edge.
  // Derived in the store selector and returned as a NUMBER/null — primitive
  // equality means the edge only re-renders when its routing actually changes.
  const bendY = useStore((state: ReactFlowState) => selectStepBend(state, source, target));

  const [path] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition: sourcePosition ?? Position.Bottom,
    targetX,
    targetY,
    targetPosition: targetPosition ?? Position.Top,
    // Override the bend only for a staggered edge; otherwise let getSmoothStepPath
    // use its default centerY (== the built-in `smoothstep` path, byte-for-byte).
    ...(bendY !== null ? { centerY: bendY } : {}),
  });

  return <StockEdgeAppearance path={path} appearance={appearanceFromData(data)} unstyled={data?.unstyled === true}>
    <BaseEdge id={id} path={path} markerEnd={markerEnd} style={style} />
  </StockEdgeAppearance>;
}
