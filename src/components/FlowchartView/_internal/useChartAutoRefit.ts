/**
 * useChartAutoRefit — keep an xyflow chart fitted to its container.
 *
 * xyflow's `fitView` prop only runs on mount; it does NOT re-fit
 * when the container resizes. This hook closes that gap by:
 *
 *   1. Observing the wrapper element via `ResizeObserver` →
 *      `instance.fitView({ duration, padding })` on the next animation
 *      frame (so the new container size is measured first).
 *   2. Also listening to `window resize` events — `ExplainableShell`
 *      dispatches synthetic resize events when its detail panels
 *      toggle (those size changes may be animated and not yet
 *      measurable by ResizeObserver on the first tick).
 *
 * Without this hook the chart shrinks once on Details-open and
 * never grows back when Details closes.
 */

import { useEffect } from "react";
import type { RefObject } from "react";
import type { ReactFlowInstance } from "@xyflow/react";

export function useChartAutoRefit(
  wrapperRef: RefObject<HTMLElement | null>,
  rfInstance: ReactFlowInstance | null,
  options: { duration?: number; padding?: number } = {},
): void {
  const duration = options.duration ?? 200;
  const padding = options.padding ?? 0.1;

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el || !rfInstance) return;
    let raf = 0;
    const refit = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        rfInstance.fitView({ duration, padding });
      });
    };
    const ro = new ResizeObserver(refit);
    ro.observe(el);
    window.addEventListener("resize", refit);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", refit);
      cancelAnimationFrame(raf);
    };
  }, [rfInstance, wrapperRef, duration, padding]);
}
