import type { ThemeTokens } from "./tokens";
/** Cool dark theme (the library default) */
export declare const coolDark: ThemeTokens;
/** Warm dark theme — charcoal-purple palette */
export declare const warmDark: ThemeTokens;
/** Warm light theme — cream/peach palette */
export declare const warmLight: ThemeTokens;
/** All built-in theme presets */
export declare const themePresets: {
    readonly coolDark: ThemeTokens;
    readonly warmDark: ThemeTokens;
    readonly warmLight: ThemeTokens;
};
export type ThemePresetName = keyof typeof themePresets;
//# sourceMappingURL=presets.d.ts.map