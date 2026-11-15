import { memo, type ReactNode, type CSSProperties } from "react";
import { theme, componentStyles, FootprintButton, FootprintCode, FootprintIcon } from "../../../theme";

/** Horizontal line with centered pill (for top/bottom edges) */
export const HLinePill = memo(function HLinePill({
  label,
  detail,
  expanded,
  onClick,
}: {
  label: string;
  detail?: string;
  expanded: boolean;
  onClick: () => void;
}) {
  const ui = componentStyles();
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 0,
      padding: "0",
    }}>
      <div style={{ flex: 1, height: ui.borderWidth, background: theme.border }} />
      <FootprintButton
        part="shell-collapse-horizontal" aria-expanded={expanded}
        onClick={onClick}
        defaultStyle={{
          display: "flex",
          alignItems: "center",
          gap: ui.controlGap,
          padding: ui.controlPadding,
          minHeight: ui.controlHeight,
          margin: `${ui.spaceXs} 0`,
          fontSize: ui.small,
          lineHeight: ui.lineHeight,
          fontWeight: ui.weightStrong,
          fontFamily: theme.fontSans,
          color: theme.textMuted,
          background: theme.bgSecondary,
          border: `${ui.borderWidth} solid ${theme.border}`,
          borderRadius: ui.radiusBadge,
          cursor: "pointer",
          whiteSpace: "nowrap",
          transition: `color ${ui.fastDuration} ${ui.easing}`,
        }}
      >
        <FootprintIcon name={expanded ? "collapse" : "expand"} part="shell-collapse-icon" aria-hidden="true"
          defaultStyle={{ width: ui.iconSize, height: ui.iconSize, fontSize: ui.small, lineHeight: ui.lineHeight }}>{expanded ? "▼" : "▶"}</FootprintIcon>
        {label}
        {detail && <span style={{ fontWeight: ui.weightNormal, color: theme.textSecondary, fontSize: ui.small }}>{detail}</span>}
      </FootprintButton>
      <div style={{ flex: 1, height: ui.borderWidth, background: theme.border }} />
    </div>
  );
});

/** Vertical line with centered pill (for left/right edges).
 *  `side` controls arrow direction:
 *  - "right": expanded=▶ collapsed=◀ (panel is on right, collapses right)
 *  - "left":  expanded=◀ collapsed=▶ (panel is on left, collapses left)
 */
export const VLinePill = memo(function VLinePill({
  label,
  expanded,
  side = "right",
  onClick,
}: {
  label: string;
  expanded: boolean;
  side?: "left" | "right";
  onClick: () => void;
}) {
  const ui = componentStyles();
  const arrow = side === "right"
    ? (expanded ? "▶" : "◀")
    : (expanded ? "◀" : "▶");
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 0,
      padding: "0",
    }}>
      <div style={{ flex: 1, width: ui.borderWidth, background: theme.border }} />
      <FootprintButton
        part="shell-collapse-vertical" aria-expanded={expanded}
        onClick={onClick}
        style={{ display: "flex", alignItems: "center", writingMode: "vertical-lr" }}
        defaultStyle={{
          gap: ui.controlGap,
          padding: `${ui.controlPaddingX} ${ui.spaceXs}`,
          margin: `0 ${ui.spaceXs}`,
          fontSize: ui.small,
          lineHeight: ui.lineHeight,
          fontWeight: ui.weightStrong,
          fontFamily: theme.fontSans,
          color: theme.textMuted,
          background: theme.bgSecondary,
          border: `${ui.borderWidth} solid ${theme.border}`,
          borderRadius: ui.radiusBadge,
          cursor: "pointer",
          whiteSpace: "nowrap",
          transition: `color ${ui.fastDuration} ${ui.easing}`,
        }}
      >
        <FootprintIcon name={expanded ? "collapse" : "expand"} part="shell-collapse-icon" aria-hidden="true"
          style={{ writingMode: "horizontal-tb", flexShrink: 0 }}
          defaultStyle={{ width: ui.iconSize, height: ui.iconSize, fontSize: ui.small, lineHeight: ui.lineHeight }}>{arrow}</FootprintIcon>
        {label}
      </FootprintButton>
      <div style={{ flex: 1, width: ui.borderWidth, background: theme.border }} />
    </div>
  );
});

// ---------------------------------------------------------------------------
// Diagnosis panels — what to do when an ingredient is missing
// ---------------------------------------------------------------------------
//
// Both of these exist because the shell used to fail by rendering LESS: no
// chart region, or full chrome with zero rows. Silence reads as "the library
// is broken"; naming the missing ingredient reads as "add this line".

/** Shown in the chart's place when there is a run to draw but no graph. */
export const MissingChartNote = memo(function MissingChartNote({ unstyled }: { unstyled?: boolean }) {
  const ui = componentStyles();
  const body = (
    <>
      <strong>No chart — `traceGraph` was not provided.</strong>
      <div>
        A snapshot holds the memory, the story and the timeline. Only the chart's own
        structure can draw the chart. Two ways to get one:
      </div>
      <pre style={unstyled ? undefined : { margin: 0, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
        <FootprintCode part="missing-chart-code" unstyled={unstyled} defaultStyle={{ fontFamily: theme.fontMono, fontSize: ui.small, whiteSpace: "pre-wrap" }}>
{`// live build
const trace = createTraceStructureRecorder();
flowChart(..., { structureRecorders: [trace.recorder] });
<ExplainableShell traceGraph={trace.getGraph()} />

// saved run — save chart.buildTimeStructure with your snapshot
<ExplainableShell traceGraph={graphFromStructure(saved.structure)} />`}
        </FootprintCode>
      </pre>
    </>
  );
  if (unstyled) return <div data-fp="shell-missing-chart">{body}</div>;
  return (
    <div
      data-fp="shell-missing-chart"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: ui.spaceSm,
        justifyContent: "center",
        alignItems: "flex-start",
        height: "100%",
        padding: ui.spaceLg,
        color: theme.textMuted,
        fontFamily: theme.fontSans,
        fontSize: ui.body,
        lineHeight: ui.lineHeight,
        maxWidth: 520,
        margin: "0 auto",
      }}
    >
      {body}
    </div>
  );
});

/** Shown instead of empty chrome when there are no stages to show at all. */
export const EmptyShell = memo(function EmptyShell({
  reason,
  detail,
  unstyled,
  className,
  style,
}: {
  reason: string;
  detail: ReactNode;
  unstyled?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const ui = componentStyles();
  const body = (
    <>
      <div style={unstyled ? undefined : { fontWeight: ui.weightStrong, color: theme.textPrimary, fontSize: ui.title }}>
        {reason}
      </div>
      <div data-fp="shell-empty-detail">{detail}</div>
    </>
  );
  if (unstyled) {
    return (
      <div className={className} style={style} data-fp="shell-empty">
        {body}
      </div>
    );
  }
  return (
    <div
      className={className}
      data-fp="shell-empty"
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: ui.spaceSm,
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        padding: ui.spaceXl,
        background: theme.bgPrimary,
        color: theme.textMuted,
        fontFamily: theme.fontSans,
        fontSize: ui.body,
        lineHeight: ui.lineHeight,
        ...style,
      }}
    >
      {body}
    </div>
  );
});
