/**
 * DataTracePanel — Backward causal chain visualization.
 *
 * Shows the data dependency chain from the selected stage backward:
 * "Format read processed from Process, which read input from Seed."
 *
 * Like Chrome DevTools' Call Stack — click a frame to navigate there.
 *
 * The frames come from a LOCAL mirror of footprintjs' causalChain walk
 * (ExplainableShell/_internal/dataTrace.ts — real read→write BFS over the
 * snapshot's commitLog + executionTree reads; eui never imports footprintjs).
 * `note` renders an honesty line (e.g. "reads were not recorded") so an
 * edge-less trace is never mistaken for independence.
 */
import { memo, useMemo } from "react";
import type { CSSProperties } from "react";
import { fontSize, padding, theme } from "../../theme";
import type { BaseComponentProps, StageSnapshot } from "../../types";

// ── Types for causal chain data ────────────────────────────────────

/** A node in the causal DAG (matches footprintjs CausalNode shape). */
export interface CausalFrame {
  runtimeStageId: string;
  stageId: string;
  stageName: string;
  keysWritten: string[];
  linkedBy: string;
  depth: number;
}

export interface DataTracePanelProps extends BaseComponentProps {
  /** Flattened causal chain frames (BFS order from causalChain + flattenCausalDAG). */
  frames: CausalFrame[];
  /** Currently selected stage's runtimeStageId. */
  selectedStageId?: string;
  /** Callback when a frame is clicked — navigate time-travel to that stage. */
  onFrameClick?: (runtimeStageId: string) => void;
  /** Optional: stage name for the "tracing from" header. */
  fromStageName?: string;
  /** Optional honesty line rendered under the header (⚠-style). */
  note?: string;
}

/**
 * Render the backward causal chain as a stack trace.
 * Each frame shows: stage name, what it wrote, linked by which key.
 * Click a frame to navigate the time-travel slider.
 */
export const DataTracePanel = memo(function DataTracePanel({
  frames,
  selectedStageId,
  onFrameClick,
  fromStageName,
  note,
  size = "default",
  unstyled = false,
  className,
  style,
}: DataTracePanelProps) {
  const fs = fontSize[size];
  const pad = padding[size];
  // `body + 1` keeps the shipped default (13px) byte-identical while giving
  // `compact` / `detailed` the same one-step scale every other panel uses.
  const base = fs.body + 1;
  /** Styles vanish in unstyled mode; the tree stays exactly the same. */
  const sx = (s: CSSProperties): CSSProperties | undefined => (unstyled ? undefined : s);
  const noteLine = note ? (
    <div style={sx({ color: theme.textMuted, fontSize: fs.label, fontStyle: "italic", marginBottom: 8 })}>
      {note}
    </div>
  ) : null;
  if (frames.length === 0) {
    return (
      <div
        className={className}
        data-fp="data-trace-panel"
        style={{ ...sx({ padding: `${pad + 2}px ${pad + 2}px ${pad}px`, fontSize: base, lineHeight: 1.55 }), ...style }}
      >
        <div
          style={sx({
            fontSize: fs.label,
            color: theme.textMuted,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            fontWeight: 600,
            marginBottom: 6,
          })}
        >
          Backward causal chain
        </div>
        <div style={sx({ color: theme.textSecondary, marginBottom: 10 })}>
          Trace any value back to the stage that created it — and everything upstream that
          influenced it.
        </div>
        {noteLine}
        <div style={sx({ color: theme.textMuted, fontSize: fs.body })}>
          Select a stage above to see its dependency chain.
        </div>
      </div>
    );
  }

  return (
    <div
      className={className}
      data-fp="data-trace-panel"
      style={{ ...sx({ padding: "8px 0", fontSize: base }), ...style }}
    >
      {note && <div style={sx({ padding: "4px 12px 0", fontSize: fs.label, color: theme.textMuted, fontStyle: "italic" })}>{note}</div>}
      {fromStageName && (
        <div style={sx({ padding: "4px 12px 8px" })}>
          <div
            style={sx({
              fontSize: fs.label,
              color: theme.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              fontWeight: 600,
            })}
          >
            Data trace from {fromStageName}
          </div>
          <div
            style={sx({
              fontSize: fs.label,
              color: theme.textMuted,
              fontStyle: "italic",
              marginTop: 3,
            })}
          >
            Every value here was derived from the stages below.
          </div>
        </div>
      )}
      {frames.map((frame, i) => (
        <DataTraceFrame
          key={frame.runtimeStageId}
          frame={frame}
          isFirst={i === 0}
          isLast={i === frames.length - 1}
          isSelected={frame.runtimeStageId === selectedStageId}
          onClick={onFrameClick}
          unstyled={unstyled}
          size={size}
        />
      ))}
    </div>
  );
});

const DataTraceFrame = memo(function DataTraceFrame({
  frame,
  isFirst,
  isLast,
  isSelected,
  onClick,
  unstyled = false,
  size = "default",
}: {
  frame: CausalFrame;
  isFirst: boolean;
  isLast: boolean;
  isSelected: boolean;
  onClick?: (id: string) => void;
  unstyled?: boolean;
  size?: NonNullable<BaseComponentProps["size"]>;
}) {
  const fs = fontSize[size];
  const sx = (s: CSSProperties): CSSProperties | undefined => (unstyled ? undefined : s);
  return (
    <button
      onClick={() => onClick?.(frame.runtimeStageId)}
      data-fp="data-trace-frame"
      data-selected={isSelected || undefined}
      style={sx({
        display: "block",
        width: "100%",
        textAlign: "left",
        border: "none",
        background: isSelected
          ? "var(--fp-accent-bg, rgba(99,102,241,0.12))"
          : "transparent",
        padding: "6px 12px 6px 16px",
        cursor: onClick ? "pointer" : "default",
        borderLeft: isSelected
          ? "3px solid var(--fp-accent, #6366f1)"
          : "3px solid transparent",
        color: "inherit",
        fontSize: fs.body + 1,
      })}
    >
      {/* Stage name + depth indicator */}
      <div style={sx({ display: "flex", alignItems: "center", gap: 6 })}>
        {/* Connector line */}
        {!isFirst && (
          <span style={sx({ color: theme.textMuted, fontSize: fs.label })}>
            ↑
          </span>
        )}
        <span
          style={sx({
            fontWeight: isFirst ? 600 : 400,
            color: isFirst
              ? "var(--fp-accent, #6366f1)"
              : theme.textPrimary,
          })}
        >
          {frame.stageName}
        </span>
        {isLast && !isFirst && (
          <span
            style={sx({
              fontSize: fs.small,
              color: theme.textMuted,
              fontStyle: "italic",
            })}
          >
            (origin)
          </span>
        )}
      </div>

      {/* What this stage wrote */}
      {frame.keysWritten.length > 0 && (
        <div
          style={sx({
            fontSize: fs.label,
            color: theme.textMuted,
            paddingLeft: isFirst ? 0 : 18,
            marginTop: 2,
          })}
        >
          wrote:{" "}
          <span style={sx({ color: theme.textSecondary })}>
            {frame.keysWritten.join(", ")}
          </span>
        </div>
      )}

      {/* Linked by which key */}
      {frame.linkedBy && (
        <div
          style={sx({
            fontSize: fs.label,
            color: "var(--fp-accent, #6366f1)",
            paddingLeft: 18,
            marginTop: 1,
          })}
        >
          ← via {frame.linkedBy}
        </div>
      )}
    </button>
  );
});
