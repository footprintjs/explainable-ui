import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm, symlink, stat, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { collectEvidence } from './evidence.mjs';
import { auditFixture, childResult } from './fixtures.mjs';
const npmCli = '/fixture/pinned/npm/bin/npm-cli.js';
async function workspace(t) {
  const project = await mkdtemp(join(tmpdir(), 'audit-evidence-test-'));
  t.after(() => rm(project, { recursive: true, force: true }));
  const lock = '{"name":"fixture","lockfileVersion":3,"packages":{"":{"name":"fixture"}}}\n';
  await writeFile(join(project, 'package-lock.json'), lock);
  return { project, lock, output: join(project, 'dependency-security') };
}
const saved = (output, name) => readFile(join(output, name), 'utf8');

test('saves exact installed lock/raw streams and serial full+production exit1 findings without calling them clean', async t => {
  const { project, output, lock } = await workspace(t), calls = [];
  let active = false;
  const run = async ({ command, cwd }) => {
    assert.equal(active, false); active = true; assert.equal(cwd, project);
    calls.push(command); await Promise.resolve(); active = false;
    return childResult(auditFixture(true), { stderr: Buffer.from('npm fixture diagnostic\n') });
  };
  const report = await collectEvidence({ projectDir: project, npmCli, run });
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[0], [npmCli, 'audit', '--json', '--ignore-scripts', '--audit-level=info', '--include=prod', '--include=dev', '--include=optional', '--include=peer']);
  assert.deepEqual(calls[1], [npmCli, 'audit', '--json', '--ignore-scripts', '--audit-level=info', '--include=prod', '--include=optional', '--include=peer', '--omit=dev']);
  assert.equal(report.collectionStatus, 'COLLECTED'); assert.equal(report.auditStatus, 'FINDINGS_UNRESOLVED');
  assert.equal(report.clean, false); assert.match(report.message, /audit is not clean/);
  assert.equal(await saved(output, 'package-lock.json'), lock);
  assert.equal(await saved(output, 'full.stdout.txt'), JSON.stringify(auditFixture(true)));
  assert.equal(await saved(output, 'full.stderr.txt'), 'npm fixture diagnostic\n');
  assert.equal(JSON.parse(await saved(output, 'full.status.json')).exitCode, 1);
  assert.equal(JSON.parse(await saved(output, 'production.audit.json')).auditReportVersion, 2);
  assert.equal(JSON.parse(await saved(output, 'report.json')).audits.full.clean, false);
  assert.equal((await stat(join(output, 'report.json'))).mode & 0o777, 0o600);
  assert.equal(await saved(project, 'package-lock.json'), lock);
});
test('clean collection requires both actual reports to be clean', async t => {
  const { project } = await workspace(t);
  const report = await collectEvidence({ projectDir: project, npmCli, run: async () => childResult() });
  assert.equal(report.clean, true); assert.equal(report.auditStatus, 'CLEAN');
  assert.equal(report.audits.full.status, 'CLEAN'); assert.equal(report.audits.production.status, 'CLEAN');
});
test('clean production does not erase unresolved full-graph development findings', async t => {
  const { project } = await workspace(t); let calls = 0;
  const report = await collectEvidence({ projectDir: project, npmCli, run: async () => childResult(auditFixture(++calls === 1)) });
  assert.equal(calls, 2); assert.equal(report.collectionStatus, 'COLLECTED'); assert.equal(report.clean, false);
  assert.equal(report.auditStatus, 'FINDINGS_UNRESOLVED');
  assert.equal(report.audits.full.auditExitCode, 1); assert.equal(report.audits.production.auditExitCode, 0);
  assert.equal(report.audits.full.counts.total, 1); assert.equal(report.audits.production.counts.total, 0);
});
test('a production protocol failure cannot reuse a successful full audit verdict', async t => {
  const { project, output } = await workspace(t); let calls = 0;
  const report = await collectEvidence({ projectDir: project, npmCli, run: async () => ++calls === 1 ? childResult()
    : childResult(undefined, { exitCode: 2, stderr: Buffer.from('fixture tool failure') }) });
  assert.equal(calls, 2); assert.equal(report.collectionStatus, 'COLLECTOR_ERROR');
  assert.equal(report.auditStatus, 'UNKNOWN'); assert.equal(report.clean, false);
  assert.equal(report.failureCode, 'UNEXPECTED_AUDIT_EXIT');
  assert.equal(JSON.parse(await saved(output, 'production.status.json')).exitCode, 2);
  assert.equal(await saved(output, 'production.stderr.txt'), 'fixture tool failure');
});
test('malformed full output is saved with actual process status, fails collection and never starts production', async t => {
  const { project, output } = await workspace(t); let calls = 0;
  const report = await collectEvidence({ projectDir: project, npmCli, run: async () => {
    calls++; return childResult(undefined, { stdout: Buffer.from('not JSON'), exitCode: 1 });
  } });
  assert.equal(calls, 1); assert.equal(report.collectionStatus, 'COLLECTOR_ERROR'); assert.equal(report.clean, false);
  assert.equal(report.failureCode, 'MALFORMED_AUDIT_JSON');
  assert.equal(await saved(output, 'full.stdout.txt'), 'not JSON');
  assert.equal(JSON.parse(await saved(output, 'full.status.json')).exitCode, 1);
});
test('an audit JSON error cannot become a clean empty report', async t => {
  const { project, output } = await workspace(t);
  const report = await collectEvidence({ projectDir: project, npmCli, run: async () => childResult({}, { stdout: Buffer.from('{"error":{"code":"E401"}}') }) });
  assert.equal(report.failureCode, 'AUDIT_JSON_ERROR'); assert.equal(report.clean, false);
  assert.equal(JSON.parse(await saved(output, 'full.audit.json')).error.code, 'E401');
});
test('a changing lockfile cannot label reports as belonging to the saved graph', async t => {
  const { project } = await workspace(t); let calls = 0;
  const report = await collectEvidence({ projectDir: project, npmCli, run: async () => {
    calls++; await writeFile(join(project, 'package-lock.json'), '{}'); return childResult();
  } });
  assert.equal(calls, 1); assert.equal(report.collectionStatus, 'COLLECTOR_ERROR');
  assert.equal(report.failureCode, 'LOCKFILE_CHANGED'); assert.equal(report.clean, false);
});
test('refuses an existing output directory or symlink instead of overwriting evidence', async t => {
  const { project, output } = await workspace(t);
  await mkdir(output); await writeFile(join(output, 'keep'), 'unchanged');
  await assert.rejects(collectEvidence({ projectDir: project, npmCli, run: async () => assert.fail('must not run') }));
  assert.equal(await saved(output, 'keep'), 'unchanged');
  await rm(output, { recursive: true }); await symlink(project, output);
  await assert.rejects(collectEvidence({ projectDir: project, npmCli, run: async () => assert.fail('must not run') }));
});
test('exclusive output files cannot write through a symlink planted during a child run', async t => {
  const { project, output } = await workspace(t), target = join(project, 'keep.txt');
  await writeFile(target, 'unchanged');
  const report = await collectEvidence({ projectDir: project, npmCli, run: async () => {
    await symlink(target, join(output, 'full.stdout.txt')); return childResult();
  } });
  assert.equal(report.collectionStatus, 'COLLECTOR_ERROR'); assert.equal(await readFile(target, 'utf8'), 'unchanged');
});
test('refuses a symlinked lock and missing npm-script identity without invoking a runner', async t => {
  const { project } = await workspace(t), lock = join(project, 'package-lock.json');
  await writeFile(join(project, 'original-lock.json'), await readFile(lock)); await rm(lock);
  await symlink(join(project, 'original-lock.json'), lock);
  const report = await collectEvidence({ projectDir: project, npmCli, run: async () => assert.fail('must not run') });
  assert.equal(report.failureCode, 'LOCKFILE_UNAVAILABLE');
  await rm(join(project, 'dependency-security'), { recursive: true }); await rm(lock);
  await writeFile(lock, '{"lockfileVersion":3,"packages":{}}');
  const noNpm = await collectEvidence({ projectDir: project, run: async () => assert.fail('must not run') });
  assert.equal(noNpm.failureCode, 'NPM_SCRIPT_REQUIRED'); assert.equal(noNpm.clean, false);
});
