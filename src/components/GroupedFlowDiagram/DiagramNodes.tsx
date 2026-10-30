import { useId, type CSSProperties } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { GroupContainerNode } from "../GroupContainerNode";
import { theme } from "../../theme";
import { DiagramIcon } from "./icons";
import type { PositionedFlowDiagramNode } from "./types";

export interface DiagramNodeData extends Record<string, unknown> {
  item: PositionedFlowDiagramNode;
  caption: string;
  selected: boolean;
  direction: "LR" | "TB";
  onToggle(id: string): void;
  onSelect(id: string): void;
  canToggle: boolean;
}
export type DiagramReactNode = Node<DiagramNodeData>;
const statusText = { unknown: "Status unknown", running: "Running", completed: "Completed", failed: "Failed", "not-run": "Not run (recorded)" };
const smallButton: CSSProperties = { font: "inherit", border: `1px solid ${theme.border}`, borderRadius: 8, padding: "5px 10px", background: theme.bgElevated, color: theme.textPrimary, cursor: "pointer" };

function DependencyHandles({ direction }: { direction: "LR" | "TB" }) {
  return <>
    <Handle id="dependency-source" type="source" position={direction === "LR" ? Position.Left : Position.Top} isConnectable={false} style={{ opacity: 0 }} />
    <Handle id="dependency-target" type="target" position={direction === "LR" ? Position.Right : Position.Bottom} isConnectable={false} style={{ opacity: 0 }} />
  </>;
}

function CauseBadge({ item }: { item: PositionedFlowDiagramNode }) {
  if (!item.isRootCause && !item.containsRootCause) return null;
  return <span style={{ position: "absolute", zIndex: 2, top: -12, left: 10, padding: "4px 9px", borderRadius: 7,
    fontSize: 11, lineHeight: "16px", fontWeight: 700, color: item.isRootCause ? theme.bg : theme.textSecondary,
    background: item.isRootCause ? theme.textPrimary : theme.bgElevated, border: `1px solid ${theme.tracing}`, pointerEvents: "none" }}>
    {item.isRootCause ? "Supported cause" : "Cause inside"}
  </span>;
}

export function DiagramGroupNode(props: NodeProps<DiagramReactNode>) {
  const d = props.data, item = d.item;
  const statusId = useId();
  const action = <button type="button" className="nodrag nopan" style={smallButton} disabled={!d.canToggle}
    aria-label={`Collapse ${item.node.label}${d.caption ? ` · ${d.caption}` : ""}`} aria-expanded="true" aria-describedby={statusId}
    onClick={event => { event.stopPropagation(); d.onToggle(item.node.id); }}>Collapse</button>;
  const text = [d.caption, statusText[item.state], item.recordedIssueCount ? `${item.recordedIssueCount} recorded issue${item.recordedIssueCount === 1 ? "" : "s"} inside` : "", item.containsSelection ? "Selection inside" : ""].filter(Boolean).join(" · ");
  return <div data-node-id={item.node.id} data-state={item.state} data-highlighted={item.highlighted} data-selected={d.selected} data-expanded="true" style={{ position: "relative", width: "100%", height: "100%" }}>
    <GroupContainerNode {...props} data={{ label: item.node.label, headerMode: "expandable", iconContent: <DiagramIcon icon={item.node.icon ?? "flow"} style={{ width: 22, height: 22, color: theme.nodeMain }} />,
      headerAction: action, statusLabel: text, statusLabelId: statusId, handleDirection: d.direction, highlighted: item.highlighted, compactHeader: true,
      error: item.state === "failed", done: item.state === "completed", active: item.state === "running" }} />
    <DependencyHandles direction={d.direction} />
    <CauseBadge item={item} />
  </div>;
}

export function DiagramItemNode({ data: d }: NodeProps<DiagramReactNode>) {
  const item = d.item, node = item.node, group = node.kind === "group", decision = node.kind === "decision";
  const statusId = useId();
  const border = item.state === "failed" ? theme.error : item.highlighted ? theme.tracing : group ? theme.nodeMain : theme.border;
  const caption = d.caption ? ` · ${d.caption}` : "";
  const action = group ? `Expand ${node.label}${caption}` : `Select ${node.label}${caption}`;
  return <div data-node-id={node.id} data-state={item.state} data-highlighted={item.highlighted} data-selected={d.selected}
    style={{ position: "relative", width: item.width, height: item.height, color: theme.textPrimary,
      filter: item.highlighted ? "drop-shadow(0 0 9px color-mix(in srgb, var(--fp-tracing, #0d9488) 25%, transparent))" : undefined }}>
    <Handle type="target" position={d.direction === "LR" ? Position.Left : Position.Top} isConnectable={false} />
    {decision && <svg aria-hidden="true" width={item.width} height={item.height} style={{ position: "absolute", inset: 0 }}>
      <polygon points={`${item.width / 2},2 ${item.width - 2},${item.height / 2} ${item.width / 2},${item.height - 2} 2,${item.height / 2}`} fill={theme.bgElevated} stroke={border} strokeWidth="2" />
    </svg>}
    <button type="button" className="nodrag nopan" aria-label={action} aria-describedby={statusId} aria-expanded={group ? false : undefined} aria-pressed={group ? undefined : d.selected}
      disabled={group && (!item.childCount || !d.canToggle)} title={node.description ? `${node.label}. ${node.description}` : node.label}
      onClick={event => { event.stopPropagation(); group ? d.onToggle(node.id) : d.onSelect(node.id); }}
      style={{ position: "relative", width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 7,
        padding: decision ? "18px 42px" : "12px 18px", fontFamily: theme.fontSans, cursor: "pointer", color: "inherit",
        border: decision ? "none" : `2px ${group || item.state === "not-run" ? "dashed" : "solid"} ${border}`, borderRadius: 16,
        background: decision ? "transparent" : theme.bgElevated, boxShadow: !decision ? "0 7px 20px rgba(0, 0, 0, 0.03137255)" : undefined,
        outline: d.selected ? `3px solid ${theme.tracing}` : undefined, outlineOffset: 4 }}>
      <DiagramIcon icon={node.icon ?? (group ? "flow" : "step")} style={{ color: item.state === "not-run" ? theme.textMuted : theme.warning }} />
      <strong style={{ fontSize: 18, lineHeight: 1.2, maxWidth: "100%", maxHeight: group ? 22 : 44, overflow: "hidden", overflowWrap: "anywhere", ...(group ? { whiteSpace: "nowrap", textOverflow: "ellipsis" } : {}) }}>{node.label}</strong>
      {d.caption && <span style={{ fontSize: 10, color: theme.textSecondary }}>{d.caption}</span>}
      <span id={statusId} style={{ fontSize: group ? 11 : 12, color: item.state === "failed" ? theme.error : theme.textSecondary }}>{statusText[item.state]}{group ? ` · ${item.childCount ? `${item.childCount} items inside` : "Step information unavailable"}` : ""}</span>
      {group && (item.recordedIssueCount > 0 || item.containsSelection) && <span style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 6px", fontSize: 10 }}>
        {item.recordedIssueCount > 0 && <span style={{ color: theme.error }}>{item.recordedIssueCount} recorded issue{item.recordedIssueCount === 1 ? "" : "s"} inside</span>}
        {item.containsSelection && <span style={{ color: theme.tracing }}>Selection inside</span>}
      </span>}
    </button>
    {item.state === "completed" && <span aria-hidden="true" style={{ position: "absolute", top: -9, right: -9, width: 26, height: 26, borderRadius: "50%", background: theme.success, color: "white", textAlign: "center", fontSize: 19 }}>✓</span>}
    {item.state === "failed" && <span aria-hidden="true" style={{ position: "absolute", top: -9, right: -9, width: 26, height: 26, borderRadius: "50%", background: theme.error, color: "white", textAlign: "center", fontSize: 20 }}>×</span>}
    <Handle type="source" position={d.direction === "LR" ? Position.Right : Position.Bottom} isConnectable={false} />
    <DependencyHandles direction={d.direction} />
    <CauseBadge item={item} />
  </div>;
}

export const diagramNodeTypes = { flowDiagramItem: DiagramItemNode, flowDiagramGroup: DiagramGroupNode };
