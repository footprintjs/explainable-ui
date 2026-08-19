/**
 * StoryNarrative — Rich rendering of structured narrative entries.
 *
 * Recorder-based view: renders CombinedNarrativeRecorder output with
 * progressive reveal synced to snapshot index. Each entry is typed
 * (stage, step, condition, fork, subflow, loop, break, error, retry) and
 * rendered with appropriate icon + indentation.
 *
 * Data source: FlowRecorder (fires AFTER stage execution)
 */
import { useMemo, useRef, useEffect } from "react";
import type { NarrativeEntry, BaseComponentProps } from "../../types";
import { theme, fontSize, padding } from "../../theme";

export interface StoryNarrativeProps extends BaseComponentProps {
  /** Structured narrative entries from CombinedNarrativeRecorder */
  entries: NarrativeEntry[];
  /** Number of entries to reveal (position-based sync from NarrativePanel) */
  revealedEntryCount: number;
  /**
   * The subflow this story IS. Set it when `entries` were already scoped to
   * one subflow (a drilled-in view): entries belonging to that subflow are
   * this story's own stages and must be shown, while entries from subflows
   * NESTED inside it stay hidden behind their own mount, exactly as
   * top-level subflows are at the root.
   *
   * Unset (the default) means the root story — every subflow's internals are
   * hidden and only the Entering/Exiting markers show.
   */
  scopeSubflowId?: string;
}

const ENTRY_ICONS: Record<string, { icon: string; color: string; label: string }> = {
  stage:     { icon: "▸", color: theme.primary,       label: "Stage" },
  step:      { icon: "·", color: theme.textMuted,      label: "Data operation" },
  condition: { icon: "◇", color: theme.warning,        label: "Decision" },
  fork:      { icon: "⑃", color: theme.primary,       label: "Parallel" },
  selector:  { icon: "⑃", color: theme.primary,       label: "Selector" },
  subflow:   { icon: "↳", color: theme.textSecondary,  label: "Subflow" },
  loop:      { icon: "↻", color: theme.warning,        label: "Loop" },
  break:     { icon: "■", color: theme.error,          label: "Break" },
  error:     { icon: "✗", color: theme.error,          label: "Error" },
  // Retry is ATTEMPT telemetry, not an outcome: attempt N failed and the same
  // stage is about to run again, so it may still succeed. That is why it is
  // warning-weight (like `condition`) and not error-weight (like `error` /
  // `break`) — colouring it red would tell the reader the run failed when it
  // may not have. The mirrored arrow keeps the "went round again" reading while
  // staying tellable apart from `loop`'s ↻, which is a by-design back-edge in
  // the chart rather than a failure. Precedent for icon reuse with a distinct
  // label: `fork` and `selector` already share ⑃.
  retry:     { icon: "↺", color: theme.warning,        label: "Retry" },
};

export function StoryNarrative({
  entries,
  revealedEntryCount,
  scopeSubflowId,
  size = "default",
  unstyled = false,
  className,
  style: outerStyle,
}: StoryNarrativeProps) {
  const fs = fontSize[size];
  const pad = padding[size];

  // Position-based reveal: NarrativePanel computes the cut point based on
  // section boundaries (stage entries). This handles loops (same stageId,
  // different iterations) and subflow repeats correctly.
  const revealedCount = revealedEntryCount;

  // Filter revealed entries: show the entries of the level being VIEWED plus
  // subflow Entering/Exiting markers. Entries belonging to a subflow deeper
  // than this level are hidden — they appear in ITS drill-down view.
  //
  // `scopeSubflowId` is what makes that work at every depth: a drilled story
  // is handed only its own subflow's entries, and every one of them carries a
  // `subflowId`. Judging by "has a subflowId" alone therefore hid the entire
  // story the moment the drill started resolving the narrative correctly.
  const isOwnLevel = useMemo(() => {
    return (e: NarrativeEntry): boolean => {
      const sfId = (e as { subflowId?: string }).subflowId;
      if (!sfId) return scopeSubflowId === undefined; // root entry
      if (e.type === "subflow") return true; // Entering/Exiting markers — show
      return sfId === scopeSubflowId;
    };
  }, [scopeSubflowId]);
  const revealed = useMemo(
    () => entries.slice(0, revealedCount).filter(isOwnLevel),
    [entries, revealedCount, isOwnLevel],
  );
  // Future count: only count entries that would actually be shown (same filter as revealed)
  const futureCount = useMemo(() => {
    let count = 0;
    for (let i = revealedCount; i < entries.length; i++) {
      if (isOwnLevel(entries[i])) count++;
    }
    return count;
  }, [entries, revealedCount, isOwnLevel]);

  const latestRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    latestRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [revealed.length]);

  // Compute heading numbers for each revealed entry.
  // Flat sequential counter matching flowchart traversal (DFS visit order):
  //   1. [Stage: Seed] ...
  //   2. [Subflow: SystemPrompt] ...
  //   3. [Subflow: Messages] ...
  //   4. [Stage: ApplyPreparedMessages] ...
  //
  // Counter increments on: stage, subflow entry, condition, first fork in sequence.
  // No counter on: step, subflow exit, loop, break, error, subsequent forks.
  const numberedEntries = useMemo(() => {
    let counter = 0;
    // Track subflow enter/exit: first occurrence of type=subflow per stageId = enter, second = exit.
    const subflowSeen = new Set<string>();
    let prevType = "";

    return revealed.map((entry) => {
      // Strip legacy "Stage N: " prefix from text (default renderer)
      let cleanText = entry.text;
      cleanText = cleanText.replace(/^Stage \d+:\s*/, "");
      // Detect fork type BEFORE stripping prefix
      const isSelector = entry.type === "fork" && entry.text.includes("[Selected]");
      cleanText = cleanText.replace(/^\[(Selected|Parallel)\]:\s*/, "");

      // ── Subflow: detect enter vs exit by toggle ──
      if (entry.type === "subflow") {
        // Use stageId as toggle key (unique per subflow visit).
        // Fall back to text for renderers that don't set stageId.
        const toggleKey = (entry as { stageId?: string }).stageId ?? entry.text;
        const isExit = subflowSeen.has(toggleKey);
        if (!isExit) {
          subflowSeen.add(toggleKey);
          counter++;
          return {
            ...entry,
            heading: `${counter}`,
            headingType: "Subflow",
            text: cleanText,
            isHeading: true,
            isSubflow: true,
          };
        }
        // Exit marker — no heading, will be hidden in render
        return { ...entry, heading: null, isHeading: false, isSubflowExit: true };
      }

      // ── Stage ──
      if (entry.type === "stage") {
        counter++;
        return { ...entry, heading: `${counter}`, headingType: "Stage", text: cleanText, isHeading: true };
      }

      // ── Condition (decision) — nested under the preceding stage, no separate number ──
      if (entry.type === "condition") {
        return { ...entry, heading: null, headingType: "Decision", text: cleanText, isHeading: false };
      }

      // ── Fork / Selector — first in sequence gets number ──
      if (entry.type === "fork" || entry.type === "selector") {
        const isForkHeading = prevType !== "fork" && prevType !== "selector";
        prevType = entry.type;
        if (isForkHeading) {
          counter++;
          const typeLabel = entry.type === "selector" || isSelector ? "Selector" : "Fork";
          return { ...entry, heading: `${counter}`, headingType: typeLabel, text: cleanText, isHeading: true };
        }
        return { ...entry, heading: null, isHeading: false, text: cleanText };
      }

      prevType = entry.type;
      // loop, break, step, error, retry — no heading number
      // Loop is a back-edge (not a new node), break is a termination signal,
      // and retry is one failed attempt WITHIN the stage above it — numbering
      // any of them would invent a step the flowchart never took.
      return { ...entry, heading: null, isHeading: false };
    });
  }, [revealed]);

  if (unstyled) {
    return (
      <div className={className} style={outerStyle} data-fp="story-narrative" role="log">
        {numberedEntries.map((entry, i) => {
          if ((entry as any).isSubflowExit) return null;
          const ht = (entry as any).headingType;
          return (
            <div key={i} data-fp="narrative-entry" data-type={entry.type}>
              {entry.heading
                ? entry.text.startsWith('[')
                  ? `${entry.heading}. ${entry.text}`
                  : `${entry.heading}. [${ht}: ${entry.stageName ?? ''}] ${entry.text}`
                : entry.text}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        flex: 1,
        overflow: "auto",
        padding: pad,
        fontFamily: theme.fontSans,
        ...outerStyle,
      }}
      data-fp="story-narrative"
      role="log"
      aria-label="Execution narrative"
    >
      {numberedEntries.map((entry, i) => {
        // Skip subflow exit markers — entry marker is enough
        if ((entry as any).isSubflowExit) return null;

        const meta = ENTRY_ICONS[entry.type] ?? ENTRY_ICONS.step;
        const isHeading = entry.isHeading;
        const isDecision = entry.type === "condition";
        const isError = entry.type === "error";
        const isBreak = entry.type === "break";
        // Warning-weight alongside decisions: a failed attempt is a fact worth
        // catching the eye, but the stage has not failed yet.
        const isRetry = entry.type === "retry";
        const isSubflow = (entry as any).isSubflow;
        const isLast = i === numberedEntries.length - 1;
        const headingType = (entry as any).headingType as string | undefined;

        return (
          <div
            key={i}
            ref={isLast ? latestRef : undefined}
            style={{
              display: "flex",
              gap: 8,
              padding: isHeading ? `${pad - 4}px 0` : `2px 0`,
              marginLeft: entry.depth * 16,
              borderBottom: isHeading ? `1px solid ${theme.border}` : undefined,
              marginTop: isHeading && i > 0 ? 8 : 0,
            }}
          >
            <span
              style={{
                color: meta.color,
                fontWeight: 700,
                fontSize: isHeading ? fs.body : fs.small,
                width: 16,
                textAlign: "center",
                flexShrink: 0,
              }}
              title={meta.label}
              aria-label={meta.label}
            >
              {meta.icon}
            </span>
            <span
              style={{
                fontSize: isHeading ? fs.body : fs.small,
                fontWeight: isHeading ? 600 : 400,
                color: isError || isBreak
                  ? theme.error
                  : isDecision || isRetry
                    ? theme.warning
                    : isHeading
                      ? theme.textPrimary
                      : theme.textSecondary,
                lineHeight: 1.6,
                fontFamily: entry.type === "step" ? theme.fontMono : theme.fontSans,
              }}
            >
              {entry.heading && headingType ? (
                entry.text.startsWith('[') ? (
                  <>
                    <strong>{entry.heading}.</strong>
                    {' '}{entry.text}
                  </>
                ) : (
                  <>
                    <strong>{entry.heading}. [{headingType}{entry.stageName ? `: ${entry.stageName}` : ''}]</strong>
                    {' '}{entry.text}
                  </>
                )
              ) : entry.text}
            </span>
          </div>
        );
      })}

      {/* Future entries — show count hint only, skip full rendering for performance */}
      {futureCount > 0 && (
        <div style={{
          opacity: 0.3,
          fontSize: fs.small,
          color: theme.textMuted,
          padding: `8px 0`,
          fontStyle: "italic",
        }}>
          {futureCount} more {futureCount === 1 ? "entry" : "entries"} ahead...
        </div>
      )}
    </div>
  );
}
