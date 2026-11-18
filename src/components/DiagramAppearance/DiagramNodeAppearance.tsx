import type { ReactNode } from "react";
import { componentStyles, theme } from "../../theme";
import { appearanceLabel, readDiagramObjectAppearance, type DiagramObjectAppearance } from "./model";
import { RemovedDrawingStyle, useDrawingBoundary } from "./RemovedDrawingStyle";

const ui = componentStyles();

export interface DiagramNodeAppearanceProps {
  readonly appearance?: DiagramObjectAppearance;
  readonly unstyled?: boolean;
  readonly children?: ReactNode;
}

/** The chart node supplies the positioned footprint. The drawing stays in its original DOM position. */
export function DiagramNodeAppearance({ appearance: supplied, unstyled, children }: DiagramNodeAppearanceProps) {
  const appearance = readDiagramObjectAppearance(supplied);
  const label = appearance && appearanceLabel(appearance);
  const boundary = useDrawingBoundary(Boolean(label));
  const progress = appearance?.progress;
  const ratio = progress && progress.completed / progress.total;
  const removed = appearance?.presence === "removed";
  return <>
    {removed && !unstyled && <RemovedDrawingStyle boundary={boundary}/>}
    {children}
    {label && <div id={boundary + "-end"} data-fp="diagram-node-appearance"
      data-activity={appearance?.activity} data-presence={appearance?.presence}
      style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1 }}>
      {(appearance?.activity || progress) && <svg data-fp="diagram-node-ring" width={24} height={24} viewBox="0 0 24 24"
        focusable="false" role={progress ? "progressbar" : undefined} aria-hidden={progress ? undefined : true}
        aria-label={progress ? (progress.unit ? `Progress in ${progress.unit}` : "Progress") : undefined}
        aria-valuemin={progress ? 0 : undefined} aria-valuemax={progress?.total} aria-valuenow={progress?.completed}
        style={{ position: "absolute", bottom: 2, right: 2, pointerEvents: "none", maxHeight: "100%", maxWidth: "100%" }}>
        <circle cx={12} cy={12} r={9} fill={unstyled ? "none" : theme.bgSecondary}
          stroke={unstyled ? "currentColor" : theme.border} strokeWidth={2} />
        <circle data-fp="diagram-node-progress" cx={12} cy={12} r={9} fill="none" pathLength={1}
          transform="rotate(-90 12 12)" stroke={ratio === 0 ? "none" : unstyled ? "currentColor" : theme.accent}
          strokeWidth={2.5} strokeDasharray={ratio === undefined ? "0.07 0.06" : `${ratio} 1`} />
      </svg>}
      <span style={{ position: "absolute", left: "50%", bottom: "100%", marginBottom: 3, transform: "translateX(-50%)",
        width: "max-content", maxWidth: "100%", textAlign: "center",
        ...(!unstyled && { color: theme.textPrimary, backgroundColor: theme.bgSecondary, borderRadius: ui.radiusBadge,
          padding: `0 ${ui.spaceXs}`, fontFamily: theme.fontSans, fontSize: ui.small, lineHeight: ui.lineHeight }) }}>{label}</span>
    </div>}
  </>;
}
