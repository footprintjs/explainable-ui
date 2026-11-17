// Offline test data only; not an assertion about any real dependency graph.
export function auditFixture(findings = false) {
  return { auditReportVersion: 2, vulnerabilities: findings ? { picomatch: {
    name: 'picomatch', severity: 'high', isDirect: false, via: [{ source: 1234567,
      name: 'picomatch', dependency: 'picomatch', severity: 'high', title: 'Fixture advisory',
      url: 'https://example.invalid/advisories/fixture', range: '<99.0.0' }], effects: [], range: '<99.0.0',
    nodes: ['node_modules/tool/node_modules/picomatch'], fixAvailable: false,
  } } : {}, metadata: {
    vulnerabilities: { info: 0, low: 0, moderate: 0, high: findings ? 1 : 0, critical: 0, total: findings ? 1 : 0 },
    dependencies: { prod: 1, dev: 2, optional: 0, peer: 0, peerOptional: 0, total: 3 },
  } };
}
export const childResult = (audit = auditFixture(), options = {}) => ({
  stdout: Buffer.from(JSON.stringify(audit)), stderr: Buffer.from(''), exitCode: audit.metadata?.vulnerabilities?.total ? 1 : 0,
  signal: null, timedOut: false, outputLimitExceeded: false, spawnError: null, ...options,
});
