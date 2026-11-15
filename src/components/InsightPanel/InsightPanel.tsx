/**
 * InsightPanel — Recorder outputs renamed as "Insights".
 *
 * Two modes:
 * - Tabs: one insight at a time (full height) — when flowchart is visible
 * - Grid: all insights visible (2x2) — when flowchart is collapsed
 *
 * Each insight maps to a recorder's toSnapshot() output.
 * User-facing names: Run log, Metrics, Quality, Cost.
 */
import { memo, useState } from "react";
import type { CSSProperties } from "react";
import { componentStyles, theme, FootprintCode, FootprintTab } from "../../theme";
import type { BaseComponentProps, Size } from "../../types";

export interface InsightConfig {
  /** Unique ID (matches recorder id). */
  id: string;
  /** User-facing name (Run log, Metrics, Quality, Cost). */
  name: string;
  /** Aggregate summary for collapsed header (e.g., "1.2ms 3R 3W"). */
  summary?: string;
  /** Render the insight content. */
  render: () => React.ReactNode;
}

export interface InsightPanelProps extends BaseComponentProps {
  insights: InsightConfig[];
  /** Which insight is expanded by default (by id). */
  expandedId?: string;
  /** Display mode: tabs (one at a time) or grid (all visible). */
  mode: "tabs" | "grid";
}

export const InsightPanel = memo(function InsightPanel({
  insights,
  expandedId,
  mode,
  size = "default",
  unstyled = false,
  className,
  style,
}: InsightPanelProps) {
  const chrome = { size, unstyled, className, style };
  if (insights.length === 0) {
    return <NoInsights {...chrome} />;
  }

  if (mode === "grid") {
    return <InsightGrid insights={insights} {...chrome} />;
  }

  return <InsightTabs insights={insights} defaultId={expandedId} {...chrome} />;
});

/** Chrome props every mode of this panel forwards to its root element. */
interface PanelChrome {
  size: Size;
  unstyled: boolean;
  className?: string;
  style?: CSSProperties;
}

/** Styles vanish in unstyled mode; the tree stays exactly the same. */
const styler =
  (unstyled: boolean) =>
  (s: CSSProperties): CSSProperties | undefined =>
    unstyled ? undefined : s;

// ── Empty state ────────────────────────────────────────────────────

/**
 * Each panel here is fed by ONE recorder attached while the run happened —
 * nothing can be recovered afterwards. "Attach recorders to see data" was
 * true and useless: it named no recorder, no import and no call. This lists
 * the four, so the fix is a line to copy rather than a docs hunt.
 */
const INGREDIENTS: ReadonlyArray<{ panel: string; call: string; from: string }> = [
  { panel: "Run log", call: "narrative()", from: "footprintjs/recorders" },
  { panel: "Metrics", call: "metrics()", from: "footprintjs/recorders" },
  { panel: "Quality", call: "new QualityRecorder(scoreFn)", from: "footprintjs/trace" },
  { panel: "Cost", call: "costRecorder()", from: "agentfootprint/observe" },
];

const NoInsights = memo(function NoInsights({
  size,
  unstyled,
  className,
  style,
}: PanelChrome) {
  const ui = componentStyles(size);
  const sx = styler(unstyled);
  return (
    <div
      className={className}
      data-fp="insights-empty"
      style={{
        ...sx({ padding: ui.padding, color: theme.textMuted, fontFamily: theme.fontSans,
          fontSize: ui.body, lineHeight: ui.lineHeight, overflowX: "auto" }),
        ...style,
      }}
    >
      <div style={sx({ marginBottom: ui.spaceSm })}>
        Nothing to show — this run was recorded without any of these. Each one lights one panel:
      </div>
      <table style={sx({ borderCollapse: "collapse" })}>
        <tbody>
          {INGREDIENTS.map(({ panel, call, from }) => (
            <tr key={panel} data-fp="insights-empty-row">
              <td style={sx({ paddingRight: ui.spaceSm, color: theme.textSecondary, whiteSpace: "nowrap", verticalAlign: "top" })}>
                {panel}
              </td>
              <td style={sx({ fontFamily: theme.fontMono, fontSize: ui.label, overflowWrap: "anywhere" })}>
                <FootprintCode part="recorder-attachment" densitySize={size} unstyled={unstyled}
                  defaultStyle={{ fontFamily: theme.fontMono, fontSize: ui.label, overflowWrap: "anywhere" }}>{call}</FootprintCode>
                <span style={sx({ color: theme.textSecondary })}> — from {from}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={sx({ marginTop: ui.spaceSm })}>
        Attach with <FootprintCode part="recorder-attachment-instruction" unstyled={unstyled} densitySize={size}
          defaultStyle={{ fontFamily: theme.fontMono, fontSize: ui.body }}>executor.attachScopeRecorder(...)</FootprintCode> before the run, then pass the
        snapshot here — each recorder&apos;s data rides along inside it.
      </div>
    </div>
  );
});

// ── Tabs mode (one at a time, full height) ─────────────────────────

const InsightTabs = memo(function InsightTabs({
  insights,
  defaultId,
  size,
  unstyled,
  className,
  style,
}: PanelChrome & {
  insights: InsightConfig[];
  defaultId?: string;
}) {
  const [activeId, setActiveId] = useState(defaultId ?? insights[0]?.id);
  const active = insights.find((i) => i.id === activeId) ?? insights[0];
  const resolvedId = active?.id;
  const ui = componentStyles(size);
  const sx = styler(unstyled);

  return (
    <div
      className={className}
      data-fp="insight-panel"
      data-mode="tabs"
      style={{
        ...sx({
          display: "flex",
          flexDirection: "column",
          height: "100%",
          overflow: "hidden",
          fontFamily: theme.fontSans,
          fontSize: ui.body,
          lineHeight: ui.lineHeight,
        }),
        ...style,
      }}
    >
      {/* Tab bar */}
      <div
        data-fp="insight-tabs"
        style={sx({
          display: "flex",
          borderBottom: `${ui.borderWidth} solid ${theme.border}`,
          flexShrink: 0,
          overflowX: "auto",
        })}
      >
        {insights.map((insight) => (
          <FootprintTab
            type="button"
            key={insight.id}
            part="run-data-tab" densitySize={size} unstyled={unstyled} data-tab-id={insight.id}
            onClick={() => setActiveId(insight.id)}
            data-fp="insight-tab"
            aria-pressed={resolvedId === insight.id}
            data-active={resolvedId === insight.id || undefined}
            defaultStyle={sx({
              padding: ui.controlPadding,
              minHeight: ui.controlHeight,
              border: "none",
              borderBottom:
                resolvedId === insight.id
                  ? `${ui.focusWidth} solid ${theme.accent}`
                  : `${ui.focusWidth} solid transparent`,
              background: "transparent",
              color:
                resolvedId === insight.id
                  ? theme.accent
                  : theme.textMuted,
              fontWeight: resolvedId === insight.id ? ui.weightStrong : ui.weightNormal,
              fontSize: ui.body,
              fontFamily: theme.fontSans,
              lineHeight: ui.lineHeight,
              cursor: "pointer",
              whiteSpace: "nowrap",
            })}
          >
            {insight.name}
          </FootprintTab>
        ))}
      </div>

      {/* Active content */}
      <div data-fp="insight-body" style={sx({ flex: 1, overflow: "auto" })}>
        {active?.render()}
      </div>
    </div>
  );
});

// ── Grid mode (all visible, 2x2) ──────────────────────────────────

const InsightGrid = memo(function InsightGrid({
  insights,
  size,
  unstyled,
  className,
  style,
}: PanelChrome & {
  insights: InsightConfig[];
}) {
  const cols = insights.length <= 2 ? 1 : 2;
  const ui = componentStyles(size);
  const sx = styler(unstyled);

  return (
    <div
      className={className}
      data-fp="insight-panel"
      data-mode="grid"
      style={{
        ...sx({
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          height: "100%",
          overflow: "auto",
          gap: ui.borderWidth,
          background: theme.border,
          fontFamily: theme.fontSans,
          fontSize: ui.body,
          lineHeight: ui.lineHeight,
        }),
        ...style,
      }}
    >
      {insights.map((insight) => (
        <div
          key={insight.id}
          data-fp="insight-cell"
          style={sx({
            background: theme.bg,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          })}
        >
          {/* Grid cell header */}
          <div
            data-fp="insight-cell-header"
            style={sx({
              padding: ui.controlPadding,
              fontSize: ui.label,
              lineHeight: ui.lineHeight,
              fontWeight: ui.weightStrong,
              color: theme.textMuted,
              borderBottom: `${ui.borderWidth} solid ${theme.border}`,
              flexShrink: 0,
            })}
          >
            {insight.name}
            {insight.summary && (
              <span
                style={sx({
                  marginLeft: ui.spaceSm,
                  fontWeight: ui.weightNormal,
                  fontSize: ui.small,
                  color: theme.textMuted,
                })}
              >
                {insight.summary}
              </span>
            )}
          </div>
          {/* Grid cell content */}
          <div data-fp="insight-cell-body" style={sx({ flex: 1, overflow: "auto" })}>
            {insight.render()}
          </div>
        </div>
      ))}
    </div>
  );
});
