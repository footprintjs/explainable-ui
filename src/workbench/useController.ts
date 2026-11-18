import { useCallback, useMemo, useRef, useState } from 'react';
import { useRecording } from './internal/useRecording';
import { useSubflowNavigation } from './internal/useSubflowNavigation';
import { useTraceSessionState, useTraceSessionController, type ActivityTraceOrigin } from './internal/useTraceSession';
import { useLiveSourceCursor } from './internal/useLiveSourceCursor';
import { useSubflowPrefetch } from './internal/useSubflowPrefetch';
import { useTimeTravelPlayback } from '../replay/useTimeTravelPlayback';
import { resolveReplayControlsOptions } from '../model/replayControlsOptions';
import { prefersReducedMotion } from '../replay/prefersReducedMotion';
import { resolveProgressiveRenderingOptions } from '../progressiveRendering';
import { runHasRecordedReads, sourceRunKey, rootMountLabels, type TraceScope } from '../trace/traceScope';
import { ownDataField } from '../trace/safeRecordRead';
import { projectStageActivity, type StageActivityTraceTarget } from '../trace/stageActivity';
import { overlayFromSnapshot } from '../adapters/overlayFromSnapshot';
import { projectReplayAxis } from '../replay/replayAxis';
import { prepareTraceWorkflowOverlay } from '../trace/traceWorkflowOverlay';
import type { LensController, LensControllerActions, LensControllerOptions, LensPresentationRequest, LensRecordingStatus } from './types';

/** React state owner. There are no rendered surfaces, layout, theme or DOM effects here. */
export function useCreateController(input: LensControllerOptions) {
  const replayControls = useMemo(() => resolveReplayControlsOptions(undefined, input.replayControls), [input.replayControls]);
  const options = { ...input, replayControls };
  const recording = useRecording(options);
  const { source } = options;
  const { sourceState, originalSnapshot, runtimeSnapshot, narrativeEntries, exactResults,
    snapshots, runtimeOverlay, traceGraph, companionNarrativeMissing } = recording;
  const [snapshotIdx, setSnapshotIdxRaw] = useState(0);
  const session = useTraceSessionState(snapshotIdx);
  const sourceRunId = source ?? sourceRunKey(originalSnapshot);
  const activitySource = useRef({ source: sourceRunId, token: {} });
  if (activitySource.current.source !== sourceRunId) activitySource.current = { source: sourceRunId, token: {} };
  const readsAvailable = useMemo(() => runHasRecordedReads(runtimeSnapshot,
    snapshots.flatMap(stage => stage.subflowResult ? [stage.subflowResult] : [])), [runtimeSnapshot, snapshots]);
  const nestedReadTracking = ownDataField(runtimeSnapshot, 'nestedReadTracking') === true;
  const navigation = useSubflowNavigation({ source, sourceState, snapshots, sourceRunId, readsAvailable,
    nestedReadTracking, exactResults, narrativeEntries, traceGraph, snapshotIdx, setSnapshotIdxRaw,
    onScopeReset: session.reset });
  const { selectedStack, setSnapshotIdx } = navigation;
  const currentLevel = useMemo(() => selectedStack.at(-1) ?? {
    spec: null, snapshots, narrative: undefined, subflowId: undefined, traceScope: undefined,
  }, [selectedStack, snapshots]);
  const isInSubflow = selectedStack.length > 0;
  const activeTraceScope = useMemo<TraceScope>(() => {
    if (currentLevel.traceScope) return currentLevel.traceScope;
    const metadata = rootMountLabels(runtimeSnapshot?.executionTree, runtimeSnapshot?.commitLog);
    return { invocationPath: [], commitLog: metadata.availability.ok ? runtimeSnapshot?.commitLog ?? [] : [],
      executionTree: metadata.availability.ok ? runtimeSnapshot?.executionTree : undefined,
      availability: metadata.availability, readsAvailable: readsAvailable && metadata.hasTree,
      ...(nestedReadTracking ? { nestedReadTracking: true as const } : {}), mountLabels: metadata.labels };
  }, [currentLevel.traceScope, runtimeSnapshot, readsAvailable, nestedReadTracking]);
  const activeTraceKey = isInSubflow ? JSON.stringify(activeTraceScope.invocationPath) : null;
  const activeSnapshots = currentLevel.snapshots;
  const safeIdx = useLiveSourceCursor(source, activeTraceKey, activeSnapshots, snapshotIdx, setSnapshotIdxRaw);
  const activeNarrativeEntries = isInSubflow ? currentLevel.narrative : narrativeEntries;
  const stageActivity = useMemo(() => projectStageActivity({ scope: activeTraceScope,
    snapshots: activeSnapshots, selectedIndex: safeIdx, narrativeEntries: activeNarrativeEntries,
    narrativeAvailable: !companionNarrativeMissing }),
  [activeTraceScope, activeSnapshots, safeIdx, activeNarrativeEntries, companionNarrativeMissing]);
  const activeGraph = useMemo(() => source ? source.getGraph(activeTraceScope.invocationPath) : traceGraph,
    [source, sourceState, traceGraph, activeTraceScope]);
  const activeRuntimeOverlay = useMemo(() => source && currentLevel.traceScope
    ? overlayFromSnapshot({ commitLog: currentLevel.traceScope.commitLog, executionTree: currentLevel.traceScope.executionTree })
    : runtimeOverlay, [source, currentLevel.traceScope, runtimeOverlay]);
  const renderingOptions = useMemo(() => resolveProgressiveRenderingOptions(options.rendering), [options.rendering]);
  useSubflowPrefetch(source, renderingOptions, activeSnapshots, snapshotIdx, activeTraceScope.invocationPath);

  const [activityVariableSelection, setActivityVariableSelection] = useState<{
    identity: string; variableId: string; sourceToken: object;
  } | null>(null);
  const [request, setRequest] = useState<(LensPresentationRequest & { sourceToken: object }) | null>(null);
  const onStartInspector = useCallback(() => setRequest(previous => ({ id: (previous?.id ?? 0) + 1,
    kind: 'trace', sourceToken: activitySource.current.token })), []);
  const onReturnToActivity = useCallback((origin: ActivityTraceOrigin) => {
    setActivityVariableSelection({ identity: JSON.stringify([origin.invocationPath, origin.runtimeStageId,
      origin.beforeCommitIdx - (origin.kind === 'write' ? 1 : 0)]), variableId: origin.variableId,
    sourceToken: activitySource.current.token });
    setRequest(previous => ({ id: (previous?.id ?? 0) + 1, kind: 'activity', origin,
      sourceToken: activitySource.current.token }));
  }, []);
  const traceSession = useTraceSessionController({ session, activeTraceScope, activeTraceKey, activeSnapshots,
    safeIdx, sourceChanged: navigation.sourceChanged,
    traceHistoryAvailable: isInSubflow || !!runtimeSnapshot?.commitLog, showDataTraceCone: true,
    setSnapshotIdx, onStartInspector, onReturnToActivity, runtimeSnapshot, recordingIdentity: source,
    openTraceSource: navigation.openTraceSource, restoreTraceQuestion: navigation.restoreTraceQuestion, stageActivity });
  const traceCursorRuntimeStageId = activeSnapshots[safeIdx]?.runtimeStageId ?? null;
  const focusWorkflow = useMemo(() => prepareTraceWorkflowOverlay(traceSession.traceWalk, activeSnapshots, traceSession.inspectedStageRead),
    [traceSession.traceWalk, activeSnapshots, traceSession.inspectedStageRead]);
  const traceWorkflow = focusWorkflow?.(traceCursorRuntimeStageId) ?? null;
  const activityIdentity = JSON.stringify([stageActivity.identity.invocationPath,
    stageActivity.identity.runtimeStageId, stageActivity.identity.commitIdx]);
  const selectedActivityVariableId = !navigation.sourceChanged && activityVariableSelection?.sourceToken === activitySource.current.token
    && activityVariableSelection.identity === activityIdentity ? activityVariableSelection.variableId : undefined;
  const latestActivity = useRef({ view: stageActivity, identity: activityIdentity,
    sourceToken: activitySource.current.token, sourceChanged: navigation.sourceChanged, trace: traceSession.handleTraceStageVariable });
  latestActivity.current = { view: stageActivity, identity: activityIdentity,
    sourceToken: activitySource.current.token, sourceChanged: navigation.sourceChanged, trace: traceSession.handleTraceStageVariable };
  const selectActivityVariable = useCallback((variableId: string) => {
    const current = latestActivity.current;
    if (current.sourceChanged || !current.view.availability.ok
      || ![...current.view.reads, ...current.view.writes].some(variable => variable.id === variableId)) return;
    setActivityVariableSelection({ identity: current.identity, variableId, sourceToken: current.sourceToken });
  }, []);
  const backtrack = useCallback((target: StageActivityTraceTarget) => {
    const current = latestActivity.current;
    if (current.sourceChanged || !current.view.availability.ok
      || ![...current.view.reads, ...current.view.writes].some(variable => variable.traceTarget === target)) return;
    current.trace(target);
  }, []);
  const narrativeScopeSubflowId = useMemo(() => {
    if (!isInSubflow) return undefined;
    const key = currentLevel.subflowId, entries = currentLevel.narrative ?? [];
    if (key !== undefined && entries.some(entry => entry.subflowId === key)) return key;
    let shallowest: string | undefined;
    for (const entry of entries) if (entry.subflowId !== undefined
      && (shallowest === undefined || entry.subflowId.length < shallowest.length)) shallowest = entry.subflowId;
    return shallowest ?? key;
  }, [isInSubflow, currentLevel]);

  // The offer and clock outlive any mounted transport/presenter.
  if (options.autoPlay && options.replayControls?.playPause !== false && snapshots.length >= 2
    && navigation.sourceChanged && navigation.isDrilled && !prefersReducedMotion()) navigation.resetRoot();
  const offered = useRef<unknown>(undefined);
  const playback = useTimeTravelPlayback({ snapshots: activeSnapshots, selectedIndex: safeIdx,
    onIndexChange: setSnapshotIdx, tracing: traceSession.tracingRail, autoPlay: options.autoPlay && !isInSubflow,
    autoPlayKey: sourceRunId ?? snapshots, replayControls: options.replayControls, offered, offerReady: snapshots.length > 0 });
  const scopeToken = useMemo(() => ({}), [sourceRunId, activeTraceKey]);
  const context = { scopeToken, sourceChanged: navigation.sourceChanged, playback, navigation, traceSession,
    activeSnapshots, activeTraceScope, generation: session.generation, backtrack, selectActivityVariable };
  const latest = useRef(context);
  latest.current = context;
  const actions = useMemo<LensControllerActions>(() => {
    const guard = <A extends unknown[]>(fn: (current: typeof context, ...args: A) => void, traceOnly = false) => (...args: A) => {
      const current = latest.current;
      if (current.scopeToken !== scopeToken || current.sourceChanged || (traceOnly && current.generation !== session.generation)) return;
      fn(current, ...args);
    };
    const move = <A extends unknown[]>(fn: (current: typeof context, ...args: A) => void, traceOnly = false) => guard((current, ...args: A) => {
      current.playback.stopPlaying(); fn(current, ...args);
    }, traceOnly);
    return {
      selectIndex: move((current, index) => {
        if (Number.isSafeInteger(index) && index >= 0 && index < current.activeSnapshots.length) current.navigation.setSnapshotIdx(index);
      }),
      selectStage: move((current, id) => current.traceSession.navigateToStage(id)),
      drillDown: move((current, id) => current.navigation.handleDrillDown(id)),
      returnToRoot: move(current => current.navigation.handleBreadcrumbNavigate(0)),
      chooseInvocation: move((current, runtimeStageId) => {
        const choice = current.navigation.visitChoice;
        if (!choice?.visits.some(visit => visit.runtimeStageId === runtimeStageId)) return;
        current.navigation.applyDrill(choice.mountKey, new Map([...choice.selectedInvocations, [choice.choiceKey, runtimeStageId]]));
      }),
      backtrack: move((current, target) => current.backtrack(target)),
      exitBacktrack: move(current => current.traceSession.handleExitTracing(), true),
      followIngredient: move((current, ingredient) => current.traceSession.handleFollowIngredient(ingredient), true),
      followHandoff: move((current, handoff) => current.traceSession.handleFollowHandoff(handoff), true),
      returnToQuestion: move((current, index) => current.traceSession.handleReturnToQuestion(index), true),
      showAllIngredients: move(current => current.traceSession.handleShowAllIngredients(), true),
      openForkChooser: guard(current => current.traceSession.handleForkPrompt(), true),
      continueTimeOrder: move(current => current.traceSession.handleContinueTimeOrder(), true),
      setTraceSearch: guard((current, value) => current.traceSession.setTraceSearch(value), true),
      selectActivityVariable: guard((current, id) => current.selectActivityVariable(id)),
      previous: guard(current => current.playback.goPrev()), next: guard(current => current.playback.goNext()),
      pause: guard(current => current.playback.stopPlaying()), play: guard(current => current.playback.play()),
      togglePlay: guard(current => current.playback.togglePlay()), scrubTo: guard((current, index) => current.playback.selectIndex(index)),
      cancelPending: guard(current => current.navigation.clearTransient()),
      retryPending: guard(current => current.navigation.pendingLoad?.retry()),
      loadEvidence: guard((current, mountRuntimeStageId) => {
        const mount = current.activeSnapshots.find(stage => stage.runtimeStageId === mountRuntimeStageId && stage.subflowId);
        if (mount?.subflowId && current.activeTraceScope.mountLabels.has(mountRuntimeStageId)) current.navigation.loadEvidence({
          invocationPath: [...current.activeTraceScope.invocationPath, mountRuntimeStageId], mountRuntimeStageId, subflowId: mount.subflowId,
        });
      }),
    };
  }, [scopeToken, session.generation]);
  const tracingRail = useMemo(() => traceSession.tracingRail ? { ...traceSession.tracingRail,
    onExit: actions.exitBacktrack,
    onShowAll: traceSession.tracingRail.onShowAll ? actions.showAllIngredients : undefined,
    onForkPrompt: traceSession.tracingRail.onForkPrompt ? actions.openForkChooser : undefined,
  } : null, [traceSession.tracingRail, actions]);
  const presentationRequest = useMemo(() => request?.sourceToken === activitySource.current.token
    ? { id: request.id, kind: request.kind, ...(request.origin ? { origin: request.origin } : {}) } : null,
  [request, activitySource.current.token]);
  const recordingStatus = useMemo<LensRecordingStatus>(() => {
    if (snapshots.length) return { status: 'ready' };
    if (recording.derivedFromRuntime?.error) return { status: 'error', reason: 'unreadable' };
    if (source) return runtimeSnapshot?.commitLog.length
      ? { status: 'error', reason: 'identity-unavailable' } : { status: 'waiting', reason: 'no-stages' };
    return runtimeSnapshot || options.snapshots ? { status: 'empty', reason: 'no-stages' }
      : { status: 'waiting', reason: 'no-recording' };
  }, [snapshots.length, recording.derivedFromRuntime?.error, source, runtimeSnapshot, options.snapshots]);
  const value: LensController = {
    replayAxis: projectReplayAxis(activeSnapshots, replayControls.scale),
    recordingStatus, resultData: recording.resultData,
    snapshots: activeSnapshots, selectedIndex: safeIdx, selectedSnapshot: activeSnapshots[safeIdx],
    invocationPath: activeTraceScope.invocationPath, activity: stageActivity,
    selectedActivityVariableId: selectedActivityVariableId ?? stageActivity.writes[0]?.id ?? stageActivity.reads[0]?.id,
    narrativeEntries: activeNarrativeEntries ?? [], narrativeAvailable: !companionNarrativeMissing && !navigation.sourceChanged,
    narrativeScopeSubflowId, traceWalk: traceSession.traceWalk, forkChooserOpen: traceSession.forkChooserOpen, traceSearch: traceSession.traceSearch, questionTrail: traceSession.questionTrail,
    activityOrigin: traceSession.activityOrigin, graph: activeGraph, overlay: activeRuntimeOverlay, traceWorkflow,
    tracingRail, pendingLoad: navigation.pendingLoad ? { request: navigation.pendingLoad.request, status: navigation.pendingLoad.status } : null, visitChoice: navigation.visitChoice ? { mountStageId: navigation.visitChoice.mountKey, visits: navigation.visitChoice.visits } : null, navigationNotice: navigation.navigationNotice,
    presentationRequest,
    playback: { playing: playback.playing, canPlay: playback.canPlay, canPrevious: playback.canPrev, canNext: playback.canNext }, actions,
  };
  return { value, options, recording, navigation, currentLevel, activeTraceScope, activeTraceKey, activeSnapshots, safeIdx,
    activeNarrativeEntries, narrativeScopeSubflowId, stageActivity, selectedActivityVariableId, traceSession,
    activeGraph, activeRuntimeOverlay, traceWorkflow, playback, offered, renderingOptions, sourceRunId, isInSubflow };
}
export type LensControllerOwner = ReturnType<typeof useCreateController>;
