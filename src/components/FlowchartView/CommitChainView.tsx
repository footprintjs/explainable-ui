/**
 * CommitChainView — git-log-style swim-lane renderer for a
 * `CommitChain` or `StructureChain` (from `buildCommitChainTree` or
 * `structureAsChainTree`).
 *
 * Pair with `<CommitInspector>` for master/detail — this picks,
 * that inspects.
 *
 * Time-travel dimming (L8.5)
 * ──────────────────────────
 *   Pass `revealedThroughCommitIdx={N}` (typically driven by
 *   `<RunSlider>` via the ONE-CURSOR model) to dim commits with
 *   `commitIdx > N`. Dimmed commits stay in the DOM (stable layout)
 *   and stay CLICKABLE (clicking jumps the cursor forward to that
 *   commit). Use `null` (default) to reveal all, `-1` to reveal none
 *   (e.g., stale-cursor sentinel from `<TraceExplorerShell>`).
 *
 * Layout rules
 * ────────────
 *   serial   → vertical stack of children; subtle connector between them
 *   parallel → horizontal row of branch columns (swim lanes), each
 *              column is its own chain
 *   leaf     → one box per commit (loop unrolls into N boxes); empty
 *              commits[] (or `StructureChain` leaf) renders a dashed
 *              "not executed in this run" box
 *
 * Pure data prop: pass `chain` directly. For live updates, wrap with
 * `useTranslator(commitFlow, () => buildCommitChainTree(graph, commitFlow.getIndex()))`
 * at the parent. Mirrors the consumer pattern used by `<NodeInspector>`
 * and `<CommitInspector>`.
 *
 * Pre-execution rendering: pass a `StructureChain` directly (from
 * `structureAsChainTree(graph)`) — every leaf renders as the
 * "not executed yet" placeholder. No need to manufacture an empty
 * `CommitFlowIndex`.
 *
 * Selection: `selectedRuntimeStageId` highlights one commit box;
 * `onSelectCommit` fires when any commit box is clicked.
 *
 * Future extension: the recursive renderer is factored as
 * `<ChainShell renderLeaf={...}>` so a future `<StructureChainView>`
 * can reuse the same layout primitives with a different leaf renderer.
 *
 * @example
 * ```tsx
 * const chain = useTranslator(commitFlow, () =>
 *   buildCommitChainTree(trace.getGraph(), commitFlow.getIndex()),
 * );
 * const [selected, setSelected] = useState<RuntimeStageId | null>(null);
 * return (
 *   <div style={{ display: 'flex' }}>
 *     <CommitChainView
 *       chain={chain}
 *       selectedRuntimeStageId={selected}
 *       onSelectCommit={setSelected}
 *     />
 *     <CommitInspector index={commitFlow.getIndex()} selectedRuntimeStageId={selected} />
 *   </div>
 * );
 * ```
 */

import type {
  CommitChain,
  CommitChainLeaf,
  StructureChain,
  StructureChainLeaf,
} from "./buildCommitChainTree";
import type { CommitView } from "./createCommitFlowRecorder";
import type { RuntimeStageId, StageId } from "./_internal/keys";
import type { BaseComponentProps } from "../../types";
import { theme } from "../../theme";

export interface CommitChainViewProps extends BaseComponentProps {
  /** The chain tree. Accepts BOTH `CommitChain` (from
   *  `buildCommitChainTree`) and `StructureChain` (from
   *  `structureAsChainTree` — pre-execution view). null → placeholder. */
  chain: CommitChain | StructureChain | null;
  /** Highlighted commit (by runtimeStageId). Only meaningful for
   *  `CommitChain` input (StructureChain has no commits to select). */
  selectedRuntimeStageId?: RuntimeStageId | null;
  /** Fires when a commit box is clicked — pass to `<CommitInspector>`
   *  for master/detail wiring. Not fired for "not executed" leaves. */
  onSelectCommit?: (runtimeStageId: RuntimeStageId) => void;
  /** Optional label resolver — default uses the bare stageId. Consumers
   *  can map id → friendly name (e.g., from a NodeViewIndex). */
  resolveLabel?: (stageId: StageId) => string;
  /** Time-travel cursor: commits with `commitIdx > revealedThroughCommitIdx`
   *  render dimmed (still visible — keeps layout stable). Pairs with
   *  `<RunSlider>` in the ONE-CURSOR model.
   *
   *  Semantics:
   *  - `null` (default) — reveal ALL commits (no time-travel applied).
   *  - `N >= 0` — reveal commits 0..N inclusive; dim commits with
   *    `commitIdx > N`.
   *  - `N < 0` (e.g., `-1`) — reveal NONE; all commits dim. Use this
   *    sentinel for "cursor is stale / unresolved" so the chain doesn't
   *    accidentally fall back to fully-revealed when the consumer wants
   *    no-reveal. */
  revealedThroughCommitIdx?: number | null;
}

export function CommitChainView({
  chain,
  selectedRuntimeStageId = null,
  onSelectCommit,
  resolveLabel,
  revealedThroughCommitIdx = null,
  className,
  style,
}: CommitChainViewProps) {
  if (!chain) {
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
        No chain to display.
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        padding: 12,
        color: theme.textPrimary,
        fontSize: 12,
        overflow: "auto",
        ...style,
      }}
    >
      <ChainShell
        node={chain}
        renderLeaf={(leaf) => (
          <Leaf
            leaf={leaf}
            selectedRuntimeStageId={selectedRuntimeStageId}
            onSelectCommit={onSelectCommit}
            resolveLabel={resolveLabel}
            revealedThroughCommitIdx={revealedThroughCommitIdx}
          />
        )}
      />
    </div>
  );
}

// ── Recursive layout shell (reusable by future StructureChainView) ──

type AnyChain = CommitChain | StructureChain;
type AnyLeaf = CommitChainLeaf | StructureChainLeaf;

interface ChainShellProps {
  node: AnyChain;
  renderLeaf: (leaf: AnyLeaf) => React.ReactNode;
}

function ChainShell({ node, renderLeaf }: ChainShellProps): React.ReactElement {
  if (node.kind === "leaf") {
    return <>{renderLeaf(node)}</>;
  }

  if (node.kind === "serial") {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0,
        }}
      >
        {node.items.map((child, i) => (
          <div
            key={chainKey(child, i)}
            style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
          >
            <ChainShell node={child} renderLeaf={renderLeaf} />
            {i < node.items.length - 1 && <Connector orientation="vertical" />}
          </div>
        ))}
      </div>
    );
  }

  // parallel → swim lanes
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 0,
      }}
    >
      <ForkMarker />
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 18,
          padding: "4px 0",
          borderLeft: `1px dashed ${theme.border}`,
          borderRight: `1px dashed ${theme.border}`,
          paddingLeft: 12,
          paddingRight: 12,
        }}
      >
        {node.branches.map((branch, i) => (
          <div
            key={chainKey(branch, i)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              minWidth: 120,
            }}
          >
            <ChainShell node={branch} renderLeaf={renderLeaf} />
          </div>
        ))}
      </div>
      <ForkMarker />
    </div>
  );
}

/**
 * Stable React key for serial/parallel children — derived from the
 * subtree shape so a rerender with shifted branches doesn't mis-pair
 * subtree state. Falls back to `index` only when the leaf can't be
 * located (defensive — shouldn't happen).
 */
function chainKey(node: AnyChain, fallbackIndex: number): string {
  const leaf = firstLeafOf(node);
  return leaf ? `${node.kind}:${leaf.stageId}` : `${node.kind}:idx${fallbackIndex}`;
}

function firstLeafOf(node: AnyChain): AnyLeaf | null {
  if (node.kind === "leaf") return node;
  if (node.kind === "serial") {
    for (const item of node.items) {
      const l = firstLeafOf(item);
      if (l) return l;
    }
    return null;
  }
  for (const branch of node.branches) {
    const l = firstLeafOf(branch);
    if (l) return l;
  }
  return null;
}

// ── Leaf (one or N commit boxes for loop iterations) ────────────────

function Leaf({
  leaf,
  selectedRuntimeStageId,
  onSelectCommit,
  resolveLabel,
  revealedThroughCommitIdx,
}: {
  leaf: AnyLeaf;
  selectedRuntimeStageId: RuntimeStageId | null;
  onSelectCommit?: (rsid: RuntimeStageId) => void;
  resolveLabel?: (stageId: StageId) => string;
  revealedThroughCommitIdx: number | null;
}) {
  const label = resolveLabel ? resolveLabel(leaf.stageId) : leaf.stageId;
  const commits: readonly CommitView[] =
    "commits" in leaf ? leaf.commits : [];

  if (commits.length === 0) {
    return (
      <div
        style={{
          ...boxBaseStyle,
          borderStyle: "dashed",
          color: theme.textMuted,
          background: "transparent",
        }}
        title={`${leaf.stageId} — not executed in this run`}
      >
        <div style={{ fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 10, fontStyle: "italic" }}>not executed</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      {commits.map((c, i) => {
        const isSelected = c.runtimeStageId === selectedRuntimeStageId;
        const clickable = onSelectCommit !== undefined;
        // Time-travel dimming: when revealedThroughCommitIdx is set,
        // commits BEYOND the cursor render dimmed (still in the DOM
        // so layout stays stable as the cursor slides). Commits are
        // STILL clickable (clicking jumps the time cursor forward).
        // We use aria-disabled (not aria-hidden) so screen-readers
        // perceive the element + state, per WAI-ARIA's "MUST NOT use
        // aria-hidden on focusable elements" rule.
        const isRevealed =
          revealedThroughCommitIdx === null ||
          c.commitIdx <= revealedThroughCommitIdx;
        return (
          <button
            key={c.commitIdx}
            type="button"
            onClick={clickable ? () => onSelectCommit(c.runtimeStageId) : undefined}
            style={{
              ...boxBaseStyle,
              cursor: clickable ? "pointer" : "default",
              borderColor: isSelected ? theme.success : theme.border,
              borderWidth: isSelected ? 2 : 1,
              // Mixed FROM the same role the border uses, so one `success`
              // override moves both (raw rgba here was unthemeable).
              background: isSelected ? `color-mix(in srgb, ${theme.success} 8%, transparent)` : "transparent",
              color: theme.textPrimary,
              textAlign: "left",
              fontFamily: "inherit",
              padding: "6px 10px",
              opacity: isRevealed ? 1 : 0.35,
            }}
            aria-disabled={!isRevealed}
            aria-current={isSelected ? "true" : undefined}
            title={c.runtimeStageId}
          >
            <div style={{ fontWeight: 600 }}>
              {label}
              {commits.length > 1 && (
                <span style={{ color: theme.textMuted, fontWeight: 400, marginLeft: 6 }}>
                  iter {i + 1}/{commits.length}
                </span>
              )}
            </div>
            <div
              style={{
                fontSize: 10,
                fontFamily: "monospace",
                color: theme.textMuted,
                marginTop: 2,
              }}
            >
              #{c.commitIdx} · {c.runtimeStageId}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── Decorations ─────────────────────────────────────────────────────

function Connector({ orientation }: { orientation: "vertical" | "horizontal" }) {
  return orientation === "vertical" ? (
    <div
      aria-hidden
      style={{
        width: 1,
        height: 12,
        background: theme.border,
      }}
    />
  ) : (
    <div
      aria-hidden
      style={{
        height: 1,
        width: 12,
        background: theme.border,
      }}
    />
  );
}

function ForkMarker() {
  return (
    <div
      aria-hidden
      style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: theme.border,
        margin: "2px 0",
      }}
    />
  );
}

const boxBaseStyle: React.CSSProperties = {
  display: "inline-block",
  minWidth: 110,
  padding: "6px 10px",
  border: `1px solid ${theme.border}`,
  borderRadius: 4,
  fontSize: 12,
  color: theme.textPrimary,
  background: "transparent",
};
