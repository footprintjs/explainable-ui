import type { BaseComponentProps } from "../../types";
export interface ResultPanelProps extends BaseComponentProps {
    /** Final pipeline output / shared state */
    data: Record<string, unknown> | null;
    /** Optional console log lines */
    logs?: string[];
    /** Hide console section (default: false) */
    hideConsole?: boolean;
}
export declare function ResultPanel({ data, logs, hideConsole, size, unstyled, className, style, }: ResultPanelProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ResultPanel.d.ts.map