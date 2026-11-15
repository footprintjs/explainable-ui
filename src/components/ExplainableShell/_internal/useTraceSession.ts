import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import type { StageSnapshot } from "../../../types";
import type { TracingRail } from "../../TimeTravelControls/TimeTravelControls";
import { buildDataTrace, type DataTraceResult } from "./dataTrace";
import type { TraceScope } from "./traceScope";
import { buildTraceWalk, type TraceIngredient, type TraceWalk } from "./traceWalk";
import { subflowHandoffSources, type SubflowHandoffSource } from "../../../trace/subflowHandoff";
import { projectTraceInvocation } from "../../../trace/projectTraceInvocation";
import { ownDataField } from "../../../trace/safeRecordRead";
import { rootMountLabels, runHasRecordedReads, sourceRunKey } from "../../../trace/traceScope";
import { projectStageActivity, type StageActivityTraceTarget, type StageActivityView } from "../../../trace/stageActivity";

interface TraceAnchor {
  key: string;
  beforeCommitIdx?: number;
}

interface TraceQuestion extends TraceAnchor {
  scope: string | null;
  via: TraceAnchor[];
  handoff?: {
    parentPath: readonly string[];
    mountRuntimeStageId: string;
    writtenKeys: readonly string[];
    beforeCommitIdx: number;
    source: SubflowHandoffSource;
  };
}

interface SavedQuestion {
  question: TraceQuestion;
  invocationPath: readonly string[];
  cursorRuntimeStageId: string;
  proof: string;
  sourceIdentity: unknown;
}

/** A UI return address only. Recorded values and rendered projections stay live. */
export interface ActivityTraceOrigin {
  invocationPath: readonly string[];
  runtimeStageId: string;
  beforeCommitIdx: number;
  key: string;
  kind: "read" | "write";
  variableId: string;
  stageLabel: string;
}

interface SavedActivityOrigin {
  address: ActivityTraceOrigin;
  sourceIdentity: unknown;
}

interface TraceSessionState {
  tracing: TraceQuestion | null;
  forkChooserOpen: boolean;
  traceSearch: string;
  history: readonly SavedQuestion[];
  activityOrigin: SavedActivityOrigin | null;
  generation: object | null;
}

type TraceSessionAction =
  | { type: "reset" }
  | { type: "start"; question: TraceQuestion; activityOrigin?: SavedActivityOrigin; generation: object }
  | { type: "follow"; anchor: TraceAnchor; previous: SavedQuestion }
  | { type: "enter" | "restore"; question: TraceQuestion; history: readonly SavedQuestion[];
      activityOrigin: SavedActivityOrigin | null; generation: object | null }
  | { type: "show-all" }
  | { type: "exit" }
  | { type: "open-chooser" }
  | { type: "close-chooser" }
  | { type: "search"; value: string };

const emptySession: TraceSessionState = {
  tracing: null,
  forkChooserOpen: false,
  traceSearch: "",
  history: [],
  activityOrigin: null,
  generation: null,
};

function traceSessionReducer(state: TraceSessionState, action: TraceSessionAction): TraceSessionState {
  switch (action.type) {
    case "reset": return emptySession;
    case "start": return { tracing: action.question, history: [], forkChooserOpen: false, traceSearch: "",
      activityOrigin: action.activityOrigin ?? null, generation: action.generation };
    case "enter":
    case "restore": return { tracing: action.question, history: action.history, forkChooserOpen: false, traceSearch: "",
      activityOrigin: action.activityOrigin, generation: action.generation };
    case "follow": return state.tracing ? {
      ...state,
      tracing: { ...state.tracing, via: [...state.tracing.via, action.anchor] },
      history: [...state.history, action.previous],
      forkChooserOpen: false,
    } : state;
    case "show-all": return state.tracing ? {
      ...state,
      tracing: { ...state.tracing, via: [] },
      history: state.history.filter(entry => entry.question.scope !== state.tracing!.scope),
      forkChooserOpen: false,
    } : state;
    case "exit": return { ...state, tracing: null, history: [], forkChooserOpen: false, activityOrigin: null, generation: null };
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
  onReturnToActivity?: (origin: ActivityTraceOrigin) => void;
  runtimeSnapshot?: unknown;
  openTraceSource?: (mountRuntimeStageId: string, invocationPath: readonly string[], targetRuntimeStageId?: string) => boolean;
  restoreTraceQuestion?: (invocationPath: readonly string[], targetRuntimeStageId: string) => boolean;
  /** Current exact-visit addresses admitted for the Activity surface. */
  stageActivity?: StageActivityView;
}

const samePath = (left: readonly string[], right: readonly string[]) =>
  left.length === right.length && left.every((part, index) => part === right[index]);

/** A bounded names-only witness. Never retain snapshot values or an old rendered walk. */
function questionProof(walk: TraceWalk): string | undefined {
  let chars = 0, items = 0;
  const name = (value: string | null) => {
    if (++items > 4_096 || (chars += value?.length ?? 0) > 65_536) throw new Error();
    return value;
  };
  try {
    return JSON.stringify([
      walk.missing, walk.readsAvailable, walk.truncated,
      walk.inputTermini.map(name),
      walk.stops.map(stop => [name(stop.runtimeStageId), stop.commitIdx,
        stop.contributedKeys.map(name), stop.keysWritten.map(name),
        stop.ingredients.map(input => [name(input.key), name(input.writerRuntimeStageId), input.writerCommitIdx]),
      ]),
    ]);
  } catch { return undefined; }
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
  onReturnToActivity,
  runtimeSnapshot,
  openTraceSource,
  restoreTraceQuestion,
  stageActivity,
}: TraceSessionControllerOptions) {
  const { tracing, history, activityOrigin: savedActivityOrigin, generation,
    forkChooserOpen, traceSearch, setTraceSearch, dispatch } = session;
  const source = runtimeSnapshot === undefined ? activeTraceScope : sourceRunKey(runtimeSnapshot);
  // Old sources without run IDs stay object-scoped, without retaining old snapshot payloads in history.
  const sourceToken = useRef({ source, token: {} });
  if (sourceToken.current.source !== source) sourceToken.current = { source, token: {} };
  const sourceIdentity = typeof source === "string" ? source : sourceToken.current.token;
  useEffect(() => { if (sourceChanged) dispatch({ type: "reset" }); }, [sourceChanged, dispatch]);
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
    const walk = buildTraceWalk(activeTraceScope.commitLog, activeTraceScope.executionTree, anchor.key, {
      beforeCommitIdx: anchor.beforeCommitIdx,
      scope: {
        invocationPath: activeTraceScope.invocationPath,
        mountLabels: Object.fromEntries(activeTraceScope.mountLabels),
        readsAvailable: activeTraceScope.readsAvailable,
        startKeys: activeTraceScope.startKeys,
      },
    });
    return {
      ...walk,
      stops: walk.stops.map(stop => {
        const sources = subflowHandoffSources({
          snapshot: runtimeSnapshot, invocationPath: activeTraceScope.invocationPath,
          mountRuntimeStageId: stop.runtimeStageId, writtenKeys: stop.contributedKeys,
          beforeCommitIdx: Math.min(stop.commitIdx + 1, anchor.beforeCommitIdx ?? activeTraceScope.commitLog.length),
        });
        return sources.length ? { ...stop, handoffSources: sources } : stop;
      }),
    };
  }, [tracing, activeTraceScope, activeTraceKey, sourceChanged, runtimeSnapshot]);

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

  const handoffStillRecorded = useCallback((question: TraceQuestion): boolean => {
    const link = question.handoff;
    if (!link) return true;
    return subflowHandoffSources({
      snapshot: runtimeSnapshot, invocationPath: link.parentPath,
      mountRuntimeStageId: link.mountRuntimeStageId, writtenKeys: link.writtenKeys,
      beforeCommitIdx: link.beforeCommitIdx,
    }).some(source => source.key === link.source.key &&
      source.beforeCommitIdx === link.source.beforeCommitIdx &&
      samePath(source.invocationPath, link.source.invocationPath));
  }, [runtimeSnapshot]);

  const resolveRecordedScope = useCallback((invocationPath: readonly string[]) => {
    let log: unknown[], tree: unknown, scope: NonNullable<TraceWalk["scope"]>;
    if (runtimeSnapshot === undefined) {
      if (!samePath(invocationPath, activeTraceScope.invocationPath) || !activeTraceScope.availability.ok) return undefined;
      log = activeTraceScope.commitLog;
      tree = activeTraceScope.executionTree;
      scope = { invocationPath, readsAvailable: activeTraceScope.readsAvailable,
        mountLabels: Object.fromEntries(activeTraceScope.mountLabels), startKeys: activeTraceScope.startKeys };
    } else if (invocationPath.length) {
      const selected = projectTraceInvocation(runtimeSnapshot, invocationPath.at(-1)!, { invocationPath });
      if (!selected.availability.ok) return undefined;
      log = selected.commitLog; tree = selected.executionTree; scope = selected.scope;
    } else {
      const rawLog = ownDataField(runtimeSnapshot, "commitLog");
      tree = ownDataField(runtimeSnapshot, "executionTree");
      if (!Array.isArray(rawLog)) return undefined;
      const root = rootMountLabels(tree, rawLog);
      if (!root.availability.ok) return undefined;
      log = rawLog;
      scope = { invocationPath: [], readsAvailable: root.hasTree && runHasRecordedReads(runtimeSnapshot),
        mountLabels: Object.fromEntries(root.labels) };
    }
    return { log, tree, scope };
  }, [runtimeSnapshot, activeTraceScope]);

  const savedQuestionValid = useCallback((entry: SavedQuestion): boolean => {
    if (sourceChanged || entry.sourceIdentity !== sourceIdentity || !handoffStillRecorded(entry.question)) return false;
    const selected = resolveRecordedScope(entry.invocationPath);
    if (!selected) return false;
    const { log, tree, scope } = selected;
    const anchor = entry.question.via.at(-1) ?? entry.question;
    if (anchor.beforeCommitIdx !== undefined && anchor.beforeCommitIdx > log.length) return false;
    if (!log.some(commit => ownDataField(commit, "runtimeStageId") === entry.cursorRuntimeStageId)) return false;
    return questionProof(buildTraceWalk(log, tree, anchor.key, { beforeCommitIdx: anchor.beforeCommitIdx, scope })) === entry.proof;
  }, [sourceChanged, sourceIdentity, resolveRecordedScope, handoffStillRecorded]);

  const activityOriginValid = useCallback((entry: SavedActivityOrigin): boolean => {
    if (sourceChanged || entry.sourceIdentity !== sourceIdentity) return false;
    const origin = entry.address;
    const selected = resolveRecordedScope(origin.invocationPath);
    if (!selected) return false;
    // Reuse Activity's bounded exact-visit admission, including empty engine
    // bookends. A skeletal snapshot checks only the address, never old values.
    const visit = projectStageActivity({
      scope: { commitLog: selected.log, executionTree: selected.tree, invocationPath: origin.invocationPath,
        readsAvailable: selected.scope.readsAvailable ?? false, mountLabels: new Map(), availability: { ok: true } },
      snapshots: [{ runtimeStageId: origin.runtimeStageId, stageName: origin.stageLabel, stageLabel: origin.stageLabel,
        memory: {}, narrative: "", startMs: 0, durationMs: 0 }],
      selectedIndex: 0, narrativeAvailable: false,
    });
    if (!visit.availability.ok || visit.identity.commitIdx !== origin.beforeCommitIdx - (origin.kind === "write" ? 1 : 0)) return false;
    // Without the navigation resolver, only an exact unique snapshot in the
    // current invocation can be restored. Never guess a repeated visit.
    return !!restoreTraceQuestion || (samePath(origin.invocationPath, activeTraceScope.invocationPath) &&
      activeSnapshots.filter(snapshot => snapshot.runtimeStageId === origin.runtimeStageId).length === 1);
  }, [sourceChanged, sourceIdentity, resolveRecordedScope, restoreTraceQuestion, activeTraceScope.invocationPath, activeSnapshots]);
  const activityOrigin = tracing && savedActivityOrigin && activityOriginValid(savedActivityOrigin)
    ? savedActivityOrigin.address : null;

  const saveCurrentQuestion = useCallback((): SavedQuestion | undefined => {
    const cursorRuntimeStageId = activeSnapshots[safeIdx]?.runtimeStageId;
    const proof = traceWalk && questionProof(traceWalk);
    if (!tracing || !proof || !cursorRuntimeStageId || history.length >= 128 || sourceChanged) return undefined;
    return { question: tracing, invocationPath: [...activeTraceScope.invocationPath],
      cursorRuntimeStageId, proof, sourceIdentity };
  }, [activeSnapshots, safeIdx, traceWalk, tracing, history.length, sourceChanged, activeTraceScope.invocationPath, sourceIdentity]);

  const trailValid = useMemo(() => !sourceChanged && history.every(savedQuestionValid) &&
    (!tracing || handoffStillRecorded(tracing)), [sourceChanged, history, savedQuestionValid, tracing, handoffStillRecorded]);
  const questionTrail = tracing && trailValid ? [
    ...history.map(entry => ({ key: entry.question.via.at(-1)?.key ?? entry.question.key, invocationPath: entry.invocationPath })),
    { key: tracing.via.at(-1)?.key ?? tracing.key, invocationPath: activeTraceScope.invocationPath },
  ] : [];

  const returnContext = { history, trailValid, savedQuestionValid, restoreTraceQuestion,
    activeTraceScope, activeSnapshots, setSnapshotIdx, onStartInspector, savedActivityOrigin, generation };
  const latestReturn = useRef(returnContext);
  latestReturn.current = returnContext;
  const handleReturnToQuestion = useCallback((index: number) => {
    const { history, trailValid, savedQuestionValid, restoreTraceQuestion,
      activeTraceScope, activeSnapshots, setSnapshotIdx, onStartInspector, savedActivityOrigin, generation } = latestReturn.current;
    if (!Number.isInteger(index) || index < 0 || index >= history.length || !trailValid) return;
    const entry = history[index];
    // Re-read current evidence at click time: a stale callback cannot revive a withdrawn source.
    if (!history.slice(0, index + 1).every(savedQuestionValid)) return;
    if (restoreTraceQuestion) {
      if (!restoreTraceQuestion(entry.invocationPath, entry.cursorRuntimeStageId)) return;
    } else {
      if (!samePath(entry.invocationPath, activeTraceScope.invocationPath)) return;
      const cursor = activeSnapshots.findIndex(stage => stage.runtimeStageId === entry.cursorRuntimeStageId);
      if (cursor < 0) return;
      setSnapshotIdx(cursor);
    }
    dispatch({ type: "restore", question: entry.question, history: history.slice(0, index),
      activityOrigin: savedActivityOrigin, generation });
    onStartInspector();
  }, [dispatch]);

  const handleStartTracing = useCallback((key: string) => {
    if (!activeTraceScope.availability.ok) return;
    const log = activeTraceScope.commitLog as Array<{ runtimeStageId?: string }>;
    const cursorId = activeSnapshots[safeIdx]?.runtimeStageId;
    const cursorCommitIndex = log.findIndex(commit => commit.runtimeStageId === cursorId);
    // Hand-built snapshots can name visits absent from the log. Preserve the
    // established whole-log question when no recorded cursor cutoff exists.
    const beforeCommitIdx = cursorCommitIndex >= 0 ? cursorCommitIndex + 1 : undefined;
    dispatch({ type: "start", question: { scope: activeTraceKey, key, beforeCommitIdx, via: [] }, generation: {} });
    onStartInspector();
    jumpToAnchor(buildTraceWalk(activeTraceScope.commitLog, activeTraceScope.executionTree, key, { beforeCommitIdx }));
  }, [activeTraceScope, activeTraceKey, activeSnapshots, safeIdx, dispatch, onStartInspector, jumpToAnchor]);

  // Activity supplies an admitted read/write address, never a value. Read
  // questions stop before the visit; write questions include its commit.
  const latestActivityTrace = useRef({ activeTraceScope, activeTraceKey, activeSnapshots, safeIdx, stageActivity,
    sourceChanged, sourceIdentity, onStartInspector, jumpToAnchor });
  latestActivityTrace.current = { activeTraceScope, activeTraceKey, activeSnapshots, safeIdx, stageActivity,
    sourceChanged, sourceIdentity, onStartInspector, jumpToAnchor };
  const handleTraceStageVariable = useCallback((target: StageActivityTraceTarget) => {
    const latest = latestActivityTrace.current;
    if (latest.sourceChanged || !latest.activeTraceScope.availability.ok || !latest.stageActivity?.availability.ok) return;
    const variable = [...latest.stageActivity.reads, ...latest.stageActivity.writes].find(variable => variable.traceTarget === target);
    if (!variable) return;
    try {
      const key = ownDataField(target, "key");
      const kind = ownDataField(target, "kind");
      const runtimeStageId = ownDataField(target, "runtimeStageId");
      const cutoff = ownDataField(target, "beforeCommitIdx");
      const path = ownDataField(target, "invocationPath");
      if (typeof key !== "string" || !key.length || key.length > 4_096 ||
        (kind !== "read" && kind !== "write") || typeof runtimeStageId !== "string" ||
        typeof cutoff !== "number" || !Number.isSafeInteger(cutoff) || cutoff < 0 ||
        latest.activeSnapshots[latest.safeIdx]?.runtimeStageId !== runtimeStageId ||
        !Array.isArray(path) || path.length > 128 || !samePath(path, latest.activeTraceScope.invocationPath)) return;
      const log = latest.activeTraceScope.commitLog;
      if (log.length > 100_000) return;
      const commitIdx = cutoff - (kind === "write" ? 1 : 0);
      // The projection distinguishes primary commits from explicit empty phase
      // rows. Keep its raw address rather than choosing another same-named row.
      if (commitIdx < 0 || commitIdx >= log.length || ownDataField(log[commitIdx], "runtimeStageId") !== runtimeStageId) return;
      if (kind === "write") {
        const writes = ownDataField(log[commitIdx], "trace");
        if (!Array.isArray(writes) || !writes.some(write => ownDataField(write, "path") === key)) return;
      }
      const walk = buildTraceWalk(log, latest.activeTraceScope.executionTree, key, { beforeCommitIdx: cutoff });
      dispatch({ type: "start", question: { scope: latest.activeTraceKey, key, beforeCommitIdx: cutoff, via: [] },
        generation: {}, activityOrigin: { sourceIdentity: latest.sourceIdentity, address: {
          invocationPath: [...path], runtimeStageId, beforeCommitIdx: cutoff, key, kind,
          variableId: variable.id, stageLabel: latest.stageActivity.identity.stageLabel,
        } } });
      latest.onStartInspector();
      latest.jumpToAnchor(walk);
    } catch { /* A changed or unreadable address cannot start a new question. */ }
  }, [dispatch]);

  const handleFollowIngredient = useCallback((ingredient: TraceIngredient) => {
    const previous = saveCurrentQuestion();
    if (!previous || !tracing || !activeTraceScope.availability.ok || ingredient.writerCommitIdx === null ||
      !traceWalk?.stops.some(stop => stop.ingredients.some(recorded =>
        recorded.key === ingredient.key && recorded.writerRuntimeStageId === ingredient.writerRuntimeStageId &&
        recorded.writerCommitIdx === ingredient.writerCommitIdx))) return;
    const anchor = { key: ingredient.key, beforeCommitIdx: ingredient.writerCommitIdx + 1 };
    dispatch({ type: "follow", anchor, previous });
    jumpToAnchor(buildTraceWalk(activeTraceScope.commitLog, activeTraceScope.executionTree, anchor.key, {
      beforeCommitIdx: anchor.beforeCommitIdx,
    }));
  }, [tracing, activeTraceScope, traceWalk, dispatch, jumpToAnchor, saveCurrentQuestion]);

  const handleFollowHandoff = useCallback((source: SubflowHandoffSource) => {
    const previous = saveCurrentQuestion();
    const parentStop = traceWalk?.stops.find(stop => stop.handoffSources?.includes(source));
    if (!previous || sourceChanged || !openTraceSource || !parentStop) return;
    const child = projectTraceInvocation(runtimeSnapshot, source.mountRuntimeStageId, { invocationPath: source.invocationPath });
    if (!child.availability.ok || source.beforeCommitIdx > child.commitLog.length) return;
    const walk = buildTraceWalk(child.commitLog, child.executionTree, source.key, {
      beforeCommitIdx: source.beforeCommitIdx, scope: child.scope,
    });
    const anchor = tracing!.via.at(-1) ?? tracing!;
    const question: TraceQuestion = {
      scope: JSON.stringify(source.invocationPath), key: source.key,
      beforeCommitIdx: source.beforeCommitIdx, via: [],
      handoff: { parentPath: [...activeTraceScope.invocationPath], mountRuntimeStageId: source.mountRuntimeStageId,
        writtenKeys: [...parentStop.contributedKeys],
        beforeCommitIdx: Math.min(parentStop.commitIdx + 1, anchor.beforeCommitIdx ?? activeTraceScope.commitLog.length), source },
    };
    if (!handoffStillRecorded(question) || !openTraceSource(source.mountRuntimeStageId, source.invocationPath, walk.stops[0]?.runtimeStageId)) return;
    dispatch({ type: "enter", history: [...history, previous], question, activityOrigin: savedActivityOrigin, generation });
    onStartInspector();
  }, [sourceChanged, openTraceSource, traceWalk, runtimeSnapshot, dispatch, onStartInspector, saveCurrentQuestion, tracing, history,
    activeTraceScope, handoffStillRecorded, savedActivityOrigin, generation]);

  const handleShowAllIngredients = useCallback(() => {
    if (!tracing || !activeTraceScope.availability.ok) return;
    dispatch({ type: "show-all" });
    jumpToAnchor(buildTraceWalk(activeTraceScope.commitLog, activeTraceScope.executionTree, tracing.key, {
      beforeCommitIdx: tracing.beforeCommitIdx,
    }));
  }, [tracing, activeTraceScope, dispatch, jumpToAnchor]);
  const exitContext = { generation, sourceIdentity, sourceChanged, savedActivityOrigin, activityOriginValid,
    restoreTraceQuestion, activeTraceScope, activeSnapshots, setSnapshotIdx, onReturnToActivity };
  const latestExit = useRef(exitContext);
  latestExit.current = exitContext;
  const handleExitTracing = useCallback(() => {
    const latest = latestExit.current;
    // A retained button from another run or question cannot close this session.
    if (generation !== latest.generation || sourceIdentity !== latest.sourceIdentity || latest.sourceChanged) return;
    const saved = latest.savedActivityOrigin;
    if (saved) {
      if (!latest.activityOriginValid(saved)) { dispatch({ type: "exit" }); return; }
      const origin = saved.address;
      if (latest.restoreTraceQuestion) {
        if (!latest.restoreTraceQuestion(origin.invocationPath, origin.runtimeStageId)) return;
      } else {
        const matches = latest.activeSnapshots.flatMap((snapshot, index) => snapshot.runtimeStageId === origin.runtimeStageId ? [index] : []);
        if (!samePath(origin.invocationPath, latest.activeTraceScope.invocationPath) || matches.length !== 1) return;
        latest.setSnapshotIdx(matches[0]);
      }
      dispatch({ type: "exit" });
      latest.onReturnToActivity?.(origin);
      return;
    }
    // Legacy Inspector traces keep the shared cursor where the walk landed.
    dispatch({ type: "exit" });
  }, [dispatch, generation, sourceIdentity]);
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
      ...(activityOrigin ? { exitLabel: `Back to ${activityOrigin.stageLabel} · Activity`, exitAriaLabel: `Return to ${activityOrigin.stageLabel} activity` } : {}),
      onShowAll: activeViaKey ? handleShowAllIngredients : undefined,
      forkCount: currentStop?.ingredients.filter(ingredient => ingredient.writerRuntimeStageId !== null).length ?? 0,
      onForkPrompt: handleForkPrompt,
    };
  }, [tracing, traceWalk, traceStopIndices, activeSnapshots, safeIdx, activeViaKey, handleExitTracing, handleShowAllIngredients, handleForkPrompt, activityOrigin]);

  return {
    tracing, forkChooserOpen, traceSearch, setTraceSearch, activityOrigin,
    shellDataTrace, allTracedKeys, traceWalk, traceStopIndices, sliceCone,
    navigateToStage, activeViaKey, stepNumberOf, tracingRail,
    handleStartTracing, handleTraceStageVariable, handleFollowIngredient, handleShowAllIngredients,
    handleFollowHandoff,
    questionTrail, handleReturnToQuestion,
    handleExitTracing, handleForkPrompt, handleContinueTimeOrder,
  };
}
