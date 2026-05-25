/**
 * CommitInspector — demo renderer for a single CommitView from a
 * `CommitFlowIndex`. Mirrors `<NodeInspector>` but commit-centric:
 *
 *   - Identity: runtimeStageId + stageId + commitIdx
 *   - Structural: prev/next stage ids (the chart-shape neighbors)
 *   - Runtime: runtimePrev/Next commit refs (the actual prev/next
 *     executions in this run — useful for time-travel breadcrumbs)
 *   - Data lineage: `dataDependencies[]` per read key + a one-click
 *     `backtraceDataFlow` walk showing the full ancestry chain
 *   - Payload: updates + reads
 */

import { useMemo } from "react";
import type {
  CommitFlowIndex,
  CommitView,
} from "./createCommitFlowRecorder";
import { backtraceDataFlow } from "./createCommitFlowRecorder";
import type { RuntimeStageId } from "./_internal/keys";
import type { BaseComponentProps } from "../../types";
import { theme } from "../../theme";

export interface CommitInspectorProps extends BaseComponentProps {
  /** The CommitFlow index (from `commitFlow.getIndex()` or `useTranslator`).
   *
   *  **Pure data prop** (NOT the recorder handle) — by design. Lets
   *  consumers wrap in `useTranslator(commitFlow, () => commitFlow.getIndex())`
   *  at the parent, or pass a static index from tests / Storybook /
   *  SSR. Mirrors `<NodeInspector index={...}>` for consistency. */
  index: CommitFlowIndex;
  /** Which commit to inspect (by runtimeStageId). null → placeholder. */
  selectedRuntimeStageId: RuntimeStageId | null;
  /** Click handler — receives a runtimeStageId for time-travel
   *  navigation. Used by all clickable references (runtime prev/next,
   *  data-dep sources, lineage chain). */
  onNavigate?: (runtimeStageId: RuntimeStageId) => void;
}

export function CommitInspector({
  index,
  selectedRuntimeStageId,
  onNavigate,
  className,
  style,
}: CommitInspectorProps) {
  const view = selectedRuntimeStageId
    ? index.byRuntimeStageId.get(selectedRuntimeStageId) ?? null
    : null;

  // Backtrace ancestry chain — recomputes when index version OR
  // selectedRuntimeStageId changes.
  const lineage = useMemo(
    () =>
      view ? backtraceDataFlow(index, view.runtimeStageId) : [],
    [index, view],
  );

  if (!view) {
    return (
      <div
        className={className}
        style={{
          padding: 16,
          color: theme.textMuted,
          fontStyle: "italic",
          ...style,
        }}
      >
        Select a commit to inspect.
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        padding: 14,
        color: theme.textPrimary,
        fontSize: 13,
        overflow: "auto",
        ...style,
      }}
    >
      {/* ── Identity ──────────────────────────────────────────── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: theme.textPrimary }}>
          {view.stageId}
        </div>
        <div
          style={{
            fontSize: 11,
            fontFamily: "monospace",
            color: theme.textMuted,
            marginTop: 2,
          }}
        >
          {view.runtimeStageId} · commitIdx {view.commitIdx}
        </div>
      </div>

      {/* ── Structural neighbors ──────────────────────────────── */}
      {view.structuralPrevIds.length > 0 && (
        <Section title="Structural prev (chart shape)">
          <PlainTags labels={view.structuralPrevIds} />
        </Section>
      )}
      {view.structuralNextIds.length > 0 && (
        <Section title="Structural next (chart shape)">
          <PlainTags labels={view.structuralNextIds} />
        </Section>
      )}

      {/* ── Runtime neighbors (clickable for time-travel) ─────── */}
      {view.runtimePrevIds.length > 0 && (
        <Section title="Runtime prev (this execution)">
          <RuntimeRefs refs={view.runtimePrevIds} onClick={onNavigate} />
        </Section>
      )}
      {view.runtimeNextIds.length > 0 && (
        <Section title="Runtime next (this execution)">
          <RuntimeRefs refs={view.runtimeNextIds} onClick={onNavigate} />
        </Section>
      )}

      {/* ── Payload ───────────────────────────────────────────── */}
      {Object.keys(view.updates).length > 0 && (
        <Section title={`Updates (${Object.keys(view.updates).length})`}>
          <KeyValueGrid entries={Object.entries(view.updates)} />
        </Section>
      )}
      {view.reads.length > 0 && (
        <Section title={`Reads (${view.reads.length})`}>
          <PlainTags labels={view.reads} />
        </Section>
      )}

      {/* ── Data dependencies (per-key lineage) ───────────────── */}
      {view.dataDependencies.length > 0 && (
        <Section title={`Data dependencies (${view.dataDependencies.length})`}>
          <table style={{ fontSize: 11, fontFamily: "monospace", width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {view.dataDependencies.map((dep) => (
                <tr key={dep.key}>
                  <td style={{ color: theme.textSecondary, padding: "2px 8px 2px 0" }}>
                    {dep.key}
                  </td>
                  <td style={{ color: dep.sourceRuntimeStageId ? theme.textPrimary : theme.textMuted }}>
                    {dep.sourceRuntimeStageId ? (
                      <button
                        onClick={onNavigate ? () => onNavigate(dep.sourceRuntimeStageId!) : undefined}
                        style={crumbButtonStyle(onNavigate !== undefined)}
                      >
                        ← {dep.sourceRuntimeStageId}
                      </button>
                    ) : (
                      <em>(no prior writer — default or external)</em>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}

      {/* ── Lineage chain (full data-flow backtrace) ──────────── */}
      {lineage.length > 1 && (
        <Section title={`Lineage chain (${lineage.length - 1} ancestor commits)`}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {lineage.slice(0, -1).map((c, i) => (
              <span key={c.runtimeStageId} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <button
                  onClick={onNavigate ? () => onNavigate(c.runtimeStageId) : undefined}
                  style={crumbButtonStyle(onNavigate !== undefined)}
                >
                  {c.runtimeStageId}
                </button>
                {i < lineage.length - 2 && (
                  <span style={{ color: theme.textMuted, fontSize: 10 }}>→</span>
                )}
              </span>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 0.4,
          textTransform: "uppercase",
          color: theme.textMuted,
          marginBottom: 6,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function PlainTags({ labels }: { labels: readonly string[] }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
      {labels.map((l) => (
        <span
          key={l}
          style={{
            fontSize: 11,
            fontFamily: "monospace",
            padding: "2px 6px",
            borderRadius: 3,
            background: "var(--fp-bg-secondary, transparent)",
            color: theme.textSecondary,
          }}
        >
          {l}
        </span>
      ))}
    </div>
  );
}

function RuntimeRefs({
  refs,
  onClick,
}: {
  refs: readonly RuntimeStageId[];
  onClick?: (rsid: RuntimeStageId) => void;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {refs.map((r) => (
        <button
          key={r}
          onClick={onClick ? () => onClick(r) : undefined}
          style={crumbButtonStyle(onClick !== undefined)}
        >
          {r}
        </button>
      ))}
    </div>
  );
}

function KeyValueGrid({ entries }: { entries: ReadonlyArray<[string, unknown]> }) {
  return (
    <table style={{ fontSize: 11, fontFamily: "monospace", width: "100%", borderCollapse: "collapse" }}>
      <tbody>
        {entries.map(([k, v]) => (
          <tr key={k}>
            <td style={{ color: theme.textSecondary, padding: "2px 8px 2px 0", verticalAlign: "top" }}>
              {k}
            </td>
            <td style={{ color: theme.textPrimary, wordBreak: "break-word" }}>
              {typeof v === "object" ? JSON.stringify(v) : String(v)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function crumbButtonStyle(clickable: boolean): React.CSSProperties {
  return {
    fontSize: 11,
    fontFamily: "monospace",
    padding: "3px 8px",
    borderRadius: 4,
    border: `1px solid ${theme.border}`,
    background: "transparent",
    color: theme.textSecondary,
    cursor: clickable ? "pointer" : "default",
  };
}
