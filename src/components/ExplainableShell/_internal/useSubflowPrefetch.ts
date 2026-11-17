import { useEffect, useRef } from 'react';
import type { StageSnapshot } from '../../../types';
import type { RecordingSource, ProgressiveRenderingOptions } from '../../../progressiveRendering';
/** One likely next exact visit at a time; optional work has no navigation effects. */
export function useSubflowPrefetch(source: RecordingSource | undefined, options: ProgressiveRenderingOptions,
  snapshots: StageSnapshot[], index: number, path: readonly string[]) {
  const pathKey = JSON.stringify(path);
  const latestSnapshots = useRef(snapshots);
  latestSnapshots.current = snapshots;
  useEffect(() => {
    if (!source?.canLoadSubflows || options.prefetch !== 'idle') return;
    const stage = latestSnapshots.current.slice(index).find(stage => stage.subflowId && stage.runtimeStageId &&
      !stage.subflowResult && !source.getSnapshot().scopes.has(source.getKey([...path, stage.runtimeStageId])));
    if (!stage?.runtimeStageId || !stage.subflowId) return;
    const controller = new AbortController();
    source.load({ invocationPath: [...path, stage.runtimeStageId], mountRuntimeStageId: stage.runtimeStageId,
      subflowId: stage.subflowId }, { signal: controller.signal, background: true }).catch(() => {});
    return () => controller.abort();
  }, [source, options.prefetch, index, pathKey]);
}
