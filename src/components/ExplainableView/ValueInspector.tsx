import * as React from "react";

import { theme } from "../../theme";
import type { BaseComponentProps } from "../../types";
import { MemoryPanel } from "../MemoryPanel";
import { useExplainableRun } from "./ExplainableContext";

export interface ValueInspectorProps extends BaseComponentProps {
  readonly title?: string;
}

export function ValueInspector({
  title = "Inspect values",
  size = "compact",
  unstyled = false,
  className,
  style,
}: ValueInspectorProps) {
  const { snapshots, selectedIndex, selectedSnapshot, error } = useExplainableRun();

  if (unstyled) {
    return (
      <div className={className} style={style} data-fp="value-inspector">
        <strong>{selectedSnapshot?.stageLabel ?? title}</strong>
        <MemoryPanel snapshots={snapshots} selectedIndex={selectedIndex} unstyled />
      </div>
    );
  }

  return (
    <section
      className={className}
      data-fp="value-inspector"
      style={{
        display: "flex",
        height: "100%",
        minHeight: 0,
        flexDirection: "column",
        overflow: "hidden",
        background: theme.bgPrimary,
        color: theme.textPrimary,
        fontFamily: theme.fontSans,
        ...style,
      }}
    >
      <header style={{ padding: "10px 12px", borderBottom: `1px solid ${theme.border}` }}>
        <strong style={{ display: "block", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>{title}</strong>
        {selectedSnapshot ? (
          <span style={{ display: "block", marginTop: 4, color: theme.textMuted, fontFamily: theme.fontMono, fontSize: 10 }}>
            {selectedSnapshot.stageLabel} · {selectedSnapshot.runtimeStageId ?? selectedSnapshot.stageName}
          </span>
        ) : null}
      </header>
      <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
        {snapshots.length ? (
          <MemoryPanel snapshots={snapshots} selectedIndex={selectedIndex} size={size} style={{ height: "100%" }} />
        ) : (
          <p style={{ padding: 14, color: theme.textMuted, fontSize: 12 }}>{error ?? "No values to inspect."}</p>
        )}
      </div>
    </section>
  );
}
