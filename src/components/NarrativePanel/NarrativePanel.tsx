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

  // Position-based sync: for each snapshot, find the range of entries that belong
  // to it by matching snapshot stageLabel/stageName against entry stageId/stageName.
  // Handles loops (same stageId at different positions) correctly because we walk
  // entries sequentially and consume matches in order.
  const revealedEntryCount = useMemo(() => {
    if (!narrativeEntries?.length || snapshots.length === 0) return 0;

    // For each snapshot up to selectedIndex, find entries that belong to it.
    // Walk entries sequentially — each entry is consumed once.
    let entryIdx = 0;
    for (let si = 0; si <= selectedIndex && si < snapshots.length; si++) {
      const snap = snapshots[si];
      const keys = new Set<string>();
      if (snap.stageLabel) keys.add(snap.stageLabel);
      if (snap.stageName) keys.add(snap.stageName);
      if (snap.subflowId) keys.add(snap.subflowId);

      // Advance past entries that match this snapshot's keys
      // First, find the start of this snapshot's entries
      let found = false;
      for (let j = entryIdx; j < narrativeEntries.length; j++) {
        const e = narrativeEntries[j] as { stageId?: string; subflowId?: string; stageName?: string };
        const eKey = e.stageId ?? e.subflowId ?? e.stageName;
        if (eKey && keys.has(eKey)) {
          found = true;
          entryIdx = j;
          break;
        }
        // Entries with no key belong to previous snapshot — include them
        if (!eKey && !found) {
          // Keep advancing
        }
      }

      if (!found) continue;

      // Now consume all consecutive entries that belong to this snapshot
      while (entryIdx < narrativeEntries.length) {
        const e = narrativeEntries[entryIdx] as { stageId?: string; subflowId?: string; stageName?: string };
        const eKey = e.stageId ?? e.subflowId ?? e.stageName;
        if (eKey && !keys.has(eKey)) break; // next snapshot's entry
        entryIdx++;
      }
    }
    return entryIdx;
  }, [narrativeEntries, snapshots, selectedIndex]);

  const hasStructured = narrativeEntries && narrativeEntries.length > 0;

  if (unstyled) {
    return (
      <div className={className} style={style} data-fp="narrative-panel">
        {hasStructured ? (
          <StoryNarrative entries={narrativeEntries!} revealedEntryCount={revealedEntryCount} unstyled />
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
          revealedEntryCount={revealedEntryCount}
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
