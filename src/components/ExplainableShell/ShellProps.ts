import type * as React from "react";
import type { StageSnapshot, BaseComponentProps, NarrativeEntry } from "../../types";
import type { RuntimeSnapshotInput } from "../../model/recording";
import type { TraceWorkflowOverlay } from "../../trace/traceWorkflowOverlay";
import type { FlowchartOptions, FlowchartRenderer } from "../../model/flowchart";
import type { LensLayoutDefinition } from "../../model/lensLayout";
import type { ReplayControlsOptions } from "../TimeTravelControls";
import type { LensTheme, LensWorkbenchLayout, LensView, LensCommentaryOptions } from "./LensWorkbench";
import type { RecordingSource, ProgressiveRenderingOptions } from "../../progressiveRendering/types";

export interface SpecNode {
  name: string;
  id?: string;
  description?: string;
  children?: SpecNode[];
  next?: SpecNode;
  isSubflowRoot?: boolean;
  subflowId?: string;
  subflowName?: string;
  subflowStructure?: SpecNode;
}
export type ShellTab = string;

export interface PanelLabels {
  /** Left panel pill label (subflow tree). Default: "Topology" */
  topology?: string;
  /** Right panel pill label (memory/narrative). Default: "Details" */
  details?: string;
  /** Bottom panel pill label (timeline). Default: "Timeline" */
  timeline?: string;
}

/** Which panels start expanded. Default: `{ details: true }` (flowchart + memory). */
export interface DefaultExpanded {
  topology?: boolean;
  details?: boolean;
  timeline?: boolean;
}

/**
 * Raw runtime snapshot from FlowChartExecutor.getSnapshot().
 * When provided, ExplainableShell converts it internally — zero boilerplate.
 */
export type { RuntimeSnapshotInput } from "../../model/recording";

/**
 * A recorder view that appears as a tab in the details panel.
 * Each recorder provides its own per-stage rendering.
 * Memory and Narrative are built-in defaults — add more via this prop.
 */
export interface RecorderView {
  /** Unique key for this view tab */
  id: string;
  /** Display label on the tab */
  name: string;
  /** Short description shown as tooltip and header for auto-detected views.
   *  e.g., "Per-step timing and I/O counts (KeyedRecorder)" */
  description?: string;
  /**
   * Render function — receives the current snapshot index and all snapshots.
   * Return a React node to display in the details panel.
   */
  render: (props: { snapshots: StageSnapshot[]; selectedIndex: number }) => React.ReactNode;
}

/**
 * The Trace flowchart's two-colour theme (footprintjs level).
 *
 * `mode` is the COARSE switch: it applies eui's full light or dark preset
 * (`coolLight` / `coolDark`) as `--fp-*` variables on the shell root, so the
 * ENTIRE shell — canvas, panels, nodes, text, borders — follows dark/light from
 * this one field. You do NOT need to hand-set `--fp-*` yourself. (`--fp-*`
 * remains available as a fine escape hatch for individual token overrides.)
 *
 * `visited` and `current` are the two semantic node colours, layered on top of
 * the mode base. All optional — sensible per-mode defaults are used for anything
 * omitted.
 */
export interface TraceTheme {
  mode?: "dark" | "light";
  /** Executed / done nodes. */
  visited?: string;
  /** The node at the current cursor position ("now"). */
  current?: string;
}

export interface ExplainableShellProps extends BaseComponentProps {
  /**
   * Pre-converted visualization snapshots. Use when you've already called
   * toVisualizationSnapshots() yourself.
   */
  snapshots?: StageSnapshot[];
  /**
   * Raw runtime snapshot from executor.getSnapshot(). The shell converts it
   * internally via toVisualizationSnapshots(). When provided, `snapshots`
   * and `resultData` are derived automatically. Pair with
   * `narrativeEntries` for rich per-stage narrative.
   *
   * Usage: `<ExplainableShell runtimeSnapshot={executor.getSnapshot()} narrativeEntries={executor.getNarrativeEntries()} traceGraph={graph} runtimeOverlay={overlay} />`
   */
  runtimeSnapshot?: RuntimeSnapshotInput | null;
  /**
   * Build-time graph captured live via `createTraceStructureRecorder`.
   * REQUIRED for chart rendering (v6+) — the legacy `spec` →
   * legacy spec-walk post-walk path was removed in favor of this
   * recorder-driven graph.
   *
   * Pair with `runtimeOverlay` for the full time-travel trace UI.
   * When `traceGraph` is set but `runtimeOverlay` is absent, the
   * chart renders without runtime coloring (build-time-only view).
   *
   * The `spec` prop, when also provided, is used INTERNALLY for
   * subflow drill-down resolution (navigating `subflowStructure` to
   * find a child chart inside the parent's serialized structure) —
   * NOT for rendering.
   */
  traceGraph?: import("../FlowchartView/traceStructureRecorder").TraceGraph | null;
  /**
   * Runtime overlay captured live via `createTraceRuntimeOverlay` — the
   * per-step colouring that lights the executed path.
   *
   * **Usually leave it off.** When `runtimeSnapshot` is given and this prop
   * is absent, the shell rebuilds the overlay from the snapshot's own commit
   * log (`overlayFromSnapshot`), so a replayed recording colours its chart
   * exactly like the live run did. Pass it only to override that — a live
   * `createTraceRuntimeOverlay` handle sees a little more than a recording
   * can (errors, subflow internals, wall-clock).
   *
   * For a deliberately uncoloured (build-time-only) chart pass an EMPTY
   * overlay — `{ executionOrder: [], errors: new Map(), running: false }`.
   * Omitting the prop no longer means "no colours"; it means "work it out
   * from the snapshot", because omitting it was how every replay ended up
   * grey.
   */
  runtimeOverlay?: import("../FlowchartView/createTraceRuntimeOverlay").RuntimeOverlay | null;
  /**
   * Trace flowchart theme — the footprintjs-LEVEL **two-colour** scheme:
   * `visited` (executed nodes) + `current` (the cursor node). `mode` is the
   * coarse light/dark switch — it applies eui's full preset to the whole shell,
   * so you pass one word instead of a wall of `--fp-*` vars. Colours are optional
   * — omit to use the per-mode defaults. The agent-semantic three-colour theme
   * belongs to `<Lens>`, not here.
   */
  traceTheme?: TraceTheme;
  title?: string;
  resultData?: Record<string, unknown> | null;
  logs?: string[];
  /** Structured narrative entries from `executor.getNarrativeEntries()`.
   *  This is the only narrative input — the flat-string form was
   *  removed; call `.map(e => e.text)` if you need it.
   *
   *  Optional when `runtimeSnapshot` is given: a run recorded with
   *  footprintjs's narrative recorder carries its entries inside the
   *  snapshot, and the shell reads them from there. Pass this prop to
   *  override that (it always wins). */
  narrativeEntries?: NarrativeEntry[];
  /**
   * @deprecated Never had an effect and now warns in dev. Use `hideTabs` to
   * drop tabs by id and `defaultTab` to choose which one opens first.
   *
   * It was documented as `["result", "explainable"]`, but `"explainable"` is
   * not a tab in the styled shell at all — it is the unstyled whole-surface
   * view — so honouring this list literally would have cut every styled shell
   * down to a lone Result tab. There is no reading of it that is both
   * faithful to the documented default and safe, which is why it is going
   * rather than getting wired.
   */
  tabs?: ShellTab[];
  defaultTab?: ShellTab;
  hideConsole?: boolean;
  /** Hide specific detail tabs (e.g., ['result', 'memory']). */
  hideTabs?: string[];
  /** Customize the labels on collapsible panel pills */
  panelLabels?: PanelLabels;
  /** Which panels start expanded. Default: `{ details: true }` */
  defaultExpanded?: DefaultExpanded;
  /**
   * Recorder views — each becomes a tab in the details panel.
   * Default: Memory + Narrative. Pass additional recorder views
   * to show tokens, cost, tools, permissions, or custom data.
   *
   * Usage:
   *   recorderViews={[
   *     { id: 'tokens', name: 'Tokens', render: ({ selectedIndex }) => <div>...</div> },
   *   ]}
   */
  recorderViews?: RecorderView[];
  /**
   * Custom flowchart renderer. When omitted, ExplainableShell renders
   * via `<TracedFlow graph={traceGraph} overlay={runtimeOverlay} />` —
   * the recorder-driven path. Override to plug a custom chart UI; the
   * `spec` parameter is forwarded only for backward-compatible
   * signatures (it's the same SpecNode used for drill-down) and may
   * be `null` once consumers stop threading it in.
   */
  renderFlowchart?: (props: {
    spec: SpecNode | null;
    snapshots: StageSnapshot[];
    selectedIndex: number;
    unstyled?: boolean;
    onNodeClick?: (indexOrId: number | string) => void;
    showStageId?: boolean;
    /** Resolved built-in geometry; custom renderers may honor or replace it. */
    renderer?: FlowchartRenderer;
    /** Dependency-cone overlay (chart node id → BFS depth) — painted while
     *  the Inspector's Data Trace tab is open. Custom renderers may ignore it. */
    sliceCone?: ReadonlyMap<string, number>;
    /** Recorded values and state-read links for the active variable investigation. */
    traceWorkflow?: TraceWorkflowOverlay | null;
    /** The shell's CURRENT drill scope — the mount node's id, or `null` at the
     *  top level. The shell owns the one drill state, so a chart that keeps
     *  its own must follow this or it will show a different level than the
     *  breadcrumb, story and timeline beside it. */
    currentSubflowId?: string | null;
    /** Call to MOVE the shell's drill: a mount node's id to drill in, `null`
     *  to pop back to the top. */
    onSubflowChange?: (mountStageId: string | null) => void;
  }) => React.ReactNode;
  /**
   * When true, render each node's stable `stageId` as a small monospace
   * caption beneath the label in the default flowchart renderer.
   * Teaching aid: it reveals the key recorders use
   * (`runtimeStageId = [subflowPath/]stageId#executionIndex`) so a
   * consumer can map any recorder's per-stage data back to a node.
   * Default false.
   */
  showStageId?: boolean;
  /** Built-in chart geometry. Explicit values override JSON layout.flowchart; flat is the default. */
  flowchart?: FlowchartOptions;
  /**
   * Play the run by itself when it opens, once: the cursor goes to the first
   * stage and walks to the last on the Play loop, then stops. A new run (a new
   * `runId`, or a new snapshot object when it has none) plays again and leaves
   * any subflow a person drilled into; a re-render does not. Pause, scrubbing,
   * arrow keys, space, a drill, a trace or any other move of the cursor stop it
   * for good. It does not start under `prefers-reduced-motion: reduce`, while
   * tracing, or with fewer than two stages. Default false.
   */
  autoPlay?: boolean;
  /** Controlled details audience. Both views keep the same chart, selection and subflow. */
  view?: LensView;
  /** Initial details audience when view is uncontrolled. Default developer. */
  defaultView?: LensView;
  /** Request an audience change from the two Details buttons. */
  onViewChange?: (view: LensView) => void;
  /** Configure recorded prose in Story and the custom-layout commentary surface. */
  commentary?: LensCommentaryOptions;
  /** Choose replay controls and an optional reading interval without creating a second cursor. */
  replayControls?: ReplayControlsOptions;
  /** Brand tokens and native-control adapters; explicit tokens override mode. */
  theme?: LensTheme;
  /** Own the layout while retaining the complete Lens selection, drill and backtrack behavior. */
  renderLayout?: LensWorkbenchLayout;
  /** Serializable named-area layout. Omitted optional surfaces stay hidden. renderLayout takes precedence. */
  layout?: LensLayoutDefinition;
  /** Opt into exact recorded child loading; this source owns the recording/graph cohort. */
  source?: RecordingSource;
  /** Explicit presentation/background policy overrides JSON layout.rendering. */
  rendering?: ProgressiveRenderingOptions;
}
