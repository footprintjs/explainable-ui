/**
 * useDarkModeTokens — follow the host app's dark mode.
 *
 * The direct answer to "why is your UI dark inside my light app": this
 * library's `--fp-*` fallbacks are dark, so a component with nothing set
 * renders dark. This hook watches the app's own dark-mode switch and hands
 * back the matching preset.
 *
 *   import { FootprintTheme, useDarkModeTokens } from 'footprint-explainable-ui';
 *
 *   function MyApp() {
 *     const tokens = useDarkModeTokens();          // Tailwind's `.dark` on <html>
 *     return (
 *       <FootprintTheme tokens={tokens}>
 *         <ExplainableShell ... />
 *       </FootprintTheme>
 *     );
 *   }
 *
 * Other switches work too — pass whatever your app uses:
 *
 *   useDarkModeTokens({ darkClass: 'theme-dark' })          // a class name
 *   useDarkModeTokens({ darkClass: '[data-theme="dark"]' }) // a CSS selector
 *   useDarkModeTokens({ light: warmLight, dark: warmDark }) // your palettes
 *
 * Server rendering: on the server there is no `document`, so the first render
 * returns the LIGHT tokens and the client corrects on mount. (It used to read
 * `document` inside the `useState` initializer, which is a hard crash in
 * Next.js — a light flash is the honest cost of not knowing yet.)
 */

import { useState, useEffect } from "react";
import type { ThemeTokens } from "./tokens";
import { coolDark } from "./presets";
import { coolLight } from "./presets";

export interface DarkModeTokensOptions {
  /** Tokens to use in light mode. Defaults to coolLight. */
  light?: ThemeTokens;
  /** Tokens to use in dark mode. Defaults to coolDark. */
  dark?: ThemeTokens;
  /**
   * How the app says "dark". A bare CLASS NAME on `<html>` (`'dark'` —
   * Tailwind's convention, the default), or any CSS SELECTOR the root
   * element should match (`'.dark'`, `'[data-theme="dark"]'`, `'#app.night'`).
   * Anything starting with `.`, `[`, `#` or `:` is treated as a selector.
   */
  darkClass?: string;
  /** @deprecated Renamed to `darkClass`. Still read, same meaning. */
  selector?: string;
}

/** A selector, or a bare class name? Both spellings are honoured because the
 *  option was documented as "CSS selector" while the code did
 *  `classList.contains` — so `.dark` and `[data-theme=dark]` silently never
 *  matched, and the UI stayed dark with no way to tell why. */
function isDark(spec: string): boolean {
  if (typeof document === "undefined") return false;
  const root = document.documentElement;
  if (!root) return false;
  if (/^[.[#:]/.test(spec)) {
    try {
      return root.matches(spec);
    } catch {
      // An unparseable selector is a caller typo, not a reason to crash a
      // debugging UI. Fall through to the class reading.
      return root.classList.contains(spec.replace(/^\./, ""));
    }
  }
  return root.classList.contains(spec);
}

export function useDarkModeTokens(options?: DarkModeTokensOptions): ThemeTokens {
  const lightTokens = options?.light ?? coolLight;
  const darkTokens = options?.dark ?? coolDark;
  const spec = options?.darkClass ?? options?.selector ?? "dark";

  // No `document` read during render: on the server there is none, and
  // reading one here is the Next.js crash this hook used to cause.
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (!root) return;
    // Sync on mount — the switch may already be set (and after SSR our state
    // says "light" regardless).
    setIsDarkMode(isDark(spec));
    const obs = new MutationObserver(() => setIsDarkMode(isDark(spec)));
    // Not filtered to `class`: a `[data-theme]` switch is just as common, and
    // this observes ONE element's attributes.
    obs.observe(root, { attributes: true });
    return () => obs.disconnect();
  }, [spec]);

  return isDarkMode ? darkTokens : lightTokens;
}
