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
 *
 * Wrapper div uses `display: contents` so it's invisible to the
 * parent's layout (flex / grid / block). This matters because themed
 * children often need to fill a parent (flex:1 / height:100% /
 * grid cells), and a regular block `<div>` here would break that
 * chain — descendants would resolve to 0 height when the parent is
 * flex-column or a grid cell with minmax(0, 1fr). `display: contents`
 * removes the box from the render tree while keeping the DOM intact,
 * so CSS custom property inheritance (which follows the DOM) still
 * flows to children.
 *
 * Trade-off: `display: contents` elements are removed from the
 * accessibility tree in some older browser versions. Our wrapper has
 * no semantic role, so this is fine.
 */
export function FootprintTheme({ tokens = {}, children }: FootprintThemeProps) {
  const cssVars = tokensToCSSVars(tokens);

  return (
    <ThemeContext.Provider value={tokens}>
      <div
        style={{ ...(cssVars as React.CSSProperties), display: "contents" }}
        className="fp-theme-root"
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}
