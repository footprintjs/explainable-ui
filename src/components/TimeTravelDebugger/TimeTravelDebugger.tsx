import { useState } from "react";
import type { Node, Edge } from "@xyflow/react";
import type { StageSnapshot, BaseComponentProps } from "../../types";
import { theme, fontSize, padding } from "../../theme";
import { MemoryInspector } from "../MemoryInspector";
import { NarrativeLog } from "../NarrativeLog";
import { GanttTimeline } from "../GanttTimeline";
import { FlowchartView } from "../FlowchartView";

export interface TimeTravelDebuggerProps extends BaseComponentProps {
  /** Stage snapshots */
  snapshots: StageSnapshot[];
  /** ReactFlow nodes (required for flowchart) */
  nodes: Node[];
  /** ReactFlow edges (required for flowchart) */
  edges: Edge[];
  /** Show Gantt timeline */
  showGantt?: boolean;
  /** Layout direction */
  layout?: "horizontal" | "vertical";
  /** Title */
  title?: string;
}

/**
 * Full time-travel debugger: scrubber + flowchart + memory + narrative + gantt.
 * This is the "batteries included" component for pipeline debugging.
 */
export function TimeTravelDebugger({
  snapshots,
  nodes,
  edges,
  showGantt = true,
  layout = "horizontal",
  title = "Time-Travel Debugger",
  size = "default",
  unstyled = false,
  className,
  style,
}: TimeTravelDebuggerProps) {
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
        <FlowchartView
          nodes={nodes}
          edges={edges}
          snapshots={snapshots}
          selectedIndex={selectedIndex}
          onNodeClick={setSelectedIndex}
          unstyled
        />
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
            label="\u25C0"
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
            label="\u25B6"
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
          <FlowchartView
            nodes={nodes}
            edges={edges}
            snapshots={snapshots}
            selectedIndex={selectedIndex}
            onNodeClick={setSelectedIndex}
            size={size}
          />
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
