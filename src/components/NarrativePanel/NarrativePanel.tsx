/**
 * NarrativePanel — Recorder-based view of pipeline execution.
 *
 * Renders the execution narrative with progressive reveal synced to
 * snapshot index. Prefers structured NarrativeEntries (from
 * CombinedNarrativeRecorder) when available, falls back to plain
 * narrative lines built from per-stage snapshot.narrative fields.
 *
 * Data source: FlowRecorder (fires AFTER stage execution)
 */
import { useMemo } from "react";
import type { StageSnapshot, NarrativeEntry, BaseComponentProps } from "../../types";
import { theme, fontSize, padding } from "../../theme";
import { StoryNarrative } from "../StoryNarrative";
import { NarrativeTrace } from "../NarrativeTrace";

export interface NarrativePanelProps extends BaseComponentProps {
  snapshots: StageSnapshot[];
  selectedIndex: number;
  /** Structured narrative entries (preferred — richer rendering) */
  narrativeEntries?: NarrativeEntry[];
  /** Plain narrative lines (fallback) */
  narrative?: string[];
}

export function NarrativePanel({
  snapshots,
  selectedIndex,
  narrativeEntries,
  narrative: narrativeProp,
  size = "default",
  unstyled = false,
  className,
  style,
}: NarrativePanelProps) {
  const fs = fontSize[size];
  const pad = padding[size];

  // Build plain narrative from snapshots if not provided
  const narrative = useMemo<string[]>(() => {
    if (narrativeProp && narrativeProp.length > 0) return narrativeProp;
    const lines: string[] = [];
    for (const snap of snapshots) {
      const stageLines = (snap.narrative ?? "").split("\n").filter(Boolean);
      lines.push(...stageLines);
    }
    return lines;
  }, [narrativeProp, snapshots]);

  // Progressive reveal for plain narrative
  const revealedCount = useMemo(() => {
    if (snapshots.length === 0 || narrative.length === 0) return narrative.length;
    const stageBoundaries: number[] = [];
    for (let i = 0; i < narrative.length; i++) {
      const trimmed = narrative[i].trimStart();
      if (trimmed.startsWith("Stage ") && !trimmed.match(/^Stage\s+\d+:\s*Step\s/)) {
        stageBoundaries.push(i);
      }
    }
    if (stageBoundaries.length === 0) {
      const ratio = (selectedIndex + 1) / snapshots.length;
      return Math.max(1, Math.ceil(narrative.length * ratio));
    }
    const groupsToShow = Math.min(selectedIndex + 1, stageBoundaries.length);
    const endIdx = groupsToShow < stageBoundaries.length
      ? stageBoundaries[groupsToShow]
      : narrative.length;
    return Math.max(1, endIdx);
  }, [snapshots.length, selectedIndex, narrative]);

  const hasStructured = narrativeEntries && narrativeEntries.length > 0;

  if (unstyled) {
    return (
      <div className={className} style={style} data-fp="narrative-panel">
        {hasStructured ? (
          <StoryNarrative entries={narrativeEntries!} stageCount={selectedIndex + 1} unstyled />
        ) : (
          <NarrativeTrace narrative={narrative} revealedCount={revealedCount} unstyled />
        )}
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
        ...style,
      }}
      data-fp="narrative-panel"
    >
      {/* Intro */}
      <div
        style={{
          padding: `${pad - 4}px ${pad}px`,
          fontSize: fs.small,
          color: theme.textMuted,
          fontStyle: "italic",
          borderBottom: `1px solid ${theme.border}`,
          flexShrink: 0,
        }}
      >
        What happened at each stage, what data flowed, what decisions were made, and why.
      </div>
      {hasStructured ? (
        <StoryNarrative
          entries={narrativeEntries!}
          stageCount={selectedIndex + 1}
          size={size}
          style={{ flex: 1 }}
        />
      ) : (
        <NarrativeTrace
          narrative={narrative}
          revealedCount={revealedCount}
          size={size}
          style={{ flex: 1 }}
        />
      )}
    </div>
  );
}
