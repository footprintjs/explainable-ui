# Flow Lens

<sub>npm package: <a href="https://www.npmjs.com/package/footprint-explainable-ui"><code>footprint-explainable-ui</code></a></sub>

**every step: watch the flowchart unfold**

<p>
  <a href="https://www.npmjs.com/package/footprint-explainable-ui"><img src="https://img.shields.io/npm/v/footprint-explainable-ui.svg?style=flat" alt="npm version"></a>
  <!-- coverage-badge --><img src="https://img.shields.io/badge/coverage-66%25-yellow.svg" alt="coverage: 66%"><!-- /coverage-badge -->
  <a href="https://github.com/footprintjs/explainable-ui/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://footprintjs.github.io/footprint-demo/"><img src="https://img.shields.io/badge/Live_Demo-View_App-10b981?style=flat" alt="Live Demo"></a>
  <a href="https://footprintjs.github.io/footprint-playground/"><img src="https://img.shields.io/badge/Playground-Try_it-6366f1?style=flat" alt="Playground"></a>
</p>

**Flow Lens** is the step-by-step view of a causal trace: themeable React components for
visualizing [footprintjs](https://github.com/footprintjs/footPrint) pipeline execution —
time-travel debugging, flowchart overlays, subflow drill-down, and collapsible detail panels.

The details pane has **Developer** and **Commentary** buttons. Developer opens
inspection and backtracking; Commentary shows a scrolling transcript with stage
headings and recorded messages through the selected stage. The flowchart, time controls and
drill scope stay in place. Start on Commentary with `defaultView="story"`.
[See Developer and Commentary details](#developer-and-commentary-details).
Arrange or hide the optional panes with a [JSON layout](#arrange-the-full-lens-from-json).

> Part of the **[footprintjs ecosystem](https://footprintjs.github.io/)** — the self-explaining stack.
>
> One causal trace. Replay it as every step (**Flow Lens**), grouped steps
> ([**Why Lens**](https://github.com/footprintjs/agentfootprint-lens)), or the story
> ([**Story Lens**](https://github.com/footprintjs/agentThinkingUI)).

## Install

```bash
npm install footprint-explainable-ui
```

**Peer dependencies:** `react >= 18`, `react-dom >= 18`

For flowchart components, also install:

```bash
npm install @xyflow/react
```

## Entry Points

| Import path | What it provides |
|---|---|
| `footprint-explainable-ui` | Core components, themes, adapters |
| `footprint-explainable-ui/flowchart` | Flowchart visualization (requires `@xyflow/react`) |

## Which component do I mount?

Several all-in-one components ship here, with an agent viewer one package
over. Take the **first** row your run matches,
and read the last column before you skip one.

| If your run is… | Mount | It gives you | It costs you |
|---|---|---|---|
| an **agentfootprint agent run** you recorded (`recordRun` → `{ snapshot, events, structure }`) | [`footprint-viewer`](https://www.npmjs.com/package/footprint-viewer) — a separate package | The whole experience with zero config: Story, Why, Flow, Skill Graph and Data as five tabs over **one shared cursor**, wired for you — or refused in a sentence that names what you passed | Three more packages (`agentfootprint`, `agentfootprint-lens`, and `agentthinkingui` for the Story tab), and a layout that is the viewer's rather than yours |
| a **footprintjs pipeline run**, live in your app (`executor.getSnapshot()` + a `TraceGraph`) | `ExplainableShell` — this library | Chart + topology tree + details + timeline + the value-tracing rail, from two props. The details pane switches between Developer and Commentary | The separate agent Story / Why / Skill Graph readings. Commentary presents the recorded pipeline; it does not reconstruct agent reasoning |
| a **saved footprintjs run** on disk (`{ snapshot, structure }`) | `TraceViewer` | The same shell from one prop, with parse errors and honest gaps stated on screen instead of an empty frame | Nothing the shell has — it *is* the shell plus the file-reading |
| a footprintjs run whose **full Lens layout must be yours** | `ExplainableShell` with `renderLayout`, optionally `unstyled` | Ready-made surfaces and actions for the same cursor, exact invocation, drill-down and backtracking | You supply the layout and, in unstyled mode, its presentation |
| a saved run needing **basic composable panels** | `ExplainableProvider` + the surfaces (or `ExplainableView` with a `layout`) | Basic surfaces moving one cursor; presets, CSS-grid areas and per-surface `slots` | These surfaces do not re-implement the shell's richer topology, subflow drill-down and tracing chrome |
| a run you want to read as **commits and chains** | `TraceExplorerShell` | The L8 translator stack in one master/detail screen: chain tree, commit inspector, node inspector, cursor slider | It is a parts bin rather than a product surface — you create and attach the translators yourself (`createTraceBundle` does that in one call) |

**Not on the ladder:** `TimeTravelDebugger` is deprecated in 0.38.0 — see
[Deprecated](#deprecated).

### Composing panels by hand costs you the wiring

The panels are exported so you *can* build your own screen — but a pane you
mount yourself only has the props you remember to pass. Two capabilities go
quiet when you forget them, and nothing errors:

- **the cursor** — every surface must read *and* move the same index, or your
  chart and your story drift apart on the second click;
- **tracing** — the value-tracing rail is wiring the shell does between the
  inspector, the rail and the chart. A hand-mounted inspector simply has no
  rail to hand back to.

Use `ExplainableShell.renderLayout` when your screen needs the complete Lens
behavior in a custom layout. Its `useLensWorkbench` context shares the shell's
cursor, invocation and trace actions. For basic composable panels,
`ExplainableProvider` remains available. If you
are replacing a pane in `footprint-viewer`, its slots are
**capability-accounted**: a replacement pane is handed every capability the
shipped pane had, and a pane that never uses one gets a named console line in
dev — silenced only by writing the drop down (`slots: { detail: { component:
MyPane, drops: ['tracing'] } }`). Silence there is a decision, not an accident.

### One controller for custom and standard views

Version 1.1.0 adds `LensControllerProvider` and `useLensController` for
React-headless recording, exact invocation, cursor, playback and Backtrack data
and commands. Put custom controls and a presentation-only `ExplainableShell`
under one provider to share that owner. `LensReplayControls` and `CommentaryPanel`
also bind directly to it; `recordingStatus` lets custom views choose their own
waiting, empty and error presentation. The controller is a React API, not a
framework-independent store.

`replayControls.presentation: "range"` shows a normal visible thumb without
per-stage tick elements; `"segmented"` remains the default. Shell JSON layouts
can supply `replayControls`, with explicit props overriding individual fields.
Both presentations use discrete recorded steps and the same Backtrack stops;
`scale` can use equal steps, recorded duration or `log-duration` geometry,
with disclosed equal-spacing fallback when positive timing is unavailable.
Custom controls share `controller.replayAxis`; duration widths are a stage
sequence, not a reconstruction of parallel wall-clock time. `intervalMs` is
separate reading pace. See the [shared-controller example](examples/headless-controller/README.md)
for genuine parallel 35 and measured-retry recordings, custom evidence previews and optional Shell
remounting without another clock. Custom server/router/switch drawings remain
consumer examples, not a built-in hardware symbol set.

## Quick Start

To explore seven recorded workflows with replay, Developer / Commentary details,
layouts and a Recorded / Built-in / Custom SVG node-icon selector, run the
[local playground](examples/local-playground/README.md). Custom SVG icons are
selected by default. The preview replays bundled recordings using this checkout's
source and requires no workflow services.
Or open the [hosted seven-workflow preview](https://footprintjs.github.io/explainable-ui/local-playground/).
For custom server, router and switch shapes with details fetched on demand, see the
[deployment simulation example](examples/deployment-shapes/README.md).
The [isometric preview](https://footprintjs.github.io/explainable-ui/local-playground/?look=isometric)
opens the same recordings with illustrated depth, Paper styling and Details
beside the chart. Use **Try isometric view** in the preview to switch presentation
without resetting the replay cursor.

### 1. Capture the chart while it is built

The chart is the one thing a run does not leave behind, so collect it at BUILD
time (or save `chart.buildTimeStructure` — see step 3):

```typescript
import { flowChart, FlowChartExecutor } from "footprintjs";
import { createTraceStructureRecorder } from "footprint-explainable-ui/flowchart";

const trace = createTraceStructureRecorder();
const chart = flowChart("seed", seedFn, "seed", { structureRecorders: [trace.recorder] })
  .addFunction("work", workFn, "work")
  .build();

const executor = new FlowChartExecutor(chart);
await executor.run({ input: data });
```

### 2. Render with the all-in-one shell

```tsx
import { ExplainableShell } from "footprint-explainable-ui";

<ExplainableShell
  runtimeSnapshot={executor.getSnapshot()}
  traceGraph={trace.getGraph()}
  title="My Pipeline"
  panelLabels={{ topology: "What Ran", details: "What Happened", timeline: "How Long" }}
/>;
```

Two props. The shell converts the snapshot into rows, reads the story out of the
recorders that rode along inside it, and lights the executed path from the
commit log. Already have `StageSnapshot[]` from `toVisualizationSnapshots()`?
Pass them as `snapshots` instead.

This gives you:
- **Flowchart** (center) — execution path overlay, click subflow nodes to drill-down
- **Topology panel** (left) — subflow tree navigator, collapsible via VLinePill handle
- **Details panel** (right) — Developer and Commentary buttons. Developer keeps
  Insights (the story and recorder views), Inspector (stage activity, state and
  data trace), and Result (output and console lines). Commentary shows the
  accumulated narrative through the selected stage and follows the cursor. Collapsible.
- **Timeline** (bottom) — Gantt-style stage durations, collapsible
- **Time-travel slider** — scrub through execution steps
- **Breadcrumbs** — navigate back from subflow drill-down
- **Mobile responsive** — auto-stacks vertically below 640px

### Arrange the full Lens from JSON

`ExplainableShell.layout` arranges five surfaces over the same run and cursor:

| Area name | Surface | Required in `areas`? |
|---|---|---|
| `timeTravel` | Shared time and stage-selection controls | Yes |
| `flowchart` | Execution chart with the existing drill and trace behavior | Yes |
| `developer` | Developer technical details | No; omit to hide |
| `commentary` | Accumulated scrolling transcript grouped by stage visit | No; omit to hide |
| `timeline` | Recorded execution timeline | No; omit to hide |

The definition is plain JSON-compatible data. Store it separately from the run,
then pass the restored object to `layout`. `columns` and optional `rows` are
CSS grid track strings; optional `minHeight` and `gap` accept numbers or CSS
size strings:

```tsx
import { ExplainableShell, type LensLayoutDefinition } from "footprint-explainable-ui";

const savedLayoutJson = JSON.stringify({
  columns: "minmax(0, 1.6fr) minmax(300px, 1fr)",
  rows: "auto minmax(420px, 1fr) minmax(200px, 0.6fr)",
  areas: [
    ["timeTravel", "timeTravel"],
    ["flowchart", "commentary"],
    ["timeline", "developer"],
  ],
  minHeight: 760,
  gap: 12,
});
const layout: LensLayoutDefinition = JSON.parse(savedLayoutJson);

<ExplainableShell
  runtimeSnapshot={snapshot}
  traceGraph={graph}
  layout={layout}
/>;
```

Omitting an optional area hides that surface; repeating its name spans cells.
Use `"."` for an empty cell. The matrix must be rectangular, each named area
must form one rectangle, and both `timeTravel` and `flowchart` must be present.
On narrow screens, surfaces stack in first-appearance order from `areas`.
Invalid definitions throw a clear `Invalid Lens layout: …` validation error.

Use the additional `details` area when you want the combined Developer /
Commentary pane with its two buttons. A layout containing `details` cannot also
contain separate `developer` or `commentary` areas. For example, this retains
the combined details switch beside the chart:

```tsx
const combinedDetailsLayout: LensLayoutDefinition = {
  columns: "minmax(0, 1.6fr) minmax(300px, 1fr)",
  areas: [
    ["timeTravel", "timeTravel"],
    ["flowchart", "details"],
    ["timeline", "timeline"],
  ],
};
```

Omit `layout` to retain the existing shell arrangement and its Developer /
Commentary details buttons. `renderLayout` takes precedence when both are
provided and gives the consumer complete ownership of the arrangement; the
required core areas apply to the JSON `layout` contract. `TraceViewer` forwards
the same `layout` option for saved run JSON.
This full Lens API uses `developer` for technical details; the basic
`ExplainableView.layout` API keeps its own `inspector` area and existing preset
names. The two layout types are distinct.

### Developer and Commentary details

Start with Commentary selected and let the reader switch in the details pane:

```tsx
<ExplainableShell
  runtimeSnapshot={executor.getSnapshot()}
  traceGraph={trace.getGraph()}
  defaultView="story"
/>
```

Only the details content switches. The flowchart geometry, time controls,
selected visit, topology, timeline and drill scope remain shared. Developer
retains stage Activity, state inspection and backtracking. Commentary reuses the
recorded transcript, progressively revealed through the cursor. Changing the
audience does not execute the pipeline again.

| Behavior | Developer (default) | Commentary |
|---|---|---|
| `LensView` value | `"developer"` | `"story"` |
| Details content | Stage inspection and debugging | Scrolling transcript through the selected stage |
| Commentary surface title | `"What happened"` when composed in a custom layout | `"What happened"` |
| Commentary surface presentation | `"log"` when composed in a custom layout | `"log"`: the recorded prefix through the cursor |
| Commentary groups by stage | `true` for the composed surface | `true` |
| Commentary follows cursor / shows entry-type badges | `true` / `false` for the composed surface | `true` / `false` |
| Chart and selected stage | Shared | Shared |
| Previous / next, play / pause, slider | All visible | All visible |
| Replay interval | Existing proportional stage timing | 2,000 ms between stages |
| Automatic playback | Off | Off |
| Recording, cursor and drill scope | The supplied run | The same supplied run |

`defaultView` selects the initial audience for the built-in buttons and defaults
to `"developer"`. For controlled state, pass `view` with `onViewChange` inside
your React component:

```tsx
import { useState } from "react";
import { ExplainableShell, type LensView } from "footprint-explainable-ui";

const [view, setView] = useState<LensView>("story");

<ExplainableShell
  runtimeSnapshot={snapshot}
  traceGraph={graph}
  view={view}
  onViewChange={setView}
/>;
```

A controlled `view` without `onViewChange` fixes the audience; the header shows
its label instead of switch buttons. Custom `renderLayout` implementations own
their audience navigation.

Commentary and replay configuration is optional; explicit values override the
audience defaults:

```tsx
<ExplainableShell
  runtimeSnapshot={snapshot}
  traceGraph={graph}
  defaultView="story"
  autoPlay={false}
  commentary={{
    title: "How we reached this result",
    presentation: "log", // or "current" for only the selected exact visit
    groupByStage: true,
    followCursor: true, // set false to opt out of automatic scrolling
    showEntryTypes: false,
    maxLines: 100,
    emptyMessage: "No commentary was recorded through this step.",
    renderEntry: (entry, { current }) => (
      <p style={{ fontWeight: current ? 600 : 400 }}>{entry.text}</p>
    ),
  }}
  replayControls={{
    previousNext: true,
    playPause: false,
    slider: true,
    intervalMs: 2400,
  }}
/>
```

`replayControls` is also accepted by `TimeTravelControls`, `TimeTravelBar` and
`ExplainableView`. Each visibility flag defaults to `true`; `intervalMs` sets a
fixed replay interval, clamped to 200–10,000 ms. `playPause: false` also disables
manual and automatic playback; `previousNext: false` disables the toolbar's
arrow shortcuts. These options do not change the recorded sequence. `autoPlay`
remains a separate, opt-in behavior.

`CommentaryPanel` works inside either `ExplainableProvider` or a full shell's
`renderLayout`. On its own it defaults to `presentation="log"`,
`groupByStage={false}`, `followCursor={false}`, `showEntryTypes={true}`, `maxLines={200}` and the title
`"Commentary"`. The log shows the recorded prefix through the cursor; `"current"` shows the selected
visit as an optional alternative. Full Lens commentary defaults to the scrolling
log with `groupByStage={true}`, `followCursor={true}` and `showEntryTypes={false}`; set `followCursor`
to `false` to opt out. It uses exact visits in the active invocation, so a
loop iteration or repeated subflow does not borrow a sibling's lines. Missing
or ambiguous identity is reported rather than guessed. Entry-type badges can be
enabled with `showEntryTypes={true}`. Automatic following respects reduced motion.

Grouping restores the stage-visit headings used by the Run log. Each heading
keeps its recorded comments, decisions, errors and emitted outcomes together;
recorded data operations remain available in a disclosure. Loop visits and
repeated subflows retain their own identities. Set `groupByStage={false}` to
render the individual transcript rows instead.

Rendering and recording are separate choices. `renderEntry` returns React
content for an existing `NarrativeEntry`; its `index` and `current` context help
style a line. It does not change the stored narrative or determine causal
relationships. To customize the words at capture time, attach FootprintJS's
narrative recorder before execution:

```ts
import { narrative } from "footprintjs/recorders";

const story = narrative({
  renderer: {
    renderOp: ({ type, key, valueSummary }) =>
      `${type === "read" ? "Read" : "Wrote"} ${key}: ${valueSummary}`,
    renderEmit: ({ name, payload }) => {
      if ((name === "review.comment" || name === "review.outcome") &&
          payload && typeof payload === "object" &&
          "message" in payload && typeof payload.message === "string") {
        return payload.message;
      }
      return undefined; // keep the default formatter for other event names
    },
  },
});
executor.attachCombinedRecorder(story);
await executor.run();

// Save JSON, then replay it elsewhere. No executor is needed by the viewer.
const recording = {
  snapshot: executor.getSnapshot(),
  structure: chart.buildTimeStructure,
  narrativeEntries: story.getEntries(),
};
const json = JSON.stringify(recording);
```

The stage code supplies its own domain voice. For example, inside a stage:

```ts
scope.$log("Preparing the review packet."); // producer debug log
scope.$emit("review.comment", { message: "Checking the request against the limit." });
scope.$emit("review.outcome", { message: "The result is ready for review." });
```

`$emit` feeds `renderer.renderEmit` above and saves those words in the narrative.
`$log` diagnostics are producer-version-dependent; use named `$emit` events for
portable domain comments and outcomes. A domain outcome must be explicitly recorded or
supplied by a host's `renderEntry`. The UI does not label the last state write
as a function's return value or invent a reason for its result.
A viewer cannot reconstruct application messages that were not captured in the saved run.

```tsx
import { TraceViewer } from "footprint-explainable-ui";

<TraceViewer
  recording={json}
  defaultView="story"
  replayControls={{ previousNext: true, playPause: true, slider: true }}
/>;
```

The snapshot may already carry the narrative recorder; the separate
`narrativeEntries` field is an explicit saved override using the existing
`NarrativeEntry[]` format. Keep its `runtimeStageId` values intact for exact
visit synchronization. There is no new commentary JSON format. Agentfootprint
has its own JSON-compatible key-to-string map with `{{vars}}` for rendering
typed agent events; this package does not evaluate a second template language.

Commentary displays what the recording says. It cannot supply a missing read
value, expression, branch reason or source-code line. Authored descriptions and
custom wording remain authored descriptions; recorded state and decision
evidence remain in Activity and backtracking. Scrubbing, playing and switching
views read the saved run and never rerun its stages.

For a complete consumer component with matching static snapshots and narrative,
see [`examples/story-commentary`](./examples/story-commentary/). Existing
`defaultTab`, recorder tabs, `renderLayout` and the basic `ExplainableView`
layout presets remain supported. `view` selects the details audience;
`ExplainableView.layout` still selects the basic composition's geometry.

### Compose the surfaces from external JSON

`ExplainableView` reads the same frozen `{ snapshot, structure, narrativeEntries }`
recording as `TraceViewer`, but its surfaces are independent components sharing
one cursor:

```tsx
import {
  ExplainableProvider,
  TimeTravelBar,
  CompactTimelinePanel,
  TimelinePanel,
  FlowchartPanel,
  ValueInspector,
  CommentaryPanel,
  ExplainableView,
} from "footprint-explainable-ui";

const recording = JSON.parse(savedRunJson);

// Ready-made view
<ExplainableView
  recording={recording}
  layout="product"
  theme={{
    mode: "light",
    tokens: { colors: { primary: "#245c45", warning: "#df6a4e" } },
    flowchart: { done: "#245c45", active: "#df6a4e" },
  }}
/>

// Or own the layout completely. Every component reads and moves the same cursor.
<ExplainableProvider recording={recording}>
  <header><TimeTravelBar /></header>
  <main><FlowchartPanel /></main>
  <section><ValueInspector /></section>
  <section><CommentaryPanel /></section>
  <footer><CompactTimelinePanel /></footer>
</ExplainableProvider>
```

Layout policy stays with the consumer:

| Preset | Surfaces |
| --- | --- |
| `developer` | Original workbench: time controls top, flowchart center, collapsible inspector right, compact timeline bottom |
| `product` | Time controls top, flowchart with collapsible inspector, full-width commentary below; no compact timeline |
| `studio` | Every surface together, including the optional vertical stage rail |
| `linear` | Every surface in one vertical stack |

Pass a named-area definition when a preset is not enough. Omitting a surface
from `areas` hides it; repeating a name spans that surface across cells:

```tsx
<ExplainableView
  recording={recording}
  layout={{
    columns: "320px minmax(0, 1fr)",
    rows: "auto minmax(480px, 1fr) auto",
    areas: [
      ["timeTravel", "timeTravel"],
      ["commentary", "flowchart"],
      ["timeline", "timeline"],
    ],
  }}
/>
```

The `developer` preset is the old workbench geometry rebuilt from these exported
pieces. `ExplainableShell` also remains available for the richer legacy topology,
details, tracing, and subflow features.

The assembled workbench exposes `detailsExpanded`, `defaultDetailsExpanded`,
`onDetailsExpandedChange`, and `detailsLabel` when consumers need to control the
old Details handle themselves.

Use `slots` to replace one surface without rebuilding the workbench:

```tsx
<ExplainableView
  recording={recording}
  slots={{
    commentary: ({ selectedSnapshot }) => (
      <MyCommentary stage={selectedSnapshot} />
    ),
  }}
/>
```

The recording can be an object or a raw JSON string. The provider parses it,
reconstructs the timeline, chart, runtime overlay, state snapshots, and narrative,
then keeps every surface synchronized through a single controlled or uncontrolled
`selectedIndex`. Consumers can inject a built-in mode, fine token overrides,
flowchart state colors, or plain `--fp-*` variables on any ancestor.

### 3. Replaying a recording (no live executor)

**A recording is three things.** Save all three together — miss one and one
surface goes dark:

```ts
const recording = {
  snapshot:  executor.getSnapshot(),     // memory, story, timeline, chart colouring
  structure: chart.buildTimeStructure,   // THE CHART. Nothing else can draw it.
  events:    myEventLog,                 // the agent view (agentfootprint-lens)
};
fs.writeFileSync("run.json", JSON.stringify(recording));
```

`structure` is the piece a run does not leave behind on its own: `getSnapshot()`
never contains it, and no adapter can invent it. Rendering is two props:

```tsx
import { ExplainableShell, graphFromStructure } from "footprint-explainable-ui";

const run = JSON.parse(await fs.readFile("run.json", "utf8"));

<ExplainableShell
  runtimeSnapshot={run.snapshot}
  traceGraph={graphFromStructure(run.structure)}
  traceTheme={{ mode: "light" }}
/>;
```

You do **not** pass a `runtimeOverlay`: the chart's colouring is rebuilt from the
snapshot's own commit log. Pass one only when you have a live
`createTraceRuntimeOverlay` handle. The narrative comes along too — if the run
was recorded with footprintjs's narrative recorder the shell reads the story out
of `snapshot.recorders`, so `narrativeEntries` is only for overriding it.

Runnable, with a generator that records a real run:
[`examples/replay-a-recording/`](./examples/replay-a-recording/) —
`npm run example:record && npm run example:replay`.

Already have the file? `<TraceViewer recording={run} onError={...} />` is the
same composition in one component.

**Let it play by itself.** A page that opens a saved run, such as a "See this
run" button, should not make the reader press Play first:

```tsx
<TraceViewer recording={raw} autoPlay onError={...} />
```

The cursor goes to the first stage, walks to the last at the usual Play timing,
and stops there. It plays once per recording: a re-render does not restart it,
and a new recording plays again. "New" means a new `runId`, or a new snapshot
object when the recording has none, so pass the raw string or parse once rather
than writing `recording={JSON.parse(raw)}` inline. Whatever the reader does
wins: Pause, scrubbing, an arrow key, space, a drill, a trace or a click on
another stage stops it for good. It does not start under
`prefers-reduced-motion: reduce`, while tracing, or on a run with fewer than two
stages. `ExplainableShell` takes the same prop, and so does `TimeTravelControls`,
where a new `snapshots` array is a new recording unless you pass `autoPlayKey`.

**What a recording honestly cannot show** — each is stated on screen, never
faked: per-stage durations without footprintjs's `metrics()` recorder (the Gantt
shows execution ORDER and says so), error messages (the commit log has no error
channel — a failing stage's writes land, its message does not), and deep subflow
internals (footprintjs keeps those out of the run-level commit log, so a replay
lights the mount stages, not their insides).

### 4. Or compose individual components

```tsx
import {
  TimeTravelControls,
  MemoryInspector,
  ScopeDiff,
  GanttTimeline,
  NarrativeTrace,
} from "footprint-explainable-ui";

function MyDebugger({ snapshots }) {
  const [idx, setIdx] = useState(0);
  const current = snapshots[idx];
  const previous = idx > 0 ? snapshots[idx - 1] : null;

  return (
    <>
      <TimeTravelControls
        snapshots={snapshots}
        selectedIndex={idx}
        onIndexChange={setIdx}
      />
      <MemoryInspector snapshots={snapshots} selectedIndex={idx} />
      <ScopeDiff
        previous={previous?.memory ?? null}
        current={current.memory}
        hideUnchanged
      />
      <NarrativeTrace narrative={snapshots.map(s => s.narrative)} />
      <GanttTimeline snapshots={snapshots} selectedIndex={idx} onSelect={setIdx} />
    </>
  );
}
```

---

## ExplainableShell

The all-in-one orchestrator. Handles time-travel, subflow drill-down, memory/narrative panels, and responsive layout.

### Props

Pass the run one of two ways — `runtimeSnapshot` (the shell converts it) or
pre-converted `snapshots`. Both are optional; pass neither and the shell says
what it wanted instead of rendering empty chrome.

| Prop | Type | Default | Description |
|---|---|---|---|
| `runtimeSnapshot` | `RuntimeSnapshotInput \| null` | — | A recorded `executor.getSnapshot()`. Drives the rows, memory, story, provenance, recorder tabs — and the chart's colouring |
| `snapshots` | `StageSnapshot[]` | — | Pre-converted rows, when you called `toVisualizationSnapshots()` yourself. Wins over `runtimeSnapshot` |
| `traceGraph` | `TraceGraph \| null` | — | The execution chart. From `createTraceStructureRecorder()` live, or `graphFromStructure(saved.structure)` for a recording. It stays available while tracing; Variables offers a separate recorded-read view |
| `runtimeOverlay` | `RuntimeOverlay \| null` | derived from `runtimeSnapshot` | The executed-path colouring. Usually omit — pass one only for a live `createTraceRuntimeOverlay` handle |
| `traceTheme` | `TraceTheme` | — | Existing mode shorthand and `visited` / `current` node-colour overrides |
| `flowchart` | `FlowchartOptions` | `{ renderer: "flat" }` | Choose built-in `"flat"` or `"isometric"` chart geometry; explicit options override `layout.flowchart` |
| `theme` | `LensTheme` | inherited | `{ mode, tokens, components }` maps the core Lens to your design system; explicit tokens override the selected mode |
| `narrativeEntries` | `NarrativeEntry[]` | read from the snapshot | Structured narrative. Only needed to override the story the recording carries |
| `defaultView` | `LensView` | `"developer"` | Initial details audience for the built-in Developer / Commentary buttons |
| `view` | `LensView` | uncontrolled | Controlled details audience: `"developer"` or `"story"` (Commentary); pair with `onViewChange` for switching |
| `onViewChange` | `(view: LensView) => void` | — | Receive audience changes; without it, a controlled `view` fixes the audience |
| `commentary` | `LensCommentaryOptions` | grouped log, follow cursor, no entry-type badges | Commentary `title`, `presentation`, `groupByStage`, `followCursor`, `showEntryTypes`, `maxLines`, `emptyMessage` and `renderEntry` overrides |
| `replayControls` | `ReplayControlsOptions` | visibility on; interval from view | Configure previous/next, play/pause, slider and an optional fixed `intervalMs` |
| `layout` | `LensLayoutDefinition` | existing shell arrangement | JSON-compatible named areas over the shared cursor; core `timeTravel` and `flowchart` are required |
| `title` | `string` | `"Flowchart"` | Breadcrumb root label |
| `resultData` | `Record<string, unknown>` | `snapshot.sharedState` | Final output shown on the Result view |
| `logs` | `string[]` | `[]` | Console lines shown under the result |
| `defaultTab` | `ShellTab` | Inspector → Activity | A valid existing tab ID selects its corresponding initial surface; see below |
| `hideTabs` | `string[]` | — | Details tabs to hide by id (e.g. `["result", "memory"]`) |
| `hideConsole` | `boolean` | `false` | Hide the console block on the Result view |
| `recorderViews` | `RecorderView[]` | auto-detected | Extra details tabs. Recorders inside the snapshot already get one each |
| `panelLabels` | `PanelLabels` | `{ topology: "Topology", details: "Details", timeline: "Timeline" }` | Collapsible pill labels |
| `defaultExpanded` | `DefaultExpanded` | `{ details: true }` | Which panels start open |
| `renderFlowchart` | `(props) => ReactNode` | `<TracedFlow>` | Replace the execution chart renderer; it remains mounted when switching between Execution and Variables |
| `renderLayout` | `LensWorkbenchLayout` | built-in responsive layout | Arrange the full shell's surfaces while retaining its selection, drill-down and backtracking owners; takes precedence over `layout` |
| `showStageId` | `boolean` | `false` | Print each node's stable `stageId` under its label (teaching aid) |
| `autoPlay` | `boolean` | `false` | Play the run by itself when it opens, once per recording. Anything the reader does stops it |
| `size` | `"compact" \| "default" \| "detailed"` | `"default"` | Size variant |
| `unstyled` | `boolean` | `false` | Remove built-in core Lens paint and retain semantic `data-fp` hooks; the default becomes the composite Explainable surface |

### Choose chart geometry

Choose the illustrated renderer with a prop; the same recording, replay cursor,
Backtrack question and drilled invocation stay selected:

```tsx
import { ExplainableShell, TraceViewer } from "footprint-explainable-ui";
import { TraceFlow, TracedFlow, FootprintTheme as FlowchartTheme } from "footprint-explainable-ui/flowchart";

<ExplainableShell runtimeSnapshot={snapshot} traceGraph={graph}
  flowchart={{ renderer: "isometric" }} />
<TraceViewer recording={recording} flowchart={{ renderer: "isometric" }} />

// Low-level chart consumers use the renderer prop directly.
<TraceFlow graph={graph} renderer="isometric" />
<TracedFlow graph={graph} overlay={overlay} renderer="isometric" />

// A standalone low-level chart uses the provider from the same entry point.
<FlowchartTheme components={{ Icon: CompanyIcon }}>
  <TracedFlow graph={graph} overlay={overlay} renderer="isometric" />
</FlowchartTheme>
```

A JSON Lens layout can carry the same choice:

```json
{
  "columns": "minmax(0, 2fr) minmax(280px, 1fr)",
  "rows": "auto minmax(0, 1fr)",
  "areas": [["timeTravel", "timeTravel"], ["flowchart", "details"]],
  "flowchart": { "renderer": "isometric" }
}
```

Flat remains the default. An explicit `flowchart.renderer` prop overrides the
JSON value. `renderLayout` keeps its existing precedence over the JSON layout.
A custom `renderFlowchart` remains the final chart replacement and receives the
resolved `renderer` value; forward it to `TracedFlow` when that replacement
should honor the built-in choice. Changing renderer does not select the Paper
theme; palettes and geometry are independent.

The built-in isometric view uses SVG slabs, upright labels and a world-space
vector floor. It needs no additional isometric stylesheet, WebGL or orbit
camera. Recorded labels, semantic icons, selection, failures, retries and read
links retain their recorded meanings; shapes do not infer infrastructure types
from stage names. Existing xyflow setup still applies. The Icon adapter and
semantic node/theme tokens style both renderers. In unstyled mode the component
keeps its drawing geometry and ports while omitting built-in paint.

Low-level `layout` functions and `layout="passthrough"` keep precedence over the
renderer’s default positioning. Consumer `nodeTypes` and authored `edgeTypes`
remain available, including replacements for the default `stageNode` renderer.
Loop-back and recorded-read edges retain their specialized renderers.
`IsometricStageNode`, `IsometricEdge` and `IsometricGrid` are also exported from
`footprint-explainable-ui/flowchart` for consumers composing their own chart.
These renderer APIs are included in the 0.46.0 release.

### Default template and existing tab IDs

In Developer view, without a valid `defaultTab`, the shell opens
**Inspector → Activity**.
`defaultTab="result"` opens Result; `"memory"` opens Inspector → State;
`"narrative"` or an available recorder ID opens Run data. Hidden or unavailable
IDs do not select an initial lens. In unstyled mode, the default **Explainable**
composite includes Activity alongside the chart, log and timeline.

Visible labels are **Run log**, **Metrics** and **State**. Existing tab IDs,
including `narrative` and `memory`, remain unchanged for `defaultTab`, `hideTabs`
and recorder integrations.

### Own the full Lens layout

`renderLayout` receives a `LensWorkbenchContextValue`. Components rendered
inside it can read the same value with `useLensWorkbench`:

```tsx
import { useState } from "react";
import { ExplainableShell, useLensWorkbench, type LensView } from "footprint-explainable-ui";

function CustomerWorkbench({ view, onViewChange }: {
  view: LensView;
  onViewChange: (view: LensView) => void;
}) {
  const { surfaces } = useLensWorkbench();
  return (
    <section className="customer-lens">
      <header>{surfaces.breadcrumb}{surfaces.timeTravel}</header>
      <div className="customer-lens-columns">
        <main>{surfaces.chart}</main>
        <aside>
          <nav aria-label="Details audience">
            <button onClick={() => onViewChange("developer")} aria-pressed={view === "developer"}>Developer</button>
            <button onClick={() => onViewChange("story")} aria-pressed={view === "story"}>Commentary</button>
          </nav>
          {view === "story" ? surfaces.commentary : surfaces.developer}
        </aside>
      </div>
      {surfaces.navigation}
    </section>
  );
}

function CustomerLens() {
  const [view, setView] = useState<LensView>("developer");
  return (
    <ExplainableShell
      runtimeSnapshot={snapshot}
      traceGraph={graph}
      theme={{ mode: "light" }}
      view={view}
      onViewChange={setView}
      renderLayout={() => <CustomerWorkbench view={view} onViewChange={setView} />}
    />
  );
}
```

Give the chart container a height in your layout. These supplied surfaces keep
the same backtracking, selected visit and subflow drill-down behavior as the
default shell. `surfaces.commentary` retains cursor and scope synchronization;
use it directly or mount a `CommentaryPanel` with `presentation="log"`,
`groupByStage`, `followCursor` and `showEntryTypes={false}` inside the layout to supply local
rendering props. Custom layouts own their audience
buttons, as above, or reuse `surfaces.details` for the combined two-choice pane.
`surfaces.developer` is the whole technical details panel; `surfaces.inspector`
remains available for a focused inspector. Additional surfaces are `topology`, `runData`, `result`,
`timeline` and `compactTimeline`. The context exposes `snapshots`,
`selectedIndex`, `selectedSnapshot`, `invocationPath`, `activity`,
`selectedActivityVariableId`, `traceWalk`, `questionTrail` and `activityOrigin`.
`narrativeEntries` contains the current scope's full supplied recording;
custom log renderers must apply their own cursor filtering. Its `actions` are
`selectIndex`, `selectStage`, `drillDown`, `returnToRoot`, `backtrack`,
`exitBacktrack`, `followIngredient`, `followHandoff`, `returnToQuestion`,
`showAllIngredients` and `selectActivityVariable`. Trace targets and returns
still pass the shell's validation.
`useLensWorkbench` requires this shell context. `ExplainableView` and
`ExplainableProvider` continue to provide their separate basic composition API.

### Inspect one executed stage

Open **Inspector → Activity** to read the selected execution visit's narrative,
recorded read keys, committed state changes and recorded decisions. Activity is
the default Inspector view in `ExplainableShell`. Selecting a variable keeps the
stage context visible while showing its recorded writer and bounded value
preview; **Backtrack** enters the existing value-tracing rail.

An Activity-started trace keeps an origin bookmark containing the stage address
and selected variable identity, without retaining snapshot values. Its primary
**Back to … · Activity** action restores that exact stage, invocation and
variable selection after validating the current recording. **Escape** and the
Inspector's **Activity** tab use the same return. The variable-question trail
still lets you return to earlier questions within the investigation. A trace
started through the legacy Data Trace controls keeps its existing **Done**
behavior: exit at the currently viewed cursor.

The return route also works when no earlier writer is recorded and there are
no trace stops to step through. Keyboard focus can return to the inspected
variable after the origin is restored.

A read and a write of the same key remain separate. For a stage that reads
`count = 2` and writes `count = 3`, the read's trace cutoff is before that
stage's commit; the write's cutoff includes it. Exact invocation and visit IDs
keep loop iterations and repeated subflows separate. **Open writer** selects
that recorded writer on the same scope's timeline.

Value-free engine exit/repeat bookkeeping rows do not create another visit or
write. Trace targets retain their raw commit positions, including those rows;
they are not indexes into a filtered list of displayed stages. A phase marker
alone does not excuse a duplicate value-carrying commit address.

The panel keeps its evidence limits visible:

- The narrative sequence belongs to one visit, not a global clock across
  parallel stages. Legacy Read/Write/Update/Delete labels report strictly
  matched narrative wording; they are not typed scope-event capture.
- A read preview is the state **after the earlier writer**, not the captured
  value of every read call. Missing or ambiguous writer snapshots stay
  unavailable. When the narrative reports reading a key after writing it inside
  the same stage, that key's generic read origin and Backtrack action remain
  unresolved; a different pre-stage value is not substituted.
- Before/after values describe committed stage changes, not every JavaScript
  assignment. Without an earlier snapshot, the first before-value is unknown.
- Only logs linked to this exact runtime visit appear as stage logs. Run-level
  console lines remain in Result and are not assigned to a stage.

`projectStageActivity` produces the bounded evidence model used by
`StageActivityPanel`; `formatStageActivitySummary` formats that same projection
for copying or tools. These stage-activity APIs are exported from the package
root. Stage source code, algorithm reconstruction
and full-flow export are outside this stage-activity view.

Standalone `InspectorPanel` keeps its existing State/Data Trace behavior when
no `activity` model is supplied. Supplying `activity` adds Activity and selects
it by default. Controlled hosts use `activitySelected` and `onActivitySelect`
for that selection; `tab` and `onTabChange` retain their existing
`"state" | "trace"` contract. `onTraceActivityVariable` receives an exact
recorded target that the host must validate before starting the existing walk.
Hosts can control the inspected variable with
`StageActivityPanel.selectedVariableId` / `onVariableSelect`, or the wrapping
Inspector's `selectedActivityVariableId` / `onActivityVariableSelect`. The shell
uses this selection to return to the same read or write after backtracking.

### Read the run log and metrics

The shell's **Run log** groups exact recorded visits and initially collapses
their data-operation details. Expanding a group shows the full recorded text;
the presentation does not shorten or rewrite it. With exact visit IDs, only
the selected invocation's recorded prefix through the cursor is revealed.
Missing, unmatched or ambiguous IDs produce an explicit **not synchronized**
notice and show the supplied scope's entries without selected-step attribution.

Standalone `NarrativePanel` and `StoryNarrative` keep `presentation="entries"`
as their default; use `presentation="visits"` for visit groups. Following the
cursor is opt-in: `NarrativePanel.defaultFollowCursor` defaults to `false`.
**Copy full run debug bundle** deliberately includes the full supplied run,
other invocations and entries after the cursor. Without a runtime snapshot,
**Copy recorded log** copies all supplied log entries.

**Metrics** presents recorded per-visit counts and durations in a table. Rows
must match an exact runtime visit in the current invocation. Selected-step,
through-this-step and current-flow totals have distinct labels; the source
recorder's `grandTotal` is never substituted for a drilled child's flow total.
Missing, invalid, string or non-finite numeric cells stay unavailable, while
recorded zero remains zero. Legacy stage-name tables are explicitly unscoped:
they have no selected-step or current-flow totals. Custom recorder views keep
their generic presentation.

### Tracing a value — inspect its recorded state reads

Open **Inspector → Data Trace** and choose a written value, or use **Trace any
variable** to search the selected record. Tracing starts in **Execution**, keeping
the workflow in view. The built-in chart highlights the question's recorded
writers and reads while retaining the surrounding steps. **Variables** offers
a separate map: each card names the key and writer, with a bounded preview from
the snapshot after that writer. Missing values and unresolved sources remain
explicit.

Switching views keeps the same question and cursor. The execution chart,
including a consumer's `renderFlowchart` replacement, stays mounted so returning
does not recreate it. Within each question, matching variable cards, workflow
highlights and read chips use consistent colors. Short 240 ms transitions help
track position and emphasis changes; the reader's reduced-motion preference
disables them. Questions without a usable recorded walk keep the usual execution
view and the explanation of what is missing.

While tracing, execution nodes remain readable as workflow context. A
**VIEWING** badge identifies the recorded cursor; it does not assert that a
stage is running now or that a later stage has already completed. Recorded
relationships and execution status retain their separate meanings.

- **Recorded read prefixes**: when a written trace entry supplies `readKeys`,
  backtracking follows that exact write's captured read prefix. An explicit
  empty list means no reads were captured before that write; it does not borrow
  later reads from another output in the same step. These links describe
  recorded state usage, not how an expression computed an output.
- **Recorded read time**: native `beganAt` / `sawUntil` bounds date a read in the
  producer's commit-index space, including after subflow filtering. A later
  sibling write cannot replace an earlier pinned source. If a key or a related
  parent/child path changes inside the recorded look window, its exact source
  stays unresolved. A later parent/child replacement also invalidates an old
  exact-path recipe; the UI does not infer a new source from object values.
  Invalid, incomplete or unmappable timing cannot silently become legacy
  dating. Unstamped old recordings retain their positional convention.
- **Legacy evidence stays coarse**: when `readKeys` is absent, recorded stage
  reads remain the fallback. A stage's two outputs can then share its read
  union. Nested writer paths are matched exactly as recorded; dot-joined labels
  are not converted into canonical paths. An old recording that captured only
  `runs` cannot acquire links to `runs › items › amount` or
  `runs › delivery › amount` by updating the UI. New precise links require a
  new producer capture. Root and intermediate reads without exact local writers
  remain explicitly unresolved alongside any recorded leaf links.
- **Path encoding stays explicit**: new captures with
  `nestedReadTracking: true` attest canonical per-write `readKeys`, including
  literal dots in key names. The shell carries that flag into the selected
  scope; detached callers can pass it in `buildTraceWalk`'s `scope` only for
  an attested capture. Without the flag, a dotted read name remains unresolved
  because a legacy nested label can collide with a different literal-dot key.
  Tree `stageReads` dotted labels remain ambiguous even when the snapshot has
  the flag. Legacy reads in a commit containing a nested write also lack a reliable scope
  address: a local `x` may collide with a different root `x`, including when
  its name has no dots. Such reads stay unresolved. Legacy records without
  nested address evidence keep their historical root-key interpretation;
  this compatibility fallback does not establish global provenance.
- **Detached read questions**: `buildTraceWalk` accepts `readerCommitIdx`, the
  reader's array position, to retain that commit's native read window. The
  existing `beforeCommitIdx` remains an exclusive array-position cutoff for a
  value-at-that-moment question. Cursor positions stay local to the displayed
  recording; native timing stamps are never rebased to those positions.
- **Choose a source explicitly**: branches remain visible in the variable
  map and the recorded-read chips. Select a variable or chip to follow its
  recorded writer. The rail's **Earlier recorded step** and **Later recorded
  step** buttons move through the same stops in time order; they do not
  silently choose an input branch. The walk lists stops newest first, and
  moving earlier visits them in reverse commit order.
- **Return to an earlier question**: the investigation trail retains the
  selected key, scope, recorded cutoff and cursor across local source follows
  and child-record hops. Choose an earlier key or **Back to** to restore that
  question and position. Missing or withdrawn evidence is not replaced with
  a guessed visit.
- **One cursor**: the rail, execution view and state panel stay synchronized.
  Selecting an earlier recorded step changes the displayed moment; it does
  not move the question's frozen cutoff. Legacy Data Trace **Done** exits at
  that cursor; an Activity-origin return restores its bookmarked stage instead.
- **Honest absence**: a missing writer says "no recorded write; value
  unknown". A value not written yet names the later recorded write. An empty
  read list says "No recorded state reads", without declaring a data origin.
  When reads were not recorded, their dependencies remain unknown. Limited
  views say that earlier evidence may be missing.
- **Trace inside a subflow**: drill into an exact recorded child visit, then
  open Inspector → Data Trace. The breadcrumb identifies that invocation;
  its known place in the parent does not establish earlier input sources.
  Ambiguous clicks offer a visit choice. Story shows that visit's entries.
  Child results must be keyed by the exact mount runtime ID; a path-only
  alias cannot identify a visit. Custom hosts can supply the exact result map
  or attach the matching result to the selected `StageSnapshot`.
- **Follow a recorded child source**: recordings with FootPrint's
  `captureOutputHandoff: true` can show source buttons at an output-mapping
  boundary. Using `writeProvenance: 'reads-prefix'` also retains child-write
  read prefixes. An admitted source opens the exact child visit and asks for
  the selected key at its recorded cutoff. Parent and child logs and timelines
  remain separate. The question header keeps the parent context visible, with
  **Back** to return to that question. Handoff references describe an
  observed-read prefix, which can include reads used by other outputs. Partial, missing or invalid
  metadata retains the boundary as unknown.
- **Invocation-start values**: a value already present when a child starts
  may come from input mapping or restored state. The card and copied text
  identify recorded starting keys without inventing their earlier writers.
- **Copy story** uses `formatTraceWalk`. A tool formatting the same walk and
  step numbers receives the identical text. `buildTraceWalk` and Foottrace's
  `causalChain` stay local to the supplied record; neither automatically joins
  parent and child logs. Agent tools can use `projectTraceInvocation` to
  select an exact child explicitly. See [the tracing guide](src/components/ExplainableShell/_internal/README.md)
  for scope examples, evidence limits and offline checks.
- Refreshing the same run keeps the selected visit and question. A new run
  keeps the root cursor; an unavailable selected child returns to the nearest
  recorded level with a notice. Supply each run's own Story, state and overlay
  when overriding the recording; known stale inputs are withheld.

The tracing rail uses its own theme color (`--fp-tracing`, teal by default)
to distinguish this investigation from ordinary time travel.

### Panel Labels

Customize the text on collapsible pill buttons. Semantic keys — not tied to position:

```tsx
<ExplainableShell
  panelLabels={{
    topology: "What Ran",      // left panel (subflow tree)
    details: "What Happened",  // right panel (memory/narrative)
    timeline: "How Long",      // bottom panel (Gantt)
  }}
/>
```

### Default Expanded

Control which panels start open. Desktop default: details panel open (flowchart + memory = the library's unique value). For mobile, pass all `false`:

```tsx
// Desktop (default) — memory panel open
<ExplainableShell snapshots={...} traceGraph={...} runtimeOverlay={...} />

// Mobile — all collapsed, flowchart fills screen
<ExplainableShell
  snapshots={...}
  defaultExpanded={{ details: false }}
/>

// Everything open
<ExplainableShell
  snapshots={...}
  defaultExpanded={{ topology: true, details: true, timeline: true }}
/>
```

### Responsive Layout

The shell auto-detects container width via `ResizeObserver`:

- **Desktop (≥640px):** 3-column layout — SubflowTree | Flowchart | Inspector/Run data. Side panels collapse to VLinePill handles.
- **Mobile (<640px):** Stacked vertical — Flowchart (350px) → collapsible HLinePill sections. All panels auto-collapse on narrow.

### Collapsible Panel UX

All panels use the **line + pill** pattern:
- **Collapsed:** Thin divider line with a centered pill button (label + arrow)
- **Expanded:** Full content with a pill handle on the closing edge
- **VLinePill** (left/right panels): Vertical line with centered vertical pill. `side` prop controls arrow direction.
- **HLinePill** (bottom timeline): Horizontal line with centered pill.

---

## Flowchart Visualization

Import from `footprint-explainable-ui/flowchart`. The chart is recorder-driven:
a `TraceGraph` says what the chart IS, a `RuntimeOverlay` says what ran.

### TracedFlow — the chart plus the run

```tsx
import { TracedFlow } from "footprint-explainable-ui/flowchart";

<div style={{ height: 400 }}>
  <TracedFlow
    graph={trace.getGraph()}       // from createTraceStructureRecorder
    overlay={overlayFromSnapshot(snapshot, { narrativeEntries })}  // or a live createTraceRuntimeOverlay
    scrubIndex={idx}
    theme="light"
    onNodeClick={(stageId) => handleClick(stageId)}
  />
</div>
```

Without an `overlay` it renders the plain build-time chart. With one, the
executed path lights up, un-run stages fade, and each executed node carries its
step number. Subflow mount nodes drill on click, and the chart re-fits itself
whenever its container resizes.

Both `TraceFlow` and `TracedFlow` wait for a visible, non-zero chart pane and
finite measurements for every visible node before fitting. Hidden or not-yet-
measured charts wait for a real measurement or resize notification, rather than
guessing readiness after a fixed number of frames. Automatic fits are immediate;
they do not start a zoom animation that could outlive the visible container.
Ordinary replay, selection and overlay updates preserve the user's pan and zoom.
Manual viewport controls remain available.

#### Customize the chart surface

| Concern | Props |
|---|---|
| Node and edge renderers | `nodeTypes`, `edgeTypes`; custom metadata is retained |
| Default measured layout | `layoutOptions` for node sizes and separation; direction remains top-to-bottom |
| Host-owned layout | `layout`; this owns its options, so `layoutOptions` is ignored with a development warning |
| Background | `background={false}` removes the dots; explicit xyflow `BackgroundProps` configures them |
| Breadcrumb | `breadcrumb={false}` hides it; a function receives `{ entries, onNavigate, unstyled }` |
| Camera | `minZoom`, `maxZoom`, `defaultViewport`, or controlled `viewport` / `onViewportChange` |
| Automatic fitting | `autoFit={false}` leaves fitting to the host; `{ padding, maxZoom }` configures it, with default padding `0.18` |

A controlled `viewport` disables the internal automatic fitter. Omitted
`minZoom` retains `0.1`. Authored edge type, style and `markerEnd` take priority
over built-in defaults. `unstyled` retains the interactive graph, ports and
layout geometry while removing built-in paint and preserving authored styles.
It omits the default dotted background; explicit `background` props still work.
Stage-node foregrounds use the paired semantic color roles, and its semantic
icons can use the host `Icon` adapter. Shared theme tokens, recipes and control
adapters are exported from both package entry points.

#### A stage that had to be tried again says so on the chart

When footprintjs (≥ 9.15.0) retries a stage under a declared `retry` policy,
that node wears a small amber `↺ ×3` chip — "this took three attempts" —
alongside whatever status it ended in. A stage that recovered stays green with
the chip; a stage that exhausted its policy stays red with the chip. A screen
reader hears the whole fact: *"retried, attempt 3 of 3 succeeded"*.

Three things it deliberately will not do:

- **It never adds a step.** All attempts share one `runtimeStageId` and one
  commit bundle, so a retried stage is still exactly one stop on your rail.
- **It never shows for a policy that was only declared.** Declared is not the
  same as happened; a stage that carries `.retry({ attempts: 2 })` and sails
  through is unmarked.
- **It never appears at `×1`.** One attempt is the silent default.

The chart reads this from the overlay, so it works live and on replay. Live
comes free (`createTraceRuntimeOverlay` now listens to `onStageRetry`). On
replay, a failed attempt discards its writes, so the commit log genuinely
cannot know — `overlayFromSnapshot` reads the count the engine stamped on the
stage's execution-tree node instead (`attemptSummary`, footprintjs ≥ 10.1),
so a whole `executor.getSnapshot()` is enough. A recording from footprintjs
9.15–10.0 has no summary; pass its narrative, whose `retry` entries carry the
same count:

```tsx
overlay={overlayFromSnapshot(recording.snapshot, {
  narrativeEntries: recording.narrativeEntries,   // only for 9.15–10.0 recordings
})}
```

`<ExplainableShell>`, `<ExplainableView>` and `<TraceViewer>` already pass it
for you.

### Where the graph comes from

| You have | Call | Notes |
|---|---|---|
| a live build | `createTraceStructureRecorder()` → `flowChart(..., { structureRecorders: [rec] })` | collects the chart AS it is built |
| a saved run | `graphFromStructure(saved.structure)` | `saved.structure` is `chart.buildTimeStructure` |

Both produce the same `TraceGraph`, with the same node ids — which is what lets
either overlay light the right boxes.

---

## Theming

The built-in fallback palette is dark. Use a mode, inherit your application's
CSS variables, or supply tokens and native-compatible control adapters.

### 1. One word, per component

```tsx
<ExplainableShell theme={{ mode: "light" }} />         {/* the shell */}
<TraceViewer theme="light" />                          {/* the standalone components */}
<SnapshotPanel theme="light" />
<GanttTimeline theme="light" />
<TracedFlow theme="light" />
```

An explicit mode stamps the built-in palette as `--fp-*` variables on the
component's root. The shell also accepts token and component overrides through
`theme`; its existing `traceTheme` mode and node-colour overrides remain valid.

### 2. Follow the app's own dark mode — `useDarkModeTokens`

The direct answer to "why is your UI dark inside my light app". The hook watches
your app's dark-mode switch and hands back the matching preset:

```tsx
import { FootprintTheme, useDarkModeTokens } from "footprint-explainable-ui";

function MyApp() {
  const tokens = useDarkModeTokens();              // Tailwind's `.dark` on <html>
  return (
    <FootprintTheme tokens={tokens}>
      <ExplainableShell runtimeSnapshot={snapshot} traceGraph={graph} />
    </FootprintTheme>
  );
}
```

Whatever switch your app uses, name it:

```tsx
useDarkModeTokens({ darkClass: "theme-dark" })            // a class name
useDarkModeTokens({ darkClass: '[data-theme="dark"]' })   // any CSS selector
useDarkModeTokens({ light: warmLight, dark: warmDark })   // your own palettes
```

It re-themes live when the switch flips, and it is server-safe: on the server
there is no `document`, so the first render is light and the client corrects on
mount.

### 3. CSS variables (full control)

Consumer controls theme via `--fp-*` CSS custom properties. Components use `var(--fp-*, fallback)`:

```css
:root {
  --fp-color-primary: #7c6cf0;
  --fp-accent: #7c6cf0;             /* active tab / selected rule */
  --fp-accent-bg: rgba(124,108,240,0.14); /* wash behind a selected row */
  --fp-bg: #1e1a2e;                 /* panel body surface */
  --fp-bg-elevated: #2a2540;        /* raised cards on that surface */
  --fp-bg-primary: #1e1a2e;
  --fp-bg-secondary: #2a2540;
  --fp-bg-tertiary: #3a3455;
  --fp-text-primary: #f0e6d6;
  --fp-text-secondary: #b0a898;
  --fp-text-muted: #6b6b80;
  --fp-border: #3a3455;
  --fp-tracing: #3ecfb2;            /* the recorded-read investigation rail */
  --fp-chip-1: #0d9488;             /* the four recorded-read chip hues (categorical) */
  --fp-chip-2: #d97706;
  --fp-chip-3: #7c3aed;
  --fp-chip-4: #e11d48;
  --fp-radius: 8px;
  --fp-font-sans: 'Inter', system-ui, sans-serif;
  --fp-font-mono: 'JetBrains Mono', monospace;
}
```

Built-in presets supply the palette. New design-system roles also have
fallbacks, so a partial override can inherit the rest from your application.

### Density, typography and semantic foregrounds

`ThemeTokens` accepts these groups. Values are CSS strings, including sizes,
weights and durations; for example `"0.875rem"`, `"600"` and `"120ms"`.

| Group | Fields |
|---|---|
| `typography` | `body`, `label`, `small`, `title`, `lineHeight`, `weightNormal`, `weightMedium`, `weightStrong` |
| `spacing` | `xs`, `sm`, `md`, `lg`, `xl` |
| `radii` | `control`, `panel`, `badge` |
| `borders` | `width`, `focusWidth` |
| `elevation` | `panel`, `popover`, `focus` |
| `motion` | `duration`, `fastDuration`, `easing` |
| `controls` | `height`, `paddingX`, `gap`, `iconSize` |
| `nodes` | `borderColor`, `borderWidth`, `borderStyle`, `radius`, `shadow`, `shapeShadow`, `badgeShadow`, `pulseOpacity`, `groupStatusDisplay` |
| `colors` foreground pairs | `onPrimary`, `onSuccess`, `onError`, `onWarning`, `onTracing`, `onNodeCursor`, `onNodeVisited`, `onNodeMain` |

Set each foreground with its corresponding fill when adapting contrast to your
brand. Existing color roles and `fontFamily.sans` / `fontFamily.mono` remain
available. Legacy `radius` seeds all three component radii; an explicit
`radii.control`, `radii.panel` or `radii.badge` overrides its corresponding value.
`componentStyles(size)` exports the CSS-variable recipes for custom surfaces;
the existing numeric font-size and padding helpers remain available for math.

The `nodes` group and Paper presets are included in the 0.46.0 release.

The optional `nodes` group controls chart-card paint independently from the
state fill colors and panel recipes. For example, a dark outline and a small
offset shadow can surround pastel current/visited nodes. Omitted overrides
retain the existing per-state appearance; these tokens do not change recorded
status, selection or playback.

`radius` and `borderStyle` style rectangular, pill and group cards; decision
nodes keep their diamond shape. `shadow` uses CSS `box-shadow` syntax.
`shapeShadow` uses a CSS filter value for clipped decision shapes, for example
`"drop-shadow(2px 3px 0 #35332f)"` or `"none"`. A drop shadow does not accept
box-shadow spread or `inset` values.

`groupStatusDisplay` controls the small Selected / Visited / Failed cue in group
headers. It defaults to `"none"`; Paper uses `"inline-flex"` so a fixed outline
can coexist with visible cursor and recorded-state cues.

```tsx
<ExplainableShell
  runtimeSnapshot={snapshot}
  traceGraph={graph}
  theme={{
    mode: "light",
    tokens: {
      typography: { body: "0.875rem", small: "0.75rem" },
      spacing: { sm: "0.5rem", md: "0.75rem" },
      controls: { height: "2.25rem", iconSize: "1rem" },
      radii: { control: "0.375rem", panel: "0.75rem" },
      colors: { primary: "#4338ca", onPrimary: "#fff" },
    },
  }}
/>;
```

### Host design-system controls

`FootprintTheme.components`, also available as `ExplainableShell.theme.components`,
accepts `Button`, `Tab`, `Input`, `Checkbox`, `Badge`, `Code`, `Tooltip` and `Icon`
adapters. They must forward the native ref, events, `disabled` / `checked`, ARIA
and `data-*` attributes. Tooltip adapters receive `content`; Icon adapters
receive `name`. A native-compatible adapter can wrap your existing design
system:

```tsx
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { FootprintTheme } from "footprint-explainable-ui";

const AppButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  (props, ref) => <button {...props} ref={ref}
    className={["app-button", props.className].filter(Boolean).join(" ")} />,
);

<FootprintTheme components={{ Button: AppButton, Tab: AppButton }}>
  <ExplainableShell runtimeSnapshot={snapshot} traceGraph={graph} />
</FootprintTheme>;
```

Registered adapters receive explicit consumer `style`, never the primitive's
internal `defaultStyle`. Native fallbacks merge explicit `style` last.
`unstyled` suppresses fallback paint while preserving explicit style;
explicit `defaultStyle={undefined}` also opts out of a primitive's default
recipe. Nested providers merge token groups and component registries: omitted
or undefined fields inherit. They emit only local CSS overrides, so a nested
provider does not reset the host palette to a preset.

For custom icons on actual execution nodes, see the
[node icon consumer examples](examples/node-icons/README.md). They compare saved
icon names, built-in icons and application SVGs using the existing `Icon`
adapter, with examples for both `ExplainableShell` and `TraceViewer`.

Shared recipes and control adapters cover the core shell chrome, Inspector,
Activity, backtracking, time controls, run log, metrics and built-in stage-node
surfaces, plus the shell's breadcrumb, tree, memory, diff, result and timeline.
Ancillary exported components can retain their own presentation;
this is not a claim that every component consumes every new token or adapter.
Combine adapters with `renderLayout` and `unstyled`, or your own chart renderer,
when your application needs to own the complete presentation.

### ThemeProvider

```tsx
import { FootprintTheme, warmDark } from "footprint-explainable-ui";

<FootprintTheme tokens={warmDark}>
  <MyApp />
</FootprintTheme>
```

Use `asChild` when a wrapper would affect your flex/grid layout or direct-child
selectors. It applies local CSS variables to exactly one non-Fragment element
without adding a DOM wrapper, preserving that child's ref, events and authored
style. A custom child must forward `className` and `style` to its DOM root.

```tsx
<FootprintTheme asChild tokens={warmDark}>
  <section className="application-workspace"><MyApp /></section>
</FootprintTheme>
```

### Built-in Presets

| Preset | Description |
|---|---|
| `coolDark` | Default — indigo/slate dark theme |
| `warmDark` | Charcoal-purple with warm text |
| `warmLight` | Cream/peach light theme |
| `coolLight` | Light indigo theme |
| `paperLight` | Warm paper surfaces, pastel nodes, thin outlines and offset shadows |
| `paperDark` | Dark paper palette with the same restrained outlines and shadows |

Use Paper as an additional theme, or override individual tokens:

```tsx
import { ExplainableShell, paperLight } from "footprint-explainable-ui";

<ExplainableShell
  runtimeSnapshot={snapshot}
  traceGraph={graph}
  theme={{ mode: "light", tokens: paperLight }}
/>;
```

The [seven-workflow playground](examples/local-playground/README.md) includes a
Paper choice alongside its existing themes. This preset takes visual cues from
[Designed to Scale](https://designed-to-scale.vercel.app/#/design-chat/12); it
changes chart paint. The built-in **Isometric** renderer adds
fixed-angle SVG illustrations; it shares recorded selection and playback with
the existing panels and does not provide an orbit camera or infer infrastructure
facts from stage names.

---

## Components Reference

### Core Components

| Component | Description |
|---|---|
| `ExplainableShell` | Full Lens with Developer / Commentary details, collapsible panels and responsive layout |
| `LensControllerProvider` | Shared React owner for recorded data, exact scope, cursor, playback and Backtrack; renders only its children |
| `useLensController` | React hook for that owner's current data and semantic commands; root entry point |
| `LensReplayControls` | Stock transport bound to the shared controller, retaining its clock, axis and Backtrack stops |
| `useLensWorkbench` | Read the full shell's surfaces, state and validated actions inside its custom layout; root entry point |
| `TimeTravelControls` | Play/pause, prev/next, scrubber timeline |
| `MemoryPanel` | Memory state + scope diff (composite right-panel view) |
| `NarrativePanel` | Narrative trace with progressive reveal |
| `StoryNarrative` | Rich rendering of structured `NarrativeEntry[]` |
| `NarrativeTrace` | Collapsible stage groups with progressive reveal |
| `NarrativeLog` | Simple timeline-style execution log |
| `ScopeDiff` | Side-by-side scope changes (added/changed/removed) |
| `ResultPanel` | Final pipeline output + console logs |
| `MemoryInspector` | Accumulated memory state viewer |
| `GanttTimeline` | Horizontal duration timeline (collapsible) |
| `SnapshotPanel` | All-in-one inspector (scrubber + memory + narrative + Gantt) |
| `TraceViewer` | Renders a saved `{ snapshot, structure }` recording — parse, diagnose, draw; forwards the full Lens audience, commentary, replay options, JSON layout and custom layout callback |
| `StageDetailPanel` | Stage description and narrative, or an accumulated-memory change ledger |
| `InspectorPanel` | Activity when supplied, plus State and Data Trace, time-travel synced |
| `StageActivityPanel` | Exact-visit narrative, recorded reads, committed changes and variable inspection |
| `DataTracePanel` | Recorded state-read links as a stack — click a frame to inspect that step |
| `TraceWalkCard` | The tracing stop card with recorded-read chips, an investigation trail and Copy story |
| `InvestigationPanel` | Host-bound, on-demand recorded cause and impact results with unknown evidence states |
| `GroupedFlowInvestigation` | Grouped run diagram with on-demand recorded cause, backward relationships and impact |
| `FailureExplanationView` | Optional plain-language problem, recorded cause and suggested next step with uncertainty kept visible |
| `InsightPanel` | Recorder outputs as tabs or a grid — Story, Performance, Quality, Cost |
| `CompactTimeline` | Collapsed = a row of dots, expanded = the Gantt. The shell's footer |

### Composable surfaces (`ExplainableView`)

One frozen recording, one cursor, independent surfaces. Every surface below
reads and moves the same index — that is what the provider is for.

| Export | Description |
|---|---|
| `ExplainableProvider` | Parses the recording once and holds the ONE cursor every surface shares |
| `useExplainableRun` | Read that cursor (and the parsed run) from your own component |
| `ExplainableView` | The assembled workbench — a preset, a grid of `areas`, or `slots` |
| `TimeTravelBar` | Transport controls: play/pause, prev/next, the scrubber |
| `TimelinePanel` | The vertical stage rail |
| `FlowchartPanel` | The chart surface, already wired to the cursor |
| `ValueInspector` | State + changes at the cursor's moment |
| `CommentaryPanel` | Recorded-prefix or selected-visit commentary; works in the basic provider and full Lens custom layout |
| `CompactTimelinePanel` | The provider-wired `CompactTimeline` — no data props |
| `SurfaceCollapseHandle` | The line + pill handle, for collapsing a surface of your own |

`CompactTimeline` and `CompactTimelinePanel` are not duplicates and neither is
going away: the first is the **controlled primitive** (you pass `snapshots` and
`selectedIndex`, so it works anywhere — it is what `ExplainableShell` puts in
its footer); the second is the **provider-wired surface** that renders it and
takes no data props at all. Inside a provider use the Panel; outside one, only
the primitive can work.

### Theme API

Theme primitives, `useFootprintComponents` and `componentStyles` are available
from both `footprint-explainable-ui` and `footprint-explainable-ui/flowchart`.

| Export | Description |
|---|---|
| `FootprintTheme` | Inheriting token and native-control adapter provider |
| `useFootprintTheme` | Read the merged token context |
| `useFootprintComponents` | Read the inherited host adapter registry |
| `componentStyles` | CSS-variable recipes for typography, density and control geometry |
| `FootprintButton` | Native-compatible button with an optional host adapter |
| `FootprintTab` | Native-compatible tab button; uses the Tab adapter or Button fallback |
| `FootprintInput` | Native-compatible input with an optional host adapter |
| `FootprintCheckbox` | Native-compatible checkbox; preserves checked state and events |
| `FootprintBadge` | Badge primitive using the host registry or native span |
| `FootprintCode` | Code primitive using the host registry or native code element |
| `FootprintTooltip` | Host tooltip adapter or native-title fallback; receives content |
| `FootprintIcon` | Named semantic icon using the host adapter or supplied children |
| `useDarkModeTokens` | Follow your app's OWN dark-mode switch (class or selector) and hand back the matching preset |
| `themeModeVars` | The `--fp-*` variables for one mode, ready to spread onto your own wrapper |
| `tokensToCSSVars` | Turn a token object into that variable map yourself |
| `defaultTokens` | The shipped default token set (dark) |
| `rawDefaults` | The same defaults as plain values, with no `var()` indirection |
| `themePresets` | All six built-in presets, by name |

### Utilities

| Export | Description |
|---|---|
| `buildEntryRangeIndex` | Index narrative entries by `runtimeStageId` for O(1) slider sync |
| `computeRevealedEntryCount` | How many story lines are true as of the cursor's step |
| `extractSubflowNarrative` | Just one subflow's lines out of a run's story |
| `buildTraceWalk` | The local value-tracing walk with recorded stops and stage reads for one key |
| `formatTraceWalk` | That walk as the exact text an LLM backtrack tool returns |
| `projectTraceInvocation` | Select one exact recorded child invocation and its scope for UI or agent trace text |
| `projectStageActivity` | Project one exact visit's bounded narrative, reads, committed changes and decisions |
| `formatStageActivitySummary` | Format the same stage activity projection for copying or tools |
| `mergeWritePatch` | Replay a commit patch onto a state object (objects merge; arrays REPLACE) |
| `DEFAULT_EXCLUDED_KEYS` | The keys `StageDetailPanel` hides by default |

### Flowchart Components (`footprint-explainable-ui/flowchart`)

This entry has a wider surface than the four names most people use, so here
is all of it — grouped by the job, one line each. Nothing below is
experimental; the ones you will actually reach for are in the first table.

**Draw the chart**

| Export | Description |
|---|---|
| `TracedFlow` | The chart plus the run — overlay colouring, drill-down, breadcrumb, auto-fitView |
| `TraceFlow` | Build-time chart only (no overlay) |
| `StageNode` | The flat node renderer: state-aware colouring, step badges, retry-attempt chip, pulse rings |
| `IsometricStageNode` | Illustrated SVG stage renderer with the same recorded facts, semantic icons and native connection ports |
| `IsometricEdge` | Straight SVG connector preserving authored labels, markers, paint and interaction width |
| `IsometricGrid` | Viewport-clipped vector floor in chart world coordinates; included by the isometric renderer |
| `SubflowTree` | Tree view of all subflows (the shell's left panel) |
| `NodeInspector` | What one node is and where it sits, from a `NodeView` index |
| `CommitInspector` | What one commit wrote, and what it read to write it |
| `CommitChainView` | The run as a git-log-style swim lane of commit chains |
| `TraceExplorerShell` | The whole L8 stack composed: chain tree + inspectors + slider |
| `RunSlider` | The one-cursor time-travel slider |
| `LoopBackEdge` | The curved `loopTo` back-edge. Built in — export is for consumers who replace `edgeTypes` wholesale |
| `SmartStepEdge` | The rank-skipping edge that routes around skipped nodes. Also built in |

**Feed the chart**

| Export | Description |
|---|---|
| `createTraceStructureRecorder` | Collect the `TraceGraph` while footprintjs builds the chart |
| `graphFromStructure` | The same graph from a SAVED `chart.buildTimeStructure` |
| `createTraceRuntimeOverlay` | Collect the `RuntimeOverlay` from a live run |
| `overlayFromSnapshot` | The same overlay from a recorded snapshot |
| `createTraceBundle` | All four translators + one `attachTo(executor)` call |
| `useTranslator` | Subscribe a React component to any translator's snapshot |

**Change what the chart shows**

| Export | Description |
|---|---|
| `filterGraphForDrill` | Narrow a graph to one subflow's insides — keyed by the MOUNT NODE'S id |
| `buildSubflowBreadcrumb` | The trail back out of that drill |
| `collapseTraceGraph` | Hide caller-chosen nodes; edges contract through them, and you get back what was hidden |
| `sliceOverlay` | The overlay as of step N: done / active / executed / retry counts |

**Layout**

| Export | Description |
|---|---|
| `dagreTraceLayout` | The default structure-derived layout |
| `createDagreTraceLayout` | The same, with your options |
| `defaultTraceFlowLayout` | The default flat positioning used by `TraceFlow` |
| `isometricTraceLayout` | Default fixed-angle positioning with a 168×116 built-in stage footprint |
| `createIsometricTraceLayout` | Configure isometric positioning with a `nodeSize` resolver or `fixedStageNodes: false` for custom stage renderers |
| `ISOMETRIC_NODE_WIDTH` | Built-in isometric stage footprint width: 168 CSS pixels |
| `ISOMETRIC_NODE_HEIGHT` | Built-in isometric stage footprint height: 116 CSS pixels |
| `snapLinearSuccessors` | Post-dagre pass: snap linear successors onto their predecessor's centre-x |
| `createSnappedDagreLayout` | Dagre + that snap pass, composed |
| `traceGroupLayout` | Rank bands + span-centred merges, for staggered structured charts |
| `createTraceGroupLayout` | The same, with your options |
| `applyGroupLayout` | Nest a graph's nodes inside subflow group containers |
| `createGroupedLayout` | A layout that applies grouping over any base layout |
| `wrapInMainChartBox` | Wrap the whole chart in one titled container box |
| `createMainChartBoxLayout` | A layout that does that wrapping |
| `GroupContainerNode` | The container node type those layouts emit |
| `SlotPillNode` | The pill node used for a group's slots |
| `GROUP_CONTAINER_NODE_TYPE` | Its node-type key, for a custom `nodeTypes` map |
| `MAIN_CHART_BOX_ID` | The id of the wrapper box, so you can find or skip it |

**Read the run as data (translators + walks)**

| Export | Description |
|---|---|
| `createNodeViewRecorder` | Per-stage summary index (what ran, in what order, with what) |
| `createCommitFlowRecorder` | Per-commit summary index + data lineage |
| `walkForward` / `walkBackward` | BFS over the structure from one node, either direction |
| `backtraceStructural` / `forwardtraceStructural` | The same two walks, named for what they answer |
| `backtraceDataFlow` | Which commits fed this commit — lineage, not topology |
| `structureAsChainTree` | The chart as series/parallel chains (no run needed) |
| `buildCommitChainTree` | The same chains, filled in with what actually committed |

### Adapters

| Export | Description |
|---|---|
| `toVisualizationSnapshots` | Convert `FlowChartExecutor.getSnapshot()` → `StageSnapshot[]` |
| `graphFromStructure` | Rebuild the chart's `TraceGraph` from a saved `chart.buildTimeStructure` — the post-hoc twin of `createTraceStructureRecorder` |
| `overlayFromSnapshot` | Rebuild the chart's `RuntimeOverlay` from a recorded snapshot (replay without a live executor). Retry attempts come from the snapshot's tree (footprintjs ≥ 10.1); for a 9.15–10.0 recording pass `{ narrativeEntries }` |
| `narrativeFromSnapshot` | Read the narrative a recorded snapshot carries in `snapshot.recorders` |
| `subflowResultToSnapshots` | Convert subflow result → `StageSnapshot[]` |
| `createSnapshots` | Build `StageSnapshot[]` from simple arrays (testing/custom data) |

### Types

| Export | Description |
|---|---|
| `PanelLabels` | `{ topology?, details?, timeline? }` — pill label customization |
| `DefaultExpanded` | `{ topology?, details?, timeline? }` — initial panel state |
| `LensView` | `"developer" \| "story"` — details audience; `"story"` is labelled Commentary in the UI |
| `LensLayoutDefinition` | JSON-compatible full Lens `columns`, optional `rows`, named `areas`, optional `minHeight` and `gap` |
| `LensLayoutSurface` | Full Lens area names: `timeTravel`, `flowchart`, `developer`, `commentary`, `timeline`, or combined `details` |
| `LensCommentaryOptions` | Optional commentary title, presentation, stage grouping, follow-cursor, entry-type badges, line limit, empty text and entry renderer |
| `ReplayControlsOptions` | Optional `previousNext`, `playPause`, `slider` and fixed `intervalMs` replay settings |
| `StageSnapshot` | Core snapshot type for all components |
| `NarrativeEntry` | Structured narrative entry with type/depth/stageName |
| `Recording` | `{ snapshot, structure, events }` — one saved run, read by `<TraceViewer>` and by lens's `observeRecording` |
| `ThemeMode` | `"dark" \| "light"` — the one-word switch |

### Deprecated

Still exported, still working, still tested — and going away in the next
major. Each row says what to use instead; each one also prints the same
sentence to the console once, in dev, the first time it renders.

| Deprecated in 0.38.0 | Why | Use instead |
|---|---|---|
| `TimeTravelDebugger` | It owns its cursor — the scrubber index is local state with no `selectedIndex` / `onIndexChange`, so nothing outside it can move the time position or read it. That is why no shipped surface in this library uses it, and it is why it overlaps `SnapshotPanel` feature for feature without being composable | `SnapshotPanel` (the same panels, controlled), `ExplainableShell` (those plus the chart), or `footprint-viewer` |
| `useSubflowNavigation` | It keys the drill by the child chart's LOCAL `subflowId`, which is **not unique** — mount the same chart twice and both mounts report the same key, so a filter keyed on it shows the other mount's stages, or nothing. Its `currentGraph` also never swaps to the child's graph, so the chart never actually narrows | `TracedFlow`'s built-in drill (`currentSubflowId` + `onSubflowChange`, keyed by the mount NODE'S id), or `filterGraphForDrill` directly |
| `SubflowBreadcrumb` | The display half of that same pair — it renders a `useSubflowNavigation` stack and nothing else produces one | `TracedFlow` (it draws its own trail), or `buildSubflowBreadcrumb(graph, mountNodeId)` |

### Narrative entry kinds

Every `NarrativeEntry` carries a `type`. `<StoryNarrative>` gives each one its
own badge — the icon you see, and the label a screen reader hears:

| `type` | Badge | Label | What it means |
|---|:---:|---|---|
| `stage` | ▸ | Stage | A stage ran. Gets a heading number. |
| `step` | · | Data operation | One read or write inside a stage. |
| `condition` | ◇ | Decision | A decider chose a branch. |
| `fork` | ⑃ | Parallel | A fan-out started. |
| `selector` | ⑃ | Selector | A selector chose which branches run. |
| `subflow` | ↳ | Subflow | Entering or leaving a mounted subflow. |
| `loop` | ↻ | Loop | A `loopTo` back-edge was taken. |
| `break` | ■ | Break | `$break()` ended the loop. |
| `error` | ✗ | Error | The stage failed. |
| `pause` | ‖ | Paused | The run stopped and is waiting on someone. |
| `resume` | ▷ | Resumed | It carried on from the checkpoint. |
| `emit` | ◈ | Emitted event | Your own `scope.$emit` telemetry. |
| `retry` | ↺ | Retry | One attempt failed and the stage is running again (footprintjs 9.15–10.0). |
| `attempt` | ↺ | Attempt | One attempt of a retried stage: how it ended, how long it took, and whether the stage tries again (footprintjs ≥ 10.1). |

Two kinds are worth reading twice. **`retry`** (footprintjs 9.15–10.0) is
*attempt* telemetry, not an outcome — the entry's text carries the arithmetic
("attempt 2 of 3 at FetchQuote failed"), it nests inside its own stage, and the
stage may still succeed, so it is warning-weight rather than error-weight. All
attempts share ONE step on the time-travel rail, so a retried stage never
multiplies your cursor — and the flowchart says the same thing with the same
arrow (see the attempt chip above), so the two surfaces never disagree.
**`loop`** and **`retry`** deliberately use different arrows: ↻ is a by-design
back-edge, ↺ is a failure going round again. footprintjs 10.1 replaces the
`retry` line with one **`attempt`** line per attempt, styled the same way.

A kind from a newer footprintjs than this release knows about still compiles
and still renders. `NarrativeEntry['type']` accepts any string, so handing
`executor.getNarrativeEntries()` to a component here never breaks your build
when the engine gains a kind. The entry gets a plain `◦` badge labelled
"Narrative entry" and its text as the engine wrote it.

In `unstyled` mode each entry also carries `data-type="<kind>"`, so you can
style any kind — including a future one — by selector:

```css
[data-fp="narrative-entry"][data-type="retry"] { color: #b45309; }
```

---

## Recipes

One runnable snippet per part that the reference tables above name but no
section shows. Each is the smallest honest use.

**`collapseTraceGraph` — hide nodes, and say how many**

```tsx
import { collapseTraceGraph, TracedFlow } from "footprint-explainable-ui/flowchart";

// The predicate is YOURS — this library special-cases no id convention.
const { graph, hiddenNodeIds } = collapseTraceGraph(
  trace.getGraph(),
  (node) => node.id.startsWith("sf-internal/"),
);

<TracedFlow graph={graph} overlay={overlay} />;
<p>{hiddenNodeIds.length} steps hidden</p>;
```

**`filterGraphForDrill` — show one subflow's insides**

```tsx
import { filterGraphForDrill, buildSubflowBreadcrumb, TraceFlow } from "footprint-explainable-ui/flowchart";

const mountId = "pipeline/prepare";                       // the MOUNT NODE'S id
const inside = filterGraphForDrill(graph, mountId);       // null = top level
const trail = buildSubflowBreadcrumb(graph, mountId);

<TraceFlow graph={inside} />;
<nav>{trail.map((crumb) => crumb.label).join(" › ")}</nav>;
```

**`sliceOverlay` — what had run by step N**

```ts
import { sliceOverlay } from "footprint-explainable-ui/flowchart";

const at = sliceOverlay(overlay, 3);   // the same slice <TracedFlow scrubIndex={3}> paints
at.activeStageId;    // "process" — the stage the cursor sits on
at.doneStageIds;     // Set { "seed", "validate" }
at.retryAttempts;    // Map { "fetch" => 3 } — only stages that needed more than one attempt
```

**The narrative-sync trio — reveal the story as the cursor moves**

```ts
import {
  buildEntryRangeIndex, computeRevealedEntryCount, extractSubflowNarrative,
} from "footprint-explainable-ui";

const index = buildEntryRangeIndex(entries);                          // once per run
const shown = computeRevealedEntryCount(entries, snapshots, idx, index);
const storySoFar = entries.slice(0, shown);                           // true as of step `idx`
const justPricing = extractSubflowNarrative(entries, "sf-pricing");   // one subflow's lines
```

**`themeModeVars` — put the built-in palette on your own wrapper**

```tsx
import { themeModeVars, MemoryInspector } from "footprint-explainable-ui";

// Same variables `theme="light"` stamps — but on an element you own,
// so everything underneath (yours included) follows it.
<div style={{ ...themeModeVars("light"), padding: 16 }}>
  <MemoryInspector snapshots={snapshots} selectedIndex={idx} />
</div>;
```

**`mergeWritePatch` — replay a commit patch onto state you already have**

```ts
import { mergeWritePatch } from "footprint-explainable-ui";

mergeWritePatch({ user: { id: 1, name: "Ada" } }, { user: { name: "Grace" } });
// → { user: { id: 1, name: "Grace" } }   objects merge per key

mergeWritePatch({ tags: ["a", "b"] }, { tags: ["c"] });
// → { tags: ["c"] }                      arrays REPLACE, deliberately
```

## Size Variants

All components accept a `size` prop: `"compact"`, `"default"`, or `"detailed"`.

```tsx
<GanttTimeline snapshots={snapshots} size="compact" />
<MemoryInspector snapshots={snapshots} size="detailed" />
```

## Unstyled Mode

Strip all built-in styles for full CSS control. Components render semantic `data-fp` attributes:

```tsx
<NarrativeTrace narrative={lines} unstyled className="my-narrative" />
```

```css
[data-fp="narrative-header"] { font-weight: bold; }
[data-fp="narrative-step"] { padding-left: 2rem; }
```

---

## Golden-Trace Fixtures (contributors)

The pipeline (structure/runtime translators, dagre layout, snapshot adapter,
narrative sync) is pinned against **real footprintjs engine output**, not
hand-built mocks. `test/fixtures/golden/` holds recorded traces from 5
representative charts (linear+decider, subflow+loop, parallel fork,
pause/resume, retry attempts); `test/golden/goldenTraces.test.ts` replays them through the full
pipeline and snapshot-asserts the outputs in `test/golden/__snapshots__/`.

- **Engine shape changed** (new footprintjs): `npm i -D --save-exact footprintjs@<version> && npm run fixtures:regen`. The generator runs every chart twice and fails on any nondeterminism.
- **Pipeline output changed intentionally** (eui edit): `npx vitest run test/golden -u`, then review the snapshot diff.
- `test/fixtures/golden/manifest.json` records the footprintjs version the fixtures were recorded with.

`footprintjs` is a devDependency used ONLY by the generator — the published
library still has zero footprintjs dependency (it consumes plain JSON shapes).

## On-demand investigation

### Optional plain-language explanations

`FailureExplanationView` displays an explanation already admitted by the host.
It keeps three sections—Problem, Recorded cause and Suggested next step—beside
an always-visible Still unknown area. Optional authored copy is labelled Business
guidance and appears alongside canonical text. It cannot grant permission,
execute a repair, choose a root cause or load a recording.

The required `canonicalFindings` preserves complete causes, consequences and
recording failures. The latter two appear in separate visible sections, rather
than disappearing from the explanation or being relabelled as causes. Complete
cause codes and references remain available in the cause details.

An empty `unknowns` list means the supplied list is empty; it does not establish
that everything is known, and the verification disclaimer stays visible. Section
text, configured guidance and finding summaries use `white-space: pre-wrap`.
These plain strings carry no substring-origin metadata, so a quoted source value
can wrap into apparent body text; HTML escaping does not identify its origin.
Keep untrusted quoted values in host-owned, clearly labelled presentation. If a
formatter normalizes a display copy, label that change and preserve the original
bound evidence; leave canonical IDs, references and recorded evidence unchanged.
Whitespace collapse alone does not establish origin.

```tsx
import { FailureExplanationView, FootprintTheme, coolLight } from 'footprint-explainable-ui';

// The host formats an admitted diagnosis and binds it to the exact selected
// recording/item. Clear it whenever that selection changes.
<FootprintTheme tokens={coolLight}>
  <FailureExplanationView explanation={selectedExplanation ?? null} />
</FootprintTheme>
```

Canonical findings may include an optional readonly `level`: `HIGH`, `MEDIUM`,
`LOW` or `UNVERIFIED`. It is an assessment supplied by the host. Each list keeps
its source order and shows neutral **Host level: HIGH** badges through the
existing theme Badge adapter, with a visible statement that the view does not
verify those levels. Absence stays unlabelled; no level is inferred from a code,
summary, health, confidence or another finding.

```tsx
import type { FailureExplanationDisplayFinding } from 'footprint-explainable-ui';

const hostFinding: FailureExplanationDisplayFinding = {
  code: 'STEP_FAILED',
  summary: 'The step recorded a failure.',
  evidenceRefs: ['record:failure'],
  level: 'HIGH', // Explicit host assessment, not a verification claim.
};
// A finding in causes, consequences or diagnosticFailures may carry this field.
```

Migration: `level` is now a recognized own field. Unsupported values or accessors
refuse the complete view; use an exact supported host level or remove unsupported
metadata. Accepted levels charge their UTF-16 length, including repetitions,
against the existing text budget. A near-limit model that previously carried
ignored level metadata may now refuse. Missing, own-undefined and inherited-only
levels preserve the previous DTO, markup and usage; no cap is raised.

Producer-formatted explanations are structurally assignable; this UI component
has no runtime dependency on the producer. Evidence references are opaque text in
disclosures, never links or selection authority. A malformed, accessor-backed or
over-budget model refuses the whole view, with a message that the cause and
outcome remain unknown. Display bounds are 262,144 UTF-16 text code units total,
1,024 entries per list, 4,096 total nested list items and 4,096 code units per
reference/unknown. All canonical finding text counts toward these limits. This is shape
admission, not producer authentication or a JavaScript Proxy sandbox. Existing
viewers and diagrams are unchanged until the host explicitly adds this component.

Every canonical finding code must match `/^[A-Z][A-Z0-9_]{1,79}$/`: 2–80 ASCII
characters, starting with an uppercase letter and followed only by uppercase
letters, digits or underscores. Empty codes, lowercase and whitespace are invalid.
An invalid code refuses the whole view.

**Section hooks:** the outer section carries
`data-fp="failure-explanation"` in admitted and refused states. Admitted section
containers use fixed `data-section` values: `problem`, `recordedCause`,
`suggestedNextStep`, `consequences`, `recording` and `unknowns`. Optional outcome
and recording sections retain their existing presence rules; refusal has no
admitted section markers. These values repeat between instances, so scope a
lookup to a host container holding one explanation:

```ts
const view = hostElement.querySelector<HTMLElement>('[data-fp="failure-explanation"]');
view?.querySelector<HTMLElement>('[data-section="recordedCause"]')?.scrollIntoView();
```

The markers support section lookup and scrolling only. Unique generated heading
IDs and their `aria-labelledby` bindings remain intact; internal ID suffixes are
not a lookup contract. A marker grants no recording selection, evidence authority
or repair action. Both standalone panels inherit tokens from `FootprintTheme`;
neither requires a new theme prop.

### Recorded cause and impact panel

`InvestigationPanel` is a standalone, optional panel. Existing viewers and their
selected visits do not change. The host supplies a bounded canonical attention
list and handles each explicit investigation with Foottrace's `explain` API.
No query runs on mount. Recorded paths, other candidates, affected items and evidence
references start collapsed; selecting a related item requests only that item.
The **Other candidates** list omits the selected item's exact ID from navigation.
A note preserves its supplied candidate membership; a selected-only list does not
establish a root cause. Canonical `alternatives`, their order and checker results
remain intact. This display filter does not change root, attention or coverage.

Set `coverageMode="directional"` on `InvestigationPanel` or
`GroupedFlowInvestigation` to separate backward evidence, affected-item coverage,
overall coverage with no supplied direction, and attention coverage. Gaps group
within each context by code; **supplied entries** counts lead to every original
entry, item ID and reference, including duplicates. Confidence is source-reported;
neither an empty gap list nor a complete flag verifies the underlying evidence.

The host supplies backward relationships. The view does not collect them or infer
their direction from aggregate gaps. Missing backward coverage stays unknown;
any supplied root is labelled **Reported root cause**, with no supported badge.
A supported backward root remains supported when only affected-item coverage is
incomplete. Existing inconsistent-root refusals and display limits still apply.

The default `coverageMode="overall"` keeps the existing presentation and text
projection. Changing the standalone admission mode cancels and clears its old
investigation; another explicit investigation is required. Grouped investigation
already retains relationships, so its presentation can switch without a query.
Invalid modes show an unavailable state without offering an investigation.

An explicit investigation moves keyboard focus into the selected explanation.
Closing it restores focus to the original attention item, including after
following related items or opening an item beyond the first attention page.

```tsx
import { useMemo } from "react";
import { FootprintTheme, InvestigationPanel, coolLight, type InvestigationPort } from "footprint-explainable-ui";
import { explain } from "foottrace/cause";

function RunInvestigation({ session }) {
  // session is a trusted host object for ONE tenant/run/source and exact
  // invocation, attempt and visit. Replace it when any of these changes.
  const port = useMemo<InvestigationPort>(() => ({
    binding: session,
    attention: session.attention,
    labels: session.labels, // include exact visit/attempt labels when relevant
    explain: (nodeId, { signal }) => explain(session.graph, nodeId, {
      signal, maxNodes: 128, maxEdges: 256, maxCalls: 512, timeoutMs: 2_000,
    }),
  }), [session]);
  return (
    <FootprintTheme tokens={coolLight}>
      <InvestigationPanel port={port} />
    </FootprintTheme>
  );
}
```

**Show recorded path** expands the accepted result's `path` reference list; it
does not reconstruct dependency edges or make another query. For the richer
recorded backward graph, use `GroupedFlowInvestigation`, which already includes
its investigation panel. Its cause view uses supplied `backward.nodes` and
`backward.edges`; without that data, path references do not establish missing
connections. Use the same exact host-bound `InvestigationPort` contract and
opaque node IDs for the diagram and query. Labels do not resolve identity. See
[the grouped composition](#click-an-item-to-investigate-its-recorded-cause-unreleased).

The host binds authorization, tenant, run, storage, exact selected scope and
query/storage budgets before creating the port. A request contains only the
opaque canonical `NodeId` already supplied by that host, plus cancellation.
Create a new `binding` identity whenever the bound evidence or selected
invocation, attempt, visit or run changes. Ordinary rerenders and callback
replacements with the same binding preserve the open query. Source mutation in
place is unsupported: replace the binding when evidence changes. Late results
from a previous binding or closed panel are ignored even if the host ignores
cancellation. `port={null}` explicitly presents an unavailable investigation.

The panel displays Foottrace's selected root and alternatives; it does not walk,
rank or discover a graph. A supported root can coexist with incomplete forward
impact evidence. Missing evidence, not-collected outcomes, unlisted effects and
unsupported results stay unknown. The canonical-derived `InvestigationResult`
omits unused impact edges, so new edge attribution metadata can pass through a
host without translation. Unknown future gap codes are refused explicitly.

Display admission checks only the fields it uses: each node list has at most
256 entries, each item at most 16 attention marks, each gap list at most 128
entries, each evidence list at most 32 references, free-form projected
strings at most 2,048 code units each and 65,536 combined per result. Fixed enum
text is separately bounded by its closed vocabulary and the list limits. Names are plain
escaped text, capped at 512 code units; IDs remain the selection identity.
Unsupported, mismatched, oversized, sparse or accessor-backed projected fields
produce a fixed unavailable message. Unused graph metadata is neither inspected
nor displayed. This is display admission, not authentication or a JavaScript
sandbox. The host still enforces storage admission and actual query work limits.

No storage adapter ships in this panel. Supplying an already loaded archive does
not establish storage-I/O laziness; per-scope receipt and ownership admission is
required before a future indexed loader can expose a scope. Foottrace remains
the owner of graph traversal and source interpretation.

### Reuse gap sentences and name mark kinds

Import `investigationGapMessage` from the root entry to obtain the exact sentence
shown for a recognized gap code. Unknown codes return `undefined`, allowing the
host to keep an unfamiliar code explicit without inventing an explanation.

```tsx
import { investigationGapMessage, InvestigationPanel } from "footprint-explainable-ui";

const sentence = investigationGapMessage("not-collected");
const markLabels = Object.freeze({ error: "Recorded failure", "domain-rule": "Review needed" });
<InvestigationPanel port={port} markLabels={markLabels} />;
```

`GroupedFlowInvestigation` accepts the same `markLabels` prop through both its
root and `/flowchart` entries. Labels match the exact mark kind; `port.labels`
continues naming node IDs. The eight built-in names and unknown raw kinds remain
the default. Only used own data strings of 1–512 UTF-16 units are accepted;
missing, inherited, accessor, invalid, overlong or unreadable entries retain the
default. Values render as escaped text, including a value equal to the raw kind.
No label is a verification, severity or causal claim, and no evidence is altered.

The map is readonly in types; replace it to update names. No host-map enumeration,
mutation, getter invocation, callbacks or HTML is supported. Proxy descriptor
traps remain executable host code; fallback handling is not a JavaScript sandbox
or a time limit. The existing mark/list caps bound used lookups per render; host
copy is additional display text outside canonical evidence usage accounting.
Changing labels preserves query, source binding, selection and focus. The
sentence function is root-only; its private bank and default-name helpers are
not public exports.

### Preflight the display projection

These display helpers and limits are exported from the root entry:

| Export | Description |
|---|---|
| `investigationGapMessage` | Exact canonical sentence for a recognized gap code, otherwise undefined |
| `checkInvestigationAttention` | Admit the same bounded attention projection used by the panel |
| `checkInvestigationExplanation` | Check the default text or explicit relationship projection for one bound selected ID |
| `checkFailureExplanationDisplay` | Check the exact failure-explanation projection and its finding-code rules |
| `investigationDisplayLimits` | Frozen primitive limits for attention and explanation display admission |
| `failureExplanationDisplayLimits` | Frozen failure-display limits and finding-code pattern string |

Use the root-exported display checks before handing unknown data to a panel:

```tsx
import {
  checkFailureExplanationDisplay, checkInvestigationAttention,
  checkInvestigationExplanation, failureExplanationDisplayLimits,
  investigationDisplayLimits, FailureExplanationView,
} from 'footprint-explainable-ui';

const checked = checkFailureExplanationDisplay(rawExplanation);
// A host can log checked.diagnostic when checked.ok is false.
<FailureExplanationView explanation={checked.ok ? checked.value : null} />;

const attention = checkInvestigationAttention(rawAttention);
const text = checkInvestigationExplanation(rawResult, exactSelectedNodeId);
const relationships = checkInvestigationExplanation(rawResult, exactSelectedNodeId, 'relationships');
```

The checks use the panels' actual parsers and return the detached admitted
projection with `ok: true`. The default explanation profile retains the text
fields and leaves `backward` and impact edges unread. The explicit
`relationships` profile uses the grouped view's existing bounded relationship
and root/path consistency checks. Bind the selected ID and recording in the
host before querying or displaying either result.

On `ok: false`, `diagnostic` contains one closed rule code and a bounded path of
schema fields and array indices. A limit refusal can include its limit name,
maximum and observed count. It contains no partial result, raw value, node ID,
reference or foreign exception details. The reader-facing refusal stays generic;
the host chooses whether to log the diagnostic. The check stops at the first
refusal, so it does not report an exact whole-input cost for a refused model.

On success, `usage.textCodeUnits` counts the parser-budgeted free text in UTF-16
code units and `usage.listItems` counts admitted list slots, including repeated
occurrences. Fixed enum wording is bounded separately. This is not serialized
size, rendered-page size or graph-query work. The frozen primitive-only
`investigationDisplayLimits` and `failureExplanationDisplayLimits` expose the
same fixed caps used by the parsers; the finding-code pattern is a string. There
is no automatic fit/trimming or per-call budget override. A producer's query
budget alone cannot guarantee that its labels, references and gap lists fit.

Ordinary getters, array methods/iterators and ignored fields remain unread;
sparse or inconsistent selected fields refuse the whole projection. JavaScript
Proxy reflection is not sandboxed. Successful structural admission does not
authenticate the producer, verify evidence, discover graph relationships or
establish completeness beyond the supplied display projection.

## The footprintjs ecosystem

The self-explaining stack — from backend pipelines to AI agents. → **[overview](https://footprintjs.github.io/)**

| Project | Role |
|---|---|
| [footprintjs](https://footprintjs.github.io/footPrint/) | the flowchart pattern (core engine) |
| [agentfootprint](https://footprintjs.github.io/agentfootprint/) | build self-explaining AI agents |
| **Explainable UI** ← you are here | visualize a footprintjs run |
| [Lens](https://github.com/footprintjs/agentfootprint-lens) | debug an agentfootprint run |
| [Thinking UI](https://footprintjs.github.io/agentThinkingUI/) | replay an agent run for non-devs |

---

## License

MIT

## Grouped flow diagrams (unreleased)

`GroupedFlowDiagram` is an optional, data-first view for an owner who wants to open a flow card, inspect its steps, and follow a recorded problem. It reuses the package's group frame, ReactFlow canvas and existing Dagre dependency. Group projection and layout live in one pure module; this does not add another execution engine, storage reader or cause-finding algorithm.

```tsx
import { GroupedFlowDiagram } from 'footprint-explainable-ui/flowchart';
import '@xyflow/react/dist/style.css';

const definition = {
  nodes: [
    { id: 'payment-instance-1', label: 'Payment', kind: 'group', icon: 'card' },
    { id: 'authorize-visit-1', label: 'Authorize card', parentId: 'payment-instance-1' },
    { id: 'capture-visit-1', label: 'Capture payment', parentId: 'payment-instance-1' },
  ],
  edges: [{ id: 'authorize-capture', source: 'authorize-visit-1', target: 'capture-visit-1' }],
} as const;

<GroupedFlowDiagram
  definition={definition}
  // These are example facts supplied by an admitted recording, not display settings.
  observation={{ nodeStates: { 'authorize-visit-1': 'completed' } }}
  defaultExpandedGroupIds={['payment-instance-1']}
  onSelectNode={nodeId => inspectThatExactRecordedItem(nodeId)}
/>;
```

The same component and types are exported from the root entry. The runnable [grouped-flow example](examples/grouped-flow/README.md) includes configuration, explicit synthetic observations, branch labels and a fixed recorded-path highlight. `/nested.html` demonstrates two instances of Payment and repeated Validate names.

### Structure, facts and emphasis

- `definition` contains app-approved plain labels, descriptions, icon hints, group-instance `parentId` values and possible transitions. It must describe the same definition/version as the recording. IDs identify the exact instance/visit, not a reusable flow's name. Rendered Group/Item captions disambiguate repeated names; their numbers are reading aids, not execution order.
- `observation.nodeStates` accepts `unknown`, `running`, `completed`, `failed` and `not-run`. `edgeStates` accepts `unknown`, `observed` and `not-taken`. An omitted state stays unknown. Only an explicit recorded state produces a completed badge or a not-run label. A completed step says nothing about external settlement or delivery without the host's appropriate receipts.
- A group does **not** become completed because its children completed. It can show recorded issues inside while its own outcome remains unknown. Contradictory observations, such as an observed edge touching a not-run step, are refused.
- `highlight` contains exact node/edge IDs supplied by the host. For cause and impact, use the existing canonical Foottrace result through the host's investigation adapter. Emphasis never walks design predecessors or asserts a root cause. A collapsed group can carry the emphasis of a hidden member; projected edges retain the original edge ID and do not create new relationships.

### Expansion and interaction

Use `defaultExpandedGroupIds` for local expansion state, or `expandedGroupIds` plus `onExpandedGroupIdsChange` for controlled expansion. With controlled IDs and no change callback, expansion controls are read-only. `selectedNodeId` and `onSelectNode` similarly support host-bound selection; `null` clears controlled selection. Callback IDs always identify the original item, never its label or a collapsed proxy.

**Reveal selection** opens known ancestor groups and frames the selected item. **Focus highlighted path** frames host-emphasized visible items and the visible endpoints of emphasized connections, without changing their evidence or state; **Fit diagram** restores an overview. Narrow canvases initially frame a visible selected item for readability. Camera changes have zero duration. Equivalent same-record rerenders preserve expansion and the camera. Hosts should key the component by the exact run/binding when replacing a recording, and clear or update controlled IDs with that binding. A missing selection is refused rather than silently opening another visit.

`direction` selects `LR` (default) or `TB`. The example chooses vertical layout on phones. `className` and `style` configure the wrapper; normal Footprint theme tokens control colors/fonts. Bundled icon hints include `cart`, `card`, `payment`, `shipping`, `label`, `lock`, `alert`, `flow` and `step`; a short Unicode pictograph is also supported. HTML/SVG source and remote asset URLs are not icon inputs. Longer labels remain available in accessible names/tooltips when the compact card truncates them.

### Admission and limits

`projectGroupedFlowDiagram(definition, options)` is pure and returns `{model}` or a fixed actionable `{error}`. The model includes sanitized structural metadata, positioned visible nodes, original edge references, and explicit state/emphasis. `getFlowDiagramAncestors` returns bounded group ancestry for a valid exact node ID. Ordinary data accessors and non-plain inputs are refused; extra input fields are not copied into the admitted definition. Treat JavaScript proxies/code as executable host code, not as a serialized-record format.

Limits are 512 nodes, 1,024 edges and 16 group levels; IDs are at most 256 characters, labels 160, descriptions 320 and icon hints 32. Parent cycles, unknown references and conflicting states are refused. A group's children must be supplied before it can expand; network loading and admission stay with the host. Adapting a flat saved-reference response into an execution hierarchy remains host work. The view must not guess private stage names, branch outcomes, missing child histories, source-code locations or backward adjacency.

### Click an item to investigate its recorded cause (unreleased)

`GroupedFlowInvestigation` composes the grouped diagram and the existing investigation
panel. It uses the same host-bound query controller as `InvestigationPanel`; it does
not load records, walk design arrows, rank causes or call a model.

```tsx
import { GroupedFlowInvestigation } from 'footprint-explainable-ui/flowchart';
import '@xyflow/react/dist/style.css';

<GroupedFlowInvestigation
  definition={definitionForThisRecording}
  observation={admittedRecordedStates}
  port={boundInvestigationPort}
  direction="LR"
/>;
```

The port is the existing `InvestigationPort`: `binding`, bounded `attention`, optional
safe display `labels`, and `explain(nodeId, {signal})`. Every diagram item must use the
exact ID recognized by that bound port. The host owns authorization, storage, query
allowances and the binding to one run, definition, invocation, attempt and visit.
Replace `binding` whenever those facts or the ID namespace change. Repeated labels,
key names and stage-name prefixes never resolve identity. References absent from the
diagram remain in the explanation with a count of items not shown; another card is
never silently selected in their place.

Selecting an explicitly recorded `failed` item starts one explanation request.
Other items are selected without a query until **Investigate selected item** is used.
**Why it happened** and **What it affected** reuse the accepted result. A new selection,
changed binding, unmount or committed hidden view cancels outstanding work; a late
answer cannot repaint a different selection. No explanation query runs during server
rendering or ordinary mounting.

The accompanying optional Foottrace `includeBackward` result supplies
`backward: {nodes, edges, confidence, gaps}`. The grouped view admits that data and
optional `impact.edges` separately from the legacy text projection. A missing field
means unavailable connections; an explicit empty list is kept distinct. A backward
relationship points from the dependent item toward its recorded source. An impact
relationship retains the direction returned by the canonical query. A recorded read
establishes source usage, not that a later output was derived from it. Alternatives
remain uncertain; an impact-only limit does not erase an independently supported
backward root.
`recorded-write` is a separate data relationship: a partial write kept an earlier
recorded value. Its full label is **Recorded write (retained value)** and its compact
caption is **Kept**, distinct from **Read**. It neither proves expression derivation
nor asserts an external effect. The public attribution union includes this value;
consumers with exhaustive attribution handlers must handle it explicitly.
The cause summary appears above the diagram. In cause mode, the exact mapped root
card carries **Supported cause** while its containing groups say only **Cause
inside**. That role is separate from recorded Completed/Failed status; a completed
step can still be the supported cause. Unknown, tied, refused or unmapped results
do not choose a substitute root card, and impact mode does not label affected items
as causes. The standalone diagram's optional `highlight.rootCauseId` is the host's
explicit exact-ID presentation claim; it is refused for an undeclared item or an
item/ancestor recorded as not run. No diagram traversal discovers that role.
Diagram gestures keep keyboard focus at the card while the live cause summary
updates; they do not scroll down to the detailed text. Explicit queries within
the text panel retain its normal explanation-focus behavior.

Accepted results open in **Cause focus** or **Impact focus**. These views keep all
returned recorded references available, fade unrelated cards and hide the
competing workflow arrows. **Show whole flow** restores the context at the same
card positions. Switching views reuses the accepted result. A new request or host
binding resets the view choice; ordinary rerenders preserve it. Missing evidence
and competing causes remain explicit in either view.

Focused views omit repetitive visible connection captions until a link is hovered
or selected. Full relationship names and evidence references remain accessible in
the diagram and the evidence list. **Fit recorded view** keeps the cause or selected
item readable on a narrow screen; **All recorded connections** and the whole-flow
view provide explicit overviews.
If that item is inside a collapsed group, fitting frames its nearest visible
group without reopening it or changing the recorded cause identity.
When backward relationships are supplied, every path item and alternative must be
in that returned membership, and each adjacent path pair must have a matching
returned dependent-to-source link. A stage-level relationship or incomplete
backward coverage cannot accompany a definite root. Conflicting claims are refused
rather than repaired or filled in from the structural chart. These consistency
checks do not replace the host's recording admission and authorization.

Recorded relationships are a distinct overlay. They preserve kind, attribution and
evidence references, use different edge IDs and routing handles, and do not influence
structural layout, execution state or branch outcomes. Parallel relationships stay
separate and have a folded evidence list. A bounded routing layer uses the existing
card positions to steer rounded connections around card content, group headers,
badges and branch labels. Shared connections get separate lanes and caption space;
the card layout and structural relationships stay unchanged. Backward cause arrows use a
warm red, impact arrows use teal, and ordinary flow arrows stay grey. The cause
colour identifies recorded sources; it does not say that every linked step failed.
Recorded status badges retain that distinction. Decision steps use rounded cards
with a small decision marker and keep their Yes/No branch labels.
Each recorded connection keeps its own handle, arrowhead and evidence identity.
Compatible branches from the same exact recorded source can share one visual exit
and fan toward distinct destinations; this adds no recorded junction or causal claim.
Incoming arrowheads, parallel links to the same destination, and incompatible or
collapsed sources stay separately placed. Crowded ports use another clear side or
the drawing-limit notice.
Where space permits, branches use the sides facing their destination cards before
trying checked outside detours. Rounded elbows keep short forks readable.

Compact Data/Read/Kept/Rule/Step captions retain their full fixed kind and attribution
in accessible names, tooltips and the evidence list. Routing work is bounded. If a
connection cannot be drawn safely, the diagram reports how many could not be drawn
and offers ways to inspect them; its recorded evidence, cause and confidence are
unchanged. Crowded diagrams can still contain crossings, which are not recorded
junctions. Only declared, exact endpoints are drawn;
missing mappings, hidden evidence and uncertain links are never replaced by nearby
design arrows. The standalone grouped diagram also accepts `recordedRelationships`
(up to 512, within a 65,536-character relationship budget) and refuses links touching
items or ancestors explicitly marked not run. Its optional `focusRequest: {key,
nodeIds}` expresses one camera action: changing `key` frames those known items;
equivalent rerenders do not take the camera back from the user.

After an accepted result, known containing groups open once. Desktop framing includes
relevant expanded group containers and connection captions so their headers,
controls and routed links remain in view. A
new port binding replaces the inner diagram and discards all prior camera targets;
equivalent same-binding renders preserve it. On a narrow canvas the camera frames the supported root, or the selected item when no root is mapped, rather
than shrinking every card to fit the entire graph. **Back to selected item** is an
explicit camera action. Ordinary expansion remains under the user's control.

The [offline example](examples/grouped-investigation/README.md) uses the canonical
record adapter and explain function from the accompanying candidate, rather than a
prewritten root-cause answer. This API remains unreleased; application adoption and
saved-history transport changes are separate work.

### Lazy subflows and progressive presentation

Use `createRecordingSource` with `<ExplainableShell source={source} />` or `<TraceViewer source={source} />` for live cumulative recording updates and optional on-demand recorded child scopes. Keep one source stable for one run; call `source.update({ snapshot, graph, narrativeEntries })` with each complete cumulative cohort. Preserve every prior commit in its original order; these are not deltas. Publication batches the latest full cohort per frame without advancing the inspection/Backtrack cursor. Changed recorded run IDs (including appearing/disappearing IDs), rewritten/shrinking commit prefixes and removed recorded runtime visits are refused, including regressions within one pending frame. These supplied-data consistency checks do not establish the recording's truth or completeness. Create a new source for a different run.

Pure live use needs only `createRecordingSource({ snapshot, graph })`; a child loader is optional, and `source.canLoadSubflows` reports whether one was supplied. Props and JSON layouts configure themed skeleton/spinner/text loading and optional idle prefetch. Admission still runs synchronously before frame publication, and legacy root projection runs once per published cohort; frame batching does not make arbitrary input processing nonblocking. See [the consumer example](examples/lazy-subflows/README.md) for recorder subscriptions, cleanup, error/retry, source limits and optional worker preparation.

These exports are available from both the root and `/flowchart` entries:

| Export | Description |
|---|---|
| `createRecordingSource` | Create one shared source per run from its recording/graph, with an optional child loader; the creator owns disposal. [Source example](examples/lazy-subflows/README.md) |
| `prepareSubflow` | Canonical child admission and snapshot projection after a task boundary; one conversion remains synchronous in the main-thread fallback. |
| `createSubflowWorkerPreparation` | Adapt a host-owned worker to the source's preparation callback; the returned callable owns a `dispose()` method. [Worker example](examples/lazy-subflows/README.md#optional-worker-preparation) |
| `attachSubflowWorker` | Install the matching canonical preparation handler inside that worker; returns listener/job cleanup, without terminating the host's worker. |
| `resolveProgressiveRenderingOptions` | Validate the JSON-only loading-indicator and prefetch choices; does not fetch, prepare or render recordings. |
| `FootprintLoadStatus` | Themed loading/preparing/error surface with accessible status/alert roles; replace it through `FootprintTheme.components.LoadStatus`. |

| Public type | Consumer contract |
|---|---|
| `ProgressiveRenderingOptions` | JSON-safe `loadingIndicator` and `prefetch` choices; functions remain in source props. |
| `SubflowLoadRequest` | Exact invocation ancestry, mount runtime ID and subflow ID, with the recorded run ID when present. |
| `LoadedSubflow` | Complete recorded child result with optional qualified graph and recorded narrative. |
| `PreparedSubflow` | That child unit plus projected replay snapshots. |
| `SubflowLoadState` | Loading, preparing, ready or error state for one exact request. |
| `RecordingSourceSnapshot` | Source revision, coherent logical recording/narrative and read-only scope-state map. |
| `RecordingSourceOptions` | Root cohort, optional host loader/preparation callback and retained-scope resource bound. |
| `RecordingSourceUpdate` | Complete cumulative same-run snapshot, graph and optional narrative; the host preserves the prior history prefix. |
| `RecordingSource` | Shared subscription, live `update`, optional child-loading capability, exact-path graph lookup and creator-owned disposal. |
| `PreparationWorker` | Explicit message/error port supplied by the host; no automatic worker URL or lifetime. |
| `SubflowWorkerPreparation` | Callable worker-backed preparation adapter with owner-controlled disposal. |
| `FootprintLoadStatusProps` | Loading surface state, indicator, label and existing primitive styling options. |
| `FootprintLoadStatusAdapterProps` | Host `LoadStatus` adapter fields and native div attributes; see the [theme API](#theme-api). |
