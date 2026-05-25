/**
 * NodeInspector — debug/teaching panel for a single stage's
 * per-node summary from a `NodeViewIndex`.
 *
 * Demonstrates the canonical L8.1 consumer pattern:
 *   1. Read the `NodeView` for `selectedId` from the index
 *   2. Use `backtraceStructural` / `forwardtraceStructural` for the
 *      prev/next chains
 *   3. Render: identity, structural neighbors (clickable to navigate),
 *      visit data (count + duration + error state), commit refs.
 *
 * Composable: this is a small demo renderer. Real consumers wire
 * their own layout — the data shape is the contract.
 */

import { useMemo } from "react";
import type { NodeViewIndex, NodeView } from "./createNodeViewRecorder";
import type { StageId } from "./_internal/keys";
import { backtraceStructural, forwardtraceStructural } from "./walkHelpers";
import type { BaseComponentProps } from "../../types";
import { theme } from "../../theme";

export interface NodeInspectorProps extends BaseComponentProps {
  /** The NodeView index (from `nodeView.getIndex()` or `useTranslator`).
   *
   *  **Pure data prop** (NOT the recorder handle) — by design. Lets
   *  consumers wrap in `useTranslator(nodeView, () => nodeView.getIndex())`
   *  at the parent, or pass a static index from tests / Storybook /
   *  SSR. Mirrors `<CommitInspector index={...}>` for consistency. */
  index: NodeViewIndex;
  /** Which stage to inspect. When `null`, renders the placeholder. */
  selectedId: StageId | null;
  /** Click handler — receives a stageId for breadcrumb navigation. */
  onNavigate?: (stageId: StageId) => void;
  /** When true, the prev/next chains include only `visitedInRun` nodes
   *  (runtime-filtered view). */
  onlyVisited?: boolean;
}

export function NodeInspector({
  index,
  selectedId,
  onNavigate,
  onlyVisited = false,
  className,
  style,
}: NodeInspectorProps) {
  const view = selectedId ? index.byStageId.get(selectedId) ?? null : null;

  // Backtrace (root-first chain ending at this stage) — recomputes
  // when index version OR selectedId OR onlyVisited changes.
  const prevChain = useMemo(
    () => (view ? backtraceStructural(index, view.stageId, { onlyVisited }) : []),
    [index, view, onlyVisited],
  );
  // Forward-trace (this stage → leaf or fork).
  const nextChain = useMemo(
    () => (view ? forwardtraceStructural(index, view.stageId, { onlyVisited }) : []),
    [index, view, onlyVisited],
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
        Select a stage to inspect.
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
          {view.label}
        </div>
        <div style={{ fontSize: 11, fontFamily: "monospace", color: theme.textMuted, marginTop: 2 }}>
          {view.stageId} · {view.type}
          {view.isDecider && " · decider"}
          {view.isFork && " · fork"}
          {view.isSubflow && " · subflow"}
          {view.isStreaming && " · streaming"}
          {view.isPausable && " · pausable"}
        </div>
        {view.description && (
          <div style={{ fontSize: 12, color: theme.textSecondary, marginTop: 6 }}>
            {view.description}
          </div>
        )}
      </div>

      {/* ── Visit data ────────────────────────────────────────── */}
      <Section title="Runtime">
        <Row label="Visited" value={view.visitedInRun ? "yes" : "no"} />
        {view.visitedInRun && (
          <>
            <Row label="Executions" value={String(view.executionCount)} />
            {view.firstExecutedAt !== null && (
              <Row label="First at" value={`${view.firstExecutedAt.toFixed(1)}ms`} />
            )}
            {view.lastExecutedAt !== null && (
              <Row label="Last at" value={`${view.lastExecutedAt.toFixed(1)}ms`} />
            )}
            {view.totalDurationMs > 0 && (
              <Row label="Total" value={`${view.totalDurationMs.toFixed(1)}ms`} />
            )}
            {view.errorCount > 0 && (
              <Row label="Errors" value={String(view.errorCount)} valueColor={theme.error} />
            )}
          </>
        )}
      </Section>

      {/* ── Structural prev chain (clickable breadcrumb) ──────── */}
      {prevChain.length > 1 && (
        <Section title={`Prev chain (${prevChain.length - 1} hops)`}>
          <Crumbs nodes={prevChain.slice(0, -1)} onClick={onNavigate} />
        </Section>
      )}
      {view.prevIds.length > 1 && (
        <Section title="Multiple prev (convergence)">
          <Crumbs
            nodes={view.prevIds
              .map((id) => index.byStageId.get(id))
              .filter((n): n is NodeView => n !== undefined)}
            onClick={onNavigate}
          />
        </Section>
      )}

      {/* ── Structural next chain ─────────────────────────────── */}
      {nextChain.length > 1 && (
        <Section title={`Next chain (${nextChain.length - 1} hops)`}>
          <Crumbs nodes={nextChain.slice(1)} onClick={onNavigate} />
        </Section>
      )}
      {view.nextIds.length > 1 && (
        <Section title="Multiple next (fork/decider)">
          <Crumbs
            nodes={view.nextIds
              .map((id) => index.byStageId.get(id))
              .filter((n): n is NodeView => n !== undefined)}
            onClick={onNavigate}
          />
        </Section>
      )}

      {/* ── Commit refs (join key into CommitFlowIndex from L8.2) ── */}
      {view.commitRuntimeStageIds.length > 0 && (
        <Section title={`Commits (${view.commitRuntimeStageIds.length})`}>
          <div style={{ fontFamily: "monospace", fontSize: 11, color: theme.textSecondary }}>
            {view.commitRuntimeStageIds.map((rsid) => (
              <div key={rsid}>{rsid}</div>
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

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "2px 0" }}>
      <span style={{ color: theme.textMuted }}>{label}</span>
      <span style={{ color: valueColor ?? theme.textSecondary, fontFamily: "monospace" }}>{value}</span>
    </div>
  );
}

function Crumbs({ nodes, onClick }: { nodes: NodeView[]; onClick?: (id: StageId) => void }) {
  if (nodes.length === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {nodes.map((n, i) => (
        <span key={n.stageId} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <button
            onClick={onClick ? () => onClick(n.stageId) : undefined}
            style={{
              fontSize: 11,
              fontFamily: "monospace",
              padding: "3px 8px",
              borderRadius: 4,
              border: `1px solid ${theme.border}`,
              background: "transparent",
              color: n.visitedInRun ? theme.success : theme.textSecondary,
              cursor: onClick ? "pointer" : "default",
            }}
          >
            {n.label}
          </button>
          {i < nodes.length - 1 && <span style={{ color: theme.textMuted, fontSize: 10 }}>›</span>}
        </span>
      ))}
    </div>
  );
}
