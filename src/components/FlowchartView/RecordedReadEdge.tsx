import { BaseEdge, EdgeLabelRenderer, useStore } from "@xyflow/react";
import type { EdgeProps, ReactFlowState } from "@xyflow/react";
import { StockEdgeAppearance, appearanceFromData } from "../DiagramAppearance";
import { useDiagramDrawingOptions } from "../DiagramDrawing";
import { recordedPathLabel } from "../../trace/recordedValuePreview";
import { theme, componentStyles } from "../../theme";
import { recordedReadGeometry, type RecordedReadGeometry } from "./_internal/recordedReadGeometry";

/** A separate, static evidence lane. An explicit host port only changes its endpoint. */
export function RecordedReadEdge({ id, source, target, markerEnd, style, data }: EdgeProps) {
  const { geometry: nodeGeometry } = useDiagramDrawingOptions();
  const lane = typeof data?.lane === "number" ? data.lane : 0;
  const unstyled = data?.unstyled === true;
  const ui = componentStyles();
  const geometry = useStore((state: ReactFlowState) => {
    const route = recordedReadGeometry(state.nodeLookup, source, target, lane, nodeGeometry);
    return route ? JSON.stringify(route) : "";
  });
  if (!geometry) return null;
  const { path, label: box } = JSON.parse(geometry) as RecordedReadGeometry;
  const key = typeof data?.key === "string" ? data.key : "";
  const pathLabel = recordedPathLabel(key);
  const label = `${pathLabel.length > 36 ? `${pathLabel.slice(0, 35)}…` : pathLabel} · recorded read`;
  return <><g data-fp="trace-workflow-read" role="img"
    aria-label={`Recorded read ${pathLabel} from ${String(data?.sourceRuntimeStageId)} to ${String(data?.targetRuntimeStageId)}`}>
    <title>{`Recorded stage read: ${pathLabel}. ${String(data?.sourceRuntimeStageId)} → ${String(data?.targetRuntimeStageId)}`}</title>
    <StockEdgeAppearance path={path} appearance={appearanceFromData(data)} unstyled={unstyled}>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} interactionWidth={0}
        style={unstyled ? style : { strokeDasharray: "6 4", animation: "none", transition: "none", ...style }} />
    </StockEdgeAppearance>
  </g><EdgeLabelRenderer><span data-fp="trace-workflow-read-label" aria-hidden="true"
    style={{ position: "absolute", transform: `translate(-50%, -50%) translate(${box.x + box.width / 2}px,${box.y + box.height / 2}px)`,
      width: "max-content", maxWidth: box.width, height: box.height, boxSizing: "border-box", overflow: "hidden",
      textOverflow: "ellipsis", whiteSpace: "nowrap", pointerEvents: "none",
      ...(!unstyled && { padding: `calc(${ui.spaceXs} - 1px) calc(${ui.spaceXs} + 1px)`, borderRadius: `calc(${ui.radiusControl} - 2px)`,
        fontFamily: theme.fontSans, fontSize: ui.small, lineHeight: "14px", fontWeight: `calc(${ui.weightStrong} - 100)`,
        color: style?.stroke, background: theme.bgPrimary, opacity: 0.96 }) }}>{label}</span></EdgeLabelRenderer></>;
}
