import { FootprintButton, componentStyles, useFootprintComponents } from "../../theme";
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
import { memo, useState, useCallback, useMemo, type CSSProperties } from "react";
import { theme } from "../../theme";
import type { TraceGraph } from "./traceStructureRecorder";
import type { BaseComponentProps, Size } from "../../types";

export interface SubflowTreeEntry {
  /** Node name / identifier */
  name: string;
  /** Human-readable description */
  description?: string;
  /**
   * The mount node's id in the graph — the DRILL KEY. Unique even when the
   * same child chart is mounted twice, which `subflowId` and `name` are not
   * (see `_internal/subflowDrill.ts`). Hosts should drill with this.
   */
  nodeId?: string;
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
  /**
   * Called when a tree node is clicked. `nodeId` is the mount node's graph id
   * — the unambiguous drill key. Prefer it over `name`: two mounts of the
   * same child chart share a label, so drilling by name lands on whichever
   * one happens to be found first.
   */
  onNodeSelect?: (name: string, isSubflow: boolean, nodeId?: string) => void;
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
      nodeId: node.id,
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
  unstyled = false, size = "default",
}: {
  unstyled?: boolean;
  size?: Size;
  entry: SubflowTreeEntry;
  depth: number;
  activeStage?: string | null;
  doneStages?: Set<string>;
  onNodeSelect?: (name: string, isSubflow: boolean, nodeId?: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const ui = componentStyles(size);
  const sx = (value: CSSProperties): CSSProperties | undefined => unstyled ? undefined : value;
  const nativeButton = !useFootprintComponents().Button;
  const hasChildren = entry.children && entry.children.length > 0;
  const isActive = activeStage === entry.name;
  const isDone = doneStages?.has(entry.name);

  const handleClick = useCallback(() => {
    if (hasChildren) {
      setExpanded((prev) => !prev);
    }
    onNodeSelect?.(entry.name, !!entry.isSubflow, entry.nodeId);
  }, [hasChildren, onNodeSelect, entry.name, entry.isSubflow, entry.nodeId]);

  return (
    <>
      <FootprintButton
        onClick={handleClick}
        data-fp="subflow-tree-node"
        aria-current={isActive ? "step" : undefined}
        data-state={isActive ? "active" : isDone ? "done" : "pending"}
        defaultStyle={sx({
          display: "flex",
          alignItems: "center",
          gap: ui.controlGap,
          width: "100%",
          border: "none",
          background: isActive
            ? `color-mix(in srgb, ${theme.primary} 15%, transparent)`
            : "transparent",
          cursor: "pointer",
          padding: `${ui.spaceXs} ${ui.spaceSm} ${ui.spaceXs} calc(${ui.spaceSm} + ${depth} * ${ui.spaceLg})`,
          fontFamily: theme.fontSans,
          fontSize: ui.body,
          textAlign: "left",
          borderRadius: ui.radiusControl,
          transition: `background ${ui.fastDuration} ${ui.easing}`,
        })}
        onMouseEnter={(e) => {
          if (!unstyled && nativeButton && !isActive) {
            e.currentTarget.style.background = `color-mix(in srgb, ${theme.textMuted} 10%, transparent)`;
          }
        }}
        onMouseLeave={(e) => {
          if (!unstyled && nativeButton && !isActive) {
            e.currentTarget.style.background = "transparent";
          }
        }}
      >
        {/* Expand/collapse chevron for subflows */}
        {hasChildren ? (
          <span
            style={sx({
              fontSize: ui.small,
              color: theme.textMuted,
              width: `calc(${ui.iconSize} - 2px)`,
              textAlign: "center",
              flexShrink: 0,
              transition: `transform ${ui.fastDuration} ${ui.easing}`,
              transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
              display: "inline-block",
            })}
          >
            ▶
          </span>
        ) : (
          <span style={sx({ width: `calc(${ui.iconSize} - 2px)`, flexShrink: 0 })} />
        )}

        {/* Status dot */}
        <span
          style={sx({
            width: `calc(${ui.iconSize} * 3 / 7)`,
            height: `calc(${ui.iconSize} * 3 / 7)`,
            borderRadius: "50%",
            flexShrink: 0,
            background: isActive
              ? theme.primary
              : isDone
                ? theme.success
                : theme.border,
          })}
        />

        {/* Label + description */}
        <span style={sx({ display: "flex", flexDirection: "column", minWidth: 0 })}>
          <span
            style={sx({
              color: isActive
                ? theme.primary
                : isDone
                  ? theme.textPrimary
                  : theme.textSecondary,
              fontWeight: isActive ? ui.weightStrong : entry.isSubflow ? ui.weightMedium : ui.weightNormal,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            })}
          >
            {entry.name}
            {entry.isSubflow && (
              <span style={sx({ opacity: 0.5, marginLeft: ui.spaceXs, fontSize: ui.small })}>⊞</span>
            )}
          </span>
          {entry.description && (
            <span
              style={sx({
                color: theme.textMuted,
                fontSize: ui.small,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              })}
            >
              {entry.description}
            </span>
          )}
        </span>
      </FootprintButton>

      {/* Children */}
      {hasChildren && expanded && (
        <div>
          {entry.children!.map((child, i) => (
            <TreeNode
              key={child.nodeId ?? child.subflowId ?? `${child.name}-${i}`}
              entry={child}
              depth={depth + 1}
              activeStage={activeStage}
              doneStages={doneStages}
              onNodeSelect={onNodeSelect}
              unstyled={unstyled} size={size}
            />
          ))}
        </div>
      )}
    </>
  );
});

/** Section label used for "Flowchart" and "Subflows" headings. */
const SectionLabel = memo(function SectionLabel({ children, unstyled = false, size = "default" }: { children: string; unstyled?: boolean; size?: Size }) {
  const ui = componentStyles(size);
  const sx = (value: CSSProperties): CSSProperties | undefined => unstyled ? undefined : value;
  return (
    <div
      style={sx({
        padding: `${ui.spaceXs} ${ui.padding} ${ui.spaceSm}`,
        fontSize: ui.small,
        fontWeight: ui.weightStrong,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        color: theme.textMuted,
      })}
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
  size = "default",
  className,
  style,
}: SubflowTreeProps) {
  const ui = componentStyles(size);
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
              fontSize: ui.body,
              background: theme.bgPrimary,
              borderRight: `${ui.borderWidth} solid ${theme.border}`,
              overflowY: "auto",
              overflowX: "hidden",
              padding: `${ui.spaceSm} 0`,
            }),
        ...style,
      }}
    >
      <SectionLabel unstyled={unstyled} size={size}>Subflows</SectionLabel>
      {subflowStages.map((entry, i) => (
        <TreeNode
          key={entry.nodeId ?? entry.subflowId ?? `${entry.name}-${i}`}
          entry={entry}
          depth={0}
          activeStage={activeStage}
          doneStages={doneStages}
          onNodeSelect={onNodeSelect}
          unstyled={unstyled} size={size}
        />
      ))}
    </div>
  );
});
