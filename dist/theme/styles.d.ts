import type { Size } from "../types";
/**
 * Helper to resolve a CSS variable with a fallback.
 * Usage: v("--fp-color-primary", "#6366f1")
 */
export declare function v(varName: string, fallback: string): string;
/** Shorthand for common theme variables */
export declare const theme: {
    readonly primary: string;
    readonly success: string;
    readonly error: string;
    readonly warning: string;
    readonly bgPrimary: string;
    readonly bgSecondary: string;
    readonly bgTertiary: string;
    readonly textPrimary: string;
    readonly textSecondary: string;
    readonly textMuted: string;
    readonly border: string;
    readonly radius: string;
    readonly fontSans: string;
    readonly fontMono: string;
};
/** Font sizes per size variant */
export declare const fontSize: Record<Size, {
    label: number;
    body: number;
    small: number;
}>;
/** Padding per size variant */
export declare const padding: Record<Size, number>;
//# sourceMappingURL=styles.d.ts.map