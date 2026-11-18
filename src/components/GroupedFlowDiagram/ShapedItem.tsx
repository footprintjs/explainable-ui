import { useState, type CSSProperties } from "react";
import { Handle, Position, type NodeHandle } from "@xyflow/react";
import { theme } from "../../theme";
import type { DiagramNodeData } from "./DiagramNodes";
import { DiagramIcon } from "./icons";
import { shapeBoundaryPoint, shapeOutline } from "./nodeShapeGeometry";
import type { RecordedPort, RecordedSide } from "./recordedRouting";
import type { FlowDiagramNode, PositionedFlowDiagramNode } from "./types";

type Shape = NonNullable<FlowDiagramNode["shape"]>;
const positions = { left: Position.Left, right: Position.Right, top: Position.Top, bottom: Position.Bottom };

/** XYFlow and the rendered handles use the same perimeter, including after a direction or overlay change. */
export function shapedItemHandles(item: PositionedFlowDiagramNode, direction: "LR" | "TB", ports: readonly RecordedPort[] = []): NodeHandle[] | undefined {
  const shape = item.node.shape;
  if (!shape || item.node.kind === "group") return undefined;
  const handle = (type: "source" | "target", side: RecordedSide, offset?: number, id?: string): NodeHandle => ({
    type, id, position: positions[side], ...shapeBoundaryPoint(shape, item.width, item.height, side, offset), width: 0, height: 0,
  });
  return [handle("target", direction === "LR" ? "left" : "top"), handle("source", direction === "LR" ? "right" : "bottom"),
    ...ports.map(port => handle(port.type, port.side, port.offset, port.id))];
}

const textAreas: Record<Shape, CSSProperties> = {
  diamond: { left: "17%", right: "17%", top: "50%" },
  parcel: { left: "5%", right: "17%", top: "57%" },
  document: { left: "7%", right: "7%", top: "52%" },
};

export function ShapedItem({ data, shape, action, status, statusId }: {
  data: DiagramNodeData; shape: Shape; action: string; status: string; statusId: string;
}) {
  const { item, selected, caption } = data, { node, state, width, height } = item;
  const { outline, facets, details } = shapeOutline(shape, width, height);
  const [focused, setFocused] = useState(false);
  const decision = node.kind === "decision";
  const stroke = state === "failed" ? theme.error : item.highlighted ? theme.tracing : theme.textMuted;
  const describedBy = [statusId, decision && `${statusId}-decision`, item.isRootCause && `${statusId}-cause`].filter(Boolean).join(" ");
  return <>
    <button type="button" className="nodrag nopan" aria-label={action} aria-pressed={selected} aria-describedby={describedBy}
      title={node.description ? `${node.label}. ${node.description}` : node.label}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      onClick={event => { event.stopPropagation(); data.onSelect(node.id); }}
      style={{ position: "relative", display: "block", width: "100%", height: "100%", boxSizing: "border-box", margin: 0, padding: 0,
        border: 0, borderRadius: 0, outline: 0, background: "transparent", color: theme.textPrimary, fontFamily: theme.fontSans,
        clipPath: `path('${outline}')`, cursor: "pointer", pointerEvents: "auto" }}>
      <svg data-shape-body="" aria-hidden="true" width={width} height={height} viewBox={`0 0 ${width} ${height}`}
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }} strokeLinejoin="round">
        <path d={outline} fill={theme.bgElevated} />
        {facets && <path d={facets} fill={theme.textMuted} opacity={.18} />}
        {details && <path data-shape-details="" d={details} fill="none" stroke={theme.textMuted} strokeWidth={1.5} />}
        {(focused || selected) && <path data-shape-ring={focused ? "focus" : "selected"} d={outline} fill="none"
          stroke={focused ? theme.textPrimary : theme.tracing} strokeWidth={focused ? 13 : 10} />}
        <path data-shape-outline="" d={outline} fill="none" stroke={stroke} strokeWidth={4} strokeDasharray={state === "not-run" ? "7 5" : undefined} />
      </svg>
      <span style={{ position: "absolute", ...textAreas[shape], transform: "translateY(-50%)", display: "flex", flexDirection: "column",
        alignItems: "center", gap: 4, textAlign: "center" }}>
        {(node.icon || decision) && <span style={{ display: "inline-flex", gap: 5, alignItems: "center", color: theme.textSecondary, fontSize: 11, lineHeight: "16px" }}>
          {node.icon && <DiagramIcon icon={node.icon} style={{ width: 20, height: 20, fontSize: 18, color: state === "not-run" ? theme.textMuted : theme.warning }} />}
          {decision && <span id={`${statusId}-decision`}>Decision</span>}
        </span>}
        <strong style={{ fontSize: 18, lineHeight: "21px", maxWidth: "100%", overflowWrap: "anywhere", display: "-webkit-box",
          WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{node.label}</strong>
        {caption && <span style={{ fontSize: 10, lineHeight: "12px", color: theme.textSecondary }}>{caption}</span>}
        <span id={statusId} style={{ display: "inline-flex", alignItems: "center", gap: 4, color: state === "failed" ? theme.error : theme.textSecondary,
          fontSize: 12, lineHeight: "16px", whiteSpace: "nowrap" }}>
          {(state === "completed" || state === "failed") && <span aria-hidden="true" style={{ width: 15, height: 15, borderRadius: "50%",
            lineHeight: "15px", fontWeight: 700, background: state === "failed" ? theme.error : theme.success,
            color: state === "failed" ? theme.onError : theme.onSuccess }}>{state === "failed" ? "×" : "✓"}</span>}
          {status}
        </span>
      </span>
    </button>
    {data.shapeHandles?.map(handle => <Handle key={handle.id ?? handle.type} id={handle.id} type={handle.type} position={handle.position}
      isConnectable={false} data-recorded-port={handle.id ?? undefined} style={{ left: handle.x, top: handle.y, right: "auto", bottom: "auto",
        width: 0, height: 0, minWidth: 0, minHeight: 0, border: 0, transform: "none", opacity: 0, pointerEvents: "none" }} />)}
  </>;
}
