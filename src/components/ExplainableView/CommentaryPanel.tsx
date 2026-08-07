import * as React from "react";
import { useMemo, useRef, useEffect } from "react";

import { theme } from "../../theme";
import type { BaseComponentProps, NarrativeEntry } from "../../types";
import {
  buildEntryRangeIndex,
  computeRevealedEntryCount,
} from "../../utils/narrativeSync";
import { useExplainableRun } from "./ExplainableContext";

export interface CommentaryRenderContext {
  readonly index: number;
  readonly current: boolean;
}

export interface CommentaryPanelProps extends BaseComponentProps {
  readonly title?: string;
  readonly maxLines?: number;
  readonly renderEntry?: (
    entry: NarrativeEntry,
    context: CommentaryRenderContext,
  ) => React.ReactNode;
  readonly emptyMessage?: string;
}

export function CommentaryPanel({
  title = "Commentary",
  maxLines = 200,
  renderEntry,
  emptyMessage = "This recording carried no narrative commentary.",
  unstyled = false,
  className,
  style,
}: CommentaryPanelProps) {
  const { snapshots, selectedIndex, narrativeEntries } = useExplainableRun();
  const currentRef = useRef<HTMLDivElement | null>(null);
  const rangeIndex = useMemo(
    () => narrativeEntries.length ? buildEntryRangeIndex(narrativeEntries) : undefined,
    [narrativeEntries],
  );
  const revealedCount = useMemo(
    () => narrativeEntries.length
      ? computeRevealedEntryCount(
          narrativeEntries,
          snapshots,
          selectedIndex,
          rangeIndex,
        )
      : 0,
    [narrativeEntries, snapshots, selectedIndex, rangeIndex],
  );
  const dedupedEntries = useMemo(() => {
    const revealed = narrativeEntries.slice(0, revealedCount);
    return revealed.filter(
      (entry, index) => index === 0 || entry.text !== revealed[index - 1]?.text,
    );
  }, [narrativeEntries, revealedCount]);
  const visibleEntries = dedupedEntries.slice(
    Math.max(0, dedupedEntries.length - maxLines),
  );
  const hiddenCount = Math.max(0, dedupedEntries.length - visibleEntries.length);

  useEffect(() => {
    currentRef.current?.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
  }, [visibleEntries.length]);

  if (unstyled) {
    return (
      <div className={className} style={style} data-fp="commentary-panel" role="log">
        {visibleEntries.map((entry, index) => (
          <div key={`${entry.runtimeStageId ?? entry.stageId ?? entry.type}-${index}`}>
            {renderEntry?.(entry, { index, current: index === visibleEntries.length - 1 }) ?? entry.text}
          </div>
        ))}
      </div>
    );
  }

  return (
    <section
      className={className}
      data-fp="commentary-panel"
      style={{
        display: "flex",
        height: "100%",
        minHeight: 0,
        flexDirection: "column",
        overflow: "hidden",
        background: theme.bgElevated,
        color: theme.textPrimary,
        fontFamily: theme.fontSans,
        ...style,
      }}
    >
      <header style={{ padding: "10px 12px", borderBottom: `1px solid ${theme.border}` }}>
        <strong style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>{title}</strong>
        <span style={{ marginLeft: 8, color: theme.textMuted, fontSize: 10 }}>
          {revealedCount} of {narrativeEntries.length} lines
        </span>
      </header>
      <div role="log" aria-live="polite" style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "6px 12px" }}>
        {visibleEntries.length === 0 ? (
          <p style={{ color: theme.textMuted, fontSize: 12, fontStyle: "italic" }}>{emptyMessage}</p>
        ) : (
          <>
            {hiddenCount > 0 ? (
              <p style={{ color: theme.textMuted, fontSize: 11, fontStyle: "italic" }}>
                … {hiddenCount} earlier lines hidden; scrub backward to revisit them.
              </p>
            ) : null}
            {visibleEntries.map((entry, index) => {
              const current = index === visibleEntries.length - 1;
              return (
                <div
                  key={`${entry.runtimeStageId ?? entry.stageId ?? entry.type}-${index}`}
                  ref={current ? currentRef : undefined}
                  data-current={current}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "82px 1fr",
                    gap: 10,
                    padding: "7px 8px",
                    borderBottom: `1px solid ${theme.border}`,
                    borderLeft: current ? `3px solid ${theme.warning}` : "3px solid transparent",
                    background: current ? `color-mix(in srgb, ${theme.warning} 14%, transparent)` : "transparent",
                    color: current ? theme.textPrimary : theme.textSecondary,
                    lineHeight: 1.55,
                  }}
                >
                  <span style={{ color: current ? theme.warning : theme.textMuted, fontFamily: theme.fontMono, fontSize: 10 }}>
                    {entry.type}
                  </span>
                  <div style={{ fontSize: 12 }}>
                    {renderEntry?.(entry, { index, current }) ?? entry.text}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </section>
  );
}
