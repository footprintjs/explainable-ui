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
import { theme, componentStyles, FootprintButton, FootprintCheckbox } from "../../theme";
import { buildEntryRangeIndex, computeRevealedEntryCount, narrativeSynchronizationStatus } from "../../utils/narrativeSync";
import { StoryNarrative } from "../StoryNarrative";
import { NarrativeTrace } from "../NarrativeTrace";
import { formatRecordedValue } from "../../recordedValues";
import { ownDataField } from "../../trace/safeRecordRead";

/** Bounded inert previews; native values use typed display extensions. */
const safeJsonStringify = (value: unknown) => formatRecordedValue(value, { indent: 2, maxChars: 500_000, maxItems: 10_000, maxDepth: 64 });

export interface NarrativePanelProps extends BaseComponentProps {
  snapshots: StageSnapshot[];
  selectedIndex: number;
  /** Structured narrative entries (primary source — richer rendering).
   *  When absent, falls back to per-stage `snapshot.narrative` lines. */
  narrativeEntries?: NarrativeEntry[];
  /** The subflow `narrativeEntries` were scoped to, when this panel is showing
   *  a drilled-in level. Forwarded to `<StoryNarrative scopeSubflowId>` so the
   *  level's own stages are shown instead of hidden as "subflow internals". */
  scopeSubflowId?: string;
  /** Expanded recorded entries, or readable groups of exact recorded visits. */
  presentation?: "entries" | "visits";
  /** Opt into following the selected step. Reading never scrolls by default. */
  defaultFollowCursor?: boolean;
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
  scopeSubflowId,
  presentation = "entries",
  defaultFollowCursor = false,
  runtimeSnapshot,
  spec,
  size = "default",
  unstyled = false,
  className,
  style,
}: NarrativePanelProps) {
  const chrome = componentStyles(size);
  const sx = (value: React.CSSProperties): React.CSSProperties | undefined => unstyled ? undefined : value;
  const [followCursor, setFollowCursor] = useState(defaultFollowCursor);

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

  // Each fallback line belongs to the snapshot that supplied it. Prose and
  // relative line lengths cannot establish a different visit boundary.
  const revealedCount = useMemo(() => {
    const through = Number.isFinite(selectedIndex) ? Math.min(snapshots.length - 1, Math.floor(selectedIndex)) : -1;
    return snapshots.slice(0, Math.max(0, through + 1)).reduce((count, snapshot) =>
      count + (snapshot.narrative ?? "").split("\n").filter(Boolean).length, 0);
  }, [snapshots, selectedIndex]);

  const scopedEntries = useMemo(() => {
    const exactIds = new Set(snapshots.map(snapshot => snapshot.runtimeStageId).filter(Boolean));
    return (narrativeEntries ?? []).filter(entry => {
      if (!entry.subflowId) return scopeSubflowId === undefined;
      // A nested mount's markers belong to that nested rail. Idless markers
      // remain visible only in the explicitly unsynchronized fallback.
      if (entry.type === "subflow") return !entry.runtimeStageId || exactIds.has(entry.runtimeStageId);
      return entry.subflowId === scopeSubflowId;
    });
  }, [narrativeEntries, snapshots, scopeSubflowId]);
  const synchronization = useMemo(() => narrativeSynchronizationStatus(scopedEntries, snapshots), [scopedEntries, snapshots]);

  // Precompute range index once when entries change — O(n) build, then O(1) per slider tick.
  // Same shape as SequenceRecorder.getEntryRanges() in footprintjs.
  const rangeIndex = useMemo(
    () => scopedEntries.length ? buildEntryRangeIndex(scopedEntries) : undefined,
    [scopedEntries],
  );

  // Exact sync via runtimeStageId — O(selectedIndex) with precomputed index.
  const revealedEntryCount = useMemo(
    () => synchronization.status === "unsynchronized" ? scopedEntries.length
      : computeRevealedEntryCount(scopedEntries, snapshots, selectedIndex, rangeIndex),
    [scopedEntries, snapshots, selectedIndex, rangeIndex, synchronization],
  );

  const hasStructured = narrativeEntries && narrativeEntries.length > 0;
  const visibleRuntimeStageIds = useMemo(() => snapshots.slice(0, Math.max(0, selectedIndex + 1))
    .map(snapshot => snapshot.runtimeStageId).filter((id): id is string => !!id), [snapshots, selectedIndex]);

  // ── Copy as LLM-ready text ─────────────────────────────────────────────
  const [copied, setCopied] = useState(false);

  const buildLLMNarrative = useCallback(() => {
    const sections: string[] = [runtimeSnapshot ? "## Full run debug bundle" : "## Recorded log"];
    sections.push(`Recorded log scope: ${scopeSubflowId ?? "Root invocation"}.`);
    sections.push("This export includes all supplied log entries, including entries after the selected step. Recorded array order is preserved.");
    sections.push("Recorded values are bounded display previews. Native types are labelled; unavailable, circular or truncated data have explicit markers.");
    sections.push("\n## Recorded narrative\n");
    sections.push(narrativeEntries?.length ? narrativeEntries.map(entry => entry.text).join("\n") : narrative.join("\n"));
    if (runtimeSnapshot) sections.push("\nThe following debug data is from the full supplied run snapshot, including root state and other invocations. It is not limited to the visible log or selected step.");

    // ── Append the full debug bundle when caller provided snapshot/spec ──
    // Everything below the narrative is for LLM debugging: final state,
    // per-stage commit log (shows EXACTLY what each stage wrote), spec
    // topology, and any recorder snapshots (metrics, tokens, instructions,
    // emit events). Without these the story has no payloads to reason over.
    if (runtimeSnapshot) {
      const snap = {
        sharedState: ownDataField(runtimeSnapshot, 'sharedState'), commitLog: ownDataField(runtimeSnapshot, 'commitLog'),
        recorders: ownDataField(runtimeSnapshot, 'recorders'), subflowResults: ownDataField(runtimeSnapshot, 'subflowResults'),
      };
      const unavailable = Object.keys(snap).filter(key => {
        const descriptor = Object.getOwnPropertyDescriptor(runtimeSnapshot, key);
        return descriptor && !('value' in descriptor);
      });
      if (unavailable.length) sections.push("\n\n## Unavailable recorded fields", ...unavailable.map(key => `${key}: [Unavailable]`));

      if (snap.sharedState !== undefined) {
        sections.push("\n\n## Final Shared State");
        sections.push("```text");
        sections.push(safeJsonStringify(snap.sharedState));
        sections.push("```");
      }

      if (Array.isArray(snap.commitLog) && snap.commitLog.length > 0) {
        sections.push("\n\n## Commit Log");
        sections.push(
          "Each entry = one stage execution's writes to shared state. " +
            "`rsid` is the runtimeStageId (use it to correlate with narrative + executionTree).\n",
        );
        sections.push("```text");
        sections.push(safeJsonStringify(snap.commitLog));
        sections.push("```");
      }

      if (snap.recorders && typeof snap.recorders === "object") {
        sections.push("\n\n## Recorder Snapshots");
        sections.push(
          "Per-recorder data captured DURING the run (metrics, tokens, instructions, emit events).\n",
        );
        sections.push("```text");
        sections.push(safeJsonStringify(snap.recorders));
        sections.push("```");
      }

      if (snap.subflowResults && typeof snap.subflowResults === "object") {
        const keys = Object.keys(snap.subflowResults as Record<string, unknown>);
        if (keys.length > 0) {
          sections.push("\n\n## Subflow Results");
          sections.push("```text");
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
      sections.push("```text");
      sections.push(safeJsonStringify(spec));
      sections.push("```");
    }

    return sections.join("\n");
  }, [narrativeEntries, narrative, runtimeSnapshot, spec, scopeSubflowId]);

  const handleCopy = useCallback(async () => {
    const text = buildLLMNarrative();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [buildLLMNarrative]);

  const synchronized = synchronization.status === "exact";
  const scopeLabel = scopeSubflowId ?? "Root invocation";
  const selectedSnapshot = snapshots[selectedIndex];
  const copyLabel = runtimeSnapshot ? "Copy full run debug bundle" : "Copy recorded log";

  return <section className={className} data-fp="narrative-panel" data-presentation={presentation}
    style={{ ...sx({ overflow: "auto", display: "flex", flexDirection: "column", color: theme.textPrimary, fontFamily: theme.fontSans, fontSize: chrome.body }), ...style }}>
    <header style={sx({ padding: chrome.padding, borderBottom: `${chrome.borderWidth} solid ${theme.border}`, flexShrink: 0 })}>
      <p style={sx({ margin: `0 0 ${chrome.spaceSm}`, color: theme.textSecondary, fontSize: chrome.body, lineHeight: chrome.lineHeight, overflowWrap: "anywhere" })}>
        Recorded entries in {scopeLabel}{hasStructured && !synchronized ? "." : ` through selected step ${Math.min(snapshots.length, Math.max(0, selectedIndex + 1))} of ${snapshots.length}.`}
      </p>
      {hasStructured && !synchronized && <p role="status" data-fp="narrative-unsynchronized"
        style={sx({ margin: `0 0 ${chrome.spaceSm}`, color: theme.warning, fontSize: chrome.body, lineHeight: chrome.lineHeight })}>
        This recorded log is not synchronized to the selected step. Exact visit IDs are missing, unmatched or ambiguous; all supplied entries in this scope are shown without selected-step attribution.
      </p>}
      <div style={sx({ display: "flex", alignItems: "center", gap: chrome.spaceSm, flexWrap: "wrap" })}>
        <label style={sx({ display: "inline-flex", alignItems: "center", gap: chrome.spaceXs, fontSize: chrome.body, color: theme.textSecondary })}>
          <FootprintCheckbox checked={followCursor} onChange={event => setFollowCursor(event.currentTarget.checked)} unstyled={unstyled} part="narrative-follow" />
          Follow cursor
        </label>
        <FootprintButton onClick={handleCopy} unstyled={unstyled} densitySize={size} part="narrative-copy"
          title={runtimeSnapshot ? "Copies the full supplied run snapshot and all log entries, including other invocations and entries after the selected step." : "Copies all supplied recorded log entries, including entries after the selected step."}
          defaultStyle={{ background: copied ? theme.success : theme.bgSecondary, border: `${chrome.borderWidth} solid ${theme.border}`,
            borderRadius: chrome.radiusControl, padding: chrome.controlPadding, fontSize: chrome.small,
            color: copied ? theme.onSuccess : theme.textPrimary, cursor: "pointer", fontFamily: theme.fontSans, minHeight: chrome.controlHeight }}>
          {copied ? "Copied!" : copyLabel}
        </FootprintButton>
      </div>
      {runtimeSnapshot && <p data-fp="narrative-copy-scope" style={sx({ margin: `${chrome.spaceSm} 0 0`, fontSize: chrome.small, color: theme.textSecondary })}>
        Debug bundle includes the full supplied run, beyond this log's scope and selected step.
      </p>}
    </header>
    {hasStructured ? <StoryNarrative entries={scopedEntries} revealedEntryCount={revealedEntryCount}
      scopeSubflowId={scopeSubflowId} presentation={synchronized ? presentation : "entries"}
      selectedRuntimeStageId={synchronized ? selectedSnapshot?.runtimeStageId : undefined}
      visibleRuntimeStageIds={synchronized ? visibleRuntimeStageIds : undefined}
      followCursor={followCursor && synchronized} size={size} unstyled={unstyled} style={sx({ flex: 1 })} />
      : <NarrativeTrace narrative={narrative} revealedCount={revealedCount} followCursor={followCursor}
        size={size} unstyled={unstyled} style={sx({ flex: 1 })} />}
  </section>;
}
