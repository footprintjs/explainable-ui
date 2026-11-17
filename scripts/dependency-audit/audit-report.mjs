/** Admission of npm's version-2 audit report; no registry or filesystem access. */
export class AuditEvidenceError extends Error {
  constructor(code) { super(code); this.name = 'AuditEvidenceError'; this.code = code; }
}
const fail = code => { throw new AuditEvidenceError(code); };
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const integer = value => Number.isSafeInteger(value) && value >= 0;
const severities = ['info', 'low', 'moderate', 'high', 'critical'];
const packageName = value => typeof value === 'string' && value.length <= 256
  && /^(?:@[a-z0-9._~-]+\/)?[a-z0-9._~-]+$/i.test(value);
const text = (value, limit = 4096) => typeof value === 'string' && value.length > 0 && value.length <= limit;
const strings = (values, check) => Array.isArray(values) && values.length <= 100000 && values.every(check);
const nodePath = value => text(value) && value.startsWith('node_modules/')
  && /^[a-z0-9@/._~+-]+$/i.test(value) && value.split('/').every(part => part && part !== '.' && part !== '..');

export function classifyAudit(result) {
  if (result.spawnError) fail('SPAWN_ERROR');
  if (result.timedOut) fail('AUDIT_TIMEOUT');
  if (result.outputLimitExceeded) fail('AUDIT_OUTPUT_LIMIT');
  if (result.signal !== null) fail('AUDIT_SIGNAL');
  if (result.exitCode !== 0 && result.exitCode !== 1) fail('UNEXPECTED_AUDIT_EXIT');
  let audit;
  try { audit = JSON.parse(result.stdout.toString('utf8')); } catch { fail('MALFORMED_AUDIT_JSON'); }
  if (!object(audit)) fail('INVALID_AUDIT_V2_SHAPE');
  if (Object.hasOwn(audit, 'error')) fail('AUDIT_JSON_ERROR');
  if (audit.auditReportVersion !== 2 || !object(audit.vulnerabilities) || !object(audit.metadata)
    || !object(audit.metadata.vulnerabilities) || !object(audit.metadata.dependencies)) fail('INVALID_AUDIT_V2_SHAPE');
  const counts = audit.metadata.vulnerabilities;
  if (![...severities, 'total'].every(key => integer(counts[key]))) fail('INVALID_AUDIT_COUNTS');
  if (severities.reduce((sum, key) => sum + counts[key], 0) !== counts.total) fail('CONTRADICTORY_AUDIT_COUNTS');
  const dependencies = audit.metadata.dependencies;
  if (!['prod', 'dev', 'optional', 'peer', 'peerOptional', 'total'].every(key => integer(dependencies[key]))) fail('INVALID_DEPENDENCY_COUNTS');
  const packages = [], observed = Object.fromEntries(severities.map(key => [key, 0]));
  for (const [name, entry] of Object.entries(audit.vulnerabilities)) {
    if (!packageName(name) || !object(entry) || !packageName(entry.name) || entry.name !== name
      || !severities.includes(entry.severity) || typeof entry.isDirect !== 'boolean'
      || !strings(entry.nodes, nodePath) || !strings(entry.effects, packageName)
      || typeof entry.range !== 'string' || entry.range.length > 4096
      || !Array.isArray(entry.via) || entry.via.length > 100000) fail('INVALID_AUDIT_V2_SHAPE');
    const ids = new Set();
    for (const via of entry.via) {
      if (typeof via === 'string') { if (!packageName(via)) fail('INVALID_AUDIT_V2_SHAPE'); continue; }
      if (!object(via) || !Number.isSafeInteger(via.source) || via.source <= 0
        || !packageName(via.name) || !packageName(via.dependency) || !severities.includes(via.severity)
        || !text(via.title) || !text(via.url) || typeof via.range !== 'string') fail('INVALID_AUDIT_V2_SHAPE');
      ids.add(via.source);
    }
    const fix = entry.fixAvailable;
    if (typeof fix !== 'boolean' && (!object(fix) || !packageName(fix.name) || !text(fix.version, 256)
      || typeof fix.isSemVerMajor !== 'boolean')) fail('INVALID_AUDIT_V2_SHAPE');
    observed[entry.severity]++;
    packages.push({ name, severity: entry.severity, isDirect: entry.isDirect,
      advisoryIds: [...ids].sort((a, b) => a - b), nodes: [...entry.nodes] });
  }
  if (severities.some(key => observed[key] !== counts[key])) fail('CONTRADICTORY_AUDIT_COUNTS');
  const clean = counts.total === 0;
  if ((clean && result.exitCode !== 0) || (!clean && result.exitCode !== 1)) fail('CONTRADICTORY_AUDIT_EXIT');
  return { audit, diagnostic: { status: clean ? 'CLEAN' : 'FINDINGS_UNRESOLVED', clean,
    auditExitCode: result.exitCode, counts: Object.fromEntries([...severities, 'total'].map(key => [key, counts[key]])),
    dependencies: Object.fromEntries(['prod', 'dev', 'optional', 'peer', 'peerOptional', 'total'].map(key => [key, dependencies[key]])),
    packages: packages.sort((a, b) => a.name.localeCompare(b.name)) } };
}
