import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { assertCandidateManifest, forbiddenRecordPackages, installedPackages, sourceContents } from "./package-contract.mjs";

const approved = JSON.parse(readFileSync(new URL("../../test/migration/fixtures/record-package-additions.json", import.meta.url))).packageContract;
const manifest = () => ({
  ...structuredClone(approved),
  main: "./dist/index.cjs", module: "./dist/index.js", types: "./dist/index.d.ts",
  devDependencies: { dagre: "^0.8.5" },
});

test("the actual approved candidate contract is admitted", () => assertCandidateManifest(manifest(), approved));
for (const name of ["@xyflow/react", "dagre", "react-dom"]) {
  test(`removing optional peer metadata for ${name} is rejected`, () => {
    const value = manifest();
    delete value.peerDependenciesMeta[name];
    assert.throws(() => assertCandidateManifest(value, approved), /peerDependenciesMeta/);
  });
}
test("optionalDependencies cannot masquerade as optional peers", () => {
  assert.throws(() => assertCandidateManifest({ ...manifest(), optionalDependencies: { dagre: "^0.8.5" } }, approved));
});
test("a root alias for the new record facade is rejected", () => {
  const value = manifest();
  value.exports["./record-alias"] = value.exports["./record"];
  assert.throws(() => assertCandidateManifest(value, approved), /exports/);
});
test("Foottrace remains required at the fixed supported floor", () => {
  const value = manifest();
  value.dependencies.foottrace = "^1.0.0";
  assert.throws(() => assertCandidateManifest(value, approved), /dependencies/);
});
test("React remains a required peer", () => {
  const value = manifest();
  value.peerDependenciesMeta.react = { optional: true };
  assert.throws(() => assertCandidateManifest(value, approved), /peerDependenciesMeta/);
});
test("normal absent optional peers are not reported as installed", () => {
  assert.deepEqual(installedPackages({ dependencies: { react: { version: "19.2.5", dependencies: { "react-dom": {} } } } }, true), ["react"]);
});
for (const name of forbiddenRecordPackages) {
  test(`the installation gate rejects transitive ${name}`, () => {
    const tree = { dependencies: { foottrace: { version: "1.0.3", dependencies: { [name]: { version: "1.0.0" } } } } };
    assert.throws(() => installedPackages(tree, true), /Unexpected installed package/);
  });
}
test("an unlisted runtime is rejected too, not just known forbidden names", () => {
  assert.throws(() => installedPackages({ dependencies: { accidental: { version: "1.0.0" } } }, true), /Unexpected installed package/);
});
test("an npm dependency problem cannot be relabelled as a successful install", () => {
  assert.throws(() => installedPackages({ dependencies: { react: { version: "19.2.5", problems: ["invalid"] } } }, true));
});
test("a source-free Rollup forwarder has a valid empty map", () => {
  assert.deepEqual(sourceContents({ sources: [], mappings: "", file: "TracedFlow-ABC123.cjs" }, "TracedFlow-ABC123.cjs.map"), []);
});
test("a nonempty map may not omit its original source contents", () => {
  assert.throws(() => sourceContents({ sources: ["../src/view.tsx"], mappings: "AAAA" }, "TracedFlow-ABC123.cjs.map"));
});
test("an empty source list does not excuse mappings or an unrelated entry", () => {
  assert.throws(() => sourceContents({ sources: [], mappings: "AAAA" }, "TracedFlow-ABC123.cjs.map"));
  assert.throws(() => sourceContents({ sources: [], mappings: "" }, "index.cjs.map"));
});
test("absolute local source paths are rejected, even with embedded contents", () => {
  for (const path of ["/private/local/dist/view.cjs", "C:\\local\\view.cjs", "file:///private/view.cjs"]) {
    assert.throws(() => sourceContents({ sources: [path], sourcesContent: ["export {}"], mappings: "AAAA" }, "index.cjs.map"), /Absolute source-map path/);
  }
});
test("ordinary relative source maps retain the complete original contents", () => {
  assert.deepEqual(sourceContents({ sources: ["../src/index.ts"], sourcesContent: ["export {}"], mappings: "AAAA" }, "index.js.map"), ["export {}"]);
});
