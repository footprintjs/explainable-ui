# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

One bug, reported as "clicking a subflow in the Topology panel doesn't show the
subflow's chart". Two causes, both about IDENTITY: the drill was keyed by a name
that isn't unique, and it was stored in two places that were never wired
together.

### Fixed

- **Every way into a subflow now drills the same way.** `<ExplainableShell>`
  owns ONE drill state and hands it to the chart as `currentSubflowId`. Before,
  `<TracedFlow>` kept a second, private drill state: a click in the Topology
  tree moved the breadcrumb, the story and the timeline while the chart went on
  showing the level above. The tree also drilled by a subflow's LABEL — two
  mounts of the same child chart read the same, so it could land on the wrong
  one — and it could only ever drill one level. It now drills by mount id,
  through the ancestors, so a nested subflow is one click away from the root.
- **A subflow mounted twice drills into the mount you clicked.** The drill was
  keyed by `data.subflowId` — the child chart's own LOCAL id, which repeats
  across mounts. Drilling the nested `Pipeline › Prepare` showed the top-level
  `Prepare`'s stages, and with no top-level twin to borrow from it showed an
  empty chart. Drills are keyed by the mount NODE id now (unique), and
  `filterGraphForDrill` resolves it to whichever `subflowOf` spelling the graph
  in hand uses. Mount status lighting (`aggregateMountStatus`) was matching
  members the same wrong way and is fixed with it.
- **The chart breadcrumb names the whole path.** `Chart › Pipeline › Prepare`
  instead of `Chart › Prepare`, and clicking an ancestor steps back one level
  rather than all the way out. The shell follows the chart's breadcrumb now,
  including back to the top.
- **You can drill more than one level deep into the DATA.** The drilled level's
  snapshots carried no `subflowResult` for the subflows mounted inside them, so
  a second drill silently did nothing. `subflowResultToSnapshots` takes the
  run's `subflowResults` map as a third argument and threads it down.
- **The drilled Story shows the level you are on.** It hid every entry that
  belongs to a subflow — which, in a drilled view, is all of them.
  `<StoryNarrative scopeSubflowId>` (forwarded by `<NarrativePanel>`) names the
  level being viewed: its own stages show, the subflows nested inside it stay
  behind their mounts.

### Added

- **`<TracedFlow currentSubflowId>`** — an optional CONTROLLED drill scope, to
  pair with `onSubflowChange`. A host that also drills from elsewhere (a tree, a
  breadcrumb, a deep-link) owns the value and the chart renders it. Omit it and
  the chart keeps drilling on its own, exactly as before.
- **`renderFlowchart` receives `currentSubflowId` + `onSubflowChange`** — a
  custom chart can follow the shell's drill and move it.
- **`SubflowTreeEntry.nodeId`**, passed as the third argument to
  `onNodeSelect(name, isSubflow, nodeId)` — the unambiguous drill key.
- **`demo/generate-subflow-run.ts`** — a real footprintjs run that mounts the
  same child chart at two depths, rendered by the shell in the demo. The demo
  had no shell chart with subflows at all, which is why this shipped.

## [0.31.0] - 2026-07-28

Fixes found while a live demo drove this library from frozen recordings instead
of a live executor, then an audit of why hooking up the DATA and the THEME never
worked on the first try. The theme through-line: every default here is dark, and
one word now fixes that on every component. The data through-line: **a recording
is three things — `snapshot`, `structure`, `events` — and only `structure` can
draw the chart.** Nothing invents a missing piece; every surface that cannot be
drawn now names the ingredient it wanted.

### Added

- **`graphFromStructure(buildTimeStructure)`** — the chart, rebuilt from a saved
  `chart.buildTimeStructure`. The post-hoc twin of
  `createTraceStructureRecorder`: same node ids, same edges, same order, so
  either overlay lights the right boxes. Until now the ONLY spec→graph adapter
  in the ecosystem was lens's `structureGraphFromSpec`, which imports
  `agentfootprint` — a plain footprintjs consumer had to install an agent
  framework to draw a saved pipeline run. Exported from both entry points.
  Verified against the real engine: for linear, decider, selector-convergence,
  subflow and loop charts the rebuilt graph is deep-equal to the one the live
  recorder collected, except for a decider's `defaultBranch` — the one field
  footprintjs does not serialize, so it is omitted rather than guessed.
- **The one-word theme switch on the components you mount alone** —
  `theme="light" | "dark"` on `<TraceViewer>`, `<SnapshotPanel>`,
  `<GanttTimeline>` and `<TracedFlow>`, matching
  `<ExplainableShell traceTheme={{ mode }}>`. It stamps a full preset as
  `--fp-*` variables on that component's own root. Omitting it renders exactly
  as before.
- **`examples/replay-a-recording/`** — a runnable example that records a real
  footprintjs run (`npm run example:record`) and renders it from disk
  (`npm run example:replay`). Its source imports the library BY NAME, so it is
  copy-pasteable, and `test/integration/replayExample.test.tsx` mounts it
  against the committed recording so it cannot drift.

- **`overlayFromSnapshot(snapshot)`** — rebuilds the chart's time-travel
  overlay from a recorded `getSnapshot()`, so replaying a recording colours
  the flowchart exactly like the live run did. Until now the only source of a
  `RuntimeOverlay` was a live `createTraceRuntimeOverlay` attach, which left
  every replayed chart grey. It derives from `snapshot.commitLog` (dedupe by
  `runtimeStageId`, keep first — bundles arrive in execution order), and is
  honest about what a commit log does not carry: `timestampMs` is 0 (a
  display-only field nothing reads), `errors` is empty, `running` is false,
  and subflow internals are absent where the engine isolated their commits.
  Exported from both entry points; verified against the golden fixtures —
  on flat runs it is byte-equal to the live recorder's overlay, and on all
  four it lines up with the shell's rail step for step.
- **`narrativeFromSnapshot(snapshot)`** — reads the narrative a recording
  carries in `snapshot.recorders`. `<ExplainableShell>` and
  `toVisualizationSnapshots` now use it automatically when no
  `narrativeEntries` are supplied, so a replayed run tells its real story
  instead of degrading to "X executed. Wrote: y". The `narrativeEntries`
  prop still wins, and the recorder feeding the Story panel is no longer
  ALSO rendered as a raw data tab. Detection is by entry shape, not by
  recorder name.

### Fixed

- **Theme tokens that no preset emitted.** `--fp-accent` (12 read sites),
  `--fp-accent-bg`, `--fp-bg` (the Insight panel body, which fell back to a
  hard-coded `#1a1b26`), `--fp-success`, `--fp-tracing` and
  `--fp-bg-elevated` were read by components but never written by
  `tokensToCSSVars` — so `traceTheme={{ mode: 'light' }}` could not fully
  re-theme the library's own shell. All are now `ThemeTokens` roles carried
  by every preset (the node-state roles too), with `--fp-accent` defaulting
  to `primary` and `--fp-success` emitted alongside `--fp-color-success`.
  Fallback chains are untouched, so unthemed consumers render identically.
  A new grep-driven test fails when a component reads a token no preset
  emits.
- **`<GanttTimeline>` on a run nothing timed.** A snapshot recorded without
  a metrics recorder has all-zero durations; the chart drew every bar at the
  invisible 1% minimum against a fabricated 1ms axis and printed "0ms" on
  every row — it read as broken rather than unmeasured. With all durations
  zero it now renders equal-width sequence bars (order is real, duration is
  not), shows "—" per row, and replaces the axis with one plain note. Any
  non-zero duration keeps today's rendering byte-identical. Durations are
  never invented.
- **`createTraceStructureRecorder` dropped out-of-order subflow mounts.**
  `onSubflowMounted` arriving before its mount node's `onStageAdded` used to
  warn and discard the metadata, silently downgrading a subflow to a plain
  stage (no drill target, no subflow styling). The patch is now buffered and
  applied when the node arrives, and the subflow's inner structure — which
  never needed the mount node — materializes immediately. `reset()` clears
  the buffer.
- **`<ExplainableShell>` drew a grey chart when it had everything it needed.**
  `runtimeSnapshot` + `traceGraph` with no `runtimeOverlay` painted every node
  in its base colour — the run's execution order was sitting in the snapshot's
  own commit log the whole time. The overlay is now DERIVED when the prop is
  absent, so the failure is impossible rather than documented. An explicit
  overlay still wins; for a deliberately uncoloured chart pass an empty one.
- **A missing `traceGraph` is now stated, not hidden.** Handed run data with no
  graph, the shell omitted the entire chart region in silence — no note, no
  console line, which reads as "this library doesn't draw charts". It now warns
  once in dev and shows one note where the chart would be, naming both ways to
  get a graph (live `createTraceStructureRecorder`, or `graphFromStructure` on
  a saved structure).
- **`<ExplainableShell>` with nothing to show renders a diagnosis.** Zero stages
  used to render the full three-panel chrome with empty rows. There are three
  different problems there and it now names which: nothing was passed, the
  snapshot could not be read (with the reason), or the run has no stages.
  A snapshot with no `executionTree` is now an empty run rather than a crash.
- **`<TraceViewer>` named a producer that does not exist, dropped the chart, and
  failed to nothing.** It cited `agentfootprint.exportTrace()` five times (no
  such API), accepted a `spec` prop and ignored it, never passed `traceGraph` or
  `runtimeOverlay` to the shell — so a valid trace rendered ZERO chart nodes —
  and rendered `fallback ?? null` when the adapter threw or yielded no rows. It
  now takes a `Recording` (`{ snapshot, structure, events }` — the same shape
  `agentfootprint-lens`' `observeRecording` reads, so one saved file drives both
  viewers), derives the graph and the overlay itself, and reports every failure
  through `onError` with a typed reason, including the two that used to be
  silent: `unreadable-snapshot` and `no-stages`.
- **The Gantt reported a loop's passes as one summed number.** Per-stage
  timings were keyed by stage NAME and summed across executions, so a
  3-iteration loop at 10ms per pass showed 30ms on all three rows — three fast
  passes rendered as three slow ones. They are now keyed by `runtimeStageId`,
  which is what the recorder's own data was keyed by all along. The legacy
  per-name aggregate shape still reads as before.
- **A renamed timing recorder silently killed every duration.** Detection was
  `rec.name === 'Metrics'`; a rename or a custom timing recorder dropped all
  durations and pushed the Gantt into its "no timing recorded" path while the
  data sat in the snapshot. Detection is now by SHAPE — any recorder publishing
  per-step `duration` feeds the timeline — the same rule the narrative reader
  already used.
- **`useDarkModeTokens` crashed on the server and never matched `.dark`.** It
  read `document` inside a `useState` initializer (a hard crash in Next.js), and
  its `selector` option was documented as a CSS selector but used as a class
  name via `classList.contains`, so `.dark` and `[data-theme=dark]` silently
  never matched. It is now server-safe (light on the server, corrected on
  mount), the option is `darkClass` (the old `selector` still reads), and BOTH
  spellings work — bare class name or any CSS selector.
- **The three diff badges were the last unthemeable colours.** `ADD` / `UPD` /
  `DEL` in `<StageDetailPanel>` were hard-coded green/amber/red in a panel a
  light theme otherwise re-themes completely. They now paint from
  `theme.success` / `warning` / `error`, with the washes mixed from the same
  role. Same for the commit-chain selection wash and the trace card's fork
  marker; the four ingredient-chip hues became `--fp-chip-1..4`.
- **The insights empty state named no recorder.** "Attach recorders to see data"
  is true and useless. It now lists the four ingredients with the call and the
  import that produces each: `narrative()` → Story, `metrics()` → Performance,
  `QualityRecorder` → Quality, agentfootprint's `costRecorder()` → Cost.
- **A commit bundle without `trace` no longer white-screens the shell.** The
  Data Trace walk assumed every bundle carries one; a hand-assembled or older
  recording crashed the whole panel. A bundle with no trace wrote nothing
  traceable, which is what it now reports.

### Changed

- **`<TraceViewer>`'s API.** `trace` → `recording` (the old prop name still
  reads), `AgentfootprintTrace` → `Recording`, and `TraceParseError` gains
  `missing-snapshot`, `unreadable-snapshot` and `no-stages` while losing
  `missing-version` — `schemaVersion` is now optional and only refused when it
  is present and not 1. The producer the old shape was validating for never
  existed.

### Documentation

- **The README's ExplainableShell props table matched neither the props nor
  reality.** `snapshots` was marked required (it is optional), `runtimeSnapshot`
  — the entire replay entry point — was absent, as were `traceTheme`,
  `recorderViews`, `hideTabs`, `defaultTab`, `hideConsole` and `showStageId`,
  and it still listed a `narrative: string[]` row for a prop that was removed.
  Rewritten from the source.
- **Theming leads with the reason.** The section now opens with "every default
  in this library is dark" and gives three fixes smallest-first — the one-word
  `theme` prop, `useDarkModeTokens` (documented for the first time, including
  the SSR behaviour and both switch spellings), then raw `--fp-*`.
- **Quick Start captures the chart.** Step 1 now attaches
  `createTraceStructureRecorder` at BUILD time, because that is the ingredient
  no snapshot carries, and step 3 spells out the three fields of a recording.
  The Flowchart section documented two exports that do not exist
  (`TracedFlowchartView`, `specToReactFlow`) — replaced with `TracedFlow` and a
  table of where a graph comes from.

## [0.30.0] - 2026-07-03

### Added

- **Trace ANY variable** — the Data Trace tab gains a second entry block: a
  search over every key the run ever wrote (max 12 shown, type to filter).
  A key not yet written at the cursor gets the honest "not written yet"
  card; never-written gets its card — no special cases.
- **The fork chooser** — at a stop made from 2+ followable ingredients the
  walk-back control becomes "⑂ choose cause…" and PROMPTS: follow one
  ingredient (chips) or "visit all, oldest cause last (time order)" — the
  classic behavior. The chooser closes on any cursor move; run-input
  termini don't count as a choice (nothing to follow); at the walk's
  earliest stop the time-order option is honestly disabled.
- **`--fp-tracing`** — one theme token (default #0d9488 teal) recolors ALL
  tracing chrome (badge, rail border, stops, walk buttons, chooser) so the
  tracing rail is unmistakably not normal time-travel. Normal mode never
  reads it. `TracingRail` gains `forkCount`/`onForkPrompt`; `TraceWalkCard`
  gains `forkChooserOpen`/`onContinueTimeOrder`/`canContinueTimeOrder`.
- Built by an implementer agent against a locked spec, adversarially
  reviewed (ship verdict; all should-fixes applied), browser-verified —
  demo/fork-chooser-verified.png.

## [0.29.0] - 2026-07-02

### Added

- **Same-Rail Rewind — steerable backtracking on the existing time slider.**
  In the Inspector's Data Trace tab, "Trace a value" chips start a tracing
  session: the rail's slice members become landable STOPS (everything else
  fades to unlandable ticks), the buttons become "◀ earlier cause / toward
  result ▶", and the ONE cursor walks the value's causes newest-first.
  Licensed by the data model: every dependency commits strictly earlier than
  the value it feeds, so the backward slice is a sub-sequence of the
  timeline — reverse commit order is a valid topological order, and one
  monotone button visits BOTH parents of a fork with no branch-choosing UI.
  - `buildTraceWalk` / `formatTraceWalk`
    (`ExplainableShell/_internal/traceWalk.ts`): variable-anchored backward
    slice with per-stop ingredients, loop pass numbers, run-input termini,
    truncation + reads-honesty flags, and TWO truthful absence sentences
    ('never-written' vs 'not-yet-written' — a cutoff artifact is not
    "never"). Following an ingredient IS re-anchoring (same function,
    `beforeCommitIdx`) — no traversal modes.
  - `<TimeTravelControls tracing>`: the tracing rail (mode header, stop
    ticks, direction-honest buttons, Escape/Done exit — cursor stays put).
  - `<TraceWalkCard>`: the "WHY THIS VALUE" stop card — headline with value
    preview, junction-local colored ingredient chips (forks show ⑂),
    itinerary, honesty footer, and **[Copy story]** emitting
    `formatTraceWalk`'s exact string (the LLM-parity artifact).
  - `ExplainableShell` orchestrates: entry jumps the cursor to the anchor
    (the one visible jump), the chart's dependency cone follows the walk
    (a via-filter narrows it), drilling into a subflow exits tracing
    (root-rail-only, honestly). `InspectorPanel` gains a controlled `tab`
    prop + `traceContent` slot.
  - Browser-verified live (demo/tracing-verified.png).

## [0.28.0] - 2026-07-02

### Added

- **The dependency CONE — the backward slice painted on the chart.**
  `TracedFlow` gains `sliceCone?: ReadonlyMap<string, number>` (chart node id
  → BFS depth): members re-light with a transition-delay staggered by depth —
  causality visibly walks BACKWARDS across the chart — while everything
  outside the cone (and its edges) dims. `ExplainableShell` wires it
  automatically: open Inspector → Data Trace and the chart shows exactly the
  frames the tab lists (one slice, three consumers — tab, honesty note, cone
  — they cannot disagree). Leaves the scrub overlay's visited/current story
  untouched: the cone paints only while the Data Trace tab is open.
  Verified live via Playwright on the demo (the chronological-neighbor stage
  correctly dims at opacity 0.22 while the causal chain stays lit, staggered
  0/90/180ms by depth).
- **Demo: a real generated run** (`demo/generate-run.ts` → `sample-run.json`,
  never hand-authored) rendering the full `ExplainableShell` — fan-in shaped
  so the cone is demonstrably different from "the steps before it".
- `renderFlowchart` custom renderers receive an optional `sliceCone` arg
  (ignore it and nothing changes).

## [0.27.0] - 2026-07-02

### Fixed

- **The Data Trace tab now shows the REAL backward slice.** The previous
  implementation walked the commit log linearly backwards (`idx--`) and
  labeled each hop with the commit's own first written path — chronology
  dressed as causality; on any fan-in it blamed the wrong stage (its own
  header comment claimed `causalChain()` was used — it wasn't). Replaced with
  a true read→write BFS mirroring footprintjs' `causalChain` thin-slice walk
  (`ExplainableShell/_internal/dataTrace.ts`), fed by the snapshot's
  `executionTree` reads + `commitLog` writes. eui stays footprintjs-import-free
  (the mirror consumes stable snapshot shapes only; stage-level attribution —
  the safe ceiling).

### Added

- **Honesty note on `DataTracePanel`** (optional `note` prop, plumbed through
  `InspectorPanel`): when the snapshot carries no read tracking
  (`readTracking: 'off'`), the tab says "⚠ reads were not recorded —
  dependencies are unknowable, not absent" instead of rendering a single
  frame that reads as independence.

## [0.26.2] - 2026-06-30

### Fixed

- **Custom node renderers + subflow breadcrumb now follow dark/light.**
  `SlotPillNode` (context slots), `GroupContainerNode` (subflow boxes), and
  `SubflowBreadcrumbBar` read their colours from eui's raw dark defaults
  (`rawDefaults.colors`) plus hardcoded `rgba()` fills — so they ignored the
  `--fp-*` theme entirely and rendered dark in light mode (a lit slot pill drew
  near-white text on a near-transparent fill → invisible). They now theme through
  the CSS-var tokens (`theme.textPrimary`/`bgSecondary`/`primary`/`nodeVisited`/
  `border`, with `color-mix` tints), so the whole flowchart chrome tracks the
  consumer's dark/light like the built-in `StageNode` already did. No API change.

## [0.26.1] - 2026-07-01

### Added

- **`traceTheme` prop on `<ExplainableShell>`** — the footprintjs-level
  **two-colour** Trace theme: `{ mode?: 'dark' | 'light'; visited?; current? }`.
  `visited` colours executed nodes, `current` the cursor node; `mode` picks the
  neutral base (unvisited / edges), and the flowchart background is transparent
  so it inherits your container (dark/light "just works"). Maps internally to
  `TracedFlow`'s `done`/`active`/`default`, keeping the Trace's plain 2-colour
  scheme distinct from the agent-semantic 3-colour theme on `<Lens>`. New
  `TraceTheme` type exported.

## [0.26.0] - 2026-06-30

### Changed (BREAKING)

- **Removed the `spec` prop from `<ExplainableShell>`.** The chart renders from
  `traceGraph` + `runtimeOverlay` (both eui-owned types), and subflow drill-down
  resolves from the recorded `subflowResult`. `spec` was no longer load-bearing
  for rendering and was the source of a silent-blank footgun: passing a
  footprintjs `FlowChart` into `spec: SpecNode` typechecked (because `SpecNode`
  is all-optional) but blanked the drilled chart. The legacy spec-walk drill
  resolution (`resolveSubflowLevel` + the `findSubflowSpecNode` / `hasSubflowNodes`
  helpers) is gone.
  - **Migration:** drop `spec={...}`; pass `traceGraph={...} runtimeOverlay={...}`
    (already required for chart rendering). Consumers driving the shell from an
    agentfootprint `Runner` can get the whole typed prop bundle in ONE call:
    `import { explainableShellPropsFromRunner } from 'agentfootprint-lens'` →
    `<ExplainableShell {...explainableShellPropsFromRunner(agent, recorder)} />`.

### Fixed

- **Blank subflow chart on drill-down.** Drilling a subflow via the recorder
  path used to hide the flowchart entirely (the chart was gated on `activeSpec`,
  which a recorder-path drill leaves null) while the slider / story / breadcrumb
  still rescoped. The chart now renders whenever a `traceGraph` is present, so
  drilling shows the subflow's own stages.

## [0.25.5] - 2026-06-24

### Fixed

- **Cursor node text contrast** — the active (cursor) node fills with the amber
  `nodeCursor`, on which white text washes out (the "current step unreadable"
  regression). Active nodes now use dark text; done/error keep white.
- **Main nodes stay their own colour after running** — `done` (green) was
  checked before `hero`, so a visited lead node collapsed to green and the
  indigo `nodeMain` never showed during a completed run (the chart read as
  green + one amber, not three colours). A MAIN/hero node now keeps `nodeMain`
  (indigo) even when visited: cursor (amber) > main (indigo) > visited (green) >
  error > resting.

## [0.25.4] - 2026-06-24

### Added

- **Semantic node-state color roles** — three first-class, themeable tokens a
  runtime overlay maps onto, so the three states read as three distinct things
  instead of all leaning on the generic `primary` accent:
  - `nodeCursor` (`--fp-node-cursor`, default amber `#f59e0b`) — the current /
    scrubbed-to step.
  - `nodeVisited` (`--fp-node-visited`, default green `#22c55e`) — executed up
    to the cursor.
  - `nodeMain` (`--fp-node-main`, default indigo `#6366f1`) — a group's lead
    ("hero") node.
  `StageNode` now colors active → cursor, done → visited, hero → main. Available
  on the `ThemeTokens` API and as CSS vars; override per light/dark for theming.

## [0.25.3] - 2026-06-24

### Fixed

- **Even fan + straight spines through irregular real charts** — two general
  layout passes (both read only graph structure + measured widths; no
  per-chart logic):
  - **Even-fan**: a diamond fork's children are re-spaced to equal center-gaps,
    symmetric around the axis, so the comb reads evenly even when the children
    differ in width (dagre's edge-based packing otherwise hands the wider child
    more room → a lopsided fan). Restricted to true diamonds (children
    reconverge at a common merge) so a divergent fork whose child owns its own
    subtree is never disturbed.
  - **Terminal-fork conform**: a divergent fork on a straight trunk (a decision
    whose branches don't reconverge — e.g. a ReAct `Route` → tool-call/final)
    was left at its branches' span-midpoint, which the spine above need not
    share → the edge into it jogged (~10px on the agent chart). It now aligns
    to its trunk axis and carries its branches along, so the spine stays
    straight and the branches stay centered under it. +4 unit tests.

## [0.25.2] - 2026-06-24

### Fixed

- **Center MERGE nodes too — symmetric diamonds.** `centerForkParents` centered
  the FORK end of a diamond but left the MERGE end at dagre's barycenter. When
  branches have unequal widths (e.g. a wide "System Prompt" slot beside a narrow
  "Tools"), the span-midpoint ≠ barycenter, so the merge — and the whole spine
  below it — drifted off the fork's axis (~49px in the agent chart). A MERGE
  (in-degree ≥ 2, out-degree ≤ 1) is now centered on its parents' span-midpoint,
  mirroring fork centering, and propagates that center DOWN its linear successor
  trunk. Both ends of a diamond now share one vertical axis. Fork-merge nodes
  (in ≥ 2 AND out ≥ 2) stay at the barycenter (ambiguous). +4 unit tests.

### Added

- **Dev guardrail against the raw-layout footgun.** `<TracedFlow>` now dev-warns
  when handed the bare exported `dagreTraceLayout` as its `layout` prop — that
  opts OUT of the measure-then-layout pipeline (content-exact sizing +
  fork/merge centering + straight spines), which is exactly how a consumer can
  silently render stale while pinned to a current eui. Omit `layout` for the
  pipeline. Dev-only (no production cost). +2 component tests.
- **Full-pipeline integration smoke test** (`test/integration/layout-pipeline`)
  — exercises the exact default composition (measure-fed dagre → snap → fork +
  merge centering) and asserts a content-exact symmetric diamond for any
  branch-width skew, so a regression to off-center/estimated output fails CI.

## [0.25.1] - 2026-06-24

### Fixed

- **Measure-then-layout now actually runs — content-exact layout for every chart.**
  The `MeasuredNodeSizes` probe read each node's footprint from `getNodes()`, whose
  nodes report `measured: {0,0}` in `@xyflow/react` v12 — the real measured size lives
  on the internal node in the store's `nodeLookup`. So `onSizes` never fired and the
  whole chart laid out on estimated fallback column widths forever (off-center
  deciders/forks, a jogged decision spine). The probe now reads `.measured` from
  `nodeLookup` via the pure `extractMeasuredFootprints` helper. Decision spine and fork
  fan are provably aligned now (0px) — across the simple charts AND the real 53-node
  agent chart.
- **The probe re-fires on a genuine re-measure, not only on first settle.** `nodeLookup`
  is a Map xyflow mutates in place (stable reference), so subscribing to it by reference
  ran the relayout only once. It now subscribes to the derived, rounded footprint map
  with a `sameFootprints` equality fn, so a later resize (async font/icon load, dynamic
  label) re-runs the layout; rounding gives the measure→stamp→re-measure cycle a fixed
  point.
- **Fork-parent centering no longer drags a merge that sits above a fork.** The trunk
  propagation that keeps the edge into a decider vertical now stops at any merge node
  (in-degree > 1), matching the main centering loop.

### Notes

- Reverted the 0.25.0-era decider fixed-footprint workaround (it treated a symptom of
  the probe bug; deciders use their measured size like every other node). Verified by an
  expert panel against the pinned `@xyflow/react 12.11.1` source. +new unit suites
  (`measuredFootprints`, trunk-propagation + merge-guard cases); full suite 592 passing.
- CI robustness: widened four real-timing performance budgets (30/50ms → 200–300ms) that
  flaked on slower CI runners; a genuine super-linear regression on these sizes would be
  seconds, so the headroom keeps the regression-detection intact.

## [0.25.0] - 2026-06-16

### Fixed

- **Per-iteration subflow drill-down** — `fromRuntimeSnapshot` resolved a node's
  `subflowResult` by `subflowId` (path), so every iteration of a LOOPING subflow rendered
  the LAST iteration's internals (the path key held only the last). It now prefers the
  node's unique `runtimeStageId` (footprintjs ≥ 9.9.0 dual-keys `subflowResults` per
  execution), falling back to `subflowId` for non-looping subflows and older snapshots.
  Each loop iteration now drills into its OWN internals. +2 unit tests.

## [0.24.0] - 2026-06-11

The two real rendering gaps the U2 golden-trace fixtures exposed (documented
as "known real-engine behaviors" under 0.23.0) are now FIXED. The golden
output snapshots changed intentionally — see the regenerated files below.

### Fixed

- **Real deciders/selectors now render as decision nodes.** footprintjs
  fires `onStageAdded` with `type: 'stage'` for decider/selector stages and
  stamps `hasDecider: true` / `hasSelector: true` on the spec instead — so
  `TraceNodeData.isDecider` was FALSE on every real trace (only hand-built
  `type: 'decider'` unit fixtures rendered the diamond). The converter now
  derives `isDecider` from the spec flags in `createTraceStructureRecorder.
  onStageAdded` AND in the subflow-spec walker (`walkSubflowSpecInto`), and
  `onDeciderComplete` additionally marks its node `isDecider` (a sealed
  branch list IS decider-ness) — covering engines that stamp neither flag.
  Hand-built `type: 'decider'` fixtures behave exactly as before.
- **Cumulative-memory view no longer drops sibling fields on deep writes.**
  footprintjs's change-only commit semantics record a deep write
  (`scope.applicant.address.zip = ...`) as a net-change PATCH
  (`{applicant: {address: {zip}}}`), and `StageSnapshot.stageWrites` keeps
  only the last write per key — `toVisualizationSnapshots`' whole-key
  overwrite then erased siblings (`applicant.name`) that the engine's
  `sharedState` correctly holds. The adapter now replays each execution's
  `commitLog` bundles (joined by `runtimeStageId`) with the engine's own
  verb semantics — `set` overwrites with the full value, `merge` deep-merges
  the accumulated delta, `append` concatenates, `delete` removes — so the
  per-stage memory view evolves exactly like engine state. Side effects of
  the higher fidelity (visible in the regenerated goldens): fork-child
  writes appear at their true namespaced location (`runs.<branchId>.<key>`,
  matching `sharedState`) instead of a fabricated top-level key, and a
  subflow mount stage now shows the state its outputMapper committed.
  Snapshots without a usable commitLog (older recordings, subflow
  drill-down histories whose bundles carry empty `runtimeStageId`s) fall
  back to `stageWrites` accumulation, upgraded from whole-key overwrite to
  the new deep merge so cross-stage patches keep siblings too.

### Added

- **`mergeWritePatch(base, patch)`** (exported) — the visualization-side
  deep merge: object-spread per level, patch keys win, base siblings
  survive. **Arrays REPLACE** — a deliberate, documented divergence from
  footprintjs's `deepSmartMerge` union-with-reference-dedup: a memory VIEW
  should show the array a consumer would read at that moment, the dominant
  array-write path (TypedScope copy-on-write push / `$batchArray`) commits
  as a `set` of the full final array anyway, and union-replay of the rare
  merge-verb array delta can fabricate element mixes the display can't
  reconcile. `__writeSummary` / `__readSummary` marker objects (footprintjs
  `writeTracking: 'summary'`) are treated as ATOMIC — passed through, never
  recursed into. Prototype-pollution keys (`__proto__`, `constructor`,
  `prototype`) are skipped on every write path.

### Tests

- Golden semantic invariants extended: real decider/selector nodes carry
  `isDecider: true` + sealed `branchIds`; cumulative memory at the
  deep-write stage retains the sibling field; fork-branch memory mirrors
  the engine's namespaced state. Unit coverage for the spec-flag decider
  derivation (converter + subflow walker) and for `mergeWritePatch` /
  commit-bundle replay (nested patches, trace order, deep delimited paths,
  multi-bundle executions, copy-on-write isolation, markers, fallback).
- **Regenerated golden output snapshots** (fixtures themselves untouched):
  `linear-decider.structure-graph` / `parallel-fork.structure-graph` and
  `linear-decider.node-views` / `parallel-fork.node-views` (the two real
  decision stages flip `isDecider` to `true` — only that field), plus
  `linear-decider.stage-snapshots` (`applicant.name` retained from the
  enrich stage onward), `parallel-fork.stage-snapshots` (branch writes at
  `runs.<branchId>`), `subflow-loop.stage-snapshots` (mount stage shows
  committed `text`/`score`). Layout, overlay, commit-flow, narrative-sync,
  and all pause-resume snapshots are byte-identical.

## [0.23.0] - 2026-06-11

Golden-trace fixtures (backlog U2): the converter/layout/narrative pipeline is
now pinned against REAL footprintjs engine output instead of hand-built mocks.
Test-infrastructure only — no library code changed; published package unchanged.

### Added

- **Golden-trace fixture pipeline.** `scripts/generate-golden-fixtures.mjs`
  records 4 representative charts (linear+decider, subflow+loop, parallel
  fork, pause/resume) through the real engine and serializes the exact
  consumer-facing artifacts (StructureRecorder / FlowRecorder / ScopeRecorder
  event streams in real fire order, post-run snapshot, narrative entries) to
  `test/fixtures/golden/`. Deterministic by construction: charts use no
  wall-clock/random data, engine-volatile fields (`runId`/`pipelineId`,
  timestamps) are normalized, and each chart is generated twice with a
  deep-compare that fails the script on any nondeterminism. A `manifest.json`
  pins the footprintjs version the fixtures were recorded with.
- **Golden tests** (`test/golden/goldenTraces.test.ts`, 34 tests, 28 output
  snapshots) — replay each fixture through `createTraceStructureRecorder`,
  `dagreTraceLayout` (TraceFlow's default layout), `createTraceRuntimeOverlay`,
  `createNodeViewRecorder`, `createCommitFlowRecorder`,
  `toVisualizationSnapshots`, and the `narrativeSync` utilities, then
  snapshot-assert every output. Plus explicit semantic invariants (loop
  executionIndex bumps, subflow path-qualified ids, parallel branch commits,
  pause/resume run boundaries).
- **`npm run fixtures:regen`** — one-command fixture regeneration; output
  snapshots update via `npx vitest run test/golden -u`. Workflow documented in
  the test-file header and README.
- **`footprintjs` exact-pinned devDependency (9.5.0)** — used ONLY by the
  generator. The published library keeps its zero-footprintjs-dependency
  boundary (consumes plain JSON shapes).

### Known real-engine behaviors the goldens pin (pre-existing, not changed here)

- footprintjs fires `onStageAdded` with `type: 'stage'` for decider/selector
  stages (spec carries `hasDecider: true`), so `TraceNodeData.isDecider` is
  `false` on real traces — decider-ness surfaces via `branchIds`/`defaultBranch`
  from `onDeciderComplete`. Hand-built unit fixtures that fabricate
  `type: 'decider'` show `isDecider: true`; real traces do not.
- `toVisualizationSnapshots` builds per-stage cumulative memory by whole-key
  overwrite of `stageWrites`. With footprintjs's change-only commit semantics,
  a deep write (e.g. `scope.applicant.address.zip = ...`) records only the
  change patch, so the stage-memory view replaces the earlier full object and
  drops sibling fields (engine `sharedState` itself is correct).

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
