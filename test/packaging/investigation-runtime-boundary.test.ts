import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { assertNoFoottraceRuntime } from "../../pilots/record-lens/shipping-boundary.mjs";
const compiled = readFileSync(
  new URL("../../dist/index.js", import.meta.url),
  "utf8"
);
describe("installed runtime boundary admits canonical types but rejects runtime Foottrace", () => {
  it("accepts real compiled output and comments or erased type declarations", () => {
    expect(() => assertNoFoottraceRuntime(compiled)).not.toThrow();
    expect(() =>
      assertNoFoottraceRuntime(
        `${compiled}\n// import {explain} from 'foottrace/cause';\nimport type {CauseResult} from 'foottrace/cause';\nexport type {CauseResult} from 'foottrace/cause';`
      )
    ).not.toThrow();
  });
  it.each([
    "import 'foottrace';",
    "import {explain} from 'foottrace/cause';",
    "export {explain} from 'foottrace/cause';",
    "export * from 'foottrace';",
    "require('foottrace');",
    "module.require('foottrace/cause');",
    "import('foottrace/cause');",
    "require('foot\\x74race/cause');",
    "import('foot\\u0074race');",
    "import {explain} from 'foot\\x74race/cause';",
    "export * from 'foot\\u0074race/cause';",
    "import runtime = require('foottrace/cause');",
  ])(
    "rejects a real compiled input with appended executable reference %s",
    (injected) => {
      expect(() =>
        assertNoFoottraceRuntime(`${compiled}\n${injected}`)
      ).toThrow(/Foottrace runtime dependency/);
    }
  );
});
