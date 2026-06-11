// Types
export type { StageSnapshot, Size, BaseComponentProps, NarrativeEntry } from "./types";

// Theme
export { FootprintTheme, useFootprintTheme } from "./theme";
export { tokensToCSSVars, defaultTokens, rawDefaults } from "./theme";
export { themePresets, coolDark, coolLight, warmDark, warmLight } from "./theme";
export { useDarkModeTokens } from "./theme";
export type { ThemeTokens, ThemePresetName, DarkModeTokensOptions } from "./theme";

// Core components (zero external deps beyond React)
export { MemoryInspector } from "./components/MemoryInspector";
export type { MemoryInspectorProps } from "./components/MemoryInspector";

export { NarrativeLog } from "./components/NarrativeLog";
export type { NarrativeLogProps } from "./components/NarrativeLog";

export { NarrativeTrace } from "./components/NarrativeTrace";
export type { NarrativeTraceProps } from "./components/NarrativeTrace";

export { GanttTimeline } from "./components/GanttTimeline";
export type { GanttTimelineProps } from "./components/GanttTimeline";

export { SnapshotPanel } from "./components/SnapshotPanel";
export type { SnapshotPanelProps } from "./components/SnapshotPanel";

export { ScopeDiff } from "./components/ScopeDiff";
export type { ScopeDiffProps, DiffEntry } from "./components/ScopeDiff";

export { ResultPanel } from "./components/ResultPanel";
export type { ResultPanelProps } from "./components/ResultPanel";

export { StageDetailPanel } from "./components/StageDetailPanel";
export type { StageDetailPanelProps, StageDetailMode, MemoryChange } from "./components/StageDetailPanel";

export { TimeTravelControls } from "./components/TimeTravelControls";
export type { TimeTravelControlsProps } from "./components/TimeTravelControls";

export { ExplainableShell } from "./components/ExplainableShell";
export type { ExplainableShellProps, RuntimeSnapshotInput, RecorderView, ShellTab, PanelLabels, DefaultExpanded } from "./components/ExplainableShell";

// Drop-in viewer for `agentfootprint.exportTrace()` JSON
export { TraceViewer } from "./components/TraceViewer/TraceViewer";
export type { TraceViewerProps, AgentfootprintTrace, TraceParseError } from "./components/TraceViewer/TraceViewer";

// Composite panels (memory + narrative — self-contained right-panel views)
export { MemoryPanel } from "./components/MemoryPanel";
export type { MemoryPanelProps } from "./components/MemoryPanel";

export { NarrativePanel } from "./components/NarrativePanel";
export type { NarrativePanelProps } from "./components/NarrativePanel";

export { StoryNarrative } from "./components/StoryNarrative";
export type { StoryNarrativeProps } from "./components/StoryNarrative";

// Subflow manifest tree (no ReactFlow dependency — works standalone)
export { SubflowTree } from "./components/FlowchartView/SubflowTree";
export type { SubflowTreeProps, SubflowTreeEntry } from "./components/FlowchartView/SubflowTree";

// Adapters
export { toVisualizationSnapshots, createSnapshots, subflowResultToSnapshots, mergeWritePatch } from "./adapters/fromRuntimeSnapshot";
export type { NarrativeEntry as AdapterNarrativeEntry } from "./adapters/fromRuntimeSnapshot";

// Utilities — narrative sync, subflow extraction
export { buildEntryRangeIndex, computeRevealedEntryCount, extractSubflowNarrative } from "./utils/narrativeSync";
export type { EntryRangeIndex } from "./utils/narrativeSync";

// ── New components (v2 layout) ──────────────────────────────────────

// Inspector: State + Data Trace
export { InspectorPanel } from "./components/InspectorPanel/InspectorPanel";
export type { InspectorPanelProps } from "./components/InspectorPanel/InspectorPanel";

// Data Trace: backward causal chain visualization
export { DataTracePanel } from "./components/DataTracePanel/DataTracePanel";
export type { DataTracePanelProps, CausalFrame } from "./components/DataTracePanel/DataTracePanel";

// Insights: recorder tabs / grid (was "Recorders")
export { InsightPanel } from "./components/InsightPanel/InsightPanel";
export type { InsightPanelProps, InsightConfig } from "./components/InsightPanel/InsightPanel";

// Compact Timeline: dot line → Gantt toggle
export { CompactTimeline } from "./components/CompactTimeline/CompactTimeline";
export type { CompactTimelineProps } from "./components/CompactTimeline/CompactTimeline";
