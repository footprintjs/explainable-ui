import type { SpecNode } from "./specToReactFlow";
import type { BaseComponentProps } from "../../types";
export interface SubflowTreeEntry {
    /** Node name / identifier */
    name: string;
    /** Human-readable description */
    description?: string;
    /** Subflow ID (when this node represents a subflow) */
    subflowId?: string;
    /** Whether this node is a subflow root (has nested structure) */
    isSubflow?: boolean;
    /** Nested children (subflow stages) */
    children?: SubflowTreeEntry[];
}
export interface SubflowTreeProps extends BaseComponentProps {
    /** Pipeline spec to derive the tree from */
    spec: SpecNode;
    /** Currently active stage name (highlights in tree) */
    activeStage?: string | null;
    /** Set of completed stage names */
    doneStages?: Set<string>;
    /** Called when a tree node is clicked */
    onNodeSelect?: (name: string, isSubflow: boolean) => void;
}
/** Extracts a flat-ish tree of entries from a SpecNode for display. */
export declare function specToTree(node: SpecNode): SubflowTreeEntry[];
/**
 * Collapsible tree sidebar showing the full subflow manifest.
 *
 * Shared navigation layer — humans click through the tree just like
 * LLMs call getSubflowManifest() / getSubflowSpec().
 *
 * All colors come from `--fp-*` CSS variables set by the consumer.
 */
export declare const SubflowTree: import("react").NamedExoticComponent<SubflowTreeProps>;
//# sourceMappingURL=SubflowTree.d.ts.map