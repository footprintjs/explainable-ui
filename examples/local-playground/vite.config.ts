import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  // Relative assets work at the Pages subdirectory and in local static builds.
  base: "./",
  plugins: [react()],
  // Preview consumer APIs from source, including layouts and node-icon examples.
  resolve: {
    alias: [
      { find: /^footprint-explainable-ui$/, replacement: fileURLToPath(new URL("../../src/index.ts", import.meta.url)) },
      { find: /^footprint-explainable-ui\/flowchart$/, replacement: fileURLToPath(new URL("../../src/flowchart.ts", import.meta.url)) },
    ],
  },
  server: { host: "127.0.0.1", port: 5314, strictPort: true },
  preview: { host: "127.0.0.1", port: 5314, strictPort: true },
  build: {
    outDir: fileURLToPath(new URL("../../demo-dist/local-playground", import.meta.url)),
    emptyOutDir: true,
  },
});
