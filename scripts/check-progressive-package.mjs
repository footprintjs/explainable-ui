/** Actual public archive: both runtime formats, SSR and strict consumer declarations. */
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
  for (const name of new Set([...Object.keys(manifest.peerDependencies), ...Object.keys(manifest.dependencies), '@types/react', '@types/react-dom', '@types/node', 'typescript'])) {
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
  const fixture = `import { createRecordingSource, createSubflowWorkerPreparation, attachSubflowWorker, type RecordingSourceOptions, type ProgressiveRenderingOptions, type PreparationWorker } from 'footprint-explainable-ui';
import { createRecordingSource as flowchartSource } from 'footprint-explainable-ui/flowchart';
declare const options: RecordingSourceOptions; declare const worker: PreparationWorker;
const source = createRecordingSource(options); flowchartSource(options).dispose();
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
