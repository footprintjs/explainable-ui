import { LazySubflowStatus, LazyTraceEvidence } from "./_internal/LazySubflowStatus";
import { useSubflowPrefetch } from "./_internal/useSubflowPrefetch";
import { resolveProgressiveRenderingOptions } from "../../progressiveRendering/options";
/**
 * Coordinates one selected run, cursor and subflow scope. Focused controllers
 * own tracing and playback; internal presentation components render the model
 * and navigation commands in styled or unstyled layouts.
 *
 * Consumer controls theme via --fp-* CSS custom properties.
 */
import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from "react";
import type { StageSnapshot } from "../../types";
import { theme, themeModeVars, tokensToCSSVars, FootprintTheme } from "../../theme";
import { useContainerBreakpoints } from "../../_internal/useContainerBreakpoints";
import { useShellRecording } from "./_internal/useShellRecording";
import { runHasRecordedReads, sourceRunKey, rootMountLabels, type TraceScope } from "./_internal/traceScope";
import { useSubflowNavigation } from "./_internal/useSubflowNavigation";
import { useTraceSessionState, useTraceSessionController, type ActivityTraceOrigin } from "./_internal/useTraceSession";
import { EmptyShell, MissingChartNote } from "./_internal/ShellChrome";
import { KeyedRecorderView } from "./_internal/KeyedRecorderView";
import { RightPanel, type RightPanelMode } from "./_internal/RightPanel";
import { ShellLayout, ShellDetailTabs, UnstyledShellLayout } from "./_internal/ShellLayout";
import { LensDetailsPanel } from "./_internal/LensDetailsPanel";
// The JSON arrangement composes these same mounted Lens surfaces.
import { LensGridLayout } from "./_internal/LensGridLayout";
import { resolveLensLayout } from "../../model/lensLayout";
import { resolveFlowchartOptions, type FlowchartRenderer } from "../../model/flowchart";
import { TraceSessionPanel } from "./_internal/TraceSessionPanel";
import { TraceDependencyView } from "../DataTracePanel/TraceDependencyView";
import { SubflowNavigationStatus } from "./_internal/SubflowNavigationStatus";
import { StoryUnavailableNote } from "./_internal/TraceUnavailableNote";
import { ownDataField } from "./_internal/safeRecordRead";
import { overlayFromSnapshot } from "../../adapters/overlayFromSnapshot";
import { buildTraceWorkflowOverlay, type TraceWorkflowOverlay } from "../../trace/traceWorkflowOverlay";
import { projectStageActivity, type StageActivityTraceTarget } from "../../trace/stageActivity";
import { StageActivityPanel } from "../StageActivityPanel";
import { InspectorPanel } from "../InspectorPanel/InspectorPanel";
import { LensWorkbenchContext, type LensWorkbenchContextValue, type LensView } from "./LensWorkbench";
import { CommentaryPanel } from "../ExplainableView/CommentaryPanel";
import { InsightPanel } from "../InsightPanel/InsightPanel";
import { insightName } from "../../model/recorderView";
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

/** A supplied renderer runs only when its surface is actually mounted. */
function MountedChart({ render }: { render: () => ReactNode }) {
  return <>{render()}</>;
}

import { CompactTimeline } from "../CompactTimeline/CompactTimeline";
import type { ExplainableShellProps, SpecNode, ShellTab } from "./ShellProps";
export type { ExplainableShellProps, SpecNode, RecorderView, TraceTheme, ShellTab, PanelLabels, DefaultExpanded } from "./ShellProps";
export type { RuntimeSnapshotInput } from "../../model/recording";
const EXPLAINABLE_TAB_ID = "explainable";
function isExplainableTab(tabId: string): boolean {
  return tabId === EXPLAINABLE_TAB_ID || tabId === "ai-compatible";
}

export function ExplainableShell(props: ExplainableShellProps) {
  const {
  snapshots: snapshotsProp,
  runtimeSnapshot: _runtimeSnapshot,
  source, rendering,
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
  flowchart,
  theme: consumerTheme,
  renderLayout,
  layout,
  view: controlledView,
  defaultView = "developer",
  onViewChange,
  commentary,
  replayControls,
  showStageId = false,
  autoPlay = false,
  traceGraph: _traceGraph,
  runtimeOverlay: runtimeOverlayProp,
  traceTheme,
  size = "default",
  unstyled = false,
  className,
  style,
  } = props;
  const [uncontrolledView, setUncontrolledView] = useState<LensView>(defaultView);
  const view = controlledView ?? uncontrolledView;
  const handleViewChange = useCallback((next: LensView) => {
    if (controlledView === undefined) setUncontrolledView(next);
    onViewChange?.(next);
  }, [controlledView, onViewChange]);
  // Fixed controlled views show an audience label, never inert toggle buttons.
  const changeDetailsView = controlledView === undefined || onViewChange ? handleViewChange : undefined;
  // A run recorded WITH footprintjs's narrative recorder carries its story
  // inside the snapshot, so a replayed recording tells the same story the
  // live run did — no executor left to call getNarrativeEntries() on. The
  // A paired prop takes precedence. Known unchanged companions from a
  // previous run are withheld; a current record-owned Story can replace them.
  const { sourceState, originalSnapshot, runtimeSnapshot, snapshotNarrative, companions, companionNarrativeMissing,
    narrativeEntries, exactResults, derivedFromRuntime, snapshots, resultData, runtimeOverlay, traceGraph } = useShellRecording(props);

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
  const resolvedLayout = useMemo(() => layout && !renderLayout && snapshots.length > 0
    ? resolveLensLayout(layout).definition : undefined, [layout, renderLayout, snapshots.length]);
  const flowchartRenderer = useMemo(() => resolveFlowchartOptions(flowchart).renderer
    ?? resolvedLayout?.flowchart?.renderer ?? "flat", [flowchart, resolvedLayout]);
  const leftLabel = panelLabels?.topology ?? "Topology";
  const rightLabel = panelLabels?.details ?? "Details";
  const bottomLabel = panelLabels?.timeline ?? "Timeline";

  // Responsive: detect narrow container + notify children of size changes
  const { ref: shellRef, isNarrow } = useContainerBreakpoints<HTMLDivElement>({
    notifyWindowResize: true,
  });
  const shellElement = useRef<HTMLDivElement | null>(null);
  const setShellElement = useCallback((node: HTMLDivElement | null) => {
    shellElement.current = node;
    shellRef(node);
  }, [shellRef]);
  const setUnstyledShellElement = useCallback((node: HTMLDivElement | null) => {
    shellElement.current = node;
  }, []);
  const activityFocusRequest = useRef<"trace" | "activity" | null>(null);

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
      { id: "memory", name: "State", description: "Recorded state at the selected visit" },
    ];
    if (hasNarrative) {
      tabs.push({ id: "narrative", name: "Run log", description: "Recorded events through the selected visit" });
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
  const hasExplicitDefault = defaultTab !== undefined && (validTabIds.has(defaultTab) || (unstyled && isExplainableTab(defaultTab)));
  const resolvedDefault = hasExplicitDefault ? defaultTab! : unstyled ? EXPLAINABLE_TAB_ID : allTabs[0]?.id ?? "result";
  const [activeTab, setActiveTab] = useState<string>(resolvedDefault);
  const [snapshotIdx, setSnapshotIdxRaw] = useState(0);
  const [rightExpanded, setRightExpanded] = useState(defaultExpanded?.details ?? true);
  const [rightPanelMode, setRightPanelMode] = useState<RightPanelMode>(
    !hasExplicitDefault || resolvedDefault === "memory" ? "what" : resolvedDefault === "result" ? "result" : "insights",
  );
  // Inspector's active tab, lifted so the chart can paint the dependency
  // CONE exactly while the Data Trace tab is open (Inspector mode).
  const [inspectorTab, setInspectorTab] = useState<"state" | "trace">("state");
  const [activitySelected, setActivitySelected] = useState(!hasExplicitDefault || resolvedDefault !== "memory");
  const [activityVariableSelection, setActivityVariableSelection] = useState<{
    identity: string; variableId: string; sourceToken: object;
  } | null>(null);
  const activityExitRef = useRef<(() => void) | null>(null);
  const [mobileInspectorSelected, setMobileInspectorSelected] = useState(!hasExplicitDefault || resolvedDefault === "memory");
  const handleInspectorTabChange = useCallback((tab: "state" | "trace") => {
    setActivitySelected(false);
    setInspectorTab(tab);
  }, []);
  const handleActivitySelect = useCallback(() => {
    if (activityExitRef.current) activityExitRef.current();
    else setActivitySelected(true);
  }, []);

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

  const sourceRunId = source ?? sourceRunKey(originalSnapshot);
  const activitySource = useRef({ source: sourceRunId, token: {} });
  if (activitySource.current.source !== sourceRunId) activitySource.current = { source: sourceRunId, token: {} };
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
  const nestedReadTracking = ownDataField(runtimeSnapshot, "nestedReadTracking") === true;
  const navigation = useSubflowNavigation({
    source, sourceState, snapshots, sourceRunId, readsAvailable, nestedReadTracking, exactResults, narrativeEntries,
    traceGraph, snapshotIdx, setSnapshotIdxRaw,
    activeTab: JSON.stringify([activeTab, rightPanelMode, inspectorTab, activitySelected, mobileInspectorSelected]),
    onScopeReset: traceSessionState.reset,
  });
  const {
    selectedStack, setSnapshotIdx, handleDrillDown, handleBreadcrumbNavigate,
    handleChartSubflowChange, handleNodeClick,
  } = navigation;
  const currentPath = selectedStack.at(-1)?.traceScope.invocationPath ?? [];
  const activeGraph = useMemo(() => source ? source.getGraph(currentPath) : traceGraph, [source, sourceState, traceGraph, selectedStack]);
  const renderingOptions = useMemo(() => ({ ...resolvedLayout?.rendering, ...resolveProgressiveRenderingOptions(rendering) }), [resolvedLayout, rendering]);
  useSubflowPrefetch(source, renderingOptions, selectedStack.at(-1)?.snapshots ?? snapshots, snapshotIdx, currentPath);
  const activeRuntimeOverlay = useMemo(() => {
    const scope = selectedStack.at(-1)?.traceScope;
    return source && scope ? overlayFromSnapshot({ commitLog: scope.commitLog, executionTree: scope.executionTree }) : runtimeOverlay;
  }, [source, selectedStack, runtimeOverlay]);
  const tracedFlowRenderer = useMemo(() => {
    if (!activeGraph) return undefined;
    return ({ selectedIndex, snapshots, onNodeClick, sliceCone, traceWorkflow, currentSubflowId, onSubflowChange, unstyled: chartUnstyled }: {
      spec: SpecNode | null; snapshots: StageSnapshot[]; selectedIndex: number;
      unstyled?: boolean;
      onNodeClick?: (indexOrId: number | string) => void;
      showStageId?: boolean;
      renderer?: FlowchartRenderer;
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
      if (activeRsid && activeRuntimeOverlay) {
        let i = activeRuntimeOverlay.executionOrder.findIndex(
          (s) => s.runtimeStageId === activeRsid,
        );
        // Drilled-in subflow snapshots carry PREFIX-STRIPPED runtimeStageIds
        // (e.g. "gather#8" vs the overlay's "sf-injection-engine/gather#8"),
        // so the exact match misses and we'd fall back to the raw subflow-local
        // index — mixing index spaces and mis-coloring the whole run as "done".
        // Re-match by suffix so the subflow-local cursor maps to the correct
        // whole-run overlay position (Bug 2).
        if (i < 0) {
          i = activeRuntimeOverlay.executionOrder.findIndex(
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
          renderer={flowchartRenderer}
          graph={activeGraph}
          overlay={activeRuntimeOverlay ?? undefined}
          sliceCone={sliceCone ?? undefined}
          traceWorkflow={traceWorkflow}
          unstyled={chartUnstyled}
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
  }, [activeGraph, activeRuntimeOverlay, traceTheme, flowchartRenderer]);
  const effectiveRenderFlowchart = renderFlowchart ?? tracedFlowRenderer;
  const showExecutionChart = !!effectiveRenderFlowchart && (!!renderFlowchart || !!traceGraph);
  const isInSubflow = selectedStack.length > 0;
  // autoPlay's one shot belongs to the RUN, not to the rail's array: a drill
  // swaps that array, and `runtimeSnapshot={executor.getSnapshot()}` makes a
  // fresh one per render.
  const autoPlayRun = sourceRunId ?? snapshots;
  // A new run plays from its own first stage, so it leaves the drill. During
  // render, so the rail never sees the new run from inside the old subflow.
  if (autoPlay && replayControls?.playPause !== false && snapshots.length >= 2 && navigation.sourceChanged && navigation.isDrilled && !prefersReducedMotion()) {
    navigation.resetRoot();
  }
  // Each run is offered to autoPlay once. The shell holds that memory because
  // the rail does not last: a tab change, a styling flip or an empty state
  // remounts it, and a fresh rail must not rewind over a person's Pause.
  const offeredRun = useRef<unknown>(undefined);
  const railAutoPlay = autoPlay && !isInSubflow;
  const effectiveReplayControls = view === "story"
    ? { intervalMs: 2000, ...replayControls }
    : replayControls;
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
      ...(nestedReadTracking ? { nestedReadTracking: true as const } : {}),
      mountLabels: metadata.labels,
    };
  }, [currentLevel.traceScope, runtimeSnapshot, readsAvailable, nestedReadTracking]);
  const activeTraceKey = isInSubflow
    ? JSON.stringify(activeTraceScope.invocationPath)
    : null;
  const activeSnapshots = currentLevel.snapshots;
  const safeIdx = activeSnapshots.length > 0
    ? Math.max(0, Math.min(snapshotIdx, activeSnapshots.length - 1))
    : 0;
  // Child narrative stays on the selected invocation's local cursor rail.
  const activeNarrativeEntries = isInSubflow ? currentLevel.narrative : narrativeEntries;
  const stageActivity = useMemo(() => projectStageActivity({
    scope: activeTraceScope, snapshots: activeSnapshots, selectedIndex: safeIdx,
    narrativeEntries: activeNarrativeEntries, narrativeAvailable: !companionNarrativeMissing,
  }), [activeTraceScope, activeSnapshots, safeIdx, activeNarrativeEntries, companionNarrativeMissing]);

  const onStartInspector = useCallback(() => {
    activityFocusRequest.current = "trace";
    setRightPanelMode("what");
    setRightExpanded(true);
    setMobileInspectorSelected(true);
    setActivitySelected(false);
    setInspectorTab("trace");
  }, []);
  const onReturnToActivity = useCallback((origin: ActivityTraceOrigin) => {
    activityFocusRequest.current = "activity";
    setRightPanelMode("what");
    setRightExpanded(true);
    setMobileInspectorSelected(true);
    setActivitySelected(true);
    setActivityVariableSelection({
      identity: JSON.stringify([origin.invocationPath, origin.runtimeStageId,
        origin.beforeCommitIdx - (origin.kind === "write" ? 1 : 0)]),
      variableId: origin.variableId,
      sourceToken: activitySource.current.token,
    });
  }, []);
  const traceSession = useTraceSessionController({
    session: traceSessionState, activeTraceScope, activeTraceKey, activeSnapshots,
    safeIdx, sourceChanged: navigation.sourceChanged,
    traceHistoryAvailable: isInSubflow || !!runtimeSnapshot?.commitLog,
    showDataTraceCone: !unstyled && (isNarrow ? mobileInspectorSelected : rightPanelMode === "what") && !activitySelected && inspectorTab === "trace",
    setSnapshotIdx, onStartInspector, onReturnToActivity,
    runtimeSnapshot, recordingIdentity: source, openTraceSource: navigation.openTraceSource,
    restoreTraceQuestion: navigation.restoreTraceQuestion,
    stageActivity,
  });
  activityExitRef.current = traceSession.activityOrigin ? traceSession.handleExitTracing : null;
  const { shellDataTrace, sliceCone, navigateToStage, tracingRail } = traceSession;
  const traceCursorRuntimeStageId = activeSnapshots[safeIdx]?.runtimeStageId ?? null;
  const traceWorkflow = useMemo(() => buildTraceWorkflowOverlay(
    traceSession.traceWalk, activeSnapshots, traceCursorRuntimeStageId,
  ), [traceSession.traceWalk, activeSnapshots, traceCursorRuntimeStageId]);

  const activityIdentity = JSON.stringify([stageActivity.identity.invocationPath,
    stageActivity.identity.runtimeStageId, stageActivity.identity.commitIdx]);
  const selectedActivityVariableId = !navigation.sourceChanged &&
    activityVariableSelection?.sourceToken === activitySource.current.token &&
    activityVariableSelection.identity === activityIdentity ? activityVariableSelection.variableId : undefined;
  const latestActivity = useRef({ view: stageActivity, identity: activityIdentity,
    sourceToken: activitySource.current.token, sourceChanged: navigation.sourceChanged,
    trace: traceSession.handleTraceStageVariable });
  latestActivity.current = { view: stageActivity, identity: activityIdentity,
    sourceToken: activitySource.current.token, sourceChanged: navigation.sourceChanged,
    trace: traceSession.handleTraceStageVariable };
  const handleActivityVariableSelect = useCallback((variableId: string) => {
    const current = latestActivity.current;
    if (current.sourceChanged || !current.view.availability.ok ||
      ![...current.view.reads, ...current.view.writes].some(variable => variable.id === variableId)) return;
    setActivityVariableSelection({ identity: current.identity, variableId, sourceToken: current.sourceToken });
  }, []);
  const handleShellKeyDown = useCallback((event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Escape" || event.defaultPrevented || !traceSession.activityOrigin) return;
    event.preventDefault();
    event.stopPropagation();
    traceSession.handleExitTracing();
  }, [traceSession.activityOrigin, traceSession.handleExitTracing]);
  useEffect(() => {
    const request = activityFocusRequest.current;
    if (!request || (request === "trace" && !traceSession.activityOrigin)) return;
    const selector = request === "trace"
      ? '[data-fp="tt-exit-tracing"], [data-fp="twc-exit"]'
      : '[data-fp="stage-activity-variable"][aria-pressed="true"]';
    const button = shellElement.current?.querySelector<HTMLButtonElement>(selector);
    if (!button) return;
    // The return is an explicit navigation: let the browser reveal a selected
    // key inside a long scrolling Inspector, rather than focus a clipped row.
    button.focus({ preventScroll: request === "trace" });
    activityFocusRequest.current = null;
  }, [traceSession.activityOrigin, traceSession.tracing, activitySelected, selectedActivityVariableId, isNarrow]);
  const handleTraceActivityVariable = useCallback((target: StageActivityTraceTarget) => {
    const current = latestActivity.current;
    if (current.sourceChanged || !current.view.availability.ok) return;
    // A retained button from another run/visit cannot revive a names-equal
    // address: accept only targets from the currently admitted projection.
    if (![...current.view.reads, ...current.view.writes].some(variable => variable.traceTarget === target)) return;
    current.trace(target);
  }, []);

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
    unstyled={unstyled}
    size={size}
  />;

  const navigationStatus = <><LazySubflowStatus pending={navigation.pendingLoad} options={renderingOptions} size={size} unstyled={unstyled} />
    <LazyTraceEvidence source={source} path={activeTraceScope.invocationPath} pending={navigation.pendingLoad}
      mounts={traceSession.traceWalk?.stops.filter(stop => activeTraceScope.mountLabels.has(stop.runtimeStageId)).map(stop => stop.runtimeStageId) ?? []}
      load={navigation.loadEvidence} size={size} unstyled={unstyled} />
    <SubflowNavigationStatus
    unstyled={unstyled} size={size}
    staleInputs={companions.staleKeys.length > 0}
    notice={navigation.navigationNotice}
    choice={navigation.visitChoice}
    onChoose={navigation.applyDrill}
    onDismiss={navigation.clearTransient}
  /></>;
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
            presentation="visits"
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
            presentation={autoView.name === "Metrics" ? "metrics" : "generic"}
            scopeLabel={isInSubflow ? `Invocation ${activeTraceScope.invocationPath.join(" / ")}` : "Root flow"}
            unstyled={plain}
            size={size}
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
      activeTraceScope.invocationPath,
      isInSubflow,
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
    return {
      // ONE mapping from mode → palette, shared with the standalone
      // components' `theme="light"` prop (theme/mode.ts).
      ...themeModeVars(consumerTheme?.mode ?? traceTheme?.mode),
      ...tokensToCSSVars(consumerTheme?.tokens ?? {}),
      ...(traceTheme?.visited !== undefined && { ["--fp-node-visited" as string]: traceTheme.visited }),
      ...(traceTheme?.current !== undefined && { ["--fp-node-cursor" as string]: traceTheme.current }),
    } as React.CSSProperties;
  }, [traceTheme, consumerTheme]);
  // asChild applies declarations on this same root. Keep the legacy explicit
  // node overrides in that layer too, so moving from an inherited provider
  // never reverses the documented tokens → explicit-node-colors precedence.
  const providerTokens = useMemo(() => ({
    ...consumerTheme?.tokens,
    colors: {
      ...consumerTheme?.tokens?.colors,
      ...(traceTheme?.visited !== undefined && { nodeVisited: traceTheme.visited }),
      ...(traceTheme?.current !== undefined && { nodeCursor: traceTheme.current }),
    },
  }), [consumerTheme?.tokens, traceTheme?.visited, traceTheme?.current]);
  const withTheme = (content: React.ReactElement) => <FootprintTheme asChild tokens={providerTokens} components={consumerTheme?.components}>{content}</FootprintTheme>;

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

  const inspectorSurface = <InspectorPanel snapshots={activeSnapshots} selectedIndex={safeIdx}
    dataTraceFrames={shellDataTrace.frames}
    dataTraceNote={shellDataTrace.readsAvailable ? undefined : "Reads were not recorded; dependencies remain unknown."}
    selectedStageId={activeSnapshots[safeIdx]?.runtimeStageId} onNavigateToStage={navigateToStage}
    tab={inspectorTab} onTabChange={handleInspectorTabChange} traceContent={traceTabContent}
    activity={stageActivity} activitySelected={activitySelected} onActivitySelect={handleActivitySelect}
    selectedActivityVariableId={selectedActivityVariableId} onActivityVariableSelect={handleActivityVariableSelect}
    onTraceActivityVariable={handleTraceActivityVariable} size={size} unstyled={unstyled} />;
  const chartSurface = <TraceDependencyView unstyled={unstyled} walk={traceSession.traceWalk} hasWorkflow={showExecutionChart}
    cursorRuntimeStageId={activeSnapshots[safeIdx]?.runtimeStageId ?? null} snapshots={activeSnapshots}
    onJumpToStop={traceSession.navigateToStage} onFollowIngredient={traceSession.handleFollowIngredient}
    onFollowHandoff={traceSession.handleFollowHandoff}
    questionTrail={traceSession.questionTrail} onReturnToQuestion={traceSession.handleReturnToQuestion}
    activityOrigin={traceSession.activityOrigin ?? undefined}>
    {showExecutionChart ? <MountedChart render={() => effectiveRenderFlowchart!({ spec: null, snapshots: activeSnapshots, selectedIndex: safeIdx,
      onNodeClick: handleNodeClick, showStageId, currentSubflowId: chartDrillKey,
      onSubflowChange: handleChartSubflowChange, traceWorkflow, renderer: flowchartRenderer, unstyled, ...(sliceCone && { sliceCone }) })} /> : null}
  </TraceDependencyView>;
  const commentarySurface = <CommentaryPanel title="What happened" presentation="log" groupByStage followCursor showEntryTypes={false}
    {...commentary} size={size} unstyled={unstyled} />;
  const runDataSurface = <InsightPanel mode="tabs" expandedId={activeTab} size={size} unstyled={unstyled}
    insights={allTabs.filter(tab => tab.id !== "result" && tab.id !== "memory").map(tab => ({
      id: tab.id, name: insightName(tab.name), render: () => renderTabBody(tab.id, unstyled),
    }))} />;
  const resultSurface = allTabs.some(tab => tab.id === "result") ? renderTabBody("result", unstyled) : null;
  const developerSurface = unstyled ? <>{inspectorSurface}{runDataSurface}{resultSurface}</> : <RightPanel mode={rightPanelMode} onModeChange={setRightPanelMode}
    dataTrace={shellDataTrace} onInspectorTabChange={handleInspectorTabChange} inspectorTab={inspectorTab}
    traceContent={traceTabContent} snapshots={activeSnapshots} selectedIndex={safeIdx}
    activity={stageActivity} activitySelected={activitySelected} onActivitySelect={handleActivitySelect}
    selectedActivityVariableId={selectedActivityVariableId} onActivityVariableSelect={handleActivityVariableSelect}
    onTraceActivityVariable={handleTraceActivityVariable}
    activeTab={activeTab} allTabs={allTabs} renderTabBody={renderTabBody} size={size}
    onNavigateToStage={navigateToStage} />;
  const detailsSurface = <LensDetailsPanel view={view} onViewChange={changeDetailsView} size={size} unstyled={unstyled}
    commentary={commentarySurface} developer={developerSurface} />;
  const workbench: LensWorkbenchContextValue = {
    snapshots: activeSnapshots, selectedIndex: safeIdx, selectedSnapshot: activeSnapshots[safeIdx],
    invocationPath: activeTraceScope.invocationPath, activity: stageActivity,
    selectedActivityVariableId: selectedActivityVariableId ?? stageActivity.writes[0]?.id ?? stageActivity.reads[0]?.id,
    narrativeEntries: activeNarrativeEntries ?? [],
    narrativeAvailable: !companionNarrativeMissing && !navigation.sourceChanged,
    narrativeScopeSubflowId, traceWalk: traceSession.traceWalk,
    questionTrail: traceSession.questionTrail, activityOrigin: traceSession.activityOrigin,
    actions: {
      selectIndex: handleSnapshotChange, selectStage: navigateToStage, drillDown: handleDrillDown,
      returnToRoot: () => handleBreadcrumbNavigate(0), backtrack: handleTraceActivityVariable,
      exitBacktrack: traceSession.handleExitTracing,
      followIngredient: traceSession.handleFollowIngredient,
      followHandoff: traceSession.handleFollowHandoff,
      returnToQuestion: traceSession.handleReturnToQuestion,
      showAllIngredients: traceSession.handleShowAllIngredients,
      selectActivityVariable: handleActivityVariableSelect,
    },
    surfaces: {
      timeTravel: <TimeTravelRail snapshots={activeSnapshots} selectedIndex={safeIdx} onIndexChange={handleSnapshotChange}
        size={size} unstyled={unstyled} tracing={tracingRail} autoPlay={railAutoPlay} autoPlayKey={autoPlayRun} offered={offeredRun} replayControls={effectiveReplayControls} />,
      navigation: navigationStatus,
      breadcrumb: isInSubflow ? <SubflowBreadcrumb breadcrumbs={breadcrumbs} onNavigate={handleBreadcrumbNavigate} unstyled={unstyled} /> : null,
      chart: chartSurface,
      commentary: commentarySurface,
      topology: <SubflowTree graph={traceGraph ?? { nodes: [], edges: [] }} activeStage={rootOverlay.activeStage}
        doneStages={rootOverlay.doneStages} onNodeSelect={handleTreeNodeSelect} unstyled={unstyled} />,
      inspector: inspectorSurface,
      developer: developerSurface,
      details: detailsSurface,
      runData: runDataSurface,
      result: resultSurface,
      timeline: <GanttTimeline snapshots={activeSnapshots} selectedIndex={safeIdx} onSelect={handleSnapshotChange} size={size} unstyled={unstyled} />,
      compactTimeline: <CompactTimeline snapshots={activeSnapshots} selectedIndex={safeIdx} defaultExpanded={timelineExpanded} label={bottomLabel} size={size} unstyled={unstyled} />,
    },
  };
  const withWorkbench = (content: React.ReactElement) => <LensWorkbenchContext.Provider value={workbench}>{withTheme(content)}</LensWorkbenchContext.Provider>;

  if (renderLayout && snapshots.length > 0) {
    return withWorkbench(<div ref={unstyled ? setUnstyledShellElement : setShellElement}
      data-fp="explainable-shell" data-layout="custom" onKeyDown={handleShellKeyDown}
      className={className} style={{ ...shellThemeVars, ...style }}>{renderLayout(workbench)}</div>);
  }

  if (resolvedLayout && snapshots.length > 0) {
    return withWorkbench(<LensGridLayout layout={resolvedLayout}
      containerRef={unstyled ? setUnstyledShellElement : setShellElement} onKeyDown={handleShellKeyDown}
      className={className} style={style} themeStyle={shellThemeVars} isNarrow={isNarrow}
      size={size} unstyled={unstyled} surfaces={{
        timeTravel: workbench.surfaces.timeTravel,
        flowchart: <div style={unstyled ? undefined : { display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
          {navigationStatus}{workbench.surfaces.breadcrumb}
          <div style={unstyled ? undefined : { flex: 1, minHeight: 0, overflow: "hidden" }}>{showExecutionChart || traceSession.traceWalk ? chartSurface : <MissingChartNote unstyled={unstyled} />}</div>
        </div>,
        developer: developerSurface, commentary: commentarySurface,
        details: detailsSurface, timeline: workbench.surfaces.timeline,
      }} />);
  }

  // ── Unstyled mode ──
  if (unstyled) {
    if (snapshots.length === 0) return withTheme(renderEmptyState({}));
    return withWorkbench(<UnstyledShellLayout
      containerRef={setUnstyledShellElement} onKeyDown={handleShellKeyDown}
      tabs={unstyledTabs} activeTab={activeTab} onTabChange={handleTabChange}
      className={className} style={style}
    >
          {isExplainableTab(activeTab) ? (
            <>
              <TimeTravelRail snapshots={activeSnapshots} selectedIndex={safeIdx} onIndexChange={handleSnapshotChange} unstyled tracing={tracingRail} autoPlay={railAutoPlay} autoPlayKey={autoPlayRun} offered={offeredRun} replayControls={effectiveReplayControls} />
              {navigationStatus}
              {isInSubflow && <SubflowBreadcrumb breadcrumbs={breadcrumbs} onNavigate={handleBreadcrumbNavigate} unstyled={unstyled} />}
              {chartSurface}
              {missingChart && <MissingChartNote unstyled />}
              <LensDetailsPanel view={view} onViewChange={changeDetailsView} size={size} unstyled
                commentary={commentarySurface} developer={<>
              <StageActivityPanel activity={stageActivity} onTraceVariable={handleTraceActivityVariable}
                selectedVariableId={selectedActivityVariableId} onVariableSelect={handleActivityVariableSelect}
                onNavigateToStage={navigateToStage} size={size} unstyled />
              {traceSession.tracing && traceTabContent}
              <MemoryPanel snapshots={activeSnapshots} selectedIndex={safeIdx} unstyled />
              {companionNarrativeMissing ? <StoryUnavailableNote /> : <NarrativePanel snapshots={activeSnapshots} selectedIndex={safeIdx} narrativeEntries={activeNarrativeEntries} scopeSubflowId={narrativeScopeSubflowId} presentation="visits" unstyled />}
                </>} />
              <GanttTimeline snapshots={activeSnapshots} selectedIndex={safeIdx} onSelect={handleSnapshotChange} unstyled />
            </>
          ) : (
            <LensDetailsPanel view={view} onViewChange={changeDetailsView} size={size} unstyled
              commentary={commentarySurface} developer={renderTabBody(activeTab, true)} />
          )}
    </UnstyledShellLayout>);
  }

  // ── Styled mode ──

  // Show topology when there's a renderer AND a graph to draw. The recorder/
  // traceGraph renderer draws from `traceGraph` and self-drills, so it does NOT
  // need a spec — gating on `activeSpec` alone hid the chart whenever a subflow
  // was drilled via the runtime path (`resolveSubflowFromRuntime` returns
  // spec: null), while the slider/story/breadcrumb kept working. See
  // test/component/ExplainableShellDrill.test.tsx.
  const showTopology = !!traceSession.traceWalk || showExecutionChart;

  // Keep the narrow layout's existing recorder tabs and give its developer
  // Inspector the same selected visit and trace controller as desktop.
  let mobileInspectorId = "__fp_stage_inspector";
  while (allTabs.some(tab => tab.id === mobileInspectorId)) mobileInspectorId += "_";
  const mobileTabs = [{ id: mobileInspectorId, name: "Inspector", description: "Recorded stage activity, state and data trace" }, ...allTabs];
  const detailsPanel = <ShellDetailTabs tabs={mobileTabs} activeTab={mobileInspectorSelected ? mobileInspectorId : activeTab}
    onTabChange={tab => {
      if (tab === mobileInspectorId) { setMobileInspectorSelected(true); return; }
      setMobileInspectorSelected(false);
      setActiveTab(tab);
    }}>
    {mobileInspectorSelected ? <InspectorPanel snapshots={activeSnapshots} selectedIndex={safeIdx}
      dataTraceFrames={shellDataTrace.frames}
      dataTraceNote={shellDataTrace.readsAvailable ? undefined : "Reads were not recorded; dependencies remain unknown."}
      selectedStageId={activeSnapshots[safeIdx]?.runtimeStageId} onNavigateToStage={navigateToStage}
      tab={inspectorTab} onTabChange={handleInspectorTabChange} traceContent={traceTabContent}
      activity={stageActivity} activitySelected={activitySelected} onActivitySelect={handleActivitySelect}
      selectedActivityVariableId={selectedActivityVariableId} onActivityVariableSelect={handleActivityVariableSelect}
      onTraceActivityVariable={handleTraceActivityVariable} size={size} /> : renderTabBody(activeTab, false)}
  </ShellDetailTabs>;

  // Safe to hand back the diagnosis instead of chrome wrapped around nothing
  // (every hook ran above the unstyled return already).
  if (snapshots.length === 0) return withTheme(renderEmptyState(shellThemeVars));

  return withWorkbench(<ShellLayout
    containerRef={setShellElement} onKeyDown={handleShellKeyDown} className={className} style={style}
    themeStyle={shellThemeVars} isNarrow={isNarrow} stageCount={activeSnapshots.length}
    showTopology={showTopology} showTreeSidebar={showTreeSidebar && !traceSession.traceWalk}
    topology={{ label: leftLabel, expanded: leftExpanded, onChange: toggleLeft }}
    details={{ label: rightLabel, expanded: rightExpanded, onChange: toggleRight }}
    timeline={{ label: bottomLabel, expanded: timelineExpanded, onChange: toggleTimeline }}
    slots={{
      rail: <TimeTravelRail snapshots={activeSnapshots} selectedIndex={safeIdx} onIndexChange={handleSnapshotChange}
        size={size} tracing={tracingRail} autoPlay={railAutoPlay} autoPlayKey={autoPlayRun} offered={offeredRun} replayControls={effectiveReplayControls} />,
      navigation: navigationStatus,
      breadcrumb: isInSubflow && <SubflowBreadcrumb breadcrumbs={breadcrumbs} onNavigate={handleBreadcrumbNavigate} unstyled={unstyled} />,
      chart: chartSurface,
      missingChart: missingChart && <MissingChartNote />,
      tree: <SubflowTree graph={traceGraph ?? { nodes: [], edges: [] }} activeStage={rootOverlay.activeStage}
        doneStages={rootOverlay.doneStages} onNodeSelect={handleTreeNodeSelect} unstyled={unstyled} />,
      mobileDetails: <LensDetailsPanel view={view} onViewChange={changeDetailsView} size={size}
        commentary={commentarySurface} developer={detailsPanel} />,
      desktopDetails: detailsSurface,
      gantt: <GanttTimeline snapshots={activeSnapshots} selectedIndex={safeIdx} onSelect={handleSnapshotChange} size={size} />,
      compactTimeline: <CompactTimeline snapshots={activeSnapshots} selectedIndex={safeIdx}
        defaultExpanded={timelineExpanded} label={bottomLabel} size={size} unstyled={unstyled} />,
    }}
  />);
}
