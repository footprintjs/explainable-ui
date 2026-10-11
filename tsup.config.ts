import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    flowchart: "src/flowchart.ts",
    record: "src/record/index.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  // One build owns cleanup and all chunks. tsup's Rollup transform retains
  // split CJS imports and original source maps for the lazy graph boundary.
  clean: true,
  splitting: true,
  treeshake: true,
  external: ["react", "react-dom", "@xyflow/react", "dagre", "foottrace"],
  esbuildOptions(options) {
    options.jsx = "automatic";
  },
});
