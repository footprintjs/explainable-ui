import type { StageSnapshot, BaseComponentProps } from "../../types";
export type ShellTab = "result" | "explainable" | "ai-compatible";
export interface ExplainableShellProps extends BaseComponentProps {
    /** Stage snapshots for time-travel visualization */
    snapshots: StageSnapshot[];
    /** Final pipeline result data */
    resultData?: Record<string, unknown> | null;
    /** Console log lines */
    logs?: string[];
    /** Combined narrative lines */
    narrative?: string[];
    /** Which tabs to show (default: all three) */
    tabs?: ShellTab[];
    /** Initially active tab */
    defaultTab?: ShellTab;
    /** Hide console in result tab */
    hideConsole?: boolean;
    /** Custom content to render in each tab slot */
    renderFlowchart?: (props: {
        snapshots: StageSnapshot[];
        selectedIndex: number;
        onNodeClick?: (index: number) => void;
    }) => React.ReactNode;
}
export declare function ExplainableShell({ snapshots, resultData, logs, narrative, tabs, defaultTab, hideConsole, renderFlowchart, size, unstyled, className, style, }: ExplainableShellProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ExplainableShell.d.ts.map