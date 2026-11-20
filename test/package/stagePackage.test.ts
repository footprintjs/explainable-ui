import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';

function stagedFiles(root: string, directory = ''): Record<string, string> {
  const hashes: Record<string, string> = {};
  for (const entry of readdirSync(join(root, directory), { withFileTypes: true })) {
    const relative = join(directory, entry.name);
    if (entry.isDirectory()) Object.assign(hashes, stagedFiles(root, relative));
    else hashes[relative] = createHash('sha256').update(readFileSync(join(root, relative))).digest('hex');
  }
  return hashes;
}

it('refuses an existing package stage and preserves every file in it', () => {
  const scratch = mkdtempSync(join(tmpdir(), 'explainable-ui-staging-'));
  const destination = join(scratch, 'package');
  const script = fileURLToPath(new URL('../../scripts/stage-package.mjs', import.meta.url));
  const stage = () => spawnSync(process.execPath, [script, destination], { encoding: 'utf8' });

  try {
    const first = stage();
    expect(first.status, first.stderr).toBe(0);
    writeFileSync(join(destination, 'sentinel.bin'), Buffer.from([0, 255, 17]));
    writeFileSync(join(destination, 'README.md'), 'Previously staged copy.\n');
    const before = stagedFiles(destination);

    const second = stage();
    expect(second.status).toBe(1);
    expect(second.stderr).toContain('EEXIST');
    expect(stagedFiles(destination)).toEqual(before);
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
});
