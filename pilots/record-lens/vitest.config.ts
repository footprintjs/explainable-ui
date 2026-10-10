import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  root: fileURLToPath(new URL("../../", import.meta.url)),
  test: {
    include: ["pilots/record-lens/**/*.pilot.{ts,tsx}"],
    setupFiles: ["test/setup.ts"],
  },
});
