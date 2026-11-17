import { useMemo, useSyncExternalStore } from "react";
import type { ExplainableShellProps } from "../ShellProps";
import { narrativeRecorderFromSnapshot } from "../../../adapters/fromRuntimeSnapshot";
import { overlayFromSnapshot } from "../../../adapters/overlayFromSnapshot";
import { projectRuntimeSnapshot } from "../../../model/recording";
import type { StageSnapshot } from "../../../types";
import { exactSubflowResults } from "./subflowRecord";
import { ownDataField, isPlainRecord } from "./safeRecordRead";
import { useRunCompanions } from "./useRunCompanions";
const noopSubscribe = () => () => {};
const emptySnapshot = () => null;
export function useShellRecording(props: ExplainableShellProps) {
  const source = props.source;
  const sourceState = useSyncExternalStore(source?.subscribe ?? noopSubscribe, source?.getSnapshot ?? emptySnapshot, source?.getSnapshot ?? emptySnapshot);
  const originalSnapshot = source?.rootSnapshot ?? props.runtimeSnapshot;
  const runtimeSnapshot = sourceState?.snapshot ?? props.runtimeSnapshot;
  const snapshotsProp = source ? undefined : props.snapshots;
  const resultDataProp = source ? undefined : props.resultData;
  const runtimeOverlayProp = source ? undefined : props.runtimeOverlay;
  const narrativeEntriesProp = sourceState ? (sourceState.narrativeEntries.length ? sourceState.narrativeEntries : undefined) : props.narrativeEntries;
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

  // Root projection is cached against the original recording. Child publication
  // attaches exact results without walking and indexing the root execution again.
  const projectionSnapshot = source ? originalSnapshot : runtimeSnapshot;
  const rootNarrative = useMemo(() => source?.getSnapshot().narrativeEntries, [source]);
  const projectionNarrative = source ? rootNarrative : narrativeEntries;
  const projectionResults = useMemo(() => exactSubflowResults(ownDataField(projectionSnapshot, "subflowResults")), [projectionSnapshot]);
  // Convert runtimeSnapshot → visualization snapshots (zero-boilerplate mode).
  // A snapshot we cannot read is REMEMBERED, not swallowed: the empty state
  // below reports it instead of rendering full chrome with nothing in it.
  const derivedFromRuntime = useMemo(() => {
    if (!projectionSnapshot) return null;
    try {
      // Consume only known own fields. Spreading a stored source would
      // evaluate unrelated accessors that no renderer ever asked to read.
      const sharedState = ownDataField(projectionSnapshot, "sharedState");
      if (!isPlainRecord(sharedState)) throw new Error("sharedState is not a plain object");
      const input = {
        sharedState,
        executionTree: ownDataField(projectionSnapshot,"executionTree"),
        commitLog: ownDataField(projectionSnapshot,"commitLog"),
        subflowResults: projectionResults,
        recorders: ownDataField(projectionSnapshot,"recorders"),
      };
      const projection = projectRuntimeSnapshot(input, projectionNarrative);
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
  }, [projectionSnapshot, projectionNarrative, projectionResults]);

  // Use derived data when runtimeSnapshot is provided, otherwise use explicit props
  const snapshots = useMemo(() => {
    const base = companions.values.snapshots ?? derivedFromRuntime?.snapshots ?? [];
    if (!source) return base;
    return base.map(stage => {
      const result = stage.runtimeStageId ? ownDataField(exactResults, stage.runtimeStageId) : undefined;
      return result && result !== stage.subflowResult ? { ...stage, subflowResult: result } : stage;
    });
  }, [source, companions.values.snapshots, derivedFromRuntime, exactResults]);
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

  return { sourceState, originalSnapshot, runtimeSnapshot, snapshotNarrative, companions, companionNarrativeMissing, narrativeEntries,
    exactResults, derivedFromRuntime, snapshots, resultData, runtimeOverlay,
    traceGraph: source?.rootGraph ?? props.traceGraph };
}
