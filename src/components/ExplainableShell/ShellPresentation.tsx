import { LazySubflowStatus, LazyTraceEvidence } from "./_internal/LazySubflowStatus";
/**
 * Coordinates one selected run, cursor and subflow scope. Focused controllers
 * own tracing and playback; internal presentation components render the model
 * and navigation commands in styled or unstyled layouts.
 *
 * Consumer controls theme via --fp-* CSS custom properties.
 */
import { useState, useCallback, useMemo, useRef, useEffect, useLayoutEffect } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from "react";
import { themeModeVars, tokensToCSSVars, FootprintTheme } from "../../theme";
import { useContainerBreakpoints } from "../../_internal/useContainerBreakpoints";
import { RightPanel, type RightPanelMode } from "./_internal/RightPanel";
import { MissingChartNote } from "./_internal/ShellChrome";
import { ShellLayout, ShellDetailTabs, UnstyledShellLayout } from "./_internal/ShellLayout";
import { LensDetailsPanel } from "./_internal/LensDetailsPanel";
// The JSON arrangement composes these same mounted Lens surfaces.
import { LensGridLayout } from "./_internal/LensGridLayout";
import { resolveLensLayout } from "../../model/lensLayout";
import { resolveFlowchartOptions } from "../../model/flowchart";
import { TraceSessionPanel } from "./_internal/TraceSessionPanel";
import { TraceDependencyView } from "../DataTracePanel/TraceDependencyView";
import { SubflowNavigationStatus } from "./_internal/SubflowNavigationStatus";
import { StoryUnavailableNote } from "./_internal/TraceUnavailableNote";
import { StageActivityPanel } from "../StageActivityPanel";
import { InspectorPanel } from "../InspectorPanel/InspectorPanel";
import { LensWorkbenchContext, type LensWorkbenchContextValue, type LensView } from "./LensWorkbench";
import { CommentaryPanel } from "../ExplainableView/CommentaryPanel";
import { InsightPanel } from "../InsightPanel/InsightPanel";
import { insightName } from "../../model/recorderView";
import { devWarn } from "../FlowchartView/_internal/devWarn";
import { GanttTimeline } from "../GanttTimeline";
import { LensReplayControls } from "../TimeTravelControls";
import { useOptionalControllerOwner } from "../../workbench";
import { useDefaultFlowchart } from "./_internal/useDefaultFlowchart";
import { ShellEmptyState } from "./_internal/ShellEmptyState";
import { useShellRecorders } from "./_internal/useShellRecorders";
import { MemoryPanel } from "../MemoryPanel";
import { NarrativePanel } from "../NarrativePanel";
import { SubflowTree } from "../FlowchartView/SubflowTree";
import { SubflowBreadcrumb } from "../FlowchartView/SubflowBreadcrumb";

/** A supplied renderer runs only when its surface is actually mounted. */
function MountedChart({ render }: { render: () => ReactNode }) {
  return <>{render()}</>;
}

import { CompactTimeline } from "../CompactTimeline/CompactTimeline";
import type { ExplainableShellProps, ShellTab } from "./ShellProps";
const EXPLAINABLE_TAB_ID = "explainable";
function isExplainableTab(tabId: string): boolean {
  return tabId === EXPLAINABLE_TAB_ID || tabId === "ai-compatible";
}

export function ShellPresentation(props: ExplainableShellProps) {
  const model = useOptionalControllerOwner()!;

  const {
  title,
  logs = [],
  tabs: deprecatedTabs,
  defaultTab,
  hideConsole = false,
  hideTabs: hideTabsProp,
  panelLabels,
  defaultExpanded,
  recorderViews,
  renderFlowchart,
  diagramGeometry, diagramDrawings, diagramAppearance, diagramAppearanceAt,
  flowchart,
  theme: consumerTheme,
  renderLayout,
  layout,
  view: controlledView,
  defaultView = "developer",
  onViewChange,
  commentary,
  showStageId = false,
  traceTheme,
  size = "default",
  unstyled = false,
  className,
  style,
  } = props;
  const view = controlledView ?? defaultView;
  const changeDetailsView = onViewChange;
  const { source } = model.options;
  const snapshotsProp = model.options.snapshots;
  // A run recorded WITH footprintjs's narrative recorder carries its story
  // inside the snapshot, so a replayed recording tells the same story the
  // live run did — no executor left to call getNarrativeEntries() on. The
  // A paired prop takes precedence. Known unchanged companions from a
  // previous run are withheld; a current record-owned Story can replace them.
  const { sourceState, originalSnapshot, runtimeSnapshot, snapshotNarrative, companions, companionNarrativeMissing,
    narrativeEntries, exactResults, derivedFromRuntime, snapshots, resultData, runtimeOverlay, traceGraph } = model.recording;

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
  const resolvedLayout = useMemo(() => layout && !renderLayout && (source !== undefined || snapshots.length > 0)
    ? resolveLensLayout(layout).definition : undefined, [layout, renderLayout, source, snapshots.length]);
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
  const { allTabs, unstyledTabs, hasExplicitDefault, resolvedDefault, renderTabBody } = useShellRecorders({
    runtimeSnapshot, resultData, logs, hideConsole, recorderViews, defaultTab, size, unstyled,
    snapshotNarrativeId: snapshotNarrative?.id, hasNarrative: !!narrativeEntries?.length || companionNarrativeMissing,
    hideTabsProp, activeSnapshots: model.activeSnapshots, safeIdx: model.safeIdx,
    activeNarrativeEntries: model.activeNarrativeEntries, companionNarrativeMissing,
    narrativeScopeSubflowId: model.narrativeScopeSubflowId, invocationPath: model.activeTraceScope.invocationPath,
    isInSubflow: model.isInSubflow,
  });
  const [activeTab, setActiveTab] = useState<string>(resolvedDefault);
  const [rightExpanded, setRightExpanded] = useState(defaultExpanded?.details ?? true);
  const [rightPanelMode, setRightPanelMode] = useState<RightPanelMode>(
    !hasExplicitDefault || resolvedDefault === "memory" ? "what" : resolvedDefault === "result" ? "result" : "insights",
  );
  // Inspector's active tab, lifted so the chart can paint the dependency
  // CONE exactly while the Data Trace tab is open (Inspector mode).
  const [inspectorTab, setInspectorTab] = useState<"state" | "trace">("state");
  const [activitySelected, setActivitySelected] = useState(!hasExplicitDefault || resolvedDefault !== "memory");
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

  const { navigation, activeGraph, activeRuntimeOverlay, currentLevel, activeTraceScope, activeTraceKey,
    activeSnapshots, safeIdx, activeNarrativeEntries, narrativeScopeSubflowId, stageActivity,
    selectedActivityVariableId, traceSession, traceWorkflow, playback, offered, renderingOptions, isInSubflow } = model;
  const { selectedStack, setSnapshotIdx } = navigation;
  const priorUnstyled = useRef(unstyled);
  useEffect(() => {
    if (priorUnstyled.current === unstyled) return;
    priorUnstyled.current = unstyled;
    playback.stopPlaying();
  }, [unstyled, playback.stopPlaying]);
  const handleDrillDown = model.value.actions.drillDown;
  const handleBreadcrumbNavigate = useCallback((level: number) => {
    playback.stopPlaying(); navigation.handleBreadcrumbNavigate(level);
  }, [playback.stopPlaying, navigation.handleBreadcrumbNavigate]);
  const handleChartSubflowChange = useCallback((mount: string | null) => {
    playback.stopPlaying(); navigation.handleChartSubflowChange(mount);
  }, [playback.stopPlaying, navigation.handleChartSubflowChange]);
  const handleNodeClick = useCallback((id: number | string) => {
    playback.stopPlaying(); navigation.handleNodeClick(id);
  }, [playback.stopPlaying, navigation.handleNodeClick]);
  const effectiveReplayControls = model.options.replayControls;
  const tracedFlowRenderer = useDefaultFlowchart({ activeGraph, activeRuntimeOverlay, traceTheme, flowchartRenderer });
  const effectiveRenderFlowchart = renderFlowchart ?? tracedFlowRenderer;
  const showExecutionChart = !!effectiveRenderFlowchart && (!!renderFlowchart || !!traceGraph);
  const showDataTraceCone = !unstyled && (isNarrow ? mobileInspectorSelected : rightPanelMode === "what") && !activitySelected && inspectorTab === "trace";
  const { shellDataTrace, navigateToStage } = traceSession;
  const tracingRail = model.value.tracingRail;
  const sliceCone = traceSession.tracing || showDataTraceCone ? traceSession.sliceCone : undefined;
  const handleActivityVariableSelect = model.value.actions.selectActivityVariable;
  const handleTraceActivityVariable = model.value.actions.backtrack;
  // Presentation changes cancel navigation intent through a semantic command.
  const chrome = useMemo(() => [activeTab, rightPanelMode, inspectorTab, activitySelected, mobileInspectorSelected],
    [activeTab, rightPanelMode, inspectorTab, activitySelected, mobileInspectorSelected]);
  const priorChrome = useRef(chrome);
  useEffect(() => {
    if (priorChrome.current === chrome) return;
    priorChrome.current = chrome;
    navigation.clearTransient();
  }, [chrome, navigation.clearTransient]);
  const onStartInspector = useCallback(() => {
    activityFocusRequest.current = "trace";
    setRightPanelMode("what");
    setRightExpanded(true);
    setMobileInspectorSelected(true);
    setActivitySelected(false);
    setInspectorTab("trace");
  }, []);
  const onReturnToActivity = useCallback((_origin: unknown) => {
    activityFocusRequest.current = "activity";
    setRightPanelMode("what");
    setRightExpanded(true);
    setMobileInspectorSelected(true);
    setActivitySelected(true);
  }, []);
  const seenPresentationRequest = useRef<object | null>(null);
  useLayoutEffect(() => {
    const request = model.value.presentationRequest;
    if (!request || seenPresentationRequest.current === request) return;
    seenPresentationRequest.current = request;
    if (request.kind === "trace") onStartInspector();
    else if (request.origin) onReturnToActivity(request.origin);
  }, [model.value.presentationRequest, onStartInspector, onReturnToActivity]);
  activityExitRef.current = traceSession.activityOrigin ? model.value.actions.exitBacktrack : null;
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
    if (tab === activeTab) return;
    playback.stopPlaying();
    setActiveTab(tab);
    navigation.resetRoot();
  }, [activeTab, navigation.resetRoot, playback.stopPlaying]);

  const handleSnapshotChange = model.value.actions.selectIndex;

  // ── The ONE drill ───────────────────────────────────────────────────
  // `drillDownStack` is the shell's single source of truth for "where are
  // we?", and its top entry's `subflowId` (a mount NODE id) is handed to the
  // chart as its CONTROLLED scope. The chart no longer keeps a private drill
  // state, so a drill started from the Topology tree, the breadcrumb or a
  // chart card can no longer disagree with the chart on screen.
  const chartDrillKey = selectedStack.at(-1)?.subflowId ?? null;
  const handleTreeNodeSelect = useCallback(
    (name: string, isSubflow: boolean, nodeId?: string) => {
      playback.stopPlaying();
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
    [snapshots, handleDrillDown, navigation.resetRoot, setSnapshotIdx, playback.stopPlaying]
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

  const renderEmptyState = (themeVars: React.CSSProperties) => <ShellEmptyState recordingStatus={model.value.recordingStatus}
    error={derivedFromRuntime?.error} indicator={renderingOptions.loadingIndicator}
    themeVars={themeVars} size={size} unstyled={unstyled} className={className} style={style} />;

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
      onSubflowChange: handleChartSubflowChange, traceWorkflow, renderer: flowchartRenderer, unstyled,
      diagramGeometry, diagramDrawings,
      diagramAppearance: diagramAppearanceAt
        ? diagramAppearanceAt({ selectedIndex: safeIdx, selectedSnapshot: activeSnapshots[safeIdx], invocationPath: activeTraceScope.invocationPath })
        : diagramAppearance, ...(sliceCone && { sliceCone }) })} /> : null}
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
    actions: model.value.actions,
    surfaces: {
      timeTravel: <LensReplayControls size={size} unstyled={unstyled} />,
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
              <LensReplayControls unstyled />
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
      rail: <LensReplayControls size={size} />,
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
