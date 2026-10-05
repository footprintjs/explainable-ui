import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import { useReactFlow, useStoreApi } from "@xyflow/react";
import { chartFitViewport, chartMeasurementKey, positiveFinite } from "./chartFitGeometry";

export interface ChartAutoRefitProps {
  readonly wrapperRef: RefObject<HTMLElement | null>;
  readonly padding?: number;
  readonly refitKey?: unknown;
  /** Derived measure-then-layout output; does not take ownership from the user. */
  readonly layoutKey?: unknown;
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
export function useChartAutoRefit({ wrapperRef, padding = 0.1, refitKey, layoutKey }: ChartAutoRefitProps): void {
  const store = useStoreApi();
  const { setViewport } = useReactFlow();
  const requestLayoutFit = useRef<(() => void) | null>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    let disposed = false;
    let frame: number | null = null;
    let pane: HTMLElement | null = null;
    let measurementKey = chartMeasurementKey(store.getState());
    let panZoom = store.getState().panZoom;
    let lastTransform = [...store.getState().transform];
    let autoOwned = true;
    let pendingFit = true;
    let applyingFit = false;
    let lastSuccessfulViewport: string | null = null;
    const readContainerKey = () => {
      const state = store.getState();
      const outer = wrapper.getBoundingClientRect();
      const inner = state.domNode?.getBoundingClientRect();
      return JSON.stringify([outer.width, outer.height, inner?.width, inner?.height, state.width, state.height]);
    };
    let containerKey = readContainerKey();

    const cancelFrame = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
    };

    const requestFit = () => {
      if (disposed || !pendingFit) return;
      cancelFrame();
      frame = requestAnimationFrame(() => {
        frame = null;
        if (disposed || !pendingFit) return;
        const state = store.getState();
        // xyflow can retain positive/fallback store sizes while a tab is hidden.
        // The actual flow pane may also be smaller than its breadcrumb wrapper.
        if (!state.panZoom || !hasVisibleArea(wrapper) || !hasVisibleArea(state.domNode)) return;
        const viewport = chartFitViewport(state, padding);
        if (!viewport) return;
        pendingFit = false;
        lastSuccessfulViewport = JSON.stringify(viewport);
        // With duration:0 xyflow updates transform synchronously. That update is
        // ours, not a user's camera gesture; later external transforms are theirs.
        applyingFit = true;
        try { void setViewport(viewport, { duration: 0 }); }
        finally { applyingFit = false; }
      });
    };
    const requestIntent = () => {
      autoOwned = true;
      pendingFit = true;
      requestFit();
    };
    const checkContainer = () => {
      const nextKey = readContainerKey();
      // A pending fit may have observed a transient hidden frame without an
      // intervening resize notification. Same-size signals can wake that intent,
      // but must not create a new one after success or a manual camera gesture.
      if (nextKey === containerKey) { requestFit(); return; }
      containerKey = nextKey;
      requestIntent();
    };
    requestLayoutFit.current = () => {
      if (!autoOwned) return;
      pendingFit = true;
      requestFit();
    };
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(checkContainer);
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
      const cameraChanged = state.transform.some((value, index) => value !== lastTransform[index]);
      lastTransform = [...state.transform];
      if (cameraChanged && !applyingFit) {
        autoOwned = false;
        pendingFit = false;
        cancelFrame();
      }
      const paneChanged = observePane();
      const nextKey = chartMeasurementKey(state);
      const measurementsChanged = nextKey !== measurementKey;
      const viewportChanged = state.panZoom !== panZoom;
      measurementKey = nextKey;
      panZoom = state.panZoom;
      if (paneChanged || viewportChanged) requestIntent();
      if (measurementsChanged) {
        checkContainer();
        // adoptUserNodes clears measured sizes when overlay node objects change.
        // Losing then recovering the same geometry is readiness, NOT a new intent.
        const viewport = chartFitViewport(state, padding);
        if (autoOwned && viewport && JSON.stringify(viewport) !== lastSuccessfulViewport) pendingFit = true;
        requestFit();
      }
    });
    window.addEventListener("resize", checkContainer);
    requestFit();
    return () => {
      disposed = true;
      unsubscribe();
      observer?.disconnect();
      requestLayoutFit.current = null;
      window.removeEventListener("resize", checkContainer);
      cancelFrame();
    };
  }, [store, setViewport, wrapperRef, padding, refitKey]);

  useEffect(() => { requestLayoutFit.current?.(); }, [layoutKey]);
}

/** Lives UNDER ReactFlow's provider; both public chart doors use this owner. */
export function ChartAutoRefit(props: ChartAutoRefitProps): null {
  useChartAutoRefit(props);
  return null;
}
