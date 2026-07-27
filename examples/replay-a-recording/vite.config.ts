import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

/**
 * The example runs against the library's SOURCE, but its code imports
 * `footprint-explainable-ui` by name — so what you read in `Replay.tsx` is
 * exactly what you would write in your own app. The alias is the only line
 * that differs, and it lives here rather than in the example's source.
 */
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [react()],
  resolve: {
    alias: {
      'footprint-explainable-ui': fileURLToPath(new URL('../../src/index.ts', import.meta.url)),
    },
  },
  server: { port: 5310 },
});
