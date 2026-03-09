// Types
export type { StageSnapshot, Size, BaseComponentProps } from "./types";

// Theme
export { FootprintTheme, useFootprintTheme } from "./theme";
export { tokensToCSSVars, defaultTokens } from "./theme";
export type { ThemeTokens } from "./theme";

// Core components (zero external deps beyond React)
export { MemoryInspector } from "./components/MemoryInspector";
export type { MemoryInspectorProps } from "./components/MemoryInspector";

export { NarrativeLog } from "./components/NarrativeLog";
export type { NarrativeLogProps } from "./components/NarrativeLog";

export { GanttTimeline } from "./components/GanttTimeline";
export type { GanttTimelineProps } from "./components/GanttTimeline";

export { SnapshotPanel } from "./components/SnapshotPanel";
export type { SnapshotPanelProps } from "./components/SnapshotPanel";

// Adapters
export { toVisualizationSnapshots, createSnapshots } from "./adapters/fromRuntimeSnapshot";
