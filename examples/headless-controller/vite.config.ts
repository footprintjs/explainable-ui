import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { realpathSync } from 'node:fs';
const root = fileURLToPath(new URL('.', import.meta.url));
const repo = fileURLToPath(new URL('../../', import.meta.url));
const dependencyRoots = [...new Set(['react', 'react-dom', '@xyflow/react', 'vite'].map(name => {
  let path = realpathSync(resolve(repo, 'node_modules', name));
  for (const _ of name.split('/')) path = dirname(path);
  return path;
}))];
export default defineConfig({ root, base: './', plugins: [react()], cacheDir: resolve(repo, 'node_modules/.cache/headless-controller'),
  resolve: { alias: [
    { find: /^footprint-explainable-ui$/, replacement: resolve(repo, 'src/index.ts') },
    { find: /^footprint-explainable-ui\/flowchart$/, replacement: resolve(repo, 'src/flowchart.ts') },
  ] },
  server: { host: '127.0.0.1', port: 5318, strictPort: true, fs: { allow: [repo, ...dependencyRoots] } },
  preview: { host: '127.0.0.1', port: 5318, strictPort: true },
  build: { outDir: resolve(repo, 'demo-dist/headless-controller'), emptyOutDir: true },
});
