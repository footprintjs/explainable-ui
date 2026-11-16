import { useId } from "react";
import { ViewportPortal, useStore, useViewport } from "@xyflow/react";
import { theme } from "../../theme";

/** A small vector pattern, clipped to the visible world rectangle as it pans. */
export function IsometricGrid({ unstyled = false }: { unstyled?: boolean }) {
  const patternId = `isometric-floor-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const { x, y, zoom } = useViewport();
  const width = useStore(state => state.width);
  const height = useStore(state => state.height);
  if (unstyled || ![x, y, zoom, width, height].every(Number.isFinite) || width <= 0 || height <= 0) return null;
  const scale = Math.max(zoom, 0.01);
  const left = -x / scale - 64, top = -y / scale - 32;
  const worldWidth = width / scale + 128, worldHeight = height / scale + 64;
  return <ViewportPortal><svg aria-hidden="true" focusable="false" className="iso-floor"
    width={worldWidth} height={worldHeight} viewBox={`${left} ${top} ${worldWidth} ${worldHeight}`}
    style={{ position: "absolute", left, top, width: worldWidth, height: worldHeight, pointerEvents: "none", zIndex: -1 }}>
    <defs><pattern id={patternId} width="64" height="32" patternUnits="userSpaceOnUse">
      <path d="M0 0 64 32M0 32 64 0" fill="none" stroke={theme.border} strokeWidth="0.7" opacity="0.16" />
    </pattern></defs>
    <rect x={left} y={top} width={worldWidth} height={worldHeight} fill={`url(#${patternId})`} />
  </svg></ViewportPortal>;
}
