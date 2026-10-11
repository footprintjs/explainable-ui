import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { exportSurface } from "./exportSurface";
import ledger from "./fixtures/public-exports.json";
import additions from "./fixtures/record-package-additions.json";

describe("M1 — preserve every existing public home and value/type kind", () => {
  it("keeps all root and flowchart names, including deprecations and duplicate homes", () => {
    expect(
      exportSurface({ ".": "src/index.ts", "./flowchart": "src/flowchart.ts" })
    ).toEqual(ledger.entries);
    expect(ledger.policy).toBe(
      "retain every existing name at every existing door for the first major"
    );
  });

  it("adds exactly the approved record facade without introducing aliases at existing doors", () => {
    const current = exportSurface({
      ".": "src/index.ts",
      "./flowchart": "src/flowchart.ts",
      "./record": "src/record/index.ts",
    });
    expect(current).toEqual({ ...ledger.entries, ...additions.entries });
    const newNames = new Set(additions.entries["./record"].map((row) => row.name));
    for (const oldNames of Object.values(ledger.entries)) {
      expect(oldNames.filter((row) => newNames.has(row.name))).toEqual([]);
    }
  });

  it("prepares only the approved unpublished major package contract", () => {
    const manifest = JSON.parse(
      readFileSync(new URL("../../package.json", import.meta.url), "utf8")
    );
    for (const [key, value] of Object.entries(additions.packageContract)) {
      expect(manifest[key], key).toEqual(value);
    }
    expect(manifest.optionalDependencies).toBeUndefined();
    expect(manifest.devDependencies.dagre).toBe("^0.8.5");
    expect(manifest.devDependencies.foottrace).toBeUndefined();
    // Keep the old manifest and every historical export as evidence, not an
    // expectation silently overwritten to make the major candidate pass.
    expect(ledger.packageContract.version).toBe("0.38.0");
    expect(ledger.packageContract.exports).not.toHaveProperty("./record");
  });

  it("distinguishes a real class export from its type-only alias", () => {
    const actual = exportSurface({
      control: "test/migration/fixtures/export-kinds.ts",
    });
    expect(actual.control).toEqual([
      { name: "RuntimeValue", kind: "value" },
      { name: "Shape", kind: "type" },
      { name: "TypeOnlyValue", kind: "type" },
    ]);
    expect(actual.control).not.toContainEqual({
      name: "TypeOnlyValue",
      kind: "value",
    });
    expect(actual.control).not.toContainEqual({
      name: "MissingExport",
      kind: "value",
    });
  });
});
