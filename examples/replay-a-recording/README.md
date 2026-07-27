# Replay a recording

Show a run that already happened. Nothing re-runs.

```bash
node examples/replay-a-recording/record.mjs   # step 1 — save a run  → run.json
npm run example:replay                        # step 2 — show it     → http://localhost:5310
```

## A recording is three things

Save all three together. Miss one and one surface goes dark — each viewer
says which, and none of them fake it.

| field | from | what it buys |
|---|---|---|
| `snapshot` | `executor.getSnapshot()` | memory panel, commit axis, variable provenance, **the chart's colouring**, and every attached recorder's data |
| `structure` | `chart.buildTimeStructure` | **the chart** — and only the chart. Nothing else can draw it. |
| `events` | your own event log | the agent view in [agentfootprint-lens](https://github.com/footprintjs/agentfootprint-lens). Not read here. |

`structure` is the one a run does not leave behind on its own: `getSnapshot()`
never contains it, and no adapter can invent it. It is also the one every
integration forgets — which is why the shell now names it on screen when it is
missing.

## Step 1 — record ([`record.mjs`](./record.mjs))

The recorders are the point. Each is attached BEFORE the run, because none of
this is recoverable afterwards:

```js
import { narrative, metrics } from 'footprintjs/recorders';

executor.attachCombinedRecorder(narrative()); // → the Story panel
executor.attachScopeRecorder(metrics());      // → real per-stage durations

await executor.run();

const recording = {
  snapshot:  executor.getSnapshot(),
  structure: chart.buildTimeStructure,
};
```

Recorders that implement `toSnapshot()` ride along INSIDE the snapshot, so a
frozen recording tells the same story the live run did. `record.mjs` checks
whether the story made it in and saves `narrativeEntries` beside the snapshot
if not — footprintjs gained `toSnapshot()` on its narrative recorder after
9.9, and a recording should be correct on both.

## Step 2 — show it ([`Replay.tsx`](./Replay.tsx))

```tsx
import { ExplainableShell, graphFromStructure } from 'footprint-explainable-ui';

<ExplainableShell
  runtimeSnapshot={run.snapshot}
  traceGraph={graphFromStructure(run.structure)}
  traceTheme={{ mode: 'light' }}
/>
```

You do **not** pass a `runtimeOverlay`: the chart's colouring is rebuilt from
the snapshot's own commit log. Pass one only when you have a live
`createTraceRuntimeOverlay` handle — it sees a little more than a recording
can (errors, wall-clock, subflow internals).

`traceTheme={{ mode }}` re-themes the whole shell. For the standalone
components — `TraceViewer`, `SnapshotPanel`, `GanttTimeline`, `TracedFlow` —
the same switch is one word: `theme="light"`.

## What this recording honestly cannot show

- **Error messages.** The commit log has no error channel: a failing stage's
  writes land, its message does not.
- **Deep subflow internals.** footprintjs keeps them out of the run-level
  commit log by design, so a replay lights the mount stages, not their insides.
- **Per-stage durations without `metrics()`.** The Gantt then shows execution
  ORDER, and says so on the chart.

The loop in this example is deliberate: `Quote` runs three times, and each pass
is its own row with its own duration — the timings are keyed by
`runtimeStageId`, not by stage name.

`test/integration/replayExample.test.tsx` mounts this example against the
committed `run.json`, so the code above cannot drift from what actually works.
