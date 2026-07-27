/**
 * record.mjs — STEP 1 of the replay story: save a run.
 *
 * Runs a real footprintjs pipeline and writes the recording next to this
 * file. A recording is THREE things; this example needs two of them (the
 * third, `events`, is what agentfootprint-lens reads):
 *
 *   snapshot   executor.getSnapshot()      state, commit log, every recorder's data
 *   structure  chart.buildTimeStructure    the CHART — nothing else can draw it
 *
 * The recorders are the point. Each one lights one surface, and each is
 * attached BEFORE the run, because none of this can be recovered afterwards:
 *
 *   narrative()  → the Story panel  (without it: "X executed. Wrote: y")
 *   metrics()    → real durations   (without it: the Gantt shows ORDER and says so)
 *
 * Run:  node examples/replay-a-recording/record.mjs
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { flowChart, FlowChartExecutor } from "footprintjs";
import { narrative, metrics } from "footprintjs/recorders";

const here = dirname(fileURLToPath(import.meta.url));

/** A small quoting pipeline with a loop, so the replay has something to say. */
const chart = flowChart(
  "LoadRates",
  async (scope) => {
    scope.rates = [3.1, 3.4, 3.9];
    scope.attempt = 0;
  },
  "load-rates",
  { description: "Fetch today's rate table" },
)
  .addFunction(
    "PickBase",
    async (scope) => {
      scope.baseRate = Math.min(...scope.rates);
    },
    "pick-base",
    "Choose the cheapest rate",
  )
  .addFunction(
    "Quote",
    async (scope) => {
      scope.attempt = scope.attempt + 1;
      scope.quote = Number((scope.baseRate * (1 + scope.attempt / 10)).toFixed(2));
    },
    "quote",
    "Price the application",
  )
  .addFunction(
    "Review",
    async (scope) => {
      if (scope.quote >= 4) scope.$break("quote accepted");
    },
    "review",
    "Accept the quote, or go round again",
  )
  .loopTo("quote")
  .build();

const executor = new FlowChartExecutor(chart);

// Attach BEFORE the run — none of this is recoverable afterwards.
const story = narrative();
executor.attachCombinedRecorder(story);
executor.attachScopeRecorder(metrics());

await executor.run();

const snapshot = executor.getSnapshot();

// A recorder that implements `toSnapshot()` rides along INSIDE the snapshot,
// and the viewers read it from there — that is why `metrics()` needs no extra
// field here. The narrative recorder only gained `toSnapshot()` after
// footprintjs 9.9, so when this engine's snapshot didn't carry the story we
// save the entries beside it rather than shipping a recording that degrades
// to "X executed. Wrote: y". Check, don't assume: the check is one line and
// it makes the recording correct on both engines.
const carriesStory = (snapshot.recorders ?? []).some(
  (r) => Array.isArray(r.data) && typeof r.data[0]?.text === "string",
);

const recording = {
  snapshot,
  structure: chart.buildTimeStructure,
  ...(carriesStory ? {} : { narrativeEntries: story.getEntries() }),
};

const out = join(here, "run.json");
writeFileSync(out, JSON.stringify(recording, null, 2));
console.log(
  `wrote ${out} — ${recording.snapshot.commitLog.length} commits, ` +
    `${recording.snapshot.recorders?.length ?? 0} recorder snapshots, ` +
    `story ${carriesStory ? "inside the snapshot" : "saved alongside it"}`,
);
