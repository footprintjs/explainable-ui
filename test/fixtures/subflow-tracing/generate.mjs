/** Offline tooling: actual public footprintjs 10.3.0 records, never a runtime import.
 * node generate.mjs --producer-root /path/resolving/footprintjs --out /scratch
 * No install, clock replacement, model or network call. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';

const args = process.argv.slice(2);
const option = name => args[args.indexOf(name) + 1];
assert.ok(args.includes('--producer-root') && args.includes('--out'), 'Supply both tooling directories');
const require = createRequire(join(resolve(option('--producer-root')), 'package.json'));
const { flowChart, FlowChartExecutor } = require('footprintjs');
const version = require('footprintjs/package.json').version;
assert.equal(version, '10.3.0');
const out = resolve(option('--out'));
mkdirSync(out, { recursive: true });

function quote() {
  return flowChart('Child Seed', async scope => {
    scope.items = [scope.base, 2];
    scope.rate = 2;
  }, 'seed')
    .addFunction('Child Sum', async scope => {
      scope.subtotal = scope.items.reduce((a, b) => a + b, 0);
    }, 'sum')
    .addFunction('Child Audit', async scope => {
      scope.audit = String(scope.subtotal);
    }, 'audit')
    .addFunction('Child Total', async scope => {
      scope.total = scope.subtotal * scope.rate;
    }, 'total')
    .build();
}
const mapQuote = {
  inputMapper: scope => ({ base: scope.base }),
  outputMapper: result => ({ total: result.total }),
};

async function record(build) {
  const structureEvents = [];
  const capture = Object.fromEntries(
    ['onStageAdded', 'onEdgeAdded', 'onLoopEdgeAdded', 'onDeciderComplete', 'onSubflowMounted']
      .map(method => [method, event => structureEvents.push({ method, event: JSON.parse(JSON.stringify(event)) })]),
  );
  capture.id = 'scoped-trace-fixture';
  const executor = new FlowChartExecutor(build(capture));
  executor.enableNarrative();
  await executor.run();
  return { runtimeSnapshot: executor.getSnapshot(), narrativeEntries: executor.getNarrativeEntries(), structureEvents };
}

const nested = await record(capture => {
  const middle = flowChart('Middle Seed', async scope => { scope.base = 20; }, 'seed')
    .addSubFlowChartNext('prepare', quote(), 'Nested Quote', mapQuote).build();
  return flowChart('Root Seed', async scope => {
    scope.base = 10;
    scope.total = 9999;
  }, 'seed', { structureRecorders: [capture] })
    .addSubFlowChartNext('prepare', quote(), 'First Quote', mapQuote)
    .addSubFlowChartNext('pipeline', middle, 'Pipeline', {
      inputMapper: () => ({}), outputMapper: value => ({ nestedTotal: value.total }),
    })
    .addFunction('Root Report', async scope => { scope.report = scope.nestedTotal; }, 'report').build();
});

const repeated = await record(capture => flowChart('Root Seed', async scope => {
  scope.pass = 0;
}, 'seed', { structureRecorders: [capture] })
  .addFunction('Advance', async scope => { scope.pass += 1; scope.base = scope.pass * 10; }, 'advance')
  .addSubFlowChartNext('prepare', quote(), 'Repeated Quote', mapQuote)
  .addFunction('Check Pass', async scope => { if (scope.pass >= 2) scope.$break('two passes recorded'); }, 'check')
  .loopTo('advance').build());

const bytes = JSON.stringify({ nested, repeated }, null, 2) + '\n';
writeFileSync(join(out, 'recordings.json'), bytes);
writeFileSync(join(out, 'provenance.json'), JSON.stringify({
  producer: { footprintjs: version },
  source: 'test/fixtures/subflow-tracing/generate.mjs',
  sha256: createHash('sha256').update(bytes).digest('hex'),
  note: 'Actual public run snapshots. Producer run IDs and times retained; no claim of byte-deterministic regeneration.',
}, null, 2) + '\n');
assert.equal(readFileSync(join(out, 'recordings.json'), 'utf8'), bytes);
console.log(JSON.stringify({ producer: version, bytes: Buffer.byteLength(bytes), sha256: createHash('sha256').update(bytes).digest('hex') }));
