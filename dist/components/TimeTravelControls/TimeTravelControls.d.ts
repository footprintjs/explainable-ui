import type { StageSnapshot, BaseComponentProps } from "../../types";
export interface TimeTravelControlsProps extends BaseComponentProps {
    /** Stage snapshots */
    snapshots: StageSnapshot[];
    /** Currently selected stage index */
    selectedIndex: number;
    /** Callback when selected index changes */
    onIndexChange: (index: number) => void;
    /** Enable auto-play with Gantt-proportional timing */
    autoPlayable?: boolean;
}
export declare function TimeTravelControls({ snapshots, selectedIndex, onIndexChange, autoPlayable, size, unstyled, className, style, }: TimeTravelControlsProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=TimeTravelControls.d.ts.map