/** Reproducible offline packed ESM/CJS UI replay. Build first. No installs/network. */
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  cpSync,
  symlinkSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
const repo = fileURLToPath(new URL("../", import.meta.url));
const scratch = mkdtempSync(join(tmpdir(), "scoped-trace-package-"));
const env = {
  PATH: process.env.PATH ?? "/usr/bin:/bin",
  HOME: scratch,
  TMPDIR: tmpdir(),
  CI: "true",
  npm_config_offline: "true",
};
function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, env, encoding: "utf8" });
  if (result.status !== 0)
    throw Error(
      `${command} failed (${result.status})\n${result.stdout ?? ""}\n${result.stderr ?? ""}`,
    );
  return result.stdout;
}
try {
  const npm = join(
    dirname(process.execPath),
    "../lib/node_modules/npm/bin/npm-cli.js",
  );
  const packed = JSON.parse(
    run(
      process.execPath,
      [
        npm,
        "pack",
        "--json",
        "--ignore-scripts",
        "--pack-destination",
        scratch,
      ],
      repo,
    ),
  );
  const modules = join(scratch, "node_modules");
  mkdirSync(modules);
  const destination = join(modules, "footprint-explainable-ui");
  mkdirSync(destination);
  run(
    "/usr/bin/tar",
    [
      "-xzf",
      join(scratch, packed[0].filename),
      "--strip-components=1",
      "-C",
      destination,
    ],
    repo,
  );
  const manifest = JSON.parse(readFileSync(join(repo, "package.json"), "utf8"));
  for (const name of [
    ...new Set([
      ...Object.keys(manifest.peerDependencies),
      ...Object.keys(manifest.dependencies),
      "vitest",
      "@testing-library/react",
      "@testing-library/jest-dom",
      "jsdom",
    ]),
  ]) {
    mkdirSync(dirname(join(modules, name)), { recursive: true });
    symlinkSync(join(repo, "node_modules", name), join(modules, name), "dir");
  }
  const tests = join(scratch, "test");
  mkdirSync(tests);
  cpSync(join(repo, "test/fixtures"), join(tests, "fixtures"), {
    recursive: true,
  });
  cpSync(join(repo, "test/setup.ts"), join(tests, "setup.ts"));
  for (const suite of [
    "ExplainableShellSubflowRecorded",
    "ExplainableShellSubflowRevision",
  ]) {
    const source = readFileSync(
      join(repo, `test/component/${suite}.test.tsx`),
      "utf8",
    );
    // Exercise the actual public doors in each format: Shell is on root,
    // while the structure recorder belongs to the /flowchart subpath.
    const consumer = source
      .replace(
        /(["'])\.\.\/\.\.\/src\/components\/ExplainableShell\/ExplainableShell\1/g,
        '"__PACKED_SHELL__"',
      )
      .replace(
        /(["'])\.\.\/\.\.\/src\/components\/FlowchartView\/traceStructureRecorder\1/g,
        '"__PACKED_FLOWCHART__"',
      );
    if (consumer.includes("../../src/"))
      throw new Error("Unexpected source-only import in packed replay suite");
    for (const [format, extension] of [
      ["esm", "js"],
      ["cjs", "cjs"],
    ]) {
      writeFileSync(
        join(tests, `${suite}-${format}.test.tsx`),
        consumer
          .replaceAll(
            '"__PACKED_SHELL__"',
            JSON.stringify(join(destination, "dist", `index.${extension}`)),
          )
          .replaceAll(
            '"__PACKED_FLOWCHART__"',
            JSON.stringify(join(destination, "dist", `flowchart.${extension}`)),
          ),
      );
    }
  }
  writeFileSync(
    join(scratch, "package.json"),
    JSON.stringify({ private: true, type: "module" }),
  );
  writeFileSync(
    join(scratch, "vitest.config.mjs"),
    `export default {test:{include:['test/*.test.tsx'],setupFiles:['test/setup.ts'],maxWorkers:2}};\n`,
  );
  const output = run(
    process.execPath,
    [
      join(repo, "node_modules/vitest/vitest.mjs"),
      "run",
      "--config",
      join(scratch, "vitest.config.mjs"),
    ],
    scratch,
  );
  console.log(output);
  console.log(
    JSON.stringify({
      offline: true,
      installedPackedFiles: true,
      formats: ["esm", "cjs"],
      packageIntegrity: packed[0].integrity,
    }),
  );
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
