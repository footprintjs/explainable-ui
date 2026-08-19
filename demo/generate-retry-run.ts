/**
 * generate-retry-run — produces demo/sample-retry-run.json from a REAL
 * footprintjs run (project rule: demo data is GENERATED, never hand-authored).
 *
 * The point of THIS run is the one thing the chart could not show before
 * 0.37.0: a stage that had to be tried more than once. `FetchQuote` fails
 * twice against a flaky upstream and succeeds on the third attempt, so the
 * chart draws it green with a `↺ ×3` attempt chip beside it — the same fact
 * the story already told in words.
 *
 * `Settle` is the control arm: it DECLARES a retry policy and never needs it,
 * so it must stay completely unmarked. Declared is not the same as happened.
 *
 * footprintjs is imported from the sibling repo build (eui deliberately has
 * no footprintjs dependency — this script is tooling, not library code).
 *
 * Run: npx tsx demo/generate-retry-run.ts
 */

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Tooling-only absolute import of the sibling engine build.
// eslint-disable-next-line import/no-relative-packages
import { flowChart, FlowChartExecutor } from '../../footPrint/dist/esm/index.js';
import { createTraceBundle } from '../src/flowchart';

interface State {
  ticker?: string;
  quoteAttempt?: number;
  quote?: { symbol: string; price: number };
  settled?: { symbol: string; total: number };
}

async function main(): Promise<void> {
  const bundle = createTraceBundle();

  // The attempt counter lives in the CLOSURE, not in scope: a failed attempt
  // discards its staged writes, so scope cannot count its own attempts.
  let fetchAttempt = 0;

  const chart = flowChart<State>(
    'LoadSymbol',
    async (scope) => {
      scope.ticker = 'ACME';
    },
    'load-symbol',
    { description: 'Pick the ticker', structureRecorders: [bundle.structure.recorder] },
  )
    .addFunction(
      'FetchQuote',
      async (scope) => {
        fetchAttempt += 1;
        scope.quoteAttempt = fetchAttempt;
        if (fetchAttempt < 3) throw new Error('quote service unavailable (503)');
        scope.quote = { symbol: scope.ticker!, price: 41.5 };
      },
      'fetch-quote',
      'Fetch a quote from a flaky upstream',
    )
    // No backoffMs: demo data must not spend real seconds waiting.
    .retry({ attempts: 3 })
    .addFunction(
      'Settle',
      async (scope) => {
        scope.settled = { symbol: scope.quote!.symbol, total: scope.quote!.price * 100 };
      },
      'settle',
      'Settle at the fetched price',
    )
    // Declared and never needed — the control arm. Must stay unmarked.
    .retry({ attempts: 2 })
    .build();

  const executor = new FlowChartExecutor(chart);
  executor.enableNarrative();
  bundle.attachTo(executor);
  await executor.run();

  if (fetchAttempt !== 3) {
    throw new Error(`expected FetchQuote to run 3 times, it ran ${fetchAttempt}`);
  }

  const snapshot = executor.getSnapshot();
  const overlay = bundle.runtimeOverlay.getOverlay();
  if (overlay.retryAttempts?.get('fetch-quote#1') !== 3) {
    throw new Error(
      `the overlay did not learn the attempts: ${JSON.stringify([...(overlay.retryAttempts ?? [])])}`,
    );
  }

  const out = {
    generatedBy: 'demo/generate-retry-run.ts (real footprintjs run — do not hand-edit)',
    runtimeSnapshot: {
      sharedState: snapshot.sharedState,
      executionTree: snapshot.executionTree,
      commitLog: snapshot.commitLog,
    },
    narrativeEntries: executor.getNarrativeEntries(),
    traceGraph: bundle.structure.getGraph(),
    // Maps don't survive JSON.stringify — serialize as entry pairs; the demo
    // rehydrates both of them.
    runtimeOverlay: {
      ...overlay,
      errors: [...overlay.errors.entries()],
      retryAttempts: [...(overlay.retryAttempts ?? new Map()).entries()],
    },
  };

  const here = dirname(fileURLToPath(import.meta.url));
  const dest = join(here, 'sample-retry-run.json');
  writeFileSync(dest, JSON.stringify(out, null, 2));
  console.log(`wrote ${dest}`);
  console.log(`attempts: ${JSON.stringify(out.runtimeOverlay.retryAttempts)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
