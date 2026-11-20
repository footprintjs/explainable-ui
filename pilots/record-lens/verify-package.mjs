/** Install and exercise the original package archive in separate graph and recording consumers. */
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
import { archiveProof, compareInstalledFiles, installConsumer, verifyRejectedReader } from "./packed-consumers.mjs";
import ts from "typescript";
import { assertNoFoottraceRuntime, assertNoPilotSource } from "./shipping-boundary.mjs";

const repo = fileURLToPath(new URL("../../", import.meta.url));
const require = createRequire(join(repo, "package.json"));
const scratch = realpathSync(mkdtempSync(join(tmpdir(), "public-record-consumer-")));
const keep = process.argv.includes("--keep");
const fixture = join(scratch, "consumer");
const modules = join(fixture, "node_modules");
const packageName = "footprint-explainable-ui";
const installed = join(modules, packageName);
const entry = `${packageName}/record`;
const forbidden = ["footprintjs", "agentfootprint", "@xyflow/react", "dagre", "react-dom", "hcifootprint", "vizfootprint"];
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
    [...walk(join(repo, "src")), join(repo, "package.json"), join(repo, "tsup.config.ts")]
      .sort()
      .map((path) => [
        relative(repo, path),
        createHash("sha256").update(readFileSync(path)).digest("hex"),
      ])
  );
const initialSources = sourceDigests();

function assertBrowserBoundary(result, vendors) {
  for (const [path, input] of Object.entries(result.metafile.inputs)) {
    const absolute = resolve(fixture, path);
    assert(
      path === "<stdin>" ||
        within(absolute, installed) ||
        within(absolute, join(modules, "foottrace")),
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
    absWorkingDir: fixture,
    ...(injected
      ? {
          stdin: {
            contents: `export * from ${JSON.stringify(
              entry
            )}; import ${JSON.stringify(injected)};`,
            resolveDir: fixture,
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

const consumerSource = `import { RecordTimeSlider, buildRecordLensModel, type TimeTravelSource, type RecordLensInput } from "${packageName}/record";
const input: RecordLensInput = { sourceId: "fixture", source: { commitLog: [], initialState: { seed: 1 } }, step: 0 };
export const source: TimeTravelSource = input.source;
export const result = buildRecordLensModel(input);
export const Slider = RecordTimeSlider;
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
  // the installed package declarations as an ordinary external consumer would.
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
if (typeof lens.RecordTimeSlider !== "function") throw new Error("Missing record slider");
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

function packPackage(directory, destination) {
  return JSON.parse(execFileSync("npm", [
    "pack", "--json", "--ignore-scripts", "--offline", "--pack-destination", destination,
  ], { cwd: directory, env, encoding: "utf8" }))[0];
}

function verifyPublishStage(unpacked, expectedIdentity) {
  const staging = join(scratch, "publish-stage");
  execFileSync(process.execPath, [join(repo, "scripts/stage-package.mjs"), staging], { cwd: repo, env });
  compareInstalledFiles(unpacked, staging);

  const destination = join(scratch, "publish-archive");
  mkdirSync(destination);
  const packed = packPackage(staging, destination);
  const identity = archiveProof(join(destination, packed.filename), packed);
  assert.deepEqual(identity, expectedIdentity, "Publish stage must pack into the same archive as the verified build");
  return { ...identity, files: packed.files.map((row) => row.path) };
}

function verifyNormalPackage() {
  const manifest = json(join(repo, "package.json"));
  const door = (name) => ({
    import: { types: `./dist/${name}.d.ts`, default: `./dist/${name}.js` },
    require: { types: `./dist/${name}.d.cts`, default: `./dist/${name}.cjs` },
  });
  assert.deepEqual(
    manifest.exports,
    { ".": door("index"), "./flowchart": door("flowchart"), "./record": door("record") },
    "Exactly the three public entries must ship"
  );
  assert.deepEqual(
    [manifest.main, manifest.module, manifest.types],
    ["./dist/index.cjs", "./dist/index.js", "./dist/index.d.ts"]
  );
  assert.deepEqual(manifest.files, ["dist", "CHANGELOG.md"]);
  assert.deepEqual(manifest.engines, { node: ">=22" });
  const artifact = process.env.UI_PACKED_REVIEW;
  const packed = artifact
    ? json(resolve(repo, artifact))[0]
    : packPackage(repo, scratch);
  assert.equal(packed.name, packageName);
  assert.equal(packed.version, manifest.version);
  assert.equal(packed.filename, `${packageName}-${manifest.version}.tgz`);
  const archive = join(artifact ? dirname(resolve(repo, artifact)) : scratch, packed.filename);
  const identity = archiveProof(archive, packed);
  const unpacked = join(scratch, "normal-package");
  mkdirSync(unpacked);
  execFileSync("tar", ["-xzf", archive, "-C", unpacked]);
  assert.equal(
    readFileSync(join(unpacked, "package/CHANGELOG.md"), "utf8"),
    readFileSync(join(repo, "CHANGELOG.md"), "utf8")
  );
  const shipped = walk(join(unpacked, "package"));
  const inspectedDistFiles = [];
  const verifiedSources = new Set();
  for (const path of shipped) {
    const rel = relative(join(unpacked, "package"), path);
    assert(
      /^(?:dist\/[^/]+|package\.json|README\.md|CHANGELOG\.md|LICENSE)$/.test(rel),
      `Unexpected archive member: ${rel}`
    );
    if (rel.startsWith("dist/")) {
      const graphEntry = !rel.startsWith("dist/record.");
      if (graphEntry) assertNoPilotSource(readFileSync(path, "utf8"), rel);
      // Canonical cause TYPES are bundled for the optional panel; no Foottrace
      // eager runtime import is allowed. The scoped reader loads an optional peer on demand.
      // Source-map admission below also rejects any
      // bundled runtime input outside src/, including node_modules/foottrace.
      if (graphEntry && /\.(?:c?js)$/.test(rel))
        assertNoFoottraceRuntime(readFileSync(path, "utf8"), rel);
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
  const expectedDistFiles = ["flowchart", "index", "record"].flatMap((name) =>
    ["cjs", "cjs.map", "d.cts", "d.ts", "js", "js.map"].map(
      (extension) => `dist/${name}.${extension}`
    )
  );
  assert.deepEqual(
    inspectedDistFiles.sort(),
    expectedDistFiles.sort(),
    "Only the three dual-format entries, declarations and source maps may ship"
  );
  assert(
    verifiedSources.has("src/index.ts") &&
      verifiedSources.has("src/flowchart.ts") && verifiedSources.has("src/record/model.ts"),
    "The graph entries and public reader implementation must match the source"
  );
  evidence.gates.normalTarball = {
    files: packed.files.map((row) => row.path),
    inspectedDistFiles,
    sourceMapInputsVerified: [...verifiedSources].sort(),
    ...identity,
    memberSha256: Object.fromEntries(shipped.map(path => [relative(join(unpacked, "package"), path),
      createHash("sha256").update(readFileSync(path)).digest("hex")])),
    testedCommit: execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo, encoding: "utf8" }).trim(),
    testedTree: execFileSync("git", ["rev-parse", "HEAD^{tree}"], { cwd: repo, encoding: "utf8" }).trim(),
  };
  assert.deepEqual(json(join(unpacked, "package/package.json")), manifest);
  evidence.gates.publishStage = verifyPublishStage(join(unpacked, "package"), identity);
  return { archive, unpacked: join(unpacked, "package") };
}

try {
  const { archive, unpacked } = verifyNormalPackage();
  const graphFixture = join(scratch, "graph");
  evidence.gates.graphWithoutReader = installConsumer({ fixture: graphFixture, archive, repo, env, graph: true });
  compareInstalledFiles(unpacked, join(graphFixture, "node_modules", packageName));
  // Resolving imports in a browser build also walks optional lazy chunks. A
  // Node-only import check cannot catch unresolved transitive recording peers.
  await bundle({
    absWorkingDir: graphFixture, entryPoints: [packageName], bundle: true,
    platform: "browser", format: "esm", write: false, logLevel: "silent",
  });
  evidence.gates.graphTypesTooling = Object.fromEntries(
    ["typescript", "@types/react", "@types/react-dom"].map(name =>
      [name, json(join(repo, "node_modules", name, "package.json")).version]),
  );
  evidence.gates.unsupportedReaderMajor = verifyRejectedReader({
    directory: join(scratch, "unsupported-reader-major"), archive, env,
    react: evidence.gates.graphWithoutReader.versions.react, version: "1.7.0", code: "ERESOLVE",
  });
  const prerequisites = installConsumer({ fixture, archive, repo, env });
  compareInstalledFiles(unpacked, installed);
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
    prerequisites,
    runtime: ["ESM", "CJS"],
    declarations: ["NodeNext ESM", "NodeNext CJS", "Bundler"],
    skipLibCheck: false,
  };

  evidence.measurements.vendorExcluded = await browserBuild();
  assert(
    evidence.measurements.vendorExcluded.minifiedBytes <= minifiedBudget,
    `Record entry exceeds ${minifiedBudget} minified bytes excluding Foottrace/React`
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
      const path = join(installed, "dist", file);
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
      const path = join(installed, "dist", file);
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
    "Package source changed while verification was running; repeat on frozen source"
  );
  evidence.sourceDigests = initialSources;
  compareInstalledFiles(unpacked, installed);
  writeJSON(join(scratch, "verification.json"), evidence);
  if (process.env.UI_PACKED_REVIEW) {
    writeJSON(join(dirname(resolve(repo, process.env.UI_PACKED_REVIEW)), "record-consumer-verification.json"), evidence);
  }
  console.log(JSON.stringify(evidence, null, 2));
  if (keep) console.log(`Retained record-consumer evidence: ${scratch}`);
} finally {
  // Only the directory allocated by this invocation; never dist or caller input.
  if (!keep) rmSync(scratch, { recursive: true, force: true });
}
