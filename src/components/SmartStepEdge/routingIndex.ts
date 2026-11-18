import type { ReactFlowState } from "@xyflow/react";
import { GROUP_CONTAINER_NODE_TYPE } from "../FlowchartView/_internal/groupLayout";
import { bendInGap } from "../FlowchartView/_internal/stepRouting";

interface Row {
  center: number;
  bottom: number;
}

/** First center >= y, or > y when excluding the lower endpoint. */
function boundary(rows: Row[], y: number, excludeEqual: boolean) {
  let low = 0, high = rows.length;
  while (low < high) {
    const mid = low + Math.floor((high - low) / 2);
    const center = rows[mid].center;
    if (center < y || (excludeEqual && center === y)) low = mid + 1;
    else high = mid;
  }
  return low;
}

/**
 * Each edge needs the greatest bottom among nodes whose centers are strictly
 * between its endpoints. Sorting centers and indexing range maxima makes both
 * adjacent edges and long rank skips logarithmic, irrespective of fan-out.
 */
function indexRows(rows: Row[]) {
  rows.sort((a, b) => a.center - b.center);
  const size = rows.length;
  const maxBottom = new Float64Array(2 * size);
  for (let i = 0; i < size; i++) maxBottom[size + i] = rows[i].bottom;
  for (let i = size - 1; i > 0; i--) maxBottom[i] = Math.max(maxBottom[2 * i], maxBottom[2 * i + 1]);
  return (sourceBottom: number, targetTop: number) => {
    if (sourceBottom >= targetTop) return null;
    let left = boundary(rows, sourceBottom, true) + size;
    let right = boundary(rows, targetTop, false) + size;
    let lowest = -Infinity;
    while (left < right) {
      if (left % 2 === 1) lowest = Math.max(lowest, maxBottom[left++]);
      if (right % 2 === 1) lowest = Math.max(lowest, maxBottom[--right]);
      left = Math.floor(left / 2);
      right = Math.floor(right / 2);
    }
    return lowest === -Infinity ? null : bendInGap(lowest, targetTop);
  };
}

function indexRoutes(state: ReactFlowState) {
  const rows: Row[] = [];
  for (const node of state.nodeLookup.values()) {
    if (node.type === GROUP_CONTAINER_NODE_TYPE) continue;
    const top = node.internals.positionAbsolute.y, bottom = top + (node.measured.height ?? 0);
    rows.push({ center: (top + bottom) / 2, bottom });
  }
  const staggered = indexRows(rows);
  const fans = new Map<string, { count: number; nearest: number }>();
  for (const edge of state.edges) {
    if (edge.type === "recordedRead" || edge.data?.kind === "loop") continue;
    const child = state.nodeLookup.get(edge.target);
    if (!child || child.type === GROUP_CONTAINER_NODE_TYPE) continue;
    const top = child.internals.positionAbsolute.y;
    const fan = fans.get(edge.source);
    if (fan) {
      fan.count++;
      fan.nearest = Math.min(fan.nearest, top);
    } else {
      fans.set(edge.source, { count: 1, nearest: top });
    }
  }
  return (source: string, target: string) => {
    const src = state.nodeLookup.get(source), tgt = state.nodeLookup.get(target);
    if (!src || !tgt) return null;
    const bottom = src.internals.positionAbsolute.y + (src.measured.height ?? 0);
    const skip = staggered(bottom, tgt.internals.positionAbsolute.y);
    const fan = fans.get(source);
    return skip ?? (fan && fan.count >= 2 ? bendInGap(bottom, fan.nearest) : null);
  };
}

// All SmartStepEdge selectors observe the same Zustand snapshot for a store
// notification. nodeLookup itself is mutated in place on measurement and
// drag, so its identity would be an incorrect cache key.
const indices = new WeakMap<ReactFlowState, ReturnType<typeof indexRoutes>>();
export function selectStepBend(state: ReactFlowState, source: string, target: string): number | null {
  let lookup = indices.get(state);
  if (!lookup) {
    lookup = indexRoutes(state);
    indices.set(state, lookup);
  }
  return lookup(source, target);
}
