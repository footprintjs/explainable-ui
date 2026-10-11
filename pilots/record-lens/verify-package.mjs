/** Unpublished-major proof: both existing entries remain; synthetic /record is isolated. */
import "./require-node.mjs";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import {
  cpSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { build as bundle } from "esbuild";
import { build as buildPackage } from "tsup";
import ts from "typescript";

const repo = fileURLToPath(new URL("../../", import.meta.url));
const require = createRequire(join(repo, "package.json"));
const scratch = realpathSync(mkdtempSync(join(tmpdir(), "record-lens-pilot-")));
const keep = process.argv.includes("--keep");
const fixture = join(scratch, "consumer");
const modules = join(fixture, "node_modules");
const packageName = "@record-lens/pilot";
const pilot = join(modules, packageName);
const entry = join(repo, "src/record/index.ts");
const forbidden = ["footprintjs", "agentfootprint", "@xyflow/react"];
const allowedRuntime = new Set(["react", "foottrace"]);
const minifiedBudget = 50_000;
const evidence = { gates: {}, measurements: {}, negativeControls: [] };
const env = { ...process.env, NODE_PATH: "", NODE_OPTIONS: "" };
const json = (path) => JSON.parse(readFileSync(path, "utf8"));
const writeJSON = (path, value) =>
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
const within = (path, parent) =>
  path === parent || path.startsWith(`${parent}${sep}`);
const packageOf = (specifier) =>
  specifier.startsWith("@")
    ? specifier.split("/").slice(0, 2).join("/")
    : specifier.split("/")[0];
const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((item) =>
    item.isDirectory() ? walk(join(dir, item.name)) : [join(dir, item.name)]
  );
const sourceDigests = () =>
  Object.fromEntries(
    [...walk(join(repo, "src/record")), join(repo, "src/theme/styles.ts")]
      .sort()
      .map((path) => [
        relative(repo, path),
        createHash("sha256").update(readFileSync(path)).digest("hex"),
      ])
  );
const initialSources = sourceDigests();

function assertBrowserBoundary(result, vendors) {
  for (const [path, input] of Object.entries(result.metafile.inputs)) {
    const absolute = resolve(repo, path);
    assert(
      path === "<stdin>" ||
        within(absolute, join(repo, "src")) ||
        within(absolute, join(repo, "node_modules/foottrace")),
      `Unexpected bundled dependency: ${path}`
    );
    for (const imported of input.imports.filter((row) => row.external)) {
      assert(
        vendors.has(packageOf(imported.path)),
        `Unexpected runtime import: ${imported.path}`
      );
    }
  }
  for (const output of Object.values(result.metafile.outputs)) {
    for (const imported of output.imports.filter((row) => row.external)) {
      assert(
        vendors.has(packageOf(imported.path)),
        `Unexpected runtime import: ${imported.path}`
      );
    }
  }
}

async function browserBuild({ injected, includeFoottrace = false } = {}) {
  const vendors = new Set(includeFoottrace ? ["react"] : allowedRuntime);
  const result = await bundle({
    absWorkingDir: repo,
    ...(injected
      ? {
          stdin: {
            contents: `export * from ${JSON.stringify(
              entry
            )}; import ${JSON.stringify(injected)};`,
            resolveDir: repo,
          },
        }
      : { entryPoints: [entry] }),
    bundle: true,
    platform: "browser",
    format: "esm",
    target: "es2022",
    minify: true,
    jsx: "automatic",
    treeShaking: true,
    write: false,
    metafile: true,
    external: [...vendors, ...(injected ? [injected] : [])],
  });
  assertBrowserBoundary(result, vendors);
  const bytes = result.outputFiles[0].contents;
  return {
    minifiedBytes: bytes.length,
    gzipBytes: gzipSync(bytes, { level: 9 }).length,
    inputFiles: Object.keys(result.metafile.inputs),
    externalImports: [
      ...new Set(
        Object.values(result.metafile.outputs).flatMap((row) =>
          row.imports.filter((x) => x.external).map((x) => x.path)
        )
      ),
    ],
  };
}

function copyPrerequisite(name) {
  const source = dirname(require.resolve(`${name}/package.json`));
  cpSync(source, join(modules, name), { recursive: true });
  return json(join(source, "package.json")).version;
}

const consumerSource = `import { buildRecordLensModel, type RecordLensInput } from "${packageName}/record";
const input: RecordLensInput = { sourceId: "fixture", source: { commitLog: [], initialState: { seed: 1 } }, step: 0 };
export const result = buildRecordLensModel(input);
`;

function checkDeclarations(mode, extension, expectedMissing) {
  const consumer = join(fixture, `consumer.${extension}`);
  writeFileSync(consumer, consumerSource);
  const options = {
    target: ts.ScriptTarget.ES2022,
    module: mode === "bundler" ? ts.ModuleKind.ESNext : ts.ModuleKind.NodeNext,
    moduleResolution:
      mode === "bundler"
        ? ts.ModuleResolutionKind.Bundler
        : ts.ModuleResolutionKind.NodeNext,
    jsx: ts.JsxEmit.ReactJSX,
    strict: true,
    skipLibCheck: false,
    noEmit: true,
    types: [],
    esModuleInterop: true,
  };
  // No paths, alias, baseUrl, or repository node_modules: TypeScript resolves
  // the copied emitted declarations as an ordinary external consumer would.
  const program = ts.createProgram([consumer], options);
  const diagnostics = ts.getPreEmitDiagnostics(program);
  const typeScriptRoot = dirname(require.resolve("typescript"));
  for (const source of program.getSourceFiles()) {
    const resolved = realpathSync(source.fileName);
    assert(
      within(resolved, fixture) || within(resolved, typeScriptRoot),
      `Declaration resolved outside isolated consumer: ${resolved}`
    );
  }
  if (expectedMissing) {
    assert(
      diagnostics.some(
        (d) =>
          d.code === 2307 &&
          ts
            .flattenDiagnosticMessageText(d.messageText, "\n")
            .includes(expectedMissing)
      ),
      `Negative declaration control did not reject ${expectedMissing}`
    );
  } else {
    assert.equal(
      diagnostics.length,
      0,
      ts.formatDiagnosticsWithColorAndContext(diagnostics, {
        getCanonicalFileName: (x) => x,
        getCurrentDirectory: () => fixture,
        getNewLine: () => "\n",
      })
    );
  }
}

function checkRuntime(extension, expectedMissing) {
  const esm = extension === "mjs";
  const path = join(fixture, `consumer.${extension}`);
  writeFileSync(
    path,
    `${
      esm
        ? `import * as lens from "${packageName}/record";
import * as record from "foottrace";
import verifyRealFixtures from "./runtime-fixtures.cjs";`
        : `const lens = require("${packageName}/record");
const record = require("foottrace");
const verifyRealFixtures = require("./runtime-fixtures.cjs");`
    }
const result = lens.buildRecordLensModel({ sourceId: "fixture", source: { commitLog: [], initialState: { seed: 1 } }, step: 0 });
if (result.status !== "empty" || result.folded.state.seed !== 1) throw new Error("Real canonical fold failed");
if (typeof lens.RecordLens !== "function") throw new Error("Missing composed viewer");
console.log(JSON.stringify(verifyRealFixtures(lens, record)));
`
  );
  const run = spawnSync(process.execPath, [path], {
    cwd: fixture,
    env,
    encoding: "utf8",
  });
  if (expectedMissing) {
    assert.notEqual(
      run.status,
      0,
      `Negative runtime control unexpectedly loaded ${expectedMissing}`
    );
    assert.match(run.stderr, /(?:ERR_MODULE_NOT_FOUND|MODULE_NOT_FOUND)/);
    assert(run.stderr.includes(expectedMissing), run.stderr);
  } else {
    assert.equal(run.status, 0, run.stderr || run.error?.message);
    return JSON.parse(run.stdout);
  }
}

function verifyNormalPackage() {
  const manifest = json(join(repo, "package.json"));
  const door = (name) => ({
    import: { types: `./dist/${name}.d.ts`, default: `./dist/${name}.js` },
    require: { types: `./dist/${name}.d.cts`, default: `./dist/${name}.cjs` },
  });
  assert.deepEqual(
    manifest.exports,
    { ".": door("index"), "./flowchart": door("flowchart") },
    "The source pilot must not change shipped doors"
  );
  assert.deepEqual(
    [manifest.main, manifest.module, manifest.types],
    ["./dist/index.cjs", "./dist/index.js", "./dist/index.d.ts"]
  );
  assert.deepEqual(manifest.files, ["dist"]);
  assert.deepEqual(manifest.engines, { node: ">=22" });
  assert.deepEqual(manifest.dependencies, { dagre: "^0.8.5", foottrace: "^1.0.3" });
  assert.deepEqual(manifest.peerDependencies, {
    "@xyflow/react": "^12.0.0",
    react: ">=18.0.0",
    "react-dom": ">=18.0.0",
  });
  assert.equal(manifest.peerDependenciesMeta, undefined);
  assert.deepEqual(manifest.typesVersions, {
    "*": { flowchart: ["./dist/flowchart.d.ts"] },
  });
  assert.equal(manifest.devDependencies.foottrace, undefined);
  const packed = JSON.parse(
    execFileSync(
      "npm",
      [
        "pack",
        "--json",
        "--ignore-scripts",
        "--offline",
        "--cache",
        join(scratch, "npm-cache"),
        "--pack-destination",
        scratch,
      ],
      { cwd: repo, env, encoding: "utf8" }
    )
  )[0];
  const unpacked = join(scratch, "normal-package");
  mkdirSync(unpacked);
  execFileSync("tar", ["-xzf", join(scratch, packed.filename), "-C", unpacked]);
  const shipped = walk(join(unpacked, "package"));
  const inspectedDistFiles = [];
  const verifiedSources = new Set();
  for (const path of shipped) {
    const rel = relative(join(unpacked, "package"), path);
    assert(
      !/(?:^|\/)(?:src|pilots|record)(?:\/|\.)/.test(rel),
      `Pilot path shipped: ${rel}`
    );
    if (rel.startsWith("dist/")) {
      assert(
        !/RecordLens|buildRecordLensModel|src\/record\/(?:index|model|RecordLens)/.test(readFileSync(path, "utf8")),
        `Normal shipped output contains the unexported pilot viewer/model: ${rel}`
      );
      inspectedDistFiles.push(rel);
      if (rel.endsWith(".map")) {
        const map = json(path);
        assert.equal(map.sources.length, map.sourcesContent.length);
        map.sources.forEach((source, index) => {
          const actual = resolve(repo, dirname(rel), source);
          assert(
            within(actual, join(repo, "src")),
            `Unexpected source-map input: ${source}`
          );
          assert.equal(
            map.sourcesContent[index],
            readFileSync(actual, "utf8"),
            `Stale normal build: ${source}; run npm run build`
          );
          verifiedSources.add(relative(repo, actual));
        });
      }
    }
  }
  const expectedDistFiles = ["flowchart", "index"].flatMap((name) =>
    ["cjs", "cjs.map", "d.cts", "d.ts", "js", "js.map"].map(
      (extension) => `dist/${name}.${extension}`
    )
  );
  assert.deepEqual(
    inspectedDistFiles.sort(),
    expectedDistFiles.sort(),
    "The original two dual-format entries/types/maps must remain the whole dist package"
  );
  assert(
    verifiedSources.has("src/index.ts") &&
      verifiedSources.has("src/flowchart.ts"),
    "Both normal entry sources must be verified"
  );
  evidence.gates.normalTarball = {
    files: packed.files.map((row) => row.path),
    inspectedDistFiles,
    sourceMapInputsVerified: [...verifiedSources].sort(),
    integrity: packed.integrity,
  };
}

try {
  verifyNormalPackage();
  mkdirSync(pilot, { recursive: true });
  writeJSON(join(fixture, "package.json"), { private: true, type: "module" });
  const versions = Object.fromEntries(
    ["foottrace", "react", "@types/react", "csstype"].map((name) => [
      name,
      copyPrerequisite(name),
    ])
  );
  assert.match(versions.foottrace, /^1\.\d+\.\d+$/);
  const [, readerMinor, readerPatch] = versions.foottrace.split(".").map(Number);
  assert(readerMinor > 0 || readerPatch >= 3, "Foottrace must satisfy the supported ^1.0.3 runtime range");
  const fixtureDirectory = join(repo, "pilots/record-lens/fixtures");
  const fixtureHashes = json(
    join(fixtureDirectory, "provenance.json")
  ).fixtureSha256;
  for (const name of ["flow.json", "hci.json"]) {
    cpSync(join(fixtureDirectory, name), join(fixture, name));
    assert.equal(
      createHash("sha256")
        .update(readFileSync(join(fixture, name)))
        .digest("hex"),
      fixtureHashes[name]
    );
  }
  cpSync(
    join(repo, "pilots/record-lens/runtime-fixtures.cjs"),
    join(fixture, "runtime-fixtures.cjs")
  );
  writeJSON(join(pilot, "package.json"), {
    name: packageName,
    version: "0.0.0-pilot",
    private: true,
    type: "module",
    exports: {
      "./record": {
        import: { types: "./record.d.ts", default: "./record.js" },
        require: { types: "./record.d.cts", default: "./record.cjs" },
      },
    },
    dependencies: { foottrace: versions.foottrace },
    peerDependencies: { react: ">=18" },
  });
  await buildPackage({
    entry: { record: entry },
    format: ["esm", "cjs"],
    dts: true,
    outDir: pilot,
    clean: false,
    sourcemap: false,
    splitting: false,
    config: false,
    tsconfig: join(repo, "tsconfig.json"),
    external: ["react", "react-dom", "foottrace"],
    esbuildOptions(options) {
      options.jsx = "automatic";
    },
  });
  evidence.gates.realFixturesVerified = {
    fixtureHashes,
    producerRuntimesAbsent: [
      "footprintjs",
      "hcifootprint",
      "agentfootprint",
      "@xyflow/react",
    ],
    modes: Object.fromEntries(
      ["mjs", "cjs"].map((extension) => [extension, checkRuntime(extension)])
    ),
  };
  for (const [mode, ext] of [
    ["nodenext", "mts"],
    ["nodenext", "cts"],
    ["bundler", "tsx"],
  ])
    checkDeclarations(mode, ext);
  evidence.gates.isolatedConsumer = {
    prerequisites: versions,
    runtime: ["ESM", "CJS"],
    declarations: ["NodeNext ESM", "NodeNext CJS", "Bundler"],
    skipLibCheck: false,
  };

  evidence.measurements.vendorExcluded = await browserBuild();
  assert(
    evidence.measurements.vendorExcluded.minifiedBytes <= minifiedBudget,
    `Pilot exceeds ${minifiedBudget} minified bytes excluding Foottrace/React`
  );
  evidence.measurements.withFoottrace = await browserBuild({
    includeFoottrace: true,
  });
  evidence.measurements.budgetBytes = minifiedBudget;
  evidence.measurements.conditions =
    "ES2022/browser/ESM/minified/all entry exports; gzip9. First row excludes Foottrace and React; second includes Foottrace and excludes React. Not an application-download or savings claim.";

  for (const name of forbidden) {
    await assert.rejects(
      () => browserBuild({ injected: name }),
      /Unexpected runtime import/
    );
    for (const [file, extension, statement] of [
      ["record.js", "mjs", `import ${JSON.stringify(name)};\n`],
      ["record.cjs", "cjs", `require(${JSON.stringify(name)});\n`],
    ]) {
      const path = join(pilot, file);
      const original = readFileSync(path, "utf8");
      try {
        writeFileSync(path, statement + original);
        checkRuntime(extension, name);
      } finally {
        writeFileSync(path, original);
      }
    }
    for (const [file, mode, extension] of [
      ["record.d.ts", "nodenext", "mts"],
      ["record.d.cts", "nodenext", "cts"],
      ["record.d.ts", "bundler", "tsx"],
    ]) {
      const path = join(pilot, file);
      const original = readFileSync(path, "utf8");
      try {
        writeFileSync(
          path,
          original +
            `\nexport type __PilotLeak = import(${JSON.stringify(
              name
            )}).__PilotLeak;\n`
        );
        checkDeclarations(mode, extension, name);
      } finally {
        writeFileSync(path, original);
      }
    }
    evidence.negativeControls.push({
      package: name,
      runtime: ["browser graph", "ESM", "CJS"],
      declarations: ["NodeNext ESM", "NodeNext CJS", "Bundler"],
      rejected: true,
    });
  }
  assert.deepEqual(
    sourceDigests(),
    initialSources,
    "Pilot source changed while verification was running; repeat on frozen source"
  );
  evidence.sourceDigests = initialSources;
  writeJSON(join(scratch, "verification.json"), evidence);
  console.log(JSON.stringify(evidence, null, 2));
  if (keep) console.log(`Retained pilot evidence: ${scratch}`);
} finally {
  // Only the directory allocated by this invocation; never dist or caller input.
  if (!keep) rmSync(scratch, { recursive: true, force: true });
}
