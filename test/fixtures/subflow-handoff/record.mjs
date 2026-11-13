import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createTraceBundle } from "../../../dist/flowchart.js";

const input = process.argv[2];
assert.ok(input, "Pass the FootPrint module to record with (published package name or source path).");
const module = input.startsWith(".") || input.startsWith("/") ? pathToFileURL(resolve(input)).href : input;
const { flowChart, FlowChartExecutor } = await import(module);
const bundle = createTraceBundle();
const inner = flowChart("Child compute", scope => { scope.localOutput = scope.source * 2; }, "compute").build();
const middle = flowChart("Middle prepare", scope => { scope.middleBase = scope.iteration; }, "prepare")
  .addSubFlowChartNext("inner", inner, "Inner", {
    inputMapper: parent => ({ source: parent.middleBase }),
    outputMapper: child => ({ middleOutput: child.localOutput }),
  }).build();
const chart = flowChart("Start", scope => { scope.count = 0; }, "start", { structureRecorders: [bundle.structure.recorder] })
  .addFunction("Tick", scope => { scope.count += 1; }, "tick")
  .addSubFlowChartNext("child", middle, "Child", {
    inputMapper: parent => ({ iteration: parent.count }),
    outputMapper: child => ({ renamed: child.middleOutput }),
  })
  .addFunction("Use", scope => { scope.final = scope.renamed + 1; }, "use")
  .addFunction("Gate", scope => { if (scope.count === 2) scope.$break(); }, "gate")
  .loopTo("tick").build();
const executor = new FlowChartExecutor(chart, {
  readTracking: "full", writeProvenance: "reads-prefix", captureOutputHandoff: true,
});
bundle.attachTo(executor);
await executor.run();
const runtimeSnapshot = executor.getSnapshot();
assert.equal(runtimeSnapshot.sharedState.final, 5);
const exactResults = Object.entries(runtimeSnapshot.subflowResults).filter(([id]) => id.includes("#"));
assert.equal(exactResults.length, 4);
assert.ok(exactResults.every(([, result]) => result.outputHandoff?.status === "captured"), "This engine must support opt-in output handoffs.");
const overlay = bundle.runtimeOverlay.getOverlay();
writeFileSync(new URL("./recording.json", import.meta.url), JSON.stringify({
  runtimeSnapshot, traceGraph: bundle.structure.getGraph(),
  runtimeOverlay: { ...overlay, errors: [...overlay.errors], retryAttempts: [...(overlay.retryAttempts ?? [])] },
}, null, 2));
