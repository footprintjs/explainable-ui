import { memo, useMemo, type ReactNode } from "react";
import type { StageSnapshot } from "../../../types";
import { theme } from "../../../theme";
import { InspectorPanel } from "../../InspectorPanel/InspectorPanel";
import { InsightPanel } from "../../InsightPanel/InsightPanel";
import { insightName } from "../../../model/recorderView";

/**
 * The right column's three modes.
 *
 * `result` is the home the Result view never had on desktop: the tabbed
 * details panel only renders below 640px, and the Insights list deliberately
 * holds Result back (an Insight is recorder-derived; the Result is the run's
 * output) — so `resultData`, `logs` and `hideConsole` did nothing at all on
 * any shell wider than that. A third segment on the toggle that already
 * exists is the smallest place to put it that does not disturb which Insight
 * opens first, nor the "no recorders were attached" guidance the Insights
 * list shows when it is empty.
 */
export type RightPanelMode = "insights" | "what" | "result";

const RIGHT_PANEL_MODE_LABELS: Record<RightPanelMode, string> = {
  insights: "Insights",
  what: "Inspector",
  result: "Result",
};

export const RightPanel = memo(function RightPanel({
  mode,
  onModeChange,
  snapshots,
  selectedIndex,
  activeTab,
  allTabs,
  renderTabBody,
  size,
  onNavigateToStage,
  dataTrace,
  onInspectorTabChange,
  inspectorTab,
  traceContent,
}: {
  mode: RightPanelMode;
  onModeChange: (mode: RightPanelMode) => void;
  snapshots: StageSnapshot[];
  selectedIndex: number;
  activeTab: string;
  allTabs: Array<{ id: string; name: string; description?: string }>;
  /** Renders ONE tab's body. The shell owns the single implementation and
   *  hands it down, which is what makes the Result tab reachable here: this
   *  is the only tabbed surface on a desktop-width shell, so a tab it cannot
   *  render is a tab — and the `resultData` / `logs` / `hideConsole` props
   *  behind it — that does nothing. */
  renderTabBody: (tabId: string, plain: boolean) => ReactNode;
  size: "compact" | "default" | "detailed";
  onNavigateToStage: (id: string) => void;
  /** Precomputed backward slice for the Data Trace tab (lifted to the shell
   *  root so the chart's dependency cone shares the SAME frames). */
  dataTrace: { frames: import("../../../trace/dataTrace").DataTraceFrame[]; readsAvailable: boolean };
  onInspectorTabChange?: (tab: "state" | "trace") => void;
  /** Controlled Inspector tab — the shell forces Data Trace open on tracing entry. */
  inspectorTab?: "state" | "trace";
  /** The Data Trace tab body (stop card while tracing / entry chips + frames list). */
  traceContent?: ReactNode;
}) {
  // The Result segment appears only when a Result tab exists, so
  // `hideTabs={["result"]}` still removes it everywhere.
  const modes = useMemo<readonly RightPanelMode[]>(
    () =>
      allTabs.some((t) => t.id === "result")
        ? (["insights", "what", "result"] as const)
        : (["insights", "what"] as const),
    [allTabs],
  );

  return (
    <>
      {/* Mode toggle */}
      <div style={{
        display: "flex",
        borderBottom: `1px solid ${theme.border}`,
        flexShrink: 0,
        background: theme.bgSecondary,
      }}>
        {modes.map((m) => (
          <button
            key={m}
            onClick={() => onModeChange(m)}
            style={{
              flex: 1,
              padding: "7px 12px",
              fontSize: 11,
              fontWeight: mode === m ? 700 : 500,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: mode === m ? theme.primary : theme.textMuted,
              background: "transparent",
              border: "none",
              borderBottom: mode === m ? `2px solid ${theme.primary}` : "2px solid transparent",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {RIGHT_PANEL_MODE_LABELS[m]}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        {mode === "result" ? (
          <div style={{ height: "100%", overflow: "auto" }}>{renderTabBody("result", false)}</div>
        ) : mode === "insights" ? (
          <InsightPanel
            mode="tabs"
            expandedId={activeTab}
            // Two tabs are held back, each with its own home: Memory (the
            // Inspector's State tab beside it is the same data) and Result
            // (its own mode on the toggle above — an Insight is recorder-
            // derived, the Result is the run's output).
            insights={allTabs.filter((t) => t.id !== "result" && t.id !== "memory").map((tab) => ({
              id: tab.id,
              name: insightName(tab.name),
              render: () => renderTabBody(tab.id, false),
            }))}
          />
        ) : (
          <InspectorPanel
            snapshots={snapshots}
            selectedIndex={selectedIndex}
            dataTraceFrames={dataTrace.frames}
            dataTraceNote={dataTrace.readsAvailable ? undefined : '⚠ reads were not recorded (readTracking off) — dependencies are unknowable, not absent.'}
            onTabChange={onInspectorTabChange}
            tab={inspectorTab}
            traceContent={traceContent}
            selectedStageId={snapshots[selectedIndex]?.runtimeStageId}
            onNavigateToStage={onNavigateToStage}
          />
        )}
      </div>
    </>
  );
});
