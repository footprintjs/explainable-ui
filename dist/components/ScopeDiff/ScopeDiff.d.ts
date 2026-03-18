import type { BaseComponentProps } from "../../types";
export interface DiffEntry {
    key: string;
    type: "added" | "removed" | "changed" | "unchanged";
    oldValue?: unknown;
    newValue?: unknown;
}
export interface ScopeDiffProps extends BaseComponentProps {
    /** Memory state before the current stage */
    previous: Record<string, unknown> | null;
    /** Memory state after the current stage */
    current: Record<string, unknown>;
    /** Hide unchanged keys (default: false) */
    hideUnchanged?: boolean;
}
export declare function ScopeDiff({ previous, current, hideUnchanged, size, unstyled, className, style, }: ScopeDiffProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ScopeDiff.d.ts.map