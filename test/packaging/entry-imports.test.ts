/**
 * Every bare import the BUILT entry points make must be declared in
 * package.json, or a bare `npm install` of this package crashes at first
 * import.
 *
 * This gate exists because exactly that shipped: the root bundle statically
 * imported `@xyflow/react` on every published version back to at least
 * 0.29.0, while the manifest declared no version range for it at all (it sat
 * only in `peerDependenciesMeta` as "optional", and devDependencies do not
 * publish). Nobody saw it because every real consumer already had xyflow
 * through another path — and no test loaded the built entries. attw and
 * publint check types and paths, not runtime peer isolation, so they stayed
 * green too.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(__dirname, "..", "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf-8"));

const declared = new Set([
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.peerDependencies ?? {}),
]);

/** A specifier's package name: `@scope/name/deep` → `@scope/name`, `name/deep` → `name`. */
function packageOf(specifier: string): string {
  const parts = specifier.split("/");
  return specifier.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
}

const ENTRIES = ["dist/index.js", "dist/index.cjs", "dist/flowchart.js", "dist/flowchart.cjs"];

// ESM `from "x"` / `import("x")` and CJS `require("x")` in the built output.
// The specifier itself must LOOK like a package path — minified bundles are
// full of strings that happen to follow the words `from` or `import(`.
const SPECIFIER = /(?:from\s*|import\s*\(\s*|require\s*\(\s*)["']([^"'\s]+)["']/g;
const PACKAGE_SHAPE = /^(@[a-z0-9~][\w.-]*\/)?[a-z0-9~][\w.-]*(\/[\w.-]+)*$/i;

describe("built entry points only import what the manifest declares", () => {
  for (const entry of ENTRIES) {
    it(`${entry} has no undeclared bare imports`, () => {
      const source = readFileSync(join(root, entry), "utf-8");
      const bare = new Set<string>();
      for (const match of source.matchAll(SPECIFIER)) {
        if (match[1].startsWith(".") || !PACKAGE_SHAPE.test(match[1])) continue;
        const name = packageOf(match[1]);
        if (name.startsWith("node:")) continue;
        if (name === "react" || declared.has(name)) continue;
        // react-dom deep paths (react-dom/client) belong to a declared peer.
        bare.add(name);
      }
      expect(
        [...bare],
        `${entry} imports packages the manifest never declares — a bare install of ` +
          `this package crashes on these. Declare each as a dependency or peerDependency.`,
      ).toEqual([]);
    });
  }

  it("the mistake this gate was written for stays fixed: @xyflow/react has a declared range", () => {
    expect(pkg.peerDependencies["@xyflow/react"], "root bundle statically imports it").toMatch(/\^/);
    // "optional" was the old lie — the root entry hard-requires it.
    expect(pkg.peerDependenciesMeta?.["@xyflow/react"]?.optional).not.toBe(true);
  });
});
