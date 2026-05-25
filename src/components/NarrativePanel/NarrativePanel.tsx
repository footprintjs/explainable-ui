/**
 * NarrativePanel — Recorder-based view of pipeline execution.
 *
 * Renders the execution narrative with progressive reveal synced to
 * snapshot index. Consumes structured NarrativeEntries (from
 * CombinedNarrativeRecorder) — the primary data source. Falls back to
 * per-stage `snapshot.narrative` fields (built by the runtime adapter)
 * when no entries are supplied.
 *
 * Data source: FlowRecorder (fires AFTER stage execution)
 */
import { useMemo, useState, useCallback } from "react";
import type { StageSnapshot, NarrativeEntry, BaseComponentProps } from "../../types";
import { theme, fontSize, padding } from "../../theme";
import { buildEntryRangeIndex, computeRevealedEntryCount } from "../../utils/narrativeSync";
import { StoryNarrative } from "../StoryNarrative";
import { NarrativeTrace } from "../NarrativeTrace";

/**
 * JSON.stringify with a circular-ref sentinel and a size cap — snapshots
 * can contain cycles (runtime stages reference each other) and can grow
 * multi-megabyte. A strict JSON.stringify would throw; the clipboard cap
 * stops "Copy for LLM" from dumping 20MB of tool history into a paste.
 */
function safeJsonStringify(value: unknown): string {
  const seen = new WeakSet<object>();
  const MAX_CHARS = 500_000;
  try {
    let text = JSON.stringify(
      value,
      (_key, v) => {
        if (typeof v === "object" && v !== null) {
          if (seen.has(v as object)) return "[Circular]";
          seen.add(v as object);
        }
        return v;
      },
      2,
    );
    if (text && text.length > MAX_CHARS) {
      text = text.slice(0, MAX_CHARS) + `\n... [truncated at ${MAX_CHARS} chars]`;
    }
    return text ?? "undefined";
  } catch (err) {
    return `[stringify error: ${err instanceof Error ? err.message : String(err)}]`;
  }
}

export interface NarrativePanelProps extends BaseComponentProps {
  snapshots: StageSnapshot[];
  selectedIndex: number;
  /** Structured narrative entries (primary source — richer rendering).
   *  When absent, falls back to per-stage `snapshot.narrative` lines. */
  narrativeEntries?: NarrativeEntry[];
  /**
   * Full runtime snapshot from the runner (executor.getSnapshot() /
   * agent.getSnapshot()). When present, "Copy for LLM" includes the
   * commit log, final shared state, and recorder snapshots alongside
   * the rendered narrative. Without it, only the rendered text is
   * copied — useful but misses the tool-call payloads and state
   * transitions needed to debug why a run failed.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  runtimeSnapshot?: any;
  /**
   * Flowchart spec from the runner (executor.getSpec() / agent.getSpec()).
   * When present, "Copy for LLM" appends the topology so the LLM can
   * see which node was running at each step — not just the narrative.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  spec?: any;
}

export function NarrativePanel({
  snapshots,
  selectedIndex,
  narrativeEntries,
  runtimeSnapshot,
  spec,
  size = "default",
  unstyled = false,
  className,
  style,
}: NarrativePanelProps) {
  const fs = fontSize[size];
  const pad = padding[size];

  // Build plain narrative lines from per-stage snapshot.narrative.
  // Used as fallback when narrativeEntries is empty, and for the
  // progressive-reveal text view in the legacy code path.
  const narrative = useMemo<string[]>(() => {
    const lines: string[] = [];
    for (const snap of snapshots) {
      const stageLines = (snap.narrative ?? "").split("\n").filter(Boolean);
      lines.push(...stageLines);
    }
    return lines;
  }, [snapshots]);

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

  // Precompute range index once when entries change — O(n) build, then O(1) per slider tick.
  // Same shape as SequenceRecorder.getEntryRanges() in footprintjs.
  const rangeIndex = useMemo(
    () => narrativeEntries?.length ? buildEntryRangeIndex(narrativeEntries) : undefined,
    [narrativeEntries],
  );

  // Exact sync via runtimeStageId — O(selectedIndex) with precomputed index.
  const revealedEntryCount = useMemo(
    () => narrativeEntries?.length ? computeRevealedEntryCount(narrativeEntries, snapshots, selectedIndex, rangeIndex) : 0,
    [narrativeEntries, snapshots, selectedIndex, rangeIndex],
  );

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
      const sfId = entry.subflowId;
      if (!sfId) {
        root.push(entry);
      } else {
        // Subflow ENTRY markers go in root (show WHEN the subflow ran).
        // Exit markers are noise — the next stage implies completion.
        if (entry.type === "subflow") {
          const isExit = entry.direction === 'exit';
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
        // Uses literal string replacement (not regex) to avoid injection from special characters.
        if (opts?.inSubflow) {
          const prefix = `[${opts.inSubflow}/`;
          const idx = text.indexOf(prefix);
          if (idx !== -1) {
            text = text.slice(0, idx) + "[" + text.slice(idx + prefix.length);
          }
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

    // ── Append the full debug bundle when caller provided snapshot/spec ──
    // Everything below the narrative is for LLM debugging: final state,
    // per-stage commit log (shows EXACTLY what each stage wrote), spec
    // topology, and any recorder snapshots (metrics, tokens, instructions,
    // emit events). Without these the story has no payloads to reason over.
    if (runtimeSnapshot) {
      const snap = runtimeSnapshot as {
        sharedState?: unknown;
        commitLog?: unknown;
        recorders?: unknown;
        subflowResults?: unknown;
      };

      if (snap.sharedState !== undefined) {
        sections.push("\n\n## Final Shared State");
        sections.push("```json");
        sections.push(safeJsonStringify(snap.sharedState));
        sections.push("```");
      }

      if (Array.isArray(snap.commitLog) && snap.commitLog.length > 0) {
        sections.push("\n\n## Commit Log");
        sections.push(
          "Each entry = one stage execution's writes to shared state. " +
            "`rsid` is the runtimeStageId (use it to correlate with narrative + executionTree).\n",
        );
        sections.push("```json");
        sections.push(safeJsonStringify(snap.commitLog));
        sections.push("```");
      }

      if (snap.recorders && typeof snap.recorders === "object") {
        sections.push("\n\n## Recorder Snapshots");
        sections.push(
          "Per-recorder data captured DURING the run (metrics, tokens, instructions, emit events).\n",
        );
        sections.push("```json");
        sections.push(safeJsonStringify(snap.recorders));
        sections.push("```");
      }

      if (snap.subflowResults && typeof snap.subflowResults === "object") {
        const keys = Object.keys(snap.subflowResults as Record<string, unknown>);
        if (keys.length > 0) {
          sections.push("\n\n## Subflow Results");
          sections.push("```json");
          sections.push(safeJsonStringify(snap.subflowResults));
          sections.push("```");
        }
      }
    }

    if (spec) {
      sections.push("\n\n## Flowchart Spec (topology)");
      sections.push(
        "Node + edge metadata for the chart that ran. Useful for 'where in " +
          "the graph did step N happen?' questions.\n",
      );
      sections.push("```json");
      sections.push(safeJsonStringify(spec));
      sections.push("```");
    }

    return sections.join("\n");
  }, [narrativeEntries, narrative, runtimeSnapshot, spec]);

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
