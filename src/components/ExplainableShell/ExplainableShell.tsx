import { useState, useCallback, useMemo } from "react";
import type { StageSnapshot, BaseComponentProps } from "../../types";
import { theme, fontSize, padding } from "../../theme";
import { ResultPanel } from "../ResultPanel";
import { GanttTimeline } from "../GanttTimeline";
import { MemoryInspector } from "../MemoryInspector";
import { NarrativeTrace } from "../NarrativeTrace";
import { ScopeDiff } from "../ScopeDiff";
import { TimeTravelControls } from "../TimeTravelControls";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ShellTab = "result" | "explainable" | "ai-compatible";

export interface ExplainableShellProps extends BaseComponentProps {
  /** Stage snapshots for time-travel visualization */
  snapshots: StageSnapshot[];
  /** Final pipeline result data */
  resultData?: Record<string, unknown> | null;
  /** Console log lines */
  logs?: string[];
  /** Combined narrative lines */
  narrative?: string[];
  /** Which tabs to show (default: all three) */
  tabs?: ShellTab[];
  /** Initially active tab */
  defaultTab?: ShellTab;
  /** Hide console in result tab */
  hideConsole?: boolean;
  /** Custom content to render in each tab slot */
  renderFlowchart?: (props: {
    snapshots: StageSnapshot[];
    selectedIndex: number;
    onNodeClick?: (index: number) => void;
  }) => React.ReactNode;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ExplainableShell({
  snapshots,
  resultData,
  logs = [],
  narrative = [],
  tabs = ["result", "explainable", "ai-compatible"],
  defaultTab,
  hideConsole = false,
  renderFlowchart,
  size = "default",
  unstyled = false,
  className,
  style,
}: ExplainableShellProps) {
  const [activeTab, setActiveTab] = useState<ShellTab>(defaultTab ?? tabs[0]);
  const [snapshotIdx, setSnapshotIdx] = useState(0);

  const fs = fontSize[size];
  const pad = padding[size];

  const handleSnapshotChange = useCallback((idx: number) => {
    setSnapshotIdx(Math.max(0, Math.min(idx, snapshots.length - 1)));
  }, [snapshots.length]);

  // Progressive narrative reveal
  const revealedCount = useMemo(() => {
    if (snapshots.length === 0 || narrative.length === 0) return narrative.length;

    const boundaries: number[] = [];
    for (let i = 0; i < narrative.length; i++) {
      const trimmed = narrative[i].trimStart();
      if (
        (trimmed.startsWith("Stage ") && !trimmed.match(/^Stage\s+\d+:\s*Step\s/)) ||
        trimmed.startsWith("[")
      ) {
        boundaries.push(i);
      }
    }

    if (boundaries.length === 0) {
      const ratio = (snapshotIdx + 1) / snapshots.length;
      return Math.max(1, Math.ceil(narrative.length * ratio));
    }

    const groupsToShow = Math.max(
      1,
      Math.min(
        Math.floor(((snapshotIdx + 1) / snapshots.length) * boundaries.length) || 1,
        boundaries.length
      )
    );

    const endIdx =
      groupsToShow < boundaries.length ? boundaries[groupsToShow] : narrative.length;

    return Math.max(1, endIdx);
  }, [snapshots.length, snapshotIdx, narrative]);

  // Scope diff data
  const prevMemory = snapshotIdx > 0 ? snapshots[snapshotIdx - 1]?.memory : null;
  const currMemory = snapshots[snapshotIdx]?.memory ?? {};

  const tabLabels: Record<ShellTab, string> = {
    result: "Result",
    explainable: "Explainable",
    "ai-compatible": "AI-Compatible",
  };

  if (unstyled) {
    return (
      <div className={className} style={style} data-fp="explainable-shell">
        <div data-fp="shell-tabs">
          {tabs.map((tab) => (
            <button
              key={tab}
              data-fp="shell-tab"
              data-active={tab === activeTab}
              onClick={() => setActiveTab(tab)}
            >
              {tabLabels[tab]}
            </button>
          ))}
        </div>
        <div data-fp="shell-content" data-tab={activeTab}>
          {activeTab === "result" && (
            <ResultPanel
              data={resultData ?? null}
              logs={logs}
              hideConsole={hideConsole}
              unstyled
            />
          )}
          {activeTab === "explainable" && (
            <>
              <TimeTravelControls
                snapshots={snapshots}
                selectedIndex={snapshotIdx}
                onIndexChange={handleSnapshotChange}
                unstyled
              />
              {renderFlowchart?.({ snapshots, selectedIndex: snapshotIdx, onNodeClick: handleSnapshotChange })}
              <MemoryInspector snapshots={snapshots} selectedIndex={snapshotIdx} unstyled />
              <ScopeDiff previous={prevMemory} current={currMemory} unstyled />
              <GanttTimeline
                snapshots={snapshots}
                selectedIndex={snapshotIdx}
                onSelect={handleSnapshotChange}
                unstyled
              />
            </>
          )}
          {activeTab === "ai-compatible" && (
            <>
              <TimeTravelControls
                snapshots={snapshots}
                selectedIndex={snapshotIdx}
                onIndexChange={handleSnapshotChange}
                unstyled
              />
              {renderFlowchart?.({ snapshots, selectedIndex: snapshotIdx, onNodeClick: handleSnapshotChange })}
              <NarrativeTrace
                narrative={narrative}
                revealedCount={revealedCount}
                unstyled
              />
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Styled mode ──
  return (
    <div
      className={className}
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: theme.bgPrimary,
        color: theme.textPrimary,
        fontFamily: theme.fontSans,
        ...style,
      }}
      data-fp="explainable-shell"
    >
      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          gap: 0,
          borderBottom: `1px solid ${theme.border}`,
          background: theme.bgSecondary,
          flexShrink: 0,
        }}
      >
        {tabs.map((tab) => {
          const active = tab === activeTab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: `${pad - 4}px ${pad}px`,
                fontSize: fs.label,
                fontWeight: active ? 700 : 500,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: active ? theme.primary : theme.textMuted,
                background: "transparent",
                border: "none",
                borderBottom: active ? `2px solid ${theme.primary}` : "2px solid transparent",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {tabLabels[tab]}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {activeTab === "result" && (
          <ResultPanel
            data={resultData ?? null}
            logs={logs}
            hideConsole={hideConsole}
            size={size}
          />
        )}

        {activeTab === "explainable" && (
          <>
            <TimeTravelControls
              snapshots={snapshots}
              selectedIndex={snapshotIdx}
              onIndexChange={handleSnapshotChange}
              size={size}
            />
            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
              {renderFlowchart && (
                <div style={{ flex: 1, overflow: "hidden", borderRight: `1px solid ${theme.border}` }}>
                  {renderFlowchart({ snapshots, selectedIndex: snapshotIdx, onNodeClick: handleSnapshotChange })}
                </div>
              )}
              <div
                style={{
                  width: renderFlowchart ? "40%" : "100%",
                  minWidth: 280,
                  overflow: "auto",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <MemoryInspector
                  snapshots={snapshots}
                  selectedIndex={snapshotIdx}
                  size={size}
                />
                <div style={{ borderTop: `1px solid ${theme.border}` }}>
                  <ScopeDiff
                    previous={prevMemory}
                    current={currMemory}
                    hideUnchanged
                    size={size}
                  />
                </div>
              </div>
            </div>
            <div style={{ borderTop: `1px solid ${theme.border}`, flexShrink: 0 }}>
              <GanttTimeline
                snapshots={snapshots}
                selectedIndex={snapshotIdx}
                onSelect={handleSnapshotChange}
                size={size}
              />
            </div>
          </>
        )}

        {activeTab === "ai-compatible" && (
          <>
            <TimeTravelControls
              snapshots={snapshots}
              selectedIndex={snapshotIdx}
              onIndexChange={handleSnapshotChange}
              size={size}
            />
            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
              {renderFlowchart && (
                <div style={{ flex: 1, overflow: "hidden", borderRight: `1px solid ${theme.border}` }}>
                  {renderFlowchart({ snapshots, selectedIndex: snapshotIdx, onNodeClick: handleSnapshotChange })}
                </div>
              )}
              <NarrativeTrace
                narrative={narrative}
                revealedCount={revealedCount}
                size={size}
                style={{
                  width: renderFlowchart ? "40%" : "100%",
                  minWidth: 280,
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
