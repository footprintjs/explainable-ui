import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createRequire } from 'node:module';

export const readJSON = path => JSON.parse(readFileSync(path, 'utf8'));
const hash = (bytes, algorithm, encoding = 'hex') =>
  createHash(algorithm).update(bytes).digest(encoding);

export function compareInstalledFiles(unpacked, installed) {
  function files(root, directory = root) {
    return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
      const path = join(directory, entry.name);
      assert(!entry.isSymbolicLink(), `Linked package member: ${path}`);
      return entry.isDirectory() ? files(root, path) : [relative(root, path)];
    }).sort();
  }
  const paths = files(unpacked);
  assert.deepEqual(files(installed), paths, 'Installed files must match the archive members');
  for (const path of paths)
    assert(readFileSync(join(installed, path)).equals(readFileSync(join(unpacked, path))), path);
}

/** Inspect physical packages, including nested modules and duplicates, independently of npm ls. */
function packageNames(modules) {
  const names = [];
  function scan(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue;
      const path = join(directory, entry.name);
      assert(!lstatSync(path).isSymbolicLink(), `Linked dependency: ${path}`);
      if (entry.name.startsWith('@')) scan(path);
      else {
        names.push(readJSON(join(path, 'package.json')).name);
        if (readdirSync(path).includes('node_modules')) scan(join(path, 'node_modules'));
      }
    }
  }
  scan(modules);
  return names.sort();
}

/** The consuming app declares the peers required for its chosen entry. */
export function installConsumer({ fixture, archive, repo, env, graph = false, versions: suppliedVersions, installedNpm = false }) {
  const modules = join(fixture, 'node_modules');
  const peers = graph
    ? ['react', 'react-dom', '@xyflow/react', 'dagre']
    : ['react', 'foottrace', '@types/react'];
  const versions = suppliedVersions ?? Object.fromEntries(peers.map(name =>
    [name, readJSON(join(repo, 'node_modules', name, 'package.json')).version]));
  const packageName = 'footprint-explainable-ui';
  mkdirSync(fixture);
  writeFileSync(join(fixture, 'package.json'), JSON.stringify({
    private: true, type: 'module', dependencies: { [packageName]: `file:${archive}`, ...versions },
  }));
  install(fixture, env, installedNpm);
  const installed = join(modules, packageName);
  assert.equal(realpathSync(installed), installed);
  const packages = packageNames(modules);
  if (graph) {
    assert(!packages.includes('foottrace'), 'Graph entries must work without Foottrace');
    for (const mode of ['commonjs', 'module']) {
      const source = mode === 'commonjs'
        ? 'const ui=require("footprint-explainable-ui"), chart=require("footprint-explainable-ui/flowchart");'
        : 'import * as ui from "footprint-explainable-ui"; import * as chart from "footprint-explainable-ui/flowchart";';
      const errorFromMissingPeer = `error => ['ERR_MODULE_NOT_FOUND', 'MODULE_NOT_FOUND'].includes(error.code) &&
        ["'foottrace'", "'foottrace/paths'", "'foottrace/cause'"].some(specifier => error.message.includes(specifier))`;
      const missingReader = mode === 'commonjs'
        ? `require("node:assert/strict").throws(() => require("footprint-explainable-ui/record"), ${errorFromMissingPeer});`
        : `import assert from "node:assert/strict"; await assert.rejects(import("footprint-explainable-ui/record"), ${errorFromMissingPeer});`;
      execFileSync(process.execPath, [`--input-type=${mode}`, '-e', source +
        'if(typeof ui.ExplainableShell!=="function" || !chart.TracedFlow) throw new Error("Missing graph API");' + missingReader], { cwd: fixture, env });
    }
  } else {
    assert.equal(versions.foottrace, '2.1.0', 'Test the lowest supported Foottrace release');
    assert.deepEqual(packages, [packageName, 'foottrace', 'react', '@types/react', 'csstype'].sort(),
      'The record-only React 19 installation must have exactly one physical copy of each declared package');
    assert.equal(createRequire(join(installed, 'package.json')).resolve('foottrace'),
      createRequire(join(fixture, 'package.json')).resolve('foottrace'), 'Both must use the same reader');
  }
  return { versions, packages, engineStrict: true, strictPeerDeps: true };
}

const installFlags = ['install', '--engine-strict', '--strict-peer-deps', '--no-audit', '--no-fund'];

function installer(installedNpm) {
  // setup-node supplies a compatible npm on Node 18 and 20; npm 11 needs newer Node.
  return installedNpm ? ['npm', installFlags] : ['npx', ['--yes', 'npm@11.21.0', ...installFlags]];
}

function install(directory, env, installedNpm) {
  const [command, args] = installer(installedNpm);
  execFileSync(command, args, { cwd: directory, env, stdio: 'inherit' });
}

export function verifyRejectedReader({ directory, archive, react, version, code, env, installedNpm = false }) {
  mkdirSync(directory);
  writeFileSync(join(directory, 'package.json'), JSON.stringify({
    private: true, dependencies: { 'footprint-explainable-ui': `file:${archive}`, react, foottrace: version },
  }));
  const [command, args] = installer(installedNpm);
  const result = spawnSync(command, args, { cwd: directory, env, encoding: 'utf8' });
  if (result.error) throw result.error;
  assert.notEqual(result.status, 0, `Expected npm to reject foottrace@${version}`);
  const output = result.stdout + result.stderr;
  assert(output.includes(code) && output.includes(`foottrace@${version}`), output);
  return { version, npmError: code };
}

export function archiveProof(archive, info) {
  const bytes = readFileSync(archive);
  assert.equal(bytes.length, info.size);
  assert.equal(hash(bytes, 'sha1'), info.shasum);
  const integrity = `sha512-${hash(bytes, 'sha512', 'base64')}`;
  assert.equal(integrity, info.integrity);
  return { filename: info.filename, size: bytes.length, integrity, sha256: hash(bytes, 'sha256') };
}
