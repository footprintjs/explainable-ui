/**
 * Coordinates one selected run, cursor and subflow scope. Focused controllers
 * own tracing and playback; internal presentation components render the model
 * and navigation commands in styled or unstyled layouts.
 *
 * Consumer controls theme via --fp-* CSS custom properties.
 */
import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import type { ReactNode } from "react";
import type { StageSnapshot, BaseComponentProps, NarrativeEntry } from "../../types";
import { theme, themeModeVars } from "../../theme";
import { useContainerBreakpoints } from "../../_internal/useContainerBreakpoints";
import { projectRuntimeSnapshot } from "../../model/recording";
import type { RuntimeSnapshotInput } from "../../model/recording";
import { runHasRecordedReads, sourceRunKey, rootMountLabels, type TraceScope } from "./_internal/traceScope";
import { exactSubflowResults } from "./_internal/subflowRecord";
import { useSubflowNavigation } from "./_internal/useSubflowNavigation";
import { useTraceSessionState, useTraceSessionController } from "./_internal/useTraceSession";
import { EmptyShell, MissingChartNote } from "./_internal/ShellChrome";
import { KeyedRecorderView } from "./_internal/KeyedRecorderView";
import { RightPanel, type RightPanelMode } from "./_internal/RightPanel";
import { ShellLayout, ShellDetailTabs, UnstyledShellLayout } from "./_internal/ShellLayout";
import { TraceSessionPanel } from "./_internal/TraceSessionPanel";
import { TraceDependencyView } from "../DataTracePanel/TraceDependencyView";
import { SubflowNavigationStatus } from "./_internal/SubflowNavigationStatus";
import { StoryUnavailableNote } from "./_internal/TraceUnavailableNote";
import { useRunCompanions } from "./_internal/useRunCompanions";
import { ownDataField, isPlainRecord } from "./_internal/safeRecordRead";
import {
  narrativeRecorderFromSnapshot,
} from "../../adapters/fromRuntimeSnapshot";
import { overlayFromSnapshot } from "../../adapters/overlayFromSnapshot";
import { buildTraceWorkflowOverlay, type TraceWorkflowOverlay } from "../../trace/traceWorkflowOverlay";
import { devWarn } from "../FlowchartView/_internal/devWarn";
import { ResultPanel } from "../ResultPanel";
import { GanttTimeline } from "../GanttTimeline";
import { TimeTravelRail } from "../TimeTravelControls/TimeTravelControls";
import { prefersReducedMotion } from "../TimeTravelControls/prefersReducedMotion";
import { MemoryPanel } from "../MemoryPanel";
import { NarrativePanel } from "../NarrativePanel";
import { SubflowTree } from "../FlowchartView/SubflowTree";
import { SubflowBreadcrumb } from "../FlowchartView/SubflowBreadcrumb";
import { TracedFlow } from "../FlowchartView/TracedFlow";

/**
 * Minimal subflow-walking spec shape. Used INTERNALLY by drill-down
 * resolution (which navigates `subflowStructure` to find a child chart
 * inside the parent's serialized structure). No longer used for chart
 * rendering — that happens via `traceGraph` + `<TracedFlow>` exclusively.
 *
 * Kept as a local type so the file no longer depends on any legacy
 * spec-walk module.
 */
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
import { CompactTimeline } from "../CompactTimeline/CompactTimeline";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Tab ID — "result", "memory", "narrative", or any custom recorder view ID. */
export type ShellTab = string;

/**
 * The whole-surface view that exists ONLY in unstyled mode: chart, memory,
 * narrative and timeline in one scroll, rather than one tab at a time.
 * `"ai-compatible"` is the historical spelling and still answers to it.
 */
const EXPLAINABLE_TAB_ID = "explainable";
function isExplainableTab(tabId: string): boolean {
  return tabId === EXPLAINABLE_TAB_ID || tabId === "ai-compatible";
}


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
    onNodeClick?: (indexOrId: number | string) => void;
    showStageId?: boolean;
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
}

export function ExplainableShell({
  snapshots: snapshotsProp,
  runtimeSnapshot,
  title,
  resultData: resultDataProp,
  logs = [],
  narrativeEntries: narrativeEntriesProp,
  tabs: deprecatedTabs,
  defaultTab,
  hideConsole = false,
  hideTabs: hideTabsProp,
  panelLabels,
  defaultExpanded,
  recorderViews,
  renderFlowchart,
  showStageId = false,
  autoPlay = false,
  traceGraph,
  runtimeOverlay: runtimeOverlayProp,
  traceTheme,
  size = "default",
  unstyled = false,
  className,
  style,
}: ExplainableShellProps) {
  // A run recorded WITH footprintjs's narrative recorder carries its story
  // inside the snapshot, so a replayed recording tells the same story the
  // live run did — no executor left to call getNarrativeEntries() on. The
  // A paired prop takes precedence. Known unchanged companions from a
  // previous run are withheld; a current record-owned Story can replace them.
  const snapshotNarrative = useMemo(
    () => narrativeRecorderFromSnapshot(runtimeSnapshot),
    [runtimeSnapshot],
  );
  const companions = useRunCompanions(runtimeSnapshot, {
    narrativeEntries: narrativeEntriesProp,
    snapshots: snapshotsProp,
    resultData: resultDataProp,
    runtimeOverlay: runtimeOverlayProp,
  });
  const companionNarrativeMissing = companions.staleKeys.includes("narrativeEntries") && !snapshotNarrative;
  const narrativeEntries = companions.values.narrativeEntries ?? snapshotNarrative?.entries;

  const exactResults = useMemo(
    () => exactSubflowResults(ownDataField(runtimeSnapshot, "subflowResults")),
    [runtimeSnapshot],
  );

  // Convert runtimeSnapshot → visualization snapshots (zero-boilerplate mode).
  // A snapshot we cannot read is REMEMBERED, not swallowed: the empty state
  // below reports it instead of rendering full chrome with nothing in it.
  const derivedFromRuntime = useMemo(() => {
    if (!runtimeSnapshot) return null;
    try {
      // Consume only known own fields. Spreading a stored source would
      // evaluate unrelated accessors that no renderer ever asked to read.
      const sharedState = ownDataField(runtimeSnapshot, "sharedState");
      if (!isPlainRecord(sharedState)) throw new Error("sharedState is not a plain object");
      const input = {
        sharedState,
        executionTree: ownDataField(runtimeSnapshot,"executionTree"),
        commitLog: ownDataField(runtimeSnapshot,"commitLog"),
        subflowResults: exactResults,
        recorders: ownDataField(runtimeSnapshot,"recorders"),
      };
      const projection = projectRuntimeSnapshot(input, narrativeEntries);
      return projection.kind === "unreadable"
        ? { snapshots: projection.snapshots, resultData: null, error: projection.detail }
        : { snapshots: projection.snapshots, resultData: input.sharedState, error: null };
    } catch (err) {
      return {
        snapshots: [] as StageSnapshot[],
        resultData: null,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }, [runtimeSnapshot, narrativeEntries, exactResults]);

  // Use derived data when runtimeSnapshot is provided, otherwise use explicit props
  const snapshots = companions.values.snapshots ?? derivedFromRuntime?.snapshots ?? [];
  const resultData = companions.values.resultData ?? derivedFromRuntime?.resultData ?? null;

  // The chart's colouring, rebuilt from the recording when the caller didn't
  // hand us a live one. `runtimeSnapshot` + `traceGraph` with no overlay used
  // to render a fully grey chart with no warning — the single most common way
  // an integration "worked" but showed nothing. The commit log already holds
  // the execution order, so there is nothing to ask the consumer for.
  const runtimeOverlay = useMemo(
    () =>
      companions.values.runtimeOverlay ??
      // Retries leave no mark on the commit log (a failed attempt discards its
      // writes): the snapshot's tree carries their counts (footprintjs >= 10.1),
      // and for an older recording the narrative's `retry` entries do.
      (runtimeSnapshot
        ? overlayFromSnapshot(runtimeSnapshot, { narrativeEntries })
        : undefined),
    [companions.values.runtimeOverlay, runtimeSnapshot, narrativeEntries],
  );

  // A recording is THREE things — events, snapshot, structure — and only the
  // structure can draw the chart. Handed run data with no `traceGraph` the
  // shell used to omit the entire chart region in silence, which reads as
  // "this library doesn't draw charts" rather than "one ingredient is
  // missing". Say it once in the console, and once on screen (below).
  const missingChart = snapshots.length > 0 && !traceGraph?.nodes.length && !renderFlowchart;
  useEffect(() => {
    if (!missingChart) return;
    devWarn(
      () =>
        "[ExplainableShell] No chart: `traceGraph` is missing, so the flowchart region is not rendered. " +
        "A snapshot cannot draw the chart — only the chart's own structure can. Two ways to get one:\n" +
        "  live build — const trace = createTraceStructureRecorder();\n" +
        "               flowChart(..., { structureRecorders: [trace.recorder] });\n" +
        "               <ExplainableShell traceGraph={trace.getGraph()} />\n" +
        "  saved run  — save `chart.buildTimeStructure` next to your snapshot, then\n" +
        "               <ExplainableShell traceGraph={graphFromStructure(saved.structure)} />",
    );
  }, [missingChart]);

  // Flowchart renderer selection (v6+ — recorder-driven only):
  //   - explicit `renderFlowchart` always wins (consumer override)
  //   - `traceGraph` → render via `<TracedFlow>` (event-driven graph
  //     + optional runtime overlay, no spec-tree post-walk)
  //
  // Consumers MUST pass `traceGraph` for chart visualization. The
  // legacy `spec={...}` → post-walk fallback was removed when the
  // recorder gained convergence-edge expansion (post-fork `next`
  // fires N edges, one per branch child) — the recorder graph is now
  // the single source of truth.
  const tracedFlowRenderer = useMemo(() => {
    if (!traceGraph) return undefined;
    return ({ selectedIndex, snapshots, onNodeClick, sliceCone, traceWorkflow, currentSubflowId, onSubflowChange }: {
      spec: SpecNode | null; snapshots: StageSnapshot[]; selectedIndex: number;
      onNodeClick?: (indexOrId: number | string) => void;
      showStageId?: boolean;
      sliceCone?: ReadonlyMap<string, number>;
      traceWorkflow?: TraceWorkflowOverlay | null;
      currentSubflowId?: string | null;
      onSubflowChange?: (mountStageId: string | null) => void;
    }) => {
      // The shell's `selectedIndex` indexes into `snapshots[]` (which
      // may be filtered to a drill-down subset). The overlay's
      // `executionOrder` is the FULL execution timeline (all stages
      // including subflow internals). When the two arrays have
      // different lengths, passing selectedIndex straight through
      // misaligns the chart's active highlight.
      //
      // Translate: take the runtimeStageId at snapshots[selectedIndex]
      // and find the matching position in overlay.executionOrder.
      // Fall back to selectedIndex when no overlay or no match
      // (charts without subflows have aligned indexes anyway).
      const activeRsid = snapshots[selectedIndex]?.runtimeStageId;
      let overlayIdx = selectedIndex;
      if (activeRsid && runtimeOverlay) {
        let i = runtimeOverlay.executionOrder.findIndex(
          (s) => s.runtimeStageId === activeRsid,
        );
        // Drilled-in subflow snapshots carry PREFIX-STRIPPED runtimeStageIds
        // (e.g. "gather#8" vs the overlay's "sf-injection-engine/gather#8"),
        // so the exact match misses and we'd fall back to the raw subflow-local
        // index — mixing index spaces and mis-coloring the whole run as "done".
        // Re-match by suffix so the subflow-local cursor maps to the correct
        // whole-run overlay position (Bug 2).
        if (i < 0) {
          i = runtimeOverlay.executionOrder.findIndex(
            (s) => s.runtimeStageId?.endsWith("/" + activeRsid),
          );
        }
        if (i >= 0) overlayIdx = i;
      }
      // Map the shell's 2-colour Trace theme onto TracedFlow's colour model:
      // `visited → done`, `current → active`, and a neutral base per mode. The
      // flowchart background stays transparent (inherits the container), so it
      // follows the consumer's dark/light automatically.
      const traceColors = traceTheme && {
        ...(traceTheme.visited !== undefined && { done: traceTheme.visited }),
        ...(traceTheme.current !== undefined && { active: traceTheme.current }),
        ...(traceTheme.mode !== undefined && { default: traceTheme.mode === "dark" ? "#94a3b8" : "#64748b" }),
      };
      return (
        <TracedFlow
          graph={traceGraph}
          overlay={runtimeOverlay ?? undefined}
          sliceCone={sliceCone ?? undefined}
          traceWorkflow={traceWorkflow}
          colors={traceColors || undefined}
          scrubIndex={overlayIdx}
          onNodeClick={(stageId) => onNodeClick?.(stageId)}
          // CONTROLLED drill: the shell owns the scope, the chart renders it.
          // Every gesture — a mount card here, a row in the Topology tree, the
          // breadcrumb — moves the same one value, so the chart can never show
          // a different level than the panels around it.
          currentSubflowId={currentSubflowId ?? null}
          onSubflowChange={(mountId) => onSubflowChange?.(mountId)}
        />
      );
    };
  }, [traceGraph, runtimeOverlay, traceTheme]);
  const effectiveRenderFlowchart = renderFlowchart ?? tracedFlowRenderer;
  const showExecutionChart = !!effectiveRenderFlowchart && (!!renderFlowchart || !!traceGraph);
  const leftLabel = panelLabels?.topology ?? "Topology";
  const rightLabel = panelLabels?.details ?? "Details";
  const bottomLabel = panelLabels?.timeline ?? "Timeline";

  // Responsive: detect narrow container + notify children of size changes
  const { ref: shellRef, isNarrow } = useContainerBreakpoints<HTMLDivElement>({
    notifyWindowResize: true,
  });

  // Auto-detect recorder views from runtimeSnapshot.recorders
  const autoRecorderViews = useMemo(() => {
    const recorders = (runtimeSnapshot as any)?.recorders as Array<{ id: string; name: string; description?: string; preferredOperation?: string; data: unknown }> | undefined;
    if (!recorders?.length) return [];
    // Don't auto-generate for IDs that have explicit recorderViews
    const explicitIds = new Set((recorderViews ?? []).map((v) => v.id));
    // ...nor for the recorder already rendered AS the Story tab — otherwise
    // the narrative shows twice: once as the story, once as raw entry JSON.
    if (snapshotNarrative?.id) explicitIds.add(snapshotNarrative.id);
    return recorders
      .filter((r) => !explicitIds.has(r.id))
      .map((r) => ({ id: r.id, name: r.name, description: r.description, preferredOperation: r.preferredOperation, data: r.data }));
  }, [runtimeSnapshot, recorderViews, snapshotNarrative]);

  // Build tab list: Result + Memory (always), Narrative (when data exists),
  // explicit recorder views, auto-detected recorder views
  const hasNarrative = !!narrativeEntries?.length || companionNarrativeMissing;
  const allTabs = useMemo(() => {
    const tabs: Array<{ id: string; name: string; description?: string }> = [
      { id: "result", name: "Result", description: "Final output and console logs" },
      { id: "memory", name: "Memory", description: "Accumulator — progressive shared state at each stage" },
    ];
    if (hasNarrative) {
      tabs.push({ id: "narrative", name: "Narrative", description: "Translator (SequenceRecorder) — interleaved flow + data narrative per execution step" });
    }
    for (const v of recorderViews ?? []) {
      tabs.push({ id: v.id, name: v.name, description: v.description });
    }
    for (const v of autoRecorderViews) {
      tabs.push({ id: v.id, name: v.name, description: v.description });
    }
    // Filter hidden tabs
    const hideSet = new Set(hideTabsProp ?? []);
    return hideSet.size > 0 ? tabs.filter((t) => !hideSet.has(t.id)) : tabs;
  }, [hasNarrative, recorderViews, autoRecorderViews, hideTabsProp]);

  // Unstyled mode shows the SAME tabs as styled mode, plus the whole-surface
  // view. It used to render that surface from a tab id that appeared in no
  // list at all, so Result was the only button that did anything and Memory,
  // Narrative and every recorder view were dead.
  const unstyledTabs = useMemo(
    () => [
      ...allTabs,
      {
        id: EXPLAINABLE_TAB_ID,
        name: "Explainable",
        description: "Chart, memory, narrative and timeline in one scroll",
      },
    ],
    [allTabs],
  );

  const validTabIds = new Set(allTabs.map((t) => t.id));
  const resolvedDefault = defaultTab && validTabIds.has(defaultTab) ? defaultTab : allTabs[0]?.id ?? "result";
  const [activeTab, setActiveTab] = useState<string>(resolvedDefault);
  const [snapshotIdx, setSnapshotIdxRaw] = useState(0);
  const [rightExpanded, setRightExpanded] = useState(defaultExpanded?.details ?? true);
  const [rightPanelMode, setRightPanelMode] = useState<RightPanelMode>("insights");
  // Inspector's active tab, lifted so the chart can paint the dependency
  // CONE exactly while the Data Trace tab is open (Inspector mode).
  const [inspectorTab, setInspectorTab] = useState<"state" | "trace">("state");

  const traceSessionState = useTraceSessionState(snapshotIdx);

  // `tabs` never did anything. Say so out loud rather than let a consumer go
  // on believing a list they pass is being honoured.
  useEffect(() => {
    if (deprecatedTabs === undefined) return;
    devWarn(
      () =>
        "[ExplainableShell] the `tabs` prop is deprecated and has no effect. " +
        "Use `hideTabs` to drop tabs by id, and `defaultTab` to choose which " +
        "tab opens first.",
    );
  }, [deprecatedTabs]);


  const [leftExpanded, setLeftExpanded] = useState(defaultExpanded?.topology ?? false);
  const [timelineExpanded, setTimelineExpanded] = useState(defaultExpanded?.timeline ?? false);

  // Auto-collapse all panels when switching to narrow (mobile)
  useEffect(() => {
    if (isNarrow) {
      setLeftExpanded(false);
      setRightExpanded(false);
      setTimelineExpanded(false);
    }
  }, [isNarrow]);

  // Notify ReactFlow (and any ResizeObserver-based children) when panels toggle
  const triggerReflow = useCallback(() => {
    // Fire twice: once immediately for fast response, once after CSS transition ends
    requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
    setTimeout(() => window.dispatchEvent(new Event("resize")), 320);
  }, []);
  const toggleLeft = useCallback((v: boolean) => { setLeftExpanded(v); triggerReflow(); }, [triggerReflow]);
  const toggleRight = useCallback((v: boolean) => { setRightExpanded(v); triggerReflow(); }, [triggerReflow]);
  const toggleTimeline = useCallback(() => { setTimelineExpanded((p) => !p); triggerReflow(); }, [triggerReflow]);

  const sourceRunId = sourceRunKey(runtimeSnapshot);
  const readsAvailable = useMemo(
    () =>
      runHasRecordedReads(
        runtimeSnapshot,
        snapshots.flatMap((stage) =>
          stage.subflowResult ? [stage.subflowResult] : [],
        ),
      ),
    [runtimeSnapshot, snapshots],
  );
  const navigation = useSubflowNavigation({
    snapshots, sourceRunId, readsAvailable, exactResults, narrativeEntries,
    traceGraph, snapshotIdx, setSnapshotIdxRaw,
    activeTab: JSON.stringify([activeTab, rightPanelMode, inspectorTab]),
    onScopeReset: traceSessionState.reset,
  });
  const {
    selectedStack, setSnapshotIdx, handleDrillDown, handleBreadcrumbNavigate,
    handleChartSubflowChange, handleNodeClick,
  } = navigation;
  const isInSubflow = selectedStack.length > 0;
  // autoPlay's one shot belongs to the RUN, not to the rail's array: a drill
  // swaps that array, and `runtimeSnapshot={executor.getSnapshot()}` makes a
  // fresh one per render.
  const autoPlayRun = sourceRunId ?? snapshots;
  // A new run plays from its own first stage, so it leaves the drill. During
  // render, so the rail never sees the new run from inside the old subflow.
  if (autoPlay && navigation.sourceChanged && navigation.isDrilled && !prefersReducedMotion()) {
    navigation.resetRoot();
  }
  // Each run is offered to autoPlay once. The shell holds that memory because
  // the rail does not last: a tab change, a styling flip or an empty state
  // remounts it, and a fresh rail must not rewind over a person's Pause.
  const offeredRun = useRef<unknown>(undefined);
  const railAutoPlay = autoPlay && !isInSubflow;
  const currentLevel = useMemo(() => {
    const top = selectedStack.at(-1);
    return (
      top ?? {
        spec: null,
        snapshots,
        narrative: undefined,
        subflowId: undefined,
        traceScope: undefined,
      }
    );
  }, [selectedStack, snapshots]);
  const activeTraceScope = useMemo<TraceScope>(() => {
    if (currentLevel.traceScope) return currentLevel.traceScope;
    const metadata = rootMountLabels(runtimeSnapshot?.executionTree, runtimeSnapshot?.commitLog);
    return {
      invocationPath: [],
      commitLog: metadata.availability.ok ? runtimeSnapshot?.commitLog ?? [] : [],
      executionTree: metadata.availability.ok ? runtimeSnapshot?.executionTree : undefined,
      availability: metadata.availability,
      readsAvailable: readsAvailable && metadata.hasTree,
      mountLabels: metadata.labels,
    };
  }, [currentLevel.traceScope, runtimeSnapshot, readsAvailable]);
  const activeTraceKey = isInSubflow
    ? JSON.stringify(activeTraceScope.invocationPath)
    : null;
  const activeSnapshots = currentLevel.snapshots;
  const safeIdx = activeSnapshots.length > 0
    ? Math.max(0, Math.min(snapshotIdx, activeSnapshots.length - 1))
    : 0;

  const onStartInspector = useCallback(() => {
    setRightPanelMode("what");
    setInspectorTab("trace");
  }, []);
  const traceSession = useTraceSessionController({
    session: traceSessionState, activeTraceScope, activeTraceKey, activeSnapshots,
    safeIdx, sourceChanged: navigation.sourceChanged,
    traceHistoryAvailable: isInSubflow || !!runtimeSnapshot?.commitLog,
    showDataTraceCone: rightPanelMode === "what" && inspectorTab === "trace",
    setSnapshotIdx, onStartInspector,
    runtimeSnapshot, openTraceSource: navigation.openTraceSource,
    restoreTraceQuestion: navigation.restoreTraceQuestion,
  });
  const { shellDataTrace, sliceCone, navigateToStage, tracingRail } = traceSession;
  const traceCursorRuntimeStageId = activeSnapshots[safeIdx]?.runtimeStageId ?? null;
  const traceWorkflow = useMemo(() => buildTraceWorkflowOverlay(
    traceSession.traceWalk, activeSnapshots, traceCursorRuntimeStageId,
  ), [traceSession.traceWalk, activeSnapshots, traceCursorRuntimeStageId]);

  // While drilled in, feed the Story the subflow-scoped, subflow-renumbered
  // narrative (Bug 3) so it reveals to the subflow-local cursor — not the
  // whole-run-numbered per-stage fallback text (which is why it used to start
  // at "Step 24" instead of step 1).
  const activeNarrativeEntries = isInSubflow ? currentLevel.narrative : narrativeEntries;

  // Which subflow the Story is showing. Every entry in a drilled list carries
  // a `subflowId`, so without this the Story would hide the whole level as
  // "subflow internals". The drill key usually IS the runtime subflow path;
  // when a consumer's node ids don't line up with it, fall back to the
  // SHALLOWEST subflowId present — that is this level, and anything longer is
  // a subflow nested inside it.
  const narrativeScopeSubflowId = useMemo<string | undefined>(() => {
    if (!isInSubflow) return undefined;
    const key = currentLevel.subflowId;
    const entries = currentLevel.narrative ?? [];
    if (key !== undefined && entries.some((e) => e.subflowId === key)) return key;
    let shallowest: string | undefined;
    for (const e of entries) {
      const id = e.subflowId;
      if (id === undefined) continue;
      if (shallowest === undefined || id.length < shallowest.length) shallowest = id;
    }
    return shallowest ?? key;
  }, [isInSubflow, currentLevel]);

  const breadcrumbs = useMemo(() => {
    const root = { label: title || "Flowchart", spec: null, description: undefined as string | undefined };
    return [root, ...selectedStack.map((e) => ({ label: e.label, spec: e.spec, description: undefined as string | undefined }))];
  }, [title, selectedStack]);

  // Recorder-driven: derive subflow presence from the build-time graph.
  // Falls back to the legacy spec walk only when traceGraph is absent
  // (e.g., a consumer still threading raw spec). When both are absent,
  // the tree sidebar is hidden.
  const showTreeSidebar = useMemo(() => {
    if (traceGraph?.nodes?.length) {
      return traceGraph.nodes.some((n) => n.data?.isSubflow === true);
    }
    return false;
  }, [traceGraph]);

  const rootOverlay = useMemo(() => {
    if (isInSubflow || !snapshots.length) return { activeStage: undefined, doneStages: undefined };
    const doneStages = new Set(snapshots.slice(0, safeIdx).map((s) => s.stageLabel));
    const activeStage = snapshots[safeIdx]?.stageLabel ?? null;
    return { activeStage, doneStages };
  }, [isInSubflow, snapshots, safeIdx]);

  // ── Handlers ──
  const handleTabChange = useCallback((tab: ShellTab) => {
    setActiveTab(tab);
    navigation.resetRoot();
  }, [navigation.resetRoot]);

  const handleSnapshotChange = useCallback((idx: number | string) => {
    if (typeof idx === "number") setSnapshotIdx(idx);
  }, [setSnapshotIdx]);

  // ── The ONE drill ───────────────────────────────────────────────────
  // `drillDownStack` is the shell's single source of truth for "where are
  // we?", and its top entry's `subflowId` (a mount NODE id) is handed to the
  // chart as its CONTROLLED scope. The chart no longer keeps a private drill
  // state, so a drill started from the Topology tree, the breadcrumb or a
  // chart card can no longer disagree with the chart on screen.
  const chartDrillKey = selectedStack.at(-1)?.subflowId ?? null;
  const handleTreeNodeSelect = useCallback(
    (name: string, isSubflow: boolean, nodeId?: string) => {
      if (isSubflow) {
        // Drill by the mount NODE id when the tree supplies one: the label is
        // ambiguous (mount the same child chart twice and both rows read
        // "Prepare"), and a nested mount needs its ancestors drilled too.
        handleDrillDown(nodeId ?? name);
      } else {
        navigation.resetRoot();
        const idx = snapshots.findIndex((s) => s.stageLabel === name);
        if (idx >= 0) setSnapshotIdx(idx);
      }
    },
    [snapshots, handleDrillDown, navigation.resetRoot, setSnapshotIdx]
  );

  const traceTabContent = <TraceSessionPanel
    availability={activeTraceScope.availability}
    scopeLabel={isInSubflow ? "Child" : "Root"}
    snapshot={activeSnapshots[safeIdx]}
    selectedIndex={safeIdx}
    view={traceSession}
  />;

  const navigationStatus = <SubflowNavigationStatus
    staleInputs={companions.staleKeys.length > 0}
    notice={navigation.navigationNotice}
    choice={navigation.visitChoice}
    onChoose={navigation.applyDrill}
    onDismiss={navigation.clearTransient}
  />;
  // Map tab id → label for rendering
  const tabLabels = new Map(allTabs.map((t) => [t.id, t.name]));

  // ── Nothing to show ──
  // Full chrome around zero rows looks like a rendering bug and tells the
  // consumer nothing. Say which ingredient is missing instead. The three
  // cases below are genuinely different problems with different fixes.
  //
  // A plain function, not an early return: the styled tree still has hooks
  // below this point, and skipping them on an empty render would change hook
  // ORDER the moment a live run filled the shell in.
  // Render ONE details tab's body. This is the shell's single implementation,
  // used by all three surfaces that show a tab: the desktop right panel, the
  // narrow layout's details panel, and unstyled mode. `plain` only changes how
  // each panel PAINTS itself — never which panel it is. That is the unstyled
  // contract (same content, no styling), which unstyled mode used to break by
  // rendering nothing at all for Memory, Narrative and every recorder view.
  const renderTabBody = useCallback(
    (tabId: string, plain: boolean): ReactNode => {
      if (tabId === "result") {
        return (
          <ResultPanel
            data={resultData ?? null}
            logs={logs}
            hideConsole={hideConsole}
            size={size}
            unstyled={plain}
          />
        );
      }
      if (tabId === "memory") {
        return (
          <MemoryPanel
            snapshots={activeSnapshots}
            selectedIndex={safeIdx}
            size={size}
            unstyled={plain}
            style={plain ? undefined : { height: "100%" }}
          />
        );
      }
      if (tabId === "narrative") {
        if (companionNarrativeMissing) return <StoryUnavailableNote />;
        return (
          <NarrativePanel
            snapshots={activeSnapshots}
            selectedIndex={safeIdx}
            narrativeEntries={activeNarrativeEntries}
            scopeSubflowId={narrativeScopeSubflowId}
            runtimeSnapshot={runtimeSnapshot}
            size={size}
            unstyled={plain}
            style={plain ? undefined : { height: "100%" }}
          />
        );
      }
      const customView = recorderViews?.find((v) => v.id === tabId);
      if (customView?.render) {
        return customView.render({ snapshots: activeSnapshots, selectedIndex: safeIdx });
      }
      // Auto-detected recorder view — time-travel aware for keyed recorders,
      // JSON fallback otherwise.
      const autoView = autoRecorderViews.find((v) => v.id === tabId);
      if (autoView) {
        return (
          <KeyedRecorderView
            data={autoView.data}
            description={autoView.description}
            preferredOperation={
              autoView.preferredOperation as "translate" | "accumulate" | "aggregate" | undefined
            }
            snapshots={activeSnapshots}
            selectedIndex={safeIdx}
          />
        );
      }
      return null;
    },
    [
      resultData,
      logs,
      hideConsole,
      size,
      activeSnapshots,
      safeIdx,
      activeNarrativeEntries,
      companionNarrativeMissing,
      narrativeScopeSubflowId,
      runtimeSnapshot,
      recorderViews,
      autoRecorderViews,
    ],
  );

  // `traceTheme.mode` applies eui's full light/dark preset as `--fp-*` vars on
  // the shell root, so the WHOLE shell (canvas, panels, nodes, text, borders)
  // follows dark/light from one prop — the consumer never hand-sets the palette.
  // `visited`/`current` layer node-fill overrides on top (they win over the
  // preset). Any `--fp-*` the consumer sets on an ancestor is still respected
  // for tokens the preset/overrides don't touch. This is the coarse switch;
  // `--fp-*` remains the fine escape hatch.
  //
  // This hook must stay ABOVE the unstyled early return below: a hook after
  // an early return runs only on the renders that get past it, so flipping
  // `unstyled` between renders would change the hook count and React would
  // throw. (Unstyled mode itself never uses these vars — that is the point
  // of unstyled — but the hook must still RUN.)
  const shellThemeVars = useMemo<React.CSSProperties>(() => {
    if (!traceTheme) return {};
    return {
      // ONE mapping from mode → palette, shared with the standalone
      // components' `theme="light"` prop (theme/mode.ts).
      ...themeModeVars(traceTheme.mode),
      ...(traceTheme.visited !== undefined && { ["--fp-node-visited" as string]: traceTheme.visited }),
      ...(traceTheme.current !== undefined && { ["--fp-node-cursor" as string]: traceTheme.current }),
    } as React.CSSProperties;
  }, [traceTheme]);

  const renderEmptyState = (themeVars: React.CSSProperties): React.ReactElement => {
    const shellStyle = { ...themeVars, ...style } as React.CSSProperties;
    if (derivedFromRuntime?.error) {
      return (
        <EmptyShell
          unstyled={unstyled}
          className={className}
          style={shellStyle}
          reason="That snapshot could not be read."
          detail={
            <>
              <div>
                Expected a footprintjs <code>executor.getSnapshot()</code> —{" "}
                <code>{"{ sharedState, executionTree, commitLog }"}</code>.
              </div>
              <div style={unstyled ? undefined : { fontFamily: theme.fontMono, fontSize: 11, marginTop: 6 }}>
                {derivedFromRuntime.error}
              </div>
            </>
          }
        />
      );
    }
    const gotRunData = !!runtimeSnapshot || !!snapshotsProp;
    return (
      <EmptyShell
        unstyled={unstyled}
        className={className}
        style={shellStyle}
        reason={gotRunData ? "That run has no stages to show." : "No run to show yet."}
        detail={
          gotRunData ? (
            <div>
              The snapshot was read fine but its <code>executionTree</code> is empty — a run that
              was never executed, or a snapshot taken before <code>run()</code> finished.
            </div>
          ) : (
            <>
              <div>
                Pass a recorded run: <code>runtimeSnapshot={"{executor.getSnapshot()}"}</code> (the
                shell converts it), or pre-converted{" "}
                <code>snapshots={"{toVisualizationSnapshots(...)}"}</code>.
              </div>
              <div>
                Add <code>traceGraph</code> for the chart — it comes from the chart&apos;s
                structure, not the snapshot.
              </div>
            </>
          )
        }
      />
    );
  };

  // ── Unstyled mode ──
  if (unstyled) {
    if (snapshots.length === 0) return renderEmptyState({});
    return <UnstyledShellLayout
      tabs={unstyledTabs} activeTab={activeTab} onTabChange={handleTabChange}
      className={className} style={style}
    >
          {isExplainableTab(activeTab) ? (
            <>
              <TimeTravelRail snapshots={activeSnapshots} selectedIndex={safeIdx} onIndexChange={handleSnapshotChange} unstyled tracing={tracingRail} autoPlay={railAutoPlay} autoPlayKey={autoPlayRun} offered={offeredRun} />
              {navigationStatus}
              {isInSubflow && <SubflowBreadcrumb breadcrumbs={breadcrumbs} onNavigate={handleBreadcrumbNavigate} />}
              <TraceDependencyView unstyled walk={traceSession.traceWalk} hasWorkflow={showExecutionChart}
                cursorRuntimeStageId={activeSnapshots[safeIdx]?.runtimeStageId ?? null} snapshots={activeSnapshots}
                onJumpToStop={traceSession.navigateToStage} onFollowIngredient={traceSession.handleFollowIngredient}
                onFollowHandoff={traceSession.handleFollowHandoff}
                questionTrail={traceSession.questionTrail} onReturnToQuestion={traceSession.handleReturnToQuestion}>
                {(traceGraph || renderFlowchart) && effectiveRenderFlowchart?.({ spec: null, snapshots: activeSnapshots, selectedIndex: safeIdx, onNodeClick: handleNodeClick, showStageId, currentSubflowId: chartDrillKey, onSubflowChange: handleChartSubflowChange, traceWorkflow, ...(sliceCone && { sliceCone }) })}
              </TraceDependencyView>
              {missingChart && <MissingChartNote unstyled />}
              <MemoryPanel snapshots={activeSnapshots} selectedIndex={safeIdx} unstyled />
              {companionNarrativeMissing ? <StoryUnavailableNote /> : <NarrativePanel snapshots={activeSnapshots} selectedIndex={safeIdx} narrativeEntries={activeNarrativeEntries} scopeSubflowId={narrativeScopeSubflowId} unstyled />}
              <GanttTimeline snapshots={activeSnapshots} selectedIndex={safeIdx} onSelect={handleSnapshotChange} unstyled />
            </>
          ) : (
            renderTabBody(activeTab, true)
          )}
    </UnstyledShellLayout>;
  }

  // ── Styled mode ──

  // Show topology when there's a renderer AND a graph to draw. The recorder/
  // traceGraph renderer draws from `traceGraph` and self-drills, so it does NOT
  // need a spec — gating on `activeSpec` alone hid the chart whenever a subflow
  // was drilled via the runtime path (`resolveSubflowFromRuntime` returns
  // spec: null), while the slider/story/breadcrumb kept working. See
  // test/component/ExplainableShellDrill.test.tsx.
  const showTopology = !!traceSession.traceWalk || showExecutionChart;

  const detailsPanel = <ShellDetailTabs tabs={allTabs} activeTab={activeTab} onTabChange={handleTabChange}>
    {renderTabBody(activeTab, false)}
  </ShellDetailTabs>;

  // Safe to hand back the diagnosis instead of chrome wrapped around nothing
  // (every hook ran above the unstyled return already).
  if (snapshots.length === 0) return renderEmptyState(shellThemeVars);

  return <ShellLayout
    containerRef={shellRef} className={className} style={style}
    themeStyle={shellThemeVars} isNarrow={isNarrow} stageCount={activeSnapshots.length}
    showTopology={showTopology} showTreeSidebar={showTreeSidebar && !traceSession.traceWalk}
    topology={{ label: leftLabel, expanded: leftExpanded, onChange: toggleLeft }}
    details={{ label: rightLabel, expanded: rightExpanded, onChange: toggleRight }}
    timeline={{ label: bottomLabel, expanded: timelineExpanded, onChange: toggleTimeline }}
    slots={{
      rail: <TimeTravelRail snapshots={activeSnapshots} selectedIndex={safeIdx} onIndexChange={handleSnapshotChange}
        size={size} tracing={tracingRail} autoPlay={railAutoPlay} autoPlayKey={autoPlayRun} offered={offeredRun} />,
      navigation: navigationStatus,
      breadcrumb: isInSubflow && <SubflowBreadcrumb breadcrumbs={breadcrumbs} onNavigate={handleBreadcrumbNavigate} />,
      chart: <TraceDependencyView walk={traceSession.traceWalk} hasWorkflow={showExecutionChart}
        cursorRuntimeStageId={activeSnapshots[safeIdx]?.runtimeStageId ?? null} snapshots={activeSnapshots}
        onJumpToStop={traceSession.navigateToStage} onFollowIngredient={traceSession.handleFollowIngredient}
        onFollowHandoff={traceSession.handleFollowHandoff}
        questionTrail={traceSession.questionTrail} onReturnToQuestion={traceSession.handleReturnToQuestion}>
        {showExecutionChart ? effectiveRenderFlowchart!({
          spec: null, snapshots: activeSnapshots, selectedIndex: safeIdx, onNodeClick: handleNodeClick,
          showStageId, currentSubflowId: chartDrillKey, onSubflowChange: handleChartSubflowChange,
          traceWorkflow,
          ...(sliceCone && { sliceCone }),
        }) : null}
      </TraceDependencyView>,
      missingChart: missingChart && <MissingChartNote />,
      tree: <SubflowTree graph={traceGraph ?? { nodes: [], edges: [] }} activeStage={rootOverlay.activeStage}
        doneStages={rootOverlay.doneStages} onNodeSelect={handleTreeNodeSelect} />,
      mobileDetails: detailsPanel,
      desktopDetails: <RightPanel mode={rightPanelMode} onModeChange={setRightPanelMode}
        dataTrace={shellDataTrace} onInspectorTabChange={setInspectorTab} inspectorTab={inspectorTab}
        traceContent={traceTabContent} snapshots={activeSnapshots} selectedIndex={safeIdx}
        activeTab={activeTab} allTabs={allTabs} renderTabBody={renderTabBody} size={size}
        onNavigateToStage={navigateToStage} />,
      gantt: <GanttTimeline snapshots={activeSnapshots} selectedIndex={safeIdx} onSelect={handleSnapshotChange} size={size} />,
      compactTimeline: <CompactTimeline snapshots={activeSnapshots} selectedIndex={safeIdx}
        defaultExpanded={timelineExpanded} label={bottomLabel} />,
    }}
  />;
}
