import type { BaseComponentProps } from "../../types";
export interface NarrativeTraceProps extends BaseComponentProps {
    /** All narrative lines (full trace) */
    narrative: string[];
    /** Number of lines currently revealed (for progressive reveal). Defaults to all. */
    revealedCount?: number;
    /** Start with all groups collapsed */
    defaultCollapsed?: boolean;
    /** Called when user clicks a stage header */
    onStageClick?: (headerIndex: number) => void;
}
export declare function NarrativeTrace({ narrative, revealedCount, defaultCollapsed, onStageClick, size, unstyled, className, style, }: NarrativeTraceProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=NarrativeTrace.d.ts.map