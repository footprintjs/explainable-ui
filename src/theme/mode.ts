/**
 * The one-word theme switch.
 *
 * Every component in this library paints from `--fp-*` variables whose
 * built-in fallbacks are DARK. Mounted inside a light app with nothing set,
 * a panel renders dark — correct by the rules, wrong on the page. Setting a
 * dozen variables by hand to fix that is not a first-try experience.
 *
 * `<Component theme="light" />` is that fix in one word: it stamps a full
 * preset as inline `--fp-*` variables on the component's own root, so
 * everything under it — including nested children — follows. It is the same
 * mechanism `<ExplainableShell traceTheme={{ mode }}>` uses; this module is
 * the single place that maps a mode to its palette.
 *
 * Precedence, from weakest to strongest:
 *   1. the components' hard-coded fallbacks (dark)
 *   2. `--fp-*` an ancestor sets (`<FootprintTheme>`, your own CSS)
 *   3. `theme="light" | "dark"` on the component  ← wins, because it is local
 *
 * So `theme` is a per-component override, not a replacement for
 * `<FootprintTheme tokens={...}>` — reach for the provider when you want one
 * palette for a whole tree, and for a custom palette rather than a preset.
 */
import type { CSSProperties } from "react";
import { tokensToCSSVars } from "./tokens";
import { coolDark, coolLight } from "./presets";

/** Light or dark. The whole switch. */
export type ThemeMode = "dark" | "light";

/** Props mixin for components that accept the switch. */
export interface ThemeModeProps {
  /**
   * Light or dark, in one word — applies the built-in preset as `--fp-*`
   * variables on this component's root. Omit to inherit whatever the page
   * (or a `<FootprintTheme>` ancestor) already set.
   */
  theme?: ThemeMode;
}

/**
 * CSS variables for a mode, ready to spread into a root element's `style`.
 * Returns `{}` for `undefined` so an unthemed component is byte-identical to
 * how it rendered before the prop existed.
 */
export function themeModeVars(mode?: ThemeMode): CSSProperties {
  if (!mode) return {};
  return tokensToCSSVars(mode === "light" ? coolLight : coolDark) as CSSProperties;
}
