import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext } from "react";
import { tokensToCSSVars } from "./tokens";
const ThemeContext = createContext({});
export function useFootprintTheme() {
    return useContext(ThemeContext);
}
/**
 * Optional theme provider — wraps children with CSS custom properties.
 * Consumers can also just set --fp-* CSS variables directly.
 */
export function FootprintTheme({ tokens = {}, children }) {
    const cssVars = tokensToCSSVars(tokens);
    return (_jsx(ThemeContext.Provider, { value: tokens, children: _jsx("div", { style: cssVars, className: "fp-theme-root", children: children }) }));
}
//# sourceMappingURL=ThemeProvider.js.map