/**
 * Real public producers, deliberately outside src/record and ordinary test runs.
 * Usage: node generate.mjs --flow-root <directory resolving footprintjs 10>
 *                         --hci-root <directory resolving hcifootprint 3>
 *                         [--out <scratch output directory>]
 * No network, no model, no producer implementation imports, no clock mocking.
 */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const option = name => {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
};
if (!option('--flow-root') || !option('--hci-root')) {
  throw new Error('Supply --flow-root and --hci-root; this generator never installs dependencies.');
}
const flowRequire = createRequire(join(resolve(option('--flow-root')), 'package.json'));
const hciRequire = createRequire(join(resolve(option('--hci-root')), 'package.json'));
const out = option('--out') ? resolve(option('--out')) : here;
const load = (require, name) => import(pathToFileURL(require.resolve(name)).href);
function manifest(require, name) {
  let dir = dirname(require.resolve(name));
  for (;;) {
    try {
      const value = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
      if (value.name === name) return value;
    } catch { /* Move to the package root, never read user config. */ }
    const parent = dirname(dir);
    if (parent === dir) throw new Error(`Cannot find manifest for ${name}`);
    dir = parent;
  }
}
const versions = {
  flow: { footprintjs: manifest(flowRequire, 'footprintjs').version, foottrace: manifest(flowRequire, 'foottrace').version },
  hci: { hcifootprint: manifest(hciRequire, 'hcifootprint').version, footprintjs: manifest(hciRequire, 'footprintjs').version, foottrace: manifest(hciRequire, 'foottrace').version },
};
assert.equal(versions.flow.footprintjs, '10.0.0');
assert.equal(versions.flow.foottrace, '1.0.0');
assert.equal(versions.hci.hcifootprint, '3.0.0');
assert.equal(versions.hci.foottrace, '1.0.0');
const { flowChart, FlowChartExecutor, getSubtreeSnapshot } = await load(flowRequire, 'footprintjs');
const { keysReadFromExecutionTree, timeTravel } = await load(flowRequire, 'foottrace');
const { buildNavigationGraph } = await load(hciRequire, 'hcifootprint');

function treeReads(snapshot, log) {
  const reads = keysReadFromExecutionTree(snapshot.executionTree);
  return {
    origin: reads.kind,
    coverage: reads.coverage,
    byStep: Object.fromEntries([...new Set(log.map(b => b.runtimeStageId))].map(id => [id, reads.lookup(id)])),
  };
}
// One mapper-backed subflow produces a genuine mount/exit group. Its inner
// history is kept separate; neither fixture discovers or splices logs in a view.
const child = flowChart('Check', async s => {
  s.$setValue('approved', s.net >= 90);
}, 'check').build();
const chart = flowChart('Seed', async s => {
  s.$setValue('principal', 100);
  s.$setValue('fee', 5);
}, 'seed')
  .addFunction('Total', async s => s.$setValue('net', s.principal - s.fee), 'total')
  .addSubFlowChartNext('review', child, 'Review', {
    inputMapper: s => ({ net: s.net }),
    outputMapper: value => ({ approved: value.approved }),
  })
  .addFunction('Revise', async s => s.$setValue('net', 80), 'revise')
  .build();
const executor = new FlowChartExecutor(chart);
await executor.run();
const snapshot = executor.getSnapshot();
const subtree = getSubtreeSnapshot(snapshot, 'review');
assert.ok(subtree?.history?.length, 'Public subflow snapshot must carry its own history');
const flow = {
  root: {
    sourceId: 'flow:root',
    source: { initialState: snapshot.initialState, commitLog: snapshot.commitLog },
    reads: treeReads(snapshot, snapshot.commitLog),
  },
  child: {
    sourceId: 'flow:review',
    source: { initialState: subtree.initialState, history: subtree.history },
    reads: treeReads(subtree, subtree.history),
  },
};
assert.ok(snapshot.commitLog.some(b => b.phase === 'exit'), 'Real group evidence must be present');

const graph = buildNavigationGraph('record-pilot', {
  does: 'A small observed storefront session',
  pages: { home: { route: '/' } },
  actions: {
    unlock: { on: 'home', does: 'Unlock the basket', when: { authenticated: { eq: false } }, writes: ['authenticated', 'privateNote'] },
    add: { on: 'home', does: 'Add an item', when: { authenticated: { eq: true } }, writes: ['items', 'itemCount'] },
    checkout: { on: 'home', does: 'Confirm the basket', when: { authenticated: { eq: true }, itemCount: { gt: 0 } }, writes: ['orderId'] },
  },
});
// This baseline belongs to the fixture app and is captured BEFORE the session,
// not reconstructed from current state. It contains no secret initial values.
const initialState = { authenticated: false, items: [], itemCount: 0 };
const session = graph.createSession({ node: 'home', state: initialState, redactedKeys: ['privateNote'] });
function observed(id, state) {
  const fired = session.fire(id, { source: 'user' });
  assert.equal(fired.ok, true, JSON.stringify(fired));
  const updated = session.updateState(state);
  assert.equal(updated.ok, true, JSON.stringify(updated));
}
// Human-observed actions followed by the app's state reports. No fake agent
// handler is registered and no effect is claimed from a model response.
observed('unlock', { authenticated: true, privateNote: 'fixture-only-private-note' });
observed('add', { items: [{ id: 'p1' }], itemCount: 1 });
observed('add', { items: [{ id: 'p1' }, { id: 'p2' }], itemCount: 2 });
observed('checkout', { orderId: 'demo-order-1' });
session.sync('home');
const beforePending = session.commitLog().length;
const pending = session.fire('add', { source: 'user' });
assert.equal(pending.ok, true);
assert.equal(session.commitLog().length, beforePending, 'Pending action must not become a state commit');
const hci = {
  sourceId: 'hci:storefront',
  source: { initialState, commitLog: session.commitLog() },
  reads: { origin: 'Session.readsByStep', byStep: Object.fromEntries(session.readsByStep()) },
  observation: {
    pendingId: pending.transition.id,
    transitions: session.transitions().map(({ id, outcome }) => ({ id, outcome })),
    liveItemCount: session.state().itemCount,
  },
};
assert.equal(JSON.stringify(hci).includes('fixture-only-private-note'), false, 'Only the producer-redacted record may be saved');
mkdirSync(out, { recursive: true });
const fixtures = { 'flow.json': flow, 'hci.json': hci };
const digests = {};
for (const [name, value] of Object.entries(fixtures)) {
  const bytes = JSON.stringify(value, null, 2) + '\n';
  writeFileSync(join(out, name), bytes);
  digests[name] = createHash('sha256').update(bytes).digest('hex');
}
const facts = {
  versions,
  fixtureSha256: digests,
  flow: { rootRows: snapshot.commitLog.length, rootStops: timeTravel(flow.root.source).stops, childRows: subtree.history.length, childStops: timeTravel(flow.child.source).stops },
  hci: { rows: hci.source.commitLog.length, stops: timeTravel(hci.source).stops, transitions: hci.observation.transitions },
};
writeFileSync(join(out, 'provenance.json'), JSON.stringify(facts, null, 2) + '\n');
console.log(JSON.stringify(facts, null, 2));
