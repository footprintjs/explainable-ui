/**
 * generate-run — produces demo/sample-run.json from a REAL footprintjs run
 * (project rule: demo data is GENERATED, never hand-authored).
 *
 * The chart is fan-in shaped ON PURPOSE: `Quote` depends on `PickBase` (via
 * baseRate ← rates) and on `AssessRisk` (via riskFactor), while `Audit` is a
 * chronological neighbor that feeds NOTHING downstream. That makes the
 * dependency CONE demonstrably different from "the steps before it" — the
 * exact case the Data Trace fix and the cone visualization exist for.
 *
 * footprintjs is imported from the sibling repo build (eui deliberately has
 * no footprintjs dependency — this script is tooling, not library code).
 *
 * Run: npx tsx demo/generate-run.ts
 */

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Tooling-only absolute import of the sibling engine build.
// eslint-disable-next-line import/no-relative-packages
import { flowChart, FlowChartExecutor } from '../../footPrint/dist/esm/index.js';
import { createTraceBundle } from '../src/flowchart';

interface State {
  rates?: number[];
  baseRate?: number;
  riskFactor?: number;
  quote?: number;
  auditNote?: string;
}

async function main(): Promise<void> {
  const bundle = createTraceBundle();

  const chart = flowChart<State>(
    'LoadRates',
    async (scope) => {
      scope.rates = [3.1, 3.4, 9.9];
    },
    'load-rates',
    { description: 'Fetch the rate table', structureRecorders: [bundle.structure.recorder] },
  )
    .addFunction('PickBase', async (scope) => {
      scope.baseRate = scope.rates![scope.rates!.length - 1];
    }, 'pick-base', 'Choose the base rate')
    .addFunction('Audit', async (scope) => {
      scope.auditNote = 'checked'; // chronological neighbor, feeds NOTHING below
    }, 'audit', 'Log an audit note')
    .addFunction('AssessRisk', async (scope) => {
      scope.riskFactor = 1.2;
    }, 'assess-risk', 'Score the applicant')
    .addFunction('Quote', async (scope) => {
      scope.quote = scope.baseRate! * scope.riskFactor!;
    }, 'quote', 'Compute the quote')
    .build();

  const executor = new FlowChartExecutor(chart);
  executor.enableNarrative();
  bundle.attachTo(executor);
  await executor.run();

  const snapshot = executor.getSnapshot();
  const out = {
    generatedBy: 'demo/generate-run.ts (real footprintjs run — do not hand-edit)',
    runtimeSnapshot: {
      sharedState: snapshot.sharedState,
      executionTree: snapshot.executionTree,
      commitLog: snapshot.commitLog,
    },
    narrativeEntries: executor.getNarrativeEntries(),
    traceGraph: bundle.structure.getGraph(),
    // RuntimeOverlay.errors is a Map — serialize as entry pairs; the demo
    // rehydrates (JSON.stringify silently turns Maps into {}).
    runtimeOverlay: (() => {
      const o = bundle.runtimeOverlay.getOverlay();
      return { ...o, errors: [...o.errors.entries()] };
    })(),
  };

  const here = dirname(fileURLToPath(import.meta.url));
  const dest = join(here, 'sample-run.json');
  writeFileSync(dest, JSON.stringify(out, null, 2));
  console.log(`wrote ${dest}`);
  console.log(`commits: ${snapshot.commitLog.length}, graph nodes: ${out.traceGraph.nodes?.length ?? '?'}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
