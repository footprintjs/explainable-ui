import type { ThemeTokens } from "./tokens";
export declare function useFootprintTheme(): ThemeTokens;
interface FootprintThemeProps {
    tokens?: ThemeTokens;
    children: React.ReactNode;
}
/**
 * Optional theme provider — wraps children with CSS custom properties.
 * Consumers can also just set --fp-* CSS variables directly.
 */
export declare function FootprintTheme({ tokens, children }: FootprintThemeProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=ThemeProvider.d.ts.map