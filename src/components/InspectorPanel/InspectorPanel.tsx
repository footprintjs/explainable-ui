/**
 * InspectorPanel — Node-specific debug view.
 *
 * Optional Activity plus the existing two tabs:
 * - State: scope values at the selected step (time-travel synced)
 * - Data Trace: backward causal chain from the selected node
 *
 * Like Chrome DevTools' Scope + Call Stack panels when paused at a breakpoint.
 */
import { memo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { fontSize, theme } from "../../theme";
import type { BaseComponentProps, Size, StageSnapshot } from "../../types";
import { MemoryPanel } from "../MemoryPanel";
import { DataTracePanel, type CausalFrame } from "../DataTracePanel/DataTracePanel";
import { StageActivityPanel } from "../StageActivityPanel";
import type { StageActivityTraceTarget, StageActivityView } from "../../trace/stageActivity";

export interface InspectorPanelProps extends BaseComponentProps {
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
  /** Fires when the user switches tabs — lets the shell paint the chart's
   *  dependency cone while the Data Trace tab is open. */
  onTabChange?: (tab: "state" | "trace") => void;
  /** Controlled tab — when provided the SHELL owns the tab (it must force
   *  Data Trace open on tracing entry); clicks still fire onTabChange. */
  tab?: "state" | "trace";
  /** Replaces the Data Trace tab body (the shell swaps in the Same-Rail
   *  Rewind stop card / entry chips); default = the classic frames list. */
  traceContent?: ReactNode;
  /** Add the exact-visit Activity lens. Its presence selects Activity by default
   *  unless activitySelected is controlled. Legacy instances remain unchanged. */
  activity?: StageActivityView;
  /** Controls the Activity lens separately, preserving the legacy tab union. */
  activitySelected?: boolean;
  /** Called when Activity is selected. State/Trace still use onTabChange. */
  onActivitySelect?: () => void;
  /** Reuse the host's validated trace controller for this exact read or write. */
  onTraceActivityVariable?: (target: StageActivityTraceTarget) => void;
  /** Controlled variable selection within the exact Activity visit. */
  selectedActivityVariableId?: string;
  onActivityVariableSelect?: (id: string) => void;
}

type InspectorTab = "state" | "trace";

export const InspectorPanel = memo(function InspectorPanel({
  snapshots,
  selectedIndex,
  dataTraceFrames,
  dataTraceNote,
  selectedStageId,
  onNavigateToStage,
  onTabChange,
  tab: controlledTab,
  traceContent,
  activity,
  activitySelected,
  onActivitySelect,
  onTraceActivityVariable,
  selectedActivityVariableId,
  onActivityVariableSelect,
  size = "default",
  unstyled = false,
  className,
  style,
}: InspectorPanelProps) {
  const [internalTab, setTabState] = useState<InspectorTab>("state");
  const [internalActivitySelected, setInternalActivitySelected] = useState(true);
  const tab = controlledTab ?? internalTab;
  const showActivity = !!activity && (activitySelected ?? internalActivitySelected);
  const setTab = (t: InspectorTab) => {
    setInternalActivitySelected(false);
    setTabState(t);
    onTabChange?.(t);
  };
  const currentSnapshot = snapshots[selectedIndex];
  /** Styles vanish in unstyled mode; the tree stays exactly the same. */
  const sx = (s: CSSProperties): CSSProperties | undefined => (unstyled ? undefined : s);

  return (
    <div
      className={className}
      data-fp="inspector-panel"
      style={{
        ...sx({
          display: "flex",
          flexDirection: "column",
          height: "100%",
          overflow: "hidden",
        }),
        ...style,
      }}
    >
      {/* Tab bar */}
      <div
        data-fp="inspector-tabs"
        style={sx({
          display: "flex",
          borderBottom: `1px solid ${theme.border}`,
          flexShrink: 0,
        })}
      >
        {activity && <TabButton
          active={showActivity}
          onClick={() => { setInternalActivitySelected(true); onActivitySelect?.(); }}
          label="Activity"
          size={size}
          unstyled={unstyled}
        />}
        <TabButton
          active={!showActivity && tab === "state"}
          onClick={() => setTab("state")}
          label="State"
          size={size}
          unstyled={unstyled}
        />
        <TabButton
          active={!showActivity && tab === "trace"}
          onClick={() => setTab("trace")}
          label="Data Trace"
          badge={dataTraceFrames.length > 0 ? String(dataTraceFrames.length) : undefined}
          size={size}
          unstyled={unstyled}
        />
      </div>

      {/* Tab content */}
      <div data-fp="inspector-body" style={sx({ flex: 1, overflow: "auto" })}>
        {showActivity && activity && <StageActivityPanel activity={activity} onTraceVariable={onTraceActivityVariable}
          selectedVariableId={selectedActivityVariableId} onVariableSelect={onActivityVariableSelect}
          onNavigateToStage={onNavigateToStage} size={size} unstyled={unstyled} />}
        {!showActivity && tab === "state" && (
          <MemoryPanel
            snapshots={snapshots}
            selectedIndex={selectedIndex}
            size={size}
            unstyled={unstyled}
          />
        )}
        {!showActivity && tab === "trace" &&
          (traceContent ?? (
            <DataTracePanel
              frames={dataTraceFrames}
              note={dataTraceNote}
              selectedStageId={selectedStageId}
              onFrameClick={onNavigateToStage}
              fromStageName={currentSnapshot?.stageName}
              size={size}
              unstyled={unstyled}
            />
          ))}
      </div>
    </div>
  );
});

function TabButton({
  active,
  onClick,
  label,
  badge,
  size = "default",
  unstyled = false,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  badge?: string;
  size?: Size;
  unstyled?: boolean;
}) {
  const fs = fontSize[size];
  const sx = (s: CSSProperties): CSSProperties | undefined => (unstyled ? undefined : s);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      data-fp="inspector-tab"
      data-active={active || undefined}
      style={sx({
        padding: "8px 14px",
        border: "none",
        borderBottom: active
          ? "2px solid var(--fp-accent, #6366f1)"
          : "2px solid transparent",
        background: "transparent",
        color: active ? "var(--fp-accent, #6366f1)" : theme.textMuted,
        fontWeight: active ? 600 : 400,
        fontSize: fs.body,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 4,
      })}
    >
      {label}
      {badge && (
        <span
          style={sx({
            fontSize: fs.small,
            background: active
              ? "var(--fp-accent, #6366f1)"
              : theme.textMuted,
            color: "#fff",
            borderRadius: 8,
            padding: "1px 5px",
            fontWeight: 600,
          })}
        >
          {badge}
        </span>
      )}
    </button>
  );
}
