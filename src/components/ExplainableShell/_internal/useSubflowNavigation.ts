import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { StageSnapshot, NarrativeEntry } from "../../../types";
import type { TraceGraph } from "../../FlowchartView/traceStructureRecorder";
import { buildSubflowBreadcrumb } from "../../FlowchartView/_internal/subflowDrill";
import { resolveSubflowLevel, type DrillDownEntry } from "./subflowRecord";
import { pathMountChain, type InvocationResolution } from "./subflowInvocation";
export interface VisitChoice {
  mountKey: string;
  choiceKey: string;
  selectedInvocations: ReadonlyMap<string, string>;
  visits: Extract<InvocationResolution, { kind: "ambiguous" }>["visits"];
}
interface NavigationOptions {
  snapshots: StageSnapshot[];
  sourceRunId: unknown;
  readsAvailable: boolean;
  exactResults: Record<string, unknown> | undefined;
  narrativeEntries: NarrativeEntry[] | undefined;
  traceGraph?: TraceGraph | null;
  snapshotIdx: number;
  setSnapshotIdxRaw: Dispatch<SetStateAction<number>>;
  activeTab: string;
  onScopeReset: () => void;
}
/** One owner of drill identity, visit choice and transient navigation feedback. */
export function useSubflowNavigation({
  snapshots,
  sourceRunId,
  readsAvailable,
  exactResults,
  narrativeEntries,
  traceGraph,
  snapshotIdx,
  setSnapshotIdxRaw,
  activeTab,
  onScopeReset,
}: NavigationOptions) {
  const [drillDownStack, setDrillDownStack] = useState<DrillDownEntry[]>([]);
  const [navigationNotice, setNavigationNotice] = useState("");
  const [visitChoice, setVisitChoice] = useState<VisitChoice | null>(null);
  const clearTransient = useCallback(() => {
    setNavigationNotice("");
    setVisitChoice(null);
  }, []);
  const setSnapshotIdx = useCallback(
    (value: SetStateAction<number>) => {
      clearTransient();
      setSnapshotIdxRaw(value);
    },
    [clearTransient, setSnapshotIdxRaw]
  );
  // Resolve the entire selected chain before rendering ANY panel. A new run
  // cannot leave old state/story values visible for an effect-sized frame.
  const selectedStack = useMemo(() => {
    if (drillDownStack.length === 0) return drillDownStack;
    const resolved: DrillDownEntry[] = [];
    let parent = snapshots;
    for (const previous of drillDownStack) {
      const found = resolveSubflowLevel({
        parent,
        key: previous.subflowId,
        parentPath: resolved.at(-1)?.traceScope.invocationPath ?? [],
        sourceRunId,
        readsAvailable,
        results: exactResults,
        narrative: narrativeEntries,
        requestedId: previous.mountRuntimeStageId,
      });
      if (found.kind !== "found") break;
      resolved.push(found.entry);
      parent = found.entry.snapshots;
    }
    return resolved;
  }, [
    drillDownStack,
    sourceRunId,
    snapshots,
    readsAvailable,
    exactResults,
    narrativeEntries,
  ]);
  const priorRun = useRef(sourceRunId);
  const sourceChanged =
    priorRun.current !== sourceRunId &&
    (typeof sourceRunId === "string" || drillDownStack.length > 0);
  useEffect(() => {
    if (priorRun.current === sourceRunId) return;
    priorRun.current = sourceRunId;
    if (!drillDownStack.length && typeof sourceRunId !== "string") return;
    onScopeReset();
    clearTransient();
    const moved = selectedStack.length !== drillDownStack.length;
    setDrillDownStack(selectedStack);
    if (moved) {
      const departed = drillDownStack[selectedStack.length];
      setSnapshotIdxRaw(departed?.parentSnapshotIdx ?? 0);
      setNavigationNotice(
        selectedStack.length
          ? `New run: returned to ${
              selectedStack.at(-1)!.label
            }; the selected visit is not in this run.`
          : "New run: returned to the root; the selected visit is not in this run."
      );
    }
  }, [
    sourceRunId,
    selectedStack,
    drillDownStack,
    onScopeReset,
    clearTransient,
    setSnapshotIdxRaw,
  ]);
  // A chooser describes the prior cursor/tab, never the next location.
  useEffect(() => {
    clearTransient();
  }, [activeTab, clearTransient]);
  const buildDrillStack = useCallback(
    (
      mountKey: string,
      selectedInvocations: ReadonlyMap<string, string> = new Map()
    ) => {
      const graphChain = traceGraph
        ? buildSubflowBreadcrumb(traceGraph, mountKey)
            .slice(1)
            .flatMap((entry) => (entry.subflowId ? [entry.subflowId] : []))
        : [];
      // A graph missing this mount supplies no ancestry. Exact path segments
      // replace the old suffix/label guesses, including custom renderers.
      const keys =
        graphChain.length > 1 ? graphChain : pathMountChain(mountKey);
      const stack: DrillDownEntry[] = [];
      let parent = snapshots;
      for (const [depth, key] of keys.entries()) {
        const existing = selectedStack[depth];
        const requestedId = selectedInvocations.get(key);
        const parentPath = stack.at(-1)?.traceScope.invocationPath ?? [];
        const existingPath = existing?.traceScope.invocationPath;
        const sameParent =
          existingPath !== undefined &&
          existingPath.length === parentPath.length + 1 &&
          parentPath.every((part, index) => existingPath[index] === part);
        if (
          existing?.subflowId === key &&
          existing.sourceRunId === sourceRunId &&
          sameParent &&
          (!requestedId || requestedId === existing.mountRuntimeStageId)
        ) {
          stack.push(existing);
          parent = existing.snapshots;
          continue;
        }
        const cursorIdx = sameParent
          ? existing?.parentSnapshotIdx
          : depth === selectedStack.length
          ? snapshotIdx
          : undefined;
        const found = resolveSubflowLevel({
          parent,
          key,
          cursorId:
            cursorIdx === undefined
              ? undefined
              : parent[cursorIdx]?.runtimeStageId,
          parentPath,
          sourceRunId,
          readsAvailable,
          results: exactResults,
          narrative: narrativeEntries,
          requestedId,
        });
        if (found.kind !== "found")
          return { ...found, mountKey, choiceKey: key, selectedInvocations };
        stack.push(found.entry);
        parent = found.entry.snapshots;
      }
      return { kind: "found" as const, stack };
    },
    [
      traceGraph,
      selectedStack,
      snapshots,
      snapshotIdx,
      sourceRunId,
      readsAvailable,
      exactResults,
      narrativeEntries,
    ]
  );
  const applyDrill = useCallback(
    (
      mountKey: string,
      selectedInvocations: ReadonlyMap<string, string> = new Map()
    ) => {
      const resolution = buildDrillStack(mountKey, selectedInvocations);
      if (resolution.kind === "ambiguous") {
        setVisitChoice({
          mountKey,
          visits: resolution.visits,
          choiceKey: resolution.choiceKey,
          selectedInvocations: resolution.selectedInvocations,
        });
        return;
      }
      if (resolution.kind !== "found") {
        setVisitChoice(null);
        setNavigationNotice(
          resolution.kind === "conversion-failed"
            ? "The recorded invocation could not be drawn. Trace evidence remains unknown."
            : "That recorded subflow invocation is unavailable."
        );
        return;
      }
      onScopeReset();
      setVisitChoice(null);
      setNavigationNotice("");
      setDrillDownStack(resolution.stack);
      setSnapshotIdxRaw(0);
    },
    [buildDrillStack, onScopeReset, setSnapshotIdxRaw]
  );
  const handleDrillDown = applyDrill;
  const handleBreadcrumbNavigate = useCallback(
    (level: number) => {
      onScopeReset();
      setVisitChoice(null);
      const popped = level === 0 ? selectedStack[0] : selectedStack[level];
      if (popped) setSnapshotIdxRaw(popped.parentSnapshotIdx);
      setNavigationNotice("");
      setDrillDownStack(level === 0 ? [] : selectedStack.slice(0, level));
    },
    [selectedStack, onScopeReset, setSnapshotIdxRaw]
  );
  // TracedFlow sends scope change then node click in one event. Remember it
  // synchronously so the second callback never projects the same child twice.
  const chartHandledMount = useRef<string | null>(null);
  const handleChartSubflowChange = useCallback(
    (mountKey: string | null) => {
      chartHandledMount.current = mountKey;
      queueMicrotask(() => {
        if (chartHandledMount.current === mountKey)
          chartHandledMount.current = null;
      });
      if (mountKey === null) {
        handleBreadcrumbNavigate(0);
        return;
      }
      const at = selectedStack.findIndex(
        (entry) => entry.subflowId === mountKey
      );
      if (at >= 0) {
        if (at < selectedStack.length - 1) handleBreadcrumbNavigate(at + 1);
        return;
      }
      applyDrill(mountKey);
    },
    [selectedStack, handleBreadcrumbNavigate, applyDrill]
  );
  const activeSnapshots = selectedStack.at(-1)?.snapshots ?? snapshots;
  const handleNodeClick = useCallback(
    (indexOrId: number | string) => {
      if (typeof indexOrId === "number") {
        setSnapshotIdx(indexOrId);
        return;
      }
      if (chartHandledMount.current === indexOrId) return;
      const knownMount =
        activeSnapshots.some(
          (stage) =>
            (stage.subflowId || stage.subflowResult) &&
            (stage.subflowId === indexOrId ||
              stage.runtimeStageId === indexOrId ||
              stage.runtimeStageId?.split("#")[0] === indexOrId)
        ) ||
        traceGraph?.nodes.some(
          (node) => node.id === indexOrId && node.data?.isSubflow === true
        ) ||
        Object.keys(exactResults ?? {}).some(
          (id) =>
            (id === indexOrId || id.split("#")[0] === indexOrId) &&
            exactResults![id] !== null &&
            typeof exactResults![id] === "object"
        );
      if (knownMount) {
        const exactId =
          exactResults &&
          Object.prototype.hasOwnProperty.call(exactResults, indexOrId)
            ? indexOrId
            : undefined;
        const path = exactId ? exactId.split("#")[0] : indexOrId;
        applyDrill(path, exactId ? new Map([[path, exactId]]) : undefined);
        return;
      }
      clearTransient();
      const rows = activeSnapshots.map((stage, index) => ({ stage, index }));
      let matches = rows.filter(
        ({ stage }) =>
          stage.runtimeStageId === indexOrId ||
          stage.runtimeStageId?.split("#")[0] === indexOrId
      );
      if (!matches.length)
        matches = rows.filter(
          ({ stage }) =>
            stage.stageLabel === indexOrId || stage.stageName === indexOrId
        );
      const selected =
        matches.filter(({ index }) => index <= snapshotIdx).at(-1) ??
        matches[0];
      if (selected) setSnapshotIdxRaw(selected.index);
    },
    [
      activeSnapshots,
      traceGraph,
      exactResults,
      applyDrill,
      clearTransient,
      setSnapshotIdx,
      snapshotIdx,
      setSnapshotIdxRaw,
    ]
  );
  const resetRoot = useCallback(() => {
    onScopeReset();
    clearTransient();
    setDrillDownStack([]);
  }, [onScopeReset, clearTransient]);
  return {
    sourceChanged,
    selectedStack,
    navigationNotice,
    visitChoice,
    clearTransient,
    setSnapshotIdx,
    resetRoot,
    handleDrillDown,
    handleBreadcrumbNavigate,
    handleChartSubflowChange,
    handleNodeClick,
    applyDrill,
  };
}
