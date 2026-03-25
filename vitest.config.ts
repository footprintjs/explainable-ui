import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.{ts,tsx}'],
    // Setup file runs for jsdom tests (provides scrollIntoView stub + cleanup)
    setupFiles: ['test/setup.ts'],
  },
});
