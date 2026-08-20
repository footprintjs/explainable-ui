/**
 * Every export a consumer can CALL must be named in a README table.
 *
 * This gate exists because the `/flowchart` entry quietly grew to ~50
 * public exports while the README documented ten of them. Nobody was
 * lying: each export was added deliberately, with a comment in the
 * barrel — but a comment in `src/flowchart.ts` is not documentation a
 * consumer ever reads, and nothing made the omission visible. An audit
 * had to count by hand to find it.
 *
 * So the count is a test now. Add an export, and this fails until either
 * the README names it or you write down — here, with a reason — why it
 * is deliberately undocumented.
 *
 * WHAT IT CHECKS: value exports (components, hooks, functions,
 * constants) — the things a consumer imports and calls. Type-only
 * exports are excluded: `TracedFlowProps` is documented BY `TracedFlow`
 * (you reach it through the component, and your editor prints its
 * fields), so a row per props type would be noise that buys no truth.
 *
 * WHAT COUNTS AS DOCUMENTED: the name appears, in backticks, in a README
 * TABLE ROW (a line starting with `|`). Prose is not enough — a name a
 * reader can only find by reading every paragraph is not a reference.
 * A row may spell the name as a call (`graphFromStructure(saved)`); the
 * identifiers inside the backticks are what count.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(__dirname, "..", "..");
const README = readFileSync(join(root, "README.md"), "utf-8");

const ENTRIES = [
  { name: "footprint-explainable-ui", file: "src/index.ts" },
  { name: "footprint-explainable-ui/flowchart", file: "src/flowchart.ts" },
] as const;

/**
 * Exports that are deliberately absent from the README tables. Each one
 * needs a reason a reader would accept — "it's obvious" is not one.
 * Keep this list SHORT: it is the escape hatch, not the filing cabinet.
 */
const DOCUMENTED_IN_CODE: Record<string, string> = {
  // Branded-id taggers. Only meaningful when you are writing your own
  // translator against the key discipline in `_internal/keys.ts`, which
  // is where their whole explanation lives.
  asStageId: "translator-authoring helper; explained in _internal/keys.ts",
  asRuntimeStageId: "translator-authoring helper; explained in _internal/keys.ts",
};

/** Strip `//` line comments so a commented-out name never counts. */
function stripLineComments(source: string): string {
  return source.replace(/^\s*\/\/.*$/gm, "");
}

/**
 * Value exports of a barrel: `export { a, b as c }` (but never
 * `export type { … }`, and never a `type x` member inside a value block).
 */
function valueExportsOf(file: string): string[] {
  const source = stripLineComments(readFileSync(join(root, file), "utf-8"));
  const names: string[] = [];
  for (const match of source.matchAll(/export\s+(type\s+)?\{([^}]*)\}/g)) {
    if (match[1]) continue; // `export type { … }` — types are out of scope
    for (const raw of match[2].split(",")) {
      const part = raw.trim();
      if (!part || part.startsWith("type ")) continue;
      // `X as Y` publishes Y — that is the name a consumer imports.
      const published = part.split(/\s+as\s+/).pop();
      if (published) names.push(published.trim());
    }
  }
  for (const match of source.matchAll(/export\s+(?:const|function|class)\s+([A-Za-z_$][\w$]*)/g)) {
    names.push(match[1]);
  }
  return [...new Set(names)];
}

/** Every identifier that appears inside backticks in a README table row. */
function namesInReadmeTables(): Set<string> {
  const documented = new Set<string>();
  for (const line of README.split("\n")) {
    if (!line.trimStart().startsWith("|")) continue;
    for (const code of line.matchAll(/`([^`]+)`/g)) {
      for (const ident of code[1].matchAll(/[A-Za-z_$][\w$]*/g)) {
        documented.add(ident[0]);
      }
    }
  }
  return documented;
}

describe("every callable export is named in a README table", () => {
  const documented = namesInReadmeTables();

  for (const entry of ENTRIES) {
    it(`${entry.name} (${entry.file})`, () => {
      const undocumented = valueExportsOf(entry.file).filter(
        (name) => !documented.has(name) && !(name in DOCUMENTED_IN_CODE),
      );
      expect(
        undocumented,
        `these exports of "${entry.name}" appear in no README table. A consumer ` +
          `cannot find them without reading the barrel. Add a row for each — or ` +
          `add it to DOCUMENTED_IN_CODE in this file with a reason.`,
      ).toEqual([]);
    });
  }

  it("the allowlist stays honest — every entry still exists and carries a reason", () => {
    const exported = new Set(ENTRIES.flatMap((e) => valueExportsOf(e.file)));
    for (const [name, reason] of Object.entries(DOCUMENTED_IN_CODE)) {
      expect(exported.has(name), `${name} is allowlisted but no longer exported`).toBe(true);
      expect(reason.length, `${name} needs a real reason`).toBeGreaterThan(20);
    }
  });

  it("the gate can actually fail — a name nobody documented is reported", () => {
    // Guards the parser itself: if `valueExportsOf` or the README scan
    // silently returned nothing, every assertion above would pass on an
    // empty set and this gate would be decorative.
    expect(valueExportsOf("src/flowchart.ts").length).toBeGreaterThan(40);
    expect(valueExportsOf("src/index.ts").length).toBeGreaterThan(40);
    expect(documented.has("ExplainableShell")).toBe(true);
    expect(documented.has("ThisWasNeverExported")).toBe(false);
  });
});
