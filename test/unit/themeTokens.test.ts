/**
 * Theme-token coverage — the drift catcher.
 *
 * A component can only be themed through variables the theme actually
 * EMITS. When a component reads `var(--fp-accent, #6366f1)` and
 * `tokensToCSSVars` never writes `--fp-accent`, that component is frozen at
 * its hard-coded fallback forever — which is how `traceTheme={{mode:'light'}}`
 * used to leave dark patches (an indigo tab rule and a #1a1b26 panel body)
 * in an otherwise light shell.
 *
 * So this test doesn't hand-list tokens: it GREPS the source for every
 * `--fp-*` read and asserts each one has an emitter and a value in every
 * preset. Add a component that reads a new token and this fails until the
 * token is threaded through ThemeTokens → tokensToCSSVars → all presets.
 */

import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { tokensToCSSVars, rawDefaults, defaultTokens } from "../../src/theme/tokens";
import { themePresets } from "../../src/theme/presets";

const SRC = fileURLToPath(new URL("../../src", import.meta.url));

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.tsx?$/.test(name) ? [full] : [];
  });
}

/** Every `--fp-*` variable the source READS via `var(--fp-…)`. */
function readTokens(): Map<string, string[]> {
  const found = new Map<string, string[]>();
  for (const file of sourceFiles(SRC)) {
    const text = readFileSync(file, "utf8");
    for (const match of text.matchAll(/var\(\s*(--fp-[a-zA-Z0-9-]+)/g)) {
      const name = match[1]!;
      const where = found.get(name);
      const rel = file.slice(SRC.length + 1);
      if (where) {
        if (!where.includes(rel)) where.push(rel);
      } else {
        found.set(name, [rel]);
      }
    }
  }
  return found;
}

describe("theme tokens — every variable the components read is themeable", () => {
  const reads = readTokens();

  it("the grep found the tokens (guards against a silently empty scan)", () => {
    expect(reads.size).toBeGreaterThan(15);
    expect([...reads.keys()]).toContain("--fp-accent");
  });

  for (const [presetName, preset] of Object.entries(themePresets)) {
    it(`preset ${presetName} emits every --fp-* the source reads`, () => {
      const emitted = new Set(Object.keys(tokensToCSSVars(preset)));
      const missing = [...reads.entries()]
        .filter(([name]) => !emitted.has(name))
        .map(([name, files]) => `${name} (read in ${files.join(", ")})`);
      expect(missing, `preset '${presetName}' leaves these unthemed`).toEqual([]);
    });

    it(`preset ${presetName} gives every emitted token a real value`, () => {
      for (const [name, value] of Object.entries(tokensToCSSVars(preset))) {
        expect(value, `${presetName}.${name}`).toMatch(/\S/);
        // A preset value must be a colour/size, never a var() indirection —
        // that would re-open the fallback hole this test exists to close.
        expect(value, `${presetName}.${name}`).not.toContain("var(");
      }
    });
  }

  it("light mode carries no dark leftovers: the light and dark presets differ on every surface", () => {
    const light = tokensToCSSVars(themePresets.coolLight);
    const dark = tokensToCSSVars(themePresets.coolDark);
    for (const surface of [
      "--fp-bg",
      "--fp-bg-primary",
      "--fp-bg-secondary",
      "--fp-bg-tertiary",
      "--fp-bg-elevated",
      "--fp-text-primary",
    ]) {
      expect(light[surface], surface).toBeDefined();
      expect(light[surface], `${surface} is identical in light and dark`).not.toBe(dark[surface]);
    }
  });

  it("--fp-accent falls back to primary when a consumer sets only primary", () => {
    const vars = tokensToCSSVars({ colors: { primary: "#ff0000" } });
    expect(vars["--fp-accent"]).toBe("#ff0000");
    expect(vars["--fp-color-primary"]).toBe("#ff0000");
  });

  it("--fp-success and --fp-color-success are one token, two spellings", () => {
    const vars = tokensToCSSVars({ colors: { success: "#00ff00" } });
    expect(vars["--fp-success"]).toBe("#00ff00");
    expect(vars["--fp-color-success"]).toBe("#00ff00");
  });

  it("an empty token set emits nothing (unthemed consumers keep their fallbacks)", () => {
    expect(tokensToCSSVars({})).toEqual({});
    expect(tokensToCSSVars({ colors: {} })).toEqual({});
  });

  // ── The other half of the drift: colours that never reach a variable ────
  //
  // The grep above can only see colours a component asks the theme for.
  // A hard-coded `#22c55e` asks nobody — it is invisible to that check and
  // unthemeable forever, which is how the diff badges (ADD/UPD/DEL) stayed
  // green/amber/red in a light theme that had re-coloured everything around
  // them. So: every colour literal in component source must sit inside a
  // `var(--fp-…, fallback)` chain, or be one of the constants below.

  /**
   * Colours that are NOT theme surfaces. Each is a readability constant
   * painted ON an already-themed colour, so re-theming it would break the
   * contrast it exists to guarantee. Anything else belongs in a token.
   */
  const ALLOWED_CONSTANTS = new Map<string, string>([
    ["#fff", "text/icon ON a themed fill — the contrast colour, not a surface"],
    ["#ffffff", "text/icon ON a themed fill — the contrast colour, not a surface"],
    ["#1a1a1a", "dark text ON a light themed fill (the amber cursor node)"],
    ["#94a3b8", "the not-yet-run node's neutral, chosen per traceTheme.mode"],
    ["#64748b", "the not-yet-run node's neutral, chosen per traceTheme.mode"],
  ]);
  /** Shadows are black-with-alpha by definition; they carry no hue to theme. */
  const isShadowBlack = (literal: string): boolean => /^rgba\(\s*0\s*,\s*0\s*,\s*0\s*,/.test(literal);

  const COLOR_LITERAL = /#[0-9a-fA-F]{3,8}\b|rgba?\([\d\s.,]+\)/g;

  /** Strip line and block comments — prose mentions colours all the time. */
  function stripComments(text: string): string {
    return text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
  }

  it("no component paints a colour the theme cannot reach", () => {
    const offenders: string[] = [];
    for (const file of sourceFiles(SRC)) {
      const rel = file.slice(SRC.length + 1);
      if (rel.startsWith("theme/")) continue; // the palettes themselves
      for (const line of stripComments(readFileSync(file, "utf8")).split("\n")) {
        for (const match of line.matchAll(COLOR_LITERAL)) {
          const literal = match[0];
          // `&#9660;` is an arrow, not a colour.
          if (line[match.index - 1] === "&") continue;
          if (ALLOWED_CONSTANTS.has(literal.toLowerCase())) continue;
          if (isShadowBlack(literal)) continue;
          // A literal INSIDE a variable chain is that variable's FALLBACK, so
          // the colour is themeable — which is the whole point of the chain.
          // Both spellings count: raw `var(--fp-…, x)` and the `v()` helper.
          const chainAt = Math.max(
            line.lastIndexOf("var(--fp-", match.index),
            line.lastIndexOf('v("--fp-', match.index),
          );
          if (chainAt >= 0 && line.indexOf(")", chainAt) > match.index) continue;
          offenders.push(`${rel}: ${literal.trim()}  in  ${line.trim()}`);
        }
      }
    }
    expect(
      offenders,
      "hard-coded colours: route them through `theme.*` / `v('--fp-…')`, or add a documented constant",
    ).toEqual([]);
  });

  it("the literal scan actually reads the source (guards a silently empty scan)", () => {
    // A regex or path change that made the scan see nothing would make the
    // test above pass forever. Prove it still matches real code.
    const stageNode = readFileSync(join(SRC, "components/StageNode/StageNode.tsx"), "utf8");
    expect([...stripComments(stageNode).matchAll(COLOR_LITERAL)].length).toBeGreaterThan(0);
  });

  it("raw defaults and the var-chain defaults cover the same roles", () => {
    expect(Object.keys(defaultTokens.colors).sort()).toEqual(
      Object.keys(rawDefaults.colors).sort(),
    );
    for (const [role, chain] of Object.entries(defaultTokens.colors)) {
      const raw = (rawDefaults.colors as Record<string, string>)[role]!;
      expect(chain, role).toContain(raw); // every chain ends in its raw fallback
    }
  });

  it("every categorical chip hue is themeable, not baked into the card", () => {
    for (const [name, preset] of Object.entries(themePresets)) {
      const vars = tokensToCSSVars(preset);
      for (const n of [1, 2, 3, 4]) {
        expect(vars[`--fp-chip-${n}`], `${name} chip ${n}`).toBeTruthy();
      }
    }
  });

  it("--fp-bg-elevated is emitted even though only downstream shells read it", () => {
    // agentfootprint-lens builds its elevated surfaces off this variable via
    // eui's chain; a preset without it silently pins lens to eui's dark raw
    // default in a light app.
    for (const [name, preset] of Object.entries(themePresets)) {
      expect(tokensToCSSVars(preset)["--fp-bg-elevated"], name).toBeTruthy();
    }
  });
});
