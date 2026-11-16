# Commentary and JSON layout

[`StoryCommentary.tsx`](./StoryCommentary.tsx) is a consumer React component.
It imports the public package API and contains a small static `StageSnapshot[]`
and `NarrativeEntry[]` fixture. It does not create an executor or run a pipeline.

Install the package and peers in a React application, then mount the component:

```sh
npm install footprint-explainable-ui react react-dom @xyflow/react
```

```tsx
import { StoryCommentary } from "./StoryCommentary";

export default function App() {
  return <StoryCommentary />;
}
```

Mount `JsonLayoutStoryCommentary` instead to see all five full Lens surfaces
arranged by a saved JSON-compatible definition. The file exports
`customerLayout: LensLayoutDefinition`, serializes it with `JSON.stringify`,
then restores it with `JSON.parse` as `restoredCustomerLayout`. No rendering
callback or additional cursor is required.

| Area | Requirement |
|---|---|
| `timeTravel` | Required shared time and stage controls |
| `flowchart` | Required execution chart |
| `developer` | Optional technical details; omit to hide |
| `commentary` | Optional scrolling transcript; omit to hide |
| `timeline` | Optional recorded timeline; omit to hide |

Repeating a name spans cells; `"."` is an empty cell. Keep the matrix
rectangular and each named area rectangular. Narrow layouts stack surfaces in
first-appearance order. Invalid definitions throw an `Invalid Lens layout: …`
validation error. Use the combined `details` area for the standard
Developer / Commentary buttons; do not combine `details` with separate
`developer` or `commentary` areas. Omitting `layout` retains the standard shell.
If you supply both, `renderLayout` takes precedence and gives you complete
ownership of the arrangement. The mandatory core-area checks apply to the JSON
`layout` contract.

`TraceViewer` also accepts the restored layout:

```tsx
import { TraceViewer } from "footprint-explainable-ui";
import { restoredCustomerLayout } from "./StoryCommentary";

<TraceViewer recording={savedJson} layout={restoredCustomerLayout} />;
```

The exported `SavedStory` wrapper also accepts `layout={restoredCustomerLayout}`.

The full Lens area is named `developer`. Basic `ExplainableView` composition
keeps its separate `inspector` area and existing layout presets. See the
[full Lens layout contract](../../README.md#arrange-the-full-lens-from-json).

Use Previous / Next or the slider to select a visit. The details pane's
**Developer** and **Commentary** buttons switch its content while keeping the
same flowchart, stage selection, time controls and drill scope. The example
starts with Commentary selected through `defaultView="story"`. Play advances
the saved cursor every 2,400 ms because the example explicitly overrides the
Commentary audience's 2,000 ms default. `autoPlay` is off.

Commentary reuses the accumulated scrolling transcript. The recorded prefix
grows through the selected stage, groups each visit under a stage heading,
follows the cursor and hides entry-type badges. These are the full Lens
defaults: `presentation="log"`, `groupByStage={true}`, `followCursor={true}`
and `showEntryTypes={false}`. Set `followCursor={false}`
to stop automatic scrolling, or explicitly choose `presentation="current"`
to show only the selected visit. The standalone/basic panel retains its
existing log, ungrouped, no-follow and visible-badge defaults. Recorded data
operations remain expandable beneath their visit; comments, decisions, errors
and emitted outcomes stay with the stage that recorded them.

`ControlledStoryCommentary` demonstrates `view={view}` with
`onViewChange={setView}`. A controlled `view` without a callback fixes the
audience; its header shows a label instead of switch buttons.

The fixture is authored presentation data. Its commentary, values and durations
demonstrate rendering; they are not evidence from an actual execution. It has no
commit log or causal chain, so provenance features cannot recover an original
read or writer from it. Use a real runtime snapshot to demonstrate those
features. Each narrative entry supplies a `stageName` and exact visit ID; the
inner comments and final outcome are explicit authored `emit` entries. The UI
does not derive that outcome from the last memory write or a function return.

`CustomStoryCommentary` shows a full Lens `renderLayout` using
`useLensWorkbench().surfaces.commentary`, the chart and replay controls. A
custom layout owns its audience buttons; this example keeps the chart in place
and switches the adjacent details content between `surfaces.developer` and
`surfaces.commentary`. Use `surfaces.details` to reuse the provided combined
pane instead. The
exported `LocallyStyledCommentary` shows the alternative: mount the public
`CommentaryPanel` inside that layout to set local presentation props. Both
approaches share the shell's cursor and active invocation. Give the chart a
height in your own layout.

For a real saved run, retain the recorder's exact runtime IDs and use the
existing recording format. `SavedStory` in the same file demonstrates this
`TraceViewer` integration:

```tsx
import { TraceViewer } from "footprint-explainable-ui";

// savedJson contains { snapshot, structure, narrativeEntries? }.
<TraceViewer
  recording={savedJson}
  defaultView="story"
  commentary={{
    title: "What happened",
    presentation: "log",
    groupByStage: true,
    followCursor: true,
    showEntryTypes: false,
  }}
  replayControls={{ previousNext: true, playPause: true, slider: true }}
/>;
```

Attach FootprintJS's `narrative()` recorder before execution. Save the resulting
snapshot and `chart.buildTimeStructure`; the narrative can ride inside the
snapshot or be saved as the existing `narrativeEntries` override. See the
[real recording example](../replay-a-recording/) for capture code.

`commentary.renderEntry` changes React rendering of saved entries. To change
the recorded words, use FootprintJS's upstream `narrative({ renderer })` at
capture time. Inside a stage, emit named domain comments and outcomes with
`scope.$emit("review.comment", { message: "…" })` or
`scope.$emit("review.outcome", { message: "…" })`; `renderer.renderEmit` can
turn those payloads into the producer's own wording before saving the narrative.
`$log` diagnostics are producer-version-dependent, so named emits are the
portable path for these messages. Explicit recorded messages or a host-owned
`renderEntry` supply domain outcome wording. This viewer does not infer a
return value, formula or branch reason, and does not evaluate text templates.
See the [audience API and defaults](../../README.md#developer-and-commentary-details).
