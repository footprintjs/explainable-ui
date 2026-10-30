import { getViewportForBounds } from "@xyflow/react";
import type { Node, Rect, Viewport } from "@xyflow/react";

/** Only the measured geometry consumed by the viewport policy. */
export interface ChartFitNode {
  readonly hidden?: boolean;
  readonly measured?: { readonly width?: number; readonly height?: number };
  readonly internals: { readonly positionAbsolute: { readonly x: number; readonly y: number } };
}

export interface ChartFitState {
  readonly width: number;
  readonly height: number;
  readonly minZoom: number;
  readonly maxZoom: number;
  readonly nodeLookup: ReadonlyMap<string, ChartFitNode>;
  /** Paint-only extents, never synthetic graph nodes or evidence membership. */
  readonly visualBounds?: Rect;
}

export const positiveFinite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

/** An incomplete visible graph is not a smaller graph: wait for all of it. */
export function measuredChartBounds(nodes: ReadonlyMap<string, ChartFitNode>): Rect | null {
  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  for (const node of nodes.values()) {
    if (node.hidden) continue;
    const width = node.measured?.width;
    const height = node.measured?.height;
    const { x, y } = node.internals.positionAbsolute;
    if (!positiveFinite(width) || !positiveFinite(height) || !Number.isFinite(x) || !Number.isFinite(y)) {
      return null;
    }
    left = Math.min(left, x);
    top = Math.min(top, y);
    right = Math.max(right, x + width);
    bottom = Math.max(bottom, y + height);
  }
  // Also catches an empty/all-hidden graph and overflow while adding/subtracting
  // otherwise finite coordinates. Never feed infinite empty bounds to xyflow.
  const width = right - left;
  const height = bottom - top;
  if (!Number.isFinite(left) || !Number.isFinite(top) || !positiveFinite(width) || !positiveFinite(height)) return null;
  return { x: left, y: top, width, height };
}

export function chartFitViewport(state: ChartFitState, padding: number): Viewport | null {
  if (!positiveFinite(state.width) || !positiveFinite(state.height)
    || !positiveFinite(state.minZoom) || !positiveFinite(state.maxZoom)
    || state.maxZoom < state.minZoom || !Number.isFinite(padding) || padding < 0) return null;
  let bounds = measuredChartBounds(state.nodeLookup);
  if (!bounds) return null;
  if (state.visualBounds) {
    const extra = state.visualBounds;
    if (![extra.x, extra.y, extra.width, extra.height].every(Number.isFinite) || !positiveFinite(extra.width) || !positiveFinite(extra.height)) return null;
    const x = Math.min(bounds.x, extra.x), y = Math.min(bounds.y, extra.y);
    bounds = { x, y, width: Math.max(bounds.x + bounds.width, extra.x + extra.width) - x, height: Math.max(bounds.y + bounds.height, extra.y + extra.height) - y };
    if (![bounds.x, bounds.y, bounds.width, bounds.height].every(Number.isFinite)) return null;
  }
  const viewport = getViewportForBounds(bounds, state.width, state.height, state.minZoom, state.maxZoom, padding);
  return Number.isFinite(viewport.x) && Number.isFinite(viewport.y) && positiveFinite(viewport.zoom)
    ? viewport : null;
}

/**
 * Subscribe to measurements, membership, and readiness, not the mutable Map's
 * identity. Positions only contribute their validity: dragging a measured node
 * or panning the camera must not trigger an automatic fit.
 */
export function chartMeasurementKey(state: ChartFitState): string {
  return JSON.stringify([
    state.width, state.height, state.minZoom, state.maxZoom,
    measuredChartBounds(state.nodeLookup) !== null,
    Array.from(state.nodeLookup, ([id, node]) => node.hidden
      ? [id, "hidden"]
      : [id, node.measured?.width, node.measured?.height]),
  ]);
}

/** Layout/topology changes request a fit; labels, colors and scrub state do not. */
export function chartLayoutKey(nodes: readonly Node[]): string {
  return JSON.stringify(nodes.map((node) => [
    node.id, node.parentId, node.hidden, node.position.x, node.position.y,
    node.origin, node.width, node.height,
  ]));
}

/** New scope/group membership is a fit intent; measured card sizes are not. */
export function chartTopologyKey(nodes: readonly Node[]): string {
  return JSON.stringify(nodes.map((node) => [node.id, node.parentId, node.hidden]));
}
