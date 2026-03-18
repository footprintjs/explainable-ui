import { memo, useEffect, useRef } from "react";
import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import { theme } from "../../theme";

const KEYFRAMES_ID = "fp-stage-node-keyframes";
const KEYFRAMES_CSS = `
@media (prefers-reduced-motion: no-preference) {
  @keyframes fp-pulse {
    0%, 100% { opacity: 0.4; transform: scale(1); }
    50% { opacity: 0.15; transform: scale(1.06); }
  }
  @keyframes fp-blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
}
@media (prefers-reduced-motion: reduce) {
  @keyframes fp-pulse { 0%, 100% { opacity: 0.3; } }
  @keyframes fp-blink { 0%, 100% { opacity: 1; } }
}
`;

export interface StageNodeData {
  label: string;
  active?: boolean;
  done?: boolean;
  error?: boolean;
  linked?: boolean;
  /** Semantic icon hint (e.g., "llm", "tool", "rag", "start", "parse", "agent", "guard") */
  icon?: string;
  /** Step numbers in execution order (shown as badges — multiple when revisited via loops) */
  stepNumbers?: number[];
  /** Node was not executed (dim it) */
  dimmed?: boolean;
  /** Node is a subflow root (show nested indicator) */
  isSubflow?: boolean;
  /** Node uses lazy resolution (dashed border + cloud icon when unresolved) */
  isLazy?: boolean;
  /** Node is a decider (renders as diamond shape per flowchart convention) */
  isDecider?: boolean;
  /** Node is a fork (parallel fan-out) */
  isFork?: boolean;
  /** Human-readable description of what this stage does */
  description?: string;
  /** Subflow identifier — set when this node belongs to a subflow */
  subflowId?: string;
  [key: string]: unknown;
}

// ── Stage icon SVGs ───────────────────────────────────────────────────────
// Inline SVGs for crisp rendering at any size. Consumers pass a string key
// via SpecNode.icon; StageNode renders the matching mini-icon.

const ICON_SIZE = 16;

function StageIcon({ type, color }: { type: string; color: string }) {
  const s = ICON_SIZE;
  const props = { width: s, height: s, viewBox: `0 0 ${s} ${s}`, fill: "none", style: { flexShrink: 0 } as const };

  switch (type) {
    // LLM / AI call — brain/sparkle
    case "llm":
    case "ai":
      return (
        <svg {...props}>
          <circle cx="8" cy="8" r="6" stroke={color} strokeWidth="1.5" />
          <path d="M5.5 8C5.5 6.5 6.5 5 8 5S10.5 6.5 10.5 8" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="8" cy="9.5" r="1" fill={color} />
          <line x1="8" y1="2" x2="8" y2="3.5" stroke={color} strokeWidth="1" strokeLinecap="round" />
          <line x1="12.5" y1="4" x2="11.2" y2="5" stroke={color} strokeWidth="1" strokeLinecap="round" />
          <line x1="3.5" y1="4" x2="4.8" y2="5" stroke={color} strokeWidth="1" strokeLinecap="round" />
        </svg>
      );

    // Tool / function call — gear
    case "tool":
    case "function":
      return (
        <svg {...props}>
          <circle cx="8" cy="8" r="3" stroke={color} strokeWidth="1.5" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            const x1 = 8 + Math.cos(rad) * 4.5;
            const y1 = 8 + Math.sin(rad) * 4.5;
            const x2 = 8 + Math.cos(rad) * 6;
            const y2 = 8 + Math.sin(rad) * 6;
            return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="1.5" strokeLinecap="round" />;
          })}
        </svg>
      );

    // RAG / retrieval — magnifying glass + doc
    case "rag":
    case "search":
    case "retrieval":
      return (
        <svg {...props}>
          <circle cx="7" cy="7" r="4" stroke={color} strokeWidth="1.5" />
          <line x1="10" y1="10" x2="13.5" y2="13.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          <line x1="5.5" y1="6" x2="8.5" y2="6" stroke={color} strokeWidth="1" strokeLinecap="round" />
          <line x1="5.5" y1="8" x2="7.5" y2="8" stroke={color} strokeWidth="1" strokeLinecap="round" />
        </svg>
      );

    // Parse / process — diamond with arrows
    case "parse":
    case "process":
    case "transform":
      return (
        <svg {...props}>
          <rect x="4" y="4" width="8" height="8" rx="1.5" stroke={color} strokeWidth="1.5" transform="rotate(45 8 8)" />
        </svg>
      );

    // Start / seed — play triangle
    case "start":
    case "seed":
    case "init":
      return (
        <svg {...props}>
          <path d="M5 3.5L12.5 8L5 12.5V3.5Z" fill={color} opacity="0.8" />
        </svg>
      );

    // End / finalize — stop square
    case "end":
    case "finalize":
    case "output":
      return (
        <svg {...props}>
          <rect x="4" y="4" width="8" height="8" rx="1.5" fill={color} opacity="0.8" />
        </svg>
      );

    // Agent — person silhouette
    case "agent":
    case "orchestrator":
      return (
        <svg {...props}>
          <circle cx="8" cy="5" r="2.5" stroke={color} strokeWidth="1.5" />
          <path d="M3.5 14C3.5 11 5.5 9 8 9S12.5 11 12.5 14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    // Swarm — multi-agent
    case "swarm":
    case "multi-agent":
      return (
        <svg {...props}>
          <circle cx="5" cy="5" r="2" stroke={color} strokeWidth="1.2" />
          <circle cx="11" cy="5" r="2" stroke={color} strokeWidth="1.2" />
          <circle cx="8" cy="11" r="2" stroke={color} strokeWidth="1.2" />
          <line x1="5" y1="7" x2="8" y2="9" stroke={color} strokeWidth="1" opacity="0.5" />
          <line x1="11" y1="7" x2="8" y2="9" stroke={color} strokeWidth="1" opacity="0.5" />
        </svg>
      );

    // Guard / guardrail — shield
    case "guard":
    case "guardrail":
    case "validate":
      return (
        <svg {...props}>
          <path d="M8 2L3 5V9C3 11.5 5 13.5 8 14.5C11 13.5 13 11.5 13 9V5L8 2Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M6 8L7.5 9.5L10 6.5" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    // Stream — wave
    case "stream":
    case "streaming":
      return (
        <svg {...props}>
          <path d="M2 8C4 5 6 11 8 8S12 5 14 8" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <path d="M2 11C4 8 6 14 8 11S12 8 14 11" stroke={color} strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.5" />
        </svg>
      );

    // Memory / state — database cylinder
    case "memory":
    case "state":
    case "db":
      return (
        <svg {...props}>
          <ellipse cx="8" cy="4.5" rx="5" ry="2" stroke={color} strokeWidth="1.3" />
          <line x1="3" y1="4.5" x2="3" y2="11.5" stroke={color} strokeWidth="1.3" />
          <line x1="13" y1="4.5" x2="13" y2="11.5" stroke={color} strokeWidth="1.3" />
          <ellipse cx="8" cy="11.5" rx="5" ry="2" stroke={color} strokeWidth="1.3" />
        </svg>
      );

    // Loop — circular arrow
    case "loop":
    case "retry":
      return (
        <svg {...props}>
          <path d="M12 8A4 4 0 1 1 8 4" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <path d="M8 1.5L10.5 4L8 6.5" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      );

    // Lazy / service — cloud (deferred resolution, loaded on demand)
    case "lazy":
    case "service":
    case "cloud":
      return (
        <svg {...props}>
          <path
            d="M4.5 12C2.8 12 1.5 10.7 1.5 9C1.5 7.5 2.5 6.3 3.8 6C4 4 5.8 2.5 8 2.5C9.8 2.5 11.3 3.5 11.9 5C13.9 5.2 15.5 6.8 15.5 8.8C15.5 10.8 13.9 12.5 11.8 12.5H4.5"
            stroke={color}
            strokeWidth="1.3"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      );

    // Decision — diamond (already handled by isDecider shape)
    case "decision":
    case "router":
      return (
        <svg {...props}>
          <path d="M8 2L14 8L8 14L2 8Z" stroke={color} strokeWidth="1.5" fill="none" />
          <circle cx="8" cy="8" r="1.5" fill={color} />
        </svg>
      );

    default:
      return null;
  }
}

/**
 * Custom ReactFlow node for pipeline stages.
 * All colors and fonts come from `--fp-*` CSS variables (via theme).
 * Shows execution state via color, icon, step badge, and pulse animation.
 */
export const StageNode = memo(function StageNode({
  data,
}: NodeProps & { data: StageNodeData }) {
  const { label, active, done, error, linked, icon, stepNumbers, dimmed, isSubflow, isLazy, isDecider, isFork, description } = data;

  // Lazy nodes show cloud icon by default (unless another icon is specified)
  const effectiveIcon = icon || (isLazy ? "lazy" : undefined);
  // Lazy + unresolved = dashed border
  const isLazyUnresolved = isLazy && !done && !active;

  // Inject keyframes once into document head
  const injectedRef = useRef(false);
  useEffect(() => {
    if (injectedRef.current) return;
    if (typeof document !== "undefined" && !document.getElementById(KEYFRAMES_ID)) {
      const styleEl = document.createElement("style");
      styleEl.id = KEYFRAMES_ID;
      styleEl.textContent = KEYFRAMES_CSS;
      document.head.appendChild(styleEl);
    }
    injectedRef.current = true;
  }, []);

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
              borderRadius: isDecider ? 0 : `calc(${theme.radius} + 4px)`,
              transform: isDecider ? "rotate(45deg)" : undefined,
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
              borderRadius: isDecider ? 0 : `calc(${theme.radius} + 4px)`,
              transform: isDecider ? "rotate(45deg)" : undefined,
              border: `2px solid ${theme.primary}`,
              opacity: 0.3,
              animation: "fp-pulse 1.5s ease-out infinite",
            }}
          />
        )}

        {/* Diamond wrapper for decider nodes — rotated 45deg */}
        {isDecider ? (
          <div
            style={{
              background: bg,
              border: `2px ${isLazyUnresolved ? "dashed" : "solid"} ${borderColor}`,
              borderRadius: 4,
              transform: "rotate(45deg)",
              padding: 20,
              boxShadow: shadow,
              transition: "all 0.3s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Counter-rotate content so text/icons stay upright */}
            <div
              style={{
                transform: "rotate(-45deg)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                fontFamily: theme.fontSans,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                {icon && <StageIcon type={icon} color={textColor} />}
                {!icon && (
                  <span style={{ fontSize: 10, color: textColor }}>&#x25C7;</span>
                )}
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: textColor,
                    whiteSpace: "nowrap",
                  }}
                >
                  {label}
                </span>
              </div>
              {description && (
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 400,
                    color: textColor,
                    opacity: 0.7,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: 130,
                  }}
                >
                  {description}
                </span>
              )}
            </div>
          </div>
        ) : (
          /* Standard rectangular node */
          <div
            style={{
              background: bg,
              border: `2px ${isLazyUnresolved ? "dashed" : "solid"} ${borderColor}`,
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
              {/* Semantic icon (lazy nodes default to cloud icon) */}
              {effectiveIcon && <StageIcon type={effectiveIcon} color={textColor} />}

              {/* State icon */}
              {done && !effectiveIcon && (
                <span style={{ fontSize: 10, color: textColor }}>&#x2713;</span>
              )}
              {active && !effectiveIcon && (
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
              {error && !effectiveIcon && (
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
        )}
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
