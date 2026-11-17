import { spawn } from 'node:child_process';
import { isAbsolute, basename } from 'node:path';
import { AuditEvidenceError } from './audit-report.mjs';

export function npmAuditCommand(npmCli, production = false) {
  if (!isAbsolute(npmCli ?? '') || basename(npmCli) !== 'npm-cli.js') throw new AuditEvidenceError('NPM_SCRIPT_REQUIRED');
  return [npmCli, 'audit', '--json', '--ignore-scripts', '--audit-level=info',
    '--include=prod', ...(production ? [] : ['--include=dev']), '--include=optional', '--include=peer',
    ...(production ? ['--omit=dev'] : [])];
}

export function auditEnvironment(environment = process.env) {
  const scope = /^(?:NODE_ENV|NPM_CONFIG_(?:OMIT|INCLUDE|PRODUCTION|ONLY))$/i;
  return Object.fromEntries(Object.entries(environment).filter(([key]) => !scope.test(key)));
}

/** Executes a fixed argument vector without a shell; captures bytes, not parsed lines. */
export function runNpmAudit({ command, cwd, timeoutMs = 120000, maxOutputBytes = 16 * 1024 * 1024, environment = process.env }) {
  return new Promise(resolve => {
    const stdout = [], stderr = [];
    let size = 0, timedOut = false, outputLimitExceeded = false, spawnError = null, killTimer;
    const child = spawn(process.execPath, command, { cwd, stdio: ['ignore', 'pipe', 'pipe'], shell: false, env: auditEnvironment(environment) });
    const stop = () => {
      child.kill('SIGTERM');
      killTimer ??= setTimeout(() => child.kill('SIGKILL'), 1000);
    };
    const timer = setTimeout(() => { timedOut = true; stop(); }, timeoutMs);
    const capture = target => chunk => {
      const remaining = Math.max(0, maxOutputBytes - size);
      if (remaining) target.push(chunk.subarray(0, remaining));
      size += chunk.length;
      if (size > maxOutputBytes && !outputLimitExceeded) { outputLimitExceeded = true; stop(); }
    };
    child.stdout.on('data', capture(stdout)); child.stderr.on('data', capture(stderr));
    child.on('error', error => { spawnError = { code: error.code ?? 'UNKNOWN', message: error.message }; });
    child.on('close', (exitCode, signal) => {
      clearTimeout(timer); clearTimeout(killTimer);
      resolve({ stdout: Buffer.concat(stdout), stderr: Buffer.concat(stderr), exitCode, signal,
        timedOut, outputLimitExceeded, spawnError });
    });
  });
}
