/** Run local FootprintJS applications and save their actual recorder output. */
import assert from 'node:assert/strict';
import { writeFileSync, readFileSync, realpathSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { createTraceBundle } from '../../dist/flowchart.js';

const require = createRequire(import.meta.url);
// Optional development capture through the engine's built public entry points.
// Saved recordings identify this source build; it is not a published-package claim.
const engineCheckout = process.env.FOOTPRINT_ENGINE_CHECKOUT && resolve(process.env.FOOTPRINT_ENGINE_CHECKOUT);
const enginePackage = JSON.parse(readFileSync(engineCheckout
  ? resolve(engineCheckout, 'package.json') : require.resolve('footprintjs/package.json'), 'utf8'));
assert.equal(enginePackage.name, 'footprintjs');
const loadEngine = (entry) => import(engineCheckout
  ? pathToFileURL(resolve(engineCheckout, enginePackage.exports[entry].import.default)).href
  : entry === '.' ? 'footprintjs' : `footprintjs/${entry.slice(2)}`);
const { flowChart, FlowChartExecutor, decide, select } = await loadEngine('.');
const { narrative, metrics } = await loadEngine('./recorders');
const engineVersion = enginePackage.version;
const expectedEngineVersion = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')).dependencies.footprintjs;
if (!engineCheckout) assert.equal(engineVersion, expectedEngineVersion, 'Install the playground dependencies before recording: npm install --prefix examples/local-playground');
const revision = directory => execFileSync('git', ['-C', directory, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
function recordLayerSource() {
  const recordPackagePath = realpathSync(createRequire(resolve(engineCheckout, 'package.json')).resolve('foottrace/package.json'));
  const directory = dirname(recordPackagePath);
  const version = JSON.parse(readFileSync(recordPackagePath, 'utf8')).version;
  try {
    const gitRoot = execFileSync('git', ['-C', directory, 'rev-parse', '--show-toplevel'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    return { version, ...(gitRoot === directory && { revision: revision(directory) }) };
  } catch {
    // An installed package can live outside a Git checkout.
    return { version };
  }
}
const sourceBuild = engineCheckout ? {
  engineRevision: revision(engineCheckout),
  recordLayer: recordLayerSource(),
  nestedReadTracking: true,
  released: false,
} : undefined;

// Consumer-owned voice: the engine saves these sentences in its normal
// narrativeEntries JSON. Both Lens audiences replay that same recording.
const valueNames = { rates: 'available rates', baseRate: 'base price', riskFactor: 'risk multiplier',
  quote: 'final price', shippingRates: 'delivery options', shippingStatus: 'shipping status',
  reviewReason: 'review reason', auditNote: 'audit note' };
const friendly = key => valueNames[key] ?? key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]/g, ' ').toLowerCase();
const describeValue = value => Array.isArray(value)
  ? value.length === 0 ? 'none' : value.every(item => ['string', 'number', 'boolean'].includes(typeof item))
    ? value.slice(0, 6).join(', ') + (value.length > 6 ? ', …' : '') : `${value.length} recorded items`
  : value && typeof value === 'object' ? 'the recorded details'
  : typeof value === 'string' ? value : String(value);
const commentaryFormatter = {
  renderStage: ({ description, stageName, loopIteration }) =>
    `This step: ${description ?? friendly(stageName)}${loopIteration ? ` (visit ${loopIteration})` : ''}.`,
  renderOp: ({ type, key, rawValue }) => `${type === 'read' ? 'Used' : 'Recorded'} ${friendly(key)}: ${describeValue(rawValue)}.`,
  renderDecision: ({ chosen, rationale }) => `The process selected the “${chosen}” route.${rationale ? ` ${rationale}` : ''}`,
  renderSubflow: ({ name, direction }) => `The process ${direction === 'entry' ? 'entered' : 'returned from'} “${name}”.`,
  renderFork: ({ children }) => `The process split into these branches: ${children.join(', ')}.`,
  renderEmit: ({ name, payload }) => ['example.comment', 'example.outcome'].includes(name)
    && typeof payload?.message === 'string' ? payload.message : undefined,
};
// Real application messages, emitted during the stage. Interpolate calculation
// locals instead of reading scope again just to narrate it: instrumentation
// must not add state reads or change the value's recorded provenance.
const comment = (scope, message) => scope.$emit('example.comment', { message });
const outcome = (scope, message) => scope.$emit('example.outcome', { message: `Result: ${message}` });

async function record(meta, build, verify) {
  const bundle = createTraceBundle();
  const chart = build(bundle.structure.recorder);
  const executor = new FlowChartExecutor(chart, { readTracking: 'full', writeProvenance: 'reads-prefix', captureOutputHandoff: true,
    ...(sourceBuild && { nestedReadTracking: true }) });
  const story = narrative({ renderer: commentaryFormatter });
  executor.attachCombinedRecorder(story);
  executor.attachScopeRecorder(metrics());
  bundle.attachTo(executor);
  await executor.run();
  const runtimeSnapshot = executor.getSnapshot();
  if (sourceBuild) assert.equal(runtimeSnapshot.nestedReadTracking, true, 'Build an engine checkout with canonical nested-read capture before recording.');
  const overlay = bundle.runtimeOverlay.getOverlay();
  const traceGraph = bundle.structure.getGraph();
  const narrativeEntries = story.getEntries();
  verify(runtimeSnapshot.sharedState, overlay, { runtimeSnapshot, traceGraph });
  assert.ok(runtimeSnapshot.commitLog.length > 0, `${meta.id}: no commits`);
  assert.ok(traceGraph.nodes.length > 0, `${meta.id}: no structure`);
  assert.ok(overlay.executionOrder.length > 0, `${meta.id}: no executions`);
  assert.ok(narrativeEntries.some(entry => entry.type === 'emit'), `${meta.id}: no application commentary captured`);
  const result = {
    ...meta,
    groupedSubflows: traceGraph.nodes.filter((node) => node.data.isSubflow).map((node) => node.id),
    runtimeSnapshot,
    narrativeEntries,
    traceGraph,
    runtimeOverlay: {
      ...overlay,
      errors: [...overlay.errors],
      retryAttempts: [...(overlay.retryAttempts ?? [])],
    },
  };
  console.log(`${meta.id}: ${runtimeSnapshot.commitLog.length} commits, ${traceGraph.nodes.length} chart nodes, ${overlay.executionOrder.length} executed steps`);
  return result;
}

const pricing = await record({
  id: 'pricing',
  category: 'data-lineage',
  title: 'An unexpected price',
  description: 'A deliberately wrong lookup selects the last rate instead of the cheapest. An audit step sits in the history but does not feed the price.',
  outcome: 'Quote: 11.88. The selected base rate is 9.9; the cheapest available rate was 3.1.',
  guide: [
    'Select Quote in the chart or timeline, then open Developer.',
    'Trace quote to see the recorded inputs baseRate and riskFactor.',
    'Follow baseRate back to PickBase and LoadRates. Audit is a chronological neighbor with no recorded input to the quote.',
  ],
}, (structureRecorder) => flowChart('LoadRates', async (scope) => {
  await delay(30);
  scope.rates = [3.1, 3.4, 9.9];
  comment(scope, 'Loaded three available rates from the local table.');
}, 'load-rates', { description: 'Load the local rate table', structureRecorders: [structureRecorder] })
  .addFunction('PickBase', async (scope) => {
    const baseRate = scope.rates[scope.rates.length - 1];
    scope.baseRate = baseRate;
    comment(scope, `Selected the last rate in the list: ${baseRate}. This example intentionally does not select the cheapest rate.`);
  }, 'pick-base', 'Select the last rate (intentional example bug)')
  .addFunction('Audit', async (scope) => {
    scope.auditNote = 'Local example checked';
    comment(scope, 'Saved a separate audit note. This step does not calculate the price.');
  }, 'audit', 'Write a separate audit note')
  .addFunction('AssessRisk', async (scope) => {
    await delay(15);
    scope.riskFactor = 1.2;
    comment(scope, 'Set the example risk multiplier to 1.2.');
  }, 'assess-risk', 'Apply the example risk multiplier')
  .addFunction('Quote', async (scope) => {
    const quote = Number((scope.baseRate * scope.riskFactor).toFixed(2));
    scope.quote = quote;
    outcome(scope, `The calculated price is ${quote}.`);
  }, 'quote', 'Compute the final price')
  .build(), (state) => {
    assert.equal(state.baseRate, 9.9);
    assert.equal(state.quote, 11.88);
  });

const shipping = await record({
  id: 'shipping',
  category: 'decision',
  title: 'No shipping option',
  description: 'The simulated carrier returns no rates. A recorded decision routes the order to manual review and leaves label creation unexecuted.',
  outcome: 'Manual review queued. No shipping label was created.',
  guide: [
    'Play the run and watch the decision follow the manual-review branch.',
    'Select ChooseShipping and inspect the recorded fallback decision and empty shippingRates.',
    'Compare the executed QueueManualReview step with the unexecuted CreateLabel branch.',
  ],
}, (structureRecorder) => flowChart('LoadOrder', async (scope) => {
  scope.order = { id: 'ORDER-1042', destination: 'example destination', weightKg: 2 };
  comment(scope, 'Received order ORDER-1042 with a package weight of 2 kg.');
}, 'load-order', { description: 'Receive a sample order', structureRecorders: [structureRecorder] })
  .addFunction('FetchShippingRates', async (scope) => {
    await delay(40);
    scope.requestedOrderId = scope.order.id;
    scope.shippingRates = [];
    comment(scope, 'The simulated delivery service returned no shipping options for this order.');
  }, 'fetch-rates', 'Simulate a carrier returning no shipping rates')
  .addDeciderFunction('ChooseShipping', (scope) => decide(scope, [
    { when: (state) => state.shippingRates.length > 0, then: 'label', label: 'At least one shipping rate is available' },
  ], 'manual'), 'choose-shipping', 'Choose a label or manual review')
  .addFunctionBranch('label', 'CreateLabel', async (scope) => {
    scope.shippingStatus = 'label-created';
    outcome(scope, 'The order was marked as having a shipping label.');
  }, 'Create a label only when a rate exists')
  .addFunctionBranch('manual', 'QueueManualReview', async (scope) => {
    scope.shippingStatus = 'manual-review';
    scope.reviewReason = 'No shipping rates were returned';
    outcome(scope, 'The order was marked for manual review because no shipping rates were returned.');
  }, 'Queue the order for manual review')
  .setDefault('manual')
  .end()
  .build(), (state, overlay) => {
    assert.equal(state.shippingStatus, 'manual-review');
    assert.deepEqual(state.shippingRates, []);
    assert.equal(overlay.executionOrder.some((step) => step.stageName === 'CreateLabel'), false);
  });

const retry = await record({
  id: 'retry',
  category: 'retry',
  title: 'A retry that recovers',
  description: 'A local simulated quote service fails twice, then succeeds. FetchQuote allows three attempts; Settle also has a retry policy but succeeds on its first try.',
  outcome: 'FetchQuote succeeded on attempt 3. Settlement: 4,150 for 100 units at 41.50 each.',
  guide: [
    'Play to FetchQuote and look for its three-attempt badge.',
    'Open Developer to inspect the recorded retry activity, then Commentary to follow the recovery.',
    'Compare Settle: it declares retries but has no retry badge because it succeeded immediately.',
  ],
}, (structureRecorder) => {
  let attempts = 0;
  return flowChart('LoadSymbol', async (scope) => {
    scope.symbol = 'ACME';
    scope.quantity = 100;
    comment(scope, 'Loaded the example symbol ACME and a quantity of 100.');
  }, 'load-symbol', { description: 'Load a sample symbol and quantity', structureRecorders: [structureRecorder] })
    .addFunction('FetchQuote', async (scope) => {
      attempts += 1;
      await delay(20);
      if (attempts < 3) throw new Error('Simulated quote service unavailable (503)');
      scope.fetchAttempt = attempts;
      scope.quote = { symbol: scope.symbol, price: 41.5 };
      comment(scope, `The simulated quote service succeeded on attempt ${attempts}, returning a price of 41.50.`);
    }, 'fetch-quote', 'Call the simulated quote service')
    .retry({ attempts: 3 })
    .addFunction('Settle', async (scope) => {
      const settlement = { symbol: scope.quote.symbol, total: scope.quote.price * scope.quantity };
      scope.settlement = settlement;
      outcome(scope, `The settlement total is ${settlement.total}.`);
    }, 'settle', 'Calculate the settlement')
    .retry({ attempts: 2 })
    .build();
}, (state, overlay) => {
  assert.equal(state.fetchAttempt, 3);
  assert.equal(state.settlement.total, 4150);
  const fetchStep = overlay.executionOrder.find((step) => step.stageName === 'FetchQuote');
  const settleStep = overlay.executionOrder.find((step) => step.stageName === 'Settle');
  assert.ok(fetchStep && settleStep, 'Both quote and settlement steps must be recorded');
  assert.equal(overlay.retryAttempts.get(fetchStep.runtimeStageId), 3);
  assert.equal(overlay.retryAttempts.has(settleStep.runtimeStageId), false);
});

const linear = await record({
  id: 'linear',
  category: 'linear',
  title: 'Three steps in a straight line',
  description: 'Load three numbers, calculate their sum, then format the result. Every step reads the previous step\'s recorded output.',
  outcome: 'The numbers 2, 4 and 6 produce Total: 12.',
  guide: [
    'Step through LoadNumbers, Sum and FormatResult in order.',
    'Open Developer to compare numbers, sum and result at each stop.',
    'Trace result back through sum to the originally loaded numbers.',
  ],
}, (structureRecorder) => flowChart('LoadNumbers', async (scope) => {
  scope.numbers = [2, 4, 6];
  comment(scope, 'Loaded the three numbers 2, 4 and 6.');
}, 'load-numbers', { description: 'Load three local numbers', structureRecorders: [structureRecorder] })
  .addFunction('Sum', async (scope) => {
    const sum = scope.numbers.reduce((total, value) => total + value, 0);
    scope.sum = sum;
    comment(scope, `Added the numbers together to get ${sum}.`);
  }, 'sum', 'Add the numbers')
  .addFunction('FormatResult', async (scope) => {
    const result = `Total: ${scope.sum}`;
    scope.result = result;
    outcome(scope, `The formatted answer is “${result}”.`);
  }, 'format-result', 'Format the computed total')
  .build(), (state, overlay) => {
    assert.equal(state.sum, 12);
    assert.equal(state.result, 'Total: 12');
    assert.deepEqual(overlay.executionOrder.map((step) => step.stageId), ['load-numbers', 'sum', 'format-result']);
  });

const parallel = await record({
  id: 'parallel',
  category: 'parallel',
  title: 'Two branches, one combined total',
  description: 'Two selected branches independently calculate item and delivery amounts. The join reads both branch results from their recorded runs namespaces.',
  outcome: 'Items: 30. Delivery: 5. Combined total: 35.',
  guide: [
    'Follow RunCalculations as it fans out into Items and Delivery, then rejoins at Combine.',
    'Inspect the branch outputs under runs.items and runs.delivery.',
    'Select Combine to see both amounts used in the final total. Parallel completion order can vary; the result remains 35.',
  ],
}, (structureRecorder) => flowChart('LoadOrder', async (scope) => {
  scope.unitPrice = 10;
  scope.quantity = 3;
  scope.deliveryFee = 5;
  comment(scope, 'Loaded an item price of 10, a quantity of 3 and a delivery fee of 5.');
}, 'load-order', { description: 'Load item and delivery inputs', structureRecorders: [structureRecorder] })
  .addSelectorFunction('RunCalculations', (scope) => select(scope, [
    { when: () => true, then: 'items', label: 'Calculate the item amount' },
    { when: () => true, then: 'delivery', label: 'Calculate the delivery amount' },
  ]), 'run-calculations', 'Run both independent calculations')
  .addFunctionBranch('items', 'Items', async (scope) => {
    const amount = scope.unitPrice * scope.quantity;
    scope.amount = amount;
    comment(scope, `The item calculation produced ${amount}.`);
  }, 'Calculate the item subtotal')
  .addFunctionBranch('delivery', 'Delivery', async (scope) => {
    const amount = scope.deliveryFee;
    scope.amount = amount;
    comment(scope, `The delivery calculation produced ${amount}.`);
  }, 'Calculate the delivery charge')
  .end()
  .addFunction('Combine', async (scope) => {
    const total = scope.runs.items.amount + scope.runs.delivery.amount;
    scope.total = total;
    outcome(scope, `The combined item and delivery total is ${total}.`);
  }, 'combine', 'Combine the two branch results')
  .build(), (state, overlay, { traceGraph, runtimeSnapshot }) => {
    assert.equal(state.runs.items.amount, 30);
    assert.equal(state.runs.delivery.amount, 5);
    assert.equal(state.total, 35);
    if (sourceBuild) {
      const branchPaths = runtimeSnapshot.commitLog
        .filter(bundle => bundle.stageId === 'items' || bundle.stageId === 'delivery')
        .flatMap(bundle => bundle.trace.map(write => write.path));
      const totalWrite = runtimeSnapshot.commitLog.flatMap(bundle => bundle.trace).find(write => write.path === 'total');
      assert.equal(branchPaths.length, 2);
      for (const path of branchPaths) assert.ok(totalWrite.readKeys.includes(path), `total must retain its actual recorded read of ${path}`);
    }
    for (const stageId of ['items', 'delivery', 'combine']) {
      assert.equal(overlay.executionOrder.filter((step) => step.stageId === stageId).length, 1);
    }
    const joins = traceGraph.edges.filter((edge) => edge.target === 'combine');
    assert.deepEqual(joins.map((edge) => edge.source).sort(), ['delivery', 'items']);
  });

const loop = await record({
  id: 'loop',
  category: 'loop',
  title: 'Refine until the third visit',
  description: 'Refine increases a score by four on each visit. Review follows the loop back twice and breaks when the score reaches twelve.',
  outcome: 'Three Refine visits, three Review visits, score 12 and accepted = true.',
  guide: [
    'Play the repeated Refine and Review visits on the time rail.',
    'Compare attempt and score as the same chart nodes are visited again.',
    'Trace score from the final visit and look for the earlier passes, then inspect the recorded break in Commentary.',
  ],
}, (structureRecorder) => flowChart('Seed', async (scope) => {
  scope.attempt = 0;
  scope.score = 0;
  comment(scope, 'Started refinement with a score of zero.');
}, 'seed', { description: 'Start with no refinement attempts', structureRecorders: [structureRecorder] })
  .addFunction('Refine', async (scope) => {
    const attempt = scope.attempt + 1;
    scope.attempt = attempt;
    const score = scope.score + 4;
    scope.score = score;
    comment(scope, `Refinement ${attempt} increased the score to ${score}.`);
  }, 'refine', 'Increase the score by four')
  .addFunction('Review', async (scope) => {
    scope.accepted = scope.score >= 12;
    if (scope.accepted) {
      outcome(scope, 'The target score was reached.');
      scope.$break('Three refinements reached the target score');
    } else comment(scope, 'The score has not reached the target yet.');
  }, 'review', 'Break once the target score is reached')
  .loopTo('refine')
  .build(), (state, overlay, { traceGraph }) => {
    assert.equal(state.attempt, 3);
    assert.equal(state.score, 12);
    assert.equal(state.accepted, true);
    for (const stageId of ['refine', 'review']) {
      const visits = overlay.executionOrder.filter((step) => step.stageId === stageId);
      assert.equal(visits.length, 3);
      assert.equal(new Set(visits.map((step) => step.runtimeStageId)).size, 3);
    }
    assert.ok(traceGraph.edges.some((edge) => edge.source === 'review' && edge.target === 'refine' && edge.data?.kind === 'loop'));
  });

const subflows = await record({
  id: 'subflows',
  category: 'subflow',
  title: 'Repeated names in separate subflows',
  description: 'Two root Prepare mounts and a nested Pipeline → Prepare all contain Clean, Scale and Sum. Their exact recorded paths keep their states separate.',
  outcome: 'First total: 20. Second total: 6. Nested pipeline total: 23. Grand total: 49.',
  guide: [
    'Open Topology and drill into each Prepare mount; the identical stage labels belong to separate paths.',
    'Open Pipeline, then its nested Prepare, and compare its input and total with the two root mounts.',
    'Use the breadcrumbs to return to the root and inspect Report. Root commits show mount outputs; child history is inspected inside its own recorded scope.',
  ],
}, (structureRecorder) => {
  const prepare = () => flowChart('Clean', async (scope) => {
    const cleaned = scope.raw.filter((value) => value > 0);
    scope.cleaned = cleaned;
    comment(scope, `Kept ${cleaned.length} positive input values.`);
  }, 'clean', { description: 'Keep positive input values' })
    .addFunction('Scale', async (scope) => {
      const scaled = scope.cleaned.map((value) => value * 2);
      scope.scaled = scaled;
      comment(scope, `Doubled each retained value, producing ${scaled.join(', ')}.`);
    }, 'scale', 'Double each retained value')
    .addFunction('Sum', async (scope) => {
      const total = scope.scaled.reduce((total, value) => total + value, 0);
      scope.total = total;
      outcome(scope, `This preparation produced a total of ${total}.`);
    }, 'sum', 'Add the scaled values')
    .build();
  const pipeline = flowChart('LoadInput', async (scope) => {
    scope.raw = [5, 6];
    comment(scope, 'Loaded the nested pipeline values 5 and 6.');
  }, 'load-input', { description: 'Load the nested pipeline input' })
    .addSubFlowChartNext('prepare', prepare(), 'Prepare', {
      inputMapper: (scope) => ({ raw: scope.raw }),
      outputMapper: (result) => ({ total: result.total }),
    })
    .addFunction('Summarize', async (scope) => {
      const total = scope.total + 1;
      scope.pipelineTotal = total;
      outcome(scope, `After adding the pipeline adjustment, the total is ${total}.`);
    }, 'summarize', 'Add the pipeline adjustment')
    .build();
  return flowChart('Seed', async (scope) => {
    scope.raw = [3, -1, 7];
    comment(scope, 'Loaded the root values 3, -1 and 7.');
  }, 'seed', { description: 'Load the root input', structureRecorders: [structureRecorder] })
    .addSubFlowChartNext('first', prepare(), 'Prepare', {
      inputMapper: (scope) => ({ raw: scope.raw }),
      outputMapper: (result) => ({ firstTotal: result.total }),
    })
    .addSubFlowChartNext('second', prepare(), 'Prepare', {
      inputMapper: () => ({ raw: [1, 2] }),
      outputMapper: (result) => ({ secondTotal: result.total }),
    })
    .addSubFlowChartNext('pipeline', pipeline, 'Pipeline', {
      inputMapper: () => ({}),
      outputMapper: (result) => ({ nestedTotal: result.pipelineTotal }),
    })
    .addFunction('Report', async (scope) => {
      const total = scope.firstTotal + scope.secondTotal + scope.nestedTotal;
      scope.grandTotal = total;
      outcome(scope, `The three recorded mount outputs combine to ${total}.`);
    }, 'report', 'Combine the independent mount outputs')
    .build();
}, (state, overlay, { runtimeSnapshot, traceGraph }) => {
  assert.equal(state.firstTotal, 20);
  assert.equal(state.secondTotal, 6);
  assert.equal(state.nestedTotal, 23);
  assert.equal(state.grandTotal, 49);
  const mountPaths = ['first', 'second', 'pipeline', 'pipeline/prepare'];
  assert.deepEqual(traceGraph.nodes.filter((node) => node.data.isSubflow).map((node) => node.id).sort(), [...mountPaths].sort());
  const results = runtimeSnapshot.subflowResults ?? {};
  for (const mountPath of mountPaths) {
    const exactIds = Object.keys(results).filter((id) => id.split('#')[0] === mountPath && id.includes('#'));
    assert.equal(exactIds.length, 1, `${mountPath}: exactly one recorded invocation is required`);
    const context = results[exactIds[0]].treeContext;
    assert.ok(context.history.length > 0, `${mountPath}: child history must be available`);
    assert.ok(context.stageContexts.runtimeStageId.includes('#'), `${mountPath}: child stages need exact runtime IDs`);
  }
  for (const mountPath of ['first', 'second', 'pipeline/prepare']) {
    for (const stageId of ['clean', 'scale', 'sum']) {
      assert.ok(traceGraph.nodes.some((node) => node.id === `${mountPath}/${stageId}`));
    }
  }
  assert.ok(overlay.executionOrder.some((step) => step.stageName === 'Report'));
});

const destination = new URL('./recordings.json', import.meta.url);
writeFileSync(destination, JSON.stringify({
  generatedAt: new Date().toISOString(),
  engineVersion,
  ...(sourceBuild && { sourceBuild }),
  scenarios: [linear, pricing, shipping, parallel, loop, retry, subflows],
}, null, 2));
console.log(`Saved ${destination.pathname}`);
