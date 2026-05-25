/**
 * `createTraceBundle` — one factory wires every shipped translator
 * + provides a single `attachTo(executor)` call that registers all
 * runtime recorders.
 *
 * Bundle shape (as of L8.2)
 * ─────────────────────────
 *   - `structure` — build-time `TraceGraph` (StructureRecorder).
 *   - `runtimeOverlay` — execution overlay for time-travel (FlowRecorder).
 *   - `nodeView` — per-stage summary index, CombinedRecorder
 *     (FlowRecorder + ScopeRecorder).
 *   - `commitFlow` — per-commit summary + data-lineage,
 *     CombinedRecorder (ScopeRecorder + FlowRecorder).
 *
 * Goal: collapse the 5-line "create + attach + subscribe" boilerplate
 * into one call for the common case. Consumers that want à-la-carte
 * setup can still construct each translator directly (the underlying
 * factories are unchanged).
 *
 * Independence: each translator subscribes ONLY to `structure` (per
 * L8.1 Panel 1 rule — translators must never subscribe to peers).
 * Linear dependency tree keeps notify cascades O(depth), not O(N²).
 *
 * @example
 * ```tsx
 * import { createTraceBundle } from 'footprint-explainable-ui/flowchart';
 *
 * function MyTraceUI() {
 *   const bundle = useMemo(() => createTraceBundle(), []);
 *   useEffect(() => {
 *     const chart = flowChart('seed', fn, 'seed', {
 *       structureRecorders: [bundle.structure.recorder],
 *     }).addFunction('a', fnA, 'a').build();
 *     const executor = new FlowChartExecutor(chart);
 *     bundle.attachTo(executor);
 *     executor.run({ input });
 *   }, [bundle]);
 *
 *   return <TracedFlow recorder={bundle.structure} overlay={bundle.runtimeOverlay} />;
 * }
 * ```
 *
 * **Recorder-attach lifecycle**: `attachTo(executor)` attaches THREE
 * FlowRecorders (`runtimeOverlay`, `nodeView`, `commitFlow`) and TWO
 * ScopeRecorders (`nodeView`, `commitFlow`). Each translator has a
 * distinct `recorder.id`, so footprintjs's id-idempotency rule
 * doesn't collide. The build-time `structure.recorder` is NOT
 * auto-attached — it must be passed to `flowChart(..., {
 * structureRecorders: [...] })` because builder recorders register
 * BEFORE `executor` exists. Consumers wire that one explicitly (see
 * example above). This matches footprintjs's two-phase recorder
 * model (build vs runtime).
 */

import { devWarn } from "./_internal/devWarn";
import {
  createTraceStructureRecorder,
  type TraceStructureRecorderHandle,
  type CreateTraceStructureRecorderOptions,
} from "./traceStructureRecorder";
import {
  createTraceRuntimeOverlay,
  type TraceRuntimeOverlayHandle,
  type CreateTraceRuntimeOverlayOptions,
} from "./createTraceRuntimeOverlay";
import {
  createNodeViewRecorder,
  type NodeViewRecorderHandle,
  type CreateNodeViewRecorderOptions,
} from "./createNodeViewRecorder";
import {
  createCommitFlowRecorder,
  type CommitFlowRecorderHandle,
  type CreateCommitFlowRecorderOptions,
} from "./createCommitFlowRecorder";

/** Minimal executor surface — mirrors the bits of footprintjs's
 *  `FlowChartExecutor` the bundle calls into. Local to keep
 *  explainable-ui dep-free from footprintjs. */
interface MinimalExecutor {
  attachFlowRecorder(recorder: unknown): void;
  attachScopeRecorder?(recorder: unknown): void;
}

export interface TraceBundle {
  structure: TraceStructureRecorderHandle;
  runtimeOverlay: TraceRuntimeOverlayHandle;
  /** L8.1 — per-stage summary translator. Reads `prevIds`/`nextIds`
   *  from `structure` (no duplication), accumulates `executions[]`
   *  + commit refs from Flow + Scope events. */
  nodeView: NodeViewRecorderHandle;
  /** L8.2 — per-commit summary translator. Owns canonical CommitView[].
   *  Derives structural prev/next from `structure`, runtimePrev/Next
   *  from "most-recent-per-prev" over commitLog, and dataDependencies
   *  via findLastWriter per read key. */
  commitFlow: CommitFlowRecorderHandle;
  /**
   * Attach RUNTIME recorders (FlowRecorder, ScopeRecorder) to a
   * footprintjs executor. The build-time `structure.recorder` is NOT
   * covered — pass it to `flowChart(..., { structureRecorders: [...] })`
   * at construction time instead (see file header example).
   */
  attachTo(executor: MinimalExecutor): void;
}

export interface CreateTraceBundleOptions {
  /** Per-translator options. All optional. */
  structure?: CreateTraceStructureRecorderOptions;
  runtimeOverlay?: CreateTraceRuntimeOverlayOptions;
  nodeView?: Omit<CreateNodeViewRecorderOptions, "structure">;
  commitFlow?: Omit<CreateCommitFlowRecorderOptions, "structure">;
}

export function createTraceBundle(
  options: CreateTraceBundleOptions = {},
): TraceBundle {
  const structure = createTraceStructureRecorder(options.structure);
  const runtimeOverlay = createTraceRuntimeOverlay(options.runtimeOverlay);
  // NodeView needs the structure handle — wired internally so the
  // consumer doesn't have to pass it. The bundle is the consumer-
  // ergonomics layer; à-la-carte consumers can construct
  // createNodeViewRecorder directly with their own structure handle.
  const nodeView = createNodeViewRecorder({
    ...(options.nodeView ?? {}),
    structure,
  });
  const commitFlow = createCommitFlowRecorder({
    ...(options.commitFlow ?? {}),
    structure,
  });

  return {
    structure,
    runtimeOverlay,
    nodeView,
    commitFlow,
    attachTo(executor: MinimalExecutor): void {
      // All three runtime translators attach as FlowRecorders (each
      // has its own distinct `recorder.id`, so the dispatcher's
      // id-idempotency rule doesn't collide). NodeView + CommitFlow
      // ALSO implement ScopeRecorder (onCommit) — attached via
      // attachScopeRecorder when the executor exposes it.
      //
      // Footprintjs v6.0+ exposes both methods; older executors
      // gracefully degrade (commit-side data drops with a dev-warn).
      executor.attachFlowRecorder(runtimeOverlay.recorder);
      executor.attachFlowRecorder(nodeView.recorder);
      executor.attachFlowRecorder(commitFlow.recorder);
      if (typeof executor.attachScopeRecorder === "function") {
        executor.attachScopeRecorder(nodeView.recorder);
        executor.attachScopeRecorder(commitFlow.recorder);
      } else {
        // Old/partial executor without ScopeRecorder support. NodeView
        // + CommitFlow will silently miss commit events — surface this
        // to consumers debugging "why are commitRuntimeStageIds empty?".
        devWarn(
          () =>
            "[createTraceBundle] executor.attachScopeRecorder is missing — NodeView.commitRuntimeStageIds[] AND CommitFlow.commits[] will be empty. Upgrade to footprintjs v6.0+.",
        );
      }
    },
  };
}
