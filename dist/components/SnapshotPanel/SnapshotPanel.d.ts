import type { StageSnapshot, BaseComponentProps } from "../../types";
export interface SnapshotPanelProps extends BaseComponentProps {
    /** Stage snapshots from pipeline execution */
    snapshots: StageSnapshot[];
    /** Show the Gantt timeline */
    showGantt?: boolean;
    /** Show the time-travel scrubber */
    showScrubber?: boolean;
    /** Title override */
    title?: string;
}
/**
 * All-in-one panel: time-travel scrubber + memory inspector + narrative log + gantt.
 * Drop this into any page to make a pipeline run inspectable.
 */
export declare function SnapshotPanel({ snapshots, showGantt, showScrubber, title, size, unstyled, className, style, }: SnapshotPanelProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=SnapshotPanel.d.ts.map