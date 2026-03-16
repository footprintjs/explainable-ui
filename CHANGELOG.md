# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.7.0] - 2026-03-16

### Changed
- **ExplainableShell rewritten as pure orchestrator** — owns drill-down stack, snapshot index, and right-panel toggle ("memory" | "narrative"). Flowchart is always visible; right panel swaps between Memory (Scope Recorder / commit history) and Narrative (FlowRecorder). Subflow drill-down resolves via `subflowResultToSnapshots` with scoped narrative entries.
- **TracedFlowchartView simplified to dumb renderer** — no internal navigation state. Always sends string `node.id` via `onNodeClick`; shell decides whether click means drill-down or snapshot jump.
- **Adapter fallback narrative improved** — when no narrative entries match (e.g. subflow internals before footprintjs v0.14.0), builds basic narrative from stage name, description, and `stageWrites` keys instead of showing placeholder text.

### Added
- **MemoryPanel** — thin composition of MemoryInspector + ScopeDiff. Data source: Scope Recorder / commit history.
- **NarrativePanel** — wraps StoryNarrative or NarrativeTrace with progressive reveal logic. Data source: FlowRecorder.
- **StoryNarrative** — rich rendering of structured `NarrativeEntry[]` with progressive reveal counting stage and subflow boundaries.
- **`subflowResultToSnapshots`** strips subflow name prefix so stage names match spec nodes.

## [0.5.0] - 2026-03-12

### Changed
- **Memory view uses `stageWrites` instead of diagnostic logs** — `fromRuntimeSnapshot` adapter now builds cumulative memory from `stageWrites` (actual `setValue()`/`updateValue()` calls) instead of `node.logs`. Diagnostic keys like `writeTrace` and `deciderRationale` no longer appear in the memory panel.
- **`buildNarrative` reports actual memory writes** — narrative sentences now reference `stageWrites` keys instead of diagnostic log keys.
- **`DEFAULT_EXCLUDED_KEYS` cleared** — no longer needed since memory view only shows real state mutations.
- **"PIPELINE" label renamed to "FLOWCHART"** in `SubflowTree` component.
- **Subflow section hidden when empty** — `SubflowTree` no longer renders the subflow section when there are no subflows.

### Added
- **Cumulative memory tracking** — adapter accumulates `stageWrites` across the execution chain so each stage shows the full memory state up to that point.
- **`stageReads` passthrough** — adapter forwards `stageReads` from runtime snapshots for UI "read cursor" annotations.
- Tests for cumulative memory, diagnostic log exclusion, and value deletion via `stageWrites`.

## [0.4.0] - 2026-03-11

### Added
- `TracedFlowchartView` — self-contained flowchart component that accepts `spec` + optional `snapshots`/`snapshotIndex` and handles overlay computation, subflow drill-down, and breadcrumb navigation internally. No manual `ExecutionOverlay` construction needed.
- `GanttTimeline` collapsible mode — `maxVisibleRows` prop (default: 5) collapses the timeline with an expand/collapse toggle. Auto-scrolls to keep the active stage visible when collapsed.
- `GanttTimeline` row height consistency for smooth collapse/expand animations.

### Changed
- `GanttTimelineProps` — added `maxVisibleRows?: number` prop.

## [0.3.2] - 2026-03-11

### Added
- Full playground example in README showing `useFlowchartData` hook pattern with flowchart, time-travel, and detail panels.

## [0.3.1] - 2026-03-11

### Added
- Comprehensive README with flowchart visualization, subflow drill-down, adapter, and theming guides.

## [0.3.0] - 2026-03-11

### Added
- `useSubflowNavigation` hook — manages breadcrumb stack for subflow drill-down navigation.
- `SubflowBreadcrumb` component — renders clickable breadcrumb bar (Root > SubflowA > ...).
- `currentSubflowNodeName` field on `SubflowNavigation` — name of the drilled-into subflow node.
- Overlay passthrough to subflow levels (previously only applied at root).

## [0.2.0] - 2026-03-09

### Added
- `specToReactFlow` — converts pipeline spec to ReactFlow nodes/edges with execution overlay.
- `StageNode` — theme-aware custom node with step badges, pulse rings, and subflow indicators.
- Loop edge routing via right-side handles to avoid center overlap.
- Google Maps-style execution path with glow effect.
- Theme-aware flowchart defaults from `--fp-*` CSS variables.

## [0.1.0] - 2026-03-08

### Added
- Initial release with core components: `ExplainableShell`, `TimeTravelControls`, `NarrativeTrace`, `NarrativeLog`, `ScopeDiff`, `ResultPanel`, `MemoryInspector`, `GanttTimeline`, `SnapshotPanel`.
- `FlowchartView` component wrapping ReactFlow with execution state coloring.
- `toVisualizationSnapshots` and `createSnapshots` adapters.
- `FootprintTheme` provider with `coolDark`, `warmDark`, `warmLight` presets.
- CSS variable theming via `--fp-*` tokens.
- Size variants (`compact`, `default`, `detailed`) and unstyled mode with `data-fp` attributes.
- Separate `footprint-explainable-ui/flowchart` entry point (tree-shakeable, requires `@xyflow/react`).
