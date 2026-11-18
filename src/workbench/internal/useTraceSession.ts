import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { useIsomorphicLayoutEffect } from "../../_internal/useIsomorphicLayoutEffect";
import { needsScopedWalk, useScopedWalks, type WalkQuestion } from "./useScopedWalks";
import type { StageSnapshot } from "../../types";
import type { TracingRail } from "../../model/replayControls";
import { createDataTraceReader, type DataTraceResult } from "../../trace/dataTrace";
import type { TraceScope } from "../../trace/traceScope";
import { buildTraceWalk, createTraceWalkReader, type TraceIngredient, type TraceStageRead, type TraceWalk } from "../../trace/traceWalk";
import { subflowHandoffSources, type SubflowHandoffSource } from "../../trace/subflowHandoff";
import { projectTraceInvocation } from "../../trace/projectTraceInvocation";
import type { InspectedStageRead } from "../../trace/recordedValuePreview";
import { ownDataField } from "../../trace/safeRecordRead";
import { rootMountLabels, runHasRecordedReads, sourceRunKey } from "../../trace/traceScope";
import { projectStageActivity, type StageActivityTraceTarget, type StageActivityView } from "../../trace/stageActivity";

interface TraceAnchor {
  key: string;
  beforeCommitIdx?: number;
  /** A read question uses this visit's recorded window, not the later cursor. */
  readerCommitIdx?: number;
  readerRuntimeStageId?: string;
  writerRuntimeStageId?: string;
}

export interface TraceQuestion extends TraceAnchor {
  /** Independent inspection of an observed stage read, pinned to its native commit. */
  stageReadCommitIdx?: number;
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
  recordingIdentity?: unknown;
  openTraceSource?: (mountRuntimeStageId: string, invocationPath: readonly string[], targetRuntimeStageId?: string) => boolean;
  restoreTraceQuestion?: (invocationPath: readonly string[], targetRuntimeStageId: string) => boolean;
  /** Current exact-visit addresses admitted for the Activity surface. */
  stageActivity?: StageActivityView;
}

const samePath = (left: readonly string[], right: readonly string[]) =>
  left.length === right.length && left.every((part, index) => part === right[index]);

function walkScope(scope: TraceScope): NonNullable<TraceWalk["scope"]> {
  return { invocationPath: scope.invocationPath,
    mountLabels: Object.fromEntries(scope.mountLabels), readsAvailable: scope.readsAvailable,
    ...(scope.nestedReadTracking ? { nestedReadTracking: true as const } : {}), startKeys: scope.startKeys };
}

function readerStillRecorded(anchor: TraceAnchor, log: readonly unknown[]): boolean {
  try {
    return anchor.readerCommitIdx === undefined || (Number.isSafeInteger(anchor.readerCommitIdx) &&
      anchor.readerCommitIdx >= 0 && anchor.readerCommitIdx < log.length &&
      ownDataField(ownDataField(log, String(anchor.readerCommitIdx)), "runtimeStageId") === anchor.readerRuntimeStageId);
  } catch { return false; }
}

/** A bounded names-only witness. Never retain snapshot values or an old rendered walk. */
function questionProof(walk: TraceWalk): string | undefined {
  let chars = 0, items = 0;
  const name = (value: string | null) => {
    if (++items > 4_096 || (chars += value?.length ?? 0) > 65_536) throw new Error();
    return value;
  };
  try {
    return JSON.stringify([
      walk.missing, walk.readsAvailable, walk.truncated, walk.scope?.nestedReadTracking === true,
      walk.inputTermini.map(name),
      walk.stops.map(stop => [name(stop.runtimeStageId), stop.commitIdx,
        stop.contributedKeys.map(name), stop.keysWritten.map(name),
        stop.gapMessages?.map(name),
        stop.stageReads?.map(read => [name(read.key), name(read.runtimeStageId), read.commitIdx, read.beforeCommitIdx]),
        stop.handoffSources?.map(source => [name(source.key), source.invocationPath.map(name), source.beforeCommitIdx, name(source.writerRuntimeStageId ?? null)]),
        stop.ingredients.map(input => [name(input.key), name(input.writerRuntimeStageId), input.writerCommitIdx, input.unresolvedReason]),
        stop.ingredientsByKey === undefined ? null : Object.entries(stop.ingredientsByKey).map(([key, inputs]) =>
          [name(key), inputs.map(input => [name(input.key), name(input.writerRuntimeStageId), input.writerCommitIdx, input.unresolvedReason])]),
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
  runtimeSnapshot, recordingIdentity,
  openTraceSource,
  restoreTraceQuestion,
  stageActivity,
}: TraceSessionControllerOptions) {
  const { tracing, history, activityOrigin: savedActivityOrigin, generation,
    forkChooserOpen, traceSearch, setTraceSearch, dispatch } = session;
  const source = recordingIdentity === undefined ? (runtimeSnapshot === undefined ? activeTraceScope : sourceRunKey(runtimeSnapshot)) : sourceRunKey(recordingIdentity);
  // Old sources without run IDs stay object-scoped, without retaining old snapshot payloads in history.
  const sourceToken = useRef({ source, token: {} });
  if (sourceToken.current.source !== source) sourceToken.current = { source, token: {} };
  const sourceIdentity = typeof source === "string" ? source : sourceToken.current.token;
  useEffect(() => { if (sourceChanged) dispatch({ type: "reset" }); }, [sourceChanged, dispatch]);
  const dataTraceReader = useMemo(() => activeTraceScope.availability.ok && traceHistoryAvailable
    ? createDataTraceReader(activeTraceScope.commitLog, activeTraceScope.executionTree,
      { nestedReadTracking: activeTraceScope.nestedReadTracking }) : undefined, [activeTraceScope, traceHistoryAvailable]);
  const shellDataTrace = useMemo<DataTraceResult>(() => ({
    frames: dataTraceReader?.at(activeSnapshots[safeIdx]?.runtimeStageId ?? "").frames ?? [],
    readsAvailable: activeTraceScope.readsAvailable,
  }), [dataTraceReader, activeTraceScope.readsAvailable, activeSnapshots, safeIdx]);
  const readWalk = useMemo(() => {
    type Reader = ReturnType<typeof createTraceWalkReader>;
    let reader: Reader | undefined;
    // Prepare only when someone asks the first question in this scope.
    return (...question: Parameters<Reader>) => {
      reader ??= createTraceWalkReader(activeTraceScope.commitLog, activeTraceScope.executionTree, walkScope(activeTraceScope));
      return reader(...question);
    };
  }, [activeTraceScope]);

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
  const localWalk = useMemo<TraceWalk | null>(() => {
    if (sourceChanged || !tracing || tracing.scope !== activeTraceKey || !activeTraceScope.availability.ok) return null;
    const anchor = tracing.via.at(-1) ?? tracing;
    if (!readerStillRecorded(anchor, activeTraceScope.commitLog)) return null;
    return readWalk(anchor.key, {
      beforeCommitIdx: anchor.beforeCommitIdx,
      readerCommitIdx: anchor.readerCommitIdx,
      runtimeSnapshot,
    });
  }, [tracing, activeTraceScope, activeTraceKey, sourceChanged, runtimeSnapshot, readWalk]);

  const resolveRecordedScope = useCallback((invocationPath: readonly string[]) => {
    let log: unknown[], tree: unknown, scope: NonNullable<TraceWalk["scope"]>;
    if (runtimeSnapshot === undefined) {
      if (!samePath(invocationPath, activeTraceScope.invocationPath) || !activeTraceScope.availability.ok) return undefined;
      log = activeTraceScope.commitLog;
      tree = activeTraceScope.executionTree;
      scope = { invocationPath, readsAvailable: activeTraceScope.readsAvailable,
        ...(activeTraceScope.nestedReadTracking ? { nestedReadTracking: true as const } : {}),
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
        ...(ownDataField(runtimeSnapshot, "nestedReadTracking") === true ? { nestedReadTracking: true as const } : {}),
        mountLabels: Object.fromEntries(root.labels) };
    }
    return { log, tree, scope };
  }, [runtimeSnapshot, activeTraceScope]);

  const questions = useMemo(() => {
    const result = new Map<TraceQuestion, WalkQuestion>();
    if (tracing && localWalk) result.set(tracing, { ...(tracing.via.at(-1) ?? tracing), local: localWalk });
    if (!sourceChanged) for (const entry of history) {
      if (entry.sourceIdentity !== sourceIdentity) continue;
      const selected = resolveRecordedScope(entry.invocationPath);
      if (!selected) continue;
      const anchor = entry.question.via.at(-1) ?? entry.question;
      if (!readerStillRecorded(anchor, selected.log) || (anchor.beforeCommitIdx ?? 0) > selected.log.length ||
        !selected.log.some(row => ownDataField(row, "runtimeStageId") === entry.cursorRuntimeStageId)) continue;
      result.set(entry.question, { ...anchor, local: buildTraceWalk(selected.log, selected.tree, anchor.key, {
        beforeCommitIdx: anchor.beforeCommitIdx, readerCommitIdx: anchor.readerCommitIdx, scope: selected.scope, runtimeSnapshot,
      }) });
    }
    return result;
  }, [tracing, localWalk, sourceChanged, history, sourceIdentity, resolveRecordedScope, runtimeSnapshot]);
  const scoped = useScopedWalks(runtimeSnapshot, questions);
  const traceWalk = tracing ? scoped.walks.get(tracing) ?? null : null;
  const traceStopIndices = useMemo(() => {
    if (!traceWalk || traceWalk.missing) return [];
    const indexById = new Map(activeSnapshots.map((snapshot, index) => [snapshot.runtimeStageId, index]));
    return traceWalk.stops.map(stop => indexById.get(stop.runtimeStageId))
      .filter((index): index is number => index !== undefined).sort((a, b) => a - b);
  }, [traceWalk, activeSnapshots]);

  const sliceCone = useMemo(() => {
    // An active question may deliberately have no safe sources. The broader
    // stage cone must not replace that absence with another set of writers.
    if (tracing) return traceWalk && !traceWalk.missing && traceWalk.stops.length >= 2
      ? dependencyCone(traceWalk.stops) : undefined;
    if (!showDataTraceCone || shellDataTrace.frames.length < 2) return undefined;
    return dependencyCone(shellDataTrace.frames);
  }, [tracing, traceWalk, showDataTraceCone, shellDataTrace]);

  const navigateToStage = useCallback((id: string) => {
    const index = activeSnapshots.findIndex(snapshot => snapshot.runtimeStageId === id);
    if (index >= 0) setSnapshotIdx(index);
  }, [activeSnapshots, setSnapshotIdx]);
  const jumpToAnchor = useCallback((walk: TraceWalk) => {
    const anchor = walk.stops[0];
    if (anchor) navigateToStage(anchor.runtimeStageId);
  }, [navigateToStage]);

  const pendingJump = useRef<{ question: TraceQuestion; cursor: number } | null>(null);
  const startAtWriter = useCallback((question: TraceQuestion, local: TraceWalk, cursor: number) => {
    if (needsScopedWalk(runtimeSnapshot, local)) pendingJump.current = { question, cursor };
    else jumpToAnchor(local);
  }, [runtimeSnapshot, jumpToAnchor]);
  useIsomorphicLayoutEffect(() => {
    const request = pendingJump.current;
    if (!request || request.question !== tracing || scoped.pending) return;
    pendingJump.current = null;
    // Re-selecting the same tick would cancel a child-evidence load the user
    // started while the graph was resolving this question.
    if (traceWalk && request.cursor === safeIdx && traceWalk.stops[0]?.runtimeStageId !== activeSnapshots[safeIdx]?.runtimeStageId) {
      jumpToAnchor(traceWalk);
    }
  }, [tracing, scoped.pending, traceWalk, safeIdx, activeSnapshots, jumpToAnchor]);

  const handoffStillRecorded = useCallback((question: TraceQuestion): boolean => {
    const link = question.handoff;
    if (!link) return true;
    const matches = (source: SubflowHandoffSource) => source.key === link.source.key &&
      source.beforeCommitIdx === link.source.beforeCommitIdx && source.writerRuntimeStageId === link.source.writerRuntimeStageId &&
      samePath(source.invocationPath, link.source.invocationPath);
    if (link.source.writerRuntimeStageId !== undefined) {
      return [...scoped.walks.values()].some(walk => samePath(walk.scope?.invocationPath ?? [], link.parentPath) &&
        walk.stops.some(stop => stop.commitIdx + 1 === link.beforeCommitIdx &&
          stop.contributedKeys.some(key => link.writtenKeys.includes(key)) &&
          stop.handoffSources?.some(matches)));
    }
    return subflowHandoffSources({ snapshot: runtimeSnapshot, invocationPath: link.parentPath,
      mountRuntimeStageId: link.mountRuntimeStageId, writtenKeys: link.writtenKeys, beforeCommitIdx: link.beforeCommitIdx,
    }).some(matches);
  }, [runtimeSnapshot, scoped]);
  const savedQuestionValid = useCallback((entry: SavedQuestion): boolean => {
    const walk = scoped.walks.get(entry.question);
    return !scoped.pending && !sourceChanged && entry.sourceIdentity === sourceIdentity && !!walk &&
      handoffStillRecorded(entry.question) && questionProof(walk) === entry.proof;
  }, [sourceChanged, sourceIdentity, scoped, handoffStillRecorded]);

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
  const activityOrigin = useMemo(() => tracing && savedActivityOrigin && activityOriginValid(savedActivityOrigin)
    ? savedActivityOrigin.address : null, [tracing, savedActivityOrigin, activityOriginValid]);

  const saveCurrentQuestion = useCallback((): SavedQuestion | undefined => {
    const cursorRuntimeStageId = activeSnapshots[safeIdx]?.runtimeStageId;
    const proof = traceWalk && questionProof(traceWalk);
    if (scoped.pending || !tracing || !proof || !cursorRuntimeStageId || history.length >= 128 || sourceChanged) return undefined;
    return { question: tracing, invocationPath: [...activeTraceScope.invocationPath],
      cursorRuntimeStageId, proof, sourceIdentity };
  }, [scoped.pending, activeSnapshots, safeIdx, traceWalk, tracing, history.length, sourceChanged, activeTraceScope.invocationPath, sourceIdentity]);

  const trailValid = useMemo(() => !sourceChanged && history.every(savedQuestionValid) &&
    (!tracing || handoffStillRecorded(tracing)), [sourceChanged, history, savedQuestionValid, tracing, handoffStillRecorded]);
  const questionTrail = tracing && trailValid ? [
    ...history.map(entry => ({ key: entry.question.via.at(-1)?.key ?? entry.question.key, invocationPath: entry.invocationPath,
      stageReadCommitIdx: entry.question.via.length ? undefined : entry.question.stageReadCommitIdx })),
    { key: tracing.via.at(-1)?.key ?? tracing.key, invocationPath: activeTraceScope.invocationPath,
      stageReadCommitIdx: tracing.via.length ? undefined : tracing.stageReadCommitIdx },
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
    const question = { scope: activeTraceKey, key, beforeCommitIdx, via: [] };
    dispatch({ type: "start", question, generation: {} });
    onStartInspector();
    startAtWriter(question, readWalk(key, { beforeCommitIdx }), safeIdx);
  }, [activeTraceScope, activeTraceKey, activeSnapshots, safeIdx, dispatch, onStartInspector, startAtWriter, readWalk]);

  // Activity supplies an admitted read/write address, never a value. Read
  // questions use that visit's recorded look; write questions include its commit.
  const latestActivityTrace = useRef({ activeTraceScope, activeTraceKey, activeSnapshots, safeIdx, stageActivity,
    sourceChanged, sourceIdentity, onStartInspector, startAtWriter, readWalk });
  latestActivityTrace.current = { activeTraceScope, activeTraceKey, activeSnapshots, safeIdx, stageActivity,
    sourceChanged, sourceIdentity, onStartInspector, startAtWriter, readWalk };
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
      const anchor: TraceAnchor = { key, beforeCommitIdx: cutoff,
        ...(kind === "read" ? { readerCommitIdx: commitIdx, readerRuntimeStageId: runtimeStageId } : { writerRuntimeStageId: runtimeStageId }) };
      const walk = latest.readWalk(key, { beforeCommitIdx: cutoff, readerCommitIdx: anchor.readerCommitIdx });
      const question = { scope: latest.activeTraceKey, ...anchor, via: [] };
      dispatch({ type: "start", question,
        generation: {}, activityOrigin: { sourceIdentity: latest.sourceIdentity, address: {
          invocationPath: [...path], runtimeStageId, beforeCommitIdx: cutoff, key, kind,
          variableId: variable.id, stageLabel: latest.stageActivity.identity.stageLabel,
        } } });
      latest.onStartInspector();
      latest.startAtWriter(question, walk, latest.safeIdx);
    } catch { /* A changed or unreadable address cannot start a new question. */ }
  }, [dispatch]);

  const latestWalk = useRef(traceWalk);
  useIsomorphicLayoutEffect(() => { latestWalk.current = traceWalk; }, [traceWalk]);
  const handleFollowIngredient = useCallback((ingredient: TraceIngredient) => {
    if (latestWalk.current !== traceWalk) return;
    const previous = saveCurrentQuestion();
    if (!previous || !tracing || !activeTraceScope.availability.ok || ingredient.writerCommitIdx === null ||
      !traceWalk?.stops.some(stop => stop.ingredients.some(recorded =>
        recorded.key === ingredient.key && recorded.writerRuntimeStageId === ingredient.writerRuntimeStageId &&
        recorded.writerCommitIdx === ingredient.writerCommitIdx))) return;
    const anchor = { key: ingredient.key, beforeCommitIdx: ingredient.writerCommitIdx + 1, writerRuntimeStageId: ingredient.writerRuntimeStageId ?? undefined };
    dispatch({ type: "follow", anchor, previous });
    jumpToAnchor(readWalk(anchor.key, {
      beforeCommitIdx: anchor.beforeCommitIdx,
    }));
  }, [tracing, activeTraceScope, traceWalk, dispatch, jumpToAnchor, saveCurrentQuestion, readWalk]);

  const handleInspectStageRead = useCallback((read: TraceStageRead) => {
    if (latestWalk.current !== traceWalk || !traceWalk?.stops.some(stop => stop.stageReads?.includes(read))) return;
    const previous = saveCurrentQuestion();
    const row = activeTraceScope.commitLog[read.beforeCommitIdx - 1];
    if (!previous || !row || ownDataField(row, "runtimeStageId") !== read.runtimeStageId ||
      !activeSnapshots.some(snapshot => snapshot.runtimeStageId === read.runtimeStageId)) return;
    const question: TraceQuestion = { scope: activeTraceKey, key: read.key, beforeCommitIdx: read.beforeCommitIdx,
      writerRuntimeStageId: read.runtimeStageId, stageReadCommitIdx: read.commitIdx, via: [] };
    pendingJump.current = { question, cursor: safeIdx };
    dispatch({ type: "enter", question, history: [...history, previous], activityOrigin: savedActivityOrigin, generation });
  }, [traceWalk, saveCurrentQuestion, activeTraceScope, activeSnapshots, activeTraceKey, safeIdx, dispatch, history, savedActivityOrigin, generation]);

  const inspectedStageRead = useMemo<InspectedStageRead | undefined>(() => {
    if (tracing?.stageReadCommitIdx === undefined || tracing.via.length) return undefined;
    const { key, writerRuntimeStageId, beforeCommitIdx, stageReadCommitIdx } = tracing;
    if (scoped.pending) return { key, value: undefined };
    const writer = traceWalk?.stops[0];
    if (!scoped.graph || !writer || writer.runtimeStageId !== writerRuntimeStageId || writer.commitIdx + 1 !== beforeCommitIdx) {
      return { key, value: undefined, gap: traceWalk?.missing?.gapMessages?.join(" ") || "The exact recorded writer address could not be verified." };
    }
    // The child rail hides its seed. The admitted read keeps the native commit index.
    const answer = scoped.graph.valueAt({ invocationPath: activeTraceScope.invocationPath, commitIdx: stageReadCommitIdx,
      runtimeStageId: writerRuntimeStageId, key });
    return "gap" in answer ? { key, value: undefined, gap: answer.gap.message } : { key, value: answer.value };
  }, [tracing, scoped.pending, scoped.graph, traceWalk, activeTraceScope.invocationPath]);

  const handleFollowHandoff = useCallback((source: SubflowHandoffSource) => {
    if (latestWalk.current !== traceWalk) return;
    const previous = saveCurrentQuestion();
    const parentStop = traceWalk?.stops.find(stop => stop.handoffSources?.includes(source));
    if (!previous || sourceChanged || !parentStop) return;
    if (source.writerRuntimeStageId !== undefined) {
      const target = resolveRecordedScope(source.invocationPath);
      if (!target || ownDataField(target.log[source.beforeCommitIdx - 1], "runtimeStageId") !== source.writerRuntimeStageId) return;
      const question: TraceQuestion = {
        scope: source.invocationPath.length ? JSON.stringify(source.invocationPath) : null,
        key: source.key, beforeCommitIdx: source.beforeCommitIdx, writerRuntimeStageId: source.writerRuntimeStageId, via: [],
        handoff: { parentPath: activeTraceScope.invocationPath, mountRuntimeStageId: source.mountRuntimeStageId,
          writtenKeys: parentStop.contributedKeys, beforeCommitIdx: parentStop.commitIdx + 1, source },
      };
      if (!handoffStillRecorded(question)) return;
      const moved = source.direction === "child" && openTraceSource
        ? openTraceSource(source.mountRuntimeStageId, source.invocationPath, source.writerRuntimeStageId)
        : restoreTraceQuestion?.(source.invocationPath, source.writerRuntimeStageId);
      if (!moved) return;
      dispatch({ type: "enter", history: [...history, previous], question, activityOrigin: savedActivityOrigin, generation });
      onStartInspector();
      return;
    }
    if (!openTraceSource) return;
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
    if (!walk.stops[0] || !handoffStillRecorded(question) || !openTraceSource(source.mountRuntimeStageId, source.invocationPath, walk.stops[0].runtimeStageId)) return;
    dispatch({ type: "enter", history: [...history, previous], question, activityOrigin: savedActivityOrigin, generation });
    onStartInspector();
  }, [sourceChanged, openTraceSource, traceWalk, runtimeSnapshot, dispatch, onStartInspector, saveCurrentQuestion, tracing, history,
    activeTraceScope, handoffStillRecorded, savedActivityOrigin, generation, resolveRecordedScope, restoreTraceQuestion]);

  const handleShowAllIngredients = useCallback(() => {
    if (!tracing || !activeTraceScope.availability.ok) return;
    dispatch({ type: "show-all" });
    jumpToAnchor(readWalk(tracing.key, {
      beforeCommitIdx: tracing.beforeCommitIdx,
      readerCommitIdx: tracing.readerCommitIdx,
    }));
  }, [tracing, activeTraceScope, dispatch, jumpToAnchor, readWalk]);
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
    handleFollowHandoff, handleInspectStageRead, inspectedStageRead,
    questionTrail, handleReturnToQuestion,
    handleExitTracing, handleForkPrompt, handleContinueTimeOrder,
  };
}
