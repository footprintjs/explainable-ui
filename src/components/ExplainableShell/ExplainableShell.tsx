/**
 * ExplainableShell — Pure orchestrator for explainable pipeline visualization.
 *
 * Layout:
 * ┌──────────────────────────────────────────────────────┐
 * │  [◀ ▶ ▶]  ══════ time-travel slider ══════          │
 * │  Breadcrumb (when drilled into subflow)              │
 * ├───────┬──────────────────┬───────────────────────────┤
 * │ Tree  │  Flowchart       │  [MEMORY]  [NARRATIVE]    │
 * │       │  (always visible) │  (right panel swaps)     │
 * ├───────┴──────────────────┴───────────────────────────┤
 * │  Gantt Timeline                                       │
 * └──────────────────────────────────────────────────────┘
 *
 * State owned here:
 * - snapshotIdx (time-travel position)
 * - drillDownStack (subflow navigation)
 * - rightPanel (memory vs narrative)
 *
 * No rendering logic — delegates to MemoryPanel, NarrativePanel,
 * TracedFlowchartView (via renderFlowchart), TimeTravelControls,
 * GanttTimeline, SubflowTree, SubflowBreadcrumb.
 */
import { useState, useCallback, useMemo } from "react";
import type { StageSnapshot, BaseComponentProps, NarrativeEntry } from "../../types";
import { theme, fontSize, padding } from "../../theme";
import { subflowResultToSnapshots } from "../../adapters/fromRuntimeSnapshot";
import { ResultPanel } from "../ResultPanel";
import { GanttTimeline } from "../GanttTimeline";
import { TimeTravelControls } from "../TimeTravelControls";
import { MemoryPanel } from "../MemoryPanel";
import { NarrativePanel } from "../NarrativePanel";
import { SubflowTree } from "../FlowchartView/SubflowTree";
import { SubflowBreadcrumb } from "../FlowchartView/SubflowBreadcrumb";
import type { SpecNode } from "../FlowchartView/specToReactFlow";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ShellTab = "result" | "explainable" | "ai-compatible";
type RightPanel = "memory" | "narrative";

interface DrillDownEntry {
  subflowId: string;
  label: string;
  spec: SpecNode;
  snapshots: StageSnapshot[];
}

export interface ExplainableShellProps extends BaseComponentProps {
  snapshots: StageSnapshot[];
  spec?: SpecNode | null;
  resultData?: Record<string, unknown> | null;
  logs?: string[];
  narrative?: string[];
  narrativeEntries?: NarrativeEntry[];
  tabs?: ShellTab[];
  defaultTab?: ShellTab;
  hideConsole?: boolean;
  renderFlowchart?: (props: {
    spec: SpecNode;
    snapshots: StageSnapshot[];
    selectedIndex: number;
    onNodeClick?: (indexOrId: number | string) => void;
  }) => React.ReactNode;
}

// ---------------------------------------------------------------------------
// Subflow resolution helpers
// ---------------------------------------------------------------------------

function resolveSubflowLevel(
  parentSpec: SpecNode,
  parentSnapshots: StageSnapshot[],
  subflowNodeName: string,
  narrativeEntries?: NarrativeEntry[],
): DrillDownEntry | null {
  const specNode = findSubflowSpecNode(parentSpec, subflowNodeName);
  if (!specNode?.subflowStructure) return null;
  const parentSnap = parentSnapshots.find(
    (s) => s.stageName === subflowNodeName || s.stageLabel === subflowNodeName
  );
  if (!parentSnap?.subflowResult) return null;

  // Extract subflow-scoped narrative entries (between Entering/Exiting markers)
  const sfNarrative = narrativeEntries
    ? extractSubflowNarrative(narrativeEntries, subflowNodeName)
    : undefined;

  const sfSnapshots = subflowResultToSnapshots(parentSnap.subflowResult, sfNarrative);
  if (sfSnapshots.length === 0) return null;
  return {
    subflowId: specNode.subflowId ?? subflowNodeName,
    label: specNode.subflowName ?? specNode.name,
    spec: specNode.subflowStructure,
    snapshots: sfSnapshots,
  };
}

/** Extract narrative entries between "Entering X subflow" and "Exiting X subflow" markers. */
function extractSubflowNarrative(
  entries: NarrativeEntry[],
  subflowName: string,
): NarrativeEntry[] {
  const result: NarrativeEntry[] = [];
  let inside = false;
  for (const entry of entries) {
    if (entry.type === "subflow" && entry.text.includes(subflowName) && entry.text.startsWith("Entering")) {
      inside = true;
      continue;
    }
    if (inside && entry.type === "subflow" && entry.text.includes(subflowName) && entry.text.startsWith("Exiting")) {
      break;
    }
    if (inside) {
      result.push(entry);
    }
  }
  return result;
}

function findSubflowSpecNode(node: SpecNode, name: string): SpecNode | null {
  if ((node.name === name || node.id === name) && node.isSubflowRoot) return node;
  if (node.children) {
    for (const child of node.children) {
      const found = findSubflowSpecNode(child, name);
      if (found) return found;
    }
  }
  if (node.next) return findSubflowSpecNode(node.next, name);
  return null;
}

function hasSubflowNodes(node: SpecNode): boolean {
  if (node.isSubflowRoot) return true;
  if (node.children?.some(hasSubflowNodes)) return true;
  if (node.next && hasSubflowNodes(node.next)) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ExplainableShell({
  snapshots,
  spec,
  resultData,
  logs = [],
  narrative,
  narrativeEntries,
  tabs = ["result", "explainable", "ai-compatible"],
  defaultTab,
  hideConsole = false,
  renderFlowchart,
  size = "default",
  unstyled = false,
  className,
  style,
}: ExplainableShellProps) {
  // ── State ──
  const [activeTab, setActiveTab] = useState<ShellTab>(defaultTab ?? tabs[0]);
  const [snapshotIdx, setSnapshotIdx] = useState(0);
  const [drillDownStack, setDrillDownStack] = useState<DrillDownEntry[]>([]);
  const [rightPanel, setRightPanel] = useState<RightPanel>("memory");

  const fs = fontSize[size];
  const pad = padding[size];
  const isInSubflow = drillDownStack.length > 0;

  // ── Level resolution ──
  const currentLevel = useMemo(() => {
    if (drillDownStack.length > 0) {
      const top = drillDownStack[drillDownStack.length - 1];
      return { spec: top.spec, snapshots: top.snapshots };
    }
    return { spec: spec ?? null, snapshots };
  }, [drillDownStack, spec, snapshots]);

  const activeSnapshots = currentLevel.snapshots;
  const activeSpec = currentLevel.spec;

  const safeIdx = activeSnapshots.length > 0
    ? Math.max(0, Math.min(snapshotIdx, activeSnapshots.length - 1))
    : 0;

  // ── Level-aware narrative ──
  const activeNarrative = useMemo<string[] | undefined>(() => {
    if (!isInSubflow) return narrative;
    const lines: string[] = [];
    for (const snap of activeSnapshots) {
      const stageLines = (snap.narrative ?? "").split("\n").filter(Boolean);
      lines.push(...stageLines);
    }
    return lines.length > 0 ? lines : undefined;
  }, [isInSubflow, narrative, activeSnapshots]);

  const activeNarrativeEntries = isInSubflow ? undefined : narrativeEntries;

  // ── Breadcrumbs ──
  const breadcrumbs = useMemo(() => {
    const root = { label: spec?.name || "Flowchart", spec: spec!, description: spec?.description };
    return [root, ...drillDownStack.map((e) => ({ label: e.label, spec: e.spec, description: undefined as string | undefined }))];
  }, [spec, drillDownStack]);

  // ── Has subflows? ──
  const showTreeSidebar = useMemo(() => !!spec && hasSubflowNodes(spec), [spec]);

  // ── Root overlay for SubflowTree ──
  const rootOverlay = useMemo(() => {
    if (isInSubflow || !snapshots.length) return { activeStage: undefined, doneStages: undefined };
    const doneStages = new Set(snapshots.slice(0, safeIdx).map((s) => s.stageLabel));
    const activeStage = snapshots[safeIdx]?.stageLabel ?? null;
    return { activeStage, doneStages };
  }, [isInSubflow, snapshots, safeIdx]);

  // ── Handlers ──
  const handleTabChange = useCallback((tab: ShellTab) => {
    setActiveTab(tab);
    setDrillDownStack([]);
    setSnapshotIdx(999);
  }, []);

  const handleSnapshotChange = useCallback((idx: number | string) => {
    if (typeof idx === "number") setSnapshotIdx(idx);
  }, []);

  const handleDrillDown = useCallback(
    (nodeName: string) => {
      if (!activeSpec) return;
      const entry = resolveSubflowLevel(activeSpec, activeSnapshots, nodeName, narrativeEntries);
      if (entry) {
        setDrillDownStack((prev) => [...prev, entry]);
        setSnapshotIdx(0);
      }
    },
    [activeSpec, activeSnapshots, narrativeEntries]
  );

  const handleBreadcrumbNavigate = useCallback((level: number) => {
    setDrillDownStack((prev) => level === 0 ? [] : prev.slice(0, level));
    setSnapshotIdx(999);
  }, []);

  const handleNodeClick = useCallback(
    (indexOrId: number | string) => {
      if (typeof indexOrId === "number") { setSnapshotIdx(indexOrId); return; }
      if (activeSpec) {
        const sfNode = findSubflowSpecNode(activeSpec, indexOrId);
        if (sfNode?.subflowStructure) { handleDrillDown(indexOrId); return; }
      }
      const idx = activeSnapshots.findIndex((s) => s.stageLabel === indexOrId);
      if (idx >= 0) setSnapshotIdx(idx);
    },
    [activeSpec, activeSnapshots, handleDrillDown]
  );

  const handleTreeNodeSelect = useCallback(
    (name: string, isSubflow: boolean) => {
      if (isSubflow && spec) {
        setDrillDownStack([]);
        const entry = resolveSubflowLevel(spec, snapshots, name, narrativeEntries);
        if (entry) { setDrillDownStack([entry]); setSnapshotIdx(0); }
      } else {
        setDrillDownStack([]);
        const idx = snapshots.findIndex((s) => s.stageLabel === name);
        if (idx >= 0) setSnapshotIdx(idx);
      }
    },
    [spec, snapshots, narrativeEntries]
  );

  // ── Tab labels ──
  const tabLabels: Record<ShellTab, string> = {
    result: "Result",
    explainable: "Explainable",
    "ai-compatible": "AI-Compatible",
  };

  const rightPanelLabels: Record<RightPanel, string> = {
    memory: "Memory",
    narrative: "Narrative",
  };

  // ── Unstyled mode ──
  if (unstyled) {
    return (
      <div className={className} style={style} data-fp="explainable-shell">
        <div data-fp="shell-tabs">
          {tabs.map((tab) => (
            <button key={tab} data-fp="shell-tab" data-active={tab === activeTab} onClick={() => handleTabChange(tab)}>
              {tabLabels[tab]}
            </button>
          ))}
        </div>
        <div data-fp="shell-content" data-tab={activeTab}>
          {activeTab === "result" && (
            <ResultPanel data={resultData ?? null} logs={logs} hideConsole={hideConsole} unstyled />
          )}
          {(activeTab === "explainable" || activeTab === "ai-compatible") && (
            <>
              <TimeTravelControls snapshots={activeSnapshots} selectedIndex={safeIdx} onIndexChange={handleSnapshotChange} unstyled />
              {isInSubflow && <SubflowBreadcrumb breadcrumbs={breadcrumbs} onNavigate={handleBreadcrumbNavigate} />}
              {activeSpec && renderFlowchart?.({ spec: activeSpec, snapshots: activeSnapshots, selectedIndex: safeIdx, onNodeClick: handleNodeClick })}
              {activeTab === "explainable" && (
                <MemoryPanel snapshots={activeSnapshots} selectedIndex={safeIdx} unstyled />
              )}
              {activeTab === "ai-compatible" && (
                <NarrativePanel snapshots={activeSnapshots} selectedIndex={safeIdx} narrativeEntries={activeNarrativeEntries} narrative={activeNarrative} unstyled />
              )}
              <GanttTimeline snapshots={activeSnapshots} selectedIndex={safeIdx} onSelect={handleSnapshotChange} unstyled />
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Styled mode ──
  // Result tab is separate, explainable/ai-compatible share the same layout
  const isVisualizationTab = activeTab === "explainable" || activeTab === "ai-compatible";

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
              onClick={() => handleTabChange(tab)}
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
          <ResultPanel data={resultData ?? null} logs={logs} hideConsole={hideConsole} size={size} />
        )}

        {isVisualizationTab && (
          <>
            {/* Time-travel slider */}
            <TimeTravelControls
              snapshots={activeSnapshots}
              selectedIndex={safeIdx}
              onIndexChange={handleSnapshotChange}
              size={size}
            />

            {/* Breadcrumb (when drilled into subflow) */}
            {isInSubflow && (
              <SubflowBreadcrumb breadcrumbs={breadcrumbs} onNavigate={handleBreadcrumbNavigate} />
            )}

            {/* Main content area: Tree | Flowchart | Right panel */}
            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
              {/* SubflowTree sidebar */}
              {showTreeSidebar && (
                <SubflowTree
                  spec={spec!}
                  activeStage={rootOverlay.activeStage}
                  doneStages={rootOverlay.doneStages}
                  onNodeSelect={handleTreeNodeSelect}
                  style={{ width: 200, flexShrink: 0, height: "100%" }}
                />
              )}

              {/* Flowchart (always visible) */}
              {renderFlowchart && activeSpec && (
                <div style={{ flex: 1, overflow: "hidden", borderRight: `1px solid ${theme.border}` }}>
                  {renderFlowchart({
                    spec: activeSpec,
                    snapshots: activeSnapshots,
                    selectedIndex: safeIdx,
                    onNodeClick: handleNodeClick,
                  })}
                </div>
              )}

              {/* Right panel: swappable */}
              <div
                style={{
                  width: renderFlowchart ? "35%" : "100%",
                  minWidth: 280,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}
              >
                {/* Panel switcher */}
                <div
                  style={{
                    display: "flex",
                    gap: 0,
                    borderBottom: `1px solid ${theme.border}`,
                    flexShrink: 0,
                  }}
                >
                  {(["memory", "narrative"] as RightPanel[]).map((panel) => {
                    const active = rightPanel === panel;
                    return (
                      <button
                        key={panel}
                        onClick={() => setRightPanel(panel)}
                        style={{
                          flex: 1,
                          padding: `${pad - 6}px ${pad - 4}px`,
                          fontSize: fs.small,
                          fontWeight: active ? 600 : 400,
                          color: active ? theme.primary : theme.textMuted,
                          background: active
                            ? `color-mix(in srgb, ${theme.primary} 8%, transparent)`
                            : "transparent",
                          border: "none",
                          borderBottom: active ? `2px solid ${theme.primary}` : "2px solid transparent",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}
                      >
                        {rightPanelLabels[panel]}
                      </button>
                    );
                  })}
                </div>

                {/* Panel content */}
                {rightPanel === "memory" && (
                  <MemoryPanel
                    snapshots={activeSnapshots}
                    selectedIndex={safeIdx}
                    size={size}
                    style={{ flex: 1 }}
                  />
                )}
                {rightPanel === "narrative" && (
                  <NarrativePanel
                    snapshots={activeSnapshots}
                    selectedIndex={safeIdx}
                    narrativeEntries={activeNarrativeEntries}
                    narrative={activeNarrative}
                    size={size}
                    style={{ flex: 1 }}
                  />
                )}
              </div>
            </div>

            {/* Gantt timeline (always visible) */}
            <div style={{ borderTop: `1px solid ${theme.border}`, flexShrink: 0 }}>
              <GanttTimeline
                snapshots={activeSnapshots}
                selectedIndex={safeIdx}
                onSelect={handleSnapshotChange}
                size={size}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
