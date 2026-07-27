/**
 * InsightPanel — Recorder outputs renamed as "Insights".
 *
 * Two modes:
 * - Tabs: one insight at a time (full height) — when flowchart is visible
 * - Grid: all insights visible (2x2) — when flowchart is collapsed
 *
 * Each insight maps to a recorder's toSnapshot() output.
 * User-facing names: Story, Performance, Quality, Cost.
 */
import { memo, useState } from "react";
import { theme } from "../../theme";

export interface InsightConfig {
  /** Unique ID (matches recorder id). */
  id: string;
  /** User-facing name (Story, Performance, Quality, Cost). */
  name: string;
  /** Aggregate summary for collapsed header (e.g., "1.2ms 3R 3W"). */
  summary?: string;
  /** Render the insight content. */
  render: () => React.ReactNode;
}

export interface InsightPanelProps {
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
}: InsightPanelProps) {
  if (insights.length === 0) {
    return <NoInsights />;
  }

  if (mode === "grid") {
    return <InsightGrid insights={insights} />;
  }

  return <InsightTabs insights={insights} defaultId={expandedId} />;
});

// ── Empty state ────────────────────────────────────────────────────

/**
 * Each panel here is fed by ONE recorder attached while the run happened —
 * nothing can be recovered afterwards. "Attach recorders to see data" was
 * true and useless: it named no recorder, no import and no call. This lists
 * the four, so the fix is a line to copy rather than a docs hunt.
 */
const INGREDIENTS: ReadonlyArray<{ panel: string; call: string; from: string }> = [
  { panel: "Story", call: "narrative()", from: "footprintjs/recorders" },
  { panel: "Performance", call: "metrics()", from: "footprintjs/recorders" },
  { panel: "Quality", call: "new QualityRecorder(scoreFn)", from: "footprintjs/trace" },
  { panel: "Cost", call: "costRecorder()", from: "agentfootprint/observe" },
];

const NoInsights = memo(function NoInsights() {
  return (
    <div
      data-fp="insights-empty"
      style={{ padding: 12, color: theme.textMuted, fontSize: 12, lineHeight: 1.6 }}
    >
      <div style={{ marginBottom: 8 }}>
        Nothing to show — this run was recorded without any of these. Each one lights one panel:
      </div>
      <table style={{ borderCollapse: "collapse" }}>
        <tbody>
          {INGREDIENTS.map(({ panel, call, from }) => (
            <tr key={panel} data-fp="insights-empty-row">
              <td style={{ paddingRight: 10, color: theme.textSecondary, whiteSpace: "nowrap" }}>
                {panel}
              </td>
              <td style={{ fontFamily: theme.fontMono, fontSize: 11, whiteSpace: "nowrap" }}>
                {call}
                <span style={{ opacity: 0.7 }}> — from {from}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 8 }}>
        Attach with <code>executor.attachScopeRecorder(...)</code> before the run, then pass the
        snapshot here — each recorder&apos;s data rides along inside it.
      </div>
    </div>
  );
});

// ── Tabs mode (one at a time, full height) ─────────────────────────

const InsightTabs = memo(function InsightTabs({
  insights,
  defaultId,
}: {
  insights: InsightConfig[];
  defaultId?: string;
}) {
  const [activeId, setActiveId] = useState(defaultId ?? insights[0]?.id);
  const active = insights.find((i) => i.id === activeId) ?? insights[0];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          borderBottom: `1px solid ${theme.border}`,
          flexShrink: 0,
          overflowX: "auto",
        }}
      >
        {insights.map((insight) => (
          <button
            key={insight.id}
            onClick={() => setActiveId(insight.id)}
            style={{
              padding: "8px 12px",
              border: "none",
              borderBottom:
                activeId === insight.id
                  ? "2px solid var(--fp-accent, #6366f1)"
                  : "2px solid transparent",
              background: "transparent",
              color:
                activeId === insight.id
                  ? "var(--fp-accent, #6366f1)"
                  : theme.textMuted,
              fontWeight: activeId === insight.id ? 600 : 400,
              fontSize: 12,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {insight.name}
          </button>
        ))}
      </div>

      {/* Active content */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {active?.render()}
      </div>
    </div>
  );
});

// ── Grid mode (all visible, 2x2) ──────────────────────────────────

const InsightGrid = memo(function InsightGrid({
  insights,
}: {
  insights: InsightConfig[];
}) {
  const cols = insights.length <= 2 ? 1 : 2;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        height: "100%",
        overflow: "auto",
        gap: 1,
        background: theme.border,
      }}
    >
      {insights.map((insight) => (
        <div
          key={insight.id}
          style={{
            background: "var(--fp-bg, #1a1b26)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Grid cell header */}
          <div
            style={{
              padding: "6px 10px",
              fontSize: 11,
              fontWeight: 600,
              color: theme.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              borderBottom: `1px solid ${theme.border}`,
              flexShrink: 0,
            }}
          >
            {insight.name}
            {insight.summary && (
              <span
                style={{
                  marginLeft: 8,
                  fontWeight: 400,
                  fontSize: 10,
                  color: theme.textMuted,
                }}
              >
                {insight.summary}
              </span>
            )}
          </div>
          {/* Grid cell content */}
          <div style={{ flex: 1, overflow: "auto" }}>
            {insight.render()}
          </div>
        </div>
      ))}
    </div>
  );
});
