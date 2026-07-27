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
import { memo, useMemo, useState } from "react";
import { theme, v } from "../../theme";
import {
  formatTraceWalk,
  type TraceIngredient,
  type TraceStop,
  type TraceWalk,
} from "../ExplainableShell/_internal/traceWalk";

/** Junction-local ingredient palette — colors mean "chips of THIS stop",
 *  nothing across stops (a stable global key→color map would exhaust and
 *  mislead; the design review was explicit). Overflow past 4 goes gray.
 *
 *  Themeable per hue: the four are CATEGORICAL (they must stay tellable
 *  apart), so they are their own tokens rather than semantic roles. The
 *  defaults are the original hues, so nothing re-colors for existing
 *  consumers. */
const CHIP_COLORS = [
  v("--fp-chip-1", "#0d9488"),
  v("--fp-chip-2", "#d97706"),
  v("--fp-chip-3", "#7c3aed"),
  v("--fp-chip-4", "#e11d48"),
];

export interface TraceWalkCardProps {
  walk: TraceWalk;
  /** The ONE cursor — the card highlights its stop; null falls back to the anchor. */
  cursorRuntimeStageId: string | null;
  /** Active ingredient filter (breadcrumb "▸ via key"). */
  viaKey?: string | null;
  /** Map a stop to its 1-based rail step number (null = not on this rail). */
  stepNumberOf: (runtimeStageId: string) => number | null;
  /** Value preview for a contributed key at the current stop (the shell
   *  reads snapshot.memory — state as of that moment). */
  previewValueOf?: (key: string) => unknown;
  /** Follow an ingredient: re-anchor the walk on ing.key before this stop. */
  onFollowIngredient?: (ing: TraceIngredient) => void;
  /** Jump the cursor to a stop (itinerary row click). */
  onJumpToStop?: (runtimeStageId: string) => void;
  onShowAll?: () => void;
  onExit?: () => void;
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
  stepNumberOf,
  previewValueOf,
  onFollowIngredient,
  onJumpToStop,
  onShowAll,
  onExit,
  forkChooserOpen,
  onContinueTimeOrder,
  canContinueTimeOrder = true,
}: TraceWalkCardProps) {
  const [copied, setCopied] = useState(false);
  const accent = "var(--fp-accent, #6366f1)";
  // Same token the tracing rail uses (F3) — the chooser is tracing chrome.
  const tracingColor = "var(--fp-tracing, #0d9488)";

  const currentIdx = useMemo(() => {
    if (!cursorRuntimeStageId) return 0;
    const i = walk.stops.findIndex((s) => s.runtimeStageId === cursorRuntimeStageId);
    return i >= 0 ? i : 0;
  }, [walk, cursorRuntimeStageId]);
  const current: TraceStop | undefined = walk.stops[currentIdx];
  // Only FOLLOWABLE ingredients (with a writer) constitute a choice — a stop
  // whose 2+ ingredients are all run-input termini has nothing to follow,
  // so the chooser must not open a dead end (review fix).
  const followableCount = current
    ? current.ingredients.filter((ing) => ing.writerRuntimeStageId !== null).length
    : 0;
  const chooserVisible = !!forkChooserOpen && followableCount >= 2;

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
      <div data-fp="trace-walk-card" data-missing={walk.missing.reason} style={{ padding: "14px", fontSize: 13, lineHeight: 1.55 }}>
        <CardHeader label={`Why this value — \`${walk.key}\``} onExit={onExit} />
        <div style={{ color: theme.textPrimary, marginTop: 8 }}>
          {walk.missing.reason === "never-written" ? (
            <>
              <code style={{ color: accent }}>{walk.key}</code> was <b>never written in this run</b> —
              it arrived with the run&apos;s inputs.
            </>
          ) : (
            <>
              <code style={{ color: accent }}>{walk.key}</code> has <b>not been written yet at this
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
  const preview = previewValueOf ? previewValue(previewValueOf(current.contributedKeys[0] ?? walk.key)) : null;

  return (
    <div data-fp="trace-walk-card" style={{ padding: "10px 14px 14px", fontSize: 13, lineHeight: 1.5 }}>
      <CardHeader
        label={`Why this value — stop ${currentIdx + 1} of ${walk.stops.length}`}
        onExit={onExit}
      />

      {viaKey && (
        <div data-fp="twc-breadcrumb" style={{ fontSize: 11, color: theme.textMuted, marginTop: 4 }}>
          <code style={{ color: accent }}>{walk.key}</code> ▸ via <code>{viaKey}</code>
          {onShowAll && (
            <>
              {" · "}
              <button
                onClick={onShowAll}
                style={{ border: "none", background: "transparent", color: accent, cursor: "pointer", fontSize: 11, textDecoration: "underline", padding: 0 }}
              >
                show all ingredients
              </button>
            </>
          )}
        </div>
      )}

      {/* ── THIS STOP ── */}
      <div data-fp="twc-stop-headline" style={{ marginTop: 10, fontWeight: 600, color: theme.textPrimary }}>
        {step && <span style={{ color: theme.textMuted, fontWeight: 500 }}>Step {step} · </span>}
        {current.stageName}
        {current.loopPass > 0 && (
          <span style={{ color: theme.textMuted, fontWeight: 500 }}> (pass {current.loopPass})</span>
        )}
      </div>
      <div style={{ marginTop: 2, color: theme.textSecondary }}>
        wrote{" "}
        {current.contributedKeys.map((k, i) => (
          <code key={k} style={{ color: accent }}>
            {i > 0 && ", "}
            {k}
          </code>
        ))}
        {preview !== null && (
          <span style={{ color: theme.textMuted }}> = {preview}</span>
        )}
      </div>

      {/* ── Fork chooser (F2) — opened by the rail's walk-back control at a
          2+-ingredient stop: the user picks WHICH cause to follow, or keeps
          today's visit-all time order. Loud on purpose (tracing border +
          tint): it interrupts a walk, so it must not look like content. ── */}
      {chooserVisible && (
        <div
          data-fp="twc-fork-chooser"
          style={{
            marginTop: 10,
            padding: "10px 12px",
            border: `1.5px solid ${tracingColor}`,
            borderRadius: 8,
            background: `color-mix(in srgb, ${tracingColor} 8%, transparent)`,
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 12, color: theme.textPrimary }}>
            This value was made from {current.ingredients.length} ingredients — which one should
            the walk follow?
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
            {current.ingredients.map((ing, i) => (
              <IngredientChip
                key={ing.key}
                ing={ing}
                color={i < CHIP_COLORS.length ? CHIP_COLORS[i] : theme.textMuted}
                step={ing.writerRuntimeStageId ? stepNumberOf(ing.writerRuntimeStageId) : null}
                onFollow={onFollowIngredient}
              />
            ))}
          </div>
          <button
            data-fp="twc-continue-time"
            onClick={canContinueTimeOrder ? onContinueTimeOrder : undefined}
            disabled={!canContinueTimeOrder}
            title={canContinueTimeOrder ? undefined : "This is the walk's earliest stop — there is nothing earlier to visit"}
            style={{
              display: "block",
              width: "100%",
              marginTop: 8,
              border: `1px solid ${theme.border}`,
              background: theme.bgTertiary,
              color: theme.textPrimary,
              borderRadius: 6,
              padding: "5px 10px",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            visit all, oldest cause last (time order)
          </button>
        </div>
      )}

      {/* ── Ingredients (a fork = 2+ chips, both ALWAYS shown) — except
          while the chooser is open, which shows the SAME chips as the
          question; rendering both would be noise (implementer's own note,
          promoted to a fix). ── */}
      <div style={{ marginTop: 10 }}>
        {chooserVisible ? null : current.ingredients.length > 0 ? (
          <>
            <div style={{ fontSize: 11, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
              Made from {current.ingredients.length} ingredient{current.ingredients.length > 1 ? "s" : ""}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
              {current.ingredients.map((ing, i) => (
                <IngredientChip
                  key={ing.key}
                  ing={ing}
                  color={i < CHIP_COLORS.length ? CHIP_COLORS[i] : theme.textMuted}
                  step={ing.writerRuntimeStageId ? stepNumberOf(ing.writerRuntimeStageId) : null}
                  onFollow={onFollowIngredient}
                />
              ))}
            </div>
          </>
        ) : walk.readsAvailable ? (
          <div data-fp="twc-origin" style={{ fontSize: 12, color: theme.textMuted, fontStyle: "italic" }}>
            reads nothing — this is an origin.
          </div>
        ) : (
          <div data-fp="twc-unknowable" style={{ fontSize: 12, color: theme.textMuted, fontStyle: "italic" }}>
            ⚠ reads were not recorded — ingredients are unknowable, not absent.
          </div>
        )}
      </div>

      {/* ── Itinerary (the whole walk; current row highlighted) ── */}
      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 11, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600, marginBottom: 4 }}>
          The story, newest first
        </div>
        {walk.stops.map((s, i) => {
          const isCurrent = i === currentIdx;
          return (
            <button
              key={s.runtimeStageId}
              data-fp="twc-itinerary-row"
              data-current={isCurrent || undefined}
              onClick={() => onJumpToStop?.(s.runtimeStageId)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                border: "none",
                borderLeft: isCurrent ? `3px solid ${accent}` : "3px solid transparent",
                background: isCurrent ? "var(--fp-accent-bg, rgba(99,102,241,0.12))" : "transparent",
                padding: "4px 8px",
                cursor: onJumpToStop ? "pointer" : "default",
                color: "inherit",
                fontSize: 12,
              }}
            >
              <span style={{ color: theme.textMuted }}>{i + 1}.</span>{" "}
              <code style={{ color: accent }}>{s.contributedKeys.join(", ")}</code>
              <span style={{ color: theme.textMuted }}> ← </span>
              {s.stageName}
              {s.loopPass > 0 && <span style={{ color: theme.textMuted }}> (pass {s.loopPass})</span>}
              {stepNumberOf(s.runtimeStageId) && (
                <span style={{ color: theme.textMuted }}> · step {stepNumberOf(s.runtimeStageId)}</span>
              )}
              {s.ingredients.length > 1 && (
                <span style={{ color: theme.warning, fontWeight: 600 }}> ⑂ {s.ingredients.length}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Honesty footer + parity artifact ── */}
      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 4 }}>
        {walk.inputTermini.length > 0 && (
          <div data-fp="twc-run-inputs" style={{ fontSize: 11, color: theme.textMuted }}>
            ⚑ run inputs (never written): {walk.inputTermini.map((k, i) => (
              <code key={k}>
                {i > 0 && ", "}
                {k}
              </code>
            ))}
          </div>
        )}
        {walk.truncated && (
          <div data-fp="twc-truncated" style={{ fontSize: 11, color: theme.warning }}>
            ⚠ walk truncated at its frame budget — the earliest stop may not be the true origin.
          </div>
        )}
        <button
          data-fp="twc-copy-story"
          onClick={copyStory}
          style={{
            alignSelf: "flex-start",
            marginTop: 4,
            border: `1px solid ${theme.border}`,
            background: theme.bgTertiary,
            color: theme.textPrimary,
            borderRadius: 6,
            padding: "4px 10px",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {copied ? "Copied ✓" : "Copy story"}
        </button>
      </div>
    </div>
  );
});

function CardHeader({ label, onExit }: { label: string; onExit?: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ fontSize: 11, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
        {label}
      </div>
      {onExit && (
        <button
          data-fp="twc-exit"
          onClick={onExit}
          aria-label="Exit tracing"
          style={{ border: "none", background: "transparent", color: theme.textMuted, cursor: "pointer", fontSize: 12 }}
        >
          Done ✕
        </button>
      )}
    </div>
  );
}

function IngredientChip({
  ing,
  color,
  step,
  onFollow,
}: {
  ing: TraceIngredient;
  color: string;
  step: number | null;
  onFollow?: (ing: TraceIngredient) => void;
}) {
  const terminus = !ing.writerRuntimeStageId;
  return (
    <button
      data-fp="twc-ingredient"
      data-terminus={terminus || undefined}
      disabled={terminus || !onFollow}
      onClick={() => onFollow?.(ing)}
      title={
        terminus
          ? `${ing.key} was never written — it came in with the run's inputs`
          : `Follow ${ing.key} — re-anchor the walk on its writer`
      }
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        border: `1px solid ${terminus ? theme.border : color}`,
        background: "transparent",
        color: terminus ? theme.textMuted : color,
        borderRadius: 12,
        padding: "3px 10px",
        fontSize: 11,
        fontWeight: 600,
        cursor: terminus || !onFollow ? "default" : "pointer",
      }}
    >
      <code>{ing.key}</code>
      {terminus ? (
        <span style={{ fontWeight: 400 }}>— run input ⚑</span>
      ) : (
        <span style={{ fontWeight: 400 }}>
          ← {ing.writerStageName}
          {step && ` · step ${step}`}
        </span>
      )}
    </button>
  );
}

/** Bounded, JSON-ish preview — a hint, never the full payload. */
function previewValue(v: unknown): string | null {
  if (v === undefined) return null;
  try {
    const s = typeof v === "string" ? JSON.stringify(v) : JSON.stringify(v);
    if (s === undefined) return null;
    return s.length > 60 ? `${s.slice(0, 57)}…` : s;
  } catch {
    return null;
  }
}
