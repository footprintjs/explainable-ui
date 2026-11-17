import { useState, type Dispatch, type SetStateAction } from 'react';
import type { StageSnapshot } from '../../types';
import type { RecordingSource } from '../../progressiveRendering';
/** A parallel branch may grow earlier in tree preorder. Pin the selected visit,
 * using the existing cursor state; explicit user moves and scope changes win. */
export function useLiveSourceCursor(source: RecordingSource | undefined, scope: string | null,
  snapshots: StageSnapshot[], index: number, setIndex: Dispatch<SetStateAction<number>>): number {
  const [prior, setPrior] = useState<{ source?: RecordingSource; scope: string | null; snapshots: StageSnapshot[]; index: number; id?: string } | null>(null);
  let next = snapshots.length ? Math.max(0, Math.min(index, snapshots.length - 1)) : 0;
  if (source && prior?.source === source && prior.scope === scope && prior.index === index && prior.snapshots !== snapshots && prior.id) {
    const anchored = snapshots.findIndex(stage => stage.runtimeStageId === prior.id);
    if (anchored >= 0) next = anchored;
  }
  if (source && (prior?.source !== source || prior.scope !== scope || prior.snapshots !== snapshots || prior.index !== next))
    setPrior({ source, scope, snapshots, index: next, id: snapshots[next]?.runtimeStageId });
  else if (!source && prior) setPrior(null);
  // Render-phase adjustment prevents committing one frame with another stage's
  // values. Only this component's existing cursor is updated.
  if (source && next !== index) setIndex(next);
  return next;
}
