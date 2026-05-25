export interface StageNodeData {
    label: string;
    active?: boolean;
    done?: boolean;
    error?: boolean;
    linked?: boolean;
    /** Semantic icon hint (e.g., "llm", "tool", "rag", "start", "parse", "agent", "guard") */
    icon?: string;
    /** Step numbers in execution order (shown as badges — multiple when revisited via loops) */
    stepNumbers?: number[];
    /** Node was not executed (dim it) */
    dimmed?: boolean;
    /** Node is a subflow root (show nested indicator) */
    isSubflow?: boolean;
    /** Node uses lazy resolution (dashed border + cloud icon when unresolved) */
    isLazy?: boolean;
    /** Node is a decider (renders as diamond shape per flowchart convention) */
    isDecider?: boolean;
    /** Node is a fork (parallel fan-out) */
    isFork?: boolean;
    /** Human-readable description of what this stage does */
    description?: string;
    /** Subflow identifier — set when this node belongs to a subflow */
    subflowId?: string;
    /**
     * Stable stage identifier from the spec (`SpecNode.id`). Renderable as a
     * small monospace caption under the label when `showStageId` is true —
     * useful for teaching the runtimeStageId convention and for debugging
     * which node a recorder event belongs to.
     */
    stageId?: string;
    /**
     * When true, render the `stageId` as a small monospace caption beneath
     * the label. Default false. Drives the "Show IDs" toggle in
     * ExplainableShell.
     */
    showStageId?: boolean;
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