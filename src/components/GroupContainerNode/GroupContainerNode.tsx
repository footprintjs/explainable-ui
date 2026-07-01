/**
 * GroupContainerNode — xyflow renderer for a subflow rendered as a GROUP
 * box (the `parentId` + `extent:'parent'` sub-flow pattern). Produced by
 * `applyGroupLayout` (it retypes a subflow mount to `groupContainer` and
 * sizes it via `style.width/height`); the subflow's member stages render
 * NESTED inside, as their own xyflow nodes positioned over this box.
 *
 * This box is therefore mostly chrome: a titled, bordered frame the member
 * nodes sit inside. It carries top/bottom handles so the parent-chain edges
 * (e.g. `context → this`, `this → message-api`) still connect to it.
 *
 * Overlay-aware: when the subflow's internals are active/done (aggregated
 * onto the mount by `aggregateMountStatus`), the frame highlights — same
 * done/active semantics the bundled `StageNode` uses.
 */

import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import { theme } from "../../theme";

export interface GroupContainerNodeData {
  label: string;
  isGroupContainer?: boolean;
  active?: boolean;
  done?: boolean;
  error?: boolean;
  dimmed?: boolean;
  description?: string;
  icon?: string;
  [key: string]: unknown;
}

export function GroupContainerNode({ data }: NodeProps) {
  const d = data as GroupContainerNodeData;
  const borderColor = d.error
    ? theme.error
    : d.active
      ? theme.primary
      : d.done
        ? theme.nodeVisited
        : theme.border;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        border: `1.5px ${d.active || d.done || d.error ? "solid" : "dashed"} ${borderColor}`,
        borderRadius: 12,
        // Translucent (theme-derived) so the dotted background + nested children
        // read clearly, while still following dark/light.
        background: `color-mix(in srgb, ${theme.textMuted} 7%, transparent)`,
        opacity: d.dimmed ? 0.4 : 1,
        position: "relative",
      }}
    >
      {/* Title header strip. */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 12px",
          fontSize: 12,
          fontWeight: 600,
          color: theme.textMuted,
          letterSpacing: 0.2,
        }}
      >
        {d.icon ? <span aria-hidden>{d.icon}</span> : null}
        <span>{d.label}</span>
      </div>

      {/* Edge handles — top target, bottom source (top→bottom flow). */}
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
}
