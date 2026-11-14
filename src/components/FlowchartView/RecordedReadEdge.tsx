import { BaseEdge, useStore } from "@xyflow/react";
import type { EdgeProps, ReactFlowState } from "@xyflow/react";
import { GROUP_CONTAINER_NODE_TYPE } from "./_internal/groupLayout";
import { recordedPathLabel } from "../../trace/recordedValuePreview";

/** A separate, static evidence lane. It never borrows execution edges or their handles. */
export function RecordedReadEdge({ id, source, target, markerEnd, style, data }: EdgeProps) {
  const lane = typeof data?.lane === "number" ? data.lane : 0;
  const geometry = useStore((state: ReactFlowState) => {
    const from = state.nodeLookup.get(source), to = state.nodeLookup.get(target);
    if (!from || !to) return "";
    let left = Infinity;
    for (const node of state.nodeLookup.values()) {
      if (node.type === GROUP_CONTAINER_NODE_TYPE) continue;
      left = Math.min(left, node.internals.positionAbsolute.x);
    }
    const sx = from.internals.positionAbsolute.x, tx = to.internals.positionAbsolute.x;
    const sy = from.internals.positionAbsolute.y + (from.measured.height ?? 0) / 2;
    const ty = to.internals.positionAbsolute.y + (to.measured.height ?? 0) / 2;
    const x = Math.min(left, sx, tx) - 36 - (lane % 6) * 18;
    return JSON.stringify([`M ${sx} ${sy} C ${x} ${sy}, ${x} ${ty}, ${tx} ${ty}`, x, (sy + ty) / 2]);
  });
  if (!geometry) return null;
  const [path, labelX, labelY] = JSON.parse(geometry) as [string, number, number];
  const key = typeof data?.key === "string" ? data.key : "";
  const pathLabel = recordedPathLabel(key);
  const label = `${pathLabel.length > 36 ? `${pathLabel.slice(0, 35)}…` : pathLabel} · recorded read`;
  return <g data-fp="trace-workflow-read" role="img"
    aria-label={`Recorded read ${pathLabel} from ${String(data?.sourceRuntimeStageId)} to ${String(data?.targetRuntimeStageId)}`}>
    <title>{`Recorded stage read: ${pathLabel}. ${String(data?.sourceRuntimeStageId)} → ${String(data?.targetRuntimeStageId)}`}</title>
    <BaseEdge id={id} path={path} markerEnd={markerEnd} interactionWidth={0}
      label={label} labelX={labelX} labelY={labelY} labelShowBg
      labelBgPadding={[5, 3]} labelBgBorderRadius={4}
      labelBgStyle={{ fill: "var(--fp-bg-primary, #0f172a)", fillOpacity: 0.96 }}
      labelStyle={{ fill: style?.stroke, fontSize: 10, fontWeight: 600 }}
      style={{ ...style, strokeDasharray: "6 4", animation: "none", transition: "none" }} />
  </g>;
}
