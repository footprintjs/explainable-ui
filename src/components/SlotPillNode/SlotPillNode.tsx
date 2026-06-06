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
import { rawDefaults } from "../../theme/tokens";

const C = rawDefaults.colors;

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
  [key: string]: unknown;
}

export function SlotPillNode({ data }: NodeProps) {
  const d = data as SlotPillNodeData;
  const lit = !!(d.active || d.selected);

  // Lit → primary glow; done → success tint; otherwise muted. Dimmed fades.
  const accent = lit ? C.primary : d.done ? C.success : C.textMuted;
  const opacity = d.dimmed && !lit ? 0.45 : 1;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "0 12px",
        borderRadius: 999, // full pill
        border: `1.5px solid ${lit ? C.primary : C.border}`,
        background: lit ? "rgba(99, 102, 241, 0.14)" : "rgba(148, 163, 184, 0.06)",
        boxShadow: lit ? `0 0 0 2px rgba(99,102,241,0.25)` : "none",
        opacity,
        fontSize: 12,
        fontWeight: 600,
        color: lit ? C.textPrimary : C.textSecondary,
        whiteSpace: "nowrap",
        overflow: "hidden",
        transition: "opacity 120ms, box-shadow 120ms, border-color 120ms",
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
          borderRadius: "50%",
          background: accent,
        }}
      />
      {d.icon ? <span aria-hidden style={{ flexShrink: 0 }}>{d.icon}</span> : null}
      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{d.label}</span>

      {/* Edge handles — top in, bottom out (top→bottom flow). */}
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
}
