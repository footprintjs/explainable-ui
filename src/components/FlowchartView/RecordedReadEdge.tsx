import { BaseEdge, EdgeLabelRenderer, useStore } from "@xyflow/react";
import type { EdgeProps, ReactFlowState } from "@xyflow/react";
import { recordedPathLabel } from "../../trace/recordedValuePreview";
import { theme } from "../../theme";
import { recordedReadGeometry, type RecordedReadGeometry } from "./_internal/recordedReadGeometry";

/** A separate, static evidence lane. It never borrows execution edges or their handles. */
export function RecordedReadEdge({ id, source, target, markerEnd, style, data }: EdgeProps) {
  const lane = typeof data?.lane === "number" ? data.lane : 0;
  const geometry = useStore((state: ReactFlowState) => {
    const route = recordedReadGeometry(state.nodeLookup, source, target, lane);
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
    <BaseEdge id={id} path={path} markerEnd={markerEnd} interactionWidth={0}
      style={{ ...style, strokeDasharray: "6 4", animation: "none", transition: "none" }} />
  </g><EdgeLabelRenderer><span data-fp="trace-workflow-read-label" aria-hidden="true"
    style={{ position: "absolute", transform: `translate(-50%, -50%) translate(${box.x + box.width / 2}px,${box.y + box.height / 2}px)`,
      width: "max-content", maxWidth: box.width, height: box.height, boxSizing: "border-box", padding: "3px 5px", overflow: "hidden",
      textOverflow: "ellipsis", whiteSpace: "nowrap", borderRadius: 4, fontFamily: theme.fontSans, fontSize: 10, lineHeight: "14px",
      fontWeight: 600, color: style?.stroke, background: theme.bgPrimary, opacity: 0.96, pointerEvents: "none" }}>{label}</span></EdgeLabelRenderer></>;
}
