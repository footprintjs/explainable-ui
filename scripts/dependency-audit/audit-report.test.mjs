import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyAudit } from './audit-report.mjs';
import { auditFixture, childResult } from './fixtures.mjs';

const rejects = (result, code) => assert.throws(() => classifyAudit(result), error => error.code === code);
test('clean requires a valid zero-exit version-2 report with zero counts and entries', () => {
  const { diagnostic } = classifyAudit(childResult());
  assert.equal(diagnostic.status, 'CLEAN'); assert.equal(diagnostic.clean, true); assert.equal(diagnostic.auditExitCode, 0);
});
test('unpatched findings remain unresolved, including original exit, IDs and nested installed paths', () => {
  const { diagnostic } = classifyAudit(childResult(auditFixture(true)));
  assert.equal(diagnostic.status, 'FINDINGS_UNRESOLVED'); assert.equal(diagnostic.clean, false); assert.equal(diagnostic.auditExitCode, 1);
  assert.equal(diagnostic.counts.high, 1); assert.equal(diagnostic.counts.total, 1);
  assert.deepEqual(diagnostic.packages, [{ name: 'picomatch', severity: 'high', isDirect: false,
    advisoryIds: [1234567], nodes: ['node_modules/tool/node_modules/picomatch'] }]);
});
for (const [change, code] of [
  [{ spawnError: { code: 'ENOENT', message: 'fixture' } }, 'SPAWN_ERROR'],
  [{ timedOut: true, signal: 'SIGTERM' }, 'AUDIT_TIMEOUT'],
  [{ outputLimitExceeded: true }, 'AUDIT_OUTPUT_LIMIT'],
  [{ signal: 'SIGTERM' }, 'AUDIT_SIGNAL'], [{ exitCode: 2 }, 'UNEXPECTED_AUDIT_EXIT'],
  [{ stdout: Buffer.from('{') }, 'MALFORMED_AUDIT_JSON'],
  [{ stdout: Buffer.from('{"error":{"code":"E401"}}') }, 'AUDIT_JSON_ERROR'],
  [{ stdout: Buffer.from('{}') }, 'INVALID_AUDIT_V2_SHAPE'],
  [{ exitCode: 1 }, 'CONTRADICTORY_AUDIT_EXIT'],
]) test(`fails closed for ${code}`, () => rejects(childResult(auditFixture(), change), code));

test('an error property cannot masquerade as an otherwise complete clean report', () => {
  rejects(childResult({ ...auditFixture(), error: { code: 'E401' } }), 'AUDIT_JSON_ERROR');
});
test('a zero exit cannot disguise nonzero findings', () => rejects(childResult(auditFixture(true), { exitCode: 0 }), 'CONTRADICTORY_AUDIT_EXIT'));
for (const invalid of [-1, 0.5, '0', null, Number.MAX_SAFE_INTEGER + 1]) {
  test(`rejects invalid vulnerability counts: ${JSON.stringify(invalid)}`, () => {
    const raw = auditFixture(); raw.metadata.vulnerabilities.high = invalid;
    rejects(childResult(raw), 'INVALID_AUDIT_COUNTS');
  });
}
test('requires all severity counts, their correct sum, and dependency counts', () => {
  const missing = auditFixture(); delete missing.metadata.vulnerabilities.info;
  rejects(childResult(missing), 'INVALID_AUDIT_COUNTS');
  const sum = auditFixture(); sum.metadata.vulnerabilities.total = 1;
  rejects(childResult(sum), 'CONTRADICTORY_AUDIT_COUNTS');
  const deps = auditFixture(); delete deps.metadata.dependencies.peerOptional;
  rejects(childResult(deps), 'INVALID_DEPENDENCY_COUNTS');
});
test('metadata counts must agree with actual package rows by severity', () => {
  const raw = auditFixture(true); raw.vulnerabilities = {};
  rejects(childResult(raw), 'CONTRADICTORY_AUDIT_COUNTS');
});
test('rejects missing v2 fields, executable-looking summary text, and non-numeric advisory identities', () => {
  for (const change of [entry => delete entry.via, entry => entry.nodes = ['../../private'],
    entry => entry.nodes = ['node_modules/<script>'], entry => entry.via[0].source = '<script>',
    entry => entry.isDirect = undefined, entry => entry.fixAvailable = {}, entry => entry.name = 'other']) {
    const raw = auditFixture(true); change(raw.vulnerabilities.picomatch);
    rejects(childResult(raw), 'INVALID_AUDIT_V2_SHAPE');
  }
});
test('retains package-link-only rows without inventing an advisory identity', () => {
  const raw = auditFixture(true); raw.vulnerabilities.picomatch.via = ['other-package'];
  assert.deepEqual(classifyAudit(childResult(raw)).diagnostic.packages[0].advisoryIds, []);
});
