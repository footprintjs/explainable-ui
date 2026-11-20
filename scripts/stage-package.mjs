import assert from 'node:assert/strict';
import { cpSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const [destination] = process.argv.slice(2);
assert(destination, 'Usage: node scripts/stage-package.mjs DESTINATION');
const repo = fileURLToPath(new URL('../', import.meta.url));
const staging = resolve(destination);

mkdirSync(staging);
for (const member of ['dist', 'CHANGELOG.md', 'package.json', 'README.md']) {
  cpSync(join(repo, member), join(staging, member), { recursive: true });
}
