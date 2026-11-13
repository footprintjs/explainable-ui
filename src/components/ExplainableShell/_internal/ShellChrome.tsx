import { memo, type ReactNode, type CSSProperties } from "react";
import { theme } from "../../../theme";

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
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 0,
      padding: "0",
    }}>
      <div style={{ flex: 1, height: 1, background: theme.border }} />
      <button
        onClick={onClick}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          padding: "3px 12px",
          margin: "4px 0",
          fontSize: 10,
          fontWeight: 600,
          fontFamily: "inherit",
          color: theme.textMuted,
          background: theme.bgSecondary,
          border: `1px solid ${theme.border}`,
          borderRadius: 10,
          cursor: "pointer",
          whiteSpace: "nowrap",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          transition: "color 0.15s ease",
        }}
      >
        <span style={{ fontSize: 7 }}>{expanded ? "▼" : "▶"}</span>
        {label}
        {detail && <span style={{ fontWeight: 400, opacity: 0.5, fontSize: 9 }}>{detail}</span>}
      </button>
      <div style={{ flex: 1, height: 1, background: theme.border }} />
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
      <div style={{ flex: 1, width: 1, background: theme.border }} />
      <button
        onClick={onClick}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "10px 4px",
          margin: "0 3px",
          fontSize: 10,
          fontWeight: 600,
          fontFamily: "inherit",
          color: theme.textMuted,
          background: theme.bgSecondary,
          border: `1px solid ${theme.border}`,
          borderRadius: 10,
          cursor: "pointer",
          whiteSpace: "nowrap",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          writingMode: "vertical-lr",
          transition: "color 0.15s ease",
        }}
      >
        <span style={{ fontSize: 7, writingMode: "horizontal-tb" }}>{arrow}</span>
        {label}
      </button>
      <div style={{ flex: 1, width: 1, background: theme.border }} />
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
  const body = (
    <>
      <strong>No chart — `traceGraph` was not provided.</strong>
      <div>
        A snapshot holds the memory, the story and the timeline. Only the chart's own
        structure can draw the chart. Two ways to get one:
      </div>
      <pre style={unstyled ? undefined : { margin: 0, whiteSpace: "pre-wrap", fontFamily: theme.fontMono, fontSize: 11 }}>
{`// live build
const trace = createTraceStructureRecorder();
flowChart(..., { structureRecorders: [trace.recorder] });
<ExplainableShell traceGraph={trace.getGraph()} />

// saved run — save chart.buildTimeStructure with your snapshot
<ExplainableShell traceGraph={graphFromStructure(saved.structure)} />`}
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
        gap: 8,
        justifyContent: "center",
        alignItems: "flex-start",
        height: "100%",
        padding: 20,
        color: theme.textMuted,
        fontSize: 12,
        lineHeight: 1.5,
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
  const body = (
    <>
      <div style={unstyled ? undefined : { fontWeight: 700, color: theme.textPrimary, fontSize: 13 }}>
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
        gap: 10,
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        padding: 24,
        background: theme.bgPrimary,
        color: theme.textMuted,
        fontFamily: theme.fontSans,
        fontSize: 12,
        lineHeight: 1.6,
        ...style,
      }}
    >
      {body}
    </div>
  );
});
