/** Default theme tokens — consumers override via CSS variables or ThemeProvider. */
export interface ThemeTokens {
    colors?: {
        primary?: string;
        success?: string;
        error?: string;
        warning?: string;
        bgPrimary?: string;
        bgSecondary?: string;
        bgTertiary?: string;
        textPrimary?: string;
        textSecondary?: string;
        textMuted?: string;
        border?: string;
    };
    radius?: string;
    fontFamily?: {
        sans?: string;
        mono?: string;
    };
}
/** Maps ThemeTokens to CSS custom property assignments. */
export declare function tokensToCSSVars(tokens: ThemeTokens): Record<string, string>;
/** Default dark theme values (used as CSS variable fallbacks). */
export declare const defaultTokens: Required<{
    [K in keyof ThemeTokens]-?: Required<ThemeTokens[K]>;
}>;
//# sourceMappingURL=tokens.d.ts.map