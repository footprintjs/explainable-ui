/** Tiny offline public footprintjs 10.3.0 producer. No model/network/storage services.
 * node generate-resume.mjs --producer-root /existing/node_modules/parent --out /scratch
 * Separate outputs keep the earlier pinned recordings byte-identical. */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { createHash } from "node:crypto";
const args = process.argv.slice(2);
const option = (name) => args[args.indexOf(name) + 1];
assert.ok(args.includes("--producer-root") && args.includes("--out"));
const require = createRequire(
  join(resolve(option("--producer-root")), "package.json")
);
const { flowChart, FlowChartExecutor } = require("footprintjs");
const version = require("footprintjs/package.json").version;
assert.equal(version, "10.3.0");
const clone = (value) => JSON.parse(JSON.stringify(value));
function chart() {
  const child = flowChart(
    "Child Seed",
    async (scope) => {
      scope.items = [scope.base, 2];
    },
    "seed"
  )
    .addPausableFunction(
      "Child Approve",
      {
        execute: async (scope) => {
          scope.asked = true;
          return { question: "Continue?" };
        },
        resume: async (scope, input) => {
          scope.approved = input.approved;
        },
      },
      "approve"
    )
    .addFunction(
      "Child Total",
      async (scope) => {
        scope.total = scope.items.reduce((a, b) => a + b, 0);
      },
      "total"
    )
    .build();
  return flowChart(
    "Root Seed",
    async (scope) => {
      scope.base = 10;
    },
    "seed"
  )
    .addSubFlowChartNext("prepare", child, "Quote", {
      inputMapper: (scope) => ({ base: scope.base }),
      outputMapper: (result) => ({ total: result.total }),
    })
    .build();
}
const initial = new FlowChartExecutor(chart());
initial.enableNarrative();
await initial.run();
assert.equal(initial.isPaused(), true);
const checkpoint = clone(initial.getCheckpoint());
const paused = clone({
  runtimeSnapshot: initial.getSnapshot(),
  narrativeEntries: initial.getNarrativeEntries(),
});
await initial.resume(clone(checkpoint), { approved: true });
assert.equal(initial.isPaused(), false);
const sameExecutor = clone({
  runtimeSnapshot: initial.getSnapshot(),
  narrativeEntries: initial.getNarrativeEntries(),
});
const fresh = new FlowChartExecutor(chart());
fresh.enableNarrative();
await fresh.resume(clone(checkpoint), { approved: true });
assert.equal(fresh.isPaused(), false);
const freshExecutor = clone({
  runtimeSnapshot: fresh.getSnapshot(),
  narrativeEntries: fresh.getNarrativeEntries(),
});
const bytes =
  JSON.stringify({ paused, sameExecutor, freshExecutor }, null, 2) + "\n";
const out = resolve(option("--out"));
mkdirSync(out, { recursive: true });
writeFileSync(join(out, "resume-recordings.json"), bytes);
writeFileSync(
  join(out, "resume-provenance.json"),
  JSON.stringify(
    {
      producer: { footprintjs: version },
      source: "test/fixtures/subflow-tracing/generate-resume.mjs",
      sha256: createHash("sha256").update(bytes).digest("hex"),
      note: "Actual offline public API runs, pausing inside a child and resuming the same saved checkpoint on both the original and a fresh executor. Original IDs and times retained. Values are synthetic. No earlier fixture regenerated.",
    },
    null,
    2
  ) + "\n"
);
assert.equal(readFileSync(join(out, "resume-recordings.json"), "utf8"), bytes);
console.log(
  JSON.stringify({ producer: version, bytes: Buffer.byteLength(bytes) })
);
