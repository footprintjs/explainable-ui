import type { StageSnapshot, BaseComponentProps } from "../../types";
export interface GanttTimelineProps extends BaseComponentProps {
    /** Stage snapshots with timing info */
    snapshots: StageSnapshot[];
    /** Currently selected stage index */
    selectedIndex?: number;
    /** Callback when a stage bar is clicked */
    onSelect?: (index: number) => void;
    /** Max visible rows before collapsing (0 = no collapse). Default: 5 */
    maxVisibleRows?: number;
}
/**
 * Horizontal Gantt-style timeline showing stage durations and overlap.
 * Collapses to `maxVisibleRows` with expand/collapse toggle.
 * Auto-scrolls to keep the active stage visible when collapsed.
 */
export declare function GanttTimeline({ snapshots, selectedIndex, onSelect, size, unstyled, className, style, maxVisibleRows, }: GanttTimelineProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=GanttTimeline.d.ts.map