import { createContext, useContext } from "react";
import type { ThemeTokens } from "./tokens";
import { tokensToCSSVars } from "./tokens";

const ThemeContext = createContext<ThemeTokens>({});

export function useFootprintTheme(): ThemeTokens {
  return useContext(ThemeContext);
}

interface FootprintThemeProps {
  tokens?: ThemeTokens;
  children: React.ReactNode;
}

/**
 * Optional theme provider — wraps children with CSS custom properties.
 * Consumers can also just set --fp-* CSS variables directly.
 */
export function FootprintTheme({ tokens = {}, children }: FootprintThemeProps) {
  const cssVars = tokensToCSSVars(tokens);

  return (
    <ThemeContext.Provider value={tokens}>
      <div style={cssVars as React.CSSProperties} className="fp-theme-root">
        {children}
      </div>
    </ThemeContext.Provider>
  );
}
