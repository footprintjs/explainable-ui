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
import { useMemo, useState, useCallback } from "react";
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

  // ── Copy as LLM-ready text ─────────────────────────────────────────────
  const [copied, setCopied] = useState(false);

  const buildLLMNarrative = useCallback(() => {
    if (!narrativeEntries?.length) {
      return narrative.join("\n");
    }

    // ── Partition entries: root vs subflow internals ─────────────────
    // Root includes: stages, subflow entry/exit markers, decisions, loops, breaks
    // Subflow internals: entries with subflowId that aren't entry/exit markers
    const root: NarrativeEntry[] = [];
    const subflows = new Map<string, NarrativeEntry[]>();
    const subflowNames = new Map<string, string>(); // sfId → display name

    for (const entry of narrativeEntries) {
      const sfId = (entry as { subflowId?: string }).subflowId;
      if (!sfId) {
        root.push(entry);
      } else {
        // Subflow ENTRY markers go in root (show WHEN the subflow ran).
        // Exit markers ("Done: X") are noise — the next stage implies completion.
        if (entry.type === "subflow") {
          const isExit = entry.text.startsWith("Done:") || entry.text.startsWith("Exiting");
          if (!isExit) {
            root.push(entry);
          }
          // Track name for the subflow details header
          if (entry.stageName && !isExit) {
            subflowNames.set(sfId, entry.stageName);
          }
        } else {
          // Internal subflow entries go in the subflow detail section
          if (!subflows.has(sfId)) subflows.set(sfId, []);
          subflows.get(sfId)!.push(entry);
        }
      }
    }

    // ── Render a list of entries as numbered text ────────────────────
    // Uses only entry.text (already rendered by the NarrativeRenderer).
    // No type prefix — the renderer output IS the narrative.
    const renderEntries = (entries: NarrativeEntry[], opts?: { inSubflow?: string }): string => {
      let counter = 0;
      const lines: string[] = [];

      for (const e of entries) {
        // Skip subflow entry/exit in subflow details (redundant — we're already in the section)
        if (opts?.inSubflow && e.type === "subflow") continue;

        let text = e.text;

        // Strip subflow path prefix from stage names inside subflow details.
        // e.g., "[sf-system-prompt/ResolvePrompt]" → "[ResolvePrompt]"
        // The section header already identifies the subflow.
        if (opts?.inSubflow) {
          text = text.replace(new RegExp(`\\[${opts.inSubflow}/`), "[");
        }

        const isHeading = e.type === "stage" || e.type === "subflow" || e.type === "fork" || e.type === "selector";

        if (isHeading) {
          counter++;
          // For subflow markers in root, append the subflow ID for drill-down
          const sfId = (e as { subflowId?: string }).subflowId;
          const idSuffix = e.type === "subflow" && sfId ? ` [→ ${sfId}]` : "";
          lines.push(`${counter}. ${text}${idSuffix}`);
        } else {
          // Sub-items (steps, conditions, loops, breaks, errors) — indented
          lines.push(`  ${text}`);
        }
      }

      return lines.join("\n");
    };

    // ── Assemble the full LLM-ready document ────────────────────────
    const sections: string[] = [];
    sections.push("## Execution Narrative\n");
    sections.push(renderEntries(root));

    if (subflows.size > 0) {
      sections.push("\n\n## Subflow Details");
      sections.push("Use the subflow IDs above to look up details below.\n");
      for (const [sfId, entries] of subflows) {
        const name = subflowNames.get(sfId) ?? sfId;
        sections.push(`### ${name} (${sfId})\n`);
        sections.push(renderEntries(entries, { inSubflow: sfId }));
        sections.push("");
      }
    }

    return sections.join("\n");
  }, [narrativeEntries, narrative]);

  const handleCopy = useCallback(async () => {
    const text = buildLLMNarrative();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [buildLLMNarrative]);

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
      {/* Intro + Copy button */}
      <div
        style={{
          padding: `${pad - 4}px ${pad}px`,
          fontSize: fs.small,
          color: theme.textMuted,
          borderBottom: `1px solid ${theme.border}`,
          flexShrink: 0,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontStyle: "italic" }}>
          What happened at each stage, what data flowed, what decisions were made, and why.
        </span>
        <button
          onClick={handleCopy}
          title="Copy narrative as LLM-ready text (includes subflow details)"
          style={{
            background: copied ? theme.success : theme.bgSecondary,
            border: `1px solid ${theme.border}`,
            borderRadius: 4,
            padding: "2px 8px",
            fontSize: fs.small,
            color: copied ? "#fff" : theme.textSecondary,
            cursor: "pointer",
            flexShrink: 0,
            marginLeft: 8,
            transition: "all 0.2s",
          }}
        >
          {copied ? "Copied!" : "Copy for LLM"}
        </button>
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
