import * as React from "react";
import { useContext, useMemo, useRef, useEffect } from "react";
import { componentStyles, theme, FootprintBadge } from "../../theme";
import type { BaseComponentProps, NarrativeEntry } from "../../types";
import { projectCommentary } from "../../model/commentary";
import { useTraceMotion } from "../../_internal/useTraceMotion";
import { LensWorkbenchContext } from "../ExplainableShell/LensWorkbench";
import { useOptionalExplainableRun } from "./ExplainableContext";

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
  /** Opt into following the selected step; reduced motion suppresses scrolling. */
  readonly followCursor?: boolean;
}

/** The existing commentary JSON follows either provider's one cursor, without owning another. */
export function CommentaryPanel({
  title = "Commentary", maxLines = 200, renderEntry, emptyMessage,
  presentation = "log", showEntryTypes = true, followCursor = false,
  size = "default", unstyled = false, className, style,
}: CommentaryPanelProps) {
  const lens = useContext(LensWorkbenchContext);
  const basic = useOptionalExplainableRun();
  const source = lens ?? basic;
  if (!source) throw new Error("CommentaryPanel must be rendered inside ExplainableProvider or ExplainableShell.");
  const { snapshots, selectedIndex, narrativeEntries } = source;
  const available = lens ? lens.narrativeAvailable !== false : !basic?.error;
  const scope = lens?.narrativeScopeSubflowId;
  const projection = useMemo(() => projectCommentary({ snapshots, selectedIndex, narrativeEntries,
    narrativeAvailable: available, narrativeScopeSubflowId: scope, presentation, maxLines }),
  [snapshots, selectedIndex, narrativeEntries, available, scope, presentation, maxLines]);
  const currentEntryIndex = projection.entries.reduce((last, entry, index) => entry.selectedVisit ? index : last, -1);
  const latestRef = useRef<HTMLDivElement>(null);
  const motion = useTraceMotion();
  useEffect(() => {
    if (!followCursor || projection.availability !== "exact") return;
    try { if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return; } catch { /* Following stays instant in unsupported hosts. */ }
    latestRef.current?.scrollIntoView?.({ block: "nearest", behavior: motion ? "smooth" : "auto" });
  }, [followCursor, motion, projection]);
  const ui = componentStyles(size);
  const sx = (value: React.CSSProperties): React.CSSProperties | undefined => unstyled ? undefined : value;
  const selected = snapshots[selectedIndex];
  const empty = emptyMessage ?? (presentation === "current" ? "No recorded commentary for this step."
    : narrativeEntries.length ? "No recorded commentary through this step." : "This recording carried no narrative commentary.");

  return <section className={className} data-fp="commentary-panel" data-presentation={presentation} aria-label={title}
    style={{ ...sx({ display: "flex", height: "100%", minHeight: 0, flexDirection: "column", overflow: "hidden",
      background: theme.bgElevated, color: theme.textPrimary, fontFamily: theme.fontSans,
      fontSize: ui.body, lineHeight: ui.lineHeight }), ...style }}>
    <header style={sx({ padding: ui.padding, borderBottom: `${ui.borderWidth} solid ${theme.border}`, flexShrink: 0 })}>
      <strong style={sx({ display: "block", fontSize: ui.label, fontWeight: ui.weightStrong })}>{title}</strong>
      {presentation === "current" && selected && projection.availability === "exact" && <span data-fp="commentary-stage"
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
            {projection.entries.map(({ entry, sourceIndex }, index) => {
              const current = index === currentEntryIndex;
              return <div key={`${entry.runtimeStageId}:${sourceIndex}`} ref={current ? latestRef : undefined}
                data-fp="commentary-entry" data-current={current || undefined} data-runtime-stage-id={entry.runtimeStageId}
                data-source-index={sourceIndex} style={sx({
                  ...(presentation === "log" ? { ...(showEntryTypes ? { display: "grid", gridTemplateColumns: "minmax(0, 82px) minmax(0, 1fr)", gap: ui.spaceSm } : {}),
                    borderBottom: `${ui.borderWidth} solid ${theme.border}`, borderLeft: `${ui.focusWidth} solid ${current ? theme.accent : "transparent"}`,
                    background: current ? theme.accentBg : "transparent", padding: ui.controlPadding } : { marginBottom: ui.spaceMd }),
                  minWidth: 0, color: theme.textPrimary, lineHeight: ui.lineHeight,
                })}>
                {presentation === "log" && showEntryTypes && <FootprintBadge unstyled={unstyled} densitySize={size} part="commentary-entry-kind"
                  defaultStyle={sx({ fontSize: ui.small, color: current ? theme.accent : theme.textSecondary, fontFamily: theme.fontMono, overflowWrap: "anywhere" })}>{entry.type}</FootprintBadge>}
                <div data-fp="commentary-prose" style={sx({ fontSize: ui.body, whiteSpace: "pre-wrap", overflowWrap: "anywhere", minWidth: 0 })}>
                  {renderEntry?.(entry, { index, current }) ?? entry.text}
                </div>
              </div>;
            })}
          </>}
    </div>
  </section>;
}
