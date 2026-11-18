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

import { StockNodeAppearance, type DiagramObjectAppearance } from "../DiagramAppearance";
import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import type { ReactNode } from "react";
import { theme, componentStyles, v } from "../../theme";

export interface GroupContainerNodeData {
  diagramAppearance?: DiagramObjectAppearance;
  label: string;
  isGroupContainer?: boolean;
  active?: boolean;
  done?: boolean;
  error?: boolean;
  dimmed?: boolean;
  description?: string;
  icon?: string;
  /** Opt in before additional header data is rendered; legacy extra metadata stays invisible. */
  headerMode?: "expandable";
  /** Trusted host-rendered header content; recorded strings must not be supplied as markup. */
  iconContent?: ReactNode;
  headerAction?: ReactNode;
  statusLabel?: string;
  statusLabelId?: string;
  handleDirection?: "LR" | "TB";
  highlighted?: boolean;
  compactHeader?: boolean;
  unstyled?: boolean;
  [key: string]: unknown;
}

export function GroupContainerNode({ data }: NodeProps) {
  const d = data as GroupContainerNodeData;
  const expandable = d.headerMode === "expandable";
  const unstyled = d.unstyled === true;
  const ui = componentStyles();
  const borderColor = d.error
    ? theme.error
    : expandable && d.highlighted
      ? theme.tracing
    : d.active
      ? theme.primary
      : d.done
        ? theme.nodeVisited
        : theme.border;

  const recordedStatus = d.error ? "Failed" : d.active ? "Selected" : d.done ? "Visited" : undefined;

  return (
    <StockNodeAppearance appearance={d.diagramAppearance} unstyled={unstyled}><div
      data-fp="group-container-node"
      data-active={d.active || undefined}
      data-done={d.done || undefined}
      data-error={d.error || undefined}
      data-unstyled={unstyled || undefined}
      style={{
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        position: "relative",
        ...(!unstyled && { border: `${v("--fp-node-border-width", `calc(${ui.borderWidth} + 0.5px)`)} ${v("--fp-node-border-style", d.active || d.done || d.error ? "solid" : "dashed")} ${v("--fp-node-border-color", borderColor)}`,
        borderRadius: v("--fp-node-radius", `calc(${ui.radiusPanel} + 4px)`),
        boxShadow: v("--fp-node-shadow", "none"),
        // Translucent (theme-derived) so the dotted background + nested children
        // read clearly, while still following dark/light.
        background: `color-mix(in srgb, ${theme.textMuted} 7%, transparent)`,
        opacity: d.dimmed ? 0.4 : 1 }),
      }}
    >
      {/* Title header strip. */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          ...(!unstyled && { gap: ui.controlGap,
          padding: `${ui.spaceSm} ${ui.spaceMd}`,
          fontSize: expandable && d.compactHeader ? `calc(${ui.body} + 2px)` : ui.body,
          fontWeight: `calc(${ui.weightStrong} - 100)`,
          color: theme.textMuted,
          letterSpacing: 0.2 }),
        }}
      >
        {(expandable ? d.iconContent : undefined) ?? (d.icon ? <span aria-hidden>{d.icon}</span> : null)}
        <span title={d.label} style={expandable && d.compactHeader ? { minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } : undefined}>{d.label}</span>
        {!unstyled && recordedStatus && <span
          data-fp="group-status-badge"
          style={{ display: v("--fp-node-group-status-display", "none"), alignItems: "center", gap: 4,
            marginLeft: "auto", flexShrink: 0, fontFamily: theme.fontSans, fontSize: ui.small,
            color: theme.textPrimary }}
        >
          <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: "50%", background: borderColor }} />
          {recordedStatus}
        </span>}
        {expandable && d.headerAction ? <span style={{ marginLeft: "auto", flexShrink: 0 }}>{d.headerAction}</span> : null}
      </div>
      {expandable && d.statusLabel ? <div id={d.statusLabelId} title={d.statusLabel} style={{ ...(!unstyled && { padding: `0 ${ui.spaceMd}`, fontSize: ui.label, color: theme.textSecondary }), ...(d.compactHeader ? { maxHeight: 32, lineHeight: unstyled ? undefined : "16px", overflow: "hidden" } : {}) }}>{d.statusLabel}</div> : null}

      {/* Edge handles — top target, bottom source (top→bottom flow). */}
      <Handle type="target" position={expandable && d.handleDirection === "LR" ? Position.Left : Position.Top} style={unstyled ? undefined : { opacity: 0 }} />
      <Handle type="source" position={expandable && d.handleDirection === "LR" ? Position.Right : Position.Bottom} style={unstyled ? undefined : { opacity: 0 }} />
    </div></StockNodeAppearance>
  );
}
