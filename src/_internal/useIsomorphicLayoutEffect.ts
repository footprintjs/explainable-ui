import { useEffect, useLayoutEffect } from "react";

/** Browser commit bookkeeping; server rendering performs no effects. */
export const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;
