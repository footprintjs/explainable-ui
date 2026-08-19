/**
 * generate-subflow-run — produces demo/sample-subflow-run.json from a REAL
 * footprintjs run that mounts NESTED subflows (project rule: demo data is
 * GENERATED, never hand-authored).
 *
 * Why this fixture exists: the shell's subflow drill has FOUR entry paths
 * (chart-node click, Topology tree click, breadcrumb, programmatic) and the
 * demo previously had no shell chart with subflows at all — so a drill
 * regression could not be seen in the browser. This run is deliberately
 * shaped for that:
 *
 *   Seed → Prepare(sf, 3 stages) → Pipeline(sf) ─┬─ Fetch
 *                                                ├─ Prepare(sf, 3 stages)  ← NESTED, same id
 *                                                └─ Finish
 *        → Report
 *
 * `Prepare` is mounted TWICE — once at the top level and once inside
 * `Pipeline`. That is the case that separates a correct drill (scope by the
 * mount node's path-qualified id) from an id-collision drill (scope by the
 * bare subflow id, which matches BOTH mounts' children).
 *
 * footprintjs is imported from the sibling repo build (eui deliberately has
 * no footprintjs dependency — this script is tooling, not library code).
 *
 * Run: npx tsx demo/generate-subflow-run.ts
 */

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Tooling-only absolute import of the sibling engine build.
// eslint-disable-next-line import/no-relative-packages
import { flowChart, FlowChartExecutor } from '../../footPrint/dist/esm/index.js';
import { createTraceBundle } from '../src/flowchart';

interface State {
  raw?: number[];
  cleaned?: number[];
  scaled?: number[];
  checked?: boolean;
  fetched?: string;
  total?: number;
  finished?: boolean;
  report?: string;
}

async function main(): Promise<void> {
  const bundle = createTraceBundle();

  // A 3-stage child chart, mounted at two different depths.
  const prepare = () =>
    flowChart<State>('Clean', async (scope) => {
      scope.cleaned = (scope.raw ?? [1, 2, 3]).filter((n) => n > 0);
    }, 'clean', { description: 'Drop the bad rows' })
      .addFunction('Scale', async (scope) => {
        scope.scaled = (scope.cleaned ?? []).map((n) => n * 10);
      }, 'scale', 'Scale every row')
      .addFunction('Check', async (scope) => {
        scope.checked = (scope.scaled ?? []).length > 0;
      }, 'check', 'Sanity-check the result')
      .build();

  // The middle chart — itself mounts `prepare`, so drilling it and then
  // drilling ITS Prepare exercises the nested case.
  // Mounted ONLY inside `pipeline` — no top-level twin. A drill that scopes
  // by the bare subflow id finds nothing for this one.
  const verify = flowChart<State>('Tally', async (scope) => {
    scope.total = (scope.scaled ?? []).reduce((a, b) => a + b, 0);
  }, 'tally', { description: 'Add the rows up' })
    .addFunction('Sign', async (scope) => {
      scope.checked = true;
    }, 'sign', 'Sign the tally off')
    .build();

  const pipeline = flowChart<State>('Fetch', async (scope) => {
    scope.fetched = 'rows';
  }, 'fetch', { description: 'Pull the rows' })
    .addSubFlowChart('prepare', prepare(), 'Prepare')
    .addSubFlowChart('verify', verify, 'Verify')
    .addFunction('Finish', async (scope) => {
      scope.finished = true;
    }, 'finish', 'Close the pipeline')
    .build();

  const chart = flowChart<State>(
    'Seed',
    async (scope) => {
      scope.raw = [3, -1, 7];
    },
    'seed',
    { description: 'Seed the run', structureRecorders: [bundle.structure.recorder] },
  )
    .addSubFlowChart('prepare', prepare(), 'Prepare')
    .addSubFlowChart('pipeline', pipeline, 'Pipeline')
    .addFunction('Report', async (scope) => {
      scope.report = `finished=${scope.finished}`;
    }, 'report', 'Write the report')
    .build();

  const executor = new FlowChartExecutor(chart);
  executor.enableNarrative();
  bundle.attachTo(executor);
  await executor.run();

  const snapshot = executor.getSnapshot();
  const out = {
    generatedBy: 'demo/generate-subflow-run.ts (real footprintjs run — do not hand-edit)',
    runtimeSnapshot: {
      sharedState: snapshot.sharedState,
      executionTree: snapshot.executionTree,
      commitLog: snapshot.commitLog,
      // The drill resolves a subflow level from THIS map — without it the
      // shell's tree/chart drill has nothing to rescope to.
      subflowResults: snapshot.subflowResults,
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
  const dest = join(here, 'sample-subflow-run.json');
  writeFileSync(dest, JSON.stringify(out, null, 2));
  console.log(`wrote ${dest}`);
  console.log(
    `commits: ${snapshot.commitLog.length}, graph nodes: ${out.traceGraph.nodes?.length ?? '?'}, subflowResults: ${Object.keys(snapshot.subflowResults ?? {}).length}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
