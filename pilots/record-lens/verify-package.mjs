/** Verify the actual unpublished major tarball through ordinary consumer installs. */
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
import ts from "typescript";
import { assertCandidateManifest, forbiddenRecordPackages, installedPackages, sourceContents } from "./package-contract.mjs";

const repo = fileURLToPath(new URL("../../", import.meta.url));
const require = createRequire(join(repo, "package.json"));
const scratch = realpathSync(mkdtempSync(join(tmpdir(), "record-lens-pilot-")));
const keep = process.argv.includes("--keep");
let succeeded = false;
let fixture;
let modules;
let installed;
const packageName = "footprint-explainable-ui";
const forbidden = forbiddenRecordPackages;
const allowedRuntime = new Set(["react", "foottrace"]);
const minifiedBudget = 50_000;
const evidence = { gates: {}, consumers: {}, measurements: {}, negativeControls: [] };
const env = { ...process.env, NODE_PATH: "", NODE_OPTIONS: "", npm_config_cache: join(scratch, "npm-cache") };
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
              `${packageName}/record`
            )}; import ${JSON.stringify(injected)};`,
            resolveDir: fixture,
          },
        }
      : { entryPoints: [`${packageName}/record`] }),
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

const consumerSource = `import { buildRecordLensModel, type RecordLensInput } from "${packageName}/record";
const input: RecordLensInput = { sourceId: "fixture", source: { commitLog: [], initialState: { seed: 1 } }, step: 0 };
export const result = buildRecordLensModel(input);
`;

function checkDeclarations(mode, extension, expectedMissing, sourceText = consumerSource) {
  const consumer = join(fixture, `consumer.${extension}`);
  writeFileSync(consumer, sourceText);
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
  // the installed emitted declarations as an ordinary external consumer would.
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
  const ledger = json(join(repo, "test/migration/fixtures/record-package-additions.json"));
  assertCandidateManifest(manifest, ledger.packageContract);
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
      /^(?:dist\/[^/]+\.(?:js|cjs|d\.ts|d\.cts)(?:\.map)?|package\.json|README\.md|LICENSE)$/.test(rel),
      `Unexpected packed file (source, fixture, test or private data must not ship): ${rel}`
    );
    if (rel.startsWith("dist/")) {
      inspectedDistFiles.push(rel);
      if (rel.endsWith(".map")) {
        const map = json(path);
        const contents = sourceContents(map, rel.slice("dist/".length));
        map.sources.forEach((source, index) => {
          const actual = resolve(repo, dirname(rel), source);
          assert(
            within(actual, join(repo, "src")),
            `Unexpected source-map input: ${source}`
          );
          assert.equal(
            contents[index],
            readFileSync(actual, "utf8"),
            `Stale candidate build: ${source}; run npm run build`
          );
          verifiedSources.add(relative(repo, actual));
        });
      }
    }
  }
  const requiredDistFiles = ["flowchart", "index", "record"].flatMap((name) =>
    ["cjs", "cjs.map", "d.cts", "d.ts", "js", "js.map"].map(
      (extension) => `dist/${name}.${extension}`
    )
  );
  for (const path of requiredDistFiles) {
    assert(inspectedDistFiles.includes(path), `Missing dual-format public entry artifact: ${path}`);
  }
  // Rollup removes pure re-export barrels from its mappings. Their actual
  // public exports are checked below, and their hashes remain in the freeze;
  // require mapped executable owners rather than inventing barrel mappings.
  for (const owner of [
    "src/components/ExplainableShell/ExplainableShell.tsx",
    "src/components/FlowchartView/TracedFlow.tsx",
    "src/record/RecordLens.tsx", "src/record/model.ts",
  ]) assert(verifiedSources.has(owner), `Missing mapped entry implementation: ${owner}`);
  evidence.gates.normalTarball = {
    files: packed.files.map((row) => row.path),
    inspectedDistFiles,
    sourceMapInputsVerified: [...verifiedSources].sort(),
    barrelDigests: Object.fromEntries(["src/index.ts", "src/flowchart.ts", "src/record/index.ts"].map((path) => [path, initialSources[path]])),
    integrity: packed.integrity,
    sha256: createHash("sha256").update(readFileSync(join(scratch, packed.filename))).digest("hex"),
  };
  assert.deepEqual(json(join(unpacked, "package/package.json")), manifest);
  return { tarball: join(scratch, packed.filename), unpacked: join(unpacked, "package") };
}

function installConsumer(tarball, name, { floor = false, graph = false } = {}) {
  fixture = join(scratch, name);
  modules = join(fixture, "node_modules");
  installed = join(modules, packageName);
  mkdirSync(fixture);
  const version = (name) => json(join(repo, "node_modules", name, "package.json")).version;
  const dependencies = {
    [packageName]: `file:${tarball}`,
    react: version("react"),
    ...(floor ? { foottrace: "1.0.3" } : {}),
    ...(graph ? {
      "@xyflow/react": version("@xyflow/react"),
      dagre: version("dagre"),
      "react-dom": version("react-dom"),
    } : {}),
  };
  const devDependencies = {
    "@types/react": version("@types/react"),
    ...(graph ? { "@types/react-dom": version("@types/react-dom"), "@types/dagre": version("@types/dagre") } : {}),
  };
  writeJSON(join(fixture, "package.json"), { name: `lens-proof-${name}`, private: true, type: "module", dependencies, devDependencies });
  // Ordinary npm dependency/peer resolution of the ACTUAL tarball. No copying
  // prerequisites, synthetic facade, repository link, omit, override or force.
  const install = spawnSync("npm", ["install", "--strict-peer-deps", "--no-audit", "--no-fund"], {
    cwd: fixture, env, encoding: "utf8", maxBuffer: 12 * 1024 * 1024,
  });
  writeFileSync(join(fixture, "install.log"), `${install.stdout ?? ""}\n${install.stderr ?? ""}`);
  assert.equal(install.status, 0, install.stderr || install.error?.message);
  assert.equal(realpathSync(installed), installed, "The consumer must install the archive, not a linked checkout");
  const tree = JSON.parse(execFileSync("npm", ["ls", "--all", "--json"], { cwd: fixture, env, encoding: "utf8" }));
  const names = installedPackages(tree, !graph);
  for (const name of ["footprintjs", "agentfootprint", "hcifootprint", "vizfootprint"]) {
    assert(!names.includes(name), `Producer runtime unexpectedly installed: ${name}`);
  }
  const readerRoots = walk(modules)
    .filter((path) => path.endsWith(`${sep}package.json`) && json(path).name === "foottrace")
    .map((path) => dirname(path));
  assert.deepEqual(readerRoots, [join(modules, "foottrace")], "The installed package graph must have one physical Foottrace owner, not aliases or nested copies");
  const versions = Object.fromEntries(names.map((name) => [name, tree.dependencies[name]?.version ?? "transitive"]));
  versions.foottrace = json(join(modules, "foottrace/package.json")).version;
  assert.match(versions.foottrace, /^1\.\d+\.\d+$/);
  const [, readerMinor, readerPatch] = versions.foottrace.split(".").map(Number);
  assert(readerMinor > 0 || readerPatch >= 3, "Foottrace must satisfy the supported ^1.0.3 runtime range");
  if (floor) assert.equal(versions.foottrace, "1.0.3");
  return { versions, installedPackages: names, readerRoots, requestedDependencies: dependencies, strictPeerInstall: true };
}

function verifyArchiveIdentity(unpacked) {
  const paths = walk(unpacked).map((path) => relative(unpacked, path)).sort();
  assert.deepEqual(walk(installed).map((path) => relative(installed, path)).sort(), paths);
  for (const path of paths) {
    assert(readFileSync(join(unpacked, path)).equals(readFileSync(join(installed, path))), `Installed archive differs: ${path}`);
  }
}

function copyFixtures() {
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
  return fixtureHashes;
}

async function verifyRecordConsumer(name, prerequisites, negativeControls) {
  const fixtureHashes = copyFixtures();
  const result = {
    ...prerequisites,
    fixtureHashes,
    producerAndGraphRuntimesAbsent: forbidden,
    runtime: Object.fromEntries(
      ["mjs", "cjs"].map((extension) => [extension, checkRuntime(extension)])
    ),
  };
  for (const [mode, ext] of [
    ["nodenext", "mts"],
    ["nodenext", "cts"],
    ["bundler", "tsx"],
  ])
    checkDeclarations(mode, ext);
  result.declarations = ["NodeNext ESM", "NodeNext CJS", "Bundler"];
  result.skipLibCheck = false;

  result.vendorExcluded = await browserBuild();
  assert(
    result.vendorExcluded.minifiedBytes <= minifiedBudget,
    `Record entry exceeds ${minifiedBudget} minified bytes excluding Foottrace/React`
  );
  result.withFoottrace = await browserBuild({
    includeFoottrace: true,
  });
  result.budgetBytes = minifiedBudget;
  result.conditions = "Actual packed entry; ES2022/browser/ESM/minified/all exports including its transitive chunks; gzip9. First row excludes Foottrace and React; second includes Foottrace and excludes React. Not an application-download or savings claim.";
  evidence.consumers[name] = result;

  for (const name of negativeControls ? forbidden : []) {
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
}

async function verifyCompositeConsumers(prerequisites) {
  const historical = json(join(repo, "test/migration/fixtures/public-exports.json"));
  const modes = {};
  const cacheProbe = join(fixture, "lazy-cache.cjs");
  writeFileSync(cacheProbe, `
const assert = require("node:assert/strict");
const root = require(${JSON.stringify(packageName)});
assert.equal(typeof root.ExplainableShell, "function");
const before = Object.keys(require.cache);
const graphDependency = /[/\\\\]node_modules[/\\\\](?:dagre|@xyflow[/\\\\]react)[/\\\\]/;
assert(!before.some(path => graphDependency.test(path)), "Root import eagerly evaluated a graph peer");
assert(!before.some(path => /[/\\\\]TracedFlow-[^/\\\\]+\\.cjs$/.test(path)), "Root import eagerly evaluated its lazy graph chunk");
const flow = require(${JSON.stringify(`${packageName}/flowchart`)});
assert.equal(typeof flow.TracedFlow, "function");
const after = Object.keys(require.cache);
assert(after.some(path => /[/\\\\]node_modules[/\\\\]dagre[/\\\\]/.test(path)), "Direct graph entry did not evaluate Dagre");
assert(after.some(path => /[/\\\\]node_modules[/\\\\]@xyflow[/\\\\]react[/\\\\]/.test(path)), "Direct graph entry did not evaluate XYFlow");
console.log(JSON.stringify({ before, after, rootDeferredGraph: true, directFlowLoadedGraph: true }));
`);
  const cacheRun = spawnSync(process.execPath, [cacheProbe], { cwd: fixture, env, encoding: "utf8" });
  assert.equal(cacheRun.status, 0, cacheRun.stderr || cacheRun.error?.message);
  evidence.gates.cjsLazyRuntime = JSON.parse(cacheRun.stdout);
  for (const [door, names] of Object.entries(historical.entries)) {
    const specifier = door === "." ? packageName : `${packageName}/flowchart`;
    const source = `import * as lens from ${JSON.stringify(specifier)};\nexport { lens };\n`;
    for (const [mode, extension] of [["nodenext", "mts"], ["nodenext", "cts"], ["bundler", "tsx"]]) {
      checkDeclarations(mode, extension, undefined, source);
    }
    const runtime = {};
    for (const extension of ["mjs", "cjs"]) {
      const path = join(fixture, `composite.${extension}`);
      writeFileSync(path, `${extension === "mjs" ? `import * as lens from ${JSON.stringify(specifier)};` : `const lens = require(${JSON.stringify(specifier)});`}\nconsole.log(JSON.stringify(Object.keys(lens).filter(name => name !== "default").sort()));\n`);
      const run = spawnSync(process.execPath, [path], { cwd: fixture, env, encoding: "utf8" });
      assert.equal(run.status, 0, run.stderr || run.error?.message);
      const actual = JSON.parse(run.stdout);
      assert.deepEqual(actual, names.filter((row) => row.kind === "value").map((row) => row.name).sort(), `${door}/${extension}: runtime export names changed`);
      runtime[extension] = actual;
    }
    // Whole-entry comparison includes all transitively imported chunks. This
    // deliberately is NOT the startup/chunk-request test owned by the browser gate.
    const result = await bundle({
      absWorkingDir: fixture,
      entryPoints: [specifier],
      bundle: true, platform: "browser", format: "esm", target: "es2022",
      minify: true, treeShaking: true, write: false, metafile: true,
      external: ["react", "react-dom", "@xyflow/react", "dagre", "foottrace"],
    });
    const bytes = result.outputFiles[0].contents;
    const baseline = door === "." ? 192_748 : 108_631;
    modes[door] = {
      runtime,
      declarations: ["NodeNext ESM", "NodeNext CJS", "Bundler"],
      skipLibCheck: false,
      wholeEntry: {
        minifiedBytes: bytes.length,
        gzipBytes: gzipSync(bytes, { level: 9 }).length,
        priorM5Bytes: baseline,
        deltaBytes: bytes.length - baseline,
        inputFiles: Object.keys(result.metafile.inputs),
        conditions: "All entry exports and transitive chunks; browser/ESM/ES2022/minified/gzip9; React/ReactDOM/XYFlow/Dagre/Foottrace external. Not startup bytes.",
      },
    };
    assert(bytes.length <= baseline, `${door}: whole-entry bytes grew from ${baseline} to ${bytes.length}; review the measured change before setting a budget`);
  }
  evidence.consumers.composite = { ...prerequisites, entries: modes };
}

try {
  const packed = verifyNormalPackage();
  for (const [name, floor] of [["record-floor", true], ["record-latest", false]]) {
    const prerequisites = installConsumer(packed.tarball, name, { floor });
    verifyArchiveIdentity(packed.unpacked);
    await verifyRecordConsumer(name, prerequisites, floor);
    // Also proves all injected negative controls were restored byte-for-byte.
    verifyArchiveIdentity(packed.unpacked);
  }
  const composite = installConsumer(packed.tarball, "composite", { graph: true, floor: true });
  verifyArchiveIdentity(packed.unpacked);
  await verifyCompositeConsumers(composite);
  verifyArchiveIdentity(packed.unpacked);
  assert.deepEqual(
    sourceDigests(),
    initialSources,
    "Candidate source changed while verification was running; repeat on frozen source"
  );
  evidence.sourceDigests = initialSources;
  writeJSON(join(scratch, "verification.json"), evidence);
  console.log(JSON.stringify(evidence, null, 2));
  if (keep) console.log(`Retained package evidence: ${scratch}`);
  succeeded = true;
} catch (error) {
  evidence.failure = { message: error instanceof Error ? error.message : String(error) };
  writeJSON(join(scratch, "verification.json"), evidence);
  console.error(`Package proof failed; evidence: ${scratch}`);
  throw error;
} finally {
  // Only the directory allocated by this invocation; never dist or caller input.
  if (succeeded && !keep) rmSync(scratch, { recursive: true, force: true });
}
