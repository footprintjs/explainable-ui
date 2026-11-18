/** An existing Node 18/20 host installs the exact archive tested by the Node 22 record-only job. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { archiveProof, compareInstalledFiles, installConsumer, readJSON, verifyRejectedReader } from './packed-consumers.mjs';

const [artifact, report] = process.argv.slice(2);
const nodeMajor = Number(process.versions.node.split('.')[0]);
assert([18, 20].includes(nodeMajor), 'Test the declared graph entry runtime floor');
const scratch = realpathSync(mkdtempSync(join(tmpdir(), 'graph-peer-floor-')));
const env = { ...process.env, NODE_PATH: '', NODE_OPTIONS: '' };

try {
  const packed = readJSON(join(artifact, 'packed-review.json'))[0];
  const { gates } = readJSON(join(artifact, 'record-consumer-verification.json'));
  const archive = resolve(artifact, packed.filename);
  const identity = archiveProof(archive, packed);
  assert.equal(identity.sha256, gates.normalTarball.sha256);
  assert.equal(identity.integrity, gates.normalTarball.integrity);
  assert.equal(execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), gates.normalTarball.testedCommit);
  assert.equal(execFileSync('git', ['rev-parse', 'HEAD^{tree}'], { encoding: 'utf8' }).trim(), gates.normalTarball.testedTree);
  execFileSync('tar', ['-xzf', archive, '-C', scratch]);

  const fixture = join(scratch, 'consumer');
  const consumer = installConsumer({
    fixture, archive, graph: true, installedNpm: true, env,
    versions: { ...gates.graphWithoutReader.versions, ...gates.graphTypesTooling },
  });
  const modules = join(fixture, 'node_modules');
  const installed = join(modules, 'footprint-explainable-ui');
  compareInstalledFiles(join(scratch, 'package'), installed);
  const manifest = readJSON(join(installed, 'package.json'));
  assert.equal(manifest.engines.node, '>=18');

  const formats = [];
  for (const [resolution, extension] of [['NodeNext', 'mts'], ['NodeNext', 'cts'], ['Bundler', 'ts']]) {
    const file = `graph.${extension}`;
    writeFileSync(join(fixture, file), `
import { ExplainableShell, type InvestigationPort } from 'footprint-explainable-ui';
import { TracedFlow, type TracedFlowProps } from 'footprint-explainable-ui/flowchart';
export { ExplainableShell, TracedFlow };
export type HostModels = [InvestigationPort, TracedFlowProps];`);
    const listing = execFileSync(process.execPath, [join(modules, 'typescript/bin/tsc'),
      '--strict', '--skipLibCheck', 'false', '--noEmit', '--listFiles', '--target', 'ES2022',
      '--module', resolution === 'Bundler' ? 'ESNext' : 'NodeNext', '--moduleResolution', resolution,
      '--types', 'react,react-dom', file], { cwd: fixture, env, encoding: 'utf8' });
    const declaration = extension === 'cts' ? 'd.cts' : 'd.ts';
    for (const door of ['index', 'flowchart'])
      assert(listing.includes(join(installed, 'dist', `${door}.${declaration}`)), `Missing ${door} ${declaration}`);
    assert(!listing.includes('/node_modules/foottrace/'));
    formats.push(`${resolution} .${extension}`);
  }
  const rejected = verifyRejectedReader({ directory: join(scratch, 'unsupported-engine'), archive,
    env, installedNpm: true, react: consumer.versions.react, version: '2.0.0', code: 'EBADENGINE' });
  const proof = { node: process.versions.node, npm: execFileSync('npm', ['--version'], { encoding: 'utf8' }).trim(),
    testedCommit: gates.normalTarball.testedCommit, testedTree: gates.normalTarball.testedTree, archive: identity,
    identicalInstalledFiles: Object.keys(gates.normalTarball.memberSha256).length, consumer, formats, rejected,
    runtime: ['CommonJS', 'ESM'], missingReaderPeerRejected: true };
  writeFileSync(report, JSON.stringify(proof, null, 2) + '\n');
  console.log(JSON.stringify(proof));
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
