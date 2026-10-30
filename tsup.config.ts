import { defineConfig } from "tsup";

// Both public doors must carry their types without a consumer installing Foottrace.
const declarations = () => ({
  resolve: true,
  compilerOptions: {
    paths: {
      "foottrace/cause": ["./node_modules/foottrace/dist/esm/cause.d.ts"],
    },
  },
});

export default defineConfig([
  {
    entry: { index: "src/index.ts" },
    format: ["esm", "cjs"],
    dts: declarations(),
    sourcemap: true,
    external: ["react", "react-dom", "@xyflow/react"],
    esbuildOptions(options) {
      options.jsx = "automatic";
    },
  },
  {
    entry: { flowchart: "src/flowchart.ts" },
    format: ["esm", "cjs"],
    dts: declarations(),
    sourcemap: true,
    external: ["react", "react-dom", "@xyflow/react"],
    esbuildOptions(options) {
      options.jsx = "automatic";
    },
  },
]);
