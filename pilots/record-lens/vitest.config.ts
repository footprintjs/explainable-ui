import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  root: fileURLToPath(new URL("../../", import.meta.url)),
  resolve: {
    alias: { 'footprint-explainable-ui/record': fileURLToPath(new URL('../../src/record/index.ts', import.meta.url)) },
  },
  test: {
    include: ["pilots/record-lens/**/*.pilot.{ts,tsx}", "examples/record-slider/*.test.tsx"],
    setupFiles: ["test/setup.ts"],
  },
});
