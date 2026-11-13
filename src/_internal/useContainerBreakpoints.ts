import { useCallback, useState } from "react";
import { useIsomorphicLayoutEffect } from "./useIsomorphicLayoutEffect";

/** Observe the rendered element, including containers that appear after loading. */
export function useContainerBreakpoints<T extends HTMLElement>({
  notifyWindowResize = false,
}: { notifyWindowResize?: boolean } = {}) {
  const [element, setElement] = useState<T | null>(null);
  const [measurement, setMeasurement] = useState<{ element: T; width: number } | null>(null);
  const ref = useCallback((node: T | null) => { setElement(node); }, []);

  useIsomorphicLayoutEffect(() => {
    if (!element || typeof ResizeObserver === "undefined") return;
    let disposed = false;
    const observer = new ResizeObserver(([entry]) => {
      if (disposed || !entry) return;
      setMeasurement({ element, width: entry.contentRect.width });
      if (notifyWindowResize) window.dispatchEvent(new Event("resize"));
    });
    observer.observe(element);
    return () => { disposed = true; observer.disconnect(); };
  }, [element, notifyWindowResize]);

  const width = measurement?.element === element ? measurement.width : null;
  return {
    ref,
    isNarrow: width !== null && width < 640,
    isMedium: width !== null && width >= 640 && width < 960,
  };
}
