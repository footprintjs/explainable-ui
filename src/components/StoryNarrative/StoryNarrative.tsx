/**
 * StoryNarrative — Rich rendering of structured narrative entries.
 *
 * Recorder-based view: renders CombinedNarrativeRecorder output with
 * progressive reveal synced to snapshot index. Each entry is typed
 * (stage, step, condition, fork, subflow, loop, break, error) and
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
  /** Set of stage labels to reveal (from snapshots[0..selectedIndex]) */
  revealedStages: Set<string>;
}

const ENTRY_ICONS: Record<string, { icon: string; color: string; label: string }> = {
  stage:     { icon: "▸", color: theme.primary,       label: "Stage" },
  step:      { icon: "·", color: theme.textMuted,      label: "Data operation" },
  condition: { icon: "◇", color: theme.warning,        label: "Decision" },
  fork:      { icon: "⑃", color: theme.primary,       label: "Parallel" },
  subflow:   { icon: "↳", color: theme.textSecondary,  label: "Subflow" },
  loop:      { icon: "↻", color: theme.warning,        label: "Loop" },
  break:     { icon: "■", color: theme.error,          label: "Break" },
  error:     { icon: "✗", color: theme.error,          label: "Error" },
};

export function StoryNarrative({
  entries,
  revealedStages,
  size = "default",
  unstyled = false,
  className,
  style: outerStyle,
}: StoryNarrativeProps) {
  const fs = fontSize[size];
  const pad = padding[size];

  // Reveal entries whose stageName belongs to a revealed stage.
  // Entries without stageName (fork, subflow markers) are shown if they
  // appear before the first unrevealed stage entry.
  const revealedCount = useMemo(() => {
    // Entries with identifiers (stageId/subflowId/stageName) are checked against revealedStages.
    // Entries WITHOUT identifiers (fork/subflow markers) belong to the previous revealed
    // section — they're included as long as the last identified entry was revealed.
    const isRevealed = (e: { stageId?: string; subflowId?: string; stageName?: string }) =>
      (e.stageId && revealedStages.has(e.stageId))
      || (e.subflowId && revealedStages.has(e.subflowId))
      || (e.stageName && revealedStages.has(e.stageName));

    let lastIdentifiedWasRevealed = true;
    for (let i = 0; i < entries.length; i++) {
      const e = entries[i] as { stageId?: string; subflowId?: string; stageName?: string };
      const hasKey = e.stageId || e.subflowId || e.stageName;
      if (hasKey) {
        lastIdentifiedWasRevealed = !!isRevealed(e);
        if (!lastIdentifiedWasRevealed) return i;
      } else {
        // No identifier — belongs to previous section
        if (!lastIdentifiedWasRevealed) return i;
      }
    }
    return entries.length;
  }, [entries, revealedStages]);

  const revealed = entries.slice(0, revealedCount);
  const future = entries.slice(revealedCount);

  const latestRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    latestRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [revealed.length]);

  if (unstyled) {
    return (
      <div className={className} style={outerStyle} data-fp="story-narrative" role="log">
        {revealed.map((entry, i) => (
          <div key={i} data-fp="narrative-entry" data-type={entry.type}>
            {entry.text}
          </div>
        ))}
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
      {revealed.map((entry, i) => {
        const meta = ENTRY_ICONS[entry.type] ?? ENTRY_ICONS.step;
        const isStage = entry.type === "stage";
        const isDecision = entry.type === "condition";
        const isError = entry.type === "error";
        const isLast = i === revealed.length - 1;

        return (
          <div
            key={i}
            ref={isLast ? latestRef : undefined}
            style={{
              display: "flex",
              gap: 8,
              padding: isStage ? `${pad - 4}px 0` : `2px 0`,
              marginLeft: entry.depth * 16,
              borderBottom: isStage ? `1px solid ${theme.border}` : undefined,
              marginTop: isStage && i > 0 ? 8 : 0,
            }}
          >
            <span
              style={{
                color: meta.color,
                fontWeight: 700,
                fontSize: isStage ? fs.body : fs.small,
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
                fontSize: isStage ? fs.body : fs.small,
                fontWeight: isStage ? 600 : 400,
                color: isError
                  ? theme.error
                  : isDecision
                    ? theme.warning
                    : isStage
                      ? theme.textPrimary
                      : theme.textSecondary,
                lineHeight: 1.6,
                fontFamily: entry.type === "step" ? theme.fontMono : theme.fontSans,
              }}
            >
              {entry.text}
            </span>
          </div>
        );
      })}

      {/* Future entries — show count hint only, skip full rendering for performance */}
      {future.length > 0 && (
        <div style={{
          opacity: 0.3,
          fontSize: fs.small,
          color: theme.textMuted,
          padding: `8px 0`,
          fontStyle: "italic",
        }}>
          {future.length} more {future.length === 1 ? "entry" : "entries"} ahead...
        </div>
      )}
    </div>
  );
}
