import { memo, useState, useCallback, useMemo } from "react";
import { theme } from "../../theme";
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
export function specToTree(node: SpecNode): SubflowTreeEntry[] {
  const entries: SubflowTreeEntry[] = [];
  const seen = new Set<string>();

  function walk(n: SpecNode) {
    const id = n.name || n.id || "";
    if (seen.has(id)) return;
    seen.add(id);

    const entry: SubflowTreeEntry = {
      name: n.name,
      description: n.description,
      subflowId: n.subflowId,
      isSubflow: !!n.isSubflowRoot,
    };

    // If this is a subflow with nested structure, recurse into it
    if (n.isSubflowRoot && n.subflowStructure) {
      entry.children = specToTree(n.subflowStructure);
    }

    entries.push(entry);

    // Walk children (fork/decider branches)
    if (n.children) {
      for (const child of n.children) {
        walk(child);
      }
    }

    // Walk linear continuation
    if (n.next) {
      walk(n.next);
    }
  }

  walk(node);
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
              key={`${child.name}-${i}`}
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

/**
 * Collapsible tree sidebar showing the full subflow manifest.
 *
 * Shared navigation layer — humans click through the tree just like
 * LLMs call getSubflowManifest() / getSubflowSpec().
 *
 * All colors come from `--fp-*` CSS variables set by the consumer.
 */
export const SubflowTree = memo(function SubflowTree({
  spec,
  activeStage,
  doneStages,
  onNodeSelect,
  unstyled = false,
  className,
  style,
}: SubflowTreeProps) {
  const tree = useMemo(() => specToTree(spec), [spec]);

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
      {!unstyled && (
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
          Pipeline
        </div>
      )}
      {tree.map((entry, i) => (
        <TreeNode
          key={`${entry.name}-${i}`}
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
