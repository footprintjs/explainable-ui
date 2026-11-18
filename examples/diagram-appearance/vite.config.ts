import react from '@vitejs/plugin-react';
import { realpathSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const root = fileURLToPath(new URL('.', import.meta.url));
const repo = resolve(root, '../..');
const dependencyRoots = ['react', 'react-dom', '@xyflow/react', 'vite'].map(name => {
  let path = realpathSync(resolve(repo, 'node_modules', name));
  for (const _ of name.split('/')) path = dirname(path);
  return path;
});

export default defineConfig({
  root, base: './', plugins: [react()],
  resolve: { alias: [{ find: /^footprint-explainable-ui\/flowchart$/, replacement: resolve(repo, 'src/flowchart.ts') }] },
  server: { fs: { allow: [repo, ...new Set(dependencyRoots)] } },
  cacheDir: resolve(repo, 'node_modules/.cache/diagram-appearance'),
  build: { outDir: resolve(repo, 'demo-dist/diagram-appearance'), emptyOutDir: true },
});
