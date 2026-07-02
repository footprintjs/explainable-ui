/**
 * InspectorPanel — Node-specific debug view.
 *
 * Two tabs:
 * - State: scope values at the selected step (time-travel synced)
 * - Data Trace: backward causal chain from the selected node
 *
 * Like Chrome DevTools' Scope + Call Stack panels when paused at a breakpoint.
 */
import { memo, useState } from "react";
import { theme } from "../../theme";
import type { StageSnapshot } from "../../types";
import { MemoryPanel } from "../MemoryPanel";
import { DataTracePanel, type CausalFrame } from "../DataTracePanel/DataTracePanel";

export interface InspectorPanelProps {
  snapshots: StageSnapshot[];
  selectedIndex: number;
  /** Causal chain frames for the selected node (empty = no trace available). */
  dataTraceFrames: CausalFrame[];
  /** Optional honesty line for the Data Trace tab (e.g. reads not recorded). */
  dataTraceNote?: string;
  /** Currently selected runtimeStageId. */
  selectedStageId?: string;
  /** Navigate to a stage when clicking a Data Trace frame. */
  onNavigateToStage?: (runtimeStageId: string) => void;
}

type InspectorTab = "state" | "trace";

export const InspectorPanel = memo(function InspectorPanel({
  snapshots,
  selectedIndex,
  dataTraceFrames,
  dataTraceNote,
  selectedStageId,
  onNavigateToStage,
}: InspectorPanelProps) {
  const [tab, setTab] = useState<InspectorTab>("state");
  const currentSnapshot = snapshots[selectedIndex];

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
        }}
      >
        <TabButton
          active={tab === "state"}
          onClick={() => setTab("state")}
          label="State"
        />
        <TabButton
          active={tab === "trace"}
          onClick={() => setTab("trace")}
          label="Data Trace"
          badge={dataTraceFrames.length > 0 ? String(dataTraceFrames.length) : undefined}
        />
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {tab === "state" && (
          <MemoryPanel
            snapshots={snapshots}
            selectedIndex={selectedIndex}
          />
        )}
        {tab === "trace" && (
          <DataTracePanel
            frames={dataTraceFrames}
            note={dataTraceNote}
            selectedStageId={selectedStageId}
            onFrameClick={onNavigateToStage}
            fromStageName={currentSnapshot?.stageName}
          />
        )}
      </div>
    </div>
  );
});

function TabButton({
  active,
  onClick,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  badge?: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 14px",
        border: "none",
        borderBottom: active
          ? "2px solid var(--fp-accent, #6366f1)"
          : "2px solid transparent",
        background: "transparent",
        color: active ? "var(--fp-accent, #6366f1)" : theme.textMuted,
        fontWeight: active ? 600 : 400,
        fontSize: 12,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      {label}
      {badge && (
        <span
          style={{
            fontSize: 10,
            background: active
              ? "var(--fp-accent, #6366f1)"
              : theme.textMuted,
            color: "#fff",
            borderRadius: 8,
            padding: "1px 5px",
            fontWeight: 600,
          }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}
