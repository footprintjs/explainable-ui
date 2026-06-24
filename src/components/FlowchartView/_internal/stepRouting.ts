/**
 * stepRouting — pure geometry for the "smart" step edge that routes a
 * RANK-SKIPPING (staggered) edge AROUND the node(s) it skips.
 *
 * The problem: a normal smooth-step edge bends at the vertical MIDPOINT between
 * its endpoints. When an edge skips a rank (e.g. the agent merge-tree's
 * `tools → call-llm`, which bypasses `message-api`), that midpoint falls right
 * on the skipped node's row, so the horizontal segment cuts straight through it
 * — it reads as if the edge connects to the skipped node.
 *
 * The fix: place the bend in the GAP just below the lowest skipped node and
 * above the target, so the horizontal run clears every skipped node. Because the
 * bend sits below ALL skipped nodes, vertical clearance alone guarantees the
 * horizontal run never overlaps them. (The vertical run stays at the source's x;
 * for fork-join staggered merges the skipped input is laterally offset from the
 * trunk, so that run is already clear — the case this targets.)
 *
 * This module is the pure core (no React/DOM); `SmartStepEdge` is the thin
 * adapter that reads node bounds from the xyflow store and calls this. Keeping
 * the math here makes it unit-testable, mirroring `loopRouting`.
 */

/** A node's vertical extent in flow coordinates (top edge .. bottom edge). */
export interface VerticalBounds {
  readonly top: number;
  readonly bottom: number;
}

/**
 * The y at which a step edge should bend to clear every rank it SKIPS, or `null`
 * when it skips nothing (caller then uses the default midpoint bend == ordinary
 * smooth-step).
 *
 * A node counts as "skipped" when its vertical CENTER lies strictly between the
 * source's bottom and the target's top. The bend is placed midway between the
 * lowest skipped node's bottom and the target's top, clamped to stay
 * `minGapFromTarget` above the target so a rounded corner still fits.
 */
export function staggeredBendY(
  sourceBottom: number,
  targetTop: number,
  others: readonly VerticalBounds[],
  minGapFromTarget = 8,
): number | null {
  let lowestSkippedBottom = -Infinity;
  for (const n of others) {
    const cy = (n.top + n.bottom) / 2;
    if (cy > sourceBottom && cy < targetTop && n.bottom > lowestSkippedBottom) {
      lowestSkippedBottom = n.bottom;
    }
  }
  if (lowestSkippedBottom === -Infinity) return null; // nothing skipped → default bend
  return Math.min((lowestSkippedBottom + targetTop) / 2, targetTop - minGapFromTarget);
}

/**
 * The shared bend-y for a FORK FAN. When one source feeds N children (out-degree
 * >= 2), every edge leaving it bends at the SAME row — midway between the
 * source's bottom and the NEAREST child's top — so the fan reads as one clean
 * comb instead of N independently-bent diagonals (the staggered-staircase look).
 *
 * Because the value derives only from the SOURCE's geometry + its children
 * (identical for every sibling edge), each edge's store selector returns the
 * same primitive → React Flow re-renders the whole fan as a unit. Returns
 * `null` for a non-fork (< 2 children); the caller then uses the staggered /
 * default-midpoint bend.
 */
export function forkFanBendY(
  sourceBottom: number,
  childTops: readonly number[],
  minGapFromTarget = 8,
): number | null {
  if (childTops.length < 2) return null;
  const nearestTop = Math.min(...childTops);
  // Midway to the nearest child, but kept a corner-radius above it.
  return Math.min((sourceBottom + nearestTop) / 2, nearestTop - minGapFromTarget);
}

/**
 * Precedence when both a fork-fan bend and a rank-skip bend could apply to one
 * edge. The shared fan row gives forks a clean comb, BUT a fork branch that
 * ALSO skips a rank must keep its rank-skip bend — that bend sits BELOW the
 * skipped node, so the branch's long drop can't cut through it (the fan row is
 * high, near the source, and would not clear it). So: rank-skip WINS when
 * present, else the fan bend, else null (caller uses the default midpoint).
 */
export function resolveStepBendY(
  forkBend: number | null,
  staggeredBend: number | null,
): number | null {
  return staggeredBend ?? forkBend;
}
