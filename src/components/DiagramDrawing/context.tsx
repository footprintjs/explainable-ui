import { createContext, useContext, useMemo } from "react";
import type { PropsWithChildren } from "react";
import type { DiagramDrawings, DiagramGeometry } from "./types";

interface DiagramDrawingOptions {
  readonly geometry?: DiagramGeometry;
  readonly drawings?: DiagramDrawings;
}

const DrawingContext = createContext<DiagramDrawingOptions>({});
export const useDiagramDrawingOptions = () => useContext(DrawingContext);

export function DiagramDrawingProvider({ geometry, drawings, children }: PropsWithChildren<DiagramDrawingOptions>) {
  const options = useMemo(() => ({ geometry, drawings }), [geometry, drawings]);
  return <DrawingContext.Provider value={options}>{children}</DrawingContext.Provider>;
}
