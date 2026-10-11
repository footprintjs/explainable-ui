import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { exportSurface } from "./exportSurface";
import ledger from "./fixtures/public-exports.json";

describe("M1 — preserve every existing public home and value/type kind", () => {
  it("keeps all root and flowchart names, including deprecations and duplicate homes", () => {
    expect(
      exportSurface({ ".": "src/index.ts", "./flowchart": "src/flowchart.ts" })
    ).toEqual(ledger.entries);
    expect(ledger.policy).toBe(
      "retain every existing name at every existing door for the first major"
    );
  });

  it("keeps the source pilot unpublished and the current consumer contract unchanged", () => {
    const manifest = JSON.parse(
      readFileSync(new URL("../../package.json", import.meta.url), "utf8")
    );
    for (const [key, value] of Object.entries(ledger.packageContract)) {
      expect(manifest[key], key).toEqual(value);
    }
    expect(manifest.exports).not.toHaveProperty("./record");
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
