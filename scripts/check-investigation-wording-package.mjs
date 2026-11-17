/** Hosted-first proof of the actual packed public entries; run the normal build first. */
import { graphConsumerPackages } from "./fixtures/graph-consumer-packages.mjs";
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, symlinkSync, cpSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const repo = fileURLToPath(new URL('../', import.meta.url));
const scratch = mkdtempSync(join(tmpdir(), 'investigation-wording-package-'));
const env = { PATH: process.env.PATH ?? '/usr/bin:/bin', TMPDIR: tmpdir(), CI: 'true',
  npm_config_offline: 'true', npm_config_cache: join(scratch, 'npm-cache'), npm_config_userconfig: join(scratch, 'empty-npmrc') };
function run(command, args, cwd = scratch) {
  const result = spawnSync(command, args, { cwd, env, encoding: 'utf8', timeout: 120_000 });
  if (result.status !== 0) throw Error(`${command} failed (${result.status}): ${result.stdout ?? ''} ${result.stderr ?? ''}`);
  return result.stdout;
}
try {
  const packed = JSON.parse(run('npm', ['pack', '--json', '--ignore-scripts', '--pack-destination', scratch], repo))[0];
  const modules = join(scratch, 'node_modules'), destination = join(modules, 'footprint-explainable-ui');
  mkdirSync(destination, { recursive: true });
  run('tar', ['-xzf', join(scratch, packed.filename), '--strip-components=1', '-C', destination]);
  const manifest = JSON.parse(readFileSync(join(repo, 'package.json'), 'utf8'));
  for (const name of new Set([...graphConsumerPackages(manifest), 'csstype', 'jsdom'])) {
    mkdirSync(dirname(join(modules, name)), { recursive: true });
    symlinkSync(join(repo, 'node_modules', name), join(modules, name), 'dir');
  }
  for (const name of ['react', 'react-dom']) cpSync(join(repo, 'node_modules/@types', name), join(modules, '@types', name), { recursive: true });
  writeFileSync(join(scratch, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
  assert(!existsSync(join(modules, 'foottrace')));
  cpSync(join(repo, 'scripts/fixtures/investigation-wording-runtime.cjs'), join(scratch, 'runtime.cjs'));
  writeFileSync(join(scratch, 'consumer.cjs'), `require('./runtime.cjs')(require('footprint-explainable-ui'),require('footprint-explainable-ui/flowchart'),'CJS').catch(error=>{console.error(error);process.exitCode=1;});`);
  process.stdout.write(run(process.execPath, ['consumer.cjs']));
  writeFileSync(join(scratch, 'consumer.mjs'), `import * as api from 'footprint-explainable-ui';import * as flowchart from 'footprint-explainable-ui/flowchart';import verify from './runtime.cjs';await verify(api,flowchart,'ESM');`);
  process.stdout.write(run(process.execPath, ['consumer.mjs']));
  const types = readFileSync(join(repo, 'scripts/fixtures/investigation-wording-types.tsx'), 'utf8'), modes = [];
  for (const [mode, extension] of [['NodeNext', 'mts'], ['NodeNext', 'cts'], ['Bundler', 'tsx']]) {
    const file = `types.${extension}`; writeFileSync(join(scratch, file), types);
    const listed = run(process.execPath, [join(repo, 'node_modules/typescript/bin/tsc'), '--strict', '--skipLibCheck', 'false', '--noEmit', '--listFiles',
      '--module', mode === 'Bundler' ? 'ESNext' : 'NodeNext', '--moduleResolution', mode, '--target', 'ES2022', '--types', 'react,react-dom', file]);
    assert(!listed.includes('/node_modules/foottrace/')); assert(!listed.includes(join(repo, 'src')));
    modes.push(`${mode} ${extension}`);
  }
  process.stdout.write(JSON.stringify({ package: manifest.name, version: manifest.version, candidateOnly: true, packedIntegrity: packed.integrity,
    formats: ['CJS','ESM'], rootOnlySentenceFunction: true, renderedHostBadges: true, replacementWithoutRequeryOrFocusLoss: true,
    strictTypes: modes, foottraceInstalled: false, privateHelpersExported: false })+'\n');
} finally { rmSync(scratch, { recursive: true, force: true }); }
