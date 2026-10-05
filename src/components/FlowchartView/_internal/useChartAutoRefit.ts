import { useEffect } from "react";
import type { RefObject } from "react";
import { useReactFlow, useStoreApi } from "@xyflow/react";
import { chartFitViewport, chartMeasurementKey, positiveFinite } from "./chartFitGeometry";

export interface ChartAutoRefitProps {
  readonly wrapperRef: RefObject<HTMLElement | null>;
  readonly padding?: number;
  readonly refitKey?: unknown;
}

function hasVisibleArea(element: HTMLElement | null): boolean {
  if (!element) return false;
  const { width, height } = element.getBoundingClientRect();
  return positiveFinite(width) && positiveFinite(height);
}

/**
 * Event-driven fitting. Resize, measured geometry and explicit layout changes
 * request one frame; an unready chart waits for a NEW signal, never a frame loop.
 * Read the live provider state and both actual DOM boxes again inside that frame.
 *
 * Do not use fitView here: newer xyflow versions queue it for later, after our
 * checked graph may have changed. A finite viewport is applied directly with
 * duration:0. Animated fits defer d3's extent read until tween start, at which
 * point a hidden tab may have a zero extent even though it was visible now.
 * User-driven pan/zoom and its animation controls are untouched.
 */
export function useChartAutoRefit({ wrapperRef, padding = 0.1, refitKey }: ChartAutoRefitProps): void {
  const store = useStoreApi();
  const { setViewport } = useReactFlow();

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    let disposed = false;
    let frame: number | null = null;
    let pane: HTMLElement | null = null;
    let measurementKey = chartMeasurementKey(store.getState());
    let panZoom = store.getState().panZoom;

    const requestFit = () => {
      if (disposed) return;
      if (frame !== null) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        frame = null;
        if (disposed) return;
        const state = store.getState();
        // xyflow can retain positive/fallback store sizes while a tab is hidden.
        // The actual flow pane may also be smaller than its breadcrumb wrapper.
        if (!state.panZoom || !hasVisibleArea(wrapper) || !hasVisibleArea(state.domNode)) return;
        const viewport = chartFitViewport(state, padding);
        if (viewport) void setViewport(viewport, { duration: 0 });
      });
    };
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(requestFit);
    observer?.observe(wrapper);
    const observePane = () => {
      const current = store.getState().domNode;
      if (current === pane) return false;
      if (pane && pane !== wrapper) observer?.unobserve(pane);
      pane = current;
      if (pane && pane !== wrapper) observer?.observe(pane);
      return true;
    };
    observePane();
    const unsubscribe = store.subscribe((state) => {
      const paneChanged = observePane();
      const nextKey = chartMeasurementKey(state);
      const changed = paneChanged || nextKey !== measurementKey || state.panZoom !== panZoom;
      measurementKey = nextKey;
      panZoom = state.panZoom;
      if (changed) requestFit();
    });
    window.addEventListener("resize", requestFit);
    requestFit();
    return () => {
      disposed = true;
      unsubscribe();
      observer?.disconnect();
      window.removeEventListener("resize", requestFit);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [store, setViewport, wrapperRef, padding, refitKey]);
}

/** Lives UNDER ReactFlow's provider; both public chart doors use this owner. */
export function ChartAutoRefit(props: ChartAutoRefitProps): null {
  useChartAutoRefit(props);
  return null;
}
