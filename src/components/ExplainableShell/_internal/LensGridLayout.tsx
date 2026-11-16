import type { CSSProperties, KeyboardEventHandler, ReactNode, Ref } from "react";
import type { Size } from "../../../types";
import {
  resolveLensLayout,
  type LensLayoutDefinition,
  type LensLayoutSurface,
} from "../../../model/lensLayout";
import { componentStyles, theme } from "../../../theme";

export interface LensGridLayoutProps {
  containerRef?: Ref<HTMLDivElement>;
  onKeyDown?: KeyboardEventHandler<HTMLDivElement>;
  className?: string;
  style?: CSSProperties;
  themeStyle?: CSSProperties;
  isNarrow: boolean;
  unstyled?: boolean;
  size?: Size;
  layout: LensLayoutDefinition;
  surfaces: Record<LensLayoutSurface, ReactNode>;
}

const SURFACE_LABELS: Record<LensLayoutSurface, string> = {
  timeTravel: "Time travel",
  flowchart: "Workflow",
  developer: "Developer",
  commentary: "Commentary",
  timeline: "Timeline",
  details: "Details",
};

/** Arrange the existing surfaces without creating another selection or replay controller. */
export function LensGridLayout({
  containerRef, onKeyDown, className, style, themeStyle, isNarrow, unstyled,
  size = "default", layout, surfaces,
}: LensGridLayoutProps) {
  // Also validates during SSR; named areas mount once even when they span cells.
  const { definition, order } = resolveLensLayout(layout);
  const ui = componentStyles(size);
  const rootStyle: CSSProperties | undefined = unstyled ? style : {
    ...themeStyle,
    boxSizing: "border-box",
    height: "100%",
    minHeight: definition.minHeight ?? 0,
    minWidth: 0,
    display: isNarrow ? "flex" : "grid",
    ...(isNarrow ? { flexDirection: "column" as const } : {
      gridTemplateColumns: definition.columns,
      gridTemplateRows: definition.rows,
      gridTemplateAreas: definition.areas.map(row => `"${row.join(" ")}"`).join(" "),
    }),
    gap: definition.gap ?? ui.spaceSm,
    overflow: isNarrow ? "auto" : "hidden",
    overscrollBehavior: "contain",
    background: theme.bgPrimary,
    color: theme.textPrimary,
    fontFamily: theme.fontSans,
    fontSize: ui.body,
    lineHeight: ui.lineHeight,
    ...style,
  };

  return <div ref={containerRef} onKeyDown={onKeyDown} className={className}
    data-fp="explainable-shell" data-layout="grid" data-narrow={isNarrow || undefined}
    data-unstyled={unstyled || undefined} data-size={size} style={rootStyle}>
    {order.map(surface => {
      const stackedHeight = surface === "flowchart" ? 320
        : surface === "developer" || surface === "commentary" || surface === "details" ? 240
        : undefined;
      const surfaceStyle: CSSProperties | undefined = unstyled ? undefined : {
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        minHeight: isNarrow ? stackedHeight ?? 0 : 0,
        ...(isNarrow ? { flexShrink: 0, height: stackedHeight } : { gridArea: surface }),
        overflow: surface === "flowchart" ? "hidden" : "auto",
      };
      return <section key={surface} data-fp-surface={surface}
        aria-label={SURFACE_LABELS[surface]} style={surfaceStyle}>
        {surfaces[surface]}
      </section>;
    })}
  </div>;
}
