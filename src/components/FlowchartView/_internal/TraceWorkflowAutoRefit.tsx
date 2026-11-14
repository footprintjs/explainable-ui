import { useMemo } from "react";
import { useStore } from "@xyflow/react";
import type { ReactFlowState, Rect } from "@xyflow/react";
import { ChartAutoRefit, type ChartAutoRefitProps } from "./useChartAutoRefit";
import { traceWorkflowPaintBounds } from "./traceWorkflowProjection";

/** Measured paint bounds never become graph nodes or layout dimensions. */
export function TraceWorkflowAutoRefit({ stages, ...props }: ChartAutoRefitProps & {
  stages: ReadonlyMap<string, unknown>;
}) {
  const boundsKey = useStore((state: ReactFlowState) => {
    const bounds = traceWorkflowPaintBounds(state.nodeLookup, stages.keys());
    return bounds ? JSON.stringify(bounds) : "";
  });
  const visualBounds = useMemo(() => boundsKey ? JSON.parse(boundsKey) as Rect : undefined, [boundsKey]);
  return <ChartAutoRefit {...props} visualBounds={visualBounds} />;
}
