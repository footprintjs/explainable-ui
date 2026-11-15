import { FootprintButton, componentStyles } from "../../theme";
/**
 * CompactTimeline — Collapsed = dot line, expanded = Gantt chart.
 *
 * Collapsed: single row of colored dots showing execution progress.
 * Expanded: delegates to GanttTimeline for full duration bars.
 *
 * Not the same thing as `<CompactTimelinePanel>`, and neither is going
 * away: this is the CONTROLLED primitive — you pass `snapshots` and
 * `selectedIndex`, so it works anywhere (it is what `<ExplainableShell>`
 * puts in its footer). `<CompactTimelinePanel>` is the `ExplainableView`
 * surface that WRAPS this one: it takes no data props at all, reading the
 * run and the shared cursor out of `<ExplainableProvider>`. Inside a
 * provider use the Panel; outside one, only this component can work.
 */
import { memo, useState, type CSSProperties } from "react";
import { theme } from "../../theme";
import type { StageSnapshot, BaseComponentProps } from "../../types";
import { GanttTimeline } from "../GanttTimeline";

export interface CompactTimelineProps extends BaseComponentProps {
  snapshots: StageSnapshot[];
  selectedIndex: number;
  /** Start expanded or collapsed. Default: collapsed. */
  defaultExpanded?: boolean;
  /** Header text. Default: "Timeline". `<ExplainableShell>` passes
   *  `panelLabels.timeline` here so the desktop footer is labelled by the
   *  same prop as the mobile pill. */
  label?: string;
}

/**
 * A token is a `var(--fp-…, #fallback)` STRING, so the old
 * `theme.textMuted + "40"` produced `var(--fp-text-muted, #64748b)40` — not a
 * colour any browser parses, which is why the pending dots and the connecting
 * line were invisible in the shipped shell footer. `color-mix` is how the rest
 * of this library tints a token (see StageDetailPanel's `wash`).
 */
const tint = (color: string, percent: number): string =>
  `color-mix(in srgb, ${color} ${percent}%, transparent)`;

export const CompactTimeline = memo(function CompactTimeline({
  snapshots,
  selectedIndex,
  defaultExpanded = false,
  label = "Timeline",
  size = "default", unstyled = false, className, style,
}: CompactTimelineProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const ui = componentStyles(size);
  const sx = (value: CSSProperties): CSSProperties | undefined => unstyled ? undefined : value;

  if (snapshots.length === 0) return null;

  return (
    <div className={className} data-fp="compact-timeline" data-expanded={expanded} style={{ ...sx({ borderTop: `${ui.borderWidth} solid ${theme.border}` }), ...style }}>
      {/* Toggle header */}
      <FootprintButton
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        data-fp="compact-timeline-toggle"
        defaultStyle={sx({
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: ui.spaceSm,
          padding: `${ui.controlGap} ${ui.padding}`,
          border: "none",
          background: "transparent",
          cursor: "pointer",
          fontSize: ui.label,
          color: theme.textMuted,
          fontWeight: ui.weightStrong,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        })}
      >
        <span style={sx({ fontSize: ui.small })}>{expanded ? "▼" : "▸"}</span>
        {label}
        <span style={sx({ fontWeight: ui.weightNormal, fontSize: ui.small })}>
          {snapshots.length} stages
        </span>

        {/* Compact dot line (visible when collapsed) */}
        {!expanded && (
          <div
            style={sx({
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: `calc(${ui.spaceXs} / 2)`,
              marginLeft: ui.spaceSm,
            })}
          >
            {snapshots.map((snap, i) => (
              <div
                key={i}
                data-fp="compact-timeline-dot" data-selected={i === selectedIndex} data-visible={i <= selectedIndex}
                style={sx({
                  width: `calc(${ui.iconSize} * ${i === selectedIndex ? "4 / 7" : "5 / 14"})`,
                  height: `calc(${ui.iconSize} * ${i === selectedIndex ? "4 / 7" : "5 / 14"})`,
                  borderRadius: "50%",
                  background:
                    i < selectedIndex
                      ? "var(--fp-success, #22c55e)"
                      : i === selectedIndex
                        ? "var(--fp-accent, #6366f1)"
                        : tint(theme.textMuted, 25),
                  transition: `all ${ui.fastDuration} ${ui.easing}`,
                  flexShrink: 0,
                })}
                title={snap.stageName}
              />
            ))}
            {/* Connecting line */}
            <div
              style={sx({
                flex: 1,
                height: ui.borderWidth,
                background: tint(theme.textMuted, 20),
                marginLeft: `calc(-1 * ${ui.spaceXs} / 2)`,
                marginRight: ui.spaceXs,
              })}
            />
          </div>
        )}
      </FootprintButton>

      {/* Expanded: full Gantt */}
      {expanded && (
        <div style={sx({ padding: `0 ${ui.padding} ${ui.spaceSm}` })}>
          <GanttTimeline
            snapshots={snapshots}
            selectedIndex={selectedIndex}
            size={size}
            unstyled={unstyled}
          />
        </div>
      )}
    </div>
  );
});
