import { test } from 'node:test';
import assert from 'node:assert/strict';
import { npmAuditCommand, runNpmAudit, auditEnvironment } from './npm-process.mjs';

test('accepts only an absolute npm CLI script, never a shell command or PATH lookup', () => {
  for (const invalid of [undefined, 'npm', 'npm-cli.js', '/tmp/npm;echo.js', '/tmp/other.js']) {
    assert.throws(() => npmAuditCommand(invalid), error => error.code === 'NPM_SCRIPT_REQUIRED');
  }
  assert.deepEqual(npmAuditCommand('/pinned/npm-cli.js', true), ['/pinned/npm-cli.js', 'audit', '--json', '--ignore-scripts', '--audit-level=info', '--include=prod', '--include=optional', '--include=peer', '--omit=dev']);
});
test('preserves stdout, stderr and actual nonzero status from a local child without a shell', async () => {
  const result = await runNpmAudit({ command: ['-e', 'process.stdout.write("out");process.stderr.write("err");process.exitCode=1'], cwd: process.cwd() });
  assert.equal(result.stdout.toString(), 'out'); assert.equal(result.stderr.toString(), 'err');
  assert.equal(result.exitCode, 1); assert.equal(result.signal, null); assert.equal(result.spawnError, null);
});
test('bounds a hanging local child and records timeout rather than an audit result', async () => {
  const result = await runNpmAudit({ command: ['-e', 'setInterval(()=>{},1000)'], cwd: process.cwd(), timeoutMs: 50 });
  assert.equal(result.timedOut, true); assert.equal(result.exitCode, null); assert.ok(result.signal);
});
test('caps captured output and refuses a noisy child instead of parsing a truncated report as clean', async () => {
  const result = await runNpmAudit({ command: ['-e', 'process.stdout.write("x".repeat(10000));setInterval(()=>{},1000)'], cwd: process.cwd(), maxOutputBytes: 128 });
  assert.equal(result.outputLimitExceeded, true); assert.equal(result.stdout.length + result.stderr.length, 128);
});
test('records a real process launch error', async () => {
  const result = await runNpmAudit({ command: ['-e', ''], cwd: '/nonexistent/audit-evidence-fixture' });
  assert.equal(result.spawnError.code, 'ENOENT'); assert.notEqual(result.exitCode, 0);
});

test('explicit CLI scope cannot inherit dev omission or inclusion from lower-priority npm settings', () => {
  const full = npmAuditCommand('/pinned/npm-cli.js');
  assert.deepEqual(full.filter(arg => arg.startsWith('--include=')), ['--include=prod', '--include=dev', '--include=optional', '--include=peer']);
  const production = npmAuditCommand('/pinned/npm-cli.js', true);
  assert.deepEqual(production.filter(arg => arg.startsWith('--include=')), ['--include=prod', '--include=optional', '--include=peer']);
  assert.ok(!production.includes('--include=dev')); assert.ok(production.includes('--omit=dev'));
});
test('removes only case-insensitive inherited scope settings without mutating the caller or printing config', async () => {
  const environment = { ...process.env, NODE_ENV: 'production', npm_config_omit: 'dev', NPM_CONFIG_INCLUDE: 'dev',
    nPm_CoNfIg_PrOdUcTiOn: 'true', NPM_CONFIG_ONLY: 'prod', AUDIT_FIXTURE_KEEP: 'kept' };
  const before = { ...environment }, cleaned = auditEnvironment(environment);
  assert.deepEqual(environment, before); assert.equal(cleaned.AUDIT_FIXTURE_KEEP, 'kept'); assert.equal(cleaned.HOME, environment.HOME);
  for (const key of ['NODE_ENV', 'npm_config_omit', 'NPM_CONFIG_INCLUDE', 'nPm_CoNfIg_PrOdUcTiOn', 'NPM_CONFIG_ONLY']) assert.ok(!Object.hasOwn(cleaned, key));
  const result = await runNpmAudit({ command: ['-e', 'process.stdout.write(JSON.stringify({scope:Object.keys(process.env).filter(k=>/^(NODE_ENV|NPM_CONFIG_(OMIT|INCLUDE|PRODUCTION|ONLY))$/i.test(k)),keep:process.env.AUDIT_FIXTURE_KEEP}))'],
    cwd: process.cwd(), environment });
  assert.equal(result.exitCode, 0); assert.deepEqual(JSON.parse(result.stdout), { scope: [], keep: 'kept' });
  assert.deepEqual(environment, before);
});
