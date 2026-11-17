import { readFile, writeFile, mkdir, lstat, realpath } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { classifyAudit, AuditEvidenceError } from './audit-report.mjs';
import { npmAuditCommand, runNpmAudit } from './npm-process.mjs';
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const json = value => JSON.stringify(value, null, 2) + '\n';
const modes = [{ id: 'full', production: false }, { id: 'production', production: true }];

/** Collection success describes evidence admission, never an audit pass. */
export async function collectEvidence({ projectDir, npmCli, run = runNpmAudit }) {
  const project = await realpath(projectDir), output = join(project, 'dependency-security');
  // A fresh fixed directory and exclusive files reject previous output/symlinks.
  await mkdir(output, { mode: 0o700 });
  const save = (name, value) => writeFile(join(output, name), value, { flag: 'wx', mode: 0o600 });
  const report = { schemaVersion: 1, collectionStatus: 'COLLECTOR_ERROR', auditStatus: 'UNKNOWN', clean: false,
    message: 'Audit evidence could not be admitted; audit cleanliness is unknown.', audits: {} };
  try {
    const lockPath = join(project, 'package-lock.json'), info = await lstat(lockPath);
    if (!info.isFile() || info.isSymbolicLink() || info.size > 32 * 1024 * 1024) throw new AuditEvidenceError('LOCKFILE_UNAVAILABLE');
    const lock = await readFile(lockPath);
    let parsed;
    try { parsed = JSON.parse(lock.toString('utf8')); } catch { throw new AuditEvidenceError('INVALID_LOCKFILE'); }
    if (![2, 3].includes(parsed?.lockfileVersion) || !parsed.packages || typeof parsed.packages !== 'object' || Array.isArray(parsed.packages)) throw new AuditEvidenceError('INVALID_LOCKFILE');
    await save('package-lock.json', lock); report.lockfileSHA256 = sha256(lock);
    for (const mode of modes) {
      const command = npmAuditCommand(npmCli, mode.production);
      const result = await run({ command, cwd: project });
      await save(`${mode.id}.stdout.txt`, result.stdout); await save(`${mode.id}.stderr.txt`, result.stderr);
      const { stdout, stderr, ...status } = result;
      await save(`${mode.id}.status.json`, json({ command: [process.execPath, ...command], ...status }));
      // Preserve a JSON error response too; malformed data remains in raw stdout.
      try { await save(`${mode.id}.audit.json`, json(JSON.parse(stdout.toString('utf8')))); }
      catch (error) { if (!(error instanceof SyntaxError)) throw error; }
      const admitted = classifyAudit(result);
      report.audits[mode.id] = admitted.diagnostic;
      if (sha256(await readFile(lockPath)) !== report.lockfileSHA256) throw new AuditEvidenceError('LOCKFILE_CHANGED');
    }
    report.collectionStatus = 'COLLECTED';
    report.clean = modes.every(mode => report.audits[mode.id].clean);
    report.auditStatus = report.clean ? 'CLEAN' : 'FINDINGS_UNRESOLVED';
    report.message = report.clean ? 'Both supplied audit reports are clean for the saved installed lockfile.'
      : 'Unresolved findings; audit is not clean. Inspect the full and production diagnostics and raw evidence.';
  } catch (error) {
    report.failureCode = error instanceof AuditEvidenceError ? error.code : 'EVIDENCE_IO_OR_RUNNER_ERROR';
  }
  await save('report.json', json(report));
  return report;
}
