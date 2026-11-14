/** Private initial framing policy; it never creates a later responsive camera intent. */
export const NARROW_DIAGRAM_WIDTH = 600;

export function initialCameraDecision(state: {
  readonly width: number;
  readonly alreadyInitialized: boolean;
  readonly cameraOwned: boolean;
  readonly hasVisibleSelection: boolean;
}): "wait" | "preserve" | "selection" {
  if (!Number.isFinite(state.width) || state.width <= 0) return "wait";
  if (state.alreadyInitialized || state.cameraOwned || state.width >= NARROW_DIAGRAM_WIDTH || !state.hasVisibleSelection) return "preserve";
  return "selection";
}
