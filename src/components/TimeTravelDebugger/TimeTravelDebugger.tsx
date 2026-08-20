import { useState } from "react";
import { warnDeprecated } from "../../_internal/deprecate";
import type { StageSnapshot, BaseComponentProps } from "../../types";
import { theme, fontSize, padding } from "../../theme";
import { MemoryInspector } from "../MemoryInspector";
import { NarrativeLog } from "../NarrativeLog";
import { GanttTimeline } from "../GanttTimeline";
import { TraceFlow } from "../FlowchartView/TraceFlow";
import { TracedFlow } from "../FlowchartView/TracedFlow";
import type { TraceGraph } from "../FlowchartView/traceStructureRecorder";
import type { RuntimeOverlay } from "../FlowchartView/createTraceRuntimeOverlay";

/**
 * @deprecated Since 0.38.0 — removed in the next major. Use
 * `<SnapshotPanel>` for the same scrubber + memory + narrative + Gantt
 * without a chart, `<ExplainableShell>` for the full shell over a
 * footprintjs run, or the `footprint-viewer` package for the zero-config
 * five-tab viewer.
 */
export interface TimeTravelDebuggerProps extends BaseComponentProps {
  /** Stage snapshots */
  snapshots: StageSnapshot[];
  /** Recorder-captured build-time graph (from
   *  `createTraceStructureRecorder().getGraph()`). Required for the
   *  chart rendering — replaces the legacy `nodes` / `edges` props. */
  graph: TraceGraph;
  /** Optional runtime overlay (from
   *  `createTraceRuntimeOverlay().getOverlay()`). When provided, the
   *  chart renders via `<TracedFlow>` with per-step coloring synced to
   *  the scrubber; otherwise renders via `<TraceFlow>` (build-time only). */
  runtimeOverlay?: RuntimeOverlay;
  /** Show Gantt timeline */
  showGantt?: boolean;
  /** Layout direction */
  layout?: "horizontal" | "vertical";
  /** Title */
  title?: string;
}

/**
 * Full time-travel debugger: scrubber + recorder-driven flowchart +
 * memory + narrative + gantt. This is the "batteries included"
 * component for pipeline debugging.
 *
 * v6+: chart rendering is recorder-driven. Pass `graph` (always) and
 * optionally `runtimeOverlay` for per-step coloring tied to the
 * scrubber.
 *
 * @deprecated Since 0.38.0 — removed in the next major.
 *
 * It owns its cursor (the scrubber index is local state with no
 * `selectedIndex` / `onIndexChange`), so nothing outside it can move the
 * time-travel position or read it — which is why no shipped surface in
 * this library uses it. What it renders, three supported components
 * already render, controlled:
 *
 *   - `<SnapshotPanel>` — the same scrubber + memory + narrative + Gantt.
 *   - `<ExplainableShell>` — that plus the chart, drill-down, tracing and
 *     the recorder tabs, over a footprintjs run.
 *   - `footprint-viewer` — the zero-config five-tab viewer, if you want
 *     the whole experience rather than one panel.
 */
export function TimeTravelDebugger({
  snapshots,
  graph,
  runtimeOverlay,
  showGantt = true,
  layout = "horizontal",
  title = "Time-Travel Debugger",
  size = "default",
  unstyled = false,
  className,
  style,
}: TimeTravelDebuggerProps) {
  warnDeprecated(
    "TimeTravelDebugger",
    "Use <SnapshotPanel> (same panels, controlled cursor), <ExplainableShell> " +
      "(those plus the chart and drill-down), or the footprint-viewer package.",
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const fs = fontSize[size];
  const pad = padding[size];

  if (snapshots.length === 0) {
    return (
      <div
        className={className}
        style={{
          padding: pad * 2,
          textAlign: "center",
          color: theme.textMuted,
          ...style,
        }}
      >
        No snapshots to debug
      </div>
    );
  }

  const isHorizontal = layout === "horizontal";

  // Click → jump scrubber to whichever snapshot maps to the clicked
  // stage. Matches the legacy `onNodeClick(index)` semantics: callers
  // receive a stage id, we translate to a snapshot index.
  const handleNodeClick = (stageId: string) => {
    const idx = snapshots.findIndex(
      (s) => s.stageName === stageId || s.stageLabel === stageId,
    );
    if (idx >= 0) setSelectedIndex(idx);
  };

  const chart = runtimeOverlay ? (
    <TracedFlow
      graph={graph}
      overlay={runtimeOverlay}
      scrubIndex={selectedIndex}
      onNodeClick={handleNodeClick}
    />
  ) : (
    <TraceFlow graph={graph} onNodeClick={handleNodeClick} />
  );

  if (unstyled) {
    return (
      <div className={className} style={style} data-fp="time-travel-debugger">
        <h3>{title}</h3>
        <input
          type="range"
          min={0}
          max={snapshots.length - 1}
          value={selectedIndex}
          onChange={(e) => setSelectedIndex(parseInt(e.target.value))}
        />
        {chart}
        <MemoryInspector
          snapshots={snapshots}
          selectedIndex={selectedIndex}
          unstyled
        />
        <NarrativeLog
          snapshots={snapshots}
          selectedIndex={selectedIndex}
          unstyled
        />
        {showGantt && (
          <GanttTimeline
            snapshots={snapshots}
            selectedIndex={selectedIndex}
            onSelect={setSelectedIndex}
            unstyled
          />
        )}
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: theme.bgPrimary,
        fontFamily: theme.fontSans,
        overflow: "hidden",
        ...style,
      }}
      data-fp="time-travel-debugger"
    >
      {/* Scrubber header */}
      <div
        style={{
          padding: `${pad}px ${pad + 4}px`,
          borderBottom: `1px solid ${theme.border}`,
          background: theme.bgSecondary,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 8,
          }}
        >
          <span
            style={{
              fontSize: fs.body + 2,
              fontWeight: 600,
              color: theme.textPrimary,
            }}
          >
            {title}
          </span>
          <span
            style={{
              fontSize: fs.small,
              color: theme.textMuted,
            }}
          >
            Scrub to replay execution
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ScrubButton
            label="◀"
            disabled={selectedIndex === 0}
            onClick={() => setSelectedIndex((i) => Math.max(0, i - 1))}
          />
          <input
            type="range"
            min={0}
            max={snapshots.length - 1}
            value={selectedIndex}
            onChange={(e) => setSelectedIndex(parseInt(e.target.value))}
            style={{
              flex: 1,
              height: 4,
              accentColor: theme.primary,
              cursor: "pointer",
            }}
          />
          <ScrubButton
            label="▶"
            disabled={selectedIndex === snapshots.length - 1}
            onClick={() =>
              setSelectedIndex((i) => Math.min(snapshots.length - 1, i + 1))
            }
          />
          <span
            style={{
              fontSize: fs.small,
              color: theme.textMuted,
              flexShrink: 0,
              fontFamily: theme.fontMono,
            }}
          >
            {selectedIndex + 1}/{snapshots.length}
          </span>
        </div>
      </div>

      {/* Main content: flowchart + data panels */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: isHorizontal ? "row" : "column",
          overflow: "hidden",
        }}
      >
        {/* Flowchart */}
        <div
          style={{
            flex: 1,
            overflow: "hidden",
            borderRight: isHorizontal
              ? `1px solid ${theme.border}`
              : "none",
            borderBottom: !isHorizontal
              ? `1px solid ${theme.border}`
              : "none",
          }}
        >
          {chart}
        </div>

        {/* Data panel */}
        <div style={{ flex: 1, overflow: "auto" }}>
          <MemoryInspector
            snapshots={snapshots}
            selectedIndex={selectedIndex}
            size={size}
          />
          <div
            style={{
              height: 1,
              background: theme.border,
              margin: `0 ${pad}px`,
            }}
          />
          <NarrativeLog
            snapshots={snapshots}
            selectedIndex={selectedIndex}
            size={size}
          />
        </div>
      </div>

      {/* Gantt footer */}
      {showGantt && (
        <div
          style={{
            borderTop: `1px solid ${theme.border}`,
            background: theme.bgSecondary,
            flexShrink: 0,
          }}
        >
          <GanttTimeline
            snapshots={snapshots}
            selectedIndex={selectedIndex}
            onSelect={setSelectedIndex}
            size={size}
          />
        </div>
      )}
    </div>
  );
}

function ScrubButton({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: theme.bgTertiary,
        border: `1px solid ${theme.border}`,
        color: disabled ? theme.textMuted : theme.textPrimary,
        borderRadius: 6,
        width: 28,
        height: 28,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        fontSize: 12,
        flexShrink: 0,
      }}
    >
      {label}
    </button>
  );
}
