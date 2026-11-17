import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  test: {
    include: ['test/**/*.test.{ts,tsx}', 'src/recordedRelationships/*.test.ts', 'src/recordedValues/*.test.ts', 'src/components/GroupedFlowDiagram/*.test.{ts,tsx}', 'src/components/FailureExplanationView/*.test.tsx', 'src/components/FailureExplanationView/findingLevel/*.test.ts', 'src/components/InvestigationPanel/*.test.{ts,tsx}', 'src/components/InvestigationPanel/coverage/*.test.{ts,tsx}', 'src/displayAdmission/**/*.test.ts', 'src/progressiveRendering/**/*.test.ts'],
    // Setup file runs for jsdom tests (provides scrollIntoView stub + cleanup)
    setupFiles: ['test/setup.ts'],
  },
  resolve: {
    alias: [
      // `examples/` imports the library BY NAME, so its source reads exactly
      // as a consumer would copy it. Point that name at src so the example
      // test runs against the code in this working tree, not a stale build.
      { find: /^footprint-explainable-ui\/flowchart$/, replacement: fileURLToPath(new URL('./src/flowchart.ts', import.meta.url)) },
      { find: /^footprint-explainable-ui$/, replacement: fileURLToPath(new URL('./src/index.ts', import.meta.url)) },
    ],
  },
});
