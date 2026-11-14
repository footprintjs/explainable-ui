import { useEffect, useState } from "react";

export const TRACE_MOTION_MS = 240;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** Enable trace transitions only while the host's observed preference allows them. */
export function useTraceMotion(): boolean {
  // The server and the initial hydration render agree. Unsupported hosts keep
  // motion off rather than guessing that an unreadable preference permits it.
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let active = true;
    let media: MediaQueryList;
    try {
      if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
      media = window.matchMedia(REDUCED_MOTION_QUERY);
      if (!media || typeof media.matches !== "boolean") return;
    } catch {
      return;
    }

    const update = () => {
      if (!active) return;
      try { setEnabled(media.matches === false); }
      catch { setEnabled(false); }
    };
    let unsubscribe: (() => void) | undefined;
    try {
      if (typeof media.addEventListener === "function" && typeof media.removeEventListener === "function") {
        media.addEventListener("change", update);
        unsubscribe = () => media.removeEventListener("change", update);
      }
    } catch {
      // Some older embedded hosts expose the modern names but require the
      // legacy listener methods. Try that supported pair before giving up.
    }
    if (!unsubscribe) {
      try {
        if (typeof media.addListener === "function" && typeof media.removeListener === "function") {
          media.addListener(update);
          unsubscribe = () => media.removeListener(update);
        }
      } catch {
        // A preference that cannot be observed keeps motion disabled.
      }
    }
    if (!unsubscribe) { active = false; return; }
    update();
    return () => {
      active = false;
      try { unsubscribe?.(); }
      catch { /* Cleanup in an unsupported host must not break unmounting. */ }
    };
  }, []);

  return enabled;
}
