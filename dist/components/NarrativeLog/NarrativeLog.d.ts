import type { StageSnapshot, BaseComponentProps } from "../../types";
export interface NarrativeLogProps extends BaseComponentProps {
    /** Snapshots to display narratives from */
    snapshots: StageSnapshot[];
    /** Show narratives up to this index (for time-travel sync) */
    selectedIndex?: number;
    /** Show a single narrative string (simple mode) */
    narrative?: string;
}
/**
 * Timeline-style execution log showing what happened at each stage.
 * Supports both full snapshots mode and single-narrative mode.
 */
export declare function NarrativeLog({ snapshots, selectedIndex, narrative, size, unstyled, className, style, }: NarrativeLogProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=NarrativeLog.d.ts.map