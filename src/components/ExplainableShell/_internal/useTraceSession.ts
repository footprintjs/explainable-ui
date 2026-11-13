import { useCallback, useEffect, useMemo, useReducer } from "react";
import type { StageSnapshot } from "../../../types";
import type { TracingRail } from "../../TimeTravelControls/TimeTravelControls";
import { buildDataTrace, type DataTraceResult } from "./dataTrace";
import type { TraceScope } from "./traceScope";
import { buildTraceWalk, type TraceIngredient, type TraceWalk } from "./traceWalk";

interface TraceAnchor {
  key: string;
  beforeCommitIdx?: number;
}

interface TraceQuestion extends TraceAnchor {
  scope: string | null;
  via: TraceAnchor[];
}

interface TraceSessionState {
  tracing: TraceQuestion | null;
  forkChooserOpen: boolean;
  traceSearch: string;
}

type TraceSessionAction =
  | { type: "reset" }
  | { type: "start"; question: TraceQuestion }
  | { type: "follow"; anchor: TraceAnchor }
  | { type: "show-all" }
  | { type: "exit" }
  | { type: "open-chooser" }
  | { type: "close-chooser" }
  | { type: "search"; value: string };

const emptySession: TraceSessionState = {
  tracing: null,
  forkChooserOpen: false,
  traceSearch: "",
};

function traceSessionReducer(state: TraceSessionState, action: TraceSessionAction): TraceSessionState {
  switch (action.type) {
    case "reset": return emptySession;
    case "start": return { tracing: action.question, forkChooserOpen: false, traceSearch: "" };
    case "follow": return state.tracing ? {
      ...state,
      tracing: { ...state.tracing, via: [...state.tracing.via, action.anchor] },
      forkChooserOpen: false,
    } : state;
    case "show-all": return state.tracing ? {
      ...state,
      tracing: { ...state.tracing, via: [] },
      forkChooserOpen: false,
    } : state;
    case "exit": return { ...state, tracing: null, forkChooserOpen: false };
    case "open-chooser": return state.forkChooserOpen ? state : { ...state, forkChooserOpen: true };
    case "close-chooser": return state.forkChooserOpen ? { ...state, forkChooserOpen: false } : state;
    case "search": return { ...state, traceSearch: action.value };
  }
}

/**
 * Own the question and transient tracing UI before navigation resolves a scope.
 * The reset command is stable, so navigation can clear this session without
 * a callback ref or a dependency on the later trace projection.
 */
export function useTraceSessionState(snapshotIdx: number) {
  const [state, dispatch] = useReducer(traceSessionReducer, emptySession);
  const reset = useCallback(() => dispatch({ type: "reset" }), []);
  const setTraceSearch = useCallback((value: string) => dispatch({ type: "search", value }), []);

  // The chooser asked about the old stop. Cursor movement closes it while
  // retaining the frozen question and its ingredient path.
  useEffect(() => { dispatch({ type: "close-chooser" }); }, [snapshotIdx]);

  return { ...state, dispatch, reset, setTraceSearch };
}

interface TraceSessionControllerOptions {
  session: ReturnType<typeof useTraceSessionState>;
  activeTraceScope: TraceScope;
  activeTraceKey: string | null;
  activeSnapshots: StageSnapshot[];
  safeIdx: number;
  sourceChanged: boolean;
  /** Whether the selected record supplied history, even when the log is empty. */
  traceHistoryAvailable: boolean;
  /** Presentation decides when the stage-anchored Inspector cone is visible. */
  showDataTraceCone: boolean;
  setSnapshotIdx: (index: number) => void;
  onStartInspector: () => void;
}

function dependencyCone(frames: readonly { runtimeStageId: string; depth: number }[]): ReadonlyMap<string, number> {
  const cone = new Map<string, number>();
  for (const frame of frames) {
    const stagePart = frame.runtimeStageId.split("#")[0];
    const previous = cone.get(stagePart);
    if (previous === undefined || frame.depth < previous) cone.set(stagePart, frame.depth);
  }
  return cone;
}

/** One trace session projects the card, the dependency cone and the existing cursor rail. */
export function useTraceSessionController({
  session,
  activeTraceScope,
  activeTraceKey,
  activeSnapshots,
  safeIdx,
  sourceChanged,
  traceHistoryAvailable,
  showDataTraceCone,
  setSnapshotIdx,
  onStartInspector,
}: TraceSessionControllerOptions) {
  const { tracing, forkChooserOpen, traceSearch, setTraceSearch, dispatch } = session;
  const shellDataTrace = useMemo<DataTraceResult>(() => {
    const trace = activeTraceScope.availability.ok && traceHistoryAvailable
      ? buildDataTrace(activeTraceScope.commitLog, activeTraceScope.executionTree, activeSnapshots[safeIdx]?.runtimeStageId ?? "")
      : { frames: [], readsAvailable: false };
    return { ...trace, readsAvailable: activeTraceScope.readsAvailable };
  }, [activeTraceScope, traceHistoryAvailable, activeSnapshots, safeIdx]);

  // Include every recorded written key in first-write order. A key that is
  // not written at the cursor still has an honest, traceable missing state.
  const allTracedKeys = useMemo(() => {
    const log = activeTraceScope.commitLog as Array<{ trace?: Array<{ path: string }> }>;
    const seen = new Set<string>();
    const keys: string[] = [];
    for (const commit of log) {
      for (const write of commit.trace ?? []) {
        if (!seen.has(write.path)) { seen.add(write.path); keys.push(write.path); }
      }
    }
    return keys;
  }, [activeTraceScope]);

  // Scrubbing changes the position, never the question's recorded cutoff.
  const traceWalk = useMemo<TraceWalk | null>(() => {
    if (sourceChanged || !tracing || tracing.scope !== activeTraceKey || !activeTraceScope.availability.ok) return null;
    const anchor = tracing.via.at(-1) ?? tracing;
    return buildTraceWalk(activeTraceScope.commitLog, activeTraceScope.executionTree, anchor.key, {
      beforeCommitIdx: anchor.beforeCommitIdx,
      scope: {
        invocationPath: activeTraceScope.invocationPath,
        mountLabels: Object.fromEntries(activeTraceScope.mountLabels),
        readsAvailable: activeTraceScope.readsAvailable,
        startKeys: activeTraceScope.startKeys,
      },
    });
  }, [tracing, activeTraceScope, activeTraceKey, sourceChanged]);

  const traceStopIndices = useMemo(() => {
    if (!traceWalk || traceWalk.missing) return [];
    const indexById = new Map(activeSnapshots.map((snapshot, index) => [snapshot.runtimeStageId, index]));
    return traceWalk.stops.map(stop => indexById.get(stop.runtimeStageId))
      .filter((index): index is number => index !== undefined).sort((a, b) => a - b);
  }, [traceWalk, activeSnapshots]);

  const sliceCone = useMemo(() => {
    if (traceWalk && !traceWalk.missing && traceWalk.stops.length >= 2) return dependencyCone(traceWalk.stops);
    if (!showDataTraceCone || shellDataTrace.frames.length < 2) return undefined;
    return dependencyCone(shellDataTrace.frames);
  }, [traceWalk, showDataTraceCone, shellDataTrace]);

  const navigateToStage = useCallback((id: string) => {
    const index = activeSnapshots.findIndex(snapshot => snapshot.runtimeStageId === id);
    if (index >= 0) setSnapshotIdx(index);
  }, [activeSnapshots, setSnapshotIdx]);
  const jumpToAnchor = useCallback((walk: TraceWalk) => {
    const anchor = walk.stops[0];
    if (anchor) navigateToStage(anchor.runtimeStageId);
  }, [navigateToStage]);

  const handleStartTracing = useCallback((key: string) => {
    if (!activeTraceScope.availability.ok) return;
    const log = activeTraceScope.commitLog as Array<{ runtimeStageId?: string }>;
    const cursorId = activeSnapshots[safeIdx]?.runtimeStageId;
    const cursorCommitIndex = log.findIndex(commit => commit.runtimeStageId === cursorId);
    // Hand-built snapshots can name visits absent from the log. Preserve the
    // established whole-log question when no recorded cursor cutoff exists.
    const beforeCommitIdx = cursorCommitIndex >= 0 ? cursorCommitIndex + 1 : undefined;
    dispatch({ type: "start", question: { scope: activeTraceKey, key, beforeCommitIdx, via: [] } });
    onStartInspector();
    jumpToAnchor(buildTraceWalk(activeTraceScope.commitLog, activeTraceScope.executionTree, key, { beforeCommitIdx }));
  }, [activeTraceScope, activeTraceKey, activeSnapshots, safeIdx, dispatch, onStartInspector, jumpToAnchor]);

  const handleFollowIngredient = useCallback((ingredient: TraceIngredient) => {
    if (!tracing || !activeTraceScope.availability.ok || ingredient.writerCommitIdx === null) return;
    const anchor = { key: ingredient.key, beforeCommitIdx: ingredient.writerCommitIdx + 1 };
    dispatch({ type: "follow", anchor });
    jumpToAnchor(buildTraceWalk(activeTraceScope.commitLog, activeTraceScope.executionTree, anchor.key, {
      beforeCommitIdx: anchor.beforeCommitIdx,
    }));
  }, [tracing, activeTraceScope, dispatch, jumpToAnchor]);

  const handleShowAllIngredients = useCallback(() => {
    if (!tracing || !activeTraceScope.availability.ok) return;
    dispatch({ type: "show-all" });
    jumpToAnchor(buildTraceWalk(activeTraceScope.commitLog, activeTraceScope.executionTree, tracing.key, {
      beforeCommitIdx: tracing.beforeCommitIdx,
    }));
  }, [tracing, activeTraceScope, dispatch, jumpToAnchor]);
  // Exiting changes only the lens: the shared cursor stays where it landed.
  const handleExitTracing = useCallback(() => dispatch({ type: "exit" }), [dispatch]);
  const handleForkPrompt = useCallback(() => dispatch({ type: "open-chooser" }), [dispatch]);
  const handleContinueTimeOrder = useCallback(() => {
    const earlier = traceStopIndices.filter(index => index < safeIdx);
    if (earlier.length > 0) setSnapshotIdx(earlier[earlier.length - 1]);
    dispatch({ type: "close-chooser" });
  }, [traceStopIndices, safeIdx, setSnapshotIdx, dispatch]);

  const activeViaKey = tracing?.via.at(-1)?.key ?? null;
  const stepNumberOf = useCallback((id: string) => {
    const index = activeSnapshots.findIndex(snapshot => snapshot.runtimeStageId === id);
    return index >= 0 ? index + 1 : null;
  }, [activeSnapshots]);
  const tracingRail = useMemo<TracingRail | null>(() => {
    if (!tracing || !traceWalk || traceWalk.missing || traceStopIndices.length === 0) return null;
    const cursorId = activeSnapshots[safeIdx]?.runtimeStageId;
    const walkIndex = traceWalk.stops.findIndex(stop => stop.runtimeStageId === cursorId);
    const currentStop = traceWalk.stops[walkIndex >= 0 ? walkIndex : 0];
    return {
      tracedKey: tracing.key,
      viaKey: activeViaKey,
      stopIndices: traceStopIndices,
      stopOrdinal: walkIndex >= 0 ? walkIndex + 1 : 1,
      totalStops: traceWalk.stops.length,
      onExit: handleExitTracing,
      onShowAll: activeViaKey ? handleShowAllIngredients : undefined,
      forkCount: currentStop?.ingredients.filter(ingredient => ingredient.writerRuntimeStageId !== null).length ?? 0,
      onForkPrompt: handleForkPrompt,
    };
  }, [tracing, traceWalk, traceStopIndices, activeSnapshots, safeIdx, activeViaKey, handleExitTracing, handleShowAllIngredients, handleForkPrompt]);

  return {
    tracing, forkChooserOpen, traceSearch, setTraceSearch,
    shellDataTrace, allTracedKeys, traceWalk, traceStopIndices, sliceCone,
    navigateToStage, activeViaKey, stepNumberOf, tracingRail,
    handleStartTracing, handleFollowIngredient, handleShowAllIngredients,
    handleExitTracing, handleForkPrompt, handleContinueTimeOrder,
  };
}
