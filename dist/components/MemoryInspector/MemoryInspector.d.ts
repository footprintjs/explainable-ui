import type { StageSnapshot, BaseComponentProps } from "../../types";
export interface MemoryInspectorProps extends BaseComponentProps {
    /** Single memory object or snapshots (will accumulate up to selectedIndex) */
    data?: Record<string, unknown>;
    /** When using snapshots mode, pass these instead of data */
    snapshots?: StageSnapshot[];
    /** Index to accumulate up to (for time-travel) */
    selectedIndex?: number;
    /** Show data types alongside values */
    showTypes?: boolean;
    /** Highlight keys that are new at this step */
    highlightNew?: boolean;
}
/**
 * Displays pipeline memory state as formatted JSON.
 * Supports both static (data prop) and time-travel (snapshots + selectedIndex) modes.
 */
export declare function MemoryInspector({ data, snapshots, selectedIndex, showTypes, highlightNew, size, unstyled, className, style, }: MemoryInspectorProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=MemoryInspector.d.ts.map