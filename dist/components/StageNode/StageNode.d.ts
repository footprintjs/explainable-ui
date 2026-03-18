export interface StageNodeData {
    label: string;
    active?: boolean;
    done?: boolean;
    error?: boolean;
    linked?: boolean;
    /** Step numbers in execution order (shown as badges — multiple when revisited via loops) */
    stepNumbers?: number[];
    /** Node was not executed (dim it) */
    dimmed?: boolean;
    /** Node is a subflow root (show nested indicator) */
    isSubflow?: boolean;
    /** Human-readable description of what this stage does */
    description?: string;
    /** Subflow identifier — set when this node belongs to a subflow */
    subflowId?: string;
    [key: string]: unknown;
}
/**
 * Custom ReactFlow node for pipeline stages.
 * All colors and fonts come from `--fp-*` CSS variables (via theme).
 * Shows execution state via color, icon, step badge, and pulse animation.
 */
export declare const StageNode: import("react").NamedExoticComponent<Pick<import("@xyflow/react").Node<Record<string, unknown>, string | undefined>, "id" | "data" | "width" | "height" | "sourcePosition" | "targetPosition" | "dragHandle" | "parentId"> & Required<Pick<import("@xyflow/react").Node<Record<string, unknown>, string | undefined>, "type" | "dragging" | "zIndex" | "selectable" | "deletable" | "selected" | "draggable">> & {
    isConnectable: boolean;
    positionAbsoluteX: number;
    positionAbsoluteY: number;
} & {
    data: StageNodeData;
}>;
//# sourceMappingURL=StageNode.d.ts.map