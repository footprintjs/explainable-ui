import { useEffect, useMemo, useState } from "react";
import type { ScopedRecordGraph } from "../../scopedBacktrack/graph";
import { loadScopedRecordGraph } from "../../scopedBacktrack/load";
import { buildScopedWalk, scopedWalkStatus } from "../../trace/scopedWalk";
import { ownDataField } from "../../trace/safeRecordRead";
import type { TraceWalk } from "../../trace/traceWalk";

export interface WalkQuestion {
  readonly local: TraceWalk;
  readonly beforeCommitIdx?: number;
  readonly readerCommitIdx?: number;
  readonly writerRuntimeStageId?: string;
  readonly stageReadCommitIdx?: number;
}

/** A flat recording without scalar sources or coverage keeps its synchronous rail. */
export function needsScopedWalk(snapshot: unknown, local: TraceWalk) {
  return ownDataField(snapshot, "logAddress") !== undefined && Boolean(
    ownDataField(snapshot, "readSources") || ownDataField(snapshot, "capture") || ownDataField(snapshot, "fanoutCollections") ||
    local.scope?.invocationPath.length || Object.keys(local.scope?.mountLabels ?? {}).length);
}

/** Resolve the current question and its return addresses against the same immutable revision. */
export function useScopedWalks<Q>(snapshot: unknown, questions: ReadonlyMap<Q, WalkQuestion>) {
  const addressed = [...questions.values()].some(({ local }) => needsScopedWalk(snapshot, local));
  const getGraph = useMemo(() => {
    let pending: Promise<ScopedRecordGraph | undefined> | undefined;
    return () => pending ??= loadScopedRecordGraph(snapshot);
  }, [snapshot]);
  const completed = useMemo(() => new Map<string, TraceWalk>(), [snapshot]);
  const [ready, setReady] = useState<{ questions: typeof questions; walks: Map<Q, TraceWalk>; graph?: ScopedRecordGraph }>();
  useEffect(() => {
    if (!addressed || !questions.size) return;
    const controller = new AbortController();
    async function load() {
      const graph = await getGraph().catch(() => undefined);
      if (controller.signal.aborted) return;
      const walks = new Map<Q, TraceWalk>();
      for (const [question, { local, beforeCommitIdx, readerCommitIdx, writerRuntimeStageId, stageReadCommitIdx }] of questions) {
        if (controller.signal.aborted) return;
        const address = JSON.stringify([local.scope?.invocationPath, local.key, beforeCommitIdx, readerCommitIdx, writerRuntimeStageId, stageReadCommitIdx]);
        const cached = completed.get(address);
        if (cached) { walks.set(question, cached); continue; }
        try {
          const walk = graph ? await buildScopedWalk(graph, snapshot, local, beforeCommitIdx, readerCommitIdx, writerRuntimeStageId, controller.signal, stageReadCommitIdx) : local;
          if (controller.signal.aborted) return;
          walks.set(question, walk);
          completed.set(address, walk);
          if (completed.size > 32) completed.delete(completed.keys().next().value!);
        } catch {
          walks.set(question, scopedWalkStatus(local, "Recorded evidence could not be read. Source collection unknown."));
        }
      }
      if (!controller.signal.aborted) setReady({ questions, walks, graph });
    }
    void load();
    return () => controller.abort();
  }, [addressed, questions, getGraph, snapshot, completed]);
  return useMemo(() => {
    if (addressed && ready?.questions === questions) return { walks: ready.walks, graph: ready.graph, pending: false };
    const walks = new Map<Q, TraceWalk>();
    for (const [question, { local, beforeCommitIdx, readerCommitIdx }] of questions) {
      walks.set(question, addressed ? scopedWalkStatus(local, "Reading recorded sources…", readerCommitIdx === undefined ? beforeCommitIdx : undefined) : local);
    }
    return { walks, pending: addressed && questions.size > 0 };
  }, [addressed, questions, ready]);
}
