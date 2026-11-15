/**
 * StoryNarrative — Rich rendering of structured narrative entries.
 *
 * Recorder-based view: renders CombinedNarrativeRecorder output with
 * progressive reveal synced to snapshot index. Each entry is typed
 * (stage, step, condition, fork, subflow, loop, break, error, retry,
 * attempt, …) and rendered with appropriate icon + indentation; a kind this
 * release does not know gets a plain generic badge and its text as written.
 *
 * Data source: FlowRecorder (fires AFTER stage execution)
 */
import { useMemo, useRef, useEffect, useState, type CSSProperties } from "react";
import type { NarrativeEntry, BaseComponentProps, KnownNarrativeEntryType } from "../../types";
import { theme, componentStyles, FootprintButton } from "../../theme";
import { useTraceMotion } from "../../_internal/useTraceMotion";

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
  /** Keep the expanded entry list, or group contiguous exact recorded visits. */
  presentation?: "entries" | "visits";
  /** An admitted exact visit; omitted when the log cannot synchronize. */
  selectedRuntimeStageId?: string;
  /** Exact admitted visits through the cursor, when entry and rail order differ. */
  visibleRuntimeStageIds?: readonly string[];
  /** Follow newly revealed entries only when the reader opts in. */
  followCursor?: boolean;
}

interface EntryBadge {
  icon: string;
  color: string;
  label: string;
}

/**
 * Badge per narrative kind — icon, colour and the accessible label.
 *
 * Keyed by `KnownNarrativeEntryType` ON PURPOSE, not by `string`: a known kind
 * without a badge here is a COMPILE error. It used to be `Record<string, …>`,
 * and the cost of that was silent — `pause`, `resume` and `emit` had been in
 * the union (and in real engine output) for releases while rendering with the
 * `step` fallback, which told a screen reader that a paused run was a "Data
 * operation". A kind from a NEWER footprintjs than this package knows gets
 * {@link UNKNOWN_ENTRY_BADGE} instead (see {@link badgeOf}).
 */
const ENTRY_ICONS: Record<KnownNarrativeEntryType, EntryBadge> = {
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
  // One attempt of a retried stage (footprintjs >= 10.1, where it replaces the
  // `retry` line), styled exactly as `retry` was. The entry carries its outcome
  // only in its text, and this renderer never parses prose, so every line of
  // the series gets the same weight: the stage needed its retry policy. Shares
  // ↺ with `retry` and tells itself apart by its label (as fork and selector do).
  attempt:   { icon: "↺", color: theme.warning,        label: "Attempt" },
  // The run stopped and is waiting on someone — warning-weight for the same
  // reason `retry` is: it wants the eye, but nothing has failed. Hollow ▷ for
  // the resume so it reads against `stage`'s filled ▸ at a glance, and
  // success-coloured because a resumed run is a run that carried on.
  pause:     { icon: "‖", color: theme.warning,        label: "Paused" },
  resume:    { icon: "▷", color: theme.success,        label: "Resumed" },
  // `scope.$emit` — the consumer's own telemetry riding the narrative. Neutral
  // weight: it is the app talking, not the engine reporting on itself.
  emit:      { icon: "◈", color: theme.textSecondary,  label: "Emitted event" },
};

/**
 * The badge for a kind this release does not know — plain and neutral. It
 * claims nothing about the entry (the `step` badge would call it a "Data
 * operation"); the text, which the engine already wrote, says what happened.
 */
const UNKNOWN_ENTRY_BADGE: EntryBadge = { icon: "◦", color: theme.textSecondary, label: "Narrative entry" };

/**
 * The badge for an entry kind. An OWN-property lookup: the kind is any string,
 * and a name like `constructor` or `__proto__` must not find something on
 * `Object.prototype` and render it as a badge.
 */
function badgeOf(type: string): EntryBadge {
  return Object.prototype.hasOwnProperty.call(ENTRY_ICONS, type)
    ? ENTRY_ICONS[type as KnownNarrativeEntryType]
    : UNKNOWN_ENTRY_BADGE;
}

export function StoryNarrative({
  entries, revealedEntryCount, scopeSubflowId, presentation = "entries",
  selectedRuntimeStageId, visibleRuntimeStageIds, followCursor = false,
  size = "default", unstyled = false, className, style: outerStyle,
}: StoryNarrativeProps) {
  const chrome = componentStyles(size);
  const sx = (value: CSSProperties): CSSProperties | undefined => unstyled ? undefined : value;
  const motion = useTraceMotion();
  const revealedCount = Math.max(0, Math.min(entries.length, revealedEntryCount));
  const isOwnLevel = (entry: NarrativeEntry) => !entry.subflowId
    ? scopeSubflowId === undefined : entry.type === "subflow" || entry.subflowId === scopeSubflowId;
  const visibleIds = visibleRuntimeStageIds === undefined ? null : new Set(visibleRuntimeStageIds);
  const admitted = (entry: NarrativeEntry, index: number) => index < revealedCount
    && (!visibleIds || !!entry.runtimeStageId && visibleIds.has(entry.runtimeStageId));
  const revealed = entries.filter((entry, index) => isOwnLevel(entry) && admitted(entry, index));
  const futureCount = entries.filter((entry, index) => isOwnLevel(entry) && !admitted(entry, index)).length;
  const latestRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!followCursor) return;
    try { if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return; } catch { /* Unsupported hosts can follow without animation. */ }
    latestRef.current?.scrollIntoView?.({ behavior: motion ? "smooth" : "auto", block: "nearest" });
  }, [followCursor, motion, revealedCount, scopeSubflowId, visibleRuntimeStageIds]);

  const groups = useMemo(() => {
    const result: { id: string | undefined; entries: NarrativeEntry[]; start: number }[] = [];
    for (const [index, entry] of revealed.entries()) {
      const previous = result[result.length - 1];
      if (entry.runtimeStageId && previous?.id === entry.runtimeStageId) previous.entries.push(entry);
      else result.push({ id: entry.runtimeStageId, entries: [entry], start: index });
    }
    return result;
  }, [entries, revealedCount, scopeSubflowId, visibleRuntimeStageIds]);

  const renderEntry = (entry: NarrativeEntry, index: number) => {
    const badge = badgeOf(entry.type);
    const heading = entry.type === "stage" || entry.type === "subflow";
    const emphasis = entry.type === "condition" || entry.type === "retry" || entry.type === "attempt";
    const failed = entry.type === "error" || entry.type === "break";
    return <div key={index} data-fp="narrative-entry" data-type={entry.type}
      style={sx({ display: "flex", gap: chrome.spaceSm, padding: `${heading ? chrome.spaceSm : chrome.spaceXs} 0`,
        marginLeft: presentation === "visits" ? 0 : `calc(${chrome.spaceMd} * ${Math.min(3, Math.max(0, entry.depth))})`,
        minWidth: 0, alignItems: "baseline" })}>
      <span title={badge.label} aria-label={badge.label} style={sx({ color: badge.color, fontWeight: chrome.weightStrong,
        width: chrome.iconSize, flexShrink: 0, textAlign: "center", fontSize: chrome.body })}>{badge.icon}</span>
      <span data-fp="narrative-text" style={sx({ minWidth: 0, fontSize: chrome.body, lineHeight: chrome.lineHeight,
        fontWeight: heading ? chrome.weightStrong : chrome.weightNormal,
        color: failed ? theme.error : emphasis ? theme.warning : theme.textPrimary,
        fontFamily: entry.type === "step" ? theme.fontMono : theme.fontSans,
        whiteSpace: "pre-wrap", overflowWrap: "anywhere" })}>
        <RecordedText text={entry.text} size={size} unstyled={unstyled} />
      </span>
    </div>;
  };
  const renderVisit = (group: typeof groups[number]) => {
    const current = !!group.id && group.id === selectedRuntimeStageId;
    const blocks: { operations: boolean; entries: NarrativeEntry[]; start: number }[] = [];
    for (const [offset, entry] of group.entries.entries()) {
      const operations = entry.type === "step", previous = blocks[blocks.length - 1];
      if (previous?.operations === operations) previous.entries.push(entry);
      else blocks.push({ operations, entries: [entry], start: offset });
    }
    return <section key={`${group.id ?? "unbound"}:${group.start}`} data-fp="narrative-visit"
      data-runtime-stage-id={group.id} data-current={current || undefined}
      aria-label={group.id ? `Recorded visit ${group.id}` : "Unbound recorded entries"}
      style={sx({ border: `${chrome.borderWidth} solid ${current ? theme.accent : theme.border}`,
        borderRadius: chrome.radiusPanel, padding: chrome.padding, marginBottom: chrome.spaceMd,
        background: current ? theme.accentBg : theme.bgPrimary, minWidth: 0 })}>
      {group.id && <header style={sx({ marginBottom: chrome.spaceSm, overflowWrap: "anywhere" })}>
        <strong style={sx({ fontSize: chrome.body })}>{group.entries.find(entry => entry.stageName)?.stageName ?? "Recorded visit"}</strong>
        {current && <span style={sx({ color: theme.accent, marginLeft: chrome.spaceSm, fontSize: chrome.small })}>Selected step</span>}
        <code style={sx({ display: "block", fontFamily: theme.fontMono, fontSize: chrome.small, color: theme.textSecondary, marginTop: chrome.spaceXs })}>{group.id}</code>
      </header>}
      {blocks.map(block => block.operations ? <details key={block.start} data-fp="narrative-operations"
        style={sx({ margin: `${chrome.spaceXs} 0`, overflowWrap: "anywhere" })}>
        <summary style={sx({ cursor: "pointer", fontSize: chrome.body, color: theme.textSecondary })}>
          Recorded operations ({block.entries.length})
        </summary>
        <div style={sx({ marginTop: chrome.spaceSm })}>{block.entries.map((entry, offset) => renderEntry(entry, block.start + offset))}</div>
      </details> : <div key={block.start}>{block.entries.map((entry, offset) => renderEntry(entry, block.start + offset))}</div>)}
    </section>;
  };

  return <div className={className} data-fp="story-narrative" data-presentation={presentation}
    role="log" aria-label="Execution narrative"
    style={{ ...sx({ flex: 1, overflow: "auto", padding: chrome.padding, fontFamily: theme.fontSans, color: theme.textPrimary, fontSize: chrome.body }), ...outerStyle }}>
    {presentation === "visits" ? groups.map(renderVisit) : revealed.map(renderEntry)}
    {revealed.length === 0 && <p data-fp="narrative-empty" style={sx({ margin: 0, color: theme.textSecondary })}>No recorded entries at this selected step.</p>}
    {futureCount > 0 && <div data-fp="narrative-future-hint" style={sx({ fontSize: chrome.small, color: theme.textSecondary, padding: `${chrome.spaceSm} 0` })}>
      {futureCount} more {futureCount === 1 ? "entry" : "entries"} ahead...
    </div>}
    <div ref={latestRef} data-fp="narrative-follow-target" />
  </div>;
}

function RecordedText({ text, size, unstyled }: { text: string; size: NonNullable<BaseComponentProps["size"]>; unstyled: boolean }) {
  const [expandedText, setExpandedText] = useState<string | null>(null);
  const expanded = expandedText === text;
  const limit = 600;
  const chrome = componentStyles(size);
  if (text.length <= limit) return text;
  return <>
    <span>{expanded ? text : `${text.slice(0, limit)}…`}</span>
    <FootprintButton unstyled={unstyled} densitySize={size} part="narrative-text-toggle"
      aria-expanded={expanded} onClick={() => setExpandedText(value => value === text ? null : text)}
      defaultStyle={{ display: "block", marginTop: chrome.spaceXs, border: `${chrome.borderWidth} solid ${theme.border}`,
        borderRadius: chrome.radiusControl, padding: chrome.controlPadding, color: theme.textPrimary,
        background: theme.bgSecondary, fontSize: chrome.small, cursor: "pointer", fontFamily: theme.fontSans }}>
      {expanded ? "Show less recorded text" : `Show full recorded text (${text.length} characters)`}
    </FootprintButton>
  </>;
}
