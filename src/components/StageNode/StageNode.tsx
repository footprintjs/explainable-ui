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
  /** Step numbers in execution order (shown as badges — multiple when revisited via loops) */
  stepNumbers?: number[];
  /** Node was not executed (dim it) */
  dimmed?: boolean;
  /** Node is a subflow root (show nested indicator) */
  isSubflow?: boolean;
  /** Human-readable description of what this stage does */
  description?: string;
  /** Subflow identifier — set when this node belongs to a subflow */
  subflowId?: string;
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
  const { label, active, done, error, linked, stepNumbers, dimmed, isSubflow, description } = data;

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
        {/* Step number badges — multiple when revisited via loops */}
        {stepNumbers && stepNumbers.length > 0 && isOnPath && (
          <div
            style={{
              position: "absolute",
              top: -10,
              left: -10,
              display: "flex",
              gap: 3,
              zIndex: 10,
            }}
          >
            {stepNumbers.map((num, i) => {
              const isLatest = i === stepNumbers.length - 1;
              const badgeBg = isLatest && active ? theme.primary : theme.success;
              const glow = isLatest && active
                ? `color-mix(in srgb, ${theme.primary} 50%, transparent)`
                : `color-mix(in srgb, ${theme.success} 40%, transparent)`;
              return (
                <div
                  key={num}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: badgeBg,
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: `0 0 8px ${glow}`,
                  }}
                >
                  {num}
                </div>
              );
            })}
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
            padding: description ? "8px 16px" : "10px 20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: description ? 2 : 0,
            boxShadow: shadow,
            transition: "all 0.3s ease",
            fontFamily: theme.fontSans,
            minWidth: 100,
            justifyContent: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
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
            {/* Subflow indicator — nested boxes icon */}
            {isSubflow && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 16,
                  height: 16,
                  borderRadius: 3,
                  border: `1.5px solid ${textColor}`,
                  position: "relative",
                  opacity: 0.7,
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    border: `1px solid ${textColor}`,
                  }}
                />
              </span>
            )}
          </div>
          {/* Description subtitle */}
          {description && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 400,
                color: textColor,
                opacity: 0.7,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: 160,
              }}
            >
              {description}
            </span>
          )}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
      {/* Right-side handles for loop-back edges (so they don't overlap center edges) */}
      <Handle
        id="loop-source"
        type="source"
        position={Position.Right}
        style={{ background: "transparent", border: "none", width: 6, height: 6 }}
      />
      <Handle
        id="loop-target"
        type="target"
        position={Position.Right}
        style={{ background: "transparent", border: "none", width: 6, height: 6 }}
      />
    </>
  );
});
