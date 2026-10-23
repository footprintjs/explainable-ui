/** Offline tooling: actual public footprintjs 10.3.0 records, never a runtime import.
 * node generate.mjs --producer-root /path/resolving/footprintjs --out /scratch
 * No install, clock replacement, model or network call. */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { createHash } from "node:crypto";

const args = process.argv.slice(2);
const option = (name) => args[args.indexOf(name) + 1];
assert.ok(
  args.includes("--producer-root") && args.includes("--out"),
  "Supply both tooling directories",
);
const require = createRequire(
  join(resolve(option("--producer-root")), "package.json"),
);
const { flowChart, FlowChartExecutor } = require("footprintjs");
const version = require("footprintjs/package.json").version;
assert.equal(version, "10.3.0");
const out = resolve(option("--out"));
mkdirSync(out, { recursive: true });

function quote() {
  return flowChart(
    "Child Seed",
    async (scope) => {
      scope.items = [scope.base, 2];
      scope.rate = 2;
    },
    "seed",
  )
    .addFunction(
      "Child Sum",
      async (scope) => {
        scope.subtotal = scope.items.reduce((a, b) => a + b, 0);
      },
      "sum",
    )
    .addFunction(
      "Child Audit",
      async (scope) => {
        scope.audit = String(scope.subtotal);
      },
      "audit",
    )
    .addFunction(
      "Child Total",
      async (scope) => {
        scope.total = scope.subtotal * scope.rate;
      },
      "total",
    )
    .build();
}
const mapQuote = {
  inputMapper: (scope) => ({ base: scope.base }),
  outputMapper: (result) => ({ total: result.total }),
};

async function record(build, configure = () => {}) {
  const structureEvents = [];
  const capture = Object.fromEntries(
    [
      "onStageAdded",
      "onEdgeAdded",
      "onLoopEdgeAdded",
      "onDeciderComplete",
      "onSubflowMounted",
    ].map((method) => [
      method,
      (event) =>
        structureEvents.push({
          method,
          event: JSON.parse(JSON.stringify(event)),
        }),
    ]),
  );
  capture.id = "scoped-trace-fixture";
  const executor = new FlowChartExecutor(build(capture));
  executor.enableNarrative();
  configure(executor);
  await executor.run();
  return {
    runtimeSnapshot: executor.getSnapshot(),
    narrativeEntries: executor.getNarrativeEntries(),
    structureEvents,
  };
}

function seedlessChart(extra = false) {
  return flowChart(
    "Child Constants",
    async (scope) => {
      scope.items = [1, 2];
      scope.rate = 2;
      if (extra) scope.secret = "TOP-SECRET-VALUE";
    },
    "seed",
  )
    .addFunction(
      "Child Sum",
      async (scope) => {
        scope.subtotal = scope.items.reduce((a, b) => a + b, 0);
      },
      "sum",
    )
    .addFunction(
      "Child Total",
      async (scope) => {
        scope.total = scope.subtotal * scope.rate;
      },
      "total",
    )
    .build();
}
const mountOne = (capture, child) =>
  flowChart(
    "Root Seed",
    async (scope) => {
      scope.base = 10;
    },
    "seed",
    { structureRecorders: [capture] },
  )
    .addSubFlowChartNext("prepare", child, "Quote", mapQuote)
    .addFunction(
      "Root Report",
      async (scope) => {
        scope.report = scope.total;
      },
      "report",
    )
    .build();
const seedless = await record((capture) => mountOne(capture, seedlessChart()));
const readsOff = await record(
  (capture) => mountOne(capture, quote()),
  (executor) => executor.setReadTracking("off"),
);
const redacted = await record(
  (capture) => mountOne(capture, seedlessChart(true)),
  (executor) => executor.setRedactionPolicy({ keys: ["secret"] }),
);
const nestedLoop = await record((capture) => {
  const middle = flowChart(
    "Middle Seed",
    async (scope) => {
      scope.base = scope.pass * 100;
    },
    "seed",
  )
    .addSubFlowChartNext("prepare", quote(), "Inner Quote", mapQuote)
    .build();
  return flowChart(
    "Root Seed",
    async (scope) => {
      scope.pass = 0;
    },
    "seed",
    { structureRecorders: [capture] },
  )
    .addFunction(
      "Advance",
      async (scope) => {
        scope.pass += 1;
      },
      "advance",
    )
    .addSubFlowChartNext("pipeline", middle, "Pipeline", {
      inputMapper: (scope) => ({ pass: scope.pass }),
      outputMapper: (value) => ({ total: value.total }),
    })
    .addFunction(
      "Check",
      async (scope) => {
        if (scope.pass >= 2) scope.$break("complete");
      },
      "check",
    )
    .loopTo("advance")
    .build();
});
const fanout = await record((capture) =>
  flowChart(
    "Root Seed",
    async (scope) => {
      scope.bases = [1, 2, 3];
    },
    "seed",
    { structureRecorders: [capture] },
  )
    .addParallelForEach("Quote each", "fan", {
      items: (scope) => scope.bases,
      maxBranches: 4,
      into: "totals",
      branch: (item) =>
        flowChart(
          "Branch Seed",
          async (scope) => {
            scope.items = [item, 2];
            scope.rate = 2;
          },
          "seed",
        )
          .addFunction(
            "Branch Total",
            async (scope) => {
              scope.total = scope.items.reduce((a, b) => a + b, 0) * scope.rate;
            },
            "total",
          )
          .build(),
    })
    .build(),
);
const bytes =
  JSON.stringify(
    { seedless, readsOff, redacted, nestedLoop, fanout },
    null,
    2,
  ) + "\n";
writeFileSync(join(out, "review-recordings.json"), bytes);
writeFileSync(
  join(out, "review-provenance.json"),
  JSON.stringify(
    {
      producer: { footprintjs: version },
      source: "test/fixtures/subflow-tracing/generate-review.mjs",
      sha256: createHash("sha256").update(bytes).digest("hex"),
      note: "Actual offline runs. Producer IDs and timestamps retained; values in the redacted fixture are masked by the producer.",
    },
    null,
    2,
  ) + "\n",
);
assert.equal(readFileSync(join(out, "review-recordings.json"), "utf8"), bytes);
console.log(
  JSON.stringify({
    producer: version,
    bytes: Buffer.byteLength(bytes),
    sha256: createHash("sha256").update(bytes).digest("hex"),
  }),
);
