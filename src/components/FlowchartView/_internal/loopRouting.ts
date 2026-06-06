/**
 * loopRouting — pure geometry for the right-margin loop-back curve.
 *
 * A `loopTo` back-edge (e.g. ReAct's `Route → Context`) must NOT be drawn
 * straight down the chart spine — it overlaps every node it passes. Instead
 * it is routed as a CURVE that exits the source node's RIGHT edge, bows out to
 * a vertical "lane" clear of every content node, and re-enters the target
 * node's RIGHT edge. The lane is shared by all loops so they stack tidily on
 * the right margin.
 *
 * This module is the pure core (no React, no DOM): the `LoopBackEdge`
 * component gathers node bounds from the xyflow store and calls these; the
 * `wrapInMainChartBox` layout reserves `LOOP_LANE_GAP` of right-margin width
 * so the curve renders INSIDE the chart's frame. Keeping the math here makes
 * it unit-testable and keeps the edge component a thin adapter.
 */

/**
 * Horizontal gap (px) between the rightmost content node and the loop lane —
 * how far right of everything the curve bows. Shared by `LoopBackEdge` (which
 * draws to the lane) and `wrapInMainChartBox` (which reserves room for it), so
 * the curve always lands inside the frame.
 */
export const LOOP_LANE_GAP = 56;

/** A loop endpoint: a node's right edge x and vertical center y (flow coords). */
export interface LoopEndpoint {
  /** Absolute x of the node's RIGHT edge (position.x + width). */
  readonly right: number;
  /** Absolute y of the node's vertical center. */
  readonly centerY: number;
}

/**
 * The x of the vertical lane the loop curve bows out to: just right of the
 * widest content node, so the curve clears every node it arcs past. Pass the
 * right-edge x of every content node (the box container itself is excluded by
 * the caller — it would otherwise always be the widest and push the lane
 * outside its own frame). Empty input → `gap` (degenerate but safe).
 */
export function loopLaneX(contentRights: readonly number[], gap: number = LOOP_LANE_GAP): number {
  // Empty-input fallback: `max` stays -Infinity until the loop assigns it, so
  // `!Number.isFinite` catches the no-nodes case and degrades the lane to `gap`.
  let max = -Infinity;
  for (const r of contentRights) if (r > max) max = r;
  if (!Number.isFinite(max)) max = 0;
  return max + gap;
}

/**
 * SVG path for one right-margin loop-back curve. A cubic bezier whose BOTH
 * route HUGS the lane: it leaves the source heading right, runs straight UP (or
 * down) the lane — which sits right of EVERY node — and only turns in toward the
 * target at the target's own row (the target is the chart's first node, alone at
 * the top, so the turn-in clears everything). Corners are rounded for a curved
 * feel. A pure inward-bowing bezier was abandoned because it cuts back toward
 * the target's x BEFORE the top, slicing across whatever node is rightmost in
 * the rows it passes (e.g. the tools slot).
 *
 * `radius` is the corner rounding (clamped to fit the available run/rise).
 */
export function loopBackPath(
  source: LoopEndpoint,
  target: LoopEndpoint,
  laneX: number,
  radius = 22,
): string {
  const { right: sx, centerY: sy } = source;
  const { right: tx, centerY: ty } = target;
  // Corner radius can't exceed half the vertical run, nor the horizontal gap to
  // the lane on either side.
  const r = Math.max(
    0,
    Math.min(radius, Math.abs(sy - ty) / 2, laneX - sx, laneX - tx),
  );
  const up = ty <= sy; // target above source (the normal ReAct loop)
  const vy1 = up ? sy - r : sy + r; // first corner's far-y (leaving source row)
  const vy2 = up ? ty + r : ty - r; // second corner's near-y (entering target row)
  // out to the lane → round → straight up/down the lane → round → in to target.
  return [
    `M ${sx},${sy}`,
    `L ${laneX - r},${sy}`,
    `Q ${laneX},${sy} ${laneX},${vy1}`,
    `L ${laneX},${vy2}`,
    `Q ${laneX},${ty} ${laneX - r},${ty}`,
    `L ${tx},${ty}`,
  ].join(" ");
}
