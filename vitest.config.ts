import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  test: {
    include: ['test/**/*.test.{ts,tsx}'],
    // Setup file runs for jsdom tests (provides scrollIntoView stub + cleanup)
    setupFiles: ['test/setup.ts'],
  },
  resolve: {
    alias: {
      // `examples/` imports the library BY NAME, so its source reads exactly
      // as a consumer would copy it. Point that name at src so the example
      // test runs against the code in this working tree, not a stale build.
      'footprint-explainable-ui': fileURLToPath(new URL('./src/index.ts', import.meta.url)),
    },
  },
});
