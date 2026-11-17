import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { realpathSync } from 'node:fs';
import { dirname } from 'node:path';

const relative = (path: string) => fileURLToPath(new URL(path, import.meta.url));
const dependencyRoots = ['react', 'react-dom', 'vite', 'foottrace'].map(name =>
  dirname(realpathSync(relative('../../node_modules/' + name)))
);

export default defineConfig({
  root: relative('./'),
  base: './',
  plugins: [react()],
  cacheDir: relative('../../node_modules/.cache/record-slider'),
  resolve: { alias: {
    'footprint-explainable-ui/record': relative('../../src/record/index.ts'),
  } },
  server: { host: '127.0.0.1', port: 5320, strictPort: true, fs: { allow: [relative('../../'), ...dependencyRoots] } },
  build: { outDir: relative('../../demo-dist/record-slider'), emptyOutDir: true },
});
