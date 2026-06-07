# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.22.0]

Time-travel chart polish: a clearer "live step" marker, drill re-fitting, and a
softer loop edge. Additive only.

### Added

- **`StageNode` "NOW" badge** + a stronger glow on the active node, so the live
  step in a running/replayed chart reads at a glance.
- **`useChartAutoRefit` `refitKey` option** — re-fits the view when the key
  changes (e.g. drilling into / out of a subflow) so a drilled subgraph recenters
  instead of inheriting the parent's pan/zoom. `TracedFlow` wires this to the
  current drill target.
- **`softenLoopStyle`** (exported from `LoopBackEdge`) — dashed, muted-opacity,
  thinner, rounder loop edges so back-edges recede behind the forward flow.

### Fixed

- **`aggregateMountStatus` active-marking.** A subflow mount is now marked
  "active" only when one of its internals is *currently* active — never on merely
  past-done internals. Previously, once subflow internals were materialised for
  drill, a looping subflow's earlier-iteration done members could steal "active"
  from the real live top-level node (its NOW highlight would disappear).

### Tests

- `aggregateMountStatus`, `useChartAutoRefit`, `softenLoopStyle`.

## [0.21.0]

Chart rendering upgrades for merge-tree + time-travel charts. Additive only.

### Added

- **`traceGroupLayout`**: group-based straight-trunk layout (longest-path ranks +
  span/fork-origin-centered merges) for staggered-merge charts, plus
  `dagreTraceLayout`, `groupLayout`, `loopRouting`, `stepRouting`,
  `snapLinearSuccessors` internals.
- **New node/edge renderers**: `SlotPillNode` (context slots), `GroupContainerNode`
  (nested subflow boxes), `LoopBackEdge` (right-margin loop curve), `SmartStepEdge`
  (rank-skipping routing).
- **`<TracedFlow coActiveStageIds>`**: ORs a co-active set into `active` for ALL
  node types (stage + custom), so a consumer can light a whole parallel cohort
  (context slots, parallel branches) at one cursor.
- `StageNode` `emphasis` (hero / plumbing) styling + size hints.
- `test:coverage` script + v8 coverage reporting + README coverage badge.

### Changed

- `dist` migration: per-component output replaced by tsup-bundled
  `index` / `flowchart` / `copyForLLM` + chunks.

## [0.20.0]

Consumer-controlled rendering extension points on `<TraceFlow>` and
`<TracedFlow>`. Additive only — no breaking changes.

### Added

- **`nodeTypes?: NodeTypes` prop** on `<TraceFlow>` and `<TracedFlow>`
  — consumer-supplied xyflow node types, merged with the built-in
  `{ stageNode: StageNode }` registry. Consumer keys OVERRIDE the
  default. Pass `{ stageNode: MyNode }` to replace the default stage
  renderer entirely, or add new keys for nodes you push into the
  graph with a custom `type` field (e.g.,
  `nodeTypes={{ stageNode: StageNode, myKind: MyNode }}` and push
  nodes with `type: 'myKind'`).
- **`edgeTypes?: EdgeTypes` prop** — pass-through to xyflow with no
  built-in defaults. Register custom edge components for edges you
  push with `type: 'myEdge'`.
- **`children?: React.ReactNode` slot** rendered INSIDE `<ReactFlow>`,
  after the built-in `<Background>`. Use this to mount accessory
  components like `<Controls />`, `<MiniMap />`, or custom legends.
- Documented escape-hatch contract on `TraceNodeData` and `TraceEdgeData`
  (both already structurally extend `Record<string, unknown>`).
  Consumers can attach arbitrary fields without TypeScript friction;
  the default `StageNode` renderer ignores fields it doesn't recognize,
  so adding consumer fields is non-breaking even with the default
  renderer.

### Changed

- `toStageNode` / `toStageNodeWithOverlay` now respect consumer-supplied
  `node.type`. If a node has a `type` OTHER than the recorder's
  default `"stage"`, it passes through unchanged with its data
  intact. Previously every node was force-typed to `"stageNode"`,
  which meant consumer registrations in `nodeTypes` never routed.
  The runtime overlay (done / active / error decoration) is
  intentionally NOT applied to consumer custom nodes — the
  consumer's component owns its visual state.

### Consumer use cases unblocked

- `agentfootprint-lens` can now consume `<TraceFlow>` instead of
  maintaining its own `<ReactFlow>` wrapper — pass dagre-laid-out
  nodes via `layout="passthrough"`, register the agent renderers via
  `nodeTypes={{ lensStage, lensUser }}`, add `<Controls />` via the
  children slot.
- Custom node payload extensions (badges, retry counts, model names,
  domain semantic labels) now flow end-to-end through the recorder
  pipeline without TS fighting consumers.

### Tests

- 338 / 338 passing. Build clean (tsup CJS + ESM + types).

## [0.19.0]

Tracks footprintjs v6.0.0 + a substantial UI/tracing rewrite that
landed across recent sessions.

### Added

- **L8 trace stack** — `createTraceBundle`, `NodeView`, `CommitFlow`,
  `ChainTree`, `RunSlider`, `TraceExplorerShell`. New composable
  primitives for time-travel debugging that wrap footprintjs's
  per-stage events into a UI-ready translator + view layer.
- **`<TracedFlow>`** — react-flow visualizer with runtime overlay,
  live highlighting as the executor scrubs through stages, and
  drill-into-subflow with breadcrumbs.
- **Subflow drill-down series** — auto-refit on chart swap, mount-
  status aggregation, sidebar nav reset, three-tier overlay
  (linear / decider / fork / selector / subflow-mount all visited
  via the unified onStageExecuted in footprintjs v6).
- **`walkSubflowSpecInto`** internal helper (mirrors footprintjs's
  `walkSubflowSpec` shape; local to preserve the no-`footprintjs`-dep
  boundary). 9 unit tests for mirror-drift guard.
- `'emit'` added to `NarrativeEntry.type` union for parity with
  footprintjs v6's emit channel.

### Removed

- **`tagSubflowMembers.ts`** (~123 LOC) — connected-component
  workaround obsolete now that footprintjs v6's mount event carries
  `subflowSpec` + `subflowPath`. The recorder walks the spec inline
  via `walkSubflowSpecInto`.
- **Duplicate `onDecision` / `onFork` / `onSelected` handlers** in
  `createTraceRuntimeOverlay.ts` (~38 LOC). footprintjs v6 fires
  `onStageExecuted` uniformly for every stage kind — a single
  handler suffices. Latent NodeView visited-state bug also fixed
  as a side effect.
- Legacy `FlowchartView.tsx`, `TracedFlowchartView.tsx`,
  `specToReactFlow.ts` (replaced by the L8 stack).

### Changed

- `MinimalFlowRecorder` mirror trimmed to just the events we
  consume now (`onStageExecuted`, `onError`, `onRunStart`, `onRunEnd`).
- `RuntimeStageExecutedEvent` mirror gained the `stageType`
  discriminator field for parity with footprintjs v6.
- `SubflowMountedEvent` mirror gained optional `subflowSpec` +
  `subflowPath` fields. Typed as `unknown` for the spec to preserve
  the loose-coupling boundary.

### Dependencies

- Bump @xyflow/react ^12.10.1 → ^12.10.2
- Bump react ^19.2.0 → ^19.2.5
- Bump react-dom ^19.2.0 → ^19.2.5

## [0.18.1] - 2026-04-20

### Fixed
- **`FootprintTheme` wrapper div uses `display: contents`** so its
  box is invisible to the host's layout. Previously the wrapper
  participated in flex/grid layout as a block-level div that auto-
  sized to its content — which silently collapsed descendants that
  relied on `flex: 1` / `height: 100%` to fill the theme root. The
  bug manifested as "tabpanel / card / scroller height = 0" inside
  themed trees; host apps had to add workaround CSS like
  `.tab-content > .fp-theme-root { flex: 1; display: flex; }` to
  cope. With `display: contents`, CSS custom property inheritance
  still flows (vars cascade via the DOM, not the render tree) while
  the layout box is removed. Consumers no longer need workaround
  CSS. One caveat: `display: contents` elements are removed from
  the accessibility tree in Safari <15.4 — the wrapper is purely
  presentational so this is acceptable.

## [0.18.0] - 2026-04-19

### Added
- **`<NarrativePanel>` "Copy for LLM" now exports the full debug
  bundle** when optional `runtimeSnapshot` + `spec` props are provided.
  The copied Markdown now includes: rendered narrative, **Final Shared
  State**, **Commit Log** (per-stage writes keyed by `runtimeStageId`),
  **Recorder Snapshots** (metrics, tokens, instructions, emit events),
  **Subflow Results**, and the flowchart **Spec** (topology).
  Previously only the rendered text was copied, which told the story
  but not the payloads. Paste into Claude and ask "why did iter N
  fail?" — the model now has everything it needs.
- `ExplainableShell` forwards `runtimeSnapshot` + `spec` through to
  the Narrative tab's RightPanel → NarrativePanel so the enhanced
  copy bundle works in the standard zero-boilerplate setup.
- Safe JSON serialization helper (`safeJsonStringify`) in NarrativePanel
  handles circular references + caps output at 500KB so clipboard
  pastes stay responsive on very long runs.

### Fixed
- **GanttTimeline showed 0ms durations for every stage.**
  `extractStageTimings` in `adapters/fromRuntimeSnapshot.ts` still
  read the legacy `MetricRecorder.data.stages[stageName].totalDuration`
  shape, but MetricRecorder now emits
  `data.steps[runtimeStageId] = {stageName, duration, ...}`
  per-execution. Adapter now iterates `data.steps`, extracts
  `{stageName, duration}` per entry, and sums durations by
  `stageName` so looped stages (e.g. CallLLM × N iters) show
  cumulative wall time. Legacy `data.stages` shape still accepted
  for back-compat with older snapshots.

## [0.17.0] - 2026-04-18

### Added
- **`<TraceViewer>`** — drop-in component that renders an `agentfootprint.exportTrace()` JSON as a fully interactive Behind-the-Scenes view. Accepts a parsed `AgentfootprintTrace` object or a raw JSON string; validates `schemaVersion === 1`; surfaces parse / validation errors via an optional `onError` callback. Internally a thin shell over `toVisualizationSnapshots` + `<ExplainableShell />` — same composition consumers would write by hand. Drop into any React app to give users a "paste a trace, debug visually" workflow without re-executing the agent.
  ```tsx
  import { TraceViewer } from 'footprint-explainable-ui';

  <TraceViewer trace={pastedJsonString} fallback={<div>Paste a trace</div>} />
  ```
- **`AgentfootprintTrace` + `TraceParseError` types** exported from the main entry. Pin consumers to `schemaVersion: 1`; future shape changes ship as new schema versions with multi-version dispatch.
- **11 new tests** (5 patterns) covering parse + validation surface, JSDOM `ResizeObserver` polyfill added to `test/setup.ts`.

## [0.16.0] - 2026-04-16

### Added
- **RightPanel with two modes** — Insights and What Happened. Memoized toggle between high-level analytics (recorder views, quality scores) and event-level detail (narrative entries, raw log). Replaces the single-view right column with a mode-switched layout in `ExplainableShell`.
- **Data Trace discoverability** — the panel now teaches its own capability. Empty state explains *"Backward causal chain — trace any value back to the stage that created it."* When frames exist, the header gains an italic subtitle *"Every value here was derived from the stages below."* — surfacing the differentiator at the moment of first encounter.

## [0.12.1] - 2026-03-20

### Added
- **90 unit tests** — Comprehensive test coverage for narrative sync (position-based), heading numbering (Stage/Selector/Subflow N.M), entry filtering, and loop edge creation in specToReactFlow.

### Fixed
- **Stage 4 after Subflow 3.x** — Root counter increments for subflow step so subsequent stages number correctly.

## [0.12.0] - 2026-03-20

### Added
- **Narrative headings** — Type-specific headings: `Stage N`, `Selector N`, `Decider N`, `Subflow N.M`. Stage numbering accounts for selectors and subflows (Stage 1 → Selector 2 → Subflow 3.1/3.2 → Stage 4).
- **Position-based narrative sync** — Replaces set-based stageId matching with sequential position mapping. Correctly handles loops (same stageId at different iterations) and parallel subflows.
- **Subflow filtering** — Main narrative hides subflow-internal entries (stages, steps inside subflows). Shows Entering markers, hides Exiting markers. Internal stages appear in drill-down view only.

### Fixed
- **Flowchart renders for all specs** — No longer requires subflows. SubflowTree sidebar only shows when spec has subflow nodes.
- **Loop back-edge rendering** — Fixed edge target to use stageId instead of name. Dotted loop arrow now appears in the flowchart.
- **Stage 4 numbering after subflows** — Root counter increments for subflow step so subsequent stages number correctly.

## [0.11.5] - 2026-03-20

### Changed
- **Narrative hides subflow internals** — StoryNarrative filters out subflow-internal entries (stages, steps, conditions inside subflows) and Entering/Exiting markers. The main narrative shows only root-level entries + [Selected]/[Parallel] markers. Internal stages appear in the drill-down view. Future count accurately reflects visible entries only.

## [0.11.4] - 2026-03-20

### Added
- **Subflow group headers in narrative** — StoryNarrative shows subflow ID headers when `subflowId` changes between entries. Subflow entries are grouped consecutively and indented for readability in parallel execution flows.

## [0.11.3] - 2026-03-20

### Fixed
- **Narrative sync with stageId + subflowId** — StoryNarrative now matches entries using `stageId`, `subflowId`, and `stageName` against the revealed snapshot set. Entries without identifiers belong to the previous revealed section. Works correctly with selectors, forks, parallel branches, and subflows.
- **NarrativeEntry type includes `stageId` and `subflowId`** — Matches footprintjs v0.17.2 `CombinedNarrativeEntry` shape.

## [0.11.2] - 2026-03-20

### Fixed
- **Narrative sync uses `stageId`** — StoryNarrative now matches entries by `stageId` (stable build-time identifier from footprintjs) instead of fragile boundary counting. Falls back to `stageName` for backward compatibility. Fixes narrative desync with selectors, forks, and parallel branches.

## [0.11.1] - 2026-03-20

### Fixed
- **Flowchart starts at Stage 1** — Reverted `snapshotIdx` initial value to 0 so the flowchart loads at the first stage instead of jumping to the last.

## [0.11.0] - 2026-03-20

### Changed
- **Tabs moved into details panel** — RESULT/MEMORY/NARRATIVE tabs are no longer top-level. They render inside the collapsible DETAILS panel on the right. Topology (flowchart) is always visible when the spec has subflows; otherwise the details panel takes full width.
- **Dynamic tab list** — Result + Memory are always present. Narrative tab appears only when `narrativeEntries` or `narrative` data exists. Custom recorder views append via `recorderViews` prop.
- **Auto-detected recorder tabs** — When `runtimeSnapshot.recorders[]` contains entries (from `FlowRecorder.toSnapshot()`), ExplainableShell auto-generates tabs with a JSON view. Explicit `recorderViews` take precedence on ID conflict.
- **Default tab** — Falls back to first available tab when `defaultTab` doesn't match a valid tab ID.

### Fixed
- **Container resize detection** — `ResizeObserver` on the shell container dispatches `resize` events so ReactFlow refits when parent panels (e.g. code editor) collapse/expand.
- **ReactFlow fitView on mount** — Added a delayed `fitView` call on mount to handle initial layout before container dimensions settle.

## [0.10.1] - 2026-03-19

### Fixed
- **Narrative position preserved on tab switch** — Removed `setSnapshotIdx(999)` from `handleTabChange` that was forcing the narrative to jump to the last stage every time the user switched between RESULT/MEMORY/NARRATIVE tabs.

## [0.7.3] - 2026-03-18

### Fixed
- **TypeScript subpath resolution** — Added `typesVersions` field to package.json so `import ... from 'footprint-explainable-ui/flowchart'` resolves correctly in all TypeScript `moduleResolution` modes (bundler, node16, etc.).

## [0.7.2] - 2026-03-18

### Added
- **`isLazy` visual treatment for lazy subflow nodes** — Nodes with `isLazy: true` in the spec render with dashed borders and a cloud icon when unresolved. After execution, they appear as normal solid-bordered subflow nodes. Supports the graph-of-services pattern from footprintjs v0.15.0.
  - `SpecNode.isLazy` — new optional field flows through `LayoutNode` → `StageNodeData`
  - New icon cases: `lazy`, `service`, `cloud` — cloud outline SVG
  - Dashed border applied to both rectangle and diamond node shapes

## [0.7.1] - 2026-03-17

### Fixed
- **Trace overlay matching** — `stageLabel` now uses `node.id` (stable stage identifier) instead of `node.name` which may carry `[service-name]` display prefixes after multi-service run merging. Fixes flowchart nodes not highlighting during trace playback.
- **Null guards for spec nodes** — Prevents crash when spec tree contains null/undefined nodes in children arrays or `hasSubflowNodes` traversal.

## [0.8.0] - 2026-03-16

### Added
- **Collapsible panel UX (line + pill pattern)** — `HLinePill` (horizontal) and `VLinePill` (vertical) components. Collapsed = thin line with centered pill button. Expanded = full panel with pill handle on closing edge.
- **`panelLabels` prop** — semantic keys `{ topology?, details?, timeline? }` to customize pill labels. Defaults: "Topology" / "Details" / "Timeline". Consumers can override (e.g. "What Ran" / "What Happened" / "How Long").
- **`defaultExpanded` prop** — `{ topology?, details?, timeline? }` controls which panels start open. Default: `{ details: true }` (flowchart + memory — the library's unique value).
- **`title` prop** — sets breadcrumb root label (default: "Flowchart").
- **`PanelLabels` and `DefaultExpanded` types exported** from package index.
- **`FitViewOnResize`** — ReactFlow auto-calls `fitView()` when container resizes (panel expand/collapse).
- **Mobile responsive layout** — `ResizeObserver` detects `<640px`, switches to stacked vertical layout with all panels auto-collapsed. Flowchart gets fixed 350px height, content scrolls.

### Changed
- **3-panel desktop layout** — SubflowTree (left, VLinePill handle) | Flowchart (center) | Memory/Narrative (right, VLinePill handle). Both side panels independently collapsible.
- **`DrillDownEntry.parentSnapshotIdx`** — restores slider position when navigating back via breadcrumb.
- **Tab bar hidden** when only 1 tab. AI-Compatible removed from default tabs.
- **VLinePill `side` prop** — `"left"` or `"right"` for correct arrow direction per panel edge.

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
