/**
 * useDarkModeTokens — Auto-bridge between CSS class-based dark mode and FootprintTheme.
 *
 * Watches for a `.dark` class on <html> (Tailwind convention) and returns
 * the appropriate ThemeTokens preset. Pairs with FootprintTheme:
 *
 *   import { FootprintTheme, useDarkModeTokens } from 'footprint-explainable-ui';
 *
 *   function MyApp() {
 *     const tokens = useDarkModeTokens();
 *     return (
 *       <FootprintTheme tokens={tokens}>
 *         <NarrativeTrace ... />
 *       </FootprintTheme>
 *     );
 *   }
 *
 * Consumers can override the light/dark presets:
 *
 *   const tokens = useDarkModeTokens({ light: warmLight, dark: warmDark });
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
  /** CSS selector to watch for dark mode. Defaults to checking .dark on documentElement. */
  selector?: string;
}

export function useDarkModeTokens(options?: DarkModeTokensOptions): ThemeTokens {
  const lightTokens = options?.light ?? coolLight;
  const darkTokens = options?.dark ?? coolDark;

  const [isDark, setIsDark] = useState(
    () => document.documentElement.classList.contains(options?.selector ?? "dark"),
  );

  useEffect(() => {
    const cls = options?.selector ?? "dark";
    const obs = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains(cls));
    });
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => obs.disconnect();
  }, [options?.selector]);

  return isDark ? darkTokens : lightTokens;
}
