import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import { theme } from "../../theme";

export interface StageNodeData {
  label: string;
  active?: boolean;
  done?: boolean;
  error?: boolean;
  linked?: boolean;
  /** Step number in execution order (shown as badge) */
  stepNumber?: number;
  /** Node was not executed (dim it) */
  dimmed?: boolean;
  [key: string]: unknown;
}

/**
 * Custom ReactFlow node for pipeline stages.
 * All colors and fonts come from `--fp-*` CSS variables (via theme).
 * Shows execution state via color, icon, step badge, and pulse animation.
 */
export const StageNode = memo(function StageNode({
  data,
}: NodeProps & { data: StageNodeData }) {
  const { label, active, done, error, linked, stepNumber, dimmed } = data;

  const isOnPath = active || done;

  const bg = active
    ? theme.primary
    : done
      ? theme.success
      : error
        ? theme.error
        : theme.bgSecondary;

  const borderColor = active
    ? theme.primary
    : done
      ? theme.success
      : error
        ? theme.error
        : theme.border;

  const shadow = active
    ? `0 0 16px color-mix(in srgb, ${theme.primary} 40%, transparent)`
    : done
      ? `0 0 8px color-mix(in srgb, ${theme.success} 20%, transparent)`
      : error
        ? `0 0 12px color-mix(in srgb, ${theme.error} 30%, transparent)`
        : `0 2px 8px rgba(0,0,0,0.15)`;

  // Colored states use white for contrast; default uses consumer's text color.
  const textColor =
    active || done || error ? "#fff" : theme.textPrimary;

  return (
    <>
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        {/* Step number badge */}
        {stepNumber != null && isOnPath && (
          <div
            style={{
              position: "absolute",
              top: -10,
              left: -10,
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: active ? theme.primary : theme.success,
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
              boxShadow: active
                ? `0 0 8px color-mix(in srgb, ${theme.primary} 50%, transparent)`
                : `0 0 8px color-mix(in srgb, ${theme.success} 40%, transparent)`,
            }}
          >
            {stepNumber}
          </div>
        )}

        {/* Linked pulse ring */}
        {linked && (
          <div
            style={{
              position: "absolute",
              inset: -6,
              borderRadius: `calc(${theme.radius} + 4px)`,
              border: `2px solid ${theme.primary}`,
              opacity: 0.4,
              animation: "fp-pulse 2s ease-in-out infinite",
            }}
          />
        )}

        {/* Active node pulse ring */}
        {active && (
          <div
            style={{
              position: "absolute",
              inset: -6,
              borderRadius: `calc(${theme.radius} + 4px)`,
              border: `2px solid ${theme.primary}`,
              opacity: 0.3,
              animation: "fp-pulse 1.5s ease-out infinite",
            }}
          />
        )}

        <div
          style={{
            background: bg,
            border: `2px solid ${borderColor}`,
            borderRadius: theme.radius,
            padding: "10px 20px",
            display: "flex",
            alignItems: "center",
            gap: 6,
            boxShadow: shadow,
            transition: "all 0.3s ease",
            fontFamily: theme.fontSans,
            minWidth: 100,
            justifyContent: "center",
          }}
        >
          {/* State icon */}
          {done && (
            <span style={{ fontSize: 10, color: textColor }}>&#x2713;</span>
          )}
          {active && (
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#fff",
                animation: "fp-blink 1s ease-in-out infinite",
                flexShrink: 0,
              }}
            />
          )}
          {error && (
            <span style={{ fontSize: 10, color: textColor }}>&#x2717;</span>
          )}

          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: textColor,
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </span>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </>
  );
});
