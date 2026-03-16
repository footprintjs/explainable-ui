/**
 * ExplainableShell — Pure orchestrator for explainable pipeline visualization.
 *
 * Collapsible sections use the **line + centered pill** pattern:
 * - Collapsed = thin divider line with a pill button sitting on it
 * - Expanded = full content with a pill at the closing edge
 *
 * Sub-components are memo'd to minimize re-renders when scrubbing the
 * time-travel slider. Only components that depend on snapshotIdx re-render.
 *
 * Consumer controls theme via --fp-* CSS custom properties.
 */
import { memo, useState, useCallback, useMemo, useRef, useEffect } from "react";
import type { StageSnapshot, BaseComponentProps, NarrativeEntry } from "../../types";
import { theme } from "../../theme";
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

interface SubflowLevel {
  subflowId: string;
  label: string;
  spec: SpecNode;
  snapshots: StageSnapshot[];
}

interface DrillDownEntry extends SubflowLevel {
  parentSnapshotIdx: number;
}

export interface PanelLabels {
  /** Left panel pill label (subflow tree). Default: "Topology" */
  topology?: string;
  /** Right panel pill label (memory/narrative). Default: "Details" */
  details?: string;
  /** Bottom panel pill label (timeline). Default: "Timeline" */
  timeline?: string;
}

/** Which panels start expanded. Default: `{ details: true }` (flowchart + memory). */
export interface DefaultExpanded {
  topology?: boolean;
  details?: boolean;
  timeline?: boolean;
}

export interface ExplainableShellProps extends BaseComponentProps {
  snapshots: StageSnapshot[];
  spec?: SpecNode | null;
  title?: string;
  resultData?: Record<string, unknown> | null;
  logs?: string[];
  narrative?: string[];
  narrativeEntries?: NarrativeEntry[];
  tabs?: ShellTab[];
  defaultTab?: ShellTab;
  hideConsole?: boolean;
  /** Customize the labels on collapsible panel pills */
  panelLabels?: PanelLabels;
  /** Which panels start expanded. Default: `{ details: true }` */
  defaultExpanded?: DefaultExpanded;
  renderFlowchart?: (props: {
    spec: SpecNode;
    snapshots: StageSnapshot[];
    selectedIndex: number;
    onNodeClick?: (indexOrId: number | string) => void;
  }) => React.ReactNode;
}

// ---------------------------------------------------------------------------
// Line + Pill — collapsed state is just a line with a pill centered on it
// ---------------------------------------------------------------------------

/** Horizontal line with centered pill (for top/bottom edges) */
const HLinePill = memo(function HLinePill({
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
const VLinePill = memo(function VLinePill({
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
// DetailsContent — Memory/Narrative tab switcher + content (shared by mobile & desktop)
// ---------------------------------------------------------------------------

const RIGHT_PANEL_LABELS: Record<RightPanel, string> = {
  memory: "Memory",
  narrative: "Narrative",
};

const DetailsContent = memo(function DetailsContent({
  snapshots,
  selectedIndex,
  narrativeEntries,
  narrative,
  size,
  fillHeight,
}: {
  snapshots: StageSnapshot[];
  selectedIndex: number;
  narrativeEntries?: NarrativeEntry[];
  narrative?: string[];
  size: "compact" | "default" | "detailed";
  fillHeight?: boolean;
}) {
  const [rightPanel, setRightPanel] = useState<RightPanel>("memory");

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Tab switcher */}
      <div style={{ display: "flex", borderBottom: `1px solid ${theme.border}`, flexShrink: 0 }}>
        {(["memory", "narrative"] as RightPanel[]).map((panel) => {
          const active = rightPanel === panel;
          return (
            <button
              key={panel}
              onClick={() => setRightPanel(panel)}
              style={{
                flex: 1, padding: "6px 8px", fontSize: 11,
                fontWeight: active ? 600 : 400,
                color: active ? theme.primary : theme.textMuted,
                background: active ? `color-mix(in srgb, ${theme.primary} 8%, transparent)` : "transparent",
                border: "none",
                borderBottom: active ? `2px solid ${theme.primary}` : "2px solid transparent",
                cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "inherit",
              }}
            >
              {RIGHT_PANEL_LABELS[panel]}
            </button>
          );
        })}
      </div>
      <div style={{ flex: 1, overflow: "auto" }}>
        {rightPanel === "memory" && (
          <MemoryPanel snapshots={snapshots} selectedIndex={selectedIndex} size={size} style={fillHeight ? { height: "100%" } : undefined} />
        )}
        {rightPanel === "narrative" && (
          <NarrativePanel snapshots={snapshots} selectedIndex={selectedIndex} narrativeEntries={narrativeEntries} narrative={narrative} size={size} style={fillHeight ? { height: "100%" } : undefined} />
        )}
      </div>
    </div>
  );
});

// ---------------------------------------------------------------------------
// Subflow resolution helpers
// ---------------------------------------------------------------------------

function resolveSubflowLevel(
  parentSpec: SpecNode,
  parentSnapshots: StageSnapshot[],
  subflowNodeName: string,
  narrativeEntries?: NarrativeEntry[],
): SubflowLevel | null {
  const specNode = findSubflowSpecNode(parentSpec, subflowNodeName);
  if (!specNode?.subflowStructure) return null;
  const parentSnap = parentSnapshots.find(
    (s) => s.stageName === subflowNodeName || s.stageLabel === subflowNodeName
  );
  if (!parentSnap?.subflowResult) return null;
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

function extractSubflowNarrative(entries: NarrativeEntry[], subflowName: string): NarrativeEntry[] {
  const result: NarrativeEntry[] = [];
  let inside = false;
  for (const entry of entries) {
    if (entry.type === "subflow" && entry.text.includes(subflowName) && entry.text.startsWith("Entering")) { inside = true; continue; }
    if (inside && entry.type === "subflow" && entry.text.includes(subflowName) && entry.text.startsWith("Exiting")) break;
    if (inside) result.push(entry);
  }
  return result;
}

function findSubflowSpecNode(node: SpecNode, name: string): SpecNode | null {
  if ((node.name === name || node.id === name) && node.isSubflowRoot) return node;
  if (node.children) { for (const child of node.children) { const f = findSubflowSpecNode(child, name); if (f) return f; } }
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
  title,
  resultData,
  logs = [],
  narrative,
  narrativeEntries,
  tabs = ["result", "explainable"],
  defaultTab,
  hideConsole = false,
  panelLabels,
  defaultExpanded,
  renderFlowchart,
  size = "default",
  unstyled = false,
  className,
  style,
}: ExplainableShellProps) {
  const leftLabel = panelLabels?.topology ?? "Topology";
  const rightLabel = panelLabels?.details ?? "Details";
  const bottomLabel = panelLabels?.timeline ?? "Timeline";

  // Responsive: detect narrow container
  const shellRef = useRef<HTMLDivElement>(null);
  const [isNarrow, setIsNarrow] = useState(false);
  useEffect(() => {
    const el = shellRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setIsNarrow(entry.contentRect.width < 640);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const [activeTab, setActiveTab] = useState<ShellTab>(defaultTab ?? tabs[0]);
  const [snapshotIdx, setSnapshotIdx] = useState(0);
  const [drillDownStack, setDrillDownStack] = useState<DrillDownEntry[]>([]);
  const [rightExpanded, setRightExpanded] = useState(defaultExpanded?.details ?? true);
  const [leftExpanded, setLeftExpanded] = useState(defaultExpanded?.topology ?? false);
  const [timelineExpanded, setTimelineExpanded] = useState(defaultExpanded?.timeline ?? false);

  // Auto-collapse all panels when switching to narrow (mobile)
  useEffect(() => {
    if (isNarrow) {
      setLeftExpanded(false);
      setRightExpanded(false);
      setTimelineExpanded(false);
    }
  }, [isNarrow]);

  // Notify ReactFlow (and any ResizeObserver-based children) when panels toggle
  const triggerReflow = useCallback(() => {
    requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
  }, []);
  const toggleLeft = useCallback((v: boolean) => { setLeftExpanded(v); triggerReflow(); }, [triggerReflow]);
  const toggleRight = useCallback((v: boolean) => { setRightExpanded(v); triggerReflow(); }, [triggerReflow]);
  const toggleTimeline = useCallback(() => { setTimelineExpanded((p) => !p); triggerReflow(); }, [triggerReflow]);

  const isInSubflow = drillDownStack.length > 0;

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

  const breadcrumbs = useMemo(() => {
    const root = { label: title || "Flowchart", spec: spec!, description: spec?.description };
    return [root, ...drillDownStack.map((e) => ({ label: e.label, spec: e.spec, description: undefined as string | undefined }))];
  }, [spec, title, drillDownStack]);

  const showTreeSidebar = useMemo(() => !!spec && hasSubflowNodes(spec), [spec]);

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
        setDrillDownStack((prev) => [...prev, { ...entry, parentSnapshotIdx: snapshotIdx }]);
        setSnapshotIdx(0);
      }
    },
    [activeSpec, activeSnapshots, narrativeEntries, snapshotIdx]
  );

  const handleBreadcrumbNavigate = useCallback((level: number) => {
    setDrillDownStack((prev) => {
      const popped = level === 0 ? prev[0] : prev[level];
      if (popped) setSnapshotIdx(popped.parentSnapshotIdx);
      return level === 0 ? [] : prev.slice(0, level);
    });
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
        if (entry) { setDrillDownStack([{ ...entry, parentSnapshotIdx: snapshotIdx }]); setSnapshotIdx(0); }
      } else {
        setDrillDownStack([]);
        const idx = snapshots.findIndex((s) => s.stageLabel === name);
        if (idx >= 0) setSnapshotIdx(idx);
      }
    },
    [spec, snapshots, narrativeEntries, snapshotIdx]
  );

  const tabLabels: Record<ShellTab, string> = {
    result: "Result",
    explainable: "Explainable",
    "ai-compatible": "AI-Compatible",
  };

  // ── Unstyled mode ──
  if (unstyled) {
    return (
      <div className={className} style={style} data-fp="explainable-shell">
        <div data-fp="shell-tabs">
          {tabs.map((tab) => (
            <button key={tab} data-fp="shell-tab" data-active={tab === activeTab} onClick={() => handleTabChange(tab)}>{tabLabels[tab]}</button>
          ))}
        </div>
        <div data-fp="shell-content" data-tab={activeTab}>
          {activeTab === "result" && <ResultPanel data={resultData ?? null} logs={logs} hideConsole={hideConsole} unstyled />}
          {(activeTab === "explainable" || activeTab === "ai-compatible") && (
            <>
              <TimeTravelControls snapshots={activeSnapshots} selectedIndex={safeIdx} onIndexChange={handleSnapshotChange} unstyled />
              {isInSubflow && <SubflowBreadcrumb breadcrumbs={breadcrumbs} onNavigate={handleBreadcrumbNavigate} />}
              {activeSpec && renderFlowchart?.({ spec: activeSpec, snapshots: activeSnapshots, selectedIndex: safeIdx, onNodeClick: handleNodeClick })}
              <MemoryPanel snapshots={activeSnapshots} selectedIndex={safeIdx} unstyled />
              <NarrativePanel snapshots={activeSnapshots} selectedIndex={safeIdx} narrativeEntries={activeNarrativeEntries} narrative={activeNarrative} unstyled />
              <GanttTimeline snapshots={activeSnapshots} selectedIndex={safeIdx} onSelect={handleSnapshotChange} unstyled />
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Styled mode ──
  const isVisualizationTab = activeTab === "explainable" || activeTab === "ai-compatible";

  return (
    <div
      ref={shellRef}
      className={className}
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: theme.bgPrimary,
        color: theme.textPrimary,
        fontFamily: theme.fontSans,
        fontSize: 12,
        ...style,
      }}
      data-fp="explainable-shell"
    >
      {/* Tab bar — only if multiple tabs */}
      {tabs.length > 1 && (
        <div style={{
          display: "flex",
          borderBottom: `1px solid ${theme.border}`,
          background: theme.bgSecondary,
          flexShrink: 0,
        }}>
          {tabs.map((tab) => {
            const active = tab === activeTab;
            return (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                style={{
                  padding: "6px 14px",
                  fontSize: 11,
                  fontWeight: active ? 700 : 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: active ? theme.primary : theme.textMuted,
                  background: "transparent",
                  border: "none",
                  borderBottom: active ? `2px solid ${theme.primary}` : "2px solid transparent",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {tabLabels[tab]}
              </button>
            );
          })}
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, overflow: isNarrow ? "auto" : "hidden", display: "flex", flexDirection: "column" }}>
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

            {/* Breadcrumb */}
            {isInSubflow && (
              <SubflowBreadcrumb breadcrumbs={breadcrumbs} onNavigate={handleBreadcrumbNavigate} />
            )}

            {/* ─── Main content ─── */}
            {isNarrow ? (
              /* ── Mobile: stacked vertical ── */
              <>
                {/* Flowchart — fixed height */}
                <div style={{ height: 350, flexShrink: 0, overflow: "hidden" }}>
                  {renderFlowchart && activeSpec && renderFlowchart({
                    spec: activeSpec,
                    snapshots: activeSnapshots,
                    selectedIndex: safeIdx,
                    onNodeClick: handleNodeClick,
                  })}
                </div>

                {/* Topology (subflow tree) — collapsible */}
                {showTreeSidebar && (
                  <>
                    <HLinePill label={leftLabel} expanded={leftExpanded} onClick={() => toggleLeft(!leftExpanded)} />
                    {leftExpanded && (
                      <div style={{ maxHeight: 180, overflow: "auto", flexShrink: 0 }}>
                        <SubflowTree
                          spec={spec!}
                          activeStage={rootOverlay.activeStage}
                          doneStages={rootOverlay.doneStages}
                          onNodeSelect={handleTreeNodeSelect}
                        />
                      </div>
                    )}
                  </>
                )}

                {/* Details (memory/narrative) — collapsible */}
                <HLinePill label={rightLabel} expanded={rightExpanded} onClick={() => toggleRight(!rightExpanded)} />
                {rightExpanded && (
                  <div style={{ maxHeight: 250, flexShrink: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                    <DetailsContent
                      snapshots={activeSnapshots}
                      selectedIndex={safeIdx}
                      narrativeEntries={activeNarrativeEntries}
                      narrative={activeNarrative}
                      size={size}
                    />
                  </div>
                )}

                {/* Timeline */}
                <HLinePill label={bottomLabel} detail={`${activeSnapshots.length} stages`} expanded={timelineExpanded} onClick={toggleTimeline} />
                {timelineExpanded && (
                  <div style={{ flexShrink: 0, overflow: "hidden" }}>
                    <GanttTimeline snapshots={activeSnapshots} selectedIndex={safeIdx} onSelect={handleSnapshotChange} size={size} />
                  </div>
                )}
              </>
            ) : (
              /* ── Desktop: side-by-side ── */
              <>
                <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

                  {/* Left: SubflowTree with VLinePill handle */}
                  {showTreeSidebar && (
                    leftExpanded ? (
                      <div style={{ width: 220, flexShrink: 0, display: "flex", flexDirection: "row", overflow: "hidden" }}>
                        <div style={{ flex: 1, overflow: "auto" }}>
                          <SubflowTree
                            spec={spec!}
                            activeStage={rootOverlay.activeStage}
                            doneStages={rootOverlay.doneStages}
                            onNodeSelect={handleTreeNodeSelect}
                          />
                        </div>
                        <VLinePill label={leftLabel} expanded={true} side="left" onClick={() => toggleLeft(false)} />
                      </div>
                    ) : (
                      <VLinePill label={leftLabel} expanded={false} side="left" onClick={() => toggleLeft(true)} />
                    )
                  )}

                  {/* Center: Flowchart */}
                  <div style={{ flex: 1, overflow: "hidden", minWidth: 0 }}>
                    {renderFlowchart && activeSpec && renderFlowchart({
                      spec: activeSpec,
                      snapshots: activeSnapshots,
                      selectedIndex: safeIdx,
                      onNodeClick: handleNodeClick,
                    })}
                  </div>

                  {/* Right: VLinePill handle + Memory/Narrative */}
                  {rightExpanded ? (
                    <div style={{ width: "38%", minWidth: 300, maxWidth: 500, display: "flex", flexDirection: "row", overflow: "hidden" }}>
                      <VLinePill label={rightLabel} expanded={true} onClick={() => toggleRight(false)} />
                      <DetailsContent
                        snapshots={activeSnapshots}
                        selectedIndex={safeIdx}
                        narrativeEntries={activeNarrativeEntries}
                        narrative={activeNarrative}
                        size={size}
                        fillHeight
                      />
                    </div>
                  ) : (
                    <VLinePill label={rightLabel} expanded={false} onClick={() => toggleRight(true)} />
                  )}
                </div>

                {/* Bottom: Timeline */}
                <HLinePill label={bottomLabel} detail={`${activeSnapshots.length} stages`} expanded={timelineExpanded} onClick={toggleTimeline} />
                {timelineExpanded && (
                  <div style={{ flexShrink: 0, overflow: "hidden" }}>
                    <GanttTimeline snapshots={activeSnapshots} selectedIndex={safeIdx} onSelect={handleSnapshotChange} size={size} />
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
