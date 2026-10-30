import { BaseEdge, EdgeLabelRenderer, Position, type EdgeProps } from "@xyflow/react";
import { theme } from "../../theme";

/** Parallel relationships retain separate labels and curves without influencing the structural layout. */
export function RecordedRelationshipEdge(props: EdgeProps) {
  const data = props.data as { parallelIndex?: number; parallelCount?: number; relationship?: { direction?: "backward" | "forward"; attribution: string; kind: string } } | undefined;
  const relationship = data?.relationship;
  const lane = relationship?.direction === "backward" ? -64 : 64;
  const spread = lane + ((data?.parallelIndex ?? 0) - ((data?.parallelCount ?? 1) - 1) / 2) * 36;
  const caption = relationship?.attribution === "stage" ? "Step" : relationship?.attribution === "recorded-read" ? "Read"
    : relationship?.kind === "control" ? "Rule" : relationship?.kind === "data" ? "Data" : "Link";
  const fullLabel = typeof props.label === "string" ? props.label : "Recorded dependency";
  const horizontal = props.sourcePosition === Position.Left || props.sourcePosition === Position.Right;
  const delta = horizontal ? props.targetX - props.sourceX : props.targetY - props.sourceY;
  const bend = Math.max(32, Math.abs(delta) * .35);
  const control = (x: number, y: number, position: Position) => [
    x + (position === Position.Left ? -bend : position === Position.Right ? bend : 0) + (horizontal ? 0 : spread),
    y + (position === Position.Top ? -bend : position === Position.Bottom ? bend : 0) + (horizontal ? spread : 0),
  ];
  const one = control(props.sourceX, props.sourceY, props.sourcePosition), two = control(props.targetX, props.targetY, props.targetPosition);
  const path = `M${props.sourceX},${props.sourceY} C${one[0]},${one[1]} ${two[0]},${two[1]} ${props.targetX},${props.targetY}`;
  const x = (props.sourceX + props.targetX) / 2 + (horizontal ? 0 : spread * .75);
  const y = (props.sourceY + props.targetY) / 2 + (horizontal ? spread * .75 : 0);
  return <>
    <BaseEdge id={props.id} path={path} markerEnd={props.markerEnd} style={props.style} />
    <EdgeLabelRenderer><span className="nodrag nopan" title={fullLabel} aria-label={fullLabel} data-relationship-id={props.id}
      style={{ position: "absolute", transform: `translate(-50%, -50%) translate(${x}px,${y}px)`, fontFamily: theme.fontSans,
        fontSize: 11, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", borderRadius: 4,
        padding: "3px 6px", color: theme.textPrimary, background: theme.bgElevated, pointerEvents: "none" }}>{caption}</span></EdgeLabelRenderer>
  </>;
}
export const recordedRelationshipEdgeTypes = { recordedRelationship: RecordedRelationshipEdge };
