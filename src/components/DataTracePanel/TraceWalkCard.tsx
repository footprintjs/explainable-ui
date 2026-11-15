import { FootprintCode, FootprintButton, FootprintIcon, FootprintTooltip } from "../../theme";
/**
 * TraceWalkCard — the "WHY THIS VALUE" stop card for Same-Rail Rewind.
 *
 * One card per rail stop: who wrote the value here, what it was made from
 * (ingredient chips — a FORK is just a stop with 2+ chips, both always
 * shown), and the full itinerary below. Clicking an ingredient FOLLOWS it:
 * the shell re-anchors the walk on that key (never a special traversal —
 * see traceWalk.ts) and the breadcrumb keeps the thread visible.
 *
 * Honest absence renders as a full card with one of TWO truthful sentences
 * (never-written vs not-yet-written) — a missing value is an answer, not
 * an empty list. [Copy story] emits formatTraceWalk's exact string: the
 * human's board and an LLM's backtrack answer are the same text.
 */
import { scopeSentence, START_SENTENCE, inputSentence, isInvocationStart, mountLabel } from "../../trace/tracePresentation";
import { handoffSentence, type SubflowHandoffSource } from "../../trace/subflowHandoff";
import { recordedPathLabel, recordedValuePreview } from "../../trace/recordedValuePreview";
import { buildTraceDependencyGraph } from "../../trace/traceDependencyGraph";
import { traceIngredientColor, traceNodeColors } from "../../trace/traceWorkflowOverlay";
import { memo, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { componentStyles, theme } from "../../theme";
import type { BaseComponentProps, Size } from "../../types";
import {
  formatTraceWalk,
  type TraceIngredient,
  type TraceStop,
  type TraceWalk,
} from "../../trace/traceWalk";

/**
 * Styles vanish in `unstyled` mode; the tree stays exactly the same. The
 * card's two helper components take this as a prop rather than reading a
 * module flag — one card can be unstyled while another next to it is not.
 */
type Sx = (s: CSSProperties) => CSSProperties | undefined;
const PAINT: Sx = (s) => s;
const BARE: Sx = () => undefined;

/** The type scale for one card, resolved from its `size`. */
type Ui = ReturnType<typeof componentStyles>;

export interface TraceWalkCardProps extends BaseComponentProps {
  walk: TraceWalk;
  /** The ONE cursor — the card highlights its stop; null falls back to the anchor. */
  cursorRuntimeStageId: string | null;
  /** Active ingredient filter (breadcrumb "▸ via key"). */
  viaKey?: string | null;
  /** Original question followed by exact variable/invocation hops, including the current question. */
  questionTrail?: readonly { key: string; invocationPath: readonly string[] }[];
  /** Restore a saved question and its original cutoff/cursor. */
  onReturnToQuestion?: (index: number) => void;
  /** Map a stop to its 1-based rail step number (null = not on this rail). */
  stepNumberOf: (runtimeStageId: string) => number | null;
  /** Value preview for a contributed key at the current stop (the shell
   *  reads snapshot.memory — state as of that moment). */
  previewValueOf?: (key: string) => unknown;
  /** Follow an ingredient: re-anchor the walk on ing.key before this stop. */
  onFollowIngredient?: (ing: TraceIngredient) => void;
  /** Open an exact child invocation and trace its recorded source on that scope's rail. */
  onFollowHandoff?: (source: SubflowHandoffSource) => void;
  /** Jump the cursor to a stop (itinerary row click). */
  onJumpToStop?: (runtimeStageId: string) => void;
  onShowAll?: () => void;
  onExit?: () => void;
  /** Optional return destination; defaults to the legacy Done label. */
  exitLabel?: string;
  /** Accessible return action; defaults to Exit tracing. */
  exitAriaLabel?: string;
  /** F2 fork chooser: when true AND the current stop has 2+ ingredients,
   *  a loud chooser block asks WHICH ingredient the walk should follow —
   *  the rail's walk-back control opens it instead of moving. */
  forkChooserOpen?: boolean;
  /** The chooser's neutral option — today's behavior: step to the nearest
   *  earlier stop in time. The SHELL computes the move; the card only
   *  fires this. */
  onContinueTimeOrder?: () => void;
  /** False at the walk's earliest stop — there IS no earlier stop, so the
   *  chooser's time-order button must not pretend to move (review fix). */
  canContinueTimeOrder?: boolean;
}

export const TraceWalkCard = memo(function TraceWalkCard({
  walk,
  cursorRuntimeStageId,
  viaKey,
  questionTrail,
  onReturnToQuestion,
  stepNumberOf,
  previewValueOf,
  onFollowIngredient,
  onFollowHandoff,
  onJumpToStop,
  onShowAll,
  onExit,
  exitLabel,
  exitAriaLabel,
  forkChooserOpen,
  onContinueTimeOrder,
  canContinueTimeOrder = true,
  size = "default",
  unstyled = false,
  className,
  style,
}: TraceWalkCardProps) {
  const presentation = walk.scope;
  const ui = componentStyles(size);
  const controls = { unstyled, densitySize: size };
  const sx = unstyled ? BARE : PAINT;
  const [copied, setCopied] = useState(false);
  const accent = "var(--fp-accent, #6366f1)";
  // Same token the tracing rail uses (F3) — the chooser is tracing chrome.
  const tracingColor = "var(--fp-tracing, #0d9488)";
  const dependencyGraph = useMemo(() => buildTraceDependencyGraph(walk), [walk]);
  const ingredientColors = useMemo(() => traceNodeColors(dependencyGraph), [dependencyGraph]);

  const currentIdx = useMemo(() => {
    if (!cursorRuntimeStageId) return 0;
    const i = walk.stops.findIndex((s) => s.runtimeStageId === cursorRuntimeStageId);
    return i >= 0 ? i : 0;
  }, [walk, cursorRuntimeStageId]);
  const current: TraceStop | undefined = walk.stops[currentIdx];
  const boundary = mountLabel(presentation, current?.runtimeStageId ?? "");
  const atInvocationStart = isInvocationStart(presentation, current?.runtimeStageId ?? "");
  // Only FOLLOWABLE ingredients (with a writer) constitute a choice — a stop
  // whose 2+ ingredients are all run-input termini has nothing to follow,
  // so the chooser must not open a dead end (review fix).
  const followableCount = current
    ? current.ingredients.filter((ing) => ing.writerRuntimeStageId !== null).length
    : 0;
  const chooserVisible = !!forkChooserOpen && followableCount >= 2;

  const inputLabel = inputSentence(presentation, walk.key);
  const copyStory = () => {
    const text = formatTraceWalk(walk, stepNumberOf);
    void navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  };

  // ── Honest absence: a full answer, not an empty chain ──
  if (walk.missing) {
    return (
      <div
        className={className}
        data-fp="trace-walk-card"
        data-missing={walk.missing.reason}
        style={{ ...sx({ padding: `calc(${ui.padding} + 2px)`, fontSize: `calc(${ui.body} + 1px)`, lineHeight: ui.lineHeight, fontFamily: theme.fontSans, fontWeight: ui.weightNormal }), ...style }}
      >
        <CardHeader label={`Why this value — \`${walk.key}\``} onExit={onExit} exitLabel={exitLabel} exitAriaLabel={exitAriaLabel} sx={sx} ui={ui} size={size} unstyled={unstyled} />
        <QuestionTrail entries={questionTrail} onReturn={onReturnToQuestion} sx={sx} ui={ui} size={size} unstyled={unstyled} />
        {scopeSentence(presentation) && <div data-fp="trace-scope-note">{scopeSentence(presentation)}</div>}
        <div style={sx({ color: theme.textPrimary, marginTop: ui.spaceSm })}>
          {walk.missing.reason === "evidence-unavailable" ? (
            <><FootprintCode {...controls} part="trace-value" defaultStyle={sx({ fontFamily: theme.fontMono, fontSize: "inherit" })}>{walk.key}</FootprintCode>: write evidence is unavailable; value origin unknown.</>
          ) : walk.missing.reason === "never-written" ? (
            <><FootprintCode {...controls} part="trace-value" defaultStyle={sx({ fontFamily: theme.fontMono, fontSize: "inherit", color: accent })}>{walk.key}</FootprintCode>: {inputLabel}.</>
          ) : (
            <>
              <FootprintCode {...controls} part="trace-value" defaultStyle={sx({ fontFamily: theme.fontMono, fontSize: "inherit", color: accent })}>{walk.key}</FootprintCode> has <b>not been written yet at this
              moment</b> — its first write happens later
              {walk.missing.firstWriterStageName && (
                <>
                  , at <b>{walk.missing.firstWriterStageName}</b>
                  {walk.missing.firstWriterRuntimeStageId &&
                    stepNumberOf(walk.missing.firstWriterRuntimeStageId) && (
                      <> (step {stepNumberOf(walk.missing.firstWriterRuntimeStageId)})</>
                    )}
                </>
              )}
              .
            </>
          )}
        </div>
      </div>
    );
  }

  if (!current) return null;

  const step = stepNumberOf(current.runtimeStageId);
  const preview = previewValueOf ? recordedValuePreview(previewValueOf(current.contributedKeys[0] ?? walk.key)) : null;

  return (
    <div
      className={className}
      data-fp="trace-walk-card"
      style={{ ...sx({ padding: `calc(${ui.spaceSm} + 2px) calc(${ui.padding} + 2px) calc(${ui.padding} + 2px)`, fontSize: `calc(${ui.body} + 1px)`, lineHeight: ui.lineHeight, fontFamily: theme.fontSans, fontWeight: ui.weightNormal }), ...style }}
    >
      <CardHeader
        label={`Why ${recordedPathLabel(walk.key)}?`}
        onExit={onExit}
        exitLabel={exitLabel}
        exitAriaLabel={exitAriaLabel}
        sx={sx}
        ui={ui} size={size} unstyled={unstyled}
      />

      <QuestionTrail entries={questionTrail} onReturn={onReturnToQuestion} sx={sx} ui={ui} size={size} unstyled={unstyled} />
      <div style={sx({ marginTop: ui.spaceSm, fontSize: ui.label, color: theme.textSecondary })}>
        Recorded stop {currentIdx + 1} of {walk.stops.length}
      </div>

      {viaKey && !questionTrail?.length && (
        <div data-fp="twc-breadcrumb" style={sx({ fontSize: ui.label, color: theme.textMuted, marginTop: ui.spaceXs })}>
              <FootprintCode {...controls} part="trace-value" defaultStyle={sx({ fontFamily: theme.fontMono, fontSize: "inherit", color: accent })}>{walk.key}</FootprintCode> ▸ via <FootprintCode {...controls} part="trace-value" defaultStyle={sx({ fontFamily: theme.fontMono, fontSize: "inherit" })}>{viaKey}</FootprintCode>
          {onShowAll && (
            <>
              {" · "}
              <FootprintButton {...controls}
                type="button"
                onClick={onShowAll}
                part="trace-show-all"
                defaultStyle={sx({ border: "none", background: "transparent", color: accent, cursor: "pointer", minHeight: ui.controlHeight, fontSize: ui.label, textDecoration: "underline", padding: 0 })}
              >
                show all ingredients
              </FootprintButton>
            </>
          )}
        </div>
      )}

      {scopeSentence(presentation) && <div data-fp="trace-scope-note">{scopeSentence(presentation)}</div>}
      {/* ── THIS STOP ── */}
      <div data-fp="twc-stop-headline" style={sx({ marginTop: `calc(${ui.spaceSm} + 2px)`, fontWeight: ui.weightStrong, color: theme.textPrimary })}>
        {step && <span style={sx({ color: theme.textSecondary, fontWeight: ui.weightMedium })}>Execution step {step} · </span>}
        {current.stageName}
        {current.loopPass > 0 && (
          <span style={sx({ color: theme.textMuted, fontWeight: ui.weightMedium })}> (pass {current.loopPass})</span>
        )}
      </div>
      <div style={sx({ marginTop: `calc(${ui.spaceXs} / 2)`, color: theme.textSecondary })}>
        wrote{" "}
        {current.contributedKeys.map((k, i) => (
          <FootprintCode {...controls} part="trace-value" key={k} defaultStyle={sx({ color: accent })}>
            {i > 0 && ", "}
            {recordedPathLabel(k)}
          </FootprintCode>
        ))}
        {preview !== null && (
          <span style={sx({ color: theme.textPrimary, fontWeight: ui.weightStrong })}> = {preview}</span>
        )}
      </div>

      {/* ── Fork chooser (F2) — opened by the rail's walk-back control at a
          2+-ingredient stop: the user picks WHICH cause to follow, or keeps
          today's visit-all time order. Loud on purpose (tracing border +
          tint): it interrupts a walk, so it must not look like content. ── */}
      {chooserVisible && (
        <div
          data-fp="twc-fork-chooser"
          style={sx({
            marginTop: `calc(${ui.spaceSm} + 2px)`,
            padding: `calc(${ui.spaceSm} + 2px) ${ui.padding}`,
            border: `calc(${ui.borderWidth} * 1.5) solid ${tracingColor}`,
            borderRadius: ui.radiusPanel,
            background: `color-mix(in srgb, ${tracingColor} 8%, transparent)`,
          })}
        >
          <div style={sx({ fontWeight: ui.weightStrong, fontSize: ui.body, color: theme.textPrimary })}>
            This step has {current.ingredients.length} recorded state reads. Which source should
            the walk follow?
          </div>
          <div style={sx({ display: "flex", flexWrap: "wrap", gap: ui.controlGap, marginTop: ui.spaceSm })}>
            {current.ingredients.map(ing => (
              <IngredientChip
                key={ing.key}
                ing={ing}
                color={traceIngredientColor(dependencyGraph, ingredientColors, ing)}
                step={ing.writerRuntimeStageId ? stepNumberOf(ing.writerRuntimeStageId) : null}
                onFollow={onFollowIngredient}
                sx={sx}
                ui={ui} size={size} unstyled={unstyled}
                inputLabel={inputSentence(presentation, ing.key)}
              />
            ))}
          </div>
          <FootprintButton {...controls}
            type="button"
            data-fp="twc-continue-time" part="trace-continue"
            onClick={canContinueTimeOrder ? onContinueTimeOrder : undefined}
            disabled={!canContinueTimeOrder}
            title={canContinueTimeOrder ? undefined : "This is the walk's earliest stop — there is nothing earlier to visit"}
            defaultStyle={sx({
              display: "block",
              width: "100%",
              marginTop: ui.spaceSm,
              border: `${ui.borderWidth} solid ${theme.border}`,
              background: theme.bgTertiary,
              color: theme.textPrimary,
              borderRadius: ui.radiusControl,
              padding: ui.controlPadding, minHeight: ui.controlHeight,
              fontSize: ui.label,
              fontWeight: ui.weightStrong,
              cursor: "pointer",
            })}
          >
            visit all recorded steps (newest first)
          </FootprintButton>
        </div>
      )}

      {/* ── Ingredients (a fork = 2+ chips, both ALWAYS shown) — except
          while the chooser is open, which shows the SAME chips as the
          question; rendering both would be noise (implementer's own note,
          promoted to a fix). ── */}
      <div style={sx({ marginTop: `calc(${ui.spaceSm} + 2px)` })}>
        {atInvocationStart ? <div data-fp="twc-boundary">{START_SENTENCE}.</div> : boundary ? <div data-fp="twc-boundary">subflow boundary: {boundary}; drill in to inspect its local record.</div> : chooserVisible ? null : current.ingredients.length > 0 ? (
          <>
            <div style={sx({ fontSize: ui.label, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: ui.weightStrong })}>
              Recorded state reads ({current.ingredients.length})
            </div>
            {followableCount > 1 && <div style={sx({ marginTop: ui.spaceXs, fontSize: ui.label, color: theme.textSecondary })}>Choose a recorded input to follow; these inputs may be independent.</div>}
            <div style={sx({ display: "flex", flexWrap: "wrap", gap: ui.controlGap, marginTop: ui.controlGap })}>
              {current.ingredients.map(ing => (
                <IngredientChip
                  key={ing.key}
                  ing={ing}
                  color={traceIngredientColor(dependencyGraph, ingredientColors, ing)}
                  step={ing.writerRuntimeStageId ? stepNumberOf(ing.writerRuntimeStageId) : null}
                  onFollow={onFollowIngredient}
                  sx={sx}
                  ui={ui} size={size} unstyled={unstyled}
                  inputLabel={inputSentence(presentation, ing.key)}
                />
              ))}
            </div>
          </>
        ) : walk.readsAvailable ? (
          <div data-fp="twc-origin" style={sx({ fontSize: ui.body, color: theme.textMuted, fontStyle: "italic" })}>
            No recorded state reads.
          </div>
        ) : (
          <div data-fp="twc-unknowable" style={sx({ fontSize: ui.body, color: theme.textMuted, fontStyle: "italic" })}>
            ⚠ reads were not recorded — dependencies are unknowable, not absent.
          </div>
        )}
      </div>

      {!!current.handoffSources?.length && <div data-fp="twc-handoff" style={sx({ marginTop: `calc(${ui.spaceSm} + 2px)` })}>
        <div style={sx({ fontSize: ui.label, color: theme.textMuted })}>{handoffSentence(current.handoffSources)}</div>
        {onFollowHandoff && current.handoffSources.map(source => <FootprintButton {...controls}
          key={source.key}
          type="button"
          data-fp="twc-handoff-source" part="trace-handoff"
          aria-label={`Follow child source ${source.key} in ${source.mountRuntimeStageId}`}
          onClick={() => onFollowHandoff(source)}
          defaultStyle={sx({ marginTop: ui.controlGap, marginRight: ui.controlGap, border: `${ui.borderWidth} solid ${accent}`, borderRadius: ui.radiusBadge, background: "transparent", color: accent, padding: `calc(${ui.spaceXs} - 1px) calc(${ui.controlPaddingX} + 2px)`, minHeight: ui.controlHeight, cursor: "pointer", fontSize: ui.label })}
        >Follow child source <FootprintCode {...controls} part="trace-value" defaultStyle={sx({ fontFamily: theme.fontMono, fontSize: "inherit" })}>{source.key}</FootprintCode></FootprintButton>)}
      </div>}

      {/* ── Itinerary (the whole walk; current row highlighted) ── */}
      <div style={sx({ marginTop: ui.spaceLg })}>
        <div style={sx({ fontSize: ui.label, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: ui.weightStrong, marginBottom: ui.spaceXs })}>
          Recorded steps, newest first
        </div>
        {walk.stops.map((s, i) => {
          const isCurrent = i === currentIdx;
          return (
            <FootprintButton {...controls}
              type="button"
              key={s.runtimeStageId}
              data-fp="twc-itinerary-row" part="trace-itinerary-stop"
              data-current={isCurrent || undefined}
              onClick={() => onJumpToStop?.(s.runtimeStageId)}
              defaultStyle={sx({
                display: "block",
                width: "100%",
                textAlign: "left",
                border: "none",
                borderLeft: isCurrent ? `calc(${ui.borderWidth} * 3) solid ${accent}` : `calc(${ui.borderWidth} * 3) solid transparent`,
                background: isCurrent ? "var(--fp-accent-bg, rgba(99,102,241,0.12))" : "transparent",
                padding: ui.controlPadding, minHeight: ui.controlHeight,
                cursor: onJumpToStop ? "pointer" : "default",
                color: "inherit",
                fontSize: ui.body,
              })}
            >
              <span style={sx({ color: theme.textMuted })}>{i + 1}.</span>{" "}
              <FootprintCode {...controls} part="trace-value" defaultStyle={sx({ fontFamily: theme.fontMono, fontSize: "inherit", color: accent })}>{s.contributedKeys.map(recordedPathLabel).join(", ")}</FootprintCode>
              <span style={sx({ color: theme.textMuted })}> ← </span>
              {s.stageName}
              {s.loopPass > 0 && <span style={sx({ color: theme.textMuted })}> (pass {s.loopPass})</span>}
              {stepNumberOf(s.runtimeStageId) && (
                <span style={sx({ color: theme.textMuted })}> · step {stepNumberOf(s.runtimeStageId)}</span>
              )}
              {s.ingredients.length > 1 && (
                <span style={sx({ color: theme.warning, fontWeight: ui.weightStrong })}> ⑂ {s.ingredients.length}</span>
              )}
            </FootprintButton>
          );
        })}
      </div>

      {/* ── Honesty footer + parity artifact ── */}
      <div style={sx({ marginTop: ui.spaceMd, display: "flex", flexDirection: "column", gap: ui.spaceXs })}>
        {walk.inputTermini.length > 0 && (
          <div data-fp="twc-run-inputs" style={sx({ fontSize: ui.label, color: theme.textMuted })}>
            ⚑ No local writer: {walk.inputTermini.map((k, i) => (
              <span key={k}>{i > 0 && ", "}<FootprintCode {...controls} part="trace-value" defaultStyle={sx({ fontFamily: theme.fontMono, fontSize: "inherit" })}>{k}</FootprintCode> ({inputSentence(presentation, k)})</span>
            ))}
          </div>
        )}
        {walk.truncated && (
          <div data-fp="twc-truncated" style={sx({ fontSize: ui.label, color: theme.warning })}>
            <FootprintIcon {...controls} name="warning" part="trace-warning-icon" defaultStyle={sx({ color: theme.warning, fontSize: ui.iconSize })}>⚠</FootprintIcon> trace limited by its frame or depth budget — earlier recorded state reads may be missing.
          </div>
        )}
        <FootprintButton {...controls}
          type="button"
          data-fp="twc-copy-story" part="trace-copy"
          onClick={copyStory}
          defaultStyle={sx({
            alignSelf: "flex-start",
            marginTop: ui.spaceXs,
            border: `${ui.borderWidth} solid ${theme.border}`,
            background: theme.bgTertiary,
            color: theme.textPrimary,
            borderRadius: ui.radiusControl,
            padding: ui.controlPadding, minHeight: ui.controlHeight,
            fontSize: ui.label,
            fontWeight: ui.weightStrong,
            cursor: "pointer",
          })}
        >
          {copied ? "Copied ✓" : "Copy story"}
        </FootprintButton>
      </div>
    </div>
  );
});

function CardHeader({
  label,
  onExit,
  exitLabel,
  exitAriaLabel,
  sx,
  ui,
  size,
  unstyled,
}: {
  label: string;
  onExit?: () => void;
  exitLabel?: string;
  exitAriaLabel?: string;
  sx: Sx;
  ui: Ui;
  size: Size;
  unstyled: boolean;
}) {
  const controls = { unstyled, densitySize: size };
  return (
    <div style={sx({ display: "flex", alignItems: "center", justifyContent: "space-between",
      flexWrap: exitLabel !== undefined ? "wrap" : undefined, gap: exitLabel !== undefined ? ui.spaceSm : undefined })}>
      <div style={sx({ fontSize: ui.title, color: theme.textPrimary, fontWeight: ui.weightStrong, overflowWrap: "anywhere", minWidth: 0 })}>
        {label}
      </div>
      {onExit && (
        <FootprintButton {...controls}
          type="button"
          data-fp="twc-exit" part="trace-exit"
          onClick={onExit}
          aria-label={exitAriaLabel ?? "Exit tracing"}
          defaultStyle={sx({ border: "none", background: "transparent", color: theme.textMuted, cursor: "pointer", fontSize: ui.body, minHeight: ui.controlHeight,
            ...(exitLabel !== undefined ? { maxWidth: "100%", overflowWrap: "anywhere", textAlign: "left" } : {}) })}
        >
          {exitLabel ?? "Done ✕"}
        </FootprintButton>
      )}
    </div>
  );
}

function QuestionTrail({ entries, onReturn, sx, ui, size, unstyled }: {
  entries: TraceWalkCardProps["questionTrail"];
  onReturn: TraceWalkCardProps["onReturnToQuestion"];
  sx: Sx;
  ui: Ui;
  size: Size;
  unstyled: boolean;
}) {
  const controls = { unstyled, densitySize: size };
  if (!entries || entries.length < 2) return null;
  const previous = entries[entries.length - 2];
  return <nav aria-label="Investigation trail" data-fp="twc-question-trail" style={sx({ marginTop: `calc(${ui.spaceSm} + 2px)`, padding: `${ui.spaceSm} calc(${ui.controlPaddingX} + 2px)`, border: `${ui.borderWidth} solid ${theme.border}`, borderRadius: ui.radiusPanel, boxShadow: ui.shadowPanel, background: theme.bgSecondary })}>
    <div style={sx({ display: "flex", flexWrap: "wrap", alignItems: "center", gap: ui.controlGap, fontSize: ui.label })}>
      {entries.map((entry, index) => <span key={`${index}:${entry.key}`} style={sx({ display: "inline-flex", alignItems: "center", gap: ui.controlGap })}>
        {index > 0 && <span aria-hidden="true">›</span>}
        {index === entries.length - 1 ? <span aria-current="step"><FootprintCode {...controls} part="trace-value" defaultStyle={sx({ fontFamily: theme.fontMono, fontSize: "inherit" })}>{recordedPathLabel(entry.key)}</FootprintCode></span> : <FootprintButton {...controls} part="trace-question-return" type="button" onClick={() => onReturn?.(index)} disabled={!onReturn}
          aria-label={`Return to ${entry.key} in ${entry.invocationPath.join(" → ") || "root"}`}
          title={`${entry.invocationPath.length ? entry.invocationPath.join(" → ") : "Root"}: ${entry.key}`}
          defaultStyle={sx({ padding: 0, border: "none", background: "transparent", color: theme.accent, cursor: "pointer", textDecoration: "underline", fontSize: ui.label, minHeight: ui.controlHeight })}>
          <FootprintCode {...controls} part="trace-value" defaultStyle={sx({ fontFamily: theme.fontMono, fontSize: "inherit" })}>{recordedPathLabel(entry.key)}</FootprintCode>
        </FootprintButton>}
      </span>)}
    </div>
    <FootprintButton {...controls} part="trace-question-back" type="button" onClick={() => onReturn?.(entries.length - 2)} disabled={!onReturn}
      defaultStyle={sx({ display: "block", marginTop: ui.spaceSm, border: "none", background: "transparent", color: theme.textPrimary, fontSize: ui.body, cursor: "pointer", padding: 0, minHeight: ui.controlHeight, fontWeight: ui.weightStrong })}>
      ← Back to <FootprintCode {...controls} part="trace-value" defaultStyle={sx({ fontFamily: theme.fontMono, fontSize: "inherit" })}>{recordedPathLabel(previous.key)}</FootprintCode>
      {previous.invocationPath.length !== entries[entries.length - 1].invocationPath.length ? " in parent" : ""}
    </FootprintButton>
  </nav>;
}

function IngredientChip({
  ing,
  color,
  step,
  onFollow,
  sx,
  ui,
  size,
  unstyled,
  inputLabel,
}: {
  ing: TraceIngredient;
  inputLabel: string;
  color: string;
  step: number | null;
  onFollow?: (ing: TraceIngredient) => void;
  sx: Sx;
  ui: Ui;
  size: Size;
  unstyled: boolean;
}) {
  const controls = { unstyled, densitySize: size };
  const terminus = !ing.writerRuntimeStageId;
  const tooltip = terminus ? `${ing.key}: ${inputLabel}` : `Follow ${ing.key} — re-anchor the walk on its writer`;
  return (
    <FootprintTooltip {...controls} part="trace-ingredient-tooltip" content={tooltip} title="">
    <FootprintButton {...controls}
      type="button"
      data-fp="twc-ingredient" part="trace-ingredient"
      data-terminus={terminus || undefined}
      disabled={terminus || !onFollow}
      onClick={() => onFollow?.(ing)}
      title={tooltip}
      defaultStyle={sx({
        display: "inline-flex",
        alignItems: "center",
        gap: ui.spaceXs,
        border: `${ui.borderWidth} solid ${terminus ? theme.border : color}`,
        background: "transparent",
        color: terminus ? theme.textMuted : color,
        borderRadius: ui.radiusBadge,
        padding: `calc(${ui.spaceXs} - 1px) calc(${ui.controlPaddingX} + 2px)`, minHeight: ui.controlHeight,
        fontSize: ui.label,
        fontWeight: ui.weightStrong,
        cursor: terminus || !onFollow ? "default" : "pointer",
      })}
    >
      <FootprintCode {...controls} part="trace-value" defaultStyle={sx({ fontFamily: theme.fontMono, fontSize: "inherit" })}>{recordedPathLabel(ing.key)}</FootprintCode>
      {terminus ? (
        <span style={sx({ fontWeight: ui.weightNormal })}>— {inputLabel} ⚑</span>
      ) : (
        <span style={sx({ fontWeight: ui.weightNormal })}>
          ← {ing.writerStageName}
          {step && ` · step ${step}`}
        </span>
      )}
    </FootprintButton>
    </FootprintTooltip>
  );
}
