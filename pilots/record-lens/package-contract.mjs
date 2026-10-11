import assert from "node:assert/strict";
import { isAbsolute } from "node:path";

export const forbiddenRecordPackages = [
  "footprintjs", "agentfootprint", "@xyflow/react", "dagre", "react-dom",
  "hcifootprint", "vizfootprint",
];

/** Test-only package contract. Optional peers are not optionalDependencies. */
export function assertCandidateManifest(manifest, approved) {
  for (const [key, value] of Object.entries(approved)) {
    assert.deepEqual(manifest[key], value, `Unreviewed package contract: ${key}`);
  }
  assert.deepEqual(
    [manifest.main, manifest.module, manifest.types],
    ["./dist/index.cjs", "./dist/index.js", "./dist/index.d.ts"],
  );
  assert.equal(manifest.optionalDependencies, undefined);
  assert.equal(manifest.devDependencies.dagre, "^0.8.5");
  assert.equal(manifest.devDependencies.foottrace, undefined);
}

/** Inspect npm's complete tree, including transitive and nested dependencies. */
export function installedPackages(tree, recordOnly) {
  const names = new Set();
  const allowed = new Set([
    "footprint-explainable-ui", "foottrace", "react", "@types/react", "csstype",
  ]);
  function inspect(node) {
    assert.equal(node.problems, undefined, JSON.stringify(node.problems));
    for (const [name, child] of Object.entries(node.dependencies ?? {})) {
      // An absent optional peer is reported as {}, not an installed package.
      if (!child.version) continue;
      if (recordOnly) assert(allowed.has(name), `Unexpected installed package: ${name}`);
      names.add(name);
      inspect(child);
    }
  }
  inspect(tree);
  return [...names].sort();
}

/** Source-free Rollup forwarders have valid empty maps, not missing originals. */
export function sourceContents(map, filename) {
  assert(Array.isArray(map.sources), `Missing source list: ${filename}`);
  assert.equal(map.sourceRoot ?? "", "", `Unexpected map sourceRoot: ${filename}`);
  if (map.file !== undefined) assert.equal(map.file, filename.replace(/\.map$/, ""));
  for (const source of map.sources) {
    assert(typeof source === "string" && !isAbsolute(source) && !/^(?:[a-z]:[\\/]|file:)/i.test(source), `Absolute source-map path: ${source}`);
  }
  if (map.sourcesContent === undefined) {
    assert.match(filename, /^TracedFlow-[a-z0-9]+\.(?:cjs|js)\.map$/i);
    assert.deepEqual(map.sources, [], `Missing source contents: ${filename}`);
    assert.equal(map.mappings, "", `Missing mapped source contents: ${filename}`);
    return [];
  }
  assert(Array.isArray(map.sourcesContent), `Invalid source contents: ${filename}`);
  assert.equal(map.sources.length, map.sourcesContent.length);
  return map.sourcesContent;
}
