/**
 * DataTracePanel — Backward causal chain visualization.
 *
 * Shows the data dependency chain from the selected stage backward:
 * "Format read processed from Process, which read input from Seed."
 *
 * Like Chrome DevTools' Call Stack — click a frame to navigate there.
 *
 * Uses causalChain() from footprintjs/trace internally. The commitLog
 * and keysRead data come from props (collected during traversal).
 */
import { memo, useMemo } from "react";
import { theme } from "../../theme";
import type { StageSnapshot } from "../../types";

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

export interface DataTracePanelProps {
  /** Flattened causal chain frames (BFS order from causalChain + flattenCausalDAG). */
  frames: CausalFrame[];
  /** Currently selected stage's runtimeStageId. */
  selectedStageId?: string;
  /** Callback when a frame is clicked — navigate time-travel to that stage. */
  onFrameClick?: (runtimeStageId: string) => void;
  /** Optional: stage name for the "tracing from" header. */
  fromStageName?: string;
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
}: DataTracePanelProps) {
  if (frames.length === 0) {
    return (
      <div style={{ padding: 12, color: theme.textMuted, fontSize: 13 }}>
        Select a stage to see its data dependency chain.
      </div>
    );
  }

  return (
    <div style={{ padding: "8px 0", fontSize: 13 }}>
      {fromStageName && (
        <div
          style={{
            padding: "4px 12px 8px",
            fontSize: 11,
            color: theme.textMuted,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            fontWeight: 600,
          }}
        >
          Data trace from {fromStageName}
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
}: {
  frame: CausalFrame;
  isFirst: boolean;
  isLast: boolean;
  isSelected: boolean;
  onClick?: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onClick?.(frame.runtimeStageId)}
      style={{
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
        fontSize: 13,
      }}
    >
      {/* Stage name + depth indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {/* Connector line */}
        {!isFirst && (
          <span style={{ color: theme.textMuted, fontSize: 11 }}>
            ↑
          </span>
        )}
        <span
          style={{
            fontWeight: isFirst ? 600 : 400,
            color: isFirst
              ? "var(--fp-accent, #6366f1)"
              : theme.textPrimary,
          }}
        >
          {frame.stageName}
        </span>
        {isLast && !isFirst && (
          <span
            style={{
              fontSize: 10,
              color: theme.textMuted,
              fontStyle: "italic",
            }}
          >
            (origin)
          </span>
        )}
      </div>

      {/* What this stage wrote */}
      {frame.keysWritten.length > 0 && (
        <div
          style={{
            fontSize: 11,
            color: theme.textMuted,
            paddingLeft: isFirst ? 0 : 18,
            marginTop: 2,
          }}
        >
          wrote:{" "}
          <span style={{ color: theme.textSecondary }}>
            {frame.keysWritten.join(", ")}
          </span>
        </div>
      )}

      {/* Linked by which key */}
      {frame.linkedBy && (
        <div
          style={{
            fontSize: 11,
            color: "var(--fp-accent, #6366f1)",
            paddingLeft: 18,
            marginTop: 1,
          }}
        >
          ← via {frame.linkedBy}
        </div>
      )}
    </button>
  );
});
