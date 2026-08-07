import * as React from "react";
import { useEffect, useRef } from "react";

import { theme } from "../../theme";
import type { BaseComponentProps, StageSnapshot } from "../../types";
import { useExplainableRun } from "./ExplainableContext";

export interface TimelinePanelProps extends BaseComponentProps {
  readonly title?: string;
  readonly renderDetail?: (snapshot: StageSnapshot, index: number) => React.ReactNode;
}

function formatOffset(milliseconds: number): string {
  return milliseconds < 1000
    ? `+${Math.round(milliseconds)}ms`
    : `+${(milliseconds / 1000).toFixed(1)}s`;
}

export function TimelinePanel({
  title = "Timeline",
  renderDetail,
  unstyled = false,
  className,
  style,
}: TimelinePanelProps) {
  const { snapshots, selectedIndex, selectIndex, error } = useExplainableRun();
  const focusedRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    focusedRef.current?.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
  }, [selectedIndex]);

  if (unstyled) {
    return (
      <div className={className} style={style} data-fp="timeline-panel">
        {snapshots.map((snapshot, index) => (
          <button key={`${snapshot.runtimeStageId ?? snapshot.stageName}-${index}`} onClick={() => selectIndex(index)}>
            {snapshot.stageLabel}
          </button>
        ))}
      </div>
    );
  }

  return (
    <section
      className={className}
      data-fp="timeline-panel"
      style={{
        display: "flex",
        height: "100%",
        minHeight: 0,
        flexDirection: "column",
        overflow: "hidden",
        background: theme.bgSecondary,
        color: theme.textPrimary,
        fontFamily: theme.fontSans,
        ...style,
      }}
    >
      <header style={{ padding: "10px 12px", borderBottom: `1px solid ${theme.border}` }}>
        <strong style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>{title}</strong>
        <span style={{ marginLeft: 8, color: theme.textMuted, fontSize: 10 }}>
          {snapshots.length ? `${selectedIndex + 1} / ${snapshots.length}` : "0 stages"}
        </span>
      </header>
      <div role="listbox" aria-label={title} style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "6px 0 12px" }}>
        {snapshots.length === 0 ? (
          <p style={{ margin: 0, padding: 14, color: theme.textMuted, fontSize: 12 }}>
            {error ?? "This recording has no stages to walk."}
          </p>
        ) : snapshots.map((snapshot, index) => {
          const selected = index === selectedIndex;
          const visited = index < selectedIndex;
          return (
            <div key={`${snapshot.runtimeStageId ?? snapshot.stageName}-${index}`} ref={selected ? focusedRef : undefined}>
              <button
                type="button"
                role="option"
                aria-selected={selected}
                aria-label={`Go to stage ${index + 1}: ${snapshot.stageLabel}`}
                onClick={() => selectIndex(index)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "50px 18px 1fr",
                  gap: 9,
                  alignItems: "center",
                  width: "100%",
                  padding: "9px 12px",
                  border: 0,
                  borderLeft: selected ? `3px solid ${theme.warning}` : "3px solid transparent",
                  background: selected ? `color-mix(in srgb, ${theme.warning} 12%, transparent)` : "transparent",
                  color: selected ? theme.textPrimary : theme.textSecondary,
                  cursor: "pointer",
                  font: "inherit",
                  textAlign: "left",
                }}
              >
                <span style={{ color: theme.textMuted, fontFamily: theme.fontMono, fontSize: 10, textAlign: "right" }}>
                  {formatOffset(snapshot.startMs)}
                </span>
                <span
                  aria-hidden="true"
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    border: `2px solid ${selected ? theme.warning : visited ? theme.success : theme.border}`,
                    background: selected ? theme.warning : visited ? theme.success : theme.bgSecondary,
                    boxShadow: selected ? `0 0 0 4px color-mix(in srgb, ${theme.warning} 22%, transparent)` : undefined,
                  }}
                />
                <span>
                  <strong style={{ display: "block", fontSize: 12 }}>{snapshot.stageLabel}</strong>
                  <small style={{ color: theme.textMuted, fontFamily: theme.fontMono }}>
                    {snapshot.runtimeStageId ?? snapshot.stageName}
                  </small>
                </span>
              </button>
              {selected && (snapshot.description || renderDetail) ? (
                <div style={{ margin: "0 12px 10px 80px", color: theme.textSecondary, fontSize: 12, lineHeight: 1.5 }}>
                  {snapshot.description ? <p style={{ margin: "0 0 8px" }}>{snapshot.description}</p> : null}
                  {renderDetail?.(snapshot, index)}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
