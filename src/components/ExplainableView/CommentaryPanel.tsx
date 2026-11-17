import * as React from "react";
import { useContext, useMemo, useRef, useEffect } from "react";
import { componentStyles, theme, FootprintBadge } from "../../theme";
import type { BaseComponentProps, NarrativeEntry } from "../../types";
import { projectCommentary } from "../../model/commentary";
import { useTraceMotion } from "../../_internal/useTraceMotion";
import { useOptionalControllerOwner } from "../../workbench";
import { LensWorkbenchContext } from "../ExplainableShell/LensWorkbench";
import { useOptionalExplainableRun } from "./ExplainableContext";
import { RecordedText, RecordedVisit, recordedTextStyle } from "../StoryNarrative/_internal/RecordedVisit";

export interface CommentaryRenderContext {
  readonly index: number;
  /** The last displayed comment from the exact selected visit. */
  readonly current: boolean;
}

export interface CommentaryPanelProps extends BaseComponentProps {
  readonly title?: string;
  readonly maxLines?: number;
  readonly renderEntry?: (entry: NarrativeEntry, context: CommentaryRenderContext) => React.ReactNode;
  readonly emptyMessage?: string;
  /** A recorded log through the cursor, or only the exact selected visit's prose. */
  readonly presentation?: "log" | "current";
  /** Show recorded kind labels in the log. Omit to retain the legacy type column. */
  readonly showEntryTypes?: boolean;
  /** Group consecutive admitted comments by their exact recorded stage visit. */
  readonly groupByStage?: boolean;
  /** Opt into following the selected step; reduced motion suppresses scrolling. */
  readonly followCursor?: boolean;
}

/** The existing commentary JSON follows either provider's one cursor, without owning another. */
export function CommentaryPanel({
  title = "Commentary", maxLines = 200, renderEntry, emptyMessage,
  presentation = "log", showEntryTypes = true, groupByStage = false, followCursor = false,
  size = "default", unstyled = false, className, style,
}: CommentaryPanelProps) {
  const lens = useContext(LensWorkbenchContext);
  const headless = useOptionalControllerOwner()?.value;
  const basic = useOptionalExplainableRun();
  const lensState = lens ?? headless;
  const source = lensState ?? basic;
  if (!source) throw new Error("CommentaryPanel must be rendered inside LensControllerProvider, ExplainableProvider or ExplainableShell.");
  const { snapshots, selectedIndex, narrativeEntries } = source;
  const available = lensState ? lensState.narrativeAvailable !== false && headless?.recordingStatus.status !== "error" : !basic?.error;
  const scope = lensState?.narrativeScopeSubflowId;
  const projection = useMemo(() => projectCommentary({ snapshots, selectedIndex, narrativeEntries,
    narrativeAvailable: available, narrativeScopeSubflowId: scope, presentation, maxLines }),
  [snapshots, selectedIndex, narrativeEntries, available, scope, presentation, maxLines]);
  const currentEntryIndex = projection.entries.reduce((last, entry, index) => entry.selectedVisit ? index : last, -1);
  const visits = useMemo(() => {
    const groups: { id: string | undefined; items: { entry: NarrativeEntry; index: number }[] }[] = [];
    for (const [index, { entry }] of projection.entries.entries()) {
      const previous = groups[groups.length - 1];
      if (entry.runtimeStageId && previous?.id === entry.runtimeStageId) previous.items.push({ entry, index });
      else groups.push({ id: entry.runtimeStageId, items: [{ entry, index }] });
    }
    return groups;
  }, [projection.entries]);
  const followStageHeader = groupByStage && projection.entries[currentEntryIndex]?.entry.type === "step";
  const latestRef = useRef<HTMLDivElement>(null);
  const motion = useTraceMotion();
  useEffect(() => {
    if (!followCursor || projection.availability !== "exact") return;
    try { if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return; } catch { /* Following stays instant in unsupported hosts. */ }
    latestRef.current?.scrollIntoView?.({ block: "nearest", behavior: motion ? "smooth" : "auto" });
  }, [followCursor, motion, projection, groupByStage]);
  const ui = componentStyles(size);
  const sx = (value: React.CSSProperties): React.CSSProperties | undefined => unstyled ? undefined : value;
  const selected = snapshots[selectedIndex];
  const empty = emptyMessage ?? (presentation === "current" ? "No recorded commentary for this step."
    : narrativeEntries.length ? "No recorded commentary through this step." : "This recording carried no narrative commentary.");
  const renderRecordedEntry = (entry: NarrativeEntry, index: number) => {
    const { sourceIndex } = projection.entries[index];
    const current = index === currentEntryIndex;
    return <div key={`${entry.runtimeStageId}:${sourceIndex}`} ref={current && !followStageHeader ? latestRef : undefined}
      data-fp="commentary-entry" data-current={current || undefined} data-runtime-stage-id={entry.runtimeStageId}
      data-source-index={sourceIndex} style={sx({
        ...(presentation === "log" ? { ...(showEntryTypes ? { display: "grid", gridTemplateColumns: "minmax(0, 82px) minmax(0, 1fr)", gap: ui.spaceSm } : {}),
          borderBottom: `${ui.borderWidth} solid ${theme.border}`, borderLeft: `${ui.focusWidth} solid ${current ? theme.accent : "transparent"}`,
          background: current ? theme.accentBg : "transparent", padding: ui.controlPadding } : { marginBottom: ui.spaceMd }),
        minWidth: 0, color: theme.textPrimary, lineHeight: ui.lineHeight,
      })}>
      {presentation === "log" && showEntryTypes && <FootprintBadge unstyled={unstyled} densitySize={size} part="commentary-entry-kind"
        defaultStyle={sx({ fontSize: ui.small, color: current ? theme.accent : theme.textSecondary, fontFamily: theme.fontMono, overflowWrap: "anywhere" })}>{entry.type}</FootprintBadge>}
      <div data-fp="commentary-prose" style={sx({ fontSize: ui.body, whiteSpace: "pre-wrap", overflowWrap: "anywhere", minWidth: 0,
        ...(groupByStage ? recordedTextStyle(entry, ui) : {}) })}>
        {renderEntry?.(entry, { index, current }) ?? (groupByStage ? <RecordedText text={entry.text} size={size} unstyled={unstyled} /> : entry.text)}
      </div>
    </div>;
  };

  return <section className={className} data-fp="commentary-panel" data-presentation={presentation} data-group-by-stage={groupByStage || undefined} aria-label={title}
    style={{ ...sx({ display: "flex", height: "100%", minHeight: 0, flexDirection: "column", overflow: "hidden",
      background: theme.bgElevated, color: theme.textPrimary, fontFamily: theme.fontSans,
      fontSize: ui.body, lineHeight: ui.lineHeight }), ...style }}>
    <header style={sx({ padding: ui.padding, borderBottom: `${ui.borderWidth} solid ${theme.border}`, flexShrink: 0 })}>
      <strong style={sx({ display: "block", fontSize: ui.label, fontWeight: ui.weightStrong })}>{title}</strong>
      {presentation === "current" && !groupByStage && selected && projection.availability === "exact" && <span data-fp="commentary-stage"
        style={sx({ display: "block", marginTop: ui.spaceXs, fontSize: ui.title, color: theme.textPrimary, overflowWrap: "anywhere" })}>{selected.stageLabel}</span>}
      {presentation === "log" && projection.availability === "exact" && <span style={sx({ display: "block", marginTop: ui.spaceXs, fontSize: ui.small, color: theme.textSecondary })}>
        {projection.revealedCount} of {projection.totalCount} recorded comments through the selected step
      </span>}
    </header>
    <div role="log" aria-label={`${title} entries`} aria-live="polite" style={sx({ flex: 1, minHeight: 0, overflowY: "auto", padding: ui.padding })}>
      {projection.availability === "unavailable" ? <p role="status" data-fp="commentary-unavailable"
        style={sx({ margin: 0, color: theme.textSecondary })}>Commentary is unavailable for this recording.</p>
        : projection.availability === "unsynchronized" ? <p role="status" data-fp="commentary-unsynchronized"
          style={sx({ margin: 0, color: theme.textSecondary })}>This commentary is not synchronized to an exact recorded step. Missing, unmatched or ambiguous visit IDs prevent these comments from being placed on this slider.</p>
          : <>
            {projection.hiddenCount > 0 && <p data-fp="commentary-hidden-count" style={sx({ margin: `0 0 ${ui.spaceSm}`, fontSize: ui.small, color: theme.textSecondary })}>
              … {projection.hiddenCount} earlier {presentation === "current" ? "comments from this step" : "lines"} hidden by the line limit.
            </p>}
            {projection.entries.length === 0 && projection.hiddenCount === 0 && <p data-fp="commentary-empty" style={sx({ margin: 0, color: theme.textSecondary })}>{empty}</p>}
            {groupByStage ? visits.map(group => {
              const label = group.items.find(({ entry }) => entry.stageName)?.entry.stageName
                ?? snapshots.find(snapshot => snapshot.runtimeStageId === group.id)?.stageLabel ?? "Recorded stage";
              const containsCurrentEntry = group.items.some(item => item.index === currentEntryIndex);
              return <RecordedVisit key={`${group.id}:${group.items[0].index}`} id={group.id} label={label}
                items={group.items} current={containsCurrentEntry} prefix="commentary"
                followRef={containsCurrentEntry && followStageHeader ? latestRef : undefined}
                renderItem={({ entry, index }) => renderRecordedEntry(entry, index)} size={size} unstyled={unstyled} />;
            }) : projection.entries.map(({ entry }, index) => renderRecordedEntry(entry, index))}
          </>}
    </div>
  </section>;
}
