/** Reproducible offline packed ESM/CJS UI replay. Build first. No installs/network. */
import { graphConsumerPackages } from "./fixtures/graph-consumer-packages.mjs";
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
function run(command, args, cwd, commandEnv = env) {
  const result = spawnSync(command, args, { cwd, env: commandEnv, encoding: "utf8" });
  if (result.status !== 0)
    throw Error(
      `${command} failed (${result.status})\n${result.stdout ?? ""}\n${
        result.stderr ?? ""
      }`
    );
  return result.stdout;
}
try {
  const npm = join(
    dirname(process.execPath),
    "../lib/node_modules/npm/bin/npm-cli.js"
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
      repo
    )
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
    repo
  );
  const manifest = JSON.parse(readFileSync(join(repo, "package.json"), "utf8"));
  for (const name of [
    ...new Set([
      ...graphConsumerPackages(manifest),
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
  const componentSuites = [
    "ExplainableShellSubflowRecorded",
    "ExplainableShellSubflowRevision",
    "ExplainableShellNavigationReview",
  ];
  for (const [suite, sourcePath, group] of [
    ...componentSuites.map(name => [name, `test/component/${name}.test.tsx`, "shared"]),
    ["TraceWalkHandoff", "test/unit/traceWalkHandoff.test.ts", "shared"],
    ["PublicTraceScopeParity", "test/component/PublicTraceScopeParity.test.tsx", "without-reader"],
    ["ExplainableShellPayment", "test/component/ExplainableShellPayment.test.tsx", "with-reader"],
  ]) {
    const groupDir = join(tests, group);
    mkdirSync(groupDir, { recursive: true });
    const source = readFileSync(
      join(repo, sourcePath),
      "utf8"
    );
    // Exercise the actual public doors in each format: Shell is on root,
    // while the structure recorder belongs to the /flowchart subpath.
    const consumer = source
      .replace(
        /(["'])\.\.\/\.\.\/src\/components\/ExplainableShell\/ExplainableShell\1/g,
        '"__PACKED_SHELL__"'
      )
      .replace(
        /(["'])\.\.\/\.\.\/src\/components\/FlowchartView\/traceStructureRecorder\1/g,
        '"__PACKED_FLOWCHART__"'
      );
    const publicConsumer = consumer
      .replace(/(["'])\.\.\/\.\.\/src\/index\1/g, '"__PACKED_SHELL__"')
      .replace(/(["'])\.\.\/\.\.\/src\/flowchart\1/g, '"__PACKED_FLOWCHART__"');
    if (publicConsumer.includes("../../src/"))
      throw new Error("Unexpected source-only import in packed replay suite");
    for (const [format, extension] of [
      ["esm", "js"],
      ["cjs", "cjs"],
    ]) {
      writeFileSync(
        join(groupDir, `${suite}-${format}.test.tsx`),
        publicConsumer
          .replaceAll(
            '"__PACKED_SHELL__"',
            JSON.stringify(join(destination, "dist", `index.${extension}`))
          )
          .replaceAll(
            '"__PACKED_FLOWCHART__"',
            JSON.stringify(join(destination, "dist", `flowchart.${extension}`))
          )
      );
    }
  }
  writeFileSync(
    join(scratch, "package.json"),
    JSON.stringify({ private: true, type: "module" })
  );
  writeFileSync(
    join(scratch, "vitest.config.mjs"),
    `export default {test:{include:['test/*/*.test.tsx'],setupFiles:['test/setup.ts'],maxWorkers:1,fileParallelism:false}};\n`
  );
  // Run the shared recordings in both installations. Each also exercises its own
  // public contract: synchronous copy parity, or recorded cross-scope navigation.
  for (const profile of ["without-reader", "with-reader"]) {
    if (profile === "with-reader") {
      symlinkSync(join(repo, "node_modules", "foottrace"), join(modules, "foottrace"), "dir");
    }
    console.log(`Packed replay: ${profile}`);
    console.log(run(process.execPath, [
      join(repo, "node_modules/vitest/vitest.mjs"),
      "run", "--config", join(scratch, "vitest.config.mjs"),
      "test/shared/", `test/${profile}/`,
    ], scratch, { ...env, SCOPED_REPLAY_FOOTTRACE: profile }));
  }
  console.log(
    JSON.stringify({
      offline: true,
      installedPackedFiles: true,
      formats: ["esm", "cjs"],
      foottrace: ["absent", "installed"],
      packageIntegrity: packed[0].integrity,
    })
  );
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
