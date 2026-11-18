import { BaseEdge, type EdgeProps } from "@xyflow/react";
import { theme } from "../../theme";
import { DiagramEdgeAppearance, appearanceFromData } from "../DiagramAppearance";

/** The layout projects the endpoints; a straight segment stays in that plane. */
export function IsometricEdge({ id, sourceX, sourceY, targetX, targetY, markerStart, markerEnd, style, data,
  label, labelStyle, labelShowBg, labelBgStyle, labelBgPadding, labelBgBorderRadius, interactionWidth }: EdgeProps) {
  const unstyled = data?.unstyled === true;
  const path = `M${sourceX} ${sourceY}L${targetX} ${targetY}`;
  return <DiagramEdgeAppearance path={path} appearance={appearanceFromData(data)} unstyled={unstyled}>
    <BaseEdge id={id} path={path}
      markerStart={markerStart} markerEnd={markerEnd} interactionWidth={interactionWidth}
      style={unstyled ? style : { stroke: theme.border, strokeWidth: 1.25, ...style }}
      label={label} labelX={(sourceX + targetX) / 2} labelY={(sourceY + targetY) / 2}
      labelStyle={unstyled ? labelStyle : { fill: theme.textPrimary, fontFamily: theme.fontMono, fontSize: 10, ...labelStyle }}
      labelShowBg={labelShowBg} labelBgStyle={unstyled ? labelBgStyle : { fill: theme.bgSecondary, ...labelBgStyle }}
      labelBgPadding={labelBgPadding} labelBgBorderRadius={labelBgBorderRadius} />
  </DiagramEdgeAppearance>;
}
