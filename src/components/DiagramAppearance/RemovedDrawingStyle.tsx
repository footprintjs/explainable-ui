import { useId } from "react";

/** Unique boundaries allow a drawing to span several DOM siblings (e.g. native
 * ports and a card) without wrapping, moving or remounting any of them. */
export function useDrawingBoundary(enabled: boolean) {
  const id = useId();
  // A root identifierPrefix may contain CSS punctuation. Encode every code point.
  if (!enabled) return "";
  return "fp-drawing-" + Array.from(id, c => c.codePointAt(0)!.toString(16)).join("-");
}

export function RemovedDrawingStyle({ boundary }: { boundary: string }) {
  // Only elements between this pair of siblings belong to the removed object.
  // The annotation after them stays legible, and other objects retain their paint.
  return <style id={boundary + "-begin"}>{`
    #${boundary}-begin ~ :has(~ #${boundary}-end) { opacity: var(--fp-diagram-removed-opacity, 0.4) !important; }
  `}</style>;
}
