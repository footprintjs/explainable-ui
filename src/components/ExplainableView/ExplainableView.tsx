import * as React from "react";

import type { BaseComponentProps } from "../../types";
import { theme } from "../../theme";
import {
  ExplainableProvider,
  useExplainableRun,
  type ExplainableProviderProps,
  type ExplainableRunContextValue,
} from "./ExplainableContext";
import { TimelinePanel } from "./TimelinePanel";
import { FlowchartPanel } from "./FlowchartPanel";
import { ValueInspector } from "./ValueInspector";
import { CommentaryPanel } from "./CommentaryPanel";
import { TimeTravelBar } from "./TimeTravelBar";
import { CompactTimelinePanel } from "./CompactTimelinePanel";
import { SurfaceCollapseHandle } from "./SurfaceCollapseHandle";

export type ExplainableSurface =
  | "timeTravel"
  | "timeline"
  | "stageRail"
  | "flowchart"
  | "inspector"
  | "commentary";
export type ExplainableViewPreset =
  | "developer"
  | "product"
  | "studio"
  | "linear";
export interface ExplainableLayoutDefinition {
  readonly columns: string;
  readonly rows?: string;
  readonly areas: ReadonlyArray<
    ReadonlyArray<ExplainableSurface | ".">
  >;
  readonly minHeight?: number | string;
  readonly gap?: number | string;
}
export type ExplainableViewLayout =
  | ExplainableViewPreset
  | ExplainableLayoutDefinition;
export type ExplainableViewSlot =
  | React.ReactNode
  | ((context: ExplainableRunContextValue) => React.ReactNode);

export interface ExplainableViewSlots {
  readonly timeTravel?: ExplainableViewSlot;
  readonly timeline?: ExplainableViewSlot;
  readonly stageRail?: ExplainableViewSlot;
  readonly flowchart?: ExplainableViewSlot;
  readonly inspector?: ExplainableViewSlot;
  readonly commentary?: ExplainableViewSlot;
}

export interface ExplainableViewProps
  extends Omit<ExplainableProviderProps, "children" | "className" | "style">,
    BaseComponentProps {
  readonly layout?: ExplainableViewLayout;
  readonly slots?: ExplainableViewSlots;
  readonly minHeight?: number | string;
  readonly detailsExpanded?: boolean;
  readonly defaultDetailsExpanded?: boolean;
  readonly onDetailsExpandedChange?: (expanded: boolean) => void;
  readonly detailsLabel?: string;
}

const layoutPresets: Record<ExplainableViewPreset, ExplainableLayoutDefinition> = {
  developer: {
    columns: "minmax(0, 1.7fr) minmax(300px, 0.8fr)",
    rows: "auto minmax(0, 1fr) auto",
    areas: [
      ["timeTravel", "timeTravel"],
      ["flowchart", "inspector"],
      ["timeline", "timeline"],
    ],
    minHeight: 720,
    gap: 1,
  },
  product: {
    columns: "minmax(0, 1.7fr) minmax(300px, 0.8fr)",
    rows: "auto minmax(0, 1fr) minmax(0, 0.55fr)",
    areas: [
      ["timeTravel", "timeTravel"],
      ["flowchart", "inspector"],
      ["commentary", "commentary"],
    ],
    minHeight: 720,
    gap: 1,
  },
  studio: {
    columns: "minmax(0, 1.7fr) minmax(300px, 0.8fr)",
    rows: "auto minmax(0, 1.35fr) minmax(0, 0.8fr) auto",
    areas: [
      ["timeTravel", "timeTravel"],
      ["flowchart", "stageRail"],
      ["inspector", "commentary"],
      ["timeline", "timeline"],
    ],
    minHeight: 720,
    gap: 1,
  },
  linear: {
    columns: "minmax(0, 1fr)",
    rows: "auto minmax(320px, auto) repeat(3, minmax(320px, auto)) auto",
    areas: [
      ["timeTravel"],
      ["stageRail"],
      ["flowchart"],
      ["inspector"],
      ["commentary"],
      ["timeline"],
    ],
    minHeight: 720,
    gap: 1,
  },
};

function resolveLayout(layout: ExplainableViewLayout): {
  definition: ExplainableLayoutDefinition;
  name: ExplainableViewPreset | "custom";
  surfaces: ExplainableSurface[];
} {
  const definition = typeof layout === "string" ? layoutPresets[layout] : layout;
  const name = typeof layout === "string" ? layout : "custom";
  if (definition.areas.length === 0 || definition.areas[0]?.length === 0) {
    throw new Error("ExplainableView layout areas must contain at least one surface.");
  }

  const width = definition.areas[0]?.length ?? 0;
  if (definition.areas.some((row) => row.length !== width)) {
    throw new Error("ExplainableView layout area rows must have equal lengths.");
  }

  const surfaces = Array.from(
    new Set(
      definition.areas
        .flat()
        .filter((surface): surface is ExplainableSurface => surface !== "."),
    ),
  );
  return {
    definition,
    name,
    surfaces,
  };
}

function renderSlot(
  slot: ExplainableViewSlot | undefined,
  fallback: React.ReactNode,
  context: ExplainableRunContextValue,
): React.ReactNode {
  if (slot === undefined) return fallback;
  return typeof slot === "function" ? slot(context) : slot;
}

function ViewContents({
  layout,
  slots,
  minHeight,
  detailsExpanded: controlledDetailsExpanded,
  defaultDetailsExpanded = true,
  onDetailsExpandedChange,
  detailsLabel = "Details",
  unstyled,
  className,
  style,
}: Omit<
  Pick<
    ExplainableViewProps,
    | "layout"
    | "slots"
    | "minHeight"
    | "detailsExpanded"
    | "defaultDetailsExpanded"
    | "onDetailsExpandedChange"
    | "detailsLabel"
    | "unstyled"
    | "className"
    | "style"
  >,
  "layout"
> & { readonly layout: ExplainableViewLayout }) {
  const context = useExplainableRun();
  const resolved = resolveLayout(layout);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [isNarrow, setIsNarrow] = React.useState(false);
  const [uncontrolledDetailsExpanded, setUncontrolledDetailsExpanded] =
    React.useState(defaultDetailsExpanded);
  const detailsExpanded =
    controlledDetailsExpanded ?? uncontrolledDetailsExpanded;
  const toggleDetails = () => {
    const nextExpanded = !detailsExpanded;
    if (controlledDetailsExpanded === undefined) {
      setUncontrolledDetailsExpanded(nextExpanded);
    }
    onDetailsExpandedChange?.(nextExpanded);
  };
  React.useEffect(() => {
    const element = rootRef.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      setIsNarrow(entry.contentRect.width < 640);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const responsiveDefinition = resolved.definition;
  const responsiveTemplateAreas = responsiveDefinition.areas
    .map((row) => `"${row.join(" ")}"`)
    .join(" ");
  const renderSurface = (surface: ExplainableSurface) => {
    const fallback = {
      timeTravel: <TimeTravelBar unstyled={unstyled} />,
      timeline: <CompactTimelinePanel unstyled={unstyled} />,
      stageRail: <TimelinePanel unstyled={unstyled} />,
      flowchart: <FlowchartPanel unstyled={unstyled} />,
      inspector: <ValueInspector unstyled={unstyled} />,
      commentary: <CommentaryPanel unstyled={unstyled} />,
    }[surface];
    return renderSlot(slots?.[surface], fallback, context);
  };

  if (unstyled) {
    return (
      <div className={className} style={style} data-fp="explainable-view" data-layout={resolved.name}>
        {resolved.surfaces.map((surface) => (
          <div data-fp-surface={surface} key={surface}>
            {renderSurface(surface)}
          </div>
        ))}
      </div>
    );
  }

  if (resolved.name === "developer" || resolved.name === "product") {
    const product = resolved.name === "product";
    const surfaceStyle: React.CSSProperties = {
      display: "flex",
      minWidth: 0,
      minHeight: 0,
      flexDirection: "column",
      overflow: "hidden",
    };
    return (
      <div
        ref={rootRef}
        className={className}
        data-fp="explainable-view"
        data-layout={resolved.name}
        data-narrow={isNarrow || undefined}
        style={{
          boxSizing: "border-box",
          display: "flex",
          height: "100%",
          maxHeight: "100%",
          minHeight: minHeight ?? resolved.definition.minHeight ?? 720,
          flexDirection: "column",
          overflow: "hidden",
          overscrollBehavior: "contain",
          border: `1px solid ${theme.border}`,
          borderRadius: "var(--fp-radius, 8px)",
          background: theme.border,
          ...style,
        }}
      >
        <div data-fp-surface="timeTravel" style={{ ...surfaceStyle, flex: "0 0 auto" }}>
          {renderSurface("timeTravel")}
        </div>
        <div
          data-fp="workbench-main"
          style={{
            display: "flex",
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            flexDirection: isNarrow ? "column" : "row",
            overflow: "hidden",
          }}
        >
          <div
            data-fp-surface="flowchart"
            style={{
              ...surfaceStyle,
              flex: detailsExpanded && isNarrow ? "1 1 58%" : "1 1 auto",
            }}
          >
            {renderSurface("flowchart")}
          </div>
          <SurfaceCollapseHandle
            expanded={detailsExpanded}
            label={detailsLabel}
            onToggle={toggleDetails}
            orientation={isNarrow ? "horizontal" : "vertical"}
          />
          {detailsExpanded ? (
            <div
              data-fp-surface="inspector"
              style={{
                ...surfaceStyle,
                width: isNarrow ? "100%" : "42%",
                minWidth: isNarrow ? 0 : 300,
                maxWidth: isNarrow ? "none" : 550,
                flex: isNarrow ? "0 1 42%" : "0 0 auto",
              }}
            >
              {renderSurface("inspector")}
            </div>
          ) : null}
        </div>
        {product ? (
          <div
            data-fp-surface="commentary"
            style={{
              ...surfaceStyle,
              width: "100%",
              flex: "0 0 34%",
              borderTop: `1px solid ${theme.border}`,
            }}
          >
            {renderSurface("commentary")}
          </div>
        ) : (
          <div data-fp-surface="timeline" style={{ ...surfaceStyle, flex: "0 0 auto" }}>
            {renderSurface("timeline")}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className={className}
      data-fp="explainable-view"
      data-layout={resolved.name}
      data-narrow={isNarrow || undefined}
      style={{
        boxSizing: "border-box",
        display: "grid",
        height: resolved.name === "linear" ? undefined : "100%",
        maxHeight: resolved.name === "linear" ? undefined : "100%",
        gridTemplateColumns: responsiveDefinition.columns,
        gridTemplateRows: responsiveDefinition.rows,
        gridTemplateAreas: responsiveTemplateAreas,
        gap: responsiveDefinition.gap ?? 1,
        minHeight: minHeight ?? responsiveDefinition.minHeight ?? 720,
        overflow: resolved.name === "linear" ? "auto" : "hidden",
        overscrollBehavior: "contain",
        border: `1px solid ${theme.border}`,
        borderRadius: "var(--fp-radius, 8px)",
        background: theme.border,
        ...style,
      }}
    >
      {resolved.surfaces.map((surface) => (
        <div
          data-fp-surface={surface}
          key={surface}
          style={{
            display: "flex",
            minWidth: 0,
            minHeight: 0,
            flexDirection: "column",
            gridArea: surface,
            overflow: "hidden",
          }}
        >
          {renderSurface(surface)}
        </div>
      ))}
    </div>
  );
}

export function ExplainableView({
  recording,
  selectedIndex,
  defaultSelectedIndex,
  onSelectedIndexChange,
  theme: viewTheme,
  layout = "developer",
  slots,
  minHeight,
  detailsExpanded,
  defaultDetailsExpanded,
  onDetailsExpandedChange,
  detailsLabel,
  unstyled = false,
  className,
  style,
}: ExplainableViewProps) {
  return (
    <ExplainableProvider
      recording={recording}
      selectedIndex={selectedIndex}
      defaultSelectedIndex={defaultSelectedIndex}
      onSelectedIndexChange={onSelectedIndexChange}
      theme={viewTheme}
    >
      <ViewContents
        layout={layout}
        slots={slots}
        minHeight={minHeight}
        detailsExpanded={detailsExpanded}
        defaultDetailsExpanded={defaultDetailsExpanded}
        onDetailsExpandedChange={onDetailsExpandedChange}
        detailsLabel={detailsLabel}
        unstyled={unstyled}
        className={className}
        style={style}
      />
    </ExplainableProvider>
  );
}
