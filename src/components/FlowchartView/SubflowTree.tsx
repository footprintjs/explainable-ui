/**
 * SubflowTree — collapsible sidebar listing mounted subflows.
 *
 * Recorder-driven (v6+): derives the tree from a `TraceGraph` produced
 * by `createTraceStructureRecorder`. Filters nodes by
 * `data.isSubflow === true` and lists them as `SubflowTreeEntry[]`
 * keyed by `subflowId`.
 *
 * Limitation (intentional — recorder graph is flat / mount-only):
 *   Subflow-within-subflow nesting is NOT represented. The
 *   StructureRecorder records the MOUNT of each subflow in the parent
 *   chart, not the inner structure of each child chart. Rendering the
 *   nested tree requires a separate recorder attached to each child
 *   chart instance (deferred — see TODO below).
 *
 * Shared navigation layer — humans click through the tree just like
 * LLMs call getSubflowManifest() / getSubflowSpec().
 *
 * TODO(recorder-driven-nesting): when child charts attach their own
 * `traceStructureRecorder` and surface those graphs via a parent
 * registry, accept `Map<subflowId, TraceGraph>` and recurse to
 * restore the nested rendering the legacy SpecNode-walk supported.
 *
 * All colors come from `--fp-*` CSS variables set by the consumer.
 */
import { memo, useState, useCallback, useMemo } from "react";
import { theme } from "../../theme";
import type { TraceGraph } from "./traceStructureRecorder";
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
  /** Nested children (subflow stages) — always undefined in the
   *  current recorder-driven implementation; see file-level TODO. */
  children?: SubflowTreeEntry[];
}

export interface SubflowTreeProps extends BaseComponentProps {
  /** Recorder-captured graph from `createTraceStructureRecorder().getGraph()`. */
  graph: TraceGraph;
  /** Currently active stage name (highlights in tree) */
  activeStage?: string | null;
  /** Set of completed stage names */
  doneStages?: Set<string>;
  /** Called when a tree node is clicked */
  onNodeSelect?: (name: string, isSubflow: boolean) => void;
}

/** Extracts subflow entries from a recorder graph. Insertion-order preserving. */
export function graphToSubflowEntries(graph: TraceGraph): SubflowTreeEntry[] {
  if (!graph?.nodes?.length) return [];
  const entries: SubflowTreeEntry[] = [];
  for (const node of graph.nodes) {
    if (!node.data?.isSubflow) continue;
    const entry: SubflowTreeEntry = {
      name: typeof node.data.label === "string" ? node.data.label : node.id,
      isSubflow: true,
    };
    if (typeof node.data.description === "string") entry.description = node.data.description;
    if (typeof node.data.subflowId === "string") entry.subflowId = node.data.subflowId;
    entries.push(entry);
  }
  return entries;
}

/** Single tree node row */
const TreeNode = memo(function TreeNode({
  entry,
  depth,
  activeStage,
  doneStages,
  onNodeSelect,
}: {
  entry: SubflowTreeEntry;
  depth: number;
  activeStage?: string | null;
  doneStages?: Set<string>;
  onNodeSelect?: (name: string, isSubflow: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = entry.children && entry.children.length > 0;
  const isActive = activeStage === entry.name;
  const isDone = doneStages?.has(entry.name);

  const handleClick = useCallback(() => {
    if (hasChildren) {
      setExpanded((prev) => !prev);
    }
    onNodeSelect?.(entry.name, !!entry.isSubflow);
  }, [hasChildren, onNodeSelect, entry.name, entry.isSubflow]);

  return (
    <>
      <button
        onClick={handleClick}
        data-fp="subflow-tree-node"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          width: "100%",
          border: "none",
          background: isActive
            ? `color-mix(in srgb, ${theme.primary} 15%, transparent)`
            : "transparent",
          cursor: "pointer",
          padding: `4px 8px 4px ${8 + depth * 16}px`,
          fontFamily: theme.fontSans,
          fontSize: 12,
          textAlign: "left",
          borderRadius: 4,
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = `color-mix(in srgb, ${theme.textMuted} 10%, transparent)`;
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = "transparent";
          }
        }}
      >
        {/* Expand/collapse chevron for subflows */}
        {hasChildren ? (
          <span
            style={{
              fontSize: 10,
              color: theme.textMuted,
              width: 12,
              textAlign: "center",
              flexShrink: 0,
              transition: "transform 0.15s",
              transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
              display: "inline-block",
            }}
          >
            ▶
          </span>
        ) : (
          <span style={{ width: 12, flexShrink: 0 }} />
        )}

        {/* Status dot */}
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            flexShrink: 0,
            background: isActive
              ? theme.primary
              : isDone
                ? theme.success
                : theme.border,
          }}
        />

        {/* Label + description */}
        <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          <span
            style={{
              color: isActive
                ? theme.primary
                : isDone
                  ? theme.textPrimary
                  : theme.textSecondary,
              fontWeight: isActive ? 600 : entry.isSubflow ? 500 : 400,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {entry.name}
            {entry.isSubflow && (
              <span style={{ opacity: 0.5, marginLeft: 4, fontSize: 10 }}>⊞</span>
            )}
          </span>
          {entry.description && (
            <span
              style={{
                color: theme.textMuted,
                fontSize: 10,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {entry.description}
            </span>
          )}
        </span>
      </button>

      {/* Children */}
      {hasChildren && expanded && (
        <div>
          {entry.children!.map((child, i) => (
            <TreeNode
              key={child.subflowId ?? `${child.name}-${i}`}
              entry={child}
              depth={depth + 1}
              activeStage={activeStage}
              doneStages={doneStages}
              onNodeSelect={onNodeSelect}
            />
          ))}
        </div>
      )}
    </>
  );
});

/** Section label used for "Flowchart" and "Subflows" headings. */
const SectionLabel = memo(function SectionLabel({ children }: { children: string }) {
  return (
    <div
      style={{
        padding: "4px 12px 8px",
        fontSize: 10,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        color: theme.textMuted,
      }}
    >
      {children}
    </div>
  );
});

export const SubflowTree = memo(function SubflowTree({
  graph,
  activeStage,
  doneStages,
  onNodeSelect,
  unstyled = false,
  className,
  style,
}: SubflowTreeProps) {
  const subflowStages = useMemo(() => graphToSubflowEntries(graph), [graph]);

  // Don't render anything if there are no subflows
  if (subflowStages.length === 0) return null;

  return (
    <div
      className={className}
      data-fp="subflow-tree"
      style={{
        ...(unstyled
          ? {}
          : {
              fontFamily: theme.fontSans,
              fontSize: 12,
              background: theme.bgPrimary,
              borderRight: `1px solid ${theme.border}`,
              overflowY: "auto",
              overflowX: "hidden",
              padding: "8px 0",
            }),
        ...style,
      }}
    >
      {!unstyled && <SectionLabel>Subflows</SectionLabel>}
      {subflowStages.map((entry, i) => (
        <TreeNode
          key={entry.subflowId ?? `${entry.name}-${i}`}
          entry={entry}
          depth={0}
          activeStage={activeStage}
          doneStages={doneStages}
          onNodeSelect={onNodeSelect}
        />
      ))}
    </div>
  );
});
