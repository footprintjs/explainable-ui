import type { ReactNode } from "react";
import { componentStyles, theme } from "../../theme";
import { appearanceLabel, readDiagramObjectAppearance, type DiagramObjectAppearance } from "./model";
import { RemovedDrawingStyle, useDrawingBoundary } from "./RemovedDrawingStyle";

const ui = componentStyles();

export interface DiagramEdgeAppearanceProps {
  readonly appearance?: DiagramObjectAppearance;
  readonly path: string;
  readonly unstyled?: boolean;
  readonly children?: ReactNode;
}

/** Reuse the actual routed path for the measured length and visible annotation. */
export function DiagramEdgeAppearance({ appearance: supplied, path, unstyled, children }: DiagramEdgeAppearanceProps) {
  const appearance = readDiagramObjectAppearance(supplied);
  const label = appearance && appearanceLabel(appearance);
  const boundary = useDrawingBoundary(Boolean(label));
  const removed = appearance?.presence === "removed";
  const progress = appearance?.progress;
  const ratio = progress && progress.completed / progress.total;
  return <>
    {removed && !unstyled && <RemovedDrawingStyle boundary={boundary}/>}
    {children}
    {label && <g id={boundary + "-end"} data-fp="diagram-edge-appearance" role="img" aria-label={label} pointerEvents="none"
      data-activity={appearance?.activity} data-presence={appearance?.presence}>
      <title>{label}</title>
      <path id={boundary + "-path"} d={path} fill="none"
        stroke={ratio === 0 || (!progress && !appearance?.activity) ? "none" : unstyled ? "currentColor" : theme.accent}
        strokeWidth={unstyled ? undefined : 3} pathLength={progress ? 1 : undefined}
        strokeDasharray={ratio === undefined ? "4 4" : `${ratio} 1`} strokeLinecap="butt"/>
      <text dy="-4" textAnchor="middle" aria-hidden="true" style={unstyled ? undefined : {
        fill: theme.textPrimary, stroke: theme.bgPrimary, strokeWidth: 3, paintOrder: "stroke",
        fontFamily: theme.fontSans, fontSize: ui.small,
      }}><textPath href={`#${boundary}-path`} startOffset="50%">{label}</textPath></text>
    </g>}
  </>;
}
