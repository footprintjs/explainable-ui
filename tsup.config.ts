import { isAbsolute } from "node:path";
import { rollup } from "rollup";
import { dts } from "rollup-plugin-dts";
import { defineConfig } from "tsup";
import type { Options } from "tsup";

// tsup externalizes every peer for declarations. Graph consumers do not install
// the record peer, so inline the canonical Foottrace cause types at build time.
// The /record entry keeps its direct external Foottrace types and runtime.
function graphEntry(name: string, input: string): Options {
  return {
    entry: { [name]: input },
    format: ["esm", "cjs"],
    sourcemap: true,
    external: ["react", "react-dom", "@xyflow/react", "dagre"],
    esbuildOptions(options) {
      options.jsx = "automatic";
    },
    async onSuccess() {
      const bundle = await rollup({
        input,
        external: id => !id.startsWith(".") && !isAbsolute(id) &&
          id !== input && id !== "foottrace" && !id.startsWith("foottrace/"),
        plugins: [dts({ respectExternal: true })],
      });
      try {
        for (const extension of ["ts", "cts"]) {
          await bundle.write({ file: `dist/${name}.d.${extension}`, format: "es" });
        }
      } finally {
        await bundle.close();
      }
    },
  };
}

export default defineConfig([
  graphEntry("index", "src/index.ts"),
  graphEntry("flowchart", "src/flowchart.ts"),
  {
    entry: { record: "src/record/index.ts" },
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    external: ["react", "foottrace"],
    esbuildOptions(options) {
      options.jsx = "automatic";
    },
  },
]);
