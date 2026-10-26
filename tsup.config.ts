import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: { index: "src/index.ts" },
    format: ["esm", "cjs"],
    dts: {
      resolve: true,
      compilerOptions: {
        paths: {
          "foottrace/cause": ["./node_modules/foottrace/dist/esm/cause.d.ts"],
        },
      },
    },
    sourcemap: true,
    external: ["react", "react-dom", "@xyflow/react"],
    esbuildOptions(options) {
      options.jsx = "automatic";
    },
  },
  {
    entry: { flowchart: "src/flowchart.ts" },
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    external: ["react", "react-dom", "@xyflow/react"],
    esbuildOptions(options) {
      options.jsx = "automatic";
    },
  },
]);
