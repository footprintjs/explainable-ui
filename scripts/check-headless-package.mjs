/** Built archive only: renderless/shared presentation SSR and strict public consumers. */
import { graphConsumerPackages } from "./fixtures/graph-consumer-packages.mjs";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, symlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const repo = fileURLToPath(new URL('../', import.meta.url));
const scratch = mkdtempSync(join(tmpdir(), 'headless-package-'));
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
  // The small example is an unchanged published engine13/Foottrace2 capture.
  const recording = JSON.parse(readFileSync(join(repo, 'examples/headless-controller/recording.json'), 'utf8'));
  writeFileSync(join(scratch, 'recording.json'), JSON.stringify(recording));
  const exercise = `
const assert = require('node:assert/strict');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const recording = JSON.parse(require('node:fs').readFileSync(new URL('./recording.json', 'file://' + __dirname + '/'), 'utf8'));
for (const name of ['LensControllerProvider', 'useLensController', 'LensReplayControls', 'CommentaryPanel', 'ExplainableShell']) {
  assert.equal(typeof api[name], 'function', name);
}
const source = api.createRecordingSource(recording);
try {
  const models = [];
  function Probe() { models.push(api.useLensController()); return null; }
  const provider = (...children) => React.createElement(api.LensControllerProvider,
    { source, replayControls: { presentation: 'range', scale: 'log-duration', intervalMs: 700 } }, ...children);
  const html = renderToStaticMarkup(provider(React.createElement(Probe), React.createElement(Probe)));
  assert.equal(html, '', 'headless owner must add no presentation DOM');
  assert.equal(models.length, 2);
  assert.equal(models[0], models[1], 'consumers share the same model');
  assert.equal(models[0].recordingStatus.status, 'ready');
  assert.equal(models[0].snapshots.length, 5);
  assert.equal(models[0].selectedSnapshot.runtimeStageId, 'load-order#0');
  assert.equal(models[0].selectedSnapshot.stageLabel, 'load-order');
  assert.equal(models[0].playback.playing, false);
  assert.equal(models[0].traceWalk, null);
  assert.equal(models[0].replayAxis.scale, 'log-duration');
  assert.equal(models[0].replayAxis.availability, 'fallback');
  assert.equal(models[0].replayAxis.indexAt(models[0].replayAxis.positionAt(2)), 2);
  assert.equal(source.getSnapshot().snapshot.sharedState.total, 35);

  const stock = renderToStaticMarkup(provider(
    React.createElement(api.LensReplayControls, { unstyled: true }),
    React.createElement(api.CommentaryPanel, { presentation: 'current', unstyled: true })));
  assert.match(stock, /aria-label="Replay position"/);
  assert.match(stock, /Step 1 of 5: load-order/);
  assert(!stock.includes('data-fp="tt-tick"'), 'range presentation omits stage ticks');
  assert(stock.includes('No positive timing recorded'));
  assert(stock.includes('This step: Load item and delivery inputs.'));
  assert(!stock.includes('This step: Combine the two branch results.'));

  const sharedShell = renderToStaticMarkup(provider(React.createElement(api.ExplainableShell, {
    unstyled: true, title: 'Shared packaged Shell', renderFlowchart: () => React.createElement(Probe),
    layout: { columns: '1fr', areas: [['timeTravel'], ['flowchart']] },
  })));
  assert.match(sharedShell, /aria-label="Replay position"/);
  assert(!sharedShell.includes('data-fp="tt-tick"'));
  const jsonShell = renderToStaticMarkup(React.createElement(api.ExplainableShell, {
    source, unstyled: true, renderFlowchart: () => null, replayControls: { playPause: false },
    layout: { columns: '1fr', areas: [['timeTravel'], ['flowchart']],
      replayControls: { presentation: 'range', previousNext: false } },
  }));
  assert.match(jsonShell, /aria-label="Replay position"/);
  for (const part of ['tt-tick', 'tt-play', 'tt-prev', 'tt-next']) assert(!jsonShell.includes('data-fp="' + part + '"'), part);
  assert.throws(() => renderToStaticMarkup(provider(React.createElement(api.ExplainableShell, { source }))),
    /shared LensControllerProvider owns recording and replay options/);
} finally { source.dispose(); }
process.stdout.write(format + ' packed headless/shared Shell, Commentary and range SSR passed.\\n');
`;
  writeFileSync(join(scratch, 'consumer.cjs'), `const api = require('footprint-explainable-ui');\nconst format='CJS';\n${exercise}`);
  process.stdout.write(run(process.execPath, [join(scratch, 'consumer.cjs')]));
  writeFileSync(join(scratch, 'consumer.mjs'), `import { createRequire } from 'node:module';\nimport { fileURLToPath } from 'node:url';\nconst require=createRequire(import.meta.url);\nconst __dirname=fileURLToPath(new URL('.',import.meta.url));\nconst api=await import('footprint-explainable-ui');\nconst format='ESM';\n${exercise}`);
  process.stdout.write(run(process.execPath, [join(scratch, 'consumer.mjs')]));

  const fixture = `import * as React from 'react';
import { LensControllerProvider, useLensController, LensReplayControls, CommentaryPanel, ExplainableShell,
  type LensController, type LensControllerActions, type LensControllerOptions,
  type LensControllerProviderProps, type LensRecordingInput, type LensRecordingStatus,
  type LensPresentationRequest, type ReplayAxis, type ReplayControlsOptions, type RecordingSource } from 'footprint-explainable-ui';
declare const source: RecordingSource;
const input: LensRecordingInput = { source };
const replayControls: ReplayControlsOptions = { presentation: 'range', scale: 'log-duration', slider: true, previousNext: false, playPause: true };
const options: LensControllerOptions = { ...input, replayControls, rendering: { prefetch: 'idle', loadingIndicator: 'skeleton' } };
const props: LensControllerProviderProps = { ...options, children: React.createElement(LensReplayControls) };
function Consumer() {
  const controller: LensController = useLensController();
  const actions: LensControllerActions = controller.actions;
  const axis: ReplayAxis = controller.replayAxis;
  const stageIndex = axis.indexAt(0.5);
  actions.scrubTo(stageIndex); void axis.durations;
  const status: LensRecordingStatus = controller.recordingStatus;
  const request: LensPresentationRequest | null = controller.presentationRequest;
  const target = controller.activity.writes.find(write => write.traceTarget)?.traceTarget;
  if (target) actions.backtrack(target);
  actions.selectStage(controller.selectedSnapshot?.runtimeStageId ?? '');
  actions.scrubTo(0); actions.pause();
  void status; void request;
  return React.createElement(CommentaryPanel, { presentation: 'current' });
}
React.createElement(LensControllerProvider, props, React.createElement(Consumer), React.createElement(ExplainableShell));
React.createElement(ExplainableShell, { ...input,
  layout: { columns: '1fr', areas: [['timeTravel'], ['flowchart']], replayControls },
  replayControls: { playPause: false } });
`;
  for (const extension of ['mts', 'cts']) writeFileSync(join(scratch, `consumer.${extension}`), fixture);
  writeFileSync(join(scratch, 'example.tsx'), readFileSync(join(repo, 'examples/headless-controller/HeadlessControllerExample.tsx')));
  for (const [name, module, moduleResolution, files] of [
    ['nodenext', 'NodeNext', 'NodeNext', ['consumer.mts', 'consumer.cts']],
    ['bundler', 'ESNext', 'Bundler', ['consumer.mts', 'example.tsx']],
  ]) {
    const config = join(scratch, `${name}.json`);
    writeFileSync(config, JSON.stringify({ compilerOptions: { strict: true, noEmit: true, skipLibCheck: false,
      target: 'ES2022', module, moduleResolution, jsx: 'react-jsx', esModuleInterop: true }, files }));
    process.stdout.write(run(process.execPath, [join(repo, 'node_modules/typescript/bin/tsc'), '-p', config]));
  }
  process.stdout.write('Strict packed NodeNext CJS/ESM and Bundler example declarations passed without source aliases.\n');
} finally { rmSync(scratch, { recursive: true, force: true }); }
