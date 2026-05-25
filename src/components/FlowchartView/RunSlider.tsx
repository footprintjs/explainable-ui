/**
 * RunSlider — time-travel cursor over the commit timeline.
 *
 * Implements the **ONE-CURSOR** model from the Lens architecture: the
 * slider position IS the same `runtimeStageId` cursor that selection
 * uses everywhere else (chain view, inspectors). Moving the slider
 * advances the cursor; clicking a commit in the chain view moves the
 * slider. Same underlying state, two affordances.
 *
 * Internal mapping
 * ────────────────
 *   Slider value is a `commitIdx` integer in `[0, commits.length - 1]`.
 *     - slider value N  ↔  `commits[N].runtimeStageId` (the cursor)
 *     - cursor === null ↔  slider at value 0 (initial/empty state)
 *
 *   When `commits[]` grows mid-run the slider's max bound expands
 *   automatically (`index.commits.length` re-evaluates on every
 *   render via the consumer's `useTranslator` subscription). The
 *   cursor does NOT auto-advance — consumers that want "follow latest
 *   commit" behavior wire a `useEffect` on `index.commits.length`.
 *
 * @example
 * ```tsx
 * const [cursor, setCursor] = useState<RuntimeStageId | null>(null);
 * const index = useTranslator(commitFlow, () => commitFlow.getIndex());
 * return (
 *   <RunSlider
 *     index={index}
 *     cursorRuntimeStageId={cursor}
 *     onCursorChange={setCursor}
 *   />
 * );
 * ```
 *
 * @example Follow-latest behavior (consumer-owned)
 * ```tsx
 * useEffect(() => {
 *   const last = index.commits[index.commits.length - 1];
 *   if (last) setCursor(last.runtimeStageId);
 * }, [index.commits.length]);
 * ```
 *
 * Pairs with `<CommitChainView>` (via shared `revealedThroughCommitIdx`
 * to dim future commits) and `<TraceExplorerShell>` (which wires the
 * slider as a top bar driving the same cursor as the chain selection).
 */

import { useCallback, useMemo } from "react";
import type { CommitFlowIndex, CommitView } from "./createCommitFlowRecorder";
import type { RuntimeStageId } from "./_internal/keys";
import type { BaseComponentProps } from "../../types";
import { theme } from "../../theme";

export interface RunSliderProps extends BaseComponentProps {
  /** Live commit flow index (pure data prop — pass via
   *  `useTranslator(commitFlow, () => commitFlow.getIndex())`).
   *  Source: `createCommitFlowRecorder` — see `<CommitInspector>` for
   *  the canonical consumer pattern. */
  index: CommitFlowIndex;
  /** The shared time cursor. `null` = no commit yet selected (slider
   *  sits at value 0). */
  cursorRuntimeStageId: RuntimeStageId | null;
  /** Fires when the slider moves. */
  onCursorChange: (rsid: RuntimeStageId | null) => void;
  /** Optional label callback. Default renders `"#commitIdx · stageId"`.
   *  Receives the full resolved `commit` + the `index` for richer
   *  labels (step name, duration from a sibling translator, etc.). */
  renderLabel?: (info: {
    commitIdx: number;
    total: number;
    runtimeStageId: RuntimeStageId | null;
    /** Resolved commit at the cursor, or `null` when index is empty. */
    commit: CommitView | null;
    /** Full index — for cross-lookups (e.g., finding the previous
     *  commit's stage label). */
    index: CommitFlowIndex;
  }) => React.ReactNode;
}

export function RunSlider({
  index,
  cursorRuntimeStageId,
  onCursorChange,
  renderLabel,
  className,
  style,
}: RunSliderProps) {
  const total = index.commits.length;

  // Map cursor → slider value. If cursor is null OR unknown to the
  // index, value 0 (placeholder).
  const cursorCommitIdx = useMemo<number>(() => {
    if (!cursorRuntimeStageId) return 0;
    const view = index.byRuntimeStageId.get(cursorRuntimeStageId);
    return view ? view.commitIdx : 0;
  }, [index, cursorRuntimeStageId]);

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(e.target.value);
      const view = index.commits[value];
      onCursorChange(view ? view.runtimeStageId : null);
    },
    [index, onCursorChange],
  );

  const label = useMemo(() => {
    const commit = index.commits[cursorCommitIdx] ?? null;
    const rsid = cursorRuntimeStageId ?? commit?.runtimeStageId ?? null;
    if (renderLabel)
      return renderLabel({
        commitIdx: cursorCommitIdx,
        total,
        runtimeStageId: rsid,
        commit,
        index,
      });
    if (total === 0) return <span style={{ color: theme.textMuted }}>No commits yet</span>;
    return (
      <span style={{ fontFamily: "monospace", fontSize: 11, color: theme.textSecondary }}>
        #{cursorCommitIdx + 1} / {total} · {commit?.runtimeStageId ?? "—"}
      </span>
    );
  }, [renderLabel, cursorCommitIdx, total, index, cursorRuntimeStageId]);

  // Disabled state — slider is non-interactive when there are 0 or 1
  // commits (sliding has no effect).
  const disabled = total < 2;

  return (
    <div
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "8px 12px",
        background: theme.bgSecondary,
        border: `1px solid ${theme.border}`,
        borderRadius: 6,
        ...style,
      }}
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 0.4,
          textTransform: "uppercase",
          color: theme.textMuted,
        }}
      >
        Time
      </span>
      <input
        type="range"
        min={0}
        max={Math.max(0, total - 1)}
        step={1}
        value={Math.min(cursorCommitIdx, Math.max(0, total - 1))}
        onChange={handleSliderChange}
        disabled={disabled}
        aria-label="Commit time cursor"
        aria-valuemin={0}
        aria-valuemax={Math.max(0, total - 1)}
        aria-valuenow={cursorCommitIdx}
        aria-valuetext={
          total === 0 ? "no commits" : `commit ${cursorCommitIdx + 1} of ${total}`
        }
        style={{ flex: 1, accentColor: theme.success }}
      />
      <div style={{ minWidth: 200, textAlign: "right" }}>{label}</div>
    </div>
  );
}
