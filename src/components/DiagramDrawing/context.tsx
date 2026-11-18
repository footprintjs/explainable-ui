import { createContext, useContext, useMemo } from "react";
import type { PropsWithChildren } from "react";
import type { DiagramDrawings, DiagramGeometry } from "./types";

interface DiagramDrawingOptions {
  readonly geometry?: DiagramGeometry;
  readonly enableAppearance?: boolean;
  readonly drawings?: DiagramDrawings;
}

const DrawingContext = createContext<DiagramDrawingOptions>({});
export const useDiagramDrawingOptions = () => useContext(DrawingContext);

export function DiagramDrawingProvider({ geometry, drawings, enableAppearance, children }: PropsWithChildren<DiagramDrawingOptions>) {
  const options = useMemo(() => ({ geometry, drawings, enableAppearance }), [geometry, drawings, enableAppearance]);
  return <DrawingContext.Provider value={options}>{children}</DrawingContext.Provider>;
}
