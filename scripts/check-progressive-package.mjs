/** Actual public archive: both runtime formats, SSR and strict consumer declarations. */
import { graphConsumerPackages } from "./fixtures/graph-consumer-packages.mjs";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, symlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const repo = fileURLToPath(new URL('../', import.meta.url));
const scratch = mkdtempSync(join(tmpdir(), 'progressive-package-'));
const env = { ...process.env, CI: 'true', npm_config_offline: 'true', npm_config_cache: join(scratch, 'npm-cache') };
function run(command, args, cwd = scratch) {
  const result = spawnSync(command, args, { cwd, env, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`${command} failed (${result.status})\n${result.stdout}\n${result.stderr}`);
  return result.stdout;
}
try {
  const packed = JSON.parse(run('npm', ['pack', '--json', '--ignore-scripts', '--pack-destination', scratch], repo));
  const modules = join(scratch, 'node_modules'), destination = join(modules, 'footprint-explainable-ui');
  mkdirSync(destination, { recursive: true });
  run('tar', ['-xzf', join(scratch, packed[0].filename), '--strip-components=1', '-C', destination]);
  const manifest = JSON.parse(readFileSync(join(repo, 'package.json'), 'utf8'));
  for (const name of new Set([...graphConsumerPackages(manifest), '@types/react', '@types/react-dom', '@types/node', 'typescript'])) {
    mkdirSync(dirname(join(modules, name)), { recursive: true });
    symlinkSync(join(repo, 'node_modules', name), join(modules, name), 'dir');
  }
  const native = JSON.parse(readFileSync(join(repo, 'test/fixtures/subflow-handoff/recording.json'), 'utf8')).runtimeSnapshot;
  writeFileSync(join(scratch, 'native.json'), JSON.stringify(native));
  const exercise = `
const assert = require('node:assert/strict');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const native = JSON.parse(require('node:fs').readFileSync(new URL('./native.json', 'file://' + __dirname + '/'), 'utf8'));
for (const entry of entries) {
  for (const name of ['createRecordingSource', 'prepareSubflow', 'createSubflowWorkerPreparation', 'attachSubflowWorker']) assert.equal(typeof entry[name], 'function', name);
  const root = structuredClone(native); root.subflowResults = {};
  const source = entry.createRecordingSource({ snapshot: root, graph: { nodes: [], edges: [] }, loadSubflow: () => ({ result: native.subflowResults['child#2'] }) });
  const loaded = await source.load({ invocationPath: ['child#2'], mountRuntimeStageId: 'child#2', subflowId: 'child' });
  assert(loaded.snapshots.length > 0);
  assert(source.getSnapshot().snapshot.subflowResults['child#2']);
  assert.deepEqual(root.subflowResults, {});
  assert(entry.FootprintLoadStatus);
  source.dispose();
  const live = entry.createRecordingSource({ snapshot: root, graph: { nodes: [], edges: [] } });
  assert.equal(live.canLoadSubflows, false);
  live.update({ snapshot: structuredClone(native), graph: { nodes: [], edges: [] } });
  await new Promise(resolve => { const off = live.subscribe(() => { if (live.getSnapshot().rootRevision === 1) { off(); resolve(); } }); });
  assert.equal(live.getSnapshot().rootRevision, 1);
  const inline = await live.load({ invocationPath: ['child#2'], mountRuntimeStageId: 'child#2', subflowId: 'child' });
  assert(inline.snapshots.length > 0);
  live.dispose();
  const probeRoot = structuredClone(root);
  probeRoot.commitLog[0].nativeProbe = { when: new Date('2026-01-01T00:00:00Z'), values: new Map([['amount', 35n]]), tags: new Set(['recorded']) };
  const probe = entry.createRecordingSource({ snapshot: probeRoot, graph: { nodes: [], edges: [] } });
  const preserved = probe.getSnapshot().snapshot.commitLog[0].nativeProbe;
  assert.equal(preserved.when.getTime(), probeRoot.commitLog[0].nativeProbe.when.getTime());
  assert.equal(preserved.values.get('amount'), 35n); assert(preserved.tags.has('recorded'));
  assert.notEqual(preserved.values, probeRoot.commitLog[0].nativeProbe.values);
  const rewrite = structuredClone(probeRoot); rewrite.commitLog[0].nativeProbe.when.setTime(0);
  assert.throws(() => probe.update({ snapshot: rewrite, graph: { nodes: [], edges: [] } }));
  probe.dispose();
  if (entry.MemoryPanel) {
    const memory = { amount: 35n, values: new Map([['items', 30n]]), tags: new Set([5n]), when: new Date(0) };
    const displaySource = entry.createRecordingSource({ snapshot: { sharedState: memory,
      executionTree: { id: 'write', name: 'Write', runtimeStageId: 'write#1', stageWrites: memory },
      commitLog: [{ stage: 'Write', stageId: 'write', runtimeStageId: 'write#1', trace: Object.keys(memory).map(path => ({ path })), overwrite: memory }] },
      graph: { nodes: [], edges: [] } });
    try {
      const snapshots = entry.toVisualizationSnapshots(displaySource.getSnapshot().snapshot);
      for (const unstyled of [false, true]) {
        const state = renderToStaticMarkup(React.createElement(entry.MemoryPanel, { snapshots, selectedIndex: 0, unstyled }));
        for (const value of ['35n', '30n', '5n', 'Map', 'Set', 'Date']) assert(state.includes(value), value);
      }
      const diff = renderToStaticMarkup(React.createElement(entry.ScopeDiff, { previous: { values: new Map([['items', 29n]]) }, current: { values: memory.values }, hideUnchanged: true, unstyled: true }));
      assert(diff.includes('data-type="changed"')); assert(diff.includes('29n')); assert(diff.includes('30n'));
      let calls = 0;
      const unsafe = {}; Object.defineProperty(unsafe, 'secret', { enumerable: true, get() { calls++; return 1; } });
      const unavailable = renderToStaticMarkup(React.createElement(entry.ScopeDiff, { previous: { nested: unsafe }, current: { nested: unsafe }, unstyled: true }));
      assert(unavailable.includes('[Unavailable]')); assert(!unavailable.includes('data-fp="diff-entry"')); assert.equal(calls, 0);
    } finally { displaySource.dispose(); }
  }
  const html = renderToStaticMarkup(React.createElement(entry.FootprintLoadStatus, { state: 'loading', label: 'Loading recorded scope', indicator: 'skeleton' }));
  assert.match(html, /aria-busy="true"/); assert.match(html, /loading-skeleton/);
}
process.stdout.write(format + ' public progressive source/SSR passed.\\n');
`;
  writeFileSync(join(scratch, 'consumer.cjs'), `const entries = [require('footprint-explainable-ui'), require('footprint-explainable-ui/flowchart')];\nconst format='CJS';\n(async()=>{${exercise}})().catch(e=>{console.error(e);process.exitCode=1});`);
  process.stdout.write(run(process.execPath, [join(scratch, 'consumer.cjs')]));
  writeFileSync(join(scratch, 'consumer.mjs'), `import { createRequire } from 'node:module';\nimport { fileURLToPath } from 'node:url';\nconst require=createRequire(import.meta.url);\nconst __dirname=fileURLToPath(new URL('.',import.meta.url));\nconst entries=[await import('footprint-explainable-ui'),await import('footprint-explainable-ui/flowchart')];\nconst format='ESM';\n${exercise}`);
  process.stdout.write(run(process.execPath, [join(scratch, 'consumer.mjs')]));
  writeFileSync(join(scratch, 'example.tsx'), readFileSync(join(repo, 'examples/lazy-subflows/LazySubflowExample.tsx')));
  const fixture = `import { createRecordingSource, createSubflowWorkerPreparation, attachSubflowWorker, type RecordingSourceOptions, type RecordingSourceUpdate, type ProgressiveRenderingOptions, type PreparationWorker } from 'footprint-explainable-ui';
import { createRecordingSource as flowchartSource } from 'footprint-explainable-ui/flowchart';
declare const options: RecordingSourceOptions; declare const worker: PreparationWorker;
const source = createRecordingSource(options); flowchartSource(options).dispose();
const liveUpdate: RecordingSourceUpdate = { snapshot: options.snapshot, graph: options.graph }; source.update(liveUpdate);
const prepare = createSubflowWorkerPreparation(worker); prepare.dispose(); attachSubflowWorker(worker)();
const rendering: ProgressiveRenderingOptions = { loadingIndicator: 'text', prefetch: 'idle' };
source.getSnapshot(); source.dispose(); void rendering;
`;
  for (const extension of ['mts', 'cts']) writeFileSync(join(scratch, `consumer.${extension}`), fixture);
  for (const [name, module, moduleResolution, files] of [['nodenext', 'NodeNext', 'NodeNext', ['consumer.mts', 'consumer.cts']], ['bundler', 'ESNext', 'Bundler', ['example.tsx']]]) {
    const config = join(scratch, `${name}.json`);
    writeFileSync(config, JSON.stringify({ compilerOptions: { strict: true, noEmit: true, skipLibCheck: false, target: 'ES2022', module, moduleResolution, jsx: 'react-jsx', esModuleInterop: true }, files }));
    process.stdout.write(run(process.execPath, [join(repo, 'node_modules/typescript/bin/tsc'), '-p', config]));
  }
  process.stdout.write('Strict NodeNext CJS/ESM and Bundler example consumers passed without Foottrace or source aliases.\n');
} finally { rmSync(scratch, { recursive: true, force: true }); }
