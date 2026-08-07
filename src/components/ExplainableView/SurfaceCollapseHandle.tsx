import * as React from "react";

import { theme } from "../../theme";

export interface SurfaceCollapseHandleProps {
  readonly label?: string;
  readonly expanded: boolean;
  readonly orientation?: "vertical" | "horizontal";
  readonly onToggle: () => void;
  readonly className?: string;
  readonly style?: React.CSSProperties;
  readonly unstyled?: boolean;
}

export function SurfaceCollapseHandle({
  label = "Details",
  expanded,
  orientation = "vertical",
  onToggle,
  className,
  style,
  unstyled = false,
}: SurfaceCollapseHandleProps) {
  const action = expanded ? "Collapse" : "Expand";
  if (unstyled) {
    return (
      <button
        aria-expanded={expanded}
        aria-label={`${action} ${label.toLowerCase()}`}
        className={className}
        data-fp="surface-collapse-handle"
        onClick={onToggle}
        style={style}
        type="button"
      >
        {action} {label}
      </button>
    );
  }

  const vertical = orientation === "vertical";
  return (
    <div
      className={className}
      data-fp="surface-collapse-handle"
      data-orientation={orientation}
      style={{
        display: "flex",
        minWidth: 0,
        minHeight: 0,
        flexDirection: vertical ? "column" : "row",
        alignItems: "center",
        ...style,
      }}
    >
      <div style={vertical
        ? { flex: 1, width: 1, background: theme.border }
        : { flex: 1, height: 1, background: theme.border }}
      />
      <button
        aria-expanded={expanded}
        aria-label={`${action} ${label.toLowerCase()}`}
        onClick={onToggle}
        type="button"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          margin: vertical ? "0 3px" : "4px 0",
          padding: vertical ? "10px 4px" : "3px 12px",
          border: `1px solid ${theme.border}`,
          borderRadius: 10,
          background: theme.bgSecondary,
          color: theme.textMuted,
          cursor: "pointer",
          fontFamily: "inherit",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          writingMode: vertical ? "vertical-lr" : "horizontal-tb",
        }}
      >
        <span style={{ fontSize: 7, writingMode: "horizontal-tb" }}>
          {vertical ? (expanded ? "▶" : "◀") : expanded ? "▼" : "▶"}
        </span>
        {label}
      </button>
      <div style={vertical
        ? { flex: 1, width: 1, background: theme.border }
        : { flex: 1, height: 1, background: theme.border }}
      />
    </div>
  );
}
