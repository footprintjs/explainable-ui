// Types
export type { StageSnapshot, Size, BaseComponentProps } from "./types";

// Theme
export { FootprintTheme, useFootprintTheme } from "./theme";
export { tokensToCSSVars, defaultTokens } from "./theme";
export { themePresets, coolDark, warmDark, warmLight } from "./theme";
export type { ThemeTokens, ThemePresetName } from "./theme";

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
export type { ExplainableShellProps, ShellTab } from "./components/ExplainableShell";

// Subflow manifest tree (no ReactFlow dependency — works standalone)
export { SubflowTree } from "./components/FlowchartView/SubflowTree";
export type { SubflowTreeProps, SubflowTreeEntry } from "./components/FlowchartView/SubflowTree";

// Adapters
export { toVisualizationSnapshots, createSnapshots } from "./adapters/fromRuntimeSnapshot";
