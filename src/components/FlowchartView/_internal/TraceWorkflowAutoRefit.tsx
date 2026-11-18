import { useMemo } from "react";
import { useStore } from "@xyflow/react";
import type { ReactFlowState, Rect } from "@xyflow/react";
import { useDiagramDrawingOptions } from "../../DiagramDrawing";
import { ChartAutoRefit, type ChartAutoRefitProps } from "./useChartAutoRefit";
import { traceWorkflowPaintBounds, type VisibleWorkflowRead } from "./traceWorkflowProjection";

/** Measured paint bounds never become graph nodes or layout dimensions. */
export function TraceWorkflowAutoRefit({ stages, reads, ...props }: ChartAutoRefitProps & {
  stages: ReadonlyMap<string, unknown>;
  reads: readonly Pick<VisibleWorkflowRead, "source" | "target">[];
}) {
  const { geometry } = useDiagramDrawingOptions();
  const boundsKey = useStore((state: ReactFlowState) => {
    const bounds = traceWorkflowPaintBounds(state.nodeLookup, stages.keys(), reads, geometry);
    return bounds ? JSON.stringify(bounds) : "";
  });
  const visualBounds = useMemo(() => boundsKey ? JSON.parse(boundsKey) as Rect : undefined, [boundsKey]);
  return <ChartAutoRefit {...props} visualBounds={visualBounds} />;
}
