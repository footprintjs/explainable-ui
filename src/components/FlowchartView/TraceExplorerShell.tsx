/**
 * TraceExplorerShell — composed master/detail layout that wires the
 * full L8 translator stack into a single drop-in component.
 *
 * **Composes**: [`<CommitChainView>`](./CommitChainView.tsx),
 * [`<CommitInspector>`](./CommitInspector.tsx),
 * [`<NodeInspector>`](./NodeInspector.tsx) over a [`TraceBundle`](./createTraceBundle.ts).
 *
 * The L8 stack is intentionally factored as independent pieces
 * (structure / runtimeOverlay / nodeView / commitFlow / chain
 * builder / inspectors). Consumers can wire à-la-carte for custom
 * layouts. `<TraceExplorerShell>` is the "I want the canonical
 * trace-explorer UI without writing 50 lines of `useTranslator`
 * plumbing" entry point — pass a `bundle`, get a master/detail UI.
 *
 * **Prerequisite**: call `bundle.attachTo(executor)` (see
 * `createTraceBundle` for the recorder-attach lifecycle) BEFORE
 * rendering this component. The shell only consumes events; it does
 * not trigger them. Without the attach step, every pane will show its
 * placeholder.
 *
 * Layout
 * ──────
 *   ┌─────────────────────────────────────────────────┐
 *   │  RunSlider (time-travel cursor)                 │
 *   ├──────────────────────────┬──────────────────────┤
 *   │  CommitChainView         │  CommitInspector     │
 *   │  (master, click a box)   │  (detail, selected)  │
 *   │                          │                      │
 *   ├──────────────────────────┴──────────────────────┤
 *   │  NodeInspector (resolved from selected stageId) │
 *   └─────────────────────────────────────────────────┘
 *
 *   The slider is the **ONE-CURSOR** affordance: dragging it moves
 *   the same cursor that clicking a commit moves. Commits past the
 *   cursor render dimmed in the chain view (`revealedThroughCommitIdx`
 *   threaded through automatically). Pass `slots: { slider: null }`
 *   to hide the slider (e.g., for static post-run views).
 *
 * Selection model
 * ───────────────
 *   ONE cursor (`selectedRuntimeStageId`) drives both detail panes.
 *   Clicking a commit in the chain view updates the cursor; the
 *   `<CommitInspector>` shows that commit; the `<NodeInspector>`
 *   shows the stage that commit belongs to (derived by stripping the
 *   `#executionIndex` suffix from the runtimeStageId).
 *
 *   Controlled mode: pass `selectedRuntimeStageId` + `onSelectionChange`
 *   to drive selection from outside (URL hash, parent state, etc.).
 *   Uncontrolled mode: omit both — the shell owns the cursor.
 *   `onSelectionChange` also fires in uncontrolled mode for
 *   observability (logging, analytics).
 *
 * Composition rule (L8 architecture, carried forward)
 * ───────────────────────────────────────────────────
 *   This shell consumes ONLY the bundle's translator handles via
 *   `useTranslator`. It NEVER subscribes to peer translators directly
 *   (would violate the linear-dep-tree rule). It builds the chain
 *   tree fresh on each commitFlow version bump — cheap, cache-friendly
 *   (every input index is version-keyed-cached upstream, and
 *   `commitFlow` transitively re-notifies on `structure` changes per
 *   the L8.2 contract, so structure-only events also propagate).
 *
 * Customization
 * ─────────────
 *   The default layout is a CSS grid. Override via `slots` to swap any
 *   panel for a custom renderer. Slot props mirror the sibling-
 *   inspector pattern — they receive PURE DATA (the typed index/chain),
 *   NOT the bundle. This keeps slots usable from tests / Storybook /
 *   SSR and means slot authors do not have to re-subscribe to
 *   translators (the shell does that once).
 *
 *   Stability note: `slots` should be stable across renders (define at
 *   module scope or wrap with `useMemo`). The shell memoizes the
 *   resolved component refs to defend against accidental remounts.
 *
 * @example Minimal
 * ```tsx
 * const bundle = useMemo(() => createTraceBundle(), []);
 * useEffect(() => {
 *   const chart = flowChart('seed', fn, 'seed', undefined, undefined, {
 *     structureRecorders: [bundle.structure.recorder],
 *   }).build();
 *   const executor = new FlowChartExecutor(chart);
 *   bundle.attachTo(executor); // Prerequisite — see createTraceBundle.
 *   executor.run({ input });
 * }, [bundle]);
 *
 * return <TraceExplorerShell bundle={bundle} />;
 * ```
 *
 * @example Controlled selection (sync to URL hash)
 * ```tsx
 * const [sel, setSel] = useState<RuntimeStageId | null>(null);
 * return (
 *   <TraceExplorerShell
 *     bundle={bundle}
 *     selectedRuntimeStageId={sel}
 *     onSelectionChange={setSel}
 *   />
 * );
 * ```
 *
 * @example Custom chain pane (typed data slot)
 * ```tsx
 * const slots = useMemo(() => ({
 *   chain: ({ chain, selectedRuntimeStageId, onSelectCommit }) => (
 *     <MyCustomTimeline chain={chain} cursor={selectedRuntimeStageId} onPick={onSelectCommit} />
 *   ),
 * }), []);
 * return <TraceExplorerShell bundle={bundle} slots={slots} />;
 * ```
 */

import { useMemo, useState, useCallback } from "react";
import type { CSSProperties } from "react";
import type { TraceBundle } from "./createTraceBundle";
import type { RuntimeStageId, StageId } from "./_internal/keys";
import { asStageId } from "./_internal/keys";
import { useTranslator } from "./_internal/useTranslator";
import { buildCommitChainTree, type CommitChain } from "./buildCommitChainTree";
import { CommitChainView } from "./CommitChainView";
import { CommitInspector } from "./CommitInspector";
import { NodeInspector } from "./NodeInspector";
import { RunSlider } from "./RunSlider";
import type { CommitFlowIndex } from "./createCommitFlowRecorder";
import type { NodeViewIndex } from "./createNodeViewRecorder";
import type { BaseComponentProps } from "../../types";
import { theme } from "../../theme";

/**
 * Slot prop bags — slots receive PURE DATA (chain/index), NOT the
 * bundle. Mirrors the sibling-inspector convention so slot bodies are
 * usable from tests / Storybook / SSR and avoid re-subscribing to
 * translators. Each callback is wired by the shell to the shared
 * selection cursor.
 */
export interface ChainSlotProps {
  /** Live chain tree, derived from the bundle. `null` before any
   *  commits arrive. */
  chain: CommitChain | null;
  /** Currently selected commit (shared cursor). */
  selectedRuntimeStageId: RuntimeStageId | null;
  /** Wire to the shared selection cursor. */
  onSelectCommit: (rsid: RuntimeStageId) => void;
  /** Time-travel reveal cursor (derived from selectedRuntimeStageId
   *  via ONE-CURSOR model). Commits with commitIdx > this value
   *  render dimmed. `null` reveals all, `-1` reveals none, `N >= 0`
   *  reveals up to commit N. **Optional in custom slots** — slot
   *  authors that don't implement time-travel dimming can ignore it
   *  (matches the standalone `<CommitChainView>` prop optionality). */
  revealedThroughCommitIdx?: number | null;
}
export interface CommitInspectorSlotProps {
  /** Live commitFlow index. */
  index: CommitFlowIndex;
  /** Currently selected commit (shared cursor). */
  selectedRuntimeStageId: RuntimeStageId | null;
  /** Wire to the shared selection cursor (e.g., for clickable
   *  data-dep / lineage breadcrumbs). */
  onNavigate: (rsid: RuntimeStageId) => void;
}
export interface NodeInspectorSlotProps {
  /** Live nodeView index. */
  index: NodeViewIndex;
  /** StageId derived from `selectedRuntimeStageId`. */
  selectedStageId: StageId | null;
  /** Wire to the shared selection cursor (e.g., for prev/next chain
   *  breadcrumbs). Resolves the stage to its first commit. */
  onNavigate: (stageId: StageId) => void;
}
export interface SliderSlotProps {
  /** Live commitFlow index. */
  index: CommitFlowIndex;
  /** Currently selected commit — same cursor as the chain selection
   *  per the ONE-CURSOR model. */
  cursorRuntimeStageId: RuntimeStageId | null;
  /** Wire to the shared selection cursor. */
  onCursorChange: (rsid: RuntimeStageId | null) => void;
}

export interface TraceExplorerSlots {
  /** Override the chain (master) pane. Use to swap the swim-lane
   *  renderer for a timeline/Gantt/custom layout while keeping the
   *  same selection contract. */
  chain?: React.ComponentType<ChainSlotProps>;
  /** Override the commit (detail) pane. Use to add custom commit-
   *  detail formatting (e.g., domain-specific updates rendering). */
  commitInspector?: React.ComponentType<CommitInspectorSlotProps>;
  /** Override the node (stage-summary) pane. Use to surface per-stage
   *  custom KPIs / annotations alongside the default execution data. */
  nodeInspector?: React.ComponentType<NodeInspectorSlotProps>;
  /** Override the slider (top time-travel bar). Pass `null` to HIDE
   *  the slider entirely (e.g., for static post-run views with no
   *  scrub affordance). */
  slider?: React.ComponentType<SliderSlotProps> | null;
}

export interface TraceExplorerShellProps extends BaseComponentProps {
  /** The translator bundle from `createTraceBundle()`. MUST have had
   *  `bundle.attachTo(executor)` called before any commits arrive,
   *  otherwise every pane shows its placeholder. */
  bundle: TraceBundle;
  /** Controlled selection (omit for uncontrolled). `null` clears. */
  selectedRuntimeStageId?: RuntimeStageId | null;
  /** Fires on selection changes. In controlled mode, required for
   *  selection to take effect. In uncontrolled mode, fires as an
   *  observation hook (logging/analytics) — the shell still owns the
   *  state.
   *
   *  Memoize via `useCallback` to avoid downstream re-renders. */
  onSelectionChange?: (rsid: RuntimeStageId | null) => void;
  /** Optional slot overrides. Should be stable across renders
   *  (define at module scope or `useMemo`). */
  slots?: TraceExplorerSlots;
}

export function TraceExplorerShell({
  bundle,
  selectedRuntimeStageId: controlledSel,
  onSelectionChange,
  slots,
  className,
  style,
}: TraceExplorerShellProps) {
  // Controlled vs uncontrolled selection. Standard React idiom.
  const [internalSel, setInternalSel] = useState<RuntimeStageId | null>(null);
  const isControlled = controlledSel !== undefined;
  const selectedRuntimeStageId = isControlled ? controlledSel : internalSel;

  const handleSelect = useCallback(
    (rsid: RuntimeStageId | null) => {
      if (!isControlled) setInternalSel(rsid);
      // Fire in both modes — controlled mode requires it for parent
      // sync; uncontrolled mode fires for observability (logging,
      // analytics, URL sync without taking control).
      onSelectionChange?.(rsid);
    },
    [isControlled, onSelectionChange],
  );
  const handleSelectCommit = useCallback(
    (rsid: RuntimeStageId) => handleSelect(rsid),
    [handleSelect],
  );

  // Derive selected stageId from selectedRuntimeStageId by stripping
  // the '#executionIndex' suffix. Mirrors footprintjs/trace
  // `parseRuntimeStageId` invariant — kept inline because
  // explainable-ui is dep-free from footprintjs (subflow prefix is
  // preserved; nodeView keys subflow stages by the full path-prefixed
  // form per footprintjs convention).
  const selectedStageId = useMemo<StageId | null>(() => {
    if (!selectedRuntimeStageId) return null;
    const hashIdx = selectedRuntimeStageId.lastIndexOf("#");
    // hashIdx === 0 → empty stageId (malformed input) → no selection.
    if (hashIdx <= 0) return null;
    return asStageId(selectedRuntimeStageId.slice(0, hashIdx));
  }, [selectedRuntimeStageId]);

  // Resolve slot components ONCE per slots-identity change — defends
  // against consumer footgun of passing inline `slots={{...}}` every
  // render which would otherwise remount default panes.
  const ChainPane = useMemo(
    () => slots?.chain ?? DefaultChainPane,
    [slots?.chain],
  );
  const CommitPane = useMemo(
    () => slots?.commitInspector ?? DefaultCommitPane,
    [slots?.commitInspector],
  );
  const NodePane = useMemo(
    () => slots?.nodeInspector ?? DefaultNodePane,
    [slots?.nodeInspector],
  );
  // Slider has tri-state semantics: undefined = use default; null =
  // hide; ComponentType = override. `slots?.slider === null` is the
  // "hide" signal; absent key = default.
  const SliderPane = useMemo<React.ComponentType<SliderSlotProps> | null>(() => {
    if (slots && "slider" in slots) {
      return slots.slider ?? null;
    }
    return DefaultSliderPane;
  }, [slots]);

  // Subscribe ONCE here to the three translators; pass the resolved
  // data down to slots (whether default or custom). Slots NEVER need
  // to subscribe themselves.
  const chain = useTranslator(bundle.commitFlow, () =>
    buildCommitChainTree(bundle.structure.getGraph(), bundle.commitFlow.getIndex()),
  );
  const commitIndex = useTranslator(bundle.commitFlow, () =>
    bundle.commitFlow.getIndex(),
  );
  const nodeIndex = useTranslator(bundle.nodeView, () => bundle.nodeView.getIndex());

  // Stage-click → resolve first commit and select it. One-shot lookup
  // outside useTranslator (no subscription) is intentional — this
  // fires on click, not in a render path. Picking commits[0] is the
  // documented semantic; loops resolve to iteration 1.
  const handleStageNavigate = useCallback(
    (stageId: StageId) => {
      const candidates = commitIndex.commits.filter((c) => c.stageId === stageId);
      const first = candidates[0];
      handleSelect(first ? first.runtimeStageId : null);
    },
    [commitIndex, handleSelect],
  );

  // Cursor → commitIdx for chain dimming. ONE-CURSOR model: the same
  // cursor that drives selection also drives time-travel reveal.
  //
  // Three states (distinguished — Panel 1 must-fix L8.5):
  //   - no cursor (`null`) → `null` (reveal ALL)
  //   - cursor resolves to a commit → that commit's commitIdx
  //   - cursor is STALE (rsid unknown to index, e.g. removed by reset)
  //     → `-1` (reveal NONE), NOT `null` — prevents incoherent "stale
  //     cursor falls back to fully-revealed" state.
  const revealedThroughCommitIdx = useMemo<number | null>(() => {
    if (!selectedRuntimeStageId) return null;
    const view = commitIndex.byRuntimeStageId.get(selectedRuntimeStageId);
    return view ? view.commitIdx : -1;
  }, [selectedRuntimeStageId, commitIndex]);

  // Layout: when the slider is hidden (`slots.slider === null`),
  // collapse the slider row so the grid doesn't reserve empty space.
  const layoutStyle = useMemo<CSSProperties>(
    () => (SliderPane ? SHELL_STYLE_WITH_SLIDER : SHELL_STYLE_NO_SLIDER),
    [SliderPane],
  );

  return (
    <div className={className} style={{ ...layoutStyle, ...style }}>
      {SliderPane && (
        <Pane area="slider">
          <SliderPane
            index={commitIndex}
            cursorRuntimeStageId={selectedRuntimeStageId}
            onCursorChange={handleSelect}
          />
        </Pane>
      )}
      <Pane area="chain">
        <ChainPane
          chain={chain}
          selectedRuntimeStageId={selectedRuntimeStageId}
          onSelectCommit={handleSelectCommit}
          revealedThroughCommitIdx={revealedThroughCommitIdx}
        />
      </Pane>
      <Pane area="commit">
        <CommitPane
          index={commitIndex}
          selectedRuntimeStageId={selectedRuntimeStageId}
          onNavigate={handleSelectCommit}
        />
      </Pane>
      <Pane area="node">
        <NodePane
          index={nodeIndex}
          selectedStageId={selectedStageId}
          onNavigate={handleStageNavigate}
        />
      </Pane>
    </div>
  );
}

// ── Default panes (pure data props, no internal subscriptions) ──────

function DefaultChainPane({
  chain,
  selectedRuntimeStageId,
  onSelectCommit,
  revealedThroughCommitIdx,
}: ChainSlotProps) {
  return (
    <CommitChainView
      chain={chain}
      selectedRuntimeStageId={selectedRuntimeStageId}
      onSelectCommit={onSelectCommit}
      revealedThroughCommitIdx={revealedThroughCommitIdx}
    />
  );
}

function DefaultCommitPane({
  index,
  selectedRuntimeStageId,
  onNavigate,
}: CommitInspectorSlotProps) {
  return (
    <CommitInspector
      index={index}
      selectedRuntimeStageId={selectedRuntimeStageId}
      onNavigate={onNavigate}
    />
  );
}

function DefaultNodePane({ index, selectedStageId, onNavigate }: NodeInspectorSlotProps) {
  return (
    <NodeInspector index={index} selectedId={selectedStageId} onNavigate={onNavigate} />
  );
}

function DefaultSliderPane({
  index,
  cursorRuntimeStageId,
  onCursorChange,
}: SliderSlotProps) {
  return (
    <RunSlider
      index={index}
      cursorRuntimeStageId={cursorRuntimeStageId}
      onCursorChange={onCursorChange}
    />
  );
}

// ── Layout helpers ──────────────────────────────────────────────────

const SHELL_STYLE_WITH_SLIDER: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(280px, 1fr) minmax(320px, 1fr)",
  gridTemplateRows: "auto 1fr auto",
  gridTemplateAreas: '"slider slider" "chain commit" "node node"',
  gap: 12,
  padding: 12,
  background: theme.bgPrimary,
  color: theme.textPrimary,
};

const SHELL_STYLE_NO_SLIDER: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(280px, 1fr) minmax(320px, 1fr)",
  gridTemplateRows: "1fr auto",
  gridTemplateAreas: '"chain commit" "node node"',
  gap: 12,
  padding: 12,
  background: theme.bgPrimary,
  color: theme.textPrimary,
};

const PANE_BASE_STYLE: CSSProperties = {
  border: `1px solid ${theme.border}`,
  borderRadius: 6,
  background: theme.bgSecondary,
  overflow: "auto",
  minHeight: 0, // permit shrinking inside grid
};

function Pane({ area, children }: { area: string; children: React.ReactNode }) {
  // Wrap each pane as an accessibility landmark so screen readers can
  // jump between panels.
  return (
    <div role="region" aria-label={area} style={{ ...PANE_BASE_STYLE, gridArea: area }}>
      {children}
    </div>
  );
}
