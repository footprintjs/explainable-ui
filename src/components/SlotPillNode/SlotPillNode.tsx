/**
 * SlotPillNode — a slim, pill-shaped node renderer for context "slots"
 * (system-prompt / messages / tools) inside an LLM-call / Agent chart.
 *
 * Why a dedicated renderer (not a resized StageNode): `StageNode` sizes to
 * its OWN content (padding + label + description) and ignores the wrapper
 * size, so it can't render genuinely slim. `SlotPillNode` is intrinsically a
 * thin bar that fills its wrapper — so a consumer's `nodeSize` resolver
 * (e.g. 210×38) produces a real pill.
 *
 * Lit / selected state (the context-selector highlight): a slot is part of a
 * `select()` decision — the Context selector PICKS which slots to engineer
 * each turn. When the runtime overlay (or the consumer) marks a slot
 * `active`/`selected`, the pill LIGHTS UP; unlit = "this slot wasn't engineered
 * this turn". That lit/unlit signal is the whole point of the slot view.
 *
 * Consumer-supplied via `nodeTypes={{ slotPill: SlotPillNode }}`. The trace
 * components inject overlay state (`active`/`done`/`dimmed`) into custom node
 * `data`, so this reads the same fields the bundled StageNode does.
 */

import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import { theme, componentStyles, v } from "../../theme";

export interface SlotPillNodeData {
  label: string;
  /** Lit when the selector PICKED this slot this turn (overlay or consumer). */
  active?: boolean;
  selected?: boolean;
  done?: boolean;
  /** Faded when other slots ran but this one didn't (the "unlit" signal). */
  dimmed?: boolean;
  /** Semantic kind hint for the dot color (e.g. 'system-prompt'|'messages'|'tools'). */
  slotKind?: string;
  icon?: string;
  unstyled?: boolean;
  [key: string]: unknown;
}

export function SlotPillNode({ data }: NodeProps) {
  const d = data as SlotPillNodeData;
  const lit = !!(d.active || d.selected);
  const unstyled = d.unstyled === true;
  const ui = componentStyles();

  // Lit → primary glow; done → visited tint; otherwise muted. Dimmed fades.
  const accent = lit ? theme.primary : d.done ? theme.nodeVisited : theme.textMuted;
  const opacity = d.dimmed && !lit ? 0.45 : 1;

  return (
    <div
      data-fp="slot-pill-node"
      data-active={lit || undefined}
      data-done={d.done || undefined}
      data-unstyled={unstyled || undefined}
      style={{
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        whiteSpace: "nowrap",
        overflow: "hidden",
        ...(!unstyled && { gap: ui.spaceSm,
        padding: `0 ${ui.spaceMd}`,
        borderRadius: v("--fp-node-radius", "999px"), // full pill unless explicitly themed
        border: `${v("--fp-node-border-width", `calc(${ui.borderWidth} + 0.5px)`)} ${v("--fp-node-border-style", "solid")} ${v("--fp-node-border-color", lit ? theme.primary : theme.border)}`,
        // Fills derive from the theme so the pill follows dark/light — the lit
        // state is a faint primary tint over the resting node bg, unlit is the
        // resting bg itself (visible against the canvas via the border).
        background: lit
          ? `color-mix(in srgb, ${theme.primary} 14%, ${theme.bgSecondary})`
          : theme.bgSecondary,
        boxShadow: v("--fp-node-shadow", lit ? `0 0 0 2px color-mix(in srgb, ${theme.primary} 25%, transparent)` : "none"),
        opacity,
        fontSize: ui.body,
        fontWeight: `calc(${ui.weightStrong} - 100)`,
        color: lit ? theme.textPrimary : theme.textSecondary,
        transition: `opacity ${ui.fastDuration}, box-shadow ${ui.fastDuration}, border-color ${ui.fastDuration}` }),
      }}
      title={d.label}
    >
      {/* Status dot — lit/done/muted. */}
      <span
        aria-hidden
        style={{
          flexShrink: 0,
          width: 8,
          height: 8,
          ...(!unstyled && { borderRadius: "50%", background: accent }),
        }}
      />
      {d.icon ? <span aria-hidden style={{ flexShrink: 0 }}>{d.icon}</span> : null}
      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{d.label}</span>

      {/* Edge handles — top in, bottom out (top→bottom flow). */}
      <Handle type="target" position={Position.Top} style={unstyled ? undefined : { opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={unstyled ? undefined : { opacity: 0 }} />
    </div>
  );
}
