import { BaseEdge, EdgeLabelRenderer, type EdgeProps } from "@xyflow/react";
import { theme } from "../../theme";
import { recordedRoutePath, type RecordedRoute } from "./recordedRouting";

/** Parallel relationships retain separate labels and curves without influencing the structural layout. */
export function RecordedRelationshipEdge(props: EdgeProps) {
  const data = props.data as { route?: RecordedRoute; relationship?: { direction?: "backward" | "forward"; attribution: string; kind: string } } | undefined;
  const relationship = data?.relationship;
  const route = data?.route;
  // The owner reports undrawn relationships rather than substituting an unsafe curve.
  if (!route) return null;
  const caption = relationship?.attribution === "stage" ? "Step" : relationship?.attribution === "recorded-read" ? "Read"
    : relationship?.kind === "control" ? "Rule" : relationship?.kind === "data" ? "Data" : "Link";
  const fullLabel = typeof props.label === "string" ? props.label : "Recorded dependency";
  const path = recordedRoutePath(route, { x: props.sourceX, y: props.sourceY }, { x: props.targetX, y: props.targetY });
  const { x, y } = route.label;
  return <>
    <BaseEdge id={props.id} path={path} markerEnd={props.markerEnd} style={props.style} />
    <EdgeLabelRenderer><span className="nodrag nopan" title={fullLabel} aria-label={fullLabel} data-relationship-id={props.id}
      style={{ position: "absolute", transform: `translate(-50%, -50%) translate(${x}px,${y}px)`, fontFamily: theme.fontSans,
        fontSize: 11, width: route.label.width, height: route.label.height, boxSizing: "border-box", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", borderRadius: 4,
        padding: "2px 5px", border: `1px solid ${relationship?.direction === "backward" ? theme.error : relationship?.direction === "forward" ? theme.tracing : theme.textSecondary}`, color: theme.textPrimary, background: theme.bgElevated, pointerEvents: "none" }}>{caption}</span></EdgeLabelRenderer>
  </>;
}
export const recordedRelationshipEdgeTypes = { recordedRelationship: RecordedRelationshipEdge };
