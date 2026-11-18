import { useRef } from "react";
import { useDiagramDrawingOptions } from "../DiagramDrawing/context";
import { DiagramNodeAppearance, type DiagramNodeAppearanceProps } from "./DiagramNodeAppearance";
import { DiagramEdgeAppearance, type DiagramEdgeAppearanceProps } from "./DiagramEdgeAppearance";

// Existing unconfigured charts keep their native markup. Once a host opts in,
// keep the drawing's paint layer mounted while scrubbing or clearing a frame.
function usePaintLayer(hasAppearance: boolean) {
  const { enableAppearance, geometry, drawings } = useDiagramDrawingOptions();
  const enabled = useRef(false);
  if (enableAppearance || geometry || drawings || hasAppearance) enabled.current = true;
  return enabled.current;
}

export function StockNodeAppearance(props: DiagramNodeAppearanceProps) {
  return usePaintLayer(!!props.appearance) ? <DiagramNodeAppearance {...props} /> : <>{props.children}</>;
}

export function StockEdgeAppearance(props: DiagramEdgeAppearanceProps) {
  return usePaintLayer(!!props.appearance) ? <DiagramEdgeAppearance {...props} /> : <>{props.children}</>;
}
